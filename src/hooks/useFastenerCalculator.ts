import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FASTENERS_DB } from '@/data/fastenersData';
import {
    getThreadGeometryFromPage,
    parseFastenerSearchParams,
    type GeometryPageStandard,
} from '@/lib/fastener/sharedEngine';

export type FastenerStandard = GeometryPageStandard;

export const useFastenerCalculator = () => {
    const searchParams = useSearchParams();

    const [standard, setStandard] = useState<FastenerStandard>('ISO Metric');
    const [size, setSize] = useState<string>('M12');
    const [clearanceSeries, setClearanceSeries] = useState<'fine' | 'normal' | 'coarse'>('normal');

    const availableSizes = useMemo(() => {
        return Array.from(new Set(FASTENERS_DB.filter(f => f.standard === standard).map(f => f.size)));
    }, [standard]);

    const [customParams, setCustomParams] = useState({
        diameter: 10,
        pitch: 1.5,
        angle: 60,
        unit: 'mm' as 'mm' | 'inch'
    });

    useEffect(() => {
        const { standard: qsStd, size: qsSize } = parseFastenerSearchParams(searchParams.toString());
        if (qsStd && FASTENERS_DB.some(f => f.standard === qsStd)) {
            setStandard(qsStd as FastenerStandard);
        }
        if (qsSize) setSize(qsSize);
    }, [searchParams]);

    useEffect(() => {
        if (standard === 'Custom') return;
        const sizes = FASTENERS_DB.filter(f => f.standard === standard).map(f => f.size);
        if (size && sizes.includes(size)) return;
        setSize(sizes[0] || '');
    }, [standard, size]);

    const selectedFastener = useMemo(() => {
        if (standard === 'Custom') return null;
        return FASTENERS_DB.find(f => f.standard === standard && f.size === size) || FASTENERS_DB[0];
    }, [standard, size]);

    const [manualUnit, setManualUnit] = useState<'mm' | 'inch' | 'auto'>('auto');

    const geometry = useMemo(() => {
        if (standard === 'Custom') {
            return getThreadGeometryFromPage('Custom', '', {
                diameter: customParams.diameter,
                pitch: customParams.pitch,
            });
        }
        return getThreadGeometryFromPage(standard, size);
    }, [standard, size, customParams]);

    const results = useMemo(() => {
        if (standard === 'Custom') {
            const { diameter: d, pitch: p, angle, unit } = customParams;
            const g = geometry || {
                minorDia: d - 1.0825 * p,
                pitchDia: d - 0.6495 * p,
                tapDrill: d - p,
                clearanceFine: null,
                clearanceNormal: d * 1.05,
                clearanceCoarse: null,
                stressArea: 0.7854 * Math.pow(d - 0.9382 * p, 2),
            };
            const clearanceKey = clearanceSeries === 'fine' ? g.clearanceFine
                : clearanceSeries === 'coarse' ? g.clearanceCoarse
                : g.clearanceNormal;

            return {
                standard: 'Custom',
                size: `Custom ${d}${unit === 'mm' ? 'mm' : '"'}`,
                majorDia: d,
                minorDia: g.minorDia,
                pitchDia: g.pitchDia,
                pitch: p,
                tapDrill: g.tapDrill > 0 ? g.tapDrill.toFixed(2) : '0.00',
                clearance: clearanceKey != null ? clearanceKey.toFixed(2) : (d * 1.05).toFixed(2),
                clearanceFine: g.clearanceFine?.toFixed(2) ?? '-',
                clearanceNormal: g.clearanceNormal?.toFixed(2) ?? '-',
                clearanceCoarse: g.clearanceCoarse?.toFixed(2) ?? '-',
                stressArea: g.stressArea > 0 ? g.stressArea.toFixed(2) : 'N/A',
                unit,
                displayPitch: `${p} ${unit}`,
                angle,
                isTapered: false,
            };
        }

        const s = selectedFastener || FASTENERS_DB[0];
        const g = geometry || {
            clearanceFine: null,
            clearanceNormal: null,
            clearanceCoarse: null,
        };
        const nativeIsImperial = standard === 'UNC' || standard === 'UNF' || standard === 'NPT';
        const useImperial = manualUnit === 'auto' ? nativeIsImperial : manualUnit === 'inch';

        let angle = 60;
        if (standard === 'BSPP (G)' || standard === 'BSPT (R)') angle = 55;
        if (standard === 'Trapezoidal (Tr)') angle = 30;

        const isTapered = standard === 'NPT' || standard === 'BSPT (R)';
        const clearanceVal = clearanceSeries === 'fine' ? g.clearanceFine
            : clearanceSeries === 'coarse' ? g.clearanceCoarse
            : g.clearanceNormal;

        const conv = (v: number) => useImperial ? v / 25.4 : v;

        return {
            ...s,
            unit: useImperial ? 'inch' : 'mm',
            majorDia: conv(s.majorDia),
            minorDia: conv(s.minorDia),
            pitchDia: conv(s.pitchDia),
            tapDrill: conv(s.tapDrill).toFixed(3),
            clearance: isTapered ? 'N/A' : (clearanceVal != null ? conv(clearanceVal).toFixed(3) : conv(s.majorDia * 1.05).toFixed(3)),
            clearanceFine: g.clearanceFine != null ? conv(g.clearanceFine).toFixed(3) : 'N/A',
            clearanceNormal: g.clearanceNormal != null ? conv(g.clearanceNormal).toFixed(3) : 'N/A',
            clearanceCoarse: g.clearanceCoarse != null ? conv(g.clearanceCoarse).toFixed(3) : 'N/A',
            stressArea: (useImperial ? s.stressArea / 645.16 : s.stressArea).toFixed(4),
            displayPitch: nativeIsImperial || standard.includes('BSPP') || standard.includes('BSPT')
                ? `${s.pitch} TPI`
                : `${s.pitch} mm`,
            angle,
            isTapered,
        };
    }, [selectedFastener, standard, customParams, manualUnit, geometry, clearanceSeries]);

    return {
        standard, setStandard,
        size, setSize,
        availableSizes,
        customParams, setCustomParams,
        results,
        manualUnit, setManualUnit,
        clearanceSeries, setClearanceSeries,
        geometry,
    };
};
