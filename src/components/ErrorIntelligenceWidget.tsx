import React, { useState } from 'react';
import {
  Bug,
  Terminal,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Play,
  BookOpen,
  Sparkles,
  ExternalLink,
  Cpu,
  Layers,
  Wrench,
  FileCode,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SupportedLanguage, ErrorAnalysisResult } from '../types';
import { analyzeError } from '../services/errorIntelligenceEngine';
import { runDebuggingDiagnosis, buildCrossLanguageTrace } from '../services/debuggingEngine';
import { getLanguageKnowledgeProfile } from '../engine/learning/languageKnowledgeRegistry';

interface Props {
  onJumpToLearn?: (lang: SupportedLanguage, conceptId?: string) => void;
  onOpenKnowledgeModal?: (lang: SupportedLanguage) => void;
}

export const ErrorIntelligenceWidget: React.FC<Props> = ({
  onJumpToLearn,
  onOpenKnowledgeModal,
}) => {
  const { code, language, fileName, setCode, runAnalysis, setActiveTab } = useApp();

  const [rawInput, setRawInput] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(language || 'typescript');
  const [analysisResult, setAnalysisResult] = useState<ErrorAnalysisResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'diagnosis' | 'diff' | 'cross_lang'>('diagnosis');

  const profile = getLanguageKnowledgeProfile(selectedLanguage);

  const handleAnalyze = () => {
    if (!rawInput.trim() && !code.trim()) return;

    const result = analyzeError({
      rawErrorText: rawInput,
      sourceCode: code,
      fileName,
      language: selectedLanguage,
    });

    setAnalysisResult(result);
  };

  const handleSampleError = (sample: string, lang: SupportedLanguage) => {
    setRawInput(sample);
    setSelectedLanguage(lang);
    const result = analyzeError({
      rawErrorText: sample,
      sourceCode: code,
      fileName,
      language: lang,
    });
    setAnalysisResult(result);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const crossTrace = buildCrossLanguageTrace();

  return (
    <div className="space-y-4 rounded-3xl bg-pulse-surface border border-pulse-subtle p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-pulse-subtle">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500">
            <Bug className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-pulse-primary flex items-center gap-2">
              <span>Error Intelligence & Stack Trace Engine</span>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                18-Category Classifier
              </span>
            </h3>
            <p className="text-xs text-pulse-secondary">
              Paste stack traces, compiler diagnostics, or runtime logs for instant root cause diagnosis & verification.
            </p>
          </div>
        </div>

        {/* Language Badge & Knowledge Inspector Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenKnowledgeModal && onOpenKnowledgeModal(selectedLanguage)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-xs font-mono text-pulse-primary transition"
          >
            <span>{profile.icon}</span>
            <span>{profile.name} Specs</span>
            <ExternalLink className="w-3 h-3 text-pulse-muted" />
          </button>
        </div>
      </div>

      {/* Preset Quick Error Examples */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
        <span className="text-pulse-muted font-mono text-[11px] shrink-0">Sample Presets:</span>
        <button
          onClick={() =>
            handleSampleError(
              `TypeError: Cannot read properties of undefined (reading 'map')\n    at UserList.tsx:42:18\n    at renderWithHooks (react-dom.js:14982)`,
              'typescript'
            )
          }
          className="px-2.5 py-1 rounded-lg bg-pulse-elevated hover:bg-pulse-elevated-hover text-pulse-secondary text-[11px] font-mono shrink-0 transition"
        >
          TS: Undefined Property
        </button>
        <button
          onClick={() =>
            handleSampleError(
              `Traceback (most recent call last):\n  File "app.py", line 28, in process_data\n    return config["database"]["host"]\nKeyError: 'database'`,
              'python'
            )
          }
          className="px-2.5 py-1 rounded-lg bg-pulse-elevated hover:bg-pulse-elevated-hover text-pulse-secondary text-[11px] font-mono shrink-0 transition"
        >
          Python: KeyError
        </button>
        <button
          onClick={() =>
            handleSampleError(
              `error[E0382]: use of moved value: \`user_data\`\n  --> src/main.rs:18:13\n   |\n16 |     let user_data = fetch_user();\n17 |     process(user_data);\n18 |     println!("{:?}", user_data);\n   |                      ^^^^^^^^^ value borrowed here after move`,
              'rust'
            )
          }
          className="px-2.5 py-1 rounded-lg bg-pulse-elevated hover:bg-pulse-elevated-hover text-pulse-secondary text-[11px] font-mono shrink-0 transition"
        >
          Rust: E0382 Moved Value
        </button>
        <button
          onClick={() =>
            handleSampleError(
              `Exception in thread "main" java.lang.NullPointerException: Cannot invoke "String.length()" because "str" is null\n\tat com.example.App.main(App.java:15)`,
              'java'
            )
          }
          className="px-2.5 py-1 rounded-lg bg-pulse-elevated hover:bg-pulse-elevated-hover text-pulse-secondary text-[11px] font-mono shrink-0 transition"
        >
          Java: NullPointerException
        </button>
      </div>

      {/* Input Box */}
      <div className="space-y-2">
        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder="Paste compiler output, stack trace, terminal logs, or exception message..."
          rows={4}
          className="w-full p-3 font-mono text-xs rounded-xl bg-pulse-bg border border-pulse-subtle text-pulse-primary placeholder-pulse-muted focus:outline-none focus:border-pulse-strong resize-y"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-pulse-muted">
            <Terminal className="w-3.5 h-3.5" />
            <span>Target Language:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
              className="bg-pulse-elevated border border-pulse-subtle rounded px-2 py-1 text-pulse-primary font-mono text-xs focus:outline-none"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="java">Java</option>
              <option value="cpp">C / C++</option>
              <option value="csharp">C#</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="kotlin">Kotlin</option>
              <option value="swift">Swift</option>
              <option value="php">PHP</option>
              <option value="ruby">Ruby</option>
              <option value="sql">SQL</option>
              <option value="html">HTML5</option>
              <option value="css">CSS3</option>
            </select>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!rawInput.trim() && !code.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Diagnose Root Cause</span>
          </button>
        </div>
      </div>

      {/* Analysis Results View */}
      {analysisResult && (
        <div className="space-y-4 pt-4 border-t border-pulse-subtle animate-fadeIn">
          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-b border-pulse-subtle pb-2 text-xs">
            <button
              onClick={() => setActiveSubTab('diagnosis')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                activeSubTab === 'diagnosis'
                  ? 'bg-pulse-elevated text-pulse-accent border border-pulse-subtle'
                  : 'text-pulse-secondary hover:text-pulse-primary'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Root Cause Diagnosis</span>
            </button>
            <button
              onClick={() => setActiveSubTab('diff')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                activeSubTab === 'diff'
                  ? 'bg-pulse-elevated text-pulse-accent border border-pulse-subtle'
                  : 'text-pulse-secondary hover:text-pulse-primary'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Proposed Fix & Diff</span>
            </button>
            <button
              onClick={() => setActiveSubTab('cross_lang')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                activeSubTab === 'cross_lang'
                  ? 'bg-pulse-elevated text-pulse-accent border border-pulse-subtle'
                  : 'text-pulse-secondary hover:text-pulse-primary'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cross-Language Flow</span>
            </button>
          </div>

          {activeSubTab === 'diagnosis' && (
            <div className="space-y-3 text-xs">
              {/* Category & Status Banner */}
              <div className="p-3.5 rounded-2xl bg-pulse-elevated border border-pulse-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-400 font-mono font-bold text-xs">
                    {analysisResult.errorCategory}
                  </span>
                  <span className="font-bold text-pulse-primary text-sm">
                    {analysisResult.errorName}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-pulse-muted font-mono text-[11px]">
                  <span>Confidence:</span>
                  <span className="text-teal-400 font-semibold">{analysisResult.confidence}</span>
                  <span>•</span>
                  <span>{analysisResult.matchedKnowledgeProfile}</span>
                </div>
              </div>

              {/* Location & Root Cause Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-pulse-bg border border-pulse-subtle space-y-1.5">
                  <h4 className="font-bold text-pulse-primary uppercase tracking-wider text-[10px] text-pulse-muted">
                    Origin Location & Evidence
                  </h4>
                  {analysisResult.location?.file && (
                    <p className="font-mono text-pulse-secondary">
                      File: <strong className="text-pulse-primary">{analysisResult.location.file}</strong>
                      {analysisResult.location.line ? ` (Line ${analysisResult.location.line})` : ''}
                    </p>
                  )}
                  <ul className="space-y-1 pt-1 text-pulse-secondary">
                    {analysisResult.evidence.map((ev, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-pulse-accent mt-0.5">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-pulse-bg border border-pulse-subtle space-y-1.5">
                  <h4 className="font-bold text-pulse-primary uppercase tracking-wider text-[10px] text-pulse-muted">
                    Root Cause Explanation
                  </h4>
                  <p className="text-pulse-primary leading-relaxed">{analysisResult.rootCause}</p>
                  <p className="text-pulse-secondary text-[11px] pt-1">{analysisResult.whyItHappens}</p>
                </div>
              </div>

              {/* Fix & Prevention Guidance */}
              <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-teal-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Remediation & Prevention Strategy</span>
                  </div>
                  {analysisResult.learnConceptLink && onJumpToLearn && (
                    <button
                      onClick={() =>
                        onJumpToLearn(
                          analysisResult.learnConceptLink!.language,
                          analysisResult.learnConceptLink!.conceptId
                        )
                      }
                      className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Learn {analysisResult.learnConceptLink.conceptTitle}</span>
                    </button>
                  )}
                </div>
                <p className="text-pulse-primary leading-relaxed">{analysisResult.howToFix}</p>
                <div className="p-2 rounded bg-pulse-surface border border-pulse-subtle text-[11px] text-pulse-secondary">
                  <strong className="text-pulse-primary">Verification Method: </strong>
                  <code>{analysisResult.verificationMethod.commandOrMethod}</code> — {analysisResult.verificationMethod.expectedOutcome}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'diff' && (
            <div className="space-y-3 text-xs">
              {analysisResult.proposedFixDiff ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-pulse-primary">Proposed Code Patch</span>
                    <button
                      onClick={() => handleCopy(analysisResult.proposedFixDiff!.fixedCode)}
                      className="flex items-center gap-1 text-[11px] text-pulse-secondary hover:text-pulse-primary"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Copied' : 'Copy Fixed Code'}</span>
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-pulse-bg border border-pulse-subtle font-mono text-xs text-teal-300 overflow-x-auto whitespace-pre-wrap">
                    {analysisResult.proposedFixDiff.hunkDiff}
                  </pre>
                  <p className="text-pulse-secondary text-[11px]">
                    {analysisResult.proposedFixDiff.explanation}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-pulse-bg border border-pulse-subtle text-pulse-secondary text-center">
                  Review the diagnostic advice above to apply targeted refactoring.
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'cross_lang' && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-pulse-bg border border-pulse-subtle space-y-2">
                <h4 className="font-bold text-pulse-primary">{crossTrace.title}</h4>
                <p className="text-pulse-secondary text-[11px]">{crossTrace.dataFlowDescription}</p>

                <div className="space-y-2 pt-2">
                  {crossTrace.layers.map((layer, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-pulse-surface border border-pulse-subtle flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-pulse-elevated font-mono text-[10px] text-pulse-accent">
                            {layer.language.toUpperCase()}
                          </span>
                          <strong className="text-pulse-primary font-mono text-xs">{layer.file}</strong>
                          <span className="text-pulse-muted">({layer.role})</span>
                        </div>
                        <p className="font-mono text-[11px] text-pulse-muted">{layer.snippet}</p>
                      </div>
                      <span className="text-[11px] text-rose-400 max-w-xs text-right">{layer.riskNote}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
