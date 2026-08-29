import { LanguageAdapter, RawParseOutput } from '../adapter';
import { ClassAnalysis, CodeSmell, FunctionAnalysis, ImportAnalysis, SupportedLanguage } from '../../types';
import { validateCodeSemantics } from '../validators/codeValidator';

export class JavaAdapter implements LanguageAdapter {
  id: SupportedLanguage = 'java';
  displayName = 'Java / Kotlin (AST & Structural)';
  depth = 'deep_ast' as const;

  canHandle(lang: SupportedLanguage): boolean {
    return lang === 'java' || lang === 'kotlin';
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

      // Imports
      const importMatch = trimmed.match(/^import\s+(?:static\s+)?([a-zA-Z0-9_.*]+);/);
      if (importMatch) {
        const fullPkg = importMatch[1];
        const parts = fullPkg.split('.');
        const className = parts[parts.length - 1];
        const isExt = !fullPkg.startsWith('java.') && !fullPkg.startsWith('javax.');
        imports.push({
          module: fullPkg,
          names: [className],
          isExternal: isExt,
          line: lineNum,
        });
      }

      // Class Definition
      const classMatch = trimmed.match(/(?:public|protected|private|abstract|final|\s)*\s*class\s+([a-zA-Z_]\w*)(?:\s+extends\s+([a-zA-Z_]\w*))?(?:\s+implements\s+([^{]+))?/);
      if (classMatch) {
        classes.push({
          name: classMatch[1],
          line: lineNum,
          endLine: lineNum,
          loc: 1,
          methodsCount: 0,
          propertiesCount: 0,
          inheritance: classMatch[2] || (classMatch[3] ? `impl ${classMatch[3].trim()}` : undefined),
        });
      }

      // Method Definition
      const methodMatch = trimmed.match(/(?:public|protected|private|static|final|synchronized|abstract|\s)+\s+([\w<>[\],]+)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)(?:\s+throws\s+[^{]+)?\s*\{/);
      if (methodMatch && !['if', 'for', 'while', 'switch', 'catch'].includes(methodMatch[2])) {
        const rawParams = methodMatch[3] ? methodMatch[3].split(',').map((p) => p.trim().split(/\s+/).pop() || '').filter(Boolean) : [];
        functions.push({
          name: methodMatch[2],
          line: lineNum,
          endLine: Math.min(lineNum + 15, lines.length),
          loc: 15,
          params: rawParams.length,
          paramNames: rawParams,
          complexity: 1,
          cognitiveComplexity: 0,
          nesting: currentBraceDepth,
          returnType: methodMatch[1],
        });

        if (classes.length > 0) {
          classes[classes.length - 1].methodsCount++;
        }
      }

      // Cyclomatic & Cognitive
      let lineCyclomatic = 0;
      let lineCognitive = 0;

      if (/\bif\s*\(/.test(trimmed)) { lineCyclomatic++; lineCognitive += (1 + currentBraceDepth); }
      if (/\belse\s+if\s*\(/.test(trimmed)) { lineCyclomatic++; lineCognitive += (1 + currentBraceDepth); }
      if (/\bfor\s*\(/.test(trimmed)) { lineCyclomatic++; lineCognitive += (1 + currentBraceDepth); }
      if (/\bwhile\s*\(/.test(trimmed)) { lineCyclomatic++; lineCognitive += (1 + currentBraceDepth); }
      if (/\bcase\s+[^:]+:/.test(trimmed)) { lineCyclomatic++; lineCognitive += 1; }
      if (/\bcatch\s*\(/.test(trimmed)) { lineCyclomatic++; lineCognitive += 1; }
      if (/\?\s*[^:]+\s*:/.test(trimmed)) { lineCyclomatic++; lineCognitive += 1; }
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
    const lines = code.split('\n');

    // 0. Deterministic AST / Syntax & Delimiter Validation
    const validationIssues = validateCodeSemantics(code, this.id);
    smells.push(...validationIssues);

    for (const fn of parsed.functions) {
      if (fn.complexity > 10) {
        smells.push({
          id: `smell-cyclo-java-${fn.name}-${fn.line}`,
          title: `High Cyclomatic Complexity in Method '${fn.name}' (${fn.complexity})`,
          severity: fn.complexity > 15 ? 'critical' : 'warning',
          line: fn.line,
          problem: `Method exceeds recommended branch limit with ${fn.complexity} execution paths.`,
          explanation: `High complexity leads to elevated defect probability and hinders maintainability.`,
          recommendation: `Refactor using Strategy, Command, or Template Method patterns.`,
          category: 'complexity',
        });
      }

      if (fn.params > 4) {
        smells.push({
          id: `smell-params-java-${fn.name}-${fn.line}`,
          title: `Excessive Parameters in '${fn.name}' (${fn.params} args)`,
          severity: 'warning',
          line: fn.line,
          problem: `Method takes ${fn.params} parameters.`,
          explanation: `Violates clean code principles. Long parameter lists reduce signature readability.`,
          recommendation: `Introduce a Parameter Object or use Builder pattern (DTO / Record).`,
          category: 'structure',
        });
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i].trim();

      // System.out.println in production code
      if (/System\.(?:out|err)\.print/.test(line)) {
        smells.push({
          id: `smell-sysout-${lineNum}`,
          title: `Standard Output Used (System.out.println)`,
          severity: 'info',
          line: lineNum,
          codeSnippet: line,
          problem: `Direct console output bypasses structured logging frameworks (SLF4J, Logback, Log4j2).`,
          explanation: `System.out causes synchronized I/O bottlenecks and lacks log level filtering and audit trails.`,
          recommendation: `Use a Logger instance: 'logger.info(...)' or 'logger.debug(...)'.`,
          category: 'maintainability',
        });
      }

      // Raw Exception catch
      if (/catch\s*\(\s*Exception\s+\w+\s*\)/.test(line)) {
        smells.push({
          id: `smell-catch-generic-${lineNum}`,
          title: `Generic Exception Catch ('catch (Exception e)')`,
          severity: 'warning',
          line: lineNum,
          codeSnippet: line,
          problem: `Catching the top-level Exception class masks specific unexpected runtime faults (e.g. NullPointerException).`,
          explanation: `Catching generic Exception hinders targeted recovery and debugging precision.`,
          recommendation: `Catch specific checked and unchecked exception classes.`,
          category: 'maintainability',
        });
      }
    }

    return smells;
  }
}
