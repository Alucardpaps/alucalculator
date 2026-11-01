/**
 * modules/mechanical/CylinderDesign/catalogs/magCatalog.ts
 * 
 * MAG Hidrolik (Mert Akışkan Gücü) Resmi Katalog Veritabanı
 * Kaynak: mag_katalog_hidrolik_20191226_162446.pdf
 * 
 * Kapsanan Seriler:
 * 1. KHS Serisi: Kompakt Vidalı Boğaz Hidrolik Silindir (160 / 250 Bar)
 * 2. NHS Serisi: Ağır Hizmet Cıvatalı Dairesel Flanşlı Silindir (CETOP R58H / ISO 6022 - 250 Bar)
 * 3. THS Serisi: Tarım Tip Hidrolik Silindir (160 / 250 Bar)
 */

export interface MagKhsDimension {
    code: string;               // e.g. "KHS-40"
    boreD: number;              // mm (Silindir çapı AL)
    standardRods: number[];     // mm (Mil çapları MM)
    glandThreadD3: string;      // Vidalı Boğaz Dişi (e.g. "M52x1.5")
    glandThreadDia: number;     // mm nominal
    glandThreadPitch: number;   // mm
    glandEngagementLength: number; // mm (Lth tipik kavrama boyu)
    tubeOD_D2: number;          // mm Honlanmış boru dış çapı
    portThreadD4: string;       // Yağ giriş dişi (e.g. "G 3/8\"")
    flangePCD_D6: number;       // Ön/Arka Flanş cıvata eksen çapı
    flangeOD_D5: number;        // Flanş dış çapı
    flangeHoleDia_D8: number;   // Flanş cıvata deliği çapı
    pinDia_D9: number;          // Eklem pimi çapı (H9)
    trunnionPinDia_D10: number; // Muylu pimi çapı (f8)
    footHoleDia_D11: number;    // Ayak bağlantı delik çapı (H13)
    sphericalPinDia_D12: number;// Küresel mafsal pimi çapı (H7)
    threadLengthL1: number;     // Mil ucu vida boyu
    spannerFlatLengthL2: number;// Anahtar ağzı boyu
    spannerFlatSW: number[];    // Anahtar ağzı ölçüsü (ör. [17, 22])
    cushioningLengthL4: number; // Yastıklama boyu
    portDistFrontL5: number;    // Ön port eksen mesafesi
    flangeThicknessL6: number;  // Ön flanş kalınlığı
    rearFlangeThickL7: number;  // Arka flanş kalınlığı
    baseLengthLA: number;       // Strok=0 için LA taban boyu
    baseLengthLB: number;       // Strok=0 için LB flanşlar arası boyu
    baseLengthLC: number;       // Strok=0 için LC mafsallar arası boyu
    rodEndThreadD1: string;     // Metrik mil ucu dişi (ör. "M16x1.5")
    weightBaseKg: number;       // Strok=0 ağırlığı kg
    weightPer10mmKg: number;    // Her 10 mm strok için ağırlık kg
    tubeMaterial: string;       // "St 52 BK + S Honlanmış"
    rodMaterial: string;        // "Ck 45 İndüksiyonlu Sert Krom Kaplı"
    pressureNominalBar: number; // 160
    pressurePeakBar: number;    // 250
}

export const MAG_KHS_SERIES: MagKhsDimension[] = [
    {
        code: 'KHS-40',
        boreD: 40,
        standardRods: [22, 28],
        glandThreadD3: 'M52x1.5',
        glandThreadDia: 52,
        glandThreadPitch: 1.5,
        glandEngagementLength: 30,
        tubeOD_D2: 48,
        portThreadD4: 'G 3/8"',
        flangePCD_D6: 106,
        flangeOD_D5: 85,
        flangeHoleDia_D8: 9,
        pinDia_D9: 20,
        trunnionPinDia_D10: 20,
        footHoleDia_D11: 11,
        sphericalPinDia_D12: 20,
        threadLengthL1: 22,
        spannerFlatLengthL2: 13,
        spannerFlatSW: [17, 22],
        cushioningLengthL4: 44,
        portDistFrontL5: 24,
        flangeThicknessL6: 21,
        rearFlangeThickL7: 3,
        baseLengthLA: 122,
        baseLengthLB: 136,
        baseLengthLC: 146,
        rodEndThreadD1: 'M16x1.5',
        weightBaseKg: 1.67,
        weightPer10mmKg: 0.085,
        tubeMaterial: 'St 52 BK + S (E355 Honlanmış Boru)',
        rodMaterial: 'Ck 45 (20MnV6) Sert Krom Kaplı',
        pressureNominalBar: 160,
        pressurePeakBar: 250
    },
    {
        code: 'KHS-50',
        boreD: 50,
        standardRods: [28, 36],
        glandThreadD3: 'M62x1.5',
        glandThreadDia: 62,
        glandThreadPitch: 1.5,
        glandEngagementLength: 35,
        tubeOD_D2: 58,
        portThreadD4: 'G 1/2"',
        flangePCD_D6: 126,
        flangeOD_D5: 100,
        flangeHoleDia_D8: 11,
        pinDia_D9: 25,
        trunnionPinDia_D10: 25,
        footHoleDia_D11: 13,
        sphericalPinDia_D12: 25,
        threadLengthL1: 28,
        spannerFlatLengthL2: 14,
        spannerFlatSW: [22, 30],
        cushioningLengthL4: 54,
        portDistFrontL5: 26,
        flangeThicknessL6: 24,
        rearFlangeThickL7: 4,
        baseLengthLA: 140,
        baseLengthLB: 156,
        baseLengthLC: 169,
        rodEndThreadD1: 'M20x1.5',
        weightBaseKg: 2.66,
        weightPer10mmKg: 0.116,
        tubeMaterial: 'St 52 BK + S (E355 Honlanmış Boru)',
        rodMaterial: 'Ck 45 Sert Krom Kaplı',
        pressureNominalBar: 160,
        pressurePeakBar: 250
    },
    {
        code: 'KHS-63',
        boreD: 63,
        standardRods: [36, 45],
        glandThreadD3: 'M74x2',
        glandThreadDia: 74,
        glandThreadPitch: 2.0,
        glandEngagementLength: 40,
        tubeOD_D2: 73,
        portThreadD4: 'G 3/4"',
        flangePCD_D6: 145,
        flangeOD_D5: 120,
        flangeHoleDia_D8: 14,
        pinDia_D9: 32,
        trunnionPinDia_D10: 32,
        footHoleDia_D11: 13,
        sphericalPinDia_D12: 30,
        threadLengthL1: 36,
        spannerFlatLengthL2: 16,
        spannerFlatSW: [30, 36],
        cushioningLengthL4: 60,
        portDistFrontL5: 36,
        flangeThicknessL6: 26,
        rearFlangeThickL7: 4,
        baseLengthLA: 161,
        baseLengthLB: 181,
        baseLengthLC: 198,
        rodEndThreadD1: 'M27x2',
        weightBaseKg: 4.76,
        weightPer10mmKg: 0.182,
        tubeMaterial: 'St 52 BK + S (E355 Honlanmış Boru)',
        rodMaterial: 'Ck 45 Sert Krom Kaplı',
        pressureNominalBar: 160,
        pressurePeakBar: 250
    },
    {
        code: 'KHS-80',
        boreD: 80,
        standardRods: [45, 56],
        glandThreadD3: 'M90x2',
        glandThreadDia: 90,
        glandThreadPitch: 2.0,
        glandEngagementLength: 48,
        tubeOD_D2: 89,
        portThreadD4: 'G 3/4"',
        flangePCD_D6: 165,
        flangeOD_D5: 150,
        flangeHoleDia_D8: 18,
        pinDia_D9: 40,
        trunnionPinDia_D10: 40,
        footHoleDia_D11: 17,
        sphericalPinDia_D12: 40,
        threadLengthL1: 45,
        spannerFlatLengthL2: 18,
        spannerFlatSW: [36, 46],
        cushioningLengthL4: 65,
        portDistFrontL5: 46,
        flangeThicknessL6: 28,
        rearFlangeThickL7: 4,
        baseLengthLA: 185,
        baseLengthLB: 210,
        baseLengthLC: 232,
        rodEndThreadD1: 'M33x2',
        weightBaseKg: 8.75,
        weightPer10mmKg: 0.287,
        tubeMaterial: 'St 52 BK + S (E355 Honlanmış Boru)',
        rodMaterial: 'Ck 45 Sert Krom Kaplı',
        pressureNominalBar: 160,
        pressurePeakBar: 250
    },
    {
        code: 'KHS-100',
        boreD: 100,
        standardRods: [56, 70],
        glandThreadD3: 'M112x2',
        glandThreadDia: 112,
        glandThreadPitch: 2.0,
        glandEngagementLength: 55,
        tubeOD_D2: 113,
        portThreadD4: 'G 1"',
        flangePCD_D6: 200,
        flangeOD_D5: 180,
        flangeHoleDia_D8: 22,
        pinDia_D9: 50,
        trunnionPinDia_D10: 50,
        footHoleDia_D11: 21,
        sphericalPinDia_D12: 50,
        threadLengthL1: 56,
        spannerFlatLengthL2: 20,
        spannerFlatSW: [46, 60],
        cushioningLengthL4: 67.5,
        portDistFrontL5: 27.5,
        flangeThicknessL6: 32,
        rearFlangeThickL7: 5,
        baseLengthLA: 176,
        baseLengthLB: 201,
        baseLengthLC: 233,
        rodEndThreadD1: 'M42x2',
        weightBaseKg: 11.84,
        weightPer10mmKg: 0.394,
        tubeMaterial: 'St 52 BK + S (E355 Honlanmış Boru)',
        rodMaterial: 'Ck 45 Sert Krom Kaplı',
        pressureNominalBar: 160,
        pressurePeakBar: 250
    },
    {
        code: 'KHS-125',
        boreD: 125,
        standardRods: [70, 90],
        glandThreadD3: 'M136x3',
        glandThreadDia: 136,
        glandThreadPitch: 3.0,
        glandEngagementLength: 65,
        tubeOD_D2: 138,
        portThreadD4: 'G 1"',
        flangePCD_D6: 235,
        flangeOD_D5: 200,
        flangeHoleDia_D8: 22,
        pinDia_D9: 63,
        trunnionPinDia_D10: 63,
        footHoleDia_D11: 25,
        sphericalPinDia_D12: 60,
        threadLengthL1: 63,
        spannerFlatLengthL2: 23,
        spannerFlatSW: [60, 75],
        cushioningLengthL4: 82.5,
        portDistFrontL5: 32.5,
        flangeThicknessL6: 36,
        rearFlangeThickL7: 5,
        baseLengthLA: 199,
        baseLengthLB: 231,
        baseLengthLC: 268,
        rodEndThreadD1: 'M48x2',
        weightBaseKg: 21.28,
        weightPer10mmKg: 0.635,
        tubeMaterial: 'St 52 BK + S (E355 Honlanmış Boru)',
        rodMaterial: 'Ck 45 Sert Krom Kaplı',
        pressureNominalBar: 160,
        pressurePeakBar: 250
    },
    {
        code: 'KHS-160',
        boreD: 160,
        standardRods: [90, 110],
        glandThreadD3: 'M165x3',
        glandThreadDia: 165,
        glandThreadPitch: 3.0,
        glandEngagementLength: 75,
        tubeOD_D2: 178,
        portThreadD4: 'G 1 1/4"',
        flangePCD_D6: 280,
        flangeOD_D5: 240,
        flangeHoleDia_D8: 22,
        pinDia_D9: 80,
        trunnionPinDia_D10: 80,
        footHoleDia_D11: 30,
        sphericalPinDia_D12: 80,
        threadLengthL1: 85,
        spannerFlatLengthL2: 25,
        spannerFlatSW: [75, 100],
        cushioningLengthL4: 93,
        portDistFrontL5: 45,
        flangeThicknessL6: 40,
        rearFlangeThickL7: 5,
        baseLengthLA: 238,
        baseLengthLB: 274,
        baseLengthLC: 327,
        rodEndThreadD1: 'M64x3',
        weightBaseKg: 39.69,
        weightPer10mmKg: 0.920,
        tubeMaterial: 'St 52 BK + S (E355 Honlanmış Boru)',
        rodMaterial: 'Ck 45 Sert Krom Kaplı',
        pressureNominalBar: 160,
        pressurePeakBar: 250
    },
    {
        code: 'KHS-200',
        boreD: 200,
        standardRods: [110, 140],
        glandThreadD3: 'M210x3',
        glandThreadDia: 210,
        glandThreadPitch: 3.0,
        glandEngagementLength: 90,
        tubeOD_D2: 217,
        portThreadD4: 'G 1 1/4"',
        flangePCD_D6: 340,
        flangeOD_D5: 295,
        flangeHoleDia_D8: 26,
        pinDia_D9: 100,
        trunnionPinDia_D10: 100,
        footHoleDia_D11: 33,
        sphericalPinDia_D12: 100,
        threadLengthL1: 95,
        spannerFlatLengthL2: 30,
        spannerFlatSW: [100, 120],
        cushioningLengthL4: 105,
        portDistFrontL5: 50,
        flangeThicknessL6: 45,
        rearFlangeThickL7: 5,
        baseLengthLA: 285,
        baseLengthLB: 325,
        baseLengthLC: 398,
        rodEndThreadD1: 'M80x3',
        weightBaseKg: 80.24,
        weightPer10mmKg: 1.543,
        tubeMaterial: 'St 52 BK + S (E355 Honlanmış Boru)',
        rodMaterial: 'Ck 45 Sert Krom Kaplı',
        pressureNominalBar: 160,
        pressurePeakBar: 250
    }
];

// ============================================================================
// 2. MAG NHS SERİSİ (AĞIR HİZMET / CETOP R58H / ISO 6022 - 250 BAR)
// ============================================================================

export interface MagNhsDimension {
    code: string;               // e.g. "NHS-50"
    boreD: number;              // mm
    standardRods: number[];     // mm
    tubeOD: number;             // mm
    portThread: string;         // e.g. "G 1/2\""
    flangeBoltsCount: number;   // DIN 912 cıvata adedi
    flangeBoltSize: string;     // e.g. "M12x45"
    flangeBoltDia: number;      // mm
    flangeBoltGrade: '10.9' | '12.9';
    flangePCD: number;          // mm
    flangeOD: number;           // mm
    pinDia: number;             // mm
    rodEndThread: string;       // e.g. "M27x2"
    baseLengthLA: number;       // mm
    weightBaseKg: number;
    weightPer10mmKg: number;
    nominalPressureBar: number; // 250
    testPressureBar: number;    // 375
}

export const MAG_NHS_SERIES: MagNhsDimension[] = [
    {
        code: 'NHS-50',
        boreD: 50,
        standardRods: [32, 36],
        tubeOD: 65,
        portThread: 'G 1/2"',
        flangeBoltsCount: 4,
        flangeBoltSize: 'M12x45',
        flangeBoltDia: 12,
        flangeBoltGrade: '10.9',
        flangePCD: 132,
        flangeOD: 160,
        pinDia: 32,
        rodEndThread: 'M27x2',
        baseLengthLA: 185,
        weightBaseKg: 6.8,
        weightPer10mmKg: 0.165,
        nominalPressureBar: 250,
        testPressureBar: 375
    },
    {
        code: 'NHS-63',
        boreD: 63,
        standardRods: [40, 45],
        tubeOD: 80,
        portThread: 'G 3/4"',
        flangeBoltsCount: 4,
        flangeBoltSize: 'M16x55',
        flangeBoltDia: 16,
        flangeBoltGrade: '10.9',
        flangePCD: 150,
        flangeOD: 185,
        pinDia: 40,
        rodEndThread: 'M33x2',
        baseLengthLA: 205,
        weightBaseKg: 10.5,
        weightPer10mmKg: 0.245,
        nominalPressureBar: 250,
        testPressureBar: 375
    },
    {
        code: 'NHS-80',
        boreD: 80,
        standardRods: [50, 56],
        tubeOD: 105,
        portThread: 'G 3/4"',
        flangeBoltsCount: 4,
        flangeBoltSize: 'M16x60',
        flangeBoltDia: 16,
        flangeBoltGrade: '10.9',
        flangePCD: 180,
        flangeOD: 215,
        pinDia: 50,
        rodEndThread: 'M42x2',
        baseLengthLA: 235,
        weightBaseKg: 18.2,
        weightPer10mmKg: 0.380,
        nominalPressureBar: 250,
        testPressureBar: 375
    },
    {
        code: 'NHS-100',
        boreD: 100,
        standardRods: [63, 70],
        tubeOD: 130,
        portThread: 'G 1"',
        flangeBoltsCount: 6,
        flangeBoltSize: 'M16x65',
        flangeBoltDia: 16,
        flangeBoltGrade: '10.9',
        flangePCD: 212,
        flangeOD: 250,
        pinDia: 63,
        rodEndThread: 'M48x2',
        baseLengthLA: 265,
        weightBaseKg: 28.5,
        weightPer10mmKg: 0.540,
        nominalPressureBar: 250,
        testPressureBar: 375
    },
    {
        code: 'NHS-125',
        boreD: 125,
        standardRods: [80, 90],
        tubeOD: 160,
        portThread: 'G 1"',
        flangeBoltsCount: 6,
        flangeBoltSize: 'M20x75',
        flangeBoltDia: 20,
        flangeBoltGrade: '10.9',
        flangePCD: 250,
        flangeOD: 295,
        pinDia: 80,
        rodEndThread: 'M64x3',
        baseLengthLA: 305,
        weightBaseKg: 46.0,
        weightPer10mmKg: 0.850,
        nominalPressureBar: 250,
        testPressureBar: 375
    },
    {
        code: 'NHS-160',
        boreD: 160,
        standardRods: [100, 110],
        tubeOD: 200,
        portThread: 'G 1 1/4"',
        flangeBoltsCount: 8,
        flangeBoltSize: 'M20x90',
        flangeBoltDia: 20,
        flangeBoltGrade: '10.9',
        flangePCD: 315,
        flangeOD: 370,
        pinDia: 100,
        rodEndThread: 'M80x3',
        baseLengthLA: 360,
        weightBaseKg: 85.0,
        weightPer10mmKg: 1.350,
        nominalPressureBar: 250,
        testPressureBar: 375
    },
    {
        code: 'NHS-200',
        boreD: 200,
        standardRods: [125, 140],
        tubeOD: 250,
        portThread: 'G 1 1/4"',
        flangeBoltsCount: 8,
        flangeBoltSize: 'M24x110',
        flangeBoltDia: 24,
        flangeBoltGrade: '10.9',
        flangePCD: 385,
        flangeOD: 450,
        pinDia: 125,
        rodEndThread: 'M100x3',
        baseLengthLA: 420,
        weightBaseKg: 145.0,
        weightPer10mmKg: 2.100,
        nominalPressureBar: 250,
        testPressureBar: 375
    }
];

// Helper functions
export function findMagKhsByBore(boreD: number): MagKhsDimension | undefined {
    return MAG_KHS_SERIES.find(item => item.boreD === boreD);
}

export function findMagNhsByBore(boreD: number): MagNhsDimension | undefined {
    return MAG_NHS_SERIES.find(item => item.boreD === boreD);
}
