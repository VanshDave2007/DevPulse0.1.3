import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Target,
  Network,
  Boxes,
  Layers,
  Code2,
  Check,
  Copy,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Zap,
  Info,
  CornerDownRight,
  ArrowRight,
  Send,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AskResult, CodeCitation, ClarificationOption } from '../types';
import { SymbolResolutionService } from '../services/symbolResolutionService';

interface AskCodebaseWidgetProps {
  onJumpToCode?: (file: string, line?: number) => void;
}

export const AskCodebaseWidget: React.FC<AskCodebaseWidgetProps> = ({ onJumpToCode }) => {
  const {
    code,
    language,
    fileName,
    askCodebase,
    isAiLoading,
    setActiveTab,
  } = useApp();

  const [queryInput, setQueryInput] = useState('');
  const [activeResult, setActiveResult] = useState<AskResult | null>(null);
  const [copiedCitationIdx, setCopiedCitationIdx] = useState<number | null>(null);
  const [copiedAnswer, setCopiedAnswer] = useState(false);

  // Suggested preset questions grounded in repository data
  const presetQueries = [
    {
      label: 'Where is Auth Handled?',
      query: 'Where is authentication and session verification handled in this codebase?',
      icon: ShieldAlert,
    },
    {
      label: 'Who Calls Main Symbols?',
      query: 'Who calls the primary functions and classes in this file?',
      icon: Network,
    },
    {
      label: 'Calculate Blast Radius',
      query: 'What is the blast radius and downstream impact if I modify this code?',
      icon: Flame,
    },
    {
      label: 'Root Cause of Findings',
      query: 'What is the root cause of the highest priority findings in this file?',
      icon: Target,
    },
    {
      label: 'Package Dependencies',
      query: 'What external packages and modules does this code depend on?',
      icon: Boxes,
    },
  ];

  // Symbol resolution preview while typing
  const liveSymbolCandidate = useMemo(() => {
    if (!queryInput.trim() || queryInput.length < 3) return null;
    const res = SymbolResolutionService.resolveNaturalLanguageQuery(
      queryInput,
      code,
      fileName,
      language
    );
    return res.matchedSymbol || (res.candidates[0] ? res.candidates[0] : null);
  }, [queryInput, code, fileName, language]);

  const handleExecuteQuery = async (q: string) => {
    if (!q.trim() || isAiLoading) return;
    setQueryInput(q);
    const result = await askCodebase(q);
    if (result) {
      setActiveResult(result);
    }
  };

  const handleSelectClarification = async (option: ClarificationOption) => {
    if (!activeResult) return;
    const followUpQuery = `${activeResult.query} for ${option.label}`;
    await handleExecuteQuery(followUpQuery);
  };

  const handleCopyCitation = (snippet: string, idx: number) => {
    navigator.clipboard.writeText(snippet);
    setCopiedCitationIdx(idx);
    setTimeout(() => setCopiedCitationIdx(null), 2000);
  };

  const handleCopyFullAnswer = () => {
    if (!activeResult) return;
    const fullText = `# ${activeResult.summary}\n\n${activeResult.groundedAnswer}\n\n## Evidence Citations\n${activeResult.citations
      .map((c) => `- ${c.file}:${c.line || 'N/A'} - \`${c.symbol || 'snippet'}\``)
      .join('\n')}`;
    navigator.clipboard.writeText(fullText);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  return (
    <div id="devpulse-ask-codebase-widget" className="space-y-4">
      {/* Search Input Container */}
      <div className="p-4 sm:p-5 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-500 dark:text-teal-400">
              <Search className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-pulse-primary font-sans flex items-center space-x-2">
                <span>Ask Your Codebase</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-[10px] font-mono font-bold text-teal-500 dark:text-teal-400">
                  Deterministic AST Grounding
                </span>
              </h3>
              <p className="text-xs text-pulse-muted">
                Ask natural language questions about architecture, call graphs, security, and blast radius.
              </p>
            </div>
          </div>
        </div>

        {/* Query Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecuteQuery(queryInput);
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="e.g. Where is authentication handled? Who calls calculateTax? What is the blast radius?"
            disabled={isAiLoading}
            className="w-full pl-4 pr-24 py-3 rounded-2xl bg-pulse-elevated border border-pulse-subtle focus:border-teal-500 text-xs sm:text-sm text-pulse-primary placeholder-pulse-muted focus:outline-none transition"
          />

          <button
            type="submit"
            disabled={!queryInput.trim() || isAiLoading}
            className="absolute right-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            {isAiLoading ? (
              <>
                <div className="h-3 w-3 border-2 border-[#08110F] border-t-transparent rounded-full animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ask</span>
              </>
            )}
          </button>
        </form>

        {/* Live Symbol Disambiguation Hint while typing */}
        {liveSymbolCandidate && (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-pulse-elevated border border-pulse-subtle text-[11px] font-mono text-pulse-secondary animate-fadeIn">
            <span className="text-pulse-muted">Resolved AST Symbol:</span>
            <span className="text-teal-500 dark:text-teal-400 font-bold">
              {liveSymbolCandidate.type} {liveSymbolCandidate.name}
            </span>
            <span className="text-pulse-muted">({fileName}:{liveSymbolCandidate.startLine})</span>
          </div>
        )}

        {/* Preset Prompt Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
          {presetQueries.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleExecuteQuery(item.query)}
                disabled={isAiLoading}
                className="px-3 py-1.5 rounded-xl bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle hover:border-teal-500/40 text-xs text-pulse-secondary hover:text-pulse-primary transition flex items-center space-x-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Icon className="h-3.5 w-3.5 text-teal-500 dark:text-teal-400" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Structured Evidence-Backed Answer Result */}
      {activeResult && (
        <div className="p-5 sm:p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-md space-y-5 animate-fadeIn">
          {/* Header Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-pulse-subtle">
            <div className="flex items-center space-x-2">
              <span
                className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold uppercase border ${
                  activeResult.confidence === 'HIGH'
                    ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-emerald-500/30'
                    : activeResult.confidence === 'MEDIUM'
                    ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border-rose-500/30'
                }`}
              >
                {activeResult.confidenceScore}% {activeResult.confidence} CONFIDENCE
              </span>

              <span className="px-2.5 py-1 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs font-mono text-pulse-secondary">
                Intent: {activeResult.intent}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyFullAnswer}
                className="px-3 py-1.5 rounded-xl bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-xs text-pulse-secondary hover:text-pulse-primary transition flex items-center space-x-1.5 cursor-pointer"
              >
                {copiedAnswer ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedAnswer ? 'Copied' : 'Copy Answer'}</span>
              </button>
            </div>
          </div>

          {/* Question Summary */}
          <div className="space-y-1">
            <h4 className="text-base font-bold text-pulse-primary font-sans">
              {activeResult.summary}
            </h4>
          </div>

          {/* Clarification Disambiguation Card if multiple symbols matched */}
          {activeResult.clarification && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center space-x-2 text-amber-500 dark:text-amber-400 font-bold text-xs font-mono">
                <HelpCircle className="h-4 w-4" />
                <span>{activeResult.clarification.question}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeResult.clarification.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectClarification(opt)}
                    className="p-2.5 rounded-xl bg-pulse-surface hover:bg-pulse-elevated border border-pulse-subtle text-left transition flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-pulse-primary group-hover:text-teal-400 font-mono">
                        {opt.label}
                      </div>
                      {opt.description && (
                        <div className="text-[11px] text-pulse-muted">{opt.description}</div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-pulse-muted group-hover:text-teal-400 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grounded Natural Language Explanation */}
          <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle text-xs sm:text-sm text-pulse-primary leading-relaxed whitespace-pre-wrap font-sans">
            {activeResult.groundedAnswer}
          </div>

          {/* Exact Code Citations & Grounded AST References */}
          {activeResult.citations.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-mono uppercase font-bold text-pulse-muted flex items-center space-x-1.5">
                <Code2 className="h-3.5 w-3.5 text-teal-400" />
                <span>AST Evidence Citations ({activeResult.citations.length})</span>
              </h5>
              <div className="space-y-2">
                {activeResult.citations.map((citation, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 font-mono">
                        <span className="text-teal-500 dark:text-teal-400 font-bold">
                          {citation.file}:{citation.line || 'N/A'}
                        </span>
                        {citation.symbol && (
                          <span className="px-2 py-0.5 rounded-md bg-pulse-surface border border-pulse-subtle text-pulse-secondary text-[11px]">
                            {citation.symbol}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCopyCitation(citation.snippet, idx)}
                          className="p-1.5 rounded-lg hover:bg-pulse-surface text-pulse-muted hover:text-pulse-primary transition cursor-pointer"
                          title="Copy snippet"
                        >
                          {copiedCitationIdx === idx ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => {
                            if (onJumpToCode) {
                              onJumpToCode(citation.file, citation.line);
                            } else {
                              setActiveTab('analyzer');
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-pulse-surface hover:bg-pulse-surface-hover border border-pulse-subtle text-xs font-mono text-pulse-secondary hover:text-pulse-primary transition flex items-center space-x-1 cursor-pointer"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Jump to Line</span>
                        </button>
                      </div>
                    </div>

                    <pre className="p-3 rounded-xl bg-pulse-bg border border-pulse-subtle font-mono text-xs text-pulse-secondary overflow-x-auto">
                      {citation.snippet}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Follow-up Suggestion Chips */}
          {activeResult.followUps && activeResult.followUps.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-pulse-subtle">
              <span className="text-xs font-mono uppercase text-pulse-muted">Suggested Follow-ups</span>
              <div className="flex flex-wrap gap-2">
                {activeResult.followUps.map((fu, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExecuteQuery(fu)}
                    className="px-3 py-1.5 rounded-xl bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-xs text-pulse-secondary hover:text-pulse-primary transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <CornerDownRight className="h-3.5 w-3.5 text-teal-400" />
                    <span>{fu}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
