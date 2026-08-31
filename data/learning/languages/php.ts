import { LanguageLearningContent } from '../types';

export const phpContent: LanguageLearningContent = {
  id: 'php',
  name: 'PHP',
  icon: '🐘',
  color: 'text-indigo-500',
  tagline: 'Widely used open-source server-side scripting language powering modern web applications and content management platforms.',
  extensions: ['.php', '.phtml'],
  difficulty: 'Beginner',
  paradigms: ['Multi-paradigm', 'Object-Oriented', 'Procedural', 'Imperative', 'Functional'],
  creator: 'Rasmus Lerdorf',
  releaseYear: '1995',
  currentPurpose: 'Web development, REST APIs (Laravel, Symfony), content management systems (WordPress, Drupal), e-commerce (Magento).',
  typingSystem: 'Gradual / Dynamic typing with optional strict types (declare(strict_types=1)), union types, and typed class properties in PHP 8+',
  executionModel: 'Request-lifecycle interpreted/JIT via Zend Engine, FastCGI (PHP-FPM), or persistent CLI runtimes (FrankenPHP, RoadRunner, Swoole)',
  typicalEnvironments: ['Nginx / Apache + PHP-FPM', 'FrankenPHP / RoadRunner', 'Laravel Forge / Vapor', 'Docker Containers'],
  devPulseSupport: {
    level: 'Syntax & Heuristics',
    capabilities: [
      'Function, class, and namespace structural analysis',
      'Cyclomatic branch & cognitive complexity analysis',
      'SQL injection & unescaped output (XSS) detection',
      'Superglobal ($_GET, $_POST, $_REQUEST) misuse warnings',
      'Deprecated function & type mismatch heuristics',
    ],
  },
  whyLearn: {
    importance: 'PHP powers over 75% of websites with a known server-side programming language, including WordPress, Wikipedia, and massive Laravel applications.',
    commonDomains: ['Web Backends & REST APIs (Laravel)', 'Content Management Systems (WordPress)', 'E-Commerce Platforms (WooCommerce, Shopify Apps)', 'SaaS Platforms'],
    strengths: [
      'Extremely rapid web development and deployment cycle',
      'Modern PHP 8.2+ has exceptional OOP, typed properties, enums, match expressions, and attributes',
      'Stateless request-response lifecycle prevents long-lived memory leak bugs by design',
      'Massive ecosystem with Composer and the Laravel framework',
    ],
    weaknesses: [
      'Legacy reputation from PHP 4/5 inconsistencies (largely fixed in PHP 8+)',
      'Traditional per-request bootstrapping can add overhead (mitigated by modern FrankenPHP/Octane)',
    ],
    careerRelevance: 'Huge freelance, agency, and enterprise job market, especially for Laravel and WordPress developers.',
    typicalProjects: ['Laravel Web Applications', 'Custom WordPress Plugins/Themes', 'Stripe Payment Integrations', 'REST APIs'],
    whenToChoose: ['When building web applications, content-driven platforms, or using Laravel', 'When fast turnaround and rich hosting options are desired'],
    whenToAvoid: ['When writing low-level hardware drivers or desktop 3D game engines'],
  },
  coreConcepts: [
    { title: 'Stateless Request Lifecycle', summary: 'Each HTTP request starts with a fresh memory state and tears down upon completion.', relevance: 'Eliminates memory leakage between user requests.' },
    { title: 'Modern PHP 8+ Type System', summary: 'Union types, intersection types, readonly classes, and match expressions.', relevance: 'Brings enterprise type safety to a historically dynamic language.' },
  ],
  syntaxFundamentals: [
    {
      title: 'PHP 8+ Constructor Property Promotion & Match',
      concept: 'Modern concise object construction',
      explanation: 'Promote constructor parameters directly into class properties.',
      code: `<?php
declare(strict_types=1);

class HealthReport {
    public function __construct(
        public readonly string $projectName,
        public int $score
    ) {}

    public function getStatus(): string {
        return match (true) {
            $this->score >= 90 => 'Optimal',
            $this->score >= 70 => 'Stable',
            default => 'Critical Risk',
        };
    }
}

$report = new HealthReport('DevPulse', 95);
echo $report->getStatus();`,
      output: `Optimal`,
      importantNote: 'Always include declare(strict_types=1); at the top of PHP files.',
    },
  ],
  dataTypes: {
    summary: 'PHP has scalar types (int, float, string, bool), compound types (array, object), and special types (null, resource).',
    typingNotes: 'PHP arrays are versatile ordered hash maps serving as lists, dictionaries, stacks, and queues.',
    typesList: [
      { type: 'int / float', description: 'Signed whole and floating point numbers', example: '$count = 42;', category: 'Primitive' },
      { type: 'string', description: 'Byte sequence / text', example: '"DevPulse"', category: 'Primitive' },
      { type: 'bool', description: 'true or false', example: 'true', category: 'Primitive' },
      { type: 'array', description: 'Ordered map of key-value associations', example: '["a" => 1, "b" => 2]', category: 'Collection' },
    ],
  },
  controlFlow: [
    {
      name: 'match Expression (PHP 8+)',
      description: 'Strict identity (===) evaluation returning values directly.',
      code: `$role = 'admin';
$access = match ($role) {
    'admin' => 'full_access',
    'editor', 'author' => 'write_access',
    default => 'read_only',
};`,
    },
  ],
  functions: [
    {
      title: 'Typed Functions & Arrow Functions',
      description: 'Strictly typed arguments, return types, and short arrow syntax fn($x) => $x * 2.',
      code: `function calculateHealth(int $loc, int $smells): float {
    return max(0.0, 100.0 - ($smells * 5.0));
}`,
    },
  ],
  oop: {
    isSupported: true,
    paradigmNotes: 'Full OOP with interfaces, abstract classes, traits, and attributes.',
    concepts: [
      {
        concept: 'Interfaces and Readonly Classes',
        description: 'Enforce immutability and modular contracts.',
        code: `interface AnalyzerInterface {
    public function run(string $code): int;
}`,
      },
    ],
  },
  errorHandling: [
    {
      type: 'try / catch / finally & Throwable',
      description: 'Exceptions and fatal Errors implement the Throwable interface.',
      mechanism: 'try { ... } catch (Throwable $e) { ... }',
      code: `try {
    throw new Exception("Metric failed");
} catch (Exception $e) {
    echo $e->getMessage();
}`,
      debuggingTip: 'Catch Throwable to intercept both user exceptions and PHP engine Errors.',
    },
  ],
  modulesAndPackages: {
    title: 'Composer & Packagist',
    importSyntax: 'use App\\Services\\MetricAnalyzer; / require __DIR__ . "/vendor/autoload.php";',
    exportSyntax: 'namespace App\\Services; at top of file',
    packageManager: 'Composer (composer.json)',
    packageManagerCommand: 'composer require laravel/framework / composer install',
    standardModules: ['PDO', 'json', 'curl', 'mbstring', 'openssl', 'fileinfo'],
    description: 'Composer provides PSR-4 autoloading and package dependency resolution.',
  },
  memoryAndExecution: {
    model: 'Per-request memory pool freed automatically on HTTP cycle completion.',
    allocation: 'Zend Memory Manager handles allocation with reference counting and cyclic GC.',
    garbageCollection: 'Synchronous reference count freeing with cyclic GC collector.',
    keyDetails: ['Opcache compiles PHP source into shared memory opcode cache.'],
  },
  toolsAndEcosystem: [
    {
      category: 'Frameworks & Tools',
      tools: [
        { name: 'Laravel', description: 'The premier PHP web framework known for elegant syntax and rich ecosystem.', type: 'Framework' },
        { name: 'Symfony', description: 'High-performance set of reusable PHP components and framework.', type: 'Framework' },
        { name: 'PHPStan / Psalm', description: 'Static analysis tools finding bugs before execution.', type: 'Linter/Formatter' },
      ],
    },
  ],
  useCases: [
    { title: 'Modern Web Applications (Laravel)', description: 'Full-stack SaaS platforms with authentication, queues, and ORM.', popularity: 'Very High', examples: ['Laravel Vapor Platforms', 'SaaS Backends'] },
    { title: 'Content Management (WordPress)', description: 'Publishing platforms and enterprise media sites.', popularity: 'Very High', examples: ['WordPress Sites', 'WooCommerce Stores'] },
  ],
  bestPractices: [
    {
      title: 'Always Use Prepared Statements with PDO',
      category: 'Security',
      recommendation: 'Never concatenate $_POST/$_GET into SQL strings.',
      goodCode: `$stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email');\n$stmt->execute(['email' => $email]);`,
      badCode: `$pdo->query("SELECT * FROM users WHERE email = '$email'");`,
    },
  ],
  commonMistakes: [
    {
      mistake: 'Direct Superglobal Usage Without Validation',
      whyItMatters: 'Using $_GET or $_POST directly without sanitization causes XSS and SQL injection.',
      badSnippet: `echo "Hello " . $_GET['name'];`,
      betterApproach: 'Escape output using htmlspecialchars() or use framework request helpers.',
      fixedSnippet: `echo "Hello " . htmlspecialchars($_GET['name'] ?? '', ENT_QUOTES, 'UTF-8');`,
    },
  ],
  securityConsiderations: [
    {
      vulnerability: 'SQL Injection and XSS',
      riskLevel: 'Critical',
      description: 'Concatenating unescaped user input into database queries or HTML output.',
      vulnerableCode: `$db->query("SELECT * FROM users WHERE id = " . $_GET['id']);`,
      remediation: 'Use PDO parameterized statements and escape HTML with htmlspecialchars.',
      secureCode: `$stmt = $db->prepare("SELECT * FROM users WHERE id = ?");\n$stmt->execute([$_GET['id']]);`,
    },
  ],
  performanceConsiderations: [
    {
      topic: 'Enable OPcache and JIT in Production',
      impact: 'High',
      description: 'OPcache stores precompiled script bytecode in shared memory, eliminating file parsing overhead.',
      recommendation: 'Ensure opcache.enable=1 and opcache.jit_buffer_size=100M in php.ini.',
    },
  ],
  roadmap: [
    { stepNumber: 1, title: 'PHP Basics', description: 'Variables, arrays, control flow, functions, strict types.', topics: ['Variables', 'Arrays', 'declare(strict_types=1)'], estimatedTime: '1 week' },
    { stepNumber: 2, title: 'Modern OOP & PHP 8', description: 'Classes, property promotion, readonly, match, interfaces.', topics: ['Classes', 'match', 'Interfaces'], estimatedTime: '2 weeks' },
    { stepNumber: 3, title: 'Databases & PDO', description: 'Connecting to MySQL/PostgreSQL, prepared statements, transactions.', topics: ['PDO', 'Prepared Statements', 'Migrations'], estimatedTime: '1-2 weeks' },
    { stepNumber: 4, title: 'Laravel Framework', description: 'Routing, Eloquent ORM, Blade, Middleware, Authentication.', topics: ['Laravel', 'Eloquent', 'Artisan'], estimatedTime: '3-4 weeks' },
  ],
  practiceExercises: [
    {
      id: 'php-ex-1',
      title: 'Health Score Evaluator',
      difficulty: 'Beginner',
      objective: 'Write a function evaluateHealth(int $loc, int $smells): string returning "Clean" if smells === 0, else "Smelly".',
      starterCode: `<?php
declare(strict_types=1);

function evaluateHealth(int $loc, int $smells): string {
    // TODO
    return "";
}`,
      solutionCode: `<?php
declare(strict_types=1);

function evaluateHealth(int $loc, int $smells): string {
    return $smells === 0 ? "Clean" : "Smelly";
}

echo evaluateHealth(100, 0);`,
      hints: ['Use ternary operator: $smells === 0 ? "Clean" : "Smelly"'],
      sampleOutput: 'Clean',
    },
  ],
};
