import { LanguageLearningContent } from '../types';

export const javascriptContent: LanguageLearningContent = {
  id: 'javascript',
  name: 'JavaScript',
  icon: '🟨',
  color: 'text-yellow-500',
  tagline: 'The universal language of the web, powering interactive browser clients and scalable async server runtimes.',
  extensions: ['.js', '.mjs', '.cjs', '.jsx'],
  difficulty: 'Beginner',
  paradigms: ['Multi-paradigm', 'Event-Driven', 'Functional', 'Prototype-based Object-Oriented', 'Imperative'],
  creator: 'Brendan Eich',
  releaseYear: '1995',
  currentPurpose: 'Web frontend UI (React, Vue, Svelte), backend servers (Node.js, Deno, Bun), mobile apps (React Native), desktop tools (Electron).',
  typingSystem: 'Dynamic, Weak typing with automatic type coercion (e.g. "5" + 2 == "52")',
  executionModel: 'Single-threaded event loop execution with JIT compilation via V8, SpiderMonkey, or JavaScriptCore',
  typicalEnvironments: ['Modern Web Browsers (Chrome, Safari, Firefox)', 'Node.js', 'Bun', 'Deno', 'Cloudflare Workers / Edge', 'Electron'],
  devPulseSupport: {
    level: 'Deep AST Parser',
    capabilities: [
      'AST lexical & scope parsing (ES6+ / JSX)',
      'Cyclomatic & cognitive complexity evaluation',
      'Loose equality (==) vs strict equality (===) checks',
      'Async/await error handling & promise chaining smells',
      'Prototype pollution & global variable leak detection',
    ],
  },
  whyLearn: {
    importance: 'JavaScript runs in every web browser and is the only language natively supported by web clients.',
    commonDomains: ['Web Frontend Development', 'Full-Stack Web APIs', 'Serverless Edge Compute', 'Real-Time WebSockets', 'Desktop & Mobile Cross-Platform'],
    strengths: [
      'Natively supported across 100% of modern web browsers without plugins',
      'Enormous npm ecosystem with over 2 million open-source packages',
      'High-performance asynchronous non-blocking I/O event loop model',
      'Huge job market demand across both frontend and backend stacks',
    ],
    weaknesses: [
      'Implicit type coercion causes subtle bugs if strict comparisons are not used',
      'Single-threaded event loop can block UI or server throughput on heavy CPU calculations',
      'Ecosystem fatigue with rapidly shifting tooling and build chains',
    ],
    careerRelevance: 'Crucial for Frontend Engineers, Full-Stack Developers, Node.js Backend Engineers, and Mobile App Creators.',
    typicalProjects: ['Interactive SPAs (React / Vue)', 'REST / GraphQL Microservices (Express / Fastify)', 'Real-Time Chat & Collab Platforms (Socket.io)', 'CLI Developer Tools'],
    whenToChoose: ['When building browser-based applications', 'When creating full-stack JS apps sharing models between client and server', 'When developing real-time I/O-intensive services'],
    whenToAvoid: ['When raw CPU-bound mathematical computation is primary', 'When strict compile-time type safety is needed without TypeScript'],
  },
  coreConcepts: [
    { title: 'The Event Loop & Call Stack', summary: 'JavaScript processes tasks via a single-threaded Call Stack, Microtask Queue (Promises), and Macrotask Queue (setTimeout).', relevance: 'Enables non-blocking UI without locking the browser.' },
    { title: 'Closures & Lexical Scope', summary: 'A closure is the combination of a function bundled together with references to its surrounding lexical state.', relevance: 'Allows data encapsulation and factory patterns.' },
    { title: 'Prototypal Inheritance', summary: 'Objects inherit directly from other objects via prototype chains rather than classical blueprint classes.', relevance: 'Underpins all JS object and class mechanics.' },
  ],
  syntaxFundamentals: [
    {
      title: 'const, let, and Template Literals',
      concept: 'Block-scoped variable declaration',
      explanation: 'const declares immutable variable bindings, let declares mutable block-scoped variables. Template literals use backticks for interpolation.',
      code: `const serviceName = "Pulse API";
let requestCount = 10;
requestCount += 1;
console.log(\`[\${serviceName}] Handled \${requestCount} requests.\`);`,
      output: `[Pulse API] Handled 11 requests.`,
      importantNote: 'Avoid var because it is function-scoped and hoists unintuitively.',
    },
    {
      title: 'Arrow Functions & Lexical this',
      concept: 'Concise function expressions without own this binding',
      explanation: 'Arrow functions capture the this value of the enclosing lexical scope.',
      code: `const calculateScore = (loc, smells) => Math.max(0, 100 - (smells * 5));
console.log(calculateScore(120, 3));`,
      output: `85`,
      importantNote: 'Do not use arrow functions for object methods that need dynamic this.',
    },
  ],
  dataTypes: {
    summary: 'JavaScript has 7 primitive types and 1 composite reference type (Object).',
    typingNotes: 'Primitive types are passed by value and immutable; Objects and Arrays are passed by reference and mutable.',
    typesList: [
      { type: 'number', description: 'Double-precision 64-bit binary float (IEEE 754)', example: '42, 3.14, NaN, Infinity', category: 'Primitive', isMutable: false },
      { type: 'string', description: 'UTF-16 text sequence', example: '"Hello World"', category: 'Primitive', isMutable: false },
      { type: 'boolean', description: 'Logical true or false', example: 'true / false', category: 'Primitive', isMutable: false },
      { type: 'undefined', description: 'Default value of uninitialized variables', example: 'undefined', category: 'Primitive', isMutable: false },
      { type: 'null', description: 'Intentional absence of any object value', example: 'null', category: 'Primitive', isMutable: false },
      { type: 'symbol', description: 'Unique and immutable identifier', example: 'Symbol("id")', category: 'Primitive', isMutable: false },
      { type: 'bigint', description: 'Arbitrary-precision integer for large numbers', example: '9007199254740991n', category: 'Primitive', isMutable: false },
      { type: 'Object / Array', description: 'Key-value dictionary or ordered indexed collection', example: '{ id: 1 }, [1, 2, 3]', category: 'Composite', isMutable: true },
    ],
  },
  controlFlow: [
    {
      name: 'if / else if / else & Ternary',
      description: 'Conditional evaluation using strict comparison ===.',
      code: `const score = 92;
const grade = score >= 90 ? "Excellent" : "Standard";`,
      note: 'Always use === and !== instead of == to avoid type coercion bugs.',
    },
    {
      name: 'for...of vs for...in',
      description: 'for...of iterates values in arrays; for...in iterates keys/properties in objects.',
      code: `const files = ["main.js", "app.js", "config.js"];
for (const file of files) {
  console.log(file);
}`,
      note: 'Use for...of for Arrays and Sets.',
    },
  ],
  functions: [
    {
      title: 'Async Functions & Promises',
      description: 'Handling non-blocking asynchronous operations with async / await syntax.',
      code: `async function fetchHealth(endpoint) {
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    const data = await res.json();
    return data.score;
  } catch (err) {
    console.error("Health check failed:", err.message);
    return null;
  }
}`,
      hasDefaultParams: true,
      hasLambdas: true,
    },
  ],
  oop: {
    isSupported: true,
    paradigmNotes: 'ES6 classes provide clean syntax over JavaScript prototype-based inheritance.',
    concepts: [
      {
        concept: 'ES6 Classes & Private Fields (#)',
        description: 'Class syntax with constructor, methods, and hard-private properties prefixed with #.',
        code: `class MetricCollector {
  #secretApiKey;

  constructor(apiKey) {
    this.#secretApiKey = apiKey;
    this.recordedCount = 0;
  }

  record(metricName, value) {
    this.recordedCount++;
    console.log(\`Recorded \${metricName}: \${value}\`);
  }
}

const collector = new MetricCollector("key-123");
collector.record("cpu_load", 42);`,
        note: 'Private fields (#) cannot be accessed outside the class scope.',
      },
    ],
  },
  errorHandling: [
    {
      type: 'try / catch / finally & Error class',
      description: 'Standard exception management for runtime errors and rejected promises.',
      mechanism: 'Throwing Error instances and catching synchronously or across async/await.',
      code: `try {
  JSON.parse("invalid-json");
} catch (error) {
  console.warn("Parsing failed:", error.message);
} finally {
  console.log("Cleanup executed.");
}`,
      debuggingTip: 'Always throw Error objects (e.g. throw new Error("...")) rather than plain strings.',
    },
  ],
  modulesAndPackages: {
    title: 'ES Modules (ESM) & npm',
    importSyntax: 'import { analyze } from "./engine.js"; / import React from "react";',
    exportSyntax: 'export const version = "1.0"; / export default App;',
    packageManager: 'npm / pnpm / yarn / bun',
    packageManagerCommand: 'npm install express / pnpm add ...',
    standardModules: ['fs/promises', 'path', 'http', 'crypto', 'events', 'util'],
    description: 'Modern JavaScript uses ES Modules (import/export). package.json configures dependencies and scripts.',
  },
  memoryAndExecution: {
    model: 'Automatic garbage collection using mark-and-sweep algorithm in the V8 engine.',
    allocation: 'Primitives are allocated on the Stack or optimized registers; Objects, Arrays, and Closures live on the Heap.',
    garbageCollection: 'The V8 GC divides memory into New Space (Scavenger) and Old Space (Mark-Sweep-Compact).',
    keyDetails: [
      'Avoid global variables and dangling event listeners to prevent memory leaks.',
      'Use WeakMap and WeakSet for temporary caches allowing garbage collection of keys.',
    ],
  },
  concurrency: {
    model: 'Single-threaded event loop handling asynchronous I/O via promises, microtasks, and Web Workers / Worker Threads for CPU tasks.',
    keyPrimitives: ['Promise', 'async / await', 'Promise.allSettled()', 'Worker Threads'],
    description: 'Never block the main thread with long synchronous loops; offload heavy work to background Web Workers.',
    code: `const results = await Promise.allSettled([
  fetch("/api/metrics"),
  fetch("/api/smells")
]);`,
  },
  toolsAndEcosystem: [
    {
      category: 'Runtimes & Package Managers',
      tools: [
        { name: 'Node.js', description: 'V8-powered asynchronous server runtime.', type: 'Runtime/Build' },
        { name: 'Bun', description: 'All-in-one ultra-fast JavaScript runtime, bundler, and package manager.', type: 'Runtime/Build' },
        { name: 'npm', description: 'Default package registry and CLI manager.', type: 'Package Manager' },
        { name: 'pnpm', description: 'Fast, disk space-efficient package manager.', type: 'Package Manager' },
      ],
    },
    {
      category: 'Frontend Frameworks',
      tools: [
        { name: 'React', description: 'Declarative component-based UI library.', type: 'Framework' },
        { name: 'Vue.js', description: 'Progressive reactive web framework.', type: 'Framework' },
        { name: 'Next.js', description: 'Full-stack React framework with SSR and server actions.', type: 'Framework' },
      ],
    },
    {
      category: 'Linters & Bundlers',
      tools: [
        { name: 'ESLint', description: 'Pluggable static analysis linter for JavaScript.', type: 'Linter/Formatter' },
        { name: 'Prettier', description: 'Opinionated code formatter.', type: 'Linter/Formatter' },
        { name: 'Vite', description: 'Next-generation frontend tooling and bundler.', type: 'Runtime/Build' },
        { name: 'Vitest', description: 'Blazing fast unit test framework powered by Vite.', type: 'Testing' },
      ],
    },
  ],
  useCases: [
    { title: 'Web Application Frontends', description: 'Building responsive user interfaces with React, Vue, Svelte, and Angular.', popularity: 'Very High', examples: ['DevPulse Web UI', 'SaaS Dashboards', 'Social Media Web Apps'] },
    { title: 'Server-Side APIs & Microservices', description: 'High-concurrency lightweight HTTP/REST and GraphQL services.', popularity: 'High', examples: ['Express / Fastify REST APIs', 'BFF (Backend for Frontend)'] },
    { title: 'Full-Stack Jamstack & Edge Functions', description: 'Serverless execution at CDN edge nodes with low latency.', popularity: 'High', examples: ['Cloudflare Workers', 'Vercel Edge Functions'] },
  ],
  bestPractices: [
    {
      title: 'Always Use Strict Equality (===)',
      category: 'Security',
      recommendation: 'Loose equality (==) coerces types unpredictably (e.g. 0 == false is true).',
      goodCode: `if (userRole === "admin") { grantAccess(); }`,
      badCode: `if (userRole == "admin") { grantAccess(); }`,
    },
    {
      title: 'Prefer const Over let, Avoid var',
      category: 'Maintainability',
      recommendation: 'Use const by default. Only use let when reassigning a variable.',
      goodCode: `const items = [1, 2, 3];
items.push(4); // Array mutation is allowed on const references`,
      badCode: `var items = [1, 2, 3];`,
    },
  ],
  commonMistakes: [
    {
      mistake: 'Loose Equality Coercion',
      whyItMatters: '== performs type conversion before comparison, leading to security flaws and logic errors.',
      badSnippet: `if (inputVal == 0) { // Matches "", false, and [0]!
  resetCounter();
}`,
      betterApproach: 'Use === to verify both value and exact type.',
      fixedSnippet: `if (inputVal === 0) {
  resetCounter();
}`,
    },
    {
      mistake: 'Uncaught Promise Rejections in Loops',
      whyItMatters: 'Using forEach with async callbacks does not await promises, causing out-of-order execution.',
      badSnippet: `items.forEach(async (item) => {
  await processItem(item); // Runs concurrently without awaiting completion!
});`,
      betterApproach: 'Use a standard for...of loop or Promise.all().',
      fixedSnippet: `for (const item of items) {
  await processItem(item);
}`,
    },
  ],
  securityConsiderations: [
    {
      vulnerability: 'Cross-Site Scripting (XSS) via innerHTML',
      riskLevel: 'Critical',
      description: 'Injecting raw user input into DOM innerHTML allows attackers to execute arbitrary JavaScript in victim browsers.',
      vulnerableCode: `element.innerHTML = "<p>User: " + userProvidedComment + "</p>";`,
      remediation: 'Use textContent, or use modern frameworks (React) that auto-escape strings.',
      secureCode: `element.textContent = userProvidedComment;`,
    },
    {
      vulnerability: 'Prototype Pollution',
      riskLevel: 'High',
      description: 'Recursively merging untrusted JSON objects into existing objects can overwrite Object.prototype properties.',
      vulnerableCode: `function merge(target, source) {
  for (let key in source) { target[key] = source[key]; }
}`,
      remediation: 'Validate object keys, avoid unsafe recursive deep clones, or use Object.create(null).',
      secureCode: `const safeMap = Object.create(null); // No prototype to pollute`,
    },
  ],
  performanceConsiderations: [
    {
      topic: 'Avoid Blocking the Event Loop',
      impact: 'High',
      description: 'Synchronous operations (e.g. fs.readFileSync, massive JSON.parse) freeze the main UI and server request handling.',
      recommendation: 'Use asynchronous APIs and streaming for large payloads.',
    },
    {
      topic: 'Debounce and Throttle Event Handlers',
      impact: 'Medium',
      description: 'Rapid events (scroll, resize, keydown) trigger excessive DOM re-renders if unthrottled.',
      recommendation: 'Wrap event listeners in debounce/throttle wrappers.',
    },
  ],
  roadmap: [
    { stepNumber: 1, title: 'Basics & ES6 Syntax', description: 'Variables (const/let), template literals, arrow functions, destructuring.', topics: ['const/let', 'Arrow Functions', 'Destructuring', 'Spread Operator'], estimatedTime: '1-2 weeks' },
    { stepNumber: 2, title: 'DOM & Events', description: 'Event listeners, DOM manipulation, bubbling, capturing, fetch API.', topics: ['addEventListener', 'Fetch API', 'DOM APIs'], estimatedTime: '1-2 weeks' },
    { stepNumber: 3, title: 'Asynchronous JavaScript', description: 'Promises, async/await, microtasks vs macrotasks, error handling.', topics: ['Promises', 'async/await', 'Event Loop', 'try/catch'], estimatedTime: '2 weeks' },
    { stepNumber: 4, title: 'ES Modules & Tooling', description: 'npm packages, package.json, bundling with Vite, linting with ESLint.', topics: ['ES Modules', 'npm / pnpm', 'Vite', 'ESLint'], estimatedTime: '2 weeks' },
    { stepNumber: 5, title: 'Modern UI Frameworks', description: 'React, component state, hooks, reactivity, and single-page apps.', topics: ['React Components', 'State & Hooks', 'Routing'], estimatedTime: '3-4 weeks' },
    { stepNumber: 6, title: 'Node.js & Backend Architecture', description: 'Express/Fastify, REST APIs, middleware, database integration.', topics: ['Node.js', 'Express', 'JWT Auth', 'Databases'], estimatedTime: '3-4 weeks' },
  ],
  practiceExercises: [
    {
      id: 'js-ex-1',
      title: 'Filter High Severity Smells',
      difficulty: 'Beginner',
      objective: 'Write a function filterCriticalSmells(smells) that returns an array of smell titles with severity "critical".',
      starterCode: `function filterCriticalSmells(smells) {
  // TODO: Use .filter() and .map() to return titles of critical smells
}`,
      solutionCode: `function filterCriticalSmells(smells) {
  return smells
    .filter(s => s.severity === "critical")
    .map(s => s.title);
}

const sample = [
  { title: "SQL Injection", severity: "critical" },
  { title: "Unused Import", severity: "info" }
];
console.log(filterCriticalSmells(sample));`,
      hints: ['Use smells.filter(s => s.severity === "critical")', 'Then chain .map(s => s.title)'],
      sampleOutput: '["SQL Injection"]',
    },
  ],
};
