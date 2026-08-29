/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActionFinding,
  ActionRecommendation,
  FindingPriority,
  FindingSeverity,
} from '../types';

export interface ReachabilityContext {
  isPublicApi?: boolean;
  isEntrypoint?: boolean;
  isInvokedInCallGraph?: boolean;
  isDirectDependency?: boolean;
  isTestFile?: boolean;
  isDeadCode?: boolean;
  depthFromRoot?: number;
}

export interface PriorityCalculationInput {
  severity: FindingSeverity | string;
  confidence: number; // 0 - 100
  reachability?: number | ReachabilityContext; // 0 - 100 or contextual flags
  category?: string;
  impactScore?: number; // 0 - 100
}

export interface PriorityCalculationResult {
  priority: FindingPriority;
  priorityScore: number; // 0 - 100
  recommendedAction: ActionRecommendation;
  reachabilityScore: number; // 0 - 100
  reachabilityTier: 'DIRECT' | 'INDIRECT' | 'UNREACHABLE' | 'UNKNOWN';
}

/**
 * FindingPriorityEngine
 * Centralized utility in the services layer that calculates deterministic
 * finding priority (CRITICAL, HIGH, MEDIUM, LOW, INFO) based on:
 *   1. Severity (45% weight)
 *   2. Confidence (30% weight)
 *   3. Reachability (25% weight)
 */
export class FindingPriorityEngine {
  /**
   * Evaluates reachability score (0-100) from AST, dependency, and call graph context.
   */
  public static evaluateReachability(
    reachabilityInput?: number | ReachabilityContext,
    file?: string,
    symbol?: string
  ): { score: number; tier: 'DIRECT' | 'INDIRECT' | 'UNREACHABLE' | 'UNKNOWN' } {
    if (typeof reachabilityInput === 'number') {
      const clamped = Math.max(0, Math.min(100, reachabilityInput));
      const tier =
        clamped >= 80 ? 'DIRECT' : clamped >= 45 ? 'INDIRECT' : clamped >= 20 ? 'UNKNOWN' : 'UNREACHABLE';
      return { score: clamped, tier };
    }

    if (!reachabilityInput) {
      // Heuristic fallback based on filename and symbol
      if (file && (file.includes('test') || file.includes('spec') || file.includes('__tests__'))) {
        return { score: 30, tier: 'INDIRECT' };
      }
      if (file && (file.includes('server') || file.includes('app') || file.includes('index') || file.includes('main'))) {
        return { score: 90, tier: 'DIRECT' };
      }
      return { score: 75, tier: 'DIRECT' };
    }

    const ctx = reachabilityInput;

    if (ctx.isDeadCode) {
      return { score: 10, tier: 'UNREACHABLE' };
    }
    if (ctx.isTestFile) {
      return { score: 35, tier: 'INDIRECT' };
    }
    if (ctx.isEntrypoint || ctx.isPublicApi) {
      return { score: 95, tier: 'DIRECT' };
    }
    if (ctx.isInvokedInCallGraph) {
      return { score: 85, tier: 'DIRECT' };
    }
    if (ctx.isDirectDependency) {
      return { score: 80, tier: 'DIRECT' };
    }
    if (ctx.depthFromRoot !== undefined) {
      if (ctx.depthFromRoot <= 1) return { score: 90, tier: 'DIRECT' };
      if (ctx.depthFromRoot === 2) return { score: 70, tier: 'INDIRECT' };
      return { score: 50, tier: 'INDIRECT' };
    }

    return { score: 70, tier: 'INDIRECT' };
  }

  /**
   * Normalizes severity string into standard 0-100 scale weight.
   */
  public static getSeverityWeight(severity: FindingSeverity | string): number {
    const s = String(severity).toUpperCase();
    switch (s) {
      case 'CRITICAL':
        return 100;
      case 'HIGH':
      case 'WARNING':
        return 75;
      case 'MEDIUM':
        return 50;
      case 'LOW':
        return 30;
      case 'INFO':
      default:
        return 15;
    }
  }

  /**
   * Calculates comprehensive priority score, priority tier, and action recommendation.
   */
  public static calculate(input: PriorityCalculationInput): PriorityCalculationResult {
    const sevWeight = this.getSeverityWeight(input.severity);
    const confScore = Math.max(0, Math.min(100, input.confidence ?? 85));
    const { score: reachScore, tier: reachTier } = this.evaluateReachability(input.reachability);

    // Multi-signal Weighted Calculation
    // Formula: Severity (45%) + Confidence (30%) + Reachability (25%)
    let rawScore = sevWeight * 0.45 + confScore * 0.3 + reachScore * 0.25;

    // Critical security multiplier
    const isSecurity = input.category?.toUpperCase() === 'SECURITY';
    if (isSecurity && sevWeight >= 75) {
      rawScore = Math.min(100, rawScore + 8);
    }

    const priorityScore = Math.round(Math.max(0, Math.min(100, rawScore)));

    // Categorization into Priority Tier
    let priority: FindingPriority = 'INFO';
    if (priorityScore >= 80 || (sevWeight === 100 && confScore >= 70 && reachScore >= 50)) {
      priority = 'CRITICAL';
    } else if (priorityScore >= 65) {
      priority = 'HIGH';
    } else if (priorityScore >= 45) {
      priority = 'MEDIUM';
    } else if (priorityScore >= 25) {
      priority = 'LOW';
    } else {
      priority = 'INFO';
    }

    // Action Recommendation
    let recommendedAction: ActionRecommendation = 'INFORMATIONAL';
    if (priority === 'CRITICAL' || priorityScore >= 78) {
      recommendedAction = 'FIX_NOW';
    } else if (priority === 'HIGH' || priorityScore >= 58) {
      recommendedAction = 'REVIEW';
    } else if (priority === 'MEDIUM' || priorityScore >= 40) {
      recommendedAction = 'MONITOR';
    } else if (priority === 'LOW') {
      recommendedAction = 'DEFER';
    } else {
      recommendedAction = 'INFORMATIONAL';
    }

    return {
      priority,
      priorityScore,
      recommendedAction,
      reachabilityScore: reachScore,
      reachabilityTier: reachTier,
    };
  }

  /**
   * Enrich and recalculate priority on an existing ActionFinding object.
   */
  public static enrichFinding(
    finding: ActionFinding,
    reachabilityOverride?: number | ReachabilityContext
  ): ActionFinding {
    const result = this.calculate({
      severity: finding.severity,
      confidence: finding.confidence,
      reachability: reachabilityOverride ?? (finding.line > 0 ? 80 : 60),
      category: finding.category,
    });

    return {
      ...finding,
      priority: result.priority,
      priorityScore: result.priorityScore,
      recommendedAction: result.recommendedAction,
    };
  }

  /**
   * Sorts findings deterministically by Priority Score (descending), then Confidence, then Line number.
   */
  public static rankFindings(findings: ActionFinding[]): ActionFinding[] {
    return [...findings].sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return a.line - b.line;
    });
  }
}

/**
 * Convenient procedural wrapper functions
 */
export function calculateFindingPriority(
  input: PriorityCalculationInput
): PriorityCalculationResult {
  return FindingPriorityEngine.calculate(input);
}

export function evaluateReachability(
  reachabilityInput?: number | ReachabilityContext,
  file?: string,
  symbol?: string
) {
  return FindingPriorityEngine.evaluateReachability(reachabilityInput, file, symbol);
}

export function rankFindingsByPriority(findings: ActionFinding[]): ActionFinding[] {
  return FindingPriorityEngine.rankFindings(findings);
}
