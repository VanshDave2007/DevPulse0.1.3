import { CallGraphEdge, CallGraphNode, CallGraphResult, ProgramSymbol } from '../../types';

export function buildCallGraph(allSymbols: ProgramSymbol[]): CallGraphResult {
  const nodes: CallGraphNode[] = [];
  const edges: CallGraphEdge[] = [];
  const symbolMap = new Map<string, ProgramSymbol>();

  for (const sym of allSymbols) {
    symbolMap.set(sym.name, sym);
    nodes.push({
      id: sym.id,
      name: sym.qualifiedName || sym.name,
      file: sym.file,
      type: sym.symbolType,
      language: sym.language,
      metrics: {
        complexity: sym.calls.length + 1,
        loc: sym.endLine - sym.startLine + 1,
      },
    });
  }

  // Build edges
  for (const sym of allSymbols) {
    for (const calleeName of sym.calls) {
      const callee = symbolMap.get(calleeName);
      if (callee && callee.id !== sym.id) {
        edges.push({
          source: sym.id,
          target: callee.id,
          callSiteLine: sym.startLine + 1,
          isIndirect: false,
        });
      }
    }
  }

  return { nodes, edges };
}

export function findDirectCallers(targetSymbolName: string, allSymbols: ProgramSymbol[]): ProgramSymbol[] {
  return allSymbols.filter(
    (sym) => sym.calls.includes(targetSymbolName) && sym.name !== targetSymbolName
  );
}

export function findDirectCallees(targetSymbolName: string, allSymbols: ProgramSymbol[]): ProgramSymbol[] {
  const target = allSymbols.find((s) => s.name === targetSymbolName);
  if (!target) return [];
  return allSymbols.filter((sym) => target.calls.includes(sym.name) && sym.name !== targetSymbolName);
}

export function findTransitiveImpact(
  targetSymbolNames: string[],
  allSymbols: ProgramSymbol[],
  maxDepth: number = 3
): {
  directCallers: ProgramSymbol[];
  indirectCallers: ProgramSymbol[];
  impactedFiles: Set<string>;
} {
  const directCallers = new Set<ProgramSymbol>();
  const indirectCallers = new Set<ProgramSymbol>();
  const impactedFiles = new Set<string>();

  let currentLevelNames = new Set<string>(targetSymbolNames);
  const visited = new Set<string>(targetSymbolNames);

  for (let depth = 1; depth <= maxDepth; depth++) {
    const nextLevelNames = new Set<string>();

    for (const sym of allSymbols) {
      const callsAnyCurrent = sym.calls.some((c) => currentLevelNames.has(c));
      if (callsAnyCurrent && !visited.has(sym.name)) {
        if (depth === 1) {
          directCallers.add(sym);
        } else {
          indirectCallers.add(sym);
        }
        impactedFiles.add(sym.file);
        visited.add(sym.name);
        nextLevelNames.add(sym.name);
      }
    }

    if (nextLevelNames.size === 0) break;
    currentLevelNames = nextLevelNames;
  }

  return {
    directCallers: Array.from(directCallers),
    indirectCallers: Array.from(indirectCallers),
    impactedFiles,
  };
}
