/** Aggregates per-calculator localStorage history into a unified mobile feed. */

export interface RawCalcHistoryItem {
  timestamp: string;
  inputs: Record<string, unknown>;
  result: unknown;
}

export interface UnifiedCalcEntry {
  calcId: string;
  timestamp: string;
  inputs: Record<string, unknown>;
  result: unknown;
}

const HISTORY_PREFIX = 'calc_history_';

export function getAllCalcHistories(): UnifiedCalcEntry[] {
  if (typeof window === 'undefined') return [];
  const entries: UnifiedCalcEntry[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(HISTORY_PREFIX)) continue;
      const calcId = key.slice(HISTORY_PREFIX.length);
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const items: RawCalcHistoryItem[] = JSON.parse(raw);
      for (const item of items) {
        entries.push({ calcId, ...item });
      }
    }
  } catch {
    /* ignore */
  }
  return entries.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function listenCalcHistoryUpdates(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('calc-history-updated', callback);
  return () => window.removeEventListener('calc-history-updated', callback);
}
