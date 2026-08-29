import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  Code2,
  Trash2,
  Play,
  Calendar,
  Sparkles,
  Share2,
  Download,
  Check,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  fetchAnalysisHistoryFromCloudSql,
  deleteAnalysisRecordFromCloudSql,
  clearAllAnalysisHistoryFromCloudSql,
  createShareLinkForAnalysis,
  revokeShareLinkForAnalysis,
} from '../services/db-sync';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ isOpen, onClose }) => {
  const { user, setCode, setLanguage, setActiveTab, runAnalysis } = useApp();
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeShareId, setActiveShareId] = useState<number | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, user]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      if (user) {
        const records = await fetchAnalysisHistoryFromCloudSql(50);
        setHistoryList(records);
      } else {
        const local = localStorage.getItem('devpulse_local_history');
        if (local) {
          setHistoryList(JSON.parse(local));
        } else {
          setHistoryList([]);
        }
      }
    } catch (err) {
      console.warn('Failed to load history from Cloud SQL:', err);
      const local = localStorage.getItem('devpulse_local_history');
      if (local) setHistoryList(JSON.parse(local));
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (record: any) => {
    const codeToLoad = record.codeSnippet || (record.fullResult ? record.fullResult.code : '');
    if (codeToLoad) {
      setCode(codeToLoad);
    }
    if (record.language) {
      setLanguage(record.language);
    }
    onClose();
    setActiveTab('analyzer');
    setTimeout(() => {
      runAnalysis(codeToLoad, record.language);
    }, 100);
  };

  const handleDelete = async (recordId: number | string) => {
    try {
      if (user && typeof recordId === 'number') {
        await deleteAnalysisRecordFromCloudSql(recordId);
      }
      const updated = historyList.filter((item) => item.id !== recordId);
      setHistoryList(updated);
      if (!user) {
        localStorage.setItem('devpulse_local_history', JSON.stringify(updated));
      }
    } catch (err) {
      console.warn('Failed to delete history record:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      if (user) {
        await clearAllAnalysisHistoryFromCloudSql();
      }
      setHistoryList([]);
      localStorage.removeItem('devpulse_local_history');
      setShowConfirmClear(false);
    } catch (err) {
      console.warn('Failed to clear history:', err);
    }
  };

  const handleShare = async (id: number) => {
    try {
      setActiveShareId(id);
      const res = await createShareLinkForAnalysis(id);
      const fullUrl = `${window.location.origin}${res.shareUrl}`;
      setShareUrl(fullUrl);
      navigator.clipboard.writeText(fullUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
      loadHistory();
    } catch (err) {
      console.warn('Failed to generate share link:', err);
    }
  };

  const handleRevokeShare = async (id: number) => {
    try {
      await revokeShareLinkForAnalysis(id);
      setShareUrl(null);
      setActiveShareId(null);
      loadHistory();
    } catch (err) {
      console.warn('Failed to revoke share link:', err);
    }
  };

  const exportCsv = () => {
    if (!historyList.length) return;
    const headers = ['ID', 'Project / File', 'Language', 'Health Score', 'Maintainability', 'Complexity', 'LOC', 'Critical', 'High', 'Timestamp'];
    const rows = historyList.map((r) => [
      r.id,
      `"${r.projectOrFileName || r.fileName || ''}"`,
      r.language,
      r.healthScore,
      r.maintainabilityScore || '',
      r.cyclomaticComplexity || '',
      r.loc || '',
      r.criticalFindings || 0,
      r.highFindings || 0,
      new Date(r.timestamp).toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `devpulse_analysis_history_${Date.now()}.csv`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div
      id="devpulse-history-drawer"
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg h-full bg-pulse-surface border-l border-pulse-subtle flex flex-col shadow-2xl animate-slideLeft">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-pulse-subtle bg-pulse-surface/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-pulse-primary">Analysis History & Audits</h3>
              <p className="text-[11px] text-pulse-muted">
                {user ? 'Cloud SQL PostgreSQL Synchronized' : 'Local Workspace Session'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {historyList.length > 0 && (
              <button
                onClick={exportCsv}
                className="p-1.5 text-pulse-muted hover:text-pulse-primary rounded-xl hover:bg-pulse-elevated transition cursor-pointer"
                title="Export History to CSV"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-pulse-muted hover:text-pulse-primary rounded-xl hover:bg-pulse-elevated transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        {historyList.length > 0 && (
          <div className="px-6 py-2.5 bg-pulse-bg/80 border-b border-pulse-subtle/60 flex items-center justify-between text-xs">
            <span className="font-mono text-pulse-muted">
              {historyList.length} Recorded {historyList.length === 1 ? 'Scan' : 'Scans'}
            </span>
            <div className="flex items-center space-x-3">
              {showConfirmClear ? (
                <div className="flex items-center space-x-2 animate-fadeIn">
                  <span className="text-[11px] text-rose-500 font-semibold">Delete all?</span>
                  <button
                    onClick={handleClearAll}
                    className="px-2 py-0.5 rounded bg-rose-500 text-white text-[10px] font-bold hover:bg-rose-600 transition cursor-pointer"
                  >
                    Yes, Purge
                  </button>
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="px-2 py-0.5 rounded bg-pulse-elevated text-pulse-muted text-[10px] hover:text-pulse-primary transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmClear(true)}
                  className="text-pulse-muted hover:text-rose-500 transition text-[11px] flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Share notification banner */}
        {copiedShare && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs flex items-center space-x-2 animate-fadeIn">
            <Check className="h-4 w-4 shrink-0 text-teal-500" />
            <span>Public report share link copied to clipboard!</span>
          </div>
        )}

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-pulse-muted font-mono flex items-center justify-center space-x-2">
              <div className="h-4 w-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading saved audits from Cloud SQL...</span>
            </div>
          ) : historyList.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Code2 className="h-10 w-10 text-pulse-muted/40 mx-auto" />
              <p className="text-xs text-pulse-muted font-mono">No historical scans recorded yet.</p>
              <p className="text-[11px] text-pulse-muted max-w-xs mx-auto">
                Run analyses in the Analyzer Studio to build your verified code intelligence history.
              </p>
            </div>
          ) : (
            historyList.map((item) => {
              const healthScore = item.healthScore ?? 80;
              const healthColor =
                healthScore >= 85
                  ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
                  : healthScore >= 70
                  ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
                  : 'text-rose-500 bg-rose-500/10 border-rose-500/30';

              const hasVulnerabilities = (item.criticalFindings || 0) > 0 || (item.highFindings || 0) > 0;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-pulse-bg border border-pulse-subtle hover:border-teal-500/40 transition group space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                        {item.language}
                      </span>
                      <span className="text-xs font-bold text-pulse-primary truncate">
                        {item.projectOrFileName || item.fileName || `${item.language}_source`}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${healthColor}`}>
                        {healthScore}/100
                      </span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:bg-rose-500/10 rounded transition cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono text-pulse-muted bg-pulse-surface/60 p-2 rounded-xl border border-pulse-subtle/50">
                    <div>LOC: <span className="text-pulse-primary font-semibold">{item.loc || 0}</span></div>
                    <div>Complexity: <span className="text-pulse-primary font-semibold">{item.cyclomaticComplexity || 0}</span></div>
                    <div>Critical: <span className={`${(item.criticalFindings || 0) > 0 ? 'text-rose-500 font-bold' : 'text-pulse-primary'}`}>{item.criticalFindings || 0}</span></div>
                    <div>High: <span className={`${(item.highFindings || 0) > 0 ? 'text-amber-500 font-bold' : 'text-pulse-primary'}`}>{item.highFindings || 0}</span></div>
                  </div>

                  {hasVulnerabilities && (
                    <div className="flex items-center space-x-1.5 text-[10px] text-rose-500 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span>Security findings flagged during this scan</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] text-pulse-muted font-mono flex items-center space-x-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span>
                        {new Date(item.timestamp).toLocaleDateString()}{' '}
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>

                    <div className="flex items-center space-x-2">
                      {user && typeof item.id === 'number' && (
                        <button
                          type="button"
                          onClick={() => handleShare(item.id)}
                          className="flex items-center space-x-1 px-2.5 py-1 bg-pulse-elevated hover:bg-pulse-subtle text-pulse-primary border border-pulse-subtle rounded-xl text-xs font-semibold transition cursor-pointer min-h-[32px]"
                          title="Generate Shareable Link"
                        >
                          <Share2 className="h-3 w-3" />
                          <span>Share</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRestore(item)}
                        className="flex items-center space-x-1 px-3 py-1 bg-teal-500/15 hover:bg-teal-500/25 text-teal-600 dark:text-teal-400 border border-teal-500/30 rounded-xl text-xs font-semibold transition cursor-pointer min-h-[32px]"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Reopen</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
