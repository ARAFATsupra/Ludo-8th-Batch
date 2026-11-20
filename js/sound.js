import { state, saveAudio } from './state.js';

let ctx = null;
let musicNodes = null;

function getCtx() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', vol = 0.15, when = 0) {
  const c = getCtx(); if (!c || state.audio.mute) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = c.currentTime + when;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol * (state.audio.sfx / 100), t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  click: () => tone(800, 0.08, 'square', 0.1),
  diceRoll: () => { for (let i = 0; i < 6; i++) tone(200 + Math.random() * 400, 0.08, 'sawtooth', 0.08, i * 0.05); },
  diceLand: () => { tone(300, 0.15, 'triangle', 0.2); tone(500, 0.15, 'triangle', 0.15, 0.02); },
  tokenMove: () => tone(600, 0.08, 'sine', 0.15),
  tokenCapture: () => { tone(400, 0.1, 'sawtooth', 0.2); tone(200, 0.2, 'sawtooth', 0.2, 0.1); },
  turnNotify: () => { tone(500, 0.15, 'sine', 0.2); tone(700, 0.15, 'sine', 0.2, 0.1); },
  challengeActivate: () => { tone(400, 0.15, 'square', 0.2); tone(600, 0.15, 'square', 0.2, 0.1); tone(800, 0.2, 'square', 0.2, 0.2); },
  challengeComplete: () => { tone(600, 0.1, 'sine', 0.2); tone(800, 0.1, 'sine', 0.2, 0.1); tone(1000, 0.2, 'sine', 0.2, 0.2); },
  win: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', 0.25, i * 0.15)); },
  chatNotify: () => tone(900, 0.08, 'sine', 0.15)
};

export function startBackgroundMusic() {
  const c = getCtx(); if (!c || musicNodes) return;
  if (state.audio.mute || state.audio.music === 0) return;
  const gain = c.createGain();
  gain.gain.value = (state.audio.music / 100) * 0.05;
  gain.connect(c.destination);
  const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 293.66, 349.23];
  let idx = 0;
  const osc = c.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = notes[0];
  osc.connect(gain);
  osc.start();
  const loop = setInterval(() => {
    if (!ctx || state.audio.mute) return;
    idx = (idx + 1) % notes.length;
    osc.frequency.value = notes[idx];
    gain.gain.value = (state.audio.music / 100) * 0.05;
  }, 500);
  musicNodes = { osc, gain, loop };
}

export function stopBackgroundMusic() {
  if (!musicNodes) return;
  try { musicNodes.osc.stop(); } catch {}
  clearInterval(musicNodes.loop);
  musicNodes = null;
}

export function updateAudioSettings() {
  if (musicNodes) musicNodes.gain.gain.value = (state.audio.music / 100) * 0.05;
  saveAudio();
}