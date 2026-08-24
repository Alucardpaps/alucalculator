'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Info, RotateCcw, Wrench } from 'lucide-react';
import { THREAD_STANDARDS } from '@/data/boltNutStandards';
import {
    computeBoltAssembly,
    parseFastenerSearchParams,
    TORQUE_STANDARDS_LIST,
    type TorquePageStandard,
} from '@/lib/fastener/sharedEngine';
import { FastenerInteractiveSchematic } from './FastenerInteractiveSchematic';
import { FastenerTechnicalDrawing } from './FastenerTechnicalDrawing';
import { useI18nStore } from '@/store/i18nStore';
import { getFastenerAssemblyStrings } from '@/locales/fastenerAssemblyUiTranslations';
import {
    CalculatorWorkbench,
    WorkbenchField,
    WorkbenchInfo,
    WorkbenchInputs,
    WorkbenchResults,
    WorkbenchSection,
    WorkbenchSlider,
    workbenchSelectClass,
} from '@/components/ui/workbench';

export default function FastenerAssemblyModule() {
    const { language } = useI18nStore();
    const t = getFastenerAssemblyStrings(language);
    const isTr = language === 'tr';

    const [threadStandard, setThreadStandard] = useState<TorquePageStandard>('Metric Coarse');
    const [size, setSize] = useState('M12');
    const [customDia, setCustomDia] = useState(12);
    const [pitch, setPitch] = useState(1.75);
    const [grade, setGrade] = useState('8.8');
    const [length, setLength] = useState(50);
    const [muThread, setMuThread] = useState(0.14);
    const [muHead, setMuHead] = useState(0.14);
    const [yieldUtilization, setYieldUtilization] = useState(70);
    const [useProof, setUseProof] = useState(true);
    const [tab, setTab] = useState<'geometry' | 'assembly' | 'k' | 'notes'>('geometry');

    useEffect(() => {
        const search = window.location.search.startsWith('?') ? window.location.search.slice(1) : window.location.search;
        const { standard, size: qsSize, grade: qsGrade } = parseFastenerSearchParams(search);
        if (standard && (TORQUE_STANDARDS_LIST as string[]).includes(standard)) setThreadStandard(standard as TorquePageStandard);
        if (qsSize) setSize(qsSize);
        if (qsGrade) setGrade(qsGrade);
    }, []);

    useEffect(() => {
        if (threadStandard === 'Custom') return;
        const available = THREAD_STANDARDS.filter((row) => row.type === threadStandard).map((row) => row.size);
        if (available.length && !available.includes(size)) setSize(available[0]);
    }, [threadStandard, size]);

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
            }),
        [threadStandard, size, customDia, pitch, grade, muThread, muHead, yieldUtilization, useProof],
    );

    const sizes = useMemo(
        () => (threadStandard === 'Custom' ? [] : THREAD_STANDARDS.filter((row) => row.type === threadStandard)),
        [threadStandard],
    );

    const kSplit = useMemo(() => {
        const total = results.K1 + results.K2 + results.K3;
        if (total <= 0) return [];
        return [
            { name: t.usefulWork || 'Thread pitch', pct: (results.K1 / total) * 100, k: results.K1 },
            { name: t.threadLoss || 'Thread friction', pct: (results.K2 / total) * 100, k: results.K2 },
            { name: t.underheadLoss || 'Underhead', pct: (results.K3 / total) * 100, k: results.K3 },
        ];
    }, [results, t]);

    const ok = yieldUtilization <= 90 && results.safety >= 1.05;
    const labels = {
        partHead: t.partHead,
        partShank: t.partShank,
        partThread: t.partThread,
        partNut: t.partNut,
        partWasher: t.partWasher,
        plateA: t.plateA,
        plateB: t.plateB,
        gripZone: t.gripZone,
        clearance: t.clearance,
    };

    const reset = () => {
        setThreadStandard('Metric Coarse');
        setSize('M12');
        setGrade('8.8');
        setMuThread(0.14);
        setMuHead(0.14);
        setYieldUtilization(70);
        setLength(50);
        setUseProof(true);
    };

    return (
        <CalculatorWorkbench>
            <WorkbenchInputs
                title={isTr ? 'Cıvata Torku' : 'Bolt Torque'}
                subtitle="VDI 2230 · ISO 898-1"
                icon={<Wrench size={18} className="text-[#6b9fff]" />}
                accent="blue"
            >
                <WorkbenchSection title={t.threadStandard || 'Thread'}>
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
                                {sizes.map((row) => (
                                    <option key={row.size} value={row.size}>
                                        {row.size}{row.pitch ? ` · P=${row.pitch} mm` : row.tpi ? ` · ${row.tpi} TPI` : ''} (Ø{row.diameter} mm)
                                    </option>
                                ))}
                            </select>
                        </WorkbenchField>
                    )}
                    <WorkbenchSlider label={t.length || 'Length L'} value={length} min={10} max={300} step={5} unit="mm" onChange={setLength} />
                </WorkbenchSection>

                <WorkbenchSection title={t.grade || 'Property class'}>
                    <div className="grid grid-cols-3 gap-2">
                        {['8.8', '10.9', '12.9'].map((g) => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setGrade(g)}
                                className={`rounded-lg border py-2 text-xs font-bold transition-colors ${
                                    grade === g ? 'border-[#6b9fff]/50 bg-[#6b9fff]/15 text-[#9bbdff]' : 'border-white/10 bg-white/[0.02] text-white/40 hover:text-white/70'
                                }`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                    <WorkbenchSlider
                        label={useProof ? (isTr ? 'Proof kullanım v (% Sp)' : 'Proof utilization v (% Sp)') : (isTr ? 'Akma kullanım v (% Sy)' : 'Yield utilization v (% Sy)')}
                        value={yieldUtilization}
                        min={40}
                        max={100}
                        step={5}
                        unit="%"
                        onChange={setYieldUtilization}
                    />
                    <label className="flex cursor-pointer items-center gap-2 text-[11px] text-white/50">
                        <input type="checkbox" checked={useProof} onChange={(e) => setUseProof(e.target.checked)} className="accent-[#6b9fff]" />
                        {isTr ? 'Önyük için Sp (proof) kullan — tablo uyumlu' : 'Use Sp (proof) for preload — table-aligned'}
                    </label>
                </WorkbenchSection>

                <WorkbenchSection title={isTr ? 'Sürtünme' : 'Friction'}>
                    <WorkbenchSlider label={t.threadFriction || 'μG thread'} value={muThread} min={0.05} max={0.3} step={0.01} onChange={setMuThread} />
                    <WorkbenchSlider label={t.headFriction || 'μK underhead'} value={muHead} min={0.05} max={0.3} step={0.01} onChange={setMuHead} />
                    <p className="text-[10px] leading-relaxed text-white/30">
                        {isTr ? 'Kuru ≈ 0.12–0.18 · Yağlı ≈ 0.08–0.12 · Kaplamalı değişir' : 'Dry ≈ 0.12–0.18 · Lubed ≈ 0.08–0.12 · Coatings vary'}
                    </p>
                </WorkbenchSection>

                <div className="border-t border-white/5 pt-3">
                    <button type="button" onClick={reset} className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 text-[11px] font-semibold text-white/60 transition-colors hover:border-white/20 hover:text-white">
                        <span>M12 · 8.8 · μ=0.14 · v=70%</span>
                        <RotateCcw size={13} />
                    </button>
                </div>
            </WorkbenchInputs>

            <WorkbenchResults>
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4 lg:p-5">
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                        <Kpi label={t.tighteningTorque || 'Torque MA'} value={results.MA.toFixed(1)} unit="N·m" />
                        <Kpi label={t.preloadForce || 'Preload Fm'} value={results.Fm_max.toFixed(1)} unit="kN" />
                        <Kpi label="Nut factor K" value={results.K.toFixed(3)} />
                        <div className="rounded-xl border border-white/[0.08] bg-[#0c0f16] p-3 sm:p-4">
                            <div className="text-[9px] font-bold uppercase tracking-wider text-white/35">{useProof ? 'Sp / Sy' : 'Sy'}</div>
                            <div className="mt-1 flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold tabular-nums text-white sm:text-3xl">{useProof ? results.Sp : results.Sy}</span>
                                <span className="text-[11px] text-white/35">MPa</span>
                            </div>
                            {useProof && <div className="mt-0.5 font-mono text-[10px] text-white/30">Sy={results.Sy} MPa</div>}
                        </div>
                    </div>

                    <div className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${ok ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/25 bg-amber-500/5'}`}>
                        {ok ? <CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald-400" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />}
                        <div className="min-w-0 text-[12px] leading-relaxed text-white/65">
                            <span className="font-semibold text-white/85">
                                {ok ? (t.structuralIntegrity || 'Within selected utilization') : (t.highStressWarning || 'High utilization — review friction & class')}
                            </span>
                            <span className="text-white/40">
                                {' '}· σ={results.stress.toFixed(0)} MPa · n=Sy/σ={results.safety.toFixed(2)} · As={results.As.toFixed(1)} mm² · {results.geometry.source}
                            </span>
                        </div>
                    </div>

                    {results.warnings.length > 0 && (
                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2 text-[11px] text-amber-200/80">
                            {results.warnings.map((w) => (
                                <div key={w} className="flex gap-1.5">
                                    <Info size={12} className="mt-0.5 shrink-0" />
                                    <span>{w}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0f16]">
                        <div className="flex flex-wrap border-b border-white/[0.06]">
                            {([
                                { id: 'geometry' as const, label: isTr ? 'Ölçüler & diş' : 'Dimensions & thread' },
                                { id: 'assembly' as const, label: isTr ? 'Montaj' : 'Assembly' },
                                { id: 'k' as const, label: isTr ? 'K dağılımı' : 'K split' },
                                { id: 'notes' as const, label: isTr ? 'Formül' : 'Formula' },
                            ]).map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setTab(item.id)}
                                    className={`px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors sm:px-4 ${
                                        tab === item.id ? 'border-b-2 border-[#6b9fff] text-[#9bbdff]' : 'text-white/35 hover:text-white/60'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <div className={tab === 'geometry' ? 'p-0' : 'p-2 sm:p-3'}>
                            {tab === 'geometry' && (
                                <FastenerTechnicalDrawing
                                    results={results}
                                    size={size}
                                    length={length}
                                />
                            )}
                            {tab === 'assembly' && (
                                <div className="h-[280px] sm:h-[300px]">
                                    <FastenerInteractiveSchematic
                                        results={results}
                                        length={length}
                                        yieldUtilization={yieldUtilization}
                                        grade={grade}
                                        size={size}
                                        labels={labels}
                                        isPipe={threadStandard === 'Pipe'}
                                        lang={language}
                                    />
                                </div>
                            )}
                            {tab === 'k' && (
                                <div className="space-y-3 p-2">
                                    <p className="text-[12px] text-white/40">
                                        K = K₁ + K₂ + K₃ = {results.K1.toFixed(4)} + {results.K2.toFixed(4)} + {results.K3.toFixed(4)} ={' '}
                                        <strong className="text-white/80">{results.K.toFixed(4)}</strong>
                                    </p>
                                    {kSplit.map((row) => (
                                        <div key={row.name}>
                                            <div className="mb-1 flex justify-between text-[11px]">
                                                <span className="text-white/50">{row.name}</span>
                                                <span className="font-mono text-white/70">{row.pct.toFixed(0)}% · {row.k.toFixed(4)}</span>
                                            </div>
                                            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                                                <div className="h-full rounded-full bg-[#6b9fff]/70" style={{ width: `${row.pct}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                    <p className="text-[11px] leading-relaxed text-white/30">
                                        MA = K · F₀ · d · 10⁻³ → {results.MA.toFixed(1)} N·m · F₀ = {(1000 * results.Fm_max).toFixed(0)} N · rb = (dw+dh)/4 = {results.rb.toFixed(2)} mm
                                    </p>
                                </div>
                            )}
                            {tab === 'notes' && (
                                <div className="space-y-2 p-2 text-[12px] leading-relaxed text-white/45">
                                    <p className="font-mono text-white/70">F₀ = v · As · {useProof ? 'Sp' : 'Sy'} · MA = K · F₀ · d / 1000</p>
                                    <p>K₁ = 0.159 · P/d · K₂ = 0.577 · μG · d₂/d · K₃ = μK · rb/d · rb = (dw + dh)/4</p>
                                    <p className="font-mono text-[11px] text-white/40">d₂ = d − 0.64952·P · d₁ = d − 1.0825·P · d₃ = d − 1.2269·P · As ≈ 0.7854·(d − 0.9382·P)²</p>
                                    <p>
                                        {isTr
                                            ? 'Tüm geometri bu sayfada: diş profili, kafa (s/e/k), somun, boşluk deliği. Ayrı /fasteners sayfasına gerek yok.'
                                            : 'All geometry lives here: thread profile, head (s/e/k), nut, clearance hole. No separate /fasteners page needed.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <WorkbenchInfo
                        formula="MA = K · F₀ · d · 10⁻³    F₀ = v · As · Sp    K = K₁+K₂+K₃"
                        formulaNote={isTr ? 'VDI 2230 basitleştirilmiş tork + ISO diş geometrisi tek sayfada.' : 'VDI 2230 simplified torque + ISO thread geometry on one page.'}
                        standards={['VDI 2230', 'ISO 898-1', 'ISO 68-1 / 965', 'ISO 273', 'ISO 4017']}
                        assumptions={[
                            isTr ? 'Sürtünme μG = μK sabittir; gerçekte yüzey ve kaplama ile değişir.' : 'Friction μG/μK treated constant; real joints scatter with finish & lube.',
                            isTr ? 'dw kafa temas OD ≈ 0.95·e (pul yok).' : 'dw ≈ 0.95·e under-head bearing OD (no washer).',
                            isTr ? 'Geometri: ISO 68-1 formülleri + ISO 4017 kafa ölçüleri.' : 'Geometry from ISO 68-1 formulas + ISO 4017 head sizes.',
                        ]}
                        links={[{ href: '/academy/how-to-calculate-bolt-torque/', label: 'Academy' }]}
                    />
                </div>
            </WorkbenchResults>
        </CalculatorWorkbench>
    );
}

function Kpi({ label, value, unit }: { label: string; value: string; unit?: string }) {
    return (
        <div className="rounded-xl border border-white/[0.08] bg-[#0c0f16] p-3 sm:p-4">
            <div className="text-[9px] font-bold uppercase tracking-wider text-white/35">{label}</div>
            <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tabular-nums text-white sm:text-3xl">{value}</span>
                {unit && <span className="text-[11px] text-white/35">{unit}</span>}
            </div>
        </div>
    );
}

function Dim({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-white/5 bg-black/30 px-2 py-2">
            <div className="text-[9px] uppercase tracking-wider text-white/35">{label}</div>
            <div className="font-mono text-[12px] text-white">{value}</div>
        </div>
    );
}
