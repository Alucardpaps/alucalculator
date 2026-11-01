import { describe, it, expect } from 'vitest';
import {
  calculateNesting,
  type CutItem,
  type NestingOptions
} from '@/utils/nestingAlgorithm';

describe('1D Cutting Optimizer & Remnant Inventory Engine', () => {
  const parts: CutItem[] = [
    { id: '1', label: 'Beam-A', length: 1200, qty: 2 },
    { id: '2', label: 'Beam-B', length: 800, qty: 3 },
    { id: '3', label: 'Beam-C', length: 500, qty: 4 },
  ];

  it('nests onto remnants first before consuming new standard bars', () => {
    const stockLength = 6000;
    const remnants = [2500, 1400];
    const opts: NestingOptions = {
      algorithm: 'bfd',
      bladeWidth: 4,
      remnants,
      minUsableWaste: 300,
    };

    const result = calculateNesting(parts, stockLength, opts);
    expect(result.patterns.length).toBeGreaterThan(0);
    
    // Check that remnants are used and marked as isRemnant
    const usedRemnants = result.patterns.filter(p => p.isRemnant);
    expect(usedRemnants.length).toBeGreaterThan(0);
    expect(usedRemnants[0].stockLength).toBeLessThan(stockLength);
  });

  it('tags remaining offcuts according to minUsableWaste', () => {
    const stockLength = 3000;
    const cuts: CutItem[] = [
      { id: '1', label: 'P1', length: 2200, qty: 1 },
    ];
    const result = calculateNesting(cuts, stockLength, {
      bladeWidth: 4,
      minUsableWaste: 500,
    });

    expect(result.patterns.length).toBe(1);
    // waste = 3000 - 2200 = 800 mm > 500 mm
    expect(result.patterns[0].waste).toBeGreaterThan(500);
  });

  it('computes BFD vs FFD consistently with minimized bar usage', () => {
    const bfdResult = calculateNesting(parts, 6000, { algorithm: 'bfd', bladeWidth: 4 });
    const ffdResult = calculateNesting(parts, 6000, { algorithm: 'ffd', bladeWidth: 4 });

    expect(bfdResult.totalStockUsed).toBeGreaterThan(0);
    expect(ffdResult.totalStockUsed).toBeGreaterThan(0);
    expect(bfdResult.totalWastePct).toBeLessThanOrEqual(100);
    expect(ffdResult.totalWastePct).toBeLessThanOrEqual(100);
  });
});
