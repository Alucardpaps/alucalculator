'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

export function InfoTooltip({ text }: { text: string }) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-flex items-center ml-1 group">
            <Info
                size={12}
                className="text-gray-400 group-hover:text-blue-500 cursor-help transition-colors"
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
            />
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800/90 backdrop-blur-sm text-white text-[11px] rounded-lg shadow-xl min-w-max max-w-[200px] z-[9999] border border-white/10"
                        style={{ whiteSpace: 'pre-wrap' }}
                    >
                        {text}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800/90" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
