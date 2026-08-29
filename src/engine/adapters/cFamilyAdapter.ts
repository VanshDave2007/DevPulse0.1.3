import { LanguageAdapter, RawParseOutput } from '../adapter';
import { ClassAnalysis, CodeSmell, FunctionAnalysis, ImportAnalysis, SupportedLanguage } from '../../types';
import { validateCodeSemantics } from '../validators/codeValidator';

export class CFamilyAdapter implements LanguageAdapter {
  id: SupportedLanguage = 'cpp';
  displayName = 'Compiled & Systems Languages (C, C++, C#, Go, Rust)';
  depth = 'lexical_structural' as const;

  canHandle(lang: SupportedLanguage): boolean {
    return ['cpp', 'csharp', 'go', 'rust'].includes(lang);
  }

  parse(code: string): RawParseOutput {
    const lines = code.split('\n');
    let sloc = 0;
    let commentLines = 0;
    let blankLines = 0;

    let inBlockComment = false;

    const functions: FunctionAnalysis[] = [];
    const classes: ClassAnalysis[] = [];
    const imports: ImportAnalysis[] = [];

    let totalCyclomatic = 1;
    let totalCognitive = 0;
    let maxNesting = 0;
    let currentBraceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      if (!trimmed) {
        blankLines++;
        continue;
      }

      if (trimmed.startsWith('/*')) {
        inBlockComment = true;
        commentLines++;
        if (trimmed.includes('*/')) inBlockComment = false;
        continue;
      }
      if (inBlockComment) {
        commentLines++;
        if (trimmed.includes('*/')) inBlockComment = false;
        continue;
      }
      if (trimmed.startsWith('//')) {
        commentLines++;
        continue;
      }

      sloc++;

      const openBraces = (trimmed.match(/\{/g) || []).length;
      const closeBraces = (trimmed.match(/\}/g) || []).length;
      currentBraceDepth = Math.max(0, currentBraceDepth + openBraces - closeBraces);
      if (currentBraceDepth > maxNesting) maxNesting = currentBraceDepth;

      // Imports / Includes / Uses
      const includeMatch = trimmed.match(/^#include\s*[<"]([^>"]+)[>"]/);
      const useMatch = trimmed.match(/^use\s+([a-zA-Z0-9_:]+);/);
      const usingMatch = trimmed.match(/^using\s+([a-zA-Z0-9_.]+);/);
      const goImportMatch = trimmed.match(/^import\s+["']([^"']+)["']/);

      if (includeMatch) {
        imports.push({ module: includeMatch[1], names: [includeMatch[1]], isExternal: !includeMatch[1].endsWith('.h'), line: lineNum });
      } else if (useMatch) {
        imports.push({ module: useMatch[1], names: [useMatch[1]], isExternal: !useMatch[1].startsWith('crate::'), line: lineNum });
      } else if (usingMatch) {
        imports.push({ module: usingMatch[1], names: [usingMatch[1]], isExternal: !usingMatch[1].startsWith('System'), line: lineNum });
      } else if (goImportMatch) {
        imports.push({ module: goImportMatch[1], names: [goImportMatch[1]], isExternal: goImportMatch[1].includes('/'), line: lineNum });
      }

      // Structs / Classes
      const structClassMatch = trimmed.match(/(?:struct|class|impl)\s+([a-zA-Z_]\w*)/);
      if (structClassMatch && !trimmed.startsWith('//')) {
        classes.push({
          name: structClassMatch[1],
          line: lineNum,
          endLine: lineNum,
          loc: 1,
          methodsCount: 0,
          propertiesCount: 0,
        });
      }

      // Functions (fn in Rust, func in Go, standard C/C++/C# functions)
      const funcMatch = trimmed.match(/(?:func|fn|void|int|bool|double|float|auto|pub\s+fn|public|private)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)/);
      if (funcMatch && !['if', 'for', 'while', 'switch', 'catch', 'sizeof'].includes(funcMatch[1])) {
        const rawParams = funcMatch[2] ? funcMatch[2].split(',').map((p) => p.trim()).filter(Boolean) : [];
        functions.push({
          name: funcMatch[1],
          line: lineNum,
          endLine: Math.min(lineNum + 20, lines.length),
          loc: 20,
          params: rawParams.length,
          paramNames: rawParams,
          complexity: 1,
          cognitiveComplexity: 0,
          nesting: currentBraceDepth,
        });
      }

      // Complexity
      let lineCyclomatic = 0;
      let lineCognitive = 0;

      if (/\bif\s*\(|\bif\s+/.test(trimmed)) { lineCyclomatic++; lineCognitive += (1 + currentBraceDepth); }
      if (/\bfor\s*\(|\bfor\s+/.test(trimmed)) { lineCyclomatic++; lineCognitive += (1 + currentBraceDepth); }
      if (/\bwhile\s*\(|\bwhile\s+/.test(trimmed)) { lineCyclomatic++; lineCognitive += (1 + currentBraceDepth); }
      if (/\bmatch\s+|\bswitch\s*\(/.test(trimmed)) { lineCyclomatic++; lineCognitive += 1; }
      if (/&&|\|\|/.test(trimmed)) {
        const logicalMatches = (trimmed.match(/&&|\|\|/g) || []).length;
        lineCyclomatic += logicalMatches;
      }

      totalCyclomatic += lineCyclomatic;
      totalCognitive += lineCognitive;

      if (functions.length > 0) {
        functions[functions.length - 1].complexity += lineCyclomatic;
        functions[functions.length - 1].cognitiveComplexity += lineCognitive;
      }
    }

    return {
      loc: lines.length,
      sloc,
      commentLines,
      blankLines,
      functions,
      classes,
      imports,
      rawCyclomatic: totalCyclomatic,
      rawCognitive: totalCognitive,
      maxNesting,
    };
  }

  detectSmells(code: string, parsed: RawParseOutput): CodeSmell[] {
    const smells: CodeSmell[] = [];

    // 0. Deterministic AST / Syntax & Delimiter Validation
    const validationIssues = validateCodeSemantics(code, this.id);
    smells.push(...validationIssues);

    for (const fn of parsed.functions) {
      if (fn.complexity > 10) {
        smells.push({
          id: `smell-cyclo-c-${fn.name}-${fn.line}`,
          title: `High Complexity in Function '${fn.name}' (${fn.complexity})`,
          severity: fn.complexity > 15 ? 'critical' : 'warning',
          line: fn.line,
          problem: `Function contains ${fn.complexity} execution branches.`,
          explanation: `Excessive branch complexity makes system code vulnerable to resource leaks and logical race conditions.`,
          recommendation: `Modularize logic into smaller testable subroutines.`,
          category: 'complexity',
        });
      }
    }

    if (parsed.maxNesting > 3) {
      smells.push({
        id: `smell-nesting-c`,
        title: `Deep Nesting Depth (${parsed.maxNesting} levels)`,
        severity: 'warning',
        line: 1,
        problem: `Code contains deeply nested blocks.`,
        explanation: `Reduces readability and increases cognitive load for code reviewers.`,
        recommendation: `Use guard clauses and early returns.`,
        category: 'complexity',
      });
    }

    return smells;
  }
}
