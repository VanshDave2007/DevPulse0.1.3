import React from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Code2,
  Cpu,
  GraduationCap,
  HeartPulse,
  Layers,
  Network,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen, setActiveTab } = useApp();

  if (!isOnboardingOpen) return null;

  const handleDismiss = () => {
    localStorage.setItem('devpulse_onboarding_dismissed', 'true');
    setIsOnboardingOpen(false);
  };

  const steps = [
    {
      step: '01',
      title: 'Load or Paste Code',
      icon: Code2,
      description:
        'Select from built-in sample codebases across 15+ languages or paste your own script into the Analyzer Studio editor.',
    },
    {
      step: '02',
      title: 'Analyze Structure & Smells',
      icon: HeartPulse,
      description:
        'DevPulse runs instant AST parsing, calculating Maintainability Index, Cyclomatic Complexity, and identifying actionable code smells.',
    },
    {
      step: '03',
      title: 'Ask Pulse AI for Insights',
      icon: Sparkles,
      description:
        'Use Pulse AI to explain algorithms, refactor anti-patterns, optimize execution speed, or generate runnable test suites.',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={handleDismiss}
    >
      <div
        className="w-full max-w-2xl bg-pulse-surface border border-pulse-subtle rounded-3xl shadow-2xl overflow-hidden animate-scaleUp p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-2xl bg-teal-500/15 text-pulse-accent border border-teal-500/30">
                <Zap className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-pulse-primary">Welcome to DevPulse</h2>
            </div>
            <p className="text-xs text-pulse-secondary">
              “See the Code. Find the Pulse.” — Developer intelligence platform for static code analysis, quality metrics, and AI tutoring.
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-xl text-pulse-muted hover:text-pulse-primary hover:bg-pulse-elevated transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle flex flex-col justify-between space-y-3 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-pulse-accent px-2 py-0.5 rounded bg-pulse-bg border border-pulse-subtle">
                      STEP {s.step}
                    </span>
                    <Icon className="h-4 w-4 text-pulse-secondary" />
                  </div>
                  <h4 className="text-sm font-bold text-pulse-primary mt-2">{s.title}</h4>
                  <p className="text-xs text-pulse-secondary mt-1.5 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Highlight Banner */}
        <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <Sparkles className="h-5 w-5 text-pulse-accent shrink-0" />
            <span className="text-pulse-primary font-medium">
              Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-pulse-surface border border-pulse-subtle font-mono text-[11px]">Ctrl+K</kbd> anywhere to search commands and switch views instantly.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-pulse-subtle">
          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 rounded-xl border border-pulse-subtle text-xs font-semibold text-pulse-secondary hover:bg-pulse-elevated transition"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              handleDismiss();
              setActiveTab('analyzer');
            }}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-md shadow-teal-500/20"
          >
            <span>Start Exploring Code</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
