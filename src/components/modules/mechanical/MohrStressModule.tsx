'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, Target, Maximize2, Shield, 
    Zap, Compass, Move, Share2, Info
} from 'lucide-react';
import { EngineeringVisualization } from "@/components/ui/EngineeringVisualization";
import { CalculatorInput } from "@/components/CalculatorInput";

export default function MohrStressModule() {
    const [sigmaX, setSigmaX] = useState(100); // MPa
    const [sigmaY, setSigmaY] = useState(40);  // MPa
    const [tauXY, setTauXY] = useState(30);    // MPa
    const [angle, setAngle] = useState(0);      // degrees — rotation angle

    const results = useMemo(() => {
        const sigmaAvg = (sigmaX + sigmaY) / 2;
        const R = Math.sqrt(Math.pow((sigmaX - sigmaY) / 2, 2) + Math.pow(tauXY, 2));

        const sigma1 = sigmaAvg + R;
        const sigma2 = sigmaAvg - R;
        const tauMax = R;

        const theta_p = (Math.atan2(2 * tauXY, sigmaX - sigmaY) / 2) * (180 / Math.PI);
        const vonMises = Math.sqrt(sigma1 * sigma1 - sigma1 * sigma2 + sigma2 * sigma2);

        const thetaRad = angle * Math.PI / 180;
        const sigma_n = sigmaAvg + ((sigmaX - sigmaY) / 2) * Math.cos(2 * thetaRad) + tauXY * Math.sin(2 * thetaRad);
        const tau_n = -((sigmaX - sigmaY) / 2) * Math.sin(2 * thetaRad) + tauXY * Math.cos(2 * thetaRad);

        return { sigmaAvg, R, sigma1, sigma2, tauMax, theta_p, vonMises, sigma_n, tau_n };
    }, [sigmaX, sigmaY, tauXY, angle]);

    const status = results.vonMises < 250 ? 'valid' : 'warning';

    return (
        <div className="flex flex-col h-full bg-[#020408] text-slate-200 select-none font-sans overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">Stress Node</h1>
                            <p className="text-[10px] text-purple-500/60 font-mono tracking-widest uppercase mt-1">Mohr Circle Analytics v4.1</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Visualizer & Controls */}
                    <div className="space-y-8">
                        <EngineeringVisualization status={status} label="STRESS STATE VISUALIZER">
                            <div className="flex flex-col items-center justify-center p-8 w-full h-full min-h-[400px] relative bg-[#05080f] rounded-[3rem] border border-white/5 overflow-hidden">
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.01)_1px,transparent_1px)] bg-[size:20px_20px]" />
                                
                                <MohrCircleSVG results={results} angle={angle} />

                                <div className="mt-8 flex gap-4 w-full px-4 items-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest w-16">Rotation θ</span>
                                    <input 
                                        type="range" min={-90} max={90} step={1} 
                                        value={angle} 
                                        onChange={(e) => setAngle(Number(e.target.value))}
                                        className="flex-1 accent-purple-500 bg-white/5 h-1.5 rounded-full" 
                                    />
                                    <span className="text-sm font-black text-purple-400 font-mono w-12 text-right">{angle}°</span>
                                </div>
                            </div>
                        </EngineeringVisualization>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem]">
                            <CalculatorInput label="Stress σx" unit="MPa" value={sigmaX} onChange={(e) => setSigmaX(Number(e.target.value))} />
                            <CalculatorInput label="Stress σy" unit="MPa" value={sigmaY} onChange={(e) => setSigmaY(Number(e.target.value))} />
                            <CalculatorInput label="Shear τxy" unit="MPa" value={tauXY} onChange={(e) => setTauXY(Number(e.target.value))} />
                        </div>
                    </div>

                    {/* Results & Analysis */}
                    <div className="space-y-8">
                        <div className="bg-[#0a0c10] rounded-[3rem] p-10 border border-purple-500/20 shadow-2xl relative overflow-hidden">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-10">Analysis Indicators</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ResultCard label="Von Mises Equivalent" value={results.vonMises.toFixed(1)} unit="MPa" color="#a855f7" icon={<Shield size={16}/>} />
                                <ResultCard label="Principal Stress σ₁" value={results.sigma1.toFixed(1)} unit="MPa" color="#22c55e" icon={<Target size={16}/>} />
                                <ResultCard label="Principal Stress σ₂" value={results.sigma2.toFixed(1)} unit="MPa" color="#ef4444" icon={<Target size={16}/>} />
                                <ResultCard label="Max Shear τ_max" value={results.tauMax.toFixed(1)} unit="MPa" color="#f59e0b" icon={<Activity size={16}/>} />
                            </div>

                            <div className="mt-10 pt-10 border-t border-white/5 space-y-6">
                                <div className="bg-purple-500/5 border border-purple-500/20 rounded-3xl p-6">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-4 flex items-center gap-2">
                                        <Compass size={14} /> Rotated State at {angle}°
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="text-[8px] text-slate-500 uppercase font-black">Normal Stress σ_θ</div>
                                            <div className="text-2xl font-black font-mono text-white">{results.sigma_n.toFixed(1)} <span className="text-[10px] text-slate-600">MPa</span></div>
                                        </div>
                                        <div className="w-px h-10 bg-white/10" />
                                        <div className="text-right">
                                            <div className="text-[8px] text-slate-500 uppercase font-black">Shear Stress τ_θ</div>
                                            <div className="text-2xl font-black font-mono text-white">{results.tau_n.toFixed(1)} <span className="text-[10px] text-slate-600">MPa</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[9px] text-slate-600 uppercase tracking-widest font-black flex items-center gap-2 px-2">
                                    <Info size={12} /> Plane stress assumption applies. Yield checking against σ_vm.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MohrCircleSVG({ results, angle }: any) {
    const svgW = 300;
    const svgH = 300;
    const cx = svgW / 2;
    const cy = svgH / 2;

    const maxVal = Math.max(Math.abs(results.sigma1), Math.abs(results.sigma2), Math.abs(results.tauMax), 50);
    const scale = (svgW * 0.35) / maxVal;

    const circleCx = cx + results.sigmaAvg * scale;
    const circleR = results.R * scale;

    const thetaRad = angle * Math.PI / 180;
    const pointX = circleCx + circleR * Math.cos(2 * thetaRad);
    const pointY = cy - circleR * Math.sin(2 * thetaRad);

    return (
        <svg viewBox="0 0 300 300" className="w-full h-full max-w-[300px] max-h-[300px] overflow-visible">
            {/* Grid & Axes */}
            <line x1="0" y1={cy} x2={svgW} y2={cy} stroke="white" strokeWidth="0.5" strokeOpacity="0.1" />
            <line x1={cx} y1="0" x2={cx} y2={svgH} stroke="white" strokeWidth="0.5" strokeOpacity="0.1" />
            
            <text x={svgW-10} y={cy-5} fontSize="8" fill="#64748b" className="font-mono font-bold uppercase tracking-widest">σ</text>
            <text x={cx+5} y="15" fontSize="8" fill="#64748b" className="font-mono font-bold uppercase tracking-widest">τ</text>

            {/* Circle */}
            <motion.circle 
                layoutId="mohr-circle"
                cx={circleCx} cy={cy} r={circleR} 
                fill="none" stroke="#a855f7" strokeWidth="2" strokeOpacity="0.6" 
            />
            <circle cx={circleCx} cy={cy} r={circleR} fill="#a855f7" fillOpacity="0.03" />

            {/* Diameter Line */}
            <motion.line 
                x1={circleCx - circleR} y1={cy} x2={circleCx + circleR} y2={cy} 
                stroke="white" strokeWidth="0.5" strokeDasharray="4 4" strokeOpacity="0.2" 
            />

            {/* Principal Stress Markers */}
            <circle cx={cx + results.sigma1 * scale} cy={cy} r="4" fill="#22c55e" />
            <circle cx={cx + results.sigma2 * scale} cy={cy} r="4" fill="#ef4444" />

            {/* Current Angle Point */}
            <motion.line 
                animate={{ x2: pointX, y2: pointY }} 
                x1={circleCx} y1={cy} 
                stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4 2" 
            />
            <motion.circle 
                animate={{ cx: pointX, cy: pointY }} 
                r="6" fill="#a855f7" stroke="#020408" strokeWidth="2" 
                className="shadow-[0_0_20px_#a855f7]"
            />
        </svg>
    );
}

function ResultCard({ label, value, unit, color, icon }: any) {
    return (
        <div className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl hover:bg-white/[0.05] transition-all group">
            <div className="flex items-center gap-3 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">
                <span className="p-1.5 rounded-lg bg-white/5 text-slate-400 group-hover:text-purple-400 transition-colors">{icon}</span> {label}
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black font-mono tracking-tighter" style={{ color }}>{value}</span>
                <span className="text-xs font-bold text-slate-600 uppercase italic font-sans">{unit}</span>
            </div>
        </div>
    );
}
