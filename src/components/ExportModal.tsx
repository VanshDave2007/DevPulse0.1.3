import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode,
  FileSpreadsheet,
  FileText,
  FolderGit2,
  FolderSync,
  Github,
  Globe,
  HeartPulse,
  HardDrive,
  Layers,
  LayoutTemplate,
  Loader2,
  Lock,
  Maximize2,
  Network,
  Palette,
  RefreshCw,
  Sliders,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  exportAnalysisAsJSON,
  exportAnalysisAsMarkdown,
  exportAnalysisAsPDF,
  generateJSONReport,
  generateMarkdownReport,
  generatePDFBlob,
  ExportOptions,
  ReportTemplateConfig,
  ReportTemplatePreset,
  ReportAccentColor,
  DEFAULT_TEMPLATE_CONFIG,
  TEMPLATE_PRESETS,
  getAccentColorRGB,
} from '../utils/exportReport';
import {
  uploadReportToDrive,
  syncReportToGitHubGist,
  syncReportToGitHubRepo,
  requestGoogleAccessToken,
  getStoredGoogleToken,
  hasGoogleWorkspaceAccess,
  clearStoredGoogleToken,
} from '../services/workspace';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type ExportFormat = 'pdf' | 'markdown' | 'json';
export type ModalActiveTab = 'export' | 'template' | 'sync';
export type SyncProvider = 'drive' | 'github_gist' | 'github_repo';

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { analysis, code, fileName, aiMessages, addToast } = useApp();

  // Active view tab in modal
  const [modalTab, setModalTab] = useState<ModalActiveTab>('export');

  // Format selection & preview
  const [selectedFormats, setSelectedFormats] = useState<ExportFormat[]>(['pdf']);
  const [showPreview, setShowPreview] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<ExportFormat>('pdf');

  // Templating System state
  const [templateConfig, setTemplateConfig] = useState<ReportTemplateConfig>(DEFAULT_TEMPLATE_CONFIG);
  const [showBlockToggles, setShowBlockToggles] = useState(false);

  // Local Export progress state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStage, setExportStage] = useState('');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Cloud Sync state
  const [syncProvider, setSyncProvider] = useState<SyncProvider>('drive');
  const [syncFormat, setSyncFormat] = useState<ExportFormat>('markdown');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    provider: SyncProvider;
    url: string;
    label: string;
    id?: string;
  } | null>(null);

  // GitHub form settings
  const [githubToken, setGithubToken] = useState<string>('');
  const [gistIsPublic, setGistIsPublic] = useState<boolean>(false);
  const [repoOwner, setRepoOwner] = useState<string>('');
  const [repoName, setRepoName] = useState<string>('');
  const [repoBranch, setRepoBranch] = useState<string>('main');
  const [repoFilePath, setRepoFilePath] = useState<string>('.github/reports/devpulse-audit.md');

  // Google Drive state
  const [hasDriveToken, setHasDriveToken] = useState<boolean>(false);

  const progressIntervalRef = useRef<any>(null);

  useEffect(() => {
    setHasDriveToken(hasGoogleWorkspaceAccess());
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Synchronize active preview tab if selected formats change
  useEffect(() => {
    if (selectedFormats.length > 0 && !selectedFormats.includes(activePreviewTab)) {
      setActivePreviewTab(selectedFormats[0]);
    }
  }, [selectedFormats, activePreviewTab]);

  const options: ExportOptions = useMemo(() => ({
    includeMetrics: templateConfig.blocks.showMetrics,
    includeSmells: templateConfig.blocks.showSmells,
    includePulseMap: templateConfig.blocks.showPulseMap,
    includeFunctions: templateConfig.blocks.showFunctions,
    includeImports: templateConfig.blocks.showDependencies,
    includeAiSummary: templateConfig.blocks.showAiGuidance,
    template: templateConfig,
  }), [templateConfig]);

  const toggleFormat = (fmt: ExportFormat) => {
    if (isExporting) return;
    setSelectedFormats((prev) => {
      if (prev.includes(fmt)) {
        return prev.filter((f) => f !== fmt);
      } else {
        return [...prev, fmt];
      }
    });
  };

  const handleSelectAll = () => {
    if (isExporting) return;
    if (selectedFormats.length === 3) {
      setSelectedFormats(['pdf']);
    } else {
      setSelectedFormats(['pdf', 'markdown', 'json']);
    }
  };

  // Apply template preset
  const handlePresetSelect = (preset: ReportTemplatePreset) => {
    const presetData = TEMPLATE_PRESETS[preset];
    if (presetData) {
      setTemplateConfig((prev) => ({
        ...prev,
        ...presetData,
        blocks: {
          ...prev.blocks,
          ...(presetData.blocks || {}),
        },
      }));
      addToast({
        type: 'info',
        title: 'Template Preset Applied',
        description: `Switched report layout to "${presetData.reportTitle || preset}".`,
      });
    }
  };

  // Extract latest AI assistant response for summary inclusion
  const latestAiResponse = [...aiMessages]
    .reverse()
    .find((m) => m.role === 'assistant' && !m.isError && m.id !== 'welcome')?.content;

  // Generate live preview string payloads
  const liveMarkdownPreview = useMemo(() => {
    if (!analysis) return '';
    return generateMarkdownReport(analysis, code, fileName, options, latestAiResponse);
  }, [analysis, code, fileName, options, latestAiResponse]);

  const liveJsonPreview = useMemo(() => {
    if (!analysis) return '';
    return generateJSONReport(analysis, code, fileName, latestAiResponse);
  }, [analysis, code, fileName, latestAiResponse]);

  // Local Download Handler
  const handleExport = () => {
    if (!analysis || isExporting || selectedFormats.length === 0) return;
    setIsExporting(true);
    setExportProgress(10);
    setExportStage(
      selectedFormats.length > 1
        ? `Preparing batch export pipeline (${selectedFormats.length} formats)...`
        : `Preparing ${selectedFormats[0].toUpperCase()} export pipeline...`
    );

    // Build dynamic stages based on selected formats
    const dynamicStages: { p: number; stage: string }[] = [];
    const stepIncrement = Math.floor(70 / Math.max(1, selectedFormats.length));

    selectedFormats.forEach((fmt, idx) => {
      const startP = 15 + idx * stepIncrement;
      if (fmt === 'pdf') {
        dynamicStages.push({
          p: startP,
          stage: `Applying "${templateConfig.reportTitle}" layout to PDF (${idx + 1}/${selectedFormats.length})...`,
        });
      } else if (fmt === 'markdown') {
        dynamicStages.push({
          p: startP,
          stage: `Formatting branded Markdown document (${idx + 1}/${selectedFormats.length})...`,
        });
      } else if (fmt === 'json') {
        dynamicStages.push({
          p: startP,
          stage: `Serializing JSON telemetry & AST (${idx + 1}/${selectedFormats.length})...`,
        });
      }
    });

    dynamicStages.push(
      { p: 90, stage: 'Finalizing batch download streams...' },
      { p: 100, stage: 'Batch download ready!' }
    );

    let currentStageIndex = 0;

    progressIntervalRef.current = setInterval(() => {
      if (currentStageIndex < dynamicStages.length) {
        const item = dynamicStages[currentStageIndex];
        setExportProgress(item.p);
        setExportStage(item.stage);
        currentStageIndex++;
      } else {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;

        setTimeout(async () => {
          try {
            // Trigger sequential downloads with small delay so browser doesn't drop parallel downloads
            for (let i = 0; i < selectedFormats.length; i++) {
              const fmt = selectedFormats[i];
              if (fmt === 'pdf') {
                exportAnalysisAsPDF(analysis, code, fileName, options, latestAiResponse);
              } else if (fmt === 'markdown') {
                exportAnalysisAsMarkdown(analysis, code, fileName, options, latestAiResponse);
              } else if (fmt === 'json') {
                exportAnalysisAsJSON(analysis, code, fileName, latestAiResponse);
              }
              if (i < selectedFormats.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 200));
              }
            }

            if (selectedFormats.length > 1) {
              addToast({
                type: 'success',
                title: 'Batch Export Complete',
                description: `Successfully downloaded ${selectedFormats.length} reports (${selectedFormats.map((f) => f.toUpperCase()).join(', ')}) with ${templateConfig.templatePreset} template.`,
              });
            } else {
              const singleFormat = selectedFormats[0];
              addToast({
                type: 'success',
                title: `Report Exported (${singleFormat.toUpperCase()})`,
                description: `Successfully exported analysis report for ${fileName} as ${singleFormat.toUpperCase()}.`,
              });
            }
          } catch (err: any) {
            console.error('Export failed:', err);
            addToast({
              type: 'error',
              title: 'Export Failed',
              description: err?.message || 'An unexpected error occurred while generating the export report.',
            });
          } finally {
            setIsExporting(false);
            setExportProgress(0);
            setExportStage('');
            onClose();
          }
        }, 300);
      }
    }, 160);
  };

  // Direct Cloud Sync Handler
  const handleCloudSync = async () => {
    if (!analysis || isSyncing) return;
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const safeName = (fileName || 'code_intelligence').replace(/\.[^/.]+$/, '');
      const dateTag = new Date().toISOString().slice(0, 10);

      if (syncProvider === 'drive') {
        let token = getStoredGoogleToken();
        if (!token) {
          token = await requestGoogleAccessToken();
          setHasDriveToken(true);
        }

        if (syncFormat === 'pdf') {
          const pdfBlob = generatePDFBlob(analysis, code, fileName, options, latestAiResponse);
          const uploadRes = await uploadReportToDrive(
            token,
            `devpulse-audit-${safeName}-${dateTag}.pdf`,
            pdfBlob,
            'application/pdf'
          );
          setSyncResult({
            provider: 'drive',
            url: uploadRes.webViewLink || `https://drive.google.com/file/d/${uploadRes.id}/view`,
            label: uploadRes.name || `devpulse-audit-${safeName}-${dateTag}.pdf`,
            id: uploadRes.id,
          });
        } else if (syncFormat === 'json') {
          const jsonContent = liveJsonPreview;
          const uploadRes = await uploadReportToDrive(
            token,
            `devpulse-intelligence-${safeName}-${dateTag}.json`,
            jsonContent,
            'application/json'
          );
          setSyncResult({
            provider: 'drive',
            url: uploadRes.webViewLink || `https://drive.google.com/file/d/${uploadRes.id}/view`,
            label: uploadRes.name || `devpulse-intelligence-${safeName}-${dateTag}.json`,
            id: uploadRes.id,
          });
        } else {
          const mdContent = liveMarkdownPreview;
          const uploadRes = await uploadReportToDrive(
            token,
            `devpulse-report-${safeName}-${dateTag}.md`,
            mdContent,
            'text/markdown'
          );
          setSyncResult({
            provider: 'drive',
            url: uploadRes.webViewLink || `https://drive.google.com/file/d/${uploadRes.id}/view`,
            label: uploadRes.name || `devpulse-report-${safeName}-${dateTag}.md`,
            id: uploadRes.id,
          });
        }

        addToast({
          type: 'success',
          title: 'Synced to Google Drive',
          description: `Successfully uploaded report to your Google Drive!`,
        });
      } else if (syncProvider === 'github_gist') {
        const mdContent = liveMarkdownPreview;
        const gistRes = await syncReportToGitHubGist(
          `devpulse-report-${safeName}-${dateTag}.md`,
          mdContent,
          `${templateConfig.reportTitle} - ${templateConfig.organizationName} (${fileName})`,
          githubToken,
          gistIsPublic
        );

        setSyncResult({
          provider: 'github_gist',
          url: gistRes.htmlUrl,
          label: `Gist: ${gistRes.id.slice(0, 10)}...`,
          id: gistRes.id,
        });

        addToast({
          type: 'success',
          title: 'Synced to GitHub Gist',
          description: `Created new GitHub Gist with your report!`,
        });
      } else if (syncProvider === 'github_repo') {
        if (!repoOwner || !repoName || !githubToken) {
          throw new Error('Please specify GitHub Repository Owner, Repo Name, and a valid GitHub Token.');
        }

        const mdContent = liveMarkdownPreview;
        const repoRes = await syncReportToGitHubRepo(
          repoOwner.trim(),
          repoName.trim(),
          repoFilePath.trim() || `.github/reports/devpulse-audit-${safeName}.md`,
          mdContent,
          `docs(audit): add ${templateConfig.reportTitle} for ${fileName} [skip ci]`,
          githubToken,
          repoBranch.trim() || 'main'
        );

        setSyncResult({
          provider: 'github_repo',
          url: repoRes.fileUrl,
          label: `${repoOwner}/${repoName}:${repoBranch}`,
        });

        addToast({
          type: 'success',
          title: 'Synced to GitHub Repository',
          description: `Report committed to ${repoOwner}/${repoName}@${repoBranch}!`,
        });
      }
    } catch (err: any) {
      console.error('Cloud Sync failed:', err);
      addToast({
        type: 'error',
        title: 'Sync Failed',
        description: err?.message || 'Failed to synchronize report with cloud service.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyClipboard = (preferredFormat?: ExportFormat) => {
    if (!analysis) return;
    try {
      const copyTarget =
        preferredFormat ||
        (showPreview
          ? activePreviewTab
          : selectedFormats.includes('markdown')
          ? 'markdown'
          : 'json');

      if (copyTarget === 'markdown') {
        const mdText = liveMarkdownPreview;
        navigator.clipboard.writeText(mdText);
        setCopiedType('markdown');
        addToast({
          type: 'success',
          title: 'Markdown Copied',
          description: 'Analysis Markdown report copied to your clipboard.',
        });
      } else {
        const payload = liveJsonPreview;
        navigator.clipboard.writeText(payload);
        setCopiedType('json');
        addToast({
          type: 'success',
          title: 'JSON Copied',
          description: 'Analysis JSON data copied to your clipboard.',
        });
      }
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Copy Failed',
        description: 'Failed to copy report to clipboard.',
      });
    }
  };

  const formatList: Array<{
    id: ExportFormat;
    name: string;
    ext: string;
    icon: React.ReactNode;
    desc: string;
  }> = [
    {
      id: 'pdf',
      name: 'PDF Document',
      ext: '.pdf',
      icon: <FileText className="h-4 w-4" />,
      desc: 'Executive multi-page report with scorecards, custom branding & findings.',
    },
    {
      id: 'markdown',
      name: 'Markdown Report',
      ext: '.md',
      icon: <FileCode className="h-4 w-4" />,
      desc: 'Clean GitHub-flavored document with custom layout blocks & auditor notes.',
    },
    {
      id: 'json',
      name: 'JSON Data',
      ext: '.json',
      icon: <Code2 className="h-4 w-4" />,
      desc: 'Machine-readable AST metrics, diagnostic smells & pulse topology graph.',
    },
  ];

  const presetList: Array<{ id: ReportTemplatePreset; name: string; desc: string; icon: string }> = [
    { id: 'executive', name: 'Executive Brief', desc: 'Scorecard, high-level governance, risk summary', icon: '📊' },
    { id: 'technical', name: 'Technical Audit', desc: 'Full metric matrices, smells, function complexity & map', icon: '📐' },
    { id: 'security', name: 'Security & Hygiene', desc: 'Vulnerabilities, dangerous imports & remediation patches', icon: '🛡️' },
    { id: 'minimal', name: 'Minimal Note', desc: 'Fast condensed summary for PR reviews & quick checks', icon: '⚡' },
    { id: 'custom', name: 'Custom Template', desc: 'Fully personalized layout blocks, branding & accents', icon: '🎨' },
  ];

  const accentColors: Array<{ id: ReportAccentColor; name: string; bgClass: string; borderClass: string }> = [
    { id: 'teal', name: 'Teal', bgClass: 'bg-teal-500', borderClass: 'border-teal-400' },
    { id: 'indigo', name: 'Indigo', bgClass: 'bg-indigo-500', borderClass: 'border-indigo-400' },
    { id: 'amber', name: 'Amber', bgClass: 'bg-amber-500', borderClass: 'border-amber-400' },
    { id: 'rose', name: 'Rose', bgClass: 'bg-rose-500', borderClass: 'border-rose-400' },
    { id: 'slate', name: 'Slate', bgClass: 'bg-slate-500', borderClass: 'border-slate-400' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`relative w-full rounded-3xl bg-pulse-surface border border-pulse-subtle p-6 shadow-2xl space-y-5 transition-all duration-300 ${
          showPreview ? 'max-w-4xl' : 'max-w-xl'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-pulse-subtle pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 border border-teal-500/30 text-pulse-accent">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-pulse-primary">Export & Report Center</h2>
              <p className="text-xs text-pulse-secondary">
                Generate branded documents, custom templates, or sync directly to Google Drive & GitHub.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Live Preview Toggle Button */}
            <button
              type="button"
              onClick={() => setShowPreview((prev) => !prev)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition cursor-pointer ${
                showPreview
                  ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-sm'
                  : 'bg-pulse-elevated border-pulse-subtle text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated-hover'
              }`}
              title={showPreview ? 'Hide Report Preview' : 'Show Live Read-only Preview'}
            >
              {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span>{showPreview ? 'Hide Preview' : 'Preview'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-pulse-muted hover:text-pulse-primary hover:bg-pulse-elevated transition cursor-pointer"
              aria-label="Close Export Dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs (Export Formats, Template Customizer, Cloud Sync) */}
        <div className="flex items-center space-x-1.5 bg-pulse-bg p-1 rounded-2xl border border-pulse-subtle">
          <button
            type="button"
            onClick={() => setModalTab('export')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-mono font-semibold transition cursor-pointer ${
              modalTab === 'export'
                ? 'bg-pulse-surface text-teal-400 shadow-sm border border-pulse-subtle'
                : 'text-pulse-secondary hover:text-pulse-primary'
            }`}
          >
            <Download className="h-3.5 w-3.5" />
            <span>1. Download Formats</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('template')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-mono font-semibold transition cursor-pointer ${
              modalTab === 'template'
                ? 'bg-pulse-surface text-teal-400 shadow-sm border border-pulse-subtle'
                : 'text-pulse-secondary hover:text-pulse-primary'
            }`}
          >
            <LayoutTemplate className="h-3.5 w-3.5" />
            <span>2. Branding & Template</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('sync')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-mono font-semibold transition cursor-pointer ${
              modalTab === 'sync'
                ? 'bg-pulse-surface text-teal-400 shadow-sm border border-pulse-subtle'
                : 'text-pulse-secondary hover:text-pulse-primary'
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>3. Cloud & Git Sync</span>
          </button>
        </div>

        {/* Live Read-only Preview Panel (when Preview is enabled) */}
        {showPreview && analysis && (
          <div className="space-y-3 rounded-2xl bg-pulse-bg border border-pulse-subtle p-4 animate-fadeIn">
            {/* Preview Header & Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pulse-subtle pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-semibold text-pulse-primary uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                  <span>Live Report Preview ({templateConfig.templatePreset.toUpperCase()})</span>
                </span>
              </div>

              {/* Format Preview Tab Selector */}
              <div className="flex items-center space-x-1 bg-pulse-surface p-1 rounded-xl border border-pulse-subtle">
                {formatList.map((f) => {
                  const isTabActive = activePreviewTab === f.id;
                  const isSelectedForExport = selectedFormats.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setActivePreviewTab(f.id)}
                      className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                        isTabActive
                          ? 'bg-teal-500 text-[#08110F] font-bold shadow-sm'
                          : 'text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated'
                      }`}
                    >
                      {f.icon}
                      <span>{f.name.split(' ')[0]}</span>
                      {isSelectedForExport && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isTabActive ? 'bg-[#08110F]' : 'bg-teal-400'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview Content Area */}
            <div className="max-h-64 sm:max-h-72 overflow-y-auto overflow-x-auto rounded-xl bg-pulse-surface p-3.5 border border-pulse-subtle font-mono text-xs text-pulse-primary custom-scrollbar leading-relaxed">
              {activePreviewTab === 'markdown' && (
                <pre className="whitespace-pre-wrap select-text text-teal-300/90 font-mono text-[11px] leading-relaxed">
                  {liveMarkdownPreview}
                </pre>
              )}

              {activePreviewTab === 'json' && (
                <pre className="whitespace-pre-wrap select-text text-emerald-300/90 font-mono text-[11px] leading-relaxed">
                  {liveJsonPreview}
                </pre>
              )}

              {activePreviewTab === 'pdf' && (
                <div className="space-y-4 font-sans text-xs text-pulse-primary select-text">
                  {/* Branded Header Preview */}
                  <div className="p-3.5 rounded-xl bg-pulse-elevated border border-pulse-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          {templateConfig.organizationName || 'DEVPULSE'}
                        </span>
                        <span className="font-bold text-sm text-pulse-primary">{templateConfig.reportTitle}</span>
                      </div>
                      <p className="text-[11px] text-pulse-muted">
                        Target File: <code className="text-teal-400 font-mono">{fileName}</code> • Auditor: {templateConfig.authorName} • <span className="italic text-teal-300">[{templateConfig.confidentialityNote}]</span>
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-[10px] text-pulse-muted uppercase font-mono block">Health Score</span>
                        <span className="text-base font-bold text-teal-400">{analysis.metrics.healthScore}/100</span>
                      </div>
                      <div className="text-right border-l border-pulse-subtle pl-3">
                        <span className="text-[10px] text-pulse-muted uppercase font-mono block">Maintainability</span>
                        <span className="text-base font-bold text-pulse-primary">{analysis.metrics.maintainabilityScore}/100</span>
                      </div>
                    </div>
                  </div>

                  {/* Custom Notes Preview */}
                  {templateConfig.blocks.showCustomNotes && templateConfig.customSummaryNote && (
                    <div className="p-3 rounded-xl bg-pulse-bg border border-teal-500/30 text-[11px] text-teal-200">
                      <strong className="block text-teal-400 font-mono text-[10px] uppercase mb-1">Scope & Auditor Notes:</strong>
                      {templateConfig.customSummaryNote}
                    </div>
                  )}

                  {/* Section Toggles Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded-lg bg-pulse-elevated/60 border border-pulse-subtle">
                      <span className="text-pulse-muted block text-[10px]">Cyclomatic</span>
                      <span className="font-bold text-pulse-primary">{analysis.metrics.cyclomaticComplexity}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-pulse-elevated/60 border border-pulse-subtle">
                      <span className="text-pulse-muted block text-[10px]">Cognitive</span>
                      <span className="font-bold text-pulse-primary">{analysis.metrics.cognitiveComplexity}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-pulse-elevated/60 border border-pulse-subtle">
                      <span className="text-pulse-muted block text-[10px]">LOC / SLOC</span>
                      <span className="font-bold text-pulse-primary">{analysis.metrics.loc} / {analysis.metrics.sloc}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-pulse-elevated/60 border border-pulse-subtle">
                      <span className="text-pulse-muted block text-[10px]">Smells Count</span>
                      <span className="font-bold text-amber-400">{analysis.smells.length}</span>
                    </div>
                  </div>

                  {/* Active Layout Blocks */}
                  <div className="space-y-1.5 pt-1 text-[11px]">
                    <div className="font-bold text-pulse-secondary uppercase font-mono text-[10px]">
                      Active Layout Blocks:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(templateConfig.blocks).map(([key, val]) => (
                        <span
                          key={key}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
                            val
                              ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                              : 'bg-pulse-elevated text-pulse-muted border border-pulse-subtle line-through opacity-50'
                          }`}
                        >
                          {key.replace(/^show/, '')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-pulse-muted pt-1">
              <span>Previewing: {activePreviewTab.toUpperCase()} format</span>
              <button
                type="button"
                onClick={() => handleCopyClipboard(activePreviewTab)}
                className="flex items-center space-x-1 text-teal-400 hover:text-teal-300 transition font-mono cursor-pointer"
              >
                <Copy className="h-3 w-3" />
                <span>Copy Preview Content</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: DOWNLOAD & MULTI-FORMAT BATCH EXPORT */}
        {modalTab === 'export' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Format Selector with Multi-Selection Checkbox Cards */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-mono font-semibold text-pulse-primary uppercase tracking-wider">
                    Select Formats For Export
                  </label>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30">
                    {selectedFormats.length} of {formatList.length} selected
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  disabled={isExporting}
                  className="text-[11px] font-mono text-teal-400 hover:text-teal-300 transition cursor-pointer underline underline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {selectedFormats.length === formatList.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-2" role="group" aria-label="Output File Formats">
                {formatList.map((item) => {
                  const isSelected = selectedFormats.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      htmlFor={`format-${item.id}`}
                      className={`relative flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-teal-500/10 border-teal-500 text-pulse-primary shadow-sm ring-1 ring-teal-500/30'
                          : 'bg-pulse-elevated/70 border-pulse-subtle text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated hover:border-pulse-muted/40'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 pr-3">
                        {/* Checkbox Input */}
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            id={`format-${item.id}`}
                            name="exportFormat"
                            value={item.id}
                            checked={isSelected}
                            disabled={isExporting}
                            onChange={() => toggleFormat(item.id)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-teal-500 bg-teal-500 text-[#08110F]'
                                : 'border-pulse-muted bg-transparent text-transparent'
                            }`}
                          >
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        </div>

                        {/* Icon */}
                        <div
                          className={`p-1.5 rounded-xl transition ${
                            isSelected
                              ? 'bg-teal-500/20 text-teal-400'
                              : 'bg-pulse-surface text-pulse-muted'
                          }`}
                        >
                          {item.icon}
                        </div>

                        {/* Text Details */}
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-pulse-primary">
                              {item.name}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold ${
                                isSelected
                                  ? 'bg-teal-500/20 text-teal-300'
                                  : 'bg-pulse-surface text-pulse-muted'
                              }`}
                            >
                              {item.ext}
                            </span>
                          </div>
                          <p className="text-[11px] text-pulse-muted leading-tight mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Quick Template Badge */}
            <div className="p-3 rounded-2xl bg-pulse-bg border border-pulse-subtle flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <LayoutTemplate className="h-4 w-4 text-teal-400" />
                <span className="text-pulse-secondary">
                  Active Template: <strong className="text-pulse-primary font-mono">{templateConfig.reportTitle}</strong> ({templateConfig.templatePreset})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalTab('template')}
                className="text-xs text-teal-400 hover:text-teal-300 font-mono underline cursor-pointer"
              >
                Customize
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: BRANDING & TEMPLATING SYSTEM */}
        {modalTab === 'template' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar animate-fadeIn">
            {/* Presets Grid */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-semibold text-pulse-primary uppercase tracking-wider flex items-center justify-between">
                <span>Layout & Branding Presets</span>
                <span className="text-[10px] text-pulse-muted lowercase font-normal">Click to apply preset</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presetList.map((p) => {
                  const isCurrent = templateConfig.templatePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePresetSelect(p.id)}
                      className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex items-start space-x-2.5 ${
                        isCurrent
                          ? 'bg-teal-500/10 border-teal-500 shadow-sm ring-1 ring-teal-500/30'
                          : 'bg-pulse-elevated/70 border-pulse-subtle hover:border-pulse-muted hover:bg-pulse-elevated'
                      }`}
                    >
                      <span className="text-lg">{p.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-pulse-primary">{p.name}</span>
                          {isCurrent && <Check className="h-3.5 w-3.5 text-teal-400" />}
                        </div>
                        <p className="text-[10px] text-pulse-muted leading-tight mt-0.5">{p.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Branding Fields */}
            <div className="space-y-3 p-3.5 rounded-2xl bg-pulse-bg border border-pulse-subtle">
              <span className="text-[11px] font-mono font-semibold text-pulse-primary uppercase block">
                Custom Branding & Metadata
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="space-y-1">
                  <label className="text-[10px] text-pulse-muted uppercase">Organization / Company</label>
                  <input
                    type="text"
                    value={templateConfig.organizationName}
                    onChange={(e) =>
                      setTemplateConfig({ ...templateConfig, organizationName: e.target.value, templatePreset: 'custom' })
                    }
                    placeholder="e.g. Acme Corp Platform Team"
                    className="w-full px-3 py-1.5 rounded-xl bg-pulse-surface border border-pulse-subtle text-pulse-primary text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-pulse-muted uppercase">Report Title</label>
                  <input
                    type="text"
                    value={templateConfig.reportTitle}
                    onChange={(e) =>
                      setTemplateConfig({ ...templateConfig, reportTitle: e.target.value, templatePreset: 'custom' })
                    }
                    placeholder="e.g. Code Intelligence Audit"
                    className="w-full px-3 py-1.5 rounded-xl bg-pulse-surface border border-pulse-subtle text-pulse-primary text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-pulse-muted uppercase">Auditor / Author Name</label>
                  <input
                    type="text"
                    value={templateConfig.authorName}
                    onChange={(e) =>
                      setTemplateConfig({ ...templateConfig, authorName: e.target.value, templatePreset: 'custom' })
                    }
                    placeholder="e.g. DevPulse Auditor / Jane Doe"
                    className="w-full px-3 py-1.5 rounded-xl bg-pulse-surface border border-pulse-subtle text-pulse-primary text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-pulse-muted uppercase">Classification / Tag</label>
                  <input
                    type="text"
                    value={templateConfig.confidentialityNote}
                    onChange={(e) =>
                      setTemplateConfig({ ...templateConfig, confidentialityNote: e.target.value, templatePreset: 'custom' })
                    }
                    placeholder="e.g. Confidential / PR Review"
                    className="w-full px-3 py-1.5 rounded-xl bg-pulse-surface border border-pulse-subtle text-pulse-primary text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Accent Color Theme */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] text-pulse-muted uppercase font-mono flex items-center space-x-1.5">
                  <Palette className="h-3 w-3" />
                  <span>Report Accent Theme</span>
                </label>
                <div className="flex items-center space-x-2">
                  {accentColors.map((color) => {
                    const isSelected = templateConfig.accentColor === color.id;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() =>
                          setTemplateConfig({ ...templateConfig, accentColor: color.id, templatePreset: 'custom' })
                        }
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border text-xs font-mono transition cursor-pointer ${
                          isSelected
                            ? 'bg-pulse-surface border-teal-400 text-pulse-primary ring-1 ring-teal-400/40'
                            : 'bg-pulse-surface/50 border-pulse-subtle text-pulse-muted hover:text-pulse-primary'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${color.bgClass}`} />
                        <span>{color.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Scope / Summary Notes */}
              <div className="space-y-1 pt-2 font-mono">
                <label className="text-[10px] text-pulse-muted uppercase">Custom Auditor Scope / Summary Notes</label>
                <textarea
                  value={templateConfig.customSummaryNote}
                  onChange={(e) =>
                    setTemplateConfig({ ...templateConfig, customSummaryNote: e.target.value, templatePreset: 'custom' })
                  }
                  rows={2}
                  placeholder="Add custom notes, audit scope, or release instructions to be included in the report..."
                  className="w-full p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle text-pulse-primary text-xs focus:border-teal-500 focus:outline-none resize-none font-mono"
                />
              </div>
            </div>

            {/* Custom Layout Block Toggles */}
            <div className="p-3.5 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-2.5">
              <button
                type="button"
                onClick={() => setShowBlockToggles((prev) => !prev)}
                className="w-full flex items-center justify-between text-xs font-mono font-semibold text-pulse-primary uppercase cursor-pointer"
              >
                <span className="flex items-center space-x-2">
                  <Sliders className="h-3.5 w-3.5 text-teal-400" />
                  <span>Report Layout Blocks Visibility</span>
                </span>
                {showBlockToggles ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              {showBlockToggles && (
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs border-t border-pulse-subtle">
                  {Object.entries(templateConfig.blocks).map(([key, val]) => {
                    const blockKey = key as keyof typeof templateConfig.blocks;
                    const friendlyName = {
                      showHeader: 'Header & Brand Banner',
                      showExecutiveSummary: 'Executive Scorecard',
                      showMetrics: 'Code Metrics Breakdown',
                      showSmells: 'Code Smells & Fixes',
                      showFunctions: 'Function Complexity Map',
                      showDependencies: 'Dependencies & Imports',
                      showPulseMap: 'Pulse Map Topology',
                      showAiGuidance: 'AI Recommendations',
                      showCustomNotes: 'Auditor Scope Notes',
                      showFooter: 'Footer & Disclaimers',
                    }[blockKey] || blockKey;

                    return (
                      <label
                        key={blockKey}
                        className="flex items-center space-x-2 text-pulse-primary cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={val}
                          onChange={(e) =>
                            setTemplateConfig({
                              ...templateConfig,
                              templatePreset: 'custom',
                              blocks: {
                                ...templateConfig.blocks,
                                [blockKey]: e.target.checked,
                              },
                            })
                          }
                          className="rounded text-teal-500 focus:ring-teal-400 accent-teal-500"
                        />
                        <span className="text-[11px] truncate">{friendlyName}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CLOUD & REPOSITORY DIRECT SYNC */}
        {modalTab === 'sync' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar animate-fadeIn">
            {/* Sync Destination Selector */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-semibold text-pulse-primary uppercase tracking-wider">
                Select Cloud Sync Destination
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSyncProvider('drive')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer space-y-1 ${
                    syncProvider === 'drive'
                      ? 'bg-teal-500/10 border-teal-500 ring-1 ring-teal-500/30'
                      : 'bg-pulse-elevated/70 border-pulse-subtle hover:bg-pulse-elevated'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <HardDrive className="h-4 w-4 text-teal-400" />
                    {syncProvider === 'drive' && <Check className="h-3.5 w-3.5 text-teal-400" />}
                  </div>
                  <div className="text-xs font-bold text-pulse-primary">Google Drive</div>
                  <p className="text-[10px] text-pulse-muted leading-tight">Sync as PDF or Markdown to Drive</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSyncProvider('github_gist')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer space-y-1 ${
                    syncProvider === 'github_gist'
                      ? 'bg-teal-500/10 border-teal-500 ring-1 ring-teal-500/30'
                      : 'bg-pulse-elevated/70 border-pulse-subtle hover:bg-pulse-elevated'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Github className="h-4 w-4 text-teal-400" />
                    {syncProvider === 'github_gist' && <Check className="h-3.5 w-3.5 text-teal-400" />}
                  </div>
                  <div className="text-xs font-bold text-pulse-primary">GitHub Gist</div>
                  <p className="text-[10px] text-pulse-muted leading-tight">Instant shareable report link</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSyncProvider('github_repo')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer space-y-1 ${
                    syncProvider === 'github_repo'
                      ? 'bg-teal-500/10 border-teal-500 ring-1 ring-teal-500/30'
                      : 'bg-pulse-elevated/70 border-pulse-subtle hover:bg-pulse-elevated'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <FolderGit2 className="h-4 w-4 text-teal-400" />
                    {syncProvider === 'github_repo' && <Check className="h-3.5 w-3.5 text-teal-400" />}
                  </div>
                  <div className="text-xs font-bold text-pulse-primary">GitHub Repo</div>
                  <p className="text-[10px] text-pulse-muted leading-tight">Direct commit to repository</p>
                </button>
              </div>
            </div>

            {/* Sync Configuration Options according to Provider */}
            <div className="p-3.5 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-3 font-mono text-xs">
              {/* Format to Sync */}
              <div className="space-y-1">
                <label className="text-[10px] text-pulse-muted uppercase">Sync Format</label>
                <div className="flex items-center space-x-2">
                  {(['markdown', 'pdf', 'json'] as ExportFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setSyncFormat(fmt)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold transition cursor-pointer ${
                        syncFormat === fmt
                          ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                          : 'bg-pulse-surface border-pulse-subtle text-pulse-muted hover:text-pulse-primary'
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Google Drive specifics */}
              {syncProvider === 'drive' && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="h-4 w-4 text-teal-400" />
                      <div>
                        <span className="text-xs font-bold text-pulse-primary block">Google Workspace Drive</span>
                        <span className="text-[10px] text-pulse-muted">
                          {hasDriveToken ? 'Google Account Connected' : 'OAuth token requested upon sync'}
                        </span>
                      </div>
                    </div>
                    {hasDriveToken && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300">
                        Connected
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* GitHub Gist specifics */}
              {syncProvider === 'github_gist' && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] text-pulse-muted uppercase">GitHub Personal Access Token (Optional)</label>
                    <input
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="ghp_... (Leave blank for anonymous public gist)"
                      className="w-full px-3 py-1.5 rounded-xl bg-pulse-surface border border-pulse-subtle text-pulse-primary text-xs focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <label className="flex items-center space-x-2 cursor-pointer select-none text-pulse-secondary">
                    <input
                      type="checkbox"
                      checked={gistIsPublic}
                      onChange={(e) => setGistIsPublic(e.target.checked)}
                      className="rounded text-teal-500 focus:ring-teal-400 accent-teal-500"
                    />
                    <span className="text-[11px]">Make Gist Public (default is secret/unlisted)</span>
                  </label>
                </div>
              )}

              {/* GitHub Repo specifics */}
              {syncProvider === 'github_repo' && (
                <div className="space-y-2.5 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-pulse-muted uppercase">Owner / Org</label>
                      <input
                        type="text"
                        value={repoOwner}
                        onChange={(e) => setRepoOwner(e.target.value)}
                        placeholder="e.g. acme-corp"
                        className="w-full px-3 py-1.5 rounded-xl bg-pulse-surface border border-pulse-subtle text-pulse-primary text-xs focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-pulse-muted uppercase">Repository Name</label>
                      <input
                        type="text"
                        value={repoName}
                        onChange={(e) => setRepoName(e.target.value)}
                        placeholder="e.g. frontend-core"
                        className="w-full px-3 py-1.5 rounded-xl bg-pulse-surface border border-pulse-subtle text-pulse-primary text-xs focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-pulse-muted uppercase">Target Branch</label>
                      <input
                        type="text"
                        value={repoBranch}
                        onChange={(e) => setRepoBranch(e.target.value)}
                        placeholder="main"
                        className="w-full px-3 py-1.5 rounded-xl bg-pulse-surface border border-pulse-subtle text-pulse-primary text-xs focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-pulse-muted uppercase">Destination File Path</label>
                      <input
                        type="text"
                        value={repoFilePath}
                        onChange={(e) => setRepoFilePath(e.target.value)}
                        placeholder=".github/reports/devpulse-audit.md"
                        className="w-full px-3 py-1.5 rounded-xl bg-pulse-surface border border-pulse-subtle text-pulse-primary text-xs focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-pulse-muted uppercase">GitHub Access Token (Required with repo scope)</label>
                    <input
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="ghp_... (Requires repository push permissions)"
                      className="w-full px-3 py-1.5 rounded-xl bg-pulse-surface border border-pulse-subtle text-pulse-primary text-xs focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sync Result Link Box (if synced) */}
            {syncResult && (
              <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between animate-fadeIn">
                <div className="flex items-center space-x-2 min-w-0">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-pulse-primary block truncate">
                      Successfully Synced!
                    </span>
                    <span className="text-[11px] text-teal-300 truncate block font-mono">
                      {syncResult.label}
                    </span>
                  </div>
                </div>

                <a
                  href={syncResult.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shrink-0 ml-2"
                >
                  <span>Open</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Visual Progress Bar Feedback (when Exporting) */}
        {isExporting && (
          <div className="space-y-2.5 p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-teal-400 font-medium min-w-0">
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-teal-400" />
                <span className="truncate">{exportStage || `Generating batch reports...`}</span>
              </div>
              <span className="font-mono font-bold text-teal-300 text-xs ml-2 shrink-0">
                {exportProgress}%
              </span>
            </div>

            {/* Progress Track */}
            <div className="w-full h-2.5 rounded-full bg-pulse-bg border border-teal-500/20 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-200 ease-out relative shadow-[0_0_12px_rgba(20,184,166,0.5)]"
                style={{ width: `${exportProgress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-pulse-muted font-mono pt-0.5">
              <span>Target: {fileName}</span>
              <span>
                {selectedFormats.length > 1
                  ? `Batch: ${selectedFormats.map((f) => f.toUpperCase()).join(', ')}`
                  : `Format: ${selectedFormats[0]?.toUpperCase() ?? ''}`}
              </span>
            </div>
          </div>
        )}

        {/* Summary Info */}
        {!isExporting && !showPreview && modalTab === 'export' && (
          <div className="p-3 rounded-2xl bg-pulse-elevated border border-pulse-subtle flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2">
              <HeartPulse className="h-4 w-4 text-pulse-accent" />
              <span className="text-pulse-primary">{fileName}</span>
            </div>
            <span className="text-pulse-secondary">
              Score: <strong className="text-pulse-accent">{analysis?.metrics.healthScore ?? 100}/100</strong>
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          {modalTab === 'export' && (selectedFormats.includes('markdown') || selectedFormats.includes('json')) ? (
            <button
              onClick={() => handleCopyClipboard()}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-xs text-pulse-primary transition font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copiedType ? (
                <Check className="h-3.5 w-3.5 text-teal-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>
                {copiedType
                  ? 'Copied to Clipboard'
                  : selectedFormats.includes('markdown')
                  ? 'Copy Markdown'
                  : 'Copy JSON'}
              </span>
            </button>
          ) : modalTab === 'template' ? (
            <button
              type="button"
              onClick={() => {
                setTemplateConfig(DEFAULT_TEMPLATE_CONFIG);
                addToast({
                  type: 'info',
                  title: 'Template Reset',
                  description: 'Restored default template configuration.',
                });
              }}
              className="px-3 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs text-pulse-muted hover:text-pulse-primary transition font-mono cursor-pointer"
            >
              Reset Default
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              disabled={isExporting || isSyncing}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-pulse-muted hover:text-pulse-primary transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Close
            </button>

            {modalTab === 'sync' ? (
              <button
                type="button"
                onClick={handleCloudSync}
                disabled={isSyncing || !analysis}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-md shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="h-4 w-4" />
                )}
                <span>
                  {isSyncing
                    ? 'Syncing...'
                    : syncProvider === 'drive'
                    ? 'Sync to Google Drive'
                    : syncProvider === 'github_gist'
                    ? 'Create GitHub Gist'
                    : 'Commit to GitHub Repo'}
                </span>
              </button>
            ) : (
              <button
                onClick={handleExport}
                disabled={isExporting || !analysis || selectedFormats.length === 0}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-md shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>
                  {isExporting
                    ? `Exporting (${exportProgress}%)...`
                    : selectedFormats.length === 0
                    ? 'Select Format'
                    : selectedFormats.length === 1
                    ? `Export as ${selectedFormats[0].toUpperCase()}`
                    : `Batch Export (${selectedFormats.length} Formats)`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


