'use client';
/**
 * Small ISO 128 drafting kit for mm-unit SVGs (bolt-torque production drawing).
 *
 * Every size (line weight, arrow, text) derives from `fs` — the text height in
 * drawing millimetres — so the drawing keeps a constant on-screen text size no
 * matter how long the bolt is (see useFontScale). Colours are theme tokens with
 * graphite fallbacks so an exported .svg still renders outside the site.
 */
import React, { useEffect, useRef, useState } from 'react';

export const C = {
  outline: 'var(--ink, #eceff3)',
  thin: 'var(--alu-dim, #949daa)',
  dim: 'var(--cyan, #3cc6e6)',
  dimText: 'var(--ink, #eceff3)',
  muted: 'var(--muted, #6e7783)',
  part: 'var(--bg-3, #1d2228)',
  partLight: 'var(--bg-2, #161a1f)',
  bg: 'var(--bg-1, #111418)',
  warn: 'var(--warn, #e9a83a)',
  ok: 'var(--ok, #34c77b)',
  bad: 'var(--bad, #ef5b5b)',
  std: 'var(--std, #7aa7ff)',
  font: 'var(--font-mono, "JetBrains Mono", ui-monospace, monospace)',
};

export interface Kit {
  fs: number;      // text height (mm)
  thick: number;   // visible outline
  thin: number;    // dim / hatch / root lines
  arrow: number;   // arrowhead length
  gap: number;     // extension line gap from part
  over: number;    // extension line overshoot past dim line
}

export function makeKit(fs: number): Kit {
  return { fs, thick: fs * 0.13, thin: fs * 0.055, arrow: fs * 0.95, gap: fs * 0.35, over: fs * 0.55 };
}

/** rough monospace text width */
export const textW = (s: string, fs: number) => s.length * fs * 0.6;

/** Measures the rendered width so text can keep a constant pixel size. */
export function useContainerWidth(fallback = 760) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => {
      const nw = Math.round(e.contentRect.width);
      if (nw > 0) setW((old) => (Math.abs(old - nw) > 2 ? nw : old));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width: w };
}

const halo = (k: Kit): React.CSSProperties => ({
  paintOrder: 'stroke',
  stroke: C.bg,
  strokeWidth: k.fs * 0.32,
  strokeLinejoin: 'round',
});

export function Txt({
  k, x, y, children, anchor = 'middle', color = C.dimText, size = 1, rotate, weight = 500, baseline = 'auto',
}: {
  k: Kit; x: number; y: number; children: React.ReactNode; anchor?: 'start' | 'middle' | 'end';
  color?: string; size?: number; rotate?: number; weight?: number; baseline?: 'auto' | 'central' | 'hanging';
}) {
  return (
    <text
      x={x} y={y} fill={color} fontSize={k.fs * size} fontFamily={C.font} fontWeight={weight}
      textAnchor={anchor} dominantBaseline={baseline}
      transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
      style={halo(k)}
    >
      {children}
    </text>
  );
}

/** filled arrowhead with its tip at (x,y) pointing in direction (ux,uy) */
export function Arrow({ k, x, y, ux, uy, color = C.dim }: { k: Kit; x: number; y: number; ux: number; uy: number; color?: string }) {
  const L = k.arrow, W = k.arrow * 0.3;
  const bx = x - ux * L, by = y - uy * L;
  const px = -uy * W, py = ux * W;
  return <path d={`M${x} ${y}L${bx + px} ${by + py}L${bx - px} ${by - py}Z`} fill={color} />;
}

/**
 * Horizontal linear dimension between x1 and x2.
 * yA / yB are the feature points the extension lines start from, yd the dim line.
 */
export function HDim({
  k, x1, x2, yA, yB = yA, yd, text, color = C.dim, outside = 'right',
}: { k: Kit; x1: number; x2: number; yA: number; yB?: number; yd: number; text: string; color?: string; outside?: 'left' | 'right' }) {
  const up = yd < Math.min(yA, yB);
  const ext = (x: number, yf: number) => {
    const dir = up ? -1 : 1;
    const y0 = yf + dir * k.gap;
    const y1 = yd + dir * k.over;
    if ((y1 - y0) * dir <= 0) return null;
    return <line x1={x} y1={y0} x2={x} y2={y1} stroke={color} strokeWidth={k.thin} />;
  };
  const span = Math.abs(x2 - x1);
  const tw = textW(text, k.fs);
  const inside = span >= 2 * k.arrow + k.fs * 0.6;
  const textFits = span >= tw + k.fs * 0.8;
  const a = Math.min(x1, x2), b = Math.max(x1, x2);
  return (
    <g>
      {ext(x1, yA)}
      {ext(x2, yB)}
      {inside ? (
        <>
          <line x1={a} y1={yd} x2={b} y2={yd} stroke={color} strokeWidth={k.thin} />
          <Arrow k={k} x={a} y={yd} ux={-1} uy={0} color={color} />
          <Arrow k={k} x={b} y={yd} ux={1} uy={0} color={color} />
        </>
      ) : (
        <>
          <line x1={a - k.arrow * 2} y1={yd} x2={b + k.arrow * 2} y2={yd} stroke={color} strokeWidth={k.thin} />
          <Arrow k={k} x={a} y={yd} ux={1} uy={0} color={color} />
          <Arrow k={k} x={b} y={yd} ux={-1} uy={0} color={color} />
        </>
      )}
      {textFits ? (
        <Txt k={k} x={(a + b) / 2} y={yd - k.fs * 0.35}>{text}</Txt>
      ) : outside === 'left' ? (
        <Txt k={k} x={a - k.arrow * 2 - k.fs * 0.3} y={yd + k.fs * 0.35} anchor="end">{text}</Txt>
      ) : (
        <Txt k={k} x={b + k.arrow * 2 + k.fs * 0.3} y={yd + k.fs * 0.35} anchor="start">{text}</Txt>
      )}
    </g>
  );
}

/** Vertical dimension between y1 and y2 at x = xd; xA/xB are the feature x's. Text horizontal beside the line. */
export function VDim({
  k, y1, y2, xA, xB = xA, xd, text, side = 'right', color = C.dim,
}: { k: Kit; y1: number; y2: number; xA: number; xB?: number; xd: number; text: string; side?: 'left' | 'right'; color?: string }) {
  const right = xd > Math.max(xA, xB);
  const ext = (y: number, xf: number) => {
    const dir = right ? 1 : -1;
    const x0 = xf + dir * k.gap;
    const x1 = xd + dir * k.over;
    if ((x1 - x0) * dir <= 0) return null;
    return <line x1={x0} y1={y} x2={x1} y2={y} stroke={color} strokeWidth={k.thin} />;
  };
  const a = Math.min(y1, y2), b = Math.max(y1, y2);
  const inside = b - a >= 2 * k.arrow + k.fs * 0.4;
  return (
    <g>
      {ext(y1, xA)}
      {ext(y2, xB)}
      {inside ? (
        <>
          <line x1={xd} y1={a} x2={xd} y2={b} stroke={color} strokeWidth={k.thin} />
          <Arrow k={k} x={xd} y={a} ux={0} uy={-1} color={color} />
          <Arrow k={k} x={xd} y={b} ux={0} uy={1} color={color} />
        </>
      ) : (
        <>
          <line x1={xd} y1={a - k.arrow * 2} x2={xd} y2={b + k.arrow * 2} stroke={color} strokeWidth={k.thin} />
          <Arrow k={k} x={xd} y={a} ux={0} uy={1} color={color} />
          <Arrow k={k} x={xd} y={b} ux={0} uy={-1} color={color} />
        </>
      )}
      <Txt
        k={k} x={side === 'right' ? xd + k.fs * 0.45 : xd - k.fs * 0.45} y={(a + b) / 2}
        anchor={side === 'right' ? 'start' : 'end'} baseline="central"
      >{text}</Txt>
    </g>
  );
}

/** Leader: arrow (or dot) at the feature, oblique line, horizontal shoulder, text on the shoulder. */
export function Leader({
  k, x, y, tx, ty, text, color = C.dim, dot = false, textColor,
}: { k: Kit; x: number; y: number; tx: number; ty: number; text: string; color?: string; dot?: boolean; textColor?: string }) {
  const right = tx >= x;
  const tw = textW(text, k.fs);
  const sx = right ? tx + tw + k.fs * 0.3 : tx - tw - k.fs * 0.3;
  const len = Math.hypot(tx - x, ty - y) || 1;
  const ux = (x - tx) / len, uy = (y - ty) / len;
  return (
    <g>
      <line x1={x} y1={y} x2={tx} y2={ty} stroke={color} strokeWidth={k.thin} />
      <line x1={tx} y1={ty} x2={sx} y2={ty} stroke={color} strokeWidth={k.thin} />
      {dot ? <circle cx={x} cy={y} r={k.fs * 0.22} fill={color} /> : <Arrow k={k} x={x} y={y} ux={ux} uy={uy} color={color} />}
      <Txt k={k} x={right ? tx + k.fs * 0.15 : tx - k.fs * 0.15} y={ty - k.fs * 0.3} anchor={right ? 'start' : 'end'} color={textColor ?? C.dimText}>
        {text}
      </Txt>
    </g>
  );
}

export function CenterLine({ k, x1, y1, x2, y2 }: { k: Kit; x1: number; y1: number; x2: number; y2: number }) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.thin} strokeWidth={k.thin}
      strokeDasharray={`${k.fs * 3} ${k.fs * 0.5} ${k.fs * 0.35} ${k.fs * 0.5}`}
    />
  );
}

/** Parallel hatch lines clipped to a rectangle (no <pattern> so exports stay crisp). */
export function HatchRect({
  k, x, y, w, h, angle = 45, pitch, id,
}: { k: Kit; x: number; y: number; w: number; h: number; angle?: 45 | -45; pitch?: number; id: string }) {
  const p = pitch ?? k.fs * 0.9;
  const lines: React.ReactNode[] = [];
  const n = Math.ceil((w + h) / p) + 2;
  for (let i = -1; i < n; i++) {
    const o = i * p;
    if (angle === 45) lines.push(<line key={i} x1={x + o} y1={y} x2={x + o - h} y2={y + h} />);
    else lines.push(<line key={i} x1={x + o - h} y1={y} x2={x + o} y2={y + h} />);
  }
  return (
    <g>
      <clipPath id={id}><rect x={x} y={y} width={w} height={h} /></clipPath>
      <g clipPath={`url(#${id})`} stroke={C.thin} strokeWidth={k.thin}>{lines}</g>
    </g>
  );
}

export function regularHexPoints(cx: number, cy: number, sAcrossFlats: number, cornersVertical: boolean) {
  const R = sAcrossFlats / Math.sqrt(3); // circumradius
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = ((cornersVertical ? 90 : 0) + 60 * i) * (Math.PI / 180);
    pts.push(`${cx + R * Math.cos(a)},${cy + R * Math.sin(a)}`);
  }
  return pts.join(' ');
}
