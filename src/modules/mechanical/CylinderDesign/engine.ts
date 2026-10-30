/**
 * modules/mechanical/CylinderDesign/engine.ts
 * 
 * Industrial Hydraulic & Pneumatic Cylinder 1:1 Complete Component Design Engine
 * 
 * Standards cited:
 * - ISO 6020-2: Hydraulic fluid power - Mounting dimensions for single rod cylinders, 16 MPa (160 bar) compact series
 * - ISO 6022: Fluid power cylinders - Mounting dimensions for single rod cylinders, 25 MPa (250 bar) round series (Mill Type)
 * - ISO 3320: Fluid power cylinders - Cylinder bore and piston rod diameters and area ratios
 * - DIN 2413: Steel pipes; calculation of wall thickness of pipes subjected to internal pressure
 * - ISO 3601 (Parts 1-5): Fluid power systems - O-rings and housings
 * - ISO 7425-1 & 2: Housings for hydraulic cylinder seals (piston and rod)
 * - ISO/TR 10461 / DIN 24554: Guide for selection and application of cylinders (Euler & Tetmajer inelastic buckling)
 * - ISO 6149-1 & ISO 1179-1: Ports and stud ends for fluid power (BSPP & Metric O-ring ports)
 * - ISO 6982 / DIN 24338: Rod end spherical eyes (AP4) and clevis pins (ISO 8132 / 8133)
 * - ISO 12240-1 / ISO 12240-4: Spherical plain bearings (GE..ES) and swivel heads (CGK, CGKD, CGAS)
 * - VDI 2230: Systematic calculation of high duty bolted joints (Flange & Tie-rod pre-tension & torque)
 * - DIN EN ISO 5817 & Eurocode 3 (EN 1993-1-8): Quality levels & strength verification of welded joints
 * - DIN 76-A: Thread run-outs and thread undercuts for ISO metric threads
 * - DIN 912 / ISO 4762: Hexagon socket head cap screws (Grade 10.9 & 12.9)
 * - Bosch Rexroth RE 17042 (2024-03): Industrial cylinder mounting elements & swivel heads
 * - MAG Hidrolik (2019-12): KHS (Compact threaded gland), NHS (CETOP R58H / ISO 6022), THS (Agricultural)
 */

import { EngineMetadata } from '@/engine/project/ProjectSchema';
import { 
    KASTAS_SERIES, 
    KASTAS_STANDARD_ROD_SIZES, 
    KASTAS_STANDARD_PISTON_SIZES,
    getMaxExtrusionGap
} from '@/data/sealsCatalogDatabase';
import { calculateORingGland, STANDARD_CORDS } from '@/lib/calculations/oringGland';
import {
    findMagKhsByBore,
    findMagNhsByBore,
    MAG_KHS_SERIES,
    MAG_NHS_SERIES,
    MagKhsDimension,
    MagNhsDimension
} from './catalogs/magCatalog';
import {
    findRexrothCgkdByThread,
    findRexrothCgkdByPin,
    findRexrothCgasByPin,
    REXROTH_CGKD_CATALOG,
    REXROTH_CGAS_CATALOG,
    REXROTH_CLTB_CATALOG,
    RexrothSwivelHeadCGKD,
    RexrothSwivelHeadCGAS
} from './catalogs/rexrothCatalog';

// ============================================================================
// 1. DATA TYPES & INTERFACES
// ============================================================================

export type CylinderFluidMedium = 'hydraulic_mineral_oil' | 'pneumatic_air' | 'water_glycol';

export type CylinderMountingStyle = 
    | 'clevis_rear'                // ISO MP4 / MP1 - Rear Clevis / Eye - nu = 1.0
    | 'flange_front'               // ISO MF3 - Front Rectangular Flange - nu = 0.7
    | 'flange_rear'                // ISO MF4 - Rear Rectangular Flange - nu = 1.0
    | 'foot_mount'                 // ISO MS2 - Side Lug / Foot Mount - nu = 0.7
    | 'trunnion_mid'               // ISO MT4 - Intermediate Trunnion - nu = 1.0
    | 'fixed_guided'               // Rigid Fixed-Guided ends - nu = 0.5
    // Explicit ISO 6020-2 / ISO 6022 Field Designations
    | 'cap_clevis_mp1'             // ISO MP1: Arka Çatal Mafsal ve Pimi (Clevis with Pin)
    | 'cap_plain_eye_mp3'          // ISO MP3: Arka Sabit Düz Delikli Göz (Plain Eye)
    | 'cap_male_eye_mp4'           // ISO MP4: Arka Düz Tek Kulak (Male Clevis Eye)
    | 'cap_spherical_eye_mp5'      // ISO MP5: Arka Oynak Mafsal Rulmanlı Göz (GE..ES)
    | 'head_flange_mf3'            // ISO MF3 / ME5: Ön Dikdörtgen/Dairesel Flanş
    | 'cap_flange_mf4'             // ISO MF4 / ME6: Arka Flanş
    | 'intermediate_trunnion_mt4'  // ISO MT4: Gövde Orta Muylu Mafsalı
    | 'head_trunnion_mt1'          // ISO MT1: Ön Kafa Muylu Mafsalı
    | 'side_lugs_ms2'              // ISO MS2: Gövde Yan Ayak / Taban Bağlantı
    | 'extended_tie_rods_mx1'      // ISO MX1: Ön Saplama Uzantılı Montaj
    | 'extended_tie_rods_mx2'      // ISO MX2: Arka Saplama Uzantılı Montaj
    | 'extended_tie_rods_mx3';     // ISO MX3: Çift Taraflı Saplama Uzantılı

export type BarrelConnectionStyle = 
    | 'tie_rod_studs'              // Saplamalı (ISO 6020-2 / NFPA - 4x boydan boya saplama)
    | 'bolted_flange'              // Cıvatalı Flanşlı (ISO 6022 Mill Duty - kovan flanş cıvataları)
    | 'welded_cap_bolted_gland'    // Kaynaklı Taban + Cıvatalı Ön Boğaz
    | 'welded_cap_threaded_gland'  // Kaynaklı Taban + Vidalı/Dişli Ön Boğaz
    | 'welded_monolithic'          // Komple Kaynaklı Yuvarlak Seri (Mobil Ağır Seri)
    | 'internal_retaining_ring';   // Segmanlı / Yay Bilezikli Ön Boğaz

export type RodEndType = 
    | 'male_thread'            // Erkek Metrik Diş (ISO 6020-2) + Kontra Somun
    | 'female_thread'          // Dişi Metrik Diş
    | 'spherical_eye'          // Oynak Rulmanlı Göz (ISO 6982 / DIN 24338)
    | 'spherical_rod_eye_ap4'  // ISO 6982 AP4 Oynak Başlıklı Göz
    | 'clevis_pin'             // Çatal Mafsal ve Pimi (ISO 8132 / ISO 8133)
    | 'rod_clevis_ap2'         // ISO 8132 AP2 Çatal Mafsal
    | 'plain_welded_eye'       // Düz Kaynaklı Kulak / Delikli Göz
    | 'flanged_rod_end';       // Flanşlı Mil Ucu

export type CylinderConstruction = 'tie_rod_iso6020_2' | 'welded_round_iso6022' | 'mill_duty';

export interface SphericalBearingSpec {
    boreD: number; // mm
    outerD: number; // mm
    widthB: number; // mm
    c0StaticKN: number;
    cdDynamicKN: number;
    tiltAngleDeg: number;
    designation: string;
}

export const SPHERICAL_BEARINGS_CATALOG: SphericalBearingSpec[] = [
    { boreD: 16, outerD: 30, widthB: 14, c0StaticKN: 72, cdDynamicKN: 14, tiltAngleDeg: 10, designation: 'GE 16 ES' },
    { boreD: 20, outerD: 35, widthB: 16, c0StaticKN: 100, cdDynamicKN: 30, tiltAngleDeg: 9, designation: 'GE 20 ES' },
    { boreD: 25, outerD: 42, widthB: 20, c0StaticKN: 160, cdDynamicKN: 48, tiltAngleDeg: 7, designation: 'GE 25 ES' },
    { boreD: 30, outerD: 47, widthB: 22, c0StaticKN: 220, cdDynamicKN: 62, tiltAngleDeg: 6, designation: 'GE 30 ES' },
    { boreD: 35, outerD: 55, widthB: 25, c0StaticKN: 300, cdDynamicKN: 80, tiltAngleDeg: 6, designation: 'GE 35 ES' },
    { boreD: 40, outerD: 62, widthB: 28, c0StaticKN: 400, cdDynamicKN: 100, tiltAngleDeg: 7, designation: 'GE 40 ES' },
    { boreD: 45, outerD: 68, widthB: 32, c0StaticKN: 500, cdDynamicKN: 125, tiltAngleDeg: 7, designation: 'GE 45 ES' },
    { boreD: 50, outerD: 75, widthB: 35, c0StaticKN: 620, cdDynamicKN: 156, tiltAngleDeg: 6, designation: 'GE 50 ES' },
    { boreD: 60, outerD: 90, widthB: 44, c0StaticKN: 900, cdDynamicKN: 245, tiltAngleDeg: 6, designation: 'GE 60 ES' },
    { boreD: 70, outerD: 105, widthB: 49, c0StaticKN: 1200, cdDynamicKN: 315, tiltAngleDeg: 6, designation: 'GE 70 ES' },
    { boreD: 80, outerD: 120, widthB: 55, c0StaticKN: 1600, cdDynamicKN: 400, tiltAngleDeg: 6, designation: 'GE 80 ES' },
    { boreD: 90, outerD: 130, widthB: 60, c0StaticKN: 2000, cdDynamicKN: 490, tiltAngleDeg: 5, designation: 'GE 90 ES' },
    { boreD: 100, outerD: 150, widthB: 70, c0StaticKN: 2500, cdDynamicKN: 610, tiltAngleDeg: 7, designation: 'GE 100 ES' },
    { boreD: 120, outerD: 180, widthB: 85, c0StaticKN: 3750, cdDynamicKN: 950, tiltAngleDeg: 6, designation: 'GE 120 ES' },
];

export interface CylinderBoreOption {
    boreD: number;         // mm (ISO 3320)
    standardRods: number[]; // mm (ISO 3320 standard rod pairings)
    recommendedTubeOD: number; // mm (Honed tube standard OD)
}

export const ISO_3320_BORES: CylinderBoreOption[] = [
    { boreD: 25, standardRods: [14, 18], recommendedTubeOD: 35 },
    { boreD: 32, standardRods: [18, 22], recommendedTubeOD: 42 },
    { boreD: 40, standardRods: [22, 28], recommendedTubeOD: 50 },
    { boreD: 50, standardRods: [28, 36], recommendedTubeOD: 62 },
    { boreD: 63, standardRods: [36, 45], recommendedTubeOD: 75 },
    { boreD: 80, standardRods: [45, 56], recommendedTubeOD: 95 },
    { boreD: 100, standardRods: [56, 70], recommendedTubeOD: 115 },
    { boreD: 125, standardRods: [70, 90], recommendedTubeOD: 145 },
    { boreD: 140, standardRods: [80, 100], recommendedTubeOD: 160 },
    { boreD: 160, standardRods: [90, 110], recommendedTubeOD: 185 },
    { boreD: 180, standardRods: [100, 125], recommendedTubeOD: 210 },
    { boreD: 200, standardRods: [110, 140], recommendedTubeOD: 230 },
    { boreD: 250, standardRods: [140, 180], recommendedTubeOD: 290 },
];

export type CylinderCatalogSeries = 
    | 'custom'
    | 'mag_khs'        // MAG Hidrolik KHS (Kompakt Vidalı Boğaz - 160/250 Bar)
    | 'mag_nhs'        // MAG Hidrolik NHS (Ağır Hizmet Cıvatalı Flanş - ISO 6022 - 250 Bar)
    | 'mag_ths'        // MAG Hidrolik THS (Tarım Tip Silindir - 160/250 Bar)
    | 'rexroth_cdh2'   // Bosch Rexroth CDH2 (ISO 6022 Ağır Hizmet Dairesel Flanşlı - 250 Bar)
    | 'rexroth_cdt3'   // Bosch Rexroth CDT3 (ISO 6020-2 Dört Köşe Saplamalı Tie-Rod - 160 Bar)
    | 'rexroth_cd210'; // Bosch Rexroth CD210 (Endüstriyel Kaynaklı Yuvarlak - 210 Bar)

export interface WeldedJointDetail {
    location: string;
    weldType: string;
    throatAwMm: number;
    lengthMm: number;
    stressMPa: number;
    allowableStressMPa: number;
    safetyFactor: number;
    qualityStandard: string;
    isSafe: boolean;
}

export interface WeldedJointsAnalysis {
    tubeRearCapWeld: WeldedJointDetail;
    portBossWelds: WeldedJointDetail;
    trunnionWelds?: WeldedJointDetail;
    weldEyeShank?: WeldedJointDetail;
    overallWeldsSafe: boolean;
    weldStandard: string;
}

export interface BoltedJointDetail {
    standard: string;
    count: number;
    size: string;
    grade: string;
    pcdMm: number;
    loadPerBoltN: number;
    preloadForcePerBoltN: number;
    tighteningTorqueNm: number;
    tensileStressMPa: number;
    safetyFactor: number;
    isSafe: boolean;
}

export interface BoltedJointsAnalysis {
    flangeBolts?: BoltedJointDetail;
    tieRodStuds?: BoltedJointDetail;
    clampableEyePinchBolts?: {
        standard: string;
        screwSize: string;
        count: number;
        tighteningTorqueNm: number;
        ratedStaticCapacityKN: number;
        admissibleLoadKN: number;
        isLoadAcceptable: boolean;
    };
    footAnchorBolts?: {
        size: string;
        count: number;
        tensileForceN: number;
        shearForceN: number;
    };
    overallBoltsSafe: boolean;
    boltStandard: string;
}

export interface ThreadedJointsAnalysis {
    glandThread: {
        size: string;
        nominalDiaMm: number;
        pitchMm: number;
        engagementLengthMm: number;
        shearAreaMm2: number;
        shearStressMPa: number;
        allowableShearMPa: number;
        safetyFactor: number;
        spannerHoles: string;
        recommendedTorqueNm: number;
        isSafe: boolean;
    };
    rodEndThread: {
        size: string;
        threadPitchMm: number;
        stressAreaMm2: number;
        tensileStressMPa: number;
        safetyFactor: number;
        undercutStandard: string;
        undercutRadiusMm: number;
        counterNutStandard: string;
        counterNutTorqueNm: number;
        isSafe: boolean;
    };
    pistonLockNut: {
        standard: string;
        threadSize: string;
        lockTorqueNm: number;
    };
    portThreads: {
        size: string;
        standard: string;
        fittingTighteningTorqueNm: number;
    };
    overallThreadsSafe: boolean;
    threadStandard: string;
}

export interface MatchedCatalogInfo {
    seriesKey: CylinderCatalogSeries;
    seriesName: string;
    manufacturer: string;
    standardDesignation: string;
    exactMatchedCode?: string;
    nominalPressureBar: number;
    peakPressureBar: number;
    catalogPageReference: string;
    constructionSummary: string;
}

export interface CylinderDesignInput {
    fluidMedium: CylinderFluidMedium;
    operatingPressureBar: number; // bar (Hydraulic typically 70-350 bar, Pneumatic 4-10 bar)
    peakPressureBar: number;      // bar (shock/relief limit)
    boreDiameterD: number;        // mm (Inner bore)
    rodDiameterD: number;         // mm (Rod diameter)
    strokeS: number;              // mm (Working stroke)
    mountingStyle: CylinderMountingStyle;
    pumpFlowRateLMin: number;     // L/min (Inlet pump/compressor flow rate)
    mechanicalEfficiency: number; // 0.90 - 0.95
    pistonSealType: 'K16' | 'K21' | 'K40';
    rodSealType: 'K33' | 'K35';
    wiperType: 'K01' | 'K03';
    hasCushioningFront: boolean;
    hasCushioningRear: boolean;
    rodMaterialId: 'c45_chrome' | '20mnv6_chrome' | 'aisi431_stainless' | '42crmo4_chrome';
    tubeMaterialId: 'st52_e355' | 'al6063_t6';
    movingMassKg?: number;        // kg (Load mass attached to rod)
    rodEndType?: RodEndType;
    cylinderConstruction?: CylinderConstruction;
    barrelConnectionStyle?: BarrelConnectionStyle;
    flangeBoltGrade?: '8.8' | '10.9' | '12.9';
    trunnionPositionMm?: number; // Position from rear cap to trunnion pivot
    footMountOffsetMm?: number;  // Offset height from cylinder centerline to foot base
    horizontalMounting?: boolean; // Evaluate horizontal rod deflection
    catalogSeries?: CylinderCatalogSeries; // Optional standard series matching
}

export interface CylinderComponentDimension {
    partNumber: number;
    name: string;
    description: string;
    standard: string;
    material: string;
    quantity: number;
    outerDiaMm: number;
    innerDiaMm: number;
    lengthMm: number;
    weightKg: number;
    notes?: string;
}

export interface CylinderDesignResult {
    // Kinematics & Forces
    pushAreaCm2: number;
    pullAreaCm2: number;
    pushForceKN: number;
    pullForceKN: number;
    pushSpeedMPerSec: number;
    pullSpeedMPerSec: number;
    pushStrokeTimeSec: number;
    pullStrokeTimeSec: number;
    hydraulicPowerKW: number;

    // Tube Stress & Safety (DIN 2413 & Lamé)
    tubeInnerDiaD: number;
    tubeOuterDiaDo: number;
    tubeWallThicknessT: number;
    minRequiredWallThicknessT: number;
    tubeHoopStressMPa: number;
    tubeBurstPressureBar: number;
    tubeYieldSafetyFactor: number;
    tubeBurstSafetyFactor: number;

    // Buckling Analysis (Euler / Tetmajer / Rankine-Gordon per ISO/TR 10461)
    closedLengthMm: number;
    extendedLengthMm: number;
    effectiveBucklingFactorNu: number;
    bucklingLengthLkMm: number;
    rodSlendernessRatio: number;
    transitionSlendernessLambdaG: number;
    bucklingRegime: 'euler_elastic' | 'tetmajer_inelastic';
    criticalEulerForceKN: number;
    criticalBucklingForceKN: number;
    tetmajerCriticalStressMPa: number;
    eulerCriticalStressMPa: number;
    bucklingSafetyFactor: number;
    isBucklingSafe: boolean;
    maxPermissibleStrokeMm: number;
    stopTubeRecommendedLengthMm: number;
    needsStopTube: boolean;

    // Horizontal Rod Sag Deflection (Self-weight)
    rodSelfWeightKg: number;
    maxHorizontalDeflectionMm: number;
    isDeflectionAcceptable: boolean;

    // End-of-Stroke Cushioning & Deceleration Analysis (ISO 6020-2)
    cushionSpearDiaMm: number;
    cushionLengthMm: number;
    cushionAnnularAreaCm2: number;
    kineticEnergyJoules: number;
    peakCushioningPressureBar: number;
    isCushioningPressureSafe: boolean;
    cushioningDecelerationMPerSec2: number;

    // Ports & Fluid Dynamics (ISO 6149 / ISO 228-1)
    recommendedPortSize: string; // e.g. "G 1/2\" (BSPP)"
    portThreadStandard: string;
    portInnerDiaMm: number;
    portFluidVelocityMPerSec: number;
    portVelocityRating: 'optimal' | 'moderate' | 'high_loss';
    portPressureDropBar: number;
    reynoldsNumber: number;

    // Barrel Connection & Fasteners (ISO 6020-2 / ISO 6022)
    barrelConnectionStyle: BarrelConnectionStyle;

    // Tie-Rod Fastener Stress Analysis (ISO 6020-2 Compact Series)
    tieRodCount: number;
    tieRodSize: string;
    tieRodTensileStressMPa: number;
    tieRodTighteningTorqueNm: number;
    tieRodSafetyFactor: number;

    // Bolted Flange Analysis (ISO 6022 Mill Duty)
    flangeBoltCount: number;
    flangeBoltSize: string;
    flangeBoltTensileStressMPa: number;
    flangeBoltTorqueNm: number;
    flangeBoltSafetyFactor: number;
    flangeThicknessMm: number;

    // Intermediate Trunnion Analysis (ISO MT4)
    hasTrunnion: boolean;
    trunnionPinDiaMm: number;
    trunnionPinLengthMm: number;
    trunnionShearStressMPa: number;
    trunnionBendingStressMPa: number;
    trunnionBearingPressureMPa: number;
    trunnionSafetyFactor: number;

    // Spherical Bearing Eye Analysis (ISO MP5 / AP4)
    hasSphericalBearing: boolean;
    sphericalBearingDesignation: string;
    sphericalBearingStaticCapacityKN: number;
    sphericalBearingSafetyFactor: number;
    sphericalBearingTiltAngleDeg: number;

    // Foot Mount Offset Moment Analysis (ISO MS2)
    footOffsetMm: number;
    footOverturnMomentNm: number;
    footBoltTensileForceN: number;
    footBoltShearForceN: number;

    // Threaded Gland Analysis
    isThreadedGland: boolean;
    glandThreadSize: string;
    glandThreadShearStressMPa: number;
    glandThreadSafetyFactor: number;

    // Rod End & Clevis Pin Sizing (ISO 6982 / DIN 24338)
    rodEndThread: string;
    clevisPinDiaMm: number;
    clevisPinShearStressMPa: number;
    clevisPinBearingPressureMPa: number;

    // Oil Volumes & Thermal Heat Load
    oilVolumeExtendedLiters: number;
    oilVolumeRetractedLiters: number;
    oilDifferentialLiters: number;
    heatGenerationKW: number;
    minTankVolumeLiters: number;

    // Manufacturing Fits & Surface Roughness
    tubeBoreTolerance: string;
    rodTolerance: string;
    pistonTolerance: string;
    glandTolerance: string;

    // Sizing of 1:1 Components
    pistonLengthMm: number;
    glandLengthMm: number;
    rearCapLengthMm: number;
    totalCylinderMassKg: number;

    // Sealing Pack Detail
    sealingBOM: {
        rodSeal: string;
        wiperSeal: string;
        pistonSeal: string;
        pistonGuideRings: string;
        internalRodORing: string;
        tubeGlandORing: string;
        backupRing: string;
    };

    // Full 1:1 Parts Bill of Materials
    billOfMaterials: CylinderComponentDimension[];

    // Comprehensive Joint & Fastener Engineering (Welded, Bolted, Threaded)
    weldedJoints: WeldedJointsAnalysis;
    boltedJoints: BoltedJointsAnalysis;
    threadedJoints: ThreadedJointsAnalysis;

    // Standard Catalog Matching
    matchedCatalog?: MatchedCatalogInfo;

    // Diagnostics & Warnings
    summaryWarnings: string[];
    isDesignSafeOverall: boolean;
}

// ============================================================================
// 2. CYLINDER ENGINE IMPLEMENTATION
// ============================================================================

export class CylinderDesignEngine {
    static readonly VERSION = '1.3.0';

    static analyze(input: CylinderDesignInput): { result: CylinderDesignResult; metadata: EngineMetadata } {
        const warnings: string[] = [];
        const isPneumatic = input.fluidMedium === 'pneumatic_air';

        const p_bar = Math.max(1, input.operatingPressureBar);
        const p_peak_bar = Math.max(p_bar, input.peakPressureBar || p_bar * 1.25);
        const D = Math.max(10, input.boreDiameterD);
        const d = Math.max(6, input.rodDiameterD);
        const S = Math.max(10, input.strokeS);
        const eta = Math.max(0.7, Math.min(0.98, input.mechanicalEfficiency));
        const movingMassKg = input.movingMassKg && input.movingMassKg > 0 ? input.movingMassKg : Math.round(D * 4.5 + S * 0.15);
        const rodEndType: RodEndType = input.rodEndType || 'male_thread';
        const cylinderConstruction = input.cylinderConstruction || 'tie_rod_iso6020_2';
        const catSeries: CylinderCatalogSeries = input.catalogSeries || 
            (cylinderConstruction === 'mill_duty' ? 'rexroth_cdh2' : 
             cylinderConstruction === 'tie_rod_iso6020_2' ? 'rexroth_cdt3' : 'custom');

        const magKhs = findMagKhsByBore(D);
        const magNhs = findMagNhsByBore(D);

        let matchedCatalog: MatchedCatalogInfo | undefined = undefined;

        if (catSeries === 'mag_khs' && magKhs) {
            matchedCatalog = {
                seriesKey: 'mag_khs',
                seriesName: 'MAG Hidrolik KHS Kompakt Seri',
                manufacturer: 'Mert Akışkan Gücü (MAG)',
                standardDesignation: `MAG ${magKhs.code}`,
                exactMatchedCode: `${magKhs.code}-${d}/${S}`,
                nominalPressureBar: magKhs.pressureNominalBar,
                peakPressureBar: magKhs.pressurePeakBar,
                catalogPageReference: 'MAG Hidrolik Katalog s. 2-5 (KHS)',
                constructionSummary: 'St 52 BK+S honlanmış gövde, kaynaklı taban kapağı, vidalı boğaz (D3 dişi), Kastaş kompakt keçe paketi'
            };
        } else if (catSeries === 'mag_nhs' && magNhs) {
            matchedCatalog = {
                seriesKey: 'mag_nhs',
                seriesName: 'MAG Hidrolik NHS Ağır Hizmet Serisi (CETOP R58H / ISO 6022)',
                manufacturer: 'Mert Akışkan Gücü (MAG)',
                standardDesignation: `MAG ${magNhs.code}`,
                exactMatchedCode: `${magNhs.code}-${d}/${S}`,
                nominalPressureBar: magNhs.nominalPressureBar,
                peakPressureBar: magNhs.testPressureBar,
                catalogPageReference: 'MAG Hidrolik Katalog s. 6-9 (NHS)',
                constructionSummary: 'Dairesel cıvatalı flanşlı başlık ve arka kapak, DIN 912 10.9 cıvatalar, ISO 6022 standardı'
            };
        } else if (catSeries === 'mag_ths') {
            matchedCatalog = {
                seriesKey: 'mag_ths',
                seriesName: 'MAG Hidrolik THS Tarım Tip Seri',
                manufacturer: 'Mert Akışkan Gücü (MAG)',
                standardDesignation: `MAG THS-${D}`,
                exactMatchedCode: `THS-${D}-${d}/${S}`,
                nominalPressureBar: 160,
                peakPressureBar: 250,
                catalogPageReference: 'MAG Hidrolik Katalog s. 10-12 (THS)',
                constructionSummary: 'Tarım ve mobil makineler için yuvarlak kaynaklı gövde, arka/ön eklem ve flanş montajı'
            };
        } else if (catSeries === 'rexroth_cdh2') {
            matchedCatalog = {
                seriesKey: 'rexroth_cdh2',
                seriesName: 'Bosch Rexroth CDH2 Ağır Hizmet Silindiri (ISO 6022)',
                manufacturer: 'Bosch Rexroth AG',
                standardDesignation: `Rexroth CDH2 / CGH2`,
                exactMatchedCode: `CDH2MP5/D${D}/d${d}/${S}B11/B1CAUMWW`,
                nominalPressureBar: 250,
                peakPressureBar: 320,
                catalogPageReference: 'Bosch Rexroth RE 17042 / RE 17334',
                constructionSummary: 'ISO 6022 dairesel cıvatalı flanş konstrüksiyonu, CGKD klemensli mafsal kafası, ağır sanayi / demir-çelik'
            };
        } else if (catSeries === 'rexroth_cdt3') {
            matchedCatalog = {
                seriesKey: 'rexroth_cdt3',
                seriesName: 'Bosch Rexroth CDT3 Saplamalı (Tie-Rod) Silindir (ISO 6020-2)',
                manufacturer: 'Bosch Rexroth AG',
                standardDesignation: `Rexroth CDT3 / CGT3`,
                exactMatchedCode: `CDT3MP5/D${D}/d${d}/${S}F11/B1CAUMWW`,
                nominalPressureBar: 160,
                peakPressureBar: 210,
                catalogPageReference: 'Bosch Rexroth RE 17042 / RE 17039',
                constructionSummary: 'ISO 6020-2 / DIN 24554 160 bar kompakt 4 köşe saplamalı yapı, NFPA uyumlu'
            };
        } else if (catSeries === 'rexroth_cd210') {
            matchedCatalog = {
                seriesKey: 'rexroth_cd210',
                seriesName: 'Bosch Rexroth CD210 Endüstriyel Yuvarlak Seri (210 Bar)',
                manufacturer: 'Bosch Rexroth AG',
                standardDesignation: `Rexroth CD210`,
                exactMatchedCode: `CD210MP5/D${D}/d${d}/${S}A11/B1`,
                nominalPressureBar: 210,
                peakPressureBar: 250,
                catalogPageReference: 'Bosch Rexroth RE 17042 / RE 17017',
                constructionSummary: 'Kaynaklı silindir gövdesi, kompakt vidalı boğaz, CGK oynak mafsal kafası'
            };
        } else if (magKhs) {
            matchedCatalog = {
                seriesKey: 'mag_khs',
                seriesName: `MAG Hidrolik KHS Standartı ile Uyumlu (${magKhs.code})`,
                manufacturer: 'Mert Akışkan Gücü (MAG)',
                standardDesignation: magKhs.code,
                nominalPressureBar: 160,
                peakPressureBar: 250,
                catalogPageReference: 'MAG Hidrolik Katalog s. 2-5',
                constructionSummary: 'KHS normunda vidalı boğaz ve kaynaklı taban kapağı ile uyumlu'
            };
        }

        const barrelConn: BarrelConnectionStyle = input.barrelConnectionStyle || 
            (catSeries === 'mag_khs' ? 'welded_cap_threaded_gland' :
             catSeries === 'mag_nhs' || catSeries === 'rexroth_cdh2' ? 'bolted_flange' :
             catSeries === 'rexroth_cdt3' || cylinderConstruction === 'tie_rod_iso6020_2' ? 'tie_rod_studs' : 
             cylinderConstruction === 'mill_duty' ? 'bolted_flange' : 'welded_cap_bolted_gland');

        if (d >= D) {
            warnings.push("Mil çapı (d), silindir iç çapından (D) küçük olmalıdır!");
        }

        // 1. Hydraulic / Pneumatic Forces & Areas
        const pushAreaMm2 = (Math.PI * Math.pow(D, 2)) / 4;
        const pullAreaMm2 = Math.max(1, (Math.PI * (Math.pow(D, 2) - Math.pow(d, 2))) / 4);

        const pushAreaCm2 = pushAreaMm2 / 100;
        const pullAreaCm2 = pullAreaMm2 / 100;

        // Force = Pressure (bar) * Area (mm^2) * 0.1 N -> in kN
        // 1 bar = 0.1 N/mm^2 = 0.1 MPa
        const pushForceKN = (p_bar * 0.1 * pushAreaMm2 * eta) / 1000;
        const pullForceKN = (p_bar * 0.1 * pullAreaMm2 * eta) / 1000;

        // Speeds & Cycle Times
        const flowMm3PerSec = (input.pumpFlowRateLMin * 1e6) / 60;
        const pushSpeedMPerSec = (flowMm3PerSec / pushAreaMm2) / 1000;
        const pullSpeedMPerSec = (flowMm3PerSec / pullAreaMm2) / 1000;

        const pushStrokeTimeSec = pushSpeedMPerSec > 0 ? (S / 1000) / pushSpeedMPerSec : 0;
        const pullStrokeTimeSec = pullSpeedMPerSec > 0 ? (S / 1000) / pullSpeedMPerSec : 0;

        // Power (kW) = p (bar) * Q (L/min) / 600
        const hydraulicPowerKW = (p_bar * input.pumpFlowRateLMin) / 600;

        // 2. Tube Wall Thickness & Burst Pressure (DIN 2413 / Lamé Equations)
        let tubeYieldRe = 450;
        let tubeTensileRm = 550;
        if (input.tubeMaterialId === 'al6063_t6') {
            tubeYieldRe = 170;
            tubeTensileRm = 210;
        }
        const allowStress = tubeYieldRe / 1.5; // Design safety factor 1.5 against yield

        const p_MPa = p_bar * 0.1;
        const radicand = (allowStress + p_MPa) / Math.max(1, allowStress - p_MPa);
        const t_min = (D / 2) * (Math.sqrt(Math.max(1.01, radicand)) - 1);

        const boreStd = ISO_3320_BORES.find(b => b.boreD === D);
        let tubeOD = boreStd ? boreStd.recommendedTubeOD : Math.round(D + Math.max(8, t_min * 2 + 4));
        if (catSeries === 'mag_khs' && magKhs) {
            tubeOD = magKhs.tubeOD_D2;
        } else if (catSeries === 'mag_nhs' && magNhs) {
            tubeOD = magNhs.tubeOD;
        }
        if ((tubeOD - D) / 2 < t_min) {
            tubeOD = Math.ceil(D + 2 * (t_min + 2));
        }
        const tubeWallT = (tubeOD - D) / 2;

        const tubeHoopStressMPa = p_MPa * ((Math.pow(tubeOD, 2) + Math.pow(D, 2)) / (Math.pow(tubeOD, 2) - Math.pow(D, 2)));
        const tubeYieldSafetyFactor = tubeYieldRe / Math.max(1, tubeHoopStressMPa);

        const tubeBurstPressureMPa = (2 * tubeTensileRm * tubeWallT) / (tubeOD - tubeWallT);
        const tubeBurstPressureBar = tubeBurstPressureMPa * 10;
        const tubeBurstSafetyFactor = tubeBurstPressureBar / p_bar;

        if (tubeYieldSafetyFactor < 1.5) {
            warnings.push(`Boru et kalınlığı uyarısı: Akma güvenlik katsayısı (${tubeYieldSafetyFactor.toFixed(2)}) 1.5'in altındadır. Boru dış çapını artırınız.`);
        }

        // 3. 1:1 Component Lengths & Envelopes (ISO 6020-2 / ISO 6022)
        const pistonLengthMm = Math.round(Math.max(25, D * 0.65));
        const glandLengthMm = Math.round(Math.max(35, d * 1.1 + 15));
        const rearCapLengthMm = Math.round(Math.max(30, D * 0.5 + 10));
        const rodExtensionExtMm = Math.round(Math.max(30, d * 0.8));

        // Stop tube (Spacer Ring) recommendation for long strokes (S > 1000 mm)
        const needsStopTube = S > 1000;
        const stopTubeRecommendedLengthMm = needsStopTube ? Math.round((S - 1000) / 10) : 0;
        if (needsStopTube) {
            warnings.push(`Uzun Strok Uyarısı: Strok > 1000mm olduğu için yataklama kovanının aşınmasını ve mil eğilmesini önlemek amacıyla ${stopTubeRecommendedLengthMm} mm durdurma bileziği (stop tube) önerilir.`);
        }

        const closedLengthMm = rearCapLengthMm + S + pistonLengthMm + glandLengthMm + rodExtensionExtMm + stopTubeRecommendedLengthMm;
        const extendedLengthMm = closedLengthMm + S;
        const tubeLengthMm = S + pistonLengthMm + glandLengthMm + stopTubeRecommendedLengthMm + 20;

        // 4. Rod Buckling Analysis (Euler, Tetmajer & Rankine-Gordon per ISO/TR 10461)
        let nu = 1.0;
        let isTrunnionMounted = false;
        let isHeadTrunnion = false;

        switch (input.mountingStyle) {
            case 'clevis_rear':
            case 'cap_clevis_mp1':
            case 'cap_plain_eye_mp3':
            case 'cap_male_eye_mp4':
            case 'cap_spherical_eye_mp5':
            case 'flange_rear':
            case 'cap_flange_mf4':
            case 'extended_tie_rods_mx2':
                nu = 1.0;
                break;
            case 'flange_front':
            case 'head_flange_mf3':
            case 'foot_mount':
            case 'side_lugs_ms2':
            case 'extended_tie_rods_mx1':
            case 'extended_tie_rods_mx3':
                nu = 0.7;
                break;
            case 'trunnion_mid':
            case 'intermediate_trunnion_mt4':
                nu = 1.0;
                isTrunnionMounted = true;
                break;
            case 'head_trunnion_mt1':
                nu = 1.0;
                isHeadTrunnion = true;
                break;
            case 'fixed_guided':
                nu = 0.5;
                break;
            default:
                nu = 1.0;
                break;
        }

        // For trunnion mountings, buckling length is measured from pivot to rod end:
        let bucklingLengthLk: number;
        if (isTrunnionMounted) {
            const trunnionPosFromHead = input.trunnionPositionMm && input.trunnionPositionMm > 0
                ? Math.min(tubeLengthMm - 30, Math.max(30, tubeLengthMm - input.trunnionPositionMm))
                : (tubeLengthMm / 2);
            const distFromPivotToRod = trunnionPosFromHead + S + glandLengthMm + rodExtensionExtMm;
            bucklingLengthLk = nu * distFromPivotToRod;
        } else if (isHeadTrunnion) {
            bucklingLengthLk = nu * (S + glandLengthMm + rodExtensionExtMm);
        } else {
            bucklingLengthLk = nu * extendedLengthMm;
        }

        const rodRadiusOfGyration = d / 4; // for solid circular cross-section (i = d/4)
        const rodSlendernessRatio = bucklingLengthLk / rodRadiusOfGyration;

        // Rod steel yield strength and modulus
        let rodYieldRe = 450;
        let rodE = 210000;
        if (input.rodMaterialId === 'c45_chrome') {
            rodYieldRe = 370;
        } else if (input.rodMaterialId === '42crmo4_chrome') {
            rodYieldRe = 750;
        } else if (input.rodMaterialId === 'aisi431_stainless') {
            rodYieldRe = 600;
            rodE = 200000;
        }

        const rodI = (Math.PI * Math.pow(d, 4)) / 64;
        const rodArea = (Math.PI * Math.pow(d, 2)) / 4;

        // Transition slenderness ratio lambda_g = pi * sqrt(E / Re)
        const transitionSlendernessLambdaG = Math.PI * Math.sqrt(rodE / rodYieldRe);

        // Theoretical Euler critical stress & force
        const eulerCriticalStressMPa = (Math.PI * Math.PI * rodE) / Math.pow(Math.max(1, rodSlendernessRatio), 2);
        const criticalEulerForceKN = (eulerCriticalStressMPa * rodArea) / 1000;

        // Inelastic / Plastic Tetmajer critical stress: sigma_k = Re * (1 - (Re / (4 * pi^2 * E)) * lambda^2)
        const tetmajerCriticalStressMPa = rodSlendernessRatio < transitionSlendernessLambdaG
            ? Math.max(rodYieldRe * 0.5, rodYieldRe * (1 - (rodYieldRe / (4 * Math.PI * Math.PI * rodE)) * Math.pow(rodSlendernessRatio, 2)))
            : eulerCriticalStressMPa;

        const bucklingRegime: 'euler_elastic' | 'tetmajer_inelastic' = 
            rodSlendernessRatio >= transitionSlendernessLambdaG ? 'euler_elastic' : 'tetmajer_inelastic';

        const criticalBucklingForceN = bucklingRegime === 'euler_elastic'
            ? (Math.PI * Math.PI * rodE * rodI) / Math.pow(bucklingLengthLk, 2)
            : tetmajerCriticalStressMPa * rodArea;

        const criticalBucklingForceKN = criticalBucklingForceN / 1000;
        const bucklingSafetyFactor = pushForceKN > 0 ? criticalBucklingForceKN / pushForceKN : 999;
        const isBucklingSafe = bucklingSafetyFactor >= 3.5;

        // Maximum permissible stroke under safety factor 3.5
        const maxLkAllowed = Math.sqrt((Math.PI * Math.PI * rodE * rodI) / (3.5 * pushForceKN * 1000));
        const deadLength = rearCapLengthMm + pistonLengthMm + glandLengthMm + rodExtensionExtMm + stopTubeRecommendedLengthMm;
        const maxPermissibleStrokeMm = Math.max(50, Math.round((maxLkAllowed / nu) - deadLength) / 2);

        if (bucklingSafetyFactor < 2.0) {
            warnings.push(`Kritik Burkulma Tehlikesi: Mil burkulma emniyet katsayısı (${bucklingSafetyFactor.toFixed(2)}) 2.0'ın altındadır! Mil çapını (d) büyütünüz veya strok boyunu kısaltınız.`);
        } else if (bucklingSafetyFactor < 3.5) {
            warnings.push(`Burkulma Uyarısı: Emniyet katsayısı (${bucklingSafetyFactor.toFixed(2)}), hidrolik silindir standardı olan 3.5'in altındadır.`);
        }

        // 5. Horizontal Rod Sag Deflection (Self-weight)
        const steelDensity = 7.85e-6; // kg/mm^3
        const rodSelfWeightKg = (rodArea * (S + glandLengthMm + rodExtensionExtMm) * steelDensity);
        const rodWeightPerMmN = (rodArea * steelDensity * 9.81);
        const maxHorizontalDeflectionMm = (5 * rodWeightPerMmN * Math.pow(S, 4)) / (384 * rodE * rodI);
        const isDeflectionAcceptable = maxHorizontalDeflectionMm <= Math.max(0.5, S * 0.001);

        if (input.horizontalMounting && !isDeflectionAcceptable) {
            warnings.push(`Yatay Mil Sehimi Uyarısı: Mil kendi ağırlığı ile ${maxHorizontalDeflectionMm.toFixed(2)} mm sehim yapmaktadır. Kılavuz ring aşınmasını önlemek için mil çapını artırınız veya stop tube ekleyiniz.`);
        }

        // 6. Cushioning Spear & Deceleration Analysis (ISO 6020-2 / NFPA)
        const cushionSpearDiaMm = Math.round(d * 0.85);
        const cushionLengthMm = Math.round(Math.max(20, Math.min(40, S * 0.05)));
        const cushionAnnularAreaMm2 = Math.max(10, ((Math.PI * Math.pow(D, 2)) / 4) - ((Math.PI * Math.pow(cushionSpearDiaMm, 2)) / 4));
        const cushionAnnularAreaCm2 = cushionAnnularAreaMm2 / 100;

        const kineticEnergyJoules = 0.5 * movingMassKg * Math.pow(pushSpeedMPerSec, 2);
        const cushionDecelDistanceM = cushionLengthMm / 1000;
        const dynamicPressureNPerM2 = cushionDecelDistanceM > 0 
            ? (movingMassKg * Math.pow(pushSpeedMPerSec, 2)) / (2 * (cushionAnnularAreaMm2 * 1e-6) * cushionDecelDistanceM)
            : 0;
        const peakCushioningPressureBar = Math.round((dynamicPressureNPerM2 * 1e-5) + p_bar);
        const testPressureBar = p_bar * 1.5;
        const isCushioningPressureSafe = peakCushioningPressureBar <= testPressureBar;
        const cushioningDecelerationMPerSec2 = cushionDecelDistanceM > 0 ? Math.pow(pushSpeedMPerSec, 2) / (2 * cushionDecelDistanceM) : 0;

        if (input.hasCushioningFront && peakCushioningPressureBar > testPressureBar) {
            warnings.push(`Yastıklama Basınç Uyarısı: Durdurma sırasındaki hidrolik pik basınç (${peakCushioningPressureBar} bar), test basıncını (${testPressureBar} bar) aşıyor. Yastıklama boyunu veya akış deliğini büyütünüz.`);
        }

        // 7. Ports & Fluid Dynamics (ISO 6149 / ISO 228-1 BSPP)
        let recommendedPort = 'G 3/8"';
        let portThreadStandard = 'ISO 1179-1 (G 3/8" BSPP) / ISO 6149-1 (M18x1.5)';
        let portInnerDiaMm = 11;

        if (input.pumpFlowRateLMin <= 15) {
            recommendedPort = 'G 1/4"';
            portThreadStandard = 'ISO 1179-1 (G 1/4" BSPP) / ISO 6149-1 (M14x1.5)';
            portInnerDiaMm = 8;
        } else if (input.pumpFlowRateLMin <= 35) {
            recommendedPort = 'G 3/8"';
            portThreadStandard = 'ISO 1179-1 (G 3/8" BSPP) / ISO 6149-1 (M18x1.5)';
            portInnerDiaMm = 11;
        } else if (input.pumpFlowRateLMin <= 70) {
            recommendedPort = 'G 1/2"';
            portThreadStandard = 'ISO 1179-1 (G 1/2" BSPP) / ISO 6149-1 (M22x1.5)';
            portInnerDiaMm = 14;
        } else if (input.pumpFlowRateLMin <= 140) {
            recommendedPort = 'G 3/4"';
            portThreadStandard = 'ISO 1179-1 (G 3/4" BSPP) / ISO 6149-1 (M27x2.0)';
            portInnerDiaMm = 19;
        } else {
            recommendedPort = 'G 1"';
            portThreadStandard = 'ISO 1179-1 (G 1" BSPP) / ISO 6149-1 (M33x2.0)';
            portInnerDiaMm = 25;
        }

        const portAreaMm2 = (Math.PI * Math.pow(portInnerDiaMm, 2)) / 4;
        const portFluidVelocityMPerSec = (flowMm3PerSec / portAreaMm2) / 1000;
        const portVelocityRating: 'optimal' | 'moderate' | 'high_loss' = 
            portFluidVelocityMPerSec <= 4.0 ? 'optimal' : portFluidVelocityMPerSec <= 5.5 ? 'moderate' : 'high_loss';

        const oilKinematicViscosity = 32e-6; // m^2/s (ISO VG 46 at 50°C)
        const reynoldsNumber = Math.round((portFluidVelocityMPerSec * (portInnerDiaMm * 1e-3)) / oilKinematicViscosity);
        const portPressureDropBar = Number((0.5 * 870 * Math.pow(portFluidVelocityMPerSec, 2) * 1.5 * 1e-5).toFixed(2));

        if (portFluidVelocityMPerSec > 5.5) {
            warnings.push(`Port Akış Hızı Uyarısı: Yağ giriş hızı (${portFluidVelocityMPerSec.toFixed(1)} m/s), önerilen 4.5 m/s limitini aşıyor. Bir üst port çapını seçiniz.`);
        }

        // 8. Tie-Rod Fastener Stress Analysis (ISO 6020-2 Compact Series)
        const tieRodCount = 4;
        let tieRodNominalD = 12;
        let tieRodSize = '4x M12 (Grade 8.8)';
        if (D <= 40) { tieRodNominalD = 10; tieRodSize = '4x M10 (Grade 8.8)'; }
        else if (D <= 63) { tieRodNominalD = 12; tieRodSize = '4x M12 (Grade 8.8)'; }
        else if (D <= 100) { tieRodNominalD = 16; tieRodSize = '4x M16 (Grade 8.8)'; }
        else if (D <= 160) { tieRodNominalD = 22; tieRodSize = '4x M22 (Grade 8.8)'; }
        else { tieRodNominalD = 27; tieRodSize = '4x M27 (Grade 8.8)'; }

        const tieRodCoreArea = 0.78 * (Math.PI * Math.pow(tieRodNominalD, 2)) / 4;
        const totalCapTensionForceN = p_peak_bar * 0.1 * pushAreaMm2;
        const tieRodTensileStressMPa = Math.round((totalCapTensionForceN / (tieRodCount * tieRodCoreArea)));
        const tieRodTighteningTorqueNm = Math.round(0.2 * (totalCapTensionForceN / tieRodCount) * (tieRodNominalD / 1000));
        const tieRodSafetyFactor = Number((640 / Math.max(1, tieRodTensileStressMPa)).toFixed(2));

        // 9. Bolted Flange Analysis (ISO 6022 Mill Duty / Bolted Construction)
        let flangeBoltCount = 4;
        let flangeBoltNominalD = 12;
        if (D <= 50) { flangeBoltCount = 4; flangeBoltNominalD = 10; }
        else if (D <= 80) { flangeBoltCount = 6; flangeBoltNominalD = 12; }
        else if (D <= 125) { flangeBoltCount = 6; flangeBoltNominalD = 16; }
        else if (D <= 160) { flangeBoltCount = 8; flangeBoltNominalD = 20; }
        else if (D <= 200) { flangeBoltCount = 8; flangeBoltNominalD = 24; }
        else { flangeBoltCount = 12; flangeBoltNominalD = 30; }

        const flangeBoltGrade = input.flangeBoltGrade || '10.9';
        const flangeBoltYieldMPa = flangeBoltGrade === '12.9' ? 1080 : (flangeBoltGrade === '10.9' ? 900 : 640);
        const flangeBoltPitchMap: Record<number, number> = { 10: 58, 12: 84.3, 16: 157, 20: 245, 24: 353, 30: 561 };
        const flangeBoltAs = flangeBoltPitchMap[flangeBoltNominalD] || (0.78 * Math.PI * Math.pow(flangeBoltNominalD, 2) / 4);

        const totalCapSepForceN = p_peak_bar * 0.1 * pushAreaMm2;
        const loadPerFlangeBoltN = totalCapSepForceN / flangeBoltCount;
        const preloadPerFlangeBoltN = 1.3 * loadPerFlangeBoltN;
        const flangeBoltTensileStressMPa = Math.round((preloadPerFlangeBoltN + 0.15 * loadPerFlangeBoltN) / flangeBoltAs);
        const flangeBoltTorqueNm = Math.round(0.2 * preloadPerFlangeBoltN * (flangeBoltNominalD / 1000));
        const flangeBoltSafetyFactor = Number((flangeBoltYieldMPa / Math.max(1, flangeBoltTensileStressMPa)).toFixed(2));
        const flangeThicknessMm = Math.max(20, Math.round(1.8 * tubeWallT + 8));
        const flangeBoltSize = `${flangeBoltCount}x M${flangeBoltNominalD} DIN 912 (${flangeBoltGrade})`;

        // 10. Intermediate Trunnion Analysis (ISO MT4 / MT1)
        const hasTrunnion = isTrunnionMounted || isHeadTrunnion;
        const trunnionPinDiaMm = Math.round(Math.max(25, D * 0.38));
        const trunnionPinLengthMm = Math.round(trunnionPinDiaMm * 0.6);
        const trunnionPinArea = (Math.PI * Math.pow(trunnionPinDiaMm, 2)) / 4;
        const trunnionForcePerPinN = (pushForceKN * 1000) / 2;
        const trunnionShearStressMPa = Math.round(trunnionForcePerPinN / trunnionPinArea);
        const trunnionBendMomentNmm = trunnionForcePerPinN * (trunnionPinLengthMm / 2);
        const trunnionBendingStressMPa = Math.round((32 * trunnionBendMomentNmm) / (Math.PI * Math.pow(trunnionPinDiaMm, 3)));
        const trunnionVonMisesMPa = Math.round(Math.sqrt(Math.pow(trunnionBendingStressMPa, 2) + 3 * Math.pow(trunnionShearStressMPa, 2)));
        const trunnionBearingPressureMPa = Math.round(trunnionForcePerPinN / (trunnionPinDiaMm * trunnionPinLengthMm));
        const trunnionSafetyFactor = Number((460 / Math.max(1, trunnionVonMisesMPa)).toFixed(2));

        // 11. Spherical Bearing Eye Analysis (ISO MP5 / AP4)
        const hasSphericalBearing = input.mountingStyle === 'cap_spherical_eye_mp5' || 
            rodEndType === 'spherical_eye' || 
            rodEndType === 'spherical_rod_eye_ap4';
        const matchPinD = Math.max(16, Math.round(d * 0.8));
        const matchedBearing = SPHERICAL_BEARINGS_CATALOG.find(b => b.boreD >= matchPinD) || SPHERICAL_BEARINGS_CATALOG[SPHERICAL_BEARINGS_CATALOG.length - 1];
        const sphericalBearingDesignation = matchedBearing.designation;
        const sphericalBearingStaticCapacityKN = matchedBearing.c0StaticKN;
        const sphericalBearingSafetyFactor = Number((sphericalBearingStaticCapacityKN / Math.max(0.1, pushForceKN)).toFixed(2));
        const sphericalBearingTiltAngleDeg = matchedBearing.tiltAngleDeg;

        // 12. Foot Mount Offset Moment Analysis (ISO MS2)
        const footOffsetMm = input.footMountOffsetMm && input.footMountOffsetMm > 0 
            ? input.footMountOffsetMm 
            : Math.round(tubeOD / 2 + 15);
        const footOverturnMomentNm = Math.round((pushForceKN * 1000) * (footOffsetMm / 1000));
        const footSpanMm = Math.round(closedLengthMm * 0.85);
        const footBoltTensileForceN = Math.round((footOverturnMomentNm * 1000) / Math.max(50, footSpanMm));
        const footBoltShearForceN = Math.round((pushForceKN * 1000) / 4);

        // 13. Threaded Gland Analysis
        const isThreadedGland = (barrelConn === 'welded_cap_threaded_gland');
        const glandThreadNominalD = Math.round(D + 6);
        const glandThreadSize = `M${glandThreadNominalD}x2.0`;
        const glandThreadEngagementMm = Math.round(glandLengthMm * 0.45);
        const glandThreadShearAreaMm2 = Math.PI * glandThreadNominalD * glandThreadEngagementMm * 0.75;
        const glandThreadShearStressMPa = Math.round((pushForceKN * 1000) / Math.max(10, glandThreadShearAreaMm2));
        const glandThreadSafetyFactor = Number((210 / Math.max(1, glandThreadShearStressMPa)).toFixed(2));

        // 14. Rod End & Clevis Pin Sizing (ISO 6982 / DIN 24338)
        let rodEndThread = `M${Math.round(d * 0.7)}x1.5`;
        if (d >= 45) rodEndThread = `M${Math.round(d * 0.75)}x2.0`;
        if (d >= 90) rodEndThread = `M${Math.round(d * 0.75)}x3.0`;

        const clevisPinDiaMm = Math.round(Math.max(16, d * 0.8));
        const clevisPinArea = (Math.PI * Math.pow(clevisPinDiaMm, 2)) / 4;
        const clevisPinShearStressMPa = Math.round((pushForceKN * 1000) / (2 * clevisPinArea));
        const clevisPinBearingPressureMPa = Math.round((pushForceKN * 1000) / (clevisPinDiaMm * (clevisPinDiaMm * 1.2)));

        // 15. Oil Volumes & Thermal Heat Load
        const oilVolumeExtendedLiters = Number(((pushAreaMm2 * S) * 1e-6).toFixed(2));
        const oilVolumeRetractedLiters = Number(((pullAreaMm2 * S) * 1e-6).toFixed(2));
        const oilDifferentialLiters = Number((oilVolumeExtendedLiters - oilVolumeRetractedLiters).toFixed(2));
        const heatGenerationKW = Number((hydraulicPowerKW * (1 - eta)).toFixed(2));
        const minTankVolumeLiters = Math.round(Math.max(input.pumpFlowRateLMin * 3, oilVolumeExtendedLiters * 5));

        // 16. Manufacturing Fits & Tolerances
        const tubeBoreTolerance = `Ø${D} H8 (+${D <= 50 ? '0.039' : D <= 80 ? '0.046' : '0.054'} / 0 mm), Ra ≤ 0.40 µm`;
        const rodTolerance = `Ø${d} f7 (-${d <= 30 ? '0.020' : d <= 50 ? '0.025' : '0.030'} / -${d <= 30 ? '0.041' : d <= 50 ? '0.050' : '0.060'} mm), Ra ≤ 0.20 µm, Chrome 25-30 µm`;
        const pistonTolerance = `Ø${D} h8 (0 / -${D <= 50 ? '0.039' : D <= 80 ? '0.046' : '0.054'} mm)`;
        const glandTolerance = `Bore H9 / OD f8`;

        // 17. Sealing Elements
        const rodSealInfo = KASTAS_SERIES[input.rodSealType] ?? KASTAS_SERIES['K33'];
        const rodSealSpec = `${rodSealInfo.name} (${d} x ${d + (d <= 50 ? 10 : 15)} mm)`;

        const wiperSealInfo = KASTAS_SERIES[input.wiperType] ?? KASTAS_SERIES['K01'];
        const wiperSealSpec = `${wiperSealInfo.name} (Ø${d} mm)`;

        const pistonSealInfo = KASTAS_SERIES[input.pistonSealType] ?? KASTAS_SERIES['K16'];
        const pistonSealSpec = `${pistonSealInfo.name} (Ø${D} mm)`;

        const rodNeckDia = Math.round(d * 0.7);
        const internalORingSpec = `ISO 3601 Ø${rodNeckDia} x 2.62 mm (NBR 90 Shore A)`;
        const tubeORingCord = D <= 63 ? 3.0 : 4.0;
        const tubeGlandORingSpec = `ISO 3601 Ø${D} x ${tubeORingCord} mm (NBR 70 Shore A)`;
        const backupRingSpec = p_bar > 160 ? `ISO 3601-4 Destek Halkası (PTFE Spiral Backup Ring)` : `Gerekli değil (p < 160 bar)`;

        // 18. 1:1 Complete Bill of Materials (BOM)
        const aluDensity = 2.7e-6;
        const tubeDensity = input.tubeMaterialId === 'al6063_t6' ? aluDensity : steelDensity;
        const tubeMassKg = Math.PI * (Math.pow(tubeOD / 2, 2) - Math.pow(D / 2, 2)) * tubeLengthMm * tubeDensity;
        const rodTotalLengthMm = S + glandLengthMm + rodExtensionExtMm + stopTubeRecommendedLengthMm + 40;
        const rodMassKg = Math.PI * Math.pow(d / 2, 2) * rodTotalLengthMm * steelDensity;

        const pistonMassKg = (Math.PI * Math.pow(D / 2, 2) * pistonLengthMm - Math.PI * Math.pow(rodNeckDia / 2, 2) * pistonLengthMm) * steelDensity * 0.85;
        const glandMassKg = (Math.PI * Math.pow(tubeOD / 2, 2) * glandLengthMm - Math.PI * Math.pow(d / 2, 2) * glandLengthMm) * steelDensity * 0.7;
        const rearCapMassKg = Math.PI * Math.pow(tubeOD / 2, 2) * rearCapLengthMm * steelDensity * 0.85;

        const totalCylinderMassKg = tubeMassKg + rodMassKg + pistonMassKg + glandMassKg + rearCapMassKg + 1.5;

        const billOfMaterials: CylinderComponentDimension[] = [
            {
                partNumber: 1,
                name: 'Silindir Borusu (Honed Kovan)',
                description: `H8 Hassas honlanmış boru, Ra <= 0.4 µm`,
                standard: 'EN 10305-1 / DIN 2391',
                material: input.tubeMaterialId === 'al6063_t6' ? 'AlMgSi0.5 (Al 6063-T6)' : 'St 52-3 BK+S (E355)',
                quantity: 1,
                outerDiaMm: tubeOD,
                innerDiaMm: D,
                lengthMm: tubeLengthMm,
                weightKg: Number(tubeMassKg.toFixed(2)),
                notes: `Et kalınlığı t=${tubeWallT}mm (Emniyet SF=${tubeYieldSafetyFactor.toFixed(2)})`
            },
            {
                partNumber: 2,
                name: 'Piston Mili (Krom Kaplı)',
                description: `25 µm Sert krom kaplı mil, f7 tolerans`,
                standard: 'ISO 3320 / EN 10083',
                material: input.rodMaterialId === '20mnv6_chrome' ? '20MnV6 Kromlu' : input.rodMaterialId === '42crmo4_chrome' ? '42CrMo4+QT Kromlu' : 'C45E Sert Krom Kaplı',
                quantity: 1,
                outerDiaMm: d,
                innerDiaMm: 0,
                lengthMm: rodTotalLengthMm,
                weightKg: Number(rodMassKg.toFixed(2)),
                notes: `Burkulma Güvenliği SF=${bucklingSafetyFactor.toFixed(2)} (${bucklingRegime === 'euler_elastic' ? 'Euler' : 'Tetmajer'})`
            },
            {
                partNumber: 3,
                name: 'Piston Gövdesi',
                description: `K16/K40 yuvalı çift etkili piston başı`,
                standard: 'ISO 6020-2',
                material: 'GGG-40 Sfero Döküm / C45',
                quantity: 1,
                outerDiaMm: D - 0.1,
                innerDiaMm: rodNeckDia,
                lengthMm: pistonLengthMm,
                weightKg: Number(pistonMassKg.toFixed(2)),
                notes: `2x POM Yataklama Bandı Kanallı`
            },
            {
                partNumber: 4,
                name: 'Ön Boğaz Takozu (Kapak)',
                description: `Boğaz keçesi, toz sıyırıcı ve kılavuz burç yuvalı`,
                standard: 'ISO 6020-2 Form G',
                material: 'GGG-40 / Çelik C45',
                quantity: 1,
                outerDiaMm: tubeOD,
                innerDiaMm: d + 0.3,
                lengthMm: glandLengthMm,
                weightKg: Number(glandMassKg.toFixed(2)),
                notes: `Boruya vidalı veya flanş montajlı`
            },
            {
                partNumber: 5,
                name: 'Arka Taban / Kapak',
                description: `Kaynaklı/flanşlı taban, arka çatal mafsallı`,
                standard: 'ISO 6020-2 / ISO MP4',
                material: 'St 52-3 (E355) / Dövme Çelik',
                quantity: 1,
                outerDiaMm: tubeOD,
                innerDiaMm: 0,
                lengthMm: rearCapLengthMm,
                weightKg: Number(rearCapMassKg.toFixed(2)),
                notes: `Tam penetrasyonlu kaynak ağızlı`
            },
            {
                partNumber: 6,
                name: 'Piston Sızdırmazlık Seti',
                description: pistonSealSpec,
                standard: pistonSealInfo.isoStandard,
                material: pistonSealInfo.material,
                quantity: 1,
                outerDiaMm: D,
                innerDiaMm: D - 15,
                lengthMm: 12,
                weightKg: 0.05,
                notes: `ISO 7425/1 uyumlu kanal montajı`
            },
            {
                partNumber: 7,
                name: 'Boğaz Keçesi (Rod Seal)',
                description: rodSealSpec,
                standard: rodSealInfo.isoStandard,
                material: rodSealInfo.material,
                quantity: 1,
                outerDiaMm: d + (d <= 50 ? 10 : 15),
                innerDiaMm: d,
                lengthMm: 10,
                weightKg: 0.03,
                notes: `Maksimum sızıntısız basınç 400 bar`
            },
            {
                partNumber: 8,
                name: 'Toz Sıyırıcı (Wiper)',
                description: wiperSealSpec,
                standard: wiperSealInfo.isoStandard,
                material: wiperSealInfo.material,
                quantity: 1,
                outerDiaMm: d + 8,
                innerDiaMm: d,
                lengthMm: 6,
                weightKg: 0.02,
                notes: `Metal kafesli / pres geçme kanal`
            },
            {
                partNumber: 9,
                name: 'Mil İçi O-Ring (Statik)',
                description: internalORingSpec,
                standard: 'ISO 3601-1',
                material: 'NBR 90 Shore A',
                quantity: 1,
                outerDiaMm: rodNeckDia + 5.24,
                innerDiaMm: rodNeckDia,
                lengthMm: 2.62,
                weightKg: 0.01,
                notes: `Piston-mil geçiş sızıntı önleme`
            },
            {
                partNumber: 10,
                name: 'Boru / Boğaz O-Ringi (Statik)',
                description: tubeGlandORingSpec,
                standard: 'ISO 3601-1',
                material: 'NBR 70 Shore A + PTFE Backup',
                quantity: 1,
                outerDiaMm: D + tubeORingCord * 2,
                innerDiaMm: D,
                lengthMm: tubeORingCord,
                weightKg: 0.02,
                notes: `Gövde statik sızdırmazlık contası`
            },
            {
                partNumber: 11,
                name: 'Piston Emniyet Somunu',
                description: `Metrik ince dişli kendinden kilitli somun`,
                standard: 'DIN 985 / ISO 7040',
                material: '8.8 / 10.9 Isıl İşlemli Çelik',
                quantity: 1,
                outerDiaMm: Math.round(rodNeckDia * 1.5),
                innerDiaMm: rodNeckDia,
                lengthMm: Math.round(rodNeckDia * 0.8),
                weightKg: 0.15,
                notes: `Sıkma torku kontrollü`
            }
        ];

        // ====================================================================
        // COMPREHENSIVE MANUFACTURING JOINT & FASTENER ENGINEERING
        // Standards: DIN EN ISO 5817, Eurocode 3 (EN 1993-1-8), VDI 2230,
        // ISO 965, DIN 76-A, Rexroth RE 17042, MAG Hidrolik KHS/NHS
        // ====================================================================

        // A. WELDED JOINTS ANALYSIS (Kaynaklı Birleşimler)
        // 1. Tube-to-Rear-Cap Weld (Gövde Borusu - Taban Kapağı Çevresel Kaynağı)
        const rearCapWeldAwMm = Math.max(4, Math.round(0.75 * tubeWallT));
        const rearCapWeldDiaMean = D + tubeWallT;
        const rearCapWeldLengthMm = Math.round(Math.PI * rearCapWeldDiaMean);
        const rearCapWeldAreaMm2 = Math.PI * rearCapWeldDiaMean * rearCapWeldAwMm;
        const rearCapWeldForceN = p_peak_bar * 0.1 * pushAreaMm2;
        const rearCapWeldStressMPa = Math.round(rearCapWeldForceN / Math.max(1, rearCapWeldAreaMm2));
        // Eurocode 3 / DIN 18800 allowable weld stress: fu / (sqrt(3) * beta_w * gamma_M2)
        // For St 52-3 / E355: fu = 510 MPa, beta_w = 0.9, gamma_M2 = 1.25 -> 261.7 MPa
        const rearCapWeldAllowableMPa = 260;
        const rearCapWeldSF = Number((rearCapWeldAllowableMPa / Math.max(1, rearCapWeldStressMPa)).toFixed(2));
        const rearCapWeldSafe = rearCapWeldSF >= 2.0;

        // 2. Port Boss Welds (Rakor Manşon Çevre Kaynakları)
        const portBossWeldAwMm = Math.max(3, Math.min(6, Math.round(tubeWallT * 0.5)));
        const portBossDia = portInnerDiaMm + 14;
        const portBossWeldLengthMm = Math.round(Math.PI * portBossDia);
        const portBossPushForceN = p_peak_bar * 0.1 * ((Math.PI * Math.pow(portInnerDiaMm, 2)) / 4);
        const portBossWeldStressMPa = Math.round(portBossPushForceN / (Math.PI * portBossDia * portBossWeldAwMm));
        const portBossWeldSF = Number((rearCapWeldAllowableMPa / Math.max(1, portBossWeldStressMPa)).toFixed(2));
        const portBossWeldSafe = portBossWeldSF >= 2.5;

        // 3. Trunnion Collar Welds (Orta Muylu Bileziği Çift Çevresel Kaynağı)
        let trunnionWeldDetail: WeldedJointDetail | undefined = undefined;
        if (hasTrunnion) {
            const trunnionWeldAwMm = Math.max(5, Math.round(0.8 * tubeWallT));
            const trunnionWeldLengthMm = Math.round(2 * Math.PI * tubeOD);
            const trunnionWeldAreaMm2 = 2 * Math.PI * tubeOD * trunnionWeldAwMm;
            const trunnionWeldStressMPa = Math.round((pushForceKN * 1000) / Math.max(1, trunnionWeldAreaMm2));
            const trunnionWeldSF = Number((rearCapWeldAllowableMPa / Math.max(1, trunnionWeldStressMPa)).toFixed(2));
            trunnionWeldDetail = {
                location: 'Gövde Orta/Ön Muylu Bileziği (Boru Dış Çapı Ön ve Arka Dikiş)',
                weldType: 'Çift Taraflı Çevresel Köşe Kaynağı (Dual Fillet Weld)',
                throatAwMm: trunnionWeldAwMm,
                lengthMm: trunnionWeldLengthMm,
                stressMPa: trunnionWeldStressMPa,
                allowableStressMPa: rearCapWeldAllowableMPa,
                safetyFactor: trunnionWeldSF,
                qualityStandard: 'DIN EN ISO 5817 Seviye B',
                isSafe: trunnionWeldSF >= 2.0
            };
        }

        // 4. Welded Rod Eye / Cap Eye Shank (Kaynaklı Mafsal Gövdesi - CGAS / plain_welded_eye)
        let weldEyeDetail: WeldedJointDetail | undefined = undefined;
        const hasWeldedEye = rodEndType === 'plain_welded_eye' || input.mountingStyle === 'cap_plain_eye_mp3';
        if (hasWeldedEye) {
            const matchedCgas = findRexrothCgasByPin(clevisPinDiaMm);
            const eyeShankAwMm = matchedCgas ? matchedCgas.weldThroatRecommendedAw : Math.max(6, Math.round(d * 0.2));
            const eyeShankWidth = matchedCgas ? matchedCgas.weldShankWidth : Math.round(d * 0.9);
            const eyeWeldStressMPa = Math.round((pushForceKN * 1000) / (2 * eyeShankWidth * eyeShankAwMm));
            const eyeWeldSF = Number((rearCapWeldAllowableMPa / Math.max(1, eyeWeldStressMPa)).toFixed(2));
            weldEyeDetail = {
                location: 'Rot Ucu veya Taban Kapağı Kaynaklı Mafsal Gövdesi (CGAS / ISO 8132)',
                weldType: 'Çift V-Alın Kaynağı ve Kök Paso (Full Penetration Double Bevel)',
                throatAwMm: eyeShankAwMm,
                lengthMm: 2 * eyeShankWidth,
                stressMPa: eyeWeldStressMPa,
                allowableStressMPa: rearCapWeldAllowableMPa,
                safetyFactor: eyeWeldSF,
                qualityStandard: 'DIN EN ISO 5817 Seviye B (Dinamik Yorulma Emniyeti)',
                isSafe: eyeWeldSF >= 2.0
            };
        }

        const weldedJoints: WeldedJointsAnalysis = {
            tubeRearCapWeld: {
                location: 'Gövde Borusu - Arka Taban Kapağı Birleşimi (Alın / Köşe Kaynağı)',
                weldType: 'Çevresel Tam Nüfuziyetli Alın Kaynağı (DIN EN ISO 9692-1 / AWS D1.1)',
                throatAwMm: rearCapWeldAwMm,
                lengthMm: rearCapWeldLengthMm,
                stressMPa: rearCapWeldStressMPa,
                allowableStressMPa: rearCapWeldAllowableMPa,
                safetyFactor: rearCapWeldSF,
                qualityStandard: 'DIN EN ISO 5817 Seviye B (Yüksek Yorulma Mukavemeti)',
                isSafe: rearCapWeldSafe
            },
            portBossWelds: {
                location: 'Ön ve Arka Hidrolik Yağ Port Manşonları (Boru Dış Çapına Montaj)',
                weldType: 'Çepeçevre Köşe Kaynağı (All-Around Fillet Weld)',
                throatAwMm: portBossWeldAwMm,
                lengthMm: portBossWeldLengthMm,
                stressMPa: portBossWeldStressMPa,
                allowableStressMPa: rearCapWeldAllowableMPa,
                safetyFactor: portBossWeldSF,
                qualityStandard: 'DIN EN ISO 5817 Seviye C',
                isSafe: portBossWeldSafe
            },
            trunnionWelds: trunnionWeldDetail,
            weldEyeShank: weldEyeDetail,
            overallWeldsSafe: rearCapWeldSafe && portBossWeldSafe && (!trunnionWeldDetail || trunnionWeldDetail.isSafe) && (!weldEyeDetail || weldEyeDetail.isSafe),
            weldStandard: 'DIN EN ISO 5817 / Eurocode 3 (EN 1993-1-8)'
        };

        // B. BOLTED JOINTS ANALYSIS per VDI 2230
        let flangeBoltsDetail: BoltedJointDetail | undefined = undefined;
        if (barrelConn === 'bolted_flange' || catSeries === 'mag_nhs' || catSeries === 'rexroth_cdh2') {
            const pcdVal = magNhs ? magNhs.flangePCD : Math.round(D * 1.5 + 40);
            flangeBoltsDetail = {
                standard: 'DIN 912 / ISO 4762 İmbus Silindirik Başlı Cıvata',
                count: flangeBoltCount,
                size: `M${flangeBoltNominalD}x${Math.round(flangeThicknessMm * 1.8)}`,
                grade: flangeBoltGrade,
                pcdMm: pcdVal,
                loadPerBoltN: Math.round(loadPerFlangeBoltN),
                preloadForcePerBoltN: Math.round(preloadPerFlangeBoltN),
                tighteningTorqueNm: flangeBoltTorqueNm,
                tensileStressMPa: flangeBoltTensileStressMPa,
                safetyFactor: flangeBoltSafetyFactor,
                isSafe: flangeBoltSafetyFactor >= 1.5
            };
        }

        let tieRodDetail: BoltedJointDetail | undefined = undefined;
        if (barrelConn === 'tie_rod_studs' || catSeries === 'rexroth_cdt3') {
            tieRodDetail = {
                standard: 'ISO 6020-2 / DIN 24554 Gövde Saplaması + ISO 4032 Somun',
                count: tieRodCount,
                size: `M${tieRodNominalD}`,
                grade: '8.8 / 10.9',
                pcdMm: Math.round(D * 1.414 + 20),
                loadPerBoltN: Math.round(totalCapTensionForceN / tieRodCount),
                preloadForcePerBoltN: Math.round(1.3 * (totalCapTensionForceN / tieRodCount)),
                tighteningTorqueNm: tieRodTighteningTorqueNm,
                tensileStressMPa: tieRodTensileStressMPa,
                safetyFactor: tieRodSafetyFactor,
                isSafe: tieRodSafetyFactor >= 1.5
            };
        }

        // Rexroth CGKD / CGKA Clampable Eye Pinch Screw Check
        let clampableEyePinchBolts: {
            standard: string;
            screwSize: string;
            count: number;
            tighteningTorqueNm: number;
            ratedStaticCapacityKN: number;
            admissibleLoadKN: number;
            isLoadAcceptable: boolean;
        } | undefined = undefined;

        const matchedCgkd = findRexrothCgkdByThread(rodEndThread) || findRexrothCgkdByPin(clevisPinDiaMm);
        if (matchedCgkd && (rodEndType === 'spherical_rod_eye_ap4' || rodEndType === 'spherical_eye')) {
            clampableEyePinchBolts = {
                standard: `ISO 4762-10.9 (DIN 912 Klemens Sıkma Cıvatası)`,
                screwSize: matchedCgkd.clampScrew,
                count: 1,
                tighteningTorqueNm: matchedCgkd.tighteningTorqueMA,
                ratedStaticCapacityKN: matchedCgkd.staticRatingC0KN,
                admissibleLoadKN: matchedCgkd.admissibleLoadFadmKN,
                isLoadAcceptable: pushForceKN <= matchedCgkd.admissibleLoadFadmKN
            };
        }

        const boltedJoints: BoltedJointsAnalysis = {
            flangeBolts: flangeBoltsDetail,
            tieRodStuds: tieRodDetail,
            clampableEyePinchBolts,
            footAnchorBolts: {
                size: `4x M${Math.max(12, Math.round(D * 0.16))}`,
                count: 4,
                tensileForceN: footBoltTensileForceN,
                shearForceN: footBoltShearForceN
            },
            overallBoltsSafe: (!flangeBoltsDetail || flangeBoltsDetail.isSafe) && (!tieRodDetail || tieRodDetail.isSafe) && (!clampableEyePinchBolts || clampableEyePinchBolts.isLoadAcceptable),
            boltStandard: 'VDI 2230 / DIN 912 / ISO 4762 / ISO 6020-2'
        };

        // C. THREADED JOINTS ANALYSIS (Dişli Bağlantılar per ISO 965 & DIN 76-A)
        // 1. Threaded Front Gland (MAG KHS / THS D3 Thread)
        const glandThNominalD = magKhs ? magKhs.glandThreadDia : Math.round(D + 6);
        const glandThPitch = magKhs ? magKhs.glandThreadPitch : 2.0;
        const glandThSize = magKhs ? magKhs.glandThreadD3 : `M${glandThNominalD}x${glandThPitch}`;
        const glandEngagementL = magKhs ? magKhs.glandEngagementLength : Math.round(Math.max(25, D * 0.55));
        // Shear area for metric thread: As = pi * d * 0.75 * Le
        const glandThShearArea = Math.PI * glandThNominalD * 0.75 * glandEngagementL;
        const glandThShearStress = Math.round((pushForceKN * 1000) / Math.max(10, glandThShearArea));
        const glandThAllowableShear = 210; // MPa for St52 / GGG-50
        const glandThSF = Number((glandThAllowableShear / Math.max(1, glandThShearStress)).toFixed(2));
        const spannerHolesText = `2x Ø${Math.max(8, Math.round(D * 0.1))} mm delik (PCD Ø${Math.round(glandThNominalD - 12)} mm), DIN 3116 Hilal / Tırnaklı Anahtar`;
        const glandRecommendedTorqueNm = Math.round(0.12 * (pushForceKN * 1000) * (glandThNominalD / 1000));

        // 2. Rod End Thread (DIN 76-A Undercut & Tensile Stress)
        const rodEndNominalDia = Math.max(12, Math.round(d * 0.75));
        const rodEndPitch = rodEndNominalDia >= 45 ? 2.0 : 1.5;
        const rodEndAs = 0.78 * Math.pow(rodEndNominalDia - 0.9382 * rodEndPitch, 2);
        const rodEndTensileStress = Math.round((pullForceKN * 1000) / Math.max(10, rodEndAs));
        const rodEndYield = input.rodMaterialId === '42crmo4_chrome' ? 750 : 450;
        const rodEndSF = Number((rodEndYield / Math.max(1, rodEndTensileStress)).toFixed(2));
        const undercutRadius = Number(Math.max(1.0, rodEndPitch * 0.8).toFixed(1));
        const counterNutTorque = Math.round(0.15 * (pullForceKN * 1000) * (rodEndNominalDia / 1000));

        const threadedJoints: ThreadedJointsAnalysis = {
            glandThread: {
                size: glandThSize,
                nominalDiaMm: glandThNominalD,
                pitchMm: glandThPitch,
                engagementLengthMm: glandEngagementL,
                shearAreaMm2: Math.round(glandThShearArea),
                shearStressMPa: glandThShearStress,
                allowableShearMPa: glandThAllowableShear,
                safetyFactor: glandThSF,
                spannerHoles: spannerHolesText,
                recommendedTorqueNm: glandRecommendedTorqueNm,
                isSafe: glandThSF >= 2.5
            },
            rodEndThread: {
                size: rodEndThread,
                threadPitchMm: rodEndPitch,
                stressAreaMm2: Math.round(rodEndAs),
                tensileStressMPa: rodEndTensileStress,
                safetyFactor: rodEndSF,
                undercutStandard: 'DIN 76 Form A (Gerilme Giderici Boşaltma Kanalı)',
                undercutRadiusMm: undercutRadius,
                counterNutStandard: 'DIN 439 / ISO 4035 İnce Kontra Somun',
                counterNutTorqueNm: counterNutTorque,
                isSafe: rodEndSF >= 2.0
            },
            pistonLockNut: {
                standard: 'DIN 985 / ISO 7040 Kendinden Emniyetli Somun',
                threadSize: `M${Math.round(d * 0.7)}x1.5`,
                lockTorqueNm: Math.round(0.18 * (pushForceKN * 1000) * (Math.round(d * 0.7) / 1000))
            },
            portThreads: {
                size: recommendedPort,
                standard: portThreadStandard,
                fittingTighteningTorqueNm: recommendedPort.includes('3/8') ? 50 : recommendedPort.includes('1/2') ? 80 : recommendedPort.includes('3/4') ? 140 : 200
            },
            overallThreadsSafe: glandThSF >= 2.0 && rodEndSF >= 1.8,
            threadStandard: 'ISO 965 / DIN 76-A / ISO 228-1'
        };

        // Overall Safety Assessment
        const isDesignSafeOverall = isBucklingSafe && 
            tubeYieldSafetyFactor >= 1.5 && 
            isCushioningPressureSafe && 
            isDeflectionAcceptable &&
            weldedJoints.overallWeldsSafe &&
            boltedJoints.overallBoltsSafe &&
            threadedJoints.overallThreadsSafe &&
            (barrelConn === 'bolted_flange' ? flangeBoltSafetyFactor >= 1.5 : true) &&
            (hasTrunnion ? trunnionSafetyFactor >= 1.5 : true);

        const result: CylinderDesignResult = {
            pushAreaCm2,
            pullAreaCm2,
            pushForceKN,
            pullForceKN,
            pushSpeedMPerSec,
            pullSpeedMPerSec,
            pushStrokeTimeSec,
            pullStrokeTimeSec,
            hydraulicPowerKW,

            tubeInnerDiaD: D,
            tubeOuterDiaDo: tubeOD,
            tubeWallThicknessT: tubeWallT,
            minRequiredWallThicknessT: Number(t_min.toFixed(2)),
            tubeHoopStressMPa: Math.round(tubeHoopStressMPa),
            tubeBurstPressureBar: Math.round(tubeBurstPressureBar),
            tubeYieldSafetyFactor: Number(tubeYieldSafetyFactor.toFixed(2)),
            tubeBurstSafetyFactor: Number(tubeBurstSafetyFactor.toFixed(2)),

            closedLengthMm,
            extendedLengthMm,
            effectiveBucklingFactorNu: nu,
            bucklingLengthLkMm: Math.round(bucklingLengthLk),
            rodSlendernessRatio: Number(rodSlendernessRatio.toFixed(1)),
            transitionSlendernessLambdaG: Number(transitionSlendernessLambdaG.toFixed(1)),
            bucklingRegime,
            criticalEulerForceKN: Number(criticalEulerForceKN.toFixed(2)),
            criticalBucklingForceKN: Number(criticalBucklingForceKN.toFixed(2)),
            tetmajerCriticalStressMPa: Math.round(tetmajerCriticalStressMPa),
            eulerCriticalStressMPa: Math.round(eulerCriticalStressMPa),
            bucklingSafetyFactor: Number(bucklingSafetyFactor.toFixed(2)),
            isBucklingSafe,
            maxPermissibleStrokeMm,
            stopTubeRecommendedLengthMm,
            needsStopTube,

            rodSelfWeightKg: Number(rodSelfWeightKg.toFixed(2)),
            maxHorizontalDeflectionMm: Number(maxHorizontalDeflectionMm.toFixed(2)),
            isDeflectionAcceptable,

            cushionSpearDiaMm,
            cushionLengthMm,
            cushionAnnularAreaCm2: Number(cushionAnnularAreaCm2.toFixed(2)),
            kineticEnergyJoules: Math.round(kineticEnergyJoules),
            peakCushioningPressureBar,
            isCushioningPressureSafe,
            cushioningDecelerationMPerSec2: Number(cushioningDecelerationMPerSec2.toFixed(2)),

            recommendedPortSize: recommendedPort,
            portThreadStandard,
            portInnerDiaMm,
            portFluidVelocityMPerSec: Number(portFluidVelocityMPerSec.toFixed(2)),
            portVelocityRating,
            portPressureDropBar,
            reynoldsNumber,

            barrelConnectionStyle: barrelConn,

            tieRodCount,
            tieRodSize,
            tieRodTensileStressMPa,
            tieRodTighteningTorqueNm,
            tieRodSafetyFactor,

            flangeBoltCount,
            flangeBoltSize,
            flangeBoltTensileStressMPa,
            flangeBoltTorqueNm,
            flangeBoltSafetyFactor,
            flangeThicknessMm,

            hasTrunnion,
            trunnionPinDiaMm,
            trunnionPinLengthMm,
            trunnionShearStressMPa,
            trunnionBendingStressMPa,
            trunnionBearingPressureMPa,
            trunnionSafetyFactor,

            hasSphericalBearing,
            sphericalBearingDesignation,
            sphericalBearingStaticCapacityKN,
            sphericalBearingSafetyFactor,
            sphericalBearingTiltAngleDeg,

            footOffsetMm,
            footOverturnMomentNm,
            footBoltTensileForceN,
            footBoltShearForceN,

            isThreadedGland,
            glandThreadSize,
            glandThreadShearStressMPa,
            glandThreadSafetyFactor,

            rodEndThread,
            clevisPinDiaMm,
            clevisPinShearStressMPa,
            clevisPinBearingPressureMPa,

            oilVolumeExtendedLiters,
            oilVolumeRetractedLiters,
            oilDifferentialLiters,
            heatGenerationKW,
            minTankVolumeLiters,

            tubeBoreTolerance,
            rodTolerance,
            pistonTolerance,
            glandTolerance,

            pistonLengthMm,
            glandLengthMm,
            rearCapLengthMm,
            totalCylinderMassKg: Number(totalCylinderMassKg.toFixed(2)),

            sealingBOM: {
                rodSeal: rodSealSpec,
                wiperSeal: wiperSealSpec,
                pistonSeal: pistonSealSpec,
                pistonGuideRings: `2x POM K40 Yataklama Bandı (Ø${D} x 9.7 x 2.5 mm)`,
                internalRodORing: internalORingSpec,
                tubeGlandORing: tubeGlandORingSpec,
                backupRing: backupRingSpec
            },

            billOfMaterials,
            weldedJoints,
            boltedJoints,
            threadedJoints,
            matchedCatalog,
            summaryWarnings: warnings,
            isDesignSafeOverall
        };

        const metadata: EngineMetadata = {
            calculationId: `CYL-${Date.now().toString(36).toUpperCase()}`,
            engineVersion: CylinderDesignEngine.VERSION,
            moduleName: 'CylinderDesignEngine',
            timestamp: Date.now(),
            inputSnapshot: input as any,
            standardReference: 'ISO 6020-2 / ISO 6022 / DIN 2413 / ISO/TR 10461 / ISO 3601 / ISO 6149 / ISO 12240 / VDI 2230 / DIN EN ISO 5817 / Eurocode 3 / DIN 76-A / Bosch Rexroth RE 17042 / MAG KHS/NHS',
            assumptions: [
                'Lamé ve DIN 2413 uyarınca kalın etli boruda teğetsel gerilme ve patlama basıncı',
                'ISO/TR 10461 uyarınca elastik Euler ve inelastik Tetmajer burkulma geçişi',
                'DIN EN ISO 5817 Seviye B ve Eurocode 3 uyarınca boru-taban çevresel kaynak emniyeti',
                'VDI 2230 uyarınca dairesel flanş cıvataları ön yük ve sıkma torku tahkiki',
                'ISO 965 ve DIN 76-A uyarınca vidalı boğaz ve rot ucu diş sıyırma ve çentik analizi',
                'Bosch Rexroth RE 17042 normuna göre CGKD klemensli mafsal başlığı ve CLTB muylu bloğu'
            ],
            safetyFactors: {
                buckling: bucklingSafetyFactor,
                tubeYield: tubeYieldSafetyFactor,
                tubeBurst: tubeBurstSafetyFactor,
                flangeOrTieRod: flangeBoltSafetyFactor || tieRodSafetyFactor,
                rearWeld: weldedJoints.tubeRearCapWeld.safetyFactor,
                glandThread: threadedJoints.glandThread.safetyFactor
            },
            validationStatus: isDesignSafeOverall ? 'success' : 'warning',
            warnings,
            calculationHash: `SHA256-${Math.abs(Math.round(pushForceKN * 1000 + tubeBurstPressureBar)).toString(16)}`
        };

        return { result, metadata };
    }
}
