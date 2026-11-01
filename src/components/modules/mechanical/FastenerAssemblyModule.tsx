'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle,
    RotateCcw,
    Wrench,
    Copy,
    Check,
    Layers,
    BookOpen,
    SlidersHorizontal,
    Box,
    Zap,
} from 'lucide-react';
import { ThreadVisualizer } from '@/components/visualizers/ThreadVisualizer';
import { ThreadStandardsGuide } from '@/components/visualizers/ThreadStandardsGuide';
import type { StandardThreadSize, ThreadTypeCode } from '@/lib/fastener/threadProfiles';
import { THREAD_STANDARDS } from '@/data/boltNutStandards';
import {
    computeBoltAssembly,
    isoThreadLengthB,
    getStandardThreadLengthB,
    getGradesForStandard,
    extractMetricNominal,
    parseFastenerSearchParams,
    TORQUE_STANDARDS_LIST,
    type TorquePageStandard,
    getFastenerStandardSpecs,
    BOLT_TYPES_CATALOG,
    type BoltTypeId,
    CLAMPED_MATERIALS,
} from '@/lib/fastener/sharedEngine';
import { FastenerTechnicalDrawing } from './FastenerTechnicalDrawing';
import { BoltTorqueOmniSuite } from './BoltTorqueOmniSuite';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { getFastenerAssemblyStrings } from '@/locales/fastenerAssemblyUiTranslations';
import {
    CalculatorWorkbench,
    WorkbenchField,
    WorkbenchInputs,
    WorkbenchResults,
    WorkbenchSection,
    WorkbenchSlider,
    workbenchSelectClass,
} from '@/components/ui/workbench';
import {
    SmartInputField,
    ProgressiveDisclosure,
    VerdictBadge,
    SafetyMarginBar,
    formatEngineeringValue,
    useGlobalPrecision,
    type LimitStateMetric,
    type VerdictStatus,
    type DisclosureLevelSection,
} from '@/components/calculator-kit';

export default function FastenerAssemblyModule() {
    const { language } = useI18nStore();
    const lang = language;
    const t = getFastenerAssemblyStrings(language);
    const [copied, setCopied] = useState(false);
    type FastenerViewTab = 'assembly' | 'threads' | 'standards_guide' | 'k_factor_chart' | 'pcd_rivet';
    const [activeTab, setActiveTab] = useState<FastenerViewTab>('assembly');

    const [boltType, setBoltType] = useState<BoltTypeId>('hex_bolt');
    const [clampedMaterialId, setClampedMaterialId] = useState<string>('steel_s235');
    const [threadStandard, setThreadStandard] = useState<TorquePageStandard>('Metric Coarse');
    const [size, setSize] = useState('M12');
    const [customDia, setCustomDia] = useState(12);
    const [pitch, setPitch] = useState(1.75);
    const [grade, setGrade] = useState('8.8');
    const [length, setLength] = useState(50);
    const [threadType, setThreadType] = useState<'partial' | 'full' | 'custom'>('partial');
    const [customThreadB, setCustomThreadB] = useState<number>(30);
    const [muThread, setMuThread] = useState(0.14);
    const [muHead, setMuHead] = useState(0.14);
    const [yieldUtilization, setYieldUtilization] = useState(70);
    const [useProof, setUseProof] = useState(true);
    const [alphaA, setAlphaA] = useState<number>(1.6); // VDI 2230 Table 8 tightening factor
    const [focusedFieldId, setFocusedFieldId] = useState<string | null>(null);
    const precision = useGlobalPrecision();

    useEffect(() => {
        const search = window.location.search.startsWith('?') ? window.location.search.slice(1) : window.location.search;
        const { standard, size: qsSize, grade: qsGrade } = parseFastenerSearchParams(search);
        if (standard && (TORQUE_STANDARDS_LIST as string[]).includes(standard)) setThreadStandard(standard as TorquePageStandard);
        if (qsSize) setSize(qsSize);
        if (qsGrade) setGrade(qsGrade);

        const params = new URLSearchParams(search);
        const qsBoltType = params.get('boltType') || params.get('type');
        if (qsBoltType && BOLT_TYPES_CATALOG.some(b => b.id === qsBoltType)) {
            setBoltType(qsBoltType as BoltTypeId);
        }
        const qsClamped = params.get('clampedMaterial') || params.get('material');
        if (qsClamped && CLAMPED_MATERIALS.some(m => m.id === qsClamped)) {
            setClampedMaterialId(qsClamped);
        }

        const tabParam = params.get('tab') || params.get('view');
        if (tabParam === 'threads' || tabParam === 'thread-geometry' || tabParam === 'profiles') {
            setActiveTab('threads');
        } else if (tabParam === 'standards' || tabParam === 'guide' || tabParam === 'standards_guide') {
            setActiveTab('standards_guide');
        } else if (tabParam === 'k-factor' || tabParam === 'chart' || tabParam === 'k_factor_chart') {
            setActiveTab('k_factor_chart');
        } else if (tabParam === 'pcd' || tabParam === 'rivet' || tabParam === 'pcd_rivet') {
            setActiveTab('pcd_rivet');
        }
    }, []);

    const mappedThreadType = useMemo((): ThreadTypeCode => {
        switch (threadStandard) {
            case 'Metric Coarse': return 'M';
            case 'Metric Fine': return 'MF';
            case 'UNC': return 'UNC';
            case 'UNF': return 'UNF';
            case 'UNEF': return 'UNEF';
            case 'BSW': return 'BSW';
            case 'BSF': return 'BSF';
            case 'BSPP (G)': return 'G';
            case 'BSPT (R)': return 'BSPT';
            case 'NPT': return 'NPT';
            case 'NPTF': return 'NPTF';
            case 'Pipe': return size.toUpperCase().includes('NPTF') ? 'NPTF' : size.toUpperCase().includes('NPT') ? 'NPT' : size.toUpperCase().startsWith('R') ? 'BSPT' : 'G';
            case 'Trapezoidal': return 'Tr';
            case 'ACME': return 'Acme';
            case 'Buttress': return 'S';
            case 'Square': return 'Sq';
            case 'Round': return 'Rd';
            case 'Panzergewinde (Pg)': return 'Pg';
            case 'Edison (E)': return 'Edison';
            case 'Valve (Vg)': return 'Vg';
            case 'Gas Cylinder (W)': return 'W_GAS';
            case 'NPSM': return 'NPSM';
            case 'JIC 37°': return 'JIC';
            case 'ORFS': return 'ORFS';
            default: return 'M';
        }
    }, [threadStandard, size]);

    const handlePresetSelect = (preset: StandardThreadSize) => {
        if (preset.standardType === 'M') {
            setThreadStandard('Metric Coarse');
            setSize(preset.name);
        } else if (preset.standardType === 'MF') {
            setThreadStandard('Metric Fine');
            setSize(preset.name);
        } else if (preset.standardType === 'UNC' || preset.standardType === 'UNF' || preset.standardType === 'UNEF') {
            setThreadStandard(preset.standardType);
            setSize(preset.name);
        } else if (preset.standardType === 'BSW' || preset.standardType === 'BSF') {
            setThreadStandard(preset.standardType);
            setSize(preset.name);
        } else if (preset.standardType === 'G' || preset.standardType === 'BSPP') {
            setThreadStandard('BSPP (G)');
            setSize(preset.name);
        } else if (preset.standardType === 'BSPT' || preset.standardType === 'R') {
            setThreadStandard('BSPT (R)');
            setSize(preset.name);
        } else if (preset.standardType === 'NPT') {
            setThreadStandard('NPT');
            setSize(preset.name);
        } else if (preset.standardType === 'NPTF') {
            setThreadStandard('NPTF');
            setSize(preset.name);
        } else if (preset.standardType === 'Tr') {
            setThreadStandard('Trapezoidal');
            setSize(preset.name);
        } else if (preset.standardType === 'Acme' || preset.standardType === 'AcmeStub') {
            setThreadStandard('ACME');
            setSize(preset.name);
        } else if (preset.standardType === 'S') {
            setThreadStandard('Buttress');
            setSize(preset.name);
        } else if (preset.standardType === 'Sq') {
            setThreadStandard('Square');
            setSize(preset.name);
        } else if (preset.standardType === 'Rd') {
            setThreadStandard('Round');
            setSize(preset.name);
        } else if (preset.standardType === 'Pg') {
            setThreadStandard('Panzergewinde (Pg)');
            setSize(preset.name);
        } else if (preset.standardType === 'Edison') {
            setThreadStandard('Edison (E)');
            setSize(preset.name);
        } else if (preset.standardType === 'Vg') {
            setThreadStandard('Valve (Vg)');
            setSize(preset.name);
        } else if (preset.standardType === 'W' || preset.standardType === 'W_GAS') {
            setThreadStandard('Gas Cylinder (W)');
            setSize(preset.name);
        } else if (preset.standardType === 'NPSM' || preset.standardType === 'NPS') {
            setThreadStandard('NPSM');
            setSize(preset.name);
        } else if (preset.standardType === 'JIC') {
            setThreadStandard('JIC 37°');
            setSize(preset.name);
        } else if (preset.standardType === 'ORFS') {
            setThreadStandard('ORFS');
            setSize(preset.name);
        } else {
            setPitch(preset.pitchMm);
            setCustomDia(preset.diameterMm);
        }
    };

    const sizes = useMemo(() => {
        if (threadStandard === 'Custom') return [];
        if (threadStandard === 'Pipe') {
            return THREAD_STANDARDS.filter(
                (row) =>
                    row.type === 'Pipe' ||
                    row.type === 'BSPP (G)' ||
                    row.type === 'BSPT (R)' ||
                    row.type === 'NPT' ||
                    row.type === 'NPTF',
            );
        }
        return THREAD_STANDARDS.filter((row) => row.type === threadStandard);
    }, [threadStandard]);

    useEffect(() => {
        if (threadStandard === 'Custom') return;
        const available = (
            threadStandard === 'Pipe'
                ? THREAD_STANDARDS.filter(
                    (row) =>
                        row.type === 'Pipe' ||
                        row.type === 'BSPP (G)' ||
                        row.type === 'BSPT (R)' ||
                        row.type === 'NPT' ||
                        row.type === 'NPTF',
                )
                : THREAD_STANDARDS.filter((row) => row.type === threadStandard)
        ).map((row) => row.size);
        if (available.length && !available.includes(size)) setSize(available[0]);
    }, [threadStandard, size]);

    const availableGrades = useMemo(() => getGradesForStandard(threadStandard, size), [threadStandard, size]);

    useEffect(() => {
        const found = availableGrades.find((g) => g.grade === grade);
        if (!found) {
            const def = availableGrades.find((g) => g.isDefault) || availableGrades[0];
            if (def) setGrade(def.grade);
        }
    }, [availableGrades, grade]);

    const dNomApprox = threadStandard === 'Custom'
        ? customDia
        : ((sizes.find((r) => r.size === size)?.diameter ?? parseFloat(size.replace(/^[^\d.]*/, ''))) || 12);
    const standardIsoB = useMemo(() => getStandardThreadLengthB(threadStandard, dNomApprox, length), [threadStandard, dNomApprox, length]);
    const effectiveB = useMemo(() => {
        if (threadType === 'full') return length;
        if (threadType === 'custom') return Math.min(length, Math.max(1, customThreadB));
        return Math.min(length, standardIsoB);
    }, [threadType, length, customThreadB, standardIsoB]);

    const results = useMemo(
        () =>
            computeBoltAssembly({
                threadStandard,
                size,
                customDia,
                pitch,
                grade,
                muThread,
                muHead,
                yieldUtilization,
                clearanceSeries: 'normal',
                useProofStress: useProof,
                length,
                threadLengthB: effectiveB,
                boltType,
                clampedMaterialId,
                alphaA,
            }),
        [threadStandard, size, customDia, pitch, grade, muThread, muHead, yieldUtilization, useProof, length, effectiveB, boltType, clampedMaterialId, alphaA],
    );

    // Deep Visual Stress & Torque Calculations
    const Fm = Number(results.Fm_max ?? 0); // kN (Max assembly preload)
    const FmMin = Number(results.FM_min_kN ?? Fm / alphaA); // FM,min = FM,max / αA (VDI 2230 Table A8)
    const F0 = Fm * 1000; // N
    const dNom = results.d_nom; // mm
    const d3 = results.d3; // mm
    const As = results.As; // mm2
    const MA = results.MA; // N.m

    // Torque components in N.m
    const totalK = results.K1 + results.K2 + results.K3 || 1;
    const M1 = results.M1 ?? ((results.K1 / totalK) * MA); // Pitch stretch torque
    const M2 = results.M2 ?? ((results.K2 / totalK) * MA); // Thread friction torque
    const M3 = results.M3 ?? ((results.K3 / totalK) * MA); // Underhead friction torque

    // Stresses
    const sigmaZ = results.sigmaZ ?? (As > 0 ? F0 / As : 0); // Axial tensile stress (MPa)
    const dS = (results.d2 + d3) / 2; // stress diameter d_S = (d2 + d3)/2, VDI 2230 §5.5.1
    const Wp = (Math.PI * Math.pow(dS, 3)) / 16; // Polar section modulus (mm3)
    const tau = results.tau ?? (Wp > 0 ? ((M1 + M2) * 1000) / Wp : 0); // τ = MG / Wp (MPa)
    const sigmaEq = results.sigmaEq ?? Math.sqrt(Math.pow(sigmaZ, 2) + 3 * Math.pow(tau, 2)); // von Mises (MPa)
    const Sy = results.Sy; // Yield strength (MPa)
    const Sp = results.Sp; // Proof strength (MPa)
    const Rm = Number(results.Rm ?? Sy / 0.8); // Rm,min from the property-class table (ISO 898-1)
    const safetyYield = sigmaEq > 0 ? Sy / sigmaEq : 1.0;
    const safetyTensile = sigmaZ > 0 ? Rm / sigmaZ : 1.0;
    const transSlipLimit = FmMin * 0.20; // Transverse friction slip limit (kN) with alpha_A scatter

    // VDI 2230 Surface Pressure & Stripping
    const pM = results.pM;
    const pG_zul = results.pG_zul;
    const surfaceSafety = results.surfaceSafety;
    const mCrit = results.mCrit;
    const strippingSafety = results.strippingSafety;

    // Capacity utilisation. VDI 2230 §5.5.1: the equivalent stress at assembly σred,M is
    // checked against the minimum yield point Rp0.2 (not Sp). ν only sets the target preload.
    const capacityStress = Sy;
    const etaYield = capacityStress > 0 ? sigmaEq / capacityStress : 0;
    const etaTensile = Rm > 0 ? sigmaZ / Rm : 0;
    const etaPressure = pG_zul > 0 ? pM / pG_zul : 0;
    const maxUtilization = Math.max(etaYield, etaTensile, etaPressure);

    const verdictStatus: VerdictStatus =
        maxUtilization <= 0.80 ? 'PASS' : maxUtilization <= 1.00 ? 'WARN' : 'FAIL';

    const limitMetrics: LimitStateMetric[] = [
        {
            id: 'von-mises',
            name: t12(language, 'Equivalent von Mises Stress', 'Bileşik von Mises Gerilmesi'),
            symbol: 'σeq',
            demand: sigmaEq,
            capacity: capacityStress,
            unit: 'MPa',
            utilization: etaYield,
            standardCitation: 'VDI 2230 §5.5.1 · σred,M ≤ Rp0.2',
            isCritical: etaYield >= etaTensile && etaYield >= etaPressure,
        },
        {
            id: 'axial-tensile',
            name: t12(language, 'Axial Tensile Stress', 'Eksenel Çekme Gerilmesi'),
            symbol: 'σz',
            demand: sigmaZ,
            capacity: Rm,
            unit: 'MPa',
            utilization: etaTensile,
            standardCitation: 'ISO 898-1 §9.1',
            isCritical: etaTensile > etaYield && etaTensile >= etaPressure,
        },
        {
            id: 'surface-pressure',
            name: t12(language, 'Underhead Bearing Pressure', 'Kafa Altı Yüzey Basıncı'),
            symbol: 'pM',
            demand: pM,
            capacity: pG_zul,
            unit: 'MPa',
            utilization: etaPressure,
            standardCitation: results.clampedMaterialSource || 'VDI 2230-1:2015 Tab. A9',
            isCritical: etaPressure > etaYield && etaPressure > etaTensile,
        },
    ];

    const ok = verdictStatus === 'PASS';

    const shankLs = Math.max(0, length - results.threadLengthB);
    const stdSpec = results.spec || getFastenerStandardSpecs(threadStandard, size, results.threadLengthB >= length, boltType);
    const stdIso = stdSpec.boltCurrent;

    const activeStandards = useMemo(() => {
        if (stdSpec.family === 'inch') return ['ASME PCC-1', 'SAE J429'];
        if (stdSpec.family === 'npt') return ['ASME B1.20.1'];
        if (stdSpec.family === 'bspp') return ['ISO 228-1'];
        if (stdSpec.family === 'bspt') return ['ISO 7-1'];
        if (stdSpec.family === 'trapezoidal') return ['DIN 103'];
        if (stdSpec.family === 'acme') return ['ASME B1.5'];
        return ['VDI 2230', 'ISO 898-1'];
    }, [stdSpec.family]);

    const designRows = useMemo(() => {
        const rows: { key: string; label: string; val: string }[] = [
            { key: 'd', label: 'Ød', val: `${formatEngineeringValue(results.d_nom, precision)} mm` },
            { key: 'd2', label: 'Ød₂', val: `${formatEngineeringValue(results.d2, precision)} mm` },
            { key: 'd3', label: 'Ød₃', val: `${formatEngineeringValue(results.d3, precision)} mm` },
            { key: 'P', label: 'P', val: `${formatEngineeringValue(results.pitchVal, precision)} mm` },
        ];

        const hd = results.headDim;
        if (hd) {
            if (hd.dk && hd.dk > 0) {
                rows.push({ key: 'dk', label: 'Ødk', val: `${formatEngineeringValue(hd.dk, precision)} mm` });
            }
            if (hd.dc && hd.dc > 0) {
                rows.push({ key: 'dc', label: t12(language, 'Ødc (flange)', 'Ødc (flanş)'), val: `${formatEngineeringValue(hd.dc, precision)} mm` });
            }
            if (hd.s && hd.s > 0) {
                const sLabel = results.boltTypeMeta?.hasSocket ? t12(language, 's (socket)', 's (alyan)') : t12(language, 's (wrench)', 's (anahtar)');
                rows.push({ key: 's', label: sLabel, val: `${formatEngineeringValue(hd.s, precision)} mm` });
            }
            if (hd.k && hd.k > 0) {
                rows.push({ key: 'k', label: t12(language, 'k (head)', 'k (kafa)'), val: `${formatEngineeringValue(hd.k, precision)} mm` });
            }
            if (hd.t && hd.t > 0) {
                rows.push({ key: 't', label: t12(language, 't (socket)', 't (soket)'), val: `${formatEngineeringValue(hd.t, precision)} mm` });
            }
            if (hd.bm && hd.bm > 0) {
                rows.push({ key: 'bm', label: t12(language, 'bm (metal end)', 'bm (gövde)'), val: `${formatEngineeringValue(hd.bm, precision)} mm` });
            }
            if (hd.dp && hd.dp > 0) {
                rows.push({ key: 'dp', label: t12(language, 'Ødp (point)', 'Ødp (uç)'), val: `${formatEngineeringValue(hd.dp, precision)} mm` });
            }
            if (hd.d4_eye && hd.d4_eye > 0) {
                rows.push({ key: 'd4', label: t12(language, 'Ød₄ (eye)', 'Ød₄ (halka)'), val: `${formatEngineeringValue(hd.d4_eye, precision)} mm` });
            }
        } else {
            rows.push(
                { key: 's', label: 's', val: `${formatEngineeringValue(results.boltDim.s, Math.min(2, precision))} mm` },
                { key: 'k', label: 'k', val: `${formatEngineeringValue(results.boltDim.k, Math.min(2, precision))} mm` }
            );
        }

        rows.push(
            { key: 'L', label: 'L', val: `${formatEngineeringValue(length, precision)} mm` },
            { key: 'b', label: t12(language, 'Thread b', 'Diş boyu b'), val: `${formatEngineeringValue(results.threadLengthB, precision)} mm` },
            { key: 'ls', label: t12(language, 'Shank ls', 'Gövde ls'), val: `${formatEngineeringValue(shankLs, precision)} mm` },
            { key: 'tap', label: t12(lang, 'Tap', 'Kılavuz'), val: `${formatEngineeringValue(results.tapDrill, precision)} mm` },
        );

        return rows;
    }, [results, precision, length, shankLs, language, lang]);

    const copySummary = () => {
        const cadBlock = designRows.map((r) => `${r.key} = ${r.val}`).join('\n');
        const threadDesc = results.threadLengthB >= length
            ? t12(language, `Fully Threaded (${stdSpec.boltFull})`, `Tam Dişli (${stdSpec.boltFull})`)
            : t12(language, `Partially Threaded ${stdSpec.boltPartial} (b=${results.threadLengthB.toFixed(1)} mm, ls=${shankLs.toFixed(1)} mm)`, `Yarım Dişli ${stdSpec.boltPartial} (b=${results.threadLengthB.toFixed(1)} mm, ls=${shankLs.toFixed(1)} mm)`);
        const header = t12(language, 'Bolt Torque & CAD Summary', 'Cıvata Tork & CAD Özeti');
        const sizeLabel = t12(language, 'Size', 'Boyut');
        const gradeLabel = t12(language, 'Grade', 'Kalite');
        const torqueLabel = t12(language, 'Tightening torque MA', 'Sıkma torku MA');
        const preloadLabel = t12(language, 'Preload FM', 'Ön yük FM');
        const cadLabel = t12(language, 'CAD / manufacturing dimensions', 'CAD / imalat ölçüleri');
        const text = `${header}
${sizeLabel}: ${size} × ${length} mm (${threadDesc})  ${gradeLabel} ${grade}
${torqueLabel}: ${MA.toFixed(1)} N·m
${preloadLabel}: ${Fm.toFixed(1)} kN
σeq = ${sigmaEq.toFixed(0)} MPa  n = ${safetyYield.toFixed(2)}

${cadLabel} (${stdSpec.boltCurrent} · ${stdSpec.nutStandard} · ${stdSpec.threadProfile} · ${stdSpec.clearanceHole})
${cadBlock}`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const reset = () => {
        setBoltType('hex_bolt');
        setClampedMaterialId('steel_s235');
        setThreadStandard('Metric Coarse');
        setSize('M12');
        setGrade('8.8');
        setMuThread(0.14);
        setMuHead(0.14);
        setYieldUtilization(70);
        setLength(50);
        setThreadType('partial');
        setCustomThreadB(30);
        setUseProof(true);
        setAlphaA(1.6);
    };

    const disclosureSections: DisclosureLevelSection[] = [
        {
            id: 'basic',
            title: t12(language, 'Basic & Sizing', 'Temel & Boyutlandırma'),
            kicker: t12(language, 'LEVEL 1', 'SEVİYE 1'),
            isDirty: boltType !== 'hex_bolt' || size !== 'M12' || length !== 50 || grade !== '8.8' || yieldUtilization !== 70,
            activeSummary: [
                results.boltTypeMeta?.standard || 'ISO 4014',
                size,
                `${formatEngineeringValue(length, 0)} mm`,
                t12(language, `Class ${grade}`, `Kalite ${grade}`),
                `ν ${yieldUtilization}%`,
            ],
            onResetToDefaults: () => {
                setBoltType('hex_bolt');
                setSize('M12');
                setLength(50);
                setGrade('8.8');
                setYieldUtilization(70);
            },
            children: (
                <div className="space-y-3">
                    {/* Fastener / Bolt Type Selection */}
                    <div>
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="font-semibold text-[var(--ink)]">
                                {t12(lang, 'Fastener / Head Type', 'Cıvata / Kafa Geometrisi')}
                            </span>
                            <span className="font-mono text-[10px] text-[var(--cyan)] font-bold">
                                {results.boltTypeMeta?.standard || 'DIN 931'}
                            </span>
                        </div>
                        <select
                            value={boltType}
                            onChange={(e) => setBoltType(e.target.value as BoltTypeId)}
                            className={workbenchSelectClass}
                        >
                            {BOLT_TYPES_CATALOG.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.standard} · {language === 'tr' ? b.name.tr : b.name.en}
                                </option>
                            ))}
                        </select>
                        <div className="grid grid-cols-3 gap-1.5 pt-1.5">
                            {[
                                { id: 'hex_bolt' as BoltTypeId, label: t12(language, 'Hex Head', 'Altı Köşe'), std: 'ISO 4014' },
                                { id: 'socket_cap' as BoltTypeId, label: t12(language, 'Socket Cap', 'İmbus'), std: 'ISO 4762' },
                                { id: 'countersunk' as BoltTypeId, label: t12(language, 'Countersunk', 'Havşa'), std: 'ISO 10642' },
                                { id: 'button_head' as BoltTypeId, label: t12(language, 'Button Head', 'Bombe'), std: 'ISO 7380-1' },
                                { id: 'flange_hex' as BoltTypeId, label: t12(language, 'Flange Hex', 'Flanşlı'), std: 'DIN 6921' },
                                { id: 'stud_bolt' as BoltTypeId, label: t12(language, 'Stud Bolt', 'Saplama'), std: 'DIN 939' },
                            ].map((btn) => {
                                const isActive = boltType === btn.id;
                                return (
                                    <button
                                        key={btn.id}
                                        type="button"
                                        onClick={() => setBoltType(btn.id)}
                                        title={`${btn.label} (${btn.std})`}
                                        className={`rounded-md py-1.5 px-1 text-center transition-all cursor-pointer ${
                                            isActive
                                                ? 'border border-[var(--std)]/60 bg-[var(--std)]/20 text-[var(--std)] font-bold shadow-xs'
                                                : 'border border-[var(--line)] bg-[var(--line)]/5 text-[var(--alu-dim)] hover:text-[var(--ink)]'
                                        }`}
                                    >
                                        <div className="text-[10px] font-semibold truncate">{btn.label}</div>
                                        <div className="text-[8.5px] font-mono text-[var(--muted)] truncate">{btn.std}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <WorkbenchField label={t.threadStandard || 'Standard'}>
                        <select value={threadStandard} onChange={(e) => setThreadStandard(e.target.value as TorquePageStandard)} className={workbenchSelectClass}>
                            {TORQUE_STANDARDS_LIST.map((std) => (
                                <option key={std} value={std}>{std}</option>
                            ))}
                        </select>
                    </WorkbenchField>

                    {threadStandard === 'Custom' ? (
                        <>
                            <WorkbenchSlider label={t.nomDia || 'Nominal Ø'} value={customDia} min={3} max={64} step={0.5} unit="mm" onChange={setCustomDia} />
                            <WorkbenchSlider label={t.pitchLead || 'Pitch'} value={pitch} min={0.2} max={8} step={0.05} unit="mm" onChange={setPitch} />
                        </>
                    ) : (
                        <WorkbenchField label={t.stdSize || 'Size'}>
                            <select value={size} onChange={(e) => setSize(e.target.value)} className={workbenchSelectClass}>
                                {sizes.map((row, idx) => (
                                    <option key={`${row.type || threadStandard}-${row.size}-${idx}`} value={row.size}>
                                        {row.size}{row.pitch ? ` · P=${row.pitch} mm` : row.tpi ? ` · ${row.tpi} TPI` : ''} (Ø{row.diameter} mm)
                                    </option>
                                ))}
                            </select>
                        </WorkbenchField>
                    )}

                    {/* Smart Math Input for Length L with mm / in discrete unit conversion */}
                    <SmartInputField
                        id="bolt-length"
                        label={t.length || 'Length L'}
                        sublabel="L"
                        valueSi={length}
                        onChangeSi={(newSi) => setLength(Math.round(newSi))}
                        units={[
                            { label: 'mm', symbol: 'mm', toSiRatio: 1, decimals: 1 },
                            { label: 'in', symbol: 'in', toSiRatio: 25.4, decimals: 3 },
                        ]}
                        min={10}
                        max={300}
                        onFocusFieldId={() => setFocusedFieldId('L')}
                        onBlurFieldId={() => setFocusedFieldId(null)}
                        tooltip={t12(language, 'Length under head L (Supports inline arithmetic: 45+10)', 'Kafa altından cıvata ucuna kadar boy L (Matematiksel girdi: 45+10)')}
                    />

                    <div>
                        <div className="text-[11px] font-semibold text-[var(--ink)] mb-1.5">
                            {t12(lang, `${stdSpec.strengthStandard} Grade / Class`, `${stdSpec.strengthStandard} Kalite Sınıfı`)}
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                            {availableGrades.map((g) => (
                                <button
                                    key={g.grade}
                                    type="button"
                                    onClick={() => setGrade(g.grade)}
                                    className={`rounded-lg border py-2 px-1 text-[11px] font-bold transition-colors text-center cursor-pointer ${
                                        grade === g.grade ? 'border-[var(--std)]/50 bg-[var(--std)]/15 text-[var(--std)]' : 'border-[var(--line)] bg-[var(--line)]/5 text-[var(--alu-dim)] hover:text-[var(--ink)]'
                                    }`}
                                    title={g.label}
                                >
                                    {g.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <WorkbenchSlider
                        label={useProof ? (t12(lang, 'Proof utilization v (% Sp)', 'Proof kullanım v (% Sp)')) : (t12(lang, 'Yield utilization v (% Sy)', 'Akma kullanım v (% Sy)'))}
                        value={yieldUtilization}
                        min={40}
                        max={100}
                        step={5}
                        unit="%"
                        onChange={setYieldUtilization}
                    />
                </div>
            ),
        },
        {
            id: 'assembly',
            title: t12(language, 'Assembly, Thread & Friction', 'Montaj, Paso & Sürtünme'),
            kicker: t12(language, 'LEVEL 2', 'SEVİYE 2'),
            isDirty: clampedMaterialId !== 'steel_s235' || threadType !== 'partial' || muThread !== 0.14 || muHead !== 0.14 || alphaA !== 1.6,
            activeSummary: [
                results.clampedMaterialName || 'S235',
                threadType === 'partial' ? (t12(language, 'Partial', 'Yarım Diş')) : threadType === 'full' ? (t12(language, 'Full', 'Tam Diş')) : t12(language, 'Custom b', 'Özel b'),
                `μG=${muThread}`,
                `μK=${muHead}`,
                `αA=${alphaA}`,
            ],
            onResetToDefaults: () => {
                setClampedMaterialId('steel_s235');
                setThreadType('partial');
                setMuThread(0.14);
                setMuHead(0.14);
                setAlphaA(1.6);
            },
            children: (
                <div className="space-y-3">
                    {/* Clamped Material (Bearing Surface Pressure) */}
                    <div>
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="font-semibold text-[var(--ink)]">
                                {t12(lang, 'Clamped Material (Surface Pressure)', 'Sıkılan Parça Malzemesi (Kafa Altı Basıncı)')}
                            </span>
                            <span className="font-mono text-[10px] text-[var(--cyan)] font-bold" title={results.clampedMaterialSource}>
                                pG = {pG_zul} MPa
                            </span>
                        </div>
                        <select
                            value={clampedMaterialId}
                            onChange={(e) => setClampedMaterialId(e.target.value)}
                            className={workbenchSelectClass}
                        >
                            {CLAMPED_MATERIALS.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {language === 'tr' ? m.name.tr : m.name.en} · pG = {m.pG_zul} MPa (E = {m.modulusE} GPa)
                                </option>
                            ))}
                        </select>
                        <div className="mt-1 text-[9.5px] text-[var(--muted)] font-mono">
                            {t12(
                                lang,
                                `${results.clampedMaterialSource || 'VDI 2230-1:2015 Table A9'}: limiting surface pressure pG under head and nut. Where no embedding is acceptable, keep pM below ~70 % of pG.`,
                                `${results.clampedMaterialSource || 'VDI 2230-1:2015 Tablo A9'}: kafa ve somun altı sınır yüzey basıncı pG. Hiç oturma istenmiyorsa pM'yi pG'nin ~%70'inin altında tutun.`
                            )}
                        </div>
                    </div>
                    {/* Thread Engagement */}
                    <div>
                        <div className="mb-1.5 flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-[var(--ink)]">
                                {t12(lang, 'Thread / Engagement (b)', 'Diş Türü & Paso Boyu (b)')}
                            </span>
                            <span className="font-mono text-[11px] font-bold text-[var(--cyan)]">
                                b = {formatEngineeringValue(results.threadLengthB, precision)} mm
                                {shankLs > 0.1 && (
                                    <span className="text-[var(--muted)] font-normal"> · ls = {formatEngineeringValue(shankLs, precision)} mm</span>
                                )}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-1">
                            <button
                                type="button"
                                onClick={() => setThreadType('partial')}
                                className={`rounded-md py-1.5 px-1 text-[10px] font-bold transition-all text-center cursor-pointer ${
                                    threadType === 'partial'
                                        ? 'border border-[var(--std)]/40 bg-[var(--std)]/20 text-[var(--std)] shadow-sm'
                                        : 'border border-transparent text-[var(--alu-dim)] hover:text-[var(--ink)]'
                                }`}
                                title={t12(lang, `Standard bolt with shank (${stdSpec.boltPartial})`, `Şaftlı standart yarım dişli cıvata (${stdSpec.boltPartial})`)}
                            >
                                {t12(lang, stdSpec.buttonPartialLabel.en, stdSpec.buttonPartialLabel.tr)}
                            </button>
                            <button
                                type="button"
                                onClick={() => setThreadType('full')}
                                className={`rounded-md py-1.5 px-1 text-[10px] font-bold transition-all text-center cursor-pointer ${
                                    threadType === 'full'
                                        ? 'border border-[var(--std)]/40 bg-[var(--std)]/20 text-[var(--std)] shadow-sm'
                                        : 'border border-transparent text-[var(--alu-dim)] hover:text-[var(--ink)]'
                                }`}
                                title={t12(lang, `Fully threaded bolt (${stdSpec.boltFull})`, `Kafaya kadar tam dişli cıvata (${stdSpec.boltFull})`)}
                            >
                                {t12(lang, stdSpec.buttonFullLabel.en, stdSpec.buttonFullLabel.tr)}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setThreadType('custom');
                                    if (!customThreadB || customThreadB > length) {
                                        setCustomThreadB(Math.min(length, Math.round(standardIsoB)));
                                    }
                                }}
                                className={`rounded-md py-1.5 px-1 text-[10px] font-bold transition-all text-center cursor-pointer ${
                                    threadType === 'custom'
                                        ? 'border border-[var(--std)]/40 bg-[var(--std)]/20 text-[var(--std)] shadow-sm'
                                        : 'border border-transparent text-[var(--alu-dim)] hover:text-[var(--ink)]'
                                }`}
                                title={t12(lang, 'Custom thread length b slider', 'Kullanıcı tanımlı özel paso boyu (b)')}
                            >
                                {t12(lang, 'Custom Thread (b)', 'Özel Paso (b)')}
                            </button>
                        </div>

                        {threadType === 'custom' && (
                            <div className="mt-2.5 rounded-lg border border-[var(--cyan)]/20 bg-[var(--cyan)]/10 p-2">
                                <WorkbenchSlider
                                    label={t12(lang, 'Thread Length b', 'Diş Boyu (Paso) b')}
                                    value={effectiveB}
                                    min={Math.min(5, length)}
                                    max={length}
                                    step={1}
                                    unit="mm"
                                    onChange={(val) => setCustomThreadB(val)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Friction & Lube */}
                    <div className="pt-2 border-t border-[var(--line)]">
                        <div className="text-[11px] font-semibold text-[var(--ink)] mb-2">
                            {t12(lang, 'Friction & Lubrication', 'Sürtünme & Yağlama Durumu')}
                        </div>
                        <WorkbenchSlider label={t.threadFriction || 'μG thread'} value={muThread} min={0.05} max={0.3} step={0.01} onChange={setMuThread} />
                        <WorkbenchSlider label={t.headFriction || 'μK underhead'} value={muHead} min={0.05} max={0.3} step={0.01} onChange={setMuHead} />
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                            {[
                                { mu: 0.14, labelEn: 'Dry Steel (0.14)', labelTr: 'Kuru Çelik (0.14)' },
                                { mu: 0.12, labelEn: 'Light Oiled (0.12)', labelTr: 'Hafif Yağlı (0.12)' },
                                { mu: 0.10, labelEn: 'Heavy Oiled (0.10)', labelTr: 'Yağlanmış (0.10)' },
                                { mu: 0.15, labelEn: 'Zinc Plated (0.15)', labelTr: 'Çinko / Galv (0.15)' },
                                { mu: 0.08, labelEn: 'MoS2 Paste (0.08)', labelTr: 'MoS2 Pastası (0.08)' },
                                { mu: 0.20, labelEn: 'Inox Dry (0.20)', labelTr: 'Paslanmaz Kuru (0.20)' },
                            ].map((preset) => {
                                const isActive = Math.abs(muThread - preset.mu) < 0.005 && Math.abs(muHead - preset.mu) < 0.005;
                                return (
                                    <button
                                        key={preset.mu}
                                        type="button"
                                        onClick={() => { setMuThread(preset.mu); setMuHead(preset.mu); }}
                                        className={`text-[9px] font-mono py-1.5 px-1 rounded-[var(--radius-s)] border transition-all cursor-pointer text-center ${
                                            isActive
                                                ? 'bg-[var(--cyan)]/15 text-[var(--cyan)] border-[var(--cyan)]/40 font-bold shadow-xs'
                                                : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:text-[var(--ink)] hover:border-[var(--line-strong)]'
                                        }`}
                                    >
                                        {language === 'tr' ? preset.labelTr : preset.labelEn}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* VDI 2230 Table 8 Tightening Method (alpha_A) */}
                    <div className="pt-2 border-t border-[var(--line)]">
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="font-semibold text-[var(--ink)]">
                                {t12(lang, 'Tightening Method (VDI 2230 Table 8)', 'Sıkma Yöntemi Dağılımı (VDI 2230 Tablo 8)')}
                            </span>
                            <span className="font-mono text-[10px] text-[var(--cyan)] font-bold">
                                αA = {alphaA}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                            {[
                                { a: 1.2, label: t12(lang, 'Angle/Yield', 'Açı/Akma'), desc: t12(lang, 'Angle-controlled', 'Açı kontrollü') },
                                { a: 1.4, label: t12(lang, 'Motorized', 'Motorlu'), desc: t12(lang, 'Calibrated wrench', 'Kalibre tork') },
                                { a: 1.6, label: t12(lang, 'Manual/Torque', 'Mekanik'), desc: t12(lang, 'Standard torque', 'Standart tork') },
                                { a: 2.0, label: t12(lang, 'Impact', 'Darbeli'), desc: t12(lang, 'Uncontrolled', 'Kontrolsüz') },
                            ].map((m) => (
                                <button
                                    key={m.a}
                                    type="button"
                                    onClick={() => setAlphaA(m.a)}
                                    className={`py-1.5 px-1 rounded text-center transition-all cursor-pointer ${
                                        alphaA === m.a
                                            ? 'border border-[var(--cyan)]/50 bg-[var(--cyan)]/20 text-[var(--cyan)] shadow-sm'
                                            : 'border border-[var(--line)] bg-[var(--line)]/5 text-[var(--alu-dim)] hover:text-[var(--ink)]'
                                    }`}
                                >
                                    <div className="font-mono text-[10px] font-bold">α={m.a}</div>
                                    <div className="text-[9px] text-[var(--muted)] truncate">{m.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'advanced',
            title: t12(language, 'Advanced Analysis & Standards', 'İleri Analiz & Standart Parametreleri'),
            kicker: t12(language, 'LEVEL 3', 'SEVİYE 3'),
            isDirty: !useProof,
            activeSummary: [useProof ? t12(language, 'ν × Sp (proof)', 'ν × Sp (proof)') : t12(language, 'ν × Rp0.2 (yield)', 'ν × Rp0.2 (akma)')],
            onResetToDefaults: () => setUseProof(true),
            children: (
                <div className="space-y-3">
                    <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[var(--ink)] bg-[var(--bg-1)] p-2.5 rounded-lg border border-[var(--line)]">
                        <input type="checkbox" checked={useProof} onChange={(e) => setUseProof(e.target.checked)} className="accent-[var(--std)]" />
                        <span>{t12(lang, 'Use Sp (proof strength) for preload — table-aligned', 'Önyük için Sp (proof dayanımı) kullan — tablo uyumlu')}</span>
                    </label>

                    <div className="text-[10px] text-[var(--muted)] leading-relaxed font-mono">
                        {t12(language, 'Target preload FM = ν · S · As with S = Sp (ISO 898-1 proof stress) or Rp0.2. The assembly check is always σred,M = √(σz² + 3τ²) ≤ Rp0.2 (VDI 2230 §5.5.1).', 'Hedef ön yük FM = ν · S · As; S = Sp (ISO 898-1 proof gerilmesi) veya Rp0.2. Montaj kontrolü her zaman σred,M = √(σz² + 3τ²) ≤ Rp0.2 (VDI 2230 §5.5.1).')}
                    </div>
                </div>
            ),
        },
    ];

    const fastenerPresets = useMemo(() => [
        {
            label: 'M8 8.8 (Hex DIN 933)',
            onSelect: () => {
                setBoltType('hex_bolt');
                setClampedMaterialId('steel_s235');
                setThreadStandard('Metric Coarse');
                setSize('M8');
                setGrade('8.8');
                setLength(30);
                setMuThread(0.14);
                setMuHead(0.14);
                setYieldUtilization(70);
                setAlphaA(1.6);
            }
        },
        {
            label: 'M12 10.9 (Socket Cap DIN 912)',
            onSelect: () => {
                setBoltType('socket_cap');
                setClampedMaterialId('cast_iron_gj_250');
                setThreadStandard('Metric Coarse');
                setSize('M12');
                setGrade('10.9');
                setLength(60);
                setMuThread(0.10);
                setMuHead(0.10);
                setYieldUtilization(90);
                setAlphaA(1.2);
            }
        },
        {
            label: 'M16 12.9 (Structural S355)',
            onSelect: () => {
                setBoltType('hex_bolt');
                setClampedMaterialId('steel_s355');
                setThreadStandard('Metric Coarse');
                setSize('M16');
                setGrade('12.9');
                setLength(80);
                setMuThread(0.10);
                setMuHead(0.10);
                setYieldUtilization(90);
                setAlphaA(1.4);
            }
        },
        {
            label: 'M10 10.9 (Flange DIN 6921)',
            onSelect: () => {
                setBoltType('flange_hex');
                setClampedMaterialId('alu_6061');
                setThreadStandard('Metric Coarse');
                setSize('M10');
                setGrade('10.9');
                setLength(40);
                setMuThread(0.12);
                setMuHead(0.12);
                setYieldUtilization(85);
                setAlphaA(1.4);
            }
        },
        {
            label: 'M6 A2-70 (Countersunk DIN 7991)',
            onSelect: () => {
                setBoltType('countersunk');
                setClampedMaterialId('alu_6061');
                setThreadStandard('Metric Coarse');
                setSize('M6');
                setGrade('A2-70');
                setLength(25);
                setMuThread(0.16);
                setMuHead(0.16);
                setYieldUtilization(70);
                setAlphaA(1.6);
            }
        },
    ], []);

    return (
        <CalculatorWorkbench layout="flow">
            <WorkbenchInputs
                title={t12(lang, 'Bolt Torque & Preload', 'Cıvata Torku & Ön Yük')}
                subtitle={stdSpec.workbenchSubtitle}
                standards={activeStandards}
                icon={<Wrench size={18} className="text-[var(--std)]" />}
                accent="blue"
                onReset={reset}
                presets={fastenerPresets}
            >
                <ProgressiveDisclosure sections={disclosureSections} />

                <div className="border-t border-[var(--line)] pt-3">
                    <button type="button" onClick={reset} className="flex w-full items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--line)]/5 px-3 py-2.5 text-[11px] font-semibold text-[var(--alu-dim)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)] cursor-pointer" title={t12(lang, 'Reset to defaults', 'Varsayılanlara sıfırla')}>
                        <span>{size} · {grade} · μ={muThread} · v={yieldUtilization}% · αA={alphaA}</span>
                        <RotateCcw size={13} />
                    </button>
                </div>
            </WorkbenchInputs>

            <WorkbenchResults className="overflow-visible">
                <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-5">
                    {/* ═══ View Mode Navigation Tabs ═══ */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
                        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-2)] border border-[var(--line)]">
                            <button
                                type="button"
                                onClick={() => setActiveTab('assembly')}
                                className={`flex items-center gap-2 px-3.5 py-2 min-h-[42px] rounded-lg text-xs font-semibold transition-all ${
                                    activeTab === 'assembly'
                                        ? 'bg-[var(--std)]/20 text-[var(--std)] border border-[var(--std)]/40 shadow-sm'
                                        : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
                                }`}
                            >
                                <Wrench size={14} className={activeTab === 'assembly' ? 'text-[var(--std)]' : 'text-[var(--muted)]'} />
                                <span>
                                    {stdSpec.family === 'inch'
                                        ? t12(language, 'Assembly & Torque (ASME PCC-1 / SAE J429)', 'Montaj & Tork (ASME PCC-1 / SAE J429)')
                                        : stdSpec.family === 'npt'
                                        ? t12(language, 'Assembly & Pipe Torque (ASME B1.20.1)', 'Montaj & Boru Torku (ASME B1.20.1)')
                                        : stdSpec.family === 'trapezoidal'
                                        ? t12(language, 'Assembly & Lead Screw (DIN 103)', 'Montaj & Dişli Mili (DIN 103)')
                                        : stdSpec.family === 'acme'
                                        ? t12(language, 'Assembly & Acme Screw (ASME B1.5)', 'Montaj & Acme Mili (ASME B1.5)')
                                        : t12(language, 'Assembly & Torque (VDI 2230)', 'Montaj & Tork (VDI 2230)')}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('threads')}
                                className={`flex items-center gap-2 px-3.5 py-2 min-h-[42px] rounded-lg text-xs font-semibold transition-all ${
                                    activeTab === 'threads'
                                        ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/40 shadow-sm'
                                        : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
                                }`}
                            >
                                <Layers size={14} className={activeTab === 'threads' ? 'text-[var(--cyan)]' : 'text-[var(--muted)]'} />
                                <span>{t12(language, 'Thread Geometry & 50 Standards', 'Diş Geometrisi & 50 Standart')}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('standards_guide')}
                                className={`flex items-center gap-2 px-3.5 py-2 min-h-[42px] rounded-lg text-xs font-semibold transition-all ${
                                    activeTab === 'standards_guide'
                                        ? 'bg-[var(--warn)]/20 text-[var(--warn)] border border-[var(--warn)]/40 shadow-sm'
                                        : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
                                }`}
                            >
                                <BookOpen size={14} className={activeTab === 'standards_guide' ? 'text-[var(--warn)]' : 'text-[var(--muted)]'} />
                                <span>{t12(language, '2D Standards Guide (Inpart24)', '2D Standart Kılavuzu (Inpart24)')}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('k_factor_chart')}
                                className={`flex items-center gap-2 px-3.5 py-2 min-h-[42px] rounded-lg text-xs font-semibold transition-all ${
                                    activeTab === 'k_factor_chart'
                                        ? 'bg-[var(--ok)]/20 text-[var(--ok)] border border-[var(--ok)]/40 shadow-sm'
                                        : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
                                }`}
                            >
                                <SlidersHorizontal size={14} className={activeTab === 'k_factor_chart' ? 'text-[var(--ok)]' : 'text-[var(--muted)]'} />
                                <span>{t12(language, 'K-Factor, Reverse Torque & M3–M36 Chart', 'K-Faktörü, Ters Tork & M3–M36 Tablosu')}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('pcd_rivet')}
                                className={`flex items-center gap-2 px-3.5 py-2 min-h-[42px] rounded-lg text-xs font-semibold transition-all ${
                                    activeTab === 'pcd_rivet'
                                        ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/40 shadow-sm'
                                        : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
                                }`}
                            >
                                <Box size={14} className={activeTab === 'pcd_rivet' ? 'text-[var(--cyan)]' : 'text-[var(--muted)]'} />
                                <span>{t12(language, 'Bolt Circle (PCD) & Rivet Sizer', 'Delik Dairesi (PCD) & Perçin/Havşa')}</span>
                            </button>
                        </div>
                    </div>

                    {/* ═══ VDI 2230 Scope Boundary Notice ═══ */}
                    {results.validityStatus === 'OUT_OF_STANDARD_RANGE' && (
                        <div className="rounded-xl border border-[var(--warn)]/40 bg-[var(--warn)]/10 p-3 text-xs font-mono text-[var(--warn)] flex items-start gap-2.5 shadow-lg">
                            <AlertTriangle size={18} className="text-[var(--warn)] shrink-0 mt-0.5" />
                            <div>
                                <div className="font-bold uppercase tracking-wider text-[11px] text-[var(--warn)]">
                                    {t12(language, 'VDI 2230 Scope Advisory: Out of Standard Range', 'VDI 2230 Kapsam Uyarısı: Standart Sınırları Dışında')}
                                </div>
                                <p className="mt-0.5 text-[11.5px] text-[var(--ink)] leading-relaxed font-sans">
                                    {results.validityWarning || t12(
                                        language,
                                        `Bolt nominal diameter d = ${results.d_nom} mm is outside standard scope (4 mm ≤ d ≤ 39 mm). Calculations are extrapolated deterministically; engineering verification is recommended.`,
                                        `Cıvata anma çapı d = ${results.d_nom} mm standart kapsamının (4 mm ≤ d ≤ 39 mm) dışındadır. Sonuçlar deterministik ekstrapolasyon ile hesaplanmıştır; mühendislik denetimi önerilir.`
                                    )}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ═══ TAB 1: ASSEMBLY & TORQUE (VDI 2230) ═══ */}
                    {activeTab === 'assembly' && (
                        <div className="flex flex-col min-[1800px]:flex-row gap-4 flex-1 min-h-0">
                            {/* ═══ CENTER: FASTENER TECHNICAL DRAWING (ORTA: GÖRÜNTÜ) ═══ */}
                            <div className="flex-1 min-w-0 min-[1800px]:min-h-0 flex flex-col gap-3">
                                <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-1)]">
                                    <FastenerTechnicalDrawing
                                        results={results}
                                        size={size}
                                        length={length}
                                        lang={language}
                                        highlightedField={focusedFieldId}
                                    />
                                </div>
                            </div>

                            {/* ═══ RIGHT: OUTPUTS & TELEMETRY (SAĞ: ÇIKTILAR) ═══ */}
                            <div className="w-full min-[1800px]:w-[440px] shrink-0 flex flex-col gap-3">
                                {/* ═══ Global Verdict Badge (4-State VDI 2230 Diagnostic) ═══ */}
                                <VerdictBadge
                                    status={verdictStatus}
                                    maxUtilization={maxUtilization}
                                    weakestLinkText={
                                        etaPressure > etaYield && etaPressure > etaTensile && etaPressure > 1.0
                                            ? t12(language, `Bearing surface crushing (pM=${formatEngineeringValue(pM, 0)} > ${pG_zul} MPa)`, `Kafa altı ezilme aşımı (pM=${formatEngineeringValue(pM, 0)} > ${pG_zul} MPa)`)
                                            : maxUtilization > 1.0
                                            ? t12(language, `Yield exceeded (σeq=${formatEngineeringValue(sigmaEq, precision)} > ${formatEngineeringValue(capacityStress, precision)} MPa)`, `Akma aşıldı (σeq=${formatEngineeringValue(sigmaEq, precision)} > ${formatEngineeringValue(capacityStress, precision)} MPa)`)
                                            : t12(language, `Equiv. stress: ${formatEngineeringValue(sigmaEq, precision)} MPa (Safety n=${formatEngineeringValue(safetyYield, 2)})`, `Bileşik gerilme: ${formatEngineeringValue(sigmaEq, precision)} MPa (Emniyet n=${formatEngineeringValue(safetyYield, 2)})`)
                                    }
                                    standardCitation="VDI 2230 §5.3 / ISO 898-1"
                                />

                                {/* ═══ Primary Readouts: Tightening Torque & Preload Force ═══ */}
                                <div className="grid grid-cols-2 gap-2">
                                    <Kpi
                                        label={t.tighteningTorque || 'Torque MA'}
                                        value={formatEngineeringValue(MA, precision)}
                                        unit="N·m"
                                        subtitle={t12(lang, `Useful: ${formatEngineeringValue(M1, precision)} N·m (${((M1 / (MA || 1)) * 100).toFixed(0)}%)`, `Faydalı: ${formatEngineeringValue(M1, precision)} N·m (%${((M1 / (MA || 1)) * 100).toFixed(0)})`)}
                                        highlight
                                    />
                                    <Kpi
                                        label={t.preloadForce || 'Preload Fm'}
                                        value={formatEngineeringValue(Fm, precision)}
                                        unit="kN"
                                        subtitle={t12(lang, `Fm,min: ${formatEngineeringValue(FmMin, precision)} kN (αA=${alphaA})`, `Fm,min: ${formatEngineeringValue(FmMin, precision)} kN (αA=${alphaA})`)}
                                    />
                                </div>

                                {/* ═══ Simultaneous Multi-Unit Readout Strip (SI + Imperial + Equiv. K-Factor) ═══ */}
                                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)] px-3 py-2 font-mono text-[10px] space-y-1.5">
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-[var(--ink)]">
                                        <span className="text-[var(--muted)] uppercase font-bold">Torque (MA):</span>
                                        <span className="text-[var(--cyan)] font-bold">{(MA * 0.737562).toFixed(1)} lbf·ft</span>
                                        <span className="text-[var(--line)]">·</span>
                                        <span className="text-[var(--ink)]">{(MA * 8.85075).toFixed(0)} lbf·in</span>
                                        <span className="text-[var(--line)]">·</span>
                                        <span className="text-[var(--alu-dim)]">{(MA * 0.101972).toFixed(2)} kgf·m</span>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-[var(--ink)] border-t border-[var(--line)] pt-1">
                                        <span className="text-[var(--muted)] uppercase font-bold">Preload (Fm):</span>
                                        <span className="text-[var(--ok)] font-bold">{(Fm * 224.809).toFixed(0)} lbf</span>
                                        <span className="text-[var(--line)]">·</span>
                                        <span className="text-[var(--ink)]">{(Fm * 1000).toFixed(0)} N</span>
                                        <span className="text-[var(--line)]">·</span>
                                        <span className="text-[var(--warn)] font-bold" title="Equivalent Nut Factor K = MA / (Fm · d)">
                                            K<sub>eq</sub> = {(Fm > 0 && (results.d_nom || customDia) > 0 ? MA / (Fm * (results.d_nom || customDia)) : 0.18).toFixed(3)}
                                        </span>
                                    </div>
                                </div>

                                {/* ═══ Actionable Engineering Advice Card ═══ */}
                                <div className={`p-3 rounded-[var(--radius-s)] border text-xs font-mono space-y-1.5 ${
                                    surfaceSafety < 1.0 || maxUtilization > 1.0
                                        ? 'bg-[var(--bad)]/10 border-[var(--bad)]/40 text-[var(--bad)]'
                                        : maxUtilization > 0.85
                                        ? 'bg-[var(--warn)]/10 border-[var(--warn)]/40 text-[var(--warn)]'
                                        : 'bg-[var(--ok)]/10 border-[var(--ok)]/40 text-[var(--ok)]'
                                }`}>
                                    <div className="font-bold flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                                        <Zap size={13} className="shrink-0" />
                                        <span>{t12(language, 'VDI 2230 Recommendation', 'VDI 2230 Mühendislik Tavsiyesi')}</span>
                                    </div>
                                    <p className="font-sans text-[11px] leading-relaxed text-[var(--ink)]">
                                        {surfaceSafety < 1.0
                                            ? t12(
                                                language,
                                                `Bearing surface crushing risk! Underhead pressure pM (${formatEngineeringValue(pM, 0)} MPa) exceeds limit (${pG_zul} MPa) for ${results.clampedMaterialName}. Add ISO 7089 hardened washer (200-300 HV) or switch to Flange Hex Bolt (DIN 6921).`,
                                                `Kafa altı ezilme riski! Yüzey basıncı pM (${formatEngineeringValue(pM, 0)} MPa), ${results.clampedMaterialName} için izin verilen sınırı (${pG_zul} MPa) aşıyor. ISO 7089 sertleştirilmiş pul ekleyin veya DIN 6921 Flanşlı Cıvata seçin.`
                                            )
                                            : maxUtilization > 1.0
                                            ? t12(
                                                language,
                                                `Yield capacity exceeded! Increase bolt size from ${size} to next increment or upgrade strength class from ${grade} to 10.9/12.9 to maintain elastic integrity.`,
                                                `Akma kapasitesi aşıldı! Elastik bütünlüğü korumak için cıvata çapını (${size}) bir üst boyuta büyütün veya mukavemet sınıfını (${grade}) 10.9/12.9'a yükseltin.`
                                            )
                                            : maxUtilization > 0.85
                                            ? t12(
                                                language,
                                                `High utilization (${(maxUtilization * 100).toFixed(0)}%). For dynamic transverse fatigue or thermal expansion, consider torque-angle tightening or increasing clamp length.`,
                                                `Yüksek kullanım oranı (%${(maxUtilization * 100).toFixed(0)}). Dinamik enine yorulma veya sıcaklık farkı varsa tork-açı yöntemini veya kavrama boyunu artırmayı değerlendirin.`
                                            )
                                            : t12(
                                                language,
                                                `Optimum preloading state. Preload FM=${formatEngineeringValue(Fm, 1)} kN is within verified VDI 2230 elastic limit with safety margin n=${formatEngineeringValue(safetyYield, 2)}.`,
                                                `Optimum ön gerilme durumu. FM=${formatEngineeringValue(Fm, 1)} kN montaj ön yükü, n=${formatEngineeringValue(safetyYield, 2)} emniyet katsayısı ile VDI 2230 elastik sınırları içindedir.`
                                            )}
                                    </p>
                                </div>

                                {/* ═══ Secondary Limit State KPI Cards ═══ */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className={`rounded-xl border p-3 sm:p-4 transition-colors ${
                                        surfaceSafety < 1.0 ? 'border-[var(--bad)]/40 bg-[var(--bad)]/10' : 'border-[var(--line)] bg-[var(--bg-1)]'
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
                                                {t12(language, 'Surface Pressure pM', 'Yüzey Basıncı pM')}
                                            </div>
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                                                surfaceSafety < 1.0 ? 'bg-[var(--bad)]/30 text-[var(--bad)]' : 'bg-[var(--ok)]/20 text-[var(--ok)]'
                                            }`}>
                                                SP = {formatEngineeringValue(surfaceSafety, 2)}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex items-baseline gap-1.5">
                                            <span className="text-2xl font-bold tabular-nums text-[var(--ink)] sm:text-3xl">
                                                {formatEngineeringValue(pM, 0)}
                                            </span>
                                            <span className="text-[11px] text-[var(--muted)] font-mono">MPa</span>
                                        </div>
                                        <div className="mt-0.5 font-mono text-[9px] text-[var(--muted)] truncate">
                                            limit {pG_zul} MPa ({results.clampedMaterialName || 'S235'})
                                        </div>
                                    </div>
                                    <div className={`rounded-xl border p-3 sm:p-4 transition-colors ${
                                        strippingSafety < 1.0 ? 'border-[var(--bad)]/40 bg-[var(--bad)]/10' : 'border-[var(--line)] bg-[var(--bg-1)]'
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
                                                {t12(language, 'Thread Stripping', 'Diş Sıyırma')}
                                            </div>
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                                                strippingSafety < 1.0 ? 'bg-[var(--bad)]/30 text-[var(--bad)]' : 'bg-[var(--cyan)]/20 text-[var(--cyan)]'
                                            }`}>
                                                S = {formatEngineeringValue(strippingSafety, 2)}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex items-baseline gap-1.5">
                                            <span className="text-2xl font-bold tabular-nums text-[var(--ink)] sm:text-3xl">
                                                {formatEngineeringValue(mCrit, 1)}
                                            </span>
                                            <span className="text-[11px] text-[var(--muted)] font-mono">mm</span>
                                        </div>
                                        <div className="mt-0.5 font-mono text-[9px] text-[var(--muted)] truncate">
                                            {t12(language, `min. engagement mcrit · nut m = ${formatEngineeringValue(results.nutDim.height || results.d_nom, 1)} mm`, `min. kavrama mcrit · somun m = ${formatEngineeringValue(results.nutDim.height || results.d_nom, 1)} mm`)}
                                        </div>
                                    </div>
                                </div>

                                {/* ═══ 3-Component Torque Breakdown Stacked Bar (VDI 2230 §5.4.2) ═══ */}
                                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)] p-3 space-y-2">
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                                        <span>{t12(language, '3-Component Torque Breakdown', '3-Bileşenli Tork Dağılımı')}</span>
                                        <span className="font-mono text-[var(--cyan)]">MA = {formatEngineeringValue(MA, precision)} N·m</span>
                                    </div>
                                    <div className="h-2.5 w-full rounded-full bg-[var(--line)]/20 overflow-hidden flex">
                                        <div style={{ width: `${Math.max(2, (M1 / (MA || 1)) * 100).toFixed(1)}%` }} className="bg-[var(--ok)] h-full transition-all" title={`M1 (Lead): ${M1.toFixed(1)} N·m`} />
                                        <div style={{ width: `${Math.max(2, (M2 / (MA || 1)) * 100).toFixed(1)}%` }} className="bg-[var(--warn)] h-full transition-all" title={`M2 (Thread Friction): ${M2.toFixed(1)} N·m`} />
                                        <div style={{ width: `${Math.max(2, (M3 / (MA || 1)) * 100).toFixed(1)}%` }} className="bg-[var(--cyan)] h-full transition-all" title={`M3 (Head Friction): ${M3.toFixed(1)} N·m`} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 pt-0.5 text-[10px] font-mono">
                                        <div className="rounded border border-[var(--ok)]/20 bg-[var(--ok)]/5 p-1.5">
                                            <div className="flex items-center gap-1 text-[var(--ok)] font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]" />
                                                <span>M₁ {((M1 / (MA || 1)) * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="text-[var(--ink)] font-bold mt-0.5 truncate">{formatEngineeringValue(M1, 1)} N·m</div>
                                            <div className="text-[8.5px] text-[var(--muted)] truncate">{t12(language, 'Pitch stretch', 'Paso uzama')}</div>
                                        </div>
                                        <div className="rounded border border-[var(--warn)]/20 bg-[var(--warn)]/5 p-1.5">
                                            <div className="flex items-center gap-1 text-[var(--warn)] font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)]" />
                                                <span>M₂ {((M2 / (MA || 1)) * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="text-[var(--ink)] font-bold mt-0.5 truncate">{formatEngineeringValue(M2, 1)} N·m</div>
                                            <div className="text-[8.5px] text-[var(--muted)] truncate">{t12(language, 'Thread μ', 'Diş sürtünme')}</div>
                                        </div>
                                        <div className="rounded border border-[var(--cyan)]/20 bg-[var(--cyan)]/5 p-1.5">
                                            <div className="flex items-center gap-1 text-[var(--cyan)] font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)]" />
                                                <span>M₃ {((M3 / (MA || 1)) * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="text-[var(--ink)] font-bold mt-0.5 truncate">{formatEngineeringValue(M3, 1)} N·m</div>
                                            <div className="text-[8.5px] text-[var(--muted)] truncate">{t12(language, 'Head μ', 'Kafa sürtünme')}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-1 border-t border-[var(--line)] text-[9.5px] font-mono text-[var(--muted)]">
                                        <span>{t12(language, 'VDI 2230 Decomposition:', 'VDI 2230 Ayrışımı:')}</span>
                                        <span className="text-[var(--ink)]">
                                            <strong className="text-[var(--warn)]">MG</strong> (M₁+M₂) = {formatEngineeringValue(results.MG ?? (M1 + M2), precision)} N·m · <strong className="text-[var(--cyan)]">MK</strong> (M₃) = {formatEngineeringValue(results.MK ?? M3, precision)} N·m
                                        </span>
                                    </div>
                                </div>

                                {/* ═══ VDI 2230 Active Assumptions & Friction Scatter Range ═══ */}
                                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)] p-3 space-y-2.5">
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--alu-dim)]">
                                        <div className="flex items-center gap-1.5 text-[var(--cyan)]">
                                            <SlidersHorizontal size={12} />
                                            <span>{t12(language, 'Active Assumptions & Friction Scatter', 'Aktif Varsayımlar & Sürtünme Dağılımı')}</span>
                                        </div>
                                        <span className="text-[9px] font-mono text-[var(--muted)]">VDI 2230 §5.4 / ISO 898</span>
                                    </div>

                                    {/* Friction Range Box */}
                                    {results.frictionRangeAnalysis && (
                                        <div className="p-2 rounded-lg bg-[var(--bg-2)] border border-[var(--line)] text-[11px] font-mono space-y-1">
                                            <div className="flex items-center justify-between text-[var(--alu)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Friction Range Scatter', 'Sürtünme Dağılım Aralığı')}:</span>
                                                <span className="text-[var(--cyan)] font-bold">µ = {results.frictionRangeAnalysis.muMin} .. {results.frictionRangeAnalysis.muMax}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                                                <div className="bg-[var(--ok)]/10 border border-[var(--ok)]/20 rounded p-1.5">
                                                    <span className="text-[var(--alu-dim)] block text-[9px]">FM,max (µ={results.frictionRangeAnalysis.muMin}):</span>
                                                    <span className="font-bold text-[var(--ok)] tabular-nums">{formatEngineeringValue(results.frictionRangeAnalysis.FM_max_kN, 1)} kN</span>
                                                </div>
                                                <div className="bg-[var(--warn)]/10 border border-[var(--warn)]/20 rounded p-1.5">
                                                    <span className="text-[var(--alu-dim)] block text-[9px]">FM,min (µ={results.frictionRangeAnalysis.muMax}):</span>
                                                    <span className="font-bold text-[var(--warn)] tabular-nums">{formatEngineeringValue(results.frictionRangeAnalysis.FM_min_kN, 1)} kN</span>
                                                </div>
                                            </div>
                                            <div className="text-[9px] text-[var(--alu-dim)] pt-0.5">
                                                {t12(
                                                    language,
                                                    `Same torque MA, friction ±0.03 around the input. Scatter FM,max/FM,min = ${results.frictionRangeAnalysis.scatterRatio}.${results.frictionRangeAnalysis.FM_max_kN * 1000 / Math.max(1, As) > Sy ? ' At low friction the bolt would exceed Rp0.2.' : ''}`,
                                                    `Aynı tork MA, sürtünme girdinin ±0.03 çevresinde. Dağılım FM,max/FM,min = ${results.frictionRangeAnalysis.scatterRatio}.${results.frictionRangeAnalysis.FM_max_kN * 1000 / Math.max(1, As) > Sy ? ' Düşük sürtünmede cıvata Rp0.2 sınırını aşar.' : ''}`
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Assumptions Table */}
                                    {results.assumptionsLedger && results.assumptionsLedger.length > 0 && (
                                        <details className="text-[10px] font-mono group">
                                            <summary className="cursor-pointer text-[var(--alu-dim)] hover:text-[var(--ink)] flex items-center justify-between py-1 border-t border-[var(--line)]">
                                                <span>{t12(language, 'View Methodological Assumptions', 'Metodolojik Varsayımları Görüntüle')}</span>
                                                <span className="text-[9px] text-[var(--cyan)] group-open:rotate-180 transition-transform">▼</span>
                                            </summary>
                                            <div className="space-y-1.5 pt-2">
                                                {results.assumptionsLedger.map((asm) => (
                                                    <div key={asm.id} className="p-1.5 rounded bg-[var(--line)]/5 border border-[var(--line)] flex items-center justify-between">
                                                        <div>
                                                            <span className="font-semibold text-[var(--ink)] block">{asm.name}</span>
                                                            <span className="text-[8.5px] text-[var(--muted)]">{asm.source}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-bold text-[var(--cyan)] tabular-nums">{String(asm.value)}</span>
                                                            <span className="block text-[8.5px] text-[var(--muted)]">{asm.sensitivity}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    )}
                                </div>

                                {/* ═══ DIN 974-1 Counterbore Callout (if available for socket head / countersunk) ═══ */}
                                {results.headDim?.cbDia && results.headDim?.cbDepth && (
                                    <div className="rounded-xl border border-[var(--cyan)]/30 bg-[var(--cyan)]/10 p-2.5 flex items-center justify-between">
                                        <div>
                                            <div className="text-[9.5px] font-bold uppercase tracking-wider text-[var(--cyan)] font-mono">
                                                DIN 974-1 {t12(language, 'Counterbore', 'Havşa / Silindirik Yuva')}
                                            </div>
                                            <div className="text-xs font-mono text-[var(--ink)] font-semibold mt-0.5">
                                                Ød₁ = {results.dh} mm ({t12(language, 'hole', 'delik')}) · Ød₂ = {results.headDim.cbDia} mm ({t12(language, 'bore', 'yuva')}) · t = {results.headDim.cbDepth} mm
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-mono font-bold text-[var(--cyan)] bg-[var(--cyan)]/10 px-2 py-1 rounded">
                                            t = {results.headDim.cbDepth} mm
                                        </span>
                                    </div>
                                )}

                                {/* ═══ Limit State Capacity Margin Bars (Eurocode / FEA Standard) ═══ */}
                                <div className="space-y-2">
                                    {limitMetrics.map((metric) => (
                                        <SafetyMarginBar key={metric.id} metric={metric} />
                                    ))}
                                </div>

                                {/* ═══ Always-visible CAD / manufacturing data (not hover-gated) ═══ */}
                                <div className="rounded-xl border border-[var(--cyan)]/20 bg-[var(--bg-1)] p-3 sm:p-3.5">
                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--cyan)]">
                                                {t.mfgDimensions || 'CAD / Manufacturing Dimensions'}
                                            </div>
                                            <p className="mt-0.5 font-mono text-[10px] text-[var(--muted)]">
                                                {size} × {formatEngineeringValue(length, 0)} mm · {grade} · {stdSpec.boltCurrent} / {stdSpec.nutStandard}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={copySummary}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--alu-dim)] hover:border-[var(--cyan)] hover:text-[var(--ink)] cursor-pointer"
                                        >
                                            {copied ? <Check size={12} className="text-[var(--ok)]" /> : <Copy size={12} />}
                                            {copied ? t12(lang, 'Copied', 'Kopyalandı') : t12(lang, 'Copy CAD data', 'CAD verisini kopyala')}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                        {designRows.map((row) => (
                                            <div key={row.key} className="rounded-lg border border-[var(--line)] bg-[var(--bg-1)] px-2.5 py-2 min-w-0 hover:border-[var(--cyan)]/40 transition-colors" title={`${row.key} (${row.label}): ${row.val}`}>
                                                <div className="flex items-baseline justify-between gap-1">
                                                    <span className="font-mono text-[11px] font-bold text-[var(--cyan)]">{row.key}</span>
                                                    <span className="truncate text-[10.5px] text-[var(--muted)] font-medium">{row.label}</span>
                                                </div>
                                                <div className="mt-1 font-mono text-[13px] sm:text-[14px] font-bold tabular-nums text-[var(--ink)] tracking-tight">{row.val}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ TAB 2: THREAD GEOMETRY & 50 STANDARDS (WITH 3D EXPORT) ═══ */}
                    {activeTab === 'threads' && (
                        <div className="flex flex-col gap-3">
                            <ThreadVisualizer
                                type={mappedThreadType}
                                pitch={results.pitchVal || pitch}
                                majorDia={results.d_nom || customDia}
                                tapDrill={results.tapDrill}
                                onSelectPreset={handlePresetSelect}
                            />
                        </div>
                    )}

                    {/* ═══ TAB 3: 2D STANDARDS GUIDE (INPART24 BLUEPRINT ATLAS) ═══ */}
                    {activeTab === 'standards_guide' && (
                        <div className="flex flex-col gap-3">
                            <ThreadStandardsGuide
                                currentType={mappedThreadType}
                                nominalDia={results.d_nom || customDia}
                                pitch={results.pitchVal || pitch}
                            />
                        </div>
                    )}

                    {/* ═══ TAB 4: K-FACTOR, REVERSE TORQUE & M3–M36 QUICK CHART ═══ */}
                    {activeTab === 'k_factor_chart' && (
                        <BoltTorqueOmniSuite
                            mode="k_factor_chart"
                            language={language}
                            currentNominalDiaMm={results.d_nom || customDia}
                            currentPreloadKn={Fm}
                            currentTorqueNm={MA}
                            onApplyBoltPreset={(newSize, newGrade, newMu) => {
                                setThreadStandard('Metric Coarse');
                                setSize(newSize);
                                setGrade(newGrade);
                                setMuThread(newMu);
                                setMuHead(newMu);
                                setActiveTab('assembly');
                            }}
                        />
                    )}

                    {/* ═══ TAB 5: BOLT CIRCLE (PCD), COUNTERSINK & RIVET SIZER ═══ */}
                    {activeTab === 'pcd_rivet' && (
                        <BoltTorqueOmniSuite
                            mode="pcd_rivet"
                            language={language}
                            currentNominalDiaMm={results.d_nom || customDia}
                            currentPreloadKn={Fm}
                            currentTorqueNm={MA}
                            onApplyBoltPreset={(newSize, newGrade, newMu) => {
                                setThreadStandard('Metric Coarse');
                                setSize(newSize);
                                setGrade(newGrade);
                                setMuThread(newMu);
                                setMuHead(newMu);
                                setActiveTab('assembly');
                            }}
                        />
                    )}
                </div>
            </WorkbenchResults>

            {/* ═══ MOBILE STICKY CRITICAL RESULT SUMMARY (< lg) ═══ */}
            {activeTab === 'assembly' && (
                <div className="block lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-1)] border-t border-[var(--line)] px-4 py-2.5 shadow-2xl">
                    <div className="flex items-center justify-between gap-3 font-mono">
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                verdictStatus === 'PASS'
                                    ? 'bg-[var(--ok)]/20 text-[var(--ok)] border border-[var(--ok)]/30'
                                    : verdictStatus === 'WARN'
                                    ? 'bg-[var(--warn)]/20 text-[var(--warn)] border border-[var(--warn)]/30'
                                    : 'bg-[var(--bad)]/20 text-[var(--bad)] border border-[var(--bad)]/30'
                            }`}>
                                {verdictStatus}
                            </span>
                            <span className="text-xs text-[var(--ink)] font-bold">
                                η: {(maxUtilization * 100).toFixed(0)}%
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            <div>
                                <span className="text-[10px] text-[var(--muted)] mr-1">MA:</span>
                                <span className="font-bold text-[var(--cyan)]">{formatEngineeringValue(MA, 1)} N·m</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-[var(--muted)] mr-1">Fm:</span>
                                <span className="font-bold text-[var(--ink)]">{formatEngineeringValue(Fm, 1)} kN</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </CalculatorWorkbench>
    );
}

function Kpi({ label, value, unit, subtitle, highlight }: { label: string; value: string; unit?: string; subtitle?: string; highlight?: boolean }) {
    return (
        <div className={`rounded-xl border p-3 sm:p-4 transition-colors ${
            highlight
                ? 'border-[var(--cyan)]/40 bg-[var(--cyan)]/10 '
                : 'border-[var(--line)] bg-[var(--bg-1)]'
        }`}>
            <div className={`text-[9px] font-bold uppercase tracking-wider ${highlight ? 'text-[var(--cyan)] font-semibold' : 'text-[var(--muted)]'}`}>{label}</div>
            <div className="mt-1 flex items-baseline gap-1.5">
                <span className={`text-2xl font-bold tabular-nums sm:text-3xl ${highlight ? 'text-[var(--cyan)]' : 'text-[var(--ink)]'}`}>{value}</span>
                {unit && <span className={`text-[11px] font-mono ${highlight ? 'text-[var(--cyan-dim)]' : 'text-[var(--muted)]'}`}>{unit}</span>}
            </div>
            {subtitle && <div className="mt-0.5 font-mono text-[9px] text-[var(--muted)]">{subtitle}</div>}
        </div>
    );
}
