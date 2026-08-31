import {
  ErrorAnalysisInput,
  ErrorAnalysisResult,
  ErrorClassificationType,
  KnowledgeConfidenceLevel,
  SupportedLanguage,
} from '../types';
import {
  getLanguageKnowledgeProfile,
  detectLanguageFromSnippetOrFile,
} from '../engine/learning/languageKnowledgeRegistry';

/**
 * CENTRALIZED ERROR INTELLIGENCE ENGINE
 * Transforms raw compiler, runtime, stack trace, or terminal outputs into
 * language-grounded diagnoses with root cause analysis, evidence, diffs,
 * verification methods, and Learn Mode concept deep-links.
 */

export function analyzeError(input: ErrorAnalysisInput): ErrorAnalysisResult {
  const rawText = (input.rawErrorText || input.stackTrace || input.compilerOutput || input.terminalOutput || input.buildOutput || input.testOutput || '').trim();
  const sourceCode = input.sourceCode || '';
  const detectedLang = input.language || detectLanguageFromSnippetOrFile(input.fileName, sourceCode || rawText);
  const profile = getLanguageKnowledgeProfile(detectedLang);

  // 1. Extract Line / Column / File from Stack or Error Pattern
  const location = extractErrorLocation(rawText, input.fileName, input.lineNumber, input.columnNumber, sourceCode);

  // 2. Classify Error and Identify Name
  const { errorName, category } = classifyErrorFromPatterns(rawText, detectedLang, profile);

  // 3. Match against Knowledge Profile for known error patterns
  const matchedPattern = profile.commonErrors.find(
    (e) =>
      rawText.toLowerCase().includes(e.errorType.toLowerCase()) ||
      errorName.toLowerCase().includes(e.errorType.toLowerCase())
  );

  // 4. Derive Root Cause, Explanation, and Remediation
  const rootCause =
    matchedPattern?.cause ||
    deriveDefaultRootCause(errorName, category, detectedLang, location?.offendingCodeSnippet);

  const whyItHappens =
    matchedPattern?.explanation ||
    deriveDefaultWhyItHappens(errorName, category, detectedLang);

  const howToFix =
    matchedPattern?.fixStrategy ||
    deriveDefaultHowToFix(errorName, category, detectedLang, location?.offendingCodeSnippet);

  const howToPrevent =
    matchedPattern?.preventionTip ||
    `Follow ${profile.name} best practices and enable automated linting/type-checking in CI.`;

  // 5. Build Evidence Chain
  const evidence: string[] = [];
  if (location?.file) {
    evidence.push(`Origin file: \`${location.file}\`${location.line ? ` on Line ${location.line}` : ''}`);
  }
  if (location?.offendingCodeSnippet) {
    evidence.push(`Offending statement: \`${location.offendingCodeSnippet.trim()}\``);
  }
  if (rawText) {
    const firstLine = rawText.split('\n')[0];
    evidence.push(`Parser / Runtime diagnostic: "${firstLine.slice(0, 150)}"`);
  }
  evidence.push(`Engine classification: [${category}] against ${profile.name} ${profile.typeSystem.category} Typing & ${profile.memoryModel.management} runtime.`);

  // 6. Generate Fix Diff
  const proposedFixDiff = generateProposedFix(
    sourceCode,
    location?.line,
    location?.offendingCodeSnippet,
    category,
    detectedLang,
    matchedPattern
  );

  // 7. Determine Verification Method
  const verificationMethod = deriveVerificationMethod(detectedLang, category);

  // 8. Confidence Assessment
  const confidence: KnowledgeConfidenceLevel = matchedPattern
    ? 'VERIFIED'
    : rawText.length > 0 && location?.line
    ? 'HIGH_CONFIDENCE'
    : 'LIKELY';

  const confidenceRationale = matchedPattern
    ? `Direct match found in ${profile.name} engineering knowledge profile for '${matchedPattern.errorType}'.`
    : `Syntactic/heuristic deduction from ${profile.name} language grammar and stack trace frames.`;

  // 9. Learn Mode Concept Deep Link
  const learnConceptLink = deriveLearnConceptLink(detectedLang, category, matchedPattern?.learnConceptId);

  return {
    id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    detectedLanguage: detectedLang,
    errorName,
    errorCategory: category,
    location,
    rootCause,
    whyItHappens,
    howToFix,
    howToPrevent,
    evidence,
    proposedFixDiff,
    verificationMethod,
    confidence,
    confidenceRationale,
    matchedKnowledgeProfile: profile.name,
    learnConceptLink,
  };
}

/**
 * Extracts line, column, file, and offending code snippet from error text
 */
function extractErrorLocation(
  rawText: string,
  providedFile?: string,
  providedLine?: number,
  providedCol?: number,
  sourceCode?: string
): { file: string; line?: number; column?: number; offendingCodeSnippet?: string } {
  let file = providedFile || 'workspace-file';
  let line = providedLine;
  let column = providedCol;

  // Regex matches for standard stack frames:
  // e.g., "at File.ts:42:15", "File.py, line 42", "main.rs:42:5", "App.java:42"
  const linePatterns = [
    /(?:at\s+.*?\()?([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+):(\d+):?(\d+)?/,
    /File\s+["']([^"']+)["'],\s+line\s+(\d+)/i,
    /-->\s+([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+):(\d+):(\d+)/,
    /([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)\((\d+),(\d+)\)/,
    /line\s+(\d+)/i,
  ];

  for (const pat of linePatterns) {
    const match = rawText.match(pat);
    if (match) {
      if (match[1] && isNaN(Number(match[1]))) {
        file = match[1];
      }
      if (match[2] && !isNaN(Number(match[2]))) {
        line = Number(match[2]);
      } else if (match[1] && !isNaN(Number(match[1]))) {
        line = Number(match[1]);
      }
      if (match[3] && !isNaN(Number(match[3]))) {
        column = Number(match[3]);
      }
      break;
    }
  }

  let offendingCodeSnippet: string | undefined;
  if (sourceCode && line && line > 0) {
    const lines = sourceCode.split('\n');
    if (lines[line - 1] !== undefined) {
      offendingCodeSnippet = lines[line - 1];
    }
  }

  return { file, line, column, offendingCodeSnippet };
}

/**
 * Classifies error text into standard categories
 */
function classifyErrorFromPatterns(
  rawText: string,
  lang: SupportedLanguage,
  profile: any
): { errorName: string; category: ErrorClassificationType } {
  const lower = rawText.toLowerCase();

  // 1. Syntax Errors
  if (
    lower.includes('syntaxerror') ||
    lower.includes('unexpected token') ||
    lower.includes('parse error') ||
    lower.includes('indentationerror') ||
    lower.includes('taberror') ||
    lower.includes('expected semicolon')
  ) {
    return {
      errorName: extractFirstLineTitle(rawText, 'Syntax / Grammar Error'),
      category: 'SYNTAX',
    };
  }

  // 2. Type Errors
  if (
    lower.includes('typeerror') ||
    lower.includes('type mismatch') ||
    lower.includes('cannot be assigned to type') ||
    lower.includes('incompatible types') ||
    lower.includes('ts2322') ||
    lower.includes('ts2345') ||
    lower.includes('ts2532')
  ) {
    return {
      errorName: extractFirstLineTitle(rawText, 'Type Check Failure'),
      category: 'TYPE',
    };
  }

  // 3. Compile / Rust Borrow / C++ Segfault / Ownership
  if (
    lower.includes('cannot borrow') ||
    lower.includes('use of moved value') ||
    lower.includes('lifetime') ||
    lower.includes('error[e') ||
    lower.includes('undefined reference') ||
    lower.includes('fatal error: ')
  ) {
    return {
      errorName: extractFirstLineTitle(rawText, 'Compiler / Borrow Checker Diagnostic'),
      category: 'COMPILE',
    };
  }

  // 4. Memory / Segfault / NullPointer
  if (
    lower.includes('nullpointerexception') ||
    lower.includes('segmentation fault') ||
    lower.includes('sigsegv') ||
    lower.includes('out of memory') ||
    lower.includes('heap out of memory') ||
    lower.includes('double free')
  ) {
    return {
      errorName: extractFirstLineTitle(rawText, 'Memory / Pointer Dereference Failure'),
      category: 'MEMORY',
    };
  }

  // 5. Concurrency / Deadlock
  if (
    lower.includes('deadlock') ||
    lower.includes('race detected') ||
    lower.includes('concurrentmodificationexception') ||
    lower.includes('threadpool exhausted')
  ) {
    return {
      errorName: extractFirstLineTitle(rawText, 'Concurrency / Thread Safety Violation'),
      category: 'CONCURRENCY',
    };
  }

  // 6. Security / Vulnerability
  if (
    lower.includes('cwe-') ||
    lower.includes('vulnerability') ||
    lower.includes('injection') ||
    lower.includes('xss') ||
    lower.includes('csrf') ||
    lower.includes('unauthorized') ||
    lower.includes('prototype pollution')
  ) {
    return {
      errorName: extractFirstLineTitle(rawText, 'Security Vulnerability Detected'),
      category: 'SECURITY',
    };
  }

  // 7. Database
  if (
    lower.includes('sql') ||
    lower.includes('postgres') ||
    lower.includes('mysql') ||
    lower.includes('relation does not exist') ||
    lower.includes('foreign key constraint') ||
    lower.includes('unique constraint')
  ) {
    return {
      errorName: extractFirstLineTitle(rawText, 'Database Query / Schema Error'),
      category: 'DATABASE',
    };
  }

  // 8. Build / Dependency
  if (
    lower.includes('module not found') ||
    lower.includes('cannot find module') ||
    lower.includes('package not found') ||
    lower.includes('build failed') ||
    lower.includes('vite: not found')
  ) {
    return {
      errorName: extractFirstLineTitle(rawText, 'Dependency / Package Resolution Error'),
      category: 'DEPENDENCY',
    };
  }

  // Fallback: Default to Runtime Error
  return {
    errorName: extractFirstLineTitle(rawText, 'Runtime Diagnostic Exception'),
    category: 'RUNTIME',
  };
}

function extractFirstLineTitle(rawText: string, fallback: string): string {
  if (!rawText) return fallback;
  const first = rawText.split('\n')[0].trim();
  return first.length > 0 && first.length < 90 ? first : fallback;
}

function deriveDefaultRootCause(
  errorName: string,
  category: ErrorClassificationType,
  lang: SupportedLanguage,
  snippet?: string
): string {
  switch (category) {
    case 'SYNTAX':
      return `The parser encountered an unclosed delimiter, invalid keyword token, or incorrect indentation structure in ${lang}.`;
    case 'TYPE':
      return `A value was passed to a function or assigned to a variable that does not conform to the expected type signature or nullability constraints.`;
    case 'COMPILE':
      return `The compiler rejected the source unit due to strict language invariant violations (e.g. lifetimes, borrow semantics, or missing definitions).`;
    case 'MEMORY':
      return `Attempted to dereference an unallocated, uninitialized, or already deallocated memory pointer / null reference.`;
    case 'CONCURRENCY':
      return `Simultaneous unsynchronized read/write operations on shared memory or circular resource lock dependencies.`;
    case 'SECURITY':
      return `Unsanitized user-controlled input flows into a sensitive execution sink or security boundary.`;
    case 'DATABASE':
      return `Database engine failed to execute query due to missing tables, columns, type mismatches, or constraint violations.`;
    case 'DEPENDENCY':
      return `The project imports an external package or module that is not installed in the active environment.`;
    default:
      return snippet
        ? `Runtime execution failed at statement: \`${snippet.trim()}\``
        : `An unexpected runtime state or unhandled exception was encountered during execution.`;
  }
}

function deriveDefaultWhyItHappens(
  errorName: string,
  category: ErrorClassificationType,
  lang: SupportedLanguage
): string {
  switch (category) {
    case 'SYNTAX':
      return `Languages like ${lang} enforce strict grammar rules. When tokens appear out of grammar sequence, the Abstract Syntax Tree (AST) cannot be constructed.`;
    case 'TYPE':
      return `Static or runtime type validation protects against illegal operations on incompatible data shapes.`;
    case 'MEMORY':
      return `Accessing addresses outside allocated heap/stack boundaries triggers operating system memory protection faults.`;
    case 'SECURITY':
      return `Allowing untrusted input to dictate command structure or database queries allows malicious attackers to alter execution logic.`;
    default:
      return `The program encountered an invariant violation that was not caught or handled by defensive boundary checks.`;
  }
}

function deriveDefaultHowToFix(
  errorName: string,
  category: ErrorClassificationType,
  lang: SupportedLanguage,
  snippet?: string
): string {
  switch (category) {
    case 'SYNTAX':
      return `Check matching brackets {}, parentheses (), string quotes, and verify indentation consistency.`;
    case 'TYPE':
      return `Add explicit type guards, null checks (if/optional chaining), or refine function argument types.`;
    case 'COMPILE':
      return `Review compiler diagnostics, borrow lifetimes, and verify imported symbol names.`;
    case 'MEMORY':
      return `Ensure pointers/objects are checked for null or non-null prior to dereferencing, and avoid dangling references.`;
    case 'SECURITY':
      return `Apply parameterization, context-aware sanitization, or input schema validation at entry points.`;
    case 'DEPENDENCY':
      return `Run the appropriate package manager installation command (e.g. \`npm install\`, \`pip install\`, or \`cargo add\`).`;
    default:
      return `Add defensive assertions, verify input parameters, and wrap the critical section in appropriate error handling.`;
  }
}

function generateProposedFix(
  sourceCode: string,
  lineNum?: number,
  snippet?: string,
  category?: ErrorClassificationType,
  lang?: SupportedLanguage,
  pattern?: any
): { originalCode: string; fixedCode: string; hunkDiff: string; explanation: string } | undefined {
  if (pattern?.badExample && pattern?.fixedExample) {
    return {
      originalCode: pattern.badExample,
      fixedCode: pattern.fixedExample,
      hunkDiff: `- ${pattern.badExample.replace(/\n/g, '\n- ')}\n+ ${pattern.fixedExample.replace(/\n/g, '\n+ ')}`,
      explanation: pattern.fixStrategy,
    };
  }

  if (snippet && lineNum) {
    let fixedLine = snippet;
    let explanation = 'Applied defensive guard clause and sanitized variable handling.';

    if (snippet.includes('==') && (lang === 'javascript' || lang === 'typescript')) {
      fixedLine = snippet.replace(/==/g, '===');
      explanation = 'Replaced loose equality == with strict equality === to prevent implicit type coercion.';
    } else if (snippet.includes('.get(') === false && snippet.includes('[') && lang === 'python') {
      fixedLine = `// Guarded access\nif key in data:\n    ${snippet}`;
      explanation = 'Added key presence verification before dictionary lookup to avoid KeyError.';
    }

    return {
      originalCode: snippet,
      fixedCode: fixedLine,
      hunkDiff: `- ${snippet}\n+ ${fixedLine}`,
      explanation,
    };
  }

  return undefined;
}

function deriveVerificationMethod(
  lang: SupportedLanguage,
  category: ErrorClassificationType
): {
  type: 'COMPILER' | 'INTERPRETER' | 'TYPE_CHECKER' | 'LINTER' | 'UNIT_TESTS' | 'STATIC_ANALYSIS' | 'UNAVAILABLE';
  commandOrMethod: string;
  expectedOutcome: string;
} {
  switch (lang) {
    case 'typescript':
      return {
        type: 'TYPE_CHECKER',
        commandOrMethod: 'npx tsc --noEmit',
        expectedOutcome: 'Zero diagnostic type errors (Exit code 0).',
      };
    case 'python':
      return {
        type: 'LINTER',
        commandOrMethod: 'ruff check . && mypy .',
        expectedOutcome: 'Clean syntax and PEP 484 type verification.',
      };
    case 'rust':
      return {
        type: 'COMPILER',
        commandOrMethod: 'cargo check && cargo clippy',
        expectedOutcome: 'Compilation succeeds with zero borrow checker or lifetime errors.',
      };
    case 'go':
      return {
        type: 'COMPILER',
        commandOrMethod: 'go vet ./... && go build ./...',
        expectedOutcome: 'Go compiler verification passes with no race warnings.',
      };
    default:
      return {
        type: 'STATIC_ANALYSIS',
        commandOrMethod: 'DevPulse AST Analyzer Verification',
        expectedOutcome: 'Re-analysis confirms cyclomatic complexity and health metrics pass thresholds.',
      };
  }
}

function deriveLearnConceptLink(
  lang: SupportedLanguage,
  category: ErrorClassificationType,
  explicitConceptId?: string
): { conceptId: string; conceptTitle: string; language: SupportedLanguage; summary: string } | undefined {
  if (explicitConceptId) {
    return {
      conceptId: explicitConceptId,
      conceptTitle: explicitConceptId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      language: lang,
      summary: `Master ${lang} principles to prevent ${category.toLowerCase()} issues in production.`,
    };
  }

  const profile = getLanguageKnowledgeProfile(lang);
  return {
    conceptId: `${lang}-fundamentals`,
    conceptTitle: `${profile.name} Core Architecture & Best Practices`,
    language: lang,
    summary: `Deep dive into ${profile.name} execution models, memory management, and idioms.`,
  };
}
