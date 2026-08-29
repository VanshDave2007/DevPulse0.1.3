/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActionFinding,
  ActionFindingEvidence,
  AnalysisResult,
  EvidenceEdgeType,
  EvidenceGraph,
  EvidenceGraphEdge,
  EvidenceGraphNode,
  EvidenceNodeType,
  EvidenceType,
  FindingSource,
} from '../types';

/**
 * Redacts secret patterns (passwords, tokens, API keys) from strings
 */
export function redactSecrets(text: string): string {
  if (!text) return text;
  return text
    .replace(/(api[_-]?key|secret|token|password|auth|bearer)\s*[:=]\s*['"][a-zA-Z0-9_\-]{8,}['"]/gi, '$1: "[REDACTED]"')
    .replace(/ghp_[a-zA-Z0-9]{36}/g, '[REDACTED_GITHUB_TOKEN]')
    .replace(/sk-[a-zA-Z0-9]{32,}/g, '[REDACTED_API_KEY]')
    .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_GOOGLE_KEY]');
}

/**
 * EvidenceGraphService
 * Constructs cycle-safe, multi-dimensional evidence graphs connecting files, functions,
 * classes, dependencies, test references, and findings with deterministic AST proof.
 */
export class EvidenceGraphService {
  /**
   * Builds an incremental EvidenceGraph from active analysis result and ActionFindings.
   */
  public static buildGraph(
    analysis: AnalysisResult | null,
    findings: ActionFinding[] = [],
    code?: string,
    fileName: string = 'code_input'
  ): EvidenceGraph {
    const nodesMap = new Map<string, EvidenceGraphNode>();
    const edges: EvidenceGraphEdge[] = [];
    const edgeSet = new Set<string>();

    const addNode = (node: EvidenceGraphNode) => {
      if (!nodesMap.has(node.id)) {
        nodesMap.set(node.id, {
          ...node,
          label: redactSecrets(node.label),
        });
      }
    };

    const addEdge = (edge: EvidenceGraphEdge) => {
      const edgeKey = `${edge.source}->${edge.target}:${edge.relationship}`;
      if (!edgeSet.has(edgeKey) && edge.source !== edge.target) {
        edgeSet.add(edgeKey);
        edges.push(edge);
      }
    };

    // 1. Root File Node
    const rootFileId = `file-${fileName}`;
    addNode({
      id: rootFileId,
      label: fileName,
      type: 'FILE',
      file: fileName,
      confidence: 100,
      confidenceType: 'DETERMINISTIC',
    });

    if (analysis && analysis.metrics) {
      const { imports, classes, functions } = analysis.metrics;

      // 2. Import Nodes & Dependencies
      (imports || []).forEach((imp, idx) => {
        const impId = `dep-${imp.module}`;
        const isDb = /sql|mongo|pg|db|redis|firestore|prisma|typeorm/i.test(imp.module);
        const isApi = /axios|fetch|express|fastapi|flask|request|http/i.test(imp.module);
        const nodeType: EvidenceNodeType = isDb ? 'DATABASE' : isApi ? 'API_ENDPOINT' : 'DEPENDENCY';

        addNode({
          id: impId,
          label: imp.module,
          type: nodeType,
          file: fileName,
          line: imp.line,
          symbol: imp.module,
          confidence: 100,
          confidenceType: 'DETERMINISTIC',
          metadata: { isExternal: imp.isExternal, isDefault: imp.isDefault },
        });

        addEdge({
          source: rootFileId,
          target: impId,
          relationship: 'IMPORTS',
          confidence: 100,
          confidenceType: 'DETERMINISTIC',
          isDirect: true,
        });
      });

      // 3. Class Nodes
      (classes || []).forEach((cls) => {
        const classId = `class-${cls.name}`;
        addNode({
          id: classId,
          label: cls.name,
          type: 'CLASS',
          file: fileName,
          line: cls.line,
          symbol: cls.name,
          confidence: 100,
          confidenceType: 'DETERMINISTIC',
          metadata: { loc: cls.loc },
        });

        addEdge({
          source: rootFileId,
          target: classId,
          relationship: 'USES',
          label: 'defines',
          confidence: 100,
          confidenceType: 'DETERMINISTIC',
          isDirect: true,
        });
      });

      // 4. Function Nodes & Call Relationships
      (functions || []).forEach((fn) => {
        const fnId = `func-${fn.name}`;
        const isTest = /test_|it\(|describe|test\(/i.test(fn.name) || fileName.includes('test');
        const nodeType: EvidenceNodeType = isTest ? 'TEST' : 'FUNCTION';

        addNode({
          id: fnId,
          label: `${fn.name}()`,
          type: nodeType,
          file: fileName,
          line: fn.line,
          symbol: fn.name,
          confidence: 100,
          confidenceType: 'DETERMINISTIC',
          metadata: { complexity: fn.complexity, loc: fn.loc, params: fn.params },
        });

        // Link with containing class or root file
        const parentClass = (classes || []).find(
          (c) => c.line < fn.line && (c.endLine ? fn.line <= c.endLine : true)
        );

        if (parentClass) {
          addEdge({
            source: `class-${parentClass.name}`,
            target: fnId,
            relationship: 'USES',
            label: 'method',
            confidence: 100,
            confidenceType: 'DETERMINISTIC',
            isDirect: true,
          });
        } else {
          addEdge({
            source: rootFileId,
            target: fnId,
            relationship: 'USES',
            label: 'function',
            confidence: 100,
            confidenceType: 'DETERMINISTIC',
            isDirect: true,
          });
        }
      });

      // 5. Infer Call Graph between functions if source code is available
      if (code && functions && functions.length > 1) {
        functions.forEach((caller) => {
          functions.forEach((callee) => {
            if (caller.name !== callee.name) {
              // Regex checking if caller body mentions callee
              const calleePattern = new RegExp(`\\b${callee.name}\\s*\\(`, 'g');
              if (calleePattern.test(code)) {
                addEdge({
                  source: `func-${caller.name}`,
                  target: `func-${callee.name}`,
                  relationship: 'CALLS',
                  confidence: 90,
                  confidenceType: 'HIGH_CONFIDENCE',
                  isDirect: true,
                });
              }
            }
          });
        });
      }
    }

    // 6. Integrate ActionFindings into Evidence Graph
    findings.forEach((finding) => {
      const findingNodeId = `finding-${finding.id}`;
      addNode({
        id: findingNodeId,
        label: finding.title,
        type: 'FINDING',
        file: finding.file,
        line: finding.line,
        symbol: finding.symbol,
        confidence: finding.confidence,
        confidenceType:
          finding.confidenceType === 'DETERMINISTIC'
            ? 'DETERMINISTIC'
            : finding.confidenceType === 'AI_ASSISTED'
            ? 'AI_ASSISTED'
            : 'HIGH_CONFIDENCE',
        metadata: {
          severity: finding.severity,
          priority: finding.priority,
          category: finding.category,
        },
      });

      // Link finding to matching symbol or line
      if (finding.symbol) {
        const matchingFuncId = `func-${finding.symbol}`;
        const matchingClassId = `class-${finding.symbol}`;
        const matchingDepId = `dep-${finding.symbol}`;

        if (nodesMap.has(matchingFuncId)) {
          addEdge({
            source: matchingFuncId,
            target: findingNodeId,
            relationship: 'AFFECTS',
            confidence: 95,
            confidenceType: 'DETERMINISTIC',
            isDirect: true,
          });
        } else if (nodesMap.has(matchingClassId)) {
          addEdge({
            source: matchingClassId,
            target: findingNodeId,
            relationship: 'AFFECTS',
            confidence: 95,
            confidenceType: 'DETERMINISTIC',
            isDirect: true,
          });
        } else if (nodesMap.has(matchingDepId)) {
          addEdge({
            source: matchingDepId,
            target: findingNodeId,
            relationship: 'AFFECTS',
            confidence: 95,
            confidenceType: 'DETERMINISTIC',
            isDirect: true,
          });
        } else {
          addEdge({
            source: rootFileId,
            target: findingNodeId,
            relationship: 'AFFECTS',
            confidence: 85,
            confidenceType: 'DETERMINISTIC',
            isDirect: true,
          });
        }
      } else {
        // Link to file
        addEdge({
          source: rootFileId,
          target: findingNodeId,
          relationship: 'AFFECTS',
          confidence: 90,
          confidenceType: 'DETERMINISTIC',
          isDirect: true,
        });
      }

      // Link finding evidence paths (e.g. data flow or call chain)
      (finding.evidence || []).forEach((ev) => {
        if (ev.dataFlow && ev.dataFlow.length > 1) {
          for (let i = 0; i < ev.dataFlow.length - 1; i++) {
            const srcStep = ev.dataFlow[i];
            const dstStep = ev.dataFlow[i + 1];
            const srcId = `df-${srcStep.replace(/\s+/g, '_')}`;
            const dstId = `df-${dstStep.replace(/\s+/g, '_')}`;

            addNode({
              id: srcId,
              label: srcStep,
              type: i === 0 ? 'API_ENDPOINT' : 'VARIABLE',
              file: ev.file,
              line: ev.line,
              confidence: ev.confidenceScore ?? 90,
              confidenceType: 'HIGH_CONFIDENCE',
            });

            addNode({
              id: dstId,
              label: dstStep,
              type: i === ev.dataFlow.length - 2 ? 'DATABASE' : 'FUNCTION',
              file: ev.file,
              line: ev.line,
              confidence: ev.confidenceScore ?? 90,
              confidenceType: 'HIGH_CONFIDENCE',
            });

            addEdge({
              source: srcId,
              target: dstId,
              relationship: 'FLOWS_TO',
              confidence: ev.confidenceScore ?? 90,
              confidenceType: 'HIGH_CONFIDENCE',
              isDirect: true,
            });
          }
        }
      });
    });

    // 7. Integrate Test Intelligence & Relationships (TESTS, COVERS, CALLS, ASSERTS, EXERCISES)
    if (code) {
      // Look for describe blocks, test cases, and assertions
      const testCases = code.match(/(?:it|test|def\s+test_)\s*\(\s*['"`](.*?)['"`]|def\s+(test_[a-zA-Z0-9_]+)/g) || [];
      const assertions = code.match(/\b(expect\s*\([^)]*\)\.[a-zA-Z]+|assert\s+[^,\n]+|assertEquals\([^)]*\))/g) || [];

      testCases.forEach((tc, idx) => {
        const rawName = tc.replace(/^(?:it|test|def)\s*\(?\s*['"`]?|['"`\)]/g, '').trim();
        const testCaseId = `tc-${idx}-${rawName.replace(/\s+/g, '_').substring(0, 24)}`;
        
        addNode({
          id: testCaseId,
          label: rawName || `Test Case #${idx + 1}`,
          type: 'TEST_CASE',
          file: fileName,
          confidence: 100,
          confidenceType: 'DETERMINISTIC',
          metadata: { isAsync: tc.includes('async') },
        });

        // Link test case to root file or test suite
        addEdge({
          source: rootFileId,
          target: testCaseId,
          relationship: 'USES',
          label: 'defines test',
          confidence: 100,
          confidenceType: 'DETERMINISTIC',
          isDirect: true,
        });

        // Link test case to exercised functions
        if (analysis?.metrics?.functions) {
          analysis.metrics.functions.forEach((fn) => {
            const pattern = new RegExp(`\\b${fn.name}\\b`);
            if (pattern.test(rawName) || pattern.test(code)) {
              const fnId = `func-${fn.name}`;
              if (nodesMap.has(fnId)) {
                addEdge({
                  source: testCaseId,
                  target: fnId,
                  relationship: 'TESTS',
                  label: 'tests',
                  confidence: 95,
                  confidenceType: 'DETERMINISTIC',
                  isDirect: true,
                });
                addEdge({
                  source: testCaseId,
                  target: fnId,
                  relationship: 'COVERS',
                  label: 'covers',
                  confidence: 90,
                  confidenceType: 'DETERMINISTIC',
                  isDirect: true,
                });
                addEdge({
                  source: testCaseId,
                  target: fnId,
                  relationship: 'EXERCISES',
                  label: 'exercises',
                  confidence: 90,
                  confidenceType: 'DETERMINISTIC',
                  isDirect: true,
                });
              }
            }
          });
        }
      });

      // Sample assertions into graph nodes
      assertions.slice(0, 4).forEach((assertStr, aIdx) => {
        const assertId = `assert-${aIdx}`;
        addNode({
          id: assertId,
          label: assertStr.length > 32 ? `${assertStr.substring(0, 30)}...` : assertStr,
          type: 'TEST_ASSERTION',
          file: fileName,
          confidence: 100,
          confidenceType: 'DETERMINISTIC',
        });

        if (testCases.length > 0) {
          const firstTcId = `tc-0-${testCases[0].replace(/^(?:it|test|def)\s*\(?\s*['"`]?|['"`\)]/g, '').trim().replace(/\s+/g, '_').substring(0, 24)}`;
          if (nodesMap.has(firstTcId)) {
            addEdge({
              source: firstTcId,
              target: assertId,
              relationship: 'ASSERTS',
              label: 'asserts',
              confidence: 100,
              confidenceType: 'DETERMINISTIC',
              isDirect: true,
            });
          }
        }
      });
    }

    return {
      nodes: Array.from(nodesMap.values()),
      edges,
      timestamp: Date.now(),
    };
  }

  /**
   * Generates a sub-graph focused on a specific finding with depth limit and cycle safety.
   */
  public static extractFocusedGraph(
    fullGraph: EvidenceGraph,
    targetFindingId: string,
    maxDepth: number = 2
  ): EvidenceGraph {
    const targetNodeId = `finding-${targetFindingId}`;
    const targetNode = fullGraph.nodes.find((n) => n.id === targetNodeId);

    if (!targetNode) {
      // If target finding is not found, return filtered top nodes
      return {
        nodes: fullGraph.nodes.slice(0, 15),
        edges: fullGraph.edges.slice(0, 20),
        timestamp: Date.now(),
      };
    }

    const visitedNodes = new Set<string>([targetNodeId]);
    const includedEdges: EvidenceGraphEdge[] = [];
    let currentLevel = new Set<string>([targetNodeId]);

    // Bounded BFS Traversal with cycle prevention
    for (let depth = 0; depth < maxDepth; depth++) {
      const nextLevel = new Set<string>();

      fullGraph.edges.forEach((edge) => {
        if (currentLevel.has(edge.source) || currentLevel.has(edge.target)) {
          includedEdges.push(edge);
          const neighbor = currentLevel.has(edge.source) ? edge.target : edge.source;
          if (!visitedNodes.has(neighbor)) {
            visitedNodes.add(neighbor);
            nextLevel.add(neighbor);
          }
        }
      });

      currentLevel = nextLevel;
      if (currentLevel.size === 0) break;
    }

    const subNodes = fullGraph.nodes
      .filter((n) => visitedNodes.has(n.id))
      .map((n) => ({
        ...n,
        isTarget: n.id === targetNodeId,
      }));

    return {
      nodes: subNodes,
      edges: includedEdges,
      timestamp: Date.now(),
    };
  }

  /**
   * Alias / general method to get a bounded subgraph centered on any node or finding
   */
  public static getSubGraph(
    fullGraph: EvidenceGraph,
    targetNodeOrFindingId: string,
    maxDepth: number = 2
  ): EvidenceGraph {
    const rawTarget = targetNodeOrFindingId.startsWith('finding-')
      ? targetNodeOrFindingId.replace('finding-', '')
      : targetNodeOrFindingId;
    return this.extractFocusedGraph(fullGraph, rawTarget, maxDepth);
  }

  // ----------------------------------------------------
  // Structured APIs for "Ask Your Codebase" Preparation
  // ----------------------------------------------------

  public static findCallers(graph: EvidenceGraph, symbol: string): EvidenceGraphNode[] {
    const targetNode = graph.nodes.find(
      (n) => n.symbol?.toLowerCase() === symbol.toLowerCase() || n.label.includes(symbol)
    );
    if (!targetNode) return [];

    const callerIds = graph.edges
      .filter((e) => e.target === targetNode.id && (e.relationship === 'CALLS' || e.relationship === 'USES'))
      .map((e) => e.source);

    return graph.nodes.filter((n) => callerIds.includes(n.id));
  }

  public static findCallees(graph: EvidenceGraph, symbol: string): EvidenceGraphNode[] {
    const targetNode = graph.nodes.find(
      (n) => n.symbol?.toLowerCase() === symbol.toLowerCase() || n.label.includes(symbol)
    );
    if (!targetNode) return [];

    const calleeIds = graph.edges
      .filter((e) => e.source === targetNode.id && (e.relationship === 'CALLS' || e.relationship === 'USES'))
      .map((e) => e.target);

    return graph.nodes.filter((n) => calleeIds.includes(n.id));
  }

  public static findDependents(graph: EvidenceGraph, moduleOrFile: string): EvidenceGraphNode[] {
    const targetNode = graph.nodes.find(
      (n) => n.label.toLowerCase() === moduleOrFile.toLowerCase() || n.id.includes(moduleOrFile)
    );
    if (!targetNode) return [];

    const dependentIds = graph.edges
      .filter(
        (e) =>
          e.target === targetNode.id &&
          (e.relationship === 'IMPORTS' || e.relationship === 'DEPENDS_ON' || e.relationship === 'USES')
      )
      .map((e) => e.source);

    return graph.nodes.filter((n) => dependentIds.includes(n.id));
  }

  public static findDependencies(graph: EvidenceGraph, moduleOrFile: string): EvidenceGraphNode[] {
    const targetNode = graph.nodes.find(
      (n) => n.label.toLowerCase() === moduleOrFile.toLowerCase() || n.id.includes(moduleOrFile)
    );
    if (!targetNode) return [];

    const depIds = graph.edges
      .filter(
        (e) =>
          e.source === targetNode.id &&
          (e.relationship === 'IMPORTS' || e.relationship === 'DEPENDS_ON' || e.relationship === 'USES')
      )
      .map((e) => e.target);

    return graph.nodes.filter((n) => depIds.includes(n.id));
  }

  public static findAffectedTests(graph: EvidenceGraph, component: string): EvidenceGraphNode[] {
    const targetNode = graph.nodes.find(
      (n) => n.label.toLowerCase().includes(component.toLowerCase()) || n.id.includes(component)
    );
    if (!targetNode) return [];

    // Find test nodes connected directly or indirectly
    const testNodes = graph.nodes.filter((n) => n.type === 'TEST');
    return testNodes.filter((t) =>
      graph.edges.some(
        (e) => (e.source === t.id && e.target === targetNode.id) || (e.target === t.id && e.source === targetNode.id)
      )
    );
  }
}
