'use client';

import React, { useState, useMemo } from 'react';
import {
    Settings,
    CheckCircle2,
    XCircle,
    Layers,
    Zap,
    Copy,
    Check,
    Wrench,
    Circle,
    Square,
    BoxSelect,
    Droplet,
    ShieldCheck,
    Activity,
    Info,
    ArrowRight
} from 'lucide-react';
import {
    calculateKeywayConnection,
    getStandardKeywayDimensions,
    KEYWAY_MATERIALS,
    KeywayMaterial,
    KeyForm
} from '@/lib/calculations/keywayConnection';
import {
    ImbusSVG,
    CirclipSVG,
    CenterDrillSVG,
    CountersinkSVG
} from './MachiningDrawings';
import KeywayVisualizer from '@/components/visualizers/KeywayVisualizer';
import { UndercutVisualizer } from '@/components/visualizers/UndercutVisualizer';
import {
    DIN_912,
    DIN_332,
    DIN_7991,
    getKeywayTolerances,
    getCirclipData,
    getUndercutData,
    getClearanceHole,
    type KeywayFitClass
} from '@/data/machiningStandards';
import { useI18nStore, type Language } from '@/store/i18nStore';
import { getMachiningDetailsStrings } from '@/locales/machiningDetailsTranslations';
import { t12 } from '@/locales/t12';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

const getKeywayMaterialLabel = (id: string, defaultName: string, lang: Language) => {
    switch (id) {
        case 'c45':
            return t12(lang, 'Carbon Steel C45 / 1.0503 (Standard Key Steel)', 'Karbon Çeliği C45 / 1.0503 (Standart Kama Çeliği)');
        case '42crmo4':
            return t12(lang, 'Quenched & Tempered Steel 42CrMo4 / 1.7225 (High Strength)', 'Islah Çeliği 42CrMo4 / 1.7225 (Yüksek Dayanımlı)');
        case 's275':
            return t12(lang, 'Structural Steel S275 / St 44 (General Machinery)', 'Yapı Çeliği S275 / St 44 (Genel İmalat)');
        case 's355':
            return t12(lang, 'Structural Steel S355 / St 52', 'Yapı Çeliği S355 / St 52');
        case 'gg25':
            return t12(lang, 'Grey Cast Iron GG-25 / EN-GJL-250 (Cast Hub)', 'Pik Döküm GG-25 / EN-GJL-250 (Dökme Gövde/Göbek)');
        case 'ggg40':
            return t12(lang, 'Ductile Iron GGG-40 / EN-GJS-400 (Impact Resistant)', 'Sfero Döküm GGG-40 / EN-GJS-400 (Darbe Dayanımlı)');
        case 'al6061':
            return t12(lang, 'Aluminum 6061-T6 (Lightweight Hub)', 'Alüminyum 6061-T6 (Hafif Yapı Göbeği)');
        default:
            return defaultName;
    }
};

export type MachiningHubTab = 'keyway' | 'circlip' | 'undercut' | 'centerdrill' | 'fasteners';

interface KeywayConnectionModuleProps {
    initialTab?: MachiningHubTab;
    initialKeywayView?: 'transverse' | 'longitudinal' | 'machining';
}

export default function KeywayConnectionModule({ initialTab = 'keyway', initialKeywayView = 'transverse' }: KeywayConnectionModuleProps) {
  const precision = useGlobalPrecision();
    const { language } = useI18nStore();
    const tMachining = getMachiningDetailsStrings(language);

    const [activeTab, setActiveTab] = useState<MachiningHubTab>(initialTab);
    const [keywayView, setKeywayView] = useState<'transverse' | 'longitudinal' | 'machining'>(initialKeywayView);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            if (tab && ['keyway', 'circlip', 'undercut', 'centerdrill', 'fasteners'].includes(tab)) {
                setActiveTab(tab as MachiningHubTab);
            }
            const view = params.get('view');
            if (view && ['transverse', 'longitudinal', 'machining'].includes(view)) {
                setKeywayView(view as 'transverse' | 'longitudinal' | 'machining');
            }
        }
    }, []);

    const handleTabChange = (tab: MachiningHubTab) => {
        setActiveTab(tab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    // =========================================================================
    // TAB 1: DIN 6885 KEYWAY STATE & CALCULATIONS
    // =========================================================================
    const [shaftDiameter, setShaftDiameter] = useState<number>(40);
    const [keyLength, setKeyLength] = useState<number>(60);
    const [keyCount, setKeyCount] = useState<1 | 2>(1);
    const [doubleKeyAngle, setDoubleKeyAngle] = useState<120 | 180>(180);
    const [keyForm, setKeyForm] = useState<KeyForm>('A');
    const [showFormulas, setShowFormulas] = useState<boolean>(true);

    const [inputMode, setInputMode] = useState<'torque' | 'power_speed'>('torque');
    const [torqueInput, setTorqueInput] = useState<number>(450);
    const [powerInput, setPowerInput] = useState<number>(15);
    const [speedInput, setSpeedInput] = useState<number>(1450);
    const [serviceFactor, setServiceFactor] = useState<number>(1.25);

    const [hubMaterialId, setHubMaterialId] = useState<string>('gg25');
    const [shaftMaterialId, setShaftMaterialId] = useState<string>('c45');
    const [keyMaterialId, setKeyMaterialId] = useState<string>('c45');

    const [fitClass, setFitClass] = useState<KeywayFitClass>('normal');
    const [useCustomDims, setUseCustomDims] = useState<boolean>(false);
    const [customB, setCustomB] = useState<number>(12);
    const [customH, setCustomH] = useState<number>(8);
    const [customT1, setCustomT1] = useState<number>(5.0);
    const [customT2, setCustomT2] = useState<number>(3.3);
    const [copiedSummary, setCopiedSummary] = useState(false);

    const calculatedTorque = useMemo(() => {
        if (inputMode === 'torque') return torqueInput;
        if (speedInput <= 0) return 0;
        return Math.round((9549.3 * powerInput) / speedInput);
    }, [inputMode, torqueInput, powerInput, speedInput]);

    const standardDims = useMemo(() => {
        return getStandardKeywayDimensions(shaftDiameter);
    }, [shaftDiameter]);

    const keywayTolerances = useMemo(() => {
        return getKeywayTolerances(standardDims.b, fitClass);
    }, [standardDims.b, fitClass]);

    const keywayResults = useMemo(() => {
        return calculateKeywayConnection({
            shaftDiameter,
            keyLength,
            keyCount,
            keyForm,
            torque: calculatedTorque,
            serviceFactor,
            hubMaterialId,
            shaftMaterialId,
            keyMaterialId,
            customDimensions: useCustomDims ? {
                b: customB,
                h: customH,
                t1: customT1,
                t2: customT2
            } : undefined
        });
    }, [
        shaftDiameter, keyLength, keyCount, keyForm, calculatedTorque, serviceFactor,
        hubMaterialId, shaftMaterialId, keyMaterialId, useCustomDims, customB, customH, customT1, customT2
    ]);

    const copyKeywayReport = () => {
        const text = `=== ${t12(language, 'DIN 6885 PARALLEL KEYWAY CALCULATION REPORT', 'DIN 6885 PARALEL KAMA HESAP RAPORU')} ===
${t12(language, 'Shaft Dia', 'Mil Çapı')}: Ø${shaftDiameter} mm | ${t12(language, 'Key Section', 'Kama Kesiti')}: ${standardDims.b}x${standardDims.h} mm | ${t12(language, 'Length', 'Boy')}: ${keyLength} mm (${keyForm === 'A' ? t12(language, 'Form A Round Ends', 'Form A Yuvarlak Uç') : t12(language, 'Form B Square Ends', 'Form B Düz Uç')})
${t12(language, 'Effective Length (l_e)', 'Etkin Boy (l_e)')}: ${keywayResults.effectiveLength} mm | ${t12(language, 'Key Count', 'Adet')}: ${keyCount}
${t12(language, 'Calculated Torque', 'Hesaplanan Tork')}: ${calculatedTorque} N·m (K_A = ${serviceFactor})
${t12(language, 'Tangential Force (F_t)', 'Teğetsel Kuvvet (F_t)')}: ${formatEngineeringValue(keywayResults.tangentialForce, precision, true)} N
${t12(language, 'Hub Surface Pressure (p_hub)', 'Göbek Yüzey Basıncı (p_hub)')}: ${formatEngineeringValue(keywayResults.pHub, precision, true)} MPa / ${keywayResults.allowablePHub} MPa (${t12(language, 'Safety', 'Emniyet')}: ${formatEngineeringValue(keywayResults.safetyFactorHub, precision, true)})
${t12(language, 'Key Shear Stress (tau)', 'Kama Kayma Gerilmesi (tau)')}: ${formatEngineeringValue(keywayResults.tauKey, precision, true)} MPa / ${keywayResults.allowableTauKey} MPa (${t12(language, 'Safety', 'Emniyet')}: ${formatEngineeringValue(keywayResults.safetyFactorShear, precision, true)})
${t12(language, 'Overall Status', 'Genel Durum')}: ${keywayResults.isSafe ? t12(language, 'SAFE', 'GÜVENLİ') : t12(language, 'WARNING: OVERLOAD', 'UYARI: AŞIRI YÜK')}`;
        navigator.clipboard.writeText(text);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
    };

    // =========================================================================
    // TAB 2: CIRCLIPS (DIN 471 & DIN 472) STATE
    // =========================================================================
    const [circlipType, setCirclipType] = useState<'shaft' | 'bore'>('shaft');
    const [circlipD, setCirclipD] = useState<number>(40);
    const isShaft = circlipType === 'shaft';
    const circlipData = useMemo(() => getCirclipData(circlipD, isShaft), [circlipD, isShaft]);
    const circlipQuickDiameters = [10, 15, 20, 25, 30, 40, 50, 65, 80, 100, 150, 200];

    // Estimated axial capacity F_N (kN) based on groove bearing limit: F_N = pi * d * t * sigma_perm
    const circlipAxialCapacityKn = useMemo(() => {
        if (!circlipData) return 0;
        const depth = circlipData.depth;
        const cap = (Math.PI * circlipD * depth * 240) / (1.5 * 1000);
        return parseFloat(cap.toFixed(2));
    }, [circlipD, circlipData]);

    // =========================================================================
    // TAB 3: UNDERCUTS (DIN 509) STATE
    // =========================================================================
    const [undercutForm, setUndercutForm] = useState<'E' | 'F' | 'G' | 'H'>('E');
    const [undercutDSmall, setUndercutDSmall] = useState<number>(40);
    const undercutData = useMemo(() => getUndercutData(undercutDSmall, undercutForm), [undercutDSmall, undercutForm]);
    const undercutQuickDiameters = [10, 16, 25, 40, 50, 80, 100, 125];

    // =========================================================================
    // TAB 4: CENTER DRILLS (DIN 332) STATE
    // =========================================================================
    const [centerDrillForm, setCenterDrillForm] = useState<'A' | 'B' | 'R'>('B');
    const availableCenterDrillSizes = useMemo(() => DIN_332.filter(d => d.form === centerDrillForm), [centerDrillForm]);
    const [centerDrillType, setCenterDrillType] = useState<string>(
        DIN_332.find(d => d.form === 'B' && d.d1 === 2.5)?.type || 'B 2.5 x 5.3'
    );
    const centerDrillData = useMemo(() => {
        return availableCenterDrillSizes.find(d => d.type === centerDrillType) || availableCenterDrillSizes[0];
    }, [availableCenterDrillSizes, centerDrillType]);

    const handleCenterDrillFormChange = (newForm: 'A' | 'B' | 'R') => {
        setCenterDrillForm(newForm);
        const match = DIN_332.find(d => d.form === newForm && d.d1 === centerDrillData.d1);
        setCenterDrillType(match ? match.type : DIN_332.filter(d => d.form === newForm)[0].type);
    };

    // =========================================================================
    // TAB 5: FASTENERS (DIN 912 & DIN 74 / DIN 7991) STATE
    // =========================================================================
    const [fastenerType, setFastenerType] = useState<'imbus' | 'countersink'>('imbus');
    const [imbusSize, setImbusSize] = useState<string>('M10');
    const [holeSeries, setHoleSeries] = useState<'fine' | 'normal' | 'coarse'>('normal');
    const imbusData = useMemo(() => DIN_912.find(d => d.size === imbusSize) || DIN_912[0], [imbusSize]);
    const imbusClearance = useMemo(() => getClearanceHole(imbusSize, holeSeries), [imbusSize, holeSeries]);
    const quickImbus = ['M4', 'M5', 'M6', 'M8', 'M10', 'M12', 'M16', 'M20'];

    const [csSize, setCsSize] = useState<string>('M8');
    const csData = useMemo(() => DIN_7991.find(d => d.size === csSize) || DIN_7991[0], [csSize]);
    const csClearance = useMemo(() => getClearanceHole(csSize, 'normal'), [csSize]);
    const quickCs = ['M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12'];

    // Estimated tightening torque (Nm) for 8.8, 10.9, 12.9
    const boltTorqueMap: Record<string, { t88: number; t109: number; t129: number }> = {
        M3: { t88: 1.2, t109: 1.8, t129: 2.1 },
        M4: { t88: 2.9, t109: 4.1, t129: 4.9 },
        M5: { t88: 5.7, t109: 8.1, t129: 9.7 },
        M6: { t88: 9.9, t109: 14.1, t129: 17.0 },
        M8: { t88: 24.0, t109: 34.0, t129: 41.0 },
        M10: { t88: 48.0, t109: 68.0, t129: 81.0 },
        M12: { t88: 83.0, t109: 117.0, t129: 141.0 },
        M16: { t88: 200.0, t109: 285.0, t129: 340.0 },
        M20: { t88: 390.0, t109: 550.0, t129: 660.0 },
    };
    const activeBoltTorques = boltTorqueMap[fastenerType === 'imbus' ? imbusSize : csSize] || { t88: 24, t109: 34, t129: 41 };

    const TABS_CONFIG = [
        { id: 'keyway', short: 'DIN 6885', label: t12(language, 'DIN 6885 Parallel Key', 'DIN 6885 Paralel Kama'), icon: Square },
        { id: 'circlip', short: 'DIN 471/472', label: t12(language, 'DIN 471/472 Retaining Ring', 'DIN 471/472 Emniyet Segmanı'), icon: Circle },
        { id: 'undercut', short: 'DIN 509', label: t12(language, 'DIN 509 Relief Undercut', 'DIN 509 Taşlama Kanalı'), icon: BoxSelect },
        { id: 'centerdrill', short: 'DIN 332', label: t12(language, 'DIN 332 Center Hole', 'DIN 332 Torna Puntası'), icon: Droplet },
        { id: 'fasteners', short: 'DIN 912 / 74', label: t12(language, 'DIN 912 / 74 Fasteners', 'DIN 912 / 74 Civata Yuvaları'), icon: Wrench },
    ];

    return (
        <div className="w-full h-screen bg-[var(--bg-0)] text-[var(--ink)] flex flex-col font-sans overflow-hidden">
            {/* ═══ 3-COLUMN GOLDEN COCKPIT ARCHITECTURE ═══ */}
            <div className="flex-1 w-full flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden">

                {/* ═════════════════════════════════════════════════════════════════════ */}
                {/* 1. LEFT COLUMN: PERSISTENT HEADER & TAB CONTROLS                      */}
                {/* ═════════════════════════════════════════════════════════════════════ */}
                <div className="w-full lg:w-80 shrink-0 flex flex-col bg-[var(--bg-1)]/90 border-b lg:border-b-0 lg:border-r border-[var(--line)] p-3.5 space-y-3.5 overflow-y-auto custom-scrollbar">
                    
                    {/* Header Card with Inline Standards & Persistent 5-Tabs Switcher */}
                    <div className="p-4 rounded-2xl bg-[var(--bg-1)] border border-[var(--line)] shadow-xl space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)] shrink-0">
                                <Layers size={22} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-sm font-bold text-[var(--ink)] tracking-wide flex items-center gap-2 flex-wrap">
                                    <span>
                                        {activeTab === 'keyway' && t12(language, 'Parallel Key & Hub', 'Paralel Kama & Göbek')}
                                        {activeTab === 'circlip' && t12(language, 'Retaining Rings', 'Emniyet Segmanları')}
                                        {activeTab === 'undercut' && t12(language, 'Relief Undercuts', 'Taşlama Oyukları')}
                                        {activeTab === 'centerdrill' && t12(language, 'Center Drill Holes', 'Torna Punta Delikleri')}
                                        {activeTab === 'fasteners' && t12(language, 'Fastener Recesses', 'Cıvata Yuvaları')}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--cyan)]/15 text-[var(--cyan)] font-mono font-semibold">
                                        {activeTab === 'keyway' && 'DIN 6885-1'}
                                        {activeTab === 'circlip' && (isShaft ? 'DIN 471' : 'DIN 472')}
                                        {activeTab === 'undercut' && `DIN 509 Form ${undercutForm}`}
                                        {activeTab === 'centerdrill' && `DIN 332-1 Form ${centerDrillForm}`}
                                        {activeTab === 'fasteners' && (fastenerType === 'imbus' ? 'DIN 912' : 'DIN 74 / 7991')}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--cyan)]/15 text-[var(--cyan)] font-mono font-semibold">
                                        {activeTab === 'keyway' && 'ISO 3912'}
                                        {activeTab === 'circlip' && 'ISO 3075'}
                                        {activeTab === 'undercut' && 'ISO 2768'}
                                        {activeTab === 'centerdrill' && 'ISO 6411'}
                                        {activeTab === 'fasteners' && (fastenerType === 'imbus' ? 'ISO 4762' : 'ISO 10642')}
                                    </span>
                                </h1>
                                <p className="text-[11px] text-[var(--alu-dim)] mt-0.5 truncate">
                                    {activeTab === 'keyway' && t12(language, 'Shaft-Hub DIN 6885 Connection Analysis', 'Mil-Göbek DIN 6885 Mukavemet Kokpiti')}
                                    {activeTab === 'circlip' && t12(language, 'Axial Retaining Ring & Groove Calculation', 'Eksenel Emniyet Segmanı ve Yuvası')}
                                    {activeTab === 'undercut' && t12(language, 'Grinding Relief Undercut Geometry (DIN 509)', 'DIN 509 Taşlama Serbest Oyuk Formları')}
                                    {activeTab === 'centerdrill' && t12(language, 'Machining Center Hole & Chamfers (DIN 332)', 'DIN 332 Torna Punta ve Havşa Geometrisi')}
                                    {activeTab === 'fasteners' && t12(language, 'Cap Screw Counterbore & Countersink Standards', 'DIN 912 / 74 Cıvata Yuvası ve Havşaları')}
                                </p>
                            </div>
                        </div>

                        {/* Compact Hub Tabs (Always visible & interactive on every tab!) */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 bg-[var(--bg-2)] p-1.5 rounded-xl border border-[var(--line)] text-[11px] font-semibold">
                            {TABS_CONFIG.map((t) => {
                                const Icon = t.icon;
                                const isActive = activeTab === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        title={t.label}
                                        onClick={() => handleTabChange(t.id as MachiningHubTab)}
                                        className={`flex items-center justify-center gap-1.5 min-h-[42px] sm:min-h-[38px] py-2 px-2.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                                            isActive
                                                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold shadow-md '
                                                : 'text-[var(--alu-dim)] hover:text-[var(--ink)] hover:bg-[var(--bg-1)]'
                                        }`}
                                    >
                                        <Icon size={14} className="shrink-0" />
                                        <span>{t.short}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ═══ TAB 1: KEYWAY CONTROLS ═══ */}
                    {activeTab === 'keyway' && (
                        <div className="space-y-4">
                            {/* Shaft & Key Dimensions Card */}
                            <div className="p-5 rounded-2xl bg-[var(--bg-1)] border border-[var(--line)] shadow-xl space-y-4">
                                <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                                    <h3 className="text-xs font-bold text-[var(--cyan)] uppercase tracking-wider flex items-center gap-2">
                                        <Settings size={15} /> {t12(language, '1. Shaft & Key Dimensions', '1. Mil & Kama Boyutları')}
                                    </h3>
                                    <span className="text-[10px] text-[var(--muted)] font-mono">DIN 6885-1</span>
                                </div>

                                {/* Shaft Diameter Slider */}
                                <div>
                                    <div className="flex justify-between items-center mb-1 text-xs">
                                        <span className="text-[var(--alu)] font-medium">{t12(language, 'Shaft Diameter (d):', 'Mil Çapı (d):')}</span>
                                        <span className="font-mono text-[var(--cyan)] font-bold">{shaftDiameter} mm</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={6}
                                        max={200}
                                        value={shaftDiameter}
                                        onChange={(e) => setShaftDiameter(Number(e.target.value))}
                                        className="w-full accent-[var(--cyan)] bg-[var(--bg-3)] h-1.5 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <p className="text-[11px] text-[var(--alu-dim)] font-mono mt-1">
                                        {t12(language, 'Standard Cross Section:', 'Standart Kesit:')} {standardDims.b} x {standardDims.h} mm (t1={standardDims.t1} mm, t2={standardDims.t2} mm)
                                    </p>
                                </div>

                                {/* Key Length */}
                                <div>
                                    <div className="flex justify-between items-center mb-1 text-xs">
                                        <span className="text-[var(--alu)] font-medium">{t12(language, 'Key Length (L):', 'Kama Boyu (L):')}</span>
                                        <span className="font-mono text-[var(--cyan)] font-bold">{keyLength} mm</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={10}
                                        max={250}
                                        step={2}
                                        value={keyLength}
                                        onChange={(e) => setKeyLength(Number(e.target.value))}
                                        className="w-full accent-[var(--cyan)] bg-[var(--bg-3)] h-1.5 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <p className="text-[10px] text-[var(--muted)] font-mono mt-0.5">
                                        {t12(language, 'Effective Bearing Length (l_e):', 'Etkin Taşıma Boyu (l_e):')} {keywayResults.effectiveLength} mm
                                    </p>
                                </div>

                                {/* Form & Count Toggle */}
                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--line)]">
                                    <div>
                                        <label className="text-[11px] font-bold text-[var(--alu)] block mb-1">{t12(language, 'Key Form', 'Kama Formu')}</label>
                                        <div className="grid grid-cols-2 gap-1 bg-[var(--bg-2)] p-1 rounded-lg border border-[var(--line)]">
                                            <button
                                                type="button"
                                                onClick={() => setKeyForm('A')}
                                                className={`py-1 text-xs font-mono font-bold rounded cursor-pointer ${keyForm === 'A' ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'}`}
                                            >
                                                Form A
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setKeyForm('B')}
                                                className={`py-1 text-xs font-mono font-bold rounded cursor-pointer ${keyForm === 'B' ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'}`}
                                            >
                                                Form B
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-[var(--alu)] block mb-1">{t12(language, 'Key Count', 'Kama Sayısı')}</label>
                                        <div className="grid grid-cols-2 gap-1 bg-[var(--bg-2)] p-1 rounded-lg border border-[var(--line)]">
                                            <button
                                                type="button"
                                                onClick={() => setKeyCount(1)}
                                                className={`py-1 text-xs font-mono font-bold rounded cursor-pointer ${keyCount === 1 ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'}`}
                                            >
                                                {t12(language, '1 Key', '1 Kama')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setKeyCount(2)}
                                                className={`py-1 text-xs font-mono font-bold rounded cursor-pointer ${keyCount === 2 ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'}`}
                                            >
                                                {t12(language, '2 Keys', '2 Kama')}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {keyCount === 2 && (
                                    <div>
                                        <label className="text-[11px] font-bold text-[var(--alu)] block mb-1">{t12(language, 'Angle Between Keys (DIN 6885)', 'Kamalar Arası Açı (DIN 6885)')}</label>
                                        <div className="grid grid-cols-2 gap-2 bg-[var(--bg-2)] p-1 rounded-lg border border-[var(--line)] text-xs font-mono">
                                            <button
                                                type="button"
                                                onClick={() => setDoubleKeyAngle(180)}
                                                className={`py-1 rounded cursor-pointer ${doubleKeyAngle === 180 ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold' : 'text-[var(--alu-dim)]'}`}
                                            >
                                                180° (Simetrik)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDoubleKeyAngle(120)}
                                                className={`py-1 rounded cursor-pointer ${doubleKeyAngle === 120 ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold' : 'text-[var(--alu-dim)]'}`}
                                            >
                                                120° (DIN)
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Custom / Non-standard Dimensions Toggle */}
                                <div className="pt-2 border-t border-[var(--line)]">
                                    <label className="flex items-center gap-2 text-xs text-[var(--alu)] cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={useCustomDims}
                                            onChange={(e) => setUseCustomDims(e.target.checked)}
                                            className="rounded accent-[var(--cyan)]"
                                        />
                                        <span>{t12(language, 'Custom / Non-Standard Keyway Dimensions', 'Özel / Standart Dışı Kama Ölçüleri')}</span>
                                    </label>
                                    {useCustomDims && (
                                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[var(--line)] font-mono text-xs">
                                            <div>
                                                <span className="text-[10px] text-[var(--alu-dim)] block">b ({t12(language, 'Width', 'Genişlik')}):</span>
                                                <input
                                                    type="number"
                                                    value={customB}
                                                    onChange={(e) => setCustomB(Number(e.target.value))}
                                                    className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-2 py-1 text-[var(--cyan)]"
                                                />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-[var(--alu-dim)] block">h ({t12(language, 'Height', 'Yükseklik')}):</span>
                                                <input
                                                    type="number"
                                                    value={customH}
                                                    onChange={(e) => setCustomH(Number(e.target.value))}
                                                    className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-2 py-1 text-[var(--cyan)]"
                                                />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-[var(--alu-dim)] block">t1 ({t12(language, 'Shaft Depth', 'Mil Derinliği')}):</span>
                                                <input
                                                    type="number"
                                                    step={0.1}
                                                    value={customT1}
                                                    onChange={(e) => setCustomT1(Number(e.target.value))}
                                                    className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-2 py-1 text-[var(--cyan)]"
                                                />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-[var(--alu-dim)] block">t2 ({t12(language, 'Hub Depth', 'Göbek Derinliği')}):</span>
                                                <input
                                                    type="number"
                                                    step={0.1}
                                                    value={customT2}
                                                    onChange={(e) => setCustomT2(Number(e.target.value))}
                                                    className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-2 py-1 text-[var(--cyan)]"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Transmitted Load & Materials Card */}
                            <div className="p-5 rounded-2xl bg-[var(--bg-1)] border border-[var(--line)] shadow-xl space-y-4">
                                <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                                    <h3 className="text-xs font-bold text-[var(--cyan)] uppercase tracking-wider flex items-center gap-2">
                                        <Zap size={15} /> {t12(language, '2. Transmitted Load & Materials', '2. İletilen Yük & Malzemeler')}
                                    </h3>
                                    <span className="text-[10px] text-[var(--muted)] font-mono">DIN 6885</span>
                                </div>

                                {/* Torque / Power Mode */}
                                <div className="grid grid-cols-2 gap-1 bg-[var(--bg-2)] p-1 rounded-xl border border-[var(--line)] text-xs font-semibold">
                                    <button
                                        type="button"
                                        onClick={() => setInputMode('torque')}
                                        className={`py-1.5 rounded-lg cursor-pointer transition-all ${inputMode === 'torque' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold' : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'}`}
                                    >
                                        {t12(language, 'Direct Torque', 'Doğrudan Tork')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setInputMode('power_speed')}
                                        className={`py-1.5 rounded-lg cursor-pointer transition-all ${inputMode === 'power_speed' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold' : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'}`}
                                    >
                                        {t12(language, 'Power / Speed', 'Güç / Devir')}
                                    </button>
                                </div>

                                {inputMode === 'torque' ? (
                                    <div>
                                        <div className="flex justify-between items-center mb-1 text-xs">
                                            <span className="text-[var(--alu)]">{t12(language, 'Nominal Torque (N·m):', 'Nominal Tork (N·m):')}</span>
                                            <span className="font-mono text-[var(--cyan)] font-bold">{torqueInput} N·m</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={torqueInput}
                                            onChange={(e) => setTorqueInput(Math.max(1, Number(e.target.value)))}
                                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-3 py-1.5 text-[var(--ink)] font-mono text-sm"
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="text-[11px] text-[var(--alu)] block mb-1">{t12(language, 'Power (kW):', 'Güç (kW):')}</span>
                                            <input
                                                type="number"
                                                value={powerInput}
                                                onChange={(e) => setPowerInput(Math.max(0.1, Number(e.target.value)))}
                                                className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-2 py-1 text-[var(--ink)] font-mono text-xs"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-[var(--alu)] block mb-1">{t12(language, 'Speed (RPM):', 'Devir (d/d):')}</span>
                                            <input
                                                type="number"
                                                value={speedInput}
                                                onChange={(e) => setSpeedInput(Math.max(1, Number(e.target.value)))}
                                                className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-2 py-1 text-[var(--ink)] font-mono text-xs"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Service Factor */}
                                <div>
                                    <div className="flex justify-between items-center mb-1 text-xs">
                                        <span className="text-[var(--alu)]">{t12(language, 'Application Factor (K_A):', 'İşletme Faktörü (K_A):')}</span>
                                        <span className="font-mono text-[var(--warn)] font-bold">{serviceFactor}</span>
                                    </div>
                                    <select
                                        value={serviceFactor}
                                        onChange={(e) => setServiceFactor(Number(e.target.value))}
                                        className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-3 py-1.5 text-xs text-[var(--ink)]"
                                    >
                                        <option value={1.0}>{t12(language, '1.0 - Uniform / Smooth (Electric Motor, Centrifugal Pump)', '1.0 - Düzgün / Sabit (Elektrik Motoru, Santrifüj Pompa)')}</option>
                                        <option value={1.25}>{t12(language, '1.25 - Light Shocks (Conveyor, Machine Tool)', '1.25 - Hafif Darbeli (Konveyör, Takım Tezgahı)')}</option>
                                        <option value={1.5}>{t12(language, '1.50 - Moderate Shocks (Crane, Piston Pump)', '1.50 - Orta Darbeli (Vinç, Pistonlu Pompa)')}</option>
                                        <option value={2.0}>{t12(language, '2.00 - Heavy Shocks (Crusher, Mill, Press)', '2.00 - Ağır Darbeli (Kırıcı, Değirmen, Pres)')}</option>
                                    </select>
                                </div>

                                {/* Materials */}
                                <div className="space-y-2 pt-2 border-t border-[var(--line)]">
                                    <div>
                                        <label className="text-[11px] font-medium text-[var(--alu-dim)] block mb-1">
                                            {t12(language, 'Hub Material (p_allow):', 'Göbek Malzemesi (p_em):')}
                                        </label>
                                        <select
                                            value={hubMaterialId}
                                            onChange={(e) => setHubMaterialId(e.target.value)}
                                            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--ink)] truncate"
                                        >
                                            {Object.values(KEYWAY_MATERIALS).map((m: KeywayMaterial) => (
                                                <option key={m.id} value={m.id}>
                                                    {getKeywayMaterialLabel(m.id, m.name, language)} ({m.p_adm} MPa)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ TAB 2: CIRCLIP CONTROLS ═══ */}
                    {activeTab === 'circlip' && (
                        <div className="space-y-4">
                            <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-2xl p-5 space-y-4 shadow-xl">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCirclipType('shaft')}
                                        className={`py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer ${
                                            circlipType === 'shaft'
                                                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md '
                                                : 'bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-[var(--ink)] border border-[var(--line)]'
                                        }`}
                                    >
                                        {t12(language, 'Shaft Circlip (DIN 471)', 'Mil Segmanı (DIN 471)')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCirclipType('bore')}
                                        className={`py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer ${
                                            circlipType === 'bore'
                                                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md '
                                                : 'bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-[var(--ink)] border border-[var(--line)]'
                                        }`}
                                    >
                                        {t12(language, 'Bore Circlip (DIN 472)', 'Delik Segmanı (DIN 472)')}
                                    </button>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--alu-dim)] mb-2 block">
                                        {t12(language, 'Quick Diameter Select', 'Hızlı Çap Seçimi')}
                                    </label>
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {circlipQuickDiameters.map(sz => (
                                            <button
                                                key={sz}
                                                type="button"
                                                onClick={() => setCirclipD(sz)}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                                    circlipD === sz
                                                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md '
                                                        : 'bg-[var(--bg-2)] text-[var(--alu-dim)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)] border border-[var(--line)]'
                                                }`}
                                            >
                                                Ø{sz}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center mb-1 text-xs">
                                        <span className="text-[var(--alu)] font-medium">{t12(language, 'Nominal Diameter (d1):', 'Nominal Çap (d1):')}</span>
                                        <span className="font-mono text-[var(--cyan)] font-bold">Ø{circlipD} mm</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={isShaft ? 4 : 8}
                                        max={200}
                                        value={circlipD}
                                        onChange={(e) => setCirclipD(Number(e.target.value))}
                                        className="w-full accent-[var(--cyan)] bg-[var(--bg-3)] h-1.5 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ TAB 3: UNDERCUT CONTROLS ═══ */}
                    {activeTab === 'undercut' && (
                        <div className="space-y-4">
                            <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-2xl p-5 space-y-4 shadow-xl">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--alu-dim)] mb-2 block">
                                        {t12(language, 'Grinding Relief Undercut Form (DIN 509)', 'Taşlama Serbest Oyuk Formu (DIN 509)')}
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['E', 'F', 'G', 'H'] as const).map((f) => (
                                            <button
                                                key={f}
                                                type="button"
                                                onClick={() => setUndercutForm(f)}
                                                className={`p-2.5 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer flex flex-col items-start ${
                                                    undercutForm === f
                                                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md '
                                                        : 'bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-[var(--ink)] border border-[var(--line)]'
                                                }`}
                                            >
                                                <span className="font-black">FORM {f}</span>
                                                <span className="text-[10px] font-normal opacity-80">
                                                    {f === 'E' && t12(language, 'Cylindrical Only', 'Yalnız Silindirik')}
                                                    {f === 'F' && t12(language, 'Cylinder + Face', 'Silindirik + Alın')}
                                                    {f === 'G' && t12(language, '55° Face Relief', '55° Açılı Alın')}
                                                    {f === 'H' && t12(language, '60° Face Relief', '60° Açılı Alın')}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--alu-dim)] mb-2 block">
                                        {t12(language, 'Shaft Diameter (d₁)', 'Mil Çapı (d₁)')}
                                    </label>
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {undercutQuickDiameters.map(sz => (
                                            <button
                                                key={sz}
                                                type="button"
                                                onClick={() => setUndercutDSmall(sz)}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                                    undercutDSmall === sz
                                                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md '
                                                        : 'bg-[var(--bg-2)] text-[var(--alu-dim)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)] border border-[var(--line)]'
                                                }`}
                                            >
                                                Ø{sz}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center mb-1 text-xs">
                                        <span className="text-[var(--alu)] font-medium">{t12(language, 'Shaft Diameter (d₁):', 'Mil Çapı (d₁):')}</span>
                                        <span className="font-mono text-[var(--cyan)] font-bold">Ø{undercutDSmall} mm</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={5}
                                        max={160}
                                        value={undercutDSmall}
                                        onChange={(e) => setUndercutDSmall(Number(e.target.value))}
                                        className="w-full accent-[var(--cyan)] bg-[var(--bg-3)] h-1.5 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ TAB 4: CENTER DRILL CONTROLS ═══ */}
                    {activeTab === 'centerdrill' && (
                        <div className="space-y-4">
                            <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-2xl p-5 space-y-4 shadow-xl">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--alu-dim)] mb-2 block">
                                        {t12(language, 'Center Drill Form (DIN 332-1)', 'Punta Form Seçimi (DIN 332-1)')}
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['A', 'B', 'R'] as const).map(f => (
                                            <button
                                                key={f}
                                                type="button"
                                                onClick={() => handleCenterDrillFormChange(f)}
                                                className={`py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer ${
                                                    centerDrillForm === f
                                                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md '
                                                        : 'bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-[var(--ink)] border border-[var(--line)]'
                                                }`}
                                            >
                                                Form {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--alu-dim)] mb-2 block">
                                        {t12(language, 'Center Drill Size', 'Punta Matkabı Boyutu')}
                                    </label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {availableCenterDrillSizes.map(sz => (
                                            <button
                                                key={sz.type}
                                                type="button"
                                                onClick={() => setCenterDrillType(sz.type)}
                                                className={`px-2 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                                    centerDrillType === sz.type
                                                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md '
                                                        : 'bg-[var(--bg-2)] text-[var(--alu-dim)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)] border border-[var(--line)]'
                                                }`}
                                            >
                                                Ø{sz.d1} mm
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ TAB 5: FASTENERS CONTROLS ═══ */}
                    {activeTab === 'fasteners' && (
                        <div className="space-y-4">
                            <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-2xl p-5 space-y-4 shadow-xl">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFastenerType('imbus')}
                                        className={`py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer ${
                                            fastenerType === 'imbus'
                                                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md '
                                                : 'bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-[var(--ink)] border border-[var(--line)]'
                                        }`}
                                    >
                                        DIN 912 ({t12(language, 'Socket Head', 'İmbus')})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFastenerType('countersink')}
                                        className={`py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer ${
                                            fastenerType === 'countersink'
                                                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md '
                                                : 'bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-[var(--ink)] border border-[var(--line)]'
                                        }`}
                                    >
                                        DIN 74 ({t12(language, 'Countersink', 'Havşa')})
                                    </button>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--alu-dim)] mb-2 block">
                                        {t12(language, 'Nominal Screw Size', 'Cıvata Anma Boyutu')}
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(fastenerType === 'imbus' ? quickImbus : quickCs).map(sz => (
                                            <button
                                                key={sz}
                                                type="button"
                                                onClick={() => fastenerType === 'imbus' ? setImbusSize(sz) : setCsSize(sz)}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                                                    (fastenerType === 'imbus' ? imbusSize : csSize) === sz
                                                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md '
                                                        : 'bg-[var(--bg-2)] text-[var(--alu-dim)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)] border border-[var(--line)]'
                                                }`}
                                            >
                                                {sz}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {fastenerType === 'imbus' && (
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--alu-dim)] mb-1 block">
                                            {t12(language, 'Clearance Hole Fit Series (ISO 273)', 'Geçiş Deliği Serisi (ISO 273)')}
                                        </label>
                                        <div className="grid grid-cols-3 gap-1 bg-[var(--bg-2)] p-1 rounded-lg border border-[var(--line)] text-xs font-mono">
                                            {(['fine', 'normal', 'coarse'] as const).map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setHoleSeries(s)}
                                                    className={`py-1 rounded cursor-pointer capitalize ${holeSeries === s ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold' : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ═════════════════════════════════════════════════════════════════════ */}
                {/* 2. CENTER COLUMN: HIGH-PRECISION CAD BLUEPRINT & DIAGRAMS            */}
                {/* ═════════════════════════════════════════════════════════════════════ */}
                <div className="flex-1 min-w-0 min-h-[500px] lg:min-h-0 flex flex-col bg-[var(--bg-0)] border-b lg:border-b-0 lg:border-r border-[var(--line)] p-4 overflow-y-auto custom-scrollbar">
                    
                    {/* TAB 1: KEYWAY BLUEPRINT */}
                    {activeTab === 'keyway' && (
                        <div className="space-y-4">
                            <KeywayVisualizer
                                d={shaftDiameter}
                                b={useCustomDims ? customB : standardDims.b}
                                h={useCustomDims ? customH : standardDims.h}
                                t1={useCustomDims ? customT1 : standardDims.t1}
                                t2={useCustomDims ? customT2 : standardDims.t2}
                                keyLength={keyLength}
                                effectiveLength={keywayResults.effectiveLength}
                                keyCount={keyCount}
                                doubleKeyAngle={doubleKeyAngle}
                                keyForm={keyForm}
                                torque={calculatedTorque}
                                pHub={keywayResults.pHub}
                                allowablePHub={keywayResults.allowablePHub}
                                tauKey={keywayResults.tauKey}
                                allowableTauKey={keywayResults.allowableTauKey}
                                isSafe={keywayResults.isSafe}
                                hideLegend={true}
                                initialViewMode={keywayView}
                            />

                            {/* Formulas & Calculation Walkthrough */}
                            <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)] space-y-3">
                                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                                    <h4 className="text-xs font-bold text-[var(--cyan)] uppercase tracking-wider flex items-center gap-1.5">
                                        <Zap size={14} /> {t12(language, 'Engineering Calculation Steps & DIN 6885 Stress Formulas', 'Mühendislik Hesap Adımları & DIN 6885 Formülleri')}
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => setShowFormulas(!showFormulas)}
                                        className="text-[10px] text-[var(--alu-dim)] hover:text-[var(--ink)] font-mono cursor-pointer"
                                    >
                                        {showFormulas ? t12(language, '[Collapse]', '[Gizle]') : t12(language, '[Expand]', '[Göster]')}
                                    </button>
                                </div>
                                {showFormulas && (
                                    <div className="space-y-2.5 text-xs font-mono text-[var(--ink)]">
                                        <div>
                                            <span className="text-[var(--alu-dim)] block text-[10px] font-bold">1. Tangential Force (F_t):</span>
                                            <code>F_t = 2 · T / d = 2 · {calculatedTorque} / {shaftDiameter / 1000} = {formatEngineeringValue(keywayResults.tangentialForce, precision, true)} N · F_d = F_t · K_A / (i·φ) = {formatEngineeringValue((keywayResults.tangentialForce * serviceFactor) / keywayResults.effectiveKeyFactor, precision, true)} N (i·φ = {keywayResults.effectiveKeyFactor}, DIN 6892)</code>
                                        </div>
                                        <div>
                                            <span className="text-[var(--alu-dim)] block text-[10px] font-bold">2. Effective Bearing Length (l_e):</span>
                                            <code>{keyForm === 'A' ? `Form A (Round Ends): l_e = L - b = ${keyLength} - ${standardDims.b} = ${keywayResults.effectiveLength} mm` : `Form B (Square Ends): l_e = L = ${keyLength} mm`}</code>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-[var(--line)]">
                                            <div>
                                                <span className="text-[var(--alu-dim)] block text-[10px] font-bold">3. Hub Contact Pressure (p_hub):</span>
                                                <code>p_hub = F_d / (l_e · (h − t1 − s)) = F_d / ({keywayResults.effectiveLength} · {formatEngineeringValue(keywayResults.contactHeightHub, 2, true)}) = {formatEngineeringValue(keywayResults.pHub, precision, true)} MPa</code>
                                                <code className="block mt-1">p_shaft = F_d / (l_e · (t1 − s)) = {formatEngineeringValue(keywayResults.pShaft, precision, true)} MPa (S = {formatEngineeringValue(keywayResults.safetyFactorShaft, precision, true)})</code>
                                                <span className="text-[10px] text-[var(--muted)] block">Allowable: {keywayResults.allowablePHub} MPa (Safety S_p = {formatEngineeringValue(keywayResults.safetyFactorHub, precision, true)})</span>
                                            </div>
                                            <div>
                                                <span className="text-[var(--alu-dim)] block text-[10px] font-bold">4. Key Shear Stress (τ):</span>
                                                <code>τ = F_d / (l_e · b) = {formatEngineeringValue(keywayResults.tauKey, precision, true)} MPa</code>
                                                <span className="text-[10px] text-[var(--muted)] block">Allowable: {keywayResults.allowableTauKey} MPa (Safety S_τ = {formatEngineeringValue(keywayResults.safetyFactorShear, precision, true)})</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: CIRCLIP BLUEPRINT */}
                    {activeTab === 'circlip' && (
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-1)] overflow-hidden shadow-2xl">
                                <CirclipSVG
                                    type={circlipType}
                                    data={{
                                        d: circlipD,
                                        d2: circlipData?.d2 ?? circlipD,
                                        m: circlipData?.m ?? '1.30',
                                        depth: circlipData?.depth ?? 0.55
                                    }}
                                    hideLegend={true}
                                />
                            </div>

                            {/* Standard Circlip Engineering Notes */}
                            <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)] space-y-2.5 font-mono text-xs">
                                <div className="flex items-center justify-between text-[var(--cyan)] font-bold border-b border-[var(--line)] pb-2">
                                    <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> {t12(language, 'DIN 471 / DIN 472 Retaining Ring Standard Criteria', 'DIN 471 / DIN 472 Emniyet Segmanı İmalat Kriterleri')}</span>
                                    <span className="text-[10px] text-[var(--alu-dim)]">ISO 3075</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[var(--ink)] text-[11px]">
                                    <div>
                                        <strong className="text-[var(--ink)] block mb-0.5">{t12(language, 'Axial Load Capacity (F_N):', 'Eksenel Taşıma Kapasitesi (F_N):')}</strong>
                                        <p className="text-[var(--alu-dim)]">F_N = (π · d · t · σ_y) / S ≈ <strong>{circlipAxialCapacityKn} kN</strong> ({t12(language, 'Assuming shaft steel Re = 240 MPa', 'Mil çeliği Akma = 240 MPa kabulüyle')})</p>
                                    </div>
                                    <div>
                                        <strong className="text-[var(--ink)] block mb-0.5">{t12(language, 'Minimum Edge Margin (m_n):', 'Asgari Kenar Mesafesi (m_n):')}</strong>
                                        <p className="text-[var(--alu-dim)]">m_n ≥ 3 · t = <strong>{(circlipData ? formatEngineeringValue((circlipData.depth * 3), precision, true) : '1.65')} mm</strong> ({t12(language, 'Prevents shaft edge shearing', 'Mil kenarından sıyrılmayı önler')})</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: UNDERCUT BLUEPRINT */}
                    {activeTab === 'undercut' && (
                        <div className="space-y-4">
                            <UndercutVisualizer
                                dSmall={undercutDSmall}
                                dLarge={undercutDSmall + 15}
                                r={undercutData.r}
                                form={undercutForm}
                                t1={undercutData.t1}
                                t2={undercutData.t2}
                                f={undercutData.f}
                                g={undercutData.g}
                                angleFace={undercutData.angleFace}
                                angleCylinder={undercutData.angleCylinder}
                                hideLegend={true}
                            />
                        </div>
                    )}

                    {/* TAB 4: CENTER DRILL BLUEPRINT */}
                    {activeTab === 'centerdrill' && (
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-1)] overflow-hidden shadow-2xl">
                                <CenterDrillSVG
                                    data={{
                                        type: centerDrillData.type,
                                        form: centerDrillData.form,
                                        d1: centerDrillData.d1,
                                        d2: centerDrillData.d2,
                                        d3: centerDrillData.d3,
                                        r: centerDrillData.r,
                                        t: centerDrillData.t,
                                        t1: centerDrillData.t1
                                    }}
                                    hideLegend={true}
                                />
                            </div>

                            {/* Standard Center Drill Notes */}
                            <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)] space-y-2.5 font-mono text-xs">
                                <div className="flex items-center justify-between text-[var(--cyan)] font-bold border-b border-[var(--line)] pb-2">
                                    <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> {t12(language, 'DIN 332-1 Center Hole Machining Standard', 'DIN 332-1 Torna Puntası İmalat Kriterleri')}</span>
                                    <span className="text-[10px] text-[var(--alu-dim)]">ISO 6411</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[var(--ink)] text-[11px]">
                                    <div>
                                        <strong className="text-[var(--ink)] block mb-0.5">{t12(language, 'Cone Angle 60° (Tailstock):', 'Punta Açısı 60° (Torna Gezer Punta):')}</strong>
                                        <p className="text-[var(--alu-dim)]">{t12(language, 'Precision bearing seat for turning and cylindrical grinding between centers.', 'Puntalar arasında tornalama ve silindirik taşlama için hassas merkezleme yatağıdır.')}</p>
                                    </div>
                                    <div>
                                        <strong className="text-[var(--ink)] block mb-0.5">{t12(language, 'Form B Protecting Chamfer 120°:', 'Form B Koruyucu Havşa 120°:')}</strong>
                                        <p className="text-[var(--alu-dim)]">{t12(language, 'Guards the precision 60° cone from handling damage and center burrs.', '60° hassas koniyi parça taşıma hasarlarından ve çapak darbelerinden korur.')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 5: FASTENERS BLUEPRINT */}
                    {activeTab === 'fasteners' && (
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-1)] overflow-hidden shadow-2xl">
                                {fastenerType === 'imbus' ? (
                                    <ImbusSVG data={{ ...imbusData, dh: imbusClearance ?? imbusData.d }} hideLegend={true} />
                                ) : (
                                    <CountersinkSVG data={{ ...csData, dh: csClearance ?? csData.d }} hideLegend={true} />
                                )}
                            </div>

                            {/* Fastener Seating & VDI 2230 Notes */}
                            <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)] space-y-2.5 font-mono text-xs">
                                <div className="flex items-center justify-between text-[var(--cyan)] font-bold border-b border-[var(--line)] pb-2">
                                    <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> {t12(language, 'VDI 2230 Fastener Seating & Tightening Guidelines', 'VDI 2230 Cıvata Oturma ve Sıkma Kriterleri')}</span>
                                    <span className="text-[10px] text-[var(--alu-dim)]">DIN 912 / DIN 74</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[var(--ink)] text-[11px]">
                                    <div>
                                        <strong className="text-[var(--ink)] block mb-0.5">{t12(language, 'Counterbore Face Flatness:', 'Havşa Taban Düzlemselliği:')}</strong>
                                        <p className="text-[var(--alu-dim)]">{t12(language, 'Ensure counterbore bottom is perpendicular to hole axis within 0.1mm to avoid screw head bending.', 'Cıvata kafasında eğilme gerilmesini önlemek için yuva tabanı delik eksenine dik işlenmelidir.')}</p>
                                    </div>
                                    <div>
                                        <strong className="text-[var(--ink)] block mb-0.5">{t12(language, 'Tightening Preload (F_M):', 'Ön Yükleme Kuvveti (F_M):')}</strong>
                                        <p className="text-[var(--alu-dim)]">{t12(language, 'Grade 8.8 / 10.9 tightened using calibrated torque wrench per VDI 2230.', '8.8 / 10.9 kalite cıvatalar VDI 2230 standardına göre tork anahtarıyla sıkılmalıdır.')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ═════════════════════════════════════════════════════════════════════ */}
                {/* 3. RIGHT COLUMN: TELEMETRY, TOLERANCES & OUTPUT DATA                  */}
                {/* ═════════════════════════════════════════════════════════════════════ */}
                <div className="w-full lg:w-80 shrink-0 flex flex-col bg-[var(--bg-1)]/90 border-t lg:border-t-0 border-[var(--line)] p-3.5 space-y-3.5 overflow-y-auto custom-scrollbar">
                    
                    {/* TAB 1: KEYWAY TELEMETRY */}
                    {activeTab === 'keyway' && (
                        <div className="space-y-4">
                            {/* Calculation Summary Card */}
                            <div className="p-4 rounded-2xl bg-[var(--bg-1)] border border-[var(--line)] shadow-xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${keywayResults.isSafe ? 'bg-emerald-500 shadow-lg ' : 'bg-rose-500 shadow-lg animate-pulse'}`} />
                                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                                            {keywayResults.isSafe ? t12(language, 'CONNECTION IS SAFE', 'BAĞLANTI GÜVENLİ') : t12(language, 'WARNING: OVERLOAD', 'UYARI: AŞIRI YÜK')}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={copyKeywayReport}
                                        className="text-[11px] font-mono text-[var(--cyan)] hover:text-[var(--cyan)] flex items-center gap-1 cursor-pointer bg-cyan-950/40 px-2 py-1 rounded border border-cyan-800/60"
                                    >
                                        {copiedSummary ? <Check size={12} className="text-[var(--ok)]" /> : <Copy size={12} />}
                                        <span>{copiedSummary ? t12(language, 'Copied', 'Kopyalandı') : t12(language, 'Copy Report', 'Raporu Kopyala')}</span>
                                    </button>
                                </div>
                            </div>

                            {/* KPI Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                                    <span className="text-[10px] text-[var(--alu-dim)] uppercase font-bold block mb-1">
                                        {t12(language, 'Tangential Force (F_t)', 'Teğetsel Kuvvet (F_t)')}
                                    </span>
                                    <div className="text-lg font-mono font-black text-[var(--cyan)]">
                                        {formatEngineeringValue(keywayResults.tangentialForce, precision, true)} <span className="text-xs font-normal text-[var(--alu-dim)]">N</span>
                                    </div>
                                    <p className="text-[9px] text-[var(--muted)] font-mono mt-0.5">
                                        {t12(language, 'Torque:', 'Tork:')} {calculatedTorque} N·m
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                                    <span className="text-[10px] text-[var(--alu-dim)] uppercase font-bold block mb-1">
                                        {t12(language, 'Hub Pressure (p_hub)', 'Göbek Basıncı (p_hub)')}
                                    </span>
                                    <div className={`text-lg font-mono font-black ${keywayResults.safetyFactorHub >= 1 ? 'text-[var(--ok)]' : 'text-rose-400'}`}>
                                        {formatEngineeringValue(keywayResults.pHub, precision, true)} <span className="text-xs font-normal text-[var(--alu-dim)]">MPa</span>
                                    </div>
                                    <p className="text-[9px] text-[var(--muted)] font-mono mt-0.5">
                                        {t12(language, 'Limit:', 'Sınır:')} {keywayResults.allowablePHub} MPa
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                                    <span className="text-[10px] text-[var(--alu-dim)] uppercase font-bold block mb-1">
                                        {t12(language, 'Key Shear (τ)', 'Kama Kayma (τ)')}
                                    </span>
                                    <div className={`text-lg font-mono font-black ${keywayResults.safetyFactorShear >= 1 ? 'text-[var(--ok)]' : 'text-rose-400'}`}>
                                        {formatEngineeringValue(keywayResults.tauKey, precision, true)} <span className="text-xs font-normal text-[var(--alu-dim)]">MPa</span>
                                    </div>
                                    <p className="text-[9px] text-[var(--muted)] font-mono mt-0.5">
                                        {t12(language, 'Limit:', 'Sınır:')} {keywayResults.allowableTauKey} MPa
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                                    <span className="text-[10px] text-[var(--alu-dim)] uppercase font-bold block mb-1">
                                        {t12(language, 'Safety (S_p / S_τ)', 'Emniyet (S_p / S_τ)')}
                                    </span>
                                    <div className="text-lg font-mono font-black text-[var(--ink)]">
                                        {formatEngineeringValue(keywayResults.safetyFactorHub, precision, true)} / {formatEngineeringValue(keywayResults.safetyFactorShear, precision, true)}
                                    </div>
                                </div>
                            </div>

                            {/* Standard Tolerances Table */}
                            <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)] space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[var(--alu)] uppercase tracking-wider">
                                        {t12(language, 'DIN 6885 Keyway Tolerances', 'DIN 6885 Kanal Toleransları')}
                                    </span>
                                    <div className="flex gap-1 text-[11px]">
                                        {(['tight', 'normal', 'loose'] as KeywayFitClass[]).map(fc => (
                                            <button
                                                key={fc}
                                                type="button"
                                                onClick={() => setFitClass(fc)}
                                                className={`px-2 py-0.5 rounded font-mono cursor-pointer ${
                                                    fitClass === fc ? 'bg-[var(--cyan)]/15 text-[var(--cyan)] border border-[var(--cyan)]/30 font-bold' : 'text-[var(--alu-dim)]'
                                                }`}
                                            >
                                                {fc === 'tight' ? t12(language, 'Tight (P9)', 'Sıkı (P9)') : fc === 'normal' ? t12(language, 'Normal (N9/JS9)', 'Normal (N9/JS9)') : t12(language, 'Loose (D10)', 'Boşluklu (D10)')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[var(--alu)]">
                                    <div className="p-2 rounded bg-[var(--bg-1)] border border-[var(--line)]">
                                        <span className="text-[10px] text-[var(--alu-dim)] block mb-0.5">
                                            {t12(language, 'Shaft Keyseat (b):', 'Mil Kanalı (b):')}
                                        </span>
                                        <div className="font-bold text-[var(--cyan)]">
                                            {keywayTolerances.shaft} [{keywayTolerances.bShaft}]
                                        </div>
                                    </div>
                                    <div className="p-2 rounded bg-[var(--bg-1)] border border-[var(--line)]">
                                        <span className="text-[10px] text-[var(--alu-dim)] block mb-0.5">
                                            {t12(language, 'Hub Keyway (b):', 'Göbek Kanalı (b):')}
                                        </span>
                                        <div className="font-bold text-[var(--cyan)]">
                                            {keywayTolerances.hub} [{keywayTolerances.bHub}]
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations Card */}
                            <div className="p-3.5 rounded-xl bg-[var(--cyan)]/10 border border-[var(--cyan)]/30 text-xs font-mono space-y-2">
                                <div className="flex justify-between items-baseline gap-2 text-[var(--cyan)] font-bold">
                                    <span className="truncate">{t12(language, 'Min Req. Key Length:', 'Asgari Gerekli Kama Boyu:')}</span>
                                    <span className="whitespace-nowrap shrink-0 text-[var(--cyan)]">l_min ≥ {keywayResults.minKeyLength} mm</span>
                                </div>
                                <div className="flex justify-between items-baseline gap-2 text-[var(--alu)]">
                                    <span className="truncate text-[var(--alu-dim)]">{t12(language, 'Max Safe Torque:', 'Azami Güvenli Tork:')}</span>
                                    <strong className="whitespace-nowrap shrink-0 text-[var(--ink)]">{formatEngineeringValue(keywayResults.maxTransmissibleTorque, precision, true)} N·m</strong>
                                </div>
                            </div>

                            {/* ═══ DIN 6885 Actionable Engineering Advice Card ═══ */}
                            <div className={`p-3.5 rounded-xl border text-xs font-mono space-y-2 ${
                                !keywayResults.isSafe
                                    ? 'bg-[var(--bad)]/10 border-[var(--bad)]/40 text-[var(--bad)]'
                                    : keywayResults.safetyFactorHub < 1.3 || keywayResults.safetyFactorShear < 1.3
                                    ? 'bg-[var(--warn)]/10 border-[var(--warn)]/40 text-[var(--warn)]'
                                    : 'bg-[var(--ok)]/10 border-[var(--ok)]/40 text-[var(--ok)]'
                            }`}>
                                <div className="font-bold flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                                    <Zap size={13} className="shrink-0" />
                                    <span>{t12(language, 'DIN 6885 Engineering Recommendation', 'DIN 6885 Mühendislik Tavsiyesi')}</span>
                                </div>
                                <p className="font-sans text-[11px] leading-relaxed text-[var(--ink)]">
                                    {!keywayResults.isSafe ? (
                                        keywayResults.safetyFactorHub < 1.0 && keywayResults.safetyFactorShear < 1.0
                                            ? t12(
                                                language,
                                                `Both hub contact pressure (${formatEngineeringValue(keywayResults.pHub, precision, true)} MPa > ${keywayResults.allowablePHub} MPa) and key shear stress (${formatEngineeringValue(keywayResults.tauKey, precision, true)} MPa > ${keywayResults.allowableTauKey} MPa) exceed safe limits! Increase key length to L ≥ ${keywayResults.minKeyLength} mm, upgrade hub material to higher-yield steel, or configure 2 parallel keys at 180° (DIN 6885).`,
                                                `Hem göbek temas basıncı (${formatEngineeringValue(keywayResults.pHub, precision, true)} MPa > ${keywayResults.allowablePHub} MPa) hem kama kayma gerilmesi (${formatEngineeringValue(keywayResults.tauKey, precision, true)} MPa > ${keywayResults.allowableTauKey} MPa) aşıldı! Kama boyunu L ≥ ${keywayResults.minKeyLength} mm'ye uzatın, göbek malzemesini daha yüksek akma dayanımlı çeliğe yükseltin veya 180° çift paralel kama (DIN 6885) kullanın.`
                                            )
                                            : keywayResults.safetyFactorHub < 1.0
                                            ? t12(
                                                language,
                                                `Hub surface pressure exceeded (${formatEngineeringValue(keywayResults.pHub, precision, true)} MPa > ${keywayResults.allowablePHub} MPa)! Increase key length from ${keyLength} mm to at least ${keywayResults.minKeyLength} mm, switch to 2 parallel keys, or select a hub material with higher allowable pressure (e.g. C45 / 42CrMo4 instead of GG-25).`,
                                                `Göbek ezilme gerilmesi aşıldı (${formatEngineeringValue(keywayResults.pHub, precision, true)} MPa > ${keywayResults.allowablePHub} MPa)! Kama boyunu ${keyLength} mm'den en az ${keywayResults.minKeyLength} mm'ye uzatın, çift kamaya geçin veya göbek malzemesini daha yüksek p_em değerli çeliğe (ör. GG-25 yerine C45/42CrMo4) yükseltin.`
                                            )
                                            : t12(
                                                language,
                                                `Key shear stress exceeded (${formatEngineeringValue(keywayResults.tauKey, precision, true)} MPa > ${keywayResults.allowableTauKey} MPa)! Increase key length to L ≥ ${keywayResults.minKeyLength} mm, select higher-strength key steel (e.g. C45+C / 16MnCr5), or use 2 keys.`,
                                                `Kama kayma gerilmesi aşıldı (${formatEngineeringValue(keywayResults.tauKey, precision, true)} MPa > ${keywayResults.allowableTauKey} MPa)! Kama boyunu L ≥ ${keywayResults.minKeyLength} mm'ye uzatın, daha yüksek mukavemetli kama çeliği seçin veya 2 kama kullanın.`
                                            )
                                    ) : keywayResults.safetyFactorHub < 1.3 || keywayResults.safetyFactorShear < 1.3 ? (
                                        t12(
                                            language,
                                            `Borderline safety margin (S_p=${formatEngineeringValue(keywayResults.safetyFactorHub, precision, true)}, S_τ=${formatEngineeringValue(keywayResults.safetyFactorShear, precision, true)}). For reversing or shock-loaded torque (KA ≥ 1.5), consider increasing key length L or switching to Form B square ends for full bearing length.`,
                                            `Sınırda emniyet marjı (S_p=${formatEngineeringValue(keywayResults.safetyFactorHub, precision, true)}, S_τ=${formatEngineeringValue(keywayResults.safetyFactorShear, precision, true)}). Yön değiştiren veya darbeli tork (KA ≥ 1.5) durumunda kama boyunu L artırmayı veya Form B düz uçlu kamaya geçerek etkin taşıma boyunu büyütmeyi değerlendirin.`
                                        )
                                    ) : (
                                        t12(
                                            language,
                                            `Optimum DIN 6885-1 keyway connection. Hub surface pressure (S_p=${formatEngineeringValue(keywayResults.safetyFactorHub, precision, true)}) and key shear stress (S_τ=${formatEngineeringValue(keywayResults.safetyFactorShear, precision, true)}) conform strictly to allowable DIN standards. Max safe torque: ${formatEngineeringValue(keywayResults.maxTransmissibleTorque, precision, true)} N·m.`,
                                            `Optimum DIN 6885-1 kama bağlantısı. Göbek ezilme gerilmesi (S_p=${formatEngineeringValue(keywayResults.safetyFactorHub, precision, true)}) ve kama kayma gerilmesi (S_τ=${formatEngineeringValue(keywayResults.safetyFactorShear, precision, true)}) standart sınırları içindedir. Azami güvenli tork: ${formatEngineeringValue(keywayResults.maxTransmissibleTorque, precision, true)} N·m.`
                                        )
                                    )}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: CIRCLIP TELEMETRY */}
                    {activeTab === 'circlip' && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-[var(--bg-1)] border border-[var(--line)] shadow-xl space-y-3">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-[var(--ok)]" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                                        {isShaft ? 'DIN 471 SHAFT CIRCLIP SPECS' : 'DIN 472 BORE CIRCLIP SPECS'}
                                    </span>
                                </div>
                            </div>

                            {/* Primary KPI Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                                    <span className="text-[10px] text-[var(--alu-dim)] uppercase font-bold block mb-1">
                                        {t12(language, 'Groove Dia (d2)', 'Kanal Çapı (d2)')}
                                    </span>
                                    <div className="text-lg font-mono font-black text-[var(--cyan)]">
                                        {circlipData?.d2 ?? '-'} <span className="text-xs font-normal text-[var(--alu-dim)]">mm</span>
                                    </div>
                                    <p className="text-[9px] text-[var(--muted)] font-mono mt-0.5">{isShaft ? 'Tol: h11' : 'Tol: H11'}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                                    <span className="text-[10px] text-[var(--alu-dim)] uppercase font-bold block mb-1">
                                        {t12(language, 'Groove Width (m)', 'Kanal Genişliği (m)')}
                                    </span>
                                    <div className="text-lg font-mono font-black text-[var(--warn)]">
                                        {circlipData?.m ?? '-'} <span className="text-xs font-normal text-[var(--alu-dim)]">mm</span>
                                    </div>
                                    <p className="text-[9px] text-[var(--muted)] font-mono mt-0.5">Tol: H13</p>
                                </div>
                                <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                                    <span className="text-[10px] text-[var(--alu-dim)] uppercase font-bold block mb-1">
                                        {t12(language, 'Groove Depth (t)', 'Kanal Derinliği (t)')}
                                    </span>
                                    <div className="text-lg font-mono font-black text-[var(--ink)]">
                                        {circlipData?.depth ?? '-'} <span className="text-xs font-normal text-[var(--alu-dim)]">mm</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                                    <span className="text-[10px] text-[var(--alu-dim)] uppercase font-bold block mb-1">
                                        {t12(language, 'Thickness (s)', 'Segman Kalınlığı (s)')}
                                    </span>
                                    <div className="text-lg font-mono font-black text-[var(--ink)]">
                                        {circlipData?.s ?? '-'} <span className="text-xs font-normal text-[var(--alu-dim)]">mm</span>
                                    </div>
                                </div>
                            </div>

                            {/* Load Capacity Card */}
                            <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)] space-y-2.5 font-mono text-xs">
                                <span className="text-[10px] font-bold text-[var(--alu)] uppercase tracking-wider block">
                                    {t12(language, 'Load Capacity & Edge Safety', 'Yük Kapasitesi & Kenar Güvenliği')}
                                </span>
                                <div className="flex justify-between text-[var(--alu)]">
                                    <span>{t12(language, 'Axial Load Capacity (F_N):', 'Eksenel Yük Sınırı (F_N):')}</span>
                                    <strong className="text-[var(--ok)] font-bold">{circlipAxialCapacityKn} kN</strong>
                                </div>
                                <div className="flex justify-between text-[var(--alu)]">
                                    <span>{t12(language, 'Min Edge Margin (m_n):', 'Asgari Kenar Mesafesi (m_n):')}</span>
                                    <strong className="text-[var(--cyan)] font-bold">{(circlipData ?formatEngineeringValue((circlipData.depth * 3), precision, true) : '1.65')} mm</strong>
                                </div>
                                <div className="flex justify-between text-[var(--alu)]">
                                    <span>{t12(language, 'Standard Groove Chamfer:', 'Standart Pah / Radyus:')}</span>
                                    <strong className="text-[var(--ink)]">r ≤ 0.1 · s mm</strong>
                                </div>
                            </div>

                            {/* Standard Drawing Callout */}
                            <div className="p-3.5 rounded-xl bg-[var(--cyan)]/10 border border-[var(--cyan)]/30 text-xs font-mono space-y-1">
                                <span className="text-[10px] text-[var(--cyan)] uppercase font-bold block">{t12(language, 'Technical Drawing Callout:', 'Teknik Resim Gösterimi:')}</span>
                                <div className="text-sm font-bold text-[var(--ink)] tracking-wide">
                                    {isShaft ? `DIN 471 - ${circlipD} × ${circlipData?.s ?? '1.2'}` : `DIN 472 - ${circlipD} × ${circlipData?.s ?? '1.2'}`}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: UNDERCUT TELEMETRY */}
                    {activeTab === 'undercut' && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-[var(--bg-1)] border border-[var(--line)] shadow-xl space-y-3">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-[var(--cyan)]" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                                        DIN 509 FORM {undercutForm} SPECIFICATIONS
                                    </span>
                                </div>
                            </div>

                            {/* Primary KPI Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                                    <span className="text-[10px] text-[var(--alu-dim)] uppercase font-bold block mb-1">
                                        {t12(language, 'Fillet Radius (r)', 'Kavis Yarıçapı (r)')}
                                    </span>
                                    <div className="text-lg font-mono font-black text-[var(--warn)]">
                                        {undercutData.r} <span className="text-xs font-normal text-[var(--alu-dim)]">mm</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                                    <span className="text-[10px] text-[var(--alu-dim)] uppercase font-bold block mb-1">
                                        {t12(language, 'Cyl. Depth (t1)', 'Silindirik Dalma (t1)')}
                                    </span>
                                    <div className="text-lg font-mono font-black text-[var(--cyan)]">
                                        {undercutData.t1} <span className="text-xs font-normal text-[var(--alu-dim)]">mm</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                                    <span className="text-[10px] text-[var(--alu-dim)] uppercase font-bold block mb-1">
                                        {t12(language, 'Face Depth (t2)', 'Alın Dalma (t2)')}
                                    </span>
                                    <div className="text-lg font-mono font-black text-purple-400">
                                        {undercutData.t2 ?? 0} <span className="text-xs font-normal text-[var(--alu-dim)]">mm</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                                    <span className="text-[10px] text-[var(--alu-dim)] uppercase font-bold block mb-1">
                                        {t12(language, 'Groove Width (f)', 'Oyuk Genişliği (f)')}
                                    </span>
                                    <div className="text-lg font-mono font-black text-[var(--ok)]">
                                        {undercutData.f ?? 2.5} <span className="text-xs font-normal text-[var(--alu-dim)]">mm</span>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Angles & Machining Table */}
                            <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)] space-y-2 font-mono text-xs">
                                <div className="flex justify-between text-[var(--alu)]">
                                    <span>{t12(language, 'Shaft Ramp Angle:', 'Mil Rampası Açısı:')}</span>
                                    <span className="font-bold text-[var(--warn)]">{undercutData.angleCylinder ?? 15}°</span>
                                </div>
                                {undercutForm !== 'E' && (
                                    <div className="flex justify-between text-[var(--alu)]">
                                        <span>{t12(language, 'Face Relief Angle:', 'Alın Boşaltma Açısı:')}</span>
                                        <span className="font-bold text-pink-400">{undercutData.angleFace ?? 8}°</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-[var(--alu)]">
                                    <span>{t12(language, 'Grinding Surface Finish:', 'Yüzey Pürüzlülüğü:')}</span>
                                    <span className="font-bold text-[var(--cyan)]">Ra 0.8 µm (N6)</span>
                                </div>
                            </div>

                            {/* Technical Drawing Callout */}
                            <div className="p-3.5 rounded-xl bg-[var(--cyan)]/10 border border-[var(--cyan)]/30 text-xs font-mono space-y-1">
                                <span className="text-[10px] text-[var(--cyan)] uppercase font-bold block">{t12(language, 'Technical Drawing Callout (DIN 509):', 'Teknik Resim Gösterimi (DIN 509):')}</span>
                                <div className="text-sm font-bold text-[var(--ink)] tracking-wide">
                                    DIN 509 - {undercutForm} {undercutData.r} × {undercutData.t1}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: CENTER DRILL TELEMETRY */}
                    {activeTab === 'centerdrill' && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-[var(--bg-1)] border border-[var(--line)] shadow-xl space-y-3">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-[var(--cyan)]" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                                        DIN 332-1 FORM {centerDrillForm} SPECIFICATIONS
                                    </span>
                                </div>
                            </div>

                            {/* Primary KPI Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                                    <span className="text-[10px] text-[var(--alu-dim)] uppercase font-bold block mb-1">
                                        {t12(language, 'Pilot Dia (d1)', 'Kılavuz Çapı (d1)')}
                                    </span>
                                    <div className="text-lg font-mono font-black text-[var(--cyan)]">
                                        {centerDrillData.d1} <span className="text-xs font-normal text-[var(--alu-dim)]">mm</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                                    <span className="text-[10px] text-[var(--alu-dim)] uppercase font-bold block mb-1">
                                        {t12(language, '60° Cone Dia (d2)', '60° Koni Çapı (d2)')}
                                    </span>
                                    <div className="text-lg font-mono font-black text-[var(--warn)]">
                                        {centerDrillData.d2} <span className="text-xs font-normal text-[var(--alu-dim)]">mm</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                                    <span className="text-[10px] text-[var(--alu-dim)] uppercase font-bold block mb-1">
                                        {centerDrillForm === 'B' ? t12(language, 'Protecting Dia (d3)', 'Koruyucu Çap (d3)') : t12(language, 'Radius (r)', 'Radyus (r)')}
                                    </span>
                                    <div className="text-lg font-mono font-black text-purple-400">
                                        {centerDrillForm === 'B' ? (centerDrillData.d3 ?? '-') : centerDrillForm === 'R' ? (centerDrillData.r ?? '-') : '-'} <span className="text-xs font-normal text-[var(--alu-dim)]">mm</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                                    <span className="text-[10px] text-[var(--alu-dim)] uppercase font-bold block mb-1">
                                        {t12(language, 'Total Depth (t)', 'Toplam Derinlik (t)')}
                                    </span>
                                    <div className="text-lg font-mono font-black text-[var(--ink)]">
                                        {centerDrillData.t} <span className="text-xs font-normal text-[var(--alu-dim)]">mm</span>
                                    </div>
                                </div>
                            </div>

                            {/* Specifications Table */}
                            <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)] space-y-2 font-mono text-xs">
                                <div className="flex justify-between text-[var(--alu)]">
                                    <span>{t12(language, 'Pilot Depth (t1):', 'Kılavuz Boyu (t1):')}</span>
                                    <span className="font-bold text-[var(--cyan)]">{centerDrillData.t1 ?? '-'} mm</span>
                                </div>
                                <div className="flex justify-between text-[var(--alu)]">
                                    <span>{t12(language, 'Cone Angle:', 'Punta Koni Açısı:')}</span>
                                    <span className="font-bold text-[var(--ink)]">60°</span>
                                </div>
                                {centerDrillForm === 'B' && (
                                    <div className="flex justify-between text-[var(--alu)]">
                                        <span>{t12(language, 'Protecting Rim Angle:', 'Koruyucu Havşa Açısı:')}</span>
                                        <span className="font-bold text-[var(--warn)]">120°</span>
                                    </div>
                                )}
                            </div>

                            {/* Technical Drawing Callout */}
                            <div className="p-3.5 rounded-xl bg-[var(--cyan)]/10 border border-[var(--cyan)]/30 text-xs font-mono space-y-1">
                                <span className="text-[10px] text-[var(--cyan)] uppercase font-bold block">{t12(language, 'Technical Drawing Callout (DIN 332):', 'Teknik Resim Gösterimi (DIN 332):')}</span>
                                <div className="text-sm font-bold text-[var(--ink)] tracking-wide">
                                    DIN 332 - {centerDrillData.type}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 5: FASTENERS TELEMETRY */}
                    {activeTab === 'fasteners' && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-[var(--bg-1)] border border-[var(--line)] shadow-xl space-y-3">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-[var(--cyan)]" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                                        {fastenerType === 'imbus' ? `DIN 912 (${imbusSize}) COUNTERBORE SPECS` : `DIN 74 / 7991 (${csSize}) COUNTERSINK SPECS`}
                                    </span>
                                </div>
                            </div>

                            {/* Primary KPI Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                                    <span className="text-[10px] text-[var(--alu-dim)] uppercase font-bold block mb-1">
                                        {t12(language, 'Clearance Hole (dh)', 'Geçiş Deliği (dh)')}
                                    </span>
                                    <div className="text-lg font-mono font-black text-[var(--cyan)]">
                                        {fastenerType === 'imbus' ? imbusClearance : csClearance} <span className="text-xs font-normal text-[var(--alu-dim)]">mm</span>
                                    </div>
                                    <p className="text-[9px] text-[var(--muted)] font-mono mt-0.5">ISO 273 {holeSeries}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                                    <span className="text-[10px] text-[var(--alu-dim)] uppercase font-bold block mb-1">
                                        {fastenerType === 'imbus' ? t12(language, 'Counterbore (D)', 'Yuva Çapı (D)') : t12(language, 'Countersink (d2)', 'Havşa Çapı (d2)')}
                                    </span>
                                    <div className="text-lg font-mono font-black text-[var(--warn)]">
                                        {fastenerType === 'imbus' ? imbusData.D : csData.d2} <span className="text-xs font-normal text-[var(--alu-dim)]">mm</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                                    <span className="text-[10px] text-[var(--alu-dim)] uppercase font-bold block mb-1">
                                        {t12(language, 'Recess Depth (T / t)', 'Yuva Derinliği (T / t)')}
                                    </span>
                                    <div className="text-lg font-mono font-black text-[var(--ink)]">
                                        {fastenerType === 'imbus' ? imbusData.T : csData.t} <span className="text-xs font-normal text-[var(--alu-dim)]">mm</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                                    <span className="text-[10px] text-[var(--alu-dim)] uppercase font-bold block mb-1">
                                        {t12(language, 'Head Dia (dk)', 'Kafa Çapı (dk)')}
                                    </span>
                                    <div className="text-lg font-mono font-black text-[var(--ink)]">
                                        {fastenerType === 'imbus' ? imbusData.dk : csData.d2} <span className="text-xs font-normal text-[var(--alu-dim)]">mm</span>
                                    </div>
                                </div>
                            </div>

                            {/* VDI 2230 Tightening Torque Telemetry */}
                            <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)] space-y-2 font-mono text-xs">
                                <span className="text-[10px] font-bold text-[var(--alu)] uppercase tracking-wider block">
                                    {t12(language, 'VDI 2230 Tightening Torques (MA)', 'VDI 2230 Sıkma Torkları (MA)')}
                                </span>
                                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                                    <div className="p-2 rounded bg-[var(--bg-1)] border border-[var(--line)]">
                                        <span className="text-[9px] text-[var(--alu-dim)] block">8.8 Grade</span>
                                        <strong className="text-[var(--cyan)] font-bold">{activeBoltTorques.t88} N·m</strong>
                                    </div>
                                    <div className="p-2 rounded bg-[var(--bg-1)] border border-[var(--line)]">
                                        <span className="text-[9px] text-[var(--alu-dim)] block">10.9 Grade</span>
                                        <strong className="text-[var(--warn)] font-bold">{activeBoltTorques.t109} N·m</strong>
                                    </div>
                                    <div className="p-2 rounded bg-[var(--bg-1)] border border-[var(--line)]">
                                        <span className="text-[9px] text-[var(--alu-dim)] block">12.9 Grade</span>
                                        <strong className="text-purple-400 font-bold">{activeBoltTorques.t129} N·m</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Technical Drawing Callout */}
                            <div className="p-3.5 rounded-xl bg-[var(--cyan)]/10 border border-[var(--cyan)]/30 text-xs font-mono space-y-1">
                                <span className="text-[10px] text-[var(--cyan)] uppercase font-bold block">{t12(language, 'Technical Drawing Callout:', 'Teknik Resim Gösterimi:')}</span>
                                <div className="text-sm font-bold text-[var(--ink)] tracking-wide">
                                    {fastenerType === 'imbus' ? `DIN 912 - ${imbusSize} (DIN 74 Form H)` : `DIN 7991 - ${csSize} (DIN 74 Form F)`}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ MOBILE STICKY CRITICAL RESULT SUMMARY (< lg) ═══ */}
            {activeTab === 'keyway' && (
                <div className="block lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-1)] border-t border-[var(--line)] px-4 py-2.5 shadow-2xl">
                    <div className="flex items-center justify-between gap-3 font-mono">
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                keywayResults.isSafe ? 'bg-[var(--ok)]/15 text-[var(--ok)] border border-[var(--ok)]/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                                {keywayResults.isSafe ? 'SAFE' : 'OVERLOAD'}
                            </span>
                            <span className="text-xs text-[var(--ink)] font-bold">
                                SF: {formatEngineeringValue(keywayResults.safetyFactorHub, precision, true)}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            <div>
                                <span className="text-[10px] text-[var(--alu-dim)] mr-1">p_hub:</span>
                                <span className="font-bold text-[var(--cyan)]">{formatEngineeringValue(keywayResults.pHub, 0)} MPa</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-[var(--alu-dim)] mr-1">T:</span>
                                <span className="font-bold text-[var(--ink)]">{calculatedTorque} N·m</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
