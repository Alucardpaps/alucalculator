'use client';

import React, { useState } from 'react';
import { AegisAura } from '@/components/copilot/AegisAura';
import { useCopilotStore } from '@/store/copilotStore';
import { Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  className?: string;
}

export function AegisFloatingWidget({ className = "" }: Props) {
  const { isOpen, setIsOpen, greetingText, setGreetingText, isThinking } = useCopilotStore();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={`hidden sm:flex fixed bottom-6 right-6 z-[9990] flex-col items-end gap-2.5 pointer-events-none select-none ${className}`}>
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
            title="Click to chat with AeGiS"
          >
            <div className="flex items-start justify-between gap-1.5 mb-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-widest text-[#00e5ff]">
                <Sparkles size={12} className="text-[#00e5ff] animate-pulse" />
                <span>AeGiS</span>
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
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.94 }}
        className="pointer-events-auto group relative flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-[#0d1624]/95 to-[#070b12]/95 shadow-[0_0_32px_rgba(0,229,255,0.35)] backdrop-blur-xl hover:border-cyan-200 cursor-pointer"
        title="Open AeGiS AI Copilot"
      >
        <AegisAura size={44} hovered={isHovered} thinking={isThinking} kind="mascot" />
      </motion.button>
    </div>
  );
}

export default AegisFloatingWidget;
