/**
 * 🧪 UNIT & REGRESSION TEST: CAD MODES & CUTTABLE WELDMENTS
 *
 * Verifies the 3 primary CAD modes:
 * Mod 1: PARÇA (Single-Part Parametric Modeling)
 * Mod 2: KAYNAK + ÇATMA + İŞLEME (Weldment Fabrication & Cuttable Welds)
 * Mod 3: MONTAJ (Mechanical Kinematic Assembly)
 *
 * Cites: ISO 2553:2019, EN 1993-1-8:2005 Clause 4.5.3, AWS D1.1.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useDesignStore } from '../design-studio/designStore';
import { calculateWeldProperties, detectWeldableJoint } from '../design-studio/weldments/weldmentEngine';
import { buildBaseWeldGeometry, createCuttableWeldGeometry } from '../design-studio/weldments/weldGeometryFactory';
import type { WeldBead } from '../design-studio/weldments/weldmentTypes';

describe('CAD Modes (Mod 1: Parça, Mod 2: Kaynak+Çatma+İşleme, Mod 3: Montaj)', () => {
  beforeEach(() => {
    useDesignStore.getState().clearScene();
    useDesignStore.getState().clearWeldBeads();
    useDesignStore.getState().clearMates();
  });

  it('correctly transitions between the 3 CAD modes and synchronizes workbenches', () => {
    const store = useDesignStore.getState();

    // Default to Part mode
    store.setCadMode('part');
    expect(useDesignStore.getState().cadMode).toBe('part');
    expect(useDesignStore.getState().activeWorkbench).toBe('cad');

    // Switch to Weldment & Machining Mode (Mod 2)
    store.setCadMode('weldment');
    expect(useDesignStore.getState().cadMode).toBe('weldment');
    expect(useDesignStore.getState().activeWorkbench).toBe('weldment');

    // Switch to Assembly Mode (Mod 3)
    store.setCadMode('assembly');
    expect(useDesignStore.getState().cadMode).toBe('assembly');
    expect(useDesignStore.getState().activeWorkbench).toBe('assembly');
  });

  it('calculates deterministic ISO 2553 / EN 1993-1-8 weld properties', () => {
    const testBead: WeldBead = {
      id: 'weld-test-1',
      name: 'Fillet Weld 6mm',
      type: 'fillet',
      standard: 'ISO 2553',
      partAId: 'part-1',
      partBId: 'part-2',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      legSizeMm: 6,
      lengthMm: 100,
      material: 'ER70S-6',
      createdAt: Date.now(),
    };

    const report = calculateWeldProperties(testBead);

    // Throat thickness a = 6 * 0.7071 ~ 4.2 mm
    expect(report.throatThicknessMm).toBeCloseTo(4.2, 0);

    // Effective length Leff = L - 2a = 100 - 8.4 = 91.6 mm
    expect(report.effectiveLengthMm).toBeLessThan(100);
    expect(report.effectiveLengthMm).toBeGreaterThan(90);

    // Mass and volume must be strictly positive
    expect(report.weldVolumeCm3).toBeGreaterThan(0);
    expect(report.weldMassKg).toBeGreaterThan(0);

    // Capacity must be strictly positive (shear resistance in kN)
    expect(report.designResistanceKn).toBeGreaterThan(10);
  });

  it('detects joint fit-up geometry between two contacting parts', () => {
    const p1 = {
      id: 'base-plate',
      kind: 'box' as const,
      name: 'Base Plate',
      color: '#fff',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 100, height: 10, length: 120 },
    };

    const p2 = {
      id: 'vert-stem',
      kind: 'box' as const,
      name: 'Vertical Stem',
      color: '#fff',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: 35, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 10, height: 60, length: 120 },
    };

    const fitUp = detectWeldableJoint(p1, p2);
    expect(fitUp).not.toBeNull();
    if (fitUp) {
      expect(fitUp.suggestedType).toBe('fillet');
      expect(fitUp.lengthMm).toBe(120);
      expect(fitUp.defaultLegSizeMm).toBeGreaterThanOrEqual(3);
    }
  });

  it('creates 3D solid physical weld geometry', () => {
    const bead: WeldBead = {
      id: 'weld-geom-test',
      name: 'Weld Geometry Test',
      type: 'fillet',
      standard: 'ISO 2553',
      partAId: 'p1',
      partBId: 'p2',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      legSizeMm: 6,
      lengthMm: 80,
      material: 'ER70S-6',
      createdAt: Date.now(),
    };

    const geom = buildBaseWeldGeometry(bead);
    expect(geom).toBeDefined();
    expect(geom.attributes.position).toBeDefined();
    expect(geom.attributes.position.count).toBeGreaterThan(0);
  });

  it('performs CSG boolean subtraction on cuttable welds (Kesilebilir Kaynak)', () => {
    const cuttableBead: WeldBead = {
      id: 'weld-cut-test',
      name: 'Cuttable Weld with Machined Hole',
      type: 'fillet',
      standard: 'ISO 2553',
      partAId: 'p1',
      partBId: 'p2',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      legSizeMm: 8,
      lengthMm: 100,
      material: 'ER70S-6',
      createdAt: Date.now(),
      // Post-weld machined hole drilled through the weld bead!
      holes: [
        {
          id: 'test-drill-hole',
          size: 'M8',
          type: 'clearance',
          face: 'top',
          x: 0,
          y: 0,
          depth: 20,
          isThroughAll: true,
        },
      ],
      // Post-weld machined slot cutting through the weld bead!
      cuts: [
        {
          id: 'test-slot-cut',
          type: 'slot',
          face: 'top',
          x: 0,
          y: 0,
          width: 10,
          length: 20,
          depth: 10,
          isThroughAll: true,
        },
      ],
    };

    const cutGeom = createCuttableWeldGeometry(cuttableBead);
    expect(cutGeom).toBeDefined();
    expect(cutGeom.attributes.position).toBeDefined();
    expect(cutGeom.attributes.position.count).toBeGreaterThan(0);
  });

  it('loads sample welded chassis with pre-configured cuttable welds and post-machining', () => {
    const store = useDesignStore.getState();
    store.loadSampleWeldedChassis();

    const state = useDesignStore.getState();
    expect(state.cadMode).toBe('weldment');
    expect(state.parts.length).toBe(2);
    expect(state.weldBeads.length).toBe(2);

    // Verify welds have post-machined cuts/holes attached
    const hasCutsOrHoles = state.weldBeads.some(
      (w) => (w.cuts && w.cuts.length > 0) || (w.holes && w.holes.length > 0)
    );
    expect(hasCutsOrHoles).toBe(true);
  });
});
