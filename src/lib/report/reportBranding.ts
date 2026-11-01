/**
 * Company identity for printed / exported reports (PDF, print view).
 * Stored per browser in localStorage — nothing leaves the device.
 */
import { useSyncExternalStore } from 'react';

export interface ReportBranding {
  companyName: string;
  companyLine: string;      // division, address or web site (second header line)
  logoDataUrl: string;      // PNG data URL (normalised on upload)
  logoAspect: number;       // width / height of the logo
  designedBy: string;
  checkedBy: string;
  approvedBy: string;
  documentPrefix: string;   // e.g. "ENG-" → ENG-240611-1234
  showApprovalBlock: boolean;
}

export const EMPTY_BRANDING: ReportBranding = {
  companyName: '',
  companyLine: '',
  logoDataUrl: '',
  logoAspect: 1,
  designedBy: '',
  checkedBy: '',
  approvedBy: '',
  documentPrefix: 'RPT-',
  showApprovalBlock: true,
};

const KEY = 'alu-report-branding';
const listeners = new Set<() => void>();
let cache: ReportBranding | null = null;

function read(): ReportBranding {
  if (cache) return cache;
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
    cache = raw ? { ...EMPTY_BRANDING, ...JSON.parse(raw) } : { ...EMPTY_BRANDING };
  } catch {
    cache = { ...EMPTY_BRANDING };
  }
  return cache!;
}

export function getReportBranding(): ReportBranding {
  return read();
}

export function setReportBranding(patch: Partial<ReportBranding>) {
  cache = { ...read(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* quota / private mode — keep in memory */
  }
  listeners.forEach((l) => l());
}

export function resetReportBranding() {
  setReportBranding({ ...EMPTY_BRANDING });
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) { cache = null; l(); }
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(l);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

export function useReportBranding(): ReportBranding {
  return useSyncExternalStore(subscribe, read, () => EMPTY_BRANDING);
}

export function nextDocumentNumber(b: ReportBranding = read()) {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `${b.documentPrefix || 'RPT-'}${ymd}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Normalise an uploaded logo (PNG/JPG/SVG/WebP) to a PNG data URL, max 600 px on the long side.
 * jsPDF cannot embed SVG, so everything is rasterised once here.
 */
export function normaliseLogo(file: File, maxPx = 600): Promise<{ dataUrl: string; aspect: number }> {
  return new Promise((resolve, reject) => {
    if (file.size > 3 * 1024 * 1024) { reject(new Error('Logo must be smaller than 3 MB')); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const w0 = img.naturalWidth || 300, h0 = img.naturalHeight || 300;
        const k = Math.min(1, maxPx / Math.max(w0, h0));
        const w = Math.max(1, Math.round(w0 * k)), h = Math.max(1, Math.round(h0 * k));
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        if (!ctx) { reject(new Error('Canvas unavailable')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ dataUrl: c.toDataURL('image/png'), aspect: w / h });
      };
      img.onerror = () => reject(new Error('Unsupported image'));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
