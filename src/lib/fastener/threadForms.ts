/**
 * Thread form geometry for drawings (pure math, no React).
 *
 * Every form is built from its fundamental (sharp) triangle: flank half-angles βL / βR
 * measured from the radial direction, sharp height Hs = P / (tan βL + tan βR). The male and
 * the female profile share the SAME flank lines (basic profile, so they mate on the flanks)
 * and only differ in how the sharp crest / root is truncated (flat at depth t, or arc of
 * radius r tangent to both flanks). Values from the basic-profile standards:
 *   ISO 68-1 (60°) · ASME B1.1 UN (60°) · ASME B1.20.1 NPT (60°, h = 0.8P)
 *   BS 84 / ISO 228 / ISO 7 Whitworth (55°, r = 0.137329P, h = 0.640327P)
 *   ISO 2901 Tr (30°, H1 = 0.5P, flats 0.366P, clearance ac) · ASME B1.5 Acme (29°, 0.5P, flats 0.3707P)
 *   ASME B1.9 buttress (7°/45°, h = 0.6P) · DIN 405 round (30°, R 0.23851P / 0.25597P)
 *   DIN 40430 Pg (80°) · square (0°, h = 0.5P)
 *
 * Local coordinates: x along the axis, y radial (up = away from the axis), y = 0 at the
 * sharp apex of the fundamental triangle, one tooth centred on x = 0.
 */
import type { ThreadProfileKind } from './threadProfiles';

export interface Rounding { t?: number; r?: number }
export interface FormSpec {
  kind: ThreadProfileKind;
  P: number;
  /** flank half-angles from the radial direction, degrees (leading = left/-x, trailing = right/+x) */
  bL: number;
  bR: number;
  Hs: number;
  /** male: top = crest (at d), bottom = root (at d3) */
  male: { top: Rounding; bottom: Rounding };
  /** female: top = root (at D), bottom = crest (at D1) */
  female: { top: Rounding; bottom: Rounding };
  label: string;
  angleLabel: string;
  standard: string;
  square?: boolean;
  /** taper on diameter (NPT / BSPT: 1/16) */
  taper?: number;
}

const tan = (deg: number) => Math.tan((deg * Math.PI) / 180);
const sin = (deg: number) => Math.sin((deg * Math.PI) / 180);

/** ISO 2901 basic clearance ac by pitch */
const trClearance = (P: number) => (P <= 1.5 ? 0.15 : P <= 5 ? 0.25 : P <= 12 ? 0.5 : 1);

export function threadForm(kind: ThreadProfileKind, P: number): FormSpec {
  switch (kind) {
    case 'whitworth':
    case 'gas_w': {
      const Hs = 0.960491 * P, r = 0.137329 * P;
      return {
        kind, P, bL: 27.5, bR: 27.5, Hs,
        male: { top: { r }, bottom: { r } },
        // small radial play so the mating view is legible (basic profile has none)
        female: { top: { r: 0.11 * P }, bottom: { r: 0.165 * P } },
        label: 'Whitworth 55°', angleLabel: '55°', standard: 'BS 84 · ISO 228-1 · ISO 7-1',
      };
    }
    case 'npt': {
      const Hs = 0.866025 * P, t = (Hs - 0.8 * P) / 2; // h = 0.8P, truncation 0.033P
      return {
        kind, P, bL: 30, bR: 30, Hs,
        male: { top: { t }, bottom: { t } },
        female: { top: { t: t * 0.55 }, bottom: { t: t * 1.45 } }, // spiral clearance (non-dryseal NPT)
        label: 'NPT 60°', angleLabel: '60°', standard: 'ASME B1.20.1', taper: 1 / 16,
      };
    }
    case 'tr': {
      const Hs = P / (2 * tan(15)), flat = 0.366 * P, t = flat / (2 * tan(15));
      const ac = trClearance(P);
      return {
        kind, P, bL: 15, bR: 15, Hs,
        male: { top: { t }, bottom: { t: Math.max(0.01 * P, Hs - t - 0.5 * P - ac) } },
        female: { top: { t: Math.max(0.01 * P, t - ac) }, bottom: { t: Hs - t - 0.5 * P } },
        label: 'Tr 30°', angleLabel: '30°', standard: 'ISO 2901 · DIN 103',
      };
    }
    case 'acme':
    case 'acme_stub': {
      const stub = kind === 'acme_stub';
      const Hs = P / (2 * tan(14.5));
      const depth = stub ? 0.3 * P : 0.5 * P;
      const flat = stub ? 0.4224 * P : 0.3707 * P;
      const t = flat / (2 * tan(14.5));
      const c = 0.05 * P;
      return {
        kind, P, bL: 14.5, bR: 14.5, Hs,
        male: { top: { t }, bottom: { t: Math.max(0.01 * P, Hs - t - depth - c) } },
        female: { top: { t: Math.max(0.01 * P, t - c) }, bottom: { t: Hs - t - depth } },
        label: stub ? 'Stub Acme 29°' : 'Acme 29°', angleLabel: '29°', standard: 'ASME B1.5 · B1.8',
      };
    }
    case 'buttress': {
      const Hs = P / (tan(7) + tan(45)); // 0.89064 P
      const tc = 0.14532 * P / (tan(7) + tan(45));
      const tr = Hs - 0.6 * P - tc;
      return {
        kind, P, bL: 7, bR: 45, Hs,
        male: { top: { t: tc }, bottom: { t: tr } },
        female: { top: { t: tc * 0.6 }, bottom: { t: tr * 1.25 } },
        label: 'Buttress 7°/45°', angleLabel: '7° / 45°', standard: 'ASME B1.9 (DIN 513: 3°/30°)',
      };
    }
    case 'square': {
      return {
        kind, P, bL: 0, bR: 0, Hs: 0.5 * P, square: true,
        male: { top: { t: 0 }, bottom: { t: 0 } },
        female: { top: { t: 0 }, bottom: { t: 0 } },
        label: 'Square', angleLabel: '0°', standard: 'Power screw',
      };
    }
    case 'round':
    case 'edison': {
      const Hs = P / (2 * tan(15));
      return {
        kind, P, bL: 15, bR: 15, Hs,
        male: { top: { r: 0.23851 * P }, bottom: { r: 0.25597 * P } },
        female: { top: { r: 0.2 * P }, bottom: { r: 0.3 * P } },
        label: kind === 'edison' ? 'Edison (round)' : 'Round 30°', angleLabel: '30°', standard: kind === 'edison' ? 'IEC 60061-1' : 'DIN 405',
      };
    }
    case 'pg': {
      const Hs = P / (2 * tan(40));
      return {
        kind, P, bL: 40, bR: 40, Hs,
        male: { top: { r: 0.1 * P }, bottom: { r: 0.1 * P } },
        female: { top: { r: 0.07 * P }, bottom: { r: 0.13 * P } },
        label: 'Pg 80°', angleLabel: '80°', standard: 'DIN 40430',
      };
    }
    default: {
      // ISO 68-1 / UN 60°: male crest flat H/8, external root R = H/6 (→ d3, h3 = 17/24 H);
      // female crest (D1) flat H/4, female root slightly beyond D (H/16) → radial play visible
      const Hs = 0.866025 * P;
      return {
        kind, P, bL: 30, bR: 30, Hs,
        male: { top: { t: Hs / 8 }, bottom: { r: Hs / 6 } },
        female: { top: { t: Hs / 16 }, bottom: { t: Hs / 4 } },
        label: '60°', angleLabel: '60°', standard: kind === 'iso60' ? 'ISO 68-1' : 'ASME B1.1',
        taper: undefined,
      };
    }
  }
}

/** depth below the sharp apex of a rounded/flat top feature (outermost point of the boundary) */
export function topDepth(f: FormSpec, r: Rounding): number {
  if (f.square) return 0;
  if (r.r) {
    const b = Math.min(f.bL, f.bR);
    return r.r / sin(b) - r.r;
  }
  return r.t ?? 0;
}
/** height above the sharp root of a bottom feature (innermost point of the boundary) */
export function bottomRise(f: FormSpec, r: Rounding): number {
  if (f.square) return 0;
  if (r.r) {
    const b = Math.min(f.bL, f.bR);
    return r.r / sin(b) - r.r;
  }
  return r.t ?? 0;
}

/**
 * Boundary of one profile (male or female) as a polyline over [x0, x1], y relative to the apex.
 * Male material is below it, female material above.
 */
export function profileBoundary(f: FormSpec, which: 'male' | 'female', x0: number, x1: number, samplesPerArc = 10): [number, number][] {
  const P = f.P;
  const spec = f[which];
  const pts: [number, number][] = [];
  if (f.square) {
    // male: tooth width P/2 at x ∈ [-P/4, P/4], depth 0.5P; female offset by a small play
    const play = which === 'female' ? 0.025 * P : 0;
    const h = 0.5 * P;
    const start = Math.floor((x0 + P / 2) / P) - 1;
    for (let k = start; k * P - P / 2 <= x1 + P; k++) {
      const c = k * P;
      const a = P / 4 + play, yTop = play, yBot = -h + play;
      pts.push([c - P / 2, yBot], [c - a, yBot], [c - a, yTop], [c + a, yTop], [c + a, yBot]);
    }
    return clipX(pts, x0, x1);
  }
  const tL = tan(f.bL), tR = tan(f.bR);
  const xRootR = f.Hs * tR, xRootL = -f.Hs * tL; // sharp roots right/left of the apex at x = 0
  const one = (c: number): [number, number][] => {
    const out: [number, number][] = [];
    // ── top feature (centred at the apex, x = c)
    const top = spec.top;
    if (top.r && f.bL === f.bR) {
      const b = f.bL, r = top.r, cy = -r / sin(b);
      for (let i = 0; i <= samplesPerArc; i++) {
        const ang = (180 - b) - ((180 - 2 * b) * i) / samplesPerArc; // 180−β → β through 90°
        out.push([c + r * Math.cos((ang * Math.PI) / 180), cy + r * Math.sin((ang * Math.PI) / 180)]);
      }
    } else {
      const t = top.t ?? 0;
      out.push([c - t * tL, -t], [c + t * tR, -t]);
    }
    // ── bottom feature (right sharp root, x = c + xRootR)
    const bot = spec.bottom;
    const xr = c + xRootR;
    if (bot.r && f.bL === f.bR) {
      const b = f.bL, r = bot.r, cy = -f.Hs + r / sin(b);
      for (let i = 0; i <= samplesPerArc; i++) {
        const ang = -(180 - b) + ((180 - 2 * b) * i) / samplesPerArc; // −(180−β) → −β through −90°
        // mirror so we travel left→right: start at the left tangent point
        const a2 = -180 + b + ((180 - 2 * b) * i) / samplesPerArc;
        void ang;
        out.push([xr + r * Math.cos((a2 * Math.PI) / 180), cy + r * Math.sin((a2 * Math.PI) / 180)]);
      }
    } else {
      const t = bot.t ?? 0;
      out.push([xr - t * tR, -f.Hs + t], [xr + t * tL, -f.Hs + t]);
    }
    return out;
  };
  // periods are P wide; start one before x0 so the left edge is covered
  const kStart = Math.floor((x0 - xRootR) / P) - 1;
  for (let k = kStart; k * P + xRootL <= x1 + P; k++) pts.push(...one(k * P));
  void xRootL;
  return clipX(pts, x0, x1);
}

function clipX(pts: [number, number][], x0: number, x1: number): [number, number][] {
  const out: [number, number][] = [];
  const lerp = (a: [number, number], b: [number, number], x: number): [number, number] => {
    const t = (x - a[0]) / (b[0] - a[0] || 1e-9);
    return [x, a[1] + t * (b[1] - a[1])];
  };
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[i + 1];
    if (p[0] >= x0 && p[0] <= x1) out.push(p);
    if (q) {
      if (p[0] < x0 && q[0] > x0) out.push(lerp(p, q, x0));
      if (p[0] < x1 && q[0] > x1) out.push(lerp(p, q, x1));
    }
  }
  return out;
}

/** key levels (y relative to the apex) for labels and dimensions */
export function formLevels(f: FormSpec) {
  const maleCrest = -topDepth(f, f.male.top);
  const maleRoot = -f.Hs + bottomRise(f, f.male.bottom);
  const femaleRoot = -topDepth(f, f.female.top);
  const femaleCrest = -f.Hs + bottomRise(f, f.female.bottom);
  const pitchLine = f.square ? -0.25 * f.P : -f.Hs / 2;
  return { maleCrest, maleRoot, femaleRoot, femaleCrest, pitchLine, sharpTop: 0, sharpBottom: -f.Hs };
}

/** crest flat widths (0 if rounded) */
export function crestFlat(f: FormSpec, r: Rounding) {
  if (f.square) return f.P / 2;
  if (r.r) return 0;
  const t = r.t ?? 0;
  return t * (tan(f.bL) + tan(f.bR));
}
export function rootFlat(f: FormSpec, r: Rounding) {
  if (f.square) return f.P / 2;
  if (r.r) return 0;
  const t = r.t ?? 0;
  return t * (tan(f.bL) + tan(f.bR));
}
