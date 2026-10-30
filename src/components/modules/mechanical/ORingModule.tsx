'use client';

import React, { useState, useMemo } from 'react';
import {
    Droplets,
    ShieldCheck,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Layers,
    Gauge,
    Info,
    Copy,
    Check,
    RotateCw,
    Sliders,
    Compass,
    FileText,
    ExternalLink,
    ChevronRight,
    Award
} from 'lucide-react';
import { useI18nStore, type Language } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import {
    calculateORingGland,
    STANDARD_CORDS,
    GLAND_APP_CONFIGS,
    ORING_MATERIALS,
    GlandApplicationType
} from '@/lib/calculations/oringGland';
import {
    SUPTEX_SEAL_TYPES,
    SUPTEX_STANDARD_SIZES,
    SUPTEX_MATERIAL_SPECS,
    KASTAS_SERIES,
    KASTAS_STANDARD_ROD_SIZES,
    KASTAS_STANDARD_PISTON_SIZES,
    POLILAS_SURFACE_REQUIREMENTS,
    getMaxExtrusionGap,
    SuptexSealType,
    KastasSeriesInfo,
    KastasRodDimension,
    KastasPistonDimension
} from '@/data/sealsCatalogDatabase';
import {
    ORingCrossSectionSVG,
    OilSealCrossSectionSVG,
    HydraulicSealCrossSectionSVG
} from '@/components/visualizers/SealVisualizers';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

export { ORingCrossSectionSVG, OilSealCrossSectionSVG, HydraulicSealCrossSectionSVG };

export type SealingHubTab = 'oring' | 'oil-seal' | 'hydraulic-seal';

const getORingMaterialLabel = (id: string, defaultName: string, lang: Language) => {
    switch (id) {
        case 'nbr-70':
            return t12(lang, 'NBR 70 Shore A (Standard Nitrile - Hydraulic/Air)', 'NBR 70 Shore A (Standart Nitril - Hidrolik/Hava)');
        case 'nbr-90':
            return t12(lang, 'NBR 90 Shore A (Hard Nitrile - High Pressure)', 'NBR 90 Shore A (Sert Nitril - Yüksek Basınç)');
        case 'fkm-75':
            return t12(lang, 'FKM / Viton 75 Shore A (High Temp & Chemical)', 'FKM / Viton 75 Shore A (Yüksek Isı & Kimyasal)');
        case 'fkm-90':
            return t12(lang, 'FKM / Viton 90 Shore A (High Pressure & Temp)', 'FKM / Viton 90 Shore A (Yüksek Basınç & Isı)');
        case 'epdm-70':
            return t12(lang, 'EPDM 70 Shore A (Hot Water, Steam & Brake Fluid)', 'EPDM 70 Shore A (Sıcak Su, Buhar & Fren Hidroliği)');
        case 'silicone-70':
            return t12(lang, 'VMQ Silicone 70 Shore A (Food Grade & Extreme Temp)', 'VMQ Silikon 70 Shore A (Gıda & Ekstrem Sıcaklık)');
        case 'ptfe':
            return t12(lang, 'PTFE / Teflon (Pure Resistance & Lowest Friction)', 'PTFE / Teflon (Saf Kimyasal Direnç & Sıfır Sürtünme)');
        case 'ffkm-75':
            return t12(lang, 'FFKM / Kalrez 75 Shore A (Max Chemical Resistance)', 'FFKM / Kalrez 75 Shore A (Maksimum Agresif Kimyasal)');
        default:
            return defaultName;
    }
};

const getGlandAppLabel = (type: string, defaultName: string, lang: Language) => {
    switch (type) {
        case 'static_radial_piston':
            return t12(lang, 'Static Radial (Piston Groove)', 'Statik Radyal (Piston Oluk)');
        case 'static_radial_rod':
            return t12(lang, 'Static Radial (Rod / Bore Groove)', 'Statik Radyal (Mil / Kovan İçi Oluk)');
        case 'static_axial_internal':
            return t12(lang, 'Static Axial Flange (Internal Pressure)', 'Statik Eksenel Flanş (İç Basınç)');
        case 'static_axial_external':
            return t12(lang, 'Static Axial Flange (External Pressure / Vacuum)', 'Statik Eksenel Flanş (Dış Basınç / Vakum)');
        case 'dynamic_reciprocating':
            return t12(lang, 'Dynamic Reciprocating (Hydraulic / Pneumatic Cylinder)', 'Dinamik İleri-Geri (Hidrolik / Pnömatik Silindir)');
        case 'dynamic_rotary':
            return t12(lang, 'Dynamic Rotary (Low-Speed Shaft)', 'Dinamik Döner Mil (Rotary Shaft)');
        default:
            return defaultName;
    }
};

export default function ORingModule() {
  const precision = useGlobalPrecision();
    const { language } = useI18nStore();
    const [activeHubTab, setActiveHubTab] = useState<SealingHubTab>('oring');

    // =========================================================================
    // TAB 1: ISO 3601 O-RING STATE & CALCULATIONS
    // =========================================================================
    const [selectedCordId, setSelectedCordId] = useState<string>('as-353');
    const [customCord, setCustomCord] = useState<number>(3.53);
    const [isCustomCord, setIsCustomCord] = useState<boolean>(false);

    const [innerDiameter, setInnerDiameter] = useState<number>(50); // d_1 (mm)
    const [applicationType, setApplicationType] = useState<GlandApplicationType>('static_radial_piston');
    const [materialId, setMaterialId] = useState<string>('nbr-70');
    const [operatingPressureBar, setOperatingPressureBar] = useState<number>(25);
    // Gland geometry overrides (empty = recommended / assumed)
    const [grooveDiameter, setGrooveDiameter] = useState<number | ''>('');
    const [diametralGap, setDiametralGap] = useState<number>(0.15);
    const [customDepth, setCustomDepth] = useState<number | ''>('');
    const [customWidth, setCustomWidth] = useState<number | ''>('');

    const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

    const activeCordDiameter = useMemo(() => {
        if (isCustomCord) return customCord;
        const cord = STANDARD_CORDS.find(c => c.id === selectedCordId);
        return cord ? cord.cordDiameter : 3.53;
    }, [isCustomCord, customCord, selectedCordId]);

    const oringResults = useMemo(() => {
        return calculateORingGland({
            cordDiameter: activeCordDiameter,
            innerDiameter,
            applicationType,
            materialId,
            operatingPressureBar,
            diametralClearanceGap: diametralGap,
            grooveDiameter: grooveDiameter === '' ? undefined : grooveDiameter,
            customGlandDepth: customDepth === '' ? undefined : customDepth,
            customGlandWidth: customWidth === '' ? undefined : customWidth,
        });
    }, [activeCordDiameter, innerDiameter, applicationType, materialId, operatingPressureBar, diametralGap, grooveDiameter, customDepth, customWidth]);
    const isAxialGland = applicationType === 'static_axial_internal' || applicationType === 'static_axial_external';
    const isRodGland = applicationType === 'static_radial_rod';

    const appConfig = GLAND_APP_CONFIGS[applicationType];
    const material = ORING_MATERIALS[materialId] || ORING_MATERIALS['nbr-70'];
    const fmtPct = (val: number | string) => language === 'tr' ? `%${val}` : `${val}%`;

    const copyORingReport = () => {
        const text = `=== ${t12(language, 'ISO 3601 O-RING GLAND DESIGN REPORT', 'ISO 3601 O-RING KANAL HESAP RAPORU')} ===
${t12(language, 'Cord (W)', 'Kordon (W)')}: ${activeCordDiameter} mm | ${t12(language, 'Inner Dia (d1)', 'İç Çap (d1)')}: ${innerDiameter} mm | ${t12(language, 'Material', 'Malzeme')}: ${getORingMaterialLabel(materialId, material.name, language)} (${material.hardnessShoreA} Shore A)
${t12(language, 'Application', 'Uygulama')}: ${getGlandAppLabel(applicationType, appConfig.name, language)} | ${t12(language, 'Pressure', 'Çalışma Basıncı')}: ${operatingPressureBar} bar
${t12(language, 'Gland Dimensions', 'Kanal Boyutları')}: ${t12(language, 'Depth (H)', 'Derinlik (H)')} = ${oringResults.glandDepth} mm, ${t12(language, 'Width (b)', 'Genişlik (b)')} = ${oringResults.glandWidth} mm
${t12(language, 'Squeeze Ratio (S)', 'Sıkışma Oranı (S)')}: ${fmtPct(formatEngineeringValue(oringResults.squeezePercent, 1, true))} (${oringResults.squeezeStatus.toUpperCase()})
${t12(language, 'Gland Fill (F)', 'Kanal Doluluğu (F)')}: ${fmtPct(formatEngineeringValue(oringResults.glandFillPercent, 1, true))} (${oringResults.fillStatus.toUpperCase()})
${t12(language, 'Diametral Gap (2g)', 'Çap Boşluğu (2g)')}: ${formatEngineeringValue(oringResults.diametralGapMm, precision, true)} mm (${t12(language, 'Max', 'Maks')}: ${formatEngineeringValue(oringResults.maxAllowedGapMm, precision, true)} mm)
${t12(language, 'Stretch / cord', 'Gerilme / kordon')}: ${fmtPct(formatEngineeringValue(oringResults.idStretchPercent, 1, true))} → W' = ${formatEngineeringValue(oringResults.effectiveCordDiameter, precision, true)} mm${oringResults.stretchAssumed ? t12(language, ' (assumed)', ' (varsayım)') : ''}
${t12(language, 'Backup Ring', 'Destek Halkası')}: ${oringResults.backupRingRequired ? t12(language, 'Mandatory', 'Zorunlu') : t12(language, 'Not Required', 'Gerekmez')}
${t12(language, 'Overall Status', 'Genel Durum')}: ${oringResults.overallStatus}`;
        navigator.clipboard.writeText(text);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
    };

    // =========================================================================
    // TAB 2: SUPTEX DÖNER MİL YAĞ KEÇELERİ (DIN 3760 / ISO 6194)
    // Grounded in Suptex Döner Mil Keçeleri Kataloğu (Tip 101, 111, 121, 131, B2)
    // =========================================================================
    const [suptexTypeId, setSuptexTypeId] = useState<string>('111');
    const [suptexShaftDia, setSuptexShaftDia] = useState<number>(40);
    const [suptexBoreDia, setSuptexBoreDia] = useState<number>(62);
    const [suptexWidth, setSuptexWidth] = useState<number>(7);
    const [suptexMaterial, setSuptexMaterial] = useState<'NBR' | 'FKM' | 'PTFE'>('NBR');
    const [suptexSpeedRpm, setSuptexSpeedRpm] = useState<number>(1500);
    const [suptexPressureBar, setSuptexPressureBar] = useState<number>(0.2);
    const [copiedSuptexCode, setCopiedSuptexCode] = useState<boolean>(false);

    // Current Suptex Type Info
    const currentSuptexType = SUPTEX_SEAL_TYPES[suptexTypeId] || SUPTEX_SEAL_TYPES['111'];
    const currentSuptexMaterial = SUPTEX_MATERIAL_SPECS[suptexMaterial];

    // Select standard size from Suptex Catalog
    const handleSelectSuptexStandardSize = (sizeStr: string) => {
        const parts = sizeStr.split('x').map(Number);
        if (parts.length === 3) {
            setSuptexShaftDia(parts[0]);
            setSuptexBoreDia(parts[1]);
            setSuptexWidth(parts[2]);
        }
    };

    // Calculate peripheral speed (m/s): v = (pi * d1 * n) / 60000
    const suptexPeripheralSpeed = useMemo(() => {
        return (Math.PI * suptexShaftDia * suptexSpeedRpm) / 60000;
    }, [suptexShaftDia, suptexSpeedRpm]);

    const maxAllowedSpeed = currentSuptexType.maxSpeedMs[suptexMaterial];
    const isSuptexSpeedSafe = suptexPeripheralSpeed <= maxAllowedSpeed;
    const isSuptexPressureSafe = suptexPressureBar <= currentSuptexType.maxPressureBar;

    // Order code e.g. "SUPTEX 111 - 40 62 7 NBR (DIN 3760 Form AS)"
    const suptexOrderCode = `SUPTEX ${currentSuptexType.id} - ${suptexShaftDia} ${suptexBoreDia} ${suptexWidth} ${suptexMaterial} (DIN 3760 Form ${currentSuptexType.dinForm})`;

    const copySuptexOrderCode = () => {
        navigator.clipboard.writeText(suptexOrderCode);
        setCopiedSuptexCode(true);
        setTimeout(() => setCopiedSuptexCode(false), 2000);
    };

    // =========================================================================
    // TAB 3: KASTAŞ & POLİLAS HİDROLİK SIZDIRMAZLIK ELEMANLARI
    // Grounded in Kastaş Hidrolik Kataloğu & Polilas Teknik Kuralları
    // =========================================================================
    const [hydraulicCategory, setHydraulicCategory] = useState<'rod' | 'piston' | 'wiper'>('rod');
    const [kastasSeriesId, setKastasSeriesId] = useState<string>('K35');
    const [selectedRodDia, setSelectedRodDia] = useState<number>(50);
    const [selectedPistonBoreDia, setSelectedPistonBoreDia] = useState<number>(80);
    const [hydraulicPressureBar, setHydraulicPressureBar] = useState<number>(160);
    const [userRadialClearanceMm, setUserRadialClearanceMm] = useState<number>(0.20);
    const [copiedKastasCode, setCopiedKastasCode] = useState<boolean>(false);

    // Filter Kastaş series by active category
    const availableKastasSeries = useMemo(() => {
        return Object.values(KASTAS_SERIES).filter(s => s.category === hydraulicCategory);
    }, [hydraulicCategory]);

    const activeKastasSeries = KASTAS_SERIES[kastasSeriesId] || KASTAS_SERIES['K35'];

    // Active dimensions from ISO 7425 / Kastaş Catalog
    const activeRodDimension = useMemo(() => {
        return KASTAS_STANDARD_ROD_SIZES.find(r => r.d === selectedRodDia) || {
            d: selectedRodDia,
            D: selectedRodDia + (selectedRodDia <= 32 ? 7.3 : selectedRodDia <= 63 ? 10.7 : 15.1),
            L: selectedRodDia <= 32 ? 3.2 : selectedRodDia <= 63 ? 4.2 : 6.3,
            S: selectedRodDia <= 32 ? 3.65 : selectedRodDia <= 63 ? 5.35 : 7.55,
            chamferC: selectedRodDia <= 32 ? 2.5 : selectedRodDia <= 63 ? 4.0 : 5.0,
            r1: selectedRodDia <= 32 ? 0.4 : selectedRodDia <= 63 ? 0.6 : 0.8
        };
    }, [selectedRodDia]);

    const activePistonDimension = useMemo(() => {
        return KASTAS_STANDARD_PISTON_SIZES.find(p => p.D === selectedPistonBoreDia) || {
            D: selectedPistonBoreDia,
            d: selectedPistonBoreDia - (selectedPistonBoreDia <= 32 ? 7.3 : selectedPistonBoreDia <= 63 ? 10.7 : 15.1),
            L: selectedPistonBoreDia <= 32 ? 3.2 : selectedPistonBoreDia <= 63 ? 4.2 : 6.3,
            S: selectedPistonBoreDia <= 32 ? 3.65 : selectedPistonBoreDia <= 63 ? 5.35 : 7.55,
            chamferC: selectedPistonBoreDia <= 32 ? 2.5 : selectedPistonBoreDia <= 63 ? 4.0 : 5.0,
            r1: selectedPistonBoreDia <= 32 ? 0.4 : selectedPistonBoreDia <= 63 ? 0.6 : 0.8
        };
    }, [selectedPistonBoreDia]);

    // Material type for extrusion calculation:
    const seriesMaterialType = useMemo((): 'PU' | 'PTFE' | 'NBR' => {
        if (activeKastasSeries.material.includes('PTFE') || activeKastasSeries.material.includes('PT6003')) return 'PTFE';
        if (activeKastasSeries.material.includes('PU') || activeKastasSeries.material.includes('Poliüretan')) return 'PU';
        return 'NBR';
    }, [activeKastasSeries]);

    const maxAllowedExtrusionGap = useMemo(() => {
        return getMaxExtrusionGap(hydraulicPressureBar, seriesMaterialType);
    }, [hydraulicPressureBar, seriesMaterialType]);

    const isExtrusionGapSafe = userRadialClearanceMm <= maxAllowedExtrusionGap;
    const isHydraulicPressureSafe = hydraulicPressureBar <= activeKastasSeries.maxPressureBar;

    // Order code
    const kastasOrderCode = useMemo(() => {
        if (hydraulicCategory === 'rod') {
            return `KASTAŞ ${activeKastasSeries.code} - ${activeRodDimension.d}x${formatEngineeringValue(activeRodDimension.D, precision, false)}x${activeRodDimension.L} (${activeKastasSeries.material}) ${activeKastasSeries.isoStandard}`;
        } else if (hydraulicCategory === 'piston') {
            return `KASTAŞ ${activeKastasSeries.code} - ${activePistonDimension.D}x${formatEngineeringValue(activePistonDimension.d, precision, false)}x${activePistonDimension.L} (${activeKastasSeries.material}) ${activeKastasSeries.isoStandard}`;
        } else {
            return `KASTAŞ ${activeKastasSeries.code} - Ø${selectedRodDia} (${activeKastasSeries.material}) ${activeKastasSeries.isoStandard}`;
        }
    }, [hydraulicCategory, activeKastasSeries, activeRodDimension, activePistonDimension, selectedRodDia]);

    const copyKastasOrderCode = () => {
        navigator.clipboard.writeText(kastasOrderCode);
        setCopiedKastasCode(true);
        setTimeout(() => setCopiedKastasCode(false), 2000);
    };

    const renderModuleHeader = (title: string, standards: string[]) => (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)] shrink-0">
                    <Droplets size={22} />
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="text-sm font-bold text-white tracking-wide flex items-center gap-2 flex-wrap">
                        <span>{title}</span>
                        <div className="flex items-center gap-1 flex-wrap">
                            {standards.map((std) => (
                                <span key={std} className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono font-semibold">
                                    {std}
                                </span>
                            ))}
                        </div>
                    </h1>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        {t12(language, 'Industrial Sealing Engineering Cockpit', 'Endüstriyel Sızdırmazlık Tasarım Kokpiti')}
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 text-xs font-semibold">
                <button
                    type="button"
                    onClick={() => setActiveHubTab('oring')}
                    title={t12(language, 'ISO 3601 / AS 568 O-Ring Gland Design', 'ISO 3601 / AS 568 O-Ring Kanal Tasarımı')}
                    className={`py-2 px-1.5 rounded-lg text-center transition-all cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis ${
                        activeHubTab === 'oring'
                            ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold shadow-md '
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                >
                    {t12(language, 'ISO 3601 O-Ring', 'ISO 3601 O-Ring')}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveHubTab('oil-seal')}
                    title={t12(language, 'Suptex Rotary Shaft Seals (DIN 3760)', 'Suptex Döner Mil Yağ Keçeleri (DIN 3760)')}
                    className={`py-2 px-1.5 rounded-lg text-center transition-all cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis ${
                        activeHubTab === 'oil-seal'
                            ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold shadow-md '
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                >
                    {t12(language, 'Rotary Oil Seals', 'Döner Mil Keçeleri')}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveHubTab('hydraulic-seal')}
                    title={t12(language, 'Kastaş Hydraulic Seals (ISO 7425)', 'Kastaş Hidrolik Sızdırmazlık (ISO 7425)')}
                    className={`py-2 px-1.5 rounded-lg text-center transition-all cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis ${
                        activeHubTab === 'hydraulic-seal'
                            ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold shadow-md '
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                >
                    {t12(language, 'Hydraulic Seals', 'Hidrolik Keçeler')}
                </button>
            </div>
        </div>
    );

    const filteredKastasSeries = availableKastasSeries;

    return (
        <div className="w-full min-h-screen bg-[var(--bg-0)] text-slate-100 p-3 sm:p-4 lg:p-6 font-sans">
            {activeHubTab === 'oring' && (
                /* ========================================================================= */
                /* TAB 1: ISO 3601 / AS 568 O-RING ENGINE (3-COLUMN COCKPIT)                */
                /* ========================================================================= */
                <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
                    {/* SOL: Girdiler */}
                    <div className="w-full xl:w-[380px] 2xl:w-[420px] shrink-0 space-y-4">
                        {renderModuleHeader(t12(language, 'ISO 3601 O-Ring Gland', 'ISO 3601 O-Ring Kanalı'), ['ISO 3601-1', 'ISO 3601-2', 'AS 568'])}

                        {/* O-Ring Dimensions Card */}
                        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                                    <Droplets size={15} /> {t12(language, '1. O-Ring Cord & Diameter Selection', '1. O-Ring Kordon ve Çap Seçimi')}
                                </h3>
                                <span className="text-[10px] text-slate-500 font-mono">ISO 3601 / AS 568</span>
                            </div>

                            {/* Cord Diameter Pill Buttons */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                                    {t12(language, 'Standard Cord Diameter W (Cross Section)', 'Standart Kordon Çapı W (Kesit Kalınlığı)')}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {STANDARD_CORDS.map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedCordId(c.id);
                                                setIsCustomCord(false);
                                            }}
                                            className={`py-2 px-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                !isCustomCord && selectedCordId === c.id
                                                    ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-md '
                                                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                                            }`}
                                        >
                                            <div className="text-xs font-mono font-bold">Ø {c.cordDiameter} mm</div>
                                            <div className="text-[10px] text-slate-500 truncate">{c.standardType}</div>
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setIsCustomCord(true)}
                                        className={`py-2 px-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                            isCustomCord
                                                ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-md '
                                                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="text-xs font-mono font-bold">{t12(language, 'Custom Cord', 'Özel Kordon')}</div>
                                        <div className="text-[10px] text-slate-500">{t12(language, 'User Defined', 'Kullanıcı Tanımlı')}</div>
                                    </button>
                                </div>

                                {isCustomCord && (
                                    <div className="mt-3">
                                        <div className="flex justify-between items-center mb-1 text-xs">
                                            <span className="text-slate-300">{t12(language, 'Custom Cord Diameter (W):', 'Özel Kordon Çapı (W):')}</span>
                                            <span className="font-mono text-teal-400 font-bold">{customCord} mm</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={1.0}
                                            max={10.0}
                                            step={0.05}
                                            value={customCord}
                                            onChange={(e) => setCustomCord(Number(e.target.value))}
                                            className="w-full accent-[var(--cyan)] bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Inner Diameter Slider */}
                            <div>
                                <div className="flex justify-between items-center mb-1 text-xs">
                                    <span className="text-slate-300 font-medium">{t12(language, 'O-Ring Inside Diameter (d₁):', 'O-Ring İç Çapı (d₁):')}</span>
                                    <span className="font-mono text-teal-400 font-bold">{innerDiameter} mm</span>
                                </div>
                                <input
                                    type="range"
                                    min={5}
                                    max={250}
                                    step={1}
                                    value={innerDiameter}
                                    onChange={(e) => setInnerDiameter(Number(e.target.value))}
                                    className="w-full accent-[var(--cyan)] bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                                    <span>5 mm</span>
                                    <span>100 mm</span>
                                    <span>250 mm</span>
                                </div>
                            </div>

                            {/* Gland geometry — optional overrides */}
                            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)] p-3 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--alu-dim)]">{t12(language, 'Gland geometry (optional)', 'Kanal geometrisi (opsiyonel)')}</span>
                                    {(grooveDiameter !== '' || customDepth !== '' || customWidth !== '') && (
                                        <button type="button" onClick={() => { setGrooveDiameter(''); setCustomDepth(''); setCustomWidth(''); }} className="text-[10px] text-[var(--cyan)] hover:underline cursor-pointer">
                                            {t12(language, 'Reset to recommended', 'Önerilene dön')}
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {!isAxialGland && (
                                        <label className="block">
                                            <span className="block text-[10.5px] text-[var(--alu-dim)] mb-0.5">
                                                {isRodGland ? t12(language, 'Groove bottom Ø (outer)', 'Kanal taban Ø (dış)') : t12(language, 'Groove root Ø (inner)', 'Kanal taban Ø (iç)')}
                                            </span>
                                            <input type="number" step={0.05} min={1} inputMode="decimal" value={grooveDiameter}
                                                placeholder={isRodGland ? `${formatEngineeringValue(innerDiameter + 2 * activeCordDiameter, 2, true)}` : `${formatEngineeringValue(innerDiameter * 1.02, 2, true)}`}
                                                onChange={(e) => setGrooveDiameter(e.target.value === '' ? '' : Number(e.target.value))}
                                                className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-0)] px-2 py-1.5 font-mono text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--cyan)]" />
                                        </label>
                                    )}
                                    {!isAxialGland && (
                                        <label className="block">
                                            <span className="block text-[10.5px] text-[var(--alu-dim)] mb-0.5">{t12(language, 'Diametral clearance 2g', 'Çap boşluğu 2g')} (mm)</span>
                                            <input type="number" step={0.01} min={0} inputMode="decimal" value={diametralGap}
                                                onChange={(e) => setDiametralGap(Math.max(0, Number(e.target.value) || 0))}
                                                className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-0)] px-2 py-1.5 font-mono text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--cyan)]" />
                                        </label>
                                    )}
                                    <label className="block">
                                        <span className="block text-[10.5px] text-[var(--alu-dim)] mb-0.5">{t12(language, 'Groove depth H', 'Kanal derinliği H')} (mm)</span>
                                        <input type="number" step={0.01} min={0.1} inputMode="decimal" value={customDepth}
                                            placeholder={`${oringResults.recommendedGlandDepth}`}
                                            onChange={(e) => setCustomDepth(e.target.value === '' ? '' : Number(e.target.value))}
                                            className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-0)] px-2 py-1.5 font-mono text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--cyan)]" />
                                    </label>
                                    <label className="block">
                                        <span className="block text-[10.5px] text-[var(--alu-dim)] mb-0.5">{t12(language, 'Groove width b', 'Kanal genişliği b')} (mm)</span>
                                        <input type="number" step={0.01} min={0.1} inputMode="decimal" value={customWidth}
                                            placeholder={`${oringResults.recommendedGlandWidth}`}
                                            onChange={(e) => setCustomWidth(e.target.value === '' ? '' : Number(e.target.value))}
                                            className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-0)] px-2 py-1.5 font-mono text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--cyan)]" />
                                    </label>
                                </div>
                                <p className="text-[10.5px] leading-snug text-[var(--muted)]">
                                    {t12(language, 'Leave a field empty to use the recommended value (shown greyed). Squeeze uses h = H + g for radial glands.', 'Önerilen değeri (gri) kullanmak için alanı boş bırakın. Radyal kanallarda sıkışma h = H + g ile hesaplanır.')}
                                </p>
                            </div>
                        </div>

                        {/* Application & Pressure Card */}
                        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                                    <Gauge size={15} /> {t12(language, '2. Operating Conditions & Gland Type', '2. Çalışma Şartları & Yuva Tipi')}
                                </h3>
                                <span className="text-[10px] text-slate-500 font-mono">Polilas / ISO {t12(language, 'Standards', 'Standartları')}</span>
                            </div>

                            {/* Application Type Selection */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">
                                    {t12(language, 'Application Assembly Geometry', 'Uygulama Montaj Geometrisi')}
                                </label>
                                <select
                                    value={applicationType}
                                    onChange={(e) => setApplicationType(e.target.value as GlandApplicationType)}
                                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                                >
                                    {Object.entries(GLAND_APP_CONFIGS).map(([key, cfg]) => (
                                        <option key={key} value={key}>
                                            {getGlandAppLabel(key, cfg.name, language)} ({cfg.targetSqueezeMin}% - {cfg.targetSqueezeMax}% {t12(language, 'squeeze', 'sıkışma')})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Material Selection */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">
                                    {t12(language, 'Elastomer Material & Hardness', 'Elastomer Malzeme & Sertlik')}
                                </label>
                                <select
                                    value={materialId}
                                    onChange={(e) => setMaterialId(e.target.value)}
                                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                                >
                                    {Object.entries(ORING_MATERIALS).map(([key, mat]) => (
                                        <option key={key} value={key}>
                                            {getORingMaterialLabel(key, mat.name, language)} ({mat.hardnessShoreA} Shore A) - {mat.tempMin}°C {t12(language, 'to', 'ila')} {mat.tempMax}°C
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Pressure Input */}
                            <div>
                                <div className="flex justify-between items-center mb-1 text-xs">
                                    <span className="text-slate-300 font-medium">{t12(language, 'Operating System Pressure:', 'Sistem Çalışma Basıncı:')}</span>
                                    <span className="font-mono text-teal-400 font-bold">{operatingPressureBar} bar</span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={250}
                                    step={5}
                                    value={operatingPressureBar}
                                    onChange={(e) => setOperatingPressureBar(Number(e.target.value))}
                                    className="w-full accent-[var(--cyan)] bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                                    <span>0 bar ({t12(language, 'Vacuum', 'Vakum')})</span>
                                    <span>50 bar ({t12(language, 'Backup Ring Threshold', 'Destek Halkası Eşiği')})</span>
                                    <span>250 bar</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ORTA: Görüntü (CAD Cross-Section Blueprint) */}
                    <div className="flex-1 min-w-0 min-h-[480px] xl:min-h-0 flex flex-col bg-[var(--bg-0)] border-b xl:border-b-0 xl:border-r border-white/5 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                        {/* SVG Blueprint Section */}
                        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                    {t12(language, 'ISO 3601 Gland Section & Deformation Analysis', 'ISO 3601 Kanal Kesiti & Deformasyon Analizi')}
                                </span>
                                <span className="text-xs font-mono text-teal-400">
                                    W = {activeCordDiameter} mm | b = {oringResults.glandWidth} mm | H = {oringResults.glandDepth} mm
                                </span>
                            </div>
                            <ORingCrossSectionSVG
                                cordDia={activeCordDiameter}
                                depth={oringResults.glandDepth}
                                width={oringResults.glandWidth}
                                squeezePercent={oringResults.squeezePercent}
                                pressureBar={operatingPressureBar}
                                radialGap={oringResults.radialGapMm}
                                maxAllowedGap={oringResults.maxAllowedGapMm}
                                backupRingRequired={oringResults.backupRingRequired}
                                innerDiameter={innerDiameter}
                                applicationType={applicationType}
                                materialName={getORingMaterialLabel(materialId, material.name, language)}
                                squeezeStatus={oringResults.squeezeStatus}
                                fillPercent={oringResults.glandFillPercent}
                                fillStatus={oringResults.fillStatus}
                                overallStatus={oringResults.overallStatus}
                                language={language}
                            />
                        </div>

                        {/* Polilas Surface Requirements Card */}
                        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-2.5">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                <Info size={15} className="text-teal-400" /> {t12(language, 'Recommended Surface Finish (ISO 3601-2)', 'Polilas O-Ring Yuva Yüzey Kalitesi')}
                            </h3>
                            <div className="space-y-1.5 text-xs font-mono text-slate-300">
                                <div className="flex justify-between py-1 border-b border-slate-800">
                                    <span className="text-slate-400">{t12(language, 'Dynamic Sliding Surface:', 'Dinamik Kayma Yüzeyi:')}</span>
                                    <span className="text-teal-400 font-bold">Ra 0.20 - 0.40 μm (Rz ≤ 1.6 μm)</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-800">
                                    <span className="text-slate-400">{t12(language, 'Static Surface:', 'Statik Yüzey:')}</span>
                                    <span className="text-white font-bold">Ra 0.80 - 1.60 μm (Rz ≤ 6.3 μm)</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-800">
                                    <span className="text-slate-400">{t12(language, 'Groove Flanks / Side Walls:', 'Kanal Yan Duvarları:')}</span>
                                    <span className="text-white font-bold">Ra 1.60 - 3.20 μm (Rz ≤ 10 μm)</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-slate-400">{t12(language, 'Lead-in Chamfer Angle:', 'Giriş Pahı (Pah Açısı):')}</span>
                                    <span className="text-amber-400 font-bold">15° - 20° ({t12(language, 'Burr-free', 'Keskin kenarsız')})</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SAĞ: Çıktılar & KPIs */}
                    <div className="w-full lg:w-[380px] shrink-0 flex flex-col bg-[var(--bg-1)]/90 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                        {/* Overall Status Banner */}
                        <div
                            className={`p-4 rounded-2xl border shadow-xl flex items-center justify-between ${
                                oringResults.overallStatus === 'SAFE'
                                    ? 'bg-emerald-500/10 border-emerald-500/30'
                                    : oringResults.overallStatus === 'WARNING'
                                    ? 'bg-amber-500/10 border-amber-500/30'
                                    : 'bg-rose-500/10 border-rose-500/30'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                {oringResults.overallStatus === 'SAFE' ? (
                                    <CheckCircle2 className="text-emerald-400 shrink-0" size={26} />
                                ) : oringResults.overallStatus === 'WARNING' ? (
                                    <AlertTriangle className="text-amber-400 shrink-0" size={26} />
                                ) : (
                                    <XCircle className="text-rose-400 shrink-0" size={26} />
                                )}
                                <div>
                                    <h4 className="text-xs font-bold text-white leading-tight">
                                        {oringResults.overallStatus === 'SAFE'
                                            ? t12(language, 'O-Ring Conforming (ISO 3601 PASSED)', 'O-Ring Kanalı Uygun (ISO 3601 PASSED)')
                                            : oringResults.overallStatus === 'WARNING'
                                            ? t12(language, 'Warning: Boundary Limit', 'Uyarı: Sınır Değerde')
                                            : t12(language, 'Critical Risk: Nibbling/Overfill', 'Kritik Risk: Hasar Riski')}
                                    </h4>
                                    <p className="text-[10px] text-slate-300 mt-0.5">
                                        {t12(language, 'Squeeze', 'Sıkışma')}: {fmtPct(formatEngineeringValue(oringResults.squeezePercent, 1, true))} | {t12(language, 'Fill', 'Doluluk')}: {fmtPct(formatEngineeringValue(oringResults.glandFillPercent, 1, true))}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={copyORingReport}
                                className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer"
                                title={t12(language, 'Copy Report', 'Raporu Kopyala')}
                            >
                                {copiedSummary ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                            </button>
                        </div>

                        {/* Results Grid (4 KPIs) */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                                    {t12(language, 'Squeeze Ratio', 'Sıkışma Oranı')}
                                </span>
                                <div className={`text-xl font-mono font-black ${
                                    oringResults.squeezeStatus === 'pass'
                                        ? 'text-emerald-400'
                                        : oringResults.squeezeStatus === 'warn'
                                        ? 'text-amber-400'
                                        : 'text-rose-400'
                                }`}>
                                    {fmtPct(formatEngineeringValue(oringResults.squeezePercent, 1, true))}
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    {t12(language, 'Target', 'Hedef')}: {language === 'tr' ? `%${appConfig.targetSqueezeMin}-%${appConfig.targetSqueezeMax}` : `${appConfig.targetSqueezeMin}% - ${appConfig.targetSqueezeMax}%`}
                                </p>
                                {!isAxialGland && (
                                    <p className={`text-[10px] font-mono mt-0.5 ${oringResults.stretchStatus === 'pass' ? 'text-slate-500' : oringResults.stretchStatus === 'warn' ? 'text-amber-400' : 'text-rose-400'}`}>
                                        {isRodGland
                                            ? `${t12(language, 'OD compr.', 'DÇ sıkışma')} ${fmtPct(formatEngineeringValue(oringResults.odCompressionPercent, 1, true))}`
                                            : `${t12(language, 'Stretch', 'Gerilme')} ${fmtPct(formatEngineeringValue(oringResults.idStretchPercent, 1, true))} · W' ${formatEngineeringValue(oringResults.effectiveCordDiameter, 2, true)}`}
                                        {oringResults.stretchAssumed ? t12(language, ' (assumed)', ' (varsayım)') : ''}
                                    </p>
                                )}
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                                    {t12(language, 'Gland Fill', 'Kanal Doluluğu')}
                                </span>
                                <div className={`text-xl font-mono font-black ${
                                    oringResults.fillStatus === 'pass'
                                        ? 'text-emerald-400'
                                        : oringResults.fillStatus === 'warn'
                                        ? 'text-amber-400'
                                        : 'text-rose-400'
                                }`}>
                                    {fmtPct(formatEngineeringValue(oringResults.glandFillPercent, 1, true))}
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    {t12(language, 'Maximum', 'Maksimum')}: {fmtPct(85)}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                                    {t12(language, 'Gland Depth (H)', 'Kanal Derinliği (H)')}
                                </span>
                                <div className="text-xl font-mono font-black text-white">
                                    {oringResults.glandDepth} <span className="text-xs font-normal text-slate-400">mm</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    {isAxialGland ? `${t12(language, 'Machining Tol.', 'İşleme Toleransı')}: +0.05` : `h = H + g = ${formatEngineeringValue(oringResults.compressedHeight, precision, true)} mm`}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                                    {t12(language, 'Gland Width (b)', 'Kanal Genişliği (b)')}
                                </span>
                                <div className="text-xl font-mono font-black text-teal-400">
                                    {oringResults.glandWidth} <span className="text-xs font-normal text-slate-400">mm</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    {t12(language, 'Machining Tol.', 'İşleme Toleransı')}: +0.10
                                </p>
                            </div>
                        </div>

                        {/* Extrusion Gap Analysis */}
                        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-teal-400" />
                                    {t12(language, 'Extrusion Clearance Gap', 'Ekstrüzyon Boşluğu')}
                                </h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                                    oringResults.backupRingRequired
                                        ? 'bg-amber-500/20 text-amber-400'
                                        : 'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                    {oringResults.backupRingRequired 
                                        ? t12(language, 'Backup Ring Required', 'Destek Halkası Gerekli') 
                                        : t12(language, 'Safe Gap', 'Boşluk Güvenli')}
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                {t12(
                                    language,
                                    `Current diametral gap 2g = ${formatEngineeringValue(oringResults.diametralGapMm, precision, true)} mm. Maximum allowable 2g at`,
                                    `Mevcut çap boşluğu 2g = ${formatEngineeringValue(oringResults.diametralGapMm, precision, true)} mm. İzin verilen azami 2g`
                                )}{' '}
                                ({operatingPressureBar} bar):{' '}
                                <span className="font-mono text-teal-300 font-bold">{formatEngineeringValue(oringResults.maxAllowedGapMm, precision, true)} mm</span>.{' '}
                                {oringResults.backupRingRequired 
                                    ? t12(
                                        language,
                                        ' At this pressure / hardness / gap combination a PTFE backup ring (ISO 3601-4) is needed to prevent extrusion nibbling.',
                                        ' Bu basınç / sertlik / boşluk kombinasyonunda ekstrüzyonu önlemek için PTFE destek halkası (ISO 3601-4) gereklidir.'
                                    )
                                    : t12(
                                        language,
                                        ' Under current operating pressure, there is no extrusion hazard.',
                                        ' Mevcut çalışma basıncında standart H8/f7 veya H7/g6 toleransları altında ekstrüzyon riski bulunmamaktadır.'
                                    )}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {activeHubTab === 'oil-seal' && (
                /* ========================================================================= */
                /* TAB 2: SUPTEX DÖNER MİL YAĞ KEÇELERİ (DIN 3760 / ISO 6194) (3-COLUMN)     */
                /* ========================================================================= */
                <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
                    {/* SOL: Girdiler */}
                    <div className="w-full xl:w-[380px] 2xl:w-[420px] shrink-0 space-y-4">
                        {renderModuleHeader(t12(language, 'Suptex Rotary Shaft Seals', 'Suptex Döner Mil Keçeleri'), ['DIN 3760', 'ISO 6194'])}

                        {/* Suptex Type Selector */}
                        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                                    <RotateCw size={15} /> {t12(language, '1. Suptex Seal Type (Form)', '1. Suptex Keçe Tipi (Form)')}
                                </h3>
                                <span className="text-[10px] text-slate-400 font-mono">DIN 3760 Form {currentSuptexType.dinForm}</span>
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                {Object.values(SUPTEX_SEAL_TYPES).map((st) => (
                                    <button
                                        key={st.id}
                                        type="button"
                                        onClick={() => setSuptexTypeId(st.id)}
                                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                            suptexTypeId === st.id
                                                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md '
                                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-white">{st.name}</span>
                                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-amber-400">
                                                {st.outerCase === 'rubber' 
                                                    ? t12(language, 'Rubber Case', 'Kauçuk Kovan') 
                                                    : t12(language, 'Metal Case', 'Metal Kovan')}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{st.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dimensions Selector */}
                        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                                    <Sliders size={15} /> {t12(language, '2. Suptex Size Selection (d₁ × D × b)', '2. Suptex Ölçü Seçimi (d₁ × D × b)')}
                                </h3>
                                <span className="text-[10px] text-slate-500 font-mono">{t12(language, 'Standard Catalog', 'Standart Katalog')}</span>
                            </div>

                            {/* Standard Size Quick Selector */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                                    {t12(language, 'Popular Suptex Standard Sizes (d₁ × D × b mm)', 'Popüler Suptex Standart Ölçüleri (d₁ × D × b mm)')}
                                </label>
                                <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto pr-1">
                                    {SUPTEX_STANDARD_SIZES.slice(0, 24).map((sz, idx) => {
                                        const szKey = `${sz.d1}x${sz.D}x${sz.b}`;
                                        const isCurrent = suptexShaftDia === sz.d1 && suptexBoreDia === sz.D && suptexWidth === sz.b;
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleSelectSuptexStandardSize(szKey)}
                                                className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                                                    isCurrent
                                                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md '
                                                        : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                                                }`}
                                            >
                                                {sz.d1}×{sz.D}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Manual Sliders */}
                            <div className="space-y-3 pt-2">
                                <div>
                                    <div className="flex justify-between items-center mb-1 text-xs">
                                        <span className="text-slate-300">{t12(language, 'Shaft Diameter (d₁):', 'Mil Çapı (d₁):')}</span>
                                        <span className="font-mono text-amber-400 font-bold">Ø {suptexShaftDia} mm (h11)</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={10}
                                        max={150}
                                        step={1}
                                        value={suptexShaftDia}
                                        onChange={(e) => setSuptexShaftDia(Number(e.target.value))}
                                        className="w-full accent-[var(--cyan)] bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1 text-xs">
                                        <span className="text-slate-300">{t12(language, 'Housing Bore Diameter (D):', 'Yuva Çapı (D):')}</span>
                                        <span className="font-mono text-amber-400 font-bold">Ø {suptexBoreDia} mm (H8)</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={suptexShaftDia + 6}
                                        max={suptexShaftDia + 50}
                                        step={1}
                                        value={suptexBoreDia}
                                        onChange={(e) => setSuptexBoreDia(Number(e.target.value))}
                                        className="w-full accent-[var(--cyan)] bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1 text-xs">
                                        <span className="text-slate-300">{t12(language, 'Seal Width (b):', 'Keçe Eni (b):')}</span>
                                        <span className="font-mono text-amber-400 font-bold">{suptexWidth} mm</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={5}
                                        max={15}
                                        step={1}
                                        value={suptexWidth}
                                        onChange={(e) => setSuptexWidth(Number(e.target.value))}
                                        className="w-full accent-[var(--cyan)] bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Operating Speed & Material */}
                        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                                    <Gauge size={15} /> {t12(language, '3. Speed, Material & Pressure', '3. Devir, Malzeme & Basınç')}
                                </h3>
                                <span className="text-[10px] text-slate-500 font-mono">{t12(language, 'Peripheral Velocity Limit', 'Çevresel Hız Limiti')}</span>
                            </div>

                            {/* Material Selector */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">
                                    {t12(language, 'Elastomer Lip Material', 'Elastomer Dudak Malzemesi')}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['NBR', 'FKM', 'PTFE'] as const).map((mat) => (
                                        <button
                                            key={mat}
                                            type="button"
                                            onClick={() => setSuptexMaterial(mat)}
                                            className={`py-2 px-2 rounded-xl text-center font-mono text-xs font-bold transition-all cursor-pointer ${
                                                suptexMaterial === mat
                                                    ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md '
                                                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                                            }`}
                                        >
                                            {mat}
                                            <span className="block text-[9px] font-normal text-slate-400">
                                                ≤ {currentSuptexType.maxSpeedMs[mat]} m/s
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-2">
                                    {currentSuptexMaterial.name} ({currentSuptexMaterial.tempRangeC[0]}°C {t12(language, 'to', 'ila')} {currentSuptexMaterial.tempRangeC[1]}°C)
                                </p>
                            </div>

                            {/* RPM Input */}
                            <div>
                                <div className="flex justify-between items-center mb-1 text-xs">
                                    <span className="text-slate-300">{t12(language, 'Shaft Speed (n):', 'Mil Devri (n):')}</span>
                                    <span className="font-mono text-amber-400 font-bold">{suptexSpeedRpm} {t12(language, 'RPM', 'd/dk (RPM)')}</span>
                                </div>
                                <input
                                    type="range"
                                    min={100}
                                    max={12000}
                                    step={100}
                                    value={suptexSpeedRpm}
                                    onChange={(e) => setSuptexSpeedRpm(Number(e.target.value))}
                                    className="w-full accent-[var(--cyan)] bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* Pressure Input */}
                            <div>
                                <div className="flex justify-between items-center mb-1 text-xs">
                                    <span className="text-slate-300">{t12(language, 'Fluid Pressure:', 'Akışkan Basıncı:')}</span>
                                    <span className="font-mono text-amber-400 font-bold">{suptexPressureBar} bar</span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={12}
                                    step={0.1}
                                    value={suptexPressureBar}
                                    onChange={(e) => setSuptexPressureBar(Number(e.target.value))}
                                    className="w-full accent-[var(--cyan)] bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ORTA: Görüntü (CAD Cross-Section Blueprint) */}
                    <div className="flex-1 min-w-0 min-h-[480px] xl:min-h-0 flex flex-col bg-[var(--bg-0)] border-b xl:border-b-0 xl:border-r border-white/5 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                        {/* SVG Blueprint Section */}
                        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                    Suptex Tip {currentSuptexType.id} (DIN 3760 Form {currentSuptexType.dinForm}) {t12(language, 'Cross Section Detail', 'Kesit Detayı')}
                                </span>
                                <span className="text-xs font-mono text-amber-400 font-bold">
                                    {suptexShaftDia} × {suptexBoreDia} × {suptexWidth} mm
                                </span>
                            </div>
                            <OilSealCrossSectionSVG
                                shaftDia={suptexShaftDia}
                                boreD={suptexBoreDia}
                                widthB={suptexWidth}
                                sealType={currentSuptexType}
                                material={suptexMaterial}
                                speedRpm={suptexSpeedRpm}
                                peripheralSpeed={suptexPeripheralSpeed}
                                maxAllowedSpeed={maxAllowedSpeed}
                                pressureBar={suptexPressureBar}
                                isSpeedSafe={isSuptexSpeedSafe}
                                isPressureSafe={isSuptexPressureSafe}
                                language={language}
                            />
                        </div>

                        {/* Suptex Official Shaft Machining & Grinding Specs */}
                        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-3">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <ShieldCheck size={16} className="text-amber-400" />
                                {t12(language, 'Suptex DIN 3760 Shaft Machining & Hardness Standards', 'Suptex Standartlarına Göre Mil Taşlama ve Yüzey Şartları')}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                                    <span className="text-amber-400 font-bold block">
                                        {t12(language, 'Surface Roughness (Ra & Rz)', 'Yüzey Pürüzlülüğü (Ra & Rz)')}
                                    </span>
                                    <p className="text-slate-300">
                                        Ra = 0.20 {t12(language, 'to', 'ila')} 0.60 μm | Rz = 1.0 {t12(language, 'to', 'ila')} 4.0 μm.
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        {t12(
                                            language,
                                            'Overly smooth surfaces (Ra < 0.1 μm) prevent oil film retention.',
                                            'Daha pürüzsüz yüzey (Ra < 0.1 μm) yağ filminin tutunmasını engeller.'
                                        )}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                                    <span className="text-amber-400 font-bold block">
                                        {t12(language, 'Plunge Grinding (Zero Lead)', 'İz-siz Taşlama (Drallfrei Plunge)')}
                                    </span>
                                    <p className="text-slate-300">
                                        {t12(
                                            language,
                                            'Grinding lead angle must be 0°; plunge grinding without axial feed.',
                                            'Taşlama helis açısı 0° olmalı, dalma taşlama (plunge) uygulanmalıdır.'
                                        )}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        {t12(
                                            language,
                                            'Helical marks create a micro-pump effect causing leakage.',
                                            'Helisel taşlama izi döner milde mikro-pompa etkisi yaparak sızıntıya yol açar.'
                                        )}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                                    <span className="text-amber-400 font-bold block">
                                        {t12(language, 'Shaft Hardness', 'Mil Sertliği')}
                                    </span>
                                    <p className="text-slate-300">
                                        {t12(
                                            language,
                                            'Minimum 45 HRC (induction hardened to ≥ 55 HRC when v > 4 m/s).',
                                            'Minimum 45 HRC (v > 4 m/s veya kirli ortamda indüksiyonla ≥ 55 HRC).'
                                        )}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                                    <span className="text-amber-400 font-bold block">
                                        {t12(language, 'Shaft Tolerance & Runout', 'Mil Toleransı & Eşmerkezlilik')}
                                    </span>
                                    <p className="text-slate-300">
                                        {t12(
                                            language,
                                            'Shaft tolerance ISO h11, housing bore ISO H8. Dynamic TIR ≤ 0.15 mm.',
                                            'Mil toleransı ISO h11, yuva deliği ISO H8. Dinamik salgı (TIR) ≤ 0.15 mm.'
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SAĞ: Çıktılar & KPIs */}
                    <div className="w-full lg:w-[380px] shrink-0 flex flex-col bg-[var(--bg-1)]/90 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                        {/* Manufacturer Header Banner */}
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-[var(--cyan-glow)] text-[var(--cyan)] flex items-center justify-center shrink-0">
                                    <Award size={18} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                                        {t12(language, 'Suptex Seals Integration', 'Suptex Keçe Entegrasyonu')}
                                    </h4>
                                    <p className="text-[10px] text-slate-300 mt-0.5 font-mono">
                                        DIN 3760 · ISO 6194
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={copySuptexOrderCode}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                                title={t12(language, 'Copy Order Code', 'Sipariş Kodunu Kopyala')}
                            >
                                {copiedSuptexCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                <span>{copiedSuptexCode ? t12(language, 'Copied', 'Kopyalandı') : t12(language, 'Order Code', 'Sipariş')}</span>
                            </button>
                        </div>

                        {/* Speed & Status Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                                    {t12(language, 'Peripheral Speed (v)', 'Çevresel Hız (v)')}
                                </span>
                                <div className={`text-xl font-mono font-black ${isSuptexSpeedSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {formatEngineeringValue(suptexPeripheralSpeed, precision, false)} <span className="text-xs font-normal text-slate-400">m/s</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    {t12(language, 'Limit', 'Limit')}: ≤ {maxAllowedSpeed} m/s
                                </p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                                    {t12(language, 'Housing Bore (D)', 'Yuva Çapı (D)')}
                                </span>
                                <div className="text-xl font-mono font-black text-amber-400">
                                    Ø {suptexBoreDia} <span className="text-xs font-normal text-slate-400">H8</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    {t12(language, 'Housing Bore', 'Gövde Delik Çapı')}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                                    {t12(language, 'Pressure Safety', 'Basınç Emniyeti')}
                                </span>
                                <div className={`text-xl font-mono font-black ${isSuptexPressureSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {suptexPressureBar} <span className="text-xs font-normal text-slate-400">bar</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    {t12(language, 'Max', 'Maks')}: {currentSuptexType.maxPressureBar} bar
                                </p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                                    {t12(language, 'Lead-in Chamfer (l₁)', 'Giriş Pahı (l₁)')}
                                </span>
                                <div className="text-xl font-mono font-black text-white">
                                    {suptexShaftDia <= 30 ? '3.0' : suptexShaftDia <= 70 ? '4.0' : '5.0'} <span className="text-xs font-normal text-slate-400">mm</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    15° - 20° {t12(language, 'Chamfer', 'Pah')}
                                </p>
                            </div>
                        </div>

                        {/* Order Code Detail Card */}
                        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                                {t12(language, 'Suptex Order Reference', 'Suptex Sipariş Referansı')}
                            </span>
                            <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-amber-300 select-all break-all border border-slate-800/80">
                                {suptexTypeId} - {suptexShaftDia}x{suptexBoreDia}x{suptexWidth} {suptexMaterial}
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                {currentSuptexType.name} · {currentSuptexMaterial.name} ({currentSuptexMaterial.tempRangeC[0]}°C ila {currentSuptexMaterial.tempRangeC[1]}°C)
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {activeHubTab === 'hydraulic-seal' && (
                /* ========================================================================= */
                /* TAB 3: KASTAŞ & POLİLAS HİDROLİK BOĞAZ, PİSTON & TOZ KEÇELERİ (3-COLUMN)  */
                /* ========================================================================= */
                <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
                    {/* SOL: Girdiler */}
                    <div className="w-full xl:w-[380px] 2xl:w-[420px] shrink-0 space-y-4">
                        {renderModuleHeader(t12(language, 'Kastaş Hydraulic Seals', 'Kastaş Hidrolik Keçeler'), ['ISO 7425-1', 'ISO 7425-2', 'ISO 6195'])}

                        {/* Application Category Selector */}
                        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                    <Compass size={15} /> {t12(language, '1. Sealing Element Category', '1. Sızdırmazlık Elemanı Kategorisi')}
                                </h3>
                                <span className="text-[10px] text-slate-400 font-mono">Kastaş {t12(language, 'Hydraulics', 'Hidrolik')}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setHydraulicCategory('rod');
                                        setKastasSeriesId('K35');
                                    }}
                                    className={`py-2 px-2 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        hydraulicCategory === 'rod'
                                            ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md '
                                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    {t12(language, 'Rod Seal', 'Boğaz Keçesi (Rod)')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setHydraulicCategory('piston');
                                        setKastasSeriesId('K40');
                                    }}
                                    className={`py-2 px-2 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        hydraulicCategory === 'piston'
                                            ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md '
                                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    {t12(language, 'Piston Seal', 'Piston Keçesi')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setHydraulicCategory('wiper');
                                        setKastasSeriesId('K01');
                                    }}
                                    className={`py-2 px-2 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        hydraulicCategory === 'wiper'
                                            ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md '
                                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    {t12(language, 'Wiper', 'Toz Keçesi')}
                                </button>
                            </div>

                            {/* Series Selector */}
                            <div className="pt-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                                    {t12(language, 'Select Kastaş Series Profile', 'Kastaş Profil Serisi Seçimi')}
                                </label>
                                <div className="space-y-2">
                                    {filteredKastasSeries.map((s) => (
                                        <button
                                            key={s.code}
                                            type="button"
                                            onClick={() => setKastasSeriesId(s.code)}
                                            className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                activeKastasSeries.code === s.code
                                                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md '
                                                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-white">{s.name}</span>
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-indigo-300">
                                                    ≤ {s.maxPressureBar} bar
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{s.features}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Standard Metric Sizes Selector */}
                        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                    <Sliders size={15} /> {t12(language, '2. Standard Diameter & ISO Groove Size', '2. Standart Çap & ISO Yuva Ölçüsü')}
                                </h3>
                                <span className="text-[10px] text-slate-500 font-mono">
                                    {hydraulicCategory === 'piston' ? 'ISO 7425-1' : 'ISO 7425-2'}
                                </span>
                            </div>

                            {hydraulicCategory === 'rod' || hydraulicCategory === 'wiper' ? (
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                                        {t12(language, 'Standard Rod / Shaft Diameter (d)', 'Standart Mil / Rot Çapı (d)')}
                                    </label>
                                    <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto pr-1">
                                        {KASTAS_STANDARD_ROD_SIZES.map((r) => (
                                            <button
                                                key={r.d}
                                                type="button"
                                                onClick={() => setSelectedRodDia(r.d)}
                                                className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                                                    selectedRodDia === r.d
                                                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md '
                                                        : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                                                }`}
                                            >
                                                Ø {r.d} mm
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-3">
                                        <input
                                            type="range"
                                            min={16}
                                            max={160}
                                            value={selectedRodDia}
                                            onChange={(e) => setSelectedRodDia(Number(e.target.value))}
                                            className="w-full accent-[var(--cyan)] bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                                        {t12(language, 'Standard Cylinder Bore Diameter (D)', 'Standart Silindir Boru Çapı (D)')}
                                    </label>
                                    <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto pr-1">
                                        {KASTAS_STANDARD_PISTON_SIZES.map((p) => (
                                            <button
                                                key={p.D}
                                                type="button"
                                                onClick={() => setSelectedPistonBoreDia(p.D)}
                                                className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                                                    selectedPistonBoreDia === p.D
                                                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md '
                                                        : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                                                }`}
                                            >
                                                Ø {p.D} mm
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-3">
                                        <input
                                            type="range"
                                            min={25}
                                            max={250}
                                            value={selectedPistonBoreDia}
                                            onChange={(e) => setSelectedPistonBoreDia(Number(e.target.value))}
                                            className="w-full accent-[var(--cyan)] bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Operating Pressure & Radial Clearance Input */}
                            <div className="space-y-3 pt-2">
                                <div>
                                    <div className="flex justify-between items-center mb-1 text-xs">
                                        <span className="text-slate-300 font-medium">
                                            {t12(language, 'Operating Hydraulic Pressure:', 'Hidrolik Çalışma Basıncı:')}
                                        </span>
                                        <span className="font-mono text-indigo-400 font-bold">{hydraulicPressureBar} bar</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={10}
                                        max={400}
                                        step={10}
                                        value={hydraulicPressureBar}
                                        onChange={(e) => setHydraulicPressureBar(Number(e.target.value))}
                                        className="w-full accent-[var(--cyan)] bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1 text-xs">
                                        <span className="text-slate-300 font-medium">
                                            {t12(language, 'Design Radial Clearance (e):', 'Tasarım Radyal Boşluğu (e):')}
                                        </span>
                                        <span className="font-mono text-amber-400 font-bold">{formatEngineeringValue(userRadialClearanceMm, precision, false)} mm</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0.05}
                                        max={0.50}
                                        step={0.01}
                                        value={userRadialClearanceMm}
                                        onChange={(e) => setUserRadialClearanceMm(Number(e.target.value))}
                                        className="w-full accent-[var(--cyan)] bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                        {t12(language, 'Max allowable extrusion gap at', 'İzin verilen azami boşluk')}{' '}
                                        {hydraulicPressureBar} bar: ≤ {formatEngineeringValue(maxAllowedExtrusionGap, precision, false)} mm
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ORTA: Görüntü (CAD Cross-Section Blueprint) */}
                    <div className="flex-1 min-w-0 min-h-[480px] xl:min-h-0 flex flex-col bg-[var(--bg-0)] border-b xl:border-b-0 xl:border-r border-white/5 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                        {/* SVG Blueprint Section */}
                        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                    {activeKastasSeries.name} - {t12(language, 'Cross Section & Groove Dimensions', 'Kesit & Kanal Ölçüleri')}
                                </span>
                                <span className="text-xs font-mono text-indigo-400 font-bold">
                                    {hydraulicCategory === 'rod' 
                                        ? `${t12(language, 'Rod', 'Mil')} Ø${activeRodDimension.d} / ${t12(language, 'Groove', 'Kanal')} Ø${formatEngineeringValue(activeRodDimension.D, precision, false)} mm`
                                        : `${t12(language, 'Bore', 'Boru')} Ø${activePistonDimension.D} / ${t12(language, 'Groove', 'Kanal')} Ø${formatEngineeringValue(activePistonDimension.d, precision, false)} mm`}
                                </span>
                            </div>
                            <HydraulicSealCrossSectionSVG
                                category={hydraulicCategory}
                                series={activeKastasSeries}
                                dia={hydraulicCategory === 'piston' ? activePistonDimension.D : activeRodDimension.d}
                                grooveDia={hydraulicCategory === 'piston' ? activePistonDimension.d : activeRodDimension.D}
                                widthL={hydraulicCategory === 'piston' ? activePistonDimension.L : activeRodDimension.L}
                                depthS={hydraulicCategory === 'piston' ? activePistonDimension.S : activeRodDimension.S}
                                chamferC={hydraulicCategory === 'piston' ? activePistonDimension.chamferC : activeRodDimension.chamferC}
                                radiusR1={hydraulicCategory === 'piston' ? activePistonDimension.r1 : activeRodDimension.r1}
                                pressureBar={hydraulicPressureBar}
                                extrusionGap={userRadialClearanceMm}
                                maxAllowedGap={maxAllowedExtrusionGap}
                                isGapSafe={isExtrusionGapSafe}
                                isPressureSafe={isHydraulicPressureSafe}
                                language={language}
                            />
                        </div>

                        {/* Polilas & Kastaş Official Surface Finish Matrix */}
                        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-3">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <ShieldCheck size={16} className="text-indigo-400" />
                                {t12(language, 'Hydraulic Sliding & Groove Surface Specification (ISO 7425)', 'Polilas & Kastaş Hidrolik Kayma ve Kanal Yüzey Şartnamesi')}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                                    <span className="text-indigo-400 font-bold block">
                                        {t12(language, 'Hard Chrome Plated Rod Surface', 'Krom Kaplı Mil (Hard Chrome Plated Rod)')}
                                    </span>
                                    <p className="text-slate-300">
                                        Ra = {POLILAS_SURFACE_REQUIREMENTS.rod.roughnessRa} | Rz {POLILAS_SURFACE_REQUIREMENTS.rod.roughnessRz}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        {t12(language, 'Chrome Plating:', 'Krom Kaplama:')} {POLILAS_SURFACE_REQUIREMENTS.rod.chromePlating} | {t12(language, 'Tolerance:', 'Tolerans:')} {POLILAS_SURFACE_REQUIREMENTS.rod.tolerance}
                                    </p>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                                    <span className="text-indigo-400 font-bold block">
                                        {t12(language, 'Cylinder Bore / Tube Surface', 'Honlanmış Silindir Borusu (Honed Cylinder Tube)')}
                                    </span>
                                    <p className="text-slate-300">
                                        Ra = {POLILAS_SURFACE_REQUIREMENTS.bore.roughnessRa} | Rz {POLILAS_SURFACE_REQUIREMENTS.bore.roughnessRz}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        {t12(language, 'Tolerance:', 'Tolerans:')} {POLILAS_SURFACE_REQUIREMENTS.bore.tolerance} {t12(language, 'Honed Tube', 'Honlanmış Boru')}
                                    </p>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                                    <span className="text-amber-400 font-bold block">
                                        {t12(language, 'Groove Base (Root Diameter)', 'Kanal Tabanı (Groove Root)')}
                                    </span>
                                    <p className="text-slate-300">
                                        Ra = {POLILAS_SURFACE_REQUIREMENTS.grooveBase.roughnessRa} | Rz {POLILAS_SURFACE_REQUIREMENTS.grooveBase.roughnessRz}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        {t12(language, 'Tolerance:', 'Tolerans:')} {POLILAS_SURFACE_REQUIREMENTS.grooveBase.tolerance}
                                    </p>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                                    <span className="text-slate-300 font-bold block">
                                        {t12(language, 'Groove Flanks / Sidewalls', 'Kanal Yan Duvarları (Groove Flanks)')}
                                    </span>
                                    <p className="text-slate-300">
                                        Ra = {POLILAS_SURFACE_REQUIREMENTS.grooveFlanks.roughnessRa} | Rz {POLILAS_SURFACE_REQUIREMENTS.grooveFlanks.roughnessRz}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SAĞ: Çıktılar & KPIs */}
                    <div className="w-full lg:w-[380px] shrink-0 flex flex-col bg-[var(--bg-1)]/90 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                        {/* Manufacturer Header Banner */}
                        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-[var(--cyan-glow)] text-[var(--cyan)] flex items-center justify-center shrink-0">
                                    <Award size={18} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                        {t12(language, 'Kastaş Hydraulic Standards', 'Kastaş Hidrolik Standartları')}
                                    </h4>
                                    <p className="text-[10px] text-slate-300 mt-0.5 font-mono">
                                        ISO 7425 · ISO 6195
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={copyKastasOrderCode}
                                className="px-2.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                                title={t12(language, 'Copy Kastaş Order Code', 'Kastaş Sipariş Kodunu Kopyala')}
                            >
                                {copiedKastasCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                <span>{copiedKastasCode ? t12(language, 'Copied', 'Kopyalandı') : t12(language, 'Order Code', 'Sipariş')}</span>
                            </button>
                        </div>

                        {/* Results Grid (4 KPIs) */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                                    {t12(language, 'Groove Width (L)', 'Kanal Genişliği (L)')}
                                </span>
                                <div className="text-xl font-mono font-black text-indigo-400">
                                    {hydraulicCategory === 'piston' ? activePistonDimension.L : activeRodDimension.L} <span className="text-xs font-normal text-slate-400">mm</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    {t12(language, 'Tolerance: +0.20 mm', 'Tolerans: +0.20 mm')}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                                    {t12(language, 'Groove Depth (S)', 'Kanal Derinliği (S)')}
                                </span>
                                <div className="text-xl font-mono font-black text-white">
                                    {hydraulicCategory === 'piston' ? activePistonDimension.S : activeRodDimension.S} <span className="text-xs font-normal text-slate-400">mm</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    {t12(language, 'Radial Step Dimension', 'Radyal Adım')}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                                    {t12(language, 'Lead-in Chamfer (C)', 'Giriş Pahı Boyu (C)')}
                                </span>
                                <div className="text-xl font-mono font-black text-white">
                                    {hydraulicCategory === 'piston' ? activePistonDimension.chamferC : activeRodDimension.chamferC} <span className="text-xs font-normal text-slate-400">mm</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    15° - 20° {t12(language, 'Chamfer', 'Pah')}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                                    {t12(language, 'Extrusion Safety', 'Akma Emniyeti')}
                                </span>
                                <div className={`text-xl font-mono font-black ${isExtrusionGapSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isExtrusionGapSafe ? t12(language, 'SAFE', 'UYGUN') : t12(language, 'RISK', 'RİSK')}
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    e ≤ {formatEngineeringValue(maxAllowedExtrusionGap, precision, false)} mm
                                </p>
                            </div>
                        </div>

                        {/* Order Code Reference Card */}
                        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                                {t12(language, 'Kastaş Order Code Reference', 'Kastaş Sipariş Kodu Referansı')}
                            </span>
                            <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-indigo-300 select-all break-all border border-slate-800/80">
                                {kastasOrderCode}
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                {activeKastasSeries.name} · {activeKastasSeries.material} ({activeKastasSeries.isoStandard})
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
