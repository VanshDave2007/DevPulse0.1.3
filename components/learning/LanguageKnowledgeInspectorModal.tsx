import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Shield,
  Zap,
  Cpu,
  Layers,
  Bug,
  Code2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Terminal,
} from 'lucide-react';
import { SupportedLanguage, LanguageKnowledgeProfile } from '../../types';
import {
  LANGUAGE_KNOWLEDGE_PROFILES,
  getLanguageKnowledgeProfile,
} from '../../engine/learning/languageKnowledgeRegistry';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialLanguage?: SupportedLanguage;
  onSelectLanguage?: (lang: SupportedLanguage) => void;
  onNavigateToLearn?: (lang: SupportedLanguage, conceptId?: string) => void;
}

type TabType = 'overview' | 'memory' | 'errors' | 'security' | 'performance' | 'idioms';

const ALL_LANGUAGES: SupportedLanguage[] = [
  'python',
  'javascript',
  'typescript',
  'java',
  'cpp',
  'csharp',
  'go',
  'rust',
  'kotlin',
  'swift',
  'php',
  'ruby',
  'sql',
  'html',
  'css',
];

export const LanguageKnowledgeInspectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialLanguage = 'typescript',
  onSelectLanguage,
  onNavigateToLearn,
}) => {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(initialLanguage);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!isOpen) return null;

  const profile: LanguageKnowledgeProfile = getLanguageKnowledgeProfile(selectedLang);

  return (
    <div
      id="language-knowledge-inspector-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/70 rounded-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{profile.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-100">{profile.name} Engineering Profile</h2>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {profile.typeSystem.category} Typing
                </span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                  {profile.memoryModel.management}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                15-Language Deep Engineering Knowledge • AST, Memory, Concurrency, Security, & Error Catalog
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToLearn && (
              <button
                id="btn-deep-link-learn-mode"
                onClick={() => {
                  onNavigateToLearn(selectedLang);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open in Learn Mode</span>
              </button>
            )}
            <button
              id="btn-close-knowledge-modal"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 15-Language Selector Bar */}
        <div className="px-6 py-2.5 bg-slate-950/70 border-b border-slate-800 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {ALL_LANGUAGES.map((langKey) => {
              const p = getLanguageKnowledgeProfile(langKey);
              const isSelected = selectedLang === langKey;
              return (
                <button
                  key={langKey}
                  id={`btn-lang-tab-${langKey}`}
                  onClick={() => {
                    setSelectedLang(langKey);
                    if (onSelectLanguage) onSelectLanguage(langKey);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    isSelected
                      ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/50 shadow-sm'
                      : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <span>{p.icon}</span>
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-slate-900/50 text-xs">
          <button
            id="tab-btn-overview"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Architecture & Specs</span>
          </button>
          <button
            id="tab-btn-memory"
            onClick={() => setActiveTab('memory')}
            className={`flex items-center gap-1.5 px-3 py-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'memory'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Memory & Concurrency</span>
          </button>
          <button
            id="tab-btn-errors"
            onClick={() => setActiveTab('errors')}
            className={`flex items-center gap-1.5 px-3 py-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'errors'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Error Catalog ({profile.commonErrors.length})</span>
          </button>
          <button
            id="tab-btn-security"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-3 py-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security Patterns</span>
          </button>
          <button
            id="tab-btn-performance"
            onClick={() => setActiveTab('performance')}
            className={`flex items-center gap-1.5 px-3 py-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'performance'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Performance</span>
          </button>
          <button
            id="tab-btn-idioms"
            onClick={() => setActiveTab('idioms')}
            className={`flex items-center gap-1.5 px-3 py-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'idioms'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Idioms & Best Practices</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
                  <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Syntax & Scoping</h3>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li><strong className="text-slate-100">Delimiters:</strong> {profile.syntaxRules.statementDelimiters}</li>
                    <li><strong className="text-slate-100">Scoping:</strong> {profile.syntaxRules.blockScoping}</li>
                    <li><strong className="text-slate-100">Variables Casing:</strong> {profile.syntaxRules.casingConventions.variables}</li>
                    <li><strong className="text-slate-100">Functions Casing:</strong> {profile.syntaxRules.casingConventions.functions}</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
                  <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Type System</h3>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li><strong className="text-slate-100">Category:</strong> {profile.typeSystem.category} ({profile.typeSystem.safety})</li>
                    <li><strong className="text-slate-100">Inference:</strong> {profile.typeSystem.inference ? 'Supported' : 'Explicit only'}</li>
                    <li><strong className="text-slate-100">Coercion:</strong> {profile.typeSystem.typeCoercion}</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Key Syntax Rules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {profile.syntaxRules.keyRules.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2.5 rounded bg-slate-800/40 border border-slate-800/80 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
                <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Tooling & Ecosystem</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Package Manager:</span>
                    <span className="font-mono text-slate-200">{profile.packageManager.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Manifest File:</span>
                    <span className="font-mono text-slate-200">{profile.packageManager.manifestFile}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Compiler / Runtime:</span>
                    <span className="font-mono text-slate-200">{profile.compilerOrInterpreter}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
                <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Memory Management</h3>
                <div className="space-y-2 text-xs">
                  <p><strong className="text-slate-100">Management Model:</strong> {profile.memoryModel.management}</p>
                  <p><strong className="text-slate-100">Stack vs Heap:</strong> {profile.memoryModel.stackVsHeap}</p>
                  <p><strong className="text-slate-100">Pointers / References:</strong> {profile.memoryModel.pointersOrReferences}</p>
                  {profile.memoryModel.garbageCollection && (
                    <p><strong className="text-slate-100">GC Strategy:</strong> {profile.memoryModel.garbageCollection}</p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
                <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Concurrency & Async Architecture</h3>
                <div className="space-y-2 text-xs">
                  <p><strong className="text-slate-100">Threading Model:</strong> {profile.concurrencyModel.threadingModel}</p>
                  <p><strong className="text-slate-100">Async Mechanism:</strong> {profile.concurrencyModel.asyncMechanism}</p>
                  <div>
                    <strong className="text-slate-100 block mb-1">Concurrency Primitives:</strong>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.concurrencyModel.primitives.map((prim, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-800 text-indigo-300 font-mono text-[11px] rounded border border-slate-700">
                          {prim}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {profile.concurrencyModel.pitfalls.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Concurrency Pitfalls</h3>
                  <div className="space-y-2">
                    {profile.concurrencyModel.pitfalls.map((pitfall, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2.5 rounded bg-amber-950/20 border border-amber-900/40 text-xs text-amber-200">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{pitfall}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="space-y-4">
              {profile.commonErrors.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">No explicit common error patterns logged for {profile.name}.</div>
              ) : (
                profile.commonErrors.map((err, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-rose-950/60 text-rose-300 font-mono text-xs rounded border border-rose-800/50">
                          {err.category}
                        </span>
                        <h4 className="font-mono text-xs font-semibold text-slate-100">{err.errorType}</h4>
                      </div>
                      {err.learnConceptId && onNavigateToLearn && (
                        <button
                          onClick={() => {
                            onNavigateToLearn(selectedLang, err.learnConceptId);
                            onClose();
                          }}
                          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Learn Concept</span>
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-300">{err.cause}</p>
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
                      <span className="text-slate-500 block text-[10px] uppercase">Fix Strategy:</span>
                      <span className="text-emerald-300">{err.fixStrategy}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              {profile.securityPatterns.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">Standard secure coding guidelines apply for {profile.name}.</div>
              ) : (
                profile.securityPatterns.map((sec, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-rose-900/50 text-rose-200 text-xs font-semibold rounded border border-rose-700/50">
                          {sec.severity}
                        </span>
                        <span className="font-mono text-xs text-slate-400">{sec.cweOrClass}</span>
                        <h4 className="font-semibold text-xs text-slate-100">{sec.vulnerability}</h4>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300">{sec.description}</p>
                    {sec.badCode && sec.secureCode && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2.5 bg-rose-950/30 border border-rose-900/40 rounded text-rose-200">
                          <span className="text-[10px] text-rose-400 font-semibold block mb-1">VULNERABLE PATTERN</span>
                          <code>{sec.badCode}</code>
                        </div>
                        <div className="p-2.5 bg-emerald-950/30 border border-emerald-900/40 rounded text-emerald-200">
                          <span className="text-[10px] text-emerald-400 font-semibold block mb-1">SECURE REMEDIATION</span>
                          <code>{sec.secureCode}</code>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-4">
              {profile.performancePatterns.map((perf, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-xs text-indigo-300">{perf.topic}</h4>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[11px] rounded">Impact: {perf.impact}</span>
                  </div>
                  <p className="text-xs text-slate-300">{perf.bottleneck}</p>
                  <p className="text-xs text-emerald-300 font-medium">{perf.recommendation}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'idioms' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Idioms</h3>
                <div className="space-y-2">
                  {profile.idioms.map((idm, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5 text-xs">
                      <h4 className="font-semibold text-slate-100">{idm.name}</h4>
                      <p className="text-slate-300">{idm.description}</p>
                      <pre className="p-2 bg-slate-900 rounded font-mono text-[11px] text-slate-200 overflow-x-auto">{idm.exampleSnippet}</pre>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Best Practices</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {profile.bestPractices.map((bp, idx) => (
                    <div key={idx} className="p-3 rounded bg-slate-950/60 border border-slate-800 text-xs">
                      <span className="font-semibold text-slate-200 block mb-1">{bp.title}</span>
                      <span className="text-slate-400">{bp.recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400">
          <div>
            Active profile: <span className="font-mono text-slate-200">{profile.name}</span> ({profile.fileExtensions.join(', ')})
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
