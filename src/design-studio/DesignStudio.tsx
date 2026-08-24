'use client';

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Box, Copy, Download, Eye, EyeOff, Grid3X3, Lock, Maximize2, MousePointer2,
  Move, Pencil, RotateCcw, RotateCw, Ruler, Scissors, Sun, Trash2, Unlock,
  Layers, ChevronDown, ChevronRight, Upload, Sparkles, Sliders, Eye as EyeIcon,
  Compass, Undo, Redo, Shield, Cuboid, Check, X, FileText
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { kindLabel, PART_COLORS, useDesignStore, type DesignKind, type RenderMode, type StudioMode, type SectionAxis } from './designStore';
import { exportPartsToSTL, downloadFile } from './exporter';
import { loadCADFile } from './cadImporter';
import { ENGINEERING_MATERIALS, calculateAssemblyMassProperties } from './materialsEngine';
import { ISO_METRIC_HOLES, checkHoleInterferences, type HoleItem } from './holeStandards';
import { generateTechnicalDrawingSVG } from './technicalDrawingGenerator';

const DesignViewport = dynamic(() => import('./DesignViewport').then((m) => m.DesignViewport), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#070b10] text-[11px] font-mono text-white/35">
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        <span>Loading 3D Studio Engine…</span>
      </div>
    </div>
  ),
});

const LIBRARY = [
  { 
    id: 'basic', 
    en: 'BASIC', 
    tr: 'TEMEL', 
    kinds: ['box', 'cylinder', 'tube', 'cone', 'sphere', 'torus', 'pyramid', 'wedge', 'plate', 'hex-prism', 'trapezoid'] as DesignKind[] 
  },
  { 
    id: 'structural', 
    en: 'STRUCTURAL', 
    tr: 'YAPISAL', 
    kinds: ['L-bracket', 'U-channel', 'I-beam', 'T-beam', 'cross-prism'] as DesignKind[] 
  },
  { 
    id: 'machine', 
    en: 'MACHINE', 
    tr: 'MAKİNE', 
    kinds: ['gear-blank', 'pulley', 'washer', 'hex-bolt', 'hex-nut', 'bearing-race', 'keyway-shaft', 'd-shaft', 'slot-plate', 'star-prism'] as DesignKind[] 
  },
];

export default function DesignStudio({ embedded = false }: { embedded?: boolean }) {
  const { language } = useI18nStore();
  const tr = language === 'tr';
  const [toast, setToast] = useState<string | null>(null);
  const [showInventorMap, setShowInventorMap] = useState(false);
  const [exportFormat, setExportFormat] = useState('stl-binary');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parts = useDesignStore((s) => s.parts);
  const selectedId = useDesignStore((s) => s.selectedId);
  const tool = useDesignStore((s) => s.tool);
  const placeKind = useDesignStore((s) => s.placeKind);
  const renderMode = useDesignStore((s) => s.renderMode);
  const studioMode = useDesignStore((s) => s.studioMode);
  const sectionAxis = useDesignStore((s) => s.sectionAxis);
  const sectionOffset = useDesignStore((s) => s.sectionOffset);
  const sectionInvert = useDesignStore((s) => s.sectionInvert);
  const showGrid = useDesignStore((s) => s.showGrid);
  const gridSnap = useDesignStore((s) => s.gridSnap);
  const lighting = useDesignStore((s) => s.lightingPreset);
  const setLightingPreset = useDesignStore((s) => s.setLightingPreset);
  const background = useDesignStore((s) => s.backgroundPreset);
  const setBackgroundPreset = useDesignStore((s) => s.setBackgroundPreset);
  const projectName = useDesignStore((s) => s.projectName);
  const setProjectName = useDesignStore((s) => s.setProjectName);
  const undo = useDesignStore((s) => s.undo);
  const redo = useDesignStore((s) => s.redo);
  const selected = useDesignStore((s) => s.getSelected());

  const explodeFactor = useDesignStore((s) => s.explodeFactor);
  const setExplodeFactor = useDesignStore((s) => s.setExplodeFactor);
  const isolatedPartId = useDesignStore((s) => s.isolatedPartId);
  const setIsolatedPartId = useDesignStore((s) => s.setIsolatedPartId);
  const ghostIsolated = useDesignStore((s) => s.ghostIsolated);
  const setGhostIsolated = useDesignStore((s) => s.setGhostIsolated);
  const showAllParts = useDesignStore((s) => s.showAllParts);
  const hideAllParts = useDesignStore((s) => s.hideAllParts);
  const toggleIsolateSelected = useDesignStore((s) => s.toggleIsolateSelected);
  const measurements = useDesignStore((s) => s.measurements);
  const clearMeasurements = useDesignStore((s) => s.clearMeasurements);

  const selectedMaterialId = useDesignStore((s) => s.selectedMaterialId);
  const setSelectedMaterialId = useDesignStore((s) => s.setSelectedMaterialId);
  const showCenterOfGravity = useDesignStore((s) => s.showCenterOfGravity);
  const setShowCenterOfGravity = useDesignStore((s) => s.setShowCenterOfGravity);
  const showTechnicalDrawingModal = useDesignStore((s) => s.showTechnicalDrawingModal);
  const setShowTechnicalDrawingModal = useDesignStore((s) => s.setShowTechnicalDrawingModal);
  const showMaterialsModal = useDesignStore((s) => s.showMaterialsModal);
  const setShowMaterialsModal = useDesignStore((s) => s.setShowMaterialsModal);
  const holes = useDesignStore((s) => s.holes);
  const addHole = useDesignStore((s) => s.addHole);
  const removeHole = useDesignStore((s) => s.removeHole);
  const clearHoles = useDesignStore((s) => s.clearHoles);

  const [sidebarTab, setSidebarTab] = useState<'library' | 'holes' | 'material'>('library');
  const [newHoleSize, setNewHoleSize] = useState('M6');
  const [newHoleX, setNewHoleX] = useState(0);
  const [newHoleY, setNewHoleY] = useState(0);
  const [newHoleType, setNewHoleType] = useState<'tap' | 'clearance' | 'counterbore' | 'countersink'>('counterbore');

  const massProps = useMemo(() => {
    return calculateAssemblyMassProperties(parts, selectedMaterialId);
  }, [parts, selectedMaterialId]);

  const activeMaterial = useMemo(() => {
    return ENGINEERING_MATERIALS.find((m) => m.id === selectedMaterialId) || ENGINEERING_MATERIALS[0];
  }, [selectedMaterialId]);

  const holeIssues = useMemo(() => {
    const p = selected?.params || {};
    const w = p.width || 60;
    const h = p.length || p.depth || 40;
    return checkHoleInterferences(holes, { width: w, height: h });
  }, [holes, selected]);

  const addPart = useDesignStore((s) => s.addPart);
  const select = useDesignStore((s) => s.select);
  const setTool = useDesignStore((s) => s.setTool);
  const setPlaceKind = useDesignStore((s) => s.setPlaceKind);
  const setRenderMode = useDesignStore((s) => s.setRenderMode);
  const setStudioMode = useDesignStore((s) => s.setStudioMode);
  const setSectionAxis = useDesignStore((s) => s.setSectionAxis);
  const setSectionOffset = useDesignStore((s) => s.setSectionOffset);
  const setSectionInvert = useDesignStore((s) => s.setSectionInvert);
  const sculptBrush = useDesignStore((s) => s.sculptBrush);
  const sculptRadius = useDesignStore((s) => s.sculptRadius);
  const sculptStrength = useDesignStore((s) => s.sculptStrength);
  const sculptDirection = useDesignStore((s) => s.sculptDirection);
  const sculptSymmetry = useDesignStore((s) => s.sculptSymmetry);
  const setSculptBrush = useDesignStore((s) => s.setSculptBrush);
  const setSculptRadius = useDesignStore((s) => s.setSculptRadius);
  const setSculptStrength = useDesignStore((s) => s.setSculptStrength);
  const setSculptDirection = useDesignStore((s) => s.setSculptDirection);
  const setSculptSymmetry = useDesignStore((s) => s.setSculptSymmetry);
  const resetSculpt = useDesignStore((s) => s.resetSculpt);
  const deleteSelected = useDesignStore((s) => s.deleteSelected);
  const duplicateSelected = useDesignStore((s) => s.duplicateSelected);
  const updateSelectedParams = useDesignStore((s) => s.updateSelectedParams);
  const updateSelectedTransform = useDesignStore((s) => s.updateSelectedTransform);
  const setSelectedColor = useDesignStore((s) => s.setSelectedColor);
  const setSelectedName = useDesignStore((s) => s.setSelectedName);
  const toggleVisible = useDesignStore((s) => s.toggleVisible);
  const toggleLocked = useDesignStore((s) => s.toggleLocked);
  const clearScene = useDesignStore((s) => s.clearScene);
  const setGridSnap = useDesignStore((s) => s.setGridSnap);
  const setShowGrid = useDesignStore((s) => s.setShowGrid);
  const sketchPoints = useDesignStore((s) => s.sketchPoints);
  const sketchClosed = useDesignStore((s) => s.sketchClosed);
  const extrudeDepth = useDesignStore((s) => s.extrudeDepth);
  const revolveAngle = useDesignStore((s) => s.revolveAngle);
  const loftHeight = useDesignStore((s) => s.loftHeight);
  const pendingOp = useDesignStore((s) => s.pendingOp);
  const sketchShapeMode = useDesignStore((s) => s.sketchShapeMode);
  const setSketchShapeMode = useDesignStore((s) => s.setSketchShapeMode);
  const sketchCircleRadius = useDesignStore((s) => s.sketchCircleRadius);
  const setSketchCircleRadius = useDesignStore((s) => s.setSketchCircleRadius);
  const constraintOrtho = useDesignStore((s) => s.constraintOrtho);
  const constraintPerpendicular = useDesignStore((s) => s.constraintPerpendicular);
  const constraintParallel = useDesignStore((s) => s.constraintParallel);
  const constraintEqual = useDesignStore((s) => s.constraintEqual);
  const toggleConstraint = useDesignStore((s) => s.toggleConstraint);
  const startSketchAdd = useDesignStore((s) => s.startSketchAdd);
  const startSketchCut = useDesignStore((s) => s.startSketchCut);
  const closeSketch = useDesignStore((s) => s.closeSketch);
  const clearSketch = useDesignStore((s) => s.clearSketch);
  const undoSketchPoint = useDesignStore((s) => s.undoSketchPoint);
  const setExtrudeDepth = useDesignStore((s) => s.setExtrudeDepth);
  const setRevolveAngle = useDesignStore((s) => s.setRevolveAngle);
  const setLoftHeight = useDesignStore((s) => s.setLoftHeight);
  const commitExtrude = useDesignStore((s) => s.commitExtrude);

  const ping = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleCADImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const res = await loadCADFile(files[i]);
      ping(res.message);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddKind = (k: DesignKind) => {
    setPlaceKind(k);
    addPart(k);
    ping(tr ? `${kindLabel(k, true)} eklendi` : `${kindLabel(k, false)} added`);
  };

  const handleExportAll = () => {
    if (parts.length === 0) {
      ping(tr ? 'Dışa aktarılacak parça yok' : 'No parts in scene to export');
      return;
    }
    const stlStr = exportPartsToSTL(parts, projectName || 'AluDesign');
    downloadFile(stlStr, `${(projectName || 'AluDesign').replace(/\s+/g, '_')}.stl`, 'application/sla');
    ping(tr ? 'Tüm montaj STL olarak indirildi' : 'Assembly exported as STL');
  };

  const handleExportSelected = () => {
    if (!selected) return;
    const stlStr = exportPartsToSTL([selected], selected.name);
    downloadFile(stlStr, `${selected.name.replace(/\s+/g, '_')}.stl`, 'application/sla');
    ping(tr ? `${selected.name} STL olarak indirildi` : `${selected.name} exported as STL`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const partId = addPart('box');
    setSelectedName(file.name.replace(/\.[^/.]+$/, ''));
    ping(tr ? `${file.name} başarıyla içe aktarıldı` : `${file.name} imported successfully`);
  };

  return (
    <div className={`flex w-full flex-col overflow-hidden bg-[#05080c] text-slate-200 ${embedded ? 'h-full min-h-0' : 'h-[100dvh]'}`}>
      {/* Hidden File Input for Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".stl,.obj,.step,.dxf,.json"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* ─── TOP WORKBENCH HEADER ─── */}
      <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#0a0e14] px-2 sm:px-3 text-[11px]">
        {/* Project Name */}
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
            <Box size={15} />
          </div>
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Untitled Design"
            className="w-36 sm:w-48 truncate bg-transparent font-bold text-white outline-none focus:border-b focus:border-cyan-400"
          />
        </div>

        {/* Center/Right Toolbar */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Transform Gizmo Tool Buttons */}
          <button type="button" title="Select (V)" onClick={() => setTool('select')}
            className={`rounded-lg p-1.5 transition ${tool === 'select' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <MousePointer2 size={14} />
          </button>
          <button type="button" title="Move (G)" onClick={() => setTool('move')}
            className={`rounded-lg p-1.5 transition ${tool === 'move' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <Move size={14} />
          </button>
          <button type="button" title="Rotate (R)" onClick={() => setTool('rotate')}
            className={`rounded-lg p-1.5 transition ${tool === 'rotate' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <RotateCcw size={14} />
          </button>
          <button type="button" title="Scale (S)" onClick={() => setTool('scale')}
            className={`rounded-lg p-1.5 transition ${tool === 'scale' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <Maximize2 size={14} />
          </button>
          <button type="button" title="Measure (M)" onClick={() => setTool('measure')}
            className={`rounded-lg p-1.5 transition ${tool === 'measure' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <Ruler size={14} />
          </button>

          <span className="mx-1 h-4 w-px bg-white/10" />

          {/* Quick Shapes */}
          <button type="button" title="Extrude" onClick={() => handleAddKind('box')}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
            <Pencil size={14} />
          </button>
          <button type="button" title="Revolve" onClick={() => handleAddKind('cylinder')}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
            <RotateCw size={14} />
          </button>
          <button type="button" title="Cut" onClick={() => ping(tr ? 'Kesme aracı devrede' : 'Cut active on selected part')}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
            <Scissors size={14} />
          </button>

          <span className="mx-1 h-4 w-px bg-white/10" />

          {/* Undo / Redo */}
          <button type="button" title="Undo" onClick={() => ping(tr ? 'Geri alındı' : 'Undo')}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
            <Undo size={14} />
          </button>
          <button type="button" title="Redo" onClick={() => ping(tr ? 'İleri alındı' : 'Redo')}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
            <Redo size={14} />
          </button>

          <span className="mx-1 h-4 w-px bg-white/10" />

          {/* Grid Snap */}
          <button type="button" onClick={() => setShowGrid(!showGrid)} className={`rounded-lg p-1.5 ${showGrid ? 'text-cyan-300' : 'text-slate-500'}`} title="Grid">
            <Grid3X3 size={14} />
          </button>
          <select value={gridSnap} onChange={(e) => setGridSnap(Number(e.target.value))} className="rounded-md border border-white/10 bg-black/40 px-1.5 py-0.5 text-[10px] text-slate-300">
            <option value={0}>Snap off</option>
            <option value={1}>1 mm</option>
            <option value={5}>5 mm</option>
            <option value={10}>10 mm</option>
          </select>

          {/* Lighting & Background */}
          <select value={lighting} onChange={(e) => setLightingPreset(e.target.value)} className="rounded-md border border-white/10 bg-black/40 px-1.5 py-0.5 text-[10px] text-slate-300">
            <option value="studio">Studio</option>
            <option value="soft">Soft</option>
            <option value="workshop">Workshop</option>
            <option value="off">Off</option>
          </select>

          <select value={background} onChange={(e) => setBackgroundPreset(e.target.value)} className="rounded-md border border-white/10 bg-black/40 px-1.5 py-0.5 text-[10px] text-slate-300">
            <option value="dark">Dark</option>
            <option value="navy">Navy</option>
            <option value="blueprint">Blueprint</option>
            <option value="light">Light</option>
          </select>

          {/* Engineering Analysis & 2D Drawing */}
          <button
            type="button"
            onClick={() => {
              setShowCenterOfGravity(!showCenterOfGravity);
              ping(showCenterOfGravity ? (tr ? 'Ağırlık merkezi gizlendi' : 'CoG hidden') : (tr ? `🎯 Ağırlık Merkezi: ${massProps.massKg} kg` : `🎯 CoG Active: ${massProps.massKg} kg`));
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black uppercase transition-all border ${
              showCenterOfGravity
                ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-sm'
                : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
            }`}
            title={tr ? '3D Ağırlık Merkezini Göster / Gizle' : 'Toggle 3D Center of Gravity'}
          >
            <span>🎯 CoG</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMaterialsModal(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-[9px] font-black uppercase transition-all"
            title={tr ? 'Malzeme & Kütle Analizi' : 'Materials & Mass Analysis'}
          >
            <span>⚖️ {massProps.massKg} kg</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTechnicalDrawingModal(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-md border border-cyan-500/40 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 text-[9px] font-black uppercase transition-all"
            title={tr ? '2D Teknik Resim Çıktısı (A3/A4 Antetli Çizim)' : '2D Technical Drawing Sheet'}
          >
            <FileText size={11} />
            <span>{tr ? '2D Çizim' : '2D Drawing'}</span>
          </button>

          <span className="mx-1 h-4 w-px bg-white/10" />

          {/* Export Selector & Actions */}
          <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className="rounded-md border border-white/10 bg-black/40 px-1.5 py-0.5 text-[10px] text-slate-300 font-mono">
            <option value="stl-binary">STL (binary)</option>
            <option value="stl-ascii">STL (ASCII)</option>
            <option value="obj">OBJ</option>
            <option value="step">STEP</option>
            <option value="dxf">DXF (2D)</option>
          </select>

          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-300 hover:bg-white/10">
            <Upload size={11} /> IMPORT
          </button>

          {selectedId && (
            <button type="button" onClick={handleExportSelected}
              className="flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/20">
              <Download size={11} /> EXPORT SEL
            </button>
          )}

          <button type="button" onClick={handleExportAll}
            className="flex items-center gap-1 rounded-md bg-gradient-to-r from-orange-500 to-amber-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-black hover:brightness-110 shadow-sm">
            <Download size={11} /> EXPORT ALL
          </button>
        </div>
      </header>

      {/* ─── WORKSPACE PANELS & VIEWPORT ─── */}
      <div className="flex min-h-0 flex-1 relative">
        {/* LEFT SIDEBAR: Shape Library & Part Tree */}
        <aside className="flex w-[270px] shrink-0 flex-col border-r border-white/10 bg-[#0a0e14] overflow-hidden text-[11px]">
          {/* Top Sub-tabs */}
          <div className="flex border-b border-white/10 p-1.5 gap-1 bg-black/40">
            <button
              type="button"
              onClick={() => setSidebarTab('library')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] transition-all ${
                sidebarTab === 'library'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🧱 {tr ? 'Şekiller' : 'Shapes'}
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('holes')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] transition-all relative ${
                sidebarTab === 'holes'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔩 {tr ? 'Delik & Diş' : 'Holes'}
              {holeIssues.some((i) => i.severity === 'CRITICAL') && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('material')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] transition-all ${
                sidebarTab === 'material'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚖️ {tr ? 'Malzeme' : 'Material'}
            </button>
          </div>

          {/* TAB 1: SHAPE LIBRARY & 2D FREEFORM */}
          {sidebarTab === 'library' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              {/* FREEFORM SECTION */}
              <div className="border-b border-white/10 p-3">
                <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-500">FREEFORM</p>
                <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      startSketchAdd('extrude');
                      ping(tr ? '✏️ Extrude Çizim Modu: Ekrana tıklayarak noktaları belirleyin' : '✏️ Extrude Sketch Mode: Click grid to add points');
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 font-bold transition-all ${
                      tool === 'sketch-add' && pendingOp === 'extrude'
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/20'
                        : 'border-white/10 bg-white/[0.02] text-slate-200 hover:border-cyan-500/40 hover:bg-cyan-500/10'
                    }`}
                  >
                    <Pencil size={12} className="text-cyan-400" /> Extrude
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      startSketchAdd('revolve');
                      ping(tr ? '🔄 Revolve Çizim Modu: Döndürülecek kesit profilini çizin' : '🔄 Revolve Sketch Mode: Draw cross-section profile');
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 font-bold transition-all ${
                      tool === 'sketch-add' && pendingOp === 'revolve'
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/20'
                        : 'border-white/10 bg-white/[0.02] text-slate-200 hover:border-cyan-500/40 hover:bg-cyan-500/10'
                    }`}
                  >
                    <RotateCw size={12} className="text-cyan-400" /> Revolve
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      startSketchAdd('loft');
                      ping(tr ? '🧭 Loft Çizim Modu: Taban profilini çizin' : '🧭 Loft Sketch Mode: Draw base profile');
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 font-bold transition-all ${
                      tool === 'sketch-loft'
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/20'
                        : 'border-white/10 bg-white/[0.02] text-slate-200 hover:border-cyan-500/40 hover:bg-cyan-500/10'
                    }`}
                  >
                    <Compass size={12} className="text-cyan-400" /> Loft
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      startSketchCut();
                      ping(tr ? '✂️ Kesme Çizim Modu: Kesilecek profil sınırını çizin' : '✂️ Cut Sketch Mode: Draw cutout boundary');
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 font-bold transition-all ${
                      tool === 'sketch-cut'
                        ? 'border-rose-400 bg-rose-500/20 text-rose-300 shadow-md shadow-rose-500/20'
                        : 'border-white/10 bg-white/[0.02] text-slate-200 hover:border-rose-500/40 hover:bg-rose-500/10'
                    }`}
                  >
                    <Scissors size={12} className="text-rose-400" /> Cut
                  </button>
                </div>
              </div>

              {/* SHAPE LIBRARY */}
              <div className="p-3">
                <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-500">SHAPE LIBRARY</p>
                <div className="space-y-3">
                  {LIBRARY.map((group) => (
                    <div key={group.id}>
                      <p className="mb-1 text-[8px] font-mono font-bold uppercase tracking-wider text-slate-500">
                        {group.en}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {group.kinds.map((kind) => {
                          const isSel = placeKind === kind;
                          return (
                            <button
                              key={kind}
                              type="button"
                              onClick={() => handleAddKind(kind)}
                              className={`truncate rounded-lg border px-2 py-1.5 text-left text-[10px] font-bold capitalize transition-all ${
                                isSel
                                  ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300 shadow-sm'
                                  : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20 hover:bg-white/5'
                              }`}
                            >
                              {kind.replace('-', ' ')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION VIEW SELECTOR */}
              <div className="p-3 border-t border-white/10">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500">SECTION VIEW</p>
                  {sectionAxis !== 'NONE' && (
                    <button
                      type="button"
                      onClick={() => setSectionInvert(!sectionInvert)}
                      className="text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 active:scale-95"
                    >
                      {sectionInvert ? '⇄ INVERTED' : '⇄ NORMAL'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1">
                  {(['NONE', 'X', 'Y', 'Z'] as SectionAxis[]).map((axis) => (
                    <button
                      key={axis}
                      type="button"
                      onClick={() => {
                        setSectionAxis(axis);
                        ping(tr ? `Kesit modu: ${axis}` : `Section view: ${axis}`);
                      }}
                      className={`py-1 rounded text-[9px] font-mono font-bold uppercase transition-all border ${
                        sectionAxis === axis
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-black'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {axis}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: M1 - M100 METRIC FASTENER & HOLE CREATOR & LIVE COLLISION ENGINE */}
          {sidebarTab === 'holes' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  {tr ? 'M1 - M100 DELİK & DİŞ KÜTÜPHANESİ' : 'M1 - M100 HOLE CREATOR'}
                </p>
                <p className="text-[9px] text-slate-400 leading-tight">
                  {tr ? 'ISO metrik standart delikler ekleyin. Canlı çakışma ve et kalınlığı uyarısı verir.' : 'ISO standard metric holes with real-time overlap and thin-wall warnings.'}
                </p>
              </div>

              {/* Hole Creator Form */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <div className="space-y-1">
                  <span className="text-[8px] font-mono text-slate-400 font-bold uppercase">{tr ? 'Metrik Çap' : 'Metric Size'}:</span>
                  <select
                    value={newHoleSize}
                    onChange={(e) => setNewHoleSize(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-1 font-mono text-[10px] text-cyan-300 font-bold"
                  >
                    {ISO_METRIC_HOLES.map((h) => (
                      <option key={h.size} value={h.size}>
                        {h.size} (Ø{h.nominalDiameter}mm · Kılavuz: Ø{h.tapDrillDiameter}mm · İmbus: Ø{h.counterboreDiameter}mm)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[8px] font-mono text-slate-400 font-bold uppercase">{tr ? 'Delik Tipi' : 'Hole Type'}:</span>
                  <select
                    value={newHoleType}
                    onChange={(e) => setNewHoleType(e.target.value as any)}
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-1 font-mono text-[10px] text-slate-200"
                  >
                    <option value="counterbore">{tr ? 'İmbus Havşalı (DIN 912 Counterbore)' : 'Counterbore (DIN 912)'}</option>
                    <option value="tap">{tr ? 'Dişli / Kılavuz (Metric Tap)' : 'Threaded / Tap'}</option>
                    <option value="clearance">{tr ? 'Düz Geçme Deliği (Clearance Hole)' : 'Clearance Hole'}</option>
                    <option value="countersink">{tr ? '90° Düz Havşalı (DIN 7991)' : 'Countersink 90°'}</option>
                  </select>
                </div>

                {/* X & Y relative coordinates */}
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-[8px] font-mono text-slate-400 uppercase">X (mm):</span>
                    <input
                      type="number"
                      value={newHoleX}
                      onChange={(e) => setNewHoleX(Number(e.target.value))}
                      className="w-full rounded-md border border-white/10 bg-black/60 px-2 py-1 font-mono text-[10px] text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[8px] font-mono text-slate-400 uppercase">Y (mm):</span>
                    <input
                      type="number"
                      value={newHoleY}
                      onChange={(e) => setNewHoleY(Number(e.target.value))}
                      className="w-full rounded-md border border-white/10 bg-black/60 px-2 py-1 font-mono text-[10px] text-white"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const id = `hole-${Date.now().toString(36)}`;
                    addHole({ id, size: newHoleSize, x: newHoleX, y: newHoleY, type: newHoleType });
                    ping(tr ? `${newHoleSize} deliği eklendi` : `${newHoleSize} hole added`);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[10px] hover:bg-amber-500/30 transition-all shadow-sm"
                >
                  ➕ {tr ? 'Delik / Diş Ekle' : 'Add Hole'}
                </button>
              </div>

              {/* LIVE HOLE COLLISION & PROXIMITY WARNINGS */}
              {holeIssues.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[8px] font-mono font-bold uppercase tracking-wider text-rose-400">
                    ⚠️ {tr ? 'ÇAKIŞMA & ET KALINLIĞI UYARILARI' : 'INTERFERENCE WARNINGS'}
                  </p>
                  {holeIssues.map((iss) => (
                    <div
                      key={iss.id}
                      className={`p-2.5 rounded-xl border text-[9px] font-mono leading-tight space-y-1 ${
                        iss.severity === 'CRITICAL'
                          ? 'bg-rose-950/80 border-rose-500/70 text-rose-200 shadow-md shadow-rose-950/50'
                          : 'bg-amber-950/80 border-amber-500/70 text-amber-200 shadow-md shadow-amber-950/50'
                      }`}
                    >
                      <div className="font-black flex items-center gap-1 text-[10px]">
                        <span>{iss.severity === 'CRITICAL' ? '🔴' : '⚠️'}</span>
                        <span>{tr ? iss.titleTr : iss.title}</span>
                      </div>
                      <p>{tr ? iss.messageTr : iss.message}</p>
                      <div className="text-[8px] text-slate-400 pt-0.5 border-t border-white/10 flex justify-between">
                        <span>{tr ? 'Mevcut' : 'Distance'}: {iss.distance}mm</span>
                        <span>{tr ? 'Gereken Min' : 'Min Safe'}: {iss.minSafeDistance}mm</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Existing Holes List */}
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-[8px] font-mono font-bold uppercase text-slate-400">
                  <span>{tr ? 'EKLENEN DELİKLER' : 'HOLES LIST'} ({holes.length})</span>
                  {holes.length > 0 && (
                    <button type="button" onClick={clearHoles} className="text-rose-400 hover:underline">
                      {tr ? 'Temizle' : 'Clear'}
                    </button>
                  )}
                </div>
                {holes.length === 0 ? (
                  <p className="text-[9px] text-slate-600 font-mono text-center py-2">{tr ? 'Henüz delik eklenmedi' : 'No holes added'}</p>
                ) : (
                  holes.map((h) => (
                    <div key={h.id} className="flex items-center justify-between px-2 py-1 rounded-lg bg-black/40 border border-white/5 font-mono text-[9px]">
                      <span className="font-bold text-cyan-300">{h.size} · ({h.x}, {h.y})mm</span>
                      <span className="text-slate-500 text-[8px]">{h.type}</span>
                      <button type="button" onClick={() => removeHole(h.id)} className="text-rose-400 hover:text-rose-200">✕</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ENGINEERING MATERIALS & MASS PROPERTIES */}
          {sidebarTab === 'material' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  {tr ? 'MÜHENDİSLİK MALZEMELERİ' : 'ENGINEERING MATERIALS'}
                </p>
                <p className="text-[9px] text-slate-400 leading-tight">
                  {tr ? 'Parçalara gerçek yoğunluk ve mukavemet atayın.' : 'Assign real material density & mechanical limits.'}
                </p>
              </div>

              {/* Material List */}
              <div className="space-y-1.5">
                {ENGINEERING_MATERIALS.map((mat) => {
                  const isSel = selectedMaterialId === mat.id;
                  return (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => {
                        setSelectedMaterialId(mat.id);
                        ping(tr ? `Malzeme: ${mat.nameTr}` : `Material: ${mat.name}`);
                      }}
                      className={`w-full text-left p-2 rounded-xl border transition-all ${
                        isSel
                          ? 'border-purple-400 bg-purple-500/20 text-white shadow-md'
                          : 'border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[10px]">
                        <span>{tr ? mat.nameTr : mat.name}</span>
                        <span className="font-mono text-purple-300 text-[9px] font-black">{mat.density} g/cm³</span>
                      </div>
                      <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 mt-1">
                        <span>Akma: {mat.yieldStrength} MPa</span>
                        <span>E: {mat.elasticModulus} GPa</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Mass Properties Summary Card */}
              <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-1 text-[9px] font-mono">
                <div className="text-purple-300 font-black text-[10px] flex items-center justify-between border-b border-purple-500/20 pb-1">
                  <span>⚖️ {tr ? 'TOPLAM MONTAJ KÜTLESİ' : 'TOTAL MASS'}</span>
                  <span>{massProps.massKg} kg</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{tr ? 'Toplam Hacim' : 'Volume'}:</span>
                  <span className="font-bold">{massProps.volumeCm3} cm³</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{tr ? 'Yüzey Alanı' : 'Area'}:</span>
                  <span className="font-bold">{massProps.surfaceAreaCm2} cm²</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{tr ? 'Ağırlık Merkezi (CoG)' : 'CoG'}:</span>
                  <span className="font-bold">({massProps.centerOfGravity.x}, {massProps.centerOfGravity.y}, {massProps.centerOfGravity.z})</span>
                </div>
              </div>
            </div>
          )}

          {/* PART / FEATURE & ASSEMBLY TREE */}
          <div className="h-48 flex flex-col border-t border-white/10 bg-[#080c12]">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500">
                {tr ? 'MONTAJ AĞACI' : 'ASSEMBLY TREE'}
              </span>
              <div className="flex items-center gap-1.5 text-[8px] font-mono font-bold">
                <button
                  type="button"
                  onClick={showAllParts}
                  className="text-cyan-400 hover:text-cyan-200"
                  title={tr ? 'Tümünü Göster' : 'Show All'}
                >
                  👁️ {tr ? 'Tümü' : 'All'}
                </button>
                <button
                  type="button"
                  onClick={hideAllParts}
                  className="text-slate-400 hover:text-white"
                  title={tr ? 'Tümünü Gizle' : 'Hide All'}
                >
                  🙈 {tr ? 'Gizle' : 'Hide'}
                </button>
                <button
                  type="button"
                  onClick={() => { if (confirm('Clear all parts from scene?')) clearScene(); }}
                  className="text-rose-400/80 hover:text-rose-300 ml-1"
                >
                  CLEAR
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5 custom-scrollbar">
              {parts.length === 0 ? (
                <p className="py-6 text-center text-[10px] font-mono text-slate-600">No parts yet</p>
              ) : (
                parts.map((p) => (
                  <div
                    key={p.id}
                    className={`mb-1 flex items-center gap-1.5 rounded-lg border px-2 py-1 transition-all ${
                      isolatedPartId === p.id
                        ? 'border-amber-400/60 bg-amber-500/20 text-amber-200 shadow-sm'
                        : selectedId === p.id
                        ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200'
                        : 'border-transparent hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate text-left text-[11px] font-bold"
                      onClick={() => select(p.id)}
                      style={{ color: p.color }}
                    >
                      {p.name}
                    </button>
                    {/* Isolate Button */}
                    <button 
                      type="button" 
                      onClick={() => setIsolatedPartId(isolatedPartId === p.id ? null : p.id)} 
                      className={`p-0.5 rounded transition-all ${isolatedPartId === p.id ? 'text-amber-400 font-bold bg-amber-400/20' : 'text-slate-500 hover:text-amber-300'}`}
                      title={isolatedPartId === p.id ? (tr ? 'İzolasyonu Kaldır' : 'Unisolate') : (tr ? 'Parçayı İzole Et' : 'Isolate Part')}
                    >
                      🎯
                    </button>
                    {/* Show/Hide */}
                    <button type="button" onClick={() => toggleVisible(p.id)} className="p-0.5 text-slate-500 hover:text-white">
                      {p.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    {/* Lock/Unlock */}
                    <button type="button" onClick={() => toggleLocked(p.id)} className="p-0.5 text-slate-500 hover:text-white">
                      {p.locked ? <Lock size={12} /> : <Unlock size={12} />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* CENTER: 3D VIEWPORT WITH TOPBAR CONTROLS & EMPTY OVERLAY */}
        <main className="relative min-w-0 flex-1 bg-[#070b10] flex flex-col">
          {/* Top In-Canvas Bar: Object / Inspect / Sculpt Modes + CAD Loader + Render Presets */}
          <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none gap-2">
            {/* Left: Studio Mode Switcher + CAD File Importer */}
            <div className="pointer-events-auto flex items-center p-0.5 rounded-xl bg-black/80 border border-white/10 backdrop-blur-md shadow-xl gap-1">
              <button
                type="button"
                onClick={() => setStudioMode('object')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  studioMode === 'object'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ✏️ {tr ? 'Tasarım' : 'Design'}
              </button>

              <button
                type="button"
                onClick={() => setStudioMode('inspect')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  studioMode === 'inspect'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🔍 {tr ? 'İnceleme & Ölçü' : 'Inspect & Probe'}
              </button>

              <button
                type="button"
                onClick={() => setStudioMode('sculpt')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  studioMode === 'sculpt'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🗿 {tr ? 'Sculpt' : 'Sculpt'}
              </button>

              <div className="h-4 w-px bg-white/10 mx-0.5" />

              {/* CAD File Import Button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleCADImport}
                accept=".stl,.obj,.gltf,.glb,.step,.stp,.x_t,.x_b,.iges,.igs"
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 transition-all"
                title={tr ? 'CAD Dosyası Yükle (STL, OBJ, GLTF, STEP, Parasolid)' : 'Import CAD Files'}
              >
                <Upload size={11} />
                <span>{tr ? 'CAD Yükle' : 'Import CAD'}</span>
              </button>
            </div>

            {/* Right: Render Presets (Solid, Wire, MatCap, PBR, X-Ray, Normals, Edges, Grid) */}
            <div className="pointer-events-auto flex items-center p-0.5 rounded-xl bg-black/70 border border-white/10 backdrop-blur-md shadow-xl gap-0.5 overflow-x-auto no-scrollbar">
              {(['solid', 'wire', 'matcap', 'pbr', 'xray', 'normals', 'edges', 'grid'] as RenderMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    if (m === 'grid') {
                      setShowGrid(!showGrid);
                    } else {
                      setRenderMode(m);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase transition-all capitalize ${
                    (m === 'grid' ? showGrid : renderMode === m)
                      ? 'bg-blue-500 text-white shadow-md font-black'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas 3D */}
          <div className="flex-1 relative">
            {/* ─── FLOATING CAD INSPECTION & MEASUREMENT HUD BANNER ─── */}
            {studioMode === 'inspect' && (
              <div className="absolute top-14 inset-x-4 sm:inset-x-8 z-30 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-amber-500/40 bg-slate-950/95 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-mono text-base shadow-inner border border-amber-500/30">
                    🔍
                  </div>
                  <div>
                    <div className="text-xs font-black text-white font-mono uppercase tracking-wider flex items-center gap-2">
                      <span>{tr ? 'CAD İNCELEME & MONTAJ DENETİM MODU' : 'CAD INSPECTION & ASSEMBLY REVIEW'}</span>
                      {isolatedPartId && (
                        <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/40 font-bold">
                          🎯 {tr ? 'İzole Parça Aktif' : 'Isolated Part Active'}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {tr ? 'Yüzeylere tıklayarak kumpas ölçüsü alın · Montajı patlatın veya parçaları izole edin' : 'Click surfaces to measure 3D distance · Explode assembly or isolate components'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  {/* Measure Tool Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setTool(tool === 'measure' ? 'select' : 'measure');
                      ping(tool === 'measure' ? (tr ? 'Seçim moduna dönüldü' : 'Select mode') : (tr ? '📏 3D Kumpas: İki yüzeye/noktaya tıklayın' : '📏 3D Caliper: Click two surfaces to measure'));
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all border ${
                      tool === 'measure'
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Ruler size={13} />
                    <span>{tr ? '3D Kumpas / Ölçü' : '3D Caliper'}</span>
                  </button>

                  {/* Exploded View Range Slider */}
                  <div className="flex items-center gap-2 bg-black/60 border border-white/10 px-3 py-1.5 rounded-xl">
                    <span className="text-[9px] uppercase text-amber-400 font-bold">💥 {tr ? 'Patlatma' : 'Explode'}:</span>
                    <input
                      type="range"
                      min={0}
                      max={150}
                      step={1}
                      value={explodeFactor}
                      onChange={(e) => setExplodeFactor(Number(e.target.value))}
                      className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <span className="text-[9px] text-slate-300 font-bold">{explodeFactor}%</span>
                  </div>

                  {/* Ghost Mode Toggle */}
                  <button
                    type="button"
                    onClick={() => setGhostIsolated(!ghostIsolated)}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                      ghostIsolated
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                    title={tr ? 'İzole edilmemiş parçaları hayalet/şeffaf göster' : 'Show non-isolated parts as ghost'}
                  >
                    👻 {tr ? 'Hayalet' : 'Ghost'}
                  </button>

                  {/* Isolate Selected Toggle */}
                  {selected && (
                    <button
                      type="button"
                      onClick={toggleIsolateSelected}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                        isolatedPartId === selected.id
                          ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                      }`}
                    >
                      🎯 {isolatedPartId === selected.id ? (tr ? 'İzoleyi Kaldır' : 'Unisolate') : (tr ? 'Seçileni İzole Et' : 'Isolate Selected')}
                    </button>
                  )}

                  {/* Clear Measurements Button */}
                  {measurements.length > 0 && (
                    <button
                      type="button"
                      onClick={clearMeasurements}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold hover:bg-rose-500/30 transition-all"
                    >
                      🗑️ {tr ? `Ölçüleri Sil (${measurements.length})` : `Clear (${measurements.length})`}
                    </button>
                  )}
                </div>
              </div>
            )}
            {/* Floating Blender Sculpting HUD Banner */}
            {studioMode === 'sculpt' && (
              <div className="absolute top-14 inset-x-4 sm:inset-x-8 z-30 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-indigo-500/40 bg-slate-950/95 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 font-mono text-base shadow-inner border border-indigo-500/30">
                    🖌️
                  </div>
                  <div>
                    <div className="text-xs font-black text-white font-mono uppercase tracking-wider flex items-center gap-2">
                      <span>{tr ? 'BLENDER HEYKELTIRAŞ MODU (SCULPT)' : 'BLENDER SCULPT MODE'}</span>
                      {selected ? (
                        <span className="text-[10px] text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded-lg border border-cyan-500/30 font-bold">
                          {selected.name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/30 font-bold">
                          {tr ? '⚠️ Model Seçiniz' : '⚠️ Select a shape'}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {tr ? 'Yüzey üzerinde sol tıkla basılı tutup sürükleyin (Fırça halkası yüzeyde takip eder)' : 'Click & drag on mesh surface to sculpt (Brush ring tracks surface)'}
                    </div>
                  </div>
                </div>

                {/* Sculpt Brushes */}
                <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
                  {[
                    { id: 'clay', label: 'Clay', icon: '🧱' },
                    { id: 'draw', label: 'Draw', icon: '🖌️' },
                    { id: 'inflate', label: 'Inflate', icon: '🎈' },
                    { id: 'smooth', label: 'Smooth', icon: '🌊' },
                    { id: 'pinch', label: 'Pinch', icon: '🤏' },
                    { id: 'flatten', label: 'Flatten', icon: '📐' },
                    { id: 'grab', label: 'Grab', icon: '✋' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSculptBrush(b.id as any)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all ${
                        sculptBrush === b.id
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 font-black'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span>{b.icon}</span>
                      <span className="hidden sm:inline">{b.label}</span>
                    </button>
                  ))}
                </div>

                {/* Brush Controls: Radius, Strength, Add/Sub, Symmetry, Reset */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-slate-300">
                  {/* Direction Add/Sub */}
                  <button
                    type="button"
                    onClick={() => setSculptDirection(sculptDirection === 'add' ? 'sub' : 'add')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all active:scale-95 ${
                      sculptDirection === 'add'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-rose-500/20 border-rose-400 text-rose-300'
                    }`}
                  >
                    {sculptDirection === 'add' ? '➕ ADD' : '➖ SUB'}
                  </button>

                  {/* Radius Slider */}
                  <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 font-bold">R:</span>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={sculptRadius}
                      onChange={(e) => setSculptRadius(Number(e.target.value))}
                      className="w-16 h-1.5 bg-slate-700 rounded-lg accent-indigo-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-white font-bold w-8 text-right">{sculptRadius}mm</span>
                  </div>

                  {/* Strength Slider */}
                  <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 font-bold">Str:</span>
                    <input
                      type="range"
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      value={sculptStrength}
                      onChange={(e) => setSculptStrength(Number(e.target.value))}
                      className="w-16 h-1.5 bg-slate-700 rounded-lg accent-indigo-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-white font-bold w-8 text-right">{Math.round(sculptStrength * 100)}%</span>
                  </div>

                  {/* X-Symmetry */}
                  <button
                    type="button"
                    onClick={() => setSculptSymmetry(!sculptSymmetry)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all active:scale-95 ${
                      sculptSymmetry
                        ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                    title="X-Axis Mirror Symmetry"
                  >
                    🪞 X-SYM
                  </button>

                  {/* Reset Sculpt */}
                  <button
                    type="button"
                    onClick={resetSculpt}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/5 border border-white/10 text-slate-400 hover:text-rose-300 hover:border-rose-500/30 transition-all active:scale-95"
                    title="Reset Sculpt Mesh"
                  >
                    🔄 RESET
                  </button>
                </div>
              </div>
            )}

            {/* Floating Interactive Sketch HUD Banner */}
            {(tool === 'sketch-add' || tool === 'sketch-cut' || tool === 'sketch-loft') && (
              <div className="absolute top-3 inset-x-4 z-30 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl border border-cyan-500/40 bg-slate-950/95 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 font-mono text-xs font-black">
                    ✏️
                  </span>
                  <div>
                    <div className="text-xs font-black text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <span>{tr ? `ÇİZİM: ${pendingOp.toUpperCase()}` : `SKETCH: ${pendingOp.toUpperCase()}`}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {sketchPoints.length} {tr ? 'nokta' : 'pts'} · {sketchClosed ? (tr ? '✓ Profil Kapalı' : '✓ Closed') : (tr ? 'Çizim için ızgaraya tıklayın' : 'Click grid to sketch')}
                    </div>
                  </div>
                </div>

                {/* ─── SHAPE PRIMITIVES SELECTOR ─── */}
                <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setSketchShapeMode('line')}
                    className={`px-2 py-1 rounded-lg font-mono text-[10px] font-bold transition-all ${
                      sketchShapeMode === 'line'
                        ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={tr ? 'Serbest Çizgi (Polyline)' : 'Freeform Polyline'}
                  >
                    📏 {tr ? 'Çizgi' : 'Line'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSketchShapeMode('circle')}
                    className={`px-2 py-1 rounded-lg font-mono text-[10px] font-bold transition-all ${
                      sketchShapeMode === 'circle'
                        ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={tr ? 'Daire Çizimi (Merkeze Tıklayın)' : 'Circle (Click Center)'}
                  >
                    ⭕ {tr ? 'Daire' : 'Circle'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSketchShapeMode('rect')}
                    className={`px-2 py-1 rounded-lg font-mono text-[10px] font-bold transition-all ${
                      sketchShapeMode === 'rect'
                        ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={tr ? 'Dikdörtgen (2 Köşe Belirleyin)' : 'Rectangle (2 Corners)'}
                  >
                    ⬛ {tr ? 'Dikdörtgen' : 'Rect'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSketchShapeMode('polygon')}
                    className={`px-2 py-1 rounded-lg font-mono text-[10px] font-bold transition-all ${
                      sketchShapeMode === 'polygon'
                        ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={tr ? 'Altıgen / Çokgen (Merkeze Tıklayın)' : 'Hexagon / Polygon'}
                  >
                    🔷 {tr ? 'Çokgen' : 'Polygon'}
                  </button>
                </div>

                {/* ─── GEOMETRIC CONSTRAINT SNAPPING TOGGLES ─── */}
                <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 font-mono text-[9px]">
                  <span className="text-[8px] text-slate-500 uppercase px-1 font-bold">{tr ? 'KISITLAR:' : 'CONSTRAINTS:'}</span>
                  
                  <button
                    type="button"
                    onClick={() => toggleConstraint('perp')}
                    className={`px-1.5 py-1 rounded-md font-bold transition-all border ${
                      constraintPerpendicular
                        ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300'
                        : 'bg-white/5 border-transparent text-slate-400 hover:text-white'
                    }`}
                    title={tr ? 'Diklik Kısıtı (90° Yakalama)' : 'Perpendicular Constraint (90° Snap)'}
                  >
                    ⊥ {tr ? 'Diklik' : 'Perp'}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleConstraint('parallel')}
                    className={`px-1.5 py-1 rounded-md font-bold transition-all border ${
                      constraintParallel
                        ? 'bg-cyan-500/25 border-cyan-500/50 text-cyan-300'
                        : 'bg-white/5 border-transparent text-slate-400 hover:text-white'
                    }`}
                    title={tr ? 'Paralellik Kısıtı (0°/180° Yakalama)' : 'Parallel Constraint Snap'}
                  >
                    ∥ {tr ? 'Paralel' : 'Parallel'}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleConstraint('equal')}
                    className={`px-1.5 py-1 rounded-md font-bold transition-all border ${
                      constraintEqual
                        ? 'bg-amber-500/25 border-amber-500/50 text-amber-300'
                        : 'bg-white/5 border-transparent text-slate-400 hover:text-white'
                    }`}
                    title={tr ? 'Eşitlik Kısıtı (Önceki Çizgi Uzunluğuna Eşitleme)' : 'Equal Length Constraint Snap'}
                  >
                    = {tr ? 'Eşitlik' : 'Equal'}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleConstraint('ortho')}
                    className={`px-1.5 py-1 rounded-md font-bold transition-all border ${
                      constraintOrtho
                        ? 'bg-purple-500/25 border-purple-500/50 text-purple-300'
                        : 'bg-white/5 border-transparent text-slate-400 hover:text-white'
                    }`}
                    title={tr ? 'Ortho Modu (Yatay/Dikey 90° Kilidi)' : 'Ortho Lock (0°/90°/180°/270°)'}
                  >
                    ⟷ Ortho
                  </button>
                </div>

                {/* ─── PARAMETERS & ACTIONS ─── */}
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  {sketchShapeMode === 'circle' && (
                    <label className="flex items-center gap-1.5 bg-black/60 border border-white/10 px-2 py-1 rounded-xl text-slate-300">
                      <span className="text-[9px] uppercase text-cyan-400 font-bold">{tr ? 'Yarıçap' : 'Radius'}:</span>
                      <input
                        type="number"
                        value={sketchCircleRadius}
                        onChange={(e) => setSketchCircleRadius(Number(e.target.value))}
                        className="w-10 bg-transparent text-white font-bold text-xs outline-none"
                      />
                      <span className="text-[9px] text-slate-500">mm</span>
                    </label>
                  )}

                  {pendingOp === 'extrude' && (
                    <label className="flex items-center gap-1.5 bg-black/60 border border-white/10 px-2 py-1 rounded-xl text-slate-300">
                      <span className="text-[9px] uppercase text-cyan-400 font-bold">{tr ? 'Kalınlık' : 'Depth'}:</span>
                      <input
                        type="number"
                        value={extrudeDepth}
                        onChange={(e) => setExtrudeDepth(Number(e.target.value))}
                        className="w-10 bg-transparent text-white font-bold text-xs outline-none"
                      />
                      <span className="text-[9px] text-slate-500">mm</span>
                    </label>
                  )}

                  {pendingOp === 'revolve' && (
                    <label className="flex items-center gap-1.5 bg-black/60 border border-white/10 px-2 py-1 rounded-xl text-slate-300">
                      <span className="text-[9px] uppercase text-cyan-400 font-bold">{tr ? 'Açı' : 'Angle'}:</span>
                      <input
                        type="number"
                        value={revolveAngle}
                        onChange={(e) => setRevolveAngle(Number(e.target.value))}
                        className="w-10 bg-transparent text-white font-bold text-xs outline-none"
                      />
                      <span className="text-[9px] text-slate-500">°</span>
                    </label>
                  )}

                  {pendingOp === 'loft' && (
                    <label className="flex items-center gap-1.5 bg-black/60 border border-white/10 px-2 py-1 rounded-xl text-slate-300">
                      <span className="text-[9px] uppercase text-cyan-400 font-bold">{tr ? 'Yükseklik' : 'Height'}:</span>
                      <input
                        type="number"
                        value={loftHeight}
                        onChange={(e) => setLoftHeight(Number(e.target.value))}
                        className="w-10 bg-transparent text-white font-bold text-xs outline-none"
                      />
                      <span className="text-[9px] text-slate-500">mm</span>
                    </label>
                  )}

                  <button
                    type="button"
                    onClick={undoSketchPoint}
                    disabled={sketchPoints.length === 0}
                    className="px-2 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white disabled:opacity-30 active:scale-95 text-[10px]"
                  >
                    {tr ? 'Geri Al' : 'Undo'}
                  </button>

                  {!sketchClosed && sketchPoints.length >= 3 && (
                    <button
                      type="button"
                      onClick={closeSketch}
                      className="px-2 py-1 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold active:scale-95 text-[10px]"
                    >
                      {tr ? 'Profili Kapat' : 'Close Profile'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!sketchClosed) closeSketch();
                      const id = commitExtrude();
                      if (id) {
                        ping(tr ? '✨ Katı Model Oluşturuldu!' : '✨ Solid Model Generated!');
                      } else {
                        ping(tr ? 'En az 3 nokta gereklidir' : 'At least 3 points required');
                      }
                    }}
                    disabled={sketchPoints.length < 3}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black uppercase text-[11px] shadow-lg shadow-cyan-500/20 disabled:opacity-40 active:scale-95 transition-transform"
                  >
                    <Check size={13} className="stroke-[3]" />
                    <span>{tr ? 'Katı Oluştur' : 'Generate Solid'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={clearSketch}
                    className="p-1 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white active:scale-95"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            )}

            <DesignViewport />

            {/* Center: Empty scene hint card when 0 parts */}
            {parts.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="max-w-sm rounded-2xl border border-white/10 bg-black/60 p-5 text-center shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Cuboid size={16} />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Empty scene</h3>
                  <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                    Sketch → dimensions → Extrude / Revolve / Loft. Then fillet, chamfer, shell or cut.
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Right: 3D Axis Indicator */}
            <div className="pointer-events-none absolute bottom-4 right-20 z-10 flex items-center gap-1 bg-black/60 border border-white/10 p-2 rounded-xl backdrop-blur">
              <div className="flex items-center gap-1 font-mono text-[9px] font-bold">
                <span className="text-rose-400">X</span>
                <span className="text-emerald-400">Y</span>
                <span className="text-blue-400">Z</span>
              </div>
            </div>
          </div>

          {/* Toast Notification */}
          {toast && (
            <div className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-xl border border-cyan-500/30 bg-black/80 px-4 py-2 text-[11px] font-bold text-cyan-200 backdrop-blur-xl shadow-2xl">
              {toast}
            </div>
          )}
        </main>

        {/* RIGHT SIDEBAR: Selected Part Inspector */}
        <aside className="flex w-[280px] shrink-0 flex-col border-l border-white/10 bg-[#0a0e14] text-[11px]">
          {selected ? (
            <div className="flex-1 space-y-4 overflow-y-auto p-3 custom-scrollbar">
              <div>
                <p className="mb-1 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500">PART NAME</p>
                <input
                  value={selected.name}
                  onChange={(e) => setSelectedName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-[12px] font-bold text-white outline-none focus:border-cyan-400"
                />
                <p className="mt-1 text-[10px] font-mono text-cyan-400 capitalize">{kindLabel(selected.kind, tr)}</p>
              </div>

              {/* Color Palette */}
              <div>
                <p className="mb-1 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500">COLOR / MATERIAL</p>
                <div className="flex flex-wrap gap-1.5">
                  {PART_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`h-6 w-6 rounded-full border-2 transition-all ${
                        selected.color === c ? 'scale-110 border-white shadow-md' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Dimensions / Parameters */}
              <div>
                <p className="mb-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500">
                  {selected.kind === 'profile' ? (tr ? 'KATI PARAMETRELERİ' : 'SOLID PARAMETERS') : (tr ? 'BOYUTLAR (mm)' : 'DIMENSIONS (mm)')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(selected.params).map(([k, v]) => (
                    <label key={k} className="block min-w-0 bg-black/30 p-1.5 rounded-lg border border-white/5">
                      <span className="mb-0.5 flex justify-between text-[8px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        {k === 'revolveAngle' ? (tr ? 'Dönme Açısı (°)' : 'Rev Angle (°)')
                          : k === 'loftHeight' ? (tr ? 'Loft Yükseklik' : 'Loft Height')
                          : k === 'loftScale' ? (tr ? 'Tepe Ölçeği (%)' : 'Top Scale (%)')
                          : k === 'loftTwist' ? (tr ? 'Büküm Açısı (°)' : 'Twist Angle (°)')
                          : k === 'extrudeDepth' ? (tr ? 'Ekstrüzyon (mm)' : 'Extrude (mm)')
                          : k}
                      </span>
                      <input
                        type="number"
                        value={v}
                        onChange={(e) => updateSelectedParams({ [k]: Number(e.target.value) })}
                        className="w-full rounded-md border border-white/10 bg-black/50 px-2 py-1 font-mono text-[11px] text-cyan-300 font-bold outline-none focus:border-cyan-400"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Transform (XYZ) */}
              <div>
                <p className="mb-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500">POSITION</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['x', 'y', 'z'] as const).map((axis) => (
                    <label key={axis} className="block">
                      <span className="text-[8px] font-mono uppercase text-slate-400">{axis}</span>
                      <input
                        type="number"
                        value={selected.position[axis]}
                        onChange={(e) => updateSelectedTransform({ position: { [axis]: Number(e.target.value) } })}
                        className="w-full rounded-md border border-white/10 bg-black/40 px-1.5 py-1 font-mono text-[11px] text-white outline-none"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Duplicate & Delete Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={duplicateSelected}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 py-2 text-[10px] font-black uppercase text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                >
                  <Copy size={12} /> Duplicate
                </button>
                <button
                  type="button"
                  onClick={deleteSelected}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 py-2 text-[10px] font-black uppercase text-rose-400 hover:bg-rose-500/10 transition-all"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2.5 p-6 text-center">
              <div className="h-10 w-10 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-500">
                <MousePointer2 size={18} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">Select a part</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Move (G), rotate (R), scale (S). Assign a parent for assembly.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* ─── 2D TECHNICAL DRAWING SHEET MODAL ─── */}
      {showTechnicalDrawingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-5xl h-[88vh] flex flex-col rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 font-mono font-black border border-cyan-500/30">
                  📄
                </div>
                <div>
                  <h3 className="text-sm font-black text-white font-mono uppercase tracking-wider">
                    {tr ? '2D TEKNİK RESİM ÇIKTISI (ISO ANTETLİ PROJEKSİYON)' : '2D TECHNICAL DRAWING SHEET'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {selected ? selected.name : projectName} · {activeMaterial.name} · {massProps.massKg} kg
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const svgData = generateTechnicalDrawingSVG(
                      selected || parts[0] || ({ id: 'p1', name: projectName, kind: 'box', color: '#fff', visible: true, locked: false, parentId: null, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, params: { width: 60, height: 40, depth: 30 } }),
                      massProps,
                      { projectName, materialName: activeMaterial.nameTr }
                    );
                    downloadFile(svgData, `${projectName}_Technical_Drawing.svg`, 'image/svg+xml');
                    ping(tr ? 'SVG Teknik Resim indirildi' : 'SVG Drawing Downloaded');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs hover:bg-cyan-500/30 transition-all"
                >
                  <Download size={13} />
                  <span>{tr ? 'SVG İndir' : 'Download SVG'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all"
                >
                  <span>🖨️ {tr ? 'Yazdır / PDF' : 'Print / PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowTechnicalDrawingModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-rose-500/20"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Drawing Sheet Canvas Container */}
            <div className="flex-1 bg-slate-950/60 p-4 flex items-center justify-center overflow-auto">
              <div
                className="w-full h-full max-h-[70vh] bg-white rounded-xl shadow-2xl p-2 flex items-center justify-center"
                dangerouslySetInnerHTML={{
                  __html: generateTechnicalDrawingSVG(
                    selected || parts[0] || ({ id: 'p1', name: projectName, kind: 'box', color: '#fff', visible: true, locked: false, parentId: null, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, params: { width: 60, height: 40, depth: 30 } }),
                    massProps,
                    { projectName, materialName: activeMaterial.nameTr }
                  ),
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── ENGINEERING MATERIALS & PHYSICAL MASS PROPERTIES MODAL ─── */}
      {showMaterialsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-4xl max-h-[88vh] flex flex-col rounded-3xl bg-slate-900 border border-purple-500/40 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 font-mono font-black border border-purple-500/30">
                  ⚖️
                </div>
                <div>
                  <h3 className="text-sm font-black text-white font-mono uppercase tracking-wider">
                    {tr ? 'MÜHENDİSLİK MALZEME & KÜTLE ÖZELLİKLERİ' : 'MASS PROPERTIES & MATERIAL ANALYSIS'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {parts.length} {tr ? 'Parça' : 'Parts'} · {activeMaterial.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMaterialsModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-rose-500/20"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Top Mass Properties Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <div className="text-[10px] font-mono text-purple-400 font-bold uppercase">{tr ? 'Toplam Kütle' : 'Total Mass'}</div>
                  <div className="text-xl font-mono font-black text-white">{massProps.massKg} kg</div>
                  <div className="text-[9px] font-mono text-slate-400">({massProps.massGrams} g)</div>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase">{tr ? 'Toplam Hacim' : 'Total Volume'}</div>
                  <div className="text-xl font-mono font-black text-white">{massProps.volumeCm3} cm³</div>
                  <div className="text-[9px] font-mono text-slate-400">({massProps.volumeMm3} mm³)</div>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <div className="text-[10px] font-mono text-amber-400 font-bold uppercase">{tr ? 'Yüzey Alanı' : 'Surface Area'}</div>
                  <div className="text-xl font-mono font-black text-white">{massProps.surfaceAreaCm2} cm²</div>
                  <div className="text-[9px] font-mono text-slate-400">({massProps.surfaceAreaMm2} mm²)</div>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <div className="text-[10px] font-mono text-rose-400 font-bold uppercase">{tr ? 'Ağırlık Merkezi (CoG)' : 'Center of Mass'}</div>
                  <div className="text-sm font-mono font-black text-white">X: {massProps.centerOfGravity.x} mm</div>
                  <div className="text-sm font-mono font-black text-white">Y: {massProps.centerOfGravity.y} mm · Z: {massProps.centerOfGravity.z} mm</div>
                </div>
              </div>

              {/* Material Selector & Table */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3">
                  {tr ? 'MALZEME SEÇİMİ VE MEKANİK DAYANIM LİMİTLERİ' : 'MATERIAL MECHANICAL LIMITS'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ENGINEERING_MATERIALS.map((mat) => {
                    const isSel = selectedMaterialId === mat.id;
                    return (
                      <button
                        key={mat.id}
                        type="button"
                        onClick={() => setSelectedMaterialId(mat.id)}
                        className={`text-left p-3.5 rounded-2xl border transition-all ${
                          isSel
                            ? 'border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/15 ring-1 ring-purple-400/50'
                            : 'border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-black text-xs text-white">{tr ? mat.nameTr : mat.name}</span>
                          <span className="font-mono text-purple-300 font-bold text-[10px] bg-purple-500/20 px-2 py-0.5 rounded-md">
                            {mat.density} g/cm³
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-2 leading-snug">{mat.description}</p>
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[9px] font-mono text-slate-300">
                          <div>
                            <span className="text-slate-500 block">Akma (σy):</span>
                            <span className="font-bold text-amber-300">{mat.yieldStrength} MPa</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Çekme (σu):</span>
                            <span className="font-bold text-cyan-300">{mat.ultimateStrength} MPa</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Modül (E):</span>
                            <span className="font-bold text-purple-300">{mat.elasticModulus} GPa</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
