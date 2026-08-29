import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  Flame,
  HelpCircle,
  Layers,
  Lightbulb,
  ListOrdered,
  Play,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  Zap,
} from 'lucide-react';
import { LanguageCurriculum, Chapter, ChapterTryIt } from '../../data/learning/curriculums/types';
import { useApp } from '../../context/AppContext';
import { AskLearningAiModal } from './AskLearningAiModal';

interface ChapterCurriculumViewProps {
  curriculum: LanguageCurriculum;
  onBack: () => void;
  onSwitchLanguage?: (langId: string) => void;
}

export const ChapterCurriculumView: React.FC<ChapterCurriculumViewProps> = ({
  curriculum,
  onBack,
  onSwitchLanguage,
}) => {
  const { setCode, setLanguage, setActiveTab, runAnalysis } = useApp();
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [completedChapters, setCompletedChapters] = useState<Record<string, boolean>>({});
  const [userTryItCode, setUserTryItCode] = useState<Record<string, string>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, number>>({});
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<Record<string, { passed: boolean; message: string }[]>>({});
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiTopic, setAiTopic] = useState<string | undefined>();

  const activeChapter = curriculum.chapters[activeChapterIndex] || curriculum.chapters[0];
  const storageKey = `devpulse_curriculum_completed_${curriculum.languageId}`;

  // Load completed chapters from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCompletedChapters(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, [curriculum.languageId, storageKey]);

  // Reset quiz state when switching chapters
  useEffect(() => {
    setSelectedQuizAnswer(null);
    setIsQuizSubmitted(false);
  }, [activeChapterIndex]);

  const toggleChapterComplete = (chapterId: string) => {
    setCompletedChapters((prev) => {
      const updated = { ...prev, [chapterId]: !prev[chapterId] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleCopyCode = (codeText: string, id: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleLoadInAnalyzer = (codeToRun: string) => {
    setCode(codeToRun);
    setLanguage(curriculum.languageId as any);
    setActiveTab('analyzer');
    setTimeout(() => {
      runAnalysis(codeToRun, curriculum.languageId as any);
    }, 100);
  };

  const currentTryItCode =
    userTryItCode[activeChapter.tryIt.id] !== undefined
      ? userTryItCode[activeChapter.tryIt.id]
      : activeChapter.tryIt.starterCode;

  const handleUpdateTryItCode = (val: string) => {
    setUserTryItCode((prev) => ({
      ...prev,
      [activeChapter.tryIt.id]: val,
    }));
  };

  const handleResetTryIt = () => {
    setUserTryItCode((prev) => ({
      ...prev,
      [activeChapter.tryIt.id]: activeChapter.tryIt.starterCode,
    }));
    setValidationResults((prev) => {
      const copy = { ...prev };
      delete copy[activeChapter.tryIt.id];
      return copy;
    });
  };

  const handleValidateTryIt = (tryIt: ChapterTryIt) => {
    const code = currentTryItCode.trim();
    const results: { passed: boolean; message: string }[] = [];

    // Check basic length
    if (code.length < 15) {
      results.push({
        passed: false,
        message: 'Code snippet is too short to fulfill the task requirements.',
      });
    } else {
      results.push({
        passed: true,
        message: 'Code structure submitted successfully.',
      });
    }

    // Check validation criteria
    tryIt.validationCriteria.forEach((criterion) => {
      const lowerCrit = criterion.toLowerCase();
      let passed = true;

      if (lowerCrit.includes('def ') || lowerCrit.includes('function')) {
        passed = code.includes('def ') || code.includes('function') || code.includes('=>');
      } else if (lowerCrit.includes('eval')) {
        passed = !code.includes('eval(');
      } else if (lowerCrit.includes('return')) {
        passed = code.includes('return');
      } else if (lowerCrit.includes('f-string') || lowerCrit.includes('template')) {
        passed = code.includes('f"') || code.includes("f'") || code.includes('`');
      } else if (lowerCrit.includes('class')) {
        passed = code.includes('class ');
      } else if (lowerCrit.includes('async') || lowerCrit.includes('promise')) {
        passed = code.includes('async ') || code.includes('Promise') || code.includes('await');
      }

      results.push({
        passed,
        message: criterion,
      });
    });

    const allPassed = results.every((r) => r.passed);
    if (allPassed) {
      // Automatically mark chapter complete
      if (!completedChapters[activeChapter.id]) {
        toggleChapterComplete(activeChapter.id);
      }
    }

    setValidationResults((prev) => ({
      ...prev,
      [tryIt.id]: results,
    }));
  };

  const completedCount = Object.values(completedChapters).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / curriculum.chapters.length) * 100);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-pulse-subtle/70">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-pulse-surface hover:bg-pulse-subtle/50 border border-pulse-subtle text-xs font-semibold text-pulse-secondary hover:text-pulse-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Learning Hub</span>
          </button>
          <span className="text-pulse-muted">/</span>
          <span className="text-sm font-bold text-pulse-primary flex items-center space-x-1.5">
            <span>{curriculum.icon}</span>
            <span>{curriculum.languageName} Formal Curriculum</span>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Progress Pill */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-pulse-surface border border-pulse-subtle text-xs">
            <span className="text-pulse-muted font-medium">Curriculum Progress:</span>
            <span className="font-mono font-bold text-pulse-accent">
              {completedCount}/{curriculum.chapters.length} ({progressPercent}%)
            </span>
            <div className="w-16 h-2 bg-pulse-subtle/50 rounded-full overflow-hidden ml-1">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => {
              setAiTopic(`${curriculum.languageName} Chapter ${activeChapter.chapterNumber}: ${activeChapter.title}`);
              setIsAiModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-pulse-accent/10 hover:bg-pulse-accent/20 border border-pulse-accent/30 text-pulse-accent rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ask Chapter AI</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Chapter Roadmap Sidebar + Chapter Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Chapter List / Table of Modules */}
        <div className="lg:col-span-4 sticky top-20 space-y-3 bg-pulse-surface border border-pulse-subtle rounded-3xl p-4 shadow-sm max-h-[calc(100vh-100px)] overflow-y-auto">
          <div className="px-2 py-1 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-pulse-muted border-b border-pulse-subtle/50 pb-2">
            <span className="flex items-center space-x-1.5">
              <ListOrdered className="h-3.5 w-3.5 text-pulse-accent" />
              <span>Chapters Roadmap</span>
            </span>
            <span className="text-[10px] font-mono text-pulse-muted font-bold">
              {completedCount} / {curriculum.chapters.length} DONE
            </span>
          </div>

          <div className="space-y-1.5">
            {curriculum.chapters.map((ch, idx) => {
              const isSelected = activeChapterIndex === idx;
              const isCompleted = !!completedChapters[ch.id];

              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    setActiveChapterIndex(idx);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start space-x-3 cursor-pointer ${
                    isSelected
                      ? 'bg-pulse-elevated border-teal-500 shadow-sm text-pulse-primary'
                      : isCompleted
                      ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 text-pulse-secondary'
                      : 'bg-pulse-bg/50 border-pulse-subtle hover:bg-pulse-elevated text-pulse-secondary hover:text-pulse-primary'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {isCompleted ? (
                      <div className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                          isSelected
                            ? 'bg-teal-500 text-[#08110F]'
                            : 'bg-pulse-subtle/50 text-pulse-muted'
                        }`}
                      >
                        {ch.chapterNumber}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-pulse-muted font-bold">
                        Chapter {ch.chapterNumber}
                      </span>
                      <span className="text-[10px] font-mono text-pulse-muted flex items-center space-x-1">
                        <Clock className="h-2.5 w-2.5" />
                        <span>{ch.estimatedMinutes}m</span>
                      </span>
                    </div>
                    <h4
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-pulse-primary'
                      }`}
                    >
                      {ch.title}
                    </h4>
                    <p className="text-[11px] text-pulse-muted line-clamp-1 mt-0.5">
                      {ch.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Language Switcher */}
          {onSwitchLanguage && (
            <div className="pt-3 border-t border-pulse-subtle/50 space-y-2">
              <span className="text-[10px] font-mono uppercase text-pulse-muted font-bold block px-2">
                Switch Language Curriculum
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'python', name: 'Python', icon: '🐍' },
                  { id: 'javascript', name: 'JavaScript', icon: '🟨' },
                  { id: 'typescript', name: 'TypeScript', icon: '🔷' },
                  { id: 'go', name: 'Go', icon: '🐹' },
                  { id: 'rust', name: 'Rust', icon: '🦀' },
                  { id: 'java', name: 'Java', icon: '☕' },
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => onSwitchLanguage(l.id)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition ${
                      curriculum.languageId === l.id
                        ? 'bg-teal-500/15 border-teal-500 text-teal-600 dark:text-teal-300'
                        : 'bg-pulse-bg border-pulse-subtle text-pulse-secondary hover:text-pulse-primary'
                    }`}
                  >
                    <span>{l.icon}</span>
                    <span className="truncate">{l.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Content Area: Active Chapter Deep Dive */}
        <div className="lg:col-span-8 space-y-6">
          {/* Chapter Hero Card */}
          <div className="p-6 md:p-8 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-xs font-mono font-bold uppercase">
                    Chapter {activeChapter.chapterNumber} of {curriculum.totalChapters}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      activeChapter.difficulty === 'Beginner'
                        ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30'
                        : activeChapter.difficulty === 'Intermediate'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {activeChapter.difficulty}
                  </span>
                  <span className="text-xs font-mono text-pulse-muted flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{activeChapter.estimatedMinutes} min read & practice</span>
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-pulse-primary">
                  {activeChapter.title}
                </h1>
                <p className="text-sm text-pulse-secondary leading-relaxed max-w-2xl">
                  {activeChapter.subtitle}
                </p>
              </div>

              <button
                onClick={() => toggleChapterComplete(activeChapter.id)}
                className={`shrink-0 flex items-center space-x-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer shadow-sm ${
                  completedChapters[activeChapter.id]
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-pulse-primary'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {completedChapters[activeChapter.id] ? 'Completed ✓' : 'Mark as Complete'}
                </span>
              </button>
            </div>

            {/* Clear Objectives List */}
            <div className="p-4 md:p-5 rounded-2xl bg-pulse-bg border border-pulse-subtle/80 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-pulse-primary">
                <Target className="h-4 w-4 text-pulse-accent" />
                <span>Chapter Objectives & Learning Outcomes</span>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {activeChapter.objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-xs text-pulse-secondary">
                    <div className="h-4 w-4 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 1: Core Concepts & Visual Deep Dive */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 px-1">
              <Layers className="h-4 w-4 text-pulse-accent" />
              <h2 className="text-base font-bold text-pulse-primary">1. Core Concepts</h2>
            </div>

            <div className="space-y-4">
              {activeChapter.concepts.map((concept, idx) => (
                <div
                  key={idx}
                  className="p-5 md:p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-3"
                >
                  <h3 className="text-sm font-bold text-pulse-primary flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-pulse-accent" />
                    <span>{concept.title}</span>
                  </h3>
                  <p className="text-xs md:text-sm text-pulse-secondary leading-relaxed">
                    {concept.explanation}
                  </p>

                  {concept.codeSnippet && (
                    <div className="rounded-2xl overflow-hidden border border-pulse-subtle bg-[#08110F]">
                      <div className="flex items-center justify-between px-4 py-2 bg-[#0C1A18] border-b border-[#14302C]">
                        <span className="text-[11px] font-mono text-teal-400 font-bold uppercase">
                          Concept Snippet
                        </span>
                        <button
                          onClick={() => handleCopyCode(concept.codeSnippet!, `concept-${idx}`)}
                          className="flex items-center space-x-1 text-[11px] text-teal-300/80 hover:text-teal-300 font-mono transition"
                        >
                          <Copy className="h-3 w-3" />
                          <span>{copiedCodeId === `concept-${idx}` ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                        <code>{concept.codeSnippet}</code>
                      </pre>
                    </div>
                  )}

                  <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-teal-500/5 border border-teal-500/20 text-xs">
                    <Lightbulb className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-teal-600 dark:text-teal-400 font-semibold font-mono">
                        Key Takeaway:{' '}
                      </strong>
                      <span className="text-pulse-secondary">{concept.keyTakeaway}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Annotated Examples */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 px-1">
              <Code2 className="h-4 w-4 text-pulse-accent" />
              <h2 className="text-base font-bold text-pulse-primary">2. Real-World Annotated Examples</h2>
            </div>

            <div className="space-y-4">
              {activeChapter.examples.map((ex, idx) => (
                <div
                  key={idx}
                  className="p-5 md:p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-pulse-primary">{ex.title}</h3>
                      <p className="text-xs text-pulse-secondary mt-0.5">{ex.explanation}</p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleCopyCode(ex.code, `ex-${idx}`)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-pulse-subtle bg-pulse-bg hover:bg-pulse-elevated text-xs font-semibold text-pulse-secondary hover:text-pulse-primary transition cursor-pointer"
                      >
                        <Copy className="h-3 w-3" />
                        <span>{copiedCodeId === `ex-${idx}` ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => handleLoadInAnalyzer(ex.code)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Test in Analyzer</span>
                      </button>
                    </div>
                  </div>

                  {/* Code Box */}
                  <div className="rounded-2xl overflow-hidden border border-pulse-subtle bg-[#08110F]">
                    <div className="flex items-center justify-between px-4 py-2 bg-[#0C1A18] border-b border-[#14302C]">
                      <span className="text-[11px] font-mono text-teal-400 font-bold uppercase">
                        {curriculum.languageName} Source Code
                      </span>
                      <span className="text-[10px] font-mono text-pulse-muted">Production Idiom</span>
                    </div>
                    <pre className="p-4 text-xs font-mono text-teal-300 overflow-x-auto leading-relaxed">
                      <code>{ex.code}</code>
                    </pre>
                  </div>

                  {/* Expected Output */}
                  {ex.output && (
                    <div className="p-3.5 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-1">
                      <div className="flex items-center space-x-1.5 text-[11px] font-mono font-bold uppercase text-pulse-muted">
                        <Terminal className="h-3 w-3" />
                        <span>Expected Output</span>
                      </div>
                      <pre className="text-xs font-mono text-pulse-secondary overflow-x-auto whitespace-pre-wrap">
                        {ex.output}
                      </pre>
                    </div>
                  )}

                  {ex.tip && (
                    <p className="text-xs text-pulse-muted italic border-l-2 border-teal-500 pl-3">
                      💡 <strong>Pro Tip:</strong> {ex.tip}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Interactive 'Try It' Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 px-1">
              <PlayCircle className="h-4 w-4 text-teal-500" />
              <h2 className="text-base font-bold text-pulse-primary">
                3. Interactive 'Try It' Challenge Arena
              </h2>
            </div>

            <div className="p-5 md:p-6 rounded-3xl bg-pulse-surface border-2 border-teal-500/30 shadow-md space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/30">
                    Interactive Hands-On Lab
                  </span>
                  <h3 className="text-base font-bold text-pulse-primary mt-1">
                    {activeChapter.tryIt.title}
                  </h3>
                  <p className="text-xs text-pulse-secondary mt-0.5">{activeChapter.tryIt.task}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleResetTryIt}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-pulse-subtle bg-pulse-bg hover:bg-pulse-elevated text-xs text-pulse-muted hover:text-pulse-primary transition"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Instructions checklist */}
              <div className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle/80 space-y-2">
                <span className="text-xs font-bold uppercase text-pulse-muted block">
                  Challenge Requirements:
                </span>
                <ul className="space-y-1.5 text-xs text-pulse-secondary">
                  {activeChapter.tryIt.instructions.map((inst, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="font-mono text-pulse-accent font-bold">{i + 1}.</span>
                      <span>{inst}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Live Editable Code Box */}
              <div className="rounded-2xl overflow-hidden border border-teal-500/30 bg-[#08110F] shadow-inner space-y-0">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#0C1A18] border-b border-[#14302C]">
                  <div className="flex items-center space-x-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                    <span className="text-xs font-mono font-bold text-teal-400 ml-2">
                      {curriculum.languageName} Sandbox Editor
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-teal-300/70">
                    Live Editable • Ready to validate
                  </span>
                </div>

                <textarea
                  value={currentTryItCode}
                  onChange={(e) => handleUpdateTryItCode(e.target.value)}
                  rows={10}
                  className="w-full p-4 bg-transparent text-xs font-mono text-emerald-300 focus:outline-none focus:ring-0 resize-y leading-relaxed font-medium"
                  placeholder="Write your code solution here..."
                  spellCheck={false}
                />
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleValidateTryIt(activeChapter.tryIt)}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Run & Validate Solution</span>
                  </button>

                  <button
                    onClick={() => handleLoadInAnalyzer(currentTryItCode)}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-xs font-semibold text-pulse-primary transition-all cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5 fill-current text-pulse-accent" />
                    <span>Test in AST Analyzer</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Hint Toggle */}
                  {activeChapter.tryIt.hints.length > 0 && (
                    <button
                      onClick={() => {
                        const current = revealedHints[activeChapter.tryIt.id] || 0;
                        setRevealedHints((prev) => ({
                          ...prev,
                          [activeChapter.tryIt.id]:
                            current < activeChapter.tryIt.hints.length ? current + 1 : 0,
                        }));
                      }}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-pulse-subtle bg-pulse-bg hover:bg-pulse-elevated text-xs font-semibold text-amber-500 hover:text-amber-400 transition"
                    >
                      <Lightbulb className="h-3.5 w-3.5" />
                      <span>
                        {(revealedHints[activeChapter.tryIt.id] || 0) > 0
                          ? `Hint (${revealedHints[activeChapter.tryIt.id]}/${activeChapter.tryIt.hints.length})`
                          : 'Need a Hint?'}
                      </span>
                    </button>
                  )}

                  {/* Solution Reveal Toggle */}
                  <button
                    onClick={() =>
                      setRevealedSolutions((prev) => ({
                        ...prev,
                        [activeChapter.tryIt.id]: !prev[activeChapter.tryIt.id],
                      }))
                    }
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-pulse-subtle bg-pulse-bg hover:bg-pulse-elevated text-xs font-semibold text-pulse-secondary hover:text-pulse-primary transition"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>
                      {revealedSolutions[activeChapter.tryIt.id] ? 'Hide Solution' : 'View Solution'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Hints Box if revealed */}
              {(revealedHints[activeChapter.tryIt.id] || 0) > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-fadeIn">
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <Lightbulb className="h-4 w-4" />
                    <span>Helpful Hint:</span>
                  </div>
                  <ul className="space-y-1 text-xs text-pulse-secondary list-disc pl-5">
                    {activeChapter.tryIt.hints
                      .slice(0, revealedHints[activeChapter.tryIt.id])
                      .map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Solution Box if revealed */}
              {revealedSolutions[activeChapter.tryIt.id] && (
                <div className="p-4 rounded-2xl bg-pulse-bg border border-teal-500/30 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center space-x-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Verified Reference Solution</span>
                    </span>
                    <button
                      onClick={() => handleUpdateTryItCode(activeChapter.tryIt.solutionCode)}
                      className="text-[11px] font-mono font-bold text-teal-500 hover:underline"
                    >
                      Copy to Editor
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-[#08110F] text-xs font-mono text-emerald-300 overflow-x-auto">
                    <code>{activeChapter.tryIt.solutionCode}</code>
                  </pre>
                </div>
              )}

              {/* Validation Feedback Results */}
              {validationResults[activeChapter.tryIt.id] && (
                <div className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-2.5 animate-fadeIn">
                  <span className="text-xs font-bold uppercase text-pulse-muted block">
                    Validation Checks:
                  </span>
                  <div className="space-y-1.5">
                    {validationResults[activeChapter.tryIt.id].map((res, i) => (
                      <div
                        key={i}
                        className={`flex items-center space-x-2 text-xs p-2 rounded-xl border ${
                          res.passed
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {res.passed ? (
                          <Check className="h-4 w-4 stroke-[3] shrink-0" />
                        ) : (
                          <span className="font-bold shrink-0">✕</span>
                        )}
                        <span>{res.message}</span>
                      </div>
                    ))}
                  </div>

                  {validationResults[activeChapter.tryIt.id].every((r) => r.passed) && (
                    <div className="flex items-center space-x-2 pt-2 text-xs text-emerald-500 font-bold">
                      <Award className="h-4 w-4" />
                      <span>Great job! All criteria passed and chapter marked as complete.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Chapter Quiz Checkpoint */}
          {activeChapter.quiz && (
            <div className="p-5 md:p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-4 w-4 text-pulse-accent" />
                <h3 className="text-sm font-bold text-pulse-primary">
                  Chapter Checkpoint: Knowledge Quiz
                </h3>
              </div>

              <p className="text-xs font-medium text-pulse-primary">
                {activeChapter.quiz.question}
              </p>

              <div className="space-y-2">
                {activeChapter.quiz.options.map((opt, optIdx) => {
                  const isSelected = selectedQuizAnswer === optIdx;
                  const isCorrect = activeChapter.quiz!.correct === optIdx;

                  let btnStyle =
                    'bg-pulse-bg border-pulse-subtle text-pulse-secondary hover:bg-pulse-elevated';
                  if (isQuizSubmitted) {
                    if (isCorrect) {
                      btnStyle =
                        'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-300 font-semibold';
                    } else if (isSelected && !isCorrect) {
                      btnStyle = 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-300';
                    }
                  } else if (isSelected) {
                    btnStyle =
                      'bg-teal-500/15 border-teal-500 text-teal-600 dark:text-teal-300 font-semibold';
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={isQuizSubmitted}
                      onClick={() => {
                        setSelectedQuizAnswer(optIdx);
                        setIsQuizSubmitted(true);
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border text-xs transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {isQuizSubmitted && isCorrect && (
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {isQuizSubmitted && (
                <div className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle text-xs space-y-1 animate-fadeIn">
                  <strong className="text-pulse-primary block">Explanation:</strong>
                  <p className="text-pulse-secondary">{activeChapter.quiz.explanation}</p>
                </div>
              )}
            </div>
          )}

          {/* Chapter Footer Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm">
            <button
              disabled={activeChapterIndex === 0}
              onClick={() => {
                setActiveChapterIndex((prev) => Math.max(0, prev - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-2xl border border-pulse-subtle bg-pulse-bg hover:bg-pulse-elevated disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-pulse-secondary hover:text-pulse-primary transition"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous Chapter</span>
            </button>

            <button
              onClick={() => toggleChapterComplete(activeChapter.id)}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition ${
                completedChapters[activeChapter.id]
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-pulse-elevated text-pulse-secondary hover:text-pulse-primary border border-pulse-subtle'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>
                {completedChapters[activeChapter.id] ? 'Chapter Completed' : 'Mark as Done'}
              </span>
            </button>

            <button
              disabled={activeChapterIndex === curriculum.chapters.length - 1}
              onClick={() => {
                setActiveChapterIndex((prev) =>
                  Math.min(curriculum.chapters.length - 1, prev + 1)
                );
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-[#08110F] text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <span>Next Chapter</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Ask Modal */}
      {isAiModalOpen && (
        <AskLearningAiModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          languageName={curriculum.languageName}
          initialTopic={aiTopic}
        />
      )}
    </div>
  );
};
