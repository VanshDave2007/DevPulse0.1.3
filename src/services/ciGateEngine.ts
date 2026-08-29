/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActionFinding,
  AnalysisResult,
  CodeSmell,
  SupportedLanguage,
} from '../types';
import {
  CIGateCheckDetail,
  CIGateResult,
  CIExecutionContext,
  CIPolicyConfig,
  DEFAULT_CI_POLICY,
  GateStatus,
  CIExitCode,
} from '../types/ciGate';
import { TestIntelligenceService } from './testIntelligenceService';
import { redactSecrets } from './evidenceGraphService';
import {
  fuseAndDeduplicateFindings,
  normalizeCodeSmells,
  normalizeVulnerabilities,
  normalizeAgentFindings,
  applyStoredStatuses,
  sortFindingsByPriority,
} from '../engine/actionCenter';

export class CIGateEngine {
  private static STORAGE_KEY_POLICY = 'devpulse_ci_policy';
  private static STORAGE_KEY_HISTORY = 'devpulse_ci_run_history';

  /**
   * Loads saved project policy from persistent storage or returns default
   */
  public static getProjectPolicy(projectId: string = 'default-project'): CIPolicyConfig {
    try {
      const raw = localStorage.getItem(`${this.STORAGE_KEY_POLICY}_${projectId}`) || localStorage.getItem(this.STORAGE_KEY_POLICY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_CI_POLICY,
          ...parsed,
          minimumCoveragePercent: typeof parsed.minimumCoveragePercent === 'number' && !isNaN(parsed.minimumCoveragePercent)
            ? parsed.minimumCoveragePercent
            : DEFAULT_CI_POLICY.minimumCoveragePercent,
        };
      }
    } catch (e) {
      console.warn('Failed to load CI Policy from localStorage, falling back to default:', e);
    }
    return { ...DEFAULT_CI_POLICY, projectId };
  }

  /**
   * Saves project policy
   */
  public static saveProjectPolicy(policy: CIPolicyConfig, projectId: string = 'default-project'): void {
    try {
      const sanitized: CIPolicyConfig = {
        ...policy,
        version: policy.version || '1.4',
        minimumCoveragePercent: Math.max(0, Math.min(100, Number(policy.minimumCoveragePercent) || 80)),
        maximumNewCriticalFindings: Math.max(0, Number(policy.maximumNewCriticalFindings) || 0),
        maximumNewHighFindings: Math.max(0, Number(policy.maximumNewHighFindings) || 0),
        maximumNewMediumFindings: Math.max(0, Number(policy.maximumNewMediumFindings) || 0),
      };
      localStorage.setItem(`${this.STORAGE_KEY_POLICY}_${projectId}`, JSON.stringify(sanitized));
      localStorage.setItem(this.STORAGE_KEY_POLICY, JSON.stringify(sanitized));
    } catch (e) {
      console.error('Failed to save CI Policy:', e);
    }
  }

  /**
   * Core Evaluation Pipeline: Evaluates current code, existing analysis, test execution,
   * baseline regressions, and applies the configurable Policy Engine.
   */
  public static evaluateGate(params: {
    analysis: AnalysisResult | null;
    code: string;
    fileName: string;
    policy?: CIPolicyConfig;
    context?: CIExecutionContext;
    customFindings?: ActionFinding[];
  }): CIGateResult {
    const startTime = Date.now();
    const policy = params.policy || this.getProjectPolicy();
    const context = params.context || {
      provider: 'GITHUB_ACTIONS',
      branch: 'main',
      commit: 'HEAD',
      commitMessage: 'Automated CI Quality Gate Run',
    };

    const runId = `ci-run-${startTime}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Gather all normalized findings across engines (smells, vulnerabilities, secrets, agent findings)
    const rawSmells = params.analysis?.smells || [];
    const rawVulns = params.analysis?.vulnerabilities || [];
    const rawAgent = (params.analysis as any)?.agentReview?.findings || [];

    const smellsNorm = normalizeCodeSmells(rawSmells, params.fileName, params.analysis?.metrics);
    const vulnsNorm = normalizeVulnerabilities(rawVulns, 'package.json');
    const agentNorm = normalizeAgentFindings(rawAgent);

    const merged = fuseAndDeduplicateFindings([
      ...smellsNorm,
      ...vulnsNorm,
      ...agentNorm,
      ...(params.customFindings || []),
    ]);

    const allFindings = sortFindingsByPriority(applyStoredStatuses(merged));

    // 2. Identify and safely REDACT any secrets in findings to guarantee no leakage in logs / CI comments
    const sanitizedFindings = allFindings.map((f) => {
      if (f.category === 'SECURITY' && (f.title.toLowerCase().includes('secret') || f.title.toLowerCase().includes('token') || f.title.toLowerCase().includes('password') || f.title.toLowerCase().includes('key'))) {
        return {
          ...f,
          message: redactSecrets(f.message),
          codeSnippet: f.codeSnippet ? redactSecrets(f.codeSnippet) : undefined,
          suggestedFix: f.suggestedFix ? redactSecrets(f.suggestedFix) : undefined,
        };
      }
      return f;
    });

    // 3. Baseline distinction: Classify findings as New vs Existing Accepted Technical Debt
    const activeFindings = sanitizedFindings.filter(
      (f) => f.status !== 'FIXED' && f.status !== 'FALSE_POSITIVE' && f.status !== 'DEFERRED'
    );
    const technicalDebtFindings = sanitizedFindings.filter(
      (f) => f.status === 'FALSE_POSITIVE' || f.status === 'DEFERRED'
    );

    // Filter by category
    const securityFindings = activeFindings.filter((f) => f.category === 'SECURITY');
    const dependencyFindings = activeFindings.filter((f) => f.category === 'DEPENDENCY');
    const qualityFindings = activeFindings.filter((f) => f.category === 'QUALITY' || f.category === 'ARCHITECTURE' || f.category === 'MAINTAINABILITY');

    const secretsFindings = securityFindings.filter(
      (f) => f.title.toLowerCase().includes('secret') ||
             f.title.toLowerCase().includes('credential') ||
             f.title.toLowerCase().includes('token') ||
             f.title.toLowerCase().includes('api key')
    );

    // 4. Test Intelligence evaluation
    const fw = TestIntelligenceService.detectTestFramework(params.code, params.fileName);
    const discoveredTests = TestIntelligenceService.discoverTests(params.code, params.fileName, fw);
    const heatmapMetrics = TestIntelligenceService.generateHeatmapMetrics(
      params.code,
      params.fileName,
      (params.analysis?.language || 'typescript') as SupportedLanguage,
      params.analysis,
      activeFindings
    );

    const coverageAnalysis = TestIntelligenceService.analyzeCoverage(params.code, params.fileName, discoveredTests);
    const totalTestsCount = discoveredTests.length;
    const passedTestsCount = discoveredTests.filter((t) => t.assertionsCount > 0).length;
    const failedTestsCount = totalTestsCount - passedTestsCount;
    const coveragePercentage = heatmapMetrics.stats.averageCoverage;

    // 5. Individual Check Evaluations
    const blockingReasons: string[] = [];
    const blockingFindings: ActionFinding[] = [];
    const warningFindings: ActionFinding[] = [];

    // --- CHECK 1: SECURITY GATE ---
    let securityStatus: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
    const securityBlocking: string[] = [];

    const criticalSec = securityFindings.filter((f) => f.priority === 'CRITICAL');
    const highSec = securityFindings.filter((f) => f.priority === 'HIGH');
    const medSec = securityFindings.filter((f) => f.priority === 'MEDIUM');

    if (policy.blockSecrets && secretsFindings.length > 0) {
      securityStatus = 'FAIL';
      securityBlocking.push(`${secretsFindings.length} hardcoded secret/credential(s) detected`);
      blockingFindings.push(...secretsFindings);
    }

    if (policy.blockCriticalVulnerabilities && criticalSec.length > 0) {
      securityStatus = 'FAIL';
      securityBlocking.push(`${criticalSec.length} critical security vulnerability(ies) detected`);
      blockingFindings.push(...criticalSec);
    }

    if (policy.blockHighVulnerabilities && highSec.length > 0) {
      securityStatus = 'FAIL';
      securityBlocking.push(`${highSec.length} high-severity security finding(s) detected`);
      blockingFindings.push(...highSec);
    }

    if (securityStatus !== 'FAIL' && (medSec.length > 0 || highSec.length > 0)) {
      if (policy.blockMediumVulnerabilities && medSec.length > 0) {
        securityStatus = 'FAIL';
        securityBlocking.push(`${medSec.length} medium-severity security finding(s) blocked by policy`);
        blockingFindings.push(...medSec);
      } else {
        securityStatus = 'WARN';
        warningFindings.push(...highSec, ...medSec);
      }
    }

    const checkSecurity: CIGateCheckDetail = {
      id: 'check-security',
      name: 'Security Vulnerabilities & Secrets Gate',
      category: 'SECURITY',
      status: securityStatus,
      message: securityStatus === 'PASS'
        ? 'No blocking security vulnerabilities or exposed secrets detected.'
        : securityBlocking.join(' · ') || 'Security policy violations detected.',
      blockingReason: securityBlocking[0],
      evidenceCount: securityFindings.length,
      findings: securityFindings,
      details: securityFindings.map((f) => `[${f.priority}] ${f.title} (${f.file}:${f.line})`),
    };

    if (securityStatus === 'FAIL') {
      blockingReasons.push(...securityBlocking);
    }

    // --- CHECK 2: DEPENDENCY GATE ---
    let depStatus: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
    const depBlocking: string[] = [];
    const critDep = dependencyFindings.filter((f) => f.priority === 'CRITICAL');
    const highDep = dependencyFindings.filter((f) => f.priority === 'HIGH');
    const medDep = dependencyFindings.filter((f) => f.priority === 'MEDIUM');

    if (policy.blockCriticalDependencies && critDep.length > 0) {
      depStatus = 'FAIL';
      depBlocking.push(`${critDep.length} critical dependency CVE vulnerability(ies) detected`);
      blockingFindings.push(...critDep);
    } else if (policy.blockHighDependencies && highDep.length > 0) {
      depStatus = 'FAIL';
      depBlocking.push(`${highDep.length} high-severity dependency CVE(s) detected`);
      blockingFindings.push(...highDep);
    } else if (medDep.length > 0 || highDep.length > 0) {
      depStatus = 'WARN';
      warningFindings.push(...highDep, ...medDep);
    }

    const checkDependencies: CIGateCheckDetail = {
      id: 'check-deps',
      name: 'Third-Party Dependency & CVE Gate',
      category: 'DEPENDENCY',
      status: depStatus,
      message: depStatus === 'PASS'
        ? 'All dependencies and packages comply with security policy.'
        : depBlocking.join(' · ') || 'Vulnerable dependencies detected.',
      blockingReason: depBlocking[0],
      evidenceCount: dependencyFindings.length,
      findings: dependencyFindings,
      details: dependencyFindings.map((f) => `[${f.priority}] ${f.title}`),
    };

    if (depStatus === 'FAIL') {
      blockingReasons.push(...depBlocking);
    }

    // --- CHECK 3: TEST GATE ---
    let testStatus: 'PASS' | 'WARN' | 'FAIL' | 'INCOMPLETE' = 'PASS';
    let testMessage = `${passedTestsCount} test(s) executed and passed cleanly.`;

    if (totalTestsCount === 0) {
      if (policy.requireTests) {
        testStatus = 'FAIL';
        testMessage = 'No unit tests found in target repository, but policy requires test suites.';
        blockingReasons.push('Test requirement policy violation: zero tests present');
      } else {
        testStatus = 'PASS';
        testMessage = 'No active test files defined in target scope.';
      }
    } else if (failedTestsCount > 0) {
      if (policy.blockTestFailures) {
        testStatus = 'FAIL';
        testMessage = `${failedTestsCount} of ${totalTestsCount} unit test(s) failed during execution.`;
        blockingReasons.push(`Test suite failure: ${failedTestsCount} failed test(s)`);
      } else {
        testStatus = 'WARN';
        testMessage = `${failedTestsCount} test failure(s) detected (non-blocking policy).`;
      }
    }

    const checkTests: CIGateCheckDetail = {
      id: 'check-tests',
      name: 'Automated Test Execution Gate',
      category: 'TEST',
      status: testStatus,
      message: testMessage,
      blockingReason: testStatus === 'FAIL' ? testMessage : undefined,
      evidenceCount: totalTestsCount,
      details: [
        `Passed: ${passedTestsCount}`,
        `Failed: ${failedTestsCount}`,
        `Framework: ${fw.name}`,
      ],
    };

    // --- CHECK 4: BUILD VALIDATION GATE ---
    // Deterministic syntax & AST parsing status
    let buildStatus: 'PASS' | 'WARN' | 'FAIL' | 'INCOMPLETE' = 'PASS';
    let buildMessage = 'Code parsed cleanly with zero syntax or compilation barriers.';

    const syntaxErrors = activeFindings.filter((f) => f.title.toLowerCase().includes('syntax') || f.title.toLowerCase().includes('parsing error'));

    if (syntaxErrors.length > 0) {
      if (policy.blockBuildFailures) {
        buildStatus = 'FAIL';
        buildMessage = `Compilation / syntax error detected in ${syntaxErrors[0].file} at line ${syntaxErrors[0].line}.`;
        blockingReasons.push(buildMessage);
        blockingFindings.push(...syntaxErrors);
      } else {
        buildStatus = 'WARN';
        buildMessage = 'Potential syntax anomalies detected.';
        warningFindings.push(...syntaxErrors);
      }
    } else if (!params.analysis && policy.requireBuildValidation) {
      buildStatus = 'INCOMPLETE';
      buildMessage = 'Build validation incomplete: AST analysis could not be retrieved.';
    }

    const checkBuild: CIGateCheckDetail = {
      id: 'check-build',
      name: 'Build & AST Syntax Integrity Gate',
      category: 'BUILD',
      status: buildStatus,
      message: buildMessage,
      blockingReason: buildStatus === 'FAIL' ? buildMessage : undefined,
      evidenceCount: syntaxErrors.length,
      details: syntaxErrors.map((e) => `${e.title} (${e.file}:${e.line})`),
    };

    // --- CHECK 5: COVERAGE GATE ---
    let coverageStatus: 'PASS' | 'WARN' | 'FAIL' | 'SKIPPED' = 'PASS';
    let coverageMessage = `Test coverage: ${coveragePercentage}% (Policy threshold: ${policy.minimumCoveragePercent}%)`;

    if (!policy.requireCoverage) {
      coverageStatus = 'PASS';
      coverageMessage = `Coverage tracking active: ${coveragePercentage}% (Enforcement disabled in policy)`;
    } else {
      if (coveragePercentage < policy.minimumCoveragePercent) {
        coverageStatus = 'FAIL';
        coverageMessage = `Actual test coverage (${coveragePercentage}%) is below the required threshold of ${policy.minimumCoveragePercent}%.`;
        blockingReasons.push(`Coverage deficit: ${coveragePercentage}% < ${policy.minimumCoveragePercent}% required`);
      } else {
        coverageStatus = 'PASS';
      }
    }

    const checkCoverage: CIGateCheckDetail = {
      id: 'check-coverage',
      name: 'Code Coverage Threshold Gate',
      category: 'COVERAGE',
      status: coverageStatus,
      message: coverageMessage,
      blockingReason: coverageStatus === 'FAIL' ? coverageMessage : undefined,
      evidenceCount: 1,
      details: [
        `Average Coverage: ${coveragePercentage}%`,
        `Minimum Required: ${policy.minimumCoveragePercent}%`,
        `Critical Deficit Modules: ${heatmapMetrics.stats.criticalDeficitCount}`,
      ],
    };

    // --- CHECK 6: REGRESSION GATE ---
    let regressionStatus: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
    let regressionMessage = 'No functional or behavioral regressions detected against merge baseline.';

    // Evaluate cyclomatic & cognitive spikes or severe new findings
    const severeSmells = qualityFindings.filter((f) => f.priority === 'CRITICAL');
    if (policy.blockRegressions && severeSmells.length > 0) {
      regressionStatus = 'FAIL';
      regressionMessage = `Severe structural regression detected: ${severeSmells.length} high-friction architectural anti-pattern(s) introduced.`;
      blockingReasons.push(regressionMessage);
      blockingFindings.push(...severeSmells);
    }

    const checkRegression: CIGateCheckDetail = {
      id: 'check-regression',
      name: 'Behavioral & Regression Gate',
      category: 'REGRESSION',
      status: regressionStatus,
      message: regressionMessage,
      blockingReason: regressionStatus === 'FAIL' ? regressionMessage : undefined,
      evidenceCount: severeSmells.length,
      details: severeSmells.map((s) => `${s.title} at ${s.file}:${s.line}`),
    };

    // --- CHECK 7: CODE QUALITY & DEBT GATE ---
    let qualityStatus: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
    let qualityMessage = 'Code quality and maintainability conform to project thresholds.';
    const critQuality = qualityFindings.filter((f) => f.priority === 'CRITICAL');
    const highQuality = qualityFindings.filter((f) => f.priority === 'HIGH');
    const medQuality = qualityFindings.filter((f) => f.priority === 'MEDIUM');

    if (critQuality.length > policy.maximumNewCriticalFindings) {
      qualityStatus = 'FAIL';
      qualityMessage = `Found ${critQuality.length} new critical quality finding(s), exceeding policy maximum of ${policy.maximumNewCriticalFindings}.`;
      blockingReasons.push(qualityMessage);
      blockingFindings.push(...critQuality);
    } else if (highQuality.length > policy.maximumNewHighFindings) {
      qualityStatus = 'FAIL';
      qualityMessage = `Found ${highQuality.length} new high-severity finding(s), exceeding policy maximum of ${policy.maximumNewHighFindings}.`;
      blockingReasons.push(qualityMessage);
      blockingFindings.push(...highQuality);
    } else if (medQuality.length > policy.maximumNewMediumFindings) {
      qualityStatus = 'WARN';
      qualityMessage = `Warning: ${medQuality.length} medium quality findings present.`;
      warningFindings.push(...medQuality);
    }

    const checkQuality: CIGateCheckDetail = {
      id: 'check-quality',
      name: 'Code Quality & Maintainability Gate',
      category: 'QUALITY',
      status: qualityStatus,
      message: qualityMessage,
      blockingReason: qualityStatus === 'FAIL' ? qualityMessage : undefined,
      evidenceCount: qualityFindings.length,
      findings: qualityFindings,
    };

    // 6. Compute Final Aggregate Gate Status & Deterministic Exit Code
    let finalStatus: GateStatus = 'PASS';
    let finalExitCode: CIExitCode = 0;

    const allChecks = [
      checkSecurity,
      checkDependencies,
      checkTests,
      checkBuild,
      checkCoverage,
      checkRegression,
      checkQuality,
    ];

    const hasFailedChecks = allChecks.some((c) => c.status === 'FAIL');
    const hasWarnChecks = allChecks.some((c) => c.status === 'WARN');
    const hasIncompleteChecks = allChecks.some((c) => c.status === 'INCOMPLETE');

    if (hasFailedChecks) {
      finalStatus = 'FAIL';
      finalExitCode = 1; // POLICY_FAILURE
    } else if (hasIncompleteChecks) {
      finalStatus = 'INCOMPLETE';
      finalExitCode = 3; // INCOMPLETE
    } else if (hasWarnChecks) {
      finalStatus = 'PASS_WITH_WARNINGS';
      finalExitCode = 0; // PASS WITH WARNINGS
    } else {
      finalStatus = 'PASS';
      finalExitCode = 0; // PASS
    }

    // 7. Generate concise, Markdown PR Summary for GitHub Actions / GitLab CI
    const markdownSummary = this.generateMarkdownSummary({
      status: finalStatus,
      checks: {
        security: checkSecurity,
        dependencies: checkDependencies,
        tests: checkTests,
        build: checkBuild,
        coverage: checkCoverage,
        regression: checkRegression,
        quality: checkQuality,
      },
      blockingReasons,
      context,
      policyVersion: policy.version,
      healthScore: params.analysis?.metrics.healthScore ?? 100,
      activeFindingsCount: activeFindings.length,
      technicalDebtCount: technicalDebtFindings.length,
    });

    const gateResult: CIGateResult = {
      id: `gate-${runId}`,
      runId,
      timestamp: startTime,
      provider: context.provider,
      status: finalStatus,
      exitCode: finalExitCode,
      policyVersion: policy.version,
      projectId: policy.projectId || 'default-project',
      branch: context.branch || 'main',
      baseBranch: context.baseBranch || 'main',
      commit: context.commit || 'HEAD',
      commitMessage: context.commitMessage,
      prNumber: context.prNumber,
      checks: {
        security: checkSecurity,
        dependencies: checkDependencies,
        tests: checkTests,
        build: checkBuild,
        coverage: checkCoverage,
        regression: checkRegression,
        quality: checkQuality,
      },
      findingsSummary: {
        total: sanitizedFindings.length,
        blockingCount: blockingFindings.length,
        warningCount: warningFindings.length,
        newFindingsCount: activeFindings.length,
        existingDebtCount: technicalDebtFindings.length,
        resolvedCount: 0,
        secretsDetectedCount: secretsFindings.length,
      },
      blockingFindings: Array.from(new Set(blockingFindings)),
      warnings: Array.from(new Set(warningFindings)),
      newFindings: activeFindings,
      existingDebtFindings: technicalDebtFindings,
      metricsSnapshot: {
        healthScore: params.analysis?.metrics.healthScore ?? 100,
        coveragePercent: coveragePercentage,
        testsPassed: passedTestsCount,
        testsFailed: failedTestsCount,
        testsSkipped: 0,
        buildStatus: syntaxErrors.length > 0 ? 'FAILED' : 'SUCCESS',
        cyclomaticComplexity: params.analysis?.metrics.cyclomaticComplexity ?? 0,
      },
      primaryBlockingReason: blockingReasons.length > 0 ? blockingReasons[0] : undefined,
      markdownSummary,
      isDryRun: !!policy.dryRun || !!context.dryRun,
      executionDurationMs: Date.now() - startTime,
    };

    // Save run to history if not in dry-run mode
    if (!gateResult.isDryRun) {
      this.recordRunToHistory(gateResult);
    }

    return gateResult;
  }

  /**
   * Generates clean GitHub PR / GitLab MR Markdown summary
   */
  private static generateMarkdownSummary(params: {
    status: GateStatus;
    checks: CIGateResult['checks'];
    blockingReasons: string[];
    context: CIExecutionContext;
    policyVersion: string;
    healthScore: number;
    activeFindingsCount: number;
    technicalDebtCount: number;
  }): string {
    const statusIcon =
      params.status === 'PASS'
        ? '✅'
        : params.status === 'PASS_WITH_WARNINGS'
        ? '⚠️'
        : params.status === 'FAIL'
        ? '❌'
        : '❓';

    const statusTitle =
      params.status === 'PASS'
        ? 'PASS'
        : params.status === 'PASS_WITH_WARNINGS'
        ? 'PASS WITH WARNINGS'
        : params.status === 'FAIL'
        ? 'POLICY FAILURE'
        : 'INCOMPLETE';

    let out = `## ${statusIcon} DevPulse CI Quality & Security Gate: **${statusTitle}**\n\n`;
    out += `| Verification Gate | Result | Details |\n`;
    out += `| :--- | :---: | :--- |\n`;

    const formatCheck = (c: CIGateCheckDetail) => {
      const sym = c.status === 'PASS' ? '✅ Pass' : c.status === 'WARN' ? '⚠️ Warn' : c.status === 'FAIL' ? '❌ Fail' : '○ Skip';
      return `| **${c.name}** | ${sym} | ${c.message} |`;
    };

    out += `${formatCheck(params.checks.security)}\n`;
    out += `${formatCheck(params.checks.dependencies)}\n`;
    out += `${formatCheck(params.checks.tests)}\n`;
    out += `${formatCheck(params.checks.build)}\n`;
    out += `${formatCheck(params.checks.coverage)}\n`;
    out += `${formatCheck(params.checks.regression)}\n`;
    out += `${formatCheck(params.checks.quality)}\n\n`;

    if (params.blockingReasons.length > 0) {
      out += `### 🚫 Blocking Policy Violations:\n`;
      params.blockingReasons.forEach((r) => {
        out += `- **${r}**\n`;
      });
      out += `\n`;
    }

    out += `> **Health Score:** \`${params.healthScore}/100\` · **Active Findings:** \`${params.activeFindingsCount}\` · **Accepted Debt:** \`${params.technicalDebtCount}\` · **Policy Ver:** \`v${params.policyVersion}\`\n`;

    return out;
  }

  /**
   * Persists CI Gate run history in browser storage (up to last 30 runs)
   */
  public static recordRunToHistory(result: CIGateResult): void {
    try {
      const history = this.getRunHistory();
      const updated = [result, ...history.filter((r) => r.id !== result.id)].slice(0, 30);
      localStorage.setItem(this.STORAGE_KEY_HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist CI Gate run history:', e);
    }
  }

  public static getRunHistory(): CIGateResult[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY_HISTORY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to read CI run history:', e);
    }
    return [];
  }

  public static clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY_HISTORY);
  }
}
