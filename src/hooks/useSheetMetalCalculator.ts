import { useState, useMemo } from 'react';

const materials = [
    { name: 'Steel (S235)', yield: 235, k: 0.33 },
    { name: 'Steel (S355)', yield: 355, k: 0.33 },
    { name: 'Stainless (304)', yield: 215, k: 0.33 },
    { name: 'Alu (5754)', yield: 130, k: 0.33 },
    { name: 'Alu (6082)', yield: 250, k: 0.33 },
];

export const useSheetMetalCalculator = () => {
    // Inputs
    const [materialIdx, setMaterialIdx] = useState(0);
    const [thickness, setThickness] = useState(2); // mm
    const [angle, setAngle] = useState(90); // deg
    const [radius, setRadius] = useState(2); // mm (ri)
    const [length, setLength] = useState(100); // mm (Bend Length)
    const [vOpening, setVOpening] = useState(16); // mm (V)

    const [flangeA, setFlangeA] = useState(50);
    const [flangeB, setFlangeB] = useState(50);
    const [manualK, setManualK] = useState<number | null>(null);

    const results = useMemo(() => {
        const mat = materials[materialIdx];

        // 1. K-Factor Logic
        let K = manualK !== null ? manualK : 0.33;
        // Basic Rule of Thumb auto-adjust if not manual
        if (manualK === null) {
            if (radius >= 2 * thickness) K = 0.5;
            else if (radius >= thickness) K = 0.4;
            else K = 0.33;
        }

        // 2. Flat Pattern
        const angleRad = (angle * Math.PI) / 180;
        const rn = radius + K * thickness;
        const BA = (angle * Math.PI / 180) * rn; // Arc Length of neutral axis

        // Setback (Outer Setback - OSSB)
        // Formula depends on how angle is defined. Assuming angle is the "Bend Angle" (deviation from flat)?
        // No, industry usually uses "Included Angle" (e.g. 90deg part).
        // If angle is 90 (Part), Bend Angle is 90.
        // OSSB = (R + T) * tan((180 - Angle) / 2)
        const bendAngle = 180 - angle;
        const bendAngleRad = (bendAngle * Math.PI) / 180;
        const OSSB = (radius + thickness) * Math.tan(bendAngleRad / 2);

        const BD = 2 * OSSB - BA;
        const flatLength = flangeA + flangeB - BD;

        // 3. Tonnage (Air Bending)
        // F = (C * sigma * L * t^2) / V
        const C = 1.33; // Air bending constant
        const forceN = (C * mat.yield * length * Math.pow(thickness, 2)) / vOpening;
        const forceTon = forceN / 9806.65; // Convert N to Tonnes

        // 4. Recommendations
        const recV = 8 * thickness;
        const minV = 6 * thickness;

        return {
            K,
            BA,
            BD,
            OSSB,
            flatLength,
            forceTon,
            recV,
            minV
        };
    }, [materialIdx, thickness, angle, radius, length, vOpening, flangeA, flangeB, manualK]);

    return {
        materialIdx, setMaterialIdx,
        thickness, setThickness,
        angle, setAngle,
        radius, setRadius,
        length, setLength,
        vOpening, setVOpening,
        flangeA, setFlangeA,
        flangeB, setFlangeB,
        manualK, setManualK,
        results,
        materials
    };
};
