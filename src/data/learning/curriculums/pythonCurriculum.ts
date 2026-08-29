import { LanguageCurriculum } from './types';

export const pythonCurriculum: LanguageCurriculum = {
  languageId: 'python',
  languageName: 'Python',
  icon: '🐍',
  color: 'text-amber-500',
  tagline: 'A comprehensive, mastery-based curriculum from syntax fundamentals to production-grade architecture.',
  totalChapters: 8,
  chapters: [
    {
      id: 'py-ch-1',
      chapterNumber: 1,
      title: 'Foundations & Pythonic Syntax',
      subtitle: 'Master dynamic typing, f-strings, PEP 8 conventions, and core execution semantics.',
      estimatedMinutes: 20,
      difficulty: 'Beginner',
      objectives: [
        'Understand Python dynamic typing and variable assignment semantics.',
        'Use modern f-string interpolation for expressive string formatting.',
        'Apply PEP 8 naming and structural conventions to write clean, readable code.',
        'Diagnose basic lexical syntax errors and understand indentation blocks.'
      ],
      concepts: [
        {
          title: 'Indentation as Block Scope',
          explanation: 'Unlike languages that use braces {}, Python defines code blocks using strict 4-space whitespace indentation. This enforces visual consistency across all projects.',
          codeSnippet: `def greet_user(name: str) -> str:\n    # 4 spaces indentation\n    if not name:\n        return "Hello, anonymous user!"\n    return f"Hello, {name}!"`,
          keyTakeaway: 'Always use 4 spaces per indentation level. Never mix tabs and spaces.'
        },
        {
          title: 'F-Strings (Formatted String Literals)',
          explanation: 'Introduced in Python 3.6 (PEP 498), f-strings evaluate expressions inline at runtime, making string concatenation faster and significantly more readable than % or .format().',
          codeSnippet: `price = 49.99\nquantity = 3\nprint(f"Subtotal: \${price * quantity:.2f} (Items: {quantity})")`,
          keyTakeaway: 'Use f-strings for all formatted text output in modern Python.'
        }
      ],
      examples: [
        {
          title: 'Basic User Profile Formatter',
          explanation: 'Demonstrates type annotation hints, dynamic variable assignment, and f-string formatting.',
          code: `def build_user_card(username: str, role: str, score: float) -> str:
    """Builds a formatted summary card for a platform user."""
    badge = "⭐ Veteran" if score > 80.0 else "🌱 Learner"
    return f"User: {username.capitalize()} | Role: {role.upper()} | Score: {score:.1f} [{badge}]"

# Execution test
print(build_user_card("alex_dev", "maintainer", 94.5))
print(build_user_card("samantha", "contributor", 68.2))`,
          output: `User: Alex_dev | Role: MAINTAINER | Score: 94.5 [⭐ Veteran]
User: Samantha | Role: CONTRIBUTOR | Score: 68.2 [🌱 Learner]`,
          tip: 'Type hints (PEP 484) do not enforce runtime validation by default, but help linters and IDEs catch bugs.'
        }
      ],
      tryIt: {
        id: 'py-try-1',
        title: 'Build a Server Status Reporter',
        task: 'Write a Python function format_server_health(host: str, cpu_usage: float, memory_usage: float) that returns a formatted status string.',
        instructions: [
          'Function must accept host (str), cpu_usage (float), and memory_usage (float).',
          'If cpu_usage > 85.0 or memory_usage > 90.0, status label should be "CRITICAL".',
          'Otherwise, status label should be "OPTIMAL".',
          'Return an f-string in the format: "[STATUS] Host: <host> | CPU: <cpu>% | MEM: <mem>%" where percentages have 1 decimal place.'
        ],
        starterCode: `def format_server_health(host: str, cpu_usage: float, memory_usage: float) -> str:
    # TODO: Determine status (CRITICAL if cpu > 85 or mem > 90, else OPTIMAL)
    # TODO: Return formatted f-string with 1 decimal place precision
    pass

# Test your function
print(format_server_health("prod-node-01", 92.4, 45.1))
print(format_server_health("cache-node-02", 18.0, 34.5))`,
        solutionCode: `def format_server_health(host: str, cpu_usage: float, memory_usage: float) -> str:
    status = "CRITICAL" if (cpu_usage > 85.0 or memory_usage > 90.0) else "OPTIMAL"
    return f"[{status}] Host: {host} | CPU: {cpu_usage:.1f}% | MEM: {memory_usage:.1f}%"

# Test output
print(format_server_health("prod-node-01", 92.4, 45.1))
print(format_server_health("cache-node-02", 18.0, 34.5))`,
        hints: [
          'Use a ternary expression: "CRITICAL" if (condition) else "OPTIMAL"',
          'Use formatting specifier :.1f inside f-strings like {cpu_usage:.1f}%'
        ],
        validationCriteria: [
          'Contains def format_server_health',
          'Evaluates cpu_usage > 85 or memory_usage > 90',
          'Returns formatted f-string containing "[CRITICAL]" and "[OPTIMAL]"'
        ]
      },
      quiz: {
        question: 'Which of the following is the most idiomatic way to format strings in modern Python (3.6+)?',
        options: [
          'f"Hello {name}, your total is ${total:.2f}"',
          '"Hello " + name + ", your total is $" + str(total)',
          '"Hello %s, your total is $%0.2f" % (name, total)',
          '"Hello {}, your total is ${}".format(name, total)'
        ],
        correct: 0,
        explanation: 'F-strings (f"...") provide concise, readable expression interpolation with top runtime performance.'
      }
    },
    {
      id: 'py-ch-2',
      chapterNumber: 2,
      title: 'Control Flow, Branching & Structural Pattern Matching',
      subtitle: 'Design expressive branching logic, avoid excessive cyclomatic complexity, and leverage Python 3.10+ match/case.',
      estimatedMinutes: 25,
      difficulty: 'Beginner',
      objectives: [
        'Master conditional statements (if/elif/else) and truthiness rules in Python.',
        'Use pattern matching (match/case) for clean state and shape dispatching.',
        'Avoid deeply nested conditionals to maintain a low cyclomatic complexity index.',
        'Utilize early guard returns to flatten complex function bodies.'
      ],
      concepts: [
        {
          title: 'Guard Clauses & Early Returns',
          explanation: 'Instead of nesting 5 levels of if statements, check invalid conditions at the top of the function and return immediately. This drastically reduces cognitive complexity.',
          codeSnippet: `def process_transaction(amount: float, balance: float, is_active: bool) -> bool:\n    # Guard clauses\n    if not is_active:\n        return False\n    if amount <= 0:\n        return False\n    if amount > balance:\n        return False\n    # Core business logic stays unindented\n    return True`,
          keyTakeaway: 'Guard clauses keep your main execution path clean and unindented.'
        },
        {
          title: 'Structural Pattern Matching (Python 3.10+)',
          explanation: 'The match/case statement evaluates both value and structural shape, supporting sequence unpacking and type guards.',
          codeSnippet: `def handle_command(cmd: dict) -> str:\n    match cmd:\n        case {"type": "deploy", "env": "prod", "forced": True}:\n            return "Triggering emergency deployment"\n        case {"type": "deploy", "env": env}:\n            return f"Standard deploy to {env}"\n        case {"type": "rollback", "version": v}:\n            return f"Rolling back to version {v}"\n        case _:\n            return "Unknown command"`,
          keyTakeaway: 'Use match/case when routing commands, events, or parsed JSON schemas.'
        }
      ],
      examples: [
        {
          title: 'HTTP Status Code Classifier with Match/Case',
          explanation: 'Classifies status codes into human-readable categories without a massive ladder of if/elif statements.',
          code: `def describe_http_status(status_code: int) -> dict:
    match status_code:
        case 200 | 201 | 204:
            return {"category": "Success", "is_error": False, "retryable": False}
        case 400 | 422:
            return {"category": "Client Error (Bad Request)", "is_error": True, "retryable": False}
        case 401 | 403:
            return {"category": "Auth Failure", "is_error": True, "retryable": False}
        case 429:
            return {"category": "Rate Limited", "is_error": True, "retryable": True}
        case 500 | 502 | 503:
            return {"category": "Server Failure", "is_error": True, "retryable": True}
        case _:
            return {"category": "Unknown Status", "is_error": True, "retryable": False}

print(describe_http_status(200))
print(describe_http_status(429))
print(describe_http_status(503))`,
          output: `{'category': 'Success', 'is_error': False, 'retryable': False}
{'category': 'Rate Limited', 'is_error': True, 'retryable': True}
{'category': 'Server Failure', 'is_error': True, 'retryable': True}`,
          tip: 'Use the pipe operator | inside case patterns to match multiple values in a single branch.'
        }
      ],
      tryIt: {
        id: 'py-try-2',
        title: 'Refactor Nested Ifs into Guard Clauses',
        task: 'Refactor the authorize_access function using guard clauses to reduce cyclomatic nesting and return the correct message.',
        instructions: [
          'If user is None or not user.get("is_active"): return "DENIED: Inactive User"',
          'If user.get("mfa_enabled") is not True: return "DENIED: MFA Required"',
          'If resource not in user.get("allowed_resources", []): return "DENIED: Forbidden Resource"',
          'If all guards pass: return f"AUTHORIZED: Access granted to {resource}"'
        ],
        starterCode: `def authorize_access(user: dict, resource: str) -> str:
    # Refactor using clean early guard clauses:
    if user:
        if user.get("is_active"):
            if user.get("mfa_enabled"):
                if resource in user.get("allowed_resources", []):
                    return f"AUTHORIZED: Access granted to {resource}"
                else:
                    return "DENIED: Forbidden Resource"
            else:
                return "DENIED: MFA Required"
        else:
            return "DENIED: Inactive User"
    else:
        return "DENIED: Inactive User"`,
        solutionCode: `def authorize_access(user: dict, resource: str) -> str:
    if not user or not user.get("is_active"):
        return "DENIED: Inactive User"
    if not user.get("mfa_enabled"):
        return "DENIED: MFA Required"
    if resource not in user.get("allowed_resources", []):
        return "DENIED: Forbidden Resource"
    return f"AUTHORIZED: Access granted to {resource}"`,
        hints: [
          'Check for negative conditions at the top of the function and return immediately.',
          'Notice how much simpler and flatter the function becomes without deep indentation.'
        ],
        validationCriteria: [
          'Uses early returns',
          'Checks user and is_active',
          'Checks mfa_enabled',
          'Returns AUTHORIZED on success'
        ]
      }
    },
    {
      id: 'py-ch-3',
      chapterNumber: 3,
      title: 'Data Structures & Comprehensions',
      subtitle: 'Harness Lists, Dictionaries, Sets, Tuples, and lightning-fast Comprehension pipelines.',
      estimatedMinutes: 30,
      difficulty: 'Beginner',
      objectives: [
        'Distinguish between mutable (list, dict, set) and immutable (tuple, frozenset) collections.',
        'Write concise, declarative list, dict, and set comprehensions.',
        'Use dictionary lookups with default values and dict unpacking (**).',
        'Avoid common performance traps like repeated O(N) list searches.'
      ],
      concepts: [
        {
          title: 'List & Dict Comprehensions',
          explanation: 'Comprehensions provide a compact syntax to map, filter, and construct new collections. Under the hood, CPython optimizes comprehensions to execute faster than manual loop appends.',
          codeSnippet: `raw_scores = {"alice": 85, "bob": 42, "carol": 95, "dave": 59}\n# Filter and normalize in one line:\npassing = {k: v for k, v in raw_scores.items() if v >= 60}`,
          keyTakeaway: 'Use comprehensions when creating a new transformed collection without side effects.'
        },
        {
          title: 'Set Lookups (O(1) vs O(N))',
          explanation: 'Checking "item in list" takes O(N) linear time because Python must inspect every element. Checking "item in set" takes O(1) constant time via hash tables.',
          codeSnippet: `blocked_ips = {"192.168.1.5", "10.0.0.9"} # Set lookup: O(1)\nif incoming_ip in blocked_ips:\n    drop_connection()`,
          keyTakeaway: 'Always convert membership check collections into sets for high performance.'
        }
      ],
      examples: [
        {
          title: 'Data Pipeline: Log Filtering and Aggregation',
          explanation: 'Processes server log entries into summarized metrics using dictionary comprehension and set deduplication.',
          code: `logs = [
    {"user": "u1", "action": "login", "status": 200},
    {"user": "u2", "action": "purchase", "status": 500},
    {"user": "u1", "action": "view_cart", "status": 200},
    {"user": "u3", "action": "login", "status": 401},
    {"user": "u2", "action": "login", "status": 200},
]

# 1. Unique users who logged in successfully
active_users = {entry["user"] for entry in logs if entry["action"] == "login" and entry["status"] == 200}

# 2. Count error logs by status code
error_codes = [entry["status"] for entry in logs if entry["status"] >= 400]
error_summary = {code: error_codes.count(code) for code in set(error_codes)}

print("Active Users:", active_users)
print("Error Summary:", error_summary)`,
          output: `Active Users: {'u2', 'u1'}
Error Summary: {401: 1, 500: 1}`,
          tip: 'Use set comprehensions {x for x in list} to produce a unique set directly.'
        }
      ],
      tryIt: {
        id: 'py-try-3',
        title: 'Filter and Normalize Product Inventory',
        task: 'Write a function filter_in_stock_inventory(products: list) that returns a dict mapping uppercase SKU names to their total value (price * quantity) for items with quantity > 0.',
        instructions: [
          'Input is a list of dicts: [{"sku": "cpu-01", "price": 299.99, "qty": 4}, ...]',
          'Filter for products where "qty" > 0.',
          'Map uppercase SKU (e.g. "CPU-01") to round(price * qty, 2).',
          'Use a single dictionary comprehension.'
        ],
        starterCode: `def filter_in_stock_inventory(products: list[dict]) -> dict[str, float]:
    # TODO: Return dict comprehension mapping SKU.upper() -> round(price * qty, 2)
    # only for items where qty > 0
    pass

# Test data
items = [
    {"sku": "gpu-rtx", "price": 799.00, "qty": 3},
    {"sku": "ram-ddr5", "price": 120.50, "qty": 0},
    {"sku": "nvme-2tb", "price": 180.00, "qty": 5},
]
print(filter_in_stock_inventory(items))`,
        solutionCode: `def filter_in_stock_inventory(products: list[dict]) -> dict[str, float]:
    return {
        p["sku"].upper(): round(p["price"] * p["qty"], 2)
        for p in products
        if p.get("qty", 0) > 0
    }

# Test data
items = [
    {"sku": "gpu-rtx", "price": 799.00, "qty": 3},
    {"sku": "ram-ddr5", "price": 120.50, "qty": 0},
    {"sku": "nvme-2tb", "price": 180.00, "qty": 5},
]
print(filter_in_stock_inventory(items))`,
        hints: [
          'Dict comprehension syntax: {key_expr: val_expr for item in collection if condition}',
          'Use p["sku"].upper() and p["price"] * p["qty"]'
        ],
        validationCriteria: [
          'Returns a dictionary',
          'Filters out quantity 0',
          'Converts SKU to uppercase'
        ]
      }
    },
    {
      id: 'py-ch-4',
      chapterNumber: 4,
      title: 'Functions, Scopes & The Mutable Default Trap',
      subtitle: 'Write robust functions with *args, **kwargs, keyword-only parameters, closures, and decorators.',
      estimatedMinutes: 30,
      difficulty: 'Intermediate',
      objectives: [
        'Understand Python variable lookup order (LEGB: Local, Enclosing, Global, Built-in).',
        'Identify and prevent the classic "Mutable Default Argument" bug.',
        'Use *args for variable positional arguments and **kwargs for keyword arguments.',
        'Build custom function decorators to wrap cross-cutting logic.'
      ],
      concepts: [
        {
          title: 'The Mutable Default Argument Trap',
          explanation: 'In Python, default parameter values are evaluated once when the function is defined, NOT each time it is called. If you use a mutable default like `items=[]`, that list persists across calls!',
          codeSnippet: `# ❌ DANGEROUS CODE SMELL:\ndef add_item(item, basket=[]):\n    basket.append(item)\n    return basket\n\n# ✅ CORRECT IDIOMATIC FIX:\ndef add_item(item, basket=None):\n    if basket is None:\n        basket = []\n    basket.append(item)\n    return basket`,
          keyTakeaway: 'Never use mutable collections (lists, dicts, sets) as default arguments. Use None as sentinel.'
        },
        {
          title: 'Custom Decorators',
          explanation: 'Decorators are higher-order functions that take a function as input and return an enhanced wrapper function. They are widely used in FastAPI, Flask, and logging frameworks.',
          codeSnippet: `import time\n\ndef timer_decorator(func):\n    def wrapper(*args, **kwargs):\n        start = time.perf_counter()\n        result = func(*args, **kwargs)\n        duration = time.perf_counter() - start\n        print(f"[METRIC] {func.__name__} took {duration*1000:.2f}ms")\n        return result\n    return wrapper`,
          keyTakeaway: 'Use decorators to inject telemetry, caching, or authentication guards without modifying function internals.'
        }
      ],
      examples: [
        {
          title: 'Retry Decorator with Exponential Backoff Concept',
          explanation: 'Wraps an unreliable network operation with automated retry logic.',
          code: `def logged_execution(prefix="[AUDIT]"):
    def decorator(func):
        def wrapper(*args, **kwargs):
            print(f"{prefix} Executing {func.__name__} with args={args}")
            try:
                result = func(*args, **kwargs)
                print(f"{prefix} {func.__name__} succeeded.")
                return result
            except Exception as e:
                print(f"{prefix} {func.__name__} failed with error: {e}")
                raise
        return wrapper
    return decorator

@logged_execution(prefix="[DATABASE]")
def fetch_user_by_id(user_id: int):
    if user_id <= 0:
        raise ValueError("Invalid User ID")
    return {"id": user_id, "name": "DevPulse User"}

print(fetch_user_by_id(42))`,
          output: `[DATABASE] Executing fetch_user_by_id with args=(42,)
[DATABASE] fetch_user_by_id succeeded.
{'id': 42, 'name': 'DevPulse User'}`,
          tip: 'Use functools.wraps inside decorators to preserve original function names and docstrings.'
        }
      ],
      tryIt: {
        id: 'py-try-4',
        title: 'Fix the Mutable Default and Add Keyword Guard',
        task: 'Fix the buggy event recorder function and ensure it uses None sentinel with keyword-only argument separator (*).',
        instructions: [
          'Change default argument from tags=[] to tags=None.',
          'Initialize tags = list(tags) if tags is not None else [] inside function.',
          'Add a keyword-only separator (*) before severity to prevent accidental positional misuse: def record_event(name: str, *, tags=None, severity: str = "INFO")',
          'Return a dict with "name", "tags", and "severity".'
        ],
        starterCode: `# ❌ Buggy starter code with mutable default:
def record_event(name: str, tags: list = [], severity: str = "INFO") -> dict:
    tags.append("recorded_at_runtime")
    return {"name": name, "tags": tags, "severity": severity}

# Notice how calling twice mutates the shared default:
print(record_event("login_attempt"))
print(record_event("logout_attempt")) # BUG: has 2 items!`,
        solutionCode: `def record_event(name: str, *, tags: list | None = None, severity: str = "INFO") -> dict:
    resolved_tags = list(tags) if tags is not None else []
    resolved_tags.append("recorded_at_runtime")
    return {"name": name, "tags": resolved_tags, "severity": severity}

print(record_event("login_attempt"))
print(record_event("logout_attempt"))`,
        hints: [
          'Use tags: list | None = None as the default.',
          'Use the * character in the parameter list to enforce keyword-only arguments.'
        ],
        validationCriteria: [
          'No mutable default in parameter list',
          'Contains tags=None or tags: list | None = None',
          'Resolves tags independently per call'
        ]
      }
    },
    {
      id: 'py-ch-5',
      chapterNumber: 5,
      title: 'Object-Oriented Programming & Dataclasses',
      subtitle: 'Construct clean class models, encapsulation, dunder methods (__repr__, __eq__), and modern @dataclass.',
      estimatedMinutes: 35,
      difficulty: 'Intermediate',
      objectives: [
        'Implement clean OOP classes with encapsulation and properties (@property).',
        'Leverage Python special double-underscore ("dunder") methods (__init__, __str__, __repr__, __eq__).',
        'Use standard library dataclasses for boilerplate-free data models.',
        'Understand composition over deep inheritance trees.'
      ],
      concepts: [
        {
          title: 'The Power of @dataclass (PEP 557)',
          explanation: 'Dataclasses automatically generate `__init__`, `__repr__`, `__eq__`, and type annotations without writing repetitive boilerplate code.',
          codeSnippet: `from dataclasses import dataclass, field\n\n@dataclass(frozen=True)\nclass CodeMetric:\n    name: str\n    score: float\n    passed: bool = True\n    tags: tuple = field(default_factory=tuple)\n\nm1 = CodeMetric("Maintainability", 94.2)\nprint(m1) # CodeMetric(name='Maintainability', score=94.2, passed=True, tags=())`,
          keyTakeaway: 'Use @dataclass(frozen=True) to create immutable, hashable, and self-documenting data transfer objects.'
        }
      ],
      examples: [
        {
          title: 'Code Review Ticket Model with Custom Property',
          explanation: 'Demonstrates encapsulation, computed @property getters, and state transitions.',
          code: `class ReviewFinding:
    def __init__(self, title: str, severity: str, line: int):
        self.title = title
        self._severity = severity.upper()
        self.line = line
        self.resolved = False

    @property
    def severity(self) -> str:
        return self._severity

    @property
    def is_blocking(self) -> bool:
        return self._severity in ("CRITICAL", "HIGH") and not self.resolved

    def resolve(self) -> None:
        self.resolved = True

    def __repr__(self) -> str:
        status = "RESOLVED" if self.resolved else "OPEN"
        return f"<ReviewFinding {self.severity} L{self.line}: '{self.title}' [{status}]>"

finding = ReviewFinding("SQL Injection Risk", "CRITICAL", 42)
print(finding)
print("Is Blocking:", finding.is_blocking)
finding.resolve()
print("After Resolve:", finding.is_blocking)`,
          output: `<ReviewFinding CRITICAL L42: 'SQL Injection Risk' [OPEN]>
Is Blocking: True
After Resolve: False`,
          tip: 'Use @property to expose computed attributes without breaking caller interface contracts.'
        }
      ],
      tryIt: {
        id: 'py-try-5',
        title: 'Create an Immutable HealthReport with @dataclass',
        task: 'Implement a dataclass called HealthReport representing code health analysis.',
        instructions: [
          'Import dataclass from dataclasses.',
          'Decorate class with @dataclass(frozen=True).',
          'Fields: file_name (str), maintainability (float), smell_count (int), and passed (bool = True).',
          'Add a method is_grade_a(self) -> bool that returns True if maintainability >= 85.0 and smell_count == 0.'
        ],
        starterCode: `from dataclasses import dataclass

# TODO: Define HealthReport dataclass with frozen=True
# TODO: Add fields and is_grade_a method

# Test code:
report = HealthReport(file_name="parser.py", maintainability=92.0, smell_count=0)
print(report)
print("Grade A?", report.is_grade_a())`,
        solutionCode: `from dataclasses import dataclass

@dataclass(frozen=True)
class HealthReport:
    file_name: str
    maintainability: float
    smell_count: int
    passed: bool = True

    def is_grade_a(self) -> bool:
        return self.maintainability >= 85.0 and self.smell_count == 0

report = HealthReport(file_name="parser.py", maintainability=92.0, smell_count=0)
print(report)
print("Grade A?", report.is_grade_a())`,
        hints: [
          'Decorate with @dataclass(frozen=True)',
          'Fields use standard type hints like file_name: str'
        ],
        validationCriteria: [
          'Uses @dataclass',
          'Has frozen=True',
          'Contains is_grade_a method'
        ]
      }
    },
    {
      id: 'py-ch-6',
      chapterNumber: 6,
      title: 'Error Handling, Custom Exceptions & Context Managers',
      subtitle: 'Build fail-safe applications using try/except/finally, custom exceptions, and the with statement.',
      estimatedMinutes: 25,
      difficulty: 'Intermediate',
      objectives: [
        'Apply the EAFP principle ("Easier to Ask for Forgiveness than Permission") safely.',
        'Create custom domain-specific Exception hierarchies.',
        'Avoid bare "except:" and overly broad "except Exception:" traps.',
        'Build custom context managers using contextlib.contextmanager or class __enter__/__exit__.'
      ],
      concepts: [
        {
          title: 'Custom Exception Hierarchies',
          explanation: 'Defining domain exceptions allows calling code to catch specific errors rather than guessing generic runtime exceptions.',
          codeSnippet: `class DevPulseError(Exception):\n    """Base exception for all DevPulse engine errors."""\n    pass\n\nclass ASTParseError(DevPulseError):\n    """Raised when source code AST fails lexical grammar checks."""\n    def __init__(self, line: int, message: str):\n        super().__init__(f"Line {line}: {message}")\n        self.line = line`,
          keyTakeaway: 'Always inherit custom exceptions from Exception or a common module base class.'
        }
      ],
      examples: [
        {
          title: 'Safe Resource Lock Context Manager',
          explanation: 'Demonstrates a custom context manager guaranteeing release even when errors occur.',
          code: `from contextlib import contextmanager

@contextmanager
def execution_context(module_name: str):
    print(f"--> [ENTER] Initializing telemetry for {module_name}")
    try:
        yield {"module": module_name, "status": "active"}
    except Exception as err:
        print(f"--> [ERROR] Caught during execution: {err}")
        raise
    finally:
        print(f"--> [EXIT] Cleaned up resources for {module_name}")

# Test context manager
with execution_context("AST_Scanner") as ctx:
    print(f"Running scanner on ctx: {ctx['module']}")`,
          output: `--> [ENTER] Initializing telemetry for AST_Scanner
Running scanner on ctx: AST_Scanner
--> [EXIT] Cleaned up resources for AST_Scanner`,
          tip: 'Context managers eliminate resource leaks (files, locks, DB connections) by enforcing finally blocks.'
        }
      ],
      tryIt: {
        id: 'py-try-6',
        title: 'Create a Safe Float Parser with Custom Exception',
        task: 'Write a parse_metric_value(raw: str, min_val: float, max_val: float) -> float function with error handling.',
        instructions: [
          'Create a custom exception class MetricValidationError(ValueError): pass',
          'Convert raw string to float inside a try block. If ValueError occurs, raise MetricValidationError("Invalid numeric literal").',
          'If value < min_val or value > max_val, raise MetricValidationError(f"Out of range [{min_val}, {max_val}]").',
          'Return the valid float value.'
        ],
        starterCode: `class MetricValidationError(ValueError):
    pass

def parse_metric_value(raw: str, min_val: float, max_val: float) -> float:
    # TODO: Parse float safely, validate bounds, and raise MetricValidationError
    pass

# Tests:
print("Valid:", parse_metric_value("85.5", 0.0, 100.0))
# parse_metric_value("abc", 0.0, 100.0) # Should raise MetricValidationError`,
        solutionCode: `class MetricValidationError(ValueError):
    pass

def parse_metric_value(raw: str, min_val: float, max_val: float) -> float:
    try:
        val = float(raw)
    except (ValueError, TypeError):
        raise MetricValidationError("Invalid numeric literal")

    if val < min_val or val > max_val:
        raise MetricValidationError(f"Out of range [{min_val}, {max_val}]")
    return val

print("Valid:", parse_metric_value("85.5", 0.0, 100.0))`,
        hints: [
          'Wrap float(raw) in try/except ValueError',
          'Check val < min_val or val > max_val'
        ],
        validationCriteria: [
          'Contains class MetricValidationError',
          'Catches ValueError on parsing',
          'Validates bounds and returns float'
        ]
      }
    },
    {
      id: 'py-ch-7',
      chapterNumber: 7,
      title: 'Modules, Packaging & Architecture Standards',
      subtitle: 'Organize multi-file projects, configure __init__.py, __all__, and handle dependency imports.',
      estimatedMinutes: 25,
      difficulty: 'Intermediate',
      objectives: [
        'Understand Python sys.path, module discovery, and relative vs absolute imports.',
        'Use `if __name__ == "__main__":` idiom for dual CLI/library support.',
        'Configure `__all__` to explicitly expose public module APIs.',
        'Avoid circular import traps in enterprise project architectures.'
      ],
      concepts: [
        {
          title: 'The Dual Purpose Module Idiom',
          explanation: 'When a Python script is imported, `__name__` equals the module name. When executed directly, `__name__` is `"__main__"`.',
          codeSnippet: `def run_analysis(code: str):\n    return f"Analyzed {len(code)} characters"\n\nif __name__ == "__main__":\n    import sys\n    print(run_analysis("sample code"))`,
          keyTakeaway: 'Place entrypoint logic inside `if __name__ == "__main__":` to allow clean importing without unintended side effects.'
        }
      ],
      examples: [
        {
          title: 'Explicit Public API with __all__',
          explanation: 'Limits what `from module import *` exports, protecting internal helpers.',
          code: `# analyzer_engine.py
__all__ = ["analyze_code_metrics", "MetricResult"]

class MetricResult:
    def __init__(self, score: float):
        self.score = score

def _internal_ast_cleaner(code: str) -> str:
    """Private helper - not in __all__"""
    return code.strip()

def analyze_code_metrics(code: str) -> MetricResult:
    cleaned = _internal_ast_cleaner(code)
    return MetricResult(score=len(cleaned) * 1.5)

print("Exported public symbols:", __all__)`,
          output: `Exported public symbols: ['analyze_code_metrics', 'MetricResult']`,
          tip: 'Prefix internal functions with an underscore _ and maintain __all__ in library roots.'
        }
      ],
      tryIt: {
        id: 'py-try-7',
        title: 'Define a Modular Package Exporter',
        task: 'Define an __all__ export list and build an entrypoint runner.',
        instructions: [
          'Define __all__ = ["EngineConfig", "create_engine"].',
          'Define a class EngineConfig(mode: str, debug: bool = False).',
          'Define a factory function create_engine(mode: str = "ast") -> EngineConfig.',
          'Add if __name__ == "__main__": block that instantiates and prints a default engine.'
        ],
        starterCode: `# TODO: Define __all__
# TODO: Define EngineConfig and create_engine
# TODO: Add __name__ == "__main__" block`,
        solutionCode: `__all__ = ["EngineConfig", "create_engine"]

class EngineConfig:
    def __init__(self, mode: str, debug: bool = False):
        self.mode = mode
        self.debug = debug

    def __repr__(self) -> str:
        return f"<EngineConfig mode={self.mode} debug={self.debug}>"

def create_engine(mode: str = "ast") -> EngineConfig:
    return EngineConfig(mode=mode)

if __name__ == "__main__":
    engine = create_engine()
    print("Default Engine:", engine)`,
        hints: [
          'Set __all__ = ["EngineConfig", "create_engine"] as a top-level list of strings.'
        ],
        validationCriteria: [
          'Defines __all__',
          'Defines EngineConfig class',
          'Defines create_engine function',
          'Has if __name__ == "__main__":'
        ]
      }
    },
    {
      id: 'py-ch-8',
      chapterNumber: 8,
      title: 'Security, Code Smells & Production Mastery',
      subtitle: 'Identify security vulnerabilities (SQL injection, unsafe eval, deserialization), reduce complexity, and audit code health.',
      estimatedMinutes: 35,
      difficulty: 'Advanced',
      objectives: [
        'Audit code for SQL injection, command injection, and unsafe `eval()`/`exec()`.',
        'Diagnose common anti-patterns like broad exception suppression and dead code.',
        'Measure and lower Cyclomatic & Cognitive Complexity.',
        'Use automated linting heuristics (PEP 8, bandit, ruff) to ensure production safety.'
      ],
      concepts: [
        {
          title: 'SQL Injection: String Concatenation vs Parameterized Queries',
          explanation: 'Never concatenate untrusted user input directly into SQL statements using f-strings or % formatting. Always use database parameterized placeholders (e.g. %s, ?).',
          codeSnippet: `# 🔴 CRITICAL VULNERABILITY (SQL Injection):\ncursor.execute(f"SELECT * FROM users WHERE email = '{user_input}'")\n\n# 🟢 SECURE REMEDIATION (Parameterized query):\ncursor.execute("SELECT * FROM users WHERE email = %s", (user_input,))`,
          keyTakeaway: 'Parameterized queries ensure the database engine treats input strictly as literal data, not executable SQL commands.'
        },
        {
          title: 'Eliminating Unsafe eval()',
          explanation: 'Using `eval()` on user-supplied strings allows arbitrary Remote Code Execution (RCE). Use `ast.literal_eval()` or structured JSON parsers for safe data conversion.',
          codeSnippet: `import ast\n# Safe parsing of literal data structures:\nsafe_dict = ast.literal_eval('{"score": 98, "status": "ok"}')`,
          keyTakeaway: 'Never use eval() or exec() on dynamic or untrusted strings.'
        }
      ],
      examples: [
        {
          title: 'Vulnerability Remediation: Secure Query Dispatcher',
          explanation: 'Demonstrates converting a vulnerable dynamic query dispatcher into a safe parameterized builder.',
          code: `def build_secure_query(table: str, filters: dict) -> tuple[str, list]:
    """Generates a parameterized SQL query without string interpolation vulnerabilities."""
    ALLOWED_TABLES = {"users", "metrics", "reports"}
    if table not in ALLOWED_TABLES:
        raise ValueError(f"Unauthorized table access attempt: {table}")

    clauses = []
    params = []
    for column, value in filters.items():
        # Validate column name format
        if not column.isidentifier():
            raise ValueError(f"Invalid column identifier: {column}")
        clauses.append(f"{column} = %s")
        params.append(value)

    where_stmt = " AND ".join(clauses) if clauses else "1=1"
    query = f"SELECT * FROM {table} WHERE {where_stmt}"
    return query, params

# Test secure generation
sql, args = build_secure_query("users", {"role": "admin", "is_active": 1})
print("SQL:", sql)
print("Args:", args)`,
          output: `SQL: SELECT * FROM users WHERE role = %s AND is_active = %s
Args: ['admin', 1]`,
          tip: 'Validate table and column identifiers against a strict whitelist before building query strings.'
        }
      ],
      tryIt: {
        id: 'py-try-8',
        title: 'Remediate a Security Smell: Safe Config Loader',
        task: 'Fix the vulnerable configuration parser by replacing eval() with json.loads or ast.literal_eval.',
        instructions: [
          'Import json or ast.',
          'Replace unsafe eval() call with json.loads(raw_json) or ast.literal_eval(raw_json).',
          'Handle parsing errors gracefully by catching (json.JSONDecodeError, ValueError) and returning an empty dict {}.'
        ],
        starterCode: `# ❌ VULNERABLE CODE (Do not use in production):
def load_user_settings(raw_config_string: str) -> dict:
    # BUG: Dangerous eval allows code execution
    return eval(raw_config_string)

# Test input:
print(load_user_settings('{"theme": "dark", "notifications": true}'))`,
        solutionCode: `import json

def load_user_settings(raw_config_string: str) -> dict:
    try:
        data = json.loads(raw_config_string)
        if isinstance(data, dict):
            return data
        return {}
    except (json.JSONDecodeError, ValueError, TypeError):
        return {}

print(load_user_settings('{"theme": "dark", "notifications": true}'))`,
        hints: [
          'Use import json and json.loads()',
          'Wrap in try/except json.JSONDecodeError'
        ],
        validationCriteria: [
          'No eval() statement',
          'Uses json.loads or ast.literal_eval',
          'Handles decoding errors with try/except'
        ]
      }
    }
  ]
};
