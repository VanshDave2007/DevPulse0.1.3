import { LanguageLearningContent } from '../types';

export const sqlContent: LanguageLearningContent = {
  id: 'sql',
  name: 'SQL',
  icon: '🗄️',
  color: 'text-cyan-600',
  tagline: 'Standard declarative query language for storing, querying, manipulating, and managing relational databases.',
  extensions: ['.sql'],
  difficulty: 'Beginner',
  paradigms: ['Declarative', 'Set-Based', 'Query Language'],
  creator: 'Donald D. Chamberlin & Raymond F. Boyce (IBM)',
  releaseYear: '1974',
  currentPurpose: 'Relational data query and manipulation in PostgreSQL, MySQL, SQLite, Oracle, Snowflake, BigQuery.',
  typingSystem: 'Static column typing (INTEGER, VARCHAR, TIMESTAMP, JSONB, BOOLEAN)',
  executionModel: 'Parsed, planned, and optimized via database query engines (Cost-Based Query Planner)',
  typicalEnvironments: ['PostgreSQL / MySQL / SQLite / SQL Server', 'Cloud Warehouses (Snowflake, BigQuery)', 'Embedded in ORMs (Prisma, Drizzle, SQLAlchemy)'],
  devPulseSupport: {
    level: 'Lexical & Structural',
    capabilities: [
      'SELECT, JOIN, and DDL statement parsing',
      'Cyclomatic branch & subquery depth analysis',
      'Unindexed full-table scan & N+1 query smell warnings',
      'SQL injection & raw string interpolation detection',
    ],
  },
  whyLearn: {
    importance: 'SQL is the universal language of business data. Virtually every application, analytics dashboard, and backend database relies on SQL.',
    commonDomains: ['Backend Data Persistence', 'Data Engineering & Pipelines', 'Business Intelligence & Analytics', 'Machine Learning Feature Stores'],
    strengths: [
      'Declarative power—describe WHAT data you want, let the database query optimizer decide HOW to fetch it',
      'ACID transaction guarantees for mission-critical financial and operational consistency',
      'Extremely mature with 50 years of enterprise performance optimization',
      'Universal support across all programming languages and frameworks',
    ],
    weaknesses: [
      'Dialect fragmentation (PostgreSQL vs MySQL vs Oracle syntax variations)',
      'Impedance mismatch when mapping relational tables to OOP objects',
    ],
    careerRelevance: 'Universal requirement for Backend Engineers, Data Engineers, Data Scientists, and Database Administrators.',
    typicalProjects: ['Transactional User Databases', 'Data Warehouse ETL Pipelines', 'Financial Ledger Ledgers', 'Analytics Aggregators'],
    whenToChoose: ['When structured relational data, transactions, and complex joins are needed'],
    whenToAvoid: ['When storing purely unorganized binary blobs or transient key-value cache strings (use Redis)'],
  },
  coreConcepts: [
    { title: 'Relational Model & Keys', summary: 'Data structured into tables with primary keys (unique identity) and foreign keys (referential integrity).', relevance: 'Guarantees structural data integrity.' },
    { title: 'JOIN Operations', summary: 'Combine rows from two or more tables based on related columns (INNER, LEFT, RIGHT, FULL OUTER).', relevance: 'The primary mechanism for relational querying.' },
    { title: 'ACID Transactions', summary: 'Atomicity, Consistency, Isolation, and Durability guarantees using BEGIN ... COMMIT / ROLLBACK.', relevance: 'Prevents corrupted partial updates.' },
  ],
  syntaxFundamentals: [
    {
      title: 'SELECT, JOIN, and Aggregation',
      concept: 'Relational querying and aggregation',
      explanation: 'Query tables, join related entities, and aggregate metrics using GROUP BY and HAVING.',
      code: `SELECT 
    p.project_name,
    COUNT(s.id) AS total_smells,
    AVG(p.health_score) AS avg_health
FROM projects p
LEFT JOIN code_smells s ON p.id = s.project_id
WHERE p.is_active = TRUE
GROUP BY p.project_name
HAVING COUNT(s.id) > 5
ORDER BY total_smells DESC;`,
      output: `(Aggregated Result Table)`,
      importantNote: 'WHERE filters rows before aggregation; HAVING filters groups after aggregation.',
    },
  ],
  dataTypes: {
    summary: 'Standard SQL column data types with dialect-specific extensions (e.g. JSONB in Postgres).',
    typingNotes: 'Strict schema enforcement per column.',
    typesList: [
      { type: 'INT / BIGINT', description: 'Signed whole numbers (32/64 bit)', example: 'id BIGINT PRIMARY KEY', category: 'Primitive' },
      { type: 'VARCHAR(n) / TEXT', description: 'Variable-length character strings', example: 'name VARCHAR(255)', category: 'Primitive' },
      { type: 'DECIMAL(p, s) / NUMERIC', description: 'Exact fixed-point financial numbers', example: 'balance DECIMAL(12, 2)', category: 'Primitive' },
      { type: 'TIMESTAMP WITH TIME ZONE', description: 'Date and time with UTC offset', example: 'created_at TIMESTAMPTZ', category: 'Primitive' },
      { type: 'JSONB (PostgreSQL)', description: 'Binary indexed JSON document column', example: 'metadata JSONB', category: 'Special' },
    ],
  },
  controlFlow: [
    {
      name: 'CASE Expressions',
      description: 'Conditional column evaluation inside SELECT or UPDATE statements.',
      code: `SELECT title,
       CASE 
           WHEN severity = 'critical' THEN 3
           WHEN severity = 'warning' THEN 2
           ELSE 1
       END AS severity_rank
FROM code_smells;`,
    },
  ],
  functions: [
    {
      title: 'Window Functions (OVER, PARTITION BY)',
      description: 'Perform calculations across a set of table rows related to the current row without collapsing groups.',
      code: `SELECT 
    project_id,
    health_score,
    RANK() OVER (PARTITION BY language ORDER BY health_score DESC) as rank_in_lang
FROM projects;`,
    },
  ],
  oop: {
    isSupported: false,
    paradigmNotes: 'SQL is declarative and relational, not object-oriented.',
    concepts: [],
  },
  errorHandling: [
    {
      type: 'Transactions & Rollbacks',
      description: 'All-or-nothing execution guarantees.',
      mechanism: 'BEGIN TRANSACTION; ... if error then ROLLBACK; else COMMIT;',
      code: `BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;`,
      debuggingTip: 'Always use transactions when executing multiple dependent writes.',
    },
  ],
  modulesAndPackages: {
    title: 'Migration Tools & ORMs',
    importSyntax: '\\i schema.sql / source schema.sql',
    exportSyntax: 'pg_dump / mysqldump',
    packageManager: 'Flyway / Liquibase / Prisma Migrations',
    packageManagerCommand: 'npx prisma migrate dev / alembic upgrade head',
    standardModules: ['information_schema', 'pg_catalog'],
    description: 'Schema migrations version-control database structural changes over time.',
  },
  memoryAndExecution: {
    model: 'Relational database engine: Buffer pool in RAM, Write-Ahead Log (WAL), Table / B-Tree Index storage on disk.',
    allocation: 'Managed by database memory settings (e.g. shared_buffers, work_mem in Postgres).',
    garbageCollection: 'VACUUM in PostgreSQL reclaims dead row tuples from MVCC.',
    keyDetails: ['Proper B-tree indexes turn O(N) table scans into O(log N) index lookups.'],
  },
  concurrency: {
    model: 'MVCC (Multi-Version Concurrency Control) and Transaction Isolation Levels (Read Committed, Repeatable Read, Serializable).',
    keyPrimitives: ['SELECT ... FOR UPDATE', 'Isolation Levels', 'Deadlock Detection'],
    description: 'Readers do not block writers, and writers do not block readers under MVCC.',
    code: `SELECT * FROM inventory WHERE item_id = 42 FOR UPDATE;`,
  },
  toolsAndEcosystem: [
    {
      category: 'Relational Engines & Client Tools',
      tools: [
        { name: 'PostgreSQL', description: 'The world\'s most advanced open-source relational database.', type: 'Framework' },
        { name: 'pgAdmin / DBeaver', description: 'Universal graphical database management tools.', type: 'IDE/Editor' },
        { name: 'Prisma / Drizzle', description: 'Modern type-safe ORMs for TypeScript.', type: 'Framework' },
      ],
    },
  ],
  useCases: [
    { title: 'Transactional Application Backends', description: 'Core persistent database for user accounts, payments, and orders.', popularity: 'Very High', examples: ['Stripe Ledgers', 'E-commerce Orders'] },
    { title: 'Analytical Warehousing', description: 'Big data SQL analytics in Snowflake, ClickHouse, and BigQuery.', popularity: 'Very High', examples: ['Business Dashboards', 'ETL Pipelines'] },
  ],
  bestPractices: [
    {
      title: 'Always Add Indexes to Foreign Keys and WHERE Clauses',
      category: 'Performance',
      recommendation: 'Unindexed foreign keys cause full sequential table scans on joins and deletes.',
      goodCode: `CREATE INDEX idx_smells_project_id ON code_smells(project_id);`,
    },
  ],
  commonMistakes: [
    {
      mistake: 'Using SELECT * in Production Backend Queries',
      whyItMatters: 'SELECT * fetches unneeded columns (like large text/blobs), wastes I/O bandwidth, and prevents index-only scans.',
      badSnippet: `SELECT * FROM users WHERE email = 'test@example.com';`,
      betterApproach: 'Select only the columns needed.',
      fixedSnippet: `SELECT id, password_hash, is_active FROM users WHERE email = 'test@example.com';`,
    },
  ],
  securityConsiderations: [
    {
      vulnerability: 'SQL Injection',
      riskLevel: 'Critical',
      description: 'Direct string concatenation of untrusted user input into query strings.',
      vulnerableCode: 'SELECT * FROM users WHERE user = \'\' + userInput + \'\';',
      remediation: 'Always use parameterized queries and prepared statements.',
      secureCode: `SELECT * FROM users WHERE user = $1;`,
    },
  ],
  performanceConsiderations: [
    {
      topic: 'Use EXPLAIN ANALYZE to Inspect Query Execution Plans',
      impact: 'High',
      description: 'EXPLAIN ANALYZE reveals whether queries use Index Scans, Bitmap Scans, or slow Sequential Scans.',
      recommendation: 'Run EXPLAIN ANALYZE on any query taking > 10ms in production.',
    },
  ],
  roadmap: [
    { stepNumber: 1, title: 'Basic SQL Queries', description: 'SELECT, WHERE, ORDER BY, LIMIT, operators.', topics: ['SELECT', 'WHERE', 'Filtering'], estimatedTime: '1 week' },
    { stepNumber: 2, title: 'Joins & Relationships', description: 'INNER JOIN, LEFT JOIN, foreign keys, table design.', topics: ['Joins', 'Foreign Keys', 'Normal Form'], estimatedTime: '1-2 weeks' },
    { stepNumber: 3, title: 'Aggregations & Grouping', description: 'COUNT, SUM, AVG, GROUP BY, HAVING, subqueries.', topics: ['GROUP BY', 'HAVING', 'Subqueries'], estimatedTime: '1 week' },
    { stepNumber: 4, title: 'Indexes & Query Optimization', description: 'B-Trees, EXPLAIN ANALYZE, query planner, index types.', topics: ['Indexes', 'EXPLAIN ANALYZE', 'VACUUM'], estimatedTime: '2 weeks' },
    { stepNumber: 5, title: 'Advanced SQL & Transactions', description: 'Window functions, CTEs, ACID isolation, JSONB.', topics: ['Window Functions', 'CTEs', 'Transactions'], estimatedTime: '2 weeks' },
  ],
  practiceExercises: [
    {
      id: 'sql-ex-1',
      title: 'Filter Critical Project Smells',
      difficulty: 'Beginner',
      objective: 'Write a query to select title and line from code_smells where severity = "critical" order by line asc.',
      starterCode: `-- TODO: Write SQL query
SELECT 
FROM code_smells
WHERE ;`,
      solutionCode: `SELECT title, line
FROM code_smells
WHERE severity = 'critical'
ORDER BY line ASC;`,
      hints: ['SELECT title, line FROM code_smells WHERE severity = \'critical\' ORDER BY line ASC;'],
      sampleOutput: 'Result rows matching severity = "critical"',
    },
  ],
};
