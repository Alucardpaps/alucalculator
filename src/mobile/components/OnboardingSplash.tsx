'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { MobileStrings } from '@/locales/mobileTranslations';

type Props = {
  m: MobileStrings;
  onComplete: () => void;
  onSkip: () => void;
};

export function OnboardingSplash({ m, onComplete, onSkip }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-[#020408] flex flex-col items-center justify-center p-8"
    >
      <div className="w-20 h-20 bg-cyan-500 rounded-2xl flex items-center justify-center text-black font-black text-2xl shadow-[0_0_30px_rgba(6,182,212,0.5)] mb-8">
        AC
      </div>
      <h1 className="text-2xl font-black text-white text-center tracking-tight">{m.onboardingTitle}</h1>
      <p className="text-sm text-slate-400 text-center mt-3 max-w-xs leading-relaxed">{m.onboardingSubtitle}</p>

      <div className="mt-10 w-full max-w-xs space-y-3">
        <button
          onClick={onComplete}
          className="w-full py-4 bg-cyan-500 text-black font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
        >
          <Sparkles size={16} />
          {m.onboardingGetStarted}
          <ArrowRight size={16} />
        </button>
        <button onClick={onSkip} className="w-full py-3 text-slate-500 text-xs font-bold uppercase">
          {m.skipOnboarding}
        </button>
      </div>
    </motion.div>
  );
}
