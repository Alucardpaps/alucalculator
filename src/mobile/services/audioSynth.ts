'use client';

import { useMobileStore } from '@/mobile/store/mobileStore';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export function playClickSound(): void {
  if (typeof window === 'undefined') return;
  const soundEnabled = (useMobileStore.getState() as any).soundEnabled ?? true;
  if (!soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (browser security)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  // Mechanical tap click synthesis
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.06);

  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.07);
}

export function playSuccessSound(): void {
  if (typeof window === 'undefined') return;
  const soundEnabled = (useMobileStore.getState() as any).soundEnabled ?? true;
  if (!soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  // Futuristic dual-tone chime
  const now = ctx.currentTime;
  
  // Tone 1
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(523.25, now); // C5
  gain1.gain.setValueAtTime(0.08, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc1.start(now);
  osc1.stop(now + 0.16);

  // Tone 2
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(783.99, now + 0.08); // G5
  gain2.gain.setValueAtTime(0.08, now + 0.08);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc2.start(now + 0.08);
  osc2.stop(now + 0.31);
}

export function playWarningSound(): void {
  if (typeof window === 'undefined') return;
  const soundEnabled = (useMobileStore.getState() as any).soundEnabled ?? true;
  if (!soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  // Sci-fi error buzzer
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.2);

  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.21);
}
