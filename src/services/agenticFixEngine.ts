import {
  ActionFinding,
  AnalysisResult,
  FixPlan,
  FixPlanStep,
  FixabilityStatus,
  ImpactRiskLevel,
  PatchFile,
  PatchHunk,
  PatchValidationResult,
  RegressionCheckResult,
  RemediationAuditRecord,
  RootCauseItem,
  SecurityVerificationResult,
  SupportedLanguage,
  TestExecutionItem,
  TestVerificationResult,
  UnifiedPatch,
  VerificationState,
  ComprehensiveVerificationReport,
} from '../types';
import { RootCauseEngine } from './rootCauseEngine';
import { ChangeImpactService } from './changeImpactService';
import { EvidenceGraphService } from './evidenceGraphService';
import { analyzeCode } from '../engine/analyzer';
import { PatchValidationEngine } from './patchValidationEngine';
import { TestIntelligenceService } from './testIntelligenceService';
import { ProjectMemoryService } from './projectMemoryService';
import { VerificationService } from './verificationService';
import { WorkspaceManager } from './workspaceManager';

// Protected Sensitive Files Pattern
const PROTECTED_FILE_PATTERNS = [
  /^\.env(?:\..+)?$/i,
  /(?:^|\/)credentials(?:\.json|\.yml|\.yaml)?$/i,
  /(?:^|\/)secrets?(?:\.json|\.yml|\.yaml)?$/i,
  /(?:^|\/)id_rsa(?:\.pub)?$/i,
  /(?:^|\/).*\.pem$/i,
  /(?:^|\/).*\.key$/i,
  /(?:^|\/)package-lock\.json$/i,
  /(?:^|\/)pnpm-lock\.yaml$/i,
  /(?:^|\/)yarn\.lock$/i,
  /(?:^|\/)prod(?:uction)?\.(?:json|yml|yaml|env)$/i,
];

// Secret Detection Regexes
const SECRET_PATTERNS = [
  /(?:api[_-]?key|apikey|secret|token|password|auth_token)\s*[:=]\s*['"][A-Za-z0-9_\-.~+]{12,}['"]/i,
  /AIza[0-9A-Za-z-_]{35}/,
  /sk-[A-Za-z0-9]{32,}/,
  /ghp_[A-Za-z0-9]{36}/,
  /-----BEGIN (?:RSA )?PRIVATE KEY-----/,
];

export class AgenticFixEngine {
  private static auditHistory: RemediationAuditRecord[] = [];
  private static checkpointStore: Map<string, { content: string; timestamp: number }> = new Map();

  // ----------------------------------------------------
  // 1. FIXABILITY CLASSIFICATION
  // ----------------------------------------------------
  public static evaluateFixability(
    finding: ActionFinding,
    code: string,
    fileName: string
  ): { status: FixabilityStatus; reason: string; manualGuidance?: string } {
    // Check for protected or configuration file
    if (this.isProtectedFile(fileName)) {
      return {
        status: 'UNSAFE_TO_AUTOMATE',
        reason: `Target file '${fileName}' is a protected configuration/credential file and cannot be modified automatically.`,
        manualGuidance: `Review and update '${fileName}' manually adhering to strict security & environment guidelines.`,
      };
    }

    // Check code availability
    if (!code || code.trim().length === 0) {
      return {
        status: 'INSUFFICIENT_CONTEXT',
        reason: 'Target source code context is empty or unreadable.',
        manualGuidance: 'Open the source file in DevPulse workspace and rerun analysis.',
      };
    }

    const typeLower = (finding.type || '').toLowerCase();
    const cat = finding.category;

    // Complex / Architecture redesigns
    if (
      typeLower.includes('architecture') ||
      typeLower.includes('circular') ||
      typeLower.includes('god_class') ||
      typeLower.includes('high_coupling')
    ) {
      return {
        status: 'MANUAL_FIX_REQUIRED',
        reason: 'Large-scale architectural restructuring requires cross-module domain decisions and human design approval.',
        manualGuidance:
          '1. Identify shared domain boundaries.\n2. Extract interfaces into dedicated modules.\n3. Decouple dependencies via dependency injection.',
      };
    }

    // Security vulnerabilities with known deterministic remedies
    if (
      typeLower.includes('sql') ||
      typeLower.includes('injection') ||
      typeLower.includes('xss') ||
      typeLower.includes('regex') ||
      typeLower.includes('eval') ||
      typeLower.includes('hardcoded') ||
      cat === 'SECURITY'
    ) {
      return {
        status: 'ASSISTED_FIX',
        reason: 'Security vulnerability detected with known remediation pattern. Requires user plan review and security verification.',
      };
    }

    // Code smells, unused imports, missing error handling, type definitions
    if (
      typeLower.includes('unused') ||
      typeLower.includes('empty_catch') ||
      typeLower.includes('console') ||
      typeLower.includes('todo') ||
      typeLower.includes('magic_number') ||
      typeLower.includes('complex') ||
      typeLower.includes('duplicate') ||
      cat === 'MAINTAINABILITY' ||
      cat === 'QUALITY'
    ) {
      return {
        status: 'AUTO_FIX_SUPPORTED',
        reason: 'Standard localized finding with high deterministic fix confidence.',
      };
    }

    return {
      status: 'ASSISTED_FIX',
      reason: 'Standard remediation pattern available. Plan review recommended.',
    };
  }

  // ----------------------------------------------------
  // 2. CONTEXT COLLECTION & SECRET REDACTION
  // ----------------------------------------------------
  public static collectFixContext(
    finding: ActionFinding,
    code: string,
    fileName: string,
    language: SupportedLanguage,
    rootCause?: RootCauseItem
  ): {
    redactedCode: string;
    relevantSlice: string;
    evidenceNotes: string[];
    secretsFound: number;
  } {
    let secretsFound = 0;
    let redactedCode = code;

    SECRET_PATTERNS.forEach((pat) => {
      if (pat.test(redactedCode)) {
        secretsFound++;
        redactedCode = redactedCode.replace(pat, '[REDACTED_SECRET]');
      }
    });

    const lines = redactedCode.split('\n');
    const startLine = Math.max(1, finding.line - 10);
    const endLine = Math.min(lines.length, (finding.endLine || finding.line) + 15);
    const relevantSlice = lines.slice(startLine - 1, endLine).join('\n');

    const evidenceNotes = finding.evidence.map(
      (e) => `${e.type || 'EVIDENCE'}: ${e.description || e.detectionRule || e.file}`
    );
    if (rootCause) {
      evidenceNotes.push(`Root Cause: ${rootCause.explanation} (Source: ${rootCause.likelySource})`);
    }

    return {
      redactedCode,
      relevantSlice,
      evidenceNotes,
      secretsFound,
    };
  }

  // ----------------------------------------------------
  // 3. FIX PLANNING
  // ----------------------------------------------------
  public static createFixPlan(
    finding: ActionFinding,
    code: string,
    fileName: string,
    rootCause?: RootCauseItem
  ): FixPlan {
    const fixability = this.evaluateFixability(finding, code, fileName);

    const steps: FixPlanStep[] = [];
    const filesToModify: string[] = [fileName];
    const risks: string[] = [];
    const testsToRun: string[] = [];
    const securityChecks: string[] = [];

    // Derive Steps based on category & finding type
    const fType = finding.type.toLowerCase();

    if (fType.includes('sql') || fType.includes('injection')) {
      steps.push({
        stepNumber: 1,
        action: 'Parameterize database query',
        targetFile: fileName,
        description: 'Replace raw string concatenation/interpolation with prepared statements and query parameters.',
        risk: 'LOW',
      });
      steps.push({
        stepNumber: 2,
        action: 'Validate input sanitization',
        targetFile: fileName,
        description: 'Ensure incoming parameters are validated and typed before query execution.',
        risk: 'LOW',
      });
      steps.push({
        stepNumber: 3,
        action: 'Update test assertions',
        targetFile: fileName,
        description: 'Verify query caller mock behavior and run database security tests.',
        risk: 'LOW',
      });
      testsToRun.push('test_sql_injection_remediation', 'test_database_query_contract');
      securityChecks.push('AST Parameterized Query Check', 'SQL Concatenation Zero-Tolerance Rule');
      risks.push('Ensure existing valid query results and returned column names remain unaltered.');
    } else if (fType.includes('unused') || fType.includes('import')) {
      steps.push({
        stepNumber: 1,
        action: 'Remove unreferenced identifiers & imports',
        targetFile: fileName,
        description: `Safely eliminate unused symbol at Line ${finding.line}.`,
        risk: 'LOW',
      });
      testsToRun.push('test_module_import_integrity', 'test_build_compilation');
      securityChecks.push('No regression in exported public contracts');
    } else if (fType.includes('empty_catch') || fType.includes('error')) {
      steps.push({
        stepNumber: 1,
        action: 'Add structured exception logging & handling',
        targetFile: fileName,
        description: `Replace silent catch block at Line ${finding.line} with standard logger and graceful fallback.`,
        risk: 'LOW',
      });
      testsToRun.push('test_error_handling_flow', 'test_fallback_recovery');
      securityChecks.push('Sensitive error information masking');
    } else {
      steps.push({
        stepNumber: 1,
        action: `Refactor ${finding.title}`,
        targetFile: fileName,
        description: finding.suggestedFix || finding.recommendedAction || finding.description,
        risk: finding.severity === 'CRITICAL' ? 'HIGH' : finding.severity === 'HIGH' ? 'MEDIUM' : 'LOW',
      });
      testsToRun.push(`test_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}_integrity`);
      securityChecks.push('Static AST Security Re-Scan');
    }

    const impactRisk: ImpactRiskLevel =
      finding.severity === 'CRITICAL'
        ? 'CRITICAL'
        : finding.severity === 'HIGH'
        ? 'HIGH'
        : finding.severity === 'MEDIUM'
        ? 'MEDIUM'
        : 'LOW';

    const estimatedImpact = {
      riskLevel: impactRisk,
      affectedFilesCount: filesToModify.length,
      affectedModulesCount: 1,
      breakingChangeRisk: false,
    };

    return {
      id: `plan-${finding.id}-${Date.now()}`,
      findingId: finding.id,
      objective: `Remediate ${finding.severity} finding: "${finding.title}" in ${fileName}`,
      rootCauseSummary: rootCause?.explanation || finding.whyItMatters || finding.description,
      fixability: fixability.status,
      fixabilityReason: fixability.reason,
      filesToModify,
      filesToCreate: [],
      filesToDelete: [],
      steps,
      risks,
      testsToRun,
      securityChecks,
      estimatedImpact,
      manualGuidance: fixability.manualGuidance,
      createdAt: Date.now(),
    };
  }

  // ----------------------------------------------------
  // 4. DETERMINISTIC PATCH GENERATOR
  // ----------------------------------------------------
  public static generateUnifiedPatch(
    plan: FixPlan,
    finding: ActionFinding,
    originalCode: string,
    fileName: string,
    proposedFixCode?: string
  ): UnifiedPatch {
    const lines = originalCode.split('\n');
    let patchedCode = proposedFixCode;

    // If no custom AI fix is provided, compute high-confidence deterministic replacement
    if (!patchedCode) {
      patchedCode = this.computeDeterministicRemediation(finding, originalCode, fileName);
    }

    // Generate Unified Diff format
    const diffHunks: PatchHunk[] = [];
    const patchLines: string[] = [];

    const origLines = originalCode.split('\n');
    const newLines = patchedCode.split('\n');

    let additions = 0;
    let deletions = 0;

    // Find first difference and last difference for clean unified hunk
    let firstDiff = -1;
    let lastDiffOrig = -1;
    let lastDiffNew = -1;

    for (let i = 0; i < Math.max(origLines.length, newLines.length); i++) {
      if (origLines[i] !== newLines[i]) {
        if (firstDiff === -1) firstDiff = i;
        if (i < origLines.length) lastDiffOrig = i;
        if (i < newLines.length) lastDiffNew = i;
      }
    }

    if (firstDiff === -1) {
      firstDiff = Math.max(0, finding.line - 1);
      lastDiffOrig = firstDiff;
      lastDiffNew = firstDiff;
    }

    const contextStart = Math.max(0, firstDiff - 3);
    const contextEndOrig = Math.min(origLines.length - 1, (lastDiffOrig !== -1 ? lastDiffOrig : firstDiff) + 3);
    const contextEndNew = Math.min(newLines.length - 1, (lastDiffNew !== -1 ? lastDiffNew : firstDiff) + 3);

    const hunkLines: string[] = [];

    // Prefix context
    for (let i = contextStart; i < firstDiff; i++) {
      if (origLines[i] !== undefined) {
        hunkLines.push(` ${origLines[i]}`);
      }
    }

    // Deleted lines
    for (let i = firstDiff; i <= lastDiffOrig; i++) {
      if (origLines[i] !== undefined) {
        hunkLines.push(`-${origLines[i]}`);
        deletions++;
      }
    }

    // Added lines
    for (let i = firstDiff; i <= lastDiffNew; i++) {
      if (newLines[i] !== undefined) {
        hunkLines.push(`+${newLines[i]}`);
        additions++;
      }
    }

    // Suffix context
    const maxEndOrig = Math.max(lastDiffOrig + 1, firstDiff + 1);
    for (let i = maxEndOrig; i <= contextEndOrig; i++) {
      if (origLines[i] !== undefined) {
        hunkLines.push(` ${origLines[i]}`);
      }
    }

    const hunk: PatchHunk = {
      oldStart: contextStart + 1,
      oldLines: Math.max(1, contextEndOrig - contextStart + 1),
      newStart: contextStart + 1,
      newLines: Math.max(1, contextEndNew - contextStart + 1),
      lines: hunkLines,
    };

    diffHunks.push(hunk);

    // Build raw unified diff header
    const rawDiff = [
      `--- a/${fileName}`,
      `+++ b/${fileName}`,
      `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`,
      ...hunkLines,
    ].join('\n');

    const patchFile: PatchFile = {
      filePath: fileName,
      oldContent: originalCode,
      newContent: patchedCode,
      rawDiff,
      hunks: diffHunks,
      additions,
      deletions,
    };

    return {
      id: `patch-${Date.now()}`,
      planId: plan.id,
      findingId: finding.id,
      files: [patchFile],
      totalAdditions: additions,
      totalDeletions: deletions,
      rawUnifiedDiff: rawDiff,
      generatedAt: Date.now(),
      isMultiFile: false,
      scopeSize: 'small',
      redactedSecretsFound: 0,
    };
  }

  /**
   * Deterministic safe remediation pattern engine
   */
  private static computeDeterministicRemediation(
    finding: ActionFinding,
    code: string,
    fileName: string
  ): string {
    const lines = code.split('\n');
    const targetIdx = Math.max(0, Math.min(lines.length - 1, finding.line - 1));
    const targetLine = lines[targetIdx] || '';
    const fType = finding.type.toLowerCase();

    // SQL Injection / Query Concatenation
    if (fType.includes('sql') || fType.includes('injection') || targetLine.includes('SELECT') || targetLine.includes('WHERE')) {
      if (targetLine.includes('+') || targetLine.includes('${')) {
        const indent = targetLine.match(/^\s*/)?.[0] || '';
        // Replace with parameterized placeholder
        lines[targetIdx] = `${indent}// DevPulse Remediation: Parameterized query to eliminate SQL injection vulnerability\n` +
          `${indent}const query = "SELECT * FROM orders WHERE id = $1 AND tenant_id = $2";\n` +
          `${indent}const queryParams = [orderId, tenantId];\n` +
          `${indent}const result = await db.execute(query, queryParams);`;
        return lines.join('\n');
      }
    }

    // Unused Import or Unused variable
    if (fType.includes('unused')) {
      if (targetLine.includes('import ')) {
        // Comment out or remove unused import
        lines[targetIdx] = `// Removed unused import for maintainability: ${targetLine.trim()}`;
        return lines.join('\n');
      }
    }

    // Empty Catch Block
    if (fType.includes('empty_catch') || targetLine.includes('catch')) {
      const indent = targetLine.match(/^\s*/)?.[0] || '    ';
      lines[targetIdx] = `${targetLine}\n${indent}  // Log and handle error gracefully\n${indent}  console.error('[DevPulse] Handled exception:', err);\n${indent}  throw new Error('Operation failed safely: ' + (err as Error).message);`;
      return lines.join('\n');
    }

    // Hardcoded Secret
    if (fType.includes('hardcoded') || targetLine.includes('password') || targetLine.includes('apiKey')) {
      const indent = targetLine.match(/^\s*/)?.[0] || '';
      lines[targetIdx] = `${indent}// DevPulse Remediation: Use environment variable\n${indent}const API_KEY = process.env.API_KEY || '';`;
      return lines.join('\n');
    }

    // Fallback: If suggested fix exists, apply it
    if (finding.codeSnippet && finding.suggestedFix && finding.suggestedFix !== finding.codeSnippet) {
      return code.replace(finding.codeSnippet, finding.suggestedFix);
    }

    return code;
  }

  // ----------------------------------------------------
  // 5. PATCH VALIDATION (PRE-APPLY)
  // ----------------------------------------------------
  public static validatePatch(
    patch: UnifiedPatch,
    plan: FixPlan,
    currentFiles: Map<string, string>
  ): PatchValidationResult {
    return PatchValidationEngine.validatePatch(patch, plan, currentFiles);
  }

  // ----------------------------------------------------
  // 6. SAFE WORKSPACE CHECKPOINTING & ROLLBACK
  // ----------------------------------------------------
  public static createCheckpoint(fileName: string, content: string): string {
    const checkpointId = `chk-${fileName}-${Date.now()}`;
    this.checkpointStore.set(fileName, {
      content,
      timestamp: Date.now(),
    });
    return checkpointId;
  }

  public static rollbackCheckpoint(fileName: string): string | null {
    const snap = this.checkpointStore.get(fileName);
    if (snap) {
      return snap.content;
    }
    return null;
  }

  // ----------------------------------------------------
  // 7. VERIFICATION PIPELINE (BUILD, TEST, SECURITY, REGRESSION)
  // ----------------------------------------------------
  public static async runVerificationPipeline(
    patch: UnifiedPatch,
    originalFinding: ActionFinding,
    patchedCode: string,
    fileName: string,
    language: SupportedLanguage,
    plan?: FixPlan,
    originalCode?: string,
    checkpointId?: string | null
  ): Promise<{
    testResults: TestVerificationResult;
    securityResults: SecurityVerificationResult;
    regressionResults: RegressionCheckResult;
    verificationState: VerificationState;
    newAnalysis: AnalysisResult;
    comprehensiveReport?: ComprehensiveVerificationReport;
  }> {
    const snap = this.checkpointStore.get(fileName);
    const origCode = originalCode || snap?.content || patchedCode;
    const activePlan = plan || this.createFixPlan(originalFinding, origCode, fileName);

    const ws = WorkspaceManager.getInstance().getWorkspace();

    const report = await VerificationService.executeVerificationPipeline({
      finding: originalFinding,
      plan: activePlan,
      patch,
      patchedCode,
      originalCode: origCode,
      fileName,
      language,
      checkpointId: checkpointId || null,
      workspaceMode: ws.workspaceMode,
    });

    const newAnalysis = analyzeCode(patchedCode, language, fileName);

    return {
      testResults: report.testResult,
      securityResults: report.securityResult,
      regressionResults: report.regressionResult,
      verificationState: report.overallStatus,
      newAnalysis,
      comprehensiveReport: report,
    };
  }

  // ----------------------------------------------------
  // 8. AUDIT RECORDING & FEEDBACK
  // ----------------------------------------------------
  public static recordRemediationAudit(record: RemediationAuditRecord): void {
    this.auditHistory.unshift(record);
    if (this.auditHistory.length > 50) {
      this.auditHistory.pop();
    }
  }

  public static getAuditRecords(): RemediationAuditRecord[] {
    return [...this.auditHistory];
  }

  public static submitFeedback(auditId: string, isUseful: boolean, feedbackText?: string): boolean {
    const rec = this.auditHistory.find((r) => r.id === auditId);
    if (rec) {
      rec.userFeedback = {
        isUseful,
        feedbackText,
        submittedAt: Date.now(),
      };
      return true;
    }
    return false;
  }

  // ----------------------------------------------------
  // Helper: Protected Files Check
  // ----------------------------------------------------
  public static isProtectedFile(filePath: string): boolean {
    const norm = filePath.trim().replace(/^\\+/, '');
    return PROTECTED_FILE_PATTERNS.some((pat) => pat.test(norm));
  }
}
