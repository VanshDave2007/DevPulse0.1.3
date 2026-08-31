import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Download,
  FileCode,
  FileSearch,
  FolderOpen,
  Info,
  Layers,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SupportedLanguage } from '../types';
import { SAMPLE_PROJECTS } from '../data/samples';
import { detectLanguage } from '../engine/detector';
import { formatPersonalizedSmellExplanation } from '../engine/personalization';
import { PulseMascot } from './PulseMascot';
import { useComponentPerformanceTracker } from '../hooks/usePerformanceTracker';

interface ContextMenuState {
  x: number;
  y: number;
  selectedText: string;
  symbol: string;
  lineStart: number;
  lineEnd: number;
}

interface UsagesState {
  symbol: string;
  occurrences: Array<{ line: number; text: string; isDeclaration: boolean }>;
}

export const AnalyzerView: React.FC = () => {
  useComponentPerformanceTracker('Analyzer Studio');
  const {
    code,
    setCode,
    language,
    setLanguage,
    isAutoDetect,
    setIsAutoDetect,
    fileName,
    setFileName,
    analysis,
    isAnalyzing,
    runAnalysis,
    selectedSmell,
    setSelectedSmell,
    accessibility,
    loadPreset,
    setActiveTab,
    sendAiRequest,
    isDirty,
    setPendingAction,
    setIsExportModalOpen,
    isAiLoading,
    cancelAiRequest,
    openFixModalForSmell,
    personalizationProfile,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [activeTabSub, setActiveTabSub] = useState<'smells' | 'functions' | 'imports'>('smells');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [activeAiLines, setActiveAiLines] = useState<{ start: number; end: number } | null>(null);
  const [usagesData, setUsagesData] = useState<UsagesState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-clear active AI lines when AI is no longer loading
  useEffect(() => {
    if (!isAiLoading) {
      const timer = setTimeout(() => {
        setActiveAiLines(null);
        setLoadingAction(null);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isAiLoading]);

  // Close context menu on global clicks or escape
  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setUsagesData(null);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleEditorContextMenu = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let selected = textarea.value.substring(start, end).trim();
    let symbol = selected;

    // If no text is selected, grab the identifier under the cursor
    if (!selected) {
      const text = textarea.value;
      let wordStart = start;
      let wordEnd = start;
      while (wordStart > 0 && /[\w$]/.test(text[wordStart - 1])) {
        wordStart--;
      }
      while (wordEnd < text.length && /[\w$]/.test(text[wordEnd])) {
        wordEnd++;
      }
      if (wordStart < wordEnd) {
        selected = text.substring(wordStart, wordEnd);
        symbol = selected;
      } else {
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        let lineEnd = text.indexOf('\n', start);
        if (lineEnd === -1) lineEnd = text.length;
        selected = text.substring(lineStart, lineEnd).trim();
        symbol = selected.split(/[\s(=]+/)[0] || '';
      }
    }

    const beforeStart = textarea.value.substring(0, start);
    const lineStartNum = (beforeStart.match(/\n/g) || []).length + 1;
    const selectedLineCount = (selected.match(/\n/g) || []).length;
    const lineEndNum = lineStartNum + selectedLineCount;

    const menuWidth = 240;
    const menuHeight = 260;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 16);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 16);

    setContextMenu({
      x,
      y,
      selectedText: selected,
      symbol: symbol.replace(/[^\w$]/g, ''),
      lineStart: lineStartNum,
      lineEnd: lineEndNum,
    });
  };

  const handleExplainSelected = () => {
    if (!contextMenu?.selectedText) return;
    const { lineStart, lineEnd, selectedText } = contextMenu;
    setLoadingAction('explain');
    setActiveAiLines({ start: lineStart, end: lineEnd });
    sendAiRequest('explain', `Please explain this selected code snippet in detail:\n\`\`\`${language}\n${selectedText}\n\`\`\``);
    setTimeout(() => {
      setActiveTab('pulse-ai');
      setContextMenu(null);
    }, 450);
  };

  const handleRefactorSelected = () => {
    if (!contextMenu?.selectedText) return;
    const { lineStart, lineEnd, selectedText } = contextMenu;
    setLoadingAction('refactor');
    setActiveAiLines({ start: lineStart, end: lineEnd });
    sendAiRequest('improve', `Refactor and optimize this code snippet for clean architecture, idiomatic patterns, and performance:\n\`\`\`${language}\n${selectedText}\n\`\`\``);
    setTimeout(() => {
      setActiveTab('pulse-ai');
      setContextMenu(null);
    }, 450);
  };

  const handleFindUsages = () => {
    if (!contextMenu?.symbol) return;
    const sym = contextMenu.symbol;
    const occurrences: Array<{ line: number; text: string; isDeclaration: boolean }> = [];
    const codeLines = code.split('\n');
    const regex = new RegExp(`\\b${sym}\\b`);
    codeLines.forEach((l, idx) => {
      if (regex.test(l)) {
        const isDecl = /(?:def|class|function|const|let|var|import|interface|struct|fn|func)\s+/.test(l);
        occurrences.push({ line: idx + 1, text: l.trim(), isDeclaration: isDecl });
      }
    });
    setUsagesData({ symbol: sym, occurrences });
    setContextMenu(null);
  };

  const handleGenerateTestsForSelection = () => {
    if (!contextMenu?.selectedText) return;
    const { lineStart, lineEnd, selectedText } = contextMenu;
    setLoadingAction('tests');
    setActiveAiLines({ start: lineStart, end: lineEnd });
    sendAiRequest('tests', `Generate comprehensive unit tests for this selected code snippet:\n\`\`\`${language}\n${selectedText}\n\`\`\``);
    setTimeout(() => {
      setActiveTab('pulse-ai');
      setContextMenu(null);
    }, 450);
  };

  const handleCopySelection = () => {
    if (contextMenu?.selectedText) {
      navigator.clipboard.writeText(contextMenu.selectedText);
    }
    setContextMenu(null);
  };

  // Determine Mascot Mood based on analyzer state
  const mascotMood: 'neutral' | 'thinking' | 'celebrating' | 'concerned' | 'helping' = isAnalyzing
    ? 'thinking'
    : analysis
    ? (analysis.smells.filter((s) => s.severity === 'critical').length > 0
        ? 'concerned'
        : analysis.metrics.healthScore >= 80
        ? 'celebrating'
        : 'helping')
    : 'neutral';

  const supportedLanguagesList: Array<{ id: SupportedLanguage; label: string }> = [
    { id: 'python', label: 'Python' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'java', label: 'Java' },
    { id: 'cpp', label: 'C / C++' },
    { id: 'csharp', label: 'C#' },
    { id: 'go', label: 'Go' },
    { id: 'rust', label: 'Rust' },
    { id: 'ruby', label: 'Ruby' },
    { id: 'php', label: 'PHP' },
    { id: 'kotlin', label: 'Kotlin' },
    { id: 'swift', label: 'Swift' },
    { id: 'sql', label: 'SQL' },
    { id: 'html', label: 'HTML' },
    { id: 'css', label: 'CSS' },
    { id: 'generic', label: 'Generic / Other' },
  ];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setCode(text);
          if (isAutoDetect) {
            const det = detectLanguage(text, file.name);
            setLanguage(det.language);
            runAnalysis(text, det.language);
          } else {
            runAnalysis(text, language);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    if (isAutoDetect) {
      const det = detectLanguage(newCode, fileName);
      if (det.confidence === 'high' && det.language !== language) {
        setLanguage(det.language);
      }
    }
  };

  const lines = code.split('\n');
  const smells = analysis?.smells || [];
  const filteredSmells = smells.filter((s) => {
    if (selectedFilter === 'all') return true;
    return s.severity === selectedFilter;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Studio Header Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <Code2 className="h-5 w-5 text-pulse-accent shrink-0" />
            <h1 className="text-base sm:text-lg font-bold text-pulse-primary">Analyzer Studio</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-pulse-elevated border border-pulse-subtle text-pulse-accent font-mono">
              {analysis?.languageName || language.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-pulse-secondary">
            Analyze source code structure, calculate cyclomatic complexity, and detect architectural anti-patterns.
          </p>
        </div>

        {/* Action Controls & Presets */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap items-stretch sm:items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
          {/* Dropdown controls group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Language Selector */}
            <div className="flex items-center space-x-1.5 bg-pulse-elevated border border-pulse-subtle rounded-xl px-2.5 py-1.5 min-h-[40px] sm:min-h-[38px]">
              <button
                type="button"
                onClick={() => {
                  const nextAuto = !isAutoDetect;
                  setIsAutoDetect(nextAuto);
                  if (nextAuto) {
                    const det = detectLanguage(code, fileName);
                    setLanguage(det.language);
                    runAnalysis(code, det.language);
                  }
                }}
                className={`px-2.5 py-1 text-xs font-mono rounded-lg transition shrink-0 cursor-pointer ${
                  isAutoDetect
                    ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/40 font-semibold'
                    : 'text-pulse-muted hover:text-pulse-primary'
                }`}
                title="Toggle automatic language detection"
              >
                Auto
              </button>
              <select
                value={language}
                onChange={(e) => {
                  setIsAutoDetect(false);
                  const nextLang = e.target.value as SupportedLanguage;
                  setLanguage(nextLang);
                  runAnalysis(code, nextLang);
                }}
                className="bg-transparent text-xs text-pulse-primary font-mono focus:outline-none cursor-pointer py-1 pr-2 w-full min-w-0"
                aria-label="Target Programming Language"
              >
                {supportedLanguagesList.map((l) => (
                  <option key={l.id} value={l.id} className="bg-pulse-surface text-pulse-primary">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sample Preset Dropdown */}
            <div className="relative w-full sm:w-auto sm:min-w-[150px]">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    loadPreset(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="w-full bg-pulse-elevated border border-pulse-subtle rounded-xl px-3 py-2 sm:py-1.5 text-xs text-pulse-secondary hover:text-pulse-primary focus:outline-none cursor-pointer min-h-[40px] sm:min-h-[38px]"
                aria-label="Load Sample Preset"
              >
                <option value="" disabled>
                  Load Sample...
                </option>
                {SAMPLE_PROJECTS.map((s) => (
                  <option key={s.id} value={s.id} className="bg-pulse-surface text-pulse-primary">
                    {s.title} ({s.language})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toolbar Buttons Group */}
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            {/* Upload File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-xs text-pulse-primary transition cursor-pointer min-h-[40px] sm:min-h-[38px]"
              title="Upload source file"
            >
              <Upload className="h-3.5 w-3.5 text-pulse-accent shrink-0" />
              <span>Upload</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".py,.js,.ts,.tsx,.jsx,.java,.cpp,.c,.h,.cs,.go,.rs,.rb,.php,.sql,.html,.css,.txt"
            />

            {/* Export Report */}
            {analysis && (
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-xs text-pulse-primary transition cursor-pointer min-h-[40px] sm:min-h-[38px]"
                title="Export analysis and findings as PDF or JSON"
              >
                <Download className="h-3.5 w-3.5 text-pulse-accent shrink-0" />
                <span>Export</span>
              </button>
            )}

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-xs text-pulse-primary transition cursor-pointer min-h-[40px] sm:min-h-[38px]"
              title="Copy code to clipboard"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-pulse-accent shrink-0" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-pulse-muted shrink-0" />
              )}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Clear Code */}
            <button
              type="button"
              onClick={() => {
                if (isDirty && code.trim().length > 0) {
                  setPendingAction({
                    type: 'clear_editor',
                    title: 'Clear Editor Code',
                    description:
                      'Are you sure you want to clear all code in the editor? Unsaved edits will be permanently lost.',
                  });
                } else {
                  setCode('');
                  runAnalysis('', language);
                }
              }}
              className="flex items-center justify-center px-3 py-2 sm:py-1.5 rounded-xl bg-pulse-elevated hover:bg-rose-500/20 border border-pulse-subtle text-xs text-pulse-muted hover:text-rose-500 transition cursor-pointer min-h-[40px] sm:min-h-[38px] min-w-[40px]"
              title="Clear editor"
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
            </button>
          </div>

          {/* Primary Analyze CTA Button */}
          <button
            id="run-analysis-button"
            type="button"
            onClick={() => runAnalysis(code, language)}
            disabled={isAnalyzing}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 sm:py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-md shadow-teal-500/20 disabled:opacity-50 cursor-pointer min-h-[44px] sm:min-h-[38px]"
          >
            <Play className={`h-3.5 w-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Code'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Editor (Left) & Live Insights (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Code Editor Pane */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl sm:rounded-3xl bg-pulse-surface border border-pulse-subtle overflow-hidden shadow-xl min-w-0">
          {/* Editor Header Status Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-pulse-bg border-b border-pulse-subtle text-xs font-mono text-pulse-secondary">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
              <div className="flex items-center space-x-1.5 min-w-0">
                <FileCode className="h-4 w-4 text-pulse-accent shrink-0" />
                <span className="text-pulse-primary font-semibold truncate max-w-[120px] sm:max-w-[200px]">{fileName}</span>
              </div>
              <span className="text-pulse-muted">·</span>
              <span className="shrink-0">{lines.length} lines</span>
              <span className="text-pulse-muted">·</span>
              <span className="shrink-0">{code.length} chars</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 text-[10px] sm:text-[11px] text-pulse-muted shrink-0">
              {isAiLoading && (
                <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 animate-pulse">
                  <Sparkles className="h-3 w-3 animate-spin text-teal-400" />
                  <span className="truncate max-w-[100px] sm:max-w-none">AI Analyzing {activeAiLines ? `L${activeAiLines.start}–${activeAiLines.end}` : 'Code'}...</span>
                  <button
                    onClick={cancelAiRequest}
                    className="hover:text-rose-400 ml-1 p-0.5 rounded transition cursor-pointer"
                    title="Cancel AI request"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              )}
              <span className="hidden xs:inline">{accessibility.editorWordWrap ? 'Wrap: On' : 'Wrap: Off'} · Tab: {accessibility.editorTabSize}</span>
            </div>
          </div>

          {/* Editor Workspace with Line Numbers */}
          <div className="relative flex min-h-[480px] max-h-[640px] overflow-auto bg-pulse-bg">
            {/* Gutter Line Numbers with Subtle Loading & Diagnostic Animations */}
            <div className="select-none py-3 px-3 text-right font-mono text-xs text-pulse-muted bg-pulse-bg border-r border-pulse-subtle min-w-[48px] relative">
              {/* Subtle Gutter Scanning Beam for Active AI Analysis */}
              {isAiLoading && activeAiLines && (
                <div
                  className="absolute left-0 right-0 pointer-events-none border-l-2 border-teal-400 rounded-r-md animate-gutter-scan overflow-hidden transition-all duration-300"
                  style={{
                    top: `${Math.max(0, (activeAiLines.start - 1) * 20 + 12)}px`,
                    height: `${Math.max(20, (activeAiLines.end - activeAiLines.start + 1) * 20)}px`,
                  }}
                >
                  <div className="w-full h-1 bg-gradient-to-r from-teal-400 to-transparent animate-gutter-beam" />
                </div>
              )}

              {lines.map((_, idx) => {
                const lineNum = idx + 1;
                const hasSmell = smells.find((s) => s.line === lineNum);
                const isAiTarget = isAiLoading && activeAiLines && lineNum >= activeAiLines.start && lineNum <= activeAiLines.end;

                return (
                  <div
                    key={idx}
                    className={`relative flex items-center justify-end h-5 transition-colors duration-200 ${
                      isAiTarget ? 'bg-teal-500/20 text-teal-300 font-bold' : ''
                    }`}
                  >
                    {/* Active AI line indicator pulse */}
                    {isAiTarget && (
                      <span className="absolute -left-1.5 w-1.5 h-3.5 rounded-full bg-teal-400 shadow-sm shadow-teal-400/80 animate-pulse" />
                    )}

                    {hasSmell && !isAiTarget && (
                      <span
                        className={`absolute -left-1.5 w-1.5 h-1.5 rounded-full ${
                          hasSmell.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        title={`${hasSmell.title} on line ${lineNum}`}
                      />
                    )}
                    <span
                      className={`${
                        isAiTarget
                          ? 'text-teal-300 font-bold drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]'
                          : hasSmell
                          ? 'text-amber-500 font-bold'
                          : ''
                      }`}
                    >
                      {lineNum}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Editable Text Area */}
            <textarea
              ref={textareaRef}
              id="code-editor-textarea"
              value={code}
              onChange={handleCodeChange}
              onContextMenu={handleEditorContextMenu}
              placeholder="Paste or write your source code here to analyze... (Right-click for AI Assist, Refactor, or Find Usages)"
              style={{
                fontSize: `${accessibility.editorFontSize}px`,
                tabSize: accessibility.editorTabSize,
              }}
              wrap={accessibility.editorWordWrap ? 'soft' : 'off'}
              className="flex-1 w-full bg-transparent text-pulse-primary font-mono py-3 px-4 resize-none focus:outline-none leading-5 selection:bg-teal-500/20 selection:text-teal-300"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
            />
          </div>

          {/* Quick Context Menu Hint */}
          <div className="px-4 py-2 bg-pulse-bg border-t border-pulse-subtle flex items-center justify-between text-[11px] text-pulse-muted font-mono">
            <span>Tip: Right-click code to Explain, Refactor, or Find Usages</span>
            <div className="flex items-center space-x-2">
              <span className={`inline-block w-2 h-2 rounded-full ${isAiLoading ? 'bg-teal-400 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
              <span>{isAiLoading ? 'AI Processing Selection...' : 'Context Engine Active'}</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Live Analysis Overview Pane */}
        <div className="lg:col-span-5 space-y-4 min-w-0">
          {/* Mascot Companion Pill in Studio */}
          <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              <PulseMascot mood={mascotMood} size="sm" />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-pulse-primary">Pulse Assistant</h4>
                <p className="text-[11px] text-pulse-muted leading-relaxed">
                  {isAnalyzing
                    ? 'Running deep semantic validation...'
                    : analysis?.smells.some((s) => s.severity === 'critical')
                    ? 'Identified critical syntax or execution issues.'
                    : analysis
                    ? 'Static analysis passed. Ready for AI inspection.'
                    : 'Awaiting your code input or file upload.'}
                </p>
              </div>
            </div>
            {analysis && (
              <button
                id="mascot-ask-ai-btn"
                type="button"
                onClick={() => {
                  sendAiRequest('explain', `Provide an end-to-end beginner-friendly code review and architectural breakdown.`);
                  setActiveTab('pulse-ai');
                }}
                className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-xl bg-pulse-elevated hover:bg-teal-500/15 text-pulse-accent border border-pulse-subtle text-xs font-mono flex items-center justify-center space-x-1.5 transition-all shadow-xs shrink-0 cursor-pointer min-h-[40px] sm:min-h-[36px]"
              >
                <Sparkles className="h-3.5 w-3.5 text-pulse-accent" />
                <span>Ask AI</span>
              </button>
            )}
          </div>
          {analysis ? (
            <>
              {/* Quick Health Summary Card */}
              <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-pulse-surface border border-pulse-subtle space-y-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono uppercase text-pulse-muted">Code Health Assessment</span>
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      analysis.metrics.healthScore >= 85
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : analysis.metrics.healthScore >= 70
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {analysis.summary.healthLevel}
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline gap-2">
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-3xl font-extrabold font-mono text-pulse-primary">
                      {analysis.metrics.healthScore}
                    </span>
                    <span className="text-sm font-mono text-pulse-muted">/ 100</span>
                  </div>
                  <span className="text-xs text-pulse-secondary sm:ml-auto font-mono">
                    Maintainability: {analysis.metrics.maintainabilityScore}
                  </span>
                </div>

                {/* Score progress bar */}
                <div className="w-full h-2 rounded-full bg-pulse-elevated overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      analysis.metrics.healthScore >= 85
                        ? 'bg-teal-500'
                        : analysis.metrics.healthScore >= 70
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${analysis.metrics.healthScore}%` }}
                  />
                </div>

                {/* Quick actions for AI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      sendAiRequest('explain');
                      setActiveTab('pulse-ai');
                    }}
                    className="flex items-center justify-center space-x-1.5 py-2.5 sm:py-2 px-3 rounded-xl bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-xs text-pulse-primary font-medium transition cursor-pointer min-h-[40px]"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-pulse-accent shrink-0" />
                    <span>Explain Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sendAiRequest('improve');
                      setActiveTab('pulse-ai');
                    }}
                    className="flex items-center justify-center space-x-1.5 py-2.5 sm:py-2 px-3 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-xs text-teal-600 dark:text-teal-300 font-semibold transition cursor-pointer min-h-[40px]"
                  >
                    <Zap className="h-3.5 w-3.5 text-pulse-accent shrink-0" />
                    <span>Improve with AI</span>
                  </button>
                </div>
              </div>

              {/* Subtabs: Code Smells | Functions | Imports */}
              <div className="rounded-2xl sm:rounded-3xl bg-pulse-surface border border-pulse-subtle overflow-hidden shadow-sm">
                <div className="grid grid-cols-3 border-b border-pulse-subtle bg-pulse-bg">
                  <button
                    type="button"
                    onClick={() => setActiveTabSub('smells')}
                    className={`py-2.5 px-1.5 sm:px-3 text-[11px] sm:text-xs font-semibold text-center transition truncate cursor-pointer ${
                      activeTabSub === 'smells'
                        ? 'text-pulse-accent border-b-2 border-pulse-accent bg-pulse-surface'
                        : 'text-pulse-muted hover:text-pulse-primary'
                    }`}
                  >
                    Smells ({smells.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabSub('functions')}
                    className={`py-2.5 px-1.5 sm:px-3 text-[11px] sm:text-xs font-semibold text-center transition truncate cursor-pointer ${
                      activeTabSub === 'functions'
                        ? 'text-pulse-accent border-b-2 border-pulse-accent bg-pulse-surface'
                        : 'text-pulse-muted hover:text-pulse-primary'
                    }`}
                  >
                    Functions ({analysis.metrics.functions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabSub('imports')}
                    className={`py-2.5 px-1.5 sm:px-3 text-[11px] sm:text-xs font-semibold text-center transition truncate cursor-pointer ${
                      activeTabSub === 'imports'
                        ? 'text-pulse-accent border-b-2 border-pulse-accent bg-pulse-surface'
                        : 'text-pulse-muted hover:text-pulse-primary'
                    }`}
                  >
                    Imports ({analysis.metrics.imports.length})
                  </button>
                </div>

                {/* Subtab Content */}
                <div className="p-3.5 sm:p-4 max-h-[380px] overflow-y-auto space-y-3">
                  {/* SMELLS TAB */}
                  {activeTabSub === 'smells' && (
                    <>
                      {/* Filter pills */}
                      <div className="flex flex-wrap items-center gap-1.5 pb-1">
                        {(['all', 'critical', 'warning', 'info'] as const).map((filter) => (
                          <button
                            key={filter}
                            type="button"
                            onClick={() => setSelectedFilter(filter)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono capitalize transition cursor-pointer ${
                              selectedFilter === filter
                                ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/40 font-semibold'
                                : 'bg-pulse-elevated text-pulse-muted hover:text-pulse-primary'
                            }`}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>

                      {filteredSmells.length === 0 ? (
                        <div className="text-center py-8">
                          <CheckCircle2 className="h-8 w-8 text-pulse-accent mx-auto mb-2 opacity-80" />
                          <p className="text-xs font-semibold text-pulse-primary">No Smells Found in Filter</p>
                          <p className="text-[11px] text-pulse-muted mt-0.5">Code matches clean architecture patterns.</p>
                        </div>
                      ) : (
                        filteredSmells.map((smell) => {
                          const isSelected = selectedSmell?.id === smell.id;
                          return (
                            <div
                              key={smell.id}
                              onClick={() => setSelectedSmell(isSelected ? null : smell)}
                              className={`p-3 rounded-2xl border transition cursor-pointer ${
                                isSelected
                                  ? 'bg-pulse-elevated border-pulse-accent shadow-sm'
                                  : 'bg-pulse-elevated/70 border-pulse-subtle hover:border-pulse-strong'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                                        smell.severity === 'critical'
                                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                          : smell.severity === 'warning'
                                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                          : 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30'
                                      }`}
                                    >
                                      {smell.severity}
                                    </span>
                                    <span className="text-xs font-mono text-pulse-muted">Line {smell.line}</span>
                                  </div>
                                  <h4 className="text-xs font-semibold text-pulse-primary break-words">{smell.title}</h4>
                                  <p className="text-[11px] text-pulse-secondary leading-relaxed break-words">{smell.problem}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openFixModalForSmell(smell);
                                  }}
                                  className="self-start sm:self-auto shrink-0 flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-600 dark:text-teal-300 text-[11px] font-medium transition shadow-xs cursor-pointer min-h-[34px]"
                                  title="Open AI Fix Remediator"
                                >
                                  <Wand2 className="h-3 w-3 text-pulse-accent" />
                                  <span>Fix with AI</span>
                                </button>
                              </div>

                              {isSelected && (() => {
                                const formatted = formatPersonalizedSmellExplanation(
                                  smell,
                                  personalizationProfile,
                                  language
                                );
                                return (
                                  <div className="mt-3 pt-3 border-t border-pulse-subtle space-y-2.5 text-[11px]">
                                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        {formatted.badges.map((b, i) => (
                                          <span
                                            key={i}
                                            className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-pulse-bg border border-pulse-subtle text-pulse-muted"
                                          >
                                            {b}
                                          </span>
                                        ))}
                                      </div>
                                      <span className="text-[10px] font-mono text-pulse-accent capitalize font-semibold">
                                        {personalizationProfile.knowledge_level} Mode
                                      </span>
                                    </div>

                                    {formatted.sections.map((sec, idx) => (
                                      <div key={idx} className="space-y-0.5">
                                        <span className="text-pulse-muted font-mono font-semibold block text-[10px]">
                                          {sec.heading}
                                        </span>
                                        <p className="text-pulse-primary leading-relaxed break-words">{sec.content}</p>
                                      </div>
                                    ))}

                                    <div className="p-2.5 rounded-xl bg-pulse-bg border border-teal-500/30 flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-2.5 mt-2">
                                      <div className="min-w-0 flex-1">
                                        <span className="text-pulse-accent font-mono font-semibold block text-[10px]">
                                          Remediation Action:
                                        </span>
                                        <p className="text-pulse-secondary mt-0.5 break-words">{smell.recommendation}</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openFixModalForSmell(smell);
                                        }}
                                        className="shrink-0 px-3 py-1.5 rounded-lg bg-teal-500 text-[#08110F] text-[10px] font-bold hover:bg-teal-400 transition cursor-pointer text-center"
                                      >
                                        AI Fix
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })
                      )}
                    </>
                  )}

                  {/* FUNCTIONS TAB */}
                  {activeTabSub === 'functions' && (
                    <div className="space-y-2">
                      {analysis.metrics.functions.length === 0 ? (
                        <p className="text-xs text-pulse-muted text-center py-6">No top-level functions declared.</p>
                      ) : (
                        analysis.metrics.functions.map((fn, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-pulse-elevated border border-pulse-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs font-mono"
                          >
                            <div className="min-w-0 break-all">
                              <span className="text-pulse-primary font-semibold">{fn.name}()</span>
                              <span className="text-pulse-muted text-[10px] block font-sans">
                                Line {fn.line} · {fn.loc} lines · {fn.params} params
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  fn.complexity > 10
                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                    : 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                                }`}
                              >
                                CC: {fn.complexity}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* IMPORTS TAB */}
                  {activeTabSub === 'imports' && (
                    <div className="space-y-2">
                      {analysis.metrics.imports.length === 0 ? (
                        <p className="text-xs text-pulse-muted text-center py-6">No dependencies or imports detected.</p>
                      ) : (
                        analysis.metrics.imports.map((imp, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-pulse-elevated border border-pulse-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs font-mono"
                          >
                            <span className="text-pulse-primary break-all min-w-0">{imp.module}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded shrink-0 self-start sm:self-auto ${
                                imp.isExternal
                                  ? 'bg-teal-500/15 text-teal-600 dark:text-teal-300 font-semibold'
                                  : 'bg-pulse-bg text-pulse-muted'
                              }`}
                            >
                              {imp.isExternal ? 'External' : 'Internal / StdLib'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 rounded-3xl bg-pulse-surface border border-pulse-subtle text-center shadow-sm">
              <Info className="h-8 w-8 text-pulse-accent mx-auto mb-2 opacity-80" />
              <p className="text-xs text-pulse-primary">Click &quot;Analyze Code&quot; to calculate metrics.</p>
            </div>
          )}
        </div>
      </div>

      {/* FLOATING RIGHT-CLICK CONTEXT MENU */}
      {contextMenu && (
        <div
          id="editor-context-menu"
          style={{
            top: `${Math.min(contextMenu.y, window.innerHeight - 280)}px`,
            left: `${Math.min(contextMenu.x, window.innerWidth - 270)}px`,
          }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-[calc(100vw-32px)] max-w-[260px] rounded-2xl bg-pulse-surface/95 backdrop-blur-md border border-pulse-subtle shadow-2xl p-1.5 space-y-1 text-xs font-mono animate-fadeIn"
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-pulse-muted border-b border-pulse-subtle flex items-center justify-between">
            <span>Editor Quick Actions</span>
            {contextMenu.symbol && <span className="text-pulse-accent lowercase truncate max-w-[100px]">{contextMenu.symbol}</span>}
          </div>

          <button
            id="ctx-explain-selected"
            onClick={handleExplainSelected}
            disabled={Boolean(loadingAction)}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left text-pulse-primary hover:bg-pulse-elevated hover:text-pulse-accent transition-colors disabled:opacity-70"
          >
            {loadingAction === 'explain' ? (
              <Sparkles className="h-4 w-4 text-teal-400 shrink-0 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-pulse-accent shrink-0" />
            )}
            <div className="flex-1">
              <div className="font-semibold flex items-center justify-between">
                <span>Explain Selected</span>
                {loadingAction === 'explain' && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 animate-pulse">
                    Dispatching...
                  </span>
                )}
              </div>
              <div className="text-[10px] text-pulse-muted font-sans">
                {loadingAction === 'explain' ? 'Preparing educational mentor breakdown' : 'Get beginner-friendly deep explanation'}
              </div>
            </div>
          </button>

          <button
            id="ctx-refactor-selected"
            onClick={handleRefactorSelected}
            disabled={Boolean(loadingAction)}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left text-pulse-primary hover:bg-pulse-elevated hover:text-pulse-accent transition-colors disabled:opacity-70"
          >
            {loadingAction === 'refactor' ? (
              <Wand2 className="h-4 w-4 text-teal-400 shrink-0 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
            <div className="flex-1">
              <div className="font-semibold flex items-center justify-between">
                <span>Refactor Selection</span>
                {loadingAction === 'refactor' && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 animate-pulse">
                    Analyzing...
                  </span>
                )}
              </div>
              <div className="text-[10px] text-pulse-muted font-sans">
                {loadingAction === 'refactor' ? 'Structuring clean idiomatic patterns' : 'Clean, idiomatic optimization'}
              </div>
            </div>
          </button>

          <button
            id="ctx-find-usages"
            onClick={handleFindUsages}
            disabled={Boolean(loadingAction)}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left text-pulse-primary hover:bg-pulse-elevated hover:text-pulse-accent transition-colors disabled:opacity-70"
          >
            <FileSearch className="h-4 w-4 text-sky-400 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">Find Usages & References</div>
              <div className="text-[10px] text-pulse-muted font-sans">Locate all occurrences in file</div>
            </div>
          </button>

          <button
            id="ctx-generate-tests"
            onClick={handleGenerateTestsForSelection}
            disabled={Boolean(loadingAction)}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left text-pulse-primary hover:bg-pulse-elevated hover:text-pulse-accent transition-colors disabled:opacity-70"
          >
            {loadingAction === 'tests' ? (
              <Zap className="h-4 w-4 text-teal-400 shrink-0 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 text-amber-400 shrink-0" />
            )}
            <div className="flex-1">
              <div className="font-semibold flex items-center justify-between">
                <span>Generate Unit Tests</span>
                {loadingAction === 'tests' && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 animate-pulse">
                    Generating...
                  </span>
                )}
              </div>
              <div className="text-[10px] text-pulse-muted font-sans">
                {loadingAction === 'tests' ? 'Building test boundary matrix' : 'Create test cases for block'}
              </div>
            </div>
          </button>

          <div className="border-t border-pulse-subtle pt-1 mt-1">
            <button
              id="ctx-copy-selection"
              onClick={handleCopySelection}
              className="w-full flex items-center space-x-2 px-3 py-1.5 rounded-xl text-left text-pulse-secondary hover:bg-pulse-elevated hover:text-pulse-primary transition-colors text-[11px]"
            >
              <Copy className="h-3.5 w-3.5 shrink-0" />
              <span>Copy Selection</span>
            </button>
          </div>
        </div>
      )}

      {/* FIND USAGES MODAL DRAWER */}
      {usagesData && (
        <div
          id="usages-modal-backdrop"
          onClick={() => setUsagesData(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            id="usages-modal-content"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-pulse-bg border-b border-pulse-subtle">
              <div className="flex items-center space-x-2.5">
                <Search className="h-5 w-5 text-pulse-accent" />
                <div>
                  <h3 className="text-sm font-bold text-pulse-primary font-mono">
                    Usages of &apos;{usagesData.symbol}&apos;
                  </h3>
                  <p className="text-[11px] text-pulse-muted">
                    Found {usagesData.occurrences.length} occurrence{usagesData.occurrences.length === 1 ? '' : 's'} in {fileName}
                  </p>
                </div>
              </div>
              <button
                id="close-usages-btn"
                onClick={() => setUsagesData(null)}
                className="p-1.5 rounded-full text-pulse-muted hover:text-pulse-primary hover:bg-pulse-elevated transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body: Occurrences List */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              {usagesData.occurrences.length === 0 ? (
                <div className="text-center py-8 text-xs text-pulse-muted font-mono">
                  No exact word matches found for &apos;{usagesData.symbol}&apos;.
                </div>
              ) : (
                usagesData.occurrences.map((occ, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setUsagesData(null);
                      const el = textareaRef.current;
                      if (el) {
                        const targetLineIndex = occ.line - 1;
                        const lineArray = el.value.split('\n');
                        let charPos = 0;
                        for (let i = 0; i < targetLineIndex; i++) {
                          charPos += lineArray[i].length + 1;
                        }
                        el.focus();
                        el.setSelectionRange(charPos, charPos + lineArray[targetLineIndex].length);
                      }
                    }}
                    className="p-3 rounded-2xl bg-pulse-bg border border-pulse-subtle hover:border-pulse-accent hover:bg-pulse-elevated cursor-pointer transition-all space-y-1 text-xs font-mono group"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-pulse-accent font-bold">Line {occ.line}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] ${
                          occ.isDeclaration
                            ? 'bg-purple-500/15 text-purple-400 font-semibold'
                            : 'bg-teal-500/15 text-teal-400'
                        }`}
                      >
                        {occ.isDeclaration ? 'Declaration / Signature' : 'Reference / Call'}
                      </span>
                    </div>
                    <div className="text-pulse-primary bg-pulse-surface p-2 rounded-xl border border-pulse-subtle overflow-x-auto whitespace-pre">
                      {occ.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-pulse-bg border-t border-pulse-subtle flex items-center justify-between text-[11px] text-pulse-muted font-mono">
              <span>Click an occurrence to jump & highlight in editor</span>
              <button
                onClick={() => setUsagesData(null)}
                className="px-3 py-1 rounded-xl bg-pulse-elevated hover:bg-pulse-subtle text-pulse-primary transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
