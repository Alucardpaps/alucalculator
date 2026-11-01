'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Cylinder, Layers, MousePointer2, Move, RotateCcw, RotateCw,
  SlidersHorizontal, Plus, Download, Upload, Grid3X3, Undo2, Redo2,
  Trash2, Copy, Sparkles, Pencil, X, HelpCircle, Eye, EyeOff,
  Wrench, Check, Disc, Cuboid, Settings2, Sliders, Scissors, FileText,
  Activity, Compass, ChevronDown, ChevronUp, Maximize2, Shield, PenTool
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { CrossModuleBridge, consumeDesignImport } from '@/system/crossModuleBridge';
import { TSLOT_CATALOG } from '@/cad/catalog/tSlotProfiles';
import { executeAutoFastenerAssembly } from './assembly/fastenerDetect';
import { evaluateAssemblyDfm } from '@/engines/dfm/dfmEvaluator';
import {
  useDesignStore,
  PART_COLORS,
  type DesignKind,
  type DesignTool,
  type DesignPart,
  type RenderMode,
  type SectionAxis
} from './designStore';
import { getDesignKindLabel } from '@/locales/designStudioTranslations';
import { exportPartsToSTL, downloadFile } from './exporter';
import { loadCADFile } from './cadImporter';
import { ENGINEERING_MATERIALS, calculateAssemblyMassProperties } from './materialsEngine';
import { generateTechnicalDrawingSVG, generateBatchDrawingsHTML, type DrawingTemplateStyle, type DrawingColorTheme, type DrawingSheetConfig } from './technicalDrawingGenerator';


const DesignViewport = dynamic(() => import('./DesignViewport').then((m) => m.DesignViewport || m.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[var(--bg-0)] text-[11px] font-mono text-white/35">
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

  const [sheetMode, setSheetMode] = useState<'none' | 'shapes' | 'edit' | 'parts' | 'export' | 'help' | 'settings' | 'assembly' | 'dfm'>('none');
  const [exportFormat, setExportFormat] = useState('stl-binary');
  const [isExporting, setIsExporting] = useState(false);
  const [engineeringOverride, setEngineeringOverride] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dismissWelcome, setDismissWelcome] = useState(false);
  const [showExplodeHUD, setShowExplodeHUD] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'explode' | 'render' | 'measure' | 'section' | 'drawing'>('explode');

  useEffect(() => {
    const n = consumeDesignImport();
    if (n > 0) {
      setToast(`Imported ${n} calculated solid${n === 1 ? '' : 's'} from calculator`);
    }
  }, []);

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
  const explodeFactor = useDesignStore((s) => s.explodeFactor);
  const setExplodeFactor = useDesignStore((s) => s.setExplodeFactor);
  const explodeDirection = useDesignStore((s) => s.explodeDirection);
  const setExplodeDirection = useDesignStore((s) => s.setExplodeDirection);

  const renderMode = useDesignStore((s) => s.renderMode);
  const setRenderMode = useDesignStore((s) => s.setRenderMode);
  const sectionAxis = useDesignStore((s) => s.sectionAxis);
  const setSectionAxis = useDesignStore((s) => s.setSectionAxis);
  const sectionOffset = useDesignStore((s) => s.sectionOffset);
  const setSectionOffset = useDesignStore((s) => s.setSectionOffset);
  const sectionSolidCap = useDesignStore((s) => s.sectionSolidCap);
  const setSectionSolidCap = useDesignStore((s) => s.setSectionSolidCap);
  const measureMode = useDesignStore((s) => s.measureMode);
  const setMeasureMode = useDesignStore((s) => s.setMeasureMode);
  const measurements = useDesignStore((s) => s.measurements);
  const clearMeasurements = useDesignStore((s) => s.clearMeasurements);
  const showCenterOfGravity = useDesignStore((s) => s.showCenterOfGravity);
  const setShowCenterOfGravity = useDesignStore((s) => s.setShowCenterOfGravity);
  const showTechnicalDrawingModal = useDesignStore((s) => s.showTechnicalDrawingModal);
  const setShowTechnicalDrawingModal = useDesignStore((s) => s.setShowTechnicalDrawingModal);
  const ghostIsolated = useDesignStore((s) => s.ghostIsolated);
  const setGhostIsolated = useDesignStore((s) => s.setGhostIsolated);
  const projectName = useDesignStore((s) => s.projectName);
  const selectedMaterialId = useDesignStore((s) => s.selectedMaterialId);

  const mates = useDesignStore((s) => s.mates);
  const applyMates = useDesignStore((s) => s.applyMates);
  const removeMate = useDesignStore((s) => s.removeMate);
  const clearMates = useDesignStore((s) => s.clearMates);
  const addTSlotPart = useDesignStore((s) => s.addTSlotPart);

  const dfmReport = useMemo(() => evaluateAssemblyDfm(parts, mates, selectedMaterialId), [parts, mates, selectedMaterialId]);

  const massProps = useMemo(() => calculateAssemblyMassProperties(parts, selectedMaterialId), [parts, selectedMaterialId]);
  const activeMaterial = useMemo(() => ENGINEERING_MATERIALS.find((m) => m.id === selectedMaterialId) || ENGINEERING_MATERIALS[0], [selectedMaterialId]);
  const [templateStyle, setTemplateStyle] = useState<DrawingTemplateStyle>('iso7200');
  const [colorTheme, setColorTheme] = useState<DrawingColorTheme>('classic');

  useEffect(() => {
    useDesignStore.getState().hydrateCADGeometries?.();
  }, []);

  const mobileDrawingSvg = useMemo(() => {
    if (!showTechnicalDrawingModal) return '';
    try {
      return generateTechnicalDrawingSVG(parts, massProps, {
        projectName,
        partName: t12(language, `Full Assembly (${parts.length} Parts)`, `Tüm Montaj (${parts.length} Parça)`),
        materialName: t12(language, activeMaterial.name, activeMaterial.nameTr),
        templateStyle,
        colorTheme,
        lang: language,
      });
    } catch (err) {
      console.error('Error generating mobile technical drawing:', err);
      return `<div style="color: #f87171; padding: 16px; font-family: monospace; font-size: 12px;">Hata: ${String(err)}</div>`;
    }
  }, [showTechnicalDrawingModal, parts, massProps, projectName, language, activeMaterial, templateStyle, colorTheme]);

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

  // Keyboard shortcut M: Measure / Caliper
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );
      if (isInput) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setTool('measure');
        showToast(t12(language, '📏 Caliper Active (M)', '📏 Kumpas / Ölçü Alma Aktif (M)'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool, language]);

  const handleAddShape = (kind: DesignKind) => {
    addPart(kind);
    setSheetMode('none');
    setDismissWelcome(true);
    showToast(`+ ${t12(language, 'Added', 'Eklendi')} ${getDesignKindLabel(kind, language)}`);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCADImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const res = await loadCADFile(files[i]);
      showToast(res.message);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = async () => {
    if (!parts.some((p) => p.visible)) {
      showToast(t12(language, 'Scene empty!', 'Sahne boş!'));
      return;
    }
    setIsExporting(true);
    try {
      const buffer = exportPartsToSTL(parts);
      downloadFile(buffer, 'alucalc-mobile-model.stl', 'application/sla');
      showToast(t12(language, 'STL Downloaded', 'STL İndirildi'));
      setSheetMode('none');
    } catch {
      showToast(t12(language, 'Export failed', 'Dışa aktarma hatası'));
    } finally {
      setIsExporting(false);
    }
  };

  const BOTTOM_DOCK_TOOLS = [
    { id: 'select', label: t12(language, 'Select', 'Seç'), icon: MousePointer2, active: tool === 'select' && sheetMode === 'none', onClick: () => { setTool('select'); setSheetMode('none'); } },
    { id: 'move', label: t12(language, 'Move', 'Taşı'), icon: Move, active: tool === 'move', onClick: () => { if (!selectedId) showToast(t12(language, 'Select a part first', 'Önce parça seçin')); setTool('move'); } },
    { id: 'add', label: t12(language, 'Add', 'Ekle'), icon: Plus, active: sheetMode === 'shapes', onClick: () => setSheetMode(sheetMode === 'shapes' ? 'none' : 'shapes') },
    { id: 'assembly', label: t12(language, 'Assembly', 'Montaj'), icon: Wrench, active: sheetMode === 'assembly', badge: mates.length > 0 ? String(mates.length) : undefined, onClick: () => setSheetMode(sheetMode === 'assembly' ? 'none' : 'assembly') },
    { id: 'dfm', label: 'DFM', icon: Shield, active: sheetMode === 'dfm', badge: dfmReport.criticalCount > 0 ? String(dfmReport.criticalCount) : undefined, badgeColor: 'bg-rose-500 text-white', onClick: () => setSheetMode(sheetMode === 'dfm' ? 'none' : 'dfm') },
    { id: 'list', label: t12(language, 'List', 'Liste'), icon: Layers, active: sheetMode === 'parts', badge: parts.length > 0 ? String(parts.length) : undefined, onClick: () => setSheetMode(sheetMode === 'parts' ? 'none' : 'parts') },
    { id: 'settings', label: t12(language, 'Tools', 'Araçlar'), icon: Settings2, active: sheetMode === 'settings', onClick: () => setSheetMode(sheetMode === 'settings' ? 'none' : 'settings') },
  ];

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--bg-0)] select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept=".stl,.obj,.gltf,.glb,.step,.stp,.x_t,.x_b,.iges,.igs,.brep"
        multiple
        className="hidden"
        onChange={handleCADImport}
      />
      {/* ─── Top Mobile Quick Toolbar ─── */}
      <div className="flex-none flex items-center justify-between gap-1.5 px-3 py-2 border-b border-white/10 bg-[var(--bg-1)] z-20 shadow-md">
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
            {selected ? selected.name : t12(language, 'ALUCALC · 3D CAD', 'ALUCALC · 3D Stüdyo')}
          </p>
          <p className="text-[9px] font-mono text-slate-400 truncate">
            {selected ? `${getDesignKindLabel(selected.kind, language)} · (${Math.round(selected.position.x)}, ${Math.round(selected.position.y)}, ${Math.round(selected.position.z)})` : `${parts.length} ${t12(language, 'parts', 'parça')}`}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick DFM Alert Pill if critical issues detected */}
          {dfmReport.criticalCount > 0 && (
            <button
              type="button"
              onClick={() => setSheetMode('dfm')}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-[9px] font-black uppercase animate-pulse"
              title="DFM Critical Blocker"
            >
              <Shield size={12} className="text-rose-400" />
              <span>{dfmReport.criticalCount} DFM</span>
            </button>
          )}

          {/* Quick 2D CAD Bridge Button */}
          <button
            type="button"
            onClick={() => {
              if (selected) {
                CrossModuleBridge.exportDesignStudioToCad(selected, { clearCanvas: false });
                showToast(t12(language, `📐 ${selected.name} sent to 2D CAD`, `📐 ${selected.name} 2D CAD'e aktarıldı`));
              }
              if (typeof window !== 'undefined') {
                window.location.href = '/cad-editor/';
              }
            }}
            className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 active:scale-90"
            title={t12(language, 'Open in 2D CAD', '2D CAD Editöründe Aç')}
          >
            <PenTool size={16} />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 active:scale-90"
            title={t12(language, 'Import CAD (.stl, .obj, .step)', 'CAD İçe Aktar (.stl, .obj, .step)')}
          >
            <Upload size={16} />
          </button>

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
            onClick={() => { undo(); showToast(t12(language, 'Undo', 'Geri alındı')); }}
            className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 active:scale-90"
            title="Undo"
          >
            <Undo2 size={16} />
          </button>

          <button
            type="button"
            onClick={() => { redo(); showToast(t12(language, 'Redo', 'İleri alındı')); }}
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
          <div className="absolute top-3 inset-x-3 z-30 flex flex-col gap-2 p-2.5 rounded-2xl border border-cyan-500/40 bg-slate-950/95 shadow-2xl animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 font-mono text-xs font-black">
                  ✏️
                </span>
                <span className="text-xs font-black text-white font-mono uppercase tracking-wider">
                  {t12(language, `SKETCH: ${pendingOp.toUpperCase()}`, `ÇİZİM: ${pendingOp.toUpperCase()}`)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={undoSketchPoint}
                  disabled={sketchPoints.length === 0}
                  className="px-2 py-1 rounded-lg bg-white/10 text-[10px] font-mono font-bold text-slate-300 active:scale-95 disabled:opacity-30"
                >
                  {t12(language, 'Undo', 'Geri')}
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
                {sketchPoints.length} {t12(language, 'pts', 'nokta')} · {sketchClosed ? (t12(language, '✓ Closed', '✓ Kapalı')) : (t12(language, 'Tap', 'Dokunun'))}
              </div>

              <div className="flex items-center gap-1.5">
                {!sketchClosed && sketchPoints.length >= 3 && (
                  <button
                    type="button"
                    onClick={closeSketch}
                    className="px-2.5 py-1 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold active:scale-95"
                  >
                    {t12(language, 'Close', 'Kapat')}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (!sketchClosed) closeSketch();
                    const id = commitExtrude();
                    if (id) {
                      showToast(
                        pendingOp === 'cut'
                          ? t12(language, '✂️ Cut Applied!', '✂️ Kesim Uygulandı!')
                          : t12(language, '✨ Solid Created!', '✨ Katı Oluşturuldu!')
                      );
                    } else {
                      showToast(t12(language, 'Min 3 points needed', 'En az 3 nokta gerekli'));
                    }
                  }}
                  disabled={sketchPoints.length < 3}
                  className={`flex items-center gap-1 px-3 py-1 rounded-xl text-white font-black uppercase text-[11px] shadow-md active:scale-95 disabled:opacity-30 ${
                    pendingOp === 'cut'
                      ? 'bg-gradient-to-r from-rose-500 to-red-600 '
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 '
                  }`}
                >
                  {pendingOp === 'cut' ? <Scissors size={13} className="stroke-[2.5]" /> : <Check size={13} className="stroke-[3]" />}
                  <span>{pendingOp === 'cut' ? t12(language, 'Cut', 'Kes') : t12(language, 'Extrude', 'Katı Yap')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Quick Action HUD (Explode, Render, Tools) */}
        {tool !== 'sketch-add' && tool !== 'sketch-cut' && tool !== 'sketch-loft' && (
          <div className="absolute top-2 inset-x-2 z-20 flex items-center justify-between gap-1.5 pointer-events-none">
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <button
                type="button"
                onClick={() => setShowExplodeHUD(!showExplodeHUD)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[10px] font-black uppercase shadow-lg transition-all active:scale-95 ${
                  showExplodeHUD || explodeFactor > 0
                    ? 'bg-amber-500/25 border-amber-400 text-amber-300 '
                    : 'bg-slate-950/80 border-white/15 text-slate-300'
                }`}
              >
                <span>💥</span>
                <span>{t12(language, 'Explode', 'Patlat')}</span>
                {explodeFactor > 0 && <span className="text-amber-400 font-mono">({explodeFactor}%)</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  const modes: RenderMode[] = ['solid', 'wire', 'matcap', 'xray', 'edges'];
                  const curIdx = modes.indexOf(renderMode);
                  const nextMode = modes[(curIdx + 1) % modes.length];
                  setRenderMode(nextMode);
                  showToast(t12(language, `Render: ${nextMode.toUpperCase()}`, `Görünüm: ${nextMode.toUpperCase()}`));
                }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-950/80 border border-white/15 text-cyan-300 text-[10px] font-black uppercase shadow-lg active:scale-95"
                title="Cycle Render Mode"
              >
                <span>🎨</span>
                <span>{renderMode === 'solid' ? 'KATI' : renderMode === 'wire' ? 'TEL' : renderMode.toUpperCase()}</span>
              </button>
            </div>

            <div className="flex items-center gap-1 pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  setSettingsTab('drawing');
                  setSheetMode('settings');
                }}
                className="p-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-lg active:scale-95"
                title={t12(language, '2D Drawing', '2D Teknik Çizim')}
              >
                <FileText size={15} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettingsTab('explode');
                  setSheetMode('settings');
                }}
                className="p-1.5 rounded-xl bg-slate-950/80 border border-white/15 text-slate-200 shadow-lg active:scale-95"
                title={t12(language, 'Settings & Tools', 'Tüm Görünüm & Patlatma Ayarları')}
              >
                <Settings2 size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Floating Quick Explosion Control Bar */}
        <AnimatePresence>
          {showExplodeHUD && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-12 inset-x-2 z-30 p-3 rounded-2xl border border-amber-500/40 bg-slate-950/95 shadow-2xl space-y-2.5 font-mono"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  💥 {t12(language, 'Explosion Control', 'Montaj Patlatma Ayarı')} ({explodeFactor}%)
                </span>
                <div className="flex items-center gap-1.5">
                  {explodeFactor > 0 && (
                    <button
                      type="button"
                      onClick={() => setExplodeFactor(0)}
                      className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 text-[9px] font-bold border border-rose-500/30"
                    >
                      {t12(language, 'Reset', 'Sıfırla')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowExplodeHUD(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Slider with - / + buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExplodeFactor(Math.max(0, explodeFactor - 10))}
                  className="w-7 h-7 rounded-lg bg-white/10 text-white font-black text-xs flex items-center justify-center active:scale-90"
                >
                  -
                </button>
                <input
                  type="range"
                  min={0}
                  max={150}
                  step={1}
                  value={explodeFactor}
                  onChange={(e) => setExplodeFactor(Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                />
                <button
                  type="button"
                  onClick={() => setExplodeFactor(Math.min(150, explodeFactor + 10))}
                  className="w-7 h-7 rounded-lg bg-white/10 text-white font-black text-xs flex items-center justify-center active:scale-90"
                >
                  +
                </button>
              </div>

              {/* Direction Chips */}
              <div className="grid grid-cols-5 gap-1 pt-1">
                {[
                  { id: 'radial', label: t12(language, '↗ Rad', '↗ Radyal') },
                  { id: 'axial-y', label: t12(language, '↕ Y', '↕ Y Dikey') },
                  { id: 'axial-x', label: t12(language, '↔ X', '↔ X Yatay') },
                  { id: 'axial-z', label: t12(language, '↕ Z', '↕ Z Derin') },
                  { id: 'linear-sequence', label: t12(language, '⇣ Seq', '⇣ Sıra') },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setExplodeDirection(d.id as any)}
                    className={`py-1 rounded-lg text-[9px] font-bold border transition-all text-center truncate ${
                      explodeDirection === d.id
                        ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
              <div className="w-full max-w-xs rounded-3xl border border-white/15 bg-slate-950/90 p-5 shadow-2xl pointer-events-auto text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)] mx-auto ">
                  <Box size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white">{t12(language, '3D CAD Workspace', '3D Çizim Alanı')}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-mono">
                    {t12(language, 'Tap "+ Add" on the bottom dock to place a box, cylinder, shaft or beam.', 'Aşağıdaki araç çubuğundan "+ Ekle" butonuna basarak kutu, silindir, mil veya kiriş ekleyin.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setDismissWelcome(true); setSheetMode('shapes'); }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                >
                  {t12(language, '+ Add First Shape', '+ İlk Şekli Ekle')}
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
                onClick={() => { deleteSelected(); showToast(t12(language, 'Deleted', 'Silindi')); }}
                className="w-11 h-11 rounded-2xl bg-rose-950/90 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                aria-label="Delete"
              >
                <Trash2 size={18} />
              </button>

              <button
                type="button"
                onClick={() => { duplicateSelected(); showToast(t12(language, 'Duplicated', 'Kopyalandı')); }}
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
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center active:scale-90 transition-transform"
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
              className="absolute bottom-3 left-3 z-30 rounded-xl border border-cyan-500/40 bg-slate-950/90 px-3.5 py-2 font-mono text-xs text-cyan-300 shadow-xl"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Bottom Mobile Tool Dock ─── */}
      <div className="flex-none z-20 border-t border-white/10 bg-[var(--bg-1)] p-1 shadow-2xl">
        <div className="flex items-stretch justify-between gap-1 overflow-x-auto no-scrollbar">
          {BOTTOM_DOCK_TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={t.onClick}
                className={`relative flex flex-1 min-w-[46px] flex-col items-center justify-center gap-1 h-12 rounded-xl transition-all active:scale-95 ${
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
                  <span className={`absolute top-1 right-1 min-w-3.5 h-3.5 px-1 rounded-full ${(t as any).badgeColor || 'bg-cyan-400 text-black'} text-[8px] font-black flex items-center justify-center`}>
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
              className="fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] rounded-t-3xl border-t border-white/15 bg-[var(--bg-1)] p-4 flex flex-col shadow-[0_-12px_40px_rgba(0,0,0,0.8)]"
            >
              {/* Drag Handle */}
              <div className="flex justify-center pb-2">
                <div className="w-12 h-1.5 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-sm font-black text-white font-mono uppercase tracking-wider">
                  {sheetMode === 'shapes' && (t12(language, 'Add 3D Shape', '3D Şekil Ekle'))}
                  {sheetMode === 'edit' && (t12(language, 'Edit Part', 'Parça Düzenle'))}
                  {sheetMode === 'parts' && (t12(language, 'Parts List', 'Parça Listesi'))}
                  {sheetMode === 'assembly' && (t12(language, '🔩 Assembly & AI Fastener', '🔩 Montaj & AI Cıvata'))}
                  {sheetMode === 'dfm' && (t12(language, '🛡️ DFM Manufacturing Gate', '🛡️ DFM İmalat Doğrulama'))}
                  {sheetMode === 'settings' && (t12(language, '⚙️ View & CAD Tools', '⚙️ Görünüm & CAD Araçları'))}
                  {sheetMode === 'export' && (t12(language, 'Export 3D', '3D Dışa Aktar'))}
                  {sheetMode === 'help' && (t12(language, 'CAD Guide', 'CAD Kılavuzu'))}
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
                          {getDesignKindLabel(k, language)}
                        </span>
                      </button>
                    ))}
                  </div>

                    <button
                      type="button"
                      onClick={() => {
                        startSketchAdd('extrude');
                        setSheetMode('none');
                        showToast(t12(language, '✏️ Tap grid to add points', '✏️ Ekrana dokunarak noktaları ekleyin'));
                      }}
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-cyan-500/40 bg-cyan-500/15 text-cyan-300 text-xs font-black uppercase tracking-wider active:scale-95"
                    >
                      <Pencil size={16} />
                      <span>{t12(language, 'Freeform Sketch → Extrude', 'Serbest Çizim → Ekstrüzyon')}</span>
                    </button>
                </div>
              )}

              {/* Sheet Content: Edit Part Dimensions & Transform */}
              {sheetMode === 'edit' && selected && (
                <div className="overflow-y-auto py-3 space-y-4 font-mono text-xs">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      {t12(language, 'Part Name', 'Parça Adı')}
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
                      {t12(language, 'Dimensions (mm)', 'Boyutlar (mm)')}
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
                      {t12(language, 'Position (X, Y, Z)', 'Konum (X, Y, Z)')}
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
                      {t12(language, 'Color / Material', 'Renk / Malzeme')}
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
                      onClick={() => { duplicateSelected(); showToast(t12(language, 'Duplicated', 'Kopyalandı')); }}
                      className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase"
                    >
                      {t12(language, 'Duplicate', 'Kopyala')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { deleteSelected(); setSheetMode('none'); showToast(t12(language, 'Deleted', 'Silindi')); }}
                      className="flex-1 py-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs uppercase"
                    >
                      {t12(language, 'Delete', 'Sil')}
                    </button>
                  </div>
                </div>
              )}

              {/* Sheet Content: Parts List */}
              {sheetMode === 'parts' && (
                <div className="overflow-y-auto py-3 space-y-2 font-mono text-xs">
                  {parts.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">{t12(language, 'Scene empty', 'Sahne boş')}</p>
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
                            <p className="text-[10px] text-slate-500">{getDesignKindLabel(p.kind, language)}</p>
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

                  {parts.length > 1 && (
                    <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase text-amber-400 font-bold">💥 {t12(language, 'Assembly Explode', 'Montaj Patlatma')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={150}
                          step={1}
                          value={explodeFactor}
                          onChange={(e) => setExplodeFactor(Number(e.target.value))}
                          className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                        />
                        <span className="text-[10px] text-slate-300 font-bold w-8 text-right">{explodeFactor}%</span>
                      </div>
                      <select
                        value={explodeDirection}
                        onChange={(e) => setExplodeDirection(e.target.value as any)}
                        className="w-full bg-slate-800 border border-white/10 text-[10px] text-slate-300 font-bold rounded-lg px-2 py-1.5 cursor-pointer outline-none"
                      >
                        <option value="radial">{t12(language, '↗ Radial (All Directions)', '↗ Radyal (Tüm Yönler)')}</option>
                        <option value="axial-y">{t12(language, '↕ Vertical (Y)', '↕ Dikey (Y)')}</option>
                        <option value="axial-x">{t12(language, '↔ Horizontal (X)', '↔ Yatay (X)')}</option>
                        <option value="axial-z">{t12(language, '↕ Depth (Z)', '↕ Derinlik (Z)')}</option>
                        <option value="linear-sequence">{t12(language, '⇣ Linear Sequence', '⇣ Sıralı Dizilim')}</option>
                      </select>
                    </div>
                  )}

                  {parts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { clearScene(); setSheetMode('none'); showToast(t12(language, 'Scene cleared', 'Sahne temizlendi')); }}
                      className="w-full py-2.5 mt-2 rounded-xl border border-rose-500/30 text-rose-400 font-bold text-xs uppercase"
                    >
                      {t12(language, 'Clear Scene', 'Sahneyi Temizle')}
                    </button>
                  )}
                </div>
              )}

              {/* Sheet Content: Export */}
              {sheetMode === 'export' && (
                <div className="overflow-y-auto py-4 space-y-4">
                  <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono space-y-1">
                    <p className="font-bold">{t12(language, '3D CAD Export & 2D Sync', '3D CAD Dışa Aktarma & 2D Senkronizasyon')}</p>
                    <p className="text-[10px] text-cyan-400/80">
                      {t12(language, 'Export for 3D Printing (STL), CAD software or transfer to 2D drafting.', '3D Yazıcı (STL), CAD programları veya 2D çizim sayfasına aktarın.')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleExport}
                      disabled={isExporting}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      <span>{isExporting ? (t12(language, 'Exporting...', 'Dışa Aktarılıyor...')) : (t12(language, '📥 Download STL', '📥 STL İndir (3D Yazıcı)'))}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const targetPart = selected || parts[0];
                        if (!targetPart) {
                          showToast(t12(language, 'No part in scene!', 'Sahnede parça yok!'));
                          return;
                        }
                        CrossModuleBridge.exportDesignStudioToCad(targetPart, { clearCanvas: false });
                        showToast(t12(language, `📐 ${targetPart.name} exported to 2D CAD!`, `📐 ${targetPart.name} 2D CAD'e aktarıldı!`));
                        if (typeof window !== 'undefined') {
                          window.location.href = '/cad-editor/';
                        }
                      }}
                      className="w-full py-3.5 rounded-2xl bg-white/5 border border-cyan-500/40 text-cyan-300 font-black text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <PenTool size={16} />
                      <span>{t12(language, '📐 Edit in 2D CAD Editor', '📐 2D CAD Editöründe Düzenle')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sheet Content: Assembly & AI Fasteners */}
              {sheetMode === 'assembly' && (
                <div className="overflow-y-auto py-3 space-y-4 font-mono text-xs">
                  {/* AI Auto-Fastener Action Banner */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-b from-emerald-950/40 to-slate-900 border border-emerald-500/30 space-y-2.5 shadow-inner">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-200">
                          {t12(language, 'AI Auto-Fastener Assembly', 'AI Otomatik Bağlantı Elemanı')}
                        </h4>
                        <span className="text-[9px] text-emerald-400/80">
                          {t12(language, 'Coaxial hole detection & ISO bolts', 'Eksenel delik tarama & ISO cıvata')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const res = executeAutoFastenerAssembly();
                        if (res.detected === 0) {
                          showToast(t12(language, 'ℹ️ No coaxial matching hole pairs detected', 'ℹ️ Eksenel eşleşen açık delik çifti bulunamadı'));
                        } else {
                          showToast(
                            t12(language, `⚡ ${res.detected} hole pairs detected, ${res.fastenersAdded} ISO fasteners assembled!`, `⚡ ${res.detected} delik çifti algılandı, ${res.fastenersAdded} standart cıvata monte edildi!`)
                          );
                        }
                      }}
                      className="w-full py-3 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 active:from-emerald-500 active:to-teal-500 text-white font-black text-xs uppercase rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Wrench size={14} />
                      <span>{t12(language, '⚡ AI Auto-Assemble Fasteners', '⚡ AI Cıvataları Otomatik Yerleştir')}</span>
                    </button>
                  </div>

                  {/* T-Slot Aluminum Profile Quick Add */}
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase">
                        {t12(language, 'T-Slot Profile Quick Add', 'T-Kanal Profil Hızlı Ekle')}
                      </span>
                      <span className="text-[8px] text-slate-500 font-mono">EN 12020</span>
                    </div>

                    <div className="space-y-2">
                      {TSLOT_CATALOG.filter(s => ['2020', '2040', '3030', '4040', '4080', '4590'].includes(s.id)).map((spec) => (
                        <div key={spec.id} className="p-2 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-cyan-200 text-[11px]">{spec.name}</span>
                            <span className="text-[9px] text-slate-400">{spec.massKgPerM} kg/m</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[200, 500, 1000].map((lenMm) => (
                              <button
                                key={lenMm}
                                type="button"
                                onClick={() => {
                                  addTSlotPart(spec.id, lenMm);
                                  showToast(t12(language, `+ ${spec.name} added (${lenMm} mm)`, `+ ${spec.name} eklendi (${lenMm} mm)`));
                                }}
                                className="py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-[10px] font-bold text-cyan-300 active:scale-95 text-center"
                              >
                                {lenMm} mm
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Mates List */}
                  <div className="space-y-2 pt-1 border-t border-white/10">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>{t12(language, 'Active Mates', 'Aktif Montaj Mates')} ({mates.length})</span>
                      {mates.length > 0 && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              applyMates();
                              showToast(t12(language, 'Mates solved', 'Mates çözüldü'));
                            }}
                            className="text-cyan-400 hover:underline"
                          >
                            {t12(language, 'Solve', 'Çöz')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              clearMates();
                              showToast(t12(language, 'Mates cleared', 'Mates temizlendi'));
                            }}
                            className="text-rose-400 hover:underline"
                          >
                            {t12(language, 'Clear', 'Temizle')}
                          </button>
                        </div>
                      )}
                    </div>

                    {mates.length === 0 ? (
                      <p className="text-[10px] text-slate-500 text-center py-3">
                        {t12(language, 'No active mates. Auto-mate with AI Fastener.', 'Henüz mate tanımlanmadı. AI Cıvata ile otomatik bağlanabilir.')}
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {mates.map((m) => (
                          <div key={m.id} className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/20 text-[10px] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-300 uppercase">
                                {m.kind === 'concentric' ? '🎯 Eşeksenli' : m.kind === 'coincident' ? '📐 Çakışık' : '🔩 Kanal-Uç'}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeMate(m.id)}
                                className="text-rose-400 hover:text-rose-200 font-bold"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="text-[9px] text-slate-400 flex items-center justify-between truncate">
                              <span>A: {m.partAId.slice(0, 10)}…</span>
                              <span>B: {m.partBId.slice(0, 10)}…</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sheet Content: DFM Validation */}
              {sheetMode === 'dfm' && (
                <div className="overflow-y-auto py-3 space-y-4 font-mono text-xs">
                  {/* DFM Status Score Card */}
                  <div
                    className={`p-4 rounded-2xl border space-y-3 ${
                      dfmReport.passed
                        ? 'bg-gradient-to-b from-emerald-950/40 to-slate-900 border-emerald-500/30'
                        : dfmReport.criticalCount > 0
                        ? 'bg-gradient-to-b from-rose-950/40 to-slate-900 border-rose-500/40'
                        : 'bg-gradient-to-b from-amber-950/40 to-slate-900 border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2 rounded-xl ${
                            dfmReport.passed
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : dfmReport.criticalCount > 0
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          <Shield size={20} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">
                            {dfmReport.passed
                              ? (t12(language, 'Production Ready', 'Üretime Tam Hazır'))
                              : dfmReport.criticalCount > 0
                              ? (t12(language, 'Manufacturing Blocked', 'İmalat Bloke Edildi'))
                              : (t12(language, 'Warnings Detected', 'Uyarılar Tespit Edildi'))}
                          </h4>
                          <span className="text-[9px] text-slate-400">
                            VDI 2230 / ISO 2768-m / EN 12020
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-black font-mono text-cyan-300">
                          {dfmReport.score}<span className="text-xs text-slate-400">/100</span>
                        </div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400">DFM SCORE</span>
                      </div>
                    </div>

                    {/* Override Toggle */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="text-[10px] text-slate-300">
                        <span>{t12(language, 'Engineering Override', 'Mühendislik İstisnası (Override)')}</span>
                        <p className="text-[8px] text-slate-500">{t12(language, 'Bypass export lock', 'Hatalara rağmen dışa aktarmayı aç')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEngineeringOverride(!engineeringOverride);
                          showToast(
                            !engineeringOverride
                              ? (t12(language, '⚠️ DFM Lock bypassed', '⚠️ DFM Kilidi kaldırıldı'))
                              : (t12(language, '🛡️ DFM Lock active', '🛡️ DFM Koruması aktif'))
                          );
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                          engineeringOverride ? 'bg-amber-500 text-black' : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {engineeringOverride ? (t12(language, 'ON', 'AÇIK')) : (t12(language, 'OFF', 'KAPALI'))}
                      </button>
                    </div>
                  </div>

                  {/* Issues List */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t12(language, `Analytical Findings (${dfmReport.issues.length})`, `Analitik Bulgular (${dfmReport.issues.length})`)}
                    </p>

                    {dfmReport.issues.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-300 text-xs">
                        ✓ {t12(language, 'All manufacturing rules verified successfully.', 'Tüm imalat kuralları başarıyla doğrulandı.')}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dfmReport.issues.map((iss, idx) => (
                          <div
                            key={iss.ruleId + idx}
                            className={`p-3 rounded-2xl border space-y-1.5 ${
                              iss.severity === 'CRITICAL'
                                ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                                : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[11px] flex items-center gap-1.5">
                                <span>{iss.severity === 'CRITICAL' ? '🔴' : '⚠️'}</span>
                                <span>{t12(language, iss.title, iss.titleTr)}</span>
                              </span>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-slate-400">
                                {iss.ruleId}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                              {t12(language, iss.message, iss.messageTr)}
                            </p>
                            <div className="text-[9px] text-cyan-300/90 pt-1 border-t border-white/10 font-mono flex items-center justify-between">
                              <span>{t12(language, 'Measured', 'Ölçülen')}: {iss.measured} {iss.unit}</span>
                              <span>{t12(language, 'Required', 'Gereken')}: {iss.required} {iss.unit} ({iss.standard})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sheet Content: Settings & View Tools */}
              {sheetMode === 'settings' && (
                <div className="overflow-y-auto py-2 space-y-3 font-mono text-xs">
                  {/* Tabs */}
                  <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1 gap-1">
                    {[
                      { id: 'explode', label: t12(language, '💥 Explode', '💥 Patlatma') },
                      { id: 'render', label: t12(language, '🎨 Render', '🎨 Görünüm') },
                      { id: 'measure', label: t12(language, '📐 Caliper', '📐 Kumpas') },
                      { id: 'section', label: t12(language, '✂️ Section', '✂️ Kesit') },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSettingsTab(tab.id as any)}
                        className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase text-center transition-all ${
                          settingsTab === tab.id
                            ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab 1: Explode */}
                  {settingsTab === 'explode' && (
                    <div className="space-y-3 p-1">
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-300 uppercase text-[11px]">💥 {t12(language, 'Assembly Explode Factor', 'Montaj Patlatma Oranı')}</span>
                          <span className="font-black text-amber-400 text-sm">{explodeFactor}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setExplodeFactor(Math.max(0, explodeFactor - 10))}
                            className="w-8 h-8 rounded-xl bg-white/10 text-white font-black text-sm flex items-center justify-center active:scale-90"
                          >
                            -
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={150}
                            step={1}
                            value={explodeFactor}
                            onChange={(e) => setExplodeFactor(Number(e.target.value))}
                            className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                          />
                          <button
                            type="button"
                            onClick={() => setExplodeFactor(Math.min(150, explodeFactor + 10))}
                            className="w-8 h-8 rounded-xl bg-white/10 text-white font-black text-sm flex items-center justify-center active:scale-90"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">{t12(language, 'Explosion Direction', 'Patlatma Yönü')}</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'radial', label: t12(language, '↗ Radial', '↗ Radyal (Tüm Yönler)') },
                            { id: 'axial-y', label: t12(language, '↕ Vertical (Y)', '↕ Dikey (Y Ekseni)') },
                            { id: 'axial-x', label: t12(language, '↔ Horizontal (X)', '↔ Yatay (X Ekseni)') },
                            { id: 'axial-z', label: t12(language, '↕ Depth (Z)', '↕ Derinlik (Z Ekseni)') },
                            { id: 'linear-sequence', label: t12(language, '⇣ Linear Seq', '⇣ Sıralı Dizilim') },
                          ].map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => setExplodeDirection(d.id as any)}
                              className={`p-2.5 rounded-xl border text-[11px] font-bold text-left transition-all ${
                                explodeDirection === d.id
                                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                                  : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
                              }`}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setGhostIsolated(!ghostIsolated)}
                          className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                            ghostIsolated
                              ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                              : 'bg-white/[0.03] border-white/10 text-slate-400'
                          }`}
                        >
                          👻 {t12(language, 'Ghost Mode', 'Hayalet Parçalar')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCenterOfGravity(!showCenterOfGravity);
                            showToast(showCenterOfGravity ? (t12(language, 'CoG hidden', 'Ağırlık merkezi gizlendi')) : (t12(language, `🎯 CoG Active`, `🎯 Ağırlık Merkezi: ${massProps.massKg} kg`)));
                          }}
                          className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                            showCenterOfGravity
                              ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                              : 'bg-white/[0.03] border-white/10 text-slate-400'
                          }`}
                        >
                          🎯 {t12(language, `CoG (${massProps.massKg}kg)`, `Ağırlık Merkezi (${massProps.massKg}kg)`)}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Render */}
                  {settingsTab === 'render' && (
                    <div className="space-y-3 p-1">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">{t12(language, '3D Render Mode', '3D Render Modu')}</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'solid', label: t12(language, 'Solid', '🧱 Katı (Solid)') },
                            { id: 'wire', label: t12(language, 'Wireframe', '🕸️ Tel Kafes (Wire)') },
                            { id: 'matcap', label: t12(language, 'MatCap', '🗿 MatCap (Teknik)') },
                            { id: 'pbr', label: t12(language, 'PBR Realistic', '✨ PBR (Gerçekçi)') },
                            { id: 'xray', label: t12(language, 'X-Ray', '🩻 Röntgen (X-Ray)') },
                            { id: 'normals', label: t12(language, 'Normals', '🌈 Normaller') },
                            { id: 'edges', label: t12(language, 'Edges Only', '📐 Keskin Kenarlar') },
                          ].map((rm) => (
                            <button
                              key={rm.id}
                              type="button"
                              onClick={() => setRenderMode(rm.id as any)}
                              className={`p-2.5 rounded-xl border text-[11px] font-bold text-left transition-all ${
                                renderMode === rm.id
                                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                                  : 'bg-white/[0.03] border-white/10 text-slate-400'
                              }`}
                            >
                              {rm.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                        <span className="text-slate-300 font-bold text-xs">{t12(language, 'Ground CAD Grid', 'Zemin CAD Izgarası')}</span>
                        <button
                          type="button"
                          onClick={() => setShowGrid(!showGrid)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                            showGrid ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'bg-white/10 text-slate-400'
                          }`}
                        >
                          {showGrid ? (t12(language, 'ON', 'Açık')) : (t12(language, 'OFF', 'Kapalı'))}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Measure */}
                  {settingsTab === 'measure' && (
                    <div className="space-y-3 p-1">
                      <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-cyan-300 text-xs">📏 {t12(language, '3D CAD Caliper', '3D Kumpas / Ölçüm Aracı')}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const nextTool = tool === 'measure' ? 'select' : 'measure';
                              setTool(nextTool);
                              showToast(nextTool === 'measure' ? (t12(language, 'Caliper Active', '📏 Kumpas Aktif')) : (t12(language, 'Select Mode', 'Seçim Modu')));
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                              tool === 'measure' ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'bg-white/10 text-slate-400'
                            }`}
                          >
                            {tool === 'measure' ? (t12(language, 'Active', 'Aktif')) : (t12(language, 'Enable', 'Aç'))}
                          </button>
                        </div>
                        <p className="text-[10px] text-cyan-400/80">
                          {t12(language, 'Tap surfaces or holes to measure distance and diameters.', 'Yüzeylere veya delik kenarlarına dokunarak milimetrik hassas ölçü alın.')}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">{t12(language, 'Measure Mode', 'Ölçüm Yöntemi')}</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'auto', label: t12(language, 'Auto', '🪄 Oto') },
                            { id: 'distance', label: t12(language, 'Distance', '📐 Mesafe') },
                            { id: 'diameter', label: t12(language, 'Diameter', '⌀ Çap') },
                          ].map((mm) => (
                            <button
                              key={mm.id}
                              type="button"
                              onClick={() => {
                                setMeasureMode(mm.id as any);
                                if (tool !== 'measure') setTool('measure');
                              }}
                              className={`p-2 rounded-xl border text-[10px] font-bold text-center transition-all ${
                                measureMode === mm.id && tool === 'measure'
                                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                                  : 'bg-white/[0.03] border-white/10 text-slate-400'
                              }`}
                            >
                              {mm.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {measurements && measurements.length > 0 && (
                        <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">{t12(language, `Active Measurements (${measurements.length})`, `Aktif Ölçüler (${measurements.length})`)}</span>
                            <button
                              type="button"
                              onClick={clearMeasurements}
                              className="text-[10px] text-rose-400 font-bold hover:underline"
                            >
                              {t12(language, 'Clear', 'Temizle')}
                            </button>
                          </div>
                          <div className="max-h-24 overflow-y-auto space-y-1">
                            {measurements.map((m, idx) => (
                              <div key={m.id || idx} className="flex items-center justify-between text-[11px] text-slate-300 py-1 border-b border-white/5">
                                <span>{m.type === 'diameter' ? `⌀ Çap / Radius` : `Mesafe #${idx + 1}`}</span>
                                <span className="font-mono font-bold text-cyan-300">{m.distance} mm</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 4: Section */}
                  {settingsTab === 'section' && (
                    <div className="space-y-3 p-1">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">{t12(language, 'Section Plane Axis', 'Kesit Düzlemi Ekseni')}</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: 'NONE', label: t12(language, 'None', 'Yok') },
                            { id: 'X', label: 'X (Sol-Sağ)' },
                            { id: 'Y', label: 'Y (Üst-Alt)' },
                            { id: 'Z', label: 'Z (Ön-Arka)' },
                          ].map((ax) => (
                            <button
                              key={ax.id}
                              type="button"
                              onClick={() => setSectionAxis(ax.id as any)}
                              className={`p-2 rounded-xl border text-[10px] font-bold text-center transition-all ${
                                sectionAxis === ax.id
                                  ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                                  : 'bg-white/[0.03] border-white/10 text-slate-400'
                              }`}
                            >
                              {ax.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {sectionAxis !== 'NONE' && (
                        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-rose-300">{t12(language, 'Section Offset', 'Kesit Konumu')}</span>
                            <span className="font-mono font-bold text-rose-400">{sectionOffset} mm</span>
                          </div>
                          <input
                            type="range"
                            min={-150}
                            max={150}
                            step={1}
                            value={sectionOffset}
                            onChange={(e) => setSectionOffset(Number(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                          />
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-400">{t12(language, 'Solid Section Cap', 'Katı Kesit Kapağı')}</span>
                            <button
                              type="button"
                              onClick={() => setSectionSolidCap(!sectionSolidCap)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                sectionSolidCap ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'bg-white/10 text-slate-400'
                              }`}
                            >
                              {sectionSolidCap ? (t12(language, 'Solid', 'Dolu')) : (t12(language, 'Hollow', 'Boş'))}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2D Technical Drawing Portföy Açıcı */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSheetMode('none');
                        setShowTechnicalDrawingModal(true);
                      }}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                    >
                      <FileText size={16} />
                      <span>{t12(language, '📄 2D Drawing & Batch PDF', '📄 2D Teknik Çizim & PDF Portföyü')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sheet Content: Help Guide */}
              {sheetMode === 'help' && (
                <div className="overflow-y-auto py-3 space-y-3 font-mono text-xs text-slate-300 leading-relaxed">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="font-bold text-cyan-400">{t12(language, '1. Add Shape', '1. Şekil Ekle')}</span>
                    <p className="text-[11px] text-slate-400">{t12(language, 'Tap "+ Add" on the dock and pick a mechanical shape.', 'Alttaki "+ Ekle" butonuna dokunup 12 temel şekilden birini seçin.')}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="font-bold text-cyan-400">{t12(language, '2. Select Part', '2. Parçayı Seç')}</span>
                    <p className="text-[11px] text-slate-400">{t12(language, 'Tap any 3D solid directly in the viewport.', '3D sahnedeki herhangi bir parçaya parmağınızla dokunun.')}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="font-bold text-cyan-400">{t12(language, '3. Edit Dimensions', '3. Ölçüleri Düzenle')}</span>
                    <p className="text-[11px] text-slate-400">{t12(language, 'Tap "Edit" to modify width, diameter, wall thickness and color.', '"Düzenle" butonuna basarak uzunluk, çap, et kalınlığı ve renkleri değiştirin.')}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="font-bold text-cyan-400">{t12(language, '4. Export', '4. Dışa Aktar')}</span>
                    <p className="text-[11px] text-slate-400">{t12(language, 'Tap the download icon to save STL file for 3D printing.', 'Üstteki indirme ikonuna dokunarak STL formatında 3D yazıcı çıktısı alın.')}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Mobile 2D Technical Drawing Sheet Modal ─── */}
      {showTechnicalDrawingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 animate-in fade-in">
          <div className="w-full h-full max-h-[96vh] flex flex-col rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white font-mono uppercase">
                  📄 {t12(language, '2D DRAWING', '2D TEKNİK ÇİZİM')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const svgData = generateTechnicalDrawingSVG(parts, massProps, {
                      projectName,
                      materialName: t12(language, activeMaterial.name, activeMaterial.nameTr),
                      partName: t12(language, `Assembly: ${parts.length} Parts`, `Montaj: ${parts.length} Parça`),
                      templateStyle,
                      colorTheme,
                      lang: language,
                    });
                    downloadFile(svgData, `${projectName}_Drawing.svg`, 'image/svg+xml');
                    showToast(t12(language, 'SVG Downloaded', 'SVG İndirildi'));
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/30"
                >
                  <Download size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sheets: Array<{ target: DesignPart | DesignPart[]; massProps: any; config: Partial<DrawingSheetConfig> }> = [
                      {
                        target: parts,
                        massProps,
                        config: {
                          projectName,
                          partName: t12(language, `Full Assembly (${parts.length} Parts)`, `Tüm Montaj (${parts.length} Parça)`),
                          materialName: t12(language, activeMaterial.name, activeMaterial.nameTr),
                          templateStyle,
                          colorTheme,
                          lang: language,
                        },
                      },
                    ];
                    for (const p of parts) {
                      const pMass = calculateAssemblyMassProperties([p], selectedMaterialId);
                      sheets.push({
                        target: [p],
                        massProps: pMass,
                        config: {
                          projectName,
                          partName: p.name || (t12(language, 'Part Detail', 'Parça Detayı')),
                          materialName: t12(language, activeMaterial.name, activeMaterial.nameTr),
                          templateStyle,
                          colorTheme,
                          lang: language,
                        },
                      });
                    }
                    const fullHtml = generateBatchDrawingsHTML(
                      sheets,
                      t12(language, `${projectName} - Technical Drawing Portfolio`, `${projectName} - Teknik Resim Portföyü`)
                    );
                    const printWin = window.open('', '_blank');
                    if (printWin) {
                      printWin.document.write(fullHtml);
                      printWin.document.close();
                      setTimeout(() => {
                        printWin.focus();
                        printWin.print();
                      }, 500);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black text-xs"
                >
                  🖨️ PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowTechnicalDrawingModal(false)}
                  className="p-1.5 rounded-xl bg-white/10 text-slate-300"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 p-2 bg-slate-950 flex items-center justify-center overflow-auto">
              <div
                className="w-full h-full rounded-xl shadow-xl flex items-center justify-center overflow-hidden transition-all"
                style={{
                  background: colorTheme === 'blueprint' ? '#091833' : colorTheme === 'dark' ? '#080c14' : '#ffffff',
                }}
                dangerouslySetInnerHTML={{
                  __html: mobileDrawingSvg,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileDesignStudio;
