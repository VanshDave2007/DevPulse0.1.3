import { LanguageLearningContent } from '../types';

export const pythonContent: LanguageLearningContent = {
  id: 'python',
  name: 'Python',
  icon: '🐍',
  color: 'text-amber-500',
  tagline: 'High-level, dynamically typed language emphasizing readable syntax and expressive idioms.',
  extensions: ['.py', '.pyw', '.ipynb'],
  difficulty: 'Beginner',
  paradigms: ['Multi-paradigm', 'Object-Oriented', 'Imperative', 'Functional', 'Reflective'],
  creator: 'Guido van Rossum',
  releaseYear: '1991',
  currentPurpose: 'Data science, Machine Learning/AI, web backends, automation scripts, scientific computing, devops.',
  typingSystem: 'Dynamic, Strong typing with optional type hints (PEP 484)',
  executionModel: 'Interpreted via CPython bytecode runtime with Global Interpreter Lock (GIL) and Just-in-Time (PyPy)',
  typicalEnvironments: ['CPython', 'PyPy', 'Anaconda / Jupyter', 'AWS Lambda / Serverless', 'Linux servers', 'Embedded (MicroPython)'],
  devPulseSupport: {
    level: 'Deep AST Parser',
    capabilities: [
      'AST lexical & indentation hierarchy analysis',
      'Cyclomatic & cognitive complexity evaluation',
      'Docstring and comment ratio measurement',
      'PEP 8 convention & code smell heuristics',
      'Mutable default argument detection',
      'Unused import & dead code diagnosis',
    ],
  },
  whyLearn: {
    importance: 'Python is currently the most popular programming language worldwide for data analysis, artificial intelligence, and rapid prototyping.',
    commonDomains: ['Artificial Intelligence & Deep Learning', 'Backend Web APIs', 'Data Engineering', 'Cybersecurity Scripting', 'Scientific Research'],
    strengths: [
      'Clean, English-like syntax that enforces indentation readability',
      'Massive ecosystem of battle-tested scientific & AI packages (NumPy, PyTorch)',
      'Extremely rapid prototyping and minimal boilerplate',
      'Vast cross-platform community and rich standard library ("batteries included")',
    ],
    weaknesses: [
      'CPU execution speed is slower than compiled languages like C++ or Rust',
      'Global Interpreter Lock (GIL) limits pure multi-core CPU parallelism in standard CPython',
      'Runtime type errors can slip past unless strict static type checking (mypy) is used',
      'High memory overhead per object compared to systems languages',
    ],
    careerRelevance: 'Essential for Data Scientists, Machine Learning Engineers, Automation Engineers, Backend Developers, and Quantitative Researchers.',
    typicalProjects: ['REST APIs with FastAPI / Django', 'Machine Learning Models (PyTorch / TensorFlow)', 'ETL Data Pipelines', 'Web Scrapers (Playwright / BeautifulSoup)', 'DevOps Automation Tools'],
    whenToChoose: [
      'When building AI, Machine Learning, or data analytics software',
      'When speed of developer iteration is prioritized over raw CPU throughput',
      'When creating automation, CLI tools, or web scrapers',
    ],
    whenToAvoid: [
      'When building hard real-time systems or low-latency game engines',
      'When building resource-constrained embedded devices without MicroPython support',
      'When raw single-threaded CPU calculation efficiency is critical without C-extensions',
    ],
  },
  coreConcepts: [
    {
      title: 'Indentation as Syntax',
      summary: 'Python replaces curly braces {} with consistent 4-space whitespace indentation to delimit blocks of code.',
      relevance: 'Enforces uniform visual structure across all codebases.',
    },
    {
      title: 'Everything is an Object',
      summary: 'In Python, all values—including functions, integers, strings, and classes—are first-class objects with attributes and methods.',
      relevance: 'Allows flexible metaprogramming, dynamic inspection, and passing functions as arguments.',
    },
    {
      title: 'Duck Typing ("EAFP")',
      summary: '"If it walks like a duck and quacks like a duck, it is a duck." Python prefers "Easier to Ask for Forgiveness than Permission" using try/except over explicit type checking.',
      relevance: 'Promotes generic, reusable interfaces without rigid class hierarchies.',
    },
    {
      title: 'List & Dict Comprehensions',
      summary: 'Concise expressions to transform, filter, and construct sequences in a single declarative line.',
      relevance: 'Reduces loop boilerplate and runs faster than manual for-loops at the CPython bytecode level.',
    },
  ],
  syntaxFundamentals: [
    {
      title: 'Variables & F-Strings',
      concept: 'Variable assignment and formatted string literals',
      explanation: 'Variables are dynamically bound without type keywords. F-strings allow inline interpolation of expressions.',
      code: `user_name = "Alex"
login_count = 5
print(f"User {user_name} has logged in {login_count} times.")`,
      output: `User Alex has logged in 5 times.`,
      importantNote: 'Variable names should follow snake_case convention according to PEP 8.',
      category: 'Basics',
    },
    {
      title: 'List Comprehension',
      concept: 'Declarative filtering and mapping',
      explanation: 'Construct a new list by applying an expression to each item in an iterable matching a condition.',
      code: `numbers = [1, 2, 3, 4, 5, 6]
evens_squared = [n ** 2 for n in numbers if n % 2 == 0]
print(evens_squared)`,
      output: `[4, 16, 36]`,
      importantNote: 'Keep comprehensions short. If you need multiple lines or side effects, use a standard for-loop instead.',
      category: 'Data Structures',
    },
    {
      title: 'Context Managers (with statement)',
      concept: 'Deterministic resource management',
      explanation: 'The with statement guarantees that cleanup actions (closing files, releasing locks, terminating sessions) occur even if exceptions happen.',
      code: `with open("metrics.log", "w") as f:
    f.write("System status: Optimal\\n")
# File is automatically closed upon exiting the block`,
      output: `(File written safely)`,
      importantNote: 'Always use with open(...) instead of manual f.open() / f.close() to prevent memory/file descriptor leaks.',
      category: 'File I/O',
    },
  ],
  dataTypes: {
    summary: 'Python features built-in primitive and high-level collection types. All types are strongly typed objects.',
    typingNotes: 'Dynamic typing: Variables hold references to objects of any type. Strong typing: Python will not implicitly cast mismatched types (e.g. "5" + 5 raises TypeError).',
    typesList: [
      { type: 'int', description: 'Arbitrary-precision signed whole number', example: '42', category: 'Primitive', isMutable: false },
      { type: 'float', description: '64-bit IEEE 754 floating point number', example: '3.14159', category: 'Primitive', isMutable: false },
      { type: 'str', description: 'Immutable UTF-8 Unicode text sequence', example: '"DevPulse"', category: 'Primitive', isMutable: false },
      { type: 'bool', description: 'Boolean truth value (subclass of int)', example: 'True / False', category: 'Primitive', isMutable: false },
      { type: 'list', description: 'Ordered, mutable, heterogeneous sequence', example: '[1, "two", 3.0]', category: 'Collection', isMutable: true },
      { type: 'tuple', description: 'Ordered, immutable fixed sequence', example: '(10, 20)', category: 'Collection', isMutable: false },
      { type: 'dict', description: 'Key-value hash map with O(1) average lookup', example: '{"host": "localhost", "port": 8080}', category: 'Collection', isMutable: true },
      { type: 'set', description: 'Unordered collection of unique, hashable items', example: '{1, 2, 3}', category: 'Collection', isMutable: true },
      { type: 'NoneType', description: 'Singleton representing the absence of a value', example: 'None', category: 'Special', isMutable: false },
    ],
  },
  controlFlow: [
    {
      name: 'if / elif / else',
      description: 'Conditional execution evaluated based on truthiness.',
      code: `score = 85
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
else:
    grade = "C"`,
      note: 'Values like 0, "", [], {}, None evaluate to False (falsy).',
    },
    {
      name: 'for in loop with enumerate',
      description: 'Iterates over elements in any iterable sequence.',
      code: `languages = ["Python", "Rust", "TypeScript"]
for index, lang in enumerate(languages, start=1):
    print(f"{index}: {lang}")`,
      note: 'Use enumerate() instead of range(len(list)) for clean indexing.',
    },
    {
      name: 'Structural Pattern Matching (match / case)',
      description: 'Introduced in Python 3.10 for powerful destructuring and pattern matching.',
      code: `status = 404
match status:
    case 200:
        print("OK")
    case 404:
        print("Not Found")
    case 500 | 502 | 503:
        print("Server Error")
    case _:
        print("Unknown Status")`,
      note: 'Underscore _ acts as the wildcard default case.',
    },
  ],
  functions: [
    {
      title: 'Function Definition & Type Hints',
      description: 'Functions are declared with def. Type hints (PEP 484) clarify input and output expectations.',
      code: `def calculate_health(loc: int, smells_count: int) -> float:
    """Calculates code health index between 0.0 and 100.0."""
    if loc <= 0:
        return 100.0
    deduction = (smells_count / loc) * 500
    return max(0.0, round(100.0 - deduction, 2))`,
      paramsAndReturn: 'Accepts typed parameters, returns float.',
      hasDefaultParams: true,
      hasLambdas: true,
    },
    {
      title: 'Keyword Arguments & *args, **kwargs',
      description: 'Allows variable number of positional and keyword arguments.',
      code: `def log_event(event_name: str, *tags: str, level: str = "INFO", **metadata: any):
    print(f"[{level}] {event_name} - Tags: {tags} - Meta: {metadata}")

log_event("UserLogin", "auth", "security", level="AUDIT", user_id=402)`,
      hasDefaultParams: true,
    },
  ],
  oop: {
    isSupported: true,
    paradigmNotes: 'Python supports classes, multiple inheritance, operator overloading via dunder methods (__init__, __repr__, __eq__), and encapsulation by convention (leading underscore _protected or double underscore __private).',
    concepts: [
      {
        concept: 'Class & Constructor (__init__)',
        description: 'self explicitly refers to the instance object.',
        code: `class CodeAnalyzer:
    def __init__(self, language: str):
        self.language = language
        self.analyzed_files: list[str] = []

    def analyze(self, file_path: str) -> dict:
        self.analyzed_files.append(file_path)
        return {"file": file_path, "lang": self.language, "status": "Passed"}

analyzer = CodeAnalyzer("Python")
result = analyzer.analyze("main.py")`,
        note: 'Always include self as the first parameter of instance methods.',
      },
      {
        concept: 'Inheritance & super()',
        description: 'Subclasses inherit attributes and methods from base classes.',
        code: `class BaseMetric:
    def __init__(self, name: str):
        self.name = name

    def compute(self, code: str) -> int:
        raise NotImplementedError("Subclasses must implement compute()")

class LineCounter(BaseMetric):
    def __init__(self):
        super().__init__("Lines of Code")

    def compute(self, code: str) -> int:
        return len(code.splitlines())`,
        note: 'Use super().__init__() to ensure parent initialization logic runs.',
      },
    ],
  },
  errorHandling: [
    {
      type: 'try / except / else / finally',
      description: 'Catch and recover from specific exceptions cleanly.',
      mechanism: 'Explicit exception hierarchy derived from BaseException -> Exception.',
      code: `try:
    file = open("config.json", "r")
    data = file.read()
except FileNotFoundError as err:
    print(f"Warning: Config missing ({err}), loading defaults.")
    data = "{}"
except json.JSONDecodeError:
    print("Error: Invalid JSON syntax.")
else:
    print("Config successfully loaded without errors.")
finally:
    print("Execution complete.")`,
      debuggingTip: 'Never use bare except: without specifying the exception type; it catches system exits and KeyboardInterrupt.',
    },
  ],
  modulesAndPackages: {
    title: 'Modules & PyPI Package Ecosystem',
    importSyntax: 'import math / from typing import List, Dict / import numpy as np',
    exportSyntax: '__all__ = ["Analyzer", "parse_ast"] in module __init__.py',
    packageManager: 'pip / poetry / uv',
    packageManagerCommand: 'pip install fastapi uvicorn / uv pip install ...',
    standardModules: ['os', 'sys', 'json', 're', 'pathlib', 'typing', 'asyncio', 'dataclasses', 'collections', 'hashlib'],
    description: 'A Python module is any .py file. A package is a directory containing an __init__.py file.',
  },
  memoryAndExecution: {
    model: 'Automatic reference counting combined with a generational cyclic garbage collector (gc module).',
    allocation: 'CPython uses PyMalloc allocator on top of system heap for small objects (< 512 bytes).',
    garbageCollection: 'Deallocates immediately when reference count drops to 0. Generational GC detects circular references (Generation 0, 1, 2).',
    keyDetails: [
      'Variables are pointer references to heap-allocated PyObject structs.',
      'Small integers (-5 to 256) and short strings are interned/cached globally in memory.',
      'Use sys.getrefcount() or tracemalloc to inspect memory usage.',
    ],
    code: `import sys
a = [1, 2, 3]
b = a  # Ref count increases
print(sys.getrefcount(a))  # Returns current ref count`,
  },
  concurrency: {
    model: 'Asyncio event loop for I/O bound tasks; multiprocessing or C-extensions for CPU bound tasks due to the GIL.',
    keyPrimitives: ['async / await', 'asyncio.gather()', 'threading.Thread', 'multiprocessing.Pool', 'concurrent.futures'],
    description: 'Python asyncio provides cooperative multitasking within a single thread without thread switching overhead.',
    code: `import asyncio

async def fetch_metrics(service_id: int):
    print(f"Fetching service {service_id}...")
    await asyncio.sleep(1.0)  # Non-blocking I/O simulation
    return {"service_id": service_id, "status": "UP"}

async def main():
    results = await asyncio.gather(
        fetch_metrics(1),
        fetch_metrics(2),
        fetch_metrics(3)
    )
    print(results)

asyncio.run(main())`,
  },
  toolsAndEcosystem: [
    {
      category: 'Package Managers & Environments',
      tools: [
        { name: 'pip', description: 'Default package installer for Python Package Index (PyPI).', type: 'Package Manager' },
        { name: 'uv', description: 'Ultra-fast Rust-based Python package manager and resolver.', type: 'Package Manager' },
        { name: 'poetry', description: 'Modern dependency management and packaging tool.', type: 'Package Manager' },
        { name: 'venv', description: 'Built-in virtual environment isolation tool.', type: 'Runtime/Build' },
      ],
    },
    {
      category: 'Popular Frameworks & Libraries',
      tools: [
        { name: 'FastAPI', description: 'High-performance async web framework based on Pydantic & OpenAPI.', type: 'Framework' },
        { name: 'Django', description: 'Full-featured batteries-included web framework for rapid development.', type: 'Framework' },
        { name: 'PyTorch', description: 'Industry-standard deep learning and tensor computation library.', type: 'Framework' },
        { name: 'Pandas', description: 'High-performance data manipulation and analysis library.', type: 'Framework' },
      ],
    },
    {
      category: 'Quality, Testing & Linters',
      tools: [
        { name: 'pytest', description: 'Mature, expressive testing framework with rich fixture support.', type: 'Testing' },
        { name: 'ruff', description: 'Extremely fast Python linter and formatter written in Rust.', type: 'Linter/Formatter' },
        { name: 'mypy', description: 'Static type checker for Python type annotations.', type: 'Linter/Formatter' },
        { name: 'black', description: 'Uncompromising PEP 8 code formatter.', type: 'Linter/Formatter' },
      ],
    },
  ],
  useCases: [
    {
      title: 'Artificial Intelligence & Machine Learning',
      description: 'The dominant standard for computer vision, NLP, generative AI, model training, and LLM orchestration.',
      popularity: 'Very High',
      examples: ['Training transformers with PyTorch', 'Building agentic workflows with LangChain', 'Deploying ONNX models'],
    },
    {
      title: 'Web Backends & Microservices',
      description: 'Developing high-throughput REST and GraphQL APIs with automatic OpenAPI documentation.',
      popularity: 'High',
      examples: ['FastAPI microservices', 'Django eCommerce applications', 'Flask lightweight endpoints'],
    },
    {
      title: 'Data Engineering & Analytics',
      description: 'Transforming, aggregating, and visualizing massive structured and unstructured datasets.',
      popularity: 'Very High',
      examples: ['Apache Airflow ETL DAGs', 'Pandas exploratory analysis', 'Jupyter interactive notebooks'],
    },
  ],
  bestPractices: [
    {
      title: 'Follow PEP 8 Style Conventions',
      category: 'Naming',
      recommendation: 'Use snake_case for functions and variables, PascalCase for classes, and UPPER_CASE for constants.',
      goodCode: `class ASTVisitor:
    MAX_NESTING_DEPTH = 5

    def analyze_node(self, node_id: str) -> bool:
        current_depth = 1
        return current_depth <= self.MAX_NESTING_DEPTH`,
      badCode: `class astVisitor:
    maxNestingDepth = 5
    def AnalyzeNode(self, NodeID):
        currentDepth = 1`,
    },
    {
      title: 'Use Explicit Type Annotations & Dataclasses',
      category: 'Maintainability',
      recommendation: 'Leverage dataclasses and typing to produce self-documenting, type-safe data structures.',
      goodCode: `from dataclasses import dataclass

@dataclass(frozen=True)
class CodeSmellReport:
    title: string
    line: int
    severity: str`,
      badCode: `def create_smell(title, line, severity):
    return {"t": title, "l": line, "s": severity}`,
    },
  ],
  commonMistakes: [
    {
      mistake: 'Using Mutable Default Arguments in Functions',
      whyItMatters: 'Default list or dict arguments are created once when the function is defined, not per call. This causes state to bleed across separate invocations.',
      badSnippet: `def add_issue(issue_title: str, issues_list: list = []):
    issues_list.append(issue_title)
    return issues_list`,
      betterApproach: 'Use None as the default value and initialize a fresh list inside the function body.',
      fixedSnippet: `def add_issue(issue_title: str, issues_list: list | None = None) -> list:
    if issues_list is None:
        issues_list = []
    issues_list.append(issue_title)
    return issues_list`,
    },
    {
      mistake: 'Checking Equality with is Instead of ==',
      whyItMatters: 'is checks for object identity (same memory address), whereas == checks value equality. Using is for integers or strings fails unexpectedly outside the small integer cache.',
      badSnippet: `if user_status is "active":  # Fails unexpectedly in many Python builds
    proceed()`,
      betterApproach: 'Use == for value comparisons; reserve is strictly for singletons like None or True/False.',
      fixedSnippet: `if user_status == "active":
    proceed()
if result is None:
    handle_missing()`,
    },
  ],
  securityConsiderations: [
    {
      vulnerability: 'SQL Injection via String Formatting',
      riskLevel: 'Critical',
      description: 'Formatting unvalidated user input directly into SQL query strings allows malicious query execution.',
      vulnerableCode: `cursor.execute(f"SELECT * FROM users WHERE username = '{user_input}'")`,
      remediation: 'Use parameterized queries / prepared statements so the database driver escapes parameters safely.',
      secureCode: `cursor.execute("SELECT * FROM users WHERE username = %s", (user_input,))`,
    },
    {
      vulnerability: 'Arbitrary Code Execution via Unsafe Deserialization (pickle)',
      riskLevel: 'Critical',
      description: 'The pickle module allows unpickling arbitrary Python objects containing malicious __reduce__ payloads.',
      vulnerableCode: `import pickle
user_data = pickle.loads(raw_untrusted_network_bytes)`,
      remediation: 'Never use pickle on untrusted data. Use structured formats like JSON, MessagePack, or Protocol Buffers.',
      secureCode: `import json
user_data = json.loads(raw_untrusted_network_bytes.decode("utf-8"))`,
    },
  ],
  performanceConsiderations: [
    {
      topic: 'List Comprehensions vs Manual append() Loops',
      impact: 'High',
      description: 'List comprehensions run in optimized C-level loops inside CPython, executing ~25-40% faster than manual .append() calls.',
      recommendation: 'Replace for item in list: out.append(f(item)) with [f(item) for item in list].',
    },
    {
      topic: 'Using Sets for Membership Testing',
      impact: 'High',
      description: 'Checking item in my_list takes O(N) linear time. Checking item in my_set takes O(1) constant time hash lookup.',
      recommendation: 'Convert lists to set() if you perform repeated in membership tests.',
      codeExample: `allowed_roles = {"admin", "editor", "analyst"}
if user_role in allowed_roles:  # O(1) instant lookup
    grant_access()`,
    },
  ],
  roadmap: [
    { stepNumber: 1, title: 'Syntax & Fundamentals', description: 'Variables, dynamic typing, arithmetic, f-strings, PEP 8 conventions.', topics: ['Variables', 'F-Strings', 'Operators', 'PEP 8 Style'], estimatedTime: '1-2 weeks' },
    { stepNumber: 2, title: 'Control Flow & Functions', description: 'Conditionals, for/while loops, def syntax, default params, *args/**kwargs.', topics: ['if/elif/else', 'for with enumerate', 'Functions', 'Scope'], estimatedTime: '1-2 weeks' },
    { stepNumber: 3, title: 'Data Structures & Comprehensions', description: 'Lists, tuples, dictionaries, sets, and list/dict comprehensions.', topics: ['Lists & Slicing', 'Dictionaries', 'Sets', 'Comprehensions'], estimatedTime: '2 weeks' },
    { stepNumber: 4, title: 'OOP & Dunder Methods', description: 'Classes, constructors (__init__), inheritance, encapsulation, and special methods.', topics: ['Classes', 'super()', 'Dunder Methods', 'Dataclasses'], estimatedTime: '2-3 weeks' },
    { stepNumber: 5, title: 'Modules, File I/O & Exceptions', description: 'Context managers with open(), custom exceptions, packages and virtual environments.', topics: ['with statement', 'try/except/finally', 'pip & venv', 'Imports'], estimatedTime: '2 weeks' },
    { stepNumber: 6, title: 'Asynchronous Programming & Testing', description: 'async/await event loop, pytest fixtures, and writing unit tests.', topics: ['asyncio', 'pytest fixtures', 'Type hints with mypy'], estimatedTime: '3 weeks' },
    { stepNumber: 7, title: 'Real-World Projects & Deployment', description: 'Building REST APIs with FastAPI, database integration with SQLAlchemy, Docker packaging.', topics: ['FastAPI', 'SQLAlchemy', 'Docker', 'CI/CD'], estimatedTime: '4+ weeks' },
  ],
  practiceExercises: [
    {
      id: 'py-ex-1',
      title: 'Hello World & Dynamic Formatter',
      difficulty: 'Beginner',
      objective: 'Write a function format_greeting(name, role) that returns a formatted welcoming string.',
      starterCode: `def format_greeting(name: str, role: str) -> str:
    # TODO: return "Welcome [name]! You are logged in as [role]."
    pass`,
      solutionCode: `def format_greeting(name: str, role: str) -> str:
    return f"Welcome {name}! You are logged in as {role}."

print(format_greeting("Alex", "Administrator"))`,
      hints: ['Use an f-string: f"Welcome {name}..."', 'Remember to return the value, not just print it.'],
      sampleOutput: 'Welcome Alex! You are logged in as Administrator.',
    },
    {
      id: 'py-ex-2',
      title: 'Cyclomatic Complexity Filter',
      difficulty: 'Intermediate',
      objective: 'Filter a list of function metrics and return only function names whose cyclomatic complexity exceeds 10.',
      starterCode: `functions = [
    {"name": "parse_ast", "complexity": 14},
    {"name": "init_logger", "complexity": 2},
    {"name": "eval_tree", "complexity": 11}
]

def find_complex_functions(fn_list: list[dict]) -> list[str]:
    # TODO: Return list of names where complexity > 10 using a comprehension
    pass`,
      solutionCode: `functions = [
    {"name": "parse_ast", "complexity": 14},
    {"name": "init_logger", "complexity": 2},
    {"name": "eval_tree", "complexity": 11}
]

def find_complex_functions(fn_list: list[dict]) -> list[str]:
    return [fn["name"] for fn in fn_list if fn.get("complexity", 0) > 10]

print(find_complex_functions(functions))`,
      hints: ['Use a list comprehension: [item["name"] for item in ... if ...]', 'Check if fn["complexity"] > 10.'],
      sampleOutput: "['parse_ast', 'eval_tree']",
    },
  ],
};
