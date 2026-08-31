import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  BookOpen,
  Lightbulb,
  Zap,
  Copy,
  Check,
  Play,
  RotateCcw,
  ArrowRight,
  Code2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LanguageLearningContent } from '../../data/learning/types';

interface AskLearningAiModalProps {
  language?: LanguageLearningContent | null;
  languageName?: string;
  languageId?: string;
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
  codeSnippet?: string;
}

export const AskLearningAiModal: React.FC<AskLearningAiModalProps> = ({
  language,
  languageName,
  languageId,
  isOpen,
  onClose,
  initialTopic,
  codeSnippet,
}) => {
  const { sendAiRequest, setCode, setLanguage, setActiveTab } = useApp();

  const resolvedName = language?.name || languageName || 'Programming';
  const resolvedId = language?.id || languageId || 'python';

  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialTopic) {
      setPrompt(`Explain how ${initialTopic} works in ${resolvedName} with practical real-world code examples and common mistakes.`);
    } else {
      setPrompt(`What are the most essential idioms, memory rules, and performance best practices in ${resolvedName}?`);
    }
    setResponse(null);
  }, [initialTopic, resolvedName, isOpen]);

  if (!isOpen) return null;

  const quickPrompts = [
    `How does memory allocation and data structure efficiency work in ${resolvedName}?`,
    `What are the top 3 anti-patterns and subtle bugs in ${resolvedName} and how to avoid them?`,
    `Explain asynchronous programming and concurrency in ${resolvedName} simply.`,
    `How do I structure clean modular code with idiomatic patterns in ${resolvedName}?`,
  ];

  const handleAsk = async (customPrompt?: string) => {
    const q = customPrompt || prompt;
    if (!q.trim()) return;

    setIsLoading(true);
    setResponse('');

    try {
      // Direct call using the learn action with resolved language
      const res = await fetch('/api/ai/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'learn',
          language: resolvedId,
          code: codeSnippet || '',
          question: `[${resolvedName} Learning Hub] ${q}`,
          learningLevel: 'intermediate',
        }),
      });

      const data = await res.json();
      if (data.text) {
        setResponse(data.text);
      } else if (data.error) {
        setResponse(`Notice: ${data.error}`);
      } else {
        setResponse('No response received. Please try again.');
      }
    } catch (err: any) {
      setResponse(`Error connecting to DevPulse AI mentor: ${err?.message || 'Network error'}. Please retry.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInPulseAi = () => {
    sendAiRequest('learn', `[${resolvedName} Learning Hub] ${prompt}`);
    onClose();
    setActiveTab('pulse-ai');
  };

  // Extract first code block from markdown response if present
  const extractCode = (md: string): string | null => {
    const match = md.match(/```(?:\w+)?\n([\s\S]*?)```/);
    return match ? match[1].trim() : null;
  };

  const codeFound = response ? extractCode(response) : null;

  const handleLoadInStudio = () => {
    if (codeFound) {
      setCode(codeFound);
      if (['python', 'javascript', 'typescript', 'rust', 'go', 'cpp', 'java'].includes(resolvedId)) {
        setLanguage(resolvedId as any);
      }
      onClose();
      setActiveTab('analyzer');
    }
  };

  return (
    <div
      id="ask-learning-ai-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-pulse-surface border border-pulse-subtle rounded-3xl shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-pulse-subtle bg-pulse-surface/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-pulse-accent">
              <Sparkles className="h-5 w-5 text-teal-500 dark:text-teal-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-pulse-primary">DevPulse AI Learning Mentor</h2>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-teal-500/15 text-teal-600 dark:text-teal-300 border border-teal-500/30">
                  {resolvedName}
                </span>
              </div>
              <p className="text-xs text-pulse-muted">
                Grounded technical explanations, code mental models & idiomatic solutions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-pulse-muted hover:text-pulse-primary rounded-xl hover:bg-pulse-elevated transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Quick Prompts */}
          {!response && !isLoading && (
            <div className="space-y-2">
              <div className="flex items-center space-x-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-pulse-muted">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                <span>Recommended Learning Inquiries</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPrompt(qp);
                      handleAsk(qp);
                    }}
                    className="text-left text-xs p-3 rounded-2xl bg-pulse-bg hover:bg-pulse-elevated border border-pulse-subtle text-pulse-secondary hover:text-pulse-primary transition flex items-start space-x-2 cursor-pointer group"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-pulse-accent shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="line-clamp-2">{qp}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Response Display */}
          {(isLoading || response) && (
            <div className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-teal-600 dark:text-teal-300">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-pulse-accent" />
                  <span>AI Mentor Explanation</span>
                </div>

                {response && !isLoading && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-pulse-surface border border-pulse-subtle text-xs text-pulse-secondary hover:text-pulse-primary transition cursor-pointer"
                    >
                      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>

                    {codeFound && (
                      <button
                        onClick={handleLoadInStudio}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/40 text-xs font-semibold hover:bg-teal-500/30 transition cursor-pointer"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Run in Analyzer</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isLoading && (
                <div className="flex items-center space-x-3 py-6 justify-center text-xs text-pulse-muted font-mono">
                  <div className="h-4 w-4 border-2 border-pulse-accent border-t-transparent rounded-full animate-spin" />
                  <span>DevPulse AI is generating grounded {resolvedName} guidance...</span>
                </div>
              )}

              {response && (
                <div className="prose prose-sm dark:prose-invert max-w-none text-xs text-pulse-primary leading-relaxed whitespace-pre-wrap font-sans bg-pulse-surface p-4 rounded-xl border border-pulse-subtle max-h-80 overflow-y-auto">
                  {response}
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-pulse-secondary flex items-center justify-between">
              <span>Your Question</span>
              {response && (
                <button
                  onClick={() => setResponse(null)}
                  className="text-pulse-accent hover:underline flex items-center space-x-1 text-[11px]"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Ask Another Question</span>
                </button>
              )}
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleAsk();
                  }
                }}
                rows={response ? 2 : 3}
                placeholder={`Ask any question about ${resolvedName}... (Press Ctrl+Enter to submit)`}
                className="w-full p-3.5 bg-pulse-bg border border-pulse-subtle rounded-2xl text-xs text-pulse-primary placeholder:text-pulse-muted focus:outline-none focus:border-pulse-accent focus:ring-1 focus:ring-pulse-accent resize-none shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-pulse-subtle bg-pulse-surface/80">
          <div className="hidden sm:flex items-center space-x-2 text-[11px] text-pulse-muted">
            <Zap className="h-3.5 w-3.5 text-emerald-500" />
            <span>Real-time AST & Learning Grounding</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleOpenInPulseAi}
              className="px-3.5 py-2 text-xs font-semibold text-pulse-secondary hover:text-pulse-primary rounded-xl border border-pulse-subtle bg-pulse-bg hover:bg-pulse-elevated transition flex items-center space-x-1.5 cursor-pointer"
              title="Open full interactive chat in Pulse AI Studio"
            >
              <span>Full Chat Studio</span>
              <ArrowRight className="h-3 w-3" />
            </button>

            <button
              type="button"
              onClick={() => handleAsk()}
              disabled={!prompt.trim() || isLoading}
              className="flex items-center space-x-2 px-5 py-2 bg-pulse-accent hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
            >
              <span>{isLoading ? 'Consulting AI...' : 'Ask AI Mentor'}</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
