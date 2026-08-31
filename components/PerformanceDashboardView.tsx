/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownUp,
  CheckCircle2,
  Clock,
  Code2,
  Cpu,
  Download,
  Filter,
  Flame,
  Gauge,
  HardDrive,
  HeartPulse,
  Layers,
  Network,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Timer,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  telemetry,
  ComponentRenderMetric,
  ApiLatencyLog,
  SystemPerformanceSnapshot,
  BenchmarkResult,
} from '../services/telemetry';
import { useComponentPerformanceTracker } from '../hooks/usePerformanceTracker';
import { useApp } from '../context/AppContext';

export const PerformanceDashboardView: React.FC = () => {
  useComponentPerformanceTracker('Performance Telemetry Dashboard');
  const { setActiveTab } = useApp();

  // Telemetry reactive state
  const [snapshot, setSnapshot] = useState<SystemPerformanceSnapshot>(() => telemetry.getSystemSnapshot());
  const [componentMetrics, setComponentMetrics] = useState<ComponentRenderMetric[]>(() => telemetry.getComponentMetrics());
  const [apiLogs, setApiLogs] = useState<ApiLatencyLog[]>(() => telemetry.getApiLogs());
  const [lastBenchmark, setLastBenchmark] = useState<BenchmarkResult | null>(() => telemetry.getLastBenchmark());

  // UI state
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSlowOnly, setShowSlowOnly] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ApiLatencyLog | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(2000); // ms
  const [activeTab, setActiveSubTab] = useState<'components' | 'network' | 'benchmark'>('components');

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = telemetry.subscribe(() => {
      setSnapshot(telemetry.getSystemSnapshot());
      setComponentMetrics(telemetry.getComponentMetrics());
      setApiLogs(telemetry.getApiLogs());
      setLastBenchmark(telemetry.getLastBenchmark());
    });
    return unsubscribe;
  }, []);

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const timer = setInterval(() => {
      setSnapshot(telemetry.getSystemSnapshot());
      setComponentMetrics(telemetry.getComponentMetrics());
      setApiLogs(telemetry.getApiLogs());
    }, autoRefreshInterval);
    return () => clearInterval(timer);
  }, [autoRefreshInterval]);

  // Run synthetic stress benchmark
  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    try {
      const result = await telemetry.runSyntheticBenchmark();
      setLastBenchmark(result);
      setSnapshot(telemetry.getSystemSnapshot());
    } catch (err) {
      console.error('Benchmark failed:', err);
    } finally {
      setIsBenchmarking(false);
    }
  };

  // Export JSON dump
  const handleExportTelemetry = () => {
    const jsonString = telemetry.exportTelemetryJson();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devpulse-performance-telemetry-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear logs
  const handleClearLogs = () => {
    telemetry.clearLogs();
    setSnapshot(telemetry.getSystemSnapshot());
    setComponentMetrics([]);
    setApiLogs([]);
  };

  // Filtered API logs
  const filteredLogs = useMemo(() => {
    return apiLogs.filter((log) => {
      const matchesSearch =
        searchQuery === '' ||
        log.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.payloadSummary && log.payloadSummary.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'all' || log.category === selectedCategory;

      const matchesSlow = !showSlowOnly || log.durationMs > 40;

      return matchesSearch && matchesCategory && matchesSlow;
    });
  }, [apiLogs, searchQuery, selectedCategory, showSlowOnly]);

  const getStatusBadge = (status: 'optimal' | 'acceptable' | 'slow' | number | 'cached' | 'error' | 'ok') => {
    if (status === 'optimal' || status === 200 || status === 'ok' || status === 'cached') {
      return {
        label: status === 'cached' ? 'CACHED' : status === 'optimal' ? 'OPTIMAL' : 'HEALTHY',
        bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
      };
    }
    if (status === 'acceptable' || (typeof status === 'number' && status < 400)) {
      return {
        label: 'ACCEPTABLE',
        bg: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
      };
    }
    return {
      label: 'DEGRADED',
      bg: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
    };
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-pulse-accent">
              <Gauge className="h-5 w-5 animate-pulse" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-pulse-primary">
              Performance & Telemetry Observatory
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-pulse-secondary max-w-3xl">
            Live client render profiling, API latency tracing, AST throughput, and system frame timing to isolate regressions.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Stress Benchmark Button */}
          <button
            id="perf-run-benchmark-btn"
            onClick={handleRunBenchmark}
            disabled={isBenchmarking}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
            title="Execute synthetic benchmark across AST engine, virtual DOM, and API ping latency"
          >
            <Zap className={`h-4 w-4 ${isBenchmarking ? 'animate-spin' : ''}`} />
            <span>{isBenchmarking ? 'Running Stress Test...' : 'Run Diagnostics'}</span>
          </button>

          {/* Export JSON Dump */}
          <button
            id="perf-export-btn"
            onClick={handleExportTelemetry}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-pulse-surface hover:bg-pulse-elevated border border-pulse-subtle text-xs font-medium text-pulse-secondary hover:text-pulse-primary transition cursor-pointer"
            title="Export raw JSON telemetry profile"
          >
            <Download className="h-3.5 w-3.5 text-pulse-accent" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>

          {/* Clear Logs */}
          <button
            id="perf-clear-btn"
            onClick={handleClearLogs}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-pulse-surface hover:bg-pulse-elevated border border-pulse-subtle text-xs font-medium text-pulse-secondary hover:text-rose-400 transition cursor-pointer"
            title="Clear all recorded render and API latency logs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          {/* Auto Refresh Selector */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-pulse-subtle bg-pulse-surface text-xs text-pulse-secondary">
            <RefreshCw className={`h-3 w-3 text-pulse-accent ${autoRefreshInterval > 0 ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-pulse-primary font-mono text-xs focus:outline-none cursor-pointer"
              aria-label="Telemetry Auto-refresh rate"
            >
              <option value={1000} className="bg-pulse-surface text-pulse-primary">Live (1s)</option>
              <option value={2000} className="bg-pulse-surface text-pulse-primary">Normal (2s)</option>
              <option value={5000} className="bg-pulse-surface text-pulse-primary">Slow (5s)</option>
              <option value={0} className="bg-pulse-surface text-pulse-primary">Paused</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Telemetry Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Metric 1: Avg Render Time */}
        <div className="p-4 rounded-2xl bg-pulse-surface border border-pulse-subtle flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-pulse-muted font-medium uppercase tracking-wider">
              Avg Render Duration
            </span>
            <Timer className="h-4 w-4 text-teal-400" />
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold font-mono text-pulse-primary">
                {snapshot.avgRenderTimeMs}
              </span>
              <span className="text-xs font-mono text-pulse-muted">ms</span>
            </div>
            <p className="text-[10px] text-pulse-secondary mt-0.5">
              {snapshot.avgRenderTimeMs <= 16.6 ? '⚡ Sub-frame budget (<16ms)' : '⚠️ Overhead detected'}
            </p>
          </div>
        </div>

        {/* Metric 2: Network / API Latency */}
        <div className="p-4 rounded-2xl bg-pulse-surface border border-pulse-subtle flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-pulse-muted font-medium uppercase tracking-wider">
              Avg API Latency
            </span>
            <Network className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold font-mono text-pulse-primary">
                {snapshot.avgApiLatencyMs}
              </span>
              <span className="text-xs font-mono text-pulse-muted">ms</span>
            </div>
            <p className="text-[10px] text-pulse-secondary mt-0.5">
              P95 Latency: <span className="font-mono text-pulse-primary font-bold">{snapshot.p95ApiLatencyMs}ms</span>
            </p>
          </div>
        </div>

        {/* Metric 3: Frame Rate (FPS) */}
        <div className="p-4 rounded-2xl bg-pulse-surface border border-pulse-subtle flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-pulse-muted font-medium uppercase tracking-wider">
              Frame Rate (FPS)
            </span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className={`text-2xl font-extrabold font-mono ${snapshot.fps >= 55 ? 'text-emerald-400' : snapshot.fps >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                {snapshot.fps}
              </span>
              <span className="text-xs font-mono text-pulse-muted">FPS</span>
            </div>
            <p className="text-[10px] text-pulse-secondary mt-0.5">
              Budget: <span className="font-mono">{snapshot.frameTimeMs}ms</span>/frame
            </p>
          </div>
        </div>

        {/* Metric 4: Total Tracked Operations */}
        <div className="p-4 rounded-2xl bg-pulse-surface border border-pulse-subtle flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-pulse-muted font-medium uppercase tracking-wider">
              Tracked Events
            </span>
            <HardDrive className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold font-mono text-pulse-primary">
                {snapshot.totalRenders + snapshot.totalApiCalls}
              </span>
            </div>
            <p className="text-[10px] text-pulse-secondary mt-0.5">
              {snapshot.totalRenders} renders · {snapshot.totalApiCalls} API calls
            </p>
          </div>
        </div>

        {/* Metric 5: Cache Hit Rate */}
        <div className="p-4 rounded-2xl bg-pulse-surface border border-pulse-subtle flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-pulse-muted font-medium uppercase tracking-wider">
              Cache Hit Ratio
            </span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold font-mono text-pulse-primary">
                {snapshot.cacheHitRate}
              </span>
              <span className="text-xs font-mono text-pulse-muted">%</span>
            </div>
            <p className="text-[10px] text-pulse-secondary mt-0.5">
              LRU AI & DB memoization
            </p>
          </div>
        </div>
      </div>

      {/* Benchmark Summary Banner (if available) */}
      {lastBenchmark && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-transparent border border-teal-500/30 space-y-3 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-500/20 pb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-teal-400" />
              <h3 className="font-bold text-sm font-mono text-pulse-primary">
                Synthetic Stress Diagnostics Score:{' '}
                <span className="text-teal-400">{lastBenchmark.overallScore}/100</span>
              </h3>
            </div>
            <span className="text-xs text-pulse-muted font-mono">
              Tested {new Date(lastBenchmark.timestamp).toLocaleTimeString()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-pulse-surface/80 border border-pulse-subtle">
              <span className="text-pulse-muted block text-[10px]">AST Engine Throughput</span>
              <span className="text-sm font-bold text-pulse-primary">
                {lastBenchmark.astThroughputLocPerSec.toLocaleString()} LOC/sec
              </span>
              <span className="text-[10px] text-teal-400 block">Avg parse: {lastBenchmark.astParseDurationMs}ms</span>
            </div>

            <div className="p-2.5 rounded-xl bg-pulse-surface/80 border border-pulse-subtle">
              <span className="text-pulse-muted block text-[10px]">DOM Dispatch Overhead</span>
              <span className="text-sm font-bold text-pulse-primary">
                {lastBenchmark.componentRenderDurationMs}ms
              </span>
              <span className="text-[10px] text-teal-400 block">500 Virtual nodes</span>
            </div>

            <div className="p-2.5 rounded-xl bg-pulse-surface/80 border border-pulse-subtle">
              <span className="text-pulse-muted block text-[10px]">Endpoint Ping Latency</span>
              <span className="text-sm font-bold text-pulse-primary">
                {lastBenchmark.apiPingLatencyMs}ms
              </span>
              <span className="text-[10px] text-teal-400 block">Round-trip /api/health</span>
            </div>
          </div>

          {/* Recommendations / Insights */}
          <div className="space-y-1 pt-1">
            <span className="text-[11px] font-mono font-bold text-pulse-secondary uppercase tracking-wider">
              Diagnostic Assessment
            </span>
            <ul className="space-y-1 text-xs text-pulse-secondary">
              {lastBenchmark.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Sub-Tabs: Component Profiler vs API Tracing Stream */}
      <div className="flex items-center space-x-2 border-b border-pulse-subtle pb-3">
        <button
          onClick={() => setActiveSubTab('components')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'components'
              ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40 shadow-sm'
              : 'text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-surface'
          }`}
        >
          <Code2 className="h-4 w-4" />
          <span>Major Component Renders ({componentMetrics.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('network')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'network'
              ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40 shadow-sm'
              : 'text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-surface'
          }`}
        >
          <Network className="h-4 w-4" />
          <span>API & Engine Latency Traces ({apiLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: Component Rendering Matrix */}
      {activeTab === 'components' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-pulse-subtle bg-pulse-surface overflow-hidden shadow-sm">
            <div className="p-4 border-b border-pulse-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold font-mono text-pulse-primary">
                  Component Render Timing Breakdown
                </h2>
                <p className="text-xs text-pulse-muted">
                  Measures mount time, update cycles, and P95 latency across primary views.
                </p>
              </div>
              <span className="text-xs font-mono text-pulse-muted">
                Frame Budget Target: &lt;16.6ms (60fps)
              </span>
            </div>

            {componentMetrics.length === 0 ? (
              <div className="p-12 text-center text-pulse-muted space-y-2">
                <Activity className="h-8 w-8 text-teal-400 mx-auto animate-pulse" />
                <p className="text-sm">No component renders logged yet. Navigate through DevPulse views to record telemetry.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-pulse-elevated/60 text-pulse-muted font-mono border-b border-pulse-subtle">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Component</th>
                      <th className="px-4 py-3 font-semibold text-center">Render Count</th>
                      <th className="px-4 py-3 font-semibold">Last Render</th>
                      <th className="px-4 py-3 font-semibold">Avg Duration</th>
                      <th className="px-4 py-3 font-semibold">Peak (Max)</th>
                      <th className="px-4 py-3 font-semibold">P95 Duration</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Visual Budget</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pulse-subtle font-mono">
                    {componentMetrics.map((item) => {
                      const badge = getStatusBadge(item.status);
                      const percentBudget = Math.min(100, Math.round((item.avgDurationMs / 16.6) * 100));

                      return (
                        <tr key={item.componentName} className="hover:bg-pulse-elevated/40 transition">
                          <td className="px-4 py-3.5 font-medium text-pulse-primary font-sans">
                            <div className="flex items-center space-x-2">
                              <span className="h-2 w-2 rounded-full bg-pulse-accent" />
                              <span className="font-semibold">{item.componentName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center text-pulse-secondary">
                            {item.renderCount}
                          </td>
                          <td className="px-4 py-3.5 text-pulse-primary font-bold">
                            {item.lastRenderDurationMs}ms
                          </td>
                          <td className="px-4 py-3.5 text-pulse-secondary">
                            {item.avgDurationMs}ms
                          </td>
                          <td className="px-4 py-3.5 text-rose-400">
                            {item.peakDurationMs}ms
                          </td>
                          <td className="px-4 py-3.5 text-pulse-secondary">
                            {item.p95DurationMs}ms
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 min-w-[120px]">
                            <div className="w-full bg-pulse-elevated h-2 rounded-full overflow-hidden border border-pulse-subtle">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  percentBudget <= 100 ? 'bg-teal-400' : percentBudget <= 250 ? 'bg-amber-400' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, percentBudget)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-pulse-muted mt-0.5 block">
                              {percentBudget}% of 16ms
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: API & Network Latency Stream */}
      {activeTab === 'network' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-pulse-surface border border-pulse-subtle">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-pulse-muted" />
              <input
                type="text"
                placeholder="Filter by endpoint, query or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs text-pulse-primary placeholder-pulse-muted focus:outline-none focus:border-pulse-accent"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl bg-pulse-elevated border border-pulse-subtle text-xs text-pulse-primary font-mono focus:outline-none cursor-pointer"
                aria-label="Filter by Category"
              >
                <option value="all">All Categories</option>
                <option value="ai">AI Requests</option>
                <option value="cloudsql">Cloud SQL Database</option>
                <option value="ast_engine">AST Engine</option>
                <option value="workspace">Google Workspace</option>
                <option value="system">System / Health</option>
              </select>

              <button
                onClick={() => setShowSlowOnly(!showSlowOnly)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-mono transition cursor-pointer ${
                  showSlowOnly
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 font-bold'
                    : 'bg-pulse-elevated border-pulse-subtle text-pulse-secondary hover:text-pulse-primary'
                }`}
              >
                <Flame className="h-3.5 w-3.5" />
                <span>Slow Only (&gt;40ms)</span>
              </button>
            </div>
          </div>

          {/* Logs Table */}
          <div className="rounded-2xl border border-pulse-subtle bg-pulse-surface overflow-hidden shadow-sm">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-pulse-muted space-y-2">
                <Network className="h-8 w-8 text-pulse-accent mx-auto" />
                <p className="text-sm">No requests match the selected filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-pulse-surface font-mono text-pulse-muted border-b border-pulse-subtle z-10">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Time</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Method</th>
                      <th className="px-4 py-3 font-semibold">Endpoint / Operation</th>
                      <th className="px-4 py-3 font-semibold">Duration</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pulse-subtle font-mono">
                    {filteredLogs.map((log) => {
                      const badge = getStatusBadge(log.status);
                      const isSlow = log.durationMs > 50;

                      return (
                        <tr
                          key={log.id}
                          onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                          className="hover:bg-pulse-elevated/40 transition cursor-pointer"
                        >
                          <td className="px-4 py-3 text-pulse-muted text-[11px]">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-500/10 text-pulse-accent border border-teal-500/30 uppercase">
                              {log.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-pulse-primary">
                            {log.method}
                          </td>
                          <td className="px-4 py-3 font-mono text-pulse-primary max-w-[240px] truncate" title={log.endpoint}>
                            {log.endpoint}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${isSlow ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {log.durationMs}ms
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-pulse-secondary text-[11px] max-w-[220px] truncate" title={log.payloadSummary || log.details}>
                            {log.payloadSummary || log.details}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
