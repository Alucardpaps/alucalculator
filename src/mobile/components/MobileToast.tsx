'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

type Props = { message: string | null };

export function MobileToast({ message }: Props) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-slate-900 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase rounded-full shadow-[0_0_20px_rgba(6,182,212,0.3)] backdrop-blur flex items-center gap-2"
        >
          <Check size={14} />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
