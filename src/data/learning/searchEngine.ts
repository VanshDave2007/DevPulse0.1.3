import { allLanguagesLearningContent } from './index';
import {
  LanguageLearningContent,
  LearningTopicCategory,
} from './types';

export interface SearchResultItem {
  id: string;
  languageId: string;
  languageName: string;
  languageColor: string;
  category: LearningTopicCategory;
  categoryLabel: string;
  title: string;
  subtitle?: string;
  snippet?: string;
  codeSnippet?: string;
  targetTab?: string;
  badge?: string;
  matchScore: number;
}

export interface SearchIndexEntry {
  id: string;
  languageId: string;
  languageName: string;
  languageColor: string;
  category: LearningTopicCategory;
  categoryLabel: string;
  title: string;
  subtitle?: string;
  content: string;
  codeSnippet?: string;
  targetTab?: string;
  badge?: string;
  keywords: string[];
}

let searchIndexCache: SearchIndexEntry[] | null = null;

export function buildLearningSearchIndex(): SearchIndexEntry[] {
  if (searchIndexCache) return searchIndexCache;

  const entries: SearchIndexEntry[] = [];

  for (const lang of allLanguagesLearningContent) {
    // 1. Language Overview
    entries.push({
      id: `${lang.id}-overview`,
      languageId: lang.id,
      languageName: lang.name,
      languageColor: lang.color,
      category: 'overview',
      categoryLabel: 'Language Overview',
      title: `${lang.name} — ${lang.tagline}`,
      subtitle: `${lang.difficulty} · ${lang.typingSystem} · ${lang.executionModel}`,
      content: `${lang.name} ${lang.tagline} ${lang.currentPurpose} ${lang.whyLearn.importance} ${lang.whyLearn.careerRelevance} ${lang.paradigms.join(' ')} ${lang.extensions.join(' ')} ${lang.whyLearn.strengths.join(' ')} ${lang.whyLearn.commonDomains.join(' ')}`,
      targetTab: 'overview',
      badge: lang.difficulty,
      keywords: [lang.name, ...lang.paradigms, ...lang.extensions, lang.typingSystem],
    });

    // 2. Core Concepts
    if (lang.coreConcepts) {
      for (const concept of lang.coreConcepts) {
        entries.push({
          id: `${lang.id}-concept-${concept.title.replace(/\s+/g, '-').toLowerCase()}`,
          languageId: lang.id,
          languageName: lang.name,
          languageColor: lang.color,
          category: 'concepts',
          categoryLabel: 'Core Concept',
          title: `${concept.title} (${lang.name})`,
          subtitle: concept.summary,
          content: `${concept.title} ${concept.summary} ${concept.relevance}`,
          targetTab: 'concepts',
          keywords: [concept.title, lang.name, 'architecture', 'concept'],
        });
      }
    }

    // 3. Syntax Fundamentals
    if (lang.syntaxFundamentals) {
      for (const syntax of lang.syntaxFundamentals) {
        entries.push({
          id: `${lang.id}-syntax-${syntax.title.replace(/\s+/g, '-').toLowerCase()}`,
          languageId: lang.id,
          languageName: lang.name,
          languageColor: lang.color,
          category: 'syntax',
          categoryLabel: 'Syntax & Idioms',
          title: `${syntax.title} (${lang.name})`,
          subtitle: syntax.explanation,
          content: `${syntax.title} ${syntax.concept} ${syntax.explanation} ${syntax.importantNote} ${syntax.code}`,
          codeSnippet: syntax.code,
          targetTab: 'syntax',
          keywords: [syntax.title, syntax.concept, lang.name, 'syntax', 'code'],
        });
      }
    }

    // 4. Data Types
    if (lang.dataTypes?.typesList) {
      for (const dt of lang.dataTypes.typesList) {
        entries.push({
          id: `${lang.id}-datatype-${dt.type.replace(/\s+/g, '-').toLowerCase()}`,
          languageId: lang.id,
          languageName: lang.name,
          languageColor: lang.color,
          category: 'datatypes',
          categoryLabel: 'Data Types',
          title: `${dt.type} [${dt.category}] (${lang.name})`,
          subtitle: dt.description,
          content: `${dt.type} ${dt.description} ${dt.example} ${dt.category}`,
          codeSnippet: dt.example,
          targetTab: 'datatypes',
          badge: dt.category,
          keywords: [dt.type, dt.category, lang.name, 'type', 'primitive'],
        });
      }
    }

    // 5. Best Practices
    if (lang.bestPractices) {
      for (const bp of lang.bestPractices) {
        entries.push({
          id: `${lang.id}-bp-${bp.title.replace(/\s+/g, '-').toLowerCase()}`,
          languageId: lang.id,
          languageName: lang.name,
          languageColor: lang.color,
          category: 'bestpractices',
          categoryLabel: 'Best Practice',
          title: `${bp.title} (${lang.name})`,
          subtitle: bp.recommendation,
          content: `${bp.title} ${bp.category} ${bp.recommendation} ${bp.goodCode || ''} ${bp.badCode || ''}`,
          codeSnippet: bp.goodCode,
          targetTab: 'bestpractices',
          badge: bp.category,
          keywords: [bp.title, bp.category, lang.name, 'best practice', 'clean code', 'refactoring'],
        });
      }
    }

    // 6. Common Mistakes & Anti-Patterns
    if (lang.commonMistakes) {
      for (const cm of lang.commonMistakes) {
        entries.push({
          id: `${lang.id}-cm-${cm.mistake.replace(/\s+/g, '-').toLowerCase()}`,
          languageId: lang.id,
          languageName: lang.name,
          languageColor: lang.color,
          category: 'mistakes',
          categoryLabel: 'Anti-Pattern & Smell',
          title: `Avoid: ${cm.mistake} (${lang.name})`,
          subtitle: cm.whyItMatters,
          content: `${cm.mistake} ${cm.whyItMatters} ${cm.betterApproach} ${cm.badSnippet} ${cm.fixedSnippet}`,
          codeSnippet: cm.fixedSnippet,
          targetTab: 'mistakes',
          badge: 'Code Smell',
          keywords: [cm.mistake, lang.name, 'antipattern', 'code smell', 'mistake', 'bug'],
        });
      }
    }

    // 7. Security Risks & CVE Hardening
    if (lang.securityConsiderations) {
      for (const sec of lang.securityConsiderations) {
        entries.push({
          id: `${lang.id}-sec-${sec.vulnerability.replace(/\s+/g, '-').toLowerCase()}`,
          languageId: lang.id,
          languageName: lang.name,
          languageColor: lang.color,
          category: 'security',
          categoryLabel: 'Security & CVE Hardening',
          title: `${sec.vulnerability} (${lang.name})`,
          subtitle: sec.description,
          content: `${sec.vulnerability} ${sec.riskLevel} ${sec.description} ${sec.remediation} ${sec.vulnerableCode} ${sec.secureCode}`,
          codeSnippet: sec.secureCode,
          targetTab: 'security',
          badge: `${sec.riskLevel} Risk`,
          keywords: [sec.vulnerability, sec.riskLevel, lang.name, 'security', 'cve', 'vulnerability', 'injection', 'xss'],
        });
      }
    }

    // 8. Practice Exercises
    if (lang.practiceExercises) {
      for (const ex of lang.practiceExercises) {
        entries.push({
          id: `${lang.id}-practice-${ex.id}`,
          languageId: lang.id,
          languageName: lang.name,
          languageColor: lang.color,
          category: 'practice',
          categoryLabel: 'Practice Problem',
          title: `${ex.title} (${lang.name})`,
          subtitle: ex.objective,
          content: `${ex.title} ${ex.difficulty} ${ex.objective} ${ex.starterCode} ${ex.hints.join(' ')}`,
          codeSnippet: ex.starterCode,
          targetTab: 'practice',
          badge: ex.difficulty,
          keywords: [ex.title, ex.difficulty, lang.name, 'exercise', 'challenge', 'practice'],
        });
      }
    }
  }

  searchIndexCache = entries;
  return entries;
}

export function searchLearningHub(
  query: string,
  options?: {
    category?: string;
    languageId?: string;
    difficulty?: string;
    limit?: number;
  }
): SearchResultItem[] {
  const q = query.toLowerCase().trim();
  const index = buildLearningSearchIndex();

  if (!q && !options?.category && !options?.languageId && !options?.difficulty) {
    return [];
  }

  const queryTerms = q.split(/\s+/).filter(Boolean);

  const scoredResults: Array<{ item: SearchIndexEntry; score: number }> = [];

  for (const entry of index) {
    // Optional language filter
    if (options?.languageId && options.languageId !== 'all' && entry.languageId !== options.languageId) {
      continue;
    }

    // Optional category filter
    if (options?.category && options.category !== 'all' && entry.category !== options.category) {
      continue;
    }

    // Optional difficulty badge check
    if (options?.difficulty && options.difficulty !== 'All' && entry.badge && !entry.badge.includes(options.difficulty)) {
      continue;
    }

    if (queryTerms.length === 0) {
      scoredResults.push({ item: entry, score: 10 });
      continue;
    }

    let score = 0;
    const titleLower = entry.title.toLowerCase();
    const subtitleLower = (entry.subtitle || '').toLowerCase();
    const contentLower = entry.content.toLowerCase();
    const langLower = entry.languageName.toLowerCase();

    // Exact title match gets huge boost
    if (titleLower.includes(q)) {
      score += 100;
    }

    // Exact language match
    if (langLower === q) {
      score += 80;
    } else if (langLower.includes(q)) {
      score += 40;
    }

    // Check term by term
    let matchedAll = true;
    for (const term of queryTerms) {
      let termScore = 0;
      if (titleLower.includes(term)) termScore += 35;
      if (subtitleLower.includes(term)) termScore += 20;
      if (entry.keywords.some((k) => k.toLowerCase().includes(term))) termScore += 25;
      if (contentLower.includes(term)) termScore += 10;

      if (termScore === 0) {
        matchedAll = false;
      } else {
        score += termScore;
      }
    }

    if (score > 0) {
      if (matchedAll) score += 20;
      scoredResults.push({ item: entry, score });
    }
  }

  // Sort descending by score
  scoredResults.sort((a, b) => b.score - a.score);

  const limit = options?.limit || 40;
  return scoredResults.slice(0, limit).map(({ item, score }) => ({
    id: item.id,
    languageId: item.languageId,
    languageName: item.languageName,
    languageColor: item.languageColor,
    category: item.category,
    categoryLabel: item.categoryLabel,
    title: item.title,
    subtitle: item.subtitle,
    codeSnippet: item.codeSnippet,
    targetTab: item.targetTab,
    badge: item.badge,
    matchScore: score,
  }));
}
