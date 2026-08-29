import { LanguageAdapter, RawParseOutput } from '../adapter';
import { ClassAnalysis, CodeSmell, FunctionAnalysis, ImportAnalysis, SupportedLanguage } from '../../types';
import { validateCodeSemantics } from '../validators/codeValidator';

export class GenericAdapter implements LanguageAdapter {
  id: SupportedLanguage = 'generic';
  displayName = 'Universal Structural Analyzer';
  depth = 'heuristic_pattern' as const;

  canHandle(_lang: SupportedLanguage): boolean {
    return true; // fallback for all
  }

  parse(code: string): RawParseOutput {
    const lines = code.split('\n');
    let sloc = 0;
    let commentLines = 0;
    let blankLines = 0;

    const functions: FunctionAnalysis[] = [];
    const classes: ClassAnalysis[] = [];
    const imports: ImportAnalysis[] = [];

    let totalCyclomatic = 1;
    let totalCognitive = 0;
    let maxNesting = 0;
    let currentDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      if (!trimmed) {
        blankLines++;
        continue;
      }

      if (trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('--') || trimmed.startsWith('/*')) {
        commentLines++;
        continue;
      }

      sloc++;

      const openBraces = (trimmed.match(/\{|\(|\[/g) || []).length;
      const closeBraces = (trimmed.match(/\}|\)|\]/g) || []).length;
      currentDepth = Math.max(0, currentDepth + openBraces - closeBraces);
      if (currentDepth > maxNesting) maxNesting = currentDepth;

      // Heuristic function match
      const funcMatch = trimmed.match(/(?:function|def|sub|fn|func|proc)\s+([a-zA-Z_]\w*)/i);
      if (funcMatch) {
        functions.push({
          name: funcMatch[1],
          line: lineNum,
          endLine: Math.min(lineNum + 15, lines.length),
          loc: 15,
          params: 2,
          complexity: 1,
          cognitiveComplexity: 0,
          nesting: currentDepth,
        });
      }

      // Cyclomatic tokens
      if (/\b(?:if|elsif|elif|while|for|case|catch|when)\b/i.test(trimmed)) {
        totalCyclomatic++;
        totalCognitive += (1 + currentDepth);
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

    // Delimiter and universal checks
    const validationIssues = validateCodeSemantics(code, this.id);
    smells.push(...validationIssues);

    if (parsed.rawCyclomatic > 15) {
      smells.push({
        id: 'smell-generic-cyclo',
        title: `Elevated File Complexity (${parsed.rawCyclomatic})`,
        severity: 'warning',
        line: 1,
        problem: `File contains numerous conditional branches and flow switches.`,
        explanation: `Code with high structural complexity is harder to maintain and refactor safely.`,
        recommendation: `Modularize into distinct functions or modules.`,
        category: 'complexity',
      });
    }
    return smells;
  }
}
