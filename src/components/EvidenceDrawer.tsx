/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Code2,
  FileCode,
  Fingerprint,
  Info,
  Layers,
  Lightbulb,
  Shield,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { ActionFinding, CodeSmell } from '../types';

interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  finding: CodeSmell | ActionFinding | any | null;
  fileName: string;
  language: string;
  onFixWithAi: (finding: any) => void;
  onNavigateToAnalyzer: (line: number) => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  isOpen,
  onClose,
  finding,
  fileName,
  language,
  onFixWithAi,
  onNavigateToAnalyzer,
}) => {
  // ESC key dismiss listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !finding) return null;

  const categoryStr = typeof finding.category === 'string' ? finding.category : 'General';
  const severityStr = String(finding.severity || finding.priority || 'warning').toLowerCase();
  const isSecurity = categoryStr.toLowerCase().includes('security') || severityStr === 'critical';

  const rawConfidence = typeof finding.confidence === 'number' ? finding.confidence : 95;
  const confidence = rawConfidence <= 1 && rawConfidence > 0 ? Math.round(rawConfidence * 100) : Math.round(rawConfidence);
  const detectedBy = finding.detectedBy || (isSecurity ? 'Universal Static Security Engine (AST)' : `${categoryStr} Analysis Heuristics`);

  const findingTitle = finding.title || 'Code Smell / Issue Detected';
  const findingLine = finding.line ?? 1;
  const rawProblemDesc = finding.problem || finding.description || finding.rootCause || finding.root_cause || finding.explanation;
  const problemDesc = rawProblemDesc && rawProblemDesc.trim().length > 0 ? rawProblemDesc : null;
  const whyItMatters = finding.whyItMatters || finding.impact || finding.why_it_matters || null;
  const remediationText = finding.solution || finding.recommendation || finding.suggestedFix || finding.suggested_fix || null;
  const findingId = finding.id || 'RULE-AUTO';

  const drawerContent = (
    <div
      id="devpulse-evidence-drawer"
      className="fixed inset-0 z-[70] flex items-center justify-end select-none animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop click interceptor within the same portal */}
      <div
        className="fixed inset-0 z-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative z-10 w-full max-w-2xl h-full bg-pulse-surface border-l border-pulse-subtle shadow-2xl flex flex-col animate-slideLeft overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-pulse-subtle bg-pulse-elevated flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className={`p-2 sm:p-2.5 rounded-2xl border shrink-0 ${
                severityStr === 'critical'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                  : severityStr === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  : 'bg-teal-500/10 border-teal-500/30 text-teal-400'
              }`}
            >
              {isSecurity ? <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6" /> : <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    severityStr === 'critical'
                      ? 'bg-rose-500/20 text-rose-500'
                      : severityStr === 'warning'
                      ? 'bg-amber-500/20 text-amber-500'
                      : 'bg-teal-500/20 text-teal-400'
                  }`}
                >
                  {severityStr}
                </span>
                <span className="text-xs font-mono text-pulse-muted">Line {findingLine}</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-pulse-primary font-sans mt-1 truncate">
                {findingTitle}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-pulse-muted hover:text-pulse-primary hover:bg-pulse-surface border border-transparent hover:border-pulse-subtle transition cursor-pointer shrink-0"
            aria-label="Close Evidence Drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 [scrollbar-width:thin]">
          {/* Credibility & Confidence Pill Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 min-w-0">
              <Fingerprint className="h-4 w-4 text-teal-400 shrink-0" />
              <span className="text-xs font-mono text-pulse-secondary">Detected by:</span>
              <span className="text-xs font-mono font-bold text-pulse-primary truncate">{detectedBy}</span>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs font-mono text-pulse-secondary">Confidence:</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                {confidence}% verified
              </span>
            </div>
          </div>

          {/* Finding Problem Details */}
          {problemDesc ? (
            <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-2">
              <h3 className="text-xs font-mono uppercase font-bold text-pulse-muted tracking-wider">
                Problem Analysis
              </h3>
              <p className="text-xs text-pulse-primary leading-relaxed">
                {problemDesc}
              </p>
              {whyItMatters && (
                <div className="mt-3 pt-3 border-t border-pulse-subtle">
                  <span className="text-[11px] font-mono font-bold text-teal-600 dark:text-teal-400 block mb-1">
                    Why this matters:
                  </span>
                  <p className="text-xs text-pulse-secondary leading-relaxed">
                    {whyItMatters}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-1">
              <span className="text-xs font-bold text-pulse-primary font-mono block">No detailed evidence available</span>
              <p className="text-xs text-pulse-muted leading-relaxed">
                No detailed problem description or runtime evaluation notes were recorded for this finding.
              </p>
            </div>
          )}

          {/* Evidence Flow Path */}
          <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-3">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-pulse-primary">
              <Layers className="h-4 w-4 text-pulse-accent" />
              <span>Evidence Trace & AST Node Path</span>
            </div>

            <div className="bg-pulse-surface p-3 rounded-xl border border-pulse-subtle font-mono text-xs text-pulse-secondary space-y-1.5 overflow-x-auto">
              <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 font-semibold min-w-0">
                <span className="shrink-0">1. File Scope:</span>
                <span className="text-pulse-primary break-all">{fileName} ({language})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>2. Node Location:</span>
                <span className="text-pulse-primary">Line {findingLine}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>3. Category Rule:</span>
                <span className="text-pulse-primary">{categoryStr}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>4. Heuristic ID:</span>
                <span className="text-pulse-muted font-mono">{findingId}</span>
              </div>
            </div>
          </div>

          {/* Recommended Fix */}
          {remediationText ? (
            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                <Lightbulb className="h-4 w-4 shrink-0" />
                <span>Recommended Remediation</span>
              </div>
              <p className="text-xs text-pulse-primary leading-relaxed">
                {remediationText}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-1">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-pulse-primary">
                <Info className="h-4 w-4 text-pulse-accent shrink-0" />
                <span>No detailed remediation available</span>
              </div>
              <p className="text-xs text-pulse-muted leading-relaxed">
                No information available. Standard manual code inspection and refactoring is recommended.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-pulse-subtle bg-pulse-elevated flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <button
            onClick={() => {
              onClose();
              onFixWithAi(finding);
            }}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-sm cursor-pointer min-h-[44px]"
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>Apply AI Fix Now</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onNavigateToAnalyzer(findingLine);
            }}
            className="text-xs font-mono text-pulse-accent hover:underline flex items-center justify-center space-x-1.5 cursor-pointer py-2 min-h-[44px]"
          >
            <Code2 className="h-4 w-4 shrink-0" />
            <span>Jump to Line {findingLine} in Code</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(drawerContent, document.body)
    : drawerContent;
};
