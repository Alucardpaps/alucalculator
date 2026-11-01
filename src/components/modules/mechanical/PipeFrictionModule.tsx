'use client';

import React, { useState, useMemo } from 'react';
import { Settings, Droplet, MoveRight, Layers, Sliders } from 'lucide-react';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

export default function PipeFrictionModule() {
    const precision = useGlobalPrecision();
    const language = useI18nStore((s) => s.language);

    // Inputs
    const [diameter, setDiameter] = useState<number>(50); // mm
    const [length, setLength] = useState<number>(100); // m
    const [flowRate, setFlowRate] = useState<number>(5); // L/s
    const [roughness, setRoughness] = useState<number>(0.045); // mm (Commercial steel)
    const [fluidType, setFluidType] = useState<'water' | 'air' | 'oil'>('water');
    const [minorLossK, setMinorLossK] = useState<number>(1.5); // Sum of fitting loss coefficients (Crane TP-410)

    const fluidProps = useMemo(() => {
        if (fluidType === 'water') return { rho: 998, mu: 0.001, label: t12(language, 'Water (20°C)', 'Su (20°C)') }; // kg/m³, Pa.s
        if (fluidType === 'air') return { rho: 1.225, mu: 0.0000181, label: t12(language, 'Air (20°C, 1 atm)', 'Hava (20°C, 1 atm)') };
        if (fluidType === 'oil') return { rho: 870, mu: 0.04, label: t12(language, 'ISO VG 46 Oil (40°C)', 'ISO VG 46 Yağ (40°C)') };
        return { rho: 998, mu: 0.001, label: t12(language, 'Water (20°C)', 'Su (20°C)') };
    }, [fluidType, language]);

    const results = useMemo(() => {
        const d = Math.max(diameter, 1) / 1000; // m
        const l = Math.max(length, 0.1); // m
        const q = Math.max(flowRate, 0.001) / 1000; // m³/s
        const eps = Math.max(roughness, 0) / 1000; // m
        const K_minor = Math.max(minorLossK, 0);
        const { rho, mu } = fluidProps;

        const area = Math.PI * (d * d) / 4;
        const velocity = area > 0 ? q / area : 0; // m/s
        const reynolds = (rho * velocity * d) / (mu || 1e-10);

        let f = 0;
        let flowRegime = 'Laminar';

        if (reynolds < 2300) {
            flowRegime = 'Laminar';
            f = reynolds > 0 ? 64 / reynolds : 0;
        } else if (reynolds < 4000) {
            flowRegime = 'Transitional';
            // Interpolation between laminar and turbulent onset
            const f_lam = 64 / 2300;
            const f_turb = 0.25 / Math.pow(Math.log10(eps / (3.7 * d) + 5.74 / Math.pow(4000, 0.9)), 2);
            f = f_lam + ((reynolds - 2300) / 1700) * (f_turb - f_lam);
        } else {
            flowRegime = 'Turbulent';
            // Swamee-Jain approximation of Colebrook-White equation
            f = 0.25 / Math.pow(Math.log10(eps / (3.7 * d) + 5.74 / Math.pow(reynolds, 0.9)), 2);
        }

        // Darcy-Weisbach & Crane TP-410 Head Loss
        const g = 9.80665; // m/s²
        const velocityHead = (velocity * velocity) / (2 * g); // m
        
        // Major friction head loss: hf = f * (L/D) * (v² / 2g)
        const headLossMajor = f * (l / d) * velocityHead;
        // Minor fittings head loss: hm = sum(K) * (v² / 2g)
        const headLossMinor = K_minor * velocityHead;
        // Total head loss: h_total = hf + hm
        const totalHeadLoss = headLossMajor + headLossMinor;

        // Pressure drops: Delta P = rho * g * h
        const pressureDropMajorPa = rho * g * headLossMajor;
        const pressureDropMinorPa = rho * g * headLossMinor;
        const totalPressureDropPa = rho * g * totalHeadLoss;

        const pressureDropMajorBar = pressureDropMajorPa / 100000;
        const pressureDropMinorBar = pressureDropMinorPa / 100000;
        const totalPressureDropBar = totalPressureDropPa / 100000;

        return {
            velocity,
            velocityHead,
            reynolds,
            f,
            flowRegime,
            headLossMajor,
            headLossMinor,
            totalHeadLoss,
            pressureDropMajorBar,
            pressureDropMinorBar,
            totalPressureDropBar,
            totalPressureDropKPa: totalPressureDropPa / 1000
        };
    }, [diameter, length, flowRate, roughness, fluidProps, minorLossK]);

    const addFitting = (kVal: number) => {
        setMinorLossK(prev => Number((prev + kVal).toFixed(2)));
    };

    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-[var(--bg-0)] text-white overflow-hidden">
            {/* Left Control Sidebar */}
            <div className="w-full lg:w-[380px] shrink-0 flex flex-col bg-[var(--bg-0)] border-r border-[var(--line)] overflow-y-auto custom-scrollbar">
                <div className="p-6 border-b border-[var(--line)] ">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-lg bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)]">
                            <MoveRight size={22} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight uppercase">{t12(language, 'Pipe Friction', 'Boru Sürtünmesi & Yük Kaybı')}</h1>
                            <p className="text-[10px] text-cyan-400/80 font-mono tracking-widest uppercase">Darcy-Weisbach & Crane TP-410</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Fluid Selector */}
                    <div className="space-y-3">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--alu-dim)] flex items-center gap-2">
                            <Droplet size={12} /> {t12(language, 'Fluid Medium', 'Akışkan Tipi')}
                        </h2>
                        <div className="flex gap-2 p-1 bg-[var(--bg-2)] border border-[var(--line)] rounded">
                            <button 
                                onClick={() => setFluidType('water')} 
                                className={`flex-1 py-1.5 text-xs font-mono font-bold rounded transition-colors ${fluidType === 'water' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black' : 'text-[var(--alu-dim)] hover:text-white'}`}
                            >
                                {t12(language, 'Water', 'Su')}
                            </button>
                            <button 
                                onClick={() => setFluidType('oil')} 
                                className={`flex-1 py-1.5 text-xs font-mono font-bold rounded transition-colors ${fluidType === 'oil' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black' : 'text-[var(--alu-dim)] hover:text-white'}`}
                            >
                                {t12(language, 'Oil', 'Yağ')}
                            </button>
                            <button 
                                onClick={() => setFluidType('air')} 
                                className={`flex-1 py-1.5 text-xs font-mono font-bold rounded transition-colors ${fluidType === 'air' ? 'bg-slate-400 text-black font-black' : 'text-[var(--alu-dim)] hover:text-white'}`}
                            >
                                {t12(language, 'Air', 'Hava')}
                            </button>
                        </div>
                        <p className="text-[9px] font-mono text-[var(--alu-dim)]">{fluidProps.label} (ρ = {fluidProps.rho} kg/m³)</p>
                    </div>

                    {/* Pipe Geometry & Flow */}
                    <div className="space-y-3 pt-2 border-t border-[var(--line)]">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--alu-dim)] flex items-center gap-2">
                            <Settings size={12} /> {t12(language, 'Pipe & Flow Parameters', 'Boru & Akış Parametreleri')}
                        </h2>
                        
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold">
                                <span className="text-[var(--alu-dim)] font-mono">{t12(language, 'Flow Rate Q (L/s)', 'Debi Q (L/s)')}</span>
                                <span className="text-cyan-400 font-mono">{flowRate}</span>
                            </div>
                            <input 
                                type="range" 
                                min={0.1} 
                                max={50} 
                                step={0.1} 
                                value={flowRate} 
                                onChange={e => setFlowRate(Number(e.target.value))} 
                                className="w-full accent-[var(--cyan)]" 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-mono text-[var(--alu-dim)] uppercase tracking-wider">{t12(language, 'Inner Dia D (mm)', 'İç Çap D (mm)')}</label>
                                <input 
                                    type="number" 
                                    value={diameter} 
                                    onChange={e => setDiameter(Math.max(1, Number(e.target.value)))} 
                                    className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-2 text-xs outline-none font-mono text-[var(--ink)] focus:border-cyan-500 mt-1" 
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-mono text-[var(--alu-dim)] uppercase tracking-wider">{t12(language, 'Length L (m)', 'Boru Boyu L (m)')}</label>
                                <input 
                                    type="number" 
                                    value={length} 
                                    onChange={e => setLength(Math.max(0.1, Number(e.target.value)))} 
                                    className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-2 text-xs outline-none font-mono text-[var(--ink)] focus:border-cyan-500 mt-1" 
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[9px] font-mono text-[var(--alu-dim)] uppercase tracking-wider">{t12(language, 'Wall Roughness ε (mm)', 'Cidar Pürüzlülüğü ε (mm)')}</label>
                                <input 
                                    type="number" 
                                    step={0.001} 
                                    value={roughness} 
                                    onChange={e => setRoughness(Math.max(0, Number(e.target.value)))} 
                                    className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-2 text-xs outline-none font-mono text-[var(--ink)] focus:border-cyan-500 mt-1" 
                                />
                                <div className="text-[8px] font-mono text-[var(--alu-dim)] mt-1">{t12(language, 'Comm. Steel: 0.045 mm | Smooth PVC: 0.0015 mm', 'Ticari Çelik: 0.045 mm | Pürüzsüz PVC: 0.0015 mm')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Minor Loss Fittings (Crane TP-410) */}
                    <div className="space-y-3 pt-2 border-t border-[var(--line)]">
                        <div className="flex justify-between items-center">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--alu-dim)] flex items-center gap-2">
                                <Layers size={12} /> {t12(language, 'Minor Losses (∑K)', 'Yerel Kayıplar (∑K)')}
                            </h2>
                            <button 
                                onClick={() => setMinorLossK(0)} 
                                className="text-[9px] font-mono text-cyan-400 hover:underline"
                            >
                                {t12(language, 'Reset K', 'K Sıfırla')}
                            </button>
                        </div>

                        <div>
                            <label className="text-[9px] font-mono text-[var(--alu-dim)] uppercase tracking-wider">{t12(language, 'Loss Coefficient ∑K', 'Kayıp Katsayısı Toplamı ∑K')}</label>
                            <input 
                                type="number" 
                                step="0.1" 
                                min="0" 
                                value={minorLossK} 
                                onChange={e => setMinorLossK(Math.max(0, Number(e.target.value)))} 
                                className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-2 text-xs outline-none font-mono text-[var(--ink)] focus:border-cyan-500 mt-1" 
                            />
                        </div>

                        <div className="space-y-1.5">
                            <span className="text-[8px] font-mono text-[var(--alu-dim)] uppercase">{t12(language, 'Quick Add Fitting (Crane TP-410):', 'Hızlı Ek Parça Ekle (Crane TP-410):')}</span>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button 
                                    onClick={() => addFitting(0.75)} 
                                    className="px-2 py-1 bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] rounded text-[9px] font-mono text-[var(--alu)] text-left"
                                >
                                    {t12(language, '+ 90° Elbow (K=0.75)', '+ 90° Dirsek (K=0.75)')}
                                </button>
                                <button 
                                    onClick={() => addFitting(0.35)} 
                                    className="px-2 py-1 bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] rounded text-[9px] font-mono text-[var(--alu)] text-left"
                                >
                                    {t12(language, '+ 45° Elbow (K=0.35)', '+ 45° Dirsek (K=0.35)')}
                                </button>
                                <button 
                                    onClick={() => addFitting(0.4)} 
                                    className="px-2 py-1 bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] rounded text-[9px] font-mono text-[var(--alu)] text-left"
                                >
                                    {t12(language, '+ Tee Line (K=0.40)', '+ Te Düz Hat (K=0.40)')}
                                </button>
                                <button 
                                    onClick={() => addFitting(1.5)} 
                                    className="px-2 py-1 bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] rounded text-[9px] font-mono text-[var(--alu)] text-left"
                                >
                                    {t12(language, '+ Tee Branch (K=1.50)', '+ Te Branşman (K=1.50)')}
                                </button>
                                <button 
                                    onClick={() => addFitting(0.17)} 
                                    className="px-2 py-1 bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] rounded text-[9px] font-mono text-[var(--alu)] text-left"
                                >
                                    {t12(language, '+ Gate Valve (K=0.17)', '+ Sürgülü Vana (K=0.17)')}
                                </button>
                                <button 
                                    onClick={() => addFitting(2.0)} 
                                    className="px-2 py-1 bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] rounded text-[9px] font-mono text-[var(--alu)] text-left"
                                >
                                    {t12(language, '+ Check Valve (K=2.0)', '+ Çekvalf (K=2.0)')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Display Area */}
            <div className="flex-1 flex flex-col p-6 lg:p-8 relative overflow-y-auto custom-scrollbar">
                {/* Main Readout Card */}
                <div className="relative z-10 flex flex-col items-center justify-center bg-[var(--bg-1)] border border-[var(--line)] rounded-2xl p-8 shadow-xl mb-6">
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--alu-dim)] mb-1">
                        {t12(language, 'Total System Pressure Drop (ΔP_total)', 'Toplam Sistem Basınç Düşüşü (ΔP_toplam)')}
                    </div>
                    <div className="text-5xl lg:text-5xl font-mono font-black tracking-tight text-white">
                        {formatEngineeringValue(results.totalPressureDropBar, precision, false)}<span className="text-2xl text-[var(--alu-dim)] font-sans ml-2">Bar</span>
                    </div>
                    <div className="text-sm font-mono text-cyan-400 mt-1">
                        ({formatEngineeringValue(results.totalPressureDropKPa, precision, false)} kPa)
                    </div>

                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <div className={`px-4 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider border ${results.flowRegime === 'Turbulent' ? 'bg-red-500/10 border-red-500/30 text-red-400' : results.flowRegime === 'Laminar' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                            {results.flowRegime === 'Turbulent' 
                                ? t12(language, 'Turbulent Flow', 'Türbülanslı Akış') 
                                : results.flowRegime === 'Laminar' 
                                ? t12(language, 'Laminar Flow', 'Laminer Akış') 
                                : t12(language, 'Transitional Flow (2300 < Re < 4000)', 'Geçiş Akışı (2300 < Re < 4000)')}
                        </div>
                        <div className="px-4 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider border bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu)]">
                            Re: {results.reynolds.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <div className="px-4 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider border bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
                            f = {results.f.toFixed(4)}
                        </div>
                    </div>

                    {results.flowRegime === 'Transitional' && (
                        <div className="mt-3 px-3 py-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-300 text-center max-w-lg">
                            ⚠️ {t12(language, 'Transition regime: Flow behavior is indeterminate; friction factor is model-dependent.', 'Geçiş rejimi: Akış davranışı belirsizdir; sürtünme katsayısı modele duyarlıdır.')}
                        </div>
                    )}
                </div>

                {/* Major vs Minor Loss Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Major Pipe Friction Loss */}
                    <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-5">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold text-[var(--alu-dim)] mb-2">
                            <span>{t12(language, 'MAJOR FRICTION (hf)', 'SÜRTÜNME YÜK KAYBI (hf)')}</span>
                            <span className="text-cyan-400">Darcy-Weisbach</span>
                        </div>
                        <div className="text-3xl font-mono font-black text-white">
                            {formatEngineeringValue(results.headLossMajor, precision, false)} <span className="text-sm text-[var(--alu-dim)]">m</span>
                        </div>
                        <div className="text-xs font-mono text-cyan-400 mt-2">
                            ΔP = {formatEngineeringValue(results.pressureDropMajorBar, precision, false)} Bar
                        </div>
                        <p className="text-[10px] font-mono text-[var(--alu-dim)] mt-1">
                            {t12(language, 'Straight pipe friction', 'Düz boru sürtünme kaybı')} (L={length} m, D={diameter} mm)
                        </p>
                    </div>

                    {/* Minor Fittings Loss */}
                    <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-5">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold text-[var(--alu-dim)] mb-2">
                            <span>{t12(language, 'MINOR LOSSES (hm)', 'YEREL KAYIPLAR (hm)')}</span>
                            <span className="text-amber-400">Crane TP-410</span>
                        </div>
                        <div className="text-3xl font-mono font-black text-white">
                            {formatEngineeringValue(results.headLossMinor, precision, false)} <span className="text-sm text-[var(--alu-dim)]">m</span>
                        </div>
                        <div className="text-xs font-mono text-amber-400 mt-2">
                            ΔP = {formatEngineeringValue(results.pressureDropMinorBar, precision, false)} Bar
                        </div>
                        <p className="text-[10px] font-mono text-[var(--alu-dim)] mt-1">
                            {t12(language, 'Fittings & valves resistance', 'Armatür & vana yerel direnci')} (∑K = {minorLossK.toFixed(2)})
                        </p>
                    </div>
                </div>

                {/* Hydrodynamic Velocity & Flow Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-5">
                        <div className="text-[10px] font-mono text-[var(--alu-dim)] uppercase mb-1">{t12(language, 'Flow Velocity (v)', 'Akış Hızı (v)')}</div>
                        <div className="text-2xl font-mono font-black text-white">
                            {formatEngineeringValue(results.velocity, precision, false)} <span className="text-xs text-cyan-400">m/s</span>
                        </div>
                        <div className="text-[10px] font-mono text-[var(--alu-dim)] mt-1">
                            {t12(language, 'Dynamic head:', 'Dinamik yük:')} {results.velocityHead.toFixed(3)} m
                        </div>
                    </div>

                    <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-5">
                        <div className="text-[10px] font-mono text-[var(--alu-dim)] uppercase mb-1">{t12(language, 'Darcy Friction Factor (f)', 'Darcy Sürtünme Faktörü (f)')}</div>
                        <div className="text-2xl font-mono font-black text-white">
                            {formatEngineeringValue(results.f, precision, false)}
                        </div>
                        <div className="text-[10px] font-mono text-[var(--alu-dim)] mt-1">
                            Colebrook-White / Swamee-Jain
                        </div>
                    </div>

                    <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-5">
                        <div className="text-[10px] font-mono text-[var(--alu-dim)] uppercase mb-1">{t12(language, 'Total Head Loss (h_total)', 'Toplam Yük Kaybı (h_toplam)')}</div>
                        <div className="text-2xl font-mono font-black text-cyan-400">
                            {formatEngineeringValue(results.totalHeadLoss, precision, false)} <span className="text-xs text-cyan-400/60">m</span>
                        </div>
                        <div className="text-[10px] font-mono text-[var(--alu-dim)] mt-1">
                            hf ({results.headLossMajor.toFixed(1)}m) + hm ({results.headLossMinor.toFixed(1)}m)
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
