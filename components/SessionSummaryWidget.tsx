import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Cpu,
  Eye,
  Flame,
  Info,
  Layers,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import { sessionTracker, SessionDataset } from '../services/sessionTracker';
import { useApp } from '../context/AppContext';

export const SessionSummaryWidget: React.FC = () => {
  const { userProfile, user } = useApp();
  const [dataset, setDataset] = useState<SessionDataset>(() => sessionTracker.getSessionDataset());
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'performance' | 'anomalies'>('overview');

  // Live timer tick for active session duration
  useEffect(() => {
    const unsubscribe = sessionTracker.subscribe(() => {
      setDataset(sessionTracker.getSessionDataset());
    });

    const interval = setInterval(() => {
      setDataset(sessionTracker.getSessionDataset());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Format seconds to human readable string (e.g., "14m 32s" or "1h 05m")
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hours}h ${remainMins.toString().padStart(2, '0')}m`;
  };

  const {
    totalDurationSeconds,
    totalSmellsIdentified,
    totalSessionsCount,
    uniqueUsersCount,
    historicalAvgDurationSeconds,
    activityFrequency,
    performanceMetrics,
    anomalies,
    events,
  } = dataset;

  const totalActions =
    activityFrequency.analysisRuns +
    activityFrequency.aiQueries +
    activityFrequency.fixesApplied +
    activityFrequency.featureClicks +
    activityFrequency.errorsEncountered;

  return (
    <div
      id="session-summary-widget"
      className="p-5 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm space-y-4 transition-all duration-300"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pulse-subtle pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400">
            <Clock className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-pulse-primary">Active Session Intelligence</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                Live Telemetry
              </span>
            </div>
            <p className="text-xs text-pulse-muted">
              Continuous runtime tracking, smell discovery, and anomaly detection based strictly on session data
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1.5 rounded-xl bg-pulse-bg hover:bg-pulse-elevated border border-pulse-subtle text-xs font-semibold text-pulse-secondary hover:text-pulse-primary transition flex items-center space-x-1.5 cursor-pointer"
        >
          <span>{isExpanded ? 'Collapse Summary' : 'View Statistical Summary'}</span>
          <ArrowUpRight className={`h-3.5 w-3.5 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Primary 2 Key Callouts (Required: Time spent + Smells identified) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Time Spent in App */}
        <div className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-pulse-muted mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Session Time</span>
            <Clock className="h-4 w-4 text-teal-500" />
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-black font-mono text-pulse-primary tracking-tight">
              {formatDuration(totalDurationSeconds)}
            </div>
            <p className="text-[11px] text-pulse-muted">Active current session elapsed</p>
          </div>
        </div>

        {/* Metric 2: Number of Code Smells Identified */}
        <div className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-pulse-muted mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Smells Identified</span>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-black font-mono text-amber-500 tracking-tight">
              {totalSmellsIdentified}
            </div>
            <p className="text-[11px] text-pulse-muted">
              {totalSmellsIdentified === 0 ? 'No smells found so far' : 'Diagnostic findings in session'}
            </p>
          </div>
        </div>

        {/* Metric 3: Round-Trip Latency */}
        <div className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-pulse-muted mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Avg Latency</span>
            <Zap className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-black font-mono text-pulse-primary tracking-tight">
              {performanceMetrics.avgRoundTripLatencyMs}ms
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
              AST: {performanceMetrics.avgAstParseTimeMs}ms · AI: {performanceMetrics.avgAiLatencyMs}ms
            </p>
          </div>
        </div>

        {/* Metric 4: Anomalies Detected */}
        <div className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-pulse-muted mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Anomalies</span>
            <AlertOctagon className={`h-4 w-4 ${anomalies.length > 0 ? 'text-rose-500' : 'text-teal-500'}`} />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className={`text-2xl font-black font-mono tracking-tight ${anomalies.length > 0 ? 'text-rose-500' : 'text-pulse-primary'}`}>
                {anomalies.length}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                anomalies.length === 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}>
                {anomalies.length === 0 ? 'Nominal' : 'Action Required'}
              </span>
            </div>
            <p className="text-[11px] text-pulse-muted">
              {anomalies.length === 0 ? 'No execution spikes' : `${anomalies.length} anomalies detected`}
            </p>
          </div>
        </div>
      </div>

      {/* Expanded Structured Statistical Summary */}
      {isExpanded && (
        <div className="pt-3 border-t border-pulse-subtle space-y-4 animate-fadeIn">
          {/* Navigation Sub-Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            {[
              { id: 'overview', label: 'Overview Metrics', icon: Users },
              { id: 'activity', label: 'Activity Breakdown', icon: BarChart3 },
              { id: 'performance', label: 'Performance & Latency', icon: Cpu },
              { id: 'anomalies', label: `Key Anomalies (${anomalies.length})`, icon: AlertOctagon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isCurrent = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition whitespace-nowrap cursor-pointer ${
                    isCurrent
                      ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30'
                      : 'bg-pulse-bg text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Section 1: Overview Metrics */}
          {activeTab === 'overview' && (
            <div className="space-y-3 p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pulse-primary">Session Overview Dataset</span>
                <span className="text-[11px] font-mono text-pulse-muted">
                  Strictly local runtime dataset
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle">
                  <span className="text-[10px] font-mono text-pulse-muted uppercase block">Total Sessions</span>
                  <span className="text-lg font-black font-mono text-pulse-primary">{totalSessionsCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle">
                  <span className="text-[10px] font-mono text-pulse-muted uppercase block">Unique Users</span>
                  <span className="text-lg font-black font-mono text-pulse-primary">{uniqueUsersCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle">
                  <span className="text-[10px] font-mono text-pulse-muted uppercase block">Avg Session Duration</span>
                  <span className="text-lg font-black font-mono text-pulse-primary">
                    {formatDuration(historicalAvgDurationSeconds)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle">
                  <span className="text-[10px] font-mono text-pulse-muted uppercase block">Active User</span>
                  <span className="text-xs font-bold font-mono text-pulse-accent truncate block mt-1">
                    {user?.displayName || userProfile?.displayName || 'Active Developer'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Activity Breakdown */}
          {activeTab === 'activity' && (
            <div className="space-y-3 p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pulse-primary">Activity Action Frequency</span>
                <span className="text-[11px] font-mono text-pulse-muted">
                  {totalActions} Total Recorded Actions
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                {[
                  {
                    label: 'AST Analysis Runs',
                    count: activityFrequency.analysisRuns,
                    color: 'bg-teal-500',
                    textColor: 'text-teal-500',
                  },
                  {
                    label: 'Pulse AI Inquiries & Explanations',
                    count: activityFrequency.aiQueries,
                    color: 'bg-cyan-500',
                    textColor: 'text-cyan-500',
                  },
                  {
                    label: 'Remediations & Patches Applied',
                    count: activityFrequency.fixesApplied,
                    color: 'bg-emerald-500',
                    textColor: 'text-emerald-500',
                  },
                  {
                    label: 'Feature & Preset Interactions',
                    count: activityFrequency.featureClicks,
                    color: 'bg-blue-500',
                    textColor: 'text-blue-500',
                  },
                  {
                    label: 'Runtime Errors / Parsing Warnings',
                    count: activityFrequency.errorsEncountered,
                    color: 'bg-rose-500',
                    textColor: 'text-rose-500',
                  },
                ].map((item) => {
                  const percentage = totalActions > 0 ? Math.round((item.count / totalActions) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-pulse-secondary">{item.label}</span>
                        <div className="flex items-center space-x-2 font-mono">
                          <span className={`font-bold ${item.textColor}`}>{item.count}</span>
                          <span className="text-pulse-muted text-[11px]">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-pulse-surface rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.max(percentage, item.count > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Performance & Latency */}
          {activeTab === 'performance' && (
            <div className="space-y-3 p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pulse-primary">Engine Round-Trip Latency & Throughput</span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  {performanceMetrics.totalMeasurements} samples recorded
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle space-y-1">
                  <span className="text-[10px] font-mono text-pulse-muted uppercase">Avg AST Parse Time</span>
                  <div className="text-base font-black font-mono text-teal-600 dark:text-teal-400">
                    {performanceMetrics.avgAstParseTimeMs} ms
                  </div>
                  <p className="text-[10px] text-pulse-muted">Lexical AST traversal time</p>
                </div>

                <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle space-y-1">
                  <span className="text-[10px] font-mono text-pulse-muted uppercase">Avg AI Query Latency</span>
                  <div className="text-base font-black font-mono text-cyan-600 dark:text-cyan-400">
                    {performanceMetrics.avgAiLatencyMs} ms
                  </div>
                  <p className="text-[10px] text-pulse-muted">Gemini & RAG context round-trip</p>
                </div>

                <div className="p-3 rounded-xl bg-pulse-surface border border-pulse-subtle space-y-1">
                  <span className="text-[10px] font-mono text-pulse-muted uppercase">Latency Range</span>
                  <div className="text-base font-black font-mono text-pulse-primary">
                    {performanceMetrics.minLatencyMs}ms – {performanceMetrics.maxLatencyMs}ms
                  </div>
                  <p className="text-[10px] text-pulse-muted">Min / Max observed bounds</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Key Anomalies */}
          {activeTab === 'anomalies' && (
            <div className="space-y-3 p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pulse-primary">Detected Session Anomalies</span>
                <span className="text-[11px] font-mono text-pulse-muted">
                  Strict dataset anomaly evaluation
                </span>
              </div>

              {anomalies.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>
                    No abrupt logouts, drop-offs, latency spikes, or complexity bursts detected in this session dataset.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  {anomalies.map((anom) => (
                    <div
                      key={anom.id}
                      className="p-3 rounded-xl bg-pulse-surface border border-rose-500/30 flex items-start space-x-3 text-xs"
                    >
                      <AlertOctagon className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-600 dark:text-rose-400 capitalize">
                            {anom.type.replace('_', ' ')}
                          </span>
                          {anom.metricValue && (
                            <span className="font-mono text-[10px] bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded">
                              {anom.metricValue}
                            </span>
                          )}
                        </div>
                        <p className="text-pulse-secondary text-[11px]">{anom.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Event Stream preview */}
          {events.length > 0 && (
            <div className="p-3 rounded-xl bg-pulse-bg border border-pulse-subtle space-y-1.5">
              <span className="text-[11px] font-bold font-mono text-pulse-muted uppercase">Recent Event Stream</span>
              <div className="space-y-1 max-h-24 overflow-y-auto font-mono text-[11px] text-pulse-secondary">
                {events.slice(0, 4).map((evt) => (
                  <div key={evt.id} className="flex items-center justify-between py-0.5 border-b border-pulse-subtle/50 last:border-0">
                    <span className="truncate pr-2">› {evt.label}</span>
                    <span className="text-pulse-muted shrink-0 text-[10px]">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
