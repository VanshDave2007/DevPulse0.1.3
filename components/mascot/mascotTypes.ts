export type MascotMood =
  | 'neutral'
  | 'thinking'
  | 'happy'
  | 'curious'
  | 'concerned'
  | 'celebrating'
  | 'helping'
  | 'sleeping'
  | 'surprised';

export type MascotState =
  | 'idle'
  | 'walking'
  | 'sitting'
  | 'looking'
  | 'peeking'
  | 'slipping'
  | 'falling'
  | 'bouncing'
  | 'recovering'
  | 'sleeping'
  | 'waking'
  | 'celebrating'
  | 'concerned'
  | 'thinking'
  | 'pointing_left'
  | 'pointing_right'
  | 'touching';

export type MascotActivityMode = 'interactive' | 'minimal' | 'static';

export interface MascotSettings {
  enabled: boolean;
  mode: MascotActivityMode;
  movementEnabled: boolean;
  soundEnabled: boolean;
  sleepEnabled: boolean;
  playfulInteractions: boolean;
  reduceMotion: boolean;
}

export interface MascotPosition {
  x: number; // percentage (0 - 100) or pixels from left
  y: number; // pixels from bottom
  facing: 'left' | 'right';
  isGrounded: boolean;
  scale: number;
}

export interface MascotSpeechBubble {
  id: string;
  text: string;
  type: 'speech' | 'thought' | 'tip';
  expiresAt: number;
}
