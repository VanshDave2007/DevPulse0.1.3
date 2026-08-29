import React, { useState } from 'react';
import {
  Activity,
  ChevronDown,
  ChevronRight,
  Code2,
  Expand,
  FileCode,
  GitPullRequest,
  HeartPulse,
  Maximize2,
  Minimize2,
  Network,
  Play,
  Sparkles,
  X,
} from 'lucide-react';
import { NavTab, useApp } from '../context/AppContext';

export const FocusModeBar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isFocusMode,
    setIsFocusMode,
    toggleFocusMode,
    fileName,
    analysis,
    code,
    language,
    runAnalysis,
    isAnalyzing,
  } = useApp();

  const [isBarMinimized, setIsBarMinimized] = useState<boolean>(false);
  const [isQuickNavOpen, setIsQuickNavOpen] = useState<boolean>(false);

  if (!isFocusMode) return null;

  const quickTabs: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Observatory', icon: HeartPulse },
    { id: 'analyzer', label: 'Analyzer', icon: Code2 },
    { id: 'agent-review', label: 'Agentic Review', icon: GitPullRequest },
    { id: 'pulse-map', label: 'Architecture Map', icon: Network },
    { id: 'health', label: 'Code Health', icon: Activity },
    { id: 'pulse-ai', label: 'Pulse AI', icon: Sparkles },
  ];

  const currentTab = quickTabs.find((t) => t.id === activeTab) || {
    id: activeTab,
    label: activeTab.toUpperCase(),
    icon: Code2,
  };
  const CurrentIcon = currentTab.icon;

  const healthScore = analysis?.metrics.healthScore ?? 100;
  const healthBadgeColor =
    healthScore >= 85
      ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
      : healthScore >= 70
      ? 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10'
      : 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10';

  // If user collapsed the floating bar to a mini floating badge in top-right
  if (isBarMinimized) {
    return (
      <div className="fixed top-3 right-4 z-50 animate-fadeIn">
        <button
          type="button"
          id="focus-mode-expand-pill"
          onClick={() => setIsBarMinimized(false)}
          className="group flex items-center space-x-2 px-3 py-1.5 rounded-full bg-pulse-surface/95 border border-teal-500/40 text-pulse-primary shadow-xl backdrop-blur-md hover:border-teal-500 transition cursor-pointer text-xs font-mono"
          title="Focus Mode Active — Click to expand toolbar"
        >
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shrink-0" />
          <span className="font-bold text-teal-600 dark:text-teal-400">Focus Mode</span>
          <span className="text-pulse-muted text-[11px] hidden sm:inline">({currentTab.label})</span>
          <Expand className="h-3 w-3 text-pulse-muted group-hover:text-pulse-primary transition ml-1" />
        </button>
      </div>
    );
  }

  return (
    <div
      id="focus-mode-hud-bar"
      className="fixed top-2.5 left-1/2 -translate-x-1/2 z-50 w-[96vw] max-w-5xl animate-slideUp"
    >
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-pulse-surface/95 border border-teal-500/40 shadow-2xl backdrop-blur-md text-xs">
        {/* Left: Focus Mode Badge & Active View Selector */}
        <div className="flex items-center space-x-2 min-w-0">
          {/* Glowing Focus Indicator */}
          <div
            className="flex items-center space-x-1.5 px-2 py-1 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 font-mono text-[11px] font-bold shrink-0"
            title="Focus Mode Active — Sidebar and top navigation collapsed for full-screen analysis"
          >
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shrink-0" />
            <span className="hidden sm:inline">FOCUS MODE</span>
          </div>

          {/* Current View & Quick Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              id="focus-mode-view-switcher"
              onClick={() => setIsQuickNavOpen(!isQuickNavOpen)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-pulse-elevated hover:bg-pulse-subtle border border-pulse-subtle text-pulse-primary font-semibold transition cursor-pointer"
              title="Switch workspace view"
            >
              <CurrentIcon className="h-3.5 w-3.5 text-teal-500 dark:text-teal-400 shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-[160px]">{currentTab.label}</span>
              <ChevronDown className="h-3 w-3 opacity-60 ml-0.5 shrink-0" />
            </button>

            {/* Quick Switcher Menu */}
            {isQuickNavOpen && (
              <div
                className="absolute left-0 top-full mt-1.5 w-52 rounded-2xl bg-pulse-surface border border-pulse-subtle shadow-2xl py-1 z-50 animate-fadeIn backdrop-blur-md"
                onMouseLeave={() => setIsQuickNavOpen(false)}
              >
                <div className="px-3 py-1 text-[10px] font-mono uppercase text-pulse-muted border-b border-pulse-subtle/50">
                  Switch Focus View
                </div>
                <div className="p-1 space-y-0.5">
                  {quickTabs.map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = tab.id === activeTab;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsQuickNavOpen(false);
                        }}
                        className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-left text-xs transition cursor-pointer ${
                          isActive
                            ? 'bg-teal-500/15 text-teal-600 dark:text-teal-300 font-bold border border-teal-500/30'
                            : 'text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated'
                        }`}
                      >
                        <TabIcon className="h-3.5 w-3.5 shrink-0 text-pulse-accent" />
                        <span className="truncate">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Active File Pill */}
          {analysis && fileName && (
            <div className="hidden md:flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-pulse-elevated border border-pulse-subtle text-pulse-muted font-mono text-[11px] truncate max-w-[160px]">
              <FileCode className="h-3 w-3 shrink-0 text-pulse-accent" />
              <span className="truncate">{fileName}</span>
            </div>
          )}
        </div>

        {/* Center/Right: Quick Actions & Exit Focus Mode */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Run Analysis Trigger */}
          {code && (
            <button
              type="button"
              id="focus-mode-run-analysis"
              onClick={() => runAnalysis(code, language)}
              disabled={isAnalyzing}
              className="hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-pulse-elevated hover:bg-pulse-subtle border border-pulse-subtle text-[11px] font-semibold text-pulse-primary transition disabled:opacity-50 cursor-pointer"
              title="Run AST & Heuristic analysis"
            >
              <Play className={`h-3 w-3 text-pulse-accent ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing...' : 'Re-Analyze'}</span>
            </button>
          )}

          {/* Health Score Pill */}
          {analysis && (
            <div
              className={`hidden sm:flex items-center space-x-1 px-2 py-0.5 rounded-full border text-[11px] font-mono font-bold ${healthBadgeColor}`}
              title={`Composite Code Health: ${healthScore}/100`}
            >
              <HeartPulse className="h-3 w-3" />
              <span>{healthScore}</span>
            </div>
          )}

          {/* Minimize Floating Bar into Corner Badge */}
          <button
            type="button"
            id="focus-mode-minimize-bar"
            onClick={() => setIsBarMinimized(true)}
            className="p-1.5 text-pulse-muted hover:text-pulse-primary hover:bg-pulse-elevated rounded-xl transition cursor-pointer"
            title="Minimize toolbar to floating corner badge"
            aria-label="Minimize Focus Toolbar"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Exit Focus Mode Button */}
          <button
            type="button"
            id="exit-focus-mode-button"
            onClick={() => setIsFocusMode(false)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:opacity-90 text-[#08110F] text-xs font-bold transition shadow-md cursor-pointer"
            title="Exit Focus Mode (Esc / Alt+F)"
          >
            <Minimize2 className="h-3.5 w-3.5 shrink-0" />
            <span>Exit Focus</span>
            <kbd className="hidden sm:inline-block px-1 py-0.2 text-[9px] font-mono bg-black/20 rounded">
              Esc
            </kbd>
          </button>
        </div>
      </div>
    </div>
  );
};
