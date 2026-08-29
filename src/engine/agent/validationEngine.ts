import { AgentFinding, ContractDiff, ProgramSymbol } from '../../types';

export function validateFindings(
  rawFindings: AgentFinding[],
  symbols: ProgramSymbol[],
  contractDiffs: ContractDiff[],
  knownFiles: string[]
): AgentFinding[] {
  const validated: AgentFinding[] = [];
  const knownFileSet = new Set(knownFiles);
  const knownSymbolMap = new Map<string, ProgramSymbol>();

  for (const s of symbols) {
    knownSymbolMap.set(s.name, s);
  }

  for (const f of rawFindings) {
    let confidence = f.confidence || 0.85;
    let requiresHumanReview = f.requires_human_review;

    // 1. Validate File Existence
    const fileExists = knownFileSet.has(f.file) || knownFiles.some((kf) => kf.endsWith(f.file) || f.file.endsWith(kf));
    if (!fileExists) {
      confidence = Math.max(0.3, confidence - 0.35);
      f.evidence.push('[Validation Notice] Referenced file was not found in primary diff/caller index.');
      requiresHumanReview = true;
    }

    // 2. Validate Symbol Existence
    if (f.symbol) {
      const symExists = knownSymbolMap.has(f.symbol);
      if (!symExists) {
        confidence = Math.max(0.4, confidence - 0.25);
        requiresHumanReview = true;
      }
    }

    // 3. Grounding Cross-Check with Contract Diffs
    const matchingContract = contractDiffs.find((c) => c.name === f.symbol);
    if (matchingContract && matchingContract.isBreaking && f.category === 'REGRESSION') {
      // Confirmed by deterministic AST contract analysis
      confidence = Math.max(0.95, confidence);
      requiresHumanReview = false;
    }

    // 4. Clean empty evidence
    if (!f.evidence || f.evidence.length === 0) {
      f.evidence = [`Diff analysis in ${f.file}:${f.line}`];
    }

    validated.push({
      ...f,
      confidence: Number(confidence.toFixed(2)),
      requires_human_review: requiresHumanReview ?? (confidence < 0.85),
      status: f.status || 'open',
    });
  }

  return validated;
}
