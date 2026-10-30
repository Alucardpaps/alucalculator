'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  Target, CheckCircle2, Circle, Trophy, Sparkles, ChevronDown,
  ChevronUp, X, ArrowRight, Award, Compass, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMissionStore } from '@/store/useMissionStore';
import { ENGINEERING_MISSIONS } from '@/data/engineeringMissions';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

export function MissionHUD() {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const {
    activeMissionId,
    stepStates,
    isHudOpen,
    isCompletedBannerVisible,
    toggleHud,
    abandonMission,
    dismissCompletedBanner,
    startMission,
    getActiveMission,
  } = useMissionStore();

  const { language } = useI18nStore();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname?.includes('/widget')) return null;
  if (!mounted) return null;

  const mission = getActiveMission();

  if (!mission) return null;

  const completedStepCount = mission.steps.filter((s) => stepStates[s.id]).length;
  const totalStepCount = mission.steps.length;
  const isAllComplete = completedStepCount === totalStepCount;
  const progressPercent = Math.round((completedStepCount / totalStepCount) * 100);

  const handleNextMission = () => {
    const currentIndex = ENGINEERING_MISSIONS.findIndex((m) => m.id === mission.id);
    const nextMission = ENGINEERING_MISSIONS[(currentIndex + 1) % ENGINEERING_MISSIONS.length];
    if (nextMission) {
      startMission(nextMission.id);
    }
  };

  return (
    <>
      {/* ─── FLOATING MISSION COMPANION WIDGET ─── */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-80 sm:w-96 rounded-3xl bg-[var(--bg-1)]/95 border border-cyan-500/40 shadow-2xl overflow-hidden font-sans text-slate-100"
        >
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-[var(--bg-2)] to-[var(--bg-1)] border-b border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 shrink-0">
                <Target size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                    {t12(language, 'ACTIVE QUEST', 'AKTİF GÖREV')}
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">
                    +{mission.rewardXp} XP
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white truncate mt-0.5">
                  {t12(language, mission.titleEn, mission.titleTr)}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={toggleHud}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                title={isHudOpen ? t12(language, 'Collapse', 'Küçült') : t12(language, 'Expand', 'Genişlet')}
              >
                {isHudOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
              <button
                type="button"
                onClick={abandonMission}
                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                title={t12(language, 'Abandon Quest', 'Görevi İptal Et')}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1 bg-slate-900">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Expanded Step Checklist */}
          {isHudOpen && (
            <div className="p-4 space-y-3 max-h-72 overflow-y-auto bg-black/30">
              <p className="text-[11px] text-slate-300 leading-relaxed bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
                {t12(language, mission.descriptionEn, mission.descriptionTr)}
              </p>

              <div className="space-y-2">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>{t12(language, 'Checklist', 'Görev Adımları')}</span>
                  <span className="text-cyan-400">{completedStepCount} / {totalStepCount}</span>
                </div>

                {mission.steps.map((step, idx) => {
                  const isDone = Boolean(stepStates[step.id]);
                  return (
                    <div
                      key={step.id}
                      className={`p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                        isDone
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-900/60 border-white/5 text-slate-300'
                      }`}
                    >
                      <div className="shrink-0 pt-0.5">
                        {isDone ? (
                          <CheckCircle2 size={15} className="text-emerald-400" />
                        ) : (
                          <Circle size={15} className="text-slate-500" />
                        )}
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="text-xs font-bold leading-tight">
                          {idx + 1}. {t12(language, step.labelEn, step.labelTr)}
                        </div>
                        {!isDone && (step.hintTr || step.hintEn) && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            💡 {t12(language, step.hintEn || step.hintTr || '', step.hintTr)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ─── CELEBRATORY COMPLETION BANNER ─── */}
      <AnimatePresence>
        {isCompletedBannerVisible && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-[var(--bg-1)] border border-cyan-500/40 shadow-2xl text-center space-y-5"
            >
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-slate-950 shadow-xl mx-auto">
                <Trophy size={32} />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                  {t12(language, 'MISSION ACCOMPLISHED!', 'GÖREV TAMAMLANDI!')}
                </span>
                <h3 className="text-xl font-black text-white">
                  {t12(language, mission.titleEn, mission.titleTr)}
                </h3>
                <p className="text-xs text-slate-300">
                  {t12(language, 'Congratulations! You successfully applied real engineering parameters.', 'Tebrikler! Gerçek mühendislik parametrelerini başarıyla uyguladınız.')}
                </p>
              </div>

              {/* Rewards */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-black/40 border border-white/10 font-mono">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block uppercase">{t12(language, 'XP Earned', 'Kazanılan XP')}</span>
                  <span className="text-lg font-black text-amber-400">+{mission.rewardXp} XP</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block uppercase">{t12(language, 'Gems Earned', 'Kazanılan Mücevher')}</span>
                  <span className="text-lg font-black text-cyan-400">+{mission.rewardGems} 💎</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={dismissCompletedBanner}
                  className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-slate-300 transition cursor-pointer"
                >
                  {t12(language, 'Close', 'Kapat')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    dismissCompletedBanner();
                    handleNextMission();
                  }}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{t12(language, 'Next Quest', 'Sonraki Görev')}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
