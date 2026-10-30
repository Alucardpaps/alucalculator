'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type ScrewDir = 'tighten' | 'loosen';

const HOLD_MS = 170;
const RPS = 1.25;
const CLICK_MS = 480;

/**
 * Right-hand screw: tighten = +turns (clockwise on the hex).
 * Click = one revolution. Hold = continuous. Right-click = loosen.
 */
export function useScrewMotion() {
  const [turns, setTurns] = useState(0);
  const [mode, setMode] = useState<'idle' | ScrewDir>('idle');
  const turnsRef = useRef(0);
  const modeRef = useRef<'idle' | ScrewDir>('idle');
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const downAt = useRef(0);
  const pendingDir = useRef<ScrewDir>('tighten');

  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  const stopRaf = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  };

  const spinLoop = useCallback((now: number) => {
    if (modeRef.current === 'idle') return;
    if (!lastRef.current) lastRef.current = now;
    const dt = Math.min(0.05, (now - lastRef.current) / 1000);
    lastRef.current = now;
    const sign = modeRef.current === 'tighten' ? 1 : -1;
    const next = turnsRef.current + sign * RPS * dt;
    turnsRef.current = next;
    setTurns(next);
    rafRef.current = requestAnimationFrame(spinLoop);
  }, []);

  const playOne = useCallback((dir: ScrewDir) => {
    stopRaf();
    modeRef.current = 'idle';
    setMode('idle');
    const start = turnsRef.current;
    const target = start + (dir === 'tighten' ? 1 : -1);
    const t0 = performance.now();
    const step = (now: number) => {
      const u = Math.min(1, (now - t0) / CLICK_MS);
      const ease = 1 - (1 - u) ** 3;
      const v = start + (target - start) * ease;
      turnsRef.current = v;
      setTurns(v);
      if (u < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, []);

  const startHold = useCallback((dir: ScrewDir) => {
    stopRaf();
    modeRef.current = dir;
    setMode(dir);
    lastRef.current = 0;
    rafRef.current = requestAnimationFrame(spinLoop);
  }, [spinLoop]);

  const tighten = useCallback((delta: number = 1) => {
    stopRaf();
    modeRef.current = 'idle';
    setMode('idle');
    const start = turnsRef.current;
    const target = start + delta;
    const t0 = performance.now();
    const dur = Math.max(120, CLICK_MS * Math.min(1, Math.abs(delta)));
    const step = (now: number) => {
      const u = Math.min(1, (now - t0) / dur);
      const ease = 1 - (1 - u) ** 3;
      const v = start + (target - start) * ease;
      turnsRef.current = v;
      setTurns(v);
      if (u < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, []);

  const loosen = useCallback((delta: number = 1) => {
    tighten(-delta);
  }, [tighten]);

  const reset = useCallback(() => {
    stopRaf();
    modeRef.current = 'idle';
    setMode('idle');
    const start = turnsRef.current;
    const t0 = performance.now();
    const step = (now: number) => {
      const u = Math.min(1, (now - t0) / 280);
      const ease = 1 - (1 - u) ** 3;
      const v = start * (1 - ease);
      turnsRef.current = v;
      setTurns(v);
      if (u < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    const next = turnsRef.current + delta;
    turnsRef.current = next;
    setTurns(next);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 1) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    const isLoosen = e.button === 2 || e.shiftKey || e.altKey;
    const dir: ScrewDir = isLoosen ? 'loosen' : 'tighten';
    pendingDir.current = dir;
    downAt.current = performance.now();
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => startHold(dir), HOLD_MS);
  }, [startHold]);

  const onPointerUp = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    const held = performance.now() - downAt.current >= HOLD_MS;
    if (modeRef.current !== 'idle') {
      modeRef.current = 'idle';
      setMode('idle');
      stopRaf();
      return;
    }
    if (!held) playOne(pendingDir.current);
  }, [playOne]);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  useEffect(() => () => {
    stopRaf();
    if (holdTimer.current) clearTimeout(holdTimer.current);
  }, []);

  return {
    turns,
    mode,
    tighten,
    loosen,
    reset,
    setTurns,
    onPointerDown,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onContextMenu,
    onWheel,
  };
}

export function hexHalfHeight(acrossCorners: number, deg: number) {
  const r = acrossCorners / 2;
  let m = 0;
  for (let i = 0; i < 6; i++) {
    const a = ((i * 60 + deg) * Math.PI) / 180;
    m = Math.max(m, Math.abs(r * Math.sin(a)));
  }
  return m;
}

export function threadPhase(turns: number, P: number) {
  const f = ((turns % 1) + 1) % 1;
  return f * P;
}
