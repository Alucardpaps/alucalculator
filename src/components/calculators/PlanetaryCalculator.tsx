'use client';

import React, { useState, useMemo } from 'react';
import { useWillisEquation, GearboxMode, StageConfig } from '@/hooks/useWillisEquation';
import { GearboxSchematic } from './gearbox/GearboxSchematic';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { Settings, Zap, RotateCcw, Activity, Shield, Info, Plus, Trash2 } from 'lucide-react';

// ════════════════════════════════════════════
// CONSTANTS & STYLES
// ════════════════════════════════════════════

const COLORS = {
  bg: '#0B0C10',
  panel: '#1F2833',
  text: '#C5C6C7',
  accent: '#66FCF1',
  accentDim: 'rgba(102, 252, 241, 0.2)',
  glow: 'rgba(102, 252, 241, 0.4)',
  danger: '#ff4d4d',
};

// ════════════════════════════════════════════
// UI COMPONENTS
// ════════════════════════════════════════════

const DataDisplay = ({ label, value, unit, icon: Icon, color = COLORS.accent }: any) => (
  <div className="relative group overflow-hidden bg-[#0F131A] border border-white/5 rounded-xl p-4 transition-all hover:border-[#66FCF1]/30">
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
      className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#66FCF1] hover:accent-white transition-all"
      suppressHydrationWarning
    />
  </div>
);

// ════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════

export const PlanetaryCalculator = () => {
  // Multistage State
  const [stages, setStages] = useState<StageConfig[]>([
    { id: '1', zs: 20, zr: 60, m: 2, planetCount: 3, mode: 'RING_FIXED' }
  ]);
  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [inputRPM, setInputRPM] = useState(1500);
  const [inputPower, setInputPower] = useState(5.5);

  // Math Hook
  const { stageResults, outputRPM, outputTorque, totalRatio, mechanicalAdvantage } = useWillisEquation({
    stages, inputRPM, inputPowerKW: inputPower
  });

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
      mode: 'RING_FIXED'
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
    <div className="min-h-screen p-6 font-sans overflow-x-hidden" style={{ background: COLORS.bg, color: COLORS.text }}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">
              Planetary <span className="text-[#66FCF1]">Multi-Stage</span>
            </h1>
            <p className="text-[10px] font-mono tracking-[0.3em] text-white/30 uppercase">
              Engineering Intelligence • Stages Attached: {stages.length}
            </p>
          </div>
          
          <div className="flex gap-4">
            <DataDisplay label="System Ratio" value={totalRatio.toFixed(2)} unit="" icon={Activity} />
            <DataDisplay label="Output RPM" value={Math.abs(outputRPM).toFixed(0)} unit="RPM" icon={RotateCcw} />
          </div>
        </div>

        {/* Technical Drawings Panel */}
        <div className="p-4 bg-[#1F2833]/10 border border-[#66FCF1]/20 rounded-2xl">
          <GearboxSchematic stages={stageResults} activeStageIndex={activeStageIdx} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Stage Management */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Stage Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {stages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStageIdx(i)}
                  className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-2 shrink-0 ${
                    activeStageIdx === i ? 'bg-[#66FCF1] text-black shadow-[0_0_15px_rgba(102,252,241,0.3)]' : 'bg-white/5 text-white/40 border border-white/5'
                  }`}
                >
                  Stage {i + 1}
                  {stages.length > 1 && (
                    <Trash2 
                        size={10} 
                        className="hover:text-red-500 transition-colors" 
                        onClick={(e) => { e.stopPropagation(); removeStage(i); }} 
                    />
                  )}
                </button>
              ))}
              <button 
                onClick={addStage}
                className="p-2 rounded-lg bg-white/5 text-[#66FCF1] hover:bg-[#66FCF1]/10 border border-[#66FCF1]/20 transition-all"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Params for Active Stage */}
            <div className="relative p-6 rounded-2xl border border-white/5 bg-[#1F2833]/30 backdrop-blur-xl space-y-8">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#66FCF1]">Stage {activeStageIdx + 1} Params</h3>
                <div className="px-2 py-1 rounded bg-black/40 text-[9px] font-mono text-white/30">M={activeStage.m}</div>
              </div>

              <ControlSlider label="Module (m)" value={activeStage.m} min={0.5} max={10} step={0.1} unit="mm" onChange={(val: number) => updateActiveStage({ m: val })} />
              <ControlSlider label="Sun Teeth (zs)" value={activeStage.zs} min={10} max={100} unit="Z" onChange={(val: number) => updateActiveStage({ zs: val })} />
              <ControlSlider label="Ring Teeth (zr)" value={activeStage.zr} min={activeStage.zs + 10} max={300} unit="Z" onChange={(val: number) => updateActiveStage({ zr: val })} />
              <ControlSlider label="Planet Count" value={activeStage.planetCount} min={1} max={10} unit="Qty" onChange={(val: number) => updateActiveStage({ planetCount: val })} />

              <div className="space-y-2 pt-2">
                <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Fixed Component</label>
                <div className="flex gap-2">
                    {(['RING_FIXED', 'SUN_FIXED', 'CARRIER_FIXED'] as GearboxMode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => updateActiveStage({ mode: m })}
                        className={`flex-1 py-1.5 rounded-md text-[8px] font-bold uppercase transition-all ${
                        activeStage.mode === m ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-white/5 text-white/30 border border-white/5'
                        }`}
                    >
                        {m.split('_')[0]}
                    </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Global Input Params */}
            <div className="p-6 rounded-2xl border border-white/5 bg-[#1F2833]/10 space-y-6">
                <ControlSlider label="System Input RPM" value={inputRPM} min={0} max={10000} step={100} unit="RPM" onChange={setInputRPM} />
                <ControlSlider label="System Input Power" value={inputPower} min={0.1} max={500} step={1} unit="kW" onChange={setInputPower} />
            </div>
          </div>

          {/* Right Column: Visualization Metrics */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DataDisplay label="Total Torque" value={outputTorque.toFixed(1)} unit="Nm" icon={Zap} />
              <DataDisplay label="System Advantage" value={mechanicalAdvantage.toFixed(2)} unit="x" icon={Shield} />
              <DataDisplay label="Last Stage RPM" value={Math.abs(outputRPM).toFixed(1)} unit="RPM" icon={Activity} />
            </div>

            <div className="p-6 rounded-2xl border border-white/5 bg-[#1F2833]/30 backdrop-blur-xl h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <Activity size={14} className="text-[#66FCF1]" />
                  Total System Characteristic
                </h3>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradientSystem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#66FCF1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#66FCF1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="rpm" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'OUTPUT SPEED', position: 'insideBottom', offset: -5, fontSize: 8, fill: 'rgba(255,255,255,0.2)' }} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F131A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="torque" stroke="#66FCF1" strokeWidth={3} fill="url(#gradientSystem)" animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl border border-[#66FCF1]/10 bg-[#66FCF1]/5">
              <Info className="text-[#66FCF1] shrink-0" size={16} />
              <div className="text-[10px] space-y-2 font-mono text-white/60">
                <p>Multi-stage calculations assume direct coupling (no intermediate slip). Module (m) determines absolute geometric diameter D=m*Z.</p>
                <div className="flex gap-4 opacity-50">
                    <span>Total Ratio = {stages.map((_, i) => `i${i+1}`).join(' × ')}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
