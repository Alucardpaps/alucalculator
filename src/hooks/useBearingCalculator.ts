import { useState, useMemo } from 'react';
import { bearingCatalog, Bearing } from '@/data/bearings';

export const useBearingCalculator = () => {
    // 1. Selection State
    const [seriesKey, setSeriesKey] = useState<keyof typeof bearingCatalog>('6200');
    const [bearingIndex, setBearingIndex] = useState(4); // Default to something middle-ish like 6204

    // 2. Load Inputs
    const [fr, setFr] = useState(5000); // Radial Load (N)
    const [fa, setFa] = useState(1000); // Axial Load (N)
    const [rpm, setRpm] = useState(3000);
    const [reliability, setReliability] = useState(90);

    const currentSeries = bearingCatalog[seriesKey];
    const bearing = currentSeries.data[bearingIndex] || currentSeries.data[0];

    // 3. Calculation Engine
    const results = useMemo(() => {
        // Deep Groove Ball Bearing Factors
        const f0 = 14;
        const ratio = (f0 * fa) / bearing.C0;

        let e = 0.22;
        let Y = 2.0;

        // Interpolation table for 'e' and 'Y' based on Fa/C0
        if (ratio <= 0.025) { e = 0.22; Y = 2.0; }
        else if (ratio <= 0.04) { e = 0.24; Y = 1.8; }
        else if (ratio <= 0.07) { e = 0.27; Y = 1.6; }
        else if (ratio <= 0.13) { e = 0.31; Y = 1.4; }
        else if (ratio <= 0.25) { e = 0.37; Y = 1.2; }
        else if (ratio <= 0.50) { e = 0.44; Y = 1.0; }
        else { e = 0.50; Y = 0.9; }

        const X = 0.56;
        let P = fr; // Equivalent Load

        // If Axial load is significant
        if (fa / fr > e) {
            P = X * fr + Y * fa;
        }

        // Life Calculation (Ball Bearing p = 3)
        const p = 3;
        const L10 = Math.pow(bearing.C / P, p); // Million Revs
        const L10h = (L10 * 1e6) / (rpm * 60); // Hours

        // Adjustment for Reliability
        let a1 = 1.0;
        if (reliability === 95) a1 = 0.62;
        if (reliability === 96) a1 = 0.53;
        if (reliability === 97) a1 = 0.44;
        if (reliability === 98) a1 = 0.33;
        if (reliability === 99) a1 = 0.21;

        const Lna = a1 * L10h;

        const staticSafety = bearing.C0 / Math.max(fr, P);

        return { P, L10, L10h, Lna, staticSafety, e, Y };
    }, [bearing, fr, fa, rpm, reliability]);

    return {
        seriesKey, setSeriesKey,
        bearingIndex, setBearingIndex,
        bearing,
        fr, setFr,
        fa, setFa,
        rpm, setRpm,
        reliability, setReliability,
        results
    };
};
