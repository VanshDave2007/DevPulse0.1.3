import { LanguageLearningContent } from '../types';

export const goContent: LanguageLearningContent = {
  id: 'go',
  name: 'Go (Golang)',
  icon: '🐹',
  color: 'text-cyan-500',
  tagline: 'Simple, fast, concurrent compiled language engineered by Google for scalable network services and cloud infrastructure.',
  extensions: ['.go'],
  difficulty: 'Beginner',
  paradigms: ['Concurrent', 'Imperative', 'Procedural', 'Structural Typing (Interfaces)'],
  creator: 'Robert Griesemer, Rob Pike, Ken Thompson (Google)',
  releaseYear: '2009',
  currentPurpose: 'Cloud native infrastructure (Docker, Kubernetes, Terraform, Prometheus), microservices, high-throughput network proxies, CLI tools.',
  typingSystem: 'Static, Strong with structural interface implementation and compile-time type deduction (:=)',
  executionModel: 'Compiled directly to standalone statically linked native binary with embedded lightweight runtime and GC',
  typicalEnvironments: ['Kubernetes / Docker Containers', 'Cloud Microservices', 'Linux Cloud Servers', 'High-Performance CLI Utilities'],
  devPulseSupport: {
    level: 'Lexical & Structural',
    capabilities: [
      'Package & func declaration parsing',
      'Cyclomatic branch & cognitive complexity analysis',
      'Unhandled error (if err != nil) diagnostic heuristics',
      'Goroutine leak & unbuffered channel deadlock detection',
      'Import cycle & dead code identification',
    ],
  },
  whyLearn: {
    importance: 'Go is the lingua franca of cloud infrastructure, DevOps, and backend microservices.',
    commonDomains: ['Cloud Infrastructure (Kubernetes, Docker)', 'Backend Microservices (gRPC / REST)', 'Distributed Systems', 'Developer CLI Tools'],
    strengths: [
      'Extremely small language specification (~25 keywords) that can be mastered in days',
      'First-class concurrency with lightweight goroutines (4KB stack) and channels',
      'Ultra-fast compilation into standalone static binaries with zero external dependencies',
      'Standard library includes production-ready HTTP server, crypto, and JSON packages',
    ],
    weaknesses: [
      'Repetitive error handling boilerplate (if err != nil everywhere)',
      'Simpler type system deliberately lacks inheritance and complex metaprogramming',
      'Garbage collector can introduce minor latency spikes (though typically < 1ms)',
    ],
    careerRelevance: 'Massive demand for Cloud Engineers, Platform Engineers, Site Reliability Engineers (SREs), and Backend Developers.',
    typicalProjects: ['Docker / Kubernetes Operators', 'gRPC Microservices', 'High-Throughput Reverse Proxies', 'Terraform Providers'],
    whenToChoose: ['When building cloud backends, microservices, or CLI developer tools', 'When high concurrency and fast startup time are essential'],
    whenToAvoid: ['When complex generic UI architectures or GUI desktop clients are needed'],
  },
  coreConcepts: [
    { title: 'Goroutines & Channels', summary: 'Spawn concurrent execution using the `go` keyword; communicate safely across threads using typed channels.', relevance: '"Do not communicate by sharing memory; instead, share memory by communicating."' },
    { title: 'Implicit Interfaces', summary: 'A type implements an interface automatically simply by implementing its required methods—no `implements` keyword.', relevance: 'Enables clean decoupling and easy test mocking.' },
    { title: 'Explicit Error Values', summary: 'Errors are normal return values, not invisible runtime exceptions.', relevance: 'Forces developers to handle failure conditions explicitly.' },
  ],
  syntaxFundamentals: [
    {
      title: 'Goroutines & Channel Communication',
      concept: 'Lightweight concurrent processing',
      explanation: 'Channels coordinate data transfer between goroutines without explicit lock mutexes.',
      code: `package main

import (
    "fmt"
    "time"
)

func analyzeService(id int, ch chan<- string) {
    time.Sleep(100 * time.Millisecond)
    ch <- fmt.Sprintf("Service %d: Healthy", id)
}

func main() {
    results := make(chan string, 2)
    go analyzeService(1, results)
    go analyzeService(2, results)

    fmt.Println(<-results)
    fmt.Println(<-results)
}`,
      output: `Service 1: Healthy\nService 2: Healthy`,
      importantNote: 'Always ensure goroutines have a termination path to prevent goroutine memory leaks.',
    },
  ],
  dataTypes: {
    summary: 'Go provides standard machine primitives, structs, slices (dynamic arrays), maps, and channels.',
    typingNotes: 'Static typing. Short variable declaration `:=` infers types inside functions.',
    typesList: [
      { type: 'int / int64 / uint', description: 'Signed/unsigned integers', example: 'var count int = 42', category: 'Primitive' },
      { type: 'string', description: 'Immutable sequence of UTF-8 bytes', example: '"DevPulse"', category: 'Primitive' },
      { type: 'slice ([]T)', description: 'Dynamic window into an underlying contiguous array', example: '[]string{"go", "rust"}', category: 'Collection' },
      { type: 'map[K]V', description: 'Hash map with O(1) average lookup', example: 'map[string]int{"loc": 150}', category: 'Collection' },
      { type: 'struct', description: 'Composite type grouping named fields', example: 'type Smell struct { Title string }', category: 'Composite' },
      { type: 'chan T', description: 'Typed conduit for sending and receiving concurrent messages', example: 'make(chan int)', category: 'Special' },
    ],
  },
  controlFlow: [
    {
      name: 'if with Short Statement Assignment',
      description: 'Initialize a variable scoped strictly to the if/else block.',
      code: `if err := runEngine(); err != nil {
    fmt.Printf("Engine error: %v\\n", err)
    return
}`,
      note: 'The err variable is scoped exclusively to the if block, keeping outer scopes clean.',
    },
  ],
  functions: [
    {
      title: 'Multiple Return Values & Error Handling',
      description: 'Functions routinely return (result, error) tuples.',
      code: `func CalculateHealth(loc int, smells int) (float64, error) {
    if loc <= 0 {
        return 0, fmt.Errorf("loc must be positive, got %d", loc)
    }
    score := 100.0 - float64(smells*5)
    return score, nil
}`,
    },
  ],
  oop: {
    isSupported: false,
    paradigmNotes: 'Go does not have classes or inheritance. It achieves polymorphism through structs, composition (struct embedding), and structural interfaces.',
    concepts: [
      {
        concept: 'Struct Embedding & Interfaces',
        description: 'Compose behaviors by embedding types within structs.',
        code: `type Reader interface {
    Read() []byte
}

type MemoryReader struct {
    Data []byte
}

func (m MemoryReader) Read() []byte {
    return m.Data
}`,
      },
    ],
  },
  errorHandling: [
    {
      type: 'Explicit Error Values & defer',
      description: 'Errors are values; defer schedules cleanup statements to execute before function return.',
      mechanism: 'Explicit if err != nil checks and defer f.Close() for reliable resource cleanup.',
      code: `func processFile(path string) error {
    f, err := os.Open(path)
    if err != nil {
        return fmt.Errorf("failed to open file: %w", err)
    }
    defer f.Close() // Guaranteed to run upon exit!

    // process file...
    return nil
}`,
      debuggingTip: 'Wrap errors with %w using fmt.Errorf to preserve error causality chains with errors.Is().',
    },
  ],
  modulesAndPackages: {
    title: 'Go Modules (go.mod)',
    importSyntax: 'import ("fmt"; "net/http"; "github.com/gin-gonic/gin")',
    exportSyntax: 'Capitalize first letter to export (e.g. func Analyze() vs func internalParse())',
    packageManager: 'Go Modules (go.mod & go.sum built-in)',
    packageManagerCommand: 'go get github.com/gin-gonic/gin / go build',
    standardModules: ['net/http', 'encoding/json', 'fmt', 'os', 'sync', 'context', 'time'],
    description: 'Go has built-in dependency management; packages are identified directly by their Git repository URLs.',
  },
  memoryAndExecution: {
    model: 'Automatic memory management via concurrent non-generational tri-color mark-sweep garbage collector.',
    allocation: 'Compiler uses Escape Analysis to allocate variables on Stack when possible, minimizing Heap GC pressure.',
    garbageCollection: 'Low-latency GC tuned for sub-millisecond pause times in cloud microservices.',
    keyDetails: ['Single self-contained binary contains all dependencies and runtime.'],
  },
  concurrency: {
    model: 'CSP (Communicating Sequential Processes) via Goroutines and Channels.',
    keyPrimitives: ['go func()', 'chan T', 'select {}', 'sync.WaitGroup', 'sync.Mutex'],
    description: 'Use select to wait on multiple channel operations simultaneously.',
    code: `select {
case msg := <-ch:
    fmt.Println("Received:", msg)
case <-time.After(1 * time.Second):
    fmt.Println("Timed out")
}`,
  },
  toolsAndEcosystem: [
    {
      category: 'Build & Quality Tools',
      tools: [
        { name: 'go CLI', description: 'All-in-one compiler, test runner, formatter, and dependency manager.', type: 'Runtime/Build' },
        { name: 'golangci-lint', description: 'Fast, aggregate linter runner for Go code.', type: 'Linter/Formatter' },
        { name: 'Delve', description: 'Full-featured debugger for Go programs.', type: 'Linter/Formatter' },
      ],
    },
  ],
  useCases: [
    { title: 'Cloud Infrastructure & SRE', description: 'Docker, Kubernetes, Terraform, HashiCorp Nomad.', popularity: 'Very High', examples: ['Kubernetes Controllers', 'Caddy Web Server'] },
    { title: 'High-Throughput Microservices', description: 'Low-latency REST and gRPC API backends.', popularity: 'Very High', examples: ['Uber Dispatch APIs', 'Twitch Video Streaming Backend'] },
  ],
  bestPractices: [
    {
      title: 'Always Check and Handle Errors Explicitly',
      category: 'Maintainability',
      recommendation: 'Never ignore errors with _ unless you are strictly certain failure is inconsequential.',
      goodCode: `res, err := compute();\nif err != nil { return fmt.Errorf("calc failed: %w", err) }`,
      badCode: `res, _ := compute(); // Silently ignores failure!`,
    },
  ],
  commonMistakes: [
    {
      mistake: 'Goroutine Leaks via Blocked Channel Sends',
      whyItMatters: 'If a channel has no active receiver, a goroutine attempting to send will block indefinitely, consuming memory.',
      badSnippet: `func leak() {
    ch := make(chan int) // Unbuffered!
    go func() { ch <- 42 }() // Blocks forever if receiver is absent!
}`,
      betterApproach: 'Use buffered channels or context cancellation to allow graceful termination.',
      fixedSnippet: `func safe() {
    ch := make(chan int, 1) // Buffered channel
    go func() { ch <- 42 }()
}`,
    },
  ],
  securityConsiderations: [
    {
      vulnerability: 'Server-Side Request Forgery (SSRF)',
      riskLevel: 'High',
      description: 'Making outbound HTTP requests using untrusted user-supplied URLs allows attackers to probe internal cloud metadata APIs.',
      vulnerableCode: `resp, err := http.Get(userProvidedURL)`,
      remediation: 'Validate and whitelist allowed hostnames and block private/loopback IP ranges (127.0.0.1, 169.254.169.254).',
      secureCode: `if !isAllowedDomain(userProvidedURL) { return errors.New("forbidden") }`,
    },
  ],
  performanceConsiderations: [
    {
      topic: 'Pre-allocate Slice Capacity with make([]T, 0, cap)',
      impact: 'High',
      description: 'Appending to an un-sized slice causes repeated reallocation and memory copies as capacity doubles.',
      recommendation: 'Specify initial capacity when slice size is predictable.',
    },
  ],
  roadmap: [
    { stepNumber: 1, title: 'Go Basics', description: 'Variables, packages, exported identifiers, structs, slices, maps.', topics: ['Basics', 'Slices & Maps', 'Structs'], estimatedTime: '1 week' },
    { stepNumber: 2, title: 'Interfaces & Methods', description: 'Method receivers (pointer vs value), implicit interfaces, type assertions.', topics: ['Interfaces', 'Method Receivers'], estimatedTime: '1 week' },
    { stepNumber: 3, title: 'Goroutines & Channels', description: 'Concurrency, buffered vs unbuffered channels, select statements, sync package.', topics: ['Goroutines', 'Channels', 'select'], estimatedTime: '2 weeks' },
    { stepNumber: 4, title: 'Context & HTTP Services', description: 'context.Context for timeouts and cancellations, standard net/http server.', topics: ['context.Context', 'net/http', 'JSON'], estimatedTime: '2 weeks' },
    { stepNumber: 5, title: 'Cloud Microservices', description: 'Building gRPC services, Docker packaging, unit tests with testing package.', topics: ['gRPC', 'Testing & Benchmarks', 'Docker'], estimatedTime: '3 weeks' },
  ],
  practiceExercises: [
    {
      id: 'go-ex-1',
      title: 'Struct Method & Error Return',
      difficulty: 'Beginner',
      objective: 'Write a struct CodeReport with LOC int and a method IsValid() (bool, error).',
      starterCode: `package main

import "fmt"

// TODO: Define CodeReport and method
func main() {
    // TODO
}`,
      solutionCode: `package main

import "fmt"

type CodeReport struct {
    LOC int
}

func (c CodeReport) IsValid() (bool, error) {
    if c.LOC <= 0 {
        return false, fmt.Errorf("invalid LOC: %d", c.LOC)
    }
    return true, nil
}

func main() {
    report := CodeReport{LOC: 250}
    valid, _ := report.IsValid()
    fmt.Printf("Valid: %v\\n", valid)
}`,
      hints: ['Define func (c CodeReport) IsValid() (bool, error)', 'Return false, fmt.Errorf(...) if LOC <= 0'],
      sampleOutput: 'Valid: true',
    },
  ],
};
