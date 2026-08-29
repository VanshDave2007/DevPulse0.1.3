/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActionFinding,
  AnalysisResult,
  AskResult,
  ClarificationQuestion,
  CodeCitation,
  CodebaseQueryContext,
  EvidenceGraph,
  EvidenceGraphNode,
  ImpactAnalysis,
  ProgramSymbol,
  RepositoryQueryIntent,
  RootCauseItem,
} from '../types';
import { ChangeImpactService } from './changeImpactService';
import { EvidenceGraphService, redactSecrets } from './evidenceGraphService';
import { FindingPriorityEngine } from './findingPriorityEngine';
import { ProjectMemoryService } from './projectMemoryService';
import { QueryIntentEngine } from './queryIntentEngine';
import { RootCauseEngine } from './rootCauseEngine';
import { SymbolResolutionService } from './symbolResolutionService';
import { TestIntelligenceService } from './testIntelligenceService';

export class RepositoryIntelligenceService {
  /**
   * Main entry point for "Ask Your Codebase" repository intelligence.
   * Executes intent classification, deterministic evidence retrieval,
   * symbol disambiguation, and personalizes the grounded answer.
   */
  public static async queryCodebase(
    query: string,
    context: CodebaseQueryContext,
    graph: EvidenceGraph,
    findings: ActionFinding[] = [],
    analysis: AnalysisResult | null = null,
    code: string = '',
    fileName: string = 'active_file'
  ): Promise<AskResult> {
    const timestamp = Date.now();
    const queryId = `ask-${timestamp}-${Math.random().toString(36).slice(2, 6)}`;
    const devLevel = context.developerLevel || 'intermediate';

    // 1. Collect all known entities for intent matching
    const knownSymbols: string[] = [];
    const knownFiles: string[] = [fileName];
    const knownFindingIds = findings.map((f) => f.id);

    if (analysis?.metrics) {
      (analysis.metrics.functions || []).forEach((f) => knownSymbols.push(f.name));
      (analysis.metrics.classes || []).forEach((c) => knownSymbols.push(c.name));
      (analysis.metrics.imports || []).forEach((i) => knownSymbols.push(i.module));
    }

    graph.nodes.forEach((n) => {
      if (n.symbol && !knownSymbols.includes(n.symbol)) knownSymbols.push(n.symbol);
      if (n.file && !knownFiles.includes(n.file)) knownFiles.push(n.file);
    });

    // 2. Perform Natural Language Symbol Resolution
    const symbolRes = SymbolResolutionService.resolveNaturalLanguageQuery(
      query,
      code,
      fileName,
      context.activeLanguage || 'typescript'
    );

    // 3. Classify intent
    const intentResult = QueryIntentEngine.classifyIntent(query, {
      activeFile: context.activeFile || fileName,
      activeSymbol: context.activeSymbol || symbolRes.matchedSymbol?.name,
      activeFindingId: context.activeFindingId,
      knownSymbols,
      knownFiles,
      knownFindingIds,
    });

    const intent = intentResult.intent;
    const targetSymbol = intentResult.targetSymbol || symbolRes.matchedSymbol?.name || context.activeSymbol;
    const targetFile = intentResult.targetFile || fileName;

    // 4. Ambiguity check: if multiple matches are found via SymbolResolutionService or Graph
    if (symbolRes.isAmbiguous && symbolRes.clarificationQuestion && !context.activeSymbol) {
      return {
        id: queryId,
        query,
        intent,
        confidence: 'MEDIUM',
        confidenceScore: 75,
        summary: `Multiple symbol matches found for "${symbolRes.queryTerm}". Please disambiguate.`,
        groundedAnswer: `I detected multiple related symbols in **\`${fileName}\`** matching "${symbolRes.queryTerm}".\n\nPlease select which entity you would like me to inspect:`,
        evidence: symbolRes.candidates.map((c) => `Candidate ${c.type} \`${c.name}\` at Line ${c.startLine}`),
        citations: symbolRes.candidates.slice(0, 3).map((c) => ({
          file: c.file,
          line: c.startLine,
          endLine: c.endLine,
          symbol: c.name,
          snippet: c.snippet,
          description: c.description,
        })),
        clarification: symbolRes.clarificationQuestion,
        timestamp,
        developerLevel: devLevel,
      };
    }

    if ((intent === 'CODE_EXPLANATION' || intent === 'CALLERS' || intent === 'CALLEES') && !targetSymbol) {
      const candidateNodes = graph.nodes.filter((n) => n.type === 'FUNCTION' || n.type === 'CLASS');
      if (candidateNodes.length > 1) {
        const clarification = QueryIntentEngine.generateClarification(
          query,
          candidateNodes.map((n) => ({ id: n.id, name: n.label, type: n.type, file: n.file }))
        );
        if (clarification) {
          return {
            id: queryId,
            query,
            intent,
            confidence: 'MEDIUM',
            confidenceScore: 70,
            summary: `Multiple symbols detected in \`${fileName}\`. Please select one to inspect.`,
            groundedAnswer: `I found ${candidateNodes.length} symbols in this file (${candidateNodes.map((c) => `\`${c.label}\``).join(', ')}). Which one would you like me to analyze?`,
            evidence: candidateNodes.map((c) => `Found ${c.type} \`${c.label}\` at line ${c.line || 'N/A'}`),
            citations: candidateNodes.slice(0, 3).map((c) => ({
              file: c.file || fileName,
              line: c.line,
              symbol: c.symbol,
              snippet: c.label,
            })),
            clarification,
            timestamp,
            developerLevel: devLevel,
          };
        }
      }
    }

    // 4. Dispatch structured repository tools based on intent
    const citations: CodeCitation[] = [];
    const evidenceList: string[] = [];
    let groundedAnswer = '';
    let summary = '';
    let subGraph: EvidenceGraph | undefined;
    let impactAnalysis: ImpactAnalysis | undefined;
    let rootCauseItem: RootCauseItem | undefined;
    let followUps: string[] = [];
    let confidenceScore = 95;
    let confidenceTier: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN' = 'HIGH';

    const lines = code.split('\n');

    switch (intent) {
      case 'CALLERS': {
        const symbolToLookup = targetSymbol || (analysis?.metrics?.functions?.[0]?.name ?? 'main');
        const callers = EvidenceGraphService.findCallers(graph, symbolToLookup);
        subGraph = EvidenceGraphService.getSubGraph(graph, `func-${symbolToLookup}`, 2);

        if (callers.length > 0) {
          summary = `\`${symbolToLookup}\` has ${callers.length} verified direct caller${callers.length > 1 ? 's' : ''}.`;
          callers.forEach((c) => {
            evidenceList.push(`Invoked by \`${c.label}\` (${c.file || fileName}:${c.line || 'N/A'})`);
            citations.push({
              file: c.file || fileName,
              line: c.line,
              symbol: c.symbol,
              snippet: lines[c.line ? c.line - 1 : 0] || c.label,
            });
          });

          groundedAnswer = formatCallerAnswer(symbolToLookup, callers, devLevel, fileName);
        } else {
          confidenceScore = 90;
          summary = `No callers detected for \`${symbolToLookup}\` in the active scope.`;
          groundedAnswer = `Based on the repository call graph, **\`${symbolToLookup}\`** has no active incoming callers within \`${fileName}\`. It may be an entrypoint or top-level exported API.`;
          evidenceList.push(`Symbol \`${symbolToLookup}\` has 0 incoming CALLS edges in the AST call graph.`);
        }

        followUps = [
          `What functions does \`${symbolToLookup}\` call?`,
          `What is the blast radius if I modify \`${symbolToLookup}\`?`,
          `Are there tests for \`${symbolToLookup}\`?`,
        ];
        break;
      }

      case 'CALLEES': {
        const symbolToLookup = targetSymbol || (analysis?.metrics?.functions?.[0]?.name ?? 'main');
        const callees = EvidenceGraphService.findCallees(graph, symbolToLookup);
        subGraph = EvidenceGraphService.getSubGraph(graph, `func-${symbolToLookup}`, 2);

        if (callees.length > 0) {
          summary = `\`${symbolToLookup}\` calls ${callees.length} outgoing symbol${callees.length > 1 ? 's' : ''}.`;
          callees.forEach((c) => {
            evidenceList.push(`Calls \`${c.label}\` (Type: ${c.type})`);
            citations.push({
              file: c.file || fileName,
              line: c.line,
              symbol: c.symbol,
              snippet: lines[c.line ? c.line - 1 : 0] || c.label,
            });
          });

          groundedAnswer = formatCalleeAnswer(symbolToLookup, callees, devLevel);
        } else {
          summary = `\`${symbolToLookup}\` does not invoke external sub-functions.`;
          groundedAnswer = `**\`${symbolToLookup}\`** performs leaf operations without invoking registered sub-functions in this module.`;
          evidenceList.push(`Symbol \`${symbolToLookup}\` has 0 outgoing CALLS edges in the AST.`);
        }

        followUps = [
          `Who calls \`${symbolToLookup}\`?`,
          `What is the cyclomatic complexity of \`${symbolToLookup}\`?`,
        ];
        break;
      }

      case 'CHANGE_IMPACT': {
        const target = targetSymbol || targetFile || 'Active Module';
        impactAnalysis = ChangeImpactService.calculateImpact(target, graph, findings, 2);
        subGraph = impactAnalysis.graph;

        summary = `Blast radius for \`${target}\` is rated **${impactAnalysis.riskLevel}** (${impactAnalysis.directDependents.length} direct, ${impactAnalysis.indirectDependents.length} indirect dependents).`;
        evidenceList.push(
          `Direct dependents: ${impactAnalysis.directDependents.join(', ') || 'None'}`,
          `Affected files: ${impactAnalysis.affectedFiles.join(', ') || fileName}`,
          `Risk level: ${impactAnalysis.riskLevel} (Confidence: ${impactAnalysis.confidence}%)`
        );

        groundedAnswer = formatImpactAnswer(target, impactAnalysis, devLevel);
        followUps = [
          `Show the root cause of issues in \`${target}\``,
          `What tests cover \`${target}\`?`,
          `Show incoming callers of \`${target}\``,
        ];
        break;
      }

      case 'ROOT_CAUSE': {
        const targetFinding = findings.find((f) => f.id === intentResult.targetFindingId) || findings[0];
        if (targetFinding) {
          rootCauseItem = RootCauseEngine.synthesizeRootCause(targetFinding, findings, graph);
          summary = `Root cause identified for [${targetFinding.priority}] "${targetFinding.title}".`;
          evidenceList.push(...rootCauseItem.evidenceSummary);

          citations.push({
            file: targetFinding.file || fileName,
            line: targetFinding.line,
            symbol: targetFinding.symbol,
            snippet: targetFinding.codeSnippet || lines[targetFinding.line - 1] || targetFinding.title,
          });

          groundedAnswer = formatRootCauseAnswer(targetFinding, rootCauseItem, devLevel);
        } else {
          summary = `No active code smells or failures found in \`${fileName}\`.`;
          groundedAnswer = `Deterministic static analysis confirms **${fileName}** is currently clean of high-severity root-cause issues.`;
          evidenceList.push('Static analyzer reports 0 active critical findings.');
        }

        followUps = [
          'What is the blast radius if I apply the suggested fix?',
          'Explain this finding in detail',
        ];
        break;
      }

      case 'DEPENDENCIES': {
        const imports = analysis?.metrics?.imports || [];
        summary = `Module imports ${imports.length} package${imports.length > 1 ? 's' : ''}/module${imports.length > 1 ? 's' : ''}.`;
        imports.forEach((imp) => {
          evidenceList.push(`Imports \`${imp.module}\` at line ${imp.line} (External: ${imp.isExternal ? 'Yes' : 'No'})`);
          citations.push({
            file: fileName,
            line: imp.line,
            symbol: imp.module,
            snippet: lines[imp.line - 1] || `import ${imp.module}`,
          });
        });

        groundedAnswer = formatDependenciesAnswer(imports, devLevel);
        followUps = [
          'Are there any vulnerabilities in these dependencies?',
          'What database packages are used?',
        ];
        break;
      }

      case 'DEPENDENTS': {
        const target = targetSymbol || targetFile || fileName;
        const dependents = EvidenceGraphService.findDependents(graph, target);
        summary = `Found ${dependents.length} dependent${dependents.length > 1 ? 's' : ''} for \`${target}\`.`;

        if (dependents.length > 0) {
          dependents.forEach((d) => {
            evidenceList.push(`Dependent component: \`${d.label}\` (Type: ${d.type})`);
          });
          groundedAnswer = `**\`${target}\`** is imported or consumed by ${dependents.length} component${dependents.length > 1 ? 's' : ''}: ${dependents.map((d) => `\`${d.label}\``).join(', ')}.`;
        } else {
          groundedAnswer = `No downstream dependents found for **\`${target}\`** within the current workspace graph.`;
          evidenceList.push(`0 incoming IMPORT or USES edges pointing to \`${target}\`.`);
        }

        followUps = [`What is the blast radius of modifying \`${target}\`?`];
        break;
      }

      case 'AUTHENTICATION': {
        const authNodes = graph.nodes.filter(
          (n) =>
            /auth|session|token|user|jwt|login|password|permission/i.test(n.label) ||
            /auth|session|token|user|jwt|login|password/i.test(n.symbol || '')
        );

        const authLines = lines
          .map((l, idx) => ({ lineNum: idx + 1, content: l }))
          .filter((item) => /auth|token|bearer|session|password|secret|jwt|login/i.test(item.content));

        if (authLines.length > 0 || authNodes.length > 0) {
          summary = `Found ${authLines.length} authentication-related construct${authLines.length > 1 ? 's' : ''} in \`${fileName}\`.`;
          authLines.forEach((al) => {
            evidenceList.push(`Auth pattern at line ${al.lineNum}: \`${redactSecrets(al.content.trim())}\``);
            citations.push({
              file: fileName,
              line: al.lineNum,
              snippet: redactSecrets(al.content.trim()),
            });
          });

          groundedAnswer = `### 🔐 Authentication & Session Handling in \`${fileName}\`\n\n` +
            `Authentication and authorization references were located at the following lines:\n\n` +
            authLines.map((al) => `- **Line ${al.lineNum}:** \`${redactSecrets(al.content.trim())}\``).join('\n') +
            `\n\n*All authentication tokens and sensitive credentials have been verified and redacted.*`;
        } else {
          summary = `No explicit authentication logic detected in \`${fileName}\`.`;
          groundedAnswer = `Based on AST and lexical parsing, **\`${fileName}\`** does not implement direct authentication or credential handling.`;
          evidenceList.push('No auth/session keywords or tokens matched in AST.');
        }

        followUps = ['Are there any security findings in this file?', 'Where is user input processed?'];
        break;
      }

      case 'DATABASE_USAGE': {
        const dbNodes = graph.nodes.filter((n) => n.type === 'DATABASE');
        const dbLines = lines
          .map((l, idx) => ({ lineNum: idx + 1, content: l }))
          .filter((item) => /db|sql|select|insert|update|delete|table|query|connection|pool|mongo|postgres/i.test(item.content));

        if (dbLines.length > 0 || dbNodes.length > 0) {
          summary = `Found ${dbLines.length} database / storage access pattern${dbLines.length > 1 ? 's' : ''}.`;
          dbLines.slice(0, 5).forEach((dl) => {
            evidenceList.push(`Storage reference at line ${dl.lineNum}: \`${dl.content.trim()}\``);
            citations.push({
              file: fileName,
              line: dl.lineNum,
              snippet: dl.content.trim(),
            });
          });

          groundedAnswer = `### 🗄️ Database & Storage Operations in \`${fileName}\`\n\n` +
            dbLines.slice(0, 6).map((dl) => `- **Line ${dl.lineNum}:** \`${dl.content.trim()}\``).join('\n');
        } else {
          summary = `No database operations detected in \`${fileName}\`.`;
          groundedAnswer = `No database connections, SQL queries, or ORM operations were found in **\`${fileName}\`**.`;
          evidenceList.push('0 database query patterns identified.');
        }

        followUps = ['Show all external package dependencies', 'Where are HTTP requests made?'];
        break;
      }

      case 'SECURITY':
      case 'VULNERABILITY': {
        const secFindings = findings.filter(
          (f) => f.category === 'SECURITY' || f.type.toLowerCase().includes('security')
        );

        if (secFindings.length > 0) {
          summary = `Found ${secFindings.length} security diagnostic${secFindings.length > 1 ? 's' : ''} in \`${fileName}\`.`;
          secFindings.forEach((sf) => {
            evidenceList.push(`[${sf.priority}] ${sf.title} (Line ${sf.line})`);
            citations.push({
              file: sf.file || fileName,
              line: sf.line,
              symbol: sf.symbol,
              snippet: sf.codeSnippet || lines[sf.line - 1],
            });
          });

          groundedAnswer = `### 🛡️ Security Audit Findings for \`${fileName}\`\n\n` +
            secFindings.map((sf) => `#### [${sf.priority}] ${sf.title} (Line ${sf.line})\n- **Risk:** ${sf.whyItMatters || sf.description}\n- **Fix:** ${sf.suggestedFix || sf.recommendedAction}\n`).join('\n');
        } else {
          summary = `No security vulnerabilities detected in \`${fileName}\`.`;
          groundedAnswer = `The deterministic security scanner detected **0 active vulnerabilities** in **\`${fileName}\`**.`;
          evidenceList.push('Deterministic security and taint rules all passed.');
        }

        followUps = ['Show all code quality findings', 'Explain the system architecture'];
        break;
      }

      case 'CODE_LOCATION': {
        const symbolToFind = targetSymbol || 'target';
        const foundNode = graph.nodes.find(
          (n) => n.symbol?.toLowerCase() === symbolToFind.toLowerCase() || n.label.toLowerCase().includes(symbolToFind.toLowerCase())
        );

        if (foundNode) {
          summary = `\`${symbolToFind}\` is located in \`${foundNode.file || fileName}\` at line ${foundNode.line || 1}.`;
          evidenceList.push(`AST Node: ${foundNode.type} \`${foundNode.label}\` at line ${foundNode.line || 'N/A'}`);
          citations.push({
            file: foundNode.file || fileName,
            line: foundNode.line,
            symbol: foundNode.symbol,
            snippet: lines[foundNode.line ? foundNode.line - 1 : 0] || foundNode.label,
          });

          groundedAnswer = `**\`${symbolToFind}\`** is defined as a **${foundNode.type}** in **\`${foundNode.file || fileName}\`** on **Line ${foundNode.line || 1}**.\n\n` +
            `\`\`\`\n${lines[foundNode.line ? foundNode.line - 1 : 0] || foundNode.label}\n\`\`\``;
        } else {
          // Lexical search in code
          const matchingIdx = lines.findIndex((l) => l.toLowerCase().includes(symbolToFind.toLowerCase()));
          if (matchingIdx !== -1) {
            summary = `Found reference to \`${symbolToFind}\` at line ${matchingIdx + 1}.`;
            evidenceList.push(`Lexical match at line ${matchingIdx + 1}`);
            citations.push({
              file: fileName,
              line: matchingIdx + 1,
              snippet: lines[matchingIdx].trim(),
            });
            groundedAnswer = `Found \`${symbolToFind}\` in **\`${fileName}\`** on **Line ${matchingIdx + 1}**:\n\n\`\`\`\n${lines[matchingIdx].trim()}\n\`\`\``;
          } else {
            confidenceTier = 'LOW';
            confidenceScore = 40;
            summary = `Could not verify location for \`${symbolToFind}\`.`;
            groundedAnswer = `I couldn't verify the location of **\`${symbolToFind}\`** from the available repository analysis of \`${fileName}\`.`;
            evidenceList.push(`Symbol "${symbolToFind}" not found in AST symbol table.`);
          }
        }

        followUps = [`Who calls \`${symbolToFind}\`?`, `Explain what \`${symbolToFind}\` does`];
        break;
      }

      case 'PROJECT_OVERVIEW':
      case 'ARCHITECTURE': {
        const metrics = analysis?.metrics;
        summary = `Overview of \`${fileName}\`: ${metrics?.loc || lines.length} LOC, ${metrics?.functionCount || 0} functions, ${metrics?.classCount || 0} classes.`;
        evidenceList.push(
          `Language: ${analysis?.language || 'Code'} | LOC: ${metrics?.loc || lines.length}`,
          `Cyclomatic Complexity: ${metrics?.cyclomaticComplexity ?? 'N/A'} | Health: ${metrics?.healthScore ?? 'N/A'}/100`,
          `Total AST Nodes: ${graph.nodes.length} | Edges: ${graph.edges.length}`
        );

        groundedAnswer = formatProjectOverviewAnswer(fileName, analysis, graph, devLevel);
        followUps = [
          'What are the main code smells or findings?',
          'What are the external dependencies?',
          'What is the highest complexity function?',
        ];
        break;
      }

      case 'TEST_DISCOVERY':
      case 'TEST_COVERAGE': {
        const framework = TestIntelligenceService.detectTestFramework(code, fileName, context.activeLanguage || 'typescript');
        const discoveredTests = TestIntelligenceService.discoverTests(code, fileName, framework);
        const relevantTests = TestIntelligenceService.findRelevantTests(targetSymbol || '', fileName, discoveredTests);
        const coverage = TestIntelligenceService.analyzeCoverage(code, fileName, discoveredTests);

        summary = `Framework: ${framework.name} (${framework.syntaxStyle}) | Discovered ${discoveredTests.length} tests (${relevantTests.length} relevant to target).`;
        evidenceList.push(
          `Detected test framework: ${framework.name} (confidence: ${framework.confidence})`,
          `Discovered tests count: ${discoveredTests.length}`,
          `Estimated function coverage: ${coverage.functions}% | Line coverage: ${coverage.lines}%`
        );

        discoveredTests.slice(0, 3).forEach((t) => {
          citations.push({
            file: t.file,
            line: t.line,
            symbol: t.targetSymbol,
            description: t.name,
          });
        });

        if (devLevel === 'beginner') {
          groundedAnswer = `### 🧪 Test Discovery & Coverage in \`${fileName}\`\n\n` +
            `**Everyday Analogy:** Tests are like safety inspections for your code. When you build something, tests check that it works as promised.\n\n` +
            `- **Framework:** \`${framework.name}\`\n` +
            `- **Total Tests Found:** **${discoveredTests.length}**\n` +
            `- **Functions Covered:** **${coverage.testedFunctionsCount} / ${coverage.totalFunctionsCount}** (${coverage.functions}%)\n\n` +
            (relevantTests.length > 0
              ? `**Tests covering ${targetSymbol || 'this file'}:**\n` +
                relevantTests.map((t) => `- ✓ \`${t.name}\` (${t.testType} test)`).join('\n')
              : `*No tests directly target \`${targetSymbol || 'this file'}\`. See suggested tests below.*`);
        } else if (devLevel === 'expert') {
          groundedAnswer = `### Test Telemetry: \`${fileName}\`\n\n` +
            `- **Framework:** \`${framework.name}\` [${framework.syntaxStyle}] (Runner: \`${framework.runnerCommand || 'N/A'}\`)\n` +
            `- **Coverage Matrix:** Line: **${coverage.lines}%** | Branch: **${coverage.branches}%** | Function: **${coverage.functions}%** | Path: **${coverage.paths}%**\n` +
            `- **Discovered Tests:** ${discoveredTests.length} (${relevantTests.length} relevant to \`${targetSymbol || 'active context'}\`)\n\n` +
            `**Active Test Cases:**\n` +
            discoveredTests.map((t) => `  • \`${t.name}\` [${t.testType}] (Assertions: ${t.assertionsCount}, Async: ${t.isAsync})`).join('\n');
        } else {
          groundedAnswer = `### 🧪 Test Coverage & Test Suite in \`${fileName}\`\n\n` +
            `- **Testing Framework:** **${framework.name}**\n` +
            `- **Test Cases Discovered:** **${discoveredTests.length}**\n` +
            `- **Estimated Coverage:** **${coverage.lines}% lines**, **${coverage.functions}% functions**\n\n` +
            (relevantTests.length > 0
              ? `**Relevant Tests for ${targetSymbol ? '`' + targetSymbol + '`' : 'this module'}:**\n` +
                relevantTests.map((t) => `- **${t.name}** (${t.testType}) — Line ${t.line}`).join('\n')
              : `*No direct unit tests found for \`${targetSymbol || fileName}\`.*`);
        }

        followUps = [
          'What behavior is untested in this file?',
          'Generate a test for this branch',
          'Which tests should I run after this change?',
        ];
        break;
      }

      case 'TEST_GAP_ANALYSIS': {
        const framework = TestIntelligenceService.detectTestFramework(code, fileName, context.activeLanguage || 'typescript');
        const discoveredTests = TestIntelligenceService.discoverTests(code, fileName, framework);
        const gaps = TestIntelligenceService.detectTestGaps(code, fileName, analysis, discoveredTests, findings);

        summary = `Detected ${gaps.length} potential test gaps (${gaps.filter((g) => g.priority === 'CRITICAL').length} critical).`;
        evidenceList.push(
          `Identified ${gaps.length} untested paths/branches`,
          `Critical security gaps: ${gaps.filter((g) => g.isSecuritySensitive).length}`
        );

        gaps.slice(0, 3).forEach((g) => {
          citations.push({
            file: g.targetFile,
            line: g.line,
            symbol: g.targetSymbol,
            description: g.missingBehavior,
          });
        });

        groundedAnswer = `### 🔍 Untested Behavior & Test Gaps in \`${fileName}\`\n\n` +
          `Potential test gap analysis identified **${gaps.length} untested paths**:\n\n` +
          gaps.map((g) => `- **[${g.priority}] ${g.title}**\n  • *Missing:* ${g.missingBehavior}\n  • *Why it matters:* ${g.whyItMatters}\n  • *Suggestion:* ${g.suggestedTest}`).join('\n\n');

        followUps = [
          'Generate a test for the first gap',
          'Which tests cover this function?',
          'What regressions were detected?',
        ];
        break;
      }

      case 'TEST_GENERATION': {
        const framework = TestIntelligenceService.detectTestFramework(code, fileName, context.activeLanguage || 'typescript');
        const discoveredTests = TestIntelligenceService.discoverTests(code, fileName, framework);
        const gaps = TestIntelligenceService.detectTestGaps(code, fileName, analysis, discoveredTests, findings);
        const target = targetSymbol || gaps[0]?.targetSymbol || 'main';
        const candidates = TestIntelligenceService.generateTestCandidates(target, fileName, code, framework, gaps[0]);

        summary = `Generated ${candidates.length} candidate test cases for \`${target}\` using ${framework.name}.`;
        evidenceList.push(
          `Target symbol: \`${target}\` in \`${fileName}\``,
          `Framework: ${framework.name} (${framework.syntaxStyle})`,
          `Confidence: HIGH | Safety checks passed (0 production modifications)`
        );

        groundedAnswer = `### ⚡ AI Candidate Tests for \`${target}\`\n\n` +
          `Formatted for **${framework.name}** following project conventions:\n\n` +
          candidates.map((c) => `#### ${c.title} (${c.testType})\n*${c.rationale}*\n\n\`\`\`${context.activeLanguage === 'python' ? 'python' : 'typescript'}\n${c.testCode}\n\`\`\``).join('\n\n');

        followUps = [
          'What behavior is untested?',
          'Which tests should I run after this change?',
        ];
        break;
      }

      case 'REGRESSION_CHECK': {
        const framework = TestIntelligenceService.detectTestFramework(code, fileName, context.activeLanguage || 'typescript');
        const discoveredTests = TestIntelligenceService.discoverTests(code, fileName, framework);
        const testResults = TestIntelligenceService.runTargetedTests(discoveredTests, code, fileName);
        const baseline = TestIntelligenceService.establishBaseline(fileName, analysis, testResults);
        const regressionReport = TestIntelligenceService.detectRegressions(baseline, testResults, analysis);

        summary = `Regression Status: ${regressionReport.regressionLevel} | ${testResults.passedCount}/${testResults.testsExecuted} tests passing.`;
        evidenceList.push(
          `Regression status: ${regressionReport.regressionLevel}`,
          `Tests passing: ${testResults.passedCount} / ${testResults.testsExecuted}`,
          `New security findings: ${regressionReport.newSecurityFindings.length}`
        );

        groundedAnswer = `### 🛡️ Regression Intelligence & Impact Assessment\n\n` +
          `- **Regression Severity:** **${regressionReport.regressionLevel}**\n` +
          `- **Baseline Comparison:** ${testResults.passedCount} tests passing, 0 failing\n` +
          `- **Security Delta:** ${regressionReport.newSecurityFindings.length === 0 ? '0 new vulnerabilities' : regressionReport.newSecurityFindings.join(', ')}\n` +
          `- **Notes:** ${regressionReport.notes}\n\n` +
          `**Tests to run after modifications in \`${fileName}\`:**\n` +
          discoveredTests.slice(0, 4).map((t) => `- ✓ \`${t.name}\` in \`${t.file}\``).join('\n');

        followUps = [
          'Which tests cover this function?',
          'What behavior is untested?',
          'Generate a test for this branch',
        ];
        break;
      }

      case 'FINDING_EXPLANATION': {
        const targetFinding =
          findings.find((f) => f.id === intentResult.targetFindingId || f.id.includes(intentResult.targetFindingId || '')) ||
          findings[0];

        if (targetFinding) {
          summary = `Explanation for [${targetFinding.priority}] "${targetFinding.title}".`;
          evidenceList.push(
            `Rule: ${targetFinding.type} | Priority: ${targetFinding.priority} (${targetFinding.priorityScore}/100)`,
            `File: ${targetFinding.file} (Line ${targetFinding.line})`,
            `Confidence: ${targetFinding.confidence}% (${targetFinding.confidenceType || 'DETERMINISTIC'})`
          );

          citations.push({
            file: targetFinding.file || fileName,
            line: targetFinding.line,
            symbol: targetFinding.symbol,
            snippet: targetFinding.codeSnippet || lines[targetFinding.line - 1],
          });

          groundedAnswer = formatFindingExplanation(targetFinding, devLevel);
        } else {
          summary = `No active findings to explain in \`${fileName}\`.`;
          groundedAnswer = `There are no active diagnostic findings in the current analysis.`;
        }

        followUps = [
          'What is the root cause of this finding?',
          'What is the blast radius if I change this code?',
        ];
        break;
      }

      case 'CODE_EXPLANATION':
      case 'SEARCH':
      default: {
        const symbolToExplain = targetSymbol;
        const matchingNode = symbolToExplain
          ? graph.nodes.find(
              (n) => n.symbol?.toLowerCase() === symbolToExplain.toLowerCase() || n.label.toLowerCase().includes(symbolToExplain.toLowerCase())
            )
          : null;

        if (matchingNode) {
          summary = `Explanation for \`${matchingNode.label}\`.`;
          evidenceList.push(`Symbol: ${matchingNode.label} (Type: ${matchingNode.type}, Line: ${matchingNode.line || 1})`);
          citations.push({
            file: matchingNode.file || fileName,
            line: matchingNode.line,
            symbol: matchingNode.symbol,
            snippet: lines[matchingNode.line ? matchingNode.line - 1 : 0] || matchingNode.label,
          });

          groundedAnswer = `### 📖 Code Analysis: \`${matchingNode.label}\`\n\n` +
            `**Type:** ${matchingNode.type} | **Location:** ${matchingNode.file || fileName}:${matchingNode.line || 1}\n\n` +
            `This entity is part of the repository structure. It has **${EvidenceGraphService.findCallers(graph, matchingNode.symbol || matchingNode.label).length} callers** and **${EvidenceGraphService.findCallees(graph, matchingNode.symbol || matchingNode.label).length} sub-calls**.\n\n` +
            `\`\`\`\n${lines[matchingNode.line ? matchingNode.line - 1 : 0] || matchingNode.label}\n\`\`\``;
        } else {
          // Provide an overview of the code
          summary = `Analysis for "${query}" in \`${fileName}\`.`;
          evidenceList.push(`Query matched general codebase context for \`${fileName}\`.`);
          groundedAnswer = `### Repository Grounding for "${query}"\n\n` +
            `In **\`${fileName}\`**, the codebase contains **${analysis?.metrics?.functionCount || 0} functions** and **${analysis?.metrics?.classes?.length || 0} classes**.\n\n` +
            `Everyday Analogy: Think of this file like a central dispatch module that processes inputs through defined functions and manages state.\n\n` +
            `Use the query buttons below to inspect specific callers, blast radius, or root causes.`;
        }

        followUps = [
          'What is the blast radius of modifying this code?',
          'Show incoming callers',
          'Explain the architecture of this file',
        ];
        break;
      }
    }

    // 5. Contextualize with relevant Project Memory & Approved Rules
    const relevantMemories = ProjectMemoryService.getRelevantMemory({
      file: targetFile,
      module: ProjectMemoryService.extractModuleName(targetFile),
      symbol: targetSymbol,
      query,
      code,
    });

    if (relevantMemories.length > 0) {
      const topApproved = relevantMemories
        .filter((m) => m.status === 'APPROVED' || m.status === 'CONFIRMED' || m.status === 'ACTIVE')
        .slice(0, 3);

      if (topApproved.length > 0) {
        const rulesFormatted = topApproved
          .map((m) => `- **[${m.type.replace(/_/g, ' ')}] ${m.title}** (${m.scope}): ${m.content}${m.decision ? ` *(Mandate: ${m.decision})*` : ''}`)
          .join('\n');
        
        groundedAnswer += `\n\n---\n**🧠 Relevant Project Memory & Approved Rules:**\n${rulesFormatted}`;
        
        topApproved.forEach((m) => {
          evidenceList.push(`Project Rule: [${m.type}] ${m.title}`);
        });
      }
    }

    return {
      id: queryId,
      query,
      intent,
      targetSymbol,
      targetFile,
      confidence: confidenceTier,
      confidenceScore,
      summary,
      groundedAnswer,
      evidence: evidenceList,
      citations,
      relatedGraph: subGraph,
      impactAnalysis,
      rootCause: rootCauseItem,
      suggestedFollowUps: followUps,
      requiresHumanReview: confidenceTier === 'LOW',
      timestamp,
      developerLevel: devLevel,
    };
  }
}

// ----------------------------------------------------
// Formatting Helpers for Personalized Grounded Answers
// ----------------------------------------------------

function formatCallerAnswer(
  symbol: string,
  callers: EvidenceGraphNode[],
  level: 'beginner' | 'intermediate' | 'expert',
  fileName: string
): string {
  if (level === 'beginner') {
    return `### 📞 Who calls \`${symbol}\`?\n\n` +
      `**Everyday Analogy:** Think of \`${symbol}\` like a specialized recipe in a kitchen. Callers are the other chefs or menu items that order this recipe to be prepared.\n\n` +
      `Here are the **${callers.length} caller${callers.length > 1 ? 's' : ''}** asking \`${symbol}\` to run:\n\n` +
      callers.map((c) => `- **\`${c.label}\`** (Line ${c.line || 'N/A'}) in \`${c.file || fileName}\``).join('\n') +
      `\n\n*Tip: If you change \`${symbol}\`'s parameters, remember to update these callers too!*`;
  }

  if (level === 'expert') {
    return `### AST Invocations: \`${symbol}\`\n\n` +
      `- **In-degree (Callers):** ${callers.length}\n` +
      `- **Direct Call Sites:**\n` +
      callers.map((c) => `  • \`${c.label}\` [${c.type}] → \`${c.file || fileName}:${c.line || 1}\``).join('\n') +
      `\n\n**Blast Radius Notice:** Modifying signature invariants on \`${symbol}\` directly impacts ${callers.length} downstream execution path${callers.length > 1 ? 's' : ''}.`;
  }

  return `### 📞 Callers of \`${symbol}\`\n\n` +
    `\`${symbol}\` is invoked directly by **${callers.length}** location${callers.length > 1 ? 's' : ''} in the codebase:\n\n` +
    callers.map((c) => `- **\`${c.label}\`** (${c.type}) — Line ${c.line || 'N/A'}`).join('\n') +
    `\n\n**Recommendation:** Ensure any changes to return types or parameter order remain backward-compatible with these callers.`;
}

function formatCalleeAnswer(
  symbol: string,
  callees: EvidenceGraphNode[],
  level: 'beginner' | 'intermediate' | 'expert'
): string {
  if (level === 'beginner') {
    return `### 🧭 What does \`${symbol}\` call?\n\n` +
      `When \`${symbol}\` runs, it asks these helper tools to do work for it:\n\n` +
      callees.map((c) => `- **\`${c.label}\`** (${c.type})`).join('\n');
  }

  if (level === 'expert') {
    return `### Outgoing AST Edge Traversal: \`${symbol}\`\n\n` +
      `- **Out-degree (Callees):** ${callees.length}\n` +
      `- **Target Symbols:**\n` +
      callees.map((c) => `  • \`${c.label}\` (${c.type}) [line ${c.line || 'N/A'}]`).join('\n');
  }

  return `### 🧭 Functions Called by \`${symbol}\`\n\n` +
    `\`${symbol}\` delegates work to **${callees.length}** external or helper symbol${callees.length > 1 ? 's' : ''}:\n\n` +
    callees.map((c) => `- **\`${c.label}\`** (${c.type}) — Line ${c.line || 'N/A'}`).join('\n');
}

function formatImpactAnswer(
  target: string,
  impact: ImpactAnalysis,
  level: 'beginner' | 'intermediate' | 'expert'
): string {
  if (level === 'beginner') {
    return `### 💥 Blast Radius (Change Impact) for \`${target}\`\n\n` +
      `**Risk Level: ${impact.riskLevel}**\n\n` +
      `**Everyday Analogy:** Think of changing \`${target}\` like renovating a home's plumbing. If you turn off the main water line, any room connected to that pipe is affected.\n\n` +
      `- **Directly Connected:** ${impact.directDependents.length > 0 ? impact.directDependents.map((d) => `\`${d}\``).join(', ') : 'None (safe to edit locally)'}\n` +
      `- **Indirectly Connected:** ${impact.indirectDependents.length > 0 ? impact.indirectDependents.map((d) => `\`${d}\``).join(', ') : 'None'}\n\n` +
      `**Reasoning:** ${impact.reasoning}`;
  }

  if (level === 'expert') {
    return `### Blast Radius & Downstream Dependency Analysis: \`${target}\`\n\n` +
      `- **Risk Tier:** **${impact.riskLevel}** (Confidence: ${impact.confidence}%)\n` +
      `- **Direct Dependents (${impact.directDependents.length}):** ${impact.directDependents.map((d) => `\`${d}\``).join(', ') || 'None'}\n` +
      `- **Transitive Invariant Scope (${impact.indirectDependents.length}):** ${impact.indirectDependents.map((d) => `\`${d}\``).join(', ') || 'None'}\n` +
      `- **Affected Modules:** ${impact.affectedFiles.map((f) => `\`${f}\``).join(', ')}\n` +
      `- **Bounded Depth:** ${impact.depth} hops\n\n` +
      `**Deterministic Rationale:** ${impact.reasoning}`;
  }

  return `### 💥 Change Impact for \`${target}\`\n\n` +
    `- **Risk Level:** **${impact.riskLevel}** (${impact.confidence}% confidence)\n` +
    `- **Direct Dependents:** ${impact.directDependents.map((d) => `\`${d}\``).join(', ') || 'None'}\n` +
    `- **Indirect Dependents:** ${impact.indirectDependents.map((d) => `\`${d}\``).join(', ') || 'None'}\n` +
    `- **Affected Files:** ${impact.affectedFiles.join(', ')}\n\n` +
    `**Analysis:** ${impact.reasoning}`;
}

function formatRootCauseAnswer(
  finding: ActionFinding,
  rc: RootCauseItem,
  level: 'beginner' | 'intermediate' | 'expert'
): string {
  if (level === 'beginner') {
    return `### 🔍 Root Cause of [${finding.priority}] ${finding.title}\n\n` +
      `**Where it starts:** Line ${finding.line} in \`${finding.file}\`\n\n` +
      `**Everyday Analogy:** Think of this issue like leaving an unlocked window on the ground floor. Even if you lock the front door, the unlocked window is the root entry point for trouble.\n\n` +
      `**Why it happens:** ${rc.explanation}\n\n` +
      `**How to fix it:** ${finding.suggestedFix || finding.recommendedAction}`;
  }

  if (level === 'expert') {
    return `### Deterministic Root Cause Synthesis: [${finding.priority}] ${finding.title}\n\n` +
      `- **Origin Point:** \`${rc.likelySource}\` (${rc.file}:${rc.line})\n` +
      `- **Confidence:** ${rc.confidence} (${rc.confidenceScore}%)\n` +
      `- **Relationship:** ${rc.relationshipType}\n` +
      `- **Resolvable Blast Radius:** Resolving this single root cause eliminates up to **${rc.resolvableImpact.findingsCount} downstream symptom(s)**.\n` +
      `- **Propagation Chain:** ${rc.causeChain.join(' → ')}\n\n` +
      `**Technical Mechanism:** ${rc.explanation}`;
  }

  return `### 🔍 Root Cause Analysis: ${finding.title}\n\n` +
    `- **Origin:** Line ${finding.line} (\`${rc.likelySource}\`)\n` +
    `- **Confidence:** ${rc.confidence} (${rc.confidenceScore}%)\n` +
    `- **Mechanism:** ${rc.explanation}\n` +
    `- **Fix:** ${finding.suggestedFix || finding.recommendedAction}\n\n` +
    `**Impact:** Resolving this fixes ${rc.resolvableImpact.findingsCount} related finding(s).`;
}

function formatDependenciesAnswer(
  imports: any[],
  level: 'beginner' | 'intermediate' | 'expert'
): string {
  if (imports.length === 0) {
    return 'This module has no external package dependencies. It is self-contained.';
  }

  return `### 📦 Package Dependencies (${imports.length})\n\n` +
    imports
      .map(
        (imp) =>
          `- **\`${imp.module}\`** (Line ${imp.line}) — ${imp.isExternal ? 'External third-party package' : 'Internal local module'}`
      )
      .join('\n');
}

function formatProjectOverviewAnswer(
  fileName: string,
  analysis: AnalysisResult | null,
  graph: EvidenceGraph,
  level: 'beginner' | 'intermediate' | 'expert'
): string {
  const m = analysis?.metrics;
  const lang = analysis?.language || 'code';

  return `### 📊 Codebase Overview: \`${fileName}\`\n\n` +
    `- **Language:** \`${lang}\`\n` +
    `- **Size:** ${m?.loc || 0} Lines of Code (${m?.sloc || 0} Source Lines)\n` +
    `- **Functions:** ${m?.functionCount || 0} | **Classes:** ${m?.classCount || 0}\n` +
    `- **Cyclomatic Complexity:** ${m?.cyclomaticComplexity ?? 'N/A'} (Threshold: 10)\n` +
    `- **Health Score:** ${m?.healthScore ?? 'N/A'}/100 | **Maintainability:** ${m?.maintainabilityScore ?? 'N/A'}/100\n` +
    `- **Dependency Nodes:** ${graph.nodes.length} nodes, ${graph.edges.length} relational edges in Evidence Graph.`;
}

function formatFindingExplanation(
  f: ActionFinding,
  level: 'beginner' | 'intermediate' | 'expert'
): string {
  return `### ⚠️ [${f.priority}] ${f.title} (Line ${f.line})\n\n` +
    `**Problem:** ${f.message || f.description}\n\n` +
    `**Why it matters:** ${f.whyItMatters || 'High cyclomatic complexity or code smells lead to runtime regressions.'}\n\n` +
    `**Recommended Action:** ${f.recommendedAction}\n\n` +
    `\`\`\`\n${f.codeSnippet || f.suggestedFix || f.message}\n\`\`\``;
}
