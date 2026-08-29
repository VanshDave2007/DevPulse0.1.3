/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClarificationQuestion, RepositoryQueryIntent } from '../types';
import { redactSecrets } from './evidenceGraphService';

export interface IntentClassificationResult {
  intent: RepositoryQueryIntent;
  targetSymbol?: string;
  targetFile?: string;
  targetFindingId?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number; // 0 - 100
  clarification?: ClarificationQuestion;
  keywords: string[];
  rawQuery: string;
}

export class QueryIntentEngine {
  /**
   * Classifies a natural language query about the codebase into a structured intent
   * and extracts target entities (symbol, file, finding, etc.).
   */
  public static classifyIntent(
    query: string,
    context?: {
      activeFile?: string;
      activeSymbol?: string;
      activeFindingId?: string;
      knownSymbols?: string[];
      knownFiles?: string[];
      knownFindingIds?: string[];
    }
  ): IntentClassificationResult {
    const raw = (query || '').trim();
    const clean = redactSecrets(raw);
    const lower = clean.toLowerCase();

    // 1. Extract potential target symbol / file / finding
    let targetSymbol = context?.activeSymbol;
    let targetFile = context?.activeFile;
    let targetFindingId = context?.activeFindingId;

    // Check if query mentions a specific finding ID
    const findingMatch = clean.match(/(?:finding|smell|issue|rule|f-)\s*#?([A-Za-z0-9_-]+)/i);
    if (findingMatch) {
      targetFindingId = findingMatch[1];
    }

    // Check if known symbols or quotes are in query
    const quotedMatch = clean.match(/['"`]([a-zA-Z0-9_.:]+)['"`]/);
    if (quotedMatch) {
      targetSymbol = quotedMatch[1];
    } else if (context?.knownSymbols && context.knownSymbols.length > 0) {
      for (const sym of context.knownSymbols) {
        if (lower.includes(sym.toLowerCase())) {
          targetSymbol = sym;
          break;
        }
      }
    }

    // Check if known files are in query
    if (context?.knownFiles && context.knownFiles.length > 0) {
      for (const f of context.knownFiles) {
        if (lower.includes(f.toLowerCase())) {
          targetFile = f;
          break;
        }
      }
    }

    // Fallback extraction for identifier-like words (e.g. "OrderProcessor", "process_bulk_orders")
    if (!targetSymbol) {
      const words = clean.split(/\s+/);
      for (const w of words) {
        const stripped = w.replace(/[?!.,;:()]/g, '');
        if (/^[A-Z][a-zA-Z0-9_]+$/.test(stripped) || (/^[a-z][a-z0-9_]+_[a-z0-9_]+$/.test(stripped) && stripped.length > 4)) {
          if (!['Where', 'What', 'How', 'When', 'Why', 'Who', 'Which', 'Find', 'Show', 'Explain', 'Search'].includes(stripped)) {
            targetSymbol = stripped;
            break;
          }
        }
      }
    }

    // 2. Intent matching with prioritization
    // Impact / Blast Radius
    if (
      lower.includes('blast radius') ||
      lower.includes('change impact') ||
      lower.includes('what breaks if') ||
      lower.includes('what happens if i change') ||
      lower.includes('impact of changing') ||
      lower.includes('affect if i modify') ||
      lower.includes('impact analysis')
    ) {
      return {
        intent: 'CHANGE_IMPACT',
        targetSymbol,
        targetFile,
        confidence: targetSymbol ? 'HIGH' : 'MEDIUM',
        confidenceScore: targetSymbol ? 95 : 75,
        keywords: ['impact', 'blast radius', 'breakage'],
        rawQuery: clean,
      };
    }

    // Root Cause Analysis
    if (
      lower.includes('root cause') ||
      lower.includes('why is this happening') ||
      lower.includes('origin of this error') ||
      lower.includes('cause of this finding') ||
      lower.includes('why is the pipeline failing') ||
      lower.includes('where does the bug come from')
    ) {
      return {
        intent: 'ROOT_CAUSE',
        targetSymbol,
        targetFindingId,
        confidence: 'HIGH',
        confidenceScore: 92,
        keywords: ['root cause', 'origin', 'failure'],
        rawQuery: clean,
      };
    }

    // Callers / Invocations
    if (
      lower.includes('who calls') ||
      lower.includes('what calls') ||
      lower.includes('where is this called') ||
      lower.includes('invoked by') ||
      lower.includes('incoming calls') ||
      lower.includes('callers of') ||
      lower.includes('caller')
    ) {
      return {
        intent: 'CALLERS',
        targetSymbol,
        confidence: targetSymbol ? 'HIGH' : 'MEDIUM',
        confidenceScore: targetSymbol ? 96 : 70,
        keywords: ['callers', 'incoming', 'invocation'],
        rawQuery: clean,
      };
    }

    // Callees / Outgoing Invocations
    if (
      lower.includes('what does this call') ||
      lower.includes('what functions does') ||
      lower.includes('callees of') ||
      lower.includes('outgoing calls') ||
      lower.includes('what is invoked inside') ||
      lower.includes('calls from')
    ) {
      return {
        intent: 'CALLEES',
        targetSymbol,
        confidence: targetSymbol ? 'HIGH' : 'MEDIUM',
        confidenceScore: targetSymbol ? 95 : 70,
        keywords: ['callees', 'calls', 'outgoing'],
        rawQuery: clean,
      };
    }

    // Dependents / Usages
    if (
      lower.includes('who depends on') ||
      lower.includes('what depends on') ||
      lower.includes('what files import') ||
      lower.includes('where is this imported') ||
      lower.includes('dependents of')
    ) {
      return {
        intent: 'DEPENDENTS',
        targetSymbol: targetSymbol || targetFile,
        targetFile,
        confidence: 'HIGH',
        confidenceScore: 90,
        keywords: ['dependents', 'importers', 'downstream'],
        rawQuery: clean,
      };
    }

    // Dependencies / Imports / Packages
    if (
      lower.includes('what dependencies') ||
      lower.includes('what does this depend on') ||
      lower.includes('what packages') ||
      lower.includes('external libraries') ||
      lower.includes('imports of') ||
      lower.includes('what modules are imported')
    ) {
      return {
        intent: 'DEPENDENCIES',
        targetSymbol: targetSymbol || targetFile,
        targetFile,
        confidence: 'HIGH',
        confidenceScore: 92,
        keywords: ['dependencies', 'imports', 'modules'],
        rawQuery: clean,
      };
    }

    // Authentication / Security Paths
    if (
      lower.includes('where is auth') ||
      lower.includes('authentication') ||
      lower.includes('how is login handled') ||
      lower.includes('token verification') ||
      lower.includes('user session') ||
      lower.includes('password') ||
      lower.includes('jwt') ||
      lower.includes('permission check')
    ) {
      return {
        intent: 'AUTHENTICATION',
        targetSymbol,
        confidence: 'HIGH',
        confidenceScore: 95,
        keywords: ['auth', 'authentication', 'session', 'security'],
        rawQuery: clean,
      };
    }

    // Security Vulnerabilities / CVE
    if (
      lower.includes('vulnerability') ||
      lower.includes('cve') ||
      lower.includes('sql injection') ||
      lower.includes('security risk') ||
      lower.includes('eval') ||
      lower.includes('xss') ||
      lower.includes('security flaw') ||
      lower.includes('security finding')
    ) {
      return {
        intent: 'VULNERABILITY',
        targetSymbol,
        targetFindingId,
        confidence: 'HIGH',
        confidenceScore: 94,
        keywords: ['security', 'vulnerability', 'injection'],
        rawQuery: clean,
      };
    }

    // Database Usage
    if (
      lower.includes('database') ||
      lower.includes('sql') ||
      lower.includes('query') ||
      lower.includes('db connection') ||
      lower.includes('where is data saved') ||
      lower.includes('table') ||
      lower.includes('repository pattern') ||
      lower.includes('where are queries')
    ) {
      return {
        intent: 'DATABASE_USAGE',
        targetSymbol,
        confidence: 'HIGH',
        confidenceScore: 92,
        keywords: ['database', 'queries', 'sql', 'storage'],
        rawQuery: clean,
      };
    }

    // Data Flow / Taint Tracking
    if (
      lower.includes('data flow') ||
      lower.includes('how does data flow') ||
      lower.includes('where does the input go') ||
      lower.includes('how is payload passed') ||
      lower.includes('trace data')
    ) {
      return {
        intent: 'DATA_FLOW',
        targetSymbol,
        confidence: 'HIGH',
        confidenceScore: 90,
        keywords: ['data flow', 'pipeline', 'flow'],
        rawQuery: clean,
      };
    }

    // Test Generation Request
    if (
      lower.includes('generate a test') ||
      lower.includes('generate test') ||
      lower.includes('write a test') ||
      lower.includes('create test') ||
      lower.includes('write unit test')
    ) {
      return {
        intent: 'TEST_GENERATION',
        targetSymbol,
        targetFile,
        confidence: 'HIGH',
        confidenceScore: 96,
        keywords: ['generate test', 'unit test', 'candidate test'],
        rawQuery: clean,
      };
    }

    // Test Gap Analysis / Untested Behavior
    if (
      lower.includes('untested') ||
      lower.includes('what behavior is untested') ||
      lower.includes('test gap') ||
      lower.includes('why is this branch uncovered') ||
      lower.includes('missing tests') ||
      lower.includes('uncovered branch') ||
      lower.includes('untested path')
    ) {
      return {
        intent: 'TEST_GAP_ANALYSIS',
        targetSymbol,
        targetFile,
        confidence: 'HIGH',
        confidenceScore: 94,
        keywords: ['test gap', 'untested', 'uncovered branch'],
        rawQuery: clean,
      };
    }

    // Regression Check / Run After Change
    if (
      lower.includes('regression') ||
      lower.includes('which tests should i run') ||
      lower.includes('did this change reduce coverage') ||
      lower.includes('what regressions were detected') ||
      lower.includes('broken tests') ||
      lower.includes('tests to run after')
    ) {
      return {
        intent: 'REGRESSION_CHECK',
        targetSymbol,
        targetFile,
        confidence: 'HIGH',
        confidenceScore: 93,
        keywords: ['regression', 'impacted tests', 'coverage reduction'],
        rawQuery: clean,
      };
    }

    // Test Discovery & Coverage
    if (
      lower.includes('which tests cover') ||
      lower.includes('what tests cover') ||
      lower.includes('find tests for') ||
      lower.includes('test coverage') ||
      lower.includes('tested by') ||
      lower.includes('test') ||
      lower.includes('unit test') ||
      lower.includes('spec')
    ) {
      return {
        intent: lower.includes('which tests cover') || lower.includes('find tests for') ? 'TEST_DISCOVERY' : 'TEST_COVERAGE',
        targetSymbol,
        targetFile,
        confidence: 'HIGH',
        confidenceScore: 92,
        keywords: ['test', 'coverage', 'unit test', 'suite'],
        rawQuery: clean,
      };
    }

    // Specific Finding Explanation
    if (
      (targetFindingId || lower.includes('finding') || lower.includes('smell') || lower.includes('why is this a warning')) &&
      (lower.includes('explain') || lower.includes('what is') || lower.includes('tell me about'))
    ) {
      return {
        intent: 'FINDING_EXPLANATION',
        targetFindingId: targetFindingId || context?.activeFindingId,
        targetSymbol,
        confidence: 'HIGH',
        confidenceScore: 95,
        keywords: ['finding', 'smell', 'explanation'],
        rawQuery: clean,
      };
    }

    // Code Location / "Where is X defined/handled?"
    if (
      lower.startsWith('where is') ||
      lower.startsWith('where are') ||
      lower.includes('where can i find') ||
      lower.includes('locate') ||
      lower.includes('file for')
    ) {
      return {
        intent: 'CODE_LOCATION',
        targetSymbol,
        confidence: targetSymbol ? 'HIGH' : 'MEDIUM',
        confidenceScore: targetSymbol ? 94 : 72,
        keywords: ['location', 'definition', 'where'],
        rawQuery: clean,
      };
    }

    // Architecture & High-Level Structure
    if (
      lower.includes('architecture') ||
      lower.includes('high level design') ||
      lower.includes('system design') ||
      lower.includes('how is this structured') ||
      lower.includes('layers') ||
      lower.includes('module layout')
    ) {
      return {
        intent: 'ARCHITECTURE',
        targetSymbol: targetSymbol || targetFile,
        confidence: 'HIGH',
        confidenceScore: 93,
        keywords: ['architecture', 'design', 'structure'],
        rawQuery: clean,
      };
    }

    // Project Overview / Summary
    if (
      lower.includes('project overview') ||
      lower.includes('summarize this codebase') ||
      lower.includes('what does this app do') ||
      lower.includes('codebase summary') ||
      lower.includes('tell me about this project') ||
      lower === 'overview' ||
      lower === 'summary'
    ) {
      return {
        intent: 'PROJECT_OVERVIEW',
        confidence: 'HIGH',
        confidenceScore: 95,
        keywords: ['overview', 'summary', 'purpose'],
        rawQuery: clean,
      };
    }

    // File Relationship
    if (
      lower.includes('how do files connect') ||
      lower.includes('file relationships') ||
      lower.includes('graph of files')
    ) {
      return {
        intent: 'FILE_RELATIONSHIP',
        confidence: 'HIGH',
        confidenceScore: 90,
        keywords: ['relationships', 'files', 'connections'],
        rawQuery: clean,
      };
    }

    // Code Explanation
    if (
      lower.includes('how does') ||
      lower.includes('explain') ||
      lower.includes('what does') ||
      lower.includes('walk me through')
    ) {
      return {
        intent: 'CODE_EXPLANATION',
        targetSymbol,
        confidence: 'HIGH',
        confidenceScore: 88,
        keywords: ['explanation', 'logic', 'walkthrough'],
        rawQuery: clean,
      };
    }

    // Search query
    if (lower.startsWith('find ') || lower.startsWith('search ') || lower.startsWith('lookup ')) {
      const searchTarget = clean.replace(/^(find|search|lookup)\s+/i, '');
      return {
        intent: 'SEARCH',
        targetSymbol: searchTarget,
        confidence: 'HIGH',
        confidenceScore: 88,
        keywords: ['search', 'find'],
        rawQuery: clean,
      };
    }

    // Fallback Unknown
    return {
      intent: 'UNKNOWN',
      targetSymbol,
      confidence: 'LOW',
      confidenceScore: 40,
      keywords: ['general'],
      rawQuery: clean,
    };
  }

  /**
   * Generates a clarification question when the query has multiple ambiguous candidates.
   */
  public static generateClarification(
    query: string,
    candidates: Array<{ id: string; name: string; type: string; file?: string }>
  ): ClarificationQuestion | null {
    if (!candidates || candidates.length <= 1) return null;

    return {
      id: `clarify-${Date.now()}`,
      question: `Multiple symbols match "${query}". Which one would you like to inspect?`,
      options: candidates.slice(0, 4).map((c) => ({
        id: c.id,
        label: `${c.name} (${c.type})`,
        description: c.file ? `Defined in ${c.file}` : undefined,
      })),
    };
  }
}
