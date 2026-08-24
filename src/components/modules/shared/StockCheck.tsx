'use client';

import { useState, useEffect } from 'react';
import { Package, CheckCircle, AlertTriangle } from 'lucide-react';

interface StockRequirement {
    type: 'round' | 'rect' | 'sheet' | 'tube';
    material: string; // e.g., "S355"
    dims: {
        d?: number; // Diameter
        w?: number; // Width
        h?: number; // Height
        t?: number; // Thickness
        l: number;  // Length
    };
    qty: number;
}

export function StockCheck({ requirements }: { requirements: StockRequirement[] }) {
    const [status, setStatus] = useState<'checking' | 'found' | 'partial' | 'missing'>('checking');
    const [matches, setMatches] = useState<any[]>([]);

    useEffect(() => {
        const checkInventory = () => {
            const saved = localStorage.getItem('manufacturing_stock');
            if (!saved) {
                setStatus('missing');
                return;
            }

            const inventory = JSON.parse(saved);
            const foundItems: any[] = [];
            let allFound = true;
            let anyFound = false;

            requirements.forEach(req => {
                // Fuzzy match material name
                const validStock = inventory.filter((item: any) => {
                    if (!item.material.toLowerCase().includes(req.material.toLowerCase())) return false;

                    // Dimension Check
                    if (req.type === 'round' && item.form === 'round') {
                        return (Number(item.dim1) >= (req.dims.d || 0)) && (Number(item.length) >= req.dims.l);
                    }
                    if (req.type === 'rect' && item.form === 'rect') {
                        return (Number(item.dim1) >= (req.dims.w || 0)) && (Number(item.dim2) >= (req.dims.h || 0)) && (Number(item.length) >= req.dims.l);
                    }
                    // Add other form logic if needed
                    return false;
                });

                if (validStock.length > 0) {
                    foundItems.push({ req, stock: validStock });
                    anyFound = true;
                } else {
                    allFound = false;
                }
            });

            setMatches(foundItems);
            if (foundItems.length === 0) setStatus('missing');
            else if (allFound) setStatus('found');
            else setStatus('partial');
        };

        checkInventory();
        const interval = setInterval(checkInventory, 2000);
        return () => clearInterval(interval);

    }, [requirements]);

    return (
        <div className={`p-3 rounded-lg border border-l-4 transition-colors ${status === 'found' ? 'bg-green-900/10 border-green-500 border-l-green-500' :
                status === 'partial' ? 'bg-amber-900/10 border-amber-500 border-l-amber-500' :
                    'bg-red-900/10 border-red-500 border-l-red-500'
            }`}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <Package size={16} className="text-slate-400" />
                    <span className="text-xs font-bold uppercase text-slate-300">Inventory Check</span>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 ${status === 'found' ? 'bg-green-500 text-black' :
                        status === 'partial' ? 'bg-amber-500 text-black' :
                            'bg-red-500 text-white'
                    }`}>
                    {status === 'found' && <CheckCircle size={10} />}
                    {status === 'partial' && <AlertTriangle size={10} />}
                    {status === 'missing' && <AlertTriangle size={10} />}
                    {status === 'found' ? 'IN STOCK' : status === 'partial' ? 'PARTIAL STOCK' : 'NO STOCK'}
                </div>
            </div>

            <div className="space-y-2">
                {requirements.map((req, i) => {
                    const match = matches.find(m => m.req === req);
                    return (
                        <div key={i} className="text-[10px] space-y-1">
                            <div className="flex justify-between text-slate-400">
                                <span>Req: {req.material} ({req.type})</span>
                                <span>
                                    {req.type === 'round' ? `Ø${req.dims.d} x ${req.dims.l}` :
                                        req.type === 'rect' ? `${req.dims.w}x${req.dims.h} x ${req.dims.l}` : ''} mm
                                </span>
                            </div>
                            {match ? (
                                <div className="bg-black/20 p-1.5 rounded text-green-400 flex justify-between">
                                    <span>✓ Found: {match.stock[0].material}</span>
                                    <span className="font-mono">Qty: {match.stock[0].qty}</span>
                                </div>
                            ) : (
                                <div className="bg-red-900/20 p-1.5 rounded text-red-300 italic">
                                    ✗ No matching stock found.
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
