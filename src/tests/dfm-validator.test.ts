import { describe, it, expect } from 'vitest';
import { evaluateAssemblyDfm } from '@/engines/dfm/dfmEvaluator';
import { canExport } from '@/engines/dfm/exportGate';
import { distPointToLoop, distPointToEdge } from '@/engines/dfm/geometryQueries';
import { rectangleLoop, circleLoop, type ProfileEdge } from '@/cad/geometry/profileLoop';
import type { DesignPart } from '@/design-studio/designStore';

describe('DFM Geometry Distance Queries', () => {
  it('computes exact distance from point to segment edge', () => {
    const edge: ProfileEdge = {
      kind: 'line',
      a: { x: 0, y: 0 },
      b: { x: 10, y: 0 },
    };

    expect(distPointToEdge({ x: 5, y: 5 }, edge)).toBeCloseTo(5, 4);
    expect(distPointToEdge({ x: 15, y: 0 }, edge)).toBeCloseTo(5, 4);
    expect(distPointToEdge({ x: -3, y: 4 }, edge)).toBeCloseTo(5, 4);
  });

  it('computes exact distance from point to circular arc edge', () => {
    const edge: ProfileEdge = {
      kind: 'arc',
      center: { x: 0, y: 0 },
      radius: 10,
      a0: 0,
      a1: Math.PI / 2, // First quadrant arc
      ccw: true,
    };

    // Point on radial ray in first quadrant (dist = 15 - 10 = 5)
    expect(distPointToEdge({ x: 15 * Math.cos(Math.PI / 4), y: 15 * Math.sin(Math.PI / 4) }, edge)).toBeCloseTo(5, 3);

    // Point outside angle range, clamps to endpoint (10, 0)
    expect(distPointToEdge({ x: 10, y: -5 }, edge)).toBeCloseTo(5, 3);
  });

  it('computes Euclidean distance to rectangular profile loop', () => {
    const loop = rectangleLoop({ x: 0, y: 0 }, 100, 60); // Centered at origin, x: [-50, 50], y: [-30, 30]

    // Point at (40, 0) -> distance to right edge (x = 50) is 10
    expect(distPointToLoop({ x: 40, y: 0 }, loop)).toBeCloseTo(10, 4);

    // Point at (0, 25) -> distance to top edge (y = 30) is 5
    expect(distPointToLoop({ x: 0, y: 25 }, loop)).toBeCloseTo(5, 4);
  });
});

describe('DFM Assembly Evaluator & Rules', () => {
  it('passes a safe plate with a centered M6 through hole (100 score, 0 issues)', () => {
    const safePlate: DesignPart = {
      id: 'plate-1',
      name: 'Base Plate',
      kind: 'plate',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      params: { width: 100, length: 100, depth: 15 },
      holes: [
        {
          id: 'h1',
          size: 'M6',
          x: 0,
          y: 0,
          type: 'clearance',
          diameter: 6.6,
          isThrough: true,
          face: 'top',
        },
      ],
      color: '#ffffff',
      roughness: 0.5,
      metalness: 0.5,
      opacity: 1,
      visible: true,
      locked: false,
    };

    const report = evaluateAssemblyDfm([safePlate], [], 'al-6061-t6');
    expect(report.passed).toBe(true);
    expect(report.score).toBe(100);
    expect(report.criticalCount).toBe(0);
    expect(report.issues).toHaveLength(0);
  });

  it('detects hole breaching workpiece boundary (HOLE_EDGE_CUT critical)', () => {
    const breachedPlate: DesignPart = {
      id: 'plate-breached',
      name: 'Breached Edge Plate',
      kind: 'plate',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      params: { width: 60, length: 40, depth: 10 }, // half width = 30
      holes: [
        {
          id: 'h_breach',
          size: 'M10',
          x: 28, // hole radius is 5.5mm, center at 28 -> edge at 33.5mm > 30mm boundary!
          y: 0,
          type: 'clearance',
          diameter: 11,
          isThrough: true,
          face: 'top',
        },
      ],
      color: '#ffffff',
      roughness: 0.5,
      metalness: 0.5,
      opacity: 1,
      visible: true,
      locked: false,
    };

    const report = evaluateAssemblyDfm([breachedPlate], [], 'al-6061-t6');
    expect(report.passed).toBe(false);
    expect(report.criticalCount).toBeGreaterThan(0);
    const cutIssue = report.issues.find((i) => i.ruleId === 'HOLE_EDGE_CUT');
    expect(cutIssue).toBeDefined();
    expect(cutIssue?.severity).toBe('CRITICAL');
  });

  it('detects hole too close to workpiece edge (HOLE_EDGE_CLEARANCE VDI 2230 center rule)', () => {
    const edgeRiskPlate: DesignPart = {
      id: 'plate-edge-risk',
      name: 'Edge Risk Plate',
      kind: 'plate',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      params: { width: 60, length: 40, depth: 10 }, // half width = 30
      holes: [
        {
          id: 'h_close',
          size: 'M10', // D = 10mm -> VDI 2230 requires center dist >= 15mm
          x: 23, // center to edge = 30 - 23 = 7mm < 15mm required!
          y: 0,
          type: 'clearance',
          diameter: 11, // radius 5.5mm -> remaining wall = 7 - 5.5 = 1.5mm < 5mm (0.5 * D)
          isThrough: true,
          face: 'top',
        },
      ],
      color: '#ffffff',
      roughness: 0.5,
      metalness: 0.5,
      opacity: 1,
      visible: true,
      locked: false,
    };

    const report = evaluateAssemblyDfm([edgeRiskPlate], [], 'al-6061-t6');
    const clearanceIssue = report.issues.find((i) => i.ruleId === 'HOLE_EDGE_CLEARANCE');
    expect(clearanceIssue).toBeDefined();
    expect(clearanceIssue?.severity).toBe('CRITICAL');
    expect(report.score).toBeLessThan(80);
  });

  it('detects overlapping coaxial or intersecting holes (HOLE_HOLE_OVERLAP critical)', () => {
    const overlapPart: DesignPart = {
      id: 'overlap-part',
      name: 'Overlapping Holes Block',
      kind: 'box',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      params: { width: 100, height: 50, depth: 30 },
      holes: [
        {
          id: 'h_a',
          size: 'M8',
          x: -2,
          y: 0,
          type: 'clearance',
          diameter: 9, // radius 4.5
          isThrough: true,
          face: 'top',
        },
        {
          id: 'h_b',
          size: 'M8',
          x: 2, // distance between centers is 4mm < 9mm (sum of radii)!
          y: 0,
          type: 'clearance',
          diameter: 9, // radius 4.5
          isThrough: true,
          face: 'top',
        },
      ],
      color: '#ffffff',
      roughness: 0.5,
      metalness: 0.5,
      opacity: 1,
      visible: true,
      locked: false,
    };

    const report = evaluateAssemblyDfm([overlapPart], [], 'al-6061-t6');
    expect(report.passed).toBe(false);
    const overlapIssue = report.issues.find((i) => i.ruleId === 'HOLE_HOLE_OVERLAP');
    expect(overlapIssue).toBeDefined();
    expect(overlapIssue?.severity).toBe('CRITICAL');
  });

  it('validates tap thread engagement depth and blind chip clearance', () => {
    // M10 tap hole in aluminum (nominal diameter D = 10, pitch = 1.5mm)
    // Insufficient thread engagement: depth = 8mm (< 1.0 * D = 10mm critical)
    const shallowTapPart: DesignPart = {
      id: 'tap-shallow',
      name: 'Shallow Tap Plate',
      kind: 'plate',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      params: { width: 80, length: 80, depth: 30 },
      holes: [
        {
          id: 'tap_1',
          size: 'M10',
          x: 0,
          y: 0,
          type: 'tap',
          diameter: 8.5,
          isThrough: false,
          depth: 8, // thread depth 8mm < 10mm
          face: 'top',
        },
      ],
      color: '#ffffff',
      roughness: 0.5,
      metalness: 0.5,
      opacity: 1,
      visible: true,
      locked: false,
    };

    const report = evaluateAssemblyDfm([shallowTapPart], [], 'al-6061-t6');
    const tapIssue = report.issues.find((i) => i.ruleId === 'TAP_ENGAGEMENT');
    expect(tapIssue).toBeDefined();
    expect(tapIssue?.severity).toBe('CRITICAL');
  });

  it('detects thin tube wall violations (WALL_MIN_ABS critical)', () => {
    const thinTube: DesignPart = {
      id: 'thin-tube',
      name: 'Paper-thin Extrusion',
      kind: 'tube',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      params: {
        diameter: 50,
        innerDiameter: 49.2, // wall = (50 - 49.2) / 2 = 0.4mm < 0.8mm min!
        height: 100,
      },
      holes: [],
      color: '#ffffff',
      roughness: 0.5,
      metalness: 0.5,
      opacity: 1,
      visible: true,
      locked: false,
    };

    const report = evaluateAssemblyDfm([thinTube], [], 'al-6061-t6');
    expect(report.passed).toBe(false);
    const wallIssue = report.issues.find((i) => i.ruleId === 'WALL_MIN_ABS');
    expect(wallIssue).toBeDefined();
    expect(wallIssue?.severity).toBe('CRITICAL');
  });
});

describe('DFM Export Quality Gate', () => {
  it('allows export unconditionally when DFM report passed with 0 critical issues', () => {
    const report = {
      score: 100,
      passed: true,
      criticalCount: 0,
      warningCount: 0,
      noticeCount: 0,
      issues: [],
      timestamp: Date.now(),
    };

    const res = canExport(report);
    expect(res.allowed).toBe(true);
    expect(res.blockers).toHaveLength(0);
    expect(res.overridden).toBe(false);
  });

  it('blocks export when critical DFM issues exist without override', () => {
    const report = {
      score: 45,
      passed: false,
      criticalCount: 1,
      warningCount: 0,
      noticeCount: 0,
      issues: [
        {
          id: 'iss-1',
          ruleId: 'HOLE_EDGE_CUT' as const,
          severity: 'CRITICAL' as const,
          partId: 'part-1',
          partName: 'Plate',
          title: 'Hole cuts workpiece edge',
          titleTr: 'Delik iş parçası kenarını kesiyor',
          message: 'Measured remaining wall is negative',
          messageTr: 'Ölçülen kalan et payı negatif',
          measured: -1.2,
          required: 0,
          unit: 'mm',
          standard: 'VDI 2230',
        },
      ],
      timestamp: Date.now(),
    };

    const res = canExport(report);
    expect(res.allowed).toBe(false);
    expect(res.blockers).toHaveLength(1);
    expect(res.overridden).toBe(false);
  });

  it('permits export with override and generates audit feature branch', () => {
    const report = {
      score: 45,
      passed: false,
      criticalCount: 1,
      warningCount: 0,
      noticeCount: 0,
      issues: [
        {
          id: 'iss-1',
          ruleId: 'HOLE_EDGE_CUT' as const,
          severity: 'CRITICAL' as const,
          partId: 'part-1',
          partName: 'Plate',
          title: 'Hole cuts workpiece edge',
          titleTr: 'Delik iş parçası kenarını kesiyor',
          message: 'Measured remaining wall is negative',
          messageTr: 'Ölçülen kalan et payı negatif',
          measured: -1.2,
          required: 0,
          unit: 'mm',
          standard: 'VDI 2230',
        },
      ],
      timestamp: Date.now(),
    };

    const res = canExport(report, { allowOverride: true, overrideReason: 'Prototype test run' });
    expect(res.allowed).toBe(true);
    expect(res.overridden).toBe(true);
    expect(res.overrideBranch).toBeDefined();
    expect(res.overrideBranch?.startsWith('dfm-override-')).toBe(true);
  });
});
