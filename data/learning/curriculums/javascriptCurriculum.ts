import { LanguageCurriculum } from './types';

export const javascriptCurriculum: LanguageCurriculum = {
  languageId: 'javascript',
  languageName: 'JavaScript',
  icon: '🟨',
  color: 'text-amber-400',
  tagline: 'The universal language of the modern web, full-stack runtimes, event loops, and asynchronous microservices.',
  totalChapters: 8,
  chapters: [
    {
      id: 'js-ch-1',
      chapterNumber: 1,
      title: 'JavaScript Foundations & Modern ES6+ Declarations',
      subtitle: 'Master const, let, block scoping, template literals, primitive vs reference types, and strict mode.',
      estimatedMinutes: 20,
      difficulty: 'Beginner',
      objectives: [
        'Understand the fundamental difference between const, let, and deprecated var.',
        'Master block scoping, TDZ (Temporal Dead Zone), and variable hoisting.',
        'Use template literals and expression interpolation.',
        'Distinguish between primitives (string, number, boolean, null, undefined, symbol, bigint) and reference objects.'
      ],
      concepts: [
        {
          title: 'Block Scoping: const and let vs var',
          explanation: '`const` and `let` are block-scoped to the nearest enclosing pair of curly braces {}, preventing variable leakage into parent scopes. Always default to `const`, and only use `let` when reassignment is needed.',
          codeSnippet: `const API_URL = "https://api.devpulse.io/v1";\nlet retryCount = 0;\n\nif (true) {\n  const token = "auth_sec_123"; // Scoped strictly to this block\n  retryCount += 1;\n}\n// token is not accessible here (ReferenceError)`,
          keyTakeaway: 'Never use var in modern JavaScript. Default to const, use let only when reassignment is necessary.'
        },
        {
          title: 'Template Literals',
          explanation: 'Backtick string literals support multi-line strings and inline expression interpolation via `${expression}` without clunky string concatenation.',
          codeSnippet: `const user = "Alex";\nconst latencyMs = 42.5;\nconsole.log(\`[METRIC] User \${user} finished query in \${latencyMs.toFixed(1)}ms\`);`,
          keyTakeaway: 'Template literals enhance readability and prevent string concatenation type coercion bugs.'
        }
      ],
      examples: [
        {
          title: 'Log Event Formatter with Modern ES6+',
          explanation: 'Demonstrates const declarations, template literals, and defensive parameter fallbacks.',
          code: `function formatLogMessage(level = "INFO", message = "", meta = {}) {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : "-";
  return \`[\${timestamp}] [\${level.toUpperCase()}] \${message} (Meta: \${metaStr})\`;
}

console.log(formatLogMessage("warn", "High memory usage", { heapUsedMb: 450 }));
console.log(formatLogMessage("info", "Server listening on port 3000"));`,
          output: `[2026-08-22T11:40:00.000Z] [WARN] High memory usage (Meta: {"heapUsedMb":450})
[2026-08-22T11:40:00.000Z] [INFO] Server listening on port 3000 (Meta: -)`,
          tip: 'Use default parameter assignments (e.g. level = "INFO") to avoid undefined checks.'
        }
      ],
      tryIt: {
        id: 'js-try-1',
        title: 'Build a Metric Summary Card Formatter',
        task: 'Write a JavaScript function formatMetricBadge(metricName, score, threshold = 80) that returns a formatted badge.',
        instructions: [
          'Use const and let appropriately.',
          'If score >= threshold, status is "PASSED" and emoji is "✅".',
          'Otherwise, status is "FAILED" and emoji is "⚠️".',
          'Return a template string: `${emoji} [${status}] ${metricName}: ${score.toFixed(1)}/100`'
        ],
        starterCode: `function formatMetricBadge(metricName, score, threshold = 80) {
  // TODO: Determine status and emoji
  // TODO: Return template literal string
}

console.log(formatMetricBadge("Cyclomatic Complexity", 92.5));
console.log(formatMetricBadge("Maintainability Index", 64.0));`,
        solutionCode: `function formatMetricBadge(metricName, score, threshold = 80) {
  const passed = score >= threshold;
  const status = passed ? "PASSED" : "FAILED";
  const emoji = passed ? "✅" : "⚠️";
  return \`\${emoji} [\${status}] \${metricName}: \${score.toFixed(1)}/100\`;
}

console.log(formatMetricBadge("Cyclomatic Complexity", 92.5));
console.log(formatMetricBadge("Maintainability Index", 64.0));`,
        hints: [
          'Use ternary operator: const status = score >= threshold ? "PASSED" : "FAILED"',
          'Use score.toFixed(1) to format to 1 decimal place'
        ],
        validationCriteria: [
          'Uses template literals (backticks)',
          'Checks score >= threshold',
          'Returns formatted badge string'
        ]
      },
      quiz: {
        question: 'What is the primary difference between let and const in JavaScript?',
        options: [
          'const variables cannot be reassigned after declaration, while let variables can.',
          'const is function-scoped while let is block-scoped.',
          'const only works with primitive types like numbers and strings.',
          'let is hoisted to the global object while const is not.'
        ],
        correct: 0,
        explanation: 'const creates an immutable binding (cannot be reassigned), whereas let allows reassignment within its block scope.'
      }
    },
    {
      id: 'js-ch-2',
      chapterNumber: 2,
      title: 'Control Flow, Optional Chaining & Nullish Coalescing',
      subtitle: 'Safely access nested properties with ?. and ?? while flattening deep branching conditionals.',
      estimatedMinutes: 25,
      difficulty: 'Beginner',
      objectives: [
        'Safely traverse deeply nested objects using Optional Chaining (?.).',
        'Distinguish Nullish Coalescing (??) from the logical OR (||) operator.',
        'Use early guard returns to prevent "pyramid of doom" indentation in handlers.',
        'Apply for...of, for...in, and array iterations safely.'
      ],
      concepts: [
        {
          title: 'Optional Chaining (?.) and Nullish Coalescing (??)',
          explanation: 'Optional chaining (`?.`) short-circuits to `undefined` if any reference in the chain is nullish (null or undefined), preventing "Cannot read properties of undefined" exceptions. Nullish coalescing (`??`) provides a fallback ONLY when the value is `null` or `undefined`, preserving valid falsy values like `0` or `""`.',
          codeSnippet: `const config = { telemetry: { sampleRate: 0 } };\n\n// ❌ Buggy || treats 0 as falsy and overrides with 1.0:\nconst rateBug = config.telemetry?.sampleRate || 1.0; // 1.0\n\n// ✅ Correct ?? only falls back if null/undefined:\nconst rateFixed = config.telemetry?.sampleRate ?? 1.0; // 0`,
          keyTakeaway: 'Use ?? instead of || whenever 0, false, or "" are legitimate values.'
        }
      ],
      examples: [
        {
          title: 'Deep API Response Extractor with Optional Chaining',
          explanation: 'Safely parses telemetry metrics from arbitrary third-party payloads.',
          code: `function extractPerformanceMetrics(payload) {
  return {
    loc: payload?.data?.metrics?.loc ?? 0,
    cyclomatic: payload?.data?.metrics?.complexity?.cyclomatic ?? 1,
    author: payload?.data?.author?.name ?? "Unknown Author",
    warningsCount: payload?.warnings?.length ?? 0
  };
}

console.log(extractPerformanceMetrics({
  data: {
    metrics: { loc: 1420, complexity: { cyclomatic: 4 } },
    author: { name: "Vansh" }
  }
}));

console.log(extractPerformanceMetrics(null)); // Safe fallback without throwing`,
          output: `{ loc: 1420, cyclomatic: 4, author: 'Vansh', warningsCount: 0 }
{ loc: 0, cyclomatic: 1, author: 'Unknown Author', warningsCount: 0 }`,
          tip: 'Combine ?. with ?? to safely traverse deep JSON payloads without manual nested if checks.'
        }
      ],
      tryIt: {
        id: 'js-try-2',
        title: 'Safe Configuration Loader with Fallbacks',
        task: 'Write a getSetting(settingsObj, pathKey, fallbackValue) helper using modern optional chaining and nullish coalescing.',
        instructions: [
          'Function receives a settings object, a path key string (e.g. "theme" or "notifications.email"), and fallbackValue.',
          'Extract nested properties safely.',
          'Return the found value or fallbackValue using nullish coalescing (??).'
        ],
        starterCode: `function getSetting(settings, key, fallback) {
  // TODO: Extract setting using optional chaining and nullish coalescing
  // Note: key might be simple like "theme" or nested like "notifications"
}

const userConfig = {
  theme: "dark",
  notifications: { email: true, sms: false },
  maxRetries: 0
};

console.log(getSetting(userConfig, "theme", "light"));
console.log(getSetting(userConfig, "maxRetries", 3)); // Must return 0, not 3!
console.log(getSetting(userConfig, "missingKey", "default"));`,
        solutionCode: `function getSetting(settings, key, fallback) {
  if (!settings) return fallback;
  const val = key.includes('.')
    ? key.split('.').reduce((acc, part) => acc?.[part], settings)
    : settings?.[key];
  return val ?? fallback;
}

const userConfig = {
  theme: "dark",
  notifications: { email: true, sms: false },
  maxRetries: 0
};

console.log(getSetting(userConfig, "theme", "light"));
console.log(getSetting(userConfig, "maxRetries", 3));
console.log(getSetting(userConfig, "missingKey", "default"));`,
        hints: [
          'Use nullish coalescing: val ?? fallback to ensure 0 or false is returned properly.',
          'Use settings?.[key] for direct property lookups.'
        ],
        validationCriteria: [
          'Uses nullish coalescing ??',
          'Preserves falsy values like 0 or false',
          'Handles null/undefined gracefully'
        ]
      }
    },
    {
      id: 'js-ch-3',
      chapterNumber: 3,
      title: 'Arrays, Objects, Destructuring & Functional Pipelines',
      subtitle: 'Harness map, filter, reduce, object destructuring, spread/rest syntax, and immutable patterns.',
      estimatedMinutes: 30,
      difficulty: 'Beginner',
      objectives: [
        'Master array transformations using map(), filter(), reduce(), and find().',
        'Use object and array destructuring with default values and aliasing.',
        'Apply the spread (...) operator for shallow copying and immutability.',
        'Avoid mutating source arrays in place (e.g. preferring toSorted, toReversed, slice).'
      ],
      concepts: [
        {
          title: 'The Functional Array Pipeline (map, filter, reduce)',
          explanation: 'Modern JavaScript favors declarative data transformations. Instead of managing loop counter variables and push arrays, chain higher-order array methods.',
          codeSnippet: `const findings = [\n  { id: "S1", severity: "critical", weight: 25 },\n  { id: "S2", severity: "info", weight: 2 },\n  { id: "S3", severity: "critical", weight: 30 }\n];\n\n// Pipeline:\nconst criticalWeight = findings\n  .filter(f => f.severity === "critical")\n  .reduce((sum, f) => sum + f.weight, 0); // 55`,
          keyTakeaway: 'Chaining filter, map, and reduce creates readable, bug-free data transformation pipelines.'
        }
      ],
      examples: [
        {
          title: 'Code Smells Severity Aggregator Pipeline',
          explanation: 'Groups code smells by category and calculates average severity impact.',
          code: `const smells = [
  { rule: "LongMethod", category: "complexity", penalty: 15 },
  { rule: "DeadCode", category: "maintainability", penalty: 5 },
  { rule: "NestedIfs", category: "complexity", penalty: 20 },
  { rule: "MissingDoc", category: "documentation", penalty: 8 },
];

// 1. Group total penalty by category using reduce
const penaltyByCategory = smells.reduce((acc, { category, penalty }) => {
  acc[category] = (acc[category] ?? 0) + penalty;
  return acc;
}, {});

// 2. Extract rules with penalty >= 10
const highImpactRules = smells
  .filter(({ penalty }) => penalty >= 10)
  .map(({ rule, penalty }) => \`\${rule} (-\${penalty}pts)\`);

console.log("Category Penalties:", penaltyByCategory);
console.log("High Impact Rules:", highImpactRules);`,
          output: `Category Penalties: { complexity: 35, maintainability: 5, documentation: 8 }
High Impact Rules: [ 'LongMethod (-15pts)', 'NestedIfs (-20pts)' ]`,
          tip: 'Destructure parameters directly in arrow function arguments: `({ category, penalty }) => ...`'
        }
      ],
      tryIt: {
        id: 'js-try-3',
        title: 'Build an AST Node Metrics Aggregator',
        task: 'Given an array of function analysis objects, calculate the total SLOC, max complexity, and list of complex function names (complexity > 5).',
        instructions: [
          'Input functions: [{ name: "parse", loc: 40, complexity: 6 }, { name: "init", loc: 10, complexity: 1 }, ...]',
          'Calculate totalLoc using reduce.',
          'Calculate maxComplexity using Math.max(...complexities).',
          'Calculate complexFunctions using filter and map.',
          'Return { totalLoc, maxComplexity, complexFunctions }.'
        ],
        starterCode: `function aggregateFunctionMetrics(fnList = []) {
  // TODO: Compute totalLoc, maxComplexity, complexFunctions
  // Return summary object
}

const sampleFns = [
  { name: "scanDirectory", loc: 45, complexity: 8 },
  { name: "formatDate", loc: 8, complexity: 1 },
  { name: "parseASTTree", loc: 92, complexity: 14 }
];

console.log(aggregateFunctionMetrics(sampleFns));`,
        solutionCode: `function aggregateFunctionMetrics(fnList = []) {
  const totalLoc = fnList.reduce((acc, fn) => acc + (fn.loc ?? 0), 0);
  const maxComplexity = fnList.length > 0 
    ? Math.max(...fnList.map(fn => fn.complexity ?? 0))
    : 0;
  const complexFunctions = fnList
    .filter(fn => (fn.complexity ?? 0) > 5)
    .map(fn => fn.name);

  return { totalLoc, maxComplexity, complexFunctions };
}

const sampleFns = [
  { name: "scanDirectory", loc: 45, complexity: 8 },
  { name: "formatDate", loc: 8, complexity: 1 },
  { name: "parseASTTree", loc: 92, complexity: 14 }
];

console.log(aggregateFunctionMetrics(sampleFns));`,
        hints: [
          'Use fnList.reduce((sum, fn) => sum + fn.loc, 0) for totalLoc',
          'Use fnList.filter(fn => fn.complexity > 5).map(fn => fn.name)'
        ],
        validationCriteria: [
          'Calculates totalLoc with reduce',
          'Calculates maxComplexity',
          'Returns complexFunctions array'
        ]
      }
    },
    {
      id: 'js-ch-4',
      chapterNumber: 4,
      title: 'Functions, Arrow Expressions, Closures & Lexical Scope',
      subtitle: 'Master execution contexts, lexical this binding, currying, higher-order functions, and closure encapsulation.',
      estimatedMinutes: 30,
      difficulty: 'Intermediate',
      objectives: [
        'Understand lexical scope and how JavaScript closures capture outer variables.',
        'Distinguish function declarations, function expressions, and arrow functions.',
        'Explain how arrow functions inherit `this` from their enclosing lexical context.',
        'Implement practical closures for private state encapsulation and factory generators.'
      ],
      concepts: [
        {
          title: 'Closures & Private State Encapsulation',
          explanation: 'A closure is the combination of a function bundled together with references to its surrounding lexical state. Even after the outer function returns, the inner function retains access to the variables in that scope.',
          codeSnippet: `function createRateLimiter(maxCallsPerMinute) {\n  let calls = 0;\n  let lastReset = Date.now();\n\n  return function isAllowed() {\n    const now = Date.now();\n    if (now - lastReset > 60000) {\n      calls = 0;\n      lastReset = now;\n    }\n    if (calls < maxCallsPerMinute) {\n      calls += 1;\n      return true;\n    }\n    return false;\n  };\n}`,
          keyTakeaway: 'Closures provide safe data encapsulation without exposing internal state to outside mutation.'
        }
      ],
      examples: [
        {
          title: 'Configurable Telemetry Tracker Factory (Closure)',
          explanation: 'Demonstrates creating isolated stateful trackers using higher-order functions.',
          code: `function createAuditTracker(componentName) {
  const events = [];

  return {
    record(event, data = {}) {
      const entry = { event, data, timestamp: Date.now() };
      events.push(entry);
      console.log(\`[\${componentName}] Recorded: \${event}\`);
    },
    getHistory() {
      // Return defensive copy to prevent external mutation
      return [...events];
    },
    getCount() {
      return events.length;
    }
  };
}

const parserAudit = createAuditTracker("AST_PARSER");
parserAudit.record("TOKENIZE_START");
parserAudit.record("PARSED_NODES", { count: 350 });
console.log("Total events logged:", parserAudit.getCount());`,
          output: `[AST_PARSER] Recorded: TOKENIZE_START
[AST_PARSER] Recorded: PARSED_NODES
Total events logged: 2`,
          tip: 'Return defensive copies (e.g. `[...events]`) so callers cannot mutate internal closure state.'
        }
      ],
      tryIt: {
        id: 'js-try-4',
        title: 'Build a Memoization Cache Wrapper (Closure)',
        task: 'Implement a memoize(fn) higher-order function that caches function computation results by stringified arguments.',
        instructions: [
          'Inside memoize(fn), create a private cache object (or Map).',
          'Return a new function that takes (...args).',
          'Serialize args into a cache key using JSON.stringify(args).',
          'If key exists in cache, return cached result immediately.',
          'Otherwise, compute result = fn(...args), store in cache, and return result.'
        ],
        starterCode: `function memoize(fn) {
  // TODO: Create cache Map or object
  // TODO: Return wrapper function that caches results
}

// Test function
const expensiveComplexityCalc = memoize((codeSnippet) => {
  console.log("Computing expensive metric for:", codeSnippet);
  return codeSnippet.length * 4.2;
});

console.log(expensiveComplexityCalc("function test() {}"));
console.log(expensiveComplexityCalc("function test() {}")); // Should use cache!`,
        solutionCode: `function memoize(fn) {
  const cache = new Map();

  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const expensiveComplexityCalc = memoize((codeSnippet) => {
  console.log("Computing expensive metric for:", codeSnippet);
  return codeSnippet.length * 4.2;
});

console.log(expensiveComplexityCalc("function test() {}"));
console.log(expensiveComplexityCalc("function test() {}"));`,
        hints: [
          'Use const cache = new Map() inside the closure.',
          'Use cache.has(key) and cache.set(key, result).'
        ],
        validationCriteria: [
          'Implements closure with cache',
          'Uses JSON.stringify or Map key',
          'Returns cached result on subsequent calls'
        ]
      }
    },
    {
      id: 'js-ch-5',
      chapterNumber: 5,
      title: 'Asynchronous JavaScript, Promises & Async/Await',
      subtitle: 'Master the JavaScript Event Loop, Promise lifecycle, async/await, Promise.allSettled, and error boundaries.',
      estimatedMinutes: 35,
      difficulty: 'Intermediate',
      objectives: [
        'Understand the JavaScript Event Loop (Call Stack, Web APIs, Microtask Queue, Macrotask Queue).',
        'Construct and chain native Promises with .then(), .catch(), and .finally().',
        'Write clean synchronous-looking asynchronous code using async and await.',
        'Handle concurrent requests safely with Promise.all and Promise.allSettled.'
      ],
      concepts: [
        {
          title: 'Promise.all vs Promise.allSettled',
          explanation: '`Promise.all` fails fast and rejects immediately if even ONE promise rejects. `Promise.allSettled` waits for all promises to finish regardless of success or failure, returning an array of `{ status: "fulfilled", value }` or `{ status: "rejected", reason }`.',
          codeSnippet: `const tasks = [fetchFile("a.js"), fetchFile("b.js"), fetchFile("c.js")];\n\n// Resilient batch execution:\nconst results = await Promise.allSettled(tasks);\nconst successful = results\n  .filter(r => r.status === "fulfilled")\n  .map(r => r.value);`,
          keyTakeaway: 'Use Promise.allSettled when processing independent parallel tasks where partial success is acceptable.'
        }
      ],
      examples: [
        {
          title: 'Resilient Multi-Target Code Health Scanner',
          explanation: 'Scans multiple files in parallel with timeout guards and graceful degradation.',
          code: `async function scanCodeWithTimeout(fileName, code, timeoutMs = 2000) {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error(\`Scan timed out for \${fileName}\`)), timeoutMs)
  );

  const scanPromise = new Promise((resolve) => {
    // Simulate AST evaluation time
    setTimeout(() => {
      resolve({ file: fileName, score: Math.min(100, Math.round(code.length * 1.2)) });
    }, 100);
  });

  return Promise.race([scanPromise, timeoutPromise]);
}

async function runBatch() {
  const files = [
    { name: "index.js", code: "const app = 1;" },
    { name: "utils.js", code: "export const add = (a,b) => a+b;" }
  ];

  try {
    const results = await Promise.all(files.map(f => scanCodeWithTimeout(f.name, f.code)));
    console.log("Batch Scan Results:", results);
  } catch (err) {
    console.error("Batch failed:", err.message);
  }
}

runBatch();`,
          output: `Batch Scan Results: [
  { file: 'index.js', score: 18 },
  { file: 'utils.js', score: 41 }
]`,
          tip: 'Use Promise.race to enforce strict SLA timeouts on network and parse operations.'
        }
      ],
      tryIt: {
        id: 'js-try-5',
        title: 'Build a Parallel Health Fetcher with Fallbacks',
        task: 'Write an async function fetchAllModuleHealth(moduleNames) that queries all modules concurrently and returns an array of success results.',
        instructions: [
          'Simulate querying each module with an async mock: async function checkModule(name).',
          'Use Promise.allSettled to execute all module checks concurrently.',
          'Filter out failed promises and return an array of the fulfilled values.',
          'If a module failed, log the rejection reason without crashing.'
        ],
        starterCode: `async function checkModule(name) {
  if (name.includes("broken")) {
    throw new Error(\`Failed to parse \${name}\`);
  }
  return { name, health: 95, status: "healthy" };
}

async function fetchAllModuleHealth(moduleNames = []) {
  // TODO: Use Promise.allSettled to check all modules concurrently
  // TODO: Return only successful results array
}

// Test
fetchAllModuleHealth(["auth.js", "broken_db.js", "router.js"])
  .then(results => console.log("Successful Modules:", results));`,
        solutionCode: `async function checkModule(name) {
  if (name.includes("broken")) {
    throw new Error(\`Failed to parse \${name}\`);
  }
  return { name, health: 95, status: "healthy" };
}

async function fetchAllModuleHealth(moduleNames = []) {
  const settled = await Promise.allSettled(
    moduleNames.map(name => checkModule(name))
  );

  return settled
    .filter(res => res.status === "fulfilled")
    .map(res => res.value);
}

fetchAllModuleHealth(["auth.js", "broken_db.js", "router.js"])
  .then(results => console.log("Successful Modules:", results));`,
        hints: [
          'Use const settled = await Promise.allSettled(moduleNames.map(name => checkModule(name)))',
          'Filter for res.status === "fulfilled" and map to res.value'
        ],
        validationCriteria: [
          'Uses async/await and Promise.allSettled',
          'Filters fulfilled statuses',
          'Returns results array'
        ]
      }
    },
    {
      id: 'js-ch-6',
      chapterNumber: 6,
      title: 'Object-Oriented JavaScript & Modern ES6+ Classes',
      subtitle: 'Construct robust classes with constructors, inheritance, getters/setters, static factory methods, and #privateFields.',
      estimatedMinutes: 30,
      difficulty: 'Intermediate',
      objectives: [
        'Understand ES6 class syntax as syntactical sugar over prototypal inheritance.',
        'Use true private class fields (`#field`) and methods.',
        'Leverage `extends` and `super()` for clean polymorphic inheritance.',
        'Implement static factory methods and computed getter/setter properties.'
      ],
      concepts: [
        {
          title: 'True Private Fields (#privateField)',
          explanation: 'Modern JavaScript supports hard private class fields prefixed with `#`. These fields cannot be inspected or accessed outside the class body, even in browser consoles or via `Object.keys()`.',
          codeSnippet: `class SecureAnalyzer {\n  #apiKey;\n  #analysisCount = 0;\n\n  constructor(apiKey) {\n    this.#apiKey = apiKey;\n  }\n\n  analyze(source) {\n    this.#analysisCount++;\n    return \`Analyzed with key \${this.#apiKey.slice(0, 4)}*** (Count: \${this.#analysisCount})\`;\n  }\n}`,
          keyTakeaway: 'Use #privateField syntax to guarantee strict encapsulation and protect internal credentials or counters.'
        }
      ],
      examples: [
        {
          title: 'Code Review Rule Class Hierarchy',
          explanation: 'Demonstrates class inheritance, abstract method patterns, and private fields.',
          code: `class CodeRule {
  #id;
  constructor(id, title, category) {
    this.#id = id;
    this.title = title;
    this.category = category;
  }

  get id() {
    return this.#id;
  }

  evaluate(astNode) {
    throw new Error("Method evaluate() must be implemented by subclass.");
  }
}

class MaxLengthRule extends CodeRule {
  #maxAllowed;
  constructor(id, maxAllowed = 50) {
    super(id, "Method Length Limit", "complexity");
    this.#maxAllowed = maxAllowed;
  }

  evaluate(astNode) {
    const loc = astNode?.loc ?? 0;
    return {
      ruleId: this.id,
      passed: loc <= this.#maxAllowed,
      actual: loc,
      limit: this.#maxAllowed
    };
  }
}

const rule = new MaxLengthRule("RULE-01", 30);
console.log("Rule Info:", rule.title, "| Category:", rule.category);
console.log("Evaluation (loc=24):", rule.evaluate({ loc: 24 }));
console.log("Evaluation (loc=45):", rule.evaluate({ loc: 45 }));`,
          output: `Rule Info: Method Length Limit | Category: complexity
Evaluation (loc=24): { ruleId: 'RULE-01', passed: true, actual: 24, limit: 30 }
Evaluation (loc=45): { ruleId: 'RULE-01', passed: false, actual: 45, limit: 30 }`,
          tip: 'Use getters to expose read-only views of private properties.'
        }
      ],
      tryIt: {
        id: 'js-try-6',
        title: 'Build a CodeSmellReporter Class with Private Counters',
        task: 'Implement a CodeSmellReporter class with private #smells array and computed metrics.',
        instructions: [
          'Define class CodeSmellReporter.',
          'Define private field #smells = [].',
          'Add method addSmell(rule, severity, line) that pushes { rule, severity, line }.',
          'Add getter get count() that returns total smells recorded.',
          'Add getter get isClean() that returns true if count === 0.',
          'Add method getSmells() that returns a shallow copy of #smells.'
        ],
        starterCode: `class CodeSmellReporter {
  // TODO: Add #smells private array
  // TODO: Add addSmell, count getter, isClean getter, getSmells
}

const reporter = new CodeSmellReporter();
console.log("Is Clean Initially?", reporter.isClean);
reporter.addSmell("NoVar", "warning", 14);
reporter.addSmell("EvalDetected", "critical", 38);
console.log("Count:", reporter.count);
console.log("Is Clean Now?", reporter.isClean);
console.log("Findings:", reporter.getSmells());`,
        solutionCode: `class CodeSmellReporter {
  #smells = [];

  addSmell(rule, severity, line) {
    this.#smells.push({ rule, severity, line, timestamp: Date.now() });
  }

  get count() {
    return this.#smells.length;
  }

  get isClean() {
    return this.#smells.length === 0;
  }

  getSmells() {
    return [...this.#smells];
  }
}

const reporter = new CodeSmellReporter();
console.log("Is Clean Initially?", reporter.isClean);
reporter.addSmell("NoVar", "warning", 14);
reporter.addSmell("EvalDetected", "critical", 38);
console.log("Count:", reporter.count);
console.log("Is Clean Now?", reporter.isClean);
console.log("Findings:", reporter.getSmells());`,
        hints: [
          'Use #smells = [] at the top of the class.',
          'Use get count() and get isClean() syntax for computed properties.'
        ],
        validationCriteria: [
          'Uses private field #smells',
          'Has addSmell method',
          'Has getters count and isClean'
        ]
      }
    },
    {
      id: 'js-ch-7',
      chapterNumber: 7,
      title: 'Modules, Bundling & Modern Ecosystem (ESM vs CJS)',
      subtitle: 'Master ES Modules (import/export), dynamic imports, package.json dependencies, and tree-shaking.',
      estimatedMinutes: 25,
      difficulty: 'Intermediate',
      objectives: [
        'Distinguish between ES Modules (ESM) and CommonJS (CJS require/module.exports).',
        'Use named exports, default exports, and wildcard re-exports cleanly.',
        'Use dynamic `import()` for lazy-loading heavy analytical libraries.',
        'Understand tree-shaking and module side-effects in modern bundlers (Vite, Rollup, Webpack).'
      ],
      concepts: [
        {
          title: 'Named vs Default Exports in ES Modules',
          explanation: 'Named exports promote explicit tree-shaking and prevent accidental renaming bugs. Prefer named exports for utilities and models, reserving default exports only for primary view components.',
          codeSnippet: `// 🟢 RECOMMENDED: Named exports (tree-shakeable):\nexport const analyzeMetrics = (code) => { /*...*/ };\nexport const SUPPORTED_LANGS = ["js", "py", "ts"];\n\n// Consumer can import only what is needed:\nimport { analyzeMetrics } from "./analyzer.js";`,
          keyTakeaway: 'Prefer named exports to ensure consistent naming and optimal bundler tree-shaking.'
        }
      ],
      examples: [
        {
          title: 'Dynamic Module Lazy Loader with Error Fallback',
          explanation: 'Demonstrates lazy loading an analysis module only when needed by user interaction.',
          code: `async function loadHeavyAnalyzer(engineType = "standard") {
  console.log(\`[BUNDLER] Dynamically loading \${engineType} engine...\`);
  try {
    // In real apps: const module = await import("./heavyAstEngine.js");
    const mockModule = {
      engine: engineType,
      run: (code) => ({ chars: code.length, complexity: 1 })
    };
    return mockModule;
  } catch (err) {
    console.error("Failed to load module dynamically:", err);
    throw err;
  }
}

loadHeavyAnalyzer("ast-v2").then((eng) => {
  console.log("Loaded engine:", eng.engine);
  console.log("Run result:", eng.run("console.log('hi')"));
});`,
          output: `[BUNDLER] Dynamically loading ast-v2 engine...
Loaded engine: ast-v2
Run result: { chars: 17, complexity: 1 }`,
          tip: 'Use dynamic imports for heavy chart libraries or parsers to minimize initial application bundle size.'
        }
      ],
      tryIt: {
        id: 'js-try-7',
        title: 'Construct a Barrel File Module Exporter',
        task: 'Write a module exporter structure combining named exports and a default configuration factory.',
        instructions: [
          'Export named constant VERSION = "2.4.0".',
          'Export named function calculateHealth(score, smellsCount).',
          'Export default factory function createWorkspace(name).',
          'Ensure calculateHealth returns Math.max(0, score - smellsCount * 5).'
        ],
        starterCode: `// TODO: Export named VERSION
// TODO: Export named calculateHealth(score, smellsCount)
// TODO: Export default createWorkspace(name)

function testModuleExports() {
  // Test helpers locally
}
testModuleExports();`,
        solutionCode: `export const VERSION = "2.4.0";

export function calculateHealth(score, smellsCount = 0) {
  return Math.max(0, score - smellsCount * 5);
}

export default function createWorkspace(name = "Default") {
  return { name, version: VERSION, health: 100 };
}`,
        hints: [
          'Use export const VERSION = "2.4.0";',
          'Use export default function createWorkspace...',
          'Use Math.max(0, score - smellsCount * 5)'
        ],
        validationCriteria: [
          'Has export const VERSION',
          'Has export function calculateHealth',
          'Has export default function createWorkspace'
        ]
      }
    },
    {
      id: 'js-ch-8',
      chapterNumber: 8,
      title: 'Security, Code Smells & Web Vulnerabilities',
      subtitle: 'Audit code for XSS vulnerabilities, Prototype Pollution, memory leaks, and malicious eval patterns.',
      estimatedMinutes: 35,
      difficulty: 'Advanced',
      objectives: [
        'Audit code for Cross-Site Scripting (XSS) via innerHTML and unescaped input.',
        'Understand and mitigate JavaScript Prototype Pollution.',
        'Prevent memory leaks from orphaned event listeners, intervals, and uncleaned closures.',
        'Identify hazardous eval(), setTimeout(string), and Function() constructor patterns.'
      ],
      concepts: [
        {
          title: 'Preventing Cross-Site Scripting (XSS)',
          explanation: 'Assigning untrusted user strings directly to `element.innerHTML` allows attackers to inject malicious script tags and steal session tokens. Always use `element.textContent` or trusted sanitization frameworks (e.g. DOMPurify).',
          codeSnippet: `// 🔴 CRITICAL XSS VULNERABILITY:\ncontainer.innerHTML = \`<div class="user">\${userInput}</div>\`;\n\n// 🟢 SECURE REMEDIATION:\nconst el = document.createElement("div");\nel.className = "user";\nel.textContent = userInput; // Automatically encoded\ncontainer.appendChild(el);`,
          keyTakeaway: 'Never assign raw user strings to innerHTML. Use textContent or sanitized DOM nodes.'
        },
        {
          title: 'Prototype Pollution Defense',
          explanation: 'Recursively merging untrusted JSON objects without key filtering can overwrite `Object.prototype.__proto__`, altering application-wide prototype behavior.',
          codeSnippet: `// Protect against prototype pollution:\nfunction safeMerge(target, source) {\n  for (const key of Object.keys(source)) {\n    if (key === "__proto__" || key === "constructor" || key === "prototype") {\n      continue; // Block dangerous prototype traversal\n    }\n    target[key] = source[key];\n  }\n  return target;\n}`,
          keyTakeaway: 'Always filter out __proto__, constructor, and prototype when merging deep objects.'
        }
      ],
      examples: [
        {
          title: 'Secure HTML Entity Sanitizer Function',
          explanation: 'Converts hazardous HTML characters (&, <, >, ", \') into safe character entity references.',
          code: `function sanitizeHtml(rawStr = "") {
  if (typeof rawStr !== "string") return "";
  const entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;"
  };
  return rawStr.replace(/[&<>"'/]/g, (char) => entityMap[char]);
}

const untrustedInput = '<script>alert("XSS Attack!")</script>';
console.log("Raw Input:     ", untrustedInput);
console.log("Sanitized HTML:", sanitizeHtml(untrustedInput));`,
          output: `Raw Input:      <script>alert("XSS Attack!")</script>
Sanitized HTML: &lt;script&gt;alert(&quot;XSS Attack!&quot;)&lt;&#x2F;script&gt;`,
          tip: 'Always sanitize untrusted user input before rendering inside HTML templates or markdown bodies.'
        }
      ],
      tryIt: {
        id: 'js-try-8',
        title: 'Remediate a Dangerous Object Merge (Prototype Pollution Guard)',
        task: 'Fix the unsafe deep merge function by adding checks against prototype pollution keys (__proto__, constructor, prototype).',
        instructions: [
          'Create function safeObjectAssign(target, source).',
          'Iterate through source keys using Object.keys(source).',
          'Skip any key that equals "__proto__", "constructor", or "prototype".',
          'Assign safe keys to target and return target.'
        ],
        starterCode: `// ❌ Vulnerable to Prototype Pollution:
function safeObjectAssign(target, source) {
  for (const key in source) {
    // BUG: Missing prototype check allows __proto__ injection!
    target[key] = source[key];
  }
  return target;
}

const payload = JSON.parse('{"__proto__": {"polluted": true}, "validKey": "safe"}');
const result = safeObjectAssign({}, payload);
console.log("Result:", result);`,
        solutionCode: `function safeObjectAssign(target, source) {
  if (!target || typeof target !== "object" || !source || typeof source !== "object") {
    return target;
  }
  const dangerousKeys = new Set(["__proto__", "constructor", "prototype"]);

  for (const key of Object.keys(source)) {
    if (dangerousKeys.has(key)) {
      continue;
    }
    target[key] = source[key];
  }
  return target;
}

const payload = JSON.parse('{"__proto__": {"polluted": true}, "validKey": "safe"}');
const result = safeObjectAssign({}, payload);
console.log("Result:", result);`,
        hints: [
          'Check if key === "__proto__" || key === "constructor" || key === "prototype" and continue',
          'Use Object.keys(source) instead of for..in to ignore inherited prototype properties'
        ],
        validationCriteria: [
          'Blocks __proto__',
          'Blocks constructor and prototype',
          'Assigns valid keys safely'
        ]
      }
    }
  ]
};
