import { LanguageLearningContent } from '../types';

export const typescriptContent: LanguageLearningContent = {
  id: 'typescript',
  name: 'TypeScript',
  icon: '🔷',
  color: 'text-blue-500',
  tagline: 'Typed superset of JavaScript that compiles to plain JavaScript, providing compile-time type safety and advanced developer tooling.',
  extensions: ['.ts', '.tsx', '.d.ts'],
  difficulty: 'Intermediate',
  paradigms: ['Multi-paradigm', 'Static-Typed', 'Object-Oriented', 'Functional', 'Generic Programming'],
  creator: 'Anders Hejlsberg (Microsoft)',
  releaseYear: '2012',
  currentPurpose: 'Large-scale enterprise web applications, type-safe full-stack backends, open-source libraries, React/Next.js codebases.',
  typingSystem: 'Static, Structural (Duck Typing) with generics, union types, and type inference',
  executionModel: 'Transpiled/compiled to JavaScript via tsc, esbuild, SWC, or Babel, then executed by standard JS runtimes',
  typicalEnvironments: ['Node.js + tsx / ts-node', 'Browser (via Vite/Webpack)', 'Deno / Bun (native execution)', 'Next.js / Nuxt'],
  devPulseSupport: {
    level: 'Deep AST Parser',
    capabilities: [
      'Type annotations & interface hierarchy parsing',
      'Structural complexity & cognitive metric analysis',
      'Any-type abuse and strictNullChecks diagnostics',
      'Cyclomatic branch and exhaustive pattern evaluation',
      'Unused type declarations & dead export pruning',
    ],
  },
  whyLearn: {
    importance: 'TypeScript has become the industry standard for production JavaScript development across Fortune 500 engineering teams.',
    commonDomains: ['Enterprise Full-Stack Apps', 'Scalable React/Angular/Vue Apps', 'NPM Library Authoring', 'Node.js Backend Microservices'],
    strengths: [
      'Catches 15-20% of production bugs at compile-time before code runs',
      'Unmatched IDE autocompletion, refactoring safety, and self-documenting codebases',
      'Gradual adoption—can be mixed into existing JavaScript projects incrementally',
      'Structural typing matches real JavaScript idioms naturally',
    ],
    weaknesses: [
      'Additional compilation build step required',
      'Complex type gymnastics can increase compile times and cognitive load',
      'Types are erased at runtime (no native runtime type validation without Zod/Valibot)',
    ],
    careerRelevance: 'Highest demand requirement for modern frontend, full-stack, and backend JavaScript positions.',
    typicalProjects: ['React + Vite Web Applications', 'NestJS / Express Type-Safe APIs', 'NPM TypeScript Libraries', 'Full-Stack Next.js Platforms'],
    whenToChoose: ['When building medium to large scale applications with multiple developers', 'When authoring reusable public libraries', 'When refactoring complex JavaScript legacy codebases'],
    whenToAvoid: ['When writing 10-line throwaway bash-replacement scripts where type setup is overkill'],
  },
  coreConcepts: [
    { title: 'Structural Typing', summary: 'Type compatibility is determined by an object\'s shape and members rather than explicit nominal declaration.', relevance: 'Allows flexible object passing without rigid inheritance.' },
    { title: 'Generics (<T>)', summary: 'Write reusable components and functions that work across multiple data types while preserving full type safety.', relevance: 'Crucial for collections, API handlers, and utility types.' },
    { title: 'Union & Intersection Types', summary: 'Combine types with | (OR) or & (AND) to model complex domain states accurately.', relevance: 'Enables algebraic data types and exhaustive discriminated unions.' },
  ],
  syntaxFundamentals: [
    {
      title: 'Interfaces & Type Aliases',
      concept: 'Defining object contracts and custom types',
      explanation: 'Interfaces define the contract for object structures. Types can also model unions and primitives.',
      code: `interface AnalysisResult {
  readonly id: string;
  language: "typescript" | "python" | "rust";
  healthScore: number;
  tags?: string[]; // Optional property
}

const report: AnalysisResult = {
  id: "rep-001",
  language: "typescript",
  healthScore: 98
};`,
      output: `(Valid Type Checked)`,
      importantNote: 'Use readonly to prevent accidental mutations of critical fields.',
    },
    {
      title: 'Discriminated Unions',
      concept: 'Type-safe polymorphic state management',
      explanation: 'A pattern using a common literal tag property (e.g. status) to narrow types safely.',
      code: `type AsyncState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

function renderState(state: AsyncState<number>) {
  if (state.status === "success") {
    console.log("Value:", state.data * 2); // TypeScript knows data exists!
  }
}`,
      output: `(Exhaustive Type Guard)`,
      importantNote: 'Always leverage discriminated unions for API state rather than multiple boolean flags.',
    },
  ],
  dataTypes: {
    summary: 'TypeScript includes all JS primitives plus any, unknown, never, void, enums, and tuple types.',
    typingNotes: 'prefer unknown over any. any disables the type checker; unknown requires explicit type narrowing.',
    typesList: [
      { type: 'string / number / boolean', description: 'Standard primitive data types', example: '"hello", 42, true', category: 'Primitive' },
      { type: 'any', description: 'Escape hatch disabling type checking (discouraged)', example: 'let x: any = 5;', category: 'Special' },
      { type: 'unknown', description: 'Type-safe counterpart of any requiring narrowing', example: 'let val: unknown;', category: 'Special' },
      { type: 'never', description: 'Represents values that never occur (exhaustiveness)', example: 'function fail(): never', category: 'Special' },
      { type: 'void', description: 'Absence of return value from a function', example: '(): void => {}', category: 'Special' },
      { type: 'Tuple [T, U]', description: 'Fixed-length array with specified types at each index', example: '[string, number]', category: 'Collection' },
    ],
  },
  controlFlow: [
    {
      name: 'Type Narrowing with typeof and instanceof',
      description: 'TypeScript narrows types automatically within conditional branches.',
      code: `function processInput(val: string | number) {
  if (typeof val === "string") {
    return val.toUpperCase(); // TypeScript knows val is string
  }
  return val.toFixed(2); // TypeScript knows val is number
}`,
      note: 'Leverage user-defined type guards (is keyword) for custom objects.',
    },
  ],
  functions: [
    {
      title: 'Generic Functions',
      description: 'Functions with parameterized types for type safety across diverse inputs.',
      code: `function getFirstElement<T>(items: T[]): T | undefined {
  return items.length > 0 ? items[0] : undefined;
}

const firstNum = getFirstElement([10, 20, 30]); // Type: number | undefined
const firstStr = getFirstElement(["a", "b"]);   // Type: string | undefined`,
      hasDefaultParams: true,
      hasLambdas: true,
    },
  ],
  oop: {
    isSupported: true,
    paradigmNotes: 'Supports classes with public, private, protected, readonly, and abstract modifier keywords.',
    concepts: [
      {
        concept: 'Parameter Properties & Generics in Classes',
        description: 'Declare constructor arguments with visibility modifiers to auto-create class fields.',
        code: `abstract class BaseAnalyzer<TResult> {
  constructor(protected readonly engineName: string) {}
  abstract analyze(code: string): TResult;
}

class ASTAnalyzer extends BaseAnalyzer<{ nodeCount: number }> {
  analyze(code: string) {
    return { nodeCount: code.length };
  }
}`,
        note: 'abstract classes cannot be instantiated directly.',
      },
    ],
  },
  errorHandling: [
    {
      type: 'Catch Clause Unknown Type',
      description: 'In TypeScript 4.4+, caught errors in catch(err) are typed as unknown instead of any.',
      mechanism: 'Narrow errors using instanceof Error before accessing .message.',
      code: `try {
  runAnalysis();
} catch (err: unknown) {
  if (err instanceof Error) {
    console.error("Message:", err.message);
  } else {
    console.error("Unknown error:", err);
  }
}`,
      debuggingTip: 'Always verify err instanceof Error before assuming it has a message property.',
    },
  ],
  modulesAndPackages: {
    title: 'TypeScript Modules & @types',
    importSyntax: 'import type { CodeSmell } from "./types"; / import { analyze } from "./engine";',
    exportSyntax: 'export type { AnalysisResult }; / export const VERSION = "1.0";',
    packageManager: 'npm / pnpm / yarn',
    packageManagerCommand: 'npm i -D typescript @types/node @types/react',
    standardModules: ['fs', 'path', 'http', 'events', 'crypto'],
    description: 'Use import type for type-only imports to allow compilers to cleanly strip type declarations.',
  },
  memoryAndExecution: {
    model: 'Zero runtime overhead. Types are completely erased during compilation to JavaScript.',
    allocation: 'Identical to underlying JavaScript runtime (V8, JavaScriptCore).',
    garbageCollection: 'Handled by JavaScript engine GC.',
    keyDetails: ['Type safety exists solely at build/compile-time.', 'No performance penalty at runtime.'],
  },
  concurrency: {
    model: 'Typed Promises and async/await matching JavaScript event loop model with generic typing.',
    keyPrimitives: ['Promise<T>', 'AsyncIterable<T>', 'PromiseSettledResult<T>'],
    description: 'Promises are strongly typed with generic return types (e.g. Promise<UserRecord>).',
    code: `async function fetchMetric(id: string): Promise<{ score: number }> {
  return { score: 95 };
}`,
  },
  toolsAndEcosystem: [
    {
      category: 'Compilers & Type Checkers',
      tools: [
        { name: 'tsc', description: 'Official TypeScript compiler and type checker.', type: 'Linter/Formatter' },
        { name: 'tsx', description: 'TypeScript Execute: run TS files directly without separate build step.', type: 'Runtime/Build' },
        { name: 'esbuild', description: 'Extremely fast bundler and TS transformer.', type: 'Runtime/Build' },
      ],
    },
    {
      category: 'Validation & Schemas',
      tools: [
        { name: 'Zod', description: 'TypeScript-first schema declaration and runtime validation library.', type: 'Framework' },
        { name: 'ts-node', description: 'TypeScript execution engine for Node.js.', type: 'Runtime/Build' },
      ],
    },
  ],
  useCases: [
    { title: 'Large Enterprise Applications', description: 'Collaborative development with hundreds of engineers and modules.', popularity: 'Very High', examples: ['DevPulse Codebase', 'VS Code', 'Slack Web Client'] },
    { title: 'Type-Safe Full-Stack Platforms', description: 'End-to-end type safety between backend database, API, and frontend UI.', popularity: 'Very High', examples: ['Next.js App Router', 'tRPC APIs', 'NestJS Services'] },
  ],
  bestPractices: [
    {
      title: 'Enable strict: true in tsconfig.json',
      category: 'Maintainability',
      recommendation: 'Strict mode activates strictNullChecks, noImplicitAny, and strictFunctionTypes.',
      goodCode: `// tsconfig.json\n{\n  "compilerOptions": {\n    "strict": true\n  }\n}`,
    },
    {
      title: 'Use import type for Pure Types',
      category: 'Organization',
      recommendation: 'Explicit type imports prevent unnecessary circular module dependencies.',
      goodCode: `import type { UserConfig } from "./types";`,
      badCode: `import { UserConfig } from "./types";`,
    },
  ],
  commonMistakes: [
    {
      mistake: 'Using any Instead of unknown or Generics',
      whyItMatters: 'Using any disables all type checking and propagates untyped variables silently.',
      badSnippet: `function parseData(input: any) {
  return input.metrics.score; // No autocomplete, runtime crash if undefined
}`,
      betterApproach: 'Use unknown with type narrowing or Zod validation.',
      fixedSnippet: `function parseData(input: unknown) {
  if (typeof input === "object" && input !== null && "metrics" in input) {
    return (input as { metrics: { score: number } }).metrics.score;
  }
  return null;
}`,
    },
  ],
  securityConsiderations: [
    {
      vulnerability: 'Relying on TypeScript Types for Runtime API Validation',
      riskLevel: 'High',
      description: 'Types are erased at runtime; malicious HTTP JSON payloads will bypass interface contracts.',
      vulnerableCode: `app.post("/login", (req, res) => {
  const user = req.body as UserCredentials; // Fake type cast!
  auth(user.password);
});`,
      remediation: 'Use runtime validators like Zod to parse untrusted payloads.',
      secureCode: `import { z } from "zod";
const UserSchema = z.object({ username: z.string(), password: z.string().min(8) });
const user = UserSchema.parse(req.body); // Throws if invalid`,
    },
  ],
  performanceConsiderations: [
    {
      topic: 'Use Transpilers (esbuild / SWC) for Fast Development',
      impact: 'High',
      description: 'Running type checks separately (tsc --noEmit) while using esbuild for builds speeds up dev iteration by 10x-50x.',
      recommendation: 'Pair Vite/esbuild for bundler speed with tsc for CI pipeline verification.',
    },
  ],
  roadmap: [
    { stepNumber: 1, title: 'Basics & Primitive Types', description: 'Type annotations, arrays, tuples, interfaces vs types.', topics: ['Primitive Types', 'Interfaces', 'Type Aliases'], estimatedTime: '1 week' },
    { stepNumber: 2, title: 'Union Types & Narrowing', description: 'Discriminated unions, typeof, instanceof, in operator.', topics: ['Union Types', 'Type Narrowing', 'Exhaustiveness'], estimatedTime: '1-2 weeks' },
    { stepNumber: 3, title: 'Generics & Utility Types', description: 'Generic functions, interfaces, Partial, Pick, Omit, Record.', topics: ['Generics <T>', 'Utility Types', 'Keyof'], estimatedTime: '2 weeks' },
    { stepNumber: 4, title: 'Runtime Schema Validation', description: 'Pairing TypeScript with Zod for bulletproof API endpoints.', topics: ['Zod Schemas', 'Type Inference (z.infer)'], estimatedTime: '1 week' },
    { stepNumber: 5, title: 'Full-Stack Architecture', description: 'Building type-safe backends and frontends with shared types.', topics: ['Shared Types', 'Monorepos', 'Strict Configuration'], estimatedTime: '3 weeks' },
  ],
  practiceExercises: [
    {
      id: 'ts-ex-1',
      title: 'Type-Safe Result Wrapper',
      difficulty: 'Intermediate',
      objective: 'Define a generic Result<T, E> discriminated union and a function createSuccess<T>(data: T).',
      starterCode: `// TODO: Define Result<T, E> type with status: "success" | "failure"
type Result<T, E> = any;

function createSuccess<T>(data: T): Result<T, string> {
  // TODO
  return {} as any;
}`,
      solutionCode: `type Result<T, E> =
  | { status: "success"; data: T }
  | { status: "failure"; error: E };

function createSuccess<T>(data: T): Result<T, string> {
  return { status: "success", data };
}

const res = createSuccess({ score: 99 });
if (res.status === "success") {
  console.log("Score:", res.data.score);
}`,
      hints: ['Define a union with { status: "success"; data: T } and { status: "failure"; error: E }'],
      sampleOutput: 'Score: 99',
    },
  ],
};
