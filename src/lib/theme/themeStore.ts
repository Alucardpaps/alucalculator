'use client';

import { useEffect, useSyncExternalStore } from 'react';
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  getTheme,
  resolveTheme,
  type ThemeId,
  type ThemePreference,
} from './themes';

type Listener = () => void;
const listeners = new Set<Listener>();

function readPreference(): ThemePreference {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    return (localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference) || DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function prefersDark() {
  return typeof window === 'undefined' || !window.matchMedia('(prefers-color-scheme: light)').matches;
}

function apply(pref: ThemePreference, animate: boolean) {
  const id = resolveTheme(pref, prefersDark());
  const root = document.documentElement;
  if (animate) {
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 260);
  }
  root.setAttribute('data-theme', id);
  // Components are authored dark-first; keep the `dark:` variant active in every theme.
  root.classList.add('dark');
  root.classList.remove('light', 'paper', 'sea', 'sky');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', getTheme(id).metaColor);
  return id;
}

export function setThemePreference(pref: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    /* storage blocked: still apply for this page view */
  }
  apply(pref, true);
  listeners.forEach((l) => l());
}

function subscribe(l: Listener) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) {
      apply(readPreference(), true);
      l();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener('storage', onStorage);
  };
}

/** Current preference ('system' or a theme id) and the resolved theme. */
export function useTheme(): { preference: ThemePreference; theme: ThemeId; setPreference: (p: ThemePreference) => void } {
  const preference = useSyncExternalStore(subscribe, readPreference, () => DEFAULT_THEME as ThemePreference);
  const theme = resolveTheme(preference, typeof window === 'undefined' ? true : prefersDark());
  return { preference, theme, setPreference: setThemePreference };
}

/** Mount once (layout): follows OS changes when preference is 'system'. */
export function useThemeSystemSync() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => {
      if (readPreference() === 'system') {
        apply('system', true);
        listeners.forEach((l) => l());
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
}

/** Map old osStore theme names to the new registry. */
export function normalizeThemeName(name: string): ThemePreference {
  switch (name) {
    case 'dark':
      return 'graphite';
    case 'sea':
      return 'midnight';
    case 'sky':
      return 'light';
    default:
      return (['graphite', 'midnight', 'oled', 'light', 'paper', 'system'] as string[]).includes(name)
        ? (name as ThemePreference)
        : 'graphite';
  }
}

export function getResolvedThemeKind(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'dark';
  return getTheme(document.documentElement.getAttribute('data-theme')).kind;
}

/** Quick dark/light flip used by the dock, command palette and mobile app. */
export function toggleThemeKind() {
  setThemePreference(getResolvedThemeKind() === 'dark' ? 'light' : 'graphite');
}
