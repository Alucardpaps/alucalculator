/**
 * SEALS CATALOG DATABASE
 * Grounded in industrial manufacturer catalogs:
 * - Suptex Döner Mil Keçeleri Kataloğu (DIN 3760 Form A, AS, B, BS, Basınçlı B2)
 * - Kastaş Hidrolik Sızdırmazlık Kataloğu (K21, K33, K35 Step Seal, K16 Kompakt Piston, K40, K01/K03 Toz Keçeleri)
 * - Polilas Teknik Bilgiler & Akma Boşlukları
 * - Maxspare Industrial Hydraulic Seal Catalogue
 */

// =============================================================================
// 1. SUPTEX ROTARY SHAFT OIL SEALS (DÖNER MİL YAĞ KEÇELERİ - DIN 3760)
// =============================================================================

export interface SuptexSealType {
    id: string;
    code: string;
    dinForm: 'A' | 'AS' | 'B' | 'BS' | 'BABSL';
    name: string;
    description: string;
    hasGarterSpring: boolean;
    hasDustLip: boolean;
    outerCase: 'rubber' | 'metal' | 'double_metal';
    maxPressureBar: number;
    maxSpeedMs: {
        NBR: number;
        FKM: number;
        PTFE: number;
    };
    typicalApplications: string;
}

export const SUPTEX_SEAL_TYPES: Record<string, SuptexSealType> = {
    '101': {
        id: '101',
        code: 'Suptex 101',
        dinForm: 'A',
        name: 'Suptex Tip 101 (DIN 3760 Form A)',
        description: 'Dış yüzeyi kauçuk kaplı, yaylı tek sızdırmazlık dudaklı standart döner mil keçesi.',
        hasGarterSpring: true,
        hasDustLip: false,
        outerCase: 'rubber',
        maxPressureBar: 0.5,
        maxSpeedMs: { NBR: 12, FKM: 25, PTFE: 35 },
        typicalApplications: 'Genel endüstri, elektrik motorları, redüktörler, rulman kapakları, standart yağ banyoları.'
    },
    '111': {
        id: '111',
        code: 'Suptex 111',
        dinForm: 'AS',
        name: 'Suptex Tip 111 (DIN 3760 Form AS - Toz Dudaklı)',
        description: 'Dış yüzeyi kauçuk kaplı, yaylı ana dudak ve dış ortam tozuna karşı koruyucu toz dudaklı.',
        hasGarterSpring: true,
        hasDustLip: true,
        outerCase: 'rubber',
        maxPressureBar: 0.5,
        maxSpeedMs: { NBR: 12, FKM: 25, PTFE: 35 },
        typicalApplications: 'Tozlu ve kirli çalışma ortamları, tarım makineleri, otomotiv aksları, dışa açık redüktör milleri.'
    },
    '121': {
        id: '121',
        code: 'Suptex 121',
        dinForm: 'B',
        name: 'Suptex Tip 121 (DIN 3760 Form B - Metal Kovan)',
        description: 'Dış yüzeyi açık metal kovanlı, yuvaya pres geçme ile sıkı oturan yüksek rijitlikli keçe.',
        hasGarterSpring: true,
        hasDustLip: false,
        outerCase: 'metal',
        maxPressureBar: 0.5,
        maxSpeedMs: { NBR: 12, FKM: 25, PTFE: 35 },
        typicalApplications: 'İşlenmiş çelik ve döküm gövdeler, yüksek sıcaklıkta yuva genleşmesi olan rijit montajlar.'
    },
    '131': {
        id: '131',
        code: 'Suptex 131',
        dinForm: 'BS',
        name: 'Suptex Tip 131 (DIN 3760 Form BS - Metal + Toz Dudaklı)',
        description: 'Dış yüzeyi metal kovanlı, yaylı ana sızdırmazlık dudağı ve koruyucu toz dudaklı.',
        hasGarterSpring: true,
        hasDustLip: true,
        outerCase: 'metal',
        maxPressureBar: 0.5,
        maxSpeedMs: { NBR: 12, FKM: 25, PTFE: 35 },
        typicalApplications: 'Ağır sanayi, çimento, maden, haddehane ve tarım redüktörleri.'
    },
    'B2': {
        id: 'B2',
        code: 'Suptex B2 / BABSL',
        dinForm: 'BABSL',
        name: 'Suptex Basınçlı Tip (B2 / BABSL)',
        description: 'Kısa ve takviyeli dudak tasarımıyla basınç altında dudağın ters dönmesini önleyen özel keçe.',
        hasGarterSpring: true,
        hasDustLip: true,
        outerCase: 'rubber',
        maxPressureBar: 10.0,
        maxSpeedMs: { NBR: 6, FKM: 12, PTFE: 18 },
        typicalApplications: 'Hidrolik pompalar, hidromotorlar, hidrostatik tahrikler, basınçlı yağlama sistemleri.'
    }
};

export interface SuptexSizeEntry {
    d1: number; // Shaft diameter (mm)
    D: number;  // Housing bore diameter (mm, H8)
    b: number;  // Seal width (mm)
}

export const SUPTEX_STANDARD_SIZES: SuptexSizeEntry[] = [
    { d1: 10, D: 22, b: 7 },
    { d1: 10, D: 26, b: 7 },
    { d1: 12, D: 24, b: 7 },
    { d1: 12, D: 28, b: 7 },
    { d1: 14, D: 28, b: 7 },
    { d1: 15, D: 30, b: 7 },
    { d1: 15, D: 35, b: 7 },
    { d1: 16, D: 30, b: 7 },
    { d1: 17, D: 30, b: 7 },
    { d1: 17, D: 35, b: 7 },
    { d1: 18, D: 32, b: 7 },
    { d1: 20, D: 35, b: 7 },
    { d1: 20, D: 40, b: 7 },
    { d1: 20, D: 47, b: 7 },
    { d1: 22, D: 35, b: 7 },
    { d1: 22, D: 40, b: 7 },
    { d1: 25, D: 40, b: 7 },
    { d1: 25, D: 42, b: 7 },
    { d1: 25, D: 52, b: 7 },
    { d1: 28, D: 47, b: 7 },
    { d1: 30, D: 47, b: 7 },
    { d1: 30, D: 52, b: 7 },
    { d1: 30, D: 62, b: 7 },
    { d1: 32, D: 52, b: 7 },
    { d1: 35, D: 52, b: 7 },
    { d1: 35, D: 62, b: 7 },
    { d1: 38, D: 58, b: 8 },
    { d1: 40, D: 62, b: 7 },
    { d1: 40, D: 68, b: 8 },
    { d1: 42, D: 62, b: 8 },
    { d1: 45, D: 65, b: 8 },
    { d1: 45, D: 72, b: 8 },
    { d1: 48, D: 70, b: 8 },
    { d1: 50, D: 68, b: 8 },
    { d1: 50, D: 72, b: 8 },
    { d1: 50, D: 80, b: 8 },
    { d1: 55, D: 72, b: 8 },
    { d1: 55, D: 80, b: 8 },
    { d1: 60, D: 80, b: 8 },
    { d1: 60, D: 85, b: 8 },
    { d1: 65, D: 85, b: 10 },
    { d1: 65, D: 90, b: 10 },
    { d1: 70, D: 90, b: 10 },
    { d1: 70, D: 100, b: 10 },
    { d1: 75, D: 95, b: 10 },
    { d1: 75, D: 100, b: 10 },
    { d1: 80, D: 100, b: 10 },
    { d1: 80, D: 110, b: 10 },
    { d1: 85, D: 110, b: 12 },
    { d1: 90, D: 110, b: 10 },
    { d1: 90, D: 120, b: 12 },
    { d1: 95, D: 120, b: 12 },
    { d1: 100, D: 125, b: 12 },
    { d1: 100, D: 130, b: 12 },
    { d1: 110, D: 130, b: 12 },
    { d1: 110, D: 140, b: 12 },
    { d1: 120, D: 150, b: 12 },
    { d1: 130, D: 160, b: 12 },
    { d1: 140, D: 170, b: 12 },
    { d1: 150, D: 180, b: 12 },
];

export const SUPTEX_MATERIAL_SPECS = {
    NBR: {
        name: 'NBR 70 Shore A (Akrilnitril Bütadien Kauçuk)',
        tempRangeC: [-30, 100],
        maxSpeedMs: 12,
        media: 'Madeni yağlar, gresler, hidrolik yağlar (H, H-L, H-LP)',
        advantages: 'Yüksek aşınma direnci, standart yağlara mükemmel dayanım, ekonomik maliyet.'
    },
    FKM: {
        name: 'FKM / Viton 75-80 Shore A (Florokarbon Kauçuk)',
        tempRangeC: [-20, 200],
        maxSpeedMs: 25,
        media: 'Sentetik yağlar, motor yağları, agresif kimyasallar, solventler',
        advantages: 'Yüksek sıcaklık ve devir dayanımı, kimyasal direnç, uzun servis ömrü.'
    },
    PTFE: {
        name: 'PTFE Karbon/Grafit Takviyeli (Teflon Dudaklı)',
        tempRangeC: [-80, 250],
        maxSpeedMs: 35,
        media: 'Tüm kimyasallar, yağsız kuru çalışma, gıda ve ilaç sıvıları',
        advantages: 'Sürtünmesiz çalışma, yüksek çevresel hız, kuru çalışma kabiliyeti.'
    }
};

// =============================================================================
// 2. KASTAŞ HYDRAULIC SEALS (KASTAŞ HİDROLİK SIZDIRMAZLIK ELEMANLARI)
// =============================================================================

export interface KastasSeriesInfo {
    code: string;
    category: 'rod' | 'piston' | 'wiper';
    name: string;
    material: string;
    maxPressureBar: number;
    maxSpeedMs: number;
    tempMinC: number;
    tempMaxC: number;
    isoStandard: string;
    features: string;
}

export const KASTAS_SERIES: Record<string, KastasSeriesInfo> = {
    'K21': {
        code: 'K21',
        category: 'rod',
        name: 'Kastaş K21 (PU Nutring Boğaz/Piston)',
        material: 'PU9401 (Poliüretan 94 Shore A)',
        maxPressureBar: 400,
        maxSpeedMs: 0.5,
        tempMinC: -40,
        tempMaxC: 100,
        isoStandard: 'Genel Hidrolik Nutring',
        features: 'Kompakt simetrik dudak yapısı, mükemmel aşınma direnci, hafif ve orta hizmet hidrolik silindirleri.'
    },
    'K33': {
        code: 'K33',
        category: 'rod',
        name: 'Kastaş K33 (Gelişmiş Çift Dudaklı Boğaz Keçesi)',
        material: 'PU9401 (Poliüretan)',
        maxPressureBar: 400,
        maxSpeedMs: 0.5,
        tempMinC: -35,
        tempMaxC: 100,
        isoStandard: 'Gelişmiş Asimetrik Boğaz',
        features: 'Kesim dudak teknolojisi ile minimum yağ filmi kalınlığı, ikinci dudağıyla partikül koruması ve yüksek sızdırmazlık.'
    },
    'K35': {
        code: 'K35',
        category: 'rod',
        name: 'Kastaş K35 (PTFE Step Seal Boğaz Keçesi)',
        material: 'PT6003 (Bronz Dolgulu PTFE) + NBR O-Ring',
        maxPressureBar: 400,
        maxSpeedMs: 15.0,
        tempMinC: -30,
        tempMaxC: 105,
        isoStandard: 'ISO 7425-2',
        features: 'Çok düşük sürtünme, stick-slip (yapışma-kayma) yapmaz, 15 m/s yüksek hız, uzun çalışma ömrü, CNC silindirleri.'
    },
    'K16': {
        code: 'K16',
        category: 'piston',
        name: 'Kastaş K16 (Kompakt 3 Parça Piston Seti)',
        material: 'NBR Sızdırmazlık + Termoplastik Destek + POM Yataklama',
        maxPressureBar: 400,
        maxSpeedMs: 0.5,
        tempMinC: -30,
        tempMaxC: 100,
        isoStandard: 'Kompakt Çift Etkili Piston',
        features: 'Entegre yataklama ve destek halkaları ile çift etkili silindirlerde komple montaj kolaylığı, ağır iş makineleri ve maden.'
    },
    'K40': {
        code: 'K40',
        category: 'piston',
        name: 'Kastaş K40 (PTFE Çift Etkili Piston Keçesi)',
        material: 'PT6003 (Bronz Dolgulu PTFE) + NBR Elastomer Kare Ring',
        maxPressureBar: 400,
        maxSpeedMs: 15.0,
        tempMinC: -35,
        tempMaxC: 100,
        isoStandard: 'ISO 7425-1',
        features: 'Hidrodinamik basınç tahliye çentikli PTFE manşon, yüksek hız, minimum sürtünme ve hassas servo kontrol.'
    },
    'K01': {
        code: 'K01',
        category: 'wiper',
        name: 'Kastaş K01 (PU Standart Toz Keçesi / Sıyırıcı)',
        material: 'PU9401 (Poliüretan)',
        maxPressureBar: 0,
        maxSpeedMs: 1.0,
        tempMinC: -35,
        tempMaxC: 100,
        isoStandard: 'ISO 6195 Tip A',
        features: 'Mil üzerindeki çamur, toz ve dış ortam pisliğini etkili sıyırır, kapalı yuvalara kolayca takılır.'
    },
    'K03': {
        code: 'K03',
        category: 'wiper',
        name: 'Kastaş K03 (Çift Dudaklı PU Toz Keçesi)',
        material: 'PU9401 (Poliüretan)',
        maxPressureBar: 0,
        maxSpeedMs: 1.0,
        tempMinC: -35,
        tempMaxC: 100,
        isoStandard: 'ISO 6195 Tip B',
        features: 'Dış dudak tozu engellerken iç sıyırıcı dudak rot üzerinde kalan mikro yağ filmini silindir haznesine geri süpürür.'
    }
};

// Standard Rod Sizes & ISO 7425-2 / Kastaş K35 Gland Dimensions
export interface KastasRodDimension {
    d: number;      // Rod diameter (mm)
    D: number;      // Groove diameter (mm)
    L: number;      // Groove width (mm, +0.2)
    S: number;      // Radial gland depth (mm)
    chamferC: number; // Lead-in chamfer length (mm)
    r1: number;     // Bottom corner radius (mm)
}

export const KASTAS_STANDARD_ROD_SIZES: KastasRodDimension[] = [
    { d: 16, D: 23.3, L: 3.2, S: 3.65, chamferC: 2.5, r1: 0.4 },
    { d: 20, D: 27.3, L: 3.2, S: 3.65, chamferC: 2.5, r1: 0.4 },
    { d: 25, D: 32.3, L: 3.2, S: 3.65, chamferC: 2.5, r1: 0.4 },
    { d: 30, D: 40.7, L: 4.2, S: 5.35, chamferC: 4.0, r1: 0.6 },
    { d: 32, D: 42.7, L: 4.2, S: 5.35, chamferC: 4.0, r1: 0.6 },
    { d: 35, D: 45.7, L: 4.2, S: 5.35, chamferC: 4.0, r1: 0.6 },
    { d: 40, D: 50.7, L: 4.2, S: 5.35, chamferC: 4.0, r1: 0.6 },
    { d: 45, D: 55.7, L: 4.2, S: 5.35, chamferC: 4.0, r1: 0.6 },
    { d: 50, D: 60.7, L: 4.2, S: 5.35, chamferC: 4.0, r1: 0.6 },
    { d: 55, D: 65.7, L: 4.2, S: 5.35, chamferC: 4.0, r1: 0.6 },
    { d: 60, D: 75.1, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
    { d: 63, D: 78.1, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
    { d: 70, D: 85.1, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
    { d: 80, D: 95.1, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
    { d: 90, D: 105.1, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
    { d: 100, D: 115.1, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
    { d: 110, D: 125.1, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
    { d: 120, D: 135.1, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
    { d: 125, D: 140.1, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
    { d: 140, D: 155.1, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
    { d: 150, D: 165.1, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
    { d: 160, D: 175.1, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
];

// Standard Cylinder Bore Sizes & ISO 7425-1 / Kastaş K40 Gland Dimensions
export interface KastasPistonDimension {
    D: number;      // Cylinder bore diameter (mm, H8)
    d: number;      // Piston groove diameter (mm, h9)
    L: number;      // Groove width (mm, +0.2)
    S: number;      // Radial depth (mm)
    chamferC: number;
    r1: number;
}

export const KASTAS_STANDARD_PISTON_SIZES: KastasPistonDimension[] = [
    { D: 25, d: 17.7, L: 3.2, S: 3.65, chamferC: 2.5, r1: 0.4 },
    { D: 32, d: 24.7, L: 3.2, S: 3.65, chamferC: 2.5, r1: 0.4 },
    { D: 40, d: 29.3, L: 4.2, S: 5.35, chamferC: 4.0, r1: 0.6 },
    { D: 50, d: 39.3, L: 4.2, S: 5.35, chamferC: 4.0, r1: 0.6 },
    { D: 63, d: 52.3, L: 4.2, S: 5.35, chamferC: 4.0, r1: 0.6 },
    { D: 70, d: 59.3, L: 4.2, S: 5.35, chamferC: 4.0, r1: 0.6 },
    { D: 80, d: 64.9, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
    { D: 90, d: 74.9, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
    { D: 100, d: 84.9, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
    { D: 110, d: 94.9, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
    { D: 125, d: 109.9, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
    { D: 140, d: 124.9, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
    { D: 150, d: 134.9, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
    { D: 160, d: 144.9, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
    { D: 180, d: 164.9, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
    { D: 200, d: 184.9, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
    { D: 250, d: 234.9, L: 6.3, S: 7.55, chamferC: 5.0, r1: 0.8 },
];

// =============================================================================
// 3. POLILAS & KASTAŞ SURFACE AND EXTRUSION RULES
// =============================================================================

export function getMaxExtrusionGap(pressureBar: number, materialType: 'PU' | 'PTFE' | 'NBR'): number {
    if (materialType === 'PTFE') {
        if (pressureBar <= 100) return 0.40;
        if (pressureBar <= 200) return 0.30;
        if (pressureBar <= 300) return 0.22;
        return 0.15;
    }
    if (materialType === 'PU') {
        if (pressureBar <= 100) return 0.35;
        if (pressureBar <= 200) return 0.25;
        if (pressureBar <= 300) return 0.18;
        return 0.12;
    }
    // NBR
    if (pressureBar <= 50) return 0.25;
    if (pressureBar <= 100) return 0.18;
    if (pressureBar <= 150) return 0.12;
    return 0.08;
}

export const POLILAS_SURFACE_REQUIREMENTS = {
    rod: {
        surface: 'Krom Kaplı Mil (Hard Chrome Plated Rod)',
        roughnessRa: '0.10 - 0.20 μm',
        roughnessRz: '≤ 1.0 μm',
        roughnessRmax: '≤ 1.6 μm',
        chromePlating: 'Min. 20 μm kalınlık, ≥ 800 HV sertlik',
        tolerance: 'ISO f7 veya h8'
    },
    bore: {
        surface: 'Honlanmış Silindir Borusu (Honed Cylinder Tube)',
        roughnessRa: '0.20 - 0.40 μm',
        roughnessRz: '≤ 2.0 μm',
        roughnessRmax: '≤ 3.0 μm',
        tolerance: 'ISO H8'
    },
    grooveBase: {
        surface: 'Kanal Tabanı (Groove Root)',
        roughnessRa: '0.80 - 1.60 μm',
        roughnessRz: '≤ 6.3 μm',
        tolerance: 'H9 (boğaz) / h9 (piston)'
    },
    grooveFlanks: {
        surface: 'Kanal Yan Duvarları (Groove Flanks)',
        roughnessRa: '1.60 - 3.20 μm',
        roughnessRz: '≤ 10.0 μm'
    }
};
