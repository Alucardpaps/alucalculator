/**
 * Axially loaded column — flexural buckling.
 *
 * Normative tier:
 *   - EN 1993-1-1:2005 §6.3.1 (χ, Φ, λ̄, Table 6.1 imperfection factors, Table 6.2 curve selection)
 *   - AISC 360-16 Chapter E3 (Fcr, φc = 0.90)
 * Scientific tier:
 *   - Euler elastic critical load Ncr = π²EI/(K·L)² with exact eigen-modes
 *   - Tetmajer inelastic line for structural steel (Roloff/Matek, Table TB 6-…):
 *       S235: σk = 310 − 1.14 λ   (λ0 ≈ 20 … λp ≈ 104)
 *       S355: σk = 335 − 0.62 λ   (λ0 ≈ 20 … λp ≈ 89)
 *   - J.B. Johnson parabola σ = fy [1 − fy λ² / (4π²E)], valid for λ ≤ Cc = √(2π²E/fy)
 *
 * Pure function — no React / DOM.
 */

export type EndCondition = 'pinned-pinned' | 'fixed-free' | 'fixed-fixed' | 'fixed-pinned';
export type BucklingCurve = 'a0' | 'a' | 'b' | 'c' | 'd';
export type SectionKind = 'round' | 'tube' | 'rect' | 'rhs';

/** EN 1993-1-1 Table 6.1 */
export const CURVE_ALPHA: Record<BucklingCurve, number> = { a0: 0.13, a: 0.21, b: 0.34, c: 0.49, d: 0.76 };

/** Theoretical effective-length factors (exact eigenvalues) and AISC C-A-7.1 recommended design values */
export const K_THEORY: Record<EndCondition, number> = {
  'pinned-pinned': 1.0,
  'fixed-free': 2.0,
  'fixed-fixed': 0.5,
  'fixed-pinned': 0.6992, // kL = 4.4934 → K = π / 4.4934
};
export const K_DESIGN: Record<EndCondition, number> = {
  'pinned-pinned': 1.0,
  'fixed-free': 2.1,
  'fixed-fixed': 0.65,
  'fixed-pinned': 0.8,
};

export interface SectionInput {
  kind: SectionKind;
  d?: number; // round: diameter; tube: outer diameter (mm)
  t?: number; // tube / rhs wall (mm)
  b?: number; // rect / rhs width (mm)
  h?: number; // rect / rhs height (mm)
}

export interface ColumnInput {
  L: number;          // mm
  end: EndCondition;
  kMode?: 'theory' | 'design';
  E: number;          // MPa
  fy: number;         // MPa
  curve: BucklingCurve;
  gammaM1: number;
  section: SectionInput;
  N: number;          // applied axial load, N
  /** steel → Tetmajer line available */
  steel?: boolean;
}

export interface SectionProps { A: number; Iy: number; Iz: number; I: number; i: number; valid: boolean }

export function sectionProps(s: SectionInput): SectionProps {
  let A = 0, Iy = 0, Iz = 0;
  const pos = (v?: number) => (Number.isFinite(v) && (v as number) > 0 ? (v as number) : 0);
  switch (s.kind) {
    case 'round': {
      const d = pos(s.d);
      A = (Math.PI * d * d) / 4;
      Iy = Iz = (Math.PI * d ** 4) / 64;
      break;
    }
    case 'tube': {
      const D = pos(s.d), t = Math.min(pos(s.t), D / 2), di = D - 2 * t;
      A = (Math.PI * (D * D - di * di)) / 4;
      Iy = Iz = (Math.PI * (D ** 4 - di ** 4)) / 64;
      break;
    }
    case 'rect': {
      const b = pos(s.b), h = pos(s.h);
      A = b * h;
      Iy = (b * h ** 3) / 12;
      Iz = (h * b ** 3) / 12;
      break;
    }
    case 'rhs': {
      const b = pos(s.b), h = pos(s.h), t = Math.min(pos(s.t), b / 2, h / 2);
      const bi = b - 2 * t, hi = h - 2 * t;
      A = b * h - bi * hi;
      Iy = (b * h ** 3 - bi * hi ** 3) / 12;
      Iz = (h * b ** 3 - hi * bi ** 3) / 12;
      break;
    }
  }
  const I = Math.min(Iy, Iz);
  const i = A > 0 && I > 0 ? Math.sqrt(I / A) : 0;
  return { A, Iy, Iz, I, i, valid: A > 0 && I > 0 };
}

/** EN 1993-1-1 eq. 6.49 */
export function chiEC3(lambdaBar: number, alpha: number) {
  if (!(lambdaBar > 0.2)) return 1;
  const Phi = 0.5 * (1 + alpha * (lambdaBar - 0.2) + lambdaBar * lambdaBar);
  return Math.min(1, 1 / (Phi + Math.sqrt(Math.max(0, Phi * Phi - lambdaBar * lambdaBar))));
}

/** AISC 360-16 E3-2 / E3-3 */
export function fcrAISC(lambda: number, E: number, fy: number) {
  if (!(lambda > 0)) return fy;
  const Fe = (Math.PI ** 2 * E) / (lambda * lambda);
  return lambda <= 4.71 * Math.sqrt(E / fy) ? Math.pow(0.658, fy / Fe) * fy : 0.877 * Fe;
}

/** Tetmajer line for steel (Roloff/Matek); returns null outside its range */
export function tetmajer(lambda: number, fy: number) {
  const lo = fy <= 275;
  const a = lo ? 310 : 335, b = lo ? 1.14 : 0.62;
  const lambdaP = lo ? 104 : 89;
  return { sigma: Math.min(fy, Math.max(0, a - b * lambda)), lambdaP, a, b, valid: lambda <= lambdaP };
}

export function johnson(lambda: number, E: number, fy: number) {
  const Cc = Math.sqrt((2 * Math.PI ** 2 * E) / fy);
  return { Cc, sigma: lambda <= Cc ? fy * (1 - (fy * lambda * lambda) / (4 * Math.PI ** 2 * E)) : null };
}

export interface ColumnResult {
  section: SectionProps;
  K: number;
  Le: number;
  lambda: number;
  lambda1: number;
  lambdaBar: number;
  alpha: number;
  chi: number;
  Ncr: number;          // Euler, N
  sigmaCr: number;      // MPa
  Npl: number;          // squash A·fy, N
  NbRd: number;         // EC3 design resistance, N
  NbRd_sigma: number;   // MPa
  ec3Util: number;
  FcrAISC: number;      // MPa
  PnAISC: number;       // N
  phiPnAISC: number;    // N
  aiscUtil: number;
  tetmajer: { sigma: number; N: number; valid: boolean; lambdaP: number } | null;
  johnson: { sigma: number | null; N: number | null; Cc: number };
  /** characteristic buckling load (no partial factors) for the governing regime */
  Nk: number;
  regime: 'squash' | 'inelastic' | 'elastic';
  fos: number;          // Nk / N
  sigmaN: number;       // applied stress N/A, MPa
}

export function computeColumnBuckling(inp: ColumnInput): ColumnResult {
  const sec = sectionProps(inp.section);
  const K = (inp.kMode === 'design' ? K_DESIGN : K_THEORY)[inp.end] ?? 1;
  const Le = K * inp.L;
  const { A, I, i } = sec;
  const E = inp.E, fy = inp.fy;
  const lambda = i > 0 ? Le / i : 0;
  const lambda1 = Math.PI * Math.sqrt(E / fy); // = 93.9 ε for E = 210 GPa
  const lambdaBar = lambda1 > 0 ? lambda / lambda1 : 0;
  const alpha = CURVE_ALPHA[inp.curve] ?? 0.34;
  const chi = chiEC3(lambdaBar, alpha);
  const gM1 = inp.gammaM1 > 0 ? inp.gammaM1 : 1;
  const NbRd = (chi * A * fy) / gM1;
  const Ncr = Le > 0 ? (Math.PI ** 2 * E * I) / (Le * Le) : Infinity;
  const sigmaCr = lambda > 0 ? (Math.PI ** 2 * E) / (lambda * lambda) : Infinity;
  const Npl = A * fy;
  const Fcr = fcrAISC(lambda, E, fy);
  const Pn = Fcr * A;
  const phiPn = 0.9 * Pn;

  const tet = inp.steel ? tetmajer(lambda, fy) : null;
  const joh = johnson(lambda, E, fy);

  // characteristic (theoretical) capacity
  let regime: ColumnResult['regime'];
  let Nk: number;
  const lambdaP = tet ? tet.lambdaP : Math.PI * Math.sqrt(E / (0.8 * fy));
  if (lambda <= 20) {
    regime = 'squash';
    Nk = Npl;
  } else if (lambda < lambdaP) {
    regime = 'inelastic';
    Nk = tet ? tet.sigma * A : (joh.sigma ?? sigmaCr) * A;
  } else {
    regime = 'elastic';
    Nk = Math.min(Ncr, Npl);
  }
  const N = Math.max(0, inp.N);
  return {
    section: sec, K, Le, lambda, lambda1, lambdaBar, alpha, chi,
    Ncr, sigmaCr, Npl, NbRd, NbRd_sigma: A > 0 ? NbRd / A : 0,
    ec3Util: NbRd > 0 ? N / NbRd : Infinity,
    FcrAISC: Fcr, PnAISC: Pn, phiPnAISC: phiPn, aiscUtil: phiPn > 0 ? N / phiPn : Infinity,
    tetmajer: tet ? { sigma: tet.sigma, N: tet.sigma * A, valid: tet.valid, lambdaP: tet.lambdaP } : null,
    johnson: { sigma: joh.sigma, N: joh.sigma !== null ? joh.sigma * A : null, Cc: joh.Cc },
    Nk, regime, fos: N > 0 ? Nk / N : Infinity, sigmaN: A > 0 ? N / A : 0,
  };
}

/**
 * Normalised buckled shape w(ξ), ξ = x/L measured from the bottom support (0 … 1), max |w| = 1.
 * Exact first eigen-modes of the Euler column.
 */
export function modeShape(end: EndCondition, xi: number): number {
  switch (end) {
    case 'pinned-pinned':
      return Math.sin(Math.PI * xi);
    case 'fixed-free':
      return 1 - Math.cos((Math.PI * xi) / 2);
    case 'fixed-fixed':
      return (1 - Math.cos(2 * Math.PI * xi)) / 2;
    case 'fixed-pinned': {
      const kL = 4.493409;
      const w = (x: number) => Math.sin(kL * x) - kL * Math.cos(kL * x) + kL - kL * x;
      // max at w'(x)=0 → cos(kLx) + kL sin(kLx) = 1 ; numeric normaliser
      return w(xi) / 6.283184; // max of w over [0,1] (at ξ ≈ 0.602)
    }
  }
}

/** Inflection points bounding the effective length (as ξ along the real column; may exceed 1 for cantilever) */
export function effectiveSpan(end: EndCondition): [number, number] {
  switch (end) {
    case 'pinned-pinned': return [0, 1];
    case 'fixed-fixed': return [0.25, 0.75];
    case 'fixed-pinned': return [0.3008, 1];
    case 'fixed-free': return [0, 2];
  }
}
