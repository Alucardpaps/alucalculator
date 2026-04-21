import React, { useState, memo } from 'react';
import { CheckCircle, AlertTriangle, Cpu, Zap, Activity, Info, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { ExecutionResult } from '@/lib/utils/contract';

/**
 * Compressed ResultPanel Component
 * Follows "Signal Compression" rules: Result-first, Telemetry-optional.
 */

interface ResultPanelProps {
    isComputing: boolean;
    contract: ExecutionResult | null;
}

export const ResultPanel = memo(({ isComputing, contract }: ResultPanelProps) => {
    const [showTelemetry, setShowTelemetry] = useState(false);

    if (isComputing) {
        return (
            <div className="bg-[#0f172a] text-white rounded-2xl p-8 border border-slate-800 flex flex-col items-center justify-center gap-6 min-h-[350px] relative overflow-hidden">
                <div className="relative">
                    <div className="w-16 h-16 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <Cpu className="w-6 h-6 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] font-bold tracking-[0.3em] text-blue-500 uppercase">Processing Engine Request</p>
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="bg-[#0f172a]/30 text-slate-600 rounded-2xl p-8 border border-slate-900 border-dashed flex flex-col items-center justify-center gap-4 min-h-[350px]">
                <Info className="w-6 h-6 opacity-20" />
                <p className="text-[10px] uppercase font-bold tracking-widest">Awaiting Parameters</p>
            </div>
        );
    }

    const { success, data, error, performance, telemetry, traceId } = contract;

    if (!success || error) {
        return (
            <div className={`
                rounded-2xl p-8 border min-h-[350px] flex flex-col justify-center gap-6 transition-all
                ${error?.layer === 'engine' ? 'bg-red-950/10 border-red-900/30 text-red-400' : 'bg-orange-950/10 border-orange-900/30 text-orange-400'}
            `}>
                <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6" />
                    <h4 className="text-sm font-bold uppercase tracking-widest">{error?.code}</h4>
                </div>
                <p className="text-sm opacity-80 leading-relaxed border-l border-current pl-4">
                    {error?.message}
                </p>
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <span className="text-[10px] font-mono opacity-40">TRACE: {traceId.split('-')[0]}</span>
                    <button className="text-[10px] font-bold uppercase underline">Report Issue</button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#0f172a] text-white rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden min-h-[350px] flex flex-col">
            
            {/* Compressed HUD */}
            <div className="p-6 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/30">
                <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-[0.2em]">
                    <Zap size={12} className="fill-emerald-500" />
                    Engine Verified
                </div>
                <button 
                    onClick={() => setShowTelemetry(!showTelemetry)}
                    className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors uppercase font-bold"
                >
                    <Terminal size={12} />
                    {showTelemetry ? "Hide Logs" : "Inspect"}
                    {showTelemetry ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
            </div>

            <div className="p-8 flex-1 flex flex-col justify-center">
                {/* Dynamic Primary Signal Detection */}
                <div className="space-y-1 mb-8">
                    {data.stress !== undefined ? (
                        <>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Calculated Stress Output</p>
                            <div className="flex items-baseline gap-3">
                                <span className="text-7xl font-mono font-black tracking-tighter text-white">
                                    {Number(data.stress).toFixed(4)}
                                </span>
                                <span className="text-lg text-emerald-500 font-bold tracking-widest uppercase">MPa</span>
                            </div>
                        </>
                    ) : data.displacement !== undefined ? (
                        <>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Displacement / Tonnes</p>
                            <div className="flex items-baseline gap-3">
                                <span className="text-7xl font-mono font-black tracking-tighter text-white">
                                    {Number(data.displacement).toLocaleString()}
                                </span>
                                <span className="text-lg text-blue-500 font-bold tracking-widest uppercase">t</span>
                            </div>
                        </>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(data).map(([key, value]) => {
                                if (key === 'engineInfo') return null;
                                return (
                                    <div key={key} className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">{key}</span>
                                        <span className="text-sm font-mono font-bold text-white truncate block">
                                            {typeof value === 'number' ? value.toFixed(3) : String(value)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Secondary Signals (Performance & Integrity) */}
                <div className="flex items-center gap-6 pt-6 border-t border-slate-800/50">
                    <div className="flex items-center gap-2">
                        <Activity size={12} className={performance.status === 'healthy' ? 'text-emerald-500' : 'text-orange-500'} />
                        <span className="text-[10px] font-mono text-slate-400">{performance.totalMs}ms Execution</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-mono text-slate-400">Determinism v1.0</span>
                    </div>
                </div>
            </div>

            {/* Inspectable Depth (Telemetry) */}
            {showTelemetry && (
                <div className="p-6 bg-black/40 border-t border-slate-800/50 animate-in slide-in-from-bottom-2 duration-300">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Execution Timeline</h5>
                    <div className="space-y-3">
                        {telemetry.mode === 'full' ? (
                            telemetry.timeline.map((step: any, i: number) => (
                                <div key={i} className="flex justify-between items-center text-[10px] font-mono">
                                    <span className="text-slate-400">{step.event}</span>
                                    <span className="text-slate-600">{step.durationSinceStart}ms</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className="text-slate-400">Total Logic Stages</span>
                                <span className="text-slate-600">{telemetry.timeline.steps} steps</span>
                            </div>
                        )}
                        <div className="pt-2 mt-2 border-t border-white/5 flex justify-between text-[9px] font-mono text-slate-700">
                            <span>TRACE: {traceId}</span>
                            <span>LAYER: SERVICE_ORCHESTRATOR</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

ResultPanel.displayName = "ResultPanel";
