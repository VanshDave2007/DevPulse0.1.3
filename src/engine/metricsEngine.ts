import { RawParseOutput } from './adapter';
import { CodeMetrics, CodeSmell } from '../types';

export function calculateMetrics(parsed: RawParseOutput, smells: CodeSmell[]): CodeMetrics {
  const { loc, sloc, commentLines, blankLines, functions, classes, imports, rawCyclomatic, rawCognitive, maxNesting } = parsed;

  const commentRatio = Math.min(1, commentLines / Math.max(1, commentLines + sloc));
  const functionCount = functions.length;
  const classCount = classes.length;

  const totalFnLength = functions.reduce((acc, f) => acc + (f.loc || 0), 0);
  const averageFunctionLength = functionCount > 0 ? Math.round(totalFnLength / functionCount) : Math.round(sloc);

  const dependenciesCount = imports.length;
  const externalDependenciesCount = imports.filter((i) => i.isExternal).length;
  const internalDependenciesCount = imports.filter((i) => !i.isExternal).length;

  // 1. Maintainability Index calculation:
  // Derived from classic SEI / Microsoft MI formula:
  // MI = 171 - 5.2 * ln(Halstead Volume) - 0.23 * (Cyclomatic Complexity) - 16.2 * ln(LOC) + 50 * sin(sqrt(2.4 * CommentRatio))
  // Normalized to 0 - 100 range.
  const estimatedHalsteadVolume = Math.max(10, sloc * 7.5);
  const rawMI =
    171 -
    5.2 * Math.log(estimatedHalsteadVolume) -
    0.23 * rawCyclomatic -
    16.2 * Math.log(Math.max(5, loc)) +
    50 * Math.sin(Math.sqrt(Math.max(0.01, 2.4 * commentRatio)));

  const maintainabilityScore = Math.max(15, Math.min(100, Math.round((rawMI / 171) * 100)));

  // 2. Complexity Score (0 - 100, higher is cleaner/better managed)
  const avgFnComplexity = functionCount > 0 ? rawCyclomatic / functionCount : rawCyclomatic;
  const complexityPenalty = Math.min(75, Math.round(avgFnComplexity * 4.5 + maxNesting * 5 + rawCognitive * 0.8));
  const complexityScore = Math.max(20, 100 - complexityPenalty);

  // 3. Structure Score (0 - 100)
  let structureScore = 95;
  if (averageFunctionLength > 50) structureScore -= 20;
  else if (averageFunctionLength > 30) structureScore -= 10;
  if (maxNesting > 4) structureScore -= 15;
  else if (maxNesting > 3) structureScore -= 8;
  if (functionCount === 0 && sloc > 40) structureScore -= 15; // script unstructured
  structureScore = Math.max(25, Math.min(100, structureScore));

  // 4. Quality Score (Impacted by smells & errors)
  const criticalSmells = smells.filter((s) => s.severity === 'critical').length;
  const warningSmells = smells.filter((s) => s.severity === 'warning').length;
  const qualityPenalty = criticalSmells * 25 + warningSmells * 8;
  const qualityScore = Math.max(10, Math.min(100, 100 - qualityPenalty));

  // 5. Security Score
  const securitySmells = smells.filter((s) => s.category === 'security').length;
  const securityScore = Math.max(10, Math.min(100, 100 - securitySmells * 25));

  // 6. Documentation Score
  let documentationScore = 60;
  if (commentRatio >= 0.15 && commentRatio <= 0.35) {
    documentationScore = 96;
  } else if (commentRatio >= 0.08) {
    documentationScore = 85;
  } else if (commentRatio > 0.02) {
    documentationScore = 70;
  } else {
    documentationScore = 48; // Under-documented
  }

  // Combined Code Health Score (Weighted)
  let healthScore = Math.round(
    maintainabilityScore * 0.30 +
    complexityScore * 0.25 +
    qualityScore * 0.20 +
    structureScore * 0.15 +
    securityScore * 0.05 +
    documentationScore * 0.05
  );

  // If critical syntax or correctness errors exist, cap health score so broken code is never reported as optimal
  if (criticalSmells > 0) {
    healthScore = Math.min(healthScore, criticalSmells > 2 ? 35 : 55);
  }

  return {
    loc,
    sloc,
    commentLines,
    blankLines,
    commentRatio,
    cyclomaticComplexity: rawCyclomatic,
    cognitiveComplexity: rawCognitive,
    maxNestingDepth: maxNesting,
    functionCount,
    classCount,
    averageFunctionLength,
    dependenciesCount,
    externalDependenciesCount,
    internalDependenciesCount,
    maintainabilityScore,
    healthScore,
    scoreBreakdown: {
      complexity: complexityScore,
      maintainability: maintainabilityScore,
      structure: structureScore,
      quality: qualityScore,
      security: securityScore,
      documentation: documentationScore,
    },
    functions,
    classes,
    imports,
  };
}
