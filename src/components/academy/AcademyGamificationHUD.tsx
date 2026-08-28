'use client';

import React, { useState } from 'react';
import { 
  Flame, 
  Heart, 
  Gem, 
  Trophy, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ShieldAlert, 
  RotateCcw,
  Zap,
  CheckCircle2,
  X
} from 'lucide-react';
import { useAcademyGamificationStore, getLeagueInfo } from '@/store/useAcademyGamificationStore';
import { useI18nStore } from '@/store/i18nStore';
import { getGamificationStrings } from '@/locales/gamificationTranslations';

export function AcademyGamificationHUD() {
  const { 
    xp, 
    gems, 
    hearts, 
    maxHearts, 
    streak, 
    hasStreakFreeze, 
    soundEnabled,
    toggleSound,
    refillHearts,
    buyHeartRefill,
    buyStreakFreeze 
  } = useAcademyGamificationStore();

  const { language } = useI18nStore();
  const isTr = language === 'tr';
  const tGame = getGamificationStrings(language);

  const [activeModal, setActiveModal] = useState<'shop' | 'streak' | 'hearts' | 'league' | null>(null);
  const leagueInfo = getLeagueInfo(xp);

  return (
    <>
      <div className="w-full bg-[#0a0f16]/90 border-b border-white/5 backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-4 overflow-x-auto no-scrollbar z-30 sticky top-0">
        {/* Left: Streak & League Badge */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* 🔥 Streak Button */}
          <button
            type="button"
            onClick={() => setActiveModal('streak')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20 active:scale-95 transition-all text-xs font-black"
            title={tGame.streakDays(streak)}
          >
            <Flame size={15} className={`text-amber-400 ${streak > 0 ? 'animate-bounce' : 'opacity-60'}`} />
            <span>{streak}</span>
            <span className="hidden md:inline text-[10px] uppercase tracking-widest text-amber-300/80">
              {tGame.dayBadge}
            </span>
          </button>

          {/* 🏆 League & Level Progress */}
          <button
            type="button"
            onClick={() => setActiveModal('league')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 hover:bg-blue-500/20 active:scale-95 transition-all text-xs font-black"
          >
            <Trophy size={14} className="text-blue-400" />
            <span className="hidden sm:inline text-[11px] font-bold text-slate-200">
              {leagueInfo.current.label}
            </span>
            <div className="w-12 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/10 hidden lg:block">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.round(leagueInfo.progressInLevel * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-cyan-300">
              {xp} XP
            </span>
          </button>
        </div>

        {/* Right: Gems, Hearts & Sound */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* 💎 Gems Counter / Shop */}
          <button
            type="button"
            onClick={() => setActiveModal('shop')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 hover:bg-cyan-500/20 active:scale-95 transition-all text-xs font-black"
            title={tGame.gemsStore}
          >
            <Gem size={14} className="text-cyan-400" />
            <span className="font-mono">{gems}</span>
          </button>

          {/* ❤️ Hearts Counter */}
          <button
            type="button"
            onClick={() => setActiveModal('hearts')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all text-xs font-black"
            title={tGame.heartsCount(hearts, maxHearts)}
          >
            <Heart size={14} className="text-rose-500 fill-rose-500" />
            <span className="font-mono">{hearts}</span>
          </button>

          {/* 🔊 Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            title={soundEnabled ? tGame.muteSounds : tGame.enableSounds}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>

      {/* Modal Dialogs */}
      {activeModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="w-full max-w-md rounded-2xl bg-[#0e141f] border border-white/10 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                {activeModal === 'streak' && <Flame className="text-amber-400" size={22} />}
                {activeModal === 'hearts' && <Heart className="text-rose-500 fill-rose-500" size={22} />}
                {activeModal === 'shop' && <Gem className="text-cyan-400" size={22} />}
                {activeModal === 'league' && <Trophy className="text-blue-400" size={22} />}
                <h3 className="text-base font-black text-white">
                  {activeModal === 'streak' && tGame.streakTitle}
                  {activeModal === 'hearts' && tGame.heartsTitle}
                  {activeModal === 'shop' && tGame.shopTitle}
                  {activeModal === 'league' && tGame.leagueTitle}
                </h3>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg bg-white/5 text-white/40 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Streak Modal Content */}
            {activeModal === 'streak' && (
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                  <Flame size={36} className="animate-pulse" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{tGame.streakDays(streak)}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {isTr 
                      ? 'Her gün en az 1 interaktif ders çözerek serinizi canlı tutun ve mühendislik reflekslerinizi geliştirin.'
                      : 'Complete at least 1 interactive lesson daily to keep your learning streak alive!'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-left text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={16} className="text-cyan-400" />
                    <div>
                      <p className="font-bold text-white">{isTr ? 'Seri Dondurucu' : 'Streak Freeze'}</p>
                      <p className="text-[10px] text-slate-400">{hasStreakFreeze ? (isTr ? 'Aktif - 1 Günlük Koruma' : 'Active - 1 Day Guard') : (isTr ? 'Alınmadı' : 'Not purchased')}</p>
                    </div>
                  </div>
                  {!hasStreakFreeze && (
                    <button
                      onClick={() => buyStreakFreeze()}
                      disabled={gems < 80}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-[10px] font-bold text-white transition-all flex items-center gap-1"
                    >
                      <Gem size={10} /> 80
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Hearts Modal Content */}
            {activeModal === 'hearts' && (
              <div className="space-y-4 text-center">
                <div className="flex justify-center gap-2 py-2">
                  {Array.from({ length: maxHearts }).map((_, i) => (
                    <Heart 
                      key={i} 
                      size={28} 
                      className={i < hearts ? "text-rose-500 fill-rose-500 animate-pulse" : "text-slate-700"} 
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isTr 
                    ? 'İnteraktif testlerde yapılan her hatalı cevap 1 can düşürür. Canlarınız bittiğinde pratik yaparak veya marketten yenileyebilirsiniz.'
                    : 'Each wrong answer in tests consumes 1 heart. Keep practicing or use gems to refill!'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      refillHearts();
                      setActiveModal(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={14} /> {isTr ? 'Ücretsiz Doldur (Eğitim Modu)' : 'Free Refill (Training)'}
                  </button>
                </div>
              </div>
            )}

            {/* Shop Modal Content */}
            {activeModal === 'shop' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Heart className="text-rose-500 fill-rose-500" size={20} />
                    <div>
                      <p className="text-xs font-bold text-white">{isTr ? 'Canları Yenile (5/5)' : 'Full Heart Refill'}</p>
                      <p className="text-[10px] text-slate-400">{isTr ? 'Tüm canları anında fuller' : 'Instantly restores full health'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => buyHeartRefill()}
                    disabled={gems < 50 || hearts >= maxHearts}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-xs font-bold text-white transition-all flex items-center gap-1"
                  >
                    <Gem size={11} /> 50
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="text-amber-400" size={20} />
                    <div>
                      <p className="text-xs font-bold text-white">{isTr ? 'Seri Dondurucu (Streak Freeze)' : 'Streak Freeze Guard'}</p>
                      <p className="text-[10px] text-slate-400">{isTr ? '1 gün kaçırsanız bile seriniz sıfırlanmaz' : 'Protects streak if you miss a day'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => buyStreakFreeze()}
                    disabled={gems < 80 || hasStreakFreeze}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-xs font-bold text-white transition-all flex items-center gap-1"
                  >
                    {hasStreakFreeze ? (isTr ? 'Sahipsin' : 'Owned') : <><Gem size={11} /> 80</>}
                  </button>
                </div>
              </div>
            )}

            {/* League Modal Content */}
            {activeModal === 'league' && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-xs text-slate-400">{isTr ? 'Aktif Kademe:' : 'Current Tier:'}</p>
                  <p className="text-xl font-black text-blue-400 mt-0.5">{leagueInfo.current.label}</p>
                  <p className="text-xs font-mono text-cyan-300 mt-1">{xp} Toplam XP</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>{leagueInfo.current.minXp} XP</span>
                    <span>{leagueInfo.next ? `${leagueInfo.next.minXp} XP (${leagueInfo.next.label})` : 'Maks Seviye'}</span>
                  </div>
                  <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.round(leagueInfo.progressInLevel * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
