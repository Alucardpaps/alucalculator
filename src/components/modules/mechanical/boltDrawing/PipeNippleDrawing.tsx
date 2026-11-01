'use client';
/**
 * Pipe-thread hex nipple — production drawing (ISO 128 / ISO 6410-1).
 *
 * Upper half in section, lower half in view; optional female coupling in full
 * section. Taper threads (NPT / NPTF / BSPT) are drawn with the real 1:16 cone,
 * gauge planes E0 / E1 (L1) / L2 and the hand-tight → wrench make-up motion.
 * Parallel threads (BSPP / NPSM) get the DIN 3852-2 undercut / seal face.
 *
 * Every length is in mm; text height `fs` is solved so text keeps a constant
 * on-screen size (same approach as ThreadDrawings).
 */
import React, { useMemo } from 'react';
import { C, HDim, HatchRect, Kit, Leader, Txt, VDim, CenterLine, makeKit, textW, useContainerWidth } from './drawingKit';

export type PipeKind = 'npt' | 'nptf' | 'bspt' | 'bspp' | 'npsm';

export interface PipeGeom {
  kind: PipeKind;
  size: string;
  P: number;
  tpi: number;
  /** thread length measured from the free end (L4 / useful thread) */
  Lt: number;
  /** hand-tight / gauge length (NPT L1, ISO 7-1 gauge length) */
  L1?: number;
  /** wrench make-up length (NPT L2) */
  L2?: number;
  /** pitch Ø at the small end (NPT E0) */
  E0?: number;
  /** pitch Ø at the gauge plane (NPT E1) */
  E1?: number;
  /** thread depth (radial) */
  h: number;
  /** major Ø at the small (free) end */
  dTip: number;
  /** body / pipe OD */
  od: number;
  /** hex across flats */
  s: number;
  tapDrill: number;
  undercut?: { d: number; w: number };
  spotface?: number;
  taper: number; // on diameter, 1/16 or 0
}

export interface PipeLabels {
  section: string; view: string; coupling: string; gauge: string; wrench: string; thread: string;
  taper: string; bore: string; hex: string; undercut: string; seal: string; title: string; handTight: string;
}

interface Props {
  g: PipeGeom;
  callout: string;
  standard: string;
  showPort: boolean;
  /** make-up turns from hand-tight (+ = tighten) */
  turns: number;
  labels: PipeLabels;
  svgRef?: React.Ref<SVGSVGElement>;
}

interface Box { x0: number; y0: number; x1: number; y1: number }
const f2 = (v: number) => (Number.isFinite(v) ? String(parseFloat(v.toFixed(2))) : '–');
const f3 = (v: number) => (Number.isFinite(v) ? v.toFixed(3) : '–');

export function PipeNippleDrawing(props: Props) {
  const { ref, width } = useContainerWidth(760);
  const out = useMemo(() => {
    const fontPx = width < 560 ? 11 : 12;
    const W = Math.max(300, width - 4);
    let fs = props.g.od * 0.05;
    let r = build(props, makeKit(fs));
    for (let i = 0; i < 5; i++) {
      const next = (fontPx * (r.box.x1 - r.box.x0)) / W;
      if (Math.abs(next - fs) / fs < 0.015) break;
      fs = next;
      r = build(props, makeKit(fs));
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
        aria-label={`${props.callout} — ${props.labels.title}`}
        data-unit="mm"
      >
        {out.body}
      </svg>
    </div>
  );
}

function build(p: Props, k: Kit) {
  const { g, labels: T } = p;
  const uid = `pn${Math.round(g.od * 100)}${g.kind}`;
  const id = (s: string) => `${uid}-${s}`;
  const t = g.taper;
  const parts: React.ReactNode[] = [];

  // ── axial layout: hex [−kh,0], body [0,Lb], free end at Lb
  const e = g.s / Math.cos(Math.PI / 6);
  const kh = Math.max(0.42 * g.s, 6);
  const neck = g.undercut ? g.undercut.w : Math.max(1.5 * g.P, 0.12 * g.od);
  const Lb = g.Lt + neck;
  const xT = Lb;
  const u = (x: number) => xT - x; // distance from the free end
  const rMaj = (x: number) => Math.min(g.od / 2, g.dTip / 2 + (t * u(x)) / 2);
  const rMin = (x: number) => rMaj(x) - g.h;
  const xThreadEnd = xT - g.Lt;
  const rBore = Math.max(g.dTip / 2 - g.h - Math.max(1.2, 0.09 * g.od), g.od * 0.25);
  const ch = Math.min(g.h * 1.1, g.P); // 45° end chamfer down to ~minor Ø
  const R = e / 2;
  const cop = p.showPort;

  // where major line meets body OD (vanish cone for taper)
  const xVan = t > 0 ? Math.max(xThreadEnd, xT - ((g.od - g.dTip) / t)) : xThreadEnd;

  // ── coupling (female) geometry
  const handTightFromTip = g.L1 ?? Math.max(g.Lt - 2 * g.P, g.Lt * 0.7);
  const engaged = Math.max(handTightFromTip * 0.4, Math.min(g.Lt, handTightFromTip + p.turns * g.P));
  const xc = xT - Math.min(engaged, g.Lt + neck * 0.5); // coupling face
  const Lc = Math.max(2 * g.Lt, g.Lt + 3 * g.P) * 1.05;
  const xc1 = xc + Lc;
  const rCo = Math.max(g.od / 2 * 1.22, g.od / 2 + 3);
  // female thread: same cone, matched at the gauge plane (hand-tight) and shifted with make-up
  const rFemMaj = (x: number) => g.dTip / 2 + (t * u(x)) / 2; // female cone = male cone (flank contact)
  const rFemMin = (x: number) => rFemMaj(x) - g.h;

  // ── part outline, upper half (section) and lower half (view) use the same contour
  const N = 2;
  const contour = (sgn: number) => {
    const pts: [number, number][] = [];
    pts.push([0, g.od / 2]);
    if (g.undercut) {
      pts.push([0, g.undercut.d / 2], [g.undercut.w, g.undercut.d / 2], [g.undercut.w, rMaj(g.undercut.w)]);
    } else {
      pts.push([xThreadEnd < xVan ? xVan : xThreadEnd, g.od / 2]);
    }
    const xs = Math.max(g.undercut ? g.undercut.w : xVan, xThreadEnd);
    for (let i = 0; i <= N; i++) { const x = xs + ((xT - ch - xs) * i) / N; pts.push([x, rMaj(x)]); }
    pts.push([xT, rMaj(xT) - ch]);
    pts.push([xT, rBore]);
    return pts.map(([x, y]) => [x, sgn * -y] as [number, number]);
  };
  const up = contour(1), dn = contour(-1);
  const path = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(4)} ${y.toFixed(4)}`).join(' ');

  // section region (upper half): contour → bore → back to shoulder
  const secPts: [number, number][] = [[-kh, -R * 0], [-kh, -R], [0, -R], ...up, [xT, -rBore], [-kh, -rBore]];
  const secPath = path(secPts.slice(1)) + 'Z';
  parts.push(
    <g key="sec">
      <clipPath id={id('sec')}><path d={secPath} /></clipPath>
      <path d={secPath} fill={C.part} />
      <g clipPath={`url(#${id('sec')})`}>
        <HatchRect k={k} id={id('h1')} x={-kh} y={-R} w={xT + kh} h={R - rBore} />
      </g>
    </g>,
  );
  // lower half (view) fill
  const viewPath = path([[0, R], ...dn.slice(0), [xT, rBore], [xT, 0], [-kh, 0], [-kh, R]]) + 'Z';
  parts.push(<path key="vf" d={viewPath} fill={C.partLight} />);

  // hex: side view across corners (lower) & section (upper) – facet lines
  parts.push(
    <g key="hex" fill="none" stroke={C.outline} strokeWidth={k.thick} strokeLinejoin="round">
      <path d={`M0 ${-R} L${-kh} ${-R} L${-kh} ${R} L0 ${R}`} />
      <line x1={-kh} y1={R / 2} x2={0} y2={R / 2} strokeWidth={k.thick * 0.8} />
      <line x1={-kh} y1={-0.0001} x2={-kh} y2={0} />
    </g>,
  );
  // outlines
  parts.push(<path key="ou" d={path([[0, -R], ...up])} fill="none" stroke={C.outline} strokeWidth={k.thick} strokeLinejoin="round" />);
  parts.push(<path key="od" d={path([[0, R], ...dn])} fill="none" stroke={C.outline} strokeWidth={k.thick} strokeLinejoin="round" />);
  parts.push(<line key="bt" x1={-kh} y1={-rBore} x2={xT} y2={-rBore} stroke={C.outline} strokeWidth={k.thick} />);
  parts.push(<line key="tipv" x1={xT} y1={-rBore} x2={xT} y2={rBore} stroke={C.outline} strokeWidth={k.thick} />);
  parts.push(<line key="sh" x1={0} y1={-R} x2={0} y2={R} stroke={C.outline} strokeWidth={k.thick} />);
  // hidden bore in the view half
  parts.push(<line key="bh" x1={-kh} y1={rBore} x2={xT} y2={rBore} stroke={C.thin} strokeWidth={k.thin} strokeDasharray={`${k.fs * 0.6} ${k.fs * 0.35}`} />);

  // thread minor lines (thin) both halves + thread end line (thick, view half)
  const xm0 = Math.max(xThreadEnd, g.undercut ? g.undercut.w : 0);
  const xm1 = xT - ch * 0.2;
  for (const sg of [-1, 1]) {
    parts.push(<line key={`mn${sg}`} x1={xm0} y1={sg * rMin(xm0)} x2={xm1} y2={sg * rMin(xm1)} stroke={C.outline} strokeWidth={k.thin * 1.3} />);
  }
  parts.push(<line key="te" x1={xThreadEnd} y1={rMin(xThreadEnd)} x2={xThreadEnd} y2={rMaj(xThreadEnd)} stroke={C.outline} strokeWidth={k.thick} />);

  // centre line
  const xRightPart = cop ? xc1 : xT;
  parts.push(<CenterLine key="cl" k={k} x1={-kh - k.fs} y1={0} x2={xRightPart + k.fs} y2={0} />);

  // ── coupling, full section
  if (cop) {
    for (const sg of [-1, 1]) {
      const inner: [number, number][] = [];
      const steps = 6;
      // inside the engagement the coupling meets the male major line; past the male end it shows its own minor Ø
      for (let i = 0; i <= steps; i++) { const x = xc + ((xT - xc) * i) / steps; inner.push([x, rMaj(x)]); }
      inner.push([xT, rFemMin(xT)]);
      inner.push([xc1, rFemMin(xT)]);
      const poly: [number, number][] = [[xc, rCo], [xc1, rCo], ...inner.slice().reverse()];
      const d = path(poly.map(([x, y]) => [x, sg * -y] as [number, number])) + 'Z';
      const cid = id(`c${sg}`);
      parts.push(
        <g key={`cp${sg}`}>
          <clipPath id={cid}><path d={d} /></clipPath>
          <path d={d} fill={C.part} stroke={C.outline} strokeWidth={k.thick} strokeLinejoin="round" />
          <g clipPath={`url(#${cid})`}>
            <HatchRect k={k} id={id(`ch${sg}`)} angle={-45} x={xc} y={sg > 0 ? -rCo : 0} w={xc1 - xc} h={rCo} pitch={k.fs * 1.15} />
          </g>
          {/* female major Ø past the male end (thin) */}
          <line x1={xT} y1={sg * -rFemMaj(xT)} x2={xc1 - ch} y2={sg * -rFemMaj(xT)} stroke={C.outline} strokeWidth={k.thin * 1.3} />
        </g>,
      );
    }
  }

  // ── gauge planes (taper)
  const planes: { x: number; lab: string; col: string }[] = [];
  if (t > 0) {
    planes.push({ x: xT, lab: g.E0 ? 'E₀' : 'E₀', col: C.muted });
    if (g.L1) planes.push({ x: xT - g.L1, lab: 'E₁', col: C.ok });
    if (g.L2) planes.push({ x: xT - g.L2, lab: 'L₂', col: C.warn });
  }
  const yTopPlane = -Math.max(R, cop ? rCo : g.od / 2) - k.fs * 1.4;
  for (const pl of planes) {
    parts.push(
      <g key={`pl${pl.x}`}>
        <line x1={pl.x} y1={yTopPlane + k.fs * 0.4} x2={pl.x} y2={(cop ? rCo : R) + k.fs * 0.6} stroke={pl.col} strokeWidth={k.thin} strokeDasharray={`${k.fs * 1.4} ${k.fs * 0.35} ${k.fs * 0.3} ${k.fs * 0.35}`} />
      </g>,
    );
  }
  // plane labels without overlap (sorted by x)
  {
    const sorted = planes.slice().sort((a, b) => a.x - b.x);
    let lastEnd = -Infinity;
    let lvl = 0;
    for (const pl of sorted) {
      const w = textW(pl.lab, k.fs * 0.9);
      lvl = pl.x - w / 2 < lastEnd + k.fs * 0.3 ? 1 - lvl : 0; // stagger when crowded
      lastEnd = pl.x + w / 2;
      const y = yTopPlane - lvl * k.fs * 1.05;
      if (lvl) parts.push(<line key={`pk${pl.x}`} x1={pl.x} y1={y + k.fs * 0.15} x2={pl.x} y2={yTopPlane + k.fs * 0.4} stroke={pl.col} strokeWidth={k.thin} />);
      parts.push(<Txt key={`pt${pl.x}`} k={k} x={pl.x} y={y} color={pl.col} size={0.9} weight={700}>{pl.lab}</Txt>);
    }
  }

  // ── dimensions below (lower half)
  const yBase = (cop ? rCo : R);
  let row = 0;
  const yRow = () => yBase + k.fs * (2.2 + 2.1 * row++);
  const yTipFeature = rMaj(xT);
  if (g.L1) parts.push(<HDim key="dL1" k={k} x1={xT - g.L1} x2={xT} yA={yBase} yB={yTipFeature} yd={yRow()} text={`L₁ ${f2(g.L1)}`} color={C.dim} />);
  if (g.L2) parts.push(<HDim key="dL2" k={k} x1={xT - g.L2} x2={xT} yA={yBase} yB={yTipFeature} yd={yRow()} text={`L₂ ${f2(g.L2)}`} />);
  parts.push(<HDim key="dLt" k={k} x1={xThreadEnd} x2={xT} yA={rMaj(xThreadEnd)} yB={yTipFeature} yd={yRow()} text={`${t > 0 ? 'L₄' : 'b'} ${f2(g.Lt)}`} />);
  parts.push(<HDim key="dL" k={k} x1={-kh} x2={xT} yA={R} yB={yTipFeature} yd={yRow()} text={`${f2(Lb + kh)}`} />);
  const yDimBottom = yBase + k.fs * (2.2 + 2.1 * (row - 1));

  // ── Ø dims at the right (free end) – beyond the coupling if shown
  const xR = (cop ? xc1 : xT) + k.fs * 1.4;
  parts.push(<VDim key="dTip" k={k} y1={-rMaj(xT)} y2={rMaj(xT)} xA={xT} xd={xR} text={`Ø${f2(2 * rMaj(xT))}`} />);
  const tipW = textW(`Ø${f2(2 * rMaj(xT))}`, k.fs);
  parts.push(<VDim key="dBore" k={k} y1={-rBore} y2={rBore} xA={xT} xd={xR + tipW + k.fs * 1.6} text={`Ø${f2(2 * rBore)}`} />);
  const xRightDims = xR + tipW + k.fs * 1.6 + textW(`Ø${f2(2 * rBore)}`, k.fs) + k.fs;

  // ── left side: hex e and OD
  const xL = -kh - k.fs * 1.4;
  const eTxt = `e ${f2(e)}`;
  parts.push(<VDim key="dE" k={k} y1={-R} y2={R} xA={-kh} xd={xL} side="left" text={eTxt} />);
  const odTxt = `Ø${f2(g.od)}`;
  const xOD = xL - textW(eTxt, k.fs) - k.fs * 1.8;
  if (!g.undercut) parts.push(<VDim key="dOD" k={k} y1={-g.od / 2} y2={g.od / 2} xA={0} xd={xOD} side="left" text={odTxt} />);
  const xLeftDims = (g.undercut ? xL - textW(eTxt, k.fs) : xOD - textW(odTxt, k.fs)) - k.fs;

  // ── leaders above
  const yLead1 = yTopPlane - k.fs * 2.6;
  const yLead2 = yLead1 - k.fs * 1.9;
  const xMid = xThreadEnd + g.Lt * 0.55;
  parts.push(<Leader key="call" k={k} x={xMid} y={-rMaj(xMid)} tx={xMid + k.fs * 1.5} ty={yLead2} text={p.callout} textColor={C.dimText} />);
  if (t > 0) {
    const xq = xThreadEnd + g.Lt * 0.3;
    parts.push(<Leader key="tp" k={k} x={xq} y={-rMaj(xq)} tx={xq - k.fs * 1.2} ty={yLead2} text={`${T.taper} 1:16 Ø`} color={C.warn} textColor={C.warn} />);
  }
  if (g.undercut) {
    parts.push(<Leader key="uc" k={k} x={g.undercut.w / 2} y={g.undercut.d / 2} tx={-kh * 0.2} ty={yDimBottom + k.fs * 2.2} text={`${T.undercut} Ø${f2(g.undercut.d)} × ${f2(g.undercut.w)}`} />);
  }

  // labels for the halves
  parts.push(<Txt key="lsec" k={k} x={-kh / 2} y={-R - k.fs * 0.5} color={C.thin} size={0.85}>{T.section}</Txt>);
  if (cop) parts.push(<Txt key="lcop" k={k} x={(xc + xc1) / 2 + (xc1 - xT) * 0.25} y={-rCo - k.fs * 0.5} color={C.thin} size={0.85}>{T.coupling}</Txt>);

  // ── data table (right side under the drawing)
  const rowsTxt: [string, string][] = [];
  rowsTxt.push(['P', `${f3(g.P)} (${g.tpi} TPI)`]);
  if (g.E0) rowsTxt.push(['E₀', f3(g.E0)]);
  if (g.E1) rowsTxt.push(['E₁', f3(g.E1)]);
  rowsTxt.push(['h', f3(g.h)]);
  rowsTxt.push([T.bore === '' ? 'tap' : 'tap Ø', f2(g.tapDrill)]);
  rowsTxt.push([T.hex, `s ${f2(g.s)}`]);
  const yTab = (cop ? -rCo : -R);
  const xTab = xRightDims + k.fs * 0.6;
  const colW = Math.max(...rowsTxt.map(([a]) => textW(a, k.fs * 0.9))) + k.fs;
  const tabW = colW + Math.max(...rowsTxt.map(([, b]) => textW(b, k.fs * 0.9))) + k.fs;
  parts.push(
    <g key="tab">
      <rect x={xTab} y={yTab} width={tabW} height={rowsTxt.length * k.fs * 1.45 + k.fs * 0.5} fill="none" stroke={C.thin} strokeWidth={k.thin} />
      {rowsTxt.map(([a, b], i) => (
        <g key={a}>
          <Txt k={k} x={xTab + k.fs * 0.5} y={yTab + k.fs * (1.35 + 1.45 * i)} anchor="start" color={C.thin} size={0.9}>{a}</Txt>
          <Txt k={k} x={xTab + colW + k.fs * 0.3} y={yTab + k.fs * (1.35 + 1.45 * i)} anchor="start" size={0.9}>{b}</Txt>
        </g>
      ))}
    </g>,
  );
  const xMax = xTab + tabW;

  const box: Box = {
    x0: Math.min(xLeftDims, xMid - k.fs * 2),
    y0: Math.min(yLead2 - k.fs * 1.2, yLead1 - k.fs * 1.2),
    x1: Math.max(xMax, xMid + k.fs * 1.5 + textW(p.callout, k.fs) + k.fs),
    y1: Math.max(yDimBottom + k.fs * (g.undercut ? 3 : 1), yTab + rowsTxt.length * k.fs * 1.45 + k.fs),
  };
  // title strip
  const ty = box.y1 + k.fs * 1.5;
  const left = `${p.callout} · ${T.title}`;
  const right = p.standard;
  const needW = textW(left, k.fs) + textW(right, k.fs * 0.85) + k.fs * 2;
  if (box.x1 - box.x0 < needW) box.x1 = box.x0 + needW;
  parts.push(
    <g key="title">
      <line x1={box.x0} y1={ty - k.fs * 1.1} x2={box.x1} y2={ty - k.fs * 1.1} stroke={C.thin} strokeWidth={k.thin} />
      <Txt k={k} x={box.x0} y={ty + k.fs * 0.3} anchor="start" weight={700}>{left}</Txt>
      <Txt k={k} x={box.x1} y={ty + k.fs * 0.3} anchor="end" color={C.thin} size={0.85}>{right}</Txt>
    </g>,
  );
  return { box: { ...box, y1: ty + k.fs * 0.9 }, kit: k, body: <g>{parts}</g> };
}

/** ISO 7-1 gauge lengths (mm) */
const ISO7_GAUGE: Record<string, number> = {
  '1/16': 4.0, '1/8': 4.0, '1/4': 6.0, '3/8': 6.4, '1/2': 8.2, '3/4': 9.5, '1': 10.4, '1-1/4': 12.7, '1-1/2': 12.7, '2': 15.9,
};
export function iso7GaugeLength(size: string, fallbackLt: number) {
  const m = size.replace(/^R[pc]?\s*/i, '').replace(/^G\s*/i, '').trim();
  return ISO7_GAUGE[m] ?? fallbackLt * 0.6;
}

export default PipeNippleDrawing;
