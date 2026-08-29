import React from 'react';
import { Search, X, Filter, Sparkles, BookOpen, Layers, Target } from 'lucide-react';
import { LearningDifficulty, LearningSearchFilter } from '../../data/learning/types';

interface LearningSearchFilterBarProps {
  filter: LearningSearchFilter;
  onChange: (filter: LearningSearchFilter) => void;
  totalCount: number;
  filteredCount: number;
}

const CATEGORIES = [
  'All',
  'Web Frontend',
  'Backend & APIs',
  'Systems & Performance',
  'Mobile',
  'Data & AI',
];

const DIFFICULTIES: (LearningDifficulty | 'All')[] = [
  'All',
  'Beginner',
  'Intermediate',
  'Advanced',
];

const PARADIGMS = [
  'All',
  'Object-Oriented',
  'Functional',
  'Imperative',
  'Concurrent',
  'Declarative',
];

export const LearningSearchFilterBar: React.FC<LearningSearchFilterBarProps> = ({
  filter,
  onChange,
  totalCount,
  filteredCount,
}) => {
  const isFiltered =
    Boolean(filter.query) ||
    filter.category !== 'All' ||
    filter.difficulty !== 'All' ||
    filter.paradigm !== 'All';

  const handleReset = () => {
    onChange({
      query: '',
      category: 'All',
      difficulty: 'All',
      paradigm: 'All',
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-4 h-5 w-5 text-pulse-muted pointer-events-none" />
        <input
          type="text"
          value={filter.query || ''}
          onChange={(e) => onChange({ ...filter, query: e.target.value })}
          placeholder="Search languages, paradigms, syntax concepts, tools, keywords (e.g. 'ownership', 'async', 'goroutines', 'ORM')..."
          className="w-full pl-11 pr-24 py-3.5 bg-pulse-surface border border-pulse-subtle rounded-2xl text-sm text-pulse-primary placeholder:text-pulse-muted focus:outline-none focus:border-pulse-accent focus:ring-1 focus:ring-pulse-accent transition-all shadow-sm"
        />
        {filter.query && (
          <button
            onClick={() => onChange({ ...filter, query: '' })}
            className="absolute right-12 p-1 text-pulse-muted hover:text-pulse-primary rounded-lg transition-colors"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="absolute right-3 px-2.5 py-1 bg-pulse-subtle/40 border border-pulse-subtle/60 rounded-lg text-[11px] font-mono text-pulse-secondary">
          {filteredCount}/{totalCount}
        </div>
      </div>

      {/* Filter Chips & Categories */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {CATEGORIES.map((cat) => {
            const isActive = (filter.category || 'All') === cat;
            return (
              <button
                key={cat}
                onClick={() => onChange({ ...filter, category: cat })}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-pulse-accent text-white shadow-sm font-semibold'
                    : 'bg-pulse-surface/80 hover:bg-pulse-subtle/60 text-pulse-secondary hover:text-pulse-primary border border-pulse-subtle'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Dropdown Selectors for Difficulty & Paradigm */}
        <div className="flex items-center gap-2">
          {/* Difficulty select */}
          <div className="relative">
            <select
              value={filter.difficulty || 'All'}
              onChange={(e) =>
                onChange({
                  ...filter,
                  difficulty: e.target.value as LearningDifficulty | 'All',
                })
              }
              className="appearance-none bg-pulse-surface border border-pulse-subtle text-pulse-primary text-xs rounded-xl px-3 py-1.5 pr-7 focus:outline-none focus:border-pulse-accent cursor-pointer"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">🟢 Beginner</option>
              <option value="Intermediate">🟡 Intermediate</option>
              <option value="Advanced">🔴 Advanced</option>
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-pulse-muted pointer-events-none" />
          </div>

          {/* Paradigm select */}
          <div className="relative">
            <select
              value={filter.paradigm || 'All'}
              onChange={(e) =>
                onChange({ ...filter, paradigm: e.target.value })
              }
              className="appearance-none bg-pulse-surface border border-pulse-subtle text-pulse-primary text-xs rounded-xl px-3 py-1.5 pr-7 focus:outline-none focus:border-pulse-accent cursor-pointer"
            >
              <option value="All">All Paradigms</option>
              {PARADIGMS.filter((p) => p !== 'All').map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <Layers className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-pulse-muted pointer-events-none" />
          </div>

          {isFiltered && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors"
            >
              <X className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
