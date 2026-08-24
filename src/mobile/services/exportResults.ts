import type { ModuleType } from '@/config/modules';

export interface ExportPayload {
  exportedAt: string;
  app: 'AluCalc OS';
  version: string;
  moduleType: ModuleType | string;
  moduleTitle: string;
  inputs?: Record<string, unknown>;
  result?: unknown;
  unitSystem?: string;
}

export async function exportResultsJson(payload: Omit<ExportPayload, 'exportedAt' | 'app' | 'version'>): Promise<void> {
  const data: ExportPayload = {
    exportedAt: new Date().toISOString(),
    app: 'AluCalc OS',
    version: '5.0.0',
    ...payload,
  };
  const json = JSON.stringify(data, null, 2);
  const filename = `alucalc-${payload.moduleType}-${Date.now()}.json`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      const file = new File([json], filename, { type: 'application/json' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: payload.moduleTitle });
        return;
      }
    } catch {
      /* fall through */
    }
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getLatestCalcResult(calcId: string): RawCalcHistoryItem | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`calc_history_${calcId}`);
    if (!raw) return null;
    const items = JSON.parse(raw);
    return items[0] ?? null;
  } catch {
    return null;
  }
}

interface RawCalcHistoryItem {
  timestamp: string;
  inputs: Record<string, unknown>;
  result: unknown;
}
