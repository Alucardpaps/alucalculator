import { computeBoltAssembly } from '@/lib/fastener/sharedEngine';

export type PracticeField = {
  key: string;
  label: string;
  unit?: string;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
};

export type PracticeConfig = {
  fields: PracticeField[];
  compute: (values: Record<string, number>) => { label: string; value: string; detail?: string }[];
};

export const ACADEMY_PRACTICE: Record<string, PracticeConfig> = {
  'engineering-units-and-standards': {
    fields: [{ key: 'mm', label: 'Length', unit: 'mm', defaultValue: 100, min: 1, max: 10000, step: 1 }],
    compute: (v) => {
      const inch = v.mm / 25.4;
      return [
        { label: 'Inches', value: `${inch.toFixed(4)} in`, detail: 'mm ÷ 25.4' },
        { label: 'Meters', value: `${(v.mm / 1000).toFixed(4)} m` },
      ];
    },
  },
  'fundamentals-of-statics': {
    fields: [
      { key: 'F1', label: 'Upward force', unit: 'N', defaultValue: 100, min: 0, max: 100000 },
      { key: 'F2', label: 'Downward force', unit: 'N', defaultValue: 40, min: 0, max: 100000 },
    ],
    compute: (v) => {
      const R = v.F1 - v.F2;
      return [
        { label: 'Reaction R', value: `${R.toFixed(1)} N`, detail: 'ΣFy = F1 − F2 − R = 0' },
        { label: 'Equilibrium', value: Math.abs(R) >= 0 ? 'OK' : '—' },
      ];
    },
  },
  'how-to-calculate-bolt-torque': {
    fields: [
      { key: 'd', label: 'Diameter', unit: 'mm', defaultValue: 10, min: 4, max: 30, step: 1 },
      { key: 'F', label: 'Preload', unit: 'N', defaultValue: 20000, min: 1000, max: 200000, step: 500 },
      { key: 'K', label: 'K factor', defaultValue: 0.2, min: 0.1, max: 0.35, step: 0.01 },
    ],
    compute: (v) => {
      const Tsimple = v.K * v.F * (v.d / 1000);
      let TvdI = Tsimple;
      try {
        const asm = computeBoltAssembly({
          threadStandard: 'Metric Coarse',
          size: `M${Math.round(v.d)}`,
          grade: '8.8',
          muThread: 0.12,
          muHead: 0.12,
          yieldUtilization: 0.9,
        });
        TvdI = asm.MA;
      } catch {
        /* size not in table */
      }
      return [
        { label: 'T = K·F·d (shortcut)', value: `${Tsimple.toFixed(1)} Nm` },
        { label: 'VDI 2230 engine', value: `${TvdI.toFixed(1)} Nm`, detail: 'Full friction model from sharedEngine.ts' },
      ];
    },
  },
  'bearing-life-calculation-explained': {
    fields: [
      { key: 'C', label: 'Dynamic rating C', unit: 'N', defaultValue: 25000, min: 1000, max: 500000 },
      { key: 'P', label: 'Equivalent load P', unit: 'N', defaultValue: 5000, min: 100, max: 200000 },
      { key: 'rpm', label: 'Speed', unit: 'rpm', defaultValue: 1500, min: 10, max: 20000 },
    ],
    compute: (v) => {
      const p = 3;
      const L10 = v.P > 0 ? Math.pow(v.C / v.P, p) : 0;
      const L10h = (1_000_000 / (60 * v.rpm)) * L10;
      return [
        { label: 'L10', value: `${L10.toFixed(2)} Mrev`, detail: '(C/P)³ for ball bearing' },
        { label: 'L10h', value: `${Math.round(L10h).toLocaleString()} h` },
        { label: 'Status', value: v.P > v.C ? 'CRITICAL: P > C' : L10h < 1000 ? 'Warning: low life' : 'OK' },
      ];
    },
  },
  'beam-deflection-formula-explained': {
    fields: [
      { key: 'P', label: 'Center load P', unit: 'N', defaultValue: 10000, min: 100, max: 500000 },
      { key: 'L', label: 'Span L', unit: 'mm', defaultValue: 2000, min: 100, max: 20000 },
      { key: 'E', label: 'E', unit: 'GPa', defaultValue: 200, min: 50, max: 300 },
      { key: 'I', label: 'I', unit: 'mm⁴', defaultValue: 5e6, min: 1e4, max: 1e9, step: 1e5 },
    ],
    compute: (v) => {
      const E = v.E * 1000;
      const delta = (v.P * Math.pow(v.L, 3)) / (48 * E * v.I);
      const M = (v.P * v.L) / 4;
      return [
        { label: 'Deflection δ', value: `${delta.toFixed(3)} mm`, detail: 'PL³/(48EI)' },
        { label: 'Max moment M', value: `${(M / 1000).toFixed(2)} kN·m` },
        { label: 'L/δ ratio', value: delta > 0 ? `${Math.round(v.L / delta)}` : '—' },
      ];
    },
  },
  'pressure-drop-calculation-guide': {
    fields: [
      { key: 'L', label: 'Pipe length', unit: 'm', defaultValue: 50, min: 1, max: 5000 },
      { key: 'D', label: 'Diameter', unit: 'mm', defaultValue: 50, min: 10, max: 500 },
      { key: 'Q', label: 'Flow Q', unit: 'L/min', defaultValue: 100, min: 1, max: 10000 },
      { key: 'f', label: 'Friction f', defaultValue: 0.02, min: 0.008, max: 0.1, step: 0.001 },
    ],
    compute: (v) => {
      const rho = 998;
      const Dm = v.D / 1000;
      const Qm3s = v.Q / 60000;
      const A = Math.PI * Math.pow(Dm / 2, 2);
      const V = Qm3s / A;
      const dP = v.f * (v.L / Dm) * (rho * V * V) / 2;
      return [
        { label: 'Velocity V', value: `${V.toFixed(2)} m/s` },
        { label: 'ΔP (Darcy)', value: `${(dP / 1000).toFixed(2)} kPa`, detail: 'f·(L/D)·ρV²/2' },
        { label: 'Head loss', value: `${(dP / (rho * 9.81)).toFixed(2)} m` },
      ];
    },
  },
  'mechanics-of-materials-fundamentals': {
    fields: [
      { key: 'F', label: 'Axial force F', unit: 'N', defaultValue: 50000, min: 100, max: 1e6 },
      { key: 'A', label: 'Area A', unit: 'mm²', defaultValue: 200, min: 1, max: 10000 },
      { key: 'E', label: 'E', unit: 'GPa', defaultValue: 210, min: 50, max: 400 },
      { key: 'L', label: 'Gauge length L', unit: 'mm', defaultValue: 500, min: 10, max: 5000 },
    ],
    compute: (v) => {
      const sigma = v.F / v.A;
      const eps = sigma / (v.E * 1000);
      const delta = eps * v.L;
      return [
        { label: 'Stress σ', value: `${sigma.toFixed(1)} MPa`, detail: 'F/A' },
        { label: 'Strain ε', value: `${(eps * 1000).toFixed(4)} ‰` },
        { label: 'Elongation δ', value: `${delta.toFixed(3)} mm` },
      ];
    },
  },
  'motor-power-calculation': {
    fields: [
      { key: 'T', label: 'Torque T', unit: 'Nm', defaultValue: 150, min: 1, max: 50000 },
      { key: 'n', label: 'Speed n', unit: 'rpm', defaultValue: 1450, min: 1, max: 20000 },
      { key: 'eta', label: 'Efficiency η', defaultValue: 0.92, min: 0.5, max: 1, step: 0.01 },
    ],
    compute: (v) => {
      const Pkw = (v.T * v.n * 2 * Math.PI) / (60 * 1000) / v.eta;
      return [
        { label: 'Shaft power', value: `${((v.T * v.n * 2 * Math.PI) / 60000).toFixed(2)} kW` },
        { label: 'Motor required', value: `${Pkw.toFixed(2)} kW`, detail: 'Including η losses' },
      ];
    },
  },
  'torsion-and-buckling-mechanics': {
    fields: [
      { key: 'E', label: 'E', unit: 'GPa', defaultValue: 200, min: 50, max: 300 },
      { key: 'I', label: 'I', unit: 'mm⁴', defaultValue: 1e6, min: 1e4, max: 1e9, step: 1e5 },
      { key: 'L', label: 'Column length L', unit: 'mm', defaultValue: 1500, min: 100, max: 10000 },
      { key: 'K', label: 'Effective length K', defaultValue: 1, min: 0.5, max: 2, step: 0.1 },
    ],
    compute: (v) => {
      const E = v.E * 1000;
      const Pcr = (Math.PI * Math.PI * E * v.I) / Math.pow(v.K * v.L, 2);
      return [
        { label: 'Euler Pcr', value: `${(Pcr / 1000).toFixed(1)} kN`, detail: 'π²EI/(KL)²' },
        { label: 'Slenderness hint', value: `KL = ${(v.K * v.L).toFixed(0)} mm` },
      ];
    },
  },
  'thread-geometry-standards': {
    fields: [
      { key: 'D', label: 'Major diameter D', unit: 'mm', defaultValue: 16, min: 4, max: 100, step: 0.5 },
      { key: 'P', label: 'Pitch P', unit: 'mm', defaultValue: 1.5, min: 0.5, max: 6, step: 0.25 },
    ],
    compute: (v) => {
      const d2 = v.D - 0.6495 * v.P;
      const As = 0.7854 * (d2 - 0.9382 * v.P) * (d2 - 0.9382 * v.P);
      return [
        { label: 'Pitch diameter d2 (approx)', value: `${d2.toFixed(2)} mm`, detail: 'ISO metric coarse estimate' },
        { label: 'Stress area As', value: `${As.toFixed(1)} mm²`, detail: 'Used for preload/strength checks' },
        { label: 'Threads per mm', value: `${(1 / v.P).toFixed(2)} /mm` },
      ];
    },
  },
  'chip-breaker-logic': {
    fields: [
      { key: 'feed', label: 'Feed f', unit: 'mm/rev', defaultValue: 0.15, min: 0.02, max: 2, step: 0.01 },
      { key: 'doc', label: 'Depth of cut ap', unit: 'mm', defaultValue: 1.2, min: 0.1, max: 10, step: 0.1 },
      { key: 'Kc', label: 'Kc', unit: 'N/mm²', defaultValue: 2200, min: 500, max: 4000, step: 50 },
      { key: 'length', label: 'Thread length', unit: 'mm', defaultValue: 25, min: 5, max: 200 },
    ],
    compute: (v) => {
      const Fc = v.doc * v.feed * v.Kc;
      const passes = Math.max(3, Math.ceil(v.doc / 0.25));
      const timeHint = (v.length * passes * v.feed) / Math.max(v.feed, 0.01);
      return [
        { label: 'Cutting force Fc (approx)', value: `${Fc.toFixed(0)} N`, detail: 'Fc ∝ ap × f × Kc' },
        { label: 'Suggested passes', value: `${passes}`, detail: 'Rule-of-thumb for threading' },
        { label: 'Machining time hint', value: `~${timeHint.toFixed(1)} min·rev scale`, detail: 'Simplified — verify in Machining Engine' },
      ];
    },
  },
  'introduction-to-machine-elements': {
    fields: [
      { key: 'torque', label: 'Torque required', unit: 'Nm', defaultValue: 120, min: 1, max: 50000 },
      { key: 'speed', label: 'Output speed', unit: 'rpm', defaultValue: 500, min: 1, max: 20000 },
      { key: 'element', label: 'Element type (1=bolt,2=bearing,3=gear)', defaultValue: 2, min: 1, max: 3, step: 1 },
    ],
    compute: (v) => {
      const powerKw = (v.torque * v.speed) / 9550;
      const hints: Record<number, string> = {
        1: 'Fastener: check preload + torque via VDI 2230',
        2: 'Bearing: size with ISO 281 L10 life',
        3: 'Gear/belt: verify ratio and contact stress',
      };
      const el = Math.round(v.element) as 1 | 2 | 3;
      return [
        { label: 'Transmitted power', value: `${powerKw.toFixed(2)} kW`, detail: 'P = T·n/9550' },
        { label: 'Suggested element family', value: hints[el] ?? hints[2] },
        { label: 'Next step', value: 'Open linked calculator for detailed sizing' },
      ];
    },
  },
  'mohrs-circle-stress-analysis': {
    fields: [
      { key: 'sx', label: 'σx', unit: 'MPa', defaultValue: 80, min: -500, max: 500 },
      { key: 'sy', label: 'σy', unit: 'MPa', defaultValue: 20, min: -500, max: 500 },
      { key: 'txy', label: 'τxy', unit: 'MPa', defaultValue: 30, min: -300, max: 300 },
    ],
    compute: (v) => {
      const center = (v.sx + v.sy) / 2;
      const radius = Math.sqrt(Math.pow((v.sx - v.sy) / 2, 2) + v.txy * v.txy);
      const s1 = center + radius;
      const s2 = center - radius;
      return [
        { label: 'Principal σ1', value: `${s1.toFixed(2)} MPa` },
        { label: 'Principal σ2', value: `${s2.toFixed(2)} MPa` },
        { label: 'τ_max', value: `${radius.toFixed(2)} MPa`, detail: 'Mohr circle radius' },
      ];
    },
  },
};

export function getPracticeConfig(slug: string): PracticeConfig | undefined {
  return ACADEMY_PRACTICE[slug];
}
