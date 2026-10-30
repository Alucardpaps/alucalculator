/**
 * 🧪 Test Suite: Expanded Sketch Dynamic Blocks for 3D Design Studio
 * 
 * Verifies standard engineering sketch contour stamps:
 * 1. DIN 471 / DIN 472 Circlip Retaining Groove
 * 2. DIN 3760 Radial Shaft Seal Bore (Oil Seal)
 * 3. ISO 3601 / AS568 O-Ring Gland Pocket
 * 4. DIN EN 12020 Aluminum T-Slot (Sigma) Profile Contour
 */

import { describe, it, expect } from 'vitest';
import { SKETCH_DYNAMIC_BLOCKS } from '@/design-studio/sketchDynamicBlocks';

describe('Expanded Sketch Dynamic Blocks — Industrial Normative Contours', () => {
  it('registers all 14 sketch dynamic blocks in SKETCH_DYNAMIC_BLOCKS', () => {
    expect(SKETCH_DYNAMIC_BLOCKS.length).toBe(14);

    const requiredIds = [
      'bolt_circle',
      'mounting_slot',
      'vent_louver',
      'nema_mount',
      'din_keyway',
      'hex_pocket',
      'aero_wing',
      'ergonomic_handle',
      'mould_cavity',
      'organic_pedestal',
      'din_circlip_groove',
      'din_radial_seal',
      'iso_oring_gland',
      'tslot_extrusion_contour',
    ];

    for (const id of requiredIds) {
      const blk = SKETCH_DYNAMIC_BLOCKS.find((b) => b.id === id);
      expect(blk, `Block ${id} must exist in SKETCH_DYNAMIC_BLOCKS`).toBeDefined();
      expect(blk?.nameTr).toBeTruthy();
      expect(blk?.nameEn).toBeTruthy();
      expect(blk?.category).toBeTruthy();
      expect(typeof blk?.generate).toBe('function');
    }
  });

  describe('1. DIN 471 / DIN 472 Circlip Groove (din_circlip_groove)', () => {
    const blk = SKETCH_DYNAMIC_BLOCKS.find((b) => b.id === 'din_circlip_groove')!;

    it('generates external shaft circlip groove according to DIN 471 (d2 = d1 - 2*t)', () => {
      const result = blk.generate({ x: 0, y: 0 }, { dia: 30, depth: 1.0, width: 1.5, isInternal: 0 });
      expect(result.solidLoops.length).toBe(1);
      expect(result.constructionLoops?.length).toBe(1);

      const solidPts = result.solidLoops[0];
      expect(solidPts.length).toBe(32);

      // Expected groove diameter = 30 - 2*1.0 = 28 mm -> radius = 14 mm
      const maxDist = Math.max(...solidPts.map((p) => Math.hypot(p.x, p.y)));
      expect(maxDist).toBeCloseTo(14, 0.5);

      // Reference construction circle should be nominal shaft diameter 30 mm -> radius = 15 mm
      const constrPts = result.constructionLoops![0];
      const refDist = Math.max(...constrPts.map((p) => Math.hypot(p.x, p.y)));
      expect(refDist).toBeCloseTo(15, 0.5);
    });

    it('generates internal housing circlip groove according to DIN 472 (d3 = d1 + 2*t)', () => {
      const result = blk.generate({ x: 10, y: 20 }, { dia: 40, depth: 1.2, width: 1.8, isInternal: 1 });
      expect(result.solidLoops.length).toBe(1);

      // Expected groove diameter = 40 + 2*1.2 = 42.4 mm -> radius = 21.2 mm
      const solidPts = result.solidLoops[0];
      const maxDist = Math.max(...solidPts.map((p) => Math.hypot(p.x - 10, p.y - 20)));
      expect(maxDist).toBeCloseTo(21.2, 0.5);
    });
  });

  describe('2. DIN 3760 Radial Shaft Seal Bore (din_radial_seal)', () => {
    const blk = SKETCH_DYNAMIC_BLOCKS.find((b) => b.id === 'din_radial_seal')!;

    it('generates outer seal counterbore and inner clearance hole with construction lines', () => {
      const result = blk.generate({ x: 0, y: 0 }, { shaftDia: 25, sealOD: 42, sealWidth: 7 });
      expect(result.solidLoops.length).toBe(2);
      expect(result.constructionLoops?.length).toBe(2);

      // Loop 1: Outer seal bore (OD 42 mm -> R = 21 mm)
      const outerPts = result.solidLoops[0];
      const outerR = Math.max(...outerPts.map((p) => Math.hypot(p.x, p.y)));
      expect(outerR).toBeCloseTo(21, 0.5);

      // Loop 2: Inner shaft clearance (25 + 2 = 27 mm -> R = 13.5 mm)
      const innerPts = result.solidLoops[1];
      const innerR = Math.max(...innerPts.map((p) => Math.hypot(p.x, p.y)));
      expect(innerR).toBeCloseTo(13.5, 0.5);
    });
  });

  describe('3. ISO 3601 / AS568 O-Ring Gland (iso_oring_gland)', () => {
    const blk = SKETCH_DYNAMIC_BLOCKS.find((b) => b.id === 'iso_oring_gland')!;

    it('generates concentric outer and inner groove loops with centerline construction loop', () => {
      const result = blk.generate({ x: 0, y: 0 }, { innerDia: 50, grooveWidth: 4.0, grooveDepth: 2.8 });
      expect(result.solidLoops.length).toBe(2);
      expect(result.constructionLoops?.length).toBe(1);

      // Outer diameter = 50 + 2*4.0 = 58 mm -> R = 29 mm
      const outerPts = result.solidLoops[0];
      const outerR = Math.max(...outerPts.map((p) => Math.hypot(p.x, p.y)));
      expect(outerR).toBeCloseTo(29, 0.5);

      // Inner diameter = 50 mm -> R = 25 mm
      const innerPts = result.solidLoops[1];
      const innerR = Math.max(...innerPts.map((p) => Math.hypot(p.x, p.y)));
      expect(innerR).toBeCloseTo(25, 0.5);

      // Mean diameter = (50 + 58) / 2 = 54 mm -> R = 27 mm
      const meanPts = result.constructionLoops![0];
      const meanR = Math.max(...meanPts.map((p) => Math.hypot(p.x, p.y)));
      expect(meanR).toBeCloseTo(27, 0.5);
    });
  });

  describe('4. DIN EN 12020 Aluminum T-Slot Profile Contour (tslot_extrusion_contour)', () => {
    const blk = SKETCH_DYNAMIC_BLOCKS.find((b) => b.id === 'tslot_extrusion_contour')!;

    it('generates 4-slot closed outer profile and central core hole for 4040 extrusion', () => {
      const result = blk.generate({ x: 0, y: 0 }, { profileSize: 40, slotWidth: 8, coreDia: 6.8 });
      expect(result.solidLoops.length).toBe(2);

      const outerPts = result.solidLoops[0];
      // 11 points per side * 4 sides = 44 points
      expect(outerPts.length).toBe(44);

      // Outer profile extents should match 40x40 mm (+/- 20 mm from center)
      const xs = outerPts.map((p) => p.x);
      const ys = outerPts.map((p) => p.y);
      const width = Math.max(...xs) - Math.min(...xs);
      const height = Math.max(...ys) - Math.min(...ys);

      expect(width).toBeCloseTo(40, 1.0);
      expect(height).toBeCloseTo(40, 1.0);

      // Inner core hole diameter = 6.8 mm -> R = 3.4 mm
      const corePts = result.solidLoops[1];
      expect(corePts.length).toBe(24);
      const coreR = Math.max(...corePts.map((p) => Math.hypot(p.x, p.y)));
      expect(coreR).toBeCloseTo(3.4, 0.5);
    });

    it('generates 2020 extrusion contour with M5 core hole', () => {
      const result = blk.generate({ x: 50, y: 50 }, { profileSize: 20, slotWidth: 6, coreDia: 4.2 });
      expect(result.solidLoops.length).toBe(2);

      const outerPts = result.solidLoops[0];
      const xs = outerPts.map((p) => p.x);
      const ys = outerPts.map((p) => p.y);
      const width = Math.max(...xs) - Math.min(...xs);
      const height = Math.max(...ys) - Math.min(...ys);

      expect(width).toBeCloseTo(20, 1.0);
      expect(height).toBeCloseTo(20, 1.0);

      const corePts = result.solidLoops[1];
      const coreR = Math.max(...corePts.map((p) => Math.hypot(p.x - 50, p.y - 50)));
      expect(coreR).toBeCloseTo(2.1, 0.5);
    });
  });
});
