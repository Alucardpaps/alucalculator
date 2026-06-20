'use client';

import React, { useState, useMemo } from 'react';
import { useWillisEquation, GearboxMode, StageConfig } from '@/hooks/useWillisEquation';
import { GearboxSchematic } from './gearbox/GearboxSchematic';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { Settings, Zap, RotateCcw, Activity, Shield, Info, Plus, Trash2 } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';

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

const LOCAL_DICTS: Record<string, any> = {
  tr: {
    title: "Planer Çok Kademeli",
    subtitle: "Mühendislik Zekası • Ekli Kademe Sayısı: {stagesLength}",
    systemRatio: "Sistem Oranı",
    outputRpm: "Çıkış Devri",
    totalTorque: "Toplam Tork",
    systemAdvantage: "Sistem Avantajı",
    lastStageRpm: "Son Kademe Devri",
    module: "Modül (m)",
    sunTeeth: "Güneş Diş Sayısı (zs)",
    ringTeeth: "Çember Diş Sayısı (zr)",
    planetCount: "Planet Sayısı",
    inputRpm: "Sistem Giriş Devri",
    inputPower: "Sistem Giriş Gücü",
    stageParams: "Kademe {stage} Parametreleri",
    fixedComponent: "Sabit Eleman",
    ring: "ÇEMBER",
    sun: "GÜNEŞ",
    carrier: "TAŞIYICI",
    characteristic: "Toplam Sistem Karakteristiği",
    infoText: "Çok kademeli hesaplamalar doğrudan kaplini (kayma olmadan) varsayar. Modül (m) mutlak geometrik çapı belirler D=m*Z.",
    totalRatio: "Toplam Oran",
    outputSpeed: "ÇIKIŞ HIZI",
    stage: "Kademe",
  },
  en: {
    title: "Planetary Multi-Stage",
    subtitle: "Engineering Intelligence • Stages Attached: {stagesLength}",
    systemRatio: "System Ratio",
    outputRpm: "Output RPM",
    totalTorque: "Total Torque",
    systemAdvantage: "System Advantage",
    lastStageRpm: "Last Stage RPM",
    module: "Module (m)",
    sunTeeth: "Sun Teeth (zs)",
    ringTeeth: "Ring Teeth (zr)",
    planetCount: "Planet Count",
    inputRpm: "System Input RPM",
    inputPower: "System Input Power",
    stageParams: "Stage {stage} Params",
    fixedComponent: "Fixed Component",
    ring: "RING",
    sun: "SUN",
    carrier: "CARRIER",
    characteristic: "Total System Characteristic",
    infoText: "Multi-stage calculations assume direct coupling (no intermediate slip). Module (m) determines absolute geometric diameter D=m*Z.",
    totalRatio: "Total Ratio",
    outputSpeed: "OUTPUT SPEED",
    stage: "Stage",
  },
  de: {
    title: "Planetengetriebe Mehrstufig",
    subtitle: "Engineering-Intelligenz • Angeschlossene Stufen: {stagesLength}",
    systemRatio: "Systemübersetzung",
    outputRpm: "Ausgangsdrehzahl",
    totalTorque: "Gesamtdrehmoment",
    systemAdvantage: "Systemvorteil",
    lastStageRpm: "Drehzahl Letzte Stufe",
    module: "Modul (m)",
    sunTeeth: "Sonnenzähne (zs)",
    ringTeeth: "Hohlradzähne (zr)",
    planetCount: "Planetenanzahl",
    inputRpm: "System-Eingangsdrehzahl",
    inputPower: "System-Eingangsleistung",
    stageParams: "Parameter Stufe {stage}",
    fixedComponent: "Festes Bauteil",
    ring: "HOHLRAD",
    sun: "SONNE",
    carrier: "TRÄGER",
    characteristic: "Gesamtsystem-Charakteristik",
    infoText: "Mehrstufige Berechnungen setzen eine direkte Kopplung (kein Schlupf) voraus. Modul (m) bestimmt den absoluten geometrischen Durchmesser D=m*Z.",
    totalRatio: "Gesamtübersetzung",
    outputSpeed: "AUSGANGSDREHZAHL",
    stage: "Stufe",
  },
  ja: {
    title: "遊星マルチステージ",
    subtitle: "エンジニアリングインテリジェンス • 接続されたステージ: {stagesLength}",
    systemRatio: "システム比",
    outputRpm: "出力回転数",
    totalTorque: "総トルク",
    systemAdvantage: "システムアドバンテージ",
    lastStageRpm: "最終ステージ回転数",
    module: "モジュール (m)",
    sunTeeth: "太陽歯車歯数 (zs)",
    ringTeeth: "内歯車歯数 (zr)",
    planetCount: "遊星ギヤ数",
    inputRpm: "システム入力回転数",
    inputPower: "システム入力電力",
    stageParams: "ステージ {stage} パラメータ",
    fixedComponent: "固定要素",
    ring: "リング",
    sun: "サン",
    carrier: "キャリア",
    characteristic: "トータルシステム特性",
    infoText: "多段計算は直接結合（中間スリップなし）を前提としています。モジュール（m）は絶対幾何直径D=m*Zを決定します。",
    totalRatio: "総比",
    outputSpeed: "出力速度",
    stage: "ステージ",
  }
};

// ════════════════════════════════════════════
// UI COMPONENTS
// ════════════════════════════════════════════

const DataDisplay = ({ label, value, unit, icon: Icon, color = COLORS.accent }: any) => (
  <div className="relative group overflow-hidden bg-[#0a1018] border border-white/5 rounded-xl p-4 transition-all hover:border-[#00e5ff]/30">
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
      className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#00e5ff] hover:accent-white transition-all"
      suppressHydrationWarning
    />
  </div>
);

// ════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════

export const PlanetaryCalculator = () => {
  const { language } = useI18nStore();
  const t = LOCAL_DICTS[language] || LOCAL_DICTS.en;

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
              Planetary <span className="text-[#00e5ff]">Multi-Stage</span>
            </h1>
            <p className="text-[10px] font-mono tracking-[0.3em] text-white/30 uppercase">
              {t.subtitle.replace('{stagesLength}', stages.length.toString())}
            </p>
          </div>
          
          <div className="flex gap-4">
            <DataDisplay label={t.systemRatio} value={totalRatio.toFixed(2)} unit="" icon={Activity} />
            <DataDisplay label={t.outputRpm} value={Math.abs(outputRPM).toFixed(0)} unit="RPM" icon={RotateCcw} />
          </div>
        </div>

        {/* Technical Drawings Panel */}
        <div className="p-4 bg-[#0a1018]/10 border border-[#00e5ff]/20 rounded-2xl">
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
                    activeStageIdx === i ? 'bg-[#00e5ff] text-black shadow-[0_0_15px_rgba(0,229,255,0.3)]' : 'bg-white/5 text-white/40 border border-white/5'
                  }`}
                >
                  {t.stage} {i + 1}
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
                className="p-2 rounded-lg bg-white/5 text-[#00e5ff] hover:bg-[#00e5ff]/10 border border-[#00e5ff]/20 transition-all"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Params for Active Stage */}
            <div className="relative p-6 rounded-2xl border border-white/5 bg-[#0a1018]/30 backdrop-blur-xl space-y-8">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#00e5ff]">
                  {t.stageParams.replace('{stage}', (activeStageIdx + 1).toString())}
                </h3>
                <div className="px-2 py-1 rounded bg-black/40 text-[9px] font-mono text-white/30">M={activeStage.m}</div>
              </div>

              <ControlSlider label={t.module} value={activeStage.m} min={0.5} max={10} step={0.1} unit="mm" onChange={(val: number) => updateActiveStage({ m: val })} />
              <ControlSlider label={t.sunTeeth} value={activeStage.zs} min={10} max={100} unit="Z" onChange={(val: number) => updateActiveStage({ zs: val })} />
              <ControlSlider label={t.ringTeeth} value={activeStage.zr} min={activeStage.zs + 10} max={300} unit="Z" onChange={(val: number) => updateActiveStage({ zr: val })} />
              <ControlSlider label={t.planetCount} value={activeStage.planetCount} min={1} max={10} unit="Qty" onChange={(val: number) => updateActiveStage({ planetCount: val })} />

              <div className="space-y-2 pt-2">
                <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{t.fixedComponent}</label>
                <div className="flex gap-2">
                    {(['RING_FIXED', 'SUN_FIXED', 'CARRIER_FIXED'] as GearboxMode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => updateActiveStage({ mode: m })}
                        className={`flex-1 py-1.5 rounded-md text-[8px] font-bold uppercase transition-all ${
                        activeStage.mode === m ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-white/5 text-white/30 border border-white/5'
                        }`}
                    >
                        {m === 'RING_FIXED' ? t.ring : m === 'SUN_FIXED' ? t.sun : t.carrier}
                    </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Global Input Params */}
            <div className="p-6 rounded-2xl border border-white/5 bg-[#0a1018]/10 space-y-6">
                <ControlSlider label={t.inputRpm} value={inputRPM} min={0} max={10000} step={100} unit="RPM" onChange={setInputRPM} />
                <ControlSlider label={t.inputPower} value={inputPower} min={0.1} max={500} step={1} unit="kW" onChange={setInputPower} />
            </div>
          </div>

          {/* Right Column: Visualization Metrics */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DataDisplay label={t.totalTorque} value={outputTorque.toFixed(1)} unit="Nm" icon={Zap} />
              <DataDisplay label={t.systemAdvantage} value={mechanicalAdvantage.toFixed(2)} unit="x" icon={Shield} />
              <DataDisplay label={t.lastStageRpm} value={Math.abs(outputRPM).toFixed(1)} unit="RPM" icon={Activity} />
            </div>

            <div className="p-6 rounded-2xl border border-white/5 bg-[#0a1018]/30 backdrop-blur-xl h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <Activity size={14} className="text-[#00e5ff]" />
                  {t.characteristic}
                </h3>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradientSystem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="rpm" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} label={{ value: t.outputSpeed, position: 'insideBottom', offset: -5, fontSize: 8, fill: 'rgba(255,255,255,0.2)' }} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a1018', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="torque" stroke="#00e5ff" strokeWidth={3} fill="url(#gradientSystem)" animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl border border-[#00e5ff]/10 bg-[#00e5ff]/5">
              <Info className="text-[#00e5ff] shrink-0" size={16} />
              <div className="text-[10px] space-y-2 font-mono text-white/60">
                <p>{t.infoText}</p>
                <div className="flex gap-4 opacity-50">
                    <span>{t.totalRatio} = {stages.map((_, i) => `i${i+1}`).join(' × ')}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
