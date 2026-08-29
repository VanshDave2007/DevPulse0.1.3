import { CallSite, ContractDiff, ImpactResult, ProgramSymbol, VulnerabilityScanResult } from '../../types';

export function calculateImpact(
  modifiedSymbols: ProgramSymbol[],
  directCallers: ProgramSymbol[],
  indirectCallers: ProgramSymbol[],
  contractDiffs: ContractDiff[],
  vulnerabilities: VulnerabilityScanResult,
  changedFiles: string[]
): ImpactResult {
  const affectedSymbols = new Set<string>();
  const affectedFiles = new Set<string>(changedFiles);
  const affectedCallSites: CallSite[] = [];
  const affectedDependencies: string[] = [];
  const affectedEndpoints: string[] = [];
  const affectedTests: string[] = [];

  for (const sym of modifiedSymbols) {
    affectedSymbols.add(sym.name);
    affectedFiles.add(sym.file);
    if (sym.symbolType === 'endpoint' || sym.name.startsWith('api_') || sym.name.includes('handler')) {
      affectedEndpoints.push(sym.name);
    }
  }

  for (const caller of directCallers) {
    affectedSymbols.add(caller.name);
    affectedFiles.add(caller.file);
    if (caller.file.includes('test') || caller.name.startsWith('test_')) {
      affectedTests.push(caller.name);
    }
  }

  for (const caller of indirectCallers) {
    affectedSymbols.add(caller.name);
    affectedFiles.add(caller.file);
  }

  for (const cd of contractDiffs) {
    affectedCallSites.push(...cd.affectedCallSites);
  }

  for (const vuln of vulnerabilities.vulnerabilities) {
    affectedDependencies.push(vuln.package);
  }

  // Determine if public API is impacted
  const isPublicApiImpacted =
    affectedEndpoints.length > 0 ||
    modifiedSymbols.some((s) => s.isPublic) ||
    contractDiffs.some((c) => c.isBreaking);

  // Calculate Impact Score
  let directScore = modifiedSymbols.length * 15;
  let callerScore = directCallers.length * 12 + indirectCallers.length * 5;
  let contractPenalty = contractDiffs.filter((c) => c.isBreaking).length * 30;
  let vulnPenalty = vulnerabilities.criticalCount * 35 + vulnerabilities.highCount * 20;
  let apiPenalty = isPublicApiImpacted ? 15 : 0;

  const rawScore = directScore + callerScore + contractPenalty + vulnPenalty + apiPenalty;
  const impactScore = Math.max(10, Math.min(100, Math.round(rawScore)));

  let riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (impactScore >= 80 || contractDiffs.some((c) => c.isBreaking && c.affectedCallSites.some((cs) => !cs.isCompatible)) || vulnerabilities.criticalCount > 0) {
    riskLevel = 'CRITICAL';
  } else if (impactScore >= 55 || contractDiffs.length > 0 || vulnerabilities.highCount > 0) {
    riskLevel = 'HIGH';
  } else if (impactScore >= 30) {
    riskLevel = 'MEDIUM';
  }

  return {
    impactScore,
    riskLevel,
    directImpactCount: modifiedSymbols.length,
    indirectImpactCount: directCallers.length + indirectCallers.length,
    affectedSymbols: Array.from(affectedSymbols),
    affectedFiles: Array.from(affectedFiles),
    affectedCallSites,
    affectedDependencies,
    affectedEndpoints,
    affectedTests,
    isPublicApiImpacted,
    breakdown: {
      direct: Math.min(100, directScore),
      callers: Math.min(100, callerScore),
      dependencies: Math.min(100, vulnPenalty),
      api: isPublicApiImpacted ? 85 : 10,
      tests: affectedTests.length > 0 ? 70 : 15,
      database: modifiedSymbols.some((s) => s.calls.some((c) => c.includes('query') || c.includes('execute') || c.includes('db'))) ? 80 : 10,
    },
  };
}
