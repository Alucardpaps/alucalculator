import { describe, it, expect, beforeEach } from 'vitest';
import { useDesignStore, type DesignPart } from '@/design-studio/designStore';
import {
  diagnosePartAndAssembly,
  executeAutoHealThickenWall,
  executeAutoHealOffsetHole,
  executeAutoHealShallowPocket,
} from '@/design-studio/designDoctorEngine';
import { parseAegis3DCommand } from '@/design-studio/directModelingEngine';

describe('CAD Giants Integration — AeGiS CAD Academy & In-Canvas Design Doctor (Phase 5)', () => {
  beforeEach(() => {
    useDesignStore.setState({ parts: [], selectedId: null, mates: [] });
  });

  const createMockPart = (overrides?: Partial<DesignPart>): DesignPart => ({
    id: 'part-doc-1',
    name: 'Bracket Housing',
    kind: 'box',
    position: { x: 0, y: 10, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    params: { width: 100, height: 20, depth: 60 },
    holes: [],
    cuts: [],
    ...overrides,
  });

  describe('1. In-Canvas Design Doctor Health Audit', () => {
    it('returns score 100 and isCompliant true for a clean, properly engineered part', () => {
      const cleanPart = createMockPart({
        params: { width: 100, height: 20, depth: 60 },
        holes: [
          {
            id: 'h-1',
            face: 'top',
            size: 'M6',
            diameter: 6.6,
            x: 0,
            y: 0, // In the dead center of 100x60 plate (margins = 50mm, 30mm >> 1.5*6.6=9.9mm)
            depth: 20,
            type: 'clearance',
          },
        ],
      });

      const report = diagnosePartAndAssembly(cleanPart, [cleanPart], []);
      expect(report.score).toBe(100);
      expect(report.isCompliant).toBe(true);
      expect(report.criticalCount).toBe(0);
      expect(report.warningCount).toBe(0);
      expect(report.issues.length).toBe(0);
    });

    it('detects critical thin-wall (< 1.5mm) and penalizes health score', () => {
      const thinPart = createMockPart({
        params: { width: 100, height: 1.2, depth: 60 }, // 1.2mm < 1.5mm critical
      });

      const report = diagnosePartAndAssembly(thinPart, [thinPart], []);
      expect(report.isCompliant).toBe(false);
      expect(report.criticalCount).toBe(1);
      expect(report.score).toBeLessThanOrEqual(70);

      const issue = report.issues.find((i) => i.category === 'wall');
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('critical');
      expect(issue?.standardCitation).toContain('ISO 2768');
    });

    it('detects Eurocode 3 hole-to-edge tear-out violation (< 1.2d)', () => {
      const badHolePart = createMockPart({
        params: { width: 100, height: 20, depth: 60 }, // Half-width = 50mm
        holes: [
          {
            id: 'h-edge',
            face: 'top',
            size: 'M10',
            diameter: 10.0,
            x: 45, // Margin from edge = 50 - 45 = 5mm. Required >= 12mm (1.2*10)
            y: 0,
            depth: 20,
            type: 'clearance',
          },
        ],
      });

      const report = diagnosePartAndAssembly(badHolePart, [badHolePart], []);
      expect(report.criticalCount).toBeGreaterThanOrEqual(1);

      const holeIssue = report.issues.find((i) => i.category === 'hole');
      expect(holeIssue).toBeDefined();
      expect(holeIssue?.severity).toBe('critical');
      expect(holeIssue?.standardCitation).toContain('Eurocode 3');
    });

    it('detects VDI 2230 insufficient thread engagement in aluminum (< 1.5d)', () => {
      const shortTapPart = createMockPart({
        params: { width: 100, height: 20, depth: 60 },
        holes: [
          {
            id: 'h-tap',
            face: 'top',
            size: 'M8',
            diameter: 8.0,
            x: 0,
            y: 0,
            depth: 8.0, // 8.0mm < 1.5 * 8 = 12mm
            type: 'tap',
          },
        ],
      });

      const report = diagnosePartAndAssembly(shortTapPart, [shortTapPart], []);
      const tapIssue = report.issues.find((i) => i.category === 'thread');
      expect(tapIssue).toBeDefined();
      expect(tapIssue?.severity).toBe('warning');
      expect(tapIssue?.standardCitation).toContain('VDI 2230');
    });

    it('detects deep pocket aspect ratio tool vibration (> 4.0x)', () => {
      const deepCutPart = createMockPart({
        cuts: [
          {
            id: 'c-deep',
            face: 'top',
            type: 'rect',
            x: 0,
            y: 0,
            width: 10,
            length: 10,
            depth: 45, // aspect = 45 / 10 = 4.5x > 4.0x
          },
        ],
      });

      const report = diagnosePartAndAssembly(deepCutPart, [deepCutPart], []);
      const pocketIssue = report.issues.find((i) => i.category === 'pocket');
      expect(pocketIssue).toBeDefined();
      expect(pocketIssue?.severity).toBe('warning');
      expect(pocketIssue?.autoHealAction).toBe('shallow-pocket');
    });

    it('detects Inventor Design Doctor unconstrained parts in multi-part assembly', () => {
      const partA = createMockPart({ id: 'part-a', name: 'Base' });
      const partB = createMockPart({ id: 'part-b', name: 'Cover' });

      // No mates in assembly
      const report = diagnosePartAndAssembly(null, [partA, partB], []);
      const mateIssues = report.issues.filter((i) => i.category === 'mate');
      expect(mateIssues.length).toBe(2);
      expect(mateIssues[0].autoHealAction).toBe('ground-part');
    });
  });

  describe('2. Design Doctor 1-Click Auto-Heal Executors', () => {
    it('heals thin-wall part by thickening to standard 2.5mm', () => {
      const thinPart = createMockPart({
        params: { width: 100, height: 1.2, depth: 60 },
      });

      const patch = executeAutoHealThickenWall(thinPart, 2.5);
      expect(patch.params?.height).toBe(2.5);
    });

    it('heals edge hole tear-out by shifting coordinate inward to safe 1.5d boundary', () => {
      const part = createMockPart({
        params: { width: 100, height: 60, depth: 20 }, // half-width = 50, half-height = 30
        holes: [
          {
            id: 'h-danger',
            face: 'top',
            size: 'M10',
            diameter: 10,
            x: 45, // edge distance is 5mm -> required 15mm (1.5*10) -> safe max X = 50 - 15 = 35mm
            y: 0,
            depth: 20,
            type: 'clearance',
          },
        ],
      });

      const patch = executeAutoHealOffsetHole(part, 'h-danger', 1.5);
      expect(patch.holes).toBeDefined();
      expect(patch.holes?.[0].x).toBe(35);
    });

    it('heals deep pocket by capping depth to safe 3.0x width', () => {
      const part = createMockPart({
        cuts: [
          {
            id: 'c-deep',
            face: 'top',
            type: 'rect',
            x: 0,
            y: 0,
            width: 10,
            length: 10,
            depth: 45, // 4.5x -> should be capped to 30mm (3.0 * 10)
          },
        ],
      });

      const patch = executeAutoHealShallowPocket(part, 'c-deep');
      expect(patch.cuts).toBeDefined();
      expect(patch.cuts?.[0].depth).toBe(30);
    });
  });

  describe('3. AeGiS 3D Command Bar Aliases for Doctor & Academy', () => {
    it('recognizes doctor / dfm / sağlık aliases', () => {
      const p1 = parseAegis3DCommand('doctor', null);
      expect(p1.recognized).toBe(true);
      expect(p1.details?.operator).toBe('doctor');

      const p2 = parseAegis3DCommand('dfm', null);
      expect(p2.recognized).toBe(true);
      expect(p2.details?.operator).toBe('doctor');
    });

    it('recognizes academy / akademi / eğitim aliases', () => {
      const p1 = parseAegis3DCommand('academy', null);
      expect(p1.recognized).toBe(true);
      expect(p1.details?.operator).toBe('academy');

      const p2 = parseAegis3DCommand('eğitim', null);
      expect(p2.recognized).toBe(true);
      expect(p2.details?.operator).toBe('academy');
    });
  });
});
