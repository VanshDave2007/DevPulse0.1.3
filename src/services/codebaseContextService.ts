/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActionFinding,
  AnalysisResult,
  CodeNode,
  CodeNodeType,
  CodeRelationship,
  CodeRelationshipType,
  CodebaseContextGraph,
  ContextPacket,
  DiscoveredTestCase,
  GraphDiffResult,
  ImpactRiskLevel,
  ProjectMemory,
  SupportedLanguage,
} from '../types';
import { ProjectMemoryService } from './projectMemoryService';
import { SymbolResolutionService } from './symbolResolutionService';
import { TestIntelligenceService } from './testIntelligenceService';
import { redactSecrets } from './evidenceGraphService';

/**
 * Generates a stable node identifier across audits.
 * Format: {filePath}::{qualifiedName}::{type}
 */
export function buildStableNodeId(
  filePath: string,
  qualifiedName: string,
  type: CodeNodeType
): string {
  const cleanFile = filePath.replace(/^[./]+/, '').trim() || 'root';
  const cleanSym = (qualifiedName || 'anonymous').trim();
  return `${cleanFile}::${cleanSym}::${type}`;
}

/**
 * CodebaseContextService
 * Unified repository relationship graph, symbol index, and context query engine for DevPulse.
 * Connects files, classes, functions, methods, imports, dependencies, endpoints, tests,
 * and findings with deterministic traceability.
 */
export class CodebaseContextService {
  private static activeGraph: CodebaseContextGraph | null = null;

  // ---------------------------------------------------------------------------
  // GRAPH BUILD & INCREMENTAL UPDATE
  // ---------------------------------------------------------------------------

  /**
   * Builds or rebuilds the complete CodebaseContextGraph from source files,
   * deterministic AST metrics, discovered tests, and active findings.
   */
  public static buildGraph(
    files: Array<{ path: string; content: string; language?: SupportedLanguage }>,
    analysis: AnalysisResult | null = null,
    findings: ActionFinding[] = [],
    projectName: string = 'devpulse-project'
  ): CodebaseContextGraph {
    const nodesMap = new Map<string, CodeNode>();
    const edges: CodeRelationship[] = [];
    const edgeSet = new Set<string>();

    const fileMap: Record<string, string[]> = {};
    const symbolIndex: Record<string, string[]> = {};
    const callersMap: Record<string, string[]> = {};
    const calleesMap: Record<string, string[]> = {};
    const dependentsMap: Record<string, string[]> = {};
    const dependenciesMap: Record<string, string[]> = {};
    const testCoverageMap: Record<string, string[]> = {};
    const findingMap: Record<string, string[]> = {};

    const addNode = (node: CodeNode) => {
      if (!nodesMap.has(node.id)) {
        nodesMap.set(node.id, {
          ...node,
          name: redactSecrets(node.name),
          qualifiedName: redactSecrets(node.qualifiedName),
        });

        // Index in fileMap
        if (!fileMap[node.filePath]) fileMap[node.filePath] = [];
        fileMap[node.filePath].push(node.id);

        // Index in symbolIndex
        const lowerName = node.name.toLowerCase();
        if (!symbolIndex[lowerName]) symbolIndex[lowerName] = [];
        if (!symbolIndex[lowerName].includes(node.id)) {
          symbolIndex[lowerName].push(node.id);
        }
      }
    };

    const addEdge = (
      sourceId: string,
      targetId: string,
      type: CodeRelationshipType,
      confidence = 100,
      isDeterministic = true,
      evidenceSnippet?: string,
      line?: number
    ) => {
      if (sourceId === targetId || !sourceId || !targetId) return;
      const edgeKey = `${sourceId}->${targetId}:${type}`;
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        const edgeId = `edge-${edges.length + 1}-${type.toLowerCase()}`;
        edges.push({
          id: edgeId,
          source: sourceId,
          target: targetId,
          type,
          confidence,
          isDeterministic,
          evidenceSnippet,
          line,
        });

        // Update specialized maps
        if (type === 'CALLS') {
          if (!calleesMap[sourceId]) calleesMap[sourceId] = [];
          if (!calleesMap[sourceId].includes(targetId)) calleesMap[sourceId].push(targetId);

          if (!callersMap[targetId]) callersMap[targetId] = [];
          if (!callersMap[targetId].includes(sourceId)) callersMap[targetId].push(sourceId);
        } else if (type === 'IMPORTS' || type === 'DEPENDS_ON') {
          if (!dependenciesMap[sourceId]) dependenciesMap[sourceId] = [];
          if (!dependenciesMap[sourceId].includes(targetId)) dependenciesMap[sourceId].push(targetId);

          if (!dependentsMap[targetId]) dependentsMap[targetId] = [];
          if (!dependentsMap[targetId].includes(sourceId)) dependentsMap[targetId].push(sourceId);
        } else if (type === 'TESTS') {
          if (!testCoverageMap[targetId]) testCoverageMap[targetId] = [];
          if (!testCoverageMap[targetId].includes(sourceId)) testCoverageMap[targetId].push(sourceId);
        } else if (type === 'AFFECTED_BY') {
          if (!findingMap[sourceId]) findingMap[sourceId] = [];
          if (!findingMap[sourceId].includes(targetId)) findingMap[sourceId].push(targetId);
        }
      }
    };

    // 1. Root Repository Node
    const repoNodeId = `repo::${projectName}::REPOSITORY`;
    addNode({
      id: repoNodeId,
      type: 'REPOSITORY',
      name: projectName,
      qualifiedName: projectName,
      filePath: '/',
      lineStart: 1,
      lineEnd: 1,
      language: 'generic',
      metadata: { fileCount: files.length },
    });

    // 2. Iterate through project files
    for (const file of files) {
      const filePath = file.path.trim();
      const code = file.content || '';
      const language = file.language || 'typescript';
      const lines = code.split('\n');

      const fileNodeId = buildStableNodeId(filePath, filePath, 'FILE');
      addNode({
        id: fileNodeId,
        type: 'FILE',
        name: filePath.split('/').pop() || filePath,
        qualifiedName: filePath,
        filePath: filePath,
        lineStart: 1,
        lineEnd: Math.max(1, lines.length),
        language,
        metadata: { loc: lines.length },
      });

      addEdge(repoNodeId, fileNodeId, 'CONTAINS');

      // 3. Extract program symbols (functions, classes, interfaces, endpoints, imports)
      const symbols = SymbolResolutionService.extractSymbols(code, filePath, language);
      const funcNodesMap = new Map<string, string>(); // symbol name -> nodeId

      // Classes & Methods
      symbols.forEach((sym) => {
        if (sym.symbolType === 'class' || sym.symbolType === 'interface') {
          const classType: CodeNodeType = sym.symbolType === 'class' ? 'CLASS' : 'INTERFACE';
          const classNodeId = buildStableNodeId(filePath, sym.name, classType);
          addNode({
            id: classNodeId,
            type: classType,
            name: sym.name,
            qualifiedName: `${filePath}::${sym.name}`,
            filePath,
            lineStart: sym.startLine,
            lineEnd: sym.endLine,
            language,
            metadata: {
              isPublic: sym.isPublic,
              docstring: sym.docstring,
            },
          });

          addEdge(fileNodeId, classNodeId, 'DEFINES');
          funcNodesMap.set(sym.name, classNodeId);
        }
      });

      // Functions & Methods
      symbols.forEach((sym) => {
        if (sym.symbolType === 'function' || sym.symbolType === 'method') {
          const isMethod = sym.symbolType === 'method' || sym.qualifiedName.includes('::');
          const fnType: CodeNodeType = isMethod ? 'METHOD' : 'FUNCTION';
          const fnNodeId = buildStableNodeId(filePath, sym.qualifiedName || sym.name, fnType);
          const paramNames = (sym.parameters || []).map((p) => p.name);
          addNode({
            id: fnNodeId,
            type: fnType,
            name: sym.name,
            qualifiedName: `${filePath}::${sym.name}`,
            filePath,
            lineStart: sym.startLine,
            lineEnd: sym.endLine,
            language,
            metadata: {
              isPublic: sym.isPublic,
              isAsync: sym.isAsync,
              parameters: paramNames,
              returnType: sym.returnType,
              docstring: sym.docstring,
              loc: sym.endLine - sym.startLine + 1,
            },
          });

          addEdge(fileNodeId, fnNodeId, 'DEFINES');
          funcNodesMap.set(sym.name, fnNodeId);
        }
      });

      // API Endpoints
      symbols.forEach((sym) => {
        if (sym.symbolType === 'endpoint') {
          const endpointNodeId = buildStableNodeId(filePath, sym.name, 'API_ENDPOINT');
          addNode({
            id: endpointNodeId,
            type: 'API_ENDPOINT',
            name: sym.name,
            qualifiedName: sym.qualifiedName || `${filePath}::${sym.name}`,
            filePath,
            lineStart: sym.startLine,
            lineEnd: sym.endLine,
            language,
            metadata: {
              endpointMethod: sym.name.split(' ')[0],
              endpointPath: sym.name.split(' ')[1],
              isPublic: true,
            },
          });

          addEdge(fileNodeId, endpointNodeId, 'EXPOSES');

          // Link endpoint to functions in the file
          symbols.forEach((innerSym) => {
            if (
              (innerSym.symbolType === 'function' || innerSym.symbolType === 'method') &&
              innerSym.startLine >= sym.startLine &&
              innerSym.startLine <= sym.endLine + 15
            ) {
              const targetFnId = buildStableNodeId(filePath, innerSym.qualifiedName || innerSym.name, innerSym.symbolType === 'method' ? 'METHOD' : 'FUNCTION');
              addEdge(endpointNodeId, targetFnId, 'ROUTES_TO', 90, true);
            }
          });
        }
      });

      // External Imports and Packages
      symbols.forEach((sym) => {
        if (sym.symbolType === 'import') {
          const isDb = /sql|mongo|pg|db|redis|firestore|prisma|typeorm|sqlite|cassandra/i.test(sym.name);
          const depType: CodeNodeType = isDb ? 'DEPENDENCY' : 'DEPENDENCY';
          const depNodeId = `dep::${sym.name}::DEPENDENCY`;

          addNode({
            id: depNodeId,
            type: depType,
            name: sym.name,
            qualifiedName: sym.name,
            filePath,
            lineStart: sym.startLine,
            lineEnd: sym.endLine,
            language,
            metadata: {
              isExternal: true,
              isDatabase: isDb,
            },
          });

          addEdge(fileNodeId, depNodeId, 'IMPORTS', 100, true, `import ${sym.name}`, sym.startLine);
        }
      });

      // 4. Extract Statically Determinable Call Graphs
      symbols.forEach((callerSym) => {
        if (callerSym.symbolType === 'function' || callerSym.symbolType === 'method') {
          const callerId = buildStableNodeId(filePath, callerSym.qualifiedName || callerSym.name, callerSym.symbolType === 'method' ? 'METHOD' : 'FUNCTION');
          const fnBodyLines = lines.slice(callerSym.startLine - 1, callerSym.endLine);
          const fnBodyText = fnBodyLines.join('\n');

          // Check if it calls any other known symbols
          symbols.forEach((calleeSym) => {
            if (
              calleeSym.name !== callerSym.name &&
              (calleeSym.symbolType === 'function' || calleeSym.symbolType === 'method')
            ) {
              const callRegex = new RegExp(`\\b${calleeSym.name}\\s*\\(`, 'g');
              if (callRegex.test(fnBodyText)) {
                const calleeId = buildStableNodeId(filePath, calleeSym.qualifiedName || calleeSym.name, calleeSym.symbolType === 'method' ? 'METHOD' : 'FUNCTION');
                addEdge(callerId, calleeId, 'CALLS', 95, true, `${callerSym.name} calls ${calleeSym.name}`);
              }
            }
          });
        }
      });
    }

    // 5. Integrate Existing Analyzer Metrics if provided
    if (analysis && analysis.metrics) {
      const { imports, classes, functions } = analysis.metrics;
      const targetFile = files[0]?.path || 'active_file';
      const fileNodeId = buildStableNodeId(targetFile, targetFile, 'FILE');

      (imports || []).forEach((imp) => {
        const depNodeId = `dep::${imp.module}::DEPENDENCY`;
        addNode({
          id: depNodeId,
          type: 'DEPENDENCY',
          name: imp.module,
          qualifiedName: imp.module,
          filePath: targetFile,
          lineStart: imp.line,
          lineEnd: imp.line,
          language: analysis.language,
          metadata: { isExternal: imp.isExternal, isDefault: imp.isDefault },
        });
        addEdge(fileNodeId, depNodeId, 'IMPORTS', 100, true, undefined, imp.line);
      });

      (classes || []).forEach((cls) => {
        const classNodeId = buildStableNodeId(targetFile, cls.name, 'CLASS');
        addNode({
          id: classNodeId,
          type: 'CLASS',
          name: cls.name,
          qualifiedName: `${targetFile}::${cls.name}`,
          filePath: targetFile,
          lineStart: cls.line,
          lineEnd: cls.endLine,
          language: analysis.language,
          metadata: {
            loc: cls.loc,
            methodsCount: cls.methodsCount,
            inheritance: cls.inheritance,
          },
        });
        addEdge(fileNodeId, classNodeId, 'DEFINES');

        if (cls.inheritance) {
          const parentClassNodeId = buildStableNodeId(targetFile, cls.inheritance, 'CLASS');
          addEdge(classNodeId, parentClassNodeId, 'INHERITS', 95, true);
        }
      });

      (functions || []).forEach((fn) => {
        const fnNodeId = buildStableNodeId(targetFile, fn.name, 'FUNCTION');
        addNode({
          id: fnNodeId,
          type: 'FUNCTION',
          name: fn.name,
          qualifiedName: `${targetFile}::${fn.name}`,
          filePath: targetFile,
          lineStart: fn.line,
          lineEnd: fn.endLine,
          language: analysis.language,
          metadata: {
            loc: fn.loc,
            params: fn.paramNames,
            complexity: fn.complexity,
            cognitiveComplexity: fn.cognitiveComplexity,
            nesting: fn.nesting,
            isAsync: fn.isAsync,
          },
        });
        addEdge(fileNodeId, fnNodeId, 'DEFINES');
      });
    }

    // 6. Integrate Discovered Tests
    for (const file of files) {
      const framework = TestIntelligenceService.detectTestFramework(file.content, file.path, file.language || 'typescript');
      const discoveredTests = TestIntelligenceService.discoverTests(file.content, file.path, framework);

      discoveredTests.forEach((test) => {
        const testNodeId = buildStableNodeId(file.path, test.name, 'TEST');
        addNode({
          id: testNodeId,
          type: 'TEST',
          name: test.name,
          qualifiedName: `${file.path}::${test.suite}::${test.name}`,
          filePath: file.path,
          lineStart: test.line,
          lineEnd: test.line + 5,
          language: file.language || 'typescript',
          metadata: {
            suite: test.suite,
            testType: test.testType,
            assertionsCount: test.assertionsCount,
            exercisesSymbols: test.exercisesSymbols,
          },
        });

        // Link test to exercised symbols
        (test.exercisesSymbols || []).forEach((symName) => {
          const matchingNodeIds = symbolIndex[symName.toLowerCase()] || [];
          matchingNodeIds.forEach((targetId) => {
            addEdge(testNodeId, targetId, 'TESTS', 90, true, `Test "${test.name}" exercises ${symName}`);
          });
        });
      });
    }

    // 7. Integrate ActionFindings
    findings.forEach((finding) => {
      const findingNodeId = `finding::${finding.id}::FINDING`;
      addNode({
        id: findingNodeId,
        type: 'FINDING',
        name: finding.title,
        qualifiedName: `${finding.file}::FINDING_${finding.id}`,
        filePath: finding.file,
        lineStart: finding.line || 1,
        lineEnd: finding.line || 1,
        language: 'generic',
        metadata: {
          findingSeverity: finding.severity,
          findingCategory: finding.category,
          findingProblem: finding.description || finding.title,
          confidence: finding.confidence,
        },
      });

      // Link finding to target symbol or file
      if (finding.symbol) {
        const targetIds = symbolIndex[finding.symbol.toLowerCase()] || [];
        if (targetIds.length > 0) {
          targetIds.forEach((targetId) => {
            addEdge(targetId, findingNodeId, 'AFFECTED_BY', 95, true, finding.title);
          });
        } else {
          const fileNodeId = buildStableNodeId(finding.file, finding.file, 'FILE');
          addEdge(fileNodeId, findingNodeId, 'AFFECTED_BY', 90, true, finding.title);
        }
      } else {
        const fileNodeId = buildStableNodeId(finding.file, finding.file, 'FILE');
        addEdge(fileNodeId, findingNodeId, 'AFFECTED_BY', 90, true, finding.title);
      }
    });

    const graph: CodebaseContextGraph = {
      id: `ctx-graph-${Date.now()}`,
      version: 1,
      updatedAt: Date.now(),
      nodes: Array.from(nodesMap.values()),
      edges,
      fileMap,
      symbolIndex,
      callGraph: callersMap ? { callers: callersMap, callees: calleesMap } : { callers: {}, callees: {} },
      dependencyGraph: { dependents: dependentsMap, dependencies: dependenciesMap },
      testCoverageMap,
      findingMap,
    };

    CodebaseContextService.activeGraph = graph;
    return graph;
  }

  /**
   * Retrieves the active or cached CodebaseContextGraph.
   */
  public static getActiveGraph(): CodebaseContextGraph | null {
    return CodebaseContextService.activeGraph;
  }

  // ---------------------------------------------------------------------------
  // CONTEXT QUERY ENGINE APIS (PROMPT 29 SPECIFICATION)
  // ---------------------------------------------------------------------------

  /**
   * Retrieves a single node by its stable ID.
   */
  public static getNode(id: string): CodeNode | undefined {
    const graph = CodebaseContextService.activeGraph;
    if (!graph) return undefined;
    return graph.nodes.find((n) => n.id === id);
  }

  /**
   * Searches for nodes matching a symbol name or qualified name.
   */
  public static findNodesBySymbol(symbolName: string): CodeNode[] {
    const graph = CodebaseContextService.activeGraph;
    if (!graph || !symbolName) return [];
    const lower = symbolName.toLowerCase().trim();
    const nodeIds = graph.symbolIndex[lower] || [];
    if (nodeIds.length > 0) {
      return nodeIds.map((id) => graph.nodes.find((n) => n.id === id)!).filter(Boolean);
    }
    // Substring fallback
    return graph.nodes.filter(
      (n) =>
        n.name.toLowerCase().includes(lower) ||
        n.qualifiedName.toLowerCase().includes(lower)
    );
  }

  /**
   * Retrieves full context for a given file path.
   */
  public static getFileContext(filePath: string): {
    fileNode?: CodeNode;
    containedSymbols: CodeNode[];
    imports: CodeNode[];
    tests: CodeNode[];
    findings: CodeNode[];
  } {
    const graph = CodebaseContextService.activeGraph;
    if (!graph) {
      return { containedSymbols: [], imports: [], tests: [], findings: [] };
    }

    const fileNodeId = buildStableNodeId(filePath, filePath, 'FILE');
    const fileNode = graph.nodes.find((n) => n.id === fileNodeId || n.filePath === filePath && n.type === 'FILE');

    const nodeIds = graph.fileMap[filePath] || [];
    const containedSymbols = graph.nodes.filter(
      (n) => n.filePath === filePath && (n.type === 'FUNCTION' || n.type === 'CLASS' || n.type === 'METHOD' || n.type === 'INTERFACE')
    );

    const importedIds = graph.edges
      .filter((e) => (e.source === fileNodeId || nodeIds.includes(e.source)) && e.type === 'IMPORTS')
      .map((e) => e.target);
    const imports = graph.nodes.filter((n) => importedIds.includes(n.id));

    const testIds = graph.edges
      .filter((e) => nodeIds.includes(e.target) && e.type === 'TESTS')
      .map((e) => e.source);
    const tests = graph.nodes.filter((n) => testIds.includes(n.id) || (n.filePath === filePath && n.type === 'TEST'));

    const findingNodes = graph.nodes.filter(
      (n) => n.filePath === filePath && n.type === 'FINDING'
    );

    return { fileNode, containedSymbols, imports, tests, findings: findingNodes };
  }

  /**
   * Retrieves all direct and indirect callers of a symbol or function node.
   */
  public static getCallers(nodeIdOrSymbol: string): CodeNode[] {
    const graph = CodebaseContextService.activeGraph;
    if (!graph) return [];

    let targetNode = graph.nodes.find((n) => n.id === nodeIdOrSymbol);
    if (!targetNode) {
      const matches = this.findNodesBySymbol(nodeIdOrSymbol);
      targetNode = matches[0];
    }
    if (!targetNode) return [];

    const callerIds = graph.callGraph.callers[targetNode.id] || [];
    return callerIds.map((id) => graph.nodes.find((n) => n.id === id)!).filter(Boolean);
  }

  /**
   * Retrieves all functions/methods called by a symbol node (callees).
   */
  public static getCallees(nodeIdOrSymbol: string): CodeNode[] {
    const graph = CodebaseContextService.activeGraph;
    if (!graph) return [];

    let targetNode = graph.nodes.find((n) => n.id === nodeIdOrSymbol);
    if (!targetNode) {
      const matches = this.findNodesBySymbol(nodeIdOrSymbol);
      targetNode = matches[0];
    }
    if (!targetNode) return [];

    const calleeIds = graph.callGraph.callees[targetNode.id] || [];
    return calleeIds.map((id) => graph.nodes.find((n) => n.id === id)!).filter(Boolean);
  }

  /**
   * Retrieves dependencies imported or required by a node or file.
   */
  public static getDependencies(nodeIdOrFile: string): CodeNode[] {
    const graph = CodebaseContextService.activeGraph;
    if (!graph) return [];

    const directDepIds = graph.dependencyGraph.dependencies[nodeIdOrFile] || [];
    return directDepIds.map((id) => graph.nodes.find((n) => n.id === id)!).filter(Boolean);
  }

  /**
   * Retrieves dependents (nodes that import or rely on this dependency/module).
   */
  public static getDependents(nodeId: string): CodeNode[] {
    const graph = CodebaseContextService.activeGraph;
    if (!graph) return [];

    const depIds = graph.dependencyGraph.dependents[nodeId] || [];
    return depIds.map((id) => graph.nodes.find((n) => n.id === id)!).filter(Boolean);
  }

  /**
   * Retrieves tests covering a given symbol or file.
   */
  public static getTests(targetSymbolOrFile: string): CodeNode[] {
    const graph = CodebaseContextService.activeGraph;
    if (!graph) return [];

    let targetNode = graph.nodes.find((n) => n.id === targetSymbolOrFile);
    if (!targetNode) {
      const matches = this.findNodesBySymbol(targetSymbolOrFile);
      targetNode = matches[0];
    }
    if (!targetNode) return [];

    const testIds = graph.testCoverageMap[targetNode.id] || [];
    return testIds.map((id) => graph.nodes.find((n) => n.id === id)!).filter(Boolean);
  }

  /**
   * Retrieves findings affecting a specific node.
   */
  public static getRelatedFindings(nodeId: string, allFindings: ActionFinding[] = []): ActionFinding[] {
    const graph = CodebaseContextService.activeGraph;
    if (!graph) return allFindings.filter((f) => f.symbol === nodeId || f.file === nodeId);

    const findingNodeIds = graph.findingMap[nodeId] || [];
    const directFindingIds = findingNodeIds.map((id) => id.replace(/^finding::|::FINDING$/g, ''));

    return allFindings.filter((f) => directFindingIds.includes(f.id) || f.symbol === nodeId || f.file === nodeId);
  }

  /**
   * Traces security data-flow paths from endpoint/user input to sinks (DB/queries).
   */
  public static getSecurityPath(nodeId: string): { nodes: CodeNode[]; explanation: string } {
    const graph = CodebaseContextService.activeGraph;
    if (!graph) return { nodes: [], explanation: 'Context graph is currently unavailable.' };

    const targetNode = graph.nodes.find((n) => n.id === nodeId) || this.findNodesBySymbol(nodeId)[0];
    if (!targetNode) {
      return { nodes: [], explanation: `No security execution path detected for "${nodeId}".` };
    }

    // Find any linked API endpoints upstream
    const upstreamEndpoints = graph.nodes.filter(
      (n) => n.type === 'API_ENDPOINT' && graph.edges.some((e) => e.source === n.id && (e.target === targetNode.id || graph.callGraph.callees[e.target]?.includes(targetNode.id)))
    );

    // Find any database/sink dependencies downstream
    const downstreamSinks = graph.nodes.filter(
      (n) => n.type === 'DEPENDENCY' && n.metadata?.isDatabase && (graph.dependencyGraph.dependencies[targetNode.id]?.includes(n.id) || graph.edges.some((e) => e.source === targetNode.id && e.target === n.id))
    );

    const pathNodes: CodeNode[] = [];
    if (upstreamEndpoints.length > 0) pathNodes.push(upstreamEndpoints[0]);
    pathNodes.push(targetNode);
    if (downstreamSinks.length > 0) pathNodes.push(downstreamSinks[0]);

    const explanation = upstreamEndpoints.length > 0 && downstreamSinks.length > 0
      ? `Route \`${upstreamEndpoints[0].name}\` dispatches to \`${targetNode.name}\`, which executes operations against database sink \`${downstreamSinks[0].name}\`.`
      : `Symbol \`${targetNode.name}\` executed within ${targetNode.filePath}.`;

    return { nodes: pathNodes, explanation };
  }

  /**
   * Computes deterministic blast radius and downstream impact traversal.
   */
  public static getBlastRadius(nodeIdOrSymbol: string, maxDepth = 2): {
    affectedNodes: CodeNode[];
    affectedFiles: string[];
    affectedTests: CodeNode[];
    riskLevel: ImpactRiskLevel;
  } {
    const graph = CodebaseContextService.activeGraph;
    if (!graph) {
      return { affectedNodes: [], affectedFiles: [], affectedTests: [], riskLevel: 'LOW' };
    }

    let targetNode = graph.nodes.find((n) => n.id === nodeIdOrSymbol);
    if (!targetNode) {
      const matches = this.findNodesBySymbol(nodeIdOrSymbol);
      targetNode = matches[0];
    }
    if (!targetNode) {
      return { affectedNodes: [], affectedFiles: [], affectedTests: [], riskLevel: 'LOW' };
    }

    const visited = new Set<string>([targetNode.id]);
    let currentLevel = [targetNode.id];
    const affectedNodeList: CodeNode[] = [];
    const affectedFilesSet = new Set<string>([targetNode.filePath]);
    const affectedTestsList: CodeNode[] = [];

    for (let depth = 1; depth <= maxDepth; depth++) {
      const nextLevel: string[] = [];
      for (const id of currentLevel) {
        // Collect callers
        const callers = graph.callGraph.callers[id] || [];
        // Collect dependents
        const dependents = graph.dependencyGraph.dependents[id] || [];
        // Collect tests
        const tests = graph.testCoverageMap[id] || [];

        [...callers, ...dependents].forEach((nbrId) => {
          if (!visited.has(nbrId)) {
            visited.add(nbrId);
            nextLevel.push(nbrId);
            const nbrNode = graph.nodes.find((n) => n.id === nbrId);
            if (nbrNode) {
              affectedNodeList.push(nbrNode);
              affectedFilesSet.add(nbrNode.filePath);
            }
          }
        });

        tests.forEach((tId) => {
          if (!visited.has(tId)) {
            visited.add(tId);
            const tNode = graph.nodes.find((n) => n.id === tId);
            if (tNode) affectedTestsList.push(tNode);
          }
        });
      }
      currentLevel = nextLevel;
      if (currentLevel.length === 0) break;
    }

    const totalAffected = affectedNodeList.length;
    const riskLevel: ImpactRiskLevel =
      totalAffected > 8 ? 'CRITICAL' : totalAffected > 4 ? 'HIGH' : totalAffected > 1 ? 'MEDIUM' : 'LOW';

    return {
      affectedNodes: affectedNodeList,
      affectedFiles: Array.from(affectedFilesSet),
      affectedTests: affectedTestsList,
      riskLevel,
    };
  }

  // ---------------------------------------------------------------------------
  // CONTEXT PACKET BUILDER FOR AI FEATURES (PROMPT 29 SPECIFICATION)
  // ---------------------------------------------------------------------------

  /**
   * Constructs an authoritative, non-hallucinated ContextPacket to ground AI features
   * (Ask Your Codebase, Agentic Review, Agentic Fix, Verification).
   */
  public static buildContextPacket(
    targetOrQuery: string,
    allFindings: ActionFinding[] = [],
    options: {
      depth?: number;
      maxSymbols?: number;
      includeMemory?: boolean;
      includeRules?: boolean;
      activeFile?: string;
    } = {}
  ): ContextPacket {
    const graph = CodebaseContextService.activeGraph;
    const targetNodes = graph ? this.findNodesBySymbol(targetOrQuery) : [];
    const relevantFilesSet = new Set<string>();
    if (options.activeFile) relevantFilesSet.add(options.activeFile);

    targetNodes.forEach((n) => relevantFilesSet.add(n.filePath));

    // Gather direct callers, callees, tests, and dependencies
    const symbolsList: CodeNode[] = [...targetNodes];
    const relationshipsList: CodeRelationship[] = [];
    const testsList: DiscoveredTestCase[] = [];
    const dependenciesList: Array<{ name: string; version?: string; isVulnerable?: boolean; isExternal?: boolean }> = [];
    const evidenceList: string[] = [];

    if (graph && targetNodes.length > 0) {
      const primaryTarget = targetNodes[0];

      // Callers & Callees
      const callers = this.getCallers(primaryTarget.id);
      const callees = this.getCallees(primaryTarget.id);

      callers.forEach((c) => {
        symbolsList.push(c);
        relevantFilesSet.add(c.filePath);
        evidenceList.push(`Caller \`${c.name}\` in \`${c.filePath}\` (Line ${c.lineStart}) calls \`${primaryTarget.name}\``);
      });

      callees.forEach((c) => {
        symbolsList.push(c);
        relevantFilesSet.add(c.filePath);
        evidenceList.push(`\`${primaryTarget.name}\` calls \`${c.name}\` (Line ${c.lineStart})`);
      });

      // Tests
      const testNodes = this.getTests(primaryTarget.id);
      testNodes.forEach((t) => {
        evidenceList.push(`Test \`${t.name}\` in \`${t.filePath}\` covers \`${primaryTarget.name}\``);
      });

      // Dependencies
      const deps = this.getDependencies(primaryTarget.id);
      deps.forEach((d) => {
        dependenciesList.push({
          name: d.name,
          isExternal: d.metadata?.isExternal ?? true,
        });
      });

      // Edges involving target
      graph.edges.forEach((e) => {
        if (e.source === primaryTarget.id || e.target === primaryTarget.id) {
          relationshipsList.push(e);
        }
      });
    }

    // Filter relevant findings
    const relevantFindings = allFindings.filter((f) =>
      targetNodes.some((n) => n.name.toLowerCase() === f.symbol?.toLowerCase() || n.filePath === f.file) ||
      (options.activeFile && f.file === options.activeFile)
    );

    // Project Memory Integration
    let projectMemoryList: ProjectMemory[] = [];
    if (options.includeMemory !== false) {
      const memories = ProjectMemoryService.getProjectMemory();
      projectMemoryList = memories.filter((m) =>
        m.relatedFiles?.some((rf) => relevantFilesSet.has(rf)) ||
        m.relatedSymbols?.some((rs) => targetNodes.some((tn) => tn.name.toLowerCase() === rs.toLowerCase()))
      );
      if (projectMemoryList.length === 0 && memories.length > 0) {
        projectMemoryList = memories.slice(0, 3);
      }
    }

    // Project Rules
    const projectRules = projectMemoryList
      .filter((m) => m.type === 'PROJECT_RULE' || m.type === 'SECURITY_RULE' || m.type === 'CODING_CONVENTION' || m.type === 'ARCHITECTURE_DECISION')
      .map((m) => ({
        id: m.memoryId || 'rule',
        rule: m.content || m.title,
        source: m.source,
        confidence: m.confidence,
      }));

    return {
      question: targetOrQuery,
      targetNodes,
      relevantFiles: Array.from(relevantFilesSet),
      symbols: symbolsList.slice(0, options.maxSymbols || 10),
      relationships: relationshipsList,
      findings: relevantFindings,
      tests: testsList,
      dependencies: dependenciesList,
      projectRules,
      projectMemory: projectMemoryList,
      evidence: evidenceList,
    };
  }

  // ---------------------------------------------------------------------------
  // HISTORICAL GRAPH COMPARISON (PROMPT 29 SPECIFICATION)
  // ---------------------------------------------------------------------------

  /**
   * Compares two context graphs to detect meaningful architectural and dependency changes.
   */
  public static compareGraphs(
    oldGraph: CodebaseContextGraph,
    newGraph: CodebaseContextGraph
  ): GraphDiffResult {
    const oldNodeMap = new Map(oldGraph.nodes.map((n) => [n.id, n]));
    const newNodeMap = new Map(newGraph.nodes.map((n) => [n.id, n]));

    const addedNodes = newGraph.nodes.filter((n) => !oldNodeMap.has(n.id));
    const removedNodes = oldGraph.nodes.filter((n) => !newNodeMap.has(n.id));

    const oldEdgeSet = new Set(oldGraph.edges.map((e) => `${e.source}->${e.target}:${e.type}`));
    const newEdgeSet = new Set(newGraph.edges.map((e) => `${e.source}->${e.target}:${e.type}`));

    const addedRelationships = newGraph.edges.filter((e) => !oldEdgeSet.has(`${e.source}->${e.target}:${e.type}`));
    const removedRelationships = oldGraph.edges.filter((e) => !newEdgeSet.has(`${e.source}->${e.target}:${e.type}`));

    const changedArchitecturalBoundaries: Array<{
      node: string;
      change: string;
      previousTarget?: string;
      newTarget?: string;
    }> = [];

    addedRelationships
      .filter((e) => e.type === 'IMPORTS' || e.type === 'DEPENDS_ON')
      .forEach((e) => {
        changedArchitecturalBoundaries.push({
          node: e.source,
          change: `New dependency connection: ${e.source} -> ${e.target}`,
          newTarget: e.target,
        });
      });

    return {
      addedNodes,
      removedNodes,
      addedRelationships,
      removedRelationships,
      changedArchitecturalBoundaries,
    };
  }
}
