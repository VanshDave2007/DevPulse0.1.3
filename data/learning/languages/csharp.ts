import { LanguageLearningContent } from '../types';

export const csharpContent: LanguageLearningContent = {
  id: 'csharp',
  name: 'C# (.NET)',
  icon: '🟣',
  color: 'text-purple-500',
  tagline: 'Modern, type-safe, object-oriented language developed by Microsoft for enterprise services, cross-platform cloud backends, and Unity games.',
  extensions: ['.cs'],
  difficulty: 'Intermediate',
  paradigms: ['Multi-paradigm', 'Object-Oriented', 'Component-Oriented', 'Functional', 'Generic'],
  creator: 'Anders Hejlsberg (Microsoft)',
  releaseYear: '2000',
  currentPurpose: 'Cloud web APIs (ASP.NET Core), enterprise systems, 2D/3D game development (Unity / Godot), cross-platform desktop & mobile (MAUI).',
  typingSystem: 'Static, Strong, Nominal typing with LINQ, nullable reference types, and pattern matching',
  executionModel: 'Compiled to Common Intermediate Language (CIL) executed on .NET CLR (Common Language Runtime) with tiered JIT compilation',
  typicalEnvironments: ['.NET 8 / 9 SDK', 'ASP.NET Core Web APIs', 'Unity Game Engine', 'Azure Cloud Services', 'Cross-Platform Linux / macOS / Windows'],
  devPulseSupport: {
    level: 'Lexical & Structural',
    capabilities: [
      'Namespace, class, and method structural parsing',
      'Cyclomatic branch & cognitive complexity analysis',
      'LINQ query complexity and memory allocation heuristics',
      'Nullable reference type violation warnings',
      'Async/await deadlock (GetAwaiter().GetResult()) detection',
    ],
  },
  whyLearn: {
    importance: 'C# and .NET provide one of the most high-performance, developer-friendly enterprise ecosystems in software engineering.',
    commonDomains: ['Enterprise Web APIs (ASP.NET Core)', 'Game Development (Unity Engine)', 'Cloud Native Services (Azure)', 'Cross-Platform Enterprise Apps'],
    strengths: [
      'Extremely high performance (ASP.NET Core ranks near the top of TechEmpower benchmarks)',
      'Language Integrated Query (LINQ) enables expressive declarative data operations',
      'Unified modern ecosystem (.NET 8/9 is fully open-source and cross-platform on Linux/Mac/Windows)',
      'First-class tooling with Visual Studio, VS Code, and JetBrains Rider',
    ],
    weaknesses: [
      'Historically tied to Windows (though modern .NET is 100% Linux cross-platform)',
      'Rich feature set requires time to master modern C# 11-13 idiom features',
    ],
    careerRelevance: 'Massive demand across enterprise software, healthcare, finance, cloud platforms, and the global gaming industry.',
    typicalProjects: ['ASP.NET Core Microservices', 'Unity 3D Games', 'Azure Event-Driven Functions', 'Entity Framework Core Data Backends'],
    whenToChoose: ['When building enterprise cloud backends or Unity games', 'When type safety and high performance are both required'],
    whenToAvoid: ['When building ultra-low-level bare-metal hardware drivers without a runtime'],
  },
  coreConcepts: [
    { title: 'LINQ (Language Integrated Query)', summary: 'Native language syntax for querying, filtering, and projecting sequences from collections, SQL databases, and XML.', relevance: 'Eliminates imperative loop boilerplate with high efficiency.' },
    { title: 'Nullable Reference Types', summary: 'Compile-time enforcement distinguishing between `string` (cannot be null) and `string?` (can be null).', relevance: 'Dramatically reduces NullReferenceException runtime crashes.' },
    { title: 'Async/Await & Task Parallel Library (TPL)', summary: 'Seamless non-blocking asynchronous programming model integrated deeply into the CLR.', relevance: 'Enables massive I/O concurrency without thread starvation.' },
  ],
  syntaxFundamentals: [
    {
      title: 'Top-Level Statements & Records',
      concept: 'Minimalist entry points and immutable records',
      explanation: 'Modern C# allows clean top-level programs and concise positional records.',
      code: `using System;

var analyzer = new CodeAnalyzer("DevPulse C# Engine");
Console.WriteLine(analyzer.GetSummary());

public record CodeAnalyzer(string Name)
{
    public string GetSummary() => $"Analyzer: {Name} (Active)";
}`,
      output: `Analyzer: DevPulse C# Engine (Active)`,
      importantNote: 'Positional records generate value-based equality and with-expressions automatically.',
    },
    {
      title: 'LINQ Expressions',
      concept: 'Declarative collection transformations',
      explanation: 'Filter and project collections cleanly using LINQ extension methods.',
      code: `using System.Linq;

var smells = new[] {
    new { Title = "SQL Injection", Severity = "critical" },
    new { Title = "Unused Var", Severity = "info" },
    new { Title = "Hardcoded Secret", Severity = "critical" }
};

var criticalCount = smells.Count(s => s.Severity == "critical");
Console.WriteLine($"Critical Smells: {criticalCount}");`,
      output: `Critical Smells: 2`,
      importantNote: 'Use LINQ extension methods (.Where, .Select) over query syntax for concise code.',
    },
  ],
  dataTypes: {
    summary: 'C# divides types into Value Types (Stack/in-place: struct, int, enum) and Reference Types (Heap: class, interface, string, delegate).',
    typingNotes: 'Modern C# uses nullable annotations (? suffix) to enforce compile-time null safety.',
    typesList: [
      { type: 'int / long / double / decimal', description: 'Numeric value types (decimal is exact for finance)', example: 'decimal price = 19.99m;', category: 'Primitive' },
      { type: 'string', description: 'Immutable UTF-16 character sequence (Reference type)', example: '"DevPulse"', category: 'Composite' },
      { type: 'List<T> / Dictionary<K,V>', description: 'Generic collections in System.Collections.Generic', example: 'new List<string>()', category: 'Collection' },
      { type: 'record', description: 'Reference type with built-in value equality and non-destructive mutation', example: 'record Metric(int Loc);', category: 'Composite' },
    ],
  },
  controlFlow: [
    {
      name: 'Pattern Matching & Switch Expressions',
      description: 'Concise, expressive pattern matching with property patterns.',
      code: `string GetStatusBadge(int score) => score switch {
    >= 90 => "Optimal",
    >= 70 => "Stable",
    _ => "Critical Risk"
};`,
      note: 'Switch expressions return values directly and require no break statements.',
    },
  ],
  functions: [
    {
      title: 'Async Methods & ValueTask',
      description: 'Asynchronous methods returning Task<T> or allocation-free ValueTask<T>.',
      code: `public async Task<int> FetchHealthScoreAsync(string serviceUrl)
{
    using var client = new HttpClient();
    var response = await client.GetStringAsync(serviceUrl);
    return response.Length;
}`,
    },
  ],
  oop: {
    isSupported: true,
    paradigmNotes: 'Rich object-oriented language supporting classes, interfaces with default implementations, polymorphism, and dependency injection.',
    concepts: [
      {
        concept: 'Dependency Injection & Interfaces',
        description: 'Modern .NET architectures rely on constructor dependency injection.',
        code: `public interface IMetricService { int GetScore(); }

public class MetricService : IMetricService
{
    public int GetScore() => 95;
}`,
      },
    ],
  },
  errorHandling: [
    {
      type: 'try / catch / finally & Exception Filters',
      description: 'Exception filtering with when keyword catches only matching conditions.',
      mechanism: 'try { ... } catch (HttpRequestException e) when (e.StatusCode == HttpStatusCode.NotFound) { ... }',
      code: `try {
    ProcessMetrics();
} catch (Exception ex) when (ex is not FatalException) {
    Console.WriteLine($"Recovered from non-fatal error: {ex.Message}");
}`,
      debuggingTip: 'Use when filters to catch specific error codes without catching and re-throwing.',
    },
  ],
  modulesAndPackages: {
    title: 'NuGet Packages & .csproj',
    importSyntax: 'using System.Text.Json; / global using System.Linq;',
    exportSyntax: 'public class Engine / internal struct Cache;',
    packageManager: 'NuGet (.NET CLI built-in)',
    packageManagerCommand: 'dotnet add package Microsoft.EntityFrameworkCore / dotnet run',
    standardModules: ['System', 'System.Collections.Generic', 'System.Text.Json', 'System.Net.Http', 'System.Threading.Tasks'],
    description: 'The .csproj project file manages NuGet package dependencies and SDK version targets.',
  },
  memoryAndExecution: {
    model: 'Automatic memory management via Generational Garbage Collector (Gen 0, 1, 2, LOH, POH).',
    allocation: 'Value types on Stack; Reference types on Managed Heap. Span<T> and Memory<T> allow zero-allocation memory slicing.',
    garbageCollection: 'High-throughput background server GC tuned for multi-core processors.',
    keyDetails: ['Use using statements / IDisposable to clean up unmanaged handles deterministically.'],
  },
  concurrency: {
    model: 'Thread Pool with async/await and Task Parallel Library (TPL).',
    keyPrimitives: ['Task.WhenAll()', 'Parallel.ForEachAsync()', 'Channel<T>', 'CancellationToken'],
    description: 'Always pass CancellationToken to async methods for graceful cancellation in web servers.',
    code: `await Parallel.ForEachAsync(urls, async (url, token) => {
    await PingAsync(url, token);
});`,
  },
  toolsAndEcosystem: [
    {
      category: 'Frameworks & Tools',
      tools: [
        { name: 'ASP.NET Core', description: 'Cross-platform, high-performance web framework for modern internet-connected services.', type: 'Framework' },
        { name: 'Entity Framework Core', description: 'Modern object-relational mapping (ORM) library for .NET.', type: 'Framework' },
        { name: 'dotnet CLI', description: 'Command-line toolchain for developing, building, and running .NET apps.', type: 'Runtime/Build' },
      ],
    },
  ],
  useCases: [
    { title: 'Enterprise Web APIs', description: 'Scalable microservices running in Docker on Linux with ASP.NET Core.', popularity: 'Very High', examples: ['Banking APIs', 'Microservices Gateways'] },
    { title: 'Game Development', description: 'Scripting and core gameplay logic in Unity and Godot.', popularity: 'Very High', examples: ['Unity 3D/2D Games', 'VR/AR Experiences'] },
  ],
  bestPractices: [
    {
      title: 'Always Use await Rather Than .Result or .Wait()',
      category: 'Performance',
      recommendation: 'Calling .Result or .GetAwaiter().GetResult() blocks the thread pool and can cause deadlocks.',
      goodCode: `var data = await GetDataAsync();`,
      badCode: `var data = GetDataAsync().Result; // Risks thread starvation and deadlock!`,
    },
  ],
  commonMistakes: [
    {
      mistake: 'Blocking Synchronously on Async Code',
      whyItMatters: 'Using .Result on a Task blocks a thread pool thread and can permanently deadlock ASP.NET synchronization contexts.',
      badSnippet: `var score = FetchScoreAsync().Result;`,
      betterApproach: 'Make the calling method async and await the task.',
      fixedSnippet: `var score = await FetchScoreAsync();`,
    },
  ],
  securityConsiderations: [
    {
      vulnerability: 'SQL Injection in EF Core Raw Queries',
      riskLevel: 'Critical',
      description: 'Using string interpolation directly in FromSqlRaw opens SQL injection vulnerabilities.',
      vulnerableCode: `context.Users.FromSqlRaw($"SELECT * FROM Users WHERE Name = '{name}'");`,
      remediation: 'Use FromSqlInterpolated or parameterized FromSqlRaw queries.',
      secureCode: `context.Users.FromSqlInterpolated($"SELECT * FROM Users WHERE Name = {name}");`,
    },
  ],
  performanceConsiderations: [
    {
      topic: 'Use Span<T> and ReadOnlySpan<T> for Zero-Allocation String Slicing',
      impact: 'High',
      description: 'Calling .Substring() creates a new string on the heap; Span<T> slices memory in-place with zero allocations.',
      recommendation: 'Use ReadOnlySpan<char> when parsing high-frequency text streams.',
    },
  ],
  roadmap: [
    { stepNumber: 1, title: 'C# Syntax & Primitives', description: 'Variables, types, control flow, top-level statements, records.', topics: ['Variables', 'Records', 'Control Flow'], estimatedTime: '1-2 weeks' },
    { stepNumber: 2, title: 'OOP & Interfaces', description: 'Classes, interfaces, inheritance, polymorphism, dependency injection.', topics: ['Interfaces', 'DI Pattern', 'Generics'], estimatedTime: '2 weeks' },
    { stepNumber: 3, title: 'LINQ & Collections', description: 'IEnumerable, List, Dictionary, LINQ extension methods, lambdas.', topics: ['LINQ', 'Collections', 'Lambdas'], estimatedTime: '1-2 weeks' },
    { stepNumber: 4, title: 'Async & Multithreading', description: 'Tasks, async/await, CancellationToken, Channels.', topics: ['async/await', 'Task.WhenAll', 'CancellationToken'], estimatedTime: '2 weeks' },
    { stepNumber: 5, title: 'ASP.NET Core & Web APIs', description: 'Controllers, Minimal APIs, EF Core, Middleware, Docker.', topics: ['ASP.NET Core', 'EF Core', 'REST APIs'], estimatedTime: '3-4 weeks' },
  ],
  practiceExercises: [
    {
      id: 'cs-ex-1',
      title: 'Record & Switch Pattern',
      difficulty: 'Beginner',
      objective: 'Write a record CodeSmell(string Title, int SeverityScore) and a function GetRiskLevel(CodeSmell smell) using a switch expression.',
      starterCode: `using System;

// TODO: Define record and function
public class Program {
    public static void Main() {
        // TODO
    }
}`,
      solutionCode: `using System;

public record CodeSmell(string Title, int SeverityScore);

public class Program {
    public static string GetRiskLevel(CodeSmell smell) => smell.SeverityScore switch {
        >= 8 => "High",
        >= 4 => "Medium",
        _ => "Low"
    };

    public static void Main() {
        var smell = new CodeSmell("Unused Variable", 2);
        Console.WriteLine(GetRiskLevel(smell));
    }
}`,
      hints: ['Define public record CodeSmell(string Title, int SeverityScore);', 'Use a switch expression with >= 8, >= 4, and _ default.'],
      sampleOutput: 'Low',
    },
  ],
};
