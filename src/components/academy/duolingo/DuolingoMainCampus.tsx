'use client';

import React, { useState } from 'react';
import { DuolingoTopBar } from './DuolingoTopBar';
import { DuolingoPathView } from './DuolingoPathView';
import { DuolingoRightSidebar } from './DuolingoRightSidebar';
import { DuolingoLessonEngine } from './DuolingoLessonEngine';
import { CurriculumLesson } from './DuolingoCurriculumData';
import { CertificateModal } from '../CertificateModal';
import { ACADEMY_MVP_UNITS } from '@/data/academyMvpUnits';

export function DuolingoMainCampus() {
  const [activeLesson, setActiveLesson] = useState<CurriculumLesson | null>(null);
  const [certModalOpen, setCertModalOpen] = useState<boolean>(false);
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number>(0);

  const handleStartLesson = (lesson: CurriculumLesson) => {
    setActiveLesson(lesson);
  };

  const handleLessonCompleted = (lessonId: string, earnedXp: number) => {
    // Score & rewards handled in store
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col">
      {/* ─── STICKY DUOLINGO TOP STATUS HUD ─── */}
      <DuolingoTopBar />

      {/* ─── MAIN CAMPUS VIEWPORT ─── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row items-start justify-center gap-8 lg:gap-12">
          
          {/* LEFT: THE WINDING LEARNING PATH (15 SECTIONS PER ACTIVE UNIT) */}
          <div className="flex-1 w-full flex justify-center">
            <DuolingoPathView
              onStartLesson={handleStartLesson}
              activeUnitIndex={selectedUnitIndex}
              onSelectUnit={setSelectedUnitIndex}
            />
          </div>

          {/* RIGHT: STICKY DESKTOP SIDEBAR (UNIT NAVIGATOR, LEADERBOARDS, QUESTS, SHOP) */}
          <div className="w-full lg:w-80 shrink-0 sticky top-16">
            <DuolingoRightSidebar
              onOpenCertificates={() => setCertModalOpen(true)}
              selectedUnitIndex={selectedUnitIndex}
              onSelectUnit={setSelectedUnitIndex}
            />
          </div>

        </div>
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
