'use client';

import React, { useState } from 'react';
import { AegisMascot } from '@/components/copilot/AegisMascot';
import { useCopilotStore } from '@/store/copilotStore';
import { Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  className?: string;
}

export function AegisFloatingWidget({ className = "" }: Props) {
  const { isOpen, setIsOpen, greetingText, setGreetingText } = useCopilotStore();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={`fixed bottom-20 right-3 sm:bottom-6 sm:right-6 z-[9990] flex flex-col items-end gap-2.5 pointer-events-none select-none ${className}`}>
      {/* Unified Dynamic Speech Bubble */}
      <AnimatePresence>
        {!isOpen && greetingText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto relative max-w-[260px] sm:max-w-[290px] rounded-2xl bg-slate-950/95 border border-[#00e5ff]/40 p-3.5 shadow-[0_0_25px_rgba(0,229,255,0.35)] backdrop-blur-xl cursor-pointer hover:border-[#00e5ff]/80 transition-colors group"
            onClick={() => setIsOpen(true)}
            title="Click to chat with AEGIS"
          >
            <div className="flex items-start justify-between gap-1.5 mb-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-widest text-[#00e5ff]">
                <Sparkles size={12} className="text-[#00e5ff] animate-pulse" />
                <span>AEGIS</span>
              </div>
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  setGreetingText(null);
                }} 
                className="text-slate-400 hover:text-white transition-colors p-0.5 rounded hover:bg-white/10"
                title="Dismiss"
              >
                <X size={12} />
              </button>
            </div>
            
            <p className="text-[12px] font-mono text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
              {greetingText}
            </p>
            
            {/* Speech Bubble Tail pointing down to the center of the mascot button */}
            <div className="absolute -bottom-2 right-5 w-3.5 h-3.5 rotate-45 bg-slate-950 border-r border-b border-[#00e5ff]/40" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot Avatar Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="pointer-events-auto group relative flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-[#0d1624]/90 to-[#070b12]/95 shadow-[0_0_25px_rgba(0,229,255,0.25)] backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:border-cyan-300 active:scale-95 cursor-pointer"
        title="Open AeGiS AI Copilot"
      >
        <div className="absolute -inset-1 rounded-2xl bg-cyan-500/20 blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
        <AegisMascot size={46} isHovered={isHovered} />
      </button>
    </div>
  );
}

export default AegisFloatingWidget;
