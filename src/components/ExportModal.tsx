import React, { useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  FileCode,
  FileSpreadsheet,
  FileText,
  HeartPulse,
  Layers,
  Network,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportAnalysisAsJSON, exportAnalysisAsPDF, ExportOptions } from '../utils/exportReport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { analysis, code, fileName, aiMessages } = useApp();

  const [format, setFormat] = useState<'pdf' | 'json'>('pdf');
  const [options, setOptions] = useState<ExportOptions>({
    includeMetrics: true,
    includeSmells: true,
    includePulseMap: true,
    includeFunctions: true,
    includeImports: true,
    includeAiSummary: true,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  if (!isOpen) return null;

  // Extract latest AI assistant response for summary inclusion
  const latestAiResponse = [...aiMessages]
    .reverse()
    .find((m) => m.role === 'assistant' && !m.isError && m.id !== 'welcome')?.content;

  const handleExport = () => {
    if (!analysis) return;
    setIsExporting(true);

    setTimeout(() => {
      try {
        if (format === 'json') {
          exportAnalysisAsJSON(analysis, code, fileName, latestAiResponse);
        } else {
          exportAnalysisAsPDF(analysis, code, fileName, options, latestAiResponse);
        }
      } catch (err) {
        console.error('Export failed:', err);
      } finally {
        setIsExporting(false);
        onClose();
      }
    }, 250);
  };

  const handleCopyJson = () => {
    if (!analysis) return;
    const payload = {
      tool: 'DevPulse Intelligence Engine',
      fileName,
      language: analysis.language,
      healthScore: analysis.metrics.healthScore,
      metrics: analysis.metrics,
      smells: analysis.smells,
      pulseMap: analysis.pulseMap,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-pulse-surface border border-pulse-subtle p-6 shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-pulse-subtle pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 border border-teal-500/30 text-pulse-accent">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-pulse-primary">Export Analysis & Pulse Map</h2>
              <p className="text-xs text-pulse-secondary">
                Share findings, health metrics, and topology data with your team.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-pulse-muted hover:text-pulse-primary hover:bg-pulse-elevated transition"
            aria-label="Close Export Dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Format Selector Pills */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-semibold text-pulse-primary uppercase tracking-wider">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormat('pdf')}
              className={`p-3 rounded-2xl border text-left flex items-start space-x-3 transition ${
                format === 'pdf'
                  ? 'bg-teal-500/15 border-teal-500 text-teal-700 dark:text-teal-200 shadow-sm'
                  : 'bg-pulse-elevated border-pulse-subtle text-pulse-secondary hover:text-pulse-primary'
              }`}
            >
              <FileText className={`h-5 w-5 mt-0.5 ${format === 'pdf' ? 'text-pulse-accent' : 'text-pulse-muted'}`} />
              <div>
                <span className="text-xs font-bold block">PDF Document</span>
                <span className="text-[10px] text-pulse-muted">
                  Executive multi-page report with scorecards & findings.
                </span>
              </div>
            </button>

            <button
              onClick={() => setFormat('json')}
              className={`p-3 rounded-2xl border text-left flex items-start space-x-3 transition ${
                format === 'json'
                  ? 'bg-teal-500/15 border-teal-500 text-teal-700 dark:text-teal-200 shadow-sm'
                  : 'bg-pulse-elevated border-pulse-subtle text-pulse-secondary hover:text-pulse-primary'
              }`}
            >
              <FileCode className={`h-5 w-5 mt-0.5 ${format === 'json' ? 'text-pulse-accent' : 'text-pulse-muted'}`} />
              <div>
                <span className="text-xs font-bold block">JSON Data</span>
                <span className="text-[10px] text-pulse-muted">
                  Machine-readable AST metrics, smells & pulse topology.
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Export Content Checklist (For PDF and JSON) */}
        {format === 'pdf' && (
          <div className="space-y-2.5 bg-pulse-bg p-3.5 rounded-2xl border border-pulse-subtle">
            <span className="text-[11px] font-mono font-semibold text-pulse-muted uppercase">
              Sections Included in PDF
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center space-x-2 text-pulse-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeMetrics}
                  onChange={(e) => setOptions({ ...options, includeMetrics: e.target.checked })}
                  className="rounded text-teal-500 focus:ring-teal-400"
                />
                <span>Metrics & Scores</span>
              </label>

              <label className="flex items-center space-x-2 text-pulse-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeSmells}
                  onChange={(e) => setOptions({ ...options, includeSmells: e.target.checked })}
                  className="rounded text-teal-500 focus:ring-teal-400"
                />
                <span>Code Smells & Fixes</span>
              </label>

              <label className="flex items-center space-x-2 text-pulse-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includePulseMap}
                  onChange={(e) => setOptions({ ...options, includePulseMap: e.target.checked })}
                  className="rounded text-teal-500 focus:ring-teal-400"
                />
                <span>Pulse Map Topology</span>
              </label>

              <label className="flex items-center space-x-2 text-pulse-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeAiSummary}
                  onChange={(e) => setOptions({ ...options, includeAiSummary: e.target.checked })}
                  className="rounded text-teal-500 focus:ring-teal-400"
                />
                <span>AI Recommendations</span>
              </label>
            </div>
          </div>
        )}

        {/* Summary Info */}
        <div className="p-3 rounded-2xl bg-pulse-elevated border border-pulse-subtle flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2">
            <HeartPulse className="h-4 w-4 text-pulse-accent" />
            <span className="text-pulse-primary">{fileName}</span>
          </div>
          <span className="text-pulse-secondary">
            Score: <strong className="text-pulse-accent">{analysis?.metrics.healthScore ?? 100}/100</strong>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          {format === 'json' ? (
            <button
              onClick={handleCopyJson}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-xs text-pulse-primary transition font-medium"
            >
              {copiedJson ? <Check className="h-3.5 w-3.5 text-teal-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedJson ? 'Copied to Clipboard' : 'Copy JSON'}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-pulse-muted hover:text-pulse-primary transition"
            >
              Cancel
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting || !analysis}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-md shadow-teal-500/20 disabled:opacity-50"
            >
              <Download className={`h-4 w-4 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Generating...' : `Export as ${format.toUpperCase()}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
