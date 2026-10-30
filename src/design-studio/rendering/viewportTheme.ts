'use client';

/**
 * 3D viewport look (background, floor grid, ground bounce light).
 *
 * The default preset "theme" follows the app theme: the canvas background is drawn
 * with theme tokens (CSS), and the grid colours are read from the same tokens so the
 * floor stays subtle on graphite, midnight, OLED, light and paper alike. The older fixed
 * presets (dark, navy, blueprint, light …) remain selectable.
 */

import { useEffect, useState } from 'react';
import { useTheme } from '@/lib/theme/themeStore';
import { getTheme } from '@/lib/theme/themes';

export interface ViewportLook {
  /** CSS background for the canvas element (the WebGL canvas itself is transparent) */
  background: string;
  gridCell: string;
  gridSection: string;
  /** hemisphere light ground colour */
  hemiGround: string;
  isLight: boolean;
}

/** Fixed presets (scene colours, not UI classes). */
const FIXED: Record<string, ViewportLook> = {
  dark: { background: '#070b10', gridCell: '#0c131f', gridSection: '#1e293b', hemiGround: '#1a1f2a', isLight: false },
  charcoal: { background: '#121417', gridCell: '#1a1d22', gridSection: '#2a2f36', hemiGround: '#1a1f2a', isLight: false },
  steel: { background: '#1c242c', gridCell: '#242e38', gridSection: '#34404c', hemiGround: '#1a1f2a', isLight: false },
  navy: { background: '#0b1220', gridCell: '#111a2c', gridSection: '#1e2a42', hemiGround: '#1a1f2a', isLight: false },
  blueprint: { background: '#0a2540', gridCell: '#123456', gridSection: '#1f4d7a', hemiGround: '#1a2a3a', isLight: false },
  light: { background: '#dbe4ee', gridCell: '#c8d2dd', gridSection: '#a9b5c3', hemiGround: '#c9d2dc', isLight: true },
  white: { background: '#f4f4f5', gridCell: '#e1e3e6', gridSection: '#c5c9cf', hemiGround: '#d4d8de', isLight: true },
};

export const VIEWPORT_PRESETS = ['theme', ...Object.keys(FIXED)] as const;

const THEME_BACKGROUND =
  'linear-gradient(180deg, color-mix(in oklab, var(--bg-2) 60%, var(--bg-0)) 0%, var(--bg-0) 72%)';

function readTokens(): { line: string; lineStrong: string } | null {
  if (typeof document === 'undefined') return null;
  const cs = getComputedStyle(document.documentElement);
  const line = cs.getPropertyValue('--line').trim();
  const lineStrong = cs.getPropertyValue('--line-strong').trim();
  return line && lineStrong ? { line, lineStrong } : null;
}

export function useViewportLook(preset: string): ViewportLook {
  const { theme } = useTheme();
  const [tokens, setTokens] = useState<{ line: string; lineStrong: string } | null>(null);

  useEffect(() => {
    setTokens(readTokens());
    // data-theme is switched outside React; read once more after it has been applied
    const id = requestAnimationFrame(() => setTokens(readTokens()));
    return () => cancelAnimationFrame(id);
  }, [theme]);

  if (preset !== 'theme' && FIXED[preset]) return FIXED[preset];

  const isLight = getTheme(theme).kind === 'light';
  return {
    background: THEME_BACKGROUND,
    gridCell: tokens?.line ?? (isLight ? '#dfe2e7' : '#252b33'),
    gridSection: tokens?.lineStrong ?? (isLight ? '#c6cbd3' : '#353d48'),
    hemiGround: isLight ? '#c9d2dc' : '#1a1f2a',
    isLight,
  };
}
