import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Code2,
  CornerDownLeft,
  FileCode,
  Layers,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export interface ViewSearchResult {
  id: string;
  type: 'section' | 'code-line' | 'finding' | 'element';
  title: string;
  subtitle?: string;
  snippet?: string;
  lineNumber?: number;
  element?: HTMLElement | null;
  targetId?: string;
}

export const ViewSearchInput: React.FC = () => {
  const { code, analysis, activeTab, setSelectedSmell } = useApp();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [activeHighlightEl, setActiveHighlightEl] = useState<HTMLElement | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (⌘F / Ctrl+F or /) to focus view search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInputActive = activeTag === 'input' || activeTag === 'textarea';

      // Cmd/Ctrl + F focusing within page
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f' && !e.shiftKey) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsOpen(true);
      } else if (e.key === '/' && !isInputActive) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Compute matching sections, code lines, and findings within the current view
  const searchResults: ViewSearchResult[] = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const results: ViewSearchResult[] = [];

    // 1. Scan Code Lines (from active buffer)
    if (code) {
      const lines = code.split('\n');
      lines.forEach((lineText, idx) => {
        if (lineText.toLowerCase().includes(trimmed)) {
          const lineNum = idx + 1;
          const trimmedLine = lineText.trim();
          results.push({
            id: `code-line-${lineNum}`,
            type: 'code-line',
            title: `Line ${lineNum}: ${trimmedLine.slice(0, 60)}${trimmedLine.length > 60 ? '...' : ''}`,
            subtitle: `Active Code (${activeTab === 'analyzer' ? 'Analyzer Studio' : 'Workspace'})`,
            snippet: lineText,
            lineNumber: lineNum,
            targetId: `editor-line-${lineNum}`,
          });
        }
      });
    }

    // 2. Scan Analysis Findings / Smells
    if (analysis && analysis.smells) {
      analysis.smells.forEach((smell, idx) => {
        const matchTitle = smell.title.toLowerCase().includes(trimmed);
        const matchDesc = (smell.problem || smell.explanation || smell.recommendation || '').toLowerCase().includes(trimmed);
        const matchCategory = smell.category.toLowerCase().includes(trimmed);

        if (matchTitle || matchDesc || matchCategory) {
          results.push({
            id: `finding-${smell.id || idx}`,
            type: 'finding',
            title: `Finding: ${smell.title}`,
            subtitle: `${smell.severity.toUpperCase()} · ${smell.category}${smell.line ? ` · Line ${smell.line}` : ''}`,
            snippet: smell.problem || smell.explanation,
            lineNumber: smell.line,
            targetId: `smell-card-${smell.id || idx}`,
          });
        }
      });
    }

    // 3. Scan DOM Headings and Sections in current view (<main>)
    try {
      const mainEl = document.querySelector('main');
      if (mainEl) {
        // Find headings and distinct section markers
        const headings = mainEl.querySelectorAll<HTMLElement>(
          'h1, h2, h3, h4, [data-section], [id^="section-"], [id^="card-"], [id$="-view"], [id$="-container"], [role="tabpanel"], button[role="tab"]'
        );

        const seenTexts = new Set<string>();

        headings.forEach((headingEl, idx) => {
          const text = (headingEl.textContent || '').trim();
          if (text && text.toLowerCase().includes(trimmed) && !seenTexts.has(text.toLowerCase())) {
            seenTexts.add(text.toLowerCase());
            const id = headingEl.id || `section-match-${idx}`;
            results.push({
              id: `dom-section-${id}-${idx}`,
              type: 'section',
              title: text.slice(0, 70),
              subtitle: `Section in ${activeTab.toUpperCase()}`,
              element: headingEl,
              targetId: headingEl.id || undefined,
            });
          }
        });
      }
    } catch {
      // DOM scanning fallback
    }

    return results.slice(0, 30); // Cap at 30 results for crisp performance
  }, [query, code, analysis, activeTab]);

  // Jump to selected result
  const jumpToResult = useCallback(
    (result: ViewSearchResult) => {
      if (!result) return;

      // Clear previous highlight
      if (activeHighlightEl) {
        activeHighlightEl.classList.remove(
          'ring-2',
          'ring-teal-500',
          'ring-offset-2',
          'ring-offset-pulse-bg',
          'bg-teal-500/15',
          'transition-all',
          'duration-700'
        );
      }

      let targetEl: HTMLElement | null = result.element || null;

      // If we have a targetId, look it up in DOM
      if (!targetEl && result.targetId) {
        targetEl = document.getElementById(result.targetId);
      }

      // If it's a code line, search for the line element or editor line
      if (!targetEl && result.lineNumber) {
        // Try finding line in editor or DOM
        const lineSelector = `[data-line="${result.lineNumber}"], #line-${result.lineNumber}, .line-${result.lineNumber}`;
        targetEl = document.querySelector<HTMLElement>(lineSelector);

        // Also if analyzer finding, select the smell if applicable
        if (result.type === 'finding' && analysis?.smells) {
          const matchedSmell = analysis.smells.find(
            (s) => s.line === result.lineNumber || s.title.toLowerCase().includes(query.toLowerCase())
          );
          if (matchedSmell) {
            setSelectedSmell(matchedSmell);
          }
        }

        // If no specific line DOM element, scroll to editor container
        if (!targetEl) {
          targetEl = document.querySelector<HTMLElement>(
            '#code-editor-textarea, textarea, pre, .monaco-editor, #analyzer-code-panel'
          );
        }
      }

      // Fallback: search main for any element containing the snippet or title
      if (!targetEl && result.title) {
        const cleanTitle = result.title.replace(/^Line \d+:\s*/, '').slice(0, 30);
        const allElements = document.querySelectorAll<HTMLElement>('main h1, main h2, main h3, main h4, main p, main div');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i];
          if ((el.textContent || '').includes(cleanTitle)) {
            targetEl = el;
            break;
          }
        }
      }

      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Apply animated pulse highlight
        targetEl.classList.add(
          'ring-2',
          'ring-teal-500',
          'ring-offset-2',
          'ring-offset-pulse-bg',
          'bg-teal-500/15',
          'transition-all',
          'duration-700'
        );
        setActiveHighlightEl(targetEl);

        setTimeout(() => {
          if (targetEl) {
            targetEl.classList.remove(
              'ring-2',
              'ring-teal-500',
              'ring-offset-2',
              'ring-offset-pulse-bg',
              'bg-teal-500/15',
              'transition-all',
              'duration-700'
            );
          }
        }, 2500);
      }
    },
    [activeHighlightEl, analysis, query, setSelectedSmell]
  );

  const handleSelectResult = (index: number) => {
    if (index >= 0 && index < searchResults.length) {
      setCurrentMatchIndex(index);
      setSelectedIndex(index);
      jumpToResult(searchResults[index]);
    }
  };

  const handleNextMatch = () => {
    if (searchResults.length === 0) return;
    const next = (currentMatchIndex + 1) % searchResults.length;
    handleSelectResult(next);
  };

  const handlePrevMatch = () => {
    if (searchResults.length === 0) return;
    const prev = (currentMatchIndex - 1 + searchResults.length) % searchResults.length;
    handleSelectResult(prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, searchResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % Math.max(1, searchResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleSelectResult(selectedIndex);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <div ref={containerRef} className="relative flex items-center min-w-0">
      {/* Search Input Box */}
      <div className="relative flex items-center rounded-xl border border-pulse-subtle bg-pulse-surface hover:bg-pulse-elevated focus-within:border-teal-500/60 focus-within:ring-2 focus-within:ring-teal-500/20 transition shadow-xs w-36 sm:w-56 md:w-64 lg:w-72">
        <Search className="h-3.5 w-3.5 text-pulse-muted ml-2.5 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          id="navbar-view-search-input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
            setCurrentMatchIndex(0);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Jump to section or code..."
          className="w-full bg-transparent px-2 py-1 text-xs text-pulse-primary placeholder-pulse-muted focus:outline-hidden"
          aria-label="Search and jump to code blocks or sections in current view"
        />

        {/* Action badges / Next-Prev buttons */}
        {query.trim() ? (
          <div className="flex items-center space-x-1 pr-1.5 shrink-0">
            {searchResults.length > 0 && (
              <div className="flex items-center space-x-0.5">
                <span className="text-[10px] font-mono font-semibold text-teal-600 dark:text-teal-400 px-1 py-0.2 rounded bg-teal-500/10 hidden sm:inline">
                  {currentMatchIndex + 1}/{searchResults.length}
                </span>
                <button
                  type="button"
                  onClick={handlePrevMatch}
                  className="p-0.5 hover:bg-pulse-surface rounded text-pulse-muted hover:text-pulse-primary cursor-pointer transition"
                  title="Previous match (↑)"
                  aria-label="Previous match"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMatch}
                  className="p-0.5 hover:bg-pulse-surface rounded text-pulse-muted hover:text-pulse-primary cursor-pointer transition"
                  title="Next match (↓)"
                  aria-label="Next match"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="p-0.5 hover:bg-pulse-surface rounded text-pulse-muted hover:text-pulse-primary cursor-pointer transition"
              title="Clear search (Esc)"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <kbd className="hidden lg:inline-block mr-2 px-1.5 py-0.2 text-[9px] font-mono bg-pulse-elevated border border-pulse-subtle rounded text-pulse-muted">
            /
          </kbd>
        )}
      </div>

      {/* Dropdown Results Overlay */}
      {isOpen && query.trim() && (
        <div
          id="navbar-view-search-results"
          className="absolute top-full left-0 mt-1.5 w-72 sm:w-96 max-h-80 overflow-y-auto rounded-2xl border border-pulse-subtle bg-pulse-surface/98 backdrop-blur-xl shadow-2xl z-50 p-2 space-y-1 [scrollbar-width:thin]"
        >
          <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-pulse-secondary border-b border-pulse-subtle/50 pb-1.5">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="h-3 w-3 text-pulse-accent" />
              <span>Matches in {activeTab.toUpperCase()}</span>
            </span>
            <span className="font-mono text-[10px] text-pulse-muted">
              {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
            </span>
          </div>

          {searchResults.length === 0 ? (
            <div className="py-6 text-center text-xs text-pulse-muted">
              No matching sections or code found in current view.
            </div>
          ) : (
            <div className="divide-y divide-pulse-subtle/30">
              {searchResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      handleSelectResult(idx);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-2.5 py-2 rounded-xl transition flex items-start space-x-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-pulse-elevated border border-teal-500/40 text-pulse-primary'
                        : 'hover:bg-pulse-elevated/60 text-pulse-secondary'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {item.type === 'section' ? (
                        <Layers className="h-3.5 w-3.5 text-pulse-accent" />
                      ) : item.type === 'finding' ? (
                        <FileCode className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <Code2 className="h-3.5 w-3.5 text-teal-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-semibold font-mono truncate text-pulse-primary">
                          {item.title}
                        </span>
                        {item.lineNumber && (
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-pulse-elevated text-teal-600 dark:text-teal-400 shrink-0">
                            L{item.lineNumber}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-[10px] text-pulse-muted truncate">{item.subtitle}</p>
                      )}
                    </div>
                    {isSelected && (
                      <CornerDownLeft className="h-3 w-3 text-pulse-accent shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
