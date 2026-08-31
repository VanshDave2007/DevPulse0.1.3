import React, { useRef, useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bot,
  Boxes,
  Bug,
  Check,
  CheckCircle2,
  Code2,
  Compass,
  Copy,
  Cpu,
  Database,
  Download,
  FileCode,
  FileSearch,
  FileText,
  Flame,
  GitBranch,
  GraduationCap,
  HelpCircle,
  Layers,
  Lightbulb,
  MessageSquare,
  Network,
  Play,
  RotateCcw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  StopCircle,
  Target,
  TestTube2,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  User,
  Workflow,
  Wrench,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AIChatMessage, SupportedLanguage } from '../types';
import { useComponentPerformanceTracker } from '../hooks/usePerformanceTracker';
import { AskCodebaseWidget } from './AskCodebaseWidget';
import { ErrorIntelligenceWidget } from './ErrorIntelligenceWidget';
import { LanguageKnowledgeInspectorModal } from './learning/LanguageKnowledgeInspectorModal';
import { getLanguageKnowledgeProfile } from '../engine/learning/languageKnowledgeRegistry';

type AIModeCategory = 'ALL' | 'REPO' | 'ERROR_INTEL' | 'LEARN' | 'CODE' | 'DEBUG' | 'ANALYZE' | 'TEST' | 'PRACTICE';

export const PulseAIView: React.FC = () => {
  useComponentPerformanceTracker('Pulse AI Assistant');
  const {
    code,
    language,
    setLanguage,
    fileName,
    analysis,
    aiMessages,
    isAiLoading,
    sendAiRequest,
    retryAiRequest,
    cancelAiRequest,
    clearAiHistory,
    askCodebase,
    setCode,
    runAnalysis,
    setActiveTab,
    accessibility,
    updateAccessibility,
    setIsExportModalOpen,
  } = useApp();

  const [inputPrompt, setInputPrompt] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AIModeCategory>('ALL');
  const [activeActionHint, setActiveActionHint] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState(0);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [inspectingLang, setInspectingLang] = useState<SupportedLanguage>(language || 'typescript');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentProfile = getLanguageKnowledgeProfile(language || 'typescript');

  const ALL_15_LANGS: SupportedLanguage[] = [
    'python',
    'javascript',
    'typescript',
    'java',
    'cpp',
    'csharp',
    'go',
    'rust',
    'kotlin',
    'swift',
    'php',
    'ruby',
    'sql',
    'html',
    'css',
  ];


  const loadingStages = [
    'Parsing AST structure & metrics...',
    'Checking cyclomatic complexity & idioms...',
    'Synthesizing architectural recommendations...',
    'Streaming real-time response...',
  ];

  useEffect(() => {
    let interval: any;
    if (isAiLoading) {
      setLoadingStage(0);
      interval = setInterval(() => {
        setLoadingStage((prev) => (prev < loadingStages.length - 1 ? prev + 1 : prev));
      }, 700);
    } else {
      setLoadingStage(0);
    }
    return () => clearInterval(interval);
  }, [isAiLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAiLoading]);

  // Master Capability Catalog
  const allCapabilities = [
    // REPOSITORY INTELLIGENCE
    {
      id: 'repo-where-auth',
      category: 'REPO' as AIModeCategory,
      label: 'Where is Auth Handled?',
      description: 'Locate authentication & session tokens',
      icon: ShieldAlert,
      action: 'ask_codebase',
      prompt: 'Where is authentication and user session verification handled in this codebase?',
    },
    {
      id: 'repo-callers',
      category: 'REPO' as AIModeCategory,
      label: 'Who Calls Main Symbols?',
      description: 'Incoming callers from Evidence Graph',
      icon: Network,
      action: 'ask_codebase',
      prompt: 'Who calls the primary functions and classes in this file?',
    },
    {
      id: 'repo-blast-radius',
      category: 'REPO' as AIModeCategory,
      label: 'Calculate Blast Radius',
      description: 'Downstream impact of modifying code',
      icon: Flame,
      action: 'ask_codebase',
      prompt: 'What is the blast radius and downstream impact if I modify this code?',
    },
    {
      id: 'repo-root-cause',
      category: 'REPO' as AIModeCategory,
      label: 'Root Cause Synthesis',
      description: 'Origin point of diagnostic findings',
      icon: Target,
      action: 'ask_codebase',
      prompt: 'What is the root cause of the highest priority findings in this file?',
    },
    {
      id: 'repo-dependencies',
      category: 'REPO' as AIModeCategory,
      label: 'Imports & Packages',
      description: 'External libraries and module tree',
      icon: Boxes,
      action: 'ask_codebase',
      prompt: 'What external packages and modules does this code depend on?',
    },
    {
      id: 'repo-architecture',
      category: 'REPO' as AIModeCategory,
      label: 'Architecture Overview',
      description: 'Structural overview and metrics',
      icon: Layers,
      action: 'ask_codebase',
      prompt: 'Explain the high-level architecture and structure of this codebase.',
    },

    // LEARN
    {
      id: 'analogy',
      category: 'LEARN' as AIModeCategory,
      label: 'Explain with Analogy',
      description: 'Intuitive real-world mental models',
      icon: Lightbulb,
      action: 'analogy',
      prompt: 'Explain this code and its core concepts using an intuitive everyday analogy.',
    },
    {
      id: 'step-by-step',
      category: 'LEARN' as AIModeCategory,
      label: 'Step-by-Step Walkthrough',
      description: 'Line-by-line execution flow',
      icon: Compass,
      action: 'step_by_step',
      prompt: 'Provide a step-by-step educational walkthrough of how this code executes line by line.',
    },
    {
      id: 'debug-coach',
      category: 'DEBUG' as AIModeCategory,
      label: 'Debugging Coach',
      description: '6-step guided debugging without spoilers',
      icon: Wrench,
      action: 'debug_coach',
      prompt: 'Guide me through debugging this code step by step using the 6-step Debugging Coach method.',
    },
    {
      id: 'progressive-hint',
      category: 'LEARN' as AIModeCategory,
      label: 'Get a Progressive Hint',
      description: 'Gentle clue before full solution',
      icon: HelpCircle,
      action: 'hint',
      prompt: 'Give me Hint 1 for the main issue or concept in this code without spoiling the full solution.',
    },
    {
      id: 'explain',
      category: 'LEARN' as AIModeCategory,
      label: 'Explain Concepts',
      description: 'Educational breakdown of logic and paradigms',
      icon: GraduationCap,
      action: 'explain',
      prompt: 'Explain the core programming concepts and logic flow used in this code.',
    },
    {
      id: 'learning-path',
      category: 'LEARN' as AIModeCategory,
      label: 'Learning Roadmap',
      description: 'Recommended next concepts to master',
      icon: Sparkles,
      action: 'learn',
      prompt: 'Create a tailored learning roadmap based on the algorithms and structures in this codebase.',
    },

    // CODE
    {
      id: 'explain-code',
      category: 'CODE' as AIModeCategory,
      label: 'Explain Code',
      description: 'Break down architecture & function roles',
      icon: FileText,
      action: 'explain',
      prompt: 'Explain what this code does, its architecture, and the role of each component.',
    },
    {
      id: 'improve',
      category: 'CODE' as AIModeCategory,
      label: 'Improve & Refactor',
      description: 'Clean refactored version with rationale',
      icon: Wrench,
      action: 'improve',
      prompt: 'Refactor this code for readability, maintainability, and clean architecture standards.',
    },
    {
      id: 'optimize',
      category: 'CODE' as AIModeCategory,
      label: 'Optimize Performance',
      description: 'Reduce algorithmic time and memory space',
      icon: Zap,
      action: 'optimize',
      prompt: 'Optimize this code for execution speed and space efficiency. Provide Big-O comparison.',
    },
    {
      id: 'docs',
      category: 'CODE' as AIModeCategory,
      label: 'Generate Documentation',
      description: 'Standard docstrings & markdown specs',
      icon: FileCode,
      action: 'doc',
      prompt: 'Generate professional documentation and docstrings with parameter definitions for this code.',
    },

    // DEBUG
    {
      id: 'find-bugs',
      category: 'DEBUG' as AIModeCategory,
      label: 'Find Bugs & Edge Cases',
      description: 'Identify potential runtime failures',
      icon: Bug,
      action: 'debug',
      prompt: 'Analyze this code for subtle logic bugs, unhandled null/undefined states, and edge-case exceptions.',
    },
    {
      id: 'diagnostics',
      category: 'DEBUG' as AIModeCategory,
      label: 'Diagnose Issues',
      description: 'Audit code smells and antipatterns',
      icon: AlertTriangle,
      action: 'problems',
      prompt: 'Diagnose all active code smells and security vulnerabilities in this code with suggested fixes.',
    },

    // ANALYZE
    {
      id: 'complexity',
      category: 'ANALYZE' as AIModeCategory,
      label: 'Explain Complexity',
      description: 'Detailed cyclomatic & cognitive analysis',
      icon: Code2,
      action: 'complexity',
      prompt: 'Explain the cyclomatic and cognitive complexity in this code and how to flatten nested logic.',
    },
    {
      id: 'audit',
      category: 'ANALYZE' as AIModeCategory,
      label: 'Comprehensive Audit',
      description: 'Multi-point quality & security review',
      icon: ShieldAlert,
      action: 'problems',
      prompt: 'Perform a comprehensive code quality, security, and maintainability audit.',
    },

    // TEST
    {
      id: 'tests',
      category: 'TEST' as AIModeCategory,
      label: 'Generate Unit Tests',
      description: 'Comprehensive test suite with edge cases',
      icon: TestTube2,
      action: 'tests',
      prompt: 'Generate a robust unit test suite with coverage matrix and edge cases for this code.',
    },

    // PRACTICE
    {
      id: 'practice-challenge',
      category: 'PRACTICE' as AIModeCategory,
      label: 'Practice Challenge',
      description: 'Hands-on coding exercise with hints',
      icon: Sparkles,
      action: 'practice',
      prompt: 'Generate a hands-on practice coding challenge related to the concepts in this code with starter template.',
    },
    {
      id: 'quiz',
      category: 'PRACTICE' as AIModeCategory,
      label: 'Quiz & Mastery Check',
      description: 'Interactive questions to test understanding',
      icon: GraduationCap,
      action: 'learn',
      prompt: 'Generate 3 interactive coding challenge exercises and quiz questions based on this code.',
    },
  ];

  const filteredCapabilities =
    selectedCategory === 'ALL'
      ? allCapabilities
      : allCapabilities.filter((c) => c.category === selectedCategory);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isAiLoading) return;
    const q = inputPrompt.trim();
    setInputPrompt('');

    // If query is in REPO category or looks like a repo intelligence question, route through askCodebase
    const isRepoQuery =
      selectedCategory === 'REPO' ||
      /\b(where|who calls|blast radius|root cause|depends on|dependencies|imports|architecture|symbol|callers|impact|trace)\b/i.test(
        q
      );

    if (isRepoQuery) {
      askCodebase(q);
    } else {
      sendAiRequest('chat', q);
    }
  };

  const handleCapabilityClick = (action: string, promptText: string) => {
    if (isAiLoading) return;
    setActiveActionHint(action);
    if (action === 'ask_codebase') {
      askCodebase(promptText);
    } else {
      sendAiRequest(action, promptText);
    }
  };

  const handleCopySnippet = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Render markdown with code block parsing
  const renderMessageContent = (msg: AIChatMessage) => {
    if (msg.isError) {
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-rose-500 font-semibold text-xs sm:text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>AI Request Notice</span>
          </div>
          <p className="text-xs text-pulse-secondary leading-relaxed">
            {msg.content}
          </p>
          {msg.retryAction && (
            <button
              onClick={() => {
                if (msg.retryAction) {
                  sendAiRequest(msg.retryAction.action, msg.retryAction.question);
                }
              }}
              disabled={isAiLoading}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-600 dark:text-teal-300 text-xs font-semibold transition disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry Request</span>
            </button>
          )}
        </div>
      );
    }

    const parts = msg.content.split(/(```[\s\S]*?```)/g);

    return (
      <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-pulse-primary">
        {parts.map((part, idx) => {
          if (part.startsWith('```')) {
            const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
            const blockLang = match?.[1] || language || 'code';
            const codeBlock = match?.[2] || part.replace(/```/g, '').trim();
            const snippetId = `${msg.id}-snippet-${idx}`;

            return (
              <div
                key={idx}
                className="my-3 rounded-2xl border border-pulse-subtle bg-pulse-bg overflow-hidden shadow-inner"
              >
                <div className="flex items-center justify-between px-3.5 py-2 bg-pulse-surface border-b border-pulse-subtle text-[11px] font-mono text-pulse-muted">
                  <span className="font-semibold text-pulse-accent uppercase">
                    {blockLang}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopySnippet(codeBlock, snippetId)}
                      className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-pulse-elevated hover:bg-pulse-elevated-hover text-pulse-secondary hover:text-pulse-primary transition font-mono text-[10px]"
                      title="Copy code to clipboard"
                    >
                      {copiedId === snippetId ? (
                        <Check className="h-3 w-3 text-teal-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      <span>{copiedId === snippetId ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setCode(codeBlock);
                        runAnalysis(codeBlock, language);
                        setActiveTab('analyzer');
                      }}
                      className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-600 dark:text-teal-300 transition font-semibold text-[10px]"
                      title="Load this code into Analyzer Studio"
                    >
                      <Play className="h-3 w-3 text-pulse-accent" />
                      <span>Apply to Analyzer</span>
                    </button>
                  </div>
                </div>

                <pre className="p-4 overflow-x-auto text-xs font-mono text-teal-700 dark:text-teal-200 leading-5">
                  {codeBlock}
                </pre>
              </div>
            );
          }

          // Markdown lines
          const formattedLines = part.split('\n').map((line, lIdx) => {
            if (line.startsWith('### ')) {
              return (
                <h4
                  key={lIdx}
                  className="text-sm sm:text-base font-bold text-pulse-accent mt-3 mb-1.5 font-sans"
                >
                  {line.replace('### ', '')}
                </h4>
              );
            }
            if (line.startsWith('## ')) {
              return (
                <h3
                  key={lIdx}
                  className="text-base sm:text-lg font-extrabold text-pulse-primary mt-4 mb-2 font-sans"
                >
                  {line.replace('## ', '')}
                </h3>
              );
            }
            if (line.startsWith('* ') || line.startsWith('- ')) {
              return (
                <div key={lIdx} className="flex items-start space-x-2 my-1 pl-2">
                  <span className="text-pulse-accent font-bold mt-0.5">•</span>
                  <span className="text-pulse-primary">{line.replace(/^[-*]\s+/, '')}</span>
                </div>
              );
            }
            if (line.trim() === '') {
              return <div key={lIdx} className="h-1.5" />;
            }
            return (
              <p key={lIdx} className="my-1 text-pulse-primary">
                {line}
              </p>
            );
          });

          return <div key={idx}>{formattedLines}</div>;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Pulse AI Header & Context Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 border border-teal-500/30 text-pulse-accent">
              <Sparkles className="h-5 w-5 animate-pulse text-teal-500 dark:text-teal-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-pulse-primary font-sans flex items-center space-x-2">
                <span>Pulse AI</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-pulse-accent font-mono font-medium">
                  Companion & Tutor
                </span>
              </h1>
              <p className="text-xs text-pulse-secondary">
                “Your Intelligent Programming Companion.” Dynamic LLM reasoning grounded in your codebase AST.
              </p>
            </div>
          </div>
        </div>

        {/* Learning Level & Context Capsule */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Active Context Capsule */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs font-mono text-pulse-secondary">
            <FileCode className="h-3.5 w-3.5 text-pulse-accent" />
            <span>{fileName}</span>
            <span>·</span>
            <span className="text-pulse-accent font-semibold">{analysis?.metrics.healthScore ?? 100}/100 Health</span>
          </div>

          {/* Learning Level Selector */}
          <div className="flex items-center space-x-1 px-2 py-1 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs font-mono">
            <GraduationCap className="h-3.5 w-3.5 text-pulse-accent ml-1" />
            <select
              value={accessibility.learningLevel || 'intermediate'}
              onChange={(e) => updateAccessibility({ learningLevel: e.target.value as any })}
              className="bg-transparent text-pulse-primary font-semibold text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="beginner" className="bg-pulse-surface text-pulse-primary">Beginner Level</option>
              <option value="intermediate" className="bg-pulse-surface text-pulse-primary">Intermediate Level</option>
              <option value="advanced" className="bg-pulse-surface text-pulse-primary">Advanced Level</option>
            </select>
          </div>

          {/* Export Report Quick Trigger */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-xs text-pulse-primary transition font-medium"
            title="Export Report & Findings (PDF / JSON)"
          >
            <Download className="h-3.5 w-3.5 text-pulse-accent" />
            <span>Export Report</span>
          </button>

          {/* Clear Chat Button */}
          <button
            onClick={clearAiHistory}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-pulse-elevated hover:bg-rose-500/15 border border-pulse-subtle text-xs text-pulse-secondary hover:text-rose-500 transition"
            title="Clear Chat History"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* 15-Language Knowledge Hub Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-pulse-surface border border-pulse-subtle">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-mono text-pulse-muted shrink-0 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-pulse-accent" />
            <span>15-Language Engine:</span>
          </span>
          <div className="flex items-center gap-1 min-w-max">
            {ALL_15_LANGS.map((langKey) => {
              const p = getLanguageKnowledgeProfile(langKey);
              const isActive = (language || 'typescript') === langKey;
              return (
                <button
                  key={langKey}
                  onClick={() => {
                    if (setLanguage) setLanguage(langKey);
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono transition ${
                    isActive
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold'
                      : 'text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated'
                  }`}
                  title={`${p.name}: ${p.typeSystem.category} Typing, ${p.memoryModel.management}`}
                >
                  <span>{p.icon}</span>
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => {
            setInspectingLang(language || 'typescript');
            setIsKnowledgeModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-xs font-mono text-pulse-primary shrink-0 transition"
        >
          <BookOpen className="w-3.5 h-3.5 text-pulse-accent" />
          <span>Inspect {currentProfile.name} Specs</span>
        </button>
      </div>

      {/* Progressive Disclosure Mode Categories */}
      <div className="space-y-3">
        {/* Category Tab Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          {(['ALL', 'REPO', 'ERROR_INTEL', 'LEARN', 'CODE', 'DEBUG', 'ANALYZE', 'TEST', 'PRACTICE'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-teal-500 text-[#08110F] shadow-sm'
                  : 'bg-pulse-surface text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated border border-pulse-subtle'
              }`}
            >
              {cat === 'REPO'
                ? 'REPO INTELLIGENCE'
                : cat === 'ERROR_INTEL'
                ? 'ERROR & STACK INTELLIGENCE'
                : cat}
            </button>
          ))}
        </div>

        {/* Dedicated Ask Your Codebase Panel if REPO is selected */}
        {selectedCategory === 'REPO' && (
          <div className="animate-fadeIn">
            <AskCodebaseWidget onJumpToCode={() => setActiveTab('analyzer')} />
          </div>
        )}

        {/* Dedicated Error Intelligence & Stack Trace Engine if ERROR_INTEL is selected */}
        {selectedCategory === 'ERROR_INTEL' && (
          <div className="animate-fadeIn">
            <ErrorIntelligenceWidget
              onJumpToLearn={(lang, conceptId) => {
                if (setLanguage) setLanguage(lang);
                setActiveTab('learn');
              }}
              onOpenKnowledgeModal={(lang) => {
                setInspectingLang(lang);
                setIsKnowledgeModalOpen(true);
              }}
            />
          </div>
        )}

        {/* Capability Action Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {filteredCapabilities.slice(0, 8).map((cap) => {
            const Icon = cap.icon;
            return (
              <button
                key={cap.id}
                onClick={() => handleCapabilityClick(cap.action, cap.prompt)}
                disabled={isAiLoading}
                className="p-3 rounded-2xl bg-pulse-surface border border-pulse-subtle hover:border-pulse-strong hover:bg-pulse-elevated text-left transition group disabled:opacity-50 shadow-sm"
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div className="p-1 rounded-lg bg-pulse-elevated text-pulse-accent group-hover:scale-110 transition-transform">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-pulse-primary group-hover:text-pulse-accent truncate">
                    {cap.label}
                  </h4>
                </div>
                <p className="text-[10px] text-pulse-secondary line-clamp-1">
                  {cap.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Conversation Body */}
      <div className="flex flex-col rounded-3xl bg-pulse-surface border border-pulse-subtle overflow-hidden min-h-[480px] shadow-sm">
        {/* Messages Stream */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[560px]">
          {aiMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 h-8 w-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-pulse-accent">
                  <Bot className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 sm:p-5 border shadow-sm relative group ${
                  msg.role === 'user'
                    ? 'bg-teal-500/10 border-teal-500/30 text-pulse-primary'
                    : msg.isError
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300'
                    : 'bg-pulse-elevated border-pulse-subtle text-pulse-primary'
                }`}
              >
                {renderMessageContent(msg)}

                {/* Message Action Bar for Assistant */}
                {msg.role === 'assistant' && !msg.isError && msg.id !== 'welcome' && (
                  <div className="mt-3 pt-2 border-t border-pulse-subtle space-y-2">
                    {/* Follow-up Learning Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <button
                        onClick={() => sendAiRequest('analogy', 'Explain with an everyday analogy')}
                        disabled={isAiLoading}
                        className="px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[10px] font-medium transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <Lightbulb className="h-2.5 w-2.5" />
                        <span>Everyday Analogy</span>
                      </button>

                      <button
                        onClick={() => sendAiRequest('hint', 'Give me the next progressive hint')}
                        disabled={isAiLoading}
                        className="px-2 py-0.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-300 text-[10px] font-medium transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <HelpCircle className="h-2.5 w-2.5" />
                        <span>Next Hint</span>
                      </button>

                      <button
                        onClick={() => sendAiRequest('step_by_step', 'Walk through this step by step')}
                        disabled={isAiLoading}
                        className="px-2 py-0.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-[10px] font-medium transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <Compass className="h-2.5 w-2.5" />
                        <span>Step-by-Step</span>
                      </button>

                      <button
                        onClick={() => sendAiRequest('chat', 'Can you explain this in simpler terms for a beginner?')}
                        disabled={isAiLoading}
                        className="px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[10px] font-medium transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <span>🐣 Explain Simply</span>
                      </button>

                      <button
                        onClick={() => sendAiRequest('practice', 'Give me a quick practice challenge')}
                        disabled={isAiLoading}
                        className="px-2 py-0.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 text-[10px] font-medium transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <Sparkles className="h-2.5 w-2.5" />
                        <span>Practice Challenge</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-pulse-muted">
                      <span className="font-mono text-[10px]">DevPulse Mentor Intelligence</span>
                      <button
                        onClick={() => handleCopySnippet(msg.content, msg.id)}
                        className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-pulse-surface hover:bg-pulse-surface-hover text-pulse-secondary hover:text-pulse-primary transition font-medium"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-teal-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Response</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Retry Button for Errors */}
                {msg.isError && (
                  <div className="mt-3 pt-2 border-t border-rose-500/20 flex items-center justify-between">
                    <span className="text-xs text-rose-500 font-medium">Request encountered a transient issue</span>
                    <button
                      onClick={() => retryAiRequest(msg.retryAction?.action || 'chat', msg.retryAction?.question)}
                      className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-500 text-xs font-bold transition"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Retry Request</span>
                    </button>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="flex-shrink-0 h-8 w-8 rounded-xl bg-pulse-elevated border border-pulse-subtle flex items-center justify-center text-pulse-secondary">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {/* AI Thinking & Streaming Staged Animation */}
          {isAiLoading && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-pulse-elevated border border-pulse-subtle max-w-lg">
              <div className="flex items-center space-x-3">
                <div className="h-7 w-7 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-pulse-accent animate-pulse">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-pulse-primary">
                    <span className="w-2 h-2 rounded-full bg-pulse-accent animate-ping" />
                    <span>Pulse AI Reasoning</span>
                  </div>
                  <p className="text-[11px] text-pulse-secondary">
                    {loadingStages[loadingStage]}
                  </p>
                </div>
              </div>

              <button
                onClick={cancelAiRequest}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-pulse-surface hover:bg-rose-500/15 border border-pulse-subtle text-xs text-pulse-secondary hover:text-rose-500 transition font-medium"
                title="Stop generation"
              >
                <StopCircle className="h-3.5 w-3.5" />
                <span>Stop</span>
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 bg-pulse-surface border-t border-pulse-subtle flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask Pulse AI anything about this code, algorithms, or refactoring..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isAiLoading}
            className="flex-1 bg-pulse-elevated border border-pulse-subtle rounded-xl px-4 py-2.5 text-xs sm:text-sm text-pulse-primary placeholder-pulse-muted focus:outline-none focus:border-pulse-strong disabled:opacity-50"
          />
          {isAiLoading ? (
            <button
              type="button"
              onClick={cancelAiRequest}
              className="flex items-center justify-center h-10 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-500 text-xs sm:text-sm font-bold transition shadow-sm"
            >
              <StopCircle className="h-3.5 w-3.5 mr-1.5" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputPrompt.trim()}
              className="flex items-center justify-center h-10 px-5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs sm:text-sm font-bold transition shadow-sm disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              <span>Send</span>
            </button>
          )}
        </form>
      </div>

      {/* 15-Language Knowledge Inspector Modal */}
      <LanguageKnowledgeInspectorModal
        isOpen={isKnowledgeModalOpen}
        onClose={() => setIsKnowledgeModalOpen(false)}
        initialLanguage={inspectingLang}
        onSelectLanguage={(lang) => {
          setInspectingLang(lang);
          if (setLanguage) setLanguage(lang);
        }}
        onNavigateToLearn={(lang, conceptId) => {
          if (setLanguage) setLanguage(lang);
          setActiveTab('learn');
        }}
      />
    </div>
  );
};

