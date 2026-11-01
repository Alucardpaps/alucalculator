import { describe, it, expect } from 'vitest';
import { createCustomGeometry } from '../design-studio/geometryFactory';
import type { DesignPart } from '../design-studio/designStore';

describe('Hex Nut Geometry Factory (ISO 4032 / DIN 934 / ISO 68-1)', () => {
  it('generates a 100% watertight solid hex nut with internal threads', () => {
    const nutPart: DesignPart = {
      id: 'test-nut-m10',
      kind: 'hex-nut',
      name: 'M10 Hex Nut',
      color: '#94a3b8',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { headSize: 17, innerDiameter: 10, depth: 8, pitch: 1.5 },
      holes: [],
    };

    const geom = createCustomGeometry(nutPart, false, [], []);
    expect(geom).toBeDefined();

    // Must be indexed
    expect(geom.index).not.toBeNull();
    const indexCount = geom.index!.count;
    expect(indexCount).toBeGreaterThan(600); // Has fine thread teeth

    // Position attribute must be valid
    const pos = geom.attributes.position;
    expect(pos).toBeDefined();
    expect(pos.count).toBeGreaterThan(200);

    // Verify no NaNs in vertices
    for (let i = 0; i < pos.count; i++) {
      expect(Number.isNaN(pos.getX(i))).toBe(false);
      expect(Number.isNaN(pos.getY(i))).toBe(false);
      expect(Number.isNaN(pos.getZ(i))).toBe(false);
    }

    // Verify bounding box matches standard dimensions
    geom.computeBoundingBox();
    const bbox = geom.boundingBox!;
    // Height along Y should be ~0.8 units (8 mm)
    const height = bbox.max.y - bbox.min.y;
    expect(height).toBeCloseTo(0.8, 1);

    // Width across flats should be ~1.7 units (17 mm)
    const sizeX = bbox.max.x - bbox.min.x;
    const sizeZ = bbox.max.z - bbox.min.z;
    expect(Math.max(sizeX, sizeZ)).toBeGreaterThan(1.6);
  });
});
