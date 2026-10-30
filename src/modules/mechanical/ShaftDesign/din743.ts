/**
 * DIN 743:2012 shaft capacity — static (Part 1 §7) and fatigue (Part 1 §6, Part 2, Part 3) checks.
 *
 * Tier: Normative for size factors K1/K2, surface factor KF, shoulder / groove αk and the
 * stress-gradient support factor n, keyway βσ, circlip-groove βσ and the fatigue limits of Part 3.
 * Heuristic (documented, conservative) for threads, splines and cross holes, where DIN 743-2 only
 * gives βσ for specific configurations.
 *
 * Load assumption (load case 1, DIN 743-1 §6.4): rotating shaft → bending fully reversed
 * (σba = σb, σbm = 0); torque steady (τtm = τt, τta = τt·torsionAlt).
 *
 * Pure module — no React / DOM.
 */

export type SteelClass = 'quenched-tempered' | 'case-hardening' | 'structural';

export interface Din743Material {
  Rm: number; // σB(dB), MPa
  Re: number; // σS(dB), MPa
  steelClass: SteelClass;
}

export type NotchKind =
  | { kind: 'none' }
  | { kind: 'shoulder'; D: number; d: number; r: number }
  | { kind: 'groove'; d: number; t: number; r: number }        // relief groove / DIN 509 undercut (d = notch-root diameter)
  | { kind: 'circlip'; d: number; t: number; m: number }        // DIN 471 groove: root Ø d, depth t, width m
  | { kind: 'keyway'; d: number }                              // DIN 6885 end-milled keyway
  | { kind: 'press-fit'; d: number }                           // hub / bearing inner ring interference fit
  | { kind: 'cross-hole'; d: number; dh: number }
  | { kind: 'thread'; d: number }
  | { kind: 'spline'; d: number };

const lg = Math.log10;
const DB = 16; // reference diameter dB (mm) for quenched & tempered / structural steel in DIN 743-3

/** DIN 743-2 §4 technological size factor K1(deff) for tensile (Rm) or yield (Re) strength */
export function K1(deff: number, cls: SteelClass, forYield = false): number {
  const d = Math.max(deff, 1);
  switch (cls) {
    case 'quenched-tempered':
      if (d <= DB) return 1;
      return 1 - (forYield ? 0.34 : 0.26) * lg(Math.min(d, 300) / DB);
    case 'case-hardening':
      if (d <= DB) return 1;
      return 1 - 0.41 * lg(Math.min(d, 150) / DB);
    case 'structural':
      if (d <= 100) return 1;
      return 1 - 0.23 * lg(Math.min(d, 300) / 100);
  }
}

/** DIN 743-2 §5 geometric size factor K2(d) — bending / torsion (tension: 1) */
export function K2(d: number): number {
  if (d < 7.5) return 1;
  if (d >= 150) return 0.8;
  return 1 - (0.2 * lg(d / 7.5)) / lg(20);
}

/** DIN 743-2 §6 surface roughness factor KFσ (Rz in µm), KFτ = 0.575 KFσ + 0.425 */
export function KF(Rz: number, sigmaB: number) {
  const kfs = 1 - 0.22 * lg(Math.max(Rz, 1)) * (lg(sigmaB / 20) - 1);
  return { s: kfs, t: 0.575 * kfs + 0.425 };
}

/** DIN 743-2 eq. for the support number n from the related stress gradient G' (1/mm) */
export function supportN(Gp: number, sigmaS: number) {
  if (!(Gp > 0)) return 1;
  return 1 + Math.sqrt(Gp) * Math.pow(10, -(0.33 + sigmaS / 712));
}

/** αkσ (bending) and αkτ (torsion) for a shoulder fillet — DIN 743-2 Table 2 */
export function alphaShoulder(D: number, d: number, r: number) {
  const t = Math.max((D - d) / 2, 1e-6);
  const rt = r / t, rd = r / d, dD = d / D;
  const ab = 1 + 1 / Math.sqrt(0.62 * rt + 11.6 * rd * (1 + 2 * rd) ** 2 + 0.2 * rt ** 3 * dD);
  const at = 1 + 1 / Math.sqrt(3.4 * rt + 38 * rd * (1 + 2 * rd) ** 2 + 1 * rt ** 2 * dD);
  const phi = dD <= 0.67 && t / d > 0 ? 1 / (4 * Math.sqrt(t / r) + 2) : 0;
  return { ab, at, Gb: (2.3 / r) * (1 + phi), Gt: 1.15 / r };
}

/** αk for a circumferential (relief) groove — DIN 743-2 Table 2 */
export function alphaGroove(d: number, t: number, r: number) {
  const rt = r / Math.max(t, 1e-6), rd = r / d;
  const ab = 1 + 1 / Math.sqrt(0.22 * rt + 2.74 * rd * (1 + 2 * rd) ** 2);
  const at = 1 + 1 / Math.sqrt(0.7 * rt + 10.3 * rd * (1 + 2 * rd) ** 2);
  const D = d + 2 * t;
  const phi = d / D <= 0.67 ? 1 / (4 * Math.sqrt(t / r) + 2) : 0;
  return { ab, at, Gb: (2 / r) * (1 + phi), Gt: 1 / r };
}

/** Effective notch factors βσ (bending) and βτ (torsion) */
export function betaFactors(n: NotchKind, mat: Din743Material, deff: number): { bs: number; bt: number; tier: 'normative' | 'heuristic'; label: string } {
  const sB = K1(deff, mat.steelClass) * mat.Rm;
  const sS = K1(deff, mat.steelClass, true) * mat.Re;
  switch (n.kind) {
    case 'none':
      return { bs: 1, bt: 1, tier: 'normative', label: '—' };
    case 'shoulder': {
      const r = Math.max(n.r, 0.1);
      const a = alphaShoulder(n.D, n.d, r);
      return { bs: a.ab / supportN(a.Gb, sS), bt: a.at / supportN(a.Gt, sS), tier: 'normative', label: `r ${r}` };
    }
    case 'groove': {
      const r = Math.max(n.r, 0.1);
      const a = alphaGroove(n.d, n.t, r);
      return { bs: a.ab / supportN(a.Gb, sS), bt: a.at / supportN(a.Gt, sS), tier: 'normative', label: `r ${r}` };
    }
    case 'circlip': {
      // DIN 743-2 §7.4: rf = r + 2.9 ρ*, ρ* = 10^-(0.514 + 0.00152 σS(d)) mm, r ≈ 0.1 mm
      const rhoStar = Math.pow(10, -(0.514 + 0.00152 * sS));
      const rf = 0.1 + 2.9 * rhoStar;
      const k = Math.sqrt(Math.max(n.t, 1e-3) / rf);
      let bs = 0.9 * (1.27 + 1.17 * k);
      let bt = 0.9 * (1.14 + 1.08 * k);
      if (n.m / Math.max(n.t, 1e-3) < 1.4) { bs *= 1.08; bt *= 1.08; } // narrow groove interaction (conservative)
      return { bs, bt, tier: 'normative', label: `t ${n.t.toFixed(2)}` };
    }
    case 'keyway': {
      // DIN 743-2 Table 3: end-milled keyway, dBK = 40 mm
      const bs = 3.0 * Math.pow(sB / 1000, 0.38);
      return { bs, bt: 0.56 * bs + 0.1, tier: 'normative', label: 'DIN 6885' };
    }
    case 'press-fit': {
      // DIN 743-2 Table 3: interference fit, dBK = 40 mm
      const bs = 2.7 * Math.pow(sB / 1000, 0.43);
      return { bs, bt: 0.65 * bs, tier: 'normative', label: 'press fit' };
    }
    case 'cross-hole': {
      // Peterson αk for a transverse hole + gradient 2.3/r (heuristic)
      const q = Math.min(0.4, n.dh / n.d);
      const ak = 3.0 - 3.13 * q + 3.66 * q * q;
      const nn = supportN(2.3 / Math.max(n.dh / 2, 0.2), sS);
      return { bs: ak / nn, bt: (0.8 * ak) / nn, tier: 'heuristic', label: `Ø${n.dh}` };
    }
    case 'thread':
      return { bs: 2.6, bt: 2.0, tier: 'heuristic', label: 'thread root' }; // FKM rolled/cut metric thread range 2.3–3.0
    case 'spline':
      return { bs: 1.6, bt: 1.9, tier: 'heuristic', label: 'DIN 5480' };
  }
}

export interface Din743Point {
  sigmaB: number;   // bending stress amplitude (fully reversed), MPa
  tau: number;      // torsional stress (mean), MPa
  d: number;        // section diameter at the point (notch root), mm
  notch: NotchKind;
  Rz?: number;      // µm
  torsionAlt?: number; // share of τ that alternates (0 = steady torque)
}

export interface Din743Result {
  SF: number;       // static safety (DIN 743-1 §7)
  SD: number;       // fatigue safety (DIN 743-1 §6, load case 1)
  betaS: number;
  betaT: number;
  Ks: number;
  Kt: number;
  sigmaBWK: number;
  sigmaBADK: number;
  tier: 'normative' | 'heuristic';
}

export function din743Check(p: Din743Point, mat: Din743Material): Din743Result {
  const d = Math.max(p.d, 1);
  const k1R = K1(d, mat.steelClass);
  const k1S = K1(d, mat.steelClass, true);
  const sB = k1R * mat.Rm;
  const sS = k1S * mat.Re;
  const k2 = K2(d);
  const kf = KF(p.Rz ?? 6.3, sB);
  const beta = betaFactors(p.notch, mat, d);
  const Ks = beta.bs / k2 + 1 / kf.s - 1;
  const Kt = beta.bt / k2 + 1 / kf.t - 1;

  // DIN 743-3: fatigue limits of the reference specimen
  const sigmaBW = 0.5 * mat.Rm, tauTW = 0.3 * mat.Rm;
  const sigmaBWK = (sigmaBW * k1R) / Ks;
  const tauTWK = (tauTW * k1R) / Kt;
  const psiS = sigmaBWK / (2 * k1R * mat.Rm - sigmaBWK);
  const psiT = tauTWK / (2 * k1R * mat.Rm - tauTWK);

  const alt = Math.min(1, Math.max(0, p.torsionAlt ?? 0));
  const tauA = Math.abs(p.tau) * alt;
  const tauM = Math.abs(p.tau) * (1 - alt);
  const sigmaMV = Math.sqrt(3) * tauM;     // σmv = √(σm² + 3τm²), σbm = 0
  const tauMV = sigmaMV / Math.sqrt(3);

  // load case 1: σmv = const
  const sigmaBADK = Math.max(0, Math.min(sigmaBWK - psiS * sigmaMV, sS - sigmaMV));
  const tauTADK = Math.max(0, Math.min(tauTWK - psiT * tauMV, sS / Math.sqrt(3) - tauMV));
  const ra = Math.abs(p.sigmaB) / Math.max(sigmaBADK, 1e-9);
  const rt = tauA / Math.max(tauTADK, 1e-9);
  const SD = ra + rt > 0 ? 1 / Math.sqrt(ra * ra + rt * rt) : Infinity;

  // DIN 743-1 §7 static: K2F = 1.2 (solid round, bending & torsion), γF = 1 (conservative)
  const sigmaBFK = k1S * 1.2 * mat.Re;
  const tauTFK = (k1S * 1.2 * mat.Re) / Math.sqrt(3);
  const sf = Math.sqrt((Math.abs(p.sigmaB) / sigmaBFK) ** 2 + (Math.abs(p.tau) / tauTFK) ** 2);
  const SF = sf > 0 ? 1 / sf : Infinity;

  return { SF, SD, betaS: beta.bs, betaT: beta.bt, Ks, Kt, sigmaBWK, sigmaBADK, tier: beta.tier };
}

/** Roughness from the ISO tolerance grade of a seat (ground seats ≤ IT6) */
export function roughnessForGrade(grade?: string): number {
  const m = /(\d+)/.exec(grade ?? '');
  const it = m ? Number(m[1]) : 9;
  return it <= 6 ? 2.5 : it <= 8 ? 6.3 : 12.5;
}
