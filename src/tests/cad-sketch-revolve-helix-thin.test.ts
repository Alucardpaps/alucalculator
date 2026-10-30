import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
  convertPathToThinRibbon,
  createSemiCirclePoints,
  create3PointArcPoints,
  create2PointCirclePoints,
  createEllipsePoints,
  useDesignStore,
  DesignPart,
} from '../design-studio/designStore';
import {
  createHelixGeometry,
  createRawBaseShapeGeometry,
  applyCSGHolesAndCuts,
} from '../design-studio/geometryFactory';
import { SurfaceCutItem } from '../design-studio/holeStandards';

describe('CAD Sketch Varieties & Advanced Extrude/Cut Operations', () => {
  beforeEach(() => {
    useDesignStore.setState({
      parts: [],
      selectedId: null,
      sketchEntities: [],
      sketchPoints: [],
      activeFace: null,
      extrudeDialogConfig: {
        isOpen: false,
        face: null,
        detectedContours: [],
        depth: 20,
        mode: 'extrude',
        chamferMm: 0,
        filletMm: 0,
        selectedContourId: undefined,
        revolveAngle: 360,
        revolveAxis: 'Y',
        helixPitch: 20,
        helixTurns: 3,
        helixRadius: 25,
        draftAngle: 0,
        draftDirection: 'inward',
        thinWallEnabled: false,
        thinWallThickness: 2,
      } as any,
    });
  });

  describe('1. Thin Feature Geometry Generator (convertPathToThinRibbon)', () => {
    it('should generate a closed ribbon polygon from an open line segment', () => {
      const openLine = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ];
      const ribbon = convertPathToThinRibbon(openLine, 4, false);
      expect(ribbon.length).toBe(4); // 2 on right, 2 on left reversed
      expect(ribbon[0].y).toBeCloseTo(2, 1);
      expect(ribbon[1].y).toBeCloseTo(2, 1);
      expect(ribbon[2].y).toBeCloseTo(-2, 1);
      expect(ribbon[3].y).toBeCloseTo(-2, 1);
    });

    it('should generate an offset ribbon for a closed rectangular loop', () => {
      const closedRect = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 },
        { x: 0, y: 50 },
        { x: 0, y: 0 },
      ];
      const ribbon = convertPathToThinRibbon(closedRect, 2, true);
      expect(ribbon.length).toBeGreaterThan(6);
    });

    it('should gracefully handle empty or single point inputs', () => {
      expect(convertPathToThinRibbon([], 2)).toEqual([]);
      expect(convertPathToThinRibbon([{ x: 5, y: 5 }], 2)).toEqual([{ x: 5, y: 5 }]);
    });
  });

  describe('2. Expanded Circle & Arc Geometry Generators', () => {
    it('createSemiCirclePoints should generate 180 degree arc between two endpoints', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 20, y: 0 };
      const pts = createSemiCirclePoints(p1, p2, 12);
      expect(pts.length).toBe(13);
      expect(pts[0].x).toBeCloseTo(0, 0);
      expect(pts[pts.length - 1].x).toBeCloseTo(20, 0);
      // Radius is 10, check that extreme amplitude reaches ~10
      const maxAbsY = Math.max(...pts.map((p) => Math.abs(p.y)));
      expect(maxAbsY).toBeGreaterThanOrEqual(9.9);
    });

    it('create3PointArcPoints should interpolate through start, apex and end', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 10, y: 10 };
      const p3 = { x: 20, y: 0 };
      const pts = create3PointArcPoints(p1, p2, p3, 16);
      expect(pts.length).toBe(17);
      expect(pts[0].x).toBeCloseTo(0, 0);
      expect(pts[pts.length - 1].x).toBeCloseTo(20, 0);
    });

    it('create3PointArcPoints collinear fallback should return original points', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 10, y: 0 };
      const p3 = { x: 20, y: 0 };
      const pts = create3PointArcPoints(p1, p2, p3);
      expect(pts).toEqual([p1, p2, p3]);
    });

    it('create2PointCirclePoints should generate a full circle with given diameter', () => {
      const p1 = { x: -10, y: 0 };
      const p2 = { x: 10, y: 0 };
      const pts = create2PointCirclePoints(p1, p2, 16);
      expect(pts.length).toBe(16);
      pts.forEach((pt) => {
        const distFromCenter = Math.hypot(pt.x, pt.y);
        expect(distFromCenter).toBeCloseTo(10, 0);
      });
    });

    it('createEllipsePoints should generate points matching rx and ry', () => {
      const center = { x: 10, y: 20 };
      const pts = createEllipsePoints(center, 30, 15, 16);
      expect(pts.length).toBe(16);
      const minX = Math.min(...pts.map((p) => p.x));
      const maxX = Math.max(...pts.map((p) => p.x));
      const minY = Math.min(...pts.map((p) => p.y));
      const maxY = Math.max(...pts.map((p) => p.y));
      expect(maxX - minX).toBeCloseTo(60, 0);
      expect(maxY - minY).toBeCloseTo(30, 0);
    });
  });

  describe('3. Store Sketch Variety Actions', () => {
    it('should add 2-point circle, semicircle, 3-point arc, and ellipse entities', () => {
      const store = useDesignStore.getState();

      store.add2PointCircleEntity({ x: 0, y: 0 }, { x: 20, y: 0 });
      let entities = useDesignStore.getState().sketchEntities;
      expect(entities.length).toBe(1);
      expect(entities[0].type).toBe('circle_2p');
      expect(entities[0].radius).toBeCloseTo(10, 1);

      store.addSemiCircleEntity({ x: 0, y: 0 }, { x: 40, y: 0 });
      entities = useDesignStore.getState().sketchEntities;
      expect(entities.length).toBe(2);
      expect(entities[1].type).toBe('arc_semi');

      store.add3PointArcEntity({ x: 0, y: 0 }, { x: 10, y: 15 }, { x: 20, y: 0 });
      entities = useDesignStore.getState().sketchEntities;
      expect(entities.length).toBe(3);
      expect(entities[2].type).toBe('arc_3p');

      store.addEllipseEntity({ x: 50, y: 50 }, 25, 15);
      entities = useDesignStore.getState().sketchEntities;
      expect(entities.length).toBe(4);
      expect(entities[3].type).toBe('ellipse');
      expect(entities[3].radiusX).toBe(25);
      expect(entities[3].radiusY).toBe(15);
    });
  });

  describe('4. Selected Contours, Revolve & Helix in applyExtrudeOrCut', () => {
    it('should extrude only the selected contour when selectedContourId is specified', () => {
      const store = useDesignStore.getState();
      const contourA = [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 20 },
        { x: 0, y: 20 },
      ];
      const contourB = [
        { x: 50, y: 50 },
        { x: 80, y: 50 },
        { x: 80, y: 80 },
        { x: 50, y: 80 },
      ];

      useDesignStore.setState({
        extrudeDialogConfig: {
          isOpen: true,
          face: {
            partId: 'dummy-part',
            faceIndex: 0,
            normal: [0, 0, 1],
            center: [0, 0, 0],
            width: 100,
            height: 100,
          },
          detectedContours: [
            { id: 'contour-A', points: contourA, isClosed: true, area: 400 },
            { id: 'contour-B', points: contourB, isClosed: true, area: 900 },
          ],
          depth: 15,
          mode: 'new-part',
          chamferMm: 0,
          filletMm: 0,
          selectedContourId: 'contour-B',
        } as any,
      });

      store.applyExtrudeOrCut();
      const parts = useDesignStore.getState().parts;
      expect(parts.length).toBe(1);
      expect(parts[0].outer?.length).toBe(4);
      expect(parts[0].params.extrudeDepth).toBe(15);
    });

    it('should create a revolved solid part when mode is revolve', () => {
      const store = useDesignStore.getState();
      const profile = [
        { x: 10, y: 0 },
        { x: 30, y: 0 },
        { x: 30, y: 40 },
        { x: 10, y: 40 },
      ];

      useDesignStore.setState({
        extrudeDialogConfig: {
          isOpen: true,
          face: {
            partId: 'base-part',
            faceIndex: 0,
            normal: [0, 0, 1],
            center: [0, 0, 0],
            width: 100,
            height: 100,
          },
          detectedContours: [{ id: 'rev-c', points: profile, isClosed: true, area: 800 }],
          depth: 20,
          mode: 'revolve',
          revolveAngle: 360,
          revolveAxis: 'Y',
          chamferMm: 0,
          filletMm: 0,
        } as any,
      });

      store.applyExtrudeOrCut();
      const parts = useDesignStore.getState().parts;
      expect(parts.length).toBe(1);
      expect(parts[0].solidOp).toBe('revolve');
      expect(parts[0].params.revolveAngle).toBe(360);
    });

    it('should create a helical solid part when mode is helix', () => {
      const store = useDesignStore.getState();
      const profile = [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 5, y: 5 },
        { x: 0, y: 5 },
      ];

      useDesignStore.setState({
        extrudeDialogConfig: {
          isOpen: true,
          face: {
            partId: 'base-part',
            faceIndex: 0,
            normal: [0, 0, 1],
            center: [0, 0, 0],
            width: 100,
            height: 100,
          },
          detectedContours: [{ id: 'helix-c', points: profile, isClosed: true, area: 25 }],
          depth: 20,
          mode: 'helix',
          helixPitch: 15,
          helixTurns: 4,
          helixRadius: 30,
          chamferMm: 0,
          filletMm: 0,
        } as any,
      });

      store.applyExtrudeOrCut();
      const parts = useDesignStore.getState().parts;
      expect(parts.length).toBe(1);
      expect(parts[0].solidOp).toBe('helix');
      expect(parts[0].params.helixPitch).toBe(15);
      expect(parts[0].params.helixTurns).toBe(4);
      expect(parts[0].params.helixRadius).toBe(30);
    });

    it('should support thin wall feature for open sketch lines', () => {
      const store = useDesignStore.getState();
      const openLine = [
        { x: 0, y: 0 },
        { x: 60, y: 0 },
      ];

      useDesignStore.setState({
        extrudeDialogConfig: {
          isOpen: true,
          face: {
            partId: 'base-part',
            faceIndex: 0,
            normal: [0, 0, 1],
            center: [0, 0, 0],
            width: 100,
            height: 100,
          },
          detectedContours: [{ id: 'open-c', points: openLine, isClosed: false, area: 0 }],
          depth: 25,
          mode: 'new-part',
          thinWallEnabled: true,
          thinWallThickness: 3,
          chamferMm: 0,
          filletMm: 0,
        } as any,
      });

      store.applyExtrudeOrCut();
      const parts = useDesignStore.getState().parts;
      expect(parts.length).toBe(1);
      expect(parts[0].outer?.length).toBe(4); // ribbon quadrilateral
      expect(parts[0].params.thinWallEnabled).toBe(true);
      expect(parts[0].params.thinWallThickness).toBe(3);
    });
  });

  describe('5. Geometry Factory (Helix & CSG Cut Operations)', () => {
    it('createHelixGeometry should create a 3D TubeGeometry along a helical path', () => {
      const geom = createHelixGeometry([], 20, 3, 25);
      expect(geom).toBeInstanceOf(THREE.BufferGeometry);
      const positionAttr = geom.getAttribute('position');
      expect(positionAttr.count).toBeGreaterThan(50);
    });

    it('createRawBaseShapeGeometry should create 3D mesh geometry for helix solid parts', () => {
      const part: DesignPart = {
        id: 'helix-part-1',
        name: 'Helical Coil',
        kind: 'profile',
        solidOp: 'helix',
        outer: [
          { x: -5, y: -5 },
          { x: 5, y: -5 },
          { x: 5, y: 5 },
          { x: -5, y: 5 },
        ],
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        params: {
          helixPitch: 25,
          helixTurns: 2,
          helixRadius: 20,
        },
        visible: true,
        locked: false,
        parentId: null,
        color: '#00e5ff',
      };
      const geom = createRawBaseShapeGeometry(part);
      expect(geom).toBeInstanceOf(THREE.BufferGeometry);
      expect(geom.getAttribute('position').count).toBeGreaterThan(20);
    });

    it('applyCSGHolesAndCuts should execute revolve cut and helix cut cleanly', () => {
      const cuts: SurfaceCutItem[] = [
        {
          id: 'revolve-cut-1',
          type: 'revolve',
          cutOp: 'revolve',
          face: 'top',
          x: 0,
          y: 0,
          depth: 10,
          profile: [
            { x: 5, y: 0 },
            { x: 15, y: 0 },
            { x: 15, y: 10 },
            { x: 5, y: 10 },
          ],
          revolveAngle: 360,
          revolveAxis: 'Y',
        },
        {
          id: 'helix-cut-1',
          type: 'helix',
          cutOp: 'helix',
          face: 'top',
          x: 0,
          y: 0,
          depth: 20,
          helixPitch: 10,
          helixTurns: 2,
          helixRadius: 15,
        },
      ];

      const part: DesignPart = {
        id: 'base-part',
        name: 'Base Part',
        kind: 'box',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        params: { width: 60, height: 60, depth: 60 },
        visible: true,
        locked: false,
        parentId: null,
        color: '#ffffff',
        cuts,
      };

      const baseGeom = new THREE.BoxGeometry(6, 6, 6);
      const resultGeom = applyCSGHolesAndCuts(baseGeom, part, [], cuts);
      expect(resultGeom.getAttribute('position')).toBeDefined();
      expect(resultGeom.getAttribute('position').count).toBeGreaterThan(0);
    });
  });
});
