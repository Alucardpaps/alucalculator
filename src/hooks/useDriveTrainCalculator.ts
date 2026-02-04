import { useState, useMemo } from 'react';
import { IEC_MOTORS, Motor } from '@/data/motorData';
import { GEAR_MATERIALS, GearMaterial, APPLICATION_FACTORS, ApplicationFactor, GEAR_MODULES_ISO } from '@/data/gearsData';

export type GearType = 'spur' | 'helical';

export const useDriveTrainCalculator = () => {
    // --- 1. MOTOR STATE ---
    const [selectedPower, setSelectedPower] = useState<number>(4.0); // kW
    const [selectedPoles, setSelectedPoles] = useState<2 | 4 | 6>(4); // 4 poles = 1500 rpm approx

    // Find motor from DB
    const motor = useMemo(() => {
        return IEC_MOTORS.find(m => m.power === selectedPower) || IEC_MOTORS[10]; // Default 4kW
    }, [selectedPower]);

    const motorSpeed = selectedPoles === 2 ? motor.speed_2p : selectedPoles === 4 ? motor.speed_4p : motor.speed_6p;

    // Motor Torque T = 9550 * P / n
    const motorTorque = (9550 * motor.power) / motorSpeed; // Nm

    // --- 2. APPLICATION STATE ---
    const [applicationName, setApplicationName] = useState<string>(APPLICATION_FACTORS[0].name);
    const application = useMemo(() => APPLICATION_FACTORS.find(a => a.name === applicationName)!, [applicationName]);

    // --- 3. GEAR STATE ---
    const [gearType, setGearType] = useState<GearType>('spur');
    const [module, setModule] = useState<number>(3);
    const [z1, setZ1] = useState<number>(20); // Pinion
    const [z2, setZ2] = useState<number>(60); // Gear
    const [helixAngle, setHelixAngle] = useState<number>(0); // Beta (deg)
    const [pressureAngle, setPressureAngle] = useState<number>(20); // Alpha (deg)
    const [faceWidth, setFaceWidth] = useState<number>(40); // b (mm)
    const [materialName, setMaterialName] = useState<string>(GEAR_MATERIALS[0].name);

    // Advanced: Profile Shift & Inspection
    const [x1, setX1] = useState<number>(0);
    const [x2, setX2] = useState<number>(0);
    const [pinDia1, setPinDia1] = useState<number>(Number((1.7 * 3).toFixed(2)));
    const [pinDia2, setPinDia2] = useState<number>(Number((1.7 * 3).toFixed(2)));

    // Update default pin when module changes
    useMemo(() => {
        const def = Number((1.7 * module).toFixed(2));
        setPinDia1(def);
        setPinDia2(def);
    }, [module]);

    const material = useMemo(() => GEAR_MATERIALS.find(m => m.name === materialName)!, [materialName]);

    // --- 4. CALCULATIONS ---
    const results = useMemo(() => {
        const i = z2 / z1; // Ratio
        const outputSpeed = motorSpeed / i;
        const efficiency = 0.98; // Approx for single stage
        const outputTorque = motorTorque * i * efficiency; // Nm

        // Geometry
        // Helical factor
        const betaRad = (gearType === 'helical' ? helixAngle : 0) * (Math.PI / 180);
        const alphaRad = pressureAngle * (Math.PI / 180);

        // Apparent Module mt = mn / cos(beta)
        const mt = module / Math.cos(betaRad);
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

        let alpha_wt = 0.35; // Initial guess
        for (let k = 0; k < 5; k++) {
            alpha_wt = alpha_wt - (inv(alpha_wt) - inv_alpha_wt) / (Math.tan(alpha_wt) ** 2);
        }

        // Operating Center Distance
        const a_wt = Math.abs(x1 + x2) < 0.001
            ? a_standard
            : a_standard * Math.cos(alpha_t_rad) / Math.cos(alpha_wt);

        // --- INSPECTION ---
        // Span Wk
        const calculateWk = (z: number, x: number) => {
            const k = Math.round(z / 9 + 0.5); // Simplified k selection
            // W = m * cos(alpha) * [ pi*(k-0.5) + z*inv(alpha) + 2*x*tan(alpha) ]
            const W = module * Math.cos(alphaRad) * (Math.PI * (k - 0.5) + z * inv(alphaRad) + 2 * x * Math.tan(alphaRad));
            return { k, W };
        };
        const Wk1 = calculateWk(z1, x1);
        const Wk2 = calculateWk(z2, x2);

        // Over Pins M
        const calculateM = (z: number, x: number, Dp: number) => {
            const inv_alpha_pin = (Dp / (module * z * Math.cos(alphaRad))) + inv(alphaRad) + (2 * x * Math.tan(alphaRad) / z);
            let alpha_pin = 0.5;
            for (let j = 0; j < 8; j++) {
                alpha_pin = alpha_pin - (inv(alpha_pin) - inv_alpha_pin) / (Math.tan(alpha_pin) ** 2);
            }
            const d_center = (module * z * Math.cos(alphaRad)) / Math.cos(alpha_pin);
            return z % 2 === 0
                ? d_center + Dp
                : (d_center * Math.cos((90 / z) * (Math.PI / 180))) + Dp;
        };
        const M1 = calculateM(z1, x1, pinDia1);
        const M2 = calculateM(z2, x2, pinDia2);

        // Forces
        const Ft = (2000 * motorTorque) / d1; // N (Nominal)
        const Ft_max = Ft * application.Ka;   // N (Max Design Load)

        // Radial Force Fr = Ft * tan(alpha_t)
        const Fr = Ft_max * Math.tan(alpha_t_rad);

        // Axial Force Fa = Ft * tan(beta)
        const Fa = Ft_max * Math.tan(betaRad);

        // Simplified Stress Check
        const estBendingStress = (Ft_max / (faceWidth * module)) * 2.5;

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
            d1: d1 + (2 * x1 * module),
            d2: d2 + (2 * x2 * module),
            da1: d1 + 2 * module * (1 + x1), // Approx Tip Dia
            da2: d2 + 2 * module * (1 + x2),
            a: a_wt,
            Ft: Ft_max, Fr, Fa,
            estBendingStress,
            estContactStress,
            SF_bending,
            SF_contact,
            Wk1, Wk2, M1, M2 // New Inspection Data
        };
    }, [motor.power, motorSpeed, motorTorque, z1, z2, module, gearType, helixAngle, pressureAngle, faceWidth, material, application, x1, x2, pinDia1, pinDia2]);

    return {
        // Motor
        selectedPower, setSelectedPower,
        selectedPoles, setSelectedPoles,
        motor,

        // Application
        applicationName, setApplicationName,

        // Gear
        gearType, setGearType,
        module, setModule,
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
