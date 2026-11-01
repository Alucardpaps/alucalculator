import { describe, it, expect } from 'vitest';
import { computeTerrainY, rpmToStepOmega, PX_PER_METER, terrainNormalAt } from '@/components/flow-world/physicsEngine';

describe('Flow World physics helpers', () => {
  it('maps 240 RPM to the correct Matter step omega at 60 Hz', () => {
    const dt = 1 / 60;
    const step = rpmToStepOmega(240, dt);
    expect(step).toBeCloseTo(((240 * 2 * Math.PI) / 60) * dt, 6);
    expect(step).toBeLessThan(0.5);
    expect(step).toBeGreaterThan(0.2);
  });

  it('keeps flat terrain on the 5 m pivot and slopes with tan(θ)', () => {
    expect(computeTerrainY(500, 0, 'flat')).toBe(650);
    const y = computeTerrainY(600, 10, 'flat');
    expect(y).toBeCloseTo(650 + 100 * Math.tan((10 * Math.PI) / 180), 5);
  });

  it('returns an upward-ish normal for flat ground', () => {
    const n = terrainNormalAt(500, 0, 'flat');
    expect(n.ny).toBeGreaterThan(0.9);
    expect(Math.hypot(n.nx, n.ny)).toBeCloseTo(1, 5);
  });

  it('uses 100 px = 1 m', () => {
    expect(PX_PER_METER).toBe(100);
  });
});
