export interface ChapterObjective {
  text: string;
}

export interface ChapterExample {
  title: string;
  explanation: string;
  code: string;
  output?: string;
  tip?: string;
}

export interface ChapterTryIt {
  id: string;
  title: string;
  task: string;
  instructions: string[];
  starterCode: string;
  solutionCode: string;
  hints: string[];
  expectedKeywords?: string[];
  validationCriteria: string[];
}

export interface ChapterQuiz {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  objectives: string[];
  concepts: Array<{
    title: string;
    explanation: string;
    codeSnippet?: string;
    keyTakeaway: string;
  }>;
  examples: ChapterExample[];
  tryIt: ChapterTryIt;
  quiz?: ChapterQuiz;
}

export interface LanguageCurriculum {
  languageId: string;
  languageName: string;
  icon: string;
  color: string;
  tagline: string;
  totalChapters: number;
  chapters: Chapter[];
}
