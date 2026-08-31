import { LanguageLearningContent, LearningSearchFilter } from './types';
import { pythonContent } from './languages/python';
import { javascriptContent } from './languages/javascript';
import { typescriptContent } from './languages/typescript';
import { javaContent } from './languages/java';
import { cppContent } from './languages/cpp';
import { goContent } from './languages/go';
import { rustContent } from './languages/rust';
import { csharpContent } from './languages/csharp';
import { phpContent } from './languages/php';
import { rubyContent } from './languages/ruby';
import { kotlinContent } from './languages/kotlin';
import { swiftContent } from './languages/swift';
import { sqlContent } from './languages/sql';
import { htmlContent } from './languages/html';
import { cssContent } from './languages/css';

export const allLanguagesLearningContent: LanguageLearningContent[] = [
  pythonContent,
  javascriptContent,
  typescriptContent,
  javaContent,
  cppContent,
  csharpContent,
  goContent,
  rustContent,
  kotlinContent,
  swiftContent,
  phpContent,
  rubyContent,
  sqlContent,
  htmlContent,
  cssContent,
];

export const learningContentMap: Record<string, LanguageLearningContent> = {
  python: pythonContent,
  javascript: javascriptContent,
  typescript: typescriptContent,
  java: javaContent,
  cpp: cppContent,
  csharp: csharpContent,
  go: goContent,
  rust: rustContent,
  kotlin: kotlinContent,
  swift: swiftContent,
  php: phpContent,
  ruby: rubyContent,
  sql: sqlContent,
  html: htmlContent,
  css: cssContent,
};

export function getLanguageLearningContent(id: string): LanguageLearningContent | undefined {
  const normalized = id.toLowerCase().trim();
  if (learningContentMap[normalized]) {
    return learningContentMap[normalized];
  }
  // Alternate aliases
  if (normalized === 'js') return javascriptContent;
  if (normalized === 'ts') return typescriptContent;
  if (normalized === 'py') return pythonContent;
  if (normalized === 'c++' || normalized === 'c') return cppContent;
  if (normalized === 'c#' || normalized === 'dotnet' || normalized === '.net') return csharpContent;
  if (normalized === 'golang') return goContent;
  if (normalized === 'kt') return kotlinContent;
  if (normalized === 'rb') return rubyContent;
  if (normalized === 'html5') return htmlContent;
  if (normalized === 'css3') return cssContent;

  return allLanguagesLearningContent.find(
    (l) => l.name.toLowerCase() === normalized || l.extensions.includes(`.${normalized}`)
  );
}

export function filterLearningLanguages(
  languages: LanguageLearningContent[],
  filter: LearningSearchFilter
): LanguageLearningContent[] {
  return languages.filter((lang) => {
    // Query search
    if (filter.query && filter.query.trim()) {
      const q = filter.query.toLowerCase().trim();
      const matchesName = lang.name.toLowerCase().includes(q);
      const matchesTagline = lang.tagline.toLowerCase().includes(q);
      const matchesPurpose = lang.currentPurpose.toLowerCase().includes(q);
      const matchesParadigms = lang.paradigms.some((p) => p.toLowerCase().includes(q));
      const matchesExtensions = lang.extensions.some((ext) => ext.toLowerCase().includes(q));
      const matchesStrengths = lang.whyLearn.strengths.some((s) => s.toLowerCase().includes(q));
      const matchesUseCases = lang.useCases.some(
        (u) => u.title.toLowerCase().includes(q) || u.description.toLowerCase().includes(q)
      );

      if (!matchesName && !matchesTagline && !matchesPurpose && !matchesParadigms && !matchesExtensions && !matchesStrengths && !matchesUseCases) {
        return false;
      }
    }

    // Difficulty filter
    if (filter.difficulty && filter.difficulty !== 'All') {
      if (lang.difficulty !== filter.difficulty) {
        return false;
      }
    }

    // Paradigm filter
    if (filter.paradigm && filter.paradigm !== 'All') {
      const match = lang.paradigms.some(
        (p) => p.toLowerCase().includes(filter.paradigm!.toLowerCase())
      );
      if (!match) return false;
    }

    // Domain / Category filter
    if (filter.category && filter.category !== 'All') {
      const cat = filter.category.toLowerCase();
      if (cat === 'web frontend' && !['javascript', 'typescript', 'html', 'css'].includes(lang.id)) return false;
      if (cat === 'backend & apis' && !['python', 'javascript', 'typescript', 'java', 'go', 'csharp', 'php', 'ruby', 'rust', 'kotlin', 'sql'].includes(lang.id)) return false;
      if (cat === 'systems & performance' && !['cpp', 'rust', 'go'].includes(lang.id)) return false;
      if (cat === 'mobile' && !['kotlin', 'swift', 'typescript', 'javascript', 'csharp'].includes(lang.id)) return false;
      if (cat === 'data & ai' && !['python', 'sql', 'cpp', 'java'].includes(lang.id)) return false;
    }

    return true;
  });
}

export * from './types';
export * from './searchEngine';
