import React, { useState } from 'react';
import {
  Boxes,
  CheckCircle2,
  ExternalLink,
  FolderGit2,
  Info,
  Layers,
  Package,
  Search,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useComponentPerformanceTracker } from '../hooks/usePerformanceTracker';

export const DependencyPulseView: React.FC = () => {
  useComponentPerformanceTracker('Dependency Graph');
  const { analysis, setActiveTab, sendAiRequest } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'external' | 'internal'>('all');

  if (!analysis) {
    return (
      <div className="p-12 text-center text-pulse-muted">
        <Layers className="h-8 w-8 text-pulse-accent mx-auto mb-2 animate-pulse" />
        <p>No active analysis. Load code in Analyzer Studio.</p>
      </div>
    );
  }

  const { metrics } = analysis;
  const imports = metrics.imports;

  const filteredImports = imports.filter((imp) => {
    const matchesSearch = imp.module.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      filterType === 'all' ||
      (filterType === 'external' && imp.isExternal) ||
      (filterType === 'internal' && !imp.isExternal);
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <Layers className="h-6 w-6 text-pulse-accent" />
            <h1 className="text-xl font-bold text-pulse-primary">Dependency Pulse</h1>
          </div>
          <p className="text-xs text-pulse-secondary">
            Inspect import footprint, differentiate third-party libraries from standard libraries, and audit package security.
          </p>
        </div>

        <button
          onClick={() => {
            sendAiRequest(
              'problems',
              'Audit all imported modules and dependencies in this codebase for security risks, deprecations, or bloated imports.'
            );
            setActiveTab('pulse-ai');
          }}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-md shadow-teal-500/20"
        >
          <Sparkles className="h-4 w-4" />
          <span>Audit Dependencies with AI</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-3xl bg-pulse-surface border border-pulse-subtle flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-mono text-pulse-muted">TOTAL IMPORTS</span>
            <div className="text-2xl font-bold font-mono text-pulse-primary mt-1">
              {imports.length}
            </div>
          </div>
          <div className="p-2.5 rounded-2xl bg-pulse-elevated text-pulse-accent">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-pulse-surface border border-pulse-subtle flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-mono text-pulse-muted">EXTERNAL PACKAGES</span>
            <div className="text-2xl font-bold font-mono text-teal-600 dark:text-teal-400 mt-1">
              {metrics.externalDependenciesCount}
            </div>
          </div>
          <div className="p-2.5 rounded-2xl bg-pulse-elevated text-teal-600 dark:text-teal-400">
            <ExternalLink className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-pulse-surface border border-pulse-subtle flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-mono text-pulse-muted">INTERNAL / STDLIB</span>
            <div className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1">
              {metrics.internalDependenciesCount}
            </div>
          </div>
          <div className="p-2.5 rounded-2xl bg-pulse-elevated text-cyan-600 dark:text-cyan-400">
            <FolderGit2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-pulse-muted" />
          <input
            type="text"
            placeholder="Search dependencies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-pulse-elevated border border-pulse-subtle rounded-xl pl-8 pr-3 py-1.5 text-xs text-pulse-primary placeholder-pulse-muted focus:outline-none focus:border-pulse-strong"
          />
        </div>

        <div className="flex items-center space-x-1.5 bg-pulse-elevated p-1 rounded-xl border border-pulse-subtle">
          {(['all', 'external', 'internal'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg text-xs font-mono capitalize transition ${
                filterType === type
                  ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/40 font-semibold'
                  : 'text-pulse-muted hover:text-pulse-primary'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Dependencies Table */}
      <div className="rounded-3xl bg-pulse-surface border border-pulse-subtle overflow-hidden shadow-sm">
        {filteredImports.length === 0 ? (
          <div className="p-12 text-center text-pulse-muted">
            <CheckCircle2 className="h-8 w-8 text-pulse-accent mx-auto mb-2 opacity-80" />
            <p className="text-xs font-semibold text-pulse-primary">No Matching Dependencies Found</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-pulse-bg text-pulse-muted border-b border-pulse-subtle">
              <tr>
                <th className="py-3 px-4">MODULE / PACKAGE</th>
                <th className="py-3 px-4">TYPE</th>
                <th className="py-3 px-4">IMPORTED SYMBOLS</th>
                <th className="py-3 px-4 text-right">LINE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pulse-subtle">
              {filteredImports.map((imp, idx) => (
                <tr key={idx} className="hover:bg-pulse-elevated/70 transition">
                  <td className="py-3 px-4 text-pulse-primary font-semibold">{imp.module}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        imp.isExternal
                          ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30'
                          : 'bg-pulse-elevated text-pulse-secondary border border-pulse-subtle'
                      }`}
                    >
                      {imp.isExternal ? 'Third-Party' : 'Standard Library'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-pulse-secondary">
                    {imp.names.length > 0 ? imp.names.join(', ') : 'Default / Wildcard'}
                  </td>
                  <td className="py-3 px-4 text-right text-pulse-muted">Line {imp.line}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
