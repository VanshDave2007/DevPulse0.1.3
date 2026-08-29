import { LanguageLearningContent } from '../types';

export const swiftContent: LanguageLearningContent = {
  id: 'swift',
  name: 'Swift',
  icon: '🦅',
  color: 'text-orange-600',
  tagline: 'Powerful, intuitive language created by Apple for building fast, modern apps across iOS, macOS, watchOS, and server backends.',
  extensions: ['.swift'],
  difficulty: 'Intermediate',
  paradigms: ['Multi-paradigm', 'Protocol-Oriented', 'Object-Oriented', 'Functional', 'Declarative (SwiftUI)'],
  creator: 'Chris Lattner (Apple)',
  releaseYear: '2014',
  currentPurpose: 'Apple platforms native development (iOS, macOS, watchOS, visionOS), SwiftUI declarative interfaces, server-side Swift (Vapor).',
  typingSystem: 'Static, Strong with type inference, Optionals, and Protocol-Oriented generics',
  executionModel: 'Compiled directly to native machine code via LLVM with Automatic Reference Counting (ARC)',
  typicalEnvironments: ['iOS / iPadOS Devices', 'macOS / visionOS', 'Xcode IDE', 'Server-Side Linux via Vapor'],
  devPulseSupport: {
    level: 'Lexical & Structural',
    capabilities: [
      'Struct, class, enum, and protocol structural parsing',
      'Cyclomatic branch & guard statement complexity evaluation',
      'Force unwrap (! operator) crash risk heuristics',
      'ARC retain cycle & weak self diagnostic scanning',
    ],
  },
  whyLearn: {
    importance: 'Swift is the exclusive premier native language for the lucrative Apple ecosystem (over 2 billion active devices globally).',
    commonDomains: ['iOS & iPadOS Native Apps', 'macOS Desktop Software', 'watchOS & visionOS Spatial Apps', 'Server-Side Swift (Vapor)'],
    strengths: [
      'SwiftUI provides world-class declarative UI with reactive state bindings',
      'Compile-time safety with Optionals and protocol-oriented architecture',
      'Native compiled performance matching C++ with modern expressive syntax',
      'Structured concurrency with async/await and Actors eliminating data races',
    ],
    weaknesses: [
      'Tooling primarily optimized for macOS/Xcode environments',
      'ABI stability changes across major Apple OS SDK transitions',
    ],
    careerRelevance: 'Essential and highly paid for iOS Developers, Apple Platform Specialists, and Mobile Architects.',
    typicalProjects: ['iOS Consumer Apps (SwiftUI)', 'macOS Productivity Utilities', 'Spatial Computing Apps (visionOS)', 'Server APIs (Vapor)'],
    whenToChoose: ['When developing apps for Apple platforms (iPhone, iPad, Mac, Apple Watch, Apple Vision Pro)'],
    whenToAvoid: ['When building cross-platform Android/Web applications with a single codebase'],
  },
  coreConcepts: [
    { title: 'Optionals & Nil Safety', summary: 'Values must be explicitly wrapped in Optional (T?) to represent absence. Unwrapping requires if let, guard let, or ?.', relevance: 'Prevents null pointer crashes.' },
    { title: 'Protocol-Oriented Programming (POP)', summary: 'Favor composable protocols with default implementations over deep class inheritance hierarchies.', relevance: 'The architectural foundation of Swift and SwiftUI.' },
    { title: 'Automatic Reference Counting (ARC)', summary: 'Memory managed at compile-time by tracking reference counts. Use weak / unowned to break retain cycles.', relevance: 'Zero garbage collection pauses.' },
  ],
  syntaxFundamentals: [
    {
      title: 'Structs, Optionals & Guard Statements',
      concept: 'Value types and early exit guard patterns',
      explanation: 'Structs are copy-on-write value types. Guard statements unwrap optionals or return early.',
      code: `struct CodeSmell {
    let title: String
    let severity: String
}

func evaluateRisk(smell: CodeSmell?) -> String {
    guard let smell = smell else {
        return "Clean"
    }
    return smell.severity == "critical" ? "High Risk" : "Standard"
}

let sample = CodeSmell(title: "SQL Injection", severity: "critical")
print(evaluateRisk(smell: sample))`,
      output: `High Risk`,
      importantNote: 'Prefer struct (value type) over class (reference type) by default in Swift.',
    },
  ],
  dataTypes: {
    summary: 'Swift uses value types (structs) for primitives, strings, arrays, and dictionaries.',
    typingNotes: 'Static typing with full type inference and strong type safety.',
    typesList: [
      { type: 'Int / Double / Bool', description: 'Standard machine value types', example: 'let score: Int = 98', category: 'Primitive' },
      { type: 'String', description: 'Unicode-compliant value type string', example: '"DevPulse"', category: 'Primitive' },
      { type: 'Array<T> / Dictionary<K,V>', description: 'Copy-on-write generic collections', example: '[1, 2, 3]', category: 'Collection' },
      { type: 'Optional<T> (T?)', description: 'Encapsulates either Some(value) or nil', example: 'var name: String?', category: 'Special' },
    ],
  },
  controlFlow: [
    {
      name: 'guard let and if let',
      description: 'Safely unwraps optionals for the remainder of the enclosing scope.',
      code: `guard let file = openFile(path) else {
    print("Failed to open")
    return
}
print("Opened:", file.name)`,
    },
  ],
  functions: [
    {
      title: 'Argument Labels & Closures',
      description: 'Expressive argument labels and trailing closure syntax.',
      code: `func analyze(code: String, using engine: String = "AST") -> Int {
    return code.count
}`,
    },
  ],
  oop: {
    isSupported: true,
    paradigmNotes: 'Protocol-oriented language with structs (value semantics) and classes (reference semantics).',
    concepts: [
      {
        concept: 'Protocols with Extensions',
        description: 'Provide default implementations across all conforming types.',
        code: `protocol Measurable {
    var loc: Int { get }
}
extension Measurable {
    var isLarge: Bool { loc > 300 }
}`,
      },
    ],
  },
  errorHandling: [
    {
      type: 'do / try / catch & throws',
      description: 'Explicit error throwing and handling using Error protocols.',
      mechanism: 'do { try operation() } catch { print(error) }',
      code: `enum AnalysisError: Error { case invalidSyntax }

func runCheck() throws {
    throw AnalysisError.invalidSyntax
}

do {
    try runCheck()
} catch {
    print("Error: \\(error)")
}`,
      debuggingTip: 'Use try? to convert throwing operations into Optionals.',
    },
  ],
  modulesAndPackages: {
    title: 'Swift Package Manager (SPM)',
    importSyntax: 'import SwiftUI / import Vapor',
    exportSyntax: 'public struct Analyzer / internal func check()',
    packageManager: 'Swift Package Manager (Package.swift)',
    packageManagerCommand: 'swift build / swift test',
    standardModules: ['Foundation', 'SwiftUI', 'Combine', 'CryptoKit', 'OSLog'],
    description: 'SPM is built directly into Xcode and the swift command line tool.',
  },
  memoryAndExecution: {
    model: 'Automatic Reference Counting (ARC) with zero garbage collector runtime.',
    allocation: 'Structs allocated on Stack; Classes allocated on Heap.',
    garbageCollection: 'None (ARC decrements ref count on scope exit and frees memory immediately).',
    keyDetails: ['Use weak references ([weak self]) in closures to avoid retain cycles.'],
  },
  concurrency: {
    model: 'Structured Concurrency with async/await, Task, and Actors preventing data races.',
    keyPrimitives: ['async / await', 'actor StateHolder', 'Task.detached', 'AsyncStream'],
    description: 'Actors protect mutable state with compiler-guaranteed thread isolation.',
    code: `actor MetricsStore {
    private var scores: [Int] = []
    func add(score: Int) { scores.append(score) }
}`,
  },
  toolsAndEcosystem: [
    {
      category: 'Frameworks & IDEs',
      tools: [
        { name: 'SwiftUI', description: 'Declarative framework for building modern user interfaces across Apple devices.', type: 'Framework' },
        { name: 'Xcode', description: 'Apple\'s flagship integrated development environment.', type: 'IDE/Editor' },
        { name: 'Vapor', description: 'Server-side web framework written in Swift.', type: 'Framework' },
      ],
    },
  ],
  useCases: [
    { title: 'iOS / iPadOS Native Applications', description: 'Consumer and enterprise iPhone apps with SwiftUI.', popularity: 'Very High', examples: ['Apple Store Apps', 'Fintech iOS Apps'] },
    { title: 'macOS & Spatial Computing', description: 'Desktop software and visionOS spatial applications.', popularity: 'High', examples: ['Apple Vision Pro Apps', 'Mac Utilities'] },
  ],
  bestPractices: [
    {
      title: 'Prefer Structs (Value Types) Over Classes',
      category: 'Maintainability',
      recommendation: 'Structs prevent unintended side-effects and retain cycles across threads.',
      goodCode: `struct UserState { let id: String }`,
      badCode: `class UserState { var id: String; init(id: String) { self.id = id } }`,
    },
  ],
  commonMistakes: [
    {
      mistake: 'Using Force Unwrap (!)',
      whyItMatters: 'Using ! on a nil optional causes an instant fatal runtime crash in production.',
      badSnippet: `let value = optionalString!`,
      betterApproach: 'Use guard let or if let to safely unwrap.',
      fixedSnippet: `guard let value = optionalString else { return }`,
    },
  ],
  securityConsiderations: [
    {
      vulnerability: 'Retain Cycles in Closures',
      riskLevel: 'Medium',
      description: 'Capturing self strongly in asynchronous closures creates memory leaks.',
      vulnerableCode: `network.fetch { [self] data in self.update(data) }`,
      remediation: 'Capture [weak self] in closure capture lists.',
      secureCode: `network.fetch { [weak self] data in self?.update(data) }`,
    },
  ],
  performanceConsiderations: [
    {
      topic: 'Copy-on-Write (COW) Semantics',
      impact: 'Medium',
      description: 'Swift arrays and strings only duplicate their internal memory buffers when mutated.',
      recommendation: 'Passing arrays across functions is virtually free until modified.',
    },
  ],
  roadmap: [
    { stepNumber: 1, title: 'Swift Basics', description: 'let vs var, optionals, control flow, functions, structs.', topics: ['let/var', 'Optionals', 'Structs'], estimatedTime: '1 week' },
    { stepNumber: 2, title: 'Protocols & Generics', description: 'Protocol extensions, generics, closures, enums with associated values.', topics: ['Protocols', 'Closures', 'Enums'], estimatedTime: '2 weeks' },
    { stepNumber: 3, title: 'SwiftUI Fundamentals', description: 'Views, @State, @Binding, @Observable, Lists, Navigation.', topics: ['SwiftUI', '@State', 'View Modifiers'], estimatedTime: '2-3 weeks' },
    { stepNumber: 4, title: 'Swift Concurrency & Actors', description: 'async/await, Actors, Tasks, Structured Concurrency.', topics: ['async/await', 'Actors', 'TaskGroup'], estimatedTime: '2 weeks' },
    { stepNumber: 5, title: 'Full iOS App Architecture', description: 'Clean architecture, networking, persistence (SwiftData), App Store release.', topics: ['SwiftData', 'Networking', 'StoreKit'], estimatedTime: '3-4 weeks' },
  ],
  practiceExercises: [
    {
      id: 'sw-ex-1',
      title: 'Guard Let Optional Unwrapping',
      difficulty: 'Beginner',
      objective: 'Write a function getHealthMessage(score: Int?) -> String returning "Score: X" or "No data".',
      starterCode: `func getHealthMessage(score: Int?) -> String {
    // TODO
    return ""
}`,
      solutionCode: `func getHealthMessage(score: Int?) -> String {
    guard let score = score else {
        return "No data"
    }
    return "Score: \\(score)"
}

print(getHealthMessage(score: 95))
print(getHealthMessage(score: nil))`,
      hints: ['Use guard let score = score else { return "No data" }'],
      sampleOutput: 'Score: 95\nNo data',
    },
  ],
};
