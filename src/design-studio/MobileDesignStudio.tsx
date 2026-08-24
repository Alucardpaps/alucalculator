'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Cylinder, Layers, MousePointer2, Move, RotateCcw, RotateCw,
  SlidersHorizontal, Plus, Download, Grid3X3, Undo2, Redo2,
  Trash2, Copy, Sparkles, Pencil, X, HelpCircle, Eye, EyeOff,
  Wrench, Check, Disc, Cuboid
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import {
  useDesignStore,
  kindLabel,
  PART_COLORS,
  type DesignKind,
  type DesignTool,
  type DesignPart
} from './designStore';
import { exportPartsToSTL, downloadFile } from './exporter';

const DesignViewport = dynamic(() => import('./DesignViewport').then((m) => m.DesignViewport), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#070b10] text-[11px] font-mono text-white/35">
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        <span>Loading 3D Viewport…</span>
      </div>
    </div>
  ),
});

const PRIMITIVES: DesignKind[] = [
  'box', 'cylinder', 'tube', 'cone', 'sphere', 'torus', 'pyramid', 'wedge', 'plate', 'hex-prism', 'trapezoid',
  'L-bracket', 'U-channel', 'I-beam', 'T-beam', 'cross-prism',
  'gear-blank', 'pulley', 'washer', 'hex-bolt', 'hex-nut', 'bearing-race', 'keyway-shaft', 'd-shaft', 'slot-plate', 'star-prism'
];

export function MobileDesignStudio() {
  const { language } = useI18nStore();
  const tr = language === 'tr';

  const [sheetMode, setSheetMode] = useState<'none' | 'shapes' | 'edit' | 'parts' | 'export' | 'help' | 'settings'>('none');
  const [exportFormat, setExportFormat] = useState('stl-binary');
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dismissWelcome, setDismissWelcome] = useState(false);

  const parts = useDesignStore((s) => s.parts);
  const selectedId = useDesignStore((s) => s.selectedId);
  const tool = useDesignStore((s) => s.tool);
  const showGrid = useDesignStore((s) => s.showGrid);
  const select = useDesignStore((s) => s.select);
  const setTool = useDesignStore((s) => s.setTool);
  const addPart = useDesignStore((s) => s.addPart);
  const deleteSelected = useDesignStore((s) => s.deleteSelected);
  const duplicateSelected = useDesignStore((s) => s.duplicateSelected);
  const toggleVisible = useDesignStore((s) => s.toggleVisible);
  const setShowGrid = useDesignStore((s) => s.setShowGrid);
  const updateSelectedParams = useDesignStore((s) => s.updateSelectedParams);
  const updateSelectedTransform = useDesignStore((s) => s.updateSelectedTransform);
  const setSelectedColor = useDesignStore((s) => s.setSelectedColor);
  const setSelectedName = useDesignStore((s) => s.setSelectedName);
  const clearScene = useDesignStore((s) => s.clearScene);
  const undo = useDesignStore((s) => s.undo);
  const redo = useDesignStore((s) => s.redo);

  // Sketch selectors & actions
  const sketchPoints = useDesignStore((s) => s.sketchPoints);
  const sketchClosed = useDesignStore((s) => s.sketchClosed);
  const extrudeDepth = useDesignStore((s) => s.extrudeDepth);
  const pendingOp = useDesignStore((s) => s.pendingOp);
  const startSketchAdd = useDesignStore((s) => s.startSketchAdd);
  const closeSketch = useDesignStore((s) => s.closeSketch);
  const clearSketch = useDesignStore((s) => s.clearSketch);
  const undoSketchPoint = useDesignStore((s) => s.undoSketchPoint);
  const commitExtrude = useDesignStore((s) => s.commitExtrude);

  const selected = parts.find((p) => p.id === selectedId) || null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleAddShape = (kind: DesignKind) => {
    addPart(kind);
    setSheetMode('none');
    setDismissWelcome(true);
    showToast(tr ? `+ ${kindLabel(kind, true)} eklendi` : `+ Added ${kindLabel(kind, false)}`);
  };

  const handleExport = async () => {
    if (!parts.some((p) => p.visible)) {
      showToast(tr ? 'Sahne boş!' : 'Scene empty!');
      return;
    }
    setIsExporting(true);
    try {
      const buffer = exportPartsToSTL(parts);
      downloadFile(buffer, 'alucalc-mobile-model.stl', 'application/sla');
      showToast(tr ? 'STL İndirildi' : 'STL Downloaded');
      setSheetMode('none');
    } catch {
      showToast(tr ? 'Dışa aktarma hatası' : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const BOTTOM_DOCK_TOOLS = [
    { id: 'select', label: tr ? 'Seç' : 'Select', icon: MousePointer2, active: tool === 'select' && sheetMode === 'none', onClick: () => { setTool('select'); setSheetMode('none'); } },
    { id: 'move', label: tr ? 'Taşı' : 'Move', icon: Move, active: tool === 'move', onClick: () => { if (!selectedId) showToast(tr ? 'Önce parça seçin' : 'Select a part first'); setTool('move'); } },
    { id: 'rotate', label: tr ? 'Dön' : 'Rotate', icon: RotateCcw, active: tool === 'rotate', onClick: () => { if (!selectedId) showToast(tr ? 'Önce parça seçin' : 'Select a part first'); setTool('rotate'); } },
    { id: 'sculpt', label: tr ? 'Hamur' : 'Sculpt', icon: Sparkles, active: tool === 'scale', primary: true, onClick: () => { setTool(tool === 'scale' ? 'select' : 'scale'); } },
    { id: 'add', label: tr ? 'Ekle' : 'Add', icon: Plus, active: sheetMode === 'shapes', onClick: () => setSheetMode(sheetMode === 'shapes' ? 'none' : 'shapes') },
    { id: 'edit', label: tr ? 'Düzenle' : 'Edit', icon: SlidersHorizontal, active: sheetMode === 'edit', onClick: () => { if (selected) setSheetMode(sheetMode === 'edit' ? 'none' : 'edit'); else showToast(tr ? 'Parçaya dokunun' : 'Tap a part'); } },
    { id: 'draw', label: tr ? 'Çiz' : 'Draw', icon: Pencil, active: tool === 'sketch-add', onClick: () => { setTool('sketch-add'); setSheetMode('none'); } },
    { id: 'list', label: tr ? 'Liste' : 'List', icon: Layers, active: sheetMode === 'parts', badge: parts.length > 0 ? String(parts.length) : undefined, onClick: () => setSheetMode(sheetMode === 'parts' ? 'none' : 'parts') },
  ];

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#05080c] select-none">
      {/* ─── Top Mobile Quick Toolbar ─── */}
      <div className="flex-none flex items-center justify-between gap-1.5 px-3 py-2 border-b border-white/10 bg-[#0a0d16] z-20 shadow-md">
        <button
          type="button"
          onClick={() => setSheetMode('help')}
          className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 active:scale-95 transition-transform"
          aria-label="Help"
        >
          <HelpCircle size={16} />
        </button>

        <div className="flex-1 min-w-0 px-2 text-center">
          <p className="text-xs font-black text-white truncate font-mono">
            {selected ? selected.name : tr ? 'ALUCALC · 3D Stüdyo' : 'ALUCALC · 3D CAD'}
          </p>
          <p className="text-[9px] font-mono text-slate-400 truncate">
            {selected ? `${kindLabel(selected.kind, tr)} · (${Math.round(selected.position.x)}, ${Math.round(selected.position.y)}, ${Math.round(selected.position.z)})` : `${parts.length} ${tr ? 'parça' : 'parts'}`}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-xl border transition-all ${
              showGrid ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-400'
            }`}
            title="Grid"
          >
            <Grid3X3 size={16} />
          </button>

          <button
            type="button"
            onClick={() => { undo(); showToast(tr ? 'Geri alındı' : 'Undo'); }}
            className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 active:scale-90"
            title="Undo"
          >
            <Undo2 size={16} />
          </button>

          <button
            type="button"
            onClick={() => { redo(); showToast(tr ? 'İleri alındı' : 'Redo'); }}
            className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 active:scale-90"
            title="Redo"
          >
            <Redo2 size={16} />
          </button>

          <button
            type="button"
            onClick={() => setSheetMode('export')}
            className="p-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-300 active:scale-90"
            title="Export"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* ─── 3D Viewport ─── */}
      <div className="relative flex-1 min-h-0 w-full">
        {/* Mobile Floating Interactive Sketch HUD Banner */}
        {(tool === 'sketch-add' || tool === 'sketch-cut' || tool === 'sketch-loft') && (
          <div className="absolute top-3 inset-x-3 z-30 flex flex-col gap-2 p-2.5 rounded-2xl border border-cyan-500/40 bg-slate-950/95 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 font-mono text-xs font-black">
                  ✏️
                </span>
                <span className="text-xs font-black text-white font-mono uppercase tracking-wider">
                  {tr ? `ÇİZİM: ${pendingOp.toUpperCase()}` : `SKETCH: ${pendingOp.toUpperCase()}`}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={undoSketchPoint}
                  disabled={sketchPoints.length === 0}
                  className="px-2 py-1 rounded-lg bg-white/10 text-[10px] font-mono font-bold text-slate-300 active:scale-95 disabled:opacity-30"
                >
                  {tr ? 'Geri' : 'Undo'}
                </button>
                <button
                  type="button"
                  onClick={clearSketch}
                  className="p-1 rounded-lg bg-white/10 text-slate-400 active:scale-95"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
              <div className="text-[10px] text-cyan-300 font-mono">
                {sketchPoints.length} {tr ? 'nokta' : 'pts'} · {sketchClosed ? (tr ? '✓ Kapalı' : '✓ Closed') : (tr ? 'Dokunun' : 'Tap')}
              </div>

              <div className="flex items-center gap-1.5">
                {!sketchClosed && sketchPoints.length >= 3 && (
                  <button
                    type="button"
                    onClick={closeSketch}
                    className="px-2.5 py-1 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold active:scale-95"
                  >
                    {tr ? 'Kapat' : 'Close'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (!sketchClosed) closeSketch();
                    const id = commitExtrude();
                    if (id) {
                      showToast(tr ? '✨ Katı Oluşturuldu!' : '✨ Solid Created!');
                    } else {
                      showToast(tr ? 'En az 3 nokta gerekli' : 'Min 3 points needed');
                    }
                  }}
                  disabled={sketchPoints.length < 3}
                  className="flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black uppercase text-[11px] shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-30"
                >
                  <Check size={13} className="stroke-[3]" />
                  <span>{tr ? 'Katı Yap' : 'Extrude'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <DesignViewport />

        {/* Center Starter Card when Scene is Empty */}
        <AnimatePresence>
          {parts.length === 0 && !dismissWelcome && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none flex justify-center"
            >
              <div className="w-full max-w-xs rounded-3xl border border-white/15 bg-slate-950/90 p-5 shadow-2xl backdrop-blur-2xl pointer-events-auto text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                  <Box size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white">{tr ? '3D Çizim Alanı' : '3D CAD Workspace'}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-mono">
                    {tr
                      ? 'Aşağıdaki araç çubuğundan "+ Ekle" butonuna basarak kutu, silindir, mil veya kiriş ekleyin.'
                      : 'Tap "+ Add" on the bottom dock to place a box, cylinder, shaft or beam.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setDismissWelcome(true); setSheetMode('shapes'); }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
                >
                  {tr ? '+ İlk Şekli Ekle' : '+ Add First Shape'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Buttons (Right-Bottom) */}
        <div className="absolute right-3 bottom-3 z-20 flex flex-col gap-2.5 items-end">
          {selected && (
            <>
              <button
                type="button"
                onClick={() => { deleteSelected(); showToast(tr ? 'Silindi' : 'Deleted'); }}
                className="w-11 h-11 rounded-2xl bg-rose-950/90 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                aria-label="Delete"
              >
                <Trash2 size={18} />
              </button>

              <button
                type="button"
                onClick={() => { duplicateSelected(); showToast(tr ? 'Kopyalandı' : 'Duplicated'); }}
                className="w-11 h-11 rounded-2xl bg-slate-900/90 border border-white/20 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                aria-label="Duplicate"
              >
                <Copy size={18} />
              </button>

              <button
                type="button"
                onClick={() => setSheetMode('edit')}
                className="w-12 h-12 rounded-2xl bg-blue-950/90 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                aria-label="Edit"
              >
                <SlidersHorizontal size={20} />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setSheetMode('shapes')}
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center shadow-[0_0_25px_rgba(0,229,255,0.5)] active:scale-90 transition-transform"
            aria-label="Add Shape"
          >
            <Plus size={28} className="stroke-[3]" />
          </button>
        </div>

        {/* Live Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-3 left-3 z-30 rounded-xl border border-cyan-500/40 bg-slate-950/90 px-3.5 py-2 font-mono text-xs text-cyan-300 shadow-xl backdrop-blur-xl"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Bottom Mobile Tool Dock ─── */}
      <div className="flex-none z-20 border-t border-white/10 bg-[#0a0d16] p-1 shadow-2xl">
        <div className="flex items-stretch justify-between gap-1">
          {BOTTOM_DOCK_TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={t.onClick}
                className={`relative flex flex-1 flex-col items-center justify-center gap-1 h-12 rounded-xl transition-all active:scale-95 ${
                  t.active
                    ? 'bg-blue-600/20 text-cyan-400 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon size={18} className={t.active ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
                <span className="text-[9px] font-black tracking-tight uppercase leading-none truncate max-w-full">
                  {t.label}
                </span>
                {t.badge && (
                  <span className="absolute top-1 right-2 min-w-3.5 h-3.5 px-1 rounded-full bg-cyan-400 text-black text-[8px] font-black flex items-center justify-center">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Bottom Slide-Up Sheet Modals ─── */}
      <AnimatePresence>
        {sheetMode !== 'none' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheetMode('none')}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] rounded-t-3xl border-t border-white/15 bg-[#0b0f19] p-4 flex flex-col shadow-[0_-12px_40px_rgba(0,0,0,0.8)]"
            >
              {/* Drag Handle */}
              <div className="flex justify-center pb-2">
                <div className="w-12 h-1.5 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-sm font-black text-white font-mono uppercase tracking-wider">
                  {sheetMode === 'shapes' && (tr ? '3D Şekil Ekle' : 'Add 3D Shape')}
                  {sheetMode === 'edit' && (tr ? 'Parça Düzenle' : 'Edit Part')}
                  {sheetMode === 'parts' && (tr ? 'Parça Listesi' : 'Parts List')}
                  {sheetMode === 'export' && (tr ? '3D Dışa Aktar' : 'Export 3D')}
                  {sheetMode === 'help' && (tr ? 'CAD Kılavuzu' : 'CAD Guide')}
                </h3>
                <button
                  type="button"
                  onClick={() => setSheetMode('none')}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Sheet Content: Add Shapes */}
              {sheetMode === 'shapes' && (
                <div className="overflow-y-auto py-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {PRIMITIVES.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => handleAddShape(k)}
                        className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] active:scale-95 transition-all text-center"
                      >
                        <Box size={22} className="text-cyan-400" />
                        <span className="text-[11px] font-bold text-white leading-tight">
                          {kindLabel(k, tr)}
                        </span>
                      </button>
                    ))}
                  </div>

                    <button
                      type="button"
                      onClick={() => {
                        startSketchAdd('extrude');
                        setSheetMode('none');
                        showToast(tr ? '✏️ Ekrana dokunarak noktaları ekleyin' : '✏️ Tap grid to add points');
                      }}
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-cyan-500/40 bg-cyan-500/15 text-cyan-300 text-xs font-black uppercase tracking-wider active:scale-95"
                    >
                      <Pencil size={16} />
                      <span>{tr ? 'Serbest Çizim → Ekstrüzyon' : 'Freeform Sketch → Extrude'}</span>
                    </button>
                </div>
              )}

              {/* Sheet Content: Edit Part Dimensions & Transform */}
              {sheetMode === 'edit' && selected && (
                <div className="overflow-y-auto py-3 space-y-4 font-mono text-xs">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      {tr ? 'Parça Adı' : 'Part Name'}
                    </label>
                    <input
                      type="text"
                      value={selected.name}
                      onChange={(e) => setSelectedName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-bold text-xs focus:border-cyan-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      {tr ? 'Boyutlar (mm)' : 'Dimensions (mm)'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selected.params).slice(0, 6).map(([k, v]) => (
                        <div key={k} className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-1">
                          <span className="text-[9px] uppercase font-bold text-cyan-400 block">{k}</span>
                          <input
                            type="number"
                            value={v}
                            onChange={(e) => updateSelectedParams({ [k]: Number(e.target.value) })}
                            className="w-full bg-transparent font-bold text-white text-xs outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      {tr ? 'Konum (X, Y, Z)' : 'Position (X, Y, Z)'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['x', 'y', 'z'] as const).map((axis) => (
                        <div key={axis} className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-1">
                          <span className="text-[9px] uppercase font-bold text-blue-400 block">{axis.toUpperCase()}</span>
                          <input
                            type="number"
                            value={selected.position[axis]}
                            onChange={(e) => updateSelectedTransform({ position: { [axis]: Number(e.target.value) } })}
                            className="w-full bg-transparent font-bold text-white text-xs outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      {tr ? 'Renk / Malzeme' : 'Color / Material'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PART_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSelectedColor(c)}
                          className={`h-8 w-8 rounded-full border-2 transition-all ${
                            selected.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                          }`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => { duplicateSelected(); showToast(tr ? 'Kopyalandı' : 'Duplicated'); }}
                      className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase"
                    >
                      {tr ? 'Kopyala' : 'Duplicate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { deleteSelected(); setSheetMode('none'); showToast(tr ? 'Silindi' : 'Deleted'); }}
                      className="flex-1 py-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs uppercase"
                    >
                      {tr ? 'Sil' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}

              {/* Sheet Content: Parts List */}
              {sheetMode === 'parts' && (
                <div className="overflow-y-auto py-3 space-y-2 font-mono text-xs">
                  {parts.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">{tr ? 'Sahne boş' : 'Scene empty'}</p>
                  ) : (
                    parts.map((p) => (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          p.id === selectedId
                            ? 'bg-blue-600/15 border-blue-500/40 text-white'
                            : 'bg-white/[0.02] border-white/5 text-slate-300'
                        }`}
                      >
                        <div
                          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                          onClick={() => { select(p.id); setSheetMode('edit'); }}
                        >
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: p.color }} />
                          <div className="truncate">
                            <p className="font-bold truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-500">{kindLabel(p.kind, tr)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleVisible(p.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                          >
                            {p.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => { select(p.id); deleteSelected(); }}
                            className="p-1.5 rounded-lg text-rose-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  {parts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { clearScene(); setSheetMode('none'); showToast(tr ? 'Sahne temizlendi' : 'Scene cleared'); }}
                      className="w-full py-2.5 mt-2 rounded-xl border border-rose-500/30 text-rose-400 font-bold text-xs uppercase"
                    >
                      {tr ? 'Sahneyi Temizle' : 'Clear Scene'}
                    </button>
                  )}
                </div>
              )}

              {/* Sheet Content: Export */}
              {sheetMode === 'export' && (
                <div className="overflow-y-auto py-4 space-y-4">
                  <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono space-y-1">
                    <p className="font-bold">{tr ? '3D CAD Dışa Aktarma' : '3D CAD Export'}</p>
                    <p className="text-[10px] text-cyan-400/80">
                      {tr
                        ? '3D Yazıcı (STL) veya CAD programları için dışa aktarın.'
                        : 'Export for 3D Printing (STL) or CAD software.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 active:scale-95 disabled:opacity-40"
                  >
                    {isExporting ? (tr ? 'Dışa Aktarılıyor...' : 'Exporting...') : (tr ? '📥 STL İndir' : '📥 Download STL')}
                  </button>
                </div>
              )}

              {/* Sheet Content: Help Guide */}
              {sheetMode === 'help' && (
                <div className="overflow-y-auto py-3 space-y-3 font-mono text-xs text-slate-300 leading-relaxed">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="font-bold text-cyan-400">{tr ? '1. Şekil Ekle' : '1. Add Shape'}</span>
                    <p className="text-[11px] text-slate-400">{tr ? 'Alttaki "+ Ekle" butonuna dokunup 12 temel şekilden birini seçin.' : 'Tap "+ Add" on the dock and pick a mechanical shape.'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="font-bold text-cyan-400">{tr ? '2. Parçayı Seç' : '2. Select Part'}</span>
                    <p className="text-[11px] text-slate-400">{tr ? '3D sahnedeki herhangi bir parçaya parmağınızla dokunun.' : 'Tap any 3D solid directly in the viewport.'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="font-bold text-cyan-400">{tr ? '3. Ölçüleri Düzenle' : '3. Edit Dimensions'}</span>
                    <p className="text-[11px] text-slate-400">{tr ? '"Düzenle" butonuna basarak uzunluk, çap, et kalınlığı ve renkleri değiştirin.' : 'Tap "Edit" to modify width, diameter, wall thickness and color.'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="font-bold text-cyan-400">{tr ? '4. Dışa Aktar' : '4. Export'}</span>
                    <p className="text-[11px] text-slate-400">{tr ? 'Üstteki indirme ikonuna dokunarak STL formatında 3D yazıcı çıktısı alın.' : 'Tap the download icon to save STL file for 3D printing.'}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
