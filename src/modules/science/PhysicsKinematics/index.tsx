'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Rocket, Target, Move, Activity, 
    Zap, Compass, MousePointer2, Settings,
    Play, Pause, RotateCcw, Box, 
    ArrowUpRight, Gauge
} from 'lucide-react';
import { KinematicsEngine, KinematicsResult } from '@/engine/science/KinematicsEngine';
import { useI18nStore } from '@/store/i18nStore';

const LOCAL_DICTS: Record<string, any> = {
  tr: {
    title: "Kinematik Düğümü",
    subtitle: "PHYS-CORE v4.1",
    initialVelocity: "İlk Hız",
    launchAngle: "Fırlatma Açısı",
    gravity: "Yerçekimi",
    airDrag: "Hava Sürtünmesi (k/m)",
    projectileMass: "Cisim Kütlesi",
    vectorAnalysis: "Vektör Analizi",
    velocityVector: "Hız Vektörü",
    accelerationVector: "İvme Vektörü",
    displacement: "Deplasman",
    computeTrajectory: "Yörünge Hesapla",
    computing: "Hesaplanıyor...",
    tabTrajectory: "Yörünge",
    tabForces: "Kuvvetler",
    tabKineticEnergy: "Kinetik Enerji",
    solverRunning: "Çözücü: Çalışıyor",
    solverReady: "Çözücü: Hazır",
    xAxisLabel: "X-EKSENİ / ERİM (0 - {range}m)",
    yAxisLabel: "Y-EKSENİ / İRTİFA (0 - {height}m)",
    targetVector: "Hedef Vektörü",
    dragAdjusted: "Sürtünmeye göre ayarlanmış yörünge",
    timeOfFlight: "Uçuş Süresi",
    maxAltitude: "Maks. İrtifa",
    impactVelocity: "Çarpma Hızı",
    airDragConstraint: "Hava Sürtünme Sınırı",
    energyBalance: "Enerji Dengesi",
    kineticEnergy: "KİNETİK ENERJİ (KE)",
    potentialEnergy: "POTANSİYEL ENERJİ (PE)",
    totalMechanical: "TOPLAM MEKANİK (E)",
    dragWorkLoss: "SÜRTÜNME İŞ KAYBI",
    simTime: "Sim Süresi"
  },
  en: {
    title: "Kinematics Node",
    subtitle: "PHYS-CORE v4.1",
    initialVelocity: "Initial Velocity",
    launchAngle: "Launch Angle",
    gravity: "Gravity",
    airDrag: "Air Drag (k/m)",
    projectileMass: "Projectile Mass",
    vectorAnalysis: "Vector Analysis",
    velocityVector: "Velocity Vector",
    accelerationVector: "Acceleration Vector",
    displacement: "Displacement",
    computeTrajectory: "Compute Trajectory",
    computing: "Computing...",
    tabTrajectory: "Trajectory",
    tabForces: "Forces",
    tabKineticEnergy: "Kinetic Energy",
    solverRunning: "Solver: Running",
    solverReady: "Solver: Ready",
    xAxisLabel: "X-AXIS / RANGE (0 to {range}m)",
    yAxisLabel: "Y-AXIS / ALTITUDE (0 to {height}m)",
    targetVector: "Target Vector",
    dragAdjusted: "Drag-adjusted trajectory mapped",
    timeOfFlight: "Time of flight",
    maxAltitude: "Max Altitude",
    impactVelocity: "Impact Velocity",
    airDragConstraint: "Air Drag Constraint",
    energyBalance: "Energy Balance",
    kineticEnergy: "KINETIC ENERGY (KE)",
    potentialEnergy: "POTENTIAL ENERGY (PE)",
    totalMechanical: "TOTAL MECHANICAL (E)",
    dragWorkLoss: "DRAG WORK LOSS",
    simTime: "Sim Time"
  },
  de: {
    title: "Kinematik-Knoten",
    subtitle: "PHYS-CORE v4.1",
    initialVelocity: "Anfangsgeschwindigkeit",
    launchAngle: "Abwurfwinkel",
    gravity: "Schwerkraft",
    airDrag: "Luftwiderstand (k/m)",
    projectileMass: "Projektilmasse",
    vectorAnalysis: "Vektoranalise",
    velocityVector: "Geschwindigkeitsvektor",
    accelerationVector: "Beschleunigungsvektor",
    displacement: "Verschiebung",
    computeTrajectory: "Trajektorie Berechnen",
    computing: "Berechne...",
    tabTrajectory: "Trajektorie",
    tabForces: "Kräfte",
    tabKineticEnergy: "Kinetische Energie",
    solverRunning: "Löser: Läuft",
    solverReady: "Löser: Bereit",
    xAxisLabel: "X-ACHSE / REICHWEITE (0 bis {range}m)",
    yAxisLabel: "Y-ACHSE / HÖHE (0 bis {height}m)",
    targetVector: "Zielvektor",
    dragAdjusted: "Widerstandsangepasste Trajektorie",
    timeOfFlight: "Flugzeit",
    maxAltitude: "Max. Höhe",
    impactVelocity: "Aufprallgeschwindigkeit",
    airDragConstraint: "Luftwiderstandsbegrenzung",
    energyBalance: "Energiebilanz",
    kineticEnergy: "KINETISCHE ENERGIE (KE)",
    potentialEnergy: "POTENZIELLE ENERGIE (PE)",
    totalMechanical: "GESAMTMECHANISCH (E)",
    dragWorkLoss: "WIDERSTANDSARBEITSVERLUST",
    simTime: "Simulationszeit"
  },
  ja: {
    title: "運動学ノード",
    subtitle: "PHYS-CORE v4.1",
    initialVelocity: "初速度",
    launchAngle: "射出角度",
    gravity: "重力",
    airDrag: "空気抵抗 (k/m)",
    projectileMass: "発射体質量",
    vectorAnalysis: "ベクトル分析",
    velocityVector: "速度ベクトル",
    accelerationVector: "加速度ベクトル",
    displacement: "変位",
    computeTrajectory: "軌道計算",
    computing: "計算中...",
    tabTrajectory: "弾道軌道",
    tabForces: "力分析",
    tabKineticEnergy: "運動エネルギー",
    solverRunning: "ソルバー: 実行中",
    solverReady: "ソルバー: 準備完了",
    xAxisLabel: "X軸 / 射程距離 (0 〜 {range}m)",
    yAxisLabel: "Y軸 / 高度 (0 〜 {height}m)",
    targetVector: "ターゲットベクトル",
    dragAdjusted: "空気抵抗調整済みの軌道マッピング",
    timeOfFlight: "飛行時間",
    maxAltitude: "最高高度",
    impactVelocity: "衝突速度",
    airDragConstraint: "空気抵抗制約",
    energyBalance: "エネルギー収支",
    kineticEnergy: "運動エネルギー (KE)",
    potentialEnergy: "位置エネルギー (PE)",
    totalMechanical: "全機械的エネルギー (E)",
    dragWorkLoss: "ドラッグワークロス",
    simTime: "シミュレーション時間"
  }
};

export default function PhysicsKinematics() {
    const { language } = useI18nStore();
    const t = LOCAL_DICTS[language] || LOCAL_DICTS.en;

    const [isSimulating, setIsSimulating] = useState(false);
    const [vectorOverlay, setVectorOverlay] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'Trajectory' | 'Forces' | 'Kinetic Energy'>('Trajectory');
    
    // Physics Parameters State
    const [v0, setV0] = useState(45);
    const [angle, setAngle] = useState(32);
    const [g, setG] = useState(9.81);
    const [k, setK] = useState(0.012);
    const [mass, setMass] = useState(1.0);
    
    // Animation Playback State
    const [simTime, setSimTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playSpeed, setPlaySpeed] = useState(1);

    // Results
    const [result, setResult] = useState<KinematicsResult | null>(null);

    // Initial Load - calculate default path
    useEffect(() => {
        handleCompute();
    }, []);

    const handleCompute = () => {
        setIsSimulating(true);
        setIsPlaying(false);
        setSimTime(0);
        const data = KinematicsEngine.computeTrajectory({
            v0: Number(v0),
            angle: Number(angle),
            g: Number(g),
            k: Number(k),
            y0: 0
        });
        
        setResult(data);
        
        // Small delay just to show simulation active state cleanly
        setTimeout(() => {
            setIsSimulating(false);
        }, 500);
    };

    // Simulation tick animation
    useEffect(() => {
        if (!isPlaying || !result || result.path.length === 0) return;
        const interval = setInterval(() => {
            setSimTime(prev => {
                const next = prev + 0.02 * playSpeed;
                if (next >= result.timeOfFlight) {
                    setIsPlaying(false);
                    return result.timeOfFlight;
                }
                return next;
            });
        }, 20);
        return () => clearInterval(interval);
    }, [isPlaying, playSpeed, result]);

    // Current point on trajectory
    const currentPoint = useMemo(() => {
        if (!result || result.path.length === 0) return null;
        let closest = result.path[0];
        let minDiff = Math.abs(closest.t - simTime);
        for (const p of result.path) {
            const diff = Math.abs(p.t - simTime);
            if (diff < minDiff) {
                minDiff = diff;
                closest = p;
            }
        }
        return closest;
    }, [result, simTime]);

    // Energy metrics calculations
    const energyData = useMemo(() => {
        if (!currentPoint) return { ke: 0, pe: 0, total: 0, loss: 0, max: 1 };
        const vSq = currentPoint.vx * currentPoint.vx + currentPoint.vy * currentPoint.vy;
        const ke = 0.5 * mass * vSq;
        const pe = mass * g * currentPoint.y;
        const total = ke + pe;
        
        // Initial energy at t = 0
        const initialVSq = v0 * v0;
        const initialPE = 0; 
        const initialTotal = 0.5 * mass * initialVSq + initialPE;
        const loss = Math.max(0, initialTotal - total);
        
        return { ke, pe, total, loss, max: initialTotal };
    }, [currentPoint, mass, g, v0]);

    // Calculate dynamic SVG path string
    const svgPath = useMemo(() => {
        if (!result || result.path.length === 0) return "M 0 0";
        
        // Find maximums for scaling
        const maxX = Math.max(result.range, 10);
        const maxY = Math.max(result.maxHeight, 10);
        
        // SVG Viewbox dimensions
        const pathData = result.path.map((p, i) => {
            const mappedX = (p.x / maxX) * 800; 
            const mappedY = 500 - (p.y / maxY) * 500; // Invert Y for SVG coordinates
            return `${i === 0 ? 'M' : 'L'} ${mappedX} ${mappedY}`;
        });
        
        return pathData.join(" ");
    }, [result]);

    const getVectorItemLocalName = (item: string) => {
        if (item === 'Velocity Vector') return t.velocityVector;
        if (item === 'Acceleration Vector') return t.accelerationVector;
        if (item === 'Displacement') return t.displacement;
        return item;
    };

    return (
        <div className="flex w-full h-full bg-[#03060a] text-white overflow-hidden relative">
            {/* LEFT SIDEBAR: Parameters & Config */}
            <div className="w-[300px] bg-[#080b11] border-r border-white/5 flex flex-col z-20 shadow-2xl relative">
                <div className="p-6 border-b border-white/5 bg-gradient-to-b from-blue-500/5 to-transparent">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                            <Rocket className="text-blue-400" size={22} />
                        </div>
                        <div>
                            <h1 className="text-sm font-black tracking-widest uppercase italic">{t.title}</h1>
                            <div className="text-[10px] text-blue-500/50 font-mono tracking-widest leading-none">{t.subtitle}</div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Interactive Parameters */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Zap size={10}/> {t.initialVelocity}</span>
                                <span className="text-[10px] font-mono text-blue-400">{v0} m/s</span>
                            </div>
                            <input type="range" min="1" max="150" value={v0} onChange={(e) => setV0(e.target.valueAsNumber)} className="w-full accent-blue-500" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><ArrowUpRight size={10}/> {t.launchAngle}</span>
                                <span className="text-[10px] font-mono text-blue-400">{angle}°</span>
                            </div>
                            <input type="range" min="1" max="89" value={angle} onChange={(e) => setAngle(e.target.valueAsNumber)} className="w-full accent-blue-500" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Box size={10}/> {t.gravity}</span>
                                <span className="text-[10px] font-mono text-blue-400">{g} m/s²</span>
                            </div>
                            <input type="range" min="1" max="25" step="0.1" value={g} onChange={(e) => setG(e.target.valueAsNumber)} className="w-full accent-blue-500" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Compass size={10}/> {t.airDrag}</span>
                                <span className="text-[10px] font-mono text-blue-400">{k}</span>
                            </div>
                            <input type="range" min="0" max="0.1" step="0.001" value={k} onChange={(e) => setK(e.target.valueAsNumber)} className="w-full accent-blue-500" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Activity size={10}/> {t.projectileMass}</span>
                                <span className="text-[10px] font-mono text-blue-400">{mass.toFixed(1)} kg</span>
                            </div>
                            <input type="range" min="0.1" max="10.0" step="0.1" value={mass} onChange={(e) => setMass(e.target.valueAsNumber)} className="w-full accent-blue-500" />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">{t.vectorAnalysis}</h3>
                    <div className="space-y-3">
                        {['Velocity Vector', 'Acceleration Vector', 'Displacement'].map((item, i) => (
                            <button
                                key={i}
                                onClick={() => setVectorOverlay(prev => prev === item ? null : item)}
                                className={`w-full p-4 border rounded-2xl flex items-center justify-between transition-all group ${
                                    vectorOverlay === item
                                        ? 'bg-blue-500/10 border-blue-500/30'
                                        : 'bg-white/[0.02] border-white/5 hover:bg-blue-500/5 hover:border-blue-500/20'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center ${
                                        vectorOverlay === item ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'
                                    }`}>
                                        <Move size={14} />
                                    </div>
                                    <span className={`text-[11px] font-bold transition-colors uppercase italic ${
                                        vectorOverlay === item ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'
                                    }`}>{getVectorItemLocalName(item)}</span>
                                </div>
                                <Activity size={12} className={vectorOverlay === item ? 'text-blue-400' : 'text-slate-700'} />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-blue-500/5 border-t border-white/5">
                    <button 
                        onClick={handleCompute}
                        disabled={isSimulating}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black tracking-[0.2em] uppercase rounded-xl shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                        {isSimulating ? <RotateCcw size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />} 
                        {isSimulating ? t.computing : t.computeTrajectory}
                    </button>
                </div>
            </div>

            {/* MAIN AREA: Ballistics Canvas */}
            <div className="flex-1 flex flex-col relative z-10">
                {/* Visualizer Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#03060a_100%)]" />

                <div className="h-16 border-b border-white/5 bg-[#080b11]/80 backdrop-blur-xl px-8 flex items-center justify-between z-20">
                    <div className="flex items-center gap-6">
                        {['Trajectory', 'Forces', 'Kinetic Energy'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors border-b-2 pb-1 ${
                                    activeTab === tab ? 'text-blue-400 border-blue-400' : 'text-slate-500 border-transparent hover:text-white'
                                }`}
                            >
                                {tab === 'Trajectory' ? t.tabTrajectory : tab === 'Forces' ? t.tabForces : t.tabKineticEnergy}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg">
                            <div className={`w-1.5 h-1.5 rounded-full ${isSimulating ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
                            <span className={`text-[10px] font-mono uppercase ${isSimulating ? 'text-amber-500/70' : 'text-emerald-500/70'}`}>
                                {isSimulating ? t.solverRunning : t.solverReady}
                            </span>
                        </div>
                        <Settings size={16} className="text-slate-500 cursor-pointer hover:text-white transition-colors" />
                    </div>
                </div>

                <div className="flex-1 p-12 relative flex items-center justify-center overflow-hidden z-10">
                    {/* Simulated Path Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center p-20">                          
                        <div className="w-full h-full max-w-4xl max-h-[600px] border-l-2 border-b-2 border-slate-700/50 relative bg-black/20 rounded-tr-3xl backdrop-blur-sm">
                              {/* Playback Controls Overlay */}
                              <div className="absolute top-4 left-4 bg-black/80 border border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-4 z-30 backdrop-blur-md">
                                  <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition-colors">
                                      {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                                  </button>
                                  <button onClick={() => setSimTime(0)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors">
                                      <RotateCcw size={14} />
                                  </button>
                                  <div className="flex flex-col min-w-[70px]">
                                      <span className="text-[8px] font-black text-slate-500 uppercase leading-none">{t.simTime}</span>
                                      <span className="text-[10px] font-mono text-white mt-1">{(simTime).toFixed(2)}s</span>
                                  </div>
                                  <input 
                                      type="range" 
                                      min="0" 
                                      max={result?.timeOfFlight || 0} 
                                      step="0.01" 
                                      value={simTime} 
                                      onChange={(e) => { setSimTime(parseFloat(e.target.value)); setIsPlaying(false); }} 
                                      className="w-24 accent-blue-500 cursor-pointer" 
                                  />
                                  <select 
                                      value={playSpeed} 
                                      onChange={(e) => setPlaySpeed(parseFloat(e.target.value))} 
                                      className="bg-black/80 border border-white/10 text-white text-[9px] font-bold rounded px-1.5 py-0.5 outline-none cursor-pointer"
                                  >
                                      <option value="0.25">0.25x</option>
                                      <option value="0.5">0.5x</option>
                                      <option value="1">1.0x</option>
                                      <option value="2">2.0x</option>
                                  </select>
                              </div>

                              {/* Kinetic Energy conservation dashboard */}
                              {activeTab === 'Kinetic Energy' && (
                                  <div className="absolute top-4 right-4 bg-black/80 border border-white/10 p-4 rounded-2xl flex flex-col gap-2.5 z-30 backdrop-blur-md w-56">
                                      <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1">{t.energyBalance}</div>
                                      
                                      <div className="space-y-1">
                                          <div className="flex justify-between text-[8px] font-mono text-cyan-400">
                                              <span>{t.kineticEnergy}</span>
                                              <span>{energyData.ke.toFixed(1)} J</span>
                                          </div>
                                          <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                              <div className="h-full bg-cyan-400 transition-all duration-75" style={{ width: `${Math.min(100, (energyData.ke / (energyData.max || 1)) * 100)}%` }} />
                                          </div>
                                      </div>

                                      <div className="space-y-1">
                                          <div className="flex justify-between text-[8px] font-mono text-emerald-400">
                                              <span>{t.potentialEnergy}</span>
                                              <span>{energyData.pe.toFixed(1)} J</span>
                                          </div>
                                          <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                              <div className="h-full bg-emerald-400 transition-all duration-75" style={{ width: `${Math.min(100, (energyData.pe / (energyData.max || 1)) * 100)}%` }} />
                                          </div>
                                      </div>

                                      <div className="space-y-1">
                                          <div className="flex justify-between text-[8px] font-mono text-violet-400">
                                              <span>{t.totalMechanical}</span>
                                              <span>{energyData.total.toFixed(1)} J</span>
                                          </div>
                                          <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                              <div className="h-full bg-violet-400 transition-all duration-75" style={{ width: `${Math.min(100, (energyData.total / (energyData.max || 1)) * 100)}%` }} />
                                          </div>
                                      </div>

                                      <div className="space-y-1">
                                          <div className="flex justify-between text-[8px] font-mono text-amber-400">
                                              <span>{t.dragWorkLoss}</span>
                                              <span>{energyData.loss.toFixed(1)} J</span>
                                          </div>
                                          <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                              <div className="h-full bg-amber-400 transition-all duration-75" style={{ width: `${Math.min(100, (energyData.loss / (energyData.max || 1)) * 100)}%` }} />
                                          </div>
                                      </div>
                                  </div>
                              )}

                              {/* Arc Simulation */}
                              <svg viewBox="0 -50 850 600" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full overflow-visible drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                  <motion.path 
                                     key={svgPath}
                                     d={svgPath} 
                                     fill="none" 
                                     stroke="url(#arcGradient)" 
                                     strokeWidth="3" 
                                     strokeDasharray="10 5"
                                     initial={{ pathLength: 0 }}
                                     animate={{ pathLength: 1 }}
                                     transition={{ duration: 1.5, ease: "easeOut" }}
                                  />

                                  {/* Moving Projectile Circle */}
                                  {currentPoint && result && (() => {
                                      const maxX = Math.max(result.range, 10);
                                      const maxY = Math.max(result.maxHeight, 10);
                                      const px = (currentPoint.x / maxX) * 800;
                                      const py = 500 - (currentPoint.y / maxY) * 500;
                                      return (
                                          <circle cx={px} cy={py} r="8" fill="#60a5fa" className="drop-shadow-[0_0_8px_#3b82f6] animate-pulse" />
                                      );
                                  })()}

                                  {/* Free Body Vector Force Diagram */}
                                  {activeTab === 'Forces' && currentPoint && result && (() => {
                                      const maxX = Math.max(result.range, 10);
                                      const maxY = Math.max(result.maxHeight, 10);
                                      const px = (currentPoint.x / maxX) * 800;
                                      const py = 500 - (currentPoint.y / maxY) * 500;
                                      
                                      // Scale forces for drawing
                                      const fgVal = mass * g;
                                      const vMag = Math.sqrt(currentPoint.vx * currentPoint.vx + currentPoint.vy * currentPoint.vy);
                                      const fdVal = k * vMag * mass;
                                      
                                      // Scale arrow length
                                      const fgLen = Math.min(fgVal * 4, 100);
                                      const fdLen = Math.min(fdVal * 50, 100);
                                      
                                      const angleRad = Math.atan2(currentPoint.vy, currentPoint.vx);
                                      const fdx = -Math.cos(angleRad) * fdLen;
                                      const fdy = Math.sin(angleRad) * fdLen; 
                                      
                                      return (
                                          <g>
                                              {/* Gravity Vector (Red) */}
                                              <line x1={px} y1={py} x2={px} y2={py + fgLen} stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrowHead)" />
                                              <text x={px + 8} y={py + fgLen - 5} fill="#ef4444" fontSize="10" fontWeight="bold">Fg = {fgVal.toFixed(1)}N</text>
                                              
                                              {/* Drag Vector (Amber) */}
                                              {fdLen > 2 && (
                                                  <>
                                                      <line x1={px} y1={py} x2={px + fdx} y2={py + fdy} stroke="#f59e0b" strokeWidth="3" markerEnd="url(#arrowHead)" />
                                                      <text x={px + fdx + (fdx > 0 ? 8 : -55)} y={py + fdy - 5} fill="#f59e0b" fontSize="10" fontWeight="bold">Fd = {fdVal.toFixed(2)}N</text>
                                                  </>
                                              )}
                                          </g>
                                      );
                                  })()}

                                  {/* Vector Overlays */}
                                  {vectorOverlay === 'Velocity Vector' && result && result.path.length > 10 && (() => {
                                      const midIdx = Math.floor(result.path.length * 0.4);
                                      const p0 = result.path[midIdx];
                                      const p1 = result.path[Math.min(midIdx + 3, result.path.length - 1)];
                                      const maxX = Math.max(result.range, 10);
                                      const maxY = Math.max(result.maxHeight, 10);
                                      const sx = (p0.x / maxX) * 800;
                                      const sy = 500 - (p0.y / maxY) * 500;
                                      const dx = ((p1.x - p0.x) / maxX) * 800;
                                      const dy = -((p1.y - p0.y) / maxY) * 500;
                                      const mag = Math.sqrt(dx * dx + dy * dy);
                                      const scale = 80 / (mag || 1);
                                      const ex = sx + dx * scale;
                                      const ey = sy + dy * scale;
                                      return (
                                          <g>
                                              <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#f59e0b" strokeWidth="3" markerEnd="url(#arrowHead)" />
                                              <text x={ex + 8} y={ey - 8} fill="#f59e0b" fontSize="16" fontWeight="bold">v</text>
                                          </g>
                                      );
                                  })()}

                                  {vectorOverlay === 'Acceleration Vector' && result && result.path.length > 10 && (() => {
                                      const midIdx = Math.floor(result.path.length * 0.4);
                                      const p = result.path[midIdx];
                                      const maxX = Math.max(result.range, 10);
                                      const maxY = Math.max(result.maxHeight, 10);
                                      const sx = (p.x / maxX) * 800;
                                      const sy = 500 - (p.y / maxY) * 500;
                                      return (
                                          <g>
                                              <line x1={sx} y1={sy} x2={sx} y2={sy + 80} stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrowHead)" />
                                              <text x={sx + 8} y={sy + 50} fill="#ef4444" fontSize="16" fontWeight="bold">g</text>
                                          </g>
                                      );
                                  })()}

                                  {vectorOverlay === 'Displacement' && result && result.path.length > 1 && (() => {
                                      const first = result.path[0];
                                      const last = result.path[result.path.length - 1];
                                      const maxX = Math.max(result.range, 10);
                                      const maxY = Math.max(result.maxHeight, 10);
                                      const x1 = (first.x / maxX) * 800;
                                      const y1 = 500 - (first.y / maxY) * 500;
                                      const x2 = (last.x / maxX) * 800;
                                      const y2 = 500 - (last.y / maxY) * 500;
                                      return (
                                          <g>
                                              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#22d3ee" strokeWidth="2.5" strokeDasharray="8 4" markerEnd="url(#arrowHead)" />
                                              <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 12} fill="#22d3ee" fontSize="14" fontWeight="bold" textAnchor="middle">Δs = {result.range.toFixed(1)}m</text>
                                          </g>
                                      );
                                  })()}

                                  <defs>
                                      <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                          <stop offset="0%" stopColor="#3b82f6" />
                                          <stop offset="50%" stopColor="#8b5cf6" />
                                          <stop offset="100%" stopColor="#06b6d4" />
                                      </linearGradient>
                                      <marker id="arrowHead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                                      </marker>
                                  </defs>
                              </svg>

                              {/* Labels */}
                              <div className="absolute bottom-[-25px] left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-500 tracking-widest">
                                  {t.xAxisLabel.replace('{range}', (result?.range || 0).toFixed(1))}
                              </div>
                              <div className="absolute top-1/2 left-[-60px] -translate-y-1/2 text-[10px] font-mono text-slate-500 -rotate-90 origin-center tracking-widest">
                                  {t.yAxisLabel.replace('{height}', (result?.maxHeight || 0).toFixed(1))}
                              </div>
                          </div>
                    </div>

                    <div className="relative z-20 flex flex-col items-center pointer-events-none mt-auto mb-20">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="px-8 py-6 bg-[#080b11]/80 border border-blue-500/20 rounded-[32px] backdrop-blur-2xl flex flex-row items-center gap-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-b-blue-500/40"
                        >
                            <div className="flex gap-4 items-center">
                                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/30">
                                    <Target size={24} className="text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-white italic tracking-widest uppercase">{t.targetVector}</h2>
                                    <p className="text-slate-400 text-[10px] leading-tight">{t.dragAdjusted}</p>
                                </div>
                            </div>
                            
                            <div className="w-px h-10 bg-white/10 mx-2" />
                            
                            <div className="flex gap-8">
                                <div className="flex flex-col items-start justify-center">
                                    <div className="text-[20px] font-black text-white italic group-hover:text-blue-400 transition-colors">
                                        {(result?.timeOfFlight || 0).toFixed(2)}<span className="text-slate-500 text-sm ml-1">s</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t.timeOfFlight}</span>
                                </div>
                                <div className="flex flex-col items-start justify-center">
                                    <div className="text-[20px] font-black text-white italic">
                                        {(result?.range || 0).toFixed(1)}<span className="text-slate-500 text-sm ml-1">m</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t.displacement}</span>
                                </div>
                                <div className="flex flex-col items-start justify-center">
                                    <div className="text-[20px] font-black text-blue-400 italic">
                                        {(result?.maxHeight || 0).toFixed(1)}<span className="text-blue-500/50 text-sm ml-1">m</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-blue-500/50 uppercase tracking-widest">{t.maxAltitude}</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* BOTTOM METRICS BAR */}
                <div className="h-24 border-t border-white/5 bg-[#080b11]/80 backdrop-blur-xl px-8 flex items-center justify-around z-20">
                    {[
                        { label: t.initialVelocity, value: `${v0.toFixed(1)} m/s`, icon: Gauge },
                        { label: t.launchAngle, value: `${angle.toFixed(1)}°`, icon: ArrowUpRight },
                        { label: t.impactVelocity, value: `${(result?.finalVelocity || 0).toFixed(1)} m/s`, icon: Target },
                        { label: t.airDragConstraint, value: `${k.toFixed(3)} k/m`, icon: Compass },
                    ].map((m, i) => (
                        <div key={i} className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-slate-500 uppercase tracking-widest text-[9px] font-bold italic">
                                <m.icon size={10} /> {m.label}
                            </div>
                            <div className={`text-sm font-black italic tracking-tight ${i === 2 ? 'text-blue-400' : 'text-white'}`}>{m.value}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
