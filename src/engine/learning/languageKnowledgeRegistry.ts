import {
  LanguageKnowledgeProfile,
  SupportedLanguage,
  ErrorClassificationType,
} from '../../types';
import { learningContentMap, allLanguagesLearningContent } from '../../data/learning';

/**
 * 15-LANGUAGE DEEP ENGINEERING KNOWLEDGE REGISTRY
 * Provides multi-layer understanding across Syntax, Semantics, Types, Runtime,
 * Memory Model, Concurrency, Standard Library, Tooling, Build, Testing,
 * Security, Errors, Debugging, Architecture, Anti-patterns, and Interoperability.
 */

export const LANGUAGE_KNOWLEDGE_PROFILES: Record<SupportedLanguage, LanguageKnowledgeProfile> = {
  python: {
    language: 'python',
    name: 'Python',
    displayName: 'Python (CPython / PyPy)',
    icon: '🐍',
    color: 'text-amber-400',
    fileExtensions: ['.py', '.pyw', '.ipynb', '.pyi'],
    paradigms: ['Object-Oriented', 'Imperative', 'Functional', 'Reflective'],
    syntaxRules: {
      statementDelimiters: 'Newlines (no semicolons required; optional for multi-statement lines)',
      blockScoping: 'Whitespace Indentation (PEP 8 recommends strict 4 spaces per indent level)',
      casingConventions: {
        variables: 'snake_case',
        functions: 'snake_case',
        classes: 'PascalCase',
        constants: 'SCREAMING_SNAKE_CASE',
      },
      comments: {
        singleLine: '# Comment text',
        multiLine: '"""Triple double-quotes or single-quotes Docstring"""',
        docComment: 'PEP 257 docstrings as first statement in module, class, or function',
      },
      keyRules: [
        'Strict indentation: mixing tabs and spaces raises IndentationError / TabError',
        'Colon (:) terminates header statements (def, class, if, for, while, with, try)',
        '*args collects variable positional arguments into a tuple; **kwargs collects keyword arguments into a dict',
        'Scope hierarchy follows LEGB (Local -> Enclosing -> Global -> Built-in)',
        'Default parameter arguments are evaluated ONCE at function definition time (avoid mutable defaults like def fn(lst=[]))',
        'Dunder/Magic methods (__init__, __str__, __repr__, __enter__, __exit__, __getitem__, __len__) implement protocol hooks',
      ],
    },
    typeSystem: {
      category: 'Dynamic',
      safety: 'Strong',
      inference: true,
      typeCoercion: 'Explicit Only',
      keyDetails: [
        'Strong dynamic typing: "2" + 2 raises TypeError (no automatic string coercion)',
        'Optional static typing via PEP 484 type annotations (typing module, TypeVar, Generic, Protocol)',
        'Checked at development time using tools like mypy, pyright, or ruff, but ignored at CPython runtime',
        'Duck typing philosophy: "If it walks like a duck and quacks like a duck, it is a duck"',
      ],
    },
    executionModel: {
      runtime: 'CPython bytecode virtual machine (.pyc bytecode interpreter) / PyPy JIT / MicroPython',
      compilationTarget: 'Bytecode',
      modelType: 'Interpreted Bytecode with GIL',
      details: [
        'Source code compiles to bytecode instructions (.pyc) executed on CPython stack VM',
        'Global Interpreter Lock (GIL) serializes thread execution within a single CPython OS process for thread-safe C-extensions',
        'For CPU-intensive parallelism, use multiprocessing or native C/Rust extensions rather than threading',
        'asyncio uses single-threaded cooperative event loop with coroutines and tasks',
      ],
    },
    memoryModel: {
      management: 'Garbage Collected',
      stackVsHeap: 'All Python objects live on the heap; variable names in frames are heap references',
      garbageCollection: 'Dual mechanism: Primary deterministic Reference Counting + Cyclic Garbage Collector (generational tracking)',
      pointersOrReferences: 'Implicit pass-by-object-reference (object identity via id(), mutable vs immutable object semantics)',
      details: [
        'Immutable types: int, float, bool, str, tuple, frozenset, bytes',
        'Mutable types: list, dict, set, bytearray, user-defined class instances',
        'Cyclic references (A -> B -> A) are swept periodically by the generational gc module',
        '__slots__ can be declared on classes to eliminate instance __dict__ and save memory',
      ],
    },
    concurrencyModel: {
      primitives: ['threading.Thread', 'multiprocessing.Process', 'asyncio.Task', 'concurrent.futures.ThreadPoolExecutor', 'concurrent.futures.ProcessPoolExecutor', 'asyncio.Queue'],
      threadingModel: 'OS Native Threads bounded by GIL (ideal for I/O-bound tasks)',
      asyncMechanism: 'async / await with asyncio event loop (cooperative task yielding via await)',
      pitfalls: [
        'Running blocking CPU/synchronous I/O operations inside an async def coroutine blocks the entire event loop',
        'Shared mutable state across threads requires threading.Lock / threading.RLock',
        'Forking processes in multiprocessing on macOS/Windows requires if __name__ == "__main__": guard',
      ],
    },
    standardLibrary: {
      keyModules: [
        { name: 'asyncio', purpose: 'Asynchronous I/O event loop, coroutines, and task scheduling' },
        { name: 'typing', purpose: 'Type hints, Generics, Union, Optional, Protocol, and TypedDict' },
        { name: 'dataclasses', purpose: 'Automated boilerplate generator for classes (__init__, __repr__, __eq__)' },
        { name: 'collections', purpose: 'Specialized containers (defaultdict, Counter, deque, namedtuple)' },
        { name: 'functools', purpose: 'Higher-order functions, partial application, lru_cache, and wraps' },
        { name: 'pathlib', purpose: 'Object-oriented filesystem path manipulation' },
        { name: 'json / pickle', purpose: 'Data serialization (safe JSON vs arbitrary-code pickle)' },
        { name: 'unittest / pytest', purpose: 'Automated testing and assertions' },
      ],
    },
    packageManager: {
      name: 'pip / uv / poetry',
      manifestFile: 'pyproject.toml / requirements.txt / Pipfile',
      lockFile: 'poetry.lock / requirements.lock / uv.lock',
      installCommand: 'pip install -r requirements.txt',
      details: 'Packages hosted on PyPI. Isolated execution recommended via virtual environments (venv / virtualenv).',
    },
    buildTools: ['setuptools', 'hatchling', 'flit', 'poetry-core', 'maturin (Rust/Python)'],
    compilerOrInterpreter: 'CPython 3.10+ / PyPy 7+',
    runtime: 'CPython (Python 3.12 / 3.11)',
    commonErrors: [
      {
        errorType: 'IndentationError / TabError',
        category: 'SYNTAX',
        signatureOrPattern: 'IndentationError: unexpected indent | unindent does not match any outer indentation level',
        cause: 'Mismatched indentation spaces or mixed tabs and spaces across block boundaries',
        explanation: 'Python uses indentation to define code blocks. A single mismatched space violates the AST parser grammar.',
        fixStrategy: 'Convert all tabs to 4 spaces and align nested statements uniformly.',
        preventionTip: 'Enable "Insert Spaces" and format-on-save with Black or Ruff in your IDE.',
        learnConceptId: 'python-indentation-syntax',
      },
      {
        errorType: 'TypeError: NoneType object is not subscriptable',
        category: 'TYPE',
        signatureOrPattern: "TypeError: 'NoneType' object is not subscriptable / has no attribute",
        cause: 'Attempting to index or call methods on an object that returned None',
        explanation: 'A function that returns None implicitly or explicitly was accessed as if it returned a list or dict.',
        fixStrategy: 'Add an explicit check `if obj is not None:` or use default fallbacks `obj.get(key, default)`.',
        preventionTip: 'Use Optional[T] / T | None type annotations and run mypy to detect missing None guards.',
      },
      {
        errorType: 'KeyError / IndexError',
        category: 'RUNTIME',
        signatureOrPattern: 'KeyError: <key> | IndexError: list index out of range',
        cause: 'Querying a dictionary key that does not exist or accessing a list index >= len(list)',
        explanation: 'Direct indexing dict[key] or list[idx] raises an exception when the element is missing.',
        fixStrategy: 'Use dict.get(key, default) or verify `0 <= idx < len(lst)`.',
        preventionTip: 'Use collections.defaultdict or .get() with fallback values.',
      },
      {
        errorType: 'Mutable Default Argument Anti-pattern',
        category: 'LOGIC',
        signatureOrPattern: 'def add_item(item, target_list=[]):',
        cause: 'Defining a default parameter as a mutable list/dict evaluated at function definition time',
        explanation: 'The same list instance is shared across all invocations of the function, causing unexpected state mutations.',
        fixStrategy: 'Set default to None and initialize inside the function: `if target_list is None: target_list = []`.',
        preventionTip: 'Always use None as default for mutable arguments.',
        badExample: 'def append_to(element, target=[]):\n    target.append(element)\n    return target',
        fixedExample: 'def append_to(element, target=None):\n    if target is None:\n        target = []\n    target.append(element)\n    return target',
      },
    ],
    debuggingStrategies: [
      'Insert `breakpoint()` or `import pdb; pdb.set_trace()` for interactive stepping',
      'Inspect stack trace frames top-to-bottom, identifying the first file within your project workspace',
      'Use `logging.basicConfig(level=logging.DEBUG)` with structured logs instead of print()',
      'Profile memory with `tracemalloc` and execution hot-spots with `cProfile`',
    ],
    securityPatterns: [
      {
        vulnerability: 'SQL Injection via f-strings / string formatting',
        cweOrClass: 'CWE-89',
        severity: 'CRITICAL',
        description: 'Interpolating untrusted user input directly into SQL query strings enables arbitrary database manipulation.',
        badCode: 'cursor.execute(f"SELECT * FROM users WHERE username = \'{username}\'")',
        secureCode: 'cursor.execute("SELECT * FROM users WHERE username = %s", (username,))',
        remediation: 'Always use parameterized SQL queries with placeholder tuples or an ORM like SQLAlchemy.',
        learnConceptId: 'sql-injection-parameterization',
      },
      {
        vulnerability: 'Unsafe Deserialization via pickle.loads()',
        cweOrClass: 'CWE-502',
        severity: 'CRITICAL',
        description: 'pickle allows arbitrary Python bytecode execution during unpickling, allowing Remote Code Execution (RCE).',
        badCode: 'data = pickle.loads(user_payload)',
        secureCode: 'data = json.loads(user_payload) # Or use pydantic / msgpack',
        remediation: 'Never unpickle untrusted data; use JSON, Protocol Buffers, or safe schemas.',
      },
      {
        vulnerability: 'Command Injection via os.system / subprocess(shell=True)',
        cweOrClass: 'CWE-78',
        severity: 'CRITICAL',
        description: 'Executing shell commands with shell=True and user input allows injection of arbitrary system commands.',
        badCode: 'subprocess.run(f"ping -c 1 {user_ip}", shell=True)',
        secureCode: 'subprocess.run(["ping", "-c", "1", user_ip], shell=False, check=True)',
        remediation: 'Pass arguments as a safe list and set shell=False.',
      },
    ],
    performancePatterns: [
      {
        topic: 'List Comprehensions vs Manual Loop Appends',
        impact: 'Medium',
        bottleneck: 'Repeatedly calling list.append() in a Python for-loop incurs per-iteration attribute lookup overhead.',
        recommendation: 'Use list/dict comprehensions which execute in optimized C bytecode.',
        goodPattern: 'squares = [x * x for x in range(1000)]',
        badPattern: 'squares = []\nfor x in range(1000):\n    squares.append(x * x)',
      },
      {
        topic: 'Blocking I/O in Asynchronous Coroutines',
        impact: 'High',
        bottleneck: 'Calling time.sleep() or requests.get() inside async def freezes the entire event loop.',
        recommendation: 'Use asyncio.sleep() or httpx/aiohttp for async HTTP, or run in loop.run_in_executor().',
        goodPattern: 'await asyncio.sleep(1)\nresponse = await async_client.get(url)',
        badPattern: 'time.sleep(1)\nresponse = requests.get(url)',
      },
    ],
    testingPatterns: {
      popularFrameworks: ['pytest', 'unittest', 'hypothesis (property-based)', 'pytest-asyncio'],
      mockStrategies: ['unittest.mock.patch', 'pytest fixture monkeypatch', 'respx / responses (HTTP mocking)'],
      exampleSnippet: `import pytest

def test_calculate_total():
    assert calculate_total(100, 0.2) == 120.0

@pytest.mark.asyncio
async def test_async_fetch(async_client):
    res = await async_client.get("/api/health")
    assert res.status_code == 200`,
    },
    architecturePatterns: ['FastAPI Clean Architecture / Hexagonal', 'Django MVT (Model-View-Template)', 'Repository Pattern with SQLAlchemy', 'Event-Driven Async Workers with Celery/Redis'],
    antiPatterns: [
      {
        name: 'Bare except clause (`except:`)',
        whyItHarms: 'Swallows KeyboardInterrupt, SystemExit, and MemoryError, making the program impossible to terminate gracefully.',
        remedy: 'Catch specific exception types: `except (ValueError, KeyError) as e:`.',
      },
      {
        name: 'Global state modification without locking',
        whyItHarms: 'Causes race conditions in multi-threaded environments and breaks unit test isolation.',
        remedy: 'Pass state explicitly via dependency injection or encapsulate within class instances.',
      },
    ],
    idioms: [
      {
        name: 'Context Manager (with statement)',
        pattern: 'with open("file.txt") as f:\n    data = f.read()',
        description: 'Guarantees automatic resource cleanup (__enter__ and __exit__) even if an unhandled exception occurs.',
        exampleSnippet: 'with open("log.txt", "w") as f:\n    f.write("entry")',
      },
      {
        name: 'Dictionary Unpacking & Merging',
        pattern: 'merged = {**defaults, **custom_options}',
        description: 'Clean shallow merge of dictionaries introduced in Python 3.5 (or dict | other in 3.9+).',
        exampleSnippet: 'config = {"timeout": 30} | user_config',
      },
    ],
    bestPractices: [
      { title: 'Follow PEP 8 Style Guidelines', category: 'Style', recommendation: 'Use automated linters (Ruff/Flake8) and formatters (Black/Ruff) in CI/CD pipelines.' },
      { title: 'Always Pin Virtual Environments', category: 'Environment', recommendation: 'Never install project dependencies into the global system Python.' },
      { title: 'Leverage Type Hints with Mypy', category: 'Type Safety', recommendation: 'Annotate all public function parameters and return types.' },
    ],
    interoperability: {
      withOtherLanguages: ['C/C++ via ctypes / CFFI / pybind11', 'Rust via PyO3 / maturin', 'Java via Jython or REST/gRPC'],
      ffiOrWasmOrApis: 'High interoperability with C/Rust via native ABI C-extensions; Pyodide for WebAssembly in browsers.',
    },
    versionInformation: {
      currentLTS: 'Python 3.12 (Active) / Python 3.11',
      majorVersions: ['3.10 (Structural Pattern Matching)', '3.11 (Specializing Adaptive Interpreter, 25% speedup)', '3.12 (Per-interpreter GIL, isolated subinterpreters)'],
      notableChanges: 'Modern Python 3.10+ provides match/case statements, union syntax `int | str`, and exception groups.',
    },
    documentationReferences: [
      { title: 'Official Python Documentation', url: 'https://docs.python.org/3/', category: 'Language Reference' },
      { title: 'PEP 8 — Style Guide for Python Code', url: 'https://peps.python.org/pep-0008/', category: 'Standards' },
      { title: 'Real Python Tutorials & Guides', url: 'https://realpython.com/', category: 'Learning' },
    ],
  },

  javascript: {
    language: 'javascript',
    name: 'JavaScript',
    displayName: 'JavaScript (ECMAScript / V8 / Node.js)',
    icon: '🟨',
    color: 'text-yellow-400',
    fileExtensions: ['.js', '.mjs', '.cjs', '.jsx'],
    paradigms: ['Multi-paradigm', 'Event-Driven', 'Functional', 'Prototype-based Object-Oriented', 'Imperative'],
    syntaxRules: {
      statementDelimiters: 'Semicolons (optional via Automatic Semicolon Insertion ASI, recommended explicit in standard codebases)',
      blockScoping: 'Curly braces {} with let and const; var has function scope and is hoisted',
      casingConventions: {
        variables: 'camelCase',
        functions: 'camelCase',
        classes: 'PascalCase',
        constants: 'SCREAMING_SNAKE_CASE',
      },
      comments: {
        singleLine: '// Comment text',
        multiLine: '/* Multi-line comment */',
        docComment: '/** JSDoc annotation block */',
      },
      keyRules: [
        'Variable declaration: const for immutable bindings, let for mutable, avoid legacy var',
        'Object and array destructuring: const { a, b } = obj; const [first, ...rest] = arr;',
        'Arrow functions (() => {}) do not bind their own `this`, `arguments`, or `super`',
        'Truthy and Falsy rules: false, 0, "", null, undefined, NaN are falsy; all objects/arrays are truthy',
        'Nullish coalescing (??) checks null/undefined; optional chaining (?.) guards nested property traversal',
      ],
    },
    typeSystem: {
      category: 'Dynamic',
      safety: 'Weak',
      inference: true,
      typeCoercion: 'Implicit',
      keyDetails: [
        'Implicit type coercion with loose equality == (e.g., 0 == "" is true; always use strict equality ===)',
        'Primitive types: string, number, bigint, boolean, symbol, undefined, null',
        'Composite types: Object (including Array, Function, Date, RegExp, Map, Set)',
        'typeof null returns "object" (historical ECMAScript bug preserved for compatibility)',
      ],
    },
    executionModel: {
      runtime: 'V8 (Chrome/Node), JavaScriptCore (Safari/Bun), SpiderMonkey (Firefox)',
      compilationTarget: 'Bytecode',
      modelType: 'Single-Threaded Event Loop with JIT (Just-In-Time)',
      details: [
        'Single-threaded execution with Call Stack, Heap memory, Microtask Queue (Promises, queueMicrotask), and Macrotask Queue (setTimeout, setImmediate, I/O)',
        'Microtasks are processed completely before the next macrotask is dequeued from the event loop',
        'Long-running synchronous loops block rendering and I/O handlers',
      ],
    },
    memoryModel: {
      management: 'Garbage Collected',
      stackVsHeap: 'Primitive values reside on stack or inline in frames; objects and closures allocated on V8 Heap',
      garbageCollection: 'Generational Mark-Sweep-Compact (Scavenger for young generation, Full GC for old generation)',
      pointersOrReferences: 'Primitives passed by value; objects passed by reference copy',
      details: [
        'Closures retain references to outer scope variables in memory until the closure itself is collected',
        'Memory leaks commonly caused by uncleaned event listeners, detached DOM trees, or global caches',
        'WeakMap and WeakSet hold weak object references that do not prevent garbage collection',
      ],
    },
    concurrencyModel: {
      primitives: ['Promise', 'async / await', 'AbortController', 'Worker Threads (Node)', 'Web Workers (Browser)'],
      threadingModel: 'Single-Threaded Asynchronous Non-Blocking Event Loop',
      asyncMechanism: 'Promises and async/await backed by Microtask event loop queue',
      pitfalls: [
        'Floating unhandled promise rejections crashing Node.js runtime',
        'Async function inside Array.prototype.forEach does not pause loop execution (use for...of or Promise.all)',
        'Race conditions when mutating shared state across multiple concurrent async turns',
      ],
    },
    standardLibrary: {
      keyModules: [
        { name: 'JSON', purpose: 'Native serialization and deserialization (parse/stringify)' },
        { name: 'Promise', purpose: 'all, allSettled, race, any, resolve, reject concurrency utilities' },
        { name: 'Fetch API', purpose: 'Standard HTTP request client for browser and Node.js 18+' },
        { name: 'Web Streams', purpose: 'ReadableStream, WritableStream, TransformStream for chunked data' },
        { name: 'Node.js fs/promises', purpose: 'Asynchronous filesystem access in backend environments' },
      ],
    },
    packageManager: {
      name: 'npm / pnpm / yarn / bun',
      manifestFile: 'package.json',
      lockFile: 'package-lock.json / pnpm-lock.yaml / yarn.lock',
      installCommand: 'npm install',
      details: 'Universal JavaScript ecosystem packages distributed via npm registry.',
    },
    buildTools: ['Vite', 'esbuild', 'Webpack', 'Rollup', 'SWC', 'Turbopack'],
    compilerOrInterpreter: 'V8 Engine / Node.js Runtime / Browser Engine',
    runtime: 'Node.js 20+ / Browser / Bun',
    commonErrors: [
      {
        errorType: 'TypeError: Cannot read properties of undefined / null',
        category: 'RUNTIME',
        signatureOrPattern: "TypeError: Cannot read properties of undefined (reading 'xyz')",
        cause: 'Accessing property or method on a variable that evaluates to undefined or null',
        explanation: 'The base object is not initialized before property traversal.',
        fixStrategy: 'Use optional chaining `user?.profile?.name` or provide default fallback objects.',
        preventionTip: 'Enable TypeScript strict null checks and validate API responses with Zod.',
      },
      {
        errorType: 'UnhandledPromiseRejection',
        category: 'RUNTIME',
        signatureOrPattern: 'UnhandledPromiseRejection: This error originated either by throwing inside of an async function...',
        cause: 'A rejected Promise had no .catch() handler attached or was not enclosed in try/catch',
        explanation: 'Modern runtimes terminate or warn when promises reject without error handlers.',
        fixStrategy: 'Wrap await calls in try/catch or attach .catch(err => ...).',
        preventionTip: 'Always handle errors at async function boundaries.',
      },
    ],
    debuggingStrategies: [
      'Use Chrome DevTools / Node.js inspector with `--inspect` flag',
      'Inspect heap memory snapshots to detect uncollected objects and detached DOM nodes',
      'Use `console.trace()` to view the call stack without halting execution',
    ],
    securityPatterns: [
      {
        vulnerability: 'Cross-Site Scripting (XSS) via innerHTML',
        cweOrClass: 'CWE-79',
        severity: 'CRITICAL',
        description: 'Injecting raw user-supplied strings directly into DOM innerHTML allows arbitrary script execution.',
        badCode: 'element.innerHTML = `<div>${userInput}</div>`;',
        secureCode: 'element.textContent = userInput; // Or sanitize with DOMPurify',
        remediation: 'Use textContent, React JSX bindings, or DOMPurify.sanitize().',
      },
      {
        vulnerability: 'Prototype Pollution',
        cweOrClass: 'CWE-1321',
        severity: 'HIGH',
        description: 'Recursively merging untrusted JSON properties like `__proto__` or `constructor.prototype` corrupts Object prototype.',
        badCode: 'function merge(target, source) { for (let k in source) target[k] = source[k]; }',
        secureCode: 'const safeObj = Object.create(null); // Or validate keys !== "__proto__"',
        remediation: 'Freeze prototypes, use Map, or create objects via Object.create(null).',
      },
    ],
    performancePatterns: [
      {
        topic: 'Event Loop Blocking via Heavy CPU Tasks',
        impact: 'High',
        bottleneck: 'Running heavy synchronous sorting or cryptographic hashing blocks all network I/O and UI rendering.',
        recommendation: 'Offload heavy computations to Worker Threads (Node) or Web Workers (Browser).',
        goodPattern: 'const worker = new Worker("./worker.js"); worker.postMessage(data);',
        badPattern: 'for (let i = 0; i < 1e9; i++) { heavyHash(i); }',
      },
    ],
    testingPatterns: {
      popularFrameworks: ['Vitest', 'Jest', 'Playwright', 'Mocha'],
      mockStrategies: ['vi.fn() / jest.fn()', 'vi.spyOn()', 'msw (Mock Service Worker)'],
      exampleSnippet: `import { describe, it, expect } from 'vitest';

describe('Calculator', () => {
  it('adds numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
  });
});`,
    },
    architecturePatterns: ['Component-Driven UI (React/Vue)', 'REST / GraphQL Microservices with Express / Fastify', 'Clean Layered Architecture (Controller -> Service -> Repository)'],
    antiPatterns: [
      {
        name: 'Callback Hell (Pyramid of Doom)',
        whyItHarms: 'Deeply nested callbacks make error handling and stack tracing incomprehensible.',
        remedy: 'Refactor into async/await and Promise chains.',
      },
    ],
    idioms: [
      {
        name: 'Short-Circuit Evaluation & Default Fallbacks',
        pattern: 'const port = process.env.PORT ?? 3000;',
        description: 'Uses nullish coalescing to fall back only when value is null or undefined.',
        exampleSnippet: 'const timeout = userTimeout ?? 5000;',
      },
    ],
    bestPractices: [
      { title: 'Always use === instead of ==', category: 'Equality', recommendation: 'Strict equality prevents subtle implicit type conversion defects.' },
      { title: 'Prefer Immutable Patterns', category: 'State', recommendation: 'Use array methods like .map(), .filter(), .reduce() instead of in-place mutation.' },
    ],
    interoperability: {
      withOtherLanguages: ['WebAssembly (WASM) for C++/Rust in browser/Node', 'C++ Addons via N-API in Node.js'],
      ffiOrWasmOrApis: 'Runs compiled WebAssembly modules seamlessly via WebAssembly.instantiate().',
    },
    versionInformation: {
      currentLTS: 'ES2023 / Node.js 20 LTS',
      majorVersions: ['ES6 (2015 - Modules, Classes, Promises)', 'ES2020 (Optional Chaining, Nullish Coalescing, BigInt)', 'ES2022 (Top-Level Await, Private Class Fields)'],
      notableChanges: 'Modern JavaScript features native ES Modules (import/export), structuredClone(), and top-level await.',
    },
    documentationReferences: [
      { title: 'MDN Web Docs — JavaScript', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', category: 'Reference' },
      { title: 'Node.js Official Documentation', url: 'https://nodejs.org/docs/latest/api/', category: 'Runtime' },
    ],
  },

  typescript: {
    language: 'typescript',
    name: 'TypeScript',
    displayName: 'TypeScript (Static Type System for JS)',
    icon: '🔷',
    color: 'text-sky-400',
    fileExtensions: ['.ts', '.tsx', '.mts', '.cts', '.d.ts'],
    paradigms: ['Static Typed', 'Multi-paradigm', 'Object-Oriented', 'Functional', 'Generic Programming'],
    syntaxRules: {
      statementDelimiters: 'Semicolons (same as JavaScript)',
      blockScoping: 'Curly braces {} with static lexical scope and strict compile-time verification',
      casingConventions: {
        variables: 'camelCase',
        functions: 'camelCase',
        classes: 'PascalCase',
        constants: 'SCREAMING_SNAKE_CASE',
      },
      comments: {
        singleLine: '// Single line comment',
        multiLine: '/* Multi-line comment */',
        docComment: '/** TSDoc / JSDoc with @param and @returns type metadata */',
      },
      keyRules: [
        'Types exist only at compile time and are erased completely during JavaScript emission',
        'Distinguish type aliases (type T = ...) from interfaces (interface T { ... })',
        'Union types (A | B) represent values that can be either; intersection types (A & B) combine shapes',
        'Generics (<T>) enable reusable, type-safe functions and data structures',
        'Type narrowing using typeof, instanceof, in operator, and custom user-defined type guards (is T)',
      ],
    },
    typeSystem: {
      category: 'Static',
      safety: 'Strong',
      inference: true,
      typeCoercion: 'Explicit Only',
      keyDetails: [
        'Structural typing (duck typing for types): two types with identical member shapes are compatible',
        'Gradual typing with `unknown` (type-safe top type) vs `any` (disables type checker; avoid in strict code)',
        'Utility types: Partial<T>, Required<T>, Readonly<T>, Record<K, T>, Pick<T, K>, Omit<T, K>, ReturnType<T>',
        'Conditional types: `T extends U ? X : Y` and mapped types for schema transformations',
      ],
    },
    executionModel: {
      runtime: 'Erased at build time; runs as plain JavaScript on Node.js, V8, or Bun (or directly via tsx/ts-node)',
      compilationTarget: 'Transpiled',
      modelType: 'Compile-time Static Analysis + JS Execution',
      details: [
        'TypeScript compiler (tsc) or bundlers (Vite/esbuild) strip type annotations',
        'No runtime performance overhead from type annotations',
        'tsconfig.json governs compiler options (strict: true, target, moduleResolution, noImplicitAny)',
      ],
    },
    memoryModel: {
      management: 'Garbage Collected',
      stackVsHeap: 'Identical to JavaScript runtime; types have zero memory footprint',
      garbageCollection: 'Handled entirely by underlying JavaScript engine (V8/JSC/SpiderMonkey)',
      pointersOrReferences: 'Identical to JavaScript (primitives by value, objects by reference)',
      details: [
        'Readonly<T> and as const protect against compile-time mutations but do not freeze runtime objects unless Object.freeze() is called',
      ],
    },
    concurrencyModel: {
      primitives: ['Promise<T>', 'async / await with ReturnType inference', 'AbortSignal'],
      threadingModel: 'Single-Threaded Event Loop (typed async workflows)',
      asyncMechanism: 'Typed Promises and async generators',
      pitfalls: [
        'Assuming compile-time types guarantee valid runtime data from external API payloads without validation (use Zod/Valibot)',
      ],
    },
    standardLibrary: {
      keyModules: [
        { name: 'TypeScript Utility Types', purpose: 'Standard type transformers (Awaited<T>, Extract, Exclude, NonNullable)' },
        { name: 'DOM Types', purpose: 'Browser DOM and Web API type definitions (HTMLElement, Event, Response)' },
        { name: '@types/node', purpose: 'Node.js standard API types (Buffer, EventEmitter, Process)' },
      ],
    },
    packageManager: {
      name: 'npm / pnpm / yarn',
      manifestFile: 'package.json / tsconfig.json',
      lockFile: 'package-lock.json / pnpm-lock.yaml',
      installCommand: 'npm install -D typescript @types/node',
      details: 'Type definition packages distributed via @types/* under DefinitelyTyped.',
    },
    buildTools: ['tsc (TypeScript Compiler)', 'Vite', 'esbuild', 'SWC', 'tsup', 'ts-node / tsx'],
    compilerOrInterpreter: 'tsc (TypeScript Type Checker & Transpiler)',
    runtime: 'Node.js / Browser / Deno / Bun',
    commonErrors: [
      {
        errorType: 'TS2322: Type is not assignable to type',
        category: 'COMPILE',
        signatureOrPattern: "Type 'A' is not assignable to type 'B'",
        cause: 'Mismatched types or missing required properties on target interface',
        explanation: 'The provided object structure violates the static shape contract expected by the consumer.',
        fixStrategy: 'Align property types or use optional properties / type narrowing.',
        preventionTip: 'Inspect exact difference in interface definitions.',
      },
      {
        errorType: 'TS2532: Object is possibly undefined',
        category: 'TYPE',
        signatureOrPattern: "Object is possibly 'undefined' / 'null'",
        cause: 'Accessing properties without guarding against potential nullish return values',
        explanation: 'Strict null checking (strictNullChecks) ensures you verify existence before access.',
        fixStrategy: 'Use optional chaining `item?.prop` or an `if (item)` guard clause.',
        preventionTip: 'Never use non-null assertion operator (!) unless value is guaranteed by prior invariant.',
      },
    ],
    debuggingStrategies: [
      'Hover over symbols in IDE to inspect inferred type signature',
      'Use `type Test = Expect<Equal<Actual, Expected>>` type tests with tsd / vitest-type-check',
      'Generate source maps (`"sourceMap": true` in tsconfig) for stepping through original .ts files in debugger',
    ],
    securityPatterns: [
      {
        vulnerability: 'Unvalidated External Data Casting (as Type Assertion)',
        cweOrClass: 'CWE-20',
        severity: 'HIGH',
        description: 'Blindly asserting `const user = (await res.json()) as User` bypasses runtime validation when the API response schema drifts.',
        badCode: 'const data = (await fetch(url).then(r => r.json())) as UserData;',
        secureCode: 'const userSchema = z.object({ id: z.string(), email: z.string().email() });\nconst data = userSchema.parse(await res.json());',
        remediation: 'Use runtime schema validation libraries like Zod, Valibot, or ArkType at API boundaries.',
      },
    ],
    performancePatterns: [
      {
        topic: 'Excessive Deeply Nested Conditional Types',
        impact: 'Moderate',
        bottleneck: 'Extremely deep recursive type transformations slow down editor autocomplete and tsc build times.',
        recommendation: 'Break complex recursive types into simpler interfaces and limit recursion depth.',
        goodPattern: 'Use simple interface extensions and utility type compositions.',
        badPattern: '50-level deep recursive mapped conditional types parsing string templates.',
      },
    ],
    testingPatterns: {
      popularFrameworks: ['Vitest', 'Jest with ts-jest', 'Playwright'],
      mockStrategies: ['vi.mocked(fn)', 'ts-mockito'],
      exampleSnippet: `import { describe, it, expect, vi } from 'vitest';

it('validates user status', () => {
  const mockUser: User = { id: 'u1', role: 'ADMIN', active: true };
  expect(hasAdminAccess(mockUser)).toBe(true);
});`,
    },
    architecturePatterns: ['Type-Safe Full-Stack Monorepo (Shared Zod / tRPC schemas)', 'Domain-Driven Design (DDD) with Branded Nominal Types', 'Hexagonal Architecture with Type Interfaces'],
    antiPatterns: [
      {
        name: 'Overusing `any` everywhere',
        whyItHarms: 'Disables type safety across downstream consumers and hides fatal runtime defects.',
        remedy: 'Use `unknown` with runtime type narrowing or generic type parameters.',
      },
    ],
    idioms: [
      {
        name: 'Discriminated Unions (Tagged Unions)',
        pattern: 'type ApiResponse = { status: "success"; data: Item } | { status: "error"; error: string };',
        description: 'Allows compiler to narrow types automatically inside switch(response.status).',
        exampleSnippet: 'switch (res.status) {\n  case "success": return res.data;\n  case "error": throw new Error(res.error);\n}',
      },
    ],
    bestPractices: [
      { title: 'Enable `"strict": true` in tsconfig', category: 'Compiler', recommendation: 'Enforces strictNullChecks, noImplicitAny, and strictFunctionTypes.' },
      { title: 'Prefer `unknown` over `any` for untrusted input', category: 'Type Safety', recommendation: 'Forces explicit type narrowing before property access.' },
    ],
    interoperability: {
      withOtherLanguages: ['Seamless integration with JavaScript via declaration files (.d.ts)'],
      ffiOrWasmOrApis: 'Full support for typing WebAssembly exports via custom d.ts declarations.',
    },
    versionInformation: {
      currentLTS: 'TypeScript 5.4 / 5.3',
      majorVersions: ['TS 4.0 (Variadic Tuple Types)', 'TS 5.0 (Decorators, Const Type Parameters)', 'TS 5.4 (NoInfer Utility Type, Object.groupBy)'],
      notableChanges: 'Modern TypeScript includes const type parameters, satisfies operator, and isolatedDeclarations.',
    },
    documentationReferences: [
      { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', category: 'Official Documentation' },
    ],
  },

  rust: {
    language: 'rust',
    name: 'Rust',
    displayName: 'Rust (rustc / LLVM / Cargo)',
    icon: '🦀',
    color: 'text-orange-400',
    fileExtensions: ['.rs'],
    paradigms: ['Multi-paradigm', 'Systems Programming', 'Functional', 'Concurrent', 'Imperative'],
    syntaxRules: {
      statementDelimiters: 'Semicolons (lines ending without semicolons become the return expression of the block)',
      blockScoping: 'Curly braces {} with strict lexical scope; variables dropped at end of scope',
      casingConventions: {
        variables: 'snake_case',
        functions: 'snake_case',
        classes: 'PascalCase (Structs/Enums/Traits)',
        constants: 'SCREAMING_SNAKE_CASE',
      },
      comments: {
        singleLine: '// Single line comment',
        multiLine: '/* Multi-line comment */',
        docComment: '/// Outer doc comment | //! Inner crate/module doc comment',
      },
      keyRules: [
        'Variables are immutable by default (`let x = 5`); use `let mut x = 5` for mutability',
        'Ownership Rules: Each value has an owner; only one owner at a time; value is dropped when owner goes out of scope',
        'Borrowing Rules: You may have either one mutable reference (&mut T) OR any number of immutable references (&T), but never both simultaneously',
        'Pattern matching with `match` is exhaustive; compiler forces all enum variants to be handled',
        'No null pointers: Missing values represented by `Option<T>` (Some(T) | None); errors by `Result<T, E>` (Ok(T) | Err(E))',
      ],
    },
    typeSystem: {
      category: 'Static',
      safety: 'Memory Safe',
      inference: true,
      typeCoercion: 'Explicit Only',
      keyDetails: [
        'Static strong typing with Hindley-Milner type inference',
        'Traits define shared behavior (similar to interfaces, but decoupled from structs)',
        'Generics with trait bounds (`fn process<T: Display + Clone>(item: T)`) and zero-cost monomorphization',
        'Lifetimes (\'a) track reference validity at compile time without runtime overhead',
      ],
    },
    executionModel: {
      runtime: 'Zero-overhead native binary compiled via LLVM; no runtime VM, no garbage collector',
      compilationTarget: 'Native Machine Code',
      modelType: 'Compiled AOT to Native Binary / WASM',
      details: [
        'rustc compiles source code into optimized native machine code or WebAssembly target',
        'Zero-cost abstractions: Iterators, closures, and pattern matching compile down to efficient assembly equivalent to hand-written C',
      ],
    },
    memoryModel: {
      management: 'Ownership & Borrowing (RAII)',
      stackVsHeap: 'Values allocated on stack by default; heap allocation via Box<T>, Vec<T>, String',
      garbageCollection: 'None (Compile-time deterministic deallocation via Drop trait)',
      pointersOrReferences: 'Safe references (&T, &mut T); smart pointers (Box, Rc, Arc, RefCell); raw pointers (*const T, *mut T) only in unsafe blocks',
      ownershipModel: 'Affine type system with move semantics and affine lifetimes',
      details: [
        'Drop trait executes destructors deterministically at scope exit (RAII)',
        'Interior mutability via RefCell<T> (runtime borrow checks) or Mutex<T> / RwLock<T> (thread-safe)',
        'Arc<T> provides thread-safe atomic reference counted shared ownership',
      ],
    },
    concurrencyModel: {
      primitives: ['std::thread', 'std::sync::mpsc (Channels)', 'std::sync::Arc', 'std::sync::Mutex', 'tokio::spawn (Async)'],
      threadingModel: 'OS Native 1:1 Threads + Async Future Poll Model (Tokio / async-std)',
      asyncMechanism: 'Zero-cost Futures executed by external async runtime like Tokio',
      pitfalls: [
        'Holding a std::sync::MutexGuard across an `.await` boundary in Tokio (blocks OS worker thread; use tokio::sync::Mutex)',
        'Deadlocks from acquiring multiple mutexes in inconsistent order',
      ],
    },
    standardLibrary: {
      keyModules: [
        { name: 'std::collections', purpose: 'HashMap, BTreeMap, VecDeque, BinaryHeap, HashSet' },
        { name: 'std::sync', purpose: 'Arc, Mutex, RwLock, Barrier, Once, atomic primitives' },
        { name: 'std::fs / std::io', purpose: 'Filesystem reading/writing and streaming buffers' },
        { name: 'std::path', purpose: 'Cross-platform path manipulation (Path, PathBuf)' },
      ],
    },
    packageManager: {
      name: 'Cargo',
      manifestFile: 'Cargo.toml',
      lockFile: 'Cargo.lock',
      installCommand: 'cargo build / cargo add <crate>',
      details: 'All Rust packages (crates) distributed via crates.io registry with built-in test and benchmark runner.',
    },
    buildTools: ['cargo', 'rustc', 'clippy (Linter)', 'rustfmt (Formatter)'],
    compilerOrInterpreter: 'rustc (LLVM Backend)',
    runtime: 'Native Binary / WebAssembly',
    commonErrors: [
      {
        errorType: 'E0382: Use of moved value',
        category: 'COMPILE',
        signatureOrPattern: 'error[E0382]: use of moved value: `...`',
        cause: 'Attempting to access a variable after its ownership has been moved into another function or scope',
        explanation: 'In Rust, types that do not implement Copy are moved by default. Once moved, the original binding is invalid.',
        fixStrategy: 'Pass a reference `&value` instead of value, or call `.clone()` if ownership transfer is required.',
        preventionTip: 'Borrow by default (&T); only transfer ownership (T) when the receiver must store or transform the value.',
        learnConceptId: 'rust-ownership-borrowing',
      },
      {
        errorType: 'E0502: Cannot borrow as mutable because it is also borrowed as immutable',
        category: 'COMPILE',
        signatureOrPattern: 'error[E0502]: cannot borrow `...` as mutable because it is also borrowed as immutable',
        cause: 'Holding an active reference &T while attempting to mutate through &mut T in the same scope',
        explanation: 'Rust prevents data races and iterator invalidation by strictly forbidding aliasing with mutation.',
        fixStrategy: 'Ensure immutable references go out of scope before initiating mutable operations, or clone needed data.',
        preventionTip: 'Keep borrow scopes as small as possible.',
      },
      {
        errorType: 'E0106: Missing lifetime specifier',
        category: 'COMPILE',
        signatureOrPattern: 'error[E0106]: missing lifetime specifier',
        cause: 'Returning a reference from a struct or function without specifying which input lifetime it borrows from',
        explanation: 'The compiler needs explicit lifetime annotations when lifetime elision rules cannot disambiguate output references.',
        fixStrategy: 'Add explicit lifetime parameters: `fn get_name<\'a>(user: &\'a User) -> &\'a str`.',
        preventionTip: 'Return owned types (String, Vec) if lifetimes become overly complex across struct boundaries.',
      },
    ],
    debuggingStrategies: [
      'Use `cargo clippy` for automated architectural and performance linter suggestions',
      'Use `gdb` or `lldb` with Rust pretty-printers for inspecting variables at breakpoints',
      'Set `RUST_BACKTRACE=1` environment variable when running binaries to view detailed panic stack traces',
    ],
    securityPatterns: [
      {
        vulnerability: 'Unsound Unsafe Block Usage',
        cweOrClass: 'CWE-119',
        severity: 'CRITICAL',
        description: 'Violating memory safety invariants inside `unsafe { ... }` blocks (e.g., creating dangling pointers or breaking aliasing rules).',
        badCode: 'unsafe { let ptr = Box::into_raw(b); let ref1 = &*ptr; let ref2 = &mut *ptr; }',
        secureCode: 'Use standard safe abstractions (Arc, Mutex, Box) without raw unsafe pointer manipulation.',
        remediation: 'Audit unsafe blocks with Miri (`cargo miri test`) to detect undefined behavior at test time.',
      },
    ],
    performancePatterns: [
      {
        topic: 'Unnecessary Cloning of Large Structures',
        impact: 'High',
        bottleneck: 'Calling `.clone()` on large Vec or String structures in tight loops incurs repeated heap allocations.',
        recommendation: 'Pass references (&str, &[T]) or pass ownership once.',
        goodPattern: 'fn process(items: &[String]) { ... }',
        badPattern: 'fn process(items: Vec<String>) { let copy = items.clone(); }',
      },
    ],
    testingPatterns: {
      popularFrameworks: ['Built-in cargo test', 'proptest (Property-based)', 'criterion (Benchmarking)'],
      mockStrategies: ['Trait-based mock implementations', 'mockall crate'],
      exampleSnippet: `#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_addition() {
        assert_eq!(add(2, 3), 5);
    }
}`,
    },
    architecturePatterns: ['Actor Model with Actix / Tokio channels', 'Hexagonal / Clean Architecture with Traits', 'Zero-Allocation Systems with Stack Buffers'],
    antiPatterns: [
      {
        name: 'Calling .unwrap() in Production Code',
        whyItHarms: 'Panics and immediately terminates the process if a Result::Err or Option::None is encountered.',
        remedy: 'Use the `?` operator, `match`, `if let`, or `unwrap_or_default()`.',
      },
    ],
    idioms: [
      {
        name: 'The ? Error Propagation Operator',
        pattern: 'let content = std::fs::read_to_string(path)?;',
        description: 'Returns early with Err(From::from(err)) if the result is Err, unwrapping Ok(val) otherwise.',
        exampleSnippet: 'fn read_config() -> Result<Config, io::Error> {\n    let s = fs::read_to_string("conf.toml")?;\n    Ok(parse(&s)?)\n}',
      },
    ],
    bestPractices: [
      { title: 'Run `cargo clippy -- -D warnings` in CI', category: 'Quality', recommendation: 'Enforces idiomatic code and catches performance bottlenecks.' },
      { title: 'Prefer `&str` over `&String` in parameters', category: 'Idiom', recommendation: 'Allows passing both string slices and owned Strings without re-allocation.' },
    ],
    interoperability: {
      withOtherLanguages: ['C/C++ via extern "C" ABI', 'Python via PyO3', 'Node.js via NAPI-RS', 'WebAssembly via wasm-bindgen'],
      ffiOrWasmOrApis: 'First-class WebAssembly target (`wasm32-unknown-unknown`) and native C ABI export capability.',
    },
    versionInformation: {
      currentLTS: 'Rust 1.76 / 1.77',
      majorVersions: ['Rust 2018 Edition', 'Rust 2021 Edition', 'Rust 2024 Edition (Upcoming)'],
      notableChanges: 'Modern Rust features Generic Associated Types (GATs), let-else statements, and Async Fn in Traits.',
    },
    documentationReferences: [
      { title: 'The Rust Programming Language (The Book)', url: 'https://doc.rust-lang.org/book/', category: 'Official Documentation' },
      { title: 'Rust by Example', url: 'https://doc.rust-lang.org/rust-by-example/', category: 'Tutorials' },
    ],
  },
  
  // Remaining languages dynamically hydrated from rich learning models with unified profile fallback
  java: createFallbackProfile('java', 'Java', '☕', 'text-red-400', ['.java', '.jar', '.class'], 'JVM Garbage Collected', 'Static Strong OOP with Generics and Streams'),
  cpp: createFallbackProfile('cpp', 'C / C++', '⚙️', 'text-blue-400', ['.cpp', '.c', '.h', '.hpp', '.cc'], 'Manual (malloc/free & RAII)', 'High-Performance Systems Programming with Direct Memory Access'),
  csharp: createFallbackProfile('csharp', 'C# / .NET', '🟣', 'text-purple-400', ['.cs', '.csx'], 'Garbage Collected (CLR)', 'Modern Type-Safe Object-Oriented Language with LINQ and Async/Await'),
  go: createFallbackProfile('go', 'Go', '🐹', 'text-cyan-400', ['.go'], 'Garbage Collected (Concurrent Mark-Sweep)', 'Simple, Fast Concurrent Systems Language with Goroutines and Channels'),
  kotlin: createFallbackProfile('kotlin', 'Kotlin', '🎯', 'text-violet-400', ['.kt', '.kts'], 'Garbage Collected (JVM / Native)', 'Concise, Null-Safe Multiplatform Language with Coroutines'),
  swift: createFallbackProfile('swift', 'Swift', '🐦', 'text-amber-500', ['.swift'], 'Automatic Reference Counting (ARC)', 'Safe, Fast Systems & Application Language with Actors and SPM'),
  php: createFallbackProfile('php', 'PHP', '🐘', 'text-indigo-400', ['.php', '.phtml'], 'Garbage Collected (Zend Engine)', 'Server-Side Web Scripting with Composer, PDO, and Strict Types'),
  ruby: createFallbackProfile('ruby', 'Ruby', '💎', 'text-rose-400', ['.rb', '.rake', 'Gemfile'], 'Garbage Collected (CRuby / YJIT)', 'Dynamic, Expressive Object-Oriented Language with Rails and Bundler'),
  sql: createFallbackProfile('sql', 'SQL', '🗄️', 'text-emerald-400', ['.sql', '.ddl', '.dml'], 'Database Engine Managed', 'Declarative Relational Database Query and Manipulation Language'),
  html: createFallbackProfile('html', 'HTML5', '🌐', 'text-orange-500', ['.html', '.htm'], 'Browser DOM Managed', 'Semantic Web Markup, Document Structure, Forms, and Accessibility'),
  css: createFallbackProfile('css', 'CSS3', '🎨', 'text-blue-500', ['.css', '.scss', '.sass'], 'Browser Layout Engine', 'Styling, Cascade, Specificity, Flexbox, Grid, and Responsive Layouts'),
  generic: createFallbackProfile('generic', 'Generic Code', '📄', 'text-slate-400', ['.txt', '.md'], 'System Managed', 'Generic Text and Universal Code'),
};

function createFallbackProfile(
  langId: SupportedLanguage,
  name: string,
  icon: string,
  color: string,
  extensions: string[],
  memoryMgmt: string,
  tagline: string
): LanguageKnowledgeProfile {
  const content = learningContentMap[langId];

  return {
    language: langId,
    name,
    displayName: `${name} ${content?.releaseYear ? `(${content.releaseYear})` : ''}`,
    icon: content?.icon || icon,
    color: content?.color || color,
    fileExtensions: content?.extensions || extensions,
    paradigms: content?.paradigms || ['Multi-paradigm'],
    syntaxRules: {
      statementDelimiters: langId === 'sql' ? 'Semicolon (;)' : langId === 'html' || langId === 'css' ? 'Tags and Braces' : 'Semicolons or Newlines',
      blockScoping: 'Block delimiters and lexical scoping rules',
      casingConventions: {
        variables: 'camelCase or snake_case',
        functions: 'camelCase or snake_case',
        classes: 'PascalCase',
        constants: 'SCREAMING_SNAKE_CASE',
      },
      comments: {
        singleLine: '// or # or --',
        multiLine: '/* ... */',
      },
      keyRules: content?.syntaxFundamentals?.map((s) => s.importantNote) || [
        'Adhere to language idioms and clean code separation',
      ],
    },
    typeSystem: {
      category: (content?.typingSystem?.includes('Static') ? 'Static' : 'Dynamic') as any,
      safety: 'Strong',
      inference: true,
      typeCoercion: 'Explicit Only',
      keyDetails: [content?.typingSystem || 'Standard typing mechanics'],
    },
    executionModel: {
      runtime: content?.executionModel || 'Standard language runtime engine',
      compilationTarget: 'Bytecode',
      modelType: content?.executionModel || 'Standard execution pipeline',
      details: [content?.executionModel || 'Execution handled by target VM/compiler'],
    },
    memoryModel: {
      management: memoryMgmt as any,
      stackVsHeap: 'Stack for local scopes, Heap for dynamic allocations',
      pointersOrReferences: 'References and object handles',
      details: content?.memoryAndExecution?.keyDetails || ['Automatic lifecycle management'],
    },
    concurrencyModel: {
      primitives: content?.concurrency?.keyPrimitives || ['Threads', 'Async/Await', 'Coroutines'],
      threadingModel: content?.concurrency?.model || 'OS Threads / Event Loop',
      asyncMechanism: 'Language native asynchronous primitives',
      pitfalls: ['Race conditions', 'Deadlocks', 'Resource starvation'],
    },
    standardLibrary: {
      keyModules: content?.modulesAndPackages?.standardModules?.map((m) => ({
        name: m,
        purpose: `Standard ${name} module for common utilities`,
      })) || [],
    },
    packageManager: {
      name: content?.modulesAndPackages?.packageManager || 'Standard Package Manager',
      manifestFile: 'Project manifest',
      lockFile: 'Lockfile',
      installCommand: content?.modulesAndPackages?.packageManagerCommand || 'Install command',
      details: `Official packaging system for ${name}`,
    },
    buildTools: ['Standard Build System', 'CLI Compilers'],
    compilerOrInterpreter: `${name} Compiler / Runtime`,
    runtime: `${name} Runtime Environment`,
    commonErrors: content?.errorHandling?.map((e) => ({
      errorType: e.type,
      category: (e.type.toLowerCase().includes('syntax') ? 'SYNTAX' : e.type.toLowerCase().includes('type') ? 'TYPE' : 'RUNTIME') as ErrorClassificationType,
      signatureOrPattern: e.type,
      cause: e.description,
      explanation: e.mechanism,
      fixStrategy: e.debuggingTip,
      preventionTip: 'Write defensive code and validate inputs.',
      badExample: e.code,
    })) || [],
    debuggingStrategies: [
      'Inspect runtime stack trace and locate exact file and line',
      'Use language debugger / breakpoints to step through state changes',
      'Log diagnostic values before and after critical operations',
    ],
    securityPatterns: content?.securityConsiderations?.map((s) => ({
      vulnerability: s.vulnerability,
      cweOrClass: 'Security Risk',
      severity: s.riskLevel.toUpperCase() as any,
      description: s.description,
      badCode: s.vulnerableCode,
      secureCode: s.secureCode,
      remediation: s.remediation,
    })) || [],
    performancePatterns: content?.performanceConsiderations?.map((p) => ({
      topic: p.topic,
      impact: p.impact as any,
      bottleneck: p.description,
      recommendation: p.recommendation,
      goodPattern: p.codeExample || 'Optimized pattern',
      badPattern: 'Suboptimal pattern',
    })) || [],
    testingPatterns: {
      popularFrameworks: ['Standard Test Runner'],
      mockStrategies: ['Mock interfaces and stubs'],
      exampleSnippet: `// ${name} test example\nassert(testOperation() == true);`,
    },
    architecturePatterns: ['Clean Architecture', 'Modular Separation of Concerns', 'Layered Architecture'],
    antiPatterns: content?.commonMistakes?.map((m) => ({
      name: m.mistake,
      whyItHarms: m.whyItMatters,
      remedy: m.betterApproach,
      badCode: m.badSnippet,
      goodCode: m.fixedSnippet,
    })) || [],
    idioms: [
      {
        name: 'Standard Idiom',
        pattern: 'Idiomatic pattern',
        description: `Follows ${name} conventions`,
        exampleSnippet: `// Idiomatic ${name} code`,
      },
    ],
    bestPractices: content?.bestPractices?.map((b) => ({
      title: b.title,
      category: b.category,
      recommendation: b.recommendation,
    })) || [],
    interoperability: {
      withOtherLanguages: ['APIs', 'JSON/REST', 'FFI / Native bindings'],
      ffiOrWasmOrApis: 'Standard network protocols and data interchange formats.',
    },
    versionInformation: {
      currentLTS: 'Latest Stable',
      majorVersions: ['Modern Editions'],
      notableChanges: `Continually evolving ${name} ecosystem`,
    },
    documentationReferences: [
      { title: `Official ${name} Docs`, url: 'https://devdocs.io/', category: 'Documentation' },
    ],
  };
}

/**
 * Retrieves the comprehensive knowledge profile for any supported language.
 */
export function getLanguageKnowledgeProfile(lang: SupportedLanguage | string): LanguageKnowledgeProfile {
  const normalized = (lang || 'generic').toLowerCase().trim() as SupportedLanguage;
  return LANGUAGE_KNOWLEDGE_PROFILES[normalized] || LANGUAGE_KNOWLEDGE_PROFILES.generic;
}

/**
 * Detects language from file extension, shebang, or code tokens.
 */
export function detectLanguageFromSnippetOrFile(
  fileName?: string,
  code?: string
): SupportedLanguage {
  if (fileName) {
    const lower = fileName.toLowerCase();
    for (const [lang, profile] of Object.entries(LANGUAGE_KNOWLEDGE_PROFILES)) {
      if (profile.fileExtensions.some((ext) => lower.endsWith(ext))) {
        return lang as SupportedLanguage;
      }
    }
  }

  if (code) {
    const trimmed = code.trim();
    if (trimmed.startsWith('#!/usr/bin/env python') || trimmed.includes('def ') && trimmed.includes(':') && !trimmed.includes('{')) {
      return 'python';
    }
    if (trimmed.includes('fn ') && (trimmed.includes('let mut ') || trimmed.includes('println!'))) {
      return 'rust';
    }
    if (trimmed.includes('interface ') && trimmed.includes(':') && trimmed.includes('type ')) {
      return 'typescript';
    }
    if (trimmed.includes('package main') || trimmed.includes('func ') && trimmed.includes('fmt.')) {
      return 'go';
    }
    if (trimmed.includes('public class ') || trimmed.includes('System.out.println')) {
      return 'java';
    }
    if (trimmed.includes('using System;') || trimmed.includes('namespace ') && trimmed.includes('Console.WriteLine')) {
      return 'csharp';
    }
    if (trimmed.includes('#include <') || trimmed.includes('std::cout') || trimmed.includes('malloc(')) {
      return 'cpp';
    }
    if (trimmed.includes('<?php')) {
      return 'php';
    }
    if (trimmed.includes('def ') && trimmed.includes('end\n') || trimmed.includes('puts ')) {
      return 'ruby';
    }
    if (trimmed.includes('SELECT ') || trimmed.includes('INSERT INTO ') || trimmed.includes('CREATE TABLE')) {
      return 'sql';
    }
    if (trimmed.includes('<!DOCTYPE html>') || trimmed.includes('<html') || trimmed.includes('<div')) {
      return 'html';
    }
    if (trimmed.includes('{') && (trimmed.includes('margin:') || trimmed.includes('padding:') || trimmed.includes('display: flex'))) {
      return 'css';
    }
  }

  return 'typescript';
}
