import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  AccessibilitySettings,
  ActionFinding,
  AIActionType,
  AIChatMessage,
  AnalysisResult,
  AskResult,
  CodebaseQueryContext,
  CodeSmell,
  EvidenceGraph,
  PresetProject,
  SupportedLanguage,
  ThemeMode,
  ToastNotification,
  UserPersonalizationProfile,
} from '../types';
import {
  DEFAULT_PERSONALIZATION_PROFILE,
  buildPersonalizedAiContext,
} from '../engine/personalization';
import { analyzeCode } from '../engine/analyzer';
import { detectLanguage } from '../engine/detector';
import { SAMPLE_PROJECTS } from '../data/samples';
import {
  auth,
  getUserProfile,
  persistAnalysis,
  DevPulseUserProfile,
  SavedAnalysisRecord,
} from '../services/firebase';
import {
  saveAnalysisToCloudSql,
  saveAiConversationToCloudSql,
  dispatchGmailAlert,
  syncUserWithCloudSql,
  fetchCloudSqlUserProfile,
} from '../services/db-sync';
import { telemetry } from '../services/telemetry';
import { sessionTracker } from '../services/sessionTracker';
import { RepositoryIntelligenceService } from '../services/repositoryIntelligenceService';
import { EvidenceGraphService } from '../services/evidenceGraphService';
import { ProjectMemoryService } from '../services/projectMemoryService';
import { normalizeCodeSmells } from '../engine/actionCenter';

export type NavTab =
  | 'dashboard'
  | 'analyzer'
  | 'health'
  | 'pulse-map'
  | 'dependencies'
  | 'pulse-ai'
  | 'agent-review'
  | 'learn'
  | 'performance'
  | 'settings'
  | 'about';

interface PendingAction {
  type: 'load_preset' | 'clear_editor' | 'reset_code';
  payload?: any;
  title: string;
  description: string;
}

interface AppContextType {
  code: string;
  setCode: (code: string) => void;
  fileName: string;
  setFileName: (name: string) => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  isAutoDetect: boolean;
  setIsAutoDetect: (auto: boolean) => void;
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  selectedSmell: CodeSmell | null;
  setSelectedSmell: (smell: CodeSmell | null) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  effectiveTheme: 'dark' | 'light';
  accessibility: AccessibilitySettings;
  updateAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  resetAccessibility: () => void;
  loadPreset: (id: string, force?: boolean) => void;
  runAnalysis: (overrideCode?: string, overrideLang?: SupportedLanguage) => void;
  analyzeCurrentCode: () => void;
  aiMessages: AIChatMessage[];
  setAiMessages: React.Dispatch<React.SetStateAction<AIChatMessage[]>>;
  isAiLoading: boolean;
  setIsAiLoading: (loading: boolean) => void;
  sendAiRequest: (
    action: string,
    prompt?: string,
    overrides?: { code?: string; language?: SupportedLanguage }
  ) => Promise<string | null>;
  retryAiRequest: (action: AIActionType, prompt?: string) => Promise<string | null>;
  clearAiHistory: () => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isCommandMenuOpen: boolean;
  setIsCommandMenuOpen: (open: boolean) => void;
  isCheatSheetOpen: boolean;
  setIsCheatSheetOpen: (open: boolean) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  pendingAction: PendingAction | null;
  setPendingAction: (action: PendingAction | null) => void;
  confirmPendingAction: () => void;
  cancelPendingAction: () => void;
  cancelAiRequest: () => void;

  // Firebase Auth & User Profile
  user: User | null;
  userProfile: DevPulseUserProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<DevPulseUserProfile | null>>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isGuest: boolean;

  // History & Workspace Modals
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  isWorkspaceModalOpen: boolean;
  setIsWorkspaceModalOpen: (open: boolean) => void;

  // AI Fix Assistance
  isFixModalOpen: boolean;
  setIsFixModalOpen: (open: boolean) => void;
  activeFixSmell: CodeSmell | null;
  setActiveFixSmell: (smell: CodeSmell | null) => void;
  openFixModalForSmell: (smell: CodeSmell) => void;

  // Personalization & Questionnaire
  personalizationProfile: UserPersonalizationProfile;
  updatePersonalizationProfile: (profile: Partial<UserPersonalizationProfile>) => void;
  isQuestionnaireOpen: boolean;
  setIsQuestionnaireOpen: (open: boolean) => void;

  // Mascot Design System Sheet
  isMascotSheetOpen: boolean;
  setIsMascotSheetOpen: (open: boolean) => void;

  // Focus Mode (Deep-Dive Full Screen Workspace)
  isFocusMode: boolean;
  setIsFocusMode: React.Dispatch<React.SetStateAction<boolean>>;
  toggleFocusMode: () => void;

  // Toast Notification System
  toasts: ToastNotification[];
  addToast: (toast: Omit<ToastNotification, 'id'> | string) => void;
  removeToast: (id: string) => void;

  // Ask Your Codebase Intelligence
  askCodebase: (query: string, customContext?: Partial<CodebaseQueryContext>) => Promise<AskResult>;
  lastAskResult: AskResult | null;
  setLastAskResult: (result: AskResult | null) => void;
  activeEvidenceGraph: EvidenceGraph | null;
}

const defaultAccessibility: AccessibilitySettings = {
  fontSize: 'default',
  highContrast: false,
  reduceMotion: false,
  editorFontSize: 14,
  editorWordWrap: true,
  editorTabSize: 4,
  learningLevel: 'intermediate',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialPreset = SAMPLE_PROJECTS[0];
  const [code, setCodeInternal] = useState<string>(initialPreset.code);
  const [fileName, setFileName] = useState<string>('order_processor.py');
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [isAutoDetect, setIsAutoDetect] = useState<boolean>(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeTabInternal, setActiveTabInternal] = useState<NavTab>('dashboard');
  const setActiveTab = (tab: NavTab) => {
    setActiveTabInternal(tab);
    sessionTracker.recordFeatureClick(tab);
  };
  const activeTab = activeTabInternal;
  const [selectedSmell, setSelectedSmell] = useState<CodeSmell | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState<boolean>(false);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return !localStorage.getItem('devpulse_onboarding_dismissed');
  });
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  // User & Firebase Auth
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<DevPulseUserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // History & Workspace Modals
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState<boolean>(false);

  // AI Fix Assistance
  const [isFixModalOpen, setIsFixModalOpen] = useState<boolean>(false);
  const [activeFixSmell, setActiveFixSmell] = useState<CodeSmell | null>(null);

  // Personalization & Knowledge Profile State
  const [personalizationProfile, setPersonalizationProfile] = useState<UserPersonalizationProfile>(() => {
    try {
      const saved = localStorage.getItem('devpulse_personalization_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PERSONALIZATION_PROFILE,
          ...parsed,
          preferences: { ...DEFAULT_PERSONALIZATION_PROFILE.preferences, ...(parsed.preferences || {}) },
          skill_dimensions: { ...DEFAULT_PERSONALIZATION_PROFILE.skill_dimensions, ...(parsed.skill_dimensions || {}) },
          settings: { ...DEFAULT_PERSONALIZATION_PROFILE.settings, ...(parsed.settings || {}) },
        };
      }
    } catch {}
    return DEFAULT_PERSONALIZATION_PROFILE;
  });

  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState<boolean>(() => {
    const hasCompleted = localStorage.getItem('devpulse_questionnaire_completed');
    return !hasCompleted;
  });
  const [isMascotSheetOpen, setIsMascotSheetOpen] = useState<boolean>(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  const toggleFocusMode = () => {
    setIsFocusMode((prev) => !prev);
  };

  // Toast Notification System
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (toast: Omit<ToastNotification, 'id'> | string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastNotification =
      typeof toast === 'string'
        ? { id, title: toast, type: 'info' }
        : { ...toast, id };

    setToasts((prev) => [...prev.slice(-4), newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Ask Your Codebase Intelligence state
  const [lastAskResult, setLastAskResult] = useState<AskResult | null>(null);
  const [activeEvidenceGraph, setActiveEvidenceGraph] = useState<EvidenceGraph | null>(null);

  const updatePersonalizationProfile = (updates: Partial<UserPersonalizationProfile>) => {
    setPersonalizationProfile((prev) => {
      const updated: UserPersonalizationProfile = {
        ...prev,
        ...updates,
        preferences: updates.preferences ? { ...prev.preferences, ...updates.preferences } : prev.preferences,
        skill_dimensions: updates.skill_dimensions ? { ...prev.skill_dimensions, ...updates.skill_dimensions } : prev.skill_dimensions,
        settings: updates.settings ? { ...prev.settings, ...updates.settings } : prev.settings,
      };
      localStorage.setItem('devpulse_personalization_profile', JSON.stringify(updated));
      localStorage.setItem('devpulse_questionnaire_completed', 'true');
      return updated;
    });
  };

  // Synchronize accessibility learningLevel with active personalization knowledge level
  useEffect(() => {
    if (personalizationProfile.knowledge_level) {
      setAccessibility((prev) => {
        if (prev.learningLevel !== personalizationProfile.knowledge_level) {
          return { ...prev, learningLevel: personalizationProfile.knowledge_level as any };
        }
        return prev;
      });
    }
  }, [personalizationProfile.knowledge_level]);

  // Reference for in-flight streaming abort controller and client-side memory cache
  const aiAbortControllerRef = useRef<AbortController | null>(null);
  const clientAiCacheRef = useRef<Map<string, string>>(new Map());

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile) {
          setUserProfile(profile);
          if (profile.learningLevel) {
            setAccessibility((prev) => ({ ...prev, learningLevel: profile.learningLevel }));
          }
        }
        // Sync profile to Cloud SQL
        syncUserWithCloudSql({
          uid: firebaseUser.uid,
          email: firebaseUser.email || `${firebaseUser.uid}@devpulse.local`,
          displayName: firebaseUser.displayName || undefined,
          photoUrl: firebaseUser.photoURL || undefined,
        }).catch((e) => console.warn('Could not sync user with Cloud SQL:', e));
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const setCode = (newCode: string) => {
    setCodeInternal(newCode);
    setIsDirty(true);
  };

  // Theme State
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('devpulse_theme') as ThemeMode) || 'dark';
  });
  const [effectiveTheme, setEffectiveTheme] = useState<'dark' | 'light'>('dark');

  // Accessibility State
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem('devpulse_accessibility');
      return saved ? JSON.parse(saved) : defaultAccessibility;
    } catch {
      return defaultAccessibility;
    }
  });

  // AI Chat Messages
  const [aiMessages, setAiMessages] = useState<AIChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm **Pulse AI**, your developer intelligence assistant. I can explain code structure, diagnose complexity bottlenecks, perform refactoring diffs, generate test suites, or create interactive learning modules. Select a quick action or ask a custom question.",
      timestamp: Date.now(),
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Synchronize System Theme & HTML data attributes
  useEffect(() => {
    const handleSystemTheme = () => {
      let resolved: 'dark' | 'light' = 'dark';
      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolved = theme;
      }
      setEffectiveTheme(resolved);
      document.documentElement.setAttribute('data-theme', resolved);
    };

    handleSystemTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', handleSystemTheme);
      return () => mediaQuery.removeEventListener('change', handleSystemTheme);
    }
  }, [theme]);

  // Apply Accessibility attributes to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', accessibility.fontSize);
    document.documentElement.setAttribute('data-contrast', accessibility.highContrast ? 'high' : 'normal');
    document.documentElement.setAttribute('data-motion', accessibility.reduceMotion ? 'reduced' : 'normal');

    localStorage.setItem('devpulse_accessibility', JSON.stringify(accessibility));
  }, [accessibility]);

  const setTheme = (newTheme: ThemeMode) => {
    // Add smooth theme transition class to root for duration of transition
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('theme-transitioning');
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 400);
    }
    setThemeState(newTheme);
    localStorage.setItem('devpulse_theme', newTheme);
  };

  const updateAccessibility = (newSettings: Partial<AccessibilitySettings>) => {
    setAccessibility((prev) => ({ ...prev, ...newSettings }));
  };

  const resetAccessibility = () => {
    setAccessibility(defaultAccessibility);
    localStorage.setItem('devpulse_accessibility', JSON.stringify(defaultAccessibility));
  };

  // Run Code Analysis & Persist Record
  const runAnalysis = (overrideCode?: string, overrideLang?: SupportedLanguage) => {
    const targetCode = overrideCode !== undefined ? overrideCode : code;
    let targetLang = overrideLang !== undefined ? overrideLang : language;

    if (isAutoDetect && overrideLang === undefined) {
      const detected = detectLanguage(targetCode, fileName);
      targetLang = detected.language;
      setLanguage(detected.language);
    }

    setIsAnalyzing(true);
    setTimeout(() => {
      const astStartTime = performance.now();
      const res = analyzeCode(targetCode, targetLang, fileName);
      const astDuration = performance.now() - astStartTime;

      telemetry.recordApiLog({
        endpoint: `AST Engine (${targetLang})`,
        method: 'PARSE',
        durationMs: astDuration,
        status: 'ok',
        category: 'ast_engine',
        payloadSummary: `${res.metrics.loc} LOC • ${res.metrics.functions.length} functions • ${res.smells.length} smells`,
        details: `Cyclomatic: ${res.metrics.cyclomaticComplexity}, Health: ${res.metrics.healthScore}/100`,
      });
      telemetry.recordComponentRender('AST & Heuristics Engine', astDuration, 'update');

      setAnalysis(res);
      setIsAnalyzing(false);

      // Build & Sync Deterministic Evidence Graph
      try {
        const actionFindings = normalizeCodeSmells(res.smells, fileName, res.metrics);
        const graph = EvidenceGraphService.buildGraph(res, actionFindings, targetCode, fileName);
        setActiveEvidenceGraph(graph);
      } catch (err) {
        console.warn('Could not sync evidence graph:', err);
      }

      // Record to Session Intelligence Tracker
      sessionTracker.recordAnalysisRun(
        fileName,
        res.smells.length,
        astDuration,
        res.metrics.cyclomaticComplexity
      );

      // Record to history (Firestore if user authenticated, or localStorage)
      if (targetCode.trim().length > 0 && res) {
        const historyRecord: Omit<SavedAnalysisRecord, 'id'> = {
          fileName,
          language: targetLang,
          codeSnippet: targetCode,
          healthScore: res.metrics.healthScore,
          maintainabilityScore: res.metrics.maintainabilityScore,
          cyclomaticComplexity: res.metrics.cyclomaticComplexity,
          loc: res.metrics.loc,
          smellsCount: res.smells.length,
          timestamp: Date.now(),
        };

        if (user) {
          persistAnalysis(user.uid, historyRecord).catch((err) =>
            console.warn('Could not persist analysis to Firestore:', err)
          );

          // Persist full reopenable scan to Cloud SQL
          const criticalFindingsCount = res.smells.filter((s) => s.severity === 'critical').length;
          const warningFindingsCount = res.smells.filter((s) => s.severity === 'warning').length;
          const infoFindingsCount = res.smells.filter((s) => s.severity === 'info').length;

          saveAnalysisToCloudSql({
            projectOrFileName: fileName || `${targetLang}_analysis`,
            language: targetLang,
            healthScore: res.metrics.healthScore,
            maintainabilityScore: res.metrics.maintainabilityScore,
            cyclomaticComplexity: res.metrics.cyclomaticComplexity,
            loc: res.metrics.loc,
            criticalFindings: criticalFindingsCount,
            highFindings: warningFindingsCount,
            mediumFindings: infoFindingsCount,
            lowFindings: 0,
            summary: `${res.smells.length} total findings detected across ${res.metrics.loc} LOC.`,
            fullResult: res,
          }).catch((err) => console.warn('Could not persist analysis to Cloud SQL:', err));

          // Dispatch Gmail vulnerability alert if critical issues detected
          if (criticalFindingsCount > 0 && user.email) {
            const criticalList = res.smells
              .filter((s) => s.severity === 'critical')
              .map((s) => `• [${s.category.toUpperCase()}] ${s.title} (Line ${s.line}): ${s.problem}`)
              .join('\n');

            dispatchGmailAlert({
              recipientEmail: user.email,
              subject: `🚨 DevPulse Security Alert: ${criticalFindingsCount} Critical Vulnerabilities Found in ${fileName}`,
              bodyText: `DevPulse has detected ${criticalFindingsCount} critical vulnerabilities during your recent code scan of "${fileName}" (${targetLang}):\n\n${criticalList}\n\nHealth Score: ${res.metrics.healthScore}/100\nMaintainability: ${res.metrics.maintainabilityScore}/100\n\nPlease review these findings in DevPulse Observatory to patch potential security exploits.`,
              type: 'vulnerability_alert',
              metadata: { fileName, language: targetLang, criticalCount: criticalFindingsCount },
            }).catch((err) => console.warn('Gmail vulnerability notification log error:', err));
          }
        } else {
          try {
            const localHist: SavedAnalysisRecord[] = JSON.parse(
              localStorage.getItem('devpulse_local_history') || '[]'
            );
            const newLocal = [
              { id: `local_${Date.now()}`, ...historyRecord },
              ...localHist.slice(0, 19),
            ];
            localStorage.setItem('devpulse_local_history', JSON.stringify(newLocal));
          } catch {
            // Non-blocking
          }
        }
      }
    }, 150);
  };

  const analyzeCurrentCode = () => {
    runAnalysis(code, language);
  };

  // Keyboard shortcut listener for Command Menu (Ctrl+K or Cmd+K) & Cheat Sheet (Shift+? or ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest('.monaco-editor') !== null);

      // Trigger Cheat Sheet on Shift + ? (or '?' key when not in an editable element)
      if ((e.key === '?' || (e.shiftKey && (e.key === '/' || e.key === '?'))) && !isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsCheatSheetOpen((prev) => !prev);
        return;
      }

      // Command menu: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandMenuOpen((prev) => !prev);
        return;
      }

      // Quick Analysis: Cmd+Enter or Ctrl+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runAnalysis();
        return;
      }

      // Quick Settings: Cmd+, or Ctrl+,
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen((prev) => !prev);
        return;
      }

      // Quick History: Cmd+H or Ctrl+H (when not browser default)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h' && !e.shiftKey) {
        e.preventDefault();
        setIsHistoryOpen((prev) => !prev);
        return;
      }

      // Quick Export: Cmd+E or Ctrl+E
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsExportModalOpen((prev) => !prev);
        return;
      }

      // Quick Workspace Hub: Cmd+G or Ctrl+G
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g' && !e.shiftKey) {
        e.preventDefault();
        setIsWorkspaceModalOpen((prev) => !prev);
        return;
      }

      // Quick Theme toggle: Cmd+Shift+T or Ctrl+Shift+T
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
        return;
      }

      // Quick Nav numbers: Alt+1 through Alt+9
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const tabMap: Record<string, NavTab> = {
          '1': 'dashboard',
          '2': 'analyzer',
          '3': 'agent-review',
          '4': 'health',
          '5': 'pulse-map',
          '6': 'dependencies',
          '7': 'pulse-ai',
          '8': 'learn',
          '9': 'performance',
        };
        if (tabMap[e.key]) {
          e.preventDefault();
          setActiveTab(tabMap[e.key]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, language, setActiveTab]);

  // Run initial analysis on mount
  useEffect(() => {
    runAnalysis(code, language);
  }, []);

  const loadPreset = (id: string, force: boolean = false) => {
    if (isDirty && !force) {
      const preset = SAMPLE_PROJECTS.find((p) => p.id === id);
      setPendingAction({
        type: 'load_preset',
        payload: id,
        title: 'Unsaved Code Changes',
        description: `You have edited the current code. Loading the "${preset?.title || id}" sample will replace your custom edits. Would you like to proceed?`,
      });
      return;
    }

    const preset = SAMPLE_PROJECTS.find((p) => p.id === id);
    if (preset) {
      setCodeInternal(preset.code);
      setIsDirty(false);
      setLanguage(preset.language);
      setFileName(
        `${preset.id}.${
          preset.language === 'python'
            ? 'py'
            : preset.language === 'javascript'
            ? 'js'
            : preset.language === 'typescript'
            ? 'ts'
            : preset.language === 'java'
            ? 'java'
            : preset.language === 'go'
            ? 'go'
            : 'txt'
        }`
      );
      runAnalysis(preset.code, preset.language);
    }
  };

  const confirmPendingAction = () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'load_preset') {
      loadPreset(pendingAction.payload, true);
    } else if (pendingAction.type === 'clear_editor') {
      setCodeInternal('');
      setIsDirty(false);
      runAnalysis('', language);
    }

    setPendingAction(null);
  };

  const cancelPendingAction = () => {
    setPendingAction(null);
  };

  const openFixModalForSmell = (smell: CodeSmell) => {
    setActiveFixSmell(smell);
    setIsFixModalOpen(true);
  };

  // AI Cancellation
  const cancelAiRequest = () => {
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
      aiAbortControllerRef.current = null;
    }
    setIsAiLoading(false);
  };

  // AI Interaction Handler with Real-Time SSE Streaming & Smart Caching
  const sendAiRequest = async (
    action: string,
    question?: string,
    overrides?: { code?: string; language?: SupportedLanguage }
  ): Promise<string | null> => {
    // Abort previous in-flight AI request if active
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    aiAbortControllerRef.current = abortController;
    setIsAiLoading(true);

    const userMsgId = `user-${Date.now()}`;
    const aiMsgId = `ai-${Date.now()}`;
    const userMsgText = question || `Run ${action} analysis on current code.`;

    const activeTargetCode = overrides?.code !== undefined ? overrides.code : code;
    const activeTargetLang = overrides?.language !== undefined ? overrides.language : language;

    // 1. Add User Message
    setAiMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: 'user',
        content: userMsgText,
        actionType: action as any,
        timestamp: Date.now(),
      },
    ]);

    // Check client-side instant cache
    const cacheKey = `${action}|${activeTargetLang}|${personalizationProfile.knowledge_level}|${question || ''}|${activeTargetCode.slice(0, 300)}|${activeTargetCode.length}`;
    const cachedResponse = clientAiCacheRef.current.get(cacheKey);
    if (cachedResponse) {
      setTimeout(() => {
        setAiMessages((prev) => [
          ...prev,
          {
            id: aiMsgId,
            role: 'assistant',
            content: cachedResponse,
            actionType: action as any,
            timestamp: Date.now(),
          },
        ]);
        setIsAiLoading(false);
      }, 10);
      return cachedResponse;
    }

    try {
      const historyPayload = aiMessages
        .filter((m) => m.id !== 'welcome' && !m.isError)
        .slice(-4)
        .map((m) => ({ role: m.role, content: m.content }));

      const personalizedContext = buildPersonalizedAiContext(personalizationProfile, {
        action,
        code: activeTargetCode,
        language: activeTargetLang,
      });

      const activeFile = (overrides as any)?.file || (overrides as any)?.fileName || fileName || 'active_file';
      const activeModule = (overrides as any)?.module || ProjectMemoryService.extractModuleName(activeFile);
      const relevantMemories = ProjectMemoryService.getRelevantMemory({
        file: activeFile,
        module: activeModule,
        category: action,
        query: question,
        code: activeTargetCode,
      });
      const formattedProjectRules = ProjectMemoryService.formatContextForAI(relevantMemories);

      const payload = {
        action,
        code: activeTargetCode,
        language: activeTargetLang,
        file: activeFile,
        fileName: activeFile,
        module: activeModule,
        metrics: analysis?.metrics,
        issues: analysis?.smells,
        question,
        learningLevel: personalizedContext.effectiveLevel,
        personalization: {
          knowledgeLevel: personalizedContext.effectiveLevel,
          explanationDepth: personalizedContext.depthScore,
          systemDirective: personalizedContext.systemDirective,
          preferences: personalizationProfile.preferences,
          skillDimensions: personalizationProfile.skill_dimensions,
        },
        projectMemory: relevantMemories,
        formattedProjectRules,
        history: historyPayload,
      };

      // Try streaming endpoint first for real-time progressive response
      const streamRes = await fetch('/api/ai/pulse/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });

      if (streamRes.ok && streamRes.body) {
        let accumulatedText = '';
        let assistantMessageAdded = false;

        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.text) {
                  accumulatedText += parsed.text;

                  if (!assistantMessageAdded) {
                    assistantMessageAdded = true;
                    setAiMessages((prev) => [
                      ...prev,
                      {
                        id: aiMsgId,
                        role: 'assistant',
                        content: accumulatedText,
                        actionType: action as any,
                        timestamp: Date.now(),
                      },
                    ]);
                  } else {
                    setAiMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === aiMsgId ? { ...msg, content: accumulatedText } : msg
                      )
                    );
                  }
                }
              } catch (e) {
                // Ignore partial chunk parse failures
              }
            }
          }
        }

        if (accumulatedText.trim().length > 0) {
          clientAiCacheRef.current.set(cacheKey, accumulatedText);
          setIsAiLoading(false);
          aiAbortControllerRef.current = null;
          return accumulatedText;
        }
      }

      // Fallback to standard endpoint if streaming didn't produce text
      const fallbackRes = await fetch('/api/ai/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });

      const data = await fallbackRes.json();
      if (!fallbackRes.ok) {
        throw new Error(data.error || 'Failed to receive AI intelligence.');
      }

      const responseText = data.text || 'No response returned.';
      clientAiCacheRef.current.set(cacheKey, responseText);

      setAiMessages((prev) => {
        const existingIdx = prev.findIndex((m) => m.id === aiMsgId);
        if (existingIdx !== -1) {
          return prev.map((m) => (m.id === aiMsgId ? { ...m, content: responseText } : m));
        }
        return [
          ...prev,
          {
            id: aiMsgId,
            role: 'assistant',
            content: responseText,
            actionType: action as any,
            timestamp: Date.now(),
          },
        ];
      });

      setIsAiLoading(false);
      aiAbortControllerRef.current = null;
      return responseText;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setIsAiLoading(false);
        return null;
      }

      console.error('Pulse AI error:', err);
      const errorMsg = err.message || 'Could not connect to AI engine.';

      setAiMessages((prev) => [
        ...prev.filter((m) => m.id !== aiMsgId),
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: errorMsg,
          isError: true,
          actionType: action as any,
          retryAction: {
            action: action as any,
            question,
          },
          timestamp: Date.now(),
        },
      ]);

      setIsAiLoading(false);
      aiAbortControllerRef.current = null;
      return null;
    }
  };

  const retryAiRequest = async (action: AIActionType, prompt?: string) => {
    return sendAiRequest(action, prompt);
  };

  const clearAiHistory = () => {
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
      aiAbortControllerRef.current = null;
    }
    setIsAiLoading(false);
    setAiMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          "Conversation history cleared. How can Pulse AI assist you with your codebase?",
        timestamp: Date.now(),
      },
    ]);
  };

  // Ask Your Codebase Deterministic & Grounded Repository Intelligence
  const askCodebase = async (
    query: string,
    customContext?: Partial<CodebaseQueryContext>
  ): Promise<AskResult> => {
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
      aiAbortControllerRef.current = null;
    }

    setIsAiLoading(true);
    const userMsgId = `user-${Date.now()}`;
    const aiMsgId = `ai-${Date.now()}`;

    setAiMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: 'user',
        content: query,
        actionType: 'explain',
        timestamp: Date.now(),
      },
    ]);

    const findings = normalizeCodeSmells(analysis?.smells || [], fileName, analysis?.metrics);
    const graph = activeEvidenceGraph || EvidenceGraphService.buildGraph(analysis, findings, code, fileName);

    const context: CodebaseQueryContext = {
      activeFile: fileName,
      activeLanguage: language,
      activeCode: code,
      developerLevel: personalizationProfile.knowledge_level as any,
      explanationDepth:
        personalizationProfile.preferences?.explanation_depth === 'high'
          ? 5
          : personalizationProfile.preferences?.explanation_depth === 'low'
          ? 2
          : 3,
      ...customContext,
    };

    const result = await RepositoryIntelligenceService.queryCodebase(
      query,
      context,
      graph,
      findings,
      analysis,
      code,
      fileName
    );

    setLastAskResult(result);

    const citationsText =
      result.citations.length > 0
        ? `\n\n---\n**📚 Grounded Code Citations:**\n` +
          result.citations
            .map((c) => `- \`${c.file}${c.line ? `:${c.line}` : ''}\`${c.symbol ? ` — Symbol \`${c.symbol}\`` : ''}`)
            .join('\n')
        : '';

    const followUpsText =
      result.suggestedFollowUps && result.suggestedFollowUps.length > 0
        ? `\n\n💡 **Suggested follow-up questions:**\n` +
          result.suggestedFollowUps.map((f) => `- *${f}*`).join('\n')
        : '';

    const fullContent = `${result.groundedAnswer}${citationsText}${followUpsText}`;

    setAiMessages((prev) => [
      ...prev,
      {
        id: aiMsgId,
        role: 'assistant',
        content: fullContent,
        actionType: 'explain',
        timestamp: Date.now(),
      },
    ]);

    setIsAiLoading(false);
    return result;
  };

  return (
    <AppContext.Provider
      value={{
        code,
        setCode,
        fileName,
        setFileName,
        language,
        setLanguage,
        isAutoDetect,
        setIsAutoDetect,
        analysis,
        isAnalyzing,
        activeTab,
        setActiveTab,
        selectedSmell,
        setSelectedSmell,
        theme,
        setTheme,
        effectiveTheme,
        accessibility,
        updateAccessibility,
        resetAccessibility,
        loadPreset,
        runAnalysis,
        analyzeCurrentCode,
        aiMessages,
        setAiMessages,
        isAiLoading,
        setIsAiLoading,
        sendAiRequest,
        retryAiRequest,
        clearAiHistory,
        askCodebase,
        lastAskResult,
        setLastAskResult,
        activeEvidenceGraph,
        isSettingsOpen,
        setIsSettingsOpen,
        isCommandMenuOpen,
        setIsCommandMenuOpen,
        isCheatSheetOpen,
        setIsCheatSheetOpen,
        isOnboardingOpen,
        setIsOnboardingOpen,
        isExportModalOpen,
        setIsExportModalOpen,
        isDirty,
        setIsDirty,
        pendingAction,
        setPendingAction,
        confirmPendingAction,
        cancelPendingAction,
        cancelAiRequest,

        user,
        userProfile,
        setUserProfile,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isGuest: !user,

        isHistoryOpen,
        setIsHistoryOpen,
        isWorkspaceModalOpen,
        setIsWorkspaceModalOpen,

        isFixModalOpen,
        setIsFixModalOpen,
        activeFixSmell,
        setActiveFixSmell,
        openFixModalForSmell,

        personalizationProfile,
        updatePersonalizationProfile,
        isQuestionnaireOpen,
        setIsQuestionnaireOpen,

        isMascotSheetOpen,
        setIsMascotSheetOpen,

        isFocusMode,
        setIsFocusMode,
        toggleFocusMode,

        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
