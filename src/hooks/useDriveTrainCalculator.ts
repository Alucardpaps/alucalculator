import { useState, useMemo } from 'react';
import { IEC_MOTORS, Motor } from '@/data/motorData';
import { GEAR_MATERIALS, GearMaterial, APPLICATION_FACTORS, ApplicationFactor, GEAR_MODULES_ISO } from '@/data/gearsData';
import {
    SERVICE_FACTOR_MATRIX,
    CONNECTION_FACTOR,
    getStartFrequencyFactor,
    LoadClass
} from '@/data/yilmazReduktorData';

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
    const [gearModule, setGearModule] = useState<number>(3);
    const [z1, setZ1] = useState<number>(20);
    const [z2, setZ2] = useState<number>(60);
    const [helixAngle, setHelixAngle] = useState<number>(0);
    const [pressureAngle, setPressureAngle] = useState<number>(20);
    const [faceWidth, setFaceWidth] = useState<number>(40);
    const [materialName, setMaterialName] = useState<string>(GEAR_MATERIALS[0].name);

    // Advanced: Profile Shift & Inspection
    const [x1, setX1] = useState<number>(0);
    const [x2, setX2] = useState<number>(0);
    const [pinDia1, setPinDia1] = useState<number>(Number((1.7 * 3).toFixed(2)));
    const [pinDia2, setPinDia2] = useState<number>(Number((1.7 * 3).toFixed(2)));

    // Update default pin when module changes
    useMemo(() => {
        const def = Number((1.7 * gearModule).toFixed(2));
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
        const betaRad = (gearType === 'helical' ? helixAngle : 0) * (Math.PI / 180);
        const alphaRad = pressureAngle * (Math.PI / 180);
        const mt = gearModule / Math.cos(betaRad);
        const alpha_t_rad = Math.atan(Math.tan(alphaRad) / Math.cos(betaRad));

        // Pitch Diameters
        const d1 = z1 * mt;
        const d2 = z2 * mt;
        const a_standard = (d1 + d2) / 2; // Standard Center Distance

        // --- PROFILE SHIFT LOGIC ---
        // Involute Function: inv(x) = tan(x) - x
        const inv = (angle: number) => Math.tan(angle) - angle;

        // Operating Pressure Angle (alpha_wt)
        const sumX = x1 + x2;
        const sumZ = z1 + z2;
        const inv_alpha_wt = (2 * Math.tan(alphaRad) * sumX / sumZ) + inv(alpha_t_rad);

        // Iterate for alpha_wt
        let alpha_wt = 0.35;
        for (let k = 0; k < 5; k++) {
            alpha_wt = alpha_wt - (inv(alpha_wt) - inv_alpha_wt) / (Math.tan(alpha_wt) ** 2);
        }

        // Operating Center Distance
        const delta_y = ((sumZ / 2) * (Math.cos(alpha_t_rad) / Math.cos(alpha_wt) - 1)) - sumX; // Center distance modification coefficient difference?
        // Actually a_wt formula:
        const a_wt = Math.abs(sumX) < 1e-6
            ? a_standard
            : a_standard * Math.cos(alpha_t_rad) / Math.cos(alpha_wt);

        // Tip Diameters (da) & Root Diameters (df)
        // da = d + 2m(1 + x - ky*m) -- ignoring topping for now unless needed. Standard: da = d + 2m(1+x)
        // df = d - 2m(1 + c - x) -> c=0.25 usually
        const c_star = 0.25;

        const da1 = d1 + 2 * gearModule * (1 + x1);
        const da2 = d2 + 2 * gearModule * (1 + x2);

        const df1 = d1 - 2 * gearModule * (1 + c_star - x1);
        const df2 = d2 - 2 * gearModule * (1 + c_star - x2);

        // --- INSPECTION ---
        // Span Wk
        const calculateWk = (z: number, x: number) => {
            const k = Math.round(z / 9 + 0.5); // Simplified k selection
            // W = m * cos(alpha) * [ pi*(k-0.5) + z*inv(alpha) + 2*x*tan(alpha) ]
            const W = gearModule * Math.cos(alphaRad) * (Math.PI * (k - 0.5) + z * inv(alphaRad) + 2 * x * Math.tan(alphaRad));
            return { k, W };
        };
        const Wk1 = calculateWk(z1, x1);
        const Wk2 = calculateWk(z2, x2);

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
        const M2 = calculateM(z2, x2, pinDia2);

        // Forces
        const Ft = (2000 * motorTorque) / d1; // N (Nominal on Pinion)
        const Ft_Output = (2000 * outputTorque) / d2; // N (Nominal on Gear/Output)

        // YR Radial Load (Overhung Load) on Output Shaft
        // Formula: Fr = (2000 * M2 * fz) / d0
        // d0 = Pitch circle diameter of connection element
        // Since we don't know d0 of the sprocket/pulley, we can estimate critical load at the shaft end or use d2 if it was the output element itself.
        // Usually: Fr_permissible check.
        // Here we calculate "Equivalent Radial Load" created by torque + connection factor.
        // Assuming the 'd' in formula refers to the pitch diameter of the sprocket/pulley mounted on the shaft.
        // For estimation, we will assume a 1:1 drive off the output shaft (so d_sprocket ≈ d2 roughly for scale, or just report "Load Factor").
        // Let's report the 'fz' corrected tangential load as the radial load impacting the bearing.

        let fz = 1.0;
        if (connectionType === 'sprocket') fz = 1.25;
        if (connectionType === 'v_belt') fz = 1.5;
        if (connectionType === 'flat_belt') fz = 2.5;

        // Estimated Radial Load acting on Output Shaft Bearing (Newton)
        // If we assume the sprocket diameter is roughly equal to gear diameter (often smaller -> higher force). 
        // Let's calculate purely: Fr_calc = Ft_Output * fz
        const Fr_shaft_load = Ft_Output * fz;

        // ISO Forces for Gear Mesh (Internal)
        const Ka_driven = requiredFs; // Use YR Service Factor as Application Factor
        const Ft_max = Ft * Ka_driven;   // Max Design Load

        const Fr = Ft_max * Math.tan(alpha_t_rad);
        const Fa = Ft_max * Math.tan(betaRad);

        // Simplified Stress Check
        const estBendingStress = (Ft_max / (faceWidth * gearModule)) * 2.5;
        const u = i;
        const estContactStress = 190 * Math.sqrt((Ft_max / (faceWidth * d1)) * ((u + 1) / u));

        // Safety Factors
        const SF_bending = material.sigma_Flim / estBendingStress;
        const SF_contact = material.sigma_Hlim / estContactStress;

        return {
            motorSpeed,
            motorTorque,
            outputSpeed,
            outputTorque,
            ratio: i,
            d1: d1 + (2 * x1 * gearModule),
            d2: d2 + (2 * x2 * gearModule),
            da1,
            da2,
            df1,
            df2,
            a: a_wt,
            Ft: Ft_max, Fr, Fa,
            estBendingStress,
            estContactStress,
            SF_bending,
            SF_contact,
            Wk1, Wk2, M1, M2,
            // YR Data
            requiredFs,
            Fr_shaft_load,
            loadClass
        };
    }, [motor.power, motorSpeed, motorTorque, z1, z2, gearModule, gearType, helixAngle, pressureAngle, faceWidth, material, loadClass, dailyHours, startsPerHour, connectionType, x1, x2, pinDia1, pinDia2]);

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

        results
    };
};
