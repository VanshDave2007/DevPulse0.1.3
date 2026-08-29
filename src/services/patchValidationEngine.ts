/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FixPlan,
  PatchFile,
  PatchHunk,
  PatchValidationResult,
  SupportedLanguage,
  UnifiedPatch,
} from '../types';

// Protected Sensitive Files Pattern
export const PROTECTED_FILE_PATTERNS: RegExp[] = [
  /^\.env(?:\..+)?$/i,
  /(?:^|\/)credentials(?:\.json|\.yml|\.yaml)?$/i,
  /(?:^|\/)secrets?(?:\.json|\.yml|\.yaml)?$/i,
  /(?:^|\/)id_rsa(?:\.pub)?$/i,
  /(?:^|\/).*\.pem$/i,
  /(?:^|\/).*\.key$/i,
  /(?:^|\/)package-lock\.json$/i,
  /(?:^|\/)pnpm-lock\.yaml$/i,
  /(?:^|\/)yarn\.lock$/i,
  /(?:^|\/)prod(?:uction)?\.(?:json|yml|yaml|env)$/i,
];

// Secret Detection Regexes
export const SECRET_PATTERNS: RegExp[] = [
  /(?:api[_-]?key|apikey|secret|token|password|auth_token)\s*[:=]\s*['"][A-Za-z0-9_\-.~+]{12,}['"]/i,
  /AIza[0-9A-Za-z-_]{35}/,
  /sk-[A-Za-z0-9]{32,}/,
  /ghp_[A-Za-z0-9]{36}/,
  /-----BEGIN (?:RSA )?PRIVATE KEY-----/,
];

// Security Risk Patterns that must not be introduced in a patch
export interface SecurityRiskDetection {
  type: string;
  pattern: RegExp;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

const INSECURE_CODE_PATTERNS: SecurityRiskDetection[] = [
  {
    type: 'RAW_SQL_CONCATENATION',
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE)\s+.*(?:\+|`.*?\$\{.*?\}.*?`)/i,
    description: 'Direct string concatenation in SQL statement detected (SQL Injection risk).',
    severity: 'CRITICAL',
  },
  {
    type: 'UNSAFE_EVAL',
    pattern: /\b(?:eval|new\s+Function)\s*\(/,
    description: 'Dynamic code execution via eval() or new Function() is unsafe.',
    severity: 'CRITICAL',
  },
  {
    type: 'COMMAND_INJECTION_RISK',
    pattern: /\b(?:child_process|exec|spawn|execSync)\s*\(\s*`.*?\$\{.*?\}|(?:\+|concat\()/i,
    description: 'Potential command injection risk with dynamic parameters.',
    severity: 'CRITICAL',
  },
  {
    type: 'SUPPRESSED_EXCEPTION',
    pattern: /catch\s*\([^)]*\)\s*\{\s*(?:\/\/.*|\/\*[\s\S]*?\*\/)?\s*\}/,
    description: 'Empty catch block silently suppressing exceptions without logging or handling.',
    severity: 'HIGH',
  },
  {
    type: 'PROTOTYPE_POLLUTION_RISK',
    pattern: /__proto__|constructor\s*\[\s*['"]prototype['"]\s*\]/,
    description: 'Direct prototype mutation risk detected.',
    severity: 'HIGH',
  },
];

export interface DetailedPatchValidationReport extends PatchValidationResult {
  securityRisks: Array<{
    file: string;
    type: string;
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  }>;
  scopeIssues: string[];
  syntaxWarnings: string[];
  lineDiffStats: {
    totalAdditions: number;
    totalDeletions: number;
    filesCount: number;
  };
  isScopeCompliant: boolean;
  isSecuritySafe: boolean;
}

/**
 * PatchValidationEngine
 * Deeply validates proposed unified patches against original source code,
 * enforces strict security boundary checks, verifies scope adherence against approved plans,
 * and detects syntax or contract breaking changes.
 */
export class PatchValidationEngine {
  /**
   * Checks whether a filename matches any protected file pattern.
   */
  public static isProtectedFile(filePath: string): boolean {
    const cleanPath = filePath.replace(/\\/g, '/');
    return PROTECTED_FILE_PATTERNS.some((pattern) => pattern.test(cleanPath));
  }

  /**
   * Checks whether code contains unredacted secrets or credentials.
   */
  public static detectSecrets(code: string): string[] {
    const findings: string[] = [];
    SECRET_PATTERNS.forEach((pattern) => {
      if (pattern.test(code)) {
        findings.push(pattern.source);
      }
    });
    return findings;
  }

  /**
   * Scans code for dangerous security risk anti-patterns introduced in the patch.
   */
  public static checkSecurityRisks(
    newCode: string,
    originalCode?: string
  ): Array<{ type: string; description: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' }> {
    const risks: Array<{ type: string; description: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' }> = [];

    for (const pat of INSECURE_CODE_PATTERNS) {
      const matchInNew = pat.pattern.test(newCode);
      const matchInOld = originalCode ? pat.pattern.test(originalCode) : false;

      // Report if newly introduced or preserved without resolution
      if (matchInNew) {
        risks.push({
          type: pat.type,
          description: pat.description + (matchInOld ? ' (Persists from original code)' : ' (Newly introduced in patch)'),
          severity: pat.severity,
        });
      }
    }

    return risks;
  }

  /**
   * Verifies that modifications stay strictly within approved scope and files.
   */
  public static verifyScopeLimits(
    patch: UnifiedPatch,
    plan: FixPlan
  ): { isCompliant: boolean; unexpectedFiles: string[]; outOfScopeIssues: string[] } {
    const unexpectedFiles = patch.files
      .map((f) => f.filePath)
      .filter((filePath) => !plan.filesToModify.includes(filePath) && !plan.filesToCreate.includes(filePath));

    const outOfScopeIssues: string[] = [];

    if (unexpectedFiles.length > 0) {
      outOfScopeIssues.push(
        `Patch modifies files outside approved scope: [${unexpectedFiles.join(', ')}]`
      );
    }

    // Check additions/deletions boundary: large modifications for small plans
    if (plan.estimatedImpact?.riskLevel === 'LOW' && patch.totalAdditions > 150) {
      outOfScopeIssues.push(
        `Patch adds ${patch.totalAdditions} lines, exceeding typical low-risk remediation threshold (150 lines).`
      );
    }

    return {
      isCompliant: outOfScopeIssues.length === 0,
      unexpectedFiles,
      outOfScopeIssues,
    };
  }

  /**
   * Primary Entry Point: Validates a full UnifiedPatch against current workspace source.
   */
  public static validatePatch(
    patch: UnifiedPatch,
    plan: FixPlan,
    currentFiles: Map<string, string>
  ): DetailedPatchValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    const filesTargeted: string[] = [];
    const filesExisting: string[] = [];
    const protectedFilesDetected: string[] = [];
    const secretsDetected: string[] = [];
    const securityRisks: Array<{
      file: string;
      type: string;
      description: string;
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    }> = [];
    const syntaxWarnings: string[] = [];

    patch.files.forEach((file) => {
      filesTargeted.push(file.filePath);

      // 1. Protected file enforcement
      if (this.isProtectedFile(file.filePath)) {
        protectedFilesDetected.push(file.filePath);
        errors.push(`Target '${file.filePath}' is a protected configuration or credential file and cannot be modified.`);
      }

      // 2. Workspace file existence check
      const currentContent = currentFiles.get(file.filePath);
      if (currentContent !== undefined) {
        filesExisting.push(file.filePath);
      } else if (!plan.filesToCreate.includes(file.filePath)) {
        errors.push(`Target file '${file.filePath}' does not exist in workspace.`);
      }

      // 3. Secret detection
      const secrets = this.detectSecrets(file.newContent);
      if (secrets.length > 0) {
        secretsDetected.push(file.filePath);
        errors.push(`Patch contains unredacted API secret or token in '${file.filePath}'.`);
      }

      // 4. Security risk anti-pattern scan
      const foundRisks = this.checkSecurityRisks(file.newContent, currentContent);
      foundRisks.forEach((risk) => {
        securityRisks.push({
          file: file.filePath,
          ...risk,
        });
        if (risk.severity === 'CRITICAL') {
          errors.push(`Critical security risk in '${file.filePath}': ${risk.description}`);
        } else {
          warnings.push(`Security advisory in '${file.filePath}': ${risk.description}`);
        }
      });

      // 5. Basic syntax & brace balance sanity check
      const openCurly = (file.newContent.match(/\{/g) || []).length;
      const closeCurly = (file.newContent.match(/\}/g) || []).length;
      if (openCurly !== closeCurly) {
        const warn = `Potential syntax mismatch in '${file.filePath}': ${openCurly} open '{' vs ${closeCurly} close '}' braces.`;
        syntaxWarnings.push(warn);
        warnings.push(warn);
      }

      const openParen = (file.newContent.match(/\(/g) || []).length;
      const closeParen = (file.newContent.match(/\)/g) || []).length;
      if (openParen !== closeParen) {
        const warn = `Potential syntax mismatch in '${file.filePath}': ${openParen} open '(' vs ${closeParen} close ')' parentheses.`;
        syntaxWarnings.push(warn);
        warnings.push(warn);
      }
    });

    // 6. Verify Scope limits
    const scopeCheck = this.verifyScopeLimits(patch, plan);
    if (!scopeCheck.isCompliant) {
      scopeCheck.outOfScopeIssues.forEach((issue) => errors.push(issue));
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      filesTargeted,
      filesExisting,
      protectedFilesDetected,
      secretsDetected,
      scopeWithinPlan: scopeCheck.isCompliant,
      isScopeCompliant: scopeCheck.isCompliant,
      isSecuritySafe: securityRisks.filter((r) => r.severity === 'CRITICAL').length === 0 && secretsDetected.length === 0,
      securityRisks,
      scopeIssues: scopeCheck.outOfScopeIssues,
      syntaxWarnings,
      lineDiffStats: {
        totalAdditions: patch.totalAdditions,
        totalDeletions: patch.totalDeletions,
        filesCount: patch.files.length,
      },
    };
  }

  /**
   * Dry-runs a patch replacement on a string content, returning the transformed code or throwing an error.
   */
  public static dryRunPatch(originalCode: string, patchFile: PatchFile): { success: boolean; result: string; error?: string } {
    try {
      if (patchFile.newContent && typeof patchFile.newContent === 'string') {
        return { success: true, result: patchFile.newContent };
      }
      return { success: false, result: originalCode, error: 'Empty patch content.' };
    } catch (err: any) {
      return { success: false, result: originalCode, error: err.message || 'Dry-run failed.' };
    }
  }
}
