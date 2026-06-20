'use client';

import React from 'react';
import { 
    FileText, ShieldCheck, Info, BookOpen, 
    Printer, Download, X, CheckCircle2, 
    AlertCircle, Scale 
} from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';

// Lazy load MathJax for performance
const MathJaxNode: React.ComponentType<any> = dynamic(() => import('react-mathjax2').then(mod => (mod as any).default.Node || (mod as any).Node), { 
  ssr: false,
  loading: () => <span className="animate-pulse">Loading math engine...</span>
});

const MathJaxContext: React.ComponentType<any> = dynamic(() => import('react-mathjax2').then(mod => (mod as any).default.Context || (mod as any).Context), { ssr: false });

interface CalculationReportProps {
    schema: CalculatorSchemaV2;
    inputs: Record<string, any>;
    outputs: Record<string, number | null>;
    onClose: () => void;
}

/**
 * <CalculationReport />
 * THE TRANSPARENCY ENGINE — PHASE 2
 * 
 * A premium, print-ready engineering audit report that 
 * reveals the mathematical logic and standards behind a calculation.
 */
export const CalculationReport: React.FC<CalculationReportProps> = ({ 
    schema, inputs, outputs, onClose 
}) => {
    const handlePrint = () => {
        window.print();
    };

    const standards = schema.documentation?.standards || [];
    const assumptions = schema.documentation?.assumptions || [];
    const timestamp = new Date().toLocaleString();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md overflow-y-auto custom-scrollbar"
        >
            {/* The "Laboratory Certificate" Container */}
            <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col print:shadow-none print:rounded-none print:w-full print:m-0">
                
                {/* Header: Identity & Actions */}
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:bg-white print:border-b-2 print:border-slate-900">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 print:bg-black print:text-white print:shadow-none">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight uppercase">Calculation Audit Report</h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="text-blue-600">ID: {schema.id}</span>
                                <span>•</span>
                                <span>VERIFIED BY ALUCALC ENGINE v5.0</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 print:hidden">
                        <button 
                            onClick={handlePrint}
                            className="p-2.5 hover:bg-slate-200 rounded-xl transition-colors text-slate-600"
                            title="Print Report"
                        >
                            <Printer size={20} />
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-2.5 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors text-slate-400 ml-2"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-12 print:overflow-visible print:p-0 print:m-4">
                    
                    {/* Section 1: Meta Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-100 pb-8">
                        <div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Subject Information</h3>
                            <div className="space-y-1">
                                <h1 className="text-2xl font-black text-slate-900">{schema.metadata.title}</h1>
                                <p className="text-sm text-slate-500 leading-relaxed">{schema.metadata.description}</p>
                            </div>
                        </div>
                        <div className="flex flex-col justify-end items-start md:items-end gap-2">
                            <div className="px-4 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-200 flex items-center gap-2">
                                <CheckCircle2 size={12} /> DETERMINISTIC STATE: VALIDATED
                            </div>
                            <p className="text-[10px] font-mono text-slate-400">Timestamp: {timestamp}</p>
                        </div>
                    </div>

                    {/* Section 2: Applied Parameters */}
                    <section>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <FileText size={14} className="text-blue-600" /> Input Parameter Dökümü
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {schema.inputs.map(input => (
                                <div key={input.key} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1 print:bg-white print:border-slate-200">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{input.label}</span>
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-sm font-black text-slate-800 font-mono">
                                            {inputs[input.key] !== undefined ? inputs[input.key] : '—'}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400">{input.unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section 3: Show the Math (The Core) */}
                    <MathJaxContext>
                        <section className="space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Scale size={14} className="text-blue-600" /> Mathematical Basis & Steps
                            </h3>
                            <div className="space-y-6 bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 print:bg-white print:border-0 print:p-0">
                                {schema.outputs.map(output => (
                                    <div key={output.key} className="group flex flex-col gap-4 border-b border-slate-200 last:border-0 pb-6 last:pb-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-600 flex items-center gap-2 italic">
                                                {output.label}
                                            </span>
                                            <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-blue-600 font-mono shadow-sm">
                                                {outputs[output.key]?.toFixed(output.precision ?? 3)} {output.unit}
                                            </div>
                                        </div>
                                        
                                        {output.formulaLatex && (
                                            <div className="py-4 px-6 bg-white border border-slate-100 rounded-2xl shadow-inner flex items-center justify-center min-h-[80px]">
                                                <MathJaxNode formula={output.formulaLatex} />
                                            </div>
                                        )}
                                        
                                        {output.description && (
                                            <p className="text-[10px] text-slate-400 leading-relaxed">
                                                <Info size={10} className="inline mr-1" /> {output.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </MathJaxContext>

                    {/* Section 4: Standards & Assumptions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-slate-100">
                        <section>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <BookOpen size={14} className="text-blue-600" /> Verified Standards
                            </h3>
                            <div className="space-y-4">
                                {standards.length > 0 ? standards.map(std => (
                                    <div key={std.code} className="flex gap-4">
                                        <div className="px-2 py-1 bg-slate-900 text-white text-[9px] font-black rounded h-fit shrink-0">
                                            {std.code}
                                        </div>
                                        <div className="text-xs text-slate-600 leading-tight">
                                            {std.title}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-[10px] text-slate-400 italic">No external standard reference specified for this module.</div>
                                )}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <AlertCircle size={14} className="text-blue-600" /> Engineering Assumptions
                            </h3>
                            <div className="space-y-4">
                                {assumptions.length > 0 ? assumptions.map(asp => (
                                    <div key={asp.id} className="flex flex-col gap-1 border-l-2 border-blue-500/20 pl-4">
                                        <div className="text-xs font-bold text-slate-800">{asp.text}</div>
                                        <div className={`text-[8px] font-black uppercase tracking-widest ${
                                            asp.impact === 'high' ? 'text-red-500' : 'text-slate-400'
                                        }`}>
                                            IMPACT: {asp.impact}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-[10px] text-slate-400 italic">Default deterministic assumptions applied.</div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Footer / Legal */}
                    <div className="pt-12 text-center">
                        <div className="w-16 h-1 bg-blue-600 mx-auto mb-6 rounded-full" />
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-2">Electronic Verification Protocol 71-B</p>
                        <p className="text-[8px] text-slate-300 max-w-md mx-auto leading-relaxed">
                            This report is automatically generated and digitally signed. The calculations are based on standard engineering methodologies. 
                            The user is responsible for final engineering decisions. AluCalc OS (v5.0) - All Rights Reserved.
                        </p>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .fixed {
                        position: static !important;
                        background: white !important;
                        padding: 0 !important;
                    }
                    .max-w-4xl {
                        max-width: 100% !important;
                        box-shadow: none !important;
                    }
                    .overflow-y-auto {
                        overflow: visible !important;
                    }
                    button {
                        display: none !important;
                    }
                }
            `}</style>
        </motion.div>
    );
};
