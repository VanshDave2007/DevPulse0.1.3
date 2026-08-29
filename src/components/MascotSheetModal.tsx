import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Eye,
  Moon,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { DevPulseMascotSvg, MascotPose, MascotTheme } from './mascot/DevPulseMascotSvg';
import { PulseMascot } from './PulseMascot';

interface MascotSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_POSES: { id: MascotPose; name: string; desc: string; category: string }[] = [
  { id: 'hero', name: 'Hero / Default', desc: 'Front-facing brand mascot icon', category: 'Brand & Identity' },
  { id: 'success', name: 'Success / Trophy', desc: 'Holding golden trophy with celebratory sparkles', category: 'Action & Status' },
  { id: 'creating', name: 'Creating / Coding', desc: 'Holding stylus pencil with code bracket marks', category: 'Action & Status' },
  { id: 'guiding', name: 'Guiding / Pointing', desc: 'Extended arm pointing right, confident smile', category: 'Mentorship' },
  { id: 'happy', name: 'Happy / Joyful', desc: 'Curved happy eyes, big smile, cheerful blushes', category: 'Emotions' },
  { id: 'neutral', name: 'Neutral / Idle', desc: 'Friendly relaxed posture with floating capsule feet', category: 'Emotions' },
  { id: 'sad', name: 'Sad / Disappointed', desc: 'Drooping eyes with cute tear and lowered arms', category: 'Emotions' },
  { id: 'excited', name: 'Excited / Cheer', desc: 'Both arms raised high with celebratory marks', category: 'Emotions' },
  { id: 'angry', name: 'Angry / Frustrated', desc: 'Slanted eyebrows, hands on hips, frustration puff', category: 'Emotions' },
  { id: 'analyzing', name: 'Analyzing / Scanning', desc: 'Looking through magnifying glass at code', category: 'Diagnostics' },
  { id: 'security_alert', name: 'Security Alert', desc: 'Holding protective security shield in front', category: 'Diagnostics' },
  { id: 'vulnerability_found', name: 'Vulnerability Found', desc: 'Concerned expression pointing at warning triangle', category: 'Diagnostics' },
  { id: 'code_fixed', name: 'Code Fixed', desc: 'Holding glowing green checkmark repair badge', category: 'Action & Status' },
  { id: 'learning', name: 'Learning / Docs', desc: 'Holding open documentation book with code lines', category: 'Mentorship' },
  { id: 'ai_assistant', name: 'AI Assistant', desc: 'Surrounded by luminous glowing AI sparks', category: 'Mentorship' },
  { id: 'architecture', name: 'Architecture', desc: 'Beside blueprint node network diagram', category: 'Diagnostics' },
  { id: 'loading', name: 'Loading / Thinking', desc: 'Hand to chin with animated 3-dot thinking display', category: 'Action & Status' },
];

export const MascotSheetModal: React.FC<MascotSheetModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<MascotTheme>('dark');
  const [selectedPose, setSelectedPose] = useState<MascotPose>('hero');
  const [copiedPose, setCopiedPose] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopySvg = (poseId: MascotPose) => {
    // Generate standalone SVG string
    const svgEl = document.getElementById(`mascot-preview-${poseId}`);
    if (svgEl) {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      navigator.clipboard.writeText(svgData);
      setCopiedPose(poseId);
      setTimeout(() => setCopiedPose(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-pulse-surface border border-pulse-subtle rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-pulse-subtle bg-pulse-elevated flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-pulse-primary font-sans flex items-center space-x-2">
                <span>DevPulse Mascot Design System</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30 font-semibold">
                  17 Canonical Poses · Dual Themes
                </span>
              </h2>
              <p className="text-xs text-pulse-muted font-mono mt-0.5">
                Official Robot Character Assets with Signature Teal (#00C7B5)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Theme Toggle in Character Sheet */}
            <div className="flex items-center bg-pulse-surface p-1 rounded-xl border border-pulse-subtle">
              <button
                onClick={() => setSelectedTheme('light')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                  selectedTheme === 'light'
                    ? 'bg-pulse-elevated text-pulse-primary shadow-sm border border-pulse-subtle'
                    : 'text-pulse-muted hover:text-pulse-primary'
                }`}
              >
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span>Light Theme</span>
              </button>

              <button
                onClick={() => setSelectedTheme('dark')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                  selectedTheme === 'dark'
                    ? 'bg-pulse-elevated text-pulse-primary shadow-sm border border-pulse-subtle'
                    : 'text-pulse-muted hover:text-pulse-primary'
                }`}
              >
                <Moon className="h-3.5 w-3.5 text-teal-400" />
                <span>Dark Theme</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-pulse-muted hover:text-pulse-primary hover:bg-pulse-surface border border-transparent hover:border-pulse-subtle transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content: 17 Poses Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 [scrollbar-width:thin]">
          {/* Brand Spec Card */}
          <div className="p-4 rounded-2xl bg-pulse-elevated border border-pulse-subtle grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <span className="text-pulse-muted block uppercase text-[10px]">Head & Silhouette</span>
              <span className="text-pulse-primary font-bold">Rounded Rect with Visor Display</span>
            </div>
            <div>
              <span className="text-pulse-muted block uppercase text-[10px]">Signature Constant</span>
              <span className="text-teal-400 font-bold">#00C7B5 (Bright Luminous Teal)</span>
            </div>
            <div>
              <span className="text-pulse-muted block uppercase text-[10px]">Floating Limbs</span>
              <span className="text-pulse-primary font-bold">Capsule feet & joint connectors</span>
            </div>
          </div>

          {/* Grid of All 17 Poses */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {ALL_POSES.map((pose) => {
              const isSelected = selectedPose === pose.id;
              const isCopied = copiedPose === pose.id;

              return (
                <div
                  key={pose.id}
                  onClick={() => setSelectedPose(pose.id)}
                  className={`p-3.5 rounded-2xl border transition flex flex-col items-center justify-between text-center group cursor-pointer ${
                    selectedTheme === 'dark' ? 'bg-[#0D1412]' : 'bg-[#F4F7F6]'
                  } ${
                    isSelected
                      ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md'
                      : 'border-pulse-subtle hover:border-pulse-strong'
                  }`}
                >
                  <div className="w-full flex justify-between items-center mb-1">
                    <span className="text-[9px] font-mono text-pulse-muted uppercase font-bold truncate">
                      {pose.category}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopySvg(pose.id);
                      }}
                      className="p-1 rounded text-pulse-muted hover:text-pulse-primary transition opacity-0 group-hover:opacity-100"
                      title="Copy SVG"
                    >
                      {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>

                  {/* Render Character SVG */}
                  <div className="my-1 flex items-center justify-center h-20 w-20">
                    <DevPulseMascotSvg
                      pose={pose.id}
                      theme={selectedTheme}
                      width={70}
                      height={70}
                      animate={true}
                    />
                  </div>

                  <div className="w-full mt-2 pt-2 border-t border-pulse-subtle/50">
                    <h4 className="text-xs font-bold text-pulse-primary truncate">{pose.name}</h4>
                    <p className="text-[10px] text-pulse-secondary truncate mt-0.5">{pose.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-pulse-subtle bg-pulse-elevated flex items-center justify-between shrink-0">
          <span className="text-xs font-mono text-pulse-muted">
            All 17 poses are SVG vector assets with zero pixelation and dual light/dark rendering.
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
