/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActionFinding,
  EvidenceGraph,
  ImpactAnalysis,
  ImpactRiskLevel,
} from '../types';
import { EvidenceGraphService } from './evidenceGraphService';

/**
 * In-memory cache for computed blast-radius / change impact calculations,
 * indexed by repository/workspace state and target identifier.
 */
const impactCache = new Map<string, { result: ImpactAnalysis; timestamp: number }>();

/**
 * ChangeImpactService
 * Performs blast-radius calculations with cycle detection and bounded traversal depth,
 * identifying direct and indirect dependents, affected modules, tests, public API exposure,
 * and security-sensitive component classifications.
 */
export class ChangeImpactService {
  /**
   * Clears or invalidates cached impact calculations (e.g., when repository or code changes).
   */
  public static invalidateCache(): void {
    impactCache.clear();
  }

  /**
   * Calculates comprehensive change impact / blast radius for a given target component or finding.
   */
  public static calculateImpact(
    targetName: string,
    graph: EvidenceGraph,
    findings: ActionFinding[] = [],
    depth: number = 2,
    workspaceVersion: string = 'v1'
  ): ImpactAnalysis {
    const cacheKey = `${workspaceVersion}:${targetName}:${depth}`;
    const cached = impactCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 60000) {
      return cached.result;
    }

    if (!graph || !graph.nodes || graph.nodes.length === 0) {
      const fallback: ImpactAnalysis = {
        target: targetName || 'Unknown Target',
        targetType: 'FUNCTION',
        riskLevel: 'UNKNOWN',
        confidence: 60,
        directDependents: [],
        indirectDependents: [],
        affectedFiles: [],
        affectedModules: [],
        affectedSymbols: [],
        affectedTests: [],
        affectedEndpoints: [],
        affectedDependencies: [],
        relatedFindings: [],
        depth,
        reasoning: `Impact analysis is partial because call-graph and dependency information is unavailable for \`${targetName}\`.`,
        isPublicApi: false,
        isSecuritySensitive: false,
        impactConfidenceRating: 'UNAVAILABLE',
        callGraphStatus: 'UNAVAILABLE',
        testStatus: 'UNAVAILABLE',
        workspaceVersion,
      };
      return fallback;
    }

    // Locate target node in graph
    const normalizedTarget = (targetName || '').toLowerCase();
    const targetNode =
      graph.nodes.find(
        (n) =>
          n.id === targetName ||
          n.id === `func-${targetName}` ||
          n.id === `class-${targetName}` ||
          n.id === `dep-${targetName}` ||
          n.id === `file-${targetName}` ||
          (n.label && n.label.toLowerCase() === normalizedTarget) ||
          (n.symbol && n.symbol.toLowerCase() === normalizedTarget)
      ) || graph.nodes[0];

    const targetType =
      targetNode.type === 'CLASS'
        ? 'CLASS'
        : targetNode.type === 'DEPENDENCY'
        ? 'DEPENDENCY'
        : targetNode.type === 'FILE'
        ? 'FILE'
        : 'FUNCTION';

    const directDependents = new Set<string>();
    const indirectDependents = new Set<string>();
    const affectedFiles = new Set<string>();
    const affectedModules = new Set<string>();
    const affectedSymbols = new Set<string>();
    const affectedTests = new Set<string>();
    const affectedEndpoints = new Set<string>();
    const affectedDependencies = new Set<string>();

    if (targetNode.file) {
      affectedFiles.add(targetNode.file);
    }
    if (targetNode.symbol) {
      affectedSymbols.add(targetNode.symbol);
    }

    // Cycle-safe BFS Traversal
    const visited = new Set<string>([targetNode.id]);
    let currentFrontier = new Set<string>([targetNode.id]);

    for (let d = 1; d <= depth; d++) {
      const nextFrontier = new Set<string>();

      currentFrontier.forEach((nodeId) => {
        // Find all incoming edges (callers, importers, dependents)
        graph.edges.forEach((edge) => {
          if (edge.target === nodeId) {
            const callerId = edge.source;
            if (!visited.has(callerId)) {
              visited.add(callerId);
              nextFrontier.add(callerId);

              const callerNode = graph.nodes.find((n) => n.id === callerId);
              if (callerNode) {
                const displayName = callerNode.label;
                if (d === 1) {
                  directDependents.add(displayName);
                } else {
                  indirectDependents.add(displayName);
                }

                if (callerNode.file) affectedFiles.add(callerNode.file);
                if (callerNode.symbol) affectedSymbols.add(callerNode.symbol);
                if (callerNode.type === 'DEPENDENCY') affectedModules.add(callerNode.label);
                if (callerNode.type === 'API_ENDPOINT') affectedEndpoints.add(callerNode.label);
                if (callerNode.type === 'TEST' || callerNode.label.toLowerCase().includes('test') || (callerNode.file && callerNode.file.toLowerCase().includes('test'))) {
                  affectedTests.add(callerNode.label);
                }
              }
            }
          }
        });
      });

      currentFrontier = nextFrontier;
      if (currentFrontier.size === 0) break;
    }

    // Check Public API Exposure
    const isPublicApi =
      targetNode.metadata?.isPublic === true ||
      directDependents.size >= 2 ||
      affectedFiles.size > 1;
    const publicApiConsumersCount = directDependents.size;

    // Check Security Sensitivity
    const targetNameLower = (targetNode.label || targetName || '').toLowerCase();
    const isSecuritySensitive =
      /auth|token|password|crypto|encrypt|session|jwt|credential|payment|checkout|permission|sanitize|sql|query|db/.test(
        targetNameLower
      ) ||
      findings.some(
        (f) =>
          (f.symbol === targetName || f.file === targetNode.file) &&
          f.category === 'SECURITY'
      );

    const securitySensitivityReason = isSecuritySensitive
      ? `Component handles sensitive authentication, credential, financial, or persistence operations. Changing logic requires security regression review.`
      : undefined;

    // Related findings affecting target or direct dependents
    const relatedFindings = findings
      .filter((f) => {
        if (f.symbol && f.symbol.toLowerCase() === normalizedTarget) return true;
        if (f.file && targetNode.file && f.file === targetNode.file) return true;
        return Array.from(directDependents).some((d) => d.includes(f.symbol || ''));
      })
      .map((f) => f.title);

    // Calculate Risk Level
    const totalAffected = directDependents.size + indirectDependents.size;
    let riskLevel: ImpactRiskLevel = 'LOW';
    if (
      isSecuritySensitive ||
      totalAffected >= 4 ||
      targetType === 'DEPENDENCY' ||
      targetType === 'FILE'
    ) {
      riskLevel = totalAffected >= 5 || isSecuritySensitive ? 'HIGH' : 'MEDIUM';
    } else if (totalAffected >= 2) {
      riskLevel = 'MEDIUM';
    } else if (totalAffected === 1) {
      riskLevel = 'LOW';
    }

    if (
      findings.some(
        (f) =>
          (f.symbol === targetName || f.file === targetNode.file) &&
          f.severity === 'CRITICAL' &&
          f.status === 'OPEN'
      )
    ) {
      riskLevel = 'CRITICAL';
    }

    // Generate Evidence-based reasoning
    let reasoning = '';
    if (totalAffected === 0) {
      reasoning = `Modifying \`${targetNode.label}\` has local blast radius (0 detected external callers in the current graph).`;
    } else if (directDependents.size > 0 && indirectDependents.size === 0) {
      reasoning = `Modifying \`${targetNode.label}\` directly affects ${directDependents.size} caller(s): ${Array.from(directDependents).join(', ')}.`;
    } else {
      reasoning = `Modifying \`${targetNode.label}\` directly affects ${directDependents.size} component(s) and cascades to ${indirectDependents.size} indirect dependent(s) across ${affectedFiles.size} file(s).`;
    }

    if (isPublicApi && publicApiConsumersCount > 1) {
      reasoning += ` Public API impact: imported by ${publicApiConsumersCount} distinct consumer components.`;
    }

    if (affectedTests.size > 0) {
      reasoning += ` Verify ${affectedTests.size} test suite(s): ${Array.from(affectedTests).join(', ')}.`;
    }

    const hasCallEdges = graph.edges.some((e) => e.relationship === 'CALLS');
    const callGraphStatus = hasCallEdges ? 'AVAILABLE' : 'PARTIAL';
    const testStatus = affectedTests.size > 0 ? 'AVAILABLE' : 'UNAVAILABLE';
    const impactConfidenceRating = totalAffected > 0 ? 'HIGH' : 'MEDIUM';

    const focusedGraph = EvidenceGraphService.extractFocusedGraph(graph, targetNode.id, depth);

    const result: ImpactAnalysis = {
      target: targetNode.label,
      targetType,
      riskLevel,
      confidence: 90,
      directDependents: Array.from(directDependents),
      indirectDependents: Array.from(indirectDependents),
      affectedFiles: Array.from(affectedFiles),
      affectedModules: Array.from(affectedModules),
      affectedSymbols: Array.from(affectedSymbols),
      affectedTests: Array.from(affectedTests),
      affectedEndpoints: Array.from(affectedEndpoints),
      affectedDependencies: Array.from(affectedDependencies),
      relatedFindings,
      depth,
      reasoning,
      graph: focusedGraph,
      isPublicApi,
      publicApiConsumersCount,
      isSecuritySensitive,
      securitySensitivityReason,
      impactConfidenceRating,
      callGraphStatus,
      testStatus,
      workspaceVersion,
    };

    impactCache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  }
}
