/**
 * AluCAD — SVG vector drawing exporter (ISO 128 line conventions).
 *
 * Written from the shared primitive decomposition, so every entity — including gears,
 * sprockets, fasteners, belt drives, planetary sets, splines, ellipses and hatches — is
 * exported exactly as drawn. One SVG user unit is one millimetre; the sheet is sized in mm.
 * Layers that are off or frozen are left out; layer linetypes become dash arrays.
 */

import type { CadEntity, Layer } from '../kernel/types';
import type { Primitive, PrimStyle } from '../kernel/primitiveTypes';
import { geometryPrimitives, primitiveBounds } from '../kernel/primitives';
import { TAU, ccwSweep } from '../kernel/shapes';
import { hatchSegments } from '../kernel/hatchPatterns';
import { LINETYPES, isLayerShown, linetypeName } from '../kernel/layers';
import { bulgeArc } from '@/lib/dxf/dxfGeometry';

export interface SvgExportOptions {
  paddingMm?: number;
  theme?: 'dark' | 'light';
  backgroundColor?: string;
  defaultStrokeWidth?: number;
  includeTitleBlock?: boolean;
  partName?: string;
  drawingNumber?: string;
  material?: string;
  author?: string;
  company?: string;
  /** unit the canvas shows dimension values in */
  displayUnits?: string;
}

const f = (v: number) => {
  if (!Number.isFinite(v)) return '0';
  const s = v.toFixed(4).replace(/\.?0+$/, '');
  return s === '-0' ? '0' : s;
};
/** world (Y-up) → SVG (Y-down) */
const sx = (x: number) => f(x);
const sy = (y: number) => f(-y);

function dashFor(style: PrimStyle, layerLinetype: string | undefined): string | null {
  const name = style === 'center' ? 'CENTER' : style === 'hidden' ? 'HIDDEN' : style === 'dashed' ? 'DASHED' : linetypeName(layerLinetype);
  const pattern = LINETYPES[name].pattern;
  return pattern.length ? pattern.map((d) => f(Math.max(0.2, Math.abs(d)))).join(' ') : null;
}

function polylinePath(points: { x: number; y: number }[], bulges: number[] | undefined, closed: boolean): string {
  if (points.length === 0) return '';
  let d = `M ${sx(points[0].x)} ${sy(points[0].y)}`;
  const n = points.length;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const a = points[i], b = points[(i + 1) % n];
    const bulge = bulges?.[i] ?? 0;
    const arc = Math.abs(bulge) > 1e-12 ? bulgeArc(a, b, bulge) : null;
    if (arc) {
      const large = Math.abs(arc.sweep) > Math.PI ? 1 : 0;
      // world counter-clockwise is sweep-flag 0 in Y-down SVG
      d += ` A ${f(arc.r)} ${f(arc.r)} 0 ${large} ${arc.sweep > 0 ? 0 : 1} ${sx(b.x)} ${sy(b.y)}`;
    } else if (i < n - 1 || !closed) {
      d += ` L ${sx(b.x)} ${sy(b.y)}`;
    }
  }
  return closed ? `${d} Z` : d;
}

function primitiveSvg(p: Primitive, stroke: string, width: number, layerLinetype: string | undefined, textFill: string): string {
  const w = p.style === 'thin' ? width * 0.5 : width;
  const dash = dashFor(p.style, p.style === 'continuous' ? layerLinetype : undefined);
  const strokeAttr = `stroke="${stroke}" stroke-width="${f(w)}"${dash ? ` stroke-dasharray="${dash}"` : ''} fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  switch (p.kind) {
    case 'line':
      return `<line x1="${sx(p.a.x)}" y1="${sy(p.a.y)}" x2="${sx(p.b.x)}" y2="${sy(p.b.y)}" ${strokeAttr} />`;
    case 'circle':
      return `<circle cx="${sx(p.c.x)}" cy="${sy(p.c.y)}" r="${f(p.r)}" ${p.fill ? `fill="${stroke}" stroke="none"` : strokeAttr} />`;
    case 'arc': {
      const sweep = ccwSweep(p.start, p.end);
      const s = { x: p.c.x + p.r * Math.cos(p.start), y: p.c.y + p.r * Math.sin(p.start) };
      const e = { x: p.c.x + p.r * Math.cos(p.start + sweep), y: p.c.y + p.r * Math.sin(p.start + sweep) };
      return `<path d="M ${sx(s.x)} ${sy(s.y)} A ${f(p.r)} ${f(p.r)} 0 ${sweep > Math.PI ? 1 : 0} 0 ${sx(e.x)} ${sy(e.y)}" ${strokeAttr} />`;
    }
    case 'ellipse': {
      const rotDeg = (-p.rotation * 180) / Math.PI;
      if (p.sweep >= TAU - 1e-9) {
        return `<ellipse cx="${sx(p.c.x)}" cy="${sy(p.c.y)}" rx="${f(p.rx)}" ry="${f(p.ry)}" transform="rotate(${f(rotDeg)} ${sx(p.c.x)} ${sy(p.c.y)})" ${strokeAttr} />`;
      }
      const at = (t: number) => {
        const lx = p.rx * Math.cos(t), ly = p.ry * Math.sin(t);
        return { x: p.c.x + lx * Math.cos(p.rotation) - ly * Math.sin(p.rotation), y: p.c.y + lx * Math.sin(p.rotation) + ly * Math.cos(p.rotation) };
      };
      const s = at(p.start), e = at(p.start + p.sweep);
      return `<path d="M ${sx(s.x)} ${sy(s.y)} A ${f(p.rx)} ${f(p.ry)} ${f(rotDeg)} ${p.sweep > Math.PI ? 1 : 0} 0 ${sx(e.x)} ${sy(e.y)}" ${strokeAttr} />`;
    }
    case 'polyline': {
      const d = polylinePath(p.points, p.bulges, p.closed);
      return p.fill
        ? `<path d="${d}" fill="${stroke}" stroke="${stroke}" stroke-width="${f(w * 0.5)}" />`
        : `<path d="${d}" ${strokeAttr} />`;
    }
    case 'spline': {
      if (p.beziers.length === 0) return '';
      let d = `M ${sx(p.beziers[0].p0.x)} ${sy(p.beziers[0].p0.y)}`;
      for (const s of p.beziers) d += ` C ${sx(s.c1.x)} ${sy(s.c1.y)} ${sx(s.c2.x)} ${sy(s.c2.y)} ${sx(s.p1.x)} ${sy(s.p1.y)}`;
      return `<path d="${p.closed ? `${d} Z` : d}" ${strokeAttr} />`;
    }
    case 'text': {
      const anchor = p.align === 'center' ? 'middle' : p.align === 'right' ? 'end' : 'start';
      const rot = p.rotation ? ` transform="rotate(${f((-p.rotation * 180) / Math.PI)} ${sx(p.position.x)} ${sy(p.position.y)})"` : '';
      const weight = p.bold ? ' font-weight="bold"' : '';
      const italic = p.italic ? ' font-style="italic"' : '';
      return `<text x="${sx(p.position.x)}" y="${sy(p.position.y)}" fill="${textFill}" font-family="'JetBrains Mono', monospace" font-size="${f(p.height)}" text-anchor="${anchor}" dominant-baseline="hanging"${weight}${italic}${rot}>${escapeXml(p.content)}</text>`;
    }
    case 'point': {
      const s = 1;
      return `<path d="M ${sx(p.p.x - s)} ${sy(p.p.y)} L ${sx(p.p.x + s)} ${sy(p.p.y)} M ${sx(p.p.x)} ${sy(p.p.y - s)} L ${sx(p.p.x)} ${sy(p.p.y + s)}" stroke="${stroke}" stroke-width="${f(w * 0.6)}" />`;
    }
    case 'hatch': {
      if (p.pattern === 'SOLID') {
        const d = p.rings.map((r) => polylinePath(r, undefined, true)).join(' ');
        return `<path d="${d}" fill="${stroke}" fill-opacity="0.35" fill-rule="evenodd" stroke="none" />`;
      }
      const { segments } = hatchSegments(p.rings, p.pattern, p.scale, p.angle);
      if (segments.length === 0) return '';
      const d = segments.map(([a, b]) => `M ${sx(a.x)} ${sy(a.y)} L ${sx(b.x)} ${sy(b.y)}`).join(' ');
      return `<path d="${d}" stroke="${stroke}" stroke-width="${f(width * 0.4)}" fill="none" />`;
    }
    default:
      return '';
  }
}

export function generateSVG(
  entities: CadEntity[],
  layers: Layer[] = [],
  options: SvgExportOptions = {}
): string {
  const padding = options.paddingMm ?? 20;
  const isDark = (options.theme ?? 'dark') === 'dark';
  const bg = options.backgroundColor ?? (isDark ? '#07090e' : '#ffffff');
  const defaultStroke = isDark ? '#3ad0e6' : '#0f172a';
  const dimColor = isDark ? '#8a96a6' : '#475569';
  const textFill = isDark ? '#e7edf4' : '#0f172a';
  const strokeWidth = options.defaultStrokeWidth ?? 0.5;
  const layerMap = new Map<string, Layer>(layers.map((l) => [l.id, l]));

  const shown = entities.filter((e) => e && e.isVisible !== false && e.geometry && isLayerShown(layerMap.get(e.layerId)));
  const perEntity = shown.map((e) => ({ e, prims: geometryPrimitives(e.geometry, options.displayUnits ?? 'mm') }));
  const b = primitiveBounds(perEntity.flatMap((x) => x.prims)) ?? { minX: -50, minY: -50, maxX: 50, maxY: 50 };
  const { minX, minY, maxX, maxY } = b;

  const tbHeight = options.includeTitleBlock ? 45 : 0;
  const width = Math.max(20, maxX - minX + padding * 2);
  const height = Math.max(20, maxY - minY + padding * 2 + tbHeight);
  const originX = minX - padding;

  let svgElements = '';
  for (const { e, prims } of perEntity) {
    const layer = layerMap.get(e.layerId);
    const annotation = e.geometry.type === 'DIMENSION' || e.geometry.type === 'LEADER';
    const color = annotation ? dimColor : isDark ? (e.color || layer?.color || defaultStroke) : defaultStroke;
    const lw = layer?.lineWeight && layer.lineWeight > 1 ? strokeWidth * layer.lineWeight : strokeWidth;
    const g = e.geometry;
    if (g.type === 'RECTANGLE' && Math.abs(g.rotation ?? 0) < 1e-9 && g.center) {
      // axis-aligned rectangles stay editable <rect> elements
      const dash = dashFor('continuous', layer?.lineType);
      svgElements += `    <rect x="${f(g.center.x - g.width / 2)}" y="${f(-(g.center.y + g.height / 2))}" width="${f(g.width)}" height="${f(g.height)}" stroke="${color}" stroke-width="${f(lw)}"${dash ? ` stroke-dasharray="${dash}"` : ''} fill="none" />\n`;
      continue;
    }
    const parts = prims.map((p) => primitiveSvg(p, color, lw, layer?.lineType, textFill)).filter(Boolean);
    if (parts.length === 0) continue;
    svgElements += parts.length === 1 ? `    ${parts[0]}\n` : `    <g data-entity="${escapeXml(e.geometry.type)}">\n${parts.map((x) => `      ${x}`).join('\n')}\n    </g>\n`;
  }

  // Optional ISO Title Block
  let titleBlockSvg = '';
  if (options.includeTitleBlock) {
    const tbX = originX + 5;
    const tbY = -(minY - padding + 5);
    const tbW = width - 10;
    const tbH = 35;
    const dateStr = new Date().toISOString().split('T')[0];

    titleBlockSvg = `
    <!-- ISO 7200 Title Block Overlay -->
    <g id="iso-title-block">
      <rect x="${f(tbX)}" y="${f(tbY)}" width="${f(tbW)}" height="${tbH}" fill="${isDark ? '#0c1016' : '#f8fafc'}" stroke="${isDark ? '#243041' : '#cbd5e1'}" stroke-width="0.5" />
      <line x1="${f(tbX)}" y1="${f(tbY + 18)}" x2="${f(tbX + tbW)}" y2="${f(tbY + 18)}" stroke="${isDark ? '#243041' : '#cbd5e1'}" stroke-width="0.35" />
      <line x1="${f(tbX + tbW * 0.6)}" y1="${f(tbY)}" x2="${f(tbX + tbW * 0.6)}" y2="${f(tbY + 18)}" stroke="${isDark ? '#243041' : '#cbd5e1'}" stroke-width="0.35" />
      <text x="${f(tbX + 8)}" y="${f(tbY + 13)}" fill="${textFill}" font-family="'JetBrains Mono', monospace" font-size="7" font-weight="bold">${escapeXml(options.partName || 'ALUCAD 2D DRAWING')}</text>
      <text x="${f(tbX + tbW * 0.6 + 8)}" y="${f(tbY + 13)}" fill="${dimColor}" font-family="'JetBrains Mono', monospace" font-size="5">DWG: ${escapeXml(options.drawingNumber || 'ALU-2026')}</text>
      <text x="${f(tbX + 8)}" y="${f(tbY + 30)}" fill="${dimColor}" font-family="'JetBrains Mono', monospace" font-size="4.5">MATERIAL: ${escapeXml(options.material || 'EN AW-6082-T6')} | BY: ${escapeXml(options.author || 'AluCalc User')} | DATE: ${dateStr}</text>
    </g>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by AluCAD OS - AluCAD Studio 2D Vector Engine (ISO 128) -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(originX)} ${f(-(maxY + padding))} ${f(width)} ${f(height)}" width="${f(width)}mm" height="${f(height)}mm">
  <rect x="${f(originX)}" y="${f(-(maxY + padding))}" width="${f(width)}" height="${f(height)}" fill="${bg}" />
  <g id="alucad-drawing">
${svgElements}  </g>${titleBlockSvg}
</svg>`;
}

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
