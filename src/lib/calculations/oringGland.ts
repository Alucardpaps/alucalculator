/**
 * ISO 3601 / AS568 O-Ring Sealing & Gland Design Calculation Engine
 * 
 * Standards:
 * - ISO 3601-1: O-ring dimensions and tolerances
 * - ISO 3601-2: Housing dimensions for standard applications
 * - ISO 3601-4: Anti-extrusion devices (backup rings)
 * - ISO 3601-5: Elastomeric materials specifications
 *
 * Geometry model (normative / textbook tier):
 *   - Radial glands: compressed height h = groove depth H + radial gap g (g = 2g/2); axial glands: h = H
 *   - Squeeze S = (W' − h) / W'
 *   - ID stretch ε = (d_groove − d₁)/d₁ (piston / external gland), OD compression for rod glands
 *   - Stretched cord W' = W / √(1 + ε) (constant-volume approximation — engineering estimate tier;
 *     Parker ORD 5700 gives an empirical curve that is within ~1 % of this up to 5 % stretch)
 *   - Fill F = (π·W'²/4) / (b·h)
 * Guideline tier: extrusion-gap limits vs. pressure & hardness (Parker ORD 5700 Fig. 3-2 / ISO 3601-4).
 */

export interface ORingStandardCord {
    id: string;
    label: string;
    cordDiameter: number; // W (mm)
    standardType: 'AS568' | 'Metric';
}

export const STANDARD_CORDS: ORingStandardCord[] = [
    { id: 'as-178', label: '1.78 mm (AS568 - 0xx)', cordDiameter: 1.78, standardType: 'AS568' },
    { id: 'as-262', label: '2.62 mm (AS568 - 1xx)', cordDiameter: 2.62, standardType: 'AS568' },
    { id: 'as-353', label: '3.53 mm (AS568 - 2xx)', cordDiameter: 3.53, standardType: 'AS568' },
    { id: 'as-533', label: '5.33 mm (AS568 - 3xx)', cordDiameter: 5.33, standardType: 'AS568' },
    { id: 'as-699', label: '6.99 mm (AS568 - 4xx)', cordDiameter: 6.99, standardType: 'AS568' },
    { id: 'iso-150', label: '1.50 mm (Metric ISO)', cordDiameter: 1.50, standardType: 'Metric' },
    { id: 'iso-200', label: '2.00 mm (Metric ISO)', cordDiameter: 2.00, standardType: 'Metric' },
    { id: 'iso-250', label: '2.50 mm (Metric ISO)', cordDiameter: 2.50, standardType: 'Metric' },
    { id: 'iso-300', label: '3.00 mm (Metric ISO)', cordDiameter: 3.00, standardType: 'Metric' },
    { id: 'iso-400', label: '4.00 mm (Metric ISO)', cordDiameter: 4.00, standardType: 'Metric' },
    { id: 'iso-500', label: '5.00 mm (Metric ISO)', cordDiameter: 5.00, standardType: 'Metric' },
    { id: 'iso-600', label: '6.00 mm (Metric ISO)', cordDiameter: 6.00, standardType: 'Metric' },
];

export type GlandApplicationType = 
    | 'static_radial_piston'
    | 'static_radial_rod'
    | 'static_axial_internal'
    | 'static_axial_external'
    | 'dynamic_reciprocating'
    | 'dynamic_rotary';

export interface GlandAppConfig {
    name: string;
    description: string;
    targetSqueezeMin: number; // %
    targetSqueezeMax: number; // %
    targetFillMin: number;    // %
    targetFillMax: number;    // %
    depthRatio: number;       // default gland depth H / W ratio
    widthRatio: number;       // default gland width b / W ratio
}

export const GLAND_APP_CONFIGS: Record<GlandApplicationType, GlandAppConfig> = {
    'static_radial_piston': {
        name: 'Statik Radyal (Piston Oluk)',
        description: 'Boru/silindir içine oturan sabit gövde ve piston sızdırmazlığı.',
        targetSqueezeMin: 15,
        targetSqueezeMax: 28,
        targetFillMin: 70,
        targetFillMax: 85,
        depthRatio: 0.78,
        widthRatio: 1.35
    },
    'static_radial_rod': {
        name: 'Statik Radyal (Mil / Kovan İçi Oluk)',
        description: 'Dış gövde içine açılmış kovan içi olukta sabit mil sızdırmazlığı.',
        targetSqueezeMin: 15,
        targetSqueezeMax: 28,
        targetFillMin: 70,
        targetFillMax: 85,
        depthRatio: 0.78,
        widthRatio: 1.35
    },
    'static_axial_internal': {
        name: 'Statik Eksenel Flanş (İç Basınç)',
        description: 'Kapak ve flanş alın sızdırmazlığı. Akışkan basıncı O-ringi dış duvara doğru iter.',
        targetSqueezeMin: 18,
        targetSqueezeMax: 30,
        targetFillMin: 65,
        targetFillMax: 85,
        depthRatio: 0.75,
        widthRatio: 1.40
    },
    'static_axial_external': {
        name: 'Statik Eksenel Flanş (Dış Basınç / Vakum)',
        description: 'Vakum veya dış ortam basıncı O-ringi iç kanat duvarına doğru iter.',
        targetSqueezeMin: 18,
        targetSqueezeMax: 30,
        targetFillMin: 65,
        targetFillMax: 85,
        depthRatio: 0.75,
        widthRatio: 1.40
    },
    'dynamic_reciprocating': {
        name: 'Dinamik İleri-Geri (Hidrolik / Pnömatik Silindir)',
        description: 'Doğrusal hareketli piston ve mil sızdırmazlığı. Düşük sürtünme için ılımlı sıkışma.',
        targetSqueezeMin: 10,
        targetSqueezeMax: 18,
        targetFillMin: 70,
        targetFillMax: 85,
        depthRatio: 0.86,
        widthRatio: 1.45
    },
    'dynamic_rotary': {
        name: 'Dinamik Döner Mil (Rotary Shaft)',
        description: 'Düşük devirli dönel hareket. Gow-Joule termal büzülme etkisini önlemek için minimum sıkışma.',
        targetSqueezeMin: 5,
        targetSqueezeMax: 12,
        targetFillMin: 65,
        targetFillMax: 80,
        depthRatio: 0.92,
        widthRatio: 1.50
    }
};

export interface ORingMaterial {
    id: string;
    name: string;
    hardnessShoreA: 70 | 80 | 90;
    tempMin: number; // °C
    tempMax: number; // °C
    fluidMedia: string;
    swellFactor: number; // typical volume swell % (e.g. 0.05 for 5%)
}

export const ORING_MATERIALS: Record<string, ORingMaterial> = {
    'nbr-70': {
        id: 'nbr-70',
        name: 'NBR 70 Shore A (Standart Nitril - Hidrolik/Hava)',
        hardnessShoreA: 70,
        tempMin: -30,
        tempMax: 100,
        fluidMedia: 'Mineral yağlar, hidrolik sıvı, hava, su',
        swellFactor: 0.08
    },
    'nbr-90': {
        id: 'nbr-90',
        name: 'NBR 90 Shore A (Sert Nitril - Yüksek Basınç)',
        hardnessShoreA: 90,
        tempMin: -25,
        tempMax: 100,
        fluidMedia: 'Yüksek basınçlı mineral yağlar',
        swellFactor: 0.06
    },
    'fkm-75': {
        id: 'fkm-75',
        name: 'FKM / Viton 75 Shore A (Yüksek Isı & Kimyasal)',
        hardnessShoreA: 70,
        tempMin: -20,
        tempMax: 200,
        fluidMedia: 'Sentetik yağlar, yakıtlar, solventler, asitler',
        swellFactor: 0.03
    },
    'fkm-90': {
        id: 'fkm-90',
        name: 'FKM / Viton 90 Shore A (Yüksek Basınç & Isı)',
        hardnessShoreA: 90,
        tempMin: -15,
        tempMax: 210,
        fluidMedia: 'Ekstrem kimyasal & yüksek sıcaklık hidrolik',
        swellFactor: 0.02
    },
    'epdm-70': {
        id: 'epdm-70',
        name: 'EPDM 70 Shore A (Buhar & Fren Hidroliği)',
        hardnessShoreA: 70,
        tempMin: -45,
        tempMax: 140,
        fluidMedia: 'Sıcak su, buhar, DOT fren hidroliği, ozon',
        swellFactor: 0.05
    }
};

export interface ORingCalculationInput {
    cordDiameter: number;       // W (mm)
    innerDiameter: number;      // d_1 (mm)
    applicationType: GlandApplicationType;
    materialId: string;
    operatingPressureBar: number; // bar
    customGlandDepth?: number;  // H (mm)
    customGlandWidth?: number;  // b (mm)
    diametralClearanceGap?: number; // 2g (mm)
    /** Groove diameter (mm): piston / external gland → groove root (inner) Ø; rod / internal gland → groove bottom (outer) Ø.
     *  Omit to assume the usual 2 % ID stretch (piston) or no OD compression (rod). */
    grooveDiameter?: number;
    operatingTemp?: number;     // °C
}

export interface ORingCalculationResult {
    cordDiameter: number;           // W (mm)
    innerDiameter: number;          // d1 (mm)
    outerDiameter: number;          // d3 = d1 + 2W (mm)
    glandDepth: number;             // H (mm)
    glandWidth: number;             // b (mm)
    glandCornerRadius: number;      // r (mm)
    squeezeDepth: number;           // C = W - H (mm)
    squeezePercent: number;         // S%
    isSqueezeSafe: boolean;
    squeezeStatus: 'pass' | 'warn' | 'fail';
    glandFillPercent: number;       // F%
    isFillSafe: boolean;
    fillStatus: 'pass' | 'warn' | 'fail';
    operationalFillPercent: number; // F_op% (including thermal swell)
    idStretchPercent: number;       // lambda%
    stretchStatus: 'pass' | 'warn' | 'fail';
    diametralGapMm: number;         // 2g (mm)
    radialGapMm: number;            // g (mm)
    maxAllowedGapMm: number;        // max allowed 2g for pressure and hardness
    isExtrusionSafe: boolean;
    backupRingRequired: boolean;
    backupRingRecommendation: string;
    overallStatus: 'SAFE' | 'WARNING' | 'CRITICAL';
    designAdvice: string[];
    effectiveCordDiameter: number;  // W' after stretch (mm)
    compressedHeight: number;       // h = H (+ g for radial) (mm)
    odCompressionPercent: number;   // rod gland: OD circumferential compression (%)
    grooveDiameter: number;         // groove Ø used (mm)
    stretchAssumed: boolean;        // true when grooveDiameter was not given
    recommendedGlandDepth: number;  // H giving mid-range squeeze (mm)
    recommendedGlandWidth: number;  // b (mm)
}

/**
 * Calculates ISO 3601 O-Ring and Gland geometry, compression, fill and extrusion resistance
 */
export function calculateORingGland(input: ORingCalculationInput): ORingCalculationResult {
    const W = Math.max(0.5, input.cordDiameter);
    const d1 = Math.max(1.0, input.innerDiameter);
    const d3 = d1 + (2 * W);
    const appConfig = GLAND_APP_CONFIGS[input.applicationType] ?? GLAND_APP_CONFIGS['static_radial_piston'];
    const mat = ORING_MATERIALS[input.materialId] ?? ORING_MATERIALS['nbr-70'];
    const pressure = Math.max(0, input.operatingPressureBar);

    const isAxial = input.applicationType === 'static_axial_internal' || input.applicationType === 'static_axial_external';
    const isRodGland = input.applicationType === 'static_radial_rod';
    const diametralGapMm = Math.max(0, input.diametralClearanceGap ?? 0.15);
    const radialGapMm = isAxial ? 0 : diametralGapMm / 2;

    // ── Stretch / compression from the groove diameter ──
    const stretchAssumed = input.grooveDiameter == null || !(input.grooveDiameter > 0);
    let grooveDiameter: number;
    let idStretchPercent = 0;
    let odCompressionPercent = 0;
    if (isAxial) {
        grooveDiameter = stretchAssumed ? d1 : (input.grooveDiameter as number);
    } else if (isRodGland) {
        grooveDiameter = stretchAssumed ? d3 : (input.grooveDiameter as number);
        odCompressionPercent = Math.max(0, ((d3 - grooveDiameter) / d3) * 100);
    } else {
        grooveDiameter = stretchAssumed ? d1 * 1.02 : (input.grooveDiameter as number);
        idStretchPercent = ((grooveDiameter - d1) / d1) * 100;
    }
    const eps = Math.max(0, idStretchPercent / 100);
    const Weff = W / Math.sqrt(1 + eps);

    // ── Recommended gland: depth for mid-range squeeze, width from the application ratio ──
    const midSqueeze = (appConfig.targetSqueezeMin + appConfig.targetSqueezeMax) / 200;
    const recDepth = Number(Math.max(0.1, Weff * (1 - midSqueeze) - radialGapMm).toFixed(2));
    const recWidth = Number((W * appConfig.widthRatio).toFixed(2));
    const H = input.customGlandDepth ?? recDepth;
    const b = input.customGlandWidth ?? recWidth;

    // Corner radius ISO 3601 recommendation
    const glandCornerRadius = Number(Math.min(0.8, Math.max(0.2, W * 0.15)).toFixed(2));

    // 1. Squeeze: S = (W' − h)/W', h = H + g (radial)
    const compressedHeight = H + radialGapMm;
    const squeezeDepth = Weff - compressedHeight;
    const squeezePercent = (squeezeDepth / Weff) * 100;

    let squeezeStatus: 'pass' | 'warn' | 'fail' = 'pass';
    if (squeezePercent < appConfig.targetSqueezeMin) {
        squeezeStatus = squeezePercent < (appConfig.targetSqueezeMin - 4) ? 'fail' : 'warn';
    } else if (squeezePercent > appConfig.targetSqueezeMax) {
        squeezeStatus = squeezePercent > (appConfig.targetSqueezeMax + 5) ? 'fail' : 'warn';
    }
    const isSqueezeSafe = squeezeStatus !== 'fail';

    // 2. Gland Fill Percentage
    // O-ring cross-section area: A_oring = pi * W^2 / 4
    // Gland cross-section area: A_gland = b * h  (h = H + g for radial glands)
    const aOring = (Math.PI * Math.pow(Weff, 2)) / 4;
    const aGland = Math.max(0.1, b * compressedHeight);
    const glandFillPercent = (aOring / aGland) * 100;

    // Operational fill including thermal expansion and fluid swell
    const operationalFillPercent = glandFillPercent * (1 + mat.swellFactor);

    let fillStatus: 'pass' | 'warn' | 'fail' = 'pass';
    if (glandFillPercent < 60) {
        fillStatus = 'warn'; // Gland underfilled, possible dynamic seal twisting
    } else if (operationalFillPercent > 92) {
        fillStatus = 'fail'; // High risk of destructive extrusion under expansion
    } else if (operationalFillPercent > 85) {
        fillStatus = 'warn';
    }
    const isFillSafe = fillStatus !== 'fail';

    // 3. Stretch / compression status (Parker ORD 5700: ≤ 5 % stretch, ≤ 3 % OD compression)
    let stretchStatus: 'pass' | 'warn' | 'fail' = 'pass';
    if (idStretchPercent > 5.0 || odCompressionPercent > 3.0) stretchStatus = 'warn';
    if (idStretchPercent > 8.0 || odCompressionPercent > 5.0) stretchStatus = 'fail';
    if (!isAxial && !isRodGland && idStretchPercent < 0) stretchStatus = 'warn'; // ring loose on the groove root

    // 4. Extrusion Gap Analysis vs Pressure and Shore A Hardness (ISO 3601-4 / Parker)

    // Maximum allowed diametral gap lookup based on Shore A hardness and pressure
    let maxAllowedGapMm = 0.30;
    const hardness = mat.hardnessShoreA;

    if (pressure <= 50) {
        maxAllowedGapMm = hardness >= 90 ? 0.45 : hardness >= 80 ? 0.35 : 0.28;
    } else if (pressure <= 100) {
        maxAllowedGapMm = hardness >= 90 ? 0.35 : hardness >= 80 ? 0.25 : 0.18;
    } else if (pressure <= 150) {
        maxAllowedGapMm = hardness >= 90 ? 0.25 : hardness >= 80 ? 0.18 : 0.12;
    } else if (pressure <= 200) {
        maxAllowedGapMm = hardness >= 90 ? 0.18 : hardness >= 80 ? 0.12 : 0.08;
    } else {
        // > 200 bar
        maxAllowedGapMm = hardness >= 90 ? 0.12 : 0.06;
    }

    const isExtrusionSafe = diametralGapMm <= maxAllowedGapMm;

    // Backup Ring Requirement:
    // Required if pressure > 100 bar (for 70 ShA) or pressure > 150 bar (for 80 ShA) or pressure > 200 bar (for 90 ShA)
    // or if gap exceeds allowed threshold
    const backupRingRequired = 
        !isExtrusionSafe || 
        (pressure >= 100 && hardness === 70) ||
        (pressure >= 150 && hardness === 80) ||
        (pressure >= 200);

    let backupRingRecommendation = 'Destek halkası (backup ring) gerekmez.';
    if (backupRingRequired) {
        if (pressure > 250) {
            backupRingRecommendation = 'Yüksek basınç (>250 bar): ISO 3601-4 PTFE Çift Destek Halkası (Two Backup Rings) zorunludur.';
        } else {
            backupRingRecommendation = 'Tek yönlü basınçta 1 adet, çift yönlü darbede 2 adet ISO 3601-4 PTFE Destek Halkası kullanın.';
        }
    }

    // Design Advice Generation
    const designAdvice: string[] = [];
    if (!isSqueezeSafe) {
        designAdvice.push(`Sıkışma oranı (%${squeezePercent.toFixed(1)}) uygun aralıkta değil. Hedef: %${appConfig.targetSqueezeMin} - %${appConfig.targetSqueezeMax}. Kanal derinliğini (H) ayarlayın.`);
    }
    if (operationalFillPercent > 88) {
        designAdvice.push(`İşletme kanal doluluk oranı (%${operationalFillPercent.toFixed(1)}) yüksek. Isıl genleşme payı için kanal genişliğini (b) en az ${Number((aOring / (compressedHeight * 0.80)).toFixed(2))} mm yapın.`);
    }
    if (!isExtrusionSafe) {
        designAdvice.push(`Mevcut boşluk (${diametralGapMm} mm), ${pressure} bar işletme basıncında ekstrüzyon (conta ezilip aralıktan taşma) riski taşıyor. Çap boşluğunu azaltın veya 90 Shore A malzeme seçin.`);
    }
    if (backupRingRequired) {
        designAdvice.push(backupRingRecommendation);
    }
    if (idStretchPercent > 5) {
        designAdvice.push(`O-ring iç çap gerilmesi %${idStretchPercent.toFixed(1)} > %5: kordon kesiti incelir (W' = ${Weff.toFixed(2)} mm). Daha büyük d₁'li bir O-ring seçin.`);
    } else if (!isAxial && !isRodGland && idStretchPercent < 0) {
        designAdvice.push(`O-ring iç çapı kanal tabanından büyük (%${idStretchPercent.toFixed(1)}): halka kanalda gevşek oturur, montajda kayabilir. d₁ ≤ kanal tabanı Ø seçin.`);
    }
    if (odCompressionPercent > 3) {
        designAdvice.push(`Mil kanalında O-ring dış çapı %${odCompressionPercent.toFixed(1)} sıkıştırılıyor (> %3): halka dalgalanır. Daha küçük d₁ seçin.`);
    }

    if (designAdvice.length === 0) {
        designAdvice.push(`ISO 3601-2 standartlarına göre kanal geometrisi, sıkışma oranı (%${squeezePercent.toFixed(1)}) ve doluluk oranı (%${glandFillPercent.toFixed(1)}) idealdir.`);
    }
    if (stretchAssumed && !isAxial) {
        designAdvice.push(isRodGland ? 'Kanal dış çapı girilmedi: O-ring dış çapının kanala sıkışmadan oturduğu varsayıldı.' : 'Kanal taban çapı girilmedi: tipik %2 iç çap gerilmesi varsayıldı.');
    }

    // Overall Status
    let overallStatus: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';
    if (!isSqueezeSafe || operationalFillPercent > 92 || (!isExtrusionSafe && !backupRingRequired) || stretchStatus === 'fail') {
        overallStatus = 'CRITICAL';
    } else if (squeezeStatus === 'warn' || fillStatus === 'warn' || backupRingRequired || stretchStatus === 'warn') {
        overallStatus = 'WARNING';
    }

    return {
        cordDiameter: W,
        innerDiameter: d1,
        outerDiameter: d3,
        glandDepth: H,
        glandWidth: b,
        glandCornerRadius,
        squeezeDepth,
        squeezePercent,
        isSqueezeSafe,
        squeezeStatus,
        glandFillPercent,
        isFillSafe,
        fillStatus,
        operationalFillPercent,
        idStretchPercent,
        stretchStatus,
        diametralGapMm,
        radialGapMm,
        maxAllowedGapMm,
        isExtrusionSafe,
        backupRingRequired,
        backupRingRecommendation,
        overallStatus,
        designAdvice,
        effectiveCordDiameter: Weff,
        compressedHeight,
        odCompressionPercent,
        grooveDiameter,
        stretchAssumed,
        recommendedGlandDepth: recDepth,
        recommendedGlandWidth: recWidth,
    };
}
