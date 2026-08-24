'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function AluLogo({ size = 24, className = "" }: { size?: number, className?: string }) {
    return (
        <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            {/* Outer Rotating Ring */}
            <motion.div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-cyan-500/50"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />

            {/* Inner Rotating Hexagon */}
            <motion.div
                className="absolute inset-1"
                animate={{ rotate: -360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                    <path d="M12 2l9 4.9V17L12 22l-9-4.9V6.9L12 2z" />
                </svg>
            </motion.div>

            {/* Core Pulse */}
            <motion.div
                className="absolute w-2 h-2 bg-white/80 rounded-full shadow-[0_0_10px_white]"
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
        </div>
    );
}
