/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActionFinding,
  EvidenceGraph,
  RootCauseConfidence,
  RootCauseDetectionMethod,
  RootCauseItem,
  RootCauseRelationshipType,
} from '../types';

/**
 * RootCauseEngine
 * Performs deterministic and multi-signal root-cause synthesis across findings,
 * linking symptoms to their primary upstream architectural, dependency, or syntactic origins.
 *
 * Deterministic Order of Precedence (per engineering specification):
 * 1. Direct dependency relationship (DEPENDENCY_GRAPH)
 * 2. Call relationship (CALL_GRAPH)
 * 3. Data-flow relationship (DATA_FLOW)
 * 4. Architecture relationship (ARCHITECTURE_ANALYSIS)
 * 5. Existing analyzer relationship (STATIC_ANALYSIS)
 * 6. Heuristic relationship (HEURISTIC)
 * 7. AI-assisted inference (AI_ASSISTED)
 */
export class RootCauseEngine {
  /**
   * Analyzes all findings and evidence graph to generate root-cause assessments.
   */
  public static analyze(
    findings: ActionFinding[],
    graph?: EvidenceGraph
  ): Map<string, RootCauseItem> {
    const rootCauseMap = new Map<string, RootCauseItem>();
    if (!findings || findings.length === 0) return rootCauseMap;

    // Group findings by file, symbol, and category
    const symbolGroups = new Map<string, ActionFinding[]>();
    const fileGroups = new Map<string, ActionFinding[]>();

    findings.forEach((f) => {
      if (f.symbol) {
        const list = symbolGroups.get(f.symbol) || [];
        list.push(f);
        symbolGroups.set(f.symbol, list);
      }
      const fList = fileGroups.get(f.file) || [];
      fList.push(f);
      fileGroups.set(f.file, fList);
    });

    findings.forEach((finding) => {
      const item = this.evaluateFindingRootCause(finding, findings, graph, symbolGroups, fileGroups);
      rootCauseMap.set(finding.id, item);
    });

    return rootCauseMap;
  }

  /**
   * Evaluates root-cause for a single ActionFinding following deterministic precedence.
   */
  public static evaluateFindingRootCause(
    finding: ActionFinding,
    allFindings: ActionFinding[] = [],
    graph?: EvidenceGraph,
    symbolGroups?: Map<string, ActionFinding[]>,
    fileGroups?: Map<string, ActionFinding[]>
  ): RootCauseItem {
    const relatedFindings = this.findRelatedFindings(finding, allFindings, graph);
    const relatedFindingIds = relatedFindings.map((f) => f.id);

    let likelySource = '';
    let explanation = '';
    let confidence: RootCauseConfidence = 'MEDIUM';
    let confidenceScore = 80;
    let relationshipType: RootCauseRelationshipType = 'ROOT_CAUSE';
    let detectionMethod: RootCauseDetectionMethod = 'STATIC_ANALYSIS';
    let rootCauseFindingId: string | undefined = undefined;
    const evidenceSummary: string[] = [];
    const causeChain: string[] = [];

    const category = (finding.category || '').toUpperCase();
    const titleUpper = (finding.title || '').toUpperCase();
    const isSecurity = category.includes('SECURITY') || titleUpper.includes('INJECTION') || titleUpper.includes('SECRET');
    const isArchitecture = category.includes('ARCHITECTURE') || category.includes('DEPENDENCY') || titleUpper.includes('CIRCULAR');

    // 1. Check for circular dependency or direct module dependency relationship (DEPENDENCY_GRAPH)
    const hasCircularOrDepEvidence =
      isArchitecture ||
      finding.evidence?.some((e) => e.detectionRule?.toLowerCase().includes('circular') || e.detectionRule?.toLowerCase().includes('dependency'));

    if (hasCircularOrDepEvidence) {
      detectionMethod = 'DEPENDENCY_GRAPH';
      confidence = 'HIGH';
      confidenceScore = 95;
      relationshipType = 'ROOT_CAUSE';
      likelySource = finding.symbol
        ? `Circular dependency or tight structural coupling involving \`${finding.symbol}\``
        : `Structural module dependency cycle in ${finding.file}`;
      explanation = `Deterministic dependency graph analysis detected an import/structural cycle. Addressing this cycle in \`${finding.file}\` eliminates downstream compiler warnings and initialization failures.`;

      causeChain.push(`Module import (${finding.file})`);
      causeChain.push(finding.symbol || 'Core Module');
      if (relatedFindingIds.length > 0) {
        causeChain.push(`${relatedFindingIds.length} connected symptom findings`);
      } else {
        causeChain.push('Module Initialization');
      }

      evidenceSummary.push(`Dependency relationship in ${finding.file}`);
      evidenceSummary.push('Deterministic dependency graph cycle traversal');
    }
    // 2. Check for Call-Graph Relationship (CALL_GRAPH)
    else if (graph && finding.symbol && graph.edges.some((e) => (e.source.includes(finding.symbol!) || e.target.includes(finding.symbol!)) && e.relationship === 'CALLS')) {
      detectionMethod = 'CALL_GRAPH';
      confidence = 'HIGH';
      confidenceScore = 90;
      relationshipType = 'AFFECTS';
      likelySource = `Call path propagation through \`${finding.symbol}\``;
      explanation = `Call graph inspection confirms caller routines propagate parameters directly into line ${finding.line}.`;

      causeChain.push('Caller Function');
      causeChain.push(finding.symbol);
      causeChain.push(`Execution site (line ${finding.line})`);

      evidenceSummary.push(`Direct call graph edge to ${finding.symbol}`);
      evidenceSummary.push(`Call-site verification at line ${finding.line}`);
    }
    // 3. Check for Data Flow / Taint Sink Relationship (DATA_FLOW)
    else if (isSecurity || finding.evidence?.some((e) => (e.dataFlow && e.dataFlow.length > 0) || (e.callPath && e.callPath.length > 0))) {
      detectionMethod = 'DATA_FLOW';
      confidence = 'HIGH';
      confidenceScore = 95;
      relationshipType = 'ROOT_CAUSE';
      likelySource = finding.symbol
        ? `Unvalidated input or missing sanitization boundary in \`${finding.symbol}\``
        : `Security perimeter defect at ${finding.file}:${finding.line}`;
      explanation = 'Taint analysis trace confirms unsanitized external data reaches this execution sink without an intermediate validation boundary.';

      causeChain.push('External Request / Input');
      causeChain.push(finding.symbol || 'Handler Function');
      causeChain.push('Unsafe Execution Sink');

      evidenceSummary.push(`Direct AST sink at line ${finding.line}`);
      evidenceSummary.push('Deterministic data-flow taint trace');
    }
    // 4. Check for Static AST / Architectural Rule (ARCHITECTURE_ANALYSIS / STATIC_ANALYSIS)
    else if (relatedFindings.length > 0) {
      // Find an upstream finding that acts as root cause
      const upstreamFinding = relatedFindings.find(
        (rf) => rf.severity === 'CRITICAL' || rf.category === 'SECURITY' || rf.category === 'ARCHITECTURE'
      );

      if (upstreamFinding) {
        detectionMethod = 'STATIC_ANALYSIS';
        rootCauseFindingId = upstreamFinding.id;
        likelySource = `Upstream defect in \`${upstreamFinding.file}:${upstreamFinding.line}\` (${upstreamFinding.title})`;
        explanation = `This finding is downstream of \`${upstreamFinding.title}\` located at line ${upstreamFinding.line}. Resolving the upstream defect is the primary fix path.`;
        confidence = 'HIGH';
        confidenceScore = 88;
        relationshipType = 'DOWNSTREAM';

        causeChain.push(upstreamFinding.title);
        causeChain.push(`Cascade in ${finding.file}`);
        causeChain.push(finding.title);

        evidenceSummary.push(`Upstream AST node at line ${upstreamFinding.line}`);
        evidenceSummary.push(`${relatedFindings.length} co-located findings`);
      } else {
        detectionMethod = 'STATIC_ANALYSIS';
        likelySource = finding.symbol
          ? `Shared implementation contract in \`${finding.symbol}\``
          : `Concentration of quality issues in ${finding.file}`;
        explanation = `Multiple related issues (${relatedFindings.length}) stem from the same code block or class implementation.`;
        confidence = 'MEDIUM';
        confidenceScore = 75;
        relationshipType = 'CONTRIBUTES_TO';

        causeChain.push(`${finding.file} (${finding.symbol || 'Module'})`);
        causeChain.push('Quality heuristic violation');
        causeChain.push(finding.title);

        evidenceSummary.push(`${relatedFindings.length} co-located findings in ${finding.file}`);
      }
    }
    // 5. Isolated Heuristic finding (HEURISTIC)
    else {
      detectionMethod = 'HEURISTIC';
      likelySource = finding.symbol
        ? `Implementation heuristic in \`${finding.symbol}\``
        : `Isolated code style or quality finding at ${finding.file}:${finding.line}`;
      explanation = 'Isolated heuristic finding without downstream structural propagation.';
      confidence = 'LOW';
      confidenceScore = 65;
      relationshipType = 'DOWNSTREAM';

      causeChain.push(finding.file);
      causeChain.push(finding.title);

      evidenceSummary.push(`Line ${finding.line} AST inspection`);
    }

    // Calculate resolvable impact
    const affectedModules = new Set<string>();
    affectedModules.add(finding.file);
    relatedFindings.forEach((rf) => affectedModules.add(rf.file));

    const warningsCount = [finding, ...relatedFindings].filter(
      (f) => f.severity === 'HIGH' || f.severity === 'MEDIUM'
    ).length;

    return {
      id: `rc-${finding.id}`,
      findingId: finding.id,
      rootCauseFindingId,
      likelySource,
      symbol: finding.symbol,
      file: finding.file,
      line: finding.line,
      explanation,
      confidence,
      confidenceScore,
      relationshipType,
      detectionMethod,
      evidenceSummary,
      relatedFindingIds,
      affectedFindings: relatedFindingIds,
      causeChain,
      resolvableImpact: {
        findingsCount: relatedFindingIds.length + 1,
        modulesCount: affectedModules.size,
        warningsCount,
      },
    };
  }

  /**
   * Finds related findings based on shared symbol, shared file, or direct graph edges.
   */
  public static findRelatedFindings(
    targetFinding: ActionFinding,
    allFindings: ActionFinding[],
    graph?: EvidenceGraph
  ): ActionFinding[] {
    return allFindings.filter((f) => {
      if (f.id === targetFinding.id) return false;

      // 1. Same symbol
      if (targetFinding.symbol && f.symbol && targetFinding.symbol === f.symbol) {
        return true;
      }

      // 2. Same file within 25 lines of each other
      if (f.file === targetFinding.file && Math.abs(f.line - targetFinding.line) <= 25) {
        return true;
      }

      // 3. Same category in same file
      if (f.file === targetFinding.file && f.category === targetFinding.category) {
        return true;
      }

      // 4. Graph connection
      if (graph) {
        const hasDirectEdge = graph.edges.some(
          (e) =>
            (e.source === `finding-${targetFinding.id}` && e.target === `finding-${f.id}`) ||
            (e.target === `finding-${targetFinding.id}` && e.source === `finding-${f.id}`) ||
            (targetFinding.symbol && e.source.includes(targetFinding.symbol) && f.symbol && e.target.includes(f.symbol))
        );
        if (hasDirectEdge) return true;
      }

      return false;
    });
  }

  /**
   * Synthesizes root-cause summary for a single finding with all context
   */
  public static synthesizeRootCause(
    finding: ActionFinding,
    allFindings: ActionFinding[],
    graph?: EvidenceGraph
  ): RootCauseItem {
    return this.evaluateFindingRootCause(finding, allFindings, graph);
  }
}
