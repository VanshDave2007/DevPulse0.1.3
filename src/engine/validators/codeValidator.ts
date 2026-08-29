import { CodeSmell, SupportedLanguage } from '../../types';

export interface ValidationIssue {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  line: number;
  endLine?: number;
  codeSnippet?: string;
  problem: string;
  explanation: string;
  recommendation: string;
  category: 'correctness' | 'security' | 'complexity' | 'maintainability' | 'structure' | 'coupling';
}

/**
 * Robust Deterministic Delimiter & Syntax Validator
 * Verifies matching brackets, quotes, indentation, and language-specific rules.
 */
export function validateCodeSemantics(code: string, language: SupportedLanguage): CodeSmell[] {
  const smells: CodeSmell[] = [];
  const lines = code.split('\n');

  // 1. Delimiter and Bracket Balancing
  validateBracketsAndQuotes(code, lines, language, smells);

  // 2. Language-Specific AST & Syntax Rules
  if (language === 'python') {
    validatePythonSyntax(lines, code, smells);
  } else if (language === 'javascript' || language === 'typescript') {
    validateJavaScriptSyntax(lines, code, smells);
  } else if (language === 'java' || language === 'kotlin') {
    validateJavaSyntax(lines, code, smells);
  } else if (['cpp', 'csharp', 'go', 'rust'].includes(language)) {
    validateCFamilySyntax(lines, code, language, smells);
  }

  // 3. Universal Dead Code & Security Checks
  validateUniversalRules(lines, code, language, smells);

  return smells;
}

/**
 * Universal Delimiter Balancing (Parentheses, Brackets, Braces)
 */
function validateBracketsAndQuotes(
  code: string,
  lines: string[],
  language: SupportedLanguage,
  smells: CodeSmell[]
) {
  const stack: Array<{ char: string; line: number; col: number }> = [];
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

  let inLineComment = false;
  let inBlockComment = false;
  let inString: string | null = null;

  for (let l = 0; l < lines.length; l++) {
    const lineNum = l + 1;
    const line = lines[l];
    inLineComment = false;

    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      const next = line[c + 1];

      // Handle Block Comments (/* ... */)
      if (inBlockComment) {
        if (ch === '*' && next === '/') {
          inBlockComment = false;
          c++;
        }
        continue;
      }

      // Handle Strings
      if (inString) {
        if (ch === '\\') {
          c++; // skip escaped char
          continue;
        }
        if (ch === inString) {
          inString = null;
        }
        continue;
      }

      // Check comments start
      if (language === 'python') {
        if (ch === '#') {
          inLineComment = true;
          break;
        }
        // Python triple quotes
        if ((ch === '"' || ch === "'") && line.substring(c, c + 3) === ch.repeat(3)) {
          // Triple quote start or end
          const triple = ch.repeat(3);
          const restOfLine = line.substring(c + 3);
          const closeIdx = restOfLine.indexOf(triple);
          if (closeIdx !== -1) {
            c += 3 + closeIdx + 2;
            continue;
          } else {
            // Multiline string
            inString = triple;
            c += 2;
            continue;
          }
        }
      } else {
        if (ch === '/' && next === '/') {
          inLineComment = true;
          break;
        }
        if (ch === '/' && next === '*') {
          inBlockComment = true;
          c++;
          continue;
        }
      }

      // String literal opening
      if (ch === '"' || ch === "'" || (ch === '`' && (language === 'javascript' || language === 'typescript'))) {
        inString = ch;
        continue;
      }

      // Delimiter tracking
      if (ch === '(' || ch === '[' || ch === '{') {
        stack.push({ char: ch, line: lineNum, col: c + 1 });
      } else if (ch === ')' || ch === ']' || ch === '}') {
        const expected = pairs[ch];
        if (stack.length === 0) {
          smells.push({
            id: `err-unmatched-closing-${lineNum}-${c}`,
            title: `SyntaxError: Unmatched closing '${ch}'`,
            severity: 'critical',
            line: lineNum,
            codeSnippet: line.trim(),
            problem: `Encountered closing '${ch}' without a matching opening delimiter.`,
            explanation: `Unmatched delimiters cause immediate syntax errors and prevent code parsing/execution.`,
            recommendation: `Remove the stray '${ch}' or add the matching opening delimiter.`,
            category: 'correctness',
          });
        } else {
          const top = stack.pop()!;
          if (top.char !== expected) {
            smells.push({
              id: `err-mismatched-delimiter-${lineNum}-${c}`,
              title: `SyntaxError: Mismatched '${top.char}' and '${ch}'`,
              severity: 'critical',
              line: lineNum,
              codeSnippet: line.trim(),
              problem: `Opening '${top.char}' on line ${top.line} was closed with mismatched '${ch}' on line ${lineNum}.`,
              explanation: `Mismatched delimiters violate lexical nesting rules.`,
              recommendation: `Change '${ch}' to the expected closing delimiter matching '${top.char}'.`,
              category: 'correctness',
            });
          }
        }
      }
    }
  }

  // Check unclosed delimiters in stack
  while (stack.length > 0) {
    const unclosed = stack.pop()!;
    smells.push({
      id: `err-unclosed-delimiter-${unclosed.line}`,
      title: `SyntaxError: Unclosed opening '${unclosed.char}'`,
      severity: 'critical',
      line: unclosed.line,
      codeSnippet: lines[unclosed.line - 1]?.trim() || '',
      problem: `The delimiter '${unclosed.char}' opened on line ${unclosed.line} was never closed.`,
      explanation: `Code blocks and expressions must have properly balanced opening and closing delimiters.`,
      recommendation: `Add the matching closing delimiter for '${unclosed.char}'.`,
      category: 'correctness',
    });
  }

  // Check unclosed string literal at EOF
  if (inString) {
    smells.push({
      id: `err-unclosed-string-eof`,
      title: `SyntaxError: EOL / EOF while scanning string literal`,
      severity: 'critical',
      line: lines.length,
      problem: `String literal starting with '${inString}' is unclosed.`,
      explanation: `String literals must be closed before the end of the line (or closed with triple quotes if multi-line).`,
      recommendation: `Close the string with matching '${inString}'.`,
      category: 'correctness',
    });
  }
}

/**
 * Deterministic Python Syntax & Semantic Validation
 */
function validatePythonSyntax(lines: string[], code: string, smells: CodeSmell[]) {
  const definedVariables = new Set<string>([
    'True', 'False', 'None', 'print', 'len', 'range', 'str', 'int', 'float', 'list',
    'dict', 'set', 'tuple', 'sum', 'min', 'max', 'abs', 'round', 'enumerate', 'zip',
    'map', 'filter', 'isinstance', 'issubclass', 'type', 'id', 'hash', 'open', 'input',
    'super', 'self', 'cls', 'Exception', 'ValueError', 'TypeError', 'KeyError', 'IndexError',
    'AttributeError', 'ImportError', 'StopIteration', 'RuntimeError', 'args', 'kwargs'
  ]);

  const importedSymbols = new Set<string>();
  const symbolUsageCounts = new Map<string, number>();

  const indentStack: number[] = [0];
  let inDocstring = false;
  let docstringQuote = '';

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) continue;

    // Docstring handling
    if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
      const q = trimmed.substring(0, 3);
      if (!inDocstring) {
        inDocstring = true;
        docstringQuote = q;
        if (trimmed.length > 3 && trimmed.endsWith(q)) inDocstring = false;
        continue;
      } else if (q === docstringQuote) {
        inDocstring = false;
        continue;
      }
    }
    if (inDocstring) {
      if (trimmed.endsWith(docstringQuote)) inDocstring = false;
      continue;
    }

    if (trimmed.startsWith('#')) continue;

    // Clean code part (strip trailing comment)
    const codePart = trimmed.split('#')[0].trim();
    if (!codePart) continue;

    // 1. Check Indentation Consistency
    const indentMatch = rawLine.match(/^([ \t]*)/);
    const indentStr = indentMatch ? indentMatch[1] : '';
    if (indentStr.includes('\t') && indentStr.includes(' ')) {
      smells.push({
        id: `err-mixed-indent-${lineNum}`,
        title: `IndentationError: Mixed spaces and tabs`,
        severity: 'critical',
        line: lineNum,
        codeSnippet: trimmed,
        problem: `Line mixes spaces and tabs for indentation.`,
        explanation: `Python 3 disallows mixing tabs and spaces for indentation in the same block.`,
        recommendation: `Use consistent 4 spaces for all indentation.`,
        category: 'correctness',
      });
    }

    const currentIndent = indentStr.replace(/\t/g, '    ').length;
    const previousIndent = indentStack[indentStack.length - 1];

    if (currentIndent > previousIndent) {
      // Check if previous non-blank line ended with colon ':'
      let prevCodeLine = '';
      for (let p = i - 1; p >= 0; p--) {
        const pt = lines[p].split('#')[0].trim();
        if (pt) {
          prevCodeLine = pt;
          break;
        }
      }
      if (prevCodeLine && !prevCodeLine.endsWith(':') && !prevCodeLine.endsWith('\\') && !prevCodeLine.endsWith(',')) {
        smells.push({
          id: `err-unexpected-indent-${lineNum}`,
          title: `IndentationError: Unexpected indent`,
          severity: 'critical',
          line: lineNum,
          codeSnippet: trimmed,
          problem: `Indentation increased unexpectedly without a block statement (such as 'def', 'if', 'for', 'class') on the previous line.`,
          explanation: `Python indentation determines scope hierarchy; unexpected indent throws an IndentationError.`,
          recommendation: `Align indentation with the surrounding block or add a header statement.`,
          category: 'correctness',
        });
      }
      indentStack.push(currentIndent);
    } else if (currentIndent < previousIndent) {
      // Unindenting - must match an existing outer level
      while (indentStack.length > 1 && indentStack[indentStack.length - 1] > currentIndent) {
        indentStack.pop();
      }
      if (indentStack[indentStack.length - 1] !== currentIndent) {
        smells.push({
          id: `err-unindent-mismatch-${lineNum}`,
          title: `IndentationError: Unindent does not match any outer indentation level`,
          severity: 'critical',
          line: lineNum,
          codeSnippet: trimmed,
          problem: `Unindentation on line ${lineNum} does not match any previous indentation block.`,
          explanation: `In Python, all unindents must strictly align with a previous outer block's indentation.`,
          recommendation: `Align indentation with the appropriate parent block.`,
          category: 'correctness',
        });
      }
    }

    // 2. Check Missing Colons on Statement Headers
    const statementKeywords = [
      'def', 'async def', 'class', 'if', 'elif', 'else', 'for', 'while',
      'try', 'except', 'finally', 'with', 'async with'
    ];

    for (const kw of statementKeywords) {
      const regex = new RegExp(`^${kw}\\b`);
      if (regex.test(codePart)) {
        if (!codePart.endsWith(':')) {
          smells.push({
            id: `err-missing-colon-${lineNum}`,
            title: `SyntaxError: Missing colon ':' at end of '${kw}' statement`,
            severity: 'critical',
            line: lineNum,
            codeSnippet: trimmed,
            problem: `'${kw}' block header statement on line ${lineNum} must end with a colon ':'.`,
            explanation: `Python syntax requires a colon at the end of all compound statement headers.`,
            recommendation: `Add a ':' at the end of line ${lineNum}.`,
            category: 'correctness',
          });
        }
        break;
      }
    }

    // 3. Check for Non-Python Operators & Keywords
    if (codePart.includes('===') || codePart.includes('!==')) {
      smells.push({
        id: `err-invalid-operator-equality-${lineNum}`,
        title: `SyntaxError: Invalid operator '===' or '!=='`,
        severity: 'critical',
        line: lineNum,
        codeSnippet: trimmed,
        problem: `Python does not support JavaScript strict equality operators ('===' or '!==').`,
        explanation: `Python uses '==' for value equality and 'is' for identity comparison.`,
        recommendation: `Replace '===' with '==' and '!==' with '!='.`,
        category: 'correctness',
      });
    }

    if (/\+\+|--/.test(codePart) && !codePart.includes('//')) {
      smells.push({
        id: `err-invalid-increment-${lineNum}`,
        title: `SyntaxError: Increment/decrement operator '++' or '--'`,
        severity: 'critical',
        line: lineNum,
        codeSnippet: trimmed,
        problem: `Python does not support '++' or '--' operators.`,
        explanation: `Unary plus or minus repetitions in Python are parsed as double unary operators, not post/pre-increment.`,
        recommendation: `Use '+= 1' or '-= 1' instead.`,
        category: 'correctness',
      });
    }

    if (/&&|\|\|/.test(codePart)) {
      smells.push({
        id: `err-invalid-logical-op-${lineNum}`,
        title: `SyntaxError: Logical operator '&&' or '||'`,
        severity: 'critical',
        line: lineNum,
        codeSnippet: trimmed,
        problem: `Python uses 'and' / 'or' rather than '&&' / '||'.`,
        explanation: `In Python, '&' and '|' are bitwise operators and '&&'/'||' are invalid syntax.`,
        recommendation: `Replace '&&' with 'and', and '||' with 'or'.`,
        category: 'correctness',
      });
    }

    if (/\bfunction\s+[a-zA-Z_]\w*/.test(codePart) || /\b(var|let|const)\s+[a-zA-Z_]\w*/.test(codePart)) {
      smells.push({
        id: `err-js-keyword-in-python-${lineNum}`,
        title: `SyntaxError: Invalid keyword in Python`,
        severity: 'critical',
        line: lineNum,
        codeSnippet: trimmed,
        problem: `Found JavaScript keyword ('function', 'var', 'let', 'const') in Python source.`,
        explanation: `Python uses 'def' for functions and dynamic assignment without variable declarations.`,
        recommendation: `Use 'def function_name(...):' for functions and assign variables directly.`,
        category: 'correctness',
      });
    }

    if (/\b(null|true|false)\b/.test(codePart)) {
      smells.push({
        id: `smell-unpythonic-literal-${lineNum}`,
        title: `NameError: Lowercase literal ('null', 'true', 'false')`,
        severity: 'critical',
        line: lineNum,
        codeSnippet: trimmed,
        problem: `Python literals are capitalized: 'None', 'True', 'False'.`,
        explanation: `Using lowercase 'true', 'false', or 'null' causes a NameError at runtime.`,
        recommendation: `Replace with 'True', 'False', or 'None'.`,
        category: 'correctness',
      });
    }

    // 4. Import Tracking
    const importMatch = codePart.match(/^(?:from\s+([\w.]+)\s+)?import\s+([^#]+)/);
    if (importMatch) {
      const names = importMatch[2].split(',').map((s) => s.trim().split(/\s+as\s+/)[0].trim());
      names.forEach((n) => {
        if (n && n !== '*') {
          importedSymbols.add(n);
          definedVariables.add(n);
        }
      });
    }

    // 5. Function/Class Parameter & Variable Definitions
    const funcMatch = codePart.match(/^def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)/);
    if (funcMatch) {
      definedVariables.add(funcMatch[1]);
      const params = funcMatch[2].split(',').map((p) => p.trim().split(':')[0].split('=')[0].trim()).filter(Boolean);
      params.forEach((p) => definedVariables.add(p));
    }

    const classMatch = codePart.match(/^class\s+([a-zA-Z_]\w*)/);
    if (classMatch) {
      definedVariables.add(classMatch[1]);
    }

    // Assignment tracking (e.g. total = 0 or a, b = 1, 2)
    const assignMatch = codePart.match(/^([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*)\s*=[^=]/);
    if (assignMatch) {
      assignMatch[1].split(',').map((v) => v.trim()).forEach((v) => {
        if (/^[a-zA-Z_]\w*$/.test(v)) definedVariables.add(v);
      });
    }

    // For loop variable tracking: for item in items:
    const forMatch = codePart.match(/^for\s+([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*)\s+in\s+/);
    if (forMatch) {
      forMatch[1].split(',').map((v) => v.trim()).forEach((v) => {
        if (/^[a-zA-Z_]\w*$/.test(v)) definedVariables.add(v);
      });
    }

    // Check Augmented Assignment before initialization: e.g. total += x
    const augMatch = codePart.match(/^([a-zA-Z_]\w*)\s*(\+=|-=|\*=|\/=|%=)\s*/);
    if (augMatch) {
      const varName = augMatch[1];
      if (!definedVariables.has(varName)) {
        smells.push({
          id: `err-unbound-local-${lineNum}`,
          title: `UnboundLocalError: Variable '${varName}' referenced before assignment`,
          severity: 'critical',
          line: lineNum,
          codeSnippet: trimmed,
          problem: `Variable '${varName}' is modified with '${augMatch[2]}' before being initialized.`,
          explanation: `In Python, augmented assignment requires the variable to already have an assigned value in local/enclosing scope.`,
          recommendation: `Initialize '${varName} = 0' (or appropriate initial value) before the loop or operation.`,
          category: 'correctness',
        });
      }
    }

    // Track symbol usage across file
    const tokens = codePart.match(/[a-zA-Z_]\w*/g) || [];
    tokens.forEach((tok) => {
      symbolUsageCounts.set(tok, (symbolUsageCounts.get(tok) || 0) + 1);
    });

    // 6. Division by Zero detection
    if (/\/\s*0(?![.\d])|\/\/\s*0(?![.\d])|%\s*0(?![.\d])/.test(codePart)) {
      smells.push({
        id: `err-zero-division-${lineNum}`,
        title: `ZeroDivisionError: Division or modulo by zero`,
        severity: 'critical',
        line: lineNum,
        codeSnippet: trimmed,
        problem: `Literal division or modulo by zero detected on line ${lineNum}.`,
        explanation: `Dividing by zero raises ZeroDivisionError and crashes the program.`,
        recommendation: `Ensure divisor is non-zero or add a zero-check guard clause.`,
        category: 'correctness',
      });
    }
  }

  // Check unused imports
  importedSymbols.forEach((sym) => {
    const count = symbolUsageCounts.get(sym) || 0;
    // count === 1 means it only appears in the import statement itself
    if (count <= 1) {
      smells.push({
        id: `smell-unused-import-${sym}`,
        title: `Unused Import '${sym}'`,
        severity: 'info',
        line: 1,
        problem: `Imported module or symbol '${sym}' is never referenced in this file.`,
        explanation: `Unused imports clutter the namespace and increase module load overhead.`,
        recommendation: `Remove the unused import '${sym}'.`,
        category: 'maintainability',
      });
    }
  });
}

/**
 * Deterministic JavaScript / TypeScript Syntax & Semantic Validation
 */
function validateJavaScriptSyntax(lines: string[], code: string, smells: CodeSmell[]) {
  const declaredVariables = new Set<string>([
    'console', 'window', 'document', 'process', 'global', 'Math', 'JSON', 'Object',
    'Array', 'String', 'Number', 'Boolean', 'Date', 'RegExp', 'Map', 'Set', 'Promise',
    'Error', 'TypeError', 'RangeError', 'SyntaxError', 'setTimeout', 'clearTimeout',
    'setInterval', 'clearInterval', 'fetch', 'require', 'module', 'exports', 'import',
    'undefined', 'null', 'NaN', 'Infinity', 'this', 'arguments'
  ]);

  const importedSymbols = new Set<string>();
  const symbolUsageCounts = new Map<string, number>();

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i].trim();
    if (!line || line.startsWith('//') || line.startsWith('/*')) continue;

    // Check malformed if/while/for without parentheses: e.g. "if x > 0 {"
    if (/^(if|while|for)\s+[^(].*\{/.test(line)) {
      smells.push({
        id: `err-missing-parens-control-${lineNum}`,
        title: `SyntaxError: Missing parentheses around condition`,
        severity: 'critical',
        line: lineNum,
        codeSnippet: line,
        problem: `Control statement '${line.split(' ')[0]}' condition must be enclosed in parentheses '()'.`,
        explanation: `JavaScript / TypeScript requires conditional expressions in if/for/while to be wrapped in parentheses.`,
        recommendation: `Wrap the condition in parentheses: e.g., 'if (condition) { ... }'.`,
        category: 'correctness',
      });
    }

    // Check const without initializer: const foo;
    if (/^const\s+[a-zA-Z_]\w*\s*;?$/.test(line)) {
      smells.push({
        id: `err-const-no-init-${lineNum}`,
        title: `SyntaxError: Missing initializer in 'const' declaration`,
        severity: 'critical',
        line: lineNum,
        codeSnippet: line,
        problem: `'const' declarations must be initialized immediately.`,
        explanation: `Constants cannot be declared without a value because they cannot be reassigned later.`,
        recommendation: `Assign a value to the constant upon declaration.`,
        category: 'correctness',
      });
    }

    // Track declarations: const x = 1, let y = 2, var z = 3
    const declMatch = line.match(/^(?:export\s+)?(?:const|let|var)\s+([a-zA-Z_]\w*)/);
    if (declMatch) {
      declaredVariables.add(declMatch[1]);
    }

    // Function declarations
    const fnMatch = line.match(/^(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)/);
    if (fnMatch) {
      declaredVariables.add(fnMatch[1]);
      fnMatch[2].split(',').map((p) => p.trim().split(':')[0].trim()).forEach((p) => {
        if (p) declaredVariables.add(p);
      });
    }

    // Import tracking
    const esmImport = line.match(/^import\s+(?:\{([^}]+)\}|([a-zA-Z_]\w*))\s+from/);
    if (esmImport) {
      const names = (esmImport[1] || esmImport[2] || '').split(',').map((s) => s.trim().split(/\s+as\s+/)[0].trim());
      names.forEach((n) => {
        if (n) {
          importedSymbols.add(n);
          declaredVariables.add(n);
        }
      });
    }

    // Unsafe DOM / Execution patterns
    if (/\beval\s*\(/.test(line)) {
      smells.push({
        id: `smell-sec-eval-${lineNum}`,
        title: `Security Vulnerability: Arbitrary Code Execution via 'eval()'`,
        severity: 'critical',
        line: lineNum,
        codeSnippet: line,
        problem: `Use of 'eval()' executes untrusted strings as code.`,
        explanation: `'eval()' creates severe Remote Code Execution (RCE) and XSS attack vectors, while disabling V8 compiler optimizations.`,
        recommendation: `Use JSON.parse() or structured parsing libraries instead of eval.`,
        category: 'security',
      });
    }

    if (/\binnerHTML\s*=/.test(line)) {
      smells.push({
        id: `smell-sec-innerhtml-${lineNum}`,
        title: `Security Risk: Potential Cross-Site Scripting (XSS) via 'innerHTML'`,
        severity: 'warning',
        line: lineNum,
        codeSnippet: line,
        problem: `Directly assigning raw strings to 'innerHTML' can introduce XSS injection flaws.`,
        explanation: `If unescaped user input is rendered into innerHTML, attackers can inject malicious scripts.`,
        recommendation: `Use 'textContent', 'innerText', or a safe DOM sanitizer (such as DOMPurify).`,
        category: 'security',
      });
    }

    // Track symbol usage
    const tokens = line.match(/[a-zA-Z_]\w*/g) || [];
    tokens.forEach((tok) => {
      symbolUsageCounts.set(tok, (symbolUsageCounts.get(tok) || 0) + 1);
    });
  }

  // Unused imports check
  importedSymbols.forEach((sym) => {
    const count = symbolUsageCounts.get(sym) || 0;
    if (count <= 1) {
      smells.push({
        id: `smell-unused-import-js-${sym}`,
        title: `Unused Import '${sym}'`,
        severity: 'info',
        line: 1,
        problem: `Imported identifier '${sym}' is never used in this file.`,
        explanation: `Unused imports inflate bundle sizes and make dependency trees harder to understand.`,
        recommendation: `Remove the unused import '${sym}'.`,
        category: 'maintainability',
      });
    }
  });
}

/**
 * Deterministic Java / Kotlin Syntax & Quality Validation
 */
function validateJavaSyntax(lines: string[], code: string, smells: CodeSmell[]) {
  let hasClass = false;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i].trim();
    if (!line || line.startsWith('//') || line.startsWith('/*')) continue;

    if (/\bclass\s+[a-zA-Z_]\w*/.test(line) || /\binterface\s+[a-zA-Z_]\w*/.test(line) || /\benum\s+[a-zA-Z_]\w*/.test(line)) {
      hasClass = true;
    }

    // Missing semicolon on regular statement lines
    if (
      !line.endsWith(';') &&
      !line.endsWith('{') &&
      !line.endsWith('}') &&
      !line.startsWith('@') &&
      !line.startsWith('//') &&
      !line.startsWith('/*') &&
      !line.endsWith('*/') &&
      !/^(public|protected|private|static|final|abstract|class|interface|enum|if|else|for|while|try|catch|finally|switch|default:)/.test(line)
    ) {
      // Possible missing semicolon
      if (/^[a-zA-Z_]\w*.*=.*[^;]$/.test(line) || /^return\s+[^;]+$/.test(line) || /^System\.out\.println\(.*\)$/.test(line)) {
        smells.push({
          id: `err-missing-semicolon-${lineNum}`,
          title: `SyntaxError: Missing semicolon ';' at end of statement`,
          severity: 'critical',
          line: lineNum,
          codeSnippet: line,
          problem: `Java requires all executable statements to terminate with a semicolon ';'.`,
          explanation: `The compiler requires semicolons to delimit statement boundaries.`,
          recommendation: `Add a ';' at the end of line ${lineNum}.`,
          category: 'correctness',
        });
      }
    }
  }

  // Top-level code outside of class in Java
  if (!hasClass && lines.length > 5 && (code.includes('public static void main') || code.includes('System.out.println'))) {
    smells.push({
      id: `err-missing-class-wrapper`,
      title: `SyntaxError: Java code must be enclosed inside a class`,
      severity: 'critical',
      line: 1,
      problem: `No class definition found. Java statements cannot exist as raw top-level script code.`,
      explanation: `All Java executable logic must reside inside class methods.`,
      recommendation: `Wrap the code in 'public class Main { public static void main(String[] args) { ... } }'.`,
      category: 'correctness',
    });
  }
}

/**
 * Deterministic C / C++ / Systems Validation
 */
function validateCFamilySyntax(lines: string[], code: string, lang: SupportedLanguage, smells: CodeSmell[]) {
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i].trim();
    if (!line || line.startsWith('//') || line.startsWith('/*')) continue;

    // Dangerous C functions
    if (/\bgets\s*\(/.test(line)) {
      smells.push({
        id: `smell-sec-gets-${lineNum}`,
        title: `Critical Security Vulnerability: Use of deprecated 'gets()'`,
        severity: 'critical',
        line: lineNum,
        codeSnippet: line,
        problem: `'gets()' has no buffer bounds checking and is inherently susceptible to buffer overflow exploits.`,
        explanation: `'gets()' was removed from C11 because it inevitably leads to memory corruption or arbitrary code execution vulnerabilities.`,
        recommendation: `Replace with 'fgets(buffer, sizeof(buffer), stdin)'.`,
        category: 'security',
      });
    }

    if (/\bstrcpy\s*\(/.test(line)) {
      smells.push({
        id: `smell-sec-strcpy-${lineNum}`,
        title: `Security Risk: Unbounded string copy 'strcpy()'`,
        severity: 'warning',
        line: lineNum,
        codeSnippet: line,
        problem: `'strcpy()' does not check destination buffer size.`,
        explanation: `If the source string exceeds the destination buffer length, memory corruption occurs.`,
        recommendation: `Use 'strncpy()' or 'snprintf()' with explicit length constraints.`,
        category: 'security',
      });
    }
  }
}

/**
 * Universal Dead Code & Security Checks
 */
function validateUniversalRules(lines: string[], code: string, language: SupportedLanguage, smells: CodeSmell[]) {
  // 1. Dead Code / Unreachable Statements after return/raise/throw/break
  for (let i = 0; i < lines.length - 1; i++) {
    const lineNum = i + 1;
    const line = lines[i].trim();
    const nextLine = lines[i + 1].trim();

    if (!line || line.startsWith('//') || line.startsWith('#') || line.startsWith('/*')) continue;

    // Check if line is unconditional return/throw/break/continue
    const isUnconditionalExit =
      /^(return\b|throw\b|raise\b|break;|continue;|return;|exit\()/.test(line) &&
      !line.includes('if') &&
      !line.endsWith('{') &&
      !line.endsWith(':');

    if (isUnconditionalExit && nextLine && !nextLine.startsWith('}') && !nextLine.startsWith('case') && !nextLine.startsWith('default') && !nextLine.startsWith('#') && !nextLine.startsWith('//') && !nextLine.startsWith('except') && !nextLine.startsWith('finally') && !nextLine.startsWith('elif') && !nextLine.startsWith('else')) {
      // Verify indentation or scope to ensure it's in the same block
      const currentIndent = lines[i].search(/\S/);
      const nextIndent = lines[i + 1].search(/\S/);

      if (currentIndent !== -1 && currentIndent === nextIndent) {
        smells.push({
          id: `smell-dead-code-${lineNum + 1}`,
          title: `Dead Code: Unreachable statement after '${line.split(' ')[0]}'`,
          severity: 'warning',
          line: lineNum + 1,
          codeSnippet: nextLine,
          problem: `Code immediately following an unconditional '${line.split(' ')[0]}' will never execute.`,
          explanation: `Unreachable code increases maintenance confusion and indicates potential logic or refactoring errors.`,
          recommendation: `Remove the unreachable statement or re-evaluate the preceding control flow.`,
          category: 'correctness',
        });
      }
    }
  }

  // 2. Hardcoded Secrets / Tokens Detection
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i].trim();

    if (
      /(api_key|apikey|secret_key|password|auth_token|access_token|private_key)\s*[:=]\s*["'][a-zA-Z0-9_\-]{16,}["']/i.test(line) &&
      !line.includes('process.env') &&
      !line.includes('os.environ')
    ) {
      smells.push({
        id: `smell-sec-hardcoded-secret-${lineNum}`,
        title: `Security Risk: Potential Hardcoded Secret or API Key`,
        severity: 'critical',
        line: lineNum,
        codeSnippet: line,
        problem: `Potential credential or secret key hardcoded in plaintext source code.`,
        explanation: `Hardcoded credentials exposed in source repositories lead to account compromise and unauthorized access.`,
        recommendation: `Store sensitive secrets in environment variables (.env) or a secure secrets manager.`,
        category: 'security',
      });
    }
  }
}
