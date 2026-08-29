import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Cpu,
  FileCode,
  Fingerprint,
  FolderGit2,
  GitPullRequest,
  GraduationCap,
  HeartPulse,
  HelpCircle,
  Info,
  Layers,
  Lightbulb,
  Lock,
  Network,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HealthScoreGauge } from './HealthScoreGauge';
import { SAMPLE_PROJECTS } from '../data/samples';
import { PulseMascot, MascotBubble } from './PulseMascot';
import { MetricDetailModal, MetricType } from './MetricDetailModal';
import { HealthBreakdownDrawer } from './HealthBreakdownDrawer';
import { EvidenceDrawer } from './EvidenceDrawer';
import { SessionSummaryWidget } from './SessionSummaryWidget';
import { ActionCenterWidget } from './ActionCenterWidget';
import { CodeSmell } from '../types';
import { useComponentPerformanceTracker } from '../hooks/usePerformanceTracker';
import { ProjectMemoryModal } from './ProjectMemoryModal';
import { ProjectMemoryService } from '../services/projectMemoryService';
import { BookOpen } from 'lucide-react';

export const DashboardView: React.FC = () => {
  useComponentPerformanceTracker('Observatory Dashboard');
  const {
    analysis,
    setActiveTab,
    loadPreset,
    sendAiRequest,
    fileName,
    language,
    isAnalyzing,
    runAnalysis,
    code,
  } = useApp();

  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [activeModalMetric, setActiveModalMetric] = useState<MetricType | null>(null);
  const [isHealthDrawerOpen, setIsHealthDrawerOpen] = useState(false);
  const [selectedEvidenceSmell, setSelectedEvidenceSmell] = useState<CodeSmell | null>(null);
  const [showFixDiffStrip, setShowFixDiffStrip] = useState(false);
  const [isProjectMemoryOpen, setIsProjectMemoryOpen] = useState(false);

  const memoryStats = ProjectMemoryService.getMemoryStats();

  // Loading State with Thinking Mascot
  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 animate-fadeIn min-h-[60vh]">
        <PulseMascot pose="loading" size="xl" />
        <div className="space-y-1 max-w-md">
          <h2 className="text-xl font-bold text-pulse-primary font-sans">
            Scanning & Calibrating AST Intelligence...
          </h2>
          <p className="text-xs text-pulse-muted font-mono">
            Evaluating control flow, dependency graph, cognitive complexity, and heuristic smells.
          </p>
        </div>
      </div>
    );
  }

  // Empty State with Guiding Mascot
  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-6 animate-fadeIn min-h-[60vh]">
        <PulseMascot pose="guiding" size="xl" />
        <div className="space-y-2 max-w-lg">
          <h2 className="text-2xl font-bold text-pulse-primary font-sans">
            Welcome to DevPulse Observatory
          </h2>
          <p className="text-sm text-pulse-secondary leading-relaxed">
            No file is currently loaded for inspection. Select one of the verified sample codebases below to start analyzing AST heuristics and security telemetry.
          </p>
        </div>

        {/* Quick Sample Code Loaders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-3xl pt-2">
          {SAMPLE_PROJECTS.slice(0, 4).map((p) => (
            <button
              key={p.id}
              onClick={() => loadPreset(p.id)}
              className="p-4 rounded-2xl bg-pulse-surface hover:bg-pulse-elevated border border-pulse-subtle hover:border-pulse-strong text-left transition group shadow-sm flex flex-col justify-between cursor-pointer"
            >
              <div>
                <span className="text-[10px] font-mono uppercase text-teal-600 dark:text-teal-400 font-bold">
                  {p.language} · {p.category}
                </span>
                <h4 className="text-xs font-bold text-pulse-primary group-hover:text-pulse-accent mt-1">
                  {p.title}
                </h4>
                <p className="text-[11px] text-pulse-secondary mt-1 line-clamp-2">
                  {p.description}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-pulse-subtle text-[11px] font-mono text-pulse-muted group-hover:text-pulse-primary">
                <span>1-Click Load</span>
                <Play className="h-3 w-3 text-pulse-accent" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const { metrics, smells, summary } = analysis;
  const quickPresets = SAMPLE_PROJECTS.slice(0, 4);

  // Health Assessment
  const getHealthAssessment = (score: number) => {
    if (score >= 85)
      return {
        label: 'Excellent Health',
        statusPill: '🟢 Excellent',
        desc: 'Your code is clean, robust, and well-structured.',
        color: 'text-emerald-500',
        badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        mascotPose: 'success' as const,
      };
    if (score >= 70)
      return {
        label: 'Good Health',
        statusPill: '🟢 Good',
        desc: 'Your project is in solid shape with minor polish opportunities.',
        color: 'text-teal-500',
        badgeBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
        mascotPose: 'happy' as const,
      };
    if (score >= 50)
      return {
        label: 'Needs Attention',
        statusPill: '🟡 Needs Attention',
        desc: 'Complexity and code smells may introduce maintenance friction.',
        color: 'text-amber-500',
        badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        mascotPose: 'vulnerability_found' as const,
      };
    return {
      label: 'Critical Condition',
      statusPill: '🔴 Critical',
      desc: 'High complexity, anti-patterns, or security risks should be addressed promptly.',
      color: 'text-rose-500',
      badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      mascotPose: 'security_alert' as const,
    };
  };

  const healthInfo = getHealthAssessment(metrics.healthScore);

  const handleFixWithAi = (finding: CodeSmell) => {
    sendAiRequest(
      'problems',
      `Explain and fix the issue "${finding.title}" at line ${finding.line} in ${fileName}: ${finding.problem}\n\nRecommended solution: ${finding.solution || finding.recommendation}`
    );
    setActiveTab('pulse-ai');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn select-none">
      {/* Before / After AI Fix Diff Strip (Demonstrator) */}
      {showFixDiffStrip && (
        <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex flex-wrap items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <PulseMascot pose="code_fixed" size="sm" />
            <div>
              <h4 className="text-xs font-bold text-pulse-primary font-mono flex items-center space-x-2">
                <span>AI Refactoring Applied</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400">
                  Telemetry Updated
                </span>
              </h4>
              <div className="flex items-center space-x-3 text-xs font-mono mt-0.5 text-pulse-secondary">
                <span>Health: <strong className="text-emerald-500">+{Math.max(15, 100 - metrics.healthScore)} ↑</strong></span>
                <span>Complexity: <strong className="text-teal-400">-{Math.round(metrics.cyclomaticComplexity * 0.4)} ↓</strong></span>
                <span>Smells: <strong className="text-teal-400">-{smells.length} ✓</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('analyzer')}
              className="px-3 py-1.5 rounded-xl bg-teal-500 text-[#08110F] text-xs font-bold transition hover:bg-teal-400 cursor-pointer"
            >
              Inspect in Analyzer
            </button>
            <button
              onClick={() => setShowFixDiffStrip(false)}
              className="p-1.5 rounded-xl text-pulse-muted hover:text-pulse-primary text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 1. HERO SECTION: File Info, Dynamic Mascot Reaction & Primary Actions */}
      <section className="relative overflow-hidden rounded-3xl border border-pulse-subtle bg-gradient-to-br from-pulse-surface via-pulse-bg to-pulse-elevated p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Context Badge Strip */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center space-x-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-mono text-teal-600 dark:text-teal-300 font-semibold">
                <FileCode className="h-3.5 w-3.5 text-teal-500 dark:text-teal-400" />
                <span>{fileName}</span>
              </div>

              <div className="inline-flex items-center space-x-1.5 rounded-full border border-pulse-subtle bg-pulse-elevated px-3 py-1 text-xs font-mono text-pulse-secondary">
                <span className="capitalize">{analysis.languageName} · Deep AST & Heuristics</span>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${healthInfo.badgeBg}`}>
                {healthInfo.statusPill}
              </span>
            </div>

            {/* Title & Mascot Row */}
            <div className="flex items-center space-x-4">
              <PulseMascot pose={healthInfo.mascotPose} size="lg" className="shrink-0 hidden sm:inline-flex" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-pulse-primary tracking-tight font-sans">
                  Observatory <span className="text-pulse-accent">Dashboard</span>
                </h1>
                <p className="text-xs sm:text-sm text-pulse-secondary leading-relaxed mt-1">
                  {healthInfo.desc} High-priority diagnostics, verified evidence, and 1-click AI remediations.
                </p>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('analyzer')}
                className="flex items-center space-x-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] px-4 py-2.5 text-xs sm:text-sm font-bold transition shadow-md shadow-teal-500/20 cursor-pointer"
              >
                <Code2 className="h-4 w-4" />
                <span>Open Code Analyzer</span>
              </button>

              <button
                onClick={() => {
                  sendAiRequest(
                    'problems',
                    `Perform a priority-ordered code audit of ${fileName} and provide automated fixes for all identified smells.`
                  );
                  setActiveTab('pulse-ai');
                }}
                className="flex items-center space-x-2 rounded-xl border border-pulse-subtle bg-pulse-elevated hover:bg-pulse-elevated-hover px-4 py-2.5 text-xs sm:text-sm font-semibold text-pulse-primary transition cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-pulse-accent" />
                <span>Fix with AI</span>
              </button>

              <button
                onClick={() => setActiveTab('pulse-map')}
                className="flex items-center space-x-2 rounded-xl border border-pulse-subtle bg-pulse-elevated hover:bg-pulse-elevated-hover px-4 py-2.5 text-xs sm:text-sm font-semibold text-pulse-primary transition cursor-pointer"
              >
                <Network className="h-4 w-4" />
                <span>View Architecture</span>
              </button>
            </div>
          </div>

          {/* Quick Preset Sample Picker */}
          <div className="w-full lg:w-auto bg-pulse-surface p-4 rounded-2xl border border-pulse-subtle shadow-sm min-w-[280px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase text-pulse-muted font-bold">
                Try Sample Code:
              </span>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-semibold">1-Click Load</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickPresets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => loadPreset(p.id)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-left transition group cursor-pointer"
                >
                  <div className="truncate mr-2">
                    <p className="text-xs font-semibold text-pulse-primary group-hover:text-pulse-accent truncate">
                      {p.title}
                    </p>
                    <p className="text-[10px] text-pulse-muted uppercase font-mono">
                      {p.language}
                    </p>
                  </div>
                  <Play className="h-3.5 w-3.5 text-pulse-accent shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. ✨ ACTION CENTER & INTELLIGENT FINDINGS (Multi-Signal Prioritized Intelligence) */}
      <ActionCenterWidget />

      {/* 2.5. ACTIVE SESSION INTELLIGENCE & STATISTICAL SUMMARY */}
      <SessionSummaryWidget />

      {/* 2.6. PROJECT INTELLIGENCE & DURABLE CONTEXT */}
      <section className="p-4 sm:p-5 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-300">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-mono uppercase text-pulse-muted font-bold tracking-wider">
                Project Intelligence
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-500/10 text-teal-500 border border-teal-500/20 font-semibold">
                Active Memory
              </span>
            </div>
            <p className="text-xs text-pulse-secondary mt-0.5">
              Authoritative rules, recorded technical debt, architecture decisions, and false positives.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-pulse-elevated border border-pulse-subtle">
              <span className="text-pulse-muted uppercase text-[10px]">Rules:</span>
              <strong className="text-pulse-primary">{memoryStats.byType.rules}</strong>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-pulse-elevated border border-pulse-subtle">
              <span className="text-pulse-muted uppercase text-[10px]">Debt:</span>
              <strong className="text-amber-500">{memoryStats.byType.techDebt}</strong>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-pulse-elevated border border-pulse-subtle">
              <span className="text-pulse-muted uppercase text-[10px]">Decisions:</span>
              <strong className="text-pulse-primary">{memoryStats.byType.architecture}</strong>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-pulse-elevated border border-pulse-subtle">
              <span className="text-pulse-muted uppercase text-[10px]">FP:</span>
              <strong className="text-teal-400">{memoryStats.byType.falsePositives}</strong>
            </div>
          </div>

          <button
            onClick={() => setIsProjectMemoryOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-600 dark:text-teal-300 text-xs font-bold transition cursor-pointer shrink-0 flex items-center space-x-1.5"
          >
            <span>View Project Memory</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* 3. CODE HEALTH SUMMARY & 4 DIMENSION CARDS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Central Health Score Gauge */}
        <div className="lg:col-span-1 flex flex-col">
          <div className="flex-1 p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-pulse-muted font-bold">Overall Code Health</span>
              <button
                onClick={() => setIsHealthDrawerOpen(true)}
                className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center space-x-1 font-mono cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>How is this calculated?</span>
              </button>
            </div>

            <HealthScoreGauge score={metrics.healthScore} metrics={metrics} />

            <div className="p-3.5 rounded-2xl bg-pulse-elevated border border-pulse-subtle text-center space-y-1">
              <span className={`text-xs font-bold font-mono ${healthInfo.color}`}>
                {healthInfo.label} ({metrics.healthScore}/100)
              </span>
              <p className="text-[11px] text-pulse-secondary leading-relaxed">
                {healthInfo.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Right: 4 Primary Metrics with the "One Explanation Pattern" */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Card 1: Complexity */}
            <div className="p-4 rounded-2xl bg-pulse-surface border border-pulse-subtle flex flex-col justify-between hover:border-pulse-strong transition shadow-sm space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-pulse-muted uppercase font-bold">
                    Control Flow & Complexity
                  </span>
                  <button
                    onClick={() => setActiveModalMetric('complexity')}
                    className="text-pulse-muted hover:text-pulse-accent cursor-pointer"
                    title="What does this mean?"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="my-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold font-mono text-pulse-primary">
                    {metrics.cyclomaticComplexity}
                  </span>
                  <span className="text-xs font-mono text-pulse-muted">branch points</span>
                  <span
                    className={`ml-auto px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      metrics.cyclomaticComplexity > 10
                        ? 'bg-rose-500/15 text-rose-500'
                        : metrics.cyclomaticComplexity > 5
                        ? 'bg-amber-500/15 text-amber-500'
                        : 'bg-emerald-500/15 text-emerald-500'
                    }`}
                  >
                    {metrics.cyclomaticComplexity > 10 ? 'High' : metrics.cyclomaticComplexity > 5 ? 'Moderate' : 'Low 🟢'}
                  </span>
                </div>

                <p className="text-xs text-pulse-secondary leading-relaxed">
                  How complicated your code is to mentally trace and test.
                </p>

                <div className="mt-2 text-[11px] text-pulse-muted font-mono space-y-0.5">
                  <div>• Cognitive Complexity: <strong>{metrics.cognitiveComplexity}</strong></div>
                  <div>• Max Nesting Depth: <strong>{metrics.maxNestingDepth} levels</strong></div>
                </div>
              </div>

              <div className="pt-2 border-t border-pulse-subtle flex items-center justify-between">
                <button
                  onClick={() => setActiveModalMetric('complexity')}
                  className="text-[11px] text-pulse-accent hover:underline font-mono text-left font-semibold cursor-pointer"
                >
                  ⓘ Explain complexity & analogy
                </button>
                <button
                  onClick={() => setActiveTab('analyzer')}
                  className="text-[11px] text-pulse-secondary hover:text-pulse-primary font-mono cursor-pointer"
                >
                  View Code →
                </button>
              </div>
            </div>

            {/* Card 2: Code Size & SLOC */}
            <div className="p-4 rounded-2xl bg-pulse-surface border border-pulse-subtle flex flex-col justify-between hover:border-pulse-strong transition shadow-sm space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-pulse-muted uppercase font-bold">
                    Lines of Code
                  </span>
                  <button
                    onClick={() => setActiveModalMetric('loc')}
                    className="text-pulse-muted hover:text-pulse-accent cursor-pointer"
                    title="What is SLOC?"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="my-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold font-mono text-pulse-primary">
                    {metrics.loc}
                  </span>
                  <span className="text-xs font-mono text-pulse-muted">total lines</span>
                  <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    {metrics.sloc} SLOC
                  </span>
                </div>

                <p className="text-xs text-pulse-secondary leading-relaxed">
                  Total physical lines versus actual executable source statements.
                </p>

                <div className="mt-2 text-[11px] text-pulse-muted font-mono space-y-0.5">
                  <div>• Comment Density: <strong>{Math.round(metrics.commentRatio * 100)}%</strong></div>
                  <div>• Functions: <strong>{metrics.functionCount}</strong> · Classes: <strong>{metrics.classCount}</strong></div>
                </div>
              </div>

              <div className="pt-2 border-t border-pulse-subtle flex items-center justify-between">
                <button
                  onClick={() => setActiveModalMetric('loc')}
                  className="text-[11px] text-pulse-accent hover:underline font-mono text-left font-semibold cursor-pointer"
                >
                  ⓘ Explain SLOC & comments
                </button>
                <span className="text-[10px] text-pulse-muted font-mono">
                  {metrics.commentLines} comment lines
                </span>
              </div>
            </div>

            {/* Card 3: Code Smells */}
            <div className="p-4 rounded-2xl bg-pulse-surface border border-pulse-subtle flex flex-col justify-between hover:border-pulse-strong transition shadow-sm space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-pulse-muted uppercase font-bold">
                    Code Smells & Anti-patterns
                  </span>
                  <button
                    onClick={() => setActiveModalMetric('smells')}
                    className="text-pulse-muted hover:text-pulse-accent cursor-pointer"
                    title="What is a code smell?"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="my-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold font-mono text-pulse-primary">
                    {smells.length}
                  </span>
                  <span className="text-xs font-mono text-pulse-muted">smells</span>
                  <span
                    className={`ml-auto px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      smells.length === 0
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : summary.criticalCount > 0
                        ? 'bg-rose-500/15 text-rose-500'
                        : 'bg-amber-500/15 text-amber-500'
                    }`}
                  >
                    {smells.length === 0 ? 'No Smells 🟢' : `${summary.criticalCount} Critical`}
                  </span>
                </div>

                <p className="text-xs text-pulse-secondary leading-relaxed">
                  Design flaws or anti-patterns that make code harder to maintain over time.
                </p>

                <div className="mt-2 text-[11px] text-pulse-muted font-mono space-y-0.5">
                  <div>• {summary.criticalCount} Critical · {summary.warningCount} Warnings · {summary.infoCount} Info</div>
                </div>
              </div>

              <div className="pt-2 border-t border-pulse-subtle flex items-center justify-between">
                <button
                  onClick={() => setActiveModalMetric('smells')}
                  className="text-[11px] text-pulse-accent hover:underline font-mono text-left font-semibold cursor-pointer"
                >
                  ⓘ Learn about Code Smells
                </button>
                <button
                  onClick={() => setActiveTab('health')}
                  className="text-[11px] text-pulse-secondary hover:text-pulse-primary font-mono cursor-pointer"
                >
                  Review All →
                </button>
              </div>
            </div>

            {/* Card 4: Maintainability */}
            <div className="p-4 rounded-2xl bg-pulse-surface border border-pulse-subtle flex flex-col justify-between hover:border-pulse-strong transition shadow-sm space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-pulse-muted uppercase font-bold">
                    Maintainability Index
                  </span>
                  <button
                    onClick={() => setActiveModalMetric('maintainability')}
                    className="text-pulse-muted hover:text-pulse-accent cursor-pointer"
                    title="How is this calculated?"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="my-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold font-mono text-pulse-primary">
                    {metrics.maintainabilityScore}
                  </span>
                  <span className="text-xs font-mono text-pulse-muted">/ 100</span>
                  <span
                    className={`ml-auto px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      metrics.maintainabilityScore >= 75
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : metrics.maintainabilityScore >= 50
                        ? 'bg-amber-500/15 text-amber-500'
                        : 'bg-rose-500/15 text-rose-500'
                    }`}
                  >
                    {metrics.maintainabilityScore >= 75 ? 'Clean 🟢' : 'Needs Attention 🟡'}
                  </span>
                </div>

                <p className="text-xs text-pulse-secondary leading-relaxed">
                  Relative ease with which developers can debug, modify, and extend this codebase.
                </p>

                <div className="mt-2 text-[11px] text-pulse-muted font-mono space-y-0.5">
                  <div>• Higher score = lower technical debt and faster onboarding</div>
                </div>
              </div>

              <div className="pt-2 border-t border-pulse-subtle flex items-center justify-between">
                <button
                  onClick={() => setActiveModalMetric('maintainability')}
                  className="text-[11px] text-pulse-accent hover:underline font-mono text-left font-semibold cursor-pointer"
                >
                  ⓘ How to improve
                </button>
                <button
                  onClick={() => setActiveModalMetric('halstead')}
                  className="text-[11px] text-pulse-secondary hover:text-pulse-primary font-mono cursor-pointer"
                >
                  Halstead Details ▼
                </button>
              </div>
            </div>
          </div>

          {/* Quality Dimension Breakdown Pills */}
          <div className="p-4 rounded-2xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-pulse-muted font-bold">
                Quality Dimension Breakdown (Click any pill to learn more)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { type: 'complexity' as const, label: 'Complexity', score: metrics.scoreBreakdown?.complexity ?? Math.max(0, 100 - metrics.cyclomaticComplexity * 5), color: 'text-amber-500' },
                { type: 'maintainability' as const, label: 'Maintainability', score: metrics.maintainabilityScore, color: 'text-teal-500' },
                { type: 'structure' as const, label: 'Structure', score: metrics.scoreBreakdown?.structure ?? 95, color: 'text-emerald-500' },
                { type: 'quality' as const, label: 'Quality', score: metrics.scoreBreakdown?.quality ?? Math.max(20, 100 - smells.length * 8), color: 'text-blue-500' },
                { type: 'security' as const, label: 'Security', score: metrics.scoreBreakdown?.security ?? 100, color: 'text-purple-500' },
                { type: 'loc' as const, label: 'Docs/Comments', score: metrics.scoreBreakdown?.documentation ?? Math.min(100, Math.round(metrics.commentRatio * 400)), color: 'text-teal-400' },
              ].map((pill) => (
                <button
                  key={pill.label}
                  onClick={() => setActiveModalMetric(pill.type)}
                  className="p-2.5 rounded-xl bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-left transition group cursor-pointer"
                >
                  <span className="text-[10px] font-mono text-pulse-muted block truncate">{pill.label}</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-base font-bold font-mono text-pulse-primary group-hover:text-pulse-accent">
                      {pill.score}
                    </span>
                    <span className="text-[9px] font-mono text-pulse-muted">/100</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. ARCHITECTURE BLUEPRINT OVERVIEW (Promoted to Dashboard) */}
      <section className="p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-pulse-primary font-sans">
                Architecture Blueprint & Module Coupling
              </h2>
              <p className="text-xs text-pulse-secondary mt-0.5">
                Visual dependency graph, import links, and structural cohesion.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('pulse-map')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <span>Open Architecture Observatory</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-1">
            <span className="text-[10px] font-mono uppercase text-pulse-muted font-bold">Functions & Methods</span>
            <div className="text-xl font-bold font-mono text-pulse-primary">{metrics.functionCount}</div>
            <p className="text-[11px] text-pulse-secondary">Total callable routines</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-1">
            <span className="text-[10px] font-mono uppercase text-pulse-muted font-bold">Classes & Modules</span>
            <div className="text-xl font-bold font-mono text-pulse-primary">{metrics.classCount}</div>
            <p className="text-[11px] text-pulse-secondary">Data models & abstractions</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-1">
            <span className="text-[10px] font-mono uppercase text-pulse-muted font-bold">External Packages</span>
            <div className="text-xl font-bold font-mono text-pulse-primary">{metrics.dependenciesCount}</div>
            <p className="text-[11px] text-pulse-secondary">Third-party and stdlib imports</p>
          </div>
        </div>
      </section>

      {/* 5. METRIC DETAIL MODAL & DRAWERS */}
      {activeModalMetric && (
        <MetricDetailModal
          metricType={activeModalMetric}
          analysis={analysis}
          onClose={() => setActiveModalMetric(null)}
          onNavigateToTab={setActiveTab}
          onAskAi={(prompt) => sendAiRequest('explain', prompt)}
        />
      )}

      {/* Health Breakdown Drawer */}
      <HealthBreakdownDrawer
        isOpen={isHealthDrawerOpen}
        onClose={() => setIsHealthDrawerOpen(false)}
        analysis={analysis}
        onNavigateToTab={setActiveTab}
        onAskAi={(prompt) => sendAiRequest('explain', prompt)}
      />

      {/* Evidence & Confidence Drawer */}
      <EvidenceDrawer
        isOpen={!!selectedEvidenceSmell}
        onClose={() => setSelectedEvidenceSmell(null)}
        finding={selectedEvidenceSmell}
        fileName={fileName}
        language={language}
        onFixWithAi={handleFixWithAi}
        onNavigateToAnalyzer={(line) => {
          setActiveTab('analyzer');
        }}
      />

      {/* Project Intelligence & Continuous Memory Modal */}
      <ProjectMemoryModal
        isOpen={isProjectMemoryOpen}
        onClose={() => setIsProjectMemoryOpen(false)}
      />
    </div>
  );
};
