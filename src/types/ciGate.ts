/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActionFinding } from '../types';

export type GateStatus = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL' | 'INCOMPLETE' | 'ERROR';

export type CIProviderType = 'GITHUB_ACTIONS' | 'GITLAB_CI' | 'GENERIC_CLI' | 'LOCAL_PRE_COMMIT';

export type CIExitCode = 0 | 1 | 2 | 3;
// 0 = PASS / PASS_WITH_WARNINGS
// 1 = POLICY_FAILURE (Quality or Security gate violated)
// 2 = EXECUTION_ERROR (DevPulse runtime error)
// 3 = INCOMPLETE (Required evidence unavailable)

export interface CIPolicyConfig {
  version: string;
  projectId?: string;
  name?: string;

  // Security Gate
  blockCriticalVulnerabilities: boolean;
  blockHighVulnerabilities: boolean;
  blockMediumVulnerabilities: boolean;
  blockSecrets: boolean;

  // Dependency Gate
  blockCriticalDependencies: boolean;
  blockHighDependencies: boolean;

  // Testing Gate
  blockTestFailures: boolean;
  requireTests: boolean;

  // Build Gate
  blockBuildFailures: boolean;
  requireBuildValidation: boolean;

  // Coverage Gate
  requireCoverage: boolean;
  minimumCoveragePercent: number; // e.g. 80

  // Regression Gate
  blockRegressions: boolean;

  // Quality & Debt Thresholds
  maximumNewCriticalFindings: number; // default 0
  maximumNewHighFindings: number;     // default 0
  maximumNewMediumFindings: number;   // default 5

  // CI Comments & Reporting (Opt-In)
  enablePrSummaryComment: boolean;
  enableInlineAnnotations: boolean;
  dryRun: boolean;
  timeoutMinutes: number;
}

export interface CIGateCheckDetail {
  id: string;
  name: string;
  category: 'SECURITY' | 'DEPENDENCY' | 'TEST' | 'BUILD' | 'COVERAGE' | 'REGRESSION' | 'QUALITY';
  status: 'PASS' | 'WARN' | 'FAIL' | 'INCOMPLETE' | 'SKIPPED';
  message: string;
  blockingReason?: string;
  evidenceCount: number;
  details?: string[];
  findings?: ActionFinding[];
}

export interface CIGateResult {
  id: string;
  runId: string;
  timestamp: number;
  provider: CIProviderType;
  status: GateStatus;
  exitCode: CIExitCode;
  policyVersion: string;
  projectId: string;
  branch: string;
  baseBranch?: string;
  commit: string;
  commitAuthor?: string;
  commitMessage?: string;
  prNumber?: number;

  // Gate breakdown checks
  checks: {
    security: CIGateCheckDetail;
    dependencies: CIGateCheckDetail;
    tests: CIGateCheckDetail;
    build: CIGateCheckDetail;
    coverage: CIGateCheckDetail;
    regression: CIGateCheckDetail;
    quality: CIGateCheckDetail;
  };

  // Findings summary categorized by baseline delta
  findingsSummary: {
    total: number;
    blockingCount: number;
    warningCount: number;
    newFindingsCount: number;
    existingDebtCount: number;
    resolvedCount: number;
    secretsDetectedCount: number;
  };

  // Concrete lists of findings
  blockingFindings: ActionFinding[];
  warnings: ActionFinding[];
  newFindings: ActionFinding[];
  existingDebtFindings: ActionFinding[];

  // Deterministic metrics snapshot
  metricsSnapshot: {
    healthScore: number;
    coveragePercent?: number;
    testsPassed: number;
    testsFailed: number;
    testsSkipped: number;
    buildStatus: 'SUCCESS' | 'FAILED' | 'UNKNOWN' | 'NOT_APPLICABLE';
    cyclomaticComplexity: number;
  };

  // Explanations (Deterministic reason first, optional AI guidance context)
  primaryBlockingReason?: string;
  markdownSummary: string;
  isDryRun: boolean;
  executionDurationMs: number;
}

export interface CIExecutionContext {
  provider: CIProviderType;
  branch?: string;
  baseBranch?: string;
  commit?: string;
  commitMessage?: string;
  prNumber?: number;
  changedFiles?: string[];
  dryRun?: boolean;
}

export const DEFAULT_CI_POLICY: CIPolicyConfig = {
  version: '1.4',
  name: 'Standard Strict Quality & Security Policy',
  blockCriticalVulnerabilities: true,
  blockHighVulnerabilities: true,
  blockMediumVulnerabilities: false,
  blockSecrets: true,
  blockCriticalDependencies: true,
  blockHighDependencies: true,
  blockTestFailures: true,
  requireTests: false,
  blockBuildFailures: true,
  requireBuildValidation: false,
  requireCoverage: false,
  minimumCoveragePercent: 80,
  blockRegressions: true,
  maximumNewCriticalFindings: 0,
  maximumNewHighFindings: 0,
  maximumNewMediumFindings: 3,
  enablePrSummaryComment: true,
  enableInlineAnnotations: false,
  dryRun: false,
  timeoutMinutes: 10,
};
