import { LanguageLearningContent } from '../types';

export const kotlinContent: LanguageLearningContent = {
  id: 'kotlin',
  name: 'Kotlin',
  icon: '🎯',
  color: 'text-violet-500',
  tagline: 'Concise, modern, safe language fully interoperable with Java and officially recommended by Google for Android development.',
  extensions: ['.kt', '.kts'],
  difficulty: 'Intermediate',
  paradigms: ['Multi-paradigm', 'Object-Oriented', 'Functional', 'Imperative', 'Concurrent (Coroutines)'],
  creator: 'JetBrains',
  releaseYear: '2011',
  currentPurpose: 'Android mobile apps (Jetpack Compose), cross-platform mobile (Kotlin Multiplatform / KMP), backend services (Ktor, Spring Boot), serverless.',
  typingSystem: 'Static, Strong with built-in null safety (String vs String?), smart casting, and type inference',
  executionModel: 'Compiled to JVM bytecode, Native binaries (Kotlin/Native), or JavaScript (Kotlin/JS)',
  typicalEnvironments: ['Android Runtime (ART)', 'JVM / Spring Boot / Ktor', 'iOS (via Kotlin Multiplatform)', 'Desktop / Compose Multiplatform'],
  devPulseSupport: {
    level: 'Deep AST Parser',
    capabilities: [
      'Data class, companion object, and extension function parsing',
      'Coroutines & suspend function structural analysis',
      'Null pointer bypass (!! operator) detection',
      'Smart cast evaluation and cyclomatic complexity analysis',
    ],
  },
  whyLearn: {
    importance: 'Kotlin is the premier language for modern Android development and is rapidly expanding into cross-platform iOS/Android code sharing.',
    commonDomains: ['Android Mobile Apps (Jetpack Compose)', 'Kotlin Multiplatform (KMP iOS & Android)', 'Modern JVM Backends (Spring Boot / Ktor)', 'Desktop Multiplatform'],
    strengths: [
      'Eliminates NullPointerExceptions at compile time through first-class null safety',
      '100% two-way interoperability with existing Java code and libraries',
      'Extension functions and data classes eliminate vast amounts of boilerplate',
      'Lightweight asynchronous coroutines for structured concurrency',
    ],
    weaknesses: [
      'Compilation speeds can be slightly slower than pure Java',
      'Smaller independent backend community compared to pure Java or Go',
    ],
    careerRelevance: 'The undisputed standard requirement for Android Developers and cross-platform mobile engineers.',
    typicalProjects: ['Android Mobile Apps', 'Kotlin Multiplatform Shared Libraries', 'Ktor Microservices', 'Jetpack Compose UI'],
    whenToChoose: ['When building Android applications or cross-platform mobile logic', 'When upgrading existing Java backend codebases to modern syntax'],
    whenToAvoid: ['When building ultra-low-level bare-metal device drivers'],
  },
  coreConcepts: [
    { title: 'Null Safety in the Type System', summary: 'Types are non-nullable by default. String cannot hold null; String? explicitly allows null with safe call (?.) operators.', relevance: 'Eliminates the "Billion Dollar Mistake" of null pointer crashes.' },
    { title: 'Coroutines & Suspend Functions', summary: 'Lightweight cooperative multitasking for non-blocking I/O without callback hell.', relevance: 'Powers responsive mobile UIs and high-throughput servers.' },
    { title: 'Extension Functions', summary: 'Extend any class with new functions without inheriting or modifying source code.', relevance: 'Produces clean, readable domain APIs.' },
  ],
  syntaxFundamentals: [
    {
      title: 'Data Classes, Null Safety & When',
      concept: 'Modern concise domain modeling',
      explanation: 'Data classes auto-generate equals(), hashCode(), and copy(). When expressions provide exhaustive matching.',
      code: `data class CodeSmell(val title: String, val severity: String, val line: Int)

fun getRiskColor(smell: CodeSmell?): String {
    return when (smell?.severity) {
        "critical" -> "#EF4444"
        "warning" -> "#F59E0B"
        null -> "#10B981"
        else -> "#6B7280"
    }
}

val smell = CodeSmell("SQL Injection", "critical", 42)
println(getRiskColor(smell))`,
      output: `#EF4444`,
      importantNote: 'Avoid using the !! force-unwrap operator; prefer ?. or ?: Elvis operator.',
    },
  ],
  dataTypes: {
    summary: 'Kotlin represents all numbers and primitives as objects with automatic JVM bytecode optimization.',
    typingNotes: 'Non-null types (Int) vs nullable types (Int?).',
    typesList: [
      { type: 'Int / Long / Double', description: 'Standard numeric types', example: 'val count: Int = 42', category: 'Primitive' },
      { type: 'String', description: 'Immutable text sequence with template interpolation ($)', example: '"Hello $name"', category: 'Primitive' },
      { type: 'List<T> vs MutableList<T>', description: 'Explicit distinction between read-only and mutable collections', example: 'listOf(1, 2, 3)', category: 'Collection' },
    ],
  },
  controlFlow: [
    {
      name: 'when Expression',
      description: 'Replaces switch with pattern matching and smart casting.',
      code: `val badge = when (score) {
    in 90..100 -> "Optimal"
    in 70..89 -> "Stable"
    else -> "Critical"
}`,
    },
  ],
  functions: [
    {
      title: 'Extension Functions',
      description: 'Add new methods to existing types cleanly.',
      code: `fun String.isCleanCode(): Boolean = !this.contains("TODO")`,
    },
  ],
  oop: {
    isSupported: true,
    paradigmNotes: 'Clean OOP with primary constructors, interfaces with default methods, sealed classes, and object singletons.',
    concepts: [
      {
        concept: 'Sealed Interfaces for State Modeling',
        description: 'Exhaustively modeled domain state hierarchies.',
        code: `sealed interface AnalysisState {
    data object Loading : AnalysisState
    data class Success(val score: Int) : AnalysisState
    data class Error(val message: String) : AnalysisState
}`,
      },
    ],
  },
  errorHandling: [
    {
      type: 'try / catch as Expression & runCatching',
      description: 'try blocks return values directly; runCatching returns Result<T>.',
      mechanism: 'val result = runCatching { parseCode() }.getOrDefault(defaultVal)',
      code: `val score = try {
    Integer.parseInt("95")
} catch (e: NumberFormatException) {
    0
}`,
      debuggingTip: 'Use runCatching to handle operations in a functional pipeline.',
    },
  ],
  modulesAndPackages: {
    title: 'Gradle & Maven Central',
    importSyntax: 'import kotlinx.coroutines.* / import com.devpulse.engine.Analyzer',
    exportSyntax: 'package com.devpulse.engine at top of file',
    packageManager: 'Gradle (build.gradle.kts)',
    packageManagerCommand: './gradlew build / ./gradlew test',
    standardModules: ['kotlin.collections', 'kotlin.io', 'kotlinx.coroutines', 'kotlinx.serialization'],
    description: 'Gradle with Kotlin DSL is the standard build system for Kotlin projects.',
  },
  memoryAndExecution: {
    model: 'Runs on standard JVM with automatic Garbage Collection or Kotlin/Native reference management.',
    allocation: 'Optimized primitive boxing at JVM bytecode level.',
    garbageCollection: 'Delegated to JVM (ZGC, G1GC) or ARC on Apple targets.',
    keyDetails: ['Inline functions eliminate lambda object allocation overhead.'],
  },
  concurrency: {
    model: 'Kotlin Coroutines with Structured Concurrency (Dispatchers.IO, Dispatchers.Main).',
    keyPrimitives: ['suspend fun', 'launch {}', 'async {}', 'Flow<T>', 'StateFlow'],
    description: 'Coroutines suspend execution without blocking underlying OS threads.',
    code: `import kotlinx.coroutines.*

suspend fun fetchMetric(): Int = withContext(Dispatchers.IO) {
    delay(100)
    98
}`,
  },
  toolsAndEcosystem: [
    {
      category: 'Mobile & Backend Frameworks',
      tools: [
        { name: 'Jetpack Compose', description: 'Modern declarative UI toolkit for Android.', type: 'Framework' },
        { name: 'Ktor', description: 'Asynchronous framework for building microservices and HTTP clients.', type: 'Framework' },
        { name: 'Kotlin Multiplatform', description: 'Share business logic between Android, iOS, Desktop, and Web.', type: 'Framework' },
      ],
    },
  ],
  useCases: [
    { title: 'Android Mobile Apps', description: 'Native Android applications with Jetpack Compose.', popularity: 'Very High', examples: ['Google Play Store Apps', 'FinTech Android Clients'] },
    { title: 'Cross-Platform Mobile (KMP)', description: 'Shared networking, models, and business logic between iOS and Android.', popularity: 'High', examples: ['Netflix Mobile Apps', 'Cash App'] },
  ],
  bestPractices: [
    {
      title: 'Prefer val Over var & Immutable Collections',
      category: 'Maintainability',
      recommendation: 'Use val (read-only) and listOf() by default to prevent unexpected mutations.',
      goodCode: `val smells = listOf("s1", "s2")`,
      badCode: `var smells = mutableListOf("s1", "s2")`,
    },
  ],
  commonMistakes: [
    {
      mistake: 'Abusing the !! Non-Null Assertion Operator',
      whyItMatters: 'Using !! forces unwrapping; if the variable is null, it throws a NullPointerException immediately.',
      badSnippet: `val length = nullableString!!.length`,
      betterApproach: 'Use safe call ?. and the Elvis operator ?:.',
      fixedSnippet: `val length = nullableString?.length ?: 0`,
    },
  ],
  securityConsiderations: [
    {
      vulnerability: 'Insecure Local Storage on Mobile',
      riskLevel: 'High',
      description: 'Storing sensitive auth tokens in unencrypted SharedPreferences.',
      vulnerableCode: `prefs.edit().putString("auth_token", token).apply()`,
      remediation: 'Use Android Jetpack EncryptedSharedPreferences / KeyStore.',
      secureCode: `EncryptedSharedPreferences.create(...).edit().putString("auth_token", token).apply()`,
    },
  ],
  performanceConsiderations: [
    {
      topic: 'Use inline Classes and inline Functions',
      impact: 'High',
      description: 'inline functions eliminate lambda object allocation overhead at call sites.',
      recommendation: 'Use inline for higher-order utility functions.',
    },
  ],
  roadmap: [
    { stepNumber: 1, title: 'Kotlin Basics', description: 'Variables (val/var), null safety, when, functions, strings.', topics: ['val vs var', 'Null Safety', 'when Expression'], estimatedTime: '1 week' },
    { stepNumber: 2, title: 'OOP & Data Classes', description: 'Data classes, sealed interfaces, extension functions, companion objects.', topics: ['Data Classes', 'Extension Functions', 'Sealed Interfaces'], estimatedTime: '1-2 weeks' },
    { stepNumber: 3, title: 'Coroutines & Flow', description: 'suspend functions, Dispatchers, structured concurrency, Flow.', topics: ['Coroutines', 'suspend', 'StateFlow'], estimatedTime: '2 weeks' },
    { stepNumber: 4, title: 'Jetpack Compose / Ktor', description: 'Declarative UI on Android or async microservices with Ktor.', topics: ['Compose UI', 'Ktor Server', 'Dependency Injection'], estimatedTime: '3-4 weeks' },
  ],
  practiceExercises: [
    {
      id: 'kt-ex-1',
      title: 'Safe Null Length Calculation',
      difficulty: 'Beginner',
      objective: 'Write a function safeLength(str: String?): Int that returns str.length or 0 if null.',
      starterCode: `fun safeLength(str: String?): Int {
    // TODO
    return 0
}`,
      solutionCode: `fun safeLength(str: String?): Int {
    return str?.length ?: 0
}

fun main() {
    println(safeLength("DevPulse"))
    println(safeLength(null))
}`,
      hints: ['Use str?.length ?: 0'],
      sampleOutput: '8\n0',
    },
  ],
};
