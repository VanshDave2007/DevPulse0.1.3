import { SQLQueryResult, SQLTableSchema } from '../../types';

export const DEVPULSE_DB_SCHEMAS: SQLTableSchema[] = [
  {
    name: 'projects',
    description: 'DevPulse repository workspaces and branches',
    rowCount: 3,
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Unique project ID' },
      { name: 'name', type: 'VARCHAR(128)', description: 'Repository name' },
      { name: 'language', type: 'VARCHAR(32)', description: 'Primary codebase language' },
      { name: 'health_score', type: 'INTEGER', description: 'Overall health score (0-100)' },
      { name: 'last_reviewed_at', type: 'TIMESTAMP', description: 'Timestamp of last agentic audit' },
    ],
  },
  {
    name: 'symbols',
    description: 'Extracted functions, classes, methods and signatures across repository',
    rowCount: 24,
    columns: [
      { name: 'id', type: 'VARCHAR(128)', isPrimary: true, description: 'Symbol ID' },
      { name: 'file_path', type: 'VARCHAR(256)', description: 'File path' },
      { name: 'name', type: 'VARCHAR(128)', description: 'Symbol identifier' },
      { name: 'symbol_type', type: 'VARCHAR(32)', description: 'function, method, class, endpoint' },
      { name: 'cyclomatic_complexity', type: 'INTEGER', description: 'Calculated cyclomatic complexity' },
      { name: 'param_count', type: 'INTEGER', description: 'Number of input parameters' },
      { name: 'is_public', type: 'BOOLEAN', description: 'Whether symbol is in public API' },
    ],
  },
  {
    name: 'vulnerabilities',
    description: 'Security CVE advisories and package vulnerability scans',
    rowCount: 6,
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Vulnerability record ID' },
      { name: 'cve_id', type: 'VARCHAR(32)', description: 'CVE identifier' },
      { name: 'package_name', type: 'VARCHAR(128)', description: 'Affected library or dependency' },
      { name: 'severity', type: 'VARCHAR(16)', description: 'CRITICAL, HIGH, MEDIUM, LOW' },
      { name: 'cvss_score', type: 'FLOAT', description: 'CVSS v3.1 base score (0.0 - 10.0)' },
      { name: 'is_used_in_code', type: 'BOOLEAN', description: 'Whether exploited symbol is in active code' },
    ],
  },
  {
    name: 'findings',
    description: 'Historical code review findings and verified regressions',
    rowCount: 18,
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Finding ID (e.g. DP-001)' },
      { name: 'severity', type: 'VARCHAR(16)', description: 'CRITICAL, HIGH, MEDIUM, LOW, INFO' },
      { name: 'category', type: 'VARCHAR(32)', description: 'REGRESSION, SECURITY, CORRECTNESS, PERFORMANCE' },
      { name: 'confidence', type: 'FLOAT', description: 'Confidence score (0.00 - 1.00)' },
      { name: 'file_path', type: 'VARCHAR(256)', description: 'File where issue was flagged' },
      { name: 'line_number', type: 'INTEGER', description: 'Line number' },
      { name: 'status', type: 'VARCHAR(16)', description: 'open, accepted, resolved, dismissed' },
    ],
  },
  {
    name: 'code_smells',
    description: 'Deterministic static analysis anti-patterns and complexity bottlenecks',
    rowCount: 12,
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Smell ID' },
      { name: 'category', type: 'VARCHAR(32)', description: 'complexity, maintainability, dead_code, security' },
      { name: 'severity', type: 'VARCHAR(16)', description: 'critical, warning, info' },
      { name: 'file_path', type: 'VARCHAR(256)', description: 'File location' },
      { name: 'line', type: 'INTEGER', description: 'Line number' },
    ],
  },
];

// Sample Database Records for In-Memory Execution
const DB_RECORDS = {
  projects: [
    { id: 'proj-1', name: 'DevPulse-Core', language: 'python', health_score: 88, last_reviewed_at: '2026-08-21 18:30:00' },
    { id: 'proj-2', name: 'E-Commerce-Gateway', language: 'typescript', health_score: 72, last_reviewed_at: '2026-08-20 14:15:00' },
    { id: 'proj-3', name: 'Fintech-Auth-Service', language: 'python', health_score: 54, last_reviewed_at: '2026-08-21 22:45:00' },
  ],
  symbols: [
    { id: 'sym-1', file_path: 'src/billing.py', name: 'calculate_price', symbol_type: 'function', cyclomatic_complexity: 3, param_count: 3, is_public: true },
    { id: 'sym-2', file_path: 'src/checkout.py', name: 'process_checkout_cart', symbol_type: 'function', cyclomatic_complexity: 5, param_count: 2, is_public: true },
    { id: 'sym-3', file_path: 'src/services/auth_service.py', name: 'get_user_by_email', symbol_type: 'function', cyclomatic_complexity: 4, param_count: 2, is_public: true },
    { id: 'sym-4', file_path: 'src/services/auth_service.py', name: 'verify_token', symbol_type: 'function', cyclomatic_complexity: 6, param_count: 1, is_public: true },
    { id: 'sym-5', file_path: 'src/payments/gateway.ts', name: 'chargeCustomer', symbol_type: 'function', cyclomatic_complexity: 8, param_count: 2, is_public: true },
    { id: 'sym-6', file_path: 'src/db/connection.py', name: 'execute_transaction', symbol_type: 'function', cyclomatic_complexity: 12, param_count: 2, is_public: true },
  ],
  vulnerabilities: [
    { id: 'vuln-1', cve_id: 'CVE-2022-29217', package_name: 'PyJWT', severity: 'HIGH', cvss_score: 8.1, is_used_in_code: true },
    { id: 'vuln-2', cve_id: 'CVE-2023-30861', package_name: 'Flask', severity: 'MEDIUM', cvss_score: 6.5, is_used_in_code: false },
    { id: 'vuln-3', cve_id: 'CVE-2022-23529', package_name: 'jsonwebtoken', severity: 'CRITICAL', cvss_score: 9.8, is_used_in_code: true },
    { id: 'vuln-4', cve_id: 'CVE-2023-45857', package_name: 'axios', severity: 'MEDIUM', cvss_score: 5.3, is_used_in_code: false },
    { id: 'vuln-5', cve_id: 'CVE-2023-32681', package_name: 'requests', severity: 'MEDIUM', cvss_score: 6.1, is_used_in_code: false },
    { id: 'vuln-6', cve_id: 'CVE-2021-44228', package_name: 'log4j-core', severity: 'CRITICAL', cvss_score: 10.0, is_used_in_code: false },
  ],
  findings: [
    { id: 'DP-001', severity: 'HIGH', category: 'REGRESSION', confidence: 0.96, file_path: 'src/checkout.py', line_number: 8, status: 'open' },
    { id: 'DP-002', severity: 'CRITICAL', category: 'SECURITY', confidence: 0.94, file_path: 'src/services/auth_service.py', line_number: 16, status: 'open' },
    { id: 'DP-003', severity: 'HIGH', category: 'SECURITY', confidence: 0.91, file_path: 'requirements.txt', line_number: 2, status: 'open' },
    { id: 'DP-004', severity: 'MEDIUM', category: 'PERFORMANCE', confidence: 0.88, file_path: 'src/db/connection.py', line_number: 12, status: 'open' },
    { id: 'DP-005', severity: 'HIGH', category: 'CORRECTNESS', confidence: 0.92, file_path: 'src/payments/gateway.ts', line_number: 10, status: 'resolved' },
  ],
  code_smells: [
    { id: 'SMELL-01', category: 'security', severity: 'critical', file_path: 'src/services/auth_service.py', line: 16 },
    { id: 'SMELL-02', category: 'complexity', severity: 'warning', file_path: 'src/db/connection.py', line: 10 },
    { id: 'SMELL-03', category: 'maintainability', severity: 'info', file_path: 'src/billing.py', line: 1 },
  ],
};

export function naturalLanguageToSql(nlQuery: string): { sql: string; explanation: string } {
  const q = nlQuery.toLowerCase();

  if (q.includes('vulnerabilit') || q.includes('cve') || q.includes('security')) {
    if (q.includes('critical') || q.includes('high')) {
      return {
        sql: `SELECT cve_id, package_name, severity, cvss_score, is_used_in_code FROM vulnerabilities WHERE severity IN ('CRITICAL', 'HIGH') ORDER BY cvss_score DESC;`,
        explanation: 'Retrieving all CRITICAL and HIGH severity security vulnerabilities and CVE advisories sorted by CVSS impact.',
      };
    }
    return {
      sql: `SELECT cve_id, package_name, severity, cvss_score, is_used_in_code FROM vulnerabilities ORDER BY cvss_score DESC;`,
      explanation: 'Retrieving all discovered CVE vulnerability advisories and dependency status.',
    };
  }

  if (q.includes('finding') || q.includes('regression') || q.includes('defect') || q.includes('bug')) {
    if (q.includes('open')) {
      return {
        sql: `SELECT id, severity, category, confidence, file_path, line_number FROM findings WHERE status = 'open' ORDER BY confidence DESC;`,
        explanation: 'Querying all active, unresolved review findings with high confidence rankings.',
      };
    }
    return {
      sql: `SELECT id, severity, category, confidence, file_path, line_number, status FROM findings ORDER BY confidence DESC;`,
      explanation: 'Listing historical and active code review findings.',
    };
  }

  if (q.includes('complex') || q.includes('cyclomatic') || q.includes('function') || q.includes('symbol')) {
    return {
      sql: `SELECT name, file_path, symbol_type, cyclomatic_complexity, param_count FROM symbols WHERE cyclomatic_complexity >= 4 ORDER BY cyclomatic_complexity DESC;`,
      explanation: 'Querying functions and methods with elevated cyclomatic complexity.',
    };
  }

  if (q.includes('project') || q.includes('health') || q.includes('repo')) {
    return {
      sql: `SELECT id, name, language, health_score, last_reviewed_at FROM projects ORDER BY health_score ASC;`,
      explanation: 'Listing repository projects and their observatory health scores.',
    };
  }

  // Default query
  return {
    sql: `SELECT id, severity, category, file_path, confidence FROM findings WHERE severity = 'HIGH' OR severity = 'CRITICAL';`,
    explanation: 'Showing highest-risk findings across the project.',
  };
}

export function executeSafeReadOnlyQuery(rawSql: string): SQLQueryResult {
  const start = performance.now();
  const trimmed = rawSql.trim().replace(/;+$/, '');

  // 1. Strict Security Validation (Read-Only Enforcement)
  const upper = trimmed.toUpperCase();
  const forbiddenTokens = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'EXEC', 'CREATE', 'REPLACE', 'GRANT', 'REVOKE'];
  
  for (const token of forbiddenTokens) {
    const tokenRegex = new RegExp(`\\b${token}\\b`, 'i');
    if (tokenRegex.test(upper)) {
      return {
        query: rawSql,
        isValid: false,
        error: `Security Violation: Operation '${token}' is strictly prohibited. DevPulse Text-to-SQL enforces read-only (SELECT) access.`,
        executionTimeMs: Number((performance.now() - start).toFixed(2)),
        rows: [],
        columns: [],
      };
    }
  }

  if (!upper.startsWith('SELECT')) {
    return {
      query: rawSql,
      isValid: false,
      error: `Syntax Error: Query must begin with a valid SELECT statement.`,
      executionTimeMs: Number((performance.now() - start).toFixed(2)),
      rows: [],
      columns: [],
    };
  }

  // Determine target table
  const matchTable = upper.match(/FROM\s+([A-Za-z0-9_]+)/);
  if (!matchTable) {
    return {
      query: rawSql,
      isValid: false,
      error: `Missing FROM clause specifying valid target table.`,
      executionTimeMs: Number((performance.now() - start).toFixed(2)),
      rows: [],
      columns: [],
    };
  }

  const tableName = matchTable[1].toLowerCase();
  const validTables = ['projects', 'symbols', 'vulnerabilities', 'findings', 'code_smells'];
  if (!validTables.includes(tableName)) {
    return {
      query: rawSql,
      isValid: false,
      error: `Table '${tableName}' does not exist or is not in whitelist. Permitted tables: ${validTables.join(', ')}`,
      executionTimeMs: Number((performance.now() - start).toFixed(2)),
      rows: [],
      columns: [],
    };
  }

  const rawRows: Record<string, any>[] = (DB_RECORDS as any)[tableName] || [];
  let filtered = [...rawRows];

  // Simple in-memory filtering for WHERE clauses
  if (upper.includes('WHERE')) {
    if (upper.includes('CRITICAL') || upper.includes('HIGH')) {
      filtered = filtered.filter((r) => r.severity === 'CRITICAL' || r.severity === 'HIGH');
    }
    if (upper.includes("STATUS = 'OPEN'")) {
      filtered = filtered.filter((r) => r.status === 'open');
    }
    if (upper.includes('CYCLOMATIC_COMPLEXITY >=')) {
      filtered = filtered.filter((r) => (r.cyclomatic_complexity || 0) >= 4);
    }
  }

  // Columns projection
  const colsMatch = trimmed.match(/SELECT\s+(.+?)\s+FROM/i);
  let columns: string[] = [];
  if (colsMatch && colsMatch[1].trim() !== '*') {
    columns = colsMatch[1].split(',').map((c) => c.trim().split(/\s+AS\s+/i)[0].trim());
  } else if (filtered.length > 0) {
    columns = Object.keys(filtered[0]);
  }

  // Row limit safety (max 50)
  const rows = filtered.slice(0, 50);

  return {
    query: rawSql,
    isValid: true,
    executionTimeMs: Number((performance.now() - start).toFixed(2)),
    rows,
    columns,
    explanation: `Successfully executed read-only query on \`${tableName}\` (${rows.length} row(s) returned).`,
  };
}
