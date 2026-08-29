import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileCode,
  HeartPulse,
  Info,
  Shield,
  ShieldCheck,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HealthScoreGauge } from './HealthScoreGauge';
import { CIGateView } from './CIGateView';
import { useComponentPerformanceTracker } from '../hooks/usePerformanceTracker';

export const CodeHealthView: React.FC = () => {
  useComponentPerformanceTracker('Code Health Scorecard');
  const { analysis, setActiveTab, sendAiRequest } = useApp();
  const [subView, setSubView] = useState<'scorecard' | 'ci-gate'>('scorecard');

  if (!analysis) {
    return (
      <div className="p-12 text-center text-pulse-muted">
        <Activity className="h-8 w-8 text-pulse-accent mx-auto mb-2 animate-pulse" />
        <p>No active analysis. Load code in Analyzer Studio.</p>
      </div>
    );
  }

  const { metrics, smells } = analysis;
  const breakdown = metrics.scoreBreakdown;

  const pillars = [
    {
      title: 'Maintainability Index',
      weight: '30% Weight',
      score: breakdown.maintainability,
      icon: Wrench,
      description:
        'Derived from Halstead volume, LOC, and branch density. Scores > 85 represent easily refactorable code.',
      benchmark:
        breakdown.maintainability >= 85
          ? 'High Maintainability'
          : breakdown.maintainability >= 65
          ? 'Moderate'
          : 'Low',
    },
    {
      title: 'Structural Complexity',
      weight: '25% Weight',
      score: breakdown.complexity,
      icon: Zap,
      description:
        'Evaluates Cyclomatic complexity (decision points) and Cognitive nesting. Lower branch counts improve testability.',
      benchmark:
        metrics.cyclomaticComplexity <= 5
          ? 'Simple & Linear'
          : metrics.cyclomaticComplexity <= 15
          ? 'Moderate'
          : 'Complex & Dense',
    },
    {
      title: 'Code Smells & Hygiene',
      weight: '20% Weight',
      score: breakdown.quality,
      icon: CheckCircle2,
      description:
        'Penalized by active code smells, bare error handlers, anti-patterns, and mutable global state.',
      benchmark:
        smells.length === 0
          ? 'Pristine Hygiene'
          : `${smells.length} smells flagged`,
    },
    {
      title: 'Architecture & Modularity',
      weight: '15% Weight',
      score: breakdown.structure,
      icon: FileCode,
      description:
        'Measures function size distribution, nesting depth ceiling, and separation of concerns.',
      benchmark: `Avg Fn: ${metrics.averageFunctionLength} lines`,
    },
    {
      title: 'Security & Safe Primitives',
      weight: '5% Weight',
      score: breakdown.security,
      icon: ShieldCheck,
      description:
        'Checks for dangerous constructs (eval, SQL injections, insecure deserialization, unsafe reflection).',
      benchmark:
        breakdown.security === 100
          ? 'Secure Primitives'
          : 'Vulnerabilities Found',
    },
    {
      title: 'Documentation & Clarity',
      weight: '5% Weight',
      score: breakdown.documentation,
      icon: BookOpen,
      description:
        'Validates healthy comment-to-code ratio (10%–30% target) to avoid opaque APIs.',
      benchmark: `${Math.round(metrics.commentRatio * 100)}% comment density`,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Header with Sub-View Switcher */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <HeartPulse className="h-6 w-6 text-pulse-accent" />
            <h1 className="text-xl font-bold text-pulse-primary">Codebase Health & CI Verification</h1>
          </div>
          <p className="text-xs text-pulse-secondary">
            Multi-factor health audit combining maintainability metrics, test gates, and continuous quality policies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-view switcher */}
          <div className="flex items-center p-1 bg-pulse-elevated border border-pulse-subtle rounded-2xl">
            <button
              onClick={() => setSubView('scorecard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                subView === 'scorecard'
                  ? 'bg-teal-500 text-[#08110F] shadow-sm'
                  : 'text-pulse-muted hover:text-pulse-primary'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Scorecard</span>
            </button>

            <button
              onClick={() => setSubView('ci-gate')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                subView === 'ci-gate'
                  ? 'bg-teal-500 text-[#08110F] shadow-sm'
                  : 'text-pulse-muted hover:text-pulse-primary'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>CI/CD Gate</span>
            </button>
          </div>

          <button
            onClick={() => {
              sendAiRequest('improve');
              setActiveTab('pulse-ai');
            }}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-pulse-surface hover:bg-pulse-elevated border border-pulse-subtle text-pulse-primary text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            <span>AI Fix Smells</span>
          </button>
        </div>
      </div>

      {/* Render selected view */}
      {subView === 'ci-gate' ? (
        <CIGateView />
      ) : (
        <>
          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Gauge */}
            <div className="lg:col-span-1">
              <HealthScoreGauge score={metrics.healthScore} metrics={metrics} />
            </div>

            {/* Right Column: 6 Health Pillars */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                const scoreColor =
                  pillar.score >= 80
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : pillar.score >= 60
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400';
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-3xl bg-pulse-surface border border-pulse-subtle flex flex-col justify-between hover:border-pulse-strong transition shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 rounded-xl bg-pulse-elevated text-pulse-accent">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-pulse-primary">{pillar.title}</h3>
                            <span className="text-[10px] font-mono text-pulse-muted">{pillar.weight}</span>
                          </div>
                        </div>
                        <span className={`text-xl font-bold font-mono ${scoreColor}`}>{pillar.score}</span>
                      </div>

                      <p className="text-xs text-pulse-secondary mt-3 leading-relaxed">{pillar.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-pulse-subtle flex items-center justify-between text-[11px] font-mono">
                      <span className="text-pulse-muted">Benchmark:</span>
                      <span className="text-pulse-primary font-semibold">{pillar.benchmark}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deep Dive Section: Maintainability & Cognitive Science */}
          <section className="p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-pulse-primary flex items-center space-x-2">
              <Info className="h-4 w-4 text-pulse-accent" />
              <span>Scientific Basis of DevPulse Health Calculations</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-pulse-secondary leading-relaxed">
              <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-2">
                <h4 className="font-semibold text-pulse-primary">Maintainability Index Formula (SEI Standard)</h4>
                <p className="font-mono text-[11px] bg-pulse-bg p-2.5 rounded-xl border border-pulse-subtle text-pulse-primary">
                  MI = 171 - 5.2 * ln(V) - 0.23 * (CC) - 16.2 * ln(LOC) + 50 * sin(sqrt(2.4 * CR))
                </p>
                <p>
                  Calculates maintenance effort using Halstead Volume (V), Cyclomatic Complexity (CC), Total Lines of Code (LOC), and Comment Ratio (CR). Normalized to a 0–100 developer benchmark.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-2">
                <h4 className="font-semibold text-pulse-primary">Cyclomatic vs Cognitive Complexity</h4>
                <p>
                  While <strong>Cyclomatic Complexity</strong> measures test cases required to cover all code paths (linear branches), <strong>Cognitive Complexity</strong> measures human mental difficulty by weighting nested structures progressively.
                </p>
                <div className="flex items-center space-x-4 pt-1 font-mono text-[11px]">
                  <span>Cyclomatic: <strong className="text-pulse-primary">{metrics.cyclomaticComplexity}</strong></span>
                  <span>Cognitive: <strong className="text-pulse-accent">{metrics.cognitiveComplexity}</strong></span>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
