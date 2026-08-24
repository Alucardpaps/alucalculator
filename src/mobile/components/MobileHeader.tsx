'use client';

import type { MobileStrings } from '@/locales/mobileTranslations';
import type { Language } from '@/store/i18nStore';

type Props = {
  m: MobileStrings;
  language: Language;
  projectName: string;
  onLanguagePress: () => void;
};

export function MobileHeader({ m, language, projectName, onLanguagePress }: Props) {
  return (
    <header className="flex-none px-4 py-3 bg-black/40 border-b border-cyan-950/30 backdrop-blur-md flex items-center justify-between z-30">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 shrink-0 bg-cyan-500 rounded-lg flex items-center justify-center text-black font-black text-xs shadow-[0_0_10px_rgba(6,182,212,0.4)]">
          AC
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-black text-white/40 tracking-[0.2em] font-mono leading-none uppercase">
            ALUCALC OS
          </span>
          <span className="text-xs font-bold text-white tracking-tight mt-0.5 truncate">{projectName}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] text-emerald-400 font-mono">{m.online}</span>
        </div>
        <button
          onClick={onLanguagePress}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-900 border border-white/5 hover:border-cyan-500/30 transition-all text-[9px] font-bold text-slate-300 font-mono"
          title={m.language}
        >
          {language.toUpperCase()}
        </button>
      </div>
    </header>
  );
}
