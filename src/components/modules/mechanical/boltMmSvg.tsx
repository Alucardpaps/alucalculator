'use client';

/**
 * Path coordinates are millimetres (1 SVG user unit = 1 mm).
 * On screen the viewBox is fitted to the card so the ~1 mm tooth is readable.
 * Downloaded SVG keeps width/height in millimetres.
 */
import React, { useId, useRef, useState } from 'react';
import { hexHalfHeight } from '@/hooks/useScrewMotion';
import {
  iso68FemalePath,
  iso68FemaleTooth,
  iso68MalePath,
  iso68MaleTooth,
  iso68PitchFrame,
  iso68Profile,
  type Iso68FemaleTooth,
  type Iso68MaleTooth,
} from '@/lib/fastener/iso68';
import type { BoltTypeId, BoltHeadDimensions } from '@/data/boltHeadStandards';
import { getBoltHeadDimensions } from '@/data/boltHeadStandards';
import { CrossModuleBridge } from '@/system/crossModuleBridge';
import { getFastenerStandardSpecs, type FastenerStandardSpec } from '@/lib/fastener/sharedEngine';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { t12 } from '@/locales/t12';

export type ScrewHandlers = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
};

export type ShopLike = {
  d: number;
  d2: number;
  d3: number;
  d1: number;
  p: number;
  s: number;
  e: number;
  k: number;
  m: number;
  L: number;
  b: number;
  ls: number;
  vanish: number;
  chamfer: number;
  r: number;
  tap: number;
  dw?: number;
  grade: string;
  threadCallout: string;
  tapCallout: string;
  metricKey?: string;
  fullyThreaded?: boolean;
  standard?: string;
  spec?: FastenerStandardSpec;
  boltType?: BoltTypeId;
  headDim?: BoltHeadDimensions;
  counterbore?: { dk: number; t: number; da: number };
};

export function maleThreadY(x0: number, x1: number, d: number, _d3: number, P: number, sign: 1 | -1): string {
  return iso68MalePath(d, P, x0, x1, sign);
}

export function femaleThreadY(x0: number, x1: number, D: number, _D1: number, P: number, sign: 1 | -1): string {
  return iso68FemalePath(D, P, x0, x1, sign);
}

function downloadSvg(el: SVGSVGElement | null, name: string, vbW: number, vbH: number) {
  if (!el) return;
  const clone = el.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', `${vbW}mm`);
  clone.setAttribute('height', `${vbH}mm`);
  const blob = new Blob(
    [
      '<?xml version="1.0" encoding="UTF-8"?>\n',
      '<!-- AluCalculator. 1 user unit = 1 mm. ISO 68-1. Do not rescale path data. -->\n',
      clone.outerHTML,
    ],
    { type: 'image/svg+xml;charset=utf-8' },
  );
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function defs(uid: string) {
  return (
    <defs>
      <marker id={`${uid}-a`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M0 1.5 L9 5 L0 8.5 Z" fill="var(--cyan)" />
      </marker>
      <marker id={`${uid}-b`} viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M9 1.5 L1 5 L9 8.5 Z" fill="var(--cyan)" />
      </marker>
      <pattern id={`${uid}-h`} patternUnits="userSpaceOnUse" width="1.2" height="1.2" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="1.2" stroke="var(--cyan)" strokeWidth="0.28" opacity="0.55" />
      </pattern>
      <pattern id={`${uid}-hatch`} patternUnits="userSpaceOnUse" width="2" height="2" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="2" stroke="var(--cyan)" strokeWidth="0.35" opacity="0.45" />
      </pattern>
      <pattern id={`${uid}-hatch2`} patternUnits="userSpaceOnUse" width="2" height="2" patternTransform="rotate(-45)">
        <line x1="0" y1="0" x2="0" y2="2" stroke="var(--warn)" strokeWidth="0.38" opacity="0.5" />
      </pattern>
      <linearGradient id={`${uid}-st`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#cbd5e1" />
        <stop offset="38%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="var(--line-strong)" />
      </linearGradient>
      <linearGradient id={`${uid}-cyl`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="16%" stopColor="#94a3b8" />
        <stop offset="38%" stopColor="#f8fafc" />
        <stop offset="62%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
      <linearGradient id={`${uid}-flank-lit`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="28%" stopColor="#ffffff" />
        <stop offset="65%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="var(--line-strong)" />
      </linearGradient>
      <linearGradient id={`${uid}-flank-shad`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="35%" stopColor="#334155" />
        <stop offset="75%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#0b1320" />
      </linearGradient>
      <linearGradient id={`${uid}-gold-tooth`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--warn)" />
        <stop offset="40%" stopColor="#fef08a" />
        <stop offset="80%" stopColor="var(--warn)" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id={`${uid}-rib`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0f172a" />
        <stop offset="30%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
      <linearGradient id={`${uid}-bore`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#020617" />
        <stop offset="45%" stopColor="#334155" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
    </defs>
  );
}

function DimH({
  uid, x1, x2, y, label, fs, color = 'var(--cyan)',
}: { uid: string; x1: number; x2: number; y: number; label: string; fs: number; color?: string }) {
  const a = Math.min(x1, x2);
  const b = Math.max(x1, x2);
  const mid = (a + b) / 2;
  const h = fs * 1.45;
  const w = Math.max(fs * 2.8, label.length * fs * 0.65 + fs * 1.2);
  const span = b - a;
  const tight = span < w * 1.05;
  const sw = Math.max(0.24, fs * 0.08);
  return (
    <g>
      <line
        x1={tight ? a - w * 0.35 : a}
        y1={y}
        x2={tight ? b + w * 0.35 : b}
        y2={y}
        stroke={color}
        strokeWidth={sw}
        markerStart={`url(#${uid}-b)`}
        markerEnd={`url(#${uid}-a)`}
      />
      <rect
        x={mid - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={fs * 0.25}
        fill="var(--bg-1)"
        stroke={color}
        strokeWidth={Math.max(0.18, fs * 0.07)}
      />
      <text
        x={mid}
        y={y}
        dominantBaseline="central"
        textAnchor="middle"
        fill="var(--ink, #ffffff)"
        fontSize={fs * 0.95}
        fontWeight="900"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      >
        {label}
      </text>
    </g>
  );
}

function DimV({
  uid, x, y1, y2, label, fs, color = 'var(--cyan)',
}: { uid: string; x: number; y1: number; y2: number; label: string; fs: number; color?: string }) {
  const a = Math.min(y1, y2);
  const b = Math.max(y1, y2);
  const mid = (a + b) / 2;
  const h = fs * 1.45;
  const w = Math.max(fs * 2.8, label.length * fs * 0.65 + fs * 1.2);
  const span = b - a;
  const tight = span < h * 1.05;
  const sw = Math.max(0.24, fs * 0.08);
  return (
    <g>
      <line
        x1={x}
        y1={tight ? a - h * 0.35 : a}
        y2={tight ? b + h * 0.35 : b}
        x2={x}
        stroke={color}
        strokeWidth={sw}
        markerStart={`url(#${uid}-b)`}
        markerEnd={`url(#${uid}-a)`}
      />
      <rect
        x={x - w / 2}
        y={mid - h / 2}
        width={w}
        height={h}
        rx={fs * 0.25}
        fill="var(--bg-1)"
        stroke={color}
        strokeWidth={Math.max(0.18, fs * 0.07)}
      />
      <text
        x={x}
        y={mid}
        dominantBaseline="central"
        textAnchor="middle"
        fill="var(--ink, #ffffff)"
        fontSize={fs * 0.95}
        fontWeight="900"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      >
        {label}
      </text>
    </g>
  );
}

function fileStem(callout: string) {
  return callout.replace(/[^\w.\-×x]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'thread';
}

function n4(v: number) {
  return v.toFixed(4);
}

function Banner({
  left, mid, onDownload, onExport3D, onToggleNut, showNut,
  nutSectionMode, onToggleNutSection,
  onTighten, onLoosen, onReset, turns = 0, lang = 'en', tr,
  viewMode, onToggleViewMode, zoomScale = 1, onZoomIn, onZoomOut, onResetZoom,
}: {
  left: string;
  mid: string;
  onDownload: () => void;
  onExport3D?: () => void;
  onToggleNut?: () => void;
  showNut?: boolean;
  nutSectionMode?: boolean;
  onToggleNutSection?: () => void;
  onTighten?: (delta: number) => void;
  onLoosen?: (delta: number) => void;
  onReset?: () => void;
  turns?: number;
  lang?: string;
  tr?: boolean;
  viewMode?: 'fit' | 'detail';
  onToggleViewMode?: () => void;
  zoomScale?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
}) {
  const precision = useGlobalPrecision();
  const effectiveLang = lang || (tr ? 'tr' : 'en');
  return (
    <div className="mb-2 space-y-2 px-1 font-mono text-[11px] text-[var(--alu-dim)]">
      {/* Top telemetry & export line */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-1.5">
        <span className="text-[var(--alu)]">{left}</span>
        <span className="font-bold text-[var(--cyan)]">{mid}</span>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onDownload}
            className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-[var(--cyan)] hover:bg-cyan-500/20 cursor-pointer"
          >
            {t12(effectiveLang, 'Download 1:1 SVG', '1:1 SVG İndir')}
          </button>
          {onExport3D && (
            <button
              type="button"
              onClick={onExport3D}
              className="rounded border border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-2.5 py-1 text-[11px] font-semibold text-[var(--warn)] hover:from-amber-500/30 hover:to-orange-500/30 shadow-sm transition-all cursor-pointer"
              title={t12(effectiveLang, 'Export to 3D Design Studio', "3D Design Studio'ya Aktar")}
            >
              {t12(effectiveLang, '3D Export', "3D'ye Aktar")}
            </button>
          )}
        </div>
      </div>

      {/* Interactive Tighten / Loosen & Assembly Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        {/* Loosen / Tighten Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[var(--alu-dim)] font-sans font-medium text-xs mr-1">
            {t12(effectiveLang, 'Tighten / Loosen:', 'Sıkma / Gevşetme:')}
          </span>
          {/* Loosen 1 turn button */}
          <button
            type="button"
            onClick={() => onLoosen?.(1)}
            className="flex items-center gap-1 rounded border border-rose-500/50 bg-rose-500/20 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-500/30 cursor-pointer transition-all active:scale-95 shadow-sm"
            title={t12(effectiveLang, 'Loosen 1 full turn (CCW)', 'Cıvatayı 1 Tam Tur Gevşet (Sola Çevir)')}
          >
            <span>↺</span>
            <span>{t12(effectiveLang, 'Loosen 1 Rev', '1 Tur Gevşet')}</span>
          </button>
          {/* Loosen 1/4 turn */}
          <button
            type="button"
            onClick={() => onLoosen?.(0.25)}
            className="rounded border border-[var(--line)] bg-[var(--bg-2)] px-2 py-1 text-[11px] font-mono text-[var(--alu)] hover:bg-[var(--bg-3)] cursor-pointer"
            title={t12(effectiveLang, 'Loosen ¼ turn', '¼ Tur Gevşet')}
          >
            -¼
          </button>
          {/* Reset button */}
          <button
            type="button"
            onClick={() => onReset?.()}
            className="rounded border border-cyan-500/40 bg-cyan-500/20 px-2.5 py-1 text-[11px] font-bold text-[var(--cyan)] hover:bg-cyan-500/30 cursor-pointer"
            title={t12(effectiveLang, 'Reset to initial position (0)', 'Başlangıç Konumuna Sıfırla (0 Tur)')}
          >
            {t12(effectiveLang, 'Reset', 'Sıfırla')}
          </button>
          {/* Tighten 1/4 turn */}
          <button
            type="button"
            onClick={() => onTighten?.(0.25)}
            className="rounded border border-[var(--line)] bg-[var(--bg-2)] px-2 py-1 text-[11px] font-mono text-[var(--alu)] hover:bg-[var(--bg-3)] cursor-pointer"
            title={t12(effectiveLang, 'Tighten ¼ turn', '¼ Tur Sık')}
          >
            +¼
          </button>
          {/* Tighten 1 turn button */}
          <button
            type="button"
            onClick={() => onTighten?.(1)}
            className="flex items-center gap-1 rounded border border-emerald-500/50 bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-[var(--ok)] hover:bg-emerald-500/30 cursor-pointer transition-all active:scale-95 shadow-sm"
            title={t12(effectiveLang, 'Tighten 1 full turn (CW)', 'Cıvatayı 1 Tam Tur Sık (Sağa Çevir)')}
          >
            <span>↻</span>
            <span>{t12(effectiveLang, 'Tighten 1 Rev', '1 Tur Sık')}</span>
          </button>

          {/* Current Turns Counter */}
          <span className="ml-1.5 rounded bg-black/40 px-2 py-0.5 font-mono text-[11px] text-[var(--warn)] border border-amber-500/30">
            {t12(effectiveLang, 'Turns:', 'Dönüş:')} {turns >= 0 ? '+' : ''}{formatEngineeringValue(turns, precision, false)}
          </span>
        </div>

        {/* View Mode & Zoom & Nut Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle (Full Scale vs Thread Zoom) */}
          {onToggleViewMode && (
            <button
              type="button"
              onClick={onToggleViewMode}
              className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'detail'
                  ? 'border border-purple-500/50 bg-purple-500/20 text-purple-300 shadow-sm'
                  : 'border border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu)] hover:bg-[var(--bg-3)]'
              }`}
              title={t12(effectiveLang, 'Toggle 4× thread detail zoom or full scale', 'Diş bölgesini 4× büyüterek odakla veya tam boy göster')}
            >
              <span>{viewMode === 'detail' ? '🔬' : '📐'}</span>
              <span>{viewMode === 'detail' ? t12(effectiveLang, 'Focus: THREAD (4×)', 'Odak: DİŞ & SOMUN (4×)') : t12(effectiveLang, 'View: FULL (1:1)', 'Görünüm: TAM BOY (1:1)')}</span>
            </button>
          )}

          {/* Zoom Buttons */}
          {onZoomIn && (
            <div className="flex items-center rounded border border-[var(--line)] bg-[var(--bg-2)] p-0.5 text-[11px]">
              <button
                type="button"
                onClick={onZoomOut}
                className="px-1.5 py-0.5 text-[var(--alu-dim)] hover:text-[var(--ink)] cursor-pointer hover:bg-[var(--bg-3)] rounded"
                title={t12(effectiveLang, 'Zoom Out (-)', 'Uzaklaştır (-)')}
              >
                -
              </button>
              <button
                type="button"
                onClick={onResetZoom}
                className="px-1.5 py-0.5 text-[var(--alu-dim)] hover:text-[var(--cyan)] cursor-pointer font-mono"
                title={t12(effectiveLang, 'Reset Zoom (100%)', 'Ölçeği Sıfırla (%100)')}
              >
                {Math.round(zoomScale * 100)}%
              </button>
              <button
                type="button"
                onClick={onZoomIn}
                className="px-1.5 py-0.5 text-[var(--alu-dim)] hover:text-[var(--ink)] cursor-pointer hover:bg-[var(--bg-3)] rounded"
                title={t12(effectiveLang, 'Zoom In (+)', 'Yakınlaştır (+)')}
              >
                +
              </button>
            </div>
          )}

          {/* Nut Toggles */}
          {onToggleNut !== undefined && (
            <button
              type="button"
              onClick={onToggleNut}
              className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                showNut
                  ? 'border border-cyan-500/40 bg-cyan-500/20 text-[var(--cyan)] shadow-sm'
                  : 'border border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-[var(--ink)]'
              }`}
            >
              <span>🔩</span>
              <span>{showNut ? t12(effectiveLang, 'Nut: ON', 'Somun: MONTAJLI') : t12(effectiveLang, 'Nut: OFF', 'Somun: YOK')}</span>
            </button>
          )}
          {showNut && onToggleNutSection !== undefined && (
            <button
              type="button"
              onClick={onToggleNutSection}
              className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                nutSectionMode
                  ? 'border border-amber-500/40 bg-amber-500/20 text-[var(--warn)] shadow-sm'
                  : 'border border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-[var(--ink)]'
              }`}
            >
              <span>{nutSectionMode ? '📐' : '🔩'}</span>
              <span>{nutSectionMode ? t12(effectiveLang, 'View: SECTION', 'Görünüm: KESİT') : t12(effectiveLang, 'View: SOLID 3D', 'Görünüm: 3D KATI')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CoordTable({
  title, rows, accent,
}: {
  title: string;
  rows: { id: string; x: number; y: number; note: string }[];
  accent: string;
}) {
  const precision = useGlobalPrecision();
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
      <div className={`bg-[var(--bg-2)] px-3 py-2 text-[13px] font-bold ${accent}`}>{title}</div>
      <table className="w-full min-w-[420px] text-left text-[12px]">
        <thead className="font-mono text-[11px] uppercase text-[var(--muted)]">
          <tr>
            <th className="px-3 py-1.5">Nokta</th>
            <th className="px-3 py-1.5 text-right">x mm</th>
            <th className="px-3 py-1.5 text-right">y = Ø/2 mm</th>
            <th className="px-3 py-1.5">Not</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-[var(--line)] even:bg-[var(--line)]/5">
              <td className="px-3 py-1 font-mono text-[var(--alu-dim)]">{r.id}</td>
              <td className="px-3 py-1 text-right font-mono tabular-nums text-[var(--ink)]">{Number.isFinite(r.x) ? formatEngineeringValue(r.x, precision, false) : '—'}</td>
              <td className="px-3 py-1 text-right font-mono tabular-nums text-[var(--ink)]">{Number.isFinite(r.y) ? formatEngineeringValue(r.y, precision, false) : '—'}</td>
              <td className="px-3 py-1 text-[var(--muted)]">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function hexPoints(cx: number, cy: number, vertexR: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 * Math.PI) / 180;
    return `${n4(cx + Math.cos(a) * vertexR)},${n4(cy + Math.sin(a) * vertexR)}`;
  }).join(' ');
}

function f4(n: number) {
  return (Math.round(n * 1e4) / 1e4).toFixed(4);
}

/**
 * Front-only Right-Hand (RH) helical band with axial width.
 * Standard RH thread viewed horizontally: top (y = -R) -> bottom (y = +R) slopes down-right (dx = +0.5P).
 * t in [0, 1] maps:
 *   t = 0: top crest/root, y = -R
 *   t = 0.5: front centerline, y = 0, cos(theta) = 1 (specular apex)
 *   t = 1: bottom crest/root, y = +R
 * Axial position: x(t) = cycleX + t * 0.5P
 */
function HelixBand({
  x0, x1, R, P, turns, shiftP = 0, width, depth = 0, fill, stroke, sw = 0,
}: {
  x0: number; x1: number; R: number; P: number; turns: number;
  shiftP?: number; width: number; depth?: number;
  fill: string; stroke?: string; sw?: number;
}) {
  if (x1 <= x0 || P <= 0 || R <= 0 || width <= 0) return null;
  const turnShift = (((turns % 1) + 1) % 1) * P;
  const kMin = Math.floor((-shiftP + turnShift - P * 2) / P);
  const kMax = Math.ceil((x1 - x0 - shiftP + turnShift + P * 2) / P);
  const segs: { L: { x: number; y: number }[]; R: { x: number; y: number }[] }[] = [];
  const n = 16;
  for (let k = kMin; k <= kMax; k++) {
    const cycleX = x0 + k * P - turnShift + shiftP;
    const L: { x: number; y: number }[] = [];
    const Rg: { x: number; y: number }[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = cycleX + t * (0.5 * P);
      if (x < x0 - width * 1.2 || x > x1 + width * 1.2) continue;
      const frontFactor = Math.sin(t * Math.PI); // 1 at front apex (t=0.5), 0 at silhouettes
      const Rvis = R - depth * frontFactor;
      const y = -Rvis * Math.cos(t * Math.PI);
      L.push({ x: x - width / 2, y });
      Rg.push({ x: x + width / 2, y });
    }
    if (L.length >= 2) segs.push({ L, R: Rg });
  }
  return (
    <g>
      {segs.map((s, idx) => {
        const d = [
          ...s.L.map((p, j) => `${j === 0 ? 'M' : 'L'}${f4(p.x)},${f4(p.y)}`),
          ...s.R.slice().reverse().map((p) => `L${f4(p.x)},${f4(p.y)}`),
          'Z',
        ].join(' ');
        return (
          <path
            key={idx}
            d={d}
            fill={fill}
            stroke={stroke ?? 'none'}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
}

function HelixStroke({
  x0, x1, R, P, turns, shiftP = 0, stroke, sw,
}: {
  x0: number; x1: number; R: number; P: number; turns: number;
  shiftP?: number; stroke: string; sw: number;
}) {
  if (x1 <= x0 || P <= 0 || R <= 0) return null;
  const turnShift = (((turns % 1) + 1) % 1) * P;
  const kMin = Math.floor((-shiftP + turnShift - P * 2) / P);
  const kMax = Math.ceil((x1 - x0 - shiftP + turnShift + P * 2) / P);
  const lines: { x: number; y: number }[][] = [];
  const n = 16;
  for (let k = kMin; k <= kMax; k++) {
    const cycleX = x0 + k * P - turnShift + shiftP;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = cycleX + t * (0.5 * P);
      if (x < x0 - 0.2 || x > x1 + 0.2) continue;
      const y = -R * Math.cos(t * Math.PI);
      pts.push({ x, y });
    }
    if (pts.length >= 2) lines.push(pts);
  }
  return (
    <g>
      {lines.map((pts, idx) => (
        <polyline
          key={idx}
          points={pts.map((p) => `${f4(p.x)},${f4(p.y)}`).join(' ')}
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

function SolidThread({
  x0, x1, Ro, Ri, P, turns, sw, male, uid,
}: {
  x0: number; x1: number; Ro: number; Ri: number; P: number; turns: number; sw: number; male: boolean; uid?: string;
}) {
  const depth = Math.max(0, Ro - Ri);
  if (male) {
    return (
      <g>
        {/* Shaded lower flank with metallic depth gradient: centered at shiftP = 0.25P */}
        <HelixBand x0={x0} x1={x1} R={Ro} P={P} turns={turns} shiftP={P * 0.25} width={P * 0.46} depth={depth * 0.65} fill={uid ? `url(#${uid}-flank-shad)` : "rgba(30,41,59,0.92)"} />
        {/* Lit upper flank catching overhead specular light: centered at shiftP = 0.75P */}
        <HelixBand x0={x0} x1={x1} R={Ro} P={P} turns={turns} shiftP={P * 0.75} width={P * 0.44} depth={0} fill={uid ? `url(#${uid}-flank-lit)` : "rgba(226,232,240,0.65)"} />
        {/* Specular crest ridge highlight: centered at shiftP = 0.5P */}
        <HelixStroke x0={x0} x1={x1} R={Ro} P={P} turns={turns} shiftP={P * 0.5} stroke="rgba(255,255,255,0.85)" sw={sw * 1.15} />
        {/* Deep root groove shadow: centered at shiftP = 0.0P */}
        <HelixStroke x0={x0} x1={x1} R={Ri} P={P} turns={turns} shiftP={0} stroke="rgba(2,6,23,0.95)" sw={sw * 1.25} />
      </g>
    );
  }
  return (
    <g>
      <HelixBand x0={x0} x1={x1} R={Ro} P={P} turns={turns} shiftP={P * 0.5} width={P * 0.48} depth={0} fill="rgba(148,163,184,0.32)" />
      <HelixBand x0={x0} x1={x1} R={Ro} P={P} turns={turns} shiftP={0} width={P * 0.2} depth={0} fill="rgba(226,232,240,0.42)" />
    </g>
  );
}

/** Side-view hex prism: only faces with a camera-facing normal. */
function HexBarrel({
  x0, x1, e, turns, strokeW,
}: { x0: number; x1: number; e: number; turns: number; strokeW: number }) {
  const r = e / 2;
  const faces: { i: number; y0: number; y1: number; lit: number; nz: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const a0 = ((i * 60 + turns * 360) * Math.PI) / 180;
    const a1 = (((i + 1) * 60 + turns * 360) * Math.PI) / 180;
    const nz = Math.cos((a0 + a1) / 2);
    if (nz <= 0.02) continue;
    faces.push({
      i,
      y0: r * Math.sin(a0),
      y1: r * Math.sin(a1),
      lit: 0.28 + 0.72 * nz,
      nz,
    });
  }
  faces.sort((a, b) => a.nz - b.nz);
  return (
    <g>
      {faces.map((f) => (
        <polygon
          key={f.i}
          points={`${f4(x0)},${f4(f.y0)} ${f4(x1)},${f4(f.y0)} ${f4(x1)},${f4(f.y1)} ${f4(x0)},${f4(f.y1)}`}
          fill={`rgb(${Math.round(72 + 168 * f.lit)},${Math.round(80 + 160 * f.lit)},${Math.round(90 + 150 * f.lit)})`}
          stroke="var(--ink)"
          strokeWidth={strokeW}
        />
      ))}
    </g>
  );
}

function HexFacets({
  cx, cy, vertexR, turns, strokeW,
}: { cx: number; cy: number; vertexR: number; turns: number; strokeW: number }) {
  const deg = f4(turns * 360);
  return (
    <g transform={`rotate(${deg} ${f4(cx)} ${f4(cy)})`}>
      {Array.from({ length: 6 }, (_, i) => {
        const a0 = (i * 60 * Math.PI) / 180;
        const a1 = ((i + 1) * 60 * Math.PI) / 180;
        const mid = (a0 + a1) / 2;
        const lit = 0.22 + 0.55 * Math.max(0, Math.cos(mid));
        const fill = `rgb(${Math.round(80 + 160 * lit)},${Math.round(90 + 150 * lit)},${Math.round(100 + 140 * lit)})`;
        return (
          <polygon
            key={i}
            points={`${f4(cx)},${f4(cy)} ${f4(cx + Math.cos(a0) * vertexR)},${f4(cy + Math.sin(a0) * vertexR)} ${f4(cx + Math.cos(a1) * vertexR)},${f4(cy + Math.sin(a1) * vertexR)}`}
            fill={fill}
            stroke="var(--ink)"
            strokeWidth={strokeW}
          />
        );
      })}
    </g>
  );
}

export type ToothProfileOpts = {
  xChamferRight?: number;
  xChamferLeft?: number;
  vanishRight?: boolean;
  vanishLeft?: boolean;
  cLeft?: number;
};

/**
 * Evaluates the ISO metric profile height Y(x) at the top of the bolt (y < 0).
 * Single-start RH helix.
 * Crest is at y = -d/2 (with flat width P/8 = 0.125P, centered at u = 0.5P).
 * Root is at y = -d3/2 (centered at u = 0).
 * For x > xChamfer, the outer envelope slopes at 45° down to -(d/2 - c).
 */
export function getTopY(
  x: number,
  xStart: number,
  xChamfer: number,
  d: number,
  d3: number,
  P: number,
  turnShift: number,
  opts?: ToothProfileOpts
): number {
  const crestY = -d / 2;
  let rootY = -d3 / 2;

  // Vanish right (thread runout blending into cylindrical OD at xEnd)
  if (opts?.vanishRight) {
    const vLen = Math.min(P * 0.8, (xChamfer > xStart ? xChamfer - xStart : P * 2) * 0.4);
    if (xChamfer > xStart && x > xChamfer - vLen) {
      const frac = Math.max(0, Math.min(1, (xChamfer - x) / vLen));
      rootY = crestY + frac * (-d3 / 2 - crestY);
    }
  }
  // Vanish left (thread runout blending from cylindrical OD at xStart)
  if (opts?.vanishLeft) {
    const vLen = Math.min(P * 0.8, (xChamfer > xStart ? xChamfer - xStart : P * 2) * 0.4);
    if (x < xStart + vLen) {
      const frac = Math.max(0, Math.min(1, (x - xStart) / vLen));
      rootY = crestY + frac * (-d3 / 2 - crestY);
    }
  }

  const u = (((x - xStart + turnShift) % P) + P) % P;
  let yRaw: number;
  if (u <= P * 0.4375) {
    yRaw = rootY + (u / (P * 0.4375)) * (crestY - rootY);
  } else if (u <= P * 0.5625) {
    yRaw = crestY;
  } else {
    yRaw = crestY + ((u - P * 0.5625) / (P * 0.4375)) * (rootY - crestY);
  }

  const chRight = opts?.xChamferRight ?? (xChamfer > xStart ? xChamfer : 0);
  if (chRight > xStart && x >= chRight) {
    const chamferY = -(d / 2 - (x - chRight));
    return chamferY;
  }
  const chLeft = opts?.xChamferLeft ?? 0;
  if (chLeft > xStart && x <= chLeft) {
    const cVal = opts?.cLeft ?? (chLeft - xStart);
    const chamferY = -(d / 2 - cVal * (1 - (x - xStart) / (chLeft - xStart)));
    return chamferY;
  }
  return yRaw;
}

/**
 * Evaluates the ISO metric profile height Y(x) at the bottom of the bolt (y > 0).
 * Bottom single-start RH helix is shifted by 0.5P relative to top.
 * Crest is at y = +d/2 (with flat width P/8 = 0.125P, centered at u_bot = 0.5P).
 * Root is at y = +d3/2 (centered at u_bot = 0).
 * For x > xChamfer, the outer envelope slopes at 45° down to +(d/2 - c).
 */
export function getBottomY(
  x: number,
  xStart: number,
  xChamfer: number,
  d: number,
  d3: number,
  P: number,
  turnShift: number,
  opts?: ToothProfileOpts
): number {
  const crestY = d / 2;
  let rootY = d3 / 2;

  if (opts?.vanishRight) {
    const vLen = Math.min(P * 0.8, (xChamfer > xStart ? xChamfer - xStart : P * 2) * 0.4);
    if (xChamfer > xStart && x > xChamfer - vLen) {
      const frac = Math.max(0, Math.min(1, (xChamfer - x) / vLen));
      rootY = crestY + frac * (d3 / 2 - crestY);
    }
  }
  if (opts?.vanishLeft) {
    const vLen = Math.min(P * 0.8, (xChamfer > xStart ? xChamfer - xStart : P * 2) * 0.4);
    if (x < xStart + vLen) {
      const frac = Math.max(0, Math.min(1, (x - xStart) / vLen));
      rootY = crestY + frac * (d3 / 2 - crestY);
    }
  }

  const u = (((x - xStart + turnShift - P * 0.5) % P) + P) % P;
  let yRaw: number;
  if (u <= P * 0.4375) {
    yRaw = rootY + (u / (P * 0.4375)) * (crestY - rootY);
  } else if (u <= P * 0.5625) {
    yRaw = crestY;
  } else {
    yRaw = crestY + ((u - P * 0.5625) / (P * 0.4375)) * (rootY - crestY);
  }

  const chRight = opts?.xChamferRight ?? (xChamfer > xStart ? xChamfer : 0);
  if (chRight > xStart && x >= chRight) {
    const chamferY = +(d / 2 - (x - chRight));
    return chamferY;
  }
  const chLeft = opts?.xChamferLeft ?? 0;
  if (chLeft > xStart && x <= chLeft) {
    const cVal = opts?.cLeft ?? (chLeft - xStart);
    const chamferY = +(d / 2 - cVal * (1 - (x - xStart) / (chLeft - xStart)));
    return chamferY;
  }
  return yRaw;
}

export function getTopToothPoints(
  xStart: number,
  xEnd: number,
  xChamfer: number,
  d: number,
  d3: number,
  P: number,
  turnShift: number,
  opts?: ToothProfileOpts
): { x: number; y: number }[] {
  if (xEnd <= xStart || P <= 0) return [];

  const kMin = Math.floor((xStart - xStart + turnShift - P * 2) / P);
  const kMax = Math.ceil((xEnd - xStart + turnShift + P * 2) / P);
  const criticalXSet = new Set<number>();

  const chRight = opts?.xChamferRight ?? (xChamfer > xStart ? xChamfer : 0);
  const chLeft = opts?.xChamferLeft ?? 0;

  for (let k = kMin; k <= kMax; k++) {
    const xBase = xStart + k * P - turnShift;
    const pts = [xBase, xBase + P * 0.4375, xBase + P * 0.5625];
    for (const p of pts) {
      if (p > xStart + 1e-4 && p < xEnd - 1e-4) {
        if ((chLeft === 0 || p >= chLeft) && (chRight === 0 || p <= chRight)) {
          criticalXSet.add(+p.toFixed(4));
        }
      }
    }
  }

  if (chRight > xStart && chRight < xEnd) {
    criticalXSet.add(+chRight.toFixed(4));
    const cLen = xEnd - chRight;
    for (let s = 1; s <= 8; s++) {
      const cx = chRight + (s / 8) * cLen;
      if (cx < xEnd - 1e-4) criticalXSet.add(+cx.toFixed(4));
    }
  }

  if (chLeft > xStart && chLeft < xEnd) {
    criticalXSet.add(+chLeft.toFixed(4));
    const cLen = chLeft - xStart;
    for (let s = 1; s <= 8; s++) {
      const cx = xStart + (s / 8) * cLen;
      if (cx < chLeft - 1e-4) criticalXSet.add(+cx.toFixed(4));
    }
  }

  if (opts?.vanishRight) {
    const vLen = Math.min(P * 0.8, (xEnd - xStart) * 0.4);
    if (vLen > 0) criticalXSet.add(+(xEnd - vLen).toFixed(4));
  }
  if (opts?.vanishLeft) {
    const vLen = Math.min(P * 0.8, (xEnd - xStart) * 0.4);
    if (vLen > 0) criticalXSet.add(+(xStart + vLen).toFixed(4));
  }

  const sortedX = Array.from(criticalXSet).sort((a, b) => a - b);
  const points: { x: number; y: number }[] = [];
  points.push({ x: xStart, y: getTopY(xStart, xStart, xChamfer, d, d3, P, turnShift, opts) });
  for (const cx of sortedX) {
    points.push({ x: cx, y: getTopY(cx, xStart, xChamfer, d, d3, P, turnShift, opts) });
  }
  points.push({ x: xEnd, y: getTopY(xEnd, xStart, xChamfer, d, d3, P, turnShift, opts) });

  return points;
}

export function getBottomToothPoints(
  xStart: number,
  xEnd: number,
  xChamfer: number,
  d: number,
  d3: number,
  P: number,
  turnShift: number,
  opts?: ToothProfileOpts
): { x: number; y: number }[] {
  if (xEnd <= xStart || P <= 0) return [];

  const chRight = opts?.xChamferRight ?? (xChamfer > xStart ? xChamfer : 0);
  const chLeft = opts?.xChamferLeft ?? 0;

  const kMin = Math.floor((xStart - xStart + turnShift - P * 2) / P);
  const kMax = Math.ceil((xEnd - xStart + turnShift + P * 2) / P);
  const criticalXSet = new Set<number>();

  for (let k = kMin; k <= kMax; k++) {
    const xBase = xStart + k * P - turnShift;
    const pts = [xBase + P * 0.5, xBase + P * 0.9375, xBase + P * 1.0625];
    for (const p of pts) {
      if (p > xStart + 1e-4 && p < xEnd - 1e-4) {
        if ((chLeft === 0 || p >= chLeft) && (chRight === 0 || p <= chRight)) {
          criticalXSet.add(+p.toFixed(4));
        }
      }
    }
  }

  if (chRight > xStart && chRight < xEnd) {
    criticalXSet.add(+chRight.toFixed(4));
    const cLen = xEnd - chRight;
    for (let s = 1; s <= 8; s++) {
      const cx = chRight + (s / 8) * cLen;
      if (cx < xEnd - 1e-4) criticalXSet.add(+cx.toFixed(4));
    }
  }

  if (chLeft > xStart && chLeft < xEnd) {
    criticalXSet.add(+chLeft.toFixed(4));
    const cLen = chLeft - xStart;
    for (let s = 1; s <= 8; s++) {
      const cx = xStart + (s / 8) * cLen;
      if (cx < chLeft - 1e-4) criticalXSet.add(+cx.toFixed(4));
    }
  }

  if (opts?.vanishRight) {
    const vLen = Math.min(P * 0.8, (xEnd - xStart) * 0.4);
    if (vLen > 0) criticalXSet.add(+(xEnd - vLen).toFixed(4));
  }
  if (opts?.vanishLeft) {
    const vLen = Math.min(P * 0.8, (xEnd - xStart) * 0.4);
    if (vLen > 0) criticalXSet.add(+(xStart + vLen).toFixed(4));
  }

  const sortedX = Array.from(criticalXSet).sort((a, b) => b - a);
  const points: { x: number; y: number }[] = [];
  points.push({ x: xEnd, y: getBottomY(xEnd, xStart, xChamfer, d, d3, P, turnShift, opts) });
  for (const cx of sortedX) {
    points.push({ x: cx, y: getBottomY(cx, xStart, xChamfer, d, d3, P, turnShift, opts) });
  }
  points.push({ x: xStart, y: getBottomY(xStart, xStart, xChamfer, d, d3, P, turnShift, opts) });

  return points;
}

export function BoltMaleSvg1to1({
  shop, lang = 'en', turns = 0, motion, screw,
}: {
  shop: ShopLike; lang?: string; turns?: number; motion?: ScrewHandlers; screw?: any;
}) {
  const precision = useGlobalPrecision();
  const uid = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const [showNut, setShowNut] = useState(true);
  const [nutSectionMode, setNutSectionMode] = useState(false);
  const [viewMode, setViewMode] = useState<'fit' | 'detail'>('fit');
  const [zoomScale, setZoomLevel] = useState<number>(1);
  const [localDelta, setLocalDelta] = useState(0);

  const live = !!motion;
  const effectiveTurns = (turns ?? 0) + localDelta;

  const boltType: BoltTypeId = shop.boltType || 'hex_bolt';
  const headDim = shop.headDim || getBoltHeadDimensions(boltType, shop.metricKey || `M${shop.d}`);

  const pr = iso68Profile(shop.d, shop.p);
  const d = pr.d;
  const d2 = pr.d2;
  const d3 = pr.d3;
  const P = pr.P;
  const c = Math.min(shop.chamfer, d / 2 - 0.2);
  const s = headDim?.s ?? shop.s;
  const e = headDim?.e ?? shop.e;
  const r = headDim?.r ?? shop.r;
  const dw = headDim?.dw ?? (shop.dw && shop.dw > d ? shop.dw : s * 0.95);

  // Specific dimensions based on boltType
  const dk = headDim?.dk ?? (boltType === 'socket_cap' ? d * 1.5 : boltType === 'countersunk' ? d * 1.8 : boltType === 'button_head' ? d * 1.75 : boltType === 'carriage_bolt' ? d * 2.0 : d * 1.5);
  const socketS = headDim?.s ?? (boltType === 'socket_cap' ? d * 0.8 : boltType === 'countersunk' ? d * 0.6 : boltType === 'button_head' ? d * 0.55 : s);
  const socketT = headDim?.t ?? (headDim?.k ? headDim.k * 0.55 : d * 0.4);
  const dc = headDim?.dc ?? (s * 1.25);
  const c_fl = Math.min(headDim?.c ?? ((headDim?.k || d * 0.7) * 0.28), (headDim?.k || d * 0.7) * 0.4);
  const neckV = headDim?.v ?? d;
  const neckF = headDim?.f ?? (d * 0.45);
  const bm = headDim?.bm ?? (d * 1.25);
  const dp = headDim?.dp ?? (d * 0.6);
  const d2Eye = headDim?.d2_eye ?? (d * 2.2);
  const d3Eye = headDim?.d3_eye ?? (d * 3.0);
  const d4Eye = headDim?.d4_eye ?? (d * 1.8);

  // Length and thread extents:
  let k = headDim?.k ?? shop.k;
  let L = shop.L;
  let b = Math.min(shop.b, L);
  let ls = Math.max(0, L - b);
  let xThr = k + ls;
  let xEnd = k + L;

  if (boltType === 'countersunk') {
    // In DIN 7991 countersunk screws, L is the overall length including head height k
    k = headDim?.k ?? (shop.k || d * 0.5);
    b = Math.min(shop.b, L);
    ls = Math.max(0, L - b - k);
    xThr = L - b;
    xEnd = L;
  } else if (boltType === 'stud_bolt') {
    // Stud bolt DIN 939: tap end length bm, usable length L = ls + b
    k = 0;
    b = Math.min(shop.b, L);
    ls = Math.max(0, L - b);
    xThr = bm + ls;
    xEnd = bm + L;
  } else if (boltType === 'set_screw') {
    // Set screw DIN 916: headless, length L
    k = 0;
    b = L;
    ls = 0;
    xThr = 0;
    xEnd = L;
  }

  const vanish = Math.min(2 * P, Math.max(0, b - P));
  const xChamfer = xEnd - c;
  const nTooth = Math.max(0, Math.floor((xEnd - xThr) / P + 1e-9));

  // Assembled Hex Nut (ISO 4032) - Real Kinematic Motion & Solid 3D Geometry
  const nutM = shop.m || d * 0.85;
  const nutS = shop.s || d * 1.6;
  const nutE = shop.e || nutS * 1.1547;
  const nutCham = Math.min(P * 0.5, nutM * 0.16);
  const sNut = hexHalfHeight(nutE, effectiveTurns * 360) * 2;

  // Kinematic Travel:
  const kBase = Math.max(2, Math.round(((xEnd - c - xThr - nutM) * 0.62) / P));
  const nutXBase = xThr + kBase * P - 0.375 * P;
  const nutX = Math.max(xThr, Math.min(xEnd - nutM, nutXBase - effectiveTurns * P));

  // Tightening status
  const isClamped = nutX <= xThr + 0.5;
  const isLoose = nutX >= xEnd - nutM - 0.5;
  const nutStatusText = isClamped
    ? t12(lang, '✓ CLAMPED (Seated)', '✓ SIKILDI (Dayandı)')
    : isLoose
    ? t12(lang, '⚠ LOOSE (Disengaging)', '⚠ GEVŞETİLDİ (Sökülüyor)')
    : t12(lang, `Engaged: ${effectiveTurns >= 0 ? '+' : ''}${formatEngineeringValue(effectiveTurns, precision, false)} rev`, `Dişte: ${effectiveTurns >= 0 ? '+' : ''}${formatEngineeringValue(effectiveTurns, precision, false)} tur`);
  const nutStatusColor = isClamped ? 'var(--ok)' : isLoose ? 'var(--warn)' : 'var(--cyan)';

  // ── INTELLIGENT BALANCED CAD VIEWPORT & ADAPTIVE SCALING ──
  const hexR = e / 2;
  const nutMaxR = (showNut && boltType !== 'set_screw') ? nutE / 2 : 0;
  const headMaxR = Math.max(
    s / 2,
    hexR,
    (boltType === 'flange_hex' ? dc : 0) / 2,
    (boltType === 'socket_cap' || boltType === 'low_head_socket' || boltType === 'countersunk' || boltType === 'button_head' || boltType === 'carriage_bolt' ? dk : 0) / 2,
    (boltType === 'eye_bolt' ? d3Eye : 0) / 2,
    d / 2
  );
  const physicalTop = Math.max(headMaxR, nutMaxR);
  const topR = physicalTop;
  const maxR = topR;

  // Geometry clearance & balanced dimension levels
  const estPadY = physicalTop * 1.55 + 24;
  const estVbH = estPadY * 2;
  // Scale-invariant font size: guarantees 21-25px equivalent on standard display
  const fs = Math.max(2.2, Math.min(10.0, estVbH * 0.042));
  const levelH = fs * 2.6;

  // Clearance for nut and upper dimensions
  const badgeTop = (showNut && boltType !== 'set_screw') ? (nutMaxR + fs * 1.6) : (d / 2);
  const dimTopBase = Math.max(physicalTop * 0.85 + fs * 1.0, badgeTop + fs * 1.2);
  const topExtent = dimTopBase + levelH * (ls > 0.8 ? 3.4 : 2.4) + fs * 1.8;
  const botExtent = Math.max(topR + levelH * (showNut ? 3.8 : 2.5) + fs * 1.6, Math.max(hexR, nutMaxR) + fs * 4.0);
  const padY = Math.max(topExtent, botExtent);

  const naturalH = padY * 2;

  // Proportional CAD spacing between Side View and End View
  const viewGap = Math.max(28, fs * 3.8, d * 0.7);
  const hexCx = xEnd + viewGap + Math.max(hexR, dk / 2, dc / 2, d3Eye / 2, d / 2);

  // Clean margins:
  const wHead = Math.max(30, fs * 9.0);
  const headBoxLeft = k * 0.5 - wHead / 2;
  const padL = Math.max(28, fs * 3.6, -headBoxLeft + fs * 1.8);
  const contentMinX = -padL;

  const padR = Math.max(hexR, dk / 2, dc / 2, d3Eye / 2, nutMaxR) + Math.max(28, fs * 3.6);
  const contentMaxX = hexCx + padR;

  const naturalW = contentMaxX - contentMinX;

  // Enforce 1.95:1 Landscape CAD Viewport: Prevents drawing from shrinking into a vertical box
  const targetRatio = 1.95;
  const minW = naturalH * targetRatio;
  let baseVbW = naturalW;
  let baseVbX = contentMinX;
  if (naturalW < minW) {
    const extra = minW - naturalW;
    baseVbW = minW;
    baseVbX = contentMinX - extra / 2;
  }
  let baseVbY = -padY;
  let baseVbH = naturalH;

  if (viewMode === 'detail') {
    // 4× Thread & Nut Focused Zoom (for tiny fasteners or detailed inspection)
    const zoomX0 = Math.max(0, xThr - Math.max(3, 1.5 * P));
    const zoomX1 = xEnd + Math.max(3, 1.5 * P);
    const zoomW = Math.max(16, zoomX1 - zoomX0);
    const zoomPadY = Math.max(maxR * 1.6 + 4, 10);
    baseVbX = zoomX0;
    baseVbY = -zoomPadY;
    baseVbW = zoomW;
    baseVbH = 2 * zoomPadY;
  }

  // Smooth Zoom Scaling around Center:
  const zoomFactor = 1 / zoomScale;
  const midX = baseVbX + baseVbW / 2;
  const midY = baseVbY + baseVbH / 2;
  const vbW = baseVbW * zoomFactor;
  const vbH = baseVbH * zoomFactor;
  const vbX = midX - vbW / 2;
  const vbY = midY - vbH / 2;

  const sHead = hexHalfHeight(e, effectiveTurns * 360) * 2;
  const face = Math.min(k * 0.22, s * 0.12);
  const fillet = Math.min(r, Math.max(0.15, (dw - d) / 4));
  const actualFillet = Math.min(fillet, ls > 0 ? ls : Math.min(fillet, P * 0.4));
  const hasShank = ls > actualFillet + 0.1;
  const xStartThr = boltType === 'stud_bolt' ? bm + ls : hasShank ? xThr : k + actualFillet;
  const xEndThr = xEnd;

  // Handlers for Tighten, Loosen, Reset, Zoom, View Mode
  const handleTighten = (delta: number = 1) => {
    if (screw?.tighten) {
      screw.tighten(delta);
    } else {
      setLocalDelta((prev) => prev + delta);
    }
  };

  const handleLoosen = (delta: number = 1) => {
    if (screw?.loosen) {
      screw.loosen(delta);
    } else {
      setLocalDelta((prev) => prev - delta);
    }
  };

  const handleReset = () => {
    if (screw?.reset) {
      screw.reset();
    }
    setLocalDelta(0);
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(3, +(prev + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(0.6, +(prev - 0.25).toFixed(2)));
  const handleResetZoom = () => setZoomLevel(1);
  const handleToggleViewMode = () => setViewMode((prev) => (prev === 'fit' ? 'detail' : 'fit'));

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      handleLoosen(0.25);
    } else {
      handleTighten(0.25);
    }
  };

  // 3D-effect dynamic tooth profile for bolt outline
  const turnShift = (((effectiveTurns % 1) + 1) % 1) * P;
  const topToothPts = getTopToothPoints(xStartThr, xEndThr, xChamfer, d, d3, P, turnShift);
  const botToothPts = getBottomToothPoints(xStartThr, xEndThr, xChamfer, d, d3, P, turnShift);

  const topPoints: string[] = [];

  // Top head segment
  if (boltType === 'socket_cap' || boltType === 'low_head_socket') {
    const headCham = Math.min(0.4, k * 0.08);
    topPoints.push(
      `M 0 ${n4(-(dk / 2 - headCham))}`,
      `L ${n4(headCham)} ${n4(-dk / 2)}`,
      `L ${n4(k)} ${n4(-dk / 2)}`,
      `L ${n4(k)} ${n4(-(d / 2 + actualFillet))}`,
      `A ${n4(actualFillet)} ${n4(actualFillet)} 0 0 1 ${n4(k + actualFillet)} ${n4(-d / 2)}`
    );
  } else if (boltType === 'countersunk') {
    topPoints.push(
      `M 0 ${n4(-dk / 2)}`,
      `L ${n4(k)} ${n4(-d / 2)}`
    );
  } else if (boltType === 'button_head') {
    topPoints.push(
      `M 0 0`,
      `Q ${n4(k * 0.3)} ${n4(-dk / 2)} ${n4(k)} ${n4(-dk / 2)}`,
      `L ${n4(k)} ${n4(-(d / 2 + actualFillet))}`,
      `A ${n4(actualFillet)} ${n4(actualFillet)} 0 0 1 ${n4(k + actualFillet)} ${n4(-d / 2)}`
    );
  } else if (boltType === 'flange_hex') {
    const barrelK = Math.max(0.5, k - c_fl);
    topPoints.push(
      `M 0 ${n4(-sHead / 2 + face)}`,
      `L ${n4(face)} ${n4(-sHead / 2)}`,
      `L ${n4(barrelK)} ${n4(-sHead / 2)}`,
      `L ${n4(barrelK)} ${n4(-dc / 2)}`,
      `L ${n4(k)} ${n4(-dc / 2)}`,
      `L ${n4(k)} ${n4(-(d / 2 + actualFillet))}`,
      `A ${n4(actualFillet)} ${n4(actualFillet)} 0 0 1 ${n4(k + actualFillet)} ${n4(-d / 2)}`
    );
  } else if (boltType === 'carriage_bolt') {
    const k1 = k - neckF;
    topPoints.push(
      `M 0 0`,
      `Q ${n4(k1 * 0.3)} ${n4(-dk / 2)} ${n4(k1)} ${n4(-dk / 2)}`,
      `L ${n4(k1)} ${n4(-neckV / 2)}`,
      `L ${n4(k)} ${n4(-neckV / 2)}`,
      `L ${n4(k)} ${n4(-(d / 2 + actualFillet))}`,
      `A ${n4(actualFillet)} ${n4(actualFillet)} 0 0 1 ${n4(k + actualFillet)} ${n4(-d / 2)}`
    );
  } else if (boltType === 'eye_bolt') {
    const hc = Math.max(1, k * 0.28);
    const kRing = k - hc;
    topPoints.push(
      `M 0 ${n4(-d3Eye / 2)}`,
      `L ${n4(kRing)} ${n4(-d3Eye / 2)}`,
      `L ${n4(kRing)} ${n4(-d2Eye / 2)}`,
      `L ${n4(k)} ${n4(-d2Eye / 2)}`,
      `L ${n4(k)} ${n4(-(d / 2 + actualFillet))}`,
      `A ${n4(actualFillet)} ${n4(actualFillet)} 0 0 1 ${n4(k + actualFillet)} ${n4(-d / 2)}`
    );
  } else if (boltType === 'stud_bolt') {
    // Tap-end left tip has DIN 78 45° chamfer down to face diameter (d - 2*c) and ISO 68 teeth
    const tapTopTooth = getTopToothPoints(0, bm, bm, d, d3, P, turnShift, {
      xChamferLeft: c,
      cLeft: c,
      vanishRight: true,
    });
    for (let i = 0; i < tapTopTooth.length; i++) {
      const pt = tapTopTooth[i];
      if (i === 0) {
        topPoints.push(`M ${n4(pt.x)} ${n4(pt.y)}`);
      } else {
        topPoints.push(`L ${n4(pt.x)} ${n4(pt.y)}`);
      }
    }
  } else if (boltType === 'set_screw') {
    topPoints.push(`M 0 ${n4(-d / 2)}`);
  } else {
    // hex_bolt & heavy_hex
    topPoints.push(
      `M 0 ${n4(-sHead / 2 + face)}`,
      `L ${n4(face)} ${n4(-sHead / 2)}`,
      `L ${n4(k)} ${n4(-sHead / 2)}`,
      `L ${n4(k)} ${n4(-(d / 2 + actualFillet))}`,
      `A ${n4(actualFillet)} ${n4(actualFillet)} 0 0 1 ${n4(k + actualFillet)} ${n4(-d / 2)}`
    );
  }

  // Top shank
  if (hasShank && boltType !== 'set_screw') {
    if (boltType === 'stud_bolt') {
      topPoints.push(
        `L ${n4(bm)} ${n4(-d / 2)}`,
        `L ${n4(xStartThr)} ${n4(-d / 2)}`
      );
    } else {
      topPoints.push(`L ${n4(xStartThr)} ${n4(-d / 2)}`);
    }
  }

  // Top tooth points
  if (boltType === 'stud_bolt') {
    const nutTopTooth = getTopToothPoints(xStartThr, xEndThr, xChamfer, d, d3, P, turnShift, {
      vanishLeft: true,
      xChamferRight: xChamfer,
    });
    for (const pt of nutTopTooth) {
      topPoints.push(`L ${n4(pt.x)} ${n4(pt.y)}`);
    }
  } else {
    for (const pt of topToothPts) {
      topPoints.push(`L ${n4(pt.x)} ${n4(pt.y)}`);
    }
  }

  // Tip connection
  if (boltType === 'set_screw') {
    topPoints.push(
      `L ${n4(xEnd)} ${n4(-dp / 2)}`,
      `L ${n4(xEnd - 0.4 * P)} 0`,
      `L ${n4(xEnd)} ${n4(dp / 2)}`
    );
  }

  // Bottom tooth points
  if (boltType === 'stud_bolt') {
    const nutBotTooth = getBottomToothPoints(xStartThr, xEndThr, xChamfer, d, d3, P, turnShift, {
      vanishLeft: true,
      xChamferRight: xChamfer,
    });
    for (const pt of nutBotTooth) {
      topPoints.push(`L ${n4(pt.x)} ${n4(pt.y)}`);
    }
  } else {
    for (const pt of botToothPts) {
      topPoints.push(`L ${n4(pt.x)} ${n4(pt.y)}`);
    }
  }

  // Bottom shank
  if (hasShank && boltType !== 'set_screw') {
    if (boltType === 'stud_bolt') {
      topPoints.push(`L ${n4(bm)} ${n4(d / 2)}`);
    } else {
      topPoints.push(`L ${n4(xStartThr)} ${n4(d / 2)}`);
    }
  }

  // Bottom head segment
  if (boltType === 'socket_cap' || boltType === 'low_head_socket') {
    const headCham = Math.min(0.4, k * 0.08);
    topPoints.push(
      `L ${n4(k + actualFillet)} ${n4(d / 2)}`,
      `A ${n4(actualFillet)} ${n4(actualFillet)} 0 0 1 ${n4(k)} ${n4(d / 2 + actualFillet)}`,
      `L ${n4(k)} ${n4(dk / 2)}`,
      `L ${n4(headCham)} ${n4(dk / 2)}`,
      `L 0 ${n4(dk / 2 - headCham)}`,
      'Z'
    );
  } else if (boltType === 'countersunk') {
    topPoints.push(
      `L ${n4(k)} ${n4(d / 2)}`,
      `L 0 ${n4(dk / 2)}`,
      'Z'
    );
  } else if (boltType === 'button_head') {
    topPoints.push(
      `L ${n4(k + actualFillet)} ${n4(d / 2)}`,
      `A ${n4(actualFillet)} ${n4(actualFillet)} 0 0 1 ${n4(k)} ${n4(d / 2 + actualFillet)}`,
      `L ${n4(k)} ${n4(dk / 2)}`,
      `Q ${n4(k * 0.3)} ${n4(dk / 2)} 0 0`,
      'Z'
    );
  } else if (boltType === 'flange_hex') {
    const barrelK = Math.max(0.5, k - c_fl);
    topPoints.push(
      `L ${n4(k + actualFillet)} ${n4(d / 2)}`,
      `A ${n4(actualFillet)} ${n4(actualFillet)} 0 0 1 ${n4(k)} ${n4(d / 2 + actualFillet)}`,
      `L ${n4(k)} ${n4(dc / 2)}`,
      `L ${n4(barrelK)} ${n4(dc / 2)}`,
      `L ${n4(barrelK)} ${n4(sHead / 2)}`,
      `L ${n4(face)} ${n4(sHead / 2)}`,
      `L 0 ${n4(sHead / 2 - face)}`,
      'Z'
    );
  } else if (boltType === 'carriage_bolt') {
    const k1 = k - neckF;
    topPoints.push(
      `L ${n4(k + actualFillet)} ${n4(d / 2)}`,
      `A ${n4(actualFillet)} ${n4(actualFillet)} 0 0 1 ${n4(k)} ${n4(d / 2 + actualFillet)}`,
      `L ${n4(k)} ${n4(neckV / 2)}`,
      `L ${n4(k1)} ${n4(neckV / 2)}`,
      `L ${n4(k1)} ${n4(dk / 2)}`,
      `Q ${n4(k1 * 0.3)} ${n4(dk / 2)} 0 0`,
      'Z'
    );
  } else if (boltType === 'eye_bolt') {
    const hc = Math.max(1, k * 0.28);
    const kRing = k - hc;
    topPoints.push(
      `L ${n4(k + actualFillet)} ${n4(d / 2)}`,
      `A ${n4(actualFillet)} ${n4(actualFillet)} 0 0 1 ${n4(k)} ${n4(d / 2 + actualFillet)}`,
      `L ${n4(k)} ${n4(d2Eye / 2)}`,
      `L ${n4(kRing)} ${n4(d2Eye / 2)}`,
      `L ${n4(kRing)} ${n4(d3Eye / 2)}`,
      `L 0 ${n4(d3Eye / 2)}`,
      'Z'
    );
  } else if (boltType === 'stud_bolt') {
    const tapBotTooth = getBottomToothPoints(0, bm, bm, d, d3, P, turnShift, {
      xChamferLeft: c,
      cLeft: c,
      vanishRight: true,
    });
    for (const pt of tapBotTooth) {
      topPoints.push(`L ${n4(pt.x)} ${n4(pt.y)}`);
    }
    topPoints.push('Z');
  } else if (boltType === 'set_screw') {
    topPoints.push(`L 0 ${n4(d / 2)}`, 'Z');
  } else {
    // hex_bolt & heavy_hex
    topPoints.push(
      `L ${n4(k + actualFillet)} ${n4(d / 2)}`,
      `A ${n4(actualFillet)} ${n4(actualFillet)} 0 0 1 ${n4(k)} ${n4(d / 2 + actualFillet)}`,
      `L ${n4(k)} ${n4(sHead / 2)}`,
      `L ${n4(face)} ${n4(sHead / 2)}`,
      `L 0 ${n4(sHead / 2 - face)}`,
      'Z'
    );
  }

  const outline = topPoints.join(' ');

  const headClip = boltType === 'socket_cap' || boltType === 'low_head_socket'
    ? `M 0 ${n4(-dk / 2)} L ${n4(k)} ${n4(-dk / 2)} L ${n4(k)} ${n4(dk / 2)} L 0 ${n4(dk / 2)} Z`
    : boltType === 'countersunk'
    ? `M 0 ${n4(-dk / 2)} L ${n4(k)} ${n4(-d / 2)} L ${n4(k)} ${n4(d / 2)} L 0 ${n4(dk / 2)} Z`
    : boltType === 'button_head'
    ? `M 0 0 Q ${n4(k * 0.3)} ${n4(-dk / 2)} ${n4(k)} ${n4(-dk / 2)} L ${n4(k)} ${n4(dk / 2)} Q ${n4(k * 0.3)} ${n4(dk / 2)} 0 0 Z`
    : boltType === 'flange_hex'
    ? `M 0 ${n4(-sHead / 2)} L ${n4(Math.max(0.5, k - c_fl))} ${n4(-sHead / 2)} L ${n4(Math.max(0.5, k - c_fl))} ${n4(-dc / 2)} L ${n4(k)} ${n4(-dc / 2)} L ${n4(k)} ${n4(dc / 2)} L ${n4(Math.max(0.5, k - c_fl))} ${n4(dc / 2)} L ${n4(Math.max(0.5, k - c_fl))} ${n4(sHead / 2)} L 0 ${n4(sHead / 2)} Z`
    : boltType === 'carriage_bolt'
    ? `M 0 0 Q ${n4((k - neckF) * 0.3)} ${n4(-dk / 2)} ${n4(k - neckF)} ${n4(-dk / 2)} L ${n4(k)} ${n4(-neckV / 2)} L ${n4(k)} ${n4(neckV / 2)} L ${n4(k - neckF)} ${n4(dk / 2)} Q ${n4((k - neckF) * 0.3)} ${n4(dk / 2)} 0 0 Z`
    : boltType === 'eye_bolt'
    ? `M 0 ${n4(-d3Eye / 2)} L ${n4(k - Math.max(1, k * 0.28))} ${n4(-d3Eye / 2)} L ${n4(k - Math.max(1, k * 0.28))} ${n4(-d2Eye / 2)} L ${n4(k)} ${n4(-d2Eye / 2)} L ${n4(k)} ${n4(d2Eye / 2)} L ${n4(k - Math.max(1, k * 0.28))} ${n4(d2Eye / 2)} L ${n4(k - Math.max(1, k * 0.28))} ${n4(d3Eye / 2)} L 0 ${n4(d3Eye / 2)} Z`
    : `M 0 ${n4(-sHead / 2 + face)} L ${n4(face)} ${n4(-sHead / 2)} L ${n4(k)} ${n4(-sHead / 2)} L ${n4(k)} ${n4(sHead / 2)} L ${n4(face)} ${n4(sHead / 2)} L 0 ${n4(sHead / 2 - face)} Z`;

  const handleExport3D = () => {
    const threadCallout = String(shop.threadCallout || '');
    const metricKey = String(shop.metricKey || '');
    const tType = /NPTF/i.test(threadCallout)
      ? 'NPTF'
      : /NPT/i.test(threadCallout)
      ? 'NPT'
      : /BSPT/i.test(threadCallout) || threadCallout.startsWith('R')
      ? 'BSPT'
      : /BSPP/i.test(threadCallout) || threadCallout.startsWith('G')
      ? 'BSPP'
      : /W/i.test(threadCallout) || /Gas/i.test(threadCallout)
      ? 'W'
      : /UNF/i.test(threadCallout)
      ? 'UNF'
      : /UNC/i.test(threadCallout)
      ? 'UNC'
      : /Tr/i.test(threadCallout)
      ? 'Tr'
      : (metricKey.startsWith('M') ? 'M' : 'M');

    const effectiveSpec = shop.spec || getFastenerStandardSpecs(
      shop.standard || (/UNC/i.test(threadCallout) ? 'UNC' : /UNF/i.test(threadCallout) ? 'UNF' : /NPT/i.test(threadCallout) ? 'NPT' : /BSPP/i.test(threadCallout) ? 'BSPP (G)' : /BSPT/i.test(threadCallout) ? 'BSPT (R)' : /Tr/i.test(threadCallout) ? 'Trapezoidal' : 'Metric Coarse'),
      shop.metricKey,
      b >= L,
      boltType,
    );

    const stdName = shop.standard || effectiveSpec?.boltCurrent || '';
    const fullTitle = `${stdName} ${threadCallout || metricKey}×${L}${shop.grade ? ` ${shop.grade}` : ''}`.trim();

    CrossModuleBridge.exportThreadTo3D({
      type: tType,
      nominalDia: d,
      pitch: P,
      lengthMm: L,
      threadLength: b,
      shankLength: ls,
      headWidth: s,
      headHeight: k,
      cornerWidth: e,
      headDiameter: dk,
      socketSize: socketS,
      socketDepth: socketT,
      flangeDiameter: dc,
      flangeThickness: c_fl,
      boltType: boltType,
      nutWidth: nutS,
      nutHeight: nutM,
      nutCornerWidth: nutE,
      nutPositionMm: Math.max(0, nutX - k),
      grade: shop.grade,
      standard: stdName,
      nutStandard: effectiveSpec?.nutStandard,
      title: fullTitle,
      role: showNut && boltType !== 'set_screw' ? 'assembly' : 'bolt',
      switchWindow: true,
    });
  };

  // Leader sample location for Ød2 and Ød3 that dynamically clears the nut and 2P runout
  const threadLen = Math.max(P, xEnd - xThr);
  const spec = shop.spec || getFastenerStandardSpecs(
    shop.standard || (/UNC/i.test(shop.threadCallout) ? 'UNC' : /UNF/i.test(shop.threadCallout) ? 'UNF' : /NPT/i.test(shop.threadCallout) ? 'NPT' : /BSPP/i.test(shop.threadCallout) ? 'BSPP (G)' : /BSPT/i.test(shop.threadCallout) ? 'BSPT (R)' : /Tr/i.test(shop.threadCallout) ? 'Trapezoidal' : 'Metric Coarse'),
    shop.metricKey,
    shop.b >= shop.L,
    boltType,
  );
  const sampleX = showNut
    ? (nutX > xThr + threadLen * 0.52
        ? xThr + Math.max(1.5 * P, (nutX - xThr) * 0.45)
        : Math.min(xChamfer - 1.8 * P, nutX + nutM + 1.5 * P))
    : (xThr + threadLen * 0.45);

  const headLabel = boltType === 'socket_cap' || boltType === 'low_head_socket'
    ? `dk=${formatEngineeringValue(dk, precision, false)}  k=${formatEngineeringValue(k, precision, false)}  s=${formatEngineeringValue(socketS, precision, false)}  t=${formatEngineeringValue(socketT, precision, false)}`
    : boltType === 'countersunk'
    ? `dk=${formatEngineeringValue(dk, precision, false)}  90°  s=${formatEngineeringValue(socketS, precision, false)}  t=${formatEngineeringValue(socketT, precision, false)}`
    : boltType === 'button_head'
    ? `dk=${formatEngineeringValue(dk, precision, false)}  k=${formatEngineeringValue(k, precision, false)}  s=${formatEngineeringValue(socketS, precision, false)}`
    : boltType === 'flange_hex'
    ? `dc=${formatEngineeringValue(dc, precision, false)}  s=${formatEngineeringValue(s, precision, false)}  k=${formatEngineeringValue(k, precision, false)}  c=${formatEngineeringValue(c_fl, precision, false)}`
    : boltType === 'carriage_bolt'
    ? `dk=${formatEngineeringValue(dk, precision, false)}  k=${formatEngineeringValue(k, precision, false)}  v=${formatEngineeringValue(neckV, precision, false)}  f=${formatEngineeringValue(neckF, precision, false)}`
    : boltType === 'eye_bolt'
    ? `d₃=${formatEngineeringValue(d3Eye, precision, false)}  d₄=${formatEngineeringValue(d4Eye, precision, false)}  d₂=${formatEngineeringValue(d2Eye, precision, false)}`
    : boltType === 'stud_bolt'
    ? `bm=${formatEngineeringValue(bm, precision, false)} (Tap)  ls=${formatEngineeringValue(ls, precision, false)}  b=${formatEngineeringValue(b, precision, false)} (Nut)`
    : boltType === 'set_screw'
    ? `s=${formatEngineeringValue(socketS, precision, false)}  t=${formatEngineeringValue(socketT, precision, false)}  dp=${formatEngineeringValue(dp, precision, false)}`
    : `s=${formatEngineeringValue(s, precision, false)}  dw=${formatEngineeringValue(dw, precision, false)}  r=${formatEngineeringValue(r, precision, false)}`;

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--bg-1)] p-2">
      <Banner
        lang={lang}
        left={live
          ? t12(lang, 'Left click / Wheel: Tighten/Loosen · Shift+Click: Loosen', 'Sol tık / Çark: Sık/Gevşet · Shift+Tık: Gevşet')
          : t12(lang, 'Data 1 unit = 1 mm · fitted on screen', 'Veri 1 birim = 1 mm · ekran karta sığdırılır')}
        mid={`${shop.threadCallout} · ${formatEngineeringValue(vbW, precision, false)} × ${formatEngineeringValue(vbH, precision, false)} mm`}
        showNut={showNut && boltType !== 'set_screw'}
        onToggleNut={() => setShowNut(!showNut)}
        nutSectionMode={nutSectionMode}
        onToggleNutSection={() => setNutSectionMode(!nutSectionMode)}
        onTighten={handleTighten}
        onLoosen={handleLoosen}
        onReset={handleReset}
        turns={effectiveTurns}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        zoomScale={zoomScale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onExport3D={handleExport3D}
        onDownload={() => downloadSvg(svgRef.current, `${fileStem(shop.threadCallout)}-erkek-1to1.svg`, vbW, vbH)}
      />
      <svg
        ref={svgRef}
        viewBox={`${f4(vbX)} ${f4(vbY)} ${f4(vbW)} ${f4(vbH)}`}
        className={`h-auto w-full ${live ? 'cursor-grab active:cursor-grabbing select-none' : ''}`}
        style={{ minHeight: '380px', maxHeight: '680px', ...(live ? { touchAction: 'none' } : {}) }}
        onWheel={handleWheel}
        role="img"
        data-unit="mm"
        data-scale="1:1"
        data-d={n4(d)}
        data-p={n4(P)}
        data-d2={n4(d2)}
        data-d3={n4(d3)}
        data-k={n4(k)}
        data-length={n4(L)}
        data-b={n4(b)}
        data-s={n4(s)}
        data-e={n4(e)}
        {...(motion ?? {})}
      >
        {defs(uid)}
        <clipPath id={`${uid}-head`}>
          <path d={headClip} />
        </clipPath>
        <clipPath id={`${uid}-body`}>
          <path d={outline} />
        </clipPath>

        <rect x={vbX} y={vbY} width={vbW} height={vbH} fill="var(--bg-2)" stroke="var(--line)" />
        
        {/* Centerline passing through bolt and end view */}
        <line x1={contentMinX + 2} y1={0} x2={contentMaxX - 2} y2={0} stroke="var(--cyan)" strokeWidth={fs * 0.06} strokeDasharray={`${fs} ${fs * 0.35} ${fs * 0.18} ${fs * 0.35}`} />

        {/* Bolt body metallic fill */}
        <path d={outline} fill={`url(#${uid}-cyl)`} stroke="none" />

        {/* Head 3D Features according to boltType */}
        {boltType === 'socket_cap' || boltType === 'low_head_socket' ? (
          <g clipPath={`url(#${uid}-head)`}>
            {boltType === 'socket_cap' && Array.from({ length: Math.max(4, Math.floor(k / 1.2)) }).map((_, ki) => {
              const kx = 0.5 + ki * 1.2;
              if (kx >= k - 0.4) return null;
              return <line key={ki} x1={kx} y1={-dk / 2} x2={kx} y2={dk / 2} stroke="rgba(255,255,255,0.18)" strokeWidth={fs * 0.035} />;
            })}
            <line x1={0} y1={-socketS / 2} x2={socketT} y2={-socketS / 2} stroke="var(--cyan)" strokeWidth={fs * 0.05} strokeDasharray={`${fs * 0.3} ${fs * 0.2}`} />
            <line x1={0} y1={socketS / 2} x2={socketT} y2={socketS / 2} stroke="var(--cyan)" strokeWidth={fs * 0.05} strokeDasharray={`${fs * 0.3} ${fs * 0.2}`} />
            <line x1={socketT} y1={-socketS / 2} x2={socketT} y2={socketS / 2} stroke="var(--cyan)" strokeWidth={fs * 0.05} strokeDasharray={`${fs * 0.3} ${fs * 0.2}`} />
          </g>
        ) : boltType === 'countersunk' || boltType === 'button_head' ? (
          <g clipPath={`url(#${uid}-head)`}>
            <line x1={0} y1={-socketS / 2} x2={socketT} y2={-socketS / 2} stroke="var(--cyan)" strokeWidth={fs * 0.05} strokeDasharray={`${fs * 0.3} ${fs * 0.2}`} />
            <line x1={0} y1={socketS / 2} x2={socketT} y2={socketS / 2} stroke="var(--cyan)" strokeWidth={fs * 0.05} strokeDasharray={`${fs * 0.3} ${fs * 0.2}`} />
            <line x1={socketT} y1={-socketS / 2} x2={socketT} y2={socketS / 2} stroke="var(--cyan)" strokeWidth={fs * 0.05} strokeDasharray={`${fs * 0.3} ${fs * 0.2}`} />
          </g>
        ) : boltType === 'flange_hex' ? (
          <g clipPath={`url(#${uid}-head)`}>
            <HexBarrel x0={0} x1={Math.max(0.5, k - c_fl)} e={e} turns={effectiveTurns} strokeW={fs * 0.045} />
            <line x1={k - c_fl} y1={-dc / 2} x2={k - c_fl} y2={dc / 2} stroke="var(--line-strong)" strokeWidth={fs * 0.05} />
          </g>
        ) : boltType === 'carriage_bolt' ? (
          <g clipPath={`url(#${uid}-head)`}>
            <line x1={k - neckF} y1={-dk / 2} x2={k - neckF} y2={dk / 2} stroke="var(--line-strong)" strokeWidth={fs * 0.05} />
            <rect x={k - neckF} y={-neckV / 2} width={neckF} height={neckV} fill="none" stroke="var(--cyan)" strokeWidth={fs * 0.05} strokeDasharray="2 2" />
          </g>
        ) : boltType === 'eye_bolt' ? (
          <g clipPath={`url(#${uid}-head)`}>
            <circle cx={k * 0.35} cy={0} r={d4Eye / 2} fill="var(--bg-1)" stroke="var(--cyan)" strokeWidth={fs * 0.06} />
            <line x1={k - Math.max(1, k * 0.28)} y1={-d2Eye / 2} x2={k - Math.max(1, k * 0.28)} y2={d2Eye / 2} stroke="var(--line-strong)" strokeWidth={fs * 0.05} />
          </g>
        ) : boltType === 'set_screw' ? (
          <g>
            <line x1={0} y1={-socketS / 2} x2={socketT} y2={-socketS / 2} stroke="var(--cyan)" strokeWidth={fs * 0.05} strokeDasharray={`${fs * 0.3} ${fs * 0.2}`} />
            <line x1={0} y1={socketS / 2} x2={socketT} y2={socketS / 2} stroke="var(--cyan)" strokeWidth={fs * 0.05} strokeDasharray={`${fs * 0.3} ${fs * 0.2}`} />
            <line x1={socketT} y1={-socketS / 2} x2={socketT} y2={socketS / 2} stroke="var(--cyan)" strokeWidth={fs * 0.05} strokeDasharray={`${fs * 0.3} ${fs * 0.2}`} />
          </g>
        ) : boltType === 'stud_bolt' ? (
          <g>
            <line x1={bm} y1={-d / 2} x2={bm} y2={d / 2} stroke="var(--cyan)" strokeWidth={fs * 0.05} strokeDasharray="3 2" />
          </g>
        ) : (
          /* hex_bolt & heavy_hex */
          <g clipPath={`url(#${uid}-head)`}>
            <HexBarrel x0={0} x1={k} e={e} turns={effectiveTurns} strokeW={fs * 0.045} />
          </g>
        )}

        {/* Cylindrical metallic reflection line on unthreaded shank */}
        {ls > 0.8 && boltType !== 'set_screw' && (
          <g clipPath={`url(#${uid}-body)`}>
            <line
              x1={(boltType === 'stud_bolt' ? bm : k) + fillet}
              x2={xThr}
              y1={f4(-d * 0.38)}
              y2={f4(-d * 0.38)}
              stroke="rgba(255,255,255,0.32)"
              strokeWidth={fs * 0.07}
            />
          </g>
        )}

        {/* 3D Helical Teeth perfectly aligned with 60° triangular outline */}
        {nTooth > 0 && (
          <g clipPath={`url(#${uid}-body)`}>
            {boltType === 'stud_bolt' && (
              <SolidThread x0={0} x1={bm} Ro={d / 2} Ri={d3 / 2} P={P} turns={effectiveTurns} sw={fs * 0.045} male uid={uid} />
            )}
            <SolidThread x0={xStartThr} x1={xEnd} Ro={d / 2} Ri={d3 / 2} P={P} turns={effectiveTurns} sw={fs * 0.045} male uid={uid} />
          </g>
        )}

        {/* Bolt outer outline */}
        <path d={outline} fill="none" stroke="var(--ink)" strokeWidth={fs * 0.07} strokeLinejoin="round" />
        {k > 0 && boltType !== 'countersunk' && (
          <line x1={k} y1={-dw / 2} x2={k} y2={dw / 2} stroke="var(--line-strong)" strokeWidth={fs * 0.05} />
        )}

        {/* ── ASSEMBLED ISO 4032 HEX NUT (SOMUN MONTAJLI) ── */}
        {showNut && boltType !== 'set_screw' && (
          <g id={`${uid}-nut-assembly`}>
            {!nutSectionMode ? (
              /* SOLID 3D METALLIC NUT (Default view) */
              <g>
                {/* Opaque core mask hiding bolt threads under nut */}
                <rect
                  x={nutX}
                  y={-sNut / 2}
                  width={nutM}
                  height={sNut}
                  fill="#0b1320"
                />
                {/* Rotating 3D Hex Barrel with lighting */}
                <HexBarrel x0={nutX} x1={nutX + nutM} e={nutE} turns={effectiveTurns} strokeW={fs * 0.05} />
                {/* 30° Corner chamfer arcs on nut faces */}
                <path
                  d={`
                    M ${f4(nutX)} ${f4(-(sNut / 2 - nutCham))}
                    Q ${f4(nutX + nutCham * 0.8)} ${f4(-sNut / 2)} ${f4(nutX + nutCham * 1.5)} ${f4(-sNut / 2)}
                    L ${f4(nutX + nutM - nutCham * 1.5)} ${f4(-sNut / 2)}
                    Q ${f4(nutX + nutM - nutCham * 0.8)} ${f4(-sNut / 2)} ${f4(nutX + nutM)} ${f4(-(sNut / 2 - nutCham))}
                    M ${f4(nutX)} ${f4(sNut / 2 - nutCham)}
                    Q ${f4(nutX + nutCham * 0.8)} ${f4(sNut / 2)} ${f4(nutX + nutCham * 1.5)} ${f4(sNut / 2)}
                    L ${f4(nutX + nutM - nutCham * 1.5)} ${f4(sNut / 2)}
                    Q ${f4(nutX + nutM - nutCham * 0.8)} ${f4(sNut / 2)} ${f4(nutX + nutM)} ${f4(sNut / 2 - nutCham)}
                  `}
                  fill="none"
                  stroke="var(--ink)"
                  strokeWidth={fs * 0.06}
                />
                {/* Nut Outer Outline */}
                <rect
                  x={nutX}
                  y={-sNut / 2}
                  width={nutM}
                  height={sNut}
                  fill="none"
                  stroke="var(--cyan)"
                  strokeWidth={fs * 0.055}
                  rx={f4(Math.min(0.6, nutM * 0.08))}
                />
              </g>
            ) : (
              /* SECTION VIEW: Top half sectioned at 45°, bottom half 3D */
              <g>
                {/* Top Half Section Wall */}
                <path
                  d={[
                    `M ${f4(nutX)} ${f4(-d / 2)}`,
                    `L ${f4(nutX)} ${f4(-(sNut / 2 - nutCham))}`,
                    `L ${f4(nutX + nutCham)} ${f4(-sNut / 2)}`,
                    `L ${f4(nutX + nutM - nutCham)} ${f4(-sNut / 2)}`,
                    `L ${f4(nutX + nutM)} ${f4(-(sNut / 2 - nutCham))}`,
                    `L ${f4(nutX + nutM)} ${f4(-d / 2)}`,
                    'Z',
                  ].join(' ')}
                  fill={`url(#${uid}-hatch)`}
                  stroke="var(--cyan)"
                  strokeWidth={fs * 0.05}
                />
                {/* Internal Teeth Meshing with Male Threads */}
                {Array.from({ length: Math.ceil(nutM / P) + 1 }).map((_, ni) => {
                  const nx = nutX + ni * P;
                  if (nx > nutX + nutM - P * 0.3) return null;
                  return (
                    <polygon
                      key={`dişi-${ni}`}
                      points={`${f4(nx)},${f4(-d / 2)} ${f4(nx + P * 0.25)},${f4(-pr.D1 / 2)} ${f4(nx + P * 0.5)},${f4(-pr.D1 / 2)} ${f4(nx + P * 0.75)},${f4(-d / 2)}`}
                      fill={`url(#${uid}-gold-tooth)`}
                      stroke="var(--warn)"
                      strokeWidth={fs * 0.035}
                    />
                  );
                })}
                {/* Bottom Half: Solid 3D Hex */}
                <clipPath id={`${uid}-nut-bot`}>
                  <rect x={nutX} y={0} width={nutM} height={sNut / 2 + 2} />
                </clipPath>
                <g clipPath={`url(#${uid}-nut-bot)`}>
                  <rect x={nutX} y={0} width={nutM} height={sNut / 2 + 2} fill="var(--bg-1)" />
                  <HexBarrel x0={nutX} x1={nutX + nutM} e={nutE} turns={effectiveTurns} strokeW={fs * 0.045} />
                </g>
                <line x1={nutX} y1={0} x2={nutX + nutM} y2={0} stroke="var(--cyan)" strokeWidth={fs * 0.04} strokeDasharray="3 2" />
              </g>
            )}

            {/* Live Tightening Status Badge above Nut */}
            {(() => {
              const bFs = fs * 0.78;
              const badgeW = Math.max(fs * 4.2, nutStatusText.length * bFs * 0.62 + bFs * 1.6);
              const badgeH = bFs * 1.45;
              const badgeY = -sNut / 2 - bFs * 1.5;
              const strokeW = Math.max(0.12, fs * 0.055);
              return (
                <g transform={`translate(${f4(nutX + nutM / 2)}, ${f4(badgeY)})`}>
                  <rect
                    x={-badgeW / 2}
                    y={-badgeH / 2}
                    width={badgeW}
                    height={badgeH}
                    rx={bFs * 0.22}
                    fill="var(--bg-1)"
                    stroke={nutStatusColor}
                    strokeWidth={strokeW}
                  />
                  <text
                    x="0"
                    y="0"
                    dominantBaseline="central"
                    textAnchor="middle"
                    fill={nutStatusColor}
                    fontSize={bFs}
                    fontWeight="800"
                    fontFamily="ui-monospace, monospace"
                  >
                    {nutStatusText}
                  </text>
                </g>
              );
            })()}

            {/* Nut width dimension m (at bottom level 3) */}
            <DimH uid={uid} fs={fs * 0.9} x1={nutX} x2={nutX + nutM} y={topR + levelH * 3.15} label={`m=${formatEngineeringValue(nutM, precision, false)}`} color="var(--cyan)" />
          </g>
        )}

        {/* Head marking */}
        {k > 0 && boltType !== 'countersunk' && (
          <text x={k / 2} y={0} dominantBaseline="central" textAnchor="middle" fill="var(--ink)" fontSize={fs * 0.92} fontWeight="900" fontFamily="ui-monospace, monospace">{shop.grade}</text>
        )}

        {/* ── CLEAN, ZERO-COLLISION DIMENSIONS WITH RIGID TIER HIERARCHY ── */}
        {/* Bottom Level 1: Head height k (or tap end length bm for stud) */}
        {k > 0 && boltType !== 'countersunk' ? (
          <DimH uid={uid} fs={fs} x1={0} x2={k} y={topR + levelH * 0.95} label={`k=${k.toFixed(2)}`} />
        ) : boltType === 'stud_bolt' ? (
          <DimH uid={uid} fs={fs} x1={0} x2={bm} y={topR + levelH * 0.95} label={`bm=${bm.toFixed(1)}`} />
        ) : null}

        {/* Bottom Level 2: Thread length b */}
        <DimH uid={uid} fs={fs} x1={xThr} x2={xEnd} y={topR + levelH * 2.05} label={`b=${b.toFixed(2)}`} />

        {/* Top Level 1: Shank length ls (if present) */}
        {ls > 0.8 && (
          <DimH uid={uid} fs={fs} x1={boltType === 'stud_bolt' ? bm : k} x2={xThr} y={-dimTopBase - levelH * 0.85} label={`ls=${ls.toFixed(2)}`} />
        )}

        {/* Top Level 2: Total length L */}
        <DimH
          uid={uid}
          fs={fs}
          x1={boltType === 'countersunk' ? 0 : boltType === 'stud_bolt' ? bm : k}
          x2={xEnd}
          y={-dimTopBase - levelH * (ls > 0.8 ? 1.85 : 0.85)}
          label={`L=${L.toFixed(2)}`}
        />

        {/* Top Level 3: Overall length Lges for stud bolt, or Head notes strictly above head at Level 3 */}
        {boltType === 'stud_bolt' ? (
          <DimH
            uid={uid}
            fs={fs}
            x1={0}
            x2={xEnd}
            y={-dimTopBase - levelH * (ls > 0.8 ? 2.85 : 1.85)}
            label={`Lges=${(bm + L).toFixed(2)}`}
          />
        ) : (
          k > 0 && (() => {
            const hW = Math.max(wHead, headLabel.length * fs * 0.62 + fs * 1.6);
            const hH = fs * 1.45;
            const headX = k * 0.5;
            const headY = -dimTopBase - levelH * (ls > 0.8 ? 2.85 : 1.85);
            return (
              <g transform={`translate(${f4(headX)}, ${f4(headY)})`}>
                <rect
                  x={-hW / 2}
                  y={-hH / 2}
                  width={hW}
                  height={hH}
                  rx={fs * 0.25}
                  fill="var(--bg-1)"
                  stroke="var(--cyan)"
                  strokeWidth={Math.max(0.18, fs * 0.07)}
                />
                <text
                  x="0"
                  y="0"
                  dominantBaseline="central"
                  textAnchor="middle"
                  fill="var(--ink)"
                  fontSize={fs * 0.9}
                  fontWeight="900"
                  fontFamily="ui-monospace, monospace"
                >
                  {headLabel}
                </text>
              </g>
            );
          })()
        )}

        {/* Major diameter Ød: On unthreaded shank when ls > 8, or at tip */}
        {ls > 8 ? (
          <DimV uid={uid} fs={fs} x={(boltType === 'stud_bolt' ? bm : k) + ls * 0.5} y1={-d / 2} y2={d / 2} label={`Ød=${d.toFixed(2)}`} />
        ) : (
          <DimV uid={uid} fs={fs} x={xEnd + Math.max(8, fs * 2.8)} y1={-d / 2} y2={d / 2} label={`Ød=${d.toFixed(2)}`} />
        )}

        {/* Pitch Diameter Ød2 with clean leader */}
        {(() => {
          const d2Label = `Ød₂=${formatEngineeringValue(d2, precision, false)}`;
          const d2W = d2Label.length * fs * 0.65 + fs * 1.4;
          const d2H = fs * 1.45;
          const boxX = sampleX + fs * 1.2;
          const boxY = -d / 2 - fs * 1.8;
          return (
            <g>
              <line x1={xThr} y1={-d2 / 2} x2={xChamfer} y2={-d2 / 2} stroke="var(--cyan)" strokeWidth={Math.max(0.2, fs * 0.06)} strokeDasharray={`${fs * 0.4} ${fs * 0.25}`} />
              <line x1={sampleX} y1={-d2 / 2} x2={boxX} y2={boxY} stroke="var(--cyan)" strokeWidth={Math.max(0.2, fs * 0.07)} markerStart={`url(#${uid}-b)`} />
              <rect x={boxX} y={boxY - d2H / 2} width={d2W} height={d2H} rx={fs * 0.25} fill="var(--bg-1)" stroke="var(--cyan)" strokeWidth={Math.max(0.18, fs * 0.07)} />
              <text x={boxX + d2W / 2} y={boxY} dominantBaseline="central" textAnchor="middle" fill="var(--ink)" fontSize={fs * 0.9} fontWeight="900" fontFamily="ui-monospace, monospace">
                {d2Label}
              </text>
            </g>
          );
        })()}

        {/* Minor Diameter Ød3 with clean leader */}
        {(() => {
          const d3Label = `Ød₃=${formatEngineeringValue(d3, precision, false)}`;
          const d3W = d3Label.length * fs * 0.65 + fs * 1.4;
          const d3H = fs * 1.45;
          // Clamp boxX so it remains between xThr and xChamfer, never overflowing into tip chamfer
          // Also ensure it does not collide with 2P runout callout at xThr .. xThr+vanish
          const minSafeX = Math.max(
            xThr + (vanish > 0.05 && ls > 1.5 ? vanish + fs * 2.0 : fs * 1.0),
            showNut ? nutX + nutM + fs * 0.5 : 0
          );
          const maxBoxX = Math.max(minSafeX, xChamfer - d3W - fs * 0.5);
          const boxX = Math.min(maxBoxX, Math.max(minSafeX, sampleX - d3W * 0.35));
          const boxY = d / 2 + fs * 1.8;
          const leaderTargetX = boxX + d3W * 0.35;
          return (
            <g>
              <line x1={xThr} y1={d3 / 2} x2={xChamfer} y2={d3 / 2} stroke="var(--cyan)" strokeWidth={Math.max(0.2, fs * 0.06)} strokeDasharray={`${fs * 0.4} ${fs * 0.25}`} />
              <line x1={sampleX} y1={d3 / 2} x2={leaderTargetX} y2={boxY - d3H / 2} stroke="var(--cyan)" strokeWidth={Math.max(0.2, fs * 0.07)} markerStart={`url(#${uid}-b)`} />
              <rect x={boxX} y={boxY - d3H / 2} width={d3W} height={d3H} rx={fs * 0.25} fill="var(--bg-1)" stroke="var(--cyan)" strokeWidth={Math.max(0.18, fs * 0.07)} />
              <text x={boxX + d3W / 2} y={boxY} dominantBaseline="central" textAnchor="middle" fill="var(--ink)" fontSize={fs * 0.9} fontWeight="900" fontFamily="ui-monospace, monospace">
                {d3Label}
              </text>
            </g>
          );
        })()}

        {/* DIN 76-1 Thread Runout 2P at Shank Transition */}
        {ls > 1.5 && vanish > 0.05 && (
          <g>
            <DimH uid={uid} fs={fs * 0.88} x1={xThr} x2={xThr + vanish} y={d / 2 + levelH * 0.55} label={`2P=${vanish.toFixed(2)}`} color="var(--warn)" />
          </g>
        )}

        {/* End Chamfer 45° x c at Tip (or Cup Point for set screw) */}
        {boltType !== 'set_screw' ? (
          (() => {
            const chamLabel = `45°×${formatEngineeringValue(c, precision, false)}`;
            const cW = chamLabel.length * fs * 0.65 + fs * 1.4;
            const cH = fs * 1.45;
            // Position cleanly past xEnd with comfortable clearance from Ød dimension
            const cX = xEnd + Math.max(8, fs * 2.8) + (ls > 8 ? fs * 1.0 : fs * 3.8);
            const cY = d / 2 + fs * 1.2;
            return (
              <g>
                <line x1={xChamfer + (xEnd - xChamfer) * 0.5} y1={d / 2 - c * 0.5} x2={cX} y2={cY} stroke="var(--ok)" strokeWidth={Math.max(0.18, fs * 0.06)} markerStart={`url(#${uid}-b)`} />
                <rect x={cX} y={cY - cH / 2} width={cW} height={cH} rx={fs * 0.25} fill="var(--bg-1)" stroke="var(--ok)" strokeWidth={Math.max(0.18, fs * 0.07)} />
                <text x={cX + cW / 2} y={cY} dominantBaseline="central" textAnchor="middle" fill="var(--ok)" fontSize={fs * 0.88} fontWeight="900" fontFamily="ui-monospace, monospace">
                  {chamLabel}
                </text>
              </g>
            );
          })()
        ) : (
          (() => {
            const cupLabel = `Cup Ø${formatEngineeringValue(dp, precision, false)}`;
            const cW = cupLabel.length * fs * 0.65 + fs * 1.4;
            const cH = fs * 1.45;
            const cX = xEnd + fs * 1.0;
            const cY = d / 2 + fs * 1.2;
            return (
              <g>
                <rect x={cX} y={cY - cH / 2} width={cW} height={cH} rx={fs * 0.25} fill="var(--bg-1)" stroke="var(--warn)" strokeWidth={Math.max(0.18, fs * 0.07)} />
                <text x={cX + cW / 2} y={cY} dominantBaseline="central" textAnchor="middle" fill="var(--warn)" fontSize={fs * 0.88} fontWeight="900" fontFamily="ui-monospace, monospace">
                  {cupLabel}
                </text>
              </g>
            );
          })()
        )}

        {/* End View: Head / Drive Geometry (In viewMode 'fit') */}
        {viewMode === 'fit' && (
          <g id={`${uid}-end-view`}>
            {boltType === 'socket_cap' || boltType === 'low_head_socket' ? (
              <g>
                <circle cx={hexCx} cy={0} r={dk / 2} fill={`url(#${uid}-cyl)`} stroke="var(--ink)" strokeWidth={fs * 0.06} />
                <g transform={`rotate(${f4(effectiveTurns * 360)} ${f4(hexCx)} 0)`}>
                  <polygon points={hexPoints(hexCx, 0, socketS / 1.732)} fill="var(--bg-1)" stroke="var(--cyan)" strokeWidth={fs * 0.065} />
                  <circle cx={hexCx} cy={0} r={socketS / 2} fill="none" stroke="var(--cyan)" strokeWidth={fs * 0.04} strokeDasharray={`${fs * 0.2} ${fs * 0.15}`} opacity="0.6" />
                </g>
                <circle cx={hexCx} cy={0} r={d / 2} fill="none" stroke="var(--warn)" strokeWidth={fs * 0.05} strokeDasharray="3 2" />
              </g>
            ) : boltType === 'countersunk' ? (
              <g>
                <circle cx={hexCx} cy={0} r={dk / 2} fill={`url(#${uid}-cyl)`} stroke="var(--ink)" strokeWidth={fs * 0.06} />
                <circle cx={hexCx} cy={0} r={d / 2} fill="none" stroke="var(--line-strong)" strokeWidth={fs * 0.05} strokeDasharray="2 2" />
                <g transform={`rotate(${f4(effectiveTurns * 360)} ${f4(hexCx)} 0)`}>
                  <polygon points={hexPoints(hexCx, 0, socketS / 1.732)} fill="var(--bg-1)" stroke="var(--cyan)" strokeWidth={fs * 0.065} />
                </g>
              </g>
            ) : boltType === 'button_head' ? (
              <g>
                <circle cx={hexCx} cy={0} r={dk / 2} fill={`url(#${uid}-cyl)`} stroke="var(--ink)" strokeWidth={fs * 0.06} />
                <circle cx={hexCx} cy={0} r={dk * 0.38} fill="none" stroke="var(--line-strong)" strokeWidth={fs * 0.04} opacity="0.5" />
                <g transform={`rotate(${f4(effectiveTurns * 360)} ${f4(hexCx)} 0)`}>
                  <polygon points={hexPoints(hexCx, 0, socketS / 1.732)} fill="var(--bg-1)" stroke="var(--cyan)" strokeWidth={fs * 0.065} />
                </g>
              </g>
            ) : boltType === 'flange_hex' ? (
              <g>
                <circle cx={hexCx} cy={0} r={dc / 2} fill={`url(#${uid}-steel)`} stroke="var(--ink)" strokeWidth={fs * 0.06} />
                <HexFacets cx={hexCx} cy={0} vertexR={hexR} turns={effectiveTurns} strokeW={fs * 0.06} />
                <circle cx={hexCx} cy={0} r={s / 2} fill="none" stroke="var(--cyan)" strokeWidth={fs * 0.05} strokeDasharray="3 2" />
              </g>
            ) : boltType === 'carriage_bolt' ? (
              <g>
                <circle cx={hexCx} cy={0} r={dk / 2} fill={`url(#${uid}-cyl)`} stroke="var(--ink)" strokeWidth={fs * 0.06} />
                <rect x={hexCx - neckV / 2} y={-neckV / 2} width={neckV} height={neckV} fill="none" stroke="var(--cyan)" strokeWidth={fs * 0.06} />
                <circle cx={hexCx} cy={0} r={d / 2} fill="none" stroke="var(--warn)" strokeWidth={fs * 0.05} strokeDasharray="3 2" />
              </g>
            ) : boltType === 'eye_bolt' ? (
              <g>
                <circle cx={hexCx} cy={0} r={d3Eye / 2} fill={`url(#${uid}-steel)`} stroke="var(--ink)" strokeWidth={fs * 0.06} />
                <circle cx={hexCx} cy={0} r={d4Eye / 2} fill="var(--bg-1)" stroke="var(--cyan)" strokeWidth={fs * 0.06} />
                <circle cx={hexCx} cy={0} r={d2Eye / 2} fill="none" stroke="var(--line-strong)" strokeWidth={fs * 0.045} strokeDasharray="3 2" />
              </g>
            ) : boltType === 'set_screw' ? (
              <g>
                <circle cx={hexCx} cy={0} r={d / 2} fill={`url(#${uid}-cyl)`} stroke="var(--ink)" strokeWidth={fs * 0.06} />
                <g transform={`rotate(${f4(effectiveTurns * 360)} ${f4(hexCx)} 0)`}>
                  <polygon points={hexPoints(hexCx, 0, socketS / 1.732)} fill="var(--bg-1)" stroke="var(--cyan)" strokeWidth={fs * 0.065} />
                </g>
              </g>
            ) : boltType === 'stud_bolt' ? (
              <g>
                <circle cx={hexCx} cy={0} r={d / 2} fill={`url(#${uid}-cyl)`} stroke="var(--ink)" strokeWidth={fs * 0.06} />
                <circle cx={hexCx} cy={0} r={d2 / 2} fill="none" stroke="var(--cyan)" strokeWidth={fs * 0.05} strokeDasharray="3 2" />
                <circle cx={hexCx} cy={0} r={d3 / 2} fill="none" stroke="var(--cyan)" strokeWidth={fs * 0.04} strokeDasharray="2 2" />
              </g>
            ) : (
              /* hex_bolt & heavy_hex */
              <g>
                <HexFacets cx={hexCx} cy={0} vertexR={hexR} turns={effectiveTurns} strokeW={fs * 0.06} />
                <circle cx={hexCx} cy={0} r={s / 2} fill="none" stroke="var(--cyan)" strokeWidth={fs * 0.06} strokeDasharray={`${fs * 0.35} ${fs * 0.2}`} />
                <circle cx={hexCx} cy={0} r={d / 2} fill="none" stroke="var(--warn)" strokeWidth={fs * 0.05} />
              </g>
            )}

            {/* End View Label (Bolt Head / Drive Dimensions) */}
            {(() => {
              const endLabel1 = boltType === 'socket_cap' || boltType === 'low_head_socket'
                ? `dk=${formatEngineeringValue(dk, precision, false)}  s=${formatEngineeringValue(socketS, precision, false)}`
                : boltType === 'countersunk'
                ? `dk=${formatEngineeringValue(dk, precision, false)}  s=${formatEngineeringValue(socketS, precision, false)}`
                : boltType === 'flange_hex'
                ? `dc=${formatEngineeringValue(dc, precision, false)}  s=${formatEngineeringValue(s, precision, false)}`
                : boltType === 'eye_bolt'
                ? `d₃=${formatEngineeringValue(d3Eye, precision, false)}  d₄=${formatEngineeringValue(d4Eye, precision, false)}`
                : boltType === 'carriage_bolt'
                ? `dk=${formatEngineeringValue(dk, precision, false)}  v=${formatEngineeringValue(neckV, precision, false)}`
                : boltType === 'set_screw'
                ? `s=${formatEngineeringValue(socketS, precision, false)}  dp=${formatEngineeringValue(dp, precision, false)}`
                : boltType === 'stud_bolt'
                ? `Ød=${formatEngineeringValue(d, precision, false)}  P=${formatEngineeringValue(P, precision, false)}`
                : `s=${formatEngineeringValue(s, precision, false)}  e=${formatEngineeringValue(e, precision, false)}`;
              const eW1 = endLabel1.length * fs * 0.65 + fs * 1.4;
              const eH1 = fs * 1.45;
              const eY1 = Math.max(hexR, dk / 2, dc / 2, d3Eye / 2) + fs * 1.8;
              return (
                <g>
                  <rect x={hexCx - eW1 / 2} y={eY1 - eH1 / 2} width={eW1} height={eH1} rx={fs * 0.25} fill="var(--bg-1)" stroke="var(--cyan)" strokeWidth={Math.max(0.18, fs * 0.07)} />
                  <text x={hexCx} y={eY1} dominantBaseline="central" textAnchor="middle" fill="var(--ink)" fontSize={fs * 0.9} fontWeight="900" fontFamily="ui-monospace, monospace">
                    {endLabel1}
                  </text>
                </g>
              );
            })()}
          </g>
        )}

        {/* Title bar badge */}
        {(() => {
          const titleText = `${shop.threadCallout} · P=${formatEngineeringValue(P, precision, false)} · ${spec.threadProfile} · ${spec.boltCurrent} · 1:1 mm`;
          const tW = titleText.length * fs * 0.62 + fs * 1.6;
          const tH = fs * 1.55;
          const tX = vbX + fs * 1.0;
          const tY = vbY + fs * 1.5;
          return (
            <g>
              <rect x={tX} y={tY - tH / 2} width={tW} height={tH} rx={fs * 0.25} fill="var(--bg-1)" stroke="var(--cyan)" strokeWidth={Math.max(0.18, fs * 0.07)} />
              <text x={tX + fs * 0.8} y={tY} dominantBaseline="central" fill="var(--ink)" fontSize={fs * 0.95} fontWeight="900" fontFamily="ui-monospace, monospace">
                {titleText}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

export function BoltFemaleSvg1to1({
  shop, lang = 'en', turns = 0, motion,
}: {
  shop: ShopLike; lang?: string; turns?: number; motion?: ScrewHandlers;
}) {
  const precision = useGlobalPrecision();
  const uid = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const live = !!motion;
  const pr = iso68Profile(shop.d, shop.p);
  const P = pr.P;
  const D = pr.D;
  const D2 = pr.D2;
  const D1 = pr.D1;
  const tap = shop.tap;
  const m = shop.m;
  const s = shop.s;
  const e = shop.e;
  const n = Math.max(0, Math.floor(m / P + 1e-9));
  const Lth = n * P;
  const cham = Math.min(P * 0.6, m * 0.18, (s - D) / 4);

  const hexR = e / 2;
  const maxR = Math.max(s / 2, hexR) + 1;
  const padL = Math.max(20, s * 0.55);
  const padR = e + Math.max(32, s * 1.2);
  const padY = Math.max(24, s * 0.85);
  const initVbW = m + padR + padL;
  const vbH = 2 * (maxR + padY);

  const targetRatio = 1.95;
  const minW = vbH * targetRatio;
  let vbW = initVbW;
  let vbX = -padL;
  if (initVbW < minW) {
    const extra = minW - initVbW;
    vbW = minW;
    vbX = -padL - extra / 2;
  }
  const vbY = -maxR - padY;
  const fs = Math.max(2.2, Math.min(10.0, vbH * 0.042));
  const hexCx = m + Math.max(24, fs * 3.8) + hexR;
  const sNut = hexHalfHeight(e, turns * 360) * 2;

  const outer = [
    `M 0 ${n4(-(sNut / 2 - cham))}`,
    `L ${n4(cham)} ${n4(-sNut / 2)}`,
    `L ${n4(m - cham)} ${n4(-sNut / 2)}`,
    `L ${n4(m)} ${n4(-(sNut / 2 - cham))}`,
    `L ${n4(m)} ${n4(sNut / 2 - cham)}`,
    `L ${n4(m - cham)} ${n4(sNut / 2)}`,
    `L ${n4(cham)} ${n4(sNut / 2)}`,
    `L 0 ${n4(sNut / 2 - cham)}`,
    'Z',
  ].join(' ');

  const hole = [
    `M 0 ${n4(-D / 2)}`,
    `L ${n4(cham)} ${n4(-D1 / 2)}`,
    `L ${n4(m - cham)} ${n4(-D1 / 2)}`,
    `L ${n4(m)} ${n4(-D / 2)}`,
    `L ${n4(m)} ${n4(D / 2)}`,
    `L ${n4(m - cham)} ${n4(D1 / 2)}`,
    `L ${n4(cham)} ${n4(D1 / 2)}`,
    `L 0 ${n4(D / 2)}`,
    'Z',
  ].join(' ');

  const spec = shop.spec || getFastenerStandardSpecs(
    shop.standard || (/UNC/i.test(shop.threadCallout) ? 'UNC' : /UNF/i.test(shop.threadCallout) ? 'UNF' : /NPT/i.test(shop.threadCallout) ? 'NPT' : /BSPP/i.test(shop.threadCallout) ? 'BSPP (G)' : /BSPT/i.test(shop.threadCallout) ? 'BSPT (R)' : /Tr/i.test(shop.threadCallout) ? 'Trapezoidal' : 'Metric Coarse'),
    shop.metricKey,
    Boolean(shop.b && shop.L && shop.b >= shop.L),
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--bg-1)] p-2">
      <Banner
        lang={lang}
        left={live
          ? t12(lang, 'Left click: tighten · Right click: loosen · Hold: continuous', 'Sol tık: sık · Sağ tık: gevşet · Basılı tut: sürekli')
          : t12(lang, `Female ${spec.toleranceClass} · nut ${spec.nutStandard} · 1 unit = 1 mm`, `Dişi ${spec.toleranceClass} · somun ${spec.nutStandard} · 1 birim = 1 mm`)}
        mid={`${shop.tapCallout} · ØD₁ ${formatEngineeringValue(D1, precision, false)} · ØD₂ ${formatEngineeringValue(D2, precision, false)} · ØD ${formatEngineeringValue(D, precision, false)}`}
        onDownload={() => downloadSvg(svgRef.current, `${fileStem(shop.tapCallout)}-disi-1to1.svg`, vbW, vbH)}
      />
      <svg
        ref={svgRef}
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        className={`h-auto w-full ${live ? 'cursor-grab active:cursor-grabbing select-none' : ''}`}
        style={{ minHeight: '380px', maxHeight: '680px', ...(live ? { touchAction: 'none' } : {}) }}
        role="img"
        data-unit="mm"
        data-scale="1:1"
        data-major={n4(D)}
        data-d1={n4(D1)}
        data-d2={n4(D2)}
        data-p={n4(P)}
        data-m={n4(m)}
        data-tap={n4(tap)}
        data-s={n4(s)}
        {...(motion ?? {})}
      >
        {defs(uid)}
        <clipPath id={`${uid}-nut`}>
          <path d={outer} />
        </clipPath>
        <clipPath id={`${uid}-bore`}>
          <path d={hole} />
        </clipPath>
        <rect x={vbX} y={vbY} width={vbW} height={vbH} fill="var(--bg-2)" stroke="var(--line)" />
        <line x1={-3} y1={0} x2={m + 4} y2={0} stroke="var(--cyan)" strokeWidth={fs * 0.06} strokeDasharray={`${fs} ${fs * 0.35} ${fs * 0.18} ${fs * 0.35}`} />

        <g clipPath={`url(#${uid}-nut)`}>
          <HexBarrel x0={0} x1={m} e={e} turns={turns} strokeW={fs * 0.045} />
        </g>
        <path d={hole} fill={`url(#${uid}-bore)`} stroke="none" />
        {n > 0 && (
          <g clipPath={`url(#${uid}-bore)`}>
            <SolidThread x0={cham} x1={m - cham} Ro={D1 / 2} Ri={D1 / 2} P={P} turns={turns} sw={fs * 0.04} male={false} />
          </g>
        )}
        <path d={outer} fill="none" stroke="var(--cyan)" strokeWidth={fs * 0.08} strokeLinejoin="round" />
        <path d={hole} fill="none" stroke="var(--cyan)" strokeWidth={fs * 0.05} strokeLinejoin="round" />

        <line x1={0} y1={-tap / 2} x2={m} y2={-tap / 2} stroke="var(--warn)" strokeWidth={fs * 0.06} strokeDasharray={`${fs * 0.4} ${fs * 0.22}`} />
        <line x1={0} y1={tap / 2} x2={m} y2={tap / 2} stroke="var(--warn)" strokeWidth={fs * 0.06} strokeDasharray={`${fs * 0.4} ${fs * 0.22}`} />

        <line x1={0} y1={-D / 2} x2={cham} y2={-D1 / 2} stroke="var(--ok)" strokeWidth={fs * 0.07} />
        <line x1={0} y1={D / 2} x2={cham} y2={D1 / 2} stroke="var(--ok)" strokeWidth={fs * 0.07} />
        
        {/* Chamfer badge */}
        <g transform={`translate(${fs * 0.2}, ${-maxR + fs * 0.8})`}>
          <rect x="0" y={-fs * 0.65} width={fs * 2.2} height={fs * 1.3} rx={fs * 0.2} fill="var(--bg-1)" stroke="var(--ok)" strokeWidth={Math.max(0.12, fs * 0.06)} />
          <text x={fs * 1.1} y={0} dominantBaseline="central" textAnchor="middle" fill="var(--ok)" fontSize={fs * 0.85} fontWeight="800" fontFamily="ui-monospace, monospace">45°</text>
        </g>

        <DimV uid={uid} fs={fs} x={m + fs * 2.2} y1={-D1 / 2} y2={D1 / 2} label={`ØD₁=${D1.toFixed(3)}`} />
        <DimV uid={uid} fs={fs} x={m + fs * 4.6} y1={-D / 2} y2={D / 2} label={`ØD=${D.toFixed(3)}`} />
        <DimH uid={uid} fs={fs} x1={0} x2={m} y={maxR + fs * 2.4} label={`m=${m.toFixed(2)}  (${n}×P=${Lth.toFixed(2)})`} />

        {/* Readout badges */}
        {(() => {
          const d2Str = `ØD₂=${formatEngineeringValue(D2, precision, false)}`;
          const tapStr = `Øtap=${formatEngineeringValue(tap, precision, false)}`;
          const sStr = `s=${formatEngineeringValue(s, precision, false)}`;
          return (
            <g>
              <g transform={`translate(${fs * 0.3}, ${-D2 / 2 - fs * 0.8})`}>
                <rect x="0" y={-fs * 0.65} width={d2Str.length * fs * 0.6 + fs * 0.8} height={fs * 1.3} rx={fs * 0.2} fill="var(--bg-1)" stroke="var(--cyan)" strokeWidth={Math.max(0.12, fs * 0.05)} />
                <text x={fs * 0.4} y={0} dominantBaseline="central" fill="var(--ink)" fontSize={fs * 0.82} fontWeight="800" fontFamily="ui-monospace, monospace">{d2Str}</text>
              </g>
              <g transform={`translate(${fs * 0.3}, ${fs * 0.8})`}>
                <rect x="0" y={-fs * 0.65} width={tapStr.length * fs * 0.6 + fs * 0.8} height={fs * 1.3} rx={fs * 0.2} fill="var(--bg-1)" stroke="var(--warn)" strokeWidth={Math.max(0.12, fs * 0.05)} />
                <text x={fs * 0.4} y={0} dominantBaseline="central" fill="var(--warn)" fontSize={fs * 0.82} fontWeight="800" fontFamily="ui-monospace, monospace">{tapStr}</text>
              </g>
              <g transform={`translate(${fs * 0.3}, ${s / 2 + fs * 1.1})`}>
                <rect x="0" y={-fs * 0.65} width={sStr.length * fs * 0.6 + fs * 0.8} height={fs * 1.3} rx={fs * 0.2} fill="var(--bg-1)" stroke="var(--line)" strokeWidth={Math.max(0.12, fs * 0.05)} />
                <text x={fs * 0.4} y={0} dominantBaseline="central" fill="var(--ink)" fontSize={fs * 0.82} fontWeight="800" fontFamily="ui-monospace, monospace">{sStr}</text>
              </g>
            </g>
          );
        })()}

        <HexFacets cx={hexCx} cy={0} vertexR={hexR} turns={turns} strokeW={fs * 0.06} />
        <circle cx={hexCx} cy={0} r={s / 2} fill="none" stroke="var(--cyan)" strokeWidth={fs * 0.05} strokeDasharray={`${fs * 0.3} ${fs * 0.2}`} />
        <circle cx={hexCx} cy={0} r={D / 2} fill="none" stroke="var(--cyan)" strokeWidth={fs * 0.07} />
        <circle cx={hexCx} cy={0} r={D2 / 2} fill="none" stroke="var(--alu-dim)" strokeWidth={fs * 0.05} strokeDasharray={`${fs * 0.3} ${fs * 0.18}`} />
        <circle cx={hexCx} cy={0} r={D1 / 2} fill="var(--bg-1)" stroke="var(--cyan)" strokeWidth={fs * 0.07} />
        <circle cx={hexCx} cy={0} r={tap / 2} fill="none" stroke="var(--warn)" strokeWidth={fs * 0.05} strokeDasharray={`${fs * 0.25} ${fs * 0.15}`} />
        
        {(() => {
          const endHex = `s=${formatEngineeringValue(s, precision, false)} e=${formatEngineeringValue(e, precision, false)}`;
          const ehW = endHex.length * fs * 0.58 + fs * 1.2;
          const ehH = fs * 1.35;
          const ehY = hexR + fs * 1.8;
          return (
            <g>
              <rect x={hexCx - ehW / 2} y={ehY - ehH / 2} width={ehW} height={ehH} rx={fs * 0.2} fill="var(--bg-1)" stroke="var(--cyan)" strokeWidth={Math.max(0.12, fs * 0.06)} />
              <text x={hexCx} y={ehY} dominantBaseline="central" textAnchor="middle" fill="var(--ink)" fontSize={fs * 0.85} fontWeight="800" fontFamily="ui-monospace, monospace">
                {endHex}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

function maleRows(t: Iso68MaleTooth, lang: string = 'en') {
  return [
    { id: '1 root', x: t.x.root, y: t.yRoot, note: t12(lang, 'root Ød₃/2 · arc R=H/6', 'diş dibi Ød₃/2 · yay R=H/6') },
    { id: '2 fillet', x: t.x.filletL, y: t.yD1, note: t12(lang, 'H/6 tangent = ØD₁/2', 'H/6 teğet = ØD₁/2') },
    { id: '3 pitch↑', x: t.x.pitchRise, y: t.yPitch, note: t12(lang, 'pitch Ød₂/2 rising', 'hatve Ød₂/2 çıkan yanak') },
    { id: '4 crest L', x: t.x.crestL, y: t.yCrest, note: t12(lang, 'crest Ød/2 · P/8 start', 'tepe Ød/2 · düz P/8 başı') },
    { id: '5 crest R', x: t.x.crestR, y: t.yCrest, note: t12(lang, 'crest Ød/2 · P/8 end', 'tepe Ød/2 · düz P/8 sonu') },
    { id: '6 pitch↓', x: t.x.pitchFall, y: t.yPitch, note: t12(lang, 'pitch Ød₂/2 falling', 'hatve Ød₂/2 inen yanak') },
    { id: '7 fillet', x: t.x.filletR, y: t.yD1, note: t12(lang, 'H/6 tangent', 'H/6 teğet') },
    { id: '8 root', x: t.x.root2, y: t.yRoot, note: t12(lang, 'next root · Δx = P', 'sonraki dip · Δx = P') },
  ];
}

function femaleRows(t: Iso68FemaleTooth, lang: string = 'en') {
  return [
    { id: '1 minor', x: t.x.crest, y: t.yMinor, note: t12(lang, 'minor ØD₁/2 · same x as male root', 'iç tepe ØD₁/2 · erkek dip ile aynı x') },
    { id: '2 crest R', x: t.x.crestR, y: t.yMinor, note: t12(lang, 'right edge of P/4 flat', 'P/4 düzün sağ kenarı') },
    { id: '3 pitch↑', x: t.x.pitchRise, y: t.yPitch, note: t12(lang, 'pitch ØD₂/2 rising', 'hatve ØD₂/2 çıkan yanak') },
    { id: '4 major L', x: t.x.majorL, y: t.yMajor, note: t12(lang, 'major ØD/2 · same x as male crest', 'iç kök ØD/2 · erkek tepe ile aynı x') },
    { id: '5 major C', x: t.x.majorC, y: t.yMajor, note: t12(lang, 'P/8 flat centre', 'P/8 düz orta') },
    { id: '6 major R', x: t.x.majorR, y: t.yMajor, note: t12(lang, 'P/8 flat right', 'P/8 düz sağ') },
    { id: '7 pitch↓', x: t.x.pitchFall, y: t.yPitch, note: t12(lang, 'pitch ØD₂/2 falling', 'hatve ØD₂/2 inen yanak') },
    { id: '8 minor', x: t.x.crest2, y: t.yMinor, note: t12(lang, 'next minor · Δx = P', 'sonraki tepe · Δx = P') },
  ];
}

export function Iso68ProfileDetail({ shop, lang = 'en' }: { shop: ShopLike; lang?: string }) {
  const precision = useGlobalPrecision();
  const uid = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const pr = iso68Profile(shop.d, shop.p);
  const male = iso68MaleTooth(shop.d, shop.p);
  const fem = iso68FemaleTooth(shop.d, shop.p);
  const fr = iso68PitchFrame(pr.P);
  const P = fr.P;
  const H = fr.H;
  const R = fr.R;
  const nPitch = 2;
  const Y = (yout: number) => -yout;

  const vbX = -0.55 * P;
  const vbY = Y(H / 2) - 0.85 * H;
  const vbW = nPitch * P + 2.15 * P;
  const vbH = H * 2.7;
  const fs = Math.max(0.12, P * 0.11);
  const sw = fs * 0.11;

  const polarRoot = (i: number, deg: number) => {
    const a = (deg * Math.PI) / 180;
    return { x: i * P + R * Math.cos(a), y: -H / 6 + R * Math.sin(a) };
  };

  const maleSeg = (i: number) => {
    const x = (v: number) => v + i * P;
    const arc = [230, 250, 270].map((deg) => {
      const p = polarRoot(i + 1, deg);
      return `L ${n4(p.x)} ${Y(p.y)}`;
    });
    const lead = i === 0
      ? [`M ${n4(polarRoot(0, 270).x)} ${Y(polarRoot(0, 270).y)}`, `L ${n4(polarRoot(0, 310).x)} ${Y(polarRoot(0, 310).y)}`]
      : [`L ${n4(polarRoot(i, 290).x)} ${Y(polarRoot(i, 290).y)}`, `L ${n4(polarRoot(i, 310).x)} ${Y(polarRoot(i, 310).y)}`];
    return [
      ...lead,
      `L ${n4(x(fr.x.filletL))} ${Y(fr.yD1)}`,
      `L ${n4(x(fr.x.crestL))} ${Y(fr.yMaleCrest)}`,
      `L ${n4(x(fr.x.crestR))} ${Y(fr.yMaleCrest)}`,
      `L ${n4(x(fr.x.filletR))} ${Y(fr.yD1)}`,
      ...arc,
    ].join(' ');
  };

  const femSeg = (i: number) => {
    const x = (v: number) => v + i * P;
    return [
      i === 0 ? `M 0 ${Y(fr.yD1)}` : '',
      `L ${n4(x(P / 8))} ${Y(fr.yD1)}`,
      `L ${n4(x(fr.x.crestL))} ${Y(fr.yMaleCrest)}`,
      `L ${n4(x(fr.x.crestR))} ${Y(fr.yMaleCrest)}`,
      `L ${n4(x(fr.x.filletR))} ${Y(fr.yD1)}`,
      `L ${n4(x(P))} ${Y(fr.yD1)}`,
    ].filter(Boolean).join(' ');
  };

  const maleLine = Array.from({ length: nPitch }, (_, i) => maleSeg(i)).join(' ');
  const femLine = Array.from({ length: nPitch }, (_, i) => femSeg(i)).join(' ');
  const xEnd = nPitch * P;
  const maleFill = `${maleLine} L ${n4(xEnd)} ${Y(-H / 2)} L 0 ${Y(-H / 2)} Z`;
  const femFill = `${femLine} L ${n4(xEnd)} ${Y(H / 2)} L 0 ${Y(H / 2)} Z`;
  const sharp = Array.from({ length: nPitch }, (_, i) => {
    const x0 = i * P;
    return `${i === 0 ? 'M' : 'L'} ${n4(x0)} ${Y(-H / 2)} L ${n4(x0 + P / 2)} ${Y(H / 2)} L ${n4(x0 + P)} ${Y(-H / 2)}`;
  }).join(' ');

  const spec = shop.spec || getFastenerStandardSpecs(
    shop.standard || (/UNC/i.test(shop.threadCallout) ? 'UNC' : /UNF/i.test(shop.threadCallout) ? 'UNF' : /NPT/i.test(shop.threadCallout) ? 'NPT' : /BSPP/i.test(shop.threadCallout) ? 'BSPP (G)' : /BSPT/i.test(shop.threadCallout) ? 'BSPT (R)' : /Tr/i.test(shop.threadCallout) ? 'Trapezoidal' : 'Metric Coarse'),
    shop.metricKey,
    Boolean(shop.b && shop.L && shop.b >= shop.L),
  );

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--bg-1)] p-2">
        <Banner
          lang={lang}
          left={t12(lang, `${spec.threadProfile} basic profile · male crest = female root (same x)`, `${spec.threadProfile} temel profil · erkek tepe = dişi kök (aynı x)`)}
          mid={`P=${formatEngineeringValue(P, precision, false)}  H=${formatEngineeringValue(H, precision, false)}  ${spec.family === 'bsw' || spec.family === 'bspp' || spec.family === 'bspt' ? '55°' : spec.family === 'trapezoidal' ? '30°' : spec.family === 'acme' ? '29°' : '60°'}  ${spec.boltCurrent}`}
          onDownload={() => downloadSvg(svgRef.current, `${fileStem(shop.threadCallout)}-profil.svg`, vbW, vbH)}
        />
        <svg
          ref={svgRef}
          viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
          className="h-auto w-full"
          role="img"
          data-unit="mm"
          data-scale="1:1"
        >
          {defs(uid)}
          <rect x={vbX} y={vbY} width={vbW} height={vbH} fill="var(--bg-2)" stroke="var(--line)" />
          <line x1={-0.15 * P} y1={0} x2={xEnd + 0.25 * P} y2={0} stroke="var(--line-strong)" strokeWidth={sw} strokeDasharray={`${fs * 0.8} ${fs * 0.35}`} />
          <text x={xEnd + 0.28 * P} y={fs * 0.3} fill="var(--alu-dim)" fontSize={fs} fontFamily="ui-monospace, monospace">{t12(lang, 'pitch', 'hatve')} Ød₂</text>

          <path d={sharp} fill="none" stroke="var(--warn)" strokeWidth={sw} strokeDasharray={`${fs * 0.5} ${fs * 0.25}`} />
          <path d={femFill} fill={`url(#${uid}-h)`} stroke="var(--cyan)" strokeWidth={sw * 1.3} />
          <path d={maleFill} fill="var(--warn)" fillOpacity="0.22" stroke="var(--warn)" strokeWidth={sw * 1.45} />

          <line x1={P / 2} y1={Y(H / 2)} x2={0} y2={Y(-H / 2)} stroke="var(--warn)" strokeWidth={sw * 0.7} />
          <line x1={P / 2} y1={Y(H / 2)} x2={P} y2={Y(-H / 2)} stroke="var(--warn)" strokeWidth={sw * 0.7} />
          {(() => {
            const angleDeg = spec.family === 'bsw' || spec.family === 'bspp' || spec.family === 'bspt' ? '55°' : spec.family === 'trapezoidal' ? '30°' : spec.family === 'acme' ? '29°' : '60°';
            return <text x={P / 2} y={Y(H / 2) - fs * 0.4} textAnchor="middle" fill="var(--warn)" fontSize={fs * 1.3} fontWeight="800">{angleDeg}</text>;
          })()}

          <DimH uid={uid} fs={fs} x1={0} x2={P} y={Y(-H / 2) + fs * 2.1} label={`P=${P.toFixed(4)}`} />
          <DimV uid={uid} fs={fs} x={-0.28 * P} y1={Y(-H / 2)} y2={Y(H / 2)} label={`H=${H.toFixed(3)}`} />
          <DimH uid={uid} fs={fs} x1={fr.x.crestL} x2={fr.x.crestR} y={Y(fr.yMaleCrest) - fs * 1.25} label={`P/8=${(P / 8).toFixed(4)}`} />
          <DimH uid={uid} fs={fs} x1={-P / 8} x2={P / 8} y={Y(fr.yD1) + fs * 1.55} label={`P/4=${(P / 4).toFixed(4)}`} />

          <line x1={0} y1={Y(fr.yMaleCrest)} x2={xEnd + 0.12 * P} y2={Y(fr.yMaleCrest)} stroke="var(--warn)" strokeWidth={sw * 0.55} strokeDasharray={`${fs * 0.35} ${fs * 0.18}`} />
          <text x={xEnd + 0.14 * P} y={Y(fr.yMaleCrest) + fs * 0.28} fill="var(--warn)" fontSize={fs} fontFamily="ui-monospace, monospace">Ød = ØD {formatEngineeringValue(pr.d, precision, false)}  H/8</text>
          <line x1={0} y1={Y(fr.yD1)} x2={xEnd + 0.12 * P} y2={Y(fr.yD1)} stroke="var(--cyan)" strokeWidth={sw * 0.55} strokeDasharray={`${fs * 0.35} ${fs * 0.18}`} />
          <text x={xEnd + 0.14 * P} y={Y(fr.yD1) + fs * 0.28} fill="var(--cyan)" fontSize={fs} fontFamily="ui-monospace, monospace">ØD₁ {formatEngineeringValue(pr.D1, precision, false)}  H/4</text>
          <line x1={0} y1={Y(fr.yD3)} x2={xEnd + 0.12 * P} y2={Y(fr.yD3)} stroke="var(--line)" strokeWidth={sw * 0.5} strokeDasharray={`${fs * 0.35} ${fs * 0.18}`} />
          <text x={xEnd + 0.14 * P} y={Y(fr.yD3) + fs * 0.28} fill="var(--ink)" fontSize={fs} fontFamily="ui-monospace, monospace">Ød₃ {formatEngineeringValue(pr.d3, precision, false)}  R=H/6</text>
          <text x={xEnd + 0.14 * P} y={fs * 1.1} fill="var(--ink)" fontSize={fs} fontFamily="ui-monospace, monospace">Ød₂ {formatEngineeringValue(pr.d2, precision, false)}</text>

          <text x={vbX + fs * 0.2} y={vbY + fs * 1.15} fill="var(--muted)" fontSize={fs} fontFamily="ui-monospace, monospace">
            {t12(lang, 'yellow V = sharp · orange fill = male · cyan hatch = female (nested)', 'sarı V = sivri üçgen · turuncu dolgu = erkek · cyan tarama = dişi (iç içe)')}
          </text>
        </svg>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <CoordTable
          title={t12(lang, `Male 1 tooth (x=0 root, y=radius)  P=${formatEngineeringValue(P, precision, false)}`, `Erkek 1 diş (x=0 dip, y=yarıçap)  P=${formatEngineeringValue(P, precision, false)}`)}
          accent="text-[var(--warn)]"
          rows={maleRows(male, lang)}
        />
        <CoordTable
          title={t12(lang, `Female 1 tooth (x=0 minor, y=radius)  P=${formatEngineeringValue(P, precision, false)}`, `Dişi 1 diş (x=0 minör, y=yarıçap)  P=${formatEngineeringValue(P, precision, false)}`)}
          accent="text-[var(--cyan)]"
          rows={femaleRows(fem, lang)}
        />
      </div>
    </div>
  );
}
