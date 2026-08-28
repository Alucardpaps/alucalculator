'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MousePointer2, Minus, Square, Circle, Hexagon, Spline,
  Move, Copy, RotateCw, Ruler, Undo2, Redo2, Download,
  Upload, Sparkles, HelpCircle, Magnet, Trash2, Box, X
} from 'lucide-react';
import { useCadStore } from '../store/cadStore';
import { useDesignStore } from '@/design-studio/designStore';
import { useI18nStore } from '@/store/i18nStore';
import { generateDXF } from '../dxf/DxfGenerator';

const CadCanvas = dynamic(() => import('./CadCanvas').then((m) => m.CadCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#070b10] text-[11px] font-mono text-white/35">
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        <span>Loading 2D Engine…</span>
      </div>
    </div>
  ),
});

type Props = {
  onTransferTo3D?: () => void;
};

export function Mobile2DCad({ onTransferTo3D }: Props) {
  const { language } = useI18nStore();
  const tr = language === 'tr';

  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const entities = useCadStore((s) => s.entities);
  const activeCommand = useCadStore((s) => s.activeCommand);
  const setActiveCommand = useCadStore((s) => s.setActiveCommand);
  const snapEnabled = useCadStore((s) => s.snapEnabled);
  const toggleSnap = useCadStore((s) => s.toggleSnap);
  const undo = useCadStore((s) => s.undo);
  const redo = useCadStore((s) => s.redo);
  const selectedIds = useCadStore((s) => s.selectedIds);
  const deleteSelected = useCadStore((s) => s.deleteSelected);
  const layers = useCadStore((s) => s.layers);
  const addPart = useDesignStore((s) => s.addPart);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleExportDXF = () => {
    if (entities.length === 0) {
      showToast(tr ? 'Çizim alanı boş' : 'Canvas empty');
      return;
    }
    const dxfString = generateDXF(entities, layers);
    const blob = new Blob([dxfString], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alucalc-mobile-sketch.dxf';
    a.click();
    URL.revokeObjectURL(url);
    showToast(tr ? 'DXF İndirildi' : 'DXF Downloaded');
  };

  const handleTransferTo3D = () => {
    addPart('plate');
    showToast(tr ? "3D'ye aktarıldı (Plaka eklendi)" : 'Transferred to 3D (Plate added)');
    if (onTransferTo3D) {
      onTransferTo3D();
    }
  };

  const TOOLS = [
    { id: 'SELECT', label: tr ? 'Seç' : 'Select', icon: MousePointer2, cmd: null },
    { id: 'LINE', label: tr ? 'Çizgi' : 'Line', icon: Minus, cmd: 'line' },
    { id: 'RECT', label: tr ? 'Dikdört.' : 'Rect', icon: Square, cmd: 'rect' },
    { id: 'CIRCLE', label: tr ? 'Daire' : 'Circle', icon: Circle, cmd: 'circle' },
    { id: 'HEX', label: tr ? 'Altıgen' : 'Hex', icon: Hexagon, cmd: 'polygon' },
    { id: 'PLINE', label: tr ? 'P-Çizgi' : 'PLine', icon: Spline, cmd: 'polyline' },
    { id: 'MOVE', label: tr ? 'Taşı' : 'Move', icon: Move, cmd: 'move' },
    { id: 'COPY', label: tr ? 'Kopyala' : 'Copy', icon: Copy, cmd: 'copy' },
    { id: 'ROTATE', label: tr ? 'Döndür' : 'Rotate', icon: RotateCw, cmd: 'rotate' },
    { id: 'DIM', label: tr ? 'Ölçü' : 'Dim', icon: Ruler, cmd: 'dimension' },
  ];

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#070a0e] select-none font-mono">
      {/* ─── Top 2D Mobile Toolbar ─── */}
      <div className="flex-none flex items-center justify-between gap-1 px-2.5 py-2 border-b border-white/10 bg-[#0a0d16] z-20 shadow-md">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400"
          >
            <HelpCircle size={15} />
          </button>
          <div className="text-[11px] font-bold text-white truncate">
            {tr ? `2D Eskiz · ${entities.length} nesne` : `2D Sketch · ${entities.length} ent`}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleSnap}
            className={`px-2 py-1 rounded-xl text-[10px] font-black uppercase border transition-all ${
              snapEnabled
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            SNAP
          </button>

          <button
            type="button"
            onClick={() => { undo(); showToast(tr ? 'Geri alındı' : 'Undo'); }}
            className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300"
          >
            <Undo2 size={15} />
          </button>

          <button
            type="button"
            onClick={() => { redo(); showToast(tr ? 'İleri alındı' : 'Redo'); }}
            className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300"
          >
            <Redo2 size={15} />
          </button>

          <button
            type="button"
            onClick={handleExportDXF}
            className="px-2 py-1 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[10px] font-bold"
          >
            DXF
          </button>

          <button
            type="button"
            onClick={handleTransferTo3D}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-[10px] font-black uppercase shadow-md shadow-cyan-500/20 active:scale-95"
          >
            <Box size={12} />
            <span>{tr ? "3D'YE AKTAR" : 'TO 3D'}</span>
          </button>
        </div>
      </div>

      {/* ─── 2D Interactive Canvas ─── */}
      <div className="relative flex-1 min-h-0 w-full">
        <CadCanvas />

        {/* Empty Canvas Starter Helper */}
        {entities.length === 0 && (
          <div className="absolute inset-x-4 top-4 z-10 pointer-events-none flex justify-center">
            <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-slate-950/85 p-3.5 shadow-xl backdrop-blur-xl pointer-events-auto text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-cyan-400">
                  {tr ? '2D Çizim Kılavuzu' : '2D Quick Start'}
                </span>
                <span className="text-[9px] text-slate-500">Touch CAD</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                {tr
                  ? '1. Çizgi veya Daire seçin · 2. Ekrana dokunarak çizin · 3. "3D\'ye Aktar" ile katı modele dönüştürün.'
                  : '1. Pick Line or Circle · 2. Tap to draw · 3. Convert to solid via "TO 3D".'}
              </p>
              <button
                type="button"
                onClick={() => setActiveCommand('line')}
                className="w-full py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-[10px] uppercase tracking-wider active:scale-95"
              >
                {tr ? '✏️ ÇİZGİ İLE BAŞLA' : '✏️ START WITH LINE'}
              </button>
            </div>
          </div>
        )}

        {/* Delete Selection Floating Button */}
        {selectedIds.length > 0 && (
          <div className="absolute right-3 bottom-3 z-20">
            <button
              type="button"
              onClick={() => { deleteSelected(); showToast(tr ? 'Silindi' : 'Deleted'); }}
              className="w-12 h-12 rounded-2xl bg-rose-950/90 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg active:scale-90"
            >
              <Trash2 size={20} />
            </button>
          </div>
        )}

        {/* Live Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-3 left-3 z-30 rounded-xl border border-cyan-500/40 bg-slate-950/90 px-3 py-1.5 font-mono text-[11px] text-cyan-300 shadow-xl backdrop-blur-xl"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Bottom 2D Tool Dock (Scrollable) ─── */}
      <div className="flex-none z-20 border-t border-white/10 bg-[#0a0d16] p-1 shadow-2xl">
        <div className="flex items-stretch gap-1 overflow-x-auto no-scrollbar py-0.5">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const isActive = t.cmd ? activeCommand === t.cmd : activeCommand === null;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveCommand(t.cmd);
                  showToast(t.label);
                }}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] h-12 rounded-xl shrink-0 transition-all active:scale-95 ${
                  isActive
                    ? 'bg-blue-600/25 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white bg-white/[0.02]'
                }`}
              >
                <Icon size={16} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
                <span className="text-[8px] font-black uppercase tracking-tighter truncate max-w-full">
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {helpOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHelpOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-white/15 bg-[#0b0f19] p-5 shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-sm font-black text-white">{tr ? '2D CAD Kullanımı' : '2D CAD Instructions'}</h3>
                <button type="button" onClick={() => setHelpOpen(false)} className="text-slate-400">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-2 text-xs text-slate-300 leading-relaxed font-mono">
                <p>• {tr ? 'Alt bardaki araçlardan birini seçin (Çizgi, Daire vb.).' : 'Select a tool from the dock (Line, Circle, etc.).'}</p>
                <p>• {tr ? 'Ekrana dokunarak başlangıç ve bitiş noktalarını belirleyin.' : 'Tap on the canvas to set start and end points.'}</p>
                <p>• {tr ? 'DXF butonu ile AutoCAD uyumlu teknik çizim dosyanızı indirin.' : 'Use the DXF button to export an AutoCAD-compatible drawing.'}</p>
                <p>• {tr ? '"3D\'ye Aktar" butonuna basarak çizimi anında 3D katıya dönüştürün.' : 'Click "TO 3D" to convert your profile into a 3D solid model.'}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Mobile2DCad;
