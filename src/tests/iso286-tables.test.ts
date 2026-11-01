/**
 * ISO 286-2 regression: values below are the published table values
 * (ISO 286-2:2010, also reproduced in DIN 7154/7155 and Machinery's Handbook).
 */
import { describe, it, expect } from 'vitest';
import { calculateIT, calculateFit, holeDeviations, shaftDeviations } from '@/lib/engine/iso286';
import { calculateIsoFit } from '@/lib/engines/math/iso286';

const lim = (d: { upper: number; lower: number }) => [d.upper, d.lower];

describe('ISO 286-1 Table 1 — IT grades (µm)', () => {
  it.each([
    [2, 7, 10], [2, 6, 6], [5, 6, 8], [5, 9, 30], [8, 7, 15], [8, 10, 58], [15, 7, 18], [15, 10, 70],
    [25, 7, 21], [50, 6, 16], [50, 7, 25], [50, 8, 39], [50, 11, 160], [100, 7, 35], [150, 14, 1000],
    [200, 9, 115], [200, 10, 185], [350, 6, 36], [350, 11, 360], [450, 6, 40], [450, 7, 63], [450, 9, 155], [450, 11, 400],
  ])('Ø%s IT%s = %s µm', (d, g, v) => {
    expect(calculateIT(d, g)).toBe(v);
  });
});

describe('shaft limit deviations (µm)', () => {
  it.each([
    [50, 'g', 6, [-9, -25]], [50, 'f', 7, [-25, -50]], [50, 'e', 8, [-50, -89]], [50, 'd', 9, [-80, -142]],
    [50, 'c', 11, [-130, -290]], [25, 'c', 11, [-110, -240]], [50, 'h', 6, [0, -16]], [50, 'js', 6, [8, -8]],
    [50, 'j', 6, [11, -5]], [50, 'k', 6, [18, 2]], [50, 'm', 6, [25, 9]], [50, 'n', 6, [33, 17]],
    [50, 'p', 6, [42, 26]], [50, 'r', 6, [50, 34]], [50, 's', 6, [59, 43]], [50, 't', 6, [70, 54]], [50, 'u', 6, [86, 70]],
    [25, 'p', 6, [35, 22]], [25, 's', 6, [48, 35]], [10, 'k', 6, [10, 1]], [100, 'k', 6, [25, 3]], [100, 'm', 6, [35, 13]],
    [90, 'r', 6, [73, 51]], [90, 's', 6, [93, 71]], [12, 'x', 6, [51, 40]],
  ])('Ø%s %s%s', (d, l, g, exp) => {
    const r = shaftDeviations(d as number, l as string, g as number);
    expect(r.supported).toBe(true);
    expect(lim(r)).toEqual(exp);
  });
});

describe('hole limit deviations (µm) incl. Δ correction', () => {
  it.each([
    [50, 'H', 7, [25, 0]], [50, 'G', 7, [34, 9]], [50, 'F', 8, [64, 25]], [50, 'JS', 7, [12.5, -12.5]],
    [50, 'J', 7, [14, -11]], [50, 'K', 6, [3, -13]], [50, 'K', 7, [7, -18]], [50, 'K', 8, [12, -27]],
    [50, 'M', 6, [-4, -20]], [50, 'M', 7, [0, -25]], [50, 'N', 7, [-8, -33]], [50, 'N', 8, [-3, -42]],
    [50, 'N', 9, [0, -62]], [50, 'P', 7, [-17, -42]], [50, 'P', 8, [-26, -65]], [45, 'R', 7, [-25, -50]], [45, 'S', 7, [-34, -59]],
    [100, 'K', 7, [10, -25]], [100, 'M', 7, [0, -35]], [100, 'N', 7, [-10, -45]], [100, 'P', 7, [-24, -59]], [90, 'S', 7, [-58, -93]],
    [8, 'K', 6, [2, -7]], [2, 'K', 7, [0, -10]], [2, 'N', 7, [-4, -14]], [2, 'P', 7, [-6, -16]],
    [14, 'P', 9, [-18, -61]], [14, 'N', 9, [0, -43]], [14, 'D', 10, [120, 50]],
  ])('Ø%s %s%s', (d, l, g, exp) => {
    const r = holeDeviations(d as number, l as string, g as number);
    expect(r.supported).toBe(true);
    expect(lim(r)).toEqual(exp);
  });
});

describe('fits', () => {
  it('H7/g6 Ø50 sliding fit', () => {
    const f = calculateFit(50, 'H', 7, 'g', 6);
    expect(f.fitType).toBe('Clearance');
    expect(f.maxClearanceUm).toBe(50);
    expect(f.minClearanceUm).toBe(9);
  });
  it('N7/h6 Ø50 transition fit', () => {
    const f = calculateFit(50, 'N', 7, 'h', 6);
    expect(f.fitType).toBe('Transition');
    expect(f.maxClearanceUm).toBe(8);
    expect(f.minClearanceUm).toBe(-33);
  });
  it('H7/s6 Ø50 interference fit', () => {
    const f = calculateFit(50, 'H', 7, 's', 6);
    expect(f.fitType).toBe('Interference');
    expect(f.maxClearanceUm).toBe(-18);
    expect(f.minClearanceUm).toBe(-59);
  });
  it('flags classes that ISO 286 does not define for the size', () => {
    const f = calculateFit(10, 'H', 7, 't', 6);
    expect(f.isSupported).toBe(false);
    expect(f.warnings.length).toBeGreaterThan(0);
  });
  it('the legacy mm facade returns the same limits as the main engine', () => {
    for (const [d, h, s] of [[50, 'K7', 'h6'], [25, 'F8', 'h7'], [80, 'H7', 'm6'], [12, 'N7', 'h6']] as const) {
      const a = calculateIsoFit(d, h, s);
      const b = calculateFit(d, h.replace(/\d/g, ''), parseInt(h.replace(/\D/g, '')), s.replace(/\d/g, ''), parseInt(s.replace(/\D/g, '')));
      expect(a.hole.ES * 1000).toBeCloseTo(b.holeES, 6);
      expect(a.hole.EI * 1000).toBeCloseTo(b.holeEI, 6);
      expect(a.shaft.es * 1000).toBeCloseTo(b.shaft_es, 6);
      expect(a.shaft.ei * 1000).toBeCloseTo(b.shaft_ei, 6);
      expect(a.fit.type).toBe(b.fitType);
    }
  });
});
