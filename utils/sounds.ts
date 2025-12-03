// utils/sounds.ts

export const SOUND_PATHS = {
  TIMER_START: 'https://actions.google.com/sounds/v1/impacts/glass_drop_and_roll.ogg',
  TIMER_END: 'https://actions.google.com/sounds/v1/impacts/debris_hits.ogg',
  ROUTINE_COMPLETE: 'https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg',
  OVERTIME_TICK: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
  REMINDER: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg',
} as const;

// Global flag to track if audio has been unlocked
let audioUnlocked = false;

const unlockAudioContext = () => {
  if (audioUnlocked) return;

  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      audioUnlocked = true;
    });
  } else {
    audioUnlocked = true;
  }

  // Extra safety: play a silent tone
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  gainNode.gain.value = 0;
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start(0);
  oscillator.stop(ctx.currentTime + 0.001);
};

// Fallback beep using Web Audio API
const playFallbackBeep = (type: keyof typeof SOUND_PATHS) => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'TIMER_START') {
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'TIMER_END' || type === 'REMINDER') {
      osc.frequency.value = 600;
      osc.type = 'square';
      osc.start();
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.4, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.6);
      osc.stop(ctx.currentTime + 0.8);
    } else if (type === 'ROUTINE_COMPLETE') {
      osc.frequency.value = 600;
      osc.type = 'triangle';
      osc.start();
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.frequency.value = 440;
      osc.type = 'sine';
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.stop(ctx.currentTime + 0.1);
    }
  } catch (e) {
    console.error("Fallback beep failed", e);
  }
};

export const playSound = (type: keyof typeof SOUND_PATHS) => {
  // Always try to unlock audio context first
  unlockAudioContext();

  try {
    const path = SOUND_PATHS[type];
    if (!path) {
      playFallbackBeep(type);
      return;
    }

    const audio = new Audio(path);
    audio.volume = 0.5;
    audio.crossOrigin = "anonymous"; // Helps with CORS

    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn(`Sound "${type}" blocked or failed. Using fallback.`, error);
        playFallbackBeep(type);
      });
    }
  } catch (error) {
    console.error("Error initializing sound:", error);
    playFallbackBeep(type);
  }
};