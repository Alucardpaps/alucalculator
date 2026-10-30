/** Page backdrop pattern preference (per browser). Colours always come from the active theme tokens. */
import { useSyncExternalStore } from 'react';

export type BackdropId = 'grid' | 'blueprint' | 'dots' | 'plain';
export const BACKDROPS: { id: BackdropId; en: string; tr: string }[] = [
  { id: 'grid', en: 'Fine grid', tr: 'İnce ızgara' },
  { id: 'blueprint', en: 'Drafting grid', tr: 'Çizim ızgarası' },
  { id: 'dots', en: 'Dot matrix', tr: 'Nokta matrisi' },
  { id: 'plain', en: 'Plain', tr: 'Düz' },
];
const KEY = 'alu-backdrop';
const listeners = new Set<() => void>();
let cur: BackdropId | null = null;

function read(): BackdropId {
  if (cur) return cur;
  try {
    const v = window.localStorage.getItem(KEY) as BackdropId | null;
    cur = v && BACKDROPS.some((b) => b.id === v) ? v : 'grid';
  } catch {
    cur = 'grid';
  }
  return cur;
}

export function setBackdrop(id: BackdropId) {
  cur = id;
  try { window.localStorage.setItem(KEY, id); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function useBackdrop(): BackdropId {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    read,
    () => 'grid' as BackdropId,
  );
}
