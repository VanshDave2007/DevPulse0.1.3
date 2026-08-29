import { CallSite, ContractDiff, ContractInfo, ParameterInfo, ProgramSymbol } from '../../types';

export function createContractInfo(symbol: ProgramSymbol): ContractInfo {
  const paramStrings = symbol.parameters.map((p) => {
    let s = p.name;
    if (p.type) s += `: ${p.type}`;
    if (p.defaultValue !== undefined) s += ` = ${p.defaultValue}`;
    return s;
  });

  const sig = `${symbol.name}(${paramStrings.join(', ')})${symbol.returnType ? ` -> ${symbol.returnType}` : ''}`;

  return {
    symbolId: symbol.id,
    name: symbol.name,
    file: symbol.file,
    parameters: symbol.parameters,
    returnType: symbol.returnType,
    isPublic: symbol.isPublic ?? true,
    signatureString: sig,
  };
}

export function detectContractChanges(
  oldSymbols: ProgramSymbol[],
  newSymbols: ProgramSymbol[],
  callerSymbols: ProgramSymbol[],
  callerFileCodes: Map<string, string>
): ContractDiff[] {
  const diffs: ContractDiff[] = [];

  for (const newSym of newSymbols) {
    const oldSym = oldSymbols.find((s) => s.name === newSym.name && s.file === newSym.file);
    if (!oldSym) continue;

    const oldContract = createContractInfo(oldSym);
    const newContract = createContractInfo(newSym);

    // 1. Check added required parameters (Classic breaking change!)
    const oldRequiredCount = oldSym.parameters.filter((p) => p.isRequired).length;
    const newRequiredCount = newSym.parameters.filter((p) => p.isRequired).length;

    const addedRequiredParams = newSym.parameters.filter(
      (np) => np.isRequired && !oldSym.parameters.some((op) => op.name === np.name)
    );

    const removedParams = oldSym.parameters.filter(
      (op) => !newSym.parameters.some((np) => np.name === op.name)
    );

    let isBreaking = false;
    let diffType: ContractDiff['type'] = 'signature_modified';
    let description = `Signature of \`${newSym.name}\` was modified.`;

    if (addedRequiredParams.length > 0) {
      isBreaking = true;
      diffType = 'parameter_added';
      const paramNames = addedRequiredParams.map((p) => `\`${p.name}\``).join(', ');
      description = `Breaking change: Added ${addedRequiredParams.length} required parameter(s) (${paramNames}) to \`${newSym.name}\` without default value. Existing call sites will fail with TypeError or missing argument exceptions.`;
    } else if (removedParams.length > 0) {
      isBreaking = true;
      diffType = 'parameter_removed';
      const paramNames = removedParams.map((p) => `\`${p.name}\``).join(', ');
      description = `Breaking change: Removed parameter(s) (${paramNames}) from \`${newSym.name}\`. Callers providing these arguments may crash or misbehave.`;
    } else if (oldSym.returnType && newSym.returnType && oldSym.returnType !== newSym.returnType) {
      isBreaking = true;
      diffType = 'return_type_changed';
      description = `Return type modified from \`${oldSym.returnType}\` to \`${newSym.returnType}\`.`;
    }

    // Inspect call sites across known callers
    const affectedCallSites: CallSite[] = [];
    for (const caller of callerSymbols) {
      const code = callerFileCodes.get(caller.file) || '';
      const lines = code.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        if (line.includes(newSym.name)) {
          // Check if it's a function call like calculate_price(...)
          const callRegex = new RegExp(`\\b${newSym.name}\\s*\\(([^)]*)\\)`);
          const match = line.match(callRegex);

          if (match) {
            const rawArgs = match[1].trim();
            const argCount = rawArgs.length > 0 ? rawArgs.split(',').length : 0;

            let isCompatible = true;
            let reason: string | undefined = undefined;

            if (argCount < newRequiredCount) {
              isCompatible = false;
              reason = `Caller provides ${argCount} argument(s), but \`${newSym.name}\` now requires ${newRequiredCount} positional argument(s). Missing argument(s): ${addedRequiredParams.map((p) => p.name).join(', ')}.`;
            }

            affectedCallSites.push({
              file: caller.file,
              line: lineNum,
              callerSymbol: caller.name,
              calleeSymbol: newSym.name,
              codeSnippet: line.trim(),
              isCompatible,
              reason,
            });
          }
        }
      }
    }

    if (isBreaking || oldContract.signatureString !== newContract.signatureString) {
      diffs.push({
        symbolId: newSym.id,
        name: newSym.name,
        file: newSym.file,
        isBreaking,
        type: diffType,
        description,
        oldContract,
        newContract,
        affectedCallSites,
      });
    }
  }

  return diffs;
}
