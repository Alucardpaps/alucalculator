'use client';

import React from 'react';
import { Flame, Gem, Heart, Trophy, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import { useAcademyGamificationStore, getLeagueInfo } from '@/store/useAcademyGamificationStore';

export function DuolingoTopBar({ tr }: { tr: boolean }) {
  const { xp, gems, hearts, maxHearts, streak, league, soundEnabled, toggleSound, buyHeartRefill } = useAcademyGamificationStore();
  const leagueInfo = getLeagueInfo(xp);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#030712]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs font-mono select-none">
      {/* Left: Brand Badge */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/20">
          🦉
        </div>
        <div className="hidden sm:block">
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">AluDuolingo Academy</span>
          <span className="text-[10px] text-cyan-400 block -mt-0.5">{tr ? 'Mühendislik Parkuru' : 'Engineering Path'}</span>
        </div>
      </div>

      {/* Center / Right: Status Counters */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Streak */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold" title={tr ? 'Günlük Seri' : 'Daily Streak'}>
          <Flame size={15} className="fill-orange-500 animate-pulse text-orange-500" />
          <span>{streak}</span>
        </div>

        {/* Gems */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold" title={tr ? 'Kristal / Elmas' : 'Gems'}>
          <Gem size={14} className="text-cyan-400 fill-cyan-500/30" />
          <span>{gems}</span>
        </div>

        {/* Hearts */}
        <div
          onClick={() => {
            if (hearts < maxHearts) buyHeartRefill();
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold transition cursor-pointer ${
            hearts > 0
              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
              : 'bg-rose-950 border border-rose-500 text-rose-300 animate-bounce'
          }`}
          title={tr ? 'Canlar (Tıkla ve Yenile)' : 'Hearts (Click to Refill)'}
        >
          <Heart size={14} className={hearts > 0 ? 'fill-rose-500 text-rose-500' : 'text-rose-400'} />
          <span>{hearts}</span>
        </div>

        {/* League */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold" title={tr ? 'Mühendislik Ligi' : 'League'}>
          <Trophy size={14} className="text-amber-400" />
          <span className="capitalize">{leagueInfo.current.label}</span>
        </div>

        {/* Total XP */}
        <div className="hidden lg:flex items-center gap-1.5 text-slate-400">
          <span>XP:</span>
          <strong className="text-white">{xp}</strong>
        </div>

        {/* Sound Toggle */}
        <button
          type="button"
          onClick={toggleSound}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          title={soundEnabled ? 'Ses Açık' : 'Ses Kapalı'}
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>
      </div>
    </header>
  );
}
