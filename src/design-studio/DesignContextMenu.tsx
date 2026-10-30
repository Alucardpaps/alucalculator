'use client';

import React, { useEffect } from 'react';
import {
  X, Check, Focus, Eye, EyeOff, Layers, Scissors, Ruler, Sparkles,
  Download, Trash2, Copy, Lock, Unlock, Camera, Grid, Palette,
  FileText, Box, ShieldCheck, Plus, RefreshCw, Cuboid, Compass, ArrowUpRight
} from 'lucide-react';
import {
  useDesignStore,
  type DesignPart,
  type DesignKind,
  type SectionAxis
} from './designStore';
import { t12 } from '@/locales/t12';
import { useI18nStore } from '@/store/i18nStore';
import { exportPartsToSTL, downloadFile } from './exporter';
import { downloadStepFile, generateStepBox, generateStepPlateWithHole, generateStepShaft } from '@/engines/cad/StepBRepExporter';
import { type MateFeature } from './assembly/mateTypes';
import { extractPartFeatures, classifySurfaceFaceFromLocalNormal } from './assembly/featureExtractor';
import { triggerCameraView } from './cadCameraDispatcher';
import { exportSheetMetalFlatPatternDXF, type SheetMetalSpec } from './sheetMetalEngine';

export interface DesignContextMenuProps {
  x: number;
  y: number;
  partId: string | null;
  clickedFeature?: MateFeature | null;
  onClose: () => void;
  onSetCameraView: (view: 'iso' | 'top' | 'front' | 'right' | 'fit') => void;
  onFocusPart?: (part: DesignPart) => void;
}

/**
 * 🧊 DesignContextMenu — Industrial 3D Studio Right-Click Marking / Context Menu
 * SolidWorks / Fusion 360 / Siemens NX style context menu for 3D engineering assemblies.
 */
export function DesignContextMenu({
  x,
  y,
  partId,
  clickedFeature,
  onClose,
  onSetCameraView,
  onFocusPart,
}: DesignContextMenuProps) {
  const { language } = useI18nStore();
  const parts = useDesignStore((s) => s.parts);
  const selectedId = useDesignStore((s) => s.selectedId);
  const select = useDesignStore((s) => s.select);
  const deleteSelected = useDesignStore((s) => s.deleteSelected);
  const duplicateSelected = useDesignStore((s) => s.duplicateSelected);
  const toggleLocked = useDesignStore((s) => s.toggleLocked);
  const toggleVisible = useDesignStore((s) => s.toggleVisible);
  const isolatedPartId = useDesignStore((s) => s.isolatedPartId);
  const toggleIsolateSelected = useDesignStore((s) => s.toggleIsolateSelected);
  const showGrid = useDesignStore((s) => s.showGrid);
  const setShowGrid = useDesignStore((s) => s.setShowGrid);
  const showMeshWireframe = useDesignStore((s) => s.showMeshWireframe);
  const toggleMeshWireframe = useDesignStore((s) => s.toggleMeshWireframe);
  const showCadEdges = useDesignStore((s) => s.showCadEdges);
  const toggleCadEdges = useDesignStore((s) => s.toggleCadEdges);
  const tool = useDesignStore((s) => s.tool);
  const setTool = useDesignStore((s) => s.setTool);
  const renderMode = useDesignStore((s) => s.renderMode);
  const setRenderMode = useDesignStore((s) => s.setRenderMode);
  const sectionAxis = useDesignStore((s) => s.sectionAxis);
  const setSectionAxis = useDesignStore((s) => s.setSectionAxis);
  const setShowMaterialsModal = useDesignStore((s) => s.setShowMaterialsModal);
  const setShowTechnicalDrawingModal = useDesignStore((s) => s.setShowTechnicalDrawingModal);
  const setShowCenterOfGravity = useDesignStore((s) => s.setShowCenterOfGravity);
  const showCenterOfGravity = useDesignStore((s) => s.showCenterOfGravity);
  const addPart = useDesignStore((s) => s.addPart);
  const addTSlotPart = useDesignStore((s) => s.addTSlotPart);
  const setFacePickMode = useDesignStore((s) => s.setFacePickMode);

  // Target part: either explicitly clicked or selected part
  const activePart = parts.find((p) => p.id === (partId || selectedId)) || null;

  useEffect(() => {
    const handleGlobalClick = () => onClose();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const menuWidth = 250;
  const menuHeight = activePart ? 520 : 430;
  const left = typeof window !== 'undefined' ? Math.max(10, Math.min(x, window.innerWidth - menuWidth - 12)) : x;
  const top = typeof window !== 'undefined' ? Math.max(10, Math.min(y, window.innerHeight - menuHeight - 12)) : y;

  const handleExportActivePart = () => {
    if (!activePart) return;
    try {
      const stl = exportPartsToSTL([activePart], `${activePart.name}.stl`);
      downloadFile(`${activePart.name}.stl`, stl, 'application/sla');
    } catch {
      // Fallback
    }
    onClose();
  };

  return (
    <div
      className="fixed z-50 py-1 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line-strong)] shadow-[0_12px_45px_rgba(0,0,0,0.92)] text-xs font-sans select-none overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-[92vh] overflow-y-auto custom-scrollbar"
      style={{
        left,
        top,
        width: menuWidth,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ─── 1. CONTEXT HEADER ─── */}
      <div className="px-3 py-1.5 border-b border-[var(--line)] bg-[var(--bg-2)] flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-1.5 truncate">
          <span 
            className="w-2 h-2 rounded-full shrink-0" 
            style={{ backgroundColor: activePart ? activePart.color : 'var(--cyan)' }} 
          />
          <span className="font-bold text-[var(--ink)] uppercase truncate">
            {activePart ? activePart.name : '3D Studio Viewport'}
          </span>
        </div>
        <span className="text-[9px] text-[var(--alu-dim)] font-bold px-1.5 py-0.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] uppercase shrink-0">
          {activePart ? activePart.kind : `${parts.length} PARTS`}
        </span>
      </div>

      {/* ─── 2. PART-SPECIFIC CONTEXT ACTIONS ─── */}
      {activePart && (
        <>
          {/* ─── PRIMARY ACTION: OPEN / EDIT IN PART STUDIO ─── */}
          <button
            type="button"
            onClick={() => {
              useDesignStore.getState().openPartStudioForPart(activePart.id);
              onClose();
            }}
            className="w-full px-3 py-2 text-left bg-gradient-to-r from-cyan-950/80 via-cyan-900/30 to-transparent hover:from-cyan-900 hover:to-[var(--bg-2)] flex items-center justify-between text-[var(--cyan)] font-bold transition-all border-b border-cyan-500/40 group cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Box size={14} className="text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-[var(--ink)] group-hover:text-cyan-300">
                {t12(language, 'Edit in Part Studio', 'Part Studio ile Düzenle')}
              </span>
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950">STUDIO</span>
          </button>
          {/* ─── DEDICATED SHEET METAL ACTIONS (IF SHEET METAL PART) ─── */}
          {activePart.params?.sheetMetalSpec && (
            <div className="border-b border-cyan-500/30 bg-cyan-950/30 p-1 space-y-1">
              <div className="px-2 py-0.5 text-[9.5px] font-mono font-bold text-cyan-300 flex items-center justify-between">
                <span>📐 {t12(language, 'SHEET METAL PART (DIN 6935)', 'SAC LEVHA PARÇASI (DIN 6935)')}</span>
                <span className="text-[8px] bg-cyan-500/20 px-1 rounded text-cyan-300">
                  t={activePart.params.sheetMetalSpec.thickness}mm
                </span>
              </div>

              {/* 1. Edit Sheet Metal in Studio Modal */}
              <button
                type="button"
                onClick={() => {
                  const spec = activePart.params.sheetMetalSpec;
                  useDesignStore.getState().openSheetMetalModal(activePart.id, spec, 'bends');
                  onClose();
                }}
                className="w-full px-2.5 py-1.5 rounded text-left bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 font-bold text-xs flex items-center justify-between transition-all group cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <span>📐</span>
                  <span>{t12(language, 'Edit Bends & Flanges', 'Bükümleri & Sacı Düzenle')}</span>
                </span>
                <span className="text-[9px] font-mono font-bold bg-cyan-400 text-slate-950 px-1.5 py-0.2 rounded">
                  MODAL
                </span>
              </button>

              {/* 2. Press Brake Simulation */}
              <button
                type="button"
                onClick={() => {
                  const spec = activePart.params.sheetMetalSpec;
                  useDesignStore.getState().openSheetMetalModal(activePart.id, spec, 'pressbrake');
                  onClose();
                }}
                className="w-full px-2.5 py-1.5 rounded text-left bg-[var(--bg-1)] hover:bg-cyan-950/60 text-slate-200 hover:text-cyan-300 border border-white/5 font-semibold text-[11px] flex items-center justify-between transition-all cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <span>🚜</span>
                  <span>{t12(language, 'Press Brake Bending Sim', 'Abkant Pres Büküm Simülasyonu')}</span>
                </span>
                <span className="text-[8.5px] font-mono text-cyan-400">VDI 3389</span>
              </button>

              {/* 3. Holes, Cutouts & Sünme (Distortion) Analysis */}
              <button
                type="button"
                onClick={() => {
                  const spec = activePart.params.sheetMetalSpec;
                  useDesignStore.getState().openSheetMetalModal(activePart.id, spec, 'cutouts');
                  onClose();
                }}
                className="w-full px-2.5 py-1.5 rounded text-left bg-[var(--bg-1)] hover:bg-cyan-950/60 text-slate-200 hover:text-cyan-300 border border-white/5 font-semibold text-[11px] flex items-center justify-between transition-all cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <span>🕳️</span>
                  <span>{t12(language, 'Holes & Distortion (Sünme)', 'Delikler & Sünme Analizi')}</span>
                </span>
                <span className="text-[8.5px] font-mono text-amber-400">DIN 6935</span>
              </button>

              {/* 4. Export Flat Pattern DXF */}
              <button
                type="button"
                onClick={() => {
                  const spec = activePart.params.sheetMetalSpec;
                  if (spec) {
                    const dxf = exportSheetMetalFlatPatternDXF(spec);
                    const blob = new Blob([dxf], { type: 'application/dxf' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${(spec.name || 'sheet_metal').replace(/\s+/g, '_').toLowerCase()}_din6935_flat.dxf`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                  onClose();
                }}
                className="w-full px-2.5 py-1.5 rounded text-left bg-[var(--bg-1)] hover:bg-emerald-950/50 text-slate-200 hover:text-emerald-300 border border-white/5 font-semibold text-[11px] flex items-center justify-between transition-all cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Download size={11} className="text-emerald-400" />
                  <span>{t12(language, 'Export Flat DXF', 'Açınım DXF İndir')}</span>
                </span>
                <span className="text-[8.5px] font-mono text-emerald-400">DXF R12</span>
              </button>
            </div>
          )}

          {/* ─── DEDICATED DYNAMIC BLOCK ACTIONS (IF DYNAMIC BLOCK) ─── */}
          {Boolean(activePart.params?.dynamicBlockId || activePart.params?.dynamicParams) && (
            <div className="border-b border-amber-500/30 bg-amber-950/30 p-1 space-y-1">
              <div className="px-2 py-0.5 text-[9.5px] font-mono font-bold text-amber-300 flex items-center justify-between">
                <span>⚙️ {t12(language, 'DYNAMIC BLOCK (PARAMETRIC)', 'DİNAMİK BLOK (PARAMETRİK)')}</span>
                <span className="text-[8px] bg-amber-500/20 px-1 rounded text-amber-300">
                  {activePart.designStandard || 'ISO/DIN'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  useDesignStore.getState().openDynamicBlockModal(
                    activePart.id,
                    activePart.params.dynamicBlockId || null,
                    activePart.params.dynamicParams || activePart.params
                  );
                  onClose();
                }}
                className="w-full px-2.5 py-1.5 rounded text-left bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold text-xs flex items-center justify-between transition-all group cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <span>⚙️</span>
                  <span>{t12(language, 'Edit Block Parameters', 'Bloğu & Parametreleri Düzenle')}</span>
                </span>
                <span className="text-[9px] font-mono font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded">
                  STUDIO
                </span>
              </button>
            </div>
          )}

          {/* ─── GENERAL SOLID EDIT DIMENSIONS / PARAMETERS (PROPERTIES FOCUS) ─── */}
          <button
            type="button"
            onClick={() => {
              const store = useDesignStore.getState();
              store.select(activePart.id);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('alucalc:focus-inspector-tab', { detail: 'dims' }));
              }
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-cyan-300 flex items-center justify-between text-[var(--ink)] transition-colors group cursor-pointer border-b border-[var(--line)]"
            title={t12(language, 'Open & Edit Dimensions / Parameters in Properties Inspector', 'Özellikler panelinde ölçüleri & parametreleri düzenle')}
          >
            <span className="flex items-center gap-2">
              <span className="text-cyan-400 text-xs">📐</span>
              <span className="text-xs font-bold text-[var(--ink)] group-hover:text-cyan-300">
                {t12(language, 'Edit Dimensions & Parameters', 'Ölçüleri & Parametreleri Düzenle')}
              </span>
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              PROPS
            </span>
          </button>

          {/* ─── SOLIDWORKS IN-CONTEXT QUICK MATE ACTION ─── */}
          <button
            type="button"
            onClick={() => {
              const feat = clickedFeature || extractPartFeatures(activePart, true)[0];
              const isAxis = feat?.kind === 'hole-axis';
              const store = useDesignStore.getState();
              store.openMateModal({
                partAId: activePart.id,
                featureAId: feat?.id || null,
                kind: isAxis ? 'concentric' : 'coincident',
              });
              store.select(activePart.id);
              onClose();
            }}
            className="w-full px-3 py-2 text-left bg-gradient-to-r from-cyan-950/80 via-[var(--bg-2)] to-transparent hover:from-cyan-900 hover:to-[var(--bg-3)] flex items-center justify-between text-[var(--cyan)] font-bold transition-all border-b border-cyan-500/40 group"
            title={t12(language, 'Start assembly mate from this surface/feature', 'Bu yüzeyden veya delikten montaj ilişkisi (Mate) başlat')}
          >
            <span className="flex items-center gap-2">
              <span className="text-sm">📎</span>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-[var(--ink)] group-hover:text-[var(--cyan)]">
                  {clickedFeature?.kind === 'hole-axis'
                    ? t12(language, 'Add Concentric Mate on Hole', 'Bu Deliği Montajla (Eşmerkezli)')
                    : clickedFeature?.kind === 'slot-channel'
                    ? t12(language, 'Add Slot Mate on Channel', 'Bu Kanalı Montajla (Kanal-Uç)')
                    : t12(language, 'Add Mate on this Surface', 'Bu Yüzeyi Montajla (Çakışık)')}
                </span>
                {clickedFeature && (
                  <span className="text-[9px] font-mono text-cyan-300/80 truncate max-w-[155px]">
                    {clickedFeature.name}
                  </span>
                )}
              </div>
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              M
            </span>
          </button>

          {/* ─── SOLIDWORKS / INVENTOR SKETCH ON FACE ACTION ─── */}
          <button
            type="button"
            onClick={() => {
              const face = clickedFeature && 'normal' in clickedFeature
                ? classifySurfaceFaceFromLocalNormal(clickedFeature.normal)
                : useDesignStore.getState().activeFace || 'top';
              const store = useDesignStore.getState();
              store.setActiveFace(face);
              store.select(activePart.id);
              store.setTool('sketch-add');
              triggerCameraView({ type: 'focus-face', partId: activePart.id, face });
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--ok)] flex items-center justify-between text-[var(--ink)] transition-colors group"
            title={t12(language, 'Start 2D sketch on this face', 'Bu yüzeyde 2D eskiz/profil çizimi aç')}
          >
            <span className="flex items-center gap-2">
              <span className="text-[var(--ok)] text-xs">✏️</span>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-[var(--ink)] group-hover:text-[var(--ok)]">
                  {t12(language, 'Sketch on this Face', 'Bu Yüzeyde Yeni Çizim Aç')}
                </span>
                {clickedFeature && 'normal' in clickedFeature && (
                  <span className="text-[9px] font-mono text-emerald-400/80">
                    {clickedFeature.name}
                  </span>
                )}
              </div>
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              S
            </span>
          </button>

          {/* ─── INVENTOR EDIT PART IN PLACE ─── */}
          <button
            type="button"
            onClick={() => {
              const store = useDesignStore.getState();
              store.setEditingPartId(activePart.id);
              store.select(activePart.id);
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-amber-300 flex items-center justify-between text-[var(--ink)] transition-colors group"
            title={t12(language, 'Edit this part in assembly context (Inventor style)', 'Bu parçayı montaj içinde düzenle (Inventor stili)')}
          >
            <span className="flex items-center gap-2">
              <span className="text-amber-400 text-xs">🔧</span>
              <span className="text-xs font-bold text-[var(--ink)] group-hover:text-amber-300">
                {t12(language, 'Edit Part in Place', 'Parçayı Montajda Düzenle')}
              </span>
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
              E
            </span>
          </button>

          {/* ─── HOLE WIZARD ON FACE ─── */}
          <button
            type="button"
            onClick={() => {
              const face = clickedFeature && 'normal' in clickedFeature
                ? classifySurfaceFaceFromLocalNormal(clickedFeature.normal)
                : useDesignStore.getState().activeFace || 'top';
              const store = useDesignStore.getState();
              store.setActiveFace(face);
              store.select(activePart.id);
              store.setFacePickMode(true);
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-cyan-300 flex items-center justify-between text-[var(--ink)] transition-colors group"
            title={t12(language, 'Add ISO standard metric hole to this surface', 'Bu yüzeye ISO metrik delik ekle')}
          >
            <span className="flex items-center gap-2">
              <span className="text-cyan-400 text-xs">🕳️</span>
              <span className="text-xs font-bold text-[var(--ink)] group-hover:text-cyan-300">
                {t12(language, 'Add Metric Hole on Face', 'Yüzeye Metrik Delik Ekle')}
              </span>
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              H
            </span>
          </button>

          {/* ─── GROUND / UNGROUND TOGGLE ─── */}
          <button
            type="button"
            onClick={() => {
              const store = useDesignStore.getState();
              store.updatePart(activePart.id, { grounded: !activePart.grounded });
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-amber-300 flex items-center justify-between text-[var(--ink)] transition-colors group"
          >
            <span className="flex items-center gap-2">
              {activePart.grounded ? <Unlock size={13} className="text-amber-400" /> : <Lock size={13} className="text-amber-400" />}
              <span className="text-xs font-bold">
                {activePart.grounded ? t12(language, 'Unground Part (Float)', 'Parçayı Serbest Bırak (Float)') : t12(language, 'Ground Part (Fix)', 'Parçayı Sabitle (Ground)')}
              </span>
            </span>
          </button>

          <div className="px-3 py-0.5 pt-1.5 text-[9px] font-mono font-bold uppercase text-[var(--alu-dim)] tracking-wider">
            {t12(language, 'Part Operations', 'Parça İşlemleri')}
          </div>


          {onFocusPart && (
            <button
              type="button"
              onClick={() => {
                onFocusPart(activePart);
                onClose();
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--cyan)] flex items-center justify-between text-[var(--ink)] transition-colors group"
            >
              <span className="flex items-center gap-2">
                <Focus size={13} className="text-[var(--cyan)]" />
                <span>{t12(language, 'Focus Camera on Part', 'Kamerayı Odakla')}</span>
              </span>
              <span className="text-[10px] font-mono text-[var(--alu-dim)] group-hover:text-[var(--cyan)]">F</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              toggleIsolateSelected();
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--std)] flex items-center justify-between text-[var(--ink)] transition-colors"
          >
            <span className="flex items-center gap-2">
              {isolatedPartId === activePart.id ? (
                <EyeOff size={13} className="text-[var(--warn)]" />
              ) : (
                <Eye size={13} className="text-[var(--std)]" />
              )}
              <span>
                {isolatedPartId === activePart.id
                  ? t12(language, 'Exit Isolate (Show All)', 'İzoleyi Kaldır (Tümünü Göster)')
                  : t12(language, 'Isolate Part', 'Parçayı İzole Et')}
              </span>
            </span>
            <span className="text-[10px] font-mono text-[var(--alu-dim)]">I</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const face = clickedFeature && 'normal' in clickedFeature
                ? classifySurfaceFaceFromLocalNormal(clickedFeature.normal)
                : useDesignStore.getState().activeFace || 'top';
              useDesignStore.getState().setActiveFace(face);
              useDesignStore.getState().select(activePart.id);
              setFacePickMode(true);
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--ok)] flex items-center justify-between text-[var(--ink)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="text-[var(--ok)] text-xs">🕳️</span>
              <span>{t12(language, 'Add Fastener Hole (M3-M24)', 'Cıvata Deliği Aç')}</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--alu-dim)]">HOLE</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowMaterialsModal(true);
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--cyan)] flex items-center justify-between text-[var(--ink)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Palette size={13} className="text-[var(--cyan)]" />
              <span>{t12(language, 'Assign Material (Al / Steel)', 'Malzeme Ata (Al / Çelik)')}</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--alu-dim)]">MAT</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowTechnicalDrawingModal(true);
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--std)] flex items-center justify-between text-[var(--ink)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <FileText size={13} className="text-[var(--std)]" />
              <span>{t12(language, '2D Technical Drawing', '2D Teknik Resim Çıkar')}</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--alu-dim)]">DWG</span>
          </button>

          <button
            type="button"
            onClick={() => {
              duplicateSelected();
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--ink)] flex items-center justify-between text-[var(--alu)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Copy size={13} className="text-[var(--warn)]" />
              <span>{t12(language, 'Duplicate Part', 'Parçayı Çoğalt')}</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--alu-dim)]">Ctrl+D</span>
          </button>

          <button
            type="button"
            onClick={() => {
              toggleLocked(activePart.id);
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--ink)] flex items-center justify-between text-[var(--alu)] transition-colors"
          >
            <span className="flex items-center gap-2">
              {activePart.locked ? (
                <Unlock size={13} className="text-[var(--ok)]" />
              ) : (
                <Lock size={13} className="text-[var(--warn)]" />
              )}
              <span>{activePart.locked ? t12(language, 'Unlock Part', 'Kilidi Aç') : t12(language, 'Lock Part', 'Parçayı Kilitle')}</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--alu-dim)]">L</span>
          </button>

          <button
            type="button"
            onClick={handleExportActivePart}
            className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--cyan)] flex items-center justify-between text-[var(--alu)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Download size={13} className="text-[var(--cyan)]" />
              <span>{t12(language, 'Export Part (STL/STEP)', 'Parçayı Dışa Aktar')}</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--alu-dim)]">STL</span>
          </button>

          <button
            type="button"
            onClick={() => {
              deleteSelected();
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[var(--bad)]/20 hover:text-[var(--bad)] flex items-center justify-between text-[var(--bad)] transition-colors"
          >
            <span className="flex items-center gap-2 font-medium">
              <Trash2 size={13} />
              <span>{t12(language, 'Delete Part', 'Parçayı Sil')}</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--bad)]/70">Del</span>
          </button>
        </>
      )}

      {/* ─── 3. CAMERA STANDARD VIEWS ─── */}
      <div className="h-px bg-[var(--line)] my-1" />
      <div className="px-3 py-0.5 text-[9px] font-mono font-bold uppercase text-[var(--alu-dim)] tracking-wider flex items-center gap-1">
        <Camera size={10} />
        <span>{t12(language, 'Camera View Presets', 'Kamera Standart Görünüşleri')}</span>
      </div>

      <div className="grid grid-cols-2 gap-1 px-2 py-1">
        <button
          type="button"
          onClick={() => {
            onSetCameraView('iso');
            onClose();
          }}
          className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] hover:text-[var(--cyan)] text-left text-[11px] font-mono text-[var(--alu)] transition-colors flex items-center gap-1.5"
        >
          <Cuboid size={12} className="text-[var(--cyan)]" />
          <span>Isometric</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSetCameraView('top');
            onClose();
          }}
          className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] hover:text-[var(--cyan)] text-left text-[11px] font-mono text-[var(--alu)] transition-colors flex items-center gap-1.5"
        >
          <span>⬆️</span>
          <span>Top (Üst)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSetCameraView('front');
            onClose();
          }}
          className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] hover:text-[var(--cyan)] text-left text-[11px] font-mono text-[var(--alu)] transition-colors flex items-center gap-1.5"
        >
          <span>➡️</span>
          <span>Front (Ön)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSetCameraView('right');
            onClose();
          }}
          className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] hover:text-[var(--cyan)] text-left text-[11px] font-mono text-[var(--alu)] transition-colors flex items-center gap-1.5"
        >
          <span>↗️</span>
          <span>Right (Sağ)</span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          onSetCameraView('fit');
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--cyan)] flex items-center justify-between text-[var(--ink)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Focus size={13} className="text-[var(--cyan)]" />
          <span>{t12(language, 'Fit All / Zoom Extents', 'Tümünü Sığdır (Fit All)')}</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--alu-dim)]">Z+A</span>
      </button>

      {/* ─── 4. VIEWPORT & INSPECTION MODES ─── */}
      <div className="h-px bg-[var(--line)] my-1" />
      <div className="px-3 py-0.5 text-[9px] font-mono font-bold uppercase text-[var(--alu-dim)] tracking-wider">
        {t12(language, 'Inspection & Section', 'İnceleme & Kesit')}
      </div>

      <button
        type="button"
        onClick={() => {
          const nextAxis: Record<SectionAxis, SectionAxis> = {
            NONE: 'X',
            X: 'Y',
            Y: 'Z',
            Z: 'NONE',
          };
          setSectionAxis(nextAxis[sectionAxis]);
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--warn)] flex items-center justify-between text-[var(--alu)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Scissors size={13} className="text-[var(--warn)]" />
          <span>{t12(language, 'Cycle Section View', 'Kesit Görünümü (X/Y/Z)')}</span>
        </span>
        <span className="text-[10px] font-mono font-bold text-[var(--warn)]">{sectionAxis}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setTool(tool === 'measure' ? 'select' : 'measure');
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--cyan)] flex items-center justify-between text-[var(--alu)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Ruler size={13} className="text-[var(--cyan)]" />
          <span>{t12(language, '3D Caliper Measure', '3D Kumpas / Ölçüm')}</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--alu-dim)]">M</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setShowGrid(!showGrid);
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-white flex items-center justify-between text-[var(--alu)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Grid size={13} className="text-[var(--std)]" />
          <span>{t12(language, 'Toggle Ground Grid', 'Zemin Izgarasını Aç/Kapat')}</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--alu-dim)]">{showGrid ? 'ON' : 'OFF'}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          const nextMode = renderMode === 'solid' ? 'edges' : renderMode === 'edges' ? 'wire' : 'solid';
          setRenderMode(nextMode);
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-white flex items-center justify-between text-[var(--alu)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Layers size={13} className="text-[var(--cyan)]" />
          <span>{t12(language, 'Cycle Render Style', 'Görünüm Modu (Tel/Katı)')}</span>
        </span>
        <span className="text-[10px] font-mono uppercase text-[var(--cyan)]">{renderMode}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          toggleMeshWireframe();
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-white flex items-center justify-between text-[var(--alu)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Grid size={13} className="text-[var(--cyan)]" />
          <span>{t12(language, '3D Mesh Wireframe', '3D Ağ / Tel Kafes Çizgileri')}</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--alu-dim)]">{showMeshWireframe ? 'ON' : 'OFF'}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          toggleCadEdges();
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-white flex items-center justify-between text-[var(--alu)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Layers size={13} className="text-[var(--std)]" />
          <span>{t12(language, 'CAD Feature Edges', 'CAD Model Kenar Çizgileri')}</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--alu-dim)]">{showCadEdges ? 'ON' : 'OFF'}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setShowCenterOfGravity(!showCenterOfGravity);
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--ok)] flex items-center justify-between text-[var(--alu)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Compass size={13} className="text-[var(--ok)]" />
          <span>{t12(language, 'Center of Gravity (Ağırlık Merkezi)', 'Ağırlık Merkezi Hedefi')}</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--alu-dim)]">{showCenterOfGravity ? 'ON' : 'OFF'}</span>
      </button>

      {/* ─── 5. QUICK PRIMITIVE INSERT ─── */}
      {!activePart && (
        <>
          <div className="h-px bg-[var(--line)] my-1" />
          <div className="px-3 py-0.5 text-[9px] font-mono font-bold uppercase text-[var(--alu-dim)] tracking-wider">
            {t12(language, 'Quick Add Part', 'Hızlı Parça Ekle')}
          </div>

          <div className="grid grid-cols-3 gap-1 px-2 py-1">
            <button
              type="button"
              onClick={() => {
                addPart('box');
                onClose();
              }}
              className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] hover:text-[var(--cyan)] text-center text-[10px] font-mono text-[var(--alu)] transition-colors"
            >
              Box
            </button>
            <button
              type="button"
              onClick={() => {
                addPart('cylinder');
                onClose();
              }}
              className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] hover:text-[var(--cyan)] text-center text-[10px] font-mono text-[var(--alu)] transition-colors"
            >
              Cylinder
            </button>
            <button
              type="button"
              onClick={() => {
                addTSlotPart(40, 500);
                onClose();
              }}
              className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] hover:text-[var(--cyan)] text-center text-[10px] font-mono text-[var(--cyan)] font-bold transition-colors"
            >
              T-Slot
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default DesignContextMenu;
