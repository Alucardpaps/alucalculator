import React, { useState, useMemo } from 'react';
import { Wrench, Settings, ArrowDownToLine, Triangle } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';

// Common metric ISO bolts
const BOLT_SIZES = [
    { nominal: 'M6', pitch: 1.0, area: 20.1 },
    { nominal: 'M8', pitch: 1.25, area: 36.6 },
    { nominal: 'M10', pitch: 1.5, area: 58.0 },
    { nominal: 'M12', pitch: 1.75, area: 84.3 },
    { nominal: 'M14', pitch: 2.0, area: 115 },
    { nominal: 'M16', pitch: 2.0, area: 157 },
    { nominal: 'M20', pitch: 2.5, area: 245 },
    { nominal: 'M24', pitch: 3.0, area: 353 }
];

// ISO Property Classes (Grades)
const BOLT_GRADES = [
    { class: '4.6', yield: 240, tensile: 400 },
    { class: '4.8', yield: 320, tensile: 400 },
    { class: '5.8', yield: 400, tensile: 500 },
    { class: '8.8', yield: 640, tensile: 800 },
    { class: '10.9', yield: 900, tensile: 1000 },
    { class: '12.9', yield: 1080, tensile: 1200 }
];

// Friction coefficient K
const FRICTION_CONDITIONS = [
    { id: 'lubricated', name: { en: 'Lubricated (Oil/Grease)', tr: 'Yağlanmış' }, k: 0.15 },
    { id: 'zinc', name: { en: 'Zinc Plated (Dry)', tr: 'Çinko Kaplama (Kuru)' }, k: 0.20 },
    { id: 'dry', name: { en: 'Black Oxide / Dry', tr: 'Kuru / Siyah Oksit' }, k: 0.25 },
    { id: 'loctite', name: { en: 'Threadlocker (Loctite)', tr: 'Cıvata Sabitleyici (Loctite)' }, k: 0.18 }
];

const BoltTorqueModule: React.FC = () => {
    const { language } = useI18nStore();
    const isTr = language === 'tr';

    const [sizeIndex, setSizeIndex] = useState(3); // M12 default
    const [gradeIndex, setGradeIndex] = useState(3); // 8.8 default
    const [frictionIndex, setFrictionIndex] = useState(0); // lubricated
    const [targetYieldPercent, setTargetYieldPercent] = useState(75); // Typical 75-90% of yield strength

    const size = BOLT_SIZES[sizeIndex];
    const grade = BOLT_GRADES[gradeIndex];
    const friction = FRICTION_CONDITIONS[frictionIndex];

    const results = useMemo(() => {
        // Required Preload Force (F_i) = Target % * Yield Strength * Tensile Stress Area
        const preloadForce = (targetYieldPercent / 100) * grade.yield * size.area; // Newtons

        // Nominal Diameter in meters
        const d_m = parseInt(size.nominal.replace('M', '')) / 1000;

        // Tightening Torque (T) = K * F_i * d
        const torque = friction.k * preloadForce * d_m; // N.m

        // Equivalent Tension calculation for display
        const safetyMargin = 100 - targetYieldPercent;

        return {
            preloadForce: (preloadForce / 1000).toFixed(1), // kN
            torque: torque.toFixed(1), // Nm
            yieldLimit: (grade.yield * size.area / 1000).toFixed(1), // kN
            safetyMargin: safetyMargin,
            kFactor: friction.k,
            diameter: d_m * 1000
        };
    }, [size, grade, friction, targetYieldPercent]);

    return (
        <div className="flex w-full h-full bg-[#0a0a0c] text-white">
            {/* Left Column: Inputs */}
            <div className="w-[350px] border-r border-white/10 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">

                <h2 className="text-xl font-medium text-white/90 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-zinc-400" />
                    {isTr ? 'Cıvata Tork Hesaplayıcı' : 'Bolt Torque Calculator'}
                </h2>

                <div className="space-y-4">

                    {/* Size & Grade Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-white/50 mb-1">
                                {isTr ? 'Metrik Diş (ISO)' : 'Metric Thread (ISO)'}
                            </label>
                            <select
                                value={sizeIndex}
                                onChange={(e) => setSizeIndex(parseInt(e.target.value))}
                                className="w-full bg-[#151518] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                            >
                                {BOLT_SIZES.map((b, i) => (
                                    <option key={b.nominal} value={i}>{b.nominal} (P={b.pitch})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-white/50 mb-1">
                                {isTr ? 'Dayanım Sınıfı' : 'Property Class'}
                            </label>
                            <select
                                value={gradeIndex}
                                onChange={(e) => setGradeIndex(parseInt(e.target.value))}
                                className="w-full bg-[#151518] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                            >
                                {BOLT_GRADES.map((g, i) => (
                                    <option key={g.class} value={i}>{g.class}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-between mt-1 text-[10px] text-white/40 pb-2 border-b border-white/5">
                        <span>As: {size.area} mm²</span>
                        <span>Sy: {grade.yield} MPa</span>
                    </div>

                    {/* Friction */}
                    <div>
                        <label className="block text-xs font-medium text-white/50 mb-1">
                            {isTr ? 'Sürtünme Durumu' : 'Friction Condition'}
                        </label>
                        <select
                            value={frictionIndex}
                            onChange={(e) => setFrictionIndex(parseInt(e.target.value))}
                            className="w-full bg-[#151518] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                        >
                            {FRICTION_CONDITIONS.map((f, i) => (
                                <option key={f.id} value={i}>{isTr ? f.name.tr : f.name.en} (K={f.k})</option>
                            ))}
                        </select>
                    </div>

                    {/* Target Preload */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-medium text-white/50">
                                {isTr ? 'Hedef Sıkma Oranı (Akma Limiti %)' : 'Target Preload (% Yield)'}
                            </label>
                            <span className="text-xs text-blue-400 font-mono">{targetYieldPercent}%</span>
                        </div>
                        <input
                            type="range"
                            min="50" max="95" step="5"
                            value={targetYieldPercent}
                            onChange={(e) => setTargetYieldPercent(parseInt(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                        />
                        <p className="mt-1 text-[10px] text-white/40">
                            {isTr ? 'Genellikle statik yükler için %75, dinamik yükler için %90 optimumdur.' : 'Typically 75% for static, 90% for dynamic loads.'}
                        </p>
                    </div>

                </div>
            </div>

            {/* Right Column: Visualization & Results */}
            <div className="flex-1 p-8 flex flex-col gap-8 bg-[#0a0a0c] relative">

                {/* Background Blueprint Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="grid grid-cols-2 gap-6 z-10">
                    <div className="bg-[#111115] border border-white/10 border-t-blue-500/50 rounded-xl p-6 relative">
                        <div className="flex items-center gap-2 text-white/50 mb-4">
                            <Settings className="w-5 h-5" />
                            <h3 className="text-sm font-medium uppercase">{isTr ? 'Sıkma Torku' : 'Tightening Torque'}</h3>
                        </div>
                        <div className="text-5xl font-light text-white mb-2 tracking-tight">
                            {results.torque} <span className="text-lg text-white/40 font-normal">N·m</span>
                        </div>
                        <div className="text-xs text-white/40 font-mono bg-white/5 inline-block px-2 py-1 rounded">
                            T = {results.kFactor} × {results.preloadForce}kN × {results.diameter}mm
                        </div>
                    </div>

                    <div className="bg-[#111115] border border-white/10 border-t-emerald-500/50 rounded-xl p-6 relative">
                        <div className="flex items-center gap-2 text-white/50 mb-4">
                            <ArrowDownToLine className="w-5 h-5" />
                            <h3 className="text-sm font-medium uppercase">{isTr ? 'Kelepçe Gücü (Ön Yük)' : 'Clamp Load (Preload)'}</h3>
                        </div>
                        <div className="text-5xl font-light text-white mb-2 tracking-tight">
                            {results.preloadForce} <span className="text-lg text-white/40 font-normal">kN</span>
                        </div>
                        <div className="flex gap-4 w-full mt-2">
                            <div className="h-2 flex-1 bg-white/10 rounded-full overflow-hidden flex">
                                <div className="h-full bg-emerald-500" style={{ width: `${targetYieldPercent}%` }} />
                                <div className="h-full bg-red-500/50" style={{ width: `${100 - targetYieldPercent}%` }} />
                            </div>
                        </div>
                        <div className="flex justify-between text-[10px] text-white/40 mt-1">
                            <span>0 kN</span>
                            <span>Yield: {results.yieldLimit} kN</span>
                        </div>
                    </div>
                </div>

                {/* Diagram Area */}
                <div className="flex-1 border border-white/5 rounded-xl bg-gradient-to-br from-[#111115] to-[#0a0a0c] flex items-center justify-center p-8 z-10 relative">
                    {/* Simplified visual representation of a bolted joint clamping force */}
                    <div className="flex flex-col items-center gap-0 w-48 relative">
                        <div className="absolute top-[-40px] flex flex-col items-center text-blue-400">
                            <span className="text-xs font-mono">{results.torque} N·m</span>
                            <Triangle className="w-4 h-4 rotate-180 fill-blue-500/50" />
                        </div>

                        {/* Bolt Head */}
                        <div className="w-32 h-10 bg-zinc-700 rounded-t-sm border border-zinc-600 flex items-center justify-center shadow-lg">
                            <span className="text-xs text-white/30 font-mono">{size.nominal} {grade.class}</span>
                        </div>

                        {/* Top Plate */}
                        <div className="w-48 h-12 bg-white/5 border border-white/20 mt-[2px] relative flex justify-center overflow-hidden">
                            <div className="w-16 h-full border-x-2 border-dashed border-zinc-600 bg-zinc-800/80" />
                            <div className="absolute left-4 top-1/2 -mt-[0.5px] w-8 h-[1px] bg-emerald-500/50" />
                            <ArrowDownToLine className="absolute left-8 top-1/2 -mt-2 w-4 h-4 text-emerald-500" />
                        </div>

                        {/* Bottom Plate */}
                        <div className="w-48 h-12 bg-white/5 border border-white/20 mt-[2px] relative justify-center overflow-hidden flex">
                            <div className="w-16 h-full border-x-2 border-dashed border-zinc-600 bg-zinc-800/80" />
                            <div className="absolute left-4 top-1/2 -mt-[0.5px] w-8 h-[1px] bg-emerald-500/50" />
                            <ArrowDownToLine className="absolute left-8 top-1/2 -mt-2 w-4 h-4 text-emerald-500 rotate-180" />
                        </div>

                        {/* Nut & Threads output */}
                        <div className="w-32 h-8 bg-zinc-700 rounded-b-sm border border-zinc-600 mt-[2px] flex items-center justify-center shadow-lg relative">
                            {/* Threads extending */}
                            <div className="absolute top-full w-12 h-6 border-x border-b border-zinc-600 bg-zinc-800/50 rounded-b-sm"
                                style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)' }} />
                        </div>

                        <div className="absolute bottom-[40px] right-[-60px] flex flex-col items-start gap-1">
                            <span className="text-[10px] text-emerald-400 font-mono uppercase bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                F = {results.preloadForce} kN
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BoltTorqueModule;
