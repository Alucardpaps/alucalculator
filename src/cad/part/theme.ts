'use client';
import { useEffect, useState } from 'react';
import * as THREE from 'three';

/** WebGL can't read CSS variables, so resolve the design tokens at runtime (and on theme change). */
export interface PartColors {
  accent: string; cyan: string; ink: string; muted: string; line: string; bg: string; ok: string; warn: string; bad: string; body: string; edge: string;
}

const FALLBACK: PartColors = {
  accent: '#00b8d4', cyan: '#00b8d4', ink: '#e6edf3', muted: '#8b949e', line: '#30363d', bg: '#0d1117', ok: '#3fb950', warn: '#d29922', bad: '#f85149', body: '#9aa8b6', edge: '#1f2933',
};

function read(): PartColors {
  if (typeof window === 'undefined') return FALLBACK;
  const cs = getComputedStyle(document.documentElement);
  const g = (v: string, f: string) => (cs.getPropertyValue(v).trim() || f);
  const ink = g('--ink', FALLBACK.ink);
  const bg = g('--bg-0', FALLBACK.bg);
  const mix = (a: string, b: string, t: number) => {
    try { return '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString(); } catch { return a; }
  };
  const bg3 = g('--bg-3', FALLBACK.edge);
  const alu = g('--alu', FALLBACK.body);
  const cyan = g('--cyan', FALLBACK.cyan);
  return {
    accent: cyan, cyan, ink, muted: g('--muted', FALLBACK.muted), line: g('--line', FALLBACK.line), bg,
    ok: g('--ok', FALLBACK.ok), warn: g('--warn', FALLBACK.warn), bad: g('--bad', FALLBACK.bad),
    body: mix(bg3, alu, 0.5), edge: mix(bg, ink, 0.7),
  };
}

export function usePartColors(): PartColors {
  const [c, setC] = useState<PartColors>(FALLBACK);
  useEffect(() => {
    setC(read());
    const mo = new MutationObserver(() => setC(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    return () => mo.disconnect();
  }, []);
  return c;
}
