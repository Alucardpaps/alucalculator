'use client';

import React, { useMemo, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { PDFReportEngine, ReportMetadata } from '@/lib/pdfReportEngine';
import { ReportSettingsModal } from '@/components/ui/ReportSettingsModal';
import {
    Trash2,
    Download,
    Layers,
    Scale,
    DollarSign,
    Plus,
    Minus,
    FileText,
    Zap,
    Activity,
    ShieldCheck,
    Clock,
    ChevronRight,
    Search
} from 'lucide-react';
import { CalculationReport } from '@/components/calculators/CalculationReport';
import { CALCULATOR_REGISTRY_V2 } from '@/calculators/registry-v2';
import { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';

export default function ProjectManagerModule() {
    const { items, removeItem, clearProject, getTotalWeight, getTotalCost, updateItem } = useProjectStore();
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [selectedCalc, setSelectedCalc] = useState<{item: any, schema: CalculatorSchemaV2} | null>(null);

    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => b.timestamp - a.timestamp);
    }, [items]);

    const handleQuantityChange = (id: string, current: number, delta: number) => {
        const next = Math.max(1, current + delta);
        updateItem(id, { quantity: next });
    };

    const exportCSV = () => {
        if (items.length === 0) return;
        const headers = ['Name', 'Type', 'Category/Analysis', 'Qty', 'Unit Wt (kg)', 'Status', 'Timestamp'];
        const rows = items.map(i => [
            i.name, 
            i.type.toUpperCase(),
            i.type === 'calculation' ? i.snapshot?.title : i.category, 
            i.quantity,
            i.weightPerUnit.toFixed(3), 
            i.status || 'SUCCESS',
            new Date(i.timestamp).toLocaleString()
        ]);

        const content = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AluCalc_Project_BOM_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    const handleViewReport = async (item: any) => {
        if (!item.snapshot) return;
        const entry = CALCULATOR_REGISTRY_V2[item.snapshot.schemaId];
        if (!entry) return;
        const module = await entry.loader();
        const schema = (module as any).default ?? module;
        setSelectedCalc({ item, schema: schema as CalculatorSchemaV2 });
    };

    const generateEnterpriseReport = async (metadata: ReportMetadata) => {
        if (items.length === 0) return;

        const engine = new PDFReportEngine(metadata);

        let yPos = engine.addMetadataSection();

        yPos = engine.addKPIs([
            { label: "Total Line Items", value: items.length.toString() },
            { label: "Project Weight", value: `${getTotalWeight().toFixed(3)} kg` },
            { label: "Total Valuation", value: `$${getTotalCost().toFixed(2)}` }
        ], yPos);

        yPos = engine.addSectionTitle("Bill of Materials (BOM)", yPos);

        const tableColumn = ["Name", "Category", "Material", "Qty", "Unit Wt (kg)", "Unit Cost ($)", "Total Wt (kg)", "Total Cost ($)"];
        const tableRows = items.map(i => [
            i.name, i.category || '', i.material || '', i.quantity.toString(),
            i.weightPerUnit.toFixed(3), i.costPerUnit.toFixed(2),
            i.totalWeight.toFixed(3), i.totalCost.toFixed(2)
        ]);

        engine.addTable({
            head: [tableColumn],
            body: tableRows,
            startY: yPos
        });

        engine.save(`Project_Quote_${metadata.referenceNo}.pdf`);
    };

    const generateTechnicalDossier = async (metadata: ReportMetadata) => {
        if (items.length === 0) return;

        const engine = new PDFReportEngine(metadata);
        
        // 1. Project Summary Page
        let yPos = engine.addMetadataSection();
        yPos = engine.addKPIs([
            { label: "Total Line Items", value: items.length.toString() },
            { label: "Engineering Analysis", value: items.filter(i => i.type === 'calculation').length.toString() },
            { label: "Project Weight", value: `${getTotalWeight().toFixed(2)} kg` }
        ], yPos);

        yPos = engine.addSectionTitle("Project Master BOM", yPos);
        const tableColumn = ["Item Name", "Type", "Details", "Qty", "Status"];
        const tableRows = items.map(i => [
            i.name,
            i.type.toUpperCase(),
            i.type === 'calculation' ? (i.snapshot?.title || '') : (i.material || ''),
            i.quantity.toString(),
            (i.status || 'Success').toUpperCase()
        ]);

        engine.addTable({
            head: [tableColumn],
            body: tableRows,
            startY: yPos
        });

        // 2. Individual Calculation Certificates (The Dossier)
        items.filter(i => i.type === 'calculation').forEach(calc => {
            engine.addCalculationDossier(calc);
        });

        engine.save(`Technical_Dossier_${metadata.referenceNo || 'GEN'}.pdf`);
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500 px-6">
                <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center">
                    <Layers size={32} strokeWidth={1.5} />
                </div>
                <div className="text-center">
                    <h3 className="text-sm font-bold text-white mb-1">Project BOM is Empty</h3>
                    <p className="text-[11px] max-w-[200px] leading-relaxed">Add components from Profile Weight, Fasteners, or other modules to build your technical quote.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#0a0e14] overflow-hidden">
            {/* KPI Summary */}
            <div className="grid grid-cols-2 gap-4 p-5 border-b border-white/5 bg-gradient-to-b from-[#0f1419] to-[#0a0e14]">
                <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-md transition-all hover:bg-cyan-500/10">
                    <div className="flex items-center gap-2 mb-2 text-cyan-400">
                        <Scale size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Project Weight</span>
                    </div>
                    <div className="text-2xl font-black text-white font-mono tracking-tight">
                        {getTotalWeight().toFixed(3)} <span className="text-xs text-slate-500">kg</span>
                    </div>
                </div>
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md transition-all hover:bg-emerald-500/10">
                    <div className="flex items-center gap-2 mb-2 text-emerald-400">
                        <DollarSign size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Total Valuation</span>
                    </div>
                    <div className="text-2xl font-black text-white font-mono tracking-tight">
                        ${getTotalCost().toFixed(2)}
                    </div>
                </div>
            </div>

            {/* BOM Table/List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                <div className="flex justify-between items-center px-2 mb-2">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{items.length} Line Items Identified</h3>
                    <button onClick={clearProject} className="text-[9px] font-bold text-red-500/60 hover:text-red-400 transition-colors uppercase tracking-widest">Flush Project</button>
                </div>

                {sortedItems.map((item) => (
                    <div key={item.id} className="group relative bg-[#0f1419]/80 border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-black text-white truncate">{item.name}</h4>
                                    {item.type === 'calculation' && (
                                        <div className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border ${
                                            item.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                            item.status === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                            {item.status || 'Verified'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-[8px] font-bold text-slate-400 uppercase tracking-widest border border-white/5">
                                        {item.type === 'calculation' ? 'Engineering Analysis' : item.category}
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-mono">
                                        {item.type === 'calculation' ? item.snapshot?.title : `[${item.material}]`}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {item.type === 'calculation' && (
                                    <button 
                                        onClick={() => handleViewReport(item)}
                                        className="p-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                        title="View Audit Trail"
                                    >
                                        <Search size={14} />
                                    </button>
                                )}
                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        {item.type === 'calculation' ? (
                            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="block text-[8px] font-bold text-slate-600 uppercase">Snapshot Date</span>
                                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                        <Clock size={10} /> {new Date(item.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[8px] font-bold text-slate-600 uppercase mb-1">Key Result</span>
                                    <div className="flex items-center justify-end gap-2 text-blue-400 font-mono font-black text-xs">
                                        {Object.entries(item.snapshot?.outputs || {}).slice(0, 1).map(([k, v]: any) => (
                                            <span key={k}>{typeof v === 'number' ? v.toFixed(2) : v}</span>
                                        ))}
                                        <ChevronRight size={10} className="text-slate-700" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-3 pt-4 border-t border-white/5">
                                <div className="col-span-1">
                                    <span className="block text-[8px] font-bold text-slate-600 uppercase mb-2">Quantity</span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleQuantityChange(item.id, item.quantity, -1)} className="w-5 h-5 rounded bg-white/5 flex items-center justify-center hover:bg-white/10 text-white transition-colors"><Minus size={10} /></button>
                                        <span className="text-xs font-black text-white w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => handleQuantityChange(item.id, item.quantity, 1)} className="w-5 h-5 rounded bg-white/5 flex items-center justify-center hover:bg-white/10 text-white transition-colors"><Plus size={10} /></button>
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-[8px] font-bold text-slate-600 uppercase mb-2">Unit Cost</span>
                                    <span className="text-[11px] font-bold text-slate-400 font-mono">${(item.costPerUnit).toFixed(2)}</span>
                                </div>
                                <div>
                                    <span className="block text-[8px] font-bold text-slate-600 uppercase mb-2">Line Wt</span>
                                    <span className="text-[11px] font-black text-white font-mono">{item.totalWeight.toFixed(2)}kg</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[8px] font-bold text-slate-600 uppercase mb-2">Line Cost</span>
                                    <span className="text-[11px] font-black text-emerald-400 font-mono">${item.totalCost.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {selectedCalc && (
                <CalculationReport 
                    schema={selectedCalc.schema}
                    inputs={selectedCalc.item.snapshot.inputs}
                    outputs={selectedCalc.item.snapshot.outputs}
                    onClose={() => setSelectedCalc(null)}
                />
            )}

            {/* Action Bar */}
            <div className="p-4 border-t border-white/5 bg-[#0a0e14] flex gap-2">
                <button
                    onClick={exportCSV}
                    className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/5 shadow-md active:scale-[0.98]"
                >
                    <Download size={14} /> Export BOM (CSV)
                </button>
                <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="flex-1 py-3 px-4 bg-white text-black hover:bg-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl active:scale-[0.98]"
                >
                    <FileText size={14} /> Full Technical Dossier (PDF)
                </button>
            </div>

            <ReportSettingsModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onGenerate={generateTechnicalDossier}
                defaultTitle="Project Technical Dossier"
            />
        </div>
    );
}
