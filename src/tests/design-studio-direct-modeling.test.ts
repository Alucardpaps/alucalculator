import { describe, it, expect } from 'vitest';
import {
  applyPushPull,
  applyCornerBoltPattern,
  applyCenterBore,
  applyLightweightIsogrid,
  applyCenterSlot,
  evaluateDfmHealth,
  parseAegis3DCommand,
} from '@/design-studio/directModelingEngine';
import { type DesignPart } from '@/design-studio/designStore';

const mockPlate: DesignPart = {
  id: 'test-plate-1',
  kind: 'box',
  name: 'Plate 80x40x10',
  color: '#6b9fff',
  visible: true,
  locked: false,
  parentId: null,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  params: { width: 80, height: 40, depth: 10 },
  holes: [],
  cuts: [],
};

const mockCylinder: DesignPart = {
  id: 'test-cylinder-1',
  kind: 'cylinder',
  name: 'Shaft Ø30x60',
  color: '#34d399',
  visible: true,
  locked: false,
  parentId: null,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  params: { diameter: 30, length: 60 },
  holes: [],
  cuts: [],
};

describe('🚀 Next-Gen Direct 3D Modeling & AeGiS Command Engine', () => {
  describe('1. applyPushPull', () => {
    it('pushes top face of a box to increase height and syncs name callout', () => {
      const res = applyPushPull(mockPlate, 'top', 5);
      expect(res.axisKey).toBe('height');
      expect(res.newVal).toBe(45);
      expect(res.updatedParams.height).toBe(45);
      expect(res.updatedName).toBe('Plate 80x45x10');
    });

    it('pulls side face to shrink width', () => {
      const res = applyPushPull(mockPlate, 'left', -10);
      expect(res.axisKey).toBe('width');
      expect(res.newVal).toBe(70);
      expect(res.updatedParams.width).toBe(70);
      expect(res.updatedName).toBe('Plate 70x40x10');
    });

    it('pushes cylinder length on top/bottom face and updates name', () => {
      const res = applyPushPull(mockCylinder, 'top', 15);
      expect(res.axisKey).toBe('length');
      expect(res.newVal).toBe(75);
      expect(res.updatedName).toBe('Shaft Ø30x75');
    });

    it('clamps push-pull to minimum 1mm to prevent geometry inversion', () => {
      const res = applyPushPull(mockPlate, 'top', -100);
      expect(res.newVal).toBe(1);
    });
  });

  describe('2. applyCornerBoltPattern', () => {
    it('generates 4 corner counterbore holes with standard ISO edge clearance', () => {
      const bolts = applyCornerBoltPattern(mockPlate, 'front', 'M6');
      expect(bolts).toHaveLength(4);
      expect(bolts[0].size).toBe('M6');
      expect(bolts[0].type).toBe('counterbore');
      expect(bolts[0].face).toBe('front');
      expect(bolts[0].isThroughAll).toBe(true);

      // Verify symmetry around origin
      const [b1, b2, b3, b4] = bolts;
      expect(b1.x).toBe(-b2.x);
      expect(b1.y).toBe(b2.y);
      expect(b3.x).toBe(b2.x);
      expect(b3.y).toBe(-b2.y);
    });

    it('returns empty array if face is too small for margin', () => {
      const tinyPart: DesignPart = {
        ...mockPlate,
        params: { width: 4, height: 4, depth: 2 },
      };
      const bolts = applyCornerBoltPattern(tinyPart, 'top', 'M8');
      expect(bolts).toHaveLength(0);
    });
  });

  describe('3. applyCenterBore', () => {
    it('creates a centered through-bore at (0, 0)', () => {
      const bore = applyCenterBore(mockPlate, 'top', 16, 'clearance');
      expect(bore.x).toBe(0);
      expect(bore.y).toBe(0);
      expect(bore.diameter).toBe(16);
      expect(bore.type).toBe('clearance');
      expect(bore.isThroughAll).toBe(true);
    });
  });

  describe('4. applyLightweightIsogrid', () => {
    it('generates pocket grid cutting ~35% mass on flat plate', () => {
      const pockets = applyLightweightIsogrid(mockPlate, 'front', 4, 5);
      expect(pockets.length).toBeGreaterThanOrEqual(4);
      expect(pockets[0].type).toBe('rect');
      expect(pockets[0].depth).toBe(5);
    });
  });

  describe('5. applyCenterSlot', () => {
    it('creates a precision sliding keyway slot at origin', () => {
      const slot = applyCenterSlot(mockPlate, 'top', 12, 35, 4);
      expect(slot.type).toBe('slot');
      expect(slot.x).toBe(0);
      expect(slot.y).toBe(0);
      expect(slot.width).toBe(12);
      expect(slot.length).toBe(35);
      expect(slot.depth).toBe(4);
    });
  });

  describe('6. evaluateDfmHealth', () => {
    it('calculates machinability score and mass for solid plate', () => {
      const dfm = evaluateDfmHealth(mockPlate);
      expect(dfm.score).toBeGreaterThan(80);
      expect(dfm.isMachinable).toBe(true);
      expect(dfm.massKg).toBeGreaterThan(0);
      expect(dfm.minWallMm).toBeGreaterThanOrEqual(5);
    });

    it('detects thin wall warning if plate thickness < 1.0mm', () => {
      const thinPart: DesignPart = {
        ...mockPlate,
        params: { width: 80, height: 40, depth: 0.6 },
      };
      const dfm = evaluateDfmHealth(thinPart);
      expect(dfm.score).toBeLessThan(75);
      expect(dfm.warnings.some((w) => w.includes('Cidar') || w.includes('Wall') || w.includes('Et kalınlığı'))).toBe(true);
    });

    it('reports weight savings when isogrid pockets are added', () => {
      const pockets = applyLightweightIsogrid(mockPlate, 'front', 4, 5);
      const lightenedPart: DesignPart = {
        ...mockPlate,
        cuts: pockets,
      };
      const dfm = evaluateDfmHealth(lightenedPart);
      expect(dfm.weightSavingsPct).toBeGreaterThan(0);
    });
  });

  describe('7. parseAegis3DCommand (NLP Console)', () => {
    it('parses dimension inputs like 120x60x15', () => {
      const res = parseAegis3DCommand('120x60x15 mm', mockPlate);
      expect(res.recognized).toBe(true);
      expect(res.action).toBe('resize');
      expect(res.details?.width).toBe(120);
      expect(res.details?.height).toBe(60);
      expect(res.details?.depth).toBe(15);
    });

    it('parses hole commands in Turkish and English', () => {
      const resTr = parseAegis3DCommand('merkeze M8 delik aç', mockPlate);
      expect(resTr.recognized).toBe(true);
      expect(resTr.action).toBe('hole');
      expect(resTr.details?.diameterMm).toBe(8);

      const resEn = parseAegis3DCommand('center hole 16mm', mockPlate);
      expect(resEn.recognized).toBe(true);
      expect(resEn.action).toBe('hole');
      expect(resEn.details?.diameterMm).toBe(16);
    });

    it('parses corner bolt pattern commands', () => {
      const res = parseAegis3DCommand('4 cıvata M6', mockPlate);
      expect(res.recognized).toBe(true);
      expect(res.action).toBe('bolts');
      expect(res.details?.boltSize).toBe('M6');
    });

    it('parses lightweight isogrid pocket commands', () => {
      const res = parseAegis3DCommand('hafiflet', mockPlate);
      expect(res.recognized).toBe(true);
      expect(res.action).toBe('lightweight');
    });

    it('parses slot keyway commands', () => {
      const res = parseAegis3DCommand('kanal 10x35', mockPlate);
      expect(res.recognized).toBe(true);
      expect(res.action).toBe('slot');
      expect(res.details?.widthMm).toBe(10);
      expect(res.details?.lengthMm).toBe(35);
    });

    it('parses material assignment commands', () => {
      const res = parseAegis3DCommand('alüminyum 7075-t6', mockPlate);
      expect(res.recognized).toBe(true);
      expect(res.action).toBe('material');
      expect(res.details?.materialId).toBe('al-7075-t6');
    });

    it('gracefully returns recognized: false on unparseable inputs', () => {
      const res = parseAegis3DCommand('anlamsız bir metin 12345 xyz', mockPlate);
      expect(res.recognized).toBe(false);
      expect(res.action).toBe('unknown');
    });
  });
});
