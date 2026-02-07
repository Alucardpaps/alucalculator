'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Box, Ruler, Layers, Search, AlertCircle } from 'lucide-react';

// =============================================================================
// MATERIALS DATABASE (Properties)
// =============================================================================
const MATERIALS_DB = {
    steel: [
        { name: 'S235JR', yield: 235, tensile: 360, density: 7.85, E: 210, type: 'Structural' },
        { name: 'S355J2', yield: 355, tensile: 470, density: 7.85, E: 210, type: 'Structural' },
        { name: 'S420MC', yield: 420, tensile: 500, density: 7.85, E: 210, type: 'High Strength' },
        { name: 'C45 (1.0503)', yield: 370, tensile: 700, density: 7.85, E: 205, type: 'Quenched & Tempered' },
        { name: '42CrMo4 (1.7225)', yield: 750, tensile: 1000, density: 7.85, E: 210, type: 'High Strength Alloy' },
        { name: '16MnCr5 (1.7131)', yield: 600, tensile: 800, density: 7.85, E: 210, type: 'Case Hardening' },
        { name: 'AISI 1018', yield: 250, tensile: 400, density: 7.87, E: 205, type: 'Carbon' },
        { name: 'AISI 1045', yield: 310, tensile: 565, density: 7.85, E: 206, type: 'Medium Carbon' },
        { name: 'AISI 4140', yield: 655, tensile: 850, density: 7.85, E: 210, type: 'Chromoly' },
        { name: 'D2 Tool Steel', yield: 1600, tensile: 1900, density: 7.70, E: 210, type: 'Tool Steel' },
        { name: '304 SS', yield: 215, tensile: 505, density: 8.00, E: 193, type: 'Stainless' },
        { name: '316L SS', yield: 220, tensile: 520, density: 8.00, E: 193, type: 'Stainless' },
    ],
    aluminum: [
        { name: '6061-T6', yield: 276, tensile: 310, density: 2.70, E: 69, type: 'Structural' },
        { name: '7075-T6', yield: 503, tensile: 572, density: 2.81, E: 72, type: 'High Strength' },
        { name: '5083-H111', yield: 125, tensile: 275, density: 2.66, E: 71, type: 'Marine' },
        { name: '2024-T3', yield: 345, tensile: 483, density: 2.78, E: 73, type: 'Aerospace' },
    ],
    plastic: [
        { name: 'POM (Delrin)', yield: 65, tensile: 70, density: 1.41, E: 3.1, type: 'Engineering' },
        { name: 'PA6 (Nylon)', yield: 45, tensile: 80, density: 1.15, E: 2.8, type: 'Engineering' },
        { name: 'PEEK', yield: 95, tensile: 100, density: 1.32, E: 3.6, type: 'High Performance' },
    ],
    misc: [
        { name: 'CuSn12 (Bronze)', yield: 150, tensile: 300, density: 8.6, E: 90, type: 'Bearing' },
        { name: 'CuZn39Pb3 (Brass)', yield: 250, tensile: 430, density: 8.4, E: 100, type: 'Free Machining' },
    ]
};

type MaterialCategory = keyof typeof MATERIALS_DB;

// =============================================================================
// INVENTORY TYPES
// =============================================================================
export interface StockItem {
    id: string;
    material: string;
    form: 'round' | 'rect' | 'sheet';
    dim1: number; // Diameter or Width (mm)
    dim2?: number; // Height or Thickness (mm)
    length: number; // Length (mm)
    qty: number;
}

/**
 * MaterialsDatabaseModule - Engineering materials reference + Inventory
 */
export default function MaterialsDatabaseModule() {
    const [view, setView] = useState<'database' | 'inventory'>('database');

    // Database State
    const [category, setCategory] = useState<MaterialCategory>('steel');
    const [search, setSearch] = useState('');
    const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

    // Inventory State
    const [stock, setStock] = useState<StockItem[]>([]);
    const [newStock, setNewStock] = useState<Partial<StockItem>>({ form: 'round', material: 'S235JR', qty: 1 });

    // Load Stock from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem('manufacturing_stock');
        if (saved) {
            try { setStock(JSON.parse(saved)); } catch (e) { console.error('Stock load error', e); }
        } else {
            // Default Demo Stock
            setStock([
                { id: '1', material: 'S355J2', form: 'round', dim1: 50, length: 1500, qty: 2 },
                { id: '2', material: '42CrMo4', form: 'round', dim1: 160, length: 3000, qty: 1 }, // Perfect for the user's gear!
                { id: '3', material: 'POM (Delrin)', form: 'sheet', dim1: 1000, dim2: 500, length: 20, qty: 5 },
            ]);
        }
    }, []);

    // Save Stock
    useEffect(() => {
        if (stock.length > 0) {
            localStorage.setItem('manufacturing_stock', JSON.stringify(stock));
            // Also notify OS Store via custom event if we want real-time updates across modules,
            // but for now modules will read from localStorage or we rely on OS state lifting later.
            window.dispatchEvent(new Event('stock-updated'));
        }
    }, [stock]);

    // Database Logic
    const materials = useMemo(() => {
        const list = MATERIALS_DB[category];
        if (!search) return list;
        return list.filter(m =>
            m.name.toLowerCase().includes(search.toLowerCase()) ||
            m.type.toLowerCase().includes(search.toLowerCase())
        );
    }, [category, search]);

    const selected = useMemo(() => {
        if (!selectedMaterial) return null;
        return MATERIALS_DB[category].find(m => m.name === selectedMaterial);
    }, [category, selectedMaterial]);

    // Inventory Logic
    const addStock = () => {
        if (!newStock.material || !newStock.dim1 || !newStock.length) return;
        const item: StockItem = {
            id: Math.random().toString(36).substr(2, 9),
            material: newStock.material!,
            form: newStock.form as any,
            dim1: Number(newStock.dim1),
            dim2: newStock.dim2 ? Number(newStock.dim2) : undefined,
            length: Number(newStock.length),
            qty: Number(newStock.qty) || 1
        };
        setStock(prev => [...prev, item]);
        setNewStock(prev => ({ ...prev, dim1: undefined, length: undefined, qty: 1 })); // Reset fields
    };

    const removeStock = (id: string) => {
        setStock(prev => prev.filter(s => s.id !== id));
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-slate-200">
            {/* Header Tabs */}
            <div className="flex bg-[#252525] p-1 gap-1 border-b border-[#333]">
                <button
                    onClick={() => setView('database')}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded flex items-center justify-center gap-2 transition-all ${view === 'database' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-[#333]'}`}
                >
                    <Layers size={14} /> Global Material DB
                </button>
                <button
                    onClick={() => setView('inventory')}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded flex items-center justify-center gap-2 transition-all ${view === 'inventory' ? 'bg-ind-orange text-white' : 'text-slate-400 hover:bg-[#333]'}`}
                >
                    <Box size={14} /> Shop Inventory
                </button>
            </div>

            {/* --- DATABASE VIEW --- */}
            {view === 'database' && (
                <div className="flex flex-col gap-3 h-full p-3">
                    {/* Category Tabs */}
                    <div className="flex gap-1 flex-wrap">
                        {(Object.keys(MATERIALS_DB) as MaterialCategory[]).map(cat => (
                            <button
                                key={cat}
                                onClick={() => { setCategory(cat); setSelectedMaterial(null); }}
                                className="px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all"
                                style={{
                                    backgroundColor: category === cat ? 'var(--color-os-accent)' : 'var(--color-os-header)',
                                    color: category === cat ? 'var(--color-os-canvas)' : 'var(--color-os-text-secondary)',
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input
                            type="text"
                            placeholder="Search standard materials..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 rounded text-xs bg-[#252525] border border-[#333] focus:border-blue-500 outline-none"
                        />
                    </div>

                    {/* Materials List */}
                    <div className="flex-1 overflow-auto rounded-lg border border-[#333] bg-[#000]/20">
                        <table className="w-full text-[10px]">
                            <thead className="bg-[#2a2a2a] text-slate-400 sticky top-0">
                                <tr>
                                    <th className="text-left px-2 py-1.5 font-bold">Material</th>
                                    <th className="text-right px-2 py-1.5 font-bold">Yield (MPa)</th>
                                    <th className="text-right px-2 py-1.5 font-bold">Tensile (MPa)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#333]">
                                {materials.map(m => (
                                    <tr
                                        key={m.name}
                                        onClick={() => setSelectedMaterial(m.name)}
                                        className={`cursor-pointer transition-colors ${selectedMaterial === m.name ? 'bg-blue-900/40 text-blue-200' : 'hover:bg-[#333]'}`}
                                    >
                                        <td className="px-2 py-1.5 font-medium border-l-2 border-transparent" style={{ borderColor: selectedMaterial === m.name ? '#3b82f6' : 'transparent' }}>{m.name}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-slate-400">{m.yield}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-slate-400">{m.tensile}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Detail */}
                    {selected && (
                        <div className="p-3 rounded-lg bg-[#252525] border border-blue-500/30 shadow-lg">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-blue-400">{selected.name}</span>
                                <span className="text-[10px] bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded">{selected.type}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-[10px]">
                                <DetailBox label="Yield" value={selected.yield} unit="MPa" />
                                <DetailBox label="Tensile" value={selected.tensile} unit="MPa" />
                                <DetailBox label="Density" value={selected.density} unit="g/cm³" />
                                <DetailBox label="E-Modulus" value={selected.E} unit="GPa" />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- INVENTORY VIEW --- */}
            {view === 'inventory' && (
                <div className="flex flex-col h-full p-3 gap-4">
                    {/* Add Stock Form */}
                    <div className="bg-[#252525] p-3 rounded-lg border border-[#333]">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                            <Plus size={14} /> Add New Stock
                        </div>
                        <div className="grid grid-cols-[1fr_80px_60px_60px_40px] gap-2 mb-2">
                            <input
                                type="text"
                                placeholder="Material Name (e.g. S355)"
                                className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs"
                                value={newStock.material}
                                onChange={e => setNewStock({ ...newStock, material: e.target.value })}
                            />
                            <select
                                className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs"
                                value={newStock.form}
                                onChange={e => setNewStock({ ...newStock, form: e.target.value as any })}
                            >
                                <option value="round">Round Ø</option>
                                <option value="rect">Rect</option>
                                <option value="sheet">Sheet</option>
                            </select>
                            <input
                                type="number"
                                placeholder={newStock.form === 'round' ? 'Dia' : 'Width'}
                                className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs"
                                value={newStock.dim1 || ''}
                                onChange={e => setNewStock({ ...newStock, dim1: Number(e.target.value) })}
                            />
                            <input
                                type="number"
                                placeholder="Len"
                                className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs"
                                value={newStock.length || ''}
                                onChange={e => setNewStock({ ...newStock, length: Number(e.target.value) })}
                            />
                            <input
                                type="number"
                                placeholder="Qty"
                                className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs text-center"
                                value={newStock.qty || 1}
                                onChange={e => setNewStock({ ...newStock, qty: Number(e.target.value) })}
                            />
                        </div>
                        <button
                            onClick={addStock}
                            className="w-full py-1.5 bg-ind-orange text-white text-xs font-bold rounded hover:bg-orange-600 transition-colors"
                        >
                            ADD TO STOCK
                        </button>
                    </div>

                    {/* Stock List */}
                    <div className="flex-1 overflow-auto">
                        <div className="grid gap-2">
                            {stock.length === 0 && (
                                <div className="text-center text-slate-500 py-8 text-xs">No stock items available.</div>
                            )}
                            {stock.map(item => (
                                <div key={item.id} className="bg-[#2a2a2a] p-2 rounded border border-[#333] flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-500">
                                            {item.form === 'round' ? <div className="w-4 h-4 rounded-full border-2 border-slate-500" /> : <div className="w-4 h-4 border-2 border-slate-500" />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-white">{item.material}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">
                                                {item.form === 'round' ? `Ø${item.dim1}mm` : `${item.dim1}x${item.dim2}mm`} × L{item.length}mm
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-500 uppercase">Available</div>
                                            <div className="text-lg font-bold text-ind-orange">{item.qty}</div>
                                        </div>
                                        <button
                                            onClick={() => removeStock(item.id)}
                                            className="p-2 hover:bg-red-900/20 text-slate-600 hover:text-red-400 rounded transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailBox({ label, value, unit }: { label: string, value: number, unit: string }) {
    return (
        <div className="bg-[#1a1a1a] p-1.5 rounded">
            <div className="text-[8px] text-slate-500 uppercase">{label}</div>
            <div className="font-mono text-white text-xs">{value} <span className="text-[8px] text-slate-600">{unit}</span></div>
        </div>
    );
}
