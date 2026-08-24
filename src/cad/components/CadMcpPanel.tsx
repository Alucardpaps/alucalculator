import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Zap, X, Activity, Cpu, Hammer, ShieldCheck } from 'lucide-react';
import { useCadStore } from '../store/cadStore';

export function CadMcpPanel() {
    const { 
        isMcpPanelOpen, 
        activeMcpTool, 
        setMcpPanelOpen, 
        setActiveMcpTool,
        selectedIds,
        entities 
    } = useCadStore();

    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    // Reset when tool changes
    useEffect(() => {
        setResult(null);
        setIsProcessing(false);
    }, [activeMcpTool]);

    if (!isMcpPanelOpen) return null;

    const handleExecute = () => {
        setIsProcessing(true);
        setResult(null);

        // Define MCP Action Context
        let server = 'System';
        let method = 'unknown';

        if (activeMcpTool === 'AI_ANALYZE') {
            server = 'MaterialsProject';
            method = 'analyze_stress()';
        } else if (activeMcpTool === 'AI_GCODE') {
            server = 'EngineeringMCP';
            method = 'generate_toolpath()';
        }

        // Selected entities data
        const selectedCount = selectedIds.length;
        const totalLines = entities.filter(e => selectedIds.includes(e.id) && e.geometry.type === 'LINE').length;
        
        let payload = `Entities: ${selectedCount} (Lines: ${totalLines})`;

        // SIMULATE MCP DELAY (In reality, this would fetch from an MCP server hook via Next.js backend)
        setTimeout(() => {
            console.log(`[MCP] Requested ${method} from ${server} with payload: ${payload}`);

            if (activeMcpTool === 'AI_ANALYZE') {
                if (selectedCount === 0) {
                    setResult('⚠️ No entities selected. Please select bounds to analyze.');
                } else {
                    setResult(`✅ Stress Analysis Complete.\nMax Von Mises: 42.5 MPa.\nFactor of Safety: 3.2.\nPayload sent: ${payload}`);
                }
            } else if (activeMcpTool === 'AI_GCODE') {
                if (selectedCount === 0) {
                    setResult('⚠️ No path selected. Select continuous lines to generate G-Code.');
                } else {
                    setResult(`✅ G-Code Generated (2.4 KB).\nEstimated Machining Time: 4m 12s.\nTool: 6mm Flat End Mill.`);
                }
            } else {
                setResult('Unknown AI Tool executed.');
            }

            setIsProcessing(false);
        }, 1500);
    };

    const getToolConfig = () => {
        switch (activeMcpTool) {
            case 'AI_ANALYZE':
                return {
                    title: 'FEA Stress Analysis',
                    icon: <Activity size={18} className="text-rose-400" />,
                    color: 'rose',
                    desc: 'Uses MaterialsProject MCP to analyze local stresses on selected CAD geometry.'
                };
            case 'AI_GCODE':
                return {
                    title: 'Auto CAM (G-Code)',
                    icon: <Hammer size={18} className="text-amber-400" />,
                    color: 'amber',
                    desc: 'Uses Engineering MCP to calculate optimal toolpaths and generate G-Code.'
                };
            default:
                return {
                    title: 'Neural Link',
                    icon: <Bot size={18} className="text-cyan-400" />,
                    color: 'cyan',
                    desc: 'Active MCP Connection.'
                };
        }
    };

    const config = getToolConfig();

    return (
        <AnimatePresence>
            {isMcpPanelOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="absolute right-6 top-24 w-80 z-50 overflow-hidden"
                >
                    <div className="bg-[#05090f]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] flex flex-col relative overflow-hidden">
                        
                        {/* Glow and accents */}
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-${config.color}-500/50`} />
                        <div className={`absolute -top-20 -right-20 w-40 h-40 bg-${config.color}-500/10 rounded-full blur-3xl pointer-events-none`} />

                        {/* HEADER */}
                        <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg bg-${config.color}-500/20 border border-${config.color}-500/30 flex items-center justify-center relative`}>
                                    <div className={`absolute inset-0 bg-${config.color}-400/20 animate-pulse`} />
                                    {config.icon}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-[9px] font-mono tracking-widest uppercase text-${config.color}-400`}>MCP Server / AI</span>
                                    <span className="text-sm font-bold text-white">{config.title}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveMcpTool(null)}
                                className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* CONTENT */}
                        <div className="p-4 flex flex-col gap-4">
                            <p className="text-[11px] leading-relaxed text-slate-400">
                                {config.desc}
                            </p>

                            <div className="bg-black/40 border border-white/5 rounded-lg p-3 flex items-center gap-3">
                                <Cpu size={16} className="text-slate-500" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Selection Context</span>
                                    <span className="text-[12px] text-cyan-50">{selectedIds.length} Entities Selected</span>
                                </div>
                            </div>

                            {result && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-3"
                                >
                                    <pre className="text-[10px] font-mono text-cyan-300 whitespace-pre-wrap">{result}</pre>
                                </motion.div>
                            )}
                        </div>

                        {/* FOOTER */}
                        <div className="p-4 pt-0 border-t border-white/5 mt-2 bg-white/[0.02]">
                            <button
                                onClick={handleExecute}
                                disabled={isProcessing}
                                className={
                                    "w-full py-3 mt-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest transition-all overflow-hidden relative group " +
                                    (isProcessing ? 
                                        "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5" : 
                                        `bg-${config.color}-600/20 text-${config.color}-400 border border-${config.color}-500/30 hover:bg-${config.color}-500 hover:text-white shadow-[0_0_15px_rgba(0,0,0,0.5)]`
                                    )
                                }
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none" />
                                        <Zap size={14} className={!isProcessing ? "animate-pulse" : ""} />
                                        Initialize Link
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
