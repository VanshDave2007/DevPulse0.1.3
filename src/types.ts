export type SupportedLanguage =
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'java'
  | 'cpp'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'php'
  | 'ruby'
  | 'kotlin'
  | 'swift'
  | 'sql'
  | 'html'
  | 'css'
  | 'generic';

export type AnalysisDepth = 'deep_ast' | 'lexical_structural' | 'heuristic_pattern';

export type CodeSmellSeverity = 'good' | 'info' | 'warning' | 'critical';

export interface CodeSmell {
  id: string;
  title: string;
  severity: CodeSmellSeverity;
  line: number;
  column?: number;
  endLine?: number;
  codeSnippet?: string;
  problem: string;
  explanation: string;
  recommendation: string;
  solution?: string;
  confidence?: number;
  detectedBy?: string;
  whyItMatters?: string;
  category:
    | 'correctness'
    | 'syntax'
    | 'complexity'
    | 'maintainability'
    | 'dead_code'
    | 'structure'
    | 'naming'
    | 'coupling'
    | 'security'
    | 'documentation';
}

export interface FunctionAnalysis {
  name: string;
  line: number;
  endLine: number;
  loc: number;
  params: number;
  paramNames?: string[];
  complexity: number;
  cognitiveComplexity: number;
  nesting: number;
  isAsync?: boolean;
  returnType?: string;
  visibility?: 'public' | 'private' | 'protected';
}

export interface ClassAnalysis {
  name: string;
  line: number;
  endLine: number;
  loc: number;
  methodsCount: number;
  propertiesCount: number;
  inheritance?: string;
  methods?: FunctionAnalysis[];
}

export interface ImportAnalysis {
  module: string;
  names: string[];
  isExternal: boolean;
  line: number;
  isDefault?: boolean;
  riskNote?: string;
}

export interface CodeMetrics {
  loc: number;
  sloc: number;
  commentLines: number;
  blankLines: number;
  commentRatio: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maxNestingDepth: number;
  functionCount: number;
  classCount: number;
  averageFunctionLength: number;
  dependenciesCount: number;
  externalDependenciesCount: number;
  internalDependenciesCount: number;
  maintainabilityScore: number;
  healthScore: number;
  scoreBreakdown: {
    complexity: number;
    maintainability: number;
    structure: number;
    quality: number;
    security: number;
    documentation: number;
  };
  functions: FunctionAnalysis[];
  classes: ClassAnalysis[];
  imports: ImportAnalysis[];
}

export interface StructureNode {
  id: string;
  label: string;
  type: 'file' | 'module' | 'class' | 'function' | 'import';
  line?: number;
  metrics?: {
    complexity?: number;
    loc?: number;
    params?: number;
  };
  group: string;
}

export interface StructureLink {
  source: string;
  target: string;
  relationship: 'imports' | 'defines' | 'calls' | 'extends' | 'contains';
}

export interface PulseMapData {
  nodes: StructureNode[];
  links: StructureLink[];
}

export interface AnalysisResult {
  language: SupportedLanguage;
  languageName: string;
  depth: AnalysisDepth;
  metrics: CodeMetrics;
  smells: CodeSmell[];
  pulseMap: PulseMapData;
  timestamp: number;
  vulnerabilities?: VulnerabilityItem[];
  agentReview?: any;
  summary: {
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    healthLevel: 'Optimal' | 'Stable' | 'Needs Attention' | 'Critical Risk';
  };
}

export type CodeAnalysis = AnalysisResult;

export type ThemeMode = 'dark' | 'light' | 'system';

export type KnowledgeLevel = 'beginner' | 'intermediate' | 'expert';

export interface QuestionnaireScores {
  programming_score: number;
  code_reading_score: number;
  debugging_score: number;
  cs_concepts_score: number;
  architecture_score: number;
  total_score: number;
  completed_at: number;
  recommended_level: KnowledgeLevel;
}

export interface UserPersonalizationPreferences {
  explanation_depth: number; // 1 to 5
  show_examples: boolean;
  show_explanations: boolean;
  show_recommendations: boolean;
  show_diagrams: boolean;
  learning_mode: boolean;
}

export interface SkillDimensionScores {
  programming: number; // 1-5
  code_comprehension: number; // 1-5
  debugging: number; // 1-5
  cs_concepts: number; // 1-5
  architecture: number; // 1-5
  security: number; // 1-5
  dependencies: number; // 1-5
}

// ----------------------------------------------------
// DEVELOPER LEARNING & SKILL INTELLIGENCE
// ----------------------------------------------------
export type SkillDomain =
  | 'PROGRAMMING'
  | 'DEBUGGING'
  | 'CODE QUALITY'
  | 'SECURITY'
  | 'TESTING'
  | 'ARCHITECTURE'
  | 'DEPENDENCIES'
  | 'PERFORMANCE'
  | 'MAINTAINABILITY'
  | 'DEVOPS / CI';

export type SkillLevelStage = 'Developing' | 'Improving' | 'Strong' | 'Needs Attention';

export type SkillMasteryStage =
  | 'NOT_STARTED'
  | 'EXPLORING'
  | 'PRACTICING'
  | 'APPLIED'
  | 'CONSISTENT';

export interface DeveloperSkill {
  skillId: string;
  userId?: string;
  domain: SkillDomain;
  level: number; // 1-5 scale
  stage: SkillLevelStage;
  confidence: 'Initial Estimate' | 'Medium' | 'High' | 'Validated';
  evidenceCount: number;
  improvedCount: number;
  regressionCount: number;
  lastUpdated: number;
  evidenceSnippets?: string[];
  historicalTrend?: 'Improving' | 'Stable' | 'Needs Attention';
}

export type LearningEventType =
  | 'FINDING_ENCOUNTERED'
  | 'EXPLANATION_VIEWED'
  | 'LESSON_STARTED'
  | 'LESSON_COMPLETED'
  | 'PRACTICE_STARTED'
  | 'PRACTICE_PASSED'
  | 'PRACTICE_FAILED'
  | 'FIX_APPLIED'
  | 'FIX_VERIFIED'
  | 'REGRESSION_DETECTED';

export interface LearningEvent {
  id: string;
  userId?: string;
  projectId: string;
  skillDomain: SkillDomain;
  eventType: LearningEventType;
  relatedFindingId?: string;
  relatedFile?: string;
  result?: string;
  timestamp: number;
  details?: string;
}

export interface LearningConcept {
  id: string;
  domain: SkillDomain;
  title: string;
  summary: string;
  whyItMatters: string;
  beginnerExplanation: string;
  intermediateExplanation: string;
  expertExplanation: string;
  badCodeExample: string;
  goodCodeExample: string;
  practiceQuestions: Array<{
    id: string;
    question: string;
    codeSnippet?: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
  relatedFindingCategories: string[];
  relatedSmellTypes?: string[];
}

export interface LearningGoal {
  id: string;
  domain: SkillDomain;
  title: string;
  target: string;
  progress: number; // 0-100
  createdAt: number;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
}

export interface LearningRecommendation {
  conceptId: string;
  conceptTitle: string;
  domain: SkillDomain;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  findingCount: number;
  relatedFindingId?: string;
  estimatedMinutes: number;
  currentSkillStage: SkillLevelStage;
}

export interface UserPersonalizationProfile {
  user_id?: string;
  knowledge_level: KnowledgeLevel; // the active, user-controlled level
  questionnaire?: QuestionnaireScores;
  preferences: UserPersonalizationPreferences;
  skill_dimensions: SkillDimensionScores;
  settings: {
    manually_selected_level: boolean; // true if user overrode questionnaire recommendation
  };
  learning_progress?: {
    completed_units: string[];
    current_language?: string;
    skill_progress?: Record<string, number>;
  };
}

export interface AccessibilitySettings {
  fontSize: 'small' | 'default' | 'large' | 'xl';
  highContrast: boolean;
  reduceMotion: boolean;
  editorFontSize: number;
  editorWordWrap: boolean;
  editorTabSize: number;
  learningLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface PresetProject {
  id: string;
  title: string;
  language: SupportedLanguage;
  category: 'Beginner' | 'OOP' | 'High Complexity' | 'Code Smells' | 'Dependencies';
  description: string;
  code: string;
}

export type AIActionType =
  | 'explain'
  | 'problems'
  | 'improve'
  | 'optimize'
  | 'complexity'
  | 'error'
  | 'doc'
  | 'tests'
  | 'learn'
  | 'chat'
  | 'agent_review'
  | 'analogy'
  | 'step_by_step'
  | 'debug_coach'
  | 'hint'
  | 'concept'
  | 'practice';

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  actionType?: AIActionType;
  timestamp: number;
  diffBefore?: string;
  diffAfter?: string;
  isError?: boolean;
  retryAction?: {
    action: AIActionType;
    question?: string;
  };
}

// ----------------------------------------------------
// Agentic Review & Program Understanding Types
// ----------------------------------------------------

export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type FindingPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type ActionRecommendation = 'FIX_NOW' | 'REVIEW' | 'MONITOR' | 'DEFER' | 'INFORMATIONAL';

export type FindingStatus =
  | 'OPEN'
  | 'IN_REVIEW'
  | 'ACCEPTED'
  | 'FALSE_POSITIVE'
  | 'DEFERRED'
  | 'FIXED'
  | 'VERIFIED';

export type ActionFindingCategory =
  | 'SECURITY'
  | 'QUALITY'
  | 'ARCHITECTURE'
  | 'DEPENDENCY'
  | 'PERFORMANCE'
  | 'TESTING'
  | 'MAINTAINABILITY'
  | 'DOCUMENTATION';

export type FindingSource =
  | 'STATIC_ANALYZER'
  | 'AST_ANALYZER'
  | 'SECURITY_SCANNER'
  | 'DEPENDENCY_SCANNER'
  | 'ARCHITECTURE_ANALYZER'
  | 'CALL_GRAPH'
  | 'IMPORT_GRAPH'
  | 'GIT_DIFF'
  | 'AI_REVIEW'
  | 'TEST_ANALYZER';

export type FalsePositiveReason =
  | 'Intentional behavior'
  | 'Framework behavior'
  | 'Not applicable'
  | 'Analyzer mistake'
  | 'Other';

export type EvidenceType =
  | 'CODE_LOCATION'
  | 'DATA_FLOW'
  | 'CALL_PATH'
  | 'DEPENDENCY_PATH'
  | 'IMPORT_PATH'
  | 'AST_PATTERN'
  | 'CONFIGURATION'
  | 'TEST_REFERENCE'
  | 'GIT_CHANGE'
  | 'ARCHITECTURE_RELATIONSHIP'
  | 'ANALYZER_RULE'
  | 'AI_REASONING';

export interface ActionFindingEvidence {
  id?: string;
  findingId?: string;
  type?: EvidenceType;
  file: string;
  line: number;
  lineEnd?: number;
  columnStart?: number;
  columnEnd?: number;
  symbol?: string;
  description?: string;
  codeLocation?: string;
  dependencyPath?: string;
  callPath?: string[];
  dataFlow?: string[];
  detectionRule?: string;
  analyzerSource: FindingSource;
  confidenceScore?: number; // 0-100
  confidenceType?: 'DETERMINISTIC' | 'HIGH_CONFIDENCE' | 'AI_ASSISTED' | 'HEURISTIC';
  metadata?: Record<string, any>;
}

// ----------------------------------------------------
// Evidence Graph, Root Cause & Blast Radius Types
// ----------------------------------------------------

export type EvidenceNodeType =
  | 'FILE'
  | 'FUNCTION'
  | 'CLASS'
  | 'VARIABLE'
  | 'API_ENDPOINT'
  | 'DATABASE'
  | 'DEPENDENCY'
  | 'TEST'
  | 'TEST_SUITE'
  | 'TEST_CASE'
  | 'TEST_ASSERTION'
  | 'CONFIGURATION'
  | 'FINDING';

export type EvidenceEdgeType =
  | 'CALLS'
  | 'IMPORTS'
  | 'DEPENDS_ON'
  | 'READS'
  | 'WRITES'
  | 'FLOWS_TO'
  | 'USES'
  | 'TESTS'
  | 'COVERS'
  | 'ASSERTS'
  | 'EXERCISES'
  | 'AFFECTS'
  | 'RELATED_TO'
  | 'CAUSES';

export interface EvidenceGraphNode {
  id: string;
  label: string;
  type: EvidenceNodeType;
  file?: string;
  line?: number;
  symbol?: string;
  isTarget?: boolean;
  confidence?: number;
  confidenceType?: 'DETERMINISTIC' | 'HIGH_CONFIDENCE' | 'AI_ASSISTED';
  metadata?: Record<string, any>;
}

export interface EvidenceGraphEdge {
  source: string;
  target: string;
  relationship: EvidenceEdgeType;
  label?: string;
  confidence?: number;
  confidenceType?: 'DETERMINISTIC' | 'HIGH_CONFIDENCE' | 'AI_ASSISTED';
  isDirect?: boolean;
}

export interface EvidenceGraph {
  nodes: EvidenceGraphNode[];
  edges: EvidenceGraphEdge[];
  timestamp?: number;
}

export type RootCauseRelationshipType =
  | 'ROOT_CAUSE'
  | 'DOWNSTREAM'
  | 'RELATED'
  | 'DUPLICATE'
  | 'BLOCKS'
  | 'AFFECTS'
  | 'DERIVED_FROM'
  | 'CONTRIBUTES_TO';

export type RootCauseDetectionMethod =
  | 'STATIC_ANALYSIS'
  | 'DEPENDENCY_GRAPH'
  | 'CALL_GRAPH'
  | 'DATA_FLOW'
  | 'ARCHITECTURE_ANALYSIS'
  | 'HEURISTIC'
  | 'AI_ASSISTED';

export type RootCauseConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface RootCauseItem {
  id: string;
  findingId: string;
  rootCauseFindingId?: string;
  likelySource: string;
  symbol?: string;
  file?: string;
  line?: number;
  explanation: string;
  confidence: RootCauseConfidence;
  confidenceScore: number;
  relationshipType: RootCauseRelationshipType;
  detectionMethod?: RootCauseDetectionMethod;
  evidenceSummary: string[];
  relatedFindingIds: string[];
  affectedFindings?: string[];
  causeChain: string[];
  resolvableImpact: {
    findingsCount: number;
    modulesCount: number;
    warningsCount: number;
  };
}

export type ImpactRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';

export interface ImpactAnalysis {
  target: string;
  targetType: 'FILE' | 'FUNCTION' | 'CLASS' | 'MODULE' | 'DEPENDENCY';
  riskLevel: ImpactRiskLevel;
  confidence: number;
  directDependents: string[];
  indirectDependents: string[];
  affectedFiles: string[];
  affectedModules: string[];
  affectedSymbols?: string[];
  affectedTests: string[];
  affectedEndpoints?: string[];
  affectedDependencies?: string[];
  relatedFindings: string[];
  depth: number;
  reasoning: string;
  graph?: EvidenceGraph;
  isPublicApi?: boolean;
  publicApiConsumersCount?: number;
  isSecuritySensitive?: boolean;
  securitySensitivityReason?: string;
  impactConfidenceRating?: 'HIGH' | 'MEDIUM' | 'LOW' | 'PARTIAL' | 'UNAVAILABLE';
  callGraphStatus?: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
  testStatus?: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
  workspaceVersion?: string;
}

export interface ActionFinding {
  id: string;
  title: string;
  type: string;
  category: ActionFindingCategory;
  severity: FindingSeverity;
  confidence: number; // 0 to 100
  confidenceType?: 'DETERMINISTIC' | 'HIGH_CONFIDENCE' | 'AI_ASSISTED' | 'HEURISTIC';
  priority: FindingPriority;
  priorityScore: number; // 0 - 100 calculated
  recommendedAction: ActionRecommendation;
  file: string;
  line: number;
  column?: number;
  endLine?: number;
  codeSnippet?: string;
  message: string;
  description: string;
  whyItMatters?: string;
  evidence: ActionFindingEvidence[];
  relatedFiles?: string[];
  relatedFindings?: string[];
  sources: FindingSource[];
  analysisEngine: string;
  status: FindingStatus;
  statusFeedback?: {
    reason?: FalsePositiveReason;
    notes?: string;
    updatedAt: number;
  };
  createdAt: number;
  suggestedFix?: string;
  symbol?: string;
}

export type FindingCategory =
  | 'CORRECTNESS'
  | 'REGRESSION'
  | 'SECURITY'
  | 'PERFORMANCE'
  | 'ARCHITECTURE'
  | 'MAINTAINABILITY'
  | 'TESTING';

export interface AgentFinding {
  id: string;
  severity: FindingSeverity;
  category: FindingCategory;
  confidence: number; // 0.00 to 1.00
  file: string;
  line: number;
  symbol?: string;
  title: string;
  description: string;
  impact: string;
  root_cause: string;
  evidence: string[];
  suggested_fix: string;
  requires_human_review: boolean;
  status?: 'open' | 'accepted' | 'resolved' | 'dismissed';
}

export interface ModifiedRange {
  start: number;
  end: number;
}

export interface GitDiffFile {
  file: string;
  oldFile?: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed';
  language: SupportedLanguage;
  addedLines: number[];
  deletedLines: number[];
  modifiedRanges: ModifiedRange[];
  rawDiff: string;
  oldContent?: string;
  newContent?: string;
}

export interface GitDiffResult {
  commitId?: string;
  branch?: string;
  baseBranch?: string;
  files: GitDiffFile[];
  totalAdded: number;
  totalDeleted: number;
  totalModified: number;
  summary: string;
}

export type SymbolType =
  | 'function'
  | 'method'
  | 'class'
  | 'interface'
  | 'variable'
  | 'import'
  | 'endpoint'
  | 'decorator';

export interface ParameterInfo {
  name: string;
  type?: string;
  defaultValue?: string;
  isRequired: boolean;
}

export interface ProgramSymbol {
  id: string;
  file: string;
  language: SupportedLanguage;
  symbolType: SymbolType;
  name: string;
  qualifiedName: string;
  startLine: number;
  endLine: number;
  parameters: ParameterInfo[];
  returnType?: string;
  parentClass?: string;
  isAsync?: boolean;
  isPublic?: boolean;
  decorators?: string[];
  imports: string[];
  calls: string[];
  calledBy: string[];
  docstring?: string;
}

export interface ContractInfo {
  symbolId: string;
  name: string;
  file: string;
  parameters: ParameterInfo[];
  returnType?: string;
  isPublic: boolean;
  signatureString: string;
}

export interface ContractDiff {
  symbolId: string;
  name: string;
  file: string;
  isBreaking: boolean;
  type: 'parameter_added' | 'parameter_removed' | 'parameter_type_changed' | 'return_type_changed' | 'signature_modified' | 'visibility_changed';
  description: string;
  oldContract: ContractInfo;
  newContract: ContractInfo;
  affectedCallSites: CallSite[];
}

export interface CallSite {
  file: string;
  line: number;
  callerSymbol: string;
  calleeSymbol: string;
  codeSnippet: string;
  isCompatible: boolean;
  reason?: string;
}

export interface CallGraphNode {
  id: string;
  name: string;
  file: string;
  type: SymbolType;
  language: SupportedLanguage;
  metrics?: {
    complexity?: number;
    loc?: number;
  };
}

export interface CallGraphEdge {
  source: string;
  target: string;
  callSiteLine?: number;
  isIndirect?: boolean;
}

export interface CallGraphResult {
  nodes: CallGraphNode[];
  edges: CallGraphEdge[];
}

export interface ImpactResult {
  impactScore: number; // 0 - 100
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  directImpactCount: number;
  indirectImpactCount: number;
  affectedSymbols: string[];
  affectedFiles: string[];
  affectedCallSites: CallSite[];
  affectedDependencies: string[];
  affectedEndpoints: string[];
  affectedTests: string[];
  isPublicApiImpacted: boolean;
  breakdown: {
    direct: number;
    callers: number;
    dependencies: number;
    api: number;
    tests: number;
    database: number;
  };
}

export interface VulnerabilityItem {
  id: string;
  package: string;
  installedVersion: string;
  vulnerableRange: string;
  fixedVersion: string;
  severity: FindingSeverity;
  cvssScore: number;
  cveId: string;
  title: string;
  description: string;
  advisoryUrl: string;
  isTransitive: boolean;
  isUsedInModifiedCode: boolean;
  usageLocation?: {
    file: string;
    line: number;
    symbol: string;
  };
}

export interface VulnerabilityScanResult {
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  vulnerabilities: VulnerabilityItem[];
  scannedManifests: string[];
}

export interface RAGDocument {
  id: string;
  title: string;
  category: 'architecture' | 'api' | 'security' | 'standards' | 'tests' | 'dependencies';
  content: string;
  tags: string[];
  relevanceScore?: number;
  filePath?: string;
}

export interface ClarificationOption {
  id: string;
  label: string;
  description?: string;
  targetSymbol?: string;
  targetFile?: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  options: ClarificationOption[];
  selectedOption?: string;
  originalQuery?: string;
  category?: 'SYMBOL_SELECTION' | 'FILE_SELECTION' | 'INTENT_CONFIRMATION';
}

export interface PipelineStepStatus {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  durationMs?: number;
  detail?: string;
}

export interface AgentReviewResult {
  id: string;
  timestamp: number;
  diff: GitDiffResult;
  riskScore: number; // 0 - 100
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  impact: ImpactResult;
  symbols: ProgramSymbol[];
  contractDiffs: ContractDiff[];
  callGraph: CallGraphResult;
  vulnerabilities: VulnerabilityScanResult;
  ragContext: RAGDocument[];
  findings: AgentFinding[];
  steps: PipelineStepStatus[];
  summary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    infoCount: number;
    totalFindings: number;
    changedFilesCount: number;
    affectedSymbolsCount: number;
    breakingContractCount: number;
  };
  aiExecutiveSummary: string;
  durationMs: number;
}

export interface ReviewHistoryItem {
  id: string;
  title: string;
  timestamp: number;
  commitId: string;
  riskScore: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  findingsCount: number;
  resolvedCount: number;
  changedFiles: number;
  summary: string;
}

export interface SQLTableColumn {
  name: string;
  type: string;
  isPrimary?: boolean;
  description: string;
}

export interface SQLTableSchema {
  name: string;
  description: string;
  columns: SQLTableColumn[];
  rowCount?: number;
}

export interface SQLQueryResult {
  query: string;
  isValid: boolean;
  error?: string;
  executionTimeMs: number;
  rows: Record<string, any>[];
  columns: string[];
  explanation?: string;
}

export type RepositoryQueryIntent =
  | 'CODE_LOCATION'
  | 'CALLERS'
  | 'CALLEES'
  | 'DEPENDENCIES'
  | 'DEPENDENTS'
  | 'DATA_FLOW'
  | 'DATABASE_USAGE'
  | 'AUTHENTICATION'
  | 'SECURITY'
  | 'VULNERABILITY'
  | 'FINDING_EXPLANATION'
  | 'ROOT_CAUSE'
  | 'CHANGE_IMPACT'
  | 'TEST_COVERAGE'
  | 'TEST_DISCOVERY'
  | 'TEST_GAP_ANALYSIS'
  | 'TEST_GENERATION'
  | 'REGRESSION_CHECK'
  | 'ARCHITECTURE'
  | 'FILE_RELATIONSHIP'
  | 'PROJECT_OVERVIEW'
  | 'CODE_EXPLANATION'
  | 'SEARCH'
  | 'UNKNOWN';

export interface CodeCitation {
  file: string;
  line?: number;
  endLine?: number;
  symbol?: string;
  snippet?: string;
  description?: string;
}

export interface AskResult {
  id: string;
  query: string;
  intent: RepositoryQueryIntent;
  targetSymbol?: string;
  targetFile?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  confidenceScore: number; // 0 - 100
  summary: string;
  groundedAnswer: string;
  evidence: string[];
  citations: CodeCitation[];
  clarification?: ClarificationQuestion;
  relatedGraph?: EvidenceGraph;
  impactAnalysis?: ImpactAnalysis;
  rootCause?: RootCauseItem;
  suggestedFollowUps?: string[];
  requiresHumanReview?: boolean;
  timestamp: number;
  developerLevel?: 'beginner' | 'intermediate' | 'expert';
}

export interface CodebaseQueryContext {
  activeFile?: string;
  activeLanguage?: SupportedLanguage;
  activeCode?: string;
  activeSymbol?: string;
  activeFindingId?: string;
  developerLevel?: 'beginner' | 'intermediate' | 'expert';
  explanationDepth?: number;
}

// ==========================================
// SYMBOL RESOLUTION & DISAMBIGUATION TYPES
// ==========================================

export interface SymbolCandidate {
  id: string;
  name: string;
  type: SymbolType;
  file: string;
  startLine: number;
  endLine: number;
  snippet?: string;
  description?: string;
  matchScore: number;
  matchReason: string;
}

export interface SymbolResolutionResult {
  queryTerm: string;
  matchedSymbol?: SymbolCandidate;
  candidates: SymbolCandidate[];
  isAmbiguous: boolean;
  clarificationQuestion?: ClarificationQuestion;
}

// ==========================================
// AGENTIC REMEDIATION & VERIFICATION TYPES
// ==========================================

export type FixWorkflowState =
  | 'PROPOSED'
  | 'APPROVED'
  | 'APPLIED'
  | 'VERIFYING'
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'FAILED'
  | 'ROLLED_BACK'
  | 'REJECTED';

export type FixabilityStatus =
  | 'AUTO_FIX_SUPPORTED'
  | 'ASSISTED_FIX'
  | 'MANUAL_FIX_REQUIRED'
  | 'UNSAFE_TO_AUTOMATE'
  | 'INSUFFICIENT_CONTEXT'
  | 'FIXABLE'
  | 'PARTIALLY_FIXABLE'
  | 'REQUIRES_MANUAL_ACTION'
  | 'NOT_FIXABLE'
  | 'UNKNOWN';

export interface FixPlanStep {
  stepNumber: number;
  action: string;
  targetFile: string;
  targetSymbol?: string;
  description: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface FixPlan {
  id: string;
  findingId: string;
  objective: string;
  rootCauseSummary: string;
  fixability: FixabilityStatus;
  fixabilityReason: string;
  filesToModify: string[];
  filesToCreate: string[];
  filesToDelete: string[];
  steps: FixPlanStep[];
  risks: string[];
  testsToRun: string[];
  securityChecks: string[];
  estimatedImpact: {
    riskLevel: ImpactRiskLevel;
    affectedFilesCount: number;
    affectedModulesCount: number;
    breakingChangeRisk: boolean;
  };
  manualGuidance?: string;
  createdAt: number;
}

export interface PatchHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

export interface PatchFile {
  filePath: string;
  oldContent?: string;
  newContent: string;
  rawDiff: string;
  hunks: PatchHunk[];
  additions: number;
  deletions: number;
}

export interface UnifiedPatch {
  id: string;
  planId: string;
  findingId: string;
  files: PatchFile[];
  totalAdditions: number;
  totalDeletions: number;
  rawUnifiedDiff: string;
  generatedAt: number;
  isMultiFile: boolean;
  scopeSize: 'small' | 'moderate' | 'large';
  redactedSecretsFound: number;
}

export interface PatchValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  filesTargeted: string[];
  filesExisting: string[];
  protectedFilesDetected: string[];
  secretsDetected: string[];
  scopeWithinPlan: boolean;
}

export interface TestExecutionItem {
  id: string;
  name: string;
  suite: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  durationMs: number;
  errorMessage?: string;
  stackTrace?: string;
}

export interface TestVerificationResult {
  status: 'PASS' | 'FAIL' | 'UNAVAILABLE';
  testsDiscovered: number;
  testsExecuted: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  totalDurationMs: number;
  testItems: TestExecutionItem[];
  outputLog?: string;
}

export interface SecurityVerificationResult {
  status: 'PASS' | 'FAIL' | 'WARNING';
  originalVulnerabilityResolved: boolean;
  originalFindingSeverity: FindingSeverity;
  newVulnerabilitiesDetected: number;
  remainingSecurityFindings: number;
  scannedFiles: string[];
  notes: string;
}

export interface RegressionCheckResult {
  hasRegression: boolean;
  regressionCount: number;
  newErrors: string[];
  newSmellsCount: number;
  complexityChange: {
    before: number;
    after: number;
    delta: number;
  };
  maintainabilityChange: {
    before: number;
    after: number;
    delta: number;
  };
  notes: string;
}

export type VerificationStageStatus =
  | 'PASSED'
  | 'FAILED'
  | 'SKIPPED'
  | 'SIMULATED'
  | 'NOT_AVAILABLE'
  | 'BLOCKED'
  | 'NOT_RUN';

export type VerificationOverallStatus =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'FAILED'
  | 'NOT_VERIFIED'
  | 'BLOCKED';

export type VerificationState =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'FAILED'
  | 'NOT_VERIFIED'
  | 'BLOCKED'
  | 'REJECTED';

export interface StructuredFixExplanation {
  whyNeeded: string;
  whatChanges: string;
  whyThisApproach: string;
  potentialSideEffects: string;
  howVerified: string;
}

export interface VerificationStageResult {
  id: string;
  name: string;
  type: 'STATIC_VALIDATION' | 'RUNTIME_TESTS' | 'SECURITY_SCAN' | 'RE_ANALYSIS' | 'REGRESSION_CHECK';
  status: VerificationStageStatus;
  isSimulated: boolean;
  durationMs: number;
  summary: string;
  logs: string[];
  evidence: Record<string, any>;
  errors: string[];
  warnings: string[];
}

export interface BeforeAfterAnalysisComparison {
  originalFinding: {
    id: string;
    title: string;
    severity: FindingSeverity;
    line?: number;
    resolved: boolean;
    statusBefore: string;
    statusAfter: string;
  };
  complexity: {
    before: number;
    after: number;
    delta: number;
  };
  maintainability: {
    before: number;
    after: number;
    delta: number;
  };
  smellsCount: {
    before: number;
    after: number;
    delta: number;
  };
  securityIssues: {
    before: number;
    after: number;
    delta: number;
    newIssues: string[];
  };
  syntaxErrors: {
    before: number;
    after: number;
    newErrors: string[];
  };
}

export interface VerificationDecision {
  overallStatus: VerificationOverallStatus;
  isAcceptable: boolean;
  canMarkAsFixed: boolean;
  primaryReason: string;
  failedStages: string[];
  hasRegressions: boolean;
  requiresRetryOrRollback: boolean;
}

export interface ComprehensiveVerificationReport {
  id: string;
  findingId: string;
  checkpointId: string | null;
  overallStatus: VerificationOverallStatus;
  workspaceMode?: WorkspaceMode;
  isSimulated: boolean;
  stages: VerificationStageResult[];
  decision: VerificationDecision;
  beforeAfter: BeforeAfterAnalysisComparison;
  testResult: TestVerificationResult;
  securityResult: SecurityVerificationResult;
  regressionResult: RegressionCheckResult;
  startedAt: number;
  completedAt: number;
  totalDurationMs: number;
  rollbackAvailable: boolean;
}

// ----------------------------------------------------
// REAL & VIRTUAL PROJECT WORKSPACE TYPES
// ----------------------------------------------------
export type WorkspaceMode = 'REAL' | 'VIRTUAL';

export type WorkspacePermissionState =
  | 'NOT_CONNECTED'
  | 'CONNECTED'
  | 'READ_ONLY'
  | 'READ_WRITE'
  | 'PERMISSION_REQUIRED'
  | 'UNAVAILABLE';

export type ProjectFileStatus =
  | 'UNCHANGED'
  | 'MODIFIED'
  | 'ADDED'
  | 'DELETED'
  | 'RENAMED';

export interface ProjectFile {
  path: string;
  relativePath: string;
  language: SupportedLanguage;
  size: number;
  content: string;
  hash: string;
  modified: number;
  status: ProjectFileStatus;
  isProtected?: boolean;
  isTooLarge?: boolean;
}

export interface ProjectWorkspace {
  id: string;
  name: string;
  rootPath: string;
  language: SupportedLanguage;
  files: ProjectFile[];
  workspaceMode: WorkspaceMode;
  permissionState: WorkspacePermissionState;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceCheckpoint {
  id: string;
  timestamp: number;
  projectId: string;
  repository?: string;
  affectedFiles: string[];
  beforeHashes: Record<string, string>;
  beforeContents: Record<string, string>;
  patchId?: string;
  findingId?: string;
  fixPlan?: FixPlan;
  status?: 'CREATED' | 'APPLIED' | 'VERIFIED' | 'ROLLED_BACK' | 'FAILED';
  description: string;
}

export type FileOperationType =
  | 'CREATE'
  | 'READ'
  | 'WRITE'
  | 'DELETE'
  | 'RENAME'
  | 'MOVE'
  | 'RESTORE'
  | 'PATCH_APPLIED'
  | 'ROLLBACK';

export interface FileOperationLogEntry {
  id: string;
  timestamp: number;
  operation: FileOperationType;
  filePath: string;
  result: 'SUCCESS' | 'BLOCKED' | 'FAILED';
  reason?: string;
  fixId?: string;
  checkpointId?: string;
  workspaceMode: WorkspaceMode;
}

export interface WorkspaceSnapshot {
  id: string;
  timestamp: number;
  files: Record<string, { content: string; hash: string; size: number; language: SupportedLanguage }>;
}

export type RemediationStepPhase =
  | 'IDLE'
  | 'PREPARING_CONTEXT'
  | 'PLANNING_FIX'
  | 'GENERATING_PATCH'
  | 'VALIDATING_PATCH'
  | 'CREATING_CHECKPOINT'
  | 'APPLYING_PATCH'
  | 'RUNNING_BUILD'
  | 'RUNNING_TESTS'
  | 'SECURITY_SCAN'
  | 'RE_ANALYZING'
  | 'CHECKING_REGRESSIONS'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED';

export interface RemediationAuditRecord {
  id: string;
  findingId: string;
  findingTitle: string;
  findingCategory: ActionFindingCategory;
  findingSeverity: FindingSeverity;
  timestamp: number;
  plan: FixPlan;
  patch: UnifiedPatch;
  validation: PatchValidationResult;
  testResults: TestVerificationResult;
  securityResults: SecurityVerificationResult;
  regressionResults: RegressionCheckResult;
  verificationState: VerificationState;
  finalStatus: 'APPLIED' | 'VERIFIED' | 'REVERTED' | 'REJECTED' | 'FAILED';
  userFeedback?: {
    isUseful: boolean;
    feedbackText?: string;
    submittedAt: number;
  };
  checkpointSnapshot?: {
    fileName: string;
    originalContent: string;
    timestamp: number;
  };
}

// ==========================================
// TEST INTELLIGENCE, COVERAGE & REGRESSION TYPES
// ==========================================

export type TestFrameworkType =
  | 'jest'
  | 'vitest'
  | 'mocha'
  | 'jasmine'
  | 'pytest'
  | 'unittest'
  | 'nose'
  | 'junit'
  | 'testng'
  | 'cargo_test'
  | 'go_test'
  | 'unknown';

export interface TestFrameworkInfo {
  name: string;
  type: TestFrameworkType;
  language: SupportedLanguage;
  configFile?: string;
  runnerCommand?: string;
  isDetected: boolean;
  testFilePattern: string;
  syntaxStyle: 'bdd' | 'unittest' | 'assert' | 'annotation';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DiscoveredTestCase {
  id: string;
  name: string;
  suite: string;
  file: string;
  line: number;
  targetSymbol?: string;
  targetFile?: string;
  assertionsCount: number;
  isAsync: boolean;
  testType: 'unit' | 'integration' | 'security' | 'regression' | 'boundary';
  exercisesSymbols: string[];
}

export interface ChangedCodeCoverage {
  totalChangedLines: number;
  coveredChangedLines: number;
  uncoveredChangedLines: number;
  percentage: number;
  isAvailable: boolean;
  uncoveredLineRanges?: Array<{ start: number; end: number }>;
}

export interface MultiDimensionCoverage {
  lines: number;
  branches?: number;
  functions?: number;
  statements?: number;
  paths?: number;
  behaviors?: number;
  changedCodeCoverage?: ChangedCodeCoverage;
  isAvailable: boolean;
  unavailableReason?: string;
  testedFunctionsCount: number;
  totalFunctionsCount: number;
  untestedFunctions: string[];
}

export type TestCoverageTelemetry = MultiDimensionCoverage;

export type TestGapType =
  | 'UNTESTED_FUNCTION'
  | 'UNTESTED_BRANCH'
  | 'UNTESTED_EXCEPTION_PATH'
  | 'UNTESTED_AUTH_FAILURE'
  | 'UNTESTED_BOUNDARY'
  | 'UNTESTED_CHANGED_CODE';

export type TestGapPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface TestGapItem {
  id: string;
  targetSymbol: string;
  targetFile: string;
  line: number;
  gapType: TestGapType;
  priority: TestGapPriority;
  title: string;
  missingBehavior: string;
  whyItMatters: string;
  evidence: string[];
  suggestedTest: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  findingId?: string;
  isSecuritySensitive?: boolean;
}

export type TestQualityIssueType =
  | 'NO_REAL_ASSERTION'
  | 'DUPLICATE_TEST'
  | 'OVERLY_MOCKED'
  | 'UNREACHABLE_PATH'
  | 'INVALID_EXPECTATION'
  | 'LOW_INFORMATION_TEST';

export interface TestQualityIssue {
  type: TestQualityIssueType;
  description: string;
  recommendation: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export type CandidateTestType =
  | 'happy_path'
  | 'boundary'
  | 'error_handling'
  | 'security'
  | 'regression'
  | 'integration';

export interface CandidateTest {
  id: string;
  targetSymbol: string;
  targetFile: string;
  testFilePath: string;
  testType: CandidateTestType;
  title: string;
  rationale: string;
  testCode: string;
  rawDiff: string;
  additions: number;
  deletions: number;
  framework: TestFrameworkType;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  qualityIssues: TestQualityIssue[];
  isApproved: boolean;
  status: 'CANDIDATE' | 'APPROVED' | 'APPLIED' | 'REJECTED';
  safetyChecks: {
    compiles: boolean;
    validImports: boolean;
    noProductionModification: boolean;
    noProtectedFileModification: boolean;
    noExternalNetworkCalls: boolean;
    noDestructiveOperations: boolean;
    noSecretExposure: boolean;
  };
}

export type RegressionSeverity =
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'NONE_DETECTED'
  | 'UNKNOWN';

export interface RegressionBaseline {
  id: string;
  timestamp: number;
  testsPassed: number;
  testsFailed: number;
  coveragePercent?: number;
  securityFindingsCount: number;
  smellsCount: number;
  complexityScore: number;
  maintainabilityScore: number;
}

export interface RegressionAnalysisResult {
  regressionLevel: RegressionSeverity;
  hasRegression: boolean;
  baseline: RegressionBaseline;
  afterResult: {
    testsPassed: number;
    testsFailed: number;
    coveragePercent?: number;
    securityFindingsCount: number;
    smellsCount: number;
    complexityScore: number;
    maintainabilityScore: number;
  };
  failingTests: Array<{
    name: string;
    error: string;
    wasPassingBefore: boolean;
  }>;
  newSecurityFindings: string[];
  coverageDeltaPercent?: number;
  notes: string;
  evidence: string[];
}

export interface TestIntelligenceReport {
  framework: TestFrameworkInfo;
  discoveredTests: DiscoveredTestCase[];
  coverage: MultiDimensionCoverage;
  testGaps: TestGapItem[];
  candidateTests: CandidateTest[];
  regressionBaseline?: RegressionBaseline;
  recentRecords: TestRecord[];
  summary: {
    totalDiscoveredTests: number;
    relevantTestsCount: number;
    testGapsCount: number;
    criticalGapsCount: number;
    changedCodeCoveragePercent?: number;
    overallCoveragePercent?: number;
    regressionStatus: RegressionSeverity;
  };
}

export interface TestRecord {
  testId: string;
  target: string;
  generatedBy: 'AI_TEST_GENERATOR' | 'MANUAL' | 'AGENTIC_FIX';
  createdAt: number;
  framework: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  executionResult: TestExecutionItem;
  coverageImpact?: number;
  regressionResult?: RegressionSeverity;
}

// ----------------------------------------------------
// PROJECT MEMORY & CONTINUOUS PROJECT INTELLIGENCE TYPES
// ----------------------------------------------------
export type ProjectMemoryType =
  | 'PROJECT_RULE'
  | 'ARCHITECTURE_NOTE'
  | 'ARCHITECTURE_DECISION'
  | 'TECHNICAL_DEBT'
  | 'ACCEPTED_TECHNICAL_DEBT'
  | 'FALSE_POSITIVE'
  | 'ACCEPTED_RISK'
  | 'SECURITY_RULE'
  | 'SECURITY_DECISION'
  | 'TESTING_RULE'
  | 'TESTING_CONVENTION'
  | 'CODING_CONVENTION'
  | 'DEPENDENCY_DECISION'
  | 'DEVELOPER_DECISION'
  | 'DEVELOPER_PREFERENCE'
  | 'ANALYSIS_CONTEXT'
  | 'DOCUMENTATION'
  | 'FINDING_FEEDBACK';

export type ProjectMemorySource =
  | 'USER'
  | 'USER_CREATED'
  | 'DEVELOPER_FEEDBACK'
  | 'AUDIT'
  | 'CODE_ANALYSIS'
  | 'ANALYSIS'
  | 'GIT_HISTORY'
  | 'PROJECT_SETTINGS'
  | 'CI'
  | 'AGENTIC_REVIEW'
  | 'DOCUMENTATION'
  | 'AI_SUGGESTION'
  | 'SYSTEM';

export type ProjectMemoryConfidence =
  | 'CONFIRMED'
  | 'HIGH'
  | 'LIKELY'
  | 'MEDIUM'
  | 'SUGGESTED'
  | 'LOW'
  | 'UNKNOWN';

export type ProjectMemoryStatus =
  | 'ACTIVE'
  | 'APPROVED'
  | 'PROPOSED'
  | 'REJECTED'
  | 'CONFIRMED'
  | 'SUGGESTED'
  | 'SUPERSEDED'
  | 'DEPRECATED'
  | 'ARCHIVED'
  | 'DISMISSED';

export type ProjectMemoryScope =
  | 'PROJECT'
  | 'MODULE'
  | 'FILE'
  | 'SYMBOL'
  | 'FINDING'
  | 'USER';

export interface ProjectMemory {
  id?: string;
  projectId: string;
  memoryId: string;
  type: ProjectMemoryType;
  title: string;
  content: string;
  source: ProjectMemorySource;
  confidence: ProjectMemoryConfidence;
  status: ProjectMemoryStatus;
  scope: ProjectMemoryScope;
  isExplicit?: boolean;
  kind?: 'EXPLICIT' | 'INFERRED';
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  acceptedBy?: string;
  impact?: string;
  relatedFiles?: string[];
  relatedSymbols?: string[];
  relatedFindings?: string[];
  tags?: string[];
  // Specialized fields
  ruleId?: string;
  location?: string;
  reason?: string;
  developerExplanation?: string;
  reviewDate?: string; // e.g. "2027-01-01"
  owner?: string;
  decision?: string;
  rationale?: string;
  alternatives?: string[];
  affectedComponents?: string[];
  findingSnapshot?: {
    findingId: string;
    findingTitle: string;
    findingCategory: string;
    file: string;
    line: number;
  };
  history?: Array<{
    action: string;
    timestamp: number;
    actor: string;
    details?: string;
  }>;
  metadata?: Record<string, any>;
}

export interface ProjectMemoryFilter {
  type?: ProjectMemoryType | 'ALL';
  status?: ProjectMemoryStatus | 'ALL';
  scope?: ProjectMemoryScope | 'ALL';
  source?: ProjectMemorySource | 'ALL';
  confidence?: ProjectMemoryConfidence | 'ALL';
  kind?: 'EXPLICIT' | 'INFERRED' | 'ALL';
  searchQuery?: string;
  relatedFile?: string;
  relatedSymbol?: string;
}

export interface ArchitectureDecisionRecord {
  id: string;
  title: string;
  decision: string;
  rationale: string;
  alternatives: string[];
  affectedComponents: string[];
  status: 'ACTIVE' | 'SUPERSEDED' | 'DEPRECATED';
  createdAt: number;
  updatedAt: number;
}

// ----------------------------------------------------
// TEST INTELLIGENCE COVERAGE HEATMAP TYPES
// ----------------------------------------------------
export type HeatmapRiskQuadrant =
  | 'CRITICAL_DEFICIT' // High Risk (>=60), Low Coverage (<50%)
  | 'VULNERABLE_SPOT'  // High Risk (>=60), Moderate Coverage (50-79%)
  | 'UNDER_TESTED'     // Low/Med Risk (<60), Low Coverage (<50%)
  | 'WELL_HARDENED';   // Low/Med Risk (<60) or High Risk with High Coverage (>=80%)

export interface FileRiskCoverageMetric {
  file: string;
  shortName: string;
  linesOfCode: number;
  coveragePercentage: number;
  branchCoverage: number;
  functionCoverage: number;
  riskScore: number; // 0 - 100
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  quadrant: HeatmapRiskQuadrant;
  findingsCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  testGapsCount: number;
  untestedFunctions: string[];
  primaryRiskFactors: string[];
  framework: string;
  isCurrentFile?: boolean;
}

export interface HeatmapOverviewStats {
  totalFiles: number;
  criticalDeficitCount: number;
  vulnerableSpotCount: number;
  underTestedCount: number;
  wellHardenedCount: number;
  averageCoverage: number;
  averageRisk: number;
  totalTestGaps: number;
}

// ----------------------------------------------------
// TOAST NOTIFICATION SYSTEM
// ----------------------------------------------------
export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastNotification {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

// ----------------------------------------------------
// CODEBASE CONTEXT GRAPH & SYMBOL RELATIONSHIPS TYPES (PROMPT 29)
// ----------------------------------------------------

export type CodeNodeType =
  | 'REPOSITORY'
  | 'DIRECTORY'
  | 'FILE'
  | 'MODULE'
  | 'CLASS'
  | 'FUNCTION'
  | 'METHOD'
  | 'VARIABLE'
  | 'INTERFACE'
  | 'API_ENDPOINT'
  | 'TEST'
  | 'DEPENDENCY'
  | 'CONFIGURATION'
  | 'FINDING';

export type CodeRelationshipType =
  | 'IMPORTS'
  | 'EXPORTS'
  | 'CALLS'
  | 'INHERITS'
  | 'IMPLEMENTS'
  | 'CONTAINS'
  | 'DEPENDS_ON'
  | 'TESTS'
  | 'REFERENCES'
  | 'DEFINES'
  | 'USES'
  | 'EXPOSES'
  | 'ROUTES_TO'
  | 'AFFECTED_BY'
  | 'RELATED_TO';

export interface CodeNode {
  id: string; // Stable identifier: e.g. "repo/src/services/payment.py::PaymentService::processPayment::FUNCTION"
  type: CodeNodeType;
  name: string;
  qualifiedName: string;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  language: SupportedLanguage;
  metadata?: {
    isExported?: boolean;
    isAsync?: boolean;
    isPublic?: boolean;
    visibility?: 'public' | 'private' | 'protected';
    parameters?: string[];
    returnType?: string;
    complexity?: number;
    cognitiveComplexity?: number;
    loc?: number;
    docstring?: string;
    endpointMethod?: string;
    endpointPath?: string;
    dependencyVersion?: string;
    findingSeverity?: FindingSeverity;
    findingCategory?: ActionFindingCategory;
    testAssertionsCount?: number;
    isSecuritySensitive?: boolean;
    [key: string]: any;
  };
}

export interface CodeRelationship {
  id: string;
  source: string; // Source CodeNode id
  target: string; // Target CodeNode id
  type: CodeRelationshipType;
  line?: number;
  evidenceSnippet?: string;
  confidence: number; // 0 - 100
  isDeterministic: boolean;
  metadata?: Record<string, any>;
}

export interface CodebaseContextGraph {
  id: string;
  version: number;
  updatedAt: number;
  nodes: CodeNode[];
  edges: CodeRelationship[];
  fileMap: Record<string, string[]>; // filePath -> nodeIds
  symbolIndex: Record<string, string[]>; // symbol name (lowercase) -> nodeIds
  callGraph: {
    callers: Record<string, string[]>; // targetNodeId -> callerNodeIds[]
    callees: Record<string, string[]>; // sourceNodeId -> calleeNodeIds[]
  };
  dependencyGraph: {
    dependents: Record<string, string[]>; // package/module -> dependent nodeIds[]
    dependencies: Record<string, string[]>; // nodeId -> imported/required dependencyIds[]
  };
  testCoverageMap: Record<string, string[]>; // targetNodeId -> testNodeIds[]
  findingMap: Record<string, string[]>; // targetNodeId -> findingIds[]
}

export interface ContextPacket {
  question?: string;
  targetNodes: CodeNode[];
  relevantFiles: string[];
  symbols: CodeNode[];
  relationships: CodeRelationship[];
  findings: ActionFinding[];
  tests: DiscoveredTestCase[];
  dependencies: Array<{ name: string; version?: string; isVulnerable?: boolean; isExternal?: boolean }>;
  projectRules: Array<{ id: string; rule: string; source: string; confidence: string }>;
  projectMemory: ProjectMemory[];
  historicalContext?: {
    auditId?: string;
    previousFindingsCount?: number;
    changeSummary?: string;
    relationshipsChanged?: number;
  };
  evidence: string[];
}

export interface ContextQueryResult {
  targetNode?: CodeNode;
  callers: CodeNode[];
  callees: CodeNode[];
  imports: CodeNode[];
  dependents: CodeNode[];
  dependencies: CodeNode[];
  tests: CodeNode[];
  relatedFindings: ActionFinding[];
  securityPath?: {
    nodes: CodeNode[];
    explanation: string;
  };
  architectureContext?: {
    layer?: string;
    incomingCoupling: number;
    outgoingCoupling: number;
    isBoundary: boolean;
  };
  blastRadiusSummary: {
    affectedFilesCount: number;
    affectedSymbolsCount: number;
    affectedTestsCount: number;
    riskLevel: ImpactRiskLevel;
  };
}

export interface GraphDiffResult {
  addedNodes: CodeNode[];
  removedNodes: CodeNode[];
  addedRelationships: CodeRelationship[];
  removedRelationships: CodeRelationship[];
  changedArchitecturalBoundaries: Array<{
    node: string;
    change: string;
    previousTarget?: string;
    newTarget?: string;
  }>;
}

// ----------------------------------------------------
// 15-LANGUAGE DEEP ENGINEERING KNOWLEDGE SYSTEM TYPES
// ----------------------------------------------------

export type ErrorClassificationType =
  | 'SYNTAX'
  | 'TYPE'
  | 'COMPILE'
  | 'RUNTIME'
  | 'LOGIC'
  | 'MEMORY'
  | 'CONCURRENCY'
  | 'DEPENDENCY'
  | 'BUILD'
  | 'CONFIGURATION'
  | 'SECURITY'
  | 'PERFORMANCE'
  | 'DATABASE'
  | 'NETWORK'
  | 'TEST'
  | 'ENVIRONMENT'
  | 'FRAMEWORK'
  | 'TOOLING';

export type KnowledgeConfidenceLevel =
  | 'VERIFIED'
  | 'HIGH_CONFIDENCE'
  | 'LIKELY'
  | 'POSSIBLE'
  | 'UNKNOWN';

export interface LanguageSyntaxRules {
  statementDelimiters: string;
  blockScoping: string;
  casingConventions: {
    variables: string;
    functions: string;
    classes: string;
    constants: string;
  };
  comments: {
    singleLine: string;
    multiLine: string;
    docComment?: string;
  };
  keyRules: string[];
}

export interface LanguageTypeSystem {
  category: 'Static' | 'Dynamic' | 'Gradual' | 'Declarative';
  safety: 'Strong' | 'Weak' | 'Memory Safe' | 'Unsafe Capable';
  inference: boolean;
  typeCoercion: 'Implicit' | 'Explicit Only' | 'Strict';
  keyDetails: string[];
}

export interface LanguageExecutionModel {
  runtime: string;
  compilationTarget: 'Bytecode' | 'Native Machine Code' | 'Interpreted AST' | 'Transpiled' | 'Declarative Engine';
  modelType: string;
  details: string[];
}

export interface LanguageMemoryModel {
  management: 'Manual (malloc/free)' | 'Garbage Collected' | 'Ownership & Borrowing (RAII)' | 'Automatic Reference Counting (ARC)' | 'Engine Managed';
  stackVsHeap: string;
  garbageCollection?: string;
  pointersOrReferences: string;
  ownershipModel?: string;
  details: string[];
}

export interface LanguageConcurrencyModel {
  primitives: string[];
  threadingModel: string;
  asyncMechanism: string;
  pitfalls: string[];
}

export interface LanguageStandardLibrary {
  keyModules: Array<{
    name: string;
    purpose: string;
    popularUses?: string;
  }>;
}

export interface LanguagePackageManager {
  name: string;
  manifestFile: string;
  lockFile: string;
  installCommand: string;
  details: string;
}

export interface LanguageCommonErrorPattern {
  errorType: string;
  category: ErrorClassificationType;
  signatureOrPattern: string;
  cause: string;
  explanation: string;
  fixStrategy: string;
  preventionTip: string;
  badExample?: string;
  fixedExample?: string;
  learnConceptId?: string;
}

export interface LanguageSecurityPattern {
  vulnerability: string;
  cweOrClass: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  badCode: string;
  secureCode: string;
  remediation: string;
  learnConceptId?: string;
}

export interface LanguagePerformancePattern {
  topic: string;
  impact: 'High' | 'Medium' | 'Moderate';
  bottleneck: string;
  recommendation: string;
  goodPattern: string;
  badPattern: string;
}

export interface LanguageTestingPattern {
  popularFrameworks: string[];
  mockStrategies: string[];
  exampleSnippet: string;
}

export interface LanguageAntiPattern {
  name: string;
  whyItHarms: string;
  remedy: string;
  badCode?: string;
  goodCode?: string;
}

export interface LanguageIdiom {
  name: string;
  pattern: string;
  description: string;
  exampleSnippet: string;
}

export interface LanguageKnowledgeProfile {
  language: SupportedLanguage;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  fileExtensions: string[];
  paradigms: string[];
  syntaxRules: LanguageSyntaxRules;
  typeSystem: LanguageTypeSystem;
  executionModel: LanguageExecutionModel;
  memoryModel: LanguageMemoryModel;
  concurrencyModel: LanguageConcurrencyModel;
  standardLibrary: LanguageStandardLibrary;
  packageManager: LanguagePackageManager;
  buildTools: string[];
  compilerOrInterpreter: string;
  runtime: string;
  commonErrors: LanguageCommonErrorPattern[];
  debuggingStrategies: string[];
  securityPatterns: LanguageSecurityPattern[];
  performancePatterns: LanguagePerformancePattern[];
  testingPatterns: LanguageTestingPattern;
  architecturePatterns: string[];
  antiPatterns: LanguageAntiPattern[];
  idioms: LanguageIdiom[];
  bestPractices: Array<{ title: string; category: string; recommendation: string }>;
  interoperability: {
    withOtherLanguages: string[];
    ffiOrWasmOrApis: string;
  };
  versionInformation: {
    currentLTS: string;
    majorVersions: string[];
    notableChanges: string;
  };
  documentationReferences: Array<{
    title: string;
    url: string;
    category: string;
  }>;
}

export interface ErrorAnalysisInput {
  rawErrorText?: string;
  sourceCode?: string;
  fileName?: string;
  language?: SupportedLanguage;
  stackTrace?: string;
  terminalOutput?: string;
  compilerOutput?: string;
  buildOutput?: string;
  testOutput?: string;
  lineNumber?: number;
  columnNumber?: number;
}

export interface ErrorAnalysisResult {
  id: string;
  detectedLanguage: SupportedLanguage;
  errorName: string;
  errorCategory: ErrorClassificationType;
  location?: {
    file: string;
    line?: number;
    column?: number;
    functionOrClass?: string;
    offendingCodeSnippet?: string;
  };
  rootCause: string;
  whyItHappens: string;
  howToFix: string;
  howToPrevent: string;
  evidence: string[];
  proposedFixDiff?: {
    originalCode: string;
    fixedCode: string;
    hunkDiff: string;
    explanation: string;
  };
  verificationMethod: {
    type: 'COMPILER' | 'INTERPRETER' | 'TYPE_CHECKER' | 'LINTER' | 'UNIT_TESTS' | 'STATIC_ANALYSIS' | 'UNAVAILABLE';
    commandOrMethod: string;
    expectedOutcome: string;
  };
  confidence: KnowledgeConfidenceLevel;
  confidenceRationale: string;
  matchedKnowledgeProfile?: string;
  learnConceptLink?: {
    conceptId: string;
    conceptTitle: string;
    language: SupportedLanguage;
    summary: string;
  };
  crossLanguageContext?: {
    relatedFiles: string[];
    interactionPath: string;
  };
}

export interface DebuggingDiagnosis {
  id: string;
  language: SupportedLanguage;
  diagnosisSummary: string;
  rootCauseAnalysis: {
    primaryCause: string;
    contributingFactors: string[];
    mechanism: string;
  };
  evidenceChain: Array<{
    step: number;
    source: string;
    observation: string;
    relevance: string;
  }>;
  proposedFix: {
    summary: string;
    targetFile: string;
    targetLines: string;
    beforeCode: string;
    afterCode: string;
    diffSnippet: string;
    riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH';
    potentialSideEffects: string[];
  };
  verificationPlan: {
    immediateTest: string;
    regressionCheck: string;
    status: 'READY_TO_TEST' | 'REQUIRES_ENV' | 'VERIFIED';
  };
  learningGrowth: {
    concept: string;
    lesson: string;
    avoidanceRule: string;
  };
}

export interface CrossLanguageTrace {
  id: string;
  title: string;
  layers: Array<{
    language: SupportedLanguage;
    file: string;
    role: 'Frontend Client' | 'API Gateway' | 'Backend Service' | 'Database Query' | 'Worker Task' | 'Shared Schema';
    symbol?: string;
    snippet?: string;
    riskNote?: string;
  }>;
  dataFlowDescription: string;
  vulnerabilityVectors: string[];
}


