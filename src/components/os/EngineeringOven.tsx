'use client';

import { useState, useEffect } from 'react';
import { Thermometer, Zap, AlertCircle, Settings, X, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface EngineeringOvenProps {
  onClose: () => void;
  className?: string;
}

export function EngineeringOven({ onClose, className }: EngineeringOvenProps) {
  const [temp, setTemp] = useState(24);
  const [targetTemp, setTargetTemp] = useState(500);
  const [isHeating, setIsHeating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'heating' | 'stable' | 'cooling'>('idle');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHeating) {
      interval = setInterval(() => {
        setTemp(prev => {
          if (prev < targetTemp) {
            setStatus('heating');
            return prev + Math.random() * 5;
          }
          setStatus('stable');
          return targetTemp + (Math.random() - 0.5) * 2;
        });
      }, 500);
    } else {
        interval = setInterval(() => {
            setTemp(prev => {
                if (prev > 24) {
                    setStatus('cooling');
                    return prev - Math.random() * 2;
                }
                setStatus('idle');
                return 24;
            });
        }, 500);
    }
    return () => clearInterval(interval);
  }, [isHeating, targetTemp]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className={cn(
        "w-[300px] bg-[#05090e]/95 backdrop-blur-2xl border border-orange-500/30 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(255,87,34,0.15)]",
        className
      )}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600/20 to-transparent px-4 py-3 border-b border-orange-500/20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Flame size={16} className={cn("text-orange-500", isHeating && "animate-pulse")} />
          <span className="text-xs font-black text-orange-200 uppercase tracking-widest">Endüstriyel Fırın v1.2</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-orange-500/20 rounded-full transition-colors">
          <X size={14} className="text-orange-200/50" />
        </button>
      </div>

      {/* Display Area */}
      <div className="p-5 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-orange-500/60 uppercase tracking-tighter">Mevcut Sıcaklık</span>
            <div className="text-3xl font-black text-orange-100 flex items-baseline gap-1">
              {temp.toFixed(1)}<span className="text-sm text-orange-500/50">°C</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-orange-500/60 uppercase tracking-tighter">Durum</span>
            <div className={cn(
                "text-[10px] font-bold px-2 py-1 rounded inline-block uppercase",
                status === 'idle' ? "bg-slate-800 text-slate-400" :
                status === 'heating' ? "bg-orange-600/30 text-orange-400 animate-pulse" :
                status === 'stable' ? "bg-green-600/30 text-green-400" :
                "bg-blue-600/30 text-blue-400"
            )}>
              {status === 'idle' ? 'BEKLEMEDE' : 
               status === 'heating' ? 'ISINIYOR' : 
               status === 'stable' ? 'STABİL' : 'SOĞUYOR'}
            </div>
          </div>
        </div>

        {/* Target Slider Area */}
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-orange-500/60 uppercase tracking-tighter">Hedef Sıcaklık</span>
                <span className="text-xs font-bold text-orange-200">{targetTemp}°C</span>
            </div>
            <input 
                type="range" 
                min="0" 
                max="1200" 
                value={targetTemp} 
                onChange={(e) => setTargetTemp(parseInt(e.target.value))}
                className="w-full h-1.5 bg-orange-950 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
                onClick={() => setIsHeating(!isHeating)}
                className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-lg text-[10px] font-black uppercase transition-all",
                    isHeating 
                        ? "bg-orange-500 text-white shadow-[0_0_20px_rgba(255,87,34,0.4)]" 
                        : "bg-orange-600/10 text-orange-500 border border-orange-500/30 hover:bg-orange-600/20"
                )}
            >
                <Zap size={12} />
                {isHeating ? 'SİSTEMİ DURDUR' : 'ATEŞLEMEYİ BAŞLAT'}
            </button>
            <button className="flex items-center justify-center gap-2 py-3 rounded-lg text-[10px] font-black uppercase bg-slate-800/50 text-slate-500 border border-slate-700 hover:text-slate-300">
                <Settings size={12} />
                AYARLAR
            </button>
        </div>
      </div>

      {/* Real-time Graph (Simplified Mini) */}
      <div className="h-10 bg-black/40 border-t border-orange-500/10 flex items-end gap-[1px] px-1 overflow-hidden">
        {[...Array(30)].map((_, i) => (
            <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${Math.random() * 80 + 20}%` }}
                transition={{ repeat: Infinity, duration: 1, repeatType: 'reverse', delay: i * 0.05 }}
                className={cn("flex-1", status === 'stable' ? "bg-green-500/20" : "bg-orange-500/20")}
            />
        ))}
      </div>
    </motion.div>
  );
}
