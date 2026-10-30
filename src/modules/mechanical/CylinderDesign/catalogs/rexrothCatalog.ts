/**
 * modules/mechanical/CylinderDesign/catalogs/rexrothCatalog.ts
 * 
 * Bosch Rexroth Silindir ve Montaj Elemanları Veritabanı
 * Kaynak: Bosch Rexroth RE 17042 (2024-03) & Endüstriyel Silindir Kataloğu
 * 
 * Kapsanan Seriler:
 * - CDH2 / CGH2 / CSH2: ISO 6022 Ağır Hizmet Silindirleri (250 Bar, Dairesel Cıvatalı Flanşlı)
 * - CDT3 / CGT3 / CST3: ISO 6020-2 Saplamalı (Tie-Rod) Silindirler (160 Bar, 4 Köşe Saplama)
 * - CD210 / CG210: Endüstriyel Yuvarlak Kaynaklı Seri (210 Bar)
 * - CD70 / CG70: Kompakt Seri (70 / 105 Bar)
 * 
 * Kapsanan RE 17042 Montaj Elemanları:
 * - CGKD: ISO 8132 Yarıklı & Klemens Cıvatalı Mafsal Kafaları (CDH2 & CDT3)
 * - CGK: ISO 12240-4 / DIN 24338 İç Dişli Standart Oynak Mafsal Başları (CD70 & CD210)
 * - CGKA: ISO 8132 / ISO 8133 Tek Klemens Cıvatalı Mafsal Kafaları
 * - CGAS: Kaynaklı Tabanlı Mafsal Başları (Tabana veya Mile Kaynatılan)
 * - CLTB: ISO 8132 Ağır Hizmet Muylu Yataklama Blokları (CDH2)
 * - CLTA: ISO 8133 Muylu Yataklama Blokları (CDT3)
 */

export interface RexrothSwivelHeadCGKD {
    type: string;               // e.g. "CGKD 25"
    threadKK: string;           // Diş e.g. "M20x1.5"
    pinDia: number;             // mm (Rulman iç çapı AL)
    threadLengthLF: number;     // mm min.
    clampScrew: string;         // e.g. "M8 x 20"
    clampScrewStandard: string; // "ISO 4762-10.9" (DIN 912)
    tighteningTorqueMA: number; // Nm
    weightKg: number;
    staticRatingC0KN: number;   // kN
    admissibleLoadFadmKN: number;// kN
    tiltAngleDeg: number;       // Derece
    applicableSeries: string[]; // ["CDH2", "CDT3", "CDL2"]
}

export const REXROTH_CGKD_CATALOG: RexrothSwivelHeadCGKD[] = [
    {
        type: 'CGKD 12',
        threadKK: 'M12x1.25',
        pinDia: 12,
        threadLengthLF: 13,
        clampScrew: 'M5 x 16',
        clampScrewStandard: 'ISO 4762-10.9',
        tighteningTorqueMA: 6,
        weightKg: 0.1,
        staticRatingC0KN: 24.5,
        admissibleLoadFadmKN: 9.0,
        tiltAngleDeg: 11,
        applicableSeries: ['CDM1', 'CGM1']
    },
    {
        type: 'CGKD 16',
        threadKK: 'M14x1.5',
        pinDia: 16,
        threadLengthLF: 16.5,
        clampScrew: 'M6 x 14',
        clampScrewStandard: 'ISO 4762-10.9',
        tighteningTorqueMA: 10,
        weightKg: 0.2,
        staticRatingC0KN: 36.5,
        admissibleLoadFadmKN: 13.5,
        tiltAngleDeg: 9,
        applicableSeries: ['CDM1', 'CGM1']
    },
    {
        type: 'CGKD 20',
        threadKK: 'M16x1.5',
        pinDia: 20,
        threadLengthLF: 20.5,
        clampScrew: 'M8 x 20',
        clampScrewStandard: 'ISO 4762-10.9',
        tighteningTorqueMA: 25,
        weightKg: 0.35,
        staticRatingC0KN: 48,
        admissibleLoadFadmKN: 17.7,
        tiltAngleDeg: 9,
        applicableSeries: ['CDL2', 'CDT3', 'CDH2']
    },
    {
        type: 'CGKD 25',
        threadKK: 'M20x1.5',
        pinDia: 25,
        threadLengthLF: 25.5,
        clampScrew: 'M8 x 20',
        clampScrewStandard: 'ISO 4762-10.9',
        tighteningTorqueMA: 30,
        weightKg: 0.65,
        staticRatingC0KN: 78,
        admissibleLoadFadmKN: 28.8,
        tiltAngleDeg: 7,
        applicableSeries: ['CDL2', 'CDT3', 'CDH2']
    },
    {
        type: 'CGKD 32',
        threadKK: 'M27x2',
        pinDia: 32,
        threadLengthLF: 30,
        clampScrew: 'M10 x 25',
        clampScrewStandard: 'ISO 4762-10.9',
        tighteningTorqueMA: 59,
        weightKg: 1.15,
        staticRatingC0KN: 114,
        admissibleLoadFadmKN: 42.1,
        tiltAngleDeg: 6,
        applicableSeries: ['CDL2', 'CDT3', 'CDH2']
    },
    {
        type: 'CGKD 40',
        threadKK: 'M33x2',
        pinDia: 40,
        threadLengthLF: 39,
        clampScrew: 'M10 x 30',
        clampScrewStandard: 'ISO 4762-10.9',
        tighteningTorqueMA: 59,
        weightKg: 2.1,
        staticRatingC0KN: 204,
        admissibleLoadFadmKN: 75.3,
        tiltAngleDeg: 6,
        applicableSeries: ['CDL2', 'CDT3', 'CDH2']
    },
    {
        type: 'CGKD 50',
        threadKK: 'M42x2',
        pinDia: 50,
        threadLengthLF: 47,
        clampScrew: 'M12 x 35',
        clampScrewStandard: 'ISO 4762-10.9',
        tighteningTorqueMA: 100,
        weightKg: 4.0,
        staticRatingC0KN: 310,
        admissibleLoadFadmKN: 114.4,
        tiltAngleDeg: 6,
        applicableSeries: ['CDL2', 'CDT3', 'CDH2']
    },
    {
        type: 'CGKD 63',
        threadKK: 'M48x2',
        pinDia: 63,
        threadLengthLF: 58,
        clampScrew: 'M16 x 40',
        clampScrewStandard: 'ISO 4762-10.9',
        tighteningTorqueMA: 250,
        weightKg: 7.2,
        staticRatingC0KN: 430,
        admissibleLoadFadmKN: 158.7,
        tiltAngleDeg: 6,
        applicableSeries: ['CDL2', 'CDT3', 'CDH2']
    },
    {
        type: 'CGKD 80',
        threadKK: 'M64x3',
        pinDia: 80,
        threadLengthLF: 74,
        clampScrew: 'M20 x 50',
        clampScrewStandard: 'ISO 4762-10.9',
        tighteningTorqueMA: 490,
        weightKg: 15.0,
        staticRatingC0KN: 695,
        admissibleLoadFadmKN: 265.5,
        tiltAngleDeg: 6,
        applicableSeries: ['CDL2', 'CDT3', 'CDH2']
    },
    {
        type: 'CGKD 100',
        threadKK: 'M80x3',
        pinDia: 100,
        threadLengthLF: 94,
        clampScrew: 'M24 x 60',
        clampScrewStandard: 'ISO 4762-10.9',
        tighteningTorqueMA: 840,
        weightKg: 25.5,
        staticRatingC0KN: 1060,
        admissibleLoadFadmKN: 391.1,
        tiltAngleDeg: 7,
        applicableSeries: ['CDL2', 'CDT3', 'CDH2']
    },
    {
        type: 'CGKD 125',
        threadKK: 'M100x3',
        pinDia: 125,
        threadLengthLF: 116,
        clampScrew: 'M24 x 70',
        clampScrewStandard: 'ISO 4762-10.9',
        tighteningTorqueMA: 840,
        weightKg: 52.5,
        staticRatingC0KN: 1430,
        admissibleLoadFadmKN: 527.7,
        tiltAngleDeg: 6,
        applicableSeries: ['CDL2', 'CDT3', 'CDH2']
    },
    {
        type: 'CGKD 160',
        threadKK: 'M125x4',
        pinDia: 160,
        threadLengthLF: 145,
        clampScrew: 'M24 x 80',
        clampScrewStandard: 'ISO 4762-10.9',
        tighteningTorqueMA: 840,
        weightKg: 82.5,
        staticRatingC0KN: 2200,
        admissibleLoadFadmKN: 811.8,
        tiltAngleDeg: 7,
        applicableSeries: ['CDH2']
    }
];

export interface RexrothSwivelHeadCGAS {
    type: string;               // e.g. "CGAS 25"
    pinDia: number;             // mm
    weldShankWidth: number;     // mm
    weldShankLength: number;    // mm
    clampScrew: string;
    tighteningTorqueMA: number; // Nm
    staticRatingC0KN: number;
    admissibleLoadFadmKN: number;
    weldThroatRecommendedAw: number; // mm tavsiye edilen kaynak boğaz kalınlığı
}

export const REXROTH_CGAS_CATALOG: RexrothSwivelHeadCGAS[] = [
    { type: 'CGAS 25', pinDia: 25, weldShankWidth: 25, weldShankLength: 45, clampScrew: 'M8', tighteningTorqueMA: 30, staticRatingC0KN: 82, admissibleLoadFadmKN: 27.1, weldThroatRecommendedAw: 6 },
    { type: 'CGAS 30', pinDia: 30, weldShankWidth: 28, weldShankLength: 50, clampScrew: 'M8', tighteningTorqueMA: 30, staticRatingC0KN: 122, admissibleLoadFadmKN: 40.3, weldThroatRecommendedAw: 7 },
    { type: 'CGAS 35', pinDia: 35, weldShankWidth: 36, weldShankLength: 60, clampScrew: 'M10', tighteningTorqueMA: 59, staticRatingC0KN: 177, admissibleLoadFadmKN: 58.4, weldThroatRecommendedAw: 8 },
    { type: 'CGAS 40', pinDia: 40, weldShankWidth: 39, weldShankLength: 70, clampScrew: 'M12', tighteningTorqueMA: 100, staticRatingC0KN: 287, admissibleLoadFadmKN: 94.7, weldThroatRecommendedAw: 9 },
    { type: 'CGAS 50', pinDia: 50, weldShankWidth: 45, weldShankLength: 85, clampScrew: 'M12', tighteningTorqueMA: 100, staticRatingC0KN: 422, admissibleLoadFadmKN: 139.3, weldThroatRecommendedAw: 11 },
    { type: 'CGAS 60', pinDia: 60, weldShankWidth: 59, weldShankLength: 100, clampScrew: 'M16', tighteningTorqueMA: 250, staticRatingC0KN: 522, admissibleLoadFadmKN: 172.3, weldThroatRecommendedAw: 13 },
    { type: 'CGAS 70', pinDia: 70, weldShankWidth: 70, weldShankLength: 115, clampScrew: 'M16', tighteningTorqueMA: 250, staticRatingC0KN: 707, admissibleLoadFadmKN: 233.3, weldThroatRecommendedAw: 15 },
    { type: 'CGAS 80', pinDia: 80, weldShankWidth: 85, weldShankLength: 130, clampScrew: 'M20', tighteningTorqueMA: 490, staticRatingC0KN: 870, admissibleLoadFadmKN: 287.1, weldThroatRecommendedAw: 18 },
    { type: 'CGAS 90', pinDia: 90, weldShankWidth: 91, weldShankLength: 145, clampScrew: 'M20', tighteningTorqueMA: 490, staticRatingC0KN: 1284, admissibleLoadFadmKN: 423.7, weldThroatRecommendedAw: 20 },
    { type: 'CGAS 100', pinDia: 100, weldShankWidth: 95, weldShankLength: 160, clampScrew: 'M20', tighteningTorqueMA: 490, staticRatingC0KN: 1460, admissibleLoadFadmKN: 481.8, weldThroatRecommendedAw: 22 },
    { type: 'CGAS 110', pinDia: 110, weldShankWidth: 106, weldShankLength: 180, clampScrew: 'M24', tighteningTorqueMA: 840, staticRatingC0KN: 2024, admissibleLoadFadmKN: 667.9, weldThroatRecommendedAw: 25 }
];

export interface RexrothTrunnionBlockCLTB {
    type: string;               // e.g. "CLTB 25"
    pinDia: number;             // mm
    bracketHeightTH: number;    // mm (TH js13)
    baseLengthUL: number;       // mm
    weightPairKg: number;       // kg (çift ağırlığı)
    anchorBoltSize: string;     // e.g. "M12"
}

export const REXROTH_CLTB_CATALOG: RexrothTrunnionBlockCLTB[] = [
    { type: 'CLTB 12', pinDia: 12, bracketHeightTH: 40, baseLengthUL: 63, weightPairKg: 0.4, anchorBoltSize: 'M8' },
    { type: 'CLTB 16', pinDia: 16, bracketHeightTH: 50, baseLengthUL: 80, weightPairKg: 0.85, anchorBoltSize: 'M10' },
    { type: 'CLTB 20', pinDia: 20, bracketHeightTH: 60, baseLengthUL: 90, weightPairKg: 1.2, anchorBoltSize: 'M10' },
    { type: 'CLTB 25', pinDia: 25, bracketHeightTH: 80, baseLengthUL: 110, weightPairKg: 2.1, anchorBoltSize: 'M12' },
    { type: 'CLTB 32', pinDia: 32, bracketHeightTH: 110, baseLengthUL: 150, weightPairKg: 4.55, anchorBoltSize: 'M16' },
    { type: 'CLTB 40', pinDia: 40, bracketHeightTH: 125, baseLengthUL: 170, weightPairKg: 7.3, anchorBoltSize: 'M16' },
    { type: 'CLTB 50', pinDia: 50, bracketHeightTH: 160, baseLengthUL: 210, weightPairKg: 14.5, anchorBoltSize: 'M20' },
    { type: 'CLTB 63', pinDia: 63, bracketHeightTH: 200, baseLengthUL: 265, weightPairKg: 23.1, anchorBoltSize: 'M24' },
    { type: 'CLTB 80', pinDia: 80, bracketHeightTH: 250, baseLengthUL: 325, weightPairKg: 52.3, anchorBoltSize: 'M30' }
];

export function findRexrothCgkdByThread(thread: string): RexrothSwivelHeadCGKD | undefined {
    const clean = thread.replace(/\s+/g, '').toLowerCase();
    return REXROTH_CGKD_CATALOG.find(item => item.threadKK.replace(/\s+/g, '').toLowerCase() === clean);
}

export function findRexrothCgkdByPin(pinDia: number): RexrothSwivelHeadCGKD | undefined {
    const exact = REXROTH_CGKD_CATALOG.find(item => item.pinDia === pinDia);
    if (exact) return exact;
    return REXROTH_CGKD_CATALOG.find(item => item.pinDia >= pinDia);
}

export function findRexrothCgasByPin(pinDia: number): RexrothSwivelHeadCGAS | undefined {
    const exact = REXROTH_CGAS_CATALOG.find(item => item.pinDia === pinDia);
    if (exact) return exact;
    return REXROTH_CGAS_CATALOG.find(item => item.pinDia >= pinDia);
}

