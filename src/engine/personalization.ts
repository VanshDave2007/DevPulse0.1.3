/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CodeSmell,
  KnowledgeLevel,
  QuestionnaireScores,
  SkillDimensionScores,
  SupportedLanguage,
  UserPersonalizationPreferences,
  UserPersonalizationProfile,
} from '../types';

export const DEFAULT_PREFERENCES: UserPersonalizationPreferences = {
  explanation_depth: 3,
  show_examples: true,
  show_explanations: true,
  show_recommendations: true,
  show_diagrams: true,
  learning_mode: false,
};

export const DEFAULT_SKILL_DIMENSIONS: SkillDimensionScores = {
  programming: 3,
  code_comprehension: 3,
  debugging: 3,
  cs_concepts: 3,
  architecture: 3,
  security: 3,
  dependencies: 3,
};

export const DEFAULT_PERSONALIZATION_PROFILE: UserPersonalizationProfile = {
  knowledge_level: 'intermediate',
  preferences: { ...DEFAULT_PREFERENCES },
  skill_dimensions: { ...DEFAULT_SKILL_DIMENSIONS },
  settings: {
    manually_selected_level: false,
  },
};

/**
 * Classifies questionnaire scores into Beginner, Intermediate, or Expert
 * and computes weighted per-dimension skill scores.
 *
 * Scoring:
 * 5–10   → Beginner
 * 11–18  → Intermediate
 * 19–25  → Expert
 */
export function classifyQuestionnaire(
  answers: {
    programming_score: number;
    code_reading_score: number;
    debugging_score: number;
    cs_concepts_score: number;
    architecture_score: number;
  }
): {
  scores: QuestionnaireScores;
  dimensions: SkillDimensionScores;
} {
  const total =
    answers.programming_score +
    answers.code_reading_score +
    answers.debugging_score +
    answers.cs_concepts_score +
    answers.architecture_score;

  let recommended_level: KnowledgeLevel = 'intermediate';
  if (total <= 10) {
    recommended_level = 'beginner';
  } else if (total <= 18) {
    recommended_level = 'intermediate';
  } else {
    recommended_level = 'expert';
  }

  const scores: QuestionnaireScores = {
    ...answers,
    total_score: total,
    completed_at: Date.now(),
    recommended_level,
  };

  const dimensions: SkillDimensionScores = {
    programming: answers.programming_score,
    code_comprehension: answers.code_reading_score,
    debugging: answers.debugging_score,
    cs_concepts: answers.cs_concepts_score,
    architecture: answers.architecture_score,
    security: Number(((answers.cs_concepts_score + answers.architecture_score) / 2).toFixed(1)),
    dependencies: Number(((answers.code_reading_score + answers.architecture_score) / 2).toFixed(1)),
  };

  return { scores, dimensions };
}

export interface FormattedSmellExplanation {
  title: string;
  level: KnowledgeLevel;
  structure: 'beginner' | 'intermediate' | 'expert';
  summary: string;
  sections: Array<{
    heading: string;
    content: string;
    codeSnippet?: string;
  }>;
  badges: string[];
}

/**
 * Three-Level Explanation Engine for deterministic code smells.
 *
 * Grounded in the EXACT same analyzer facts regardless of user level:
 * - Beginner: What does it mean? → Why is this a problem? → Simple example → How to fix it → Improved code → Why the new code is better
 * - Intermediate: Issue → Cause → Recommendation → Code example
 * - Expert: Evidence → Recommendation → Potential refactoring
 */
export function formatPersonalizedSmellExplanation(
  smell: CodeSmell,
  profile: UserPersonalizationProfile,
  language: SupportedLanguage = 'typescript'
): FormattedSmellExplanation {
  // If user has a specific low score in this dimension (e.g. debugging <= 2), provide deeper guidance
  let activeLevel = profile.knowledge_level;
  if (smell.category === 'maintainability' && profile.skill_dimensions.code_comprehension <= 2) {
    activeLevel = 'beginner';
  }

  if (activeLevel === 'beginner') {
    return {
      title: `${smell.title} (${smell.severity} severity)`,
      level: 'beginner',
      structure: 'beginner',
      summary: `Let's break down this issue on Line ${smell.line} in friendly terms.`,
      badges: ['Beginner Friendly', 'Step-by-Step Guide', `Line ${smell.line}`],
      sections: [
        {
          heading: '1. What does it mean?',
          content: smell.problem || `This pattern in your code represents "${smell.title}". In simple terms, your code is doing extra work or taking paths that make it harder to read.`,
        },
        {
          heading: '2. Why is this a problem?',
          content: smell.explanation || `When code becomes complicated or repetitive, it's easier to introduce bugs when making future changes. Also, teammates or mentors reading your code may have trouble understanding the intent.`,
        },
        {
          heading: '3. Simple Everyday Analogy',
          content: getAnalogyForCategory(smell.category),
        },
        {
          heading: '4. How to fix it',
          content: smell.recommendation || 'Break the logic down into smaller helper functions with clear names.',
        },
        {
          heading: '5. Why the fixed code is better',
          content: `The refactored version is cleaner, easier to test, and reduces mental load when returning to this file later.`,
        },
      ],
    };
  }

  if (activeLevel === 'expert') {
    return {
      title: `${smell.title} — ${smell.severity}`,
      level: 'expert',
      structure: 'expert',
      summary: `Deterministic inspection flagged ${smell.title} at line ${smell.line}.`,
      badges: ['Expert Brief', `Severity: ${smell.severity}`, `Category: ${smell.category}`],
      sections: [
        {
          heading: 'Evidence & Metrics',
          content: `Symbol at line ${smell.line} violates ${smell.category} threshold (${smell.problem}).`,
        },
        {
          heading: 'Direct Recommendation',
          content: smell.recommendation || 'Apply strategy dispatch or extract functional composition to minimize cyclomatic path branching.',
        },
        {
          heading: 'Potential Refactoring Strategy',
          content: `Decouple boundary side-effects and encapsulate invariant checks at the call site.`,
        },
      ],
    };
  }

  // Intermediate (Default)
  return {
    title: `${smell.title} (Line ${smell.line})`,
    level: 'intermediate',
    structure: 'intermediate',
    summary: `${smell.problem} — Consider refactoring for improved maintainability.`,
    badges: ['Intermediate', `Severity: ${smell.severity}`, `Category: ${smell.category}`],
    sections: [
      {
        heading: 'Issue Detected',
        content: `Line ${smell.line}: ${smell.problem}`,
      },
      {
        heading: 'Underlying Cause',
        content: smell.explanation || `Violation in ${smell.category} heuristics. Increases testing burden and coupling.`,
      },
      {
        heading: 'Actionable Recommendation',
        content: smell.recommendation || 'Refactor into smaller modular functions and isolate conditional blocks.',
      },
    ],
  };
}

/**
 * Returns intuitive analogies for beginner explanation depth
 */
function getAnalogyForCategory(category: string): string {
  switch (category.toLowerCase()) {
    case 'complexity':
      return 'Think of high complexity like a highway with 10 sudden detour exits — the driver (and computer) has to check every single exit sign before knowing where to turn.';
    case 'coupling':
    case 'dependencies':
      return 'Think of tight coupling like rooms in a house connected by dozens of secret passageways. Moving furniture in one room accidentally knocks over lamps in another!';
    case 'security':
      return 'Think of this vulnerability like an unlocked ground-floor window with the latch left open — anyone passing by could slip in.';
    case 'maintainability':
    case 'redundancy':
      return 'Think of repetitive code like printing 20 copies of a recipe instead of referencing the original master recipe card.';
    default:
      return 'Think of this code smell like a slightly cluttered workbench — cleaning it up makes the work go much faster and prevents mistakes.';
  }
}

/**
 * Build personalized AI system instructions and prompt context
 */
export function buildPersonalizedAiContext(
  profile: UserPersonalizationProfile,
  extra: {
    action?: string;
    topic?: string;
    dimension?: keyof SkillDimensionScores;
    code?: string;
    language?: string;
  } = {}
): {
  effectiveLevel: KnowledgeLevel;
  depthScore: number;
  systemDirective: string;
} {
  let effectiveLevel = profile.knowledge_level;

  // Check if specific dimension score calls for more detail
  if (extra.dimension && profile.skill_dimensions) {
    const dimScore = profile.skill_dimensions[extra.dimension];
    if (dimScore <= 2) {
      effectiveLevel = 'beginner';
    }
  }

  let systemDirective = '';
  if (effectiveLevel === 'beginner') {
    systemDirective = `USER KNOWLEDGE LEVEL: BEGINNER (Depth ${profile.preferences.explanation_depth}/5)
- Follow the 6-part structure: What it means → Why it's a problem → Simple everyday analogy → How to fix it → Clean code example → Why the new code is better.
- Use encouraging, non-condescending language.
- Always include clear, working code examples when demonstrating a fix.
${profile.preferences.show_diagrams ? '- Include clear ASCII or text workflow diagrams if illustrating state flow.' : ''}`;
  } else if (effectiveLevel === 'expert') {
    systemDirective = `USER KNOWLEDGE LEVEL: EXPERT / SENIOR (Depth ${profile.preferences.explanation_depth}/5)
- Follow the 3-part concise structure: Evidence & Metrics → Direct Recommendation → Potential Refactoring / Architecture Impact.
- Be concise, direct, and omit foundational tutorial explanations.
- Focus on performance implications, algorithmic complexity (Big-O), memory allocation, and concurrency trade-offs.`;
  } else {
    systemDirective = `USER KNOWLEDGE LEVEL: INTERMEDIATE (Depth ${profile.preferences.explanation_depth}/5)
- Follow the 4-part structure: Issue → Cause → Recommendation → Clean code example.
- Strike a balance between pragmatic engineering practices and clean architecture.`;
  }

  return {
    effectiveLevel,
    depthScore: profile.preferences.explanation_depth,
    systemDirective,
  };
}
