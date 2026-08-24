'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronRight, ChevronLeft, CheckCircle2, 
    Circle, Play, Save, Share2, Printer, 
    Layers, Zap, Database, ArrowRight, BookOpen
} from 'lucide-react';
import { CALCULATOR_REGISTRY_V2 } from '@/calculators/registry-v2';
import { UniversalCalcRenderer } from './UniversalCalcRenderer';
import gearboxFlow from '@/data/design-flows/gearbox-design.json';

interface LinearEngineRendererProps {
    flowId: string;
}

const FLOWS: Record<string, any> = {
    'gearbox-design': gearboxFlow
};

export const LinearEngineRenderer: React.FC<LinearEngineRendererProps> = ({ flowId }) => {
    const flow = FLOWS[flowId];
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [stepData, setStepData] = useState<Record<string, Record<string, number>>>({});
    const [loadedSchemas, setLoadedSchemas] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(true);

    const currentStep = flow?.steps[currentStepIndex];

    // Load schemas for the current flow
    useEffect(() => {
        const loadAll = async () => {
            if (!flow) return;
            setIsLoading(true);
            const schemas: Record<string, any> = {};
            
            try {
                for (const step of flow.steps) {
                    const entry = CALCULATOR_REGISTRY_V2[step.calcId];
                    if (entry) {
                        const mod = await entry.loader();
                        schemas[step.calcId] = (mod as any).default;
                    }
                }
                setLoadedSchemas(schemas);
            } catch (e) {
                console.error("Failed to load flow schemas:", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadAll();
    }, [flow]);

    // Handle output changes for a specific step
    const handleOutputsChange = (calcId: string, outputs: Record<string, number>) => {
        setStepData(prev => ({
            ...prev,
            [calcId]: outputs
        }));
    };

    // Calculate initial values for the current step based on mappings
    const currentInitialValues = useMemo(() => {
        if (!flow || !currentStep) return {};
        const values: Record<string, number> = {};
        
        flow.mappings.forEach((mapping: any) => {
            const [fromCalc, fromField] = mapping.from.split('.');
            const [toCalc, toField] = mapping.to.split('.');
            
            if (toCalc === currentStep.calcId) {
                const sourceValue = stepData[fromCalc]?.[fromField];
                if (sourceValue !== undefined) {
                    values[toField] = sourceValue;
                }
            }
        });
        
        return values;
    }, [flow, currentStep, stepData]);

    if (!flow || isLoading) {
        return (
            <div className="flex items-center justify-center h-full bg-[#03060a]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest animate-pulse">Initializing Design Engine...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-[#03060a] text-white">
            {/* STEP PROGRESS BAR */}
            <div className="h-16 border-b border-white/5 bg-[#0b121d]/50 backdrop-blur-xl flex items-center px-8 relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px)] bg-[size:20px_1px] pointer-events-none" />
                
                <div className="flex items-center gap-1.5 mr-12 truncate max-w-[25%]">
                    <Layers size={18} className="text-blue-500" />
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">{flow.id}</span>
                        <h1 className="text-sm font-black tracking-tight truncate">{flow.name}</h1>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center gap-4 max-w-2xl mx-auto">
                    {flow.steps.map((step: any, idx: number) => (
                        <React.Fragment key={step.calcId}>
                            <button 
                                onClick={() => setCurrentStepIndex(idx)}
                                className={`flex items-center gap-2 transition-all duration-300 ${idx === currentStepIndex ? 'opacity-100 scale-105' : 'opacity-40 hover:opacity-70'}`}
                            >
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border ${idx === currentStepIndex ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-black/40 border-white/10 text-gray-500'}`}>
                                    {stepData[step.calcId] ? <CheckCircle2 size={12} className="text-blue-400" /> : idx + 1}
                                </div>
                                <span className={`text-[10px] font-black tracking-widest uppercase hidden lg:block ${idx === currentStepIndex ? 'text-blue-400' : 'text-gray-600'}`}>
                                    {step.label.split(' ').slice(1).join(' ')}
                                </span>
                            </button>
                            {idx < flow.steps.length - 1 && <ArrowRight size={12} className="text-white/10" />}
                        </React.Fragment>
                    ))}
                </div>

                <div className="flex items-center gap-3 ml-12">
                    <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-blue-500/10 hover:border-blue-500/30 transition-all text-gray-500 hover:text-blue-400"><Save size={16} /></button>
                    <button className="p-2.5 bg-blue-500 text-white rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 transition-all text-[11px] font-black uppercase tracking-widest flex items-center gap-2 px-5 group">
                        Commit <Zap size={14} className="group-hover:animate-pulse" />
                    </button>
                </div>
            </div>

            {/* RENDERER AREA */}
            <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={currentStep.calcId}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full h-full"
                    >
                        <UniversalCalcRenderer 
                            schema={loadedSchemas[currentStep.calcId]} 
                            initialValues={currentInitialValues}
                            onOutputsChange={(outs) => handleOutputsChange(currentStep.calcId, outs)}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* NAVIGATION FOOTER */}
            <div className="h-14 border-t border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
                <button 
                    onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                    disabled={currentStepIndex === 0}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors disabled:opacity-10"
                >
                    <ChevronLeft size={16} /> Back: {currentStepIndex > 0 ? flow.steps[currentStepIndex-1].label : 'START'}
                </button>

                <div className="flex flex-col items-center">
                    <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">Engine Output Verified</div>
                    <div className="text-[10px] font-bold text-blue-500/50">STEP {currentStepIndex + 1} / {flow.steps.length}</div>
                </div>

                <button 
                    onClick={() => setCurrentStepIndex(Math.min(flow.steps.length - 1, currentStepIndex + 1))}
                    disabled={currentStepIndex === flow.steps.length - 1}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors disabled:opacity-10"
                >
                    Next: {currentStepIndex < flow.steps.length - 1 ? flow.steps[currentStepIndex+1].label : 'FINISH'} <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};
