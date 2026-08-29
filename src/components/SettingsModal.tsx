import React, { useMemo, useState } from 'react';
import {
  Check,
  Eye,
  GraduationCap,
  Laptop,
  Moon,
  RotateCcw,
  Settings,
  Sun,
  Type,
  X,
  Zap,
  Mail,
  Trash2,
  ShieldAlert,
  Database,
  User,
  Sliders,
  Sparkles,
  HelpCircle,
  BookOpen,
  Keyboard,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { KnowledgeLevel, ThemeMode } from '../types';
import { purgeAllUserDataFromCloudSql, updateCloudSqlUserProfile } from '../services/db-sync';
import { ProjectMemoryService } from '../services/projectMemoryService';
import { ProjectMemoryModal } from './ProjectMemoryModal';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    theme,
    setTheme,
    accessibility,
    updateAccessibility,
    resetAccessibility,
    user,
    userProfile,
    setUserProfile,
    personalizationProfile,
    updatePersonalizationProfile,
    setIsQuestionnaireOpen,
    setIsCheatSheetOpen,
  } = useApp();

  const [emailAlerts, setEmailAlerts] = useState<boolean>(true);
  const [purgeLoading, setPurgeLoading] = useState<boolean>(false);
  const [purgeSuccess, setPurgeSuccess] = useState<boolean>(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState<boolean>(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState<boolean>(false);

  const handleLevelChange = (level: KnowledgeLevel) => {
    updatePersonalizationProfile({
      knowledge_level: level,
      settings: {
        manually_selected_level: true,
      },
    });
  };

  const handleTogglePreference = (key: keyof typeof personalizationProfile.preferences, val: boolean) => {
    updatePersonalizationProfile({
      preferences: {
        ...personalizationProfile.preferences,
        [key]: val,
      },
    });
  };

  const handleDepthChange = (depth: number) => {
    updatePersonalizationProfile({
      preferences: {
        ...personalizationProfile.preferences,
        explanation_depth: depth,
      },
    });
  };

  const handleToggleEmailAlerts = async (enabled: boolean) => {
    setEmailAlerts(enabled);
    if (user) {
      try {
        await updateCloudSqlUserProfile({ emailAlertsEnabled: enabled ? 'true' : 'false' });
        if (userProfile) {
          setUserProfile({ ...userProfile, updatedAt: Date.now() });
        }
      } catch (e) {
        console.warn('Failed to update email alert preferences:', e);
      }
    }
  };

  const handlePurgeAllData = async () => {
    setPurgeLoading(true);
    try {
      if (user) {
        await purgeAllUserDataFromCloudSql();
      }
      localStorage.removeItem('devpulse_local_history');
      setPurgeSuccess(true);
      setShowPurgeConfirm(false);
      setTimeout(() => setPurgeSuccess(false), 3000);
    } catch (err) {
      console.warn('Purge data failed:', err);
    } finally {
      setPurgeLoading(false);
    }
  };

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-2xl overflow-hidden animate-fadeIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-pulse-bg border-b border-pulse-subtle">
          <div className="flex items-center space-x-2.5">
            <Settings className="h-5 w-5 text-teal-500 dark:text-teal-400" />
            <h2 id="settings-dialog-title" className="text-base font-bold text-pulse-primary">
              Settings & Workspace Preferences
            </h2>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 rounded-lg text-pulse-muted hover:text-pulse-primary hover:bg-pulse-elevated transition cursor-pointer"
            aria-label="Close Settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Account & Cloud SQL Status */}
          <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-pulse-primary">
                  {user ? (user.displayName || user.email) : 'Guest Workspace'}
                </h4>
                <p className="text-[10px] text-pulse-muted">
                  {user ? 'Cloud SQL PostgreSQL Sync Active' : 'Local browser storage only'}
                </p>
              </div>
            </div>
            {user && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                Verified
              </span>
            )}
          </div>

          {/* Theme Section */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase text-pulse-muted font-bold block">
              Color Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'dark' as ThemeMode, label: 'Dark Observatory', icon: Moon },
                { id: 'light' as ThemeMode, label: 'Light Clean', icon: Sun },
                { id: 'system' as ThemeMode, label: 'System Match', icon: Laptop },
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-teal-500/20 border-teal-500 text-teal-600 dark:text-teal-300 font-semibold'
                        : 'bg-pulse-elevated border-pulse-subtle text-pulse-secondary hover:text-pulse-primary'
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-1.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Developer Knowledge Section */}
          <div className="space-y-4 pt-2 border-t border-pulse-subtle">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-mono uppercase text-pulse-muted font-bold block">
                  Developer Knowledge
                </label>
                <p className="text-[11px] text-pulse-muted">
                  Current level: <strong className="text-teal-600 dark:text-teal-400 capitalize">{personalizationProfile.knowledge_level}</strong>
                  {personalizationProfile.questionnaire && (
                    <span> · Recommended: <span className="capitalize">{personalizationProfile.questionnaire.recommended_level}</span> ({personalizationProfile.questionnaire.total_score}/25)</span>
                  )}
                </p>
              </div>

              {personalizationProfile.settings.manually_selected_level ? (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold">
                  Manual Override Active
                </span>
              ) : personalizationProfile.questionnaire ? (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30 font-semibold">
                  Questionnaire Recommended
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-pulse-elevated text-pulse-muted border border-pulse-subtle">
                  Standard Default
                </span>
              )}
            </div>

            {/* Knowledge Level Selector */}
            <div className="grid grid-cols-3 gap-2.5">
              {[
                {
                  id: 'beginner' as KnowledgeLevel,
                  label: 'Beginner',
                  desc: 'Everyday analogies, definitions, step-by-step reasoning',
                  icon: '🌱',
                },
                {
                  id: 'intermediate' as KnowledgeLevel,
                  label: 'Intermediate',
                  desc: 'Pragmatic refactoring, trade-offs, before/after code',
                  icon: '⚡',
                },
                {
                  id: 'expert' as KnowledgeLevel,
                  label: 'Expert',
                  desc: 'Technical brevity, Big-O metrics, architecture trade-offs',
                  icon: '🚀',
                },
              ].map((lvl) => {
                const isSelected = personalizationProfile.knowledge_level === lvl.id;
                const isRecommended = personalizationProfile.questionnaire?.recommended_level === lvl.id;

                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => handleLevelChange(lvl.id)}
                    className={`relative flex flex-col items-start p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-teal-500/15 border-teal-500 text-pulse-primary ring-1 ring-teal-500/30'
                        : 'bg-pulse-elevated border-pulse-subtle text-pulse-secondary hover:border-pulse-strong hover:text-pulse-primary'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-sm font-bold flex items-center space-x-1.5">
                        <span>{lvl.icon}</span>
                        <span className="capitalize">{lvl.label}</span>
                      </span>
                      <div
                        className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-teal-500 bg-teal-500' : 'border-pulse-muted'
                        }`}
                      >
                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-[#08110F]" />}
                      </div>
                    </div>

                    <p className="text-[10px] text-pulse-muted leading-relaxed mt-0.5">{lvl.desc}</p>

                    {isRecommended && (
                      <span className="mt-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/30 font-semibold">
                        Recommended ({personalizationProfile.questionnaire?.total_score}/25)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation Depth Slider */}
            <div className="p-3.5 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-pulse-primary">
                  Explanation Depth (Level {personalizationProfile.preferences.explanation_depth}/5)
                </span>
                <span className="text-[10px] font-mono text-pulse-muted">
                  {personalizationProfile.preferences.explanation_depth <= 2 && 'Concise technical summary'}
                  {personalizationProfile.preferences.explanation_depth === 3 && 'Balanced context & examples'}
                  {personalizationProfile.preferences.explanation_depth >= 4 && 'Deep walkthrough & guided learning'}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={personalizationProfile.preferences.explanation_depth}
                onChange={(e) => handleDepthChange(Number(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>

            {/* Output Preferences Toggles */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { key: 'show_examples' as const, label: 'Show code examples' },
                { key: 'show_explanations' as const, label: 'Show explanations' },
                { key: 'show_recommendations' as const, label: 'Show recommendations' },
                { key: 'show_diagrams' as const, label: 'Show flow diagrams' },
              ].map((pref) => (
                <label
                  key={pref.key}
                  className="flex items-center space-x-2 p-2.5 rounded-xl bg-pulse-elevated border border-pulse-subtle cursor-pointer hover:border-teal-500/30 transition text-xs text-pulse-primary"
                >
                  <input
                    type="checkbox"
                    checked={personalizationProfile.preferences[pref.key]}
                    onChange={(e) => handleTogglePreference(pref.key, e.target.checked)}
                    className="h-4 w-4 accent-teal-500 cursor-pointer"
                  />
                  <span>{pref.label}</span>
                </label>
              ))}
            </div>

            {/* Retake Questionnaire Action */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-pulse-elevated/70 border border-pulse-subtle">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-500">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-pulse-primary">Knowledge Setup Questionnaire</h4>
                  <p className="text-[10px] text-pulse-muted">
                    {personalizationProfile.questionnaire
                      ? `5-question score: ${personalizationProfile.questionnaire.total_score}/25 (Recommended: ${personalizationProfile.questionnaire.recommended_level})`
                      : 'Take the 1-minute 5-question questionnaire to calibrate DevPulse'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsQuestionnaireOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-600 dark:text-teal-300 text-xs font-bold transition cursor-pointer shrink-0"
              >
                {personalizationProfile.questionnaire ? 'Retake Questionnaire' : 'Start Questionnaire'}
              </button>
            </div>
          </div>

          {/* Security & Gmail Alerts */}
          <div className="space-y-3 pt-2 border-t border-pulse-subtle">
            <label className="text-xs font-mono uppercase text-pulse-muted font-bold block">
              Security & Notifications
            </label>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-pulse-elevated border border-pulse-subtle">
              <div className="flex items-center space-x-2.5">
                <Mail className="h-4 w-4 text-teal-500 dark:text-teal-400" />
                <div>
                  <h4 className="text-xs font-semibold text-pulse-primary">Gmail Vulnerability Alerts</h4>
                  <p className="text-[10px] text-pulse-muted">Alert via email when critical security findings are identified</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => handleToggleEmailAlerts(e.target.checked)}
                className="h-4 w-4 accent-teal-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Visual Accessibility */}
          <div className="space-y-3 pt-2 border-t border-pulse-subtle">
            <label className="text-xs font-mono uppercase text-pulse-muted font-bold block">
              Visual Accessibility
            </label>

            {/* High Contrast */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-pulse-elevated border border-pulse-subtle">
              <div className="flex items-center space-x-2.5">
                <Eye className="h-4 w-4 text-teal-500 dark:text-teal-400" />
                <div>
                  <h4 className="text-xs font-semibold text-pulse-primary">High Contrast Mode</h4>
                  <p className="text-[10px] text-pulse-muted">Enhanced element outlines and border luminance</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={accessibility.highContrast}
                onChange={(e) => updateAccessibility({ highContrast: e.target.checked })}
                className="h-4 w-4 accent-teal-500 cursor-pointer"
              />
            </div>

            {/* Reduce Motion */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-pulse-elevated border border-pulse-subtle">
              <div className="flex items-center space-x-2.5">
                <Zap className="h-4 w-4 text-teal-500 dark:text-teal-400" />
                <div>
                  <h4 className="text-xs font-semibold text-pulse-primary">Reduce Animations</h4>
                  <p className="text-[10px] text-pulse-muted">Disable pulsing effects and transitions</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={accessibility.reduceMotion}
                onChange={(e) => updateAccessibility({ reduceMotion: e.target.checked })}
                className="h-4 w-4 accent-teal-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Code Editor Preferences */}
          <div className="space-y-3 pt-2 border-t border-pulse-subtle">
            <label className="text-xs font-mono uppercase text-pulse-muted font-bold block">
              Code Editor Preferences
            </label>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-pulse-elevated border border-pulse-subtle">
              <span className="text-xs text-pulse-primary">Editor Font Size ({accessibility.editorFontSize}px)</span>
              <input
                type="range"
                min={11}
                max={20}
                value={accessibility.editorFontSize}
                onChange={(e) => updateAccessibility({ editorFontSize: Number(e.target.value) })}
                className="w-32 accent-teal-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-pulse-elevated border border-pulse-subtle">
              <span className="text-xs text-pulse-primary">Word Wrap</span>
              <input
                type="checkbox"
                checked={accessibility.editorWordWrap}
                onChange={(e) => updateAccessibility({ editorWordWrap: e.target.checked })}
                className="h-4 w-4 accent-teal-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Project Intelligence & Continuous Memory */}
          <div className="space-y-3 pt-2 border-t border-pulse-subtle">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase text-pulse-muted font-bold block flex items-center space-x-1.5">
                <BookOpen className="h-3.5 w-3.5 text-teal-400" />
                <span>Project Intelligence & Memory</span>
              </label>
              <button
                onClick={() => setIsMemoryModalOpen(true)}
                className="text-[11px] font-mono text-teal-600 dark:text-teal-400 hover:underline flex items-center space-x-1 font-semibold cursor-pointer"
              >
                <span>Manage All ({ProjectMemoryService.getProjectMemory().length})</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle space-y-3">
              <div className="space-y-2">
                {ProjectMemoryService.getProjectMemory()
                  .filter((m) => m.status === 'ACTIVE' || m.status === 'CONFIRMED' || m.status === 'APPROVED')
                  .slice(0, 3)
                  .map((mem) => (
                    <div
                      key={mem.memoryId}
                      className="p-2.5 rounded-xl bg-pulse-surface border border-pulse-subtle space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-pulse-primary">{mem.title}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20 uppercase">
                            {mem.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-pulse-muted">
                          {mem.scope}
                        </span>
                      </div>
                      <p className="text-pulse-secondary text-[11px] leading-relaxed">
                        {mem.content}
                      </p>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => setIsMemoryModalOpen(true)}
                className="w-full py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-600 dark:text-teal-300 text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Open Project Memory & Context Manager</span>
              </button>
            </div>
          </div>

          {/* Privacy & Purge Data */}
          <div className="space-y-2 pt-2 border-t border-pulse-subtle">
            <label className="text-xs font-mono uppercase text-pulse-muted font-bold block">
              Data & Privacy Compliance
            </label>

            {purgeSuccess ? (
              <div className="p-3 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs flex items-center space-x-2">
                <Check className="h-4 w-4 text-teal-500" />
                <span>All analysis history and AI chat records successfully purged.</span>
              </div>
            ) : showPurgeConfirm ? (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                <p className="text-xs text-rose-500 font-semibold">
                  Are you sure you want to permanently delete all saved analyses and AI chats?
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePurgeAllData}
                    disabled={purgeLoading}
                    className="px-3 py-1 bg-rose-500 text-white rounded-lg text-xs font-bold hover:bg-rose-600 transition cursor-pointer"
                  >
                    {purgeLoading ? 'Purging...' : 'Yes, Delete Everything'}
                  </button>
                  <button
                    onClick={() => setShowPurgeConfirm(false)}
                    className="px-3 py-1 bg-pulse-elevated text-pulse-muted rounded-lg text-xs hover:text-pulse-primary transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowPurgeConfirm(true)}
                className="w-full flex items-center justify-center space-x-2 p-2.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Purge All My Analysis & Chat Data</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-pulse-bg border-t border-pulse-subtle">
          <div className="flex items-center space-x-3">
            <button
              onClick={resetAccessibility}
              className="flex items-center space-x-1.5 text-xs text-pulse-muted hover:text-rose-500 transition font-mono cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              onClick={() => {
                setIsSettingsOpen(false);
                setIsCheatSheetOpen(true);
              }}
              className="flex items-center space-x-1.5 text-xs text-pulse-muted hover:text-teal-400 transition font-mono cursor-pointer"
              title="Open Shortcuts Cheat Sheet (Shift + ?)"
            >
              <Keyboard className="h-3.5 w-3.5" />
              <span>Shortcuts (Shift+?)</span>
            </button>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Save & Close
          </button>
        </div>
      </div>

      <ProjectMemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
      />
    </div>
  );
};
