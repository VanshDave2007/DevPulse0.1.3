import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCode,
  HeartPulse,
  HelpCircle,
  Lock,
  Network,
  Shield,
  ShieldAlert,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { AnalysisResult } from '../types';
import { PulseMascot } from './PulseMascot';

interface HealthBreakdownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisResult;
  onNavigateToTab: (tab: any) => void;
  onAskAi: (prompt: string) => void;
}

export const HealthBreakdownDrawer: React.FC<HealthBreakdownDrawerProps> = ({
  isOpen,
  onClose,
  analysis,
  onNavigateToTab,
  onAskAi,
}) => {
  if (!isOpen) return null;

  const { metrics, smells, summary } = analysis;
  const healthScore = metrics.healthScore;

  // Calculate weighted dimensions
  const dimensions = [
    {
      id: 'security',
      title: 'Security & Vulnerability Hygiene',
      weight: '25%',
      score: metrics.scoreBreakdown?.security ?? (summary.criticalCount > 0 ? 45 : 95),
      icon: Shield,
      color: 'text-rose-500',
      barColor: 'bg-rose-500',
      description: 'Checks for hardcoded secrets, injection vectors, unvalidated inputs, and unsafe functions.',
      status: (metrics.scoreBreakdown?.security ?? 95) >= 80 ? 'Protected' : 'Risks Detected',
    },
    {
      id: 'complexity',
      title: 'Control Flow & Cognitive Load',
      weight: '20%',
      score: metrics.scoreBreakdown?.complexity ?? Math.max(10, 100 - metrics.cyclomaticComplexity * 6),
      icon: Zap,
      color: 'text-amber-500',
      barColor: 'bg-amber-500',
      description: 'Cyclomatic branches, nested loops/conditionals, and cognitive mental effort required to trace logic.',
      status: metrics.cyclomaticComplexity > 10 ? 'High Complexity' : metrics.cyclomaticComplexity > 5 ? 'Moderate' : 'Optimal',
    },
    {
      id: 'maintainability',
      title: 'Maintainability Index',
      weight: '20%',
      score: metrics.maintainabilityScore,
      icon: Activity,
      color: 'text-teal-500',
      barColor: 'bg-teal-500',
      description: 'Composite metric based on Halstead Volume, Cyclomatic Complexity, and SLOC that predicts maintenance cost.',
      status: metrics.maintainabilityScore >= 75 ? 'Clean Code' : metrics.maintainabilityScore >= 50 ? 'Needs Attention' : 'Critical Debt',
    },
    {
      id: 'quality',
      title: 'Code Smells & Anti-patterns',
      weight: '20%',
      score: metrics.scoreBreakdown?.quality ?? Math.max(15, 100 - smells.length * 9),
      icon: ShieldAlert,
      color: 'text-cyan-500',
      barColor: 'bg-cyan-500',
      description: 'Dead code, duplicate blocks, magic literals, long parameter lists, and monolithic functions.',
      status: smells.length === 0 ? '0 Smells' : `${smells.length} Detected`,
    },
    {
      id: 'structure',
      title: 'Architecture & Modularity',
      weight: '10%',
      score: metrics.scoreBreakdown?.structure ?? (metrics.functionCount > 0 ? 92 : 80),
      icon: Network,
      color: 'text-emerald-500',
      barColor: 'bg-emerald-500',
      description: 'Separation of concerns, module coupling, cohesion, and function decomposition.',
      status: 'Modular',
    },
    {
      id: 'documentation',
      title: 'Documentation & Clarity',
      weight: '5%',
      score: metrics.scoreBreakdown?.documentation ?? Math.min(100, Math.round(metrics.commentRatio * 350)),
      icon: FileCode,
      color: 'text-purple-500',
      barColor: 'bg-purple-500',
      description: 'Comment-to-code ratio, function docstrings, and descriptive identifier naming.',
      status: `${Math.round(metrics.commentRatio * 100)}% comment ratio`,
    },
  ];

  return (
    <div
      id="devpulse-health-drawer"
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm select-none animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative z-10 w-full max-w-2xl h-full bg-pulse-surface border-l border-pulse-subtle shadow-2xl flex flex-col animate-slideLeft overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 sm:p-6 border-b border-pulse-subtle bg-pulse-elevated flex items-center justify-between shrink-0 gap-2">
            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
              <div className="p-2 sm:p-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 shrink-0">
                <HeartPulse className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-pulse-primary font-sans truncate">
                  How Code Health is Calculated
                </h2>
                <p className="text-[11px] sm:text-xs text-pulse-muted font-mono mt-0.5 truncate">
                  Universal Static Telemetry + Multi-Dimensional Heuristics
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-pulse-muted hover:text-pulse-primary hover:bg-pulse-surface border border-transparent hover:border-pulse-subtle transition cursor-pointer shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 [scrollbar-width:thin]">
            {/* Top Score Banner */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-pulse-elevated to-pulse-surface border border-pulse-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-mono text-pulse-muted uppercase font-bold">
                  Overall Composite Health Score
                </span>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-pulse-primary">
                    {healthScore}
                  </span>
                  <span className="text-sm font-mono text-pulse-muted">/ 100</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                      healthScore >= 85
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : healthScore >= 70
                        ? 'bg-teal-500/15 text-teal-400'
                        : healthScore >= 50
                        ? 'bg-amber-500/15 text-amber-500'
                        : 'bg-rose-500/15 text-rose-500'
                    }`}
                  >
                    {healthScore >= 85 ? 'Excellent' : healthScore >= 70 ? 'Good' : healthScore >= 50 ? 'Needs Attention' : 'Critical'}
                  </span>
                </div>
                <p className="text-xs text-pulse-secondary leading-relaxed pt-1">
                  Calculated from a weighted sum across 6 engineering dimensions calibrated for {analysis.languageName}.
                </p>
              </div>

              <div className="self-end sm:self-center">
                <PulseMascot
                  pose={healthScore >= 85 ? 'success' : healthScore >= 70 ? 'happy' : 'vulnerability_found'}
                  size="lg"
                  className="shrink-0"
                />
              </div>
            </div>

            {/* Formula Explanation */}
            <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle text-xs space-y-2">
              <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 font-mono font-bold">
                <HelpCircle className="h-4 w-4 shrink-0" />
                <span>The Mathematical Health Formula</span>
              </div>
              <p className="text-pulse-secondary leading-relaxed font-mono text-[11px] bg-pulse-surface p-2.5 rounded-xl border border-pulse-subtle break-words">
                Health = (Security × 0.25) + (Complexity × 0.20) + (Maintainability × 0.20) + (Quality × 0.20) + (Structure × 0.10) + (Docs × 0.05)
              </p>
            </div>

            {/* 6 Dimension Breakdown Rows */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase text-pulse-muted tracking-wider">
                Dimension Scores & Breakdown
              </h3>

              {dimensions.map((dim) => {
                const Icon = dim.icon;
                return (
                  <div
                    key={dim.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-2 hover:border-pulse-strong transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <Icon className={`h-4 w-4 shrink-0 ${dim.color}`} />
                        <span className="text-xs font-bold text-pulse-primary">{dim.title}</span>
                        <span className="text-[10px] font-mono text-pulse-muted px-2 py-0.5 rounded bg-pulse-surface border border-pulse-subtle">
                          Weight: {dim.weight}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-xs font-mono font-bold text-pulse-primary">
                          {dim.score}/100
                        </span>
                        <span className="text-[10px] font-mono text-pulse-muted">({dim.status})</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-pulse-surface overflow-hidden">
                      <div
                        className={`h-full rounded-full ${dim.barColor} transition-all duration-500`}
                        style={{ width: `${Math.min(100, Math.max(5, dim.score))}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-pulse-secondary leading-relaxed">
                      {dim.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-3.5 sm:p-4 border-t border-pulse-subtle bg-pulse-elevated flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
            <button
              onClick={() => {
                onClose();
                onAskAi(`Explain how my codebase health score was calculated (${healthScore}/100) and how I can increase it to 95+.`);
                onNavigateToTab('pulse-ai');
              }}
              className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-sm cursor-pointer min-h-[40px]"
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Ask AI How to Improve Score</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onNavigateToTab('health');
              }}
              className="text-xs font-mono text-pulse-accent hover:underline flex items-center justify-center space-x-1 cursor-pointer py-1.5"
            >
              <span>View Code Health Tab</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };
