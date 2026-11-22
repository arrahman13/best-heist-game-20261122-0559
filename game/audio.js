// audio.js — tiny synthesized sound effects with WebAudio. No audio files,
// no network: every beep is generated in code. Silent until the player
// starts (browsers require a gesture before audio can play).
let ctx = null;

export function ensureAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch { /* audio is optional; the game plays fine without it */ }
}

function tone(freq, dur, type = 'sine', vol = 0.08, when = 0) {
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch { /* ignore */ }
}

export const sfx = {
  pickup() { tone(880, 0.12, 'sine', 0.09); tone(1320, 0.14, 'sine', 0.07, 0.07); },
  vault() { tone(523, 0.15, 'triangle', 0.1); tone(659, 0.15, 'triangle', 0.1, 0.1); tone(784, 0.25, 'triangle', 0.1, 0.2); },
  emp() { tone(1200, 0.3, 'sawtooth', 0.05); tone(300, 0.4, 'sawtooth', 0.05, 0.05); },
  spotted() { tone(220, 0.18, 'square', 0.06); },
  caught() { tone(196, 0.3, 'sawtooth', 0.09); tone(131, 0.5, 'sawtooth', 0.09, 0.2); },
  win() { tone(523, 0.15, 'triangle', 0.1); tone(659, 0.15, 'triangle', 0.1, 0.12); tone(784, 0.2, 'triangle', 0.1, 0.24); tone(1047, 0.35, 'triangle', 0.1, 0.36); },
};
