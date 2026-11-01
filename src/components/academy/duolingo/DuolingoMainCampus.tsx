'use client';

import React, { useState } from 'react';
import { DuolingoTopBar } from './DuolingoTopBar';
import { DuolingoPathView } from './DuolingoPathView';
import { DuolingoRightSidebar } from './DuolingoRightSidebar';
import { DuolingoLessonEngine } from './DuolingoLessonEngine';
import { CurriculumLesson } from './DuolingoCurriculumData';
import { CertificateModal } from '../CertificateModal';
import { ACADEMY_MVP_UNITS } from '@/data/academyMvpUnits';
import { ENGINEERING_MISSIONS } from '@/data/engineeringMissions';
import { useMissionStore } from '@/store/useMissionStore';
import { Trophy, Sparkles, Target, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

export function DuolingoMainCampus() {
  const { language } = useI18nStore();
  const [activeLesson, setActiveLesson] = useState<CurriculumLesson | null>(null);
  const [certModalOpen, setCertModalOpen] = useState<boolean>(false);
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'path' | 'missions'>('path');

  const { startMission, completedMissionIds } = useMissionStore();

  const handleStartLesson = (lesson: CurriculumLesson) => {
    setActiveLesson(lesson);
  };

  const handleLessonCompleted = (lessonId: string, earnedXp: number) => {
    // Score & rewards handled in store
  };

  return (
    <div className="min-h-screen bg-[var(--bg-0)] text-slate-100 flex flex-col font-sans">
      {/* ─── STICKY DUOLINGO TOP STATUS HUD ─── */}
      <DuolingoTopBar />

      {/* ─── MAIN CAMPUS VIEWPORT ─── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Navigation Mode Switcher: Müfredat Yolu vs Canlı Mühendislik Görevleri */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-black/40 border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('path')}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'path'
                  ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-lg '
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🗺️</span>
              {t12(language, 'Curriculum Path', 'Müfredat Yolu')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('missions')}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'missions'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg '
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🎯</span>
              {t12(language, 'In-App Live Quests', 'Canlı Mühendislik Görevleri')}
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[9px]">
                {completedMissionIds.length}/{ENGINEERING_MISSIONS.length}
              </span>
            </button>
          </div>
        </div>

        {/* ─── TAB 1: DUOLINGO WINDING LEARNING PATH ─── */}
        {activeTab === 'path' && (
          <div className="flex flex-col lg:flex-row items-start justify-center gap-8 lg:gap-12">
            <div className="flex-1 w-full flex justify-center">
              <DuolingoPathView
                onStartLesson={handleStartLesson}
                activeUnitIndex={selectedUnitIndex}
                onSelectUnit={setSelectedUnitIndex}
              />
            </div>

            <div className="w-full lg:w-80 shrink-0 sticky top-16">
              <DuolingoRightSidebar
                onOpenCertificates={() => setCertModalOpen(true)}
                selectedUnitIndex={selectedUnitIndex}
                onSelectUnit={setSelectedUnitIndex}
              />
            </div>
          </div>
        )}

        {/* ─── TAB 2: LIVE IN-APP ENGINEERING MISSIONS BOARD ─── */}
        {activeTab === 'missions' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900/60 to-cyan-950/60 border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
                  {t12(language, 'HANDS-ON LEARNING', 'UYGULAMA İÇİ PRATİK ÖĞRENME')}
                </span>
                <h3 className="text-lg font-black text-white">
                  {t12(language, 'Live Tool Missions', 'Canlı Araç Görevleri (Gerçek Hesaplayıcıda Çöz)')}
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl">
                  {t12(language, 'Click a quest to directly launch that exact real calculator (Gears, 3D Assembly, Cut Optimizer, CAD, FEA, Bolt Torque) with the live floating Mission HUD!', 'Göreve tıklayınca uygulama sizi doğrudan o gerçek hesaplayıcıya (Dişli, 3D Montaj, Kesim, CAD, FEA, Civata) götürür ve sağ altta canlı görev rehberi eşlik eder!')}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/10 text-center font-mono">
                <span className="text-[10px] text-slate-400 block uppercase">{t12(language, 'Completed', 'Tamamlanan')}</span>
                <span className="text-base font-black text-emerald-400">
                  {completedMissionIds.length} / {ENGINEERING_MISSIONS.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ENGINEERING_MISSIONS.map((m, idx) => {
                const isCompleted = completedMissionIds.includes(m.id);
                return (
                  <div
                    key={m.id}
                    className="p-5 rounded-3xl bg-[var(--bg-1)] border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-4 group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                          #{idx + 1} · {m.category.toUpperCase()}
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          m.difficulty === 'Master' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {m.difficulty}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {t12(language, m.titleEn, m.titleTr)}
                      </h4>

                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                        {t12(language, m.descriptionEn, m.descriptionTr)}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      <div className="text-[11px] font-mono font-bold text-amber-400">
                        +{m.rewardXp} XP · +{m.rewardGems} 💎
                      </div>

                      <button
                        type="button"
                        onClick={() => startMission(m.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg '
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>{t12(language, 'Replay', 'Tekrar Çöz')}</span>
                          </>
                        ) : (
                          <>
                            <span>{t12(language, 'Start Quest', 'Görevi Başlat')}</span>
                            <ArrowRight size={13} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ─── FULLSCREEN INTERACTIVE LESSON PLAYER (5 MODALITIES) ─── */}
      {activeLesson && (
        <DuolingoLessonEngine
          lesson={activeLesson}
          isOpen={Boolean(activeLesson)}
          onClose={() => setActiveLesson(null)}
          onCompleted={handleLessonCompleted}
        />
      )}

      {/* ─── CERTIFICATE MODAL ─── */}
      <CertificateModal
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        unit={ACADEMY_MVP_UNITS[0]}
        score={100}
      />
    </div>
  );
}
