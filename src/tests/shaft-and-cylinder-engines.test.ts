/**
 * tests/shaft-and-cylinder-engines.test.ts
 * 
 * Unit tests for ShaftDesignEngine (DIN 743, DIN 6885, DIN 471)
 * and CylinderDesignEngine (ISO 6020-2, DIN 2413, ISO 3601, Euler Buckling).
 */

import { 
    ShaftDesignEngine, 
    ShaftDesignInput, 
    getStandardKeywayDIN6885, 
    getStandardCirclipDIN471 
} from '../modules/mechanical/ShaftDesign/engine';

import { 
    CylinderDesignEngine, 
    CylinderDesignInput 
} from '../modules/mechanical/CylinderDesign/engine';
import { CrossModuleBridge } from '../system/crossModuleBridge';
import { useDesignStore } from '../design-studio/designStore';
import { calculateAssemblyMassProperties } from '../design-studio/materialsEngine';

describe('ShaftDesignEngine Tests', () => {
    test('Standard DIN 6885 keyway lookup returns correct dimensions', () => {
        const kw30 = getStandardKeywayDIN6885(30);
        expect(kw30.width).toBe(8);
        expect(kw30.depth).toBe(4.0);

        const kw45 = getStandardKeywayDIN6885(45);
        expect(kw45.width).toBe(14);
        expect(kw45.depth).toBe(5.5);
    });

    test('Standard DIN 471 circlip lookup returns correct groove dimensions', () => {
        const cc30 = getStandardCirclipDIN471(30);
        expect(cc30.grooveDia).toBe(28.6);
        expect(cc30.grooveWidth).toBe(1.6);

        const cc50 = getStandardCirclipDIN471(50);
        expect(cc50.grooveDia).toBe(47.0);
        expect(cc50.grooveWidth).toBe(2.15);
    });

    test('Shaft equilibrium and DIN 743 analysis runs correctly', () => {
        const input: ShaftDesignInput = {
            totalLength: 400,
            segments: [
                {
                    id: 's1',
                    segmentIndex: 0,
                    length: 100,
                    diameter: 30,
                    shoulderFilletRadius: 2.0,
                    toleranceGrade: 'k6',
                    features: [
                        {
                            type: 'circlip',
                            id: 'cc1',
                            standard: 'DIN 471',
                            grooveDia: 28.6,
                            grooveWidth: 1.6,
                            offsetFromStart: 20
                        }
                    ]
                },
                {
                    id: 's2',
                    segmentIndex: 1,
                    length: 200,
                    diameter: 45,
                    shoulderFilletRadius: 2.5,
                    toleranceGrade: 'h7',
                    features: [
                        {
                            type: 'keyway',
                            id: 'kw1',
                            standard: 'DIN 6885-1 Form A',
                            width: 14,
                            depth: 5.5,
                            length: 60,
                            offsetFromStart: 70
                        }
                    ]
                },
                {
                    id: 's3',
                    segmentIndex: 2,
                    length: 100,
                    diameter: 30,
                    shoulderFilletRadius: 2.0,
                    toleranceGrade: 'k6',
                    features: []
                }
            ],
            materialId: 'c45',
            supportAPos: 50,
            supportBPos: 350,
            radialLoads: [
                { id: 'f1', position: 200, forceN: 3000 }
            ],
            torque: {
                torqueNm: 150,
                inputPosition: 50,
                outputPosition: 200
            },
            targetSafetyFactor: 1.5
        };

        const { result, metadata } = ShaftDesignEngine.analyze(input);

        // Statics verification
        expect(result.supportReactions.RaN + result.supportReactions.RbN).toBeCloseTo(3000, 1);
        expect(result.supportReactions.RaN).toBeCloseTo(1500, 1);
        expect(result.supportReactions.RbN).toBeCloseTo(1500, 1);

        // Bending moment at center x=200 should be ~ 1500 * (200 - 50) = 225 N·m
        expect(result.maxBendingMomentNm).toBeCloseTo(225, 0);

        // Deflection and critical speed
        expect(result.maxDeflectionMm).toBeGreaterThan(0);
        expect(result.criticalSpeedRpm).toBeGreaterThan(1000);

        // Critical checks
        expect(result.criticalChecks.length).toBe(2); // circlip + keyway
        expect(metadata.standardReference).toContain('DIN 743');
    });
});

describe('CylinderDesignEngine Tests', () => {
    test('Standard ISO 6020 Hydraulic Cylinder Sizing & Buckling', () => {
        const input: CylinderDesignInput = {
            fluidMedium: 'hydraulic_mineral_oil',
            operatingPressureBar: 160,
            peakPressureBar: 210,
            boreDiameterD: 80,
            rodDiameterD: 45,
            strokeS: 400,
            mountingStyle: 'clevis_rear',
            pumpFlowRateLMin: 25,
            mechanicalEfficiency: 0.92,
            pistonSealType: 'K16',
            rodSealType: 'K33',
            wiperType: 'K01',
            hasCushioningFront: true,
            hasCushioningRear: true,
            rodMaterialId: '20mnv6_chrome',
            tubeMaterialId: 'st52_e355'
        };

        const { result, metadata } = CylinderDesignEngine.analyze(input);

        // Push force = 160 bar * 0.1 MPa * (pi * 80^2 / 4) * 0.92 / 1000 ~ 73.99 kN
        expect(result.pushForceKN).toBeCloseTo(73.99, 0);

        // Pull force = 160 bar * 0.1 * (pi * (80^2 - 45^2) / 4) * 0.92 / 1000 ~ 50.59 kN
        expect(result.pullForceKN).toBeCloseTo(50.59, 0);

        // Tube wall thickness verification per DIN 2413
        expect(result.tubeWallThicknessT).toBeGreaterThanOrEqual(result.minRequiredWallThicknessT);
        expect(result.tubeBurstPressureBar).toBeGreaterThan(500);
        expect(result.tubeYieldSafetyFactor).toBeGreaterThan(1.5);

        // Euler Buckling verification
        expect(result.criticalEulerForceKN).toBeGreaterThan(100);
        expect(result.bucklingSafetyFactor).toBeGreaterThan(1.0);

        // 1:1 BOM verification
        expect(result.billOfMaterials.length).toBe(11);
        expect(result.sealingBOM.pistonSeal).toContain('K16');
        expect(result.sealingBOM.rodSeal).toContain('K33');
        expect(result.sealingBOM.wiperSeal).toContain('K01');
    });

    test('Pneumatic Air Cylinder Sizing (6 bar)', () => {
        const input: CylinderDesignInput = {
            fluidMedium: 'pneumatic_air',
            operatingPressureBar: 6,
            peakPressureBar: 10,
            boreDiameterD: 63,
            rodDiameterD: 20,
            strokeS: 200,
            mountingStyle: 'flange_front',
            pumpFlowRateLMin: 120,
            mechanicalEfficiency: 0.90,
            pistonSealType: 'K21',
            rodSealType: 'K33',
            wiperType: 'K01',
            hasCushioningFront: true,
            hasCushioningRear: false,
            rodMaterialId: 'c45_chrome',
            tubeMaterialId: 'al6063_t6'
        };

        const { result } = CylinderDesignEngine.analyze(input);

        // Force at 6 bar
        expect(result.pushForceKN).toBeGreaterThan(1.5);
        expect(result.pushForceKN).toBeLessThan(2.0);
        expect(result.isBucklingSafe).toBe(true);
    });

    test('Long Stroke (> 1000 mm) Stop Tube Recommendation & Dual-Regime Buckling', () => {
        const input: CylinderDesignInput = {
            fluidMedium: 'hydraulic_mineral_oil',
            operatingPressureBar: 160,
            peakPressureBar: 210,
            boreDiameterD: 100,
            rodDiameterD: 56,
            strokeS: 1200, // Stroke > 1000 mm triggers stop tube
            mountingStyle: 'clevis_rear',
            pumpFlowRateLMin: 45,
            mechanicalEfficiency: 0.92,
            pistonSealType: 'K16',
            rodSealType: 'K33',
            wiperType: 'K01',
            hasCushioningFront: true,
            hasCushioningRear: true,
            rodMaterialId: '20mnv6_chrome',
            tubeMaterialId: 'st52_e355',
            movingMassKg: 600,
            horizontalMounting: true,
            cylinderConstruction: 'tie_rod_iso6020_2'
        };

        const { result, metadata } = CylinderDesignEngine.analyze(input);

        // Stop tube verification
        expect(result.needsStopTube).toBe(true);
        expect(result.stopTubeRecommendedLengthMm).toBe(20); // (1200 - 1000) / 10 = 20 mm

        // Dual-regime buckling verification
        expect(result.transitionSlendernessLambdaG).toBeGreaterThan(50);
        expect(result.rodSlendernessRatio).toBeGreaterThan(0);
        expect(['euler_elastic', 'tetmajer_inelastic']).toContain(result.bucklingRegime);
        expect(result.criticalBucklingForceKN).toBeGreaterThan(0);

        // Horizontal sag deflection
        expect(result.rodSelfWeightKg).toBeGreaterThan(20);
        expect(result.maxHorizontalDeflectionMm).toBeGreaterThan(0);

        // Tie-rod fastener check
        expect(result.tieRodCount).toBe(4);
        expect(result.tieRodTighteningTorqueNm).toBeGreaterThan(10);
        expect(result.tieRodSafetyFactor).toBeGreaterThan(1.5);

        // Standard references
        expect(metadata.standardReference).toContain('ISO 6020-2');
        expect(metadata.standardReference).toContain('ISO/TR 10461');
    });

    test('End Cushioning Dynamics & Port Flow Velocity per ISO 6020-2 and ISO 6149', () => {
        const input: CylinderDesignInput = {
            fluidMedium: 'hydraulic_mineral_oil',
            operatingPressureBar: 180,
            peakPressureBar: 240,
            boreDiameterD: 80,
            rodDiameterD: 45,
            strokeS: 500,
            mountingStyle: 'flange_front',
            pumpFlowRateLMin: 60, // High flow
            mechanicalEfficiency: 0.93,
            pistonSealType: 'K16',
            rodSealType: 'K33',
            wiperType: 'K01',
            hasCushioningFront: true,
            hasCushioningRear: true,
            rodMaterialId: '20mnv6_chrome',
            tubeMaterialId: 'st52_e355',
            movingMassKg: 250
        };

        const { result } = CylinderDesignEngine.analyze(input);

        // Cushioning dynamics
        expect(result.cushionSpearDiaMm).toBe(38); // Math.round(45 * 0.85) = 38 mm
        expect(result.cushionLengthMm).toBeGreaterThanOrEqual(20);
        expect(result.kineticEnergyJoules).toBeGreaterThan(0);
        expect(result.cushioningDecelerationMPerSec2).toBeGreaterThan(0);
        expect(result.peakCushioningPressureBar).toBeGreaterThan(0);

        // Port fluid velocity
        expect(result.portFluidVelocityMPerSec).toBeGreaterThan(0);
        expect(result.recommendedPortSize).toContain('G ');
        expect(result.portPressureDropBar).toBeGreaterThan(0);
        expect(result.oilVolumeExtendedLiters).toBeGreaterThan(result.oilVolumeRetractedLiters);
        expect(result.oilDifferentialLiters).toBeGreaterThan(0);
    });

    test('CrossModuleBridge.exportCylinderTo3D produces valid 3D CAD parts', () => {
        const bridgeRes = CrossModuleBridge.exportCylinderTo3D({
            boreD: 100,
            rodD: 56,
            strokeS: 1200,
            needsStopTube: true,
            stopTubeLengthMm: 20,
            hasTieRods: true,
            tieRodDiaMm: 14,
            switchWindow: false
        });

        // Authentic 1:1 assembly includes barrel/blocks, piston/rod/spear/flats, seals, 4 tie rods with 8 washers + 8 nuts, and ports
        expect(bridgeRes.totalParts).toBeGreaterThanOrEqual(25);
        expect(bridgeRes.createdIds.length).toBe(bridgeRes.totalParts);
        expect(bridgeRes.createdIds.some(id => id.startsWith('cyl-tube'))).toBe(true);
        expect(bridgeRes.createdIds.some(id => id.startsWith('cyl-piston'))).toBe(true);
        expect(bridgeRes.createdIds.some(id => id.startsWith('cyl-rod'))).toBe(true);
        expect(bridgeRes.createdIds.some(id => id.startsWith('cyl-stoptube'))).toBe(true);
        expect(bridgeRes.createdIds.some(id => id.startsWith('cyl-seal-piston-k16'))).toBe(true);
        expect(bridgeRes.createdIds.some(id => id.startsWith('cyl-tierod-'))).toBe(true);
        expect(bridgeRes.createdIds.some(id => id.startsWith('cyl-tierod-nut-rear-'))).toBe(true);
        const parts = useDesignStore.getState().parts;
        const massProps = calculateAssemblyMassProperties(parts);
        expect(massProps.massKg).toBeGreaterThan(10);
        expect(massProps.massKg).toBeLessThan(500);
    });

    test('ISO 6022 Bolted Flange Analysis (Mill Duty 250 bar)', () => {
        const input: CylinderDesignInput = {
            fluidMedium: 'hydraulic_mineral_oil',
            operatingPressureBar: 250,
            peakPressureBar: 315,
            boreDiameterD: 125,
            rodDiameterD: 90,
            strokeS: 800,
            mountingStyle: 'flange_rear',
            barrelConnectionStyle: 'bolted_flange',
            flangeBoltGrade: '10.9',
            pumpFlowRateLMin: 80,
            mechanicalEfficiency: 0.94,
            pistonSealType: 'K40',
            rodSealType: 'K35',
            wiperType: 'K03',
            hasCushioningFront: true,
            hasCushioningRear: true,
            rodMaterialId: '42crmo4_chrome',
            tubeMaterialId: 'st52_e355'
        };

        const { result, metadata } = CylinderDesignEngine.analyze(input);

        expect(result.barrelConnectionStyle).toBe('bolted_flange');
        expect(result.flangeBoltCount).toBe(6); // D = 125 uses 6 bolts
        expect(result.flangeBoltSize).toBe('6x M16 DIN 912 (10.9)');
        expect(result.flangeThicknessMm).toBeGreaterThanOrEqual(20);
        expect(result.flangeBoltTensileStressMPa).toBeGreaterThan(0);
        expect(result.flangeBoltTorqueNm).toBeGreaterThan(100);
        expect(result.flangeBoltSafetyFactor).toBeGreaterThan(1.5);
        expect(metadata.standardReference).toContain('ISO 6022');
        expect(metadata.standardReference).toContain('VDI 2230');
    });

    test('ISO MT4 Intermediate Trunnion Analysis & Buckling Reduction', () => {
        const input: CylinderDesignInput = {
            fluidMedium: 'hydraulic_mineral_oil',
            operatingPressureBar: 180,
            peakPressureBar: 220,
            boreDiameterD: 100,
            rodDiameterD: 56,
            strokeS: 900,
            mountingStyle: 'intermediate_trunnion_mt4',
            trunnionPositionMm: 450,
            pumpFlowRateLMin: 40,
            mechanicalEfficiency: 0.92,
            pistonSealType: 'K16',
            rodSealType: 'K33',
            wiperType: 'K01',
            hasCushioningFront: true,
            hasCushioningRear: true,
            rodMaterialId: '20mnv6_chrome',
            tubeMaterialId: 'st52_e355'
        };

        const { result } = CylinderDesignEngine.analyze(input);

        expect(result.hasTrunnion).toBe(true);
        expect(result.trunnionPinDiaMm).toBeGreaterThanOrEqual(35);
        expect(result.trunnionPinLengthMm).toBeGreaterThanOrEqual(20);
        expect(result.trunnionShearStressMPa).toBeGreaterThan(0);
        expect(result.trunnionBendingStressMPa).toBeGreaterThan(0);
        expect(result.trunnionBearingPressureMPa).toBeGreaterThan(0);
        expect(result.trunnionSafetyFactor).toBeGreaterThan(2.0);

        // Buckling length Lk should be measured from trunnion (450 mm from cap) to extended rod end,
        // which is shorter than extended length from rear cap!
        expect(result.bucklingLengthLkMm).toBeLessThan(result.extendedLengthMm);
    });

    test('ISO MP5 & AP4 Spherical Plain Bearing Eye Verification (ISO 12240-1)', () => {
        const input: CylinderDesignInput = {
            fluidMedium: 'hydraulic_mineral_oil',
            operatingPressureBar: 210,
            peakPressureBar: 260,
            boreDiameterD: 80,
            rodDiameterD: 45,
            strokeS: 500,
            mountingStyle: 'cap_spherical_eye_mp5',
            rodEndType: 'spherical_rod_eye_ap4',
            pumpFlowRateLMin: 30,
            mechanicalEfficiency: 0.92,
            pistonSealType: 'K16',
            rodSealType: 'K33',
            wiperType: 'K01',
            hasCushioningFront: true,
            hasCushioningRear: true,
            rodMaterialId: '20mnv6_chrome',
            tubeMaterialId: 'st52_e355'
        };

        const { result } = CylinderDesignEngine.analyze(input);

        expect(result.hasSphericalBearing).toBe(true);
        expect(result.sphericalBearingDesignation).toContain('GE ');
        expect(result.sphericalBearingStaticCapacityKN).toBeGreaterThan(result.pushForceKN);
        expect(result.sphericalBearingSafetyFactor).toBeGreaterThan(1.5);
        expect(result.sphericalBearingTiltAngleDeg).toBe(7);
    });

    test('ISO MS2 Foot Mount Offset Overturning Moment Analysis', () => {
        const input: CylinderDesignInput = {
            fluidMedium: 'hydraulic_mineral_oil',
            operatingPressureBar: 160,
            peakPressureBar: 200,
            boreDiameterD: 100,
            rodDiameterD: 56,
            strokeS: 600,
            mountingStyle: 'side_lugs_ms2',
            footMountOffsetMm: 75,
            pumpFlowRateLMin: 40,
            mechanicalEfficiency: 0.92,
            pistonSealType: 'K16',
            rodSealType: 'K33',
            wiperType: 'K01',
            hasCushioningFront: true,
            hasCushioningRear: true,
            rodMaterialId: '20mnv6_chrome',
            tubeMaterialId: 'st52_e355'
        };

        const { result } = CylinderDesignEngine.analyze(input);

        expect(result.footOffsetMm).toBe(75);
        expect(result.footOverturnMomentNm).toBeGreaterThan(5000); // F_push * 0.075 m
        expect(result.footBoltTensileForceN).toBeGreaterThan(10000);
        expect(result.footBoltShearForceN).toBeGreaterThan(10000);
    });

    test('Welded Cap Threaded Gland Shear Stress Analysis', () => {
        const input: CylinderDesignInput = {
            fluidMedium: 'hydraulic_mineral_oil',
            operatingPressureBar: 200,
            peakPressureBar: 250,
            boreDiameterD: 80,
            rodDiameterD: 45,
            strokeS: 400,
            mountingStyle: 'clevis_rear',
            barrelConnectionStyle: 'welded_cap_threaded_gland',
            pumpFlowRateLMin: 30,
            mechanicalEfficiency: 0.92,
            pistonSealType: 'K16',
            rodSealType: 'K33',
            wiperType: 'K01',
            hasCushioningFront: true,
            hasCushioningRear: true,
            rodMaterialId: '20mnv6_chrome',
            tubeMaterialId: 'st52_e355'
        };

        const { result } = CylinderDesignEngine.analyze(input);

        expect(result.isThreadedGland).toBe(true);
        expect(result.glandThreadSize).toContain('M86');
        expect(result.glandThreadShearStressMPa).toBeGreaterThan(0);
        expect(result.glandThreadSafetyFactor).toBeGreaterThan(2.5);
    });

    test('CrossModuleBridge.exportCylinderTo3D with bolted flanges, trunnion, and spherical rod eyes', () => {
        const bridgeRes = CrossModuleBridge.exportCylinderTo3D({
            boreD: 125,
            rodD: 90,
            strokeS: 800,
            barrelConnectionStyle: 'bolted_flange',
            mountingStyle: 'intermediate_trunnion_mt4',
            rodEndType: 'spherical_rod_eye_ap4',
            hasTrunnion: true,
            trunnionPositionMm: 400,
            trunnionPinDiaMm: 50,
            trunnionPinLengthMm: 60,
            flangeBoltCount: 8,
            switchWindow: false
        });

        // 5 base parts + 2 welded flanges + 16 flange bolts (8 front + 8 rear) + 1 trunnion collar + 2 pins + 1 rod eye = 27 parts
        expect(bridgeRes.totalParts).toBeGreaterThanOrEqual(25);
        expect(bridgeRes.createdIds.length).toBe(bridgeRes.totalParts);
    });

    test('MAG Hidrolik KHS-80 Series Catalog Matching & Threaded Gland D3 Analysis', () => {
        const input: CylinderDesignInput = {
            fluidMedium: 'hydraulic_mineral_oil',
            operatingPressureBar: 160,
            peakPressureBar: 250,
            boreDiameterD: 80,
            rodDiameterD: 45,
            strokeS: 500,
            mountingStyle: 'cap_spherical_eye_mp5',
            catalogSeries: 'mag_khs',
            barrelConnectionStyle: 'welded_cap_threaded_gland',
            pumpFlowRateLMin: 40,
            mechanicalEfficiency: 0.94,
            pistonSealType: 'K16',
            rodSealType: 'K33',
            wiperType: 'K01',
            hasCushioningFront: true,
            hasCushioningRear: true,
            rodMaterialId: '20mnv6_chrome',
            tubeMaterialId: 'st52_e355'
        };

        const { result, metadata } = CylinderDesignEngine.analyze(input);

        // Catalog matching verification
        expect(result.matchedCatalog).toBeDefined();
        expect(result.matchedCatalog?.seriesKey).toBe('mag_khs');
        expect(result.matchedCatalog?.exactMatchedCode).toBe('KHS-80-45/500');

        // Tube OD from MAG KHS catalog should be 89 mm
        expect(result.tubeOuterDiaDo).toBe(89);

        // Threaded Gland D3 should be M90x2
        expect(result.threadedJoints.glandThread.size).toBe('M90x2');
        expect(result.threadedJoints.glandThread.nominalDiaMm).toBe(90);
        expect(result.threadedJoints.glandThread.pitchMm).toBe(2.0);
        expect(result.threadedJoints.glandThread.isSafe).toBe(true);

        // Welded rear cap verification per Eurocode 3
        expect(result.weldedJoints.tubeRearCapWeld.throatAwMm).toBeGreaterThanOrEqual(4);
        expect(result.weldedJoints.tubeRearCapWeld.safetyFactor).toBeGreaterThan(2.0);
        expect(result.weldedJoints.overallWeldsSafe).toBe(true);

        expect(metadata.standardReference).toContain('MAG KHS/NHS');
    });

    test('MAG Hidrolik NHS-100 Series Bolted Circular Flange Analysis per VDI 2230', () => {
        const input: CylinderDesignInput = {
            fluidMedium: 'hydraulic_mineral_oil',
            operatingPressureBar: 250,
            peakPressureBar: 375,
            boreDiameterD: 100,
            rodDiameterD: 70,
            strokeS: 600,
            mountingStyle: 'head_flange_mf3',
            catalogSeries: 'mag_nhs',
            barrelConnectionStyle: 'bolted_flange',
            pumpFlowRateLMin: 60,
            mechanicalEfficiency: 0.95,
            pistonSealType: 'K16',
            rodSealType: 'K33',
            wiperType: 'K01',
            hasCushioningFront: true,
            hasCushioningRear: true,
            rodMaterialId: '42crmo4_chrome',
            tubeMaterialId: 'st52_e355'
        };

        const { result } = CylinderDesignEngine.analyze(input);

        expect(result.matchedCatalog?.seriesKey).toBe('mag_nhs');
        expect(result.matchedCatalog?.exactMatchedCode).toBe('NHS-100-70/600');
        expect(result.tubeOuterDiaDo).toBe(130);

        // Bolted joints per VDI 2230
        expect(result.boltedJoints.flangeBolts).toBeDefined();
        expect(result.boltedJoints.flangeBolts?.count).toBe(6);
        expect(result.boltedJoints.flangeBolts?.size).toContain('M16');
        expect(result.boltedJoints.flangeBolts?.preloadForcePerBoltN).toBeGreaterThan(0);
        expect(result.boltedJoints.flangeBolts?.tighteningTorqueNm).toBeGreaterThan(100);
        expect(result.boltedJoints.flangeBolts?.isSafe).toBe(true);
    });

    test('Bosch Rexroth CDH2 with CGKD Clampable Swivel Head & Eurocode 3 Tube Welds', () => {
        const input: CylinderDesignInput = {
            fluidMedium: 'hydraulic_mineral_oil',
            operatingPressureBar: 250,
            peakPressureBar: 320,
            boreDiameterD: 125,
            rodDiameterD: 90,
            strokeS: 1000,
            mountingStyle: 'cap_spherical_eye_mp5',
            rodEndType: 'spherical_rod_eye_ap4',
            catalogSeries: 'rexroth_cdh2',
            barrelConnectionStyle: 'bolted_flange',
            pumpFlowRateLMin: 80,
            mechanicalEfficiency: 0.94,
            pistonSealType: 'K40',
            rodSealType: 'K35',
            wiperType: 'K03',
            hasCushioningFront: true,
            hasCushioningRear: true,
            rodMaterialId: '42crmo4_chrome',
            tubeMaterialId: 'st52_e355'
        };

        const { result, metadata } = CylinderDesignEngine.analyze(input);

        expect(result.matchedCatalog?.seriesKey).toBe('rexroth_cdh2');
        expect(result.matchedCatalog?.manufacturer).toContain('Bosch Rexroth');

        // Rexroth CGKD clampable pinch bolt check
        expect(result.boltedJoints.clampableEyePinchBolts).toBeDefined();
        expect(result.boltedJoints.clampableEyePinchBolts?.standard).toContain('ISO 4762-10.9');
        expect(result.boltedJoints.clampableEyePinchBolts?.tighteningTorqueNm).toBeGreaterThanOrEqual(30);

        // Eurocode 3 Welded Joint
        expect(result.weldedJoints.tubeRearCapWeld.safetyFactor).toBeGreaterThan(2.0);
        expect(result.weldedJoints.weldStandard).toContain('DIN EN ISO 5817');

        expect(metadata.standardReference).toContain('Bosch Rexroth RE 17042');
    });
});


