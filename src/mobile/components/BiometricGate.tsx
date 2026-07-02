'use client';

import { motion } from 'framer-motion';
import { Fingerprint, Lock } from 'lucide-react';
import type { MobileStrings } from '@/locales/mobileTranslations';

type Props = {
  m: MobileStrings;
  onUnlock: () => void;
  isChecking: boolean;
};

export function BiometricGate({ m, onUnlock, isChecking }: Props) {
  return (
    <div className="fixed inset-0 z-[200] bg-[#020408] flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-6 max-w-xs"
      >
        <div className="w-20 h-20 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
          <Lock size={36} className="text-cyan-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">{m.biometricLockTitle}</h2>
          <p className="text-xs text-slate-500 mt-2">{m.biometricLockSubtitle}</p>
        </div>
        <button
          onClick={onUnlock}
          disabled={isChecking}
          className="w-full py-4 bg-cyan-500 text-black font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Fingerprint size={18} />
          {isChecking ? m.loading : m.biometricUnlock}
        </button>
      </motion.div>
    </div>
  );
}
