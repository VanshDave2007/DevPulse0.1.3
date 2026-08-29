import { GitDiffFile, GitDiffResult, ModifiedRange, SupportedLanguage } from '../../types';

export function detectLanguageFromPath(filePath: string): SupportedLanguage {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'py':
      return 'python';
    case 'js':
    case 'jsx':
    case 'mjs':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'java':
      return 'java';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'h':
    case 'hpp':
    case 'c':
      return 'cpp';
    case 'cs':
      return 'csharp';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'php':
      return 'php';
    case 'rb':
      return 'ruby';
    case 'sql':
      return 'sql';
    default:
      return 'generic';
  }
}

export function parseUnifiedDiff(rawDiff: string, commitId: string = 'HEAD~1...HEAD'): GitDiffResult {
  const files: GitDiffFile[] = [];
  if (!rawDiff || !rawDiff.trim()) {
    return {
      commitId,
      branch: 'main',
      files: [],
      totalAdded: 0,
      totalDeleted: 0,
      totalModified: 0,
      summary: 'No changes detected in diff.',
    };
  }

  // Split by diff header
  const fileChunks = rawDiff.split(/(?=^diff --git|\b--- a\/|\b\+\+\+ b\/)/m).filter((c) => c.trim().length > 0);

  let currentFile: Partial<GitDiffFile> | null = null;
  let totalAdded = 0;
  let totalDeleted = 0;

  const lines = rawDiff.split('\n');
  let currentOldLine = 0;
  let currentNewLine = 0;
  let inHunk = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('diff --git') || line.startsWith('--- a/')) {
      if (currentFile && currentFile.file) {
        files.push(finalizeDiffFile(currentFile));
      }

      const match = line.match(/(?:a\/|b\/)(\S+)/);
      const filePath = match ? match[1] : 'unknown_file';
      currentFile = {
        file: filePath,
        language: detectLanguageFromPath(filePath),
        status: 'modified',
        addedLines: [],
        deletedLines: [],
        modifiedRanges: [],
        rawDiff: line + '\n',
      };
      inHunk = false;
      continue;
    }

    if (line.startsWith('+++ b/')) {
      if (currentFile) {
        const match = line.match(/\+\+\+ b\/(\S+)/);
        if (match) currentFile.file = match[1];
        currentFile.language = detectLanguageFromPath(currentFile.file || '');
        currentFile.rawDiff = (currentFile.rawDiff || '') + line + '\n';
      }
      continue;
    }

    if (line.startsWith('@@')) {
      inHunk = true;
      if (currentFile) {
        currentFile.rawDiff = (currentFile.rawDiff || '') + line + '\n';
      }
      // Parse hunk header: @@ -oldStart,oldLen +newStart,newLen @@
      const hunkMatch = line.match(/@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/);
      if (hunkMatch) {
        currentOldLine = parseInt(hunkMatch[1], 10);
        currentNewLine = parseInt(hunkMatch[2], 10);
      }
      continue;
    }

    if (inHunk && currentFile) {
      currentFile.rawDiff = (currentFile.rawDiff || '') + line + '\n';

      if (line.startsWith('+') && !line.startsWith('+++')) {
        currentFile.addedLines?.push(currentNewLine);
        totalAdded++;
        currentNewLine++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        currentFile.deletedLines?.push(currentOldLine);
        totalDeleted++;
        currentOldLine++;
      } else {
        currentOldLine++;
        currentNewLine++;
      }
    }
  }

  if (currentFile && currentFile.file) {
    files.push(finalizeDiffFile(currentFile));
  }

  // Fallback: if single synthetic file
  if (files.length === 0 && rawDiff.trim().length > 0) {
    const added: number[] = [];
    const deleted: number[] = [];
    let lNo = 1;
    lines.forEach((l) => {
      if (l.startsWith('+')) added.push(lNo);
      if (l.startsWith('-')) deleted.push(lNo);
      lNo++;
    });

    files.push({
      file: 'src/modified_source.py',
      status: 'modified',
      language: 'python',
      addedLines: added,
      deletedLines: deleted,
      modifiedRanges: computeRanges(added),
      rawDiff,
    });
    totalAdded = added.length;
    totalDeleted = deleted.length;
  }

  return {
    commitId,
    branch: 'feature/optimization',
    baseBranch: 'main',
    files,
    totalAdded,
    totalDeleted,
    totalModified: files.length,
    summary: `${files.length} file(s) changed, +${totalAdded} insertions(+), -${totalDeleted} deletions(-)`,
  };
}

function computeRanges(lineNumbers: number[]): ModifiedRange[] {
  if (!lineNumbers || lineNumbers.length === 0) return [];
  const sorted = [...lineNumbers].sort((a, b) => a - b);
  const ranges: ModifiedRange[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push({ start, end });
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push({ start, end });
  return ranges;
}

function finalizeDiffFile(partial: Partial<GitDiffFile>): GitDiffFile {
  const added = partial.addedLines || [];
  const deleted = partial.deletedLines || [];
  return {
    file: partial.file || 'unknown.py',
    oldFile: partial.oldFile,
    status: partial.status || 'modified',
    language: partial.language || detectLanguageFromPath(partial.file || ''),
    addedLines: added,
    deletedLines: deleted,
    modifiedRanges: computeRanges(added),
    rawDiff: partial.rawDiff || '',
    oldContent: partial.oldContent,
    newContent: partial.newContent,
  };
}

// ----------------------------------------------------
// Demonstration Pre-Configured Change Scenarios
// ----------------------------------------------------

export interface ReviewScenario {
  id: string;
  name: string;
  category: 'Breaking Change' | 'Security Risk' | 'Performance & API' | 'Resource Leak';
  description: string;
  diff: string;
  changedCode: string;
  callerCode: string;
  callerFileName: string;
  language: SupportedLanguage;
  manifestFile?: string;
  manifestContent?: string;
  expectedDefect: string;
}

export const PRESET_REVIEW_SCENARIOS: ReviewScenario[] = [
  {
    id: 'breaking-signature',
    name: 'Breaking Signature & Contract Change (calculate_price)',
    category: 'Breaking Change',
    description:
      'A new non-optional parameter `discount` was added to `calculate_price` in billing.py, breaking un-updated caller in checkout.py with missing required argument.',
    language: 'python',
    callerFileName: 'src/checkout.py',
    diff: `diff --git a/src/billing.py b/src/billing.py
index a1b2c3d..e4f5g6h 100644
--- a/src/billing.py
+++ b/src/billing.py
@@ -1,4 +1,4 @@
-# Original Contract
-def calculate_price(price, tax):
-    return price + tax
+# Modified: Added required parameter 'discount' without default
+def calculate_price(price, tax, discount):
+    return price + tax - discount`,
    changedCode: `def calculate_price(price, tax, discount):
    """Calculates final billing total including tax and applied discount."""
    if price < 0 or tax < 0:
        raise ValueError("Invalid negative pricing")
    return (price + tax) - discount`,
    callerCode: `from src.billing import calculate_price

def process_checkout_cart(cart, user_id):
    subtotal = sum(item.price for item in cart.items)
    tax_rate = 0.08 * subtotal
    # REGRESSION BUG: Caller was NOT updated to supply 'discount' argument
    final_total = calculate_price(subtotal, tax_rate)
    return {
        "user_id": user_id,
        "total": final_total,
        "status": "APPROVED"
    }`,
    expectedDefect:
      'Missing required positional argument: calculate_price() expects 3 arguments (price, tax, discount) but caller only provided 2.',
  },
  {
    id: 'sql-injection-vuln',
    name: 'SQL Injection Vulnerability & Insecure JWT Library',
    category: 'Security Risk',
    description:
      'Refactored user lookup to use string concatenation directly in raw SQL query, combined with a deprecated, vulnerable PyJWT dependency susceptible to CVE-2022-29217 algorithm confusion.',
    language: 'python',
    callerFileName: 'src/api/routes.py',
    manifestFile: 'requirements.txt',
    manifestContent: `Flask==2.2.2
PyJWT==1.7.1
psycopg2-binary==2.9.3
requests==2.28.1`,
    diff: `diff --git a/src/services/auth_service.py b/src/services/auth_service.py
index b7c8d9e..f1a2b3c 100644
--- a/src/services/auth_service.py
+++ b/src/services/auth_service.py
@@ -14,3 +14,5 @@
-def get_user_by_email(db, email):
-    return db.query("SELECT * FROM users WHERE email = %s", (email,)).first()
+def get_user_by_email(db, email):
+    # CRITICAL: Direct string interpolation enables SQL injection
+    query = f"SELECT * FROM users WHERE email = '{email}'"
+    return db.execute(query).fetchall()`,
    changedCode: `import jwt
import os

JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key")

def get_user_by_email(db, email):
    # Unsanitized string interpolation directly in SQL
    query = f"SELECT * FROM users WHERE email = '{email}'"
    return db.execute(query).fetchall()

def verify_token(token):
    # PyJWT 1.7.1 allows algorithm confusion bypass
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256", "none"])`,
    callerCode: `from src.services.auth_service import get_user_by_email, verify_token

def login_handler(request, db):
    user_email = request.json.get("email")
    user = get_user_by_email(db, user_email)
    if not user:
        return {"error": "User not found"}, 404
    return {"user": user[0]}, 200`,
    expectedDefect:
      'SQL Injection vulnerability via unsanitized f-string formatting in SQL query + PyJWT 1.7.1 CVE-2022-29217 key confusion vulnerability.',
  },
  {
    id: 'api-return-mismatch',
    name: 'API Contract & Return Type Schema Regression',
    category: 'Performance & API',
    description:
      'Changed payment response schema from `{ transactionId, status }` to `{ payment: { id, state } }`, breaking downstream webhook and receipt generators.',
    language: 'typescript',
    callerFileName: 'src/services/orderService.ts',
    diff: `diff --git a/src/payments/gateway.ts b/src/payments/gateway.ts
index c9d8e7f..a1b2c3d 100644
--- a/src/payments/gateway.ts
+++ b/src/payments/gateway.ts
@@ -8,4 +8,4 @@
-export async function chargeCustomer(amount: number, token: string) {
-  return { transactionId: "txn_" + Date.now(), status: "SUCCESS" };
+export async function chargeCustomer(amount: number, token: string) {
+  return { payment: { id: "txn_" + Date.now(), state: "COMPLETED" }, timestamp: Date.now() };
 }`,
    changedCode: `export async function chargeCustomer(amount: number, token: string) {
  // Breaking return signature schema change
  return {
    payment: {
      id: "txn_" + Date.now(),
      state: "COMPLETED",
    },
    timestamp: Date.now(),
  };
}`,
    callerCode: `import { chargeCustomer } from './gateway';

export async function fulfillOrder(orderId: string, amount: number, cardToken: string) {
  const result = await chargeCustomer(amount, cardToken);
  
  // BREAKING REGRESSION: result.transactionId is now undefined!
  if (result.status === "SUCCESS") {
    console.log("Fulfilling transaction:", result.transactionId);
    return { orderId, txn: result.transactionId, success: true };
  }
  
  throw new Error("Payment rejected: " + result.status);
}`,
    expectedDefect:
      'Return type schema modification: `result.transactionId` and `result.status` are undefined, causing silent failure and uncaught payment exceptions.',
  },
  {
    id: 'resource-leak-concurrency',
    name: 'Unclosed Database Connection & Circular Dependency Cycle',
    category: 'Resource Leak',
    description:
      'Database connection cursor is not closed in finally block, causing pooled connection exhaustion during high-concurrency spikes, with mutual imports between notification and user service.',
    language: 'python',
    callerFileName: 'src/workers/notification_worker.py',
    diff: `diff --git a/src/db/connection.py b/src/db/connection.py
index d1e2f3a..b4c5d6e 100644
--- a/src/db/connection.py
+++ b/src/db/connection.py
@@ -10,4 +10,4 @@
-def execute_transaction(pool, query):
-    with pool.get_connection() as conn:
-        return conn.execute(query)
+def execute_transaction(pool, query):
+    conn = pool.get_connection()
+    return conn.execute(query) # Missing conn.close() in finally block!`,
    changedCode: `def execute_transaction(pool, query):
    conn = pool.get_connection()
    # Missing try/finally block to ensure conn.close() / release back to pool
    cursor = conn.cursor()
    cursor.execute(query)
    results = cursor.fetchall()
    return results`,
    callerCode: `from src.db.connection import execute_transaction

def batch_notify_users(user_ids, pool):
    for uid in user_ids:
        # Rapid loop opens dozens of unclosed connections, exhausting the pool
        user_data = execute_transaction(pool, f"SELECT * FROM users WHERE id = {uid}")
        print("Notifying user:", user_data)`,
    expectedDefect:
      'Connection leak in `execute_transaction`: acquired DB connection is never returned to connection pool, causing worker thread starvation.',
  },
];
