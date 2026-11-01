'use client';
/**
 * Production drawing card for the bolt-torque solver: ISO 128 part drawing + VDI 2230 joint
 * section, with 1:1 SVG download, 3D export and the tighten / loosen interaction.
 * Drop-in replacement for BoltMaleSvg1to1 (same props).
 */
import React, { useId, useMemo, useRef, useState } from 'react';
import { t12 } from '@/locales/t12';
import { CrossModuleBridge } from '@/system/crossModuleBridge';
import { getBoltHeadDimensions, type BoltTypeId } from '@/data/boltHeadStandards';
import { getFastenerStandardSpecs } from '@/lib/fastener/sharedEngine';
import type { ScrewHandlers } from '../boltMmSvg';
import { useContainerWidth } from './drawingKit';
import { buildBoltDrawing, type BoltDrawingMode, type BoltDrawingModel } from './BoltDrawingSvg';
import { toBoltDrawingModel, type BoltDrawingShop } from './model';

export interface BoltProductionDrawingProps {
  shop: BoltDrawingShop;
  lang?: string;
  turns?: number;
  motion?: ScrewHandlers;
  screw?: { tighten?: (d?: number) => void; loosen?: (d?: number) => void; reset?: () => void; turns?: number };
  highlightedField?: string | null;
}

const btn =
  'inline-flex items-center gap-1 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] px-2 py-1 text-[11px] font-mono text-[var(--alu)] hover:bg-[var(--hover)] hover:text-[var(--ink)] cursor-pointer focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]';
const btnOn =
  'inline-flex items-center gap-1 rounded-[var(--radius-s)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-2 py-1 text-[11px] font-mono font-semibold text-[var(--cyan)] cursor-pointer focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]';

export function BoltProductionDrawing({ shop, lang = 'en', turns = 0, motion, screw, highlightedField }: BoltProductionDrawingProps) {
  const uid = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const { ref, width } = useContainerWidth(720);
  const [mode, setMode] = useState<BoltDrawingMode>('part');
  const [zoom, setZoom] = useState(1);
  const [localTurns, setLocalTurns] = useState(0);
  const boltType: BoltTypeId = shop.boltType || 'hex_bolt';
  const canJoint = boltType !== 'set_screw';
  const effMode: BoltDrawingMode = canJoint ? mode : 'part';
  const effTurns = (screw ? turns : 0) + localTurns;

  const model = useMemo<BoltDrawingModel>(() => toBoltDrawingModel(shop, boltType), [shop, boltType]);
  // loosening (negative turns) lifts the nut off the plate by P per revolution
  const nutGap = Math.max(0, -effTurns * shop.p);

  const drawing = useMemo(
    () =>
      buildBoltDrawing(model, {
        mode: effMode,
        widthPx: Math.max(280, width - 4),
        fontPx: width < 560 ? 11 : 12,
        nutGap,
        highlight: highlightedField,
        uid,
        labels: {
          section: t12(lang, 'Section · VDI 2230', 'Kesit · VDI 2230'),
          scale: '1:1 mm · ISO 128 · ISO 6410',
        },
      }),
    [model, effMode, width, nutGap, highlightedField, uid, lang],
  );
  const { vb, body, info } = drawing;

  const tighten = (dlt: number) => (screw?.tighten ? screw.tighten(dlt) : setLocalTurns((v) => v + dlt));
  const loosen = (dlt: number) => (screw?.loosen ? screw.loosen(dlt) : setLocalTurns((v) => v - dlt));
  const reset = () => { screw?.reset?.(); setLocalTurns(0); };

  const status = effMode !== 'joint'
    ? null
    : info.detached
    ? { text: t12(lang, 'Nut off the thread', 'Somun dişten çıktı'), color: 'var(--bad)' }
    : info.seated
    ? { text: effTurns > 0.01 ? t12(lang, `Seated · +${Math.round(effTurns * 360)}° past snug`, `Oturdu · snug +${Math.round(effTurns * 360)}°`) : t12(lang, 'Seated (snug)', 'Oturdu (snug)'), color: 'var(--ok)' }
    : { text: t12(lang, `Gap ${info.gap.toFixed(2)} mm`, `Boşluk ${info.gap.toFixed(2)} mm`), color: 'var(--warn)' };

  const download = () => {
    const el = svgRef.current;
    if (!el) return;
    const clone = el.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', `${vb.w.toFixed(2)}mm`);
    clone.setAttribute('height', `${vb.h.toFixed(2)}mm`);
    clone.removeAttribute('style');
    // resolve theme tokens so the file renders outside the site
    const cs = getComputedStyle(el);
    let markup = clone.outerHTML;
    markup = markup.replace(/var\((--[\w-]+)(?:,\s*([^)]+))?\)/g, (_m, name: string, fb?: string) => {
      const v = cs.getPropertyValue(name).trim();
      return v || (fb ? fb.trim() : '#000');
    });
    const blob = new Blob(
      ['<?xml version="1.0" encoding="UTF-8"?>\n<!-- AluCAD OS · 1 user unit = 1 mm · ISO 128 / ISO 6410 -->\n', markup],
      { type: 'image/svg+xml;charset=utf-8' },
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(shop.threadCallout || 'bolt').replace(/[^\w.-]+/g, '_')}x${shop.L}-${effMode}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const export3D = () => {
    const tc = String(shop.threadCallout || '');
    const tType = /NPTF/i.test(tc) ? 'NPTF' : /NPT/i.test(tc) ? 'NPT' : /BSPT/i.test(tc) || tc.startsWith('R') ? 'BSPT'
      : /BSPP/i.test(tc) || tc.startsWith('G') ? 'BSPP' : /UNF/i.test(tc) ? 'UNF' : /UNC/i.test(tc) ? 'UNC' : /^Tr/i.test(tc) ? 'Tr' : 'M';
    const spec = shop.spec || getFastenerStandardSpecs('Metric Coarse', shop.metricKey || `M${shop.d}`, shop.b >= shop.L, boltType);
    const hd = shop.headDim || getBoltHeadDimensions(boltType, shop.metricKey || `M${shop.d}`);
    const ls = Math.max(0, shop.L - shop.b);
    CrossModuleBridge.exportThreadTo3D({
      type: tType,
      nominalDia: shop.d,
      pitch: shop.p,
      lengthMm: shop.L,
      threadLength: shop.b,
      shankLength: ls,
      headWidth: hd?.s ?? shop.s,
      headHeight: hd?.k ?? shop.k,
      cornerWidth: hd?.e ?? shop.e,
      headDiameter: hd?.dk,
      socketSize: hd?.s,
      socketDepth: hd?.t,
      flangeDiameter: hd?.dc,
      flangeThickness: hd?.c,
      boltType,
      nutWidth: shop.s,
      nutHeight: shop.m,
      nutCornerWidth: shop.e,
      nutPositionMm: Math.max(0, info.nutX),
      grade: shop.grade,
      standard: spec?.boltCurrent,
      nutStandard: spec?.nutStandard,
      title: `${spec?.boltCurrent ?? ''} ${shop.metricKey ?? `M${shop.d}`}×${shop.L} ${shop.grade ?? ''}`.trim(),
      role: effMode === 'joint' ? 'assembly' : 'bolt',
      switchWindow: true,
    });
  };

  const onWheel = (e: React.WheelEvent) => {
    if (effMode !== 'joint') return;
    e.preventDefault();
    if (e.deltaY > 0) loosen(0.25);
    else tighten(0.25);
  };

  return (
    <div className="rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--bg-1)]">
      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-2.5 py-2">
        <div className="flex items-center gap-1" role="tablist" aria-label={t12(lang, 'Drawing view', 'Çizim görünümü')}>
          <button type="button" role="tab" aria-selected={effMode === 'part'} className={effMode === 'part' ? btnOn : btn} onClick={() => setMode('part')}>
            {t12(lang, 'Part drawing', 'Parça resmi')}
          </button>
          <button
            type="button" role="tab" aria-selected={effMode === 'joint'} disabled={!canJoint}
            className={`${effMode === 'joint' ? btnOn : btn} disabled:opacity-40 disabled:cursor-not-allowed`}
            onClick={() => setMode('joint')}
            title={canJoint ? '' : t12(lang, 'Set screws have no clamped joint', 'Setuskurun sıkma bağlantısı yoktur')}
          >
            {t12(lang, 'Joint section', 'Bağlantı kesiti')}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <div className="flex items-center rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)]">
            <button type="button" className="px-2 py-1 text-[11px] font-mono text-[var(--alu-dim)] hover:text-[var(--ink)] cursor-pointer" onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))} aria-label={t12(lang, 'Zoom out', 'Uzaklaştır')}>−</button>
            <button type="button" className="px-1.5 py-1 text-[11px] font-mono tabular-nums text-[var(--alu)] cursor-pointer" onClick={() => setZoom(1)} title={t12(lang, 'Reset zoom', 'Ölçeği sıfırla')}>{Math.round(zoom * 100)}%</button>
            <button type="button" className="px-2 py-1 text-[11px] font-mono text-[var(--alu-dim)] hover:text-[var(--ink)] cursor-pointer" onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} aria-label={t12(lang, 'Zoom in', 'Yakınlaştır')}>+</button>
          </div>
          <button type="button" className={btn} onClick={download}>{t12(lang, 'SVG 1:1', 'SVG 1:1')}</button>
          <button type="button" className={btn} onClick={export3D}>{t12(lang, '3D export', "3D'ye aktar")}</button>
        </div>
      </div>

      {/* tighten / loosen (joint view) */}
      {effMode === 'joint' && (
        <div className="flex flex-wrap items-center gap-1 border-b border-[var(--line)] px-2.5 py-1.5 text-[11px]">
          <span className="mr-1 text-[var(--alu-dim)]">{t12(lang, 'Nut:', 'Somun:')}</span>
          <button type="button" className={btn} onClick={() => loosen(1)}>↺ {t12(lang, '1 rev', '1 tur')}</button>
          <button type="button" className={btn} onClick={() => loosen(0.25)}>−¼</button>
          <button type="button" className={btn} onClick={reset}>{t12(lang, 'Snug', 'Snug')}</button>
          <button type="button" className={btn} onClick={() => tighten(0.25)}>+¼</button>
          <button type="button" className={btn} onClick={() => tighten(1)}>↻ {t12(lang, '1 rev', '1 tur')}</button>
          {status && (
            <span className="ml-auto font-mono tabular-nums" style={{ color: status.color }}>{status.text}</span>
          )}
        </div>
      )}

      <div ref={ref} className="overflow-auto p-1.5" style={{ maxHeight: zoom > 1 ? 720 : undefined }}>
        <svg
          ref={svgRef}
          viewBox={`${vb.x.toFixed(3)} ${vb.y.toFixed(3)} ${vb.w.toFixed(3)} ${vb.h.toFixed(3)}`}
          style={{ display: 'block', width: `${zoom * 100}%`, height: 'auto', background: 'var(--bg-1)', touchAction: effMode === 'joint' && motion ? 'none' : undefined }}
          className={effMode === 'joint' && motion ? 'cursor-grab select-none active:cursor-grabbing' : undefined}
          role="img"
          aria-label={`${model.designation} — ${effMode === 'joint' ? 'joint section' : 'part drawing'}`}
          data-unit="mm"
          data-scale="1:1"
          data-d={shop.d}
          data-p={shop.p}
          data-d3={model.d3.toFixed(4)}
          data-length={shop.L}
          data-b={shop.b}
          onWheel={onWheel}
          {...(effMode === 'joint' && motion ? motion : {})}
        >
          <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="var(--bg-1, #111418)" />
          {body}
        </svg>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] px-2.5 py-1.5 font-mono text-[10px] text-[var(--muted)]">
        <span>{t12(lang, `Sheet ${vb.w.toFixed(0)} × ${vb.h.toFixed(0)} mm · 1 unit = 1 mm`, `Pafta ${vb.w.toFixed(0)} × ${vb.h.toFixed(0)} mm · 1 birim = 1 mm`)}</span>
        {effMode === 'joint' && motion && <span>{t12(lang, 'Click / wheel on the drawing: tighten · right-click: loosen', 'Çizime tık / tekerlek: sık · sağ tık: gevşet')}</span>}
      </div>
    </div>
  );
}

export default BoltProductionDrawing;
