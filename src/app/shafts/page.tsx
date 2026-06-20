"use client";

import { useState, useEffect } from 'react';
import { InputPanel } from '@/components/calculation/InputPanel';
import { ResultPanel } from '@/components/calculation/ResultPanel';
import { SaveButton } from '@/components/calculation/SaveButton';
import { CalculatorInput } from '@/components/CalculatorInput';
import { useWorkspace } from '@/store/useWorkspace';
import { Settings, RefreshCw, Layers, ShieldCheck, Zap, Box, Link as LinkIcon } from 'lucide-react';
import { ExecutionResult } from '@/lib/utils/contract';
import { UserMenu } from '@/components/auth/UserMenu';
import { useI18nStore } from '@/store/i18nStore';
import { getWorkstationPage } from '@/locales/workstationPageTranslations';

/**
 * Premium Shafts Workstation (Wave 3.1)
 * Features Assembly Link (Data Bus) capabilities.
 */

export default function ShaftsPage() {
    const { language } = useI18nStore();
    const ws = getWorkstationPage(language).shafts;
    const { currentProjectId, setUnsavedChanges } = useWorkspace();
    
    // Shaft Form State
    const [length, setLength] = useState(500);
    const [forcePos, setForcePos] = useState(250);
    const [force, setForce] = useState<any>(1000); // Can be a number or a string (for $ref)
    const [isRefEnabled, setIsRefEnabled] = useState(false);
    const [refString, setRefString] = useState("");

    // Execution State
    const [isComputing, setIsComputing] = useState(false);
    const [contract, setContract] = useState<ExecutionResult | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleCompute();
        }, 400);
        return () => clearTimeout(timer);
    }, [length, forcePos, force, isRefEnabled, refString]);

    const handleCompute = async () => {
        setIsComputing(true);
        setUnsavedChanges(true);

        const payloadForce = isRefEnabled && refString ? { "$ref": refString } : Number(force);

        try {
            const response = await fetch('/api/compute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: "shafts",
                    payload: { length, forcePos, force: payloadForce },
                    projectId: currentProjectId || "temp"
                }),
            });

            const resultContract: ExecutionResult = await response.json();
            setContract(resultContract);
        } catch (err: any) {
            console.error("Critical API Fault (Shafts):", err);
        } finally {
            setIsComputing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020408] text-slate-200 selection:bg-blue-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-6 py-12 lg:px-12 space-y-12">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-900 pb-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600/10 rounded-lg border border-blue-500/20">
                                <Box className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="flex items-center gap-2 text-blue-500 font-bold text-[10px] uppercase tracking-[0.4em]">
                                {ws.breadcrumb} <span className="text-slate-700">/</span> {ws.assembly}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-4xl font-black tracking-tight text-white flex items-baseline gap-3">
                                {ws.title}
                                <span className="text-sm font-mono text-slate-600 font-medium bg-slate-900/50 px-2 py-0.5 rounded border border-slate-800">L1-03</span>
                            </h1>
                            <p className="text-slate-500 text-sm font-medium">{ws.subtitle}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-slate-900/30 p-2 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
                            <SaveButton 
                                type="shafts" 
                                inputData={{ length, forcePos, force: isRefEnabled ? refString : force }} 
                                engineVersion="v1.0"
                                disabled={isComputing || !contract?.success}
                            />
                            <div className="h-8 w-[1px] bg-slate-800 mx-1"></div>
                            <button className="p-3 rounded-xl hover:bg-slate-800 transition-all group">
                                <Settings className="w-5 h-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                            </button>
                        </div>
                        <UserMenu />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Control Panel (Left) */}
                    <div className="lg:col-span-5 space-y-8">
                        <InputPanel title={ws.inputTitle}>
                            <div className="space-y-8">
                                <CalculatorInput 
                                    label={ws.totalLength} 
                                    unit="mm" 
                                    value={length} 
                                    onChange={(e) => setLength(Number(e.target.value))} 
                                />
                                <CalculatorInput 
                                    label={ws.forcePosition} 
                                    unit="mm from A" 
                                    value={forcePos} 
                                    onChange={(e) => setForcePos(Number(e.target.value))} 
                                />
                                
                                {/* Assembly Link (Data Bus Input) */}
                                <div className="p-4 bg-blue-600/5 border border-blue-500/20 rounded-xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                                            <LinkIcon size={12} />
                                            {ws.assemblyConnector}
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={isRefEnabled} onChange={() => setIsRefEnabled(!isRefEnabled)} />
                                            <div className="w-7 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    {isRefEnabled ? (
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-slate-500">{ws.refHint}</p>
                                            <input 
                                                type="text" 
                                                placeholder={ws.refPlaceholder}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-blue-400 placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50"
                                                value={refString}
                                                onChange={(e) => setRefString(e.target.value)}
                                            />
                                        </div>
                                    ) : (
                                        <CalculatorInput 
                                            label={ws.appliedForce} 
                                            unit="Newtons" 
                                            value={force} 
                                            onChange={(e) => setForce(Number(e.target.value))} 
                                        />
                                    )}
                                </div>
                            </div>
                        </InputPanel>
                    </div>

                    {/* Result Workbench (Right) */}
                    <div className="lg:col-span-7 space-y-8">
                        <ResultPanel 
                            isComputing={isComputing} 
                            contract={contract} 
                        />
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800/50 space-y-3">
                                <Layers size={20} className="text-blue-500" />
                                <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ws.reactionMatrix}</h6>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    {ws.reactionDesc}
                                </p>
                            </div>
                            <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800/50 space-y-3">
                                <RefreshCw size={20} className="text-emerald-500" />
                                <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ws.dataBusSync}</h6>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    {ws.dataBusDesc}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
