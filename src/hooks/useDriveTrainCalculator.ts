import { useState, useMemo, useEffect } from 'react';
import { IEC_MOTORS, Motor } from '@/data/motorData';
import { GEAR_MATERIALS, GearMaterial, APPLICATION_FACTORS, ApplicationFactor, GEAR_MODULES_ISO } from '@/data/gearsData';
import {
    SERVICE_FACTOR_MATRIX,
    CONNECTION_FACTOR,
    getStartFrequencyFactor,
    LoadClass
} from '@/data/yilmazReduktorData';
import { calculateIso6336Mesh, elasticConstantsForGearMaterial } from '@/lib/iso6336';

export type GearType = 'spur' | 'helical';

export const useDriveTrainCalculator = () => {
    // --- 1. MOTOR STATE ---
    const [selectedPower, setSelectedPower] = useState<number>(4.0);
    const [selectedPoles, setSelectedPoles] = useState<2 | 4 | 6>(4);

    // Find motor from DB
    const motor = useMemo(() => {
        return IEC_MOTORS.find(m => m.power === selectedPower) || IEC_MOTORS[10];
    }, [selectedPower]);

    const motorSpeed = selectedPoles === 2 ? motor.speed_2p : selectedPoles === 4 ? motor.speed_4p : motor.speed_6p;

    // Motor Torque T = 9550 * P / n
    const motorTorque = (9550 * motor.power) / motorSpeed;

    // --- 2. APPLICATION STATE (YR Standards) ---
    const [loadClass, setLoadClass] = useState<LoadClass>('U');
    const [dailyHours, setDailyHours] = useState<number>(8); // <3, 3-10, >10
    const [startsPerHour, setStartsPerHour] = useState<number>(1);
    const [connectionType, setConnectionType] = useState<keyof typeof CONNECTION_FACTOR>('coupling'); // 'coupling' = 1.0 (Direct) effectively 'gear' but neutral. 
    // Using 'gear', 'sprocket', 'v_belt', 'flat_belt' from data, mapping 'coupling' to 1.0 manually or adding to data.
    // Let's assume 'gear' in data meant "Pinion on shaft". 
    // We will align with CONNECTION_FACTOR keys.

    // --- 3. GEAR STATE ---
    const [gearType, setGearType] = useState<GearType>('spur');
    const [meshType, setMeshType] = useState<'external' | 'internal'>('external');
    const [gearModule, setGearModule] = useState<number>(3);
    const [z1, setZ1] = useState<number>(20);
    const [z2, setZ2] = useState<number>(60);
    const [helixAngle, setHelixAngle] = useState<number>(0);
    const [pressureAngle, setPressureAngle] = useState<number>(20);
    const [faceWidth, setFaceWidth] = useState<number>(40);
    const [materialName, setMaterialName] = useState<string>(GEAR_MATERIALS[0].name);

    // Advanced: Profile Shift & Inspection — strictly clamped to [-1.5, 1.5]
    const [x1, setX1Raw] = useState<number>(0);
    const [x2, setX2Raw] = useState<number>(0);

    const setX1 = (val: number) => {
        const num = isNaN(val) ? 0 : Number(val);
        const clamped = Math.max(-1.5, Math.min(1.5, num));
        setX1Raw(Number(clamped.toFixed(5)));
    };

    const setX2 = (val: number) => {
        const num = isNaN(val) ? 0 : Number(val);
        const clamped = Math.max(-1.5, Math.min(1.5, num));
        setX2Raw(Number(clamped.toFixed(5)));
    };

    const [pinDia1, setPinDia1] = useState<number>(Number((1.7 * 3).toFixed(5)));
    const [pinDia2, setPinDia2] = useState<number>(Number((1.7 * 3).toFixed(5)));

    // Kafa Kısaltma (+/- k) — DIN 3960 Auto vs Atölye (Yavuzlar: da = d + 2m(1+x+k)) vs DIN Manuel
    const [kFactorMode, setKFactorMode] = useState<'auto' | 'workshop' | 'custom'>('workshop');
    const [customK1, setCustomK1Raw] = useState<number>(0);
    const [customK2, setCustomK2Raw] = useState<number>(0);
    const [linkK, setLinkK] = useState<boolean>(true);

    const setCustomK1 = (val: number) => {
        const num = isNaN(val) ? 0 : Number(val);
        const clamped = Math.max(-2.5, Math.min(2.5, num));
        const valFixed = Number(clamped.toFixed(5));
        setCustomK1Raw(valFixed);
        if (linkK) {
            setCustomK2Raw(valFixed);
        }
    };

    const setCustomK2 = (val: number) => {
        const num = isNaN(val) ? 0 : Number(val);
        const clamped = Math.max(-2.5, Math.min(2.5, num));
        setCustomK2Raw(Number(clamped.toFixed(5)));
    };

    // Backwards compatibility alias for customK
    const customK = customK1;
    const setCustomK = setCustomK1;

    // Update default pin when module changes
    useEffect(() => {
        const def = Number((1.7 * gearModule).toFixed(5));
        setPinDia1(def);
        setPinDia2(def);
    }, [gearModule]);

    const material = useMemo(() => GEAR_MATERIALS.find(m => m.name === materialName)!, [materialName]);

    // --- 4. CALCULATIONS ---
    const results = useMemo(() => {
        const i = z2 / z1;
        const outputSpeed = motorSpeed / i;
        const efficiency = 0.98;
        const outputTorque = motorTorque * i * efficiency;

        // --- Yılmaz Redüktör Service Factor Calculation ---
        // 1. Determine Duration Index (0: <3, 1: 3-10, 2: >10)
        const durationIdx = dailyHours < 3 ? 0 : dailyHours <= 10 ? 1 : 2;

        // 2. Base Fs from Load Class & Duration
        const baseFs = SERVICE_FACTOR_MATRIX[loadClass][durationIdx];

        // 3. Start Frequency Factor
        const startFactor = getStartFrequencyFactor(startsPerHour);

        // 4. Total Required Service Factor
        const requiredFs = baseFs * startFactor;

        // Geometry
        // NOTE: Helix angle (β) always drives the geometry. A gear is "helical"
        // whenever β > 0; there is no separate spur/helical toggle that can
        // accidentally null out the angle. With β > 0 the transverse module
        // grows (mt = mn / cos β), which in turn increases the reference
        // diameters and therefore the center distance — exactly as expected.
        const betaRad = (helixAngle || 0) * (Math.PI / 180);
        const alphaRad = pressureAngle * (Math.PI / 180); // normal pressure angle (αn)
        const mt = gearModule / Math.cos(betaRad);         // transverse module (mt)
        // Transverse pressure angle (αt) — depends on both αn and β.
        const alpha_t_rad = Math.atan(Math.tan(alphaRad) / Math.cos(betaRad));

        // Reference (pitch) Diameters — transverse plane: d = z · mt
        const isInternal = meshType === 'internal';
        const effZ2 = isInternal ? Math.max(z2, z1 + 6) : z2;
        const d1 = z1 * mt;
        const d2 = effZ2 * mt;
        // Center distance: External: (d1+d2)/2, Internal: (d2-d1)/2
        const a_standard = isInternal ? (d2 - d1) / 2 : (d1 + d2) / 2;

        // --- PROFILE SHIFT LOGIC ---
        // Involute Function: inv(x) = tan(x) - x
        const inv = (angle: number) => Math.tan(angle) - angle;

        // Operating Pressure Angle (alpha_wt)
        const sumX = isInternal ? (x1 - x2) : (x1 + x2);
        const sumZ = isInternal ? (effZ2 - z1) : (z1 + effZ2);
        const inv_alpha_wt = (2 * Math.tan(alphaRad) * sumX / Math.max(1, sumZ)) + inv(alpha_t_rad);

        // Iterate for alpha_wt (Newton-Raphson starting close to alpha_t_rad)
        let alpha_wt = alpha_t_rad + 0.02;
        for (let k = 0; k < 8; k++) {
            alpha_wt = alpha_wt - (inv(alpha_wt) - inv_alpha_wt) / (Math.tan(alpha_wt) ** 2);
        }

        // Operating Center Distance
        const a_wt = Math.abs(sumX) < 1e-6
            ? a_standard
            : a_standard * Math.cos(alpha_t_rad) / Math.cos(alpha_wt);

        // Base Diameters (db = d * cos(alpha_t)) — DIN 3960
        const db1 = d1 * Math.cos(alpha_t_rad);
        const db2 = d2 * Math.cos(alpha_t_rad);

        // Operating / Working Pitch Diameters (dw = db / cos(alpha_wt)) & Radii (rw = dw / 2)
        // ISO 21771 / DIN 3960:
        // External: dw1 + dw2 = 2 * a_wt (rw1 + rw2 = a_wt)
        // Internal: dw2 - dw1 = 2 * a_wt (rw2 - rw1 = a_wt)
        const dw1 = db1 / Math.cos(alpha_wt);
        const dw2 = db2 / Math.cos(alpha_wt);
        const rw1 = dw1 / 2;
        const rw2 = dw2 / 2;

        // Tip Diameters (da) & Root Diameters (df)
        const c_star = 0.25;

        // DIN 3960 addendum alteration coefficient k (delta_y = sumX - y) to preserve bottom clearance
        const y_val = Math.abs(sumX) < 1e-6 ? 0 : (a_wt - a_standard) / gearModule;
        const delta_y = isInternal ? 0 : Math.max(0, sumX - y_val);

        // Kafa Kısaltma (+/- k) Factor:
        // 1. 'auto': DIN 3960 / KHK Table 4.3 & 4.9 (ha = (1 + y - x_other) * mn)
        // 2. 'workshop': Atölye / Yavuzlar Dişli: da = d + 2m(1 + x + k) (negative k reduces/shortens crest)
        // 3. 'custom': DIN 3960 Manuel: da = d + 2m(1 + x - k) (positive k reduces crest)
        let effectiveK1 = delta_y;
        let effectiveK2 = delta_y;
        let da1 = 0;
        let da2 = 0;

        // Theoretical KHK tip diameters (ISO 21771 / JIS B 1702 / DIN 3960)
        const ha1_khk = (1 + y_val - x2) * gearModule;
        const ha2_khk = isInternal ? (1 - y_val + x1) * gearModule : (1 + y_val - x1) * gearModule;
        const da1_khk = d1 + 2 * ha1_khk;
        const da2_khk = isInternal ? d2 - 2 * ha2_khk : d2 + 2 * ha2_khk;

        if (kFactorMode === 'workshop') {
            effectiveK1 = customK1;
            effectiveK2 = customK2;
            // Workshop / Yavuzlar formula: da = d + 2m(1 + x + k)
            // Entering negative k (e.g. -0.107) directly reduces da by 2*m*|k|
            da1 = d1 + 2 * gearModule * (1 + x1 + effectiveK1);
            da2 = isInternal
                ? d2 - 2 * gearModule * (1 - x2 - effectiveK2)
                : d2 + 2 * gearModule * (1 + x2 + effectiveK2);
        } else if (kFactorMode === 'custom') {
            effectiveK1 = customK1;
            effectiveK2 = customK2;
            // DIN Manuel formula: da = d + 2m(1 + x - k)
            da1 = d1 + 2 * gearModule * (1 + x1 - effectiveK1);
            da2 = isInternal
                ? d2 - 2 * gearModule * (1 - x2 + effectiveK2)
                : d2 + 2 * gearModule * (1 + x2 - effectiveK2);
        } else {
            // Auto (KHK Table 4.3 & 4.9 / DIN 3960 theoretical)
            effectiveK1 = delta_y;
            effectiveK2 = delta_y;
            da1 = da1_khk;
            da2 = da2_khk;
        }

        const k1_mm = (kFactorMode === 'workshop' ? effectiveK1 : -effectiveK1) * gearModule;
        const k2_mm = (kFactorMode === 'workshop' ? effectiveK2 : -effectiveK2) * gearModule;

        const df1 = d1 - 2 * gearModule * (1 + c_star - x1);
        const df2 = isInternal
            ? d2 + 2 * gearModule * (1 + c_star + x2)
            : d2 - 2 * gearModule * (1 + c_star - x2);

        // Tooth Dimensions (DIN 3960 / ISO 53)
        // Normal tooth thickness: sn = mn * (pi/2 + 2 * x * tan(alpha_n))
        const sn1 = gearModule * ((Math.PI / 2) + 2 * x1 * Math.tan(alphaRad));
        const sn2 = gearModule * ((Math.PI / 2) + 2 * x2 * Math.tan(alphaRad));
        const ha1 = (da1 - d1) / 2;
        const ha2 = isInternal ? (d2 - da2) / 2 : (da2 - d2) / 2;
        const hf1 = (d1 - df1) / 2;
        const hf2 = isInternal ? (df2 - d2) / 2 : (d2 - df2) / 2;
        const h1 = ha1 + hf1;
        const h2 = ha2 + hf2;

        // Tooth crest thickness sa (DIN 3960) — check for razor-sharp tooth top
        const calcSa = (d: number, da: number, x: number) => {
            const db = d * Math.cos(alpha_t_rad);
            if (da <= db) return 0.2 * gearModule;
            const cosAlphaAt = Math.max(-1, Math.min(1, db / da));
            const alphaAt = Math.acos(cosAlphaAt);
            const st = (Math.PI * gearModule) / (2 * Math.cos(betaRad)) + (2 * x * gearModule * Math.tan(alphaRad)) / Math.cos(betaRad);
            const sa_t = da * (st / d + inv(alpha_t_rad) - inv(alphaAt));
            return Math.max(0, sa_t * Math.cos(betaRad));
        };
        const sa1 = calcSa(d1, da1, x1);
        const sa2 = calcSa(d2, da2, x2);
        const isCrestSharp1 = sa1 < 0.25 * gearModule;
        const isCrestSharp2 = sa2 < 0.25 * gearModule;

        const D_ring = isInternal ? df2 + 4 * gearModule : 0;

        // --- INSPECTION ---
        // Span Wk
        const calculateWk = (z: number, x: number) => {
            const k = Math.round(z / 9 + 0.5); // Simplified k selection
            const W = gearModule * Math.cos(alphaRad) * (Math.PI * (k - 0.5) + z * inv(alphaRad) + 2 * x * Math.tan(alphaRad));
            return { k, W };
        };
        const Wk1 = calculateWk(z1, x1);
        const Wk2 = calculateWk(effZ2, x2);

        // Over Pins M
        const calculateM = (z: number, x: number, Dp: number) => {
            const inv_alpha_pin = (Dp / (gearModule * z * Math.cos(alphaRad))) + inv(alphaRad) + (2 * x * Math.tan(alphaRad) / z);
            let alpha_pin = 0.5;
            for (let j = 0; j < 8; j++) {
                alpha_pin = alpha_pin - (inv(alpha_pin) - inv_alpha_pin) / (Math.tan(alpha_pin) ** 2);
            }
            const d_center = (gearModule * z * Math.cos(alphaRad)) / Math.cos(alpha_pin);
            return z % 2 === 0
                ? d_center + Dp
                : (d_center * Math.cos((90 / z) * (Math.PI / 180))) + Dp;
        };
        const M1 = calculateM(z1, x1, pinDia1);
        const M2 = calculateM(effZ2, x2, pinDia2);

        // Forces
        const Ft = (2000 * motorTorque) / d1; // N (Nominal on Pinion)
        const Ft_Output = (2000 * outputTorque) / d2; // N (Nominal on Gear/Output)

        let fz = 1.0;
        if (connectionType === 'sprocket') fz = 1.25;
        if (connectionType === 'v_belt') fz = 1.5;
        if (connectionType === 'flat_belt') fz = 2.5;

        const Fr_shaft_load = Ft_Output * fz;

        // ISO 6336 Method B mesh rating (transverse mt, εα = gα / pbt, YF/YS/Yβ, ZH/ZE/Zε)
        const elastic = elasticConstantsForGearMaterial(material.name);
        const iso = calculateIso6336Mesh({
            mn: gearModule,
            z1,
            z2: effZ2,
            b: faceWidth,
            alphaNDeg: pressureAngle,
            betaDeg: helixAngle || 0,
            x1,
            x2,
            torqueNm: motorTorque,
            rpmPinion: motorSpeed,
            applicationFactor: requiredFs,
            qualityGrade: 6,
            internal: isInternal,
            E1GPa: elastic.E,
            E2GPa: elastic.E,
            nu1: elastic.nu,
            nu2: elastic.nu,
            sigmaHlim: material.sigma_Hlim,
            sigmaFlim1: material.sigma_Flim,
            sigmaFlim2: material.sigma_Flim,
        });

        const Ka_driven = requiredFs;
        const Ft_max = iso.Ft * Ka_driven;
        const Fr = iso.Fr * Ka_driven;
        const Fa = iso.Fa * Ka_driven;

        const estBendingStress = iso.sigmaF1;
        const estContactStress = iso.sigmaH;
        const SF_bending = iso.SF1;
        const SF_contact = iso.SH;

        const pitchVelocity = iso.pitchVelocity;
        const zMinUndercut = Math.ceil(2 / (Math.sin(alphaRad) ** 2));
        const undercut = z1 < zMinUndercut && x1 < (zMinUndercut - z1) / zMinUndercut;
        const epsilonAlpha = iso.epsilonAlpha;
        const epsilonBeta = iso.epsilonBeta;
        const epsilonGamma = iso.epsilonGamma;
        const Kv = iso.Kv;
        const u = iso.u;

        // Internal Gear Interference & Geometry Checks (DIN 3960 / ISO 21771)
        const deltaZ = z2 - z1;
        let internalWarning: {
            type: 'impossible' | 'interference' | 'radial_assembly' | null;
            title: string;
            description: string;
            deltaZ: number;
        } | null = null;

        if (isInternal) {
            if (z2 <= z1) {
                internalWarning = {
                    type: 'impossible',
                    title: z2 === z1 ? 'İç Dişlide 1:1 Oran İmkansızdır' : 'Geçersiz İç Dişli Geometrisi (z₂ ≤ z₁)',
                    description: `İç çember dişli (z₂=${z2}), pinyondan (z₁=${z1}) daha büyük olmalıdır. Pinyon iç çembere sığamaz. 1:1 oran iç dişlide uygulanamaz (Önerilen: z₂ ≥ ${z1 + 8}).`,
                    deltaZ
                };
            } else if (deltaZ < 8) {
                internalWarning = {
                    type: 'interference',
                    title: `Diş Tepe Girişimi Riski (DIN 3960: Δz = ${deltaZ} < 8)`,
                    description: `Diş sayısı farkı (Δz = ${deltaZ}) kritik eşik (8) altında. Pinyon diş tepeleri iç çember dişlerine çarpar (Trochoidal interference). Minimum z₂ - z₁ ≥ 8 önerilir.`,
                    deltaZ
                };
            } else if (deltaZ < 12) {
                internalWarning = {
                    type: 'radial_assembly',
                    title: `Radyal Montaj Sınırı (Δz = ${deltaZ} < 12)`,
                    description: `Düşük diş farkı nedeniyle radyal montajda hafif sürtünme oluşabilir; eksenel montaj veya profil kaydırma uygulanmalıdır.`,
                    deltaZ
                };
            }
        }

        return {
            motorSpeed,
            motorTorque,
            outputSpeed,
            outputTorque,
            ratio: u,
            d1,
            d2,
            db1,
            db2,
            dw1,
            dw2,
            rw1,
            rw2,
            mt,
            betaDeg: helixAngle,
            alpha_t_deg: alpha_t_rad * (180 / Math.PI),
            alpha_wt_deg: alpha_wt * (180 / Math.PI),
            da1,
            da2,
            df1,
            df2,
            sn1,
            sn2,
            ha1,
            ha2,
            hf1,
            hf2,
            h1,
            h2,
            D_ring,
            isInternal,
            deltaZ,
            internalWarning,
            a: a_wt,
            Ft: Ft_max, Fr, Fa,
            estBendingStress,
            estContactStress,
            SF_bending,
            SF_contact,
            SF_bending_gear: iso.SF2,
            pitchVelocity,
            zMinUndercut,
            undercut,
            epsilonAlpha,
            epsilonBeta,
            epsilonGamma,
            Kv,
            ZH: iso.ZH,
            ZE: iso.ZE,
            YF1: iso.YF1,
            YF2: iso.YF2,
            Ybeta: iso.Ybeta,
            KHbeta: iso.KHbeta,
            isoStatus: iso.status,
            isoCritical: iso.criticalFactor,
            Wk1, Wk2, M1, M2,
            requiredFs,
            Fr_shaft_load,
            loadClass,
            // Kafa Kısaltma (+/- k) — DIN 3960 / Yavuzlar Dişli
            k: effectiveK1,
            k1: effectiveK1,
            k2: effectiveK2,
            k_din: delta_y,
            k_mm: k1_mm,
            k1_mm,
            k2_mm,
            kFactorMode,
            customK: customK1,
            customK1,
            customK2,
            linkK,
            da1_khk,
            da2_khk,
            delta_da1_from_khk: da1 - da1_khk,
            delta_da2_from_khk: da2 - da2_khk,
            y_val,
            sa1,
            sa2,
            isCrestSharp1,
            isCrestSharp2
        };
    }, [motor.power, motorSpeed, motorTorque, z1, z2, gearModule, gearType, meshType, helixAngle, pressureAngle, faceWidth, material, loadClass, dailyHours, startsPerHour, connectionType, x1, x2, pinDia1, pinDia2, kFactorMode, customK1, customK2, linkK]);

    return {
        // Motor
        selectedPower, setSelectedPower,
        selectedPoles, setSelectedPoles,
        motor,

        // Application (YR)
        loadClass, setLoadClass,
        dailyHours, setDailyHours,
        startsPerHour, setStartsPerHour,
        connectionType, setConnectionType,

        // Gear
        gearType, setGearType,
        meshType, setMeshType,
        gearModule, setGearModule,
        z1, setZ1,
        z2, setZ2,
        helixAngle, setHelixAngle,
        pressureAngle, setPressureAngle,
        faceWidth, setFaceWidth,
        materialName, setMaterialName,

        // Manufacturing
        x1, setX1,
        x2, setX2,
        pinDia1, setPinDia1,
        pinDia2, setPinDia2,
        kFactorMode, setKFactorMode,
        customK, setCustomK,
        customK1, setCustomK1,
        customK2, setCustomK2,
        linkK, setLinkK,

        results
    };
};
