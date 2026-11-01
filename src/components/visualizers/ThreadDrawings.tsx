'use client';
/**
 * Thread drawings for the "Thread Geometry" tab — four views, all built from threadForm():
 *   profile : basic profile of the external thread (fundamental triangle, flats/radii, d/d2/d3)
 *   fit     : external + internal thread engaged (shared flanks, crest/root clearance)
 *   male    : external thread part view, ISO 6410-1 convention (+ end view)
 *   female  : blind tapped hole in section, ISO 6410-1 convention (+ end view)
 * Text keeps ~fontPx on screen at any thread size (two-pass layout). Theme tokens only.
 */
import React, { useMemo } from 'react';
import type { ThreadProfileKind } from '@/lib/fastener/threadProfiles';
import { crestFlat, formLevels, profileBoundary, rootFlat, threadForm, type FormSpec } from '@/lib/fastener/threadForms';
import { C, CenterLine, HDim, HatchRect, Kit, Leader, Txt, VDim, makeKit, textW, useContainerWidth } from '@/components/modules/mechanical/boltDrawing/drawingKit';

export type ThreadDrawingView = 'profile' | 'fit' | 'male' | 'female';

export interface ThreadDrawingsProps {
  view: ThreadDrawingView;
  kind: ThreadProfileKind;
  d: number;
  P: number;
  tapDrill?: number;
  callout: string;
  internalCallout?: string;
  standard?: string;
  leftHand?: boolean;
  /** override the form's default taper (true → 1:16 on Ø, false → parallel) */
  tapered?: boolean;
  svgRef?: React.Ref<SVGSVGElement>;
  labels?: Partial<Record<'male' | 'female' | 'contact' | 'play' | 'threadDepth' | 'drillDepth' | 'taper', string>>;
}

interface Box { x0: number; y0: number; x1: number; y1: number }
const f3 = (v: number) => (Number.isFinite(v) ? v.toFixed(3) : '–');
const f2 = (v: number) => (Number.isFinite(v) ? String(parseFloat(v.toFixed(2))) : '–');
const polyline = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(4)} ${(-y).toFixed(4)}`).join(' ');

export function ThreadDrawings(props: ThreadDrawingsProps) {
  const { ref, width } = useContainerWidth(760);
  const out = useMemo(() => {
    const fontPx = width < 560 ? 11 : 12;
    const W = Math.max(280, width - 4);
    const scale = props.view === 'profile' || props.view === 'fit' ? props.P : props.d;
    let fs = scale * 0.06;
    let r = build(props, makeKit(fs), W < 560);
    for (let i = 0; i < 4; i++) {
      const next = (fontPx * (r.box.x1 - r.box.x0)) / W;
      if (Math.abs(next - fs) / fs < 0.015) break;
      fs = next;
      r = build(props, makeKit(fs), W < 560);
    }
    const pad = r.kit.fs * 0.6;
    return { ...r, vb: { x: r.box.x0 - pad, y: r.box.y0 - pad, w: r.box.x1 - r.box.x0 + 2 * pad, h: r.box.y1 - r.box.y0 + 2 * pad } };
  }, [props, width]);
  const { vb } = out;
  return (
    <div ref={ref} className="w-full">
      <svg
        ref={props.svgRef}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`${vb.x.toFixed(4)} ${vb.y.toFixed(4)} ${vb.w.toFixed(4)} ${vb.h.toFixed(4)}`}
        style={{ display: 'block', width: '100%', height: 'auto', background: C.bg }}
        role="img"
        aria-label={`${props.callout} — ${props.view}`}
        data-unit="mm"
      >
        <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill={C.bg} />
        {out.body}
      </svg>
    </div>
  );
}

/* ========================================================================================= */

function build(p: ThreadDrawingsProps, k: Kit, narrow: boolean) {
  const f = threadForm(p.kind, p.P);
  switch (p.view) {
    case 'fit': return profileView(p, f, k, true);
    case 'male': return partView(p, f, k, narrow, 'male');
    case 'female': return partView(p, f, k, narrow, 'female');
    default: return profileView(p, f, k, false);
  }
}

/** y (apex-relative) → radius-relative label helpers */
function diameters(p: ThreadDrawingsProps, f: FormSpec) {
  const L = formLevels(f);
  const R = (y: number) => p.d / 2 + (y - L.maleCrest); // radius at level y (d at the male crest)
  return {
    L,
    d: p.d,
    d2: 2 * R(L.pitchLine),
    d3: 2 * R(L.maleRoot),
    D1: 2 * R(L.femaleCrest),
    D: 2 * R(L.femaleRoot),
  };
}

/* ── profile / fit ─────────────────────────────────────────────────────────────────────── */

function profileView(p: ThreadDrawingsProps, f: FormSpec, k: Kit, fit: boolean) {
  const P = p.P;
  const { L, d2, d3, D1, D } = diameters(p, f);
  const x0 = -0.75 * P, x1 = 1.75 * P;
  const male = profileBoundary(f, 'male', x0, x1);
  const female = profileBoundary(f, 'female', x0, x1);
  const yMaleBase = L.maleRoot - 0.32 * P;
  const yFemTop = L.femaleRoot + 0.32 * P;
  const parts: React.ReactNode[] = [];
  const id = (s: string) => `${p.kind}-${s}-${fit ? 'f' : 'p'}`;

  // male body (hatched)
  const malePath = `${polyline(male)} L${x1} ${-yMaleBase} L${x0} ${-yMaleBase} Z`;
  parts.push(
    <g key="male">
      <clipPath id={id('mc')}><path d={malePath} /></clipPath>
      <path d={malePath} fill={C.part} />
      <g clipPath={`url(#${id('mc')})`}><HatchRect k={k} id={id('mh')} x={x0} y={-L.maleCrest - 0.1 * P} w={x1 - x0} h={L.maleCrest - yMaleBase + 0.2 * P} angle={45} pitch={k.fs * 0.8} /></g>
      <path d={polyline(male)} fill="none" stroke={C.outline} strokeWidth={k.thick} strokeLinejoin="round" />
    </g>,
  );
  if (fit) {
    const femPath = `${polyline(female)} L${x1} ${-yFemTop} L${x0} ${-yFemTop} Z`;
    parts.push(
      <g key="fem">
        <clipPath id={id('fc')}><path d={femPath} /></clipPath>
        <path d={femPath} fill={C.partLight} />
        <g clipPath={`url(#${id('fc')})`}><HatchRect k={k} id={id('fh')} x={x0} y={-yFemTop - 0.1 * P} w={x1 - x0} h={yFemTop - L.femaleCrest + 0.2 * P} angle={-45} pitch={k.fs * 0.8} /></g>
        <path d={polyline(female)} fill="none" stroke={C.dim} strokeWidth={k.thick} strokeLinejoin="round" />
      </g>,
    );
  }

  // fundamental triangle (thin dashed)
  if (!f.square) {
    const zig: [number, number][] = [];
    const tL = Math.tan((f.bL * Math.PI) / 180), tR = Math.tan((f.bR * Math.PI) / 180);
    for (let c = -P; c <= x1 + P; c += P) zig.push([c - f.Hs * tL, -f.Hs], [c, 0], [c + f.Hs * tR, -f.Hs]);
    const zTop = fit ? -yFemTop : -Math.max(0, L.maleCrest) - k.fs * 0.2;
    const zBot = -yMaleBase;
    parts.push(
      <g key="zig">
        <clipPath id={id('zc')}><rect x={x0} y={Math.min(zTop, 0) - k.fs * 0.4} width={x1 - x0} height={zBot - Math.min(zTop, 0) + k.fs * 0.4} /></clipPath>
        <path clipPath={`url(#${id('zc')})`} d={polyline(clipToX(zig, x0, x1))} fill="none" stroke={C.thin} strokeWidth={k.thin} strokeDasharray={`${k.fs * 0.5} ${k.fs * 0.3}`} />
      </g>,
    );
  }

  // reference levels with labels on the right
  const levels: { y: number; text: string; color: string; dash?: boolean }[] = fit
    ? [
        { y: L.femaleRoot, text: `ØD ${f3(D)}`, color: C.dim, dash: true },
        { y: L.maleCrest, text: `Ød ${f3(p.d)}`, color: C.outline },
        { y: L.pitchLine, text: `Ød₂ ${f3(d2)}`, color: C.warn },
        { y: L.femaleCrest, text: `ØD₁ ${f3(D1)}`, color: C.dim, dash: true },
        { y: L.maleRoot, text: `Ød₃ ${f3(d3)}`, color: C.outline },
      ]
    : [
        { y: L.maleCrest, text: `Ød ${f3(p.d)}`, color: C.outline },
        { y: L.pitchLine, text: `Ød₂ ${f3(d2)}`, color: C.warn },
        { y: L.maleRoot, text: `Ød₃ ${f3(d3)}`, color: C.outline },
      ];
  // spread labels vertically so they never overlap
  const sorted = [...levels].sort((a, b) => b.y - a.y);
  const minGap = k.fs * 1.25;
  const ty: number[] = [];
  sorted.forEach((lv, i) => { ty[i] = i === 0 ? -lv.y : Math.max(-lv.y, ty[i - 1] + minGap); });
  const xLab = x1 + k.fs * 1.2;
  sorted.forEach((lv, i) => {
    parts.push(
      <g key={`lv${i}`}>
        <line x1={x0} y1={-lv.y} x2={x1 + k.fs * 0.4} y2={-lv.y} stroke={lv.color} strokeWidth={k.thin} strokeDasharray={lv.dash ? `${k.fs * 0.5} ${k.fs * 0.3}` : `${k.fs * 1.4} ${k.fs * 0.3} ${k.fs * 0.2} ${k.fs * 0.3}`} opacity={0.9} />
        <line x1={x1 + k.fs * 0.4} y1={-lv.y} x2={xLab - k.fs * 0.2} y2={ty[i]} stroke={lv.color} strokeWidth={k.thin} />
        <Txt k={k} x={xLab} y={ty[i]} anchor="start" baseline="central" color={lv.color === C.outline ? C.dimText : lv.color}>{lv.text}</Txt>
      </g>,
    );
  });
  const labW = Math.max(...levels.map((l) => textW(l.text, k.fs)));

  // pitch dimension (apex to apex) above
  const yTopMost = fit ? yFemTop : L.maleCrest;
  const yP = -(Math.max(0, yTopMost) + k.fs * (fit ? 1.6 : 2.4));
  parts.push(<HDim key="P" k={k} x1={0} x2={P} yA={-L.maleCrest - (fit ? 0 : 0)} yd={yP} text={`P ${f3(P)}`} />);

  // flank angle on the second tooth (x = P)
  if (!f.square && !fit) {
    const ra = Math.min(f.Hs * 0.55, P * 0.9);
    const tL = Math.tan((f.bL * Math.PI) / 180), tR = Math.tan((f.bR * Math.PI) / 180);
    const ax = P, ay = 0;
    const left = [ax - ra * Math.sin((f.bL * Math.PI) / 180), -(ay - ra * Math.cos((f.bL * Math.PI) / 180))];
    const right = [ax + ra * Math.sin((f.bR * Math.PI) / 180), -(ay - ra * Math.cos((f.bR * Math.PI) / 180))];
    parts.push(
      <g key="ang">
        <line x1={ax} y1={0} x2={ax} y2={f.Hs * 0.95} stroke={C.thin} strokeWidth={k.thin} strokeDasharray={`${k.fs * 0.3} ${k.fs * 0.3}`} />
        <path d={`M${left[0]} ${left[1]} A${ra} ${ra} 0 0 0 ${right[0]} ${right[1]}`} fill="none" stroke={C.warn} strokeWidth={k.thin * 1.4} />
        {f.bL === f.bR ? (
          <Txt k={k} x={ax} y={ra + k.fs * 1.1} color={C.warn} weight={700}>{f.angleLabel}</Txt>
        ) : (
          <>
            <Txt k={k} x={ax - ra * 0.35} y={ra + k.fs * 1.1} color={C.warn} anchor="end">{`${f.bL}°`}</Txt>
            <Txt k={k} x={ax + ra * 0.45} y={ra * 0.9 + k.fs * 1.1} color={C.warn} anchor="start">{`${f.bR}°`}</Txt>
          </>
        )}
        {void tL}{void tR}
      </g>,
    );
  }

  // vertical dims on the left: H (sharp) and h3 (thread depth)
  const xH = x0 - k.fs * 2.2;
  const xh = x0 - k.fs * 0.9 - textW('H 0.000', k.fs) - k.fs * 2.6;
  if (!fit) {
    if (!f.square && f.Hs < 2.2 * (L.maleCrest - L.maleRoot)) parts.push(<VDim key="H" k={k} y1={0} y2={f.Hs} xA={x0} xd={xH} side="left" text={`H ${f3(f.Hs)}`} />);
    parts.push(<VDim key="h3" k={k} y1={-L.maleCrest} y2={-L.maleRoot} xA={x0} xd={f.square ? xH : xh} side="left" text={`h₃ ${f3(L.maleCrest - L.maleRoot)}`} color={C.dim} />);
  } else {
    // radial clearances at the right edge of the engaged pair
    const xc = x1 - 0.05 * P;
    const play1 = L.femaleRoot - L.maleCrest, play2 = L.femaleCrest - L.maleRoot;
    if (play1 > 1e-4) parts.push(<Leader key="c1" k={k} x={0} y={-(L.maleCrest + L.femaleRoot) / 2} tx={-0.25 * P} ty={-yFemTop - k.fs * 0.4} text={`${p.labels?.play ?? 'play'} ${f3(play1)}`} color={C.thin} dot />);
    if (play2 > 1e-4) parts.push(<Leader key="c2" k={k} x={P / 2 + (f.square ? 0 : 0)} y={-(L.maleRoot + L.femaleCrest) / 2} tx={P * 0.9} ty={-yMaleBase + k.fs * 1.6} text={`${p.labels?.play ?? 'play'} ${f3(play2)}`} color={C.thin} dot />);
    void xc;
    // contact (load) flank highlight on the right flank of tooth 0
    if (!f.square) {
      const tR = Math.tan((f.bR * Math.PI) / 180);
      const yA = Math.min(L.maleCrest, L.femaleRoot), yB = Math.max(L.maleRoot, L.femaleCrest);
      const pA = [-yA * tR, -yA], pB = [-yB * tR, -yB];
      parts.push(
        <g key="contact">
          <line x1={pA[0]} y1={pA[1]} x2={pB[0]} y2={pB[1]} stroke={C.ok} strokeWidth={k.thick * 1.8} strokeLinecap="round" />
          <Leader k={k} x={(pA[0] + pB[0]) / 2} y={(pA[1] + pB[1]) / 2} tx={0.55 * P} ty={-yFemTop - k.fs * 0.4} text={p.labels?.contact ?? 'flank contact'} color={C.ok} textColor={C.ok} dot />
        </g>,
      );
    }
    // region labels outside on the left
    parts.push(<Txt key="lf" k={k} x={x0 - k.fs * 0.6} y={-(L.femaleRoot + yFemTop) / 2} anchor="end" baseline="central" color={C.dim} weight={700}>{p.labels?.female ?? 'Internal (nut)'}</Txt>);
    parts.push(<Txt key="lm" k={k} x={x0 - k.fs * 0.6} y={-(L.maleRoot + yMaleBase) / 2} anchor="end" baseline="central" weight={700}>{p.labels?.male ?? 'External (bolt)'}</Txt>);
  }

  // crest / root leaders (profile view)
  if (!fit) {
    const crest = f.male.top, root = f.male.bottom;
    const cText = crest.r ? `r ${f3(crest.r)}` : `${f3(crestFlat(f, crest))}`;
    const rText = root.r ? `R ${f3(root.r)}` : `${f3(rootFlat(f, root))}`;
    const tRr = Math.tan((f.bR * Math.PI) / 180) * f.Hs;
    parts.push(<Leader key="cr" k={k} x={0} y={-L.maleCrest} tx={-0.45 * P} ty={yP + k.fs * 0.2} text={cText} />);
    parts.push(<Leader key="rt" k={k} x={tRr} y={-L.maleRoot} tx={tRr + 0.35 * P} ty={-yMaleBase + k.fs * 1.7} text={rText} />);
  }

  const leftText = fit
    ? Math.max(textW(p.labels?.female ?? 'Internal (nut)', k.fs), textW(p.labels?.male ?? 'External (bolt)', k.fs)) + k.fs
    : f.square ? k.fs * 2.4 + textW('h₃ 0.000', k.fs) : (x0 - xh) + textW('h₃ 0.000', k.fs) + k.fs * 0.6;
  const box: Box = {
    x0: x0 - leftText - k.fs * 0.6,
    x1: xLab + labW + k.fs * 0.4,
    y0: yP - k.fs * 1.6,
    y1: Math.max(-yMaleBase + k.fs * 2.4, ty[ty.length - 1] + k.fs),
  };
  return withTitle(p, f, k, box, parts, fit ? `${f.label} · ${p.labels?.male ?? 'external'} + ${p.labels?.female ?? 'internal'}` : `${f.label} · basic profile`);
}

function clipToX(pts: [number, number][], x0: number, x1: number) {
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const clamp = (q: [number, number]): [number, number] => {
      if (q[0] < x0) { const t = (x0 - a[0]) / (b[0] - a[0]); return [x0, a[1] + t * (b[1] - a[1])]; }
      if (q[0] > x1) { const t = (x1 - a[0]) / (b[0] - a[0]); return [x1, a[1] + t * (b[1] - a[1])]; }
      return q;
    };
    if (b[0] < x0 || a[0] > x1) continue;
    out.push(clamp(a), clamp(b));
  }
  return out;
}

/* ── part views (ISO 6410-1) ───────────────────────────────────────────────────────────── */

function partView(p: ThreadDrawingsProps, f: FormSpec, k: Kit, narrow: boolean, which: 'male' | 'female') {
  const d = p.d, P = p.P;
  const { d3, D1 } = diameters(p, f);
  const taper = p.tapered === undefined ? (f.taper ?? 0) : p.tapered ? (f.taper ?? 1 / 16) : 0;
  const parts: React.ReactNode[] = [];
  const R = d / 2;

  if (which === 'male') {
    const Lt = Math.min(Math.max(2.2 * d, 10 * P), 5 * d);  // shown thread length
    const ls = 0.6 * d;                                      // plain shank stub to the left
    const c = (d - d3) / 2 + 0.1 * P;
    const rEnd = R - (taper * Lt) / 2;                       // taper: radius shrinks toward the free end
    const r3End = d3 / 2 - (taper * Lt) / 2;
    const x0 = -ls, xT = Lt;
    // body outline
    parts.push(
      <g key="body">
        <path d={`M${x0} ${-R} L0 ${-R} L${xT - c} ${-(rEnd + c * taper)} L${xT} ${-(rEnd - c)} L${xT} ${rEnd - c} L${xT - c} ${rEnd + c * taper} L0 ${R} L${x0} ${R}`} fill={C.part} stroke={C.outline} strokeWidth={k.thick} strokeLinejoin="round" />
        {/* break line on the left */}
        <path d={`M${x0} ${-R} C${x0 - R * 0.25} ${-R * 0.4}, ${x0 + R * 0.25} ${R * 0.4}, ${x0} ${R}`} fill="none" stroke={C.outline} strokeWidth={k.thin} />
        {/* root diameter: thin continuous; thread end: thick */}
        <line x1={0} y1={-d3 / 2} x2={xT - c * 0.3} y2={-r3End} stroke={C.outline} strokeWidth={k.thin} />
        <line x1={0} y1={d3 / 2} x2={xT - c * 0.3} y2={r3End} stroke={C.outline} strokeWidth={k.thin} />
        <line x1={0} y1={-R} x2={0} y2={R} stroke={C.outline} strokeWidth={k.thick} />
        <line x1={0} y1={-d3 / 2} x2={-(R - d3 / 2) * Math.sqrt(3)} y2={-R} stroke={C.outline} strokeWidth={k.thin} />
        <line x1={0} y1={d3 / 2} x2={-(R - d3 / 2) * Math.sqrt(3)} y2={R} stroke={C.outline} strokeWidth={k.thin} />
      </g>,
    );
    parts.push(<CenterLine key="cl" k={k} x1={x0 - k.fs} y1={0} x2={xT + k.fs} y2={0} />);
    const yUp = -(R + k.fs * 4.2), yDn = R + k.fs * 2.2;
    parts.push(<HDim key="L" k={k} x1={0} x2={xT} yA={R} yd={yDn} text={`b ${f2(Lt)}`} />);
    parts.push(<Leader key="call" k={k} x={xT * 0.45} y={-R + (taper * xT * 0.45) / 2} tx={xT * 0.45 + k.fs * 1.6} ty={yUp + k.fs * 1.4} text={p.callout} />);
    parts.push(<VDim key="d" k={k} y1={-R} y2={R} xA={x0} xd={x0 - k.fs * 1.8} side="left" text={`Ø${f2(d)}`} />);
    parts.push(<Leader key="ch" k={k} x={xT - c / 2} y={rEnd - c / 2} tx={xT + k.fs * 1.2} ty={yDn - k.fs * 0.2} text={`${f2(c)}×45°`} />);
    if (taper) parts.push(<Txt key="tp" k={k} x={xT * 0.5} y={-(R + k.fs * 1.1)} color={C.warn}>{p.labels?.taper ?? `taper 1:${Math.round(1 / taper)} on Ø`}</Txt>);
    if (p.leftHand) parts.push(<Txt key="lh" k={k} x={xT * 0.5} y={k.fs * 0.35}>LH</Txt>);
    let box: Box = {
      x0: x0 - k.fs * 2.4 - textW(`Ø${f2(d)}`, k.fs),
      x1: Math.max(xT + k.fs * 1.4 + textW(`${f2(c)}×45°`, k.fs), xT * 0.45 + k.fs * 1.8 + textW(p.callout, k.fs)),
      y0: yUp - k.fs * 0.4,
      y1: yDn + k.fs * 1.2,
    };
    // end view: major Ø thick, root Ø thin ¾ circle (ISO 6410-1)
    const ev = endView(k, d, d3, 'male');
    const cx = narrow ? (box.x0 + box.x1) / 2 : box.x1 + k.fs * 2 + R;
    const cy = narrow ? box.y1 + k.fs * 1.5 + R : 0;
    parts.push(<g key="ev" transform={`translate(${cx} ${cy})`}>{ev}</g>);
    box = narrow ? { ...box, y1: cy + R + k.fs * 3.2 } : { ...box, x1: cx + R + k.fs, y1: Math.max(box.y1, R + k.fs * 3.2) };
    return withTitle(p, f, k, box, parts, `${f.label} · ISO 6410-1`);
  }

  // ── female: blind tapped hole, section
  const tap = p.tapDrill && p.tapDrill > 0 && p.tapDrill < d ? p.tapDrill : D1;
  const L1 = Math.min(Math.max(1.5 * d, 8 * P), 4 * d);           // full thread depth
  const L2 = L1 + Math.max(3 * P, 0.25 * d);                        // drill depth (cylindrical)
  const tip = (tap / 2) / Math.tan((59 * Math.PI) / 180);           // 118° point
  const blockL = L2 + tip + 0.6 * d;
  const H = 1.05 * d;                                                // block half-height
  const rMinor = (x: number) => tap / 2 - (taper * x) / 2;
  const rMajor = (x: number) => R - (taper * x) / 2;
  const ch = Math.max(0.5 * P, (d - tap) / 2 + 0.1 * P);            // 90° entry countersink to Ø d
  const half = (sg: 1 | -1) => {
    const y = (v: number) => sg * v;
    return `M0 ${y(rMajor(0) + ch * 0.1)} L${ch} ${y(rMinor(ch))} L${L2} ${y(rMinor(L2))} L${L2 + tip} 0 L${blockL} 0 L${blockL} ${y(H)} L0 ${y(H)} Z`;
  };
  parts.push(
    <g key="blk">
      {[1, -1].map((sg) => (
        <g key={sg}>
          <clipPath id={`fh${p.kind}${sg}`}><path d={half(sg as 1 | -1)} /></clipPath>
          <path d={half(sg as 1 | -1)} fill={C.partLight} />
          <g clipPath={`url(#fh${p.kind}${sg})`}><HatchRect k={k} id={`fhh${p.kind}${sg}`} x={-1} y={sg > 0 ? 0 : -H - 1} w={blockL + 2} h={H + 1} angle={45} /></g>
          <path d={half(sg as 1 | -1)} fill="none" stroke={C.outline} strokeWidth={k.thick} strokeLinejoin="round" />
        </g>
      ))}
      {/* ISO 6410: internal thread in section — minor Ø thick (hole edge), major Ø thin, hatch to the minor Ø */}
      <line x1={ch * 0.6} y1={-rMajor(0)} x2={L1} y2={-rMajor(L1)} stroke={C.outline} strokeWidth={k.thin} />
      <line x1={ch * 0.6} y1={rMajor(0)} x2={L1} y2={rMajor(L1)} stroke={C.outline} strokeWidth={k.thin} />
      <line x1={L1} y1={-rMajor(L1)} x2={L1} y2={rMajor(L1)} stroke={C.outline} strokeWidth={k.thick} />
    </g>,
  );
  parts.push(<CenterLine key="cl" k={k} x1={-k.fs * 1.4} y1={0} x2={blockL + k.fs} y2={0} />);
  const yDn1 = H + k.fs * 2.2, yDn2 = yDn1 + k.fs * 2.2;
  parts.push(<HDim key="L1" k={k} x1={0} x2={L1} yA={H} yd={yDn1} text={`${p.labels?.threadDepth ?? 'thread'} ${f2(L1)}`} />);
  parts.push(<HDim key="L2" k={k} x1={0} x2={L2} yA={H} yd={yDn2} text={`${p.labels?.drillDepth ?? 'drill'} ${f2(L2)}`} />);
  const yUp = -(H + k.fs * 2.4);
  parts.push(<Leader key="call" k={k} x={L1 * 0.5} y={-rMajor(L1 * 0.5)} tx={L1 * 0.5 + k.fs * 1.2} ty={yUp} text={p.internalCallout ?? p.callout} />);
  parts.push(<VDim key="tap" k={k} y1={-rMinor(L2 * 0.8)} y2={rMinor(L2 * 0.8)} xA={L2 * 0.8} xd={blockL + k.fs * 1.6} side="right" text={`Ø${f2(tap)}`} />);
  parts.push(<Leader key="pt" k={k} x={L2 + tip * 0.5} y={-rMinor(L2) * 0.5} tx={L2 + tip + k.fs * 0.8} ty={yUp} text="118°" />);
  if (taper) parts.push(<Txt key="tp" k={k} x={L1 * 0.5} y={k.fs * 0.35} color={C.warn}>{p.labels?.taper ?? `taper 1:${Math.round(1 / taper)}`}</Txt>);
  let box: Box = {
    x0: -k.fs * 2,
    x1: Math.max(blockL + k.fs * 2.2 + textW(`Ø${f2(tap)}`, k.fs), L2 + tip + k.fs * 1.2 + textW('118°', k.fs), L1 * 0.5 + k.fs * 1.6 + textW(p.internalCallout ?? p.callout, k.fs)),
    y0: yUp - k.fs * 1.4,
    y1: yDn2 + k.fs * 1.2,
  };
  const ev = endView(k, d, tap, 'female');
  const Ro = R + d * 0.35; // outer ring of the female end view
  const cx = narrow ? (box.x0 + box.x1) / 2 : box.x1 + k.fs * 2 + Ro;
  const cy = narrow ? box.y1 + k.fs * 1.5 + Ro : 0;
  parts.push(<g key="ev" transform={`translate(${cx} ${cy})`}>{ev}</g>);
  box = narrow ? { ...box, y1: cy + Ro + k.fs * 1.2 } : { ...box, x1: cx + Ro + k.fs, y1: Math.max(box.y1, Ro + k.fs) };
  return withTitle(p, f, k, box, parts, `${f.label} · ISO 6410-1 · section`);
}

function endView(k: Kit, d: number, inner: number, which: 'male' | 'female') {
  const arc = (r: number) => {
    const a0 = 0, a1 = 270;
    const pnt = (a: number) => [r * Math.cos((a * Math.PI) / 180), r * Math.sin((a * Math.PI) / 180)];
    const [x0, y0] = pnt(a0), [x1, y1] = pnt(a1);
    return `M${x0} ${y0} A${r} ${r} 0 1 1 ${x1} ${y1}`;
  };
  return (
    <g>
      {which === 'male' ? (
        <>
          <circle cx={0} cy={0} r={d / 2} fill={C.part} stroke={C.outline} strokeWidth={k.thick} />
          <path d={arc(inner / 2)} fill="none" stroke={C.outline} strokeWidth={k.thin} />
        </>
      ) : (
        <>
          <circle cx={0} cy={0} r={d / 2 + d * 0.35} fill={C.partLight} stroke={C.thin} strokeWidth={k.thin} />
          <circle cx={0} cy={0} r={inner / 2} fill={C.bg} stroke={C.outline} strokeWidth={k.thick} />
          <path d={arc(d / 2)} fill="none" stroke={C.outline} strokeWidth={k.thin} />
        </>
      )}
      <CenterLine k={k} x1={-d / 2 - k.fs} y1={0} x2={d / 2 + k.fs} y2={0} />
      <CenterLine k={k} x1={0} y1={-d / 2 - k.fs} x2={0} y2={d / 2 + k.fs} />
    </g>
  );
}

function withTitle(p: ThreadDrawingsProps, f: FormSpec, k: Kit, box: Box, parts: React.ReactNode[], left: string) {
  const right = p.standard ?? f.standard;
  const w = textW(left, k.fs) + textW(right, k.fs * 0.85) + k.fs * 2;
  const b = { ...box };
  if (b.x1 - b.x0 < w) b.x1 = b.x0 + w;
  const ty = b.y1 + k.fs * 1.5;
  const body = (
    <g>
      {parts}
      <line x1={b.x0} y1={ty - k.fs * 1.1} x2={b.x1} y2={ty - k.fs * 1.1} stroke={C.thin} strokeWidth={k.thin} />
      <Txt k={k} x={b.x0} y={ty + k.fs * 0.3} anchor="start" weight={700}>{left}</Txt>
      <Txt k={k} x={b.x1} y={ty + k.fs * 0.3} anchor="end" color={C.thin} size={0.85}>{right}</Txt>
    </g>
  );
  return { box: { ...b, y1: ty + k.fs * 0.9 }, kit: k, body };
}

export default ThreadDrawings;
