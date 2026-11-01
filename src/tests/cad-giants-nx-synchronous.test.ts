import { describe, it, expect, beforeEach } from 'vitest';
import { useDesignStore, type DesignPart } from '@/design-studio/designStore';
import {
  applySynchronousMoveFace,
  applyDeleteFaceAndHeal,
  applyResizeHoleDirect,
  applyDraftAngleToPart,
  detectSynchronousCoplanarFaces,
  parseAegis3DCommand,
} from '@/design-studio/directModelingEngine';

describe('CAD Giants Integration — Siemens NX Synchronous Modeling & Live Rules Engine', () => {
  beforeEach(() => {
    useDesignStore.setState({ parts: [], selectedId: null });
  });

  const createMockPart = (overrides?: Partial<DesignPart>): DesignPart => {
    return {
      id: 'part-test-1',
      name: 'Plate Base',
      kind: 'box',
      position: { x: 0, y: 10, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      params: { width: 100, height: 20, depth: 50 },
      holes: [],
      cuts: [],
      ...overrides,
    };
  };

  describe('1. NX Synchronous Move Face (Direct Push/Pull with Feature Sync)', () => {
    it('directly offsets Top face height and keeps through holes synchronized', () => {
      const part = createMockPart({
        holes: [
          {
            id: 'h-1',
            face: 'top',
            size: 'M8',
            x: 0,
            y: 0,
            depth: 20,
            type: 'clearance',
            isThroughAll: true,
          },
        ],
      });

      const res = applySynchronousMoveFace(part, 'top', 15, true);
      expect(res.success).toBe(true);
      expect(res.face).toBe('top');
      expect(res.deltaMm).toBe(15);
      expect(res.newDimensionMm).toBe(35); // 20 + 15

      // Synchronized hole depth updated to accommodate new thickness
      expect(res.updatedHoles.length).toBe(1);
      expect(res.updatedHoles[0].depth).toBe(35);
    });

    it('directly offsets Right face width without mutating unrelated axes', () => {
      const part = createMockPart();
      const res = applySynchronousMoveFace(part, 'right', 25, false);
      expect(res.success).toBe(true);
      expect(res.face).toBe('right');
      expect(res.newDimensionMm).toBe(125); // 100 + 25
      expect(res.updatedParams.width).toBe(125);
      expect(res.updatedParams.height).toBe(20);
      expect(res.updatedParams.depth).toBe(50);
    });
  });

  describe('2. NX Delete Face & Auto-Heal (B-Rep Topology Repair)', () => {
    it('detects and deletes a hole on the active face and heals the surface topology', () => {
      const part = createMockPart({
        holes: [
          {
            id: 'hole-to-delete',
            face: 'top',
            size: 'M10',
            x: 10,
            y: 5,
            depth: 20,
            type: 'clearance',
          },
        ],
      });

      const res = applyDeleteFaceAndHeal(part, 'top');
      expect(res.success).toBe(true);
      expect(res.healedFeatureType).toBe('hole');
      expect(res.updatedHoles.length).toBe(0);
      expect(res.messageEn).toContain('Deleted hole M10 and healed TOP face');
    });

    it('detects and deletes a pocket cut on the active face and heals the surface', () => {
      const part = createMockPart({
        cuts: [
          {
            id: 'cut-pocket-1',
            face: 'front',
            type: 'rect',
            x: 0,
            y: 0,
            width: 30,
            depth: 10,
          },
        ],
      });

      const res = applyDeleteFaceAndHeal(part, 'front');
      expect(res.success).toBe(true);
      expect(res.healedFeatureType).toBe('cut');
      expect(res.updatedCuts.length).toBe(0);
      expect(res.messageTr).toContain('FRONT yüzeyindeki rect cebi silindi');
    });

    it('returns success: false when face is already continuous with no feature to delete', () => {
      const part = createMockPart(); // no holes, no cuts
      const res = applyDeleteFaceAndHeal(part, 'bottom');
      expect(res.success).toBe(false);
      expect(res.healedFeatureType).toBe('none');
      expect(res.messageEn).toContain('Face is continuous');
    });
  });

  describe('3. NX Resize Hole & Instant3D Direct Diameter Modification', () => {
    it('directly resizes existing M6 hole to M12 standard clearance diameter', () => {
      const part = createMockPart({
        holes: [
          {
            id: 'h-m6',
            face: 'top',
            size: 'M6',
            diameter: 6.6,
            x: 0,
            y: 0,
            depth: 20,
            type: 'clearance',
          },
        ],
      });

      const res = applyResizeHoleDirect(part, 'top', 'M12');
      expect(res.success).toBe(true);
      expect(res.oldSize).toBe('M6');
      expect(res.newSize).toBe('M12');
      expect(res.updatedHoles.length).toBe(1);
      expect(res.updatedHoles[0].size).toBe('M12');
      expect(res.updatedHoles[0].diameter).toBe(13.5); // ISO medium clearance for M12
    });

    it('returns success: false when attempting to resize a hole on a face that has none', () => {
      const part = createMockPart();
      const res = applyResizeHoleDirect(part, 'left', 'M8');
      expect(res.success).toBe(false);
      expect(res.messageEn).toContain('No hole found on LEFT face');
    });
  });

  describe('4. Siemens NX Mold Release Draft Angle Generator', () => {
    it('applies standard 3° inward draft angle to part parameters', () => {
      const part = createMockPart();
      const res = applyDraftAngleToPart(part, 3, 'inward');
      expect(res.success).toBe(true);
      expect(res.draftAngle).toBe(3);
      expect(res.draftDirection).toBe('inward');
      expect(res.updatedParams.draftAngle).toBe(3);
      expect(res.updatedParams.draftDirection).toBe('inward');
    });

    it('applies custom 5° outward draft angle for thermoforming/casting molds', () => {
      const part = createMockPart();
      const res = applyDraftAngleToPart(part, 5, 'outward');
      expect(res.success).toBe(true);
      expect(res.draftAngle).toBe(5);
      expect(res.draftDirection).toBe('outward');
      expect(res.updatedParams.draftAngle).toBe(5);
    });
  });

  describe('5. Siemens NX Live Rules — Geometric Relation & Coplanar Face Detector', () => {
    it('detects other assembly parts whose faces are coplanar within tolerance', () => {
      const partA = createMockPart({
        id: 'plate-a',
        position: { x: 0, y: 10, z: 0 },
        params: { width: 100, height: 20, depth: 50 }, // Top face at y = 10 + 10 = 20
      });

      const partB = createMockPart({
        id: 'plate-b',
        position: { x: 120, y: 10, z: 0 },
        params: { width: 80, height: 20, depth: 50 }, // Top face at y = 10 + 10 = 20 (coplanar)
      });

      const partC = createMockPart({
        id: 'plate-c',
        position: { x: 0, y: 40, z: 0 },
        params: { width: 100, height: 20, depth: 50 }, // Top face at y = 40 + 10 = 50 (not coplanar)
      });

      const assembly = [partA, partB, partC];
      const matches = detectSynchronousCoplanarFaces(partA, 'top', assembly);

      expect(matches.length).toBe(1);
      expect(matches[0].partId).toBe('plate-b');
      expect(matches[0].matchedFace).toBe('top');
      expect(matches[0].distanceDifference).toBeCloseTo(0, 2);
    });
  });

  describe('6. AeGiS 3D Command Bar NX Synchronous Operator Aliases', () => {
    it('recognizes delete face / yüzey sil aliases', () => {
      const p1 = parseAegis3DCommand('delete face', null);
      expect(p1.recognized).toBe(true);
      expect(p1.action).toBe('operator');
      expect(p1.details?.operator).toBe('delete-face');

      const p2 = parseAegis3DCommand('yüzey sil', null);
      expect(p2.recognized).toBe(true);
      expect(p2.action).toBe('operator');
      expect(p2.details?.operator).toBe('delete-face');
    });

    it('recognizes draft / kalıp açısı aliases', () => {
      const p = parseAegis3DCommand('kalıp açısı', null);
      expect(p.recognized).toBe(true);
      expect(p.action).toBe('operator');
      expect(p.details?.operator).toBe('draft');
    });

    it('recognizes coplanar / eş düzlem / live rules aliases', () => {
      const p = parseAegis3DCommand('live rules', null);
      expect(p.recognized).toBe(true);
      expect(p.action).toBe('operator');
      expect(p.details?.operator).toBe('coplanar');
    });
  });
});
