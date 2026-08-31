/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ActionFinding,
  KnowledgeLevel,
  LearningConcept,
  UserPersonalizationProfile,
} from '../../types';
import { DeveloperLearningService } from '../../services/developerLearningService';
import { ProjectMemoryService } from '../../services/projectMemoryService';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  ExternalLink,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  Target,
  X,
  Zap,
  Check,
  ArrowLeft,
  Flame,
} from 'lucide-react';

interface FindingLearningModalProps {
  concept: LearningConcept | null;
  finding?: ActionFinding | null;
  isOpen: boolean;
  onClose: () => void;
  personalizationProfile: UserPersonalizationProfile;
  onApplyFix?: (finding: ActionFinding) => void;
  onJumpToCode?: (file: string, line: number) => void;
}

export const FindingLearningModal: React.FC<FindingLearningModalProps> = ({
  concept,
  finding,
  isOpen,
  onClose,
  personalizationProfile,
  onApplyFix,
  onJumpToCode,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, boolean>>({});
  const [copiedBad, setCopiedBad] = useState(false);
  const [copiedGood, setCopiedGood] = useState(false);
  const [activeTab, setActiveTab] = useState<'concept' | 'code-comparison' | 'practice'>('concept');

  // Relevant Project Memory associated with this domain
  const relevantProjectMemories = useMemo(() => {
    if (!concept) return [];
    const memories = ProjectMemoryService.getProjectMemory();
    return memories.filter((m) => {
      if (m.status !== 'APPROVED' && m.status !== 'ACTIVE') return false;
      const t = m.title.toLowerCase();
      const c = m.content.toLowerCase();
      const domainKey = concept.domain.toLowerCase();
      return (
        t.includes(domainKey) ||
        c.includes(domainKey) ||
        (concept.relatedFindingCategories.some((cat) => t.includes(cat.toLowerCase()) || c.includes(cat.toLowerCase())))
      );
    }).slice(0, 2);
  }, [concept]);

  if (!isOpen || !concept) return null;

  const currentLevel: KnowledgeLevel = personalizationProfile.knowledge_level || 'intermediate';

  const personalizedExplanation =
    currentLevel === 'beginner'
      ? concept.beginnerExplanation
      : currentLevel === 'expert'
      ? concept.expertExplanation
      : concept.intermediateExplanation;

  const handleSelectAnswer = (questionId: string, optionIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmitAnswer = (questionId: string, correctIdx: number) => {
    const isCorrect = selectedAnswers[questionId] === correctIdx;
    setSubmittedAnswers((prev) => ({ ...prev, [questionId]: true }));

    // Record learning event in Developer Learning System
    DeveloperLearningService.recordLearningEvent({
      projectId: 'default-project',
      skillDomain: concept.domain,
      eventType: isCorrect ? 'PRACTICE_PASSED' : 'PRACTICE_FAILED',
      relatedFindingId: finding?.id,
      relatedFile: finding?.file,
      result: isCorrect ? 'PASSED' : 'FAILED',
      details: `Practice question ${questionId} on ${concept.title}`,
    });
  };

  const handleCopyCode = (code: string, type: 'bad' | 'good') => {
    navigator.clipboard.writeText(code);
    if (type === 'bad') {
      setCopiedBad(true);
      setTimeout(() => setCopiedBad(false), 2000);
    } else {
      setCopiedGood(true);
      setTimeout(() => setCopiedGood(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-pulse-subtle bg-pulse-surface flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30">
                {concept.domain} MASTERY
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-pulse-elevated text-pulse-muted border border-pulse-subtle">
                Calibrated: <strong className="capitalize text-teal-400">{currentLevel}</strong>
              </span>
              {finding && (
                <span className="text-[11px] text-pulse-muted truncate">
                  Target: {finding.file}:{finding.line}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-pulse-primary font-sans leading-tight">
              {concept.title}
            </h2>
            <p className="text-xs text-pulse-secondary line-clamp-2">
              {concept.summary}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-pulse-muted hover:text-pulse-primary hover:bg-pulse-elevated transition cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-pulse-subtle flex items-center space-x-2 bg-pulse-surface">
          <button
            type="button"
            onClick={() => setActiveTab('concept')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'concept'
                ? 'border-teal-500 text-teal-400 font-bold'
                : 'border-transparent text-pulse-muted hover:text-pulse-primary'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Concept & Context</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code-comparison')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'code-comparison'
                ? 'border-teal-500 text-teal-400 font-bold'
                : 'border-transparent text-pulse-muted hover:text-pulse-primary'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Code Pattern (Bad vs. Good)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'practice'
                ? 'border-teal-500 text-teal-400 font-bold'
                : 'border-transparent text-pulse-muted hover:text-pulse-primary'
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            <span>Practice Check ({concept.practiceQuestions.length})</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs sm:text-sm">
          {/* TAB 1: CONCEPT */}
          {activeTab === 'concept' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Personalized Explanation Card */}
              <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/25 space-y-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-teal-400" />
                  <h3 className="text-xs font-bold font-mono uppercase text-pulse-primary">
                    Personalized Explanation ({currentLevel} Level)
                  </h3>
                </div>
                <p className="text-pulse-primary leading-relaxed text-xs sm:text-sm">
                  {personalizedExplanation}
                </p>
              </div>

              {/* Why It Matters */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-mono font-bold uppercase text-pulse-muted flex items-center space-x-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-pulse-accent" />
                  <span>Why This Matters in Production</span>
                </h4>
                <p className="p-3.5 rounded-2xl bg-pulse-elevated border border-pulse-subtle text-pulse-secondary leading-relaxed">
                  {concept.whyItMatters}
                </p>
              </div>

              {/* Project Memory Connection */}
              {relevantProjectMemories.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-pulse-subtle">
                  <h4 className="text-xs font-mono font-bold uppercase text-pulse-muted flex items-center space-x-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-teal-400" />
                    <span>Active Team Memory on this Pattern</span>
                  </h4>
                  <div className="space-y-2">
                    {relevantProjectMemories.map((mem) => (
                      <div
                        key={mem.memoryId}
                        className="p-3.5 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-pulse-primary">{mem.title}</span>
                          <span className="text-[10px] font-mono text-pulse-muted uppercase">{mem.type}</span>
                        </div>
                        <p className="text-pulse-secondary text-[11px]">{mem.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CODE PATTERNS */}
          {activeTab === 'code-comparison' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bad Example */}
                <div className="p-4 rounded-2xl bg-pulse-elevated border border-rose-500/30 space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        Vulnerable Pattern
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(concept.badCodeExample, 'bad')}
                        className="p-1 rounded text-pulse-muted hover:text-pulse-primary transition cursor-pointer"
                        title="Copy code"
                      >
                        {copiedBad ? <Check className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <pre className="p-3 rounded-xl bg-black/40 text-[11px] font-mono text-rose-200 overflow-x-auto border border-rose-500/10">
                      <code>{concept.badCodeExample}</code>
                    </pre>
                  </div>
                </div>

                {/* Good Example */}
                <div className="p-4 rounded-2xl bg-pulse-elevated border border-emerald-500/30 space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Recommended Pattern
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(concept.goodCodeExample, 'good')}
                        className="p-1 rounded text-pulse-muted hover:text-pulse-primary transition cursor-pointer"
                        title="Copy code"
                      >
                        {copiedGood ? <Check className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <pre className="p-3 rounded-xl bg-black/40 text-[11px] font-mono text-emerald-200 overflow-x-auto border border-emerald-500/10">
                      <code>{concept.goodCodeExample}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRACTICE */}
          {activeTab === 'practice' && (
            <div className="space-y-6 animate-fadeIn">
              {concept.practiceQuestions.map((q, qIdx) => {
                const selected = selectedAnswers[q.id];
                const submitted = submittedAnswers[q.id];
                const isCorrect = selected === q.correctIndex;

                return (
                  <div
                    key={q.id}
                    className="p-4 sm:p-5 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-pulse-muted uppercase">
                        Question {qIdx + 1} of {concept.practiceQuestions.length}
                      </span>
                      {submitted && (
                        <span className={`text-xs font-bold flex items-center space-x-1 ${
                          isCorrect ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          <span>{isCorrect ? 'Correct! +Skill Evidence' : 'Needs Review'}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-pulse-primary">
                      {q.question}
                    </p>

                    {q.codeSnippet && (
                      <pre className="p-2.5 rounded-xl bg-black/40 text-[11px] font-mono text-pulse-primary overflow-x-auto border border-pulse-subtle">
                        <code>{q.codeSnippet}</code>
                      </pre>
                    )}

                    <div className="space-y-2 pt-1">
                      {q.options.map((opt, optIdx) => {
                        let btnStyle = 'border-pulse-subtle bg-pulse-surface hover:border-teal-500/30 text-pulse-secondary';
                        if (selected === optIdx) {
                          btnStyle = 'border-teal-500 bg-teal-500/10 text-pulse-primary font-bold';
                        }
                        if (submitted) {
                          if (optIdx === q.correctIndex) {
                            btnStyle = 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300 font-bold';
                          } else if (selected === optIdx && !isCorrect) {
                            btnStyle = 'border-rose-500/60 bg-rose-500/15 text-rose-300';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={submitted}
                            onClick={() => handleSelectAnswer(q.id, optIdx)}
                            className={`w-full text-left p-2.5 sm:p-3 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {submitted && optIdx === q.correctIndex && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {!submitted ? (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          disabled={selected === undefined}
                          onClick={() => handleSubmitAnswer(q.id, q.correctIndex)}
                          className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-[#08110F] text-xs font-bold transition cursor-pointer"
                        >
                          Check Answer
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle text-xs text-pulse-secondary leading-relaxed">
                        <strong className="text-pulse-primary">Explanation: </strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-pulse-subtle bg-pulse-surface/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-pulse-subtle hover:bg-pulse-elevated text-xs font-semibold text-pulse-secondary hover:text-pulse-primary transition cursor-pointer"
          >
            ← Back to Finding
          </button>

          <div className="flex items-center space-x-2">
            {finding && onJumpToCode && (
              <button
                type="button"
                onClick={() => {
                  onJumpToCode(finding.file, finding.line);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl border border-pulse-subtle bg-pulse-elevated hover:bg-pulse-elevated-hover text-xs font-semibold text-pulse-primary transition cursor-pointer flex items-center space-x-1.5"
              >
                <Code2 className="h-3.5 w-3.5 text-teal-400" />
                <span>Show in Code</span>
              </button>
            )}

            {finding && onApplyFix && (
              <button
                type="button"
                onClick={() => {
                  onApplyFix(finding);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-sm cursor-pointer flex items-center space-x-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Apply Fix with AI</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
