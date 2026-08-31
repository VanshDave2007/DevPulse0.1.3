import React from 'react';
import {
  Activity,
  Bot,
  ChevronLeft,
  ChevronRight,
  Code2,
  Cpu,
  Gauge,
  GitPullRequest,
  GraduationCap,
  HeartPulse,
  Info,
  Layers,
  Maximize2,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  X,
} from 'lucide-react';
import { NavTab, useApp } from '../context/AppContext';
import { PulseMascot } from './PulseMascot';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

interface NavGroupDef {
  title?: string;
  items: {
    id: NavTab | 'mascot-sheet';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    description?: string;
    isModalTrigger?: boolean;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed,
}) => {
  const {
    activeTab,
    setActiveTab,
    analysis,
    setIsMascotSheetOpen,
    toggleFocusMode,
  } = useApp();

  const navGroups: NavGroupDef[] = [
    {
      items: [
        {
          id: 'dashboard',
          label: 'Observatory',
          icon: HeartPulse,
          description: 'System health & priority telemetry',
        },
      ],
    },
    {
      title: 'Analyze',
      items: [
        {
          id: 'analyzer',
          label: 'Code Analyzer',
          icon: Code2,
          description: 'AST & heuristics engine',
        },
        {
          id: 'pulse-map',
          label: 'Architecture Map',
          icon: Network,
          description: 'Visual code blueprint & graph',
        },
        {
          id: 'dependencies',
          label: 'Dependencies',
          icon: Layers,
          badge: analysis && analysis.metrics.dependenciesCount > 0 ? `${analysis.metrics.dependenciesCount}` : undefined,
          description: 'Coupling & package telemetry',
        },
      ],
    },
    {
      title: 'Security & Quality',
      items: [
        {
          id: 'health',
          label: 'Code Health',
          icon: Activity,
          badge: analysis ? `${analysis.metrics.healthScore}` : undefined,
          description: 'Health scorecard & smell catalog',
        },
        {
          id: 'agent-review',
          label: 'Agentic Review',
          icon: GitPullRequest,
          badge: 'PRO',
          description: 'Diff inspection & PR assistant',
        },
      ],
    },
    {
      title: 'AI & Mentorship',
      items: [
        {
          id: 'pulse-ai',
          label: 'Pulse AI Assistant',
          icon: Sparkles,
          description: 'AI refactoring & code explanations',
        },
        {
          id: 'learn',
          label: 'Learn Mode',
          icon: GraduationCap,
          description: 'Language masterclasses & syntax cheats',
        },
      ],
    },
    {
      title: 'System & Brand',
      items: [
        {
          id: 'performance',
          label: 'Performance',
          icon: Gauge,
          badge: 'LIVE',
          description: 'Render timings & API profiling',
        },
        {
          id: 'mascot-sheet',
          label: 'Mascot Design Sheet',
          icon: Bot,
          badge: '17 Poses',
          description: 'Dual-theme character system & SVG exports',
          isModalTrigger: true,
        },
        {
          id: 'about',
          label: 'About DevPulse',
          icon: Info,
          description: 'Architecture & engine specifications',
        },
      ],
    },
  ];

  const handleNavClick = (itemId: NavTab | 'mascot-sheet', isModalTrigger?: boolean) => {
    if (isModalTrigger && itemId === 'mascot-sheet') {
      setIsMascotSheetOpen(true);
      setIsMobileOpen(false);
      return;
    }
    setActiveTab(itemId as NavTab);
    setIsMobileOpen(false);
  };

  const healthScore = analysis?.metrics.healthScore ?? 100;
  const healthBadgeStyle =
    healthScore >= 85
      ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
      : healthScore >= 70
      ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
      : 'text-rose-500 bg-rose-500/10 border-rose-500/30';

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileOpen && (
        <div
          id="sidebar-mobile-backdrop"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-fadeIn"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Vertical Sidebar */}
      <aside
        id="devpulse-sidebar"
        aria-label="Main Sidebar Navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-pulse-surface border-r border-pulse-subtle transition-all duration-300 ease-in-out select-none ${
          isMobileOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full'
        } md:translate-x-0 ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        }`}
      >
        {/* Sidebar Header: Branding & Collapse Toggle */}
        <div
          className={`flex h-16 items-center ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          } border-b border-pulse-subtle bg-pulse-surface shrink-0`}
        >
          {!isCollapsed ? (
            <>
              <button
                id="sidebar-brand-button"
                onClick={() => handleNavClick('dashboard')}
                className="flex items-center space-x-3 text-left focus:outline-none overflow-hidden cursor-pointer group min-w-0"
                title="DevPulse Observatory"
              >
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 border border-teal-500/30 text-pulse-accent transition-transform duration-300 group-hover:scale-105">
                  <PulseMascot mood="hero" size="sm" interactive={false} />
                </div>

                <div className="truncate animate-fadeIn">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold tracking-tight text-base font-mono text-pulse-primary">
                      DEV<span className="text-pulse-accent">PULSE</span>
                    </span>
                    <span className="rounded bg-teal-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-pulse-accent border border-teal-500/30 font-mono">
                      v1.0
                    </span>
                  </div>
                  <p className="text-[10px] text-pulse-muted truncate font-mono">
                    Code Intelligence
                  </p>
                </div>
              </button>

              {/* Desktop/Tablet Collapse Toggle */}
              <button
                id="sidebar-collapse-toggle"
                onClick={() => setIsCollapsed(true)}
                className="hidden md:flex p-1.5 shrink-0 rounded-xl text-pulse-muted hover:text-pulse-primary hover:bg-pulse-elevated transition cursor-pointer border border-transparent hover:border-pulse-subtle"
                title="Collapse Sidebar (Ctrl+\)"
                aria-label="Collapse Sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              id="sidebar-collapse-toggle-collapsed"
              onClick={() => setIsCollapsed(false)}
              className="flex items-center justify-center h-10 w-10 rounded-xl bg-teal-500/15 border border-teal-500/30 text-pulse-accent hover:scale-105 transition cursor-pointer group"
              title="Expand Sidebar (Ctrl+\)"
              aria-label="Expand Sidebar"
            >
              <PulseMascot mood="hero" size="sm" interactive={false} />
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            id="sidebar-mobile-close-button"
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-xl text-pulse-muted hover:text-pulse-primary hover:bg-pulse-elevated transition cursor-pointer"
            aria-label="Close Sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Navigation Groups List */}
        <nav
          id="sidebar-nav-items"
          aria-label="Sidebar Sections"
          className="flex-1 overflow-y-auto px-3 py-2 space-y-4 [scrollbar-width:thin] [-ms-overflow-style:none]"
        >
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {!isCollapsed && group.title && (
                <div className="px-3 pt-2 pb-1">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-pulse-muted">
                    {group.title}
                  </span>
                </div>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => handleNavClick(item.id, item.isModalTrigger)}
                    title={isCollapsed ? `${item.label} — ${item.description}` : item.description}
                    className={`relative flex w-full items-center ${
                      isCollapsed
                        ? 'justify-center px-2 py-2.5'
                        : 'space-x-3 px-3 py-2'
                    } rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer group ${
                      isActive
                        ? 'bg-teal-500/15 text-teal-400 dark:text-teal-300 font-semibold border border-teal-500/40 shadow-sm'
                        : 'text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated border border-transparent'
                    }`}
                  >
                    {/* Active Left Indicator Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-pulse-accent shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
                    )}

                    <Icon
                      className={`h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                        isActive
                          ? 'text-pulse-accent'
                          : 'text-pulse-muted group-hover:text-pulse-primary'
                      }`}
                    />

                    {!isCollapsed && (
                      <div className="flex-1 text-left truncate">
                        <div className="flex items-center justify-between">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span
                              className={`ml-1.5 px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-md border ${
                                item.id === 'health'
                                  ? healthBadgeStyle
                                  : 'bg-teal-500/20 text-pulse-accent border-teal-500/30'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer: Health Overview & Collapse Button */}
        <div className="border-t border-pulse-subtle bg-pulse-surface p-3 shrink-0 space-y-2">
          {/* Quick Health Summary Capsule */}
          {analysis && !isCollapsed && (
            <button
              id="sidebar-health-status-card"
              onClick={() => handleNavClick('health')}
              className={`flex w-full items-center justify-between p-2.5 rounded-xl border text-xs font-mono font-semibold transition cursor-pointer ${healthBadgeStyle}`}
              title="Click to view full Code Health breakdown"
            >
              <div className="flex items-center space-x-2">
                <HeartPulse className="h-4 w-4 animate-pulse" />
                <span>Code Health</span>
              </div>
              <span className="font-bold">{analysis.metrics.healthScore}/100</span>
            </button>
          )}

          {/* Focus Mode Quick Action Button */}
          <button
            id="sidebar-footer-focus-mode-button"
            onClick={toggleFocusMode}
            className={`flex w-full items-center ${
              isCollapsed ? 'justify-center py-2' : 'justify-between px-3 py-2'
            } rounded-xl text-xs text-pulse-secondary hover:text-pulse-primary hover:bg-teal-500/10 hover:border-teal-500/30 border border-transparent transition cursor-pointer group`}
            title="Full-Screen Focus Mode (Alt + F)"
          >
            <div className="flex items-center space-x-2 truncate">
              <Maximize2 className="h-4 w-4 text-pulse-accent group-hover:scale-110 transition-transform" />
              {!isCollapsed && <span className="text-[11px] font-mono font-medium truncate">Focus Mode</span>}
            </div>
            {!isCollapsed && (
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-pulse-elevated border border-pulse-subtle rounded text-pulse-muted">
                ⌥F
              </kbd>
            )}
          </button>

          {/* Quick Collapse / Expand Action Button */}
          <button
            id="sidebar-footer-collapse-button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:flex w-full items-center ${
              isCollapsed ? 'justify-center py-2' : 'justify-between px-3 py-2'
            } rounded-xl text-xs text-pulse-muted hover:text-pulse-primary hover:bg-pulse-elevated transition cursor-pointer`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {!isCollapsed && (
              <span className="text-[11px] font-mono">Collapse Sidebar</span>
            )}
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-pulse-accent" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
