'use client';

import React from 'react';
import { Flame, Gem, Heart, Trophy, Volume2, VolumeX, Globe, ShieldAlert } from 'lucide-react';
import { useAcademyGamificationStore, getLeagueInfo } from '@/store/useAcademyGamificationStore';
import { useI18nStore, Language } from '@/store/i18nStore';
import { getDuolingoUiText } from './DuolingoCurriculumData';

export function DuolingoTopBar() {
  const { xp, gems, hearts, maxHearts, streak, soundEnabled, toggleSound, buyHeartRefill } = useAcademyGamificationStore();
  const { language, setLanguage } = useI18nStore();
  const leagueInfo = getLeagueInfo(xp);

  const LANGUAGES: { code: Language; label: string; flag: string }[] = [
    { code: 'tr', label: 'TR', flag: '🇹🇷' },
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'de', label: 'DE', flag: '🇩🇪' },
    { code: 'es', label: 'ES', flag: '🇪🇸' },
    { code: 'fr', label: 'FR', flag: '🇫🇷' },
    { code: 'it', label: 'IT', flag: '🇮🇹' },
    { code: 'pt', label: 'PT', flag: '🇵🇹' },
    { code: 'ru', label: 'RU', flag: '🇷🇺' },
    { code: 'zh', label: 'ZH', flag: '🇨🇳' },
    { code: 'ja', label: 'JA', flag: '🇯🇵' },
    { code: 'ko', label: 'KO', flag: '🇰🇷' },
    { code: 'ar', label: 'AR', flag: '🇸🇦' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#030712]/95 backdrop-blur-2xl border-b border-white/10 px-3 sm:px-6 py-2.5 flex items-center justify-between text-xs font-mono select-none shadow-2xl">
      
      {/* Left: Brand Badge & Unit Count */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-cyan-500/25 text-base">
          🦉
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white tracking-wide text-xs sm:text-sm">
              AluDuolingo
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40">
              100 Sections · 10 Units
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block -mt-0.5 font-sans">
            ISO / DIN / VDI / ASME Mühendislik Akademisi
          </span>
        </div>
      </div>

      {/* Right: Status Counters & 12-Language Selector */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* Streak */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold"
          title={getDuolingoUiText(language, 'dailyStreak')}
        >
          <Flame size={15} className="fill-orange-500 animate-pulse text-orange-500" />
          <span>{streak}</span>
        </div>

        {/* Gems */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold"
          title={getDuolingoUiText(language, 'gems')}
        >
          <Gem size={14} className="text-cyan-400 fill-cyan-400/30" />
          <span>{gems}</span>
        </div>

        {/* Hearts (Lives) */}
        <button
          type="button"
          onClick={() => {
            if (hearts < maxHearts) buyHeartRefill();
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
            hearts > 0
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
              : 'bg-rose-950 border border-rose-500 text-rose-300 animate-bounce'
          }`}
          title={getDuolingoUiText(language, 'hearts')}
        >
          <Heart size={14} className={hearts > 0 ? 'fill-rose-500 text-rose-500' : 'text-rose-400'} />
          <span>{hearts}</span>
        </button>

        {/* League */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold"
          title={getDuolingoUiText(language, 'league')}
        >
          <Trophy size={14} className="text-amber-400" />
          <span className="capitalize">{leagueInfo.current.label}</span>
        </div>

        {/* 12-Language Selector Dropdown */}
        <div className="relative flex items-center">
          <div className="flex items-center gap-1 bg-[#080d1a] border border-white/10 rounded-xl px-2 py-1 text-slate-300 hover:border-cyan-500/50 transition">
            <Globe size={13} className="text-cyan-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-[11px] font-bold text-white focus:outline-none cursor-pointer pr-1"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sound Toggle */}
        <button
          type="button"
          onClick={toggleSound}
          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition cursor-pointer"
          title={soundEnabled ? 'Sound ON' : 'Sound OFF'}
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>

      </div>
    </header>
  );
}
