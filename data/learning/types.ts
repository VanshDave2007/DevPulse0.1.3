import { SupportedLanguage } from '../../types';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type LearningDifficulty = DifficultyLevel;

export interface LearningSearchFilter {
  query?: string;
  category?: string;
  difficulty?: LearningDifficulty | 'All';
  paradigm?: string;
}

export type LearningTopicCategory =
  | 'overview'
  | 'concepts'
  | 'syntax'
  | 'datatypes'
  | 'controlflow'
  | 'functions'
  | 'oop'
  | 'errors'
  | 'modules'
  | 'memory'
  | 'concurrency'
  | 'tools'
  | 'bestpractices'
  | 'mistakes'
  | 'security'
  | 'performance'
  | 'roadmap'
  | 'practice';

export interface SyntaxExample {
  title: string;
  concept: string;
  explanation: string;
  code: string;
  output?: string;
  importantNote: string;
  category?: string;
}

export interface DataTypeItem {
  type: string;
  description: string;
  example: string;
  category: 'Primitive' | 'Composite' | 'Collection' | 'Special';
  isMutable?: boolean;
}

export interface ControlFlowItem {
  name: string;
  description: string;
  code: string;
  note?: string;
}

export interface FunctionConcept {
  title: string;
  description: string;
  code: string;
  paramsAndReturn?: string;
  hasDefaultParams?: boolean;
  hasLambdas?: boolean;
}

export interface OOPConcept {
  concept: string;
  description: string;
  code: string;
  note?: string;
}

export interface ErrorHandlingConcept {
  type: string;
  description: string;
  mechanism: string;
  code: string;
  debuggingTip: string;
}

export interface ModuleConcept {
  title: string;
  importSyntax: string;
  exportSyntax: string;
  packageManager: string;
  packageManagerCommand: string;
  standardModules: string[];
  description: string;
}

export interface MemoryConcept {
  model: string;
  allocation: string;
  garbageCollection: string;
  keyDetails: string[];
  code?: string;
}

export interface ConcurrencyConcept {
  model: string;
  keyPrimitives: string[];
  description: string;
  code: string;
}

export interface ToolEcosystem {
  category: string;
  tools: Array<{
    name: string;
    description: string;
    type: 'Package Manager' | 'Framework' | 'Testing' | 'Linter/Formatter' | 'Runtime/Build' | 'IDE/Editor';
  }>;
}

export interface UseCaseCategory {
  title: string;
  description: string;
  iconName?: string;
  popularity: 'High' | 'Very High' | 'Medium';
  examples: string[];
}

export interface BestPracticeItem {
  title: string;
  category: 'Naming' | 'Organization' | 'Security' | 'Testing' | 'Performance' | 'Maintainability';
  recommendation: string;
  goodCode?: string;
  badCode?: string;
}

export interface CommonMistakeItem {
  mistake: string;
  whyItMatters: string;
  badSnippet: string;
  betterApproach: string;
  fixedSnippet: string;
}

export interface SecurityRiskItem {
  vulnerability: string;
  riskLevel: 'Critical' | 'High' | 'Medium';
  description: string;
  vulnerableCode: string;
  remediation: string;
  secureCode: string;
}

export interface PerformanceTip {
  topic: string;
  impact: 'High' | 'Medium' | 'Moderate';
  description: string;
  recommendation: string;
  codeExample?: string;
}

export interface RoadmapStep {
  stepNumber: number;
  title: string;
  description: string;
  topics: string[];
  estimatedTime?: string;
}

export interface PracticeExercise {
  id: string;
  title: string;
  difficulty: DifficultyLevel;
  objective: string;
  starterCode: string;
  solutionCode: string;
  hints: string[];
  sampleOutput: string;
}

export interface LanguageLearningContent {
  id: SupportedLanguage;
  name: string;
  icon: string;
  color: string;
  tagline: string;
  extensions: string[];
  difficulty: DifficultyLevel;
  paradigms: string[];
  creator: string;
  releaseYear: string;
  currentPurpose: string;
  typingSystem: string;
  executionModel: string;
  typicalEnvironments: string[];
  devPulseSupport: {
    level: 'Deep AST Parser' | 'Lexical & Structural' | 'Syntax & Heuristics';
    capabilities: string[];
  };
  whyLearn: {
    importance: string;
    commonDomains: string[];
    strengths: string[];
    weaknesses: string[];
    careerRelevance: string;
    typicalProjects: string[];
    whenToChoose: string[];
    whenToAvoid: string[];
  };
  coreConcepts: Array<{
    title: string;
    summary: string;
    relevance: string;
  }>;
  syntaxFundamentals: SyntaxExample[];
  dataTypes: {
    summary: string;
    typingNotes: string;
    typesList: DataTypeItem[];
  };
  controlFlow: ControlFlowItem[];
  functions: FunctionConcept[];
  oop?: {
    isSupported: boolean;
    paradigmNotes: string;
    concepts: OOPConcept[];
  };
  errorHandling: ErrorHandlingConcept[];
  modulesAndPackages: ModuleConcept;
  memoryAndExecution: MemoryConcept;
  concurrency?: ConcurrencyConcept;
  toolsAndEcosystem: ToolEcosystem[];
  useCases: UseCaseCategory[];
  bestPractices: BestPracticeItem[];
  commonMistakes: CommonMistakeItem[];
  securityConsiderations: SecurityRiskItem[];
  performanceConsiderations: PerformanceTip[];
  roadmap: RoadmapStep[];
  practiceExercises: PracticeExercise[];
}
