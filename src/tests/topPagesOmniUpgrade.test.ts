import { describe, it, expect } from 'vitest';
import {
  BASE_METALS_CATALOG,
  calculateOmniWeldStrength,
  calculateCarbonEquivalentSuite,
  calculateWeldingCostAndGas,
} from '@/data/weldingData';
import {
  ALLOY_DATASHEETS,
  getAlloy,
  calculateAlloyShapeWeight,
} from '@/data/alloyDatasheets';
import {
  generateStarTighteningOrder,
  K_FACTOR_PRESETS,
  METRIC_QUICK_CHART_ROWS,
} from '@/components/modules/mechanical/BoltTorqueOmniSuite';

describe('Top 5 Most-Clicked Pages Upgrade — Deterministic Engineering Verification', () => {
  describe('1. /welding/ — Omni Joint Strength, Reverse Solver, CEV & Cost Engine', () => {
    it('includes Eurocode 3 steels and Eurocode 9 aluminum alloys with HAZ softening factors', () => {
      expect(BASE_METALS_CATALOG.length).toBeGreaterThanOrEqual(8);
      const alu6061 = BASE_METALS_CATALOG.find((m) => m.id === 'al_6061_t6');
      expect(alu6061).toBeDefined();
      expect(alu6061?.rhoHaz).toBeCloseTo(0.55, 2);
    });

    it('calculates Combined U-Weld (Transverse + 2 Parallel) load capacity and crater allowance', () => {
      const res = calculateOmniWeldStrength({
        config: 'combined_u_weld',
        solveTarget: 'solve_load',
        weldSizeMm: 6,
        length1Mm: 100, // transverse l1
        length2Mm: 150, // each parallel side l2
        allowTensileMPa: 180,
        allowShearMPa: 125,
        targetForceKN: 120,
        includeCraterAllowance: true,
      });

      expect(res.throatThicknessMm).toBeCloseTo(6 * 0.707, 2);
      expect(res.maxForceKN).toBeGreaterThan(200);
      expect(res.totalSeamLengthWithCraterMm).toBeCloseTo(res.effectiveLengthMm + 12.5, 1);
    });

    it('reverse-solves required weld length l for a target load', () => {
      const forward = calculateOmniWeldStrength({
        config: 'parallel_lap',
        solveTarget: 'solve_load',
        weldSizeMm: 6,
        length1Mm: 120,
        allowTensileMPa: 200,
        allowShearMPa: 150,
        includeCraterAllowance: true,
      });

      const reverse = calculateOmniWeldStrength({
        config: 'parallel_lap',
        solveTarget: 'solve_length',
        weldSizeMm: 6,
        length1Mm: 50,
        allowTensileMPa: 200,
        allowShearMPa: 150,
        targetForceKN: forward.maxForceKN,
        includeCraterAllowance: true,
      });

      expect(reverse.requiredLengthMm).toBeCloseTo(120, 1);
    });

    it('computes multi-standard Carbon Equivalent (IIW, AWS, JWES, Pcm) and preheat', () => {
      const s355 = calculateCarbonEquivalentSuite({
        C: 0.20,
        Mn: 1.50,
        Si: 0.40,
        Cr: 0.05,
        Mo: 0.02,
        V: 0.02,
        Ni: 0.05,
        Cu: 0.10,
        B: 0.0005,
        thicknessMm: 25,
      });

      // CE_IIW = 0.20 + 1.50/6 + (0.05+0.02+0.02)/5 + (0.05+0.10)/15 = 0.478
      expect(s355.ceIIW).toBeCloseTo(0.478, 2);
      expect(s355.ceAWS).toBeGreaterThan(s355.ceIIW);
      expect(s355.recommendedPreheatC).toBeGreaterThanOrEqual(75);
    });

    it('computes Welding Cost, Shielding Gas & Filler Wire consumption', () => {
      const cost = calculateWeldingCostAndGas({
        jointType: 'fillet',
        legSizeMm: 8,
        thicknessMm: 10,
        weldLengthMm: 10000, // 10 meters
        densityGcm3: 7.85,
        depositionEfficiency: 0.88,
        travelSpeedMmMin: 280,
        gasFlowLMin: 15,
        currentA: 210,
        voltageV: 24,
        wirePricePerKg: 4.5,
        gasPricePerL: 0.015,
        laborRatePerHour: 35,
        operatorDutyCycle: 0.45,
      });

      expect(cost.depositedMassKg).toBeGreaterThan(2.0);
      expect(cost.requiredFillerMassKg).toBeGreaterThan(cost.depositedMassKg);
      expect(cost.shieldingGasLiters).toBeGreaterThan(400);
      expect(cost.totalCost).toBeGreaterThan(25);
    });
  });

  describe('2. /bolt-torque/ — K-Factor Presets, M3–M36 Chart & ASME PCC-1 Star Sequence', () => {
    it('provides 9 industrial K-Factor presets and 16 metric bolt sizes (M3–M36)', () => {
      expect(K_FACTOR_PRESETS.length).toBeGreaterThanOrEqual(9);
      expect(METRIC_QUICK_CHART_ROWS.length).toBe(16);
      expect(METRIC_QUICK_CHART_ROWS[0].size).toBe('M3');
      expect(METRIC_QUICK_CHART_ROWS[15].size).toBe('M36');
    });

    it('generates valid permutation star tightening sequences for 4, 8, and 12 bolt flanges', () => {
      for (const n of [4, 8, 12, 16]) {
        const order = generateStarTighteningOrder(n);
        expect(order.length).toBe(n);
        const unique = new Set(order);
        expect(unique.size).toBe(n);
        expect(Math.min(...order)).toBe(1);
        expect(Math.max(...order)).toBe(n);
      }
    });
  });

  describe('3. /materials/2024-t3/ & /materials/ — Alloy Datasheets & 10-Shape Weight Engine', () => {
    it('contains enriched 2024-T3 aerospace properties and chemical composition', () => {
      const a2024 = getAlloy('2024-t3');
      expect(a2024).toBeDefined();
      expect(a2024?.density).toBeCloseTo(2.78, 2);
      expect(a2024?.yieldMPa).toBe(345);
      expect(a2024?.tensileMPa).toBe(483);
      expect(a2024?.shearMPa).toBe(283);
      expect(a2024?.bearingYieldMPa).toBe(607);
      expect(a2024?.composition?.Cu).toBe('3.8–4.9%');
      expect(ALLOY_DATASHEETS.length).toBe(16);
    });

    it('computes accurate mass and 2.70 myth delta across all 10 stock geometries', () => {
      // 1 m x 1 m x 10 mm plate of 2024-T3 (density 2.78 g/cm3) -> 27.80 kg vs 27.00 kg
      const plate = calculateAlloyShapeWeight({
        shape: 'plate',
        lengthMm: 1000,
        widthMm: 1000,
        thicknessMm: 10,
        outerDiaMm: 50,
        innerDiaMm: 25,
        wallMm: 5,
        acrossFlatsMm: 30,
        quantity: 1,
        densityGcm3: 2.78,
        pricePerKgUsd: 7.0,
      });

      expect(plate.totalMassKg).toBeCloseTo(27.8, 2);
      expect(plate.assumed270MassKg).toBeCloseTo(27.0, 2);
      expect(plate.massDeltaKg).toBeCloseTo(0.8, 2);
      expect(plate.massErrorPct).toBeCloseTo(2.963, 2);

      // Hex bar check
      const hex = calculateAlloyShapeWeight({
        shape: 'hex_bar',
        lengthMm: 1000,
        widthMm: 0,
        thicknessMm: 0,
        outerDiaMm: 0,
        innerDiaMm: 0,
        wallMm: 0,
        acrossFlatsMm: 20,
        quantity: 2,
        densityGcm3: 2.70,
        pricePerKgUsd: 6.0,
      });
      // Hex area for AF=20 is (sqrt(3)/2)*400 = 346.41 mm2 -> 1000 mm length = 346.41 cm3 -> *2 pcs = 692.82 cm3
      expect(hex.totalVolumeCm3).toBeCloseTo(692.82, 1);
    });
  });
});
