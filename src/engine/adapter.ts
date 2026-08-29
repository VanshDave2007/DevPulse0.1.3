import {
  AnalysisDepth,
  ClassAnalysis,
  CodeMetrics,
  CodeSmell,
  FunctionAnalysis,
  ImportAnalysis,
  PulseMapData,
  SupportedLanguage,
} from '../types';

export interface RawParseOutput {
  loc: number;
  sloc: number;
  commentLines: number;
  blankLines: number;
  functions: FunctionAnalysis[];
  classes: ClassAnalysis[];
  imports: ImportAnalysis[];
  rawCyclomatic: number;
  rawCognitive: number;
  maxNesting: number;
}

export interface LanguageAdapter {
  id: SupportedLanguage;
  displayName: string;
  depth: AnalysisDepth;
  canHandle(lang: SupportedLanguage): boolean;
  parse(code: string): RawParseOutput;
  detectSmells(code: string, parsed: RawParseOutput): CodeSmell[];
}
