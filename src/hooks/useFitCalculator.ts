import { useState, useMemo } from 'react';

// ISO Tolerances Data (Simplified for Hook)
// In a real app, this should be imported from a shared data source
const tolerancesData = [
    { range: '0-3', h6: [6, 0], h7: [10, 0], H7: [10, 0], g6: [-2, -8], f7: [-6, -16], k6: [6, 0], m6: [8, 2], n6: [10, 4], p6: [12, 6], r6: [16, 10], s6: [20, 14] },
    { range: '3-6', h6: [8, 0], h7: [12, 0], H7: [12, 0], g6: [-4, -12], f7: [-10, -22], k6: [9, 1], m6: [12, 4], n6: [16, 8], p6: [20, 12], r6: [23, 15], s6: [27, 19] },
    { range: '6-10', h6: [9, 0], h7: [15, 0], H7: [15, 0], g6: [-5, -14], f7: [-13, -28], k6: [10, 1], m6: [15, 6], n6: [19, 10], p6: [24, 15], r6: [28, 19], s6: [32, 23] },
    { range: '10-18', h6: [11, 0], h7: [18, 0], H7: [18, 0], g6: [-6, -17], f7: [-16, -34], k6: [12, 1], m6: [18, 7], n6: [23, 12], p6: [29, 18], r6: [34, 23], s6: [39, 28] },
    { range: '18-30', h6: [13, 0], h7: [21, 0], H7: [21, 0], g6: [-7, -20], f7: [-20, -41], k6: [15, 2], m6: [21, 8], n6: [28, 15], p6: [35, 22], r6: [41, 28], s6: [48, 35] },
    { range: '30-50', h6: [16, 0], h7: [25, 0], H7: [25, 0], g6: [-9, -25], f7: [-25, -50], k6: [18, 2], m6: [25, 9], n6: [33, 17], p6: [42, 26], r6: [50, 34], s6: [59, 43] },
    { range: '50-80', h6: [19, 0], h7: [30, 0], H7: [30, 0], g6: [-10, -29], f7: [-30, -60], k6: [21, 2], m6: [30, 11], n6: [39, 20], p6: [51, 32], r6: [62, 43], s6: [72, 53] },
];

export const fitTypes = [
    { code: 'H7/h6', type: 'clearance' },
    { code: 'H7/g6', type: 'clearance' },
    { code: 'H7/f7', type: 'clearance' },
    { code: 'H7/k6', type: 'transition' },
    { code: 'H7/m6', type: 'transition' },
    { code: 'H7/n6', type: 'transition' },
    { code: 'H7/p6', type: 'interference' },
    { code: 'H7/r6', type: 'interference' },
    { code: 'H7/s6', type: 'interference' }
];

export const useFitCalculator = () => {
    const [diameter, setDiameter] = useState(50);
    const [length, setLength] = useState(40); // Fit length
    const [selectedFitCode, setSelectedFitCode] = useState('H7/p6');
    const [eModulus, setEModulus] = useState(210); // GPa
    const [friction, setFriction] = useState(0.15);

    const results = useMemo(() => {
        // 1. Get Tolerance Values
        const [holeCode, shaftCode] = selectedFitCode.split('/');

        const range = tolerancesData.find(t => {
            const [min, max] = t.range.split('-').map(Number);
            return diameter > min && diameter <= max;
        }) || tolerancesData[5]; // Fallback to 30-50 range

        // Safe indexing with type casting assumption for this demo
        const holeTol = (range as any)[holeCode] || [0, 0];
        const shaftTol = (range as any)[shaftCode] || [0, 0];

        const holeUpper = holeTol[0];
        const holeLower = holeTol[1];
        const shaftUpper = shaftTol[0];
        const shaftLower = shaftTol[1];

        // 2. Calculate Fits (microns)
        const maxInterference = shaftUpper - holeLower;
        const minInterference = shaftLower - holeUpper;
        const maxClearance = holeUpper - shaftLower;
        const minClearance = holeLower - shaftUpper;

        const isInterference = maxInterference > 0;

        // 3. Press Fit Calculations
        let pressure = 0; // MPa
        let force = 0; // kN
        let torque = 0; // Nm

        if (isInterference) {
            const deltaAvg = (maxInterference + Math.max(0, minInterference)) / 2; // microns

            // Simplification for solid shaft
            // p = (E * delta) / D * 0.5 (approx)
            pressure = (eModulus * 1000) * (deltaAvg / 1000 / diameter) / 2;

            // Force F = p * Area * mu
            // Area = PI * D * L
            force = (Math.PI * diameter * length * pressure * friction) / 1000; // kN

            // Torque T = F * r
            torque = (force * 1000) * (diameter / 2) / 1000; // Nm
        }

        return {
            holeUpper, holeLower,
            shaftUpper, shaftLower,
            maxInterference, minInterference,
            maxClearance, minClearance,
            isInterference,
            pressure, force, torque
        };

    }, [diameter, length, selectedFitCode, eModulus, friction]);

    return {
        diameter, setDiameter,
        length, setLength,
        selectedFitCode, setSelectedFitCode,
        eModulus, setEModulus,
        friction, setFriction,
        results
    };
};
