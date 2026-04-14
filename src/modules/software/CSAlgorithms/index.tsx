'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Code } from 'lucide-react';

export default function CSAlgorithms() {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-[#050505] text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] border-t border-white/5" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 p-12 bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-xl flex flex-col items-center max-w-lg text-center shadow-2xl"
            >
                <div className="w-20 h-20 bg-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center mb-6 border border-teal-500/50 shadow-[0_0_30px_rgba(20,184,166,0.5)]">
                    <Code size={40} />
                </div>
                <h1 className="text-3xl font-black tracking-tighter mb-4 uppercase italic">Algorithm Engine</h1>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                    Big-O complexity analyzer and graph visualizer starting. Establishing binary tree node references.
                </p>
                <div className="flex items-center gap-2 text-teal-400 text-[10px] font-bold tracking-widest uppercase">
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    Compiling logic...
                </div>
            </motion.div>
        </div>
    );
}
