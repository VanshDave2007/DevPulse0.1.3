import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  FileCode,
  Filter,
  History,
  Layers,
  Lightbulb,
  Lock,
  Plus,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  User,
  X,
} from 'lucide-react';
import {
  ProjectMemory,
  ProjectMemoryConfidence,
  ProjectMemoryFilter,
  ProjectMemoryScope,
  ProjectMemorySource,
  ProjectMemoryStatus,
  ProjectMemoryType,
} from '../types';
import { ProjectMemoryService, ProjectMemoryStats } from '../services/projectMemoryService';

interface ProjectMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTypeFilter?: ProjectMemoryType | 'ALL';
  initialSearch?: string;
  onOpenFinding?: (findingId: string) => void;
}

type TabCategory =
  | 'ALL'
  | 'RULES'
  | 'ARCHITECTURE'
  | 'TECH_DEBT'
  | 'FALSE_POSITIVES'
  | 'CONVENTIONS'
  | 'PROPOSALS';

export const ProjectMemoryModal: React.FC<ProjectMemoryModalProps> = ({
  isOpen,
  onClose,
  initialTypeFilter = 'ALL',
  initialSearch = '',
}) => {
  const [activeTab, setActiveTab] = useState<TabCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedScope, setSelectedScope] = useState<ProjectMemoryScope | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<ProjectMemoryStatus | 'ALL'>('ALL');
  const [selectedKind, setSelectedKind] = useState<'EXPLICIT' | 'INFERRED' | 'ALL'>('ALL');

  const [expandedMemoryId, setExpandedMemoryId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMemory, setEditingMemory] = useState<ProjectMemory | null>(null);
  const [copiedContext, setCopiedContext] = useState(false);

  // Form State for Add / Edit
  const [formType, setFormType] = useState<ProjectMemoryType>('PROJECT_RULE');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formScope, setFormScope] = useState<ProjectMemoryScope>('PROJECT');
  const [formFiles, setFormFiles] = useState('');
  const [formSymbols, setFormSymbols] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formOwner, setFormOwner] = useState('');
  const [formImpact, setFormImpact] = useState('');
  const [formReviewDate, setFormReviewDate] = useState('');
  const [formRationale, setFormRationale] = useState('');
  const [formReason, setFormReason] = useState('');

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  const stats = useMemo(() => {
    return ProjectMemoryService.getMemoryStats();
  }, [refreshKey]);

  const allMemories = useMemo(() => {
    return ProjectMemoryService.getProjectMemory();
  }, [refreshKey]);

  const filteredMemories = useMemo(() => {
    return allMemories.filter((m) => {
      // Tab Category mapping
      if (activeTab === 'RULES') {
        if (m.type !== 'PROJECT_RULE' && m.type !== 'SECURITY_RULE' && m.type !== 'TESTING_RULE') return false;
      } else if (activeTab === 'ARCHITECTURE') {
        if (m.type !== 'ARCHITECTURE_DECISION' && m.type !== 'ARCHITECTURE_NOTE') return false;
      } else if (activeTab === 'TECH_DEBT') {
        if (m.type !== 'ACCEPTED_TECHNICAL_DEBT' && m.type !== 'TECHNICAL_DEBT' && m.type !== 'ACCEPTED_RISK') return false;
      } else if (activeTab === 'FALSE_POSITIVES') {
        if (m.type !== 'FALSE_POSITIVE') return false;
      } else if (activeTab === 'CONVENTIONS') {
        if (m.type !== 'CODING_CONVENTION' && m.type !== 'TESTING_CONVENTION' && m.type !== 'DEVELOPER_PREFERENCE') return false;
      } else if (activeTab === 'PROPOSALS') {
        if (m.status !== 'PROPOSED' && m.status !== 'SUGGESTED') return false;
      }

      // Explicit status filter
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'ACTIVE' || selectedStatus === 'APPROVED') {
          if (m.status !== 'ACTIVE' && m.status !== 'APPROVED' && m.status !== 'CONFIRMED') return false;
        } else if (m.status !== selectedStatus) {
          return false;
        }
      }

      // Scope filter
      if (selectedScope !== 'ALL' && m.scope !== selectedScope) return false;

      // Kind filter (Explicit vs Inferred)
      if (selectedKind !== 'ALL') {
        const itemKind = m.kind || (m.isExplicit ? 'EXPLICIT' : 'INFERRED');
        if (itemKind !== selectedKind) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = m.title.toLowerCase().includes(q);
        const inContent = m.content.toLowerCase().includes(q);
        const inTags = (m.tags || []).some((t) => t.toLowerCase().includes(q));
        const inReason = (m.reason || '').toLowerCase().includes(q);
        const inOwner = (m.owner || '').toLowerCase().includes(q);
        const inFiles = (m.relatedFiles || []).some((f) => f.toLowerCase().includes(q));
        const inSymbols = (m.relatedSymbols || []).some((s) => s.toLowerCase().includes(q));
        if (!inTitle && !inContent && !inTags && !inReason && !inOwner && !inFiles && !inSymbols) return false;
      }

      return true;
    });
  }, [allMemories, activeTab, selectedStatus, selectedScope, selectedKind, searchQuery]);

  // Duplicate / Similar rule checker for add form
  const duplicateCheck = useMemo(() => {
    if (!formTitle.trim() || formTitle.length < 4) return { duplicate: null, similar: [] };
    return ProjectMemoryService.findDuplicateOrSimilar(formTitle, formContent);
  }, [formTitle, formContent]);

  const handleOpenAddModal = (existing?: ProjectMemory) => {
    if (existing) {
      setEditingMemory(existing);
      setFormType(existing.type);
      setFormTitle(existing.title);
      setFormContent(existing.content);
      setFormScope(existing.scope);
      setFormFiles((existing.relatedFiles || []).join(', '));
      setFormSymbols((existing.relatedSymbols || []).join(', '));
      setFormTags((existing.tags || []).join(', '));
      setFormOwner(existing.owner || '');
      setFormImpact(existing.impact || '');
      setFormReviewDate(existing.reviewDate || '');
      setFormRationale(existing.rationale || '');
      setFormReason(existing.reason || '');
    } else {
      setEditingMemory(null);
      setFormType('PROJECT_RULE');
      setFormTitle('');
      setFormContent('');
      setFormScope('PROJECT');
      setFormFiles('');
      setFormSymbols('');
      setFormTags('');
      setFormOwner('');
      setFormImpact('');
      setFormReviewDate('');
      setFormRationale('');
      setFormReason('');
    }
    setShowAddModal(true);
  };

  const handleSaveMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    const filesArray = formFiles.split(',').map((s) => s.trim()).filter(Boolean);
    const symbolsArray = formSymbols.split(',').map((s) => s.trim()).filter(Boolean);
    const tagsArray = formTags.split(',').map((s) => s.trim()).filter(Boolean);

    if (editingMemory) {
      ProjectMemoryService.updateMemory(editingMemory.memoryId, {
        type: formType,
        title: formTitle,
        content: formContent,
        scope: formScope,
        relatedFiles: filesArray,
        relatedSymbols: symbolsArray,
        tags: tagsArray,
        owner: formOwner || undefined,
        impact: formImpact || undefined,
        reviewDate: formReviewDate || undefined,
        rationale: formRationale || undefined,
        reason: formReason || undefined,
      });
    } else {
      ProjectMemoryService.addMemory({
        type: formType,
        title: formTitle,
        content: formContent,
        scope: formScope,
        source: 'USER_CREATED',
        status: 'APPROVED',
        confidence: 'CONFIRMED',
        isExplicit: true,
        kind: 'EXPLICIT',
        relatedFiles: filesArray,
        relatedSymbols: symbolsArray,
        tags: tagsArray,
        owner: formOwner || undefined,
        impact: formImpact || undefined,
        reviewDate: formReviewDate || undefined,
        rationale: formRationale || undefined,
        reason: formReason || undefined,
      });
    }

    setShowAddModal(false);
    setRefreshKey((k) => k + 1);
  };

  const handleApprove = (memoryId: string) => {
    ProjectMemoryService.approveMemory(memoryId, 'Lead Architect');
    setRefreshKey((k) => k + 1);
  };

  const handleReject = (memoryId: string) => {
    ProjectMemoryService.rejectMemory(memoryId, 'Lead Architect');
    setRefreshKey((k) => k + 1);
  };

  const handleArchive = (memoryId: string) => {
    ProjectMemoryService.removeMemory(memoryId, true);
    setRefreshKey((k) => k + 1);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allMemories, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `devpulse-project-memory-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyMarkdown = () => {
    const text = ProjectMemoryService.formatContextForAI(allMemories);
    navigator.clipboard.writeText(text);
    setCopiedContext(true);
    setTimeout(() => setCopiedContext(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      id="project-memory-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="project-memory-modal-container"
        className="relative w-full max-w-5xl rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 sm:p-6 border-b border-pulse-subtle bg-gradient-to-r from-pulse-surface via-pulse-bg to-pulse-elevated gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-300">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-pulse-primary font-sans">
                  Project Memory & Contextual Intelligence
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-[10px] font-mono font-bold text-teal-500">
                  Durable Engine
                </span>
              </div>
              <p className="text-xs text-pulse-muted">
                Authoritative engineering policies, recorded technical debt, false positives, and architecture decisions.
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-pulse-subtle bg-pulse-elevated hover:bg-pulse-elevated-hover text-xs font-semibold text-pulse-primary transition cursor-pointer"
              title="Copy formatted context for AI prompts or CI gates"
            >
              {copiedContext ? <Check className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedContext ? 'Copied' : 'Copy Context'}</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-pulse-subtle bg-pulse-elevated hover:bg-pulse-elevated-hover text-xs font-semibold text-pulse-primary transition cursor-pointer"
              title="Export all memories as JSON"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={() => handleOpenAddModal()}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Memory</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-pulse-muted hover:text-pulse-primary transition cursor-pointer hover:bg-pulse-elevated"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Summary Statistics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 p-4 bg-pulse-bg border-b border-pulse-subtle text-xs">
          <div className="p-2 rounded-xl bg-pulse-surface border border-pulse-subtle flex flex-col justify-between">
            <span className="text-[10px] font-mono text-pulse-muted uppercase">Rules</span>
            <span className="text-base font-bold text-pulse-primary mt-1">{stats.byType.rules}</span>
          </div>
          <div className="p-2 rounded-xl bg-pulse-surface border border-pulse-subtle flex flex-col justify-between">
            <span className="text-[10px] font-mono text-pulse-muted uppercase">Architecture</span>
            <span className="text-base font-bold text-pulse-primary mt-1">{stats.byType.architecture}</span>
          </div>
          <div className="p-2 rounded-xl bg-pulse-surface border border-pulse-subtle flex flex-col justify-between">
            <span className="text-[10px] font-mono text-pulse-muted uppercase">Tech Debt</span>
            <span className="text-base font-bold text-amber-500 mt-1">{stats.byType.techDebt}</span>
          </div>
          <div className="p-2 rounded-xl bg-pulse-surface border border-pulse-subtle flex flex-col justify-between">
            <span className="text-[10px] font-mono text-pulse-muted uppercase">False Positives</span>
            <span className="text-base font-bold text-teal-400 mt-1">{stats.byType.falsePositives}</span>
          </div>
          <div className="p-2 rounded-xl bg-pulse-surface border border-pulse-subtle flex flex-col justify-between">
            <span className="text-[10px] font-mono text-pulse-muted uppercase">Accepted Risks</span>
            <span className="text-base font-bold text-purple-400 mt-1">{stats.byType.acceptedRisks}</span>
          </div>
          <div className="p-2 rounded-xl bg-pulse-surface border border-pulse-subtle flex flex-col justify-between">
            <span className="text-[10px] font-mono text-pulse-muted uppercase">Conventions</span>
            <span className="text-base font-bold text-pulse-primary mt-1">{stats.byType.conventions}</span>
          </div>
          <div className="p-2 rounded-xl bg-pulse-surface border border-pulse-subtle flex flex-col justify-between">
            <span className="text-[10px] font-mono text-pulse-muted uppercase">Proposed</span>
            <span className="text-base font-bold text-amber-400 mt-1">{stats.proposed}</span>
          </div>
          <div className="p-2 rounded-xl bg-pulse-surface border border-pulse-subtle flex flex-col justify-between">
            <span className="text-[10px] font-mono text-pulse-muted uppercase">Review Needed</span>
            <span className={`text-base font-bold mt-1 ${stats.requiresReview > 0 ? 'text-amber-500' : 'text-pulse-muted'}`}>
              {stats.requiresReview}
            </span>
          </div>
        </div>

        {/* Tab Navigation & Search Filter Bar */}
        <div className="p-4 border-b border-pulse-subtle space-y-3 bg-pulse-surface">
          {/* Tab Categories */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ALL' as TabCategory, label: 'All Items', count: stats.total },
              { id: 'RULES' as TabCategory, label: 'Rules & Policies', count: stats.byType.rules },
              { id: 'ARCHITECTURE' as TabCategory, label: 'Architecture & ADRs', count: stats.byType.architecture },
              { id: 'TECH_DEBT' as TabCategory, label: 'Technical Debt', count: stats.byType.techDebt },
              { id: 'FALSE_POSITIVES' as TabCategory, label: 'False Positives', count: stats.byType.falsePositives },
              { id: 'CONVENTIONS' as TabCategory, label: 'Conventions', count: stats.byType.conventions },
              { id: 'PROPOSALS' as TabCategory, label: 'Proposed / Review', count: stats.proposed },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-teal-500/20 border border-teal-500/50 text-teal-600 dark:text-teal-300'
                      : 'bg-pulse-elevated border border-pulse-subtle text-pulse-secondary hover:text-pulse-primary'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-pulse-bg text-pulse-muted">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search and Secondary Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            {/* Search Input */}
            <div className="sm:col-span-6 relative flex items-center">
              <Search className="absolute left-3 h-3.5 w-3.5 text-pulse-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, tag, owner, file, or rationale..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs text-pulse-primary placeholder-pulse-muted focus:border-teal-500 focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-pulse-muted hover:text-pulse-primary text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Scope Filter */}
            <div className="sm:col-span-2">
              <select
                value={selectedScope}
                onChange={(e) => setSelectedScope(e.target.value as any)}
                className="w-full px-2.5 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs text-pulse-primary focus:border-teal-500 focus:outline-none"
              >
                <option value="ALL">All Scopes</option>
                <option value="PROJECT">Project Scope</option>
                <option value="MODULE">Module Scope</option>
                <option value="FILE">File Scope</option>
                <option value="SYMBOL">Symbol Scope</option>
                <option value="FINDING">Finding Scope</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full px-2.5 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs text-pulse-primary focus:border-teal-500 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved / Active</option>
                <option value="PROPOSED">Proposed</option>
                <option value="REJECTED">Rejected</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {/* Kind Filter */}
            <div className="sm:col-span-2">
              <select
                value={selectedKind}
                onChange={(e) => setSelectedKind(e.target.value as any)}
                className="w-full px-2.5 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs text-pulse-primary focus:border-teal-500 focus:outline-none"
              >
                <option value="ALL">All Sources</option>
                <option value="EXPLICIT">Explicit Policies</option>
                <option value="INFERRED">Inferred / AI</option>
              </select>
            </div>
          </div>
        </div>

        {/* Memory Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-pulse-bg">
          {filteredMemories.length === 0 ? (
            <div className="text-center py-12 space-y-3 bg-pulse-surface rounded-2xl border border-pulse-subtle p-6">
              <div className="p-3 rounded-full bg-pulse-elevated border border-pulse-subtle text-pulse-muted w-12 h-12 mx-auto flex items-center justify-center">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-pulse-primary">No Matching Project Memories Found</h3>
              <p className="text-xs text-pulse-muted max-w-md mx-auto">
                No recorded rules or decisions match your current filters. Clear the search or create a new explicit project memory.
              </p>
              <button
                onClick={() => handleOpenAddModal()}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-sm cursor-pointer inline-flex items-center space-x-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Add Project Memory</span>
              </button>
            </div>
          ) : (
            filteredMemories.map((mem) => {
              const isExpanded = expandedMemoryId === mem.memoryId;
              const isReviewNeeded = ProjectMemoryService.isReviewRequired(mem);
              const isProposed = mem.status === 'PROPOSED' || mem.status === 'SUGGESTED';

              // Visual styling per status
              const statusBadge =
                mem.status === 'APPROVED' || mem.status === 'ACTIVE' || mem.status === 'CONFIRMED'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : mem.status === 'PROPOSED' || mem.status === 'SUGGESTED'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : mem.status === 'REJECTED'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  : 'bg-pulse-elevated text-pulse-muted border-pulse-subtle';

              // Type badge color
              const typeColor =
                mem.type === 'PROJECT_RULE' || mem.type === 'SECURITY_RULE'
                  ? 'bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/30'
                  : mem.type === 'ARCHITECTURE_DECISION'
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/30'
                  : mem.type === 'ACCEPTED_TECHNICAL_DEBT' || mem.type === 'ACCEPTED_RISK'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30'
                  : mem.type === 'FALSE_POSITIVE'
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30'
                  : 'bg-pulse-surface text-pulse-secondary border-pulse-subtle';

              return (
                <div
                  key={mem.memoryId}
                  className={`rounded-2xl border transition shadow-sm overflow-hidden ${
                    isProposed
                      ? 'border-amber-500/40 bg-gradient-to-r from-amber-500/5 via-pulse-surface to-pulse-surface'
                      : 'border-pulse-subtle bg-pulse-surface hover:border-pulse-strong'
                  }`}
                >
                  {/* Card Header & Preview */}
                  <div className="p-4 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Type Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${typeColor}`}>
                          {mem.type.replace(/_/g, ' ')}
                        </span>

                        {/* Status Badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${statusBadge}`}>
                          {mem.status}
                        </span>

                        {/* Kind (Explicit vs Inferred) */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${mem.isExplicit ? 'bg-sky-500/10 text-sky-500 border border-sky-500/30' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                          {mem.isExplicit ? 'Explicit Policy' : 'AI Inferred'}
                        </span>

                        {/* Scope */}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-pulse-elevated text-pulse-muted border border-pulse-subtle">
                          Scope: {mem.scope}
                        </span>

                        {/* Review Required Alert */}
                        {isReviewNeeded && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center space-x-1 font-bold animate-pulse">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Review Scheduled ({mem.reviewDate})</span>
                          </span>
                        )}
                      </div>

                      {/* Top Right Quick Actions */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {isProposed && (
                          <>
                            <button
                              onClick={() => handleApprove(mem.memoryId)}
                              className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer shadow-sm"
                              title="Approve and promote to active project policy"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleReject(mem.memoryId)}
                              className="px-2.5 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[11px] font-semibold flex items-center space-x-1 transition cursor-pointer"
                              title="Reject proposed suggestion"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleOpenAddModal(mem)}
                          className="p-1.5 rounded-xl hover:bg-pulse-elevated text-pulse-muted hover:text-pulse-primary transition cursor-pointer"
                          title="Edit Memory"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleArchive(mem.memoryId)}
                          className="p-1.5 rounded-xl hover:bg-pulse-elevated text-pulse-muted hover:text-rose-500 transition cursor-pointer"
                          title="Archive Memory"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => setExpandedMemoryId(isExpanded ? null : mem.memoryId)}
                          className="p-1.5 rounded-xl hover:bg-pulse-elevated text-pulse-muted hover:text-pulse-primary transition cursor-pointer flex items-center space-x-1 text-xs"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Title & Core Content */}
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-pulse-primary font-sans flex items-center space-x-2">
                        <span>{mem.title}</span>
                      </h4>
                      <p className="text-xs text-pulse-secondary leading-relaxed font-sans">
                        {mem.content}
                      </p>
                    </div>

                    {/* Related Files & Tags Strip */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {mem.relatedFiles && mem.relatedFiles.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <FileCode className="h-3 w-3 text-pulse-muted" />
                          {mem.relatedFiles.map((rf, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-pulse-elevated text-pulse-secondary border border-pulse-subtle"
                            >
                              {rf}
                            </span>
                          ))}
                        </div>
                      )}

                      {mem.relatedSymbols && mem.relatedSymbols.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Code2 className="h-3 w-3 text-pulse-muted" />
                          {mem.relatedSymbols.map((sym, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-teal-500/10 text-teal-600 dark:text-teal-300 border border-teal-500/20"
                            >
                              {sym}
                            </span>
                          ))}
                        </div>
                      )}

                      {mem.tags && mem.tags.length > 0 && (
                        <div className="flex items-center space-x-1 ml-auto">
                          <Tag className="h-3 w-3 text-pulse-muted" />
                          {mem.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono text-pulse-muted"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="p-4 border-t border-pulse-subtle bg-pulse-elevated/40 space-y-3 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {mem.decision && (
                          <div className="p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle space-y-1">
                            <span className="text-[10px] font-mono uppercase text-pulse-muted font-bold">Recorded Decision</span>
                            <p className="text-pulse-primary leading-relaxed">{mem.decision}</p>
                          </div>
                        )}

                        {mem.rationale && (
                          <div className="p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle space-y-1">
                            <span className="text-[10px] font-mono uppercase text-pulse-muted font-bold">Architecture Rationale</span>
                            <p className="text-pulse-primary leading-relaxed">{mem.rationale}</p>
                          </div>
                        )}

                        {mem.impact && (
                          <div className="p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle space-y-1">
                            <span className="text-[10px] font-mono uppercase text-amber-500 font-bold">Technical Debt Impact</span>
                            <p className="text-pulse-primary leading-relaxed">{mem.impact}</p>
                          </div>
                        )}

                        {mem.developerExplanation && (
                          <div className="p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle space-y-1">
                            <span className="text-[10px] font-mono uppercase text-teal-400 font-bold">Developer Notes</span>
                            <p className="text-pulse-primary leading-relaxed">{mem.developerExplanation}</p>
                          </div>
                        )}
                      </div>

                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-pulse-muted pt-2 border-t border-pulse-subtle gap-2">
                        <div className="flex items-center space-x-3">
                          <span>Created: {new Date(mem.createdAt).toLocaleDateString()}</span>
                          {mem.createdBy && <span>By: {mem.createdBy}</span>}
                          {mem.owner && <span>Owner: {mem.owner}</span>}
                          {mem.reviewDate && <span>Review Date: {mem.reviewDate}</span>}
                        </div>
                        <div>
                          <span>ID: {mem.memoryId}</span>
                        </div>
                      </div>

                      {/* History Timeline */}
                      {mem.history && mem.history.length > 0 && (
                        <div className="pt-2 border-t border-pulse-subtle space-y-1">
                          <span className="text-[10px] font-mono uppercase text-pulse-muted font-bold flex items-center space-x-1">
                            <History className="h-3 w-3" />
                            <span>Audit & Change Trail</span>
                          </span>
                          <div className="space-y-1">
                            {mem.history.map((h, i) => (
                              <div key={i} className="flex items-center space-x-2 text-[10px] font-mono text-pulse-muted">
                                <span>• {new Date(h.timestamp).toLocaleTimeString()} ({new Date(h.timestamp).toLocaleDateString()}):</span>
                                <strong className="text-pulse-primary">{h.action}</strong>
                                <span>by {h.actor}</span>
                                {h.details && <span>— {h.details}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-pulse-subtle bg-pulse-surface">
          <span className="text-xs text-pulse-muted font-mono">
            Showing {filteredMemories.length} of {allMemories.length} context entries
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Add / Edit Modal Subdialog */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="relative w-full max-w-xl rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-pulse-subtle pb-3">
              <h3 className="text-base font-bold text-pulse-primary">
                {editingMemory ? 'Edit Project Memory' : 'Add New Project Memory / Rule'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-pulse-muted hover:text-pulse-primary"
              >
                ✕
              </button>
            </div>

            {/* Duplicate Rule Warning */}
            {duplicateCheck.duplicate && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs space-y-1">
                <div className="flex items-center space-x-1.5 font-bold">
                  <AlertCircle className="h-4 w-4" />
                  <span>Duplicate Memory Detected</span>
                </div>
                <p>An exact rule titled &quot;{duplicateCheck.duplicate.title}&quot; already exists.</p>
              </div>
            )}

            {duplicateCheck.similar.length > 0 && !duplicateCheck.duplicate && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs space-y-1">
                <div className="flex items-center space-x-1.5 font-bold">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Similar Memory Found</span>
                </div>
                <p>Similar to existing rule: &quot;{duplicateCheck.similar[0].title}&quot;.</p>
              </div>
            )}

            <form onSubmit={handleSaveMemory} className="space-y-3 text-xs">
              {/* Type and Scope row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-pulse-muted uppercase font-bold">Memory Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-pulse-primary focus:border-teal-500 focus:outline-none"
                  >
                    <option value="PROJECT_RULE">Project Rule</option>
                    <option value="ARCHITECTURE_DECISION">Architecture Decision (ADR)</option>
                    <option value="ARCHITECTURE_NOTE">Architecture Note</option>
                    <option value="ACCEPTED_TECHNICAL_DEBT">Accepted Technical Debt</option>
                    <option value="ACCEPTED_RISK">Accepted Risk</option>
                    <option value="SECURITY_RULE">Security Rule / Decision</option>
                    <option value="TESTING_RULE">Testing Standard / Rule</option>
                    <option value="CODING_CONVENTION">Coding Convention</option>
                    <option value="FALSE_POSITIVE">False Positive</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-pulse-muted uppercase font-bold">Scope</label>
                  <select
                    value={formScope}
                    onChange={(e) => setFormScope(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-pulse-primary focus:border-teal-500 focus:outline-none"
                  >
                    <option value="PROJECT">Project (Global)</option>
                    <option value="MODULE">Module</option>
                    <option value="FILE">File</option>
                    <option value="SYMBOL">Symbol</option>
                    <option value="FINDING">Finding</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="font-mono text-pulse-muted uppercase font-bold">Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Database queries must use repository layer"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-pulse-primary focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Content */}
              <div className="space-y-1">
                <label className="font-mono text-pulse-muted uppercase font-bold">Rule / Memory Content</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Describe the policy, constraint, or accepted condition..."
                  rows={3}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-pulse-primary focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Related Files & Symbols */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-pulse-muted uppercase font-bold">Related Files</label>
                  <input
                    type="text"
                    value={formFiles}
                    onChange={(e) => setFormFiles(e.target.value)}
                    placeholder="e.g. authService.ts, controller.ts"
                    className="w-full px-3 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-pulse-primary focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-pulse-muted uppercase font-bold">Related Symbols</label>
                  <input
                    type="text"
                    value={formSymbols}
                    onChange={(e) => setFormSymbols(e.target.value)}
                    placeholder="e.g. AuthService, verifyToken"
                    className="w-full px-3 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-pulse-primary focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Owner & Review Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-pulse-muted uppercase font-bold">Owner / Assignee</label>
                  <input
                    type="text"
                    value={formOwner}
                    onChange={(e) => setFormOwner(e.target.value)}
                    placeholder="e.g. Security Team, Payments"
                    className="w-full px-3 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-pulse-primary focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-pulse-muted uppercase font-bold">Review Date</label>
                  <input
                    type="date"
                    value={formReviewDate}
                    onChange={(e) => setFormReviewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-pulse-primary focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Impact / Rationale */}
              <div className="space-y-1">
                <label className="font-mono text-pulse-muted uppercase font-bold">Impact / Rationale</label>
                <input
                  type="text"
                  value={formImpact || formRationale}
                  onChange={(e) => {
                    setFormImpact(e.target.value);
                    setFormRationale(e.target.value);
                  }}
                  placeholder="e.g. Mitigates SQL injection; avoids breaking legacy client contracts"
                  className="w-full px-3 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-pulse-primary focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <label className="font-mono text-pulse-muted uppercase font-bold">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="e.g. security, database, architecture"
                  className="w-full px-3 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-pulse-primary focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-pulse-subtle">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-pulse-elevated text-pulse-muted hover:text-pulse-primary font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formTitle.trim() || !formContent.trim() || !!duplicateCheck.duplicate}
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {editingMemory ? 'Update Memory' : 'Create Memory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
