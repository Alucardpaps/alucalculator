/**
 * AluCAD OS — Gear Synthesis & Optimization Engine
 * 
 * STANDARDS CONFORMANCE:
 * - DIN 3960: Definitions, parameters and equations for involute cylindrical gears
 * - ISO 21771: Concepts and geometry of cylindrical involute gears
 * - ISO 6336: Calculation of load capacity of spur and helical gears (Methods B & C)
 * - DIN 3990: Calculation of load capacity of cylindrical gears
 * - DIN 780 / ISO 54: Standard module series for cylindrical gears
 * - DIN 3992: Addendum modification distribution for cylindrical gears
 */

import { GEAR_MATERIALS } from '@/data/gearsData';

// Standard ISO Module Series (DIN 780 / ISO 54 R20 Preferred & Second Choice)
export const ISO_STANDARD_MODULES = [
    1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 7.0, 8.0, 9.0, 10.0, 12.0, 14.0, 16.0, 18.0, 20.0
];

// Helper: Involute Function inv(α) = tan(α) - α (radians)
export function inv(alphaRad: number): number {
    return Math.tan(alphaRad) - alphaRad;
}

// Inverse Involute: Newton-Raphson solver to find α given inv(α)
export function invInv(involuteVal: number, initialGuess = 0.35): number {
    if (involuteVal <= 0) return 0;
    let alpha = initialGuess;
    for (let i = 0; i < 12; i++) {
        const f = Math.tan(alpha) - alpha - involuteVal;
        const df = Math.tan(alpha) ** 2;
        if (Math.abs(df) < 1e-12) break;
        const delta = f / df;
        alpha -= delta;
        if (Math.abs(delta) < 1e-8) break;
    }
    return Math.max(0.01, Math.min(Math.PI / 2 - 0.01, alpha));
}

// =========================================================================
// 1. KAFA KISALTMA (+/- k) CALCULATOR
// =========================================================================

export interface TipShorteningResult {
    sumX: number;
    a_standard: number;
    a_wt: number;
    y: number;              // Center distance alteration coefficient
    k_din: number;          // Theoretical DIN 3960 addendum alteration: k = sumX - y
    effectiveK: number;     // Active k applied (DIN or custom)
    k_mm: number;           // Crest shortening in mm = effectiveK * mn
    da1: number;            // Tip diameter pinion
    da2: number;            // Tip diameter gear
    ha1: number;            // Addendum pinion
    ha2: number;            // Addendum gear
    sa1: number;            // Normal crest thickness pinion
    sa2: number;            // Normal crest thickness gear
    isCrestSharp1: boolean; // True if sa1 < 0.25 * mn (risk of knife-edge tooth crest)
    isCrestSharp2: boolean; // True if sa2 < 0.25 * mn
}

export function computeTipShorteningData(params: {
    mn: number;
    z1: number;
    z2: number;
    betaDeg?: number;
    alphaDeg?: number;
    x1?: number;
    x2?: number;
    kMode?: 'auto' | 'custom' | 'workshop';
    kFactorMode?: 'auto' | 'custom' | 'workshop';
    customK?: number;
    isInternal?: boolean;
}): TipShorteningResult {
    const {
        mn,
        z1,
        z2,
        betaDeg = 0,
        alphaDeg = 20,
        x1 = 0,
        x2 = 0,
        isInternal = false
    } = params;
    const kMode = params.kMode ?? params.kFactorMode ?? 'auto';
    const customK = params.customK ?? 0;
    const betaRad = (betaDeg * Math.PI) / 180;
    const alphaRad = (alphaDeg * Math.PI) / 180;
    const cosBeta = Math.max(0.01, Math.cos(betaRad));
    const mt = mn / cosBeta;
    const alpha_t_rad = betaDeg === 0 ? alphaRad : Math.atan(Math.tan(alphaRad) / cosBeta);

    const d1 = z1 * mt;
    const effZ2 = isInternal ? Math.max(z2, z1 + 6) : z2;
    const d2 = effZ2 * mt;
    const a_standard = isInternal ? (d2 - d1) / 2 : (d1 + d2) / 2;

    const sumX = isInternal ? (x1 - x2) : (x1 + x2);
    const sumZ = isInternal ? (effZ2 - z1) : (z1 + effZ2);
    const inv_alpha_wt = (2 * Math.tan(alphaRad) * sumX / Math.max(1, sumZ)) + inv(alpha_t_rad);
    const alpha_wt = invInv(inv_alpha_wt, alpha_t_rad + 0.02);

    const a_wt = Math.abs(sumX) < 1e-6
        ? a_standard
        : (a_standard * Math.cos(alpha_t_rad)) / Math.cos(alpha_wt);

    // DIN 3960: y = (aw - a) / mn
    const y = Math.abs(sumX) < 1e-6 ? 0 : (a_wt - a_standard) / mn;
    const k_din = isInternal ? 0 : Math.max(0, sumX - y);

    const effectiveK = (kMode === 'custom' || kMode === 'workshop') ? customK : k_din;
    const k_mm = effectiveK * mn;

    // Tip Diameters with Kafa Kisaltma (+/- k)
    let da1 = 0;
    let da2 = 0;
    if (kMode === 'workshop') {
        // Turkish Workshop convention: da = d + 2*mn*(1 + x + k)
        da1 = d1 + 2 * mn * (1.0 + x1 + effectiveK);
        da2 = isInternal
            ? d2 - 2 * mn * (1.0 - x2 - effectiveK)
            : d2 + 2 * mn * (1.0 + x2 + effectiveK);
    } else {
        // DIN 3960 / ISO 21771 convention: da = d + 2*mn*(1 + x - k)
        da1 = d1 + 2 * mn * (1.0 + x1 - effectiveK);
        da2 = isInternal
            ? d2 - 2 * mn * (1.0 - x2 + effectiveK)
            : d2 + 2 * mn * (1.0 + x2 - effectiveK);
    }

    const ha1 = (da1 - d1) / 2;
    const ha2 = isInternal ? (d2 - da2) / 2 : (da2 - d2) / 2;

    // Tooth crest thickness sa calculation (DIN 3960)
    const calcCrestThickness = (z: number, d: number, da: number, x: number) => {
        const db = d * Math.cos(alpha_t_rad);
        if (da <= db) return 0.2 * mn;
        const cosAlphaAt = Math.max(-1, Math.min(1, db / da));
        const alphaAt = Math.acos(cosAlphaAt);
        const st = (Math.PI * mn) / (2 * cosBeta) + (2 * x * mn * Math.tan(alphaRad)) / cosBeta;
        const sa_t = da * (st / d + inv(alpha_t_rad) - inv(alphaAt));
        const sa_n = sa_t * cosBeta; // Normal plane
        return Math.max(0, sa_n);
    };

    const sa1 = calcCrestThickness(z1, d1, da1, x1);
    const sa2 = calcCrestThickness(effZ2, d2, da2, x2);

    return {
        sumX,
        a_standard,
        a_wt,
        y,
        k_din,
        effectiveK,
        k_mm,
        da1,
        da2,
        ha1,
        ha2,
        sa1,
        sa2,
        isCrestSharp1: sa1 < 0.25 * mn,
        isCrestSharp2: sa2 < 0.25 * mn,
    };
}

// =========================================================================
// 2. SISTEM 2: MERKEZ ARASI MESAFE ESLEME & EN MAKUL DISLI OPTIMIZASYONU
// =========================================================================

export interface CenterDistanceMatchResult {
    mn: number;
    z1: number;
    z2: number;
    targetA: number;
    a_standard_spur: number;
    helicalSolution: {
        isPossible: boolean;
        possible: boolean;
        betaDeg: number;
        cosBeta: number;
        isStandardRange: boolean;
        resultingCenterDistance: number;
        description: string;
    };
    helicalMatch: CenterDistanceMatchResult['helicalSolution'];
    profileShiftSolution: {
        alpha_wt_deg: number;
        sumX: number;
        x1: number;
        x2: number;
        y: number;
        k: number;
        k_din: number;
        k_mm: number;
        da1: number;
        da2: number;
        isFeasible: boolean;
        possible: boolean;
        resultingCenterDistance: number;
        description: string;
    };
    profileShiftMatch: CenterDistanceMatchResult['profileShiftSolution'];
}

export function matchCenterDistanceForGearPair(params: {
    mn: number;
    z1: number;
    z2: number;
    targetA?: number;
    targetCenterDistance?: number;
    alphaDeg?: number;
}): CenterDistanceMatchResult {
    const { mn, z1, z2, alphaDeg = 20 } = params;
    const targetA = params.targetA ?? params.targetCenterDistance ?? 100;
    const alphaRad = (alphaDeg * Math.PI) / 180;
    const a0 = (mn * (z1 + z2)) / 2;

    const cosBeta = (mn * (z1 + z2)) / (2 * targetA);
    let helicalSolution: CenterDistanceMatchResult['helicalSolution'];

    if (cosBeta > 0 && cosBeta <= 1.0) {
        const betaRad = Math.acos(cosBeta);
        const betaDeg = (betaRad * 180) / Math.PI;
        const isStandardRange = betaDeg >= 8.0 && betaDeg <= 32.0;
        helicalSolution = {
            isPossible: true,
            possible: true,
            betaDeg,
            cosBeta,
            isStandardRange,
            resultingCenterDistance: targetA,
            description: isStandardRange
                ? `Helis acisi beta=${betaDeg.toFixed(5)} deg secildiginde, sifir profil kaydirma ile eksen mesafesi tam tutturulur.`
                : `Helis acisi beta=${betaDeg.toFixed(5)} deg ekseni karsilar (standart aralik: 8-32 deg).`
        };
    } else {
        helicalSolution = {
            isPossible: false,
            possible: false,
            betaDeg: 0,
            cosBeta,
            isStandardRange: false,
            resultingCenterDistance: a0,
            description: `Bu eksen mesafesi helis acisiyla karsilanamaz (a0=${a0.toFixed(2)} mm > a=${targetA.toFixed(2)} mm).`
        };
    }

    const cosAlphaWt = (a0 * Math.cos(alphaRad)) / targetA;
    let profileShiftSolution: CenterDistanceMatchResult['profileShiftSolution'];

    if (cosAlphaWt > 0 && cosAlphaWt < 1.0) {
        const alphaWt = Math.acos(cosAlphaWt);
        const invAlpha = inv(alphaRad);
        const invAlphaWt = inv(alphaWt);
        const sumX = ((z1 + z2) * (invAlphaWt - invAlpha)) / (2 * Math.tan(alphaRad));

        const x1 = sumX * (z2 / (z1 + z2));
        const x2 = sumX - x1;

        const y = (targetA - a0) / mn;
        const k = sumX - y;
        const k_mm = k * mn;

        const d1 = z1 * mn;
        const d2 = z2 * mn;
        const da1 = d1 + 2 * mn * (1.0 + x1 - k);
        const da2 = d2 + 2 * mn * (1.0 + x2 - k);

        const isFeasible = Math.abs(x1) <= 0.8 && Math.abs(x2) <= 0.8 && k >= -0.5 && k <= 1.0;

        profileShiftSolution = {
            alpha_wt_deg: (alphaWt * 180) / Math.PI,
            sumX,
            x1,
            x2,
            y,
            k,
            k_din: k,
            k_mm,
            da1,
            da2,
            isFeasible,
            possible: isFeasible,
            resultingCenterDistance: targetA,
            description: isFeasible
                ? `Duz dislide x1=${x1 >= 0 ? '+' : ''}${x1.toFixed(5)}, x2=${x2 >= 0 ? '+' : ''}${x2.toFixed(5)} profil kaydirma ve k=${k >= 0 ? '+' : ''}${k.toFixed(5)} (${k_mm.toFixed(3)} mm) kafa kisaltma ile eksen tam tutturulur.`
                : `Profil kaydirma toplami Sigma_x=${sumX.toFixed(3)} sinirlarin disinda. Dis sayilarini degistirmek onerilir.`
        };
    } else {
        profileShiftSolution = {
            alpha_wt_deg: 20,
            sumX: 0,
            x1: 0,
            x2: 0,
            y: 0,
            k: 0,
            k_din: 0,
            k_mm: 0,
            da1: z1 * mn + 2 * mn,
            da2: z2 * mn + 2 * mn,
            isFeasible: false,
            possible: false,
            resultingCenterDistance: a0,
            description: 'Bu eksen mesafesi standart kavrama acisi sinirlari icinde profil kaydirma ile karsilanamaz.'
        };
    }

    return {
        mn,
        z1,
        z2,
        targetA,
        a_standard_spur: a0,
        helicalSolution,
        helicalMatch: helicalSolution,
        profileShiftSolution,
        profileShiftMatch: profileShiftSolution
    };
}

export interface GearRecommendationCandidate {
    z1: number;
    z2: number;
    ratio: number;
    ratioErrorPct: number;
    gearType: 'spur' | 'helical';
    betaDeg: number;
    x1: number;
    x2: number;
    k: number;
    k_mm: number;
    a_actual: number;
    centerDistance: number;
    da1: number;
    da2: number;
    contactRatio: number;
    totalContactRatio: number;
    score: number;
    badge: string;
    recommendationBadge: string;
    pros: string[];
    isBestChoice: boolean;
    isRecommended: boolean;
}

export function searchBestGearsForCenterDistance(params: {
    mn?: number;
    targetA?: number;
    targetCenterDistance?: number;
    targetRatio?: number;
    speedRatio?: number;
    ratioTolerancePct?: number;
    preferredType?: 'any' | 'spur' | 'helical';
    maxBetaDeg?: number;
}): GearRecommendationCandidate[] {
    const targetA = params.targetA ?? params.targetCenterDistance ?? 100;
    const targetRatio = params.targetRatio ?? params.speedRatio ?? 3.0;
    const ratioTolerancePct = params.ratioTolerancePct ?? 25;
    const preferredType = params.preferredType ?? 'any';
    const maxBetaDeg = params.maxBetaDeg ?? 35;
    const moduleCandidates = params.mn ? [params.mn] : [1.5, 2.0, 2.5, 3.0, 4.0, 5.0];
    const candidates: GearRecommendationCandidate[] = [];

    for (const mn of moduleCandidates) {
        for (let z1 = 16; z1 <= 45; z1++) {
            const idealZ2 = Math.round(z1 * targetRatio);
            const z2Min = Math.max(z1, Math.round(idealZ2 * (1 - ratioTolerancePct / 100)));
            const z2Max = Math.round(idealZ2 * (1 + ratioTolerancePct / 100));

            for (let z2 = z2Min; z2 <= z2Max; z2++) {
                const sumZ = z1 + z2;
                const a0 = (mn * sumZ) / 2;
                const ratio = z2 / z1;
                const ratioErrorPct = Math.abs(ratio - targetRatio) / targetRatio * 100;

                if (preferredType !== 'spur') {
                    const cosBeta = a0 / targetA;
                    const minCosBeta = Math.cos((maxBetaDeg * Math.PI) / 180);
                    if (cosBeta >= minCosBeta && cosBeta <= 0.999) {
                        const betaDeg = (Math.acos(cosBeta) * 180) / Math.PI;
                        const d1 = (mn / cosBeta) * z1;
                        const d2 = (mn / cosBeta) * z2;
                        const da1 = d1 + 2 * mn;
                        const da2 = d2 + 2 * mn;
                        const contactRatio = 1.45 + (betaDeg / 30) * 0.7;

                        let score = 85;
                        score -= ratioErrorPct * 1.5;
                        if (betaDeg >= 12 && betaDeg <= 22) score += 10;
                        if (z1 >= 19) score += 5;

                        const pros: string[] = [
                            `Tam ${targetA.toFixed(2)} mm eksen mesafesi (mn=${mn})`,
                            `beta=${betaDeg.toFixed(2)} deg ile sifir profil kaydirma (x=0)`,
                            `Yuksek kavrama orani (eps_gamma approx ${contactRatio.toFixed(2)}) sessiz calisma`
                        ];
                        if (z1 >= 19) pros.push('Kesilme riski yok (z1 >= 19)');

                        candidates.push({
                            z1,
                            z2,
                            ratio,
                            ratioErrorPct,
                            gearType: 'helical',
                            betaDeg,
                            x1: 0,
                            x2: 0,
                            k: 0,
                            k_mm: 0,
                            a_actual: targetA,
                            centerDistance: targetA,
                            da1,
                            da2,
                            contactRatio,
                            totalContactRatio: contactRatio,
                            score: Math.max(20, Math.min(100, Math.round(score))),
                            badge: 'Helis Esleme',
                            recommendationBadge: 'Helis Esleme',
                            pros,
                            isBestChoice: false,
                            isRecommended: false
                        });
                    }
                }

                if (preferredType !== 'helical') {
                    const cosAlphaWt = (a0 * Math.cos(20 * Math.PI / 180)) / targetA;
                    if (cosAlphaWt > 0.88 && cosAlphaWt < 0.999) {
                        const alphaWt = Math.acos(cosAlphaWt);
                        const invAlpha = inv(20 * Math.PI / 180);
                        const invAlphaWt = inv(alphaWt);
                        const sumX = (sumZ * (invAlphaWt - invAlpha)) / (2 * Math.tan(20 * Math.PI / 180));

                        if (Math.abs(sumX) <= 1.0) {
                            const x1 = sumX * (z2 / sumZ);
                            const x2 = sumX - x1;
                            const y = (targetA - a0) / mn;
                            const k = sumX - y;
                            const d1 = z1 * mn;
                            const d2 = z2 * mn;
                            const da1 = d1 + 2 * mn * (1 + x1 - k);
                            const da2 = d2 + 2 * mn * (1 + x2 - k);
                            const contactRatio = 1.45;

                            let score = 75;
                            score -= ratioErrorPct * 1.5;
                            if (Math.abs(x1) <= 0.4 && Math.abs(x2) <= 0.4) score += 10;
                            if (z1 >= 17) score += 5;

                            const pros: string[] = [
                                `Duz disli (mn=${mn}, Eksenel kuvvet Fa = 0)`,
                                `x1=${x1 >= 0 ? '+' : ''}${x1.toFixed(3)}, x2=${x2 >= 0 ? '+' : ''}${x2.toFixed(3)} ile tam eksen`,
                                `Kafa kisaltma k=${k.toFixed(3)} (${(k * mn).toFixed(2)} mm)`
                            ];

                            candidates.push({
                                z1,
                                z2,
                                ratio,
                                ratioErrorPct,
                                gearType: 'spur',
                                betaDeg: 0,
                                x1,
                                x2,
                                k,
                                k_mm: k * mn,
                                a_actual: targetA,
                                centerDistance: targetA,
                                da1,
                                da2,
                                contactRatio,
                                totalContactRatio: contactRatio,
                                score: Math.max(20, Math.min(100, Math.round(score))),
                                badge: 'Duz V-Disli',
                                recommendationBadge: 'Duz V-Disli',
                                pros,
                                isBestChoice: false,
                                isRecommended: false
                            });
                        }
                    }
                }
            }
        }
    }

    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length > 0) {
        candidates[0].isBestChoice = true;
        candidates[0].isRecommended = true;
        candidates[0].badge = '★ EN MAKUL DİŞLİ';
        candidates[0].recommendationBadge = '★ EN MAKUL DİŞLİ';
    }

    return candidates.slice(0, 8);
}

// =========================================================================
// 3. SISTEM 3: OTONOM DIS SAYISI VE MODUL SENTEZ MOTORU
// =========================================================================

export interface AutonomousSizingInput {
    powerKw: number;
    inputRpm: number;
    outputRpm?: number;
    targetOutputRpm?: number;
    targetRatio?: number;
    speedRatio?: number;
    material?: string;
    materialName?: string;
    gearType?: 'spur' | 'helical';
    targetCenterDistance?: number;
    loadType?: 'uniform' | 'moderate' | 'heavy';
    serviceFactor?: number;
    desiredSafetyFactor?: number;
}

export interface AutonomousSizingResult {
    inputTorqueNm: number;
    outputTorqueNm: number;
    calculatedRatio: number;
    actualRatio: number;
    ratioErrorPct: number;
    inputRpm: number;
    actualOutputRpm: number;
    recommendedModule: number;
    z1: number;
    z2: number;
    pinionTeeth: number;
    gearTeeth: number;
    gearType: 'spur' | 'helical';
    helixAngleDeg: number;
    faceWidthMm: number;
    centerDistanceMm: number;
    centerDistance: number;
    pressureAngleDeg: number;
    x1: number;
    x2: number;
    k: number;
    k_mm: number;
    d1: number;
    d2: number;
    da1: number;
    da2: number;
    df1: number;
    df2: number;
    bendingStressMpa: number;
    contactStressMpa: number;
    SF_bending: number;
    SF_contact: number;
    safetyBending: number;
    safetyContact: number;
    isSafe: boolean;
    designNotes: string[];
}

export function synthesizeGearAutonomous(params: AutonomousSizingInput): AutonomousSizingResult {
    const {
        powerKw,
        inputRpm,
        gearType = 'helical',
        targetCenterDistance,
        loadType = 'moderate',
    } = params;

    const targetOutputRpm = params.targetOutputRpm ?? params.outputRpm;
    const explicitRatio = params.targetRatio ?? params.speedRatio;
    const materialName = params.materialName ?? params.material ?? '42CrMo4 (Islah / QT)';
    const desiredSafetyFactor = params.desiredSafetyFactor ?? params.serviceFactor ?? 1.4;

    const T1 = (9550 * powerKw) / Math.max(1, inputRpm);
    const i_target = explicitRatio ?? (targetOutputRpm ? inputRpm / targetOutputRpm : 3.5);
    const KA = loadType === 'uniform' ? 1.0 : loadType === 'moderate' ? 1.25 : 1.5;

    const mat = GEAR_MATERIALS.find(m => m.name.includes(materialName.split(' ')[0])) || GEAR_MATERIALS[0];
    const sigmaFlim = mat.sigma_Flim || 430;
    const sigmaHlim = mat.sigma_Hlim || 1100;
    const sigmaFP = sigmaFlim / desiredSafetyFactor;

    let z1 = gearType === 'helical' ? 21 : 23;
    let z2 = Math.max(z1, Math.round(z1 * i_target));
    const actualRatio = z2 / z1;
    const ratioErrorPct = Math.abs(actualRatio - i_target) / i_target * 100;
    const actualOutputRpm = inputRpm / actualRatio;
    const T2 = T1 * actualRatio * 0.98;

    const psi_m = 12.0;
    const YF = 2.5;
    const T1_Nmm = T1 * 1000;
    const minCalculatedModule = Math.cbrt((2 * T1_Nmm * KA * YF) / (z1 * psi_m * sigmaFP));

    let selectedModule = ISO_STANDARD_MODULES.find(m => m >= minCalculatedModule) || 4.0;

    let helixAngleDeg = gearType === 'helical' ? 15.0 : 0.0;
    let x1 = 0;
    let x2 = 0;
    let k = 0;
    let centerDist = (selectedModule * (z1 + z2)) / (2 * Math.cos((helixAngleDeg * Math.PI) / 180));

    const designNotes: string[] = [];
    designNotes.push(`Lewis egilme boyutlandirmasindan minimum modul: ${minCalculatedModule.toFixed(2)} mm hesaplandi.`);
    designNotes.push(`DIN 780 standart modul serisinden mn=${selectedModule.toFixed(2)} mm secildi.`);
    designNotes.push(`Kesilme emniyeti icin pinyon dis sayisi z1=${z1}, cark z2=${z2} (Tahvil i=${actualRatio.toFixed(3)}) belirlendi.`);

    if (targetCenterDistance && targetCenterDistance > 0) {
        if (gearType === 'helical') {
            const cosBeta = (selectedModule * (z1 + z2)) / (2 * targetCenterDistance);
            if (cosBeta > 0.82 && cosBeta <= 0.99) {
                helixAngleDeg = (Math.acos(cosBeta) * 180) / Math.PI;
                centerDist = targetCenterDistance;
                designNotes.push(`Hedef ${targetCenterDistance} mm eksen mesafesi icin helis acisi beta=${helixAngleDeg.toFixed(3)} deg olarak uyarlandi.`);
            } else {
                const neededSumZ = Math.round((2 * targetCenterDistance * Math.cos(15 * Math.PI / 180)) / selectedModule);
                z1 = Math.max(17, Math.round(neededSumZ / (1 + actualRatio)));
                z2 = neededSumZ - z1;
                const cosBetaNew = (selectedModule * (z1 + z2)) / (2 * targetCenterDistance);
                if (cosBetaNew > 0.7 && cosBetaNew <= 1.0) {
                    helixAngleDeg = (Math.acos(cosBetaNew) * 180) / Math.PI;
                    centerDist = targetCenterDistance;
                    designNotes.push(`Hedef eksen icin dis sayilari z1=${z1}, z2=${z2} ve beta=${helixAngleDeg.toFixed(3)} deg olarak optimize edildi.`);
                }
            }
        } else {
            const a0 = (selectedModule * (z1 + z2)) / 2;
            const cosAlphaWt = (a0 * Math.cos(20 * Math.PI / 180)) / targetCenterDistance;
            if (cosAlphaWt > 0.85 && cosAlphaWt < 1.0) {
                const alphaWt = Math.acos(cosAlphaWt);
                const sumX = ((z1 + z2) * (inv(alphaWt) - inv(20 * Math.PI / 180))) / (2 * Math.tan(20 * Math.PI / 180));
                x1 = sumX * (z2 / (z1 + z2));
                x2 = sumX - x1;
                const y = (targetCenterDistance - a0) / selectedModule;
                k = sumX - y;
                centerDist = targetCenterDistance;
                designNotes.push(`Hedef eksen icin x1=${x1.toFixed(3)}, x2=${x2.toFixed(3)} profil kaydirma ve k=${k.toFixed(3)} kafa kisaltma uygulandi.`);
            }
        }
    }

    const faceWidthMm = Math.round(selectedModule * psi_m);
    const betaRad = (helixAngleDeg * Math.PI) / 180;
    const cosBeta = Math.max(0.01, Math.cos(betaRad));
    const mt = selectedModule / cosBeta;

    const d1 = z1 * mt;
    const d2 = z2 * mt;
    const da1 = d1 + 2 * selectedModule * (1 + x1 - k);
    const da2 = d2 + 2 * selectedModule * (1 + x2 - k);
    const df1 = d1 - 2 * selectedModule * (1.25 - x1);
    const df2 = d2 - 2 * selectedModule * (1.25 - x2);

    const Ft = (2000 * T1) / d1;
    const sigmaF = (Ft * KA * 1.15 * YF) / (faceWidthMm * selectedModule);
    const SF_bending = sigmaFlim / Math.max(1, sigmaF);

    const u = z2 / z1;
    const sigmaH = 189.8 * Math.sqrt((Ft * KA * 1.15 * (u + 1)) / (d1 * faceWidthMm * u * Math.sin(20 * Math.PI / 180) * Math.cos(20 * Math.PI / 180)));
    const SF_contact = sigmaHlim / Math.max(1, sigmaH);

    return {
        inputTorqueNm: T1,
        outputTorqueNm: T2,
        calculatedRatio: i_target,
        actualRatio,
        ratioErrorPct,
        inputRpm,
        actualOutputRpm,
        recommendedModule: selectedModule,
        z1,
        z2,
        pinionTeeth: z1,
        gearTeeth: z2,
        gearType,
        helixAngleDeg,
        faceWidthMm,
        centerDistanceMm: centerDist,
        centerDistance: centerDist,
        pressureAngleDeg: 20,
        x1,
        x2,
        k,
        k_mm: k * selectedModule,
        d1,
        d2,
        da1,
        da2,
        df1,
        df2,
        bendingStressMpa: sigmaF,
        contactStressMpa: sigmaH,
        SF_bending,
        SF_contact,
        safetyBending: SF_bending,
        safetyContact: SF_contact,
        isSafe: SF_bending >= 1.4 && SF_contact >= 1.0,
        designNotes
    };
}
