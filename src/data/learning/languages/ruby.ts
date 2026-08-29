import { LanguageLearningContent } from '../types';

export const rubyContent: LanguageLearningContent = {
  id: 'ruby',
  name: 'Ruby',
  icon: '💎',
  color: 'text-rose-500',
  tagline: 'Dynamic, open-source language focused on developer happiness, elegant object orientation, and human-friendly syntax.',
  extensions: ['.rb', '.rake', '.gemspec'],
  difficulty: 'Beginner',
  paradigms: ['Object-Oriented', 'Imperative', 'Functional', 'Reflective', 'Metaprogramming'],
  creator: 'Yukihiro "Matz" Matsumoto',
  releaseYear: '1995',
  currentPurpose: 'Web application development (Ruby on Rails), devops scripts, automation tools (Homebrew, Fastlane), prototyping.',
  typingSystem: 'Dynamic, Strong, Duck typing (everything is an object, including nil and numbers)',
  executionModel: 'Interpreted via YARV (Yet Another Ruby VM) with YJIT (Just-in-Time compiler in modern Ruby 3+)',
  typicalEnvironments: ['Ruby on Rails', 'Heroku / Render / AWS', 'Homebrew CLI automation', 'Shopify / GitHub backends'],
  devPulseSupport: {
    level: 'Syntax & Heuristics',
    capabilities: [
      'Class, module, and method (def) token parsing',
      'Cyclomatic branch & block nesting analysis',
      'Nil safety heuristics and unhandled exception detection',
      'Metaprogramming & method_missing complexity warnings',
    ],
  },
  whyLearn: {
    importance: 'Ruby on Rails remains the fastest web framework for launching startups, powering giants like GitHub, Shopify, Airbnb, and Stripe.',
    commonDomains: ['Startup Prototyping & MVPs', 'Full-Stack Web Development (Rails)', 'DevOps & Tooling (Homebrew/CocoaPods)', 'E-Commerce Backends'],
    strengths: [
      'Incomparable developer productivity and intuitive English-like readability',
      'Powerful metaprogramming and domain-specific language (DSL) creation capabilities',
      'The Ruby on Rails convention-over-configuration philosophy',
      'RubyGems package ecosystem with mature, battle-tested libraries',
    ],
    weaknesses: [
      'Execution speed is slower than compiled languages like Go or Rust',
      'Dynamic typing requires thorough automated test suites (RSpec)',
    ],
    careerRelevance: 'Strong, high-paying market for Senior Full-Stack Engineers and Rails Architects.',
    typicalProjects: ['SaaS Web Applications', 'Shopify Apps & Storefronts', 'Automation Scripts', 'REST & GraphQL APIs'],
    whenToChoose: ['When building a startup product or web application where developer speed is paramount'],
    whenToAvoid: ['When building real-time game physics engines or high-frequency quantitative finance algorithms'],
  },
  coreConcepts: [
    { title: 'Everything is an Object', summary: 'Even basic numbers (e.g. 5.times) and nil are full objects with methods.', relevance: 'Creates a uniform, expressive mental model.' },
    { title: 'Blocks, Procs & Yield', summary: 'First-class code chunks passed to methods for iteration, callbacks, and DSLs.', relevance: 'Powers Ruby\'s elegant enumerable methods (.map, .select, .each).' },
  ],
  syntaxFundamentals: [
    {
      title: 'Classes & Blocks with Yield',
      concept: 'Object definition and block execution',
      explanation: 'Define classes with attr_reader and iterate with yield blocks.',
      code: `class CodeAnalyzer
  attr_reader :language, :score

  def initialize(language, score = 100)
    @language = language
    @score = score
  end

  def report
    puts "Analyzer: #{@language} | Score: #{@score}/100"
  end
end

analyzer = CodeAnalyzer.new("Ruby", 96)
analyzer.report`,
      output: `Analyzer: Ruby | Score: 96/100`,
      importantNote: 'Instance variables start with @, class variables with @@, constants in UPPER_CASE.',
    },
  ],
  dataTypes: {
    summary: 'Everything in Ruby is an object inheriting from Object / BasicObject.',
    typingNotes: 'Dynamic and strongly typed; nil is a singleton instance of NilClass.',
    typesList: [
      { type: 'Integer / Float', description: 'Arbitrary-precision integers and floating point numbers', example: '42, 3.14', category: 'Primitive' },
      { type: 'String / Symbol', description: 'Mutable string vs immutable interned identifier (:symbol)', example: '"text", :status', category: 'Primitive' },
      { type: 'Array', description: 'Ordered, dynamic heterogeneous list', example: '[1, "two", :three]', category: 'Collection' },
      { type: 'Hash', description: 'Key-value dictionary', example: '{ name: "DevPulse", score: 98 }', category: 'Collection' },
    ],
  },
  controlFlow: [
    {
      name: 'unless and Modifier Syntax',
      description: 'Ruby provides readable unless (if not) and single-line statement modifiers.',
      code: `score = 95
puts "Passing" if score > 70
puts "Needs Attention" unless score >= 70`,
    },
  ],
  functions: [
    {
      title: 'Methods & Implicit Returns',
      description: 'Methods automatically return the result of the last evaluated expression.',
      code: `def calculate_health(loc, smells)
  return 100 if loc <= 0
  [100 - (smells * 5), 0].max
end`,
    },
  ],
  oop: {
    isSupported: true,
    paradigmNotes: 'Pure object-oriented language with single inheritance and mixins (modules included via include/extend).',
    concepts: [
      {
        concept: 'Modules as Mixins',
        description: 'Share behavior across disparate classes without multiple inheritance.',
        code: `module Loggable
  def log(msg)
    puts "[LOG] #{msg}"
  end
end

class MetricEngine
  include Loggable
end`,
      },
    ],
  },
  errorHandling: [
    {
      type: 'begin / rescue / ensure',
      description: 'Ruby exception handling mechanism.',
      mechanism: 'begin ... rescue StandardError => e ... ensure ... end',
      code: `begin
  File.read("missing.txt")
rescue Errno::ENOENT => e
  puts "File not found: #{e.message}"
ensure
  puts "Cleanup done."
end`,
      debuggingTip: 'Always rescue StandardError rather than bare Exception, which catches fatal system signals.',
    },
  ],
  modulesAndPackages: {
    title: 'RubyGems & Bundler',
    importSyntax: 'require "json" / require_relative "engine"',
    exportSyntax: 'module DevPulse; class Core; end; end',
    packageManager: 'Bundler (Gemfile)',
    packageManagerCommand: 'bundle install / gem install rails',
    standardModules: ['json', 'net/http', 'fileutils', 'date', 'digest'],
    description: 'Bundler manages gem dependencies across development and production.',
  },
  memoryAndExecution: {
    model: 'Automatic garbage collection using mark-and-sweep and compaction (GC module).',
    allocation: 'Objects allocated on Heap. YJIT optimizes execution speed dynamically.',
    garbageCollection: 'Generational and incremental garbage collection in modern Ruby 3+.',
    keyDetails: ['Use frozen string literals (# frozen_string_literal: true) to eliminate duplicate allocations.'],
  },
  toolsAndEcosystem: [
    {
      category: 'Frameworks & Linters',
      tools: [
        { name: 'Ruby on Rails', description: 'The legendary full-stack web application framework.', type: 'Framework' },
        { name: 'RSpec', description: 'Behavior-Driven Development testing framework for Ruby.', type: 'Testing' },
        { name: 'RuboCop', description: 'Ruby static code analyzer and code formatter.', type: 'Linter/Formatter' },
      ],
    },
  ],
  useCases: [
    { title: 'Full-Stack Web Applications', description: 'High-speed startup MVPs and large platforms.', popularity: 'Very High', examples: ['GitHub', 'Shopify', 'Basecamp'] },
  ],
  bestPractices: [
    {
      title: 'Add # frozen_string_literal: true',
      category: 'Performance',
      recommendation: 'Freezes string literals in the file, preventing allocations on every invocation.',
      goodCode: `# frozen_string_literal: true\nSTATUS = "active"`,
    },
  ],
  commonMistakes: [
    {
      mistake: 'Rescuing Exception Instead of StandardError',
      whyItMatters: 'Rescuing Exception catches SignalException and Interrupt, preventing Ctrl+C from stopping scripts.',
      badSnippet: `begin; run; rescue Exception => e; end`,
      betterApproach: 'Rescue StandardError or specific error types.',
      fixedSnippet: `begin; run; rescue StandardError => e; end`,
    },
  ],
  securityConsiderations: [
    {
      vulnerability: 'Remote Code Execution via YAML.load',
      riskLevel: 'Critical',
      description: 'Using YAML.load on untrusted input executes arbitrary Ruby code.',
      vulnerableCode: `YAML.load(user_input)`,
      remediation: 'Use YAML.safe_load instead.',
      secureCode: `YAML.safe_load(user_input, permitted_classes: [Symbol])`,
    },
  ],
  performanceConsiderations: [
    {
      topic: 'Avoid Unnecessary Object Allocations in Loops',
      impact: 'Medium',
      description: 'Creating new arrays or strings in tight loops triggers frequent GC cycles.',
      recommendation: 'Reuse buffers or pass blocks without intermediate arrays.',
    },
  ],
  roadmap: [
    { stepNumber: 1, title: 'Ruby Basics', description: 'Variables, symbols, strings, arrays, hashes, blocks.', topics: ['Basics', 'Blocks', 'Hashes'], estimatedTime: '1 week' },
    { stepNumber: 2, title: 'OOP & Mixins', description: 'Classes, modules, inheritance, self, attr_accessor.', topics: ['Classes', 'Mixins', 'Scope'], estimatedTime: '1-2 weeks' },
    { stepNumber: 3, title: 'Testing with RSpec', description: 'BDD testing, mocks, stubs, expectations.', topics: ['RSpec', 'TDD', 'Fixtures'], estimatedTime: '1 week' },
    { stepNumber: 4, title: 'Ruby on Rails', description: 'ActiveRecord, Controllers, Views, Turbo/Stimulus, PostgreSQL.', topics: ['Rails', 'ActiveRecord', 'APIs'], estimatedTime: '3-4 weeks' },
  ],
  practiceExercises: [
    {
      id: 'rb-ex-1',
      title: 'Block-Based Health Filter',
      difficulty: 'Beginner',
      objective: 'Write a method filter_smells(smells) that returns titles of smells with severity == :critical.',
      starterCode: `def filter_smells(smells)
  # TODO
end`,
      solutionCode: `def filter_smells(smells)
  smells.select { |s| s[:severity] == :critical }.map { |s| s[:title] }
end

data = [{ title: "SQLi", severity: :critical }, { title: "Spelling", severity: :info }]
puts filter_smells(data)`,
      hints: ['Use smells.select { ... }.map { ... }'],
      sampleOutput: 'SQLi',
    },
  ],
};
