import { LanguageAdapter, RawParseOutput } from '../adapter';
import { ClassAnalysis, CodeSmell, FunctionAnalysis, ImportAnalysis, SupportedLanguage } from '../../types';
import { validateCodeSemantics } from '../validators/codeValidator';

export class JavaScriptAdapter implements LanguageAdapter {
  id: SupportedLanguage = 'javascript';
  displayName = 'JavaScript / TypeScript (Deep Lexical)';
  depth = 'deep_ast' as const;

  canHandle(lang: SupportedLanguage): boolean {
    return lang === 'javascript' || lang === 'typescript';
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

    const standardModules = new Set([
      'fs', 'path', 'http', 'https', 'crypto', 'events', 'util', 'os', 'stream',
      'url', 'buffer', 'child_process', 'assert', 'zlib', 'querystring'
    ]);

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      if (!trimmed) {
        blankLines++;
        continue;
      }

      // Block comment parsing
      if (trimmed.startsWith('/*')) {
        inBlockComment = true;
        commentLines++;
        if (trimmed.includes('*/')) {
          inBlockComment = false;
        }
        continue;
      }
      if (inBlockComment) {
        commentLines++;
        if (trimmed.includes('*/')) {
          inBlockComment = false;
        }
        continue;
      }

      // Single line comment
      if (trimmed.startsWith('//')) {
        commentLines++;
        continue;
      }

      sloc++;

      // Brace depth calculation for nesting
      const openBraces = (trimmed.match(/\{/g) || []).length;
      const closeBraces = (trimmed.match(/\}/g) || []).length;
      currentBraceDepth = Math.max(0, currentBraceDepth + openBraces - closeBraces);
      if (currentBraceDepth > maxNesting) {
        maxNesting = currentBraceDepth;
      }

      // Check imports
      const esmImportMatch = trimmed.match(/^import\s+(?:(\*\s+as\s+[\w]+|[\w]+|\{[^}]+\}))\s+from\s+['"]([^'"]+)['"]/);
      if (esmImportMatch) {
        const specifier = esmImportMatch[1].replace(/[\{\}]/g, '').trim();
        const mod = esmImportMatch[2];
        imports.push({
          module: mod,
          names: specifier.split(',').map((s) => s.trim().split(' as ')[0]).filter(Boolean),
          isExternal: !mod.startsWith('.') && !mod.startsWith('/') && !standardModules.has(mod),
          line: lineNum,
        });
      } else {
        const requireMatch = trimmed.match(/(?:const|let|var)\s+(?:(\{[^}]+\}|[\w]+))\s*=\s*require\(['"]([^'"]+)['"]\)/);
        if (requireMatch) {
          const specifier = requireMatch[1].replace(/[\{\}]/g, '').trim();
          const mod = requireMatch[2];
          imports.push({
            module: mod,
            names: [specifier],
            isExternal: !mod.startsWith('.') && !mod.startsWith('/') && !standardModules.has(mod),
            line: lineNum,
          });
        }
      }

      // Check Class definition
      const classMatch = trimmed.match(/^(?:export\s+)?class\s+([a-zA-Z_]\w*)(?:\s+extends\s+([a-zA-Z_]\w*))?/);
      if (classMatch) {
        classes.push({
          name: classMatch[1],
          line: lineNum,
          endLine: lineNum,
          loc: 1,
          methodsCount: 0,
          propertiesCount: 0,
          inheritance: classMatch[2] || undefined,
        });
      }

      // Check Function definition
      // Regular: function name(a, b) or async function name(a, b)
      const funcDecl = trimmed.match(/^(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)/);
      // Arrow/Expression: const name = (a, b) => or const name = async (a, b) =>
      const arrowDecl = trimmed.match(/^(?:export\s+)?(?:const|let|var)\s+([a-zA-Z_]\w*)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*(?::\s*[^=]+)?\s*=>/);
      // Method: methodName(a, b) { or async methodName(a, b) {
      const methodDecl = trimmed.match(/^(?:public|private|protected|async|static|\s)*\s*([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*(?::\s*[^{]+)?\s*\{/);

      const matchedFunc = funcDecl || arrowDecl || (currentBraceDepth > 0 && methodDecl && !trimmed.startsWith('if') && !trimmed.startsWith('for') && !trimmed.startsWith('while') && !trimmed.startsWith('switch') && !trimmed.startsWith('catch') ? methodDecl : null);

      if (matchedFunc && !['if', 'for', 'while', 'switch', 'catch', 'constructor'].includes(matchedFunc[1])) {
        const rawParams = matchedFunc[2] ? matchedFunc[2].split(',').map((p) => p.trim().split(':')[0].trim()).filter(Boolean) : [];
        functions.push({
          name: matchedFunc[1],
          line: lineNum,
          endLine: Math.min(lineNum + 15, lines.length),
          loc: 15,
          params: rawParams.length,
          paramNames: rawParams,
          complexity: 1,
          cognitiveComplexity: 0,
          nesting: currentBraceDepth,
          isAsync: trimmed.includes('async'),
        });
      }

      // Cyclomatic & Cognitive decision points
      let lineCyclomatic = 0;
      let lineCognitive = 0;

      if (/\bif\s*\(/.test(trimmed)) { lineCyclomatic++; lineCognitive += (1 + currentBraceDepth); }
      if (/\belse\s+if\s*\(/.test(trimmed)) { lineCyclomatic++; lineCognitive += (1 + currentBraceDepth); }
      if (/\bfor\s*\(/.test(trimmed)) { lineCyclomatic++; lineCognitive += (1 + currentBraceDepth); }
      if (/\bwhile\s*\(/.test(trimmed)) { lineCyclomatic++; lineCognitive += (1 + currentBraceDepth); }
      if (/\bcase\s+[^:]+:/.test(trimmed)) { lineCyclomatic++; lineCognitive += 1; }
      if (/\bcatch\s*\(/.test(trimmed)) { lineCyclomatic++; lineCognitive += 1; }
      if (/\?\s*[^:]+\s*:/.test(trimmed)) { lineCyclomatic++; lineCognitive += 1; }
      if (/&&|\|\||\?\?/.test(trimmed)) {
        const logicalMatches = (trimmed.match(/&&|\|\||\?\?/g) || []).length;
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

    // 1. Function Smells
    for (const fn of parsed.functions) {
      if (fn.complexity > 10) {
        smells.push({
          id: `smell-cyclo-js-${fn.name}-${fn.line}`,
          title: `High Cyclomatic Complexity in '${fn.name}' (${fn.complexity})`,
          severity: fn.complexity > 15 ? 'critical' : 'warning',
          line: fn.line,
          problem: `Function contains ${fn.complexity} distinct execution branches.`,
          explanation: `Excessive branching causes exponential edge-case risk and reduces test coverage reliability.`,
          recommendation: `Simplify control flow by using early returns, polymorphism, or smaller decomposed functions.`,
          category: 'complexity',
        });
      }

      if (fn.params > 4) {
        smells.push({
          id: `smell-params-js-${fn.name}-${fn.line}`,
          title: `Excessive Parameter List in '${fn.name}' (${fn.params} args)`,
          severity: 'warning',
          line: fn.line,
          problem: `Function receives ${fn.params} individual positional parameters.`,
          explanation: `Long parameter lists are error-prone, hard to call, and tightly couple caller to signature order.`,
          recommendation: `Use an options object pattern (e.g. '{ paramA, paramB }: ConfigOptions').`,
          category: 'structure',
        });
      }
    }

    // 2. Syntax-level Smells (eval, var, ==, empty catch)
    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i].trim();

      // eval() or Function constructor
      if (/\beval\s*\(/.test(line) || /\bnew\s+Function\s*\(/.test(line)) {
        smells.push({
          id: `smell-eval-${lineNum}`,
          title: `Dangerous Dynamic Execution ('eval')`,
          severity: 'critical',
          line: lineNum,
          codeSnippet: line,
          problem: `Using 'eval()' or dynamic Function evaluation introduces critical remote code execution (RCE) vectors.`,
          explanation: `Dynamic code execution prevents JIT compiler optimizations and creates severe XSS/injection vulnerabilities.`,
          recommendation: `Use standard JSON.parse, safe lookup maps, or modern AST expression parsers.`,
          category: 'security',
        });
      }

      // 'var' keyword
      if (/\bvar\s+[a-zA-Z_]\w*/.test(line) && !line.startsWith('//')) {
        smells.push({
          id: `smell-var-${lineNum}`,
          title: `Legacy 'var' Declaration (Hoisting Risk)`,
          severity: 'warning',
          line: lineNum,
          codeSnippet: line,
          problem: `'var' variables are function-scoped rather than block-scoped and prone to variable hoisting issues.`,
          explanation: `Modern JavaScript uses 'const' (by default) and 'let' (when mutation is necessary) to guarantee lexical block scoping.`,
          recommendation: `Replace 'var' with 'const' or 'let'.`,
          category: 'maintainability',
        });
      }

      // Loose equality == or != (instead of === / !==)
      if (/[^!=<>]={2}[^=]/.test(line) && !line.startsWith('//')) {
        smells.push({
          id: `smell-eqeq-${lineNum}`,
          title: `Loose Equality Operator ('==')`,
          severity: 'info',
          line: lineNum,
          codeSnippet: line,
          problem: `Using '==' invokes implicit type coercion which leads to unexpected falsy/truthy bugs.`,
          explanation: `Strict equality '===' checks both type and value without hidden type casting.`,
          recommendation: `Replace '==' with '===' and '!=' with '!=='.`,
          category: 'maintainability',
        });
      }

      // Empty catch block
      if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line) || (line.startsWith('catch') && lines[i + 1]?.trim() === '}')) {
        smells.push({
          id: `smell-empty-catch-${lineNum}`,
          title: `Silent Empty 'catch' Block`,
          severity: 'critical',
          line: lineNum,
          codeSnippet: line,
          problem: `Exceptions are swallowed silently without logging or error recovery.`,
          explanation: `Silent error swallowing leads to unexplainable runtime state corruption and impossible debugging.`,
          recommendation: `Log the error with 'console.error(err)' or rethrow/handle gracefully with fallback UI.`,
          category: 'maintainability',
        });
      }
    }

    if (parsed.maxNesting > 3) {
      smells.push({
        id: `smell-deep-nesting-js`,
        title: `Deep Nesting Depth (Level ${parsed.maxNesting})`,
        severity: parsed.maxNesting > 4 ? 'critical' : 'warning',
        line: 1,
        problem: `Code reaches ${parsed.maxNesting} levels of nesting.`,
        explanation: `Deeply nested closures and conditional blocks create the 'pyramid of doom' anti-pattern.`,
        recommendation: `Utilize async/await, optional chaining ('?.'), guard clauses, and functional composition.`,
        category: 'complexity',
      });
    }

    return smells;
  }
}
