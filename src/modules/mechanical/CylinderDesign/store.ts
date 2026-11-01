/**
 * modules/mechanical/CylinderDesign/store.ts
 * 
 * Zustand store for 1:1 Hydraulic & Pneumatic Cylinder Design
 */

import { create } from 'zustand';
import {
    CylinderFluidMedium,
    CylinderMountingStyle,
    BarrelConnectionStyle,
    RodEndType,
    CylinderConstruction,
    CylinderCatalogSeries,
    CylinderDesignInput,
    CylinderDesignResult,
    CylinderDesignEngine,
    ISO_3320_BORES
} from './engine';
import { EngineMetadata } from '@/engine/project/ProjectSchema';

export type CylinderPressureUnit = 'bar' | 'MPa' | 'psi';
export type CylinderLinearUnit = 'mm' | 'in';
export type CylinderForceUnit = 'kN' | 'kgf' | 'ton' | 'lbf';
export type CylinderFlowUnit = 'L/min' | 'gpm';

export const cylinderUnitConverters = {
    pressure: {
        toBase: (val: number, unit: CylinderPressureUnit): number => {
            if (unit === 'MPa') return val * 10;
            if (unit === 'psi') return val / 14.50377;
            return val;
        },
        fromBase: (valInBar: number, unit: CylinderPressureUnit): number => {
            if (unit === 'MPa') return valInBar * 0.1;
            if (unit === 'psi') return valInBar * 14.50377;
            return valInBar;
        }
    },
    linear: {
        toBase: (val: number, unit: CylinderLinearUnit): number => {
            if (unit === 'in') return val * 25.4;
            return val;
        },
        fromBase: (valInMm: number, unit: CylinderLinearUnit): number => {
            if (unit === 'in') return valInMm / 25.4;
            return valInMm;
        }
    },
    force: {
        toBase: (val: number, unit: CylinderForceUnit): number => {
            if (unit === 'kgf') return val / 101.97162;
            if (unit === 'ton') return val / 0.10197162;
            if (unit === 'lbf') return val / 224.80894;
            return val;
        },
        fromBase: (valInKN: number, unit: CylinderForceUnit): number => {
            if (unit === 'kgf') return valInKN * 101.97162;
            if (unit === 'ton') return valInKN * 0.10197162;
            if (unit === 'lbf') return valInKN * 224.80894;
            return valInKN;
        }
    },
    flow: {
        toBase: (val: number, unit: CylinderFlowUnit): number => {
            if (unit === 'gpm') return val / 0.264172;
            return val;
        },
        fromBase: (valInLMin: number, unit: CylinderFlowUnit): number => {
            if (unit === 'gpm') return valInLMin * 0.264172;
            return valInLMin;
        }
    }
};

export interface CylinderPreset {
    id: string;
    titleTr: string;
    titleEn: string;
    descriptionTr: string;
    descriptionEn: string;
    input: Partial<CylinderDesignInput>;
}

export const CYLINDER_PRESETS: CylinderPreset[] = [
    {
        id: 'rexroth_cdt3_tierod_160',
        titleTr: 'Bosch Rexroth CDT3 Saplamalı (Tie-Rod, ISO 6020-2)',
        titleEn: 'Bosch Rexroth CDT3 Tie-Rod (ISO 6020-2)',
        descriptionTr: 'Bosch Rexroth CDT3 serisi: 160 bar kompakt 4 köşe saplamalı yapı, M16 tie-rod saplamaları, MF3 ön flanş, Ø80/Ø56.',
        descriptionEn: 'Bosch Rexroth CDT3 series: 160 bar compact tie-rod design, M16 tie-rods, MF3 front flange, Ø80/Ø56.',
        input: {
            catalogSeries: 'rexroth_cdt3',
            fluidMedium: 'hydraulic_mineral_oil',
            operatingPressureBar: 160,
            peakPressureBar: 210,
            boreDiameterD: 80,
            rodDiameterD: 56,
            strokeS: 450,
            mountingStyle: 'head_flange_mf3',
            barrelConnectionStyle: 'tie_rod_studs',
            cylinderConstruction: 'tie_rod_iso6020_2',
            pumpFlowRateLMin: 45,
            mechanicalEfficiency: 0.93,
            pistonSealType: 'K16',
            rodSealType: 'K33',
            wiperType: 'K01',
            hasCushioningFront: true,
            hasCushioningRear: true,
            rodMaterialId: '20mnv6_chrome',
            tubeMaterialId: 'st52_e355',
            movingMassKg: 450,
            rodEndType: 'male_thread',
            horizontalMounting: false
        }
    },
    {
        id: 'mag_khs_compact_160',
        titleTr: 'MAG Hidrolik KHS Kompakt (160 bar, Vidalı Boğaz)',
        titleEn: 'MAG Hydraulic KHS Compact (160 bar, Threaded Gland)',
        descriptionTr: 'Mert Akışkan Gücü KHS serisi: St 52 BK+S honlu boru, kaynaklı taban kapağı, M90x2 vidalı boğaz, G 3/4" port, Ø80/Ø45, 500 mm strok.',
        descriptionEn: 'MAG KHS series: St 52 BK+S honed tube, welded rear cap, M90x2 threaded gland, G 3/4" port, Ø80/Ø45, 500 mm stroke.',
        input: {
            catalogSeries: 'mag_khs',
            fluidMedium: 'hydraulic_mineral_oil',
            operatingPressureBar: 160,
            peakPressureBar: 250,
            boreDiameterD: 80,
            rodDiameterD: 45,
            strokeS: 500,
            mountingStyle: 'cap_spherical_eye_mp5',
            barrelConnectionStyle: 'welded_cap_threaded_gland',
            cylinderConstruction: 'welded_round_iso6022',
            pumpFlowRateLMin: 40,
            mechanicalEfficiency: 0.94,
            pistonSealType: 'K16',
            rodSealType: 'K33',
            wiperType: 'K01',
            hasCushioningFront: true,
            hasCushioningRear: true,
            rodMaterialId: '20mnv6_chrome',
            tubeMaterialId: 'st52_e355',
            movingMassKg: 600,
            rodEndType: 'spherical_rod_eye_ap4',
            horizontalMounting: false
        }
    },
    {
        id: 'rexroth_cdh2_mill_250',
        titleTr: 'Bosch Rexroth CDH2 Ağır Hizmet (ISO 6022 & CGKD Klemens)',
        titleEn: 'Bosch Rexroth CDH2 Mill Duty (ISO 6022 & CGKD Swivel Head)',
        descriptionTr: 'Bosch Rexroth RE 17042 / RE 17334: 250 bar dairesel cıvatalı flanş, CGKD 63 yarıklı klemensli mafsal gözü, Ø125/Ø90, 800 mm strok.',
        descriptionEn: 'Bosch Rexroth RE 17042 / RE 17334: 250 bar bolted flange, CGKD 63 clampable swivel head, Ø125/Ø90, 800 mm stroke.',
        input: {
            catalogSeries: 'rexroth_cdh2',
            fluidMedium: 'hydraulic_mineral_oil',
            operatingPressureBar: 250,
            peakPressureBar: 320,
            boreDiameterD: 125,
            rodDiameterD: 90,
            strokeS: 800,
            mountingStyle: 'cap_spherical_eye_mp5',
            barrelConnectionStyle: 'bolted_flange',
            cylinderConstruction: 'mill_duty',
            flangeBoltGrade: '10.9',
            pumpFlowRateLMin: 80,
            mechanicalEfficiency: 0.94,
            pistonSealType: 'K40',
            rodSealType: 'K35',
            wiperType: 'K03',
            hasCushioningFront: true,
            hasCushioningRear: true,
            rodMaterialId: '42crmo4_chrome',
            tubeMaterialId: 'st52_e355',
            movingMassKg: 1800,
            rodEndType: 'spherical_rod_eye_ap4',
            horizontalMounting: false
        }
    },
    {
        id: 'mag_nhs_mill_250',
        titleTr: 'MAG Hidrolik NHS Ağır Hizmet (ISO 6022 / CETOP R58H)',
        titleEn: 'MAG Hydraulic NHS Mill Duty (ISO 6022 / CETOP R58H)',
        descriptionTr: 'Mert Akışkan Gücü NHS serisi: 250 bar cıvatalı dairesel flanş başlık & arka kapak, 6x M16 10.9 cıvata, G 1" port, Ø100/Ø70.',
        descriptionEn: 'MAG NHS series: 250 bar bolted circular flange head & cap, 6x M16 10.9 bolts, G 1" port, Ø100/Ø70.',
        input: {
            catalogSeries: 'mag_nhs',
            fluidMedium: 'hydraulic_mineral_oil',
            operatingPressureBar: 250,
            peakPressureBar: 375,
            boreDiameterD: 100,
            rodDiameterD: 70,
            strokeS: 600,
            mountingStyle: 'head_flange_mf3',
            barrelConnectionStyle: 'bolted_flange',
            cylinderConstruction: 'mill_duty',
            flangeBoltGrade: '10.9',
            pumpFlowRateLMin: 60,
            mechanicalEfficiency: 0.95,
            pistonSealType: 'K16',
            rodSealType: 'K33',
            wiperType: 'K01',
            hasCushioningFront: true,
            hasCushioningRear: true,
            rodMaterialId: '42crmo4_chrome',
            tubeMaterialId: 'st52_e355',
            movingMassKg: 1200,
            rodEndType: 'male_thread',
            horizontalMounting: false
        }
    },
    {
        id: 'mag_ths_agri_160',
        titleTr: 'MAG Hidrolik THS Mobil Tarım (160 bar, Çatal Bağlantı)',
        titleEn: 'MAG Hydraulic THS Mobile Agricultural (160 bar, Clevis)',
        descriptionTr: 'Mert Akışkan Gücü THS serisi: Mobil makineler için çatal montajlı (MP1), kaynaklı kovan, Ø80/Ø45, 400 mm strok.',
        descriptionEn: 'MAG THS series: Mobile machinery clevis mount (MP1), welded barrel, Ø80/Ø45, 400 mm stroke.',
        input: {
            catalogSeries: 'mag_ths',
            fluidMedium: 'hydraulic_mineral_oil',
            operatingPressureBar: 160,
            peakPressureBar: 250,
            boreDiameterD: 80,
            rodDiameterD: 45,
            strokeS: 400,
            mountingStyle: 'cap_clevis_mp1',
            barrelConnectionStyle: 'welded_cap_threaded_gland',
            cylinderConstruction: 'welded_round_iso6022',
            pumpFlowRateLMin: 30,
            mechanicalEfficiency: 0.92,
            pistonSealType: 'K16',
            rodSealType: 'K33',
            wiperType: 'K01',
            hasCushioningFront: false,
            hasCushioningRear: false,
            rodMaterialId: 'c45_chrome',
            tubeMaterialId: 'st52_e355',
            movingMassKg: 300,
            rodEndType: 'rod_clevis_ap2',
            horizontalMounting: true
        }
    },
    {
        id: 'heavy_excavator_250',
        titleTr: 'Ekskavatör Bomu (250 bar, Oynak Rulmanlı)',
        titleEn: 'Excavator Boom (250 bar, Spherical Eye)',
        descriptionTr: 'ISO MP5 oynak rulmanlı arka göz + ISO 6982 AP4 mil ucu, kaynaklı kovan + dişli/vidalı boğaz, stop tube.',
        descriptionEn: 'ISO MP5 spherical bearing cap + ISO 6982 AP4 rod eye, welded barrel + threaded gland, stop tube.',
        input: {
            catalogSeries: 'mag_khs',
            fluidMedium: 'hydraulic_mineral_oil',
            operatingPressureBar: 250,
            peakPressureBar: 320,
            boreDiameterD: 125,
            rodDiameterD: 90,
            strokeS: 1100,
            mountingStyle: 'cap_spherical_eye_mp5',
            barrelConnectionStyle: 'welded_cap_threaded_gland',
            cylinderConstruction: 'welded_round_iso6022',
            pumpFlowRateLMin: 90,
            mechanicalEfficiency: 0.94,
            pistonSealType: 'K40',
            rodSealType: 'K35',
            wiperType: 'K03',
            hasCushioningFront: true,
            hasCushioningRear: true,
            rodMaterialId: '42crmo4_chrome',
            tubeMaterialId: 'st52_e355',
            movingMassKg: 1400,
            rodEndType: 'spherical_rod_eye_ap4',
            horizontalMounting: true
        }
    },
    {
        id: 'trunnion_crane_140',
        titleTr: 'Orta Muylulu Vinç/Damper (ISO MT4)',
        titleEn: 'Intermediate Trunnion Crane (ISO MT4)',
        descriptionTr: 'Gövdeden pivot mafsallı beşik salınımı, burkulma boyunu kısaltan orta muylu, çatal mafsallı mil ucu AP2.',
        descriptionEn: 'Trunnion pivot mounting along barrel, reduced buckling length, clevis pin rod end AP2.',
        input: {
            catalogSeries: 'rexroth_cd210',
            fluidMedium: 'hydraulic_mineral_oil',
            operatingPressureBar: 140,
            peakPressureBar: 180,
            boreDiameterD: 100,
            rodDiameterD: 56,
            strokeS: 900,
            mountingStyle: 'intermediate_trunnion_mt4',
            barrelConnectionStyle: 'welded_cap_bolted_gland',
            cylinderConstruction: 'welded_round_iso6022',
            pumpFlowRateLMin: 35,
            mechanicalEfficiency: 0.92,
            pistonSealType: 'K16',
            rodSealType: 'K33',
            wiperType: 'K01',
            hasCushioningFront: true,
            hasCushioningRear: true,
            rodMaterialId: '20mnv6_chrome',
            tubeMaterialId: 'st52_e355',
            movingMassKg: 400,
            rodEndType: 'rod_clevis_ap2',
            horizontalMounting: true
        }
    },
    {
        id: 'industrial_press_160',
        titleTr: 'Endüstriyel Pres (160 bar, Ön Flanş MF3)',
        titleEn: 'Industrial Press (160 bar, Head Flange MF3)',
        descriptionTr: 'ISO MF3 ön flanş bağlantılı, cıvatalı flanşlı honlu boru gövde, Ø100/Ø70, 600 mm strok, 50 L/dak.',
        descriptionEn: 'ISO MF3 front flange, bolted flanged tube barrel, Ø100/Ø70, 600 mm stroke, 50 L/min.',
        input: {
            catalogSeries: 'rexroth_cdh2',
            fluidMedium: 'hydraulic_mineral_oil',
            operatingPressureBar: 160,
            peakPressureBar: 220,
            boreDiameterD: 100,
            rodDiameterD: 70,
            strokeS: 600,
            mountingStyle: 'head_flange_mf3',
            barrelConnectionStyle: 'bolted_flange',
            cylinderConstruction: 'mill_duty',
            flangeBoltGrade: '10.9',
            pumpFlowRateLMin: 50,
            mechanicalEfficiency: 0.93,
            pistonSealType: 'K16',
            rodSealType: 'K33',
            wiperType: 'K01',
            hasCushioningFront: true,
            hasCushioningRear: true,
            rodMaterialId: '20mnv6_chrome',
            tubeMaterialId: 'st52_e355',
            movingMassKg: 500,
            rodEndType: 'male_thread',
            horizontalMounting: false
        }
    },
    {
        id: 'mill_duty_haddehane_250',
        titleTr: 'Haddehane Ağır Tip Pres (ISO 6022 Mill Duty)',
        titleEn: 'Steel Mill Heavy Press (ISO 6022 Mill Duty)',
        descriptionTr: '250 bar tam cıvatalı ağır sanayi flanşlı honlu boru gövde, 12.9 cıvatalar, arka flanş MF4.',
        descriptionEn: '250 bar bolted flange barrel construction, grade 12.9 bolts, rear flange MF4.',
        input: {
            catalogSeries: 'rexroth_cdh2',
            fluidMedium: 'hydraulic_mineral_oil',
            operatingPressureBar: 250,
            peakPressureBar: 350,
            boreDiameterD: 160,
            rodDiameterD: 110,
            strokeS: 800,
            mountingStyle: 'cap_flange_mf4',
            barrelConnectionStyle: 'bolted_flange',
            cylinderConstruction: 'mill_duty',
            flangeBoltGrade: '12.9',
            pumpFlowRateLMin: 120,
            mechanicalEfficiency: 0.94,
            pistonSealType: 'K40',
            rodSealType: 'K35',
            wiperType: 'K03',
            hasCushioningFront: true,
            hasCushioningRear: true,
            rodMaterialId: '42crmo4_chrome',
            tubeMaterialId: 'st52_e355',
            movingMassKg: 2500,
            rodEndType: 'flanged_rod_end',
            horizontalMounting: false
        }
    },
    {
        id: 'pneumatic_pusher_6',
        titleTr: 'Pnömatik Ayak Bağlantı (6 bar, ISO MS2)',
        titleEn: 'Pneumatic Foot Mount (6 bar, ISO MS2)',
        descriptionTr: 'ISO 15552 gövde yan ayak montajı (MS2), eksantrik devirme momenti tahkikli, Alüminyum kovan.',
        descriptionEn: 'ISO 15552 side lugs foot mount (MS2), eccentric overturning moment check, aluminum barrel.',
        input: {
            catalogSeries: 'custom',
            fluidMedium: 'pneumatic_air',
            operatingPressureBar: 6,
            peakPressureBar: 10,
            boreDiameterD: 63,
            rodDiameterD: 20,
            strokeS: 200,
            mountingStyle: 'side_lugs_ms2',
            barrelConnectionStyle: 'tie_rod_studs',
            cylinderConstruction: 'tie_rod_iso6020_2',
            pumpFlowRateLMin: 18,
            mechanicalEfficiency: 0.88,
            pistonSealType: 'K21',
            rodSealType: 'K33',
            wiperType: 'K01',
            hasCushioningFront: true,
            hasCushioningRear: true,
            rodMaterialId: 'c45_chrome',
            tubeMaterialId: 'al6063_t6',
            movingMassKg: 15,
            rodEndType: 'male_thread',
            horizontalMounting: true
        }
    }
];

export interface CylinderDesignState {
    // Inputs
    fluidMedium: CylinderFluidMedium;
    operatingPressureBar: number;
    peakPressureBar: number;
    boreDiameterD: number;
    rodDiameterD: number;
    strokeS: number;
    mountingStyle: CylinderMountingStyle;
    barrelConnectionStyle: BarrelConnectionStyle;
    flangeBoltGrade: '8.8' | '10.9' | '12.9';
    trunnionPositionMm: number;
    footMountOffsetMm: number;
    pumpFlowRateLMin: number;
    mechanicalEfficiency: number;
    pistonSealType: 'K16' | 'K21' | 'K40';
    rodSealType: 'K33' | 'K35';
    wiperType: 'K01' | 'K03';
    hasCushioningFront: boolean;
    hasCushioningRear: boolean;
    rodMaterialId: 'c45_chrome' | '20mnv6_chrome' | 'aisi431_stainless' | '42crmo4_chrome';
    tubeMaterialId: 'st52_e355' | 'al6063_t6';
    movingMassKg: number;
    rodEndType: RodEndType;
    cylinderConstruction: CylinderConstruction;
    horizontalMounting: boolean;
    catalogSeries: CylinderCatalogSeries;

    // Interactive Animation & Inspection
    strokeProgress: number; // 0.0 (retracted) to 1.0 (extended)
    isPlaying: boolean;
    playbackSpeed: number; // 0.5x, 1x, 2x
    animationDirection: number; // 1 (extending), -1 (retracting)
    selectedPartNumber: number | null;
    activeTab: 'cutaway' | 'bom' | 'calculations' | 'mountings' | 'seals' | 'cushioning' | 'manufacturing' | 'connections';
    presetId: string;

    // Solved Results
    result: CylinderDesignResult | null;
    metadata: EngineMetadata | null;

    // Units & Display
    pressureUnit: CylinderPressureUnit;
    linearUnit: CylinderLinearUnit;
    forceUnit: CylinderForceUnit;
    flowUnit: CylinderFlowUnit;

    // Actions
    setPressureUnit: (unit: CylinderPressureUnit) => void;
    setLinearUnit: (unit: CylinderLinearUnit) => void;
    setForceUnit: (unit: CylinderForceUnit) => void;
    setFlowUnit: (unit: CylinderFlowUnit) => void;
    setUnitSystem: (system: 'metric' | 'si' | 'imperial') => void;
    setCatalogSeries: (series: CylinderCatalogSeries) => void;
    setFluidMedium: (medium: CylinderFluidMedium) => void;
    setOperatingPressure: (pressure: number) => void;
    setPeakPressure: (pressure: number) => void;
    setBoreDiameter: (d: number) => void;
    setRodDiameter: (d: number) => void;
    setStroke: (stroke: number) => void;
    setMountingStyle: (style: CylinderMountingStyle) => void;
    setBarrelConnectionStyle: (style: BarrelConnectionStyle) => void;
    setFlangeBoltGrade: (grade: '8.8' | '10.9' | '12.9') => void;
    setTrunnionPosition: (pos: number) => void;
    setFootMountOffset: (offset: number) => void;
    setPumpFlowRate: (flow: number) => void;
    setMechanicalEfficiency: (eff: number) => void;
    setPistonSealType: (type: 'K16' | 'K21' | 'K40') => void;
    setRodSealType: (type: 'K33' | 'K35') => void;
    setWiperType: (type: 'K01' | 'K03') => void;
    setCushioning: (front: boolean, rear: boolean) => void;
    setRodMaterial: (mat: 'c45_chrome' | '20mnv6_chrome' | 'aisi431_stainless' | '42crmo4_chrome') => void;
    setTubeMaterial: (mat: 'st52_e355' | 'al6063_t6') => void;
    setMovingMass: (mass: number) => void;
    setRodEndType: (type: RodEndType) => void;
    setCylinderConstruction: (c: CylinderConstruction) => void;
    setHorizontalMounting: (val: boolean) => void;

    // Animation actions
    setStrokeProgress: (progress: number) => void;
    setIsPlaying: (playing: boolean) => void;
    togglePlay: () => void;
    setPlaybackSpeed: (speed: number) => void;
    stepAnimation: (deltaSec: number) => void;

    setSelectedPartNumber: (partNo: number | null) => void;
    setActiveTab: (tab: 'cutaway' | 'bom' | 'calculations' | 'mountings' | 'seals' | 'cushioning' | 'manufacturing' | 'connections') => void;
    loadPreset: (presetId: string) => void;
    recalculate: () => void;
}

export const useCylinderDesignStore = create<CylinderDesignState>((set, get) => {
    const initialInput: CylinderDesignInput = {
        fluidMedium: 'hydraulic_mineral_oil',
        operatingPressureBar: 160,
        peakPressureBar: 210,
        boreDiameterD: 80,
        rodDiameterD: 45,
        strokeS: 400,
        mountingStyle: 'clevis_rear',
        barrelConnectionStyle: 'welded_cap_bolted_gland',
        flangeBoltGrade: '10.9',
        trunnionPositionMm: 0,
        footMountOffsetMm: 0,
        pumpFlowRateLMin: 25,
        mechanicalEfficiency: 0.92,
        pistonSealType: 'K16',
        rodSealType: 'K33',
        wiperType: 'K01',
        hasCushioningFront: true,
        hasCushioningRear: true,
        rodMaterialId: '20mnv6_chrome',
        tubeMaterialId: 'st52_e355',
        movingMassKg: 100,
        rodEndType: 'male_thread',
        cylinderConstruction: 'welded_round_iso6022',
        horizontalMounting: true
    };

    const initialCalc = CylinderDesignEngine.analyze(initialInput);

    return {
        fluidMedium: 'hydraulic_mineral_oil',
        operatingPressureBar: 160,
        peakPressureBar: 210,
        boreDiameterD: 80,
        rodDiameterD: 45,
        strokeS: 400,
        mountingStyle: 'clevis_rear',
        barrelConnectionStyle: 'welded_cap_bolted_gland',
        flangeBoltGrade: '10.9',
        trunnionPositionMm: 0,
        footMountOffsetMm: 0,
        pumpFlowRateLMin: 25,
        mechanicalEfficiency: 0.92,
        pistonSealType: 'K16',
        rodSealType: 'K33',
        wiperType: 'K01',
        hasCushioningFront: true,
        hasCushioningRear: true,
        rodMaterialId: '20mnv6_chrome',
        tubeMaterialId: 'st52_e355',
        movingMassKg: 100,
        rodEndType: 'male_thread',
        cylinderConstruction: 'welded_round_iso6022',
        horizontalMounting: true,
        catalogSeries: 'mag_khs',

        // Units
        pressureUnit: 'bar',
        linearUnit: 'mm',
        forceUnit: 'kN',
        flowUnit: 'L/min',

        setPressureUnit: (unit) => set({ pressureUnit: unit }),
        setLinearUnit: (unit) => set({ linearUnit: unit }),
        setForceUnit: (unit) => set({ forceUnit: unit }),
        setFlowUnit: (unit) => set({ flowUnit: unit }),
        setUnitSystem: (sys) => {
            if (sys === 'metric') {
                set({ pressureUnit: 'bar', linearUnit: 'mm', forceUnit: 'kN', flowUnit: 'L/min' });
            } else if (sys === 'si') {
                set({ pressureUnit: 'MPa', linearUnit: 'mm', forceUnit: 'kN', flowUnit: 'L/min' });
            } else if (sys === 'imperial') {
                set({ pressureUnit: 'psi', linearUnit: 'in', forceUnit: 'lbf', flowUnit: 'gpm' });
            }
        },

        strokeProgress: 0.35,
        isPlaying: false,
        playbackSpeed: 1.0,
        animationDirection: 1,
        selectedPartNumber: 6,
        activeTab: 'cutaway',
        presetId: 'mag_khs_compact_160',

        result: initialCalc.result,
        metadata: initialCalc.metadata,

        recalculate: () => {
            const s = get();
            const input: CylinderDesignInput = {
                fluidMedium: s.fluidMedium,
                operatingPressureBar: s.operatingPressureBar,
                peakPressureBar: s.peakPressureBar,
                boreDiameterD: s.boreDiameterD,
                rodDiameterD: s.rodDiameterD,
                strokeS: s.strokeS,
                mountingStyle: s.mountingStyle,
                barrelConnectionStyle: s.barrelConnectionStyle,
                flangeBoltGrade: s.flangeBoltGrade,
                trunnionPositionMm: s.trunnionPositionMm,
                footMountOffsetMm: s.footMountOffsetMm,
                pumpFlowRateLMin: s.pumpFlowRateLMin,
                mechanicalEfficiency: s.mechanicalEfficiency,
                pistonSealType: s.pistonSealType,
                rodSealType: s.rodSealType,
                wiperType: s.wiperType,
                hasCushioningFront: s.hasCushioningFront,
                hasCushioningRear: s.hasCushioningRear,
                rodMaterialId: s.rodMaterialId,
                tubeMaterialId: s.tubeMaterialId,
                movingMassKg: s.movingMassKg,
                rodEndType: s.rodEndType,
                cylinderConstruction: s.cylinderConstruction,
                horizontalMounting: s.horizontalMounting,
                catalogSeries: s.catalogSeries
            };
            const calc = CylinderDesignEngine.analyze(input);
            set({ result: calc.result, metadata: calc.metadata });
        },

        setCatalogSeries: (series) => {
            const isKhs = series === 'mag_khs';
            const isNhs = series === 'mag_nhs';
            const isThs = series === 'mag_ths';
            const isCdh2 = series === 'rexroth_cdh2';
            const isCdt3 = series === 'rexroth_cdt3';
            const isCd210 = series === 'rexroth_cd210';

            if (isKhs) {
                set({
                    catalogSeries: series,
                    presetId: 'mag_khs_compact_160',
                    operatingPressureBar: 160,
                    peakPressureBar: 250,
                    barrelConnectionStyle: 'welded_cap_threaded_gland',
                    cylinderConstruction: 'welded_round_iso6022'
                });
            } else if (isNhs) {
                set({
                    catalogSeries: series,
                    presetId: 'mag_nhs_mill_250',
                    operatingPressureBar: 250,
                    peakPressureBar: 375,
                    barrelConnectionStyle: 'bolted_flange',
                    flangeBoltGrade: '10.9',
                    cylinderConstruction: 'mill_duty'
                });
            } else if (isCdh2) {
                set({
                    catalogSeries: series,
                    presetId: 'rexroth_cdh2_mill_250',
                    operatingPressureBar: 250,
                    peakPressureBar: 320,
                    barrelConnectionStyle: 'bolted_flange',
                    flangeBoltGrade: '10.9',
                    cylinderConstruction: 'mill_duty',
                    rodEndType: 'spherical_rod_eye_ap4'
                });
            } else if (isCdt3) {
                set({
                    catalogSeries: series,
                    presetId: 'rexroth_cdt3_tierod_160',
                    operatingPressureBar: 160,
                    peakPressureBar: 210,
                    barrelConnectionStyle: 'tie_rod_studs',
                    cylinderConstruction: 'tie_rod_iso6020_2'
                });
            } else if (isCd210) {
                set({
                    catalogSeries: series,
                    presetId: 'trunnion_crane_140',
                    operatingPressureBar: 140,
                    peakPressureBar: 180,
                    barrelConnectionStyle: 'welded_cap_bolted_gland',
                    cylinderConstruction: 'welded_round_iso6022'
                });
            } else if (isThs) {
                set({
                    catalogSeries: series,
                    presetId: 'mag_ths_agri_160',
                    operatingPressureBar: 160,
                    peakPressureBar: 250,
                    barrelConnectionStyle: 'welded_cap_threaded_gland',
                    cylinderConstruction: 'welded_round_iso6022'
                });
            } else {
                set({ catalogSeries: 'custom', presetId: 'custom' });
            }
            get().recalculate();
        },

        setFluidMedium: (medium) => {
            const isPneumatic = medium === 'pneumatic_air';
            set({
                fluidMedium: medium,
                operatingPressureBar: isPneumatic ? 6 : 160,
                peakPressureBar: isPneumatic ? 10 : 210,
                tubeMaterialId: isPneumatic ? 'al6063_t6' : 'st52_e355'
            });
            get().recalculate();
        },

        setOperatingPressure: (pressure) => {
            set({ operatingPressureBar: pressure, peakPressureBar: Math.round(pressure * 1.3) });
            get().recalculate();
        },

        setPeakPressure: (pressure) => {
            set({ peakPressureBar: pressure });
            get().recalculate();
        },

        setBoreDiameter: (d) => {
            const std = ISO_3320_BORES.find(b => b.boreD === d);
            const currentRod = get().rodDiameterD;
            let newRod = currentRod;
            if (std && !std.standardRods.includes(currentRod)) {
                newRod = std.standardRods[0] || Math.round(d * 0.56);
            }
            set({ boreDiameterD: d, rodDiameterD: newRod });
            get().recalculate();
        },

        setRodDiameter: (d) => {
            set({ rodDiameterD: d });
            get().recalculate();
        },

        setStroke: (stroke) => {
            set({ strokeS: stroke });
            get().recalculate();
        },

        setMountingStyle: (style) => {
            const isExtendedTie = style.startsWith('extended_tie_rods_mx');
            if (isExtendedTie && get().barrelConnectionStyle !== 'tie_rod_studs') {
                set({ mountingStyle: style, barrelConnectionStyle: 'tie_rod_studs', cylinderConstruction: 'tie_rod_iso6020_2' });
            } else {
                set({ mountingStyle: style });
            }
            get().recalculate();
        },

        setBarrelConnectionStyle: (style) => {
            let constr: CylinderConstruction = 'welded_round_iso6022';
            if (style === 'tie_rod_studs') constr = 'tie_rod_iso6020_2';
            else if (style === 'bolted_flange') constr = 'mill_duty';
            
            let mount = get().mountingStyle;
            if (style !== 'tie_rod_studs' && mount.startsWith('extended_tie_rods_mx')) {
                mount = 'cap_spherical_eye_mp5';
            }
            set({ barrelConnectionStyle: style, cylinderConstruction: constr, mountingStyle: mount });
            get().recalculate();
        },

        setFlangeBoltGrade: (grade) => {
            set({ flangeBoltGrade: grade });
            get().recalculate();
        },

        setTrunnionPosition: (pos) => {
            set({ trunnionPositionMm: pos });
            get().recalculate();
        },

        setFootMountOffset: (offset) => {
            set({ footMountOffsetMm: offset });
            get().recalculate();
        },

        setPumpFlowRate: (flow) => {
            set({ pumpFlowRateLMin: flow });
            get().recalculate();
        },

        setMechanicalEfficiency: (eff) => {
            set({ mechanicalEfficiency: eff });
            get().recalculate();
        },

        setPistonSealType: (type) => {
            set({ pistonSealType: type });
            get().recalculate();
        },

        setRodSealType: (type) => {
            set({ rodSealType: type });
            get().recalculate();
        },

        setWiperType: (type) => {
            set({ wiperType: type });
            get().recalculate();
        },

        setCushioning: (front, rear) => {
            set({ hasCushioningFront: front, hasCushioningRear: rear });
            get().recalculate();
        },

        setRodMaterial: (mat) => {
            set({ rodMaterialId: mat });
            get().recalculate();
        },

        setTubeMaterial: (mat) => {
            set({ tubeMaterialId: mat });
            get().recalculate();
        },

        setMovingMass: (mass) => {
            set({ movingMassKg: mass });
            get().recalculate();
        },

        setRodEndType: (type) => {
            set({ rodEndType: type });
            get().recalculate();
        },

        setCylinderConstruction: (c) => {
            let conn: BarrelConnectionStyle = get().barrelConnectionStyle;
            if (c === 'tie_rod_iso6020_2') conn = 'tie_rod_studs';
            else if (c === 'mill_duty') conn = 'bolted_flange';
            else if (c === 'welded_round_iso6022' && (conn === 'tie_rod_studs' || conn === 'bolted_flange')) {
                conn = 'welded_cap_threaded_gland';
            }
            set({ cylinderConstruction: c, barrelConnectionStyle: conn });
            get().recalculate();
        },

        setHorizontalMounting: (val) => {
            set({ horizontalMounting: val });
            get().recalculate();
        },

        setStrokeProgress: (progress) => {
            set({ strokeProgress: Math.max(0, Math.min(1.0, progress)) });
        },

        setIsPlaying: (playing) => {
            set({ isPlaying: playing });
        },

        togglePlay: () => {
            set((state) => ({ isPlaying: !state.isPlaying }));
        },

        setPlaybackSpeed: (speed) => {
            set({ playbackSpeed: speed });
        },

        stepAnimation: (deltaSec) => {
            const s = get();
            if (!s.isPlaying || !s.result) return;
            const cycleDurationSec = (s.result.pushStrokeTimeSec + s.result.pullStrokeTimeSec) || 4;
            const progressDelta = (deltaSec * s.playbackSpeed) / cycleDurationSec;

            let nextProgress = s.strokeProgress + progressDelta * s.animationDirection;
            let nextDir = s.animationDirection;

            if (nextProgress >= 1.0) {
                nextProgress = 1.0;
                nextDir = -1;
            } else if (nextProgress <= 0.0) {
                nextProgress = 0.0;
                nextDir = 1;
            }

            set({ strokeProgress: nextProgress, animationDirection: nextDir });
        },

        setSelectedPartNumber: (partNo) => {
            set({ selectedPartNumber: partNo });
        },

        setActiveTab: (tab) => {
            set({ activeTab: tab });
        },

        loadPreset: (presetId) => {
            const preset = CYLINDER_PRESETS.find(p => p.id === presetId);
            if (!preset) return;
            set({
                presetId,
                catalogSeries: preset.input.catalogSeries || 'custom',
                ...preset.input
            });
            get().recalculate();
        }
    };
});
