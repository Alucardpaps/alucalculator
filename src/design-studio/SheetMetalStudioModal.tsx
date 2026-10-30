'use client';

/**
 * SheetMetalStudioModal — 3D Sheet Metal CAD Workbench, DIN 6935 Unfolder,
 * Cutout Sünme (Plastic Strain Ovalization) Analyzer & Press Brake Bending Sequencer.
 *
 * Integrates directly with Unified3DStudioV2, SheetMetal3DPreview, and designStore.
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Box,
  Download,
  ExternalLink,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Layers,
  Wrench,
  ShieldAlert,
  CircleDot,
  Maximize2,
  Info,
  Upload,
  Sparkles,
  Zap,
  FileCode,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import {
  useDesignStore,
  customCADGeometries,
  type DesignPart,
} from '@/design-studio/designStore';
import { saveCADGeometry } from '@/design-studio/cadGeometryStorage';
import {
  SheetMetalSpec,
  SheetMetalBendRow,
  SheetMetalCutout,
  SheetMetalCutoutType,
  SheetMetalEdgeType,
  SheetMetalWidthMode,
  SHEET_METAL_PRESETS,
  calculateSheetMetalAnalysis,
  buildSheetMetal3DGeometry,
  computeSheetMetalContour2D,
  exportSheetMetalFlatPatternDXF,
  savePendingSheetMetalForCalculator,
  analyzeAllCutoutsDeformation,
  calculatePressBrakeFeasibility,
  getFlangeAvailableEdgeLength,
  applyReliefSlitRemedy,
  offsetCutoutSafeRemedy,
  togglePreCompensationRemedy,
  togglePostBendRemedy,
  parseDxfOrSvgCutoutContent,
  parseDxfOrSvgCutouts,
} from '@/design-studio/sheetMetalEngine';
import { SheetMetal3DPreview } from '@/components/modules/mechanical/SheetMetal3DPreview';

interface SheetMetalStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSpec?: SheetMetalSpec | null;
  editingPartId?: string | null;
  initialTab?: 'bends' | 'cutouts' | 'pressbrake';
}

export function SheetMetalStudioModal({
  isOpen,
  onClose,
  initialSpec,
  editingPartId,
  initialTab,
}: SheetMetalStudioModalProps) {
  const router = useRouter();
  const { language } = useI18nStore();
  const isTr = language === 'tr';

  const defaultSpec = useMemo<SheetMetalSpec>(() => {
    if (initialSpec) return initialSpec;
    const cPreset = SHEET_METAL_PRESETS.find((p) => p.id === 'c_enclosure');
    return cPreset ? cPreset.spec : SHEET_METAL_PRESETS[0].spec;
  }, [initialSpec]);

  const [spec, setSpec] = useState<SheetMetalSpec>(defaultSpec);
  const [editorTab, setEditorTab] = useState<'bends' | 'cutouts' | 'pressbrake'>(initialTab || 'bends');

  // Sync when initialSpec or initialTab changes
  React.useEffect(() => {
    if (initialSpec) {
      setSpec(initialSpec);
    }
    if (initialTab) {
      setEditorTab(initialTab);
    }
  }, [initialSpec, initialTab]);

  const analysis = useMemo(() => calculateSheetMetalAnalysis(spec), [spec]);
  const deformations = useMemo(() => analyzeAllCutoutsDeformation(spec), [spec]);
  const feasibility = useMemo(() => calculatePressBrakeFeasibility(spec), [spec]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const updateSpec = (patch: Partial<SheetMetalSpec>) => {
    setSpec((prev) => ({ ...prev, ...patch }));
  };

  const applyPreset = (presetId: string) => {
    const p = SHEET_METAL_PRESETS.find((item) => item.id === presetId);
    if (!p) return;
    setSpec({
      ...p.spec,
      id: spec.id,
    });
  };

  /* ─── Custom Bend Manager ─── */
  const addBend = (targetFlangeIndex?: number, edge?: SheetMetalEdgeType) => {
    const nextId = `b_${Date.now()}`;
    const nextTargetFlange = targetFlangeIndex !== undefined ? targetFlangeIndex : spec.bends.length;
    const nextEdge = edge || 'end';
    const availLen = getFlangeAvailableEdgeLength(spec, nextTargetFlange, nextEdge);
    setSpec((prev) => ({
      ...prev,
      bends: [
        ...prev.bends,
        {
          id: nextId,
          targetFlangeIndex: nextTargetFlange,
          edge: nextEdge,
          angle: 90,
          radius: Math.max(1, prev.thickness),
          flange: 40,
          direction: 'up',
          widthMode: 'full',
          flangeWidth: availLen,
          offsetStart: 0,
          offsetEnd: 0,
        },
      ],
    }));
  };

  const updateBend = (idx: number, patch: Partial<SheetMetalBendRow>) => {
    setSpec((prev) => {
      const nextBends = [...prev.bends];
      nextBends[idx] = { ...nextBends[idx], ...patch };
      return { ...prev, bends: nextBends };
    });
  };

  const removeBend = (idx: number) => {
    setSpec((prev) => ({
      ...prev,
      bends: prev.bends.filter((_, i) => i !== idx),
    }));
  };

  /* ─── Cutout / Hole Manager ─── */
  const addCutout = (
    type: SheetMetalCutoutType,
    customData?: { name?: string; profile?: Array<{ x: number; y: number }>; width?: number; length?: number }
  ) => {
    const nextId = `c_${Date.now()}`;
    let defaultName = isTr ? 'Delik' : 'Hole';
    let defaultDiameter: number | undefined = undefined;
    let defaultWidth: number | undefined = undefined;
    let defaultLength: number | undefined = undefined;
    let defaultCornerRadius: number | undefined = undefined;
    let defaultProfile = customData?.profile;

    switch (type) {
      case 'round_hole':
        defaultName = isTr ? 'Delik Ø8.5' : 'Hole Ø8.5';
        defaultDiameter = 8.5;
        break;
      case 'slot':
        defaultName = isTr ? 'Slot 10x25' : 'Slot 10x25';
        defaultWidth = 10;
        defaultLength = 25;
        break;
      case 'rect_cutout':
        defaultName = isTr ? 'Kesik 20x40' : 'Cutout 20x40';
        defaultWidth = 20;
        defaultLength = 40;
        break;
      case 'pocket':
        defaultName = isTr ? 'Havuz Boşaltması' : 'Pocket Void';
        defaultWidth = 30;
        defaultLength = 50;
        defaultCornerRadius = 3;
        break;
      case 'tab':
        defaultName = isTr ? 'Balkon Dilim Kesik' : 'Tab Slice Cut';
        defaultWidth = 15;
        defaultLength = 30;
        break;
      case 'corner_notch':
        defaultName = isTr ? 'Köşe Kertmesi' : 'Corner Notch';
        defaultWidth = 15;
        defaultLength = 15;
        break;
      case 'louver':
        defaultName = isTr ? 'Louver Panjur' : 'Louver Vent';
        defaultWidth = 12;
        defaultLength = 45;
        break;
      case 'nema_mount':
        defaultName = isTr ? 'NEMA 23 Motor Yuvası' : 'NEMA 23 Mount';
        defaultWidth = 47.14;
        defaultLength = 47.14;
        defaultDiameter = 38.1;
        break;
      case 'din_keyway':
        defaultName = isTr ? 'DIN 6885 Kama Slotu' : 'DIN 6885 Keyway';
        defaultWidth = 8;
        defaultLength = 28;
        break;
      case 'custom_path':
        defaultName = customData?.name || (isTr ? 'Özel DXF/SVG Kesim' : 'Custom Cutout');
        defaultWidth = customData?.width || 25;
        defaultLength = customData?.length || 25;
        break;
    }

    const newCutout: SheetMetalCutout = {
      id: nextId,
      name: defaultName,
      type,
      flangeIndex: 0,
      posU: Math.round(spec.firstFlange / 2),
      posV: Math.round(spec.length / 2),
      diameter: defaultDiameter,
      width: defaultWidth,
      length: defaultLength,
      cornerRadius: defaultCornerRadius,
      profile: defaultProfile,
      sourceFileName: customData?.name,
    };

    setSpec((prev) => ({
      ...prev,
      cutouts: [...(prev.cutouts || []), newCutout],
    }));
  };

  const updateCutout = (idx: number, patch: Partial<SheetMetalCutout>) => {
    setSpec((prev) => {
      const nextCutouts = [...(prev.cutouts || [])];
      nextCutouts[idx] = { ...nextCutouts[idx], ...patch };
      return { ...prev, cutouts: nextCutouts };
    });
  };

  const removeCutout = (idx: number) => {
    setSpec((prev) => ({
      ...prev,
      cutouts: (prev.cutouts || []).filter((_, i) => i !== idx),
    }));
  };

  /* ─── 4 Proactive Sünme / DFM Remedies Handler ─── */
  const handleApplyRemedy = (
    remedyType: 'relief_slit' | 'offset_safe' | 'pre_compensate' | 'post_bend',
    cutoutId: string
  ) => {
    setSpec((prev) => {
      switch (remedyType) {
        case 'relief_slit':
          return applyReliefSlitRemedy(prev, cutoutId);
        case 'offset_safe':
          return offsetCutoutSafeRemedy(prev, cutoutId);
        case 'pre_compensate':
          return togglePreCompensationRemedy(prev, cutoutId);
        case 'post_bend':
          return togglePostBendRemedy(prev, cutoutId);
        default:
          return prev;
      }
    });
  };

  const handleInsertOrUpdateInScene = async () => {
    const partId = editingPartId || `sheet_metal_${Date.now()}`;
    const geom = buildSheetMetal3DGeometry(spec, 0);
    const contour = computeSheetMetalContour2D(spec, 0);

    customCADGeometries.set(partId, geom);
    await saveCADGeometry(partId, geom).catch(() => {});

    const store = useDesignStore.getState();
    const existing = store.parts.find((p) => p.id === partId);

    if (existing) {
      store.updatePart(partId, {
        name: spec.name,
        color: spec.color || '#38bdf8',
        params: {
          ...existing.params,
          sheetMetalSpec: spec,
          unfoldProgress01: 0,
          w: contour.bounds.width,
          h: spec.length,
          d: contour.bounds.height,
        },
      });
      store.select(partId);
    } else {
      const newId = store.importCADModel(
        spec.name,
        geom,
        { x: 0, y: contour.bounds.height / 2, z: 0 },
        spec.color || '#38bdf8',
        {
          width: contour.bounds.width,
          height: spec.length,
          depth: contour.bounds.height,
        }
      );
      store.updatePart(newId, {
        params: {
          sheetMetalSpec: spec,
          unfoldProgress01: 0,
          w: contour.bounds.width,
          h: spec.length,
          d: contour.bounds.height,
        },
      });
      store.select(newId);
    }

    onClose();
  };

  const handleDownloadDXF = () => {
    const dxf = exportSheetMetalFlatPatternDXF(spec);
    const blob = new Blob([dxf], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${spec.name.replace(/\s+/g, '_').toLowerCase()}_din6935_flat.dxf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenInCalculator = () => {
    savePendingSheetMetalForCalculator(spec);
    router.push('/sheet-metal/');
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-3 sm:p-5 select-none animate-fadeIn">
      <div className="relative w-full max-w-7xl h-[92vh] flex flex-col bg-[var(--bg-0)] border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header Strip */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-[var(--bg-1)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/35 text-cyan-300">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-mono font-black uppercase tracking-wider text-slate-100">
                  {isTr
                    ? '3B SAC LEVHA, SÜNME & ABKANT ATÖLYESİ'
                    : '3D SHEET METAL, HOLE STRAIN & PRESS BRAKE WORKBENCH'}
                </h2>
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-[9px] font-mono font-bold text-cyan-300">
                  DIN 6935 / VDI 3389
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-500">
                {isTr
                  ? 'Çok bükümlü sac modelleme, delik sünmesi (ovalizasyon) simülasyonu ve abkant çarpışma denetimi'
                  : 'Parametric multi-bend CAD, hole tensile strain ovalization simulation & press brake collision gate'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenInCalculator}
              className="px-2.5 py-1.5 rounded text-[10px] font-mono font-bold bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3 h-3 text-cyan-400" />
              {isTr ? '/sheet-metal/ Hesaplayıcıda Aç' : 'Open in /sheet-metal/'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preset Quick Bar */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-0)] border-b border-slate-800/90 overflow-x-auto flex-shrink-0">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mr-1">
            {isTr ? 'Şablonlar:' : 'Presets:'}
          </span>
          {SHEET_METAL_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className="px-2.5 py-1 rounded bg-[var(--bg-1)] hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-[10.5px] font-mono font-semibold text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span className="text-cyan-400 font-bold">{preset.badge}</span>
              <span>{isTr ? preset.labelTr : preset.labelEn}</span>
            </button>
          ))}
        </div>

        {/* Main 3-Column Studio Body */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column: Form Parameters, Bends & Cutouts */}
          <div className="w-full lg:w-[360px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800 bg-[var(--bg-0)] flex flex-col overflow-hidden">
            {/* Editor Sub-Tabs */}
            <div className="grid grid-cols-3 gap-1 p-2 bg-[var(--bg-1)] border-b border-slate-800 flex-shrink-0">
              <button
                type="button"
                onClick={() => setEditorTab('bends')}
                className={`py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
                  editorTab === 'bends'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isTr ? '📐 Bükümler' : '📐 Bends'} ({spec.bends.length})
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('cutouts')}
                className={`py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
                  editorTab === 'cutouts'
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isTr ? '🕳️ Delik/Kesik' : '🕳️ Cutouts'} ({spec.cutouts?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('pressbrake')}
                className={`py-1 rounded text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-1 transition-colors ${
                  editorTab === 'pressbrake'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wrench className="w-3 h-3 text-amber-400" />
                {isTr ? '🚜 Abkant' : '🚜 Press'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar text-[11px] font-mono">
              {/* Part Name & Global Material Specs */}
              <div className="p-2.5 rounded-lg border border-slate-800 bg-[var(--bg-1)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">
                    {isTr ? 'PARÇA TANIMI & ÖLÇÜLER' : 'PART SPECS'}
                  </span>
                  <span className="text-[9.5px] text-slate-500">{spec.materialName}</span>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">
                    {isTr ? 'Parça Adı' : 'Part Name'}
                  </label>
                  <input
                    type="text"
                    value={spec.name}
                    onChange={(e) => updateSpec({ name: e.target.value })}
                    className="w-full bg-[var(--bg-0)] border border-slate-800 rounded px-2.5 py-1 text-slate-200 outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">
                      {isTr ? 'Kalınlık t (mm)' : 'Thickness t (mm)'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="20"
                      value={spec.thickness}
                      onChange={(e) => updateSpec({ thickness: Number(e.target.value) })}
                      className="w-full bg-[var(--bg-0)] border border-slate-800 rounded px-2 py-1 text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">
                      {isTr ? 'Büküm Boyu L (mm)' : 'Bend Length L (mm)'}
                    </label>
                    <input
                      type="number"
                      step="10"
                      min="10"
                      max="3000"
                      value={spec.length}
                      onChange={(e) => updateSpec({ length: Number(e.target.value) })}
                      className="w-full bg-[var(--bg-0)] border border-slate-800 rounded px-2 py-1 text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">
                    {isTr ? 'İlk Dış Flanş F0 (mm)' : 'First Outer Flange F0 (mm)'}
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="5"
                    max="1000"
                    value={spec.firstFlange}
                    onChange={(e) => updateSpec({ firstFlange: Number(e.target.value) })}
                    className="w-full bg-[var(--bg-0)] border border-slate-800 rounded px-2 py-1 text-slate-200 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* TAB 1: CUSTOM BENDS MANAGER */}
              {editorTab === 'bends' && (
                <div className="p-2.5 rounded-lg border border-slate-800 bg-[var(--bg-1)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">
                      {isTr ? 'BÜKÜM SIRALAMASI' : 'BENDS SEQUENCE'} ({spec.bends.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => addBend()}
                      className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-[10px] font-bold text-cyan-300 flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      {isTr ? 'Büküm Ekle' : 'Add Bend'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {spec.bends.map((b, idx) => {
                      const targetFlangeIdx = b.targetFlangeIndex ?? idx;
                      const edgeType = b.edge ?? 'end';
                      const availLen = getFlangeAvailableEdgeLength(spec, targetFlangeIdx, edgeType);
                      const isPartial = b.widthMode === 'partial';
                      const y = Math.max(0, b.offsetStart ?? 25);
                      const z = Math.max(1, Math.min(availLen - y, b.flangeWidth ?? Math.max(1, availLen - 50)));
                      const x = Math.max(0, availLen - y - z);

                      return (
                        <div
                          key={b.id || idx}
                          className="p-2.5 rounded-lg border border-slate-800 bg-[var(--bg-0)] space-y-2"
                        >
                          {/* Row 1: Title, Direction Badge & Delete */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-200">
                                #{idx + 1} {isTr ? 'Büküm' : 'Bend'}
                              </span>
                              {edgeType === 'side_a' && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[8.5px] font-bold border border-amber-500/40">
                                  {isTr ? 'Ön Kenar (1. Resim)' : 'Front Edge'}
                                </span>
                              )}
                              {isPartial && (
                                <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[8.5px] font-bold border border-cyan-500/40">
                                  {isTr ? 'Kısmi (y,z,x)' : 'Partial'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  updateBend(idx, {
                                    direction: b.direction === 'up' ? 'down' : 'up',
                                  })
                                }
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase transition-colors ${
                                  b.direction === 'up'
                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                    : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                }`}
                              >
                                {b.direction === 'up' ? 'UP (↑)' : 'DOWN (↓)'}
                              </button>
                              {spec.bends.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeBend(idx)}
                                  className="p-1 rounded hover:bg-red-950/40 text-slate-600 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Row 2: Target Flange & Edge Selection (User Request: "seçili kenardan büküm eklemek istiyorum") */}
                          <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded bg-[var(--bg-1)] border border-slate-800/80">
                            <div>
                              <label className="text-[8.5px] text-slate-400 block mb-0.5 font-bold">
                                {isTr ? 'Bağlı Olduğu Flanş' : 'Target Flange'}
                              </label>
                              <select
                                value={targetFlangeIdx}
                                onChange={(e) => updateBend(idx, { targetFlangeIndex: Number(e.target.value) })}
                                className="w-full bg-[var(--bg-0)] border border-slate-700/80 rounded px-1.5 py-0.5 text-slate-200 text-[9.5px] outline-none focus:border-cyan-500"
                              >
                                <option value={0}>{isTr ? 'F0 (Taban Sacı)' : 'F0 (Base Sheet)'}</option>
                                {spec.bends.map((_, fIdx) => (
                                  <option key={fIdx + 1} value={fIdx + 1}>
                                    Flanş #{fIdx + 1} ({spec.bends[fIdx]?.flange || 40}mm)
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[8.5px] text-slate-400 block mb-0.5 font-bold">
                                {isTr ? 'Büküm Kenarı' : 'Bend Edge'}
                              </label>
                              <select
                                value={edgeType}
                                onChange={(e) => {
                                  const newEdge = e.target.value as SheetMetalEdgeType;
                                  const newAvail = getFlangeAvailableEdgeLength(spec, targetFlangeIdx, newEdge);
                                  updateBend(idx, {
                                    edge: newEdge,
                                    flangeWidth: Math.min(newAvail, b.flangeWidth ?? newAvail),
                                  });
                                }}
                                className="w-full bg-[var(--bg-0)] border border-slate-700/80 rounded px-1.5 py-0.5 text-cyan-300 text-[9.5px] font-bold outline-none focus:border-cyan-500"
                              >
                                <option value="end">{isTr ? 'Uç Kenar (Normal)' : 'End Edge (Tip)'}</option>
                                <option value="side_a">🎯 {isTr ? 'Ön Yan Kenar (1. Resimdeki Ok)' : 'Side A (Front Edge)'}</option>
                                <option value="side_b">{isTr ? 'Arka Yan Kenar (Side B)' : 'Side B (Rear Edge)'}</option>
                                <option value="start">{isTr ? 'Taban Başlangıç Kenarı' : 'Start Edge'}</option>
                                <option value="radius_curved">🌟 {isTr ? 'Kavisli / Radius Kenar (Kalıpla Kase Bükümü)' : 'Curved / Radius Edge (Mould Bowl Bend)'}</option>
                              </select>
                            </div>

                            {/* Mould Requirement Warning for Curved/Radius Bends */}
                            {edgeType === 'radius_curved' && (
                              <div className="col-span-2 p-2 rounded bg-amber-950/70 border border-amber-500 text-amber-200 text-[9px] space-y-1.5 mt-1">
                                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span>{isTr ? '⚠️ Kavisli / Radius Kenar Bükümü: Kalıp Şart!' : '⚠️ Curved Radius Bend: Mould Required!'}</span>
                                </div>
                                <p className="text-[8.5px] text-amber-200/90 leading-tight">
                                  {isTr
                                    ? 'Bu büküm standart abkant pres yerine Derin Çekme Pres Kalıbı (Stamping Die) gerektirir. Kalıpla kase veya kavisli flanş açınımı uygulanır.'
                                    : 'Cannot be bent on standard press brake tooling. Requires Deep Drawing Stamping Die. Mould dish/bowl unfolding applied.'}
                                </p>
                                <div className="flex items-center gap-2">
                                  <label className="text-[8.5px] font-bold text-amber-300">
                                    {isTr ? 'Kavis Yarıçapı R (mm):' : 'Curved Radius R (mm):'}
                                  </label>
                                  <input
                                    type="number"
                                    min="5"
                                    max="500"
                                    value={b.curvedRadiusMm || 35}
                                    onChange={(e) => updateBend(idx, { curvedRadiusMm: Number(e.target.value) })}
                                    className="w-20 bg-[var(--bg-0)] border border-amber-500/60 rounded px-1.5 py-0.5 text-amber-200 text-[9.5px] outline-none"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Row 3: Dimensions (Açı, R, F) */}
                          <div className="grid grid-cols-3 gap-1.5">
                            <div>
                              <label className="text-[9px] text-slate-400 block font-semibold">
                                {isTr ? 'Açı (°)' : 'Angle (°)'}
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="179"
                                value={b.angle}
                                onChange={(e) => updateBend(idx, { angle: Number(e.target.value) })}
                                className="w-full bg-[var(--bg-1)] border border-slate-800 rounded px-1.5 py-0.5 text-slate-200 outline-none focus:border-cyan-500 text-[10px]"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 block font-semibold">
                                {isTr ? 'Yarıçap R' : 'Radius R'}
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                min="0.5"
                                value={b.radius}
                                onChange={(e) => updateBend(idx, { radius: Number(e.target.value) })}
                                className="w-full bg-[var(--bg-1)] border border-slate-800 rounded px-1.5 py-0.5 text-slate-200 outline-none focus:border-cyan-500 text-[10px]"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 block font-semibold">
                                {isTr ? 'Flanş F (mm)' : 'Flange F'}
                              </label>
                              <input
                                type="number"
                                step="5"
                                min="5"
                                value={b.flange}
                                onChange={(e) => updateBend(idx, { flange: Number(e.target.value) })}
                                className="w-full bg-[var(--bg-1)] border border-slate-800 rounded px-1.5 py-0.5 text-slate-200 outline-none focus:border-cyan-500 text-[10px]"
                              />
                            </div>
                          </div>

                          {/* Row 4: Width Mode Selector (User Request: "bükümleri çizginin her zaman heryerine yaymasın 2. resimdeki gibi olsun") */}
                          <div className="pt-1 border-t border-slate-800/80">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-bold text-slate-400">
                                {isTr ? 'BÜKÜM GENİŞLİĞİ' : 'BEND WIDTH'}:
                              </span>
                              <div className="flex items-center gap-1 bg-[var(--bg-1)] p-0.5 rounded border border-slate-800">
                                <button
                                  type="button"
                                  onClick={() => updateBend(idx, { widthMode: 'full' })}
                                  className={`px-2 py-0.5 rounded text-[8.5px] font-bold transition-all ${
                                    !isPartial
                                      ? 'bg-slate-700 text-white shadow'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {isTr ? 'Tam Kenar' : 'Full Edge'} ({availLen}mm)
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateBend(idx, {
                                      widthMode: 'partial',
                                      offsetStart: b.offsetStart ?? Math.round(availLen * 0.15),
                                      flangeWidth: b.flangeWidth ?? Math.round(availLen * 0.7),
                                      offsetEnd: Math.max(0, availLen - (b.offsetStart ?? Math.round(availLen * 0.15)) - (b.flangeWidth ?? Math.round(availLen * 0.7))),
                                    })
                                  }
                                  className={`px-2 py-0.5 rounded text-[8.5px] font-bold transition-all flex items-center gap-1 ${
                                    isPartial
                                      ? 'bg-cyan-500/25 border border-cyan-500/50 text-cyan-300 shadow'
                                      : 'text-slate-400 hover:text-cyan-300'
                                  }`}
                                >
                                  <span>✂️</span>
                                  <span>{isTr ? 'Kısmi (2. Resim: y, z, x)' : 'Partial (y, z, x)'}</span>
                                </button>
                              </div>
                            </div>

                            {/* PARTIAL FLANGE DETAILS (y, z, x from Image 2!) */}
                            {isPartial && (
                              <div className="p-2 rounded bg-[var(--bg-1)] border border-cyan-500/30 space-y-2 mt-1.5 animate-fadeIn">
                                <div className="flex items-center justify-between text-[9px] text-cyan-300">
                                  <span className="font-bold">📐 {isTr ? '2. Resimdeki Kenar Bölümü' : 'Edge Partitioning (Image 2)'}:</span>
                                  <span className="text-[8.5px] font-mono text-slate-400">
                                    y + z + x = {availLen} mm
                                  </span>
                                </div>

                                <div className="grid grid-cols-3 gap-1.5">
                                  <div className="bg-[var(--bg-0)] p-1.5 rounded border border-slate-800">
                                    <label className="text-[8.5px] font-bold text-amber-300 block mb-0.5">
                                      y ({isTr ? 'Sol Boşluk' : 'Left Offset'})
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max={availLen - 5}
                                      value={y}
                                      onChange={(e) => {
                                        const newY = Math.max(0, Number(e.target.value));
                                        const newZ = Math.min(availLen - newY, z);
                                        updateBend(idx, {
                                          offsetStart: newY,
                                          flangeWidth: newZ,
                                          offsetEnd: Math.max(0, availLen - newY - newZ),
                                        });
                                      }}
                                      className="w-full bg-[var(--bg-1)] border border-slate-700 rounded px-1.5 py-0.5 text-amber-200 text-[10px] font-mono font-bold outline-none focus:border-amber-400"
                                    />
                                  </div>

                                  <div className="bg-[var(--bg-0)] p-1.5 rounded border border-cyan-500/40">
                                    <label className="text-[8.5px] font-bold text-cyan-300 block mb-0.5">
                                      z ({isTr ? 'Büküm Genişliği' : 'Flange Width'})
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      max={availLen - y}
                                      value={z}
                                      onChange={(e) => {
                                        const newZ = Math.max(1, Math.min(availLen - y, Number(e.target.value)));
                                        updateBend(idx, {
                                          flangeWidth: newZ,
                                          offsetEnd: Math.max(0, availLen - y - newZ),
                                        });
                                      }}
                                      className="w-full bg-[var(--bg-1)] border border-cyan-500/60 rounded px-1.5 py-0.5 text-cyan-200 text-[10px] font-mono font-bold outline-none focus:border-cyan-400"
                                    />
                                  </div>

                                  <div className="bg-[var(--bg-0)] p-1.5 rounded border border-slate-800">
                                    <label className="text-[8.5px] font-bold text-amber-300 block mb-0.5">
                                      x ({isTr ? 'Sağ Boşluk' : 'Right Offset'})
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max={availLen - y - 1}
                                      value={x}
                                      onChange={(e) => {
                                        const newX = Math.max(0, Number(e.target.value));
                                        const newZ = Math.max(1, availLen - y - newX);
                                        updateBend(idx, {
                                          flangeWidth: newZ,
                                          offsetEnd: newX,
                                        });
                                      }}
                                      className="w-full bg-[var(--bg-1)] border border-slate-700 rounded px-1.5 py-0.5 text-amber-200 text-[10px] font-mono font-bold outline-none focus:border-amber-400"
                                    />
                                  </div>
                                </div>

                                {/* Live Visual Schematic Bar (Mirror of User's Image 2!) */}
                                <div className="space-y-1">
                                  <div className="h-4 w-full rounded flex overflow-hidden border border-slate-700 bg-slate-900 text-[8px] font-mono font-bold text-center">
                                    {y > 0 && (
                                      <div
                                        style={{ width: `${(y / availLen) * 100}%` }}
                                        className="h-full bg-slate-800 text-slate-400 flex items-center justify-center border-r border-slate-700 overflow-hidden"
                                        title={`y (Sol Boşluk): ${y} mm`}
                                      >
                                        y:{y}
                                      </div>
                                    )}
                                    <div
                                      style={{ width: `${(z / availLen) * 100}%` }}
                                      className="h-full bg-cyan-600/60 text-cyan-100 flex items-center justify-center font-black border-r border-cyan-400/50 shadow-inner overflow-hidden"
                                      title={`z (Bükülen Kısım): ${z} mm`}
                                    >
                                      z:{z} mm (BÜKÜM)
                                    </div>
                                    {x > 0 && (
                                      <div
                                        style={{ width: `${(x / availLen) * 100}%` }}
                                        className="h-full bg-slate-800 text-slate-400 flex items-center justify-center overflow-hidden"
                                        title={`x (Sağ Boşluk): ${x} mm`}
                                      >
                                        x:{x}
                                      </div>
                                    )}
                                  </div>

                                  {/* Quick Alignment Presets */}
                                  <div className="flex items-center gap-1 pt-0.5">
                                    <span className="text-[8px] text-slate-500 uppercase font-bold mr-1">{isTr ? 'Hızlı:' : 'Quick:'}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const halfRem = Math.round((availLen - z) / 2);
                                        updateBend(idx, {
                                          offsetStart: halfRem,
                                          offsetEnd: availLen - halfRem - z,
                                        });
                                      }}
                                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[8px] font-bold cursor-pointer"
                                    >
                                      🎯 {isTr ? 'Ortala' : 'Center'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateBend(idx, {
                                          offsetStart: 0,
                                          offsetEnd: availLen - z,
                                        });
                                      }}
                                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[8px] font-bold cursor-pointer"
                                    >
                                      ⬅️ {isTr ? 'Sola' : 'Left'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateBend(idx, {
                                          offsetStart: availLen - z,
                                          offsetEnd: 0,
                                        });
                                      }}
                                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[8px] font-bold cursor-pointer"
                                    >
                                      ➡️ {isTr ? 'Sağa' : 'Right'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: CUTOUTS, HOLES & SÜNME MANAGER */}
              {editorTab === 'cutouts' && (
                <div className="p-2.5 rounded-lg border border-slate-800 bg-[var(--bg-1)] space-y-3">
                  {/* Toolbar & File Upload */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider">
                        {isTr ? 'DELİK VE KESİKLER' : 'HOLES & CUTOUTS'}
                      </span>
                      {/* Hidden DXF/SVG file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".dxf,.svg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const content = ev.target?.result as string;
                            if (!content) return;
                            const cutouts = parseDxfOrSvgCutouts(content, file.name);
                            if (cutouts && cutouts.length > 0) {
                              cutouts.forEach((c) => addCutout('custom_path', c));
                            } else {
                              alert(isTr ? 'DXF/SVG konturu okunamadı veya kapalı bir poligon bulunamadı.' : 'Could not parse closed 2D polygon from file.');
                            }
                          };
                          reader.readAsText(file);
                          e.target.value = '';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[9px] font-bold text-emerald-300 flex items-center gap-1 transition-colors"
                        title={isTr ? 'Özel DXF veya SVG çizimi içe aktar' : 'Upload custom DXF or SVG'}
                      >
                        <Upload className="w-3 h-3" />
                        <span>{isTr ? '📁 DXF / SVG Yükle' : 'Upload DXF/SVG'}</span>
                      </button>
                    </div>

                    {/* Quick Add Buttons by Category */}
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => addCutout('round_hole')}
                        className="px-1.5 py-1 rounded bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-[9px] font-bold text-violet-300 text-center"
                      >
                        ⭕ {isTr ? 'Delik' : 'Hole'}
                      </button>
                      <button
                        type="button"
                        onClick={() => addCutout('slot')}
                        className="px-1.5 py-1 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-[9px] font-bold text-cyan-300 text-center"
                      >
                        🕳️ {isTr ? 'Slot' : 'Slot'}
                      </button>
                      <button
                        type="button"
                        onClick={() => addCutout('rect_cutout')}
                        className="px-1.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[9px] font-bold text-amber-300 text-center"
                      >
                        ⬛ {isTr ? 'Kesik' : 'Rect Cut'}
                      </button>
                      <button
                        type="button"
                        onClick={() => addCutout('pocket')}
                        className="px-1.5 py-1 rounded bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-[9px] font-bold text-blue-300 text-center"
                        title={isTr ? 'İç Havuz Boşaltması' : 'Interior Pocket Void'}
                      >
                        🔲 {isTr ? 'Havuz' : 'Pocket'}
                      </button>
                      <button
                        type="button"
                        onClick={() => addCutout('tab')}
                        className="px-1.5 py-1 rounded bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-500/30 text-[9px] font-bold text-fuchsia-300 text-center"
                        title={isTr ? 'Balkon / Sac Kulağı Dilim Kesiği' : 'Tab Slice Cut'}
                      >
                        🏷️ {isTr ? 'Balkon' : 'Tab Cut'}
                      </button>
                      <button
                        type="button"
                        onClick={() => addCutout('corner_notch')}
                        className="px-1.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-[9px] font-bold text-rose-300 text-center"
                        title={isTr ? 'Köşe Kertmesi' : 'Corner Notch'}
                      >
                        📐 {isTr ? 'Köşe Kert' : 'Notch'}
                      </button>
                      <button
                        type="button"
                        onClick={() => addCutout('louver')}
                        className="px-1.5 py-1 rounded bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-[9px] font-bold text-teal-300 text-center"
                        title={isTr ? 'Louver Havalandırma Panjuru' : 'Louver Vent'}
                      >
                        💨 {isTr ? 'Louver' : 'Louver'}
                      </button>
                      <button
                        type="button"
                        onClick={() => addCutout('nema_mount')}
                        className="px-1.5 py-1 rounded bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-[9px] font-bold text-indigo-300 text-center"
                        title={isTr ? 'NEMA Step/Servo Yuvası' : 'NEMA Motor Mount'}
                      >
                        ⚙️ NEMA 23
                      </button>
                      <button
                        type="button"
                        onClick={() => addCutout('din_keyway')}
                        className="px-1.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[9px] font-bold text-emerald-300 text-center"
                        title={isTr ? 'DIN 6885 Kama Kanalı' : 'DIN 6885 Keyway'}
                      >
                        🔑 {isTr ? 'DIN Kama' : 'Keyway'}
                      </button>
                    </div>
                  </div>

                  {(!spec.cutouts || spec.cutouts.length === 0) && (
                    <div className="p-3 text-center border border-dashed border-slate-800 rounded text-slate-500 text-[10px]">
                      {isTr
                        ? 'Henüz delik veya kesik eklenmedi. Yukarıdaki butonlarla sac yüzeyine montaj deliği, slot, havuz, balkon veya DXF/SVG çizimi ekleyebilirsiniz.'
                        : 'No cutouts added yet. Use the buttons above to stamp holes, slots, pockets, tabs or custom DXF/SVG profiles.'}
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {spec.cutouts?.map((c, idx) => {
                      const def = deformations[idx];
                      const isDistorted = def && def.riskLevel !== 'SAFE';

                      return (
                        <div
                          key={c.id || idx}
                          className={`p-2.5 rounded border bg-[var(--bg-0)] space-y-2 ${
                            def?.riskLevel === 'SEVERE_TEARING'
                              ? 'border-red-500/60'
                              : isDistorted
                              ? 'border-amber-500/50'
                              : 'border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-200">
                                {c.name || `#${idx + 1}`}
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[8.5px] font-mono font-bold text-slate-300 uppercase">
                                {c.type === 'round_hole' ? 'Ø DELİK'
                                  : c.type === 'slot' ? 'SLOT'
                                  : c.type === 'rect_cutout' ? 'KESİK'
                                  : c.type === 'pocket' ? 'HAVUZ (POCKET)'
                                  : c.type === 'tab' ? 'BALKON (TAB)'
                                  : c.type === 'corner_notch' ? 'KÖŞE KERTMESİ'
                                  : c.type === 'louver' ? 'LOUVER'
                                  : c.type === 'nema_mount' ? 'NEMA MOTOR'
                                  : c.type === 'din_keyway' ? 'DIN KAMA'
                                  : 'ÖZEL KESİM (DXF/SVG)'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCutout(idx)}
                              className="p-1 rounded hover:bg-red-950/40 text-slate-600 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Flange & Position Controls */}
                          <div className="grid grid-cols-3 gap-1.5">
                            <div>
                              <label className="text-[9px] text-slate-500 block">
                                {isTr ? 'Hangi Flanş?' : 'Flange'}
                              </label>
                              <select
                                value={c.flangeIndex}
                                onChange={(e) => updateCutout(idx, { flangeIndex: Number(e.target.value) })}
                                className="w-full bg-[var(--bg-1)] border border-slate-800 rounded px-1.5 py-0.5 text-slate-200 text-[10px] outline-none focus:border-cyan-500"
                              >
                                <option value={0}>Flanş F0 ({spec.firstFlange}mm)</option>
                                {spec.bends.map((b, bIdx) => (
                                  <option key={bIdx} value={bIdx + 1}>
                                    Flanş F{bIdx + 1} ({b.flange}mm)
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[9px] text-slate-500 block">
                                {isTr ? 'Flanş Boyu (u)' : 'Pos u (mm)'}
                              </label>
                              <input
                                type="number"
                                step="2"
                                min="0"
                                value={c.posU}
                                onChange={(e) => updateCutout(idx, { posU: Number(e.target.value) })}
                                className="w-full bg-[var(--bg-1)] border border-slate-800 rounded px-1.5 py-0.5 text-slate-200 text-[10px] outline-none focus:border-cyan-500"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] text-slate-500 block">
                                {isTr ? 'En Boyu (v)' : 'Pos v (mm)'}
                              </label>
                              <input
                                type="number"
                                step="5"
                                min="0"
                                max={spec.length}
                                value={c.posV}
                                onChange={(e) => updateCutout(idx, { posV: Number(e.target.value) })}
                                className="w-full bg-[var(--bg-1)] border border-slate-800 rounded px-1.5 py-0.5 text-slate-200 text-[10px] outline-none focus:border-cyan-500"
                              />
                            </div>
                          </div>

                          {/* Dimensions based on Cutout Type */}
                          {c.type === 'round_hole' ? (
                            <div className="flex items-center gap-2">
                              <label className="text-[9px] text-slate-400">
                                {isTr ? 'Çap Ø (mm):' : 'Diameter Ø:'}
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                min="1"
                                value={c.diameter || 8.5}
                                onChange={(e) => updateCutout(idx, { diameter: Number(e.target.value) })}
                                className="w-20 bg-[var(--bg-1)] border border-slate-800 rounded px-2 py-0.5 text-slate-200 text-[10px] outline-none focus:border-cyan-500"
                              />
                            </div>
                          ) : c.type === 'pocket' || c.type === 'rect_cutout' ? (
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-[9px] text-slate-500 block">
                                  {isTr ? 'Genişlik W' : 'Width W'}
                                </label>
                                <input
                                  type="number"
                                  step="1"
                                  min="2"
                                  value={c.width || 20}
                                  onChange={(e) => updateCutout(idx, { width: Number(e.target.value) })}
                                  className="w-full bg-[var(--bg-1)] border border-slate-800 rounded px-1.5 py-0.5 text-slate-200 text-[10px] outline-none focus:border-cyan-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 block">
                                  {isTr ? 'Uzunluk L' : 'Length L'}
                                </label>
                                <input
                                  type="number"
                                  step="2"
                                  min="2"
                                  value={c.length || 40}
                                  onChange={(e) => updateCutout(idx, { length: Number(e.target.value) })}
                                  className="w-full bg-[var(--bg-1)] border border-slate-800 rounded px-1.5 py-0.5 text-slate-200 text-[10px] outline-none focus:border-cyan-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 block">
                                  {isTr ? 'Köşe R (mm)' : 'Radius R'}
                                </label>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={c.cornerRadius ?? 3}
                                  onChange={(e) => updateCutout(idx, { cornerRadius: Number(e.target.value) })}
                                  className="w-full bg-[var(--bg-1)] border border-slate-800 rounded px-1.5 py-0.5 text-slate-200 text-[10px] outline-none focus:border-cyan-500"
                                />
                              </div>
                            </div>
                          ) : c.type === 'corner_notch' ? (
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-[9px] text-slate-500 block">
                                  {isTr ? 'Kertme W (mm)' : 'Notch W'}
                                </label>
                                <input
                                  type="number"
                                  step="1"
                                  min="2"
                                  value={c.width || 15}
                                  onChange={(e) => updateCutout(idx, { width: Number(e.target.value) })}
                                  className="w-full bg-[var(--bg-1)] border border-slate-800 rounded px-1.5 py-0.5 text-slate-200 text-[10px] outline-none focus:border-cyan-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 block">
                                  {isTr ? 'Kertme L (mm)' : 'Notch L'}
                                </label>
                                <input
                                  type="number"
                                  step="1"
                                  min="2"
                                  value={c.length || 15}
                                  onChange={(e) => updateCutout(idx, { length: Number(e.target.value) })}
                                  className="w-full bg-[var(--bg-1)] border border-slate-800 rounded px-1.5 py-0.5 text-slate-200 text-[10px] outline-none focus:border-cyan-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 block">
                                  {isTr ? 'Hangi Köşe?' : 'Corner'}
                                </label>
                                <select
                                  value={c.notchCorner || 'top_left'}
                                  onChange={(e) => updateCutout(idx, { notchCorner: e.target.value as any })}
                                  className="w-full bg-[var(--bg-1)] border border-slate-800 rounded px-1 py-0.5 text-slate-200 text-[9.5px] outline-none focus:border-cyan-500"
                                >
                                  <option value="top_left">{isTr ? 'Sol Üst' : 'Top Left'}</option>
                                  <option value="top_right">{isTr ? 'Sağ Üst' : 'Top Right'}</option>
                                  <option value="bottom_left">{isTr ? 'Sol Alt' : 'Bottom Left'}</option>
                                  <option value="bottom_right">{isTr ? 'Sağ Alt' : 'Bottom Right'}</option>
                                </select>
                              </div>
                            </div>
                          ) : c.type === 'custom_path' ? (
                            <div className="p-1.5 rounded bg-[var(--bg-1)] border border-cyan-500/30 text-[9px] text-slate-300 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-cyan-300">📄 {c.sourceFileName || 'Custom Contour'}</span>
                                <span className="text-slate-400">{c.profile?.length || 0} {isTr ? 'nokta' : 'points'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span>{isTr ? 'Boyut:' : 'Size:'} {c.width || 25} x {c.length || 25} mm</span>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] text-slate-500 block">
                                  {isTr ? 'Genişlik W (mm)' : 'Width W'}
                                </label>
                                <input
                                  type="number"
                                  step="1"
                                  min="2"
                                  value={c.width || 10}
                                  onChange={(e) => updateCutout(idx, { width: Number(e.target.value) })}
                                  className="w-full bg-[var(--bg-1)] border border-slate-800 rounded px-1.5 py-0.5 text-slate-200 text-[10px] outline-none focus:border-cyan-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 block">
                                  {isTr ? 'Uzunluk L (mm)' : 'Length L'}
                                </label>
                                <input
                                  type="number"
                                  step="2"
                                  min="2"
                                  value={c.length || 25}
                                  onChange={(e) => updateCutout(idx, { length: Number(e.target.value) })}
                                  className="w-full bg-[var(--bg-1)] border border-slate-800 rounded px-1.5 py-0.5 text-slate-200 text-[10px] outline-none focus:border-cyan-500"
                                />
                              </div>
                            </div>
                          )}

                          {/* SÜNME / PLASTIC STRAIN WARNING PILL & 4 DFM REMEDIES */}
                          {def && (
                            <div
                              className={`p-2 rounded text-[9.5px] border space-y-1.5 ${
                                def.riskLevel === 'SEVERE_TEARING'
                                  ? 'bg-red-950/60 border-red-500/50 text-red-300'
                                  : def.riskLevel === 'MODERATE_DISTORTION'
                                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold">
                                <span>
                                  {def.riskLevel === 'SAFE'
                                    ? isTr ? '✅ Sünme Yok (Dairesel)' : '✅ Safe Circular'
                                    : isTr ? `⚠️ Büküm Yanı Sünme: %${def.elongationPercent}` : `⚠️ Hole Strain: %${def.elongationPercent}`}
                                </span>
                                <span>
                                  {def.riskLevel !== 'SAFE'
                                    ? `${def.deformedMajorMm} x ${def.deformedMinorMm} mm`
                                    : 'Ø' + (c.diameter || 8) + ' mm'}
                                </span>
                              </div>
                              <div className="text-[9px] text-slate-300 font-normal leading-tight">
                                {isTr ? def.dfmAdviceTr : def.dfmAdviceEn}
                              </div>

                              {/* 💡 4 PROACTIVE DFM REMEDIES (Sünme Önleme Çözümleri) */}
                              {(def.riskLevel !== 'SAFE' || c.reliefSlit?.enabled || c.preCompensated || c.postBendOperation) && (
                                <div className="pt-1.5 border-t border-slate-700/60 space-y-1.5">
                                  <div className="text-[8.5px] font-mono font-bold text-cyan-300 uppercase flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-cyan-400" />
                                    <span>{isTr ? '💡 Sünme Önleme / DFM Çözüm Önerileri:' : '💡 DFM Strain Remedies:'}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    {/* Remedy 1: Relief Slit */}
                                    <button
                                      type="button"
                                      onClick={() => handleApplyRemedy('relief_slit', c.id)}
                                      className={`px-1.5 py-1 rounded text-[8.5px] font-mono font-bold border text-left transition-all flex flex-col gap-0.5 ${
                                        c.reliefSlit?.enabled
                                          ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200'
                                          : 'bg-slate-900 border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-200'
                                      }`}
                                      title={isTr ? 'Delik ile büküm arasına 1mm lazer yarığı açar' : 'Laser relief micro-slit'}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span>⚡ {isTr ? 'Lazer Rahatlatma' : 'Relief Slit'}</span>
                                        {c.reliefSlit?.enabled && <span className="text-emerald-400 font-black">✓ AKTİF</span>}
                                      </div>
                                      <span className="text-[7.5px] text-slate-400 font-normal">
                                        {isTr ? '1mm yarık gerilmeyi emer' : '1mm slit absorbs strain'}
                                      </span>
                                    </button>

                                    {/* Remedy 2: Offset to Safe Zone */}
                                    <button
                                      type="button"
                                      onClick={() => handleApplyRemedy('offset_safe', c.id)}
                                      className="px-1.5 py-1 rounded text-[8.5px] font-mono font-bold border border-slate-700 bg-slate-900 hover:border-cyan-400 text-slate-300 hover:text-cyan-200 text-left transition-all flex flex-col gap-0.5"
                                      title={isTr ? 'Deliği DIN 6935 güvenli bölgesine kaydırır' : 'Shift hole to DIN 6935 safe zone'}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span>📐 {isTr ? 'Güvenli Alana Ötele' : 'Offset to Safe'}</span>
                                        <span className="text-cyan-400">≥{def.safeDistanceMm}mm</span>
                                      </div>
                                      <span className="text-[7.5px] text-slate-400 font-normal">
                                        {isTr ? 'Bükümden uzağa taşır' : 'Moves away from bend'}
                                      </span>
                                    </button>

                                    {/* Remedy 3: Pre-Compensation */}
                                    <button
                                      type="button"
                                      onClick={() => handleApplyRemedy('pre_compensate', c.id)}
                                      className={`px-1.5 py-1 rounded text-[8.5px] font-mono font-bold border text-left transition-all flex flex-col gap-0.5 ${
                                        c.preCompensated
                                          ? 'bg-violet-600/30 border-violet-400 text-violet-200'
                                          : 'bg-slate-900 border-slate-700 hover:border-violet-400 text-slate-300 hover:text-violet-200'
                                      }`}
                                      title={isTr ? 'Açınımda ters elips kesilir, bükülünce tam daireye uzar' : 'Pre-flatten oval on flat blank'}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span>🔄 {isTr ? 'Ters Kompanzasyon' : 'Pre-Compensate'}</span>
                                        {c.preCompensated && <span className="text-violet-400 font-black">✓ AKTİF</span>}
                                      </div>
                                      <span className="text-[7.5px] text-slate-400 font-normal">
                                        {isTr ? 'Ters elips bükümde daireleşir' : 'Oval bends into circle'}
                                      </span>
                                    </button>

                                    {/* Remedy 4: Post-Bend Operation */}
                                    <button
                                      type="button"
                                      onClick={() => handleApplyRemedy('post_bend', c.id)}
                                      className={`px-1.5 py-1 rounded text-[8.5px] font-mono font-bold border text-left transition-all flex flex-col gap-0.5 ${
                                        c.postBendOperation
                                          ? 'bg-amber-600/30 border-amber-400 text-amber-200'
                                          : 'bg-slate-900 border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-200'
                                      }`}
                                      title={isTr ? 'Sac büküldükten sonra 2. operasyonda delinir' : 'Punch hole after bending'}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span>🛠️ {isTr ? 'Büküm Sonrası Del' : 'Post-Bend Op'}</span>
                                        {c.postBendOperation && <span className="text-amber-400 font-black">✓ AKTİF</span>}
                                      </div>
                                      <span className="text-[7.5px] text-slate-400 font-normal">
                                        {isTr ? 'Açınımda delinmez, 0 deformasyon' : '0 strain on formed part'}
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: PRESS BRAKE TOOLING & COLLISION INSPECTOR */}
              {editorTab === 'pressbrake' && (
                <div className="p-2.5 rounded-lg border border-slate-800 bg-[var(--bg-1)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                      {isTr ? 'ABKANT PRES ANALİZİ' : 'PRESS BRAKE ANALYSIS'}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        feasibility.isFeasible
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {feasibility.isFeasible
                        ? isTr ? 'BÜKÜLEBİLİR' : 'FEASIBLE'
                        : isTr ? 'BÜKÜLEMEZ!' : 'UNBENDABLE!'}
                    </span>
                  </div>

                  {/* Tooling details */}
                  <div className="p-2 rounded bg-[var(--bg-0)] border border-slate-800 text-[10px] space-y-1">
                    <div className="text-slate-400">
                      {isTr ? 'Önerilen V-Kalıp Açıklığı:' : 'Recommended V-Die:'}{' '}
                      <span className="text-amber-300 font-bold">V{feasibility.recommendedDieV} mm</span>
                    </div>
                    <div className="text-slate-400">
                      {isTr ? 'Min. Flanş Boyu Şartı:' : 'Min Flange Required:'}{' '}
                      <span className="text-cyan-300 font-bold">{feasibility.minFlangeRequiredMm} mm</span>
                    </div>
                    <div className="text-[9px] text-slate-500 pt-0.5">
                      {isTr ? feasibility.toolingRecommendationTr : feasibility.toolingRecommendationEn}
                    </div>
                  </div>

                  {/* Collision Alerts */}
                  {feasibility.collisions.length > 0 && (
                    <div className="space-y-1.5">
                      {feasibility.collisions.map((col, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded text-[10px] border flex items-start gap-1.5 ${
                            col.severity === 'error'
                              ? 'bg-red-950/70 border-red-500 text-red-200'
                              : 'bg-amber-950/70 border-amber-500 text-amber-200'
                          }`}
                        >
                          <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                          <div>
                            <div className="font-bold">{isTr ? col.messageTr : col.messageEn}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Optimal Sequence */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">
                      {isTr ? 'En Mantıklı Büküm Sıralaması (Dıştan İçe):' : 'Optimal Bend Sequence:'}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {feasibility.optimalSequence.map((bIdx, sIdx) => (
                        <div
                          key={sIdx}
                          className="px-2 py-1 rounded bg-[var(--bg-0)] border border-amber-500/40 text-[10px] font-bold text-amber-300 flex items-center gap-1"
                        >
                          <span className="text-[9px] text-slate-500">#{sIdx + 1}:</span>
                          <span>B{bIdx}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center Column: 3D Viewport with Live Fold/Unfold & Press Brake Simulator */}
          <div className="flex-1 min-h-[300px] flex flex-col bg-[var(--bg-0)] overflow-hidden p-2">
            <SheetMetal3DPreview
              spec={spec}
              lang={language}
              onDownloadDXF={handleDownloadDXF}
              onSelectEdge={(flangeIdx, edge) => {
                addBend(flangeIdx, edge);
                setEditorTab('bends');
              }}
              onApplyRemedy={handleApplyRemedy}
            />
          </div>

          {/* Right Column: DIN 6935 Calculations, Sünme Summary & Bend Table */}
          <div className="w-full lg:w-[360px] flex-shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800 bg-[var(--bg-0)] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar text-[11px] font-mono">
              {/* Telemetry Cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg border border-slate-800 bg-[var(--bg-1)]">
                  <span className="text-[9px] text-slate-500 uppercase block">
                    {isTr ? 'Toplam Düz Boy (L_flat)' : 'Flat Blank Length'}
                  </span>
                  <span className="text-base font-black text-cyan-300">
                    {analysis.totalFlatLengthMm.toFixed(2)} mm
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-800 bg-[var(--bg-1)]">
                  <span className="text-[9px] text-slate-500 uppercase block">
                    {isTr ? 'Büküm Kaybı (ΣBD)' : 'Total Bend Deduction'}
                  </span>
                  <span className="text-base font-black text-violet-300">
                    {analysis.totalBendDeductionMm.toFixed(2)} mm
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-800 bg-[var(--bg-1)]">
                  <span className="text-[9px] text-slate-500 uppercase block">
                    {isTr ? 'Parça Ağırlığı' : 'Part Mass'}
                  </span>
                  <span className="text-base font-black text-emerald-300">
                    {analysis.massKg.toFixed(3)} kg
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-800 bg-[var(--bg-1)]">
                  <span className="text-[9px] text-slate-500 uppercase block">
                    {isTr ? 'Abkant Tonajı' : 'Press Force'}
                  </span>
                  <span className="text-base font-black text-amber-300">
                    {analysis.maxTonnage.toFixed(2)} ton
                  </span>
                </div>
              </div>

              {/* Sünme (Hole Distortion) Telemetry Card */}
              {deformations.length > 0 && (
                <div className="p-2.5 rounded-lg border border-slate-800 bg-[var(--bg-1)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider flex items-center gap-1">
                      <CircleDot className="w-3.5 h-3.5 text-violet-400" />
                      <span>{isTr ? 'DELİK SÜNME / ÇEKME ANALİZİ' : 'HOLE STRAIN OVALIZATION'}</span>
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {deformations.filter((d) => d.riskLevel !== 'SAFE').length} {isTr ? 'Sünme' : 'Distorted'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {deformations.map((d, i) => (
                      <div
                        key={d.cutoutId || i}
                        className={`p-2 rounded border text-[10px] ${
                          d.riskLevel === 'SEVERE_TEARING'
                            ? 'bg-red-950/30 border-red-500/40 text-red-300'
                            : d.riskLevel === 'MODERATE_DISTORTION'
                            ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                            : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>
                            #{i + 1} {spec.cutouts?.[i]?.name || 'Cutout'}
                          </span>
                          <span>
                            {d.riskLevel === 'SAFE'
                              ? isTr ? 'Güvenli (Sünme Yok)' : 'Safe (0% Strain)'
                              : `Sünme: +%${d.elongationPercent}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 mt-0.5">
                          <span>
                            {isTr ? 'Büküme Mesafe:' : 'Dist to Bend:'} {d.distanceToNearestBendMm} mm (Min: {d.safeDistanceMm} mm)
                          </span>
                          <span>{d.deformedMajorMm} x {d.deformedMinorMm} mm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cracking Risk Banner */}
              {analysis.hasCrackingRisk ? (
                <div className="p-2 rounded bg-red-950/40 border border-red-500/40 text-red-300 flex items-center gap-2 text-[10px]">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>
                    {isTr
                      ? 'DİKKAT: R < t büküm yarıçapında çatlama riski tespit edildi!'
                      : 'WARNING: Crack risk detected (R < thickness)!'}
                  </span>
                </div>
              ) : (
                <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-center gap-2 text-[10px]">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    {isTr
                      ? 'DIN 6935 Güvenli Büküm (R ≥ t çatlama riski yok)'
                      : 'DIN 6935 Safe Bend Radii (No crack risk)'}
                  </span>
                </div>
              )}

              {/* Bend Deduction Table */}
              <div className="rounded-lg border border-slate-800 bg-[var(--bg-1)] overflow-hidden">
                <div className="px-2.5 py-1.5 bg-[var(--bg-1)] border-b border-slate-800 text-[9.5px] font-bold text-slate-400 uppercase">
                  {isTr ? 'Büküm Detay Tablosu (DIN 6935)' : 'DIN 6935 Bend Telemetry'}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] font-mono text-left">
                    <thead className="bg-[var(--bg-0)] text-slate-500 text-[9px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-1.5">#</th>
                        <th className="p-1.5">K</th>
                        <th className="p-1.5">BA</th>
                        <th className="p-1.5">BD</th>
                        <th className="p-1.5 text-right">x_c</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {analysis.rows.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/20">
                          <td className="p-1.5 font-bold text-slate-300">
                            B{r.index} {r.direction === 'up' ? '↑' : '↓'}
                          </td>
                          <td className="p-1.5 text-slate-400">{r.kFactor.toFixed(2)}</td>
                          <td className="p-1.5 text-violet-300">{r.ba.toFixed(2)}</td>
                          <td className="p-1.5 text-cyan-300">{r.bd.toFixed(2)}</td>
                          <td className="p-1.5 text-right text-emerald-300 font-bold">
                            {r.bendLineMm.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-800 bg-[var(--bg-1)] flex-shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadDXF}
              className="px-3 py-1.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-[11px] font-mono font-bold text-emerald-300 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              {isTr ? 'Düz Açınım DXF İndir (Deliklerle)' : 'Export Flat DXF with Holes'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[11px] font-mono text-slate-400 hover:text-white transition-colors"
            >
              {isTr ? 'Vazgeç' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleInsertOrUpdateInScene}
              className="px-4 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5"
            >
              <Box className="w-3.5 h-3.5" />
              {editingPartId
                ? isTr
                  ? '3B Parçayı Güncelle'
                  : 'Update 3D Part'
                : isTr
                ? 'Sahneye 3B Sac Parça Ekle'
                : 'Insert 3D Sheet Metal Part'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SheetMetalStudioModal;
