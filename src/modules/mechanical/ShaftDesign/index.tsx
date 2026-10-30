/**
 * modules/mechanical/ShaftDesign/index.tsx
 * 
 * Stepped Shaft Design & Calculation Module View (SVG-First Interactive CAD Workbench)
 * Conforms to Unified Desk Architecture (UDA) and AluCalc Instrument Design System.
 */

'use client';

import React, { useState } from 'react';
import { 
    useShaftDesignStore 
} from './store';
import { 
    SHAFT_MATERIALS, 
    ShaftFeatureType,
    getStandardKeywayDIN6885,
    getStandardCirclipDIN471,
    getRecommendedImbusDIN912,
    getRecommendedPinDIN7,
    getRecommendedThreadISO965,
    getStandardUndercutDIN509,
    getStandardCenterDrillDIN332,
    calculateKeywayFullDIN6885,
    calculateCirclipFullDIN471,
    calculateBearingL10h
} from './engine';
import { betaFactors } from './din743';
import { BEARING_CATALOG, BearingData } from '@/data/skfBearings';
import KeywayVisualizer from '@/components/visualizers/KeywayVisualizer';
import { UndercutVisualizer } from '@/components/visualizers/UndercutVisualizer';
import { CirclipSVG, CenterDrillSVG, ImbusSVG } from '@/components/modules/mechanical/MachiningDrawings';
import { ShaftDrawingSVG } from '@/components/visualizers/ShaftDrawingSVG';
import { downloadShaftDXF } from './dxfExporter';
import { downloadShaftSTL } from './stlExporter';
import { transferShaftToDesignStudio } from './transferTo3D';
import { transferShaftToCadEditor } from './transferToCadEditor';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

import { 
    Disc, 
    Plus, 
    Trash2, 
    Settings, 
    ShieldCheck, 
    AlertTriangle, 
    CheckCircle2, 
    XCircle, 
    Layers, 
    Activity, 
    Copy, 
    Check, 
    ChevronRight,
    ChevronLeft,
    Wrench,
    FileText,
    Sliders,
    Zap,
    Download,
    Maximize2,
    SlidersHorizontal,
    Sparkles,
    Scissors,
    ArrowUpDown,
    PanelRightOpen,
    PanelRightClose,
    X,
    FileCode,
    Share2,
    Box,
    ExternalLink,
    Compass
} from 'lucide-react';

export default function ShaftDesignModule() {
    const { language } = useI18nStore();
    const {
        totalLength,
        segments,
        selectedSegmentId,
        selectedFeatureId,
        materialId,
        supportAPos,
        supportBPos,
        supportABearing,
        supportBBearing,
        operatingRpm,
        setOperatingRpm,
        radialLoads,
        torque,
        targetSafetyFactor,
        activeTab,
        result,
        metadata,
        setTotalLength,
        setSegmentCount,
        selectSegment,
        selectFeature,
        updateSegment,
        addSegment,
        removeSegment,
        splitSegment,
        moveBoundary,
        addFeatureToSegment,
        updateFeature,
        removeFeature,
        setSegmentChamfer,
        setGlobalChamfers,
        setShoulderTransition,
        setMaterialId,
        setSupports,
        setBearingForSupport,
        updateRadialLoad,
        addRadialLoad,
        removeRadialLoad,
        setTorque,
        setTargetSafetyFactor,
        setActiveTab,
        loadPreset
    } = useShaftDesignStore();

    const [copied, setCopied] = useState(false);
    const [inspectorOpen, setInspectorOpen] = useState(true);
    const [selectedPreset, setSelectedPreset] = useState<string>('default');
    const [showUnderplot, setShowUnderplot] = useState(true);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailStandard, setDetailStandard] = useState<'keyway' | 'circlip' | 'undercut' | 'center_drill' | 'imbus'>('keyway');
    const [bearingModalOpen, setBearingModalOpen] = useState(false);
    const [bearingModalSupport, setBearingModalSupport] = useState<'A' | 'B'>('A');
    const [bearingSearch, setBearingSearch] = useState('');
    const [bearingSeriesFilter, setBearingSeriesFilter] = useState<string>('all');
    const [autoSyncDiameter, setAutoSyncDiameter] = useState(true);

    const selectedSeg = segments.find(s => s.id === selectedSegmentId) ?? segments[0];
    const selectedFeat = selectedSeg?.features.find(f => f.id === selectedFeatureId);
    const selectedMat = SHAFT_MATERIALS.find(m => m.id === materialId) ?? SHAFT_MATERIALS[0];

    // Division count input state
    const [quickDivCount, setQuickDivCount] = useState(segments.length);

    // Copy engineering report
    const copyReport = () => {
        if (!result) return;
        const title = t12(language, '=== ALUCALC STEPPED SHAFT DESIGN & DIN 743 ANALYSIS REPORT ===', '=== ALUCALC KADEMELİ MİL TASARIMI & DIN 743 ANALİZ RAPORU ===');
        const calcCode = t12(language, 'Calculation ID', 'Hesap Kodu');
        const stds = t12(language, 'Standards: DIN 743 (Parts 1-4), DIN 6885-1, DIN 471, ISO 965, DIN 5480', 'Standartlar: DIN 743 (Teil 1-4), DIN 6885-1, DIN 471, ISO 965, DIN 5480');
        const lenMass = t12(language, `Total Shaft Length: ${result.totalLength} mm | Total Mass: ${result.totalMassKg} kg`, `Toplam Mil Boyu: ${result.totalLength} mm | Toplam Kütle: ${result.totalMassKg} kg`);
        const mat = t12(language, `Material: ${selectedMat.name} (Yield Re: ${selectedMat.Sy} MPa, Tensile Rm: ${selectedMat.Sut} MPa)`, `Malzeme: ${selectedMat.name} (Akma Sınırı Re: ${selectedMat.Sy} MPa, Çekme Rm: ${selectedMat.Sut} MPa)`);
        const segs = t12(language, `Segment Count: ${segments.length} | Target Safety Factor: ${targetSafetyFactor}`, `Kademe Sayısı: ${segments.length} | Hedef Güvenlik Katsayısı: ${targetSafetyFactor}`);
        const bearings = t12(language, `Bearing Reactions: Ra = ${result.supportReactions.RaN} N (x=${supportAPos}mm), Rb = ${result.supportReactions.RbN} N (x=${supportBPos}mm)`, `Yatak Tepkileri: Ra = ${result.supportReactions.RaN} N (x=${supportAPos}mm), Rb = ${result.supportReactions.RbN} N (x=${supportBPos}mm)`);
        const maxM = t12(language, `Max Bending Moment: ${result.maxBendingMomentNm} N·m (x=${result.maxBendingMomentX} mm)`, `Maksimum Eğilme Momenti: ${result.maxBendingMomentNm} N·m (x=${result.maxBendingMomentX} mm)`);
        const maxDef = t12(language, `Max Deflection: ${result.maxDeflectionMm} mm (x=${result.maxDeflectionX} mm) | Allowable: ${(result.totalLength / 1000).toFixed(3)} mm`, `Maksimum Sehim: ${result.maxDeflectionMm} mm (x=${result.maxDeflectionX} mm) | İzin Verilen: ${(result.totalLength / 1000).toFixed(3)} mm`);
        const whirl = t12(language, `Critical Whirling Speed: ${result.criticalSpeedRpm} rpm`, `Kritik Eğilme Hızı (Whirling): ${result.criticalSpeedRpm} d/dk (rpm)`);
        const minSf = t12(language, `Minimum Safety Factor SF: ${result.minSafetyFactor} (x=${result.minSafetyFactorX} mm)`, `Minimum Güvenlik Katsayısı SF: ${result.minSafetyFactor} (x=${result.minSafetyFactorX} mm)`);
        const overallStatus = result.isSafeOverall ? t12(language, 'PASS (SAFE)', 'UYGUN (GÜVENLİ)') : t12(language, 'WARNING / INSUFFICIENT SAFETY', 'UYARI / YETERSİZ MUKAVEMET');
        const overall = t12(language, `Overall Status: ${overallStatus}`, `Genel Durum: ${overallStatus}`);
        const critHeader = t12(language, 'CRITICAL FEATURES & NOTCH EFFECTS:', 'KRİTİK UNSUR VE ÇENTİK ETKİLERİ:');
        const critList = result.criticalChecks.map(c => `· [${c.status}] ${c.description} (x=${c.positionX}mm) -> βσ=${c.Kt}, ${c.notes ?? ''}, S=${c.safetyFactor}`).join('\n');

        const text = `${title}
${calcCode}: ${metadata?.calculationId ?? 'DIN743'}
${stds}
${lenMass}
${mat}
${segs}
-----------------------------------------------------------
${bearings}
${maxM}
${maxDef}
${whirl}
${minSf}
${overall}
-----------------------------------------------------------
${critHeader}
${critList}
===========================================================`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePresetChange = (preset: 'motor' | 'gearbox' | 'pump' | 'simple' | 'default') => {
        setSelectedPreset(preset);
        loadPreset(preset);
    };

    const renderStandardsView = () => {
        const seg = selectedSeg ?? segments[0];
        const kwFeat = seg.features.find(f => f.type === 'keyway');
        const ccFeat = seg.features.find(f => f.type === 'circlip');
        const ucFeat = seg.features.find(f => f.type === 'undercut');
        const cdFeat = seg.features.find(f => f.type === 'center_drill');
        const imbusFeat = seg.features.find(f => f.type === 'imbus');

        const kwCalc = calculateKeywayFullDIN6885({
            shaftDiameter: seg.diameter,
            torqueNm: torque.torqueNm || 250,
            keyLength: kwFeat?.type === 'keyway' ? kwFeat.length : undefined,
            applicationFactor: 1.25,
            keyForm: 'A',
            fitClass: 'normal'
        });

        const ccCalc = calculateCirclipFullDIN471({
            shaftDiameter: seg.diameter,
            yieldStrengthMPa: selectedMat.Sy
        });

        const ucForm = (ucFeat?.type === 'undercut' && (ucFeat.form === 'E' || ucFeat.form === 'F')) ? ucFeat.form : 'E';
        const ucData = getStandardUndercutDIN509(seg.diameter, ucForm);

        const cdForm = cdFeat?.type === 'center_drill' ? cdFeat.form : 'B';
        const cdData = getStandardCenterDrillDIN332(seg.diameter, cdForm);

        const imbusData = getRecommendedImbusDIN912(seg.diameter);

        return (
            <div className="w-full h-full flex flex-col p-3 overflow-y-auto space-y-3 custom-scrollbar font-mono text-xs">
                {/* Header and Standard Selector */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded bg-[var(--bg-1)] border border-[var(--line)] shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[var(--cyan)] font-bold uppercase tracking-wider text-xs flex items-center gap-1.5">
                            <Sparkles size={14} /> {t12(language, '1:1 Manufacturing & Standards Inspection', '1:1 İmalat & Standart Muayenesi')}
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] text-[var(--alu-dim)]">{t12(language, 'Segment:', 'Kademe:')}</span>
                            <select
                                value={seg.id}
                                onChange={(e) => selectSegment(e.target.value)}
                                className="px-1.5 py-0.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-xs text-[var(--cyan)] font-bold font-mono"
                            >
                                {segments.map(s => (
                                    <option key={s.id} value={s.id}>
                                        S{s.segmentIndex + 1} (Ø{s.diameter}x{s.length}mm)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Standard Switcher Pills */}
                    <div className="flex flex-wrap items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setDetailStandard('keyway')}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors border ${
                                detailStandard === 'keyway'
                                    ? 'bg-[var(--warn)]/20 border-[var(--warn)] text-[var(--warn)]'
                                    : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:text-white'
                            }`}
                        >
                            DIN 6885 {t12(language, 'Keyway', 'Kama')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setDetailStandard('circlip')}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors border ${
                                detailStandard === 'circlip'
                                    ? 'bg-[var(--bad)]/20 border-[var(--bad)] text-[var(--bad)]'
                                    : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:text-white'
                            }`}
                        >
                            DIN 471 {t12(language, 'Circlip', 'Segman')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setDetailStandard('undercut')}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors border ${
                                detailStandard === 'undercut'
                                    ? 'bg-sky-500/20 border-sky-400 text-sky-400'
                                    : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:text-white'
                            }`}
                        >
                            DIN 509 {t12(language, 'Undercut', 'Taşlama')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setDetailStandard('center_drill')}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors border ${
                                detailStandard === 'center_drill'
                                    ? 'bg-teal-500/20 border-teal-400 text-teal-400'
                                    : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:text-white'
                            }`}
                        >
                            DIN 332 {t12(language, 'Center Drill', 'Punta')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setDetailStandard('imbus')}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors border ${
                                detailStandard === 'imbus'
                                    ? 'bg-blue-500/20 border-blue-400 text-blue-400'
                                    : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:text-white'
                            }`}
                        >
                            DIN 912 {t12(language, 'Socket Head', 'İmbus')}
                        </button>
                    </div>
                </div>

                {/* 1. KEYWAY (DIN 6885) */}
                {detailStandard === 'keyway' && (
                    <div className="space-y-3">
                        <div className="w-full bg-[var(--bg-0)] rounded-xl border border-[var(--line)] overflow-hidden shadow-2xl">
                            <KeywayVisualizer
                                d={seg.diameter}
                                b={kwCalc.b}
                                h={kwCalc.h}
                                t1={kwCalc.t1}
                                t2={kwCalc.t2}
                                r={0.4}
                                keyLength={kwCalc.L}
                                effectiveLength={kwCalc.lEff}
                                keyForm="A"
                                torque={torque.torqueNm || 250}
                                tangentialForce={kwCalc.Ft}
                                pHub={kwCalc.pHub}
                                allowablePHub={kwCalc.pAllowable}
                                tauKey={kwCalc.tau}
                                allowableTauKey={kwCalc.tauAllowable}
                                isSafe={kwCalc.isSafe}
                                fitClass="normal"
                                shaftToleranceStr={kwCalc.shaftTolStr}
                                hubToleranceStr={kwCalc.hubTolStr}
                            />
                        </div>

                        {/* Engineering Formulation Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            <div className="p-3 rounded bg-[var(--bg-1)] border border-[var(--line)] space-y-1.5">
                                <span className="text-[var(--alu-dim)] text-[10px] block">{t12(language, '1. Circumferential Tangential Force (Ft)', '1. Çevresel Teğetsel Kuvvet (Ft)')}</span>
                                <div className="text-sm font-bold text-white">
                                    Ft = {kwCalc.Ft.toLocaleString()} N
                                </div>
                                <p className="text-[10px] text-[var(--alu-dim)]">
                                    Ft = (2 · T · KA) / (d - t1) = (2 · {torque.torqueNm || 250} · 1.25) / ({(seg.diameter - kwCalc.t1).toFixed(1)} mm)
                                </p>
                            </div>

                            <div className="p-3 rounded bg-[var(--bg-1)] border border-[var(--line)] space-y-1.5">
                                <span className="text-[var(--alu-dim)] text-[10px] block">{t12(language, '2. Hub Surface Bearing Pressure (p_hub)', '2. Göbek Yüzey Ezilme Basıncı (p_hub)')}</span>
                                <div className="text-sm font-bold flex items-center justify-between" style={{
                                    color: kwCalc.safetyPressure >= targetSafetyFactor ? 'var(--ok)' : 'var(--warn)'
                                }}>
                                    <span>p = {kwCalc.pHub.toFixed(1)} MPa</span>
                                    <span className="text-xs">SF = {kwCalc.safetyPressure}</span>
                                </div>
                                <p className="text-[10px] text-[var(--alu-dim)]">
                                    p = Ft / (l_eff · t2) ≤ {kwCalc.pAllowable} MPa | leff = {kwCalc.lEff} mm
                                </p>
                            </div>

                            <div className="p-3 rounded bg-[var(--bg-1)] border border-[var(--line)] space-y-1.5">
                                <span className="text-[var(--alu-dim)] text-[10px] block">{t12(language, '3. Key Shear Stress (τ_key)', '3. Kama Kesme Gerilmesi (τ_key)')}</span>
                                <div className="text-sm font-bold flex items-center justify-between" style={{
                                    color: kwCalc.safetyShear >= targetSafetyFactor ? 'var(--ok)' : 'var(--warn)'
                                }}>
                                    <span>τ = {kwCalc.tau.toFixed(1)} MPa</span>
                                    <span className="text-xs">SF = {kwCalc.safetyShear}</span>
                                </div>
                                <p className="text-[10px] text-[var(--alu-dim)]">
                                    τ = Ft / (l_eff · b) ≤ {kwCalc.tauAllowable} MPa | b = {kwCalc.b} mm
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. CIRCLIP (DIN 471) */}
                {detailStandard === 'circlip' && (
                    <div className="space-y-3">
                        <div className="w-full bg-[var(--bg-0)] rounded-xl border border-[var(--line)] overflow-hidden shadow-2xl">
                            <CirclipSVG
                                type="shaft"
                                data={{
                                    d: seg.diameter,
                                    d2: ccCalc.d2,
                                    m: ccCalc.m.toFixed(2),
                                    depth: ccCalc.depth
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            <div className="p-3 rounded bg-[var(--bg-1)] border border-[var(--line)] space-y-1.5">
                                <span className="text-[var(--alu-dim)] text-[10px] block">{t12(language, 'Axial Load Capacity (FN)', 'Eksenel Taşıma Kapasitesi (FN)')}</span>
                                <div className="text-sm font-bold text-[var(--cyan)]">
                                    FN = {ccCalc.FN_KN} kN ({Math.round(ccCalc.FN_KN * 1000)} N)
                                </div>
                                <p className="text-[10px] text-[var(--alu-dim)]">
                                    FN = (π · d · t · σy) / S | σy = {selectedMat.Sy} MPa
                                </p>
                            </div>

                            <div className="p-3 rounded bg-[var(--bg-1)] border border-[var(--line)] space-y-1.5">
                                <span className="text-[var(--alu-dim)] text-[10px] block">{t12(language, 'Safe Edge Margin (mn)', 'Emniyetli Kenar Mesafesi (mn)')}</span>
                                <div className="text-sm font-bold text-[var(--ok)]">
                                    mn ≥ {ccCalc.minEdgeMargin} mm (3 · t)
                                </div>
                                <p className="text-[10px] text-[var(--alu-dim)]">
                                    {t12(language, 'Groove depth', 'Kanal derinliği')} t = {ccCalc.depth} mm | d2 = Ø{ccCalc.d2} h11
                                </p>
                            </div>

                            <div className="p-3 rounded bg-[var(--bg-1)] border border-[var(--line)] space-y-1.5">
                                <span className="text-[var(--alu-dim)] text-[10px] block">{t12(language, 'Shaft-End Assembly Chamfer', 'Mil Başı Montaj Pahı')}</span>
                                <div className="text-sm font-bold text-[var(--warn)]">
                                    {t12(language, '15° Lead-in Chamfer', '15° Lead-in Pah')}
                                </div>
                                <p className="text-[10px] text-[var(--alu-dim)]">
                                    {t12(language, '15° conical entry chamfer preventing deformation during circlip installation.', 'Segmanın takılması sırasında deformasyonu önleyen 15° konik giriş pahı.')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. UNDERCUT (DIN 509) */}
                {detailStandard === 'undercut' && (
                    <div className="space-y-3">
                        <div className="w-full bg-[var(--bg-0)] rounded-xl border border-[var(--line)] overflow-hidden shadow-2xl">
                            <UndercutVisualizer
                                dSmall={seg.diameter}
                                dLarge={Math.round(seg.diameter * 1.3)}
                                r={ucData.radius}
                                form={ucData.form}
                                t1={ucData.depth}
                                t2={ucData.faceDepth}
                                f={ucData.grooveWidth}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            <div className="p-3 rounded bg-[var(--bg-1)] border border-[var(--line)] space-y-1.5">
                                <span className="text-[var(--alu-dim)] text-[10px] block">{t12(language, 'Standard Geometry (DIN 509)', 'Standart Geometri (DIN 509)')}</span>
                                <div className="text-sm font-bold text-sky-400">
                                    {ucData.callout}
                                </div>
                                <p className="text-[10px] text-[var(--alu-dim)]">
                                    r = {ucData.radius} mm, t1 = {ucData.depth} mm, f = {ucData.grooveWidth} mm
                                </p>
                            </div>

                            <div className="p-3 rounded bg-[var(--bg-1)] border border-[var(--line)] space-y-1.5">
                                <span className="text-[var(--alu-dim)] text-[10px] block">{t12(language, 'Transition Angle & Roughness', 'Geçiş Açısı & Pürüzlülük')}</span>
                                <div className="text-sm font-bold text-white">
                                    {t12(language, '15° Ramp · Ra 0.8 µm', '15° Rampa · Ra 0.8 µm')}
                                </div>
                                <p className="text-[10px] text-[var(--alu-dim)]">
                                    {t12(language, 'ISO standard to allow grinding wheel runout and minimize notch effect.', 'Taşlama çarkının çıkışı ve çentik etkisini minimize etmek için ISO standardı.')}
                                </p>
                            </div>

                            <div className="p-3 rounded bg-[var(--bg-1)] border border-[var(--line)] space-y-1.5">
                                <span className="text-[var(--alu-dim)] text-[10px] block">{t12(language, 'DIN 743-2 effective notch factor', 'DIN 743-2 etkin çentik faktörü')}</span>
                                <div className="text-sm font-bold text-[var(--warn)]">
                                    {(() => {
                                        const m = SHAFT_MATERIALS.find((x) => x.id === materialId) ?? SHAFT_MATERIALS[0];
                                        const b = betaFactors({ kind: 'groove', d: seg.diameter - 2 * ucData.depth, t: ucData.depth, r: ucData.radius }, { Rm: m.Sut, Re: m.Sy, steelClass: m.steelClass ?? 'quenched-tempered' }, seg.diameter);
                                        return `βσ = ${b.bs.toFixed(2)} · βτ = ${b.bt.toFixed(2)}`;
                                    })()}
                                </div>
                                <p className="text-[10px] text-[var(--alu-dim)]">
                                    {t12(language, 'Groove αk with stress-gradient support n (DIN 743-2); larger r lowers βσ.', 'Oluk αk ve gerilme gradyanı destek sayısı n ile (DIN 743-2); büyük r, βσ’yı düşürür.')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. CENTER DRILL (DIN 332-1) */}
                {detailStandard === 'center_drill' && (
                    <div className="space-y-3">
                        <div className="w-full bg-[var(--bg-0)] rounded-xl border border-[var(--line)] overflow-hidden shadow-2xl">
                            <CenterDrillSVG
                                data={{
                                    type: t12(language, '60° Lathe Center Drill', '60° Torna Punta Deliği'),
                                    form: cdData.form,
                                    d1: cdData.pilotDia,
                                    d2: cdData.coneDia,
                                    d3: cdData.protectingDia,
                                    t: cdData.totalDepth
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            <div className="p-3 rounded bg-[var(--bg-1)] border border-[var(--line)] space-y-1.5">
                                <span className="text-[var(--alu-dim)] text-[10px] block">{t12(language, 'Standard Geometry (DIN 332-1)', 'Standart Geometri (DIN 332-1)')}</span>
                                <div className="text-sm font-bold text-teal-400">
                                    {cdData.callout}
                                </div>
                                <p className="text-[10px] text-[var(--alu-dim)]">
                                    {t12(language, 'Pilot', 'Kılavuz')} d1 = Ø{cdData.pilotDia} mm, {t12(language, 'Cone', 'Koni')} d2 = Ø{cdData.coneDia} mm
                                </p>
                            </div>

                            <div className="p-3 rounded bg-[var(--bg-1)] border border-[var(--line)] space-y-1.5">
                                <span className="text-[var(--alu-dim)] text-[10px] block">{t12(language, '120° Protective Outer Counterbore (d3)', '120° Koruyucu Dış Havşa (d3)')}</span>
                                <div className="text-sm font-bold text-white">
                                    Ø{cdData.protectingDia ?? (cdData.coneDia * 1.5).toFixed(1)} mm
                                </div>
                                <p className="text-[10px] text-[var(--alu-dim)]">
                                    {t12(language, 'Form B protective counterbore protects center drill point from impact and burrs.', 'Form B koruyucu dış havşası torna punta merkezini darbe ve taşlama çapaklarından korur.')}
                                </p>
                            </div>

                            <div className="p-3 rounded bg-[var(--bg-1)] border border-[var(--line)] space-y-1.5">
                                <span className="text-[var(--alu-dim)] text-[10px] block">{t12(language, 'Total Machining Depth', 'Toplam İşleme Derinliği')}</span>
                                <div className="text-sm font-bold text-[var(--ok)]">
                                    t = {cdData.totalDepth} mm
                                </div>
                                <p className="text-[10px] text-[var(--alu-dim)]">
                                    {t12(language, 'Machined on shaft face using DIN 332 center drill.', 'Mil alın yüzeyine DIN 332 Punta ucu ile açılır.')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. IMBUS (DIN 912 / ISO 4762) */}
                {detailStandard === 'imbus' && (
                    <div className="space-y-3">
                        <div className="w-full bg-[var(--bg-0)] rounded-xl border border-[var(--line)] overflow-hidden shadow-2xl">
                            <ImbusSVG
                                data={{
                                    size: imbusData.thread,
                                    D: imbusData.counterboreDia,
                                    T: imbusData.counterboreDepth,
                                    d: seg.diameter,
                                    dk: imbusData.counterboreDia - 2,
                                    k: imbusData.counterboreDepth - 2,
                                    s: 8,
                                    dh: imbusData.clearanceDia
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            <div className="p-3 rounded bg-[var(--bg-1)] border border-[var(--line)] space-y-1.5">
                                <span className="text-[var(--alu-dim)] text-[10px] block">{t12(language, 'DIN 74 Form H Counterbore Dimensions', 'DIN 74 Form H Havşa Boyutları')}</span>
                                <div className="text-sm font-bold text-blue-400">
                                    Ø{imbusData.counterboreDia} x {imbusData.counterboreDepth} mm
                                </div>
                                <p className="text-[10px] text-[var(--alu-dim)]">
                                    {t12(language, 'Clearance Hole', 'Geçiş Deliği')} dh = Ø{imbusData.clearanceDia} mm ({t12(language, 'ISO 273 Medium', 'ISO 273 Orta')})
                                </p>
                            </div>

                            <div className="p-3 rounded bg-[var(--bg-1)] border border-[var(--line)] space-y-1.5">
                                <span className="text-[var(--alu-dim)] text-[10px] block">{t12(language, 'VDI 2230 Tightening Torque (MA)', 'VDI 2230 Sıkma Torku (MA)')}</span>
                                <div className="text-sm font-bold text-[var(--ok)]">
                                    MA ≈ {(Number(imbusData.thread.replace('M', '')) * 8.5).toFixed(1)} N·m
                                </div>
                                <p className="text-[10px] text-[var(--alu-dim)]">
                                    {t12(language, 'Recommended assembly torque for grade 8.8 steel bolt at μ = 0.14 friction coefficient.', '8.8 kalite çelik cıvata için μ = 0.14 sürtünme katsayısında önerilen montaj torku.')}
                                </p>
                            </div>

                            <div className="p-3 rounded bg-[var(--bg-1)] border border-[var(--line)] space-y-1.5">
                                <span className="text-[var(--alu-dim)] text-[10px] block">{t12(language, 'Bolt Head & Hex Key Size', 'Cıvata Kafa ve Anahtar Ölçüsü')}</span>
                                <div className="text-sm font-bold text-white">
                                    {imbusData.thread} · SW {Math.max(4, Math.round(Number(imbusData.thread.replace('M', '')) * 0.8))}
                                </div>
                                <p className="text-[10px] text-[var(--alu-dim)]">
                                    {t12(language, 'Shaft-end axial fastening (pulley or flange clamping).', 'Mil eksenine paralel alın montajı (kasnak veya flanş sabitleme).')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full h-full min-h-0 flex flex-col bg-[var(--bg-0)] text-[var(--ink)] font-sans select-none overflow-hidden">
            {/* TOP BAR / CAD COMMAND RIBBON */}
            <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-[var(--bg-1)] border-b border-[var(--line)] gap-2 shrink-0">
                {/* Left: Module Title, Standards & Preset */}
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-[var(--cyan)]/10 border border-[var(--cyan)]/30 flex items-center justify-center text-[var(--cyan)] shrink-0">
                        <Disc size={15} />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-xs font-bold text-white tracking-wide uppercase font-mono whitespace-nowrap">
                            {t12(language, 'Stepped Shaft CAD', 'Kademeli Mil CAD')}
                        </h1>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--cyan)]/20 text-[var(--cyan)] font-mono font-semibold">
                            DIN 743
                        </span>
                    </div>

                    <div className="w-[1px] h-4 bg-[var(--line)] mx-0.5 hidden sm:block" />

                    {/* Presets dropdown */}
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-[var(--alu-dim)] font-mono hidden md:inline">{t12(language, 'Preset:', 'Şablon:')}</span>
                        <select
                            value={selectedPreset}
                            onChange={(e) => handlePresetChange(e.target.value as any)}
                            className="px-2 py-0.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[11px] text-[var(--cyan)] font-mono font-bold focus:outline-none cursor-pointer"
                        >
                            <option value="default">{t12(language, '5-Step General Shaft', '5-Kademe Genel Mil')}</option>
                            <option value="motor">{t12(language, '⚡ Electric Motor Shaft', '⚡ Elektrik Motoru Mili')}</option>
                            <option value="gearbox">{t12(language, '⚙️ Gearbox Intermediate Shaft', '⚙️ Redüktör Ara Mili')}</option>
                            <option value="pump">{t12(language, '🌊 Centrifugal Pump Shaft', '🌊 Santrifüj Pompa Mili')}</option>
                            <option value="simple">{t12(language, '3-Step Basic Shaft', '3-Kademe Temel Mil')}</option>
                        </select>
                    </div>
                </div>

                {/* Center: Quick Configuration Controls */}
                <div className="flex items-center gap-2 bg-[var(--bg-2)] px-2 py-1 rounded border border-[var(--line)] text-xs font-mono">
                    {/* Total Length Input */}
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-[var(--alu-dim)] font-semibold">L:</span>
                        <input
                            type="number"
                            min={50}
                            max={3000}
                            step={10}
                            value={Math.round(totalLength)}
                            onChange={(e) => setTotalLength(Math.max(50, Number(e.target.value)))}
                            className="w-13 px-1 py-0.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-xs text-white font-mono text-center font-bold"
                            title={t12(language, 'Total Shaft Length (mm)', 'Toplam Mil Boyu (mm)')}
                        />
                        <span className="text-[10px] text-[var(--alu-dim)]">mm</span>
                    </div>

                    <div className="w-[1px] h-3.5 bg-[var(--line)]" />

                    {/* Split count */}
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-[var(--alu-dim)] font-semibold">{t12(language, 'Split:', 'Böl:')}</span>
                        <input
                            type="number"
                            min={1}
                            max={10}
                            value={quickDivCount}
                            onChange={(e) => setQuickDivCount(Number(e.target.value))}
                            className="w-10 px-1 py-0.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-xs text-white font-mono text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                            onClick={() => setSegmentCount(quickDivCount)}
                            className="px-1.5 py-0.5 rounded bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 text-[var(--cyan)] border border-[var(--cyan)]/40 text-[10px] font-mono font-bold transition-colors"
                            title={t12(language, 'Split Shaft into Equal Segments', 'Mili Eşit Kademelere Böl')}
                        >
                            {t12(language, 'Apply', 'Uygula')}
                        </button>
                    </div>

                    <div className="w-[1px] h-3.5 bg-[var(--line)]" />

                    {/* Material */}
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-[var(--alu-dim)] font-semibold">{t12(language, 'Steel:', 'Çelik:')}</span>
                        <select
                            value={materialId}
                            onChange={(e) => setMaterialId(e.target.value)}
                            className="px-1.5 py-0.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-xs text-white font-mono cursor-pointer"
                        >
                            {SHAFT_MATERIALS.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.name.split(' / ')[0]} ({m.Sy} MPa)
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Right: Key Safety Telemetry Badge & Actions */}
                {result && (
                    <div className="flex items-center gap-1.5">
                        {/* Safety factor badge */}
                        <div className={`px-2 py-0.5 rounded border flex items-center gap-1 text-xs font-mono font-bold ${
                            result.isSafeOverall 
                                ? 'bg-[var(--ok)]/10 border-[var(--ok)]/40 text-[var(--ok)]' 
                                : 'bg-[var(--bad)]/10 border-[var(--bad)]/40 text-[var(--bad)]'
                        }`}>
                            {result.isSafeOverall ? <ShieldCheck size={13} /> : <AlertTriangle size={13} />}
                            <span title={`DIN 743: S_F = ${result.minStaticSafety ?? '–'}, S_D = ${result.minFatigueSafety ?? '–'}`}>S = {result.minSafetyFactor}</span>
                        </div>

                        {/* Direct Transfer Buttons */}
                        <button
                            onClick={() => transferShaftToCadEditor(segments)}
                            className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-[11px] font-mono text-amber-400 flex items-center gap-1 font-bold transition-colors"
                            title={t12(language, 'Transfer Shaft to 2D CAD Editor', "Mili 2D CAD Editör'e Aktar")}
                        >
                            <Compass size={12} />
                            <span>2D CAD</span>
                        </button>

                        <button
                            onClick={() => transferShaftToDesignStudio(segments, 'Kademeli Mil')}
                            className="px-2 py-1 rounded bg-[var(--cyan)]/20 hover:bg-[var(--cyan)]/30 border border-[var(--cyan)]/50 text-[11px] font-mono text-[var(--cyan)] flex items-center gap-1 font-bold transition-colors"
                            title={t12(language, 'Transfer Shaft to 3D CAD Studio', "Mili 3D CAD Stüdyo'ya Aktar")}
                        >
                            <Box size={12} />
                            <span>{t12(language, '3D Studio', '3D Stüdyo')}</span>
                        </button>

                        {/* Export Buttons */}
                        <div className="flex items-center rounded border border-[var(--line)] overflow-hidden bg-[var(--bg-2)]">
                            <button
                                onClick={() => downloadShaftDXF(segments)}
                                className="px-2 py-1 hover:bg-[var(--bg-3)] border-r border-[var(--line)] text-[10px] font-mono text-sky-400 font-bold transition-colors"
                                title={t12(language, 'Download 2D AutoCAD DXF Technical Drawing', '2D AutoCAD DXF Teknik Çizimini İndir')}
                            >
                                DXF
                            </button>
                            <button
                                onClick={() => downloadShaftSTL(segments)}
                                className="px-2 py-1 hover:bg-[var(--bg-3)] border-r border-[var(--line)] text-[10px] font-mono text-emerald-400 font-bold transition-colors"
                                title={t12(language, 'Download 3D STL Solid Model File', '3D STL Katı Model Dosyasını İndir')}
                            >
                                STL
                            </button>
                            <button
                                onClick={copyReport}
                                className="px-2 py-1 hover:bg-[var(--bg-3)] text-[10px] font-mono text-[var(--alu)] flex items-center gap-0.5 transition-colors"
                                title={t12(language, 'Copy DIN 743 Report', 'DIN 743 Raporunu Kopyala')}
                            >
                                {copied ? <Check size={11} className="text-[var(--ok)]" /> : <Copy size={11} />}
                                <span>{copied ? 'OK' : t12(language, 'Report', 'Rapor')}</span>
                            </button>
                        </div>

                        {/* Inspector Toggle Button */}
                        <button
                            onClick={() => setInspectorOpen(!inspectorOpen)}
                            className={`px-2 py-1 rounded border text-[11px] font-mono flex items-center gap-1 transition-colors ${
                                inspectorOpen 
                                    ? 'bg-[var(--cyan)]/20 border-[var(--cyan)]/50 text-[var(--cyan)]' 
                                    : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:text-white'
                            }`}
                            title={t12(language, 'Toggle Feature & Notch Inspector Panel', 'Özellik & Çentik Denetçi Panelini Aç/Kapat')}
                        >
                            {inspectorOpen ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
                            <span className="hidden sm:inline">{t12(language, 'Properties', 'Özellikler')}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* View Mode Navigation Bar */}
            <div className="flex items-center justify-between px-3 py-1 bg-[var(--bg-1)] border-b border-[var(--line)] text-xs font-mono shrink-0">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setActiveTab('drawing')}
                        className={`px-2.5 py-0.5 rounded transition-colors flex items-center gap-1.5 text-[11px] ${
                            activeTab === 'drawing' 
                                ? 'bg-[var(--cyan)]/20 border border-[var(--cyan)]/50 text-[var(--cyan)] font-bold' 
                                : 'text-[var(--alu-dim)] hover:text-white'
                        }`}
                    >
                        <Layers size={12} /> {t12(language, '2D CAD Drawing', '2D CAD Çizim')}
                    </button>
                    <button
                        onClick={() => setActiveTab('diagrams')}
                        className={`px-2.5 py-0.5 rounded transition-colors flex items-center gap-1.5 text-[11px] ${
                            activeTab === 'diagrams' 
                                ? 'bg-[var(--cyan)]/20 border border-[var(--cyan)]/50 text-[var(--cyan)] font-bold' 
                                : 'text-[var(--alu-dim)] hover:text-white'
                        }`}
                    >
                        <Activity size={12} /> {t12(language, 'Stress & Moment', 'Gerilme & Moment')}
                    </button>
                    <button
                        onClick={() => setActiveTab('checks')}
                        className={`px-2.5 py-0.5 rounded transition-colors flex items-center gap-1.5 text-[11px] ${
                            activeTab === 'checks' 
                                ? 'bg-[var(--cyan)]/20 border border-[var(--cyan)]/50 text-[var(--cyan)] font-bold' 
                                : 'text-[var(--alu-dim)] hover:text-white'
                        }`}
                    >
                        <ShieldCheck size={12} /> {t12(language, 'DIN 743 Notch Analysis', 'DIN 743 Çentik Analizi')} ({result?.criticalChecks.length ?? 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('standards')}
                        className={`px-2.5 py-0.5 rounded transition-colors flex items-center gap-1.5 text-[11px] ${
                            activeTab === 'standards' 
                                ? 'bg-[var(--cyan)]/20 border border-[var(--cyan)]/50 text-[var(--cyan)] font-bold' 
                                : 'text-[var(--alu-dim)] hover:text-white'
                        }`}
                    >
                        <Sparkles size={12} /> {t12(language, '1:1 Standards Inspection', '1:1 Standart Muayenesi')}
                    </button>
                </div>

                {/* Right Hint */}
                <div className="hidden lg:flex items-center gap-2 text-[10px] text-[var(--alu-dim)]">
                    <span>{t12(language, '💡 Drag segments, diameters, and features directly on the drawing canvas', '💡 Kademeleri, çapları ve unsurları doğrudan çizim üzerinde sürükleyebilirsiniz')}</span>
                </div>
            </div>

            {/* MAIN CAD WORKSPACE & INSPECTOR SPLIT */}
            <div className="flex-1 min-h-0 flex flex-row overflow-hidden relative">
                {/* CENTER: SVG CAD DRAWING WORKBENCH */}
                <div className="flex-1 min-h-0 flex flex-col bg-[var(--bg-0)] overflow-hidden">
                    {activeTab === 'drawing' && (
                        <div className="flex-1 min-h-0 flex flex-col p-2 space-y-2 overflow-hidden">
                            {/* SVG CANVAS (Hero Component) */}
                            <div className="flex-1 min-h-[360px] w-full relative">
                                <ShaftDrawingSVG
                                    totalLength={totalLength}
                                    segments={segments}
                                    selectedSegmentId={selectedSegmentId}
                                    selectedFeatureId={selectedFeatureId}
                                    supportAPos={supportAPos}
                                    supportBPos={supportBPos}
                                    supportABearing={supportABearing}
                                    supportBBearing={supportBBearing}
                                    radialLoads={radialLoads}
                                    torqueNm={torque.torqueNm}
                                    onSelectSegment={selectSegment}
                                    onSelectFeature={selectFeature}
                                    onUpdateSegment={updateSegment}
                                    onMoveBoundary={moveBoundary}
                                    onSplitSegment={splitSegment}
                                    onRemoveSegment={removeSegment}
                                    onAddFeature={addFeatureToSegment}
                                    onUpdateFeature={updateFeature}
                                    onRemoveFeature={removeFeature}
                                    onSetSupports={setSupports}
                                    onOpenBearingModal={(supId) => {
                                        setBearingModalSupport(supId);
                                        setBearingModalOpen(true);
                                    }}
                                    onUpdateRadialLoad={updateRadialLoad}
                                    onOpenDetailModal={(segId) => {
                                        const s = segments.find(x => x.id === segId) ?? selectedSeg;
                                        const firstFeat = s?.features[0];
                                        if (firstFeat) {
                                            if (firstFeat.type === 'keyway') setDetailStandard('keyway');
                                            else if (firstFeat.type === 'circlip') setDetailStandard('circlip');
                                            else if (firstFeat.type === 'undercut') setDetailStandard('undercut');
                                            else if (firstFeat.type === 'center_drill') setDetailStandard('center_drill');
                                            else if (firstFeat.type === 'imbus') setDetailStandard('imbus');
                                        }
                                        setDetailModalOpen(true);
                                    }}
                                    onToggleShoulderTransition={(segIdx, trans) => setShoulderTransition(segIdx, trans)}
                                />
                            </div>

                            {/* SYNCHRONIZED BOTTOM TELEMETRY STRIP & REALTIME CURVES */}
                            {result && (
                                <div className="p-2 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] flex flex-col gap-2 shrink-0">
                                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                                        {/* Core live stats */}
                                        <div className="flex items-center gap-4 text-[11px]">
                                            <div>
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Bearing Reactions:', 'Yatak Tepkileri:')} </span>
                                                <span className="text-[var(--cyan)] font-bold">Ra = {result.supportReactions.RaN} N</span>
                                                <span className="text-[var(--alu-dim)]">, </span>
                                                <span className="text-[var(--cyan)] font-bold">Rb = {result.supportReactions.RbN} N</span>
                                            </div>
                                            <div className="w-[1px] h-3 bg-[var(--line)]" />
                                            <div>
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Max Bending Mmax:', 'Maks Eğilme Mmax:')} </span>
                                                <span className="text-[var(--warn)] font-bold">{result.maxBendingMomentNm} N·m</span>
                                                <span className="text-[var(--alu-dim)] text-[10px]"> (x={result.maxBendingMomentX}mm)</span>
                                            </div>
                                            <div className="w-[1px] h-3 bg-[var(--line)]" />
                                            <div>
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Max Deflection ymax:', 'Maks Sehim ymax:')} </span>
                                                <span className="text-[var(--ok)] font-bold">{result.maxDeflectionMm} mm</span>
                                                <span className="text-[var(--alu-dim)] text-[10px]"> (x={result.maxDeflectionX}mm)</span>
                                            </div>
                                            <div className="w-[1px] h-3 bg-[var(--line)]" />
                                            <div>
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Critical Speed:', 'Kritik Hız:')} </span>
                                                <span className="text-white font-bold">{result.criticalSpeedRpm} {t12(language, 'rpm', 'd/dk')}</span>
                                            </div>
                                            <div className="w-[1px] h-3 bg-[var(--line)]" />
                                            <div>
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Mass:', 'Kütle:')} </span>
                                                <span className="text-white font-bold">{result.totalMassKg} kg</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setShowUnderplot(!showUnderplot)}
                                            className="text-[10px] text-[var(--alu-dim)] hover:text-[var(--cyan)] flex items-center gap-1 font-mono"
                                        >
                                            <Activity size={11} /> {showUnderplot ? t12(language, 'Hide Diagram', 'Diyagramı Gizle') : t12(language, 'Show Moment Curve', 'Moment Eğrisini Gör')}
                                        </button>
                                    </div>

                                    {/* Mini Under-Canvas Bending Moment & Stress Curve */}
                                    {showUnderplot && (
                                        <div className="w-full h-16 bg-[var(--bg-0)] rounded border border-[var(--line)] p-1 flex items-center">
                                            <svg viewBox="0 0 980 60" className="w-full h-full" preserveAspectRatio="none">
                                                <line x1="60" y1="30" x2="920" y2="30" stroke="#1c2838" strokeWidth="0.8" strokeDasharray="4,2" />
                                                {/* Moment Polyline */}
                                                <polyline
                                                    fill="none"
                                                    stroke="#3ad0e6"
                                                    strokeWidth="1.8"
                                                    points={result.points.map(pt => {
                                                        const px = 60 + (pt.x / totalLength) * 860;
                                                        const py = 30 - (pt.bendingMomentNm / (result.maxBendingMomentNm || 1)) * 25;
                                                        return `${px},${py}`;
                                                    }).join(' ')}
                                                />
                                                {/* Text readout */}
                                                <text x="65" y="15" fill="#3ad0e6" fontSize="9" fontFamily="monospace" fontWeight="bold">
                                                    {t12(language, 'M(x) Bending Moment Curve [N·m]', 'M(x) Eğilme Momenti Eğrisi [N·m]')}
                                                </text>
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: MOMENT, STRESS & DEFLECTION DIAGRAMS */}
                    {activeTab === 'diagrams' && result && (
                        <div className="flex-1 min-h-0 p-3 overflow-y-auto space-y-4 custom-scrollbar">
                            {/* Bending Moment Diagram */}
                            <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2">
                                <div className="flex items-center justify-between text-xs font-mono font-bold text-[var(--cyan)]">
                                    <span>{t12(language, 'BENDING MOMENT DIAGRAM M(x) [N·m]', 'EĞİLME MOMENTİ DİYAGRAMI M(x) [N·m]')}</span>
                                    <span>{t12(language, 'Max:', 'Maks:')} {result.maxBendingMomentNm} N·m (x={result.maxBendingMomentX} mm)</span>
                                </div>
                                <svg viewBox="0 0 800 130" className="w-full h-32 bg-[var(--bg-0)] rounded border border-[var(--line)]">
                                    <line x1="40" y1="65" x2="760" y2="65" stroke="#24344d" strokeWidth="1" strokeDasharray="4,2" />
                                    <polyline
                                        fill="none"
                                        stroke="#3ad0e6"
                                        strokeWidth="2"
                                        points={result.points.map(pt => {
                                            const px = 40 + (pt.x / totalLength) * 720;
                                            const py = 65 - (pt.bendingMomentNm / (result.maxBendingMomentNm || 1)) * 50;
                                            return `${px},${py}`;
                                        }).join(' ')}
                                    />
                                </svg>
                            </div>

                            {/* von Mises Stress & Peak Notch Stress */}
                            <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2">
                                <div className="flex items-center justify-between text-xs font-mono font-bold text-[var(--warn)]">
                                    <span>{t12(language, 'EQUIVALENT VON MISES STRESS σvm(x) & PEAK NOTCH STRESS [MPa]', 'EŞDEĞER VON MISES GERİLMESİ σvm(x) & PİK ÇENTİK GERİLMESİ [MPa]')}</span>
                                    <span>{t12(language, 'Yield Strength Re =', 'Akma Sınırı Re =')} {selectedMat.Sy} MPa</span>
                                </div>
                                <svg viewBox="0 0 800 130" className="w-full h-32 bg-[var(--bg-0)] rounded border border-[var(--line)]">
                                    <line x1="40" y1="110" x2="760" y2="110" stroke="#24344d" strokeWidth="1" />
                                    {/* Yield strength reference line */}
                                    <line x1="40" y1="20" x2="760" y2="20" stroke="#e85d5d" strokeWidth="1" strokeDasharray="3,3" />
                                    <text x="765" y="24" fill="#e85d5d" fontSize="8" fontFamily="monospace">Re</text>

                                    {/* Nominal Stress */}
                                    <polyline
                                        fill="none"
                                        stroke="#ffaa55"
                                        strokeWidth="1.5"
                                        points={result.points.map(pt => {
                                            const px = 40 + (pt.x / totalLength) * 720;
                                            const maxPlot = selectedMat.Sy * 1.2;
                                            const py = 110 - (pt.vonMisesStressMPa / maxPlot) * 90;
                                            return `${px},${py}`;
                                        }).join(' ')}
                                    />
                                    {/* Indicative notch stress σvm·βσ */}
                                    <polyline
                                        fill="none"
                                        stroke="#e85d5d"
                                        strokeWidth="2"
                                        strokeDasharray="2,1"
                                        points={result.points.map(pt => {
                                            const px = 40 + (pt.x / totalLength) * 720;
                                            const maxPlot = selectedMat.Sy * 1.2;
                                            const py = 110 - (pt.effectivePeakStressMPa / maxPlot) * 90;
                                            return `${px},${py}`;
                                        }).join(' ')}
                                    />
                                </svg>
                            </div>

                            {/* Deflection Curve */}
                            <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2">
                                <div className="flex items-center justify-between text-xs font-mono font-bold text-[var(--ok)]">
                                    <span>{t12(language, 'SHAFT DEFLECTION PROFILE y(x) [mm]', 'MİL SEHİM PROFİLİ y(x) [mm]')}</span>
                                    <span>{t12(language, 'Max Deflection:', 'Maks Sehim:')} {result.maxDeflectionMm} mm (x={result.maxDeflectionX} mm)</span>
                                </div>
                                <svg viewBox="0 0 800 120" className="w-full h-28 bg-[var(--bg-0)] rounded border border-[var(--line)]">
                                    <line x1="40" y1="30" x2="760" y2="30" stroke="#24344d" strokeWidth="1" strokeDasharray="4,2" />
                                    <polyline
                                        fill="none"
                                        stroke="#3dd68c"
                                        strokeWidth="2"
                                        points={result.points.map(pt => {
                                            const px = 40 + (pt.x / totalLength) * 720;
                                            const py = 30 + (pt.deflectionMm / (result.maxDeflectionMm || 1)) * 60;
                                            return `${px},${py}`;
                                        }).join(' ')}
                                    />
                                </svg>
                            </div>
                        </div>
                    )}

                    {/* TAB: DIN 743 NOTCH & STRESS CHECK TABLE */}
                    {activeTab === 'checks' && result && (
                        <div className="flex-1 min-h-0 p-3 overflow-y-auto space-y-3 custom-scrollbar">
                            <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)]">
                                <h3 className="text-xs font-bold uppercase font-mono text-[var(--cyan)] mb-2 flex items-center gap-1.5">
                                    <ShieldCheck size={14} /> {t12(language, 'DIN 743 notch factors (βσ) and safeties S_F / S_D', 'DIN 743 çentik faktörleri (βσ) ve emniyetler S_F / S_D')}
                                </h3>
                                <p className="text-[11px] text-[var(--alu-dim)] mb-3">
                                    {t12(language, `Static safety S_F (DIN 743-1 §7) and fatigue safety S_D (DIN 743-1 §6, rotating bending + steady torque) at every shoulder and feature. S = min(S_F, S_D); DIN 743 requires S ≥ 1.2. Minimum: S_F ${result.minStaticSafety ?? '–'}, S_D ${result.minFatigueSafety ?? '–'}.`, `Her omuz ve unsurda statik emniyet S_F (DIN 743-1 §7) ve yorulma emniyeti S_D (DIN 743-1 §6, dönen eğilme + sabit tork). S = min(S_F, S_D); DIN 743 S ≥ 1.2 ister. En düşük: S_F ${result.minStaticSafety ?? '–'}, S_D ${result.minFatigueSafety ?? '–'}.`)}
                                </p>

                                {result.criticalChecks.length === 0 ? (
                                    <div className="p-4 rounded bg-[var(--bg-2)] border border-[var(--line)] text-center text-xs text-[var(--alu-dim)] font-mono">
                                        {t12(language, 'No critical features assigned to this shaft yet. You can add keyways, circlips, or cross-holes to segments on the drawing.', 'Bu milde henüz atanmış kritik unsur bulunmamaktadır. Çizim üzerinden kademelere kama, segman veya delik ekleyebilirsiniz.')}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs font-mono border-collapse">
                                            <thead>
                                                <tr className="border-b border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu-dim)]">
                                                    <th className="p-2">{t12(language, 'Feature / Standard', 'Unsur / Standart')}</th>
                                                    <th className="p-2">{t12(language, 'Position (x)', 'Konum (x)')}</th>
                                                    <th className="p-2">{t12(language, 'Diameter (d)', 'Çap (d)')}</th>
                                                    <th className="p-2">{t12(language, 'Nominal σ', 'Nominal σ')}</th>
                                                    <th className="p-2" title="DIN 743-2">βσ</th>
                                                    <th className="p-2">S_F / S_D</th>
                                                    <th className="p-2">{t12(language, 'Safety S', 'Emniyet S')}</th>
                                                    <th className="p-2">{t12(language, 'Status', 'Durum')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--line)]">
                                                {result.criticalChecks.map((chk, i) => (
                                                    <tr key={i} className="hover:bg-[var(--bg-2)]">
                                                        <td className="p-2 font-semibold text-white">{chk.description}</td>
                                                        <td className="p-2 text-[var(--alu)]">{chk.positionX} mm</td>
                                                        <td className="p-2 text-[var(--alu)]">Ø{chk.localDiameter} mm</td>
                                                        <td className="p-2 text-[var(--alu)]">{chk.nominalStressMPa.toFixed(1)} MPa</td>
                                                        <td className="p-2 text-[var(--warn)] font-bold">{chk.Kt}</td>
                                                        <td className="p-2 text-[var(--alu)]">{(chk.notes ?? '').replace('DIN 743: ', '').replace('S_F = ', '').replace(', S_D = ', ' / ')}</td>
                                                        <td className="p-2 font-bold" style={{
                                                            color: chk.safetyFactor >= targetSafetyFactor ? 'var(--ok)' : (chk.safetyFactor >= 1.0 ? 'var(--warn)' : 'var(--bad)')
                                                        }}>
                                                            {chk.safetyFactor}
                                                        </td>
                                                        <td className="p-2">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                chk.status === 'PASS' 
                                                                    ? 'bg-[var(--ok)]/20 text-[var(--ok)]' 
                                                                    : (chk.status === 'WARN' ? 'bg-[var(--warn)]/20 text-[var(--warn)]' : 'bg-[var(--bad)]/20 text-[var(--bad)]')
                                                            }`}>
                                                                {chk.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Warnings box */}
                            {result.summaryWarnings.length > 0 && (
                                <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bad)]/10 border border-[var(--bad)]/30 space-y-1.5 font-mono text-xs">
                                    <div className="flex items-center gap-1.5 text-[var(--bad)] font-bold">
                                        <AlertTriangle size={14} /> {t12(language, 'Engineering Warnings:', 'Mühendislik Uyarıları:')}
                                    </div>
                                    {result.summaryWarnings.map((w, idx) => (
                                        <p key={idx} className="text-[var(--bad)] leading-snug">
                                            · {w}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: 1:1 ENGINEERING STANDARDS INSPECTION */}
                    {activeTab === 'standards' && (
                        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                            {renderStandardsView()}
                        </div>
                    )}
                </div>

                {/* RIGHT: DOCKED / COLLAPSIBLE ELEMENT & NOTCH INSPECTOR */}
                {inspectorOpen && (
                    <div className="w-[320px] xl:w-[350px] shrink-0 flex flex-col bg-[var(--bg-1)] border-l border-[var(--line)] overflow-y-auto p-3 space-y-3 custom-scrollbar z-20">
                        {/* Header of Inspector */}
                        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--cyan)] flex items-center gap-1.5 font-mono">
                                <Wrench size={14} /> {t12(language, 'Element & Notch Inspector', 'Eleman & Çentik Denetçisi')}
                            </span>
                            <button
                                onClick={() => setInspectorOpen(false)}
                                className="text-[var(--alu-dim)] hover:text-white p-1 rounded"
                                title={t12(language, 'Hide Panel', 'Paneli Gizle')}
                            >
                                <PanelRightClose size={14} />
                            </button>
                        </div>

                        {/* 1. Selected Segment Inspector */}
                        {selectedSeg ? (
                            <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--cyan)]/30 space-y-2.5">
                                <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                                    <span className="text-xs font-bold uppercase text-white font-mono flex items-center gap-1">
                                        {t12(language, 'Segment S', 'Kademe S')}{selectedSeg.segmentIndex + 1} {t12(language, 'Details', 'Detayları')}
                                    </span>
                                    {segments.length > 1 && (
                                        <button
                                            onClick={() => removeSegment(selectedSeg.id)}
                                            className="text-[var(--bad)] hover:bg-[var(--bad)]/10 p-1 rounded"
                                            title={t12(language, 'Delete Segment', 'Bu Kademeyi Sil')}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                    <div>
                                        <label className="text-[9px] text-[var(--alu-dim)] block mb-0.5">{t12(language, 'Diameter Ø (mm)', 'Çap Ø (mm)')}</label>
                                        <input
                                            type="number"
                                            min={5}
                                            max={300}
                                            value={selectedSeg.diameter}
                                            onChange={(e) => updateSegment(selectedSeg.id, { diameter: Math.max(5, Number(e.target.value)) })}
                                            className="w-full px-2 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-white font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-[var(--alu-dim)] block mb-0.5">{t12(language, 'Length L (mm)', 'Boy L (mm)')}</label>
                                        <input
                                            type="number"
                                            min={5}
                                            max={1500}
                                            value={selectedSeg.length}
                                            onChange={(e) => updateSegment(selectedSeg.id, { length: Math.max(5, Number(e.target.value)) })}
                                            className="w-full px-2 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-white font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-[var(--alu-dim)] block mb-0.5">{t12(language, 'Shoulder Fillet Radius r (mm)', 'Omuz Radyüsü r (mm)')}</label>
                                        <input
                                            type="number"
                                            min={0.2}
                                            max={20}
                                            step={0.5}
                                            value={selectedSeg.shoulderFilletRadius}
                                            onChange={(e) => updateSegment(selectedSeg.id, { shoulderFilletRadius: Number(e.target.value) })}
                                            className="w-full px-2 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-[var(--alu-dim)] block mb-0.5">{t12(language, 'Tolerance Class', 'Tolerans Sınıfı')}</label>
                                        <select
                                            value={selectedSeg.toleranceGrade}
                                            onChange={(e) => updateSegment(selectedSeg.id, { toleranceGrade: e.target.value })}
                                            className="w-full px-1.5 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-white"
                                        >
                                            <option value="k6">k6 ({t12(language, 'Bearing', 'Rulman')})</option>
                                            <option value="m5">m5 ({t12(language, 'Tight Bearing', 'Sıkı Rulman')})</option>
                                            <option value="h7">h7 ({t12(language, 'Pulley/Gear', 'Kasnak/Dişli')})</option>
                                            <option value="js6">js6 ({t12(language, 'Precision', 'Hassas')})</option>
                                            <option value="g6">g6 ({t12(language, 'Sliding Fit', 'Kayar Geçme')})</option>
                                            <option value="h9">h9 ({t12(language, 'Free', 'Serbest')})</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-[var(--alu-dim)] block mb-0.5">{t12(language, 'Left Chamfer (mm)', 'Sol Pah (mm)')}</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={20}
                                            step={0.5}
                                            lang={language === 'tr' ? 'tr' : 'en'}
                                            value={selectedSeg.chamferLeft ?? 1.5}
                                            onChange={(e) => setSegmentChamfer(selectedSeg.id, Number(e.target.value), selectedSeg.chamferRight ?? 1.0)}
                                            className="w-full px-2 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-[var(--alu-dim)] block mb-0.5">{t12(language, 'Right Chamfer (mm)', 'Sağ Pah (mm)')}</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={20}
                                            step={0.5}
                                            lang={language === 'tr' ? 'tr' : 'en'}
                                            value={selectedSeg.chamferRight ?? 1.0}
                                            onChange={(e) => setSegmentChamfer(selectedSeg.id, selectedSeg.chamferLeft ?? 1.5, Number(e.target.value))}
                                            className="w-full px-2 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-white"
                                        />
                                    </div>
                                    <div className="col-span-2 pt-0.5">
                                        <button
                                            type="button"
                                            onClick={() => setGlobalChamfers(1.5)}
                                            className="w-full py-1 rounded bg-[var(--cyan)]/10 hover:bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/30 text-[10px] font-mono font-bold text-center flex items-center justify-center gap-1"
                                        >
                                            <Sparkles size={11} /> {t12(language, 'Auto Apply 1.5x45° Chamfer to Outer Corners', 'Dış Köşelere Otomatik 1.5x45° Pah Uygula')}
                                        </button>
                                    </div>
                                </div>

                                {/* Omuz Geçişi (İç Yüzey: DIN 509 Taşlama Boşaltması veya DIN 743 Radyüs) */}
                                <div className="p-2 rounded bg-[var(--bg-0)] border border-[var(--line)] space-y-1.5 font-mono">
                                    <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-[var(--alu-dim)] uppercase font-semibold">{t12(language, 'Shoulder Transition (Inner Face):', 'Omuz Geçişi (İç Yüzey):')}</span>
                                        <span className="text-[9px] text-[var(--cyan)] font-bold">
                                            {selectedSeg.shoulderTransition === 'radius' ? `DIN 743 ${t12(language, 'Radius', 'Radyüs')}` : `DIN 509 ${t12(language, 'Undercut', 'Taşlama')}`}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                                        <button
                                            type="button"
                                            onClick={() => setShoulderTransition(selectedSeg.segmentIndex, 'undercut')}
                                            className={`py-1 rounded border font-bold transition-colors ${
                                                (selectedSeg.shoulderTransition ?? 'undercut') === 'undercut'
                                                    ? 'bg-sky-500/25 border-sky-400 text-sky-300 shadow-sm'
                                                    : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:text-white'
                                            }`}
                                        >
                                            ⚙️ DIN 509 {t12(language, 'Undercut', 'Taşlama')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShoulderTransition(selectedSeg.segmentIndex, 'radius')}
                                            className={`py-1 rounded border font-bold transition-colors ${
                                                selectedSeg.shoulderTransition === 'radius'
                                                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-sm'
                                                    : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:text-white'
                                            }`}
                                        >
                                            ⌒ DIN 743 {t12(language, 'Radius', 'Radyüs')}
                                        </button>
                                    </div>
                                    {selectedSeg.shoulderTransition === 'radius' ? (
                                        <div className="flex items-center justify-between text-[10px] pt-1">
                                            <label className="text-[var(--alu-dim)]">{t12(language, 'Radius r (mm):', 'Radyüs r (mm):')}</label>
                                            <div className="flex items-center gap-1">
                                                {[1.0, 1.5, 2.0, 2.5].map((rPreset) => (
                                                    <button
                                                        key={rPreset}
                                                        type="button"
                                                        onClick={() => setShoulderTransition(selectedSeg.segmentIndex, 'radius', rPreset)}
                                                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                                            (selectedSeg.shoulderFilletRadius || 1.5) === rPreset
                                                                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                                                                : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)]'
                                                        }`}
                                                    >
                                                        R{rPreset}
                                                    </button>
                                                ))}
                                                <input
                                                    type="number"
                                                    step={0.5}
                                                    min={0.5}
                                                    max={10}
                                                    value={selectedSeg.shoulderFilletRadius || 1.5}
                                                    onChange={(e) => setShoulderTransition(selectedSeg.segmentIndex, 'radius', Number(e.target.value))}
                                                    className="w-12 px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white text-center font-bold"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between text-[10px] pt-1">
                                            <label className="text-[var(--alu-dim)]">DIN 509 Form:</label>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setShoulderTransition(selectedSeg.segmentIndex, 'undercut', undefined, 'E')}
                                                    className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                                        (selectedSeg.shoulderUndercutForm ?? 'E') === 'E'
                                                            ? 'bg-sky-500/25 border-sky-400 text-sky-300'
                                                            : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)]'
                                                    }`}
                                                >
                                                    {t12(language, 'Form E (Bearing Seat)', 'Form E (Mil Yatağı)')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShoulderTransition(selectedSeg.segmentIndex, 'undercut', undefined, 'F')}
                                                    className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                                        selectedSeg.shoulderUndercutForm === 'F'
                                                            ? 'bg-sky-500/25 border-sky-400 text-sky-300'
                                                            : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)]'
                                                    }`}
                                                >
                                                    {t12(language, 'Form F (Shoulder Facing)', 'Form F (Alın Dayaması)')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* On-demand Action Buttons */}
                                <div className="pt-1">
                                    <label className="text-[9px] text-[var(--alu-dim)] block mb-1 font-mono uppercase font-semibold">
                                        {t12(language, '+ Add Feature (Click to add to drawing):', '+ Unsur Ekle (Tıklayınca Çizime Eklenir):')}
                                    </label>
                                    <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
                                        <button
                                            onClick={() => addFeatureToSegment(selectedSeg.id, 'keyway')}
                                            className="px-1.5 py-1 rounded bg-[var(--bg-3)] hover:bg-[var(--warn)]/20 hover:text-[var(--warn)] border border-[var(--line)] text-center"
                                            title="DIN 6885 Form A"
                                        >
                                            {t12(language, '+ Keyway', '+ Kama')}
                                        </button>
                                        <button
                                            onClick={() => addFeatureToSegment(selectedSeg.id, 'gear')}
                                            className="px-1.5 py-1 rounded bg-[var(--bg-3)] hover:bg-[var(--cyan)]/20 hover:text-[var(--cyan)] border border-[var(--line)] text-center font-bold"
                                            title="DIN 3960 / ISO 54"
                                        >
                                            {t12(language, '+ Gear', '+ Dişli')}
                                        </button>
                                        <button
                                            onClick={() => addFeatureToSegment(selectedSeg.id, 'circlip')}
                                            className="px-1.5 py-1 rounded bg-[var(--bg-3)] hover:bg-[var(--bad)]/20 hover:text-[var(--bad)] border border-[var(--line)] text-center"
                                            title="DIN 471"
                                        >
                                            {t12(language, '+ Circlip', '+ Segman')}
                                        </button>
                                        <button
                                            onClick={() => {
                                                const curTrans = selectedSeg.shoulderTransition ?? 'undercut';
                                                setShoulderTransition(selectedSeg.segmentIndex, curTrans === 'undercut' ? 'radius' : 'undercut');
                                            }}
                                            className="px-1.5 py-1 rounded bg-[var(--bg-3)] hover:bg-sky-500/20 hover:text-sky-400 border border-[var(--line)] text-center"
                                            title="DIN 509 ⟷ DIN 743"
                                        >
                                            {selectedSeg.shoulderTransition === 'radius' ? t12(language, '⌒ Radius', '⌒ Radyüs') : t12(language, '⚙️ Undercut', '⚙️ Taşlama')}
                                        </button>
                                        {selectedSeg.segmentIndex === 0 || selectedSeg.segmentIndex === segments.length - 1 ? (
                                            <button
                                                onClick={() => addFeatureToSegment(selectedSeg.id, 'center_drill')}
                                                className="px-1.5 py-1 rounded bg-[var(--bg-3)] hover:bg-teal-500/20 hover:text-teal-400 border border-[var(--line)] text-center"
                                                title="DIN 332"
                                            >
                                                {t12(language, '+ Center Drill', '+ Punta')}
                                            </button>
                                        ) : (
                                            <button
                                                disabled
                                                className="px-1.5 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)]/50 text-center opacity-30 cursor-not-allowed line-through"
                                                title={t12(language, 'Center drill per standard can only be added to first (S1) or last shaft ends.', 'Punta deliği standart gereği yalnızca milin en başındaki (S1) ve en sonundaki alın yüzeylerine açılabilir.')}
                                            >
                                                {t12(language, '+ Center Drill', '+ Punta')}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => addFeatureToSegment(selectedSeg.id, 'thread')}
                                            className="px-1.5 py-1 rounded bg-[var(--bg-3)] hover:bg-[var(--cyan)]/20 hover:text-[var(--cyan)] border border-[var(--line)] text-center"
                                            title="ISO 965"
                                        >
                                            {t12(language, '+ Thread', '+ Diş')}
                                        </button>
                                        <button
                                            onClick={() => addFeatureToSegment(selectedSeg.id, 'cross_hole')}
                                            className="px-1.5 py-1 rounded bg-[var(--bg-3)] hover:bg-orange-500/20 hover:text-orange-400 border border-[var(--line)] text-center"
                                            title="Cross Hole"
                                        >
                                            {t12(language, '+ Hole', '+ Delik')}
                                        </button>
                                        <button
                                            onClick={() => addFeatureToSegment(selectedSeg.id, 'imbus')}
                                            className="px-1.5 py-1 rounded bg-[var(--bg-3)] hover:bg-blue-500/20 hover:text-blue-400 border border-[var(--line)] text-center"
                                            title="DIN 912 / ISO 4762"
                                        >
                                            {t12(language, '+ Socket Head', '+ İmbus')}
                                        </button>
                                        <button
                                            onClick={() => addFeatureToSegment(selectedSeg.id, 'pin')}
                                            className="px-1.5 py-1 rounded bg-[var(--bg-3)] hover:bg-emerald-500/20 hover:text-emerald-400 border border-[var(--line)] text-center"
                                            title="DIN 7"
                                        >
                                            {t12(language, '+ Pin', '+ Pim')}
                                        </button>
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDetailStandard('keyway');
                                                setDetailModalOpen(true);
                                            }}
                                            className="w-full py-1.5 rounded bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 text-[var(--cyan)] border border-[var(--cyan)]/40 text-[10px] font-mono font-bold flex items-center justify-center gap-1"
                                        >
                                            {t12(language, '🔍 1:1 Standards Inspection (DIN 509/471/6885)', '🔍 1:1 Standart Muayenesi (DIN 509/471/6885)')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* 2. Feature Details on Active Segment */}
                        {selectedSeg && selectedSeg.features.length > 0 && (
                            <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] space-y-2">
                                <span className="text-xs font-bold uppercase text-[var(--alu)] font-mono flex items-center justify-between">
                                    <span>{t12(language, 'Features on this Segment', 'Bu Kademede Unsurlar')} ({selectedSeg.features.length})</span>
                                </span>

                                {selectedSeg.features.map(feat => (
                                    <div 
                                        key={feat.id} 
                                        className={`p-2 rounded bg-[var(--bg-0)] border text-xs font-mono space-y-1.5 ${
                                            selectedFeatureId === feat.id ? 'border-[var(--cyan)]' : 'border-[var(--line)]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-[var(--cyan)] uppercase text-[11px]">
                                                {feat.type} · {feat.id}
                                            </span>
                                            <button
                                                onClick={() => removeFeature(selectedSeg.id, feat.id)}
                                                className="text-[var(--bad)] hover:underline text-[10px]"
                                            >
                                                {t12(language, 'Remove', 'Kaldır')}
                                            </button>
                                        </div>

                                        {/* Keyway controls */}
                                        {feat.type === 'keyway' && (
                                            <div className="space-y-1.5">
                                                <div>
                                                    <label className="text-[var(--alu-dim)] block text-[10px]">{t12(language, 'Standard & Form', 'Standart & Form')}</label>
                                                    <select
                                                        value={feat.standard?.includes('Form B') ? 'Form B' : 'Form A'}
                                                        onChange={(e) => updateFeature(selectedSeg.id, feat.id, { standard: `DIN 6885-1 ${e.target.value}` })}
                                                        className="w-full px-1.5 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white text-[10px]"
                                                    >
                                                        <option value="Form A">{t12(language, 'DIN 6885-1 Form A (Round End / Radiused)', 'DIN 6885-1 Form A (Yuvarlak Uçlu / Radiuslu)')}</option>
                                                        <option value="Form B">{t12(language, 'DIN 6885-1 Form B (Flat End)', 'DIN 6885-1 Form B (Düz Uçlu)')}</option>
                                                    </select>
                                                </div>
                                                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Width b (mm)', 'Genişlik b (mm)')}</label>
                                                        <input
                                                            type="number"
                                                            value={feat.width}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { width: Number(e.target.value) })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Depth t1 (mm)', 'Derinlik t1 (mm)')}</label>
                                                        <input
                                                            type="number"
                                                            value={feat.depth}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { depth: Number(e.target.value) })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Length Lk (mm)', 'Boy Lk (mm)')}</label>
                                                        <input
                                                            type="number"
                                                            value={feat.length}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { length: Number(e.target.value) })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Offset (mm)', 'Ofset (mm)')}</label>
                                                        <input
                                                            type="number"
                                                            value={feat.offsetFromStart}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { offsetFromStart: Number(e.target.value) })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => { setDetailStandard('keyway'); setDetailModalOpen(true); }}
                                                    className="w-full py-1 rounded bg-[var(--warn)]/10 hover:bg-[var(--warn)]/20 text-[var(--warn)] border border-[var(--warn)]/30 text-[10px] flex items-center justify-center gap-1 font-bold"
                                                >
                                                    {t12(language, '🔍 1:1 DIN 6885 Keyway Analysis', '🔍 1:1 DIN 6885 Kama Analizi')}
                                                </button>
                                            </div>
                                        )}

                                        {/* Gear controls (DIN 3960 / ISO 54) */}
                                        {feat.type === 'gear' && (
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Module m (mm)', 'Modül m (mm)')}</label>
                                                        <select
                                                            value={feat.module}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { module: Number(e.target.value) })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        >
                                                            {[1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0].map(m => (
                                                                <option key={m} value={m}>m = {m}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Teeth Number z', 'Diş Sayısı z')}</label>
                                                        <input
                                                            type="number"
                                                            min={10}
                                                            max={150}
                                                            value={feat.numTeeth}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { numTeeth: Math.max(8, Number(e.target.value)) })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Face Width b (mm)', 'Diş Genişliği b (mm)')}</label>
                                                        <input
                                                            type="number"
                                                            min={5}
                                                            max={300}
                                                            value={feat.faceWidth}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { faceWidth: Math.max(5, Number(e.target.value)) })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Helix Angle β (°)', 'Helis Açısı β (°)')}</label>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={45}
                                                            value={feat.helixAngleDeg || 0}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { helixAngleDeg: Number(e.target.value) })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Offset (mm)', 'Ofset (mm)')}</label>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={selectedSeg.length}
                                                            value={feat.offsetFromStart}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { offsetFromStart: Number(e.target.value) })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Mounting Type', 'Montaj Tipi')}</label>
                                                        <select
                                                            value={feat.mounting}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { mounting: e.target.value as any })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        >
                                                            <option value="integral">{t12(language, 'Integral Pinion', 'Yekpare Pinyon')}</option>
                                                            <option value="mounted">{t12(language, 'Mounted Gear', 'Takma Çark')}</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Calculated Gear Telemetry */}
                                                <div className="p-1.5 rounded bg-[var(--bg-2)] border border-[var(--line)] space-y-1 text-[9.5px]">
                                                    <div className="flex justify-between">
                                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Pitch Dia d₀:', 'Taksimat Çapı d₀:')}</span>
                                                        <span className="text-[var(--warn)] font-bold">Ø{feat.pitchDiameter} mm</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Tip Dia da:', 'Dişüstü Çapı da:')}</span>
                                                        <span className="text-[var(--cyan)] font-bold">Ø{feat.tipDiameter} mm</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Root Dia df:', 'Dişdibi Çapı df:')}</span>
                                                        <span className="text-white font-bold">Ø{feat.rootDiameter} mm</span>
                                                    </div>
                                                    <div className="flex justify-between pt-0.5 border-t border-[var(--line)]">
                                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Tangential / Radial Load:', 'Tanjansiyel / Radyal Yük:')}</span>
                                                        <span className="text-emerald-400 font-bold">{feat.tangentialForceN ?? 0} N / {feat.radialForceN ?? 0} N</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Circlip controls */}
                                        {feat.type === 'circlip' && (
                                            <div className="space-y-1.5">
                                                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Groove Dia d2', 'Kanal Çapı d2')}</label>
                                                        <input
                                                            type="number"
                                                            value={feat.grooveDia}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { grooveDia: Number(e.target.value) })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Groove Width m', 'Kanal Genişliği m')}</label>
                                                        <input
                                                            type="number"
                                                            step={0.1}
                                                            value={feat.grooveWidth}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { grooveWidth: Number(e.target.value) })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Offset (mm)', 'Ofset (mm)')}</label>
                                                        <input
                                                            type="number"
                                                            value={feat.offsetFromStart}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { offsetFromStart: Number(e.target.value) })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => { setDetailStandard('circlip'); setDetailModalOpen(true); }}
                                                    className="w-full py-1 rounded bg-[var(--bad)]/10 hover:bg-[var(--bad)]/20 text-[var(--bad)] border border-[var(--bad)]/30 text-[10px] flex items-center justify-center gap-1 font-bold"
                                                >
                                                    {t12(language, '🔍 1:1 DIN 471 Circlip Analysis', '🔍 1:1 DIN 471 Segman Analizi')}
                                                </button>
                                            </div>
                                        )}

                                        {/* Undercut controls */}
                                        {feat.type === 'undercut' && (
                                            <div className="space-y-1.5">
                                                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Form', 'Form')}</label>
                                                        <select
                                                            value={feat.form}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { form: e.target.value as any })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        >
                                                            <option value="E">{t12(language, 'Form E (Cylindrical)', 'Form E (Silindirik)')}</option>
                                                            <option value="F">{t12(language, 'Form F (Cylindrical + Facing)', 'Form F (Silindirik+Alın)')}</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Radius r (mm)', 'Radyüs r (mm)')}</label>
                                                        <input
                                                            type="number"
                                                            step={0.1}
                                                            value={feat.radius}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { radius: Number(e.target.value) })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Depth t1 (mm)', 'Derinlik t1 (mm)')}</label>
                                                        <input
                                                            type="number"
                                                            step={0.05}
                                                            value={feat.cylinderDepth}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { cylinderDepth: Number(e.target.value) })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Width f (mm)', 'Genişlik f (mm)')}</label>
                                                        <input
                                                            type="number"
                                                            step={0.1}
                                                            value={feat.grooveWidth ?? 2.5}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { grooveWidth: Number(e.target.value) })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => { setDetailStandard('undercut'); setDetailModalOpen(true); }}
                                                    className="w-full py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] flex items-center justify-center gap-1 font-bold"
                                                >
                                                    {t12(language, '🔍 1:1 DIN 509 Relief Groove Detail', '🔍 1:1 DIN 509 Taşlama Detayı')}
                                                </button>
                                            </div>
                                        )}

                                        {/* Center Drill controls */}
                                        {feat.type === 'center_drill' && (
                                            <div className="space-y-1.5">
                                                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Form', 'Form')}</label>
                                                        <select
                                                            value={feat.form}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { form: e.target.value as any })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        >
                                                            <option value="B">{t12(language, 'Form B (120° Protected)', 'Form B (120° Korumalı)')}</option>
                                                            <option value="A">{t12(language, 'Form A (60° Straight)', 'Form A (60° Düz)')}</option>
                                                            <option value="R">{t12(language, 'Form R (Radiused)', 'Form R (Radyuslu)')}</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Shaft End Face', 'Alın Yüzü')}</label>
                                                        <select
                                                            value={feat.face}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { face: e.target.value as any })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        >
                                                            <option value="left_end">{t12(language, 'Left End', 'Sol Alın')}</option>
                                                            <option value="right_end">{t12(language, 'Right End', 'Sağ Alın')}</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Pilot d1 (mm)', 'Kılavuz d1 (mm)')}</label>
                                                        <input
                                                            type="number"
                                                            step={0.5}
                                                            value={feat.pilotDia}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { pilotDia: Number(e.target.value) })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Cone d2 (mm)', 'Koni d2 (mm)')}</label>
                                                        <input
                                                            type="number"
                                                            step={0.5}
                                                            value={feat.coneDia}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { coneDia: Number(e.target.value) })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => { setDetailStandard('center_drill'); setDetailModalOpen(true); }}
                                                    className="w-full py-1 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 text-[10px] flex items-center justify-center gap-1 font-bold"
                                                >
                                                    {t12(language, '🔍 1:1 DIN 332 Center Drill Detail', '🔍 1:1 DIN 332 Punta Detayı')}
                                                </button>
                                            </div>
                                        )}

                                        {/* Imbus controls */}
                                        {feat.type === 'imbus' && (
                                            <div className="space-y-1.5">
                                                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Bolt Size', 'Cıvata Ölçüsü')}</label>
                                                        <select
                                                            value={feat.thread}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { thread: e.target.value })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        >
                                                            <option value="M6">M6</option>
                                                            <option value="M8">M8</option>
                                                            <option value="M10">M10</option>
                                                            <option value="M12">M12</option>
                                                            <option value="M16">M16</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Shaft End Face', 'Alın Yüzü')}</label>
                                                        <select
                                                            value={feat.face}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { face: e.target.value as any })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        >
                                                            <option value="left_end">{t12(language, 'Left End', 'Sol Alın')}</option>
                                                            <option value="right_end">{t12(language, 'Right End', 'Sağ Alın')}</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Counterbore D (mm)', 'Havşa D (mm)')}</label>
                                                        <input
                                                            type="number"
                                                            value={feat.counterboreDia}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { counterboreDia: Number(e.target.value) })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[var(--alu-dim)] block">{t12(language, 'Depth T (mm)', 'Derinlik T (mm)')}</label>
                                                        <input
                                                            type="number"
                                                            value={feat.counterboreDepth}
                                                            onChange={(e) => updateFeature(selectedSeg.id, feat.id, { counterboreDepth: Number(e.target.value) })}
                                                            className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => { setDetailStandard('imbus'); setDetailModalOpen(true); }}
                                                    className="w-full py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] flex items-center justify-center gap-1 font-bold"
                                                >
                                                    {t12(language, '🔍 1:1 DIN 912 Socket Head Detail', '🔍 1:1 DIN 912 İmbus Detayı')}
                                                </button>
                                            </div>
                                        )}

                                        {/* Thread controls */}
                                        {feat.type === 'thread' && (
                                            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                                                <div>
                                                    <label className="text-[var(--alu-dim)] block">{t12(language, 'Designation (M..)', 'Tanım (M..)')}</label>
                                                    <input
                                                        type="text"
                                                        value={feat.designation}
                                                        onChange={(e) => updateFeature(selectedSeg.id, feat.id, { designation: e.target.value })}
                                                        className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[var(--alu-dim)] block">{t12(language, 'Thread Length', 'Vida Boyu')}</label>
                                                    <input
                                                        type="number"
                                                        value={feat.length}
                                                        onChange={(e) => updateFeature(selectedSeg.id, feat.id, { length: Number(e.target.value) })}
                                                        className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Cross Hole controls */}
                                        {feat.type === 'cross_hole' && (
                                            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                                                <div>
                                                    <label className="text-[var(--alu-dim)] block">{t12(language, 'Diameter dh (mm)', 'Çap dh (mm)')}</label>
                                                    <input
                                                        type="number"
                                                        value={feat.diameter}
                                                        onChange={(e) => updateFeature(selectedSeg.id, feat.id, { diameter: Number(e.target.value) })}
                                                        className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[var(--alu-dim)] block">{t12(language, 'Offset (mm)', 'Ofset (mm)')}</label>
                                                    <input
                                                        type="number"
                                                        value={feat.offsetFromStart}
                                                        onChange={(e) => updateFeature(selectedSeg.id, feat.id, { offsetFromStart: Number(e.target.value) })}
                                                        className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Pin controls */}
                                        {feat.type === 'pin' && (
                                            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                                                <div>
                                                    <label className="text-[var(--alu-dim)] block">{t12(language, 'Diameter dp (mm)', 'Çap dp (mm)')}</label>
                                                    <input
                                                        type="number"
                                                        value={feat.diameter}
                                                        onChange={(e) => updateFeature(selectedSeg.id, feat.id, { diameter: Number(e.target.value) })}
                                                        className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[var(--alu-dim)] block">{t12(language, 'Offset (mm)', 'Ofset (mm)')}</label>
                                                    <input
                                                        type="number"
                                                        value={feat.offsetFromStart}
                                                        onChange={(e) => updateFeature(selectedSeg.id, feat.id, { offsetFromStart: Number(e.target.value) })}
                                                        className="w-full px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 3. Supports, Torques & Radial Loads */}
                        <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] space-y-2.5 text-xs font-mono">
                            <span className="text-xs font-bold uppercase text-[var(--ok)] flex items-center gap-1">
                                <Activity size={13} /> {t12(language, 'Rolling Bearings & Point Loads', 'Rulmanlı Yataklar & Noktasal Yükler')}
                            </span>

                            {/* Rulmanlı Yatak A Kartı */}
                            <div className="p-2 rounded bg-[var(--bg-0)] border border-[var(--line)] space-y-1.5 text-[10px]">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-[var(--cyan)]">
                                        {t12(language, 'BEARING A:', 'YATAK A:')} {supportABearing?.fullDesignation || 'SKF 6205'}
                                    </span>
                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                        (supportABearing?.lifeHoursL10h || 0) >= 20000 
                                            ? 'bg-[var(--ok)]/20 text-[var(--ok)]' 
                                            : 'bg-[var(--warn)]/20 text-[var(--warn)]'
                                    }`}>
                                        L₁₀h ≈ {((supportABearing?.lifeHoursL10h || 0) / 1000).toFixed(1)}k {t12(language, 'hrs', 'sa')}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-[9.5px] text-[var(--alu-dim)]">
                                    <div>{t12(language, 'Size:', 'Boyut:')} Ø{supportABearing?.boreDia}×Ø{supportABearing?.outerDia}×{supportABearing?.width} mm</div>
                                    <div>{t12(language, 'Dynamic C:', 'Dinamik C:')} {supportABearing?.dynamicLoadRatingKN} kN</div>
                                    <div>{t12(language, 'Reaction Ra:', 'Tepki Ra:')} {Math.round(supportABearing?.reactionForceN || result?.supportReactions.RaN || 0)} N</div>
                                    <div className="flex items-center gap-1">
                                        <span>{t12(language, 'Pos:', 'Konum:')}</span>
                                        <input
                                            type="number"
                                            value={supportAPos}
                                            onChange={(e) => setSupports(Number(e.target.value), supportBPos)}
                                            className="w-12 px-1 py-0.2 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white text-center"
                                        />
                                        <span>mm</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setBearingModalSupport('A'); setBearingModalOpen(true); }}
                                    className="w-full py-1 rounded bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 text-[var(--cyan)] border border-[var(--cyan)]/40 text-[10px] font-bold flex items-center justify-center gap-1"
                                >
                                    {t12(language, '🔘 Select from SKF Catalog & Match Shaft Dia', '🔘 SKF Kataloğundan Seç & Çapı Eşitle')}
                                </button>
                            </div>

                            {/* Rulmanlı Yatak B Kartı */}
                            <div className="p-2 rounded bg-[var(--bg-0)] border border-[var(--line)] space-y-1.5 text-[10px]">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-[var(--cyan)]">
                                        {t12(language, 'BEARING B:', 'YATAK B:')} {supportBBearing?.fullDesignation || 'SKF 6207'}
                                    </span>
                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                        (supportBBearing?.lifeHoursL10h || 0) >= 20000 
                                            ? 'bg-[var(--ok)]/20 text-[var(--ok)]' 
                                            : 'bg-[var(--warn)]/20 text-[var(--warn)]'
                                    }`}>
                                        L₁₀h ≈ {((supportBBearing?.lifeHoursL10h || 0) / 1000).toFixed(1)}k {t12(language, 'hrs', 'sa')}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-[9.5px] text-[var(--alu-dim)]">
                                    <div>{t12(language, 'Size:', 'Boyut:')} Ø{supportBBearing?.boreDia}×Ø{supportBBearing?.outerDia}×{supportBBearing?.width} mm</div>
                                    <div>{t12(language, 'Dynamic C:', 'Dinamik C:')} {supportBBearing?.dynamicLoadRatingKN} kN</div>
                                    <div>{t12(language, 'Reaction Rb:', 'Tepki Rb:')} {Math.round(supportBBearing?.reactionForceN || result?.supportReactions.RbN || 0)} N</div>
                                    <div className="flex items-center gap-1">
                                        <span>{t12(language, 'Pos:', 'Konum:')}</span>
                                        <input
                                            type="number"
                                            value={supportBPos}
                                            onChange={(e) => setSupports(supportAPos, Number(e.target.value))}
                                            className="w-12 px-1 py-0.2 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white text-center"
                                        />
                                        <span>mm</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setBearingModalSupport('B'); setBearingModalOpen(true); }}
                                    className="w-full py-1 rounded bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 text-[var(--cyan)] border border-[var(--cyan)]/40 text-[10px] font-bold flex items-center justify-center gap-1"
                                >
                                    {t12(language, '🔘 Select from SKF Catalog & Match Shaft Dia', '🔘 SKF Kataloğundan Seç & Çapı Eşitle')}
                                </button>
                            </div>

                            {/* Tork ve Hedef SF */}
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div>
                                    <label className="text-[var(--alu-dim)] block">{t12(language, 'Transmitted Torque T (N·m)', 'İletilen Tork T (N·m)')}</label>
                                    <input
                                        type="number"
                                        value={torque.torqueNm}
                                        onChange={(e) => setTorque({ ...torque, torqueNm: Number(e.target.value) })}
                                        className="w-full px-1.5 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-white font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[var(--alu-dim)] block">{t12(language, 'Target SF', 'Hedef SF')}</label>
                                    <input
                                        type="number"
                                        step={0.1}
                                        value={targetSafetyFactor}
                                        onChange={(e) => setTargetSafetyFactor(Number(e.target.value))}
                                        className="w-full px-1.5 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-white font-bold"
                                    />
                                </div>
                            </div>

                            {/* Applied Loads list */}
                            <div className="pt-1 space-y-1">
                                <div className="flex items-center justify-between text-[10px] text-[var(--alu-dim)]">
                                    <span>{t12(language, 'Applied Loads', 'Uygulanan Yükler')} ({radialLoads.length})</span>
                                    <button
                                        onClick={addRadialLoad}
                                        className="text-[var(--warn)] hover:underline flex items-center gap-0.5"
                                    >
                                        <Plus size={10} /> {t12(language, 'Add Load', 'Yük Ekle')}
                                    </button>
                                </div>
                                {radialLoads.map(l => (
                                    <div key={l.id} className="flex items-center gap-1.5 bg-[var(--bg-0)] p-1.5 rounded border border-[var(--line)] text-[10px]">
                                        <input
                                            type="number"
                                            value={l.forceN}
                                            onChange={(e) => updateRadialLoad(l.id, { forceN: Number(e.target.value) })}
                                            className="w-16 px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white text-center"
                                            title={t12(language, 'Force (N)', 'Kuvvet (N)')}
                                        />
                                        <span className="text-[var(--alu-dim)]">N @</span>
                                        <input
                                            type="number"
                                            value={l.position}
                                            onChange={(e) => updateRadialLoad(l.id, { position: Number(e.target.value) })}
                                            className="w-14 px-1 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white text-center"
                                            title={t12(language, 'Position x (mm)', 'Konum x (mm)')}
                                        />
                                        <span className="text-[var(--alu-dim)]">mm</span>
                                        <button
                                            onClick={() => removeRadialLoad(l.id)}
                                            className="text-[var(--bad)] hover:text-red-300 ml-auto p-0.5"
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 1:1 DETAILED STANDARDS INSPECTION MODAL OVERLAY */}
            {detailModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-150">
                    <div className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-[var(--bg-0)] border border-[var(--cyan)] rounded-xl shadow-2xl overflow-hidden font-mono">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--bg-1)] border-b border-[var(--line)]">
                            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[var(--cyan)] animate-pulse" />
                                {t12(language, '1:1 Engineering & Manufacturing Standards Inspection (ISO / DIN / VDI)', '1:1 Mühendislik ve İmalat Standart Muayenesi (ISO / DIN / VDI)')}
                            </span>
                            <button
                                type="button"
                                onClick={() => setDetailModalOpen(false)}
                                className="p-1.5 rounded bg-[var(--bg-2)] hover:bg-[var(--bad)]/20 text-[var(--alu-dim)] hover:text-white border border-[var(--line)] transition-colors"
                                title={t12(language, 'Close (ESC)', 'Kapat (ESC)')}
                            >
                                <X size={15} />
                            </button>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
                            {renderStandardsView()}
                        </div>
                    </div>
                </div>
            )}

            {/* SKF RULMAN SEÇİM KATALOĞU VE MİL ÇAPI EŞİTLEME MODALI */}
            {bearingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-150 font-mono">
                    <div className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-[var(--bg-0)] border border-[var(--cyan)] rounded-xl shadow-2xl overflow-hidden text-xs">
                        {/* Modal Header */}
                        <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[var(--bg-1)] border-b border-[var(--line)] gap-2">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-[var(--cyan)] animate-pulse" />
                                <div>
                                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                                        {t12(language, `SKF Bearing Catalog · Bearing ${bearingModalSupport} Selection`, `SKF Rulman Kataloğu · Yatak ${bearingModalSupport} Seçimi`)}
                                    </h2>
                                    <p className="text-[10px] text-[var(--alu-dim)]">
                                        {t12(language, 'Reaction Load:', 'Tepki Yükü:')} {Math.round(bearingModalSupport === 'A' ? (result?.supportReactions.RaN ?? 1000) : (result?.supportReactions.RbN ?? 1000))} N | 
                                        {' '}{t12(language, 'Target Segment:', 'Hedef Kademe:')} S{((bearingModalSupport === 'A' ? supportABearing?.segmentIndex : supportBBearing?.segmentIndex) ?? 0) + 1}
                                    </p>
                                </div>
                            </div>

                            {/* Target Support Switcher & Close */}
                            <div className="flex items-center gap-2">
                                <div className="flex rounded bg-[var(--bg-2)] p-0.5 border border-[var(--line)] text-[10px]">
                                    <button
                                        type="button"
                                        onClick={() => setBearingModalSupport('A')}
                                        className={`px-2.5 py-1 rounded font-bold transition-colors ${
                                            bearingModalSupport === 'A'
                                                ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/40'
                                                : 'text-[var(--alu-dim)] hover:text-white'
                                        }`}
                                    >
                                        {t12(language, 'Bearing A', 'Yatak A')} (xA={supportAPos}mm)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBearingModalSupport('B')}
                                        className={`px-2.5 py-1 rounded font-bold transition-colors ${
                                            bearingModalSupport === 'B'
                                                ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/40'
                                                : 'text-[var(--alu-dim)] hover:text-white'
                                        }`}
                                    >
                                        {t12(language, 'Bearing B', 'Yatak B')} (xB={supportBPos}mm)
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setBearingModalOpen(false)}
                                    className="p-1.5 rounded bg-[var(--bg-2)] hover:bg-[var(--bad)]/20 text-[var(--alu-dim)] hover:text-white border border-[var(--line)]"
                                    title={t12(language, 'Close (ESC)', 'Kapat (ESC)')}
                                >
                                    <X size={15} />
                                </button>
                            </div>
                        </div>

                        {/* Controls Toolbar: Search, Filter, Sync Checkbox, RPM */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[var(--bg-1)] border-b border-[var(--line)]">
                            {/* Search and Series Filter */}
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder={t12(language, 'Bearing code or bore d (e.g. 6205, 35)...', 'Rulman kodu veya iç çap d (örn: 6205, 35)...')}
                                        value={bearingSearch}
                                        onChange={(e) => setBearingSearch(e.target.value)}
                                        className="w-64 px-2.5 py-1.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-white text-xs placeholder:text-[var(--alu-dim)] focus:outline-none focus:border-[var(--cyan)]"
                                    />
                                    {bearingSearch && (
                                        <button
                                            onClick={() => setBearingSearch('')}
                                            className="absolute right-2 top-1.5 text-[var(--alu-dim)] hover:text-white"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>

                                {/* Series Select Tabs */}
                                <div className="flex flex-wrap items-center gap-1 text-[10px]">
                                    {[
                                        { id: 'all', label: t12(language, 'All Series', 'Tüm Seriler') },
                                        { id: '60', label: '60xx' },
                                        { id: '62', label: '62xx (Std)' },
                                        { id: '63', label: '63xx' },
                                        { id: '64', label: '64xx' },
                                        { id: '160', label: '160xx' },
                                        { id: 'NU', label: t12(language, 'NU Roller', 'NU Makaralı') },
                                        { id: '302', label: t12(language, '302xx Tapered', '302xx Konik') }
                                    ].map(series => (
                                        <button
                                            key={series.id}
                                            type="button"
                                            onClick={() => setBearingSeriesFilter(series.id)}
                                            className={`px-2 py-1 rounded border transition-colors ${
                                                bearingSeriesFilter === series.id
                                                    ? 'bg-[var(--cyan)]/25 text-[var(--cyan)] border-[var(--cyan)]/50 font-bold'
                                                    : 'bg-[var(--bg-2)] text-[var(--alu-dim)] border-[var(--line)] hover:text-white'
                                            }`}
                                        >
                                            {series.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* RPM & Auto-sync options */}
                            <div className="flex items-center gap-4 text-[10px]">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Speed (rpm):', 'Devir (rpm):')}</span>
                                    <input
                                        type="number"
                                        min={10}
                                        max={30000}
                                        step={50}
                                        value={operatingRpm || 1450}
                                        onChange={(e) => setOperatingRpm(Number(e.target.value))}
                                        className="w-16 px-1.5 py-0.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-white text-center font-bold"
                                        title={t12(language, 'Shaft operating speed (for ISO 281 L10h rating life)', 'Mil Çalışma Devri (ISO 281 L10h ömür hesabı için)')}
                                    />
                                    <span className="text-[var(--alu-dim)]">{t12(language, 'rpm', 'd/dk')}</span>
                                </div>

                                <label className="flex items-center gap-1.5 cursor-pointer text-white">
                                    <input
                                        type="checkbox"
                                        checked={autoSyncDiameter}
                                        onChange={(e) => setAutoSyncDiameter(e.target.checked)}
                                        className="accent-[var(--cyan)] rounded"
                                    />
                                    <span className="text-[var(--cyan)] font-bold">
                                        {t12(language, 'Match shaft segment diameter to bearing bore (d)', 'Mil kademe çapını rulmana eşitle (d)')}
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Bearing Table */}
                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                            {(() => {
                                const currentReactionN = Math.round(bearingModalSupport === 'A' 
                                    ? (result?.supportReactions.RaN ?? 1000) 
                                    : (result?.supportReactions.RbN ?? 1000));
                                const currentBearing = bearingModalSupport === 'A' ? supportABearing : supportBBearing;

                                const filtered = BEARING_CATALOG.filter(b => {
                                    // Series filter
                                    if (bearingSeriesFilter !== 'all') {
                                        if (bearingSeriesFilter === 'NU' && !b.code.startsWith('NU')) return false;
                                        if (bearingSeriesFilter !== 'NU' && !b.code.startsWith(bearingSeriesFilter)) return false;
                                    }
                                    // Search text
                                    if (bearingSearch.trim()) {
                                        const q = bearingSearch.trim().toLowerCase();
                                        const matchCode = b.code.toLowerCase().includes(q);
                                        const matchDia = b.d.toString() === q || `d=${b.d}` === q;
                                        if (!matchCode && !matchDia) return false;
                                    }
                                    return true;
                                }).slice(0, 80); // Capped for UI responsiveness

                                if (filtered.length === 0) {
                                    return (
                                        <div className="p-12 text-center text-[var(--alu-dim)]">
                                            {t12(language, 'No matching bearing found. Please clear the filter or search for another bore.', 'Arama kriterine uygun rulman bulunamadı. Lütfen filtreyi temizleyin veya başka bir çap girin.')}
                                        </div>
                                    );
                                }

                                return (
                                    <table className="w-full text-left border-collapse text-[10.5px]">
                                        <thead className="bg-[var(--bg-2)] sticky top-0 border-b border-[var(--line)] text-[var(--alu-dim)] uppercase text-[9px] tracking-wider z-10">
                                            <tr>
                                                <th className="p-2.5">{t12(language, 'Bearing Code', 'Rulman Kodu')}</th>
                                                <th className="p-2.5">{t12(language, 'Type', 'Tip')}</th>
                                                <th className="p-2.5 text-center">{t12(language, 'Bore d (mm)', 'İç Çap d (mm)')}</th>
                                                <th className="p-2.5 text-center">{t12(language, 'Outer Dia D (mm)', 'Dış Çap D (mm)')}</th>
                                                <th className="p-2.5 text-center">{t12(language, 'Width B (mm)', 'Genişlik B (mm)')}</th>
                                                <th className="p-2.5 text-right">{t12(language, 'Dynamic C (kN)', 'Dinamik C (kN)')}</th>
                                                <th className="p-2.5 text-right">{t12(language, 'Static C₀ (kN)', 'Statik C₀ (kN)')}</th>
                                                <th className="p-2.5 text-center">{t12(language, 'Limiting Speed (rpm)', 'Sınır Hız (rpm)')}</th>
                                                <th className="p-2.5 text-right">{t12(language, 'ISO 281 L₁₀h Life', 'ISO 281 L₁₀h Ömür')}</th>
                                                <th className="p-2.5 text-center">{t12(language, 'Action', 'İşlem')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--line)]">
                                            {filtered.map(b => {
                                                const isRoller = b.type.includes('roller');
                                                const l10h = calculateBearingL10h(b.C, currentReactionN, operatingRpm || 1450, isRoller);
                                                const isCurrent = currentBearing?.bearingCode === b.code;
                                                const isAdequate = l10h >= 20000;

                                                return (
                                                    <tr 
                                                        key={b.code} 
                                                        className={`hover:bg-[var(--bg-2)] transition-colors ${
                                                            isCurrent ? 'bg-[var(--cyan)]/10 font-bold' : ''
                                                        }`}
                                                    >
                                                        <td className="p-2.5 text-white font-bold flex items-center gap-1.5">
                                                            {isCurrent && <span className="text-[var(--cyan)]">●</span>}
                                                            SKF {b.code}
                                                        </td>
                                                        <td className="p-2.5 text-[var(--alu-dim)]">
                                                            {b.type === 'deep-groove-ball' ? t12(language, 'Deep Groove Ball', 'Sabit Bilyalı') : 
                                                             b.type === 'cylindrical-roller' ? t12(language, 'Cylindrical Roller', 'Silindirik Makaralı') : 
                                                             b.type === 'tapered-roller' ? t12(language, 'Tapered Roller', 'Konik Makaralı') : b.type}
                                                        </td>
                                                        <td className="p-2.5 text-center text-[var(--cyan)] font-bold">
                                                            Ø{b.d}
                                                        </td>
                                                        <td className="p-2.5 text-center text-[var(--alu)]">
                                                            Ø{b.D}
                                                        </td>
                                                        <td className="p-2.5 text-center text-[var(--alu)]">
                                                            {b.B}
                                                        </td>
                                                        <td className="p-2.5 text-right text-white font-semibold">
                                                            {b.C.toFixed(1)} kN
                                                        </td>
                                                        <td className="p-2.5 text-right text-[var(--alu-dim)]">
                                                            {b.C0.toFixed(1)} kN
                                                        </td>
                                                        <td className="p-2.5 text-center text-[var(--alu-dim)]">
                                                            {(b.nMax || 15000).toLocaleString()}
                                                        </td>
                                                        <td className="p-2.5 text-right">
                                                            <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                                                                isAdequate 
                                                                    ? 'bg-[var(--ok)]/20 text-[var(--ok)]' 
                                                                    : 'bg-[var(--warn)]/20 text-[var(--warn)]'
                                                            }`}>
                                                                {l10h >= 100000 ? t12(language, '> 100,000 hrs', '> 100.000 sa') : `${l10h.toLocaleString()} ${t12(language, 'hrs', 'sa')}`}
                                                            </span>
                                                        </td>
                                                        <td className="p-2.5 text-center">
                                                            {isCurrent ? (
                                                                <span className="text-[var(--cyan)] font-bold text-[10px] px-2 py-1 rounded bg-[var(--cyan)]/20 border border-[var(--cyan)]/40">
                                                                    {t12(language, 'Active Bearing', 'Aktif Rulman')}
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setBearingForSupport(bearingModalSupport, b.code, autoSyncDiameter);
                                                                        setBearingModalOpen(false);
                                                                    }}
                                                                    className="px-2.5 py-1 rounded bg-[var(--cyan)]/20 hover:bg-[var(--cyan)]/35 text-[var(--cyan)] border border-[var(--cyan)]/50 font-bold transition-all"
                                                                >
                                                                    {t12(language, `Select${autoSyncDiameter ? ` & Set Shaft Dia to Ø${b.d}` : ''}`, `Seç${autoSyncDiameter ? ` & Mil Çapını Ø${b.d} Yap` : ''}`)}
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
