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
    FileText
} from 'lucide-react';

export default function ProjectManagerModule() {
    const { items, removeItem, updateQuantity, clearProject, getTotalWeight, getTotalCost } = useProjectStore();
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => b.timestamp - a.timestamp);
    }, [items]);

    const handleQuantityChange = (id: string, current: number, delta: number) => {
        const next = Math.max(1, current + delta);
        updateQuantity(id, next);
    };

    const exportCSV = () => {
        if (items.length === 0) return;
        const headers = ['Name', 'Category', 'Material', 'Qty', 'Unit Weight (kg)', 'Unit Cost ($)', 'Total Weight (kg)', 'Total Cost ($)'];
        const rows = items.map(i => [
            i.name, i.category, i.material, i.quantity,
            i.weightPerUnit.toFixed(3), i.costPerUnit.toFixed(2),
            i.totalWeight.toFixed(3), i.totalCost.toFixed(2)
        ]);

        const content = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AluCalc_Project_BOM_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
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
            i.name, i.category, i.material, i.quantity.toString(),
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
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-black text-white truncate pr-4">{item.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-[8px] font-bold text-slate-400 uppercase tracking-widest border border-white/5">{item.category}</span>
                                    <span className="text-[9px] text-slate-500 font-mono">[{item.material}]</span>
                                </div>
                            </div>
                            <button
                                onClick={() => removeItem(item.id)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

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
                    </div>
                ))}
            </div>

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
                    <FileText size={14} /> Request Quote (PDF)
                </button>
            </div>

            <ReportSettingsModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onGenerate={generateEnterpriseReport}
                defaultTitle="Commercial Proposal & BOM"
            />
        </div>
    );
}
