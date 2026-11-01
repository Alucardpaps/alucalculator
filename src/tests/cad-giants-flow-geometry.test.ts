import { describe, it, expect } from 'vitest';
import { getSchema } from '@/flow/nodes/Registry';
import {
  CadParametricShaftDriverNode,
  CadFlangePcdRuleNode,
  CadKnowledgewareRuleCheckNode,
  CadProceduralArrayDriverNode,
} from '@/flow/nodes/StandardLibrary/CadGeometryNodes';

describe('CAD Giants Integration — Flow Engine & Blender Geometry Nodes / CATIA Knowledgeware', () => {
  describe('1. Node Registration Verification', () => {
    it('verifies all 4 CAD & Knowledgeware nodes are registered in the global flow registry', () => {
      expect(getSchema('cad-shaft-driver')).toBeDefined();
      expect(getSchema('cad-flange-pcd-rule')).toBeDefined();
      expect(getSchema('cad-knowledgeware-check')).toBeDefined();
      expect(getSchema('cad-procedural-array')).toBeDefined();
    });
  });

  describe('2. Parametric Shaft Sizer (DIN 743-2 / ASME B106.1M)', () => {
    it('calculates minimum shaft diameter and journal length under torsional load', () => {
      const inputs = {
        torque_nm: 250,
        yield_strength_mpa: 350,
        safety_factor: 1.5,
      };

      const val = CadParametricShaftDriverNode.validate(inputs);
      expect(val.valid).toBe(true);

      const res = CadParametricShaftDriverNode.compute(inputs);
      expect(res.diameter_mm).toBeGreaterThanOrEqual(20);
      expect(res.length_mm).toBe(Math.round(res.diameter_mm * 1.5));
      expect(res.boolean).toBe(true);
      expect(res.stress_mpa).toBeGreaterThan(0);
    });

    it('scales required shaft diameter up proportionally when transmitting 1000 Nm torque', () => {
      const resLight = CadParametricShaftDriverNode.compute({
        torque_nm: 250,
        yield_strength_mpa: 350,
        safety_factor: 1.5,
      });

      const resHeavy = CadParametricShaftDriverNode.compute({
        torque_nm: 1000,
        yield_strength_mpa: 350,
        safety_factor: 1.5,
      });

      expect(resHeavy.diameter_mm).toBeGreaterThan(resLight.diameter_mm);
      expect(resHeavy.diameter_mm).toBeGreaterThanOrEqual(34);
    });
  });

  describe('3. Flange PCD & Bolt Rule (DIN EN 1092-1 / ISO 965)', () => {
    it('computes compliant PCD, bolt count, and bolt size for flange torque transmission', () => {
      const inputs = {
        diameter_mm: 40,
        torque_nm: 600,
        safety_factor: 2.0,
      };

      const res = CadFlangePcdRuleNode.compute(inputs);
      expect(res.diameter_mm).toBeGreaterThan(40);
      // PCD must accommodate bore + bolt heads + 1.5d edge margin
      expect(res.diameter_mm).toBeGreaterThanOrEqual(75);
      expect(res.number).toBeGreaterThanOrEqual(4);
      expect(res.number % 2).toBe(0); // Even bolt count for dynamic balancing
      expect(res.string).toMatch(/^M(8|10|12|16)$/);

      const report = res.validation_report as any;
      expect(report.status).toBe('VERIFIED_COMPLIANT');
      expect(report.tangentialForceN).toBeGreaterThan(0);
    });
  });

  describe('4. Knowledgeware DFM Checker (CATIA Rules / Eurocode 3)', () => {
    it('passes when wall thickness and hole edge distance satisfy DFM standards', () => {
      const inputs = {
        length_mm: 4.0, // actual wall
        tolerance_mm: 2.5, // min allowed wall
        distance_mm: 15.0, // actual edge distance
        diameter_mm: 9.0, // hole diameter -> min edge req: 1.5 * 9 = 13.5mm
      };

      const res = CadKnowledgewareRuleCheckNode.compute(inputs);
      expect(res.boolean).toBe(true);
      expect(res.safety_factor).toBeGreaterThan(1.0);
      expect(res.string).toContain('PASSED');

      const report = res.validation_report as any;
      expect(report.overallPass).toBe(true);
      expect(report.checks.every((c: any) => c.pass)).toBe(true);
    });

    it('detects and flags wall thickness violations (< t_min)', () => {
      const inputs = {
        length_mm: 1.8, // violation: 1.8 < 2.5
        tolerance_mm: 2.5,
        distance_mm: 20.0,
        diameter_mm: 9.0,
      };

      const res = CadKnowledgewareRuleCheckNode.compute(inputs);
      expect(res.boolean).toBe(false);
      expect(res.safety_factor).toBeLessThan(1.0);
      expect(res.string).toContain('Wall 1.8mm < 2.5mm min');
    });

    it('detects and flags hole-to-edge tear-out violations (e1 < 1.5 * d0)', () => {
      const inputs = {
        length_mm: 5.0,
        tolerance_mm: 2.5,
        distance_mm: 8.0, // violation: 8.0 < 1.5 * 10 = 15.0
        diameter_mm: 10.0,
      };

      const res = CadKnowledgewareRuleCheckNode.compute(inputs);
      expect(res.boolean).toBe(false);
      expect(res.string).toContain('Edge distance 8mm < 15.0mm min');
    });
  });

  describe('5. Procedural Array Driver (Blender Geometry Nodes)', () => {
    it('generates a linear 1D pattern along X axis', () => {
      const inputs = {
        length_mm: 100,
        number: 5,
        diameter_mm: 0,
      };

      const res = CadProceduralArrayDriverNode.compute(inputs);
      const instances = JSON.parse(res.string);
      expect(instances.length).toBe(5);
      expect(instances[0].x).toBe(0);
      expect(instances[4].x).toBe(100);
      expect(instances[2].x).toBe(50);
      expect(res.number).toBe(100);
    });

    it('generates a circular 2D pattern along PCD circle', () => {
      const inputs = {
        length_mm: 0,
        number: 6,
        diameter_mm: 100, // radius = 50mm
      };

      const res = CadProceduralArrayDriverNode.compute(inputs);
      const instances = JSON.parse(res.string);
      expect(instances.length).toBe(6);

      // Angle step is 60 deg
      expect(instances[0].angleDeg).toBe(0);
      expect(instances[0].x).toBeCloseTo(50, 1);
      expect(instances[0].z).toBeCloseTo(0, 1);

      expect(instances[1].angleDeg).toBe(60);
      expect(instances[1].x).toBeCloseTo(25, 1); // 50 * cos(60°) = 25
      expect(instances[1].z).toBeCloseTo(43.3, 1); // 50 * sin(60°) = 43.3

      expect(instances[3].angleDeg).toBe(180);
      expect(instances[3].x).toBeCloseTo(-50, 1);
    });
  });
});
