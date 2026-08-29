import React, { useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Sparkles,
  Download,
} from 'lucide-react';
import { ToastNotification, ToastType } from '../types';

interface ToastProps {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
}

export const ToastItem: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const duration = toast.duration ?? 4000;
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const getIcon = (type?: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-teal-500 shrink-0" />;
    }
  };

  const getBorderColor = (type?: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 bg-emerald-500/5';
      case 'error':
        return 'border-rose-500/30 bg-rose-500/5';
      case 'warning':
        return 'border-amber-500/30 bg-amber-500/5';
      case 'info':
      default:
        return 'border-teal-500/30 bg-teal-500/5';
    }
  };

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start space-x-3 w-full max-w-sm p-4 rounded-2xl bg-pulse-surface border ${getBorderColor(
        toast.type
      )} shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 animate-fadeIn`}
    >
      <div className="mt-0.5">{getIcon(toast.type)}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-pulse-primary leading-tight font-sans">
          {toast.title}
        </h4>
        {toast.description && (
          <p className="text-[11px] text-pulse-secondary mt-1 leading-relaxed">
            {toast.description}
          </p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 -mr-1 -mt-1 rounded-lg text-pulse-muted hover:text-pulse-primary hover:bg-pulse-elevated transition cursor-pointer"
        aria-label="Dismiss Notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 pointer-events-none max-w-md w-full px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
