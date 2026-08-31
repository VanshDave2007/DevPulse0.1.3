/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  ActionFinding,
  AnalysisResult,
  EvidenceGraph,
  EvidenceGraphNode,
  EvidenceNodeType,
  FalsePositiveReason,
  FindingStatus,
  ProjectMemoryScope,
  ProjectMemoryType,
  UserPersonalizationProfile,
} from '../types';
import { getPersonalizedFindingDetails } from '../engine/actionCenter';
import { EvidenceGraphService } from '../services/evidenceGraphService';
import { RootCauseEngine } from '../services/rootCauseEngine';
import { ChangeImpactService } from '../services/changeImpactService';
import { TestIntelligenceService } from '../services/testIntelligenceService';
import { ProjectMemoryService } from '../services/projectMemoryService';
import { DeveloperLearningService } from '../services/developerLearningService';
import { FindingLearningModal } from './learning/FindingLearningModal';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  FileCode,
  FileText,
  Flame,
  GitBranch,
  GitCommit,
  GraduationCap,
  HelpCircle,
  Info,
  Layers,
  Lightbulb,
  Maximize2,
  Network,
  Plus,
  Radio,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TestTube2,
  Workflow,
  X,
  Zap,
} from 'lucide-react';

interface FindingDetailModalProps {
  finding: ActionFinding | null;
  isOpen: boolean;
  onClose: () => void;
  personalizationProfile: UserPersonalizationProfile;
  allFindings?: ActionFinding[];
  analysis?: AnalysisResult | null;
  code?: string;
  onStatusChange: (
    findingId: string,
    status: FindingStatus,
    feedback?: { reason?: FalsePositiveReason; notes?: string; reviewDate?: string; owner?: string }
  ) => void;
  onSelectFinding?: (finding: ActionFinding) => void;
  onJumpToCode?: (file: string, line: number) => void;
  onAskAi?: (question: string) => void;
  onFixWithAi?: (finding: ActionFinding) => void;
}

export const FindingDetailModal: React.FC<FindingDetailModalProps> = ({
  finding,
  isOpen,
  onClose,
  personalizationProfile,
  allFindings = [],
  analysis = null,
  code = '',
  onStatusChange,
  onSelectFinding,
  onJumpToCode,
  onAskAi,
  onFixWithAi,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'test-intelligence' | 'evidence' | 'root-cause' | 'impact'>('overview');
  const [impactDepth, setImpactDepth] = useState<number>(2);
  const [graphFilter, setGraphFilter] = useState<'ALL' | 'FILES' | 'FUNCTIONS' | 'DEPENDENCIES' | 'TESTS'>('ALL');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showFalsePositiveMenu, setShowFalsePositiveMenu] = useState(false);
  const [selectedFpReason, setSelectedFpReason] = useState<FalsePositiveReason>('Analyzer mistake');
  const [selectedFpScope, setSelectedFpScope] = useState<ProjectMemoryScope>('SYMBOL');
  const [fpNotes, setFpNotes] = useState('');
  const [copiedFix, setCopiedFix] = useState(false);
  const [copiedTestIdx, setCopiedTestIdx] = useState<number | null>(null);

  // Project Note & Learning Modals
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<ProjectMemoryType>('PROJECT_RULE');
  const [noteScope, setNoteScope] = useState<ProjectMemoryScope>('SYMBOL');
  const [noteOwner, setNoteOwner] = useState('');
  const [noteReviewDate, setNoteReviewDate] = useState('');
  const [showLearningModal, setShowLearningModal] = useState(false);
  const [feedbackSuccessMessage, setFeedbackSuccessMessage] = useState<string | null>(null);
  const [memoryRefreshKey, setMemoryRefreshKey] = useState(0);

  // 1. Evidence Graph Generation (Cycle-safe, bounded)
  const fullEvidenceGraph = useMemo(() => {
    if (!finding) return { nodes: [], edges: [] };
    return EvidenceGraphService.buildGraph(
      analysis,
      allFindings.length > 0 ? allFindings : [finding],
      code,
      finding.file
    );
  }, [analysis, allFindings, finding, code]);

  // 2. Root Cause Analysis
  const rootCause = useMemo(() => {
    if (!finding) return null;
    return RootCauseEngine.evaluateFindingRootCause(
      finding,
      allFindings.length > 0 ? allFindings : [finding],
      fullEvidenceGraph
    );
  }, [finding, allFindings, fullEvidenceGraph]);

  // 3. Change Impact / Blast Radius Analysis
  const impactAnalysis = useMemo(() => {
    if (!finding) return null;
    const targetSymbol = finding.symbol || finding.file;
    return ChangeImpactService.calculateImpact(
      targetSymbol,
      fullEvidenceGraph,
      allFindings,
      impactDepth
    );
  }, [finding, fullEvidenceGraph, allFindings, impactDepth]);

  // 4. Test Intelligence: Framework, DiscoveredTests, Coverage & Gaps
  const testIntelligence = useMemo(() => {
    if (!finding) return null;
    const fw = TestIntelligenceService.detectTestFramework(code, finding.file);
    const discovered = TestIntelligenceService.discoverTests(code, finding.file, fw);
    const relevant = TestIntelligenceService.findRelevantTests(finding.symbol || '', finding.file, discovered);
    const coverage = TestIntelligenceService.analyzeCoverage(
      code,
      finding.file,
      discovered,
      finding.line ? [finding.line] : []
    );
    const gaps = TestIntelligenceService.detectTestGaps(code, finding.file, analysis, discovered, [finding]);
    const candidateTests = TestIntelligenceService.generateTestCandidates(
      finding.symbol || 'handler',
      finding.file,
      code,
      fw,
      gaps[0]
    );

    return {
      framework: fw,
      discoveredTests: discovered,
      relevantTests: relevant,
      coverage,
      gaps,
      candidateTests,
    };
  }, [finding, code, analysis]);

  // 5. Project Memory Context
  const memoryContext = useMemo(() => {
    if (!finding) return null;
    const previousMatch = ProjectMemoryService.findMatchingPreviousDecision(finding);
    const relevantMemories = ProjectMemoryService.getRelevantMemory({
      file: finding.file,
      symbol: finding.symbol,
      category: finding.category,
    });
    return {
      previousMatch,
      relevantMemories,
    };
  }, [finding, memoryRefreshKey]);

  // 6. Mapped Learning Concept
  const learningConcept = useMemo(() => {
    if (!finding) return null;
    return DeveloperLearningService.getRelevantConcept(finding);
  }, [finding]);

  if (!isOpen || !finding) return null;

  const details = getPersonalizedFindingDetails(finding, personalizationProfile);

  const priorityColors = {
    CRITICAL: 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30',
    HIGH: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
    MEDIUM: 'bg-teal-500/20 text-teal-600 dark:text-teal-300 border-teal-500/30',
    LOW: 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30',
    INFO: 'bg-pulse-elevated text-pulse-muted border-pulse-subtle',
  };

  const statusOptions: Array<{ value: FindingStatus; label: string; color: string; desc: string }> = [
    { value: 'OPEN', label: 'Open', color: 'text-amber-500', desc: 'Active finding requiring attention' },
    { value: 'IN_REVIEW', label: 'In Review', color: 'text-blue-400', desc: 'Under engineering investigation' },
    { value: 'ACCEPTED', label: 'Accepted', color: 'text-purple-400', desc: 'Acknowledged technical debt' },
    { value: 'FIXED', label: 'Fixed', color: 'text-emerald-400', desc: 'Remediated in codebase' },
    { value: 'FALSE_POSITIVE', label: 'False Positive', color: 'text-rose-400', desc: 'Analyzer mistake or intentional' },
    { value: 'DEFERRED', label: 'Deferred', color: 'text-pulse-muted', desc: 'Postponed to future sprint' },
  ];

  const handleCopyFix = () => {
    if (finding.suggestedFix) {
      navigator.clipboard.writeText(finding.suggestedFix);
      setCopiedFix(true);
      setTimeout(() => setCopiedFix(false), 2000);
    }
  };

  const submitFalsePositive = () => {
    // 1. Programmatically append structured entry to central projectMemory state with source correctly labeled
    ProjectMemoryService.addMemory({
      type: 'FALSE_POSITIVE',
      title: `False Positive: ${finding.title}`,
      content: fpNotes || `Marked as False Positive due to: ${selectedFpReason}`,
      source: 'DEVELOPER_FEEDBACK',
      confidence: 'CONFIRMED',
      status: 'APPROVED',
      scope: selectedFpScope,
      isExplicit: true,
      kind: 'EXPLICIT',
      relatedFiles: [finding.file],
      relatedSymbols: finding.symbol ? [finding.symbol] : [],
      relatedFindings: [finding.id],
      tags: [finding.category.toLowerCase(), 'false-positive', 'developer-feedback'],
      reason: selectedFpReason,
      developerExplanation: fpNotes,
      location: `${finding.file}:${finding.line}`,
      findingSnapshot: {
        findingId: finding.id,
        findingTitle: finding.title,
        findingCategory: finding.category,
        file: finding.file,
        line: finding.line,
      },
    });

    // 2. Notify parent status listener
    onStatusChange(finding.id, 'FALSE_POSITIVE', {
      reason: selectedFpReason,
      notes: fpNotes,
    });

    setMemoryRefreshKey((prev) => prev + 1);
    setShowFalsePositiveMenu(false);
    setShowStatusDropdown(false);
    setFeedbackSuccessMessage('Marked as False Positive & recorded in central Project Memory (Source: DEVELOPER_FEEDBACK)');
    setTimeout(() => setFeedbackSuccessMessage(null), 4000);
  };

  const handleSaveProjectNote = () => {
    if (!finding || !noteContent.trim()) return;

    // Programmatically append structured entry to central projectMemory state with source correctly labeled
    ProjectMemoryService.addMemory({
      type: noteType,
      title: noteTitle.trim() || `Project Note: ${finding.title}`,
      content: noteContent.trim(),
      source: 'USER_CREATED',
      confidence: 'CONFIRMED',
      status: 'APPROVED',
      scope: noteScope,
      isExplicit: true,
      kind: 'EXPLICIT',
      relatedFiles: [finding.file],
      relatedSymbols: finding.symbol ? [finding.symbol] : [],
      relatedFindings: [finding.id],
      tags: [finding.category.toLowerCase(), 'project-note', 'developer-added'],
      owner: noteOwner.trim() || undefined,
      reviewDate: noteReviewDate || undefined,
      location: `${finding.file}:${finding.line}`,
      findingSnapshot: {
        findingId: finding.id,
        findingTitle: finding.title,
        findingCategory: finding.category,
        file: finding.file,
        line: finding.line,
      },
    });

    setMemoryRefreshKey((prev) => prev + 1);
    setShowAddNoteModal(false);
    setNoteTitle('');
    setNoteContent('');
    setNoteOwner('');
    setNoteReviewDate('');
    setFeedbackSuccessMessage('Project note successfully appended to central Project Memory (Source: USER_CREATED)');
    setTimeout(() => setFeedbackSuccessMessage(null), 4000);
  };

  const handleStatusSelect = (status: FindingStatus) => {
    if (status === 'FALSE_POSITIVE') {
      setShowFalsePositiveMenu(true);
      setShowStatusDropdown(false);
    } else {
      onStatusChange(finding.id, status);
      setShowStatusDropdown(false);
    }
  };

  // Filtered graph nodes based on user toggle
  const filteredGraphNodes = (impactAnalysis?.graph?.nodes || []).filter((n) => {
    if (graphFilter === 'ALL') return true;
    if (graphFilter === 'FILES') return n.type === 'FILE';
    if (graphFilter === 'FUNCTIONS') return n.type === 'FUNCTION';
    if (graphFilter === 'DEPENDENCIES') return n.type === 'DEPENDENCY' || n.type === 'DATABASE' || n.type === 'API_ENDPOINT';
    if (graphFilter === 'TESTS') return n.type === 'TEST';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn select-none">
      <div
        className="relative w-full max-w-3xl max-h-[94vh] flex flex-col rounded-2xl sm:rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-pulse-subtle bg-pulse-surface/90 gap-2">
          <div className="space-y-2 pr-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase ${priorityColors[finding.priority]}`}>
                Priority: {finding.priority} ({finding.priorityScore}/100)
              </span>

              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-pulse-elevated border border-pulse-subtle text-pulse-secondary">
                {finding.category}
              </span>

              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                {finding.confidenceType || 'DETERMINISTIC'} · {finding.confidence}% confidence
              </span>

              {/* Status Dropdown Control */}
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-pulse-primary transition cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  <span>Status: {finding.status.replace('_', ' ')}</span>
                  <ChevronDown className="h-3 w-3 text-pulse-muted" />
                </button>

                {showStatusDropdown && (
                  <div className="absolute left-0 mt-1.5 w-56 rounded-2xl bg-pulse-surface border border-pulse-subtle shadow-2xl p-1.5 z-50 space-y-0.5 animate-fadeIn">
                    <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-pulse-muted font-bold">
                      Change Lifecycle Status
                    </div>
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleStatusSelect(opt.value)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                          finding.status === opt.value
                            ? 'bg-teal-500/15 text-teal-400 font-bold'
                            : 'hover:bg-pulse-elevated text-pulse-secondary hover:text-pulse-primary'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`font-mono text-xs ${opt.color}`}>●</span>
                          <span>{opt.label}</span>
                        </div>
                        {finding.status === opt.value && <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Project Note Action */}
              <button
                type="button"
                onClick={() => setShowAddNoteModal(true)}
                className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-pulse-secondary hover:text-pulse-primary transition cursor-pointer"
                title="Add Project Note to continuous memory"
              >
                <FileText className="h-3 w-3 text-teal-400" />
                <span>+ Add Project Note</span>
              </button>

              {/* Learn Concept Action */}
              {learningConcept && (
                <button
                  type="button"
                  onClick={() => setShowLearningModal(true)}
                  className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-400 transition cursor-pointer"
                  title={`Learn ${learningConcept.title}`}
                >
                  <GraduationCap className="h-3 w-3" />
                  <span>Learn Concept</span>
                </button>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-extrabold text-pulse-primary font-sans leading-tight break-words">
              {finding.title}
            </h2>

            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-pulse-muted">
              <FileCode className="h-3.5 w-3.5 text-pulse-accent shrink-0" />
              <span className="break-all">{finding.file}:{finding.line}</span>
              {finding.symbol && (
                <span className="break-all">
                  · symbol: <code className="text-pulse-primary">{finding.symbol}</code>
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-pulse-muted hover:text-pulse-primary hover:bg-pulse-elevated transition cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Success Notification Toast */}
        {feedbackSuccessMessage && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-400 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{feedbackSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackSuccessMessage(null)}
              className="text-emerald-400/70 hover:text-emerald-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Intelligence Navigation Tabs */}
        <div className="flex items-center px-3 sm:px-6 border-b border-pulse-subtle bg-pulse-surface overflow-x-auto space-x-1 sm:space-x-2 pt-2 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview & Remediation', icon: Lightbulb },
            {
              id: 'test-intelligence',
              label: `Test Intelligence ${testIntelligence?.gaps.length ? `(${testIntelligence.gaps.length} gaps)` : ''}`,
              icon: TestTube2,
            },
            { id: 'evidence', label: 'Evidence Trace', icon: Layers },
            { id: 'root-cause', label: 'Root Cause Analysis', icon: Target },
            { id: 'impact', label: 'Change Impact (Blast Radius)', icon: Workflow },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-t-xl text-xs font-medium border-b-2 transition whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'border-teal-400 text-pulse-primary bg-pulse-elevated/60 font-bold'
                    : 'border-transparent text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated/30'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-teal-400' : 'text-pulse-muted'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs sm:text-sm">
          {/* TAB 1: OVERVIEW & REMEDIATION */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Project Memory Prior Decision Banner (if applicable) */}
              {memoryContext?.previousMatch && (
                <div className={`p-4 rounded-2xl border flex items-start space-x-3 ${
                  memoryContext.previousMatch.isFalsePositive
                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-200'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                }`}>
                  <BookOpen className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold uppercase tracking-wide text-pulse-primary">
                        {memoryContext.previousMatch.isFalsePositive
                          ? 'Previously Marked as False Positive'
                          : 'Accepted Technical Debt'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-pulse-surface text-pulse-muted">
                        Scope: {memoryContext.previousMatch.memory.scope}
                      </span>
                    </div>
                    <p className="text-pulse-secondary">
                      {memoryContext.previousMatch.memory.developerExplanation ||
                        memoryContext.previousMatch.memory.content ||
                        'Recorded in continuous project memory.'}
                    </p>
                    {memoryContext.previousMatch.memory.reviewDate && (
                      <span className="text-[11px] font-mono text-amber-400 block pt-0.5">
                        Scheduled review date: {memoryContext.previousMatch.memory.reviewDate}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Relevant Project Memories / Rules Section */}
              {memoryContext && memoryContext.relevantMemories.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold uppercase text-pulse-muted flex items-center space-x-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-teal-400" />
                      <span>Applicable Project Memory & Rules ({memoryContext.relevantMemories.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddNoteModal(true)}
                      className="text-[11px] font-mono text-teal-400 hover:underline cursor-pointer flex items-center space-x-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Note</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {memoryContext.relevantMemories.map((mem) => (
                      <div
                        key={mem.id}
                        className="p-3.5 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-pulse-primary">{mem.title}</span>
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-pulse-surface border border-pulse-subtle text-teal-400">
                              {mem.type.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-pulse-surface text-pulse-muted shrink-0">
                            Source: {mem.source}
                          </span>
                        </div>
                        <p className="text-xs text-pulse-secondary leading-relaxed">{mem.content}</p>
                        {mem.reason && (
                          <p className="text-[11px] text-pulse-muted italic">Reason: {mem.reason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personalized Knowledge Level Badge */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20">
                <div className="flex items-center space-x-2.5">
                  <Sparkles className="h-4 w-4 text-teal-400" />
                  <span className="text-xs font-medium text-pulse-primary">
                    Calibrated for <strong className="capitalize text-teal-400">{details.level}</strong> Developer Knowledge
                  </span>
                </div>
                <span className="text-[10px] font-mono text-pulse-muted">
                  Action: <strong className="text-teal-400">{finding.recommendedAction}</strong>
                </span>
              </div>

              {/* Quick Test Intelligence Telemetry Bar */}
              {testIntelligence && (
                <div className="p-3.5 rounded-2xl bg-pulse-elevated border border-pulse-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-teal-500/15 text-teal-400">
                      <TestTube2 className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-pulse-primary">Test Intelligence & Coverage: </span>
                      <span className="text-xs text-pulse-secondary">
                        {testIntelligence.coverage.lines}% Line Coverage •{' '}
                        {testIntelligence.coverage.changedCodeCoverage?.percentage ?? testIntelligence.coverage.lines}% Changed-Code Coverage •{' '}
                        <strong className="text-amber-400">{testIntelligence.gaps.length} Potential Test Gaps</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('test-intelligence')}
                    className="px-3 py-1 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-400 text-xs font-medium transition cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    View Test Gaps & Tests →
                  </button>
                </div>
              )}

              {/* 1. Why This Matters */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-mono font-bold uppercase text-pulse-muted flex items-center space-x-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-pulse-accent" />
                  <span>Why This Matters</span>
                </h3>
                <p className="p-3.5 rounded-2xl bg-pulse-elevated border border-pulse-subtle text-pulse-primary leading-relaxed">
                  {details.whyItMatters}
                </p>
              </div>

              {/* 2. Personalized Explanation */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase text-pulse-muted flex items-center space-x-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-teal-400" />
                  <span>Personalized Explanation</span>
                </h3>
                <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-3">
                  <p className="text-pulse-primary leading-relaxed">{details.explanation}</p>

                  {details.analogy && (
                    <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-pulse-secondary italic">
                      💡 <strong>Intuitive Analogy:</strong> {details.analogy}
                    </div>
                  )}

                  {/* Step-by-Step Guidance */}
                  <div className="space-y-1.5 pt-1">
                    <h4 className="text-[11px] font-mono uppercase font-bold text-pulse-muted">Recommended Steps:</h4>
                    <ul className="space-y-1 text-xs text-pulse-secondary">
                      {details.recommendedSteps.map((step, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-teal-400 font-bold">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 3. Suggested Remediation Code */}
              {finding.suggestedFix && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold uppercase text-pulse-muted flex items-center space-x-1.5">
                      <Code2 className="h-3.5 w-3.5 text-teal-400" />
                      <span>Recommended Remediation</span>
                    </h3>
                    <button
                      onClick={handleCopyFix}
                      className="flex items-center space-x-1 text-[11px] font-mono text-pulse-accent hover:underline cursor-pointer"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{copiedFix ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#08110F] border border-teal-500/20 text-xs font-mono text-teal-200 overflow-x-auto">
                    <pre className="whitespace-pre-wrap">{finding.suggestedFix}</pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: TEST INTELLIGENCE (Potential test gaps & changed-code coverage) */}
          {activeTab === 'test-intelligence' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Coverage Telemetry Bar */}
              {testIntelligence?.coverage && (
                <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-pulse-primary flex items-center space-x-2">
                      <TestTube2 className="h-4 w-4 text-teal-400" />
                      <span>Relevant Changed-Code Coverage Telemetry</span>
                    </span>
                    <span className="text-[11px] font-mono text-pulse-muted">
                      Framework: {testIntelligence.framework.name} ({testIntelligence.framework.syntaxStyle})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle space-y-1">
                      <span className="text-[10px] font-mono uppercase text-pulse-muted">Line Coverage</span>
                      <div className="text-lg font-bold text-pulse-primary font-mono">{testIntelligence.coverage.lines}%</div>
                      <div className="w-full bg-pulse-subtle h-1.5 rounded-full overflow-hidden">
                        <div className="bg-teal-400 h-full rounded-full" style={{ width: `${testIntelligence.coverage.lines}%` }} />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle space-y-1">
                      <span className="text-[10px] font-mono uppercase text-pulse-muted">Changed-Code Cov</span>
                      <div className="text-lg font-bold text-teal-400 font-mono">
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
                      <div className="text-lg font-bold text-pulse-primary font-mono">{testIntelligence.coverage.branches}%</div>
                      <div className="w-full bg-pulse-subtle h-1.5 rounded-full overflow-hidden">
                        <div className="bg-sky-400 h-full rounded-full" style={{ width: `${testIntelligence.coverage.branches}%` }} />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle space-y-1">
                      <span className="text-[10px] font-mono uppercase text-pulse-muted">Functions Covered</span>
                      <div className="text-lg font-bold text-pulse-primary font-mono">
                        {testIntelligence.coverage.testedFunctionsCount}/{testIntelligence.coverage.totalFunctionsCount}
                      </div>
                      <div className="w-full bg-pulse-subtle h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-400 h-full rounded-full" style={{ width: `${testIntelligence.coverage.functions}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Potential Test Gaps Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase font-bold text-pulse-muted flex items-center space-x-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span>Potential Test Gaps for this Component ({testIntelligence?.gaps.length || 0})</span>
                  </h4>
                  <span className="text-[11px] font-mono text-pulse-muted">
                    Automated gap analysis for {finding.file}
                  </span>
                </div>

                {testIntelligence && testIntelligence.gaps.length > 0 ? (
                  <div className="space-y-2.5">
                    {testIntelligence.gaps.map((gap) => (
                      <div
                        key={gap.id}
                        className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                gap.priority === 'CRITICAL'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : gap.priority === 'HIGH'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                              }`}
                            >
                              {gap.priority} GAP
                            </span>
                            <h5 className="font-bold text-pulse-primary text-xs">{gap.title}</h5>
                          </div>
                          <span className="text-[10px] font-mono text-pulse-muted shrink-0">Line {gap.line}</span>
                        </div>

                        <p className="text-xs text-pulse-secondary leading-relaxed">{gap.missingBehavior}</p>

                        <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle text-xs space-y-1">
                          <div className="flex items-center space-x-1.5 text-teal-400 font-bold">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Recommended Test Action:</span>
                          </div>
                          <p className="text-pulse-secondary text-[11px]">{gap.suggestedTest}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-pulse-elevated text-xs text-emerald-400 flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>No critical test gaps identified for this symbol and file.</span>
                  </div>
                )}
              </div>

              {/* AI Synthesized Candidate Tests for Regression Prevention */}
              {testIntelligence && testIntelligence.candidateTests.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase font-bold text-pulse-muted flex items-center space-x-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                    <span>Candidate Regression Guard Tests ({testIntelligence.candidateTests.length})</span>
                  </h4>

                  <div className="space-y-3">
                    {testIntelligence.candidateTests.map((ct, idx) => (
                      <div
                        key={ct.id}
                        className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-pulse-primary text-xs">{ct.title}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/15 text-teal-400">
                                {ct.framework}
                              </span>
                            </div>
                            <p className="text-xs text-pulse-secondary">{ct.rationale}</p>
                          </div>

                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(ct.testCode);
                              setCopiedTestIdx(idx);
                              setTimeout(() => setCopiedTestIdx(null), 2000);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-pulse-surface hover:bg-pulse-surface-hover border border-pulse-subtle text-xs text-teal-400 transition cursor-pointer flex items-center space-x-1 shrink-0"
                          >
                            <Copy className="h-3 w-3" />
                            <span>{copiedTestIdx === idx ? 'Copied' : 'Copy Test'}</span>
                          </button>
                        </div>

                        <div className="rounded-xl bg-[#08110F] border border-teal-500/20 p-3 font-mono text-xs text-emerald-400 overflow-x-auto max-h-40">
                          <pre>{ct.testCode}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Relevant Project Rules & Memory for This Finding */}
              {memoryContext && memoryContext.relevantMemories.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-pulse-subtle">
                  <h4 className="text-xs font-mono uppercase font-bold text-pulse-muted flex items-center space-x-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-teal-400" />
                    <span>Applicable Project Rules & Memory ({memoryContext.relevantMemories.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {memoryContext.relevantMemories.map((mem) => (
                      <div
                        key={mem.memoryId}
                        className="p-3 rounded-xl bg-pulse-elevated border border-pulse-subtle space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-pulse-primary">{mem.title}</span>
                          <span className="text-[10px] font-mono text-pulse-muted uppercase">{mem.type}</span>
                        </div>
                        <p className="text-pulse-secondary text-[11px]">{mem.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EVIDENCE TRACE & GRAPH */}
          {activeTab === 'evidence' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-3 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-1">
                <h4 className="text-xs font-bold text-pulse-primary flex items-center space-x-1.5">
                  <Layers className="h-3.5 w-3.5 text-teal-400" />
                  <span>Deterministic Evidence & Verification</span>
                </h4>
                <p className="text-xs text-pulse-secondary">
                  DevPulse grounds this finding in static AST parsing, control-flow traces, and dependency resolution.
                </p>
              </div>

              {/* Evidence Items */}
              <div className="space-y-3">
                {finding.evidence && finding.evidence.length > 0 ? (
                  finding.evidence.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30">
                            {ev.analyzerSource}
                          </span>
                          <span className="text-xs font-bold text-pulse-primary">
                            {ev.detectionRule || finding.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-pulse-muted">
                          {ev.confidenceType || 'DETERMINISTIC'} · {ev.confidenceScore ?? finding.confidence}% confidence
                        </span>
                      </div>

                      {/* Code Location Link */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle text-xs font-mono">
                        <div className="flex items-center space-x-2 text-pulse-secondary">
                          <FileCode className="h-3.5 w-3.5 text-pulse-accent" />
                          <span>{ev.file}:{ev.line} {ev.codeLocation && `(${ev.codeLocation})`}</span>
                        </div>
                        {onJumpToCode && (
                          <button
                            onClick={() => onJumpToCode(ev.file, ev.line)}
                            className="text-xs text-teal-400 hover:underline flex items-center space-x-1 cursor-pointer"
                          >
                            <span>Inspect Location</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      {/* Data Flow / Call Path */}
                      {(ev.dataFlow || ev.callPath) && ((ev.dataFlow && ev.dataFlow.length > 0) || (ev.callPath && ev.callPath.length > 0)) && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-mono uppercase font-bold text-pulse-muted">
                            Flow / Execution Trace:
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                            {(ev.dataFlow || ev.callPath || []).map((step, sIdx) => (
                              <React.Fragment key={sIdx}>
                                <span className="px-2.5 py-1 rounded-lg bg-pulse-surface border border-pulse-subtle text-pulse-primary">
                                  {step}
                                </span>
                                {sIdx < (ev.dataFlow || ev.callPath || []).length - 1 && (
                                  <ArrowRight className="h-3 w-3 text-teal-400" />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-5 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-1.5 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start space-x-2 text-pulse-primary font-mono text-xs font-bold">
                      <Info className="h-4 w-4 text-pulse-accent" />
                      <span>No detailed evidence available</span>
                    </div>
                    <p className="text-xs text-pulse-muted leading-relaxed">
                      No information available. No additional AST node traces, call paths, or execution taint chains were recorded for this finding.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ROOT CAUSE ANALYSIS */}
          {activeTab === 'root-cause' && (
            <div className="space-y-6 animate-fadeIn">
              {rootCause && rootCause.likelySource ? (
                <>
                  {/* Likely Source Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-rose-400" />
                        <h4 className="text-xs font-mono uppercase font-bold text-pulse-muted">Likely Root Cause Origin</h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        {rootCause.detectionMethod && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-pulse-surface border border-pulse-subtle text-teal-400">
                            {rootCause.detectionMethod.replace('_', ' ')}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          rootCause.confidence === 'HIGH' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {rootCause.relationshipType || 'ROOT CAUSE'} · {rootCause.confidenceScore}% confidence
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-pulse-surface border border-pulse-subtle">
                      <h5 className="text-sm font-bold text-pulse-primary">{rootCause.likelySource}</h5>
                      <p className="text-xs text-pulse-secondary mt-1 leading-relaxed">{rootCause.explanation || 'Root cause analyzed by structural dependency traversal.'}</p>
                    </div>

                    {/* Cause Chain */}
                    {rootCause.causeChain && rootCause.causeChain.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <h6 className="text-[10px] font-mono uppercase font-bold text-pulse-muted">Propagation Chain:</h6>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                          {rootCause.causeChain.map((step, idx) => (
                            <React.Fragment key={idx}>
                              <span className="px-2.5 py-1 rounded-lg bg-pulse-surface border border-pulse-subtle text-pulse-primary">
                                {step}
                              </span>
                              {idx < rootCause.causeChain.length - 1 && (
                                <ArrowRight className="h-3 w-3 text-teal-400" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Resolvable Impact Summary Box */}
                  {rootCause.resolvableImpact && (
                    <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-pulse-primary font-mono uppercase">
                          Fixing This Root Cause May Resolve:
                        </h4>
                        <p className="text-xs text-pulse-secondary mt-0.5">
                          Addressing the underlying architecture source cascades fixes through connected symptoms.
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0 font-mono text-xs">
                        <div className="text-center px-3 py-1.5 rounded-xl bg-pulse-surface border border-pulse-subtle">
                          <span className="text-sm font-bold text-teal-400 block">{rootCause.resolvableImpact.findingsCount}</span>
                          <span className="text-[9px] text-pulse-muted uppercase">Findings</span>
                        </div>
                        <div className="text-center px-3 py-1.5 rounded-xl bg-pulse-surface border border-pulse-subtle">
                          <span className="text-sm font-bold text-pulse-primary block">{rootCause.resolvableImpact.modulesCount}</span>
                          <span className="text-[9px] text-pulse-muted uppercase">Modules</span>
                        </div>
                        <div className="text-center px-3 py-1.5 rounded-xl bg-pulse-surface border border-pulse-subtle">
                          <span className="text-sm font-bold text-amber-400 block">{rootCause.resolvableImpact.warningsCount}</span>
                          <span className="text-[9px] text-pulse-muted uppercase">Warnings</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Related Findings List */}
                  {rootCause.relatedFindingIds && rootCause.relatedFindingIds.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-xs font-mono uppercase font-bold text-pulse-muted">
                        Connected Findings ({rootCause.relatedFindingIds.length})
                      </h4>
                      <div className="space-y-2">
                        {allFindings
                          .filter((f) => rootCause.relatedFindingIds.includes(f.id))
                          .map((rf) => (
                            <div
                              key={rf.id}
                              className="p-3 rounded-xl bg-pulse-elevated border border-pulse-subtle hover:border-teal-500/40 transition flex items-center justify-between gap-3 group"
                            >
                              <div className="space-y-0.5 flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-pulse-surface text-pulse-secondary">
                                    {rf.severity}
                                  </span>
                                  <h5 className="text-xs font-bold text-pulse-primary truncate group-hover:text-teal-400 transition">
                                    {rf.title}
                                  </h5>
                                </div>
                                <p className="text-[11px] text-pulse-muted font-mono">{rf.file}:{rf.line}</p>
                              </div>

                              {onSelectFinding && (
                                <button
                                  onClick={() => onSelectFinding(rf)}
                                  className="px-2.5 py-1 rounded-lg bg-pulse-surface hover:bg-pulse-surface-hover border border-pulse-subtle text-xs text-teal-400 transition cursor-pointer shrink-0"
                                >
                                  Inspect →
                                </button>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-pulse-surface border border-pulse-subtle text-xs text-pulse-muted text-center font-mono">
                      No additional connected downstream findings identified.
                    </div>
                  )}
                </>
              ) : (
                <div className="p-5 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-1.5 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start space-x-2 text-pulse-primary font-mono text-xs font-bold">
                    <Info className="h-4 w-4 text-pulse-accent" />
                    <span>No detailed root cause available</span>
                  </div>
                  <p className="text-xs text-pulse-muted leading-relaxed">
                    No information available. This finding is isolated and has no confirmed upstream architectural dependency or cascading callers.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CHANGE IMPACT (BLAST RADIUS) */}
          {activeTab === 'impact' && (
            <div className="space-y-6 animate-fadeIn">
              {impactAnalysis ? (
                <>
                  {/* Target & Risk Level Banner */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono uppercase text-pulse-muted">Change Target Component</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-pulse-surface border border-pulse-subtle text-pulse-muted uppercase">
                            {impactAnalysis.targetType}
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-pulse-primary font-mono">
                          {impactAnalysis.target}
                        </h4>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase border ${
                          impactAnalysis.riskLevel === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : impactAnalysis.riskLevel === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                        }`}>
                          Risk: {impactAnalysis.riskLevel}
                        </span>

                        {/* Depth Selector */}
                        <div className="flex items-center rounded-xl bg-pulse-surface border border-pulse-subtle p-0.5">
                          {[1, 2, 3].map((d) => (
                            <button
                              key={d}
                              onClick={() => setImpactDepth(d)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition cursor-pointer ${
                                impactDepth === d
                                   ? 'bg-teal-500 text-[#08110F] font-bold'
                                  : 'text-pulse-muted hover:text-pulse-primary'
                              }`}
                            >
                              Depth {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Public API Warning Notice */}
                    {impactAnalysis.isPublicApi && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-2 text-xs text-amber-300">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">Public API Impact:</strong> This symbol/module is exported or imported by {impactAnalysis.publicApiConsumersCount || impactAnalysis.directDependents.length} distinct components. Changing its signature may break external callers.
                        </div>
                      </div>
                    )}

                    {/* Security Sensitivity Notice */}
                    {impactAnalysis.isSecuritySensitive && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2 text-xs text-rose-300">
                        <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">Security-Sensitive Component:</strong> {impactAnalysis.securitySensitivityReason || 'Changes may affect authentication, authorization, or sensitive data validation boundaries.'}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-pulse-primary leading-relaxed bg-pulse-surface p-3 rounded-xl border border-pulse-subtle">
                      {impactAnalysis.reasoning || 'No information available on specific blast radius impact reasoning.'}
                    </p>

                    {/* Stats Metric Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                      <div className="p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle text-center">
                        <span className="text-sm font-bold text-pulse-primary block">{impactAnalysis.directDependents.length}</span>
                        <span className="text-[9px] text-pulse-muted uppercase">Direct Callers</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle text-center">
                        <span className="text-sm font-bold text-teal-400 block">{impactAnalysis.indirectDependents.length}</span>
                        <span className="text-[9px] text-pulse-muted uppercase">Indirect Cascade</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle text-center">
                        <span className="text-sm font-bold text-pulse-primary block">{impactAnalysis.affectedFiles.length}</span>
                        <span className="text-[9px] text-pulse-muted uppercase">Affected Files</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle text-center">
                        <span className="text-sm font-bold text-amber-400 block">{impactAnalysis.affectedTests.length}</span>
                        <span className="text-[9px] text-pulse-muted uppercase">Affected Tests</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Evidence Sub-Graph Visualizer */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs font-mono uppercase font-bold text-pulse-muted flex items-center space-x-1.5">
                        <Network className="h-3.5 w-3.5 text-teal-400" />
                        <span>Blast Radius Graph Nodes ({filteredGraphNodes.length})</span>
                      </h4>

                      {/* Graph Filter Controls */}
                      <div className="flex items-center space-x-1">
                        {['ALL', 'FILES', 'FUNCTIONS', 'DEPENDENCIES', 'TESTS'].map((f) => (
                          <button
                            key={f}
                            onClick={() => setGraphFilter(f as any)}
                            className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase transition cursor-pointer ${
                              graphFilter === f
                                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30 font-bold'
                                : 'text-pulse-muted hover:text-pulse-primary'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    {filteredGraphNodes.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                        {filteredGraphNodes.map((node) => {
                          const isTarget = node.isTarget || node.label === impactAnalysis.target;
                          return (
                            <div
                              key={node.id}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-mono ${
                                isTarget
                                  ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                                  : 'bg-pulse-elevated border-pulse-subtle text-pulse-secondary'
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                                <span className="truncate font-bold">{node.label}</span>
                              </div>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-pulse-surface border border-pulse-subtle uppercase text-pulse-muted shrink-0">
                                {node.type}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-pulse-surface border border-pulse-subtle text-xs text-pulse-muted text-center font-mono">
                        No graph nodes found matching filter &quot;{graphFilter}&quot;.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-5 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-1.5 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start space-x-2 text-pulse-primary font-mono text-xs font-bold">
                    <Info className="h-4 w-4 text-pulse-accent" />
                    <span>No detailed impact analysis available</span>
                  </div>
                  <p className="text-xs text-pulse-muted leading-relaxed">
                    No information available. No blast radius graph or downstream component dependencies were identified for this target.
                  </p>
                </div>
              )}
            </div>
          )}

              {/* False Positive Feedback Form Modal Strip */}
          {showFalsePositiveMenu && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-pulse-primary flex items-center space-x-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  <span>Mark as False Positive (Project Memory)</span>
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  Source: DEVELOPER_FEEDBACK
                </span>
              </div>

              <p className="text-[11px] text-pulse-secondary">
                Help calibrate DevPulse analyzer by selecting the reason and suppression scope for this report:
              </p>

              <div>
                <label className="text-[10px] font-mono uppercase font-bold text-pulse-muted block mb-1.5">
                  Reason for False Positive
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'Intentional behavior',
                    'Framework behavior',
                    'Not applicable',
                    'Analyzer mistake',
                    'Other',
                  ].map((reason) => (
                    <label
                      key={reason}
                      className="flex items-center space-x-2 p-2 rounded-xl bg-pulse-surface border border-pulse-subtle cursor-pointer text-xs text-pulse-primary hover:border-teal-500/30 transition"
                    >
                      <input
                        type="radio"
                        name="fpReason"
                        value={reason}
                        checked={selectedFpReason === reason}
                        onChange={() => setSelectedFpReason(reason as FalsePositiveReason)}
                        className="accent-teal-500 shrink-0"
                      />
                      <span className="truncate">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase font-bold text-pulse-muted block mb-1.5">
                  Suppression Scope
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'SYMBOL', label: `Symbol (${finding.symbol || 'Target'})` },
                    { id: 'FILE', label: 'Entire File' },
                    { id: 'FINDING', label: 'Single Finding' },
                    { id: 'PROJECT', label: 'Project-Wide' },
                  ].map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setSelectedFpScope(sc.id as ProjectMemoryScope)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium border text-center transition cursor-pointer ${
                        selectedFpScope === sc.id
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 font-bold'
                          : 'bg-pulse-surface border-pulse-subtle text-pulse-secondary hover:text-pulse-primary'
                      }`}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                placeholder="Optional notes (e.g., input is validated upstream in auth middleware)..."
                value={fpNotes}
                onChange={(e) => setFpNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-pulse-surface border border-pulse-subtle text-xs text-pulse-primary focus:outline-none focus:border-teal-500"
              />

              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowFalsePositiveMenu(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-pulse-muted hover:text-pulse-primary cursor-pointer min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitFalsePositive}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#08110F] text-xs font-bold transition cursor-pointer min-h-[38px] flex items-center space-x-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Confirm False Positive</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add Project Note Modal Dialog */}
        {showAddNoteModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div
              className="w-full max-w-lg rounded-2xl bg-pulse-surface border border-pulse-subtle shadow-2xl p-5 space-y-4 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-pulse-subtle pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-pulse-primary">Add Project Note</h3>
                    <p className="text-[11px] text-pulse-muted">Records contextual developer wisdom into Project Memory</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
                  className="p-1 rounded-lg text-pulse-muted hover:text-pulse-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-mono font-bold uppercase text-pulse-muted block mb-1">
                    Note Title
                  </label>
                  <input
                    type="text"
                    value={noteTitle}
                    placeholder={`e.g., Note on ${finding.title}`}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs text-pulse-primary focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-mono font-bold uppercase text-pulse-muted block mb-1">
                      Type
                    </label>
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value as ProjectMemoryType)}
                      className="w-full px-3 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs text-pulse-primary focus:outline-none focus:border-teal-500"
                    >
                      <option value="PROJECT_RULE">Project Rule</option>
                      <option value="ARCHITECTURE_DECISION">Architecture Decision</option>
                      <option value="ACCEPTED_TECHNICAL_DEBT">Accepted Technical Debt</option>
                      <option value="CODING_CONVENTION">Coding Convention</option>
                      <option value="SECURITY_RULE">Security Rule</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono font-bold uppercase text-pulse-muted block mb-1">
                      Scope
                    </label>
                    <select
                      value={noteScope}
                      onChange={(e) => setNoteScope(e.target.value as ProjectMemoryScope)}
                      className="w-full px-3 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs text-pulse-primary focus:outline-none focus:border-teal-500"
                    >
                      <option value="SYMBOL">Symbol ({finding.symbol || 'Current'})</option>
                      <option value="FILE">File ({finding.file})</option>
                      <option value="MODULE">Module</option>
                      <option value="FINDING">This Specific Finding</option>
                      <option value="PROJECT">Project-Wide</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono font-bold uppercase text-pulse-muted block mb-1">
                    Content & Engineering Context *
                  </label>
                  <textarea
                    rows={3}
                    value={noteContent}
                    placeholder="Document the design rationale, exception explanation, or policy constraints for this code..."
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs text-pulse-primary focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-mono font-bold uppercase text-pulse-muted block mb-1">
                      Author / Owner (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lead Architect"
                      value={noteOwner}
                      onChange={(e) => setNoteOwner(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs text-pulse-primary focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono font-bold uppercase text-pulse-muted block mb-1">
                      Review Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={noteReviewDate}
                      onChange={(e) => setNoteReviewDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs text-pulse-primary focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-pulse-subtle">
                <span className="text-[10px] font-mono text-pulse-muted">
                  Source: <strong className="text-teal-400">USER_CREATED</strong>
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddNoteModal(false)}
                    className="px-3 py-1.5 rounded-xl text-xs text-pulse-muted hover:text-pulse-primary cursor-pointer min-h-[38px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!noteContent.trim()}
                    onClick={handleSaveProjectNote}
                    className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-[#08110F] text-xs font-bold transition cursor-pointer min-h-[38px] flex items-center space-x-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Save Note to Memory</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Finding Developer Learning Modal */}
        {showLearningModal && learningConcept && (
          <FindingLearningModal
            isOpen={showLearningModal}
            onClose={() => setShowLearningModal(false)}
            concept={learningConcept}
            finding={finding}
            personalizationProfile={personalizationProfile}
            onApplyFix={(f) => {
              if (onFixWithAi) onFixWithAi(f);
              setShowLearningModal(false);
            }}
            onJumpToCode={(file, line) => {
              if (onJumpToCode) onJumpToCode(file, line);
              setShowLearningModal(false);
            }}
          />
        )}

        {/* Modal Footer Controls */}
        <div className="p-3.5 sm:p-5 border-t border-pulse-subtle bg-pulse-surface/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Quick Lifecycle Quick Actions */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => onStatusChange(finding.id, finding.status === 'FIXED' ? 'OPEN' : 'FIXED')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer min-h-[40px] ${
                finding.status === 'FIXED'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                  : 'border-pulse-subtle hover:bg-pulse-elevated text-pulse-secondary hover:text-pulse-primary'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>{finding.status === 'FIXED' ? 'Marked Fixed' : 'Mark Fixed'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowFalsePositiveMenu(!showFalsePositiveMenu)}
              className="px-3 py-1.5 rounded-xl border border-pulse-subtle hover:bg-pulse-elevated text-xs font-semibold text-pulse-secondary hover:text-pulse-primary transition cursor-pointer min-h-[40px]"
            >
              False Positive
            </button>

            <button
              type="button"
              onClick={() => onStatusChange(finding.id, finding.status === 'DEFERRED' ? 'OPEN' : 'DEFERRED')}
              className="px-3 py-1.5 rounded-xl border border-pulse-subtle hover:bg-pulse-elevated text-xs font-semibold text-pulse-muted hover:text-pulse-primary transition cursor-pointer min-h-[40px]"
            >
              {finding.status === 'DEFERRED' ? 'Resume' : 'Defer'}
            </button>
          </div>

          {/* Right Action Tools: Show in Code | Fix with AI */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 justify-end">
            {onJumpToCode && (
              <button
                type="button"
                onClick={() => {
                  onJumpToCode(finding.file, finding.line);
                  onClose();
                }}
                className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl border border-pulse-subtle bg-pulse-elevated hover:bg-pulse-elevated-hover text-xs font-semibold text-pulse-primary transition flex items-center justify-center space-x-1.5 cursor-pointer min-h-[40px]"
              >
                <Code2 className="h-3.5 w-3.5 text-pulse-accent shrink-0" />
                <span>Show in Code</span>
              </button>
            )}

            {onFixWithAi && (
              <button
                type="button"
                onClick={() => {
                  onFixWithAi(finding);
                  onClose();
                }}
                className="flex-1 sm:flex-initial px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer min-h-[40px]"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span>Fix with AI</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
