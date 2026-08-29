import React, { useState, useMemo } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  Sparkles,
  Zap,
  ArrowLeft,
  Flame,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getLanguageLearningContent,
  allLanguagesLearningContent,
  filterLearningLanguages,
} from '../data/learning';
import { LearningDashboard } from './learning/LearningDashboard';
import { LanguageDetailView } from './learning/LanguageDetailView';
import { PulseMascot, MascotBubble } from './PulseMascot';
import { useComponentPerformanceTracker } from '../hooks/usePerformanceTracker';

export const LearnModeView: React.FC = () => {
  useComponentPerformanceTracker('Learn Mode Masterclasses');
  const { analysis, language, setActiveTab, sendAiRequest } = useApp();
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | undefined>();
  const [isQuizMode, setIsQuizMode] = useState<boolean>(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Memoize active language learning content to avoid redundant lookup
  const activeLanguageContent = useMemo(() => {
    if (!selectedLanguageId) return null;
    return getLanguageLearningContent(selectedLanguageId);
  }, [selectedLanguageId]);

  // Memoize all available languages list
  const availableLanguages = useMemo(() => {
    return allLanguagesLearningContent;
  }, []);

  // If a language detail view is active
  if (selectedLanguageId && activeLanguageContent) {
    return (
      <LanguageDetailView
        language={activeLanguageContent}
        initialSection={selectedSection || 'overview'}
        onBack={() => {
          setSelectedLanguageId(null);
          setSelectedSection(undefined);
        }}
        onSelectOtherLanguage={(newId) => {
          setSelectedLanguageId(newId);
          setSelectedSection(undefined);
        }}
      />
    );
  }

  // If Code Quiz mode is explicitly opened
  if (isQuizMode && analysis) {
    const { metrics, smells } = analysis;

    let difficulty = 'Beginner';
    let diffBadge = 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30';
    if (metrics.cyclomaticComplexity > 15 || metrics.classes.length > 2 || metrics.functions.length > 5) {
      difficulty = 'Advanced';
      diffBadge = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
    } else if (metrics.cyclomaticComplexity > 6 || metrics.classes.length > 0 || metrics.functions.length > 1) {
      difficulty = 'Intermediate';
      diffBadge = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    }

    const concepts = [
      {
        title: 'Control Flow & Cyclomatic Complexity',
        description: `This codebase has ${metrics.cyclomaticComplexity} decision points. Understanding branching logic is critical for designing unit tests.`,
        icon: Zap,
      },
      {
        title: 'Language Idioms & Scope Management',
        description: `Written in ${analysis.languageName}. Pay special attention to variable lifetimes, closures, and modularity.`,
        icon: BookOpen,
      },
      {
        title: 'Architectural Anti-Patterns & Smells',
        description: `${smells.length} smells flagged. Refactoring these anti-patterns increases testability and prevents unexpected runtime exceptions.`,
        icon: Lightbulb,
      },
    ];

    const quizQuestion = {
      question: `What is the primary factor impacting this code's maintainability index (${metrics.maintainabilityScore}/100)?`,
      options: [
        `The ratio of comments (${Math.round(metrics.commentRatio * 100)}%) and cyclomatic branches (${metrics.cyclomaticComplexity})`,
        'The length of variable names in the script',
        'The file system storage format of the source code',
        'The CPU architecture of the computer analyzing the file',
      ],
      correct: 0,
      explanation:
        'The Maintainability Index is calculated mathematically using Halstead volume, cyclomatic branch count, total lines of code, and comment density.',
    };

    const handleQuizSelect = (idx: number) => {
      setSelectedAnswer(idx);
      setQuizSubmitted(true);
    };

    return (
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        <div className="flex items-center justify-between pb-2 border-b border-pulse-subtle">
          <button
            onClick={() => setIsQuizMode(false)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-pulse-surface hover:bg-pulse-subtle/60 border border-pulse-subtle text-xs font-semibold text-pulse-secondary hover:text-pulse-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Learning Hub</span>
          </button>
          <span className="text-xs font-bold text-pulse-muted uppercase tracking-wider font-mono">
            Analysis Quiz Mode • {analysis.languageName}
          </span>
        </div>

        {/* Header Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <PulseMascot mood="helping" size="md" />
              <div>
                <h1 className="text-xl font-bold text-pulse-primary">Learn From Active Code</h1>
                <p className="text-xs text-pulse-secondary">
                  Educational breakdown translating source code into core Computer Science concepts and architecture patterns.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${diffBadge}`}>
              {difficulty} Level
            </span>
            <button
              onClick={() => {
                sendAiRequest(
                  'explain',
                  `Generate a comprehensive tutorial and key learning takeaway list for a junior developer studying this ${analysis.languageName} code.`
                );
                setActiveTab('pulse-ai');
              }}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Ask Pulse AI Tutor</span>
            </button>
          </div>
        </div>

        {/* Core Concepts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {concepts.map((concept, idx) => {
            const Icon = concept.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-3xl bg-pulse-surface border border-pulse-subtle space-y-3 hover:border-pulse-accent/40 transition shadow-sm"
              >
                <div className="p-2 w-fit rounded-xl bg-pulse-bg text-pulse-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-pulse-primary">{concept.title}</h3>
                <p className="text-xs text-pulse-secondary leading-relaxed">{concept.description}</p>
              </div>
            );
          })}
        </div>

        {/* Interactive Knowledge Challenge Quiz */}
        <div className="p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle space-y-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-pulse-accent" />
            <h3 className="text-base font-bold text-pulse-primary">Developer Knowledge Check</h3>
          </div>

          <p className="text-xs sm:text-sm text-pulse-primary font-medium leading-relaxed">
            {quizQuestion.question}
          </p>

          <div className="space-y-2 pt-2">
            {quizQuestion.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrect = idx === quizQuestion.correct;
              let btnStyle =
                'bg-pulse-bg border-pulse-subtle text-pulse-primary hover:border-pulse-accent/50';

              if (quizSubmitted) {
                if (isCorrect) {
                  btnStyle = 'bg-teal-500/20 border-teal-500 text-teal-600 dark:text-teal-300 font-semibold';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-300';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleQuizSelect(idx)}
                  disabled={quizSubmitted}
                  className={`w-full text-left p-3 rounded-2xl border text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {quizSubmitted && isCorrect && (
                    <CheckCircle2 className="h-4 w-4 text-pulse-accent shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {quizSubmitted && (
            <div className="p-4 rounded-2xl bg-pulse-bg border border-teal-500/30 text-xs text-pulse-secondary space-y-1 animate-fadeIn">
              <span className="font-semibold text-pulse-accent block">Explanation:</span>
              <p>{quizQuestion.explanation}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default Landing Page: Complete Learning Dashboard
  return (
    <LearningDashboard
      onSelectLanguage={(langId, initialTab) => {
        setSelectedLanguageId(langId);
        setSelectedSection(initialTab);
      }}
      onOpenAnalysisQuiz={() => setIsQuizMode(true)}
    />
  );
};
