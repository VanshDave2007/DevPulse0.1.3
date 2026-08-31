import React, { useEffect, useState } from 'react';
import {
  Activity,
  Code2,
  Command,
  Compass,
  Download,
  FileCode,
  FolderGit2,
  Gauge,
  GitPullRequest,
  GraduationCap,
  HeartPulse,
  HelpCircle,
  History,
  Keyboard,
  Layers,
  Moon,
  Network,
  Play,
  Search,
  Settings,
  Share2,
  Shield,
  Sparkles,
  Sun,
  TestTube2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ShortcutItem {
  id: string;
  keys: string[];
  description: string;
  category: 'Navigation' | 'Focus & Views' | 'Analysis & Actions' | 'Modals & Tools';
  action?: () => void;
  highlight?: boolean;
}

interface CheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheatSheetModal: React.FC<CheatSheetModalProps> = ({ isOpen, onClose }) => {
  const {
    setActiveTab,
    setIsCommandMenuOpen,
    setIsSettingsOpen,
    setIsOnboardingOpen,
    setIsExportModalOpen,
    setIsHistoryOpen,
    setIsWorkspaceModalOpen,
    runAnalysis,
    code,
    language,
    theme,
    setTheme,
    toggleFocusMode,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const shortcuts: ShortcutItem[] = [
    // Focus Mode & View Controls
    {
      id: 'shortcut-toggle-focus-mode',
      keys: ['Alt/⌥', 'F'],
      description: 'Toggle Full-Screen Focus Mode (Collapses Sidebar & Header)',
      category: 'Focus & Views',
      highlight: true,
      action: () => {
        onClose();
        toggleFocusMode();
      },
    },
    {
      id: 'shortcut-toggle-focus-mode-alt',
      keys: ['⌘/Ctrl', 'Shift', 'F'],
      description: 'Alternative Shortcut to Toggle Full-Screen Focus Mode',
      category: 'Focus & Views',
      highlight: true,
      action: () => {
        onClose();
        toggleFocusMode();
      },
    },
    {
      id: 'shortcut-exit-focus-mode',
      keys: ['Esc'],
      description: 'Exit Full-Screen Focus Mode or Close Open Overlay Modals',
      category: 'Focus & Views',
      highlight: true,
    },
    {
      id: 'shortcut-toggle-sidebar',
      keys: ['⌘/Ctrl', '\\'],
      description: 'Toggle Collapse / Expand Left Navigation Sidebar',
      category: 'Focus & Views',
    },

    // Navigation views (Alt + 1..9)
    {
      id: 'shortcut-nav-1',
      keys: ['Alt/⌥', '1'],
      description: 'Switch to Observatory Dashboard',
      category: 'Navigation',
      highlight: true,
      action: () => {
        onClose();
        setActiveTab('dashboard');
      },
    },
    {
      id: 'shortcut-nav-2',
      keys: ['Alt/⌥', '2'],
      description: 'Switch to Analyzer Studio & Code Editor',
      category: 'Navigation',
      highlight: true,
      action: () => {
        onClose();
        setActiveTab('analyzer');
      },
    },
    {
      id: 'shortcut-nav-3',
      keys: ['Alt/⌥', '3'],
      description: 'Switch to Agentic Review & PR Intelligence',
      category: 'Navigation',
      highlight: true,
      action: () => {
        onClose();
        setActiveTab('agent-review');
      },
    },
    {
      id: 'shortcut-nav-4',
      keys: ['Alt/⌥', '4'],
      description: 'Switch to Code Health & Quality Scorecard',
      category: 'Navigation',
      highlight: true,
      action: () => {
        onClose();
        setActiveTab('health');
      },
    },
    {
      id: 'shortcut-nav-5',
      keys: ['Alt/⌥', '5'],
      description: 'Switch to Pulse Architecture Topology Map',
      category: 'Navigation',
      highlight: true,
      action: () => {
        onClose();
        setActiveTab('pulse-map');
      },
    },
    {
      id: 'shortcut-nav-6',
      keys: ['Alt/⌥', '6'],
      description: 'Switch to Dependency Pulse & Graph',
      category: 'Navigation',
      highlight: true,
      action: () => {
        onClose();
        setActiveTab('dependencies');
      },
    },
    {
      id: 'shortcut-nav-7',
      keys: ['Alt/⌥', '7'],
      description: 'Switch to Pulse AI Engineering Assistant',
      category: 'Navigation',
      highlight: true,
      action: () => {
        onClose();
        setActiveTab('pulse-ai');
      },
    },
    {
      id: 'shortcut-nav-8',
      keys: ['Alt/⌥', '8'],
      description: 'Switch to Learn Mode Masterclasses',
      category: 'Navigation',
      highlight: true,
      action: () => {
        onClose();
        setActiveTab('learn');
      },
    },
    {
      id: 'shortcut-nav-9',
      keys: ['Alt/⌥', '9'],
      description: 'Switch to Performance & Telemetry Dashboard',
      category: 'Navigation',
      highlight: true,
      action: () => {
        onClose();
        setActiveTab('performance');
      },
    },

    // Analysis & Actions
    {
      id: 'shortcut-run-analysis',
      keys: ['⌘/Ctrl', 'Enter'],
      description: 'Run AST & Static Code Quality Analysis',
      category: 'Analysis & Actions',
      action: () => {
        onClose();
        runAnalysis(code, language);
      },
    },

    // Modals & Tools
    {
      id: 'shortcut-cheat-sheet',
      keys: ['Shift', '?'],
      description: 'Open this Keyboard Shortcuts Quick Reference Overlay',
      category: 'Modals & Tools',
    },
    {
      id: 'shortcut-in-view-search',
      keys: ['⌘/Ctrl', 'F'],
      description: 'Focus In-View Keyword Search & Jump to Section/Code',
      category: 'Modals & Tools',
      action: () => {
        onClose();
        const input = document.getElementById('navbar-view-search-input') as HTMLInputElement | null;
        input?.focus();
        input?.select();
      },
    },
    {
      id: 'shortcut-command-menu',
      keys: ['⌘/Ctrl', 'K'],
      description: 'Open Quick Command Menu & Global Search',
      category: 'Modals & Tools',
      action: () => {
        onClose();
        setIsCommandMenuOpen(true);
      },
    },
    {
      id: 'shortcut-settings',
      keys: ['⌘/Ctrl', ','],
      description: 'Open Settings, Preferences & Accessibility',
      category: 'Modals & Tools',
      action: () => {
        onClose();
        setIsSettingsOpen(true);
      },
    },
    {
      id: 'shortcut-history',
      keys: ['⌘/Ctrl', 'H'],
      description: 'Open Analysis Scan History & Cloud Logs',
      category: 'Modals & Tools',
      action: () => {
        onClose();
        setIsHistoryOpen(true);
      },
    },
    {
      id: 'shortcut-export',
      keys: ['⌘/Ctrl', 'E'],
      description: 'Open Export Report Modal (PDF / JSON)',
      category: 'Modals & Tools',
      action: () => {
        onClose();
        setIsExportModalOpen(true);
      },
    },
    {
      id: 'shortcut-workspace',
      keys: ['⌘/Ctrl', 'G'],
      description: 'Open Google Workspace Hub Integration',
      category: 'Modals & Tools',
      action: () => {
        onClose();
        setIsWorkspaceModalOpen(true);
      },
    },
    {
      id: 'shortcut-theme-toggle',
      keys: ['⌘/Ctrl', 'Shift', 'T'],
      description: 'Cycle Theme (Observatory Dark / Clean Light)',
      category: 'Modals & Tools',
      action: () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
      },
    },
    {
      id: 'shortcut-nav-tour',
      keys: ['⌘/Ctrl', 'Shift', 'H'],
      description: 'Open DevPulse Feature Tour & Guide',
      category: 'Modals & Tools',
      action: () => {
        onClose();
        setIsOnboardingOpen(true);
      },
    },
  ];

  const categories = ['ALL', 'Navigation', 'Focus & Views', 'Analysis & Actions', 'Modals & Tools'] as const;

  const filteredShortcuts = shortcuts.filter((item) => {
    const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keys.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  if (!isOpen) return null;

  return (
    <div
      id="devpulse-cheat-sheet-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="devpulse-cheat-sheet-modal"
        className="w-full max-w-3xl bg-pulse-surface border border-pulse-subtle rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-pulse-subtle bg-pulse-bg/60 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-500 dark:text-teal-400">
              <Keyboard className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-pulse-primary font-sans">Keyboard Shortcuts Cheat Sheet</h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-pulse-elevated text-teal-400 border border-pulse-subtle">
                  Shift + ?
                </span>
              </div>
              <p className="text-xs text-pulse-secondary mt-0.5">
                Master power user shortcuts for instant navigation and workflow efficiency
              </p>
            </div>
          </div>

          <button
            id="close-cheat-sheet-button"
            onClick={onClose}
            className="p-2 rounded-xl text-pulse-muted hover:text-pulse-primary hover:bg-pulse-elevated transition cursor-pointer"
            aria-label="Close shortcuts modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 sm:px-6 border-b border-pulse-subtle bg-pulse-surface flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-teal-500/15 text-teal-500 dark:text-teal-400 border border-teal-500/30 font-semibold'
                    : 'text-pulse-secondary hover:bg-pulse-elevated hover:text-pulse-primary'
                }`}
              >
                {cat === 'ALL' ? 'All Shortcuts' : cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative shrink-0 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-pulse-muted" />
            <input
              type="text"
              placeholder="Search shortcut or key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-pulse-elevated border border-pulse-subtle rounded-xl pl-9 pr-3 py-1.5 text-xs text-pulse-primary placeholder-pulse-muted focus:outline-none focus:border-teal-500/50"
            />
          </div>
        </div>

        {/* Shortcuts Grid List */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 [scrollbar-width:thin]">
          {/* Quick-Reference Highlight Cards (Navigation & Focus Mode) */}
          {activeCategory === 'ALL' && searchQuery.trim() === '' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 border-b border-pulse-subtle/40">
              {/* Focus Mode Highlight */}
              <div
                onClick={() => {
                  onClose();
                  toggleFocusMode();
                }}
                className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-500/10 to-teal-500/5 border border-teal-500/30 hover:border-teal-500/60 cursor-pointer transition flex items-center justify-between gap-3 group"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-300">Focus Mode Toggle</span>
                  </div>
                  <p className="text-[11px] text-pulse-secondary">
                    Collapse all chrome for distraction-free code analysis
                  </p>
                </div>
                <div className="flex items-center space-x-1 shrink-0">
                  <kbd className="px-2 py-1 rounded-lg text-xs font-mono font-bold bg-pulse-surface border border-teal-500/40 text-teal-600 dark:text-teal-300 shadow-sm">
                    ⌥F
                  </kbd>
                  <span className="text-pulse-muted text-[10px]">or</span>
                  <kbd className="px-2 py-1 rounded-lg text-xs font-mono font-bold bg-pulse-surface border border-teal-500/40 text-teal-600 dark:text-teal-300 shadow-sm">
                    Esc
                  </kbd>
                </div>
              </div>

              {/* Instant View Navigation Highlight */}
              <div className="p-3.5 rounded-2xl bg-pulse-elevated/80 border border-pulse-subtle hover:border-pulse-accent/40 transition flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-xs font-bold text-pulse-primary">Direct View Switching</span>
                  <p className="text-[11px] text-pulse-secondary">
                    Jump to any view instantly (Observatory, Analyzer, AI...)
                  </p>
                </div>
                <div className="flex items-center space-x-1 shrink-0">
                  <kbd className="px-2 py-1 rounded-lg text-xs font-mono font-bold bg-pulse-surface border border-pulse-subtle text-pulse-accent shadow-sm">
                    Alt
                  </kbd>
                  <span className="text-pulse-muted text-[10px]">+</span>
                  <kbd className="px-2 py-1 rounded-lg text-xs font-mono font-bold bg-pulse-surface border border-pulse-subtle text-pulse-accent shadow-sm">
                    1-9
                  </kbd>
                </div>
              </div>
            </div>
          )}

          {filteredShortcuts.length === 0 ? (
            <div className="py-12 text-center text-pulse-muted text-xs">
              No shortcuts found matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {filteredShortcuts.map((item) => (
                <div
                  key={item.id}
                  onClick={item.action}
                  className={`p-3.5 rounded-2xl bg-pulse-elevated/70 border border-pulse-subtle flex items-center justify-between gap-3 transition ${
                    item.action ? 'hover:bg-pulse-elevated hover:border-teal-500/30 cursor-pointer' : ''
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <span className="text-xs font-medium text-pulse-primary block truncate">
                      {item.description}
                    </span>
                    <span className="text-[10px] font-mono text-pulse-muted uppercase">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {item.keys.map((k, idx) => (
                      <React.Fragment key={idx}>
                        <kbd className="px-2 py-1 rounded-lg text-[11px] font-mono font-bold bg-pulse-surface border border-pulse-subtle text-pulse-accent shadow-sm">
                          {k}
                        </kbd>
                        {idx < item.keys.length - 1 && (
                          <span className="text-pulse-muted text-[10px]">+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-pulse-subtle bg-pulse-bg/80 flex items-center justify-between text-xs text-pulse-muted">
          <div className="flex items-center space-x-2">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-pulse-surface border border-pulse-subtle text-pulse-primary">
              Shift
            </kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-pulse-surface border border-pulse-subtle text-pulse-primary">
              ?
            </kbd>
            <span>anytime to toggle this guide</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-600 dark:text-teal-300 font-semibold text-xs transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
