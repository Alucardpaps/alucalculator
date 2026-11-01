'use client';

import React, { useState, useMemo } from 'react';
import { useWillisEquation, GearboxMode, StageConfig } from '@/hooks/useWillisEquation';
import { GearboxSchematic } from './gearbox/GearboxSchematic';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { Settings, Zap, RotateCcw, Activity, Shield, Info, Plus, Trash2, Box } from 'lucide-react';
import { CrossModuleBridge } from '@/system/crossModuleBridge';
import { useI18nStore } from '@/store/i18nStore';
import { getPlanetaryCalculatorStrings } from '@/locales/planetaryCalculatorTranslations';
import { getPlanetaryTitleStrings } from '@/locales/planetaryTitleTranslations';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

// ════════════════════════════════════════════
// CONSTANTS & STYLES
// ════════════════════════════════════════════

const COLORS = {
  bg: '#020408',
  panel: '#0a1018',
  text: '#C5C6C7',
  accent: '#00e5ff',
  accentDim: 'rgba(0, 229, 255, 0.2)',
  glow: 'rgba(0, 229, 255, 0.4)',
  danger: '#ef4444',
};

// ════════════════════════════════════════════
// UI COMPONENTS
// ════════════════════════════════════════════

const DataDisplay = ({ label, value, unit, icon: Icon, color = COLORS.accent }: any) => (
  <div className="relative group overflow-hidden bg-[var(--bg-1)] border border-white/5 rounded-xl p-4 transition-all hover:border-[var(--cyan)]/30">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 rounded-lg bg-black/40 text-white/50 group-hover:text-cyan-400 transition-colors">
        <Icon size={16} />
      </div>
      <span className="text-[10px] uppercase tracking-widest font-mono text-white/40">{label}</span>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-black font-mono tabular-nums tracking-tighter" style={{ color }}>
        {value}
      </span>
      <span className="text-[10px] font-mono text-white/20 uppercase">{unit}</span>
    </div>
    <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity" style={{ background: color }} />
  </div>
);

const ControlSlider = ({ label, value, min, max, step = 1, onChange, unit }: any) => (
  <div className="space-y-3">
    <div className="flex justify-between items-baseline">
      <label className="text-[10px] uppercase tracking-widest font-mono text-white/30">{label}</label>
      <div className="flex items-baseline gap-1">
        <span className="text-xs font-mono font-bold text-cyan-400">{value}</span>
        <span className="text-[9px] font-mono text-white/20">{unit}</span>
      </div>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)] hover:accent-white transition-all"
      suppressHydrationWarning
    />
  </div>
);

// ════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════

export const PlanetaryCalculator = () => {
  const precision = useGlobalPrecision();
  const { language } = useI18nStore();
  const pt = getPlanetaryTitleStrings(language);
  const t = getPlanetaryCalculatorStrings(language);

  // Multistage State
  const [stages, setStages] = useState<StageConfig[]>([
    { id: '1', zs: 21, zr: 63, m: 2, planetCount: 3, mode: 'RING_FIXED', helixAngle: 0, faceWidth: 20 }
  ]);
  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [inputRPM, setInputRPM] = useState(1500);
  const [inputPower, setInputPower] = useState(5.5);

  // Math Hook
  const { stageResults, outputRPM, outputTorque, totalRatio, mechanicalAdvantage, etaTotal, powerLossKW } = useWillisEquation({
    stages, inputRPM, inputPowerKW: inputPower
  });
  const activeRating = stageResults[activeStageIdx]?.rating;

  const activeStage = stages[activeStageIdx];

  const updateActiveStage = (updates: Partial<StageConfig>) => {
    setStages(prev => prev.map((s, i) => i === activeStageIdx ? { ...s, ...updates } : s));
  };

  const addStage = () => {
    const last = stages[stages.length - 1];
    const newStage: StageConfig = {
      id: Math.random().toString(36).substr(2, 9),
      zs: last?.zs || 20,
      zr: last?.zr || 60,
      m: last?.m || 2,
      planetCount: last?.planetCount || 3,
      mode: 'RING_FIXED',
      helixAngle: last?.helixAngle || 0,
      faceWidth: last?.faceWidth || 20,
    };
    setStages([...stages, newStage]);
    setActiveStageIdx(stages.length);
  };

  const removeStage = (index: number) => {
    if (stages.length <= 1) return;
    const newStages = stages.filter((_, i) => i !== index);
    setStages(newStages);
    setActiveStageIdx(Math.max(0, activeStageIdx === index ? index - 1 : activeStageIdx > index ? activeStageIdx - 1 : activeStageIdx));
  };

  // Chart Data (using total system output)
  const chartData = useMemo(() => {
    const points = [];
    for (let rpm = 100; rpm <= Math.max(3000, inputRPM * 1.5); rpm += 200) {
        let currentRpm = rpm;
        stages.forEach(s => {
            let r = 0;
            if (s.mode === 'SUN_FIXED') r = 1 + s.zs / s.zr;
            else if (s.mode === 'RING_FIXED') r = 1 + s.zr / s.zs;
            else r = -s.zr / s.zs;
            currentRpm /= r;
        });
        const outTorque = Math.abs(currentRpm) !== 0 ? (inputPower * 9549.27) / Math.abs(currentRpm) : 0;
        points.push({ rpm: Math.abs(currentRpm).toFixed(0), torque: outTorque.toFixed(1) });
    }
    return points;
  }, [stages, inputPower, inputRPM]);

  return (
    <div className="w-full min-h-full p-4 sm:p-6 lg:p-8 font-sans" style={{ background: COLORS.bg, color: COLORS.text }}>
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header & KPI Summary Strip */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-4 border-b border-white/5">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
              <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[var(--cyan)] inline-flex">
                <Activity size={22} />
              </span>
              <span>
                {pt.titleBefore} <span className="text-[var(--cyan)]">{pt.titleHighlight}</span>
              </span>
            </h1>
            <p className="text-[10px] font-mono tracking-[0.25em] text-white/40 uppercase">
              {t.subtitle.replace('{stagesLength}', stages.length.toString())} · DIN 3960 / ISO 21771
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-stretch">
            <button
              type="button"
              onClick={() => {
                const zp = Math.max(4, Math.round((activeStage.zr - activeStage.zs) / 2));
                CrossModuleBridge.exportPlanetaryTo3D({
                  sunTeeth: activeStage.zs,
                  planetTeeth: zp,
                  ringTeeth: activeStage.zr,
                  planetCount: activeStage.planetCount,
                  module: activeStage.m,
                  faceWidth: activeStage.faceWidth || 10 * activeStage.m,
                  helixAngle: activeStage.helixAngle || 0,
                  switchWindow: true,
                });
              }}
              className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-[var(--radius-s)] text-[10px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              title="Export sun, planets and ring of the active stage to 3D Design Studio"
            >
              <Box size={14} />
              Export to 3D
            </button>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full xl:w-auto">
              <DataDisplay label={t.systemRatio} value={`${formatEngineeringValue(totalRatio, precision, true)}:1`} unit="" icon={Activity} />
              <DataDisplay label={t.outputRpm} value={formatEngineeringValue(Math.abs(outputRPM), 0, true)} unit="RPM" icon={RotateCcw} />
              <DataDisplay label={t.totalTorque} value={formatEngineeringValue(outputTorque, precision, true)} unit="Nm" icon={Zap} />
              <DataDisplay label={t.systemAdvantage} value={formatEngineeringValue(mechanicalAdvantage, precision, true)} unit="x" icon={Shield} />
            </div>
          </div>
        </div>

        {/* 2-Column Workstation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Stage Management & Parameters */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5">
            
            {/* Stage Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {stages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStageIdx(i)}
                  className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold font-mono uppercase transition-all flex items-center gap-2 shrink-0 ${
                    activeStageIdx === i ? 'bg-[var(--cyan)] text-black ' : 'bg-white/5 text-white/50 hover:text-white border border-white/5'
                  }`}
                >
                  {t.stage} {i + 1}
                  {stages.length > 1 && (
                    <Trash2 
                        size={12} 
                        className="hover:text-red-500 transition-colors" 
                        onClick={(e) => { e.stopPropagation(); removeStage(i); }} 
                    />
                  )}
                </button>
              ))}
              <button 
                onClick={addStage}
                className="p-1.5 rounded-lg bg-white/5 text-[var(--cyan)] hover:bg-[var(--cyan)]/10 border border-[var(--cyan)]/20 transition-all flex items-center gap-1 text-[10px] font-mono px-2.5"
              >
                <Plus size={12} />
                <span>{t.stage}</span>
              </button>
            </div>

            {/* Active Stage Parameters */}
            <div className="p-5 rounded-2xl border border-white/5 bg-[var(--bg-1)]/60 space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-[var(--cyan)]">
                  {t.stageParams.replace('{stage}', (activeStageIdx + 1).toString())}
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded border text-[9px] font-mono font-bold ${
                    (activeStage.zr - activeStage.zs) % 2 === 0
                      ? 'bg-black/40 border-white/5 text-cyan-300'
                      : 'bg-red-500/20 border-red-500/40 text-red-300'
                  }`}>
                    Zp={((activeStage.zr - activeStage.zs) / 2).toFixed((activeStage.zr - activeStage.zs) % 2 === 0 ? 0 : 1)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/40 border border-white/5 text-[9px] font-mono text-white/50">
                    M={activeStage.m}
                  </span>
                </div>
              </div>

              <ControlSlider label={t.module} value={activeStage.m} min={0.5} max={10} step={0.1} unit="mm" onChange={(val: number) => updateActiveStage({ m: val })} />
              <ControlSlider label={t.sunTeeth} value={activeStage.zs} min={10} max={100} unit="Z" onChange={(val: number) => updateActiveStage({ zs: val })} />
              <ControlSlider label={t.ringTeeth} value={activeStage.zr} min={activeStage.zs + 10} max={300} unit="Z" onChange={(val: number) => updateActiveStage({ zr: val })} />
              <ControlSlider label={t.planetCount} value={activeStage.planetCount} min={1} max={8} unit="Qty" onChange={(val: number) => updateActiveStage({ planetCount: val })} />
              <ControlSlider label="Helix β" value={activeStage.helixAngle ?? 0} min={0} max={30} step={1} unit="°" onChange={(val: number) => updateActiveStage({ helixAngle: val })} />
              <ControlSlider label="Face width b" value={activeStage.faceWidth ?? 20} min={4} max={120} step={1} unit="mm" onChange={(val: number) => updateActiveStage({ faceWidth: val })} />
              {(activeStage.helixAngle ?? 0) > 0 && (
                <p className="text-[9px] font-mono text-emerald-400/80 leading-relaxed">
                  Helical planetary: mt = mn/cos(β) = {(activeStage.m / Math.cos(((activeStage.helixAngle || 0) * Math.PI) / 180)).toFixed(4)} mm.
                  Sun RH (+β), planets/ring LH (−β). Diameters d = mt·z. Ratio still zs/zr.
                </p>
              )}

              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="text-[9px] font-bold font-mono text-white/40 uppercase tracking-widest">{t.fixedComponent}</label>
                <div className="grid grid-cols-3 gap-1.5">
                    {(['RING_FIXED', 'SUN_FIXED', 'CARRIER_FIXED'] as GearboxMode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => updateActiveStage({ mode: m })}
                        className={`py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all ${
                        activeStage.mode === m ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 ' : 'bg-white/5 text-white/40 hover:text-white border border-white/5'
                        }`}
                    >
                        {m === 'RING_FIXED' ? t.ring : m === 'SUN_FIXED' ? t.sun : t.carrier}
                    </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Global Drive Input Params */}
            <div className="p-5 rounded-2xl border border-white/5 bg-[var(--bg-1)]/40 space-y-5">
                <div className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest border-b border-white/5 pb-2">
                  Drive System Inputs
                </div>
                <ControlSlider label={t.inputRpm} value={inputRPM} min={0} max={10000} step={100} unit="RPM" onChange={setInputRPM} />
                <ControlSlider label={t.inputPower} value={inputPower} min={0.1} max={500} step={0.5} unit="kW" onChange={setInputPower} />
            </div>
          </div>

          {/* Right Column: Visualization & Performance Characteristic */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* Technical Drawings Panel */}
            <GearboxSchematic stages={stageResults} activeStageIndex={activeStageIdx} />

            {/* Performance Characteristic Chart */}
            <div className="p-5 rounded-2xl border border-white/5 bg-[var(--bg-1)]/60">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-white/50 flex items-center gap-2">
                  <Activity size={14} className="text-[var(--cyan)]" />
                  {t.characteristic}
                </h3>
                <span className="text-[9px] font-mono text-cyan-400/70">
                  P = {inputPower} kW · Speed-Torque Envelope
                </span>
              </div>
              <div className="w-full h-[280px] min-h-[280px] min-w-0">
                <ResponsiveContainer width="100%" height={280} minWidth={100} minHeight={200}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradientSystem" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="rpm" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} label={{ value: t.outputSpeed, position: 'insideBottom', offset: -5, fontSize: 8, fill: 'rgba(255,255,255,0.3)' }} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a1018', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px', color: '#fff' }} />
                    <Area type="monotone" dataKey="torque" stroke="#00e5ff" strokeWidth={2.5} fill="url(#gradientSystem)" animationDuration={600} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {activeRating && (
              <div className="p-5 rounded-2xl border border-white/5 bg-[var(--bg-1)]/60 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-white/50">
                    ISO 6336 / AGMA 6123 — Active Stage
                  </h3>
                  <span className={`text-[10px] font-mono font-bold uppercase ${
                    activeRating.status === 'safe' ? 'text-emerald-400' : activeRating.status === 'marginal' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {activeRating.status} · {activeRating.criticalMesh}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono">
                  <div>
                    <div className="text-white/40 uppercase text-[9px] tracking-widest">η stage</div>
                    <div className="text-cyan-300 font-bold">{(activeRating.etaStage * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-white/40 uppercase text-[9px] tracking-widest">η system</div>
                    <div className="text-cyan-300 font-bold">{(etaTotal * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-white/40 uppercase text-[9px] tracking-widest">Kγ</div>
                    <div className="text-white font-bold">{formatEngineeringValue(activeRating.Kgamma, precision, true)}</div>
                  </div>
                  <div>
                    <div className="text-white/40 uppercase text-[9px] tracking-widest">Loss</div>
                    <div className="text-amber-300 font-bold">{formatEngineeringValue(powerLossKW, precision, true)} kW</div>
                  </div>
                  <div>
                    <div className="text-white/40 uppercase text-[9px] tracking-widest">Ft / planet</div>
                    <div className="text-white font-bold">{formatEngineeringValue(activeRating.Ft_planet, 0, true)} N</div>
                  </div>
                  <div>
                    <div className="text-white/40 uppercase text-[9px] tracking-widest">Fa sun</div>
                    <div className="text-white font-bold">{formatEngineeringValue(activeRating.Fa_sun, 0, true)} N</div>
                  </div>
                  <div>
                    <div className="text-white/40 uppercase text-[9px] tracking-widest">Sun–planet SF / SH</div>
                    <div className="text-white font-bold">{formatEngineeringValue(activeRating.sunPlanet.SF, precision, true)} / {formatEngineeringValue(activeRating.sunPlanet.SH, precision, true)}</div>
                  </div>
                  <div>
                    <div className="text-white/40 uppercase text-[9px] tracking-widest">Planet–ring SF / SH</div>
                    <div className="text-white font-bold">{formatEngineeringValue(activeRating.planetRing.SF, precision, true)} / {formatEngineeringValue(activeRating.planetRing.SH, precision, true)}</div>
                  </div>
                </div>
                {/* 3 Epicyclic Kinematic Verifications (DIN 3960 / ISO 21771) */}
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <div className="text-[10px] font-bold font-mono uppercase tracking-widest text-white/50">
                    Epicyclic Kinematic Verification (DIN 3960 / ISO 21771)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-mono">
                    {/* Check 1: Coaxial Condition */}
                    <div className={`p-2 rounded-lg border flex flex-col justify-between ${
                      activeRating.coaxialOk 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                        : 'bg-red-500/10 border-red-500/30 text-red-300'
                    }`}>
                      <div className="font-bold flex items-center justify-between">
                        <span>1. Coaxiality (Zr−Zs)</span>
                        <span>{activeRating.coaxialOk ? '✓ PASS' : '✗ FAIL'}</span>
                      </div>
                      <div className="text-[9px] opacity-80 mt-1">
                        {activeRating.coaxialOk 
                          ? `Zr−Zs=${activeRating.zr - activeRating.zs} (even → Zp=${activeRating.zp})` 
                          : `Zr−Zs=${activeRating.zr - activeRating.zs} is odd! Non-integer Zp.`}
                      </div>
                    </div>

                    {/* Check 2: Assembly / Spacing Condition */}
                    <div className={`p-2 rounded-lg border flex flex-col justify-between ${
                      activeRating.assemblyOk 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                        : 'bg-red-500/10 border-red-500/30 text-red-300'
                    }`}>
                      <div className="font-bold flex items-center justify-between">
                        <span>2. Spacing (Zs+Zr)/N</span>
                        <span>{activeRating.assemblyOk ? '✓ PASS' : '✗ FAIL'}</span>
                      </div>
                      <div className="text-[9px] opacity-80 mt-1">
                        {activeRating.assemblyOk 
                          ? `${activeRating.zs + activeRating.zr} / ${activeRating.N} = ${(activeRating.zs + activeRating.zr) / activeRating.N} (integer)` 
                          : `${activeRating.zs + activeRating.zr} / ${activeRating.N} remainder = ${activeRating.assemblyRemainder}`}
                      </div>
                    </div>

                    {/* Check 3: Adjacent Planet Tip Clearance */}
                    <div className={`p-2 rounded-lg border flex flex-col justify-between ${
                      activeRating.adjacentOk && activeRating.adjacentClearanceMm > 1.0
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : activeRating.adjacentOk
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-red-500/10 border-red-500/30 text-red-300'
                    }`}>
                      <div className="font-bold flex items-center justify-between">
                        <span>3. Planet Proximity</span>
                        <span>{activeRating.adjacentOk ? (activeRating.adjacentClearanceMm > 1 ? '✓ PASS' : '⚠ TIGHT') : '✗ COLLISION'}</span>
                      </div>
                      <div className="text-[9px] opacity-80 mt-1">
                        {activeRating.N <= 1 
                          ? 'Single planet (N=1)' 
                          : `Δc = ${activeRating.adjacentClearanceMm.toFixed(2)} mm ${activeRating.adjacentOk ? '' : '(Teeth overlap!)'}`}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] font-mono text-white/40 leading-relaxed">
                  Mesh power { (activeRating.meshPowerFraction * 100).toFixed(0)}% · coupling power {(activeRating.couplingPowerFraction * 100).toFixed(0)}%.
                  Hands: sun {activeRating.helixHands.sun}, planets/ring {activeRating.helixHands.planets}.
                </p>
              </div>
            )}

            {/* Technical Methodology Info Card */}
            <div className="flex items-start gap-3 p-4 rounded-xl border border-[var(--cyan)]/15 bg-[var(--cyan)]/5">
              <Info className="text-[var(--cyan)] shrink-0 mt-0.5" size={16} />
              <div className="text-[11px] space-y-1.5 font-mono text-white/70">
                <p>{t.infoText}</p>
                <div className="flex flex-wrap gap-4 text-[10px] text-cyan-300/80 pt-1">
                  <span>{t.totalRatio}: {stages.map((_, i) => `i${i+1}`).join(' × ')} = {totalRatio.toFixed(2)}</span>
                  <span>·</span>
                  <span>Planet Teeth: Zp = (Zr - Zs) / 2</span>
                  <span>·</span>
                  <span>Carrier Speed: nc = ns / (1 + Zr/Zs)</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
