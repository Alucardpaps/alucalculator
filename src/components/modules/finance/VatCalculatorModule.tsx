'use client';

import { useState } from 'react';
import { Calculator, Percent, Delete } from 'lucide-react';

export default function VatCalculatorModule() {
    const [amount, setAmount] = useState<string>('');
    const [rate, setRate] = useState<number>(20);

    const numericAmount = parseFloat(amount) || 0;
    const vatAmount = numericAmount * (rate / 100);
    const total = numericAmount + vatAmount;

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-slate-200 p-4 select-none">
            <div className="mb-6 bg-[#252525] p-4 rounded-xl border border-[#333]">
                <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Total Amount</div>
                <div className="text-4xl font-mono text-white break-all">
                    {total.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                </div>
                <div className="flex justify-between mt-2 text-xs">
                    <span className="text-slate-500">Net: {numericAmount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</span>
                    <span className="text-blue-400">VAT: {vatAmount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</span>
                </div>
            </div>

            <div className="space-y-4">
                {/* Rate Selector */}
                <div>
                    <div className="text-[10px] uppercase text-slate-500 font-bold mb-2">VAT Rate (%)</div>
                    <div className="flex gap-2">
                        {[1, 8, 10, 18, 20].map(r => (
                            <button
                                key={r}
                                onClick={() => setRate(r)}
                                className={`flex-1 py-2 rounded text-xs font-bold transition-all ${rate === r ? 'bg-blue-600 text-white' : 'bg-[#252525] text-slate-400 hover:bg-[#333]'}`}
                            >
                                {r}%
                            </button>
                        ))}
                    </div>
                </div>

                {/* Numpad */}
                <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map(n => (
                        <button
                            key={n}
                            onClick={() => setAmount(prev => prev.includes('.') && n === '.' ? prev : prev + n)}
                            className="bg-[#252525] hover:bg-[#333] text-lg font-bold py-3 rounded transition-colors"
                        >
                            {n}
                        </button>
                    ))}
                    <button
                        onClick={() => setAmount(prev => prev.slice(0, -1))}
                        className="bg-[#2a1a1a] hover:bg-red-900/20 text-red-400 py-3 rounded flex items-center justify-center transition-colors"
                    >
                        <Delete size={20} />
                    </button>
                </div>

                <button
                    onClick={() => setAmount('')}
                    className="w-full py-2 bg-[#252525] hover:bg-[#333] text-slate-400 text-xs font-bold uppercase rounded"
                >
                    Clear All
                </button>
            </div>
        </div>
    );
}
