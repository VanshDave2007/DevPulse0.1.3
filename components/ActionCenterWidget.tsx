/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ActionFinding,
  ActionFindingCategory,
  FalsePositiveReason,
  FindingPriority,
  FindingStatus,
} from '../types';
import {
  applyStoredStatuses,
  fuseAndDeduplicateFindings,
  normalizeAgentFindings,
  normalizeCodeSmells,
  normalizeVulnerabilities,
  saveFindingStatus,
  sortFindingsByPriority,
} from '../engine/actionCenter';
import { TestIntelligenceService } from '../services/testIntelligenceService';
import { FindingDetailModal } from './FindingDetailModal';
import { PulseMascot } from './PulseMascot';
import { TestCoverageHeatmap } from './TestCoverageHeatmap';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  ExternalLink,
  Filter,
  Flame,
  Info,
  Layers,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TestTube2,
  Zap,
} from 'lucide-react';

export const ActionCenterWidget: React.FC = () => {
  const {
    analysis,
    code,
    fileName,
    personalizationProfile,
    setActiveTab,
    sendAiRequest,
    openFixModalForFinding,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ACTIVE'); // ACTIVE = OPEN + IN_REVIEW
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFinding, setSelectedFinding] = useState<ActionFinding | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showTestIntelligence, setShowTestIntelligence] = useState(true);

  // Synthesize and normalize all findings across static analysis, CVEs, and agentic review
  const allActionFindings = useMemo(() => {
    const rawSmells = analysis?.smells || [];
    const rawVulns = analysis?.vulnerabilities || [];
    const rawAgentFindings = (analysis as any)?.agentReview?.findings || [];

    const smellsNorm = normalizeCodeSmells(rawSmells, fileName, analysis?.metrics);
    const vulnsNorm = normalizeVulnerabilities(rawVulns, 'package.json');
    const agentNorm = normalizeAgentFindings(rawAgentFindings);

    const merged = fuseAndDeduplicateFindings([...smellsNorm, ...vulnsNorm, ...agentNorm]);
    const withStatuses = applyStoredStatuses(merged);
    return sortFindingsByPriority(withStatuses);
  }, [analysis, fileName, refreshTrigger]);

  // Test Intelligence computation: Framework, discovered tests, coverage telemetry, and test gaps
  const testIntelligence = useMemo(() => {
    const fw = TestIntelligenceService.detectTestFramework(code, fileName);
    const discovered = TestIntelligenceService.discoverTests(code, fileName, fw);
    const coverage = TestIntelligenceService.analyzeCoverage(code, fileName, discovered, [1, 5, 10]);
    const gaps = TestIntelligenceService.detectTestGaps(code, fileName, analysis, discovered, allActionFindings);
    return {
      framework: fw,
      discoveredTests: discovered,
      coverage,
      gaps,
    };
  }, [code, fileName, analysis, allActionFindings]);

  // File Risk & Coverage Heatmap Matrix
  const heatmapData = useMemo(() => {
    return TestIntelligenceService.generateHeatmapMetrics(
      code,
      fileName,
      'typescript',
      analysis,
      allActionFindings
    );
  }, [code, fileName, analysis, allActionFindings]);

  // Filter findings
  const filteredFindings = useMemo(() => {
    return allActionFindings.filter((f) => {
      // 1. Status Filter
      if (selectedStatusFilter === 'ACTIVE') {
        if (f.status === 'FIXED' || f.status === 'FALSE_POSITIVE' || f.status === 'DEFERRED') return false;
      } else if (selectedStatusFilter !== 'ALL') {
        if (f.status !== selectedStatusFilter) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'ALL' && f.category !== selectedCategory) {
        return false;
      }

      // 3. Priority Filter
      if (selectedPriority !== 'ALL' && f.priority !== selectedPriority) {
        return false;
      }

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = f.title.toLowerCase().includes(q);
        const matchMsg = f.message.toLowerCase().includes(q);
        const matchFile = f.file.toLowerCase().includes(q);
        const matchCat = f.category.toLowerCase().includes(q);
        return matchTitle || matchMsg || matchFile || matchCat;
      }

      return true;
    });
  }, [allActionFindings, selectedCategory, selectedPriority, selectedStatusFilter, searchQuery]);

  const activeCount = allActionFindings.filter(
    (f) => f.status !== 'FIXED' && f.status !== 'FALSE_POSITIVE' && f.status !== 'DEFERRED'
  ).length;

  const criticalCount = allActionFindings.filter(
    (f) => f.priority === 'CRITICAL' && f.status !== 'FIXED' && f.status !== 'FALSE_POSITIVE'
  ).length;

  const highCount = allActionFindings.filter(
    (f) => f.priority === 'HIGH' && f.status !== 'FIXED' && f.status !== 'FALSE_POSITIVE'
  ).length;

  const handleStatusChange = (
    findingId: string,
    status: FindingStatus,
    feedback?: { reason?: FalsePositiveReason; notes?: string }
  ) => {
    saveFindingStatus(findingId, status, feedback);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleJumpToCode = (file: string, line: number) => {
    setActiveTab('analyzer');
  };

  const handleFixWithAi = (finding: ActionFinding) => {
    openFixModalForFinding(finding);
  };

  const priorityBadgeStyle: Record<FindingPriority, string> = {
    CRITICAL: 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30',
    HIGH: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
    MEDIUM: 'bg-teal-500/20 text-teal-600 dark:text-teal-300 border-teal-500/30',
    LOW: 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30',
    INFO: 'bg-pulse-elevated text-pulse-muted border-pulse-subtle',
  };

  return (
    <section className="rounded-3xl border border-pulse-subtle bg-pulse-surface p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-lg sm:text-xl font-bold text-pulse-primary font-sans">
                Action Center
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                {activeCount} Actionable
              </span>
            </div>
            <p className="text-xs text-pulse-secondary mt-0.5">
              Intelligent findings ranked by Severity × Confidence × Reachability × Impact
            </p>
          </div>
        </div>

        {/* Priority Quick Counters & CI Gate Trigger */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('health')}
            className="px-2.5 py-1 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30 hover:bg-teal-500/25 transition flex items-center space-x-1.5 cursor-pointer"
            title="Inspect CI/CD Quality Gate & Verification Status"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
            <span>CI Gate</span>
          </button>
          <span className="px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <strong>{criticalCount}</strong> Critical
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <strong>{highCount}</strong> High
          </span>
          <button
            onClick={() => setActiveTab('analyzer')}
            className="px-3 py-1 rounded-xl bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-pulse-accent transition flex items-center space-x-1 cursor-pointer"
          >
            <span>Full Analyzer</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-full lg:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-pulse-muted" />
          <input
            type="text"
            placeholder="Search findings by keyword, file, or rule..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs text-pulse-primary placeholder:text-pulse-muted focus:outline-none focus:border-teal-500/50"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by category"
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs font-mono text-pulse-secondary cursor-pointer focus:outline-none min-w-[130px]"
          >
            <option value="ALL">All Categories</option>
            <option value="SECURITY">Security</option>
            <option value="ARCHITECTURE">Architecture</option>
            <option value="QUALITY">Quality</option>
            <option value="MAINTAINABILITY">Maintainability</option>
            <option value="DEPENDENCY">Dependency</option>
            <option value="PERFORMANCE">Performance</option>
            <option value="TESTING">Testing</option>
          </select>

          {/* Priority Dropdown */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            aria-label="Filter by priority tier"
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs font-mono text-pulse-secondary cursor-pointer focus:outline-none min-w-[120px]"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Status Segment */}
          <div className="flex items-center p-1 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs font-mono shrink-0">
            <button
              onClick={() => setSelectedStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                selectedStatusFilter === 'ACTIVE'
                  ? 'bg-teal-500 text-[#08110F] font-bold'
                  : 'text-pulse-muted hover:text-pulse-primary'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setSelectedStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                selectedStatusFilter === 'ALL'
                  ? 'bg-teal-500 text-[#08110F] font-bold'
                  : 'text-pulse-muted hover:text-pulse-primary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedStatusFilter('FIXED')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                selectedStatusFilter === 'FIXED'
                  ? 'bg-teal-500 text-[#08110F] font-bold'
                  : 'text-pulse-muted hover:text-pulse-primary'
              }`}
            >
              Resolved
            </button>
          </div>
        </div>
      </div>

      {/* 2.5. Test Intelligence & Potential Test Gaps Section */}
      <div className="rounded-2xl border border-pulse-subtle bg-pulse-elevated/80 overflow-hidden">
        <button
          onClick={() => setShowTestIntelligence(!showTestIntelligence)}
          className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-pulse-elevated transition cursor-pointer text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400">
              <TestTube2 className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-pulse-primary">Test Intelligence</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/15 text-teal-400 border border-teal-500/20 font-bold">
                  {testIntelligence.framework.name} ({testIntelligence.framework.syntaxStyle})
                </span>
                {testIntelligence.gaps.length > 0 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {testIntelligence.gaps.length} Potential Test Gaps
                  </span>
                )}
              </div>
              <p className="text-xs text-pulse-secondary mt-0.5">
                Relevant changed-code coverage metrics & automated gap detection
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 text-xs font-mono">
              <span className="text-pulse-muted">Changed-Code Cov:</span>
              <strong className="text-teal-400">
                {testIntelligence.coverage.changedCodeCoverage?.percentage ?? testIntelligence.coverage.lines}%
              </strong>
            </div>
            {showTestIntelligence ? (
              <ChevronUp className="h-4 w-4 text-pulse-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 text-pulse-muted" />
            )}
          </div>
        </button>

        {showTestIntelligence && (
          <div className="p-4 sm:p-5 pt-0 border-t border-pulse-subtle/50 space-y-4 animate-fadeIn">
            {/* Relevant Changed-Code Coverage Telemetry Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle space-y-1">
                <span className="text-[10px] font-mono uppercase text-pulse-muted">Line Coverage</span>
                <div className="text-base sm:text-lg font-bold text-pulse-primary font-mono">
                  {testIntelligence.coverage.lines}%
                </div>
                <div className="w-full bg-pulse-subtle h-1.5 rounded-full overflow-hidden">
                  <div className="bg-teal-400 h-full rounded-full" style={{ width: `${testIntelligence.coverage.lines}%` }} />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle space-y-1">
                <span className="text-[10px] font-mono uppercase text-pulse-muted">Changed-Code Cov</span>
                <div className="text-base sm:text-lg font-bold text-teal-400 font-mono">
                  {testIntelligence.coverage.changedCodeCoverage?.percentage ?? testIntelligence.coverage.lines}%
                </div>
                <div className="w-full bg-pulse-subtle h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${testIntelligence.coverage.changedCodeCoverage?.percentage ?? testIntelligence.coverage.lines}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle space-y-1">
                <span className="text-[10px] font-mono uppercase text-pulse-muted">Branch Coverage</span>
                <div className="text-base sm:text-lg font-bold text-pulse-primary font-mono">
                  {testIntelligence.coverage.branches}%
                </div>
                <div className="w-full bg-pulse-subtle h-1.5 rounded-full overflow-hidden">
                  <div className="bg-sky-400 h-full rounded-full" style={{ width: `${testIntelligence.coverage.branches}%` }} />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle space-y-1">
                <span className="text-[10px] font-mono uppercase text-pulse-muted">Functions Covered</span>
                <div className="text-base sm:text-lg font-bold text-pulse-primary font-mono">
                  {testIntelligence.coverage.testedFunctionsCount}/{testIntelligence.coverage.totalFunctionsCount}
                </div>
                <div className="w-full bg-pulse-subtle h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-400 h-full rounded-full" style={{ width: `${testIntelligence.coverage.functions}%` }} />
                </div>
              </div>
            </div>

            {/* Potential Test Gaps List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase font-bold text-pulse-muted flex items-center space-x-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  <span>Potential Test Gaps ({testIntelligence.gaps.length})</span>
                </h4>
                <span className="text-[11px] font-mono text-pulse-muted">
                  Identified in {fileName}
                </span>
              </div>

              {testIntelligence.gaps.length > 0 ? (
                <div className="space-y-2">
                  {testIntelligence.gaps.slice(0, 3).map((gap) => (
                    <div
                      key={gap.id}
                      className="p-3 sm:p-3.5 rounded-xl bg-pulse-surface border border-pulse-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                              gap.priority === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-400'
                                : gap.priority === 'HIGH'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-teal-500/20 text-teal-400'
                            }`}
                          >
                            {gap.priority}
                          </span>
                          <span className="font-bold text-pulse-primary">{gap.title}</span>
                          <span className="text-[10px] font-mono text-pulse-muted">L{gap.line}</span>
                        </div>
                        <p className="text-pulse-secondary text-[11px] leading-relaxed line-clamp-1">
                          {gap.missingBehavior}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          sendAiRequest(
                            'fixes',
                            `Generate comprehensive test suite addressing this test gap: ${gap.title}\nMissing behavior: ${gap.missingBehavior}\nSuggested test: ${gap.suggestedTest}\nFile: ${gap.targetFile}`
                          );
                          setActiveTab('pulse-ai');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-400 text-[11px] font-medium transition cursor-pointer shrink-0 self-start sm:self-auto flex items-center space-x-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Generate Test</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle text-xs text-emerald-400 flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>All key code paths and functions have active test coverage telemetry.</span>
                </div>
              )}
            </div>

            {/* Test Coverage vs. Risk Heatmap Grid */}
            <div className="pt-3 border-t border-pulse-subtle/50">
              <TestCoverageHeatmap
                metrics={heatmapData.metrics}
                stats={heatmapData.stats}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Prioritized Finding Cards */}
      {filteredFindings.length > 0 ? (
        <div className="space-y-3">
          {filteredFindings.slice(0, 10).map((finding) => {
            const isClosed =
              finding.status === 'FIXED' ||
              finding.status === 'FALSE_POSITIVE' ||
              finding.status === 'DEFERRED';

            return (
              <div
                key={finding.id}
                className={`p-4 sm:p-5 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 group ${
                  isClosed
                    ? 'bg-pulse-elevated/40 border-pulse-subtle opacity-70'
                    : 'bg-pulse-elevated border-pulse-subtle hover:border-pulse-strong'
                }`}
              >
                {/* Finding Details */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                        priorityBadgeStyle[finding.priority]
                      }`}
                    >
                      {finding.priority} ({finding.priorityScore})
                    </span>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pulse-surface border border-pulse-subtle text-pulse-secondary uppercase">
                      {finding.category}
                    </span>

                    <span className="text-xs font-mono text-pulse-muted">
                      {finding.file}:{finding.line}
                    </span>

                    <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400">
                      {finding.confidence}% confidence
                    </span>

                    {finding.status !== 'OPEN' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-500">
                        {finding.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => {
                      setSelectedFinding(finding);
                      setIsDetailModalOpen(true);
                    }}
                    className="text-sm font-bold text-pulse-primary group-hover:text-pulse-accent transition cursor-pointer break-words"
                  >
                    {finding.title}
                  </h3>

                  <p className="text-xs text-pulse-secondary leading-relaxed line-clamp-2">
                    {finding.message}
                  </p>

                  {/* Multi-Engine Detection Sources */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-pulse-muted pt-0.5">
                    <span>Sources:</span>
                    {finding.sources.map((s, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-pulse-surface border border-pulse-subtle">
                        {s.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions Button Group */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 pt-2 md:pt-0 w-full md:w-auto">
                  <button
                    onClick={() => {
                      setSelectedFinding(finding);
                      setIsDetailModalOpen(true);
                    }}
                    className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl border border-pulse-subtle bg-pulse-surface hover:bg-pulse-surface-hover text-xs font-mono text-pulse-secondary hover:text-pulse-primary transition cursor-pointer text-center"
                    title="View credibility layer, evidence trace & why it matters"
                  >
                    ⓘ Evidence
                  </button>

                  <button
                    onClick={() => handleFixWithAi(finding)}
                    className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-sm cursor-pointer text-center"
                  >
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    <span>Fix with AI</span>
                  </button>

                  <button
                    onClick={() => handleJumpToCode(finding.file, finding.line)}
                    className="p-1.5 rounded-xl text-pulse-muted hover:text-pulse-primary hover:bg-pulse-surface transition cursor-pointer shrink-0"
                    title="Jump to line in code analyzer"
                  >
                    <Code2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredFindings.length > 10 && (
            <div className="text-center pt-2">
              <button
                onClick={() => setActiveTab('analyzer')}
                className="px-4 py-2 rounded-xl bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-xs font-mono text-pulse-primary transition cursor-pointer"
              >
                View all {filteredFindings.length} findings in Analyzer →
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Zero Smells / All Resolved Celebration */
        <div className="p-4 sm:p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <PulseMascot pose="success" size="md" />
            <div>
              <h4 className="text-sm font-bold text-pulse-primary font-sans">
                {selectedStatusFilter === 'ACTIVE'
                  ? 'Zero Pending Issues in Action Center!'
                  : 'No Matching Findings Found'}
              </h4>
              <p className="text-xs text-pulse-secondary leading-relaxed mt-0.5">
                {selectedStatusFilter === 'ACTIVE'
                  ? 'All static analyzer heuristics, security CVEs, and AI reviews are satisfied.'
                  : 'Try adjusting your filters or search query.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('learn')}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#08110F] text-xs font-bold transition shadow-sm cursor-pointer shrink-0 self-start sm:self-auto"
          >
            Explore Learning Hub
          </button>
        </div>
      )}

      {/* 4. Finding Detail Modal */}
      <FindingDetailModal
        finding={selectedFinding}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        personalizationProfile={personalizationProfile}
        allFindings={allActionFindings}
        analysis={analysis}
        code={code}
        onStatusChange={handleStatusChange}
        onSelectFinding={(f) => setSelectedFinding(f)}
        onJumpToCode={handleJumpToCode}
        onFixWithAi={handleFixWithAi}
      />
    </section>
  );
};
