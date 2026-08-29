import { AnalysisResult, SupportedLanguage } from '../types';
import { LanguageAdapter } from './adapter';
import { PythonAdapter } from './adapters/pythonAdapter';
import { JavaScriptAdapter } from './adapters/javascriptAdapter';
import { JavaAdapter } from './adapters/javaAdapter';
import { CFamilyAdapter } from './adapters/cFamilyAdapter';
import { GenericAdapter } from './adapters/genericAdapter';
import { calculateMetrics } from './metricsEngine';
import { generatePulseMap } from './pulseMapGenerator';

const adapters: LanguageAdapter[] = [
  new PythonAdapter(),
  new JavaScriptAdapter(),
  new JavaAdapter(),
  new CFamilyAdapter(),
  new GenericAdapter(),
];

export function getAdapterForLanguage(lang: SupportedLanguage): LanguageAdapter {
  const matched = adapters.find((a) => a.canHandle(lang));
  return matched || adapters[adapters.length - 1]; // fallback to generic
}

export function analyzeCode(
  code: string,
  language: SupportedLanguage,
  fileName: string = 'code_input'
): AnalysisResult {
  if (!code || !code.trim()) {
    return {
      language,
      languageName: language.toUpperCase(),
      depth: 'heuristic_pattern',
      metrics: {
        loc: 0,
        sloc: 0,
        commentLines: 0,
        blankLines: 0,
        commentRatio: 0,
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        maxNestingDepth: 0,
        functionCount: 0,
        classCount: 0,
        averageFunctionLength: 0,
        dependenciesCount: 0,
        externalDependenciesCount: 0,
        internalDependenciesCount: 0,
        maintainabilityScore: 100,
        healthScore: 100,
        scoreBreakdown: {
          complexity: 100,
          maintainability: 100,
          structure: 100,
          quality: 100,
          security: 100,
          documentation: 100,
        },
        functions: [],
        classes: [],
        imports: [],
      },
      smells: [],
      pulseMap: { nodes: [], links: [] },
      timestamp: Date.now(),
      summary: {
        criticalCount: 0,
        warningCount: 0,
        infoCount: 0,
        healthLevel: 'Optimal',
      },
    };
  }

  const adapter = getAdapterForLanguage(language);
  const parsed = adapter.parse(code);
  const smells = adapter.detectSmells(code, parsed);
  const metrics = calculateMetrics(parsed, smells);
  const pulseMap = generatePulseMap(fileName, parsed.imports, parsed.classes, parsed.functions);

  const criticalCount = smells.filter((s) => s.severity === 'critical').length;
  const warningCount = smells.filter((s) => s.severity === 'warning').length;
  const infoCount = smells.filter((s) => s.severity === 'info').length;

  let healthLevel: 'Optimal' | 'Stable' | 'Needs Attention' | 'Critical Risk' = 'Optimal';
  if (metrics.healthScore < 50 || criticalCount > 2) {
    healthLevel = 'Critical Risk';
  } else if (metrics.healthScore < 75 || criticalCount > 0 || warningCount > 3) {
    healthLevel = 'Needs Attention';
  } else if (metrics.healthScore < 88 || warningCount > 0) {
    healthLevel = 'Stable';
  }

  return {
    language,
    languageName: adapter.displayName,
    depth: adapter.depth,
    metrics,
    smells,
    pulseMap,
    timestamp: Date.now(),
    summary: {
      criticalCount,
      warningCount,
      infoCount,
      healthLevel,
    },
  };
}
