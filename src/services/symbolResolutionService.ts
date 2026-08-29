import {
  ClarificationQuestion,
  ProgramSymbol,
  SupportedLanguage,
  SymbolCandidate,
  SymbolResolutionResult,
  SymbolType,
} from '../types';

/**
 * Symbol Resolution & Natural Language Entity Mapper
 * Maps natural language queries/terms to actual AST symbols, endpoints, and components.
 * Produces disambiguation questions if multiple candidates are detected.
 */
export class SymbolResolutionService {
  /**
   * Extract symbols from source code with line ranges and snippet metadata
   */
  public static extractSymbols(
    code: string,
    fileName: string,
    language: SupportedLanguage = 'typescript'
  ): ProgramSymbol[] {
    const symbols: ProgramSymbol[] = [];
    const lines = code.split('\n');

    // 1. Regex Matchers tailored per language family
    const tsFunctionRegex = /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)/g;
    const tsArrowFuncRegex = /(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*(?::\s*[^=>]+)?\s*=>/g;
    const tsClassRegex = /(?:export\s+)?class\s+([A-Za-z0-9_$]+)(?:\s+extends\s+[A-Za-z0-9_$]+)?(?:\s+implements\s+[A-Za-z0-9_$,\s]+)?/g;
    const tsInterfaceRegex = /(?:export\s+)?(?:interface|type)\s+([A-Za-z0-9_$]+)/g;
    const tsMethodRegex = /^\s*(?:public|private|protected|async|static|\s)*\s*([A-Za-z0-9_$]+)\s*\(([^)]*)\)(?::\s*[^;{]+)?\s*\{/g;
    const pyDefRegex = /def\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/g;
    const pyClassRegex = /class\s+([A-Za-z0-9_]+)(?:\(([^)]*)\))?:/g;
    const importRegex = /(?:import\s+(?:\{[^}]*\}|\*\s+as\s+[A-Za-z0-9_$]+|[A-Za-z0-9_$]+)\s+from\s+['"]([^'"]+)['"]|from\s+([A-Za-z0-9_.]+)\s+import)/g;
    const endpointRegex = /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/gi;

    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;

      // Imports
      let importMatch;
      while ((importMatch = importRegex.exec(lineText)) !== null) {
        const pkg = importMatch[1] || importMatch[2];
        if (pkg) {
          symbols.push({
            id: `sym-import-${idx}-${pkg}`,
            file: fileName,
            language,
            symbolType: 'import',
            name: pkg,
            qualifiedName: `${fileName}:${pkg}`,
            startLine: lineNum,
            endLine: lineNum,
            parameters: [],
            imports: [],
            calls: [],
            calledBy: [],
            isPublic: true,
          });
        }
      }

      // Endpoints
      let endpointMatch;
      while ((endpointMatch = endpointRegex.exec(lineText)) !== null) {
        const method = endpointMatch[1].toUpperCase();
        const routePath = endpointMatch[2];
        symbols.push({
          id: `sym-endpoint-${idx}-${routePath}`,
          file: fileName,
          language,
          symbolType: 'endpoint',
          name: `${method} ${routePath}`,
          qualifiedName: `${fileName}::${method}_${routePath}`,
          startLine: lineNum,
          endLine: Math.min(lines.length, lineNum + 10),
          parameters: [],
          imports: [],
          calls: [],
          calledBy: [],
          isPublic: true,
          docstring: `REST API Endpoint for ${method} ${routePath}`,
        });
      }

      // Python Functions & Classes
      if (language === 'python') {
        let pyDefMatch;
        while ((pyDefMatch = pyDefRegex.exec(lineText)) !== null) {
          const fnName = pyDefMatch[1];
          const rawParams = pyDefMatch[2];
          symbols.push({
            id: `sym-fn-${idx}-${fnName}`,
            file: fileName,
            language,
            symbolType: 'function',
            name: fnName,
            qualifiedName: `${fileName}::${fnName}`,
            startLine: lineNum,
            endLine: Math.min(lines.length, lineNum + 15),
            parameters: rawParams.split(',').filter(Boolean).map((p) => ({
              name: p.trim(),
              isRequired: !p.includes('='),
            })),
            imports: [],
            calls: [],
            calledBy: [],
            isPublic: !fnName.startsWith('_'),
          });
        }

        let pyClassMatch;
        while ((pyClassMatch = pyClassRegex.exec(lineText)) !== null) {
          const clsName = pyClassMatch[1];
          symbols.push({
            id: `sym-cls-${idx}-${clsName}`,
            file: fileName,
            language,
            symbolType: 'class',
            name: clsName,
            qualifiedName: `${fileName}::${clsName}`,
            startLine: lineNum,
            endLine: Math.min(lines.length, lineNum + 25),
            parameters: [],
            imports: [],
            calls: [],
            calledBy: [],
            isPublic: true,
          });
        }
      } else {
        // TypeScript / JavaScript / Java / Go / Rust
        let fnMatch;
        while ((fnMatch = tsFunctionRegex.exec(lineText)) !== null) {
          const fnName = fnMatch[1];
          const rawParams = fnMatch[2];
          symbols.push({
            id: `sym-fn-${idx}-${fnName}`,
            file: fileName,
            language,
            symbolType: 'function',
            name: fnName,
            qualifiedName: `${fileName}::${fnName}`,
            startLine: lineNum,
            endLine: Math.min(lines.length, lineNum + 15),
            parameters: rawParams.split(',').filter(Boolean).map((p) => ({
              name: p.trim().split(':')[0].trim(),
              isRequired: !p.includes('?'),
            })),
            imports: [],
            calls: [],
            calledBy: [],
            isPublic: lineText.includes('export'),
          });
        }

        let arrowMatch;
        while ((arrowMatch = tsArrowFuncRegex.exec(lineText)) !== null) {
          const fnName = arrowMatch[1];
          symbols.push({
            id: `sym-arrow-${idx}-${fnName}`,
            file: fileName,
            language,
            symbolType: 'function',
            name: fnName,
            qualifiedName: `${fileName}::${fnName}`,
            startLine: lineNum,
            endLine: Math.min(lines.length, lineNum + 15),
            parameters: [],
            imports: [],
            calls: [],
            calledBy: [],
            isPublic: lineText.includes('export'),
          });
        }

        let classMatch;
        while ((classMatch = tsClassRegex.exec(lineText)) !== null) {
          const clsName = classMatch[1];
          symbols.push({
            id: `sym-cls-${idx}-${clsName}`,
            file: fileName,
            language,
            symbolType: 'class',
            name: clsName,
            qualifiedName: `${fileName}::${clsName}`,
            startLine: lineNum,
            endLine: Math.min(lines.length, lineNum + 30),
            parameters: [],
            imports: [],
            calls: [],
            calledBy: [],
            isPublic: lineText.includes('export'),
          });
        }

        let ifaceMatch;
        while ((ifaceMatch = tsInterfaceRegex.exec(lineText)) !== null) {
          const ifaceName = ifaceMatch[1];
          symbols.push({
            id: `sym-iface-${idx}-${ifaceName}`,
            file: fileName,
            language,
            symbolType: 'interface',
            name: ifaceName,
            qualifiedName: `${fileName}::${ifaceName}`,
            startLine: lineNum,
            endLine: Math.min(lines.length, lineNum + 10),
            parameters: [],
            imports: [],
            calls: [],
            calledBy: [],
            isPublic: lineText.includes('export'),
          });
        }

        let methodMatch;
        while ((methodMatch = tsMethodRegex.exec(lineText)) !== null) {
          const methodName = methodMatch[1];
          if (!['if', 'for', 'while', 'switch', 'catch'].includes(methodName)) {
            symbols.push({
              id: `sym-mth-${idx}-${methodName}`,
              file: fileName,
              language,
              symbolType: 'method',
              name: methodName,
              qualifiedName: `${fileName}::${methodName}`,
              startLine: lineNum,
              endLine: Math.min(lines.length, lineNum + 15),
              parameters: [],
              imports: [],
              calls: [],
              calledBy: [],
              isPublic: !methodName.startsWith('_'),
            });
          }
        }
      }
    });

    return symbols;
  }

  /**
   * Split camelCase, snake_case, PascalCase, or kebab-case into normalized words
   */
  public static tokenizeIdentifier(name: string): string[] {
    return name
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_\-.:/]/g, ' ')
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 1);
  }

  /**
   * Calculate semantic match score between a natural language query term and a symbol
   */
  public static computeMatchScore(
    query: string,
    symbol: ProgramSymbol,
    codeLines: string[]
  ): { score: number; reason: string } {
    const qNorm = query.toLowerCase().trim();
    const sNameNorm = symbol.name.toLowerCase().trim();
    const qTokens = this.tokenizeIdentifier(query);
    const sTokens = this.tokenizeIdentifier(symbol.name);

    // Exact string match
    if (sNameNorm === qNorm) {
      return { score: 1.0, reason: `Exact symbol name match: '${symbol.name}'` };
    }

    // Direct substring match
    if (sNameNorm.includes(qNorm)) {
      const ratio = qNorm.length / sNameNorm.length;
      return { score: 0.85 + ratio * 0.1, reason: `Symbol '${symbol.name}' contains '${query}'` };
    }

    if (qNorm.includes(sNameNorm) && sNameNorm.length >= 3) {
      return { score: 0.8, reason: `Query contains symbol '${symbol.name}'` };
    }

    // Token intersection & Jaccard similarity
    const intersection = qTokens.filter((t) => sTokens.includes(t));
    if (intersection.length > 0) {
      const jaccard = intersection.length / (qTokens.length + sTokens.length - intersection.length);
      const score = 0.5 + jaccard * 0.45;
      return {
        score,
        reason: `Matched tokens: [${intersection.join(', ')}] with '${symbol.name}'`,
      };
    }

    // Domain keywords heuristics (e.g. auth -> login, jwt, token, session)
    const domainKeywords: Record<string, string[]> = {
      auth: ['login', 'signin', 'token', 'jwt', 'session', 'user', 'authenticate', 'password'],
      order: ['checkout', 'payment', 'cart', 'invoice', 'purchase'],
      price: ['pricing', 'calculate', 'discount', 'cost', 'currency', 'rate'],
      database: ['query', 'sql', 'repository', 'db', 'store', 'find', 'insert'],
      error: ['catch', 'exception', 'throw', 'handler', 'fallback'],
      security: ['sanitize', 'hash', 'escape', 'csrf', 'xss', 'permission', 'role'],
    };

    for (const [key, related] of Object.entries(domainKeywords)) {
      if (qNorm.includes(key) || qTokens.includes(key)) {
        for (const rel of related) {
          if (sNameNorm.includes(rel)) {
            return {
              score: 0.65,
              reason: `Related domain concept '${key}' -> '${rel}' in '${symbol.name}'`,
            };
          }
        }
      }
    }

    // Check docstring or code snippet match
    const snippet = codeLines.slice(symbol.startLine - 1, Math.min(codeLines.length, symbol.startLine + 2)).join(' ');
    if (snippet.toLowerCase().includes(qNorm)) {
      return { score: 0.45, reason: `Found occurrence of '${query}' within implementation body` };
    }

    return { score: 0.0, reason: 'No significant match' };
  }

  /**
   * Resolve natural language references to candidate symbols with ambiguity handling
   */
  public static resolveNaturalLanguageQuery(
    query: string,
    code: string,
    fileName: string,
    language: SupportedLanguage = 'typescript'
  ): SymbolResolutionResult {
    const symbols = this.extractSymbols(code, fileName, language);
    const codeLines = code.split('\n');

    // Extract potential entity keywords from query
    const cleanQuery = query
      .replace(/^(where is|who calls|what does|show me|find|locate|inspect|explain)\s+/i, '')
      .replace(/\?+$/, '')
      .trim();

    const scoredCandidates: SymbolCandidate[] = [];

    symbols.forEach((sym) => {
      const match = this.computeMatchScore(cleanQuery, sym, codeLines);
      if (match.score > 0.35) {
        const snippet = codeLines
          .slice(sym.startLine - 1, Math.min(codeLines.length, sym.startLine + 4))
          .join('\n');

        scoredCandidates.push({
          id: sym.id,
          name: sym.name,
          type: sym.symbolType,
          file: sym.file,
          startLine: sym.startLine,
          endLine: sym.endLine,
          snippet,
          description: sym.docstring || `${sym.symbolType} ${sym.name} (Lines ${sym.startLine}-${sym.endLine})`,
          matchScore: match.score,
          matchReason: match.reason,
        });
      }
    });

    // Sort candidates descending by match score
    scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

    if (scoredCandidates.length === 0) {
      return {
        queryTerm: cleanQuery,
        candidates: [],
        isAmbiguous: false,
      };
    }

    const topCandidate = scoredCandidates[0];

    // Detect ambiguity: multiple candidates with close scores
    const closeCandidates = scoredCandidates.filter(
      (c) => c.matchScore >= 0.55 && Math.abs(c.matchScore - topCandidate.matchScore) < 0.18
    );

    const isAmbiguous = closeCandidates.length > 1;

    let clarificationQuestion: ClarificationQuestion | undefined;
    if (isAmbiguous) {
      clarificationQuestion = {
        id: `clarify-${Date.now()}`,
        question: `Multiple symbols matched "${cleanQuery}". Which entity did you mean?`,
        options: closeCandidates.slice(0, 4).map((c) => ({
          id: c.name,
          label: `${c.type.toUpperCase()}: ${c.name} (${c.file}:${c.startLine})`,
          description: c.matchReason,
        })),
      };
    }

    return {
      queryTerm: cleanQuery,
      matchedSymbol: !isAmbiguous ? topCandidate : undefined,
      candidates: scoredCandidates,
      isAmbiguous,
      clarificationQuestion,
    };
  }
}
