'use client';

import React from 'react';
import {
  Trophy, Target, Flame, Gem, Heart, Award, ShieldCheck,
  Compass, Zap, Sparkles, Navigation, Layers
} from 'lucide-react';
import { useAcademyGamificationStore, getLeagueInfo } from '@/store/useAcademyGamificationStore';
import { useI18nStore } from '@/store/i18nStore';
import { getDuolingoUiText, DUOLINGO_100_SECTIONS } from './DuolingoCurriculumData';

interface DuolingoRightSidebarProps {
  onOpenCertificates: () => void;
}

export function DuolingoRightSidebar({ onOpenCertificates }: DuolingoRightSidebarProps) {
  const { xp, gems, hearts, maxHearts, streak, buyHeartRefill, buyStreakFreeze, hasStreakFreeze, lessonScores } = useAcademyGamificationStore();
  const { language } = useI18nStore();
  const tr = language === 'tr';
  const leagueInfo = getLeagueInfo(xp);

  const totalLessons = 100;
  const completedCount = Object.values(lessonScores).filter((s) => s.stars > 0).length;
  const progressPct = Math.round((completedCount / totalLessons) * 100);

  // Simulated League Leaderboard
  const leaderboard = [
    { name: 'Prof. Dr. Klaus Richter', xp: Math.max(xp + 150, 1250), avatar: '👨‍🔬', rank: 1 },
    { name: tr ? 'Siz (Başmühendis)' : 'You (Engineer)', xp: xp, avatar: '🤖', rank: 2, isUser: true },
    { name: 'Elena V. (Aerospace)', xp: Math.max(xp - 40, 620), avatar: '👩‍💻', rank: 3 },
    { name: 'Murat K. (FEA Lead)', xp: Math.max(xp - 110, 430), avatar: '👷‍♂️', rank: 4 },
    { name: 'Dr. Thomas Weber', xp: Math.max(xp - 220, 260), avatar: '🧑‍🔧', rank: 5 },
  ];

  const handleJumpToUnit = (unitId: string) => {
    const el = document.getElementById(unitId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside className="w-full lg:w-80 space-y-5 select-none font-mono text-xs">
      
      {/* ─── 1. GLOBAL 100-SECTION PROGRESS ─── */}
      <div className="p-5 rounded-3xl bg-gradient-to-b from-[#080d1a] to-[#040711] border border-cyan-500/30 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-cyan-400" />
            <span>Müfredat İlerlemesi</span>
          </span>
          <span className="text-xs font-bold text-white">%{progressPct}</span>
        </div>

        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/10 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,229,255,0.5)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
          <span>{completedCount} / 100 {tr ? 'Ders Tamamlandı' : 'Lessons Done'}</span>
          <span>10 Ünite</span>
        </div>
      </div>

      {/* ─── 2. UNIT QUICK JUMP NAVIGATOR (1..10) ─── */}
      <div className="p-5 rounded-3xl bg-[#080d1a] border border-white/10 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Navigation size={15} className="text-cyan-400" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              {getDuolingoUiText(language, 'jumpToUnit')}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-sans">10 Ünite</span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {DUOLINGO_100_SECTIONS.map((unit) => {
            const isExtreme = unit.difficulty === 'extreme';
            return (
              <button
                key={unit.id}
                type="button"
                onClick={() => handleJumpToUnit(unit.id)}
                className={`py-2 rounded-xl border text-center font-bold transition cursor-pointer text-xs ${
                  isExtreme
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/20'
                    : 'bg-white/5 hover:bg-cyan-500/20 border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-white'
                }`}
                title={tr ? unit.titleTr : unit.titleEn}
              >
                {isExtreme ? '👑 10' : `U${unit.number}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 3. LEADERBOARD CARD ─── */}
      <div className="p-5 rounded-3xl bg-[#080d1a] border border-white/10 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-amber-400" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              {leagueInfo.current.label} {getDuolingoUiText(language, 'league')}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-sans">Haftalık</span>
        </div>

        <div className="space-y-1.5">
          {leaderboard.map((user, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl flex items-center justify-between gap-2 transition ${
                user.isUser
                  ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-bold shadow-md'
                  : 'bg-slate-900/60 border border-white/5 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-5 text-center font-bold text-slate-400 text-[11px]">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                </span>
                <span className="text-sm">{user.avatar}</span>
                <span className="truncate text-xs">{user.name}</span>
              </div>
              <span className="font-bold text-slate-200 shrink-0 text-[11px]">{user.xp} XP</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 4. DAILY QUESTS CARD ─── */}
      <div className="p-5 rounded-3xl bg-[#080d1a] border border-white/10 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-cyan-400" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              {getDuolingoUiText(language, 'dailyQuests')}
            </span>
          </div>
          <span className="text-[10px] text-cyan-400 font-bold">3 Görev</span>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-300">{tr ? 'Bugün 50 XP kazan' : 'Earn 50 XP today'}</span>
              <span className="text-cyan-400 font-bold">{Math.min(xp, 50)} / 50</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                style={{ width: `${Math.min(Math.round((xp / 50) * 100), 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-300">{tr ? '1 dersi hatasız bitir' : 'Complete 1 lesson perfectly'}</span>
              <span className="text-emerald-400 font-bold">1 / 1 (✓)</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/10">
              <div className="h-full bg-emerald-500 rounded-full w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 5. REFILL & SHOP ─── */}
      <div className="p-5 rounded-3xl bg-[#080d1a] border border-white/10 space-y-3 shadow-xl">
        <span className="font-bold text-white uppercase tracking-wider text-[11px] block border-b border-white/10 pb-2">
          {getDuolingoUiText(language, 'engineerShop')}
        </span>

        <button
          type="button"
          onClick={() => buyHeartRefill()}
          disabled={gems < 50 || hearts >= maxHearts}
          className="w-full p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 disabled:opacity-40 flex items-center justify-between transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <Heart size={16} className="fill-rose-500 text-rose-500" />
            <div>
              <span className="text-white font-bold block text-[11px]">{getDuolingoUiText(language, 'refillHearts')}</span>
              <span className="text-[10px] text-slate-500">{hearts}/{maxHearts} Can</span>
            </div>
          </div>
          <span className="px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20 text-[10px]">
            50 💎
          </span>
        </button>

        <button
          type="button"
          onClick={() => buyStreakFreeze()}
          disabled={gems < 80 || hasStreakFreeze}
          className="w-full p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 disabled:opacity-40 flex items-center justify-between transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-blue-400" />
            <div>
              <span className="text-white font-bold block text-[11px]">{getDuolingoUiText(language, 'streakFreeze')}</span>
              <span className="text-[10px] text-slate-500">{hasStreakFreeze ? (tr ? 'Aktif' : 'Active') : (tr ? '1 Gün Korur' : 'Protect 1 Day')}</span>
            </div>
          </div>
          <span className="px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20 text-[10px]">
            80 💎
          </span>
        </button>
      </div>

      {/* ─── 6. CERTIFICATE BUTTON ─── */}
      <button
        type="button"
        onClick={onOpenCertificates}
        className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-500/25 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
      >
        <Award size={18} className="text-yellow-400" />
        <span>{getDuolingoUiText(language, 'myCertificates')}</span>
      </button>

    </aside>
  );
}
