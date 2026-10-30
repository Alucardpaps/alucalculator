/**
 * v6 computational consistency regressions (hand-checked reference values).
 */
import { describe, it, expect } from 'vitest';
import { CALCULATOR_REGISTRY_V2 } from '@/calculators/registry-v2';
import { computeBoltAssembly } from '@/lib/fastener/sharedEngine';
import { getClearanceHole } from '@/data/machiningStandards';

async function run(id: string, overrides: Record<string, unknown> = {}) {
  const mod: any = await CALCULATOR_REGISTRY_V2[id].loader();
  const schema: any = mod.default ?? Object.values(mod).find((v: any) => v && typeof v === 'object' && 'calculationEngine' in v);
  const inputs: Record<string, any> = {};
  for (const inp of schema.inputs) inputs[inp.key] = { value: overrides[inp.key] ?? inp.defaultValue ?? inp.options?.[0]?.value, unit: inp.unit };
  const res = await schema.calculationEngine(inputs);
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(res.outputs ?? {})) out[k] = (v as any)?.value ?? (v as any);
  return out;
}

describe('hydraulic cylinder (1 bar = 10 N/cm²)', () => {
  it('50 kN at 160 bar needs 31.25 cm² → Ø63.1 mm → ISO bore 80', async () => {
    const o = await run('hydraulic-cylinder', { F: 50, P: 160, stroke: 500 });
    expect(o.Ap).toBeCloseTo(31.25, 6);
    expect(o.bore).toBeCloseTo(63.08, 2);
    expect(o.boreStd).toBe(80);
    // Ø80 × 500 mm stroke = 50.27 cm² × 50 cm = 2.513 L
    expect(o.vol).toBeCloseTo(2.513, 3);
  });
});

describe('worm gear forces include mesh friction', () => {
  it('worm axial force equals wheel tangential force 2·T2/d2', async () => {
    const o = await run('worm-gear', { m: 4, z1: 2, z2: 40, d1: 50, alpha: 20, mu: 0.05, n1: 1450, T1: 50 });
    expect(o.Fa1).toBeCloseTo((2000 * o.T2) / o.d2, 6);
    expect(o.Fa1).toBeGreaterThan(9200);
    expect(o.Fa1).toBeLessThan(9400);
  });
});

describe('foundation bearing — EN 1997-1 Annex D', () => {
  it('drained rectangular footing B=2, L=3, φ=28°, c=20 kPa', async () => {
    const o = await run('foundation-bearing', { B: 2, L: 3, Df: 1.5, c: 20, phi: 28, gamma: 18.5, FS: 3 });
    expect(o.Nq).toBeCloseTo(14.72, 2);
    expect(o.Nc).toBeCloseTo(25.80, 2);
    expect(o.Ng).toBeCloseTo(14.59, 2);
    expect(o.qult).toBeGreaterThan(1435);
    expect(o.qult).toBeLessThan(1448);
  });
  it('undrained: (π + 2)·cu·sc + q', async () => {
    const o = await run('foundation-bearing', { B: 2, L: 2, Df: 1, c: 50, phi: 0, gamma: 18, FS: 3 });
    expect(o.qult).toBeCloseTo((Math.PI + 2) * 50 * 1.2 + 18, 6);
  });
});

describe('bolt calculators agree with each other', () => {
  it('fastener schema returns the /bolt-torque engine values', async () => {
    const o = await run('fasteners', { diameter: 12, pitch: 1.75, propertyClass: 8.8, friction: 0.14, utilization: 90 });
    const e = computeBoltAssembly({ threadStandard: 'Metric Coarse', size: 'M12', grade: '8.8', muThread: 0.14, muHead: 0.14, yieldUtilization: 90, useProofStress: false });
    expect(o.preloadForce).toBeCloseTo(e.Fm_max, 9);
    expect(o.tighteningTorque).toBeCloseTo(e.MA, 9);
  });
  it('ISO 273 medium clearance holes', () => {
    expect(getClearanceHole('M6', 'normal')).toBe(6.6);
    expect(getClearanceHole('M8', 'normal')).toBe(9);
    expect(getClearanceHole('M12', 'normal')).toBe(13.5);
    expect(getClearanceHole('M16', 'fine')).toBe(17);
    expect(getClearanceHole('M20', 'coarse')).toBe(24);
  });
});
