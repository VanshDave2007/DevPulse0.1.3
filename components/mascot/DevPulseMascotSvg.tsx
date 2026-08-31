import React from 'react';

export type MascotPose =
  | 'hero'
  | 'success'
  | 'creating'
  | 'coding'
  | 'guiding'
  | 'happy'
  | 'neutral'
  | 'sad'
  | 'disappointed'
  | 'excited'
  | 'angry'
  | 'frustrated'
  | 'analyzing'
  | 'security_alert'
  | 'vulnerability_found'
  | 'code_fixed'
  | 'learning'
  | 'ai_assistant'
  | 'architecture'
  | 'loading'
  | 'thinking';

export type MascotTheme = 'light' | 'dark';

export interface DevPulseMascotSvgProps {
  pose?: MascotPose;
  theme?: MascotTheme;
  width?: number;
  height?: number;
  className?: string;
  animate?: boolean;
}

// Canonical DevPulse Brand Palette Tokens
const PALETTE = {
  light: {
    shellGradStart: '#FFFFFF',
    shellGradEnd: '#D9E5DF',
    shellStroke: '#A9E4DD',
    bodyInner: '#F4F7F6',
    facePanelBg: '#052019',
    facePanelStroke: '#18362F',
    faceGlow: 'rgba(0, 199, 181, 0.15)',
    eyeMouth: '#00C7B5', // Bright Teal Signature
    eyeShine: '#FFFFFF',
    antennaBody: '#00B9A4', // Primary Teal
    antennaTip: '#00C7B5', // Bright Teal
    earModuleBg: '#E2ECE8',
    earModuleStroke: '#A9E4DD',
    limbsBg: '#FFFFFF',
    limbsShadow: '#D9E5DF',
    joints: '#00B9A4',
    feetBg: '#FFFFFF',
    feetStroke: '#A9E4DD',
    auraRing: 'rgba(0, 185, 164, 0.25)',
    statusCoral: '#FF6B81',
    statusAmber: '#F59E0B',
    statusSuccess: '#00B9A4',
    propBook: '#0E5A50',
    propShield: '#18362F',
  },
  dark: {
    shellGradStart: '#1A2521',
    shellGradEnd: '#0D1412',
    shellStroke: '#1C2E28',
    bodyInner: '#111A17',
    facePanelBg: '#0A0F0E',
    facePanelStroke: '#1C2622',
    faceGlow: 'rgba(0, 199, 181, 0.25)',
    eyeMouth: '#00C7B5', // Bright Teal Signature
    eyeShine: '#FFFFFF',
    antennaBody: '#00B9A4',
    antennaTip: '#00C7B5',
    earModuleBg: '#182420',
    earModuleStroke: '#0E5A50',
    limbsBg: '#141E1B',
    limbsShadow: '#0D1412',
    joints: '#00C7B5',
    feetBg: '#141E1B',
    feetStroke: '#1C2E28',
    auraRing: 'rgba(0, 199, 181, 0.35)',
    statusCoral: '#FF6B81',
    statusAmber: '#F59E0B',
    statusSuccess: '#00C7B5',
    propBook: '#0E5A50',
    propShield: '#111A17',
  },
};

export const DevPulseMascotSvg: React.FC<DevPulseMascotSvgProps> = ({
  pose = 'neutral',
  theme = 'dark',
  width = 100,
  height = 100,
  className = '',
  animate = true,
}) => {
  const p = theme === 'light' ? PALETTE.light : PALETTE.dark;
  const normalizedPose = pose === 'coding' ? 'creating' : pose === 'disappointed' ? 'sad' : pose === 'frustrated' ? 'angry' : pose === 'thinking' ? 'loading' : pose;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`overflow-visible select-none ${className}`}
      aria-label={`DevPulse Robot Mascot (${normalizedPose} pose, ${theme} theme)`}
    >
      <defs>
        {/* Dimensional Shell Gradient */}
        <linearGradient id={`devpulse-shell-${theme}`} x1="30" y1="20" x2="90" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.shellGradStart} />
          <stop offset="100%" stopColor={p.shellGradEnd} />
        </linearGradient>

        {/* Visor Display Gradient */}
        <linearGradient id={`devpulse-visor-${theme}`} x1="38" y1="36" x2="82" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.facePanelBg} />
          <stop offset="100%" stopColor={theme === 'light' ? '#18362F' : '#060B09'} />
        </linearGradient>

        {/* Antenna Gradient */}
        <linearGradient id={`devpulse-antenna-${theme}`} x1="60" y1="12" x2="60" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.antennaTip} />
          <stop offset="100%" stopColor={p.antennaBody} />
        </linearGradient>

        {/* Soft Drop Shadow for Floating Limbs */}
        <filter id="mascotShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.15)" />
        </filter>

        {/* Luminous Glow Filter */}
        <filter id="tealGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>
      </defs>

      {/* Floating Shadow Ground Plane */}
      <ellipse cx="60" cy="112" rx="26" ry="4" fill="rgba(0,0,0,0.18)" opacity={theme === 'dark' ? '0.4' : '0.15'} />

      {/* ========================================================
          1. ANTENNAE (Two characteristic robot antennas from spec)
         ======================================================== */}
      <g id="mascot-antennae">
        {/* Left Antenna */}
        <path d="M46 25 L40 14" stroke={`url(#devpulse-antenna-${theme})`} strokeWidth="3" strokeLinecap="round" />
        <circle cx="39" cy="12" r="4" fill={p.antennaTip} filter={animate ? 'url(#tealGlow)' : undefined} className={animate && (normalizedPose === 'loading' || normalizedPose === 'ai_assistant') ? 'animate-pulse' : ''} />

        {/* Right Antenna */}
        <path d="M74 25 L80 14" stroke={`url(#devpulse-antenna-${theme})`} strokeWidth="3" strokeLinecap="round" />
        <circle cx="81" cy="12" r="4" fill={p.antennaTip} filter={animate ? 'url(#tealGlow)' : undefined} className={animate && (normalizedPose === 'loading' || normalizedPose === 'ai_assistant') ? 'animate-pulse' : ''} />
      </g>

      {/* ========================================================
          2. FLOATING FEET (Capsule Robot Floating Feet)
         ======================================================== */}
      <g id="mascot-feet">
        {/* Left Foot */}
        <rect x="42" y="98" width="12" height="9" rx="4.5" fill={p.feetBg} stroke={p.feetStroke} strokeWidth="1.5" filter="url(#mascotShadow)" />
        {/* Right Foot */}
        <rect x="66" y="98" width="12" height="9" rx="4.5" fill={p.feetBg} stroke={p.feetStroke} strokeWidth="1.5" filter="url(#mascotShadow)" />
      </g>

      {/* ========================================================
          3. TORSO / BODY CONNECTOR
         ======================================================== */}
      <g id="mascot-torso">
        <rect x="46" y="78" width="28" height="22" rx="8" fill={`url(#devpulse-shell-${theme})`} stroke={p.shellStroke} strokeWidth="1.5" />
        {/* Core Heartbeat Indicator */}
        <rect x="52" y="85" width="16" height="6" rx="3" fill={p.facePanelBg} />
        <circle cx="60" cy="88" r="2" fill={normalizedPose === 'angry' || normalizedPose === 'vulnerability_found' ? p.statusCoral : normalizedPose === 'sad' ? p.statusAmber : p.eyeMouth} className={animate ? 'animate-pulse' : ''} />
      </g>

      {/* ========================================================
          4. HEAD SHELL & EAR MODULES (Compact Rounded Rect Head)
         ======================================================== */}
      <g id="mascot-head">
        {/* Left Ear Antenna Module */}
        <rect x="22" y="44" width="7" height="18" rx="3.5" fill={p.earModuleBg} stroke={p.earModuleStroke} strokeWidth="1.5" />
        <line x1="25.5" y1="48" x2="25.5" y2="58" stroke={p.joints} strokeWidth="1.5" strokeLinecap="round" />

        {/* Right Ear Antenna Module */}
        <rect x="91" y="44" width="7" height="18" rx="3.5" fill={p.earModuleBg} stroke={p.earModuleStroke} strokeWidth="1.5" />
        <line x1="94.5" y1="48" x2="94.5" y2="58" stroke={p.joints} strokeWidth="1.5" strokeLinecap="round" />

        {/* Main Rounded Rect Head */}
        <rect
          x="27"
          y="23"
          width="66"
          height="58"
          rx="18"
          fill={`url(#devpulse-shell-${theme})`}
          stroke={p.shellStroke}
          strokeWidth="2"
          filter="url(#mascotShadow)"
        />

        {/* Large Dark Visor Screen / Face Display */}
        <rect
          x="33"
          y="29"
          width="54"
          height="46"
          rx="12"
          fill={`url(#devpulse-visor-${theme})`}
          stroke={p.facePanelStroke}
          strokeWidth="1.5"
        />

        {/* Subtle Tech Grid lines on Visor */}
        <line x1="36" y1="38" x2="84" y2="38" stroke={p.facePanelStroke} strokeWidth="0.8" opacity="0.6" />
        <line x1="36" y1="48" x2="84" y2="48" stroke={p.facePanelStroke} strokeWidth="0.8" opacity="0.6" />
        <line x1="36" y1="58" x2="84" y2="58" stroke={p.facePanelStroke} strokeWidth="0.8" opacity="0.6" />
      </g>

      {/* ========================================================
          5. EXPRESSIONS & EYES (Matched Pair for all 17 Poses)
         ======================================================== */}
      <g id="mascot-face-expression">
        {/* POSE: HERO / NEUTRAL */}
        {(normalizedPose === 'hero' || normalizedPose === 'neutral') && (
          <>
            {/* Friendly Round Eyes with White Highlight Shine */}
            <circle cx="48" cy="49" r="4.5" fill={p.eyeMouth} />
            <circle cx="50" cy="47" r="1.5" fill={p.eyeShine} />
            <circle cx="72" cy="49" r="4.5" fill={p.eyeMouth} />
            <circle cx="74" cy="47" r="1.5" fill={p.eyeShine} />
            {/* Gentle Smile */}
            <path d="M54 59 Q60 64 66 59" stroke={p.eyeMouth} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* POSE: SUCCESS / HAPPY / EXCITING */}
        {(normalizedPose === 'success' || normalizedPose === 'happy' || normalizedPose === 'excited') && (
          <>
            {/* Happy Curved Inverted Eyes */}
            <path d="M43 51 Q48 43 53 51" stroke={p.eyeMouth} strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M67 51 Q72 43 77 51" stroke={p.eyeMouth} strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Wide Joyful Smile */}
            <path d="M52 58 Q60 67 68 58" stroke={p.eyeMouth} strokeWidth="2.8" strokeLinecap="round" fill="none" />
            {/* Cheerful Cheek Blushes */}
            <circle cx="42" cy="56" r="2.5" fill={p.statusCoral} opacity="0.6" />
            <circle cx="78" cy="56" r="2.5" fill={p.statusCoral} opacity="0.6" />
          </>
        )}

        {/* POSE: CREATING / CODING */}
        {normalizedPose === 'creating' && (
          <>
            {/* Focused Happy Eyes */}
            <circle cx="48" cy="48" r="4" fill={p.eyeMouth} />
            <circle cx="50" cy="46" r="1.5" fill={p.eyeShine} />
            <circle cx="72" cy="48" r="4" fill={p.eyeMouth} />
            <circle cx="74" cy="46" r="1.5" fill={p.eyeShine} />
            {/* Concentrated Smile */}
            <path d="M55 58 Q60 62 65 58" stroke={p.eyeMouth} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* POSE: GUIDING */}
        {normalizedPose === 'guiding' && (
          <>
            {/* Confident Guiding Eyes */}
            <circle cx="48" cy="48" r="4.5" fill={p.eyeMouth} />
            <circle cx="50" cy="46" r="1.5" fill={p.eyeShine} />
            <circle cx="72" cy="48" r="4.5" fill={p.eyeMouth} />
            <circle cx="74" cy="46" r="1.5" fill={p.eyeShine} />
            {/* Encouraging Smile */}
            <path d="M54 58 Q60 64 66 58" stroke={p.eyeMouth} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* POSE: SAD / DISAPPOINTED */}
        {normalizedPose === 'sad' && (
          <>
            {/* Drooping Sad Eyes */}
            <circle cx="48" cy="50" r="4" fill={p.statusAmber} />
            <circle cx="72" cy="50" r="4" fill={p.statusAmber} />
            {/* Sad Frown */}
            <path d="M54 62 Q60 57 66 62" stroke={p.statusAmber} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Small Cute Tear */}
            <path d="M41 54 Q39 58 41 61 Q43 58 41 54 Z" fill={p.eyeMouth} opacity="0.85" />
          </>
        )}

        {/* POSE: ANGRY / FRUSTRATED */}
        {normalizedPose === 'angry' && (
          <>
            {/* Slanted Angry Eyebrows */}
            <line x1="43" y1="43" x2="53" y2="48" stroke={p.statusCoral} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="77" y1="43" x2="67" y2="48" stroke={p.statusCoral} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="49" cy="51" r="3.5" fill={p.statusCoral} />
            <circle cx="71" cy="51" r="3.5" fill={p.statusCoral} />
            {/* Frustrated Wavy Mouth */}
            <path d="M54 62 Q57 59 60 62 Q63 65 66 62" stroke={p.statusCoral} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* POSE: ANALYZING */}
        {normalizedPose === 'analyzing' && (
          <>
            {/* Inquisitive Winking / Scanning Eye */}
            <line x1="44" y1="48" x2="52" y2="48" stroke={p.eyeMouth} strokeWidth="3" strokeLinecap="round" />
            <circle cx="72" cy="48" r="5.5" fill={p.eyeMouth} />
            <circle cx="74" cy="46" r="2" fill={p.eyeShine} />
            <path d="M55 58 Q60 62 65 58" stroke={p.eyeMouth} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* POSE: SECURITY ALERT / VULNERABILITY FOUND */}
        {(normalizedPose === 'security_alert' || normalizedPose === 'vulnerability_found') && (
          <>
            {/* Alert Concerned Eyes */}
            <circle cx="48" cy="48" r="4.5" fill={normalizedPose === 'vulnerability_found' ? p.statusCoral : p.statusAmber} />
            <circle cx="72" cy="48" r="4.5" fill={normalizedPose === 'vulnerability_found' ? p.statusCoral : p.statusAmber} />
            {/* O-mouth Alert */}
            <circle cx="60" cy="59" r="3" stroke={normalizedPose === 'vulnerability_found' ? p.statusCoral : p.statusAmber} strokeWidth="2" fill="none" />
          </>
        )}

        {/* POSE: CODE FIXED */}
        {normalizedPose === 'code_fixed' && (
          <>
            <path d="M43 50 Q48 44 53 50" stroke={p.eyeMouth} strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="72" cy="48" r="4.5" fill={p.eyeMouth} />
            <circle cx="74" cy="46" r="1.5" fill={p.eyeShine} />
            <path d="M54 59 Q60 65 66 59" stroke={p.eyeMouth} strokeWidth="2.8" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* POSE: LEARNING / ARCHITECTURE / AI ASSISTANT */}
        {(normalizedPose === 'learning' || normalizedPose === 'architecture' || normalizedPose === 'ai_assistant') && (
          <>
            <circle cx="48" cy="48" r="4.5" fill={p.eyeMouth} />
            <circle cx="50" cy="46" r="1.5" fill={p.eyeShine} />
            <circle cx="72" cy="48" r="4.5" fill={p.eyeMouth} />
            <circle cx="74" cy="46" r="1.5" fill={p.eyeShine} />
            <path d="M54 58 Q60 63 66 58" stroke={p.eyeMouth} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* POSE: LOADING / THINKING */}
        {normalizedPose === 'loading' && (
          <>
            <circle cx="48" cy="48" r="4" fill={p.eyeMouth} />
            <circle cx="72" cy="48" r="4" fill={p.eyeMouth} />
            {/* 3 Animated Loading Thinking Dots on Visor */}
            <g className={animate ? 'animate-pulse' : ''}>
              <circle cx="54" cy="60" r="1.8" fill={p.eyeMouth} />
              <circle cx="60" cy="60" r="1.8" fill={p.eyeMouth} />
              <circle cx="66" cy="60" r="1.8" fill={p.eyeMouth} />
            </g>
          </>
        )}
      </g>

      {/* ========================================================
          6. ARMS & PROPS (Specific to each of the 17 Poses)
         ======================================================== */}
      <g id="mascot-arms-and-props">
        {/* HERO / NEUTRAL: Relaxed resting arms */}
        {(normalizedPose === 'hero' || normalizedPose === 'neutral') && (
          <>
            <rect x="23" y="78" width="9" height="16" rx="4.5" fill={p.limbsBg} stroke={p.shellStroke} strokeWidth="1.5" />
            <circle cx="27.5" cy="80" r="2.5" fill={p.joints} />
            <rect x="88" y="78" width="9" height="16" rx="4.5" fill={p.limbsBg} stroke={p.shellStroke} strokeWidth="1.5" />
            <circle cx="92.5" cy="80" r="2.5" fill={p.joints} />
          </>
        )}

        {/* SUCCESS: Holding Golden/Teal Trophy & Celebratory Sparkles */}
        {normalizedPose === 'success' && (
          <>
            {/* Left Arm raised */}
            <path d="M26 82 Q18 72 20 62" stroke={p.limbsBg} strokeWidth="7" strokeLinecap="round" />
            <path d="M26 82 Q18 72 20 62" stroke={p.shellStroke} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* Right Arm holding Trophy */}
            <path d="M94 82 Q102 76 98 64" stroke={p.limbsBg} strokeWidth="7" strokeLinecap="round" />
            <path d="M94 82 Q102 76 98 64" stroke={p.shellStroke} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* Trophy Cup */}
            <g transform="translate(94, 48)">
              <path d="M0 6 H14 L12 16 Q7 20 2 16 Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
              <path d="M7 18 V24 M3 24 H11" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
              <path d="M0 8 Q-4 11 0 14" stroke="#F59E0B" strokeWidth="1.5" fill="none" />
              <path d="M14 8 Q18 11 14 14" stroke="#F59E0B" strokeWidth="1.5" fill="none" />
              <circle cx="7" cy="11" r="2" fill="#FFFFFF" opacity="0.8" />
            </g>
            {/* Sparkles */}
            <path d="M12 28 L15 28 M13.5 26.5 L13.5 29.5" stroke={p.eyeMouth} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M104 26 L108 26 M106 24 L106 28" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}

        {/* CREATING / CODING: Holding Stylus with Code Bracket Marks */}
        {normalizedPose === 'creating' && (
          <>
            <rect x="23" y="78" width="9" height="16" rx="4.5" fill={p.limbsBg} stroke={p.shellStroke} strokeWidth="1.5" />
            {/* Right Arm angled holding pencil */}
            <path d="M92 80 L102 74" stroke={p.limbsBg} strokeWidth="7" strokeLinecap="round" />
            {/* Stylus / Pencil */}
            <path d="M102 70 L112 56 L115 58 L105 72 Z" fill="#00B9A4" stroke={p.shellStroke} strokeWidth="1" />
            <polygon points="102,70 100,74 105,72" fill="#052019" />
            {/* Code bracket symbol in front */}
            <text x="88" y="98" fill={p.eyeMouth} fontSize="9" fontFamily="monospace" fontWeight="bold">
              &lt;/&gt;
            </text>
          </>
        )}

        {/* GUIDING: One Arm Pointing Right */}
        {normalizedPose === 'guiding' && (
          <>
            <rect x="23" y="78" width="9" height="16" rx="4.5" fill={p.limbsBg} stroke={p.shellStroke} strokeWidth="1.5" />
            {/* Extended Right Arm Pointing */}
            <path d="M92 80 L110 74" stroke={p.limbsBg} strokeWidth="7" strokeLinecap="round" />
            <path d="M92 80 L110 74" stroke={p.shellStroke} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="112" cy="73" r="3" fill={p.joints} />
            <line x1="112" y1="73" x2="118" y2="72" stroke={p.eyeMouth} strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}

        {/* HAPPY / EXCITED: Both Arms Raised Up */}
        {(normalizedPose === 'happy' || normalizedPose === 'excited') && (
          <>
            <path d="M26 80 Q16 68 18 56" stroke={p.limbsBg} strokeWidth="7" strokeLinecap="round" />
            <path d="M26 80 Q16 68 18 56" stroke={p.shellStroke} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M94 80 Q104 68 102 56" stroke={p.limbsBg} strokeWidth="7" strokeLinecap="round" />
            <path d="M94 80 Q104 68 102 56" stroke={p.shellStroke} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* Confetti / Celebration Marks */}
            <path d="M16 42 L20 42 M18 40 L18 44" stroke={p.eyeMouth} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M100 42 L104 42 M102 40 L102 44" stroke={p.eyeMouth} strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}

        {/* SAD / DISAPPOINTED: Lowered Arms Near Face */}
        {normalizedPose === 'sad' && (
          <>
            <path d="M26 80 Q22 68 32 64" stroke={p.limbsBg} strokeWidth="6.5" strokeLinecap="round" />
            <path d="M94 80 Q98 68 88 64" stroke={p.limbsBg} strokeWidth="6.5" strokeLinecap="round" />
          </>
        )}

        {/* ANGRY / FRUSTRATED: Hands on Hips with Frustration Puff */}
        {normalizedPose === 'angry' && (
          <>
            <path d="M26 78 Q18 84 26 90" stroke={p.limbsBg} strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M94 78 Q102 84 94 90" stroke={p.limbsBg} strokeWidth="6" strokeLinecap="round" fill="none" />
            {/* Frustration Clouds */}
            <path d="M14 26 Q17 22 21 25 Q24 21 28 25" stroke={p.statusCoral} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        )}

        {/* ANALYZING: Holding Magnifying Glass */}
        {normalizedPose === 'analyzing' && (
          <>
            <rect x="23" y="78" width="9" height="16" rx="4.5" fill={p.limbsBg} stroke={p.shellStroke} strokeWidth="1.5" />
            {/* Right Arm holding glass up to face */}
            <path d="M92 80 Q100 68 84 56" stroke={p.limbsBg} strokeWidth="6" strokeLinecap="round" fill="none" />
            {/* Magnifying Glass */}
            <circle cx="78" cy="49" r="9" fill="rgba(0, 199, 181, 0.15)" stroke={p.eyeMouth} strokeWidth="2" />
            <line x1="84" y1="56" x2="94" y2="66" stroke={p.antennaBody} strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {/* SECURITY ALERT: Holding Shield */}
        {normalizedPose === 'security_alert' && (
          <>
            <rect x="23" y="78" width="9" height="16" rx="4.5" fill={p.limbsBg} stroke={p.shellStroke} strokeWidth="1.5" />
            {/* Right Arm holding Shield in front */}
            <g transform="translate(86, 62)">
              <path d="M2 0 L18 0 L20 12 Q10 22 0 12 Z" fill={p.propShield} stroke={p.statusCoral} strokeWidth="1.8" />
              <path d="M10 5 V11 M10 14 V15" stroke={p.statusCoral} strokeWidth="2" strokeLinecap="round" />
            </g>
          </>
        )}

        {/* VULNERABILITY FOUND: Pointing at Warning Indicator */}
        {normalizedPose === 'vulnerability_found' && (
          <>
            <rect x="23" y="78" width="9" height="16" rx="4.5" fill={p.limbsBg} stroke={p.shellStroke} strokeWidth="1.5" />
            <path d="M92 80 L108 72" stroke={p.limbsBg} strokeWidth="6.5" strokeLinecap="round" />
            {/* Warning Triangle Indicator */}
            <g transform="translate(104, 52)">
              <polygon points="8,0 16,14 0,14" fill={p.statusCoral} />
              <circle cx="8" cy="11" r="1" fill="#FFFFFF" />
              <line x1="8" y1="4" x2="8" y2="8" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </>
        )}

        {/* CODE FIXED: Holding Checkmark Shield / Repair Tool */}
        {normalizedPose === 'code_fixed' && (
          <>
            <rect x="23" y="78" width="9" height="16" rx="4.5" fill={p.limbsBg} stroke={p.shellStroke} strokeWidth="1.5" />
            {/* Right Arm holding Check badge */}
            <path d="M92 80 Q102 74 98 64" stroke={p.limbsBg} strokeWidth="6.5" strokeLinecap="round" />
            <g transform="translate(94, 54)">
              <circle cx="10" cy="10" r="9" fill={p.eyeMouth} stroke={p.shellStroke} strokeWidth="1.5" />
              <path d="M6 10 L9 13 L14 7" stroke="#052019" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </>
        )}

        {/* LEARNING: Holding Open Book / Docs */}
        {normalizedPose === 'learning' && (
          <>
            <g transform="translate(42, 80)">
              <path d="M2 4 Q18 0 18 14 Q9 12 2 14 Z" fill={p.propBook} stroke={p.shellStroke} strokeWidth="1" />
              <path d="M34 4 Q18 0 18 14 Q27 12 34 14 Z" fill={p.propBook} stroke={p.shellStroke} strokeWidth="1" />
              <line x1="18" y1="3" x2="18" y2="14" stroke={p.eyeMouth} strokeWidth="1.5" />
              <line x1="6" y1="7" x2="14" y2="7" stroke={p.eyeMouth} strokeWidth="1" opacity="0.7" />
              <line x1="22" y1="7" x2="30" y2="7" stroke={p.eyeMouth} strokeWidth="1" opacity="0.7" />
            </g>
          </>
        )}

        {/* AI ASSISTANT: Glowing AI Spark beside Mascot */}
        {normalizedPose === 'ai_assistant' && (
          <>
            <rect x="23" y="78" width="9" height="16" rx="4.5" fill={p.limbsBg} stroke={p.shellStroke} strokeWidth="1.5" />
            <rect x="88" y="78" width="9" height="16" rx="4.5" fill={p.limbsBg} stroke={p.shellStroke} strokeWidth="1.5" />
            {/* Glowing AI Sparkle Icon */}
            <g transform="translate(96, 32)" className={animate ? 'animate-pulse' : ''}>
              <path d="M8 0 Q8 8 16 8 Q8 8 8 16 Q8 8 0 8 Q8 8 8 0 Z" fill={p.eyeMouth} filter="url(#tealGlow)" />
            </g>
          </>
        )}

        {/* ARCHITECTURE: Beside simplified Node Architecture Diagram */}
        {normalizedPose === 'architecture' && (
          <>
            <rect x="23" y="78" width="9" height="16" rx="4.5" fill={p.limbsBg} stroke={p.shellStroke} strokeWidth="1.5" />
            <path d="M92 80 L106 76" stroke={p.limbsBg} strokeWidth="6" strokeLinecap="round" />
            {/* Architecture Node Diagram */}
            <g transform="translate(98, 48)">
              <rect x="0" y="0" width="8" height="6" rx="1.5" fill={p.eyeMouth} />
              <rect x="12" y="10" width="8" height="6" rx="1.5" fill={p.joints} />
              <rect x="0" y="16" width="8" height="6" rx="1.5" fill={p.eyeMouth} />
              <path d="M4 6 V16 M8 3 H16 V10" stroke={p.joints} strokeWidth="1" fill="none" />
            </g>
          </>
        )}

        {/* LOADING / THINKING: Hand under chin thinking */}
        {normalizedPose === 'loading' && (
          <>
            <rect x="23" y="78" width="9" height="16" rx="4.5" fill={p.limbsBg} stroke={p.shellStroke} strokeWidth="1.5" />
            {/* Right Arm curled up to chin */}
            <path d="M92 80 Q98 72 78 68" stroke={p.limbsBg} strokeWidth="6.5" strokeLinecap="round" />
          </>
        )}
      </g>
    </svg>
  );
};
