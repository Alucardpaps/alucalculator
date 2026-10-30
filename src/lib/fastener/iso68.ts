/** ISO 68-1:1998 metric thread — exact basic profile. All mm. */

export const ISO68 = {
  /** H / P = √3 / 2 */
  H_over_P: Math.sqrt(3) / 2,
  /** (d − d2) / P = 3/4 · √3/2 = 0.649519053 */
  k_d2: 0.649519052838,
  /** (d − D1) / P = 5/8 · √3 = 1.082531755 */
  k_D1: 1.08253175473,
  /** (d − d3) / P = 1.226869322 (external root, H/6 radius) */
  k_d3: 1.22686932156,
  /** External crest truncation / P = H/8 / P */
  crestMale_over_P: Math.sqrt(3) / 16,
  /** Internal crest truncation / P = H/4 / P */
  crestFemale_over_P: Math.sqrt(3) / 8,
  /** External root radius / P = H/6 / P */
  rootR_over_P: Math.sqrt(3) / 12,
  angleDeg: 60,
};

export type Iso68Profile = {
  P: number;
  H: number;
  angleDeg: 60;
  /** Male (external) 6g basic */
  d: number;
  d2: number;
  d3: number;
  crestMale: number;
  crestFlatMale: number;
  rootR: number;
  addendumMale: number;
  dedendumMale: number;
  /** Female (internal) 6H basic */
  D: number;
  D2: number;
  D1: number;
  crestFemale: number;
  crestFlatFemale: number;
  truncMajorFemale: number;
  addendumFemale: number;
  dedendumFemale: number;
  engagement: number;
};

export function iso68Profile(d: number, P: number): Iso68Profile {
  const H = ISO68.H_over_P * P;
  const d2 = d - ISO68.k_d2 * P;
  const d3 = d - ISO68.k_d3 * P;
  const D1 = d - ISO68.k_D1 * P;
  const D2 = d2;
  const D = d;
  const crestMale = H / 8;
  const crestFemale = H / 4;
  const truncMajorFemale = H / 8;
  const rootR = H / 6;
  return {
    P,
    H,
    angleDeg: 60,
    d,
    d2,
    d3,
    crestMale,
    crestFlatMale: P / 8,
    rootR,
    addendumMale: (d - d2) / 2,
    dedendumMale: (d2 - d3) / 2,
    D,
    D2,
    D1,
    crestFemale,
    crestFlatFemale: P / 4,
    truncMajorFemale,
    addendumFemale: (d2 - D1) / 2,
    dedendumFemale: (D - D2) / 2,
    engagement: (5 / 8) * H,
  };
}

const TAN30 = Math.tan(Math.PI / 6);

export type Iso68Pt = { x: number; y: number; k: 'root' | 'fillet' | 'crest' | 'arc' };

export type Iso68MaleTooth = {
  P: number;
  H: number;
  R: number;
  flank: number;
  yCrest: number;
  yPitch: number;
  yD1: number;
  yRoot: number;
  x: {
    root: number;
    filletL: number;
    crestL: number;
    crestR: number;
    filletR: number;
    root2: number;
    pitchRise: number;
    pitchFall: number;
  };
};

export type Iso68FemaleTooth = {
  P: number;
  H: number;
  flank: number;
  yMajor: number;
  yPitch: number;
  yMinor: number;
  x: {
    /** Minor-crest centre — mates with male root at the same x. */
    crest: number;
    crestR: number;
    majorL: number;
    majorC: number;
    majorR: number;
    crestL2: number;
    crest2: number;
    pitchRise: number;
    pitchFall: number;
  };
};

/** Pitch-line frame of ISO 68-1 (y=0 at d₂, +y outward). x=0 at sharp root / male root. */
export function iso68PitchFrame(P: number) {
  const H = ISO68.H_over_P * P;
  const flank = ((5 * H) / 8) * TAN30;
  return {
    P,
    H,
    R: H / 6,
    flank,
    ySharpCrest: H / 2,
    yMaleCrest: (3 * H) / 8,
    yPitch: 0,
    yD1: -H / 4,
    yD3: -H / 3,
    x: {
      root: 0,
      filletL: P / 8,
      crestL: P / 2 - P / 16,
      crestR: P / 2 + P / 16,
      filletR: (7 * P) / 8,
      root2: P,
    },
  };
}

/** One male pitch, x=0 at left root centre. Radii in mm. */
export function iso68MaleTooth(d: number, P: number): Iso68MaleTooth {
  const pr = iso68Profile(d, P);
  const flank = ((pr.d - pr.D1) / 2) * TAN30;
  const yCrest = pr.d / 2;
  const yPitch = pr.d2 / 2;
  const yD1 = pr.D1 / 2;
  const yRoot = pr.d3 / 2;
  const filletL = P / 8;
  const crestL = filletL + flank;
  const crestR = crestL + pr.crestFlatMale;
  const filletR = crestR + flank;
  const t = (yCrest - yD1) === 0 ? 0 : (yPitch - yD1) / (yCrest - yD1);
  return {
    P,
    H: pr.H,
    R: pr.rootR,
    flank,
    yCrest,
    yPitch,
    yD1,
    yRoot,
    x: {
      root: 0,
      filletL,
      crestL,
      crestR,
      filletR,
      root2: P,
      pitchRise: filletL + t * flank,
      pitchFall: crestR + (1 - t) * flank,
    },
  };
}

/**
 * One female pitch, x=0 at minor-crest centre (D₁).
 * This is the mating phase: female minor sits in the male root, female major around the male crest.
 */
export function iso68FemaleTooth(d: number, P: number): Iso68FemaleTooth {
  const pr = iso68Profile(d, P);
  const flank = ((pr.D - pr.D1) / 2) * TAN30;
  const yMajor = pr.D / 2;
  const yPitch = pr.D2 / 2;
  const yMinor = pr.D1 / 2;
  const crestR = P / 8;
  const majorL = crestR + flank;
  const majorC = P / 2;
  const majorR = majorL + P / 8;
  const crestL2 = (7 * P) / 8;
  const span = yMajor - yMinor;
  const tFromMinor = span === 0 ? 0 : (yPitch - yMinor) / span;
  const tFromMajor = span === 0 ? 0 : (yMajor - yPitch) / span;
  return {
    P,
    H: pr.H,
    flank,
    yMajor,
    yPitch,
    yMinor,
    x: {
      crest: 0,
      crestR,
      majorL,
      majorC,
      majorR,
      crestL2,
      crest2: P,
      pitchRise: crestR + tFromMinor * flank,
      pitchFall: majorR + tFromMajor * flank,
    },
  };
}

function polar(cx: number, cy: number, R: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
}

/**
 * External (male) ISO 68-1 axial section, 1 unit = 1 mm.
 * One pitch = crest P/8 + two 60° flanks + root span P/4 (H/6 fillet through d3).
 * y = 0 is the axis. sign +1 is +y.
 */
export function iso68MalePoints(d: number, P: number, x0: number, x1: number, sign: 1 | -1 = 1): Iso68Pt[] {
  const t = iso68MaleTooth(d, P);
  const n = Math.max(0, Math.floor((x1 - x0) / P + 1e-9));
  const pts: Iso68Pt[] = [];
  const Y = (y: number) => sign * y;
  const cy = t.yRoot + t.R;
  const pushPolar = (cx: number, deg: number, k: Iso68Pt['k']) => {
    const p = polar(cx, cy, t.R, deg);
    pts.push({ x: p.x, y: Y(p.y), k });
  };
  for (let i = 0; i < n; i++) {
    const xr = x0 + i * P;
    if (i === 0) {
      pts.push({ x: xr, y: Y(t.yRoot), k: 'root' });
      pushPolar(xr, 290, 'arc');
      pushPolar(xr, 310, 'arc');
    }
    pts.push({ x: xr + t.x.filletL, y: Y(t.yD1), k: 'fillet' });
    pts.push({ x: xr + t.x.crestL, y: Y(t.yCrest), k: 'crest' });
    pts.push({ x: xr + t.x.crestR, y: Y(t.yCrest), k: 'crest' });
    pts.push({ x: xr + t.x.filletR, y: Y(t.yD1), k: 'fillet' });
    const cx = xr + P;
    pushPolar(cx, 230, 'arc');
    pushPolar(cx, 250, 'arc');
    pts.push({ x: xr + P, y: Y(t.yRoot), k: 'root' });
    if (i < n - 1) {
      pushPolar(cx, 290, 'arc');
      pushPolar(cx, 310, 'arc');
    }
  }
  return pts;
}

/**
 * Internal (female) ISO 68-1 axial section, 1 unit = 1 mm.
 * One pitch = minor crest P/4 + two 60° flanks + major root P/8.
 */
export function iso68FemalePoints(d: number, P: number, x0: number, x1: number, sign: 1 | -1 = 1): Iso68Pt[] {
  const t = iso68FemaleTooth(d, P);
  const n = Math.max(0, Math.floor((x1 - x0) / P + 1e-9));
  const pts: Iso68Pt[] = [];
  const Y = (y: number) => sign * y;
  for (let i = 0; i < n; i++) {
    const xr = x0 + i * P;
    if (i === 0) pts.push({ x: xr, y: Y(t.yMinor), k: 'crest' });
    pts.push({ x: xr + t.x.crestR, y: Y(t.yMinor), k: 'crest' });
    pts.push({ x: xr + t.x.majorL, y: Y(t.yMajor), k: 'fillet' });
    pts.push({ x: xr + t.x.majorC, y: Y(t.yMajor), k: 'root' });
    pts.push({ x: xr + t.x.majorR, y: Y(t.yMajor), k: 'fillet' });
    pts.push({ x: xr + t.x.crestL2, y: Y(t.yMinor), k: 'crest' });
    pts.push({ x: xr + P, y: Y(t.yMinor), k: 'crest' });
  }
  return pts;
}

export function polylinePath(pts: Iso68Pt[]): string {
  if (!pts.length) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(4)} ${p.y.toFixed(4)}`).join(' ');
}

export function iso68MalePath(d: number, P: number, x0: number, x1: number, sign: 1 | -1 = 1): string {
  return polylinePath(iso68MalePoints(d, P, x0, x1, sign));
}

export function iso68FemalePath(d: number, P: number, x0: number, x1: number, sign: 1 | -1 = 1): string {
  return polylinePath(iso68FemalePoints(d, P, x0, x1, sign));
}
