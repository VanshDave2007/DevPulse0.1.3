import { LanguageLearningContent } from '../types';

export const cppContent: LanguageLearningContent = {
  id: 'cpp',
  name: 'C / C++',
  icon: '⚙️',
  color: 'text-sky-500',
  tagline: 'High-performance compiled systems language offering low-level hardware control, zero-cost abstractions, and deterministic memory.',
  extensions: ['.cpp', '.cc', '.cxx', '.h', '.hpp', '.c'],
  difficulty: 'Advanced',
  paradigms: ['Multi-paradigm', 'Procedural', 'Object-Oriented', 'Generic (Templates)', 'Functional'],
  creator: 'Bjarne Stroustrup (C++) / Dennis Ritchie (C)',
  releaseYear: '1985 (C++) / 1972 (C)',
  currentPurpose: 'Game engines (Unreal Engine), operating systems, embedded systems, high-frequency trading (HFT), browser engines (Chromium), AI model runtimes (CUDA/TensorRT).',
  typingSystem: 'Static, Strong, Manifest typing with templates and compile-time type deduction (auto)',
  executionModel: 'Direct compilation to native machine code (x86_64, ARM) via Clang, GCC, or MSVC without VM or runtime overhead',
  typicalEnvironments: ['Bare-metal / Embedded Systems', 'Desktop OS kernels', 'High-Frequency Financial Servers', 'Game Consoles (PlayStation, Xbox)', 'CUDA GPU acceleration'],
  devPulseSupport: {
    level: 'Lexical & Structural',
    capabilities: [
      'Lexical token & brace nesting analysis',
      'Cyclomatic branch & control flow calculation',
      'Pointer arithmetic and raw memory risk heuristics',
      'Include dependency tree & header guard detection',
      'Memory management (raw new/delete vs std::unique_ptr) diagnostics',
    ],
  },
  whyLearn: {
    importance: 'C++ is the foundation of modern computing infrastructure—from OS kernels to high-performance graphics engines.',
    commonDomains: ['Game Engine Development (Unreal Engine)', 'High-Frequency Trading & FinTech', 'Embedded & Autonomous Robotics', 'AI / GPU Acceleration (CUDA)'],
    strengths: [
      'Maximum raw execution speed and predictable hardware-level performance',
      'Zero-cost abstractions—what you don\'t use, you don\'t pay for',
      'Deterministic RAII resource and memory management',
      'Direct low-level memory access and pointer arithmetic',
    ],
    weaknesses: [
      'Manual memory management without Rust-style compile-time borrow checking requires discipline to avoid leaks and buffer overflows',
      'Complex syntax and extensive feature set accumulated over 40 years',
      'Slow compilation times for heavily templated header files',
    ],
    careerRelevance: 'Highest demand and compensation in Game Development, Quantitative Finance, Aerospace, and High-Performance Computing (HPC).',
    typicalProjects: ['3D Game Engines', 'Trading Execution Engines', 'Operating System Drivers', 'Machine Learning Inference Runtimes'],
    whenToChoose: ['When predictable microsecond latency is strictly required', 'When building hardware drivers, kernels, or GPU shaders'],
    whenToAvoid: ['When rapid full-stack web API development is needed where Go or TypeScript is 5x faster to write'],
  },
  coreConcepts: [
    { title: 'RAII (Resource Acquisition Is Initialization)', summary: 'Holding a resource is bound to the lifetime of an object. Destruction releases memory, locks, and file handles automatically.', relevance: 'The core idiom preventing leaks in modern C++.' },
    { title: 'Pointers & References', summary: 'Direct memory addresses (pointers *) vs aliases (references &) providing zero-overhead access.', relevance: 'Underpins all high-performance data manipulation.' },
    { title: 'Smart Pointers (C++11+)', summary: 'std::unique_ptr and std::shared_ptr manage heap lifetimes automatically without manual delete.', relevance: 'Eliminates raw pointer leaks in modern C++.' },
  ],
  syntaxFundamentals: [
    {
      title: 'Modern C++ RAII with std::unique_ptr',
      concept: 'Automatic heap memory lifecycle',
      explanation: 'std::unique_ptr owns a heap object exclusively and frees it automatically when exiting scope.',
      code: `#include <iostream>
#include <memory>

class MetricEngine {
public:
    void compute() { std::cout << "Engine analyzing AST\\n"; }
    ~MetricEngine() { std::cout << "Engine safely destroyed\\n"; }
};

int main() {
    auto engine = std::make_unique<MetricEngine>();
    engine->compute();
    // Destructor runs automatically here!
    return 0;
}`,
      output: `Engine analyzing AST\nEngine safely destroyed`,
      importantNote: 'Always prefer std::make_unique<T>() over raw new and delete.',
    },
  ],
  dataTypes: {
    summary: 'C++ provides direct hardware types, standard library containers (std::vector, std::map), and custom structs/classes.',
    typingNotes: 'Static typing with compile-time auto keyword for type inference.',
    typesList: [
      { type: 'int / long / size_t', description: 'Machine integer types', example: 'int x = 42;', category: 'Primitive' },
      { type: 'float / double', description: 'IEEE floating point numbers', example: 'double pi = 3.14159;', category: 'Primitive' },
      { type: 'std::string', description: 'Standard heap-backed dynamic character buffer', example: '"DevPulse"', category: 'Composite' },
      { type: 'std::vector<T>', description: 'Dynamic contiguous array with O(1) amortized append', example: 'std::vector<int>{1, 2, 3}', category: 'Collection' },
    ],
  },
  controlFlow: [
    {
      name: 'Range-Based For Loop with Const Reference',
      description: 'Zero-copy iteration over container elements.',
      code: `std::vector<std::string> files = {"main.cpp", "engine.cpp"};
for (const auto& file : files) {
    std::cout << file << "\\n";
}`,
      note: 'Using const auto& avoids expensive object copies during loop iterations.',
    },
  ],
  functions: [
    {
      title: 'Pass-by-Reference & Move Semantics',
      description: 'Efficient argument passing without deep copying using rvalue references (&&) and std::move.',
      code: `void processMetric(const std::string& name, std::vector<int>&& data) {
    std::vector<int> internalData = std::move(data); // O(1) pointer swap
}`,
    },
  ],
  oop: {
    isSupported: true,
    paradigmNotes: 'Supports multiple inheritance, virtual functions, abstract classes (pure virtual = 0), and template metaprogramming.',
    concepts: [
      {
        concept: 'Virtual Destructors & Polymorphism',
        description: 'Base classes with virtual functions must have virtual destructors to prevent memory leaks.',
        code: `class Analyzer {
public:
    virtual void analyze() = 0; // Pure virtual
    virtual ~Analyzer() = default; // Essential!
};`,
      },
    ],
  },
  errorHandling: [
    {
      type: 'try / catch & std::expected (C++23)',
      description: 'Exceptions or monadic error handling via std::expected<T, E>.',
      mechanism: 'Stack unwinding during exceptions guarantees RAII destruction of local objects.',
      code: `try {
    if (fileNotFound) throw std::runtime_error("File missing");
} catch (const std::exception& e) {
    std::cerr << "Error: " << e.what() << "\\n";
}`,
      debuggingTip: 'Catch exceptions by const reference (const std::exception& e) to avoid slicing.',
    },
  ],
  modulesAndPackages: {
    title: 'C++ Modules (C++20), CMake & vcpkg/Conan',
    importSyntax: '#include <vector> / import std; (C++20 Modules)',
    exportSyntax: 'export module Engine; export void run();',
    packageManager: 'vcpkg / Conan / CMake FetchContent',
    packageManagerCommand: 'vcpkg install boost fmt',
    standardModules: ['<vector>', '<memory>', '<algorithm>', '<string>', '<thread>', '<chrono>'],
    description: 'CMake is the de facto cross-platform build generator for C and C++ projects.',
  },
  memoryAndExecution: {
    model: 'Direct memory layout: Stack, Heap, Data/BSS segments. Pointers represent physical 64-bit virtual memory addresses.',
    allocation: 'new / malloc, freed via delete / free, or managed deterministically via RAII smart pointers.',
    garbageCollection: 'None (Zero GC pauses). Deterministic destruction when variables leave scope.',
    keyDetails: ['Buffer overflows, dangling pointers, and double frees must be prevented.'],
  },
  concurrency: {
    model: 'Native OS threads via std::thread, std::jthread (C++20 auto-joining), mutexes, and atomics.',
    keyPrimitives: ['std::jthread', 'std::mutex', 'std::lock_guard', 'std::atomic<T>'],
    description: 'Hardware-level atomic operations and lock-free concurrency for ultra-low latency.',
    code: `#include <thread>
#include <atomic>

std::atomic<int> counter{0};
std::jthread t([&]() { counter++; });`,
  },
  toolsAndEcosystem: [
    {
      category: 'Compilers & Build Systems',
      tools: [
        { name: 'CMake', description: 'De facto industry cross-platform build system generator.', type: 'Runtime/Build' },
        { name: 'Clang / LLVM', description: 'Modern modular C++ compiler with exceptional diagnostics.', type: 'Runtime/Build' },
        { name: 'vcpkg / Conan', description: 'C/C++ package managers for open source libraries.', type: 'Package Manager' },
      ],
    },
  ],
  useCases: [
    { title: 'AAA Game Development', description: 'Unreal Engine, custom graphics renderers, physics simulation.', popularity: 'Very High', examples: ['Unreal Engine 5 Games', 'DirectX/Vulkan Engines'] },
    { title: 'High Frequency Finance', description: 'Ultra-low latency microsecond order book routing and arbitrage.', popularity: 'Very High', examples: ['Market Maker Gateways', 'Trading Algorithms'] },
  ],
  bestPractices: [
    {
      title: 'Never Use Raw new and delete',
      category: 'Security',
      recommendation: 'Always use std::unique_ptr or std::shared_ptr to guarantee memory safety.',
      goodCode: `auto ptr = std::make_unique<Buffer>();`,
      badCode: `Buffer* ptr = new Buffer(); // Leaks if exception thrown before delete!`,
    },
  ],
  commonMistakes: [
    {
      mistake: 'Using Dangling Pointers or References to Temporary Stack Objects',
      whyItMatters: 'Stack objects are destroyed when returning from a function; accessing them is undefined behavior and leads to crashes or exploits.',
      badSnippet: `const std::string& getBadString() {
    std::string s = "temporary";
    return s; // Dangling reference!
}`,
      betterApproach: 'Return by value (modern C++ uses return value optimization / move semantics).',
      fixedSnippet: `std::string getSafeString() {
    std::string s = "temporary";
    return s; // Safe move/RVO
}`,
    },
  ],
  securityConsiderations: [
    {
      vulnerability: 'Buffer Overflow via Unbounded Memory Copies',
      riskLevel: 'Critical',
      description: 'Using legacy C functions like strcpy or sprintf without bounds checking causes stack-based buffer overflows.',
      vulnerableCode: `char buffer[16];\nstrcpy(buffer, untrustedInput);`,
      remediation: 'Use std::string, std::string_view, or snprintf with explicit bounds.',
      secureCode: `std::string buffer = untrustedInput;`,
    },
  ],
  performanceConsiderations: [
    {
      topic: 'Pass Heavy Objects by const Reference',
      impact: 'High',
      description: 'Passing std::string or std::vector by value performs a deep heap copy of all elements.',
      recommendation: 'Use const std::string& or std::string_view for read-only arguments.',
    },
  ],
  roadmap: [
    { stepNumber: 1, title: 'Basics & Standard I/O', description: 'Types, pointers, references, control flow, functions.', topics: ['Pointers & References', 'Control Flow', 'std::cout'], estimatedTime: '2 weeks' },
    { stepNumber: 2, title: 'Memory & RAII', description: 'Stack vs Heap, destructors, smart pointers (unique_ptr, shared_ptr).', topics: ['RAII', 'Smart Pointers', 'Lifetimes'], estimatedTime: '2-3 weeks' },
    { stepNumber: 3, title: 'Standard Template Library (STL)', description: 'std::vector, std::map, algorithms, iterators, lambdas.', topics: ['STL Containers', 'Algorithms', 'Lambdas'], estimatedTime: '2 weeks' },
    { stepNumber: 4, title: 'Modern OOP & Move Semantics', description: 'Classes, virtual functions, rvalue references (&&), std::move.', topics: ['Virtual Functions', 'Move Semantics', 'Copy vs Move'], estimatedTime: '3 weeks' },
    { stepNumber: 5, title: 'Templates & Concurrency', description: 'Template metaprogramming, threads, mutexes, atomics, CMake.', topics: ['Templates', 'Threads & Atomics', 'CMake'], estimatedTime: '3-4 weeks' },
  ],
  practiceExercises: [
    {
      id: 'cpp-ex-1',
      title: 'RAII Health Calculator',
      difficulty: 'Intermediate',
      objective: 'Write a class MetricTracker that prints "Allocated" on construction and "Freed" on destruction, managed via unique_ptr.',
      starterCode: `#include <iostream>
#include <memory>

// TODO: Define MetricTracker class
int main() {
    // TODO: Create unique_ptr
    return 0;
}`,
      solutionCode: `#include <iostream>
#include <memory>

class MetricTracker {
public:
    MetricTracker() { std::cout << "Allocated\\n"; }
    ~MetricTracker() { std::cout << "Freed\\n"; }
};

int main() {
    auto tracker = std::make_unique<MetricTracker>();
    return 0;
}`,
      hints: ['Define a constructor and destructor ~MetricTracker()', 'Use std::make_unique<MetricTracker>()'],
      sampleOutput: 'Allocated\nFreed',
    },
  ],
};
