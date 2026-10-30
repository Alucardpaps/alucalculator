import { describe, it, expect } from 'vitest';
import {
    calculateSprocketSpecs,
    generateSprocketContour,
    generateProductionSprocketSvg,
    generateProductionSprocketDxf,
} from '@/engines/math/sprocket-geometry-factory';
import {
    calculatePulleySpecs,
    generateTimingPulleyContour,
    generateProductionPulleySvg,
    generateProductionPulleyDxf,
} from '@/engines/math/pulley-geometry-factory';
import {
    calculateInvoluteGearSpecs,
    generateExternalGearContour,
    generateInternalGearContour,
    generateProductionGearSvg,
    generateProductionGearDxf,
} from '@/engines/math/gear-involute-factory';

describe('ISO 606 / DIN 8187 Sprocket Geometry Engine', () => {
    it('calculates ISO 606 08B-1 sprocket specs with exact standard formulas', () => {
        // 08B-1: p = 12.7 mm, d1 = 8.51 mm, z = 25
        const specs = calculateSprocketSpecs({
            teeth: 25,
            pitch: 12.7,
            rollerDiameter: 8.51,
        });

        // Pitch diameter: d = p / sin(pi / z)
        const expectedD = 12.7 / Math.sin(Math.PI / 25);
        expect(specs.pitchDiameter).toBeCloseTo(expectedD, 3);
        expect(specs.pitchRadius).toBeCloseTo(expectedD / 2, 3);

        // Roller seating radius: ri = 0.505 * d1
        expect(specs.rollerSeatingRadius).toBeCloseTo(0.505 * 8.51, 3);

        // Flank radius: re = 0.12 * d1 * (z + 2)
        expect(specs.flankRadius).toBeCloseTo(0.12 * 8.51 * (25 + 2), 3);

        // Root diameter: df = d - d1
        expect(specs.rootDiameter).toBeCloseTo(expectedD - 8.51, 3);

        // Outside diameter da is the mean of daMin and daMax
        expect(specs.outsideDiameter).toBeGreaterThan(specs.pitchDiameter);
        expect(specs.outsideDiameter).toBeLessThan(expectedD + 12.7 * 1.25);
    });

    it('calculates ISO 606 16B-1 heavy industrial chain specs', () => {
        // 16B-1: p = 25.4 mm (1 inch), d1 = 15.88 mm, z = 38
        const specs = calculateSprocketSpecs({
            teeth: 38,
            pitch: 25.4,
            rollerDiameter: 15.88,
        });

        const expectedD = 25.4 / Math.sin(Math.PI / 38);
        expect(specs.pitchDiameter).toBeCloseTo(expectedD, 3);
        expect(specs.rootDiameter).toBeCloseTo(expectedD - 15.88, 3);
        expect(specs.rollerSeatingRadius).toBeCloseTo(0.505 * 15.88, 3);
        expect(specs.flankRadius).toBeCloseTo(0.12 * 15.88 * (38 + 2), 3);
    });

    it('generates a closed, valid sprocket contour without any NaN or Inf coordinates', () => {
        const points = generateSprocketContour({
            teeth: 19,
            pitch: 12.7,
            center: { x: 0, y: 0 },
        });

        expect(points.length).toBeGreaterThanOrEqual(19 * 6);

        // Every coordinate must be finite number
        for (const pt of points) {
            expect(Number.isFinite(pt.x)).toBe(true);
            expect(Number.isFinite(pt.y)).toBe(true);
            expect(Number.isNaN(pt.x)).toBe(false);
            expect(Number.isNaN(pt.y)).toBe(false);

            // Coordinates must lie within safe bounding cylinder
            const dist = Math.sqrt(pt.x * pt.x + pt.y * pt.y);
            expect(dist).toBeGreaterThan(10); // larger than root
            expect(dist).toBeLessThan(100);   // smaller than envelope
        }
    });

    it('exports production-grade 1:1 metric SVG with CAM layers for sprockets', () => {
        const result = generateProductionSprocketSvg({
            teeth: 21,
            pitch: 12.7,
            boreDiameter: 25,
            hasKeyway: true,
        });

        expect(result.svgString).toContain('width="');
        expect(result.svgString).toContain('mm"');
        expect(result.svgString).toContain('height="');
        expect(result.svgString).toContain('id="OUTER_CUT"');
        expect(result.svgString).toContain('id="INNER_CUTS"');
        expect(result.svgString).toContain('id="REFERENCE"');
        expect(result.svgString).toContain('id="CENTER"');
        expect(result.svgString).toContain('ISO 606 / DIN 8187');
        expect(result.svgString).toContain('data-scale="1.0000"');
        expect(result.outerContourPoints.length).toBeGreaterThan(100);
        expect(result.innerCutPoints.length).toBeGreaterThan(10);
    });

    it('exports production-grade AutoCAD R12 DXF for sprockets', () => {
        const dxf = generateProductionSprocketDxf({
            teeth: 21,
            pitch: 12.7,
            boreDiameter: 20,
            hasKeyway: true,
        });

        expect(dxf).toContain('SECTION');
        expect(dxf).toContain('HEADER');
        expect(dxf).toContain('$ACADVER');
        expect(dxf).toContain('AC1009');
        expect(dxf).toContain('$MEASUREMENT');
        expect(dxf).toContain('OUTER_CUT');
        expect(dxf).toContain('INNER_CUTS');
        expect(dxf).toContain('POLYLINE');
        expect(dxf).toContain('VERTEX');
        expect(dxf).toContain('SEQEND');
        expect(dxf).toContain('EOF');
    });
});

describe('ISO 13050 & ISO 4183 Pulley Geometry Engine', () => {
    it('calculates ISO 13050 HTD 5M timing pulley specs with Pitch Line Differential (PLD)', () => {
        const specs = calculatePulleySpecs({
            type: 'timing-htd',
            pitch: 5,
            teeth: 36,
        });

        // Pitch diameter: d = (36 * 5) / pi = 57.2958 mm
        const expectedPitch = (36 * 5) / Math.PI;
        expect(specs.pitchDiameter).toBeCloseTo(expectedPitch, 3);

        // HTD 5M PLD: 2 * U = 2 * 0.57 = 1.14 mm
        // Outside diameter da = pitchDiameter - 1.14
        expect(specs.outsideDiameter).toBeCloseTo(expectedPitch - 1.14, 3);
        expect(specs.teeth).toBe(36);
        expect(specs.pitch).toBe(5);
        expect(specs.pld).toBeCloseTo(0.57, 2);
    });

    it('calculates ISO 13050 HTD 8M heavy timing pulley specs', () => {
        const specs = calculatePulleySpecs({
            type: 'timing-htd',
            pitch: 8,
            teeth: 48,
        });

        const expectedPitch = (48 * 8) / Math.PI;
        expect(specs.pitchDiameter).toBeCloseTo(expectedPitch, 3);
        // HTD 8M 2*U = 2 * 0.686 = 1.372 mm
        expect(specs.outsideDiameter).toBeCloseTo(expectedPitch - 1.372, 3);
    });

    it('calculates ISO 4183 V-belt pulley specs', () => {
        const specs = calculatePulleySpecs({
            type: 'v-belt',
            datumDiameter: 200,
            outsideDiameter: 207,
        });

        expect(specs.pitchDiameter).toBeCloseTo(200, 3);
        expect(specs.outsideDiameter).toBeCloseTo(207.0, 3);
    });

    it('generates a closed, continuous curvilinear timing pulley contour', () => {
        const points = generateTimingPulleyContour({
            type: 'timing-htd',
            pitch: 5,
            teeth: 24,
            center: { x: 0, y: 0 },
        });

        expect(points.length).toBeGreaterThanOrEqual(24 * 6);

        for (const pt of points) {
            expect(Number.isFinite(pt.x)).toBe(true);
            expect(Number.isFinite(pt.y)).toBe(true);
            expect(Number.isNaN(pt.x)).toBe(false);
            expect(Number.isNaN(pt.y)).toBe(false);
        }
    });

    it('exports production 1:1 SVG and DXF for timing pulleys', () => {
        const svgResult = generateProductionPulleySvg({
            type: 'timing-htd',
            pitch: 5,
            teeth: 30,
            boreDiameter: 16,
            hasKeyway: true,
            hasFlange: true,
        });

        expect(svgResult.svgString).toContain('width="');
        expect(svgResult.svgString).toContain('mm"');
        expect(svgResult.svgString).toContain('id="OUTER_CUT"');
        expect(svgResult.svgString).toContain('id="INNER_CUTS"');
        expect(svgResult.svgString).toContain('id="REFERENCE"');
        expect(svgResult.svgString).toContain('ISO 13050');

        const dxf = generateProductionPulleyDxf({
            type: 'timing-htd',
            pitch: 5,
            teeth: 30,
            boreDiameter: 16,
            hasKeyway: true,
        });

        expect(dxf).toContain('SECTION');
        expect(dxf).toContain('AC1009');
        expect(dxf).toContain('OUTER_CUT');
        expect(dxf).toContain('INNER_CUTS');
        expect(dxf).toContain('EOF');
    });
});

describe('Planetary Gearbox True Involute Kinematic & CAM Integration', () => {
    it('calculates exact planetary kinematic dimensions (zs + 2*zp = zr)', () => {
        const m = 2.5;
        const zs = 18;
        const zp = 18;
        const zr = zs + 2 * zp; // 54

        const sunSpecs = calculateInvoluteGearSpecs({ module: m, teeth: zs });
        const planetSpecs = calculateInvoluteGearSpecs({ module: m, teeth: zp });
        const ringSpecs = calculateInvoluteGearSpecs({ module: m, teeth: zr, isInternal: true });

        // Pitch diameters: d = m * z
        expect(sunSpecs.pitchDiameter).toBeCloseTo(45.0, 3);
        expect(planetSpecs.pitchDiameter).toBeCloseTo(45.0, 3);
        expect(ringSpecs.pitchDiameter).toBeCloseTo(135.0, 3);

        // Center orbit distance: a = (ds + dp) / 2 = (45 + 45) / 2 = 45 mm
        const rOrbit = (sunSpecs.pitchDiameter + planetSpecs.pitchDiameter) / 4;
        expect(rOrbit).toBeCloseTo(22.5, 3);

        // Ring pitch radius: dr / 2 = 135 / 2 = 67.5 mm
        // a + rp = 45 + 22.5 = 67.5 mm (Exact mesh verification!)
        expect(rOrbit * 2 + planetSpecs.pitchRadius).toBeCloseTo(ringSpecs.pitchRadius, 3);

        // For internal ring gear, tip diameter da is SMALLER than pitch diameter
        expect(ringSpecs.outsideDiameter).toBeLessThan(ringSpecs.pitchDiameter);
        // For internal ring gear, root diameter df is LARGER than pitch diameter
        expect(ringSpecs.rootDiameter).toBeGreaterThan(ringSpecs.pitchDiameter);
    });

    it('generates valid closed true involute contours for all planetary members without errors', () => {
        const m = 2.0;
        const zs = 20;
        const zp = 20;
        const zr = 60;

        // Sun gear external contour
        const sunContour = generateExternalGearContour({
            module: m,
            teeth: zs,
            pressureAngle: 20,
            pointsPerFlank: 8,
        });
        expect(sunContour.length).toBeGreaterThan(100);
        for (const pt of sunContour) {
            expect(Number.isFinite(pt.x)).toBe(true);
            expect(Number.isFinite(pt.y)).toBe(true);
        }

        // Planet gear external contour
        const planetContour = generateExternalGearContour({
            module: m,
            teeth: zp,
            pressureAngle: 20,
            pointsPerFlank: 8,
        });
        expect(planetContour.length).toBeGreaterThan(100);
        for (const pt of planetContour) {
            expect(Number.isFinite(pt.x)).toBe(true);
            expect(Number.isFinite(pt.y)).toBe(true);
        }

        // Ring gear internal teeth and outer rim contours
        const ringContour = generateInternalGearContour({
            module: m,
            teeth: zr,
            pressureAngle: 20,
            pointsPerFlank: 8,
            rimThickness: 10,
        });
        expect(ringContour.innerTeethContour.length).toBeGreaterThan(200);
        expect(ringContour.outerRimContour.length).toBeGreaterThan(60);

        for (const pt of ringContour.innerTeethContour) {
            expect(Number.isFinite(pt.x)).toBe(true);
            expect(Number.isFinite(pt.y)).toBe(true);
        }
        for (const pt of ringContour.outerRimContour) {
            expect(Number.isFinite(pt.x)).toBe(true);
            expect(Number.isFinite(pt.y)).toBe(true);
        }
    });

    it('exports 1:1 production CAM SVG and DXF for sun, planet, and internal ring gears', () => {
        const m = 2.0;

        // 1. Sun gear 1:1 export
        const sunSvg = generateProductionGearSvg({
            module: m,
            teeth: 18,
            pressureAngle: 20,
            hasKeyway: true,
        });
        expect(sunSvg.svgString).toContain('width="');
        expect(sunSvg.svgString).toContain('mm"');
        expect(sunSvg.svgString).toContain('id="OUTER_CUT"');
        expect(sunSvg.svgString).toContain('id="INNER_CUTS"');

        const sunDxf = generateProductionGearDxf({
            module: m,
            teeth: 18,
            pressureAngle: 20,
            hasKeyway: true,
        });
        expect(sunDxf).toContain('OUTER_CUT');
        expect(sunDxf).toContain('INNER_CUTS');

        // 2. Planet gear 1:1 export
        const planetSvg = generateProductionGearSvg({
            module: m,
            teeth: 18,
            pressureAngle: 20,
            hasKeyway: false,
            boreDiameter: 12,
        });
        expect(planetSvg.svgString).toContain('id="OUTER_CUT"');
        expect(planetSvg.svgString).toContain('id="INNER_CUTS"');

        // 3. Ring gear 1:1 internal export
        const ringSvg = generateProductionGearSvg({
            module: m,
            teeth: 54,
            pressureAngle: 20,
            isInternal: true,
            rimThickness: 12,
        });
        expect(ringSvg.svgString).toContain('id="OUTER_CUT"');
        expect(ringSvg.svgString).toContain('id="INNER_CUTS"');

        const ringDxf = generateProductionGearDxf({
            module: m,
            teeth: 54,
            pressureAngle: 20,
            isInternal: true,
            rimThickness: 12,
        });
        expect(ringDxf).toContain('OUTER_CUT');
        expect(ringDxf).toContain('INNER_CUTS');
        expect(ringDxf).toContain('EOF');
    });
});

describe('Analytical Open-Drive Closed Loop & Transmission Section Engine', () => {
    it('creates analytical closed-loop drive geometry with exact continuity and normal vectors', async () => {
        const { createDriveLoop } = await import('@/engines/math/drive-loop-engine');

        const loop = createDriveLoop(100, 200, 40, 500, 200, 80);
        expect(loop).not.toBeNull();
        if (!loop) return;

        expect(loop.totalLength).toBeGreaterThan(800);
        expect(loop.span1Len).toBeCloseTo(loop.span2Len, 3);
        expect(loop.arc1Len + loop.arc2Len).toBeGreaterThan(0);

        // Point at 0 must equal point at totalLength (continuity)
        const ptStart = loop.getPointAt(0);
        const ptEnd = loop.getPointAt(loop.totalLength - 1e-4);
        expect(ptStart.x).toBeCloseTo(ptEnd.x, 1);
        expect(ptStart.y).toBeCloseTo(ptEnd.y, 1);

        // Normal vectors must be unit length
        for (let i = 0; i < 20; i++) {
            const pt = loop.getPointAt(i * (loop.totalLength / 20));
            const normLen = Math.hypot(pt.nx, pt.ny);
            expect(normLen).toBeCloseTo(1.0, 3);
        }

        // Ribbon generation
        const ribbon = loop.getRibbonPath(5, -5, 30);
        expect(ribbon).toContain('M ');
        expect(ribbon).toContain(' L ');
        expect(ribbon).toContain(' Z');
    });

    it('ensures openDriveLayout bounds sprockets strictly within view without overflow', async () => {
        const { openDriveLayout } = await import('@/components/visualizers/techframe-utils');

        // Test with extreme parameters: z1=19, z2=57, pitch=9.525, C=500 in 1040x460 viewport
        const d1 = 57.87;
        const d2 = 172.9;
        const od1 = 62.8;
        const od2 = 178.4;
        const C = 500;
        const W = 1040;
        const H = 460;

        const layout = openDriveLayout(d1, d2, C, W, H, 48, 0.38, od1, od2);
        expect(layout.scale).toBeGreaterThan(0.5);

        // Leftmost tip must not overflow left
        const leftTip = layout.cx1 - (od1 / 2) * layout.scale;
        expect(leftTip).toBeGreaterThanOrEqual(40);

        // Rightmost tip must not overflow right
        const rightTip = layout.cx2 + (od2 / 2) * layout.scale;
        expect(rightTip).toBeLessThanOrEqual(W - 44);

        // Topmost tip must be below top margin (room for toolbar + title)
        const topTip = layout.cy - (od2 / 2) * layout.scale;
        expect(topTip).toBeGreaterThanOrEqual(60);

        // Bottommost tip must fit above bottom edge
        const bottomTip = layout.cy + (od2 / 2) * layout.scale;
        expect(bottomTip).toBeLessThanOrEqual(H - 40);
    });

    it('synchronizes pitch from chainSize in chain-drive schema calculation', async () => {
        const chainDriveSchema = (await import('@/calculators/schemas-v2/chain-drive')).default;
        const { createValidatedValue } = await import('@/types/engineering');

        // When chainSize is '06b' (p = 9.525 mm)
        const inputs = {
            chainSize: createValidatedValue('06b', '-', 'user'),
            z1: createValidatedValue(19, '-', 'user'),
            z2: createValidatedValue(57, '-', 'user'),
            pitch: createValidatedValue(15.875, 'mm', 'user'), // mismatched pitch input
            centerDist: createValidatedValue(500, 'mm', 'user'),
            rpm1: createValidatedValue(1450, 'RPM' as any, 'user'),
            power: createValidatedValue(5, 'kW', 'user'),
            serviceFactor: createValidatedValue(1.3, '-', 'user'),
        };

        const result = chainDriveSchema.calculationEngine(inputs);
        // d1 must be computed with p = 9.525 mm: 9.525 / sin(pi/19) ~ 57.87 mm
        expect(result.outputs.d1.value).toBeCloseTo(57.87, 1);
        // d2 must be computed with p = 9.525 mm: 9.525 / sin(pi/57) ~ 172.9 mm
        expect(result.outputs.d2.value).toBeCloseTo(172.9, 1);
    });

    it('flags impossible belt geometry as critical warnings', async () => {
        const beltDriveSchema = (await import('@/calculators/schemas-v2/belt-drive')).default;
        const { createValidatedValue } = await import('@/types/engineering');
        const result = beltDriveSchema.calculationEngine({
            rpm1: createValidatedValue(0, 'RPM' as any, 'user'),
            d1: createValidatedValue(0, 'mm', 'user'),
            d2: createValidatedValue(250, 'mm', 'user'),
            z1: createValidatedValue(30, '-', 'user'),
            z2: createValidatedValue(60, '-', 'user'),
            centerDist: createValidatedValue(50, 'mm', 'user'),
            power: createValidatedValue(5, 'kW', 'user'),
            serviceFactor: createValidatedValue(1.25, '-', 'user'),
            friction: createValidatedValue(0.3, '-', 'user'),
            beltType: createValidatedValue('classical-v', '-', 'user'),
            beltProfile: createValidatedValue('a', '-', 'user'),
        });
        const messages = result.warnings.map((w) => w.message + '|' + w.severity);
        expect(messages.some((m) => m.includes('Pulley diameters must be positive') && m.includes('critical'))).toBe(true);
        expect(messages.some((m) => m.includes('Input speed must be positive') && m.includes('critical'))).toBe(true);
        expect(messages.some((m) => m.includes('physically impossible') && m.includes('critical'))).toBe(true);
        expect(messages.some((m) => m.includes('Belt velocity is zero') && m.includes('critical'))).toBe(true);
    });

    it('flags extreme belt ratio and timing chordal action', async () => {
        const beltDriveSchema = (await import('@/calculators/schemas-v2/belt-drive')).default;
        const { createValidatedValue } = await import('@/types/engineering');
        const result = beltDriveSchema.calculationEngine({
            rpm1: createValidatedValue(1450, 'RPM' as any, 'user'),
            d1: createValidatedValue(50, 'mm', 'user'),
            d2: createValidatedValue(500, 'mm', 'user'),
            z1: createValidatedValue(10, '-', 'user'),
            z2: createValidatedValue(100, '-', 'user'),
            centerDist: createValidatedValue(800, 'mm', 'user'),
            power: createValidatedValue(5, 'kW', 'user'),
            serviceFactor: createValidatedValue(1.25, '-', 'user'),
            friction: createValidatedValue(0.3, '-', 'user'),
            beltType: createValidatedValue('timing', '-', 'user'),
            beltProfile: createValidatedValue('htd-8m', '-', 'user'),
        });
        const messages = result.warnings.map((w) => w.message);
        expect(messages.some((m) => m.includes('exceeds practical 8:1'))).toBe(true);
        expect(messages.some((m) => m.includes('< 12 teeth'))).toBe(true);
    });

    it('flags impossible chain geometry as critical warnings', async () => {
        const chainDriveSchema = (await import('@/calculators/schemas-v2/chain-drive')).default;
        const { createValidatedValue } = await import('@/types/engineering');
        const result = chainDriveSchema.calculationEngine({
            chainType: createValidatedValue('roller-simplex', '-', 'user'),
            chainSize: createValidatedValue('10b', '-', 'user'),
            z1: createValidatedValue(5, '-', 'user'),
            z2: createValidatedValue(130, '-', 'user'),
            pitch: createValidatedValue(15.875, 'mm', 'user'),
            centerDist: createValidatedValue(20, 'mm', 'user'),
            rpm1: createValidatedValue(0, 'RPM' as any, 'user'),
            power: createValidatedValue(0, 'kW', 'user'),
            serviceFactor: createValidatedValue(1.3, '-', 'user'),
        });
        const byField = Object.fromEntries(result.warnings.map((w) => [w.field + ':' + w.severity, w.message]));
        expect(result.warnings.some((w) => w.field === 'z1' && w.severity === 'critical')).toBe(true);
        expect(result.warnings.some((w) => w.field === 'z2' && w.message.includes('exceeds practical maximum 120'))).toBe(true);
        expect(result.warnings.some((w) => w.field === 'centerDist' && w.severity === 'critical')).toBe(true);
        expect(result.warnings.some((w) => w.field === 'rpm1' && w.severity === 'critical')).toBe(true);
        expect(result.warnings.some((w) => w.field === 'power' && w.severity === 'critical')).toBe(true);
        expect(byField['z2:warning']).toBeDefined();
    });
});
