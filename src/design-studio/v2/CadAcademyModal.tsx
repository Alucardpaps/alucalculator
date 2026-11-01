'use client';

/**
 * 🎓 AEGIS CAD ACADEMY — INTERACTIVE CAD MASTERY HUB
 * 
 * Comprehensive interactive curriculum bridging the world's leading CAD software:
 * - SolidWorks (Sketching, Hole Wizard, Mates)
 * - Siemens NX (Synchronous Modeling, Move Face, Live Rules)
 * - Autodesk Inventor (Design Accelerators, VDI 2230, ISO 6336)
 * - Blender & CATIA (Procedural Arrays, Knowledgeware Rules)
 * 
 * Each lesson includes a 1-click "Stüdyoda Dene (Load Model)" button
 * that injects the sample model directly into the 3D studio viewport.
 */

import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  CheckCircle,
  Play,
  ArrowRight,
  Layers,
  Settings,
  Cpu,
  Boxes,
  Zap,
  X,
} from 'lucide-react';
import { useDesignStore } from '@/design-studio/designStore';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

interface CadAcademyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotification?: (msg: string) => void;
}

interface CadLesson {
  id: string;
  trackId: string;
  titleTr: string;
  titleEn: string;
  program: 'SOLIDWORKS' | 'SIEMENS NX' | 'INVENTOR' | 'BLENDER' | 'CATIA';
  standard: string;
  summaryTr: string;
  summaryEn: string;
  stepsTr: string[];
  stepsEn: string[];
  sampleModelType: 'plate-with-holes' | 'stepped-shaft' | 'gear-pair' | 'spring' | 't-slot';
}

const CAD_LESSONS: CadLesson[] = [
  {
    id: 'sw-1',
    trackId: 'solidworks',
    titleTr: 'Parametrik Çizim ve Hole Wizard (Delik Sihirbazı)',
    titleEn: 'Parametric Sketching & ISO Hole Wizard',
    program: 'SOLIDWORKS',
    standard: 'ISO 965 / DIN 7991',
    summaryTr: 'Düzlem seçimi, geometrik ilişkiler (teğet, eş merkezli) ve standart ISO metrik cıvata deliklerinin yerleşimi.',
    summaryEn: 'Plane selection, geometric relations (tangent, concentric) and ISO metric clearance hole placement.',
    stepsTr: [
      '1. Üst düzleme 120x80x15 mm temel plaka yerleştirin.',
      '2. Hole Wizard ile köşelere 4x M6 cıvata deliği ekleyin.',
      '3. Cidar payının en az 1.5d (9mm) olduğunu doğrulayın.',
    ],
    stepsEn: [
      '1. Place a 120x80x15 mm base plate on the top plane.',
      '2. Use Hole Wizard to stamp 4x M6 corner clearance holes.',
      '3. Verify edge distance satisfies >= 1.5d (9mm).',
    ],
    sampleModelType: 'plate-with-holes',
  },
  {
    id: 'nx-1',
    trackId: 'nx',
    titleTr: 'Siemens NX Senkron Modelleme & Yüzey Taşıma (Push-Pull)',
    titleEn: 'Siemens NX Synchronous Move Face & Push-Pull',
    program: 'SIEMENS NX',
    standard: 'Parasolid Direct Modeling B-Rep',
    summaryTr: 'Ağaç geçmişi olmayan dışarıdan aktarılmış (STEP/IGES) gövdelerin yüzeylerini doğrudan öteleme ve delik derinliklerini senkronize etme.',
    summaryEn: 'Directly offsetting B-Rep faces of imported STEP models and auto-synchronizing child through-hole depths.',
    stepsTr: [
      '1. Herhangi bir parça yüzeyine tıklayarak aktif yüzeyi seçin.',
      '2. Doğrudan Modelleme çubuğundan +10 mm İt/Çek uygulayın.',
      '3. NX Canlı Kurallar (Live Rules) ile eş düzlemli yüzeyleri kontrol edin.',
    ],
    stepsEn: [
      '1. Click any part face to select the active surface normal.',
      '2. Apply +10mm Push/Pull from the Direct Modeling toolbar.',
      '3. Check NX Live Rules to detect adjacent coplanar faces.',
    ],
    sampleModelType: 'plate-with-holes',
  },
  {
    id: 'inv-1',
    trackId: 'inventor',
    titleTr: 'Autodesk Inventor Tasarım Hızlandırıcıları (VDI 2230 Cıvata)',
    titleEn: 'Autodesk Inventor Bolted Connection Accelerator (VDI 2230)',
    program: 'INVENTOR',
    standard: 'VDI 2230 / ISO 4014 / ISO 7089',
    summaryTr: 'Hesaplanmış ön gerilme kuvveti ve sıkma torku ile komple cıvata, pullar ve somun yığınını tek tıkla montaja yerleştirme.',
    summaryEn: 'One-click assembly insertion of complete bolt, dual washers, and nut stack with calculated VDI 2230 tightening torque.',
    stepsTr: [
      '1. Sol çekmeceden "Mühendislik Hesaplayıcıları" sekmesini açın.',
      '2. "VDI 2230 Cıvata Bağlantısı" üreticisini seçin.',
      '3. M12 10.9 kalite için 85 Nm torku doğrulayıp montaja ekleyin.',
    ],
    stepsEn: [
      '1. Open the Engineering Solvers drawer on the left side.',
      '2. Select the "VDI 2230 Bolted Connection" generator.',
      '3. Verify 85 Nm torque for M12 grade 10.9 and inject into assembly.',
    ],
    sampleModelType: 'plate-with-holes',
  },
  {
    id: 'inv-2',
    trackId: 'inventor',
    titleTr: 'Evolvent Dişli Çifti Hesaplama (ISO 6336)',
    titleEn: 'ISO 6336 Involute Gearbox Generator',
    program: 'INVENTOR',
    standard: 'ISO 6336-1 / DIN 867',
    summaryTr: 'Modül, diş sayısı, eksenler arası mesafe (a) ve kavrama açısı ile eşleşen 3B dişli çiftini parametrik olarak üretme.',
    summaryEn: 'Parametric generation of matched gear pairs from module, teeth counts, center distance, and pressure angle.',
    stepsTr: [
      '1. Modül m=2.5, Pinyon z1=18, Dişli z2=36 parametrelerini ayarlayın.',
      '2. Eksen mesafesi a=67.5 mm olan dişli çiftini oluşturun.',
      '3. Dönme eksenlerini ve diş boşluğu (backlash) parametrelerini inceleyin.',
    ],
    stepsEn: [
      '1. Set module m=2.5, Pinion z1=18, Gear z2=36.',
      '2. Generate matched gear pair with center distance a=67.5 mm.',
      '3. Inspect rotation axes and backlash clearance.',
    ],
    sampleModelType: 'gear-pair',
  },
  {
    id: 'blender-1',
    trackId: 'blender',
    titleTr: 'Blender Geometry Nodes: Prosedürel PCD & Dizi Üretimi',
    titleEn: 'Blender Geometry Nodes: Procedural PCD & Linear Array',
    program: 'BLENDER',
    standard: 'DIN EN 1092-1 Flange PCD',
    summaryTr: 'Düğüm tabanlı parametrik dizi ile flanş cıvata dairesi (PCD) ve eşit açılı 3B çoğaltma oluşturma.',
    summaryEn: 'Node-driven procedural arrays for pitch circle diameters (PCD) and equiangular 3D duplication.',
    stepsTr: [
      '1. Akış Motoru (Flow Engine) sekmesinden "Procedural Array Driver" düğümünü ekleyin.',
      '2. PCD çapını 100 mm, adet sayısını 6 olarak bağlayın.',
      '3. Üretilen 60° açılı koordinat matrislerini 3B görünüme aktarın.',
    ],
    stepsEn: [
      '1. Add the "Procedural Array Driver" node in Flow Engine.',
      '2. Connect PCD diameter 100 mm with instance count 6.',
      '3. Feed generated 60° transform matrices into 3D viewport.',
    ],
    sampleModelType: 'stepped-shaft',
  },
];

export function CadAcademyModal({ isOpen, onClose, onNotification }: CadAcademyModalProps) {
  const { language } = useI18nStore();
  const [activeLessonId, setActiveLessonId] = useState<string>('sw-1');

  if (!isOpen) return null;

  const activeLesson = CAD_LESSONS.find((l) => l.id === activeLessonId) || CAD_LESSONS[0];

  const handleLoadSampleModel = (lesson: CadLesson) => {
    const store = useDesignStore.getState();
    store.pushHistory();

    if (lesson.sampleModelType === 'plate-with-holes') {
      const partId = store.addPart('box');
      store.updatePart(partId, {
        name: 'Academy Master Base Plate',
        position: { x: 0, y: 7.5, z: 0 },
        params: { width: 120, height: 15, depth: 80 },
        holes: [
          { id: 'h-1', face: 'top', size: 'M6', x: -45, y: -25, depth: 15, type: 'clearance' },
          { id: 'h-2', face: 'top', size: 'M6', x: 45, y: -25, depth: 15, type: 'clearance' },
          { id: 'h-3', face: 'top', size: 'M6', x: -45, y: 25, depth: 15, type: 'clearance' },
          { id: 'h-4', face: 'top', size: 'M6', x: 45, y: 25, depth: 15, type: 'clearance' },
        ],
      });
      store.select(partId);
    } else if (lesson.sampleModelType === 'gear-pair') {
      const { pinionId } = store.addGearPair({
        module: 2.5,
        z1: 18,
        z2: 36,
        pressureAngle: 20,
      });
      if (pinionId) store.select(pinionId);
    } else if (lesson.sampleModelType === 'stepped-shaft') {
      const s1 = store.addPart('cylinder');
      store.updatePart(s1, {
        name: 'Shaft Journal D30',
        position: { x: 0, y: 15, z: 0 },
        params: { diameter: 30, length: 60 },
      });
      store.select(s1);
    }

    onNotification?.(
      t12(
        language,
        `Loaded "${lesson.titleEn}" interactive sample model into 3D Studio!`,
        `"${lesson.titleTr}" interaktif örnek modeli 3B Stüdyoya yüklendi!`
      )
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-in fade-in duration-150 font-mono select-none">
      <div className="w-full max-w-4xl max-h-[85vh] rounded-[var(--radius-l)] bg-[var(--bg-0)] border border-[var(--line)] shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)] bg-[var(--bg-1)]">
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-[var(--cyan)]" />
            <span className="font-extrabold text-sm text-white">
              {t12(language, 'AEGIS CAD ACADEMY & FEATURE MATRIX', 'AEGIS CAD AKADEMİSİ & ÖZELLİK MATRİSİ')}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/30 font-bold">
              SW / NX / INV / BLENDER / CATIA
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body: Sidebar + Main Lesson View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Lessons Nav List */}
          <div className="w-72 border-r border-[var(--line)] bg-[var(--bg-1)]/50 p-2 overflow-y-auto flex flex-col gap-1.5 shrink-0">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t12(language, 'Interactive Masterclasses', 'İnteraktif Eğitimler')}
            </div>
            {CAD_LESSONS.map((lesson) => {
              const active = lesson.id === activeLessonId;
              return (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLessonId(lesson.id)}
                  className={`text-left p-2 rounded-[var(--radius-s)] border transition-all cursor-pointer flex flex-col gap-1 ${
                    active
                      ? 'bg-[var(--bg-2)] border-[var(--cyan)]/60 text-white shadow-md'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[var(--bg-2)]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-black/40 text-[var(--cyan)] border border-[var(--line)]">
                      {lesson.program}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">§ {lesson.standard}</span>
                  </div>
                  <span className="text-xs font-bold leading-tight">
                    {language === 'tr' ? lesson.titleTr : lesson.titleEn}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Lesson Detail View */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col justify-between gap-4 bg-[var(--bg-0)]">
            <div className="flex flex-col gap-3">
              {/* Program & Standard Badges */}
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[var(--cyan)] text-black text-xs font-extrabold">
                  {activeLesson.program}
                </span>
                <span className="px-2 py-0.5 rounded bg-[var(--bg-1)] border border-[var(--line)] text-slate-300 text-xs">
                  {activeLesson.standard}
                </span>
              </div>

              {/* Title & Summary */}
              <h2 className="text-lg font-extrabold text-white">
                {language === 'tr' ? activeLesson.titleTr : activeLesson.titleEn}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed bg-[var(--bg-1)] p-3 rounded-[var(--radius-s)] border border-[var(--line)]">
                {language === 'tr' ? activeLesson.summaryTr : activeLesson.summaryEn}
              </p>

              {/* Workflow Steps */}
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-xs font-bold text-[var(--cyan)] flex items-center gap-1.5">
                  <BookOpen size={14} />
                  <span>{t12(language, 'Guided Engineering Procedure:', 'Adım Adım Mühendislik Prosedürü:')}</span>
                </span>
                <div className="flex flex-col gap-1.5 pl-2 border-l-2 border-[var(--cyan)]/30">
                  {(language === 'tr' ? activeLesson.stepsTr : activeLesson.stepsEn).map((step, idx) => (
                    <div key={idx} className="text-xs text-slate-200">
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {t12(
                  language,
                  'Click to spawn this exact CAD geometry and test the workflow:',
                  'Bu CAD geometrisini sahneye yükleyip hemen test etmek için:'
                )}
              </span>
              <button
                type="button"
                onClick={() => handleLoadSampleModel(activeLesson)}
                className="px-4 py-2 rounded-[var(--radius-s)] bg-[var(--cyan)] hover:brightness-110 text-black font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
              >
                <Play size={14} className="fill-black" />
                <span>{t12(language, 'Load Model & Practice in 3D', 'Stüdyoda Dene & Modeli Yükle')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
