import { LanguageAdapter, RawParseOutput } from '../adapter';
import { ClassAnalysis, CodeSmell, FunctionAnalysis, ImportAnalysis, SupportedLanguage } from '../../types';
import { validateCodeSemantics } from '../validators/codeValidator';

export class PythonAdapter implements LanguageAdapter {
  id: SupportedLanguage = 'python';
  displayName = 'Python (Deep AST & Lexical)';
  depth = 'deep_ast' as const;

  canHandle(lang: SupportedLanguage): boolean {
    return lang === 'python';
  }

  parse(code: string): RawParseOutput {
    const lines = code.split('\n');
    let sloc = 0;
    let commentLines = 0;
    let blankLines = 0;

    let inDocstring = false;
    let docstringDelimiter = '';

    const functions: FunctionAnalysis[] = [];
    const classes: ClassAnalysis[] = [];
    const imports: ImportAnalysis[] = [];

    let totalCyclomatic = 1;
    let totalCognitive = 0;
    let maxNesting = 0;

    let currentClass: { name: string; line: number; indent: number } | null = null;
    let currentFunction: {
      name: string;
      line: number;
      indent: number;
      params: string[];
      isAsync: boolean;
      complexity: number;
      cognitive: number;
      nesting: number;
    } | null = null;

    const standardModules = new Set([
      'os', 'sys', 'math', 'time', 'datetime', 'json', 're', 'collections', 'itertools',
      'functools', 'typing', 'pathlib', 'asyncio', 'logging', 'subprocess', 'random',
      'urllib', 'http', 'unittest', 'hashlib', 'sqlite3', 'copy', 'io', 'csv'
    ]);

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      // Blank line
      if (!trimmed) {
        blankLines++;
        continue;
      }

      // Check multi-line docstring
      if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
        const delim = trimmed.substring(0, 3);
        if (!inDocstring) {
          inDocstring = true;
          docstringDelimiter = delim;
          commentLines++;
          // check if closes on same line
          if (trimmed.length > 3 && trimmed.endsWith(delim)) {
            inDocstring = false;
          }
          continue;
        } else if (delim === docstringDelimiter) {
          inDocstring = false;
          commentLines++;
          continue;
        }
      }

      if (inDocstring) {
        commentLines++;
        if (trimmed.endsWith(docstringDelimiter)) {
          inDocstring = false;
        }
        continue;
      }

      // Single-line comment
      if (trimmed.startsWith('#')) {
        commentLines++;
        continue;
      }

      sloc++;

      // Indentation calculation
      const indentMatch = rawLine.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1].replace(/\t/g, '    ').length : 0;
      const nestingLevel = Math.floor(indent / 4);
      if (nestingLevel > maxNesting) {
        maxNesting = nestingLevel;
      }

      // Check class definition
      const classMatch = trimmed.match(/^class\s+([a-zA-Z_]\w*)(?:\(([^)]*)\))?:/);
      if (classMatch) {
        if (currentFunction && indent <= currentFunction.indent) {
          functions.push({
            name: currentFunction.name,
            line: currentFunction.line,
            endLine: lineNum - 1,
            loc: lineNum - currentFunction.line,
            params: currentFunction.params.length,
            paramNames: currentFunction.params,
            complexity: currentFunction.complexity,
            cognitiveComplexity: currentFunction.cognitive,
            nesting: currentFunction.nesting,
            isAsync: currentFunction.isAsync,
          });
          currentFunction = null;
        }

        classes.push({
          name: classMatch[1],
          line: lineNum,
          endLine: lineNum,
          loc: 1,
          methodsCount: 0,
          propertiesCount: 0,
          inheritance: classMatch[2]?.trim() || undefined,
        });
        currentClass = { name: classMatch[1], line: lineNum, indent };
      }

      // Check function definition
      const funcMatch = trimmed.match(/^(async\s+)?def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)(?:\s*->\s*([^:]+))?:/);
      if (funcMatch) {
        if (currentFunction) {
          functions.push({
            name: currentFunction.name,
            line: currentFunction.line,
            endLine: lineNum - 1,
            loc: lineNum - currentFunction.line,
            params: currentFunction.params.length,
            paramNames: currentFunction.params,
            complexity: currentFunction.complexity,
            cognitiveComplexity: currentFunction.cognitive,
            nesting: currentFunction.nesting,
            isAsync: currentFunction.isAsync,
          });
        }

        const rawParams = funcMatch[3] ? funcMatch[3].split(',').map((p) => p.trim()).filter(Boolean) : [];
        currentFunction = {
          name: funcMatch[2],
          line: lineNum,
          indent,
          params: rawParams,
          isAsync: Boolean(funcMatch[1]),
          complexity: 1,
          cognitive: 0,
          nesting: nestingLevel,
        };

        if (currentClass && indent > currentClass.indent) {
          const cls = classes.find((c) => c.name === currentClass?.name);
          if (cls) cls.methodsCount++;
        }
      }

      // Check imports
      const fromImportMatch = trimmed.match(/^from\s+([a-zA-Z0-9_.]+)\s+import\s+(.+)$/);
      if (fromImportMatch) {
        const mod = fromImportMatch[1];
        const names = fromImportMatch[2].split(',').map((n) => n.trim().split(' as ')[0]);
        imports.push({
          module: mod,
          names,
          isExternal: !standardModules.has(mod.split('.')[0]) && !mod.startsWith('.'),
          line: lineNum,
        });
      } else {
        const importMatch = trimmed.match(/^import\s+(.+)$/);
        if (importMatch) {
          const modules = importMatch[1].split(',').map((m) => m.trim().split(' as ')[0]);
          for (const mod of modules) {
            imports.push({
              module: mod,
              names: [mod],
              isExternal: !standardModules.has(mod.split('.')[0]) && !mod.startsWith('.'),
              line: lineNum,
            });
          }
        }
      }

      // Branch / Complexity tokens
      let lineCyclomatic = 0;
      let lineCognitive = 0;

      if (/\bif\s+/.test(trimmed)) { lineCyclomatic++; lineCognitive += (1 + nestingLevel); }
      if (/\belif\s+/.test(trimmed)) { lineCyclomatic++; lineCognitive += (1 + nestingLevel); }
      if (/\bfor\s+/.test(trimmed)) { lineCyclomatic++; lineCognitive += (1 + nestingLevel); }
      if (/\bwhile\s+/.test(trimmed)) { lineCyclomatic++; lineCognitive += (1 + nestingLevel); }
      if (/\bexcept(?:\s+.*)?:/.test(trimmed)) { lineCyclomatic++; lineCognitive += 1; }
      if (/\band\b|\bor\b/.test(trimmed)) {
        const andOrMatches = (trimmed.match(/\b(and|or)\b/g) || []).length;
        lineCyclomatic += andOrMatches;
      }
      if (/\bwith\s+/.test(trimmed)) { lineCyclomatic++; }

      totalCyclomatic += lineCyclomatic;
      totalCognitive += lineCognitive;

      if (currentFunction) {
        currentFunction.complexity += lineCyclomatic;
        currentFunction.cognitive += lineCognitive;
      }
    }

    if (currentFunction) {
      functions.push({
        name: currentFunction.name,
        line: currentFunction.line,
        endLine: lines.length,
        loc: lines.length - currentFunction.line + 1,
        params: currentFunction.params.length,
        paramNames: currentFunction.params,
        complexity: currentFunction.complexity,
        cognitiveComplexity: currentFunction.cognitive,
        nesting: currentFunction.nesting,
        isAsync: currentFunction.isAsync,
      });
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
    const validationIssues = validateCodeSemantics(code, 'python');
    smells.push(...validationIssues);

    // 1. Function Complexity & Length Smells
    for (const fn of parsed.functions) {
      if (fn.complexity > 10) {
        smells.push({
          id: `smell-cyclo-${fn.name}-${fn.line}`,
          title: `High Cyclomatic Complexity in '${fn.name}' (${fn.complexity})`,
          severity: fn.complexity > 15 ? 'critical' : 'warning',
          line: fn.line,
          endLine: fn.endLine,
          problem: `Function has ${fn.complexity} independent decision paths (threshold: 10).`,
          explanation: `High cyclomatic complexity makes code error-prone, hard to reason about, and difficult to test exhaustively.`,
          recommendation: `Extract branching logic into helper subroutines or use early returns / dispatch tables.`,
          category: 'complexity',
        });
      }

      if (fn.loc > 35) {
        smells.push({
          id: `smell-long-${fn.name}-${fn.line}`,
          title: `Long Function '${fn.name}' (${fn.loc} lines)`,
          severity: fn.loc > 60 ? 'critical' : 'warning',
          line: fn.line,
          endLine: fn.endLine,
          problem: `Function exceeds recommended length threshold of 35 lines.`,
          explanation: `Long functions typically violate the Single Responsibility Principle and combine multiple concerns.`,
          recommendation: `Decompose into smaller single-purpose functions.`,
          category: 'maintainability',
        });
      }

      if (fn.params > 4) {
        smells.push({
          id: `smell-params-${fn.name}-${fn.line}`,
          title: `Excessive Parameters in '${fn.name}' (${fn.params} args)`,
          severity: 'warning',
          line: fn.line,
          problem: `Function takes ${fn.params} parameters.`,
          explanation: `Functions with too many parameters increase coupling and are prone to positional argument mistakes.`,
          recommendation: `Group parameters into a dataclass, pydantic model, or configuration dictionary.`,
          category: 'structure',
        });
      }
    }

    // 2. Class Smells
    for (const cls of parsed.classes) {
      if (cls.methodsCount > 10) {
        smells.push({
          id: `smell-godclass-${cls.name}-${cls.line}`,
          title: `Potential God Class '${cls.name}' (${cls.methodsCount} methods)`,
          severity: 'warning',
          line: cls.line,
          problem: `Class contains ${cls.methodsCount} methods.`,
          explanation: `Classes with excessive responsibilities become centralized bottlenecks and are hard to refactor.`,
          recommendation: `Apply Single Responsibility Principle: separate concerns into dedicated utility or domain classes.`,
          category: 'structure',
        });
      }
    }

    // 3. Line-by-line pattern smells (Bare except, mutable defaults, global variables)
    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i].trim();

      // Bare except
      if (/^except\s*:/.test(line)) {
        smells.push({
          id: `smell-bare-except-${lineNum}`,
          title: `Bare 'except:' Clause (Catch-all)`,
          severity: 'critical',
          line: lineNum,
          codeSnippet: line,
          problem: `Catching all exceptions with bare 'except:' catches SystemExit, KeyboardInterrupt, and memory errors.`,
          explanation: `Hiding all errors prevents graceful debugging and can keep a corrupted program running in an invalid state.`,
          recommendation: `Catch specific exceptions such as 'except (ValueError, KeyError):' or 'except Exception as e:'.`,
          category: 'security',
        });
      }

      // Mutable default arguments: def foo(bar=[]): or def foo(bar={}):
      if (/def\s+\w+\s*\([^)]*=\s*(\[\]|\{\})/i.test(line)) {
        smells.push({
          id: `smell-mutable-default-${lineNum}`,
          title: `Mutable Default Parameter Anti-Pattern`,
          severity: 'critical',
          line: lineNum,
          codeSnippet: line,
          problem: `Default mutable values (list [] or dict {}) are instantiated once at function definition time, not call time.`,
          explanation: `Mutating the parameter inside the function modifies the default object across all future calls, creating subtle shared state bugs.`,
          recommendation: `Use 'def f(param=None):' and initialize 'if param is None: param = []' inside the function body.`,
          category: 'maintainability',
        });
      }

      // Global statement
      if (/^global\s+[a-zA-Z_]\w*/.test(line)) {
        smells.push({
          id: `smell-global-${lineNum}`,
          title: `Use of 'global' Keyword`,
          severity: 'warning',
          line: lineNum,
          codeSnippet: line,
          problem: `Directly mutating global scope variables across functions creates tight coupling.`,
          explanation: `Global state makes concurrency unsafe, unit testing difficult, and tracks unexpected state changes poorly.`,
          recommendation: `Pass variables as arguments or encapsulate them within a class instance.`,
          category: 'coupling',
        });
      }
    }

    // 4. Max nesting smell
    if (parsed.maxNesting > 3) {
      smells.push({
        id: `smell-deep-nesting`,
        title: `Deep Nesting Depth (Level ${parsed.maxNesting})`,
        severity: parsed.maxNesting > 4 ? 'critical' : 'warning',
        line: 1,
        problem: `Code reaches a nesting depth of ${parsed.maxNesting} levels (threshold: 3).`,
        explanation: `Deep arrow anti-patterns (nested if/for/while blocks) degrade cognitive readability exponentially.`,
        recommendation: `Use guard clauses with early returns, list comprehensions, or extract nested loops into helper functions.`,
        category: 'complexity',
      });
    }

    return smells;
  }
}
