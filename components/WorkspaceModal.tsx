import React, { useState } from 'react';
import {
  X,
  Share2,
  FileText,
  Calendar,
  CheckSquare,
  Mail,
  Video,
  GraduationCap,
  Sparkles,
  Check,
  ExternalLink,
  UploadCloud,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  requestGoogleAccessToken,
  uploadReportToDrive,
  createGoogleDoc,
  createGoogleTasksForSmells,
  scheduleCodeReviewEvent,
  createGmailAuditDraft,
  getStoredGoogleToken,
} from '../services/workspace';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({ isOpen, onClose }) => {
  const { analysis, code, language } = useApp();

  const [activeIntegration, setActiveIntegration] = useState<'drive' | 'docs' | 'tasks' | 'calendar' | 'gmail'>('drive');
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState<{ title: string; url?: string; count?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [driveFileName, setDriveFileName] = useState(`${language}_devpulse_analysis.md`);
  const [docTitle, setDocTitle] = useState(`DevPulse Code Intelligence Report - ${new Date().toLocaleDateString()}`);
  const [reviewMeetingTitle, setReviewMeetingTitle] = useState(`DevPulse Architecture Review (${language.toUpperCase()})`);
  const [gmailRecipient, setGmailRecipient] = useState('');

  const handleConnectAndExecute = async () => {
    setLoading(true);
    setError(null);
    setSuccessResult(null);

    try {
      // 1. Acquire Google OAuth Access Token via client-side OAuth flow
      let token = getStoredGoogleToken();
      if (!token) {
        token = await requestGoogleAccessToken();
      }

      if (activeIntegration === 'drive') {
        const reportContent = generateMarkdownReport();
        const res = await uploadReportToDrive(token, driveFileName, reportContent);
        setSuccessResult({
          title: `Uploaded "${res.name}" to Google Drive successfully!`,
          url: res.webViewLink,
        });
      } else if (activeIntegration === 'docs') {
        const reportContent = generatePlainReport();
        const res = await createGoogleDoc(token, docTitle, reportContent);
        setSuccessResult({
          title: `Created Google Doc "${res.title}" successfully!`,
          url: res.url,
        });
      } else if (activeIntegration === 'tasks') {
        const smells = (analysis?.smells || []).map((s) => ({
          title: s.title,
          line: s.line,
          description: s.problem || s.explanation || '',
          severity: s.severity,
        }));
        const res = await createGoogleTasksForSmells(token, smells, `${language.toUpperCase()} Analysis`);
        setSuccessResult({
          title: `Created ${res.count} actionable code smell tasks in Google Tasks!`,
          count: res.count,
        });
      } else if (activeIntegration === 'calendar') {
        const desc = `DevPulse Code Architecture Review\n\nHealth Score: ${analysis?.metrics.healthScore}/100\nCyclomatic Complexity: ${analysis?.metrics.cyclomaticComplexity}\nActive Smells: ${analysis?.smells.length || 0}`;
        const res = await scheduleCodeReviewEvent(token, reviewMeetingTitle, desc);
        setSuccessResult({
          title: `Scheduled Review in Google Calendar!`,
          url: res.htmlLink,
        });
      } else if (activeIntegration === 'gmail') {
        const body = `DevPulse Code Intelligence Audit\n\nLanguage: ${language}\nHealth Score: ${analysis?.metrics.healthScore}/100\nMaintainability: ${analysis?.metrics.maintainabilityScore}/100\nComplexity: ${analysis?.metrics.cyclomaticComplexity}\n\nTop Smells:\n${analysis?.smells.map((s) => `• Line ${s.line}: ${s.title} (${s.severity})`).join('\n') || 'None'}`;
        await createGmailAuditDraft(token, `DevPulse Code Audit: ${language.toUpperCase()}`, body);
        setSuccessResult({
          title: `Created audit email draft in Gmail!`,
          url: 'https://mail.google.com/mail/u/0/#drafts',
        });
      }
    } catch (err: any) {
      console.error('Workspace integration error:', err);
      setError(err?.message || 'Google Workspace action encountered an error. Please verify authorization.');
    } finally {
      setLoading(false);
    }
  };

  const generateMarkdownReport = () => {
    return `# DevPulse Code Intelligence Report
Generated: ${new Date().toLocaleString()}
Language: ${language}
Health Score: ${analysis?.metrics.healthScore ?? 100}/100
Maintainability Index: ${analysis?.metrics.maintainabilityScore ?? 100}/100
Cyclomatic Complexity: ${analysis?.metrics.cyclomaticComplexity ?? 1}
Lines of Code: ${analysis?.metrics.loc ?? 0}

## Detected Diagnostic Code Smells (${analysis?.smells.length ?? 0})
${analysis?.smells.map((s, idx) => `### ${idx + 1}. [${s.severity.toUpperCase()}] Line ${s.line}: ${s.title}\n- Category: ${s.category}\n- Problem: ${s.problem}\n- Recommendation: ${s.recommendation}\n`).join('\n') || 'No issues detected.'}

## Analyzed Code
\`\`\`${language}
${code}
\`\`\`
`;
  };

  const generatePlainReport = () => {
    return `DevPulse Code Intelligence Report
Generated: ${new Date().toLocaleString()}
Language: ${language}
Health Score: ${analysis?.metrics.healthScore ?? 100}/100
Maintainability Index: ${analysis?.metrics.maintainabilityScore ?? 100}/100
Cyclomatic Complexity: ${analysis?.metrics.cyclomaticComplexity ?? 1}
LOC: ${analysis?.metrics.loc ?? 0}

Diagnostic Findings:
${analysis?.smells.map((s, idx) => `${idx + 1}. [${s.severity.toUpperCase()}] Line ${s.line}: ${s.title} - ${s.problem}`).join('\n\n') || 'Clean - No smells'}
`;
  };

  const integrations = [
    { id: 'drive', label: 'Google Drive', icon: UploadCloud, desc: 'Save report & code to Drive' },
    { id: 'docs', label: 'Google Docs', icon: FileText, desc: 'Export structured audit doc' },
    { id: 'tasks', label: 'Google Tasks', icon: CheckSquare, desc: 'Sync code smells as todo items' },
    { id: 'calendar', label: 'Google Calendar', icon: Calendar, desc: 'Schedule code review event' },
    { id: 'gmail', label: 'Gmail', icon: Mail, desc: 'Draft code audit email' },
  ] as const;

  if (!isOpen) return null;

  return (
    <div
      id="devpulse-workspace-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-pulse-surface border border-pulse-subtle rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-pulse-accent">
              <Share2 className="h-5 w-5 text-teal-500 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-pulse-primary">Google Workspace Integration Hub</h2>
              <p className="text-xs text-pulse-muted">
                Connect Drive, Docs, Tasks, Calendar, and Gmail directly with your verified codebase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-pulse-muted hover:text-pulse-primary rounded-xl hover:bg-pulse-elevated transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Integration Selection Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {integrations.map((item) => {
            const Icon = item.icon;
            const isActive = activeIntegration === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveIntegration(item.id);
                  setSuccessResult(null);
                  setError(null);
                }}
                className={`p-3 rounded-2xl border text-left transition flex flex-col items-center sm:items-start space-y-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-teal-500/15 border-teal-500/50 text-teal-600 dark:text-teal-300 font-bold shadow-sm'
                    : 'bg-pulse-bg border-pulse-subtle text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-pulse-accent' : 'text-pulse-muted'}`} />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Notification Status */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successResult && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 space-y-2">
            <div className="flex items-center space-x-2 font-semibold">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>{successResult.title}</span>
            </div>
            {successResult.url && (
              <a
                href={successResult.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-pulse-accent hover:underline font-bold text-xs pt-1"
              >
                <span>Open in Google Workspace</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {/* Action Configuration Body */}
        <div className="space-y-4 bg-pulse-bg p-5 rounded-2xl border border-pulse-subtle">
          {activeIntegration === 'drive' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-pulse-primary block">
                  File Name in Google Drive
                </label>
                <input
                  type="text"
                  value={driveFileName}
                  onChange={(e) => setDriveFileName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-pulse-surface border border-pulse-subtle rounded-xl text-xs text-pulse-primary focus:outline-none focus:border-pulse-accent"
                />
              </div>
              <p className="text-[11px] text-pulse-muted">
                Uploads full AST diagnostics, complexity metrics, and source code directly to your Google Drive.
              </p>
            </div>
          )}

          {activeIntegration === 'docs' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-pulse-primary block">
                  Google Doc Title
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-pulse-surface border border-pulse-subtle rounded-xl text-xs text-pulse-primary focus:outline-none focus:border-pulse-accent"
                />
              </div>
              <p className="text-[11px] text-pulse-muted">
                Creates an editable Google Doc containing the complete DevPulse Architecture and Code Health report.
              </p>
            </div>
          )}

          {activeIntegration === 'tasks' && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-pulse-primary">
                Export Code Smells to Google Tasks
              </div>
              <p className="text-xs text-pulse-secondary">
                DevPulse will create {analysis?.smells.length || 0} tasks with due dates and line numbers in your Google Tasks list.
              </p>
            </div>
          )}

          {activeIntegration === 'calendar' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-pulse-primary block">
                  Event Title
                </label>
                <input
                  type="text"
                  value={reviewMeetingTitle}
                  onChange={(e) => setReviewMeetingTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-pulse-surface border border-pulse-subtle rounded-xl text-xs text-pulse-primary focus:outline-none focus:border-pulse-accent"
                />
              </div>
              <p className="text-[11px] text-pulse-muted">
                Schedules a 45-minute code review calendar event with Google Meet video link auto-attached.
              </p>
            </div>
          )}

          {activeIntegration === 'gmail' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-pulse-primary block">
                  Recipient Email (Optional)
                </label>
                <input
                  type="email"
                  value={gmailRecipient}
                  onChange={(e) => setGmailRecipient(e.target.value)}
                  placeholder="tech-lead@company.com"
                  className="w-full px-3.5 py-2 bg-pulse-surface border border-pulse-subtle rounded-xl text-xs text-pulse-primary focus:outline-none focus:border-pulse-accent"
                />
              </div>
              <p className="text-[11px] text-pulse-muted">
                Generates a clean email draft in your Gmail account ready for one-click review distribution.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-pulse-muted font-mono">
            OAuth 2.0 Secure Client Flow
          </span>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-pulse-secondary hover:text-pulse-primary rounded-xl border border-pulse-subtle hover:bg-pulse-elevated transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleConnectAndExecute}
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing & Syncing...</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Sync to Google Workspace</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
