import React, { useState } from 'react';
import {
  Activity,
  Code2,
  Download,
  FileCode,
  HeartPulse,
  HelpCircle,
  History,
  Keyboard,
  Maximize2,
  Menu,
  Moon,
  Play,
  Search,
  Settings,
  Share2,
  Sparkles,
  Sun,
  SunMoon,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Breadcrumb } from './Breadcrumb';

interface NavbarProps {
  onOpenMobileSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileSidebar,
}) => {
  const {
    activeTab,
    setActiveTab,
    analysis,
    language,
    fileName,
    theme,
    setTheme,
    setIsSettingsOpen,
    setIsCommandMenuOpen,
    setIsOnboardingOpen,
    setIsHistoryOpen,
    setIsWorkspaceModalOpen,
    setIsAuthModalOpen,
    setIsExportModalOpen,
    setIsCheatSheetOpen,
    runAnalysis,
    code,
    isAnalyzing,
    user,
    toggleFocusMode,
  } = useApp();

  const [isThemeAnimating, setIsThemeAnimating] = useState(false);

  const cycleTheme = () => {
    setIsThemeAnimating(true);
    setTimeout(() => setIsThemeAnimating(false), 450);

    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  const healthScore = analysis?.metrics.healthScore ?? 100;
  const healthColor =
    healthScore >= 85
      ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20'
      : healthScore >= 70
      ? 'text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20'
      : 'text-rose-600 dark:text-rose-400 border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20';

  return (
    <header
      id="devpulse-top-bar"
      className="navbar sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-pulse-subtle bg-pulse-bg/95 px-3 sm:px-4 lg:px-6 backdrop-blur-md transition-colors duration-300 gap-4 overflow-hidden"
    >
      {/* SECTION 1: Brand & Main Navigation Breadcrumb */}
      <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0 flex-shrink-1 max-w-[45%] sm:max-w-[48%] md:max-w-[40%] lg:max-w-none">
        {/* Mobile Sidebar Hamburger Trigger */}
        <button
          id="mobile-sidebar-toggle-button"
          onClick={onOpenMobileSidebar}
          className="md:hidden p-1.5 rounded-xl border border-pulse-subtle bg-pulse-surface hover:bg-pulse-elevated text-pulse-secondary hover:text-pulse-primary transition cursor-pointer shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label="Open Navigation Sidebar"
          title="Open Navigation Menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {/* Dynamic Workspace Breadcrumb Navigation */}
        <Breadcrumb />
      </div>

      {/* SECTION 2: Analysis Context / Selector (Center Section) */}
      {analysis && (
        <div className="truncate max-w-[200px] sm:max-w-xs flex items-center min-w-0">
          <button
            id="header-analysis-selector"
            type="button"
            onClick={() => {
              if (activeTab !== 'analyzer') {
                setActiveTab('analyzer');
              }
            }}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-pulse-surface hover:bg-pulse-elevated border border-pulse-subtle hover:border-pulse-strong text-xs font-mono transition cursor-pointer min-w-0 max-w-full shadow-sm group truncate"
            title={`${analysis.languageName} — Active Target: ${fileName || 'Active Buffer'}`}
            aria-label={`Analysis Engine: ${analysis.languageName}. Target File: ${fileName || 'Active Buffer'}`}
          >
            <FileCode className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform" />
            <span
              className="font-semibold text-pulse-primary truncate shrink min-w-0"
              title={fileName || 'code.ts'}
            >
              {fileName || 'code.ts'}
            </span>
            <span
              className="text-pulse-muted text-[11px] truncate shrink opacity-75 hidden sm:inline min-w-0"
              title={analysis.languageName}
            >
              ({analysis.languageName})
            </span>
          </button>
        </div>
      )}

      {/* SECTION 3 & 4: Score / Status & Utility Actions */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0 ml-auto">
        {/* Score / Status Indicator Pill */}
        {analysis && (
          <button
            id="header-health-score-pill"
            type="button"
            onClick={() => setActiveTab('health')}
            className={`flex items-center space-x-1 sm:space-x-1.5 rounded-full border px-2 sm:px-2.5 py-1 text-xs font-mono font-bold transition cursor-pointer shrink-0 shadow-sm ${healthColor}`}
            title={`Code Health Score: ${analysis.metrics.healthScore}/100 — Click to inspect scorecard`}
            aria-label={`Code Health Score: ${analysis.metrics.healthScore} out of 100`}
          >
            <HeartPulse className="h-3.5 w-3.5 shrink-0" />
            <span>{analysis.metrics.healthScore}/100</span>
          </button>
        )}

        {/* Quick Re-Analyze Action Button (visible on large screens when code exists) */}
        {code && (
          <button
            id="header-run-analysis-button"
            type="button"
            onClick={() => runAnalysis(code, language)}
            disabled={isAnalyzing}
            className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-pulse-surface hover:bg-pulse-elevated border border-pulse-subtle text-xs font-semibold text-pulse-primary transition disabled:opacity-50 cursor-pointer shadow-sm shrink-0"
            title="Run AST & Heuristic analysis on current code (⌘+Enter)"
          >
            <Play className={`h-3.5 w-3.5 text-pulse-accent ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing...' : 'Run'}</span>
          </button>
        )}

        {/* Global Search / Command Menu Trigger (Ctrl+K) */}
        <button
          id="command-menu-trigger-button"
          type="button"
          onClick={() => setIsCommandMenuOpen(true)}
          className="flex items-center space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-pulse-subtle bg-pulse-surface hover:bg-pulse-elevated text-xs text-pulse-secondary hover:text-pulse-primary transition shadow-sm cursor-pointer shrink-0"
          title="Search commands, tools and navigate (Ctrl+K / ⌘K)"
          aria-label="Open Command Search Menu"
        >
          <Search className="h-3.5 w-3.5 text-pulse-accent shrink-0" />
          <span className="hidden 2xl:inline text-[11px] font-mono text-pulse-muted">Search...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-pulse-elevated border border-pulse-subtle rounded text-pulse-muted">
            ⌘K
          </kbd>
        </button>

        {/* Export Report Trigger (PDF / JSON) */}
        {analysis && (
          <button
            id="header-export-report-button"
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="hidden 2xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-pulse-subtle bg-pulse-surface text-pulse-secondary hover:bg-pulse-elevated hover:text-pulse-primary text-xs font-medium transition cursor-pointer shrink-0"
            title="Export Code Intelligence Report (PDF or JSON)"
          >
            <Download className="h-3.5 w-3.5 text-pulse-accent shrink-0" />
            <span>Export</span>
          </button>
        )}

        {/* Analysis History Trigger */}
        <button
          id="open-history-button"
          type="button"
          onClick={() => setIsHistoryOpen(true)}
          className="hidden sm:flex h-8 w-8 items-center justify-center rounded-xl border border-pulse-subtle bg-pulse-surface text-pulse-secondary hover:bg-pulse-elevated hover:text-pulse-primary transition cursor-pointer shrink-0"
          aria-label="View Analysis History"
          title="Analysis History & Cloud Scans"
        >
          <History className="h-3.5 w-3.5 text-teal-500 dark:text-teal-400" />
        </button>

        {/* Google Workspace Integration Trigger */}
        <button
          id="open-workspace-button"
          type="button"
          onClick={() => setIsWorkspaceModalOpen(true)}
          className="hidden lg:flex h-8 w-8 items-center justify-center rounded-xl border border-pulse-subtle bg-pulse-surface text-pulse-secondary hover:bg-pulse-elevated hover:text-pulse-primary transition cursor-pointer shrink-0"
          aria-label="Google Workspace Hub (Drive, Docs, Tasks, Calendar, Gmail)"
          title="Google Workspace Hub"
        >
          <Share2 className="h-3.5 w-3.5 text-teal-500 dark:text-teal-400" />
        </button>

        {/* Feature Tour / Help Guide */}
        <button
          id="open-tour-button"
          type="button"
          onClick={() => setIsOnboardingOpen(true)}
          className="hidden xl:flex h-8 w-8 items-center justify-center rounded-xl border border-pulse-subtle bg-pulse-surface text-pulse-secondary hover:bg-pulse-elevated hover:text-pulse-primary transition cursor-pointer shrink-0"
          aria-label="DevPulse Tour & Quick Guide"
          title="DevPulse Tour & Quick Guide"
        >
          <HelpCircle className="h-3.5 w-3.5 text-pulse-accent" />
        </button>

        {/* Focus Mode Trigger (Full-Screen Workspace) */}
        <button
          id="header-focus-mode-button"
          type="button"
          onClick={toggleFocusMode}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-pulse-subtle bg-pulse-surface text-pulse-secondary hover:bg-pulse-elevated hover:text-pulse-primary hover:border-teal-500/50 transition cursor-pointer shrink-0"
          aria-label="Toggle Full-Screen Focus Mode (Alt + F)"
          title="Toggle Full-Screen Focus Mode (Alt + F)"
        >
          <Maximize2 className="h-3.5 w-3.5 text-pulse-accent" />
        </button>

        {/* Keyboard Shortcuts Cheat Sheet Trigger */}
        <button
          id="open-cheat-sheet-button"
          type="button"
          onClick={() => setIsCheatSheetOpen(true)}
          className="hidden xl:flex h-8 w-8 items-center justify-center rounded-xl border border-pulse-subtle bg-pulse-surface text-pulse-secondary hover:bg-pulse-elevated hover:text-pulse-primary transition cursor-pointer shrink-0"
          aria-label="Keyboard Shortcuts Cheat Sheet (Shift + ?)"
          title="Keyboard Shortcuts (Shift + ?)"
        >
          <Keyboard className="h-3.5 w-3.5 text-pulse-accent" />
        </button>

        {/* Theme Switcher Button with Smooth Animation Feedback */}
        <button
          id="theme-toggle-button"
          type="button"
          onClick={cycleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-pulse-subtle bg-pulse-surface text-pulse-secondary hover:bg-pulse-elevated hover:text-pulse-primary transition cursor-pointer shrink-0 overflow-hidden"
          aria-label={`Current theme: ${theme}. Click to switch theme.`}
          title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
        >
          <div className={isThemeAnimating ? 'animate-theme-switch' : ''}>
            {theme === 'dark' ? (
              <Moon className="h-3.5 w-3.5 text-pulse-accent" />
            ) : theme === 'light' ? (
              <Sun className="h-3.5 w-3.5 text-amber-500" />
            ) : (
              <SunMoon className="h-3.5 w-3.5 text-cyan-400" />
            )}
          </div>
        </button>

        {/* Settings & Accessibility Button */}
        <button
          id="open-settings-button"
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-pulse-subtle bg-pulse-surface text-pulse-secondary hover:bg-pulse-elevated hover:text-pulse-primary transition cursor-pointer shrink-0"
          aria-label="Open Settings and Accessibility"
          title="Settings & Accessibility"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>

        {/* User Account / Sign In Trigger */}
        <button
          id="open-auth-button"
          type="button"
          onClick={() => setIsAuthModalOpen(true)}
          className={`flex items-center space-x-1.5 h-8 px-2 sm:px-2.5 rounded-xl border transition cursor-pointer shrink-0 ${
            user
              ? 'bg-teal-500/15 border-teal-500/40 text-teal-600 dark:text-teal-300 font-semibold'
              : 'border-pulse-subtle bg-pulse-surface text-pulse-secondary hover:bg-pulse-elevated hover:text-pulse-primary'
          }`}
          aria-label={user ? `Signed in as ${user.displayName || user.email}` : 'Sign In'}
          title={user ? `Signed in as ${user.displayName || user.email}` : 'Sign In / Account'}
        >
          <User className="h-3.5 w-3.5 text-teal-500 dark:text-teal-400 shrink-0" />
          <span className="text-[11px] font-mono hidden xl:inline max-w-[80px] truncate">
            {user ? (user.displayName ? user.displayName.split(' ')[0] : 'Account') : 'Sign In'}
          </span>
        </button>
      </div>
    </header>
  );
};

