'use client';

import React, { useState } from 'react';
import { Calculator, DollarSign, TrendingUp, Download, PieChart } from 'lucide-react';

interface CostItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    category: 'material' | 'labor' | 'overhead';
}

export default function CostEstimatorModule() {
    const [items, setItems] = useState<CostItem[]>([
        { id: '1', description: 'Aluminum Profile (6063)', quantity: 150, unitPrice: 4.5, category: 'material' },
        { id: '2', description: 'Machining Labor', quantity: 8, unitPrice: 45, category: 'labor' },
        { id: '3', description: 'Powder Coating', quantity: 25, unitPrice: 12, category: 'overhead' },
    ]);

    const addItem = () => {
        const newItem: CostItem = {
            id: Date.now().toString(),
            description: 'New Item',
            quantity: 1,
            unitPrice: 0,
            category: 'material'
        };
        setItems([...items, newItem]);
    };

    const updateItem = (id: string, field: keyof CostItem, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    };

    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-slate-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 bg-[#252525] flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg text-green-500">
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-white">Project Cost Estimator</h2>
                        <div className="text-xs text-slate-400">Total Items: {items.length}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Grand Total</div>
                    <div className="text-2xl font-mono text-green-400 font-bold">{currencyFormatter.format(calculateTotal())}</div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto p-4 space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase px-2 mb-2">
                    <div className="col-span-4">Description</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-2 text-right">Qty</div>
                    <div className="col-span-2 text-right">Unit $</div>
                    <div className="col-span-2 text-right">Total</div>
                </div>

                {items.map(item => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-[#252525] p-2 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors group">
                        <div className="col-span-4">
                            <input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                className="w-full bg-transparent border-none text-sm focus:ring-0 px-0"
                            />
                        </div>
                        <div className="col-span-2">
                            <select
                                value={item.category}
                                onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                                className="w-full bg-[#1a1a1a] border-none text-xs rounded px-2 py-1 text-slate-400"
                            >
                                <option value="material">Material</option>
                                <option value="labor">Labor</option>
                                <option value="overhead">Overhead</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                                className="w-full bg-[#1a1a1a] border-none text-xs rounded px-2 py-1 text-right font-mono"
                            />
                        </div>
                        <div className="col-span-2">
                            <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                                className="w-full bg-[#1a1a1a] border-none text-xs rounded px-2 py-1 text-right font-mono"
                            />
                        </div>
                        <div className="col-span-2 text-right font-mono text-sm font-bold text-green-400 flex items-center justify-end gap-2">
                            {currencyFormatter.format(item.quantity * item.unitPrice)}
                            <button
                                onClick={() => removeItem(item.id)}
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity p-1"
                            >
                                x
                            </button>
                        </div>
                    </div>
                ))}

                <button
                    onClick={addItem}
                    className="w-full py-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-500 hover:bg-slate-800 hover:border-slate-600 transition-all flex items-center justify-center gap-2 text-sm font-bold"
                >
                    + Add Cost Item
                </button>
            </div>

            {/* Footer */}
            <div className="bg-[#1a1a1a] p-4 border-t border-slate-800 flex justify-between items-center">
                <div className="flex gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full list-item" /> Material
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full list-item" /> Labor
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full list-item" /> Overhead
                    </div>
                </div>

                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold transition-colors">
                    <Download size={14} /> Export Report
                </button>
            </div>
        </div>
    );
}
