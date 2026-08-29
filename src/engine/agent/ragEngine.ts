import { RAGDocument } from '../../types';

// Curated Project Knowledge Base
const DEFAULT_RAG_CORPUS: RAGDocument[] = [
  {
    id: 'doc-arch-001',
    title: 'Order & Billing Architecture Standard',
    category: 'architecture',
    filePath: 'docs/architecture/billing.md',
    tags: ['billing', 'calculate_price', 'checkout', 'orders', 'tax', 'discount'],
    content:
      'The Billing Service calculates total order costs. All public price calculation methods must maintain backward compatibility. If new calculation factors like discount or shipping are introduced, they must be optional parameters with default values (e.g. discount=0) to prevent breaking existing cart checkout callers.',
  },
  {
    id: 'doc-sec-002',
    title: 'SQL Injection Prevention & Parameterization Policy',
    category: 'security',
    filePath: 'docs/security/sql_guidelines.md',
    tags: ['sql', 'injection', 'database', 'query', 'auth_service', 'psycopg2', 'sanitization'],
    content:
      'Direct string concatenation or f-string formatting in SQL statements is strictly prohibited (OWASP A03). All queries must use parameterized placeholders (%s in Python DB-API or $1 in PostgreSQL) to prevent authentication bypass and unauthorized data exfiltration.',
  },
  {
    id: 'doc-sec-003',
    title: 'JWT Authentication & Token Verification Standards',
    category: 'security',
    filePath: 'docs/security/jwt_standards.md',
    tags: ['jwt', 'pyjwt', 'jsonwebtoken', 'auth', 'verify_token', 'algorithms', 'cve-2022-29217'],
    content:
      'JWT decoding must explicitly whitelist acceptable cryptographic algorithms (e.g. algorithms=["HS256", "RS256"]). The "none" algorithm must never be permitted. PyJWT versions >= 2.4.0 must be pinned to avoid algorithm confusion vulnerabilities.',
  },
  {
    id: 'doc-perf-004',
    title: 'Database Connection Pool & Resource Management',
    category: 'standards',
    filePath: 'docs/standards/database_pools.md',
    tags: ['db', 'pool', 'connection', 'leak', 'execute_transaction', 'cursor', 'concurrency'],
    content:
      'Database connections acquired from connection pools must always be closed or released within a try/finally block or context manager (with pool.get_connection()). Failure to release connections causes pool exhaustion and worker thread deadlocks under concurrent traffic.',
  },
  {
    id: 'doc-api-005',
    title: 'API Response Schema & Webhook Compatibility',
    category: 'api',
    filePath: 'docs/api/payment_gateway_spec.md',
    tags: ['api', 'payment', 'chargeCustomer', 'transactionId', 'status', 'gateway'],
    content:
      'Payment API endpoints must preserve root fields `transactionId` and `status` in payment responses. Modifying top-level response properties breaks existing webhook consumers and order fulfillment workers.',
  },
  {
    id: 'doc-test-006',
    title: 'Regression Test Guidelines for Pricing Modules',
    category: 'tests',
    filePath: 'tests/test_billing.py',
    tags: ['test', 'pytest', 'calculate_price', 'regression', 'tax', 'discount'],
    content:
      'All pricing modifications must be verified against test_calculate_price_backward_compatibility and test_checkout_cart_integration to confirm zero regressions for 2-argument callers.',
  },
];

export function searchRAG(
  query: string,
  symbolNames: string[] = [],
  fileNames: string[] = [],
  limit: number = 3
): RAGDocument[] {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matchedDocs: Array<{ doc: RAGDocument; score: number }> = [];

  for (const doc of DEFAULT_RAG_CORPUS) {
    let score = 0;

    // 1. Symbol name matching (+40 per match)
    for (const sym of symbolNames) {
      if (doc.tags.includes(sym.toLowerCase()) || doc.content.toLowerCase().includes(sym.toLowerCase())) {
        score += 40;
      }
    }

    // 2. File name matching (+30 per match)
    for (const file of fileNames) {
      const base = file.split('/').pop()?.split('.')[0]?.toLowerCase() || '';
      if (doc.tags.includes(base) || doc.filePath?.toLowerCase().includes(base)) {
        score += 30;
      }
    }

    // 3. Keyword matching (+10 per term)
    for (const term of queryTerms) {
      if (doc.tags.some((t) => t.includes(term))) {
        score += 15;
      }
      if (doc.title.toLowerCase().includes(term)) {
        score += 10;
      }
      if (doc.content.toLowerCase().includes(term)) {
        score += 5;
      }
    }

    if (score > 0) {
      matchedDocs.push({
        doc: { ...doc, relevanceScore: score },
        score,
      });
    }
  }

  matchedDocs.sort((a, b) => b.score - a.score);
  return matchedDocs.slice(0, limit).map((m) => m.doc);
}
