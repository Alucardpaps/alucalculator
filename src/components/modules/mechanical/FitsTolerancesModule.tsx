'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    Crosshair,
    Settings2,
    List,
    Gauge,
    CheckCircle2,
    XCircle,
    Flame,
    Snowflake,
    Wrench,
    Copy,
    Check,
    Layers,
    ArrowRight,
    Info,
    ChevronDown,
    ChevronUp,
    Zap
} from 'lucide-react';
import { calculateFit } from '@/lib/engine/iso286';
import {
    calculatePressFit,
    PRESS_FIT_MATERIALS,
    TOLERANCE_PAIR_PRESETS,
    FitTolerancePair,
    AssemblyFrictionType
} from '@/lib/calculations/pressFit';
import { useI18nStore } from '@/store/i18nStore';
import { getFitsModuleStrings } from '@/locales/fitsModuleTranslations';
import { t12 } from '@/locales/t12';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

const PRESET_FITS = {
    Clearance: [
        { id: 'H11/c11', desc: 'Loose Running' },
        { id: 'H9/d9', desc: 'Free Running' },
        { id: 'H8/f7', desc: 'Normal Running' },
        { id: 'H7/g6', desc: 'Sliding Fit' },
        { id: 'H7/h6', desc: 'Locational Clearance' }
    ],
    Transition: [
        { id: 'H7/k6', desc: 'Locational Transition' },
        { id: 'H7/n6', desc: 'Locational Interference' }
    ],
    Interference: [
        { id: 'H7/p6', desc: 'Light Press' },
        { id: 'H7/s6', desc: 'Medium Press' },
        { id: 'H7/u6', desc: 'Heavy Press' }
    ]
};

const HOLE_CLASSES = ['A','B','C','D','E','F','G','H','J','JS','K','M','N','P','R','S','T','U','V','X','Y','Z'];
const SHAFT_CLASSES = ['a','b','c','d','e','f','g','h','j','js','k','m','n','p','r','s','t','u','v','x','y','z'];
const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

function getTolerancePairLabel(pairKey: string, desc: string, lang: string): string {
    const pairTranslations: Record<string, { en: string; tr: string }> = {
        'H7/p6': { en: 'Light Press Fit (demountable, low torque)', tr: 'Hafif Sıkı / Geçiş (düşük tork, sökülebilir)' },
        'H7/r6': { en: 'Medium Press Fit (bushings, gear hubs)', tr: 'Orta Sıkı Geçme (burçlar, dişli çark göbekleri)' },
        'H7/s6': { en: 'Heavy Press Fit (high torque, keyless drive)', tr: 'Kuvvetli Pres Geçme (yüksek tork, kamasız)' },
        'H7/u6': { en: 'Heavy Shrink Fit (heavy machinery, train wheels)', tr: 'Ağır Sıkı / Sıcak Geçme (ağır sanayi)' },
        'H7/x6': { en: 'Extreme Shrink Fit (extreme torque, thermal assembly)', tr: 'Çok Ağır Büzme Geçme (ekstrem tork)' },
    };
    const trObj = pairTranslations[pairKey];
    return trObj ? `${pairKey} - ${t12(lang, trObj.en, trObj.tr)}` : `${pairKey} - ${desc}`;
}

function getPressFitMaterialLabel(id: string, fallback: string, lang: string): string {
    const matTranslations: Record<string, { en: string; tr: string }> = {
        'steel': { en: 'Carbon Steel 1045 (E=210 GPa, Sy=355 MPa)', tr: 'İmalat Çeliği (E=210 GPa, Sy=355 MPa)' },
        'alloy-steel': { en: 'Alloy Steel 4140 (E=210 GPa, Sy=650 MPa)', tr: 'Islah / Alaşımlı Çelik (E=210 GPa, Sy=650 MPa)' },
        'cast-iron': { en: 'Cast Iron GG-25 (E=110 GPa, Sy=200 MPa)', tr: 'Pik Döküm GG-25 (E=110 GPa, Sy=200 MPa)' },
        'bronze': { en: 'Bronze CuSn8 / RG7 (E=105 GPa, Sy=250 MPa)', tr: 'Bronz CuSn8 / RG7 (E=105 GPa, Sy=250 MPa)' },
        'aluminum': { en: 'Aluminum 6061-T6 (E=70 GPa, Sy=275 MPa)', tr: 'Alüminyum 6061-T6 (E=70 GPa, Sy=275 MPa)' },
    };
    const trObj = matTranslations[id];
    return trObj ? t12(lang, trObj.en, trObj.tr) : fallback;
}

interface FitsTolerancesModuleProps {
    lang?: string;
    dict?: any;
    initialTab?: 'fits' | 'press-fit';
    initialPreset?: string;
}

export default function FitsTolerancesModule({ initialTab = 'fits', initialPreset = 'H7/h6' }: FitsTolerancesModuleProps) {
  const precision = useGlobalPrecision();
    const { language } = useI18nStore();
    const ftStrings = getFitsModuleStrings(language) as any;

    const [mainTab, setMainTab] = useState<'fits' | 'press-fit'>(initialTab);

    useEffect(() => {
        if (initialTab) {
            setMainTab(initialTab);
        }
    }, [initialTab]);

    // =========================================================================
    // TAB 1: ISO 286 FITS STATE
    // =========================================================================
    const [nominalDia, setNominalDia] = useState<number>(50);
    const [mode, setMode] = useState<'preset' | 'advanced'>('preset');
    const [selectedPreset, setSelectedPreset] = useState<string>(initialPreset);
    const [holeClass, setHoleClass] = useState<string>('H');
    const [holeGrade, setHoleGrade] = useState<number>(7);
    const [shaftClass, setShaftClass] = useState<string>('h');
    const [shaftGrade, setShaftGrade] = useState<number>(6);

    const fitResults = useMemo(() => {
        let hc = holeClass;
        let hg = holeGrade;
        let sc = shaftClass;
        let sg = shaftGrade;

        if (mode === 'preset') {
            const match = selectedPreset.match(/([A-Z]+)(\d+)\/([a-z]+)(\d+)/);
            if (match) {
                hc = match[1];
                hg = parseInt(match[2]);
                sc = match[3];
                sg = parseInt(match[4]);
            }
        }

        const res = calculateFit(nominalDia, hc, hg, sc, sg);
        return {
            ...res,
            nominalDia,
            holeStr: `${hc}${hg}`,
            shaftStr: `${sc}${sg}`
        };
    }, [nominalDia, mode, selectedPreset, holeClass, holeGrade, shaftClass, shaftGrade]);

    const [fitsCopied, setFitsCopied] = useState<boolean>(false);

    const copyFitsSummary = () => {
        const fitPair = mode === 'preset' ? selectedPreset : `${holeClass}${holeGrade}/${shaftClass}${shaftGrade}`;
        const text = `=== ${t12(language, 'ISO 286 FITS & TOLERANCES INSPECTION REPORT', 'ISO 286 TOLERANS VE GEÇME MUAYENE RAPORU')} ===
${t12(language, 'Nominal Diameter', 'Nominal Çap')}: Ø${nominalDia} mm
${t12(language, 'Fit Pair', 'Geçme Çifti')}: ${fitPair} (${fitResults.fitType === 'Clearance' ? t12(language, 'Clearance Fit', 'Boşluklu Geçme') : fitResults.fitType === 'Interference' ? t12(language, 'Interference Fit', 'Sıkı Geçme') : t12(language, 'Transition Fit', 'Geçiş (Belirsiz) Geçme')})
${t12(language, 'Hole', 'Delik')} (${fitResults.holeStr}): Max = ${fitResults.holeMax.toFixed(3)} mm, Min = ${fitResults.holeMin.toFixed(3)} mm (ES: ${fitResults.holeES > 0 ? '+' : ''}${fitResults.holeES} μm, EI: ${fitResults.holeEI > 0 ? '+' : ''}${fitResults.holeEI} μm)
${t12(language, 'Shaft', 'Mil')} (${fitResults.shaftStr}): Max = ${fitResults.shaftMax.toFixed(3)} mm, Min = ${fitResults.shaftMin.toFixed(3)} mm (es: ${fitResults.shaft_es > 0 ? '+' : ''}${fitResults.shaft_es} μm, ei: ${fitResults.shaft_ei > 0 ? '+' : ''}${fitResults.shaft_ei} μm)
${t12(language, 'Clearance / Interference Limits', 'Boşluk / Sıkılık Limitleri')}:
  ${t12(language, 'Max Clearance', 'Maksimum Boşluk')}: ${fitResults.maxClearanceUm} μm (${(fitResults.maxClearance).toFixed(3)} mm)
  ${t12(language, 'Min Clearance', 'Minimum Boşluk')}: ${fitResults.minClearanceUm} μm (${(fitResults.minClearance).toFixed(3)} mm)
${t12(language, 'Standards', 'Standartlar')}: ISO 286-1:2010 · ISO 286-2 · DIN 7154 · DIN 7155`;
        navigator.clipboard.writeText(text);
        setFitsCopied(true);
        setTimeout(() => setFitsCopied(false), 2000);
    };

    // =========================================================================
    // TAB 2: DIN 7190 PRESS FIT STATE
    // =========================================================================
    const [pfContactDia, setPfContactDia] = useState<number>(50);
    const [pfHubOuterDia, setPfHubOuterDia] = useState<number>(100);
    const [pfIsHollowShaft, setPfIsHollowShaft] = useState<boolean>(false);
    const [pfShaftInnerDia, setPfShaftInnerDia] = useState<number>(0);
    const [pfContactLength, setPfContactLength] = useState<number>(60);

    const [pfTolerancePair, setPfTolerancePair] = useState<FitTolerancePair>('H7/s6');
    const [pfCustomInterferenceUm, setPfCustomInterferenceUm] = useState<number>(45);
    /** U_max of a custom range (set when a fit is transferred from the ISO 286 tab); null = single value */
    const [pfCustomInterferenceMaxUm, setPfCustomInterferenceMaxUm] = useState<number | null>(null);

    const [pfHubMaterialId, setPfHubMaterialId] = useState<string>('steel');
    const [pfShaftMaterialId, setPfShaftMaterialId] = useState<string>('steel');
    const [pfAssemblyMethod, setPfAssemblyMethod] = useState<AssemblyFrictionType>('thermal_shrink');

    const [pfOperatingTorque, setPfOperatingTorque] = useState<number>(450);
    const [pfOperatingAxialForce, setPfOperatingAxialForce] = useState<number>(0);
    const [pfCopied, setPfCopied] = useState<boolean>(false);
    const [pfViewMode, setPfViewMode] = useState<'both' | 'longitudinal' | 'radial'>('both');

    // Transfer from ISO 286 to DIN 7190
    const transferFitToPressFit = () => {
        setPfContactDia(nominalDia);
        setPfHubOuterDia(Math.max(Math.round(nominalDia * 2), nominalDia + 10));
        setPfContactLength(Math.round(nominalDia * 1.2));
        if (fitResults.fitType === 'Interference' || fitResults.minClearance < 0) {
            // keep the full ISO 286 range: U_min drives capacity, U_max drives stress & heating (DIN 7190-1)
            const minUm = Math.max(0, -fitResults.maxClearance * 1000);
            const maxUm = Math.max(0, -fitResults.minClearance * 1000);
            setPfTolerancePair('custom');
            setPfCustomInterferenceUm(Math.round(minUm * 10) / 10);
            setPfCustomInterferenceMaxUm(Math.round(maxUm * 10) / 10);
        }
        setMainTab('press-fit');
    };

    const pressFitResults = useMemo(() => {
        return calculatePressFit({
            contactDiameter: pfContactDia,
            contactLength: pfContactLength,
            hubOuterDiameter: pfHubOuterDia,
            shaftInnerDiameter: pfIsHollowShaft ? pfShaftInnerDia : 0,
            tolerancePair: pfTolerancePair,
            customInterferenceUm: pfCustomInterferenceUm,
            customInterferenceMaxUm: pfCustomInterferenceMaxUm ?? undefined,
            hubMaterialId: pfHubMaterialId,
            shaftMaterialId: pfShaftMaterialId,
            assemblyMethod: pfAssemblyMethod,
            operatingTorque: pfOperatingTorque,
            operatingAxialForce: pfOperatingAxialForce
        });
    }, [
        pfContactDia, pfContactLength, pfHubOuterDia, pfIsHollowShaft, pfShaftInnerDia,
        pfTolerancePair, pfCustomInterferenceUm, pfCustomInterferenceMaxUm, pfHubMaterialId, pfShaftMaterialId,
        pfAssemblyMethod, pfOperatingTorque, pfOperatingAxialForce
    ]);

    const pfHubMat = PRESS_FIT_MATERIALS[pfHubMaterialId] || PRESS_FIT_MATERIALS.steel;

    const copyPfSummary = () => {
        const text = `=== DIN 7190 SIKI GEÇME RAPORU ===
Çap: Ø${pfContactDia} mm | Göbek Dış: Ø${pfHubOuterDia} mm | Boy: ${pfContactLength} mm
Geçme Toleransı: ${pfTolerancePair} | U_min…U_max: ${formatEngineeringValue(pressFitResults.interferenceMinUm, precision, false)}…${formatEngineeringValue(pressFitResults.interferenceMaxUm, precision, false)} μm (${pressFitResults.interferenceSource}) | ΔU: ${formatEngineeringValue(pressFitResults.smoothingUm, precision, false)} μm
Temas Basıncı p_min / p_max: ${formatEngineeringValue(pressFitResults.contactPressure, precision, false)} / ${formatEngineeringValue(pressFitResults.contactPressureMax, precision, false)} MPa
İletilebilir Tork: ${formatEngineeringValue(pressFitResults.transmissibleTorque, precision, false)} N·m (Emniyet: ${formatEngineeringValue(pressFitResults.torqueSafetyFactor, precision, false)})
Presleme Kuvveti: ${formatEngineeringValue(pressFitResults.assemblyPressForce, precision, false)} kN (~${formatEngineeringValue((pressFitResults.assemblyPressForce / 9.81), precision, false)} Ton)
Göbek σ_v (p_max): ${formatEngineeringValue(pressFitResults.hubVonMisesStress, precision, false)} MPa / ${pfHubMat.yieldStrength} MPa (p_gA/p_max: ${formatEngineeringValue(pressFitResults.hubSafetyFactor, precision, false)})
Gereken Isıtma: +${pressFitResults.requiredTempDiffHub} °C -> Fırın: ${pressFitResults.hubTargetHeatingTemp} °C`;
        navigator.clipboard.writeText(text);
        setPfCopied(true);
        setTimeout(() => setPfCopied(false), 2000);
    };

    const isPressFitSafe = pressFitResults.isHubSafe && pressFitResults.torqueSafetyFactor >= 1.0;

    const renderFitsHeader = (tab: 'fits' | 'press-fit') => (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)] shrink-0">
                    <Crosshair size={22} />
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="text-sm font-bold text-white tracking-wide flex items-center gap-2 flex-wrap">
                        <span>{tab === 'fits' ? t12(language, 'ISO 286 Fits & Limits', 'ISO 286 Toleranslar & Geçmeler') : t12(language, 'DIN 7190 Press Fit', 'DIN 7190 Pres & Sıkı Geçme')}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-semibold">
                            {tab === 'fits' ? 'ISO 286' : 'DIN 7190-1'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-semibold">
                            DIN 7154
                        </span>
                    </h1>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {tab === 'fits' ? t12(language, 'Hole-Shaft Tolerance Calculation', 'Delik-Mil Tolerans & Boşluk/Sıkılık Kokpiti') : t12(language, 'Interference Fit & Contact Pressure', 'Pres & Sıcak Geçme Mukavemet Kokpiti')}
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 text-xs font-semibold">
                <button
                    type="button"
                    onClick={() => setMainTab('fits')}
                    className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer truncate ${
                        mainTab === 'fits'
                            ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold shadow-md '
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                >
                    {t12(language, 'ISO 286 Fits', 'ISO 286 Tolerans')}
                </button>
                <button
                    type="button"
                    onClick={() => setMainTab('press-fit')}
                    className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer truncate ${
                        mainTab === 'press-fit'
                            ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold shadow-md '
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                >
                    {t12(language, 'DIN 7190 Press Fit', 'DIN 7190 Sıkı Geçme')}
                </button>
            </div>
        </div>
    );

    return (
        <div className="w-full h-screen bg-[var(--bg-0)] text-slate-100 flex flex-col font-sans overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 w-full min-h-0 flex flex-col overflow-hidden">
                {mainTab === 'fits' ? (
                    /* ========================================================================= */
                    /* TAB 1: ISO 286 TOLERANCES & FITS                                          */
                    /* ========================================================================= */
                    <div className="flex-1 w-full flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden">
                        {/* ═══ SOL: GİRDİLER (Inputs & Controls) ═══ */}
                        <div className="w-full lg:w-[320px] xl:w-[340px] shrink-0 flex flex-col bg-[var(--bg-1)]/90 border-b lg:border-b-0 lg:border-r border-white/5 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                            {renderFitsHeader('fits')}
                            {/* Mode & Nominal Diameter Card */}
                            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                                         {t12(language, 'Nominal Diameter (d):', 'Nominal Çap (d):')}
                                    </label>
                                    <div className="flex items-center gap-2.5">
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                min={1}
                                                max={500}
                                                value={nominalDia}
                                                onChange={(e) => setNominalDia(Math.max(1, Number(e.target.value)))}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-base font-bold focus:outline-none focus:border-blue-500 pr-10"
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400 pointer-events-none">mm</span>
                                        </div>
                                        <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">(1 – 500 mm)</span>
                                    </div>
                                </div>

                                {/* Preset vs Manual Selector */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                            {t12(language, 'Fit Selection Mode:', 'Geçme Tipi Seçimi:')}
                                        </label>
                                        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                                            <button
                                                onClick={() => setMode('preset')}
                                                className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                                                    mode === 'preset' ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                <List size={13} /> {t12(language, 'Standard Fits', 'Standart')}
                                            </button>
                                            <button
                                                onClick={() => setMode('advanced')}
                                                className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                                                    mode === 'advanced' ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                <Settings2 size={13} /> {t12(language, 'Manual (ISO)', 'Manuel (ISO)')}
                                            </button>
                                        </div>
                                    </div>

                                    {mode === 'preset' ? (
                                        <div className="space-y-2">
                                            {Object.entries(PRESET_FITS).map(([category, fits]) => (
                                                <div key={category} className="space-y-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                                        {category === 'Clearance' ? t12(language, 'Clearance Fits', 'Boşluklu Geçmeler') : category === 'Transition' ? t12(language, 'Transition Fits', 'Belirsiz (Geçiş) Geçmeler') : t12(language, 'Interference Fits', 'Sıkı Geçmeler')}
                                                    </span>
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        {fits.map((fit) => (
                                                            <button
                                                                key={fit.id}
                                                                onClick={() => setSelectedPreset(fit.id)}
                                                                className={`px-3 py-2 rounded-xl text-left border transition-all cursor-pointer ${
                                                                    selectedPreset === fit.id
                                                                        ? category === 'Interference'
                                                                            ? 'bg-rose-500/20 border-rose-500/60 text-white'
                                                                            : category === 'Transition'
                                                                            ? 'bg-amber-500/20 border-amber-500/60 text-white'
                                                                            : 'bg-emerald-500/20 border-emerald-500/60 text-white'
                                                                        : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                                                                }`}
                                                            >
                                                                <div className="font-mono text-xs font-bold">{fit.id}</div>
                                                                <div className="text-[10px] text-slate-400 truncate">{fit.desc}</div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[11px] font-bold text-emerald-400 block mb-1">{t12(language, 'Hole Class', 'Delik Sınıfı')}</label>
                                                    <select
                                                        value={holeClass}
                                                        onChange={(e) => setHoleClass(e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                                                    >
                                                        {HOLE_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-bold text-emerald-400 block mb-1">{t12(language, 'Hole IT Grade', 'Delik Kalitesi (IT)')}</label>
                                                    <select
                                                        value={holeGrade}
                                                        onChange={(e) => setHoleGrade(Number(e.target.value))}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                                                    >
                                                        {GRADES.map((g) => <option key={g} value={g}>IT{g}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                                                <div>
                                                    <label className="text-[11px] font-bold text-amber-400 block mb-1">{t12(language, 'Shaft Class', 'Mil Sınıfı')}</label>
                                                    <select
                                                        value={shaftClass}
                                                        onChange={(e) => setShaftClass(e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                                                    >
                                                        {SHAFT_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-bold text-amber-400 block mb-1">{t12(language, 'Shaft IT Grade', 'Mil Kalitesi (IT)')}</label>
                                                    <select
                                                        value={shaftGrade}
                                                        onChange={(e) => setShaftGrade(Number(e.target.value))}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                                                    >
                                                        {GRADES.map((g) => <option key={g} value={g}>IT{g}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Direct Action Link to Press Fit */}
                            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-3">
                                <div>
                                    <span className="text-xs font-bold text-indigo-300 block">
                                        {t12(language, 'Need Strength or Torque Calculation?', 'Mukavemet veya Tork Hesabı mı Lazım?')}
                                    </span>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        {t12(language, 'Transfer this tolerance to DIN 7190 Press/Shrink Fit.', 'Bu toleransı DIN 7190 Pres/Sıcak Geçme modülüne aktarın.')}
                                    </p>
                                </div>
                                <button
                                    onClick={transferFitToPressFit}
                                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-lg transition-all cursor-pointer"
                                >
                                    {t12(language, 'Transfer to Analysis', 'Analize Aktar')}
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>

                        {/* ═══ ORTA: GÖRÜNTÜ (Tolerance Zones Diagram & Micro Loupe) ═══ */}
                        <div className="flex-1 min-w-0 min-h-[500px] lg:min-h-0 flex flex-col gap-4 bg-[var(--bg-0)] border-b lg:border-b-0 lg:border-r border-white/5 p-4 overflow-y-auto custom-scrollbar">
                            {/* 1. ISO 286 Zero Line Tolerance Zones Card */}
                            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                                            {t12(language, 'Tolerance Zones & Zero Line', 'Tolerans Alanları & Sıfır Çizgisi')}
                                        </span>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                                            ISO 286-1:2010
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <button
                                            type="button"
                                            onClick={copyFitsSummary}
                                            className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                                            title={t12(language, 'Copy ISO 286 Inspection Report', 'ISO 286 Muayene Raporunu Kopyala')}
                                        >
                                            {fitsCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} className="text-cyan-400" />}
                                            <span className="text-[11px]">{fitsCopied ? t12(language, 'Copied!', 'Kopyalandı!') : t12(language, 'Copy Report', 'Raporu Kopyala')}</span>
                                        </button>
                                        <div className="flex items-center gap-4 text-xs font-mono">
                                            <span className="flex items-center gap-1.5 text-emerald-400">
                                                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> {t12(language, 'Hole', 'Delik')} ({fitResults.holeStr})
                                            </span>
                                            <span className="flex items-center gap-1.5 text-amber-400">
                                                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> {t12(language, 'Shaft', 'Mil')} ({fitResults.shaftStr})
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ToleranceZoneDiagram fitResults={fitResults} language={language} />
                            </div>

                            {fitResults.warnings && fitResults.warnings.length > 0 && (
                                <div role="alert" className="rounded-[var(--radius-m)] border border-[var(--warn)] bg-[var(--warn-soft)] px-3 py-2 text-xs text-[var(--ink)]">
                                    <span className="font-semibold text-[var(--warn)]">{t12(language, 'Not defined by ISO 286', 'ISO 286 tarafından tanımlı değil')}: </span>
                                    {fitResults.warnings.join(' · ')}
                                </div>
                            )}

                            {/* 2. 4-KPI Metric Readout Cards */}
                            <div className="grid grid-cols-2 gap-2.5">
                                {/* KPI 1: Fit Classification */}
                                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-md flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        {t12(language, 'Fit Type', 'Geçme Türü')}
                                    </span>
                                    <div className="mt-1">
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-black uppercase ${
                                                fitResults.fitType === 'Clearance'
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                                    : fitResults.fitType === 'Interference'
                                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                            }`}
                                        >
                                            {fitResults.fitType === 'Clearance'
                                                ? t12(language, 'Clearance', 'Boşluklu')
                                                : fitResults.fitType === 'Interference'
                                                ? t12(language, 'Interference', 'Sıkı')
                                                : t12(language, 'Transition', 'Geçiş')}
                                        </span>
                                        <span className="text-[10px] text-slate-400 block mt-1 truncate">
                                            {fitResults.fitType === 'Clearance'
                                                ? t12(language, 'Free Sliding/Rotation', 'Döner/Kayar Temas')
                                                : fitResults.fitType === 'Interference'
                                                ? t12(language, 'Friction Press Fit', 'Sürtünmeli Pres')
                                                : t12(language, 'Locational Snug Fit', 'Hassas Geçiş')}
                                        </span>
                                    </div>
                                </div>

                                {/* KPI 2: Effective Clearance / Interference */}
                                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-md flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        {fitResults.fitType === 'Interference'
                                            ? t12(language, 'Interference (I)', 'Sıkılık (I)')
                                            : t12(language, 'Clearance (C)', 'Boşluk (C)')}
                                    </span>
                                    <div className="mt-1">
                                        <div className="text-sm md:text-base font-black font-mono text-cyan-400">
                                            {fitResults.fitType === 'Interference'
                                                ? `${Math.abs(fitResults.maxClearanceUm)} ~ ${Math.abs(fitResults.minClearanceUm)}`
                                                : fitResults.fitType === 'Clearance'
                                                ? `${Math.max(0, fitResults.minClearanceUm)} ~ ${Math.max(0, fitResults.maxClearanceUm)}`
                                                : `${fitResults.minClearanceUm} ~ ${fitResults.maxClearanceUm}`}
                                            <span className="text-[10px] text-slate-400 font-normal ml-1">μm</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5 truncate">
                                            {fitResults.fitType === 'Interference'
                                                ? `${formatEngineeringValue((Math.abs(fitResults.maxClearance)), precision, false)} ~ ${formatEngineeringValue((Math.abs(fitResults.minClearance)), precision, false)} mm`
                                                : `${formatEngineeringValue(fitResults.minClearance, precision, false)} ~ ${formatEngineeringValue(fitResults.maxClearance, precision, false)} mm`}
                                        </span>
                                    </div>
                                </div>

                                {/* KPI 3: Hole Tolerance Band */}
                                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-md flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                                        {t12(language, 'Hole Tol. (TH)', 'Delik Tol. (TH)')}
                                    </span>
                                    <div className="mt-1">
                                        <div className="text-sm md:text-base font-black font-mono text-emerald-400">
                                            {formatEngineeringValue((fitResults.holeES - fitResults.holeEI), precision, false)}
                                            <span className="text-[10px] text-slate-400 font-normal ml-1">μm</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5 truncate">
                                            ES:{fitResults.holeES >= 0 ? '+' : ''}{formatEngineeringValue(fitResults.holeES, precision, false)} / EI:{fitResults.holeEI >= 0 ? '+' : ''}{formatEngineeringValue(fitResults.holeEI, precision, false)}
                                        </span>
                                    </div>
                                </div>

                                {/* KPI 4: Shaft Tolerance Band */}
                                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-md flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                                        {t12(language, 'Shaft Tol. (Ts)', 'Mil Tol. (Ts)')}
                                    </span>
                                    <div className="mt-1">
                                        <div className="text-sm md:text-base font-black font-mono text-amber-400">
                                            {formatEngineeringValue((fitResults.shaft_es - fitResults.shaft_ei), precision, false)}
                                            <span className="text-[10px] text-slate-400 font-normal ml-1">μm</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5 truncate">
                                            es:{fitResults.shaft_es >= 0 ? '+' : ''}{formatEngineeringValue(fitResults.shaft_es, precision, false)} / ei:{fitResults.shaft_ei >= 0 ? '+' : ''}{formatEngineeringValue(fitResults.shaft_ei, precision, false)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Mated Assembly & 1000× Loupe Visualizer */}
                            <FitMatedCrossSectionSVG
                                fitResults={fitResults}
                                nominalDia={nominalDia}
                                language={language}
                            />
                        </div>

                        {/* ═══ SAĞ: ÇIKTILAR (Outputs, KPIs & Limits) ═══ */}
                        <div className="w-full lg:w-[320px] xl:w-[340px] shrink-0 flex flex-col bg-[var(--bg-1)]/90 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                            {/* Summary Banner */}
                            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        {t12(language, 'Fit Type & Combination', 'Geçme Türü & Kombinasyonu')}
                                    </span>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-2xl font-black font-mono text-white">
                                            Ø{nominalDia} {fitResults.holeStr}/{fitResults.shaftStr}
                                        </span>
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                                                fitResults.fitType === 'Clearance'
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                    : fitResults.fitType === 'Interference'
                                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            }`}
                                        >
                                            {fitResults.fitType === 'Clearance' ? t12(language, 'Clearance', 'Boşluklu') : fitResults.fitType === 'Interference' ? t12(language, 'Interference', 'Sıkı') : t12(language, 'Transition', 'Geçiş')}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        {fitResults.fitType === 'Interference' ? t12(language, 'Min / Max Interf.', 'Min / Maks Sıkılık') : t12(language, 'Min / Max Clear.', 'Min / Maks Boşluk')}
                                    </span>
                                    <div className="text-lg font-black font-mono text-blue-400 mt-1">
                                        {fitResults.fitType === 'Interference'
                                            ? `${formatEngineeringValue((Math.abs(fitResults.maxClearance * 1000)), precision, false)} / ${formatEngineeringValue((Math.abs(fitResults.minClearance * 1000)), precision, false)}`
                                            : fitResults.fitType === 'Clearance'
                                            ? `${formatEngineeringValue(Math.max(0, fitResults.minClearance * 1000), precision, false)} / ${formatEngineeringValue(Math.max(0, fitResults.maxClearance * 1000), precision, false)}`
                                            : `${formatEngineeringValue((fitResults.minClearance * 1000), precision, false)} / ${formatEngineeringValue((fitResults.maxClearance * 1000), precision, false)}`}
                                        {' '}<span className="text-xs text-slate-400">μm</span>
                                    </div>
                                </div>
                            </div>

                            {/* ═══ ISO 286 Fit Engineering Guidance Card ═══ */}
                            <div className={`p-3.5 rounded-xl border text-xs font-mono space-y-2 ${
                                fitResults.fitType === 'Interference'
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                    : fitResults.fitType === 'Transition'
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            }`}>
                                <div className="font-bold flex items-center justify-between uppercase text-[10px] tracking-wider">
                                    <div className="flex items-center gap-1.5">
                                        <Zap size={13} className="shrink-0" />
                                        <span>{t12(language, 'ISO 286 Fit Normative Assessment', 'ISO 286 Geçme Normatif Değerlendirmesi')}</span>
                                    </div>
                                    <span className="font-bold">{fitResults.holeStr}/{fitResults.shaftStr}</span>
                                </div>
                                <p className="font-sans text-[11px] leading-relaxed text-[var(--ink)]">
                                    {fitResults.fitType === 'Interference' ? (
                                        t12(
                                            language,
                                            `Interference / Press Fit (${Math.abs(fitResults.maxClearanceUm)} to ${Math.abs(fitResults.minClearanceUm)} μm). Permanent or semi-permanent friction transmission. Requires mechanical press or thermal heating/cooling. Switch to "DIN 7190 Press Fit" tab to evaluate transmissible torque and required assembly oven temperature.`,
                                            `Sıkı / Pres Geçme (${Math.abs(fitResults.maxClearanceUm)} ila ${Math.abs(fitResults.minClearanceUm)} μm). Sürtünmeyle tork ve eksenel yük iletir. Mekanik pres veya termal genleşme/büzülme gerektirir. İletilebilir tork ve montaj fırın sıcaklığını hesaplamak için "DIN 7190 Sıkı Geçme" sekmesine geçin.`
                                        )
                                    ) : fitResults.fitType === 'Transition' ? (
                                        t12(
                                            language,
                                            `Transition Fit (Clearance ${fitResults.maxClearanceUm} μm to Interference ${Math.abs(fitResults.minClearanceUm)} μm). Precise location centering without excessive play. Assembly typically achieved using mallet, arbor press, or light hand force. Common for dowel pins, spigots, and rigid gear hubs.`,
                                            `Geçiş (Belirsiz) Geçme (Boşluk +${fitResults.maxClearanceUm} μm ila Sıkılık ${Math.abs(fitResults.minClearanceUm)} μm). Hassas eksenleme ve merkezleme sağlar. Genellikle plastik tokmak veya el presi ile monte edilir. Merkezleme pimleri ve hassas göbek montajlarında tercih edilir.`
                                        )
                                    ) : (
                                        t12(
                                            language,
                                            `Clearance Fit (Guaranteed play ${Math.max(0, fitResults.minClearanceUm)} to ${Math.max(0, fitResults.maxClearanceUm)} μm). Ensures free relative rotation or sliding motion between shaft and bore with hydrodynamic lubricant clearance. Ideal for plain journal bearings, sliding guides, and thermal growth allowance.`,
                                            `Boşluklu Geçme (Garantili boşluk ${Math.max(0, fitResults.minClearanceUm)} ila ${Math.max(0, fitResults.maxClearanceUm)} μm). Mil ve delik arasında serbest dönme veya boyuna kayma hareketi sağlar; yağ filmi oluşumuna uygundur. Kaymalı yataklar, kılavuz burçlar ve termal genleşme payı olan montajlar için idealdir.`
                                        )
                                    )}
                                </p>
                            </div>

                            {/* Dimension Limits Breakdown Cards */}
                            <div className="grid grid-cols-1 gap-3">
                                {/* Hole Limits */}
                                <div className="p-4 rounded-xl bg-slate-900/40 border border-emerald-500/20">
                                    <span className="text-xs font-bold text-emerald-400 block mb-2">
                                        {t12(language, 'Hole Tolerance Limits', 'Delik Tolerans Sınırları')} ({fitResults.holeStr})
                                    </span>
                                    <div className="space-y-1.5 font-mono text-xs">
                                        <div className="flex justify-between text-slate-300">
                                            <span>{t12(language, 'Maximum Dimension:', 'Maksimum Boyut:')}</span>
                                            <span className="font-bold text-white">{formatEngineeringValue(fitResults.holeMax, precision, false)} mm</span>
                                        </div>
                                        <div className="flex justify-between text-slate-300">
                                            <span>{t12(language, 'Minimum Dimension:', 'Minimum Boyut:')}</span>
                                            <span className="font-bold text-white">{formatEngineeringValue(fitResults.holeMin, precision, false)} mm</span>
                                        </div>
                                        <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                                            <span>{t12(language, 'Tolerance (TD):', 'Tolerans Payı (TD):')}</span>
                                            <span>{formatEngineeringValue(((fitResults.holeMax - fitResults.holeMin) * 1000), precision, false)} μm</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Shaft Limits */}
                                <div className="p-4 rounded-xl bg-slate-900/40 border border-amber-500/20">
                                    <span className="text-xs font-bold text-amber-400 block mb-2">
                                        {t12(language, 'Shaft Tolerance Limits', 'Mil Tolerans Sınırları')} ({fitResults.shaftStr})
                                    </span>
                                    <div className="space-y-1.5 font-mono text-xs">
                                        <div className="flex justify-between text-slate-300">
                                            <span>{t12(language, 'Maximum Dimension:', 'Maksimum Boyut:')}</span>
                                            <span className="font-bold text-white">{formatEngineeringValue(fitResults.shaftMax, precision, false)} mm</span>
                                        </div>
                                        <div className="flex justify-between text-slate-300">
                                            <span>{t12(language, 'Minimum Dimension:', 'Minimum Boyut:')}</span>
                                            <span className="font-bold text-white">{formatEngineeringValue(fitResults.shaftMin, precision, false)} mm</span>
                                        </div>
                                        <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                                            <span>{t12(language, 'Tolerance (Td):', 'Tolerans Payı (Td):')}</span>
                                            <span>{formatEngineeringValue(((fitResults.shaftMax - fitResults.shaftMin) * 1000), precision, false)} μm</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ========================================================================= */
                    /* TAB 2: DIN 7190 PRESS & SHRINK FIT ENGINE                                 */
                    /* ========================================================================= */
                    <div className="flex-1 w-full flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden">
                        {/* ═══ SOL: GİRDİLER (Inputs & Controls) ═══ */}
                        <div className="w-full lg:w-[380px] xl:w-[410px] shrink-0 flex flex-col bg-[var(--bg-1)]/90 border-b lg:border-b-0 lg:border-r border-white/5 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                            {renderFitsHeader('press-fit')}
                            {/* Geometric Dimensions Card */}
                            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                        <Settings2 size={15} /> {t12(language, '1. Geometric Dimensions', '1. Geometrik Boyutlar')}
                                    </h3>
                                    <span className="text-[10px] text-slate-500 font-mono">DIN 7190-1</span>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-0.5 text-xs">
                                        <span className="text-slate-200 font-bold flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span>
                                            {t12(language, 'Contact Diameter (d_F):', 'Temas Çapı (d_F):')}
                                        </span>
                                        <span className="font-mono text-indigo-400 font-bold text-sm">Ø{pfContactDia} mm</span>
                                    </div>
                                    <p className="text-[10.5px] text-indigo-300/80 mb-1.5 leading-tight">
                                        {t12(language, 'Nominal joint diameter between shaft and hub interface (Shaft OD = Hub ID)', 'Mil dış çapı ile göbek deliğinin birleştiği temas/sıkılık arayüz çapı (Mil Çapı = Göbek Deliği)')}
                                    </p>
                                    <input
                                        type="range"
                                        min={10}
                                        max={250}
                                        value={pfContactDia}
                                        onChange={(e) => {
                                            const d = Number(e.target.value);
                                            setPfContactDia(d);
                                            if (pfHubOuterDia <= d + 5) setPfHubOuterDia(d + 30);
                                        }}
                                        className="w-full accent-[var(--cyan)] bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-0.5 text-xs">
                                        <span className="text-slate-200 font-bold flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
                                            {t12(language, 'Hub Outer Diameter (D_a):', 'Göbek Dış Çapı (D_a):')}
                                        </span>
                                        <span className="font-mono text-amber-400 font-bold text-sm">Ø{pfHubOuterDia} mm</span>
                                    </div>
                                    <p className="text-[10.5px] text-amber-300/80 mb-1.5 leading-tight">
                                        {t12(language, 'Outer diameter of gear, pulley, coupling, or flange mounted on shaft (D_a > d_F)', 'Mile preslenen dişli, kasnak, kaplin veya volanın en dış silindirik çapı (D_a > d_F)')}
                                    </p>
                                    <input
                                        type="range"
                                        min={pfContactDia + 5}
                                        max={400}
                                        value={pfHubOuterDia}
                                        onChange={(e) => setPfHubOuterDia(Number(e.target.value))}
                                        className="w-full accent-[var(--cyan)] bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex flex-col gap-1 text-[10px] font-mono mt-2 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span>{t12(language, 'Hub Ratio (Q_h = d_F / D_a):', 'Göbek Çap Oranı (Q_h):')}</span>
                                            <span className={`font-bold ${(pfContactDia / pfHubOuterDia) > 0.85 ? 'text-rose-400' : 'text-slate-200'}`}>
                                                {formatEngineeringValue((pfContactDia / pfHubOuterDia), precision, true)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-[9.5px] text-slate-500 pt-1 border-t border-slate-800/50">
                                            <span>{t12(language, 'Standard Limit:', 'Standart Sınır:')}</span>
                                            <span className={(pfContactDia / pfHubOuterDia) > 0.85 ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                                                {(pfContactDia / pfHubOuterDia) > 0.85 ? t12(language, 'Thin-walled Hub (>0.85)', 'İnce Etli Göbek (>0.85)') : 'DIN 7190: 0.25 – 0.85'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-0.5 text-xs">
                                        <span className="text-slate-200 font-bold flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                                            {t12(language, 'Contact Length (l_F):', 'Temas Boyu (l_F):')}
                                        </span>
                                        <span className="font-mono text-emerald-400 font-bold text-sm">{pfContactLength} mm</span>
                                    </div>
                                    <p className="text-[10.5px] text-emerald-300/80 mb-1.5 leading-tight">
                                        {t12(language, 'Axial engagement length between shaft and hub', 'Mil ve göbeğin birbirine temas ettiği eksenel sıkı geçme boyu (Kavrama Uzunluğu)')}
                                    </p>
                                    <input
                                        type="range"
                                        min={10}
                                        max={300}
                                        value={pfContactLength}
                                        onChange={(e) => setPfContactLength(Number(e.target.value))}
                                        className="w-full accent-[var(--cyan)] bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Hollow Shaft Toggle */}
                                <div className="pt-2 border-t border-slate-800/80">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 mb-2">
                                        <input
                                            type="checkbox"
                                            checked={pfIsHollowShaft}
                                            onChange={(e) => {
                                                setPfIsHollowShaft(e.target.checked);
                                                if (e.target.checked && pfShaftInnerDia === 0) {
                                                    setPfShaftInnerDia(Math.round(pfContactDia * 0.5));
                                                }
                                            }}
                                            className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                                        />
                                        {t12(language, 'Use Hollow Shaft', 'İçi Boş Mil (Hollow Shaft) Kullan')}
                                    </label>
                                    {pfIsHollowShaft && (
                                        <div>
                                            <div className="flex justify-between items-center mb-1 text-xs">
                                                <span className="text-slate-400">{t12(language, 'Shaft Bore Diameter (d_i):', 'Mil İç Delik Çapı (d_i):')}</span>
                                                <span className="font-mono text-indigo-400 font-bold">{pfShaftInnerDia} mm</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={5}
                                                max={pfContactDia - 4}
                                                value={pfShaftInnerDia}
                                                onChange={(e) => setPfShaftInnerDia(Number(e.target.value))}
                                                className="w-full accent-[var(--cyan)] bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tolerances & Materials Card */}
                            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                        <Wrench size={15} /> {t12(language, '2. Tolerance & Material Selection', '2. Tolerans & Malzeme Seçimi')}
                                    </h3>
                                </div>

                                {/* Tolerance Presets */}
                                <div>
                                    <label className="text-xs font-medium text-slate-300 block mb-1.5">
                                        {t12(language, 'Fit Tolerance (ISO Pair):', 'Geçme Toleransı (ISO Çifti):')}
                                    </label>
                                    <select
                                        value={pfTolerancePair}
                                        onChange={(e) => setPfTolerancePair(e.target.value as any)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                                    >
                                        {Object.entries(TOLERANCE_PAIR_PRESETS).map(([pairKey, info]) => (
                                            <option key={pairKey} value={pairKey}>
                                                {getTolerancePairLabel(pairKey, info.description, language)}
                                            </option>
                                        ))}
                                        <option value="custom">{t12(language, 'Custom Interference (μm)', 'Özel Sıkılık Değeri (μm)')}</option>
                                    </select>
                                </div>

                                {pfTolerancePair === 'custom' && (
                                    <div>
                                        <div className="flex justify-between items-center mb-1 text-xs">
                                            <span className="text-slate-300">{t12(language, 'Custom Interference (U):', 'Özel Sıkılık (U):')}</span>
                                            <span className="font-mono text-indigo-400 font-bold">{pfCustomInterferenceMaxUm != null ? `${pfCustomInterferenceUm} … ${pfCustomInterferenceMaxUm}` : pfCustomInterferenceUm} μm</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={5}
                                            max={200}
                                            value={pfCustomInterferenceUm}
                                            onChange={(e) => { setPfCustomInterferenceUm(Number(e.target.value)); setPfCustomInterferenceMaxUm(null); }}
                                            className="w-full accent-[var(--cyan)] bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                )}

                                {/* Materials */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-300 block mb-1">{t12(language, 'Hub Material', 'Göbek Malzemesi')}</label>
                                        <select
                                            value={pfHubMaterialId}
                                            onChange={(e) => setPfHubMaterialId(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono"
                                        >
                                            {Object.values(PRESS_FIT_MATERIALS).map((m) => (
                                                <option key={m.id} value={m.id}>{getPressFitMaterialLabel(m.id, m.name, language)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-300 block mb-1">{t12(language, 'Shaft Material', 'Mil Malzemesi')}</label>
                                        <select
                                            value={pfShaftMaterialId}
                                            onChange={(e) => setPfShaftMaterialId(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono"
                                        >
                                            {Object.values(PRESS_FIT_MATERIALS).map((m) => (
                                                <option key={m.id} value={m.id}>{getPressFitMaterialLabel(m.id, m.name, language)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Assembly Friction */}
                                <div>
                                    <label className="text-[11px] font-bold text-slate-300 block mb-1">{t12(language, 'Assembly Method & Friction', 'Montaj Yöntemi & Sürtünme')}</label>
                                    <select
                                        value={pfAssemblyMethod}
                                        onChange={(e) => setPfAssemblyMethod(e.target.value as any)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                                    >
                                        <option value="dry_press">{t12(language, 'Dry Press Fit (μ ≈ 0.14)', 'Kuru Pres Geçme (μ ≈ 0.14)')}</option>
                                        <option value="oiled_press">{t12(language, 'Oiled Press Fit (μ ≈ 0.10)', 'Yağlı Pres Geçme (μ ≈ 0.10)')}</option>
                                        <option value="thermal_shrink">{t12(language, 'Thermal Shrink Fit (μ ≈ 0.18)', 'Isıtmalı Sıcak Geçme (μ ≈ 0.18)')}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Operating Loads */}
                            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-3">
                                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                                    <Gauge size={15} /> {t12(language, '3. Operating Loads', '3. Çalışma Yükleri')}
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] text-slate-300 block mb-1">{t12(language, 'Transmitted Torque (N·m)', 'İletilecek Tork (N·m)')}</label>
                                        <input
                                            type="number"
                                            value={pfOperatingTorque}
                                            onChange={(e) => setPfOperatingTorque(Number(e.target.value))}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] text-slate-300 block mb-1">{t12(language, 'Axial Force (N)', 'Eksenel Kuvvet (N)')}</label>
                                        <input
                                            type="number"
                                            value={pfOperatingAxialForce}
                                            onChange={(e) => setPfOperatingAxialForce(Number(e.target.value))}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ═══ ORTA: GÖRÜNTÜ (CAD Drawing & Visualizer) ═══ */}
                        <div className="flex-1 min-w-0 min-h-[500px] lg:min-h-0 flex flex-col gap-4 bg-[var(--bg-0)] border-b lg:border-b-0 lg:border-r border-white/5 p-4 overflow-y-auto custom-scrollbar">
                            {/* 2D Cross Section SVG Blueprint */}
                            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                                                {t12(language, '2D Technical Assembly Section & Stress Map', '2D Teknik Montaj Kesiti & Gerilme Haritası')}
                                            </span>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                {t12(language, 'DIN 7190 / ISO Standard', 'DIN 7190 / ISO Standardı')}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {t12(language, 'Longitudinal mount section (axial) and radial end-face stress distribution between shaft and hub', 'Mil ve göbek arasındaki boyuna montaj kesiti (eksenel) ve radyal alın gerilme dağılımı')}
                                        </p>
                                    </div>

                                    {/* View Mode Toggle */}
                                    <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                                        <button
                                            onClick={() => setPfViewMode('both')}
                                            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                                                pfViewMode === 'both' ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            {t12(language, 'Both', 'İkisi')}
                                        </button>
                                        <button
                                            onClick={() => setPfViewMode('longitudinal')}
                                            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                                                pfViewMode === 'longitudinal' ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            {t12(language, 'Axial Section', 'Boyuna Kesit')}
                                        </button>
                                        <button
                                            onClick={() => setPfViewMode('radial')}
                                            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                                                pfViewMode === 'radial' ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            {t12(language, 'Radial Section', 'Enine Kesit')}
                                        </button>
                                    </div>
                                </div>

                                <PressFitCrossSectionSVG
                                    contactDia={pfContactDia}
                                    hubOuterDia={pfHubOuterDia}
                                    shaftInnerDia={pfIsHollowShaft ? pfShaftInnerDia : 0}
                                    contactLength={pfContactLength}
                                    effectiveInterference={pressFitResults.effectiveInterferenceUm}
                                    contactPressure={pressFitResults.contactPressure}
                                    isSafe={isPressFitSafe}
                                    viewMode={pfViewMode}
                                    language={language}
                                />

                                {/* Educational Engineering Legend & Terminology */}
                                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-2.5">
                                    <div className="text-[11px] font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                                        <Info size={13} className="text-indigo-400" />
                                        {t12(language, 'Section & Diameter Parameters Guide (DIN 7190)', 'Kesit ve Çap Parametreleri Kılavuzu (DIN 7190)')}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300 text-[11px] leading-relaxed">
                                        <div className="bg-slate-900/50 p-3 rounded-xl border border-indigo-500/20">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
                                                <strong className="text-indigo-300 font-mono text-xs">{t12(language, 'd_F (Contact / Joint Diameter):', 'd_F (Temas Çapı / Sıkılık Çapı):')}</strong>
                                            </div>
                                            <p className="text-slate-300">
                                                {t12(language, 'Mating interface between shaft outer diameter and hub bore. Effective interference', 'Mil dış silindirik yüzeyi ile göbek deliğinin birleştiği temas arayüzüdür. Efektif sıkılık')} (<span className="text-emerald-400 font-mono font-bold">U_eff = {formatEngineeringValue(pressFitResults.effectiveInterferenceUm, precision, true)} μm</span>) {t12(language, 'occurs here and creates torque-transmitting contact pressure', 'bu çapta gerçekleşir ve tork ileten radyal basınç')} (<span className="text-indigo-400 font-mono font-bold">p_f = {formatEngineeringValue(pressFitResults.contactPressure, precision, true)} MPa</span>).
                                            </p>
                                        </div>
                                        <div className="bg-slate-900/50 p-3 rounded-xl border border-amber-500/20">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                                                <strong className="text-amber-300 font-mono text-xs">{t12(language, 'D_a (Hub Outer Diameter):', 'D_a (Göbek Dış Çapı):')}</strong>
                                            </div>
                                            <p className="text-slate-300">
                                                {t12(language, 'Outer diameter of gear, pulley, coupling, or flywheel. Radial wall thickness is', 'Mile sıkı geçirilen dişli çark, kasnak, kaplin veya volanın en dış silindirik çapıdır. Göbek radyal et kalınlığı')} <span className="font-mono text-slate-200 font-bold">(D_a - d_F) / 2 = {formatEngineeringValue(((pfHubOuterDia - pfContactDia) / 2), precision, true)} mm</span> {t12(language, 'providing resistance against hub yield stress.', 'olup gövdenin akma gerilmesine karşı mukavemetini sağlar.')}
                                            </p>
                                        </div>
                                        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"></span>
                                                <strong className="text-yellow-400 font-mono text-xs">{t12(language, 'l_F (Contact / Engagement Length):', 'l_F (Temas Boyu / Kavrama Boyu):')}</strong>
                                            </div>
                                            <p className="text-slate-300">
                                                {t12(language, 'Axial engagement length between shaft and hub. Transmissible torque and holding force are proportional to this length.', 'Mil ve göbeğin eksenel doğrultuda birbirine temas ettiği boydur. İletilen tork ve eksenel tutma kuvveti bu temas boyu ile doğru orantılıdır ($T \\propto l_F$).')}
                                            </p>
                                        </div>
                                        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
                                                <strong className="text-cyan-300 font-mono text-xs">{t12(language, 'd_i (Shaft Inner Bore Diameter):', 'd_i (Mil İç Delik Çapı):')}</strong>
                                            </div>
                                            <p className="text-slate-300">
                                                {t12(language, 'Bore diameter when designing a hollow shaft. Radial compliance is higher for hollow shafts than solid shafts.', 'İçi boş mil tasarlandığında delik çapıdır. İçi boş millerde radyal esneklik daha fazla olduğundan aynı geometride dolu mile göre temas basıncı bir miktar farklılık gösterir.')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ═══ SAĞ: ÇIKTILAR (Outputs, KPIs & Safety) ═══ */}
                        <div className="w-full lg:w-[380px] shrink-0 flex flex-col bg-[var(--bg-1)]/90 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                            {/* Overall Status Banner */}
                            <div
                                className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                                    isPressFitSafe
                                        ? 'bg-emerald-500/10 border-emerald-500/30'
                                        : 'bg-rose-500/10 border-rose-500/30'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    {isPressFitSafe ? (
                                        <CheckCircle2 className="text-emerald-400 shrink-0" size={24} />
                                    ) : (
                                        <XCircle className="text-rose-400 shrink-0" size={24} />
                                    )}
                                    <div>
                                        <h4 className="text-xs font-bold text-white">
                                            {isPressFitSafe
                                                ? t12(language, 'Interference Fit Safe', 'Sıkı Geçme Güvenli')
                                                : t12(language, 'Stress / Slippage Risk Detected', 'Gerilme / Kayma Riski!')}
                                        </h4>
                                        <p className="text-[11px] text-slate-300 mt-0.5">
                                            {isPressFitSafe
                                                ? t12(language, `Torque S = ${formatEngineeringValue(pressFitResults.torqueSafetyFactor, precision, true)}, Hub S = ${formatEngineeringValue(pressFitResults.hubSafetyFactor, precision, true)}`, `Tork S = ${formatEngineeringValue(pressFitResults.torqueSafetyFactor, precision, true)}, Göbek S = ${formatEngineeringValue(pressFitResults.hubSafetyFactor, precision, true)}`)
                                                : t12(language, 'Risk of deformation or slippage.', 'Deformasyon veya kayma riski.')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={copyPfSummary}
                                    className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer"
                                    title="Raporu Kopyala"
                                >
                                    {pfCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                </button>
                            </div>

                            {/* ═══ DIN 7190 Actionable Engineering Advice Card ═══ */}
                            <div className={`p-3.5 rounded-xl border text-xs font-mono space-y-2 ${
                                !isPressFitSafe
                                    ? 'bg-[var(--bad)]/10 border-[var(--bad)]/40 text-[var(--bad)]'
                                    : pressFitResults.hubSafetyFactor < 1.25 || pressFitResults.torqueSafetyFactor < 1.25
                                    ? 'bg-[var(--warn)]/10 border-[var(--warn)]/40 text-[var(--warn)]'
                                    : 'bg-[var(--ok)]/10 border-[var(--ok)]/40 text-[var(--ok)]'
                            }`}>
                                <div className="font-bold flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                                    <Zap size={13} className="shrink-0" />
                                    <span>{t12(language, 'DIN 7190 Engineering Recommendation', 'DIN 7190 Mühendislik Tavsiyesi')}</span>
                                </div>
                                <p className="font-sans text-[11px] leading-relaxed text-[var(--ink)]">
                                    {!pressFitResults.isHubSafe ? (
                                        t12(
                                            language,
                                            `Hub plastic deformation risk! Equivalent von Mises stress (σ_v = ${formatEngineeringValue(pressFitResults.hubVonMisesStress, precision, true)} MPa) leaves less than the required 1.2 margin to the hub yield strength (${pfHubMat.yieldStrength} MPa; p_gA/p_max = ${formatEngineeringValue(pressFitResults.hubSafetyFactor, precision, true)}). Increase hub outer diameter Da (currently Ø${pfHubOuterDia} mm, recommend Da/dF ≥ 2.0) or reduce interference tolerance class (e.g. from H7/u6 to H7/s6 or H7/r6).`,
                                            `Göbek plastik deformasyon / patlama riski! Eşdeğer von Mises gerilmesi (σ_v = ${formatEngineeringValue(pressFitResults.hubVonMisesStress, precision, true)} MPa) göbek akma sınırına (${pfHubMat.yieldStrength} MPa) karşı gereken 1,2 emniyeti sağlamıyor (p_gA/p_max = ${formatEngineeringValue(pressFitResults.hubSafetyFactor, precision, true)}). Göbek dış çapı Da'yı büyütün (şu an Ø${pfHubOuterDia} mm, tavsiye Da/dF ≥ 2.0) veya geçme tolerans sınıfını hafifletin (ör. H7/u6 yerine H7/s6 veya H7/r6).`
                                        )
                                    ) : pressFitResults.torqueSafetyFactor < 1.0 ? (
                                        t12(
                                            language,
                                            `Slippage risk under operating load! Transmissible torque (${formatEngineeringValue(pressFitResults.transmissibleTorque, precision, true)} N·m) is less than required operating torque (${pfOperatingTorque} N·m). Increase contact length l_F (currently ${pfContactLength} mm) or increase interference class (e.g. H7/s6 or H7/u6) to increase joint pressure.`,
                                            `İşletme yükü altında kayma riski! İletilebilir tork (${formatEngineeringValue(pressFitResults.transmissibleTorque, precision, true)} N·m) gerekli işletme torkundan (${pfOperatingTorque} N·m) düşüktür. Temas boyu l_F'yi artırın (şu an ${pfContactLength} mm) veya radyal basıncı artırmak için tolerans sınıfını yükseltin (ör. H7/s6 veya H7/u6).`
                                        )
                                    ) : pressFitResults.hubSafetyFactor < 1.25 || pressFitResults.torqueSafetyFactor < 1.25 ? (
                                        t12(
                                            language,
                                            `Borderline safety margin (Torque S=${formatEngineeringValue(pressFitResults.torqueSafetyFactor, precision, true)}, Hub S=${formatEngineeringValue(pressFitResults.hubSafetyFactor, precision, true)}). For reversing dynamic torque or thermal expansion differentials, increase hub outer diameter Da or engagement length l_F.`,
                                            `Sınırda emniyet marjı (Tork S=${formatEngineeringValue(pressFitResults.torqueSafetyFactor, precision, true)}, Göbek S=${formatEngineeringValue(pressFitResults.hubSafetyFactor, precision, true)}). Dinamik yön değiştiren tork veya çalışma sıcaklığı farkları için göbek dış çapı Da veya temas boyu l_F'yi büyütün.`
                                        )
                                    ) : (
                                        t12(
                                            language,
                                            `Optimum DIN 7190 interference fit. Joint securely transmits operating torque with safety S=${formatEngineeringValue(pressFitResults.torqueSafetyFactor, precision, true)} while hub stress remains strictly elastic (S=${formatEngineeringValue(pressFitResults.hubSafetyFactor, precision, true)}). For thermal assembly: heat hub to ${pressFitResults.hubTargetHeatingTemp}°C (+${pressFitResults.requiredTempDiffHub}°C) or chill shaft to ${pressFitResults.shaftTargetCoolingTemp}°C.`,
                                            `Optimum DIN 7190 sıkı geçme. Bağlantı, S=${formatEngineeringValue(pressFitResults.torqueSafetyFactor, precision, true)} emniyetle tork iletirken göbek gerilmesi elastik sınırlar içindedir (S=${formatEngineeringValue(pressFitResults.hubSafetyFactor, precision, true)}). Termal montaj için: göbeği ${pressFitResults.hubTargetHeatingTemp}°C'ye ısıtın (+${pressFitResults.requiredTempDiffHub}°C) veya mili ${pressFitResults.shaftTargetCoolingTemp}°C'ye soğutun.`
                                        )
                                    )}
                                </p>
                            </div>

                            {/* Core KPI Results Grid */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1" title={t12(language, 'p_min (from U_min) sets the torque capacity; p_max (from U_max) sets stresses and press force — DIN 7190-1', 'p_min (U_min) tork kapasitesini, p_max (U_max) gerilme ve pres kuvvetini belirler — DIN 7190-1')}>{t12(language, 'Pressure', 'Basınç')} <span className="normal-case">p_min … p_max</span></span>
                                    <div className="text-lg font-mono font-black text-indigo-400">
                                        {formatEngineeringValue(pressFitResults.contactPressure, precision, true)}<span className="text-slate-400 font-normal"> … </span>{formatEngineeringValue(pressFitResults.contactPressureMax, precision, true)} <span className="text-xs font-normal text-slate-400">MPa</span>
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                        U {formatEngineeringValue(pressFitResults.interferenceMinUm, precision, true)}…{formatEngineeringValue(pressFitResults.interferenceMaxUm, precision, true)} μm · ΔU {formatEngineeringValue(pressFitResults.smoothingUm, precision, true)} μm · {pressFitResults.interferenceSource}
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">{t12(language, 'Transmissible Torque', 'İletilebilir Tork')} <span className="normal-case">(p_min)</span></span>
                                    <div className="text-lg font-mono font-black text-emerald-400">
                                        {formatEngineeringValue(pressFitResults.transmissibleTorque, precision, true)} <span className="text-xs font-normal text-slate-400">N·m</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">{t12(language, 'Press Force', 'Pres Kuvveti')}</span>
                                    <div className="text-lg font-mono font-black text-amber-400">
                                        {formatEngineeringValue(pressFitResults.assemblyPressForce, precision, true)} <span className="text-xs font-normal text-slate-400">kN</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">{t12(language, 'Hub Eq. Stress', 'Göbek Eşdeğer')} <span className="normal-case">σ_v (p_max)</span></span>
                                    <div className={`text-lg font-mono font-black ${pressFitResults.isHubSafe ? 'text-[var(--ink)]' : 'text-[var(--bad)]'}`}>
                                        {formatEngineeringValue(pressFitResults.hubVonMisesStress, precision, true)} <span className="text-xs font-normal text-slate-400">MPa</span>
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                        p_gA/p_max = {formatEngineeringValue(pressFitResults.hubSafetyFactor, precision, true)} · {t12(language, 'shaft', 'mil')} {formatEngineeringValue(pressFitResults.shaftSafetyFactor, precision, true)}
                                    </div>
                                </div>
                            </div>

                            {pressFitResults.warnings.length > 0 && (
                                <ul className="space-y-1 rounded-xl border border-[var(--warn)]/40 bg-[var(--warn)]/10 p-3 text-[11px] leading-snug text-[var(--ink)]">
                                    {pressFitResults.warnings.map((w, i) => (
                                        <li key={i} className="flex gap-1.5"><span className="text-[var(--warn)]">▲</span><span>{w}</span></li>
                                    ))}
                                </ul>
                            )}

                            {/* Thermal Assembly Guide Cards */}
                            <div className="space-y-2.5">
                                <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--cyan-glow)] text-[var(--cyan)] flex items-center justify-center">
                                            <Flame size={16} />
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block">
                                                {t12(language, 'Shrink Fit (Hub Heating)', 'Sıcak Geçme (Göbek Isıtma)')}
                                            </span>
                                            <p className="text-[10px] text-slate-300">
                                                {t12(language, 'Delta:', 'Fark:')} <strong className="whitespace-nowrap">+{pressFitResults.requiredTempDiffHub} °C</strong>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 whitespace-nowrap pl-2">
                                        <span className="text-[9px] text-slate-400 font-mono">{t12(language, 'Oven Temp', 'Fırın')}</span>
                                        <div className="text-lg font-black font-mono text-orange-400 whitespace-nowrap">
                                            {pressFitResults.hubTargetHeatingTemp}&nbsp;°C
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--cyan-glow)] text-[var(--cyan)] flex items-center justify-center">
                                            <Snowflake size={16} />
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                                                {t12(language, 'Cryogenic Fit (Shaft Chilling)', 'Kriyojenik (Mil Soğutma)')}
                                            </span>
                                            <p className="text-[10px] text-slate-300">
                                                {t12(language, 'Delta:', 'Fark:')} <strong className="whitespace-nowrap">-{pressFitResults.requiredTempDiffShaft} °C</strong>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 whitespace-nowrap pl-2">
                                        <span className="text-[9px] text-slate-400 font-mono">{t12(language, 'Target Cold', 'Hedef')}</span>
                                        <div className="text-lg font-black font-mono text-cyan-400 whitespace-nowrap">
                                            {pressFitResults.shaftTargetCoolingTemp}&nbsp;°C
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// SUBCOMPONENTS & DIAGRAMS
// =============================================================================

function ToleranceZoneDiagram({ fitResults, language }: { fitResults: any; language?: string }) {
    const precision = useGlobalPrecision();
    const nominal = Number(fitResults?.nominalDia) || (fitResults?.holeMin ? Math.round(fitResults.holeMin) : 50);
    const dev = (v: any, abs: any) => (v !== undefined ? Number(v) : ((Number(abs) || 0) - nominal) * 1000);
    const fin = (v: number) => (Number.isFinite(v) ? v : 0);
    const ES = fin(dev(fitResults?.holeES, fitResults?.holeMax));
    const EI = fin(dev(fitResults?.holeEI, fitResults?.holeMin));
    const es = fin(dev(fitResults?.shaft_es, fitResults?.shaftMax));
    const ei = fin(dev(fitResults?.shaft_ei, fitResults?.shaftMin));
    const lang = (language ?? 'en') as Parameters<typeof t12>[0];
    const f = (v: number) => `${v > 0 ? '+' : ''}${formatEngineeringValue(v, precision, false)}`;

    const T = {
        ink: 'var(--ink, #eceff3)', dim: 'var(--alu-dim, #949daa)', muted: 'var(--muted, #6e7783)', faint: 'var(--line-faint, #1f242b)',
        line: 'var(--line, #2a3038)', acc: 'var(--cyan, #3cc6e6)', hole: 'var(--ok, #34c77b)', shaft: 'var(--warn, #e9a83a)', bad: 'var(--bad, #ef5b5b)',
        bg: 'var(--bg-0, #0b0d10)', mono: 'var(--font-mono, ui-monospace, monospace)',
    };

    const lo = Math.min(EI, ei, 0), hi = Math.max(ES, es, 0);
    const span = Math.max(hi - lo, 10);
    const raw = span / 6;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow;
    const vMin = Math.floor((lo - span * 0.12) / step) * step;
    const vMax = Math.ceil((hi + span * 0.12) / step) * step;

    const W = 680, H = 290, top = 22, bot = 252;
    const Y = (v: number) => bot - ((v - vMin) / (vMax - vMin)) * (bot - top);
    const holeX = 190, zoneW = 120, shaftX = 400;
    const minH = 3;
    const zone = (a: number, b: number) => {
        const y1 = Y(Math.max(a, b)), y2 = Y(Math.min(a, b));
        return { y: y1, h: Math.max(minH, y2 - y1) };
    };
    const hz = zone(ES, EI), sz = zone(es, ei);

    /** spread two label baselines so they keep ≥ 13 px apart */
    const spread = (ya: number, yb: number) => {
        const gap = 13;
        if (yb - ya >= gap) return [ya, yb];
        const m = (ya + yb) / 2;
        return [m - gap / 2, m + gap / 2];
    };
    const [hyES, hyEI] = spread(Y(ES), Y(EI));
    const [syES, syEI] = spread(Y(es), Y(ei));

    const ticks: number[] = [];
    for (let v = vMin; v <= vMax + 1e-9; v += step) ticks.push(Number(v.toFixed(6)));

    const Smax = ES - ei; // largest clearance (negative = smallest interference)
    const Smin = EI - es; // smallest clearance (negative = largest interference)
    const midX = (holeX + zoneW + shaftX) / 2;
    const vdim = (x: number, a: number, b: number, label: string, color: string, side: 'l' | 'r') => {
        const y1 = Y(a), y2 = Y(b);
        const yt = Math.min(y1, y2), yb = Math.max(y1, y2);
        const ok = yb - yt > 10;
        return (
            <g>
                <line x1={x} y1={yt} x2={x} y2={yb} stroke={color} strokeWidth="1" />
                {ok ? (
                    <>
                        <polygon points={`${x},${yt} ${x - 3},${yt + 7} ${x + 3},${yt + 7}`} fill={color} />
                        <polygon points={`${x},${yb} ${x - 3},${yb - 7} ${x + 3},${yb - 7}`} fill={color} />
                    </>
                ) : (
                    <>
                        <circle cx={x} cy={yt} r="2.2" fill={color} />
                        <circle cx={x} cy={yb} r="2.2" fill={color} />
                    </>
                )}
                <text x={side === 'r' ? x + 6 : x - 6} y={(yt + yb) / 2 + 4} textAnchor={side === 'r' ? 'start' : 'end'} fill={color} fontSize="11" fontFamily={T.mono}
                    style={{ paintOrder: 'stroke', stroke: T.bg, strokeWidth: 3 }}>{label}</text>
            </g>
        );
    };

    return (
        <div className="w-full relative">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--bg-0)] select-none" role="img"
                aria-label={`${fitResults?.holeStr ?? ''}/${fitResults?.shaftStr ?? ''} tolerance zones`}>
                <defs>
                    <pattern id="tzHole" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="7" stroke={T.hole} strokeWidth="1" opacity="0.45" />
                    </pattern>
                    <pattern id="tzShaft" width="7" height="7" patternTransform="rotate(-45)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="7" stroke={T.shaft} strokeWidth="1" opacity="0.45" />
                    </pattern>
                </defs>

                {/* grid + axis */}
                {ticks.map((t) => (
                    <g key={t}>
                        <line x1="56" y1={Y(t)} x2={W - 16} y2={Y(t)} stroke={t === 0 ? T.acc : T.faint} strokeWidth={t === 0 ? 1.6 : 1} />
                        <text x="50" y={Y(t) + 4} textAnchor="end" fill={t === 0 ? T.acc : T.dim} fontSize="10.5" fontFamily={T.mono}>{t > 0 ? `+${t}` : t}</text>
                    </g>
                ))}
                <line x1="56" y1={top - 6} x2="56" y2={bot + 4} stroke={T.line} strokeWidth="1.2" />
                <text x="50" y={top - 8} textAnchor="end" fill={T.dim} fontSize="10.5" fontFamily={T.mono}>µm</text>
                <text x={W - 18} y={Y(0) - 6} textAnchor="end" fill={T.acc} fontSize="11" fontFamily={T.mono} style={{ paintOrder: 'stroke', stroke: T.bg, strokeWidth: 3 }}>
                    {t12(lang, 'zero line', 'sıfır çizgisi')} · Ø{nominal}
                </text>

                {/* hole zone */}
                <rect x={holeX} y={hz.y} width={zoneW} height={hz.h} fill="url(#tzHole)" stroke={T.hole} strokeWidth="1.6" />
                <text x={holeX + zoneW / 2} y={hz.y + hz.h / 2 + 5} textAnchor="middle" fill={T.hole} fontSize="14" fontWeight="700" fontFamily={T.mono}
                    style={{ paintOrder: 'stroke', stroke: T.bg, strokeWidth: 3 }}>{fitResults?.holeStr || 'H7'}</text>
                <line x1={holeX - 26} y1={Y(ES)} x2={holeX} y2={Y(ES)} stroke={T.hole} strokeWidth="1" />
                <line x1={holeX - 26} y1={Y(EI)} x2={holeX} y2={Y(EI)} stroke={T.hole} strokeWidth="1" />
                <text x={holeX - 30} y={hyES + 4} textAnchor="end" fill={T.hole} fontSize="11.5" fontFamily={T.mono} style={{ paintOrder: 'stroke', stroke: T.bg, strokeWidth: 3 }}>ES {f(ES)}</text>
                <text x={holeX - 30} y={hyEI + 4} textAnchor="end" fill={T.hole} fontSize="11.5" fontFamily={T.mono} style={{ paintOrder: 'stroke', stroke: T.bg, strokeWidth: 3 }}>EI {f(EI)}</text>

                {/* shaft zone */}
                <rect x={shaftX} y={sz.y} width={zoneW} height={sz.h} fill="url(#tzShaft)" stroke={T.shaft} strokeWidth="1.6" />
                <text x={shaftX + zoneW / 2} y={sz.y + sz.h / 2 + 5} textAnchor="middle" fill={T.shaft} fontSize="14" fontWeight="700" fontFamily={T.mono}
                    style={{ paintOrder: 'stroke', stroke: T.bg, strokeWidth: 3 }}>{fitResults?.shaftStr || 'h6'}</text>
                <line x1={shaftX + zoneW} y1={Y(es)} x2={shaftX + zoneW + 26} y2={Y(es)} stroke={T.shaft} strokeWidth="1" />
                <line x1={shaftX + zoneW} y1={Y(ei)} x2={shaftX + zoneW + 26} y2={Y(ei)} stroke={T.shaft} strokeWidth="1" />
                <text x={shaftX + zoneW + 30} y={syES + 4} fill={T.shaft} fontSize="11.5" fontFamily={T.mono} style={{ paintOrder: 'stroke', stroke: T.bg, strokeWidth: 3 }}>es {f(es)}</text>
                <text x={shaftX + zoneW + 30} y={syEI + 4} fill={T.shaft} fontSize="11.5" fontFamily={T.mono} style={{ paintOrder: 'stroke', stroke: T.bg, strokeWidth: 3 }}>ei {f(ei)}</text>

                {/* limit clearances / interferences between the zones */}
                <line x1={holeX + zoneW} y1={Y(ES)} x2={midX + 18} y2={Y(ES)} stroke={T.hole} strokeWidth="0.8" strokeDasharray="2 2" />
                <line x1={holeX + zoneW} y1={Y(EI)} x2={midX - 18} y2={Y(EI)} stroke={T.hole} strokeWidth="0.8" strokeDasharray="2 2" />
                <line x1={midX + 18} y1={Y(ei)} x2={shaftX} y2={Y(ei)} stroke={T.shaft} strokeWidth="0.8" strokeDasharray="2 2" />
                <line x1={midX - 18} y1={Y(es)} x2={shaftX} y2={Y(es)} stroke={T.shaft} strokeWidth="0.8" strokeDasharray="2 2" />
                {vdim(midX + 14, ES, ei, `${Smax >= 0 ? 'Smax' : t12(lang, 'Imin', 'Ümin')} ${formatEngineeringValue(Math.abs(Smax), precision, false)}`, Smax >= 0 ? T.acc : T.bad, 'r')}
                {vdim(midX - 14, EI, es, `${Smin >= 0 ? 'Smin' : t12(lang, 'Imax', 'Ümax')} ${formatEngineeringValue(Math.abs(Smin), precision, false)}`, Smin >= 0 ? T.acc : T.bad, 'l')}

                <text x={W / 2} y={H - 10} textAnchor="middle" fill={T.muted} fontSize="10.5" fontFamily={T.mono}>
                    {t12(lang, 'ISO 286-1 tolerance zones · S = clearance, I = interference (µm)', 'ISO 286-1 tolerans alanları · S = boşluk, Ü = sıkılık (µm)')}
                </text>
            </svg>
        </div>
    );
}

function FitMatedCrossSectionSVG({
    fitResults,
    nominalDia,
    language
}: {
    fitResults: any;
    nominalDia: number;
    language?: string;
}) {
    const precision = useGlobalPrecision();
    const isClearance = fitResults?.fitType === 'Clearance';
    const isInterference = fitResults?.fitType === 'Interference';

    const minCUm = Number(fitResults?.minClearanceUm) || 0;
    const maxCUm = Number(fitResults?.maxClearanceUm) || 0;

    return (
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Crosshair size={14} className="text-cyan-400" />
                    {t12(language, 'Mated Assembly & 1000× Interface Loupe', 'Fiziksel Montaj Kesiti & 1000× Arayüz Büyüteci')}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {isClearance
                        ? t12(language, 'Sliding / Rotating Contact', 'Kayma / Döner Temas')
                        : isInterference
                        ? t12(language, 'Interference Radial Press', 'Radyal Sıkı Geçme')
                        : t12(language, 'Locational Transition', 'Konumlandırma / Geçiş')}
                </span>
            </div>

            <svg
                viewBox="0 0 680 242"
                className="w-full h-auto bg-[var(--bg-0)] rounded-xl border border-slate-800/80 shadow-inner select-none font-mono"
            >
                <defs>
                    <pattern id="hubCrossHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(16, 185, 129, 0.25)" strokeWidth="1" />
                    </pattern>
                    <pattern id="shaftCrossHatch" width="10" height="10" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(245, 158, 11, 0.25)" strokeWidth="1" />
                    </pattern>
                    <pattern id="interferenceHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="6" stroke="#ef4444" strokeWidth="1.5" />
                    </pattern>
                    <linearGradient id="loupeGlass" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0f172a" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#080e18" stopOpacity="0.98" />
                    </linearGradient>
                </defs>

                {/* ── LEFT HALF: PHYSICAL MACRO ASSEMBLY (x: 20 -> 310) ── */}
                <g id="macro-assembly">
                    {/* Upper Hub Section */}
                    <rect x="50" y="25" width="220" height="40" fill="#0f172a" stroke="#10b981" strokeWidth="1.2" />
                    <rect x="50" y="25" width="220" height="40" fill="url(#hubCrossHatch)" />
                    <text x="58" y="42" fill="#34d399" fontSize="9" fontWeight="bold">
                        {t12(language, 'HUB / BORE', 'GÖBEK / DELİK')} ({fitResults?.holeStr})
                    </text>

                    {/* Shaft Section (Center) */}
                    <rect x="30" y="65" width="260" height="80" fill="#141a24" stroke="#f59e0b" strokeWidth="1.4" />
                    <rect x="30" y="65" width="260" height="80" fill="url(#shaftCrossHatch)" />
                    <text x="38" y="108" fill="#fbbf24" fontSize="10" fontWeight="bold">
                        {t12(language, 'SHAFT', 'MİL')} ({fitResults?.shaftStr}) — Ø{nominalDia} mm
                    </text>

                    {/* Lower Hub Section */}
                    <rect x="50" y="145" width="220" height="40" fill="#0f172a" stroke="#10b981" strokeWidth="1.2" />
                    <rect x="50" y="145" width="220" height="40" fill="url(#hubCrossHatch)" />

                    {/* Centerline */}
                    <line x1="20" y1="105" x2="300" y2="105" stroke="#38bdf8" strokeWidth="1" strokeDasharray="14 3 3 3" opacity="0.6" />

                    {/* Shaft Diameter Dimension */}
                    <line x1="285" y1="65" x2="285" y2="145" stroke="#94a3b8" strokeWidth="1" />
                    <path d="M282,69 L285,65 L288,69 M282,141 L285,145 L288,141" stroke="#94a3b8" strokeWidth="1" fill="none" />
                    <text x="278" y="108" textAnchor="end" fill="#94a3b8" fontSize="8.5">
                        Ø{nominalDia}
                    </text>

                    {/* Inspection Target Circle on top boundary */}
                    <circle cx="160" cy="65" r="14" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" />
                    <circle cx="160" cy="65" r="3" fill="#38bdf8" />
                    <text x="160" y="55" textAnchor="middle" fill="#38bdf8" fontSize="7.5" fontWeight="bold">
                        1000×
                    </text>

                    {/* Projection Rays to Loupe */}
                    <line x1="174" y1="60" x2="380" y2="40" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />
                    <line x1="174" y1="70" x2="380" y2="190" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />
                </g>

                {/* ── RIGHT HALF: 1000× MICROSCOPIC INSPECTION LOUPE (x: 350 -> 660) ── */}
                <g id="micro-loupe" transform="translate(490, 112)">
                    {/* Outer Housing Ring */}
                    <circle cx="0" cy="0" r="92" fill="#04070d" stroke="#334155" strokeWidth="3" />
                    <circle cx="0" cy="0" r="88" fill="url(#loupeGlass)" stroke="#38bdf8" strokeWidth="1.5" />

                    {/* Reticle grid */}
                    <line x1="-80" y1="0" x2="80" y2="0" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="0.8" />
                    <line x1="0" y1="-80" x2="0" y2="80" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="0.8" />

                    {/* TOP HALF: Hub boundary material */}
                    <path d="M -84,-12 Q 0,-12 84,-12 L 84,-85 A 88,88 0 0,0 -84,-85 Z" fill="#064e3b" opacity="0.6" />
                    <line x1="-85" y1="-12" x2="85" y2="-12" stroke="#10b981" strokeWidth="2.5" />
                    <text x="0" y="-45" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="bold">
                        ▲ {t12(language, 'HUB INNER BORE', 'GÖBEK İÇ YÜZEYİ')}
                    </text>

                    {/* BOTTOM HALF: Shaft boundary material */}
                    <path d="M -84,12 Q 0,12 84,12 L 84,85 A 88,88 0 0,1 -84,85 Z" fill="#78350f" opacity="0.5" />
                    <line x1="-85" y1="12" x2="85" y2="12" stroke="#f59e0b" strokeWidth="2.5" />
                    <text x="0" y="52" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="bold">
                        ▼ {t12(language, 'SHAFT OUTER SURFACE', 'MİL DIŞ YÜZEYİ')}
                    </text>

                    {/* INTERFACE ZONE: Clearance vs Interference vs Transition */}
                    {isClearance ? (
                        <g>
                            <rect x="-84" y="-12" width="168" height="24" fill="rgba(56, 189, 248, 0.12)" />
                            <line x1="0" y1="-10" x2="0" y2="10" stroke="#38bdf8" strokeWidth="1.5" />
                            <path d="M-3,-7 L0,-11 L3,-7 M-3,7 L0,11 L3,7" stroke="#38bdf8" strokeWidth="1" fill="none" />
                            <rect x="-72" y="-7" width="144" height="14" rx="2" fill="#0284c7" />
                            <text x="0" y="3.5" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
                                {t12(language as any, 'radial gap', 'radyal boşluk')}: +{formatEngineeringValue((minCUm / 2), precision, false)} ~ +{formatEngineeringValue((maxCUm / 2), precision, false)} μm
                            </text>
                        </g>
                    ) : isInterference ? (
                        <g>
                            <rect x="-84" y="-12" width="168" height="24" fill="url(#interferenceHatch)" opacity="0.7" />
                            <rect x="-72" y="-7" width="144" height="14" rx="2" fill="#b91c1c" />
                            <text x="0" y="3.5" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
                                PRESS: {formatEngineeringValue((Math.abs(maxCUm) / 2), precision, false)} ~ {formatEngineeringValue((Math.abs(minCUm) / 2), precision, false)} μm
                            </text>
                        </g>
                    ) : (
                        <g>
                            <rect x="-84" y="-12" width="168" height="24" fill="rgba(234, 179, 8, 0.2)" />
                            <rect x="-72" y="-7" width="144" height="14" rx="2" fill="#854d0e" />
                            <text x="0" y="3.5" textAnchor="middle" fill="#fef08a" fontSize="8" fontWeight="bold">
                                TRANSITION: {minCUm >= 0 ? '+' : ''}{formatEngineeringValue((minCUm / 2), precision, false)} ~ {formatEngineeringValue((maxCUm / 2), precision, false)} μm
                            </text>
                        </g>
                    )}

                    {/* Loupe Badge */}
                    <circle cx="68" cy="-68" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                    <text x="68" y="-64" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold">
                        1000×
                    </text>
                </g>

                {/* Loupe Caption */}
                <text x="490" y="228" textAnchor="middle" fill="#64748b" fontSize="8.5">
                    {isClearance
                        ? t12(language, 'True Radial Clearance allows continuous lubrication fluid film', 'Gerçek radyal boşluk sürekli yağlama filmi sağlar')
                        : isInterference
                        ? t12(language, 'Microscopic radial overlap creates high frictional contact pressure', 'Mikroskobik radyal bindirme yüksek sürtünme temas basıncı üretir')
                        : t12(language, 'Selective assembly or light tapping required for precise alignment', 'Hassas konumlandırma için seçici montaj veya hafif çekiçleme gerekir')}
                </text>
            </svg>
        </div>
    );
}

function PressFitCrossSectionSVG({
    contactDia,
    hubOuterDia,
    shaftInnerDia,
    contactLength,
    effectiveInterference,
    contactPressure,
    isSafe,
    viewMode = 'both',
    language = 'en'
}: {
    contactDia: number;
    hubOuterDia: number;
    shaftInnerDia: number;
    contactLength: number;
    effectiveInterference: number;
    contactPressure: number;
    isSafe: boolean;
    viewMode: 'both' | 'longitudinal' | 'radial';
    language?: string;
}) {
    const precision = useGlobalPrecision();
    // Proportional calculations with safety clamps to prevent NaNs or zero dimensions
    const safeHubDia = Math.max(Number(hubOuterDia) || 100, (Number(contactDia) || 50) + 2);
    const safeShaftDia = Math.max(1, Math.min(Number(contactDia) || 50, safeHubDia - 1));
    const safeInnerDia = Math.max(0, Math.min(Number(shaftInnerDia) || 0, safeShaftDia - 1));
    const safeLength = Math.max(5, Number(contactLength) || 60);

    const rHub = 85;
    const rShaft = Math.max(26, Math.min(rHub - 16, Math.round((safeShaftDia / safeHubDia) * rHub)));
    const rHollow = safeInnerDia > 0 ? Math.max(10, Math.min(rShaft - 10, Math.round((safeInnerDia / safeHubDia) * rHub))) : 0;

    // Longitudinal dimension scaling
    const lengthRatio = safeLength / safeShaftDia;
    const hubW = Math.max(120, Math.min(200, Math.round(150 * Math.sqrt(Math.max(0.4, Math.min(2.2, lengthRatio))))));
    const shaftExtension = 55;
    const shaftW = hubW + shaftExtension * 2;

    // ViewBox settings based on mode
    let viewBox = "0 0 1020 390";
    let showLong = true;
    let showRad = true;
    let longCx = 275;
    let longCy = 205;
    let radCx = 770;
    let radCy = 205;

    if (viewMode === 'longitudinal') {
        viewBox = "0 0 780 390";
        showLong = true;
        showRad = false;
        longCx = 390;
    } else if (viewMode === 'radial') {
        viewBox = "0 0 620 390";
        showLong = false;
        showRad = true;
        radCx = 310;
    }

    const shaftX1 = longCx - shaftW / 2;
    const shaftX2 = longCx + shaftW / 2;
    const hubX1 = longCx - hubW / 2;
    const hubX2 = longCx + hubW / 2;
    const hubHeight = rHub - rShaft;

    // Arrows along interface for contact pressure
    const numArrows = Math.max(4, Math.min(7, Math.floor(hubW / 24)));
    const arrowSpacing = hubW / (numArrows + 1);
    const arrowIndices = Array.from({ length: numArrows }, (_, i) => i + 1);

    // Radial stress vectors (8 positions around circle)
    const radAngles = [0, 45, 90, 135, 180, 225, 270, 315];

    return (
        <svg viewBox={viewBox} className="w-full h-auto bg-slate-950/90 rounded-xl border border-slate-800 shadow-inner">
            <defs>
                {/* Arrowhead markers */}
                <marker id="dimArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 2 L 10 5 L 0 8 z" fill="#94a3b8" />
                </marker>
                <marker id="dimArrowAmber" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 2 L 10 5 L 0 8 z" fill="#f59e0b" />
                </marker>
                <marker id="dimArrowIndigo" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 2 L 10 5 L 0 8 z" fill="#818cf8" />
                </marker>
                <marker id="pressVector" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M 0 2 L 10 5 L 0 8 z" fill="#38bdf8" />
                </marker>

                {/* DIN ISO 128 standard 45-degree section hatching for Hub */}
                <pattern id="pfHubHatchAmber" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="12" stroke="#f59e0b" strokeWidth="1.6" strokeOpacity="0.5" />
                </pattern>

                {/* Shaft metal hatching (opposite angle -45 for distinction) */}
                <pattern id="pfShaftHatchMetal" width="10" height="10" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="10" stroke="#64748b" strokeWidth="1.2" strokeOpacity="0.3" />
                </pattern>

                {/* Lamé Stress Radial Gradient for Radial section */}
                <radialGradient id="lameStressGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#0f172a" stopOpacity="0.9" />
                    <stop offset={`${Math.round((rShaft / rHub) * 100)}%`} stopColor={isSafe ? '#6366f1' : '#f43f5e'} stopOpacity="0.6" />
                    <stop offset="85%" stopColor={isSafe ? '#3b82f6' : '#e11d48'} stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#1e293b" stopOpacity="0.4" />
                </radialGradient>

                {/* Metallic shaft gradient */}
                <linearGradient id="shaftMetalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="50%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
            </defs>

            {/* VIEW 1: BOYUNA MONTAJ KESİTİ (LONGITUDINAL ASSEMBLY SECTION) */}
            {showLong && (
                <g>
                    {/* View Title */}
                    <g transform={`translate(${longCx}, 24)`}>
                        <text textAnchor="middle" fill="#f8fafc" fontSize="13.5" fontWeight="800" letterSpacing="0.5">
                            {t12(language, 'LONGITUDINAL MOUNT SECTION (AXIAL)', 'BOYUNA MONTAJ KESİTİ (EKSENEL)')}
                        </text>
                        <text textAnchor="middle" y="16" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">
                            {t12(language, 'Shaft & hub axial engagement cross-section', 'Mil ve göbek eksenel kavrama kesiti')}
                        </text>
                    </g>

                    {/* Shaft Body (Upper & Lower or Solid) */}
                    {rHollow > 0 ? (
                        <>
                            {/* Upper Hollow Shaft Wall */}
                            <rect
                                x={shaftX1}
                                y={longCy - rShaft}
                                width={shaftW}
                                height={rShaft - rHollow}
                                fill="url(#shaftMetalGrad)"
                                stroke="#475569"
                                strokeWidth="1.5"
                            />
                            <rect
                                x={shaftX1}
                                y={longCy - rShaft}
                                width={shaftW}
                                height={rShaft - rHollow}
                                fill="url(#pfShaftHatchMetal)"
                            />

                            {/* Lower Hollow Shaft Wall */}
                            <rect
                                x={shaftX1}
                                y={longCy + rHollow}
                                width={shaftW}
                                height={rShaft - rHollow}
                                fill="url(#shaftMetalGrad)"
                                stroke="#475569"
                                strokeWidth="1.5"
                            />
                            <rect
                                x={shaftX1}
                                y={longCy + rHollow}
                                width={shaftW}
                                height={rShaft - rHollow}
                                fill="url(#pfShaftHatchMetal)"
                            />

                            {/* Center Hollow Bore Hole */}
                            <rect
                                x={shaftX1}
                                y={longCy - rHollow}
                                width={shaftW}
                                height={rHollow * 2}
                                fill="#020617"
                                stroke="#334155"
                                strokeWidth="1"
                                strokeDasharray="4 2"
                            />
                        </>
                    ) : (
                        <>
                            {/* Solid Shaft Body */}
                            <rect
                                x={shaftX1}
                                y={longCy - rShaft}
                                width={shaftW}
                                height={rShaft * 2}
                                fill="url(#shaftMetalGrad)"
                                stroke="#475569"
                                strokeWidth="1.5"
                                rx="2"
                            />
                            <rect
                                x={shaftX1}
                                y={longCy - rShaft}
                                width={shaftW}
                                height={rShaft * 2}
                                fill="url(#pfShaftHatchMetal)"
                                rx="2"
                            />
                        </>
                    )}

                    {/* Upper Hub Section (Cross-Hatched 45 deg) */}
                    <g>
                        <rect
                            x={hubX1}
                            y={longCy - rHub}
                            width={hubW}
                            height={hubHeight}
                            fill="#2e1065"
                            fillOpacity="0.25"
                        />
                        <rect
                            x={hubX1}
                            y={longCy - rHub}
                            width={hubW}
                            height={hubHeight}
                            fill="url(#pfHubHatchAmber)"
                            stroke="#f59e0b"
                            strokeWidth="2"
                        />
                        {/* Upper Hub Label Badge */}
                        <rect
                            x={longCx - 48}
                            y={longCy - (rHub + rShaft) / 2 - 11}
                            width={96}
                            height={22}
                            rx="4"
                            fill="#0f172a"
                            stroke="#f59e0b"
                            strokeWidth="1.2"
                            fillOpacity="0.95"
                        />
                        <text
                            x={longCx}
                            y={longCy - (rHub + rShaft) / 2 + 5}
                            textAnchor="middle"
                            fill="#fbbf24"
                            fontSize="11.5"
                            fontWeight="800"
                            fontFamily="monospace"
                        >
                            {t12(language, 'HUB', 'GÖBEK (HUB)')}
                        </text>
                    </g>

                    {/* Lower Hub Section (Cross-Hatched 45 deg) */}
                    <g>
                        <rect
                            x={hubX1}
                            y={longCy + rShaft}
                            width={hubW}
                            height={hubHeight}
                            fill="#2e1065"
                            fillOpacity="0.25"
                        />
                        <rect
                            x={hubX1}
                            y={longCy + rShaft}
                            width={hubW}
                            height={hubHeight}
                            fill="url(#pfHubHatchAmber)"
                            stroke="#f59e0b"
                            strokeWidth="2"
                        />
                    </g>

                    {/* Shaft Label Badge */}
                    <rect
                        x={shaftX1 + 8}
                        y={longCy - 11}
                        width={78}
                        height={22}
                        rx="4"
                        fill="#0f172a"
                        stroke="#64748b"
                        strokeWidth="1.2"
                        fillOpacity="0.95"
                    />
                    <text
                        x={shaftX1 + 47}
                        y={longCy + 5}
                        textAnchor="middle"
                        fill="#f1f5f9"
                        fontSize="11"
                        fontWeight="800"
                        fontFamily="monospace"
                    >
                        {t12(language, 'SHAFT', 'MİL (SHAFT)')}
                    </text>

                    {/* Sıkı Geçme Temas Arayüz Çizgileri (Fit Interface lines) */}
                    <line
                        x1={hubX1}
                        y1={longCy - rShaft}
                        x2={hubX2}
                        y2={longCy - rShaft}
                        stroke="#818cf8"
                        strokeWidth="2.5"
                    />
                    <line
                        x1={hubX1}
                        y1={longCy + rShaft}
                        x2={hubX2}
                        y2={longCy + rShaft}
                        stroke="#818cf8"
                        strokeWidth="2.5"
                    />

                    {/* Contact Pressure Arrows (p_f vectors acting on interface) */}
                    {arrowIndices.map((idx) => {
                        const ax = hubX1 + idx * arrowSpacing;
                        return (
                            <g key={`arrow-${idx}`}>
                                {/* Downward arrow onto shaft */}
                                <line
                                    x1={ax}
                                    y1={longCy - rShaft - 12}
                                    x2={ax}
                                    y2={longCy - rShaft - 1}
                                    stroke="#38bdf8"
                                    strokeWidth="1.6"
                                    markerEnd="url(#pressVector)"
                                />
                                {/* Upward arrow onto shaft */}
                                <line
                                    x1={ax}
                                    y1={longCy + rShaft + 12}
                                    x2={ax}
                                    y2={longCy + rShaft + 1}
                                    stroke="#38bdf8"
                                    strokeWidth="1.6"
                                    markerEnd="url(#pressVector)"
                                />
                            </g>
                        );
                    })}

                    {/* Center Axis Red Dashed Line */}
                    <line
                        x1={shaftX1 - 25}
                        y1={longCy}
                        x2={shaftX2 + 25}
                        y2={longCy}
                        stroke="#ef4444"
                        strokeWidth="1.2"
                        strokeDasharray="16 3 4 3"
                    />
                    <text
                        x={shaftX1 - 32}
                        y={longCy + 4}
                        textAnchor="middle"
                        fill="#ef4444"
                        fontSize="13"
                        fontWeight="bold"
                        fontFamily="monospace"
                    >
                        ℄
                    </text>

                    {/* ================= DIMENSION LINES ================= */}
                    {/* 1. l_F (Temas / Kavrama Boyu) - Top Horizontal */}
                    {(() => {
                        const dimY = longCy - rHub - 32;
                        return (
                            <g>
                                {/* Extension witness lines */}
                                <line x1={hubX1} y1={longCy - rHub - 2} x2={hubX1} y2={dimY - 6} stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 2" />
                                <line x1={hubX2} y1={longCy - rHub - 2} x2={hubX2} y2={dimY - 6} stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 2" />
                                {/* Dimension line with arrows */}
                                <line x1={hubX1} y1={dimY} x2={hubX2} y2={dimY} stroke="#f59e0b" strokeWidth="1.8" markerStart="url(#dimArrowAmber)" markerEnd="url(#dimArrowAmber)" />
                                {/* Large Horizontal Label badge */}
                                <rect x={longCx - 80} y={dimY - 32} width={160} height={32} rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
                                <text x={longCx} y={dimY - 18} textAnchor="middle" fill="#fbbf24" fontSize="13.5" fontWeight="900" fontFamily="monospace">
                                    l_F = {contactLength} mm
                                </text>
                                <text x={longCx} y={dimY - 6} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
                                    {t12(language, 'Contact / Engagement Length', 'Temas / Kavrama Boyu')}
                                </text>
                            </g>
                        );
                    })()}

                    {/* 2. D_a (Göbek Dış Çapı) - Right Vertical with HORIZONTAL Badge */}
                    {(() => {
                        const dimX = hubX2 + 24;
                        const badgeX = dimX + 10;
                        const badgeY = longCy - 20;
                        return (
                            <g>
                                {/* Extension witness lines */}
                                <line x1={hubX2 + 2} y1={longCy - rHub} x2={dimX + 6} y2={longCy - rHub} stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 2" />
                                <line x1={hubX2 + 2} y1={longCy + rHub} x2={dimX + 6} y2={longCy + rHub} stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 2" />
                                {/* Dimension line */}
                                <line x1={dimX} y1={longCy - rHub} x2={dimX} y2={longCy + rHub} stroke="#f59e0b" strokeWidth="1.8" markerStart="url(#dimArrowAmber)" markerEnd="url(#dimArrowAmber)" />
                                {/* HORIZONTAL BADGE - NO ROTATION */}
                                <rect x={badgeX} y={badgeY} width={130} height={40} rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
                                <text x={badgeX + 65} y={badgeY + 18} textAnchor="middle" fill="#fef08a" fontSize="13.5" fontWeight="900" fontFamily="monospace">
                                    Ø D_a = {hubOuterDia} mm
                                </text>
                                <text x={badgeX + 65} y={badgeY + 32} textAnchor="middle" fill="#f59e0b" fontSize="10.5" fontWeight="bold">
                                    {t12(language, 'Hub Outer Diameter', 'Göbek Dış Çapı')}
                                </text>
                            </g>
                        );
                    })()}

                    {/* 3. d_F (Temas / Sıkılık Çapı) - Left Vertical with HORIZONTAL Badge */}
                    {(() => {
                        const dimX = hubX1 - 24;
                        const badgeWidth = 142;
                        const badgeX = dimX - 10 - badgeWidth;
                        const badgeY = longCy - 20;
                        return (
                            <g>
                                {/* Extension witness lines from interface */}
                                <line x1={hubX1 - 2} y1={longCy - rShaft} x2={dimX - 6} y2={longCy - rShaft} stroke="#818cf8" strokeWidth="1.2" strokeDasharray="3 2" />
                                <line x1={hubX1 - 2} y1={longCy + rShaft} x2={dimX - 6} y2={longCy + rShaft} stroke="#818cf8" strokeWidth="1.2" strokeDasharray="3 2" />
                                {/* Dimension line with blue arrows */}
                                <line x1={dimX} y1={longCy - rShaft} x2={dimX} y2={longCy + rShaft} stroke="#818cf8" strokeWidth="2" markerStart="url(#dimArrowIndigo)" markerEnd="url(#dimArrowIndigo)" />
                                {/* HORIZONTAL BADGE - NO ROTATION */}
                                <rect x={badgeX} y={badgeY} width={badgeWidth} height={40} rx="6" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.5" />
                                <text x={badgeX + badgeWidth / 2} y={badgeY + 18} textAnchor="middle" fill="#e0e7ff" fontSize="13.5" fontWeight="900" fontFamily="monospace">
                                    Ø d_F = {contactDia} mm
                                </text>
                                <text x={badgeX + badgeWidth / 2} y={badgeY + 32} textAnchor="middle" fill="#818cf8" fontSize="10.5" fontWeight="bold">
                                    {t12(language, 'Contact Diameter', 'Temas (Sıkılık) Çapı')}
                                </text>
                            </g>
                        );
                    })()}

                    {/* 4. d_i (Mil İç Delik Çapı) if hollow */}
                    {rHollow > 0 && (() => {
                        const dimX = shaftX1 + 18;
                        return (
                            <g>
                                <line x1={dimX} y1={longCy - rHollow} x2={dimX} y2={longCy + rHollow} stroke="#38bdf8" strokeWidth="1.5" markerStart="url(#dimArrow)" markerEnd="url(#dimArrow)" />
                                <text x={dimX + 5} y={longCy + 4} fill="#38bdf8" fontSize="10.5" fontWeight="bold" fontFamily="monospace">
                                    Ø d_i={shaftInnerDia}
                                </text>
                            </g>
                        );
                    })()}
                </g>
            )}

            {/* Pane Divider (when both views are active) */}
            {showLong && showRad && (
                <line x1="525" y1="20" x2="525" y2="370" stroke="#334155" strokeWidth="1.5" strokeDasharray="6 4" />
            )}

            {/* VIEW 2: RADYAL ALIN KESİTİ (RADIAL TRANSVERSE SECTION) */}
            {showRad && (
                <g>
                    {/* View Title */}
                    <g transform={`translate(${radCx}, 24)`}>
                        <text textAnchor="middle" fill="#f8fafc" fontSize="13.5" fontWeight="800" letterSpacing="0.5">
                            {t12(language, 'RADIAL FACE SECTION (END VIEW)', 'RADYAL ALIN KESİTİ (ALIN GÖRÜNÜŞ)')}
                        </text>
                        <text textAnchor="middle" y="16" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">
                            {t12(language, 'Lamé stress distribution & radial pressure', 'Lamé gerilme dağılımı & radyal basınç')}
                        </text>
                    </g>

                    {/* Outer Hub Ring with Lamé Stress Gradient */}
                    <circle cx={radCx} cy={radCy} r={rHub} fill="url(#lameStressGrad)" stroke="#f59e0b" strokeWidth="2.2" />

                    {/* Shaft Outer & Fit Contact Zone */}
                    <circle
                        cx={radCx}
                        cy={radCy}
                        r={rShaft}
                        fill="#1e293b"
                        stroke="#818cf8"
                        strokeWidth="2.8"
                        strokeDasharray="6 3"
                    />

                    {/* Hollow Shaft Bore if present */}
                    {rHollow > 0 && (
                        <circle cx={radCx} cy={radCy} r={rHollow} fill="#020617" stroke="#38bdf8" strokeWidth="1.5" />
                    )}

                    {/* Center Crosshairs */}
                    <line x1={radCx - rHub - 15} y1={radCy} x2={radCx + rHub + 15} y2={radCy} stroke="#ef4444" strokeWidth="1.2" strokeDasharray="10 3 2 3" />
                    <line x1={radCx} y1={radCy - rHub - 15} x2={radCx} y2={radCy + rHub + 15} stroke="#ef4444" strokeWidth="1.2" strokeDasharray="10 3 2 3" />

                    {/* 8 Radial Pressure Vector Arrows acting on contact boundary */}
                    {radAngles.map((angle) => {
                        const rad = (angle * Math.PI) / 180;
                        const startR = rShaft + 15;
                        const endR = rShaft + 1;
                        const x1 = radCx + startR * Math.cos(rad);
                        const y1 = radCy + startR * Math.sin(rad);
                        const x2 = radCx + endR * Math.cos(rad);
                        const y2 = radCy + endR * Math.sin(rad);
                        return (
                            <line
                                key={`rad-arrow-${angle}`}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="#38bdf8"
                                strokeWidth="1.5"
                                markerEnd="url(#pressVector)"
                            />
                        );
                    })}

                    {/* Radial Annotations & Leaders */}
                    {/* Hub Outer Leader (Right Side) */}
                    {(() => {
                        const angleRad = -35 * (Math.PI / 180);
                        const startX = radCx + rHub * Math.cos(angleRad);
                        const startY = radCy + rHub * Math.sin(angleRad);
                        const kneeX = startX + 22;
                        const kneeY = startY - 22;
                        const badgeX = kneeX + 6;
                        const badgeY = kneeY - 20;
                        return (
                            <g>
                                <line x1={startX} y1={startY} x2={kneeX} y2={kneeY} stroke="#f59e0b" strokeWidth="1.8" />
                                <line x1={kneeX} y1={kneeY} x2={badgeX} y2={kneeY} stroke="#f59e0b" strokeWidth="1.8" />
                                <rect x={badgeX} y={badgeY} width={135} height={40} rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
                                <text x={badgeX + 67} y={badgeY + 18} textAnchor="middle" fill="#fef08a" fontSize="13.5" fontWeight="900" fontFamily="monospace">
                                    Ø D_a = {hubOuterDia} mm
                                </text>
                                <text x={badgeX + 67} y={badgeY + 32} textAnchor="middle" fill="#f59e0b" fontSize="10.5" fontWeight="bold">
                                    {t12(language, 'Hub Outer Diameter', 'Göbek Dış Çapı')}
                                </text>
                            </g>
                        );
                    })()}

                    {/* Contact Diameter Leader (Left Side) */}
                    {(() => {
                        const angleRad = -145 * (Math.PI / 180);
                        const startX = radCx + rShaft * Math.cos(angleRad);
                        const startY = radCy + rShaft * Math.sin(angleRad);
                        const kneeX = startX - 22;
                        const kneeY = startY - 22;
                        const badgeWidth = 142;
                        const badgeX = kneeX - 6 - badgeWidth;
                        const badgeY = kneeY - 20;
                        return (
                            <g>
                                <line x1={startX} y1={startY} x2={kneeX} y2={kneeY} stroke="#818cf8" strokeWidth="2" />
                                <line x1={kneeX} y1={kneeY} x2={kneeX - 6} y2={kneeY} stroke="#818cf8" strokeWidth="2" />
                                <rect x={badgeX} y={badgeWidth ? badgeY : 0} width={badgeWidth} height={40} rx="6" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.5" />
                                <text x={badgeX + badgeWidth / 2} y={badgeY + 18} textAnchor="middle" fill="#e0e7ff" fontSize="13.5" fontWeight="900" fontFamily="monospace">
                                    Ø d_F = {contactDia} mm
                                </text>
                                <text x={badgeX + badgeWidth / 2} y={badgeY + 32} textAnchor="middle" fill="#818cf8" fontSize="10.5" fontWeight="bold">
                                    {t12(language, 'Contact Diameter', 'Temas Çapı')}
                                </text>
                            </g>
                        );
                    })()}

                    {/* Bottom Status Card inside SVG */}
                    <g transform={`translate(${radCx}, 335)`}>
                        <rect x="-135" y="-18" width="270" height="36" rx="8" fill="#0f172a" stroke={isSafe ? '#10b981' : '#f43f5e'} strokeWidth="2" />
                        <text x="0" y="4" textAnchor="middle" fill={isSafe ? '#34d399' : '#f87171'} fontSize="13" fontWeight="900" fontFamily="monospace">
                            p_f = {formatEngineeringValue(contactPressure, precision, false)} MPa ({isSafe ? t12(language, 'SAFE REGION', 'GÜVENLİ BÖLGE') : t12(language, 'YIELD EXCEEDED', 'AŞIRI GERİLME')})
                        </text>
                    </g>
                </g>
            )}
        </svg>
    );
}
