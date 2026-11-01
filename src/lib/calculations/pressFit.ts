/**
 * DIN 7190-1:2017 / ISO 286-2 Press Fit & Interference Fit Calculation Engine
 *
 * Normative tier:
 *   - Limit interferences U_min / U_max from ISO 286-2 limit deviations (lib/engine/iso286)
 *   - Smoothing ΔU = 0.8·(Rz_shaft + Rz_hub)                                DIN 7190-1 §6.2
 *   - Lamé joint pressure p = ξ / (d_F·(K_a + K_i)), ξ = U_w / d_F         DIN 7190-1 §6.3
 *   - Capacity from p_min (U_min), stresses / press force / heating from p_max (U_max)
 *   - Elastic limit pressures p_gA = (1−Q_A²)/√3·Re_A, p_gI = 2/√3·Re_I (solid) or (1−Q_I²)/√3·Re_I   DIN 7190-1 §7
 * Engineering estimate tier:
 *   - Press-in force uses μ_e ≈ 1.25·μ (DIN 7190-1 Table A.6 gives a range)
 *
 * Computes:
 * - Lamé thick-walled cylinder radial contact pressure (p_f)
 * - Transmissible torque (T_R) and axial holding force (F_ax)
 * - Hub hoop stress (sigma_t), radial stress (sigma_r), and von Mises equivalent stress (sigma_v)
 * - Solid or hollow shaft equivalent stress
 * - Assembly heating temperature (Delta T, T_hub) and cryogenic cooling temperature (T_shaft)
 * - Assembly mechanical pressing force (F_press)
 */

import { calculateFitFromString } from '@/lib/engine/iso286';

export interface PressFitMaterial {
    id: string;
    name: string;
    E: number;          // Modulus of elasticity (MPa)
    nu: number;         // Poisson's ratio
    alpha: number;      // Thermal expansion coefficient (1/K)
    yieldStrength: number; // Re / Rp0.2 (MPa)
}

export const PRESS_FIT_MATERIALS: Record<string, PressFitMaterial> = {
    'steel': {
        id: 'steel',
        name: 'İmalat Çeliği (E=210 GPa, Sy=355 MPa, α=11.5×10⁻⁶)',
        E: 210000,
        nu: 0.30,
        alpha: 11.5e-6,
        yieldStrength: 355
    },
    'alloy-steel': {
        id: 'alloy-steel',
        name: 'Islah / Alaşımlı Çelik (E=210 GPa, Sy=650 MPa, α=11.2×10⁻⁶)',
        E: 210000,
        nu: 0.30,
        alpha: 11.2e-6,
        yieldStrength: 650
    },
    'cast-iron': {
        id: 'cast-iron',
        name: 'Pik Döküm GG-25 (E=110 GPa, Sy=200 MPa, α=10.5×10⁻⁶)',
        E: 110000,
        nu: 0.26,
        alpha: 10.5e-6,
        yieldStrength: 200
    },
    'bronze': {
        id: 'bronze',
        name: 'Bronz CuSn8 / RG7 (E=105 GPa, Sy=250 MPa, α=18.0×10⁻⁶)',
        E: 105000,
        nu: 0.34,
        alpha: 18.0e-6,
        yieldStrength: 250
    },
    'aluminum': {
        id: 'aluminum',
        name: 'Alüminyum 6061-T6 (E=70 GPa, Sy=275 MPa, α=23.4×10⁻⁶)',
        E: 70000,
        nu: 0.33,
        alpha: 23.4e-6,
        yieldStrength: 275
    }
};

export type FitTolerancePair = 'H7/p6' | 'H7/r6' | 'H7/s6' | 'H7/u6' | 'H7/x6' | 'custom';

export interface TolerancePairInfo {
    name: string;
    description: string;
    /** @deprecated limits now come from ISO 286-2 (calculateFitFromString); kept for compatibility */
    minInterferenceRatio: number;
    /** @deprecated */
    maxInterferenceRatio: number;
}

export const TOLERANCE_PAIR_PRESETS: Record<FitTolerancePair, TolerancePairInfo> = {
    'H7/p6': {
        name: 'H7/p6 (Hafif Sıkı / Geçiş)',
        description: 'Düşük tork, sökülebilir sıkı geçmeler veya kama takviyeli montajlar.',
        minInterferenceRatio: 0.35,
        maxInterferenceRatio: 0.75
    },
    'H7/r6': {
        name: 'H7/r6 (Orta Sıkı Geçme)',
        description: 'Orta tork iletimi, rulman burçları, dişli çark göbekleri.',
        minInterferenceRatio: 0.55,
        maxInterferenceRatio: 1.05
    },
    'H7/s6': {
        name: 'H7/s6 (Kuvvetli Pres Geçme)',
        description: 'Yüksek tork ve eksenel kuvvet, kamasız doğrudan moment iletimi.',
        minInterferenceRatio: 0.85,
        maxInterferenceRatio: 1.45
    },
    'H7/u6': {
        name: 'H7/u6 (Ağır Sıkı / Sıcak Geçme)',
        description: 'Ağır sanayi, tren tekerleri, kalıcı pres ve büzme geçmeler.',
        minInterferenceRatio: 1.30,
        maxInterferenceRatio: 2.10
    },
    'H7/x6': {
        name: 'H7/x6 (Çok Ağır Büzme Geçme)',
        description: 'Ekstrem tork aktarımı, sadece yüksek sıcaklıkta genleşme ile montaj.',
        minInterferenceRatio: 1.90,
        maxInterferenceRatio: 2.90
    },
    'custom': {
        name: 'Özel Sıkılık (Manuel Giriş)',
        description: 'Kullanıcı tanımlı diametral sıkılık değeri (μm).',
        minInterferenceRatio: 1.0,
        maxInterferenceRatio: 1.0
    }
};

export type AssemblyFrictionType = 'dry_press' | 'oiled_press' | 'thermal_shrink' | 'hydraulic';

export const FRICTION_COEFFICIENTS: Record<AssemblyFrictionType, { name: string; mu: number }> = {
    'dry_press': { name: 'Kuru Mekanik Presleme (μ = 0.14)', mu: 0.14 },
    'oiled_press': { name: 'Yağlı / Macunlu Presleme (μ = 0.10)', mu: 0.10 },
    'thermal_shrink': { name: 'Termal Büzme / Isıtarak Geçme (μ = 0.16)', mu: 0.16 },
    'hydraulic': { name: 'Hidrolik Yağ Enjeksiyonu ile Montaj (μ = 0.12)', mu: 0.12 }
};

export interface PressFitCalculationInput {
    contactDiameter: number;    // d_F (mm) - Nominal joint diameter
    contactLength: number;      // l_F (mm) - Hub contact length
    hubOuterDiameter: number;   // D_a (mm) - Outer diameter of hub
    shaftInnerDiameter: number; // d_i (mm) - Inner diameter of shaft (0 for solid shaft)
    tolerancePair: FitTolerancePair;
    customInterferenceUm?: number; // μm (used if tolerancePair === 'custom'): U_min, or the single value
    customInterferenceMaxUm?: number; // μm — optional U_max for a custom range (e.g. transferred from the ISO 286 tab)
    roughnessShaftRz?: number;  // Rz in μm (default 4 μm)
    roughnessHubRz?: number;    // Rz in μm (default 6 μm)
    hubMaterialId: string;
    shaftMaterialId: string;
    assemblyMethod: AssemblyFrictionType;
    operatingTorque: number;    // N·m
    operatingAxialForce: number; // N (axial push/pull)
    ambientTemperature?: number; // °C (default 20°C)
}

export interface PressFitCalculationResult {
    nominalInterferenceUm: number;    // U (μm)
    effectiveInterferenceUm: number;  // U_eff (μm)
    effectiveInterferenceMm: number;  // U_eff (mm)
    contactPressure: number;          // p_f (MPa)
    transmissibleTorque: number;      // T_R (N·m)
    transmissibleAxialForce: number;  // F_ax (kN)
    combinedSafetyFactor: number;     // Ratio of capacity to operating load
    torqueSafetyFactor: number;
    axialSafetyFactor: number;
    hubHoopStress: number;            // sigma_t at inner hub bore (MPa)
    hubRadialStress: number;          // sigma_r at inner hub bore (MPa, = -p_f)
    hubVonMisesStress: number;        // sigma_v (MPa)
    shaftVonMisesStress: number;      // sigma_v (MPa)
    hubSafetyFactor: number;          // S = YieldStrength / sigma_v
    isHubSafe: boolean;
    assemblyPressForce: number;       // F_press (kN)
    assemblyClearanceGap: number;     // S_assembly (mm)
    requiredTempDiffHub: number;      // Delta T for hub heating (°C / K)
    hubTargetHeatingTemp: number;     // T_heat (°C)
    requiredTempDiffShaft: number;    // Delta T for shaft cryogenic cooling (°C / K)
    shaftTargetCoolingTemp: number;   // T_cool (°C)
    hubDiameterRatioQ: number;        // Q_h = d_F / D_a
    shaftDiameterRatioQ: number;      // Q_s = d_i / d_F
    frictionCoeff: number;
    // ── min / max (DIN 7190-1) ──
    interferenceMinUm: number;        // U_min (μm)
    interferenceMaxUm: number;        // U_max (μm)
    effectiveInterferenceMaxUm: number; // U_w,max (μm)
    smoothingUm: number;              // ΔU (μm)
    contactPressureMax: number;       // p_max (MPa) — drives stresses, press force
    hubElasticLimitPressure: number;  // p_gA (MPa)
    shaftElasticLimitPressure: number;// p_gI (MPa)
    shaftSafetyFactor: number;        // p_gI / p_max
    interferenceSource: 'ISO 286-2' | 'custom';
    warnings: string[];
}

/**
 * Calculates interference fit strength and thermal assembly parameters according to DIN 7190-1
 */
export function calculatePressFit(input: PressFitCalculationInput): PressFitCalculationResult {
    const dF = Math.max(1, input.contactDiameter);
    const Da = Math.max(dF + 0.1, input.hubOuterDiameter);
    const di = Math.min(dF - 0.1, Math.max(0, input.shaftInnerDiameter));
    const lF = Math.max(1, input.contactLength);

    const hubMat = PRESS_FIT_MATERIALS[input.hubMaterialId] ?? PRESS_FIT_MATERIALS['steel'];
    const shaftMat = PRESS_FIT_MATERIALS[input.shaftMaterialId] ?? PRESS_FIT_MATERIALS['steel'];
    const friction = FRICTION_COEFFICIENTS[input.assemblyMethod] ?? FRICTION_COEFFICIENTS['thermal_shrink'];
    const mu = friction.mu;
    const Tamb = input.ambientTemperature ?? 20;

    const warnings: string[] = [];

    // ── Limit interferences U_min / U_max ──
    let Umin: number, Umax: number;
    let interferenceSource: 'ISO 286-2' | 'custom' = 'custom';
    if (input.tolerancePair === 'custom') {
        Umin = Math.max(0, input.customInterferenceUm ?? 0);
        Umax = Math.max(Umin, input.customInterferenceMaxUm ?? Umin);
    } else {
        const fit = calculateFitFromString(dF, input.tolerancePair);
        // clearance < 0  ⇔  interference
        Umin = Math.max(0, -fit.maxClearanceUm);
        Umax = Math.max(0, -fit.minClearanceUm);
        interferenceSource = 'ISO 286-2';
        warnings.push(...fit.warnings);
        if (fit.maxClearanceUm > 0) warnings.push(`${input.tolerancePair} at Ø${dF} mm is a transition fit (max. clearance ${fit.maxClearanceUm} μm): U_min is taken as 0.`);
    }
    const nominalInterferenceUm = Umax;

    // ── Smoothing ΔU = 0.8·(Rz_i + Rz_a) (DIN 7190-1) ──
    const Rz_s = input.roughnessShaftRz ?? 4.0; // μm
    const Rz_h = input.roughnessHubRz ?? 6.0;   // μm
    const smoothingUm = 0.8 * (Rz_s + Rz_h);
    const effectiveInterferenceUm = Math.max(0, Umin - smoothingUm);
    const effectiveInterferenceMaxUm = Math.max(0, Umax - smoothingUm);
    const effectiveInterferenceMm = effectiveInterferenceUm / 1000;
    if (Umin > 0 && Umin <= smoothingUm) warnings.push(`U_min (${Umin.toFixed(1)} μm) is consumed by surface smoothing ΔU = ${smoothingUm.toFixed(1)} μm — no guaranteed holding pressure.`);

    // ── Lamé compliance (DIN 7190-1) ──
    const Qh = dF / Da;            // Q_A
    const Qs = di / dF;            // Q_I
    const Qh2 = Qh * Qh;
    const Qs2 = Qs * Qs;
    const Ch = (1 / hubMat.E) * (((1 + Qh2) / (1 - Qh2)) + hubMat.nu);
    const Cs = (1 / shaftMat.E) * (((1 + Qs2) / (1 - Qs2)) - shaftMat.nu);
    const pressureFor = (Uum: number) => (Uum / 1000) / (dF * (Ch + Cs));
    const contactPressure = pressureFor(effectiveInterferenceUm);        // p_min
    const contactPressureMax = pressureFor(effectiveInterferenceMaxUm);  // p_max

    // ── Transmissible capacity from p_min ──
    const normalForce = contactPressure * Math.PI * dF * lF; // N
    const transmissibleAxialForceN = mu * normalForce;
    const transmissibleAxialForce = transmissibleAxialForceN / 1000; // kN
    const transmissibleTorque = (transmissibleAxialForceN * dF) / 2000; // N·m

    const appliedTorque = Math.abs(input.operatingTorque);
    const appliedAxial = Math.abs(input.operatingAxialForce);
    const torqueSafetyFactor = appliedTorque > 0 ? transmissibleTorque / appliedTorque : 999;
    const axialSafetyFactor = appliedAxial > 0 ? transmissibleAxialForceN / appliedAxial : 999;
    // resultant slip force: √(F_t² + F_ax²), F_t = 2T/d_F
    const combinedEquivalentTorque = Math.sqrt(appliedTorque ** 2 + ((appliedAxial * dF) / 2000) ** 2);
    const combinedSafetyFactor = combinedEquivalentTorque > 0 ? transmissibleTorque / combinedEquivalentTorque : 999;

    // ── Stresses at p_max (hub bore) ──
    const hubHoopStress = contactPressureMax * ((1 + Qh2) / (1 - Qh2));
    const hubRadialStress = -contactPressureMax;
    // DIN 7190-1 (GEH): σ_v,A = √3·p / (1 − Q_A²)  ⇔  elastic limit p_gA = (1 − Q_A²)/√3 · Re_A
    const hubVonMisesStress = (Math.sqrt(3) * contactPressureMax) / (1 - Qh2);
    const hubElasticLimitPressure = ((1 - Qh2) / Math.sqrt(3)) * hubMat.yieldStrength;
    // shaft: solid σ_v,I = √3/2·p ; hollow σ_v,I = √3·p / (1 − Q_I²)
    const shaftVonMisesStress = di > 0 ? (Math.sqrt(3) * contactPressureMax) / (1 - Qs2) : (Math.sqrt(3) / 2) * contactPressureMax;
    const shaftElasticLimitPressure = di > 0 ? ((1 - Qs2) / Math.sqrt(3)) * shaftMat.yieldStrength : (2 / Math.sqrt(3)) * shaftMat.yieldStrength;

    const hubSafetyFactor = contactPressureMax > 0 ? hubElasticLimitPressure / contactPressureMax : 999;
    const shaftSafetyFactor = contactPressureMax > 0 ? shaftElasticLimitPressure / contactPressureMax : 999;
    const isHubSafe = hubSafetyFactor >= 1.2;
    if (shaftSafetyFactor < 1.2) warnings.push(`Shaft elastic-limit margin p_gI/p_max = ${shaftSafetyFactor.toFixed(2)} < 1.2${di > 0 ? ' — hollow shaft bore is the critical point.' : '.'}`);
    if (Qh > 0.8) warnings.push(`Thin hub (Q_A = d_F/D_a = ${Qh.toFixed(2)} > 0.8): pressure is very sensitive to tolerance — consider a larger D_a.`);
    if (lF / dF > 1.5) warnings.push(`l_F/d_F = ${(lF / dF).toFixed(2)} > 1.5: pressure concentrates at the hub ends; the extra length adds little capacity.`);

    // ── Assembly (from U_max) ──
    // Press-in force: F_e = μ_e · p_max · π · d_F · l_F, μ_e ≈ 1.25·μ (engineering estimate)
    const assemblyPressForce = (1.25 * mu * contactPressureMax * Math.PI * dF * lF) / 1000; // kN
    // Thermal: joining clearance Sü ≈ 0.001·d_F (min 0.02 mm); ΔT = (U_max + Sü)/(α·d_F)
    const assemblyClearanceGap = Math.max(0.02, 0.001 * dF);
    const totalDilationNeededMm = Umax / 1000 + assemblyClearanceGap;
    const requiredTempDiffHub = Math.ceil(totalDilationNeededMm / (hubMat.alpha * dF));
    const hubTargetHeatingTemp = Tamb + requiredTempDiffHub;
    const requiredTempDiffShaft = Math.ceil(totalDilationNeededMm / (shaftMat.alpha * dF));
    const shaftTargetCoolingTemp = Tamb - requiredTempDiffShaft;
    if (hubTargetHeatingTemp > 350 && (input.hubMaterialId === 'steel' || input.hubMaterialId === 'alloy-steel')) warnings.push(`Hub heating to ${hubTargetHeatingTemp} °C exceeds ~350 °C: risk of tempering a quenched & tempered hub — combine with shaft cooling.`);
    if (input.hubMaterialId === 'aluminum' && hubTargetHeatingTemp > 200) warnings.push(`Aluminium hub above ~200 °C loses temper (T6) — use shaft cooling instead.`);
    if (shaftTargetCoolingTemp < -196) warnings.push(`Shaft cooling below −196 °C (liquid nitrogen) is not practical — heat the hub as well.`);

    return {
        nominalInterferenceUm,
        effectiveInterferenceUm,
        effectiveInterferenceMm,
        contactPressure,
        transmissibleTorque,
        transmissibleAxialForce,
        combinedSafetyFactor,
        torqueSafetyFactor,
        axialSafetyFactor,
        hubHoopStress,
        hubRadialStress,
        hubVonMisesStress,
        shaftVonMisesStress,
        hubSafetyFactor,
        isHubSafe,
        assemblyPressForce,
        assemblyClearanceGap,
        requiredTempDiffHub,
        hubTargetHeatingTemp,
        requiredTempDiffShaft,
        shaftTargetCoolingTemp,
        hubDiameterRatioQ: Qh,
        shaftDiameterRatioQ: Qs,
        frictionCoeff: mu,
        interferenceMinUm: Umin,
        interferenceMaxUm: Umax,
        effectiveInterferenceMaxUm,
        smoothingUm,
        contactPressureMax,
        hubElasticLimitPressure,
        shaftElasticLimitPressure,
        shaftSafetyFactor,
        interferenceSource,
        warnings,
    };
}
