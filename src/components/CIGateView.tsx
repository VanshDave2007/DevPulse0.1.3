/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  CIGateResult,
  CIGateCheckDetail,
  CIPolicyConfig,
  DEFAULT_CI_POLICY,
  GateStatus,
  CIProviderType,
} from '../types/ciGate';
import { CIGateEngine } from '../services/ciGateEngine';
import { useApp } from '../context/AppContext';
import { ActionFinding } from '../types';
import { FindingDetailModal } from './FindingDetailModal';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  FileCheck,
  FileCode,
  Flame,
  GitBranch,
  GitCommit,
  Github,
  GitMerge,
  GitPullRequest,
  HeartPulse,
  History,
  Info,
  Layers,
  Lock,
  Play,
  RotateCcw,
  Save,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Terminal,
  TestTube2,
  X,
  XCircle,
  Zap,
} from 'lucide-react';

export const CIGateView: React.FC = () => {
  const {
    analysis,
    code,
    fileName,
    setActiveTab,
    sendAiRequest,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'gate' | 'policy' | 'history' | 'integration'>('gate');
  const [selectedProvider, setSelectedProvider] = useState<CIProviderType>('GITHUB_ACTIONS');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [gateResult, setGateResult] = useState<CIGateResult | null>(() => {
    return CIGateEngine.evaluateGate({
      analysis,
      code,
      fileName,
    });
  });

  const [policy, setPolicy] = useState<CIPolicyConfig>(() => CIGateEngine.getProjectPolicy());
  const [isDirtyPolicy, setIsDirtyPolicy] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<boolean>(false);
  const [runHistory, setRunHistory] = useState<CIGateResult[]>(() => CIGateEngine.getRunHistory());
  const [selectedFinding, setSelectedFinding] = useState<ActionFinding | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // Trigger real gate evaluation with current code & policy
  const handleRunGateEvaluation = (overridePolicy?: CIPolicyConfig, isDryRun: boolean = false) => {
    setIsEvaluating(true);
    setTimeout(() => {
      const activePolicy = overridePolicy || policy;
      const res = CIGateEngine.evaluateGate({
        analysis,
        code,
        fileName,
        policy: { ...activePolicy, dryRun: isDryRun },
        context: {
          provider: selectedProvider,
          branch: 'feature/security-hardening',
          baseBranch: 'main',
          commit: 'c7f9a2b',
          commitMessage: 'fix(auth): update session token verification and sanitize inputs',
          prNumber: 142,
          dryRun: isDryRun,
        },
      });
      setGateResult(res);
      setRunHistory(CIGateEngine.getRunHistory());
      setIsEvaluating(false);
    }, 250);
  };

  const handleSavePolicy = () => {
    CIGateEngine.saveProjectPolicy(policy);
    setIsDirtyPolicy(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
    handleRunGateEvaluation(policy);
  };

  const handleResetPolicy = () => {
    setPolicy(DEFAULT_CI_POLICY);
    setIsDirtyPolicy(true);
  };

  const handleUpdatePolicy = (key: keyof CIPolicyConfig, value: any) => {
    setPolicy((prev) => ({
      ...prev,
      [key]: value,
    }));
    setIsDirtyPolicy(true);
  };

  const statusColor = (status: GateStatus) => {
    switch (status) {
      case 'PASS':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
      case 'PASS_WITH_WARNINGS':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      case 'FAIL':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-pulse-muted bg-pulse-elevated border-pulse-subtle';
    }
  };

  const statusIcon = (status: GateStatus | 'WARN' | 'SKIPPED') => {
    switch (status) {
      case 'PASS':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
      case 'WARN':
      case 'PASS_WITH_WARNINGS':
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      case 'FAIL':
        return <XCircle className="h-4 w-4 text-rose-500 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-pulse-muted shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* Top Header Hero */}
      <div className="rounded-3xl border border-pulse-subtle bg-gradient-to-br from-pulse-surface via-pulse-bg to-pulse-elevated p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30 uppercase tracking-wider">
                Continuous Verification
              </span>
              <span className="text-xs font-mono text-pulse-muted">
                Policy v{policy.version}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-pulse-primary tracking-tight font-sans flex items-center space-x-2">
              <ShieldCheck className="h-6 w-6 text-teal-400" />
              <span>CI/CD Quality & Security Gates</span>
            </h1>
            <p className="text-xs sm:text-sm text-pulse-secondary max-w-2xl leading-relaxed">
              Enforce deterministic pass/fail gates on pull requests, branches, and commits based on AST heuristics, security CVEs, tests, and regression boundaries.
            </p>
          </div>

          {/* Sub-tab Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-pulse-surface border border-pulse-subtle rounded-2xl shrink-0 self-start md:self-auto">
            <button
              onClick={() => setActiveSubTab('gate')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                activeSubTab === 'gate'
                  ? 'bg-teal-500 text-[#08110F] shadow-sm'
                  : 'text-pulse-muted hover:text-pulse-primary'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Active Gate</span>
            </button>

            <button
              onClick={() => setActiveSubTab('policy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                activeSubTab === 'policy'
                  ? 'bg-teal-500 text-[#08110F] shadow-sm'
                  : 'text-pulse-muted hover:text-pulse-primary'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Policies</span>
            </button>

            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                activeSubTab === 'history'
                  ? 'bg-teal-500 text-[#08110F] shadow-sm'
                  : 'text-pulse-muted hover:text-pulse-primary'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Runs ({runHistory.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('integration')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                activeSubTab === 'integration'
                  ? 'bg-teal-500 text-[#08110F] shadow-sm'
                  : 'text-pulse-muted hover:text-pulse-primary'
              }`}
            >
              <Github className="h-3.5 w-3.5" />
              <span>CI Config</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: ACTIVE GATE EVALUATION & SCORECARD */}
      {activeSubTab === 'gate' && gateResult && (
        <div className="space-y-6">
          {/* Main Gate Verdict Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-pulse-subtle">
              <div className="flex items-center space-x-3.5">
                <div className={`p-3 rounded-2xl border ${statusColor(gateResult.status)}`}>
                  {statusIcon(gateResult.status)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black border ${statusColor(gateResult.status)}`}>
                      {gateResult.status === 'PASS'
                        ? 'GATE PASSED'
                        : gateResult.status === 'PASS_WITH_WARNINGS'
                        ? 'PASSED WITH WARNINGS'
                        : 'GATE BLOCKED / FAILED'}
                    </span>
                    <span className="text-[11px] font-mono text-pulse-muted">
                      Exit Code: {gateResult.exitCode}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-pulse-primary mt-1 font-sans">
                    {gateResult.status === 'PASS'
                      ? 'All required security & quality conditions satisfied'
                      : gateResult.primaryBlockingReason || 'Policy violations detected'}
                  </h2>
                </div>
              </div>

              {/* Action Buttons: Re-Evaluate & Dry Run */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleRunGateEvaluation(policy, true)}
                  disabled={isEvaluating}
                  className="px-3 py-1.5 rounded-xl border border-pulse-subtle bg-pulse-elevated hover:bg-pulse-surface text-xs font-semibold text-pulse-secondary hover:text-pulse-primary transition cursor-pointer"
                  title="Simulate policy without persisting run history"
                >
                  Dry Run Simulation
                </button>

                <button
                  onClick={() => handleRunGateEvaluation(policy, false)}
                  disabled={isEvaluating}
                  className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Play className={`h-3.5 w-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
                  <span>{isEvaluating ? 'Evaluating...' : 'Re-Run Gate'}</span>
                </button>
              </div>
            </div>

            {/* Target PR / Context Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-pulse-elevated border border-pulse-subtle">
                <span className="text-[10px] text-pulse-muted block">Target File / Scope</span>
                <span className="font-bold text-pulse-primary truncate block">{fileName || 'Active Buffer'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-pulse-elevated border border-pulse-subtle">
                <span className="text-[10px] text-pulse-muted block">Branch / Baseline</span>
                <span className="font-bold text-teal-400 truncate block">{gateResult.branch} → {gateResult.baseBranch}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-pulse-elevated border border-pulse-subtle">
                <span className="text-[10px] text-pulse-muted block">Health Score</span>
                <span className="font-bold text-emerald-400 block">{gateResult.metricsSnapshot.healthScore}/100</span>
              </div>
              <div className="p-2.5 rounded-xl bg-pulse-elevated border border-pulse-subtle">
                <span className="text-[10px] text-pulse-muted block">Blocking Findings</span>
                <span className={`font-bold block ${gateResult.blockingFindings.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {gateResult.blockingFindings.length} blocked ({gateResult.warnings.length} warns)
                </span>
              </div>
            </div>
          </div>

          {/* 7 Check Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.values(gateResult.checks) as CIGateCheckDetail[]).map((chk) => (
              <div
                key={chk.id}
                className={`p-4 rounded-2xl border transition shadow-sm space-y-2.5 ${
                  chk.status === 'FAIL'
                    ? 'bg-rose-500/5 border-rose-500/30'
                    : chk.status === 'WARN'
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : 'bg-pulse-surface border-pulse-subtle'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {statusIcon(chk.status)}
                    <h3 className="text-xs font-bold text-pulse-primary font-mono">
                      {chk.name}
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    chk.status === 'PASS'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : chk.status === 'WARN'
                      ? 'bg-amber-500/15 text-amber-400'
                      : chk.status === 'FAIL'
                      ? 'bg-rose-500/15 text-rose-400'
                      : 'bg-pulse-elevated text-pulse-muted'
                  }`}>
                    {chk.status}
                  </span>
                </div>

                <p className="text-xs text-pulse-secondary leading-relaxed">
                  {chk.message}
                </p>

                {chk.details && chk.details.length > 0 && (
                  <div className="pt-2 border-t border-pulse-subtle/60 text-[11px] font-mono text-pulse-muted space-y-1">
                    {chk.details.slice(0, 3).map((d, i) => (
                      <div key={i} className="truncate">• {d}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Blocking Findings Review List (if any) */}
          {gateResult.blockingFindings.length > 0 && (
            <div className="p-5 rounded-3xl bg-rose-500/5 border border-rose-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="h-4 w-4 text-rose-500" />
                  <h3 className="text-sm font-bold text-pulse-primary">
                    Blocking Policy Findings ({gateResult.blockingFindings.length})
                  </h3>
                </div>
                <span className="text-xs font-mono text-rose-400">
                  Requires resolution before CI merge
                </span>
              </div>

              <div className="space-y-2">
                {gateResult.blockingFindings.map((finding) => (
                  <div
                    key={finding.id}
                    className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold uppercase">
                          {finding.priority}
                        </span>
                        <span className="font-bold text-pulse-primary truncate">
                          {finding.title}
                        </span>
                        <span className="text-[10px] font-mono text-pulse-muted">
                          {finding.file}:{finding.line}
                        </span>
                      </div>
                      <p className="text-pulse-secondary text-[11px] line-clamp-1">
                        {finding.message}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedFinding(finding);
                          setIsDetailModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-pulse-elevated hover:bg-pulse-surface border border-pulse-subtle text-[11px] font-semibold text-pulse-primary transition cursor-pointer"
                      >
                        Inspect Evidence
                      </button>
                      <button
                        onClick={() => {
                          sendAiRequest(
                            'problems',
                            `Explain and generate fix for CI blocking finding "${finding.title}" at line ${finding.line} in ${finding.file}: ${finding.message}`
                          );
                          setActiveTab('pulse-ai');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-teal-500 text-[#08110F] text-[11px] font-bold transition hover:bg-teal-400 cursor-pointer flex items-center space-x-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Fix</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: CONFIGURABLE PROJECT POLICIES & SIMULATION */}
      {activeSubTab === 'policy' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-pulse-subtle">
              <div>
                <h2 className="text-base font-bold text-pulse-primary font-sans flex items-center space-x-2">
                  <Sliders className="h-4 w-4 text-teal-400" />
                  <span>Project Quality & Security Gate Policies</span>
                </h2>
                <p className="text-xs text-pulse-secondary mt-0.5">
                  Configure blocking conditions, threshold limits, and opt-in PR commenting.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleResetPolicy}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-pulse-subtle bg-pulse-elevated text-xs font-mono text-pulse-muted hover:text-pulse-primary transition cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Default</span>
                </button>

                <button
                  onClick={handleSavePolicy}
                  className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Policy</span>
                </button>
              </div>
            </div>

            {saveToast && (
              <div className="p-3 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 text-xs flex items-center space-x-2 animate-fadeIn">
                <CheckCircle2 className="h-4 w-4" />
                <span>CI Policy configuration successfully updated and saved to project profile.</span>
              </div>
            )}

            {/* Policy Toggle Groups */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Group 1: Security Policies */}
              <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-3">
                <div className="flex items-center space-x-2 text-xs font-mono uppercase font-bold text-pulse-muted">
                  <Shield className="h-3.5 w-3.5 text-teal-400" />
                  <span>Security & Vulnerability Policies</span>
                </div>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-pulse-primary">Block Critical Vulnerabilities</div>
                    <div className="text-[10px] text-pulse-muted">Fail CI if SQLi, RCE, or Critical CVEs are detected</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={policy.blockCriticalVulnerabilities}
                    onChange={(e) => handleUpdatePolicy('blockCriticalVulnerabilities', e.target.checked)}
                    className="h-4 w-4 accent-teal-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-pulse-primary">Block Hardcoded Secrets</div>
                    <div className="text-[10px] text-pulse-muted">Prevent credentials, API keys, and tokens in code</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={policy.blockSecrets}
                    onChange={(e) => handleUpdatePolicy('blockSecrets', e.target.checked)}
                    className="h-4 w-4 accent-teal-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-pulse-primary">Block High-Severity Vulnerabilities</div>
                    <div className="text-[10px] text-pulse-muted">Fail CI if high-priority security defects are detected</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={policy.blockHighVulnerabilities}
                    onChange={(e) => handleUpdatePolicy('blockHighVulnerabilities', e.target.checked)}
                    className="h-4 w-4 accent-teal-500 cursor-pointer"
                  />
                </label>
              </div>

              {/* Group 2: Dependencies & Build */}
              <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-3">
                <div className="flex items-center space-x-2 text-xs font-mono uppercase font-bold text-pulse-muted">
                  <Layers className="h-3.5 w-3.5 text-teal-400" />
                  <span>Dependencies & Build Integrity</span>
                </div>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-pulse-primary">Block Critical Dependency CVEs</div>
                    <div className="text-[10px] text-pulse-muted">Reject vulnerable npm / pip packages with critical CVEs</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={policy.blockCriticalDependencies}
                    onChange={(e) => handleUpdatePolicy('blockCriticalDependencies', e.target.checked)}
                    className="h-4 w-4 accent-teal-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-pulse-primary">Block Build & Syntax Failures</div>
                    <div className="text-[10px] text-pulse-muted">Fail gate on syntax errors or invalid compilation</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={policy.blockBuildFailures}
                    onChange={(e) => handleUpdatePolicy('blockBuildFailures', e.target.checked)}
                    className="h-4 w-4 accent-teal-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-pulse-primary">Block Behavioral Regressions</div>
                    <div className="text-[10px] text-pulse-muted">Fail gate if high-friction regressions are detected</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={policy.blockRegressions}
                    onChange={(e) => handleUpdatePolicy('blockRegressions', e.target.checked)}
                    className="h-4 w-4 accent-teal-500 cursor-pointer"
                  />
                </label>
              </div>

              {/* Group 3: Test & Coverage Gate */}
              <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-3">
                <div className="flex items-center space-x-2 text-xs font-mono uppercase font-bold text-pulse-muted">
                  <TestTube2 className="h-3.5 w-3.5 text-teal-400" />
                  <span>Test Execution & Coverage Gate</span>
                </div>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-pulse-primary">Block on Unit Test Failures</div>
                    <div className="text-[10px] text-pulse-muted">Reject PR if any executed unit tests fail</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={policy.blockTestFailures}
                    onChange={(e) => handleUpdatePolicy('blockTestFailures', e.target.checked)}
                    className="h-4 w-4 accent-teal-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-pulse-primary">Enforce Minimum Code Coverage</div>
                    <div className="text-[10px] text-pulse-muted">Require test coverage threshold to be met</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={policy.requireCoverage}
                    onChange={(e) => handleUpdatePolicy('requireCoverage', e.target.checked)}
                    className="h-4 w-4 accent-teal-500 cursor-pointer"
                  />
                </label>

                {policy.requireCoverage && (
                  <div className="p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle flex items-center justify-between">
                    <span className="text-xs text-pulse-primary">Minimum Required Coverage</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={policy.minimumCoveragePercent}
                        onChange={(e) => handleUpdatePolicy('minimumCoveragePercent', Number(e.target.value))}
                        className="w-16 px-2 py-1 rounded bg-pulse-elevated border border-pulse-subtle text-xs font-mono text-center"
                      />
                      <span className="text-xs font-mono text-pulse-muted">%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Group 4: CI Comments & Reporting */}
              <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-3">
                <div className="flex items-center space-x-2 text-xs font-mono uppercase font-bold text-pulse-muted">
                  <Github className="h-3.5 w-3.5 text-teal-400" />
                  <span>PR Comments & Notifications (Opt-In)</span>
                </div>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-pulse-primary">Post GitHub / GitLab PR Summary</div>
                    <div className="text-[10px] text-pulse-muted">Automatically publish concise status table to PR</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={policy.enablePrSummaryComment}
                    onChange={(e) => handleUpdatePolicy('enablePrSummaryComment', e.target.checked)}
                    className="h-4 w-4 accent-teal-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-pulse-primary">Dry Run Mode</div>
                    <div className="text-[10px] text-pulse-muted">Evaluate gates without blocking external CI pipelines</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={policy.dryRun}
                    onChange={(e) => handleUpdatePolicy('dryRun', e.target.checked)}
                    className="h-4 w-4 accent-teal-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CI RUN HISTORY & AUDIT TRAIL */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-pulse-primary font-sans flex items-center space-x-2">
                  <History className="h-4 w-4 text-teal-400" />
                  <span>CI/CD Quality Gate Run History</span>
                </h2>
                <p className="text-xs text-pulse-secondary mt-0.5">
                  Audit trail of recent continuous evaluation runs with policy snapshots.
                </p>
              </div>

              {runHistory.length > 0 && (
                <button
                  onClick={() => {
                    CIGateEngine.clearHistory();
                    setRunHistory([]);
                  }}
                  className="text-xs text-rose-400 hover:underline font-mono cursor-pointer"
                >
                  Clear History
                </button>
              )}
            </div>

            {runHistory.length === 0 ? (
              <div className="text-center py-8 text-pulse-muted text-xs font-mono">
                No CI Gate runs recorded yet. Click "Re-Run Gate" to trigger an evaluation.
              </div>
            ) : (
              <div className="space-y-2">
                {runHistory.map((run) => (
                  <div
                    key={run.id}
                    className="p-3.5 rounded-2xl bg-pulse-elevated border border-pulse-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {statusIcon(run.status)}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${statusColor(run.status)}`}>
                          {run.status}
                        </span>
                        <span className="font-bold text-pulse-primary truncate">
                          {run.branch} ({run.commit.substring(0, 7)})
                        </span>
                        <span className="text-[10px] font-mono text-pulse-muted">
                          Policy v{run.policyVersion}
                        </span>
                      </div>
                      <p className="text-pulse-secondary text-[11px] truncate">
                        {run.primaryBlockingReason || 'All checks passed cleanly.'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 text-xs font-mono text-pulse-muted shrink-0">
                      <span>Health: <strong className="text-emerald-400">{run.metricsSnapshot.healthScore}/100</strong></span>
                      <span>Tests: <strong className="text-pulse-primary">{run.metricsSnapshot.testsPassed}P / {run.metricsSnapshot.testsFailed}F</strong></span>
                      <button
                        onClick={() => {
                          setGateResult(run);
                          setActiveSubTab('gate');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-pulse-surface hover:bg-pulse-elevated border border-pulse-subtle text-teal-400 font-semibold transition cursor-pointer"
                      >
                        Inspect Result
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: GITHUB ACTIONS & GITLAB CI INTEGRATION TEMPLATES */}
      {activeSubTab === 'integration' && (
        <div className="space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-pulse-primary font-sans flex items-center space-x-2">
                  <Github className="h-4 w-4 text-teal-400" />
                  <span>CI/CD Provider Configuration & GitHub Actions Workflow</span>
                </h2>
                <p className="text-xs text-pulse-secondary mt-0.5">
                  Copy-pasteable GitHub Actions workflow file to run DevPulse gates automatically on every Pull Request.
                </p>
              </div>

              <button
                onClick={() => {
                  const yml = `name: DevPulse Quality & Security Gate
on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main ]

jobs:
  devpulse-gate:
    name: DevPulse Quality Gate
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Run DevPulse CI Gate Check
        run: |
          echo "Running DevPulse Deterministic Quality Gate..."
          npx devpulse-gate --policy=strict --format=markdown >> $GITHUB_STEP_SUMMARY
        env:
          DEVPULSE_PROJECT_ID: \${{ secrets.DEVPULSE_PROJECT_ID }}
`;
                  navigator.clipboard.writeText(yml);
                  setCopiedScript(true);
                  setTimeout(() => setCopiedScript(false), 2000);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copiedScript ? 'Copied Workflow!' : 'Copy .github/workflows/devpulse.yml'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#0B1015] border border-pulse-subtle overflow-x-auto text-xs font-mono text-emerald-400 space-y-1">
              <div className="text-pulse-muted"># .github/workflows/devpulse-gate.yml</div>
              <div>name: DevPulse Quality & Security Gate</div>
              <div>on:</div>
              <div>&nbsp;&nbsp;pull_request:</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;branches: [ main, develop ]</div>
              <div>jobs:</div>
              <div>&nbsp;&nbsp;devpulse-gate:</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;name: DevPulse Quality Gate</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;runs-on: ubuntu-latest</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;steps:</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- uses: actions/checkout@v4</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- name: Run DevPulse Gate</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;run: npx devpulse-gate --policy=strict --format=markdown</div>
            </div>
          </div>
        </div>
      )}

      {/* Finding Detail Modal Reuse */}
      {selectedFinding && (
        <FindingDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedFinding(null);
          }}
          finding={selectedFinding}
          fileName={fileName}
          onFixWithAi={(f) => {
            setIsDetailModalOpen(false);
            sendAiRequest(
              'problems',
              `Explain and fix the finding "${f.title}" at line ${f.line} in ${f.file}: ${f.message}`
            );
            setActiveTab('pulse-ai');
          }}
        />
      )}
    </div>
  );
};
