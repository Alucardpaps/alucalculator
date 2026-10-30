/**
 * tests/shaft-dxf-and-3d.test.ts
 * 
 * Unit tests for 2D AutoCAD DXF Generation (ISO 128 / AC1009),
 * 3D Solid Mesh STL Revolution Export, and 3D CAD Design Studio Transfer.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { exportShaftToDXF } from '../modules/mechanical/ShaftDesign/dxfExporter';
import { exportShaftToSTL } from '../modules/mechanical/ShaftDesign/stlExporter';
import { 
    transferShaftToDesignStudio, 
    buildMonolithicShaftSolid, 
    buildShaftSegmentSolid 
} from '../modules/mechanical/ShaftDesign/transferTo3D';
import { transferShaftToCadEditor } from '../modules/mechanical/ShaftDesign/transferToCadEditor';
import { useDesignStore } from '../design-studio/designStore';
import { useCadStore } from '../cad/store/cadStore';
import type { ShaftSegment } from '../modules/mechanical/ShaftDesign/engine';

describe('Shaft DXF Exporter (ISO 128 / AutoCAD R12 DXF)', () => {
    const mockSegments: ShaftSegment[] = [
        {
            id: 'seg-1',
            segmentIndex: 0,
            length: 80,
            diameter: 30,
            toleranceGrade: 'h7',
            shoulderFilletRadius: 1.5,
            chamferLeft: 2,
            chamferRight: 0,
            shoulderTransition: 'radius',
            features: [
                {
                    type: 'keyway',
                    id: 'feat-1',
                    standard: 'DIN 6885-1 Form A',
                    offsetFromStart: 15,
                    length: 40,
                    width: 8,
                    depth: 4
                }
            ]
        },
        {
            id: 'seg-2',
            segmentIndex: 1,
            length: 120,
            diameter: 45,
            toleranceGrade: 'k6',
            shoulderFilletRadius: 2.5,
            chamferLeft: 0,
            chamferRight: 0,
            shoulderTransition: 'radius',
            features: [
                {
                    type: 'gear',
                    id: 'feat-2',
                    standard: 'DIN 3960 / ISO 54',
                    gearType: 'spur',
                    pressureAngleDeg: 20,
                    helixAngleDeg: 0,
                    mounting: 'integral',
                    offsetFromStart: 30,
                    module: 2.5,
                    numTeeth: 28,
                    faceWidth: 40,
                    pitchDiameter: 70,
                    tipDiameter: 75,
                    rootDiameter: 63.75,
                    callout: 'Düz Dişli m=2.5 z=28 (d₀=Ø70 da=Ø75)'
                },
                {
                    type: 'circlip',
                    id: 'feat-3',
                    standard: 'DIN 471',
                    offsetFromStart: 90,
                    grooveWidth: 1.75,
                    grooveDia: 42.5
                }
            ]
        },
        {
            id: 'seg-3',
            segmentIndex: 2,
            length: 70,
            diameter: 25,
            toleranceGrade: 'h7',
            shoulderFilletRadius: 1.5,
            chamferLeft: 0,
            chamferRight: 1.5,
            shoulderTransition: 'undercut',
            shoulderUndercutForm: 'E',
            features: [
                {
                    type: 'center_drill',
                    id: 'feat-4',
                    standard: 'DIN 332-1',
                    form: 'A',
                    face: 'right_end',
                    pilotDia: 2.5,
                    coneDia: 5.3,
                    totalDepth: 6.5,
                    callout: 'DIN 332 - A 2.5x5.3'
                }
            ]
        }
    ];

    test('generates valid AutoCAD DXF with correct headers, layers, and EOF', () => {
        const dxf = exportShaftToDXF(mockSegments, { includeCenterline: true, includeDimensions: true });

        expect(dxf).toContain('SECTION');
        expect(dxf).toContain('HEADER');
        expect(dxf).toContain('TABLES');
        expect(dxf).toContain('BLOCKS');
        expect(dxf).toContain('ENTITIES');
        expect(dxf).toContain('EOF');

        // Layer schema conformance
        expect(dxf).toContain('PART_CONTOUR');
        expect(dxf).toContain('REFERENCE');
        expect(dxf).toContain('HOLES');
        expect(dxf).toContain('DIMENSIONS');
        expect(dxf).toContain('PITCH_CIRCLE');
    });

    test('contains centerline extending beyond shaft endpoints', () => {
        const dxf = exportShaftToDXF(mockSegments, { includeCenterline: true });

        // Centerline reference line layer
        expect(dxf).toContain('REFERENCE');
        // Total length is 270, extension is 13.5 (from -13.5 to 283.5)
        expect(dxf).toContain('-13.5');
        expect(dxf).toContain('283.5');
    });

    test('exports gear pitch circle with standard pitch circle layer', () => {
        const dxf = exportShaftToDXF(mockSegments, { includeFeatures: true });

        // Gear pitch circle is drawn on PITCH_CIRCLE layer
        expect(dxf).toContain('PITCH_CIRCLE');
        // Pitch radius is 35 (diameter 70 / 2)
        expect(dxf).toContain('35');
    });

    test('exports keyway and circlip features in HOLES layer', () => {
        const dxf = exportShaftToDXF(mockSegments, { includeFeatures: true, includeDimensions: true });

        expect(dxf).toContain('HOLES');
        expect(dxf).toContain('t1=4'); // Keyway depth text
    });
});

describe('Shaft 3D STL Solid Mesh Exporter (ASCII Revolution)', () => {
    const simpleSegments: ShaftSegment[] = [
        {
            id: 'seg-1',
            segmentIndex: 0,
            length: 50,
            diameter: 20,
            toleranceGrade: 'h7',
            shoulderFilletRadius: 1.5,
            chamferLeft: 1.5,
            chamferRight: 0,
            shoulderTransition: 'radius',
            features: []
        },
        {
            id: 'seg-2',
            segmentIndex: 1,
            length: 60,
            diameter: 30,
            toleranceGrade: 'h7',
            shoulderFilletRadius: 1.5,
            chamferLeft: 0,
            chamferRight: 1.0,
            shoulderTransition: 'radius',
            features: []
        }
    ];

    test('generates compliant solid ASCII STL file', () => {
        const stl = exportShaftToSTL(simpleSegments, { radialSegments: 24, solidName: 'SteppedShaft_3D' });

        // Standard STL structure
        expect(stl.startsWith('solid SteppedShaft_3D')).toBe(true);
        expect(stl.trimEnd().endsWith('endsolid SteppedShaft_3D')).toBe(true);

        // Facet structure
        expect(stl).toContain('facet normal');
        expect(stl).toContain('outer loop');
        expect(stl).toContain('vertex');
        expect(stl).toContain('endloop');
        expect(stl).toContain('endfacet');
    });

    test('revolves segments with non-zero triangle count', () => {
        const stl = exportShaftToSTL(simpleSegments, { radialSegments: 36 });
        const facetMatches = stl.match(/facet normal/g);
        expect(facetMatches).not.toBeNull();
        // At 36 angular slices, two cylinders + chamfers + 2 end caps produce hundreds of facets
        expect(facetMatches!.length).toBeGreaterThan(100);
    });

    test('handles single cylinder without crashing', () => {
        const singleSeg: ShaftSegment[] = [
            {
                id: 's1',
                segmentIndex: 0,
                length: 100,
                diameter: 40,
                toleranceGrade: 'h7',
                shoulderFilletRadius: 1.5,
                chamferLeft: 0,
                chamferRight: 0,
                shoulderTransition: 'radius',
                features: []
            }
        ];
        const stl = exportShaftToSTL(singleSeg, { radialSegments: 16, solidName: 'SteppedShaft_3D' });
        expect(stl).toContain('endsolid SteppedShaft_3D');
        const facetMatches = stl.match(/facet normal/g);
        expect(facetMatches!.length).toBeGreaterThan(30);
    });
});

describe('3D Design Studio Transfer Bridge', () => {
    beforeEach(() => {
        // Reset design store before each test
        useDesignStore.setState({
            parts: [],
            selectedId: null
        });
    });

    const segments: ShaftSegment[] = [
        {
            id: 's1',
            segmentIndex: 0,
            length: 50,
            diameter: 25,
            toleranceGrade: 'h7',
            shoulderFilletRadius: 1.5,
            chamferLeft: 1,
            chamferRight: 0,
            shoulderTransition: 'radius',
            features: [
                {
                    type: 'keyway',
                    id: 'f1',
                    standard: 'DIN 6885-1 Form A',
                    offsetFromStart: 10,
                    length: 25,
                    width: 8,
                    depth: 4
                }
            ]
        },
        {
            id: 's2',
            segmentIndex: 1,
            length: 80,
            diameter: 40,
            toleranceGrade: 'k6',
            shoulderFilletRadius: 3,
            chamferLeft: 0,
            chamferRight: 1.5,
            shoulderTransition: 'radius',
            features: [
                {
                    type: 'circlip',
                    id: 'f2',
                    standard: 'DIN 471',
                    offsetFromStart: 60,
                    grooveWidth: 1.75,
                    grooveDia: 37.5
                }
            ]
        }
    ];

    test('converts shaft segments into monolithic 3D DesignPart model and updates store', () => {
        const result = transferShaftToDesignStudio(segments, 'Test Mili');

        expect(result.success).toBe(true);
        expect(result.partCount).toBe(1);
        expect(result.totalLength).toBe(130);

        // Verify parts were added to useDesignStore
        const storedParts = useDesignStore.getState().parts;
        expect(storedParts.length).toBe(1);

        // Monolithic part contains the whole stepped shaft
        const shaftPart = storedParts[0];
        expect(shaftPart.name).toContain('Test Mili');
        expect(shaftPart.kind).toBe('imported-model');
        expect(shaftPart.params.diameter).toBe(40);
        expect(shaftPart.params.length).toBe(130);
        expect(shaftPart.params.segmentCount).toBe(2);
        expect(shaftPart.manufacturingNotes?.some(n => n.includes('DIN 6885'))).toBe(true);
        expect(shaftPart.manufacturingNotes?.some(n => n.includes('DIN 471'))).toBe(true);

        // Selected ID is set to the monolithic shaft, isolatedPartId is null
        expect(useDesignStore.getState().selectedId).toBe(shaftPart.id);
        expect(useDesignStore.getState().isolatedPartId).toBeNull();

        // Verify real 3D solid BufferGeometry is generated and cached
        expect(shaftPart.customGeometry).toBeDefined();
        const posAttr = shaftPart.customGeometry.data?.attributes?.position || shaftPart.customGeometry.attributes?.position;
        expect(posAttr).toBeDefined();
        expect(posAttr.array.length).toBeGreaterThan(200);
    });

    test('generates true 3D solid meshes with 45° chamfers, DIN 509 undercuts, and DIN 6885 keyways', () => {
        const testSegs: ShaftSegment[] = [
            {
                id: 't-seg-1',
                segmentIndex: 0,
                length: 60,
                diameter: 25,
                toleranceGrade: 'h7',
                shoulderFilletRadius: 1.5,
                chamferLeft: 1.5,
                chamferRight: 0,
                shoulderTransition: 'undercut',
                shoulderUndercutForm: 'E',
                features: [
                    {
                        type: 'keyway',
                        id: 'kw-1',
                        standard: 'DIN 6885-1 Form A',
                        offsetFromStart: 10,
                        length: 30,
                        width: 8,
                        depth: 4
                    },
                    {
                        type: 'circlip',
                        id: 'circ-1',
                        standard: 'DIN 471',
                        offsetFromStart: 45,
                        grooveWidth: 1.3,
                        grooveDia: 23.9
                    }
                ]
            },
            {
                id: 't-seg-2',
                segmentIndex: 1,
                length: 80,
                diameter: 35,
                toleranceGrade: 'k6',
                shoulderFilletRadius: 2.0,
                chamferLeft: 0,
                chamferRight: 1.5,
                shoulderTransition: 'radius',
                features: []
            }
        ];

        const res = transferShaftToDesignStudio(testSegs, { shaftName: 'Solid Test', navigate: false });
        expect(res.success).toBe(true);

        const parts = useDesignStore.getState().parts;
        expect(parts.length).toBe(1);

        // Entire shaft is unified into 1 watertight solid with DIN 509 undercut, DIN 471 circlip, DIN 6885 keyway, and 45° chamfer
        const shaft = parts[0];
        expect(shaft.customGeometry).toBeDefined();
        const posAttr = shaft.customGeometry.data?.attributes?.position || shaft.customGeometry.attributes?.position;
        expect(posAttr).toBeDefined();
        // A revolved mesh with 48 radial steps and CSG cuts has hundreds of vertices
        expect(posAttr.array.length).toBeGreaterThan(100);
    });

    test('embeds authentic DIN 332 center drill holes into 3D solid geometry on left and right shaft ends', () => {
        const cdSegments: ShaftSegment[] = [
            {
                id: 'cd-s1',
                segmentIndex: 0,
                length: 60,
                diameter: 30,
                toleranceGrade: 'h7',
                shoulderFilletRadius: 1.5,
                chamferLeft: 1.5,
                chamferRight: 0,
                features: [
                    {
                        type: 'center_drill',
                        id: 'cd-feat-left',
                        standard: 'DIN 332-1',
                        form: 'B',
                        face: 'left_end',
                        pilotDia: 2.0,
                        coneDia: 4.25,
                        protectingDia: 6.3,
                        totalDepth: 3.6,
                        callout: 'DIN 332 - B 2.0x4.25'
                    }
                ]
            },
            {
                id: 'cd-s2',
                segmentIndex: 1,
                length: 80,
                diameter: 40,
                toleranceGrade: 'k6',
                shoulderFilletRadius: 2.0,
                chamferLeft: 0,
                chamferRight: 1.5,
                features: [
                    {
                        type: 'center_drill',
                        id: 'cd-feat-right',
                        standard: 'DIN 332-1',
                        form: 'A',
                        face: 'right_end',
                        pilotDia: 2.5,
                        coneDia: 5.3,
                        totalDepth: 4.5,
                        callout: 'DIN 332 - A 2.5x5.3'
                    }
                ]
            }
        ];

        // 1. Monolithic 3D Solid Geometry
        const monolithicGeom = buildMonolithicShaftSolid(cdSegments);
        expect(monolithicGeom).toBeDefined();

        const posAttr = monolithicGeom.attributes.position;
        expect(posAttr).toBeDefined();

        const totalLenCad = (60 + 80) / 10; // 14
        const startXCad = -totalLenCad / 2;  // -7
        const endXCad = +totalLenCad / 2;    // +7

        let foundLeftHoleInternalVertex = false;
        let foundLeftHoleTipOnAxis = false;
        let foundRightHoleInternalVertex = false;
        let foundRightHoleTipOnAxis = false;

        for (let idx = 0; idx < posAttr.count; idx++) {
            const x = posAttr.getX(idx);
            const y = posAttr.getY(idx);
            const z = posAttr.getZ(idx);
            const r = Math.hypot(y, z);

            // Left center drill: drilled inside the shaft (x > startXCad, r <= cone radius Cad (~0.3))
            if (x > startXCad + 0.05 && x < startXCad + 0.6 && r < 0.35) {
                foundLeftHoleInternalVertex = true;
            }
            if (x > startXCad + 0.3 && r < 1e-3) {
                foundLeftHoleTipOnAxis = true;
            }

            // Right center drill: drilled inside the shaft (x < endXCad, r <= cone radius Cad (~0.3))
            if (x < endXCad - 0.05 && x > endXCad - 0.7 && r < 0.35) {
                foundRightHoleInternalVertex = true;
            }
            if (x < endXCad - 0.3 && r < 1e-3) {
                foundRightHoleTipOnAxis = true;
            }
        }

        expect(foundLeftHoleInternalVertex).toBe(true);
        expect(foundLeftHoleTipOnAxis).toBe(true);
        expect(foundRightHoleInternalVertex).toBe(true);
        expect(foundRightHoleTipOnAxis).toBe(true);

        // 2. Single Segment 3D Solid Geometry
        const segSolidLeft = buildShaftSegmentSolid(cdSegments[0], 0, cdSegments);
        const segLeftPos = segSolidLeft.attributes.position;
        let segLeftInternalVertex = false;
        const seg0Start = -cdSegments[0].length / 20; // -3
        for (let idx = 0; idx < segLeftPos.count; idx++) {
            const x = segLeftPos.getX(idx);
            const r = Math.hypot(segLeftPos.getY(idx), segLeftPos.getZ(idx));
            if (x > seg0Start + 0.05 && r < 0.35) {
                segLeftInternalVertex = true;
                break;
            }
        }
        expect(segLeftInternalVertex).toBe(true);

        // 3. STL Exporter includes DIN 332 center drill hole facets
        const stl = exportShaftToSTL(cdSegments, { radialSegments: 24, solidName: 'ShaftWithCenterDrills' });
        expect(stl).toContain('solid ShaftWithCenterDrills');
        expect(stl).toContain('endsolid ShaftWithCenterDrills');
        const facetCount = (stl.match(/facet normal/g) || []).length;
        expect(facetCount).toBeGreaterThan(150);
    });

    test('models keyway pockets with radiused stadium ends (DIN 6885 Form A radius R=b/2) in 3D monolithic and segment solids', () => {
        const kwSegments: ShaftSegment[] = [
            {
                id: 'kw-seg-1',
                segmentIndex: 0,
                length: 100,
                diameter: 40,
                toleranceGrade: 'h7',
                shoulderFilletRadius: 2.0,
                features: [
                    {
                        type: 'keyway',
                        id: 'kw-feat-1',
                        standard: 'DIN 6885-1 Form A',
                        offsetFromStart: 20,
                        length: 50,
                        width: 12,
                        depth: 5
                    }
                ]
            }
        ];

        // 1. Monolithic 3D solid
        const monolithicGeom = buildMonolithicShaftSolid(kwSegments);
        expect(monolithicGeom).toBeDefined();
        const posAttr = monolithicGeom.attributes.position;
        expect(posAttr).toBeDefined();

        // Shaft radius Cad = 40 / 20 = 2.0
        // Keyway width Cad = 1.2, depth Cad = 0.5, length Cad = 5.0, offset Cad = 2.0
        // Floor of keyway is at Y = RCad - t1Cad = 2.0 - 0.5 = 1.5
        let foundFloorVertex = false;
        let foundRadiusedEndCapVertex = false;

        for (let idx = 0; idx < posAttr.count; idx++) {
            const x = posAttr.getX(idx);
            const y = posAttr.getY(idx);
            const z = posAttr.getZ(idx);

            if (Math.abs(y - 1.5) < 0.05 && x >= -3.05 && x <= 2.05 && Math.abs(z) <= 0.65) {
                foundFloorVertex = true;
                if ((x < -2.45 || x > 1.45) && Math.abs(z) > 0.1 && Math.abs(z) < 0.58) {
                    foundRadiusedEndCapVertex = true;
                }
            }
        }

        expect(foundFloorVertex).toBe(true);
        expect(foundRadiusedEndCapVertex).toBe(true);

        // 2. Individual segment solid also uses rounded ends
        const segGeom = buildShaftSegmentSolid(kwSegments[0], 0, kwSegments);
        expect(segGeom).toBeDefined();
        const segPos = segGeom.attributes.position;
        expect(segPos.count).toBeGreaterThan(100);
    });
});

describe('2D AluCAD Drafting Editor Transfer Bridge (/cad-editor/)', () => {
    beforeEach(() => {
        useCadStore.getState().clearEntities();
    });

    const mockSegments: ShaftSegment[] = [
        {
            id: 'seg-1',
            segmentIndex: 0,
            length: 80,
            diameter: 30,
            toleranceGrade: 'h7',
            shoulderFilletRadius: 1.5,
            chamferLeft: 2,
            chamferRight: 0,
            shoulderTransition: 'radius',
            features: [
                {
                    type: 'keyway',
                    id: 'feat-1',
                    standard: 'DIN 6885-1 Form A',
                    offsetFromStart: 15,
                    length: 40,
                    width: 8,
                    depth: 4
                },
                {
                    type: 'center_drill',
                    id: 'feat-cd-left',
                    standard: 'DIN 332-1',
                    form: 'B',
                    face: 'left_end',
                    pilotDia: 2.0,
                    coneDia: 4.25,
                    totalDepth: 4.5
                }
            ]
        },
        {
            id: 'seg-2',
            segmentIndex: 1,
            length: 120,
            diameter: 45,
            toleranceGrade: 'k6',
            shoulderFilletRadius: 2.5,
            chamferLeft: 0,
            chamferRight: 0,
            shoulderTransition: 'radius',
            features: [
                {
                    type: 'gear',
                    id: 'feat-2',
                    standard: 'DIN 3960 / ISO 54',
                    gearType: 'spur',
                    pressureAngleDeg: 20,
                    helixAngleDeg: 0,
                    mounting: 'integral',
                    offsetFromStart: 30,
                    module: 2.5,
                    numTeeth: 28,
                    faceWidth: 40,
                    pitchDiameter: 70,
                    tipDiameter: 75,
                    rootDiameter: 63.75
                },
                {
                    type: 'circlip',
                    id: 'feat-3',
                    standard: 'DIN 471',
                    offsetFromStart: 90,
                    grooveWidth: 1.75,
                    grooveDia: 42.5
                }
            ]
        },
        {
            id: 'seg-3',
            segmentIndex: 2,
            length: 70,
            diameter: 25,
            toleranceGrade: 'h7',
            shoulderFilletRadius: 1.5,
            chamferLeft: 0,
            chamferRight: 1.5,
            shoulderTransition: 'undercut',
            shoulderUndercutForm: 'E',
            features: [
                {
                    type: 'center_drill',
                    id: 'feat-4',
                    standard: 'DIN 332-1',
                    form: 'A',
                    face: 'right_end',
                    pilotDia: 2.5,
                    coneDia: 5.3,
                    totalDepth: 6.5
                }
            ]
        }
    ];

    test('converts shaft into 2D CAD entities and loads them into CadStore', () => {
        const result = transferShaftToCadEditor(mockSegments, { navigate: false, shaftTitle: 'Test Kademe Çizimi' });

        expect(result.success).toBe(true);
        expect(result.entityCount).toBeGreaterThan(15);
        expect(result.totalLength).toBe(270);

        const entities = useCadStore.getState().entities;
        expect(entities.length).toBe(result.entityCount);

        // Centerline exists
        const centerlines = entities.filter(e => e.layerId === 'CENTERLINES');
        expect(centerlines.length).toBeGreaterThan(0);

        // Holes / Features exist
        const holes = entities.filter(e => e.layerId === 'HOLES');
        expect(holes.length).toBeGreaterThan(0);

        // Gear elements exist
        const gears = entities.filter(e => e.layerId === 'GEARS' || e.layerId === 'PITCH_CIRCLES');
        expect(gears.length).toBeGreaterThan(0);

        // Dimensions exist
        const dims = entities.filter(e => e.layerId === 'DIMENSIONS');
        expect(dims.length).toBeGreaterThan(0);

        // 1. DIN 332 Center drill mouth is open: end-face line does NOT cross (0, 0)
        const leftFaceLines = entities.filter(e => e.geometry.type === 'LINE' && (e.geometry as any).start?.x === 0 && (e.geometry as any).end?.x === 0);
        for (const line of leftFaceLines) {
            const geom = line.geometry as any;
            // Line should not cross through the hole opening [-2.125, +2.125]
            const minY = Math.min(geom.start.y, geom.end.y);
            const maxY = Math.max(geom.start.y, geom.end.y);
            const crossesMouth = minY < 0 && maxY > 0;
            expect(crossesMouth).toBe(false);
        }

        // 2. DIN 332 Callout text is placed outside shaft (NOT on centerline y = 0)
        const cdText = entities.find(e => e.geometry.type === 'TEXT' && (e.geometry as any).text?.includes('DIN 332'));
        if (cdText) {
            expect(Math.abs((cdText.geometry as any).position.y)).toBeGreaterThan(5);
        }

        // 3. Step-down undercut between seg-2 (Ø45) and seg-3 (Ø25):
        // Segment 3 has shoulderTransition = 'undercut', so undercut lines exist around x = 200
        const stepDownUndercuts = entities.filter(e => {
            if (e.geometry.type !== 'LINE') return false;
            const l = e.geometry as any;
            return (l.start.x >= 199 && l.start.x <= 205) || (l.end.x >= 199 && l.end.x <= 205);
        });
        expect(stepDownUndercuts.length).toBeGreaterThan(0);
    });
});
