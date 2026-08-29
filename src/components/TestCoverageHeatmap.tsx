import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Eye,
  FileCode,
  Filter,
  Grid,
  HelpCircle,
  Info,
  Layers,
  LayoutGrid,
  PieChart,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  TestTube2,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FileRiskCoverageMetric, HeatmapOverviewStats, HeatmapRiskQuadrant } from '../types';

interface TestCoverageHeatmapProps {
  metrics: FileRiskCoverageMetric[];
  stats: HeatmapOverviewStats;
  onSelectFile?: (file: string) => void;
}

export const TestCoverageHeatmap: React.FC<TestCoverageHeatmapProps> = ({
  metrics,
  stats,
  onSelectFile,
}) => {
  const { sendAiRequest, setActiveTab } = useApp();

  const [selectedQuadrant, setSelectedQuadrant] = useState<HeatmapRiskQuadrant | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'RISK_DESC' | 'COV_ASC' | 'GAPS_DESC' | 'LOC_DESC'>('RISK_DESC');
  const [viewLayout, setViewLayout] = useState<'GRID' | 'QUADRANT'>('GRID');
  const [selectedFileDetail, setSelectedFileDetail] = useState<FileRiskCoverageMetric | null>(null);

  // Filter & sort files
  const filteredFiles = useMemo(() => {
    return metrics
      .filter((m) => {
        const matchesQuadrant = selectedQuadrant === 'ALL' || m.quadrant === selectedQuadrant;
        const matchesSearch =
          searchQuery.trim() === '' ||
          m.file.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.primaryRiskFactors.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesQuadrant && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'RISK_DESC') return b.riskScore - a.riskScore;
        if (sortBy === 'COV_ASC') return a.coveragePercentage - b.coveragePercentage;
        if (sortBy === 'GAPS_DESC') return b.testGapsCount - a.testGapsCount;
        if (sortBy === 'LOC_DESC') return b.linesOfCode - a.linesOfCode;
        return 0;
      });
  }, [metrics, selectedQuadrant, searchQuery, sortBy]);

  // Color mappings based on quadrant / risk & coverage
  const getQuadrantBadge = (quadrant: HeatmapRiskQuadrant) => {
    switch (quadrant) {
      case 'CRITICAL_DEFICIT':
        return {
          label: 'Critical Deficit',
          bg: 'bg-rose-500/15',
          border: 'border-rose-500/30',
          text: 'text-rose-400',
          indicator: 'bg-rose-500',
          description: 'High Risk (≥50) & Low Coverage (<50%)',
        };
      case 'VULNERABLE_SPOT':
        return {
          label: 'Vulnerable Spot',
          bg: 'bg-amber-500/15',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          indicator: 'bg-amber-500',
          description: 'High Risk (≥50) & Moderate Coverage (50-79%)',
        };
      case 'UNDER_TESTED':
        return {
          label: 'Under-Tested',
          bg: 'bg-yellow-500/15',
          border: 'border-yellow-500/30',
          text: 'text-yellow-400',
          indicator: 'bg-yellow-500',
          description: 'Moderate/Low Risk & Low Coverage (<50%)',
        };
      case 'WELL_HARDENED':
        return {
          label: 'Well-Hardened',
          bg: 'bg-emerald-500/15',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          indicator: 'bg-emerald-500',
          description: 'High Coverage (≥80%) / Low Operational Risk',
        };
    }
  };

  const getTileStyles = (file: FileRiskCoverageMetric) => {
    // Dynamic color gradient calculation
    if (file.quadrant === 'CRITICAL_DEFICIT') {
      return {
        cardBg: 'bg-gradient-to-br from-rose-950/40 via-rose-900/20 to-pulse-surface',
        border: 'border-rose-500/40 hover:border-rose-400',
        ring: 'hover:ring-1 hover:ring-rose-500/50',
        covText: 'text-rose-400',
        covBar: 'bg-rose-500',
        riskBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        glow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]',
      };
    }
    if (file.quadrant === 'VULNERABLE_SPOT') {
      return {
        cardBg: 'bg-gradient-to-br from-amber-950/30 via-amber-900/15 to-pulse-surface',
        border: 'border-amber-500/40 hover:border-amber-400',
        ring: 'hover:ring-1 hover:ring-amber-500/50',
        covText: 'text-amber-400',
        covBar: 'bg-amber-500',
        riskBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        glow: 'shadow-[0_0_12px_rgba(245,158,11,0.12)]',
      };
    }
    if (file.quadrant === 'UNDER_TESTED') {
      return {
        cardBg: 'bg-gradient-to-br from-yellow-950/20 via-yellow-900/10 to-pulse-surface',
        border: 'border-yellow-500/30 hover:border-yellow-400/60',
        ring: 'hover:ring-1 hover:ring-yellow-500/40',
        covText: 'text-yellow-400',
        covBar: 'bg-yellow-500',
        riskBadge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
        glow: '',
      };
    }
    return {
      cardBg: 'bg-gradient-to-br from-emerald-950/20 via-teal-950/10 to-pulse-surface',
      border: 'border-emerald-500/30 hover:border-emerald-400/60',
      ring: 'hover:ring-1 hover:ring-emerald-500/40',
      covText: 'text-emerald-400',
      covBar: 'bg-emerald-400',
      riskBadge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      glow: '',
    };
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Overview & Risk-Coverage Spectrum Stats */}
      <div className="p-4 rounded-2xl bg-pulse-surface border border-pulse-subtle space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <h4 className="text-xs font-mono uppercase font-bold text-pulse-muted flex items-center space-x-1.5">
                <LayoutGrid className="h-3.5 w-3.5 text-teal-400" />
                <span>Test Coverage vs. Risk Heatmap</span>
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/15 text-teal-400 border border-teal-500/20 font-bold">
                {stats.totalFiles} Modules Indexed
              </span>
            </div>
            <p className="text-xs text-pulse-secondary">
              Visually highlights vulnerable code paths with disproportionately low automated test coverage.
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center space-x-1 p-1 rounded-xl bg-pulse-elevated border border-pulse-subtle self-start sm:self-auto">
            <button
              onClick={() => setViewLayout('GRID')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                viewLayout === 'GRID'
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30 font-bold'
                  : 'text-pulse-muted hover:text-pulse-primary'
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              <span>Heatmap Grid</span>
            </button>
            <button
              onClick={() => setViewLayout('QUADRANT')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                viewLayout === 'QUADRANT'
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30 font-bold'
                  : 'text-pulse-muted hover:text-pulse-primary'
              }`}
            >
              <PieChart className="h-3.5 w-3.5" />
              <span>Risk Quadrants</span>
            </button>
          </div>
        </div>

        {/* Telemetry Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => setSelectedQuadrant(selectedQuadrant === 'CRITICAL_DEFICIT' ? 'ALL' : 'CRITICAL_DEFICIT')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              selectedQuadrant === 'CRITICAL_DEFICIT'
                ? 'bg-rose-500/20 border-rose-500/50 ring-1 ring-rose-500/50'
                : 'bg-pulse-elevated/80 border-rose-500/30 hover:bg-rose-500/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-rose-400 font-bold">Critical Deficit</span>
              <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <div className="text-xl font-bold text-rose-300 font-mono mt-1">
              {stats.criticalDeficitCount}
            </div>
            <p className="text-[10px] text-pulse-muted truncate mt-0.5">
              High Risk &lt;50% Cov
            </p>
          </button>

          <button
            onClick={() => setSelectedQuadrant(selectedQuadrant === 'VULNERABLE_SPOT' ? 'ALL' : 'VULNERABLE_SPOT')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              selectedQuadrant === 'VULNERABLE_SPOT'
                ? 'bg-amber-500/20 border-amber-500/50 ring-1 ring-amber-500/50'
                : 'bg-pulse-elevated/80 border-amber-500/30 hover:bg-amber-500/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">Vulnerable Spot</span>
              <div className="h-2 w-2 rounded-full bg-amber-500" />
            </div>
            <div className="text-xl font-bold text-amber-300 font-mono mt-1">
              {stats.vulnerableSpotCount}
            </div>
            <p className="text-[10px] text-pulse-muted truncate mt-0.5">
              High Risk 50-79% Cov
            </p>
          </button>

          <button
            onClick={() => setSelectedQuadrant(selectedQuadrant === 'UNDER_TESTED' ? 'ALL' : 'UNDER_TESTED')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              selectedQuadrant === 'UNDER_TESTED'
                ? 'bg-yellow-500/20 border-yellow-500/50 ring-1 ring-yellow-500/50'
                : 'bg-pulse-elevated/80 border-yellow-500/30 hover:bg-yellow-500/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-yellow-400 font-bold">Under-Tested</span>
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
            </div>
            <div className="text-xl font-bold text-yellow-300 font-mono mt-1">
              {stats.underTestedCount}
            </div>
            <p className="text-[10px] text-pulse-muted truncate mt-0.5">
              Low Risk &lt;50% Cov
            </p>
          </button>

          <button
            onClick={() => setSelectedQuadrant(selectedQuadrant === 'WELL_HARDENED' ? 'ALL' : 'WELL_HARDENED')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              selectedQuadrant === 'WELL_HARDENED'
                ? 'bg-emerald-500/20 border-emerald-500/50 ring-1 ring-emerald-500/50'
                : 'bg-pulse-elevated/80 border-emerald-500/30 hover:bg-emerald-500/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Well-Hardened</span>
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-xl font-bold text-emerald-300 font-mono mt-1">
              {stats.wellHardenedCount}
            </div>
            <p className="text-[10px] text-pulse-muted truncate mt-0.5">
              Robust (≥80% Cov)
            </p>
          </button>
        </div>
      </div>

      {/* 2. Heatmap Controls: Quadrant Filters, Sort, Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Quadrant Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'CRITICAL_DEFICIT', 'VULNERABLE_SPOT', 'UNDER_TESTED', 'WELL_HARDENED'] as const).map((q) => {
            const isSelected = selectedQuadrant === q;
            const label =
              q === 'ALL'
                ? `All (${metrics.length})`
                : q === 'CRITICAL_DEFICIT'
                ? `🔴 Critical (${stats.criticalDeficitCount})`
                : q === 'VULNERABLE_SPOT'
                ? `🟠 Vulnerable (${stats.vulnerableSpotCount})`
                : q === 'UNDER_TESTED'
                ? `🟡 Under-Tested (${stats.underTestedCount})`
                : `🟢 Hardened (${stats.wellHardenedCount})`;

            return (
              <button
                key={q}
                onClick={() => setSelectedQuadrant(q)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40 font-bold'
                    : 'bg-pulse-elevated text-pulse-muted hover:text-pulse-primary border border-pulse-subtle'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Search & Sort */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-pulse-muted" />
            <input
              type="text"
              placeholder="Filter by file or factor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-pulse-elevated border border-pulse-subtle rounded-xl pl-8 pr-2.5 py-1 text-xs text-pulse-primary placeholder-pulse-muted focus:outline-none focus:border-teal-500/40 w-full sm:w-48 font-mono min-h-[36px]"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-pulse-elevated border border-pulse-subtle rounded-xl px-2.5 py-1 text-xs text-pulse-primary focus:outline-none font-mono cursor-pointer min-h-[36px] flex-1 sm:flex-initial"
          >
            <option value="RISK_DESC">Highest Risk</option>
            <option value="COV_ASC">Lowest Coverage</option>
            <option value="GAPS_DESC">Most Test Gaps</option>
            <option value="LOC_DESC">Largest (LOC)</option>
          </select>
        </div>
      </div>

      {/* 3. Heatmap Display Area */}
      {viewLayout === 'GRID' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredFiles.map((file) => {
            const styles = getTileStyles(file);
            const quadrantInfo = getQuadrantBadge(file.quadrant);

            return (
              <div
                key={file.file}
                onClick={() => setSelectedFileDetail(file)}
                className={`p-4 rounded-2xl border transition duration-200 cursor-pointer flex flex-col justify-between space-y-3.5 ${styles.cardBg} ${styles.border} ${styles.ring} ${styles.glow}`}
              >
                {/* Tile Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-xs text-pulse-primary font-mono truncate" title={file.file}>
                        {file.shortName}
                      </span>
                      {file.isCurrentFile && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-teal-500/20 text-teal-400 border border-teal-500/30 shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-pulse-muted truncate" title={file.file}>
                      {file.file}
                    </p>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border shrink-0 ${styles.riskBadge}`}>
                    Risk {file.riskScore}
                  </span>
                </div>

                {/* Coverage and Risk Metrics Strip */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-pulse-muted text-[11px]">Line Coverage</span>
                    <span className={`font-bold ${styles.covText}`}>{file.coveragePercentage}%</span>
                  </div>
                  <div className="w-full bg-pulse-bg/80 h-2 rounded-full overflow-hidden border border-pulse-subtle/50">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${styles.covBar}`}
                      style={{ width: `${file.coveragePercentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-pulse-muted pt-0.5">
                    <span>Branch: {file.branchCoverage}%</span>
                    <span>Funcs: {file.functionCoverage}%</span>
                    <span>{file.linesOfCode} LOC</span>
                  </div>
                </div>

                {/* Primary Risk Factors Preview */}
                <div className="pt-2 border-t border-pulse-subtle/50 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${quadrantInfo.bg} ${quadrantInfo.text} border ${quadrantInfo.border}`}>
                      {quadrantInfo.label}
                    </span>
                    {file.testGapsCount > 0 && (
                      <span className="text-amber-400 font-bold">
                        {file.testGapsCount} Test Gap{file.testGapsCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-pulse-secondary line-clamp-1">
                    {file.primaryRiskFactors[0]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 2x2 Risk vs Coverage Matrix View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quadrant 1: Critical Deficit */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                <h5 className="text-xs font-mono uppercase font-bold text-rose-300">
                  Critical Deficit (High Risk, Low Coverage)
                </h5>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400">
                {metrics.filter((m) => m.quadrant === 'CRITICAL_DEFICIT').length} files
              </span>
            </div>

            <div className="space-y-2">
              {metrics
                .filter((m) => m.quadrant === 'CRITICAL_DEFICIT')
                .map((file) => (
                  <div
                    key={file.file}
                    onClick={() => setSelectedFileDetail(file)}
                    className="p-2.5 rounded-xl bg-pulse-surface border border-rose-500/30 hover:border-rose-400 transition cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-pulse-primary font-mono truncate">{file.shortName}</div>
                      <div className="text-[10px] text-pulse-muted truncate">{file.primaryRiskFactors[0]}</div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0 font-mono">
                      <span className="text-rose-400 font-bold">{file.coveragePercentage}% Cov</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-300 font-bold">
                        R{file.riskScore}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Quadrant 2: Vulnerable Spot */}
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h5 className="text-xs font-mono uppercase font-bold text-amber-300">
                  Vulnerable Spot (High Risk, Mod Coverage)
                </h5>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">
                {metrics.filter((m) => m.quadrant === 'VULNERABLE_SPOT').length} files
              </span>
            </div>

            <div className="space-y-2">
              {metrics
                .filter((m) => m.quadrant === 'VULNERABLE_SPOT')
                .map((file) => (
                  <div
                    key={file.file}
                    onClick={() => setSelectedFileDetail(file)}
                    className="p-2.5 rounded-xl bg-pulse-surface border border-amber-500/30 hover:border-amber-400 transition cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-pulse-primary font-mono truncate">{file.shortName}</div>
                      <div className="text-[10px] text-pulse-muted truncate">{file.primaryRiskFactors[0]}</div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0 font-mono">
                      <span className="text-amber-400 font-bold">{file.coveragePercentage}% Cov</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 font-bold">
                        R{file.riskScore}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Quadrant 3: Under-Tested */}
          <div className="p-4 rounded-2xl bg-yellow-950/20 border border-yellow-500/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-yellow-500/20">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <h5 className="text-xs font-mono uppercase font-bold text-yellow-300">
                  Under-Tested (Low Risk, Low Coverage)
                </h5>
              </div>
              <span className="text-xs font-mono font-bold text-yellow-400">
                {metrics.filter((m) => m.quadrant === 'UNDER_TESTED').length} files
              </span>
            </div>

            <div className="space-y-2">
              {metrics
                .filter((m) => m.quadrant === 'UNDER_TESTED')
                .map((file) => (
                  <div
                    key={file.file}
                    onClick={() => setSelectedFileDetail(file)}
                    className="p-2.5 rounded-xl bg-pulse-surface border border-yellow-500/30 hover:border-yellow-400 transition cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-pulse-primary font-mono truncate">{file.shortName}</div>
                      <div className="text-[10px] text-pulse-muted truncate">{file.primaryRiskFactors[0]}</div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0 font-mono">
                      <span className="text-yellow-400 font-bold">{file.coveragePercentage}% Cov</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-yellow-500/20 text-yellow-300 font-bold">
                        R{file.riskScore}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Quadrant 4: Well-Hardened */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <h5 className="text-xs font-mono uppercase font-bold text-emerald-300">
                  Well-Hardened (High Coverage, Low Risk)
                </h5>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {metrics.filter((m) => m.quadrant === 'WELL_HARDENED').length} files
              </span>
            </div>

            <div className="space-y-2">
              {metrics
                .filter((m) => m.quadrant === 'WELL_HARDENED')
                .map((file) => (
                  <div
                    key={file.file}
                    onClick={() => setSelectedFileDetail(file)}
                    className="p-2.5 rounded-xl bg-pulse-surface border border-emerald-500/30 hover:border-emerald-400 transition cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-pulse-primary font-mono truncate">{file.shortName}</div>
                      <div className="text-[10px] text-pulse-muted truncate">{file.primaryRiskFactors[0]}</div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0 font-mono">
                      <span className="text-emerald-400 font-bold">{file.coveragePercentage}% Cov</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold">
                        R{file.riskScore}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Descriptive Color Spectrum & Risk/Coverage Matrix Legend */}
      <div className="p-4 rounded-2xl bg-pulse-surface/80 border border-pulse-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-teal-400" />
            <h5 className="text-xs font-mono uppercase font-bold text-pulse-primary">
              Heatmap Spectrum & Quadrant Legend
            </h5>
          </div>
          <span className="text-[11px] font-mono text-pulse-muted">
            Risk Formula: CVEs + Code Smells + Cyclomatic Complexity
          </span>
        </div>

        {/* 4 Quadrant Cards with Detailed Risk and Coverage Boundaries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Critical Deficit */}
          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-950/20 space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/30 shrink-0 animate-pulse" />
              <span className="text-xs font-mono font-bold text-rose-300">Critical Deficit</span>
            </div>
            <div className="text-[11px] font-mono text-rose-400 font-semibold">
              Risk ≥ 50 &bull; Coverage &lt; 50%
            </div>
            <p className="text-[11px] text-pulse-secondary leading-relaxed">
              Highest urgency. Severe business logic or vulnerabilities with minimal test automation safeguards.
            </p>
          </div>

          {/* Vulnerable Spot */}
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/30 shrink-0" />
              <span className="text-xs font-mono font-bold text-amber-300">Vulnerable Spot</span>
            </div>
            <div className="text-[11px] font-mono text-amber-400 font-semibold">
              Risk ≥ 50 &bull; Coverage 50%–79%
            </div>
            <p className="text-[11px] text-pulse-secondary leading-relaxed">
              Moderate coverage exists, but high complexity or open security findings leave key paths unprotected.
            </p>
          </div>

          {/* Under-Tested */}
          <div className="p-3 rounded-xl border border-yellow-500/30 bg-yellow-950/20 space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500 ring-2 ring-yellow-500/30 shrink-0" />
              <span className="text-xs font-mono font-bold text-yellow-300">Under-Tested</span>
            </div>
            <div className="text-[11px] font-mono text-yellow-400 font-semibold">
              Risk &lt; 50 &bull; Coverage &lt; 50%
            </div>
            <p className="text-[11px] text-pulse-secondary leading-relaxed">
              Low immediate risk or simple utility code, but lacks automated coverage against future regressions.
            </p>
          </div>

          {/* Well-Hardened */}
          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30 shrink-0" />
              <span className="text-xs font-mono font-bold text-emerald-300">Well-Hardened</span>
            </div>
            <div className="text-[11px] font-mono text-emerald-400 font-semibold">
              Risk &lt; 50 &bull; Coverage ≥ 80%
            </div>
            <p className="text-[11px] text-pulse-secondary leading-relaxed">
              Resilient baseline. Comprehensive automated unit and branch tests cover major execution paths.
            </p>
          </div>
        </div>

        {/* Coverage Progress Bar Scale Reference */}
        <div className="pt-2 border-t border-pulse-subtle/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-pulse-muted">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="text-pulse-secondary font-semibold">Coverage Thresholds:</span>
            <span className="flex items-center space-x-1.5">
              <span className="inline-block w-3 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>0%–49% (Low)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="inline-block w-3 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>50%–79% (Moderate)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="inline-block w-3 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>80%–100% (High)</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-pulse-secondary font-semibold">Risk Score Scale:</span>
            <span className="text-emerald-400 font-bold">0–24 (Low)</span>
            <span>&bull;</span>
            <span className="text-yellow-400 font-bold">25–49 (Med)</span>
            <span>&bull;</span>
            <span className="text-amber-400 font-bold">50–74 (High)</span>
            <span>&bull;</span>
            <span className="text-rose-400 font-bold">75–100 (Critical)</span>
          </div>
        </div>
      </div>

      {/* 5. Deep-Dive File Detail Modal */}
      {selectedFileDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedFileDetail(null)}
        >
          <div
            className="w-full max-w-2xl bg-pulse-surface border border-pulse-subtle rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-pulse-subtle bg-pulse-bg/60 flex items-center justify-between gap-2">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2 sm:p-2.5 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400 shrink-0">
                  <TestTube2 className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-sm sm:text-base font-bold text-pulse-primary font-mono truncate max-w-[200px] sm:max-w-none">
                      {selectedFileDetail.shortName}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        getQuadrantBadge(selectedFileDetail.quadrant).bg
                      } ${getQuadrantBadge(selectedFileDetail.quadrant).text} border ${
                        getQuadrantBadge(selectedFileDetail.quadrant).border
                      }`}
                    >
                      {getQuadrantBadge(selectedFileDetail.quadrant).label}
                    </span>
                  </div>
                  <p className="text-xs text-pulse-secondary font-mono mt-0.5 truncate max-w-[240px] sm:max-w-none">
                    {selectedFileDetail.file}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedFileDetail(null)}
                className="p-2 rounded-xl text-pulse-muted hover:text-pulse-primary hover:bg-pulse-elevated transition cursor-pointer shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Coverage Telemetry Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="p-3 rounded-xl bg-pulse-elevated border border-pulse-subtle space-y-1">
                  <span className="text-[10px] font-mono uppercase text-pulse-muted">Line Coverage</span>
                  <div className="text-lg font-bold text-pulse-primary font-mono">
                    {selectedFileDetail.coveragePercentage}%
                  </div>
                  <div className="w-full bg-pulse-subtle h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-400 h-full rounded-full"
                      style={{ width: `${selectedFileDetail.coveragePercentage}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-pulse-elevated border border-pulse-subtle space-y-1">
                  <span className="text-[10px] font-mono uppercase text-pulse-muted">Branch Coverage</span>
                  <div className="text-lg font-bold text-pulse-primary font-mono">
                    {selectedFileDetail.branchCoverage}%
                  </div>
                  <div className="w-full bg-pulse-subtle h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-400 h-full rounded-full"
                      style={{ width: `${selectedFileDetail.branchCoverage}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-pulse-elevated border border-pulse-subtle space-y-1">
                  <span className="text-[10px] font-mono uppercase text-pulse-muted">Risk Score</span>
                  <div className="text-lg font-bold text-rose-400 font-mono">
                    {selectedFileDetail.riskScore}/100
                  </div>
                  <div className="w-full bg-pulse-subtle h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${selectedFileDetail.riskScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Primary Risk Factors */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase font-bold text-pulse-muted">
                  Identified Risk Drivers
                </h4>
                <div className="space-y-1.5">
                  {selectedFileDetail.primaryRiskFactors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs text-pulse-primary flex items-center space-x-2"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Untested Functions List */}
              {selectedFileDetail.untestedFunctions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase font-bold text-pulse-muted">
                    Untested Functions & Symbols ({selectedFileDetail.untestedFunctions.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFileDetail.untestedFunctions.map((fn, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono bg-pulse-elevated border border-pulse-subtle text-pulse-accent font-semibold"
                      >
                        {fn}()
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:px-6 border-t border-pulse-subtle bg-pulse-bg/80 flex items-center justify-between">
              <button
                onClick={() => setSelectedFileDetail(null)}
                className="px-4 py-1.5 rounded-xl border border-pulse-subtle text-pulse-secondary hover:text-pulse-primary text-xs transition cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={() => {
                  sendAiRequest(
                    'tests',
                    `Generate comprehensive unit and regression tests for high-risk file: ${selectedFileDetail.file}\nUntested symbols: ${selectedFileDetail.untestedFunctions.join(', ')}\nRisk drivers: ${selectedFileDetail.primaryRiskFactors.join('; ')}`
                  );
                  setSelectedFileDetail(null);
                  setActiveTab('pulse-ai');
                }}
                className="px-4 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-400 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Generate Test Suite</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
