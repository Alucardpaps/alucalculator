import React from 'react';
import { motion } from 'framer-motion';
import { useOSStore } from '@/store/osStore';
import { Zap } from 'lucide-react';

export const ChaosToggle = () => {
    const { isChaosMode, toggleChaosMode } = useOSStore();

    return (
        <motion.button
            onClick={toggleChaosMode}
            className={`
                relative flex items-center justify-center p-3 rounded-none border-2 transition-all duration-300 overflow-hidden group
                ${isChaosMode
                    ? 'bg-rose-600/20 border-rose-500 text-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.3)]'
                    : 'bg-black/40 border-white/5 text-gray-600 hover:border-rose-500/50 hover:text-rose-400'}
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Toggle Chaos Mode (Experimental)"
        >
            <Zap size={20} className={`relative z-10 ${isChaosMode ? 'animate-pulse' : ''}`} />

            {/* Brutalist Scanline Effect Background */}
            {isChaosMode && (
                <div className="absolute inset-0 z-0 opacity-30 pointer-events-none mix-blend-overlay"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(rgba(0,0,0,0) 0, rgba(0,0,0,0) 2px, rgba(225,29,72,0.1) 2px, rgba(225,29,72,0.1) 4px)'
                    }}
                />
            )}
        </motion.button>
    );
};
