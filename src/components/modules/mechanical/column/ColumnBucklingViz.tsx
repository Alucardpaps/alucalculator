'use client';
/**
 * Column buckling visuals — tokens only (SVG fallbacks for export).
 *  - ColumnDiagram: supports, exact first buckling mode, inflection points, L and Le = K·L
 *  - SectionSketch: cross-section with its governing dimensions
 *  - BucklingChart: σ–λ with Euler, EC3 curves a0…d, AISC E3, Tetmajer, Johnson and the design point
 */
import React from 'react';
import {
  CURVE_ALPHA, chiEC3, effectiveSpan, fcrAISC, modeShape,
  type BucklingCurve, type EndCondition, type SectionInput,
} from '@/lib/structural/columnBuckling';

const T = {
  ink: 'var(--ink, #eceff3)',
  alu: 'var(--alu, #c3c9d1)',
  dim: 'var(--alu-dim, #949daa)',
  muted: 'var(--muted, #6e7783)',
  line: 'var(--line, #2a3038)',
  faint: 'var(--line-faint, #1f242b)',
  bg2: 'var(--bg-2, #161a1f)',
  bg3: 'var(--bg-3, #1d2228)',
  acc: 'var(--cyan, #3cc6e6)',
  ok: 'var(--ok, #34c77b)',
  warn: 'var(--warn, #e9a83a)',
  bad: 'var(--bad, #ef5b5b)',
  std: 'var(--std, #7aa7ff)',
  mono: 'var(--font-mono, "JetBrains Mono", ui-monospace, monospace)',
};

const fmt = (v: number, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : '–');

function Hatch({ id }: { id: string }) {
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="6" stroke={T.dim} strokeWidth="1" />
    </pattern>
  );
}

function ArrowHead({ x, y, dir, color = T.acc, s = 7 }: { x: number; y: number; dir: 'up' | 'down' | 'left' | 'right'; color?: string; s?: number }) {
  const w = s * 0.38;
  const p =
    dir === 'down' ? `${x},${y} ${x - w},${y - s} ${x + w},${y - s}` :
    dir === 'up' ? `${x},${y} ${x - w},${y + s} ${x + w},${y + s}` :
    dir === 'left' ? `${x},${y} ${x + s},${y - w} ${x + s},${y + w}` :
    `${x},${y} ${x - s},${y - w} ${x - s},${y + w}`;
  return <polygon points={p} fill={color} />;
}

function Label({ x, y, children, anchor = 'start', color = T.ink, size = 12.5, weight = 500 }: {
  x: number; y: number; children: React.ReactNode; anchor?: 'start' | 'middle' | 'end'; color?: string; size?: number; weight?: number;
}) {
  return (
    <text x={x} y={y} fill={color} fontSize={size} fontFamily={T.mono} fontWeight={weight} textAnchor={anchor}
      style={{ paintOrder: 'stroke', stroke: 'var(--bg-2, #161a1f)', strokeWidth: 3, strokeLinejoin: 'round' }}>
      {children}
    </text>
  );
}

/* ───────────────────────── Column diagram ───────────────────────── */

export function ColumnDiagram({
  end, L, K, Le, loadKN, labels,
}: {
  end: EndCondition; L: number; K: number; Le: number; loadKN: number;
  labels: { mode: string; inflection: string; free: string; pinned: string; fixed: string; guided: string };
}) {
  const W = 360, H = 420;
  const cx = 150;
  // cantilever: the column takes the upper half, its mirror image below the base shows Le = 2L
  const cant = end === 'fixed-free';
  const yTop = 80, yBot = cant ? 220 : 360; // column from yBot (ξ=0) to yTop (ξ=1)
  const Lp = yBot - yTop;
  const amp = 46;
  const Y = (xi: number) => yBot - xi * Lp;
  const pts: string[] = [];
  for (let k = 0; k <= 80; k++) {
    const xi = k / 80;
    pts.push(`${k ? 'L' : 'M'}${(cx + amp * modeShape(end, xi)).toFixed(2)} ${Y(xi).toFixed(2)}`);
  }
  const [s0, s1] = effectiveSpan(end);
  const topFree = end === 'fixed-free';
  const botFixed = end !== 'pinned-pinned';
  const topFixed = end === 'fixed-fixed';
  const topPinned = end === 'pinned-pinned' || end === 'fixed-pinned';
  const xTop = topFree ? cx + amp : cx;

  // inflection points (curvature zero) inside the real column
  const infl = [s0, s1].filter((s) => s > 0.001 && s < 0.999);

  // cantilever: mirror image about the fixed base → equivalent pinned column of length 2L
  const ghost: string[] = [];
  if (cant) {
    for (let k = 0; k <= 40; k++) {
      const xi = k / 40;
      ghost.push(`${k ? 'L' : 'M'}${(cx + amp * modeShape(end, xi)).toFixed(2)} ${(yBot + xi * Lp).toFixed(2)}`);
    }
  }

  const dimX = 286;
  const leTop = Y(Math.min(s1, 1));
  const leBot = cant ? yBot + Lp : Y(s0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Column, supports and first buckling mode">
      <defs><Hatch id="cb-hatch" /></defs>

      {/* undeformed axis */}
      <line x1={cx} y1={yTop - 8} x2={cx} y2={yBot + 8} stroke={T.muted} strokeWidth="1" strokeDasharray="10 3 2 3" />

      {/* buckled shape */}
      {topFree && <path d={ghost.join(' ')} fill="none" stroke={T.dim} strokeWidth="1.2" strokeDasharray="4 3" />}
      <path d={pts.join(' ')} fill="none" stroke={T.acc} strokeWidth="5" strokeLinecap="round" opacity="0.9" />
      <Label x={cx + amp + 10} y={Y(topFree ? 0.75 : 0.55)} color={T.acc} size={12}>{labels.mode}</Label>

      {/* inflection points */}
      {infl.map((s) => (
        <g key={s}>
          <circle cx={cx + amp * modeShape(end, s)} cy={Y(s)} r="4" fill={T.bg2} stroke={T.warn} strokeWidth="1.6" />
          <line x1={cx + amp * modeShape(end, s) + 6} y1={Y(s)} x2={dimX - 8} y2={Y(s)} stroke={T.warn} strokeWidth="0.8" strokeDasharray="2 3" />
        </g>
      ))}
      {infl.length > 0 && <Label x={20} y={Y(infl[0]) + 4} color={T.warn} size={12}>{labels.inflection}</Label>}

      {/* bottom support */}
      {botFixed ? (
        <g>
          <rect x={cx - 34} y={yBot} width="68" height="16" fill="url(#cb-hatch)" />
          <line x1={cx - 34} y1={yBot} x2={cx + 34} y2={yBot} stroke={T.ink} strokeWidth="2" />
          <Label x={cx - 40} y={yBot + 12} anchor="end" color={T.dim} size={12}>{labels.fixed}</Label>
        </g>
      ) : (
        <g>
          <polygon points={`${cx},${yBot} ${cx - 14},${yBot + 22} ${cx + 14},${yBot + 22}`} fill={T.bg3} stroke={T.ink} strokeWidth="1.5" />
          <circle cx={cx} cy={yBot} r="3.5" fill={T.bg2} stroke={T.ink} strokeWidth="1.5" />
          <rect x={cx - 26} y={yBot + 22} width="52" height="10" fill="url(#cb-hatch)" />
          <line x1={cx - 26} y1={yBot + 22} x2={cx + 26} y2={yBot + 22} stroke={T.ink} strokeWidth="1.5" />
          <Label x={cx - 32} y={yBot + 18} anchor="end" color={T.dim} size={12}>{labels.pinned}</Label>
        </g>
      )}

      {/* top support (vertical guide so the load can follow) */}
      {topFixed && (
        <g>
          <rect x={cx - 34} y={yTop - 16} width="68" height="16" fill="url(#cb-hatch)" />
          <line x1={cx - 34} y1={yTop} x2={cx + 34} y2={yTop} stroke={T.ink} strokeWidth="2" />
          <line x1={cx - 22} y1={yTop - 30} x2={cx - 22} y2={yTop - 16} stroke={T.dim} strokeWidth="1" />
          <line x1={cx + 22} y1={yTop - 30} x2={cx + 22} y2={yTop - 16} stroke={T.dim} strokeWidth="1" />
          <Label x={cx - 40} y={yTop - 4} anchor="end" color={T.dim} size={12}>{labels.guided}</Label>
        </g>
      )}
      {topPinned && (
        <g>
          <circle cx={cx} cy={yTop} r="3.5" fill={T.bg2} stroke={T.ink} strokeWidth="1.5" />
          <polygon points={`${cx},${yTop} ${cx - 14},${yTop - 22} ${cx + 14},${yTop - 22}`} fill={T.bg3} stroke={T.ink} strokeWidth="1.5" />
          <line x1={cx - 24} y1={yTop - 22} x2={cx - 24} y2={yTop - 44} stroke={T.dim} strokeWidth="1" />
          <line x1={cx + 24} y1={yTop - 22} x2={cx + 24} y2={yTop - 44} stroke={T.dim} strokeWidth="1" />
          <Label x={cx - 30} y={yTop - 8} anchor="end" color={T.dim} size={12}>{labels.guided}</Label>
        </g>
      )}
      {topFree && <Label x={xTop + 10} y={yTop + 14} color={T.dim} size={12}>{labels.free}</Label>}

      {/* load */}
      <line x1={xTop} y1={topPinned ? yTop - 64 : topFixed ? yTop - 54 : yTop - 44} x2={xTop} y2={topPinned ? yTop - 28 : topFixed ? yTop - 20 : yTop - 6} stroke={T.bad} strokeWidth="2.5" />
      <ArrowHead x={xTop} y={topPinned ? yTop - 24 : topFixed ? yTop - 17 : yTop - 2} dir="down" color={T.bad} s={9} />
      <Label x={xTop + 8} y={topPinned ? yTop - 52 : topFixed ? yTop - 42 : yTop - 32} color={T.bad} weight={700}>N = {fmt(loadKN, 1)} kN</Label>

      {/* L dimension (left) */}
      <g stroke={T.acc} strokeWidth="0.9">
        <line x1={cx - 40} y1={yTop} x2={46} y2={yTop} strokeDasharray="0" />
        <line x1={cx - 40} y1={yBot} x2={46} y2={yBot} />
        <line x1={52} y1={yTop} x2={52} y2={yBot} />
      </g>
      <ArrowHead x={52} y={yTop} dir="up" />
      <ArrowHead x={52} y={yBot} dir="down" />
      <Label x={46} y={(yTop + yBot) / 2} anchor="end">L</Label>
      <Label x={46} y={(yTop + yBot) / 2 + 14} anchor="end" color={T.dim} size={12}>{fmt(L, 0)}</Label>

      {/* Le dimension (right) */}
      <g stroke={T.warn} strokeWidth="0.9">
        <line x1={dimX} y1={leTop} x2={dimX} y2={leBot} />
        {!cant && !infl.includes(s0) && <line x1={cx + 36} y1={leBot} x2={dimX + 6} y2={leBot} />}
        {s1 >= 0.999 && <line x1={xTop + 8} y1={leTop} x2={dimX + 6} y2={leTop} />}
        {cant && <line x1={xTop + 8} y1={leBot} x2={dimX + 6} y2={leBot} />}
      </g>
      <ArrowHead x={dimX} y={leTop} dir="up" color={T.warn} />
      <ArrowHead x={dimX} y={leBot} dir="down" color={T.warn} />
      <Label x={dimX + 6} y={(leTop + leBot) / 2 - 4} color={T.warn} weight={700}>Le</Label>
      <Label x={dimX + 6} y={(leTop + leBot) / 2 + 10} color={T.warn} size={12}>{`${fmt(K, K < 1 ? 3 : 1)}·L`}</Label>
      <Label x={dimX + 6} y={(leTop + leBot) / 2 + 23} color={T.dim} size={12}>{fmt(Le, 0)}</Label>
    </svg>
  );
}

/* ───────────────────────── Section sketch ───────────────────────── */

export function SectionSketch({ s, axisLabel }: { s: SectionInput; axisLabel: string }) {
  const W = 200, H = 170, cx = 100, cy = 78, M = 100; // M = max drawn extent
  const ext = s.kind === 'round' || s.kind === 'tube' ? (s.d ?? 1) : Math.max(s.b ?? 1, s.h ?? 1);
  const k = M / Math.max(ext, 1e-6);
  const dims: React.ReactNode[] = [];
  let body: React.ReactNode = null;
  if (s.kind === 'round' || s.kind === 'tube') {
    const R = ((s.d ?? 0) * k) / 2;
    const r = s.kind === 'tube' ? Math.max(0, R - (s.t ?? 0) * k) : 0;
    body = (
      <g>
        <circle cx={cx} cy={cy} r={R} fill="url(#cs-hatch)" stroke={T.ink} strokeWidth="1.6" />
        {r > 0 && <circle cx={cx} cy={cy} r={r} fill={T.bg2} stroke={T.ink} strokeWidth="1.6" />}
      </g>
    );
    dims.push(<Label key="d" x={cx} y={cy + R + 26} anchor="middle">{`Ø${fmt(s.d ?? 0, 1)}${s.kind === 'tube' ? ` × ${fmt(s.t ?? 0, 1)}` : ''}`}</Label>);
    dims.push(
      <g key="dl" stroke={T.acc} strokeWidth="0.9">
        <line x1={cx - R} y1={cy + R + 10} x2={cx + R} y2={cy + R + 10} />
        <line x1={cx - R} y1={cy} x2={cx - R} y2={cy + R + 14} strokeDasharray="2 2" />
        <line x1={cx + R} y1={cy} x2={cx + R} y2={cy + R + 14} strokeDasharray="2 2" />
      </g>,
    );
  } else {
    const bw = (s.b ?? 0) * k, hh = (s.h ?? 0) * k;
    const t = s.kind === 'rhs' ? (s.t ?? 0) * k : 0;
    body = (
      <g>
        <rect x={cx - bw / 2} y={cy - hh / 2} width={bw} height={hh} fill="url(#cs-hatch)" stroke={T.ink} strokeWidth="1.6" />
        {t > 0 && bw - 2 * t > 0 && hh - 2 * t > 0 && (
          <rect x={cx - bw / 2 + t} y={cy - hh / 2 + t} width={bw - 2 * t} height={hh - 2 * t} fill={T.bg2} stroke={T.ink} strokeWidth="1.6" />
        )}
      </g>
    );
    dims.push(<Label key="b" x={cx} y={cy + hh / 2 + 26} anchor="middle">{`b ${fmt(s.b ?? 0, 1)}`}</Label>);
    dims.push(<Label key="h" x={cx + bw / 2 + 10} y={cy + 4}>{`h ${fmt(s.h ?? 0, 1)}`}</Label>);
    if (s.kind === 'rhs') dims.push(<Label key="t" x={cx} y={cy + hh / 2 + 40} anchor="middle" color={T.dim} size={12}>{`t ${fmt(s.t ?? 0, 1)}`}</Label>);
    dims.push(
      <g key="dl" stroke={T.acc} strokeWidth="0.9">
        <line x1={cx - bw / 2} y1={cy + hh / 2 + 10} x2={cx + bw / 2} y2={cy + hh / 2 + 10} />
        <line x1={cx + bw / 2 + 5} y1={cy - hh / 2} x2={cx + bw / 2 + 5} y2={cy + hh / 2} />
      </g>,
    );
  }
  // weak axis (buckling about it, deflection perpendicular)
  const weakVertical = s.kind === 'rect' || s.kind === 'rhs' ? (s.b ?? 0) <= (s.h ?? 0) : true;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Cross-section">
      <defs><Hatch id="cs-hatch" /></defs>
      {body}
      <line
        x1={weakVertical ? cx : cx - 64} y1={weakVertical ? cy - 64 : cy} x2={weakVertical ? cx : cx + 64} y2={weakVertical ? cy + 64 : cy}
        stroke={T.warn} strokeWidth="1" strokeDasharray="10 3 2 3"
      />
      <Label x={weakVertical ? cx + 4 : cx + 66} y={weakVertical ? cy - 56 : cy - 4} color={T.warn} size={12}>{axisLabel}</Label>
      {dims}
    </svg>
  );
}

/* ───────────────────────── σ–λ chart ───────────────────────── */

export function BucklingChart({
  E, fy, gammaM1, curve, lambda, sigmaN, steel, tetLine, labels,
}: {
  E: number; fy: number; gammaM1: number; curve: BucklingCurve; lambda: number; sigmaN: number; steel: boolean;
  tetLine?: { a: number; b: number; lambdaP: number } | null;
  labels: { euler: string; ec3: string; aisc: string; tetmajer: string; johnson: string; applied: string; x: string; y: string };
}) {
  const W = 640, H = 330;
  const m = { l: 54, r: 16, t: 16, b: 40 };
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const lMax = Math.max(200, Math.ceil((lambda * 1.25) / 50) * 50);
  const sMax = Math.ceil((fy * 1.15) / 50) * 50;
  const X = (l: number) => m.l + (l / lMax) * pw;
  const Yv = (s: number) => m.t + ph - (Math.min(s, sMax) / sMax) * ph;
  const lambda1 = Math.PI * Math.sqrt(E / fy);
  const N = 160;
  const path = (f: (l: number) => number | null, l0 = 0, l1 = lMax) => {
    const out: string[] = [];
    let pen = false;
    for (let k = 0; k <= N; k++) {
      const l = l0 + ((l1 - l0) * k) / N;
      const s = f(l);
      if (s === null || !Number.isFinite(s) || s > sMax * 1.02) { pen = false; continue; }
      out.push(`${pen ? 'L' : 'M'}${X(l).toFixed(1)} ${Yv(s).toFixed(1)}`);
      pen = true;
    }
    return out.join(' ');
  };
  const ec3 = (c: BucklingCurve) => (l: number) => (chiEC3(l / lambda1, CURVE_ALPHA[c]) * fy) / gammaM1;
  const euler = (l: number) => (l > 0 ? (Math.PI ** 2 * E) / (l * l) : null);
  const aisc = (l: number) => fcrAISC(l, E, fy);
  const Cc = Math.sqrt((2 * Math.PI ** 2 * E) / fy);
  const joh = (l: number) => (l <= Cc ? fy * (1 - (fy * l * l) / (4 * Math.PI ** 2 * E)) : null);
  const tet = tetLine ? (l: number) => (l >= 20 && l <= tetLine.lambdaP ? Math.min(fy, tetLine.a - tetLine.b * l) : null) : null;

  const xt: number[] = [];
  for (let l = 0; l <= lMax + 1e-6; l += lMax <= 250 ? 25 : 50) xt.push(l);
  const yt: number[] = [];
  const ys = sMax <= 300 ? 50 : sMax <= 600 ? 100 : 200;
  for (let s = 0; s <= sMax + 1e-6; s += ys) yt.push(s);

  const sigEC3 = ec3(curve)(lambda);
  const util = sigEC3 > 0 ? sigmaN / sigEC3 : Infinity;
  const ptColor = util <= 1 ? T.ok : T.bad;

  const legend: { c: string; dash?: string; w: number; t: string }[] = [
    { c: T.acc, w: 2.6, t: `${labels.ec3} ${curve}` },
    { c: T.dim, w: 1.3, dash: '5 3', t: labels.euler },
    { c: T.std, w: 1.6, t: labels.aisc },
    ...(tet ? [{ c: T.warn, w: 1.6, t: labels.tetmajer }] : []),
    { c: T.muted, w: 1.3, dash: '1.5 3', t: labels.johnson },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Buckling curves σ–λ">
      {/* grid */}
      {xt.map((l) => <line key={`gx${l}`} x1={X(l)} y1={m.t} x2={X(l)} y2={m.t + ph} stroke={T.faint} strokeWidth="1" />)}
      {yt.map((s) => <line key={`gy${s}`} x1={m.l} y1={Yv(s)} x2={m.l + pw} y2={Yv(s)} stroke={T.faint} strokeWidth="1" />)}
      <line x1={m.l} y1={m.t + ph} x2={m.l + pw} y2={m.t + ph} stroke={T.line} strokeWidth="1.2" />
      <line x1={m.l} y1={m.t} x2={m.l} y2={m.t + ph} stroke={T.line} strokeWidth="1.2" />
      {xt.map((l) => <Label key={`tx${l}`} x={X(l)} y={m.t + ph + 15} anchor="middle" color={T.dim} size={10}>{l}</Label>)}
      {yt.map((s) => <Label key={`ty${s}`} x={m.l - 6} y={Yv(s) + 3.5} anchor="end" color={T.dim} size={10}>{s}</Label>)}
      <Label x={m.l + pw} y={m.t + ph + 32} anchor="end" color={T.dim} size={10}>{labels.x}</Label>
      <Label x={m.l + 4} y={m.t + 10} color={T.dim} size={10}>{labels.y}</Label>

      {/* fy line */}
      <line x1={m.l} y1={Yv(fy)} x2={m.l + pw} y2={Yv(fy)} stroke={T.dim} strokeWidth="0.8" strokeDasharray="2 3" />
      <Label x={m.l + 6} y={Yv(fy) - 5} color={T.dim} size={10}>{`fy ${fy}`}</Label>

      {/* other EC3 curves (faint) */}
      {(['a0', 'a', 'b', 'c', 'd'] as BucklingCurve[]).filter((c) => c !== curve).map((c) => (
        <path key={c} d={path(ec3(c))} fill="none" stroke={T.acc} strokeWidth="0.9" opacity="0.28" />
      ))}
      <path d={path(euler, 1)} fill="none" stroke={T.dim} strokeWidth="1.3" strokeDasharray="5 3" />
      <path d={path(joh)} fill="none" stroke={T.muted} strokeWidth="1.3" strokeDasharray="1.5 3" />
      <path d={path(aisc)} fill="none" stroke={T.std} strokeWidth="1.6" />
      {tet && <path d={path(tet, 20, tetLine!.lambdaP)} fill="none" stroke={T.warn} strokeWidth="1.8" />}
      <path d={path(ec3(curve))} fill="none" stroke={T.acc} strokeWidth="2.6" />

      {/* design point */}
      {lambda > 0 && lambda <= lMax && (
        <g>
          <line x1={X(lambda)} y1={m.t} x2={X(lambda)} y2={m.t + ph} stroke={T.alu} strokeWidth="0.8" strokeDasharray="3 3" />
          <circle cx={X(lambda)} cy={Yv(sigEC3)} r="4" fill={T.acc} />
          <circle cx={X(lambda)} cy={Yv(sigmaN)} r="5.5" fill={ptColor} stroke={T.bg2} strokeWidth="1.5" />
          <Label x={X(lambda) + (X(lambda) > W * 0.7 ? -9 : 9)} y={Yv(sigmaN) - 7} anchor={X(lambda) > W * 0.7 ? 'end' : 'start'} color={ptColor} weight={700}>
            {`${labels.applied} ${fmt(sigmaN, 0)} MPa`}
          </Label>
          <Label x={X(lambda) + 4} y={m.t + 10} color={T.alu} size={10}>{`λ ${fmt(lambda, 0)}`}</Label>
        </g>
      )}

      {/* legend */}
      <g transform={`translate(${m.l + pw - 210}, ${m.t + 26})`}>
        <rect x="-8" y="-12" width="214" height={legend.length * 15 + 8} fill={T.bg2} stroke={T.line} strokeWidth="1" opacity="0.92" />
        {legend.map((g, i) => (
          <g key={g.t} transform={`translate(0, ${i * 15})`}>
            <line x1="0" y1="-3" x2="22" y2="-3" stroke={g.c} strokeWidth={g.w} strokeDasharray={g.dash} />
            <Label x={28} y={1} color={T.alu} size={10}>{g.t}</Label>
          </g>
        ))}
      </g>
      {!steel && <Label x={m.l + 6} y={m.t + ph - 6} color={T.muted} size={10}>Tetmajer: steel only</Label>}
    </svg>
  );
}
