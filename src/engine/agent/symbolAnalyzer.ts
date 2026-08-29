import {
  ParameterInfo,
  ProgramSymbol,
  SupportedLanguage,
  SymbolType,
} from '../../types';

// Fast in-memory symbol cache by code string hash
const symbolCache = new Map<string, ProgramSymbol[]>();

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export function extractSymbols(
  code: string,
  filePath: string = 'source.py',
  language: SupportedLanguage = 'python'
): ProgramSymbol[] {
  if (!code || !code.trim()) return [];

  const cacheKey = `${filePath}:${language}:${simpleHash(code)}`;
  if (symbolCache.has(cacheKey)) {
    return symbolCache.get(cacheKey)!;
  }

  const lines = code.split('\n');
  const symbols: ProgramSymbol[] = [];
  const imports: string[] = [];

  // 1. First pass: extract imports
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (
      line.startsWith('import ') ||
      line.startsWith('from ') ||
      line.startsWith('const ') && line.includes('require(') ||
      line.startsWith('import {')
    ) {
      imports.push(line);
    }
  }

  // 2. Extract function & class symbols depending on language
  let currentClass: { name: string; startLine: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    const trimmed = line.trim();

    // Skip comments and blanks
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }

    // Python Class
    const pyClassMatch = line.match(/^class\s+([A-Za-z0-9_]+)(?:\(([^)]*)\))?:/);
    if (pyClassMatch && (language === 'python' || language === 'generic')) {
      const className = pyClassMatch[1];
      const endLine = findBlockEnd(lines, i, 'python');
      currentClass = { name: className, startLine: lineNum };

      symbols.push({
        id: `${filePath}::${className}`,
        file: filePath,
        language,
        symbolType: 'class',
        name: className,
        qualifiedName: className,
        startLine: lineNum,
        endLine,
        parameters: [],
        imports: [...imports],
        calls: [],
        calledBy: [],
        isPublic: !className.startsWith('_'),
      });
      continue;
    }

    // JS/TS/Java Class
    const jsClassMatch = line.match(/(?:export\s+)?class\s+([A-Za-z0-9_]+)(?:\s+extends\s+([A-Za-z0-9_]+))?/);
    if (jsClassMatch && language !== 'python') {
      const className = jsClassMatch[1];
      const endLine = findBraceBlockEnd(lines, i);
      currentClass = { name: className, startLine: lineNum };

      symbols.push({
        id: `${filePath}::${className}`,
        file: filePath,
        language,
        symbolType: 'class',
        name: className,
        qualifiedName: className,
        startLine: lineNum,
        endLine,
        parameters: [],
        imports: [...imports],
        calls: [],
        calledBy: [],
        isPublic: line.includes('export') || !className.startsWith('_'),
      });
      continue;
    }

    // Python Function / Method
    const pyFnMatch = line.match(/^(?:\s*)(?:async\s+)?def\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)(?:\s*->\s*([^:]+))?:/);
    if (pyFnMatch && (language === 'python' || language === 'generic')) {
      const isIndented = line.startsWith(' ') || line.startsWith('\t');
      const fnName = pyFnMatch[1];
      const rawParams = pyFnMatch[2];
      const returnType = pyFnMatch[3]?.trim();
      const endLine = findBlockEnd(lines, i, 'python');
      const params = parseParameters(rawParams, 'python');
      const isAsync = line.includes('async def');

      const qualifiedName = currentClass && isIndented ? `${currentClass.name}.${fnName}` : fnName;
      const symbolType: SymbolType = currentClass && isIndented ? 'method' : 'function';

      // Find calls inside function body
      const bodyLines = lines.slice(i, endLine);
      const calls = findCallsInBody(bodyLines.join('\n'));

      symbols.push({
        id: `${filePath}::${qualifiedName}`,
        file: filePath,
        language,
        symbolType,
        name: fnName,
        qualifiedName,
        startLine: lineNum,
        endLine,
        parameters: params,
        returnType: returnType || undefined,
        parentClass: currentClass && isIndented ? currentClass.name : undefined,
        isAsync,
        isPublic: !fnName.startsWith('_'),
        imports: [...imports],
        calls,
        calledBy: [],
      });
      continue;
    }

    // JS / TS Function or Arrow Function
    const jsFnMatch = line.match(
      /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?/
    ) || line.match(
      /(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(([^)]*)\)(?:\s*:\s*([^=]+))?\s*=>/
    );

    if (jsFnMatch && language !== 'python') {
      const fnName = jsFnMatch[1];
      const rawParams = jsFnMatch[2] || '';
      const returnType = jsFnMatch[3]?.trim();
      const endLine = findBraceBlockEnd(lines, i);
      const params = parseParameters(rawParams, 'javascript');
      const isAsync = line.includes('async');

      const qualifiedName = currentClass ? `${currentClass.name}.${fnName}` : fnName;
      const symbolType: SymbolType = currentClass ? 'method' : 'function';

      const bodyLines = lines.slice(i, endLine);
      const calls = findCallsInBody(bodyLines.join('\n'));

      symbols.push({
        id: `${filePath}::${qualifiedName}`,
        file: filePath,
        language,
        symbolType,
        name: fnName,
        qualifiedName,
        startLine: lineNum,
        endLine,
        parameters: params,
        returnType: returnType || undefined,
        parentClass: currentClass ? currentClass.name : undefined,
        isAsync,
        isPublic: line.includes('export') || !fnName.startsWith('_'),
        imports: [...imports],
        calls,
        calledBy: [],
      });
      continue;
    }
  }

  // Cross-link calledBy
  for (const sym of symbols) {
    for (const other of symbols) {
      if (other.calls.includes(sym.name) && other.id !== sym.id) {
        if (!sym.calledBy.includes(other.name)) {
          sym.calledBy.push(other.name);
        }
      }
    }
  }

  // Cache up to 100 entries
  if (symbolCache.size > 100) {
    const firstKey = symbolCache.keys().next().value;
    if (firstKey) symbolCache.delete(firstKey);
  }
  symbolCache.set(cacheKey, symbols);

  return symbols;
}

export function parseParameters(rawParams: string, lang: 'python' | 'javascript' | 'generic'): ParameterInfo[] {
  if (!rawParams || !rawParams.trim()) return [];

  const parts = rawParams.split(',').map((p) => p.trim()).filter(Boolean);
  const result: ParameterInfo[] = [];

  for (const part of parts) {
    // Ignore self / cls in Python methods
    if ((part === 'self' || part === 'cls') && lang === 'python') {
      continue;
    }

    if (lang === 'python') {
      // name: type = default OR name = default OR name: type
      let name = part;
      let type: string | undefined = undefined;
      let defaultValue: string | undefined = undefined;

      if (part.includes('=')) {
        const [left, right] = part.split('=').map((s) => s.trim());
        defaultValue = right;
        name = left;
      }

      if (name.includes(':')) {
        const [left, right] = name.split(':').map((s) => s.trim());
        name = left;
        type = right;
      }

      result.push({
        name: name.trim(),
        type,
        defaultValue,
        isRequired: defaultValue === undefined,
      });
    } else {
      // JS/TS: name?: type = default
      let name = part;
      let defaultValue: string | undefined = undefined;
      let type: string | undefined = undefined;
      let isOptional = part.includes('?');

      if (part.includes('=')) {
        const [left, right] = part.split('=').map((s) => s.trim());
        defaultValue = right;
        name = left;
      }

      if (name.includes(':')) {
        const [left, right] = name.split(':').map((s) => s.trim());
        name = left.replace('?', '');
        type = right;
      } else {
        name = name.replace('?', '');
      }

      result.push({
        name: name.trim(),
        type,
        defaultValue,
        isRequired: defaultValue === undefined && !isOptional,
      });
    }
  }

  return result;
}

function findBlockEnd(lines: string[], startIndex: number, lang: 'python'): number {
  const startIndent = lines[startIndex].search(/\S/);
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const currentIndent = line.search(/\S/);
    if (currentIndent <= startIndent) {
      return i;
    }
  }
  return lines.length;
}

function findBraceBlockEnd(lines: string[], startIndex: number): number {
  let openBraces = 0;
  let seenBrace = false;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    for (const ch of line) {
      if (ch === '{') {
        openBraces++;
        seenBrace = true;
      } else if (ch === '}') {
        openBraces--;
      }
    }
    if (seenBrace && openBraces <= 0) {
      return i + 1;
    }
  }
  return lines.length;
}

function findCallsInBody(body: string): string[] {
  const calls = new Set<string>();
  const callRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
  let match;

  const reserved = new Set([
    'if', 'for', 'while', 'switch', 'catch', 'return', 'print', 'console', 'log',
    'require', 'import', 'super', 'typeof', 'sizeof', 'len', 'range', 'int', 'str',
    'float', 'bool', 'dict', 'list', 'set', 'tuple', 'sum', 'min', 'max'
  ]);

  while ((match = callRegex.exec(body)) !== null) {
    const callee = match[1];
    if (!reserved.has(callee)) {
      calls.add(callee);
    }
  }

  return Array.from(calls);
}

export function mapLinesToSymbols(lines: number[], symbols: ProgramSymbol[]): ProgramSymbol[] {
  const matched = new Set<ProgramSymbol>();
  for (const line of lines) {
    for (const sym of symbols) {
      if (line >= sym.startLine && line <= sym.endLine) {
        matched.add(sym);
      }
    }
  }
  return Array.from(matched);
}
