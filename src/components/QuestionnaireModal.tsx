/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  GraduationCap,
  X,
  ArrowRight,
  Shield,
  Code2,
  Bug,
  Cpu,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { classifyQuestionnaire } from '../engine/personalization';
import { KnowledgeLevel } from '../types';

interface QuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstLaunch?: boolean;
}

const QUESTIONS = [
  {
    id: 'programming_score' as const,
    number: 1,
    title: 'General Programming Experience',
    question: 'How would you rate your overall programming knowledge?',
    measure: 'General experience',
    icon: Code2,
    labels: ['1: Novice / Learning basics', '2: Early developer', '3: Comfortable with fundamentals', '4: Experienced engineer', '5: Senior / Staff expert'],
  },
  {
    id: 'code_reading_score' as const,
    number: 2,
    title: 'Code Comprehension',
    question: 'How comfortable are you reading and understanding existing code?',
    measure: 'Code comprehension',
    icon: Layers,
    labels: ['1: Need help reading code', '2: Understand basic functions', '3: Comfortable with standard libraries', '4: Quickly parse complex patterns', '5: Effortlessly navigate large repos'],
  },
  {
    id: 'debugging_score' as const,
    number: 3,
    title: 'Debugging Ability',
    question: 'How comfortable are you debugging errors in code?',
    measure: 'Debugging ability',
    icon: Bug,
    labels: ['1: Rely heavily on guidance', '2: Can fix basic syntax errors', '3: Debug logic and runtime errors', '4: Efficient with profiling & debuggers', '5: Root-cause tricky race conditions/crashes'],
  },
  {
    id: 'cs_concepts_score' as const,
    number: 4,
    title: 'Computer Science Concepts',
    question: 'How familiar are you with concepts like algorithms, data structures, OOP, and software architecture?',
    measure: 'CS / Software concepts',
    icon: Cpu,
    labels: ['1: Unfamiliar with data structures', '2: Know lists, loops & arrays', '3: Comfortable with trees, maps & OOP', '4: Solid grasp of Big-O & design patterns', '5: Advanced algorithmic & architectural mastery'],
  },
  {
    id: 'architecture_score' as const,
    number: 5,
    title: 'Advanced Engineering Knowledge',
    question: 'How comfortable are you with advanced concepts such as dependencies, complexity, security vulnerabilities, and architecture?',
    measure: 'Advanced engineering knowledge',
    icon: Shield,
    labels: ['1: New to these concepts', '2: Heard of complexity/security basics', '3: Understand coupling and common vulnerabilities', '4: Design modular systems & audit security', '5: Enterprise-scale system architect'],
  },
];

export const QuestionnaireModal: React.FC<QuestionnaireModalProps> = ({
  isOpen,
  onClose,
  isFirstLaunch = false,
}) => {
  const { personalizationProfile, updatePersonalizationProfile } = useApp();

  const [answers, setAnswers] = useState({
    programming_score: personalizationProfile.questionnaire?.programming_score || 3,
    code_reading_score: personalizationProfile.questionnaire?.code_reading_score || 3,
    debugging_score: personalizationProfile.questionnaire?.debugging_score || 3,
    cs_concepts_score: personalizationProfile.questionnaire?.cs_concepts_score || 3,
    architecture_score: personalizationProfile.questionnaire?.architecture_score || 3,
  });

  if (!isOpen) return null;

  const { scores, dimensions } = classifyQuestionnaire(answers);
  const totalScore = scores.total_score;
  const recommendedLevel: KnowledgeLevel = scores.recommended_level;

  const handleScoreChange = (key: keyof typeof answers, value: number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updatePersonalizationProfile({
      knowledge_level: recommendedLevel,
      questionnaire: scores,
      skill_dimensions: dimensions,
      settings: {
        manually_selected_level: false,
      },
    });
    onClose();
  };

  const handleSkip = () => {
    // Default to Intermediate cleanly
    updatePersonalizationProfile({
      knowledge_level: 'intermediate',
      settings: {
        manually_selected_level: false,
      },
    });
    onClose();
  };

  const getLevelBadgeClass = (level: KnowledgeLevel) => {
    switch (level) {
      case 'beginner':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'intermediate':
        return 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30';
      case 'expert':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
    }
  };

  return (
    <div
      id="devpulse-questionnaire-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="questionnaire-title"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-pulse-bg border-b border-pulse-subtle shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-teal-500/15 text-pulse-accent">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2 id="questionnaire-title" className="text-base font-bold text-pulse-primary">
                {isFirstLaunch ? 'Welcome to DevPulse — Knowledge Setup' : 'Personalization Questionnaire'}
              </h2>
              <p className="text-[11px] text-pulse-muted">
                5 quick questions to tailor explanations, analogies, and AI responses to your level
              </p>
            </div>
          </div>

          <button
            onClick={handleSkip}
            className="p-1.5 rounded-lg text-pulse-muted hover:text-pulse-primary hover:bg-pulse-elevated transition cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Questions Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Live Classification Banner */}
          <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono uppercase tracking-wider text-pulse-muted font-bold">
                  Recommended Tier:
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border capitalize ${getLevelBadgeClass(recommendedLevel)}`}>
                  {recommendedLevel}
                </span>
              </div>
              <p className="text-[11px] text-pulse-muted mt-1">
                Total Score: <span className="font-bold text-pulse-primary font-mono">{totalScore}/25</span> • 
                {recommendedLevel === 'beginner' && ' Clear step-by-step analogies & tutorial explanations'}
                {recommendedLevel === 'intermediate' && ' Pragmatic architecture & idiomatic refactorings'}
                {recommendedLevel === 'expert' && ' Technical brevity, low-level metrics & trade-offs'}
              </p>
            </div>

            <div className="flex items-center space-x-1.5 text-[10px] font-mono text-pulse-muted shrink-0">
              <span className={totalScore <= 10 ? 'text-amber-500 font-bold' : ''}>5–10 Beginner</span>
              <span>•</span>
              <span className={totalScore >= 11 && totalScore <= 18 ? 'text-teal-500 font-bold' : ''}>11–18 Intermediate</span>
              <span>•</span>
              <span className={totalScore >= 19 ? 'text-purple-500 font-bold' : ''}>19–25 Expert</span>
            </div>
          </div>

          {/* 5 Questions */}
          <div className="space-y-6">
            {QUESTIONS.map((q) => {
              const Icon = q.icon;
              const currentValue = answers[q.id];

              return (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl bg-pulse-bg/60 border border-pulse-subtle space-y-3 transition-colors hover:border-teal-500/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2.5">
                      <div className="mt-0.5 p-1.5 rounded-lg bg-teal-500/10 text-pulse-accent">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-mono font-bold text-pulse-accent">
                            Question {q.number} of 5
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-pulse-elevated text-pulse-muted font-mono">
                            {q.measure}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-pulse-primary mt-1">
                          {q.question}
                        </h4>
                      </div>
                    </div>
                    <span className="text-sm font-bold font-mono text-pulse-accent bg-teal-500/15 px-2.5 py-1 rounded-xl shrink-0">
                      {currentValue} / 5
                    </span>
                  </div>

                  {/* 1 to 5 Selector Buttons */}
                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const isSelected = currentValue === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleScoreChange(q.id, val)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold font-mono transition cursor-pointer border ${
                            isSelected
                              ? 'bg-teal-500 text-[#08110F] border-teal-500 shadow-sm'
                              : 'bg-pulse-elevated border-pulse-subtle text-pulse-secondary hover:text-pulse-primary hover:border-teal-500/40'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Label Description */}
                  <p className="text-[11px] text-pulse-muted font-mono italic">
                    → {q.labels[currentValue - 1]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-pulse-bg border-t border-pulse-subtle shrink-0">
          <button
            type="button"
            onClick={handleSkip}
            className="px-4 py-2 rounded-xl text-xs text-pulse-muted hover:text-pulse-primary transition font-mono cursor-pointer"
          >
            Skip for now (Default to Intermediate)
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <span>Save & Apply {recommendedLevel.toUpperCase()}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
