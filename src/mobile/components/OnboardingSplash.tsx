'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { AluCalcLogo } from '@/components/ui/AluCalcLogo';
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
      className="fixed inset-0 z-[150] bg-[#020408] flex flex-col items-center justify-center p-8 select-none"
    >
      <div className="mb-8 flex items-center justify-center filter drop-shadow-[0_0_30px_rgba(0,229,255,0.4)]">
        <AluCalcLogo size={88} animate={true} />
      </div>
      <h1 className="text-2xl font-black text-white text-center tracking-tight">{m.onboardingTitle}</h1>
      <p className="text-sm text-slate-400 text-center mt-3 max-w-xs leading-relaxed">{m.onboardingSubtitle}</p>

      <div className="mt-10 w-full max-w-xs space-y-3">
        <button
          onClick={onComplete}
          className="w-full py-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,229,255,0.4)] active:scale-95 transition-transform"
        >
          <Sparkles size={16} />
          {m.onboardingGetStarted}
          <ArrowRight size={16} />
        </button>
        <button onClick={onSkip} className="w-full py-3 text-slate-500 hover:text-white text-xs font-bold uppercase transition-colors">
          {m.skipOnboarding}
        </button>
      </div>
    </motion.div>
  );
}

export default OnboardingSplash;
