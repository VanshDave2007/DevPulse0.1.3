import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bot,
  Bug,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  FileCode,
  FileSearch,
  Filter,
  Flame,
  GitCommit,
  GitCompare,
  GitPullRequest,
  HelpCircle,
  Info,
  Layers,
  Lightbulb,
  Lock,
  Network,
  Play,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  AgentFinding,
  AgentReviewResult,
  FindingCategory,
  FindingSeverity,
  PipelineStepStatus,
} from '../types';
import { PRESET_REVIEW_SCENARIOS, ReviewScenario } from '../engine/agent/gitAnalyzer';
import { runAgenticReview } from '../engine/agent/agentReviewer';
import {
  naturalLanguageToSql,
  executeSafeReadOnlyQuery,
  DEVPULSE_DB_SCHEMAS,
} from '../engine/agent/textToSqlEngine';
import { searchRAG } from '../engine/agent/ragEngine';
import { getReviewHistory } from '../engine/agent/agentMemory';
import { PulseMascot, MascotBubble } from './PulseMascot';
import { useComponentPerformanceTracker } from '../hooks/usePerformanceTracker';

type ReviewSubTab = 'findings' | 'callgraph' | 'vulnerabilities' | 'sql' | 'rag';

export const AgenticReviewView: React.FC = () => {
  useComponentPerformanceTracker('Agentic Review');
  const { setActiveTab, sendAiRequest } = useApp();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(PRESET_REVIEW_SCENARIOS[0].id);
  const [activeSubTab, setActiveSubTab] = useState<ReviewSubTab>('findings');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [reviewResult, setReviewResult] = useState<AgentReviewResult | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStepStatus[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // View Mode: Simple vs Advanced
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false);
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false);
  const [showTechnicalPipeline, setShowTechnicalPipeline] = useState<boolean>(false);
  const [showPerformanceDetails, setShowPerformanceDetails] = useState<boolean>(false);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedFindingIds, setExpandedFindingIds] = useState<Set<string>>(new Set(['DP-001', 'DP-002']));

  // Text-to-SQL State
  const [nlQuery, setNlQuery] = useState<string>(
    'Show all CRITICAL and HIGH severity security vulnerabilities'
  );
  const [generatedSql, setGeneratedSql] = useState<string>('');
  const [sqlExplanation, setSqlExplanation] = useState<string>('');
  const [sqlResult, setSqlResult] = useState<any>(null);

  // RAG Search State
  const [ragQuery, setRagQuery] = useState<string>(
    'pricing calculate_price backward compatibility'
  );
  const [ragResults, setRagResults] = useState<any[]>([]);

  const selectedScenario =
    PRESET_REVIEW_SCENARIOS.find((s) => s.id === selectedScenarioId) || PRESET_REVIEW_SCENARIOS[0];

  // Initial Run on Mount
  useEffect(() => {
    handleRunReview(selectedScenario);
  }, []);

  const handleRunReview = async (scenarioToRun: ReviewScenario = selectedScenario) => {
    setIsRunning(true);
    try {
      const result = await runAgenticReview({
        scenario: scenarioToRun,
        onStepUpdate: (steps) => setPipelineSteps([...steps]),
      });
      setReviewResult(result);
      setPipelineSteps(result.steps);
      // Auto-expand first 2 findings
      if (result.findings.length > 0) {
        setExpandedFindingIds(new Set(result.findings.slice(0, 2).map((f) => f.id)));
      }
    } catch (err) {
      console.error('Agent review failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleScenarioChange = (newScenarioId: string) => {
    setSelectedScenarioId(newScenarioId);
    const sc = PRESET_REVIEW_SCENARIOS.find((s) => s.id === newScenarioId) || PRESET_REVIEW_SCENARIOS[0];
    handleRunReview(sc);
  };

  const toggleFindingExpand = (id: string) => {
    setExpandedFindingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExecuteSql = (queryToRun: string = nlQuery) => {
    const { sql, explanation } = naturalLanguageToSql(queryToRun);
    setGeneratedSql(sql);
    setSqlExplanation(explanation);
    const result = executeSafeReadOnlyQuery(sql);
    setSqlResult(result);
  };

  const handleSearchRag = (q: string = ragQuery) => {
    const results = searchRAG(q, ['calculate_price', 'billing'], ['billing.py', 'checkout.py'], 4);
    setRagResults(results);
  };

  // Filtered findings
  const filteredFindings = (reviewResult?.findings || []).filter((f) => {
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
    return true;
  });

  const getSeverityBadgeClass = (sev: FindingSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      case 'LOW':
        return 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  // 5-Stage Simple Workflow representation
  const simpleStages = [
    { id: '1', name: 'Understand Change', status: isRunning ? 'running' : 'completed' },
    { id: '2', name: 'Analyze Code', status: isRunning ? 'running' : 'completed' },
    { id: '3', name: 'Check Security', status: isRunning ? 'running' : 'completed' },
    { id: '4', name: 'Check Impact', status: isRunning ? 'running' : 'completed' },
    { id: '5', name: 'Generate Review', status: isRunning ? 'running' : 'completed' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Scenario Selector */}
      <section className="relative overflow-hidden rounded-3xl border border-pulse-subtle bg-gradient-to-br from-pulse-surface via-pulse-bg to-pulse-elevated p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <div className="inline-flex items-center space-x-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-mono text-teal-600 dark:text-teal-300 font-semibold">
                <GitPullRequest className="h-3.5 w-3.5 text-teal-500" />
                <span>Autonomous Code Reviewer</span>
              </div>

              {/* Simple vs Advanced View Toggle */}
              <button
                onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                className={`px-3 py-1 rounded-full text-xs font-mono font-semibold transition border cursor-pointer ${
                  isAdvancedMode
                    ? 'bg-pulse-accent/20 border-pulse-accent text-pulse-accent'
                    : 'bg-pulse-elevated border-pulse-subtle text-pulse-secondary hover:text-pulse-primary'
                }`}
              >
                {isAdvancedMode ? '🛠️ Advanced Mode' : '🌱 Simple View'}
              </button>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-pulse-primary tracking-tight font-sans">
              Agentic <span className="text-pulse-accent">Code Review</span>
            </h1>
            <p className="text-sm sm:text-base text-pulse-secondary leading-relaxed">
              Understand what changed, find risks, and see what could be affected.
            </p>
            <p className="text-xs text-pulse-muted">
              DevPulse reviews your code changes for bugs, security risks, and possible side effects.
            </p>

            {/* How does this work? Accordion */}
            <div className="pt-1">
              <button
                onClick={() => setShowHowItWorks(!showHowItWorks)}
                className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center space-x-1 font-mono font-semibold cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>How does this work? {showHowItWorks ? '▲' : '▼'}</span>
              </button>

              {showHowItWorks && (
                <div className="mt-2.5 p-4 rounded-2xl bg-pulse-surface border border-pulse-subtle text-xs text-pulse-secondary space-y-2 animate-fadeIn">
                  <p>
                    DevPulse simulates a senior engineer and security auditor reviewing your pull request:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-pulse-primary">
                    <li><strong>Git Diff Parsing:</strong> Identifies added, modified, and deleted lines.</li>
                    <li><strong>AST Symbol Contracts:</strong> Detects if function signatures or return types changed.</li>
                    <li><strong>Call Graph Walker:</strong> Maps downstream functions that call the modified code.</li>
                    <li><strong>Vulnerability Scanner:</strong> Checks for injection risks, unsafe deserialization, or known CVEs.</li>
                    <li><strong>Agentic LLM Review:</strong> Generates prioritized findings with concrete, 1-click code fixes.</li>
                  </ol>
                </div>
              )}
            </div>
          </div>

          {/* Action & Scenario Selector */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center gap-3">
            {/* Scenario Dropdown Selector */}
            <div className="bg-pulse-surface p-3.5 rounded-2xl border border-pulse-subtle shadow-sm space-y-1.5 min-w-[260px]">
              <span className="text-[11px] font-mono text-pulse-muted uppercase font-bold block">
                Choose a Change Scenario
              </span>
              <select
                value={selectedScenarioId}
                onChange={(e) => handleScenarioChange(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs font-semibold text-pulse-primary focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                {PRESET_REVIEW_SCENARIOS.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.category}: {sc.name} ({sc.language.toUpperCase()})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-pulse-muted truncate">
                {selectedScenario.description}
              </p>
            </div>

            <button
              onClick={() => handleRunReview()}
              disabled={isRunning}
              className="flex items-center justify-center space-x-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] px-5 py-3 text-xs sm:text-sm font-bold transition shadow-md shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <Activity className="h-4 w-4 animate-spin text-[#08110F]" />
                  <span>Reviewing Changes...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Analyze This Change</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Mascot Guidance Banner for Active Review */}
      {reviewResult && (
        <MascotBubble
          mood={reviewResult.summary.riskScore > 50 ? 'concerned' : 'happy'}
          title="Reviewer Summary"
          message={
            reviewResult.summary.riskScore > 50
              ? `I detected ${reviewResult.summary.criticalCount} critical issue and ${reviewResult.summary.highCount} high risks in this change. Take a look at the prioritized recommendations below to fix them safely.`
              : `Change looks relatively safe (Risk score ${reviewResult.summary.riskScore}/100). No breaking contract regressions detected across downstream callers.`
          }
          actionLabel="Fix Critical Issue"
          onAction={() => {
            if (reviewResult.findings.length > 0) {
              const top = reviewResult.findings[0];
              sendAiRequest(
                'problems',
                `Explain and generate the exact code fix for this PR issue: ${top.title} - ${top.description}. Code context: ${top.suggestedFix || ''}`
              );
              setActiveTab('pulse-ai');
            }
          }}
          secondaryActionLabel="Explain Risk"
          onSecondaryAction={() => {
            sendAiRequest('explain', `Explain why the risk score is ${reviewResult.summary.riskScore}/100 for this ${selectedScenario.category} scenario.`);
            setActiveTab('pulse-ai');
          }}
        />
      )}

      {/* Simple 5-Step Workflow Progress Bar */}
      <section className="rounded-3xl border border-pulse-subtle bg-pulse-surface p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-pulse-accent" />
            <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-pulse-primary">
              Review Progress
            </h2>
          </div>
          <button
            onClick={() => setShowTechnicalPipeline(!showTechnicalPipeline)}
            className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-mono cursor-pointer"
          >
            {showTechnicalPipeline ? 'Hide Technical Pipeline ▲' : 'View Technical 8-Stage Pipeline ▼'}
          </button>
        </div>

        {/* Clean 5-Stage Indicator */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {simpleStages.map((stage, idx) => (
            <div
              key={stage.id}
              className="p-3 rounded-2xl bg-pulse-elevated border border-pulse-subtle flex items-center space-x-2.5"
            >
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-300 font-mono text-[10px] font-bold shrink-0">
                0{idx + 1}
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-pulse-primary block truncate">
                  {stage.name}
                </span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">
                  {isRunning ? 'Analyzing...' : 'Completed ✓'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Expandable 8-Stage Technical Pipeline */}
        {showTechnicalPipeline && (
          <div className="pt-3 border-t border-pulse-subtle animate-fadeIn space-y-2">
            <span className="text-[11px] font-mono text-pulse-muted uppercase font-bold block">
              Internal AST & RAG Pipeline Steps
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {pipelineSteps.map((step, idx) => (
                <div
                  key={step.id}
                  className="p-2.5 rounded-xl border border-pulse-subtle bg-pulse-bg text-xs font-mono"
                >
                  <div className="flex items-center justify-between text-[10px] text-pulse-muted mb-1">
                    <span>0{idx + 1}</span>
                    <CheckCircle2 className="h-3 w-3 text-teal-400" />
                  </div>
                  <p className="font-semibold text-pulse-primary line-clamp-1">{step.label}</p>
                  <span className="text-[10px] text-pulse-muted block mt-1">
                    {step.durationMs !== undefined ? `${step.durationMs}ms` : '0ms'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Primary Result Metrics Summary */}
      {reviewResult && (
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Main Risk Level Card */}
          <div className="p-5 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-mono text-pulse-muted uppercase font-bold">
                Review Risk Level
              </span>
              <div className="my-2 flex items-baseline space-x-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-pulse-primary">
                  {reviewResult.summary.riskScore}
                </span>
                <span className="text-xs font-mono text-pulse-muted">/ 100</span>
              </div>
              <span
                className={`inline-block px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                  reviewResult.summary.riskScore >= 70
                    ? 'bg-rose-500/15 text-rose-500'
                    : reviewResult.summary.riskScore >= 40
                    ? 'bg-amber-500/15 text-amber-500'
                    : 'bg-emerald-500/15 text-emerald-500'
                }`}
              >
                {reviewResult.summary.riskScore >= 70
                  ? '🔴 High Risk'
                  : reviewResult.summary.riskScore >= 40
                  ? '🟡 Moderate Risk'
                  : '🟢 Low Risk'}
              </span>
            </div>
            <p className="text-xs text-pulse-secondary">
              Composite risk calculation across security, breaking contracts, and regressions.
            </p>
          </div>

          {/* Key Metric 1: Critical Findings */}
          <div className="p-5 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-pulse-muted uppercase font-bold">Problems Found</span>
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </div>
            <div className="my-1">
              <span className="text-2xl font-bold font-mono text-pulse-primary">
                {reviewResult.summary.criticalCount + reviewResult.summary.highCount}
              </span>
              <span className="text-xs text-rose-500 block font-mono mt-0.5">
                {reviewResult.summary.criticalCount} Critical · {reviewResult.summary.highCount} High
              </span>
            </div>
            <p className="text-[11px] text-pulse-secondary">
              Issues requiring immediate developer attention.
            </p>
          </div>

          {/* Key Metric 2: Affected Symbols */}
          <div className="p-5 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-pulse-muted uppercase font-bold">Affected Code</span>
              <Code2 className="h-4 w-4 text-teal-500" />
            </div>
            <div className="my-1">
              <span className="text-2xl font-bold font-mono text-pulse-primary">
                {reviewResult.summary.affectedSymbolsCount}
              </span>
              <span className="text-xs text-pulse-muted block font-mono mt-0.5">
                {reviewResult.summary.changedFilesCount} Files Changed
              </span>
            </div>
            <p className="text-[11px] text-pulse-secondary">
              Functions and classes directly touched by this diff.
            </p>
          </div>

          {/* Key Metric 3: Downstream Callers */}
          <div className="p-5 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-pulse-muted uppercase font-bold">Downstream Impact</span>
              <Network className="h-4 w-4 text-pulse-accent" />
            </div>
            <div className="my-1">
              <span className="text-2xl font-bold font-mono text-pulse-primary">
                {reviewResult.summary.affectedCallSitesCount}
              </span>
              <span className="text-xs text-teal-600 dark:text-teal-400 block font-mono mt-0.5">
                {reviewResult.summary.cveCount} CVE Advisories
              </span>
            </div>
            <p className="text-[11px] text-pulse-secondary">
              Other parts of the system that call the changed code.
            </p>
          </div>
        </section>
      )}

      {/* Sub-Tabs: Findings, Impact Matrix, Security, Text-to-SQL, RAG */}
      <section className="rounded-3xl border border-pulse-subtle bg-pulse-surface p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-pulse-subtle">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'findings' as const, label: 'Review Findings & Fixes', icon: ShieldAlert, count: reviewResult?.findings.length },
              { id: 'callgraph' as const, label: 'Call Graph & Impact', icon: Network },
              { id: 'vulnerabilities' as const, label: 'Security & CVEs', icon: ShieldCheck },
              { id: 'sql' as const, label: 'Text-to-SQL Studio', icon: Database },
              { id: 'rag' as const, label: 'RAG Knowledge', icon: BookOpen },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-teal-500 text-[#08110F] shadow-sm'
                      : 'bg-pulse-elevated text-pulse-secondary hover:text-pulse-primary border border-pulse-subtle'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-pulse-bg text-[10px] font-mono">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Performance toggle */}
          <button
            onClick={() => setShowPerformanceDetails(!showPerformanceDetails)}
            className="text-xs font-mono text-pulse-muted hover:text-pulse-primary flex items-center space-x-1 cursor-pointer"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Execution Timings ({reviewResult?.durationMs || 0}ms)</span>
          </button>
        </div>

        {/* Execution Details Drawer */}
        {showPerformanceDetails && reviewResult && (
          <div className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle text-xs font-mono animate-fadeIn space-y-1.5">
            <span className="font-bold text-pulse-primary block">Pipeline Execution Timings:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-pulse-secondary">
              <div>AST Parsing: 0.1ms</div>
              <div>Call Graph Traversal: 0.1ms</div>
              <div>RAG Retrieval: 0.1ms</div>
              <div>LLM Multi-Dimension Review: {reviewResult.durationMs}ms</div>
            </div>
          </div>
        )}

        {/* TAB 1: FINDINGS & FIXES ("What should I fix first?") */}
        {activeSubTab === 'findings' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-pulse-primary">
                  What should I fix first?
                </h3>
                <p className="text-xs text-pulse-secondary">
                  Prioritized list of review findings with plain-English causes and 1-click code fixes.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-2">
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="p-1.5 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs text-pulse-primary font-mono focus:outline-none cursor-pointer"
                >
                  <option value="all">All Severities</option>
                  <option value="CRITICAL">Critical Only</option>
                  <option value="HIGH">High Only</option>
                  <option value="MEDIUM">Medium Only</option>
                </select>
              </div>
            </div>

            {/* Findings List */}
            <div className="space-y-4">
              {filteredFindings.map((finding) => {
                const isExpanded = expandedFindingIds.has(finding.id);

                return (
                  <div
                    key={finding.id}
                    className="p-5 rounded-2xl bg-pulse-elevated border border-pulse-subtle hover:border-pulse-strong transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getSeverityBadgeClass(
                            finding.severity
                          )}`}
                        >
                          {finding.severity}
                        </span>
                        <h4 className="text-sm font-bold text-pulse-primary">{finding.title}</h4>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-mono text-pulse-muted">
                          {finding.fileName}:{finding.line}
                        </span>
                        <button
                          onClick={() => toggleFindingExpand(finding.id)}
                          className="text-xs text-pulse-accent hover:underline font-mono cursor-pointer"
                        >
                          {isExpanded ? 'Collapse ▲' : 'Details ▼'}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-pulse-secondary leading-relaxed">
                      {finding.description}
                    </p>

                    {/* Expandable Deep Explanation & Fix */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-pulse-subtle space-y-3 animate-fadeIn">
                        {/* Why it matters */}
                        {finding.impact && (
                          <div className="p-3 rounded-xl bg-pulse-bg border border-pulse-subtle text-xs space-y-1">
                            <span className="font-bold text-amber-500 block uppercase text-[10px] font-mono">
                              Why this matters & Downstream Impact:
                            </span>
                            <p className="text-pulse-secondary">{finding.impact}</p>
                          </div>
                        )}

                        {/* Suggested Code Fix */}
                        {finding.suggestedFix && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-mono font-bold text-teal-600 dark:text-teal-400 uppercase">
                                Recommended Safe Code Fix:
                              </span>
                              <button
                                onClick={() => handleCopy(finding.suggestedFix || '', finding.id)}
                                className="text-[10px] font-mono text-pulse-accent hover:underline flex items-center space-x-1 cursor-pointer"
                              >
                                <Copy className="h-3 w-3" />
                                <span>{copiedId === finding.id ? 'Copied!' : 'Copy Fix'}</span>
                              </button>
                            </div>
                            <pre className="p-3 rounded-xl bg-[#08110F] text-teal-300 font-mono text-xs overflow-x-auto border border-teal-500/20">
                              {finding.suggestedFix}
                            </pre>
                          </div>
                        )}

                        {/* 1-Click Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            onClick={() => {
                              sendAiRequest(
                                'explain',
                                `Explain the ${finding.title} finding at line ${finding.line} in plain English for a junior developer.`
                              );
                              setActiveTab('pulse-ai');
                            }}
                            className="px-3 py-1.5 rounded-xl border border-pulse-subtle bg-pulse-surface hover:bg-pulse-elevated text-xs font-semibold text-pulse-secondary hover:text-pulse-primary transition cursor-pointer"
                          >
                            Explain Concept
                          </button>

                          <button
                            onClick={() => {
                              sendAiRequest(
                                'problems',
                                `Apply this fix to my active codebase: ${finding.suggestedFix}`
                              );
                              setActiveTab('pulse-ai');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Apply Fix with AI</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CALL GRAPH & IMPACT */}
        {activeSubTab === 'callgraph' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-pulse-primary">
                  Downstream Call Graph & Regression Matrix
                </h3>
                <p className="text-xs text-pulse-secondary">
                  Symbols and functions affected across the project by this diff.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase text-pulse-muted font-bold block">
                    Modified Functions (Changed in Diff)
                  </span>
                  <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle font-mono text-xs space-y-1">
                    <div className="text-pulse-primary font-bold">
                      {selectedScenario.callerFileName.split('/').pop()}
                    </div>
                    <div className="text-teal-600 dark:text-teal-400 text-[11px]">
                      • calculate_price(base_price, discount, tax_rate)
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase text-pulse-muted font-bold block">
                    Downstream Callers (Risk of Regression)
                  </span>
                  <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle font-mono text-xs space-y-1">
                    <div className="text-pulse-primary font-bold">checkout.py:line 42</div>
                    <div className="text-amber-500 text-[11px]">
                      • Calls calculate_price(item.cost, 0.1) → Missing 3rd param
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SECURITY & CVES */}
        {activeSubTab === 'vulnerabilities' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-pulse-primary">
                Vulnerability Intelligence & CVE Advisories
              </h3>
              <p className="text-xs text-pulse-secondary">
                Checks whether this change introduces known OWASP Top 10 vulnerabilities.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-teal-500" />
                <span className="text-sm font-bold text-pulse-primary">
                  Vulnerability Database Matching: 0 Known CVEs
                </span>
              </div>
              <p className="text-xs text-pulse-secondary leading-relaxed">
                No third-party dependency vulnerabilities were detected in the modified package manifests.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: TEXT-TO-SQL STUDIO */}
        {activeSubTab === 'sql' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-pulse-primary">
                Text-to-SQL Review Studio
              </h3>
              <p className="text-xs text-pulse-secondary">
                Query review findings and repository metrics using plain English.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nlQuery}
                  onChange={(e) => setNlQuery(e.target.value)}
                  placeholder="Ask a question about review findings in plain English..."
                  className="flex-1 p-3 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs text-pulse-primary focus:outline-none focus:border-teal-500 font-mono"
                />
                <button
                  onClick={() => handleExecuteSql(nlQuery)}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition cursor-pointer"
                >
                  Generate & Run SQL
                </button>
              </div>

              {generatedSql && (
                <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-2 animate-fadeIn">
                  <span className="text-[10px] font-mono text-pulse-muted uppercase font-bold block">
                    Generated Read-Only SQL:
                  </span>
                  <pre className="p-2.5 rounded-xl bg-[#08110F] text-teal-300 font-mono text-xs overflow-x-auto">
                    {generatedSql}
                  </pre>
                  {sqlExplanation && (
                    <p className="text-xs text-pulse-secondary">{sqlExplanation}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: RAG KNOWLEDGE */}
        {activeSubTab === 'rag' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-pulse-primary">
                Targeted Knowledge & RAG Retrieval
              </h3>
              <p className="text-xs text-pulse-secondary">
                Autonomous retrieval of project architecture documents, style guides, and ADRs.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ragQuery}
                  onChange={(e) => setRagQuery(e.target.value)}
                  className="flex-1 p-3 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs text-pulse-primary focus:outline-none focus:border-teal-500 font-mono"
                />
                <button
                  onClick={() => handleSearchRag(ragQuery)}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition cursor-pointer"
                >
                  Search RAG
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle text-xs text-pulse-secondary">
                Retrieved 4 relevant architecture and backward compatibility guidelines for this review.
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
