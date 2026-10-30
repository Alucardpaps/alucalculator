import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
  useDesignStore,
  type DesignPart,
  convertPathToThinRibbon,
  createSemiCirclePoints,
  create3PointArcPoints,
  create2PointCirclePoints,
  createEllipsePoints,
} from '../design-studio/designStore';
import {
  applyCSGHolesAndCuts,
  createRawBaseShapeGeometry,
  createHelixGeometry,
  createRevolveGeometry,
} from '../design-studio/geometryFactory';
import { SurfaceCutItem } from '../design-studio/holeStandards';
import {
  calculateSheetMetalAnalysis,
  analyzeAllCutoutsDeformation,
  calculatePressBrakeFeasibility,
  applyReliefSlitRemedy,
  offsetCutoutSafeRemedy,
  type SheetMetalSpec,
} from '../design-studio/sheetMetalEngine';

describe('CAD Advanced Cutting, Solid Operations & Sheet Metal Feasibility Suite', () => {
  const baseSolidBox: DesignPart = {
    id: 'solid-block-01',
    kind: 'box',
    name: 'Precision CNC Machined Enclosure',
    color: '#38bdf8',
    visible: true,
    locked: false,
    parentId: null,
    position: { x: 0, y: 25, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    params: {
      width: 120, // 120 mm
      height: 50, // 50 mm
      depth: 80,  // 80 mm
    },
    holes: [],
    cuts: [],
  };

  beforeEach(() => {
    useDesignStore.setState({
      parts: [JSON.parse(JSON.stringify(baseSolidBox))],
      selectedId: 'solid-block-01',
      activeFace: 'top',
      tool: 'select',
      sketchPoints: [],
      sketchEntities: [],
      sketchClosed: false,
      cuts: [],
      extrudeDialogConfig: {
        isOpen: false,
        face: null,
        detectedContours: [],
        depth: 15,
        mode: 'cut',
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

  describe('1. 3D Face Extrude Cut with Selected Contours', () => {
    it('should carve only the selected contour into the solid part', () => {
      const store = useDesignStore.getState();

      const pocketA = [
        { x: -40, y: -20 },
        { x: -10, y: -20 },
        { x: -10, y: 20 },
        { x: -40, y: 20 },
      ];
      const pocketB = [
        { x: 10, y: -20 },
        { x: 40, y: -20 },
        { x: 40, y: 20 },
        { x: 10, y: 20 },
      ];

      useDesignStore.setState({
        extrudeDialogConfig: {
          isOpen: true,
          face: {
            partId: 'solid-block-01',
            faceIndex: 0,
            normal: [0, 1, 0],
            center: [0, 50, 0],
            width: 120,
            height: 80,
          },
          detectedContours: [
            { id: 'pocket-left', points: pocketA, isClosed: true, area: 1200 },
            { id: 'pocket-right', points: pocketB, isClosed: true, area: 1200 },
          ],
          depth: 15,
          mode: 'cut',
          selectedContourId: 'pocket-right',
        } as any,
      });

      // Apply cut
      const targetId = store.applyExtrudeOrCut();
      expect(targetId).toBe('solid-block-01');

      const updatedPart = useDesignStore.getState().parts.find((p) => p.id === 'solid-block-01');
      expect(updatedPart).toBeDefined();
      expect(updatedPart?.cuts?.length).toBe(1);

      const cut = updatedPart!.cuts![0];
      expect(cut.face).toBe('top');
      expect(cut.depth).toBe(15);
      // Cut width: 40 - 10 = 30 mm, length: 20 - (-20) = 40 mm
      expect(cut.width).toBe(30);
      expect(cut.length).toBe(40);
      expect(cut.x).toBeCloseTo(25, 1); // Center (10+40)/2 = 25
    });
  });

  describe('2. Thin Feature Cut (Open Line to Slot Carving)', () => {
    it('should convert an open single line sketch into a slotted cut using thin feature ribbon', () => {
      const store = useDesignStore.getState();

      // Single open slot line from x=-40 to x=+40 on the top face
      const singleLine = [
        { x: -40, y: 0 },
        { x: 40, y: 0 },
      ];

      useDesignStore.setState({
        sketchPoints: singleLine,
        extrudeDialogConfig: {
          isOpen: true,
          face: {
            partId: 'solid-block-01',
            faceIndex: 0,
            normal: [0, 1, 0],
            center: [0, 50, 0],
            width: 120,
            height: 80,
          },
          detectedContours: [],
          depth: 10,
          mode: 'cut',
          thinWallEnabled: true,
          thinWallThickness: 5, // 5 mm slot width
        } as any,
      });

      const targetId = store.applyExtrudeOrCut();
      expect(targetId).toBe('solid-block-01');

      const updatedPart = useDesignStore.getState().parts.find((p) => p.id === 'solid-block-01');
      expect(updatedPart?.cuts?.length).toBe(1);

      const cut = updatedPart!.cuts![0];
      expect(cut.depth).toBe(10);
      expect(cut.width).toBeCloseTo(80, 0); // 40 - (-40) = 80 mm slot length
      expect(cut.length).toBeCloseTo(5, 0); // 5 mm thin wall ribbon slot width
      expect(cut.profile?.length).toBe(4);  // Closed quadrilateral ribbon
    });
  });

  describe('3. Revolve Cut & Helix Cut CSG Operations', () => {
    it('should carve a 360-degree revolve groove cut into a solid', () => {
      const part = useDesignStore.getState().parts[0];
      const baseGeom = createRawBaseShapeGeometry(part, false);
      const initialVertexCount = baseGeom.getAttribute('position').count;

      const revolveCut: SurfaceCutItem = {
        id: 'rev-cut-1',
        type: 'revolve',
        cutOp: 'revolve',
        face: 'top',
        x: 0,
        y: 0,
        depth: 12,
        revolveAngle: 360,
        revolveAxis: 'Y',
        profile: [
          { x: 10, y: 0 },
          { x: 25, y: 0 },
          { x: 25, y: 12 },
          { x: 10, y: 12 },
        ],
      };

      const resultGeom = applyCSGHolesAndCuts(baseGeom, part, [], [revolveCut]);
      expect(resultGeom.getAttribute('position')).toBeDefined();
      expect(resultGeom.getAttribute('position').count).toBeGreaterThan(initialVertexCount);
    });

    it('should carve a helical thread/flute cut into a solid', () => {
      const part = useDesignStore.getState().parts[0];
      const baseGeom = createRawBaseShapeGeometry(part, false);
      const initialVertexCount = baseGeom.getAttribute('position').count;

      const helixCut: SurfaceCutItem = {
        id: 'helix-cut-1',
        type: 'helix',
        cutOp: 'helix',
        face: 'top',
        x: 0,
        y: 0,
        depth: 20,
        helixPitch: 12,
        helixTurns: 2,
        helixRadius: 18,
      };

      const resultGeom = applyCSGHolesAndCuts(baseGeom, part, [], [helixCut]);
      expect(resultGeom.getAttribute('position')).toBeDefined();
      expect(resultGeom.getAttribute('position').count).toBeGreaterThan(initialVertexCount);
    });
  });

  describe('4. Draft Angle (Açılı Kesim) Parameter Verification', () => {
    it('should assign draftAngle and draftDirection to surface cuts', () => {
      const store = useDesignStore.getState();

      const contour = [
        { x: -15, y: -15 },
        { x: 15, y: -15 },
        { x: 15, y: 15 },
        { x: -15, y: 15 },
      ];

      useDesignStore.setState({
        sketchPoints: contour,
        extrudeDialogConfig: {
          isOpen: true,
          face: {
            partId: 'solid-block-01',
            faceIndex: 0,
            normal: [0, 1, 0],
            center: [0, 50, 0],
            width: 120,
            height: 80,
          },
          detectedContours: [],
          depth: 20,
          mode: 'cut',
          draftAngle: 5,
          draftDirection: 'inward',
        } as any,
      });

      store.applyExtrudeOrCut();
      const updatedPart = useDesignStore.getState().parts.find((p) => p.id === 'solid-block-01');
      const cut = updatedPart!.cuts![0];
      expect(cut.draftAngle).toBe(5);
      expect(cut.draftDirection).toBe('inward');
    });
  });

  describe('5. Sheet Metal Edge Bending, Deformation & Press Brake Feasibility', () => {
    const testSheetSpec: SheetMetalSpec = {
      id: 'sm-test-1',
      name: 'DIN 6935 Sheet Metal Test Bracket',
      thickness: 2,
      materialName: 'Al-5083-H111',
      yieldStrengthMpa: 125,
      densityGcm3: 2.66,
      length: 80,
      firstFlange: 120,
      bends: [
        {
          id: 'bend-1',
          targetFlangeIndex: 0,
          edge: 'end',
          angle: 90,
          radius: 2,
          flange: 40,
          direction: 'up',
          widthMode: 'partial',
          flangeWidth: 50,
          offsetStart: 15,
          offsetEnd: 15,
        },
      ],
      cutouts: [
        {
          id: 'hole-near-bend',
          name: 'Critical Mounting Hole',
          type: 'round_hole',
          flangeIndex: 0,
          posU: 114, // Very close to bend line at 116mm
          posV: 40,
          diameter: 12,
        },
      ],
    };

    it('should calculate accurate DIN 6935 bend deduction and flat pattern length', () => {
      const analysis = calculateSheetMetalAnalysis(testSheetSpec);
      expect(analysis.totalFlatLengthMm).toBeGreaterThan(120);
      expect(analysis.blankAreaCm2).toBeGreaterThan(0);
      expect(analysis.rows.length).toBe(1);
      expect(analysis.rows[0].bd).toBeGreaterThan(0);
    });

    it('should detect cutout deformation when a hole is too close to a bend line', () => {
      const deformations = analyzeAllCutoutsDeformation(testSheetSpec);
      expect(deformations.length).toBe(1);
      const def = deformations[0];
      expect(def.riskLevel).toBe('SEVERE_TEARING');
      expect(def.safeDistanceMm).toBeGreaterThan(def.distanceToNearestBendMm);
      expect(def.dfmAdviceTr).toBeDefined();
    });

    it('should apply safe offset remedy moving the cutout outside the deformation zone', () => {
      const remedy = offsetCutoutSafeRemedy(testSheetSpec, 'hole-near-bend');
      const updatedCutout = remedy.cutouts!.find((c) => c.id === 'hole-near-bend')!;
      // posU position should have been shifted away from the bend line
      expect(updatedCutout.posU).toBeLessThan(114);

      // Verify deformation is resolved with new position
      const rechecked = analyzeAllCutoutsDeformation(remedy);
      expect(rechecked[0].riskLevel).toBe('SAFE');
    });

    it('should evaluate press brake tooling feasibility and tonnage requirements', () => {
      const feasibility = calculatePressBrakeFeasibility(testSheetSpec);
      expect(feasibility.isFeasible).toBe(true);
      expect(feasibility.recommendedDieV).toBeGreaterThan(0);
      expect(feasibility.steps.length).toBe(1);
      expect(feasibility.steps[0].tonnage).toBeGreaterThan(0);
    });
  });
});
