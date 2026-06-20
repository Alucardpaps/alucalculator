'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Info, RefreshCw, Zap } from 'lucide-react';

/**
 * <MohrCircleLab />
 * An interactive laboratory for visualizing principal stresses.
 */
export const MohrCircleLab: React.FC = () => {
    const [sigmaX, setSigmaX] = useState(100);
    const [sigmaY, setSigmaY] = useState(40);
    const [tauXY, setTauXY] = useState(40);

    const calculations = useMemo(() => {
        const center = (sigmaX + sigmaY) / 2;
        const radius = Math.sqrt(Math.pow((sigmaX - sigmaY) / 2, 2) + Math.pow(tauXY, 2));
        const sigma1 = center + radius;
        const sigma2 = center - radius;
        const tauMax = radius;
        const thetaP = (0.5 * Math.atan2(2 * tauXY, sigmaX - sigmaY) * 180) / Math.PI;

        return { center, radius, sigma1, sigma2, tauMax, thetaP };
    }, [sigmaX, sigmaY, tauXY]);

    // SVG Mapping
    const scale = 2;
    const padding = 60;
    const size = 300;
    const viewSize = size + padding * 2;

    const toX = (val: number) => padding + (val + 50) * scale;
    const toY = (val: number) => viewSize / 2 - val * scale;

    return (
        <div className="bg-[#0a0e14] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <Activity size={18} className="text-rose-500" />
                        Mohr's Circle Interactive Lab
                    </h3>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">Real-time Stress Transformation Engine</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[9px] font-black text-rose-400 uppercase tracking-widest">
                    Live Simulation
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-0">
                {/* Visualizer */}
                <div className="p-8 flex items-center justify-center bg-[#020408] relative">
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                    
                    <svg width={viewSize} height={viewSize} viewBox={`0 0 ${viewSize} ${viewSize}`} className="relative z-10">
                        {/* Axes */}
                        <line x1={padding} y1={viewSize/2} x2={viewSize-padding} y2={viewSize/2} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1={toX(calculations.center)} y1={padding} x2={toX(calculations.center)} y2={viewSize-padding} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                        
                        {/* The Circle */}
                        <motion.circle 
                            cx={toX(calculations.center)} 
                            cy={toY(0)} 
                            r={calculations.radius * scale} 
                            fill="none" 
                            stroke="#f43f5e" 
                            strokeWidth="2"
                            initial={false}
                        />

                        {/* Diameter Line */}
                        <motion.line 
                            x1={toX(sigmaX)} y1={toY(tauXY)} 
                            x2={toX(sigmaY)} y2={toY(-tauXY)} 
                            stroke="#3b82f6" 
                            strokeWidth="1.5"
                            initial={false}
                        />

                        {/* Key Points */}
                        <circle cx={toX(sigmaX)} cy={toY(tauXY)} r="4" fill="#3b82f6" />
                        <circle cx={toX(sigmaY)} cy={toY(-tauXY)} r="4" fill="#3b82f6" />
                        <circle cx={toX(calculations.sigma1)} cy={toY(0)} r="4" fill="#10b981" />
                        <circle cx={toX(calculations.sigma2)} cy={toY(0)} r="4" fill="#f43f5e" />

                        {/* Labels */}
                        <text x={toX(calculations.sigma1) + 10} y={toY(0) + 5} fill="#10b981" fontSize="10" fontWeight="bold">σ1</text>
                        <text x={toX(calculations.sigma2) - 20} y={toY(0) + 5} fill="#f43f5e" fontSize="10" fontWeight="bold">σ2</text>
                    </svg>

                    <div className="absolute bottom-6 left-8 flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Max Principal</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Min Principal</span>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="p-8 bg-white/[0.01] border-l border-white/5 space-y-8">
                    <div className="space-y-6">
                        <ControlSlider label="Normal Stress σx" value={sigmaX} min={0} max={200} onChange={setSigmaX} unit="MPa" />
                        <ControlSlider label="Normal Stress σy" value={sigmaY} min={0} max={200} onChange={setSigmaY} unit="MPa" />
                        <ControlSlider label="Shear Stress τxy" value={tauXY} min={-100} max={100} onChange={setTauXY} unit="MPa" />
                    </div>

                    <div className="pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                        <ResultCard label="Principal σ1" value={calculations.sigma1.toFixed(1)} unit="MPa" highlight="emerald" />
                        <ResultCard label="Principal σ2" value={calculations.sigma2.toFixed(1)} unit="MPa" highlight="rose" />
                        <ResultCard label="Max Shear τmax" value={calculations.tauMax.toFixed(1)} unit="MPa" highlight="amber" />
                        <ResultCard label="Princ. Angle θp" value={calculations.thetaP.toFixed(1)} unit="°" highlight="blue" />
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                        <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                            <span className="text-blue-400 font-bold">Insight:</span> The radius of the circle is equal to the maximum shear stress. Use this to determine if the material will fail under Tresca or Von Mises criteria.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ControlSlider = ({ label, value, min, max, onChange, unit }: any) => (
    <div className="space-y-3">
        <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
            <span className="text-xs font-mono font-bold text-white">{value} {unit}</span>
        </div>
        <input 
            type="range" min={min} max={max} value={value} 
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
        />
    </div>
);

const ResultCard = ({ label, value, unit, highlight }: any) => {
    const colors: any = {
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20"
    };

    return (
        <div className={`p-4 rounded-2xl border ${colors[highlight]}`}>
            <div className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">{label}</div>
            <div className="text-lg font-black font-mono">{value}<span className="text-[10px] ml-1 opacity-60">{unit}</span></div>
        </div>
    );
};
