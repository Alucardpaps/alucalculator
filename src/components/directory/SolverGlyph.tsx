/**
 * SolverGlyph — small technical line drawing for every solver in the directory.
 * One glyph per tool id (shows what the tool computes), drawn on a 120 × 72 grid with theme
 * tokens only, so it works in all five themes. Pure SVG, no state, server-renderable.
 */
import React from 'react';

const S = 'var(--alu, #c5cbd3)';      // main line
const A = 'var(--cyan, #3cc6e6)';     // accent (the quantity the tool solves for)
const M = 'var(--muted, #6e7783)';    // construction / dimension
const W = 'var(--warn, #e9a83a)';     // load / heat / highlight
const F = 'var(--bg-3, #1d2228)';     // solid fill
const K = 'var(--ok, #34c77b)';

type G = () => React.ReactNode;
const p = (d: string, c = S, w = 1.4, fill = 'none') => <path d={d} stroke={c} strokeWidth={w} fill={fill} strokeLinejoin="round" strokeLinecap="round" />;
const ln = (x1: number, y1: number, x2: number, y2: number, c = S, w = 1.4, dash?: string) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeDasharray={dash} strokeLinecap="round" />;
const ci = (cx: number, cy: number, r: number, c = S, w = 1.4, fill = 'none', dash?: string) => <circle cx={cx} cy={cy} r={r} stroke={c} strokeWidth={w} fill={fill} strokeDasharray={dash} />;
const rc = (x: number, y: number, w: number, h: number, c = S, sw = 1.4, fill = 'none', rx = 0) => <rect x={x} y={y} width={w} height={h} stroke={c} strokeWidth={sw} fill={fill} rx={rx} />;
const tx = (x: number, y: number, t: string, c = M, size = 7, anchor: 'start' | 'middle' | 'end' = 'middle') => (
  <text x={x} y={y} fill={c} fontSize={size} textAnchor={anchor} fontFamily="var(--font-mono, ui-monospace, monospace)">{t}</text>
);
const arrow = (x1: number, y1: number, x2: number, y2: number, c = W) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 4.5;
  return (
    <g>
      {ln(x1, y1, x2, y2, c, 1.4)}
      <path d={`M${x2} ${y2} L${x2 - L * Math.cos(a - 0.45)} ${y2 - L * Math.sin(a - 0.45)} L${x2 - L * Math.cos(a + 0.45)} ${y2 - L * Math.sin(a + 0.45)} Z`} fill={c} />
    </g>
  );
};
const gearPath = (cx: number, cy: number, r: number, n: number, h = 3) => {
  const pts: string[] = [];
  for (let i = 0; i < n * 4; i++) {
    const a = (i / (n * 4)) * Math.PI * 2;
    const rr = i % 4 === 0 || i % 4 === 1 ? r + h / 2 : r - h / 2;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
};
const zig = (x0: number, x1: number, y: number, amp: number, n: number) => {
  let d = `M${x0} ${y}`;
  for (let i = 1; i <= n; i++) d += ` L${x0 + ((x1 - x0) * (i - 0.5)) / n} ${y + (i % 2 ? -amp : amp)}`;
  return d + ` L${x1} ${y}`;
};
const wave = (x0: number, x1: number, y: number, amp: number, cycles: number, phase = 0) => {
  let d = '';
  for (let i = 0; i <= 60; i++) {
    const x = x0 + ((x1 - x0) * i) / 60;
    const yy = y - amp * Math.sin(phase + (i / 60) * cycles * Math.PI * 2);
    d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${yy.toFixed(1)}`;
  }
  return d;
};
const axes = (x = 16, y = 62, w = 92, h = 50) => <g>{ln(x, y, x + w, y, M, 1)}{ln(x, y, x, y - h, M, 1)}</g>;

const KL = (arr: React.ReactNode[]) => arr.map((c, i) => <React.Fragment key={i}>{c}</React.Fragment>);
const GLYPHS: Record<string, G> = {
  /* ── CAD & studios ── */
  cube: () => <g>{p('M40 24 L60 14 L80 24 L80 48 L60 58 L40 48 Z')}{p('M40 24 L60 34 L80 24 M60 34 L60 58', S)}{p('M60 34 L74 41 M60 34 L46 41', A, 1)}{ci(60, 34, 2, A, 1, A)}</g>,
  cubeParam: () => <g>{p('M36 26 L56 16 L76 26 L76 48 L56 58 L36 48 Z')}{p('M36 26 L56 36 L76 26 M56 36 L56 58')}{ci(66, 42, 4, A)}{ln(84, 16, 84, 58, M, 1, '2 2')}{tx(96, 40, 'p₁', A, 8)}</g>,
  cad2d: () => <g>{rc(22, 18, 76, 40, S, 1.2)}{ci(46, 38, 9)}{p('M70 26 L88 26 L88 50 L70 50', S)}{ln(22, 64, 98, 64, M, 0.8)}{tx(60, 70, 'L', M, 6)}{ln(46, 38, 55, 38, A, 1)}{tx(50, 35, 'R', A, 6)}</g>,
  sketch: () => <g>{p('M18 50 C30 20, 50 60, 62 30 S90 20, 102 44', A, 1.6)}{ci(18, 50, 2, S, 1, S)}{ci(62, 30, 2, S, 1, S)}{ci(102, 44, 2, S, 1, S)}{p('M80 58 L96 42 L100 46 L84 62 Z', S, 1.2)}</g>,
  fea: () => {
    const cells: React.ReactNode[] = [];
    const col = ['var(--ok)', 'var(--cyan)', 'var(--warn)', 'var(--bad)'];
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) {
      const c = col[Math.min(3, Math.floor((i + (j === 1 ? 0.5 : 0)) / 1.6))];
      cells.push(<rect key={`${i}${j}`} x={20 + i * 13} y={22 + j * 10} width={13} height={10} fill={c} opacity={0.35} stroke={S} strokeWidth={0.6} />);
    }
    return <g>{cells}{p('M20 22 L20 52', S, 2)}{ln(14, 22, 14, 52, M, 1)}{arrow(104, 26, 104, 46)}</g>;
  },
  flow: () => <g>{rc(14, 18, 26, 14, S, 1.2, F, 3)}{rc(14, 42, 26, 14, S, 1.2, F, 3)}{rc(80, 30, 26, 14, A, 1.2, F, 3)}{p('M40 25 C60 25, 60 37, 80 37', A)}{p('M40 49 C60 49, 60 37, 80 37', A)}{ci(40, 25, 2, A, 1, A)}{ci(40, 49, 2, A, 1, A)}</g>,
  nesting: () => <g>{rc(14, 12, 92, 50, M, 1)}{p('M18 16 L50 16 L50 34 L18 34 Z', S, 1.2, F)}{ci(66, 26, 10, S, 1.2, F)}{p('M80 16 L102 16 L102 58 L90 58 L90 34 L80 34 Z', S, 1.2, F)}{p('M18 38 L44 38 L60 58 L18 58 Z', A, 1.2, F)}</g>,
  cutbar: () => <g>{rc(12, 28, 96, 14, S, 1.2)}{KL([34, 58, 79, 99].map((x) => <g key={x}>{ln(x, 24, x, 46, W, 1.2, '2 2')}</g>))}{rc(99, 28, 9, 14, M, 0.6, 'var(--bad-soft, #3a1c1c)')}{tx(23, 56, '380', M, 6)}{tx(46, 56, '420', M, 6)}{tx(68, 56, '360', M, 6)}{tx(89, 56, '350', M, 6)}</g>,

  /* ── mechanical ── */
  bolt: () => <g>{p('M16 22 L28 22 L28 50 L16 50 Z', S, 1.4, F)}{p('M28 28 L98 28 L102 32 L102 40 L98 44 L28 44 Z', S, 1.4, F)}{ln(62, 30.5, 101, 30.5, S, 0.6)}{ln(62, 41.5, 101, 41.5, S, 0.6)}{ln(62, 28, 62, 44, S, 1.2)}{arrow(8, 36, 15, 36)}{p('M70 14 A10 10 0 0 1 84 18', A, 1.4)}{arrow(82, 16, 85, 19, A)}{tx(76, 11, 'MA', A, 7)}</g>,
  thread: () => <g>{p(zig(14, 106, 40, 10, 8), S, 1.4)}{ln(14, 52, 106, 52, M, 1)}{ln(14, 30, 106, 30, M, 0.8, '3 2')}{p('M36 30 L48 30 L42 40 Z', A, 1, 'var(--accent-soft, #12303a)')}{tx(60, 66, 'τ · A_s', A, 7)}</g>,
  keyway: () => <g>{ci(48, 36, 22, S)}{ci(48, 36, 14, S, 1.2, F)}{rc(43, 15, 10, 9, A, 1.4, 'var(--accent-soft, #12303a)')}{arrow(86, 22, 62, 22)}{tx(96, 25, 'Ft', W, 7)}{p('M30 50 A22 22 0 0 0 66 50', M, 1, 'none')}</g>,
  pressfit: () => <g>{rc(18, 22, 84, 28, S, 1.4)}{rc(18, 28, 84, 16, S, 1.2, F)}{KL([0, 1, 2, 3, 4].map((i) => <g key={i}>{arrow(30 + i * 16, 14, 30 + i * 16, 21)}{arrow(30 + i * 16, 58, 30 + i * 16, 51)}</g>))}{tx(60, 39, 'p', A, 8)}</g>,
  oring: () => <g>{p('M20 24 L50 24 L50 48 L70 48 L70 24 L100 24', S)}{ln(20, 54, 100, 54, S)}{p('M50 24 L50 48 L70 48 L70 24', M, 1)}{ci(60, 42, 8, A, 1.6, 'var(--accent-soft, #12303a)')}{arrow(60, 14, 60, 30)}</g>,
  bearing: () => <g>{ci(60, 36, 26)}{ci(60, 36, 20, M, 1)}{ci(60, 36, 12, M, 1)}{ci(60, 36, 7)}{Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return <circle key={i} cx={60 + 16 * Math.cos(a)} cy={36 + 16 * Math.sin(a)} r={3.6} fill={F} stroke={A} strokeWidth={1.2} />; })}</g>,
  gear: () => <g>{p(gearPath(44, 36, 20, 14, 5), S, 1.2, F)}{ci(44, 36, 5)}{p(gearPath(78, 36, 13, 9, 5), A, 1.2, F)}{ci(78, 36, 3.5, A)}{ln(44, 36, 78, 36, M, 0.8, '3 2')}</g>,
  planetary: () => <g>{p(gearPath(60, 36, 28, 30, 3.5), S, 1)}{p(gearPath(60, 36, 9, 10, 3), A, 1.2, F)}{KL([0, 120, 240].map((d) => { const a = (d * Math.PI) / 180; return <path key={d} d={gearPath(60 + 17 * Math.cos(a), 36 + 17 * Math.sin(a), 6.5, 8, 3)} stroke={S} strokeWidth={1} fill={F} />; }))}{ci(60, 36, 17, M, 0.8, 'none', '2 2')}</g>,
  gearbox: () => <g>{rc(16, 14, 88, 46, S, 1.4, 'none', 3)}{p(gearPath(38, 44, 10, 10, 4), S, 1, F)}{p(gearPath(56, 28, 7, 8, 3.5), A, 1, F)}{p(gearPath(76, 40, 12, 12, 4), S, 1, F)}{ln(6, 44, 28, 44, S, 2.2)}{ln(88, 40, 114, 40, S, 2.2)}</g>,
  shaft: () => <g>{p('M10 30 L30 30 L30 26 L66 26 L66 22 L86 22 L86 28 L110 28 L110 44 L86 44 L86 50 L66 50 L66 46 L30 46 L30 42 L10 42 Z', S, 1.4, F)}{ln(6, 36, 114, 36, M, 0.8, '6 2 1 2')}{p('M94 14 A12 12 0 0 1 104 22', A)}{arrow(102, 20, 105, 24, A)}{tx(98, 11, 'T', A, 7)}</g>,
  spring: () => <g>{rc(30, 8, 60, 4, S, 1, F)}{rc(30, 60, 60, 4, S, 1, F)}{p('M60 12 ' + Array.from({ length: 8 }, (_, i) => `L${i % 2 ? 42 : 78} ${16 + i * 5.6}`).join(' ') + ' L60 60', A, 1.6)}{arrow(100, 6, 100, 20)}{tx(108, 40, 'k', S, 8)}</g>,
  chain: () => <g>{ci(30, 36, 16)}{ci(90, 36, 10)}{p('M30 20 L90 26 M30 52 L90 46', A, 1.6)}{Array.from({ length: 6 }, (_, i) => <circle key={i} cx={40 + i * 9} cy={21.5 + i * 0.8} r={1.8} fill={A} />)}{ci(30, 36, 3)}{ci(90, 36, 2.5)}</g>,
  belt: () => <g>{ci(32, 36, 18)}{ci(32, 36, 4)}{ci(92, 36, 11)}{ci(92, 36, 3)}{p('M32 18 L92 25 M32 54 L92 47', A, 2.2)}{arrow(58, 14, 72, 15.5, W)}</g>,
  motor: () => <g>{rc(26, 18, 50, 36, S, 1.4, F, 4)}{KL([0, 1, 2, 3, 4].map((i) => ln(32 + i * 9, 18, 32 + i * 9, 54, M, 0.8)))}{rc(76, 26, 8, 20, S, 1.2)}{ln(84, 36, 108, 36, S, 2.4)}{rc(34, 10, 16, 8, S, 1.2)}{tx(60, 66, 'P · η', A, 7)}</g>,
  vibration: () => <g>{rc(48, 12, 24, 14, S, 1.4, F)}{p(zig(60, 60, 0, 0, 1), S)}{p('M54 26 ' + Array.from({ length: 6 }, (_, i) => `L${i % 2 ? 50 : 58} ${30 + i * 4}`).join(' ') + ' L54 54', S, 1.2)}{rc(64, 30, 6, 16, S, 1)}{ln(46, 56, 74, 56, S, 1.6)}{p(wave(78, 114, 30, 10, 2.5), A, 1.4)}</g>,
  book: () => <g>{p('M24 16 L58 20 L58 60 L24 56 Z', S, 1.4, F)}{p('M96 16 L62 20 L62 60 L96 56 Z', S, 1.4, F)}{KL([28, 34, 40, 46].map((y) => <g key={y}>{ln(30, y, 52, y + 2.5, M, 0.8)}{ln(68, y + 2.5, 90, y, M, 0.8)}</g>))}{tx(79, 52, 'ISO', A, 7)}</g>,

  /* ── materials, structural, manufacturing ── */
  beam: () => <g>{p('M14 30 Q60 46 106 30', A, 1.6)}{rc(14, 26, 92, 6, S, 1.2)}{p('M14 32 L9 40 L19 40 Z', S, 1.2)}{p('M106 32 L101 40 L111 40 Z', S, 1.2)}{arrow(60, 8, 60, 24)}{tx(68, 14, 'F', W, 7)}{tx(60, 58, 'δmax', A, 7)}</g>,
  sfd: () => <g>{ln(12, 22, 108, 22, M, 1)}{p('M12 22 L12 12 L60 12 L60 32 L108 32 L108 22', A, 1.4)}{ln(12, 56, 108, 56, M, 1)}{p('M12 56 L60 40 L108 56', W, 1.4)}{tx(114, 16, 'V', A, 7)}{tx(114, 50, 'M', W, 7)}</g>,
  column: () => <g>{p('M60 12 Q74 36 60 60', A, 1.6)}{ln(60, 12, 60, 60, M, 0.8, '3 2')}{p('M52 60 L68 60 L66 66 L54 66 Z', S, 1.2, F)}{p('M54 6 L66 6 L64 12 L56 12 Z', S, 1.2, F)}{arrow(60, -2, 60, 6)}{tx(82, 40, 'Pcr', A, 7, 'start')}</g>,
  rc: () => <g>{rc(36, 10, 48, 54, S, 1.4, F)}{KL([46, 60, 74].map((x) => ci(x, 54, 3.5, A, 1.2, A)))}{KL([46, 74].map((x) => ci(x, 20, 2.5, A, 1, A)))}{rc(41, 15, 38, 44, M, 0.8, 'none', 3)}{tx(96, 40, 'As', A, 7)}</g>,
  db: () => <g>{p('M34 18 A26 7 0 0 0 86 18 A26 7 0 0 0 34 18 Z', S, 1.3, F)}{p('M34 18 L34 54 A26 7 0 0 0 86 54 L86 18', S, 1.3)}{p('M34 30 A26 7 0 0 0 86 30 M34 42 A26 7 0 0 0 86 42', M, 1)}{tx(60, 40, 'E ρ Rm', A, 7)}</g>,
  matrix: () => <g>{Array.from({ length: 4 }, (_, i) => Array.from({ length: 6 }, (_, j) => <rect key={`${i}${j}`} x={18 + j * 14} y={14 + i * 12} width={12} height={10} fill={(i + j) % 3 === 0 ? 'var(--cyan)' : (i * j) % 4 === 1 ? 'var(--warn)' : 'var(--bg-3)'} opacity={(i + j) % 3 === 0 || (i * j) % 4 === 1 ? 0.55 : 1} stroke={M} strokeWidth={0.5} />))}</g>,
  pareto: () => <g>{axes()}{p('M22 18 Q34 50 102 56', A, 1.6)}{KL([[30, 30], [40, 44], [56, 50], [76, 54], [50, 32], [70, 40], [88, 46], [36, 22]].map(([x, y], i) => ci(x, y, 2.2, i < 4 ? A : M, 1, i < 4 ? A : 'none')))}{tx(108, 70, 'ρ', M, 7, 'end')}</g>,
  fits: () => <g>{rc(20, 30, 32, 16, S, 1, F)}{rc(68, 30, 32, 16, S, 1, F)}{ln(14, 38, 106, 38, M, 1)}{rc(28, 22, 16, 12, A, 1.2, 'var(--accent-soft, #12303a)')}{rc(76, 36, 16, 10, W, 1.2, 'var(--warn-soft, #3a2d17)')}{tx(36, 18, 'H7', A, 7)}{tx(84, 58, 'g6', W, 7)}</g>,
  sheet: () => <g>{p('M14 50 L54 50 Q62 50 64 42 L76 16', S, 2.4)}{p('M14 50 L54 50 Q62 50 64 42 L76 16', A, 0.8)}{p('M52 50 A10 10 0 0 0 62 44', M, 1, 'none')}{tx(78, 52, '90°', A, 7, 'start')}{ln(14, 60, 54, 60, M, 0.8)}{tx(34, 68, 'L flat', M, 6)}</g>,
  lathe: () => <g>{rc(10, 26, 16, 20, S, 1.2, F)}{rc(26, 30, 66, 12, S, 1.4, F)}{p('M60 42 L60 24 L52 30 Z', 'none')}{p('M66 44 L76 58 L86 58 L74 44 Z', A, 1.2, 'var(--accent-soft, #12303a)')}{p('M38 22 A10 10 0 0 1 50 22', W)}{arrow(48, 20, 51, 23)}{tx(98, 40, 'vc', A, 7, 'start')}</g>,
  clockTool: () => <g>{ci(44, 36, 20)}{ln(44, 36, 44, 22, A, 1.6)}{ln(44, 36, 54, 40, A, 1.6)}{ci(44, 36, 2, A, 1, A)}{rc(74, 28, 30, 6, S, 1.2, F)}{p('M104 24 L112 31 L104 38', W, 1.2)}{tx(88, 50, 'tc', A, 7)}</g>,
  weld: () => <g>{rc(12, 38, 46, 12, S, 1.2, F)}{rc(62, 38, 46, 12, S, 1.2, F)}{p('M54 38 L66 38 L60 48 Z', W, 1.2, 'var(--warn-soft, #3a2d17)')}{ln(60, 36, 74, 16, M, 1)}{ln(74, 16, 100, 16, M, 1)}{p('M82 16 L86 10 L90 16', A, 1.2)}{tx(100, 12, 'a', A, 7)}</g>,
  fillet: () => <g>{rc(14, 46, 92, 10, S, 1.2, F)}{rc(54, 12, 10, 34, S, 1.2, F)}{p('M54 46 L42 46 L54 34 Z', W, 1.2, 'var(--warn-soft, #3a2d17)')}{p('M64 46 L76 46 L64 34 Z', W, 1.2, 'var(--warn-soft, #3a2d17)')}{ln(48, 40, 44, 36, A, 1)}{tx(36, 32, 'a', A, 7)}</g>,
  profile: () => <g>{p('M30 14 L90 14 L90 22 L68 22 L68 50 L90 50 L90 58 L30 58 L30 50 L52 50 L52 22 L30 22 Z', S, 1.4, F)}{ln(60, 8, 60, 64, M, 0.8, '4 2 1 2')}{tx(104, 40, 'kg/m', A, 7)}</g>,
  cost: () => <g>{axes()}{KL([[24, 20, S], [40, 32, A], [56, 14, S], [72, 40, A], [88, 26, W]].map(([x, h, c], i) => rc(x as number, 62 - (h as number), 10, h as number, c as string, 1, F)))}{tx(104, 18, '€', A, 10)}</g>,
  mohr: () => <g>{ln(10, 40, 110, 40, M, 1)}{ln(30, 10, 30, 66, M, 1)}{ci(66, 40, 24, A, 1.6)}{ln(48, 24, 84, 56, S, 1)}{ci(42, 40, 1.8, S, 1, S)}{ci(90, 40, 1.8, S, 1, S)}{tx(90, 52, 'σ₁', A, 7)}{tx(42, 52, 'σ₂', A, 7)}{tx(36, 16, 'τ', M, 7)}</g>,
  mrl: () => <g>{Array.from({ length: 9 }, (_, i) => rc(16 + i * 10, 52 - i * 4, 8, 8 + i * 4, i < 6 ? A : M, 1, i < 6 ? 'var(--accent-soft, #12303a)' : F))}{tx(60, 68, 'MRL 1–10', M, 6)}</g>,
  cam: () => <g>{rc(16, 44, 88, 14, S, 1.2, F)}{p('M20 44 L20 32 L44 32 L44 26 L76 26 L76 36 L100 36 L100 44', A, 1.4, 'none')}{rc(60, 6, 8, 16, S, 1.2)}{ln(64, 22, 64, 26, W, 1.4)}{p('M20 30 L44 30 M44 24 L76 24', M, 0.8, 'none')}</g>,
  selection: () => <g>{rc(48, 8, 24, 12, S, 1.2, F, 2)}{p('M60 20 L60 28 M30 28 L90 28 M30 28 L30 36 M60 28 L60 36 M90 28 L90 36', M, 1)}{rc(18, 36, 24, 12, S, 1.2, F, 2)}{rc(48, 36, 24, 12, A, 1.4, 'var(--accent-soft, #12303a)', 2)}{rc(78, 36, 24, 12, S, 1.2, F, 2)}{p('M54 58 L58 62 L66 54', K, 1.6)}</g>,
  process: () => <g>{KL([16, 46, 76].map((x, i) => <g key={x}>{rc(x, 26, 24, 20, i === 1 ? A : S, 1.3, F, 3)}{i < 2 && arrow(x + 24, 36, x + 30, 36, M)}</g>))}{tx(28, 39, '10', M, 7)}{tx(58, 39, '20', A, 7)}{tx(88, 39, '30', M, 7)}</g>,
  truss: () => <g>{p('M14 54 L106 54 M14 54 L37 22 L60 54 L83 22 L106 54 M37 22 L83 22', S, 1.4)}{ln(37, 22, 60, 54, A, 1.8)}{KL([14, 37, 60, 83, 106].map((x) => ci(x, x === 37 || x === 83 ? 22 : 54, 2.2, S, 1, F)))}{arrow(60, 6, 60, 18)}</g>,

  /* ── fluids, thermal, electrical ── */
  heatsink: () => <g>{rc(18, 50, 84, 8, S, 1.4, F)}{Array.from({ length: 8 }, (_, i) => rc(22 + i * 10, 18, 4, 32, S, 1, F))}{rc(42, 58, 36, 6, W, 1.2, 'var(--warn-soft, #3a2d17)')}{p(wave(24, 96, 10, 2, 3), W, 1)}{tx(108, 30, 'Rθ', A, 7)}</g>,
  expansion: () => <g>{rc(14, 30, 70, 12, S, 1.3, F)}{rc(84, 30, 14, 12, A, 1.2, 'var(--accent-soft, #12303a)', 0)}{ln(14, 24, 14, 48, M, 1)}{p(wave(20, 78, 58, 2, 4), W, 1)}{tx(91, 54, 'ΔL', A, 7)}</g>,
  pump: () => <g>{ci(50, 38, 18, S, 1.4, F)}{Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2; return <path key={i} d={`M50 38 Q${50 + 8 * Math.cos(a + 0.6)} ${38 + 8 * Math.sin(a + 0.6)} ${50 + 15 * Math.cos(a)} ${38 + 15 * Math.sin(a)}`} stroke={A} strokeWidth={1.2} fill="none" />; })}{p('M64 26 L104 26 L104 34 L66 34', S, 1.4)}{arrow(86, 18, 102, 18, A)}{p('M42 56 L42 66 M58 56 L58 66', S, 1.4)}</g>,
  pipe: () => <g>{rc(10, 24, 100, 24, S, 1.4)}{p('M10 36 Q40 24 110 24 M10 36 Q40 48 110 48', M, 0.8)}{KL([30, 50, 70, 90].map((x) => arrow(x - 6, 36, x + 8, 36, A)))}{tx(20, 18, 'p₁', M, 7)}{tx(100, 18, 'p₂', M, 7)}</g>,
  fittings: () => <g>{p('M10 30 L56 30 Q70 30 70 16 L70 8 M10 42 L56 42 Q82 42 82 16 L82 8', S, 1.4)}{p('M82 54 L110 54 M82 66 L110 66', S, 1.4)}{rc(90, 50, 8, 20, A, 1.2, F)}{p('M30 36 L50 36 Q74 36 76 14', A, 1.2)}{tx(102, 44, 'K', A, 7)}</g>,
  vessel: () => <g>{p('M30 22 A12 14 0 0 0 30 50 L90 50 A12 14 0 0 0 90 22 Z', S, 1.6, F)}{p('M30 25 A9 11 0 0 0 30 47 L90 47 A9 11 0 0 0 90 25 Z', M, 0.8)}{arrow(60, 36, 60, 24.5)}{arrow(60, 36, 60, 47.5)}{arrow(60, 36, 76, 36)}{tx(60, 64, 'σθ = pr/t', A, 7)}</g>,
  hvac: () => <g>{p('M24 34 L60 12 L96 34 L96 60 L24 60 Z', S, 1.4, F)}{rc(50, 42, 20, 18, M, 1)}{arrow(104, 22, 92, 30)}{arrow(12, 50, 24, 50, A)}{tx(60, 34, 'Q', A, 8)}</g>,
  oilbath: () => <g>{rc(16, 18, 88, 44, S, 1.4, 'none', 3)}{rc(17, 44, 86, 17, A, 0, 'var(--accent-soft, #12303a)')}{p(wave(17, 103, 44, 1.5, 4), A, 1)}{p(gearPath(44, 40, 12, 12, 4), S, 1, F)}{p(gearPath(76, 34, 9, 10, 4), S, 1, F)}{p(wave(30, 90, 10, 2, 3), W, 1)}</g>,
  airfoil: () => <g>{p('M20 40 C36 20, 80 22, 104 38 C80 44, 40 46, 20 40 Z', S, 1.4, F)}{KL([16, 28, 54].map((y) => p(`M6 ${y} C40 ${y - 4}, 80 ${y - 6}, 116 ${y - 2}`, M, 0.8)))}{arrow(62, 30, 62, 10, A)}{arrow(80, 40, 100, 44)}{tx(68, 12, 'L', A, 7, 'start')}</g>,
  airfoilCl: () => <g>{axes()}{p('M20 60 L70 18 Q78 12 84 20 L98 34', A, 1.6)}{tx(110, 70, 'α', M, 7, 'end')}{tx(24, 16, 'CL', M, 7, 'start')}{ci(76, 15, 2, W, 1, W)}</g>,
  atmo: () => <g>{axes(20, 64, 88, 56)}{p('M26 12 L44 30 L44 44 L96 60', A, 1.6)}{KL([24, 40, 56].map((y) => ln(20, y, 108, y, M, 0.4, '2 3')))}{tx(98, 56, 'T(h)', A, 7)}{p('M84 22 L94 16 L104 22 L94 26 Z', S, 1.2, F)}</g>,
  sine3: () => <g>{ln(10, 36, 110, 36, M, 0.8)}{p(wave(10, 110, 36, 18, 1.5, 0), A, 1.4)}{p(wave(10, 110, 36, 18, 1.5, (2 * Math.PI) / 3), W, 1.4)}{p(wave(10, 110, 36, 18, 1.5, (4 * Math.PI) / 3), K, 1.4)}</g>,
  circuit: () => <g>{p('M20 20 L50 20', S)}{p(zig(50, 74, 20, 5, 6), A, 1.4)}{p('M74 20 L100 20 L100 52 L20 52 L20 40', S)}{ln(14, 40, 26, 40, S, 1.6)}{ln(17, 34, 23, 34, S, 1.6)}{ln(20, 34, 20, 20, S)}{arrow(60, 60, 80, 60, A)}{tx(62, 12, 'R', A, 7)}{tx(90, 68, 'I', A, 7)}</g>,
  cable: () => <g>{ci(40, 36, 20, S, 1.4, F)}{ci(32, 30, 6, A, 1.2)}{ci(48, 30, 6, W, 1.2)}{ci(40, 44, 6, K, 1.2)}{p('M70 36 L110 36', S, 2.4)}{p('M70 24 L110 30', M, 1, 'none')}{tx(96, 52, 'ΔU %', A, 7)}</g>,
  transformer: () => <g>{rc(36, 14, 48, 44, S, 1.6, 'none', 2)}{rc(46, 24, 28, 24, S, 1)}{Array.from({ length: 5 }, (_, i) => <ellipse key={i} cx={41} cy={22 + i * 7} rx={6} ry={3} stroke={A} strokeWidth={1.2} fill="none" />)}{Array.from({ length: 3 }, (_, i) => <ellipse key={i} cx={79} cy={26 + i * 10} rx={6} ry={4} stroke={W} strokeWidth={1.2} fill="none" />)}{tx(20, 40, 'N₁', A, 7)}{tx(100, 40, 'N₂', W, 7)}</g>,
  bode: () => <g>{axes()}{p('M18 22 L58 22 Q70 22 78 34 L104 60', A, 1.6)}{ln(70, 14, 70, 62, M, 0.8, '2 2')}{tx(74, 14, 'fc', M, 7, 'start')}{tx(26, 16, 'dB', M, 7, 'start')}</g>,

  /* ── science & theory ── */
  calc: () => <g>{rc(36, 8, 48, 58, S, 1.4, F, 4)}{rc(42, 14, 36, 12, A, 1, 'var(--accent-soft, #12303a)', 2)}{Array.from({ length: 9 }, (_, i) => rc(43 + (i % 3) * 12, 32 + Math.floor(i / 3) * 10, 9, 7, M, 0.8, 'none', 1.5))}{tx(73, 23, '∫dx', A, 7, 'end')}</g>,
  convert: () => <g>{rc(14, 22, 36, 28, S, 1.2, F, 3)}{rc(70, 22, 36, 28, S, 1.2, F, 3)}{arrow(52, 30, 68, 30, A)}{arrow(68, 42, 52, 42, A)}{tx(32, 40, 'HRC', M, 7)}{tx(88, 40, 'HV', A, 7)}</g>,
  pendulum: () => <g>{ln(30, 10, 90, 10, S, 1.6)}{ln(60, 10, 80, 50, S, 1.2)}{ci(80, 52, 6, A, 1.4, F)}{ln(60, 10, 60, 58, M, 0.8, '2 2')}{p('M60 30 A20 20 0 0 0 69 28', W, 1)}{tx(70, 24, 'θ', W, 7, 'start')}</g>,
  projectile: () => <g>{axes()}{p('M18 60 Q58 -8 104 60', A, 1.6, 'none')}{arrow(18, 60, 34, 42)}{ci(61, 26, 2.4, S, 1, S)}{tx(106, 54, 'R', M, 7, 'start')}</g>,
  goodman: () => <g>{axes()}{ln(16, 18, 98, 62, A, 1.6)}{p('M16 18 Q70 26 98 62', M, 1, 'none')}{ci(50, 44, 2.4, W, 1, W)}{tx(104, 70, 'σm', M, 7, 'end')}{tx(22, 14, 'σa', M, 7, 'start')}</g>,
  sn: () => <g>{axes()}{p('M18 18 Q40 22 60 40 L104 42', A, 1.6, 'none')}{ln(60, 14, 60, 62, M, 0.8, '2 2')}{tx(106, 70, 'log N', M, 6, 'end')}{tx(22, 14, 'S', M, 7, 'start')}</g>,
  bathtub: () => <g>{axes()}{p('M18 16 Q26 50 44 52 L80 52 Q96 50 104 18', A, 1.6, 'none')}{tx(60, 46, 'λ = 1/MTBF', M, 6)}</g>,
  flask: () => <g>{p('M52 10 L68 10 M54 10 L54 28 L36 58 Q34 64 42 64 L78 64 Q86 64 84 58 L66 28 L66 10', S, 1.4)}{p('M42 48 L78 48 L84 58 Q86 64 78 64 L42 64 Q34 64 36 58 Z', A, 0, 'var(--accent-soft, #12303a)')}{ci(56, 54, 2, A)}{ci(64, 58, 1.5, A)}{tx(100, 30, 'A+B', M, 7)}</g>,
  periodic: () => <g>{Array.from({ length: 18 }, (_, j) => Array.from({ length: 5 }, (_, i) => (i === 0 && j > 0 && j < 17) || (i < 3 && j > 1 && j < 12) ? null : <rect key={`${i}-${j}`} x={6 + j * 6.1} y={12 + i * 9} width={5.4} height={8} fill={j === 0 ? 'var(--cyan)' : j > 11 ? 'var(--warn)' : 'var(--bg-3)'} opacity={j === 0 || j > 11 ? 0.55 : 1} stroke={M} strokeWidth={0.4} />))}</g>,
  dna: () => <g>{p(wave(14, 106, 36, 16, 2, 0), A, 1.6)}{p(wave(14, 106, 36, 16, 2, Math.PI), W, 1.6)}{Array.from({ length: 11 }, (_, i) => { const x = 18 + i * 8.5; const y1 = 36 - 16 * Math.sin(((x - 14) / 92) * 4 * Math.PI); return ln(x, y1, x, 72 - y1, M, 0.8); })}</g>,
  tree: () => <g>{KL([[60, 14], [36, 34], [84, 34], [24, 56], [48, 56], [72, 56], [96, 56]].map(([x, y], i) => <g key={i}>{ci(x, y, 6, i === 0 ? A : S, 1.3, F)}</g>))}{p('M56 18 L40 30 M64 18 L80 30 M33 39 L27 51 M39 39 L45 51 M81 39 L75 51 M87 39 L93 51', M, 1)}</g>,
  gate: () => <g>{p('M40 18 L60 18 A18 18 0 0 1 60 54 L40 54 Z', A, 1.6, F)}{ln(20, 28, 40, 28)}{ln(20, 44, 40, 44)}{ln(78, 36, 100, 36)}{tx(14, 31, 'A', M, 7)}{tx(14, 47, 'B', M, 7)}{tx(106, 39, 'Y', A, 7)}</g>,
  springFx: () => <g>{rc(10, 20, 6, 32, S, 1.2, F)}{p(zig(16, 76, 36, 8, 10), A, 1.4)}{rc(76, 26, 16, 20, S, 1.2, F)}{arrow(92, 36, 112, 36)}{tx(102, 30, 'F', W, 7)}{tx(46, 58, 'F = k·x', M, 7)}</g>,
  pv: () => <g>{axes()}{p('M24 16 Q34 50 100 56', A, 1.6, 'none')}{p('M36 16 Q46 44 102 48', M, 1, 'none')}{tx(104, 70, 'V', M, 7, 'end')}{tx(22, 14, 'p', M, 7, 'start')}{tx(84, 40, 'T', A, 7)}</g>,
  beaker: () => <g>{p('M36 12 L36 60 Q36 64 40 64 L80 64 Q84 64 84 60 L84 12', S, 1.4)}{rc(37, 36, 46, 27, A, 0, 'var(--accent-soft, #12303a)')}{ln(37, 36, 83, 36, A, 1.2)}{KL([24, 36, 48].map((y) => ln(84, y, 78, y, M, 0.8)))}{tx(100, 40, 'mol/L', A, 6)}</g>,
  decay: () => <g>{axes()}{p('M18 16 Q30 40 50 48 Q70 56 104 59', A, 1.6, 'none')}{ln(18, 38, 36, 38, M, 0.8, '2 2')}{ln(36, 38, 36, 62, M, 0.8, '2 2')}{tx(36, 70, 't½', M, 6)}</g>,
  laminar: () => <g>{rc(10, 18, 100, 36, S, 1.2)}{KL([24, 30, 36, 42, 48].map((y, i) => p(i === 2 ? 'M10 36 L110 36' : `M10 ${y} C40 ${y}, 70 ${y + (i % 2 ? 3 : -3)}, 110 ${y}`, i === 2 ? A : M, i === 2 ? 1.4 : 0.9)))}{tx(60, 66, 'Re = ρvD/μ', A, 7)}</g>,
  rocket: () => <g>{p('M60 6 Q70 18 70 34 L70 52 L50 52 L50 34 Q50 18 60 6 Z', S, 1.4, F)}{p('M50 42 L42 56 L50 52 M70 42 L78 56 L70 52', S, 1.2)}{p('M54 52 L60 68 L66 52', W, 1.2, 'var(--warn-soft, #3a2d17)')}{ci(60, 28, 4, A)}{tx(94, 30, 'Δv', A, 8)}</g>,
  orbit: () => <g>{ci(60, 36, 22, M, 1, 'none', '3 2')}{ci(60, 36, 3, S, 1, S)}{ci(82, 36, 5, A, 1.4, F)}{arrow(82, 36, 66, 36)}{arrow(82, 31, 82, 14, A)}{tx(70, 30, 'Fc', W, 7)}</g>,
  ke: () => <g>{rc(30, 30, 28, 18, S, 1.4, F, 2)}{ci(36, 50, 4)}{ci(52, 50, 4)}{ln(10, 54, 110, 54, M, 1)}{arrow(62, 38, 92, 38, A)}{tx(98, 42, 'v', A, 8, 'start')}{tx(44, 24, '½mv²', M, 7)}</g>,
  fma: () => <g>{rc(42, 26, 30, 24, S, 1.4, F)}{tx(57, 42, 'm', M, 9)}{arrow(10, 38, 40, 38)}{arrow(74, 38, 104, 38, A)}{ln(10, 52, 110, 52, M, 1)}{tx(20, 32, 'F', W, 7)}{tx(96, 32, 'a', A, 7)}</g>,
  buoy: () => <g>{rc(26, 16, 68, 48, S, 1.4, 'none')}{rc(27, 30, 66, 33, A, 0, 'var(--accent-soft, #12303a)')}{p(wave(27, 93, 30, 1.2, 3), A, 1)}{rc(48, 22, 22, 18, S, 1.3, F)}{arrow(59, 52, 59, 42, A)}{tx(104, 40, 'SG', M, 7)}</g>,

  /* ── platform ── */
  grad: () => <g>{p('M20 30 L60 14 L100 30 L60 46 Z', S, 1.4, F)}{p('M36 36 L36 50 Q60 62 84 50 L84 36', S, 1.4)}{ln(100, 30, 100, 50, A, 1.4)}{ci(100, 52, 2.5, A, 1, A)}</g>,
  sensors: () => <g>{rc(44, 8, 32, 56, S, 1.4, F, 5)}{ci(60, 32, 9, A, 1.2)}{ln(60, 32, 66, 26, A, 1.4)}{p('M84 20 A14 14 0 0 1 84 44 M90 14 A22 22 0 0 1 90 50', M, 1)}{p('M36 20 A14 14 0 0 0 36 44', M, 1)}</g>,
  phone: () => <g>{rc(30, 8, 30, 56, S, 1.4, F, 5)}{rc(70, 20, 22, 30, S, 1.4, F, 6)}{rc(34, 14, 22, 40, A, 0.8, 'var(--accent-soft, #12303a)', 2)}{ci(81, 35, 6, A, 1.2)}{ln(81, 35, 81, 31, A, 1.2)}</g>,
};

/** tool id → glyph key; anything unknown falls back to its pillar glyph */
const BY_ID: Record<string, string> = {
  'design-studio': 'cube', 'parametric-cad': 'cubeParam', 'cad-editor': 'cad2d', 'sketch-pad': 'sketch', fea: 'fea', flow: 'flow',
  'nesting-2d': 'nesting', 'cutting-optimizer': 'cutbar',
  'bolt-torque': 'bolt', 'thread-stripping-area': 'thread', 'keyway-connection': 'keyway', 'press-fit': 'pressfit', 'o-ring': 'oring',
  bearings: 'bearing', gears: 'gear', 'planetary-gearbox': 'planetary', 'gearbox-design': 'gearbox', shafts: 'shaft',
  'advanced-spring': 'spring', 'chain-drive': 'chain', 'belt-drive': 'belt', 'motor-selection-std': 'motor', vibration: 'vibration', handbook: 'book',
  'beam-deflection': 'beam', 'bending-moment': 'sfd', 'column-buckling': 'column', 'concrete-reinforcement': 'rc', 'materials-db': 'db',
  'materials-explorer': 'matrix', 'material-selector-ai': 'pareto', fits: 'fits', 'sheet-metal': 'sheet', 'machining-details': 'lathe',
  'machining-time': 'clockTool', welding: 'weld', 'welding-fillet': 'fillet', 'profile-weight': 'profile', 'cost-estimator': 'cost',
  'strength-analysis': 'mohr', 'manufacturing-readiness': 'mrl', 'manufacturing-sandbox': 'cam', 'engineering-selection': 'selection',
  manufacturing: 'process', 'truss-analysis': 'truss',
  'heat-sink': 'heatsink', 'thermal-expansion': 'expansion', pumps: 'pump', 'fluid-dynamics': 'pipe', 'pipe-friction': 'fittings',
  'pressure-vessel': 'vessel', 'hvac-load': 'hvac', 'reducer-lubrication': 'oilbath', 'wind-tunnel': 'airfoil', 'aerospace-dynamics': 'atmo',
  'lift-coefficient': 'airfoilCl', 'three-phase-power': 'sine3', 'ohms-law': 'circuit', 'voltage-drop': 'cable',
  'transformer-calculation': 'transformer', 'filter-design': 'bode',
  calculator: 'calc', 'unit-converter': 'convert', 'physics-solver': 'pendulum', 'physics-kinematics': 'projectile',
  'fatigue-analysis': 'goodman', 'fatigue-advanced': 'sn', 'failure-prediction': 'bathtub', 'chemistry-reactions': 'flask',
  'periodic-table': 'periodic', 'biology-genetics': 'dna', 'cs-algorithms': 'tree', 'digital-logic': 'gate', 'hooke-law': 'springFx',
  'ideal-gas-law': 'pv', 'chemical-molarity': 'beaker', 'radioactive-decay': 'decay', 'reynolds-number': 'laminar',
  'rocket-equation': 'rocket', 'centripetal-force': 'orbit', 'kinetic-energy': 'ke', 'newton-second-law': 'fma', 'specific-gravity': 'buoy',
  academy: 'grad', field: 'sensors', mobile: 'phone',
};
const BY_PILLAR: Record<string, string> = {
  cad_design: 'cube', mechanical: 'gear', materials_mfg: 'beam', fluids_thermal_power: 'pipe', science_theory: 'calc', platform_academy: 'grad',
};

export function glyphKeyFor(id: string, pillar?: string) {
  return BY_ID[id] ?? (pillar ? BY_PILLAR[pillar] : undefined) ?? 'calc';
}

/** glyph bodies build children with .map / Array.from — give every array child a stable key */
function withKeys(n: React.ReactNode): React.ReactNode {
  if (Array.isArray(n)) {
    return n.map((c, i) => {
      const f = withKeys(c);
      return React.isValidElement(f) && f.key == null ? React.cloneElement(f, { key: i }) : f;
    });
  }
  if (React.isValidElement(n)) {
    const ch = (n.props as { children?: React.ReactNode }).children;
    if (ch === undefined || typeof ch === 'string' || typeof ch === 'number') return n;
    return React.cloneElement(n, undefined, withKeys(ch));
  }
  return n;
}

const CACHE = new Map<string, React.ReactNode>();

export function SolverGlyph({ id, pillar, className, title }: { id: string; pillar?: string; className?: string; title?: string }) {
  const key = glyphKeyFor(id, pillar);
  let body = CACHE.get(key);
  if (body === undefined) {
    body = withKeys((GLYPHS[key] ?? GLYPHS.calc)());
    CACHE.set(key, body);
  }
  return (
    <svg viewBox="0 0 120 72" className={className} role={title ? 'img' : 'presentation'} aria-label={title} aria-hidden={title ? undefined : true}>
      {body}
    </svg>
  );
}

export const SOLVER_GLYPH_KEYS = Object.keys(GLYPHS);
export default SolverGlyph;
