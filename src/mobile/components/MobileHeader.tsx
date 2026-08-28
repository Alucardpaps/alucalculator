'use client';

import type { MobileStrings } from '@/locales/mobileTranslations';
import type { Language } from '@/store/i18nStore';
import { AluCalcLogo } from '@/components/ui/AluCalcLogo';

type Props = {
  m: MobileStrings;
  language: Language;
  projectName: string;
  onLanguagePress: () => void;
};

export function MobileHeader({ m, language, projectName, onLanguagePress }: Props) {
  return (
    <header className="flex-none px-4 py-2.5 bg-[#03060a]/90 border-b border-cyan-950/40 backdrop-blur-xl flex items-center justify-between z-30 select-none">
      <div className="flex items-center gap-2.5 min-w-0">
        <AluCalcLogo size={26} animate={false} />
        <div className="flex flex-col min-w-0">
          <span className="text-[9.5px] font-black text-cyan-400/80 tracking-[0.2em] font-mono leading-none uppercase">
            ALUCALC OS
          </span>
          <span className="text-xs font-bold text-white tracking-tight mt-0.5 truncate">{projectName}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[8px] font-mono font-bold text-emerald-400">{m.online}</span>
        </div>
        <button
          onClick={onLanguagePress}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-900 border border-white/10 hover:border-cyan-500/40 transition-all text-[9px] font-bold text-cyan-300 font-mono"
          title={m.language}
        >
          {language.toUpperCase()}
        </button>
      </div>
    </header>
  );
}

export default MobileHeader;
