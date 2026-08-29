import {
  AgentFinding,
  CallGraphResult,
  GitDiffResult,
  ImpactResult,
  ProgramSymbol,
  RAGDocument,
  SQLQueryResult,
  SupportedLanguage,
  VulnerabilityScanResult,
} from '../../types';
import { parseUnifiedDiff } from './gitAnalyzer';
import { extractSymbols } from './symbolAnalyzer';
import { buildCallGraph, findDirectCallees, findDirectCallers, findTransitiveImpact } from './callGraphEngine';
import { detectContractChanges } from './contractDetector';
import { scanManifestForVulnerabilities } from './vulnerabilityScanner';
import { searchRAG } from './ragEngine';
import { executeSafeReadOnlyQuery } from './textToSqlEngine';
import { calculateImpact } from './impactEngine';
import { analyzeCode } from '../analyzer';

export interface AgentToolRegistry {
  get_git_diff: (rawDiff: string) => GitDiffResult;
  get_symbol: (name: string, symbols: ProgramSymbol[]) => ProgramSymbol | undefined;
  find_callers: (name: string, symbols: ProgramSymbol[]) => ProgramSymbol[];
  find_callees: (name: string, symbols: ProgramSymbol[]) => ProgramSymbol[];
  get_call_graph: (symbols: ProgramSymbol[]) => CallGraphResult;
  get_impact_analysis: (
    modifiedSymbols: ProgramSymbol[],
    allSymbols: ProgramSymbol[],
    changedCode: string,
    callerCode: string,
    callerFileName: string
  ) => ImpactResult;
  search_rag: (query: string, symbols?: string[], files?: string[]) => RAGDocument[];
  query_database: (sql: string) => SQLQueryResult;
  scan_vulnerabilities: (manifestName: string, content: string, symbols: ProgramSymbol[], code: string) => VulnerabilityScanResult;
  run_static_analysis: (code: string, language: SupportedLanguage) => any;
}

export const AgentTools: AgentToolRegistry = {
  get_git_diff(rawDiff: string) {
    return parseUnifiedDiff(rawDiff);
  },

  get_symbol(name: string, symbols: ProgramSymbol[]) {
    return symbols.find((s) => s.name === name || s.qualifiedName === name);
  },

  find_callers(name: string, symbols: ProgramSymbol[]) {
    return findDirectCallers(name, symbols);
  },

  find_callees(name: string, symbols: ProgramSymbol[]) {
    return findDirectCallees(name, symbols);
  },

  get_call_graph(symbols: ProgramSymbol[]) {
    return buildCallGraph(symbols);
  },

  get_impact_analysis(
    modifiedSymbols: ProgramSymbol[],
    allSymbols: ProgramSymbol[],
    changedCode: string,
    callerCode: string,
    callerFileName: string
  ) {
    const targetNames = modifiedSymbols.map((s) => s.name);
    const { directCallers, indirectCallers, impactedFiles } = findTransitiveImpact(targetNames, allSymbols);
    const callerFileCodes = new Map<string, string>([[callerFileName, callerCode]]);
    const contractDiffs = detectContractChanges(allSymbols, modifiedSymbols, directCallers, callerFileCodes);
    const emptyVulns: VulnerabilityScanResult = {
      totalVulnerabilities: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      vulnerabilities: [],
      scannedManifests: [],
    };
    return calculateImpact(
      modifiedSymbols,
      directCallers,
      indirectCallers,
      contractDiffs,
      emptyVulns,
      Array.from(impactedFiles)
    );
  },

  search_rag(query: string, symbols: string[] = [], files: string[] = []) {
    return searchRAG(query, symbols, files);
  },

  query_database(sql: string) {
    return executeSafeReadOnlyQuery(sql);
  },

  scan_vulnerabilities(manifestName: string, content: string, symbols: ProgramSymbol[], code: string) {
    return scanManifestForVulnerabilities(manifestName, content, symbols, code);
  },

  run_static_analysis(code: string, language: SupportedLanguage) {
    return analyzeCode(code, language);
  },
};
