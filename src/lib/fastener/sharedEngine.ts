/**
 * Shared fastener geometry & VDI 2230 torque engine.
 * Single source for /fasteners and /bolt-torque production dimensions.
 *
 * Thread geometry: ISO 965 tabulated values from fastenersData.ts
 * Clearance holes: ISO 273 (machiningStandards.ts)
 * Head/nut: ISO 4017/4032 (boltNutStandards.ts)
 */

import { FASTENERS_DB, type Fastener, type FastenerStandardId } from '@/data/fastenersData';
import { computeThreadProfile } from '@/lib/fastener/threadProfiles';
import { getClearanceHole } from '@/data/machiningStandards';
import {
    getFastenerGeometry,
    getNutDimension,
    BOLT_PROPERTY_CLASSES,
    THREAD_STANDARDS,
} from '@/data/boltNutStandards';
import {
    BoltTypeId,
    BOLT_TYPES_CATALOG,
    getBoltHeadDimensions,
    BoltHeadDimensions,
    BoltTypeMeta,
} from '@/data/boltHeadStandards';

export {
    type BoltTypeId,
    BOLT_TYPES_CATALOG,
    getBoltHeadDimensions,
    type BoltHeadDimensions,
    type BoltTypeMeta,
};

export interface ClampedMaterial {
    id: string;
    name: { en: string; tr: string };
    /** Limiting surface pressure pG (MPa) under the bolt head / nut — VDI 2230-1:2015 Table A9 */
    pG_zul: number;
    modulusE: number; // Young's modulus (GPa)
    /** where pG comes from (shown in the UI next to the value) */
    pGSource?: string;
}

/**
 * Clamped-part materials. pG values: VDI 2230 Part 1:2015 Table A9 (typical short-term room
 * temperature values). Normative Tier. Grades that the 2015 table does not list keep the
 * VDI 2230:1986 value and say so in `pGSource`.
 * If no embedding is permissible VDI recommends limiting pM to ~70 % of pG.
 */
export const CLAMPED_MATERIALS: ClampedMaterial[] = [
    { id: 'steel_s235', name: { en: 'Structural Steel S235JR (St37)', tr: 'Yapı Çeliği S235JR (St37)' }, pG_zul: 490, modulusE: 210, pGSource: 'VDI 2230-1:2015 Tab. A9' },
    { id: 'steel_e295', name: { en: 'Steel E295 (St50)', tr: 'Çelik E295 (St50)' }, pG_zul: 710, modulusE: 210, pGSource: 'VDI 2230-1:2015 Tab. A9' },
    { id: 'steel_s355', name: { en: 'Structural Steel S355J0 (St52)', tr: 'Yapı Çeliği S355J0 (St52)' }, pG_zul: 760, modulusE: 210, pGSource: 'VDI 2230-1:2015 Tab. A9' },
    { id: 'steel_c45', name: { en: 'Steel C45 / Cq45', tr: 'Çelik C45 / Cq45' }, pG_zul: 770, modulusE: 210, pGSource: 'VDI 2230-1:2015 Tab. A9 (Cq45)' },
    { id: 'steel_34crmo4', name: { en: 'Alloy Steel 34CrMo4 (Q&T)', tr: 'Islah Çeliği 34CrMo4' }, pG_zul: 1170, modulusE: 210, pGSource: 'VDI 2230-1:2015 Tab. A9' },
    { id: 'steel_42crmo4', name: { en: 'Alloy Steel 42CrMo4 (Q&T)', tr: 'Islah Çeliği 42CrMo4' }, pG_zul: 850, modulusE: 210, pGSource: 'VDI 2230:1986 (not in 2015 table)' },
    { id: 'stainless_14401', name: { en: 'Stainless X5CrNiMo17-12-2 (1.4401)', tr: 'Paslanmaz X5CrNiMo17-12-2 (1.4401)' }, pG_zul: 630, modulusE: 200, pGSource: 'VDI 2230-1:2015 Tab. A9' },
    { id: 'cast_iron_gj_250', name: { en: 'Grey Cast Iron EN-GJL-250 (GG-25)', tr: 'Pik Döküm EN-GJL-250 (GG-25)' }, pG_zul: 850, modulusE: 110, pGSource: 'VDI 2230-1:2015 Tab. A9' },
    { id: 'nodular_iron_400', name: { en: 'Ductile Iron EN-GJS-400 (GGG-40)', tr: 'Sfero Döküm EN-GJS-400 (GGG-40)' }, pG_zul: 600, modulusE: 169, pGSource: 'VDI 2230-1:2015 Tab. A9' },
    { id: 'nodular_iron_500', name: { en: 'Ductile Iron EN-GJS-500-7 (GGG-50)', tr: 'Sfero Döküm EN-GJS-500-7 (GGG-50)' }, pG_zul: 750, modulusE: 170, pGSource: 'VDI 2230-1:2015 Tab. A9' },
    { id: 'alu_6061', name: { en: 'Aluminium 6061-T6 / 6082-T6 (AlMgSi1 F31)', tr: 'Alüminyum 6061-T6 / 6082-T6 (AlMgSi1 F31)' }, pG_zul: 360, modulusE: 70, pGSource: 'VDI 2230-1:2015 Tab. A9 (AlMgSi1 F31)' },
    { id: 'alu_5083', name: { en: 'Aluminium 5083 (AlMg4.5Mn F27)', tr: 'Alüminyum 5083 (AlMg4.5Mn F27)' }, pG_zul: 325, modulusE: 71, pGSource: 'VDI 2230-1:2015 Tab. A9' },
    { id: 'alu_7075', name: { en: 'High-Strength Aluminium 7075-T6 (AlZnMgCu1.5)', tr: 'Yüksek Mukavemetli Alüminyum 7075-T6 (AlZnMgCu1.5)' }, pG_zul: 540, modulusE: 72, pGSource: 'VDI 2230-1:2015 Tab. A9' },
    { id: 'alu_die_cast', name: { en: 'Die-cast Aluminium GD-AlSi9Cu3', tr: 'Basınçlı Döküm Alüminyum GD-AlSi9Cu3' }, pG_zul: 300, modulusE: 75, pGSource: 'VDI 2230-1:2015 Tab. A9' },
    { id: 'titanium_ti6al4v', name: { en: 'Titanium TiAl6V4', tr: 'Titanyum TiAl6V4' }, pG_zul: 1340, modulusE: 114, pGSource: 'VDI 2230-1:2015 Tab. A9' },
    { id: 'bronze_cusn8', name: { en: 'Bronze CuSn8', tr: 'Bronz CuSn8' }, pG_zul: 380, modulusE: 115, pGSource: 'Estimate (not in VDI 2230)' },
];

export type GeometryPageStandard = FastenerStandardId | 'Custom';

export type TorquePageStandard =
    | 'Metric Coarse'
    | 'Metric Fine'
    | 'UNC'
    | 'UNF'
    | 'UNEF'
    | 'BSW'
    | 'BSF'
    | 'BSPP (G)'
    | 'BSPT (R)'
    | 'NPT'
    | 'NPTF'
    | 'Pipe'
    | 'Trapezoidal'
    | 'ACME'
    | 'Buttress'
    | 'Square'
    | 'Round'
    | 'Panzergewinde (Pg)'
    | 'Edison (E)'
    | 'Valve (Vg)'
    | 'Gas Cylinder (W)'
    | 'NPSM'
    | 'JIC 37°'
    | 'ORFS'
    | 'Custom';

export const GEOMETRY_STANDARDS_LIST: GeometryPageStandard[] = [
    'ISO Metric',
    'ISO Metric Fine',
    'UNC',
    'UNF',
    'UNEF',
    'BSW',
    'BSF',
    'BSPP (G)',
    'BSPT (R)',
    'NPT',
    'NPTF',
    'NPSM',
    'JIC 37°',
    'ORFS',
    'Trapezoidal (Tr)',
    'ACME',
    'Buttress (S)',
    'Square',
    'Round (Rd)',
    'Panzergewinde (Pg)',
    'Edison (E)',
    'Valve (Vg)',
    'Gas Cylinder (W)',
    'Custom',
];

export interface FastenerStandardSpec {
    family: 'metric' | 'inch' | 'npt' | 'bspp' | 'bspt' | 'bsw' | 'trapezoidal' | 'acme' | 'buttress' | 'pipe' | 'specialty';
    boltPartial: string;
    boltFull: string;
    boltCurrent: string;
    nutStandard: string;
    threadProfile: string;
    toleranceClass: string;
    clearanceHole: string;
    strengthStandard: string;
    underheadFillet: string;
    chamferStandard: string;
    gaugeStandard: string;
    workbenchSubtitle: string;
    buttonPartialLabel: { en: string; tr: string };
    buttonFullLabel: { en: string; tr: string };
}

export function getFastenerStandardSpecs(
    standard: string,
    size: string = '',
    fullyThreaded: boolean = false,
    boltType?: BoltTypeId,
): FastenerStandardSpec {
    const stdLower = (standard || '').toLowerCase();
    const sizeUpper = (size || '').toUpperCase();
    const isNpsm = stdLower.includes('npsm') || sizeUpper.includes('NPSM');

    // Dedicated NPSM handler (ANSI/ASME B1.20.1 Table 8)
    if (isNpsm) {
        return {
            family: 'pipe',
            boltPartial: boltType === 'socket_cap' ? 'ASME B18.3 (NPSM)' : 'ASME B1.20.1 (NPSM Fitting)',
            boltFull: boltType === 'socket_cap' ? 'ASME B18.3 Full (NPSM)' : 'ASME B1.20.1 (NPSM Mechanical)',
            boltCurrent: boltType === 'socket_cap' ? (fullyThreaded ? 'ASME B18.3 Full' : 'ASME B18.3') : (fullyThreaded ? 'ASME B1.20.1 Full' : 'ASME B1.20.1'),
            nutStandard: 'ASME B1.20.1 (Locknut / Port)',
            threadProfile: 'ASME B1.20.1 (60° Straight Pipe)',
            toleranceClass: 'Class 2A / 2B',
            clearanceHole: 'ASME B1.20.1 Port',
            strengthStandard: 'ASTM A105 / A108 / ISO 898-1',
            underheadFillet: boltType === 'socket_cap' ? 'ASME B18.3' : 'ASME B1.20.1',
            chamferStandard: 'ASME B1.20.1',
            gaugeStandard: 'ASME B1.20.1 Table 8',
            workbenchSubtitle: 'ASME B1.20.1 · Class 2A/2B · Straight Pipe (NPSM)',
            buttonPartialLabel: { en: 'Partial (NPSM)', tr: 'Yarım Diş (NPSM)' },
            buttonFullLabel: { en: 'Full (NPSM)', tr: 'Tam Diş (NPSM)' },
        };
    }

    // Specific bolt types override
    if (boltType === 'socket_cap') {
        return {
            family: 'metric',
            boltPartial: 'DIN 912 (ISO 4762)',
            boltFull: 'DIN 912 Full (ISO 4762)',
            boltCurrent: fullyThreaded ? 'DIN 912 Full' : 'DIN 912 / ISO 4762',
            nutStandard: 'ISO 4032 (DIN 934)',
            threadProfile: 'ISO 68-1 (60° Metric)',
            toleranceClass: 'ISO 965-1 (6g / 6H)',
            clearanceHole: 'DIN 974-1 (Counterbore)',
            strengthStandard: 'ISO 898-1',
            underheadFillet: 'DIN 912',
            chamferStandard: 'DIN 78',
            gaugeStandard: 'ISO 1502',
            workbenchSubtitle: 'DIN 912 · ISO 4762 · Socket Head Cap Screw',
            buttonPartialLabel: { en: 'Partial (DIN 912)', tr: 'Yarım Diş (DIN 912)' },
            buttonFullLabel: { en: 'Full (DIN 912)', tr: 'Tam Diş (DIN 912)' },
        };
    }
    if (boltType === 'countersunk') {
        return {
            family: 'metric',
            boltPartial: 'DIN 7991 (ISO 10642)',
            boltFull: 'DIN 7991 Full (ISO 10642)',
            boltCurrent: fullyThreaded ? 'DIN 7991 Full' : 'DIN 7991 / ISO 10642',
            nutStandard: 'ISO 4032 (DIN 934)',
            threadProfile: 'ISO 68-1 (60° Metric)',
            toleranceClass: 'ISO 965-1 (6g / 6H)',
            clearanceHole: 'DIN 74 (Countersink 90°)',
            strengthStandard: 'ISO 898-1',
            underheadFillet: 'DIN 7991',
            chamferStandard: 'DIN 78',
            gaugeStandard: 'ISO 1502',
            workbenchSubtitle: 'DIN 7991 · ISO 10642 · Countersunk 90°',
            buttonPartialLabel: { en: 'Partial (DIN 7991)', tr: 'Yarım Diş (DIN 7991)' },
            buttonFullLabel: { en: 'Full (DIN 7991)', tr: 'Tam Diş (DIN 7991)' },
        };
    }
    if (boltType === 'button_head') {
        return {
            family: 'metric',
            boltPartial: 'ISO 7380-1',
            boltFull: 'ISO 7380-1 Full',
            boltCurrent: 'ISO 7380-1',
            nutStandard: 'ISO 4032 (DIN 934)',
            threadProfile: 'ISO 68-1 (60° Metric)',
            toleranceClass: 'ISO 965-1 (6g / 6H)',
            clearanceHole: 'ISO 273',
            strengthStandard: 'ISO 898-1',
            underheadFillet: 'ISO 7380-1',
            chamferStandard: 'DIN 78',
            gaugeStandard: 'ISO 1502',
            workbenchSubtitle: 'ISO 7380-1 · Button Head Socket Screw',
            buttonPartialLabel: { en: 'Standard (ISO 7380)', tr: 'Standart (ISO 7380)' },
            buttonFullLabel: { en: 'Full (ISO 7380)', tr: 'Tam Diş (ISO 7380)' },
        };
    }
    if (boltType === 'flange_hex') {
        return {
            family: 'metric',
            boltPartial: 'DIN 6921 (EN 1665)',
            boltFull: 'DIN 6921 Full (EN 1665)',
            boltCurrent: fullyThreaded ? 'DIN 6921 Full' : 'DIN 6921 / EN 1665',
            nutStandard: 'DIN 6923 (Flange Nut)',
            threadProfile: 'ISO 68-1 (60° Metric)',
            toleranceClass: 'ISO 965-1 (6g / 6H)',
            clearanceHole: 'ISO 273',
            strengthStandard: 'ISO 898-1',
            underheadFillet: 'DIN 6921',
            chamferStandard: 'ISO 4753',
            gaugeStandard: 'ISO 1502',
            workbenchSubtitle: 'DIN 6921 · EN 1665 · Hex Flange Bolt',
            buttonPartialLabel: { en: 'Partial (DIN 6921)', tr: 'Yarım Diş (DIN 6921)' },
            buttonFullLabel: { en: 'Full (DIN 6921)', tr: 'Tam Diş (DIN 6921)' },
        };
    }
    if (boltType === 'low_head_socket') {
        return {
            family: 'metric',
            boltPartial: 'DIN 7984',
            boltFull: 'DIN 7984 Full',
            boltCurrent: fullyThreaded ? 'DIN 7984 Full' : 'DIN 7984',
            nutStandard: 'ISO 4032',
            threadProfile: 'ISO 68-1 (60° Metric)',
            toleranceClass: 'ISO 965-1 (6g / 6H)',
            clearanceHole: 'DIN 974-1 (Shallow)',
            strengthStandard: 'ISO 898-1',
            underheadFillet: 'DIN 7984',
            chamferStandard: 'DIN 78',
            gaugeStandard: 'ISO 1502',
            workbenchSubtitle: 'DIN 7984 · Low Head Socket Cap',
            buttonPartialLabel: { en: 'Partial (DIN 7984)', tr: 'Yarım Diş (DIN 7984)' },
            buttonFullLabel: { en: 'Full (DIN 7984)', tr: 'Tam Diş (DIN 7984)' },
        };
    }
    if (boltType === 'heavy_hex') {
        return {
            family: 'inch',
            boltPartial: 'ASME B18.2.6 (A325)',
            boltFull: 'ASTM F3125 (A325/A490)',
            boltCurrent: 'ASTM A325 / ASME B18.2.6',
            nutStandard: 'ASTM A563 (Heavy Hex Nut)',
            threadProfile: 'ASME B1.1 (60° UN)',
            toleranceClass: 'Class 2A / 2B',
            clearanceHole: 'AISC Table J3.3',
            strengthStandard: 'ASTM F3125 / A325',
            underheadFillet: 'ASME B18.2.6',
            chamferStandard: 'ASME B18.2.6',
            gaugeStandard: 'ASME B1.2',
            workbenchSubtitle: 'ASTM A325 · ASME B18.2.6 · Heavy Hex',
            buttonPartialLabel: { en: 'Structural (A325)', tr: 'Yapısal (A325)' },
            buttonFullLabel: { en: 'Full Structural', tr: 'Tam Dişli' },
        };
    }
    if (boltType === 'stud_bolt') {
        return {
            family: 'metric',
            boltPartial: 'DIN 939 (bm=1.25d)',
            boltFull: 'DIN 975 / DIN 976 (Tij)',
            boltCurrent: fullyThreaded ? 'DIN 975 (Threaded Rod)' : 'DIN 939 (Stud bm=1.25d)',
            nutStandard: 'ISO 4032 (2x Nuts)',
            threadProfile: 'ISO 68-1 (60° Metric)',
            toleranceClass: 'Metal: Sk6 / Nut: 6g',
            clearanceHole: 'ISO 273 (dh)',
            strengthStandard: 'ISO 898-1',
            underheadFillet: 'None (Stud)',
            chamferStandard: 'DIN 78',
            gaugeStandard: 'ISO 1502',
            workbenchSubtitle: 'DIN 939 · DIN 975 · Stud Bolt',
            buttonPartialLabel: { en: 'DIN 939 (bm=1.25d)', tr: 'DIN 939 (bm=1.25d)' },
            buttonFullLabel: { en: 'DIN 975 (All Thread)', tr: 'DIN 975 (Gijon/Tij)' },
        };
    }
    if (boltType === 'set_screw') {
        return {
            family: 'metric',
            boltPartial: 'DIN 916 (Cup Point)',
            boltFull: 'DIN 916 (ISO 4029)',
            boltCurrent: 'DIN 916 / ISO 4029',
            nutStandard: 'Tapped Hole Only',
            threadProfile: 'ISO 68-1 (60° Metric)',
            toleranceClass: 'ISO 965-1 (6g)',
            clearanceHole: 'Tapped Hole',
            strengthStandard: 'ISO 898-5 (45H)',
            underheadFillet: 'None',
            chamferStandard: 'DIN 916',
            gaugeStandard: 'ISO 1502',
            workbenchSubtitle: 'DIN 916 · ISO 4029 · Set Screw (Cup Point)',
            buttonPartialLabel: { en: 'Cup Point', tr: 'Kupa Uç' },
            buttonFullLabel: { en: 'Full Thread', tr: 'Tam Boy' },
        };
    }
    if (boltType === 'carriage_bolt') {
        return {
            family: 'metric',
            boltPartial: 'DIN 603 (ISO 8677)',
            boltFull: 'DIN 603 Full',
            boltCurrent: fullyThreaded ? 'DIN 603 Full' : 'DIN 603 / ISO 8677',
            nutStandard: 'ISO 4032 (DIN 934)',
            threadProfile: 'ISO 68-1 (60° Metric)',
            toleranceClass: 'ISO 965-1 (6g / 6H)',
            clearanceHole: 'Square Hole (v)',
            strengthStandard: 'ISO 898-1 (4.6 / 8.8)',
            underheadFillet: 'DIN 603',
            chamferStandard: 'DIN 78',
            gaugeStandard: 'ISO 1502',
            workbenchSubtitle: 'DIN 603 · ISO 8677 · Carriage Bolt',
            buttonPartialLabel: { en: 'Partial (DIN 603)', tr: 'Yarım Diş (DIN 603)' },
            buttonFullLabel: { en: 'Full (DIN 603)', tr: 'Tam Diş (DIN 603)' },
        };
    }
    if (boltType === 'eye_bolt') {
        return {
            family: 'metric',
            boltPartial: 'DIN 580 (ISO 3266)',
            boltFull: 'DIN 580',
            boltCurrent: 'DIN 580 / ISO 3266',
            nutStandard: 'DIN 582 (Lifting Eye Nut)',
            threadProfile: 'ISO 68-1 (60° Metric)',
            toleranceClass: 'ISO 965-1 (6g)',
            clearanceHole: 'ISO 273',
            strengthStandard: 'C15E / A2 / A4 Forged',
            underheadFillet: 'DIN 580',
            chamferStandard: 'DIN 78',
            gaugeStandard: 'ISO 1502',
            workbenchSubtitle: 'DIN 580 · ISO 3266 · Lifting Eye Bolt',
            buttonPartialLabel: { en: 'Standard Stud', tr: 'Standart Diş' },
            buttonFullLabel: { en: 'Full Thread', tr: 'Tam Diş' },
        };
    }

    // 1. ACME Screw Threads (check before inch so 1-5 ACME is not captured as generic inch)
    const isAcme =
        stdLower.includes('acme') ||
        sizeUpper.includes('ACME');

    if (isAcme) {
        return {
            family: 'acme',
            boltPartial: 'ASME B1.5 (Acme Screw)',
            boltFull: 'ASME B1.5 (Full Acme)',
            boltCurrent: 'ASME B1.5',
            nutStandard: 'ASME B1.5 Acme Nut',
            threadProfile: 'ASME B1.5 (29° Acme)',
            toleranceClass: 'Class 2G / 3G',
            clearanceHole: 'ASME B18.2.8',
            strengthStandard: 'ASTM A193 / AISI 4140',
            underheadFillet: 'ASME B1.5',
            chamferStandard: 'ASME B1.5',
            gaugeStandard: 'ASME B1.5 Gages',
            workbenchSubtitle: 'ASME B1.5 · Class 2G · 29° Acme',
            buttonPartialLabel: { en: 'Partial (ASME B1.5)', tr: 'Yarım Diş (ASME B1.5)' },
            buttonFullLabel: { en: 'Full (ASME B1.5)', tr: 'Tam Diş (ASME B1.5)' },
        };
    }

    // 2. Trapezoidal (Tr) Metric Lead Screws (word boundary / prefix check to avoid matching 'meTRic')
    const isTr =
        stdLower.includes('trapezoidal') ||
        stdLower === 'tr' ||
        stdLower.startsWith('tr ') ||
        stdLower.startsWith('tr_') ||
        sizeUpper.startsWith('TR ') ||
        sizeUpper.startsWith('TR') && /TR\d+/i.test(sizeUpper);

    if (isTr) {
        return {
            family: 'trapezoidal',
            boltPartial: 'DIN 103 (Tr Lead Screw)',
            boltFull: 'DIN 103 (Fully Threaded Tr)',
            boltCurrent: 'DIN 103',
            nutStandard: 'DIN 103-9 (Tr Nut)',
            threadProfile: 'ISO 2901 / DIN 103 (30° Tr)',
            toleranceClass: 'ISO 2903 (7e / 7H)',
            clearanceHole: 'ISO 273',
            strengthStandard: 'ISO 898-1 / EN 10083',
            underheadFillet: 'DIN 103',
            chamferStandard: 'DIN 103',
            gaugeStandard: 'DIN 103-9',
            workbenchSubtitle: 'ISO 2901 · DIN 103 · ISO 2903',
            buttonPartialLabel: { en: 'Partial (DIN 103)', tr: 'Yarım Diş (DIN 103)' },
            buttonFullLabel: { en: 'Full (DIN 103)', tr: 'Tam Diş (DIN 103)' },
        };
    }

    // 3. NPT / NPTF Pipe Threads
    const isNpt =
        stdLower.includes('npt') ||
        sizeUpper.includes('NPT');

    if (isNpt) {
        return {
            family: 'npt',
            boltPartial: 'ASME B1.20.1 (NPT 1:16)',
            boltFull: 'ASME B16.14 / B16.11',
            boltCurrent: 'ASME B1.20.1',
            nutStandard: 'ASME B16.11 (Coupling)',
            threadProfile: 'ANSI/ASME B1.20.1 (60° Taper 1:16)',
            toleranceClass: 'L₁ Hand / L₂ Wrench',
            clearanceHole: 'ASME B16.11 Port',
            strengthStandard: 'ASTM A105 / A182',
            underheadFillet: 'ASME B16.11',
            chamferStandard: 'ASME B1.20.1',
            gaugeStandard: 'ASME B1.20.1 L₁/L₂',
            workbenchSubtitle: 'ASME B1.20.1 · ASME B16.11 · ASTM A105',
            buttonPartialLabel: { en: 'Taper (L1+L2)', tr: 'Konik Diş (L1+L2)' },
            buttonFullLabel: { en: 'Full Port (L4)', tr: 'Tam Port (L4)' },
        };
    }

    // 4. BSPP (G) Parallel Pipe Threads
    const isBspp =
        stdLower.includes('bspp') ||
        (stdLower.includes('g') && !stdLower.includes('gauge') && !stdLower.includes('metric')) ||
        sizeUpper.startsWith('G ') ||
        sizeUpper.startsWith('G1/') ||
        sizeUpper.startsWith('G3/') ||
        sizeUpper.startsWith('G1/2');

    if (isBspp) {
        return {
            family: 'bspp',
            boltPartial: 'DIN 3852-2 (Form A/B)',
            boltFull: 'ISO 228-1 (Full Thread)',
            boltCurrent: 'ISO 228-1',
            nutStandard: 'ISO 228-2 (Locknut)',
            threadProfile: 'ISO 228-1 / BS 2779 (55°)',
            toleranceClass: 'Class A / B',
            clearanceHole: 'DIN 3852-2 Port',
            strengthStandard: 'BS 2779 / EN 10277',
            underheadFillet: 'DIN 3852-2',
            chamferStandard: 'ISO 228-1',
            gaugeStandard: 'ISO 228-2',
            workbenchSubtitle: 'ISO 228-1 · DIN 3852-2 · BS 2779',
            buttonPartialLabel: { en: 'DIN 3852 Stud', tr: 'DIN 3852 Saplama' },
            buttonFullLabel: { en: 'Full (ISO 228-1)', tr: 'Tam Diş (ISO 228-1)' },
        };
    }

    // 5. BSPT (R / Rc) Taper Pipe Threads
    const isBspt =
        stdLower.includes('bspt') ||
        sizeUpper.startsWith('R ') ||
        sizeUpper.startsWith('RC');

    if (isBspt) {
        return {
            family: 'bspt',
            boltPartial: 'ISO 7-1 (Taper 1:16)',
            boltFull: 'ISO 7-1 / EN 10226',
            boltCurrent: 'ISO 7-1',
            nutStandard: 'ISO 7-1 (Rc Port)',
            threadProfile: 'ISO 7-1 / BS 21 (55°)',
            toleranceClass: 'Gauge Length L₁',
            clearanceHole: 'EN 10226-1 Port',
            strengthStandard: 'EN 10226',
            underheadFillet: 'EN 10226',
            chamferStandard: 'ISO 7-1',
            gaugeStandard: 'ISO 7-2',
            workbenchSubtitle: 'ISO 7-1 · EN 10226-1 · BS 21',
            buttonPartialLabel: { en: 'Taper (ISO 7-1)', tr: 'Konik (ISO 7-1)' },
            buttonFullLabel: { en: 'Full Port (ISO 7-1)', tr: 'Tam Diş (ISO 7-1)' },
        };
    }

    // 6. BSW / BSF British Whitworth Fasteners
    const isBsw =
        stdLower.includes('bsw') ||
        stdLower.includes('bsf') ||
        sizeUpper.includes('BSW') ||
        sizeUpper.includes('BSF');

    if (isBsw) {
        return {
            family: 'bsw',
            boltPartial: 'BS 1083 (Whitworth Bolt)',
            boltFull: 'BS 1083 (Tap Bolt)',
            boltCurrent: fullyThreaded ? 'BS 1083 (Tap Bolt)' : 'BS 1083 (Bolt)',
            nutStandard: 'BS 1083 Nut',
            threadProfile: 'BS 84 (55° Whitworth)',
            toleranceClass: 'Normal / Medium',
            clearanceHole: 'BS 4185',
            strengthStandard: 'BS 1083 Grade A/R',
            underheadFillet: 'BS 1083',
            chamferStandard: 'BS 1083',
            gaugeStandard: 'BS 919-2',
            workbenchSubtitle: 'BS 1083 · BS 84 (Whitworth 55°)',
            buttonPartialLabel: { en: 'Partial (BS 1083)', tr: 'Yarım Diş (BS 1083)' },
            buttonFullLabel: { en: 'Full (BS 1083)', tr: 'Tam Diş (BS 1083)' },
        };
    }

    // 7. Inch Family (UNC, UNF, UNEF)
    const isInch =
        stdLower.includes('unc') ||
        stdLower.includes('unf') ||
        stdLower.includes('unef') ||
        stdLower === 'unified' ||
        sizeUpper.includes('UNC') ||
        sizeUpper.includes('UNF') ||
        sizeUpper.includes('UNEF') ||
        (/^\d+-\d+/.test(size) && !sizeUpper.includes('M')) ||
        (/^\d+\/\d+-\d+/.test(size) && !sizeUpper.includes('M'));

    if (isInch) {
        return {
            family: 'inch',
            boltPartial: 'ASME B18.2.1 (Hex Bolt)',
            boltFull: 'ASME B18.2.1 (Tap Bolt)',
            boltCurrent: fullyThreaded ? 'ASME B18.2.1 (Tap Bolt)' : 'ASME B18.2.1 (Hex Bolt)',
            nutStandard: 'ASME B18.2.2',
            threadProfile: 'ASME B1.1 (60° UN)',
            toleranceClass: 'Class 2A / 2B',
            clearanceHole: 'ASME B18.2.8',
            strengthStandard: 'SAE J429 / ASTM A193',
            underheadFillet: 'ASME B18.2.1',
            chamferStandard: 'ASME B18.2.1',
            gaugeStandard: 'ASME B1.2 (2A/2B)',
            workbenchSubtitle: 'ASME B18.2.1 · ASME B1.1 · SAE J429',
            buttonPartialLabel: { en: 'Partial (ASME B18.2.1)', tr: 'Yarım Diş (ASME B18.2.1)' },
            buttonFullLabel: { en: 'Full (ASME B18.2.1)', tr: 'Tam Diş (ASME B18.2.1)' },
        };
    }

    // 8. Other pipe / hydraulic fittings (JIC 37°, ORFS)
    if (stdLower.includes('pipe') || stdLower.includes('jic') || stdLower.includes('orfs')) {
        return {
            family: 'pipe',
            boltPartial: 'ASME B1.20.1 / SAE J514',
            boltFull: 'SAE J514 Fitting',
            boltCurrent: 'SAE J514',
            nutStandard: 'SAE J514 Tube Nut',
            threadProfile: 'ASME B1.1 / SAE J514 (UN/UNF 37°)',
            toleranceClass: 'Class 2A / 2B',
            clearanceHole: 'SAE J514 Port',
            strengthStandard: 'SAE J514 / ASTM A108',
            underheadFillet: 'SAE J514',
            chamferStandard: 'SAE J514',
            gaugeStandard: 'ASME B1.2',
            workbenchSubtitle: 'SAE J514 · ASME B1.1 · 37° JIC / Pipe',
            buttonPartialLabel: { en: 'Standard Stud', tr: 'Standart Bağlantı' },
            buttonFullLabel: { en: 'Full Fitting', tr: 'Tam Rakor' },
        };
    }

    // 9. Metric Default (Metric Coarse / Fine / Custom)
    return {
        family: 'metric',
        boltPartial: 'ISO 4014 (DIN 931)',
        boltFull: 'ISO 4017 (DIN 933)',
        boltCurrent: fullyThreaded ? 'ISO 4017 (DIN 933)' : 'ISO 4014 (DIN 931)',
        nutStandard: 'ISO 4032 (DIN 934)',
        threadProfile: 'ISO 68-1',
        toleranceClass: 'ISO 965-1 (6g / 6H)',
        clearanceHole: 'ISO 273',
        strengthStandard: 'ISO 898-1',
        underheadFillet: 'ISO 4014',
        chamferStandard: 'ISO 4753',
        gaugeStandard: 'ISO 1502',
        workbenchSubtitle: 'VDI 2230 · ISO 898-1 · ISO 4017',
        buttonPartialLabel: { en: 'Partial (ISO 4014)', tr: 'Yarım Diş (ISO 4014)' },
        buttonFullLabel: { en: 'Full (ISO 4017)', tr: 'Tam Diş (ISO 4017)' },
    };
}

export interface ThreadGeometry {
    standard: string;
    size: string;
    majorDia: number;
    minorDia: number;
    pitchDia: number;
    pitch: number;
    tapDrill: number;
    stressArea: number;
    clearanceNormal: number | null;
    clearanceFine: number | null;
    clearanceCoarse: number | null;
    isTapered: boolean;
    isImperialPitch: boolean;
    source: 'table' | 'computed';
}

export interface BoltAssemblyResult {
    d_nom: number;
    d1: number;
    d2: number;
    d3: number;
    As: number;
    pitchVal: number;
    dh: number;
    dw: number;
    rb: number;
    threadLengthB: number;
    gripLength: number;
    washerT: number;
    tapDrill: number;
    K1: number;
    K2: number;
    K3: number;
    K: number;
    Fm_max: number;
    MA: number;
    stress: number;
    safety: number;
    Sy: number;
    Sp: number;
    /** minimum tensile strength Rm,min of the bolt (ISO 898-1 / class table) */
    Rm: number;
    /** tightening factor αA used for FM,min (VDI 2230 Table A8) */
    alphaA: number;
    /** guaranteed minimum assembly preload FM,min = FM,max / αA (kN) */
    FM_min_kN: number;
    grade: string;
    warnings: string[];
    boltDim: ReturnType<typeof getFastenerGeometry>;
    nutDim: ReturnType<typeof getNutDimension>;
    geometry: ThreadGeometry;
    spec: FastenerStandardSpec;
    // Enhanced VDI 2230 & Multi-Bolt Engineering Data
    boltType: BoltTypeId;
    boltTypeMeta: BoltTypeMeta;
    headDim: BoltHeadDimensions;
    M1: number; // Pitch stretch torque (N.m)
    M2: number; // Thread friction torque (N.m)
    M3: number; // Underhead friction torque (N.m)
    sigmaZ: number; // Axial tensile stress (MPa)
    tau: number; // Torsional shear stress (MPa)
    sigmaEq: number; // von Mises equivalent stress (MPa)
    Wp: number; // Polar section modulus (mm3)
    pM: number; // Surface pressure under bearing face (MPa)
    pG_zul: number; // Allowable surface pressure (MPa)
    surfaceSafety: number; // pG_zul / pM
    mCrit: number; // Critical thread stripping engagement length (mm)
    strippingSafety: number; // Nut height / mCrit
    M_G: number; // Total thread torque = M1 + M2 (N.m) per VDI 2230
    M_K: number; // Underhead bearing friction torque = M3 (N.m) per VDI 2230
    MG: number;  // Pitch + thread torque alias
    MK: number;  // Bearing friction torque alias
    validityStatus: 'VALID' | 'OUT_OF_STANDARD_RANGE';
    validityWarning?: string;
    clampedMaterialName: string;
    clampedMaterialSource?: string;
    frictionRangeAnalysis: {
        muMin: number;
        muMax: number;
        FM_nom: number;
        FM_max: number;
        FM_min: number;
        FM_max_kN: number;
        FM_min_kN: number;
        scatterRatio: number;
        riskLowFriction: string;
        riskHighFriction: string;
    };
    assumptionsLedger: Array<{
        id: string;
        name: string;
        parameter: string;
        symbol: string;
        value: number | string;
        activeValue: number | string;
        unit: string;
        source: string;
        sensitivity: string;
        riskDirection: string;
        standardReference: string;
    }>;
}

export const TORQUE_STANDARDS_LIST: TorquePageStandard[] = [
    'Metric Coarse', 'Metric Fine', 'UNC', 'UNF', 'UNEF', 'BSW', 'BSF',
    'BSPP (G)', 'BSPT (R)', 'NPT', 'NPTF', 'Pipe',
    'NPSM', 'JIC 37°', 'ORFS', 'Trapezoidal', 'ACME', 'Buttress',
    'Square', 'Round', 'Panzergewinde (Pg)', 'Edison (E)', 'Valve (Vg)', 'Gas Cylinder (W)', 'Custom',
];

const PROOF_STRESS: Record<string, number> = {
    '4.6': 225,
    '4.8': 310,
    '5.6': 280,
    '5.8': 380,
    '8.8': 600, // d > 16 mm — see diameter-dependent override in getProofStress()
    '10.9': 830,
    '12.9': 970,
    'A325': 586, // ASTM F3125 A325 proof load stress 85 ksi (620 MPa was AISC Fnt, not proof)
    'A490': 830,
    'A307': 230,
    'Grade 2': 380,
    'Grade 5': 585,
    'Grade 8': 830,
    'A193 B7': 660,
    'ASTM A105': 225,
    'A182 F316': 190,
    'A350 LF2': 225,
    'Grade B': 220,
    'Grade A': 230,
    'Grade R': 450,
    'Grade T': 580,
    'Grade V': 720,
    'A2-70': 450, // ISO 3506-1: no proof load for stainless — Rp0.2 min (VDI 2230 practice)
    'A4-70': 450,
    'A2-80': 600,
    'A4-80': 600,
    'CuSn7': 100,
    'CuSn12': 130,
};

/**
 * Standard-aware thread length b (mm) calculation:
 * - Metric: ISO 888
 * - Inch: ASME B18.2.1 (b = 2D + 1/4" for L <= 6", b = 2D + 1/2" for L > 6")
 * - Pipe/NPT: L4 or full thread
 */
export function getStandardThreadLengthB(standard: string, d: number, length: number): number {
    const stdLower = standard.toLowerCase();
    const isInch = stdLower.includes('unc') || stdLower.includes('unf') || stdLower.includes('unef') || stdLower.includes('inch') || stdLower === 'unified';
    if (isInch) {
        // ASME B18.2.1 formula: 2D + 0.25 in (6.35 mm) for L <= 6 in (152.4 mm), 2D + 0.50 in (12.7 mm) for L > 6 in
        const cap = length <= 152.4 ? 2 * d + 6.35 : 2 * d + 12.7;
        return Math.max(0, Math.min(length, Math.round(cap * 100) / 100));
    }
    const isPipe = stdLower.includes('npt') || stdLower.includes('pipe') || stdLower.includes('bspp') || stdLower.includes('bspt');
    if (isPipe) {
        return Math.max(0, Math.min(length, Math.round(d * 1.5)));
    }
    // ISO 888 (Metric default)
    const cap = length <= 125 ? 2 * d + 6 : length <= 200 ? 2 * d + 12 : 2 * d + 25;
    return Math.max(0, Math.min(length, cap));
}

/** ISO 888 approximate thread length b (mm) from nominal d and total length L. (Kept for backwards compatibility) */
export function isoThreadLengthB(d: number, length: number): number {
    const cap = length <= 125 ? 2 * d + 6 : length <= 200 ? 2 * d + 12 : 2 * d + 25;
    return Math.max(0, Math.min(length, cap));
}

/**
 * Proof stress Sp (MPa). ISO 898-1:2013 Table 3: class 8.8 is diameter dependent —
 * Sp = 580 MPa for d ≤ 16 mm and 600 MPa for d > 16 mm.
 */
export function getProofStress(grade: string, yieldMPa: number, d?: number): number {
    if (grade === '8.8' && d !== undefined && d <= 16) return 580;
    return PROOF_STRESS[grade] ?? Math.round(yieldMPa * 0.9);
}

export function getGradesForStandard(threadStandard: string, size = ''): { grade: string; label: string; isDefault?: boolean }[] {
    const stdLower = (threadStandard || '').toLowerCase();
    const sizeUpper = (size || '').toUpperCase();
    const isInch =
        stdLower.includes('unc') || stdLower.includes('unf') || stdLower.includes('unef') ||
        stdLower === 'unified' || sizeUpper.includes('UNC') || sizeUpper.includes('UNF') || sizeUpper.includes('UNEF');

    if (isInch) {
        return [
            { grade: 'Grade 2', label: 'SAE Gr.2' },
            { grade: 'Grade 5', label: 'SAE Gr.5', isDefault: true },
            { grade: 'Grade 8', label: 'SAE Gr.8' },
            { grade: 'A325', label: 'ASTM A325' },
            { grade: 'A490', label: 'ASTM A490' },
            { grade: 'A193 B7', label: 'ASTM A193 B7' },
        ];
    }

    const isPipe =
        stdLower.includes('npt') || stdLower.includes('pipe') || stdLower.includes('bspp') || stdLower.includes('bspt') ||
        sizeUpper.includes('NPT') || sizeUpper.startsWith('G ') || sizeUpper.startsWith('R ');

    if (isPipe) {
        return [
            { grade: 'ASTM A105', label: 'ASTM A105 (Carbon)', isDefault: true },
            { grade: 'A182 F316', label: 'A182 F316 (SS)' },
            { grade: 'A350 LF2', label: 'A350 LF2 (Low-T)' },
            { grade: 'Grade B', label: 'ASTM A106 Gr.B' },
        ];
    }

    const isBsw = stdLower.includes('bsw') || stdLower.includes('bsf') || sizeUpper.includes('BSW') || sizeUpper.includes('BSF');
    if (isBsw) {
        return [
            { grade: 'Grade A', label: 'BS 1083 Gr.A' },
            { grade: 'Grade R', label: 'BS 1083 Gr.R', isDefault: true },
            { grade: 'Grade T', label: 'BS 1083 Gr.T' },
            { grade: 'Grade V', label: 'BS 1083 Gr.V' },
        ];
    }

    const isLeadScrew =
        stdLower === 'tr' ||
        stdLower.startsWith('tr ') ||
        stdLower.startsWith('tr_') ||
        stdLower.includes('trapezoidal') ||
        stdLower.includes('acme') ||
        sizeUpper.startsWith('TR ') ||
        (sizeUpper.startsWith('TR') && /TR\d+/i.test(sizeUpper));
    if (isLeadScrew) {
        return [
            { grade: '4.6', label: 'Steel 4.6' },
            { grade: '8.8', label: 'Steel 8.8', isDefault: true },
            { grade: 'A2-70', label: 'Inox A2' },
            { grade: 'CuSn7', label: 'CuSn7 Bronze' },
            { grade: 'CuSn12', label: 'CuSn12 Bronze' },
        ];
    }

    // Default Metric (ISO 898-1 steel + ISO 3506-1 stainless). Stainless classes must be
    // listed here, otherwise presets such as "M6 A2-70" were silently reset to 8.8.
    return [
        { grade: '4.6', label: '4.6' },
        { grade: '5.8', label: '5.8' },
        { grade: '8.8', label: '8.8', isDefault: true },
        { grade: '10.9', label: '10.9' },
        { grade: '12.9', label: '12.9' },
        { grade: 'A2-70', label: 'A2-70' },
        { grade: 'A4-70', label: 'A4-70' },
        { grade: 'A4-80', label: 'A4-80' },
    ];
}

const TORQUE_TO_GEOMETRY: Record<TorquePageStandard, GeometryPageStandard | null> = {
    'Metric Coarse': 'ISO Metric',
    'Metric Fine': 'ISO Metric Fine',
    UNC: 'UNC',
    UNF: 'UNF',
    UNEF: 'UNEF',
    BSW: 'BSW',
    BSF: 'BSF',
    'BSPP (G)': 'BSPP (G)',
    'BSPT (R)': 'BSPT (R)',
    NPT: 'NPT',
    NPTF: 'NPTF',
    Pipe: null,
    NPSM: 'NPSM',
    'JIC 37°': 'JIC 37°',
    ORFS: 'ORFS',
    Trapezoidal: 'Trapezoidal (Tr)',
    ACME: 'ACME',
    Buttress: 'Buttress (S)',
    Square: 'Square',
    Round: 'Round (Rd)',
    'Panzergewinde (Pg)': 'Panzergewinde (Pg)',
    'Edison (E)': 'Edison (E)',
    'Valve (Vg)': 'Valve (Vg)',
    'Gas Cylinder (W)': 'Gas Cylinder (W)',
    Custom: 'Custom',
};

const GEOMETRY_TO_TORQUE: Partial<Record<GeometryPageStandard, TorquePageStandard>> = {
    'ISO Metric': 'Metric Coarse',
    'ISO Metric Fine': 'Metric Fine',
    UNC: 'UNC',
    UNF: 'UNF',
    UNEF: 'UNEF',
    BSW: 'BSW',
    BSF: 'BSF',
    'BSPP (G)': 'BSPP (G)',
    'BSPT (R)': 'BSPT (R)',
    NPT: 'NPT',
    NPTF: 'NPTF',
    NPSM: 'NPSM',
    'JIC 37°': 'JIC 37°',
    ORFS: 'ORFS',
    'Trapezoidal (Tr)': 'Trapezoidal',
    ACME: 'ACME',
    'Buttress (S)': 'Buttress',
    Square: 'Square',
    'Round (Rd)': 'Round',
    'Panzergewinde (Pg)': 'Panzergewinde (Pg)',
    'Edison (E)': 'Edison (E)',
    'Valve (Vg)': 'Valve (Vg)',
    'Gas Cylinder (W)': 'Gas Cylinder (W)',
};

export function metricSizeLabel(d: number): string {
    return `M${Number.isInteger(d) ? d : d}`;
}

export function extractMetricNominal(size: string): string | null {
    const m = size.match(/^M(\d+(?:\.\d+)?)/);
    if (!m) return null;
    const n = parseFloat(m[1]);
    return `M${Number.isInteger(n) ? n : n}`;
}

function rowToGeometry(row: Fastener, source: 'table' | 'computed' = 'table'): ThreadGeometry {
    const metricNom = extractMetricNominal(row.size);
    const clearanceNormal = metricNom ? getClearanceHole(metricNom, 'normal') : null;
    const clearanceFine = metricNom ? getClearanceHole(metricNom, 'fine') : null;
    const clearanceCoarse = metricNom ? getClearanceHole(metricNom, 'coarse') : null;
    const isImperialPitch = row.standard === 'UNC' || row.standard === 'UNF' || row.standard === 'UNEF'
        || row.standard === 'BSW' || row.standard === 'BSF'
        || row.standard === 'BSPP (G)' || row.standard === 'BSPT (R)'
        || row.standard === 'NPT' || row.standard === 'NPTF'
        || row.standard === 'NPSM' || row.standard === 'JIC 37°' || row.standard === 'ORFS'
        || row.standard === 'ACME';

    // In FASTENERS_DB, imperial threads store TPI in `pitch` (e.g., 28, 24, 20, 14).
    // If pitch >= 4 and isImperialPitch, convert TPI to mm (25.4 / TPI).
    // If pitch < 4 or Gas Cylinder, it is already stored in mm (e.g. 1.814 mm for W 19.8x1/14").
    const pitchInMm = isImperialPitch && row.pitch >= 4 ? (25.4 / row.pitch) : row.pitch;

    return {
        standard: row.standard,
        size: row.size,
        majorDia: row.majorDia,
        minorDia: row.minorDia,
        pitchDia: row.pitchDia,
        pitch: pitchInMm,
        tapDrill: row.tapDrill,
        stressArea: row.stressArea,
        clearanceNormal,
        clearanceFine,
        clearanceCoarse,
        isTapered: row.standard === 'NPT' || row.standard === 'NPTF' || row.standard === 'BSPT (R)' || row.standard === 'Gas Cylinder (W)',
        isImperialPitch,
        source,
    };
}

function computeCustomGeometry(d: number, pitch: number, standardLabel = 'Custom'): ThreadGeometry {
    const typeCode = standardLabel === 'Custom' ? 'M' : standardLabel;
    const p = computeThreadProfile(typeCode, d, pitch);
    const metricNom = extractMetricNominal(metricSizeLabel(d));
    return {
        standard: standardLabel,
        size: `Custom ${d}`,
        majorDia: d,
        minorDia: p.d1,
        pitchDia: p.d2,
        pitch,
        tapDrill: Math.max(p.tapDrill, 0),
        stressArea: p.stressArea,
        clearanceNormal: metricNom ? getClearanceHole(metricNom, 'normal') : d * 1.05,
        clearanceFine: metricNom ? getClearanceHole(metricNom, 'fine') : null,
        clearanceCoarse: metricNom ? getClearanceHole(metricNom, 'coarse') : null,
        isTapered: p.isTapered,
        isImperialPitch: false,
        source: 'computed',
    };
}

export function findGeometryRow(standard: GeometryPageStandard, size: string): Fastener | undefined {
    return FASTENERS_DB.find(f => f.standard === standard && f.size === size);
}

export function getThreadGeometryFromPage(
    standard: GeometryPageStandard,
    size: string,
    custom?: { diameter: number; pitch: number },
): ThreadGeometry | null {
    if (standard === 'Custom' && custom) {
        return computeCustomGeometry(custom.diameter, custom.pitch);
    }
    const row = findGeometryRow(standard, size);
    return row ? rowToGeometry(row) : null;
}

export function getThreadGeometryFromTorquePage(
    threadStandard: TorquePageStandard,
    size: string,
    custom?: { diameter: number; pitch: number },
): ThreadGeometry {
    if (threadStandard === 'Custom' && custom) {
        return computeCustomGeometry(custom.diameter, custom.pitch);
    }

    // 1. Pipe Threads (BSPP G, BSPT R, NPT)
    if (threadStandard === 'Pipe') {
        const pipeStd: GeometryPageStandard = /NPTF/i.test(size)
            ? 'NPTF'
            : /NPT/i.test(size)
            ? 'NPT'
            : size.startsWith('R')
            ? 'BSPT (R)'
            : 'BSPP (G)';
        const row = findGeometryRow(pipeStd, size);
        if (row) return rowToGeometry(row);
    }

    // 2. Direct standard mapping
    const mapped = TORQUE_TO_GEOMETRY[threadStandard];
    if (mapped) {
        const row = findGeometryRow(mapped, size);
        if (row) return rowToGeometry(row);
    }

    // 3. Fallback via THREAD_STANDARDS
    const std = THREAD_STANDARDS.find(t => t.size === size);
    if (std) {
        const pitchVal = std.pitch ?? (std.tpi ? (25.4 / std.tpi) : 1.75);
        const d = std.diameter;
        const d2 = d - 0.6495 * pitchVal;
        const d3 = std.minorDiameter ?? (d - 1.22687 * pitchVal);
        const metricNom = extractMetricNominal(size);
        return {
            standard: threadStandard,
            size,
            majorDia: d,
            minorDia: d3,
            pitchDia: d2,
            pitch: pitchVal,
            tapDrill: std.tapDrill,
            stressArea: std.area_tensile || (0.7854 * Math.pow(d - 0.9382 * pitchVal, 2)),
            clearanceNormal: metricNom ? getClearanceHole(metricNom, 'normal') : d * 1.05,
            clearanceFine: metricNom ? getClearanceHole(metricNom, 'fine') : null,
            clearanceCoarse: metricNom ? getClearanceHole(metricNom, 'coarse') : null,
            isTapered: size.includes('NPT') || size.includes('R ') || size.includes('BSPT'),
            isImperialPitch: !!(std.tpi),
            source: 'computed',
        };
    }

    // 4. Try finding size directly in FASTENERS_DB
    const directRow = FASTENERS_DB.find(f => f.size === size);
    if (directRow) return rowToGeometry(directRow);

    return computeCustomGeometry(12, 1.75, threadStandard);
}

/**
 * Minimum yield Rp0.2 (MPa). ISO 898-1:2013 Table 3: class 8.8 is 640 MPa for d ≤ 16 mm
 * and 660 MPa for d > 16 mm.
 */
export function getYieldStrength(grade: string, d?: number): number {
    if (grade === '8.8' && d !== undefined && d > 16) return 660;
    const cls = BOLT_PROPERTY_CLASSES.find(b => b.class === grade);
    return cls?.yieldStrengthMin ?? 640;
}

/**
 * Minimum tensile strength Rm,min (MPa). ISO 898-1:2013 Table 3: class 8.8 is 800 MPa for
 * d ≤ 16 mm and 830 MPa above; other classes from BOLT_PROPERTY_CLASSES.
 */
export function getTensileStrength(grade: string, d?: number, yieldMPa?: number): number {
    if (grade === '8.8' && d !== undefined && d > 16) return 830;
    const cls = BOLT_PROPERTY_CLASSES.find(b => b.class === grade);
    if (cls?.tensileStrengthMin) return cls.tensileStrengthMin;
    return Math.round((yieldMPa ?? 640) / 0.8);
}

export function computeBoltAssembly(params: {
    threadStandard: TorquePageStandard;
    size: string;
    boltType?: BoltTypeId;
    customDia?: number;
    pitch?: number;
    grade: string;
    muThread: number;
    muHead: number;
    yieldUtilization: number;
    clearanceSeries?: 'fine' | 'normal' | 'coarse';
    useProofStress?: boolean;
    length?: number;
    threadLengthB?: number;
    clampedMaterialId?: string;
    /** tightening factor αA, VDI 2230 Table A8 (default 1.6 = torque wrench) */
    alphaA?: number;
}): BoltAssemblyResult {
    const {
        threadStandard,
        size,
        boltType = 'hex_bolt',
        customDia = 12,
        pitch = 1.75,
        grade,
        muThread,
        muHead,
        yieldUtilization,
        clearanceSeries = 'normal',
        useProofStress = true,
        length = 50,
        threadLengthB: inputThreadLengthB,
        clampedMaterialId = 'steel_s235',
        alphaA = 1.6,
    } = params;

    const geometry = getThreadGeometryFromTorquePage(
        threadStandard,
        size,
        threadStandard === 'Custom' ? { diameter: customDia, pitch } : undefined,
    );

    const d_nom = geometry.majorDia;
    const Sy = getYieldStrength(grade, d_nom);
    const Sp = getProofStress(grade, Sy, d_nom);
    const Rm = getTensileStrength(grade, d_nom, Sy);
    const d2 = geometry.pitchDia;
    const As = geometry.stressArea;
    const pitchVal = geometry.pitch;
    // ISO 68-1 basic profile. FASTENERS_DB stores the *internal* minor diameter D1 for the
    // metric rows (M12: 10.106), so the external root diameter d3 is derived here for the
    // 60° ISO metric family (d3 = d − 1.226869·P, M12 → 9.853). Other families keep the
    // tabulated external minor diameter.
    const isIsoMetric60 = threadStandard === 'Metric Coarse' || threadStandard === 'Metric Fine'
        || (threadStandard === 'Custom') || /^M\d/i.test(size);
    const d1 = d_nom - 1.082532 * pitchVal;
    const d3 = isIsoMetric60 ? d_nom - 1.226869 * pitchVal : geometry.minorDia;

    const headDim = getBoltHeadDimensions(boltType, size, d_nom);
    const boltTypeMeta = BOLT_TYPES_CATALOG.find((b) => b.id === boltType) || BOLT_TYPES_CATALOG[0];

    const boltDim = getFastenerGeometry(extractMetricNominal(size) || size, d_nom);
    const nutDim = getNutDimension(extractMetricNominal(size) || size, pitchVal, threadStandard);

    const metricNom = extractMetricNominal(size);
    const dh = metricNom
        ? (getClearanceHole(metricNom, clearanceSeries) ?? geometry.clearanceNormal ?? d_nom + 1)
        : (geometry.clearanceNormal ?? d_nom * 1.05);

    // Bearing outer diameter dw & effective bearing mean diameter D_Km
    let dw: number;
    if (boltType === 'flange_hex') {
        dw = headDim.dc || headDim.dw || d_nom * 2.15;
    } else if (boltType === 'socket_cap' || boltType === 'low_head_socket') {
        // ISO 4762 bearing face dw,min (slightly smaller than dk)
        dw = headDim.dw || headDim.dk || d_nom * 1.5;
    } else if (boltType === 'countersunk') {
        dw = headDim.dk || headDim.dw || d_nom * 2.0;
    } else if (boltType === 'button_head') {
        dw = headDim.dk || headDim.dw || d_nom * 1.75;
    } else if (boltType === 'carriage_bolt') {
        dw = headDim.dk || headDim.dw || d_nom * 2.4;
    } else if (boltType === 'heavy_hex') {
        dw = headDim.dw || (headDim.s ? headDim.s * 0.95 : d_nom * 1.6);
    } else if (boltType === 'stud_bolt') {
        dw = (nutDim.width || d_nom * 1.6) * 0.95;
    } else if (boltType === 'hex_bolt') {
        dw = headDim.dw || (headDim.s ? headDim.s * 0.95 : d_nom * 1.5);
    } else {
        dw = headDim.dw || headDim.dk || d_nom * 1.5;
    }

    const rb = (dw + dh) / 4;

    // Countersunk 90° head wedging friction adjustment: muK / sin(45°) = 1.4142 * muK
    const effMuHead = boltType === 'countersunk' ? muHead / Math.sin(Math.PI / 4) : muHead;

    const threadLengthB = inputThreadLengthB !== undefined
        ? Math.max(0, Math.min(length, inputThreadLengthB))
        : getStandardThreadLengthB(threadStandard, d_nom, length);
    const washerT = Math.max(1.6, Math.round(d_nom * 0.16 * 10) / 10);
    const gripLength = Math.max(0, length - nutDim.height - washerT * 2);

    // Flank angle factor: 0.577 for 60° (Metric, UN), 0.564 for 55° (Whitworth), 0.518 for 30° (Tr), 0.517 for 29° (ACME)
    const isWhitworth = ['BSW', 'BSF', 'BSPP (G)', 'BSPT (R)', 'Gas Cylinder (W)'].includes(threadStandard) || size.startsWith('G ') || size.startsWith('R ');
    const isTrapezoidal = threadStandard === 'Trapezoidal' || size.toUpperCase().startsWith('TR');
    const isAcme = threadStandard === 'ACME' || size.toUpperCase().includes('ACME');
    const flankFactor = isWhitworth ? 0.5637 : isTrapezoidal ? 0.5176 : isAcme ? 0.5165 : 0.57735;

    const K1 = 0.159155 * (pitchVal / d_nom);
    const K2 = flankFactor * muThread * (d2 / d_nom);
    const K3 = effMuHead * (rb / d_nom);
    const K = K1 + K2 + K3;

    const strength = useProofStress ? Sp : Sy;
    const F0_max = (yieldUtilization / 100) * As * strength;
    const Fm_max = F0_max / 1000; // kN
    const MA = K * F0_max * (d_nom / 1000); // N.m

    // Polar section modulus W_P = π/16 · d0³ with d0 = d_S = (d2 + d3)/2 for a standard
    // (non-reduced) shank — VDI 2230-1:2015 §5.5.1 (A0 = A_S).
    const dS = 0.5 * (d2 + d3);
    const Wp = (Math.PI * Math.pow(dS, 3)) / 16;
    const totalK = K || 1;
    const M1 = (K1 / totalK) * MA; // Pitch elastic stretch torque
    const M2 = (K2 / totalK) * MA; // Thread friction torque
    const M3 = (K3 / totalK) * MA; // Underhead bearing friction torque

    // Stresses under maximum tightening preload
    const sigmaZ = As > 0 ? F0_max / As : 0; // MPa (Axial tension)
    // τ_M = M_G / W_P — M_G is the whole thread torque (pitch + thread friction, VDI 2230 Eq. 5.5/2);
    // the underhead friction torque M_K does not twist the bolt shank.
    const tau = Wp > 0 ? ((M1 + M2) * 1000) / Wp : 0; // MPa (Torsional shear)
    const sigmaEq = Math.sqrt(Math.pow(sigmaZ, 2) + 3 * Math.pow(tau, 2)); // MPa (von Mises)

    // Underhead surface pressure pM (MPa) per VDI 2230 Step R8
    const bearingArea = boltType === 'countersunk'
        ? Math.max(1, ((Math.PI / 4) * (Math.pow(dw, 2) - Math.pow(dh, 2))) / Math.cos(Math.PI / 4))
        : Math.max(1, (Math.PI / 4) * (Math.pow(dw, 2) - Math.pow(dh, 2)));
    const pM = F0_max / bearingArea;

    const clampedMat = CLAMPED_MATERIALS.find(m => m.id === clampedMaterialId) || CLAMPED_MATERIALS[0];
    const pG_zul = clampedMat.pG_zul;
    const surfaceSafety = pG_zul > 0 ? pG_zul / Math.max(0.1, pM) : 1.0;

    // Thread stripping (Scientific Tier — FED-STD-H28/2 shear areas, Machinery's Handbook):
    // m_crit is the engagement length at which the thread shear force equals the bolt
    // breaking force As·Rm, i.e. the bolt breaks before the thread strips (VDI 2230 §5.5.5
    // design intent). Shear strength τB ≈ 0.6·Rm; a matched ISO 898-2 nut is assumed to
    // have the same Rm as the bolt. Bolt-thread and nut-thread shear are both checked.
    const tauB = 0.6 * Rm;
    const shearPerMmBolt = Math.PI * d1 * (0.5 + 0.57735 * (d2 - d1) / pitchVal);    // mm²/mm (bolt threads, at D1)
    const shearPerMmNut = Math.PI * d_nom * (0.5 + 0.57735 * (d_nom - d2) / pitchVal); // mm²/mm (nut threads, at d)
    const breakForce = As * Rm; // N
    const mCrit = Math.max(
        0.5,
        breakForce / (tauB * Math.max(1e-6, shearPerMmBolt)),
        breakForce / (tauB * Math.max(1e-6, shearPerMmNut)),
    );
    const mEff = nutDim.height || d_nom;
    const strippingSafety = mCrit > 0 ? mEff / mCrit : 1.0;

    const warnings: string[] = [];
    if (yieldUtilization > 90) warnings.push('High utilization — review friction & class');
    if (muThread < 0.08) warnings.push('Very low thread friction — confirm lubrication state');
    if (surfaceSafety < 1.0) warnings.push(`Surface pressure pM (${pM.toFixed(0)} MPa) exceeds allowable (${pG_zul} MPa) for ${clampedMat.name.en}`);
    if (strippingSafety < 1.0) warnings.push(`Engagement length (${mEff.toFixed(1)} mm) below critical stripping length (${mCrit.toFixed(1)} mm)`);

    const M_G = M1 + M2; // Total thread torque (pitch stretch + thread friction)
    const M_K = M3;      // Underhead bearing friction torque

    // Standard Validity Check per VDI 2230 Blatt 1 (M4 to M39)
    const isOutOfStandardRange = d_nom < 4 || d_nom > 39;
    const validityStatus: 'VALID' | 'OUT_OF_STANDARD_RANGE' = isOutOfStandardRange ? 'OUT_OF_STANDARD_RANGE' : 'VALID';
    const validityWarning = isOutOfStandardRange
        ? `OUT_OF_STANDARD_RANGE: Nominal size (${d_nom} mm) is outside VDI 2230 Blatt 1 standard scope (4 mm <= d <= 39 mm). Specialized engineering calculation required.`
        : undefined;
    if (isOutOfStandardRange) {
        warnings.push(`OUT_OF_STANDARD_RANGE: Nominal size (${d_nom} mm) is outside VDI 2230 Blatt 1 validity scope (M4 to M39). Specialized engineering calculation required.`);
    }

    // Friction scatter at the same tightening torque MA (VDI 2230 §5.4.2): the actual μG / μK
    // are assumed to lie within ±0.03 of the nominal input (width of one VDI 2230 Table A5
    // friction class). Low friction → higher preload, high friction → lower preload.
    const MU_SCATTER = 0.03;
    const muMin = Math.max(0.04, Math.round((Math.min(muThread, muHead) - MU_SCATTER) * 100) / 100);
    const muMax = Math.round((Math.max(muThread, muHead) + MU_SCATTER) * 100) / 100;
    const kAt = (dMu: number) =>
        K1 + flankFactor * Math.max(0.02, muThread + dMu) * (d2 / d_nom)
        + (Math.max(0.02, muHead + dMu) / (muHead || 0.14)) * effMuHead * (rb / d_nom);
    const FM_max_val = Fm_max * (K / Math.max(0.001, kAt(-MU_SCATTER)));
    const FM_min_val = Fm_max * (K / Math.max(0.001, kAt(+MU_SCATTER)));
    const scatterRatio = Number((FM_max_val / Math.max(0.001, FM_min_val)).toFixed(2));

    const frictionRangeAnalysis = {
        muMin,
        muMax,
        FM_nom: Fm_max,
        FM_max: FM_max_val,
        FM_min: FM_min_val,
        FM_max_kN: FM_max_val,
        FM_min_kN: FM_min_val,
        scatterRatio,
        riskLowFriction: `Low friction (μ=${muMin}): the same torque produces a higher preload → yield / fracture risk.`,
        riskHighFriction: `High friction (μ=${muMax}): the same torque produces a lower preload → joint separation / loosening risk.`,
    };

    const assumptionsLedger = [
        {
            id: 'clearance_series',
            name: 'Clearance Hole (ISO 273)',
            parameter: 'Clearance Hole (ISO 273)',
            symbol: 'd_h',
            value: `${dh} mm (${clearanceSeries})`,
            activeValue: `${dh} mm (${clearanceSeries})`,
            unit: 'mm',
            source: 'ISO 273:1979 Medium Series',
            sensitivity: 'Affects bearing face inner radius rb and surface pressure pM',
            riskDirection: 'Coarse clearance increases underhead pressure pM',
            standardReference: 'ISO 273 / VDI 2230 Table A9',
        },
        {
            id: 'mu_thread',
            name: 'Thread Friction Coefficient',
            parameter: 'Thread Friction Coefficient',
            symbol: 'μ_G',
            value: muThread,
            activeValue: muThread,
            unit: '[-]',
            source: 'VDI 2230:2015 Table A5',
            sensitivity: 'Directly scales thread friction torque M2 and core torsion tau',
            riskDirection: 'Lower μ increases preload stress; higher μ reduces clamping load',
            standardReference: 'VDI 2230 Blatt 1 Table A5',
        },
        {
            id: 'mu_head',
            name: 'Underhead Bearing Friction',
            parameter: 'Underhead Bearing Friction',
            symbol: 'μ_K',
            value: muHead,
            activeValue: muHead,
            unit: '[-]',
            source: 'VDI 2230:2015 Table A5',
            sensitivity: 'Directly scales bearing friction torque M3 (~50% of total tightening torque)',
            riskDirection: 'Bearing face friction directly affects tightening torque transmission',
            standardReference: 'VDI 2230 Blatt 1 Table A5',
        },
        {
            id: 'alpha_a',
            name: 'Tightening Factor (Scatter)',
            parameter: 'Tightening Factor',
            symbol: 'α_A',
            value: alphaA,
            activeValue: alphaA,
            unit: '[-]',
            source: 'VDI 2230:2015 Table A8',
            sensitivity: 'Determines minimum residual clamp force FM,min = FM,max / alphaA',
            riskDirection: 'Torque wrench dispersion factor (scatter in assembly preload)',
            standardReference: 'VDI 2230 Blatt 1 Table A8',
        },
        {
            id: 'yield_utilization',
            name: 'Yield Strength Utilization',
            parameter: 'Yield Strength Utilization',
            symbol: 'ν',
            value: `${yieldUtilization}%`,
            activeValue: `${yieldUtilization}%`,
            unit: '%',
            source: useProofStress ? 'Proof Stress Sp (ISO 898-1)' : 'Yield Strength Re/Rp0.2',
            sensitivity: 'Limits maximum allowable tightening preload stress',
            riskDirection: 'Values > 90% require controlled torque-angle tightening method',
            standardReference: 'ISO 898-1 / VDI 2230 Step R3',
        },
    ];

    return {
        d_nom,
        d1,
        d2,
        d3,
        As,
        pitchVal,
        dh,
        dw,
        rb,
        threadLengthB,
        gripLength,
        washerT,
        tapDrill: geometry.tapDrill,
        K1,
        K2,
        K3,
        K,
        Fm_max,
        MA,
        stress: sigmaZ,
        safety: Sy / (sigmaEq || 1),
        Sy,
        Sp,
        Rm,
        alphaA,
        FM_min_kN: Fm_max / Math.max(1, alphaA),
        grade,
        warnings,
        boltDim,
        nutDim,
        geometry,
        spec: getFastenerStandardSpecs(threadStandard, size, threadLengthB >= length, boltType),
        boltType,
        boltTypeMeta,
        headDim,
        M1,
        M2,
        M3,
        M_G,
        M_K,
        MG: M_G,
        MK: M_K,
        validityStatus,
        validityWarning,
        frictionRangeAnalysis,
        assumptionsLedger,
        sigmaZ,
        tau,
        sigmaEq,
        Wp,
        pM,
        pG_zul,
        surfaceSafety,
        clampedMaterialName: clampedMat.name.en,
        clampedMaterialSource: clampedMat.pGSource,
        mCrit,
        strippingSafety,
    };
}

export function buildFastenerLinkParams(standard: GeometryPageStandard, size: string, grade = '8.8') {
    const torqueStd = GEOMETRY_TO_TORQUE[standard] ?? 'Metric Coarse';
    return new URLSearchParams({ standard: torqueStd, size, grade }).toString();
}

export function buildGeometryLinkParams(threadStandard: TorquePageStandard, size: string) {
    const geometryStd = TORQUE_TO_GEOMETRY[threadStandard] ?? 'ISO Metric';
    if (!geometryStd || geometryStd === 'Custom') {
        return new URLSearchParams({ standard: 'ISO Metric', size: size.startsWith('M') ? size : 'M12' }).toString();
    }
    return new URLSearchParams({ standard: geometryStd, size }).toString();
}

export function parseFastenerSearchParams(search: string) {
    const p = new URLSearchParams(search);
    return {
        standard: p.get('standard') || undefined,
        size: p.get('size') || undefined,
        grade: p.get('grade') || undefined,
    };
}
