import { describe, it, expect } from 'vitest';
import {
    calculateInvoluteGearSpecs,
    generateExternalGearContour,
    generateInternalGearContour,
    generateBoreAndKeywayContour,
    generateProductionGearSvg,
    generateProductionGearDxf,
    getDin6885Keyway,
    validateAndCleanContour,
    helixFaceTwistDeg,
} from '@/engines/math/gear-involute-factory';

describe('Gear Involute Production Engine', () => {
    it('calculates ISO 53 / DIN 3960 geometric dimensions accurately', () => {
        // Standard gear: m = 2.0 mm, z = 20, alpha = 20 deg, x = 0
        const specs = calculateInvoluteGearSpecs({
            module: 2,
            teeth: 20,
            pressureAngle: 20,
            profileShift: 0,
        });

        // d = m * z = 40 mm
        expect(specs.pitchDiameter).toBeCloseTo(40.0, 3);
        // db = d * cos(20 deg) = 40 * 0.93969 = 37.588 mm
        expect(specs.baseDiameter).toBeCloseTo(40 * Math.cos(20 * Math.PI / 180), 3);
        // da = d + 2*m*(1+x) = 40 + 4 = 44 mm
        expect(specs.outsideDiameter).toBeCloseTo(44.0, 3);
        // df = d - 2*m*(1.25-x) = 40 - 5 = 35 mm
        expect(specs.rootDiameter).toBeCloseTo(35.0, 3);
        // Circular pitch p = pi * m = 6.283 mm
        expect(specs.circularPitch).toBeCloseTo(Math.PI * 2, 3);
        // Tooth thickness s = pi * m / 2 = 3.142 mm
        expect(specs.toothThicknessArc).toBeCloseTo(Math.PI, 3);
    });

    it('calculates profile-shifted gear dimensions accurately', () => {
        // Shifted gear: m = 3.0 mm, z = 15, alpha = 20 deg, x = +0.4
        const specs = calculateInvoluteGearSpecs({
            module: 3,
            teeth: 15,
            pressureAngle: 20,
            profileShift: 0.4,
        });

        expect(specs.pitchDiameter).toBeCloseTo(45.0, 3);
        // da = 45 + 2 * 3 * (1 + 0.4) = 45 + 8.4 = 53.4 mm
        expect(specs.outsideDiameter).toBeCloseTo(53.4, 3);
        // df = 45 - 2 * 3 * (1.25 - 0.4) = 45 - 5.1 = 39.9 mm
        expect(specs.rootDiameter).toBeCloseTo(39.9, 3);
        // s = 3 * (pi/2 + 2 * 0.4 * tan(20 deg))
        const expectedS = 3 * (Math.PI / 2 + 0.8 * Math.tan(20 * Math.PI / 180));
        expect(specs.toothThicknessArc).toBeCloseTo(expectedS, 3);
    });

    it('generates a valid, closed external gear contour with zero NaN or Infinity values', () => {
        const points = generateExternalGearContour({
            module: 2.5,
            teeth: 18,
            pressureAngle: 20,
            profileShift: 0.1,
            pointsPerFlank: 10,
        });

        expect(points.length).toBeGreaterThan(100);

        for (const p of points) {
            expect(Number.isFinite(p.x)).toBe(true);
            expect(Number.isFinite(p.y)).toBe(true);
            expect(isNaN(p.x)).toBe(false);
            expect(isNaN(p.y)).toBe(false);
        }

        // Distance from center should stay between root radius and tip radius (with small fillet tolerance)
        const specs = calculateInvoluteGearSpecs({ module: 2.5, teeth: 18, profileShift: 0.1 });
        for (const p of points) {
            const dist = Math.sqrt(p.x * p.x + p.y * p.y);
            expect(dist).toBeGreaterThanOrEqual(specs.rootRadius * 0.95);
            expect(dist).toBeLessThanOrEqual(specs.outsideRadius * 1.02);
        }
    });

    it('generates valid internal ring gear contours', () => {
        const { innerTeethContour, outerRimContour } = generateInternalGearContour({
            module: 2,
            teeth: 60,
            pressureAngle: 20,
            isInternal: true,
        });

        expect(innerTeethContour.length).toBeGreaterThan(100);
        expect(outerRimContour.length).toBeGreaterThan(50);

        for (const p of innerTeethContour) {
            expect(Number.isFinite(p.x)).toBe(true);
            expect(Number.isFinite(p.y)).toBe(true);
        }
        for (const p of outerRimContour) {
            expect(Number.isFinite(p.x)).toBe(true);
            expect(Number.isFinite(p.y)).toBe(true);
        }
    });

    it('generates standard DIN 6885-1 keyways for various bore diameters', () => {
        expect(getDin6885Keyway(14).width).toBe(5);
        expect(getDin6885Keyway(14).depth).toBe(3.0);

        expect(getDin6885Keyway(25).width).toBe(8);
        expect(getDin6885Keyway(25).depth).toBe(4.0);

        expect(getDin6885Keyway(32).width).toBe(10);
        expect(getDin6885Keyway(32).depth).toBe(5.0);

        const borePoints = generateBoreAndKeywayContour(
            { x: 0, y: 0 },
            25,
            true,
            getDin6885Keyway(25)
        );
        expect(borePoints.length).toBeGreaterThan(30);
        for (const p of borePoints) {
            expect(Number.isFinite(p.x)).toBe(true);
            expect(Number.isFinite(p.y)).toBe(true);
        }
    });

    it('generates a 1:1 metric SVG with CAM layers, mm units, and exact scale', () => {
        const res = generateProductionGearSvg({
            module: 3,
            teeth: 24,
            pressureAngle: 20,
            boreDiameter: 25,
            hasKeyway: true,
        });

        // Verify millimeter units in SVG tag
        expect(res.svgString).toContain(`width="${res.widthMm}mm"`);
        expect(res.svgString).toContain(`height="${res.heightMm}mm"`);
        expect(res.svgString).toContain(`viewBox="${res.viewBox}"`);

        // Verify CAM layer separation
        expect(res.svgString).toContain('id="OUTER_CUT"');
        expect(res.svgString).toContain('id="INNER_CUTS"');
        expect(res.svgString).toContain('id="ENGRAVE_MARKING"');
        expect(res.svgString).toContain('id="CENTER_AXIS"');

        // Check specs
        expect(res.specs.pitchDiameter).toBe(72.0);
        expect(res.specs.outsideDiameter).toBe(78.0);
        expect(res.specs.rootDiameter).toBe(64.5);
    });

    it('generates a valid AutoCAD DXF file with closed polylines', () => {
        const dxf = generateProductionGearDxf({
            module: 2,
            teeth: 18,
            pressureAngle: 20,
            boreDiameter: 15,
            hasKeyway: true,
        });

        expect(dxf).toContain('SECTION');
        expect(dxf).toContain('HEADER');
        expect(dxf).toContain('ENTITIES');
        expect(dxf).toContain('POLYLINE');
        expect(dxf).toContain('OUTER_CUT');
        expect(dxf).toContain('INNER_CUTS');
        expect(dxf).toContain('PITCH_CIRCLE');
        expect(dxf).toContain('EOF');
    });

    // ============================================
    // NEW TESTS: Geometric Invariants & Edge Cases
    // ============================================

    it('contour closure: first and last points are within tolerance', () => {
        const points = generateExternalGearContour({
            module: 2,
            teeth: 20,
            pressureAngle: 20,
        });

        expect(points.length).toBeGreaterThan(50);

        const first = points[0];
        const last = points[points.length - 1];
        const closeDist = Math.sqrt(
            (last.x - first.x) ** 2 + (last.y - first.y) ** 2
        );

        // Contour should be close enough for SVG Z command to close cleanly
        expect(closeDist).toBeLessThan(5.0);
    });

    it('involute flank: radii span from root to tip correctly', () => {
        const specs = calculateInvoluteGearSpecs({ module: 3, teeth: 20, pressureAngle: 20 });
        const points = generateExternalGearContour({
            module: 3,
            teeth: 20,
            pressureAngle: 20,
            pointsPerFlank: 20,
        });

        const radii = points.map(p => Math.sqrt(p.x * p.x + p.y * p.y));

        const minR = Math.min(...radii);
        const maxR = Math.max(...radii);

        expect(minR).toBeCloseTo(specs.rootRadius, 0);
        expect(maxR).toBeCloseTo(specs.outsideRadius, 0);
    });

    it('teeth are evenly distributed: tip points span all quadrants', () => {
        const z = 16;
        const points = generateExternalGearContour({
            module: 2,
            teeth: z,
            pressureAngle: 20,
            pointsPerFlank: 8,
        });

        const specs = calculateInvoluteGearSpecs({ module: 2, teeth: z });
        const tipTolerance = specs.outsideRadius * 0.005;
        const tipPoints = points.filter(p => {
            const dist = Math.sqrt(p.x * p.x + p.y * p.y);
            return Math.abs(dist - specs.outsideRadius) < tipTolerance;
        });

        // We should have at least z tip regions
        expect(tipPoints.length).toBeGreaterThanOrEqual(z);
    });

    it('small tooth count (z=7): contour is valid without NaN', () => {
        const points = generateExternalGearContour({
            module: 4,
            teeth: 7,
            pressureAngle: 20,
            profileShift: 0.3,
            pointsPerFlank: 10,
        });

        expect(points.length).toBeGreaterThan(50);

        for (const p of points) {
            expect(Number.isFinite(p.x)).toBe(true);
            expect(Number.isFinite(p.y)).toBe(true);
        }

        const specs = calculateInvoluteGearSpecs({ module: 4, teeth: 7, profileShift: 0.3 });
        for (const p of points) {
            const dist = Math.sqrt(p.x * p.x + p.y * p.y);
            expect(dist).toBeGreaterThanOrEqual(specs.rootRadius * 0.90);
            expect(dist).toBeLessThanOrEqual(specs.outsideRadius * 1.05);
        }
    });

    it('large tooth count (z=80): contour scales correctly', () => {
        const points = generateExternalGearContour({
            module: 1.5,
            teeth: 80,
            pressureAngle: 20,
            pointsPerFlank: 8,
        });

        expect(points.length).toBeGreaterThan(500);

        const specs = calculateInvoluteGearSpecs({ module: 1.5, teeth: 80 });
        expect(specs.pitchDiameter).toBeCloseTo(120, 2);

        for (const p of points) {
            expect(Number.isFinite(p.x)).toBe(true);
            expect(Number.isFinite(p.y)).toBe(true);
        }
    });

    it('negative profile shift (x=-0.3): contour integrity maintained', () => {
        const points = generateExternalGearContour({
            module: 2.5,
            teeth: 25,
            pressureAngle: 20,
            profileShift: -0.3,
            pointsPerFlank: 10,
        });

        expect(points.length).toBeGreaterThan(100);

        const specs = calculateInvoluteGearSpecs({ module: 2.5, teeth: 25, profileShift: -0.3 });
        expect(specs.outsideDiameter).toBeCloseTo(66.0, 2);
        expect(specs.rootDiameter).toBeCloseTo(54.75, 2);

        for (const p of points) {
            expect(Number.isFinite(p.x)).toBe(true);
            const dist = Math.sqrt(p.x * p.x + p.y * p.y);
            expect(dist).toBeGreaterThanOrEqual(specs.rootRadius * 0.93);
            expect(dist).toBeLessThanOrEqual(specs.outsideRadius * 1.03);
        }
    });

    it('high positive profile shift (x=+0.8): contour integrity maintained', () => {
        const points = generateExternalGearContour({
            module: 2,
            teeth: 12,
            pressureAngle: 20,
            profileShift: 0.8,
            pointsPerFlank: 12,
        });

        expect(points.length).toBeGreaterThan(50);

        const specs = calculateInvoluteGearSpecs({ module: 2, teeth: 12, profileShift: 0.8 });

        for (const p of points) {
            expect(Number.isFinite(p.x)).toBe(true);
            expect(Number.isFinite(p.y)).toBe(true);
            const dist = Math.sqrt(p.x * p.x + p.y * p.y);
            expect(dist).toBeGreaterThanOrEqual(specs.rootRadius * 0.90);
            expect(dist).toBeLessThanOrEqual(specs.outsideRadius * 1.05);
        }
    });

    it('helical gear (beta=15 deg): transverse module and diameters are correct', () => {
        const mn = 2;
        const beta = 15;
        const z = 24;
        const specs = calculateInvoluteGearSpecs({
            module: mn,
            teeth: z,
            pressureAngle: 20,
            helixAngle: beta,
        });

        // DIN 3960: d = mt * z, da = d + 2 * mn * (1 + x)
        const mt = mn / Math.cos(beta * Math.PI / 180);
        expect(specs.pitchDiameter).toBeCloseTo(mt * z, 2);
        // Addendum uses normal module, not transverse: da = mt*z + 2*mn
        expect(specs.outsideDiameter).toBeCloseTo(mt * z + 2 * mn, 2);
    });

    it('validateAndCleanContour removes duplicates and NaN values', () => {
        const raw = [
            { x: 0, y: 0 },
            { x: 0.0001, y: 0.0001 },
            { x: 1, y: 0 },
            { x: NaN, y: 5 },
            { x: 2, y: 0 },
            { x: Infinity, y: 0 },
            { x: 3, y: 0 },
        ];

        const cleaned = validateAndCleanContour(raw);

        expect(cleaned.length).toBe(4);
        expect(cleaned[0]).toEqual({ x: 0, y: 0 });
        expect(cleaned[1]).toEqual({ x: 1, y: 0 });
        expect(cleaned[2]).toEqual({ x: 2, y: 0 });
        expect(cleaned[3]).toEqual({ x: 3, y: 0 });
    });

    it('DXF contains $MEASUREMENT metric header', () => {
        const dxf = generateProductionGearDxf({
            module: 2,
            teeth: 20,
            pressureAngle: 20,
        });

        expect(dxf).toContain('$MEASUREMENT');
        expect(dxf).toContain('$INSUNITS');
    });

    it('SVG path uses 4-decimal precision for CNC accuracy', () => {
        const res = generateProductionGearSvg({
            module: 5,
            teeth: 10,
            pressureAngle: 20,
        });

        const fourDecimalPattern = /[ML]\s+-?\d+\.\d{4}\s+-?\d+\.\d{4}/;
        expect(fourDecimalPattern.test(res.svgString)).toBe(true);
    });

    it('helical gear with beta=22 deg generates true transverse involute profile', () => {
        const mn = 3;
        const z = 20;
        const beta = 22;
        const specs = calculateInvoluteGearSpecs({
            module: mn,
            teeth: z,
            pressureAngle: 20,
            helixAngle: beta,
            profileShift: 0,
        });

        const mt = mn / Math.cos((beta * Math.PI) / 180);
        expect(specs.transverseModule).toBeCloseTo(mt, 3);
        expect(specs.pitchDiameter).toBeCloseTo(mt * z, 2);

        // Transverse pressure angle: alpha_t = atan(tan(20) / cos(22))
        const expectedAlphaT = Math.atan(Math.tan((20 * Math.PI) / 180) / Math.cos((beta * Math.PI) / 180));
        expect(specs.transversePressureAngleRad).toBeCloseTo(expectedAlphaT, 4);

        // Contour generation must produce valid finite points
        const points = generateExternalGearContour({
            module: mn,
            teeth: z,
            pressureAngle: 20,
            helixAngle: beta,
            profileShift: 0,
        });

        expect(points.length).toBeGreaterThan(100);
        for (const p of points) {
            expect(Number.isFinite(p.x)).toBe(true);
            expect(Number.isFinite(p.y)).toBe(true);
        }
    });

    it('profile shift x=1.5 (maximum allowed) generates valid contour within bounds', () => {
        const specs = calculateInvoluteGearSpecs({
            module: 3,
            teeth: 25,
            pressureAngle: 20,
            profileShift: 1.5,
        });

        // da = d + 2 * m * (1 + x) = 75 + 2 * 3 * 2.5 = 90
        expect(specs.outsideDiameter).toBeCloseTo(90.0, 2);

        const points = generateExternalGearContour({
            module: 3,
            teeth: 25,
            pressureAngle: 20,
            profileShift: 1.5,
        });

        expect(points.length).toBeGreaterThan(100);
        for (const p of points) {
            expect(Number.isFinite(p.x)).toBe(true);
            expect(Number.isFinite(p.y)).toBe(true);
            const dist = Math.hypot(p.x, p.y);
            expect(dist).toBeLessThanOrEqual(specs.outsideRadius * 1.02);
            expect(dist).toBeGreaterThanOrEqual(specs.rootRadius * 0.90);
        }
    });

    it('helical profile-shift tooth thickness uses s_n / cos(β), not the double helix correction', () => {
        const mn = 3;
        const x = 0.4;
        const beta = 15;
        const alphaN = 20 * Math.PI / 180;
        const cosBeta = Math.cos(beta * Math.PI / 180);
        const specs = calculateInvoluteGearSpecs({
            module: mn,
            teeth: 20,
            pressureAngle: 20,
            helixAngle: beta,
            profileShift: x,
        });
        const expectedS = (Math.PI * mn) / (2 * cosBeta) + (2 * x * mn * Math.tan(alphaN)) / cosBeta;
        expect(specs.toothThicknessArc).toBeCloseTo(expectedS, 6);
        const wrongDoubleHelix = specs.transverseModule * (Math.PI / 2 + 2 * x * Math.tan(specs.transversePressureAngleRad));
        expect(specs.toothThicknessArc).toBeLessThan(wrongDoubleHelix - 1e-6);
    });

    it('helical production SVG title block includes β, mt and αt', () => {
        const res = generateProductionGearSvg({
            module: 3,
            teeth: 20,
            pressureAngle: 20,
            helixAngle: 15,
            faceWidth: 40,
        });
        expect(res.svgString).toContain('β = 15.00° RH');
        expect(res.svgString).toContain('mt = mn/cos(β)');
        expect(res.svgString).toContain('αt = atan(tan(αn)/cos(β))');
        expect(res.svgString).toContain('TRANSVERSE SECTION');
        expect(res.svgString).toContain('HELIX_BACK_FACE');
        expect(res.svgString).toContain('Helical Gear');
        expect(res.svgString).toContain('id="HELIX_DEVELOPMENT"');
    });

    it('driven LH helical SVG uses negative β and opposite back-face twist', () => {
        const rh = generateProductionGearSvg({
            module: 3, teeth: 20, pressureAngle: 20, helixAngle: 15, faceWidth: 40,
        });
        const lh = generateProductionGearSvg({
            module: 3, teeth: 60, pressureAngle: 20, helixAngle: -15, faceWidth: 40,
        });
        expect(lh.svgString).toContain('LH');
        expect(lh.svgString).toContain('β = 15.00° LH');
        expect(rh.svgString).toContain('RH');
        const specs = calculateInvoluteGearSpecs({ module: 3, teeth: 20, helixAngle: 15 });
        expect(helixFaceTwistDeg(15, 40, specs.pitchRadius)).toBeGreaterThan(0);
        expect(helixFaceTwistDeg(-15, 40, specs.pitchRadius)).toBeLessThan(0);
    });

    it('helical production DXF annotates transverse section and hobbing requirement', () => {
        const dxf = generateProductionGearDxf({
            module: 3,
            teeth: 20,
            pressureAngle: 20,
            helixAngle: 15,
        });
        expect(dxf).toContain('ANNOTATION');
        expect(dxf).toContain('TRANSVERSE SECTION');
        expect(dxf).toContain('HELICAL GEAR');
        expect(dxf).toContain('Hobbing / 4-axis Wire EDM required');
        expect(dxf).toContain('RH');
        expect(dxf).not.toContain(' LH');
    });
});

