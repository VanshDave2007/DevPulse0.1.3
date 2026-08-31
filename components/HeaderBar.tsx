import React from 'react';
import {
  Activity,
  Code2,
  Download,
  HeartPulse,
  Menu,
  Moon,
  Play,
  Settings,
  Sparkles,
  Sun,
  SunMoon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Breadcrumb } from './Breadcrumb';

interface HeaderBarProps {
  onOpenMobileSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
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
    setIsExportModalOpen,
    runAnalysis,
    code,
    isAnalyzing,
  } = useApp();

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  const healthScore = analysis?.metrics.healthScore ?? 100;
  const healthColor =
    healthScore >= 85
      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : healthScore >= 70
      ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30'
      : 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-pulse-subtle bg-pulse-surface/90 px-4 sm:px-6 backdrop-blur-md transition-colors">
      {/* Left: Mobile Drawer Button + Breadcrumb */}
      <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1 mr-2 sm:mr-4">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl border border-pulse-subtle bg-pulse-elevated text-pulse-secondary hover:text-pulse-primary transition shrink-0 min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Breadcrumb />
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Quick Re-Analyze Button */}
        <button
          onClick={() => runAnalysis(code, language)}
          disabled={isAnalyzing}
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-xs font-semibold text-pulse-primary transition disabled:opacity-50"
          title="Run quick code analysis"
        >
          <Play className={`h-3.5 w-3.5 text-pulse-accent ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
        </button>

        {/* Health Score Capsule */}
        {analysis && (
          <button
            onClick={() => setActiveTab('health')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-bold transition hover:opacity-85 ${healthColor}`}
            title="View Code Health Breakdown"
          >
            <HeartPulse className="h-3.5 w-3.5" />
            <span>{analysis.metrics.healthScore}/100</span>
          </button>
        )}

        {/* Export Report (PDF / JSON) */}
        {analysis && (
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-xs font-semibold text-pulse-primary transition"
            title="Export Code Intelligence & Pulse Map Report (PDF or JSON)"
          >
            <Download className="h-3.5 w-3.5 text-pulse-accent" />
            <span className="hidden sm:inline">Export</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-pulse-subtle bg-pulse-elevated text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated-hover transition"
          title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
        >
          {theme === 'dark' ? (
            <Moon className="h-4 w-4 text-teal-400" />
          ) : theme === 'light' ? (
            <Sun className="h-4 w-4 text-amber-500" />
          ) : (
            <SunMoon className="h-4 w-4 text-cyan-400" />
          )}
        </button>

        {/* Settings Toggle */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-pulse-subtle bg-pulse-elevated text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated-hover transition"
          title="Settings & Accessibility"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
