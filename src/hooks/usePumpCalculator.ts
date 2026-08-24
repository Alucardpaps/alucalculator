import { useState, useMemo } from 'react';

export const usePumpCalculator = () => {
    // Inputs (Metric Basics)
    const [flowRate, setFlowRate] = useState(100); // m3/h
    const [head, setHead] = useState(50); // m
    const [rpm, setRpm] = useState(1450); // rpm
    const [efficiency, setEfficiency] = useState(75); // %
    const [density, setDensity] = useState(1000); // kg/m3

    const results = useMemo(() => {
        // 1. Hydraulic Power
        const g = 9.81;
        const qSec = flowRate / 3600; // m3/s

        const pHydraulicW = density * g * qSec * head; // Watts
        const pHydraulicKW = pHydraulicW / 1000;

        // 2. Shaft Power
        const effDecimal = efficiency / 100;
        const pShaftKW = pHydraulicKW / (effDecimal || 1);

        // 3. Specific Speed (ns)
        // Formula: ns = (n * sqrt(Q)) / H^0.75
        // Note: Units vary by standard. Using metric (rpm, m3/s, m)
        const ns = (rpm * Math.sqrt(qSec)) / Math.pow(head, 0.75);

        let type: 'radial' | 'mixed' | 'axial' = 'radial';
        if (ns > 40 && ns <= 150) type = 'mixed';
        if (ns > 150) type = 'axial';

        // Simple Reynolds Check (Assuming DN100 pipe for estimation)
        // v = Q / A
        const d_est = 0.1; // 100mm pipe
        const area = Math.PI * Math.pow(d_est, 2) / 4;
        const v = qSec / area;
        // Re = (rho * v * D) / mu (mu water = 0.001 Pa.s)
        const re = (density * v * d_est) / 0.001;

        return {
            pHydraulicKW,
            pShaftKW,
            ns,
            type,
            v,
            re
        };
    }, [flowRate, head, rpm, efficiency, density]);

    return {
        flowRate, setFlowRate,
        head, setHead,
        rpm, setRpm,
        efficiency, setEfficiency,
        density, setDensity,
        results
    };
};
