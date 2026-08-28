'use client';

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Box, Copy, Download, Eye, EyeOff, Grid3X3, Lock, Maximize2, MousePointer2,
  Move, Pencil, RotateCcw, RotateCw, Ruler, Scissors, Sun, Trash2, Unlock,
  Layers, ChevronDown, ChevronRight, Upload, Sparkles, Sliders, Eye as EyeIcon,
  Compass, Undo, Redo, Shield, Cuboid, Check, X, FileText, Wrench, Boxes, Scale, CircleDot
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { LANGUAGE_OPTIONS } from '@/locales/siteNav';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { kindLabel, PART_COLORS, useDesignStore, type DesignKind, type RenderMode, type StudioMode, type SectionAxis, type DesignPart } from './designStore';
import { exportPartsToSTL, downloadFile } from './exporter';
import { loadCADFile } from './cadImporter';
import { ENGINEERING_MATERIALS, calculateAssemblyMassProperties } from './materialsEngine';
import { generateTechnicalDrawingSVG, generateBatchDrawingsHTML, type DrawingTemplateStyle, type DrawingColorTheme } from './technicalDrawingGenerator';
import { generateStepBox, generateStepPlateWithHole, generateStepShaft, downloadStepFile } from '@/engines/cad/StepBRepExporter';
import { useLicenseStore } from '@/store/licenseStore';
import { checkHoleInterferences, ISO_METRIC_HOLES, type HoleItem, type SurfaceFace, type SurfaceCutItem } from './holeStandards';
import { BoltCirclePcdModal } from './BoltCirclePcdModal';
import { SurfaceCutModal } from './SurfaceCutModal';
import { getDesignStudioStrings, getDesignKindLabel } from '@/locales/designStudioTranslations';


const DesignViewport = dynamic(() => import('./DesignViewport').then((m) => m.DesignViewport || m.default), {
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

export function DesignStudio({ embedded = false }: { embedded?: boolean }) {
  const { language, setLanguage } = useI18nStore();
  const tr = language === 'tr';
  const tStudio = getDesignStudioStrings(language);
  const [toast, setToast] = useState<string | null>(null);
  const [showInventorMap, setShowInventorMap] = useState(false);
  const [exportFormat, setExportFormat] = useState('stl-binary');
  const [langOpen, setLangOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
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
  const sectionSolidCap = useDesignStore((s) => s.sectionSolidCap);
  const setSectionSolidCap = useDesignStore((s) => s.setSectionSolidCap);
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
  const explodeDirection = useDesignStore((s) => s.explodeDirection);
  const setExplodeDirection = useDesignStore((s) => s.setExplodeDirection);
  const isolatedPartId = useDesignStore((s) => s.isolatedPartId);
  const setIsolatedPartId = useDesignStore((s) => s.setIsolatedPartId);
  const ghostIsolated = useDesignStore((s) => s.ghostIsolated);
  const setGhostIsolated = useDesignStore((s) => s.setGhostIsolated);
  const showAllParts = useDesignStore((s) => s.showAllParts);
  const hideAllParts = useDesignStore((s) => s.hideAllParts);
  const toggleIsolateSelected = useDesignStore((s) => s.toggleIsolateSelected);
  const measurements = useDesignStore((s) => s.measurements);
  const clearMeasurements = useDesignStore((s) => s.clearMeasurements);
  const measureMode = useDesignStore((s) => s.measureMode);
  const setMeasureMode = useDesignStore((s) => s.setMeasureMode);

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
  const updatePart = useDesignStore((s) => s.updatePart);

  const [sidebarTab, setSidebarTab] = useState<'library' | 'holes' | 'material'>('library');
  const [showPcdModal, setShowPcdModal] = useState<boolean>(false);
  const [showCutModal, setShowCutModal] = useState<boolean>(false);
  const [drawingTargetId, setDrawingTargetId] = useState<'all' | string>('all');

  // Unified Holes & Cuts Studio Sub-Tab: 'single' | 'pattern' | 'cut'
  const [holesSubTab, setHolesSubTab] = useState<'single' | 'pattern' | 'cut'>('single');
  const [newHoleSize, setNewHoleSize] = useState('M6');
  const [newHoleX, setNewHoleX] = useState(0);
  const [newHoleY, setNewHoleY] = useState(0);
  const [newHoleType, setNewHoleType] = useState<'tap' | 'clearance' | 'counterbore' | 'countersink'>('counterbore');
  const [isThroughHole, setIsThroughHole] = useState<boolean>(true);
  const [holeDepth, setHoleDepth] = useState<number>(15);

  // PCD & Matrix Pattern State
  const [patternType, setPatternType] = useState<'pcd' | 'grid'>('pcd');
  const [pcdDiameter, setPcdDiameter] = useState<number>(50);
  const [pcdCount, setPcdCount] = useState<number>(6);
  const [pcdStartAngle, setPcdStartAngle] = useState<number>(0);
  const [gridCols, setGridCols] = useState<number>(3);
  const [gridRows, setGridRows] = useState<number>(2);
  const [gridDx, setGridDx] = useState<number>(20);
  const [gridDy, setGridDy] = useState<number>(20);

  // Pocket & Surface Cut State
  const [cutType, setCutType] = useState<'rect' | 'circle' | 'slot'>('rect');
  const [cutWidth, setCutWidth] = useState<number>(25);
  const [cutLength, setCutLength] = useState<number>(35);
  const [cutDiameter, setCutDiameter] = useState<number>(20);
  const [cutDepth, setCutDepth] = useState<number>(8);
  const [cutIsThrough, setCutIsThrough] = useState<boolean>(false);
  const [cutAngle, setCutAngle] = useState<number>(0);
  const [cutX, setCutX] = useState<number>(0);
  const [cutY, setCutY] = useState<number>(0);

  // Active Face & Cut Store Bindings
  const activeFace = useDesignStore((s) => s.activeFace);
  const setActiveFace = useDesignStore((s) => s.setActiveFace);
  const facePickMode = useDesignStore((s) => s.facePickMode);
  const setFacePickMode = useDesignStore((s) => s.setFacePickMode);
  const cuts = useDesignStore((s) => s.cuts);
  const addCut = useDesignStore((s) => s.addCut);
  const removeCut = useDesignStore((s) => s.removeCut);
  const clearCuts = useDesignStore((s) => s.clearCuts);


  // Custom 2D Drawing Template & Batch PDF State
  const [templateStyle, setTemplateStyle] = useState<DrawingTemplateStyle>('iso7200');
  const [colorTheme, setColorTheme] = useState<DrawingColorTheme>('classic');
  const [companyName, setCompanyName] = useState('ALUCALCULATOR CAD SYSTEMS');
  const [companySubtext, setCompanySubtext] = useState('Precision Engineering & Manufacturing');
  const [drawingAuthor, setDrawingAuthor] = useState('Design Engineer');
  const [drawingApprover, setDrawingApprover] = useState('Quality Assurance');
  const [drawingRevision, setDrawingRevision] = useState('01');
  const [drawingTolerance, setDrawingTolerance] = useState('ISO 2768-m');
  const [drawingSurfaceFinish, setDrawingSurfaceFinish] = useState('Ra 1.6 μm');
  const [drawingSheetSize, setDrawingSheetSize] = useState<'A4' | 'A3' | 'A2'>('A3');
  const [drawingProjection, setDrawingProjection] = useState<'first-angle' | 'third-angle'>('first-angle');
  const [drawingNotes, setDrawingNotes] = useState(
    '1. Tüm ölçüler milimetre (mm) cinsindendir.\n2. Belirtilmeyen pahlar 0.5x45°, radyuslar R1.0 mm.\n3. Tüm keskin çapaklar temizlenecektir.'
  );
  const [showTemplateConfig, setShowTemplateConfig] = useState(false);

  const activeDrawingParts = useMemo(() => {
    if (drawingTargetId === 'all') return parts;
    const found = parts.find((p) => p.id === drawingTargetId);
    return found ? [found] : parts;
  }, [drawingTargetId, parts]);

  const massProps = useMemo(() => {
    return calculateAssemblyMassProperties(parts, selectedMaterialId);
  }, [parts, selectedMaterialId]);

  const activeMaterial = useMemo(() => {
    return ENGINEERING_MATERIALS.find((m) => m.id === selectedMaterialId) || ENGINEERING_MATERIALS[0];
  }, [selectedMaterialId]);

  const holeIssues = useMemo(() => {
    const p = selected?.params || {};
    const w = p.width || p.diameter || 60;
    const h = p.length || p.depth || p.diameter || 40;
    return checkHoleInterferences(holes, { width: w, height: h });
  }, [holes, selected]);

  const activeFaceBounds = useMemo(() => {
    if (!selected) return { width: 60, height: 40, label: '60 × 40 mm', minX: -30, maxX: 30, minY: -20, maxY: 20 };
    const p = selected.params || {};
    const pw = p.width || p.diameter || 60;
    const ph = p.height || p.length || 40;
    const pd = p.depth || p.length || p.diameter || 40;

    let fw = pw;
    let fh = pd;
    if (activeFace === 'front' || activeFace === 'back') {
      fw = pw;
      fh = ph;
    } else if (activeFace === 'right' || activeFace === 'left') {
      fw = pd;
      fh = ph;
    }
    return {
      width: Math.round(fw),
      height: Math.round(fh),
      label: `${Math.round(fw)} × ${Math.round(fh)} mm`,
      minX: -Math.round(fw / 2),
      maxX: Math.round(fw / 2),
      minY: -Math.round(fh / 2),
      maxY: Math.round(fh / 2),
    };
  }, [selected, activeFace]);


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

    if (exportFormat === 'step') {
      const allowed = useLicenseStore.getState().guardFeature('step');
      if (!allowed) return;

      const p0 = parts[0];
      const p0Params = p0.params || {};
      const stepStr = generateStepBox({
        width: Math.max((p0Params.width || p0Params.diameter || 40), 20),
        height: Math.max((p0Params.height || p0Params.diameter || 40), 20),
        thickness: Math.max((p0Params.depth || p0Params.length || 20), 5),
        name: projectName || 'AluDesign_Assembly',
      });
      downloadStepFile(stepStr, `${(projectName || 'AluDesign').replace(/\s+/g, '_')}.step`);
      ping(tr ? 'Montaj B-Rep STEP (ISO 10303-21) olarak indirildi' : 'Assembly exported as B-Rep STEP');
      return;
    }

    const stlStr = exportPartsToSTL(parts, projectName || 'AluDesign');
    downloadFile(stlStr, `${(projectName || 'AluDesign').replace(/\s+/g, '_')}.stl`, 'application/sla');
    ping(tr ? 'Tüm montaj STL olarak indirildi' : 'Assembly exported as STL');
  };

  const handleExportSelected = () => {
    if (!selected) return;

    if (exportFormat === 'step') {
      const allowed = useLicenseStore.getState().guardFeature('step');
      if (!allowed) return;

      const sp = selected.params || {};
      let stepStr = '';
      if (selected.kind === 'cylinder' || selected.kind === 'keyway-shaft' || selected.kind === 'd-shaft') {
        stepStr = generateStepShaft({
          length: Math.max((sp.length || sp.depth || 50), 50),
          diameter: Math.max((sp.diameter || 20), 20),
          name: selected.name,
        });
      } else if (selected.kind === 'plate' || selected.kind === 'slot-plate') {
        stepStr = generateStepPlateWithHole({
          width: Math.max((sp.width || 60), 60),
          height: Math.max((sp.height || 40), 40),
          thickness: Math.max((sp.depth || 5), 5),
          holeRadius: (sp.holeRadius || 8),
          name: selected.name,
        });
      } else {
        stepStr = generateStepBox({
          width: Math.max((sp.width || 30), 30),
          height: Math.max((sp.height || 30), 30),
          thickness: Math.max((sp.depth || 10), 10),
          name: selected.name,
        });
      }

      downloadStepFile(stepStr, `${selected.name.replace(/\s+/g, '_')}.step`);
      ping(tr ? `${selected.name} B-Rep STEP (ISO 10303-21) olarak indirildi` : `${selected.name} exported as B-Rep STEP`);
      return;
    }

    const stlStr = exportPartsToSTL([selected], selected.name);
    downloadFile(stlStr, `${selected.name.replace(/\s+/g, '_')}.stl`, 'application/sla');
    ping(tr ? `${selected.name} STL olarak indirildi` : `${selected.name} exported as STL`);
  };

  return (
    <div className={`flex w-full flex-col overflow-hidden bg-[#05080c] text-slate-200 ${embedded ? 'h-full min-h-0' : 'h-[100dvh]'}`}>
      {/* Hidden File Input for Real CAD Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".stl,.obj,.gltf,.glb,.step,.stp,.x_t,.x_b,.iges,.igs"
        multiple
        className="hidden"
        onChange={handleCADImport}
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

          {/* 12-Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded-md border border-white/10 bg-black/40 hover:bg-white/10 text-[10px] text-slate-300 font-bold transition-all"
              title="Change Language / Dili Değiştir"
            >
              <FlagIcon lang={language} className="h-3 w-4 rounded-sm object-cover" />
              <span className="uppercase text-[9px]">{language}</span>
              <ChevronDown size={10} className={`text-slate-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>

            {langOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 mt-1.5 z-50 bg-[#0c101a] border border-white/15 rounded-xl shadow-2xl p-1.5 grid grid-cols-2 sm:grid-cols-3 gap-1 min-w-[240px] animate-in fade-in zoom-in-95 font-mono">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.id);
                        setLangOpen(false);
                      }}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] transition-all ${
                        language === lang.id
                          ? 'bg-[#6b9fff]/20 text-[#6b9fff] font-bold border border-[#6b9fff]/30'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <FlagIcon lang={lang.id} className="h-2.5 w-3.5 rounded-sm object-cover shrink-0" />
                      <span className="truncate">{lang.native}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Engineering Tools Dropdown (Click to Open) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setToolsOpen(!toolsOpen)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[9px] font-black uppercase transition-all ${
                toolsOpen
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-sm'
                  : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
              }`}
              title={tr ? 'Mühendislik Araçları Menüsü' : 'Engineering Tools Menu'}
            >
              <Wrench size={11} />
              <span>{tr ? 'Araçlar' : 'Tools'}</span>
              <ChevronDown size={9} className={`transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`} />
            </button>

            {toolsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setToolsOpen(false)} />
                <div className="absolute top-full left-0 mt-1.5 w-56 bg-slate-900/98 backdrop-blur-md border border-white/15 rounded-xl shadow-2xl z-50 flex flex-col py-1.5 gap-0.5 animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => {
                      setToolsOpen(false);
                      setShowCenterOfGravity(!showCenterOfGravity);
                      ping(showCenterOfGravity ? (tr ? 'Ağırlık merkezi gizlendi' : 'CoG hidden') : (tr ? `🎯 Ağırlık Merkezi: ${massProps.massKg} kg` : `🎯 CoG Active: ${massProps.massKg} kg`));
                    }}
                    className={`flex items-center gap-2 mx-1.5 px-2.5 py-2 rounded-lg text-[10px] font-bold transition-all text-left ${
                      showCenterOfGravity
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>🎯</span>
                    <span>{tr ? 'Ağırlık Merkezi (CoG)' : 'Center of Gravity'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setToolsOpen(false);
                      setShowMaterialsModal(true);
                    }}
                    className="flex items-center gap-2 mx-1.5 px-2.5 py-2 rounded-lg text-[10px] font-bold text-amber-300 hover:bg-amber-500/15 transition-all text-left"
                  >
                    <Scale size={13} className="text-amber-400" />
                    <span>{tr ? `Malzeme & Kütle (${massProps.massKg} kg)` : `Material & Mass (${massProps.massKg} kg)`}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setToolsOpen(false);
                      setShowTechnicalDrawingModal(true);
                    }}
                    className="flex items-center gap-2 mx-1.5 px-2.5 py-2 rounded-lg text-[10px] font-bold text-cyan-300 hover:bg-cyan-500/15 transition-all text-left"
                  >
                    <FileText size={12} />
                    <span>{tr ? '2D Teknik Çizim Portföyü' : '2D Technical Drawing'}</span>
                  </button>
                </div>
              </>
            )}
          </div>


          <span className="mx-1 h-4 w-px bg-white/10" />

          {/* Export Selector & Actions */}
          <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className="rounded-md border border-white/10 bg-black/40 px-1.5 py-0.5 text-[10px] text-slate-300 font-mono">
            <option value="stl-binary">STL Binary (STABLE)</option>
            <option value="stl-ascii">STL ASCII</option>
            <option value="obj">OBJ</option>
            <option value="dxf">DXF 2D (STABLE 1:1)</option>
            <option value="step">STEP 3D B-Rep (STABLE ISO 10303)</option>
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
              className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] transition-all flex items-center justify-center gap-1.5 ${
                sidebarTab === 'library'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Boxes size={12} className="text-cyan-400" />
              <span>{tr ? 'Şekiller' : 'Shapes'}</span>
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('holes')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] transition-all relative flex items-center justify-center gap-1.5 ${
                sidebarTab === 'holes'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CircleDot size={12} className="text-amber-400" />
              <span>{tr ? 'Delik & Kesim' : 'Holes & Cuts'}</span>
              {holeIssues.some((i) => i.severity === 'CRITICAL') && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setSidebarTab('material')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] transition-all flex items-center justify-center gap-1.5 ${
                sidebarTab === 'material'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scale size={12} className="text-purple-400" />
              <span>{tr ? 'Malzeme' : 'Material'}</span>
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
                      setSidebarTab('holes');
                      setHolesSubTab('cut');
                      ping(tr ? '✂️ Yüzey Kesim & Havuz Modu Aktif' : '✂️ Surface Cut & Pocket Mode Active');
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1.5 font-bold text-slate-200 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all"
                  >
                    <Scissors size={12} className="text-rose-400" /> Cut
                  </button>


                </div>
              </div>

              {/* SHAPE LIBRARY */}
              <div className="p-3">
                <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-500">{tStudio.shapeLibrary}</p>
                <div className="space-y-3">
                  {LIBRARY.map((group) => (
                    <div key={group.id}>
                      <p className="mb-1 text-[8px] font-mono font-bold uppercase tracking-wider text-slate-500">
                        {tStudio[group.id as 'basic' | 'structural' | 'machine'] || group.en}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {group.kinds.map((kind) => {
                          const isSel = placeKind === kind;
                          const label = getDesignKindLabel(kind, language);
                          return (
                            <button
                              key={kind}
                              type="button"
                              onClick={() => handleAddKind(kind)}
                              title={label}
                              className={`truncate rounded-lg border px-2 py-1.5 text-left text-[10px] font-bold transition-all ${
                                isSel
                                  ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300 shadow-sm'
                                  : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20 hover:bg-white/5'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION VIEW SELECTOR & OFFSET CONTROLLER */}
              <div className="p-3 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500">
                    {tStudio.sectionView}
                  </p>
                  {sectionAxis !== 'NONE' && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSectionSolidCap(!sectionSolidCap);
                          ping(sectionSolidCap ? (tr ? 'İçi Boş Kesit' : 'Hollow Section') : (tr ? 'Katı Kesit Dolgusu Aktif' : 'Solid Section Cap Active'));
                        }}
                        className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border transition-all inline-flex items-center gap-1 ${
                          sectionSolidCap
                            ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-sm'
                            : 'border-white/10 bg-white/5 text-slate-400'
                        }`}
                        title={tr ? 'Kesit içi katı dolgu kapağı (Solid Section Cap)' : 'Solid Section Capping'}
                      >
                        <Layers size={10} />
                        <span>{sectionSolidCap ? (tr ? 'KATI KESİT' : 'SOLID') : (tr ? 'İÇİ BOŞ' : 'HOLLOW')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSectionInvert(!sectionInvert)}
                        className="text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 active:scale-95"
                      >
                        {sectionInvert ? '⇄ INVERT' : '⇄ NORMAL'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Axis Selector Buttons */}
                <div className="grid grid-cols-4 gap-1">
                  {(['NONE', 'X', 'Y', 'Z'] as SectionAxis[]).map((axis) => (
                    <button
                      key={axis}
                      type="button"
                      onClick={() => {
                        setSectionAxis(axis);
                        ping(tr ? `Kesit modu: ${axis}` : `Section view: ${axis}`);
                      }}
                      className={`py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all border ${
                        sectionAxis === axis
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-black shadow-md shadow-rose-500/10'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {axis === 'NONE' ? (tr ? 'KAPALI' : 'OFF') : `${axis} KESİT`}
                    </button>
                  ))}
                </div>

                {/* Section Plane Offset Position Slider & Precision Step Controls */}
                {sectionAxis !== 'NONE' && (
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-rose-500/20 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-[9px] font-mono">
                      <span className="text-slate-300 font-bold">📍 {tr ? 'Düzlem Konumu (Offset)' : 'Plane Position'}:</span>
                      <span className="text-rose-400 font-black text-[11px]">{sectionOffset} mm</span>
                    </div>

                    {/* Offset Slider */}
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono text-slate-500">-150</span>
                      <input
                        type="range"
                        min={-150}
                        max={150}
                        step={1}
                        value={sectionOffset}
                        onChange={(e) => setSectionOffset(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                      <span className="text-[8px] font-mono text-slate-500">+150</span>
                    </div>

                    {/* Quick Step Buttons */}
                    <div className="grid grid-cols-5 gap-1 font-mono text-[8px] font-bold">
                      <button
                        type="button"
                        onClick={() => setSectionOffset(Math.max(-150, sectionOffset - 10))}
                        className="py-1 rounded bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                      >
                        -10
                      </button>
                      <button
                        type="button"
                        onClick={() => setSectionOffset(Math.max(-150, sectionOffset - 1))}
                        className="py-1 rounded bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() => setSectionOffset(0)}
                        className="py-1 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-black"
                        title="Merkeze Sıfırla (0 mm)"
                      >
                        0 (Merkez)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSectionOffset(Math.min(150, sectionOffset + 1))}
                        className="py-1 rounded bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => setSectionOffset(Math.min(150, sectionOffset + 10))}
                        className="py-1 rounded bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: UNIFIED HOLES & SURFACE CUTS STUDIO */}
          {sidebarTab === 'holes' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-0.5 flex items-center gap-1.5">
                  <span>🕳️</span>
                  <span>{tr ? 'DELİK & KESİM STÜDYOSU' : 'HOLES & CUTS STUDIO'}</span>
                </p>
                <p className="text-[9px] text-slate-400 leading-tight">
                  {tr
                    ? 'Yüzey seçin, metrik delikler, PCD flanş dizileri veya freze cepleri açın.'
                    : 'Select surface, punch metric holes, bolt patterns, or mill pockets.'}
                </p>
              </div>

              {/* ACTIVE SOLID SELECTOR / STATUS */}
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-slate-400 uppercase font-bold">{tr ? 'Seçili Katı:' : 'Active Solid:'}</span>
                  {selected ? (
                    <span className="font-bold text-cyan-300 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: selected.color || '#38bdf8' }} />
                      {selected.name}
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold">{tr ? 'Katı Seçilmedi' : 'None Selected'}</span>
                  )}
                </div>
                {!selected && parts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => select(parts[0].id)}
                    className="w-full py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-[9px] hover:bg-cyan-500/30 transition-all"
                  >
                    👉 {tr ? `İlk Katıyı Seç (${parts[0].name})` : `Select First Solid (${parts[0].name})`}
                  </button>
                )}
              </div>

              {/* ─── 1. SURFACE / FACE SELECTION (YÜZEY SEÇİMİ) ─── */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                    <span>🎯</span>
                    <span>{tr ? 'YÜZEY SEÇİMİ (FACE)' : 'ACTIVE FACE'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFacePickMode(!facePickMode);
                      ping(facePickMode ? (tr ? 'Yüzey seçici kapatıldı' : 'Face picker off') : (tr ? '🖱️ 3D Sahnedeki yüzeye tıklayın' : '🖱️ Click any surface in 3D scene'));
                    }}
                    className={`px-2 py-0.5 rounded-md text-[8px] font-bold transition-all border ${
                      facePickMode
                        ? 'bg-amber-500 text-black border-amber-400 animate-pulse font-black'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {facePickMode ? (tr ? '🖱️ Tıklama Bekleniyor...' : '🖱️ Click Face in 3D...') : (tr ? '🖱️ 3D Yüzey Seç' : '🖱️ Pick in 3D')}
                  </button>
                </div>

                {/* 6 Standard Faces Grid */}
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'top' as SurfaceFace, labelTr: 'Üst (+Y)', labelEn: 'Top (+Y)', icon: '⬆️' },
                    { id: 'bottom' as SurfaceFace, labelTr: 'Alt (-Y)', labelEn: 'Bottom (-Y)', icon: '⬇️' },
                    { id: 'front' as SurfaceFace, labelTr: 'Ön (+Z)', labelEn: 'Front (+Z)', icon: '⏹️' },
                    { id: 'back' as SurfaceFace, labelTr: 'Arka (-Z)', labelEn: 'Back (-Z)', icon: '⏹️' },
                    { id: 'right' as SurfaceFace, labelTr: 'Sağ (+X)', labelEn: 'Right (+X)', icon: '➡️' },
                    { id: 'left' as SurfaceFace, labelTr: 'Sol (-X)', labelEn: 'Left (-X)', icon: '⬅️' },
                  ].map((face) => {
                    const isSel = activeFace === face.id;
                    return (
                      <button
                        key={face.id}
                        type="button"
                        onClick={() => {
                          setActiveFace(face.id);
                          ping(tr ? `Aktif Yüzey: ${face.labelTr}` : `Active Face: ${face.labelEn}`);
                        }}
                        className={`py-1.5 px-1 rounded-lg font-bold text-[9px] transition-all flex items-center justify-center gap-1 border ${
                          isSel
                            ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/30'
                            : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className="text-[10px]">{face.icon}</span>
                        <span>{tr ? face.labelTr : face.labelEn}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Face Dimension & Coordinate Range Info Box */}
                <div className="p-2 rounded-lg bg-black/60 border border-white/5 font-mono text-[8px] space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>{tr ? 'Yüzey Boyutu:' : 'Face Dimensions:'}</span>
                    <span className="text-white font-bold">{activeFaceBounds.label}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{tr ? 'X Aralığı (U):' : 'X Extents (U):'}</span>
                    <span className="text-cyan-300 font-bold">[{activeFaceBounds.minX}, +{activeFaceBounds.maxX}] mm</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{tr ? 'Y Aralığı (V):' : 'Y Extents (V):'}</span>
                    <span className="text-cyan-300 font-bold">[{activeFaceBounds.minY}, +{activeFaceBounds.maxY}] mm</span>
                  </div>
                </div>

                {/* Quick Alignment Presets */}
                <div className="space-y-1">
                  <span className="text-[8px] font-bold text-slate-400 uppercase">{tr ? 'Hızlı Konumlandır (Presets):' : 'Quick Presets:'}</span>
                  <div className="grid grid-cols-5 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setNewHoleX(0); setNewHoleY(0);
                        setCutX(0); setCutY(0);
                        ping(tr ? 'Merkez (0,0) seçildi' : 'Center (0,0) selected');
                      }}
                      className="py-1 rounded bg-white/5 border border-white/10 text-[8px] font-bold text-slate-300 hover:bg-white/10"
                      title="Merkez (0,0)"
                    >
                      (0,0)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const hx = Math.round(activeFaceBounds.minX * 0.6);
                        const hy = Math.round(activeFaceBounds.minY * 0.6);
                        setNewHoleX(hx); setNewHoleY(hy);
                        setCutX(hx); setCutY(hy);
                      }}
                      className="py-1 rounded bg-white/5 border border-white/10 text-[8px] font-bold text-slate-300 hover:bg-white/10"
                      title="Sol-Üst"
                    >
                      ↖ Sol-Ü
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const hx = Math.round(activeFaceBounds.maxX * 0.6);
                        const hy = Math.round(activeFaceBounds.minY * 0.6);
                        setNewHoleX(hx); setNewHoleY(hy);
                        setCutX(hx); setCutY(hy);
                      }}
                      className="py-1 rounded bg-white/5 border border-white/10 text-[8px] font-bold text-slate-300 hover:bg-white/10"
                      title="Sağ-Üst"
                    >
                      ↗ Sağ-Ü
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const hx = Math.round(activeFaceBounds.minX * 0.6);
                        const hy = Math.round(activeFaceBounds.maxY * 0.6);
                        setNewHoleX(hx); setNewHoleY(hy);
                        setCutX(hx); setCutY(hy);
                      }}
                      className="py-1 rounded bg-white/5 border border-white/10 text-[8px] font-bold text-slate-300 hover:bg-white/10"
                      title="Sol-Alt"
                    >
                      ↙ Sol-A
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const hx = Math.round(activeFaceBounds.maxX * 0.6);
                        const hy = Math.round(activeFaceBounds.maxY * 0.6);
                        setNewHoleX(hx); setNewHoleY(hy);
                        setCutX(hx); setCutY(hy);
                      }}
                      className="py-1 rounded bg-white/5 border border-white/10 text-[8px] font-bold text-slate-300 hover:bg-white/10"
                      title="Sağ-Alt"
                    >
                      ↘ Sağ-A
                    </button>
                  </div>
                </div>
              </div>

              {/* ─── 2. OPERATIONS SUB-TABS (3 MOD) ─── */}
              <div className="flex border border-white/10 rounded-xl p-1 gap-1 bg-black/60">
                <button
                  type="button"
                  onClick={() => setHolesSubTab('single')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-[9px] transition-all flex items-center justify-center gap-1 ${
                    holesSubTab === 'single'
                      ? 'bg-amber-500/25 border border-amber-500/50 text-amber-300 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🎯</span>
                  <span>{tr ? 'Tekil Delik' : 'Single Hole'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHolesSubTab('pattern')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-[9px] transition-all flex items-center justify-center gap-1 ${
                    holesSubTab === 'pattern'
                      ? 'bg-amber-500/25 border border-amber-500/50 text-amber-300 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>⭕</span>
                  <span>{tr ? 'PCD / Dizi' : 'Pattern'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHolesSubTab('cut')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-[9px] transition-all flex items-center justify-center gap-1 ${
                    holesSubTab === 'cut'
                      ? 'bg-rose-500/25 border border-rose-500/50 text-rose-300 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>✂️</span>
                  <span>{tr ? 'Yüzey Kes' : 'Cut / Pocket'}</span>
                </button>
              </div>

              {/* ─── 3A. SINGLE HOLE FORM ─── */}
              {holesSubTab === 'single' && (
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
                      <option value="counterbore">{tr ? '🕳️ İmbus Havşalı (DIN 912 Counterbore)' : 'Counterbore (DIN 912)'}</option>
                      <option value="tap">{tr ? '🧵 Dişli / Kılavuz (Metric Tap)' : 'Threaded / Tap'}</option>
                      <option value="clearance">{tr ? '🔩 Düz Geçme Deliği (Clearance Hole)' : 'Clearance Hole'}</option>
                      <option value="countersink">{tr ? '🔻 90° Düz Havşalı (DIN 7991)' : 'Countersink 90°'}</option>
                    </select>
                  </div>

                  {/* Hole Depth */}
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/60 border border-white/5">
                    <label className="flex items-center gap-1.5 text-[9px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isThroughHole}
                        onChange={(e) => setIsThroughHole(e.target.checked)}
                        className="rounded border-white/20 bg-slate-950 text-cyan-500"
                      />
                      <span>{tr ? 'Boydan Boya (Through-All)' : 'Through-All'}</span>
                    </label>
                    {!isThroughHole && (
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-slate-400">L:</span>
                        <input
                          type="number"
                          value={holeDepth}
                          onChange={(e) => setHoleDepth(Number(e.target.value))}
                          className="w-14 px-1.5 py-0.5 rounded bg-slate-950 border border-white/10 text-white font-mono text-[9px] text-center"
                        />
                        <span className="text-[8px] text-slate-400">mm</span>
                      </div>
                    )}
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
                      addHole({
                        id,
                        size: newHoleSize,
                        x: newHoleX,
                        y: newHoleY,
                        face: activeFace,
                        type: newHoleType,
                        isThroughAll: isThroughHole,
                        depth: holeDepth,
                      });
                      ping(tr ? `${newHoleSize} deliği ${activeFace.toUpperCase()} yüzeyine eklendi` : `${newHoleSize} hole added to ${activeFace} face`);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[10px] hover:bg-amber-500/30 transition-all shadow-sm"
                  >
                    ➕ {tr ? 'Deliği Katıya Ekle' : 'Add Hole to Solid'}
                  </button>
                </div>
              )}

              {/* ─── 3B. PCD & MATRIX PATTERN FORM ─── */}
              {holesSubTab === 'pattern' && (
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-2 font-mono text-[10px]">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setPatternType('pcd')}
                      className={`flex-1 py-1 rounded-lg font-bold text-[9px] border ${
                        patternType === 'pcd'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                      }`}
                    >
                      ⭕ PCD Flanş Çemberi
                    </button>
                    <button
                      type="button"
                      onClick={() => setPatternType('grid')}
                      className={`flex-1 py-1 rounded-lg font-bold text-[9px] border ${
                        patternType === 'grid'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                      }`}
                    >
                      ⊞ Dikdörtgen Matris
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[8px] text-slate-400 uppercase">{tr ? 'Metrik Çap' : 'Size'}:</span>
                      <select
                        value={newHoleSize}
                        onChange={(e) => setNewHoleSize(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-1 text-cyan-300 font-bold"
                      >
                        {ISO_METRIC_HOLES.map((h) => (
                          <option key={h.size} value={h.size}>{h.size}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 uppercase">{tr ? 'Delik Tipi' : 'Type'}:</span>
                      <select
                        value={newHoleType}
                        onChange={(e) => setNewHoleType(e.target.value as any)}
                        className="w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-1 text-slate-200"
                      >
                        <option value="clearance">Düz Geçme</option>
                        <option value="tap">Dişli / Kılavuz</option>
                        <option value="counterbore">İmbus Havşalı</option>
                        <option value="countersink">90° Havşa</option>
                      </select>
                    </div>
                  </div>

                  {patternType === 'pcd' ? (
                    <div className="space-y-2 pt-1 border-t border-white/5">
                      <div className="grid grid-cols-3 gap-1.5">
                        <label>
                          <span className="text-[8px] text-slate-400 block">PCD Çap (mm)</span>
                          <input
                            type="number"
                            value={pcdDiameter}
                            onChange={(e) => setPcdDiameter(Number(e.target.value))}
                            className="w-full p-1 rounded bg-black/60 border border-white/10 text-white text-center"
                          />
                        </label>
                        <label>
                          <span className="text-[8px] text-slate-400 block">Delik Sayısı</span>
                          <input
                            type="number"
                            value={pcdCount}
                            onChange={(e) => setPcdCount(Number(e.target.value))}
                            className="w-full p-1 rounded bg-black/60 border border-white/10 text-white text-center"
                          />
                        </label>
                        <label>
                          <span className="text-[8px] text-slate-400 block">Açı (°)</span>
                          <input
                            type="number"
                            value={pcdStartAngle}
                            onChange={(e) => setPcdStartAngle(Number(e.target.value))}
                            className="w-full p-1 rounded bg-black/60 border border-white/10 text-white text-center"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1 border-t border-white/5">
                      <div className="grid grid-cols-2 gap-2">
                        <label>
                          <span className="text-[8px] text-slate-400 block">Sütun Sayısı (Nx)</span>
                          <input
                            type="number"
                            value={gridCols}
                            onChange={(e) => setGridCols(Number(e.target.value))}
                            className="w-full p-1 rounded bg-black/60 border border-white/10 text-white text-center"
                          />
                        </label>
                        <label>
                          <span className="text-[8px] text-slate-400 block">Satır Sayısı (Ny)</span>
                          <input
                            type="number"
                            value={gridRows}
                            onChange={(e) => setGridRows(Number(e.target.value))}
                            className="w-full p-1 rounded bg-black/60 border border-white/10 text-white text-center"
                          />
                        </label>
                        <label>
                          <span className="text-[8px] text-slate-400 block">Adım dX (mm)</span>
                          <input
                            type="number"
                            value={gridDx}
                            onChange={(e) => setGridDx(Number(e.target.value))}
                            className="w-full p-1 rounded bg-black/60 border border-white/10 text-white text-center"
                          />
                        </label>
                        <label>
                          <span className="text-[8px] text-slate-400 block">Adım dY (mm)</span>
                          <input
                            type="number"
                            value={gridDy}
                            onChange={(e) => setGridDy(Number(e.target.value))}
                            className="w-full p-1 rounded bg-black/60 border border-white/10 text-white text-center"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (patternType === 'pcd') {
                        const R = pcdDiameter / 2;
                        const N = Math.max(1, pcdCount);
                        for (let i = 0; i < N; i++) {
                          const theta = ((pcdStartAngle + (360 / N) * i) * Math.PI) / 180;
                          const hx = Math.round(R * Math.cos(theta) * 10) / 10;
                          const hy = Math.round(R * Math.sin(theta) * 10) / 10;
                          addHole({
                            id: `pcd-${Date.now().toString(36)}-${i}`,
                            size: newHoleSize,
                            x: hx,
                            y: hy,
                            face: activeFace,
                            type: newHoleType,
                            isThroughAll: true,
                          });
                        }
                        ping(tr ? `${N} adet PCD deliği eklendi` : `${N} PCD holes added`);
                      } else {
                        const nx = Math.max(1, gridCols);
                        const ny = Math.max(1, gridRows);
                        const halfW = ((nx - 1) * gridDx) / 2;
                        const halfH = ((ny - 1) * gridDy) / 2;
                        for (let r = 0; r < ny; r++) {
                          for (let c = 0; c < nx; c++) {
                            const hx = Math.round((-halfW + c * gridDx) * 10) / 10;
                            const hy = Math.round((-halfH + r * gridDy) * 10) / 10;
                            addHole({
                              id: `grid-${Date.now().toString(36)}-${r}-${c}`,
                              size: newHoleSize,
                              x: hx,
                              y: hy,
                              face: activeFace,
                              type: newHoleType,
                              isThroughAll: true,
                            });
                          }
                        }
                        ping(tr ? `${nx * ny} adet matris deliği eklendi` : `${nx * ny} grid holes added`);
                      }
                    }}
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-[10px] hover:brightness-110 shadow-sm"
                  >
                    ⚡ {tr ? 'Dizi Deliklerini Oluştur & Ekle' : 'Generate & Add Pattern'}
                  </button>
                </div>
              )}

              {/* ─── 3C. SURFACE POCKET & CNC CUT FORM ─── */}
              {holesSubTab === 'cut' && (
                <div className="p-2.5 rounded-xl bg-black/40 border border-rose-500/30 space-y-2 font-mono text-[10px]">
                  <span className="text-[8px] text-rose-400 font-bold uppercase block">{tr ? 'KESİM GEOMETRİSİ' : 'CUT GEOMETRY'}:</span>
                  <div className="flex gap-1">
                    {[
                      { id: 'rect' as const, label: '🔲 Havuz (Rect)' },
                      { id: 'circle' as const, label: '⚪ Boşaltma' },
                      { id: 'slot' as const, label: '💊 Kanal / Slot' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCutType(item.id)}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-[9px] border ${
                          cutType === item.id
                            ? 'bg-rose-500/25 text-rose-200 border-rose-400'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Cut Dimensions */}
                  {cutType === 'rect' && (
                    <div className="grid grid-cols-2 gap-2">
                      <label>
                        <span className="text-[8px] text-slate-400 block">Genişlik W (mm)</span>
                        <input
                          type="number"
                          value={cutWidth}
                          onChange={(e) => setCutWidth(Number(e.target.value))}
                          className="w-full p-1.5 rounded bg-black/60 border border-white/10 text-white text-center font-bold"
                        />
                      </label>
                      <label>
                        <span className="text-[8px] text-slate-400 block">Boy L (mm)</span>
                        <input
                          type="number"
                          value={cutLength}
                          onChange={(e) => setCutLength(Number(e.target.value))}
                          className="w-full p-1.5 rounded bg-black/60 border border-white/10 text-white text-center font-bold"
                        />
                      </label>
                    </div>
                  )}

                  {cutType === 'circle' && (
                    <label className="block">
                      <span className="text-[8px] text-slate-400 block">Boşaltma Çapı Ø (mm)</span>
                      <input
                        type="number"
                        value={cutDiameter}
                        onChange={(e) => setCutDiameter(Number(e.target.value))}
                        className="w-full p-1.5 rounded bg-black/60 border border-white/10 text-white text-center font-bold"
                      />
                    </label>
                  )}

                  {cutType === 'slot' && (
                    <div className="grid grid-cols-2 gap-2">
                      <label>
                        <span className="text-[8px] text-slate-400 block">Slot Boyu L (mm)</span>
                        <input
                          type="number"
                          value={cutLength}
                          onChange={(e) => setCutLength(Number(e.target.value))}
                          className="w-full p-1.5 rounded bg-black/60 border border-white/10 text-white text-center font-bold"
                        />
                      </label>
                      <label>
                        <span className="text-[8px] text-slate-400 block">Slot Genişliği W (mm)</span>
                        <input
                          type="number"
                          value={cutWidth}
                          onChange={(e) => setCutWidth(Number(e.target.value))}
                          className="w-full p-1.5 rounded bg-black/60 border border-white/10 text-white text-center font-bold"
                        />
                      </label>
                    </div>
                  )}

                  {/* Cut Depth & Through Checkbox */}
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/60 border border-white/5">
                    <label className="flex items-center gap-1.5 text-[9px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cutIsThrough}
                        onChange={(e) => setCutIsThrough(e.target.checked)}
                        className="rounded border-white/20 bg-slate-950 text-rose-500"
                      />
                      <span>{tr ? 'Boydan Boya Kes (Through)' : 'Through Cut'}</span>
                    </label>
                    {!cutIsThrough && (
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-slate-400">Derinlik:</span>
                        <input
                          type="number"
                          value={cutDepth}
                          onChange={(e) => setCutDepth(Number(e.target.value))}
                          className="w-14 px-1.5 py-0.5 rounded bg-slate-950 border border-white/10 text-white font-mono text-[9px] text-center font-bold"
                        />
                        <span className="text-[8px] text-slate-400">mm</span>
                      </div>
                    )}
                  </div>

                  {/* Position & Angle */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <label>
                      <span className="text-[8px] text-slate-400 block">X (mm)</span>
                      <input
                        type="number"
                        value={cutX}
                        onChange={(e) => setCutX(Number(e.target.value))}
                        className="w-full p-1 rounded bg-black/60 border border-white/10 text-white text-center"
                      />
                    </label>
                    <label>
                      <span className="text-[8px] text-slate-400 block">Y (mm)</span>
                      <input
                        type="number"
                        value={cutY}
                        onChange={(e) => setCutY(Number(e.target.value))}
                        className="w-full p-1 rounded bg-black/60 border border-white/10 text-white text-center"
                      />
                    </label>
                    <label>
                      <span className="text-[8px] text-slate-400 block">Açı (°)</span>
                      <input
                        type="number"
                        value={cutAngle}
                        onChange={(e) => setCutAngle(Number(e.target.value))}
                        className="w-full p-1 rounded bg-black/60 border border-white/10 text-white text-center"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const id = `cut-${Date.now().toString(36)}`;
                      addCut({
                        id,
                        type: cutType,
                        face: activeFace,
                        x: cutX,
                        y: cutY,
                        width: cutWidth,
                        length: cutLength,
                        diameter: cutDiameter,
                        depth: cutDepth,
                        isThroughAll: cutIsThrough,
                        angle: cutAngle,
                      });
                      ping(tr ? `✂️ Kesim ${activeFace.toUpperCase()} yüzeyine uygulandı` : `✂️ Cut applied to ${activeFace} face`);
                    }}
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black text-[10px] hover:brightness-110 shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Scissors size={12} />
                    <span>{tr ? 'Kesimi / Cebi Katıya Uygula' : 'Apply Cut to Solid'}</span>
                  </button>
                </div>
              )}

              {/* ─── 4. LIVE INTERFERENCE WARNINGS ─── */}
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

              {/* ─── 5. APPLIED HOLES & CUTS LIST ─── */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-[8px] font-mono font-bold uppercase text-slate-400">
                  <span>{tr ? 'UYGULANAN DELİKLER' : 'APPLIED HOLES'} ({holes.length})</span>
                  {holes.length > 0 && (
                    <button type="button" onClick={clearHoles} className="text-rose-400 hover:underline">
                      {tr ? 'Tümünü Sil' : 'Clear All'}
                    </button>
                  )}
                </div>
                {holes.length === 0 ? (
                  <p className="text-[9px] text-slate-600 font-mono text-center py-1">{tr ? 'Henüz delik eklenmedi' : 'No holes added'}</p>
                ) : (
                  <div className="space-y-1">
                    {holes.map((h) => (
                      <div key={h.id} className="flex items-center justify-between px-2 py-1 rounded-lg bg-black/40 border border-white/5 font-mono text-[9px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-amber-300">{h.size}</span>
                          <span className="text-[8px] text-cyan-400 font-bold uppercase">[{h.face || 'top'}]</span>
                          <span className="text-slate-400 text-[8px]">({h.x}, {h.y})mm</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 text-[8px]">{h.type}</span>
                          <button type="button" onClick={() => removeHole(h.id)} className="text-rose-400 hover:text-rose-200 font-bold">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-[8px] font-mono font-bold uppercase text-slate-400 pt-2 border-t border-white/5">
                  <span>{tr ? 'UYGULANAN KESİMLER' : 'APPLIED CUTS'} ({cuts.length})</span>
                  {cuts.length > 0 && (
                    <button type="button" onClick={clearCuts} className="text-rose-400 hover:underline">
                      {tr ? 'Tümünü Sil' : 'Clear All'}
                    </button>
                  )}
                </div>
                {cuts.length === 0 ? (
                  <p className="text-[9px] text-slate-600 font-mono text-center py-1">{tr ? 'Henüz kesim eklenmedi' : 'No cuts added'}</p>
                ) : (
                  <div className="space-y-1">
                    {cuts.map((c) => (
                      <div key={c.id} className="flex items-center justify-between px-2 py-1 rounded-lg bg-black/40 border border-white/5 font-mono text-[9px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-rose-300">{c.type === 'rect' ? 'Havuz' : c.type === 'circle' ? 'Dairesel' : 'Slot'}</span>
                          <span className="text-[8px] text-cyan-400 font-bold uppercase">[{c.face || 'top'}]</span>
                          <span className="text-slate-400 text-[8px]">({c.x}, {c.y})mm</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 text-[8px]">{c.isThroughAll ? 'Through' : `${c.depth}mm`}</span>
                          <button type="button" onClick={() => removeCut(c.id)} className="text-rose-400 hover:text-rose-200 font-bold">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
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
                  <span className="inline-flex items-center gap-1.5"><Scale size={12} className="text-purple-400" /> <span>{tr ? 'TOPLAM MONTAJ KÜTLESİ' : 'TOTAL MASS'}</span></span>
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
                {tStudio.assemblyTree}
              </span>
              <div className="flex items-center gap-1.5 text-[8px] font-mono font-bold">
                <button
                  type="button"
                  onClick={showAllParts}
                  className="text-cyan-400 hover:text-cyan-200"
                  title={tStudio.showAll}
                >
                  👁️ {tStudio.showAll}
                </button>
                <button
                  type="button"
                  onClick={hideAllParts}
                  className="text-slate-400 hover:text-white"
                  title={tStudio.hideAll}
                >
                  🙈 {tStudio.hide}
                </button>
                <button
                  type="button"
                  onClick={() => { if (confirm(tStudio.clearConfirm)) clearScene(); }}
                  className="text-rose-400/80 hover:text-rose-300 ml-1"
                >
                  {tStudio.clear}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5 custom-scrollbar">
              {parts.length === 0 ? (
                <p className="py-6 text-center text-[10px] font-mono text-slate-600">{tStudio.noParts}</p>
              ) : (
                parts.map((p) => {
                  const isParasolid = p.name.includes('(Parasolid)');
                  const isStep = p.name.includes('(STEP)');
                  const isStl = p.name.includes('(STL)');
                  const cleanName = p.name.replace(/\s*\((Parasolid|STEP|STL|OBJ|GLTF)\)/i, '');
                  const tag = isParasolid ? 'Parasolid' : isStep ? 'STEP' : isStl ? 'STL' : null;

                  return (
                    <div
                      key={p.id}
                      className={`mb-1.5 flex items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 transition-all ${
                        isolatedPartId === p.id
                          ? 'border-amber-500/60 bg-amber-500/15 text-amber-200 shadow-md ring-1 ring-amber-500/30'
                          : selectedId === p.id
                          ? 'border-cyan-500/50 bg-cyan-950/40 text-cyan-200 shadow-md ring-1 ring-cyan-500/20'
                          : 'border-slate-800/80 bg-slate-900/50 hover:bg-slate-800/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 flex items-center gap-2 truncate text-left text-xs font-semibold"
                        onClick={() => select(p.id)}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: p.color || '#00e5ff' }}
                        />
                        <span className="truncate text-slate-100">{cleanName}</span>
                        {tag && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shrink-0 uppercase">
                            {tag}
                          </span>
                        )}
                      </button>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Isolate Button */}
                        <button
                          type="button"
                          onClick={() => setIsolatedPartId(isolatedPartId === p.id ? null : p.id)}
                          className={`p-1 rounded-md transition-all ${
                            isolatedPartId === p.id
                              ? 'text-amber-300 font-bold bg-amber-400/25 border border-amber-400/40'
                              : 'text-slate-400 hover:text-amber-300 hover:bg-white/10'
                          }`}
                          title={isolatedPartId === p.id ? (tr ? 'İzolasyonu Kaldır' : 'Unisolate') : (tr ? 'Parçayı İzole Et' : 'Isolate Part')}
                        >
                          <span className="text-xs leading-none">🎯</span>
                        </button>
                        {/* Show/Hide */}
                        <button
                          type="button"
                          onClick={() => toggleVisible(p.id)}
                          className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                          title={p.visible ? (tr ? 'Gizle' : 'Hide') : (tr ? 'Göster' : 'Show')}
                        >
                          {p.visible ? <Eye size={13} /> : <EyeOff size={13} className="text-slate-500" />}
                        </button>
                        {/* Lock/Unlock */}
                        <button
                          type="button"
                          onClick={() => toggleLocked(p.id)}
                          className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                          title={p.locked ? (tr ? 'Kilidi Aç' : 'Unlock') : (tr ? 'Kilitle' : 'Lock')}
                        >
                          {p.locked ? <Lock size={13} className="text-amber-400" /> : <Unlock size={13} />}
                        </button>
                      </div>
                    </div>
                  );
                })
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
                ✏️ {tStudio.design}
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
                🔍 {tStudio.inspect}
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
                🗿 {tStudio.sculpt}
              </button>

              <div className="h-4 w-px bg-white/10 mx-0.5" />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 transition-all"
                title={tStudio.importCad}
              >
                <Upload size={11} />
                <span>{tStudio.importCad}</span>
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
                      <span>{tStudio.inspectBannerTitle}</span>
                      {isolatedPartId && (
                        <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/40 font-bold">
                          🎯 {tStudio.isolateActive}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {tStudio.inspectBannerDesc}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  {/* Measure Tool Button & Mode Switcher */}
                  <div className="flex items-center p-0.5 rounded-xl bg-black/60 border border-white/10 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setTool(tool === 'measure' ? 'select' : 'measure');
                        ping(tool === 'measure' ? (tr ? 'Seçim moduna dönüldü' : 'Select mode') : (tr ? '📏 3D Kumpas devrede' : '📏 3D Caliper active'));
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                        tool === 'measure'
                          ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Ruler size={13} />
                      <span>{tr ? '3D Kumpas' : '3D Caliper'}</span>
                    </button>

                    {tool === 'measure' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setMeasureMode('auto');
                            ping(tr ? '🪄 Otomatik Kumpas: Yüzeyler arası veya silindirik çapı otomatik algılar' : '🪄 Auto Caliper: Auto-detects surface gap & diameter');
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            measureMode === 'auto'
                              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title="Otomatik Akıllı Algılama"
                        >
                          🪄 {tr ? 'Otomatik' : 'Auto'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMeasureMode('distance');
                            ping(tr ? '📐 Yüzey & Mesafe Modu: İki yüzeye/noktaya tıklayın' : '📐 Surface Mode: Click two surfaces');
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            measureMode === 'distance'
                              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title="Yüzeyler Arası Dik Mesafe"
                        >
                          📐 {tr ? 'Yüzey / Dik' : 'Surface'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMeasureMode('diameter');
                            ping(tr ? '⌀ Çap & Radyus Modu: Ölçmek istediğiniz silindire, mile veya deliğe tıklayın' : '⌀ Diameter Mode: Click cylinder, shaft, or hole');
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            measureMode === 'diameter'
                              ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title="Silindirik Çap ve Yarıçap Ölçümü"
                        >
                          ⌀ {tr ? 'Çap (⌀)' : 'Diameter'}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Exploded View Range Slider + Direction */}
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
                    <select
                      value={explodeDirection}
                      onChange={(e) => setExplodeDirection(e.target.value as any)}
                      className="bg-slate-800 border border-white/10 text-[9px] text-slate-300 font-bold rounded-lg px-1.5 py-0.5 cursor-pointer outline-none focus:border-amber-500/50"
                      title={tr ? 'Patlatma Yönü' : 'Explode Direction'}
                    >
                      <option value="radial">{tr ? '↗ Radyal' : '↗ Radial'}</option>
                      <option value="axial-y">{tr ? '↕ Dikey (Y)' : '↕ Axial Y'}</option>
                      <option value="axial-x">{tr ? '↔ Yatay (X)' : '↔ Axial X'}</option>
                      <option value="axial-z">{tr ? '↕ Derinlik (Z)' : '↕ Axial Z'}</option>
                      <option value="linear-sequence">{tr ? '⇣ Sıralı' : '⇣ Sequence'}</option>
                    </select>
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
                      onClick={() => {
                        clearMeasurements();
                        ping(tr ? 'Tüm 3D kumpas ölçüleri temizlendi' : 'All measurements cleared');
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 transition-all"
                      title={tr ? 'Tüm Ölçüleri Temizle' : 'Clear All Measurements'}
                    >
                      <Trash2 size={11} />
                      <span>{tr ? `Temizle (${measurements.length})` : `Clear (${measurements.length})`}</span>
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
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">{tStudio.emptyScene}</h3>
                  <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                    {tStudio.emptySceneDesc}
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
                  <Trash2 size={12} /> {tStudio.delete}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2.5 p-6 text-center">
              <div className="h-10 w-10 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-500">
                <MousePointer2 size={18} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">{tStudio.selectPart}</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {tStudio.selectPartDesc}
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* ─── 2D TECHNICAL DRAWING SHEET MODAL WITH CUSTOM TEMPLATES & BATCH PDF ─── */}
      {showTechnicalDrawingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 animate-in fade-in">
          <div className="w-full max-w-7xl h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl overflow-hidden">
            {/* Modal Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-white/10 bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 font-mono font-black border border-cyan-500/30">
                  📄
                </div>
                <div>
                  <h3 className="text-sm font-black text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    <span>{tr ? '2D TEKNİK RESİM PORTFÖYÜ' : '2D TECHNICAL DRAWING PORTFOLIO'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                      {templateStyle.toUpperCase()}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {drawingTargetId === 'all' ? `🏢 ${tr ? 'Tüm Montaj' : 'Full Assembly'} (${parts.length} ${tr ? 'Parça' : 'Parts'})` : `🧩 ${activeDrawingParts[0]?.name || projectName}`} · {activeMaterial.name} · {massProps.massKg} kg
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Part / Assembly Selector */}
                <select
                  value={drawingTargetId}
                  onChange={(e) => setDrawingTargetId(e.target.value)}
                  className="bg-white/10 text-white font-mono text-xs rounded-xl px-2.5 py-1.5 border border-white/20 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white">
                    🏢 {tr ? `Tüm Montaj (${parts.length} Parça - Montaj Resmi)` : `Full Assembly (${parts.length} Parts)`}
                  </option>
                  {parts.map((p, idx) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      🧩 {p.name || `Parça ${idx + 1}`}
                    </option>
                  ))}
                </select>

                {/* Template Style Selector */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5">
                  {(['iso7200', 'modern', 'din', 'blueprint', 'minimal'] as DrawingTemplateStyle[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTemplateStyle(st)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        templateStyle === st
                          ? 'bg-cyan-500 text-black shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {st === 'iso7200' ? 'ISO' : st}
                    </button>
                  ))}
                </div>

                {/* Color Theme Selector */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5">
                  {(['classic', 'blueprint', 'dark'] as DrawingColorTheme[]).map((th) => (
                    <button
                      key={th}
                      type="button"
                      onClick={() => setColorTheme(th)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        colorTheme === th
                          ? 'bg-purple-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {th === 'classic' ? 'Beyaz' : th === 'blueprint' ? 'Plan' : 'Koyu'}
                    </button>
                  ))}
                </div>

                {/* Custom Template Settings Toggle */}
                <button
                  type="button"
                  onClick={() => setShowTemplateConfig(!showTemplateConfig)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    showTemplateConfig
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                  title={tr ? 'Kullanıcı Şablonunu & Antet Alanlarını Düzenle' : 'Customize Title Block & Template'}
                >
                  <Sliders size={12} />
                  <span>{tr ? 'Şablon' : 'Template'}</span>
                </button>

                {/* Download Single SVG */}
                <button
                  type="button"
                  onClick={() => {
                    const svgData = generateTechnicalDrawingSVG(
                      activeDrawingParts,
                      massProps,
                      {
                        projectName,
                        materialName: activeMaterial.nameTr,
                        companyName,
                        companySubtext,
                        author: drawingAuthor,
                        approver: drawingApprover,
                        revision: drawingRevision,
                        tolerance: drawingTolerance,
                        surfaceFinish: drawingSurfaceFinish,
                        sheetSize: drawingSheetSize,
                        projection: drawingProjection,
                        notes: drawingNotes.split('\n').filter(Boolean),
                        templateStyle,
                        colorTheme,
                      }
                    );
                    const fileName = drawingTargetId === 'all'
                      ? `${projectName}_Assembly_Drawing.svg`
                      : `${activeDrawingParts[0]?.name || 'Part'}_Detail_Drawing.svg`;
                    downloadFile(svgData, fileName, 'image/svg+xml');
                    ping(tr ? 'SVG Teknik Resim indirildi' : 'SVG Drawing Downloaded');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs hover:bg-cyan-500/30 transition-all"
                >
                  <Download size={13} />
                  <span>{tr ? 'SVG' : 'SVG'}</span>
                </button>

                {/* Batch Download All SVGs */}
                {parts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      // 1. Download assembly
                      const assSvg = generateTechnicalDrawingSVG(parts, massProps, {
                        projectName,
                        materialName: activeMaterial.nameTr,
                        companyName,
                        author: drawingAuthor,
                        templateStyle,
                        colorTheme,
                        partName: `Montaj: ${parts.length} Parça`,
                      });
                      downloadFile(assSvg, `${projectName}_Assembly_Drawing.svg`, 'image/svg+xml');

                      // 2. Download parts
                      parts.forEach((p, idx) => {
                        setTimeout(() => {
                          const pMass = calculateAssemblyMassProperties([p], selectedMaterialId);
                          const pSvg = generateTechnicalDrawingSVG([p], pMass, {
                            projectName,
                            materialName: activeMaterial.nameTr,
                            companyName,
                            author: drawingAuthor,
                            templateStyle,
                            colorTheme,
                            partName: p.name || `Parça_${idx + 1}`,
                          });
                          downloadFile(pSvg, `${p.name || `Part_${idx + 1}`}_Drawing.svg`, 'image/svg+xml');
                        }, (idx + 1) * 250);
                      });
                      ping(tr ? `${parts.length + 1} adet SVG çizimi indiriliyor...` : `Downloading ${parts.length + 1} SVG drawings...`);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold text-xs hover:bg-purple-500/30 transition-all"
                    title={tr ? 'Tüm Parçaların Teknik Resimlerini Ayrı Ayrı İndir' : 'Batch Download All Part Drawings'}
                  >
                    <span>📦 {tr ? 'Toplu SVG' : 'Batch SVG'}</span>
                  </button>
                )}

                {/* Batch Print / Single PDF Export */}
                <button
                  type="button"
                  onClick={() => {
                    const sheets: Array<{ target: DesignPart | DesignPart[]; massProps: any; config: any }> = [];
                    // 1. Assembly Sheet
                    sheets.push({
                      target: parts,
                      massProps,
                      config: {
                        projectName,
                        partName: `Tüm Montaj (${parts.length} Parça)`,
                        materialName: activeMaterial.nameTr,
                        companyName,
                        companySubtext,
                        author: drawingAuthor,
                        approver: drawingApprover,
                        revision: drawingRevision,
                        tolerance: drawingTolerance,
                        surfaceFinish: drawingSurfaceFinish,
                        sheetSize: drawingSheetSize,
                        projection: drawingProjection,
                        notes: drawingNotes.split('\n').filter(Boolean),
                        templateStyle,
                        colorTheme,
                      },
                    });

                    // 2. Individual Part Sheets
                    for (const p of parts) {
                      const pMass = calculateAssemblyMassProperties([p], selectedMaterialId);
                      sheets.push({
                        target: [p],
                        massProps: pMass,
                        config: {
                          projectName,
                          partName: p.name || 'Parça Detayı',
                          materialName: activeMaterial.nameTr,
                          companyName,
                          companySubtext,
                          author: drawingAuthor,
                          approver: drawingApprover,
                          revision: drawingRevision,
                          tolerance: drawingTolerance,
                          surfaceFinish: drawingSurfaceFinish,
                          sheetSize: drawingSheetSize,
                          projection: drawingProjection,
                          notes: drawingNotes.split('\n').filter(Boolean),
                          templateStyle,
                          colorTheme,
                        },
                      });
                    }

                    const fullHtml = generateBatchDrawingsHTML(sheets, `${projectName} - Teknik Resim Portföyü`);
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black text-xs hover:brightness-110 shadow-sm transition-all"
                  title={tr ? 'Tüm Parçaları Tek Bir Çok Sayfalı PDF Olarak Kaydet / Yazdır' : 'Batch Print All Sheets as Multi-page PDF'}
                >
                  <span>🖨️ {tr ? 'Toplu PDF / Yazdır' : 'Batch PDF / Print'}</span>
                </button>

                {/* Close Modal */}
                <button
                  type="button"
                  onClick={() => setShowTechnicalDrawingModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-rose-500/20 ml-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body: Split between Template Config Panel & Canvas */}
            <div className="flex-1 flex min-h-0 bg-slate-950/60 overflow-hidden relative">
              {/* Expandable Custom Template Configuration Panel */}
              {showTemplateConfig && (
                <div className="w-80 border-r border-white/10 bg-slate-900/95 backdrop-blur p-4 overflow-y-auto space-y-4 shrink-0 font-mono text-xs animate-in slide-in-from-left">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      ⚙️ {tr ? 'Şablon & Antet Ayarları' : 'Template & Title Block'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTemplateConfig(false)}
                      className="text-slate-500 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Company Info */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">{tr ? 'Firma / Şirket Adı' : 'Company Name'}</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">{tr ? 'Alt Başlık / Departman' : 'Subtext / Department'}</label>
                    <input
                      type="text"
                      value={companySubtext}
                      onChange={(e) => setCompanySubtext(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Author & Approver */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">{tr ? 'Çizen (Drafter)' : 'Author'}</label>
                      <input
                        type="text"
                        value={drawingAuthor}
                        onChange={(e) => setDrawingAuthor(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">{tr ? 'Onaylayan' : 'Approver'}</label>
                      <input
                        type="text"
                        value={drawingApprover}
                        onChange={(e) => setDrawingApprover(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  {/* Revision & Tolerance */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">{tr ? 'Revizyon' : 'Revision'}</label>
                      <input
                        type="text"
                        value={drawingRevision}
                        onChange={(e) => setDrawingRevision(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">{tr ? 'Tolerans' : 'Tolerance'}</label>
                      <select
                        value={drawingTolerance}
                        onChange={(e) => setDrawingTolerance(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-cyan-400"
                      >
                        <option value="ISO 2768-m">ISO 2768-m (Orta)</option>
                        <option value="ISO 2768-f">ISO 2768-f (Hassas)</option>
                        <option value="ISO 2768-c">ISO 2768-c (Kaba)</option>
                        <option value="DIN 7168-m">DIN 7168-m</option>
                        <option value="±0.05 mm">±0.05 mm (CNC)</option>
                        <option value="±0.1 mm">±0.1 mm</option>
                      </select>
                    </div>
                  </div>

                  {/* Surface Finish & Sheet Size */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">{tr ? 'Yüzey (Ra)' : 'Surface Finish'}</label>
                      <select
                        value={drawingSurfaceFinish}
                        onChange={(e) => setDrawingSurfaceFinish(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-cyan-400"
                      >
                        <option value="Ra 0.8 μm">Ra 0.8 μm (Taşlama)</option>
                        <option value="Ra 1.6 μm">Ra 1.6 μm (CNC Hassas)</option>
                        <option value="Ra 3.2 μm">Ra 3.2 μm (Freze/Torna)</option>
                        <option value="Ra 6.3 μm">Ra 6.3 μm (Kaba)</option>
                        <option value="Eloksal">Eloksal Kaplama</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">{tr ? 'Sayfa Boyutu' : 'Sheet Size'}</label>
                      <select
                        value={drawingSheetSize}
                        onChange={(e) => setDrawingSheetSize(e.target.value as any)}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-cyan-400"
                      >
                        <option value="A4">A4 (840×594)</option>
                        <option value="A3">A3 (1188×840)</option>
                        <option value="A2">A2 (1680×1188)</option>
                      </select>
                    </div>
                  </div>

                  {/* Projection Angle */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">{tr ? 'Projeksiyon Açısı' : 'Projection Standard'}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDrawingProjection('first-angle')}
                        className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold ${
                          drawingProjection === 'first-angle'
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        1. Açı (Avrupa/ISO)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDrawingProjection('third-angle')}
                        className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold ${
                          drawingProjection === 'third-angle'
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        3. Açı (ABD/ANSI)
                      </button>
                    </div>
                  </div>

                  {/* Custom Manufacturing Notes */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">{tr ? 'Özel İmalat Notları' : 'Manufacturing Notes'}</label>
                    <textarea
                      rows={4}
                      value={drawingNotes}
                      onChange={(e) => setDrawingNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white text-[11px] outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Drawing Sheet Canvas Container */}
              <div className="flex-1 p-4 flex items-center justify-center overflow-auto">
                <div
                  className="w-full h-full max-h-[78vh] rounded-2xl shadow-2xl p-2 flex items-center justify-center overflow-hidden transition-all"
                  style={{
                    background: colorTheme === 'blueprint' ? '#091833' : colorTheme === 'dark' ? '#080c14' : '#ffffff',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: generateTechnicalDrawingSVG(
                      activeDrawingParts,
                      massProps,
                      {
                        projectName,
                        materialName: activeMaterial.nameTr,
                        companyName,
                        companySubtext,
                        author: drawingAuthor,
                        approver: drawingApprover,
                        revision: drawingRevision,
                        tolerance: drawingTolerance,
                        surfaceFinish: drawingSurfaceFinish,
                        sheetSize: drawingSheetSize,
                        projection: drawingProjection,
                        notes: drawingNotes.split('\n').filter(Boolean),
                        templateStyle,
                        colorTheme,
                      }
                    ),
                  }}
                />
              </div>
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
                  <Scale size={18} className="text-purple-400" />
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

      {/* ─── BOLT CIRCLE PCD & MULTI-HOLE PATTERN MODAL (IMAGE 2) ─── */}
      <BoltCirclePcdModal
        isOpen={showPcdModal}
        onClose={() => setShowPcdModal(false)}
        onApplyHoles={(newHoles) => {
          newHoles.forEach((h) => addHole(h));
          if (selected) {
            updatePart(selected.id, {
              holes: [...(selected.holes || []), ...newHoles],
            });
          }
          ping(tr ? `${newHoles.length} delik başarıyla uygulandı` : `${newHoles.length} holes applied to part`);
        }}
      />

      {/* ─── SURFACE POCKET & CNC CUT MODAL (IMAGE 1) ─── */}
      <SurfaceCutModal
        isOpen={showCutModal}
        onClose={() => setShowCutModal(false)}
        selectedPart={selected}
      />
    </div>
  );
}

export default DesignStudio;
