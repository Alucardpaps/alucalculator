'use client';

/**
 * 🔲 SURFACE POCKET & CNC CUT GENERATOR MODAL
 * Performs parametric Pocketing, Milling Slots, and Through-Cuts on 3D Solids.
 */

import React, { useState, useMemo } from 'react';
import {
  X, Scissors, Check, Copy, Download, Box, Disc, Layers, Zap, Sliders
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { useDesignStore, type DesignPart } from './designStore';
import { getSurfaceCutStrings } from '@/locales/designStudioTranslations';

interface SurfaceCutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPart: DesignPart | null;
}

export function SurfaceCutModal({ isOpen, onClose, selectedPart }: SurfaceCutModalProps) {
  const { language } = useI18nStore();
  const tr = language === 'tr';
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
      'O2002 (ALUCALC OS - 2.5D SURFACE POCKET CUT)',
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

    // Attach cut parameters or sub-pocket to the selected part
    const nextParams = {
      ...selectedPart.params,
      hasSurfaceCut: true,
      cutType,
      cutWidth: cutType === 'rect' ? cutWidth : slotWidth,
      cutLength: cutType === 'rect' ? cutLength : slotLength,
      cutDiameter: cutType === 'circle' ? cutDiameter : 0,
      cutDepth: isThroughAll ? (selectedPart.params?.height || 40) : cutDepth,
      cutOffsetX: offsetX,
      cutOffsetY: offsetY,
      cutAngle,
    };

    store.updatePart(selectedPart.id, { params: nextParams });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#090d16] border border-cyan-500/30 p-5 sm:p-6 shadow-[0_0_50px_rgba(0,229,255,0.15)] flex flex-col max-h-[92vh] overflow-y-auto custom-scrollbar font-mono text-xs text-slate-200 space-y-4">
        {/* ─── HEADER ─── */}
        <div className="flex items-start justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Scissors size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">
                {tCut.title}
              </h2>
              <p className="text-[10px] text-slate-400">
                {selectedPart ? `${selectedPart.name} (${selectedPart.kind})` : tCut.noPart}
              </p>
            </div>
          </div>

          <button type="button" onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* ─── CUT SHAPE TYPE ─── */}
        <div className="flex gap-1.5">
          {[
            { id: 'rect' as const, label: tCut.rect },
            { id: 'circle' as const, label: tCut.circle },
            { id: 'slot' as const, label: tCut.slot },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCutType(item.id)}
              className={`flex-1 py-2 rounded-xl font-bold text-[10px] transition-all ${
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
                className="rounded accent-cyan-400"
              />
              <span className="font-bold">{tr ? 'Boydan Boya Del / Kes (Through All)' : 'Through-All Cut'}</span>
            </label>

            {!isThroughAll && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">{tr ? 'Derinlik (mm):' : 'Depth (mm):'}</span>
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
          <span className="font-bold text-amber-400 block text-[11px]">{tr ? 'Yüzey Konumlandırma (Offset):' : 'Face Position Offset:'}</span>
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
          <span>{tr ? 'Talaş / Boşaltılan Hacim:' : 'Removed Volume:'}</span>
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
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <Scissors size={16} />
            <span>✂️ {tCut.applyCut}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SurfaceCutModal;
