import { LanguageLearningContent } from '../types';

export const javaContent: LanguageLearningContent = {
  id: 'java',
  name: 'Java',
  icon: '☕',
  color: 'text-orange-500',
  tagline: 'Robust, class-based, object-oriented language designed with the "Write Once, Run Anywhere" JVM philosophy.',
  extensions: ['.java', '.jar', '.class'],
  difficulty: 'Intermediate',
  paradigms: ['Object-Oriented', 'Class-Based', 'Structured', 'Imperative', 'Generic'],
  creator: 'James Gosling (Sun Microsystems)',
  releaseYear: '1995',
  currentPurpose: 'Enterprise enterprise backends (Spring Boot), Android development, big data infrastructure (Hadoop/Spark), financial platforms.',
  typingSystem: 'Static, Strong, Nominal typing with generic type erasure and primitive/wrapper dichotomy',
  executionModel: 'Compiled to bytecode (.class), executed via JVM (Java Virtual Machine) with HotSpot JIT (C1/C2 compilers)',
  typicalEnvironments: ['OpenJDK / Oracle JDK', 'Spring Boot Microservices', 'Android Runtime (ART)', 'Apache Spark Clusters'],
  devPulseSupport: {
    level: 'Deep AST Parser',
    capabilities: [
      'Class, interface, and inheritance tree parsing',
      'Method cyclomatic complexity & cognitive metrics',
      'Null pointer exception risk heuristics',
      'Resource leak detection (try-with-resources verification)',
      'God Class and Feature Envy smell analysis',
    ],
  },
  whyLearn: {
    importance: 'Java powers over 80% of Fortune 500 backend enterprise systems, large banking infrastructure, and Android apps.',
    commonDomains: ['Enterprise Microservices (Spring Boot)', 'High-Throughput Financial Systems', 'Android Mobile Apps', 'Big Data Engineering (Spark/Kafka)'],
    strengths: [
      'Unmatched enterprise stability, backward compatibility, and LTS ecosystem',
      'World-class garbage collectors (ZGC, G1GC, Shenandoah) handling multi-terabyte heaps',
      'Extremely mature profiling and debugging tools (JProfiler, VisualVM, Flight Recorder)',
      'Massive global developer job market with high enterprise compensation',
    ],
    weaknesses: [
      'Historically verbose boilerplate (greatly improved with Records, var, and modern Java 17-21)',
      'Higher memory footprint per JVM instance compared to Go or Rust',
      'Cold startup times for serverless containers (mitigated by GraalVM Native Image)',
    ],
    careerRelevance: 'Top tier requirement for Enterprise Backend Engineers, Distributed Systems Architects, and Android Developers.',
    typicalProjects: ['Spring Boot REST APIs', 'Kafka Stream Processors', 'Android Mobile Apps', 'Distributed Payment Gateways'],
    whenToChoose: ['When building mission-critical enterprise systems requiring long-term 10-year maintainability', 'When high-throughput multi-threaded backends are needed'],
    whenToAvoid: ['When writing lightweight CLI utilities requiring instant zero-memory cold-boot startup'],
  },
  coreConcepts: [
    { title: 'The Java Virtual Machine (JVM)', summary: 'Java source code is compiled into bytecode (.class) which the JVM executes and JIT-compiles into native machine code at runtime.', relevance: 'Guarantees cross-platform portability.' },
    { title: 'Strict OOP & Nominal Typing', summary: 'Every piece of executable code must live inside a class. Types are checked by name rather than shape.', relevance: 'Enforces rigid architectural modularity.' },
    { title: 'Garbage Collection & Memory Management', summary: 'Automatic memory reclamation using generational and concurrent collectors.', relevance: 'Prevents manual memory allocation bugs like use-after-free.' },
  ],
  syntaxFundamentals: [
    {
      title: 'Class Declaration & Main Method',
      concept: 'Standard application entry point',
      explanation: 'Every Java program begins execution at public static void main(String[] args). Modern Java (21+) also supports simplified instance mains.',
      code: `public class CodeHealthReporter {
    public static void main(String[] args) {
        String project = "DevPulse";
        int score = 94;
        System.out.println("Project " + project + " has score: " + score);
    }
}`,
      output: `Project DevPulse has score: 94`,
      importantNote: 'The public class name must match the .java file name exactly.',
      category: 'Basics',
    },
    {
      title: 'Modern Java Records (Java 14+)',
      concept: 'Immutable data carrier classes',
      explanation: 'Records generate constructors, getters, equals(), hashCode(), and toString() automatically in a single line.',
      code: `public record CodeSmell(String title, int line, String severity) {}

// Usage:
CodeSmell smell = new CodeSmell("Unused Import", 14, "warning");
System.out.println(smell.title() + " on line " + smell.line());`,
      output: `Unused Import on line 14`,
      importantNote: 'Use records for DTOs and value objects instead of verbose POJOs with manual getters/setters.',
      category: 'Data Structures',
    },
  ],
  dataTypes: {
    summary: 'Java divides data types into 8 primitives (stored on the Stack) and reference types (stored on the Heap).',
    typingNotes: 'Autoboxing automatically converts between primitives (int) and their wrapper objects (Integer).',
    typesList: [
      { type: 'byte / short / int / long', description: 'Signed whole numbers (8, 16, 32, 64-bit)', example: '42, 100000L', category: 'Primitive' },
      { type: 'float / double', description: 'IEEE 754 floating point numbers (32, 64-bit)', example: '3.14f, 3.14159', category: 'Primitive' },
      { type: 'boolean', description: 'Logical true or false', example: 'true / false', category: 'Primitive' },
      { type: 'char', description: '16-bit Unicode character', example: "'A', '\\u0041'", category: 'Primitive' },
      { type: 'String', description: 'Immutable sequence of characters (Heap object)', example: '"DevPulse"', category: 'Composite' },
      { type: 'List<T> / Map<K,V>', description: 'Java Collections Framework generic interfaces', example: 'List.of("a", "b")', category: 'Collection' },
    ],
  },
  controlFlow: [
    {
      name: 'Modern switch Expressions (Java 17+)',
      description: 'Pattern matching and arrow syntax switch expressions returning values directly.',
      code: `String severity = "critical";
int priority = switch (severity) {
    case "critical" -> 1;
    case "warning" -> 2;
    case "info" -> 3;
    default -> 4;
};`,
      note: 'Arrow switch syntax does not require break statements and prevents accidental fall-through bugs.',
    },
  ],
  functions: [
    {
      title: 'Methods & Lambda Expressions',
      description: 'Methods with access modifiers, typed parameters, and Streams API with lambdas.',
      code: `import java.util.List;

public class MetricUtils {
    public static List<String> getCriticalNames(List<CodeSmell> smells) {
        return smells.stream()
            .filter(s -> "critical".equals(s.severity()))
            .map(CodeSmell::title)
            .toList();
    }
}`,
    },
  ],
  oop: {
    isSupported: true,
    paradigmNotes: 'Java enforces strict object-oriented paradigms including interfaces, abstract classes, encapsulation, and polymorphism.',
    concepts: [
      {
        concept: 'Interfaces & Sealed Classes (Java 17)',
        description: 'Define contracts and restrict which classes can implement them.',
        code: `public sealed interface AnalysisEngine permits ASTEngine, HeuristicEngine {
    int evaluate(String source);
}

public final class ASTEngine implements AnalysisEngine {
    public int evaluate(String source) { return source.length(); }
}

public final class HeuristicEngine implements AnalysisEngine {
    public int evaluate(String source) { return 100; }
}`,
        note: 'Sealed classes allow compiler-enforced exhaustive pattern matching.',
      },
    ],
  },
  errorHandling: [
    {
      type: 'try-with-resources & Checked vs Unchecked Exceptions',
      description: 'Automatic resource management for AutoCloseable objects preventing connection leaks.',
      mechanism: 'Explicit try (Resource r = ...) syntax guarantees cleanup.',
      code: `import java.io.*;

public class ConfigLoader {
    public static String readFile(String path) throws IOException {
        try (BufferedReader reader = new BufferedReader(new FileReader(path))) {
            return reader.readLine();
        } // reader is automatically closed here safely!
    }
}`,
      debuggingTip: 'Always use try-with-resources for streams, database connections, and sockets.',
    },
  ],
  modulesAndPackages: {
    title: 'Java Packages, Modules (JPMS) & Maven/Gradle',
    importSyntax: 'import java.util.List; / import com.devpulse.analyzer.*;',
    exportSyntax: 'package com.devpulse.engine; in source files; module-info.java for JPMS',
    packageManager: 'Maven (pom.xml) / Gradle (build.gradle.kts)',
    packageManagerCommand: 'mvn clean install / gradle build',
    standardModules: ['java.base', 'java.sql', 'java.net.http', 'java.logging'],
    description: 'Maven and Gradle manage dependencies from Central Repository with semantic versioning.',
  },
  memoryAndExecution: {
    model: 'JVM Memory layout: Heap (Young Generation Eden/Survivor, Old Generation) + Metaspace + Thread Stacks.',
    allocation: 'Objects allocated on Heap; references and primitive variables stored on Thread Stacks.',
    garbageCollection: 'Modern ZGC (sub-millisecond pause times) and G1GC (default since Java 9).',
    keyDetails: ['Escape analysis enables scalar replacement on stack for short-lived objects.'],
  },
  concurrency: {
    model: 'Virtual Threads (Project Loom, Java 21) enabling millions of lightweight threads on a single JVM instance.',
    keyPrimitives: ['Thread.ofVirtual().start()', 'CompletableFuture<T>', 'ExecutorService', 'ReentrantLock'],
    description: 'Virtual Threads eliminate the memory overhead of OS-bound carrier threads for I/O operations.',
    code: `import java.util.concurrent.Executors;

try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    executor.submit(() -> {
        System.out.println("Running on virtual thread: " + Thread.currentThread());
    });
}`,
  },
  toolsAndEcosystem: [
    {
      category: 'Build Systems & Frameworks',
      tools: [
        { name: 'Spring Boot', description: 'Industry-standard enterprise framework for production microservices.', type: 'Framework' },
        { name: 'Maven', description: 'Declarative XML-based build and dependency manager.', type: 'Runtime/Build' },
        { name: 'Gradle', description: 'High-performance Kotlin/Groovy DSL build automation system.', type: 'Runtime/Build' },
      ],
    },
    {
      category: 'Testing & Quality',
      tools: [
        { name: 'JUnit 5', description: 'The standard modern unit testing framework for the JVM.', type: 'Testing' },
        { name: 'Mockito', description: 'Mocking framework for unit tests.', type: 'Testing' },
        { name: 'SpotBugs / Checkstyle', description: 'Static analysis tools for Java code quality.', type: 'Linter/Formatter' },
      ],
    },
  ],
  useCases: [
    { title: 'Enterprise Backend Microservices', description: 'High-scale financial transaction systems, inventory backends, and cloud microservices.', popularity: 'Very High', examples: ['Banking APIs', 'Spring Cloud Services', 'E-commerce Backends'] },
    { title: 'Big Data Processing', description: 'Distributed pipelines and message brokers.', popularity: 'Very High', examples: ['Apache Kafka', 'Apache Spark', 'Apache Flink'] },
  ],
  bestPractices: [
    {
      title: 'Always Use try-with-resources for I/O Streams',
      category: 'Security',
      recommendation: 'Manual close() calls in finally blocks risk leaking descriptors if an exception occurs during close.',
      goodCode: `try (var is = new FileInputStream(file)) { process(is); }`,
      badCode: `FileInputStream is = new FileInputStream(file);\ntry { process(is); } finally { is.close(); }`,
    },
  ],
  commonMistakes: [
    {
      mistake: 'Comparing Strings with == Instead of .equals()',
      whyItMatters: '== compares memory references. Two identical string contents in different heap objects will return false.',
      badSnippet: `if (userInput == "admin") { grantAccess(); }`,
      betterApproach: 'Use .equals() or "admin".equals(userInput) (avoids NullPointerException).',
      fixedSnippet: `if ("admin".equals(userInput)) { grantAccess(); }`,
    },
  ],
  securityConsiderations: [
    {
      vulnerability: 'Unsafe Object Deserialization',
      riskLevel: 'Critical',
      description: 'Using standard ObjectInputStream on untrusted bytes allows Remote Code Execution (RCE) via gadget chains.',
      vulnerableCode: `ObjectInputStream ois = new ObjectInputStream(untrustedStream);\nObject obj = ois.readObject();`,
      remediation: 'Avoid Java native serialization. Use JSON (Jackson) with safe typing or Protocol Buffers.',
      secureCode: `ObjectMapper mapper = new ObjectMapper();\nUserDTO user = mapper.readValue(untrustedStream, UserDTO.class);`,
    },
  ],
  performanceConsiderations: [
    {
      topic: 'Use StringBuilder for String Concatenation in Loops',
      impact: 'High',
      description: 'Using + in loops creates a new String object on every iteration, leading to O(N^2) allocations.',
      recommendation: 'Instantiate a StringBuilder and call .append().',
    },
  ],
  roadmap: [
    { stepNumber: 1, title: 'Basics & Syntax', description: 'Classes, methods, primitives, operators, conditionals, loops.', topics: ['Classes', 'Primitives', 'Control Flow'], estimatedTime: '1-2 weeks' },
    { stepNumber: 2, title: 'OOP & Interfaces', description: 'Inheritance, abstract classes, interfaces, records, sealed types.', topics: ['Inheritance', 'Interfaces', 'Records'], estimatedTime: '2 weeks' },
    { stepNumber: 3, title: 'Collections & Generics', description: 'List, Map, Set, generic classes, Lambdas, Streams API.', topics: ['Collections Framework', 'Streams', 'Lambdas'], estimatedTime: '2 weeks' },
    { stepNumber: 4, title: 'Exceptions & File I/O', description: 'try-with-resources, checked vs unchecked exceptions, NIO.2.', topics: ['Exceptions', 'try-with-resources', 'NIO'], estimatedTime: '1-2 weeks' },
    { stepNumber: 5, title: 'Concurrency & Virtual Threads', description: 'Threads, Virtual Threads (Java 21), CompletableFuture.', topics: ['Virtual Threads', 'Executors', 'Locks'], estimatedTime: '2 weeks' },
    { stepNumber: 6, title: 'Enterprise Spring Boot', description: 'REST APIs, Dependency Injection, JPA / Hibernate, Docker.', topics: ['Spring Boot', 'Spring Data JPA', 'Security'], estimatedTime: '4+ weeks' },
  ],
  practiceExercises: [
    {
      id: 'java-ex-1',
      title: 'Record-Based Metric Calculation',
      difficulty: 'Beginner',
      objective: 'Create a record CodeFile(String name, int loc) and a static method boolean isLargeFile(CodeFile file) checking if loc > 300.',
      starterCode: `public class Practice {
    // TODO: Define record CodeFile
    // TODO: Define isLargeFile method
}`,
      solutionCode: `public class Practice {
    public record CodeFile(String name, int loc) {}

    public static boolean isLargeFile(CodeFile file) {
        return file.loc() > 300;
    }

    public static void main(String[] args) {
        CodeFile f = new CodeFile("Engine.java", 450);
        System.out.println("Is large: " + isLargeFile(f));
    }
}`,
      hints: ['Define public record CodeFile(String name, int loc) {}', 'Access loc via file.loc()'],
      sampleOutput: 'Is large: true',
    },
  ],
};
