'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  X,
  Check,
  Disc,
  Layers,
  ArrowRight,
  ShieldCheck,
  Info,
  Wrench,
  Cpu,
  PlusCircle,
  HelpCircle,
  GripHorizontal,
  RotateCcw,
} from 'lucide-react';
import { useDesignStore } from './designStore';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { detectCoaxialHolePairs, executeAutoFastenerAssembly } from './assembly/fastenerDetect';
import { triggerCameraView } from './cadCameraDispatcher';
import { useDraggableDialog } from './useDraggableDialog';

export function SmartFastenersModal() {
  const { language } = useI18nStore();

  const isFastenersModalOpen = useDesignStore((s) => s.isFastenersModalOpen);
  const closeFastenersModal = useDesignStore((s) => s.closeFastenersModal);
  const parts = useDesignStore((s) => s.parts);
  const loadDemoAssemblyWithFasteners = useDesignStore((s) => s.loadDemoAssemblyWithFasteners);

  const [boltStandard, setBoltStandard] = useState<'ISO 4762' | 'ISO 4017' | 'DIN 912'>('ISO 4762');
  const [includeWashers, setIncludeWashers] = useState(true);
  const [includeNuts, setIncludeNuts] = useState(true);

  const { position, resetPosition, isDragging, elementRef, dragHandleProps } = useDraggableDialog({
    initialPosition: () => {
      if (typeof window === 'undefined') return { x: 340, y: 60 };
      const isDesktop = window.innerWidth >= 768;
      const modalWidth = Math.min(576, window.innerWidth - 32);
      return {
        x: isDesktop ? Math.max(16, (window.innerWidth - modalWidth) / 2) : 16,
        y: 60,
      };
    },
  });

  // Scan live parts for coaxial hole pairs
  const detectedPairs = useMemo(() => {
    if (!isFastenersModalOpen) return [];
    return detectCoaxialHolePairs(parts);
  }, [isFastenersModalOpen, parts]);

  if (!isFastenersModalOpen) return null;

  const handleAssemble = () => {
    const res = executeAutoFastenerAssembly();
    if (res.detected > 0) {
      setTimeout(() => triggerCameraView('fit'), 200);
      closeFastenersModal();
    }
  };

  const handleLoadDemo = () => {
    loadDemoAssemblyWithFasteners();
    setTimeout(() => triggerCameraView('fit'), 250);
    closeFastenersModal();
  };

  return (
    <>
      {/* Light Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 select-none"
        onClick={closeFastenersModal}
      />

      <div
        ref={elementRef}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        className={`fixed z-50 w-full max-w-xl rounded-[var(--radius-m)] border border-amber-500/50 bg-[var(--bg-1)] shadow-2xl flex flex-col overflow-hidden text-[11px] font-mono select-none transition-shadow ${
          isDragging ? 'ring-2 ring-amber-400 shadow-[0_25px_70px_rgba(245,158,11,0.4)]' : ''
        }`}
      >
        {/* ─── HEADER ─── */}
        <div
          {...dragHandleProps}
          onDoubleClick={resetPosition}
          title={t12(language, 'Drag to Move · Double Click to Reset', 'Sürükleyip Taşı · Sıfırlamak İçin Çift Tıkla')}
          className="group flex items-center justify-between px-3 py-2 bg-amber-500/10 border-b border-amber-500/30 cursor-grab active:cursor-grabbing hover:bg-amber-500/15 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0">
              <Sparkles size={15} />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-white text-xs flex items-center gap-1.5 truncate">
                <span className="truncate">{t12(language, 'SolidWorks Smart Fasteners & Toolbox', 'SolidWorks Akıllı Bağlantı Elemanı')}</span>
                <span className="px-1 py-0.2 rounded bg-amber-400 text-black text-[7.5px] font-black uppercase shrink-0">
                  TOOLBOX
                </span>
              </div>
              <div className="text-[9px] text-[var(--alu-dim)] flex items-center gap-1">
                <GripHorizontal size={11} className="text-amber-500/60 group-hover:text-amber-400 shrink-0" />
                <span className="truncate">{t12(language, 'Drag to reposition', 'Taşımak için sürükleyin')}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={resetPosition}
              className="p-1 text-slate-400 hover:text-amber-400 hover:bg-white/10 rounded transition-colors"
              title={t12(language, 'Reset Position', 'Konumu Sıfırla')}
            >
              <RotateCcw size={12} />
            </button>
            <button
              type="button"
              onClick={closeFastenersModal}
              className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ─── BODY ─── */}
        <div className="p-3.5 space-y-3.5 max-h-[75vh] overflow-y-auto">
          {/* 1. DETECTION STATUS CARD */}
          <div className="p-3 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-white">
                <Cpu size={13} className="text-amber-400" />
                <span>// {t12(language, 'TOPOLOGICAL HOLE SCAN RESULT', 'TOPOLOJİK DELİK TARAMA SONUCU')}</span>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                  detectedPairs.length > 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {detectedPairs.length > 0
                  ? t12(language, `${detectedPairs.length} Coaxial Pair(s) Found`, `${detectedPairs.length} Eşmerkezli Delik Bulundu`)
                  : t12(language, 'No Coaxial Stacks Found', 'Eşmerkezli Delik Çifti Bulunamadı')}
              </span>
            </div>

            {detectedPairs.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {detectedPairs.map((pair, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[9.5px] font-bold text-white truncate flex items-center gap-1">
                        <span className="text-amber-400 font-mono">#{idx + 1}</span>
                        <span>{pair.partA.name}</span>
                        <ArrowRight size={10} className="text-slate-500 shrink-0" />
                        <span>{pair.partB.name}</span>
                      </div>
                      <div className="text-[8.5px] text-[var(--alu-dim)] flex items-center gap-2 mt-0.5">
                        <span>
                          {t12(language, 'Size:', 'Nominal:')} <strong className="text-[var(--cyan)]">M{pair.nominalMetricSize}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          {t12(language, 'Length:', 'Önerilen Boy:')} <strong className="text-white">{pair.recommendedLength}mm</strong>
                        </span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">
                          {boltStandard} + ISO 4032
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-400/40 text-cyan-300 text-[8px] font-bold">
                        ◎ Concentric + ⫽ Coincident
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded bg-[var(--bg-2)]/60 border border-dashed border-[var(--line)] space-y-2">
                <div className="flex items-start gap-2 text-[9px] text-[var(--alu-dim)] leading-relaxed">
                  <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    {t12(
                      language,
                      'SolidWorks Smart Fasteners traverses adjacent parts searching for coaxial cylindrical hole axes (clearance/tapped holes spanning 2 or more bodies). To see it immediately in action, click below to load a ready-made assembly with matching hole plates.',
                      'SolidWorks Akıllı Bağlantı Elemanı motoru, bitişik parçalar arasında ortak eksenli silindirik delikleri (2 veya daha fazla parça boyunca uzanan delik çiftleri) arar. Hemen canlı denemek için aşağıdaki hazır montaj butonuna tıklayabilirsiniz.'
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLoadDemo}
                  className="w-full py-2 px-3 rounded-[var(--radius-s)] bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold text-[9.5px] flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-xs"
                >
                  <Sparkles size={12} className="text-amber-400" />
                  <span>
                    {t12(
                      language,
                      '✨ Load Demo Assembly & Auto-Mount Bolts (2 Mated Plates + M6 Fasteners)',
                      '✨ Hazır Montaj Setini Yükle ve Cıvataları Tak (2 Delikli Plaka + M6 Cıvatalar)'
                    )}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* 2. SOLIDWORKS TOOLBOX HARDWARE CONFIGURATION */}
          <div className="space-y-2 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] p-2.5">
            <div className="text-[9.5px] font-bold uppercase tracking-wider text-[var(--alu-dim)] flex items-center gap-1.5">
              <Wrench size={11} className="text-[var(--cyan)]" />
              <span>// {t12(language, 'FASTENER SPECIFICATION (ISO / DIN)', 'BAĞLANTI ELEMANI STANDARDI')}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Bolt Head Standard */}
              <div className="space-y-1">
                <label className="text-[8.5px] text-[var(--alu-dim)] font-bold">
                  {t12(language, 'Bolt Standard:', 'Cıvata Türü:')}
                </label>
                <select
                  value={boltStandard}
                  onChange={(e) => setBoltStandard(e.target.value as any)}
                  className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-2 py-1 text-[9px] text-white outline-none focus:border-amber-400"
                >
                  <option value="ISO 4762">ISO 4762 (Hex Socket / İmbus)</option>
                  <option value="ISO 4017">ISO 4017 (Hex Head / Altıköşe)</option>
                  <option value="DIN 912">DIN 912 (Cylinder Head / Silindirik)</option>
                </select>
              </div>

              {/* Washers Toggle */}
              <div className="space-y-1">
                <label className="text-[8.5px] text-[var(--alu-dim)] font-bold">
                  {t12(language, 'Washers (Pull-Through):', 'Rondela (Yıpranma Önleyici):')}
                </label>
                <label className="flex items-center gap-2 p-1 bg-[var(--bg-2)] border border-[var(--line)] rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeWashers}
                    onChange={(e) => setIncludeWashers(e.target.checked)}
                    className="accent-[var(--cyan)]"
                  />
                  <span className="text-[8.5px] text-white font-bold">
                    ISO 7089 {t12(language, 'Flat Washer', 'Düz Rondela')}
                  </span>
                </label>
              </div>

              {/* Nut Standard */}
              <div className="space-y-1">
                <label className="text-[8.5px] text-[var(--alu-dim)] font-bold">
                  {t12(language, 'Nut Standard:', 'Somun Standardı:')}
                </label>
                <label className="flex items-center gap-2 p-1 bg-[var(--bg-2)] border border-[var(--line)] rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeNuts}
                    onChange={(e) => setIncludeNuts(e.target.checked)}
                    className="accent-[var(--cyan)]"
                  />
                  <span className="text-[8.5px] text-white font-bold">
                    ISO 4032 {t12(language, 'Hex Nut', 'Altıköşe Somun')}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ─── FOOTER ─── */}
        <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-2)] border-t border-[var(--line)]">
          <div className="flex items-center gap-1.5 text-[8.5px] text-[var(--alu-dim)]">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span>
              {t12(
                language,
                'Compliant with VDI 2230 & ISO 898-1 bolted joint engineering norms',
                'VDI 2230 ve ISO 898-1 cıvatalı bağlantı mühendislik standartlarına tam uyumlu'
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeFastenersModal}
              className="px-3 py-1 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] hover:bg-[var(--bg-0)] text-slate-300 font-bold text-[9px] transition cursor-pointer"
            >
              {t12(language, 'Close', 'Kapat')}
            </button>
            <button
              type="button"
              onClick={handleAssemble}
              disabled={detectedPairs.length === 0}
              className="px-3.5 py-1 rounded-[var(--radius-s)] bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black text-[9.5px] flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95"
            >
              <Sparkles size={12} />
              <span>
                {t12(
                  language,
                  `⚡ Auto-Assemble (${detectedPairs.length})`,
                  `⚡ Otomatik Montajla (${detectedPairs.length})`
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default SmartFastenersModal;
