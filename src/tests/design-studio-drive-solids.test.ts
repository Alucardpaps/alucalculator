import { describe, it, expect } from 'vitest';
import { createCustomGeometry } from '@/design-studio/geometryFactory';
import type { DesignPart } from '@/design-studio/designStore';
import { calculateInvoluteGearSpecs } from '@/engines/math/gear-involute-factory';
import { calculateSprocketSpecs } from '@/engines/math/sprocket-geometry-factory';
import { CrossModuleBridge } from '@/system/crossModuleBridge';
import { generateOpenDriveLayoutSvg } from '@/engines/math/drive-loop-engine';
import { useDesignStore } from '@/design-studio/designStore';

function basePart(over: Partial<DesignPart> & { params: Record<string, unknown> }): DesignPart {
    return {
        id: over.id || 'p1',
        kind: over.kind || 'gear-blank',
        name: over.name || 'part',
        color: '#22d3ee',
        visible: true,
        locked: false,
        parentId: null,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        ...over,
    };
}

describe('Design Studio manufacturing solids', () => {
    it('extrudes a true involute gear whose bounding radius matches da/2 (not a trapezoid blank)', () => {
        const params = { module: 3, teeth: 20, pressureAngle: 20, helixAngle: 0, profileShift: 0.2, bore: 16, depth: 25 };
        const specs = calculateInvoluteGearSpecs({
            module: params.module,
            teeth: params.teeth,
            pressureAngle: params.pressureAngle,
            profileShift: params.profileShift,
        });
        const geom = createCustomGeometry(basePart({
            kind: 'gear-blank',
            params: { ...params, hasKeyway: true },
        }));
        geom.computeBoundingBox();
        const bb = geom.boundingBox!;
        const rMax = Math.max(Math.abs(bb.max.x), Math.abs(bb.max.y), Math.abs(bb.min.x), Math.abs(bb.min.y));
        const expectedR = specs.outsideRadius / 10;
        expect(rMax).toBeCloseTo(expectedR, 1);
        expect(geom.attributes.position.count).toBeGreaterThan(20 * 6 * 2);
    });

    it('builds an ISO 606 sprocket from pitch/roller, not from an involute module', () => {
        const specs = calculateSprocketSpecs({ teeth: 19, pitch: 15.875, rollerDiameter: 10.16 });
        const geom = createCustomGeometry(basePart({
            kind: 'gear-blank',
            params: {
                form: 'sprocket',
                sprocketPitch: 15.875,
                teeth: 19,
                rollerDiameter: 10.16,
                depth: 10,
                bore: specs.boreDiameter,
                hasKeyway: true,
            },
        }));
        geom.computeBoundingBox();
        const bb = geom.boundingBox!;
        const rMax = Math.max(Math.abs(bb.max.x), Math.abs(bb.max.y), Math.abs(bb.min.x), Math.abs(bb.min.y));
        expect(rMax).toBeCloseTo(specs.outsideRadius / 10, 1);
        expect(geom.attributes.position.count).toBeGreaterThan(19 * 8);
    });

    it('stores DIN 3960 pitch/tip diameters on helical pair export (mt·z, not m·z)', () => {
        CrossModuleBridge.exportGearsTo3D([
            { name: 'P', teeth: 20, module: 3, faceWidth: 40, helixAngle: 15, pressureAngle: 20, profileShift: 0 },
            { name: 'G', teeth: 60, module: 3, faceWidth: 40, helixAngle: 15, pressureAngle: 20, profileShift: 0 },
        ], { centerDistance: 124.2 });
        const parts = useDesignStore.getState().parts;
        const mt = 3 / Math.cos((15 * Math.PI) / 180);
        expect(parts[0].params.transverseModule).toBeCloseTo(mt, 4);
        expect(parts[0].params.pitchDiameter).toBeCloseTo(mt * 20, 3);
        expect(parts[0].params.tipDiameter).toBeCloseTo(mt * 20 + 2 * 3, 3);
        expect(parts[0].params.profileShift).toBe(0);
        expect(parts[1].params.helixAngle).toBe(-15);
    });

    it('marks chain export as ISO 606 sprocket form with factory pitch diameter', () => {
        CrossModuleBridge.exportChainDriveTo3D(19, 57, 15.875, 500, { rollerDiameter: 10.16 });
        const parts = useDesignStore.getState().parts;
        expect(parts[0].params.form).toBe('sprocket');
        expect(parts[0].params.sprocketPitch).toBe(15.875);
        const dp = 15.875 / Math.sin(Math.PI / 19);
        expect(parts[0].params.pitchDiameter).toBeCloseTo(dp, 3);
    });

    it('writes a 1:1 open-drive layout SVG with both pitch diameters and C', () => {
        const svg = generateOpenDriveLayoutSvg({
            kind: 'belt',
            d1: 100,
            d2: 250,
            C: 500,
            title: 'Open belt drive',
        });
        expect(svg).toContain('width="');
        expect(svg).toContain('mm"');
        expect(svg).toContain('d1=100.00');
        expect(svg).toContain('d2=250.00');
        expect(svg).toContain('C=500.00 mm');
    });

    it('builds a 3D parametric gear rack with DIN 867 trapezoidal teeth', () => {
        const geom = createCustomGeometry(basePart({
            kind: 'gear-blank',
            params: {
                form: 'rack',
                module: 2.5,
                rackPitchHeight: 25,
                length: 200,
                depth: 20,
            },
        }));
        geom.computeBoundingBox();
        const bb = geom.boundingBox!;
        expect(bb).toBeDefined();
        // Bounding box in X should span approximately length / CAD_MM = 200 / 10 = 20
        expect(bb.max.x - bb.min.x).toBeGreaterThan(19);
        expect(bb.max.x - bb.min.x).toBeLessThan(21);
        expect(geom.attributes.position.count).toBeGreaterThan(50);
    });

    it('builds a 3D Gleason straight bevel gear with conical taper', () => {
        const geom = createCustomGeometry(basePart({
            kind: 'gear-blank',
            params: {
                form: 'bevel',
                module: 3,
                teeth: 20,
                coneDistance: 67.08,
                pitchConeAngle: 26.57,
                faceWidth: 22,
                depth: 22,
                bore: 15,
                hasKeyway: true,
            },
        }));
        geom.computeBoundingBox();
        const bb = geom.boundingBox!;
        expect(bb).toBeDefined();
        expect(geom.attributes.position.count).toBeGreaterThan(100);
    });

    it('builds a 3D worm screw with helical lead flight', () => {
        const geom = createCustomGeometry(basePart({
            kind: 'gear-blank',
            params: {
                form: 'worm',
                axialModule: 2,
                wormStarts: 2,
                diameterFactorQ: 10,
                pitchDiameter: 20,
                tipDiameter: 24,
                rootDiameter: 15.2,
                length: 60,
                leadAngleDeg: 11.31,
                depth: 60,
            },
        }));
        geom.computeBoundingBox();
        const bb = geom.boundingBox!;
        expect(bb).toBeDefined();
        // Length / CAD_MM = 60 / 10 = 6
        expect(bb.max.y - bb.min.y).toBeCloseTo(6, 1);
        expect(geom.attributes.position.count).toBeGreaterThan(100);
    });

    it('builds a 3D globoid worm wheel with concave throat depression', () => {
        const geom = createCustomGeometry(basePart({
            kind: 'gear-blank',
            params: {
                form: 'worm-wheel',
                axialModule: 2,
                wheelTeeth: 40,
                throatDiameter: 84,
                rootDiameter: 75.2,
                throatRadius: 10,
                faceWidth: 16,
                depth: 16,
            },
        }));
        geom.computeBoundingBox();
        const bb = geom.boundingBox!;
        expect(bb).toBeDefined();
        expect(geom.attributes.position.count).toBeGreaterThan(100);
    });
});
