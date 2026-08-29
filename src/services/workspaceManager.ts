/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FileOperationLogEntry,
  FileOperationType,
  ProjectFile,
  ProjectWorkspace,
  SupportedLanguage,
  UnifiedPatch,
  WorkspaceCheckpoint,
  WorkspaceMode,
  WorkspacePermissionState,
  WorkspaceSnapshot,
} from '../types';
import { detectLanguage } from '../engine/detector';

// Maximum supported single-file size for real-time analysis (1 MB)
const MAX_ANALYSIS_FILE_SIZE_BYTES = 1024 * 1024;

// Sensitive & Protected file regex patterns
const PROTECTED_FILE_PATTERNS = [
  /^\.env(?:\..+)?$/i,
  /(?:^|\/)credentials(?:\.json|\.ya?ml)?$/i,
  /(?:^|\/)secrets?(?:\.json|\.ya?ml)?$/i,
  /(?:^|\/)id_rsa(?:\.pub)?$/i,
  /(?:^|\/).*\.pem$/i,
  /(?:^|\/).*\.key$/i,
  /(?:^|\/)prod(?:uction)?\.(?:json|ya?ml|env)$/i,
  /(?:^|\/)\.git\//i,
];

// Sensitive content detector for log redaction
const SENSITIVE_TOKEN_REGEX = /(?:api[_-]?key|secret|token|password|auth_token)\s*[:=]\s*['"]([^'"]+)['"]/gi;

/**
 * Lightweight deterministic content hasher (FNV-1a 32-bit hex)
 */
export function calculateContentHash(content: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < content.length; i++) {
    hash ^= content.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * WorkspaceManager
 * Centralized, authoritative abstraction for real and virtual project files.
 * Provides safe path boundaries, atomic patch execution, rollback checkpoints,
 * external change detection, and audit logging.
 */
export class WorkspaceManager {
  private static instance: WorkspaceManager | null = null;

  private currentWorkspace: ProjectWorkspace;
  private filesMap: Map<string, ProjectFile> = new Map();
  private checkpoints: Map<string, WorkspaceCheckpoint> = new Map();
  private operationLogs: FileOperationLogEntry[] = [];
  private realDirHandle: any = null; // FileSystemDirectoryHandle if available
  private listeners: Set<(workspace: ProjectWorkspace) => void> = new Set();

  private constructor() {
    this.currentWorkspace = {
      id: `proj-virt-${Date.now()}`,
      name: 'Default Project',
      rootPath: '/',
      language: 'typescript',
      files: [],
      workspaceMode: 'VIRTUAL',
      permissionState: 'CONNECTED',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  public static getInstance(): WorkspaceManager {
    if (!WorkspaceManager.instance) {
      WorkspaceManager.instance = new WorkspaceManager();
    }
    return WorkspaceManager.instance;
  }

  // ---------------------------------------------------------------------------
  // WORKSPACE LIFECYCLE
  // ---------------------------------------------------------------------------

  /**
   * Initializes or loads a virtual project with a set of default files.
   */
  public openVirtualProject(
    name: string,
    initialFiles: Array<{ path: string; content: string; language?: SupportedLanguage }>
  ): ProjectWorkspace {
    this.realDirHandle = null;
    this.filesMap.clear();
    this.checkpoints.clear();

    const files: ProjectFile[] = [];
    const now = Date.now();

    for (const f of initialFiles) {
      const norm = this.normalizePath(f.path);
      const lang = f.language || detectLanguage(f.content, norm).language;
      const isProt = this.isProtectedFile(norm);
      const size = new Blob([f.content]).size;
      const isTooLarge = size > MAX_ANALYSIS_FILE_SIZE_BYTES;

      const pFile: ProjectFile = {
        path: norm,
        relativePath: norm.startsWith('/') ? norm.slice(1) : norm,
        language: lang,
        size,
        content: isTooLarge ? '' : f.content,
        hash: calculateContentHash(f.content),
        modified: now,
        status: 'UNCHANGED',
        isProtected: isProt,
        isTooLarge,
      };

      this.filesMap.set(norm, pFile);
      files.push(pFile);
    }

    const primaryLang = files[0]?.language || 'typescript';

    this.currentWorkspace = {
      id: `proj-virt-${now}`,
      name: name || 'Virtual Project',
      rootPath: '/',
      language: primaryLang,
      files,
      workspaceMode: 'VIRTUAL',
      permissionState: 'CONNECTED',
      createdAt: now,
      updatedAt: now,
    };

    this.logOperation('CREATE', '/', 'SUCCESS', 'Virtual project initialized');
    this.notifyListeners();
    return this.currentWorkspace;
  }

  /**
   * Connects to a real user-selected local filesystem directory via File System Access API.
   * Gracefully falls back to Virtual mode if unsupported or permission denied.
   */
  public async openRealDirectory(): Promise<{
    success: boolean;
    workspace?: ProjectWorkspace;
    error?: string;
  }> {
    if (typeof window === 'undefined' || !(window as any).showDirectoryPicker) {
      return {
        success: false,
        error: 'File System Access API is not supported in this browser. Falling back to Virtual Workspace.',
      };
    }

    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
      });

      if (!dirHandle) {
        return { success: false, error: 'Directory selection was cancelled.' };
      }

      this.realDirHandle = dirHandle;
      this.filesMap.clear();
      this.checkpoints.clear();

      const files: ProjectFile[] = [];
      const now = Date.now();

      // Read entries recursively up to max depth 4
      await this.readDirectoryRecursive(dirHandle, '', files, 0);

      const primaryLang = files.find((f) => !f.isProtected)?.language || 'typescript';

      this.currentWorkspace = {
        id: `proj-real-${now}`,
        name: dirHandle.name || 'Local Workspace',
        rootPath: dirHandle.name ? `/${dirHandle.name}` : '/',
        language: primaryLang,
        files,
        workspaceMode: 'REAL',
        permissionState: 'READ_WRITE',
        createdAt: now,
        updatedAt: now,
      };

      this.logOperation('CREATE', this.currentWorkspace.rootPath, 'SUCCESS', 'Real project workspace connected');
      this.notifyListeners();
      return { success: true, workspace: this.currentWorkspace };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'User cancelled folder selection.' };
      }
      return {
        success: false,
        error: `Filesystem access error: ${err.message || 'Permission denied'}`,
      };
    }
  }

  private async readDirectoryRecursive(
    dirHandle: any,
    currentPath: string,
    outFiles: ProjectFile[],
    depth: number
  ): Promise<void> {
    if (depth > 4) return; // Guard against extreme recursion

    for await (const [name, handle] of dirHandle.entries()) {
      if (name.startsWith('.git') || name === 'node_modules' || name === 'dist' || name === 'build') {
        continue;
      }

      const relPath = currentPath ? `${currentPath}/${name}` : name;
      const fullPath = `/${relPath}`;

      if (handle.kind === 'file') {
        try {
          const file = await handle.getFile();
          const size = file.size;
          const isTooLarge = size > MAX_ANALYSIS_FILE_SIZE_BYTES;
          const isProt = this.isProtectedFile(fullPath);

          let content = '';
          if (!isTooLarge && size < 500 * 1024) {
            content = await file.text();
          }

          const lang = detectLanguage(content, name).language;
          const pFile: ProjectFile = {
            path: fullPath,
            relativePath: relPath,
            language: lang,
            size,
            content,
            hash: calculateContentHash(content),
            modified: file.lastModified || Date.now(),
            status: 'UNCHANGED',
            isProtected: isProt,
            isTooLarge,
          };

          this.filesMap.set(fullPath, pFile);
          outFiles.push(pFile);
        } catch {
          // Continue on individual file read failure
        }
      } else if (handle.kind === 'directory') {
        await this.readDirectoryRecursive(handle, relPath, outFiles, depth + 1);
      }
    }
  }

  /**
   * Closes active project and resets state.
   */
  public closeProject(): void {
    this.realDirHandle = null;
    this.filesMap.clear();
    this.checkpoints.clear();
    this.currentWorkspace = {
      id: `proj-closed-${Date.now()}`,
      name: 'No Project Open',
      rootPath: '/',
      language: 'typescript',
      files: [],
      workspaceMode: 'VIRTUAL',
      permissionState: 'NOT_CONNECTED',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.notifyListeners();
  }

  public getWorkspace(): ProjectWorkspace {
    this.currentWorkspace.files = Array.from(this.filesMap.values());
    this.currentWorkspace.updatedAt = Date.now();
    return this.currentWorkspace;
  }

  public listFiles(): ProjectFile[] {
    return Array.from(this.filesMap.values());
  }

  // ---------------------------------------------------------------------------
  // SAFE PATH VALIDATION & BOUNDARY PROTECTION
  // ---------------------------------------------------------------------------

  public normalizePath(rawPath: string): string {
    if (!rawPath) return '/';
    let clean = rawPath.replace(/\\/g, '/').trim();
    if (!clean.startsWith('/')) {
      clean = `/${clean}`;
    }
    // Remove consecutive slashes and relative current dots
    clean = clean.replace(/\/+/g, '/').replace(/\/\.\//g, '/');
    return clean;
  }

  /**
   * Validates path boundaries, rejecting traversal attacks (`../../secret.txt`).
   */
  public validatePath(rawPath: string): { isValid: boolean; normalizedPath: string; error?: string } {
    if (!rawPath || typeof rawPath !== 'string') {
      return { isValid: false, normalizedPath: '', error: 'File path cannot be empty.' };
    }

    if (rawPath.includes('..') || rawPath.includes('~') || rawPath.includes('\0')) {
      return {
        isValid: false,
        normalizedPath: '',
        error: `Path traversal violation blocked: '${rawPath}' attempts to escape project workspace.`,
      };
    }

    const normalized = this.normalizePath(rawPath);
    return { isValid: true, normalizedPath: normalized };
  }

  public isProtectedFile(filePath: string): boolean {
    const norm = this.normalizePath(filePath);
    return PROTECTED_FILE_PATTERNS.some((p) => p.test(norm));
  }

  // ---------------------------------------------------------------------------
  // FILE READING & METADATA
  // ---------------------------------------------------------------------------

  public async readFile(path: string): Promise<{
    content: string;
    metadata: ProjectFile | null;
    isTooLarge?: boolean;
    error?: string;
  }> {
    const val = this.validatePath(path);
    if (!val.isValid) {
      this.logOperation('READ', path, 'BLOCKED', val.error);
      return { content: '', metadata: null, error: val.error };
    }

    const norm = val.normalizedPath;
    let existing = this.filesMap.get(norm);

    if (this.currentWorkspace.workspaceMode === 'REAL' && this.realDirHandle) {
      try {
        const fileHandle = await this.getFileHandleByPath(norm, false);
        if (!fileHandle) {
          return { content: '', metadata: null, error: `File '${norm}' not found on filesystem.` };
        }
        const fileObj = await fileHandle.getFile();
        if (fileObj.size > MAX_ANALYSIS_FILE_SIZE_BYTES) {
          return {
            content: '',
            metadata: existing || null,
            isTooLarge: true,
            error: `FILE_TOO_LARGE: File size exceeds ${MAX_ANALYSIS_FILE_SIZE_BYTES / 1024 / 1024}MB limit.`,
          };
        }
        const content = await fileObj.text();
        const hash = calculateContentHash(content);

        const updated: ProjectFile = {
          path: norm,
          relativePath: norm.startsWith('/') ? norm.slice(1) : norm,
          language: detectLanguage(content, norm).language,
          size: fileObj.size,
          content,
          hash,
          modified: fileObj.lastModified,
          status: existing ? existing.status : 'UNCHANGED',
          isProtected: this.isProtectedFile(norm),
          isTooLarge: false,
        };
        this.filesMap.set(norm, updated);
        this.logOperation('READ', norm, 'SUCCESS');
        return { content, metadata: updated };
      } catch (err: any) {
        this.logOperation('READ', norm, 'FAILED', err.message);
        return { content: '', metadata: null, error: `Failed reading file from filesystem: ${err.message}` };
      }
    }

    // Virtual Workspace reading
    if (!existing) {
      return { content: '', metadata: null, error: `File '${norm}' not found in virtual workspace.` };
    }

    this.logOperation('READ', norm, 'SUCCESS');
    return { content: existing.content, metadata: existing, isTooLarge: existing.isTooLarge };
  }

  public exists(path: string): boolean {
    const val = this.validatePath(path);
    if (!val.isValid) return false;
    return this.filesMap.has(val.normalizedPath);
  }

  public getFileMetadata(path: string): ProjectFile | null {
    const val = this.validatePath(path);
    if (!val.isValid) return null;
    return this.filesMap.get(val.normalizedPath) || null;
  }

  // ---------------------------------------------------------------------------
  // SAFE FILE MODIFICATION & CREATION
  // ---------------------------------------------------------------------------

  /**
   * Writes content to a file with optional expectedHash verification to prevent
   * overwriting concurrent external changes.
   */
  public async writeFile(
    path: string,
    content: string,
    expectedHash?: string
  ): Promise<{ success: boolean; file?: ProjectFile; error?: string }> {
    const val = this.validatePath(path);
    if (!val.isValid) {
      this.logOperation('WRITE', path, 'BLOCKED', val.error);
      return { success: false, error: val.error };
    }

    const norm = val.normalizedPath;

    if (this.isProtectedFile(norm)) {
      const err = `Protected file policy: '${norm}' is a credential or configuration file and cannot be modified.`;
      this.logOperation('WRITE', norm, 'BLOCKED', err);
      return { success: false, error: err };
    }

    const existing = this.filesMap.get(norm);

    // External change detection
    if (existing && expectedHash && existing.hash !== expectedHash) {
      const err = `FILE_CHANGED_EXTERNALLY: File '${norm}' has been modified since fix generation (Hash mismatch: expected ${expectedHash}, current ${existing.hash}).`;
      this.logOperation('WRITE', norm, 'BLOCKED', err);
      return { success: false, error: err };
    }

    const newHash = calculateContentHash(content);
    const size = new Blob([content]).size;
    const now = Date.now();

    // Write to real filesystem if connected
    if (this.currentWorkspace.workspaceMode === 'REAL' && this.realDirHandle) {
      try {
        const fileHandle = await this.getFileHandleByPath(norm, true);
        if (!fileHandle) {
          throw new Error('Unable to acquire writable file handle.');
        }
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
      } catch (err: any) {
        this.logOperation('WRITE', norm, 'FAILED', err.message);
        return { success: false, error: `Filesystem write error: ${err.message}` };
      }
    }

    const updatedFile: ProjectFile = {
      path: norm,
      relativePath: norm.startsWith('/') ? norm.slice(1) : norm,
      language: existing?.language || detectLanguage(content, norm).language,
      size,
      content,
      hash: newHash,
      modified: now,
      status: existing ? 'MODIFIED' : 'ADDED',
      isProtected: false,
      isTooLarge: false,
    };

    this.filesMap.set(norm, updatedFile);
    this.logOperation('WRITE', norm, 'SUCCESS');
    this.notifyListeners();

    return { success: true, file: updatedFile };
  }

  public async createFile(
    path: string,
    initialContent: string = ''
  ): Promise<{ success: boolean; file?: ProjectFile; error?: string }> {
    const val = this.validatePath(path);
    if (!val.isValid) {
      this.logOperation('CREATE', path, 'BLOCKED', val.error);
      return { success: false, error: val.error };
    }

    const norm = val.normalizedPath;
    if (this.filesMap.has(norm)) {
      return { success: false, error: `File '${norm}' already exists in workspace.` };
    }

    return this.writeFile(norm, initialContent);
  }

  public async deleteFile(path: string): Promise<{ success: boolean; error?: string }> {
    const val = this.validatePath(path);
    if (!val.isValid) return { success: false, error: val.error };
    const norm = val.normalizedPath;

    if (this.isProtectedFile(norm)) {
      const err = `Protected file policy: '${norm}' cannot be deleted.`;
      this.logOperation('DELETE', norm, 'BLOCKED', err);
      return { success: false, error: err };
    }

    if (!this.filesMap.has(norm)) {
      return { success: false, error: `File '${norm}' does not exist.` };
    }

    // In real mode, remove from folder handle
    if (this.currentWorkspace.workspaceMode === 'REAL' && this.realDirHandle) {
      try {
        const segments = norm.split('/').filter(Boolean);
        const fileName = segments.pop()!;
        let parentDir = this.realDirHandle;
        for (const seg of segments) {
          parentDir = await parentDir.getDirectoryHandle(seg);
        }
        await parentDir.removeEntry(fileName);
      } catch (err: any) {
        this.logOperation('DELETE', norm, 'FAILED', err.message);
        return { success: false, error: `Filesystem delete error: ${err.message}` };
      }
    }

    this.filesMap.delete(norm);
    this.logOperation('DELETE', norm, 'SUCCESS');
    this.notifyListeners();
    return { success: true };
  }

  public async renameFile(
    oldPath: string,
    newPath: string
  ): Promise<{ success: boolean; file?: ProjectFile; error?: string }> {
    const vOld = this.validatePath(oldPath);
    const vNew = this.validatePath(newPath);
    if (!vOld.isValid) return { success: false, error: vOld.error };
    if (!vNew.isValid) return { success: false, error: vNew.error };

    const readRes = await this.readFile(vOld.normalizedPath);
    if (readRes.error || !readRes.metadata) {
      return { success: false, error: readRes.error || 'Source file not found' };
    }

    const writeRes = await this.writeFile(vNew.normalizedPath, readRes.content);
    if (!writeRes.success) {
      return writeRes;
    }

    await this.deleteFile(vOld.normalizedPath);
    this.logOperation('RENAME', `${vOld.normalizedPath} -> ${vNew.normalizedPath}`, 'SUCCESS');
    return writeRes;
  }

  public async moveFile(
    sourcePath: string,
    destPath: string
  ): Promise<{ success: boolean; file?: ProjectFile; error?: string }> {
    return this.renameFile(sourcePath, destPath);
  }

  // ---------------------------------------------------------------------------
  // ATOMIC MULTI-FILE PATCHING
  // ---------------------------------------------------------------------------

  /**
   * Applies an AI-generated UnifiedPatch atomically across multiple target files.
   * If any file fails validation or write, automatically rolls back to checkpoint.
   */
  public async applyAtomicMultiFilePatch(
    patch: UnifiedPatch,
    checkpointDescription: string = 'Pre-Fix Checkpoint'
  ): Promise<{
    success: boolean;
    checkpointId: string;
    modifiedFiles: string[];
    error?: string;
  }> {
    const targetFilePaths = patch.files.map((f) => this.normalizePath(f.filePath));

    // 1. Checkpoint all target files before modification
    const checkpoint = this.createCheckpoint(targetFilePaths, checkpointDescription, patch.id);

    // 2. Validate all files before applying any changes
    for (const pFile of patch.files) {
      const norm = this.normalizePath(pFile.filePath);
      const val = this.validatePath(norm);
      if (!val.isValid) {
        return {
          success: false,
          checkpointId: checkpoint.id,
          modifiedFiles: [],
          error: `Patch blocked: Invalid target path '${norm}': ${val.error}`,
        };
      }

      if (this.isProtectedFile(norm)) {
        return {
          success: false,
          checkpointId: checkpoint.id,
          modifiedFiles: [],
          error: `Patch blocked: Target file '${norm}' is protected from automatic modification.`,
        };
      }
    }

    // 3. Apply changes sequentially, tracking applied files
    const appliedFiles: string[] = [];

    try {
      for (const pFile of patch.files) {
        const norm = this.normalizePath(pFile.filePath);
        const res = await this.writeFile(norm, pFile.newContent);
        if (!res.success) {
          throw new Error(`Failed modifying '${norm}': ${res.error}`);
        }
        appliedFiles.push(norm);
      }

      this.logOperation(
        'PATCH_APPLIED',
        `${appliedFiles.length} files`,
        'SUCCESS',
        `Patch ${patch.id} applied atomically`,
        patch.id,
        checkpoint.id
      );

      return {
        success: true,
        checkpointId: checkpoint.id,
        modifiedFiles: appliedFiles,
      };
    } catch (err: any) {
      // Partial failure -> Immediate automatic atomic rollback
      await this.restoreCheckpoint(checkpoint.id);
      this.logOperation(
        'ROLLBACK',
        `${appliedFiles.length} files`,
        'SUCCESS',
        `Atomic rollback due to error: ${err.message}`,
        patch.id,
        checkpoint.id
      );

      return {
        success: false,
        checkpointId: checkpoint.id,
        modifiedFiles: [],
        error: `Atomic patch failure: ${err.message}. Workspace rolled back safely.`,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // CHECKPOINT & ROLLBACK
  // ---------------------------------------------------------------------------

  public createCheckpoint(
    affectedFiles: string[],
    description: string,
    patchId?: string
  ): WorkspaceCheckpoint {
    const id = `chk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const beforeHashes: Record<string, string> = {};
    const beforeContents: Record<string, string> = {};

    for (const raw of affectedFiles) {
      const norm = this.normalizePath(raw);
      const file = this.filesMap.get(norm);
      if (file) {
        beforeHashes[norm] = file.hash;
        beforeContents[norm] = file.content;
      }
    }

    const checkpoint: WorkspaceCheckpoint = {
      id,
      timestamp: Date.now(),
      projectId: this.currentWorkspace.id,
      affectedFiles: affectedFiles.map((f) => this.normalizePath(f)),
      beforeHashes,
      beforeContents,
      patchId,
      description,
    };

    this.checkpoints.set(id, checkpoint);

    // Keep checkpoint buffer bounded (max 25)
    if (this.checkpoints.size > 25) {
      const oldestKey = this.checkpoints.keys().next().value;
      if (oldestKey) this.checkpoints.delete(oldestKey);
    }

    return checkpoint;
  }

  public async restoreCheckpoint(checkpointId: string): Promise<{
    success: boolean;
    restoredFiles: string[];
    error?: string;
  }> {
    const chk = this.checkpoints.get(checkpointId);
    if (!chk) {
      return { success: false, restoredFiles: [], error: `Checkpoint '${checkpointId}' not found.` };
    }

    const restored: string[] = [];

    for (const filePath of chk.affectedFiles) {
      const originalContent = chk.beforeContents[filePath];
      if (originalContent !== undefined) {
        await this.writeFile(filePath, originalContent);
        restored.push(filePath);
      }
    }

    this.logOperation('ROLLBACK', `${restored.length} files`, 'SUCCESS', chk.description, chk.patchId, chk.id);
    return { success: true, restoredFiles: restored };
  }

  public getCheckpoints(): WorkspaceCheckpoint[] {
    return Array.from(this.checkpoints.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  // ---------------------------------------------------------------------------
  // SNAPSHOTS & CHANGED FILES
  // ---------------------------------------------------------------------------

  public createSnapshot(): WorkspaceSnapshot {
    const files: Record<string, { content: string; hash: string; size: number; language: SupportedLanguage }> = {};
    for (const [path, f] of this.filesMap.entries()) {
      files[path] = {
        content: f.content,
        hash: f.hash,
        size: f.size,
        language: f.language,
      };
    }
    return {
      id: `snap-${Date.now()}`,
      timestamp: Date.now(),
      files,
    };
  }

  public async restoreSnapshot(snapshot: WorkspaceSnapshot): Promise<boolean> {
    for (const [path, data] of Object.entries(snapshot.files)) {
      await this.writeFile(path, data.content);
    }
    return true;
  }

  public getChangedFiles(): ProjectFile[] {
    return Array.from(this.filesMap.values()).filter((f) => f.status !== 'UNCHANGED');
  }

  // ---------------------------------------------------------------------------
  // AUDIT LOGGING
  // ---------------------------------------------------------------------------

  private logOperation(
    operation: FileOperationType,
    filePath: string,
    result: 'SUCCESS' | 'BLOCKED' | 'FAILED',
    reason?: string,
    fixId?: string,
    checkpointId?: string
  ): void {
    // Redact sensitive patterns in reasons
    const cleanReason = reason ? reason.replace(SENSITIVE_TOKEN_REGEX, 'token: [REDACTED]') : undefined;

    const entry: FileOperationLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      operation,
      filePath,
      result,
      reason: cleanReason,
      fixId,
      checkpointId,
      workspaceMode: this.currentWorkspace.workspaceMode,
    };

    this.operationLogs.unshift(entry);
    if (this.operationLogs.length > 100) this.operationLogs.pop();
  }

  public getOperationLogs(): FileOperationLogEntry[] {
    return [...this.operationLogs];
  }

  // ---------------------------------------------------------------------------
  // SUBSCRIPTION & HELPERS
  // ---------------------------------------------------------------------------

  public subscribe(listener: (workspace: ProjectWorkspace) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const ws = this.getWorkspace();
    this.listeners.forEach((fn) => {
      try {
        fn(ws);
      } catch {
        // Ignore listener errors
      }
    });
  }

  private async getFileHandleByPath(fullPath: string, create: boolean = false): Promise<any> {
    if (!this.realDirHandle) return null;
    const segments = fullPath.split('/').filter(Boolean);
    if (segments.length === 0) return null;

    const fileName = segments.pop()!;
    let currentDir = this.realDirHandle;

    for (const seg of segments) {
      currentDir = await currentDir.getDirectoryHandle(seg, { create });
    }

    return await currentDir.getFileHandle(fileName, { create });
  }
}
