/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { AnalyzerView } from './components/AnalyzerView';
import { CodeHealthView } from './components/CodeHealthView';
import { PulseMapView } from './components/PulseMapView';
import { DependencyPulseView } from './components/DependencyPulseView';
import { PulseAIView } from './components/PulseAIView';
import { LearnModeView } from './components/LearnModeView';
import { AgenticReviewView } from './components/AgenticReviewView';
import { PerformanceDashboardView } from './components/PerformanceDashboardView';
import { AboutView } from './components/AboutView';
import { SettingsModal } from './components/SettingsModal';
import { CommandMenu } from './components/CommandMenu';
import { OnboardingModal } from './components/OnboardingModal';
import { UnsavedChangesModal } from './components/UnsavedChangesModal';
import { ExportModal } from './components/ExportModal';
import { AuthModal } from './components/AuthModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { WorkspaceModal } from './components/WorkspaceModal';
import { FixModal } from './components/FixModal';
import { QuestionnaireModal } from './components/QuestionnaireModal';
import { MascotSheetModal } from './components/MascotSheetModal';
import { CheatSheetModal } from './components/CheatSheetModal';
import { FocusModeBar } from './components/FocusModeBar';
import { ToastContainer } from './components/Toast';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    isFocusMode,
    setIsFocusMode,
    toggleFocusMode,
    isExportModalOpen,
    setIsExportModalOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isHistoryOpen,
    setIsHistoryOpen,
    isWorkspaceModalOpen,
    setIsWorkspaceModalOpen,
    isFixModalOpen,
    setIsFixModalOpen,
    activeFixSmell,
    isMascotSheetOpen,
    setIsMascotSheetOpen,
    isCheatSheetOpen,
    setIsCheatSheetOpen,
    isSettingsOpen,
    isCommandMenuOpen,
    isOnboardingOpen,
    toasts,
    removeToast,
  } = useApp();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('devpulse_sidebar_collapsed');
      if (saved !== null) return saved === 'true';
      // Default to collapsed on tablet viewports (768px - 1023px)
      return window.innerWidth < 1024 && window.innerWidth >= 768;
    }
    return false;
  });

  // Persist sidebar collapsed preference
  useEffect(() => {
    localStorage.setItem('devpulse_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Global Keyboard Shortcuts: Ctrl+\ for Sidebar, Alt+F / Ctrl+Shift+F for Focus Mode, Esc for exiting Focus Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Sidebar: Ctrl+\ or Cmd+\
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }

      // Toggle Focus Mode: Alt+F or Ctrl+Shift+F
      if (
        (e.altKey && e.key.toLowerCase() === 'f') ||
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f')
      ) {
        e.preventDefault();
        toggleFocusMode();
      }

      // Exit Focus Mode on Escape if no other modal is currently active
      if (e.key === 'Escape' && isFocusMode) {
        const anyModalOpen =
          isSettingsOpen ||
          isCommandMenuOpen ||
          isCheatSheetOpen ||
          isOnboardingOpen ||
          isExportModalOpen ||
          isAuthModalOpen ||
          isHistoryOpen ||
          isWorkspaceModalOpen ||
          isFixModalOpen ||
          isMascotSheetOpen;

        if (!anyModalOpen) {
          e.preventDefault();
          setIsFocusMode(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isFocusMode,
    toggleFocusMode,
    setIsFocusMode,
    isSettingsOpen,
    isCommandMenuOpen,
    isCheatSheetOpen,
    isOnboardingOpen,
    isExportModalOpen,
    isAuthModalOpen,
    isHistoryOpen,
    isWorkspaceModalOpen,
    isFixModalOpen,
    isMascotSheetOpen,
  ]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] flex font-sans transition-colors duration-200">
      {/* Left-Hand Vertical Sidebar (Hidden during Focus Mode) */}
      {!isFocusMode && (
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
      )}

      {/* Main Column: Top Bar + Content Workspace + Footer */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isFocusMode ? 'pl-0' : isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        {/* Floating HUD when Focus Mode is active */}
        {isFocusMode && <FocusModeBar />}

        {/* Sticky Top Header (Hidden during Focus Mode) */}
        {!isFocusMode && (
          <Navbar
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            isSidebarCollapsed={isSidebarCollapsed}
          />
        )}

        {/* Main Workspace Body (Expanded full-width and full-viewport during Focus Mode) */}
        <main
          key={activeTab}
          className={`flex-1 w-full transition-all duration-300 ${
            isFocusMode
              ? 'max-w-none px-3 sm:px-6 lg:px-8 py-3 sm:py-5 pt-14 sm:pt-16'
              : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'
          } animate-fadeIn`}
        >
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'analyzer' && <AnalyzerView />}
          {activeTab === 'agent-review' && <AgenticReviewView />}
          {activeTab === 'health' && <CodeHealthView />}
          {activeTab === 'pulse-map' && <PulseMapView />}
          {activeTab === 'dependencies' && <DependencyPulseView />}
          {activeTab === 'pulse-ai' && <PulseAIView />}
          {activeTab === 'learn' && <LearnModeView />}
          {activeTab === 'performance' && <PerformanceDashboardView />}
          {activeTab === 'about' && <AboutView />}
        </main>

        {/* Footer (Hidden during Focus Mode for zero clutter) */}
        {!isFocusMode && (
          <footer className="border-t border-pulse-subtle bg-pulse-surface/40 py-6 text-center text-xs text-pulse-secondary mt-auto">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="font-mono">
                DEV<span className="text-pulse-accent">PULSE</span> · Code Intelligence Platform
              </p>
              <p className="text-[11px] text-pulse-muted font-mono">
                © 2026 Vansh Dave. All Rights Reserved.
              </p>
            </div>
          </footer>
        )}
      </div>

      {/* Settings & Accessibility Modal */}
      <SettingsModal />

      {/* Quick Command Menu (Ctrl+K) */}
      <CommandMenu />

      {/* First-Use Guidance & Tour Modal */}
      <OnboardingModal />

      {/* Unsaved Changes Protection Modal */}
      <UnsavedChangesModal />

      {/* Export Report & Findings Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Authentication & User Account Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Analysis History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* Google Workspace Integration Hub */}
      <WorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
      />

      {/* AI Fix Assistance Modal */}
      <FixModal
        isOpen={isFixModalOpen}
        onClose={() => setIsFixModalOpen(false)}
        smell={activeFixSmell}
      />

      {/* Knowledge Assessment Questionnaire Modal */}
      <QuestionnaireModal />

      {/* DevPulse Mascot Character Design Sheet Modal (17 Poses QA) */}
      <MascotSheetModal
        isOpen={isMascotSheetOpen}
        onClose={() => setIsMascotSheetOpen(false)}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal (Shift + ?) */}
      <CheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
      />

      {/* Global Toast Notification System */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
