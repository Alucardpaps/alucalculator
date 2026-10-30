/**
 * Handbook-style basic profiles in the pitch-line frame.
 * x along the axis (mm), y = 0 at the pitch cylinder, +y radially outward (mm).
 * Male crest is +y, male root is −y. Female is the mating inverse.
 */

import {
  ISO60,
  NPT,
  WHITWORTH,
  kindOf,
  type ThreadProfileKind,
} from './threadProfiles';

export type Pt = { x: number; y: number };

export type HandbookProfile = {
  kind: ThreadProfileKind;
  P: number;
  H: number;
  angleDeg: number;
  angleLabel: string;
  yMaleCrest: number;
  yFemaleMinor: number;
  yMaleRoot: number;
  yFemaleMajor: number;
  crestFlatMale: number;
  crestFlatFemale: number;
  rootR: number;
  male: Pt[];
  female: Pt[];
  sharp: Pt[];
};

function n4(v: number) {
  return Number(v.toFixed(5));
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number, steps = 10): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = a0 + (a1 - a0) * t;
    pts.push({ x: n4(cx + r * Math.cos(a)), y: n4(cy + r * Math.sin(a)) });
  }
  return pts;
}

function tile(unit: Pt[], n: number, P: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const slice = i === 0 ? unit : unit.slice(1);
    for (const p of slice) out.push({ x: n4(p.x + i * P), y: p.y });
  }
  return out;
}

function iso60Unit(P: number) {
  const H = ISO60.H_over_P * P;
  const R = H / 6;
  const yCrest = (3 * H) / 8;
  const yD1 = -H / 4;
  const yRoot = -H / 3;
  const cy = yRoot + R;
  const male: Pt[] = [
    ...arc(0, cy, R, (270 * Math.PI) / 180, (310 * Math.PI) / 180, 6),
    { x: P / 8, y: yD1 },
    { x: P / 2 - P / 16, y: yCrest },
    { x: P / 2 + P / 16, y: yCrest },
    { x: (7 * P) / 8, y: yD1 },
    ...arc(P, cy, R, (230 * Math.PI) / 180, (270 * Math.PI) / 180, 6),
  ];
  const female: Pt[] = [
    { x: 0, y: yD1 },
    { x: P / 8, y: yD1 },
    { x: P / 2 - P / 16, y: H / 2 },
    { x: P / 2 + P / 16, y: H / 2 },
    { x: (7 * P) / 8, y: yD1 },
    { x: P, y: yD1 },
  ];
  const sharp: Pt[] = [
    { x: 0, y: -H / 2 },
    { x: P / 2, y: H / 2 },
    { x: P, y: -H / 2 },
  ];
  return {
    H,
    yMaleCrest: yCrest,
    yFemaleMinor: yD1,
    yMaleRoot: yRoot,
    yFemaleMajor: H / 2,
    crestFlatMale: P / 8,
    crestFlatFemale: P / 4,
    rootR: R,
    male,
    female,
    sharp,
  };
}

function whitworthUnit(P: number) {
  const h = WHITWORTH.h_over_P * P;
  const r = WHITWORTH.r_over_P * P;
  const a = (27.5 * Math.PI) / 180;
  const yC = h / 2;
  const yR = -h / 2;
  const ccy = yC - r;
  const rcy = yR + r;
  const deg = (d: number) => (d * Math.PI) / 180;
  const male: Pt[] = [
    ...arc(0, ccy, r, Math.PI / 2 + a, Math.PI / 2 - a, 8),
    ...arc(P / 2, rcy, r, deg(270 - 27.5), deg(270 + 27.5), 8),
    ...arc(P, ccy, r, Math.PI / 2 + a, Math.PI / 2, 4),
  ];
  const female: Pt[] = [
    ...arc(0, rcy, r, deg(270 - 27.5), deg(270 + 27.5), 8),
    ...arc(P / 2, ccy, r, Math.PI / 2 + a, Math.PI / 2 - a, 8),
    ...arc(P, rcy, r, deg(270 - 27.5), deg(270), 4),
  ];
  const sharp: Pt[] = [
    { x: 0, y: yC },
    { x: P / 2, y: yR },
    { x: P, y: yC },
  ];
  return {
    H: h,
    yMaleCrest: yC,
    yFemaleMinor: yR,
    yMaleRoot: yR,
    yFemaleMajor: yC,
    crestFlatMale: 0,
    crestFlatFemale: 0,
    rootR: r,
    male,
    female,
    sharp,
  };
}

function nptUnit(P: number) {
  const h = NPT.h_over_P * P;
  const H = NPT.H_over_P * P;
  const trunc = NPT.trunc_over_P * P;
  const flat = trunc / Math.tan(Math.PI / 6);
  const yC = h / 2;
  const yR = -h / 2;
  const male: Pt[] = [
    { x: 0, y: yR },
    { x: flat, y: yR },
    { x: P / 2 - flat, y: yC },
    { x: P / 2 + flat, y: yC },
    { x: P - flat, y: yR },
    { x: P, y: yR },
  ];
  const female: Pt[] = [
    { x: 0, y: yC },
    { x: flat, y: yC },
    { x: P / 2 - flat, y: yR },
    { x: P / 2 + flat, y: yR },
    { x: P - flat, y: yC },
    { x: P, y: yC },
  ];
  const sharp: Pt[] = [
    { x: 0, y: -H / 2 },
    { x: P / 2, y: H / 2 },
    { x: P, y: -H / 2 },
  ];
  return {
    H,
    yMaleCrest: yC,
    yFemaleMinor: yR,
    yMaleRoot: yR,
    yFemaleMajor: yC,
    crestFlatMale: 2 * flat,
    crestFlatFemale: 2 * flat,
    rootR: 0,
    male,
    female,
    sharp,
  };
}

function trapUnit(P: number, includedDeg: number, hOverP: number) {
  const h = hOverP * P;
  const half = (includedDeg * Math.PI) / 360;
  const yC = h / 2;
  const yR = -h / 2;
  const slope = h * Math.tan(half);
  const crest = Math.max(P * 0.18, P - 2 * slope);
  const inset = (P - crest) / 2;
  const male: Pt[] = [
    { x: 0, y: yR },
    { x: inset - slope < 0 ? 0 : inset - slope, y: yR },
    { x: inset, y: yC },
    { x: inset + crest, y: yC },
    { x: P - Math.max(0, inset - slope), y: yR },
    { x: P, y: yR },
  ];
  const female: Pt[] = [
    { x: 0, y: yC },
    { x: Math.max(0, inset - slope), y: yC },
    { x: inset, y: yR },
    { x: inset + crest, y: yR },
    { x: P - Math.max(0, inset - slope), y: yC },
    { x: P, y: yC },
  ];
  const sharp: Pt[] = [
    { x: inset, y: yC },
    { x: P / 2, y: yR },
    { x: inset + crest, y: yC },
  ];
  return {
    H: h,
    yMaleCrest: yC,
    yFemaleMinor: yR,
    yMaleRoot: yR,
    yFemaleMajor: yC,
    crestFlatMale: crest,
    crestFlatFemale: crest,
    rootR: 0,
    male,
    female,
    sharp,
  };
}

function buttressUnit(P: number) {
  const h = 0.6 * P;
  const yC = h / 2;
  const yR = -h / 2;
  const load = h * Math.tan((7 * Math.PI) / 180);
  const clear = h * Math.tan((45 * Math.PI) / 180);
  const male: Pt[] = [
    { x: 0, y: yC },
    { x: load, y: yR },
    { x: P - clear, y: yR },
    { x: P, y: yC },
  ];
  const female: Pt[] = [
    { x: 0, y: yR },
    { x: load, y: yC },
    { x: P - clear, y: yC },
    { x: P, y: yR },
  ];
  return {
    H: h,
    yMaleCrest: yC,
    yFemaleMinor: yR,
    yMaleRoot: yR,
    yFemaleMajor: yC,
    crestFlatMale: 0,
    crestFlatFemale: 0,
    rootR: 0,
    male,
    female,
    sharp: male,
  };
}

function squareUnit(P: number) {
  const h = 0.5 * P;
  const yC = h / 2;
  const yR = -h / 2;
  const w = 0.5 * P;
  const male: Pt[] = [
    { x: 0, y: yC },
    { x: w, y: yC },
    { x: w, y: yR },
    { x: P, y: yR },
    { x: P, y: yC },
  ];
  const female: Pt[] = [
    { x: 0, y: yR },
    { x: w, y: yR },
    { x: w, y: yC },
    { x: P, y: yC },
    { x: P, y: yR },
  ];
  return {
    H: h,
    yMaleCrest: yC,
    yFemaleMinor: yR,
    yMaleRoot: yR,
    yFemaleMajor: yC,
    crestFlatMale: w,
    crestFlatFemale: w,
    rootR: 0,
    male,
    female,
    sharp: male,
  };
}

function pgUnit(P: number) {
  const H = P / (2 * Math.tan((40 * Math.PI) / 180));
  const h = 0.5 * H;
  const yC = h / 2;
  const yR = -h / 2;
  const slope = h * Math.tan((40 * Math.PI) / 180);
  const crest = P * 0.15;
  const inset = (P - crest) / 2;
  const male: Pt[] = [
    { x: 0, y: yR },
    { x: Math.max(0, inset - slope), y: yR },
    { x: inset, y: yC },
    { x: inset + crest, y: yC },
    { x: P - Math.max(0, inset - slope), y: yR },
    { x: P, y: yR },
  ];
  const female: Pt[] = [
    { x: 0, y: yC },
    { x: Math.max(0, inset - slope), y: yC },
    { x: inset, y: yR },
    { x: inset + crest, y: yR },
    { x: P - Math.max(0, inset - slope), y: yC },
    { x: P, y: yC },
  ];
  return {
    H,
    yMaleCrest: yC,
    yFemaleMinor: yR,
    yMaleRoot: yR,
    yFemaleMajor: yC,
    crestFlatMale: crest,
    crestFlatFemale: crest,
    rootR: 0,
    male,
    female,
    sharp: [
      { x: 0, y: -H / 2 },
      { x: P / 2, y: H / 2 },
      { x: P, y: -H / 2 },
    ],
  };
}

function roundUnit(P: number) {
  const r = 0.23851 * P;
  const h = 0.5 * P;
  const male: Pt[] = [];
  const female: Pt[] = [];
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = t * P;
    male.push({ x: n4(x), y: n4(h * Math.cos(2 * Math.PI * t)) });
    female.push({ x: n4(x), y: n4(-h * Math.cos(2 * Math.PI * t)) });
  }
  return {
    H: h,
    yMaleCrest: h,
    yFemaleMinor: -h,
    yMaleRoot: -h,
    yFemaleMajor: h,
    crestFlatMale: 0,
    crestFlatFemale: 0,
    rootR: r,
    male,
    female,
    sharp: [
      { x: 0, y: h },
      { x: P / 2, y: -h },
      { x: P, y: h },
    ],
  };
}

const META: Record<ThreadProfileKind, { angleDeg: number; angleLabel: string }> = {
  iso60: { angleDeg: 60, angleLabel: '60°' },
  whitworth: { angleDeg: 55, angleLabel: '55°' },
  npt: { angleDeg: 60, angleLabel: '60°' },
  nps: { angleDeg: 60, angleLabel: '60°' },
  jic: { angleDeg: 60, angleLabel: '60°' },
  sae_orb: { angleDeg: 60, angleLabel: '60°' },
  orfs: { angleDeg: 60, angleLabel: '60°' },
  tr: { angleDeg: 30, angleLabel: '30°' },
  acme: { angleDeg: 29, angleLabel: '29°' },
  acme_stub: { angleDeg: 29, angleLabel: '29° (stub)' },
  buttress: { angleDeg: 45, angleLabel: '7° / 45°' },
  square: { angleDeg: 0, angleLabel: '0°' },
  round: { angleDeg: 30, angleLabel: 'Rd' },
  pg: { angleDeg: 80, angleLabel: '80°' },
  edison: { angleDeg: 0, angleLabel: 'Round Wave' },
  valve: { angleDeg: 60, angleLabel: '60°' },
  gas_w: { angleDeg: 55, angleLabel: '55°' },
  conduit: { angleDeg: 60, angleLabel: '60°' },
};

export function handbookProfile(kind: ThreadProfileKind, P: number, nPitches = 2): HandbookProfile {
  const p = Math.max(P, 1e-6);
  const n = Math.max(1, nPitches);
  let u: ReturnType<typeof iso60Unit>;
  switch (kind) {
    case 'whitworth':
    case 'gas_w':
      u = whitworthUnit(p);
      break;
    case 'npt':
    case 'nps':
    case 'conduit':
      u = nptUnit(p);
      break;
    case 'tr':
      u = trapUnit(p, 30, 0.5);
      break;
    case 'acme':
      u = trapUnit(p, 29, 0.5);
      break;
    case 'acme_stub':
      u = trapUnit(p, 29, 0.3);
      break;
    case 'buttress':
      u = buttressUnit(p);
      break;
    case 'square':
      u = squareUnit(p);
      break;
    case 'round':
    case 'edison':
      u = roundUnit(p);
      break;
    case 'pg':
      u = pgUnit(p);
      break;
    default:
      u = iso60Unit(p);
  }
  const meta = META[kind] || META.iso60;
  return {
    kind,
    P: p,
    H: u.H,
    angleDeg: meta.angleDeg,
    angleLabel: meta.angleLabel,
    yMaleCrest: u.yMaleCrest,
    yFemaleMinor: u.yFemaleMinor,
    yMaleRoot: u.yMaleRoot,
    yFemaleMajor: u.yFemaleMajor,
    crestFlatMale: u.crestFlatMale,
    crestFlatFemale: u.crestFlatFemale,
    rootR: u.rootR,
    male: tile(u.male, n, p),
    female: tile(u.female, n, p),
    sharp: tile(u.sharp, n, p),
  };
}

export function handbookForType(type: string, P: number, nPitches = 2) {
  return handbookProfile(kindOf(type), P, nPitches);
}

export function polyOpen(pts: Pt[], Y: (y: number) => number = (y) => -y): string {
  if (!pts.length) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(4)} ${Y(p.y).toFixed(4)}`).join(' ');
}

export function polyClosed(pts: Pt[], yClose: number, Y: (y: number) => number = (y) => -y): string {
  if (!pts.length) return '';
  const last = pts[pts.length - 1];
  const first = pts[0];
  return `${polyOpen(pts, Y)} L ${last.x.toFixed(4)} ${Y(yClose).toFixed(4)} L ${first.x.toFixed(4)} ${Y(yClose).toFixed(4)} Z`;
}

/** Closed male axial-section polygon. rPitch is the pitch-cylinder radius at each end. */
export function axialMalePolygon(
  kind: ThreadProfileKind,
  P: number,
  x0: number,
  x1: number,
  cy: number,
  rPitch0: number,
  rPitch1: number,
): string {
  const span = Math.abs(x1 - x0);
  // Prevent micro-tooth mesh blowout: clamp tooth count between 2 and 24
  const visualP = Math.max(P, span / 24);
  const n = Math.max(2, Math.min(24, Math.round(span / visualP)));
  const hb = handbookProfile(kind, visualP, n);
  const L = n * visualP;
  const map = (sign: 1 | -1) =>
    hb.male.map((p) => {
      const t = p.x / L;
      const rP = rPitch0 + (rPitch1 - rPitch0) * t;
      return `${(x0 + t * span).toFixed(2)},${(cy + sign * (rP + p.y)).toFixed(2)}`;
    });
  return `${map(-1).join(' ')} ${map(1).reverse().join(' ')}`;
}
