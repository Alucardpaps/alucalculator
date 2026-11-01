'use client';

import React, { useMemo, useState } from 'react';
import {
  Link2,
  X,
  Check,
  Disc,
  Layers,
  ArrowRightLeft,
  MoveHorizontal,
  Split,
  CornerDownRight,
  Maximize2,
  Minimize2,
  Sparkles,
  HelpCircle,
  MousePointerClick,
  ChevronDown,
  GripHorizontal,
  RotateCcw,
} from 'lucide-react';
import { useDesignStore } from './designStore';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { extractPartFeatures, inferSmartMateKind, getValidMateKinds } from './assembly/featureExtractor';
import type { MateKind } from './assembly/mateTypes';
import { useDraggableDialog } from './useDraggableDialog';

export function AssemblyMateModal() {
  const { language } = useI18nStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showDropdowns, setShowDropdowns] = useState(false);

  const { position, setPosition, resetPosition, isDragging, elementRef, dragHandleProps } = useDraggableDialog({
    initialPosition: () => {
      if (typeof window === 'undefined') return { x: 340, y: 112 };
      const isDesktop = window.innerWidth >= 768;
      return {
        x: isDesktop ? Math.min(340, Math.max(16, window.innerWidth - 360)) : 16,
        y: 112,
      };
    },
  });

  const isMateModalOpen = useDesignStore((s) => s.isMateModalOpen);
  const closeMateModal = useDesignStore((s) => s.closeMateModal);
  const activeMateDraft = useDesignStore((s) => s.activeMateDraft);
  const updateMateDraft = useDesignStore((s) => s.updateMateDraft);
  const commitMateDraft = useDesignStore((s) => s.commitMateDraft);
  const parts = useDesignStore((s) => s.parts);

  const partA = useMemo(() => {
    return parts.find((p) => p.id === activeMateDraft?.partAId) || null;
  }, [activeMateDraft?.partAId, parts]);

  const partB = useMemo(() => {
    return parts.find((p) => p.id === activeMateDraft?.partBId) || null;
  }, [activeMateDraft?.partBId, parts]);

  const featuresA = useMemo(() => {
    return partA ? extractPartFeatures(partA, true) : [];
  }, [partA]);

  const featuresB = useMemo(() => {
    return partB ? extractPartFeatures(partB, true) : [];
  }, [partB]);

  const featureA = useMemo(() => {
    if (!activeMateDraft?.featureAId) return null;
    return featuresA.find((f) => f.id === activeMateDraft.featureAId) || null;
  }, [featuresA, activeMateDraft?.featureAId]);

  const featureB = useMemo(() => {
    if (!activeMateDraft?.featureBId) return null;
    return featuresB.find((f) => f.id === activeMateDraft.featureBId) || null;
  }, [featuresB, activeMateDraft?.featureBId]);

  // Dynamic contextual mate recommendations based on picked geometry
  const { recommended, compatible, incompatible } = useMemo(() => {
    return getValidMateKinds(featureA, featureB);
  }, [featureA, featureB]);

  // Auto-switch to recommended mate type when a valid pair is picked
  React.useEffect(() => {
    if (featureA && featureB && activeMateDraft) {
      if (incompatible.includes(activeMateDraft.kind)) {
        updateMateDraft({ kind: recommended });
      }
    }
  }, [featureA, featureB, recommended, incompatible, activeMateDraft, updateMateDraft]);

  if (!isMateModalOpen || !activeMateDraft) return null;

  const currentKind = activeMateDraft.kind;

  const mateTypes: {
    kind: MateKind;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    labelEn: string;
    labelTr: string;
    descEn: string;
    descTr: string;
  }[] = [
    {
      kind: 'concentric',
      icon: Disc,
      labelEn: 'Concentric',
      labelTr: 'Eşmerkezli',
      descEn: 'Aligns hole or cylinder axes collinearly (SolidWorks Concentric Mate)',
      descTr: 'Delik veya silindir eksenlerini aynı merkez çizgisine hizalar',
    },
    {
      kind: 'coincident',
      icon: Layers,
      labelEn: 'Coincident',
      labelTr: 'Çakışık',
      descEn: 'Snaps two planar faces flush together (Zero offset contact)',
      descTr: 'İki düzlemsel yüzeyi birbirine yapıştırır ve temas ettirir',
    },
    {
      kind: 'distance',
      icon: MoveHorizontal,
      labelEn: 'Distance',
      labelTr: 'Mesafe',
      descEn: 'Maintains fixed planar separation offset along face normal',
      descTr: 'İki yüzey arasında girilen mesafeyi korur',
    },
    {
      kind: 'parallel',
      icon: ArrowRightLeft,
      labelEn: 'Parallel',
      labelTr: 'Paralel',
      descEn: 'Aligns surface normals in parallel direction without locking position',
      descTr: 'Yüzey normallerini paralel tutar',
    },
    {
      kind: 'perpendicular',
      icon: Split,
      labelEn: 'Perpendicular',
      labelTr: 'Dik',
      descEn: 'Enforces 90° angle between mating surface normals',
      descTr: 'Yüzey normallerini 90 derece dik konumlandırır',
    },
    {
      kind: 'tangent',
      icon: Disc,
      labelEn: 'Tangent',
      labelTr: 'Teğet',
      descEn: 'Maintains cylindrical surface contact along planar face',
      descTr: 'Silindirik gövdeyi düzlem yüzeye teğet konumlandırır',
    },
    {
      kind: 'end-to-slot',
      icon: CornerDownRight,
      labelEn: 'End-to-Slot',
      labelTr: 'Kanal-Uç',
      descEn: 'Snaps profile end face into aluminum T-slot channel groove',
      descTr: 'Profil uç yüzeyini T-kanal profili yuvasına sabitler',
    },
  ];

  const handleApply = () => {
    const success = commitMateDraft();
    if (!success) {
      alert(
        t12(
          language,
          'Please select two valid parts and their mating geometry features.',
          'Lütfen iki farklı parça ve uygun montaj yüzeyi/ekseni seçin.'
        )
      );
    }
  };

  return (
    <div
      ref={elementRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      className={`fixed z-50 w-80 max-w-[calc(100vw-2rem)] rounded-[var(--radius-m)] border border-cyan-500/50 bg-[var(--bg-1)]/98 shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-[11px] font-mono pointer-events-auto select-none transition-shadow ${
        isDragging ? 'ring-2 ring-[var(--cyan)] shadow-[0_25px_70px_rgba(58,208,230,0.4)]' : ''
      }`}
    >
      {/* ─── DRAGGABLE HEADER (SOLIDWORKS PROPERTYMANAGER) ─── */}
      <div
        id="mate-modal-header"
        {...dragHandleProps}
        onDoubleClick={resetPosition}
        title={t12(language, 'Drag to Move · Double Click to Reset', 'Sürükleyip Taşı · Sıfırlamak İçin Çift Tıkla')}
        className="group flex items-center justify-between px-3 py-2 bg-[var(--bg-2)] border-b border-[var(--line)] cursor-grab active:cursor-grabbing select-none hover:bg-[var(--bg-2)]/80 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded bg-[var(--cyan)]/20 border border-[var(--cyan)]/50 text-[var(--cyan)] shrink-0">
            <Link2 size={13} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white text-xs flex items-center gap-1.5 truncate">
              <span className="truncate">{t12(language, 'Mate PropertyManager', 'Montaj İlişkisi')}</span>
              <span className="px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[8px] font-black uppercase shrink-0">
                SW MATE
              </span>
            </div>
            <div className="text-[8.5px] text-[var(--alu-dim)] flex items-center gap-1">
              <GripHorizontal size={11} className="text-slate-500 group-hover:text-cyan-400 shrink-0" />
              <span className="truncate">{t12(language, 'Drag to reposition', 'Taşımak için sürükleyin')}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={resetPosition}
            className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-white/10 rounded transition-colors"
            title={t12(language, 'Reset Position', 'Konumu Sıfırla')}
          >
            <RotateCcw size={12} />
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title={isCollapsed ? t12(language, 'Expand', 'Genişlet') : t12(language, 'Collapse', 'Küçült')}
          >
            {isCollapsed ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          </button>
          <button
            type="button"
            onClick={closeMateModal}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
            title={t12(language, 'Exit Mate Mode (Esc)', 'Montaj Modundan Çık (Esc)')}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ─── EXPANDED BODY ─── */}
      {!isCollapsed && (
        <div className="p-3 space-y-3 max-h-[calc(100vh-14rem)] overflow-y-auto custom-scrollbar">
          {/* 1. MATE SELECTIONS (SEÇİLEN ÖĞELER - GÖRSEL 3D ODAKLI) */}
          <div className="space-y-2 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] p-2">
            <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--cyan)] flex items-center justify-between">
              <span>// {t12(language, 'MATE SELECTIONS', 'SEÇİLEN ÖĞELER')}</span>
              <span className="text-[8px] text-[var(--alu-dim)] font-normal">
                {t12(language, 'Click directly on 3D faces/holes', '3D modelden yüzey/delik tıklayın')}
              </span>
            </div>

            {/* Entity 1 */}
            <div className="space-y-1 p-2 rounded bg-[var(--bg-2)] border border-[var(--line)]">
              <div className="flex items-center justify-between text-[8.5px] font-bold text-white">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>{t12(language, 'Entity 1 (Part A)', '1. Unsur (Parça A)')}</span>
                </span>
                {partA && (
                  <button
                    type="button"
                    onClick={() => updateMateDraft({ partAId: null, featureAId: null })}
                    className="text-[8px] text-rose-400 hover:underline"
                    title={t12(language, 'Clear selection', 'Seçimi temizle')}
                  >
                    {t12(language, 'Clear', 'Temizle')}
                  </button>
                )}
              </div>

              {partA && featureA ? (
                <div className="flex items-center justify-between p-1.5 rounded bg-cyan-950/40 border border-cyan-500/50 text-cyan-200 text-[9px] font-bold">
                  <span className="truncate">{partA.name} ▸ {featureA.name}</span>
                  <span className="text-[8px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono shrink-0 ml-1">
                    {featureA.kind === 'hole-axis' ? '◎ DELİK/EKSEN' : featureA.kind === 'slot-channel' ? '⤵ KANAL' : '⫽ YÜZEY'}
                  </span>
                </div>
              ) : (
                <div className="p-2 rounded bg-[var(--bg-0)] border border-dashed border-cyan-500/50 text-cyan-300 text-[8.5px] text-center animate-pulse flex items-center justify-center gap-1">
                  <MousePointerClick size={12} className="animate-bounce" />
                  <span>{t12(language, 'Click 1st face or hole in 3D', '3D modelden 1. yüzeyi/deliği tıklayın')}</span>
                </div>
              )}
            </div>

            {/* Entity 2 */}
            <div className="space-y-1 p-2 rounded bg-[var(--bg-2)] border border-[var(--line)]">
              <div className="flex items-center justify-between text-[8.5px] font-bold text-white">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{t12(language, 'Entity 2 (Part B)', '2. Unsur (Parça B)')}</span>
                </span>
                {partB && (
                  <button
                    type="button"
                    onClick={() => updateMateDraft({ partBId: null, featureBId: null })}
                    className="text-[8px] text-rose-400 hover:underline"
                    title={t12(language, 'Clear selection', 'Seçimi temizle')}
                  >
                    {t12(language, 'Clear', 'Temizle')}
                  </button>
                )}
              </div>

              {partB && featureB ? (
                <div className="flex items-center justify-between p-1.5 rounded bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 text-[9px] font-bold">
                  <span className="truncate">{partB.name} ▸ {featureB.name}</span>
                  <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono shrink-0 ml-1">
                    {featureB.kind === 'hole-axis' ? '◎ DELİK/EKSEN' : featureB.kind === 'slot-channel' ? '⤵ KANAL' : '⫽ YÜZEY'}
                  </span>
                </div>
              ) : (
                <div className="p-2 rounded bg-[var(--bg-0)] border border-dashed border-emerald-500/50 text-emerald-300 text-[8.5px] text-center animate-pulse flex items-center justify-center gap-1">
                  <MousePointerClick size={12} className="animate-bounce" />
                  <span>{t12(language, 'Click 2nd face or hole in 3D', '3D modelden 2. yüzeyi/deliği tıklayın')}</span>
                </div>
              )}
            </div>

            {/* Optional Manual Fallback Toggle */}
            <button
              type="button"
              onClick={() => setShowDropdowns(!showDropdowns)}
              className="w-full text-[8px] text-[var(--alu-dim)] hover:text-white flex items-center justify-center gap-1 pt-1"
            >
              <span>{showDropdowns ? t12(language, 'Hide Manual Lists', 'Listeleri Gizle') : t12(language, '▼ Manual Dropdown Lists (Optional)', '▼ Manuel Parça Listesi (Opsiyonel)')}</span>
            </button>

            {showDropdowns && (
              <div className="space-y-2 pt-1 border-t border-[var(--line)]">
                {/* Part A Select */}
                <select
                  value={activeMateDraft.partAId || ''}
                  onChange={(e) => {
                    const newId = e.target.value || null;
                    const p = parts.find((pt) => pt.id === newId);
                    const feats = p ? extractPartFeatures(p, true) : [];
                    updateMateDraft({
                      partAId: newId,
                      featureAId: feats[0]?.id || null,
                    });
                  }}
                  className="w-full bg-[var(--bg-0)] border border-[var(--line)] rounded px-1.5 py-0.5 text-[8.5px] text-white outline-none focus:border-[var(--cyan)]"
                >
                  <option value="">{t12(language, '-- Select Part A --', '-- Parça A --')}</option>
                  {parts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                {/* Part B Select */}
                <select
                  value={activeMateDraft.partBId || ''}
                  onChange={(e) => {
                    const newId = e.target.value || null;
                    const p = parts.find((pt) => pt.id === newId);
                    const feats = p ? extractPartFeatures(p, true) : [];
                    updateMateDraft({
                      partBId: newId,
                      featureBId: feats[0]?.id || null,
                    });
                  }}
                  className="w-full bg-[var(--bg-0)] border border-[var(--line)] rounded px-1.5 py-0.5 text-[8.5px] text-white outline-none focus:border-[var(--cyan)]"
                >
                  <option value="">{t12(language, '-- Select Part B --', '-- Parça B --')}</option>
                  {parts.filter((p) => p.id !== activeMateDraft.partAId).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 2. STANDARD MATES SELECTOR (STANDART İLİŞKİLER) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-[var(--alu-dim)]">
              <span>// {t12(language, 'MATE TYPE', 'İLİŞKİ TÜRÜ')}</span>
              {featureA && featureB && (
                <span className="text-[8px] text-emerald-400 lowercase font-normal">
                  ({t12(language, 'smart geometry match', 'yüzey çeşidine göre uyarlandı')})
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1">
              {mateTypes.map((mt) => {
                const Icon = mt.icon;
                const isCurrent = currentKind === mt.kind;
                const isRec = recommended === mt.kind && !!featureA && !!featureB;
                const isIncomp = incompatible.includes(mt.kind) && !!featureA && !!featureB;

                return (
                  <button
                    key={mt.kind}
                    type="button"
                    onClick={() => updateMateDraft({ kind: mt.kind })}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-[var(--radius-s)] border transition-all text-left cursor-pointer ${
                      isCurrent
                        ? 'border-[var(--cyan)] bg-[var(--cyan)]/25 text-white font-bold shadow-xs'
                        : isRec
                        ? 'border-emerald-500/70 bg-emerald-950/30 text-emerald-300 font-bold'
                        : isIncomp
                        ? 'border-[var(--line)] bg-[var(--bg-2)]/60 text-[var(--alu-dim)]/50 hover:text-[var(--alu-dim)] opacity-50'
                        : 'border-[var(--line)] bg-[var(--bg-2)] hover:border-[var(--line-strong)] text-[var(--alu-dim)] hover:text-white'
                    }`}
                    title={
                      isIncomp
                        ? t12(language, 'Not recommended for this geometry pair', 'Bu geometri çifti için uygun değil')
                        : t12(language, mt.descEn, mt.descTr)
                    }
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Icon size={13} className={isCurrent ? 'text-[var(--cyan)]' : isRec ? 'text-emerald-400' : 'text-slate-400'} />
                      <span className="text-[8.5px] truncate">{t12(language, mt.labelEn, mt.labelTr)}</span>
                    </div>
                    {isRec && (
                      <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[7px] font-black uppercase shrink-0">
                        {t12(language, 'REC', 'ÖNERİLEN')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. MATE ALIGNMENT & OFFSET CONTROLS */}
          <div className="space-y-2 p-2 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)]">
            {/* Flip / Direction Alignment */}
            <div className="flex items-center justify-between">
              <span className="text-[8.5px] font-bold text-[var(--alu-dim)] uppercase">
                {t12(language, 'Alignment:', 'Hizalama:')}
              </span>
              <div className="flex items-center gap-1 bg-[var(--bg-2)] p-0.5 rounded border border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => updateMateDraft({ flip: false })}
                  className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all ${
                    !activeMateDraft.flip
                      ? 'bg-[var(--cyan)] text-black'
                      : 'text-[var(--alu-dim)] hover:text-white'
                  }`}
                >
                  {t12(language, 'Aligned', 'Aynı')}
                </button>
                <button
                  type="button"
                  onClick={() => updateMateDraft({ flip: true })}
                  className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all ${
                    activeMateDraft.flip
                      ? 'bg-[var(--cyan)] text-[var(--accent-ink)]'
                      : 'text-[var(--alu-dim)] hover:text-white'
                  }`}
                >
                  {t12(language, 'Anti (Flip)', 'Ters')}
                </button>
              </div>
            </div>

            {/* Offset Distance (mm) */}
            <div className="flex items-center justify-between">
              <span className="text-[8.5px] font-bold text-[var(--alu-dim)] uppercase">
                {t12(language, 'Offset:', 'Mesafe:')}
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={activeMateDraft.offset}
                  onChange={(e) => updateMateDraft({ offset: parseFloat(e.target.value) || 0 })}
                  className="w-16 bg-[var(--bg-2)] border border-[var(--line)] rounded px-1.5 py-0.5 text-[9px] text-white text-right outline-none focus:border-[var(--cyan)]"
                />
                <span className="text-[8px] text-[var(--alu-dim)] font-bold">mm</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── FOOTER ACTION BUTTONS ─── */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-2)] border-t border-[var(--line)]">
        <button
          type="button"
          onClick={closeMateModal}
          className="px-2.5 py-1 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] hover:bg-[var(--bg-0)] text-slate-300 font-bold text-[8.5px] transition cursor-pointer"
        >
          {t12(language, 'Cancel (Esc)', 'İptal (Esc)')}
        </button>

        <button
          type="button"
          onClick={handleApply}
          disabled={!partA || !partB}
          className="px-3 py-1 rounded-[var(--radius-s)] bg-[var(--ok)] hover:bg-[var(--ok)] disabled:opacity-40 disabled:pointer-events-none text-black font-black text-[9px] flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95"
        >
          <Check size={12} />
          <span>{t12(language, '✔ Apply Mate', '✔ Montajı Onayla')}</span>
        </button>
      </div>
    </div>
  );
}

export default AssemblyMateModal;
