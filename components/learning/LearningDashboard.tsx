import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  Cpu,
  GraduationCap,
  Layers,
  Lightbulb,
  Play,
  Search,
  Sparkles,
  Zap,
  Globe,
  Terminal,
  ShieldAlert,
  Bug,
  Shield,
  FileCode,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import {
  allLanguagesLearningContent,
  filterLearningLanguages,
  searchLearningHub,
  SearchResultItem,
} from '../../data/learning';
import { LanguageLearningContent, LearningSearchFilter } from '../../data/learning/types';
import { LearningSearchFilterBar } from './LearningSearchFilterBar';
import { useApp } from '../../context/AppContext';

interface LearningDashboardProps {
  onSelectLanguage: (langId: string, initialTab?: string) => void;
  onOpenAnalysisQuiz?: () => void;
}

type SearchScopeTab = 'all' | 'languages' | 'concepts' | 'bestpractices' | 'mistakes' | 'security' | 'practice';

export const LearningDashboard: React.FC<LearningDashboardProps> = ({
  onSelectLanguage,
  onOpenAnalysisQuiz,
}) => {
  const { analysis, setCode, setLanguage, setActiveTab, runAnalysis } = useApp();
  const [filter, setFilter] = useState<LearningSearchFilter>({
    query: '',
    category: 'All',
    difficulty: 'All',
    paradigm: 'All',
  });
  const [activeScope, setActiveScope] = useState<SearchScopeTab>('all');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const filteredLanguages = useMemo(() => {
    return filterLearningLanguages(allLanguagesLearningContent, filter);
  }, [filter]);

  // Deep instant content search across all 15 languages
  const deepSearchResults = useMemo(() => {
    if (!filter.query || !filter.query.trim()) return [];
    return searchLearningHub(filter.query, {
      difficulty: filter.difficulty !== 'All' ? filter.difficulty : undefined,
      limit: 60,
    });
  }, [filter.query, filter.difficulty]);

  const filteredDeepResults = useMemo(() => {
    if (activeScope === 'all') return deepSearchResults;
    if (activeScope === 'concepts') {
      return deepSearchResults.filter((r) => r.category === 'concepts' || r.category === 'syntax' || r.category === 'datatypes');
    }
    if (activeScope === 'bestpractices') {
      return deepSearchResults.filter((r) => r.category === 'bestpractices');
    }
    if (activeScope === 'mistakes') {
      return deepSearchResults.filter((r) => r.category === 'mistakes');
    }
    if (activeScope === 'security') {
      return deepSearchResults.filter((r) => r.category === 'security');
    }
    if (activeScope === 'practice') {
      return deepSearchResults.filter((r) => r.category === 'practice');
    }
    return deepSearchResults;
  }, [deepSearchResults, activeScope]);

  const handleQuickAnalyze = (e: React.MouseEvent, codeToRun: string, langId: string) => {
    e.stopPropagation();
    if (codeToRun) {
      setCode(codeToRun);
      setLanguage(langId as any);
      setActiveTab('analyzer');
      setTimeout(() => {
        runAnalysis(codeToRun, langId as any);
      }, 100);
    }
  };

  const handleCopyCode = (e: React.MouseEvent, codeText: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const isQuerying = Boolean(filter.query && filter.query.trim());

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Learning Hub Banner */}
      <div className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-pulse-primary">
                  Programming Language Learning Hub
                </h1>
                <p className="text-xs text-pulse-secondary">
                  Local architectural guides, syntax idioms, anti-pattern comparisons, and security benchmarks for 15 languages
                </p>
              </div>
            </div>
            <p className="text-xs md:text-sm text-pulse-secondary leading-relaxed pt-1">
              Search across language concepts, clean code best practices, memory models, security CVEs, and practice exercises with instant local indexing. Zero cloud latency.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-pulse-bg border border-pulse-subtle text-center space-y-0.5">
              <span className="text-lg font-black text-teal-600 dark:text-teal-400">15</span>
              <p className="text-[11px] text-pulse-muted">Languages</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-pulse-bg border border-pulse-subtle text-center space-y-0.5">
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">300+</span>
              <p className="text-[11px] text-pulse-muted">Indexed Units</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-pulse-bg border border-pulse-subtle text-center space-y-0.5">
              <span className="text-lg font-black text-cyan-600 dark:text-cyan-400">1-Click</span>
              <p className="text-[11px] text-pulse-muted">Analyzer Runner</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-pulse-bg border border-pulse-subtle text-center space-y-0.5">
              <span className="text-lg font-black text-amber-600 dark:text-amber-400">100%</span>
              <p className="text-[11px] text-pulse-muted">Local & Offline</p>
            </div>
          </div>
        </div>

        {/* Current Active Analysis Quick Link Banner (if code is loaded) */}
        {analysis && onOpenAnalysisQuiz && (
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
            <div className="flex items-center space-x-3">
              <Zap className="h-5 w-5 text-teal-500 dark:text-teal-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-pulse-primary">
                  Active Code Loaded: {analysis.languageName} ({analysis.metrics.loc} LOC)
                </p>
                <p className="text-[11px] text-pulse-secondary">
                  Health Score {analysis.metrics.healthScore}/100 • {analysis.smells.length} smells flagged in Analyzer Studio
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onSelectLanguage(analysis.language)}
                className="px-3 py-1.5 rounded-xl bg-pulse-surface hover:bg-pulse-elevated border border-pulse-subtle text-xs font-semibold text-pulse-primary transition"
              >
                Study {analysis.languageName} Guide
              </button>
              <button
                onClick={onOpenAnalysisQuiz}
                className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold shadow-sm transition"
              >
                Code Quiz Mode
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search & Filter Component */}
      <LearningSearchFilterBar
        filter={filter}
        onChange={setFilter}
        totalCount={allLanguagesLearningContent.length}
        filteredCount={filteredLanguages.length}
      />

      {/* Deep Search Results Mode when query is typed */}
      {isQuerying && (
        <div className="space-y-5 animate-fadeIn">
          {/* Search Scope Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pulse-subtle pb-3">
            <div className="flex items-center space-x-1 overflow-x-auto">
              {[
                { id: 'all', label: `All Matches (${deepSearchResults.length})`, icon: Sparkles },
                { id: 'concepts', label: 'Concepts & Syntax', icon: BookOpen },
                { id: 'bestpractices', label: 'Best Practices', icon: Lightbulb },
                { id: 'mistakes', label: 'Code Smells', icon: Bug },
                { id: 'security', label: 'Security & CVEs', icon: ShieldAlert },
                { id: 'practice', label: 'Practice Problems', icon: Code2 },
              ].map((scope) => {
                const Icon = scope.icon;
                const isActive = activeScope === scope.id;
                return (
                  <button
                    key={scope.id}
                    onClick={() => setActiveScope(scope.id as SearchScopeTab)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                      isActive
                        ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/40 font-semibold'
                        : 'text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{scope.label}</span>
                  </button>
                );
              })}
            </div>

            <span className="text-xs font-mono text-pulse-muted">
              Found {filteredDeepResults.length} matching item(s) across 15 languages
            </span>
          </div>

          {/* Search Result Cards */}
          {filteredDeepResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDeepResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectLanguage(item.languageId, item.targetTab)}
                  className="p-5 rounded-3xl bg-pulse-surface border border-pulse-subtle hover:border-pulse-accent/60 transition shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase bg-pulse-elevated border border-pulse-subtle text-pulse-primary">
                          {item.languageName}
                        </span>
                        <span className="text-xs font-mono text-pulse-accent font-semibold">
                          {item.categoryLabel}
                        </span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-pulse-primary group-hover:text-pulse-accent transition">
                      {item.title}
                    </h4>

                    {item.subtitle && (
                      <p className="text-xs text-pulse-secondary line-clamp-2 leading-relaxed">
                        {item.subtitle}
                      </p>
                    )}

                    {item.codeSnippet && (
                      <div className="relative mt-2 p-2.5 rounded-xl bg-pulse-bg border border-pulse-subtle text-[11px] font-mono text-pulse-secondary overflow-hidden">
                        <pre className="overflow-x-auto whitespace-pre-wrap max-h-24">
                          {item.codeSnippet.slice(0, 180)}
                          {item.codeSnippet.length > 180 ? '...' : ''}
                        </pre>
                        <div className="absolute top-1.5 right-1.5 flex items-center space-x-1">
                          <button
                            onClick={(e) => handleCopyCode(e, item.codeSnippet!, item.id)}
                            className="p-1 rounded-md bg-pulse-surface border border-pulse-subtle hover:text-pulse-primary text-pulse-muted text-[10px]"
                            title="Copy snippet"
                          >
                            {copiedCodeId === item.id ? <Check className="h-3 w-3 text-teal-500" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-pulse-subtle/50 flex items-center justify-between text-xs">
                    {item.codeSnippet ? (
                      <button
                        onClick={(e) => handleQuickAnalyze(e, item.codeSnippet!, item.languageId)}
                        className="inline-flex items-center space-x-1.5 text-[11px] font-mono text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        <Play className="h-3 w-3" />
                        <span>Run in Analyzer</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-pulse-muted font-mono">Guide Unit</span>
                    )}

                    <span className="text-pulse-accent font-semibold flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Jump to Guide</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-3xl bg-pulse-surface border border-pulse-subtle space-y-2">
              <Search className="h-6 w-6 text-pulse-muted mx-auto" />
              <p className="text-sm font-bold text-pulse-primary">No specific units matched &quot;{filter.query}&quot; in this category.</p>
              <p className="text-xs text-pulse-muted">Try selecting &quot;All Matches&quot; or clearing filter constraints.</p>
            </div>
          )}

          {/* Heading separator for full language cards */}
          <div className="pt-6 border-t border-pulse-subtle">
            <h3 className="text-xs font-mono uppercase text-pulse-muted font-bold mb-4">
              Matching Language Guides ({filteredLanguages.length})
            </h3>
          </div>
        </div>
      )}

      {/* Language Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLanguages.map((lang) => {
          const diffColor =
            lang.difficulty === 'Beginner'
              ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30'
              : lang.difficulty === 'Intermediate'
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';

          return (
            <div
              key={lang.id}
              onClick={() => onSelectLanguage(lang.id)}
              className="group relative p-5 rounded-3xl bg-pulse-surface border border-pulse-subtle hover:border-pulse-accent/50 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              {/* Card Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl p-1.5 rounded-2xl bg-pulse-bg border border-pulse-subtle group-hover:scale-105 transition-transform">
                      {lang.icon}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-pulse-primary group-hover:text-pulse-accent transition-colors flex items-center gap-1.5">
                        <span>{lang.name}</span>
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-pulse-accent" />
                      </h3>
                      <div className="flex items-center space-x-1.5 text-[11px] text-pulse-muted">
                        <span>{lang.extensions.slice(0, 2).join(' ')}</span>
                        <span>•</span>
                        <span>{lang.releaseYear}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${diffColor}`}>
                    {lang.difficulty}
                  </span>
                </div>

                {/* Tagline */}
                <p className="text-xs text-pulse-secondary line-clamp-2 leading-relaxed">
                  {lang.tagline}
                </p>

                {/* Paradigms Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {lang.paradigms.slice(0, 3).map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded-md text-[10px] bg-pulse-subtle/30 border border-pulse-subtle/50 text-pulse-muted font-medium"
                    >
                      {p}
                    </span>
                  ))}
                  {lang.paradigms.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-pulse-subtle/20 text-pulse-muted">
                      +{lang.paradigms.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-pulse-subtle/60 flex items-center justify-between">
                <div className="text-[11px] text-pulse-muted flex items-center space-x-1">
                  <Zap className="h-3 w-3 text-pulse-accent" />
                  <span className="font-medium text-pulse-secondary">{lang.devPulseSupport.level}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleQuickAnalyze(e, lang.syntaxFundamentals?.[0]?.code || '', lang.id)}
                    className="p-1.5 text-pulse-muted hover:text-pulse-accent hover:bg-teal-500/10 rounded-lg transition-colors"
                    title="Load sample in DevPulse Analyzer"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                  </button>
                  <span className="text-xs font-semibold text-pulse-accent group-hover:underline flex items-center space-x-0.5">
                    <span>Explore</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLanguages.length === 0 && !isQuerying && (
        <div className="p-12 text-center rounded-3xl bg-pulse-surface border border-pulse-subtle space-y-3">
          <Search className="h-8 w-8 text-pulse-muted mx-auto" />
          <h3 className="text-sm font-bold text-pulse-primary">No matching programming languages found</h3>
          <p className="text-xs text-pulse-muted max-w-sm mx-auto">
            Try adjusting your search keywords, difficulty filter, or category pills.
          </p>
          <button
            onClick={() =>
              setFilter({
                query: '',
                category: 'All',
                difficulty: 'All',
                paradigm: 'All',
              })
            }
            className="px-4 py-2 bg-teal-500 text-[#08110F] rounded-xl text-xs font-bold shadow-sm"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
