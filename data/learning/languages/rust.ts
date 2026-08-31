import { LanguageLearningContent } from '../types';

export const rustContent: LanguageLearningContent = {
  id: 'rust',
  name: 'Rust',
  icon: '🦀',
  color: 'text-amber-600',
  tagline: 'Memory-safe systems language offering bare-metal performance and zero-cost abstractions without a garbage collector.',
  extensions: ['.rs'],
  difficulty: 'Advanced',
  paradigms: ['Multi-paradigm', 'Functional', 'Concurrent', 'Generic', 'Imperative'],
  creator: 'Graydon Hoare (Mozilla Research)',
  releaseYear: '2015',
  currentPurpose: 'Systems programming, WebAssembly (Wasm), high-performance web tooling (Turbopack, Biome), blockchain engines, cloud infrastructure.',
  typingSystem: 'Static, Strong, Affine typing with compile-time borrow checker and trait-based polymorphism',
  executionModel: 'Native compilation to machine code via LLVM backend with zero runtime or garbage collector',
  typicalEnvironments: ['Bare-metal / Embedded OS', 'WebAssembly in Browsers', 'Linux Servers', 'High-Performance CLI Tooling'],
  devPulseSupport: {
    level: 'Lexical & Structural',
    capabilities: [
      'Pattern & fn declaration parsing',
      'Cyclomatic branch & match exhaustiveness evaluation',
      'Unwrap/panic risk heuristic detection',
      'Trait implementation & dependency scanning',
      'Dead code & unused mut binding warnings',
    ],
  },
  whyLearn: {
    importance: 'Rust has been voted the most loved programming language for 8+ consecutive years due to its uncompromising memory safety and performance.',
    commonDomains: ['High-Performance Systems', 'WebAssembly (Wasm)', 'High-Speed Web Tooling (Vite/Ruff/Turbopack)', 'Blockchain Core Protocols', 'Linux Kernel Modules'],
    strengths: [
      'Guarantees memory safety and data-race freedom at compile time without a GC',
      'Zero-cost abstractions with modern functional patterns (iterators, pattern matching)',
      'World-class package manager and build tool (Cargo) and comprehensive compiler errors',
      'Seamless C-interoperability and WebAssembly target support',
    ],
    weaknesses: [
      'Steep initial learning curve due to the borrow checker and lifetime annotations',
      'Longer compilation times than Go or C',
      'Strict rules can slow down initial rapid prototyping',
    ],
    careerRelevance: 'Rapidly expanding demand in Cloud Infrastructure, WebAssembly, Security, and Modern Systems Engineering.',
    typicalProjects: ['Wasm Image Processors', 'High-Speed Linters/Compilers (Ruff, SWC)', 'Distributed Key-Value Stores', 'Cryptographic Engines'],
    whenToChoose: ['When maximum performance AND guaranteed memory safety are required', 'When building WebAssembly modules or CLI developer tools'],
    whenToAvoid: ['When rapid CRUD prototypes need to be shipped in hours by beginners'],
  },
  coreConcepts: [
    { title: 'Ownership & Borrowing', summary: 'Every value has a single owner. You can have either one mutable reference (&mut T) OR any number of immutable references (&T) at a time.', relevance: 'Eliminates null pointers, data races, and use-after-free at compile time.' },
    { title: 'Option<T> & Result<T, E>', summary: 'No null values. Option handles absence safely; Result handles recoverable errors via the ? operator.', relevance: 'Guarantees exhaustive error and null handling.' },
    { title: 'Traits & Generics', summary: 'Traits define shared behavior across types without inheritance.', relevance: 'Enables composable, zero-cost polymorphism.' },
  ],
  syntaxFundamentals: [
    {
      title: 'Ownership & The Borrow Checker',
      concept: 'Single ownership and reference borrowing',
      explanation: 'Passing a variable by value moves ownership. Borrowing with & allows shared read access without moving.',
      code: `fn calculate_length(s: &String) -> usize {
    s.len() // Borrowed reference, does not take ownership
}

fn main() {
    let message = String::from("DevPulse");
    let len = calculate_length(&message);
    println!("'{}' has length {}", message, len); // message is still valid!
}`,
      output: `'DevPulse' has length 8`,
      importantNote: 'Variables are immutable by default; use let mut to make them mutable.',
    },
    {
      title: 'Pattern Matching & Result Handling with ?',
      concept: 'Exhaustive pattern matching and error propagation',
      explanation: 'The ? operator returns early if an error occurred, or unwraps the Ok value.',
      code: `fn parse_score(input: &str) -> Result<u32, std::num::ParseIntError> {
    let score: u32 = input.trim().parse()?; // ? propagates Err automatically
    Ok(score)
}

fn main() {
    match parse_score("98") {
        Ok(s) => println!("Parsed Score: {}", s),
        Err(e) => eprintln!("Parse Failed: {}", e),
    }
}`,
      output: `Parsed Score: 98`,
      importantNote: 'Avoid calling .unwrap() in production code; use match, if let, or ?.',
    },
  ],
  dataTypes: {
    summary: 'Rust has primitive scalar types, tuples, arrays, structs, and algebraic enums.',
    typingNotes: 'Static typing with powerful local type inference.',
    typesList: [
      { type: 'i32 / u32 / i64 / usize', description: 'Signed, unsigned, and pointer-sized integers', example: 'let x: usize = 42;', category: 'Primitive' },
      { type: 'f64', description: '64-bit IEEE floating point', example: '3.14159', category: 'Primitive' },
      { type: 'bool / char', description: 'Boolean or 4-byte Unicode scalar value', example: 'true, \'🦀\'', category: 'Primitive' },
      { type: 'String vs &str', description: 'Heap-allocated growable string vs borrowed string slice', example: 'String::from("a"), "b"', category: 'Composite' },
      { type: 'Vec<T>', description: 'Heap-allocated dynamically sized array', example: 'vec![1, 2, 3]', category: 'Collection' },
      { type: 'Option<T> / Result<T, E>', description: 'Algebraic enums for safe nullability and errors', example: 'Some(42), Ok("pass")', category: 'Special' },
    ],
  },
  controlFlow: [
    {
      name: 'match Expressions with Exhaustiveness',
      description: 'Match patterns against enums or values; the compiler ensures every possible case is handled.',
      code: `enum Severity { Info, Warning, Critical }
let sev = Severity::Critical;
let color = match sev {
    Severity::Info => "blue",
    Severity::Warning => "amber",
    Severity::Critical => "red",
};`,
      note: 'If you omit a case, the Rust compiler refuses to build.',
    },
  ],
  functions: [
    {
      title: 'Functions & Iterator Closures',
      description: 'Functional iterators with map, filter, and fold running at zero-cost native speed.',
      code: `fn count_critical(severities: &[&str]) -> usize {
    severities.iter().filter(|&&s| s == "critical").count()
}`,
    },
  ],
  oop: {
    isSupported: false,
    paradigmNotes: 'Rust uses traits and structs rather than classes and inheritance.',
    concepts: [
      {
        concept: 'Traits and impl Blocks',
        description: 'Define interfaces with traits and implement them for specific structs.',
        code: `trait Analyzer {
    fn analyze(&self, code: &str) -> u32;
}

struct LineCounter;
impl Analyzer for LineCounter {
    fn analyze(&self, code: &str) -> u32 {
        code.lines().count() as u32
    }
}`,
      },
    ],
  },
  errorHandling: [
    {
      type: 'Result<T, E> & thiserror / anyhow',
      description: 'Monadic error handling without runtime exceptions or unwinding penalties.',
      mechanism: 'Explicit error types returned from functions and matched or propagated via ?.',
      code: `use std::fs::File;
use std::io::{self, Read};

fn read_metric_file(path: &str) -> Result<String, io::Error> {
    let mut file = File::open(path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}`,
      debuggingTip: 'Use the anyhow crate for application binaries and thiserror for public libraries.',
    },
  ],
  modulesAndPackages: {
    title: 'Cargo & Crates.io',
    importSyntax: 'use std::collections::HashMap; / use serde::{Serialize, Deserialize};',
    exportSyntax: 'pub struct Report; / pub fn analyze();',
    packageManager: 'Cargo (Cargo.toml built-in)',
    packageManagerCommand: 'cargo add tokio serde --features full / cargo build --release',
    standardModules: ['std::collections', 'std::fs', 'std::io', 'std::sync', 'std::thread'],
    description: 'Cargo handles compiling, unit testing, benchmarking, and publishing to crates.io.',
  },
  memoryAndExecution: {
    model: 'Affine type system with compile-time lifetime analysis. Zero runtime garbage collection.',
    allocation: 'Box<T> for heap allocation; standard values live on the Stack.',
    garbageCollection: 'None. Memory is freed immediately when owner leaves scope (Drop trait).',
    keyDetails: ['Guaranteed memory safety: No use-after-free, double-free, or buffer overflows in safe Rust.'],
  },
  concurrency: {
    model: '"Fearless Concurrency" using Send and Sync traits enforced at compile time.',
    keyPrimitives: ['tokio (async/await)', 'std::thread::spawn', 'Arc<Mutex<T>>', 'crossbeam (channels)'],
    description: 'The compiler prevents data races before your code can even build.',
    code: `use std::sync::{Arc, Mutex};
use std::thread;

let counter = Arc::new(Mutex::new(0));
let c = Arc::clone(&counter);
thread::spawn(move || {
    let mut num = c.lock().unwrap();
    *num += 1;
});`,
  },
  toolsAndEcosystem: [
    {
      category: 'Build & Analysis Tools',
      tools: [
        { name: 'Cargo', description: 'Official package manager, build tool, and test runner.', type: 'Runtime/Build' },
        { name: 'Clippy', description: 'Extremely thorough linter catching hundreds of code smells and performance traps.', type: 'Linter/Formatter' },
        { name: 'rust-analyzer', description: 'High-performance LSP server for IDEs.', type: 'IDE/Editor' },
      ],
    },
    {
      category: 'Key Libraries',
      tools: [
        { name: 'Tokio', description: 'Asynchronous event-driven runtime for network applications.', type: 'Framework' },
        { name: 'Serde', description: 'Zero-copy serialization and deserialization framework.', type: 'Framework' },
        { name: 'Axum', description: 'Ergonomic, modular web application framework.', type: 'Framework' },
      ],
    },
  ],
  useCases: [
    { title: 'High-Performance Web Tooling', description: 'Building the next generation of fast build tools and bundlers.', popularity: 'Very High', examples: ['Turbopack', 'Ruff Linter', 'Biome Formatter', 'SWC'] },
    { title: 'WebAssembly (Wasm) in Browsers', description: 'Running near-native performance C/Rust code inside web clients.', popularity: 'High', examples: ['Figma Graphics Engine', '1Password Browser Extension'] },
  ],
  bestPractices: [
    {
      title: 'Run cargo clippy Regularly',
      category: 'Maintainability',
      recommendation: 'Clippy provides actionable suggestions for idiomatic Rust and performance gains.',
      goodCode: `cargo clippy -- -D warnings`,
    },
  ],
  commonMistakes: [
    {
      mistake: 'Using .unwrap() in Production Code',
      whyItMatters: 'Calling .unwrap() on a None or Err value causes the entire thread to panic and crash.',
      badSnippet: `let value = parse_input(raw).unwrap(); // Panics on bad input!`,
      betterApproach: 'Use ? error propagation or handle the error with unwrap_or / match.',
      fixedSnippet: `let value = parse_input(raw).unwrap_or(0);`,
    },
  ],
  securityConsiderations: [
    {
      vulnerability: 'Unsoundness in unsafe {} Blocks',
      riskLevel: 'High',
      description: 'Using unsafe to bypass borrow checking without upholding raw pointer invariants leads to memory corruption.',
      vulnerableCode: `unsafe { *raw_ptr = 42; } // Unchecked null or dangling pointer!`,
      remediation: 'Keep unsafe blocks minimal, heavily audited, and wrapped in safe abstractions.',
      secureCode: `let mut safe_val = 42;`,
    },
  ],
  performanceConsiderations: [
    {
      topic: 'Use Borrowed Slices (&[T], &str) Instead of Owned Types',
      impact: 'High',
      description: 'Passing &String or &Vec<T> forces caller to own the specific container; passing &str or &[T] is more generic and avoids allocations.',
      recommendation: 'Accept &str instead of &String in function signatures.',
    },
  ],
  roadmap: [
    { stepNumber: 1, title: 'Rust Basics & Tooling', description: 'Cargo, variables, mutability, scalar types, functions.', topics: ['Cargo', 'let vs let mut', 'Control Flow'], estimatedTime: '1-2 weeks' },
    { stepNumber: 2, title: 'Ownership & Borrowing', description: 'The core mental model: moves, borrows (&), mutable borrows (&mut), lifetimes.', topics: ['Ownership', 'Borrow Checker', 'Slices'], estimatedTime: '2-3 weeks' },
    { stepNumber: 3, title: 'Structs, Enums & Pattern Matching', description: 'Custom structs, Option<T>, Result<T, E>, exhaustive match.', topics: ['Structs', 'Enums', 'Pattern Matching'], estimatedTime: '2 weeks' },
    { stepNumber: 4, title: 'Traits & Generics', description: 'Defining traits, implementing standard traits (Display, Debug, Clone), generics.', topics: ['Traits', 'Generics', 'Iterator Trait'], estimatedTime: '2 weeks' },
    { stepNumber: 5, title: 'Async Rust & Tokio', description: 'async/await, Tokio runtime, channels, building network services.', topics: ['Tokio', 'Async/Await', 'Error Handling with anyhow'], estimatedTime: '3 weeks' },
  ],
  practiceExercises: [
    {
      id: 'rs-ex-1',
      title: 'Safe Division with Option',
      difficulty: 'Beginner',
      objective: 'Write a function safe_divide(a: f64, b: f64) -> Option<f64> that returns None if b == 0.0.',
      starterCode: `fn safe_divide(a: f64, b: f64) -> Option<f64> {
    // TODO
    None
}

fn main() {
    // TODO
}`,
      solutionCode: `fn safe_divide(a: f64, b: f64) -> Option<f64> {
    if b == 0.0 {
        None
    } else {
        Some(a / b)
    }
}

fn main() {
    match safe_divide(10.0, 2.0) {
        Some(val) => println!("Result: {}", val),
        None => println!("Cannot divide by zero"),
    }
}`,
      hints: ['Check if b == 0.0, return None, otherwise return Some(a / b)'],
      sampleOutput: 'Result: 5',
    },
  ],
};
