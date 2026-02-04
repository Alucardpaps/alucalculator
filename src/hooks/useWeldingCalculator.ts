import { useState, useMemo } from 'react';

const weldingMethods = {
    mig: { name: 'MIG/MAG', efficiency: 0.85 },
    tig: { name: 'TIG', efficiency: 0.65 },
    smaw: { name: 'Stick (SMAW)', efficiency: 0.75 },
    fcaw: { name: 'Flux Core (FCAW)', efficiency: 0.88 },
};

const getMinWeldSize = (thickness: number) => {
    if (thickness <= 6) return 3;
    if (thickness <= 13) return 5;
    if (thickness <= 19) return 6;
    if (thickness <= 38) return 8;
    return 10;
};

export const useWeldingCalculator = () => {
    const [method, setMethod] = useState<keyof typeof weldingMethods>('mig');
    const [type, setType] = useState<'fillet' | 'butt' | 'doubleFillet'>('fillet');

    // Process Parameters
    const [current, setCurrent] = useState(150); // Amps
    const [voltage, setVoltage] = useState(24);  // Volts
    const [speed, setSpeed] = useState(300);     // mm/min (Note: UI stores mm/min usually, formula needs mm/s?? Let's stick to mm/s or consistent units. Legacy used mm/s, let's use mm/min as it's more common in industry, then convert)
    // Actually legacy code calculated Q = (I*U*eta)/v where v was mm/s. Let's use mm/s for consistency with legacy for now, or clearer inputs.
    // Let's use mm/min for input as it's standard, and convert internally.
    const [speedMmPerMin, setSpeedMmPerMin] = useState(300);

    // Geometry
    const [legSize, setLegSize] = useState(5); // a (mm)
    const [thickness, setThickness] = useState(10); // t (mm)
    const [length, setLength] = useState(100); // L (mm)
    const [load, setLoad] = useState(10000); // F (N)

    const results = useMemo(() => {
        const eff = weldingMethods[method].efficiency;
        const speedMmPerSec = speedMmPerMin / 60;

        // Heat Input (kJ/mm) = (A * V * eff) / (v * 1000)
        // J/mm = (W * eff) / (mm/s)
        const heatInputJmm = (current * voltage * eff) / (speedMmPerSec || 1);
        const heatInput = heatInputJmm / 1000; // kJ/mm

        let area = 0;
        let stress = 0;

        if (type === 'fillet') {
            // Throat = a * 0.707
            const throat = legSize * 0.707;
            area = throat * length;
        } else if (type === 'butt') {
            area = thickness * length;
        } else if (type === 'doubleFillet') {
            const throat = legSize * 0.707;
            area = 2 * throat * length;
        }

        if (area > 0) {
            stress = load / area; // MPa
        }

        const minWeldSize = getMinWeldSize(thickness);
        const weldSizeOk = legSize >= minWeldSize;

        let heatStatus = 'optimal';
        if (heatInput < 0.8) heatStatus = 'cold';
        if (heatInput > 2.5) heatStatus = 'hot';

        return {
            heatInput,
            stress,
            area,
            minWeldSize,
            weldSizeOk,
            heatStatus,
            efficiency: eff
        };
    }, [method, type, current, voltage, speedMmPerMin, legSize, thickness, length, load]);

    return {
        method, setMethod,
        type, setType,
        current, setCurrent,
        voltage, setVoltage,
        speedMmPerMin, setSpeedMmPerMin,
        legSize, setLegSize,
        thickness, setThickness,
        length, setLength,
        load, setLoad,
        results,
        weldingMethods
    };
};
