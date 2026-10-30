'use client';
/**
 * Bolt production drawing (ISO 128-20 line types, ISO 129-1 dimensioning, ISO 6410-1 thread
 * convention) and bolted-joint section (VDI 2230 clamp length / bearing annulus view).
 *
 * Geometry only — every number comes from the calculator results (engine tables). This file
 * computes no engineering values except drawing proportions. 1 SVG user unit = 1 mm, x along
 * the bolt axis with x = 0 at the head bearing face, y downwards, axis at y = 0.
 *
 * Text height is chosen so it stays ~fontPx on screen at the rendered width (two-pass layout),
 * which is what keeps a 160 mm and a 16 mm bolt equally legible.
 */
import React from 'react';
import type { BoltTypeId } from '@/data/boltHeadStandards';
import { C, CenterLine, HDim, HatchRect, Kit, Leader, Txt, VDim, makeKit, regularHexPoints, textW } from './drawingKit';

export type BoltDrawingMode = 'part' | 'joint';

export interface BoltDrawingModel {
  boltType: BoltTypeId;
  d: number;
  P: number;
  d2: number;
  d3: number;
  /** nominal length as the product standard defines it (countersunk: overall; stud: excl. bm) */
  L: number;
  /** thread length (nut end for studs) */
  b: number;
  head: {
    k: number;
    s?: number;
    e?: number;
    dw?: number;
    dk?: number;
    t?: number;
    r?: number;
    /** flange thickness */
    c?: number;
    /** flange diameter */
    dc?: number;
    /** stud metal end */
    bm?: number;
    /** set screw point */
    dp?: number;
    /** carriage bolt square neck */
    v?: number;
    f?: number;
    /** eye bolt */
    eyeD2?: number;
    eyeD3?: number;
    eyeD4?: number;
    eyeH?: number;
  };
  nut: { m: number; s: number; e: number };
  dh: number;
  grade?: string;
  threadCallout: string;
  designation: string;
  notes?: string;
  FM_kN?: number;
  pM?: number;
  pG?: number;
}

export interface BoltDrawingOptions {
  mode: BoltDrawingMode;
  widthPx: number;
  fontPx?: number;
  /** nut lift-off from the plate (joint view, loosening animation), mm */
  nutGap?: number;
  /** id of the input that has focus ('L', 'b', …) — its dimension is drawn in --warn */
  highlight?: string | null;
  uid: string;
  labels?: { section: string; scale: string };
}

interface Box { x0: number; y0: number; x1: number; y1: number }

const SQ3 = Math.sqrt(3);
const hexAcrossCorners = (s: number) => (2 * s) / SQ3;

export function buildBoltDrawing(model: BoltDrawingModel, opt: BoltDrawingOptions) {
  const fontPx = opt.fontPx ?? 12;
  const narrow = opt.widthPx < 560;
  let fs = Math.max(model.d, model.L) * 0.04;
  let built = layout(model, opt, makeKit(fs), narrow);
  for (let i = 0; i < 4; i++) {
    const w = built.box.x1 - built.box.x0;
    const next = (fontPx * w) / Math.max(200, opt.widthPx);
    if (Math.abs(next - fs) / fs < 0.015) break;
    fs = next;
    built = layout(model, opt, makeKit(fs), narrow);
  }
  const { box, body, kit, info } = built;
  const pad = kit.fs * 0.6;
  const vb = { x: box.x0 - pad, y: box.y0 - pad, w: box.x1 - box.x0 + 2 * pad, h: box.y1 - box.y0 + 2 * pad };
  return { vb, body, kit, info };
}

/* ------------------------------------------------------------------------------------------ */

function layout(m: BoltDrawingModel, opt: BoltDrawingOptions, k: Kit, narrow: boolean) {
  const { d, P, head, boltType } = m;
  const R = d / 2;
  const r3 = m.d3 / 2;
  const isCsk = boltType === 'countersunk';
  const isStud = boltType === 'stud_bolt';
  const isSet = boltType === 'set_screw';
  const isEye = boltType === 'eye_bolt';
  const isCarriage = boltType === 'carriage_bolt';
  const isHexLike = boltType === 'hex_bolt' || boltType === 'heavy_hex' || boltType === 'flange_hex';
  const isSocketLike = boltType === 'socket_cap' || boltType === 'low_head_socket';
  const headless = isStud || isSet;
  const joint = opt.mode === 'joint' && !isSet;
  const hi = (key: string) => (opt.highlight && opt.highlight.toLowerCase() === key.toLowerCase() ? C.warn : C.dim);

  // axial stations
  const hk = headless ? 0 : head.k;
  const xTip = isCsk ? m.L - hk : m.L;          // free end of the bolt
  const b = Math.max(0, Math.min(m.b, xTip));
  const bm = isStud ? head.bm ?? 1.25 * d : 0;
  const xL = isStud ? -bm : 0;                    // left end of the shank (stud: metal end)
  const xThr = isSet ? 0 : xTip - b;              // start of the complete thread (nut end)
  const cTip = Math.min((d - m.d3) / 2 + 0.1 * P, R * 0.45); // ISO 4753 chamfer to just below d3
  const fillet = !headless && !isCsk ? Math.max(0, Math.min(head.r ?? 0, R * 0.25)) : 0;

  // head envelope (half heights)
  const eHex = head.s ? hexAcrossCorners(head.s) : 1.6 * d;
  const headHalf = (() => {
    if (headless) return R;
    if (isHexLike) return Math.max(eHex, boltType === 'flange_hex' ? head.dc ?? 0 : 0) / 2;
    if (isEye) return (head.eyeD3 ?? 4.5 * d) / 2;
    return (head.dk ?? 1.6 * d) / 2;
  })();
  const headLeft = (() => {
    if (headless) return xL;
    if (isEye) return -(head.eyeH ?? 4.4 * d);
    return -hk;
  })();

  // joint stations
  const nutE = m.nut.e || hexAcrossCorners(m.nut.s || 1.6 * d);
  const nutM = m.nut.m || 0.86 * d;
  const overhang = Math.max(2 * P, 0.25 * d);
  const lk = Math.max(0.6 * d, Math.min(xTip - nutM - overhang, xTip - nutM));
  const gapMax = Math.max(0, xTip - lk - nutM);
  const gap = Math.max(0, Math.min(opt.nutGap ?? 0, gapMax + nutM * 0.98));
  const nutX = lk + gap;
  const plateHalf = Math.max(headHalf, nutE / 2, (head.dw ?? 1.5 * d) / 2) + 0.6 * d;
  const dw = head.dw ?? (head.dk ?? 1.5 * d) * 0.95;
  const dwNut = Math.min(nutE * 0.9, (m.nut.s || 1.6 * d) * 0.95);

  const parts: React.ReactNode[] = [];
  let key = 0;
  const K = () => key++;

  /* ---------------- joint: clamped plates (section, hatched) ---------------- */
  if (joint) {
    const t1 = lk / 2;
    const dh2 = m.dh / 2;
    const ph = plateHalf;
    const plate = (x0: number, w: number, ang: 45 | -45, id: string, hole: (y: 1 | -1) => string) => (
      <g key={K()}>
        {[-1, 1].map((sgn) => {
          const path = hole(sgn as 1 | -1);
          return (
            <g key={sgn}>
              <clipPath id={`${opt.uid}-${id}-${sgn}`}><path d={path} /></clipPath>
              <path d={path} fill={C.partLight} />
              <g clipPath={`url(#${opt.uid}-${id}-${sgn})`}>
                <HatchRect k={k} id={`${opt.uid}-${id}-h${sgn}`} x={x0 - 1} y={-ph - 1} w={w + 2} h={2 * ph + 2} angle={ang} />
              </g>
              <path d={path} fill="none" stroke={C.outline} strokeWidth={k.thick} strokeLinejoin="round" />
            </g>
          );
        })}
      </g>
    );
    // upper plate (with 90° countersink for countersunk heads)
    const csk = isCsk ? (head.dk ?? 2 * d) / 2 : 0;
    const x0Top = isCsk ? -hk : 0;
    if (!isStud) parts.push(
      plate(x0Top, t1 - x0Top, 45, 'pa', (sg) => {
        const y = (v: number) => sg * v;
        if (isCsk) {
          const xc = -hk + Math.max(0, csk - dh2); // countersink meets the hole
          return `M${x0Top} ${y(csk)} L${Math.min(xc, t1)} ${y(dh2)} L${t1} ${y(dh2)} L${t1} ${y(ph)} L${x0Top} ${y(ph)} Z`;
        }
        return `M${x0Top} ${y(dh2)} L${t1} ${y(dh2)} L${t1} ${y(ph)} L${x0Top} ${y(ph)} Z`;
      }),
    );
    if (isStud) {
      // base part with a blind tapped hole; the stud metal end is screwed in (ISO 6410: the
      // external thread hides the internal one). Drill point 118° below the thread.
      const D1h = (d - 1.082532 * P) / 2;
      const depth = bm + 2 * P;
      const W = depth + 0.6 * d;
      const tipL = D1h / Math.tan((59 * Math.PI) / 180);
      parts.push(
        plate(-W, W, -45, 'pb', (sg) => {
          const y = (v: number) => sg * v;
          return `M${-W} ${y(ph)} L0 ${y(ph)} L0 ${y(D1h)} L${-depth} ${y(D1h)} L${-depth - tipL} 0 L${-W} 0 Z`;
        }),
      );
      parts.push(
        plate(0, lk, 45, 'pc', (sg) => {
          const y = (v: number) => sg * v;
          return `M0 ${y(dh2)} L${lk} ${y(dh2)} L${lk} ${y(ph)} L0 ${y(ph)} Z`;
        }),
      );
    } else {
      parts.push(
        plate(t1, lk - t1, -45, 'pb', (sg) => {
          const y = (v: number) => sg * v;
          return `M${t1} ${y(dh2)} L${lk} ${y(dh2)} L${lk} ${y(ph)} L${t1} ${y(ph)} Z`;
        }),
      );
    }
  }

  /* ---------------- shank + thread (fasteners are never sectioned) ---------------- */
  const leftCh = isStud || isSet ? cTip : 0;
  const shankStart = isCarriage ? head.f ?? 0.5 * d : 0;
  parts.push(
    <g key={K()}>
      <path
        d={`M${xL + leftCh} ${-R} L${xTip - cTip} ${-R} L${xTip} ${-R + cTip} L${xTip} ${R - cTip} L${xTip - cTip} ${R} L${xL + leftCh} ${R} ${leftCh ? `L${xL} ${R - leftCh} L${xL} ${-R + leftCh}` : ''} Z`}
        fill={C.part} stroke={C.outline} strokeWidth={k.thick} strokeLinejoin="round"
      />
      {/* ISO 6410-1: thread root = thin continuous line, thread end = thick line */}
      <line x1={Math.max(xThr, xL + leftCh)} y1={-r3} x2={xTip - cTip * 0.2} y2={-r3} stroke={C.outline} strokeWidth={k.thin} />
      <line x1={Math.max(xThr, xL + leftCh)} y1={r3} x2={xTip - cTip * 0.2} y2={r3} stroke={C.outline} strokeWidth={k.thin} />
      {xThr > xL + 0.05 && !isSet && (
        <g stroke={C.outline}>
          <line x1={xThr} y1={-R} x2={xThr} y2={R} strokeWidth={k.thick} />
          {/* thread run-out, thin, 30° to the axis */}
          <line x1={xThr} y1={-r3} x2={Math.max(xL, xThr - (R - r3) * SQ3)} y2={-R} strokeWidth={k.thin} />
          <line x1={xThr} y1={r3} x2={Math.max(xL, xThr - (R - r3) * SQ3)} y2={R} strokeWidth={k.thin} />
        </g>
      )}
      {isStud && (
        <g stroke={C.outline}>
          <line x1={xL + leftCh} y1={-r3} x2={0} y2={-r3} strokeWidth={k.thin} />
          <line x1={xL + leftCh} y1={r3} x2={0} y2={r3} strokeWidth={k.thin} />
          <line x1={0} y1={-R} x2={0} y2={R} strokeWidth={k.thick} />
        </g>
      )}
      {fillet > 0 && (
        <g fill="none" stroke={C.outline} strokeWidth={k.thin}>
          <path d={`M${shankStart} ${-R - fillet} Q${shankStart} ${-R} ${shankStart + fillet} ${-R}`} />
          <path d={`M${shankStart} ${R + fillet} Q${shankStart} ${R} ${shankStart + fillet} ${R}`} />
        </g>
      )}
      {isSet && setScrewEnds(m, k, xTip, cTip)}
    </g>,
  );

  /* ---------------- head side view ---------------- */
  if (!headless) parts.push(<g key={K()}>{headSide(m, k)}</g>);

  /* ---------------- nut (joint) ---------------- */
  if (joint) parts.push(<g key={K()}>{nutSide(nutX, nutM, nutE, k)}</g>);

  /* ---------------- bearing annuli (joint) ---------------- */
  if (joint && !isCsk && !isStud) {
    const band = k.fs * 0.32;
    const strip = (x: number, outer: number, toRight: boolean, kk: string) => {
      const o = Math.min(outer, 2 * plateHalf) / 2, i = m.dh / 2;
      if (o <= i) return null;
      const xx = toRight ? x : x - band;
      return (
        <g key={kk} fill={C.warn} opacity={0.9}>
          <rect x={xx} y={-o} width={band} height={o - i} />
          <rect x={xx} y={i} width={band} height={o - i} />
        </g>
      );
    };
    parts.push(strip(0, dw, true, 'bh'));
    if (gap < 0.01) parts.push(strip(lk, dwNut, false, 'bn'));
  }

  /* ---------------- centre line ---------------- */
  const leftmost = joint && isStud ? -(bm + 2 * P + 0.6 * d) : headLeft;
  const rightmost = Math.max(xTip, joint ? nutX + nutM : xTip);
  parts.push(<CenterLine key={K()} k={k} x1={leftmost - k.fs * 1.2} y1={0} x2={rightmost + k.fs * 1.2} y2={0} />);

  /* ---------------- dimensions ---------------- */
  const halfH = Math.max(headHalf, R, joint ? plateHalf : 0);
  const leaderZone = k.fs * 3.4;
  const env = Math.max(halfH, R + leaderZone);
  const up1 = -(env + k.fs * 1.6), up2 = up1 - k.fs * 2.2;
  const dn1 = env + k.fs * 1.9;
  const dn2 = dn1 + k.fs * 2.2;
  const dims: React.ReactNode[] = [];
  let usedUp2 = false;
  const topHead = -headHalf;

  if (!joint) {
    if (isStud) {
      dims.push(<HDim key="bm" k={k} x1={xL} x2={0} yA={-R} yd={up1} text={`bm ${f(bm)}`} />);
      dims.push(<HDim key="L" k={k} x1={0} x2={xTip} yA={-R} yd={up1} text={`L ${f(m.L)}`} color={hi('L')} />);
    } else if (isSet) {
      dims.push(<HDim key="L" k={k} x1={0} x2={xTip} yA={-R} yd={up1} text={`L ${f(m.L)}`} color={hi('L')} />);
    } else if (isCsk) {
      dims.push(<HDim key="L" k={k} x1={-hk} x2={xTip} yA={topHead} yB={-R} yd={up1} text={`L ${f(m.L)}`} color={hi('L')} />);
      dims.push(<HDim key="k" k={k} x1={-hk} x2={0} yA={topHead} yB={-R} yd={up2} text={`k ${f(hk)}`} outside="left" />);
      usedUp2 = true;
    } else if (isEye) {
      dims.push(<HDim key="h" k={k} x1={headLeft} x2={0} yA={topHead} yd={up1} text={`h ${f(-headLeft)}`} />);
      dims.push(<HDim key="L" k={k} x1={0} x2={xTip} yA={-R} yd={up1} text={`L ${f(m.L)}`} color={hi('L')} />);
    } else {
      dims.push(<HDim key="k" k={k} x1={-hk} x2={0} yA={topHead} yd={up1} text={`k ${f(hk)}`} outside="left" />);
      dims.push(<HDim key="L" k={k} x1={0} x2={xTip} yA={topHead} yB={-R} yd={up1} text={`L ${f(m.L)}`} color={hi('L')} />);
    }
    if (!isSet) {
      if (xThr > 0.05) dims.push(<HDim key="ls" k={k} x1={isCsk ? 0 : 0} x2={xThr} yA={R} yd={dn1} text={`ls ${f(xThr)}`} />);
      dims.push(<HDim key="b" k={k} x1={xThr} x2={xTip} yA={R} yd={dn1} text={`b ${f(b)}`} color={hi('b')} />);
    }
    const xt = Math.max(xThr, 0) + (xTip - Math.max(xThr, 0)) * 0.42;
    dims.push(<Leader key="thr" k={k} x={xt} y={-R} tx={xt + k.fs * 1.8} ty={-R - k.fs * 2.6} text={m.threadCallout} />);
    if (xThr > k.fs * 3 && !isSet) {
      const xs = Math.max(xThr * 0.5, fillet + k.fs * 0.8, shankStart + k.fs);
      dims.push(<Leader key="ds" k={k} x={xs} y={R} tx={xs + k.fs * 1.6} ty={R + k.fs * 2.6} text={`Ø${f(d)}`} />);
    }
    dims.push(<Leader key="ch" k={k} x={xTip - cTip / 2} y={R - cTip / 2} tx={xTip + k.fs * 1.2} ty={R + k.fs * 2.6} text={`${f(cTip, 1)}×45°`} />);
  } else {
    const lkStart = isCsk ? -hk : 0;
    dims.push(<HDim key="lk" k={k} x1={lkStart} x2={lk} yA={-plateHalf} yd={up1} text={`lk ${f(lk - lkStart)}`} />);
    dims.push(<HDim key="m" k={k} x1={nutX} x2={nutX + nutM} yA={-nutE / 2} yd={up1} text={`m ${f(nutM)}`} />);
    const over = xTip - (nutX + nutM);
    if (over > 0.05) {
      dims.push(<HDim key="ov" k={k} x1={nutX + nutM} x2={xTip} yA={-nutE / 2} yB={-R} yd={up2} text={f(over)} />);
      usedUp2 = true;
    }
    if (gap > 0.05) {
      dims.push(<HDim key="gap" k={k} x1={lk} x2={nutX} yA={-plateHalf} yB={-nutE / 2} yd={up2} text={`${f(gap, 1)}`} color={C.warn} />);
      usedUp2 = true;
    }
    const dnL = m.pM !== undefined && !isStud ? dn2 : dn1;
    if (isStud) {
      dims.push(<HDim key="L" k={k} x1={0} x2={xTip} yA={R} yd={dnL} text={`L ${f(m.L)}`} color={hi('L')} />);
    } else {
      dims.push(<HDim key="L" k={k} x1={isCsk ? -hk : 0} x2={xTip} yA={isCsk ? plateHalf : headHalf} yB={R} yd={dnL} text={`L ${f(m.L)}`} color={hi('L')} />);
    }
    if (!isCsk && !isStud) {
      const tx = headLeft - k.fs * 1.2;
      dims.push(<Leader key="dw" k={k} x={k.fs * 0.2} y={-Math.min(dw, 2 * plateHalf) / 2} tx={tx} ty={up1 + k.fs * 0.4} text={`Ødw ${f(dw)}`} dot />);
    }
    // Ødh label sits inside the hatched plate (the text halo keeps it legible)
    {
      const xh = isStud ? lk * 0.25 : lk * 0.22;
      const yTxt = -(m.dh / 2 + (plateHalf - m.dh / 2) * 0.55);
      dims.push(<Leader key="dh" k={k} x={xh} y={-m.dh / 2} tx={xh + k.fs * 1.2} ty={yTxt} text={`Ødh ${f(m.dh)}`} dot />);
    }
    if (m.FM_kN) {
      const x0 = (isStud ? leftmost : headLeft) - k.fs * 0.3;
      dims.push(
        <g key="fm">
          <line x1={x0 - k.fs * 3} y1={0} x2={x0 - k.fs * 0.9} y2={0} stroke={C.ok} strokeWidth={k.thick} />
          <path d={`M${x0} 0 l${-k.fs} ${-k.fs * 0.4} l0 ${k.fs * 0.8}Z`} fill={C.ok} />
          <Txt k={k} x={x0 - k.fs * 2} y={-k.fs * 0.55} color={C.ok}>FM</Txt>
          <Txt k={k} x={x0 - k.fs * 2} y={k.fs * 1.45} color={C.ok} size={0.85}>{`${f(m.FM_kN, 1)} kN`}</Txt>
        </g>,
      );
    }
    if (m.pM !== undefined && !isStud) {
      const over100 = m.pG !== undefined && m.pM > m.pG;
      const col = over100 ? C.bad : C.warn;
      const y = isCsk ? (head.dk ?? 2 * d) / 4 + m.dh / 4 : (m.dh / 2 + Math.min(dw, 2 * plateHalf) / 2) / 2;
      dims.push(
        <Leader key="pm" k={k} x={isCsk ? -hk / 2 : k.fs * 0.15} y={y} tx={Math.max(lk * 0.35, k.fs * 2)} ty={dn1}
          text={`pM ${f(m.pM, 0)}${m.pG ? ` / pG ${f(m.pG, 0)}` : ''} MPa`} color={col} textColor={col} dot />,
      );
    }
  }

  /* ---------------- bounding box of the side view ---------------- */
  const leftExtra = joint
    ? Math.max(
        m.FM_kN ? k.fs * 3.6 : 0,
        !isCsk && !isStud ? k.fs * 1.4 + textW(`Ødw ${f(dw)}`, k.fs) : 0,
      )
    : 0;
  const kTextLeft = !joint && !headless && !isEye && hk < 2 * k.arrow + textW(`k ${f(hk)}`, k.fs) + k.fs * 0.8
    ? textW(`k ${f(hk)}`, k.fs) + k.arrow * 2 : 0;
  const partBox: Box = {
    x0: leftmost - k.fs * 1.4 - Math.max(leftExtra, kTextLeft),
    x1: rightmost + k.fs * 1.5 + (joint ? 0 : textW(`${f(cTip, 1)}×45°`, k.fs) + k.fs * 1.5),
    y0: (usedUp2 ? up2 : up1) - k.fs * 1.4,
    y1: (joint && m.pM !== undefined && !isStud ? dn2 : dn1) + k.fs * 1.2,
  };
  if (!joint) {
    const xt = Math.max(xThr, 0) + (xTip - Math.max(xThr, 0)) * 0.42 + k.fs * 1.8 + textW(m.threadCallout, k.fs) + k.fs * 0.6;
    partBox.x1 = Math.max(partBox.x1, xt);
  }

  /* ---------------- end view (part mode) ---------------- */
  let endView: React.ReactNode = null;
  let box = { ...partBox };
  if (!joint) {
    const ev = endViewNode(m, k);
    let cx: number, cy: number;
    if (!narrow) {
      cx = partBox.x1 + k.fs * 2 + ev.w / 2 + ev.leftPad;
      cy = 0;
      box = { ...partBox, x1: cx + ev.w / 2 + ev.rightPad, y0: Math.min(partBox.y0, -ev.h / 2 - ev.topPad), y1: Math.max(partBox.y1, ev.h / 2 + ev.bottomPad) };
    } else {
      cx = (partBox.x0 + partBox.x1) / 2;
      cy = partBox.y1 + k.fs * 1.5 + ev.h / 2 + ev.topPad;
      box = {
        ...partBox,
        x0: Math.min(partBox.x0, cx - ev.w / 2 - ev.leftPad),
        x1: Math.max(partBox.x1, cx + ev.w / 2 + ev.rightPad),
        y1: cy + ev.h / 2 + ev.bottomPad,
      };
    }
    endView = <g transform={`translate(${cx} ${cy})`}>{ev.node}</g>;
  }

  /* ---------------- title strip ---------------- */
  const right = joint ? opt.labels?.section ?? 'Section · VDI 2230' : opt.labels?.scale ?? '1:1 mm · ISO 128 · ISO 6410';
  const notes = m.notes ?? '';
  const titleW = Math.max(
    textW(m.designation, k.fs) + textW(right, k.fs * 0.85) + k.fs * 2,
    textW(notes, k.fs * 0.85) + k.fs,
  );
  if (box.x1 - box.x0 < titleW) box.x1 = box.x0 + titleW;
  const ty = box.y1 + k.fs * 1.6;
  const title = (
    <g>
      <line x1={box.x0} y1={ty - k.fs * 1.2} x2={box.x1} y2={ty - k.fs * 1.2} stroke={C.thin} strokeWidth={k.thin} />
      <Txt k={k} x={box.x0} y={ty + k.fs * 0.2} anchor="start" weight={700}>{m.designation}</Txt>
      {notes && <Txt k={k} x={box.x0} y={ty + k.fs * 1.55} anchor="start" color={C.thin} size={0.85}>{notes}</Txt>}
      <Txt k={k} x={box.x1} y={ty + k.fs * 0.2} anchor="end" color={C.thin} size={0.85}>{right}</Txt>
    </g>
  );
  box = { ...box, y1: ty + k.fs * (notes ? 2.1 : 0.8) };

  const info = {
    lk, gap, gapMax, nutX, xTip, seated: gap < 0.01,
    detached: gap > gapMax + 0.01,
  };
  return {
    box,
    kit: k,
    info,
    body: (
      <g>
        {parts}
        {dims}
        {endView}
        {title}
      </g>
    ),
  };
}

/* ------------------------------------------------------------------------------------------ */

const f = (v: number, n = 2) => (Number.isFinite(v) ? String(parseFloat(v.toFixed(n))) : '–');

function nutSide(x: number, m: number, e: number, k: Kit) {
  const e2 = e / 2;
  const ch = Math.min(m * 0.12, e2 * 0.12);
  const faces: [number, number][] = [[-e2, -e2 / 2], [-e2 / 2, e2 / 2], [e2 / 2, e2]];
  return (
    <g>
      <rect x={x} y={-e2} width={m} height={2 * e2} fill={C.part} stroke={C.outline} strokeWidth={k.thick} />
      <line x1={x} y1={-e2 / 2} x2={x + m} y2={-e2 / 2} stroke={C.outline} strokeWidth={k.thick} />
      <line x1={x} y1={e2 / 2} x2={x + m} y2={e2 / 2} stroke={C.outline} strokeWidth={k.thick} />
      {faces.map(([a, b], i) => (
        <g key={i} fill="none" stroke={C.outline} strokeWidth={k.thin}>
          <path d={`M${x + m - ch} ${a} Q${x + m + ch * 0.15} ${(a + b) / 2} ${x + m - ch} ${b}`} />
          <path d={`M${x + ch} ${a} Q${x - ch * 0.15} ${(a + b) / 2} ${x + ch} ${b}`} />
        </g>
      ))}
    </g>
  );
}

function hiddenSocket(x0: number, depth: number, s: number, k: Kit) {
  const h = s / SQ3; // corner half-height of the hex socket, seen across corners
  return (
    <path
      d={`M${x0} ${-h} L${x0 + depth} ${-h} L${x0 + depth + h * 0.58} 0 L${x0 + depth} ${h} L${x0} ${h}`}
      fill="none" stroke={C.outline} strokeWidth={k.thin} strokeDasharray={`${k.fs * 0.6} ${k.fs * 0.35}`}
    />
  );
}

function headSide(m: BoltDrawingModel, k: Kit): React.ReactNode {
  const { d, head, boltType } = m;
  const R = d / 2;
  const out = { fill: C.part, stroke: C.outline, strokeWidth: k.thick, strokeLinejoin: 'round' as const };
  const kk = head.k;
  switch (boltType) {
    case 'hex_bolt':
    case 'heavy_hex':
    case 'flange_hex': {
      const s = head.s ?? 1.5 * d;
      const e2 = hexAcrossCorners(s) / 2;
      const c = boltType === 'flange_hex' ? Math.min(head.c ?? 0.15 * d, kk * 0.4) : 0;
      const x0 = -kk, x1 = -c;
      const ch = Math.min(kk * 0.14, e2 * 0.12);
      const faces: [number, number][] = [[-e2, -e2 / 2], [-e2 / 2, e2 / 2], [e2 / 2, e2]];
      const dc2 = (head.dc ?? 2.2 * d) / 2;
      return (
        <g>
          {boltType === 'flange_hex' && (
            <path d={`M${-c} ${-dc2 * 0.94} L${-c * 0.35} ${-dc2} L0 ${-dc2} L0 ${dc2} L${-c * 0.35} ${dc2} L${-c} ${dc2 * 0.94} Z`} {...out} />
          )}
          <path d={`M${x1} ${-e2} L${x0 + ch} ${-e2} L${x0} ${-e2 + ch} L${x0} ${e2 - ch} L${x0 + ch} ${e2} L${x1} ${e2} Z`} {...out} />
          <line x1={x0 + ch} y1={-e2 / 2} x2={x1} y2={-e2 / 2} stroke={C.outline} strokeWidth={k.thick} />
          <line x1={x0 + ch} y1={e2 / 2} x2={x1} y2={e2 / 2} stroke={C.outline} strokeWidth={k.thick} />
          {faces.map(([a, b], i) => (
            <path key={i} d={`M${x0 + ch} ${a} Q${x0 - ch * 0.15} ${(a + b) / 2} ${x0 + ch} ${b}`} fill="none" stroke={C.outline} strokeWidth={k.thin} />
          ))}
        </g>
      );
    }
    case 'socket_cap':
    case 'low_head_socket': {
      const dk2 = (head.dk ?? 1.5 * d) / 2, ch = kk * 0.08;
      return (
        <g>
          <path d={`M0 ${-dk2} L${-kk + ch} ${-dk2} L${-kk} ${-dk2 + ch} L${-kk} ${dk2 - ch} L${-kk + ch} ${dk2} L0 ${dk2} Z`} {...out} />
          {hiddenSocket(-kk, head.t ?? 0.5 * kk, head.s ?? 0.8 * d, k)}
        </g>
      );
    }
    case 'countersunk': {
      const dk2 = (head.dk ?? 2 * d) / 2;
      const cone = Math.max(0, dk2 - R); // 90° head: axial cone length = radial step
      const rim = Math.max(0, kk - cone);
      return (
        <g>
          <path d={`M0 ${-R} L${-cone} ${-dk2} L${-kk} ${-dk2} L${-kk} ${dk2} L${-cone} ${dk2} L0 ${R} Z`} {...out} />
          {rim > 0.05 && <line x1={-cone} y1={-dk2} x2={-cone} y2={dk2} stroke={C.outline} strokeWidth={k.thin} />}
          {hiddenSocket(-kk, head.t ?? 0.5 * kk, head.s ?? 0.6 * d, k)}
        </g>
      );
    }
    case 'button_head':
    case 'carriage_bolt': {
      const dk2 = (head.dk ?? 1.75 * d) / 2;
      const flat = kk * 0.12;
      const neck = boltType === 'carriage_bolt' ? (
        <g>
          <rect x={0} y={-(head.v ?? d) / 2} width={head.f ?? 0.5 * d} height={head.v ?? d} {...out} />
          <line x1={0} y1={-R} x2={head.f ?? 0.5 * d} y2={-R} stroke={C.outline} strokeWidth={k.thin} />
          <line x1={0} y1={R} x2={head.f ?? 0.5 * d} y2={R} stroke={C.outline} strokeWidth={k.thin} />
        </g>
      ) : null;
      return (
        <g>
          <path d={`M0 ${-dk2} L${-flat} ${-dk2} A ${kk - flat} ${dk2} 0 0 0 ${-flat} ${dk2} L0 ${dk2} Z`} {...out} />
          {boltType === 'button_head' && hiddenSocket(-kk, head.t ?? 0.36 * d, head.s ?? 0.6 * d, k)}
          {neck}
        </g>
      );
    }
    case 'eye_bolt': {
      const h = head.eyeH ?? 4.4 * d;
      const W = (head.eyeD3 ?? 4.5 * d) / 2;          // half width of the eye (perpendicular)
      const wIn = (head.eyeD2 ?? 2.5 * d) / 2;         // half width of the opening
      const wall = Math.max(0.1 * d, W - wIn);
      const collar = Math.max(0.35 * d, 0.45 * d);
      const d4 = (head.eyeD4 ?? 2.5 * d) / 2;
      const ax0 = -h, ax1 = -collar;                   // axial extent of the ring
      const cx = (ax0 + ax1) / 2, rx = (ax1 - ax0) / 2;
      return (
        <g>
          <rect x={-collar} y={-d4} width={collar} height={2 * d4} {...out} />
          <path
            fillRule="evenodd"
            d={`M${cx - rx} 0 A${rx} ${W} 0 1 0 ${cx + rx} 0 A${rx} ${W} 0 1 0 ${cx - rx} 0 Z
                M${cx - rx + wall} 0 A${Math.max(0.1, rx - wall)} ${wIn} 0 1 1 ${cx + rx - wall} 0 A${Math.max(0.1, rx - wall)} ${wIn} 0 1 1 ${cx - rx + wall} 0 Z`}
            {...out}
          />
        </g>
      );
    }
    default:
      return null;
  }
}

function setScrewEnds(m: BoltDrawingModel, k: Kit, xTip: number, c: number) {
  const dp2 = (m.head.dp ?? 0.6 * m.d) / 2;
  const cup = Math.min((m.d - 2 * dp2) / 2, m.d * 0.25);
  return (
    <g>
      {hiddenSocket(0, m.head.t ?? 0.4 * m.d, m.head.s ?? 0.5 * m.d, k)}
      {/* cup point: chamfer down to dp, concave cup shown as a thin arc */}
      <path d={`M${xTip - c} ${-m.d / 2} L${xTip} ${-dp2} M${xTip - c} ${m.d / 2} L${xTip} ${dp2}`} stroke={C.outline} strokeWidth={k.thin} fill="none" />
      <path d={`M${xTip} ${-dp2} Q${xTip - cup} 0 ${xTip} ${dp2}`} stroke={C.outline} strokeWidth={k.thin} fill="none" />
    </g>
  );
}

/* end view, looking at the head top */
function endViewNode(m: BoltDrawingModel, k: Kit) {
  const { d, head, boltType, grade } = m;
  const parts: React.ReactNode[] = [];
  const out = { fill: C.part, stroke: C.outline, strokeWidth: k.thick };
  let w = d, h = d;
  let leftPad = k.fs, rightPad = k.fs, topPad = k.fs, bottomPad = k.fs;
  const dimRow = (half: number) => half + k.fs * 2.2;

  if (boltType === 'hex_bolt' || boltType === 'heavy_hex' || boltType === 'flange_hex') {
    const s = head.s ?? 1.5 * d, e = hexAcrossCorners(s);
    const outer = boltType === 'flange_hex' ? Math.max(head.dc ?? 0, e) : e;
    if (boltType === 'flange_hex') parts.push(<circle key="fl" cx={0} cy={0} r={outer / 2} {...out} />);
    parts.push(<polygon key="hex" points={regularHexPoints(0, 0, s, true)} {...out} />);
    parts.push(<circle key="chc" cx={0} cy={0} r={s * 0.475} fill="none" stroke={C.outline} strokeWidth={k.thin} />);
    if (head.dw && boltType !== 'flange_hex') {
      parts.push(<circle key="dw" cx={0} cy={0} r={head.dw / 2} fill="none" stroke={C.thin} strokeWidth={k.thin} strokeDasharray={`${k.fs * 0.6} ${k.fs * 0.35}`} />);
    }
    const yd = dimRow(outer / 2);
    parts.push(<HDim key="s" k={k} x1={-s / 2} x2={s / 2} yA={0} yd={yd} text={`s ${f(s)}`} />);
    const xd = outer / 2 + k.fs * 1.8;
    const eTxt = `e ${f(head.e ?? e)}`;
    parts.push(<VDim key="e" k={k} y1={-e / 2} y2={e / 2} xA={0} xd={xd} text={eTxt} />);
    w = outer; h = outer;
    rightPad = k.fs * 2.4 + textW(eTxt, k.fs);
    bottomPad = k.fs * 3.2;
    if (boltType === 'flange_hex' && head.dc) {
      const t = `Ødc ${f(head.dc)}`;
      parts.push(<Leader key="dc" k={k} x={-(head.dc / 2) * 0.707} y={-(head.dc / 2) * 0.707} tx={-head.dc / 2 - k.fs} ty={-head.dc / 2 - k.fs * 0.8} text={t} />);
      leftPad += textW(t, k.fs);
      topPad = k.fs * 2;
    }
  } else if (boltType === 'stud_bolt' || boltType === 'set_screw') {
    // ISO 6410-1 end view of an external thread: major Ø thick circle, root Ø thin ¾ circle
    parts.push(<circle key="c" cx={0} cy={0} r={d / 2} {...out} />);
    parts.push(<path key="r" d={arc(m.d3 / 2, 0, 270)} fill="none" stroke={C.outline} strokeWidth={k.thin} />);
    if (boltType === 'set_screw' && head.s) parts.push(<polygon key="sk" points={regularHexPoints(0, 0, head.s, false)} fill={C.bg} stroke={C.outline} strokeWidth={k.thick} />);
    const yd = dimRow(d / 2);
    parts.push(<HDim key="d" k={k} x1={-d / 2} x2={d / 2} yA={0} yd={yd} text={`Ø${f(d)}`} />);
    bottomPad = k.fs * 3.2;
  } else if (boltType === 'eye_bolt') {
    const d4 = head.eyeD4 ?? 2.5 * d;
    parts.push(<circle key="c" cx={0} cy={0} r={d4 / 2} {...out} />);
    parts.push(<HDim key="d4" k={k} x1={-d4 / 2} x2={d4 / 2} yA={0} yd={dimRow(d4 / 2)} text={`Ød4 ${f(d4)}`} />);
    w = h = d4;
    bottomPad = k.fs * 3.2;
  } else {
    const dk = head.dk ?? 1.5 * d;
    parts.push(<circle key="c" cx={0} cy={0} r={dk / 2} {...out} />);
    if (boltType === 'carriage_bolt') {
      // dome top: no socket
    } else {
      parts.push(<polygon key="sk" points={regularHexPoints(0, 0, head.s ?? 0.8 * d, false)} fill={C.bg} stroke={C.outline} strokeWidth={k.thick} />);
    }
    parts.push(<HDim key="dk" k={k} x1={-dk / 2} x2={dk / 2} yA={0} yd={dimRow(dk / 2)} text={`dk ${f(dk)}`} />);
    if (head.s && boltType !== 'carriage_bolt') {
      const t = `s ${f(head.s)}`;
      parts.push(<Leader key="s" k={k} x={head.s / 2} y={0} tx={dk / 2 + k.fs * 0.8} ty={-dk / 2 - k.fs * 0.2} text={t} />);
      rightPad = k.fs * 1.4 + textW(t, k.fs);
      topPad = k.fs * 1.8;
    }
    w = h = dk;
    bottomPad = k.fs * 3.2;
  }
  if (grade && (boltType === 'hex_bolt' || boltType === 'heavy_hex' || boltType === 'flange_hex')) {
    parts.push(<Txt key="g" k={k} x={0} y={0} baseline="central" color={C.thin} size={0.85}>{grade}</Txt>);
  }
  parts.push(<CenterLine key="c1" k={k} x1={-w / 2 - k.fs} y1={0} x2={w / 2 + k.fs} y2={0} />);
  parts.push(<CenterLine key="c2" k={k} x1={0} y1={-h / 2 - k.fs} x2={0} y2={h / 2 + k.fs} />);
  return { node: <g>{parts}</g>, w, h, leftPad, rightPad, topPad, bottomPad };
}

function arc(r: number, a0: number, a1: number) {
  const p = (a: number) => [r * Math.cos((a * Math.PI) / 180), r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}
