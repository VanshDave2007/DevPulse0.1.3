import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  Flame,
  Globe,
  GraduationCap,
  HelpCircle,
  Layers,
  Lightbulb,
  Lock,
  Play,
  PlayCircle,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  TrendingUp,
  Workflow,
  Zap,
} from 'lucide-react';
import { LanguageLearningContent } from '../../data/learning/types';
import { useApp } from '../../context/AppContext';
import { AskLearningAiModal } from './AskLearningAiModal';
import { saveLearnProgressToCloudSql, fetchLearnProgressFromCloudSql } from '../../services/db-sync';

interface LanguageDetailViewProps {
  language: LanguageLearningContent;
  onBack: () => void;
  onSelectOtherLanguage: (langId: string) => void;
  initialSection?: string;
}

export const LanguageDetailView: React.FC<LanguageDetailViewProps> = ({
  language,
  onBack,
  onSelectOtherLanguage,
  initialSection = 'overview',
}) => {
  const { setCode, setLanguage, setActiveTab, runAnalysis, user } = useApp();
  const [activeSection, setActiveSection] = useState<string>(initialSection);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiTopic, setAiTopic] = useState<string | undefined>();
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});

  // Sync learn progress from Cloud SQL
  useEffect(() => {
    if (user && language?.id) {
      fetchLearnProgressFromCloudSql(language.id)
        .then((progress) => {
          if (progress?.practiceStatus) {
            const completed: Record<string, boolean> = {};
            for (const [k, v] of Object.entries(progress.practiceStatus)) {
              if (v && typeof v === 'object' && (v as any).completed) {
                completed[k] = true;
              }
            }
            setCompletedExercises(completed);
          }
        })
        .catch((err) => console.warn('Could not load learning progress:', err));
    }
  }, [user, language?.id]);

  // Persist current section when activeSection changes
  useEffect(() => {
    if (user && language?.id) {
      saveLearnProgressToCloudSql(language.id, {
        lastUnit: activeSection,
        lastTopic: language.name,
        unitStatus: { [activeSection]: 'completed' },
      }).catch((e) => console.warn('Could not save section progress:', e));
    }
  }, [activeSection, user, language?.id]);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleLoadInAnalyzer = (code: string) => {
    setCode(code);
    // Map language id to SupportedLanguage if available
    setLanguage(language.id as any);
    setActiveTab('analyzer');
    // Trigger immediate AST analysis
    setTimeout(() => {
      runAnalysis(code, language.id as any);
    }, 100);
  };

  const toggleSolution = (exerciseId: string) => {
    setRevealedSolutions((prev) => ({
      ...prev,
      [exerciseId]: !prev[exerciseId],
    }));
  };

  const toggleHint = (exerciseId: string) => {
    setRevealedHints((prev) => ({
      ...prev,
      [exerciseId]: !prev[exerciseId],
    }));
  };

  const handleAskAiAboutTopic = (topic: string) => {
    setAiTopic(topic);
    setIsAiModalOpen(true);
  };

  // Section Table of Contents
  const sections = [
    { id: 'overview', title: 'Overview & DevPulse Support', icon: Globe },
    { id: 'why-learn', title: 'Why Learn & Strengths', icon: TrendingUp },
    { id: 'core-concepts', title: 'Core Concepts', icon: Layers },
    { id: 'syntax', title: 'Syntax & Code Fundamentals', icon: Code2 },
    { id: 'data-types', title: 'Data Types & Memory', icon: Database },
    { id: 'control-flow', title: 'Control Flow & Scope', icon: Workflow },
    { id: 'functions', title: 'Functions & Methods', icon: Terminal },
    { id: 'oop-paradigms', title: 'OOP & Paradigms', icon: Cpu },
    { id: 'error-handling', title: 'Error Handling', icon: ShieldAlert },
    { id: 'modules', title: 'Modules & Ecosystem', icon: BookOpen },
    { id: 'memory-concurrency', title: 'Memory & Concurrency', icon: Zap },
    { id: 'tools', title: 'Tools, Runtimes & Linters', icon: Terminal },
    { id: 'best-practices', title: 'Best Practices', icon: ShieldCheck },
    { id: 'common-mistakes', title: 'Common Mistakes & Smells', icon: Flame },
    { id: 'security', title: 'Security Considerations', icon: Lock },
    { id: 'performance', title: 'Performance Guide', icon: Zap },
    { id: 'roadmap', title: 'Learning Roadmap', icon: GraduationCap },
    { id: 'practice', title: 'Practice Exercises', icon: PlayCircle },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Breadcrumb & Quick Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-pulse-subtle/60">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-pulse-surface hover:bg-pulse-subtle/50 border border-pulse-subtle text-xs font-semibold text-pulse-secondary hover:text-pulse-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All Languages</span>
          </button>
          <span className="text-pulse-muted">/</span>
          <span className="text-sm font-bold text-pulse-primary flex items-center space-x-1.5">
            <span>{language.icon}</span>
            <span>{language.name} Learning Guide</span>
          </span>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => handleAskAiAboutTopic(language.name)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-pulse-accent/10 hover:bg-pulse-accent/20 border border-pulse-accent/30 text-pulse-accent rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ask DevPulse AI</span>
          </button>
          <button
            onClick={() => {
              if (language.syntaxFundamentals?.[0]?.code) {
                handleLoadInAnalyzer(language.syntaxFundamentals[0].code);
              }
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-pulse-accent hover:opacity-90 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Test in Analyzer</span>
          </button>
        </div>
      </div>

      {/* Hero Language Overview Card */}
      <div className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-4xl">{language.icon}</span>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h1 className="text-2xl font-black text-pulse-primary">{language.name}</h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      language.difficulty === 'Beginner'
                        ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30'
                        : language.difficulty === 'Intermediate'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {language.difficulty}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-pulse-subtle/40 text-pulse-secondary border border-pulse-subtle">
                    {language.extensions.join(', ')}
                  </span>
                </div>
                <p className="text-xs text-pulse-muted">
                  Created by <strong className="text-pulse-secondary">{language.creator}</strong> in{' '}
                  <strong className="text-pulse-secondary">{language.releaseYear}</strong>
                </p>
              </div>
            </div>
            <p className="text-sm text-pulse-secondary leading-relaxed max-w-3xl pt-1">
              {language.tagline}
            </p>
          </div>

          {/* DevPulse Analyzer Support Badge */}
          <div className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle/80 space-y-2 md:min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-pulse-primary flex items-center space-x-1.5">
                <Zap className="h-3.5 w-3.5 text-pulse-accent" />
                <span>DevPulse Engine Support</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {language.devPulseSupport.level}
              </span>
            </div>
            <ul className="space-y-1 text-[11px] text-pulse-secondary">
              {language.devPulseSupport.capabilities.slice(0, 3).map((cap, idx) => (
                <li key={idx} className="flex items-start space-x-1.5">
                  <Check className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{cap}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Paradigms tags */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-pulse-subtle/40">
          <span className="text-xs font-semibold text-pulse-muted">Paradigms:</span>
          {language.paradigms.map((p) => (
            <span
              key={p}
              className="px-2.5 py-1 rounded-lg text-xs bg-pulse-subtle/30 text-pulse-secondary border border-pulse-subtle/60 font-medium"
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Main Content Layout with Sticky Sidebar Table of Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sticky Table of Contents Sidebar */}
        <div className="lg:col-span-3 sticky top-20 space-y-3 bg-pulse-surface border border-pulse-subtle rounded-3xl p-4 shadow-sm max-h-[calc(100vh-100px)] overflow-y-auto">
          <div className="px-2 py-1 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-pulse-muted border-b border-pulse-subtle/50 pb-2">
            <span className="flex items-center space-x-1.5">
              <BookOpen className="h-3.5 w-3.5 text-pulse-accent" />
              <span>Table of Contents</span>
            </span>
            <span className="text-[10px] font-mono text-pulse-muted">{sections.length} Units</span>
          </div>

          <nav className="space-y-1">
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSection(sec.id);
                    document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                    isActive
                      ? 'bg-pulse-accent text-white font-semibold shadow-sm'
                      : 'text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-subtle/50'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : 'text-pulse-muted'}`} />
                  <span className="truncate">{sec.title}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Content Details Area */}
        <div className="lg:col-span-9 space-y-8">
          {/* SECTION 1: Overview & Architecture Details */}
          <section id="overview" className="p-6 md:p-8 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-pulse-primary flex items-center space-x-2">
                <Globe className="h-5 w-5 text-pulse-accent" />
                <span>1. Language Architecture & Runtime Overview</span>
              </h2>
              <button
                onClick={() => handleAskAiAboutTopic(`${language.name} runtime and typing system`)}
                className="text-xs text-pulse-accent hover:underline flex items-center space-x-1"
              >
                <Sparkles className="h-3 w-3" />
                <span>Ask AI</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-1.5">
                <span className="font-semibold text-pulse-muted uppercase text-[10px] tracking-wider">Typing System</span>
                <p className="text-pulse-primary font-medium">{language.typingSystem}</p>
              </div>
              <div className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-1.5">
                <span className="font-semibold text-pulse-muted uppercase text-[10px] tracking-wider">Execution Model</span>
                <p className="text-pulse-primary font-medium">{language.executionModel}</p>
              </div>
              <div className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-1.5 md:col-span-2">
                <span className="font-semibold text-pulse-muted uppercase text-[10px] tracking-wider">Primary Purpose & Domains</span>
                <p className="text-pulse-secondary leading-relaxed">{language.currentPurpose}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-pulse-subtle/20 border border-pulse-subtle/50 space-y-2">
              <span className="text-xs font-semibold text-pulse-primary flex items-center space-x-1.5">
                <Terminal className="h-3.5 w-3.5 text-pulse-accent" />
                <span>Typical Deployment & Execution Environments</span>
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {language.typicalEnvironments.map((env) => (
                  <span
                    key={env}
                    className="px-3 py-1 rounded-lg text-xs bg-pulse-surface border border-pulse-subtle text-pulse-secondary font-medium"
                  >
                    {env}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 2: Why Learn & Tradeoffs */}
          <section id="why-learn" className="p-6 md:p-8 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-pulse-primary flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-pulse-accent" />
                <span>2. Why Learn {language.name} & Tradeoff Analysis</span>
              </h2>
            </div>

            <p className="text-sm text-pulse-secondary leading-relaxed">
              {language.whyLearn.importance}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
                <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 uppercase tracking-wider">
                  <Check className="h-4 w-4" />
                  <span>Key Strengths & Advantages</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-pulse-secondary">
                  {language.whyLearn.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2.5">
                <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-1.5 uppercase tracking-wider">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Tradeoffs & Limitations</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-pulse-secondary">
                  {language.whyLearn.weaknesses.map((weak, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* When to Choose vs Avoid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-2">
                <span className="font-bold text-teal-600 dark:text-teal-400 uppercase text-[10px] tracking-wider">When to Choose</span>
                <ul className="space-y-1 text-pulse-secondary">
                  {language.whyLearn.whenToChoose.map((w, idx) => (
                    <li key={idx}>✓ {w}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-2">
                <span className="font-bold text-rose-600 dark:text-rose-400 uppercase text-[10px] tracking-wider">When to Avoid</span>
                <ul className="space-y-1 text-pulse-secondary">
                  {language.whyLearn.whenToAvoid.map((w, idx) => (
                    <li key={idx}>✕ {w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION 3: Core Concepts */}
          <section id="core-concepts" className="p-6 md:p-8 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-pulse-primary flex items-center space-x-2">
              <Layers className="h-5 w-5 text-pulse-accent" />
              <span>3. Architectural Core Concepts</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {language.coreConcepts.map((concept, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-pulse-primary">{concept.title}</h3>
                    <p className="text-xs text-pulse-secondary leading-relaxed">{concept.summary}</p>
                  </div>
                  <div className="pt-2 border-t border-pulse-subtle/50 text-[11px] text-pulse-accent italic">
                    {concept.relevance}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 4: Syntax & Code Fundamentals */}
          <section id="syntax" className="p-6 md:p-8 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-pulse-primary flex items-center space-x-2">
                <Code2 className="h-5 w-5 text-pulse-accent" />
                <span>4. Syntax Fundamentals & Idiomatic Code</span>
              </h2>
              <span className="text-xs text-pulse-muted">Interactive Code Snippets</span>
            </div>

            <div className="space-y-5">
              {language.syntaxFundamentals.map((snippet, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-pulse-subtle overflow-hidden bg-pulse-bg space-y-0"
                >
                  <div className="px-4 py-3 bg-pulse-subtle/20 border-b border-pulse-subtle flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-pulse-primary">{snippet.title}</h3>
                      <p className="text-[11px] text-pulse-muted">{snippet.explanation}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCopyCode(snippet.code, `snippet-${idx}`)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-pulse-surface hover:bg-pulse-subtle/60 border border-pulse-subtle text-pulse-secondary transition-colors"
                      >
                        {copiedCodeId === `snippet-${idx}` ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleLoadInAnalyzer(snippet.code)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-pulse-accent hover:opacity-90 text-white transition-opacity shadow-sm"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Run in Analyzer</span>
                      </button>
                    </div>
                  </div>

                  <pre className="p-4 text-xs font-mono bg-pulse-surface/80 text-pulse-primary overflow-x-auto leading-relaxed">
                    <code>{snippet.code}</code>
                  </pre>

                  {snippet.output && (
                    <div className="px-4 py-2 bg-pulse-subtle/10 border-t border-pulse-subtle/50 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
                      <span className="font-bold text-pulse-muted uppercase text-[9px]">Output:</span>
                      <span>{snippet.output}</span>
                    </div>
                  )}

                  {snippet.importantNote && (
                    <div className="px-4 py-2.5 bg-amber-500/10 border-t border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center space-x-2">
                      <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" />
                      <span>{snippet.importantNote}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 5: Data Types */}
          <section id="data-types" className="p-6 md:p-8 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-pulse-primary flex items-center space-x-2">
              <Database className="h-5 w-5 text-pulse-accent" />
              <span>5. Data Types & Type System</span>
            </h2>

            <p className="text-xs text-pulse-secondary leading-relaxed">
              {language.dataTypes.summary} {language.dataTypes.typingNotes}
            </p>

            <div className="overflow-x-auto rounded-2xl border border-pulse-subtle">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-pulse-subtle/30 border-b border-pulse-subtle text-pulse-secondary font-bold">
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Example Usage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pulse-subtle/50">
                  {language.dataTypes.typesList.map((t, idx) => (
                    <tr key={idx} className="hover:bg-pulse-subtle/20 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-pulse-accent">{t.type}</td>
                      <td className="py-2 px-3 text-pulse-muted">
                        <span className="px-2 py-0.5 rounded bg-pulse-subtle/40 text-[10px]">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-pulse-secondary">{t.description}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-pulse-primary">{t.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 6 & 7: Control Flow & Functions */}
          <section id="control-flow" className="p-6 md:p-8 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-pulse-primary flex items-center space-x-2">
              <Workflow className="h-5 w-5 text-pulse-accent" />
              <span>6. Control Flow & Branching</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {language.controlFlow.map((cf, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-2">
                  <h3 className="text-xs font-bold text-pulse-primary">{cf.name}</h3>
                  <p className="text-[11px] text-pulse-muted">{cf.description}</p>
                  <pre className="p-3 bg-pulse-surface rounded-xl text-xs font-mono overflow-x-auto text-pulse-primary">
                    <code>{cf.code}</code>
                  </pre>
                  {cf.note && <p className="text-[10px] text-pulse-accent">{cf.note}</p>}
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 8: Functions & Paradigms */}
          <section id="functions" className="p-6 md:p-8 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-pulse-primary flex items-center space-x-2">
              <Terminal className="h-5 w-5 text-pulse-accent" />
              <span>7. Functions, Lambdas & Scope</span>
            </h2>

            <div className="space-y-4">
              {language.functions.map((fn, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-pulse-primary">{fn.title}</h3>
                    <button
                      onClick={() => handleLoadInAnalyzer(fn.code)}
                      className="text-[11px] text-pulse-accent hover:underline flex items-center space-x-1"
                    >
                      <Play className="h-2.5 w-2.5 fill-current" />
                      <span>Analyze</span>
                    </button>
                  </div>
                  <p className="text-xs text-pulse-secondary">{fn.description}</p>
                  <pre className="p-3 bg-pulse-surface rounded-xl text-xs font-mono overflow-x-auto text-pulse-primary">
                    <code>{fn.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 9: OOP & Error Handling */}
          <section id="error-handling" className="p-6 md:p-8 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-pulse-primary flex items-center space-x-2">
              <ShieldAlert className="h-5 w-5 text-pulse-accent" />
              <span>8. Error Handling & Exception Management</span>
            </h2>

            <div className="space-y-4">
              {language.errorHandling.map((eh, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-2.5">
                  <h3 className="text-xs font-bold text-pulse-primary">{eh.type}</h3>
                  <p className="text-xs text-pulse-secondary">{eh.description}</p>
                  <pre className="p-3 bg-pulse-surface rounded-xl text-xs font-mono overflow-x-auto text-pulse-primary">
                    <code>{eh.code}</code>
                  </pre>
                  {eh.debuggingTip && (
                    <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-700 dark:text-teal-300 flex items-center space-x-2">
                      <Lightbulb className="h-4 w-4 shrink-0 text-teal-500" />
                      <span>{eh.debuggingTip}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 10: Modules & Packages */}
          <section id="modules" className="p-6 md:p-8 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-pulse-primary flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-pulse-accent" />
              <span>9. Modules, Packages & Dependency Management</span>
            </h2>

            <div className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-3">
              <h3 className="text-xs font-bold text-pulse-primary">{language.modulesAndPackages.title}</h3>
              <p className="text-xs text-pulse-secondary leading-relaxed">{language.modulesAndPackages.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-pulse-surface rounded-xl border border-pulse-subtle space-y-1">
                  <span className="text-[10px] font-bold text-pulse-muted uppercase">Import Syntax</span>
                  <p className="font-mono text-pulse-accent">{language.modulesAndPackages.importSyntax}</p>
                </div>
                <div className="p-3 bg-pulse-surface rounded-xl border border-pulse-subtle space-y-1">
                  <span className="text-[10px] font-bold text-pulse-muted uppercase">CLI Install Command</span>
                  <p className="font-mono text-emerald-600 dark:text-emerald-400">{language.modulesAndPackages.packageManagerCommand}</p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 11: Memory & Concurrency */}
          <section id="memory-concurrency" className="p-6 md:p-8 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-pulse-primary flex items-center space-x-2">
              <Zap className="h-5 w-5 text-pulse-accent" />
              <span>10. Memory Model & Concurrency Internals</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-2">
                <h3 className="text-xs font-bold text-pulse-primary flex items-center space-x-1.5">
                  <Cpu className="h-4 w-4 text-pulse-accent" />
                  <span>Memory Layout & Lifecycle</span>
                </h3>
                <p className="text-xs text-pulse-secondary leading-relaxed">{language.memoryAndExecution.model}</p>
                <div className="p-2.5 bg-pulse-surface rounded-xl text-[11px] text-pulse-muted">
                  <strong>Allocation:</strong> {language.memoryAndExecution.allocation}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-2">
                <h3 className="text-xs font-bold text-pulse-primary flex items-center space-x-1.5">
                  <Workflow className="h-4 w-4 text-pulse-accent" />
                  <span>Concurrency & Asynchrony</span>
                </h3>
                <p className="text-xs text-pulse-secondary leading-relaxed">{language.concurrency.model}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {language.concurrency.keyPrimitives.map((kp) => (
                    <span key={kp} className="px-2 py-0.5 rounded text-[10px] font-mono bg-pulse-surface border border-pulse-subtle text-pulse-primary">
                      {kp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 12: Tools & Ecosystem */}
          <section id="tools" className="p-6 md:p-8 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-pulse-primary flex items-center space-x-2">
              <Terminal className="h-5 w-5 text-pulse-accent" />
              <span>11. Essential Tools, Linters & Frameworks</span>
            </h2>

            <div className="space-y-4">
              {language.toolsAndEcosystem.map((group, idx) => (
                <div key={idx} className="space-y-2">
                  <h3 className="text-xs font-bold text-pulse-muted uppercase tracking-wider">{group.category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {group.tools.map((t, tIdx) => (
                      <div key={tIdx} className="p-3.5 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-pulse-primary">{t.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-pulse-subtle/50 text-pulse-secondary">
                            {t.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-pulse-muted">{t.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 13: Best Practices */}
          <section id="best-practices" className="p-6 md:p-8 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-pulse-primary flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span>12. Architectural Best Practices</span>
            </h2>

            <div className="space-y-4">
              {language.bestPractices.map((bp, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-pulse-primary">{bp.title}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-pulse-subtle/40 text-pulse-secondary">
                      {bp.category}
                    </span>
                  </div>
                  <p className="text-xs text-pulse-secondary">{bp.recommendation}</p>
                  <pre className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs font-mono text-emerald-700 dark:text-emerald-300 overflow-x-auto">
                    <code>{bp.goodCode}</code>
                  </pre>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 14: Common Mistakes & Bad Smells (Side by Side) */}
          <section id="common-mistakes" className="p-6 md:p-8 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-pulse-primary flex items-center space-x-2">
                <Flame className="h-5 w-5 text-rose-500" />
                <span>13. Common Anti-Patterns & Code Smells</span>
              </h2>
              <span className="text-xs text-pulse-muted">Side-by-Side Refactoring</span>
            </div>

            <div className="space-y-6">
              {language.commonMistakes.map((cm, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-3.5">
                  <div>
                    <h3 className="text-sm font-bold text-pulse-primary">{cm.mistake}</h3>
                    <p className="text-xs text-pulse-secondary leading-relaxed pt-1">{cm.whyItMatters}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Problem Code */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center space-x-1">
                        <span>✕ Problematic Code Smell</span>
                      </span>
                      <pre className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-xl text-xs font-mono text-rose-700 dark:text-rose-300 overflow-x-auto">
                        <code>{cm.badSnippet}</code>
                      </pre>
                    </div>

                    {/* Fixed Code */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                        <span>✓ Idiomatic Solution</span>
                      </span>
                      <pre className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs font-mono text-emerald-700 dark:text-emerald-300 overflow-x-auto">
                        <code>{cm.fixedSnippet}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 15: Security Considerations */}
          <section id="security" className="p-6 md:p-8 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-pulse-primary flex items-center space-x-2">
              <Lock className="h-5 w-5 text-rose-500" />
              <span>14. Security Vulnerabilities & Hardening</span>
            </h2>

            <div className="space-y-4">
              {language.securityConsiderations.map((sec, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-pulse-primary">{sec.vulnerability}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        sec.riskLevel === 'Critical'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {sec.riskLevel} Risk
                    </span>
                  </div>

                  <p className="text-xs text-pulse-secondary">{sec.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-rose-500">Vulnerable:</span>
                      <pre className="p-2.5 bg-rose-500/5 border border-rose-500/20 rounded-xl font-mono text-[11px] text-rose-600 dark:text-rose-400 overflow-x-auto">
                        <code>{sec.vulnerableCode}</code>
                      </pre>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-emerald-500">Remediated:</span>
                      <pre className="p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl font-mono text-[11px] text-emerald-600 dark:text-emerald-400 overflow-x-auto">
                        <code>{sec.secureCode}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 16: Learning Roadmap */}
          <section id="roadmap" className="p-6 md:p-8 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-pulse-primary flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-pulse-accent" />
              <span>15. Step-by-Step Learning Roadmap</span>
            </h2>

            <div className="space-y-4">
              {language.roadmap.map((step) => (
                <div
                  key={step.stepNumber}
                  className="flex items-start space-x-4 p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle"
                >
                  <div className="w-8 h-8 rounded-full bg-pulse-accent text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                    {step.stepNumber}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-pulse-primary">{step.title}</h3>
                      <span className="text-[10px] font-mono text-pulse-muted">{step.estimatedTime}</span>
                    </div>
                    <p className="text-xs text-pulse-secondary">{step.description}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {step.topics.map((top) => (
                        <span key={top} className="px-2 py-0.5 rounded text-[10px] bg-pulse-surface border border-pulse-subtle text-pulse-secondary">
                          {top}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 17: Practice Exercises & Solution Reveal */}
          <section id="practice" className="p-6 md:p-8 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-pulse-primary flex items-center space-x-2">
                <PlayCircle className="h-5 w-5 text-pulse-accent" />
                <span>16. Hands-On Practice Exercises</span>
              </h2>
            </div>

            <div className="space-y-6">
              {language.practiceExercises.map((ex) => {
                const isSolRevealed = revealedSolutions[ex.id];
                const isHintRevealed = revealedHints[ex.id];

                return (
                  <div key={ex.id} className="p-5 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-pulse-primary">{ex.title}</h3>
                        <p className="text-xs text-pulse-secondary leading-relaxed pt-0.5">{ex.objective}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-pulse-accent/10 text-pulse-accent border border-pulse-accent/20">
                        {ex.difficulty}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-pulse-muted">
                        <span className="font-semibold uppercase">Starter Code</span>
                        <button
                          onClick={() => handleLoadInAnalyzer(ex.starterCode)}
                          className="text-pulse-accent hover:underline flex items-center space-x-1"
                        >
                          <Play className="h-2.5 w-2.5 fill-current" />
                          <span>Load Starter in Analyzer</span>
                        </button>
                      </div>
                      <pre className="p-3.5 bg-pulse-surface rounded-xl text-xs font-mono text-pulse-primary overflow-x-auto border border-pulse-subtle">
                        <code>{ex.starterCode}</code>
                      </pre>
                    </div>

                    {/* Hints & Solution Buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {ex.hints && ex.hints.length > 0 && (
                        <button
                          onClick={() => toggleHint(ex.id)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-colors"
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                          <span>{isHintRevealed ? 'Hide Hint' : 'Show Hint'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => toggleSolution(ex.id)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-pulse-accent/10 hover:bg-pulse-accent/20 text-pulse-accent border border-pulse-accent/20 transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>{isSolRevealed ? 'Hide Solution' : 'Reveal Solution'}</span>
                      </button>

                      <button
                        onClick={() => handleAskAiAboutTopic(`Practice Exercise "${ex.title}": ${ex.objective}`)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/20 transition-colors"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Ask AI Mentor for Clues</span>
                      </button>
                    </div>

                    {/* Hint Body */}
                    {isHintRevealed && ex.hints && (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 space-y-1 animate-fadeIn">
                        <span className="font-bold">💡 Hints:</span>
                        <ul className="list-disc list-inside space-y-1 pt-1">
                          {ex.hints.map((h, hIdx) => (
                            <li key={hIdx}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Solution Body */}
                    {isSolRevealed && (
                      <div className="space-y-2 animate-fadeIn pt-1">
                        <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          <span>✓ Verified Reference Solution</span>
                          <button
                            onClick={() => handleLoadInAnalyzer(ex.solutionCode)}
                            className="text-pulse-accent hover:underline flex items-center space-x-1"
                          >
                            <Play className="h-2.5 w-2.5 fill-current" />
                            <span>Run Solution in Analyzer</span>
                          </button>
                        </div>
                        <pre className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs font-mono text-emerald-700 dark:text-emerald-300 overflow-x-auto">
                          <code>{ex.solutionCode}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Grounded AI modal */}
      <AskLearningAiModal
        language={language}
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        initialTopic={aiTopic}
      />
    </div>
  );
};
