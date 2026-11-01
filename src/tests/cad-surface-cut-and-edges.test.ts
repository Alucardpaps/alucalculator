import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
  getPartBoundingMetrics,
  applyCSGHolesAndCuts,
  createRawBaseShapeGeometry,
} from '../design-studio/geometryFactory';
import { useDesignStore, type DesignPart } from '../design-studio/designStore';
import type { SurfaceCutItem } from '../design-studio/holeStandards';

describe('CAD Surface Cuts, Coordinate Mapping & Edge Integrity (ISO 10303-42)', () => {
  const sampleBoxPart: DesignPart = {
    id: 'test-box-1',
    kind: 'box',
    name: 'Test Precision Enclosure',
    color: '#38bdf8',
    visible: true,
    locked: false,
    parentId: null,
    position: { x: 0, y: 20, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    params: {
      width: 100, // 100 mm
      height: 40, // 40 mm
      depth: 60,  // 60 mm
    },
    holes: [],
    cuts: [],
  };

  beforeEach(() => {
    useDesignStore.setState({
      parts: [sampleBoxPart],
      selectedId: 'test-box-1',
      activeFace: 'top',
      tool: 'select',
      sketchPoints: [],
      sketchClosed: false,
      cuts: [],
    });
  });

  describe('1. Exact Bounding Metrics & Flush Face Transforms', () => {
    it('should compute exact bounding box and size matching geometry parameters', () => {
      const metrics = getPartBoundingMetrics(sampleBoxPart);
      expect(metrics).toBeDefined();

      // In Three.js CAD units (1 unit = 10 mm):
      // width: 100 mm -> 10 units
      // height: 40 mm -> 4 units
      // depth: 60 mm -> 6 units
      expect(metrics.size.x).toBeCloseTo(10, 2);
      expect(metrics.size.y).toBeCloseTo(4, 2);
      expect(metrics.size.z).toBeCloseTo(6, 2);

      // Centered at origin in local space:
      expect(metrics.center.x).toBeCloseTo(0, 2);
      expect(metrics.center.y).toBeCloseTo(0, 2);
      expect(metrics.center.z).toBeCloseTo(0, 2);

      expect(metrics.bbox.max.y).toBeCloseTo(2, 2); // 40 / 2 / 10 = +2
      expect(metrics.bbox.min.y).toBeCloseTo(-2, 2); // -2
    });

    it('should calculate flush face transforms for top, bottom, and side faces', () => {
      const metrics = getPartBoundingMetrics(sampleBoxPart);

      const topFace = metrics.getFaceTransform('top');
      // Top face position Y should be exactly at bbox.max.y + 0.015 (flush offset)
      expect(topFace.pos[1]).toBeCloseTo(2.015, 3);
      expect(topFace.normal).toEqual([0, 1, 0]);
      expect(topFace.planeW).toBeCloseTo(10, 2); // width
      expect(topFace.planeH).toBeCloseTo(6, 2);  // depth

      const bottomFace = metrics.getFaceTransform('bottom');
      expect(bottomFace.pos[1]).toBeCloseTo(-2.015, 3);
      expect(bottomFace.normal).toEqual([0, -1, 0]);

      const frontFace = metrics.getFaceTransform('front');
      expect(frontFace.pos[2]).toBeCloseTo(3.015, 3);
      expect(frontFace.normal).toEqual([0, 0, 1]);
    });

    it('should correctly map 2D sketch plane coordinates to face cut coordinates', () => {
      const metrics = getPartBoundingMetrics(sampleBoxPart);

      // Top face: local +Y on sketch plane points along -Z, so sketchToCutCoords inverts Y
      const topMapped = metrics.sketchToCutCoords('top', 25, 15);
      expect(topMapped.x).toBe(25);
      expect(topMapped.y).toBe(-15);

      // Front face: standard orientation
      const frontMapped = metrics.sketchToCutCoords('front', 25, 15);
      expect(frontMapped.x).toBe(25);
      expect(frontMapped.y).toBe(15);
    });

    it('should position cut preview exactly flush on the surface', () => {
      const metrics = getPartBoundingMetrics(sampleBoxPart);
      const cutPlacement = metrics.getCutPlacement('top', 0, 0);

      // Y position should be bbox.max.y + 0.02, perfectly flush on top surface
      expect(cutPlacement.pos[1]).toBeCloseTo(2.02, 3);
      expect(cutPlacement.rot[0]).toBeCloseTo(-Math.PI / 2, 3);
    });
  });

  describe('2. CSG Boolean Cut Geometry & Dihedral Edge Filtering', () => {
    it('should perform 3D CSG boolean subtraction on solid with a surface cut', () => {
      const baseGeom = createRawBaseShapeGeometry(sampleBoxPart, false);
      const baseVertexCount = baseGeom.attributes.position.count;

      const cutItem: SurfaceCutItem = {
        id: 'cut-1',
        type: 'rect',
        face: 'top',
        x: 0,
        y: 0,
        width: 40,  // 40 mm
        length: 30, // 30 mm
        depth: 10,  // 10 mm pocket
      };

      const resultGeom = applyCSGHolesAndCuts(baseGeom, sampleBoxPart, [], [cutItem]);
      expect(resultGeom).toBeDefined();
      expect(resultGeom.attributes.position).toBeDefined();

      // CSG boolean pocket cut creates new pocket floor and wall vertices
      expect(resultGeom.attributes.position.count).toBeGreaterThan(baseVertexCount);

      // Bounding box of carved geometry should stay within original extents
      resultGeom.computeBoundingBox();
      expect(resultGeom.boundingBox!.max.y).toBeCloseTo(2, 1);
      expect(resultGeom.boundingBox!.min.y).toBeCloseTo(-2, 1);
    });
  });

  describe('3. Store Integration: Sketch Cut Carving into Solid', () => {
    it('should carve cut into selected solid instead of creating a detached part when pendingOp is cut', () => {
      const store = useDesignStore.getState();

      // Enter sketch-cut mode on top face
      store.setActiveFace('top');
      store.startSketchCut();

      // Draw a 40x30 mm rectangular sketch centered on origin (-20 to +20 X, -15 to +15 Y)
      store.addSketchPoint({ x: -20, y: -15 });
      store.addSketchPoint({ x: 20, y: -15 });
      store.addSketchPoint({ x: 20, y: 15 });
      store.addSketchPoint({ x: -20, y: 15 });
      store.closeSketch();

      store.setExtrudeDepth(12); // 12 mm cut depth

      // Commit the cut
      const targetId = store.commitExtrude();

      // Target ID should be the existing part ID, NOT a new detached profile part
      expect(targetId).toBe('test-box-1');

      const updatedPart = useDesignStore.getState().parts.find((p) => p.id === 'test-box-1');
      expect(updatedPart).toBeDefined();
      expect(updatedPart?.cuts).toBeDefined();
      expect(updatedPart?.cuts?.length).toBe(1);

      const cut = updatedPart!.cuts![0];
      expect(cut.face).toBe('top');
      expect(cut.width).toBe(40);
      expect(cut.length).toBe(30);
      expect(cut.depth).toBe(12);

      // Verify sketch state was reset
      expect(useDesignStore.getState().sketchPoints.length).toBe(0);
      expect(useDesignStore.getState().tool).toBe('select');
    });
  });
});
