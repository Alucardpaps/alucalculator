/**
 * AluCAD canvas palette — dark "model space" for dark app themes, white drafting paper
 * for light ones.
 *
 * The canvas element itself is painted with theme tokens (CSS); everything drawn with the
 * 2D context uses the concrete colours below. Entity colours go through `displayColor`,
 * which follows AutoCAD's ACI 7 rule (white ↔ black depending on the background) and
 * darkens very light colours on paper so yellow / cyan layers stay readable.
 *
 * The active palette is module state (one AluCAD canvas per page); CadCanvas switches it
 * when the app theme changes and then forces a full redraw.
 */

export interface CanvasPalette {
  isLight: boolean;
  /** CSS background of the canvas element */
  background: string;
  gridMinor: string;
  gridMajor: string;
  axisX: string;
  axisY: string;
  /** ACI 7 / entities without colour */
  entityDefault: string;
  selection: string;
  dimension: string;
  preview: string;
  snap: string;
  /** backing plate behind texts, dimension values and labels */
  labelBg: string;
  gripFill: string;
  gripStroke: string;
  cursor: string;
  /** strong neutral stroke for reference geometry (belts, bores, rims) */
  strokeStrong: string;
  strokeSoft: string;
}

export const DARK_CANVAS: CanvasPalette = {
  isLight: false,
  background: 'var(--bg-0)',
  gridMinor: 'rgba(255, 255, 255, 0.045)',
  gridMajor: 'rgba(255, 255, 255, 0.09)',
  axisX: 'rgba(255, 70, 70, 0.45)',
  axisY: 'rgba(70, 230, 110, 0.45)',
  entityDefault: '#eef2f6',
  selection: '#00e5ff',
  dimension: '#ffcc00',
  preview: '#ffff00',
  snap: '#ffcc00',
  labelBg: 'rgba(8, 12, 18, 0.92)',
  gripFill: '#ffffff',
  gripStroke: '#07090c',
  cursor: 'rgba(255, 255, 255, 0.3)',
  strokeStrong: 'rgba(255, 255, 255, 0.8)',
  strokeSoft: 'rgba(255, 255, 255, 0.5)',
};

export const LIGHT_CANVAS: CanvasPalette = {
  isLight: true,
  background: 'var(--bg-2)',
  gridMinor: 'rgba(15, 23, 42, 0.06)',
  gridMajor: 'rgba(15, 23, 42, 0.13)',
  axisX: 'rgba(220, 38, 38, 0.55)',
  axisY: 'rgba(22, 163, 74, 0.55)',
  entityDefault: '#1d232b',
  selection: '#0284c7',
  dimension: '#b45309',
  preview: '#c2410c',
  snap: '#d97706',
  labelBg: 'rgba(255, 255, 255, 0.94)',
  gripFill: '#ffffff',
  gripStroke: '#1d232b',
  cursor: 'rgba(15, 23, 42, 0.35)',
  strokeStrong: 'rgba(15, 23, 42, 0.75)',
  strokeSoft: 'rgba(15, 23, 42, 0.45)',
};

let active: CanvasPalette = DARK_CANVAS;
const cache = new Map<string, string>();

export function canvasPalette(): CanvasPalette {
  return active;
}

/** Switch the palette; returns true when it actually changed (caller redraws). */
export function setCanvasPalette(isLight: boolean): boolean {
  const next = isLight ? LIGHT_CANVAS : DARK_CANVAS;
  if (next === active) return false;
  active = next;
  cache.clear();
  return true;
}

function parseHex(color: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})([0-9a-f]{2})?$/i.exec(color.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** WCAG relative luminance (0 … 1). */
function luminance([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

const toHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;

/** Readable colour for an entity on the active canvas. */
export function displayColor(color: string | undefined | null): string {
  const p = active;
  if (!color) return p.entityDefault;
  const key = color.toLowerCase();
  const hit = cache.get(key);
  if (hit) return hit;

  let out = color;
  const rgb = parseHex(color);
  if (rgb) {
    const lum = luminance(rgb);
    if (p.isLight) {
      if (lum > 0.85) out = p.entityDefault; // white / near white (ACI 7) → ink
      else if (lum > 0.45) out = toHex(rgb[0] * 0.55, rgb[1] * 0.55, rgb[2] * 0.55); // yellow, cyan … → darker
    } else if (lum < 0.02) {
      out = p.entityDefault; // black (ACI 7 drawn on paper) → light ink
    }
  }
  cache.set(key, out);
  return out;
}
