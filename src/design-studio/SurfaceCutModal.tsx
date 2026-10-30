'use client';

/**
 * 🔲 SURFACE POCKET & CNC CUT GENERATOR MODAL
 * Performs parametric Pocketing, Milling Slots, and Through-Cuts on 3D Solids.
 */

import React, { useState, useMemo } from 'react';
import {
  X, Scissors, Check, Copy, Download, Box, Disc, Layers, Zap, Sliders,
  GripHorizontal, RotateCcw
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { useDesignStore, type DesignPart } from './designStore';
import { getSurfaceCutStrings } from '@/locales/designStudioTranslations';
import { useDraggableDialog } from './useDraggableDialog';

interface SurfaceCutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPart: DesignPart | null;
}

export function SurfaceCutModal({ isOpen, onClose, selectedPart }: SurfaceCutModalProps) {
  const { language } = useI18nStore();
  const tCut = getSurfaceCutStrings(language);

  const [cutType, setCutType] = useState<'rect' | 'circle' | 'slot' | 'chamfer'>('rect');
  const [isThroughAll, setIsThroughAll] = useState<boolean>(false);
  const [cutDepth, setCutDepth] = useState<number>(10); // mm

  // Rect Pocket parameters
  const [cutWidth, setCutWidth] = useState<number>(30); // mm
  const [cutLength, setCutLength] = useState<number>(40); // mm
  const [cornerRadius, setCornerRadius] = useState<number>(4); // mm

  // Circular Pocket parameters
  const [cutDiameter, setCutDiameter] = useState<number>(25); // mm

  // Slot parameters
  const [slotLength, setSlotLength] = useState<number>(50); // mm
  const [slotWidth, setSlotWidth] = useState<number>(12); // mm

  // Position offsets on the selected face
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [cutAngle, setCutAngle] = useState<number>(0);

  const [copiedGcode, setCopiedGcode] = useState<boolean>(false);

  // Volume of removed material
  const removedVolumeMm3 = useMemo(() => {
    const depth = isThroughAll ? (selectedPart?.params?.height || 30) : cutDepth;
    if (cutType === 'rect') {
      return cutWidth * cutLength * depth;
    } else if (cutType === 'circle') {
      const r = cutDiameter / 2;
      return Math.PI * r * r * depth;
    } else if (cutType === 'slot') {
      const r = slotWidth / 2;
      const straightL = Math.max(0, slotLength - slotWidth);
      const area = straightL * slotWidth + Math.PI * r * r;
      return area * depth;
    }
    return 0;
  }, [cutType, isThroughAll, cutDepth, cutWidth, cutLength, cutDiameter, slotLength, slotWidth, selectedPart]);

  // Generate 2.5D Pocket CNC G-Code
  const generatePocketGcode = () => {
    const depth = isThroughAll ? (selectedPart?.params?.height || 30) : cutDepth;
    const lines = [
      '%',
      'O2002 (ALUCAD OS - 2.5D SURFACE POCKET CUT)',
      'G21 G90 G17 G40 G80 G49',
      'T02 M06 (END MILL DIA 8.0MM)',
      'S4500 M03',
      'G00 G54 X' + offsetX.toFixed(3) + ' Y' + offsetY.toFixed(3),
      'G43 H02 Z5.0 M08',
      '(ROUGHING POCKET CYCLE)',
      'G01 Z-' + depth.toFixed(3) + ' F350.',
    ];

    if (cutType === 'rect') {
      const halfW = cutWidth / 2;
      const halfL = cutLength / 2;
      lines.push(
        `G01 X${(offsetX - halfW).toFixed(3)} Y${(offsetY - halfL).toFixed(3)} F800.`,
        `G01 X${(offsetX + halfW).toFixed(3)}`,
        `G01 Y${(offsetY + halfL).toFixed(3)}`,
        `G01 X${(offsetX - halfW).toFixed(3)}`,
        `G01 Y${(offsetY - halfL).toFixed(3)}`
      );
    } else if (cutType === 'circle') {
      const r = cutDiameter / 2;
      lines.push(
        `G01 X${(offsetX - r).toFixed(3)} F600.`,
        `G02 X${(offsetX - r).toFixed(3)} Y${offsetY.toFixed(3)} I${r.toFixed(3)} J0. F800.`
      );
    }

    lines.push('G00 Z25. M09', 'M05', 'G28 G91 Z0.', 'M30', '%');
    return lines.join('\n');
  };

  const handleApplyCut = () => {
    if (!selectedPart) return;
    const store = useDesignStore.getState();
    const targetFace = store.activeFace || 'top';
    const resolvedDepth = isThroughAll ? (selectedPart.params?.height || 40) : cutDepth;
    const resolvedWidth = cutType === 'circle' ? cutDiameter : cutType === 'rect' ? cutWidth : slotWidth;
    const resolvedLength = cutType === 'circle' ? cutDiameter : cutType === 'rect' ? cutLength : slotLength;

    // 1. Add to part.cuts[] so multiple pockets/slots/chamfers are rendered & editable in Right Inspector
    store.addCut(selectedPart.id, {
      type: cutType,
      face: targetFace,
      width: resolvedWidth,
      length: resolvedLength,
      depth: resolvedDepth,
      x: offsetX,
      y: offsetY,
    });

    // 2. Also maintain legacy params compatibility for geometryFactory boolean subtraction
    const nextParams = {
      ...selectedPart.params,
      hasSurfaceCut: true,
      cutType,
      cutFace: targetFace,
      cutWidth: resolvedWidth,
      cutLength: resolvedLength,
      cutDiameter: cutType === 'circle' ? cutDiameter : 0,
      cutDepth: resolvedDepth,
      cutOffsetX: offsetX,
      cutOffsetY: offsetY,
      cutAngle,
    };

    store.updatePart(selectedPart.id, { params: nextParams });
    onClose();
  };

  const { position, resetPosition, isDragging, elementRef, dragHandleProps } = useDraggableDialog({
    initialPosition: () => {
      if (typeof window === 'undefined') return { x: 300, y: 50 };
      const isDesktop = window.innerWidth >= 768;
      const modalWidth = Math.min(512, window.innerWidth - 32);
      return {
        x: isDesktop ? Math.max(16, (window.innerWidth - modalWidth) / 2) : 16,
        y: 40,
      };
    },
  });

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 select-none"
        onClick={onClose}
      />

      <div
        ref={elementRef}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        className={`fixed z-50 w-full max-w-lg rounded-3xl bg-[var(--bg-1)] border border-cyan-500/30 p-5 sm:p-6 flex flex-col max-h-[92vh] overflow-y-auto custom-scrollbar font-mono text-xs text-slate-200 space-y-4 select-none transition-shadow ${
          isDragging ? 'ring-2 ring-cyan-400 shadow-[0_25px_70px_rgba(0,229,255,0.4)]' : ''
        }`}
      >
        {/* ─── HEADER ─── */}
        <div
          {...dragHandleProps}
          onDoubleClick={resetPosition}
          title={tCut.title + ' (Sürükleyip Taşı · Sıfırlamak İçin Çift Tıkla)'}
          className="group flex items-start justify-between border-b border-white/10 pb-3 cursor-grab active:cursor-grabbing hover:bg-white/5 -mx-2 -mt-2 p-2 rounded-t-2xl transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)] shrink-0">
              <Scissors size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-white truncate">
                {tCut.title}
              </h2>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <GripHorizontal size={11} className="text-cyan-500/60 group-hover:text-cyan-400 shrink-0" />
                <span className="truncate">{selectedPart ? `${selectedPart.name} (${selectedPart.kind})` : tCut.noPart}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={resetPosition}
              className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-white/10 transition-colors"
              title="Konumu Sıfırla"
            >
              <RotateCcw size={14} />
            </button>
            <button type="button" onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─── CUT SHAPE TYPE ─── */}
        <div className="flex gap-1.5">
          {[
            { id: 'rect' as const, label: tCut.rect },
            { id: 'circle' as const, label: tCut.circle },
            { id: 'slot' as const, label: tCut.slot },
            { id: 'chamfer' as const, label: t12(language, 'Edge Chamfer', 'Kenar Pahı') },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCutType(item.id)}
              className={`flex-1 py-2 rounded-xl font-bold text-[10px] transition-all cursor-pointer ${
                cutType === item.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* ─── DIMENSIONS INPUTS ─── */}
        <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3">
          <span className="font-bold text-cyan-400 block text-[11px]">{tCut.pocketGeometry}</span>

          {cutType === 'rect' && (
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">{tCut.width}</label>
                <input type="number" value={cutWidth} onChange={(e) => setCutWidth(Number(e.target.value))} className="w-full p-2 rounded-xl bg-black/80 border border-white/10 text-white font-bold text-center" />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">{tCut.length}</label>
                <input type="number" value={cutLength} onChange={(e) => setCutLength(Number(e.target.value))} className="w-full p-2 rounded-xl bg-black/80 border border-white/10 text-white font-bold text-center" />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">{tCut.radius}</label>
                <input type="number" value={cornerRadius} onChange={(e) => setCornerRadius(Number(e.target.value))} className="w-full p-2 rounded-xl bg-black/80 border border-white/10 text-white font-bold text-center" />
              </div>
            </div>
          )}

          {cutType === 'circle' && (
            <div>
              <label className="text-[9px] text-slate-400 block mb-1">Havuz Çapı Ø (mm)</label>
              <input type="number" value={cutDiameter} onChange={(e) => setCutDiameter(Number(e.target.value))} className="w-full p-2 rounded-xl bg-black/80 border border-cyan-500/30 text-cyan-300 font-bold text-center" />
            </div>
          )}

          {cutType === 'slot' && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">Kanal Boyu (mm)</label>
                <input type="number" value={slotLength} onChange={(e) => setSlotLength(Number(e.target.value))} className="w-full p-2 rounded-xl bg-black/80 border border-white/10 text-white font-bold text-center" />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">Kanal Genişliği (mm)</label>
                <input type="number" value={slotWidth} onChange={(e) => setSlotWidth(Number(e.target.value))} className="w-full p-2 rounded-xl bg-black/80 border border-white/10 text-white font-bold text-center" />
              </div>
            </div>
          )}

          {/* Depth Options */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={isThroughAll}
                onChange={(e) => setIsThroughAll(e.target.checked)}
                className="rounded accent-[var(--cyan)]"
              />
              <span className="font-bold">{t12(language, 'Through-All Cut', 'Boydan Boya Del / Kes (Through All)')}</span>
            </label>

            {!isThroughAll && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">{t12(language, 'Depth (mm):', 'Derinlik (mm):')}</span>
                <input
                  type="number"
                  value={cutDepth}
                  onChange={(e) => setCutDepth(Number(e.target.value))}
                  className="w-20 p-1.5 rounded-lg bg-black/80 border border-cyan-500/40 text-cyan-300 font-bold text-center"
                />
              </div>
            )}
          </div>
        </div>

        {/* ─── POSITION OFFSETS ON FACE ─── */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
          <span className="font-bold text-amber-400 block text-[11px]">{t12(language, 'Face Position Offset:', 'Yüzey Konumlandırma (Offset):')}</span>
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="text-[9px] text-slate-400 block mb-1">X Ofset (mm)</label>
              <input type="number" value={offsetX} onChange={(e) => setOffsetX(Number(e.target.value))} className="w-full p-2 rounded-xl bg-black/80 border border-white/10 text-white font-bold text-center" />
            </div>
            <div>
              <label className="text-[9px] text-slate-400 block mb-1">Y Ofset (mm)</label>
              <input type="number" value={offsetY} onChange={(e) => setOffsetY(Number(e.target.value))} className="w-full p-2 rounded-xl bg-black/80 border border-white/10 text-white font-bold text-center" />
            </div>
            <div>
              <label className="text-[9px] text-slate-400 block mb-1">Dönme Açısı θ (°)</label>
              <input type="number" value={cutAngle} onChange={(e) => setCutAngle(Number(e.target.value))} className="w-full p-2 rounded-xl bg-black/80 border border-white/10 text-white font-bold text-center" />
            </div>
          </div>
        </div>

        {/* ─── REMOVED VOLUME SUMMARY ─── */}
        <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex items-center justify-between text-slate-300">
          <span>{t12(language, 'Removed Volume:', 'Talaş / Boşaltılan Hacim:')}</span>
          <span className="text-cyan-300 font-bold">{(removedVolumeMm3 / 1000).toFixed(2)} cm³</span>
        </div>

        {/* ─── ACTIONS ─── */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(generatePocketGcode());
              setCopiedGcode(true);
              setTimeout(() => setCopiedGcode(false), 2000);
            }}
            className="flex-1 py-3 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold hover:bg-cyan-900/60 transition-all flex items-center justify-center gap-1.5"
          >
            {copiedGcode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copiedGcode ? 'G-Code Kopyalandı!' : '📋 Copy CNC Pocket G-Code'}</span>
          </button>

          <button
            type="button"
            onClick={handleApplyCut}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg "
          >
            <Scissors size={16} />
            <span>✂️ {tCut.applyCut}</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default SurfaceCutModal;
