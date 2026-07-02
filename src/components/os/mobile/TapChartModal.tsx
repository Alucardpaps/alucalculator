'use client';

import React, { useState } from 'react';
import { X, Search, FileText, Compass, AlertCircle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FieldToolsStrings } from '@/locales/fieldToolsTranslations';

interface TapChartModalProps {
    isOpen: boolean;
    onClose: () => void;
    ft: FieldToolsStrings;
}

interface ScrewThreadData {
    size: string;
    pitch: number; // mm
    tapDrill: number; // mm
    clearanceClose: number; // mm
    clearanceFree: number; // mm
    torque88: number; // Nm (Grade 8.8)
    torque109: number; // Nm (Grade 10.9)
    tensileArea: number; // mm²
}

const THREAD_DATABASE: ScrewThreadData[] = [
    { size: 'M2', pitch: 0.4, tapDrill: 1.6, clearanceClose: 2.1, clearanceFree: 2.4, torque88: 0.35, torque109: 0.50, tensileArea: 2.07 },
    { size: 'M2.5', pitch: 0.45, tapDrill: 2.05, clearanceClose: 2.6, clearanceFree: 2.9, torque88: 0.73, torque109: 1.05, tensileArea: 3.39 },
    { size: 'M3', pitch: 0.5, tapDrill: 2.5, clearanceClose: 3.2, clearanceFree: 3.6, torque88: 1.3, torque109: 1.9, tensileArea: 5.03 },
    { size: 'M4', pitch: 0.7, tapDrill: 3.3, clearanceClose: 4.3, clearanceFree: 4.8, torque88: 3.0, torque109: 4.4, tensileArea: 8.78 },
    { size: 'M5', pitch: 0.8, tapDrill: 4.2, clearanceClose: 5.3, clearanceFree: 5.8, torque88: 6.0, torque109: 8.7, tensileArea: 14.2 },
    { size: 'M6', pitch: 1.0, tapDrill: 5.0, clearanceClose: 6.4, clearanceFree: 7.0, torque88: 10.3, torque109: 15.0, tensileArea: 20.1 },
    { size: 'M8', pitch: 1.25, tapDrill: 6.8, clearanceClose: 8.4, clearanceFree: 9.0, torque88: 25.0, torque109: 36.0, tensileArea: 36.6 },
    { size: 'M10', pitch: 1.5, tapDrill: 8.5, clearanceClose: 10.5, clearanceFree: 11.0, torque88: 49.0, torque109: 72.0, tensileArea: 58.0 },
    { size: 'M12', pitch: 1.75, tapDrill: 10.2, clearanceClose: 13.0, clearanceFree: 14.0, torque88: 85.0, torque109: 125.0, tensileArea: 84.3 },
    { size: 'M14', pitch: 2.0, tapDrill: 12.0, clearanceClose: 15.0, clearanceFree: 16.5, torque88: 135.0, torque109: 200.0, tensileArea: 115 },
    { size: 'M16', pitch: 2.0, tapDrill: 14.0, clearanceClose: 17.0, clearanceFree: 18.5, torque88: 210.0, torque109: 310.0, tensileArea: 157 },
    { size: 'M20', pitch: 2.5, tapDrill: 17.5, clearanceClose: 21.0, clearanceFree: 22.0, torque88: 410.0, torque109: 610.0, tensileArea: 245 },
    { size: 'M24', pitch: 3.0, tapDrill: 21.0, clearanceClose: 25.0, clearanceFree: 26.0, torque88: 710.0, torque109: 1050.0, tensileArea: 353 }
];

export function TapChartModal({ isOpen, onClose, ft }: TapChartModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedScrew, setSelectedScrew] = useState<ScrewThreadData | null>(null);

    const filteredScrewThreads = THREAD_DATABASE.filter(item => 
        item.size.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-[#020408]/90 backdrop-blur-md flex flex-col justify-end md:justify-center p-0 md:p-6"
                >
                    <div className="w-full max-w-lg mx-auto bg-[#070b12] border-t md:border border-cyan-950 rounded-t-[2.5rem] md:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] md:h-auto max-h-[85vh]">
                        {/* Header */}
                        <header className="flex-none p-5 border-b border-white/5 flex items-center justify-between bg-black/20">
                            <div>
                                <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={16} className="text-cyan-400" />
                                    {ft.tapDrillChart}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{ft.isoThreadDimensions}</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white active:scale-95 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </header>

                        {/* Search Bar */}
                        <div className="flex-none p-4 bg-slate-950/20 border-b border-white/5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-900/60" />
                                <input 
                                    type="text" 
                                    placeholder={ft.searchScrewPlaceholder} 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#03060a] border border-cyan-900/30 rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono outline-none focus:border-cyan-500/70 text-white"
                                />
                            </div>
                        </div>

                        {/* Grid / List of Screw threads */}
                        <div className="flex-grow overflow-y-auto p-4 custom-scrollbar space-y-4 max-h-[40vh]">
                            <table className="w-full border-collapse text-[10px] font-mono text-left">
                                <thead>
                                    <tr className="text-slate-500 border-b border-white/5 bg-slate-950/40">
                                        <th className="p-2.5">{ft.colSize}</th>
                                        <th className="p-2.5">{ft.colPitch}</th>
                                        <th className="p-2.5">{ft.colTapDrill}</th>
                                        <th className="p-2.5">{ft.clearanceDrillClose}</th>
                                        <th className="p-2.5">{ft.recTighteningTorque}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredScrewThreads.map((item) => (
                                        <tr 
                                            key={item.size}
                                            onClick={() => {
                                                setSelectedScrew(item);
                                                if ('vibrate' in navigator) navigator.vibrate(30);
                                            }}
                                            className={`border-b border-white/5 cursor-pointer hover:bg-cyan-950/10 transition-colors ${selectedScrew?.size === item.size ? 'bg-cyan-500/10 text-cyan-300 font-bold border-l-2 border-l-cyan-500' : 'text-slate-300'}`}
                                        >
                                            <td className="p-2.5">{item.size}</td>
                                            <td className="p-2.5">{item.pitch} mm</td>
                                            <td className="p-2.5 font-bold text-cyan-400">{item.tapDrill} mm</td>
                                            <td className="p-2.5 text-slate-400">{item.clearanceClose} mm</td>
                                            <td className="p-2.5 text-orange-400">{item.torque88} N·m</td>
                                        </tr>
                                    ))}
                                    {filteredScrewThreads.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center py-6 text-slate-600">{ft.noThreadsFound}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Thread Detail Card */}
                        <div className="flex-none p-5 bg-slate-950/60 border-t border-white/5 space-y-4">
                            <AnimatePresence mode="wait">
                                {selectedScrew ? (
                                    <motion.div
                                        key={selectedScrew.size}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="space-y-3.5"
                                    >
                                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                            <span className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                                                <Compass size={16} />
                                                {ft.threadSpecsFor} {selectedScrew.size}
                                            </span>
                                            <span className="text-[9px] font-mono text-slate-500">{ft.metricCoarse}</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                                            <div className="p-3 bg-black/30 rounded-xl space-y-1">
                                                <span className="text-slate-500 block uppercase text-[8px] tracking-wider">{ft.tapDrillSize}</span>
                                                <span className="text-md font-bold text-cyan-400">Ø {selectedScrew.tapDrill} mm</span>
                                                <span className="text-[8px] text-slate-600 block">{ft.requiredDrillBit}</span>
                                            </div>
                                            <div className="p-3 bg-black/30 rounded-xl space-y-1">
                                                <span className="text-slate-500 block uppercase text-[8px] tracking-wider">{ft.tensileStressArea}</span>
                                                <span className="text-md font-bold text-slate-300">{selectedScrew.tensileArea} mm²</span>
                                                <span className="text-[8px] text-slate-600 block">{ft.effectiveSection}</span>
                                            </div>
                                            <div className="p-3 bg-black/30 rounded-xl space-y-1">
                                                <span className="text-slate-500 block uppercase text-[8px] tracking-wider">{ft.clearanceDrillClose}</span>
                                                <span className="text-md font-bold text-slate-300">Ø {selectedScrew.clearanceClose} mm</span>
                                                <span className="text-[8px] text-slate-600 block">{ft.freeClearanceFit}: Ø {selectedScrew.clearanceFree} mm</span>
                                            </div>
                                            <div className="p-3 bg-black/30 rounded-xl space-y-1">
                                                <span className="text-slate-500 block uppercase text-[8px] tracking-wider font-bold text-orange-500/80">{ft.recTighteningTorque}</span>
                                                <div className="flex justify-between items-baseline pt-0.5">
                                                    <span className="text-[9px] text-slate-400">{ft.grade88SteelDefault}: <strong className="text-orange-400">{selectedScrew.torque88} Nm</strong></span>
                                                    <span className="text-[9px] text-slate-400">{ft.grade109SteelDefault}: <strong className="text-red-400">{selectedScrew.torque109} Nm</strong></span>
                                                </div>
                                                <span className="text-[8px] text-slate-600 block">{ft.dryTorque}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500 space-y-2">
                                        <AlertCircle size={20} className="text-slate-700 animate-pulse" />
                                        <span className="text-[10px] font-mono uppercase tracking-wider">{ft.selectThreadAbove}</span>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
