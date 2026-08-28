'use client';

import React, { useState } from 'react';
import { DuolingoTopBar } from './DuolingoTopBar';
import { DuolingoPathView } from './DuolingoPathView';
import { DuolingoRightSidebar } from './DuolingoRightSidebar';
import { DuolingoLessonEngine } from './DuolingoLessonEngine';
import { DuolingoLesson, DUOLINGO_SECTIONS } from './DuolingoCurriculumData';
import { CertificateModal } from '../CertificateModal';
import { useI18nStore } from '@/store/i18nStore';
import { ACADEMY_MVP_UNITS } from '@/data/academyMvpUnits';

export function DuolingoMainCampus() {
  const { language } = useI18nStore();
  const tr = language === 'tr';

  const [activeLesson, setActiveLesson] = useState<DuolingoLesson | null>(null);
  const [certModalOpen, setCertModalOpen] = useState<boolean>(false);

  const handleStartLesson = (lesson: DuolingoLesson) => {
    setActiveLesson(lesson);
  };

  const handleLessonCompleted = (lessonId: string, earnedXp: number) => {
    // Handled in store
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col">
      {/* ─── STICKY DUOLINGO TOP STATUS HUD ─── */}
      <DuolingoTopBar tr={tr} />

      {/* ─── MAIN CAMPUS VIEWPORT ─── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row items-start justify-center gap-8 lg:gap-12">
          
          {/* LEFT: THE WINDING LEARNING PATH */}
          <div className="flex-1 w-full flex justify-center">
            <DuolingoPathView onStartLesson={handleStartLesson} tr={tr} />
          </div>

          {/* RIGHT: STICKY DESKTOP SIDEBAR (LEADERBOARDS, QUESTS, SHOP) */}
          <div className="w-full lg:w-80 shrink-0 sticky top-16">
            <DuolingoRightSidebar
              tr={tr}
              onOpenCertificates={() => setCertModalOpen(true)}
            />
          </div>

        </div>
      </main>

      {/* ─── FULLSCREEN INTERACTIVE LESSON PLAYER ─── */}
      {activeLesson && (
        <DuolingoLessonEngine
          lesson={activeLesson}
          isOpen={Boolean(activeLesson)}
          onClose={() => setActiveLesson(null)}
          onCompleted={handleLessonCompleted}
          tr={tr}
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
