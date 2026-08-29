import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Award,
  BookOpen,
  Boxes,
  Code2,
  Cpu,
  Download,
  FileCode,
  Gauge,
  GitPullRequest,
  GraduationCap,
  HeartPulse,
  HelpCircle,
  Info,
  Keyboard,
  Layers,
  Maximize2,
  Moon,
  Network,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Sun,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SAMPLE_PROJECTS } from '../data/samples';

export const CommandMenu: React.FC = () => {
  const {
    isCommandMenuOpen,
    setIsCommandMenuOpen,
    setActiveTab,
    loadPreset,
    sendAiRequest,
    theme,
    setTheme,
    setIsSettingsOpen,
    setIsOnboardingOpen,
    setIsExportModalOpen,
    setIsCheatSheetOpen,
    toggleFocusMode,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isCommandMenuOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isCommandMenuOpen]);

  // Build command items
  const items = useMemo(() => {
    const list = [
      // Navigation
      {
        id: 'nav-dashboard',
        category: 'Navigation',
        label: 'Open Observatory Dashboard',
        icon: Activity,
        action: () => {
          setActiveTab('dashboard');
          setIsCommandMenuOpen(false);
        },
      },
      {
        id: 'nav-analyzer',
        category: 'Navigation',
        label: 'Open Analyzer Studio & Code Editor',
        icon: Code2,
        action: () => {
          setActiveTab('analyzer');
          setIsCommandMenuOpen(false);
        },
      },
      {
        id: 'nav-agent-review',
        category: 'Navigation',
        label: 'Open Agentic Code Reviewer (Diff + AST + Call Graph)',
        icon: GitPullRequest,
        action: () => {
          setActiveTab('agent-review');
          setIsCommandMenuOpen(false);
        },
      },
      {
        id: 'nav-health',
        category: 'Navigation',
        label: 'Open Code Health Scorecard',
        icon: HeartPulse,
        action: () => {
          setActiveTab('health');
          setIsCommandMenuOpen(false);
        },
      },
      {
        id: 'nav-map',
        category: 'Navigation',
        label: 'Open Code Pulse Map (Topology Visualizer)',
        icon: Network,
        action: () => {
          setActiveTab('pulse-map');
          setIsCommandMenuOpen(false);
        },
      },
      {
        id: 'nav-deps',
        category: 'Navigation',
        label: 'Open Dependency Pulse (Imports & Packages)',
        icon: Layers,
        action: () => {
          setActiveTab('dependencies');
          setIsCommandMenuOpen(false);
        },
      },
      {
        id: 'nav-ai',
        category: 'Navigation',
        label: 'Open Pulse AI Assistant',
        icon: Sparkles,
        action: () => {
          setActiveTab('pulse-ai');
          setIsCommandMenuOpen(false);
        },
      },
      {
        id: 'nav-learn',
        category: 'Navigation',
        label: 'Open Learn Mode & CS Concepts',
        icon: GraduationCap,
        action: () => {
          setActiveTab('learn');
          setIsCommandMenuOpen(false);
        },
      },
      {
        id: 'nav-performance',
        category: 'Navigation',
        label: 'Open Performance & Telemetry Dashboard (Render timings & API Latency)',
        icon: Gauge,
        action: () => {
          setActiveTab('performance');
          setIsCommandMenuOpen(false);
        },
      },
      {
        id: 'nav-about',
        category: 'Navigation',
        label: 'Open About DevPulse',
        icon: Info,
        action: () => {
          setActiveTab('about');
          setIsCommandMenuOpen(false);
        },
      },
      {
        id: 'action-focus-mode',
        category: 'Actions',
        label: 'Toggle Full-Screen Focus Mode (Alt+F)',
        icon: Maximize2,
        action: () => {
          toggleFocusMode();
          setIsCommandMenuOpen(false);
        },
      },
      {
        id: 'action-export',
        category: 'Actions',
        label: 'Export Analysis & Pulse Map (PDF / JSON Report)',
        icon: Download,
        action: () => {
          setIsExportModalOpen(true);
          setIsCommandMenuOpen(false);
        },
      },
      {
        id: 'nav-settings',
        category: 'Preferences',
        label: 'Open Settings & Accessibility',
        icon: Settings,
        action: () => {
          setIsSettingsOpen(true);
          setIsCommandMenuOpen(false);
        },
      },
      {
        id: 'nav-shortcuts',
        category: 'Help',
        label: 'Open Keyboard Shortcuts Cheat Sheet (Shift + ?)',
        icon: Keyboard,
        action: () => {
          setIsCheatSheetOpen(true);
          setIsCommandMenuOpen(false);
        },
      },
      {
        id: 'nav-tour',
        category: 'Help',
        label: 'Start DevPulse Feature Tour & Guide',
        icon: HelpCircle,
        action: () => {
          setIsOnboardingOpen(true);
          setIsCommandMenuOpen(false);
        },
      },

      // AI Instant Actions
      {
        id: 'ai-explain',
        category: 'Pulse AI',
        label: 'Ask AI: Explain Code Structure & Architecture',
        icon: Sparkles,
        action: () => {
          sendAiRequest('explain');
          setActiveTab('pulse-ai');
          setIsCommandMenuOpen(false);
        },
      },
      {
        id: 'ai-audit',
        category: 'Pulse AI',
        label: 'Ask AI: Audit Code Smells & Security Vulnerabilities',
        icon: ShieldAlert,
        action: () => {
          sendAiRequest('audit');
          setActiveTab('pulse-ai');
          setIsCommandMenuOpen(false);
        },
      },
      {
        id: 'ai-improve',
        category: 'Pulse AI',
        label: 'Ask AI: Refactor & Modernize Implementation',
        icon: Wrench,
        action: () => {
          sendAiRequest('improve');
          setActiveTab('pulse-ai');
          setIsCommandMenuOpen(false);
        },
      },
      {
        id: 'ai-optimize',
        category: 'Pulse AI',
        label: 'Ask AI: Optimize Time & Space Complexity',
        icon: Zap,
        action: () => {
          sendAiRequest('optimize');
          setActiveTab('pulse-ai');
          setIsCommandMenuOpen(false);
        },
      },
      {
        id: 'ai-tests',
        category: 'Pulse AI',
        label: 'Ask AI: Generate Comprehensive Unit Test Suite',
        icon: Award,
        action: () => {
          sendAiRequest('tests');
          setActiveTab('pulse-ai');
          setIsCommandMenuOpen(false);
        },
      },

      // Themes
      {
        id: 'theme-dark',
        category: 'Theme',
        label: 'Switch to Observatory Dark Theme',
        icon: Moon,
        action: () => {
          setTheme('dark');
          setIsCommandMenuOpen(false);
        },
      },
      {
        id: 'theme-light',
        category: 'Theme',
        label: 'Switch to Clean Light Theme',
        icon: Sun,
        action: () => {
          setTheme('light');
          setIsCommandMenuOpen(false);
        },
      },

      // Sample Projects
      ...SAMPLE_PROJECTS.map((p) => ({
        id: `sample-${p.id}`,
        category: 'Sample Codebases',
        label: `Load ${p.title} (${p.language.toUpperCase()})`,
        icon: FileCode,
        action: () => {
          loadPreset(p.id);
          setActiveTab('analyzer');
          setIsCommandMenuOpen(false);
        },
      })),
    ];

    if (!query.trim()) return list;

    const lower = query.toLowerCase();
    return list.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        item.category.toLowerCase().includes(lower)
    );
  }, [query, setActiveTab, loadPreset, sendAiRequest, setTheme, setIsSettingsOpen, setIsOnboardingOpen, setIsExportModalOpen, setIsCheatSheetOpen, setIsCommandMenuOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isCommandMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCommandMenuOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, items.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % Math.max(1, items.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[selectedIndex]) {
          items[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandMenuOpen, items, selectedIndex, setIsCommandMenuOpen]);

  if (!isCommandMenuOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={() => setIsCommandMenuOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-pulse-surface border border-pulse-subtle rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="p-4 border-b border-pulse-subtle flex items-center space-x-3 bg-pulse-bg/50">
          <Search className="h-5 w-5 text-pulse-accent shrink-0" />
          <input
            type="text"
            placeholder="Type a command, search views, or load samples..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            autoFocus
            className="w-full bg-transparent text-sm text-pulse-primary placeholder-pulse-muted focus:outline-none font-medium"
          />
          <button
            onClick={() => setIsCommandMenuOpen(false)}
            className="p-1.5 rounded-xl text-pulse-muted hover:text-pulse-primary hover:bg-pulse-elevated transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 divide-y divide-pulse-subtle/40">
          {items.length === 0 ? (
            <div className="p-8 text-center text-pulse-muted text-xs">
              No matching commands or actions found for &quot;{query}&quot;
            </div>
          ) : (
            items.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left text-xs transition ${
                    isSelected
                      ? 'bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-300'
                      : 'text-pulse-primary hover:bg-pulse-elevated'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-xl ${
                        isSelected
                          ? 'bg-teal-500/20 text-pulse-accent'
                          : 'bg-pulse-elevated text-pulse-secondary'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-pulse-muted uppercase tracking-wider px-2 py-0.5 rounded bg-pulse-bg border border-pulse-subtle">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="p-3 border-t border-pulse-subtle bg-pulse-bg/80 flex items-center justify-between text-[11px] font-mono text-pulse-muted">
          <div className="flex items-center space-x-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
            <span>esc to close</span>
          </div>
          <span>DevPulse Commands</span>
        </div>
      </div>
    </div>
  );
};
