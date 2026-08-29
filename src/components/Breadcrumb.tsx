import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  Bot,
  ChevronDown,
  ChevronRight,
  Code2,
  Cpu,
  FileCode,
  FolderGit2,
  Gauge,
  GitPullRequest,
  GraduationCap,
  HeartPulse,
  Home,
  Info,
  Layers,
  Network,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { NavTab, useApp } from '../context/AppContext';

interface NavGroupItem {
  id: NavTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface NavCategory {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultTab: NavTab;
  items: NavGroupItem[];
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    id: 'observatory',
    title: 'Observatory',
    icon: HeartPulse,
    defaultTab: 'dashboard',
    items: [
      {
        id: 'dashboard',
        label: 'Observatory Dashboard',
        shortLabel: 'Dashboard',
        icon: HeartPulse,
        description: 'System health, action center & priority telemetry',
      },
    ],
  },
  {
    id: 'analyze',
    title: 'Analyze',
    icon: Code2,
    defaultTab: 'analyzer',
    items: [
      {
        id: 'analyzer',
        label: 'Analyzer Studio',
        shortLabel: 'Code Analyzer',
        icon: Code2,
        description: 'AST parser, syntax highlighting & heuristic engine',
      },
      {
        id: 'pulse-map',
        label: 'Architecture Map',
        shortLabel: 'Pulse Map',
        icon: Network,
        description: 'Visual code blueprint, dependency graph & topology',
      },
      {
        id: 'dependencies',
        label: 'Dependency Pulse',
        shortLabel: 'Dependencies',
        icon: Layers,
        description: 'Coupling, package scanner & ecosystem telemetry',
      },
    ],
  },
  {
    id: 'security-quality',
    title: 'Security & Quality',
    icon: ShieldCheck,
    defaultTab: 'health',
    items: [
      {
        id: 'health',
        label: 'Code Health Scorecard',
        shortLabel: 'Code Health',
        icon: Activity,
        description: 'Health metrics, code smells & dimension breakdown',
      },
      {
        id: 'agent-review',
        label: 'Agentic Diff Review',
        shortLabel: 'Agentic Review',
        icon: GitPullRequest,
        description: 'Pull request intelligence, git diffs & contextual review',
      },
    ],
  },
  {
    id: 'ai-mentorship',
    title: 'AI & Mentorship',
    icon: Sparkles,
    defaultTab: 'pulse-ai',
    items: [
      {
        id: 'pulse-ai',
        label: 'Pulse AI Assistant',
        shortLabel: 'Pulse AI',
        icon: Sparkles,
        description: 'AI code chat, refactoring & architectural reasoning',
      },
      {
        id: 'learn',
        label: 'Learn Mode',
        shortLabel: 'Learn Mode',
        icon: GraduationCap,
        description: 'Interactive masterclasses, quizzes & knowledge profile',
      },
    ],
  },
  {
    id: 'system',
    title: 'System & Brand',
    icon: Cpu,
    defaultTab: 'performance',
    items: [
      {
        id: 'performance',
        label: 'Performance Telemetry',
        shortLabel: 'Performance',
        icon: Gauge,
        description: 'Real-time render timings & analyzer profiling',
      },
      {
        id: 'about',
        label: 'About DevPulse',
        shortLabel: 'About',
        icon: Info,
        description: 'Platform architecture & engine specifications',
      },
    ],
  },
];

export const Breadcrumb: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    fileName,
    analysis,
    selectedSmell,
  } = useApp();

  const [openDropdown, setOpenDropdown] = useState<'category' | 'view' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Find current category and item
  const currentCategory =
    NAV_CATEGORIES.find((cat) => cat.items.some((item) => item.id === activeTab)) ||
    NAV_CATEGORIES[0];

  const currentItem =
    currentCategory.items.find((item) => item.id === activeTab) ||
    currentCategory.items[0];

  const CategoryIcon = currentCategory.icon;
  const ItemIcon = currentItem.icon;

  return (
    <nav
      id="workspace-breadcrumb-nav"
      aria-label="Breadcrumb"
      className="relative flex items-center min-w-0"
      ref={dropdownRef}
    >
      <ol className="flex items-center flex-nowrap gap-1 sm:gap-1.5 text-xs font-mono text-pulse-muted min-w-0">
        {/* Level 1: Root / Workspace Home */}
        <li className="flex items-center shrink-0">
          <button
            type="button"
            id="breadcrumb-root-btn"
            onClick={() => {
              setActiveTab('dashboard');
              setOpenDropdown(null);
            }}
            className="flex items-center space-x-1 px-1.5 py-1 rounded-lg text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-surface transition cursor-pointer group shrink-0"
            title="Go to Observatory Dashboard"
            aria-label="DevPulse Root Workspace"
          >
            <Home className="h-3.5 w-3.5 text-pulse-accent group-hover:scale-110 transition-transform shrink-0" />
            <span className="hidden sm:inline font-sans font-bold text-pulse-primary text-[11px] tracking-wide">
              DevPulse
            </span>
          </button>
        </li>

        {/* Divider 1 */}
        <li aria-hidden="true" className="hidden sm:inline-flex text-pulse-muted/40 shrink-0">
          <ChevronRight className="h-3 w-3" />
        </li>

        {/* Level 2: Category Group (with quick switcher dropdown) */}
        <li className="relative hidden md:flex items-center shrink-0">
          <button
            type="button"
            id="breadcrumb-category-btn"
            onClick={() =>
              setOpenDropdown(openDropdown === 'category' ? null : 'category')
            }
            className={`flex items-center space-x-1 px-1.5 py-1 rounded-lg transition cursor-pointer shrink-0 ${
              openDropdown === 'category'
                ? 'bg-pulse-elevated text-pulse-primary font-semibold'
                : 'text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-surface'
            }`}
            aria-expanded={openDropdown === 'category'}
            aria-haspopup="true"
            title={`Category: ${currentCategory.title} (Click to switch)`}
          >
            <CategoryIcon className="h-3.5 w-3.5 text-pulse-secondary shrink-0" />
            <span className="text-[11px] font-medium font-sans truncate max-w-[100px]">
              {currentCategory.title}
            </span>
            <ChevronDown className="h-2.5 w-2.5 opacity-60 ml-0.5 shrink-0" />
          </button>

          {/* Category Dropdown Menu */}
          {openDropdown === 'category' && (
            <div className="absolute left-0 top-full mt-1.5 w-56 rounded-2xl bg-pulse-surface border border-pulse-subtle shadow-xl py-1.5 z-50 animate-fadeIn backdrop-blur-md">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-pulse-muted border-b border-pulse-subtle/50">
                Workspace Categories
              </div>
              <div className="p-1 space-y-0.5">
                {NAV_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = cat.id === currentCategory.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(cat.defaultTab);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl text-left text-xs transition cursor-pointer ${
                        isActive
                          ? 'bg-teal-500/15 text-teal-600 dark:text-teal-300 font-bold border border-teal-500/30'
                          : 'text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-pulse-accent" />
                      <div className="min-w-0 flex-1">
                        <div className="font-sans font-semibold truncate">
                          {cat.title}
                        </div>
                        <div className="text-[10px] text-pulse-muted font-mono truncate">
                          {cat.items.length} {cat.items.length === 1 ? 'module' : 'modules'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </li>

        {/* Divider 2 */}
        <li aria-hidden="true" className="hidden md:inline-flex text-pulse-muted/40 shrink-0">
          <ChevronRight className="h-3 w-3" />
        </li>

        {/* Level 3: Active Feature / View Tab */}
        <li className="relative flex items-center min-w-0">
          <button
            type="button"
            id="breadcrumb-view-btn"
            onClick={() =>
              setOpenDropdown(openDropdown === 'view' ? null : 'view')
            }
            className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg transition cursor-pointer min-w-0 max-w-full ${
              openDropdown === 'view'
                ? 'bg-pulse-elevated text-pulse-primary font-bold shadow-sm'
                : 'text-pulse-primary hover:bg-pulse-surface'
            }`}
            aria-expanded={openDropdown === 'view'}
            aria-haspopup="true"
            aria-current="page"
            title={`Active View: ${currentItem.label} (Click to switch sibling views)`}
          >
            <ItemIcon className="h-3.5 w-3.5 text-teal-500 dark:text-teal-400 shrink-0" />
            <span className="font-sans font-bold text-xs sm:text-sm text-pulse-primary truncate max-w-[120px] xs:max-w-[150px] sm:max-w-[190px] md:max-w-[220px] lg:max-w-[260px]">
              {currentItem.label}
            </span>
            {currentCategory.items.length > 1 && (
              <ChevronDown className="h-2.5 w-2.5 opacity-60 ml-0.5 shrink-0" />
            )}
          </button>

          {/* Sibling View Dropdown Menu */}
          {openDropdown === 'view' && currentCategory.items.length > 1 && (
            <div className="absolute left-0 top-full mt-1.5 w-64 rounded-2xl bg-pulse-surface border border-pulse-subtle shadow-xl py-1.5 z-50 animate-fadeIn backdrop-blur-md">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-pulse-muted border-b border-pulse-subtle/50">
                {currentCategory.title} Views
              </div>
              <div className="p-1 space-y-0.5">
                {currentCategory.items.map((item) => {
                  const SiblingIcon = item.icon;
                  const isCurrent = item.id === activeTab;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-start space-x-2.5 px-2.5 py-2 rounded-xl text-left text-xs transition cursor-pointer ${
                        isCurrent
                          ? 'bg-teal-500/15 text-teal-600 dark:text-teal-300 font-bold border border-teal-500/30'
                          : 'text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated'
                      }`}
                    >
                      <SiblingIcon className="h-3.5 w-3.5 shrink-0 text-pulse-accent mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="font-sans font-semibold truncate">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-pulse-muted font-mono line-clamp-1">
                          {item.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </li>
      </ol>
    </nav>
  );
};
