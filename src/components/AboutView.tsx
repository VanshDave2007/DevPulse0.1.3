import React from 'react';
import {
  Activity,
  Award,
  CheckCircle2,
  Code2,
  Cpu,
  HeartPulse,
  Info,
  Layers,
  Network,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AboutView: React.FC = () => {
  const { setActiveTab } = useApp();

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-pulse-surface via-pulse-bg to-pulse-elevated border border-pulse-subtle space-y-3 text-center sm:text-left shadow-sm">
        <div className="flex items-center justify-center sm:justify-start space-x-3">
          <div className="p-2.5 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-pulse-accent">
            <HeartPulse className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-pulse-primary font-mono">
            DEV<span className="text-pulse-accent">PULSE</span>
          </h1>
        </div>
        <p className="text-base text-pulse-accent font-semibold">&ldquo;See the Code. Find the Pulse.&rdquo;</p>
        <p className="text-xs sm:text-sm text-pulse-secondary leading-relaxed">
          DevPulse is a developer intelligence platform engineered to analyze source code architecture, calculate real Halstead and Cyclomatic complexity metrics, diagnose subtle security smells, and explain codebases through an integrated AI reasoning assistant.
        </p>
      </div>

      {/* Core Architectural Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle space-y-2 shadow-sm">
          <Cpu className="h-5 w-5 text-pulse-accent" />
          <h3 className="text-sm font-bold text-pulse-primary">Extensible Language Adapter Engine</h3>
          <p className="text-xs text-pulse-secondary leading-relaxed">
            Built on a modular, open adapter architecture. Provides deep lexical AST and heuristic parsers for Python, JavaScript, TypeScript, Java, C++, Go, Rust, and generic languages.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle space-y-2 shadow-sm">
          <Activity className="h-5 w-5 text-pulse-accent" />
          <h3 className="text-sm font-bold text-pulse-primary">Genuine Mathematical Metrics</h3>
          <p className="text-xs text-pulse-secondary leading-relaxed">
            Every metric is deterministically calculated using established computer science algorithms — including Halstead Software Science, McCabe Cyclomatic Complexity, and Cognitive Nesting weights.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle space-y-2 shadow-sm">
          <Sparkles className="h-5 w-5 text-pulse-accent" />
          <h3 className="text-sm font-bold text-pulse-primary">Server-Side Gemini AI Integration</h3>
          <p className="text-xs text-pulse-secondary leading-relaxed">
            Context-aware AI reasoning analyzes AST structure, code smells, and branch counts to produce actionable refactorings, test suites, and documentation.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle space-y-2 shadow-sm">
          <ShieldCheck className="h-5 w-5 text-pulse-accent" />
          <h3 className="text-sm font-bold text-pulse-primary">Accessible Developer Observatory</h3>
          <p className="text-xs text-pulse-secondary leading-relaxed">
            Equipped with the high-contrast Developer Observatory aesthetic, responsive layouts, customizable typography scales, and keyboard-friendly controls.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-center pt-4">
        <button
          onClick={() => setActiveTab('analyzer')}
          className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-md shadow-teal-500/20"
        >
          Launch Analyzer Studio →
        </button>
      </div>
    </div>
  );
};
