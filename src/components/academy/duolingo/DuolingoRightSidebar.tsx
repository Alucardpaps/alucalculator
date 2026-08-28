'use client';

import React from 'react';
import { Trophy, Target, Flame, Gem, Heart, Award, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { useAcademyGamificationStore, getLeagueInfo } from '@/store/useAcademyGamificationStore';

interface DuolingoRightSidebarProps {
  tr: boolean;
  onOpenCertificates: () => void;
}

export function DuolingoRightSidebar({ tr, onOpenCertificates }: DuolingoRightSidebarProps) {
  const { xp, gems, hearts, maxHearts, streak, buyHeartRefill, buyStreakFreeze, hasStreakFreeze } = useAcademyGamificationStore();
  const leagueInfo = getLeagueInfo(xp);

  // Simulated League Leaderboard
  const leaderboard = [
    { name: 'Dr. Klaus Richter', xp: Math.max(xp + 120, 850), avatar: '👨‍🔬', rank: 1 },
    { name: 'Siz (You)', xp: xp, avatar: '🤖', rank: 2, isUser: true },
    { name: 'Elena V.', xp: Math.max(xp - 40, 420), avatar: '👩‍💻', rank: 3 },
    { name: 'Murat K.', xp: Math.max(xp - 90, 310), avatar: '👷‍♂️', rank: 4 },
    { name: 'Thomas Weber', xp: Math.max(xp - 150, 180), avatar: '🧑‍🔧', rank: 5 },
  ];

  return (
    <aside className="w-full lg:w-80 space-y-5 select-none font-mono text-xs">
      
      {/* ─── 1. LEAGUE & LEADERBOARD CARD ─── */}
      <div className="p-5 rounded-3xl bg-[#080d1a] border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-amber-400" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              {leagueInfo.current.label} {tr ? 'Ligi' : 'League'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-sans">Haftalık Sıralama</span>
        </div>

        {/* Top Users List */}
        <div className="space-y-1.5">
          {leaderboard.map((user, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl flex items-center justify-between gap-2 transition ${
                user.isUser
                  ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-bold shadow'
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

      {/* ─── 2. DAILY QUESTS CARD ─── */}
      <div className="p-5 rounded-3xl bg-[#080d1a] border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-cyan-400" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              {tr ? 'Günlük Görevler' : 'Daily Quests'}
            </span>
          </div>
          <span className="text-[10px] text-cyan-400 font-bold">3 Görev</span>
        </div>

        <div className="space-y-3">
          {/* Quest 1 */}
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

          {/* Quest 2 */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-300">{tr ? '1 dersi hatasız bitir' : 'Complete 1 lesson perfectly'}</span>
              <span className="text-amber-400 font-bold">1 / 1 (✓)</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/10">
              <div className="h-full bg-emerald-500 rounded-full w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. REFILL & POWER-UP SHOP ─── */}
      <div className="p-5 rounded-3xl bg-[#080d1a] border border-white/10 space-y-3 shadow-xl">
        <span className="font-bold text-white uppercase tracking-wider text-[11px] block border-b border-white/10 pb-2">
          {tr ? 'Mühendislik Atölyesi' : 'Engineer Shop'}
        </span>

        {/* Heart Refill */}
        <button
          type="button"
          onClick={() => buyHeartRefill()}
          disabled={gems < 50 || hearts >= maxHearts}
          className="w-full p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 disabled:opacity-40 flex items-center justify-between transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <Heart size={16} className="fill-rose-500 text-rose-500" />
            <div>
              <span className="text-white font-bold block text-[11px]">{tr ? 'Canları Yenile' : 'Refill Hearts'}</span>
              <span className="text-[10px] text-slate-500">{hearts}/{maxHearts} Can</span>
            </div>
          </div>
          <span className="px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20 text-[10px]">
            50 💎
          </span>
        </button>

        {/* Streak Freeze */}
        <button
          type="button"
          onClick={() => buyStreakFreeze()}
          disabled={gems < 80 || hasStreakFreeze}
          className="w-full p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 disabled:opacity-40 flex items-center justify-between transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-blue-400" />
            <div>
              <span className="text-white font-bold block text-[11px]">{tr ? 'Seri Dondurucu' : 'Streak Freeze'}</span>
              <span className="text-[10px] text-slate-500">{hasStreakFreeze ? (tr ? 'Aktif' : 'Active') : (tr ? '1 Gün Korur' : 'Protect 1 Day')}</span>
            </div>
          </div>
          <span className="px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20 text-[10px]">
            80 💎
          </span>
        </button>
      </div>

      {/* ─── 4. OFFICIAL PDF CERTIFICATE BUTTON ─── */}
      <button
        type="button"
        onClick={onOpenCertificates}
        className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-500/20 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
      >
        <Award size={18} className="text-yellow-400" />
        <span>{tr ? 'Sertifikalarım (PDF İndir)' : 'My Certificates (PDF)'}</span>
      </button>

    </aside>
  );
}
