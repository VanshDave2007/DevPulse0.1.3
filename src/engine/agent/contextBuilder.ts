import {
  CallGraphResult,
  ContractDiff,
  GitDiffResult,
  ImpactResult,
  ProgramSymbol,
  RAGDocument,
  VulnerabilityScanResult,
} from '../../types';

export interface TargetedContextPayload {
  summary: string;
  diffSnippet: string;
  modifiedSymbols: Array<{
    name: string;
    file: string;
    signature: string;
    startLine: number;
    endLine: number;
  }>;
  contractChanges: Array<{
    symbol: string;
    isBreaking: boolean;
    description: string;
    oldSignature: string;
    newSignature: string;
    affectedCallSitesCount: number;
  }>;
  affectedCallSites: Array<{
    file: string;
    line: number;
    caller: string;
    snippet: string;
    isCompatible: boolean;
    reason?: string;
  }>;
  vulnerabilities: Array<{
    cveId: string;
    package: string;
    severity: string;
    title: string;
    isUsedInModifiedCode: boolean;
  }>;
  relevantDocs: Array<{
    title: string;
    category: string;
    content: string;
  }>;
  impactScore: number;
  riskLevel: string;
}

export function buildTargetedContext(
  diff: GitDiffResult,
  modifiedSymbols: ProgramSymbol[],
  contractDiffs: ContractDiff[],
  callGraph: CallGraphResult,
  impact: ImpactResult,
  vulnerabilities: VulnerabilityScanResult,
  ragDocs: RAGDocument[]
): TargetedContextPayload {
  const compactDiff = diff.files
    .map((f) => `### File: ${f.file} (${f.status})\n\`\`\`${f.language}\n${f.rawDiff.trim()}\n\`\`\``)
    .join('\n\n');

  const compactSymbols = modifiedSymbols.map((s) => ({
    name: s.qualifiedName || s.name,
    file: s.file,
    signature: `${s.name}(${s.parameters.map((p) => p.name + (p.defaultValue !== undefined ? `=${p.defaultValue}` : '')).join(', ')})${s.returnType ? ` -> ${s.returnType}` : ''}`,
    startLine: s.startLine,
    endLine: s.endLine,
  }));

  const compactContracts = contractDiffs.map((c) => ({
    symbol: c.name,
    isBreaking: c.isBreaking,
    description: c.description,
    oldSignature: c.oldContract.signatureString,
    newSignature: c.newContract.signatureString,
    affectedCallSitesCount: c.affectedCallSites.length,
  }));

  const compactCallSites = impact.affectedCallSites.map((cs) => ({
    file: cs.file,
    line: cs.line,
    caller: cs.callerSymbol,
    snippet: cs.codeSnippet,
    isCompatible: cs.isCompatible,
    reason: cs.reason,
  }));

  const compactVulns = vulnerabilities.vulnerabilities.map((v) => ({
    cveId: v.cveId,
    package: v.package,
    severity: v.severity,
    title: v.title,
    isUsedInModifiedCode: v.isUsedInModifiedCode,
  }));

  const compactDocs = ragDocs.map((d) => ({
    title: d.title,
    category: d.category,
    content: d.content,
  }));

  return {
    summary: diff.summary,
    diffSnippet: compactDiff,
    modifiedSymbols: compactSymbols,
    contractChanges: compactContracts,
    affectedCallSites: compactCallSites,
    vulnerabilities: compactVulns,
    relevantDocs: compactDocs,
    impactScore: impact.impactScore,
    riskLevel: impact.riskLevel,
  };
}
