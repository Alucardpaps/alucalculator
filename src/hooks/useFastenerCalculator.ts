import { useState, useMemo } from 'react';
import { FASTENERS_DB } from '@/data/fastenersData';

export type FastenerStandard = 'ISO Metric' | 'ISO Metric Fine' | 'UNC' | 'UNF' | 'BSPP (G)' | 'BSPT (R)' | 'NPT' | 'Trapezoidal (Tr)' | 'Custom';

export const useFastenerCalculator = () => {
    const [standard, setStandard] = useState<FastenerStandard>('ISO Metric');

    // Get available sizes for the selected standard
    const availableSizes = useMemo(() => {
        // Use Set to ensure uniqueness just in case
        return Array.from(new Set(FASTENERS_DB.filter(f => f.standard === standard).map(f => f.size)));
    }, [standard]);

    const [size, setSize] = useState<string>('');

    const [customParams, setCustomParams] = useState({
        diameter: 10,
        pitch: 1.5,
        angle: 60,
        unit: 'mm' as 'mm' | 'inch'
    });

    // Ensure size validation/default when standard changes
    useMemo(() => {
        if (standard === 'Custom') return;
        const sizes = FASTENERS_DB.filter(f => f.standard === standard).map(f => f.size);
        if (!size || !sizes.includes(size)) {
            setSize(sizes[0] || '');
        }
    }, [standard, availableSizes, size]);

    const selectedFastener = useMemo(() => {
        if (standard === 'Custom') return null;
        return FASTENERS_DB.find(f => f.standard === standard && f.size === size) || FASTENERS_DB[0];
    }, [standard, size]);

    const [manualUnit, setManualUnit] = useState<'mm' | 'inch' | 'auto'>('auto');

    const results = useMemo(() => {
        // --- CUSTOM MODE LOGIC ---
        if (standard === 'Custom') {
            // ... (Same logic as before, just ensuring manualUnit respects customParams.unit effectively)
            // Actually custom mode has its own unit param. Let's strictly follow customParams.unit for custom mode.
            const { diameter: d, pitch: p, angle, unit } = customParams;

            const tapDrill = d - p;
            const clearance = d * 1.05;
            const stressArea = angle === 60 ? 0.7854 * Math.pow(d - 0.9382 * p, 2) : 0;

            return {
                standard: 'Custom',
                size: `Custom ${d}${unit === 'mm' ? 'mm' : '"'}`,
                majorDia: d,
                minorDia: d - (1.0825 * p),
                pitchDia: d - (0.6495 * p),
                pitch: p,
                tapDrill: tapDrill > 0 ? tapDrill.toFixed(2) : '0.00',
                clearance: clearance.toFixed(2),
                stressArea: stressArea > 0 ? stressArea.toFixed(2) : 'N/A',
                unit,
                displayPitch: `${p} ${unit}`,
                angle,
                isTapered: false
            };
        }

        // --- STANDARD MODE LOGIC ---
        const s = selectedFastener!;

        // Auto-detect native unit
        const nativeIsImperial = standard === 'UNC' || standard === 'UNF' || standard === 'NPT';

        // Final Display Unit Decision
        const useImperial = manualUnit === 'auto' ? nativeIsImperial : manualUnit === 'inch';

        // Determine Angle
        let angle = 60;
        if (standard === 'BSPP (G)' || standard === 'BSPT (R)') angle = 55;
        if (standard === 'Trapezoidal (Tr)') angle = 30;

        // Determine Taper
        const isTapered = standard === 'NPT' || standard === 'BSPT (R)';

        return {
            ...s,
            unit: useImperial ? 'inch' : 'mm',
            majorDia: (useImperial ? s.majorDia / 25.4 : s.majorDia),
            minorDia: (useImperial ? s.minorDia / 25.4 : s.minorDia),
            pitchDia: (useImperial ? s.pitchDia / 25.4 : s.pitchDia),
            tapDrill: (useImperial ? s.tapDrill / 25.4 : s.tapDrill).toFixed(3),
            clearance: isTapered ? 'N/A' : (useImperial ? (s.majorDia * 1.05) / 25.4 : (s.majorDia * 1.05)).toFixed(3),
            stressArea: (useImperial ? s.stressArea / 645.16 : s.stressArea).toFixed(4),
            displayPitch: nativeIsImperial || standard.includes('BSPP') || standard.includes('BSPT')
                ? `${s.pitch} TPI`
                : `${s.pitch} mm`,
            angle,
            isTapered
        };
    }, [selectedFastener, standard, customParams, manualUnit]);

    return {
        standard, setStandard,
        size, setSize,
        availableSizes,
        customParams, setCustomParams,
        results,
        manualUnit, setManualUnit
    };
};
