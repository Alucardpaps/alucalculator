'use client';

import { useState } from 'react';
import { Activity, Zap, Play, Trash2, Cpu, LineChart, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function PhysicsSolver() {
  const [equation, setEquation] = useState('σ = E * ε');
  const [logs, setLogs] = useState([
    "Sistem Hazır. Analiz bekleniyor...",
    "Phys-MCP v2.1 bağlantısı başarılı.",
  ]);

  const solve = () => {
    setLogs(prev => [...prev, `Çözülüyor: ${equation}`, "Sonuç: σ = 210GPa * 0.002 = 420 MPa"]);
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-slate-400 font-mono p-0 overflow-hidden">
      {/* Top Bar */}
      <div className="bg-slate-900/30 px-6 py-3 border-b border-white/5 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
            <Activity size={16} className="text-green-400 animate-pulse" />
            <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Physics CAS Engine</span>
        </div>
        <div className="flex gap-4">
            <span className="text-[10px] text-slate-600">Memory: 124MB</span>
            <span className="text-[10px] text-slate-600">Latency: 12ms</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col border-r border-white/5 bg-[#0a0a0a]">
            {/* Toolbar */}
            <div className="px-6 py-2 border-b border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
                <button className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] transition-colors border border-white/10">
                    <FileText size={12} /> DERIVE
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] transition-colors border border-white/10">
                    <LineChart size={12} /> PLOT
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] transition-colors border border-white/10">
                    <Zap size={12} /> OPTIMIZE
                </button>
                <button 
                  onClick={() => setLogs([])}
                  className="flex items-center gap-1.5 px-3 py-1 ml-auto bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[10px] transition-colors border border-red-500/20"
                >
                    <Trash2 size={12} />
                </button>
            </div>

            {/* Main Input */}
            <div className="flex-1 relative p-8">
                <textarea 
                   className="w-full h-full bg-transparent border-none outline-none resize-none text-2xl font-light text-green-500/80 placeholder:text-slate-800 leading-relaxed font-sans italic"
                   placeholder="Denklemi buraya yazın..."
                   value={equation}
                   onChange={(e) => setEquation(e.target.value)}
                />
                
                <button 
                  onClick={solve}
                  className="absolute bottom-10 right-10 w-16 h-16 bg-green-500 hover:bg-green-400 text-black rounded-full shadow-[0_0_40px_rgba(34,197,94,0.3)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-10"
                >
                  <Play fill="currentColor" size={24} className="ml-1" />
                </button>
            </div>
        </div>

        {/* Sidebar: Diagnostics & Logs */}
        <div className="w-[300px] bg-black flex flex-col shrink-0">
            <div className="p-4 border-b border-white/5 flex items-center gap-2">
                <Cpu size={14} className="text-slate-600" />
                <span className="text-[10px] uppercase font-bold text-slate-500">Çıktı & Loglar</span>
            </div>
            <div className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                {logs.map((log, i) => (
                    <div key={i} className="text-[10px] font-mono leading-relaxed mb-1">
                        <span className="text-slate-700 mr-2">{i+1}</span>
                        <span className={cn(
                            log.startsWith('Sonuç') ? "text-green-400 font-bold" :
                            log.startsWith('Çözülüyor') ? "text-cyan-400" :
                            "text-slate-500 italic"
                        )}>{log}</span>
                    </div>
                ))}
            </div>
            
            <div className="p-4 bg-slate-900/20 border-t border-white/5 space-y-3">
                <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-600 uppercase">Hassasiyet</span>
                    <span className="text-slate-400">IEEE 754 (Double)</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded overflow-hidden">
                    <motion.div 
                        animate={{ x: [-100, 300] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-20 h-full bg-green-500/50"
                    />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
