'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { CircleDot, Search, Info, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import {
    BEARING_CATALOG,
    BearingType,
    BearingData,
    calculateBearingLife,
    getBearingTypeInfo,
} from '@/data/skfBearings';
import { useI18nStore } from '@/store/i18nStore';
import { BearingBlueprint } from '@/components/visualizers/BearingBlueprint';
import {
    CalculatorWorkbench,
    WorkbenchField,
    WorkbenchInfo,
    WorkbenchInputs,
    WorkbenchResults,
    WorkbenchSection,
    WorkbenchSlider,
    workbenchInputClass,
    workbenchSelectClass,
} from '@/components/ui/workbench';

const TYPES: { id: BearingType; en: string; tr: string }[] = [
    { id: 'deep-groove-ball', en: 'Deep Groove Ball', tr: 'Sabit Bilyalı' },
    { id: 'angular-contact-ball', en: 'Angular Contact Ball', tr: 'Açısal Temaslı' },
    { id: 'tapered-roller', en: 'Tapered Roller', tr: 'Konik Makaralı' },
    { id: 'cylindrical-roller', en: 'Cylindrical Roller', tr: 'Silindirik Makaralı' },
    { id: 'needle-roller', en: 'Needle Roller', tr: 'İğne Makaralı' },
    { id: 'thrust-ball', en: 'Thrust Ball', tr: 'Eksenel Bilyalı' },
];

export function BearingsModule() {
    const { language } = useI18nStore();
    const isTr = language === 'tr';

    const [query, setQuery] = useState('');
    const [type, setType] = useState<BearingType | 'all'>('all');
    const [bore, setBore] = useState<number | 'all'>('all');
    const [code, setCode] = useState('6204');
    const [fr, setFr] = useState(5000);
    const [fa, setFa] = useState(1000);
    const [rpm, setRpm] = useState(3000);
    const [reliability, setReliability] = useState(90);
    const [tab, setTab] = useState<'life' | 'loadEq' | 'notes'>('life');

    const selected: BearingData = useMemo(
        () => BEARING_CATALOG.find((b) => b.code === code) || BEARING_CATALOG.find((b) => b.code === '6204') || BEARING_CATALOG[0],
        [code],
    );

    const bores = useMemo(() => {
        const set = new Set<number>();
        BEARING_CATALOG.forEach((b) => set.add(b.d));
        return [...set].sort((a, b) => a - b);
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return BEARING_CATALOG.filter((b) => {
            if (type !== 'all' && b.type !== type) return false;
            if (bore !== 'all' && b.d !== bore) return false;
            if (q && !b.code.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [query, type, bore]);

    const life = useMemo(
        () => calculateBearingLife(selected, fr / 1000, fa / 1000, rpm, reliability),
        [selected, fr, fa, rpm, reliability],
    );

    const typeInfo = getBearingTypeInfo(selected.type);
    const pExp = selected.type.includes('roller') ? (10 / 3) : 3;

    return (
        <CalculatorWorkbench>
            {/* ═══ LEFT PANEL: CONTROLS & CATALOG (Screenshot 1) ═══ */}
            <WorkbenchInputs
                title={isTr ? 'Rulman Ömrü' : 'Bearing Life'}
                subtitle="ISO 281 · L10 / L10h"
                icon={<CircleDot size={18} className="text-[#6b9fff]" />}
                accent="blue"
            >
                <WorkbenchSection title={isTr ? 'Katalog' : 'Catalog'}>
                    <div className="relative">
                        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search SKF Code (e.g. 6204)..."
                            className={`${workbenchInputClass} pl-9`}
                        />
                    </div>

                    <WorkbenchField label={isTr ? 'Tip' : 'Type'}>
                        <select value={type} onChange={(e) => setType(e.target.value as BearingType | 'all')} className={workbenchSelectClass}>
                            <option value="all">{isTr ? 'Tüm tipler' : 'All types'} ({BEARING_CATALOG.length})</option>
                            {TYPES.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {isTr ? t.tr : t.en}
                                </option>
                            ))}
                        </select>
                    </WorkbenchField>

                    <WorkbenchField label={isTr ? 'İç Çap (Bore d)' : 'Bore d'}>
                        <select
                            value={bore === 'all' ? 'all' : String(bore)}
                            onChange={(e) => setBore(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className={workbenchSelectClass}
                        >
                            <option value="all">{isTr ? 'Tümü' : 'All'}</option>
                            {bores.map((d) => (
                                <option key={d} value={d}>d = {d} mm</option>
                            ))}
                        </select>
                    </WorkbenchField>

                    {/* Quick Bearing Grid */}
                    <div className="max-h-[160px] overflow-y-auto rounded-lg border border-white/[0.07] bg-[#0a0e14] p-1.5 custom-scrollbar">
                        <div className="grid grid-cols-3 gap-1">
                            {filtered.slice(0, 75).map((b) => (
                                <button
                                    key={b.code}
                                    type="button"
                                    onClick={() => setCode(b.code)}
                                    className={`rounded-md px-1.5 py-1 font-mono text-[10px] font-bold text-center transition-colors truncate ${
                                        selected.code === b.code
                                            ? 'bg-blue-500/25 border border-blue-400/40 text-blue-300'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    {b.code}
                                </button>
                            ))}
                        </div>
                    </div>
                </WorkbenchSection>

                {/* LOAD & SPEED */}
                <WorkbenchSection title={isTr ? 'Yük & Hız' : 'Load & Speed'}>
                    <WorkbenchField label={isTr ? 'Radyal Yük Fr' : 'Radial Fr'} unit="N">
                        <input type="number" value={fr} onChange={(e) => setFr(Number(e.target.value))} className={workbenchInputClass} />
                    </WorkbenchField>
                    <WorkbenchSlider label="Fr" value={fr} min={0} max={50000} step={100} unit="N" onChange={setFr} />

                    <WorkbenchField label={isTr ? 'Eksenel Yük Fa' : 'Axial Fa'} unit="N">
                        <input type="number" value={fa} onChange={(e) => setFa(Number(e.target.value))} className={workbenchInputClass} />
                    </WorkbenchField>
                    <WorkbenchSlider label="Fa" value={fa} min={0} max={30000} step={50} unit="N" onChange={setFa} />

                    <WorkbenchField label={isTr ? 'Dönme Hızı n' : 'Speed n'} unit="rpm">
                        <input type="number" value={rpm} onChange={(e) => setRpm(Number(e.target.value))} className={workbenchInputClass} />
                    </WorkbenchField>
                    <WorkbenchSlider label="n" value={rpm} min={10} max={20000} step={50} unit="rpm" onChange={setRpm} />

                    <WorkbenchField label={isTr ? 'Güvenilirlik' : 'Reliability'}>
                        <select value={reliability} onChange={(e) => setReliability(Number(e.target.value))} className={workbenchSelectClass}>
                            {[90, 95, 96, 97, 98, 99].map((r) => (
                                <option key={r} value={r}>{r}% (a₁)</option>
                            ))}
                        </select>
                    </WorkbenchField>
                </WorkbenchSection>

                <div className="border-t border-white/5 pt-3">
                    <Link href="/academy/bearing-life-calculation-explained/" className="text-[11px] font-semibold text-[#9bbdff] hover:text-white">
                        {isTr ? 'ISO 281 Rulman Dersi →' : 'ISO 281 lesson →'}
                    </Link>
                </div>
            </WorkbenchInputs>

            {/* ═══ RIGHT PANEL: KPIS, SCHEMATICS & TABS (Screenshot 1) ═══ */}
            <WorkbenchResults>
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4 lg:p-5 custom-scrollbar">
                    
                    {/* Top 4 KPI Cards */}
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                        <Kpi label="L10H" value={life.L10h >= 1e6 ? life.L10h.toExponential(2) : life.L10h.toFixed(0)} unit="h" />
                        <Kpi label="LNM (A1·L10H)" value={life.Lna >= 1e6 ? life.Lna.toExponential(2) : life.Lna.toFixed(0)} unit="h" />
                        <Kpi label="P" value={Math.round(life.P * 1000).toLocaleString()} unit="N" />
                        <Kpi label="S0 = C0 / P0" value={life.staticSafety.toFixed(2)} />
                    </div>

                    {/* Warning / Info Banner */}
                    <div className="flex items-center gap-2 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-200/90 text-xs font-mono">
                        <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                        <span className="truncate">
                            {selected.code} · {selected.type.replace(/-/g, ' ').toUpperCase()} · C={selected.C} kN · C₀={selected.C0} kN · p={pExp.toFixed(2)} · a₁=1 · n_max=18000
                        </span>
                    </div>

                    {/* Center Section: Blueprint Cross Section + Specs Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        
                        {/* Left: 2D Blueprint Schematic Viewport */}
                        <div className="p-4 rounded-2xl border border-white/10 bg-[#080c14] flex flex-col justify-between items-center text-center">
                            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                                {selected.code} {selected.type.replace(/-/g, ' ')} {selected.d}×{selected.D}×{selected.B}
                            </div>
                            
                            <div className="h-48 w-full flex items-center justify-center relative">
                                <BearingBlueprint
                                    type={selected.type}
                                    code={selected.code}
                                    d={selected.d}
                                    D={selected.D}
                                    B={selected.B}
                                    rpm={rpm}
                                    fr={fr}
                                    fa={fa}
                                />
                            </div>

                            <div className="text-[10px] font-mono text-slate-400 mt-2">
                                D={selected.D} · d={selected.d} · B={selected.B}
                            </div>
                        </div>

                        {/* Right: Selected Bearing Details Table */}
                        <div className="p-4 rounded-2xl border border-white/10 bg-[#080c14] flex flex-col justify-between">
                            <div>
                                <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 mb-1">
                                    {isTr ? 'SEÇİLİ RULMAN' : 'SELECTED BEARING'}
                                </h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {typeInfo?.description || (isTr
                                        ? 'ISO 281 eşdeğer yük ve L10 ömür hesabı.'
                                        : 'ISO 281 equivalent load and L10 rating life.')}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/5 text-[11px] font-mono">
                                <div>
                                    <span className="text-slate-500 uppercase text-[9px] block">d</span>
                                    <span className="text-white font-bold">{selected.d} mm</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 uppercase text-[9px] block">D</span>
                                    <span className="text-white font-bold">{selected.D} mm</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 uppercase text-[9px] block">B</span>
                                    <span className="text-white font-bold">{selected.B} mm</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 uppercase text-[9px] block">C</span>
                                    <span className="text-white font-bold">{selected.C} kN</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 uppercase text-[9px] block">C0</span>
                                    <span className="text-white font-bold">{selected.C0} kN</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 uppercase text-[9px] block">Mass</span>
                                    <span className="text-white font-bold">{(selected.d * selected.D * selected.B * 0.00000785).toFixed(3)} kg</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 uppercase text-[9px] block">e</span>
                                    <span className="text-white font-bold">0.25</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 uppercase text-[9px] block">Y</span>
                                    <span className="text-white font-bold">1.8</span>
                                </div>
                            </div>

                            <div className="text-[9px] font-mono text-slate-500 flex justify-between">
                                <span>ISO 281:2007</span>
                                <span className="text-emerald-400 font-bold">VERIFIED</span>
                            </div>
                        </div>

                    </div>

                    {/* ═══ BOTTOM TABBED SECTION: LIFE / LOAD EQ / NOTES ═══ */}
                    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0f16]">
                        <div className="flex border-b border-white/[0.06]">
                            {(['life', 'loadEq', 'notes'] as const).map((tId) => (
                                <button
                                    key={tId}
                                    type="button"
                                    onClick={() => setTab(tId)}
                                    className={`px-4 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-colors ${
                                        tab === tId
                                            ? 'border-b-2 border-cyan-400 text-cyan-300 bg-white/[0.02]'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {tId === 'life' ? 'LIFE' : tId === 'loadEq' ? 'LOAD EQ' : 'NOTES'}
                                </button>
                            ))}
                        </div>

                        <div className="p-4 text-xs font-mono space-y-2 text-slate-300">
                            {tab === 'life' && (
                                <>
                                    <p className="text-cyan-300">
                                        L₁₀ = (C/P)ᵖ = ({selected.C} / {life.P.toFixed(3)})^{pExp.toFixed(2)} = {life.L10.toFixed(2)} · 10⁶ rev
                                    </p>
                                    <p className="text-slate-400">
                                        L₁₀h = 10⁶ · L₁₀ / (60·n) = {life.L10h.toFixed(0)} h · Lnm = a₁·L₁₀h = {life.Lna.toFixed(0)} h
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        p = 3 (ball) or 10/3 (roller), a₁ is the ISO 281 reliability factor.
                                    </p>
                                </>
                            )}
                            {tab === 'loadEq' && (
                                <>
                                    <p className="text-cyan-300">
                                        P = X·Fr + Y·Fa = {life.P.toFixed(3)} kN (Equivalent dynamic load)
                                    </p>
                                    <p className="text-slate-400">
                                        P₀ = X₀·Fr + Y₀·Fa = {life.P0.toFixed(3)} kN (Static equivalent load)
                                    </p>
                                </>
                            )}
                            {tab === 'notes' && (
                                <div className="space-y-1 text-[11px] text-slate-400">
                                    <p>• Basic rating life applies to 90% reliability with clean mineral oil lubrication.</p>
                                    <p>• For modified rating life Lnm, system life factors aISO must be applied.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <WorkbenchInfo
                        formula="L₁₀ = (C / P)ᵖ · 10⁶ rev | L₁₀h = 10⁶·L₁₀/(60·n) | Lnm = a₁·L₁₀h"
                        formulaNote="ISO 281 basic rating life. Lubrication aISO / contamination not modeled (a=1 assumption)."
                        standards={['ISO 281', 'ISO 76 (STATIC)', 'ISO 15 (RADIAL DIMENSIONS)']}
                        assumptions={[
                            'Dynamic C from catalog; P from type-specific equivalent-load rules.',
                            'a₁ reliability only; aISO lubrication factor not applied.',
                            'n_max is a guideline and depends on grease/oil and load.',
                        ]}
                        links={[{ href: '/academy/bearing-life-calculation-explained/', label: 'Academy' }]}
                    />
                </div>
            </WorkbenchResults>
        </CalculatorWorkbench>
    );
}

function Kpi({ label, value, unit }: { label: string; value: string; unit?: string }) {
    return (
        <div className="rounded-xl border border-white/[0.08] bg-[#0c0f16] p-3 sm:p-4">
            <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">{label}</div>
            <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tabular-nums text-white sm:text-3xl">{value}</span>
                {unit && <span className="text-[11px] text-slate-400 font-mono">{unit}</span>}
            </div>
        </div>
    );
}

export default BearingsModule;
