// Cozy synthesized UI & game sound effects via Web Audio API (zero external audio dependencies)

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

export function setAudioEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isAudioEnabled(): boolean {
  return soundEnabled;
}

function getContext(): AudioContext | null {
  if (!soundEnabled || typeof window === 'undefined') return null;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioCtx) {
      audioCtx = new AudioCtx();
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(
  freq: number,
  durationSec: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.08,
  delaySec = 0
) {
  const ctx = getContext();
  if (!ctx) return;

  const start = ctx.currentTime + delaySec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + durationSec + 0.02);
}

export function playTapSound() {
  playTone(520, 0.07, 'triangle', 0.06);
}

export function playCoinSound() {
  playTone(784, 0.09, 'sine', 0.07, 0);
  playTone(1046.5, 0.14, 'sine', 0.07, 0.06);
}

export function playHappySound() {
  playTone(587.3, 0.1, 'triangle', 0.07, 0);
  playTone(740, 0.11, 'triangle', 0.07, 0.07);
  playTone(880, 0.16, 'sine', 0.07, 0.14);
}

export function playCameraSound() {
  playTone(320, 0.04, 'square', 0.04, 0);
  playTone(640, 0.06, 'triangle', 0.05, 0.045);
}

export function playVictorySound() {
  playTone(523.25, 0.14, 'sine', 0.08, 0);
  playTone(659.25, 0.14, 'sine', 0.08, 0.08);
  playTone(783.99, 0.16, 'sine', 0.08, 0.16);
  playTone(1046.5, 0.28, 'triangle', 0.09, 0.24);
}
