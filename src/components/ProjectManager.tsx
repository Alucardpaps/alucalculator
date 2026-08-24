"use client";

import { useState, useMemo, useEffect } from 'react';
import { Trash2, Download, Calculator, BarChart3, Scissors, Save, Layers } from 'lucide-react';
import { calculateNesting, NestingResult, CutItem } from '@/utils/nestingAlgorithm';
import { MetalShape } from '@/hooks/useWeightCalculator';

interface ProjectItem {
    id: string;
    shape: MetalShape;
    material: string;
    description: string;
    qty: number;
    length: number; // mm
    weight: number; // Single item weight
    totalWeight: number;
    cost: number;
}

interface ProjectManagerProps {
    items: ProjectItem[];
    setItems: (items: ProjectItem[]) => void;
    unitPrice: number;
    currency: string;
    lang: string;
    dict: any;
}

export const ProjectManager = ({ items, setItems, unitPrice, currency, lang, dict }: ProjectManagerProps) => {
    const [stockLength, setStockLength] = useState(6000); // Standard 6m
    const [bladeWidth, setBladeWidth] = useState(4); // 4mm saw
    const [nestingResult, setNestingResult] = useState<NestingResult | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'nesting'>('grid');

    // Persistence for stock settings
    useEffect(() => {
        const saved = localStorage.getItem('alu_nesting_settings');
        if (saved) {
            const { stock, blade } = JSON.parse(saved);
            if (stock) setStockLength(stock);
            if (blade) setBladeWidth(blade);
        }
    }, []);

    const handleRunNesting = () => {
        const cutList: CutItem[] = items.map(item => ({
            id: item.id,
            length: item.length, // Ensure inputs use mm logic in parent or convert here. Assuming stored as raw dimension? 
            // Parent stores display text. 'length' was missing in ProjectItem interface in parent.
            // We need to make sure parent passes length. 
            // For now, let's assume we update parent to store raw length.
            qty: item.qty,
            label: `${item.shape} ${item.length}mm`
        }));

        const result = calculateNesting(cutList, stockLength, { bladeWidth });
        setNestingResult(result);
        setViewMode('nesting');

        localStorage.setItem('alu_nesting_settings', JSON.stringify({ stock: stockLength, blade: bladeWidth }));
    };

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const exportPDF = async () => {
        const jsPDF = (await import('jspdf')).default;
        const autoTable = (await import('jspdf-autotable')).default;
        const doc = new jsPDF();

        // BRANDING
        doc.setFillColor(10, 35, 66); // Brand Blue
        doc.rect(0, 0, 210, 25, 'F');
        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255);
        doc.text("ALUCALCULATOR", 14, 16);
        doc.setFontSize(10);
        doc.text("Professional BOM & Cutting Plan", 195, 16, { align: 'right' });

        // BOM TABLE
        doc.setTextColor(0, 0, 0);
        doc.text("Bill of Materials", 14, 35);

        autoTable(doc, {
            startY: 40,
            head: [['Description', 'Mat.', 'Qty', 'L (mm)', 'Unit Kg', 'Total Kg', 'Cost']],
            body: items.map(i => [
                i.description,
                i.material,
                i.qty,
                i.length,
                i.weight.toFixed(2),
                i.totalWeight.toFixed(2),
                (i.totalWeight * unitPrice).toFixed(2) + ' ' + currency
            ]),
            theme: 'grid',
            headStyles: { fillColor: [10, 35, 66] }
        });

        // NESTING REPORT
        if (nestingResult) {
            let y = (doc as any).lastAutoTable.finalY + 15;
            doc.setFontSize(14);
            doc.text("Cutting Optimization Plan", 14, y);

            y += 10;
            doc.setFontSize(10);
            doc.text(`Stock Length: ${nestingResult.stockLength}mm | Blade: ${bladeWidth}mm`, 14, y);
            y += 5;
            doc.text(`Total Bars Needed: ${nestingResult.totalStockUsed}`, 14, y);
            doc.text(`Efficiency: ${(100 - nestingResult.totalWastePct).toFixed(1)}%`, 80, y);
            doc.text(`Total Waste: ${nestingResult.totalWaste.toFixed(0)}mm`, 140, y);

            y += 10;

            nestingResult.patterns.forEach((pattern, idx) => {
                if (y > 270) { doc.addPage(); y = 20; }

                doc.setDrawColor(200, 200, 200);
                doc.setFillColor(245, 245, 245);
                doc.rect(14, y, 180, 10, 'FD'); // Stock bar

                let x = 14;
                pattern.cuts.forEach(cut => {
                    const w = (cut.length / nestingResult.stockLength) * 180;
                    doc.setFillColor(16, 185, 129); // Green cut
                    doc.rect(x, y, w, 10, 'F');
                    doc.rect(x, y, w, 10, 'S'); // Border
                    x += w;

                    // Blade
                    const bw = (bladeWidth / nestingResult.stockLength) * 180;
                    doc.setFillColor(200, 0, 0);
                    doc.rect(x, y, bw, 10, 'F');
                    x += bw;
                });

                doc.text(`Bar #${idx + 1} (${pattern.waste.toFixed(0)}mm rem)`, 14, y - 2);
                y += 20;
            });
        }

        doc.save('Project_Report.pdf');
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            {/* TOOLBAR */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 justify-between items-center">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <Layers size={16} /> {dict.project.grid}
                    </button>
                    <button
                        onClick={() => setViewMode('nesting')}
                        className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${viewMode === 'nesting' ? 'bg-white shadow text-ind-orange' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <Scissors size={16} /> {dict.project.nesting}
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {items.length > 0 && (
                        <>
                            <button onClick={exportPDF} className="btn-secondary text-xs py-2 h-auto">
                                <Download size={14} className="mr-2" /> {dict.project.exportPdf}
                            </button>
                            <button onClick={() => setItems([])} className="text-red-400 hover:text-red-600 p-2" title={dict.project.clear}>
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* CONTENT */}
            <div className="p-6">
                {viewMode === 'grid' && (
                    <>
                        {items.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                                <Layers size={48} className="mb-4 opacity-20" />
                                <p>{dict.project.empty}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="p-3 rounded-l-lg">#</th>
                                            <th className="p-3">{dict.aluminum.projectList.columns.desc}</th>
                                            <th className="p-3">{dict.dimensions.length} (mm)</th>
                                            <th className="p-3">{dict.aluminum.projectList.columns.qty}</th>
                                            <th className="p-3 text-right">{dict.common.totalWeight}</th>
                                            <th className="p-3 text-right">{dict.aluminum.projectList.columns.totalCost || 'Cost'}</th>
                                            <th className="p-3 rounded-r-lg"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {items.map((item, i) => (
                                            <tr key={item.id} className="hover:bg-slate-50 group transition-colors">
                                                <td className="p-3 font-mono text-slate-400">{i + 1}</td>
                                                <td className="p-3">
                                                    <div className="font-bold text-slate-800">{item.shape}</div>
                                                    <div className="text-xs text-slate-500">{item.material}</div>
                                                </td>
                                                <td className="p-3 font-mono text-blue-600 font-bold">{item.length}</td>
                                                <td className="p-3">
                                                    <input
                                                        type="number"
                                                        value={item.qty}
                                                        onChange={(e) => {
                                                            const newQty = parseInt(e.target.value) || 0;
                                                            const updated = items.map(x => x.id === item.id ? { ...x, qty: newQty, totalWeight: x.weight * newQty } : x);
                                                            setItems(updated);
                                                        }}
                                                        className="w-16 bg-slate-100 rounded px-2 py-1 font-bold text-center outline-none focus:ring-2 focus:ring-blue-200"
                                                    />
                                                </td>
                                                <td className="p-3 text-right font-mono text-slate-600">{item.totalWeight.toFixed(2)}</td>
                                                <td className="p-3 text-right font-mono text-green-600">
                                                    {unitPrice > 0 ? (item.totalWeight * unitPrice).toFixed(2) : '-'}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {items.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <div className="flex flex-col md:flex-row gap-8 items-end justify-between">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-w-md w-full">
                                        <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
                                            <Scissors size={14} /> {dict.project.settings}
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 mb-1 block">{dict.project.rawLength} (mm)</label>
                                                <input
                                                    type="number"
                                                    value={stockLength}
                                                    onChange={e => setStockLength(Number(e.target.value))}
                                                    className="w-full bg-white border border-slate-200 rounded p-2 text-sm font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 mb-1 block">{dict.project.bladeWidth} (mm)</label>
                                                <input
                                                    type="number"
                                                    value={bladeWidth}
                                                    onChange={e => setBladeWidth(Number(e.target.value))}
                                                    className="w-full bg-white border border-slate-200 rounded p-2 text-sm font-bold"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleRunNesting}
                                            className="w-full mt-4 bg-ind-orange text-white font-bold py-2 rounded-lg hover:shadow-lg hover:bg-orange-600 transition-all flex justify-center gap-2"
                                        >
                                            <BarChart3 size={18} /> {dict.project.calculate}
                                        </button>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-sm text-slate-400 font-bold uppercase mb-1">{dict.common.totalWeight}</div>
                                        <div className="text-4xl font-black text-slate-900 tracking-tighter">
                                            {items.reduce((s, i) => s + i.totalWeight, 0).toFixed(2)} kg
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {viewMode === 'nesting' && (
                    <div className="animate-in fade-in slide-in-from-right-4">
                        {!nestingResult ? (
                            <div className="text-center py-20 text-slate-400">
                                <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
                                <p>{dict.project.empty}</p>
                                <button onClick={handleRunNesting} className="text-blue-600 font-bold mt-2 hover:underline">{dict.project.calculate}</button>
                            </div>
                        ) : (
                            <div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-slate-900 text-white p-4 rounded-xl">
                                        <div className="text-xs opacity-50 uppercase mb-1">{dict.project.totalBars}</div>
                                        <div className="text-3xl font-bold font-mono text-ind-orange">{nestingResult.totalStockUsed}</div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                                        <div className="text-xs text-slate-400 uppercase mb-1">{dict.project.efficiency}</div>
                                        <div className="text-3xl font-bold font-mono text-green-600">{(100 - nestingResult.totalWastePct).toFixed(1)}%</div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                                        <div className="text-xs text-slate-400 uppercase mb-1">{dict.project.waste}</div>
                                        <div className="text-3xl font-bold font-mono text-red-400">{nestingResult.totalWaste.toFixed(0)} <span className="text-sm">mm</span></div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                                        <div className="text-xs text-slate-400 uppercase mb-1">{dict.project.rawLength}</div>
                                        <div className="text-3xl font-bold font-mono text-slate-700">{nestingResult.stockLength} <span className="text-sm">mm</span></div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {nestingResult.patterns.map((pattern, idx) => (
                                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                            <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                                                <span>BAR #{idx + 1}</span>
                                                <span className="text-red-400">{dict.project.rem}: {pattern.waste.toFixed(0)}mm</span>
                                            </div>

                                            {/* Visual Bar */}
                                            <div className="h-12 bg-slate-200 rounded flex overflow-hidden relative">
                                                {pattern.cuts.map((cut, cI) => (
                                                    <div
                                                        key={cI}
                                                        className="h-full bg-green-500 border-r border-white/50 relative group flex items-center justify-center text-white text-[10px] font-bold"
                                                        style={{ width: `${(cut.length / nestingResult.stockLength) * 100}%` }}
                                                        title={`${cut.length}mm`}
                                                    >
                                                        <span className="truncate px-1">{cut.length}</span>
                                                    </div>
                                                ))}
                                                {/* Waste */}
                                                <div className="h-full bg-red-100 flex-1 flex items-center justify-center">
                                                    <span className="text-[10px] text-red-300 font-bold rotate-45">WASTE</span>
                                                </div>
                                            </div>

                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {pattern.cuts.map((cut, i) => (
                                                    <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-600 font-mono">
                                                        {cut.length}mm
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
