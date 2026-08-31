import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const UnsavedChangesModal: React.FC = () => {
  const { pendingAction, confirmPendingAction, cancelPendingAction } = useApp();

  if (!pendingAction) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={cancelPendingAction}
    >
      <div
        className="w-full max-w-md bg-pulse-surface border border-pulse-subtle rounded-3xl shadow-2xl overflow-hidden animate-scaleUp p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30 shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-pulse-primary">{pendingAction.title}</h3>
            <p className="text-xs text-pulse-secondary leading-relaxed">
              {pendingAction.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-pulse-subtle">
          <button
            onClick={cancelPendingAction}
            className="px-4 py-2 rounded-xl border border-pulse-subtle text-xs font-semibold text-pulse-secondary hover:bg-pulse-elevated transition"
          >
            Cancel & Keep Editing
          </button>
          <button
            onClick={confirmPendingAction}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md shadow-rose-600/20"
          >
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  );
};
