'use client';

import { useState } from 'react';
import { Database, Search, Box, Thermometer, ShieldCheck, Activity, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function MaterialsExplorer() {
  const [search, setSearch] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const startScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0e14] text-slate-300 font-sans p-6 overflow-hidden">
      {/* Search Header */}
      <div className="flex items-center gap-4 mb-8 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(0,229,255,0.1)]">
          <Database size={24} className="text-cyan-400" />
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Malzeme adı veya formülü (örn: Al2O3, Ti-6Al-4V)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-600"
          />
        </div>
        <button 
          onClick={startScan}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_25px_rgba(0,229,255,0.3)] active:scale-95"
        >
          {isScanning ? 'TARIYOR...' : 'ANALİZ ET'}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        {/* Left Side: Material Card */}
        <div className="col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Box size={80} />
            </div>
            <div className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1">Seçili Malzeme</div>
            <h2 className="text-3xl font-black text-white mb-4">7075 Aluminum</h2>
            
            <div className="space-y-4">
                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                    <span className="text-xs text-slate-500">Yoğunluk</span>
                    <span className="text-sm font-bold text-slate-200">2.81 g/cm³</span>
                </div>
                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                    <span className="text-xs text-slate-500">Erime Noktası</span>
                    <span className="text-sm font-bold text-slate-200">635°C</span>
                </div>
                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                    <span className="text-xs text-slate-500">Akma Mukavemeti</span>
                    <span className="text-sm font-bold text-slate-200">503 MPa</span>
                </div>
            </div>
          </div>

          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-3xl p-6">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Brain size={14} /> AI Öngörüsü
            </h4>
            <p className="text-[11px] leading-relaxed text-slate-400 italic">
                "Bu malzemenin termal yorulma direnci, 400°C üzerindeki operasyonlarda %15 düşüş gösterebilir. Yüzey kaplaması önerilir."
            </p>
          </div>
        </div>

        {/* Right Side: Detailed Analysis & Visualization */}
        <div className="col-span-8 flex flex-col gap-6">
           <div className="flex-1 bg-black/40 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Thermometer size={18} className="text-orange-500" /> Termodinamik Stabilite
                 </h3>
                 <div className="flex gap-2">
                    <span className="px-3 py-1 bg-slate-800 rounded-full text-[10px] text-slate-400 border border-slate-700">Crystal System: Cubic</span>
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-[10px] border border-green-500/20">Stable</span>
                 </div>
              </div>

              {/* Placeholder Content for a graph */}
              <div className="w-full h-[200px] flex items-end gap-2 mb-8 px-4">
                 {[...Array(40)].map((_, i) => (
                    <motion.div 
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.random() * 60 + 20}%` }}
                        transition={{ delay: i * 0.02 }}
                        className="flex-1 bg-gradient-to-t from-cyan-600/50 to-cyan-400/20 rounded-t-sm"
                    />
                 ))}
              </div>

              <div className="grid grid-cols-3 gap-6">
                 <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                    <Activity size={20} className="text-cyan-500 mb-3" />
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Elastisite Modülü</div>
                    <div className="text-xl font-black text-white">71.7 GPa</div>
                 </div>
                 <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                    <ShieldCheck size={20} className="text-green-500 mb-3" />
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Poisson Oranı</div>
                    <div className="text-xl font-black text-white">0.33</div>
                 </div>
                 <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                    <Thermometer size={20} className="text-orange-500 mb-3" />
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Linear CTE</div>
                    <div className="text-xl font-black text-white">23.6 µm/m·K</div>
                 </div>
              </div>

              {/* Grid Background */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(0,229,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.1)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
           </div>
        </div>
      </div>
    </div>
  );
}
