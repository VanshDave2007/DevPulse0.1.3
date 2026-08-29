import React from 'react';
import { ShieldCheck, Zap, Wrench, FileCode, CheckCircle2, BookOpen } from 'lucide-react';
import { CodeMetrics } from '../types';

interface HealthScoreGaugeProps {
  score: number;
  metrics: CodeMetrics;
  size?: number;
}

export const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = ({ score, metrics, size = 180 }) => {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  let colorClass = '#2DD4BF'; // teal
  let statusText = 'Optimal Health';
  let badgeBg = 'bg-teal-500/10 text-teal-400 border-teal-500/30';

  if (clampedScore < 50) {
    colorClass = '#FB7185'; // danger
    statusText = 'Critical Risk';
    badgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  } else if (clampedScore < 75) {
    colorClass = '#FBBF24'; // warning
    statusText = 'Needs Attention';
    badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  } else if (clampedScore < 90) {
    colorClass = '#34D399'; // success
    statusText = 'Stable Health';
    badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  }

  const subMetrics = [
    { label: 'Complexity', value: metrics.scoreBreakdown.complexity, icon: Zap },
    { label: 'Maintainability', value: metrics.scoreBreakdown.maintainability, icon: Wrench },
    { label: 'Structure', value: metrics.scoreBreakdown.structure, icon: FileCode },
    { label: 'Quality', value: metrics.scoreBreakdown.quality, icon: CheckCircle2 },
    { label: 'Security', value: metrics.scoreBreakdown.security, icon: ShieldCheck },
    { label: 'Docs', value: metrics.scoreBreakdown.documentation, icon: BookOpen },
  ];

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-pulse-surface border border-pulse-subtle rounded-2xl shadow-xl transition-colors">
      {/* Top Tagline */}
      <div className="text-center mb-4">
        <span className="text-[11px] font-mono uppercase tracking-widest text-pulse-muted">Codebase Health Observatory</span>
        <h3 className="text-lg font-bold text-pulse-primary mt-0.5">Overall System Pulse</h3>
      </div>

      {/* Radial Gauge */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            className="text-pulse-elevated"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colorClass}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold font-mono text-pulse-primary tracking-tight">{clampedScore}</span>
          <span className="text-[10px] font-mono text-pulse-muted uppercase tracking-wider mt-0.5">Health Index</span>
        </div>
      </div>

      {/* Status Pill */}
      <div className="mt-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${badgeBg}`}>
          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse" />
          {statusText}
        </span>
      </div>

      {/* Sub-Score Strips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full mt-6 pt-5 border-t border-pulse-subtle">
        {subMetrics.map((item, idx) => {
          const Icon = item.icon;
          const scoreColor =
            item.value >= 85 ? 'text-teal-600 dark:text-teal-400' :
            item.value >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';
          return (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-pulse-elevated border border-pulse-subtle"
            >
              <div className="flex items-center space-x-1.5">
                <Icon className="h-3.5 w-3.5 text-pulse-muted" />
                <span className="text-xs text-pulse-secondary">{item.label}</span>
              </div>
              <span className={`text-xs font-mono font-bold ${scoreColor}`}>{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
