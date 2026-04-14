'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Code2, Copy, Trash2, ArrowRightLeft, Table2, Check } from 'lucide-react';

export default function ExcelHelperModule() {
    const [inputData, setInputData] = useState<string>('');
    const [outputFormat, setOutputFormat] = useState<'json-objects' | 'json-arrays' | 'markdown'>('json-objects');
    const [hasHeader, setHasHeader] = useState<boolean>(true);
    const [copySuccess, setCopySuccess] = useState(false);

    // Dynamic processing
    const parsedData = useMemo(() => {
        if (!inputData.trim()) return '';

        // Standardize newlines and split into rows
        const rows = inputData.replace(/\r\n/g, '\n').trim().split('\n');
        const grid = rows.map(r => r.split('\t').map(c => c.trim()));

        if (grid.length === 0) return '';

        if (outputFormat === 'markdown') {
            const getColWidths = () => {
                const widths: number[] = Array(grid[0].length).fill(0);
                grid.forEach(row => {
                    row.forEach((cell, i) => {
                        if (cell.length > widths[i] || 0) widths[i] = cell.length;
                    });
                });
                return widths;
            };
            const widths = getColWidths();
            
            let md = '';
            grid.forEach((row, rowIndex) => {
                const paddedRow = row.map((cell, i) => cell.padEnd(widths[i]));
                md += '| ' + paddedRow.join(' | ') + ' |\n';
                
                // Add header separator line if we have headers
                if (hasHeader && rowIndex === 0) {
                    const sepRow = widths.map(w => '-'.repeat(w));
                    md += '|-' + sepRow.join('-|-') + '-|\n';
                }
            });
            return md.trim();
        }

        if (outputFormat === 'json-objects') {
            if (!hasHeader) return 'Error: JSON Objects format requires headers.';
            const headers = grid[0];
            const dataRows = grid.slice(1);
            
            const objArr = dataRows.map(row => {
                const obj: Record<string, any> = {};
                headers.forEach((h, i) => {
                    const cell = row[i] || '';
                    // Attempt to parse number
                    const num = Number(cell);
                    obj[h || `Column_${i}`] = (!isNaN(num) && cell !== '') ? num : cell;
                });
                return obj;
            });
            return JSON.stringify(objArr, null, 2);
        }

        if (outputFormat === 'json-arrays') {
            // Attempt numeric conversion map
            const typeCastGrid = grid.map(row => 
                row.map(cell => {
                    const num = Number(cell);
                    return (!isNaN(num) && cell !== '') ? num : cell;
                })
            );
            return JSON.stringify(typeCastGrid, null, 2);
        }

        return '';
    }, [inputData, outputFormat, hasHeader]);

    const handleCopy = async () => {
        if (!parsedData) return;
        try {
            await navigator.clipboard.writeText(parsedData);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy text', err);
        }
    };

    const handlePasteExample = () => {
        const example = `Material\tDensity (kg/m3)\tYield Strength (MPa)
Aluminum 6061\t2700\t276
Steel A36\t7850\t250
Titanium Grade 5\t4430\t880`;
        setInputData(example);
    };

    return (
        <div className="flex flex-col w-full h-full bg-[#05080f] text-white overflow-hidden relative selection:bg-emerald-500/30">
            {/* Visual Grid Layer */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.1),transparent_50%)] pointer-events-none" />

            <div className="flex flex-col h-full max-w-7xl mx-auto w-full p-6 relative z-10 gap-6">
                
                {/* Header */}
                <header className="flex items-center justify-between shrink-0 mb-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-white">Excel Data Transcoder</h1>
                            <p className="text-[10px] text-emerald-500/60 font-mono tracking-widest uppercase">TSV Grid to JSON / Markdown Engine</p>
                        </div>
                    </div>
                    
                    {/* Controls */}
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 cursor-pointer hover:bg-white/10 transition-colors">
                            <input 
                                type="checkbox" 
                                checked={hasHeader} 
                                onChange={e => setHasHeader(e.target.checked)}
                                className="accent-emerald-500 w-4 h-4 rounded" 
                            />
                            First Row is Header
                        </label>

                        <div className="flex bg-[#03060a] border border-white/10 rounded-xl p-1">
                            {[
                                { id: 'json-objects', label: 'JSON Objects' },
                                { id: 'json-arrays', label: 'JSON Arrays' },
                                { id: 'markdown', label: 'Markdown Table' }
                            ].map((fmt) => (
                                <button
                                    key={fmt.id}
                                    onClick={() => setOutputFormat(fmt.id as any)}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all
                                        ${outputFormat === fmt.id 
                                            ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] border border-emerald-500/30' 
                                            : 'text-slate-500 hover:text-white border border-transparent'}`}
                                >
                                    {fmt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                    
                    {/* INPUT SIDE */}
                    <div className="flex-1 flex flex-col gap-3 min-h-[300px]">
                        <div className="flex items-center justify-between px-2">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                <Table2 size={12} /> Excel Input (Paste TSV)
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handlePasteExample} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded">Load Example</button>
                                <button onClick={() => setInputData('')} className="text-[10px] font-bold text-slate-500 hover:text-red-400 px-2 py-1"><Trash2 size={12}/></button>
                            </div>
                        </div>
                        <div className="flex-1 rounded-[2rem] border border-emerald-500/20 bg-[#020408]/80 backdrop-blur-xl p-1 overflow-hidden group focus-within:border-emerald-500/50 focus-within:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all relative">
                             <textarea 
                                value={inputData}
                                onChange={e => setInputData(e.target.value)}
                                placeholder="Paste data from Excel or Google Sheets here..."
                                className="w-full h-full bg-transparent resize-none outline-none p-6 text-sm font-mono text-emerald-100/70 placeholder:text-slate-700 custom-scrollbar whitespace-pre"
                                spellCheck={false}
                             />
                        </div>
                    </div>

                    {/* CONVERSION ARROW */}
                    <div className="hidden lg:flex flex-col items-center justify-center relative -mx-2 z-20">
                        <div className="w-12 h-12 bg-[#05080f] border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            <ArrowRightLeft size={20} />
                        </div>
                    </div>

                    {/* OUTPUT SIDE */}
                    <div className="flex-1 flex flex-col gap-3 min-h-[300px]">
                        <div className="flex items-center justify-between px-2">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
                                <Code2 size={12} /> Encoded Output
                            </div>
                            <button 
                                onClick={handleCopy}
                                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all
                                    ${copySuccess ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'}`}
                            >
                                {copySuccess ? <Check size={12}/> : <Copy size={12}/>}
                                {copySuccess ? 'Copied!' : 'Copy Code'}
                            </button>
                        </div>
                        <div className="flex-1 rounded-[2rem] border border-white/10 bg-[#020408]/80 backdrop-blur-xl p-1 overflow-hidden relative">
                             <textarea 
                                value={parsedData}
                                readOnly
                                placeholder="Awaiting matrix..."
                                className="w-full h-full bg-transparent resize-none outline-none p-6 text-sm font-mono text-cyan-400 placeholder:text-slate-800 custom-scrollbar whitespace-pre"
                             />
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
