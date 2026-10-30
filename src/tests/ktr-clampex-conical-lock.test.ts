/**
 * 🔒 KTR CLAMPEX® Conical Clamping Sets & Dynamic Involute Gear Test Suite
 * 
 * Verifies:
 * - KTR CLAMPEX® ISO/DIN standard datasets (KTR 100, KTR 200, KTR 250, KTR 400)
 * - Hub sizing formulation per KTR Drive Technology catalogue p.295
 * - Single / meshed gear 2D/3D generation with DIN 6885 keyway vs KTR clamping sets
 * - True hollow through-bore (no solid cylinders plugging the shaft bore)
 * - Technical drawing generation with ISO 2203 standard overlays
 */

import { describe, it, expect } from 'vitest';
import {
    KTR_CLAMPEX_CATALOG,
    KTR_CLAMPEX_SERIES,
    getKtrClampexSpecs,
    findKtrClampexByShaft,
    getAvailableShaftDiameters,
    calculateKtrHubSizing
} from '@/data/mechanical/ktrClampexStandards';
import { DYN_INVOLUTE_GEAR } from '@/cad/blocks/dynamic/definitions/involuteGear';
import { DYN_TIMING_BELT_PULLEY } from '@/cad/blocks/dynamic/definitions/timingPulley';
import { DYN_ROLLER_CHAIN_SPROCKET } from '@/cad/blocks/dynamic/definitions/rollerSprocket';
import { generateTechnicalDrawingSVG, extractFeatureSchedule } from '@/design-studio/technicalDrawingGenerator';
import { DesignPart } from '@/design-studio/designStore';

describe('KTR CLAMPEX® Conical Clamping Sets Standards Database', () => {
    it('should contain full data for KTR 100, KTR 200, KTR 250, and KTR 400 series', () => {
        expect(KTR_CLAMPEX_SERIES['KTR 100']).toBeDefined();
        expect(KTR_CLAMPEX_SERIES['KTR 200']).toBeDefined();
        expect(KTR_CLAMPEX_SERIES['KTR 250']).toBeDefined();
        expect(KTR_CLAMPEX_SERIES['KTR 400']).toBeDefined();

        expect(KTR_CLAMPEX_SERIES['KTR 200'].length).toBeGreaterThan(15);
    });

    it('should correctly query KTR 200 clamping set for a 30 mm shaft', () => {
        const ktr = getKtrClampexSpecs('KTR 200', 30);
        expect(ktr).toBeDefined();
        expect(ktr?.d).toBe(30);
        expect(ktr?.D).toBe(55);
        expect(ktr?.screwCount).toBe(6);
        expect(ktr?.screw).toBe('M6');
        expect(ktr?.TA).toBe(17);
        expect(ktr?.T).toBe(790); // 790 Nm per catalogue
    });

    it('should find closest standard KTR set when exact shaft diameter is requested', () => {
        const found = findKtrClampexByShaft('KTR 200', 32);
        expect(found).toBeDefined();
        expect(found?.d).toBe(32);
    });

    it('should compute valid hub minimum outer diameter and hollow shaft limits', () => {
        const ktr = getKtrClampexSpecs('KTR 200', 40);
        expect(ktr).toBeDefined();
        if (!ktr) return;

        const sizing = calculateKtrHubSizing(ktr, {
            hubYieldMpa: 350,   // C45 steel
            shapeFactorC: 0.8,  // general cylindrical / stepped hub
            shaftYieldMpa: 400
        });

        expect(sizing.minHubDiameter).toBeGreaterThan(ktr.D);
        expect(sizing.maxHollowShaftInnerDia).toBeLessThan(ktr.d);
        expect(sizing.hubYieldSafety).toBeGreaterThan(1.0);
    });
});

describe('Dynamic Involute Gear 3D Through-Bore & KTR Clamping Set Integration', () => {
    it('should generate a DIN 6885 keyway bore when shaftConnection is keyway_din6885', () => {
        const parts = DYN_INVOLUTE_GEAR.generate3D({
            module: 3,
            teeth: 24,
            faceWidth: 35,
            shaftDiameter: 25,
            shaftConnection: 'keyway_din6885',
            gearArrangement: 'single'
        });

        expect(parts.length).toBeGreaterThanOrEqual(1);
        const gearPart = parts[0];
        expect(gearPart.kind).toBe('gear-blank');
        expect(gearPart.params?.bore).toBe(25);
        expect(gearPart.params?.hasKeyway).toBe(true);
        expect(gearPart.params?.keywayWidth).toBe(8); // DIN 6885 for d=25
        expect(gearPart.params?.keywayDepth).toBe(4); // DIN 6885 shaft keyway depth

        // Ensure NO dummy solid cylinders plugged the bore
        const pluggedCylinder = parts.find(p => p.kind === 'cylinder' && p.position.x === 0 && p.position.y === 0);
        expect(pluggedCylinder).toBeUndefined();
    });

    it('should mount a true hollow KTR clamping sleeve inside the gear bore when KTR 200 is selected', () => {
        const shaftD = 35;
        const ktr = getKtrClampexSpecs('KTR 200', shaftD);
        expect(ktr).toBeDefined();
        if (!ktr) return;

        const parts = DYN_INVOLUTE_GEAR.generate3D({
            module: 3.5,
            teeth: 30,
            faceWidth: 40,
            shaftDiameter: shaftD,
            shaftConnection: 'ktr_200',
            gearArrangement: 'single'
        });

        // 1. Gear blank must have bore equal to KTR outer diameter D
        const gearPart = parts.find(p => p.name.includes('Pinyon Dişli'));
        expect(gearPart).toBeDefined();
        expect(gearPart?.params?.bore).toBe(ktr.D);
        expect(gearPart?.params?.hasKeyway).toBe(false);

        // 2. KTR Clamping Sleeve must be a TUBE (hollow through-hole), NOT a solid cylinder
        const sleevePart = parts.find(p => p.name.includes('Konik Kilit Bileziği'));
        expect(sleevePart).toBeDefined();
        expect(sleevePart?.kind).toBe('tube');
        expect(sleevePart?.params?.innerDiameter).toBe(ktr.d); // open bore for shaft
        expect(sleevePart?.params?.diameter).toBe(ktr.D);

        // 3. Central bore through the assembly must remain completely hollow
        const solidPlug = parts.find(p => p.kind === 'cylinder' && p.position.x === 0 && p.position.y === 0);
        expect(solidPlug).toBeUndefined();
    });

    it('should generate 2D CAD entities with KTR bolt pitch circle and screw circles', () => {
        const entities = DYN_INVOLUTE_GEAR.generate2D({
            module: 3,
            teeth: 25,
            shaftDiameter: 30,
            shaftConnection: 'ktr_200',
            gearArrangement: 'single'
        }, { x: 0, y: 0 });

        expect(entities.length).toBeGreaterThan(15);
        
        // Check for circle geometries: pitch, shaft, clamp outer, screw circles
        const circles = entities.filter(e => e.geometry.type === 'CIRCLE');
        expect(circles.length).toBeGreaterThanOrEqual(4);
    });

    it('should have calculatorRoute and calculatorLabelTr configured on DYN_INVOLUTE_GEAR', () => {
        expect(DYN_INVOLUTE_GEAR.calculatorRoute).toBe('/gears');
        expect(DYN_INVOLUTE_GEAR.calculatorLabelTr).toContain('Dişli');
    });
});

describe('ISO 2203 Technical Drawing Generator for Gear Assemblies', () => {
    it('should generate ISO 2203 pitch and root annotations on technical drawing SVG', () => {
        const gearPart: DesignPart = {
            id: 'test-gear-1',
            name: 'ISO 53 Pinion Gear z=24 m=3',
            kind: 'gear-blank',
            color: '#94a3b8',
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            visible: true,
            selected: false,
            meshRef: null,
            params: {
                module: 3,
                teeth: 24,
                faceWidth: 30,
                bore: 25,
                hasKeyway: true,
                keywayWidth: 8,
                keywayDepth: 4
            }
        };

        const dummyMassProps = {
            volumeCm3: 150,
            massKg: 1.2,
            surfaceAreaCm2: 300,
            densityGcm3: 7.85,
            centerOfMass: [0, 0, 0] as [number, number, number]
        };

        const svg = generateTechnicalDrawingSVG([gearPart], dummyMassProps, {
            sheetSize: 'A3',
            projection: 'third-angle',
            projectName: 'AluCAD OS Test Laboratory',
            partName: 'ISO 2203 Gear Verification'
        });

        expect(svg).toBeDefined();
        expect(svg.length).toBeGreaterThan(1000);
        
        // Verify ISO 2203 center mark / pitch circle / stroke-dasharray in SVG
        expect(svg).toContain('stroke-dasharray="10,3,2,3"'); // ISO 2203 dash-dot pitch circle

        // Verify feature schedule includes gear specs and DIN 6885 keyway
        const schedule = extractFeatureSchedule([gearPart]);
        expect(schedule.length).toBeGreaterThan(0);
        const gearScheduleItem = schedule.find(s => s.partName?.toLowerCase().includes('gear') || s.type?.toLowerCase().includes('keyway'));
        expect(gearScheduleItem).toBeDefined();
        expect(gearScheduleItem?.spec).toContain('DIN 6885');
    });
});

describe('Dynamic Timing Belt Pulley KTR & Flange Integration', () => {
    it('should generate 2D CAD entities with KTR bolt pitch circle and screw circles in front view', () => {
        const entities = DYN_TIMING_BELT_PULLEY.generate2D({
            teeth: 32,
            profileType: 'HTD_5M',
            boreDiameter: 25,
            shaftConnection: 'ktr_200',
            driveMode: 'single',
            visState: 'front_detailed'
        }, { x: 0, y: 0 });

        expect(entities.length).toBeGreaterThan(15);
        const circles = entities.filter(e => e.geometry.type === 'CIRCLE');
        expect(circles.length).toBeGreaterThanOrEqual(4);
    });

    it('should generate ISO 128 hatched cross section in side_section view', () => {
        const entities = DYN_TIMING_BELT_PULLEY.generate2D({
            teeth: 28,
            profileType: 'HTD_5M',
            boreDiameter: 20,
            shaftConnection: 'ktr_200',
            driveMode: 'single',
            flangeOption: 'both',
            visState: 'side_section'
        }, { x: 0, y: 0 });

        expect(entities.length).toBeGreaterThan(25);
        // Should contain hatching lines and rectangle boundaries
        const lines = entities.filter(e => e.geometry.type === 'LINE');
        expect(lines.length).toBeGreaterThan(10);
    });

    it('should mount hollow tube KTR clamping sleeve and guide flanges in 3D CAD without solid bore plugs', () => {
        const shaftD = 25;
        const ktr = findKtrClampexByShaft(shaftD, 'KTR 200')!;
        expect(ktr).toBeDefined();

        const parts = DYN_TIMING_BELT_PULLEY.generate3D({
            teeth: 30,
            profileType: 'HTD_5M',
            boreDiameter: shaftD,
            shaftConnection: 'ktr_200',
            flangeOption: 'both',
            driveMode: 'single'
        }, { x: 0, y: 0, z: 0 });

        // 1. Pulley body must have bore drilled to KTR outer diameter D
        const pulleyBody = parts.find(p => p.name.includes('Tahrik Kasnağı'));
        expect(pulleyBody).toBeDefined();
        expect(pulleyBody?.params?.bore).toBe(ktr.D);

        // 2. KTR Clamping Sleeve must be a tube
        const sleevePart = parts.find(p => p.name.includes('Konik Kilit Bileziği'));
        expect(sleevePart).toBeDefined();
        expect(sleevePart?.kind).toBe('tube');
        expect(sleevePart?.params?.innerDiameter).toBe(ktr.d);

        // 3. Guide flanges must be tubes, NOT solid cylinders
        const flangeParts = parts.filter(p => p.name.includes('Flanş'));
        expect(flangeParts.length).toBeGreaterThan(0);
        for (const fl of flangeParts) {
            expect(fl.kind).toBe('tube');
        }

        // 4. No solid cylinder must plug the central bore at (0, 0)
        const solidPlug = parts.find(p => p.kind === 'cylinder' && p.position.x === 0 && p.position.y === 0);
        expect(solidPlug).toBeUndefined();
    });

    it('should respect lockDirection front vs back along Z shaft axis', () => {
        const partsFront = DYN_TIMING_BELT_PULLEY.generate3D({
            teeth: 30,
            profileType: 'HTD_5M',
            boreDiameter: 25,
            shaftConnection: 'ktr_200',
            lockDirection: 'front',
            driveMode: 'single'
        }, { x: 0, y: 0, z: 0 });

        const partsBack = DYN_TIMING_BELT_PULLEY.generate3D({
            teeth: 30,
            profileType: 'HTD_5M',
            boreDiameter: 25,
            shaftConnection: 'ktr_200',
            lockDirection: 'back',
            driveMode: 'single'
        }, { x: 0, y: 0, z: 0 });

        const flangeFront = partsFront.find(p => p.name.includes('CLAMPEX') && p.name.includes('Flanş'))!;
        const flangeBack = partsBack.find(p => p.name.includes('CLAMPEX') && p.name.includes('Flanş'))!;
        expect(flangeFront).toBeDefined();
        expect(flangeBack).toBeDefined();
        // Front KTR collar must be on positive Z face, back KTR collar on negative Z face
        expect(flangeFront.position.z).toBeGreaterThan(flangeBack.position.z);
        expect(flangeFront.position.z).toBeGreaterThan(0);
        expect(flangeBack.position.z).toBeLessThan(0);
    });
});

describe('Dynamic Roller Chain Sprocket KTR & Flange Integration', () => {
    it('should generate 2D CAD entities with KTR bolt pitch circle in front view', () => {
        const entities = DYN_ROLLER_CHAIN_SPROCKET.generate2D({
            teeth: 21,
            chainSize: '08B',
            boreDiameter: 30,
            shaftConnection: 'ktr_200',
            driveMode: 'single',
            visState: 'front_detailed'
        }, { x: 0, y: 0 });

        expect(entities.length).toBeGreaterThan(15);
        const circles = entities.filter(e => e.geometry.type === 'CIRCLE');
        expect(circles.length).toBeGreaterThanOrEqual(4);
    });

    it('should mount hollow tube KTR clamping sleeve in 3D CAD without solid bore plugs', () => {
        const shaftD = 30;
        const ktr = findKtrClampexByShaft(shaftD, 'KTR 200')!;
        expect(ktr).toBeDefined();

        const parts = DYN_ROLLER_CHAIN_SPROCKET.generate3D({
            teeth: 25,
            chainSize: '08B',
            boreDiameter: shaftD,
            shaftConnection: 'ktr_200',
            driveMode: 'single'
        }, { x: 0, y: 0, z: 0 });

        // 1. Sprocket body must have bore drilled to KTR outer diameter D
        const sprocketBody = parts.find(p => p.name.includes('Tahrik Dişlisi'));
        expect(sprocketBody).toBeDefined();
        expect(sprocketBody?.params?.bore).toBe(ktr.D);

        // 2. KTR Clamping Sleeve must be a tube
        const sleevePart = parts.find(p => p.name.includes('Konik Kilit Bileziği'));
        expect(sleevePart).toBeDefined();
        expect(sleevePart?.kind).toBe('tube');
        expect(sleevePart?.params?.innerDiameter).toBe(ktr.d);

        // 3. Central bore through the assembly must remain completely hollow
        const solidPlug = parts.find(p => p.kind === 'cylinder' && p.position.x === 0 && p.position.y === 0);
        expect(solidPlug).toBeUndefined();
    });

    it('should generate hollow hub boss tube when DIN 6885 is used', () => {
        const parts = DYN_ROLLER_CHAIN_SPROCKET.generate3D({
            teeth: 25,
            chainSize: '08B',
            boreDiameter: 25,
            shaftConnection: 'keyway_din6885',
            hubStyle: 'boss',
            driveMode: 'single'
        }, { x: 0, y: 0, z: 0 });

        const hubPart = parts.find(p => p.name.includes('Göbeği'));
        expect(hubPart).toBeDefined();
        expect(hubPart?.kind).toBe('tube');
        expect(hubPart?.params?.innerDiameter).toBe(25);
    });
});

