/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActionFinding,
  ActionFindingCategory,
  ActionFindingEvidence,
  ActionRecommendation,
  AgentFinding,
  CodeMetrics,
  CodeSmell,
  FalsePositiveReason,
  FindingPriority,
  FindingSeverity,
  FindingSource,
  FindingStatus,
  KnowledgeLevel,
  UserPersonalizationProfile,
  VulnerabilityItem,
} from '../types';
import { FindingPriorityEngine } from '../services/findingPriorityEngine';
import { ProjectMemoryService } from '../services/projectMemoryService';

const STORAGE_KEY_FINDING_STATUSES = 'devpulse_finding_status_overrides';

/**
 * Calculates priority score and recommendation based on multi-signal intelligence:
 * Priority = Severity (45%) + Confidence (30%) + Reachability/Impact (25%)
 */
export function calculateFindingPriority(params: {
  severity: FindingSeverity;
  confidence: number; // 0 - 100
  category: ActionFindingCategory;
  line: number;
  complexity?: number;
  isUsedInCode?: boolean;
  isSecurity?: boolean;
}): {
  priority: FindingPriority;
  priorityScore: number;
  recommendedAction: ActionRecommendation;
} {
  const { severity, confidence, category, complexity = 1, isUsedInCode = true, isSecurity = false } = params;

  // Reachability calculation based on code location, usage, and complexity
  const reachabilityScore = isUsedInCode
    ? Math.min(100, 75 + (complexity > 8 ? 15 : 5) + (isSecurity ? 10 : 0))
    : 30;

  const result = FindingPriorityEngine.calculate({
    severity,
    confidence,
    reachability: reachabilityScore,
    category,
  });

  return {
    priority: result.priority,
    priorityScore: result.priorityScore,
    recommendedAction: result.recommendedAction,
  };
}

/**
 * Normalizes deterministic code smells into unified ActionFindings
 */
export function normalizeCodeSmells(
  smells: CodeSmell[],
  fileName: string,
  metrics?: CodeMetrics
): ActionFinding[] {
  return smells.map((s) => {
    const sev: FindingSeverity =
      s.severity === 'critical' ? 'CRITICAL' : s.severity === 'warning' ? 'HIGH' : s.severity === 'info' ? 'LOW' : 'INFO';

    let cat: ActionFindingCategory = 'QUALITY';
    if (s.category === 'security') cat = 'SECURITY';
    else if (s.category === 'complexity' || s.category === 'structure') cat = 'MAINTAINABILITY';
    else if (s.category === 'coupling') cat = 'ARCHITECTURE';
    else if (s.category === 'naming' || s.category === 'dead_code') cat = 'QUALITY';
    else if (s.category === 'documentation') cat = 'DOCUMENTATION';

    const confidence = s.confidence ?? (sev === 'CRITICAL' ? 98 : sev === 'HIGH' ? 94 : 88);
    const isSecurity = cat === 'SECURITY' || s.title.toLowerCase().includes('sql') || s.title.toLowerCase().includes('injection') || s.title.toLowerCase().includes('xss');

    const { priority, priorityScore, recommendedAction } = calculateFindingPriority({
      severity: sev,
      confidence,
      category: cat,
      line: s.line,
      complexity: metrics?.cyclomaticComplexity,
      isSecurity,
    });

    const evidence: ActionFindingEvidence[] = [
      {
        file: fileName,
        line: s.line,
        codeLocation: `Line ${s.line}${s.column ? `:${s.column}` : ''}`,
        detectionRule: s.title,
        analyzerSource: 'STATIC_ANALYZER',
        confidenceScore: confidence,
        confidenceType: 'DETERMINISTIC',
      },
    ];

    return {
      id: s.id,
      title: s.title,
      type: s.category,
      category: cat,
      severity: sev,
      confidence,
      confidenceType: 'DETERMINISTIC',
      priority,
      priorityScore,
      recommendedAction,
      file: fileName,
      line: s.line,
      column: s.column,
      endLine: s.endLine,
      codeSnippet: s.codeSnippet,
      message: s.problem,
      description: s.explanation || s.problem,
      whyItMatters: s.whyItMatters || getWhyItMatters(cat, s.title),
      evidence,
      sources: ['STATIC_ANALYZER'],
      analysisEngine: 'DevPulse AST & Semantic Detector',
      status: 'OPEN',
      createdAt: Date.now(),
      suggestedFix: s.solution || s.recommendation,
    };
  });
}

/**
 * Normalizes vulnerability items into unified ActionFindings
 */
export function normalizeVulnerabilities(
  vulns: VulnerabilityItem[],
  manifestFile = 'package.json'
): ActionFinding[] {
  return vulns.map((v) => {
    const isUsed = v.isUsedInModifiedCode || Boolean(v.usageLocation);
    const { priority, priorityScore, recommendedAction } = calculateFindingPriority({
      severity: v.severity,
      confidence: 96,
      category: 'SECURITY',
      line: v.usageLocation?.line ?? 1,
      isUsedInCode: isUsed,
      isSecurity: true,
    });

    const evidence: ActionFindingEvidence[] = [
      {
        file: v.usageLocation?.file || manifestFile,
        line: v.usageLocation?.line || 1,
        codeLocation: `${v.package}@${v.installedVersion}`,
        dependencyPath: `${v.package} (Vulnerable range: ${v.vulnerableRange})`,
        detectionRule: `CVE Advisory ${v.cveId}`,
        analyzerSource: 'SECURITY_SCANNER',
        confidenceScore: 96,
        confidenceType: 'HIGH_CONFIDENCE',
      },
    ];

    return {
      id: `vuln-${v.cveId || v.id}`,
      title: `CVE Advisory: ${v.package} (${v.cveId})`,
      type: 'vulnerability',
      category: 'SECURITY',
      severity: v.severity,
      confidence: 96,
      confidenceType: 'HIGH_CONFIDENCE',
      priority,
      priorityScore,
      recommendedAction: isUsed ? 'FIX_NOW' : recommendedAction,
      file: v.usageLocation?.file || manifestFile,
      line: v.usageLocation?.line || 1,
      message: v.title,
      description: v.description,
      whyItMatters: `This package vulnerability exposes the application to potential security exploits. Fixed in version ${v.fixedVersion}.`,
      evidence,
      sources: ['SECURITY_SCANNER'],
      analysisEngine: 'DevPulse Advisory Scanner',
      status: 'OPEN',
      createdAt: Date.now(),
      suggestedFix: `Upgrade ${v.package} to ${v.fixedVersion} or later.`,
    };
  });
}

/**
 * Normalizes agent findings into unified ActionFindings
 */
export function normalizeAgentFindings(agentFindings: AgentFinding[]): ActionFinding[] {
  return agentFindings.map((af) => {
    let cat: ActionFindingCategory = 'QUALITY';
    if (af.category === 'SECURITY') cat = 'SECURITY';
    else if (af.category === 'ARCHITECTURE') cat = 'ARCHITECTURE';
    else if (af.category === 'PERFORMANCE') cat = 'PERFORMANCE';
    else if (af.category === 'TESTING') cat = 'TESTING';
    else if (af.category === 'MAINTAINABILITY') cat = 'MAINTAINABILITY';

    const confidenceVal = Math.round(af.confidence * 100);
    const { priority, priorityScore, recommendedAction } = calculateFindingPriority({
      severity: af.severity,
      confidence: confidenceVal,
      category: cat,
      line: af.line,
      isSecurity: cat === 'SECURITY',
    });

    const evidence: ActionFindingEvidence[] = (af.evidence || []).map((e, idx) => ({
      file: af.file,
      line: af.line,
      codeLocation: `Evidence #${idx + 1}`,
      detectionRule: e,
      analyzerSource: 'AI_REVIEW',
      confidenceScore: confidenceVal,
      confidenceType: 'AI_ASSISTED',
    }));

    return {
      id: af.id,
      title: af.title,
      type: af.category.toLowerCase(),
      category: cat,
      severity: af.severity,
      confidence: confidenceVal,
      confidenceType: 'AI_ASSISTED',
      priority,
      priorityScore,
      recommendedAction,
      file: af.file,
      line: af.line,
      symbol: af.symbol,
      message: af.description,
      description: af.description,
      whyItMatters: af.impact || getWhyItMatters(cat, af.title),
      evidence,
      sources: ['AI_REVIEW'],
      analysisEngine: 'DevPulse Agentic LLM Reviewer',
      status: af.status === 'accepted' ? 'ACCEPTED' : af.status === 'resolved' ? 'FIXED' : 'OPEN',
      createdAt: Date.now(),
      suggestedFix: af.suggested_fix,
    };
  });
}

/**
 * Deduplication & Multi-Engine Fusion:
 * Safely groups findings from Static Analyzer, Security Scanner, and AI Reviewer
 * when they identify the same underlying line or exact same issue.
 */
export function fuseAndDeduplicateFindings(findings: ActionFinding[]): ActionFinding[] {
  const map = new Map<string, ActionFinding>();

  for (const f of findings) {
    // Key based on file + line + category
    const key = `${f.file}:${f.line}:${f.category}:${f.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}`;

    if (map.has(key)) {
      const existing = map.get(key)!;
      // Merge sources cleanly without duplication
      for (const src of f.sources) {
        if (!existing.sources.includes(src)) {
          existing.sources.push(src);
        }
      }
      // Combine evidence
      for (const ev of f.evidence) {
        if (!existing.evidence.some((e) => e.detectionRule === ev.detectionRule)) {
          existing.evidence.push(ev);
        }
      }
      // Upgrade priority / confidence if secondary finding is higher
      if (f.priorityScore > existing.priorityScore) {
        existing.priority = f.priority;
        existing.priorityScore = f.priorityScore;
        existing.recommendedAction = f.recommendedAction;
      }
      existing.confidence = Math.max(existing.confidence, f.confidence);
      if (f.suggestedFix && !existing.suggestedFix) {
        existing.suggestedFix = f.suggestedFix;
      }
    } else {
      map.set(key, { ...f, sources: [...f.sources], evidence: [...f.evidence] });
    }
  }

  return Array.from(map.values());
}

/**
 * Sorts Action Findings according to the intelligent priority engine hierarchy:
 * 1. Critical security issues
 * 2. High-impact vulnerabilities
 * 3. High-confidence architecture problems
 * 4. High-impact reliability issues
 * 5. Important test gaps
 * 6. Significant maintainability issues
 * 7. Dependency problems
 * 8. Low-impact quality issues
 * 9. Informational findings
 */
export function sortFindingsByPriority(findings: ActionFinding[]): ActionFinding[] {
  const priorityRank: Record<FindingPriority, number> = {
    CRITICAL: 5,
    HIGH: 4,
    MEDIUM: 3,
    LOW: 2,
    INFO: 1,
  };

  const categoryRank: Record<ActionFindingCategory, number> = {
    SECURITY: 8,
    ARCHITECTURE: 7,
    PERFORMANCE: 6,
    TESTING: 5,
    MAINTAINABILITY: 4,
    DEPENDENCY: 3,
    QUALITY: 2,
    DOCUMENTATION: 1,
  };

  return [...findings].sort((a, b) => {
    // 1. By status: OPEN and IN_REVIEW first, FIXED/FALSE_POSITIVE last
    const isAClosed = a.status === 'FIXED' || a.status === 'VERIFIED' || a.status === 'FALSE_POSITIVE' || a.status === 'DEFERRED';
    const isBClosed = b.status === 'FIXED' || b.status === 'VERIFIED' || b.status === 'FALSE_POSITIVE' || b.status === 'DEFERRED';
    if (!isAClosed && isBClosed) return -1;
    if (isAClosed && !isBClosed) return 1;

    // 2. By Priority Tier
    const pDiff = priorityRank[b.priority] - priorityRank[a.priority];
    if (pDiff !== 0) return pDiff;

    // 3. By Category Hierarchy
    const cDiff = categoryRank[b.category] - categoryRank[a.category];
    if (cDiff !== 0) return cDiff;

    // 4. By Priority Score
    const sDiff = b.priorityScore - a.priorityScore;
    if (sDiff !== 0) return sDiff;

    // 5. By Line
    return a.line - b.line;
  });
}

/**
 * Finding Status Persistence Layer (Local storage & in-memory fallback)
 */
export function getStoredFindingStatuses(): Record<
  string,
  {
    status: FindingStatus;
    reason?: FalsePositiveReason;
    notes?: string;
    updatedAt: number;
  }
> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FINDING_STATUSES);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveFindingStatus(
  findingId: string,
  status: FindingStatus,
  feedback?: {
    reason?: FalsePositiveReason;
    notes?: string;
    reviewDate?: string;
    owner?: string;
  },
  finding?: ActionFinding
): void {
  try {
    const current = getStoredFindingStatuses();
    current[findingId] = {
      status,
      reason: feedback?.reason,
      notes: feedback?.notes,
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY_FINDING_STATUSES, JSON.stringify(current));

    // Record into durable Project Memory layer
    if (finding) {
      ProjectMemoryService.recordFeedback(finding, status, {
        reason: feedback?.reason,
        notes: feedback?.notes,
        reviewDate: feedback?.reviewDate,
        owner: feedback?.owner,
      });
    }
  } catch (err) {
    console.warn('Failed to persist finding status to storage:', err);
  }
}

export function applyStoredStatuses(findings: ActionFinding[]): ActionFinding[] {
  const overrides = getStoredFindingStatuses();
  return findings.map((f) => {
    const override = overrides[f.id];
    if (override) {
      return {
        ...f,
        status: override.status,
        statusFeedback: {
          reason: override.reason,
          notes: override.notes,
          updatedAt: override.updatedAt,
        },
      };
    }
    return f;
  });
}

/**
 * Generates personalized finding presentation based on active user level
 */
export function getPersonalizedFindingDetails(
  finding: ActionFinding,
  profile: UserPersonalizationProfile
): {
  level: KnowledgeLevel;
  explanation: string;
  whyItMatters: string;
  analogy?: string;
  recommendedSteps: string[];
  remediationSnippet?: string;
} {
  const level = profile.knowledge_level;

  if (level === 'beginner') {
    return {
      level: 'beginner',
      explanation: `Let's break down "${finding.title}" found at line ${finding.line}. In simple terms: ${finding.message}`,
      whyItMatters: finding.whyItMatters || getWhyItMatters(finding.category, finding.title),
      analogy: getAnalogyForCategory(finding.category),
      recommendedSteps: [
        '1. Inspect the highlighted line in the source file.',
        '2. Review why this pattern causes unexpected bugs or confusion.',
        '3. Apply the recommended solution below step-by-step.',
      ],
      remediationSnippet: finding.suggestedFix,
    };
  }

  if (level === 'expert') {
    return {
      level: 'expert',
      explanation: `Deterministic heuristic flagged ${finding.title} at ${finding.file}:${finding.line}. Confidence: ${finding.confidence}%. Priority: ${finding.priority}.`,
      whyItMatters: finding.whyItMatters || `Directly impairs ${finding.category.toLowerCase()} bounds and architectural integrity.`,
      recommendedSteps: [
        `Remediation: ${finding.suggestedFix || 'Refactor invariant checks and isolate side-effects.'}`,
        'Verify test suite passes with no regressions.',
      ],
      remediationSnippet: finding.suggestedFix,
    };
  }

  // Intermediate
  return {
    level: 'intermediate',
    explanation: `${finding.message} — Consider refactoring for cleaner maintainability and safer execution.`,
    whyItMatters: finding.whyItMatters || getWhyItMatters(finding.category, finding.title),
    recommendedSteps: [
      `Inspect ${finding.file} at line ${finding.line}.`,
      `Apply recommended fix: ${finding.suggestedFix || 'Modularize logic into smaller helper functions.'}`,
      'Run unit tests to ensure behavior remains identical.',
    ],
    remediationSnippet: finding.suggestedFix,
  };
}

function getWhyItMatters(category: ActionFindingCategory, title: string): string {
  switch (category) {
    case 'SECURITY':
      return 'Security vulnerabilities allow untrusted inputs to compromise application data, execute unauthorized operations, or leak credentials.';
    case 'ARCHITECTURE':
      return 'Architectural coupling increases regression risk and makes modular refactoring significantly more difficult over time.';
    case 'MAINTAINABILITY':
      return 'High cyclomatic complexity and large functions increase cognitive load for developers and correlate with higher bug density.';
    case 'PERFORMANCE':
      return 'Inefficient loops, unmemoized calls, or redundant operations create latency bottlenecks under heavy load.';
    case 'DEPENDENCY':
      return 'Outdated or unpinned dependencies may contain known CVE vulnerabilities or obsolete API signatures.';
    case 'TESTING':
      return 'Untested boundary conditions and edge cases leave code vulnerable to silent failures during production deployments.';
    case 'QUALITY':
    default:
      return 'Code smells reduce readability and make future feature additions more prone to accidental bugs.';
  }
}

function getAnalogyForCategory(category: ActionFindingCategory): string {
  switch (category) {
    case 'SECURITY':
      return 'Think of this vulnerability like an unlocked ground-floor window with the latch open — anyone walking by could slip in.';
    case 'ARCHITECTURE':
      return 'Think of high coupling like rooms in a house connected by too many secret passageways — moving furniture in one room knocks over items in another!';
    case 'MAINTAINABILITY':
      return 'Think of high complexity like a highway with 10 sudden detour exits — the driver (and computer) has to check every single sign before knowing where to turn.';
    case 'DEPENDENCY':
      return 'Think of unused or outdated dependencies like old tools sitting in your toolbox that need oiling or take up valuable space.';
    default:
      return 'Think of this code smell like a slightly cluttered desk — taking a few moments to organize it makes your daily work smoother.';
  }
}
