import { describe, it, expect } from 'vitest';
import {
  solveCustom3DPart,
  FixationType,
} from '@/engines/fea/FeaTemplateSolver';
import { FEA_MATERIALS } from '@/engines/fea/StlFeaSolver';
import { CrossModuleBridge } from '@/system/crossModuleBridge';

describe('FEA 3D Integration, Fixation & Force Direction Engine', () => {
  const al6061 = FEA_MATERIALS['al-6061-t6'];
  const steelS355 = FEA_MATERIALS['steel-s355'];

  it('solves Custom 3D Part under downward vertical load (-Y) with Cantilever fixation', () => {
    const result = solveCustom3DPart(
      {
        partName: 'Alu 4040 Profile',
        partKind: 'box',
        length: 300,
        height: 40,
        width: 40,
        loadMagnitude: 2000,
        loadDirection: [0, -1, 0],
        fixation: 'fixed-left',
      },
      al6061
    );

    expect(result.templateId).toBe('custom-3d');
    expect(result.partName).toBe('Alu 4040 Profile');
    expect(result.maxVonMisesMpa).toBeGreaterThan(0);
    expect(result.maxDisplacementMm).toBeGreaterThan(0);
    expect(result.safetyFactor).toBeGreaterThan(0);
    expect(result.withinTolerance).toBe(true);

    // Verify fixation boundary anchors
    expect(result.fixations).toBeDefined();
    expect(result.fixations?.length).toBeGreaterThanOrEqual(3);
    expect(result.fixations?.some(f => f.position[0] === 0)).toBe(true);

    // Verify 3D force direction vector
    expect(result.forceVector).toBeDefined();
    expect(result.forceVector?.magnitudeN).toBe(2000);
    expect(result.forceVector?.direction).toEqual([0, -1, 0]);
    expect(result.forceVector?.applicationPoint[0]).toBe(300);
  });

  it('solves Custom 3D Part under pure axial tensile load (+X)', () => {
    const result = solveCustom3DPart(
      {
        partName: 'Tie Rod',
        partKind: 'cylinder',
        length: 200,
        height: 30,
        width: 30,
        diameter: 30,
        loadMagnitude: 15000,
        loadDirection: [1, 0, 0],
        fixation: 'fixed-left',
      },
      steelS355
    );

    expect(result.maxVonMisesMpa).toBeGreaterThan(0);
    expect(result.forceVector?.direction).toEqual([1, 0, 0]);
    const expectedAxial = 15000 / (Math.PI * 15 * 15);
    expect(result.maxVonMisesMpa).toBeCloseTo(expectedAxial, 0);
  });

  it('evaluates Double Clamped (both-ends) and Simply Supported fixations correctly', () => {
    const cantilever = solveCustom3DPart(
      {
        length: 400,
        height: 50,
        width: 50,
        loadMagnitude: 3000,
        loadDirection: [0, -1, 0],
        fixation: 'fixed-left',
      },
      al6061
    );

    const clamped = solveCustom3DPart(
      {
        length: 400,
        height: 50,
        width: 50,
        loadMagnitude: 3000,
        loadDirection: [0, -1, 0],
        fixation: 'both-ends',
      },
      al6061
    );

    const simplySupported = solveCustom3DPart(
      {
        length: 400,
        height: 50,
        width: 50,
        loadMagnitude: 3000,
        loadDirection: [0, -1, 0],
        fixation: 'simply-supported',
      },
      al6061
    );

    expect(cantilever.maxVonMisesMpa).toBeGreaterThan(simplySupported.maxVonMisesMpa);
    expect(simplySupported.maxVonMisesMpa).toBeGreaterThan(clamped.maxVonMisesMpa);
    expect(clamped.fixations?.some(f => f.position[0] === 0)).toBe(true);
    expect(clamped.fixations?.some(f => f.position[0] === 400)).toBe(true);
  });

  it('handles custom 3D diagonal vector load [Fx, Fy, Fz]', () => {
    const result = solveCustom3DPart(
      {
        partName: 'Angled Bracket Arm',
        partKind: 'box',
        length: 250,
        height: 40,
        width: 40,
        loadMagnitude: 5000,
        loadDirection: [1, -1, 1], // 3D combined load
        fixation: 'fixed-bottom',
      },
      steelS355
    );

    expect(result.maxVonMisesMpa).toBeGreaterThan(0);
    expect(result.forceVector?.direction[0]).toBeCloseTo(1 / Math.sqrt(3), 2);
    expect(result.forceVector?.direction[1]).toBeCloseTo(-1 / Math.sqrt(3), 2);
    expect(result.forceVector?.direction[2]).toBeCloseTo(1 / Math.sqrt(3), 2);
  });

  it('computes dynamic modal eigenfrequencies (f1, f2, f3) and critical RPM accurately', () => {
    const cantilever = solveCustom3DPart(
      {
        partName: 'Alu Beam',
        partKind: 'box',
        length: 500,
        height: 50,
        width: 50,
        loadMagnitude: 1000,
        loadDirection: [0, -1, 0],
        fixation: 'fixed-left',
      },
      al6061
    );

    expect(cantilever.modal).toBeDefined();
    expect(cantilever.modal?.f1_hz).toBeGreaterThan(0);
    expect(cantilever.modal?.f2_hz).toBeGreaterThan(cantilever.modal?.f1_hz || 0);
    expect(cantilever.modal?.f3_hz).toBeGreaterThan(cantilever.modal?.f2_hz || 0);
    expect(cantilever.modal?.critical_rpm).toBe(Math.round((cantilever.modal?.f1_hz || 0) * 60));
    expect(cantilever.modal?.omega1_rad_s).toBeGreaterThan(0);
  });

  it('CrossModuleBridge transmits 3D parts to FEA', () => {
    const res = CrossModuleBridge.sendPartToFEA('test-part-123', { switchWindow: false });
    expect(res).toBeDefined();
  });
});
