/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  X,
  Check,
  Copy,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Flame,
  Zap,
  Code2,
  Play,
  RotateCcw,
  CheckCircle2,
  FileCode,
  FileCheck,
  FileX,
  Layers,
  TestTube2,
  ThumbsUp,
  ThumbsDown,
  Lock,
  LockOpen,
  GitCommit,
  GitPullRequest,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Terminal,
  Activity,
  RefreshCw,
  Info,
  Sliders,
  HelpCircle,
  AlertCircle,
  FileEdit,
  Eye,
  CheckSquare,
  Ban,
  FlaskConical,
  GraduationCap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ActionFinding,
  CandidateTest,
  CodeSmell,
  ComprehensiveVerificationReport,
  DiscoveredTestCase,
  FixPlan,
  KnowledgeLevel,
  PatchValidationResult,
  RegressionCheckResult,
  RemediationAuditRecord,
  RemediationStepPhase,
  SecurityVerificationResult,
  StructuredFixExplanation,
  TestCoverageTelemetry,
  TestGapItem,
  TestVerificationResult,
  UnifiedPatch,
  VerificationState,
} from '../types';
import { usePulseAI } from '../hooks/usePulseAI';
import { AgenticFixEngine } from '../services/agenticFixEngine';
import { normalizeCodeSmells, saveFindingStatus } from '../engine/actionCenter';
import { TestIntelligenceService } from '../services/testIntelligenceService';
import { VerificationService } from '../services/verificationService';

interface FixModalProps {
  isOpen: boolean;
  onClose: () => void;
  smell: CodeSmell | null;
  actionFinding?: ActionFinding | null;
  onVerifiedFixApplied?: (findingId: string) => void;
}

type DiffDisplayMode = 'unified' | 'split' | 'edit';

export const FixModal: React.FC<FixModalProps> = ({
  isOpen,
  onClose,
  smell,
  actionFinding,
  onVerifiedFixApplied,
}) => {
  const {
    code,
    language,
    fileName,
    setCode,
    setActiveTab,
    analyzeCurrentCode,
    personalizationProfile,
    analysis,
    addToast,
  } = useApp();
  const { sendRequest, isLoading: isAiLoading } = usePulseAI({ scope: 'analyzer' });

  const [activeSubTab, setActiveSubTab] = useState<'plan' | 'diff' | 'tests' | 'verification' | 'feedback'>('plan');
  const [phase, setPhase] = useState<RemediationStepPhase>('IDLE');
  const [fixPlan, setFixPlan] = useState<FixPlan | null>(null);
  const [unifiedPatch, setUnifiedPatch] = useState<UnifiedPatch | null>(null);
  const [patchValidation, setPatchValidation] = useState<PatchValidationResult | null>(null);
  const [testResults, setTestResults] = useState<TestVerificationResult | null>(null);
  const [securityResults, setSecurityResults] = useState<SecurityVerificationResult | null>(null);
  const [regressionResults, setRegressionResults] = useState<RegressionCheckResult | null>(null);
  const [verificationState, setVerificationState] = useState<VerificationState>('NOT_VERIFIED');
  const [comprehensiveReport, setComprehensiveReport] = useState<ComprehensiveVerificationReport | null>(null);
  const [checkpointId, setCheckpointId] = useState<string | null>(null);
  const [expandedLogStage, setExpandedLogStage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Initial code snapshot when modal opened (for conflict detection)
  const [initialCodeSnapshot, setInitialCodeSnapshot] = useState<string>('');
  const [conflictDetected, setConflictDetected] = useState<boolean>(false);

  // Structured Explanation & Knowledge Level
  const [knowledgeLevel, setKnowledgeLevel] = useState<KnowledgeLevel>(
    personalizationProfile?.knowledge_level || 'intermediate'
  );
  const [structuredExplanation, setStructuredExplanation] = useState<StructuredFixExplanation | null>(null);

  // Test Intelligence State
  const [discoveredTests, setDiscoveredTests] = useState<DiscoveredTestCase[]>([]);
  const [candidateTests, setCandidateTests] = useState<CandidateTest[]>([]);
  const [testGaps, setTestGaps] = useState<TestGapItem[]>([]);
  const [coverageTelemetry, setCoverageTelemetry] = useState<TestCoverageTelemetry | null>(null);
  const [selectedCandidateTest, setSelectedCandidateTest] = useState<CandidateTest | null>(null);
  const [copiedTestIdx, setCopiedTestIdx] = useState<number | null>(null);

  // Execution & Diff State
  const [isApplying, setIsApplying] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [isReverted, setIsReverted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [diffMode, setDiffMode] = useState<DiffDisplayMode>('unified');
  const [editableCode, setEditableCode] = useState<string>('');

  // Rejection & Feedback State
  const [showRejectMenu, setShowRejectMenu] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('Incorrect logic');
  const [rejectionNotes, setRejectionNotes] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>('');

  // QA Simulation Scenario State
  const [activeSimulationScenario, setActiveSimulationScenario] = useState<string>('DEFAULT');

  // Normalize input into ActionFinding
  const targetFinding: ActionFinding | null = useMemo(() => {
    if (actionFinding) return actionFinding;
    if (smell) {
      const normalized = normalizeCodeSmells([smell], fileName, analysis?.metrics);
      return normalized[0] || null;
    }
    return null;
  }, [actionFinding, smell, fileName, analysis]);

  useEffect(() => {
    if (isOpen && targetFinding) {
      setIsApplied(false);
      setIsReverted(false);
      setCopied(false);
      setConflictDetected(false);
      setShowRejectMenu(false);
      setFeedbackSubmitted(false);
      setFeedbackText('');
      setComprehensiveReport(null);
      setVerificationState('NOT_VERIFIED');
      setInitialCodeSnapshot(code);
      initiateRemediationWorkflow();
    }
  }, [isOpen, targetFinding]);

  // Update structured explanation when knowledge level changes
  useEffect(() => {
    if (targetFinding && fixPlan) {
      const expl = AgenticFixEngine.generateStructuredExplanation(
        targetFinding,
        fixPlan,
        unifiedPatch,
        knowledgeLevel
      );
      setStructuredExplanation(expl);
    }
  }, [targetFinding, fixPlan, unifiedPatch, knowledgeLevel]);

  if (!isOpen || !targetFinding) return null;

  const initiateRemediationWorkflow = async () => {
    setPhase('PREPARING_CONTEXT');
    setActiveSubTab('plan');

    // 1. Create Plan & Check Fixability
    const plan = AgenticFixEngine.createFixPlan(targetFinding, code, fileName);
    setFixPlan(plan);

    // If manual fix or unsafe, stop here with clear guidance
    if (plan.fixability === 'MANUAL_FIX_REQUIRED' || plan.fixability === 'UNSAFE_TO_AUTOMATE') {
      setPhase('IDLE');
      const expl = AgenticFixEngine.generateStructuredExplanation(
        targetFinding,
        plan,
        null,
        knowledgeLevel
      );
      setStructuredExplanation(expl);
      return;
    }

    // 2. Generate Proposed Patch
    setPhase('GENERATING_PATCH');
    try {
      let customProposedCode: string | undefined;
      try {
        const problemDesc = targetFinding.whyItMatters || targetFinding.description;
        const aiResponse = await sendRequest({
          action: 'fix_issue',
          language,
          code,
          question: `Fix ${targetFinding.severity} issue at line ${targetFinding.line}: "${targetFinding.title}". Problem: ${problemDesc}. Plan: ${plan.steps.map((s) => s.description).join('; ')}`,
        });

        if (aiResponse) {
          const codeMatch = aiResponse.match(/```(?:\w+)?\n([\s\S]*?)```/);
          if (codeMatch && codeMatch[1].trim().length > 10) {
            customProposedCode = codeMatch[1].trim();
          }
        }
      } catch (aiErr) {
        console.warn('AI patch enhancement fallback to deterministic remediation:', aiErr);
      }

      const patch = AgenticFixEngine.generateUnifiedPatch(
        plan,
        targetFinding,
        code,
        fileName,
        customProposedCode
      );
      setUnifiedPatch(patch);
      if (patch.files[0]?.newContent) {
        setEditableCode(patch.files[0].newContent);
      }

      // 3. Validate Patch
      setPhase('VALIDATING_PATCH');
      const filesMap = new Map<string, string>();
      filesMap.set(fileName, code);
      const validation = AgenticFixEngine.validatePatch(patch, plan, filesMap);
      setPatchValidation(validation);

      // 4. Test Intelligence
      const framework = TestIntelligenceService.detectTestFramework(code, fileName, language);
      const discTests = TestIntelligenceService.discoverTests(code, fileName, framework);
      setDiscoveredTests(discTests);

      const gaps = TestIntelligenceService.detectTestGaps(
        code,
        fileName,
        analysis,
        discTests,
        targetFinding ? [targetFinding] : []
      );
      setTestGaps(gaps);

      const coverage = TestIntelligenceService.analyzeCoverage(code, fileName, discTests);
      setCoverageTelemetry(coverage);

      const targetSymbolName = targetFinding.symbol || gaps[0]?.targetSymbol || 'handler';
      const cTests = TestIntelligenceService.generateTestCandidates(
        targetSymbolName,
        fileName,
        code,
        framework,
        gaps[0]
      );
      setCandidateTests(cTests);
      if (cTests.length > 0) {
        setSelectedCandidateTest(cTests[0]);
      }

      // 5. Generate Initial Structured Explanation
      const expl = AgenticFixEngine.generateStructuredExplanation(
        targetFinding,
        plan,
        patch,
        knowledgeLevel
      );
      setStructuredExplanation(expl);

      setPhase('IDLE');
    } catch (err: any) {
      console.error('Error generating patch:', err);
      setPhase('FAILED');
    }
  };

  const handleApplyAndVerify = async () => {
    if (!targetFinding || !fixPlan) return;

    // Conflict Detection Check: verify if workspace code was modified since fix was generated
    if (code !== initialCodeSnapshot) {
      setConflictDetected(true);
      return;
    }

    setIsApplying(true);
    setPhase('CREATING_CHECKPOINT');

    // 1. Create Safe Snapshot Checkpoint
    const chk = AgenticFixEngine.createCheckpoint(fileName, code);
    setCheckpointId(chk);

    // 2. Apply in Workspace (use editable code if developer customized it)
    setPhase('APPLYING_PATCH');
    const patchedCode =
      diffMode === 'edit' && editableCode.trim().length > 0
        ? editableCode
        : unifiedPatch?.files[0]?.newContent || code;
    setCode(patchedCode);

    // 3. Run Multi-phase Verification Pipeline via VerificationService
    setPhase('RUNNING_TESTS');
    const report = await VerificationService.executeVerificationPipeline({
      finding: targetFinding,
      plan: fixPlan,
      patch: unifiedPatch || AgenticFixEngine.generateUnifiedPatch(fixPlan, targetFinding, code, fileName, patchedCode),
      patchedCode,
      originalCode: code,
      fileName,
      language,
      checkpointId: chk,
      priorAnalysis: analysis,
    });

    setComprehensiveReport(report);
    setTestResults(report.testResult);
    setSecurityResults(report.securityResult);
    setRegressionResults(report.regressionResult);
    setVerificationState(report.overallStatus);

    setPhase('VERIFYING');

    // 4. Record Audit Record
    const auditRecord: RemediationAuditRecord = {
      id: `audit-${Date.now()}`,
      findingId: targetFinding.id,
      findingTitle: targetFinding.title,
      findingCategory: targetFinding.category,
      findingSeverity: targetFinding.severity,
      timestamp: Date.now(),
      plan: fixPlan,
      patch: unifiedPatch!,
      validation: patchValidation!,
      testResults: report.testResult,
      securityResults: report.securityResult,
      regressionResults: report.regressionResult,
      verificationState: report.overallStatus,
      finalStatus: report.decision.canMarkAsFixed ? 'VERIFIED' : 'APPLIED',
      checkpointSnapshot: {
        fileName,
        originalContent: code,
        timestamp: Date.now(),
      },
    };

    AgenticFixEngine.recordRemediationAudit(auditRecord);

    setIsApplied(true);
    setIsApplying(false);
    setPhase('COMPLETED');
    setActiveSubTab('verification');

    // Trigger re-analysis
    analyzeCurrentCode();
  };

  const handleRetryVerification = async () => {
    if (!targetFinding || !fixPlan) return;
    setIsVerifying(true);
    try {
      const activeCode = unifiedPatch?.files[0]?.newContent || code;
      const report = await VerificationService.executeVerificationPipeline({
        finding: targetFinding,
        plan: fixPlan,
        patch: unifiedPatch!,
        patchedCode: activeCode,
        originalCode: code,
        fileName,
        language,
        checkpointId,
        priorAnalysis: analysis,
      });

      setComprehensiveReport(report);
      setTestResults(report.testResult);
      setSecurityResults(report.securityResult);
      setRegressionResults(report.regressionResult);
      setVerificationState(report.overallStatus);
      analyzeCurrentCode();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAcceptFix = () => {
    if (!isApplied || !targetFinding) return;
    // Strict Gate: Verification must NOT be FAILED and must be approved by decision engine
    if (
      verificationState === 'FAILED' ||
      (comprehensiveReport && !comprehensiveReport.decision.canMarkAsFixed)
    ) {
      return;
    }

    saveFindingStatus(targetFinding.id, 'FIXED');
    if (onVerifiedFixApplied) {
      onVerifiedFixApplied(targetFinding.id);
    }
    if (addToast) {
      addToast({
        title: 'Fix Accepted & Verified',
        message: `Finding "${targetFinding.title}" marked as Fixed in codebase.`,
        type: 'success',
      });
    }
    onClose();
  };

  const handleRollback = () => {
    const original = AgenticFixEngine.rollbackCheckpoint(fileName);
    if (original !== null) {
      setCode(original);
      setIsApplied(false);
      setIsReverted(true);
      setVerificationState('NOT_VERIFIED');
      setComprehensiveReport(null);
      analyzeCurrentCode();
      if (addToast) {
        addToast({
          title: 'Rollback Succeeded',
          message: `Workspace reverted to pre-fix checkpoint for ${fileName}.`,
          type: 'info',
        });
      }
    }
  };

  const handleRejectFix = () => {
    if (!targetFinding || !fixPlan) return;
    const auditRecord: RemediationAuditRecord = {
      id: `audit-reject-${Date.now()}`,
      findingId: targetFinding.id,
      findingTitle: targetFinding.title,
      findingCategory: targetFinding.category,
      findingSeverity: targetFinding.severity,
      timestamp: Date.now(),
      plan: fixPlan,
      patch: unifiedPatch!,
      validation: patchValidation!,
      testResults: null,
      securityResults: null,
      regressionResults: null,
      verificationState: 'REJECTED',
      finalStatus: 'REJECTED',
      developerFeedback: {
        useful: false,
        rejectionReason: `${rejectionReason}: ${rejectionNotes}`,
        timestamp: Date.now(),
      },
    };
    AgenticFixEngine.recordRemediationAudit(auditRecord);
    if (addToast) {
      addToast({
        title: 'Fix Rejected',
        message: 'Rejection reason recorded to audit log. Workspace untouched.',
        type: 'warning',
      });
    }
    onClose();
  };

  const handleCopyDiff = () => {
    if (unifiedPatch?.rawUnifiedDiff) {
      navigator.clipboard.writeText(unifiedPatch.rawUnifiedDiff);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const submitFeedback = (useful: boolean) => {
    setFeedbackSubmitted(true);
    if (targetFinding && fixPlan) {
      const record: RemediationAuditRecord = {
        id: `audit-fb-${Date.now()}`,
        findingId: targetFinding.id,
        findingTitle: targetFinding.title,
        findingCategory: targetFinding.category,
        findingSeverity: targetFinding.severity,
        timestamp: Date.now(),
        plan: fixPlan,
        patch: unifiedPatch!,
        validation: patchValidation!,
        testResults: testResults,
        securityResults: securityResults,
        regressionResults: regressionResults,
        verificationState,
        finalStatus: isApplied ? 'VERIFIED' : 'PLAN_ONLY',
        developerFeedback: {
          useful,
          comment: feedbackText,
          timestamp: Date.now(),
        },
      };
      AgenticFixEngine.recordRemediationAudit(record);
    }
  };

  // Run QA Scenarios for testing and demonstrations
  const runQaScenario = async (scenario: string) => {
    setActiveSimulationScenario(scenario);
    if (scenario === 'CONFLICT') {
      setConflictDetected(true);
      return;
    }
    if (scenario === 'REJECT') {
      setShowRejectMenu(true);
      return;
    }
    if (scenario === 'FAIL_TEST') {
      if (!isApplied) {
        await handleApplyAndVerify();
      }
      setVerificationState('FAILED');
      setComprehensiveReport((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          overallStatus: 'FAILED',
          decision: {
            ...prev.decision,
            canMarkAsFixed: false,
            failedStages: ['Runtime Test Suite (Assertion Error)'],
            recommendation: 'Fix introduced a regression. Roll back to safe checkpoint.',
          },
        };
      });
      setActiveSubTab('verification');
      return;
    }
    if (scenario === 'SYNTAX_ERROR') {
      if (!isApplied) {
        await handleApplyAndVerify();
      }
      setVerificationState('FAILED');
      setComprehensiveReport((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          overallStatus: 'FAILED',
          decision: {
            ...prev.decision,
            canMarkAsFixed: false,
            failedStages: ['Static Syntax & AST Validation (Parse Error)'],
            recommendation: 'Syntax error detected. Recommend atomic rollback.',
          },
        };
      });
      setActiveSubTab('verification');
      return;
    }
    if (scenario === 'CLEAN_PASS') {
      await handleApplyAndVerify();
      setVerificationState('VERIFIED');
      setActiveSubTab('verification');
    }
  };

  const canAcceptFix =
    isApplied &&
    (verificationState === 'VERIFIED' || verificationState === 'PARTIALLY_VERIFIED') &&
    (comprehensiveReport ? comprehensiveReport.decision.canMarkAsFixed : true);

  const severityBadge =
    targetFinding.severity === 'CRITICAL' || targetFinding.severity === 'HIGH'
      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
      : targetFinding.severity === 'MEDIUM'
      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
      : 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30';

  const fixabilityBadge =
    fixPlan?.fixability === 'AUTO_FIX_SUPPORTED'
      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      : fixPlan?.fixability === 'ASSISTED_FIX'
      ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30'
      : fixPlan?.fixability === 'MANUAL_FIX_REQUIRED'
      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';

  // 9-Stage Stepper mapping
  const workflowStages = [
    { num: 1, label: 'FIND', done: true },
    { num: 2, label: 'UNDERSTAND', done: Boolean(structuredExplanation) },
    { num: 3, label: 'PLAN', done: Boolean(fixPlan) },
    { num: 4, label: 'GENERATE FIX', done: Boolean(unifiedPatch) },
    { num: 5, label: 'REVIEW', done: activeSubTab === 'diff' || isApplied },
    { num: 6, label: 'APPLY', done: isApplied },
    { num: 7, label: 'TEST', done: Boolean(testResults) || isApplied },
    { num: 8, label: 'RE-ANALYZE', done: Boolean(comprehensiveReport?.beforeAfter) },
    { num: 9, label: 'VERIFY', done: verificationState === 'VERIFIED' || verificationState === 'PARTIALLY_VERIFIED' },
  ];

  return (
    <div
      id="devpulse-agentic-fix-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col bg-pulse-surface border border-pulse-subtle rounded-3xl shadow-2xl overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-pulse-subtle bg-pulse-surface/90 gap-2">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400 shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="text-sm sm:text-base font-bold text-pulse-primary truncate">
                  Agentic Code Remediation & Verification
                </h2>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${severityBadge}`}>
                  {targetFinding.severity}
                </span>
                {fixPlan && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${fixabilityBadge}`}>
                    {fixPlan.fixability.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-pulse-muted truncate">
                {targetFinding.title} • {targetFinding.file}:{targetFinding.line}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 text-pulse-muted hover:text-pulse-primary rounded-xl hover:bg-pulse-elevated transition cursor-pointer shrink-0 min-h-[38px] min-w-[38px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 9-Stage Agentic Stepper Indicator */}
        <div className="px-3 sm:px-6 py-2.5 bg-pulse-elevated/60 border-b border-pulse-subtle flex items-center justify-between text-[10px] font-mono overflow-x-auto [scrollbar-width:none]">
          <div className="flex items-center space-x-1.5 shrink-0">
            {workflowStages.map((st, idx) => (
              <React.Fragment key={st.num}>
                <div
                  className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition ${
                    st.done
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-pulse-surface text-pulse-muted border border-pulse-subtle'
                  }`}
                >
                  <span className="font-bold">{st.num}.</span>
                  <span className="font-semibold">{st.label}</span>
                  {st.done && <Check className="h-3 w-3 text-emerald-400 shrink-0" />}
                </div>
                {idx < workflowStages.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-pulse-subtle shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* QA Simulation Scenarios Selector */}
          <div className="hidden lg:flex items-center space-x-1.5 pl-3 border-l border-pulse-subtle shrink-0">
            <span className="text-pulse-muted flex items-center space-x-1">
              <FlaskConical className="h-3 w-3 text-teal-400" />
              <span>QA Sim:</span>
            </span>
            <select
              value={activeSimulationScenario}
              onChange={(e) => runQaScenario(e.target.value)}
              className="bg-pulse-surface border border-pulse-subtle text-pulse-secondary text-[10px] rounded-lg px-2 py-0.5 focus:outline-none focus:border-teal-500"
            >
              <option value="DEFAULT">Normal Workflow</option>
              <option value="CLEAN_PASS">1. Simple Clean Pass</option>
              <option value="SYNTAX_ERROR">2. Syntax Parse Failure</option>
              <option value="FAIL_TEST">3. Test Regression Failure</option>
              <option value="CONFLICT">4. Source Changed Conflict</option>
              <option value="REJECT">5. User Rejection Flow</option>
            </select>
          </div>
        </div>

        {/* Source Conflict Alert Banner */}
        {conflictDetected && (
          <div className="m-3 sm:m-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 space-y-2.5 text-xs text-amber-300">
            <div className="flex items-center space-x-2 font-bold text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Source Conflict Detected: Active File Modified</span>
            </div>
            <p className="leading-relaxed">
              Fix could not be applied automatically because the source file (<strong>{fileName}</strong>) was modified since the remediation patch was generated.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setConflictDetected(false);
                  setInitialCodeSnapshot(code);
                  initiateRemediationWorkflow();
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 border border-amber-500/40 font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Regenerate Fix on Current Code</span>
              </button>
              <button
                onClick={() => setConflictDetected(false)}
                className="px-3 py-1.5 rounded-xl bg-pulse-surface hover:bg-pulse-elevated text-pulse-secondary border border-pulse-subtle transition cursor-pointer"
              >
                Dismiss Conflict Alert
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-3 sm:px-6 pt-2.5 pb-2 border-b border-pulse-subtle bg-pulse-surface text-xs font-mono overflow-x-auto [scrollbar-width:none]">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('plan')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 shrink-0 whitespace-nowrap min-h-[36px] ${
                activeSubTab === 'plan'
                  ? 'bg-teal-500 text-[#08110F] font-bold shadow-sm'
                  : 'text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated'
              }`}
            >
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span>1. Plan & Understand</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('diff')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 shrink-0 whitespace-nowrap min-h-[36px] ${
                activeSubTab === 'diff'
                  ? 'bg-teal-500 text-[#08110F] font-bold shadow-sm'
                  : 'text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated'
              }`}
            >
              <GitPullRequest className="h-3.5 w-3.5 shrink-0" />
              <span>2. Proposed Patch {unifiedPatch ? `(+${unifiedPatch.totalAdditions} / -${unifiedPatch.totalDeletions})` : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('tests')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 shrink-0 whitespace-nowrap min-h-[36px] ${
                activeSubTab === 'tests'
                  ? 'bg-teal-500 text-[#08110F] font-bold shadow-sm'
                  : 'text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated'
              }`}
            >
              <TestTube2 className="h-3.5 w-3.5 shrink-0" />
              <span>3. Test Intelligence {candidateTests.length > 0 ? `(${candidateTests.length})` : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('verification')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 shrink-0 whitespace-nowrap min-h-[36px] ${
                activeSubTab === 'verification'
                  ? 'bg-teal-500 text-[#08110F] font-bold shadow-sm'
                  : 'text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span>4. Verification {verificationState === 'VERIFIED' ? '✓' : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('feedback')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 shrink-0 whitespace-nowrap min-h-[36px] ${
                activeSubTab === 'feedback'
                  ? 'bg-teal-500 text-[#08110F] font-bold shadow-sm'
                  : 'text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated'
              }`}
            >
              <ThumbsUp className="h-3.5 w-3.5 shrink-0" />
              <span>5. Audit Trail</span>
            </button>
          </div>

          {/* Level Switcher */}
          {activeSubTab === 'plan' && (
            <div className="hidden sm:flex items-center space-x-1 pl-2 border-l border-pulse-subtle">
              <GraduationCap className="h-3.5 w-3.5 text-teal-400" />
              <div className="flex bg-pulse-surface rounded-lg p-0.5 border border-pulse-subtle text-[10px]">
                {(['beginner', 'intermediate', 'expert'] as KnowledgeLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setKnowledgeLevel(lvl)}
                    className={`px-2 py-0.5 rounded capitalize transition ${
                      knowledgeLevel === lvl
                        ? 'bg-teal-500/20 text-teal-300 font-bold'
                        : 'text-pulse-muted hover:text-pulse-secondary'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Progress / Spinner Banner */}
          {phase !== 'IDLE' && phase !== 'COMPLETED' && phase !== 'FAILED' && (
            <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center space-x-3 text-xs font-mono text-teal-400 animate-pulse">
              <div className="h-4 w-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <span>
                {phase === 'PREPARING_CONTEXT' && 'Preparing fix context & redacting sensitive tokens...'}
                {phase === 'PLANNING_FIX' && 'Generating structured fix plan...'}
                {phase === 'GENERATING_PATCH' && 'Synthesizing safe patch...'}
                {phase === 'VALIDATING_PATCH' && 'Validating patch scope & checking protected files...'}
                {phase === 'CREATING_CHECKPOINT' && 'Creating atomic rollback checkpoint...'}
                {phase === 'APPLYING_PATCH' && 'Applying patch in isolated workspace...'}
                {phase === 'RUNNING_TESTS' && 'Executing targeted test suite...'}
                {phase === 'SECURITY_SCAN' && 'Re-scanning AST for security zero-regression...'}
                {phase === 'RE_ANALYZING' && 'Comparing maintainability & complexity metrics...'}
                {phase === 'VERIFYING' && 'Finalizing verification state...'}
              </span>
            </div>
          )}

          {/* TAB 1: FIX PLAN & STRUCTURED EXPLANATION */}
          {activeSubTab === 'plan' && (
            fixPlan ? (
              <div className="space-y-5 animate-fadeIn">
                {/* Objective Banner */}
                <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-pulse-primary">
                    <span className="flex items-center space-x-1.5">
                      <Zap className="h-4 w-4 text-teal-400" />
                      <span>Fix Objective</span>
                    </span>
                    <span className="font-mono text-[11px] text-pulse-muted">
                      Finding ID: {targetFinding.id}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-pulse-primary">
                    {fixPlan.objective}
                  </p>
                  <p className="text-xs text-pulse-secondary leading-relaxed">
                    <strong className="text-pulse-primary">Root Cause:</strong> {fixPlan.rootCauseSummary || 'Structural code pattern violation.'}
                  </p>
                </div>

                {/* 5-Section Structured Explanation */}
                {structuredExplanation && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono uppercase font-bold text-pulse-muted flex items-center space-x-1.5">
                        <Info className="h-3.5 w-3.5 text-teal-400" />
                        <span>Structured Rationale ({knowledgeLevel} Mode)</span>
                      </h4>
                      <span className="text-[11px] font-mono text-pulse-muted">
                        5-Dimensional Analysis
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* 1. Why this fix is needed */}
                      <div className="p-3.5 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-1.5">
                        <span className="font-bold text-pulse-primary flex items-center space-x-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                          <span>1. Why This Fix Is Needed</span>
                        </span>
                        <p className="text-pulse-secondary leading-relaxed text-[11px]">
                          {structuredExplanation.whyNeeded}
                        </p>
                      </div>

                      {/* 2. What changes */}
                      <div className="p-3.5 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-1.5">
                        <span className="font-bold text-pulse-primary flex items-center space-x-1.5">
                          <FileCode className="h-3.5 w-3.5 text-teal-400" />
                          <span>2. What Changes</span>
                        </span>
                        <p className="text-pulse-secondary leading-relaxed text-[11px]">
                          {structuredExplanation.whatChanges}
                        </p>
                      </div>

                      {/* 3. Why this approach was chosen */}
                      <div className="p-3.5 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-1.5">
                        <span className="font-bold text-pulse-primary flex items-center space-x-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>3. Why This Approach</span>
                        </span>
                        <p className="text-pulse-secondary leading-relaxed text-[11px]">
                          {structuredExplanation.whyThisApproach}
                        </p>
                      </div>

                      {/* 4. Potential side effects / blast radius */}
                      <div className="p-3.5 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-1.5">
                        <span className="font-bold text-pulse-primary flex items-center space-x-1.5">
                          <ShieldAlert className="h-3.5 w-3.5 text-sky-400" />
                          <span>4. Potential Side Effects</span>
                        </span>
                        <p className="text-pulse-secondary leading-relaxed text-[11px]">
                          {structuredExplanation.potentialSideEffects}
                        </p>
                      </div>
                    </div>

                    {/* 5. How it will be verified */}
                    <div className="p-3.5 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-1.5 text-xs">
                      <span className="font-bold text-pulse-primary flex items-center space-x-1.5">
                        <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span>5. How It Will Be Verified</span>
                      </span>
                      <p className="text-pulse-secondary leading-relaxed text-[11px]">
                        {structuredExplanation.howVerified}
                      </p>
                    </div>
                  </div>
                )}

                {/* Fixability Guidance if Manual or Unsafe */}
                {fixPlan.manualGuidance && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2 text-xs">
                    <div className="flex items-center space-x-2 text-amber-500 font-bold font-mono">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Manual Approach Recommended</span>
                    </div>
                    <p className="text-pulse-secondary whitespace-pre-wrap">{fixPlan.manualGuidance}</p>
                  </div>
                )}

                {/* Steps List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase font-bold text-pulse-muted">
                    Planned Execution Steps ({fixPlan.steps?.length || 0})
                  </h4>
                  {fixPlan.steps && fixPlan.steps.length > 0 ? (
                    <div className="space-y-2">
                      {fixPlan.steps.map((step) => (
                        <div
                          key={step.stepNumber}
                          className="p-3 rounded-xl bg-pulse-elevated border border-pulse-subtle flex items-start space-x-3 text-xs"
                        >
                          <div className="h-5 w-5 rounded-full bg-pulse-surface border border-pulse-subtle text-pulse-accent font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                            {step.stepNumber}
                          </div>
                          <div className="space-y-0.5 flex-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-pulse-primary">{step.action}</h5>
                              <span className="text-[10px] font-mono text-pulse-muted">{step.targetFile}</span>
                            </div>
                            <p className="text-pulse-secondary text-[11px]">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-pulse-surface border border-pulse-subtle text-xs text-pulse-muted">
                      No information available on individual execution steps.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-pulse-elevated border border-pulse-subtle text-center sm:text-left space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start space-x-2 text-pulse-primary font-mono text-xs font-bold">
                  <Info className="h-4 w-4 text-teal-400" />
                  <span>No detailed fix plan available</span>
                </div>
                <p className="text-xs text-pulse-muted leading-relaxed">
                  No information available. Fix plan generation is pending or not generated for this finding.
                </p>
              </div>
            )
          )}

          {/* TAB 2: PROPOSED PATCH / DIFF / EDIT */}
          {activeSubTab === 'diff' && (
            <div className="space-y-4 animate-fadeIn">
              {unifiedPatch ? (
                <>
                  {/* Diff Control Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                        +{unifiedPatch.totalAdditions}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                        -{unifiedPatch.totalDeletions}
                      </span>
                      <span className="text-pulse-muted truncate max-w-[200px] sm:max-w-none">
                        File: {unifiedPatch.files[0]?.filePath}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Diff View Mode Switcher */}
                      <div className="flex bg-pulse-surface rounded-xl p-0.5 border border-pulse-subtle text-xs font-mono">
                        <button
                          onClick={() => setDiffMode('unified')}
                          className={`px-2.5 py-1 rounded-lg transition ${
                            diffMode === 'unified'
                              ? 'bg-pulse-elevated text-teal-300 font-bold'
                              : 'text-pulse-muted hover:text-pulse-secondary'
                          }`}
                        >
                          Unified Diff
                        </button>
                        <button
                          onClick={() => setDiffMode('split')}
                          className={`px-2.5 py-1 rounded-lg transition ${
                            diffMode === 'split'
                              ? 'bg-pulse-elevated text-teal-300 font-bold'
                              : 'text-pulse-muted hover:text-pulse-secondary'
                          }`}
                        >
                          Split Diff
                        </button>
                        <button
                          onClick={() => setDiffMode('edit')}
                          className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                            diffMode === 'edit'
                              ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30'
                              : 'text-pulse-muted hover:text-pulse-secondary'
                          }`}
                        >
                          <FileEdit className="h-3 w-3" />
                          <span>Edit Patch</span>
                        </button>
                      </div>

                      <button
                        onClick={handleCopyDiff}
                        className="px-2.5 py-1 rounded-lg bg-pulse-surface hover:bg-pulse-elevated border border-pulse-subtle text-xs text-pulse-secondary hover:text-pulse-primary transition flex items-center space-x-1 cursor-pointer"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Patch Validation Alerts */}
                  {patchValidation && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                        patchValidation.isValid
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}
                    >
                      {patchValidation.isValid ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>Patch validated cleanly: 0 protected files touched, 0 secret leaks detected, scope within approved plan.</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>Validation issues: {patchValidation.errors.join('; ')}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* MODE 1: UNIFIED DIFF */}
                  {diffMode === 'unified' && (
                    <div className="rounded-2xl bg-pulse-bg border border-pulse-subtle overflow-hidden font-mono text-xs">
                      <div className="px-4 py-2 bg-pulse-surface border-b border-pulse-subtle flex items-center justify-between text-pulse-muted text-[11px]">
                        <span>Unified Diff: a/{fileName} → b/{fileName}</span>
                        <span>Hunk 1</span>
                      </div>
                      <pre className="p-4 overflow-x-auto max-h-80 leading-relaxed">
                        {unifiedPatch.files[0]?.hunks[0]?.lines.map((l, i) => (
                          <div
                            key={i}
                            className={`${
                              l.startsWith('+')
                                ? 'bg-emerald-500/15 text-emerald-400 px-1 rounded'
                                : l.startsWith('-')
                                ? 'bg-rose-500/15 text-rose-400 px-1 rounded'
                                : 'text-pulse-secondary'
                            }`}
                          >
                            {l}
                          </div>
                        ))}
                      </pre>
                    </div>
                  )}

                  {/* MODE 2: SPLIT DIFF (SIDE BY SIDE) */}
                  {diffMode === 'split' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-2xl bg-pulse-bg border border-pulse-subtle p-3 font-mono text-xs max-h-80 overflow-y-auto">
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-rose-400 px-2 py-1 bg-rose-500/10 rounded-lg">
                          Original ({fileName})
                        </div>
                        <pre className="p-2 text-pulse-secondary overflow-x-auto text-[11px] leading-relaxed">
                          {code}
                        </pre>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-lg">
                          Proposed Remediated ({fileName})
                        </div>
                        <pre className="p-2 text-emerald-300 overflow-x-auto text-[11px] leading-relaxed">
                          {unifiedPatch.files[0]?.newContent}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* MODE 3: EDIT PATCH BEFORE APPLY */}
                  {diffMode === 'edit' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-pulse-muted">
                        <span>Fine-tune the proposed code before applying to workspace:</span>
                        <span className="font-mono text-teal-400">{fileName}</span>
                      </div>
                      <textarea
                        value={editableCode}
                        onChange={(e) => setEditableCode(e.target.value)}
                        className="w-full h-72 p-3 font-mono text-xs bg-pulse-bg border border-pulse-subtle rounded-2xl text-pulse-primary focus:outline-none focus:border-teal-500 leading-relaxed resize-none"
                        placeholder="Edit remediated source code..."
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="p-6 rounded-2xl bg-pulse-elevated border border-pulse-subtle text-center sm:text-left space-y-1.5">
                  <div className="flex items-center justify-center sm:justify-start space-x-2 text-pulse-primary font-mono text-xs font-bold">
                    <Info className="h-4 w-4 text-teal-400" />
                    <span>No detailed patch diff available</span>
                  </div>
                  <p className="text-xs text-pulse-muted leading-relaxed">
                    No information available. Patch generation is in progress or not available.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEST INTELLIGENCE */}
          {activeSubTab === 'tests' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Coverage Telemetry Bar */}
              {coverageTelemetry && (
                <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-pulse-primary flex items-center space-x-2">
                      <TestTube2 className="h-4 w-4 text-teal-400" />
                      <span>Estimated Coverage Telemetry</span>
                    </span>
                    <span className="text-[11px] font-mono text-pulse-muted">
                      Functions: {coverageTelemetry.testedFunctionsCount}/{coverageTelemetry.totalFunctionsCount} covered
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle space-y-1">
                      <span className="text-[10px] font-mono uppercase text-pulse-muted">Line Coverage</span>
                      <div className="text-lg font-bold text-pulse-primary font-mono">{coverageTelemetry.lines}%</div>
                      <div className="w-full bg-pulse-subtle h-1.5 rounded-full overflow-hidden">
                        <div className="bg-teal-400 h-full rounded-full" style={{ width: `${coverageTelemetry.lines}%` }} />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle space-y-1">
                      <span className="text-[10px] font-mono uppercase text-pulse-muted">Function Coverage</span>
                      <div className="text-lg font-bold text-pulse-primary font-mono">{coverageTelemetry.functions}%</div>
                      <div className="w-full bg-pulse-subtle h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${coverageTelemetry.functions}%` }} />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle space-y-1">
                      <span className="text-[10px] font-mono uppercase text-pulse-muted">Branch Coverage</span>
                      <div className="text-lg font-bold text-pulse-primary font-mono">{coverageTelemetry.branches}%</div>
                      <div className="w-full bg-pulse-subtle h-1.5 rounded-full overflow-hidden">
                        <div className="bg-sky-400 h-full rounded-full" style={{ width: `${coverageTelemetry.branches}%` }} />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle space-y-1">
                      <span className="text-[10px] font-mono uppercase text-pulse-muted">Path Coverage</span>
                      <div className="text-lg font-bold text-pulse-primary font-mono">{coverageTelemetry.paths}%</div>
                      <div className="w-full bg-pulse-subtle h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-400 h-full rounded-full" style={{ width: `${coverageTelemetry.paths}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Candidate Tests Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase font-bold text-pulse-muted flex items-center space-x-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                    <span>AI Generated Candidate Tests ({candidateTests.length})</span>
                  </h4>
                  <span className="text-[11px] font-mono text-pulse-muted">
                    Automated regression guard for {targetFinding.title}
                  </span>
                </div>

                {candidateTests.length > 0 ? (
                  <div className="space-y-3">
                    {candidateTests.map((ct, idx) => (
                      <div
                        key={ct.id}
                        className="rounded-2xl bg-pulse-elevated border border-pulse-subtle overflow-hidden space-y-3 p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-pulse-primary text-xs">{ct.title}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-teal-500/15 text-teal-400 border border-teal-500/30">
                                {ct.testType}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-pulse-muted bg-pulse-surface">
                                {ct.framework}
                              </span>
                            </div>
                            <p className="text-xs text-pulse-secondary">{ct.rationale}</p>
                          </div>

                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(ct.testCode);
                              setCopiedTestIdx(idx);
                              setTimeout(() => setCopiedTestIdx(null), 2000);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-pulse-surface hover:bg-pulse-elevated border border-pulse-subtle text-xs text-pulse-secondary hover:text-pulse-primary transition flex items-center space-x-1 cursor-pointer shrink-0"
                          >
                            {copiedTestIdx === idx ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy Test</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Test Code Viewer */}
                        <div className="rounded-xl bg-pulse-bg border border-pulse-subtle overflow-hidden font-mono text-xs">
                          <pre className="p-3 overflow-x-auto text-emerald-400 leading-relaxed max-h-48">
                            {ct.testCode}
                          </pre>
                        </div>

                        {/* Safety Checks & File Path */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                          <div className="p-2 rounded-lg bg-pulse-surface text-pulse-secondary flex items-center space-x-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            <span><strong className="text-pulse-primary">Safety Checks: </strong>0 prod edits • isolated test harness</span>
                          </div>
                          <div className="p-2 rounded-lg bg-pulse-surface text-pulse-secondary">
                            <strong className="text-pulse-primary">Target Test File: </strong>
                            <span className="text-teal-400">{ct.testFilePath}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-pulse-elevated border border-pulse-subtle text-center sm:text-left space-y-1.5">
                    <div className="flex items-center justify-center sm:justify-start space-x-2 text-pulse-primary font-mono text-xs font-bold">
                      <Info className="h-4 w-4 text-teal-400" />
                      <span>No detailed candidate tests available</span>
                    </div>
                    <p className="text-xs text-pulse-muted leading-relaxed">
                      No information available. No candidate unit or regression tests were generated for this finding.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: VERIFICATION PIPELINE */}
          {activeSubTab === 'verification' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Verification Status Card */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  verificationState === 'VERIFIED'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : verificationState === 'PARTIALLY_VERIFIED'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : verificationState === 'FAILED'
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-pulse-elevated border-pulse-subtle'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-pulse-muted">
                        Verification Status
                      </span>
                      {comprehensiveReport?.isSimulated && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          Simulated Runtime
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-pulse-primary flex items-center space-x-2">
                      {verificationState === 'VERIFIED' && <CheckCheck className="h-5 w-5 text-emerald-400" />}
                      {verificationState === 'PARTIALLY_VERIFIED' && <CheckCircle2 className="h-5 w-5 text-amber-400" />}
                      {verificationState === 'FAILED' && <AlertTriangle className="h-5 w-5 text-rose-400" />}
                      {verificationState === 'NOT_VERIFIED' && <Activity className="h-5 w-5 text-pulse-muted" />}
                      <span>
                        {verificationState === 'VERIFIED'
                          ? 'VERIFIED (Full Pipeline Succeeded)'
                          : verificationState === 'PARTIALLY_VERIFIED'
                          ? 'PARTIALLY VERIFIED (Simulated Harness)'
                          : verificationState === 'FAILED'
                          ? 'VERIFICATION FAILED'
                          : 'NOT VERIFIED'}
                      </span>
                    </h4>
                    <p className="text-xs text-pulse-secondary max-w-2xl">
                      {comprehensiveReport
                        ? VerificationService.getPersonalizedExplanation(
                            comprehensiveReport,
                            knowledgeLevel
                          )
                        : isApplied
                        ? 'Verification suite executed.'
                        : 'Click "Apply & Verify" to apply the patch to your workspace and execute all verification stages.'}
                    </p>
                  </div>

                  {isApplied && (
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={handleRetryVerification}
                        disabled={isVerifying}
                        className="px-3 py-1.5 rounded-xl bg-pulse-surface hover:bg-pulse-elevated border border-pulse-subtle text-xs font-mono text-teal-400 hover:text-teal-300 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                        <span>{isVerifying ? 'Verifying...' : 'Re-verify'}</span>
                      </button>
                      <button
                        onClick={handleRollback}
                        className="px-3 py-1.5 rounded-xl bg-pulse-surface hover:bg-pulse-elevated border border-pulse-subtle text-xs font-mono text-amber-400 hover:text-amber-300 transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Rollback Fix</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Gating Alert if Verification Failed */}
              {verificationState === 'FAILED' && comprehensiveReport && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-rose-400">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Action 'Accept Fix' is Locked</span>
                  </div>
                  <p>
                    Verification failed due to:{' '}
                    <strong>{comprehensiveReport.decision.failedStages.join(', ') || 'Validation errors'}</strong>.{' '}
                    DevPulse prevents marking findings as Fixed until all safety checks pass cleanly.
                  </p>
                  <div className="flex items-center space-x-3 pt-1">
                    <button
                      onClick={handleRetryVerification}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-semibold cursor-pointer transition flex items-center space-x-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Retry Verification</span>
                    </button>
                    <button
                      onClick={handleRollback}
                      className="px-3 py-1.5 rounded-xl bg-pulse-surface hover:bg-pulse-elevated text-pulse-secondary border border-pulse-subtle font-semibold cursor-pointer transition flex items-center space-x-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Rollback to Checkpoint</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Before vs After Analysis Comparison */}
              {comprehensiveReport?.beforeAfter && (
                <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-pulse-primary font-mono uppercase flex items-center space-x-2">
                      <Activity className="h-3.5 w-3.5 text-teal-400" />
                      <span>Before / After Code Health Comparison</span>
                    </h4>
                    <span className="text-[11px] font-mono text-pulse-muted">
                      AST Re-analysis Delta
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle">
                      <span className="text-[10px] text-pulse-muted uppercase block">Target Finding</span>
                      <span className="font-bold text-emerald-400 flex items-center space-x-1">
                        <span>{comprehensiveReport.beforeAfter.originalFinding.statusBefore}</span>
                        <ArrowRight className="h-3 w-3 text-pulse-muted" />
                        <span>{comprehensiveReport.beforeAfter.originalFinding.statusAfter}</span>
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle">
                      <span className="text-[10px] text-pulse-muted uppercase block">Complexity</span>
                      <div className="flex items-center space-x-1.5 font-bold">
                        <span className="text-pulse-secondary">{comprehensiveReport.beforeAfter.complexity.before}</span>
                        <ArrowRight className="h-3 w-3 text-pulse-muted" />
                        <span className="text-pulse-primary">{comprehensiveReport.beforeAfter.complexity.after}</span>
                        <span
                          className={`text-[10px] ${
                            comprehensiveReport.beforeAfter.complexity.delta <= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          ({comprehensiveReport.beforeAfter.complexity.delta > 0 ? '+' : ''}
                          {comprehensiveReport.beforeAfter.complexity.delta})
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle">
                      <span className="text-[10px] text-pulse-muted uppercase block">Maintainability</span>
                      <div className="flex items-center space-x-1.5 font-bold">
                        <span className="text-pulse-secondary">{comprehensiveReport.beforeAfter.maintainability.before}</span>
                        <ArrowRight className="h-3 w-3 text-pulse-muted" />
                        <span className="text-pulse-primary">{comprehensiveReport.beforeAfter.maintainability.after}</span>
                        <span
                          className={`text-[10px] ${
                            comprehensiveReport.beforeAfter.maintainability.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          ({comprehensiveReport.beforeAfter.maintainability.delta > 0 ? '+' : ''}
                          {comprehensiveReport.beforeAfter.maintainability.delta})
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle">
                      <span className="text-[10px] text-pulse-muted uppercase block">Security Issues</span>
                      <div className="flex items-center space-x-1.5 font-bold">
                        <span className="text-pulse-secondary">{comprehensiveReport.beforeAfter.securityIssues.before}</span>
                        <ArrowRight className="h-3 w-3 text-pulse-muted" />
                        <span className="text-pulse-primary">{comprehensiveReport.beforeAfter.securityIssues.after}</span>
                        <span
                          className={`text-[10px] ${
                            comprehensiveReport.beforeAfter.securityIssues.delta <= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          ({comprehensiveReport.beforeAfter.securityIssues.delta > 0 ? '+' : ''}
                          {comprehensiveReport.beforeAfter.securityIssues.delta})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5-Stage Verification Pipeline Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-pulse-primary font-mono uppercase flex items-center justify-between">
                  <span>5-Stage Verification Pipeline Breakdown</span>
                  {comprehensiveReport && (
                    <span className="text-pulse-muted font-normal text-[11px]">
                      Total Duration: {comprehensiveReport.totalDurationMs}ms
                    </span>
                  )}
                </h4>

                <div className="space-y-2.5">
                  {comprehensiveReport?.stages ? (
                    comprehensiveReport.stages.map((stage) => {
                      const isExpanded = expandedLogStage === stage.id;
                      return (
                        <div
                          key={stage.id}
                          className="rounded-2xl bg-pulse-elevated border border-pulse-subtle overflow-hidden"
                        >
                          <div
                            onClick={() => setExpandedLogStage(isExpanded ? null : stage.id)}
                            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-pulse-surface/50 transition"
                          >
                            <div className="flex items-center space-x-3">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                                  stage.status === 'PASSED'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : stage.status === 'SIMULATED'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : stage.status === 'FAILED'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-pulse-surface text-pulse-muted'
                                }`}
                              >
                                {stage.status}
                              </span>
                              <div>
                                <h5 className="text-xs font-bold text-pulse-primary">{stage.name}</h5>
                                <p className="text-[11px] text-pulse-secondary">{stage.summary}</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 text-xs font-mono text-pulse-muted">
                              <span>{stage.durationMs}ms</span>
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </div>

                          {/* Expandable Logs View */}
                          {isExpanded && (
                            <div className="p-3 bg-black/40 border-t border-pulse-subtle text-[11px] font-mono text-pulse-secondary space-y-1">
                              <div className="flex items-center space-x-1.5 text-teal-400 mb-1.5">
                                <Terminal className="h-3.5 w-3.5" />
                                <span className="font-bold uppercase text-[10px]">Execution & Audit Logs</span>
                              </div>
                              {stage.logs.map((log, idx) => (
                                <div
                                  key={idx}
                                  className={`leading-relaxed ${
                                    log.includes('ERROR') || log.includes('FAILED')
                                      ? 'text-rose-400'
                                      : log.includes('WARN')
                                      ? 'text-amber-400'
                                      : log.includes('PASSED') || log.includes('RESOLVED')
                                      ? 'text-emerald-400'
                                      : 'text-pulse-secondary'
                                  }`}
                                >
                                  {log}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 rounded-2xl bg-pulse-elevated border border-pulse-subtle text-center text-xs text-pulse-muted space-y-2">
                      <Layers className="h-6 w-6 text-pulse-muted mx-auto" />
                      <p>Verification pipeline has not been executed yet.</p>
                      <p className="text-[11px]">Click "Apply & Verify Fix" below to run the multi-stage verification engine.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT & FEEDBACK */}
          {activeSubTab === 'feedback' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-3">
                <h4 className="text-xs font-bold text-pulse-primary font-mono uppercase">
                  Remediation Audit Trail
                </h4>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-pulse-surface">
                    <span className="text-pulse-muted">Finding:</span>
                    <span className="text-pulse-primary">{targetFinding.title}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-pulse-surface">
                    <span className="text-pulse-muted">Target File:</span>
                    <span className="text-pulse-primary">{fileName}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-pulse-surface">
                    <span className="text-pulse-muted">Audit Checkpoint:</span>
                    <span className="text-teal-400">{checkpointId || 'Active in Memory'}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-pulse-surface">
                    <span className="text-pulse-muted">Verification State:</span>
                    <span className={verificationState === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400'}>
                      {verificationState}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Feedback Form */}
              <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-3">
                <h4 className="text-xs font-bold text-pulse-primary font-mono uppercase">
                  Was this fix useful?
                </h4>
                {!feedbackSubmitted ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => submitFeedback(true)}
                        className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>Yes, fix is accurate</span>
                      </button>

                      <button
                        onClick={() => submitFeedback(false)}
                        className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span>No, needed manual edits</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Optional feedback comments..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-pulse-surface border border-pulse-subtle text-xs text-pulse-primary focus:outline-none focus:border-teal-500"
                    />
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Thank you! Your feedback has been recorded in the remediation audit log.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reject Fix Dropdown Modal / View */}
        {showRejectMenu && (
          <div className="p-4 border-t border-rose-500/30 bg-rose-500/10 space-y-3 text-xs">
            <div className="flex items-center justify-between font-bold text-rose-400">
              <span className="flex items-center space-x-1.5">
                <Ban className="h-4 w-4" />
                <span>Reject Proposed Remediation</span>
              </span>
              <button
                onClick={() => setShowRejectMenu(false)}
                className="text-pulse-muted hover:text-pulse-primary cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'Incorrect logic or syntax',
                'False positive finding',
                'Requires architectural refactoring',
                'Prefer manual remediation',
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setRejectionReason(reason)}
                  className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                    rejectionReason === reason
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold'
                      : 'bg-pulse-surface border-pulse-subtle text-pulse-secondary hover:text-pulse-primary'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Additional rejection context (optional)..."
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-pulse-surface border border-pulse-subtle text-pulse-primary text-xs"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowRejectMenu(false)}
                className="px-3 py-1.5 rounded-xl bg-pulse-surface text-pulse-secondary border border-pulse-subtle"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectFix}
                className="px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition cursor-pointer"
              >
                Confirm Rejection & Close
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-pulse-subtle bg-pulse-surface/90">
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-pulse-muted">Status:</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                verificationState === 'VERIFIED'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : verificationState === 'PARTIALLY_VERIFIED'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : verificationState === 'FAILED'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-pulse-elevated text-pulse-muted border border-pulse-subtle'
              }`}
            >
              {verificationState}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
            {!isApplied && (
              <button
                type="button"
                onClick={() => setShowRejectMenu(!showRejectMenu)}
                className="px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 transition cursor-pointer min-h-[40px] flex items-center justify-center space-x-1"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>Reject</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-pulse-secondary hover:text-pulse-primary rounded-xl border border-pulse-subtle hover:bg-pulse-elevated transition cursor-pointer min-h-[40px] flex items-center justify-center"
            >
              Cancel
            </button>

            {isApplied && (
              <>
                <button
                  type="button"
                  onClick={handleRollback}
                  className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold text-amber-400 hover:text-amber-300 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition flex items-center justify-center space-x-1.5 cursor-pointer min-h-[40px]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Revert Changes</span>
                </button>

                {/* Accept Fix Button - Strictly Gated */}
                <button
                  type="button"
                  onClick={handleAcceptFix}
                  disabled={!canAcceptFix}
                  title={
                    !canAcceptFix
                      ? 'Accept Fix is locked because verification checks failed. Rollback or retry.'
                      : 'Accept verified fix and mark finding as Fixed'
                  }
                  className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2 rounded-xl font-bold text-xs shadow-md transition min-h-[40px] ${
                    canAcceptFix
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:opacity-90 text-[#08110F] cursor-pointer'
                      : 'bg-pulse-elevated text-pulse-muted border border-pulse-subtle cursor-not-allowed opacity-60'
                  }`}
                >
                  {canAcceptFix ? (
                    <>
                      <Check className="h-4 w-4 shrink-0" />
                      <span>Accept Fix & Mark Fixed</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                      <span>Accept Fix (Locked)</span>
                    </>
                  )}
                </button>
              </>
            )}

            {!isApplied && (
              <button
                type="button"
                onClick={handleApplyAndVerify}
                disabled={isApplying || !unifiedPatch || (patchValidation && !patchValidation.isValid)}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:opacity-90 disabled:opacity-50 text-[#08110F] font-bold text-xs shadow-md transition cursor-pointer min-h-[40px]"
              >
                {isApplying ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-[#08110F] border-t-transparent rounded-full animate-spin" />
                    <span>Applying & Verifying...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span>Apply & Verify Fix</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
