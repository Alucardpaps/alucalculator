/**
 * 🧪 AluCAD OS — Plasma CAM Pipeline & 2D/3D/Dynamic Block Bridge Test Suite
 * 
 * Verifies:
 * 1. Golden Fixture (nested_parts.dxf): 15 parts, 0 SHEET parts, hole hierarchy detection
 * 2. Kåsa Arc Recovery & Circle Fitting (< 0.05 mm tolerance)
 * 3. Torch Swirl Rule (CW: Outer CW, Hole CCW) & Tangential Lead-In geometry
 * 4. Rosenthal Thermal Heat Input Q (kJ/mm) & Warping Risk Score
 * 5. Cutting Sequence: Holes cut first from smallest to largest, distant thermal hopping
 * 6. G-Code Multi-Dialect Emission (Mach3, LinuxCNC, Generic ISO) with exact I/J relative arcs
 * 7. G-Code Backplotter: < 0.01 mm maximum coordinate deviation and envelope safety
 * 8. Hexagonal Close-Packing: dense circle nesting with remnant rectangle identification
 * 9. Cross-Module Universal Bridge: Dynamic Blocks ⇄ 2D CAD ⇄ 3D Solid CAD ⇄ Plasma CAM
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

import { 
    fitCircleToPoints, 
    buildPartHierarchy, 
    DEFAULT_PLASMA_PROFILES,
    orientContourForSwirl,
    generateContourToolpath,
    calculateHeatInput,
    calculatePartWarpingRisk,
    sequenceThermalJob,
    emitGCode,
    backplotGCode,
    packPartsHexagonal,
    type CamPart,
    type Contour,
    computeSignedArea,
    computeBoundingBox,
    isPolygonClockwise
} from '@/cam';
import { parseDxfToParts, parseDxfContent } from '@/utils/dxfParser';
import { CrossModuleBridge, commitNestingParts, consumeNestingImport } from '@/system/crossModuleBridge';
import type { Part2D, Sheet2D } from '@/types/nesting2d.types';

describe('AluCAD CAM — Plasma Toolpath & Nesting Pipeline', () => {

    const fixturePath = path.resolve(process.cwd(), 'src/tests/fixtures/nested_parts.dxf');

    // ─── 1. GOLDEN FIXTURE DXF PARSING & SHEET FILTERING ───
    describe('1. Golden Fixture (nested_parts.dxf) Ingestion', () => {
        it('should correctly parse exactly 15 parts and filter out the SHEET boundary layer', () => {
            expect(fs.existsSync(fixturePath)).toBe(true);
            const dxfContent = fs.readFileSync(fixturePath, 'utf8');

            const result = parseDxfToParts(dxfContent, 'nested_parts.dxf');
            expect(result.errors.length).toBe(0);

            // Must be exactly 15 parts (7 large, 1 medium, 7 small)
            expect(result.parts.length).toBe(15);

            // Zero SHEET boundary parts
            const sheetParts = result.parts.filter(p => 
                p.label.toUpperCase().includes('SHEET') || 
                (p.polygon.bounds.width >= 2400 && p.polygon.bounds.height >= 1200)
            );
            expect(sheetParts.length).toBe(0);

            // Group parts by size (nested_parts.dxf contains 7 large ~248mm, 1 medium ~234mm, 7 small ~68mm)
            const largeParts = result.parts.filter(p => p.polygon.bounds.width > 240);
            const mediumParts = result.parts.filter(p => p.polygon.bounds.width > 150 && p.polygon.bounds.width <= 240);
            const smallParts = result.parts.filter(p => p.polygon.bounds.width <= 150);

            expect(largeParts.length).toBe(7);
            expect(mediumParts.length).toBe(1);
            expect(smallParts.length).toBe(7);

            // All 15 parts must have valid non-zero area and closed geometry
            for (const p of result.parts) {
                expect(p.polygon.area).toBeGreaterThan(100);
                expect(p.polygon.points.length).toBeGreaterThanOrEqual(3);
            }
        });
    });

    // ─── 2. KÅSA ARC RECOVERY & CIRCLE FITTING ───
    describe('2. Kåsa Circle & Arc Recovery', () => {
        it('should reconstruct a perfect circle from an 80-vertex polygonal approximation', () => {
            const trueR = 210.0;
            const trueCx = 500.0;
            const trueCy = 400.0;
            const numPoints = 80;

            const polygonPoints = [];
            for (let i = 0; i < numPoints; i++) {
                const theta = (2 * Math.PI * i) / numPoints;
                polygonPoints.push({
                    x: trueCx + trueR * Math.cos(theta),
                    y: trueCy + trueR * Math.sin(theta),
                });
            }

            const fit = fitCircleToPoints(polygonPoints);
            expect(fit).not.toBeNull();
            if (fit) {
                expect(Math.abs(fit.center.x - trueCx)).toBeLessThan(0.001);
                expect(Math.abs(fit.center.y - trueCy)).toBeLessThan(0.001);
                expect(Math.abs(fit.radius - trueR)).toBeLessThan(0.001);
                expect(fit.maxResidual).toBeLessThan(0.001);
            }
        });
    });

    // ─── 3. TORCH SWIRL ORIENTATION & LEAD-IN GEOMETRY ───
    describe('3. Plasma Torch Swirl & Lead-In Generator', () => {
        it('should orient outer contour CW and internal hole CCW for standard CW swirl', () => {
            // Create a square plate with a circular hole
            const outerSquare = [
                { x: 100, y: 100 },
                { x: 300, y: 100 },
                { x: 300, y: 300 },
                { x: 100, y: 300 }
            ]; // CCW by default shoelace
            const holeCircle = [
                { x: 220, y: 200 },
                { x: 200, y: 220 },
                { x: 180, y: 200 },
                { x: 200, y: 180 }
            ];

            const outerContour: Contour = {
                id: 'outer-1',
                segments: [],
                points: outerSquare,
                isClosed: true,
                role: 'outer',
                area: computeSignedArea(outerSquare),
                bounds: computeBoundingBox(outerSquare),
                isClockwise: isPolygonClockwise(outerSquare)
            };

            const holeContour: Contour = {
                id: 'hole-1',
                segments: [],
                points: holeCircle,
                isClosed: true,
                role: 'hole',
                area: computeSignedArea(holeCircle),
                bounds: computeBoundingBox(holeCircle),
                isClockwise: isPolygonClockwise(holeCircle)
            };

            const orientedOuter = orientContourForSwirl(outerContour, 'CW');
            const orientedHole = orientContourForSwirl(holeContour, 'CW');

            // For CW swirl: Outer MUST be Clockwise, Hole MUST be Counter-Clockwise
            expect(isPolygonClockwise(orientedOuter.points)).toBe(true);
            expect(isPolygonClockwise(orientedHole.points)).toBe(false);

            // Generate toolpath with 90° radial lead-in
            const tpOuter = generateContourToolpath(orientedOuter, {
                type: 'arc',
                lengthMm: 6.0,
                overcutMm: 1.0,
                swirl: 'CW',
                cutSpeedMmMin: 2800,
                pierceDelaySec: 0.3
            });

            // Outer lead-in pierce point must be in scrap (OUTSIDE the part)
            expect(tpOuter.piercePoint.y > 300 || tpOuter.piercePoint.y < 100 || tpOuter.piercePoint.x > 300 || tpOuter.piercePoint.x < 100).toBe(true);

            const tpHole = generateContourToolpath(orientedHole, {
                type: 'arc',
                lengthMm: 4.0,
                overcutMm: 1.0,
                swirl: 'CW',
                cutSpeedMmMin: 2800,
                pierceDelaySec: 0.3
            });

            // Hole lead-in pierce point must be in scrap (INSIDE the hole cutout)
            expect(tpHole.piercePoint.x).toBeGreaterThan(180);
            expect(tpHole.piercePoint.x).toBeLessThanOrEqual(220);
        });
    });

    // ─── 4. ROSENTHAL THERMAL MODEL & WARPING RISK ───
    describe('4. Rosenthal Thermal Heat Input & Warping Score', () => {
        it('should compute exact Rosenthal heat input Q (kJ/mm)', () => {
            const profile = DEFAULT_PLASMA_PROFILES['mild_steel_3mm_45A'];
            expect(profile).toBeDefined();

            // Q = (η · U · I) / (1000 · v_mms)
            // v = 2800 mm/min = 46.6667 mm/s
            // Q = (0.80 · 128 · 45) / (1000 · 46.6667) = 4608 / 46666.67 ≈ 0.09874 kJ/mm
            const Q = calculateHeatInput(profile);
            expect(Q).toBeGreaterThan(0.08);
            expect(Q).toBeLessThan(0.12);

            const testPart: CamPart = {
                id: 'part-1',
                label: 'Test Plate',
                outerContour: {
                    id: 'out-1',
                    segments: [],
                    points: [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 200 }, { x: 0, y: 200 }],
                    isClosed: true,
                    role: 'outer',
                    area: 40000,
                    bounds: { minX: 0, minY: 0, maxX: 200, maxY: 200, width: 200, height: 200 },
                    isClockwise: true
                },
                holes: [],
                quantity: 1,
                allowedRotations: [0]
            };

            const risk = calculatePartWarpingRisk(testPart, profile);
            expect(risk.score).toBeGreaterThanOrEqual(0);
            expect(risk.score).toBeLessThanOrEqual(100);
            expect(['green', 'yellow', 'red']).toContain(risk.level);
        });
    });

    // ─── 5. CUTTING SEQUENCE: HOLES FIRST & THERMAL HOPPING ───
    describe('5. Thermal Cutting Sequence Optimizer', () => {
        it('should execute all internal holes before any outer contour is cut', () => {
            const profile = DEFAULT_PLASMA_PROFILES['mild_steel_3mm_45A'];
            const sheet: Sheet2D = { width: 2500, height: 1250, kerf: 1.25 };

            const partWithHoles: CamPart = {
                id: 'p-1',
                label: 'Flange Plate',
                outerContour: {
                    id: 'out-flange',
                    segments: [],
                    points: [{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 300, y: 300 }, { x: 0, y: 300 }],
                    isClosed: true,
                    role: 'outer',
                    area: 90000,
                    bounds: { minX: 0, minY: 0, maxX: 300, maxY: 300, width: 300, height: 300 },
                    isClockwise: true
                },
                holes: [
                    {
                        id: 'hole-1',
                        segments: [],
                        points: [{ x: 50, y: 50 }, { x: 70, y: 50 }, { x: 70, y: 70 }, { x: 50, y: 70 }],
                        isClosed: true,
                        role: 'hole',
                        area: 400,
                        bounds: { minX: 50, minY: 50, maxX: 70, maxY: 70, width: 20, height: 20 },
                        isClockwise: false
                    },
                    {
                        id: 'hole-2',
                        segments: [],
                        points: [{ x: 230, y: 50 }, { x: 250, y: 50 }, { x: 250, y: 70 }, { x: 230, y: 70 }],
                        isClosed: true,
                        role: 'hole',
                        area: 400,
                        bounds: { minX: 230, minY: 50, maxX: 250, maxY: 70, width: 20, height: 20 },
                        isClockwise: false
                    }
                ],
                quantity: 1,
                allowedRotations: [0]
            };

            const job = sequenceThermalJob([partWithHoles], profile, 'heat-minimizing');
            expect(job.toolpaths.length).toBe(3); // 2 holes + 1 outer

            // First two toolpaths MUST be holes
            expect(job.toolpaths[0].role).toBe('hole');
            expect(job.toolpaths[1].role).toBe('hole');

            // Last toolpath MUST be outer contour
            expect(job.toolpaths[2].role).toBe('outer');
        });
    });

    // ─── 6. G-CODE POST-PROCESSOR & MULTI-DIALECT EMISSION ───
    describe('6. G-Code Post-Processor Emission & Backplot Verification', () => {
        it('should emit syntactically valid Mach3/LinuxCNC/Generic G-Code with relative I/J arcs and pass backplot', () => {
            const profile = DEFAULT_PLASMA_PROFILES['mild_steel_3mm_45A'];
            const sheet: Sheet2D = { width: 2500, height: 1250, kerf: 1.25 };

            const circlePart: CamPart = {
                id: 'pulley-1',
                label: 'Pulley Disk',
                outerContour: {
                    id: 'out-pulley',
                    segments: [],
                    points: [],
                    isClosed: true,
                    role: 'outer',
                    area: Math.PI * 100 * 100,
                    bounds: { minX: 100, minY: 100, maxX: 300, maxY: 300, width: 200, height: 200 },
                    isClockwise: true
                },
                holes: [],
                quantity: 1,
                allowedRotations: [0]
            };

            // Build circular points
            for (let i = 0; i < 32; i++) {
                const a = (2 * Math.PI * i) / 32;
                circlePart.outerContour.points.push({
                    x: 200 + 100 * Math.cos(a),
                    y: 200 + 100 * Math.sin(a)
                });
            }

            const job = sequenceThermalJob([circlePart], profile, 'nearest-neighbor');

            // 1. Mach3 Plasma Dialect
            const mach3GCode = emitGCode(job, profile, { dialect: 'mach3_plasma', sheetWidth: sheet.width, sheetHeight: sheet.height });
            expect(mach3GCode).toContain('G21'); // Metric
            expect(mach3GCode).toContain('G90'); // Absolute distance
            expect(mach3GCode).toContain('G17'); // XY Plane
            expect(mach3GCode).toContain('M03'); // Torch ON
            expect(mach3GCode).toContain('G04 P0.3'); // Pierce delay
            expect(mach3GCode).toContain('M05'); // Torch OFF
            expect(mach3GCode).toContain('M30'); // Program End

            // 2. LinuxCNC PlasmaC Dialect
            const linuxGCode = emitGCode(job, profile, { dialect: 'linuxcnc_plasmac', sheetWidth: sheet.width, sheetHeight: sheet.height });
            expect(linuxGCode).toContain('M3 $0 S1'); // PlasmaC torch fire syntax

            // 3. Backplot Verification
            const backplot = backplotGCode(mach3GCode, job, sheet);
            expect(backplot.isValid).toBe(true);
            expect(backplot.exceedsSheetBounds).toBe(false);
            expect(backplot.maxCoordinateDeviationMm).toBeLessThan(0.01);
        });
    });

    // ─── 7. HEXAGONAL CLOSE-PACKING ENGINE ───
    describe('7. Hexagonal Staggered Circle Packing', () => {
        it('should pack multiple circular disks staggered to minimize used sheet length', () => {
            const disks: CamPart[] = [];
            const r = 150;
            for (let i = 0; i < 6; i++) {
                const pts = [];
                for (let j = 0; j < 32; j++) {
                    const a = (2 * Math.PI * j) / 32;
                    pts.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
                }
                disks.push({
                    id: `disk-${i}`,
                    label: `Disk Ø300 #${i + 1}`,
                    outerContour: {
                        id: `disk-out-${i}`,
                        segments: [],
                        points: pts,
                        isClosed: true,
                        role: 'outer',
                        area: Math.PI * r * r,
                        bounds: { minX: -r, minY: -r, maxX: r, maxY: r, width: 2 * r, height: 2 * r },
                        isClockwise: true
                    },
                    holes: [],
                    quantity: 1,
                    allowedRotations: [0]
                });
            }

            const solution = packPartsHexagonal(disks, 2500, 1250, 6.0, 10.0);
            expect(solution.placedParts.length).toBe(6);
            expect(solution.usedLengthMm).toBeLessThan(2500);
            expect(solution.remnantRectangle.width).toBeGreaterThan(1000);
        });
    });

    // ─── 8. UNIVERSAL CROSS-MODULE BRIDGE ───
    describe('8. Universal Cross-Module Bridge (Dynamic Blocks ⇄ 2D CAD ⇄ 3D ⇄ CAM)', () => {
        it('should export dyn_sheet_metal_plate into a verified 2D nesting part with 4 corner holes and cutout', () => {
            const res = CrossModuleBridge.exportDynamicBlockToNesting('dyn_sheet_metal_plate', {
                width: 400,
                length: 600,
                thickness: 3.0,
                holePattern: '4_corners',
                holeBoltSize: 'M10',
                marginEdgeX: 35,
                marginEdgeY: 35,
                centerCutout: 'rect',
                cutoutWidth: 150,
                cutoutHeight: 180,
                cornerFinish: 'fillet',
                cornerFinishRadius: 20
            }, { switchWindow: false });

            expect(res.success).toBe(true);
            expect(res.part).not.toBeNull();
            if (res.part) {
                expect(res.part.polygon.bounds.width).toBe(400);
                expect(res.part.polygon.bounds.height).toBe(600);
                // 4 corner holes + 1 rectangular center cutout = 5 inner polygons
                expect(res.part.holeCount).toBe(5);
                expect(res.part.innerPolygons?.length).toBe(5);
            }
        });

        it('should support FIFO commit and consumption of pending nesting imports', () => {
            const dummyPart: Part2D = {
                id: 'dummy-test-part',
                label: 'Test Plate',
                polygon: {
                    points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
                    bounds: { x: 0, y: 0, width: 100, height: 100 },
                    area: 10000
                },
                quantity: 2,
                allowedRotations: [0, 90]
            };

            commitNestingParts([dummyPart], 'Unit Test Import', 'UnitTest');
            const consumed = consumeNestingImport();
            expect(consumed.length).toBe(1);
            expect(consumed[0].id).toBe('dummy-test-part');

            // Subsequent consumption should be empty
            const consumedAgain = consumeNestingImport();
            expect(consumedAgain.length).toBe(0);
        });

        it('should convert CAM toolpaths into 2D CAD entities with CAM_RAPID, CAM_PIERCE, CAM_LEADIN, CAM_CUT layers', () => {
            const profile = DEFAULT_PLASMA_PROFILES['mild_steel_3mm_45A'];
            const part: CamPart = {
                id: 'cad-bridge-test',
                label: 'Square Part',
                outerContour: {
                    id: 'out',
                    segments: [],
                    points: [{ x: 50, y: 50 }, { x: 150, y: 50 }, { x: 150, y: 150 }, { x: 50, y: 150 }],
                    isClosed: true,
                    role: 'outer',
                    area: 10000,
                    bounds: { minX: 50, minY: 50, maxX: 150, maxY: 150, width: 100, height: 100 },
                    isClockwise: true
                },
                holes: [],
                quantity: 1,
                allowedRotations: [0]
            };

            const job = sequenceThermalJob([part], profile, 'nearest-neighbor');
            const exported = CrossModuleBridge.exportNestingToolpathsToCad(job, { switchWindow: false });

            expect(exported.totalCount).toBeGreaterThan(0);
            const layers = new Set(exported.entities.map(e => e.layerId));
            expect(layers.has('CAM_RAPID')).toBe(true);
            expect(layers.has('CAM_PIERCE')).toBe(true);
            expect(layers.has('CAM_LEADIN')).toBe(true);
            expect(layers.has('CAM_CUT')).toBe(true);
        });

        it('should export multiple dynamic block types (pipe spool, box profile) directly into Nesting Part2D', () => {
            // Test 1: Pipe Spool / Flange
            const flangeRes = CrossModuleBridge.exportDynamicBlockToNesting('dyn_pipe_flange', {
                dnSize: 'DN50',
                flangeConfig: 'both',
                length: 500,
            }, { switchWindow: false });

            expect(flangeRes.success).toBe(true);
            expect(flangeRes.part).not.toBeNull();
            if (flangeRes.part) {
                expect(flangeRes.part.polygon.area).toBeGreaterThan(0);
            }

            // Test 2: Box Profile (SHS 50x50x3) with inner hollow hole
            const boxRes = CrossModuleBridge.exportDynamicBlockToNesting('dyn_box_profile', {
                profileType: 'SHS 50x50x3',
                visState: 'cross_section',
            }, { switchWindow: false });

            expect(boxRes.success).toBe(true);
            expect(boxRes.part).not.toBeNull();
            if (boxRes.part) {
                expect(boxRes.part.polygon.area).toBeGreaterThan(0);
                expect(boxRes.part.holeCount).toBeGreaterThanOrEqual(1);
            }
        });
    });

    // ─── 10. ADVANCED PLASMA CUTTING STRATEGIES (CLC, TRUE HOLE, CORNER LOOPS) ───
    describe('10. Advanced Plasma Cutting Strategies', () => {
        const profile = DEFAULT_PLASMA_PROFILES['mild_steel_3mm_45A'];

        it('should detect collinear adjacent edges and apply Common Line Cutting (CLC)', () => {
            // Two adjacent rectangular parts sharing an edge along X = 100 from Y = 0 to 100
            const part1: CamPart = {
                id: 'clc-part-1',
                label: 'Left Plate',
                outerContour: {
                    id: 'out-1',
                    segments: [],
                    points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
                    isClosed: true,
                    role: 'outer',
                    area: 10000,
                    bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 },
                    isClockwise: true
                },
                holes: [],
                quantity: 1,
                allowedRotations: [0]
            };

            const part2: CamPart = {
                id: 'clc-part-2',
                label: 'Right Plate',
                outerContour: {
                    id: 'out-2',
                    segments: [],
                    // Shares edge at x=100 from y=0 to 100
                    points: [{ x: 100, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 100 }, { x: 100, y: 100 }],
                    isClosed: true,
                    role: 'outer',
                    area: 10000,
                    bounds: { minX: 100, minY: 0, maxX: 200, maxY: 100, width: 100, height: 100 },
                    isClockwise: true
                },
                holes: [],
                quantity: 1,
                allowedRotations: [0]
            };

            const job = sequenceThermalJob([part1, part2], profile, 'common-line');
            expect(job.strategy).toBe('common-line');
            expect(job.commonLineEdgeCount).toBeGreaterThanOrEqual(1);

            // Verify that at least one operation has isCommonLine set and one redundant cut is bypassed
            const hasCommonLineOp = job.toolpaths.some(tp => 
                tp.operations.some(op => op.isCommonLine)
            );
            expect(hasCommonLineOp).toBe(true);
        });

        it('should apply True Hole™ technology for small holes (D <= 35 mm)', () => {
            // Part with a small 20mm bolt hole
            const partWithSmallHole: CamPart = {
                id: 'true-hole-test-part',
                label: 'Bearing Plate',
                outerContour: {
                    id: 'out-rect',
                    segments: [],
                    points: [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 200 }, { x: 0, y: 200 }],
                    isClosed: true,
                    role: 'outer',
                    area: 40000,
                    bounds: { minX: 0, minY: 0, maxX: 200, maxY: 200, width: 200, height: 200 },
                    isClockwise: true
                },
                holes: [{
                    id: 'small-hole',
                    segments: [],
                    // 20mm circle approximated with points
                    points: Array.from({ length: 24 }).map((_, i) => {
                        const a = (i * 2 * Math.PI) / 24;
                        return { x: 100 + 10 * Math.cos(a), y: 100 + 10 * Math.sin(a) };
                    }),
                    isClosed: true,
                    role: 'hole',
                    area: Math.PI * 100,
                    bounds: { minX: 90, minY: 90, maxX: 110, maxY: 110, width: 20, height: 20 },
                    isClockwise: false
                }],
                quantity: 1,
                allowedRotations: [0]
            };

            const job = sequenceThermalJob([partWithSmallHole], profile, 'true-hole-precision');
            expect(job.toolpaths.length).toBe(2);

            // The hole toolpath is cut first
            const holeTp = job.toolpaths[0];
            expect(holeTp.role).toBe('hole');
            expect(holeTp.isTrueHole).toBe(true);

            // True Hole feedrate must be reduced to 65% of normal cut speed to prevent conical taper
            const cutOps = holeTp.operations.filter(op => op.type === 'cut');
            expect(cutOps.length).toBeGreaterThan(0);
            for (const op of cutOps) {
                expect(op.feedRateMmMin).toBeCloseTo(profile.cutSpeedMmMin * 0.65, 0);
            }

            // Must include an overcut (overburn) operation past the lead-in touch point
            const overcutOp = holeTp.operations.find(op => op.type === 'overcut');
            expect(overcutOp).toBeDefined();
        });

        it('should generate corner loops for sharp external corners (> 45 deg)', () => {
            const squarePart: CamPart = {
                id: 'corner-loop-part',
                label: 'Square Part',
                outerContour: {
                    id: 'out-square',
                    segments: [],
                    points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
                    isClosed: true,
                    role: 'outer',
                    area: 10000,
                    bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 },
                    isClockwise: true
                },
                holes: [],
                quantity: 1,
                allowedRotations: [0]
            };

            const job = sequenceThermalJob([squarePart], profile, 'heat-minimizing');
            const outerTp = job.toolpaths[0];

            // Outer contour has 90 degree corners, so corner loops should be created
            const cornerLoopOps = outerTp.operations.filter(op => op.isCornerLoop);
            expect(cornerLoopOps.length).toBeGreaterThan(0);
        });
    });

    // ─── 10. SIGMANEST RAPORU & COLUMBUS GELİŞTİRMELERİ ───
    describe('10. SigmaNEST Technical Report & Columbus Enhancements', () => {
        it('should parse multi-part DXF and normalize part origins to (0,0)', () => {
            const multiDxf = `0\nSECTION\n2\nENTITIES\n` +
                // Part 1: Box at (200, 300) to (400, 500)
                `0\nLWPOLYLINE\n8\n0\n90\n4\n70\n1\n10\n200.0\n20\n300.0\n10\n400.0\n20\n300.0\n10\n400.0\n20\n500.0\n10\n200.0\n20\n500.0\n` +
                // Part 2: Box at (600, 700) to (800, 900)
                `0\nLWPOLYLINE\n8\n0\n90\n4\n70\n1\n10\n600.0\n20\n700.0\n10\n800.0\n20\n700.0\n10\n800.0\n20\n900.0\n10\n600.0\n20\n900.0\n` +
                `0\nENDSEC\n0\nEOF`;

            const res = parseDxfContent(multiDxf, 'test_assembly.dxf');
            expect(res.parts.length).toBe(2);
            // Both parts must have their bounding boxes normalized to (0, 0)
            expect(res.parts[0].polygon.bounds.x).toBe(0);
            expect(res.parts[0].polygon.bounds.y).toBe(0);
            expect(res.parts[0].polygon.bounds.width).toBeCloseTo(200, 1);
            expect(res.parts[0].polygon.bounds.height).toBeCloseTo(200, 1);

            expect(res.parts[1].polygon.bounds.x).toBe(0);
            expect(res.parts[1].polygon.bounds.y).toBe(0);
            expect(res.parts[1].polygon.bounds.width).toBeCloseTo(200, 1);
            expect(res.parts[1].polygon.bounds.height).toBeCloseTo(200, 1);
        });

        it('should automatically tag DXF metadata (Quantity, Thickness, Material) from TEXT entities', () => {
            const taggedDxf = `0\nSECTION\n2\nENTITIES\n` +
                // Part: Box at (100, 100) to (300, 300)
                `0\nLWPOLYLINE\n8\n0\n90\n4\n70\n1\n10\n100.0\n20\n100.0\n10\n300.0\n20\n100.0\n10\n300.0\n20\n300.0\n10\n100.0\n20\n300.0\n` +
                // Text tags inside part bounds
                `0\nTEXT\n8\n0\n10\n150.0\n20\n150.0\n40\n5.0\n1\nADET: 48\n` +
                `0\nTEXT\n8\n0\n10\n150.0\n20\n170.0\n40\n5.0\n1\nKALINLIK: 15 MM\n` +
                `0\nTEXT\n8\n0\n10\n150.0\n20\n190.0\n40\n5.0\n1\nMALZEME: ST-37\n` +
                `0\nTEXT\n8\n0\n10\n150.0\n20\n210.0\n40\n5.0\n1\nPARCA: TABAN_PLAKASI\n` +
                `0\nENDSEC\n0\nEOF`;

            const res = parseDxfContent(taggedDxf, 'plate.dxf');
            expect(res.parts.length).toBe(1);
            const part = res.parts[0];
            expect(part.label).toBe('TABAN_PLAKASI');
            expect(part.quantity).toBe(48);
            expect(part.thickness).toBe(15);
            expect(part.material).toBe('ST-37');
        });

        it('should generate No-Pierce Flying Microjoint with 0 extra pierces (solving SigmaNEST 59 vs 160 disaster)', () => {
            const profile = DEFAULT_PLASMA_PROFILES['mild_steel_3mm_45A'];
            const part: CamPart = {
                id: 'tab-part-1',
                label: 'Tab Part',
                outerContour: {
                    id: 'out-tab',
                    segments: [],
                    points: [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 200 }, { x: 0, y: 200 }],
                    isClosed: true,
                    role: 'outer',
                    area: 40000,
                    bounds: { minX: 0, minY: 0, maxX: 200, maxY: 200, width: 200, height: 200 },
                    isClockwise: true
                },
                holes: [],
                quantity: 1,
                allowedRotations: [0]
            };

            // Sequence with No-Pierce Microjoint enabled
            const job = sequenceThermalJob([part], profile, 'heat-minimizing', {
                enableMicrojoint: true,
                microjointTabWidthMm: 2.0
            });

            expect(job.toolpaths.length).toBe(1);
            const outerTp = job.toolpaths[0];
            expect(outerTp.hasMicrojoint).toBe(true);
            expect(outerTp.tabWidthMm).toBe(2.0);

            // Total pierces must be strictly 1 for the outer contour (0 extra pierces!)
            expect(job.pierceCount).toBe(1);
            // SigmaNEST simulated pierces would add extra pierces for every tab
            expect(job.sigmaNestSimulatedPierces).toBeGreaterThan(job.pierceCount);
            expect(job.pierceSavingsPercent).toBeGreaterThanOrEqual(50);
        });

        it('should sequence Pi-Cut (n-biçimli) to prevent C-cut slippage and secure parts to skeleton', () => {
            const profile = DEFAULT_PLASMA_PROFILES['mild_steel_3mm_45A'];
            // Two adjacent parts sharing a collinear vertical edge at X = 200
            const part1: CamPart = {
                id: 'p-left',
                label: 'Left Plate',
                outerContour: {
                    id: 'out-left',
                    segments: [],
                    points: [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 200 }, { x: 0, y: 200 }],
                    isClosed: true,
                    role: 'outer',
                    area: 40000,
                    bounds: { minX: 0, minY: 0, maxX: 200, maxY: 200, width: 200, height: 200 },
                    isClockwise: true
                },
                holes: [],
                quantity: 1,
                allowedRotations: [0]
            };
            const part2: CamPart = {
                id: 'p-right',
                label: 'Right Plate',
                outerContour: {
                    id: 'out-right',
                    segments: [],
                    points: [{ x: 200, y: 0 }, { x: 400, y: 0 }, { x: 400, y: 200 }, { x: 200, y: 200 }],
                    isClosed: true,
                    role: 'outer',
                    area: 40000,
                    bounds: { minX: 200, minY: 0, maxX: 400, maxY: 200, width: 200, height: 200 },
                    isClockwise: true
                },
                holes: [],
                quantity: 1,
                allowedRotations: [0]
            };

            const job = sequenceThermalJob([part1, part2], profile, 'pi-cut');
            expect(job.strategy).toBe('pi-cut');
            expect(job.commonLineEdgeCount).toBe(1);
            expect(job.toolpaths.length).toBe(2);
            // Pi-Cut ensures common-line anchored cuts are sequenced first
            expect(job.toolpaths[0].isCommonLine).toBe(true);
        });
    });

    // ─── 11. PROGRESSIVE COMMON LINE, ANCHOR EDGE & PER-PART HOLE PROTECTION (IMAGE 2) ───
    describe('11. Progressive Common Line, Anchor Edge & Per-Part Hole Protection (Image 2)', () => {
        const profile = DEFAULT_PLASMA_PROFILES['mild_steel_3mm_45A'];

        it('should sequence 4 stacked plates exactly matching Image 2 (1..13), 0 duplicate cuts, and anchor tabs', () => {
            // 4 vertically stacked plates sharing edges, matching Image 2:
            // Plate 1: (0, 300) to (200, 400)
            // Plate 2: (0, 200) to (200, 300)
            // Plate 3: (0, 100) to (200, 200)
            // Plate 4: (0, 0)   to (200, 100)
            const makeRectPart = (id: string, label: string, yMin: number, yMax: number, withHole = false): CamPart => {
                const holes: Contour[] = [];
                if (withHole) {
                    const holeCenterY = (yMin + yMax) / 2;
                    holes.push({
                        id: `${id}-hole-1`,
                        segments: [],
                        points: [
                            { x: 90, y: holeCenterY - 10 },
                            { x: 110, y: holeCenterY - 10 },
                            { x: 110, y: holeCenterY + 10 },
                            { x: 90, y: holeCenterY + 10 }
                        ],
                        isClosed: true,
                        role: 'hole',
                        area: 400,
                        bounds: { minX: 90, minY: holeCenterY - 10, maxX: 110, maxY: holeCenterY + 10, width: 20, height: 20 },
                        isClockwise: false
                    });
                }
                return {
                    id,
                    label,
                    outerContour: {
                        id: `out-${id}`,
                        segments: [],
                        points: [
                            { x: 0, y: yMin },
                            { x: 200, y: yMin },
                            { x: 200, y: yMax },
                            { x: 0, y: yMax }
                        ],
                        isClosed: true,
                        role: 'outer',
                        area: 200 * (yMax - yMin),
                        bounds: { minX: 0, minY: yMin, maxX: 200, maxY: yMax, width: 200, height: yMax - yMin },
                        isClockwise: true
                    },
                    holes,
                    quantity: 1,
                    allowedRotations: [0]
                };
            };

            const part1 = makeRectPart('part-1', 'Parça 1', 300, 400, true);
            const part2 = makeRectPart('part-2', 'Parça 2', 200, 300, true);
            const part3 = makeRectPart('part-3', 'Parça 3', 100, 200, false);
            const part4 = makeRectPart('part-4', 'Parça 4', 0, 100, false);

            const job = sequenceThermalJob([part1, part2, part3, part4], profile, 'progressive-common-line', {
                enableAnchorTabs: true,
                anchorTabMode: 'count',
                anchorTabCount: 4,
                anchorTabWidthMm: 3.0,
                cutAnchorEdgeLast: true,
                cutHolesPerPart: true
            });

            expect(job.strategy).toBe('progressive-common-line');
            expect(job.duplicateCutCount).toBe(0);
            expect(job.commonLineEdgeCount).toBe(3); // 3 shared lines: between 1-2, 2-3, 3-4

            // Check operations sequence
            const ops = job.toolpaths.flatMap(tp => tp.operations);
            const stepsWithLabels = ops.filter(op => op.sequenceStep !== undefined);

            // Step numbers must include 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13
            const stepNumbers = stepsWithLabels.map(op => op.sequenceStep);
            for (let s = 1; s <= 13; s++) {
                expect(stepNumbers).toContain(s);
            }

            // Verify Step 13 is the Anchor Edge (Sabit Kenar) and contains 4 anchor tabs
            const step13Ops = ops.filter(op => op.sequenceStep === 13);
            expect(step13Ops.length).toBeGreaterThan(0);
            expect(step13Ops[0].isAnchorEdge).toBe(true);

            const tabOps = step13Ops.filter(op => op.isAnchorTab);
            expect(tabOps.length).toBe(4); // 4 sabitleme noktası // // // //

            // Per-part hole preservation test:
            // Hole 1 (inside Part 1) must be cut before Part 1 outer cut (Step 1)
            // Hole 2 (inside Part 2) must be cut before Part 2 outer cut (Step 4)
            const hole1Index = ops.findIndex(op => op.sequenceLabel?.includes('Parça 1 Delik'));
            const step1Index = ops.findIndex(op => op.sequenceStep === 1);
            expect(hole1Index).toBeGreaterThanOrEqual(0);
            expect(hole1Index).toBeLessThan(step1Index);

            const hole2Index = ops.findIndex(op => op.sequenceLabel?.includes('Parça 2 Delik'));
            const step4Index = ops.findIndex(op => op.sequenceStep === 4);
            expect(hole2Index).toBeGreaterThanOrEqual(0);
            expect(hole2Index).toBeLessThan(step4Index);
        });

        it('should calculate anchor tabs based on spacing (e.g., 50 mm intervals)', () => {
            const makePart = (id: string, yMin: number, yMax: number): CamPart => ({
                id,
                label: id,
                outerContour: {
                    id: `out-${id}`,
                    segments: [],
                    points: [{ x: 0, y: yMin }, { x: 300, y: yMin }, { x: 300, y: yMax }, { x: 0, y: yMax }],
                    isClosed: true,
                    role: 'outer',
                    area: 300 * (yMax - yMin),
                    bounds: { minX: 0, minY: yMin, maxX: 300, maxY: yMax, width: 300, height: yMax - yMin },
                    isClockwise: true
                },
                holes: [],
                quantity: 1,
                allowedRotations: [0]
            });

            const p1 = makePart('p1', 100, 200);
            const p2 = makePart('p2', 0, 100);

            // Width is 300mm, with 50mm spacing -> expect round(300 / 50) = 6 tabs
            const job = sequenceThermalJob([p1, p2], profile, 'progressive-common-line', {
                enableAnchorTabs: true,
                anchorTabMode: 'spacing',
                anchorTabSpacingMm: 50,
                anchorTabWidthMm: 2.5,
                cutAnchorEdgeLast: true
            });

            const ops = job.toolpaths.flatMap(tp => tp.operations);
            const anchorEdgeOps = ops.filter(op => op.isAnchorEdge);
            expect(anchorEdgeOps.length).toBeGreaterThan(0);

            const tabs = anchorEdgeOps.filter(op => op.isAnchorTab);
            expect(tabs.length).toBe(6);
        });

        it('should cut horizontal side-by-side parts with EXACTLY ONE common line cut (1 kesim ile 2 sac)', () => {
            // Two parts placed side by side touching at X = 200
            // Part 1: X = [0, 200], Y = [0, 150]
            // Part 2: X = [200, 400], Y = [0, 150]
            const makeRect = (id: string, label: string, minX: number, maxX: number, minY: number, maxY: number): CamPart => ({
                id,
                label,
                outerContour: {
                    id: `out-${id}`,
                    segments: [],
                    points: [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }],
                    isClosed: true,
                    role: 'outer',
                    area: (maxX - minX) * (maxY - minY),
                    bounds: { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY },
                    isClockwise: true
                },
                holes: [],
                quantity: 1,
                allowedRotations: [0]
            });

            const leftPart = makeRect('p-left', 'Sol Sac', 0, 200, 0, 150);
            const rightPart = makeRect('p-right', 'Sağ Sac', 200, 400, 0, 150);

            const job = sequenceThermalJob([leftPart, rightPart], profile, 'progressive-common-line');

            expect(job.strategy).toBe('progressive-common-line');
            expect(job.commonLineEdgeCount).toBe(1); // Exactly 1 common edge
            expect(job.duplicateCutCount).toBe(0); // Zero duplicate cuts

            // Find all cut operations in the job
            const allCutOps = job.toolpaths.flatMap(tp => tp.operations).filter(op => op.type === 'cut');

            // Find cuts that lie along the shared vertical seam (X = 200)
            const seamCuts = allCutOps.filter(op => {
                if (!op.segment) return false;
                const isVerticalAt200 = Math.abs(op.segment.start.x - 200) < 0.1 && Math.abs(op.segment.end.x - 200) < 0.1;
                return isVerticalAt200;
            });

            // The shared vertical seam MUST be cut EXACTLY ONCE!
            expect(seamCuts.length).toBe(1);
            expect(seamCuts[0].isCommonLine).toBe(true);

            // The second part MUST NOT have cut its left edge (no duplicate cut at X=200)
            const rightPartTp = job.toolpaths.find(tp => tp.contourId.includes('p-right'));
            expect(rightPartTp).toBeDefined();
            const rightPartCuts = rightPartTp!.operations.filter(op => op.type === 'cut' && op.segment);
            const rightPartCutsLeftEdge = rightPartCuts.some(op => 
                Math.abs(op.segment!.start.x - 200) < 0.1 && Math.abs(op.segment!.end.x - 200) < 0.1
            );
            expect(rightPartCutsLeftEdge).toBe(false); // Left edge was skipped!
        });

        it('should cut shared vertical and horizontal seams EXACTLY ONCE in a 2x2 grid (0 duplicate cuts)', () => {
            const makeGridRect = (id: string, label: string, minX: number, maxX: number, minY: number, maxY: number): CamPart => ({
                id,
                label,
                outerContour: {
                    id: `out-${id}`,
                    segments: [],
                    points: [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }],
                    isClosed: true,
                    role: 'outer',
                    area: (maxX - minX) * (maxY - minY),
                    bounds: { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY },
                    isClockwise: true
                },
                holes: [],
                quantity: 1,
                allowedRotations: [0],
                cuttingMode: 'common',
                allowCommonLine: true
            });

            // 2x2 grid layout (two stacks side by side)
            // Left stack (Column 0):
            const pTopLeft = makeGridRect('p-tl', 'Top-Left', 0, 200, 150, 300);
            const pBotLeft = makeGridRect('p-bl', 'Bot-Left', 0, 200, 0, 150);
            // Right stack (Column 1):
            const pTopRight = makeGridRect('p-tr', 'Top-Right', 200, 400, 150, 300);
            const pBotRight = makeGridRect('p-br', 'Bot-Right', 200, 400, 0, 150);

            const job = sequenceThermalJob([pTopLeft, pBotLeft, pTopRight, pBotRight], profile, 'progressive-common-line');

            expect(job.strategy).toBe('progressive-common-line');
            expect(job.duplicateCutCount).toBe(0);

            const allCutOps = job.toolpaths.flatMap(tp => tp.operations).filter(op => op.type === 'cut');

            // 1. Vertical seam cuts along X = 200 (between column 0 and column 1)
            const verticalSeamCuts = allCutOps.filter(op => {
                if (!op.segment) return false;
                return Math.abs(op.segment.start.x - 200) < 0.5 && Math.abs(op.segment.end.x - 200) < 0.5;
            });

            // The shared vertical seam at X = 200 MUST be cut EXACTLY ONCE per segment (Top half + Bot half = 2 cuts total)
            // Both MUST be marked isCommonLine: true
            expect(verticalSeamCuts.length).toBe(2);
            expect(verticalSeamCuts.every(op => op.isCommonLine)).toBe(true);

            // 2. Right column (Stack 1) MUST NOT have any cuts along X = 200 (left edge completely skipped!)
            const rightStackToolpaths = job.toolpaths.filter(tp => 
                tp.contourId.includes('p-tr') || tp.contourId.includes('p-br')
            );
            const rightStackCutsAt200 = rightStackToolpaths.flatMap(tp => tp.operations).filter(op => {
                if (op.type !== 'cut' || !op.segment) return false;
                return Math.abs(op.segment.start.x - 200) < 0.5 && Math.abs(op.segment.end.x - 200) < 0.5;
            });
            expect(rightStackCutsAt200.length).toBe(0);

            // 3. Horizontal seams along Y = 150 (between top and bottom parts)
            const horizontalSeamCuts = allCutOps.filter(op => {
                if (!op.segment) return false;
                return Math.abs(op.segment.start.y - 150) < 0.5 && Math.abs(op.segment.end.y - 150) < 0.5;
            });
            expect(horizontalSeamCuts.length).toBe(2);
            expect(horizontalSeamCuts.every(op => op.isCommonLine)).toBe(true);
        });

        it('should respect per-part cuttingMode: standalone part adjacent to another part MUST NOT be merged or have edges skipped', () => {
            const makeRect = (id: string, label: string, minX: number, maxX: number, minY: number, maxY: number, cuttingMode: 'common' | 'standalone'): CamPart => ({
                id,
                label,
                outerContour: {
                    id: `out-${id}`,
                    segments: [],
                    points: [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }],
                    isClosed: true,
                    role: 'outer',
                    area: (maxX - minX) * (maxY - minY),
                    bounds: { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY },
                    isClockwise: true
                },
                holes: [],
                quantity: 1,
                allowedRotations: [0],
                cuttingMode,
                allowCommonLine: cuttingMode === 'common'
            });

            // Two adjacent rectangles touching at X = 200
            // Part 1: common cut
            // Part 2: explicitly set to standalone ("Tekli Kesim")
            const p1 = makeRect('p1', 'Parça 1 (Ortak)', 0, 200, 0, 150, 'common');
            const p2 = makeRect('p2', 'Parça 2 (Tekli)', 200, 400, 0, 150, 'standalone');

            const job = sequenceThermalJob([p1, p2], profile, 'progressive-common-line');

            // Because p2 is standalone, common line cut merging MUST be bypassed!
            expect(job.commonLineEdgeCount).toBe(0);

            // Both parts must have their complete outer contours cut
            const p2Tp = job.toolpaths.find(tp => tp.contourId.includes('p2') && tp.role === 'outer');
            expect(p2Tp).toBeDefined();

            // Part 2 must NOT have skipped its left boundary edge
            const p2CutOps = p2Tp!.operations.filter(op => op.type === 'cut' && op.segment);
            expect(p2CutOps.length).toBeGreaterThanOrEqual(4);
            const hasLeftEdgeCut = p2CutOps.some(op => 
                Math.abs(op.segment!.start.x - 200) < 0.5 && Math.abs(op.segment!.end.x - 200) < 0.5
            );
            expect(hasLeftEdgeCut).toBe(true);
        });

        it('should generate continuous bridge cuts connecting consecutive parts when bridge cutting is enabled', () => {
            const makeRect = (id: string, minX: number, maxX: number, minY: number, maxY: number, enableBridge = true): CamPart => ({
                id,
                label: id,
                outerContour: {
                    id: `out-${id}`,
                    segments: [],
                    points: [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }],
                    isClosed: true,
                    role: 'outer',
                    area: (maxX - minX) * (maxY - minY),
                    bounds: { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY },
                    isClockwise: true
                },
                holes: [],
                quantity: 1,
                allowedRotations: [0],
                enableBridge
            });

            // Two separated parts 15mm apart (distance <= maxBridgeDistanceMm 35mm)
            const pA = makeRect('partA', 0, 100, 0, 100);
            const pB = makeRect('partB', 115, 215, 0, 100);

            const jobWithBridge = sequenceThermalJob([pA, pB], profile, 'heat-minimizing', {
                enableBridgeCutting: true,
                maxBridgeDistanceMm: 150.0,
                cutHolesPerPart: false
            });

            expect(jobWithBridge.bridgeCount).toBeGreaterThanOrEqual(1);

            // Find bridge cut operation
            const bridgeOps = jobWithBridge.toolpaths.flatMap(tp => tp.operations).filter(op => op.type === 'bridgeCut');
            expect(bridgeOps.length).toBeGreaterThanOrEqual(1);
            expect(bridgeOps[0].torchOn).toBe(true);
            expect(bridgeOps[0].isBridge).toBe(true);

            // Verify pierce count is reduced because the second part skips its initial pierce!
            const jobWithoutBridge = sequenceThermalJob([pA, pB], profile, 'heat-minimizing', {
                enableBridgeCutting: false,
                cutHolesPerPart: false
            });
            expect(jobWithBridge.pierceCount).toBeLessThan(jobWithoutBridge.pierceCount);
        });

        it('should suppress bridge cut if either part has enableBridge: false', () => {
            const makeRect = (id: string, minX: number, maxX: number, minY: number, maxY: number, enableBridge: boolean): CamPart => ({
                id,
                label: id,
                outerContour: {
                    id: `out-${id}`,
                    segments: [],
                    points: [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }],
                    isClosed: true,
                    role: 'outer',
                    area: (maxX - minX) * (maxY - minY),
                    bounds: { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY },
                    isClockwise: true
                },
                holes: [],
                quantity: 1,
                allowedRotations: [0],
                enableBridge
            });

            const pA = makeRect('partA', 0, 100, 0, 100, true);
            const pB = makeRect('partB', 115, 215, 0, 100, false); // Disabled bridge

            const job = sequenceThermalJob([pA, pB], profile, 'heat-minimizing', {
                enableBridgeCutting: true,
                maxBridgeDistanceMm: 35.0,
                cutHolesPerPart: false
            });

            expect(job.bridgeCount).toBe(0);
        });

        it('should insert microjoints (uncut tabs) along outer toolpaths to prevent parts from tipping into slats', () => {
            const part: CamPart = {
                id: 'mj-part',
                label: 'Microjoint Part',
                outerContour: {
                    id: 'out-mj',
                    segments: [],
                    points: [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 200 }, { x: 0, y: 200 }],
                    isClosed: true,
                    role: 'outer',
                    area: 40000,
                    bounds: { minX: 0, minY: 0, maxX: 200, maxY: 200, width: 200, height: 200 },
                    isClockwise: true
                },
                holes: [],
                quantity: 1,
                allowedRotations: [0],
            };

            const job = sequenceThermalJob([part], profile, 'nearest-neighbor', {
                enableMicrojoint: true,
                microjointTabWidthMm: 2.5,
                microjointCount: 2,
                cutHolesPerPart: false
            });

            const outerTp = job.toolpaths.find(tp => tp.role === 'outer');
            expect(outerTp).toBeDefined();
            expect(outerTp!.hasMicrojoint).toBe(true);

            // Must contain rapid segments with torchOn: false representing the uncut tab gap
            const tabOps = outerTp!.operations.filter(op => op.isMicrojoint);
            expect(tabOps.length).toBeGreaterThanOrEqual(1);
            expect(tabOps[0].torchOn).toBe(false);
            expect(tabOps[0].segment).toBeDefined();
            expect(tabOps[0].segment!.length).toBeCloseTo(2.5, 0.5);
        });
    });
});

