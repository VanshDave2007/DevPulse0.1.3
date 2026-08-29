/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActionFinding,
  ArchitectureDecisionRecord,
  FalsePositiveReason,
  FindingStatus,
  ProjectMemory,
  ProjectMemoryConfidence,
  ProjectMemoryFilter,
  ProjectMemoryScope,
  ProjectMemorySource,
  ProjectMemoryStatus,
  ProjectMemoryType,
} from '../types';

const STORAGE_KEY_PROJECT_MEMORY = 'devpulse_project_memory_store';

// Sensitive patterns for secret redaction
const SENSITIVE_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/gi,
  /ghp_[a-zA-Z0-9]{20,}/gi,
  /bearer\s+[a-zA-Z0-9_\-\.]{20,}/gi,
  /password\s*[:=]\s*['"][^'"]+['"]/gi,
  /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
  /private[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
  /-----BEGIN\s+PRIVATE\s+KEY-----[\s\S]*?-----END\s+PRIVATE\s+KEY-----/gi,
];

// Initial deterministic project context seeds
const SEED_PROJECT_MEMORIES: ProjectMemory[] = [
  {
    projectId: 'default-project',
    memoryId: 'mem-rule-repo-pattern',
    type: 'PROJECT_RULE',
    title: 'Repository Data Access Pattern',
    content: 'All database queries and mutations must flow through dedicated Repository/Service layers rather than direct SQL in presentation controllers.',
    source: 'USER_CREATED',
    confidence: 'CONFIRMED',
    status: 'APPROVED',
    scope: 'PROJECT',
    isExplicit: true,
    kind: 'EXPLICIT',
    createdAt: Date.now() - 86400000 * 14,
    updatedAt: Date.now() - 86400000 * 14,
    createdBy: 'Lead Architect',
    tags: ['architecture', 'database', 'clean-code'],
    decision: 'Centralize all query logic in data repositories.',
    rationale: 'Prevents SQL injection vulnerabilities and isolates data schema migrations.',
  },
  {
    projectId: 'default-project',
    memoryId: 'mem-adr-auth-centralization',
    type: 'ARCHITECTURE_DECISION',
    title: 'Centralized Token-Based Authentication',
    content: 'Authentication & permission claims verification are strictly encapsulated inside AuthService. Direct header parsing in routes is prohibited.',
    source: 'DOCUMENTATION',
    confidence: 'CONFIRMED',
    status: 'APPROVED',
    scope: 'MODULE',
    isExplicit: true,
    kind: 'EXPLICIT',
    relatedFiles: ['authService.ts', 'auth.ts', 'security.ts'],
    relatedSymbols: ['AuthService', 'verifyToken', 'validateSession'],
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 10,
    decision: 'All token validation and session decoding handled exclusively by AuthService.',
    rationale: 'Guarantees uniform session revocation and audit logging.',
    affectedComponents: ['AuthService', 'UserController', 'ApiGateway'],
    tags: ['adr', 'security', 'auth'],
  },
  {
    projectId: 'default-project',
    memoryId: 'mem-test-vitest-bdd',
    type: 'TESTING_CONVENTION',
    title: 'Vitest / Jest BDD Testing Standard',
    content: 'Unit and integration tests must utilize standard BDD describe/it blocks with isolated mocks. Mocking third-party SDKs must use vi.mock / jest.mock.',
    source: 'ANALYSIS',
    confidence: 'CONFIRMED',
    status: 'APPROVED',
    scope: 'PROJECT',
    isExplicit: true,
    kind: 'EXPLICIT',
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 7,
    tags: ['testing', 'vitest', 'bdd'],
  },
  {
    projectId: 'default-project',
    memoryId: 'mem-debt-legacy-billing',
    type: 'ACCEPTED_TECHNICAL_DEBT',
    title: 'High Coupling in Legacy Payment Gateway Adapter',
    content: 'Legacy payment integration contains elevated cyclomatic complexity. Migration to unified Stripe API adapter is scheduled for Q4.',
    source: 'DEVELOPER_FEEDBACK',
    confidence: 'CONFIRMED',
    status: 'APPROVED',
    scope: 'FILE',
    isExplicit: true,
    kind: 'EXPLICIT',
    relatedFiles: ['billingAdapter.ts', 'paymentGateway.ts', 'billing.ts'],
    relatedSymbols: ['processLegacyPayment', 'calculateBillingCycle'],
    reviewDate: '2027-01-15',
    owner: 'Payments Team',
    acceptedBy: 'Lead Architect',
    impact: 'Elevated cognitive complexity in payment adapter; isolated to billing module.',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
    developerExplanation: 'Refactor deferred pending core payments gateway version upgrade.',
    tags: ['tech-debt', 'payments', 'review-scheduled'],
  },
  {
    projectId: 'default-project',
    memoryId: 'mem-fp-safe-query',
    type: 'FALSE_POSITIVE',
    title: 'False Positive: SQL Injection in SafeQueryBuilder',
    content: 'SafeQueryBuilder internally binds query arguments via prepared statements. The analyzer regex falsely flagged the parameterized string template.',
    source: 'DEVELOPER_FEEDBACK',
    confidence: 'CONFIRMED',
    status: 'APPROVED',
    scope: 'SYMBOL',
    isExplicit: true,
    kind: 'EXPLICIT',
    relatedFiles: ['queryBuilder.ts', 'database.ts'],
    relatedSymbols: ['SafeQueryBuilder', 'executeSafeQuery'],
    reason: 'ANALYZER_MISTAKE',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
    tags: ['false-positive', 'database', 'security'],
  },
  {
    projectId: 'default-project',
    memoryId: 'mem-prop-service-validation',
    type: 'CODING_CONVENTION',
    title: 'Controllers Delegate Input Validation to DTO Validators',
    content: 'Observed pattern: API endpoint controllers parse incoming payloads using class-validator DTOs before invoking business services.',
    source: 'AI_SUGGESTION',
    confidence: 'SUGGESTED',
    status: 'PROPOSED',
    scope: 'PROJECT',
    isExplicit: false,
    kind: 'INFERRED',
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
    tags: ['convention', 'validation', 'proposed'],
  },
];

export interface ProjectMemoryStats {
  total: number;
  approved: number;
  proposed: number;
  rejected: number;
  requiresReview: number;
  byType: {
    rules: number;
    architecture: number;
    techDebt: number;
    falsePositives: number;
    acceptedRisks: number;
    securityDecisions: number;
    testingRules: number;
    conventions: number;
  };
}

/**
 * ProjectMemoryService
 * Centralized durable repository context layer.
 * Retains project rules, architecture decisions, accepted technical debt,
 * false positives, coding conventions, and developer feedback with complete approval workflow.
 */
export class ProjectMemoryService {
  private static inMemoryCache: ProjectMemory[] | null = null;

  // ----------------------------------------------------
  // 1. DATA ACCESS & PERSISTENCE
  // ----------------------------------------------------
  public static getProjectMemory(projectId: string = 'default-project'): ProjectMemory[] {
    if (this.inMemoryCache !== null) {
      return this.inMemoryCache;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROJECT_MEMORY);
      if (raw) {
        const parsed: ProjectMemory[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.inMemoryCache = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read project memory from local storage:', e);
    }

    // Seed defaults
    this.inMemoryCache = [...SEED_PROJECT_MEMORIES];
    this.persist(this.inMemoryCache);
    return this.inMemoryCache;
  }

  private static persist(memories: ProjectMemory[]): void {
    this.inMemoryCache = memories;
    try {
      localStorage.setItem(STORAGE_KEY_PROJECT_MEMORY, JSON.stringify(memories));
    } catch (e) {
      console.warn('Could not persist project memory:', e);
    }
  }

  // ----------------------------------------------------
  // 2. REDACT SENSITIVE DATA
  // ----------------------------------------------------
  public static redactSecrets(text: string): string {
    if (!text) return '';
    let sanitized = text;
    SENSITIVE_PATTERNS.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, '[REDACTED_SECRET]');
    });
    return sanitized;
  }

  // ----------------------------------------------------
  // 3. ADD / UPDATE / REMOVE MEMORY
  // ----------------------------------------------------
  public static addMemory(entry: Partial<ProjectMemory>): ProjectMemory {
    const memories = this.getProjectMemory(entry.projectId || 'default-project');
    const now = Date.now();

    const isExplicit = entry.isExplicit !== undefined
      ? entry.isExplicit
      : (entry.source === 'USER' || entry.source === 'USER_CREATED' || entry.source === 'DEVELOPER_FEEDBACK' || entry.source === 'PROJECT_SETTINGS');

    const status: ProjectMemoryStatus = entry.status || (isExplicit ? 'APPROVED' : 'PROPOSED');

    const newMemory: ProjectMemory = {
      projectId: entry.projectId || 'default-project',
      memoryId: entry.memoryId || `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: entry.type || 'PROJECT_RULE',
      title: this.redactSecrets(entry.title || 'Untitled Project Memory'),
      content: this.redactSecrets(entry.content || ''),
      source: entry.source || 'USER_CREATED',
      confidence: entry.confidence || (isExplicit ? 'CONFIRMED' : 'SUGGESTED'),
      status,
      scope: entry.scope || 'PROJECT',
      isExplicit,
      kind: isExplicit ? 'EXPLICIT' : 'INFERRED',
      createdAt: now,
      updatedAt: now,
      createdBy: entry.createdBy || 'Developer',
      acceptedBy: entry.acceptedBy,
      impact: entry.impact ? this.redactSecrets(entry.impact) : undefined,
      relatedFiles: entry.relatedFiles || [],
      relatedSymbols: entry.relatedSymbols || [],
      relatedFindings: entry.relatedFindings || [],
      tags: entry.tags || [],
      ruleId: entry.ruleId,
      location: entry.location,
      reason: entry.reason,
      developerExplanation: entry.developerExplanation ? this.redactSecrets(entry.developerExplanation) : undefined,
      reviewDate: entry.reviewDate,
      owner: entry.owner,
      decision: entry.decision ? this.redactSecrets(entry.decision) : undefined,
      rationale: entry.rationale ? this.redactSecrets(entry.rationale) : undefined,
      alternatives: entry.alternatives,
      affectedComponents: entry.affectedComponents,
      findingSnapshot: entry.findingSnapshot,
      history: [
        {
          action: 'CREATED',
          timestamp: now,
          actor: entry.createdBy || 'Developer',
          details: `Created as ${entry.type || 'PROJECT_RULE'} (${status})`,
        },
      ],
      metadata: entry.metadata,
    };

    const updated = [newMemory, ...memories];
    this.persist(updated);
    return newMemory;
  }

  public static updateMemory(memoryId: string, updates: Partial<ProjectMemory>, actor: string = 'Developer'): ProjectMemory | null {
    const memories = this.getProjectMemory();
    const idx = memories.findIndex((m) => m.memoryId === memoryId || m.id === memoryId);
    if (idx === -1) return null;

    const current = memories[idx];
    const now = Date.now();

    const historyItem = {
      action: updates.status && updates.status !== current.status ? `STATUS_CHANGE_TO_${updates.status}` : 'UPDATED',
      timestamp: now,
      actor,
      details: updates.developerExplanation || updates.reason || 'Memory properties updated',
    };

    const updatedItem: ProjectMemory = {
      ...current,
      ...updates,
      title: updates.title ? this.redactSecrets(updates.title) : current.title,
      content: updates.content ? this.redactSecrets(updates.content) : current.content,
      developerExplanation: updates.developerExplanation ? this.redactSecrets(updates.developerExplanation) : current.developerExplanation,
      decision: updates.decision ? this.redactSecrets(updates.decision) : current.decision,
      rationale: updates.rationale ? this.redactSecrets(updates.rationale) : current.rationale,
      impact: updates.impact ? this.redactSecrets(updates.impact) : current.impact,
      history: [...(current.history || []), historyItem],
      updatedAt: now,
    };

    memories[idx] = updatedItem;
    this.persist(memories);
    return updatedItem;
  }

  public static approveMemory(memoryId: string, actor: string = 'Developer'): ProjectMemory | null {
    return this.updateMemory(
      memoryId,
      {
        status: 'APPROVED',
        confidence: 'CONFIRMED',
        acceptedBy: actor,
      },
      actor
    );
  }

  public static rejectMemory(memoryId: string, actor: string = 'Developer'): ProjectMemory | null {
    return this.updateMemory(
      memoryId,
      {
        status: 'REJECTED',
      },
      actor
    );
  }

  public static removeMemory(memoryId: string, archiveOnly: boolean = true): boolean {
    const memories = this.getProjectMemory();
    const idx = memories.findIndex((m) => m.memoryId === memoryId || m.id === memoryId);
    if (idx === -1) return false;

    if (archiveOnly) {
      memories[idx].status = 'ARCHIVED';
      memories[idx].updatedAt = Date.now();
      memories[idx].history = [
        ...(memories[idx].history || []),
        {
          action: 'ARCHIVED',
          timestamp: Date.now(),
          actor: 'Developer',
        },
      ];
      this.persist(memories);
    } else {
      memories.splice(idx, 1);
      this.persist(memories);
    }
    return true;
  }

  // ----------------------------------------------------
  // 4. SEARCH & RELEVANCE FILTERING
  // ----------------------------------------------------
  public static searchMemory(filter: ProjectMemoryFilter): ProjectMemory[] {
    const memories = this.getProjectMemory();

    return memories.filter((m) => {
      // Type
      if (filter.type && filter.type !== 'ALL' && m.type !== filter.type) return false;

      // Status
      if (filter.status && filter.status !== 'ALL') {
        if (filter.status === 'ACTIVE' || filter.status === 'APPROVED') {
          if (m.status !== 'ACTIVE' && m.status !== 'APPROVED' && m.status !== 'CONFIRMED') return false;
        } else if (m.status !== filter.status) {
          return false;
        }
      }

      // Scope
      if (filter.scope && filter.scope !== 'ALL' && m.scope !== filter.scope) return false;

      // Source
      if (filter.source && filter.source !== 'ALL' && m.source !== filter.source) return false;

      // Confidence
      if (filter.confidence && filter.confidence !== 'ALL' && m.confidence !== filter.confidence) return false;

      // Kind (EXPLICIT / INFERRED)
      if (filter.kind && filter.kind !== 'ALL') {
        const itemKind = m.kind || (m.isExplicit ? 'EXPLICIT' : 'INFERRED');
        if (itemKind !== filter.kind) return false;
      }

      if (filter.relatedFile && m.relatedFiles) {
        const fileMatch = m.relatedFiles.some((f) => f.toLowerCase().includes(filter.relatedFile!.toLowerCase()));
        if (!fileMatch && m.scope !== 'PROJECT') return false;
      }

      if (filter.relatedSymbol && m.relatedSymbols) {
        const symMatch = m.relatedSymbols.some((s) => s.toLowerCase().includes(filter.relatedSymbol!.toLowerCase()));
        if (!symMatch && m.scope === 'SYMBOL') return false;
      }

      if (filter.searchQuery && filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase();
        const inTitle = m.title.toLowerCase().includes(q);
        const inContent = m.content.toLowerCase().includes(q);
        const inTags = (m.tags || []).some((t) => t.toLowerCase().includes(q));
        const inReason = (m.reason || '').toLowerCase().includes(q);
        const inOwner = (m.owner || '').toLowerCase().includes(q);
        if (!inTitle && !inContent && !inTags && !inReason && !inOwner) return false;
      }

      return true;
    });
  }

  /**
   * Retrieves contextually relevant memories for AI queries or finding evaluations
   * based on the file, module, symbol, category, or query currently being analyzed.
   */
  public static getRelevantMemory(context: {
    file?: string;
    module?: string;
    symbol?: string;
    findingType?: string;
    category?: string;
    query?: string;
    code?: string;
    scope?: ProjectMemoryScope;
  }): ProjectMemory[] {
    const memories = this.getProjectMemory().filter(
      (m) => m.status === 'ACTIVE' || m.status === 'APPROVED' || m.status === 'CONFIRMED'
    );

    // Extract module name from file if not explicitly passed
    const activeModule = context.module || (context.file ? this.extractModuleName(context.file) : undefined);

    const ranked = memories.map((m) => {
      let score = 0;

      // 1. Scope and Target Matching
      if (m.scope === 'PROJECT') {
        score += 25; // Base weight for global approved project rules
      }

      if (context.file && m.relatedFiles && m.relatedFiles.length > 0) {
        const fBase = context.file.split('/').pop()?.toLowerCase() || '';
        const fNameWithoutExt = fBase.replace(/\.[^/.]+$/, '');
        const match = m.relatedFiles.some((rf) => {
          const rfLower = rf.toLowerCase();
          const rfBase = rfLower.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
          return (
            rfLower.includes(fBase) ||
            fBase.includes(rfLower) ||
            (fNameWithoutExt && rfBase.includes(fNameWithoutExt)) ||
            (fNameWithoutExt && fNameWithoutExt.includes(rfBase))
          );
        });
        if (match) score += 45;
      }

      // Module-level matching
      if (activeModule && (m.scope === 'MODULE' || m.affectedComponents || m.tags || m.relatedFiles)) {
        const modLower = activeModule.toLowerCase();
        const inComponents = (m.affectedComponents || []).some((c) => c.toLowerCase().includes(modLower) || modLower.includes(c.toLowerCase()));
        const inTags = (m.tags || []).some((t) => t.toLowerCase() === modLower || modLower.includes(t.toLowerCase()));
        const inFiles = (m.relatedFiles || []).some((f) => f.toLowerCase().includes(modLower));
        if (inComponents || inTags || inFiles) score += 40;
      }

      if (context.symbol && m.relatedSymbols && m.relatedSymbols.length > 0) {
        const sLower = context.symbol.toLowerCase();
        const match = m.relatedSymbols.some((rs) => rs.toLowerCase() === sLower || sLower.includes(rs.toLowerCase()) || rs.toLowerCase().includes(sLower));
        if (match) score += 50;
      }

      // Check code content if provided
      if (context.code && m.relatedSymbols && m.relatedSymbols.length > 0) {
        const codeContainsSymbol = m.relatedSymbols.some((s) => context.code!.includes(s));
        if (codeContainsSymbol) score += 30;
      }

      // 2. Category & Tag Matching
      if (context.category && m.tags) {
        const catLower = context.category.toLowerCase();
        if (m.tags.some((t) => t.toLowerCase() === catLower || catLower.includes(t.toLowerCase()))) {
          score += 30;
        }
      }

      // 3. User Query Term Matching
      if (context.query) {
        const qTerms = context.query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
        qTerms.forEach((term) => {
          if (m.title.toLowerCase().includes(term)) score += 25;
          if (m.content.toLowerCase().includes(term)) score += 20;
          if ((m.tags || []).some((t) => t.toLowerCase().includes(term))) score += 20;
          if ((m.decision || '').toLowerCase().includes(term)) score += 20;
          if ((m.reason || '').toLowerCase().includes(term)) score += 15;
        });
      }

      // 4. Source & Type Priority
      if (m.type === 'PROJECT_RULE' || m.type === 'ARCHITECTURE_DECISION') score += 20;
      if (m.isExplicit || m.source === 'USER_CREATED' || m.source === 'DEVELOPER_FEEDBACK') score += 20;
      if (m.status === 'APPROVED') score += 15;

      return { memory: m, score };
    });

    return ranked
      .filter((item) => item.score > 20)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((item) => item.memory);
  }

  /**
   * Helper to derive module/domain name from file path
   */
  public static extractModuleName(filePath: string): string {
    if (!filePath) return 'general';
    const parts = filePath.replace(/\\/g, '/').split('/');
    if (parts.length > 1) {
      // e.g. src/auth/authService.ts -> 'auth'
      const folder = parts[parts.length - 2];
      if (folder !== 'src' && folder !== 'lib' && folder !== 'components' && folder !== 'services') {
        return folder;
      }
    }
    // Try filename prefix (e.g. authService.ts -> 'auth', billingAdapter.ts -> 'billing')
    const fileName = parts[parts.length - 1].replace(/\.[^/.]+$/, '');
    const matched = fileName.match(/^([a-z]+)/i);
    return matched ? matched[1].toLowerCase() : fileName.toLowerCase();
  }

  // ----------------------------------------------------
  // 5. DEVELOPER FEEDBACK & FALSE POSITIVES LOOP
  // ----------------------------------------------------
  public static recordFeedback(
    finding: ActionFinding,
    status: FindingStatus,
    feedback?: {
      reason?: FalsePositiveReason;
      notes?: string;
      scope?: ProjectMemoryScope;
      reviewDate?: string;
      owner?: string;
      impact?: string;
    }
  ): ProjectMemory {
    const memoryScope: ProjectMemoryScope = feedback?.scope || 'SYMBOL';

    let memoryType: ProjectMemoryType = 'FINDING_FEEDBACK';
    if (status === 'FALSE_POSITIVE') memoryType = 'FALSE_POSITIVE';
    else if (status === 'ACCEPTED') memoryType = 'ACCEPTED_TECHNICAL_DEBT';

    const title = status === 'FALSE_POSITIVE'
      ? `False Positive: ${finding.title}`
      : status === 'ACCEPTED'
      ? `Accepted Technical Debt: ${finding.title}`
      : `Finding Feedback (${status}): ${finding.title}`;

    const content = feedback?.notes ||
      (status === 'FALSE_POSITIVE'
        ? `Marked as False Positive due to: ${feedback?.reason || 'Analyzer mistake'}`
        : status === 'ACCEPTED'
        ? `Technical debt accepted for ${finding.file}:${finding.line}`
        : `Status updated to ${status}`);

    const newMemory = this.addMemory({
      type: memoryType,
      title,
      content,
      source: 'DEVELOPER_FEEDBACK',
      confidence: 'CONFIRMED',
      status: 'APPROVED',
      scope: memoryScope,
      isExplicit: true,
      kind: 'EXPLICIT',
      relatedFiles: [finding.file],
      relatedSymbols: finding.symbol ? [finding.symbol] : [],
      relatedFindings: [finding.id],
      tags: [finding.category.toLowerCase(), status.toLowerCase(), 'developer-feedback'],
      reason: feedback?.reason,
      developerExplanation: feedback?.notes,
      reviewDate: feedback?.reviewDate,
      owner: feedback?.owner,
      impact: feedback?.impact,
      location: `${finding.file}:${finding.line}`,
      findingSnapshot: {
        findingId: finding.id,
        findingTitle: finding.title,
        findingCategory: finding.category,
        file: finding.file,
        line: finding.line,
      },
    });

    return newMemory;
  }

  /**
   * Checks if an active finding matches a previously reviewed false positive or accepted debt
   */
  public static findMatchingPreviousDecision(
    finding: ActionFinding
  ): { memory: ProjectMemory; isFalsePositive: boolean; isAcceptedDebt: boolean } | null {
    const memories = this.getProjectMemory();

    for (const mem of memories) {
      if (mem.status === 'ARCHIVED' || mem.status === 'DISMISSED' || mem.status === 'REJECTED') continue;

      const isFp = mem.type === 'FALSE_POSITIVE';
      const isDebt = mem.type === 'ACCEPTED_TECHNICAL_DEBT' || mem.type === 'ACCEPTED_RISK' || mem.type === 'TECHNICAL_DEBT';

      if (!isFp && !isDebt) continue;

      // Finding Location Scope
      if (mem.scope === 'FINDING') {
        if (mem.location === `${finding.file}:${finding.line}` || mem.relatedFindings?.includes(finding.id)) {
          return { memory: mem, isFalsePositive: isFp, isAcceptedDebt: isDebt };
        }
      }

      // Symbol Scope
      if (mem.scope === 'SYMBOL' && finding.symbol && mem.relatedSymbols?.includes(finding.symbol)) {
        return { memory: mem, isFalsePositive: isFp, isAcceptedDebt: isDebt };
      }

      // File Scope
      if (mem.scope === 'FILE' && mem.relatedFiles?.some((f) => f.toLowerCase() === finding.file.toLowerCase())) {
        return { memory: mem, isFalsePositive: isFp, isAcceptedDebt: isDebt };
      }

      // Project or Rule Scope
      if (mem.scope === 'PROJECT' && mem.title.toLowerCase().includes(finding.title.toLowerCase().slice(0, 15))) {
        return { memory: mem, isFalsePositive: isFp, isAcceptedDebt: isDebt };
      }
    }

    return null;
  }

  // ----------------------------------------------------
  // 6. STATISTICS & METRICS
  // ----------------------------------------------------
  public static getMemoryStats(): ProjectMemoryStats {
    const memories = this.getProjectMemory();

    const activeOrApproved = memories.filter((m) => m.status === 'ACTIVE' || m.status === 'APPROVED' || m.status === 'CONFIRMED');
    const proposed = memories.filter((m) => m.status === 'PROPOSED' || m.status === 'SUGGESTED');
    const rejected = memories.filter((m) => m.status === 'REJECTED' || m.status === 'DISMISSED');
    const requiresReview = memories.filter((m) => this.isReviewRequired(m));

    const byType = {
      rules: activeOrApproved.filter((m) => m.type === 'PROJECT_RULE' || m.type === 'SECURITY_RULE' || m.type === 'TESTING_RULE').length,
      architecture: activeOrApproved.filter((m) => m.type === 'ARCHITECTURE_DECISION' || m.type === 'ARCHITECTURE_NOTE').length,
      techDebt: activeOrApproved.filter((m) => m.type === 'ACCEPTED_TECHNICAL_DEBT' || m.type === 'TECHNICAL_DEBT').length,
      falsePositives: activeOrApproved.filter((m) => m.type === 'FALSE_POSITIVE').length,
      acceptedRisks: activeOrApproved.filter((m) => m.type === 'ACCEPTED_RISK').length,
      securityDecisions: activeOrApproved.filter((m) => m.type === 'SECURITY_DECISION' || m.type === 'SECURITY_RULE').length,
      testingRules: activeOrApproved.filter((m) => m.type === 'TESTING_CONVENTION' || m.type === 'TESTING_RULE').length,
      conventions: activeOrApproved.filter((m) => m.type === 'CODING_CONVENTION' || m.type === 'DEVELOPER_PREFERENCE').length,
    };

    return {
      total: memories.length,
      approved: activeOrApproved.length,
      proposed: proposed.length,
      rejected: rejected.length,
      requiresReview: requiresReview.length,
      byType,
    };
  }

  public static isReviewRequired(mem: ProjectMemory): boolean {
    if (!mem.reviewDate) return false;
    try {
      const reviewTime = new Date(mem.reviewDate).getTime();
      if (isNaN(reviewTime)) return false;
      const thirtyDaysFromNow = Date.now() + 30 * 86400000;
      return reviewTime <= thirtyDaysFromNow;
    } catch {
      return false;
    }
  }

  // ----------------------------------------------------
  // 7. DUPLICATE & SIMILAR RULE DETECTION
  // ----------------------------------------------------
  public static findDuplicateOrSimilar(
    title: string,
    content: string
  ): { duplicate: ProjectMemory | null; similar: ProjectMemory[] } {
    const memories = this.getProjectMemory();
    const cleanTitle = title.trim().toLowerCase();
    const cleanContent = content.trim().toLowerCase();

    let duplicate: ProjectMemory | null = null;
    const similar: ProjectMemory[] = [];

    for (const mem of memories) {
      const mTitle = mem.title.trim().toLowerCase();
      const mContent = mem.content.trim().toLowerCase();

      if (mTitle === cleanTitle || (mContent.length > 20 && mContent === cleanContent)) {
        duplicate = mem;
        break;
      }

      // Check lexical similarity (shared keyword tokens)
      const titleTokens = cleanTitle.split(/\s+/).filter((w) => w.length > 3);
      const mTokens = mTitle.split(/\s+/).filter((w) => w.length > 3);
      const overlap = titleTokens.filter((t) => mTokens.includes(t));
      if (overlap.length >= 2 || (titleTokens.length === 1 && overlap.length === 1)) {
        similar.push(mem);
      }
    }

    return { duplicate, similar };
  }

  // ----------------------------------------------------
  // 8. REGRESSION MEMORY DETECTION
  // ----------------------------------------------------
  public static detectRegressions(currentFindings: ActionFinding[]): Array<{
    finding: ActionFinding;
    isRegression: boolean;
    previousMemory?: ProjectMemory;
  }> {
    const memories = this.getProjectMemory();
    const fixedMemories = memories.filter((m) =>
      m.tags?.includes('fixed') ||
      m.title.toLowerCase().includes('fixed') ||
      (m.findingSnapshot && (m.status === 'CONFIRMED' || m.status === 'APPROVED') && m.type === 'FINDING_FEEDBACK')
    );

    return currentFindings.map((finding) => {
      const match = fixedMemories.find((fm) =>
        fm.relatedFindings?.includes(finding.id) ||
        (fm.findingSnapshot && fm.findingSnapshot.file === finding.file && fm.findingSnapshot.findingTitle === finding.title)
      );

      return {
        finding,
        isRegression: !!match,
        previousMemory: match,
      };
    });
  }

  // ----------------------------------------------------
  // 9. CONFLICT DETECTION
  // ----------------------------------------------------
  public static detectRuleConflicts(
    findings: ActionFinding[],
    fileName: string,
    code: string
  ): Array<{ rule: ProjectMemory; conflictDescription: string; severity: 'HIGH' | 'MEDIUM' }> {
    const rules = this.searchMemory({ type: 'PROJECT_RULE', status: 'ACTIVE' });
    const conflicts: Array<{ rule: ProjectMemory; conflictDescription: string; severity: 'HIGH' | 'MEDIUM' }> = [];

    rules.forEach((r) => {
      // Check SQL in controller rule
      if (r.title.toLowerCase().includes('repository') || r.content.toLowerCase().includes('controller')) {
        const sqlFindings = findings.filter((f) => f.title.toLowerCase().includes('sql') || f.description.toLowerCase().includes('query'));
        if (sqlFindings.length > 0 && (fileName.toLowerCase().includes('controller') || fileName.toLowerCase().includes('route'))) {
          conflicts.push({
            rule: r,
            conflictDescription: `File \`${fileName}\` performs direct queries violating approved rule "${r.title}"`,
            severity: 'HIGH',
          });
        }
      }
    });

    return conflicts;
  }

  // ----------------------------------------------------
  // 10. AI CONTEXT FORMATTER (Explicit vs Inferred)
  // ----------------------------------------------------
  public static formatContextForAI(relevantMemories: ProjectMemory[]): string {
    if (relevantMemories.length === 0) return '';

    const approved = relevantMemories.filter((m) => m.status === 'APPROVED' || m.status === 'ACTIVE' || m.status === 'CONFIRMED');
    const inferred = relevantMemories.filter((m) => m.status === 'PROPOSED' || m.status === 'SUGGESTED');

    if (approved.length === 0 && inferred.length === 0) return '';

    let text = '\n### 🧠 Approved Project Rules & Architectural Context\n';
    text += 'The following approved project memory items and architectural constraints apply directly to the analyzed file/module:\n\n';

    if (approved.length > 0) {
      // Group by category for high clarity
      const rulesAndDecisions = approved.filter((m) => m.type === 'PROJECT_RULE' || m.type === 'ARCHITECTURE_DECISION');
      const debtAndRisks = approved.filter((m) => m.type === 'ACCEPTED_TECHNICAL_DEBT');
      const falsePositives = approved.filter((m) => m.type === 'FALSE_POSITIVE');
      const conventions = approved.filter((m) => m.type === 'CODING_CONVENTION' || m.type === 'TESTING_CONVENTION');
      const others = approved.filter((m) => !rulesAndDecisions.includes(m) && !debtAndRisks.includes(m) && !falsePositives.includes(m) && !conventions.includes(m));

      if (rulesAndDecisions.length > 0) {
        text += '**Enforced Architecture Decisions & Rules:**\n';
        rulesAndDecisions.forEach((m) => {
          text += `- **[${m.type.replace('_', ' ')}] ${m.title}** (${m.scope} scope)\n  ${m.content}\n`;
          if (m.decision) text += `  *Architecture Mandate:* ${m.decision}\n`;
          if (m.rationale) text += `  *Rationale:* ${m.rationale}\n`;
        });
        text += '\n';
      }

      if (debtAndRisks.length > 0) {
        text += '**Accepted Technical Debt & Deferred Refactorings:**\n';
        debtAndRisks.forEach((m) => {
          text += `- **${m.title}** (${m.scope} scope)\n  ${m.content}\n`;
          if (m.developerExplanation) text += `  *Developer Note:* ${m.developerExplanation}\n`;
        });
        text += '\n';
      }

      if (falsePositives.length > 0) {
        text += '**Calibrated False Positives (Do not re-flag):**\n';
        falsePositives.forEach((m) => {
          text += `- **${m.title}**: ${m.content} (Reason: ${m.reason || 'Analyzer calibration'})\n`;
        });
        text += '\n';
      }

      if (conventions.length > 0) {
        text += '**Approved Conventions:**\n';
        conventions.forEach((m) => {
          text += `- **${m.title}**: ${m.content}\n`;
        });
        text += '\n';
      }

      if (others.length > 0) {
        others.forEach((m) => {
          text += `- **[${m.type}] ${m.title}**: ${m.content}\n`;
        });
        text += '\n';
      }
    }

    if (inferred.length > 0) {
      text += '**Suggested / Proposed Conventions (Unapproved):**\n';
      inferred.forEach((m) => {
        text += `- *[Proposed ${m.type}] ${m.title}*: ${m.content}\n`;
      });
      text += '\n';
    }

    return text;
  }

  // ----------------------------------------------------
  // 11. SPECIFIC MEMORY QUERIES
  // ----------------------------------------------------
  public static getProjectRules(file?: string): ProjectMemory[] {
    return this.searchMemory({ type: 'PROJECT_RULE', status: 'ACTIVE', relatedFile: file });
  }

  public static getArchitectureDecisions(): ArchitectureDecisionRecord[] {
    const memories = this.searchMemory({ type: 'ARCHITECTURE_DECISION' });
    return memories.map((m) => ({
      id: m.memoryId,
      title: m.title,
      decision: m.decision || m.content,
      rationale: m.rationale || m.content,
      alternatives: m.alternatives || [],
      affectedComponents: m.affectedComponents || m.relatedFiles || [],
      status: (m.status === 'SUPERSEDED' || m.status === 'DEPRECATED' ? m.status : 'ACTIVE') as any,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }

  public static getAcceptedRisks(): ProjectMemory[] {
    return this.searchMemory({ type: 'ACCEPTED_TECHNICAL_DEBT', status: 'ACTIVE' });
  }

  public static getPreviousFindings(file?: string, symbol?: string): ProjectMemory[] {
    return this.searchMemory({
      type: 'FINDING_FEEDBACK',
      relatedFile: file,
      relatedSymbol: symbol,
    });
  }

  // ----------------------------------------------------
  // 12. AUTOMATIC HIGH-CONFIDENCE EXTRACTION
  // ----------------------------------------------------
  public static extractAutomaticMemory(code: string, fileName: string, manifestContent?: string): ProjectMemory[] {
    const extracted: ProjectMemory[] = [];

    // 1. Detect ESLint / TypeScript rules
    if (code.includes('strict: true') || code.includes('@typescript-eslint/no-explicit-any')) {
      extracted.push({
        projectId: 'default-project',
        memoryId: `mem-auto-ts-strict`,
        type: 'CODING_CONVENTION',
        title: 'TypeScript Strict Type Safety Convention',
        content: 'Project config enforces strict type checking and prohibits unsafe explicit any casts.',
        source: 'ANALYSIS',
        confidence: 'SUGGESTED',
        status: 'PROPOSED',
        scope: 'PROJECT',
        isExplicit: false,
        kind: 'INFERRED',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: ['typescript', 'strict', 'typing'],
      });
    }

    // 2. Detect Test runner convention
    if (code.includes('describe(') && code.includes('it(')) {
      extracted.push({
        projectId: 'default-project',
        memoryId: `mem-auto-bdd-testing`,
        type: 'TESTING_CONVENTION',
        title: 'BDD Test Structure Convention',
        content: 'Test suites in this repository follow BDD describe/it hierarchies with explicit assertions.',
        source: 'ANALYSIS',
        confidence: 'SUGGESTED',
        status: 'PROPOSED',
        scope: 'PROJECT',
        isExplicit: false,
        kind: 'INFERRED',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: ['testing', 'bdd'],
      });
    }

    return extracted;
  }
}

