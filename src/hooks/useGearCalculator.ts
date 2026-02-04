import { useState, useMemo } from 'react';

// Math helpers
const toRad = (deg: number) => (deg * Math.PI) / 180;

export type GearType = 'spur' | 'helical' | 'bevel' | 'worm';

export const useGearCalculator = () => {
    // Inputs
    const [gearType, setGearType] = useState<GearType>('spur');
    const [module, setModule] = useState(3);
    const [z1, setZ1] = useState(20); // Pinion
    const [z2, setZ2] = useState(40); // Gear
    const [pressureAngle, setPressureAngle] = useState(20);
    const [helixAngle, setHelixAngle] = useState(15); // Only for helical
    const [faceWidth, setFaceWidth] = useState(30);
    const [power, setPower] = useState(5); // kW
    const [rpm, setRpm] = useState(1450);

    const results = useMemo(() => {
        // Basic Torque Calc (Nm)
        const torque = (9550 * power) / (rpm || 1);

        const radAlpha = toRad(pressureAngle);
        const radBeta = toRad(helixAngle);

        // Module handling
        // Plain module 'm' is Normal Module 'mn'
        const mn = module;
        const mt = gearType === 'helical' ? mn / Math.cos(radBeta) : mn;

        // Diameters
        const d1 = mt * z1;
        const d2 = mt * z2;
        const centerDist = (d1 + d2) / 2;

        // Forces (Simplified)
        // Tangential Force Ft (N) = 2000 * T / d
        const Ft = (2000 * torque) / (d1 || 1);

        // Radial Force Fr = Ft * tan(alpha) / cos(beta for helical) ? 
        // Standard: Fr = Ft * tan(alpha_t)
        // tan(alpha_t) = tan(alpha_n) / cos(beta)

        const tanAlphaT = Math.tan(radAlpha) / (gearType === 'helical' ? Math.cos(radBeta) : 1);
        const Fr = Ft * tanAlphaT;

        const Fa = gearType === 'helical' ? Ft * Math.tan(radBeta) : 0;

        // Ratio
        const ratio = z2 / (z1 || 1);

        return {
            torque,
            d1, d2, centerDist,
            mn, mt,
            Ft, Fr, Fa,
            ratio
        };

    }, [gearType, module, z1, z2, pressureAngle, helixAngle, power, rpm]);

    return {
        gearType, setGearType,
        module, setModule,
        z1, setZ1,
        z2, setZ2,
        pressureAngle, setPressureAngle,
        helixAngle, setHelixAngle,
        faceWidth, setFaceWidth,
        power, setPower,
        rpm, setRpm,
        results
    };
};
