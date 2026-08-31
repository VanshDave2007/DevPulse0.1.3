import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { DevPulseMascotSvg, MascotPose, MascotTheme } from './mascot/DevPulseMascotSvg';

export type MascotMood =
  | MascotPose
  | 'neutral'
  | 'idle'
  | 'thinking'
  | 'analyzing'
  | 'streaming'
  | 'happy'
  | 'curious'
  | 'concerned'
  | 'celebrating'
  | 'helping'
  | 'sleeping'
  | 'waking'
  | 'security_alert'
  | 'vulnerability_found'
  | 'code_fixed'
  | 'learning'
  | 'ai_assistant'
  | 'architecture'
  | 'hero'
  | 'success'
  | 'creating'
  | 'coding'
  | 'guiding'
  | 'excited'
  | 'sad'
  | 'disappointed'
  | 'angry'
  | 'frustrated'
  | 'loading';

export type MascotSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface PulseMascotProps {
  mood?: MascotMood;
  pose?: MascotPose;
  size?: MascotSize;
  theme?: MascotTheme;
  className?: string;
  showBadge?: boolean;
  badgeText?: string;
  animate?: boolean;
  interactive?: boolean;
  tooltipText?: string;
  onClick?: () => void;
}

export const PulseMascot: React.FC<PulseMascotProps> = ({
  mood: propMood,
  pose: propPose,
  size = 'md',
  theme: propTheme,
  className = '',
  showBadge = false,
  badgeText,
  animate = true,
  interactive = true,
  tooltipText,
  onClick,
}) => {
  const { isAiLoading, isAnalyzing, analysis, fileName, theme: appTheme } = useApp();
  const [isWinking, setIsWinking] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [showQuickTip, setShowQuickTip] = useState(false);
  const lastInteractionRef = useRef<number>(Date.now());

  // Determine active color theme
  const activeTheme: MascotTheme =
    propTheme || (appTheme === 'light' ? 'light' : 'dark');

  // Inactivity tracking for Sleep mode
  useEffect(() => {
    if (isAiLoading || isAnalyzing) {
      setIsSleeping(false);
      setIsWakingUp(false);
      lastInteractionRef.current = Date.now();
      return;
    }

    const resetInactivity = () => {
      lastInteractionRef.current = Date.now();
      if (isSleeping) {
        setIsSleeping(false);
        setIsWakingUp(true);
        setTimeout(() => setIsWakingUp(false), 1200);
      }
    };

    const handleUserActivity = () => {
      resetInactivity();
    };

    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('click', handleUserActivity, { passive: true });

    const interval = setInterval(() => {
      if (!isAiLoading && !isAnalyzing && Date.now() - lastInteractionRef.current > 180000) {
        if (!isSleeping) {
          setIsSleeping(true);
        }
      }
    }, 15000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      clearInterval(interval);
    };
  }, [isAiLoading, isAnalyzing, isSleeping]);

  // Periodic subtle eye blinks during idle
  useEffect(() => {
    if (!animate || isSleeping || isAiLoading || isAnalyzing) return;

    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.4) {
        setIsWinking(true);
        setTimeout(() => setIsWinking(false), 220);
      }
    }, 5000);

    return () => clearInterval(blinkInterval);
  }, [animate, isSleeping, isAiLoading, isAnalyzing]);

  // Map any mood or state to one of the canonical 17 poses
  const resolvePose = (): MascotPose => {
    if (propPose) return propPose;
    const requested = propMood;

    if (isWakingUp) return 'happy';
    if (isAnalyzing || requested === 'analyzing') return 'analyzing';
    if (isAiLoading || requested === 'streaming' || requested === 'ai_assistant') return 'ai_assistant';

    if (requested) {
      switch (requested) {
        case 'idle':
        case 'neutral':
          return 'neutral';
        case 'hero':
          return 'hero';
        case 'success':
        case 'celebrating':
          return 'success';
        case 'creating':
        case 'coding':
          return 'creating';
        case 'guiding':
        case 'helping':
          return 'guiding';
        case 'happy':
        case 'curious':
          return 'happy';
        case 'excited':
          return 'excited';
        case 'sad':
        case 'disappointed':
          return 'sad';
        case 'angry':
        case 'frustrated':
          return 'angry';
        case 'security_alert':
          return 'security_alert';
        case 'vulnerability_found':
        case 'concerned':
          return 'vulnerability_found';
        case 'code_fixed':
          return 'code_fixed';
        case 'learning':
          return 'learning';
        case 'architecture':
          return 'architecture';
        case 'loading':
        case 'thinking':
          return 'loading';
        default:
          return (requested as MascotPose) || 'neutral';
      }
    }

    // Default dynamic state from active analysis
    const healthScore = analysis?.metrics.healthScore ?? 100;
    const criticalSmells = analysis?.summary.criticalCount ?? 0;

    if (criticalSmells > 0 || healthScore < 50) return 'vulnerability_found';
    if (healthScore >= 85) return 'success';
    if (healthScore >= 70) return 'happy';
    return 'neutral';
  };

  const effectivePose = resolvePose();

  // Size token map
  const sizeMap: Record<MascotSize, { width: number; height: number; scaleClass: string }> = {
    xs: { width: 24, height: 24, scaleClass: 'h-6 w-6' },
    sm: { width: 32, height: 32, scaleClass: 'h-8 w-8' },
    md: { width: 52, height: 52, scaleClass: 'h-13 w-13' },
    lg: { width: 84, height: 84, scaleClass: 'h-21 w-21' },
    xl: { width: 140, height: 140, scaleClass: 'h-35 w-35' },
    '2xl': { width: 220, height: 220, scaleClass: 'h-55 w-55' },
  };

  const currentSize = sizeMap[size];

  const handleClick = () => {
    setIsWinking(true);
    setTimeout(() => setIsWinking(false), 300);
    setShowQuickTip((prev) => !prev);
    if (onClick) onClick();
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${
        interactive ? 'cursor-pointer group' : ''
      } ${className}`}
      onClick={interactive ? handleClick : undefined}
      title={tooltipText || `DevPulse Mascot (${effectivePose})`}
      role={interactive ? 'button' : 'img'}
      aria-label={`DevPulse Robot Mascot`}
    >
      {/* Floating Aura on Hover */}
      {interactive && (
        <div className="absolute inset-0 rounded-full bg-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm pointer-events-none" />
      )}

      {/* SVG Character Model */}
      <DevPulseMascotSvg
        pose={effectivePose}
        theme={activeTheme}
        width={currentSize.width}
        height={currentSize.height}
        animate={animate}
        className={`transition-transform duration-200 ${
          interactive ? 'group-hover:scale-105 group-active:scale-95' : ''
        }`}
      />

      {/* Status Badge */}
      {showBadge && (
        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-teal-500 text-[#08110F] shadow-sm">
          {badgeText || (isAiLoading ? 'AI' : isAnalyzing ? 'Scan' : 'Ready')}
        </span>
      )}

      {/* Quick Interactive Speech Bubble on Click */}
      {showQuickTip && (
        <div
          className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2.5 rounded-xl bg-pulse-surface border border-teal-500/40 shadow-xl text-[11px] font-sans text-pulse-primary animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold font-mono text-teal-600 dark:text-teal-400 uppercase">
              DevPulse Companion
            </span>
            <button
              onClick={() => setShowQuickTip(false)}
              className="text-pulse-muted hover:text-pulse-primary text-[10px]"
            >
              ✕
            </button>
          </div>
          <p className="text-pulse-secondary leading-tight">
            {analysis
              ? `I'm monitoring ${fileName} (${analysis.metrics.healthScore}/100 health). Ask AI or run AST checks anytime!`
              : "I'm your friendly code intelligence robot. Paste some code or load a sample!"}
          </p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-pulse-surface" />
        </div>
      )}
    </div>
  );
};

export interface MascotBubbleProps {
  mood?: MascotMood;
  pose?: MascotPose;
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  onClose?: () => void;
  className?: string;
}

export const MascotBubble: React.FC<MascotBubbleProps> = ({
  mood = 'guiding',
  pose,
  title = 'Pulse Developer Companion',
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  onClose,
  className = '',
}) => {
  return (
    <div
      className={`p-4 sm:p-5 rounded-3xl bg-pulse-surface border border-teal-500/30 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fadeIn ${className}`}
    >
      <div className="shrink-0 flex items-center space-x-3 sm:space-x-0">
        <PulseMascot mood={mood} pose={pose} size="md" />
        <div className="sm:hidden">
          <h4 className="text-xs font-bold text-pulse-primary font-mono">{title}</h4>
          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">Your coding mentor</span>
        </div>
      </div>

      <div className="flex-1 space-y-1">
        <div className="hidden sm:flex items-center space-x-2">
          <h4 className="text-xs font-bold text-pulse-primary font-mono">{title}</h4>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-300 font-semibold">
            Mentor Tip
          </span>
        </div>
        <p className="text-xs text-pulse-secondary leading-relaxed">{message}</p>
      </div>

      {(actionLabel || secondaryActionLabel || onClose) && (
        <div className="flex items-center space-x-2 shrink-0 pt-1 sm:pt-0 w-full sm:w-auto justify-end">
          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="px-3 py-1.5 rounded-xl border border-pulse-subtle bg-pulse-elevated hover:bg-pulse-elevated-hover text-xs font-semibold text-pulse-secondary hover:text-pulse-primary transition cursor-pointer"
            >
              {secondaryActionLabel}
            </button>
          )}

          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-sm cursor-pointer"
            >
              {actionLabel}
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-pulse-muted hover:text-pulse-primary hover:bg-pulse-elevated transition cursor-pointer"
              title="Dismiss message"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
};
