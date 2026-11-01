'use client';

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Box, Copy, Download, Eye, EyeOff, Grid3X3, Lock, Maximize2, MousePointer2,
  Move, Pencil, RotateCcw, RotateCw, Ruler, Scissors, Sun, Trash2, Unlock,
  Layers, ChevronDown, ChevronRight, ChevronLeft, PanelLeft, PanelRight, Maximize, Palette, Upload, Sparkles, Sliders, Eye as EyeIcon,
  Compass, Undo, Redo, Shield, Cuboid, Check, X, FileText, Wrench, Boxes, Scale, CircleDot, PenTool,
  Target, Crosshair, AlertTriangle, Layers2, Activity, Cpu, CheckCircle2, ArrowRight, Folder, Link2
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { LANGUAGE_OPTIONS } from '@/locales/siteNav';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { kindLabel, PART_COLORS, useDesignStore, DEFAULT_DEMO_PART, type DesignKind, type RenderMode, type StudioMode, type SectionAxis, type DesignPart } from './designStore';
import { exportPartsToSTL, downloadFile } from './exporter';
import { loadCADFile } from './cadImporter';
import { ENGINEERING_MATERIALS, calculateAssemblyMassProperties } from './materialsEngine';
import { generateTechnicalDrawingSVG, generateBatchDrawingsHTML, type DrawingTemplateStyle, type DrawingColorTheme } from './technicalDrawingGenerator';
import { generateAssemblyStep, generateStepBox, generateStepPlateWithHole, generateStepShaft, downloadStepFile } from '@/engines/cad/StepBRepExporter';
import { useLicenseStore } from '@/store/licenseStore';
import { checkHoleInterferences, ISO_METRIC_HOLES, type HoleItem, type SurfaceFace, type SurfaceCutItem } from './holeStandards';
import { BoltCirclePcdModal } from './BoltCirclePcdModal';
import { SurfaceCutModal } from './SurfaceCutModal';
import { getDesignStudioStrings, getDesignKindLabel } from '@/locales/designStudioTranslations';
import { CrossModuleBridge, consumeDesignImport } from '@/system/crossModuleBridge';
import { TSLOT_CATALOG } from '@/cad/catalog/tSlotProfiles';
import { buildAssemblyBom } from './bom';
import { executeAutoFastenerAssembly } from './assembly/fastenerDetect';
import { evaluateAssemblyDfm } from '@/engines/dfm/dfmEvaluator';
import { canExport } from '@/engines/dfm/exportGate';
import { triggerCameraView } from './cadCameraDispatcher';
import { AssemblyFeatureTree } from './AssemblyFeatureTree';
import { ShapeCatalogModal } from './ShapeCatalogModal';
import { AssemblyMateModal } from './AssemblyMateModal';
import { SmartFastenersModal } from './SmartFastenersModal';
import { extractPartFeatures, getValidMateKinds } from './assembly/featureExtractor';
import { SaveStatusIndicator } from '@/cad/components/SaveStatusIndicator';

const DesignViewport = dynamic(() => import('./DesignViewport').then((m) => m.DesignViewport || m.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[var(--bg-0)] text-[11px] font-mono text-white/35">
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
  const tStudio = getDesignStudioStrings(language);
  const [toast, setToast] = useState<string | null>(null);
  const [showInventorMap, setShowInventorMap] = useState(false);
  const [exportFormat, setExportFormat] = useState('stl-binary');
  const [langOpen, setLangOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__designStore = useDesignStore;
    }
    const n = consumeDesignImport();
    if (n > 0) {
      setToast(`Imported ${n} calculated solid${n === 1 ? '' : 's'} from calculator`);
      const t1 = setTimeout(() => triggerCameraView('fit'), 200);
      const t2 = setTimeout(() => triggerCameraView('fit'), 600);
      const t3 = setTimeout(() => triggerCameraView('fit'), 1200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, []);

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
  const mates = useDesignStore((s) => s.mates) || [];
  const removeMate = useDesignStore((s) => s.removeMate);
  const clearMates = useDesignStore((s) => s.clearMates);
  const applyMates = useDesignStore((s) => s.applyMates);

  // Autodesk Inventor In-Place Part & Sub-Assembly Editing Actions
  const setEditingPartId = useDesignStore((s) => s.setEditingPartId);
  const editingSubAssemblyId = useDesignStore((s) => s.editingSubAssemblyId);
  const setEditingSubAssemblyId = useDesignStore((s) => s.setEditingSubAssemblyId);

  const [sidebarTab, setSidebarTab] = useState<'library' | 'holes' | 'material' | 'assembly' | 'dfm'>('library');
  const [dfmOverrideAllowed, setDfmOverrideAllowed] = useState<boolean>(false);
  const [showPcdModal, setShowPcdModal] = useState<boolean>(false);
  const [showCutModal, setShowCutModal] = useState<boolean>(false);
  const [showDfmModal, setShowDfmModal] = useState<boolean>(false);
  const [drawingTargetId, setDrawingTargetId] = useState<'all' | string>('all');
  const [tSlotSeriesFilter, setTSlotSeriesFilter] = useState<number | 'ALL'>('ALL');

  // Shapes Catalog Modal State
  const [shapesMenuOpen, setShapesMenuOpen] = useState(false);

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
  const setPendingCut = useDesignStore((s) => s.setPendingCut);
  const [cutMethod, setCutMethod] = useState<'sketch' | 'parametric'>('sketch');

  // SolidWorks-style Sub-Assembly & Visual Feature Editing Bindings
  const subAssemblies = useDesignStore((s) => s.subAssemblies);
  const movePartToSubAssembly = useDesignStore((s) => s.movePartToSubAssembly);
  const startEditPartSketch = useDesignStore((s) => s.startEditPartSketch);
  const updateCut = useDesignStore((s) => s.updateCut);
  const updateHole = useDesignStore((s) => s.updateHole);
  const selectedFeature = useDesignStore((s) => s.selectedFeature);
  const setSelectedFeature = useDesignStore((s) => s.setSelectedFeature);
  const editingPartId = useDesignStore((s) => s.editingPartId);

  const editingPart = useMemo(() => {
    return editingPartId ? parts.find((p) => p.id === editingPartId) || null : null;
  }, [editingPartId, parts]);

  const editingSubAssy = useMemo(() => {
    if (!editingPart || !editingPart.subAssemblyId) return null;
    return subAssemblies.find((sa) => sa.id === editingPart.subAssemblyId) || null;
  }, [editingPart, subAssemblies]);

  const [treeMaximized, setTreeMaximized] = useState<boolean>(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('zen') === '1' || params.get('left') === '0') return false;
    }
    return true;
  });
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('zen') === '1' || params.get('right') === '0') return false;
    }
    return true;
  });
  const [showShortcutHud, setShowShortcutHud] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('sbar') === '1') return true;
    }
    return false;
  });
  const [hudPos, setHudPos] = useState<{ x: number; y: number }>({ x: 500, y: 220 });
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 500, y: 220 });

  useEffect(() => {
    const handleGlobalPointer = (e: MouseEvent) => {
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('pointermove', handleGlobalPointer, { passive: true });
    return () => window.removeEventListener('pointermove', handleGlobalPointer);
  }, []);

  const [expandedCutId, setExpandedCutId] = useState<string | null>(null);
  const [expandedHoleId, setExpandedHoleId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFeature?.type === 'cut' && selectedFeature.id) {
      setExpandedCutId(selectedFeature.id);
    }
    if (selectedFeature?.type === 'hole' && selectedFeature.id) {
      setExpandedHoleId(selectedFeature.id);
    }
  }, [selectedFeature]);

  // Real-time 3D Viewport Pending Cut Preview Synchronization
  useEffect(() => {
    if (sidebarTab === 'holes' && holesSubTab === 'cut' && cutMethod === 'parametric' && selected) {
      setPendingCut({
        id: 'live-pending-cut',
        type: cutType,
        face: activeFace || 'top',
        x: cutX,
        y: cutY,
        width: cutWidth,
        length: cutLength,
        diameter: cutDiameter,
        depth: cutDepth,
        isThroughAll: cutIsThrough,
        angle: cutAngle,
      });
    } else {
      setPendingCut(null);
    }
  }, [
    sidebarTab,
    holesSubTab,
    cutMethod,
    selected,
    cutType,
    activeFace,
    cutX,
    cutY,
    cutWidth,
    cutLength,
    cutDiameter,
    cutDepth,
    cutIsThrough,
    cutAngle,
    setPendingCut,
  ]);


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
  const [drawingShowBom, setDrawingShowBom] = useState(true);
  const [drawingShowBalloons, setDrawingShowBalloons] = useState(true);
  const [drawingShowExploded, setDrawingShowExploded] = useState(false);
  const [drawingShowSection, setDrawingShowSection] = useState(true);
  const [drawingShowWireframe, setDrawingShowWireframe] = useState(false);
  const [drawingExplodeFactor, setDrawingExplodeFactor] = useState(45);
  const [showTemplateConfig, setShowTemplateConfig] = useState(false);

  // Auto-switch to A2 sheet size for multi-part assemblies
  useEffect(() => {
    if (showTechnicalDrawingModal && drawingTargetId === 'all' && parts.length > 1) {
      setDrawingSheetSize('A2');
      setDrawingShowExploded(true);
    }
  }, [showTechnicalDrawingModal, drawingTargetId, parts.length]);

  // Hydrate custom CAD geometries from IndexedDB on startup
  useEffect(() => {
    useDesignStore.getState().hydrateCADGeometries?.();
  }, []);



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

  const drawingSvgPreview = useMemo(() => {
    if (!showTechnicalDrawingModal) return '';
    try {
      return generateTechnicalDrawingSVG(
        activeDrawingParts,
        massProps,
        {
          projectName,
          partName: drawingTargetId === 'all'
            ? (t12(language, `Full Assembly (${parts.length} Parts)`, `Tüm Montaj (${parts.length} Parça)`))
            : (activeDrawingParts[0]?.name || (t12(language, 'Part', 'Parça'))),
          materialName: t12(language, activeMaterial.name, activeMaterial.nameTr),
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
          lang: language,
          showBomTable: drawingShowBom,
          showBalloons: drawingShowBalloons,
          showExplodedView: drawingShowExploded,
          showSectionView: drawingShowSection,
          showMeshWireframe: drawingShowWireframe,
          explodeFactor: drawingExplodeFactor,
        }
      );
    } catch (err) {
      console.error('Error generating technical drawing preview:', err);
      return `<div style="color: #f87171; padding: 24px; font-family: monospace; font-size: 13px;">Teknik resim çizilirken bir hata oluştu: ${String(err)}</div>`;
    }
  }, [
    showTechnicalDrawingModal,
    activeDrawingParts,
    massProps,
    projectName,
    drawingTargetId,
    parts.length,
    activeMaterial,
    companyName,
    companySubtext,
    drawingAuthor,
    drawingApprover,
    drawingRevision,
    drawingTolerance,
    drawingSurfaceFinish,
    drawingSheetSize,
    drawingProjection,
    drawingNotes,
    templateStyle,
    colorTheme,
    language,
    drawingShowBom,
    drawingShowBalloons,
    drawingShowExploded,
    drawingShowSection,
    drawingShowWireframe,
    drawingExplodeFactor,
  ]);

  const bom = useMemo(() => buildAssemblyBom(parts, selectedMaterialId), [parts, selectedMaterialId]);
  const dfmReport = useMemo(() => evaluateAssemblyDfm(parts, mates, selectedMaterialId), [parts, mates, selectedMaterialId]);

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

  const selectedDimensions = useMemo(() => {
    if (!selected) return null;
    const p = selected.params || {};
    const sx = Math.abs(selected.scale?.x ?? 1);
    const sy = Math.abs(selected.scale?.y ?? 1);
    const sz = Math.abs(selected.scale?.z ?? 1);
    if (selected.kind === 'cylinder' || selected.kind === 'tube' || selected.kind === 'cone') {
      const radScale = (sx !== 1 && sz === 1) ? sx : (sz !== 1 && sx === 1) ? sz : Math.max(sx, sz);
      const dia = Math.round((p.diameter ?? 60) * radScale * 10) / 10;
      const len = Math.round((p.length ?? p.height ?? 100) * sy * 10) / 10;
      return `⌀${dia} × L${len} mm`;
    }
    const w = Math.round((p.width ?? 80) * sx * 10) / 10;
    const l = Math.round((p.length ?? p.depth ?? 40) * sz * 10) / 10;
    const h = Math.round((p.height ?? 20) * sy * 10) / 10;
    return `${w} × ${l} × ${h} mm`;
  }, [selected]);

  const addPart = useDesignStore((s) => s.addPart);
  const addTSlotPart = useDesignStore((s) => s.addTSlotPart);
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
  const bakeScaleToParams = useDesignStore((s) => s.bakeScaleToParams);
  const setSelectedColor = useDesignStore((s) => s.setSelectedColor);
  const setSelectedName = useDesignStore((s) => s.setSelectedName);
  const toggleVisible = useDesignStore((s) => s.toggleVisible);
  const toggleLocked = useDesignStore((s) => s.toggleLocked);
  const clearScene = useDesignStore((s) => s.clearScene);
  const setGridSnap = useDesignStore((s) => s.setGridSnap);
  const setShowGrid = useDesignStore((s) => s.setShowGrid);
  const showMeshWireframe = useDesignStore((s) => s.showMeshWireframe);
  const showCadEdges = useDesignStore((s) => s.showCadEdges);
  const toggleMeshWireframe = useDesignStore((s) => s.toggleMeshWireframe);
  const toggleCadEdges = useDesignStore((s) => s.toggleCadEdges);
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
  const openExtrudeDialog = useDesignStore((s) => s.openExtrudeDialog);
  const openMateModal = useDesignStore((s) => s.openMateModal);
  const closeMateModal = useDesignStore((s) => s.closeMateModal);
  const activeMateDraft = useDesignStore((s) => s.activeMateDraft);
  const updateMateDraft = useDesignStore((s) => s.updateMateDraft);
  const commitMateDraft = useDesignStore((s) => s.commitMateDraft);
  const openFastenersModal = useDesignStore((s) => s.openFastenersModal);

  const isSketchMode = tool === 'sketch-add' || tool === 'sketch-cut' || tool === 'sketch-loft';

  const ping = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Global 3D CAD Shortcuts: M (Measure / Caliper), V (Select), G (Move), R (Rotate), S (Scale), Esc (Cancel)
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

      const key = e.key.toLowerCase();
      if (key === 'm') {
        e.preventDefault();
        if (tool === 'mate') {
          closeMateModal();
          ping(t12(language, 'Exited Mate Mode', 'Montaj Modundan çıkıldı'));
        } else {
          openMateModal();
          ping(t12(language, '📎 Mate Mode Active: Click 3D surfaces/holes', '📎 Montajlama Modu Aktif: 3D yüzey/delikleri tıklayın'));
        }
      } else if (key === 'k') {
        e.preventDefault();
        setTool(tool === 'measure' ? 'select' : 'measure');
        ping(t12(language, '📏 Caliper / Measure Tool Active (K)', '📏 Kumpas / Ölçü Alma Aracı Aktif (K)'));
      } else if (key === 'v' || key === 'q') {
        e.preventDefault();
        setTool('select');
      } else if (key === 'w' || key === 'g') {
        e.preventDefault();
        setTool('move');
        ping(t12(language, '✥ Move Tool Active (W)', '✥ Taşıma Aracı Aktif (W)'));
      } else if (key === 'r') {
        e.preventDefault();
        setTool('rotate');
        ping(t12(language, '⟳ Rotate Tool Active (R)', '⟳ Döndürme Aracı Aktif (R)'));
      } else if (key === '[') {
        e.preventDefault();
        setLeftSidebarOpen((prev) => {
          const next = !prev;
          ping(next ? t12(language, 'Model Tree Opened [ [ ]', 'Model Ağacı Açıldı [ [ ]') : t12(language, 'Model Tree Collapsed [ [ ]', 'Model Ağacı Gizlendi [ [ ]'));
          return next;
        });
      } else if (key === ']') {
        e.preventDefault();
        setRightSidebarOpen((prev) => {
          const next = !prev;
          ping(next ? t12(language, 'Properties Inspector Opened [ ] ]', 'Özellikler Paneli Açıldı [ ] ]') : t12(language, 'Properties Inspector Collapsed [ ] ]', 'Özellikler Paneli Gizlendi [ ] ]'));
          return next;
        });
      } else if (key === '\\') {
        e.preventDefault();
        if (leftSidebarOpen || rightSidebarOpen) {
          setLeftSidebarOpen(false);
          setRightSidebarOpen(false);
          ping(t12(language, 'Zen View Mode Active [ \\ ]', 'Zen Görünüm Modu Aktif [ \\ ]'));
        } else {
          setLeftSidebarOpen(true);
          setRightSidebarOpen(true);
          ping(t12(language, 'Panels Restored [ \\ ]', 'Paneller Geri Yüklendi [ \\ ]'));
        }
      } else if (key === 's') {
        e.preventDefault();
        const x = Math.min(Math.max(lastMousePosRef.current.x - 130, 20), window.innerWidth - 280);
        const y = Math.min(Math.max(lastMousePosRef.current.y - 40, 60), window.innerHeight - 340);
        setHudPos({ x, y });
        setShowShortcutHud((prev) => !prev);
      } else if (key === 'e') {
        e.preventDefault();
        startSketchAdd('extrude');
        ping(t12(language, '✏️ Extrude Sketch Mode [E]', '✏️ Extrude Çizim Modu [E]'));
      } else if (key === 'c') {
        e.preventDefault();
        const target = selected || parts[0];
        if (target) {
          if (!selected) select(target.id);
          const newCutId = `cut-${Date.now().toString(36)}`;
          addCut({
            id: newCutId,
            type: 'rect',
            face: 'top',
            width: 25,
            length: 35,
            depth: 8,
            x: 0,
            y: 0,
            isThroughAll: false,
          });
          setExpandedCutId(newCutId);
          ping(t12(language, '✂️ Cut added [C]. Edit in right panel.', '✂️ Kesim eklendi [C]. Sağ panelden düzenleyin.'));
        }
      } else if (key === 'f') {
        e.preventDefault();
        triggerCameraView('fit');
        ping(t12(language, '⛶ Fit View (F)', '⛶ Ekrana Sığdır (F)'));
      } else if (key === '1') {
        e.preventDefault();
        triggerCameraView('front');
        ping(t12(language, 'Front View [1]', 'Ön Görünüş [1]'));
      } else if (key === '2') {
        e.preventDefault();
        triggerCameraView('top');
        ping(t12(language, 'Top View [2]', 'Üst Görünüş [2]'));
      } else if (key === '3') {
        e.preventDefault();
        triggerCameraView('right');
        ping(t12(language, 'Right View [3]', 'Sağ Görünüş [3]'));
      } else if (key === '7') {
        e.preventDefault();
        triggerCameraView('iso');
        ping(t12(language, 'Isometric View [7]', 'İzometrik Görünüş [7]'));
      } else if (key === 'x') {
        e.preventDefault();
        const nextAxis: Record<SectionAxis, SectionAxis> = { NONE: 'X', X: 'Y', Y: 'Z', Z: 'NONE' };
        const next = nextAxis[sectionAxis];
        setSectionAxis(next);
        ping(
          next === 'NONE'
            ? t12(language, 'Section View Disabled', 'Kesit Görünümü Kapatıldı')
            : `${t12(language, 'Section View Active', 'Kesit Görünümü Aktif')}: [${next}]`
        );
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault();
          deleteSelected();
          ping(t12(language, 'Part deleted', 'Parça silindi'));
        }
      } else if (e.key === 'Escape') {
        if (showShortcutHud) {
          e.preventDefault();
          setShowShortcutHud(false);
          return;
        }
        if (editingPartId || editingSubAssemblyId) {
          e.preventDefault();
          setEditingPartId(null);
          setEditingSubAssemblyId(null);
          ping(t12(language, 'Returned to Main Assembly', 'Ana Montaja dönüldü'));
        } else if (tool === 'mate') {
          e.preventDefault();
          const draft = useDesignStore.getState().activeMateDraft;
          if (draft?.partAId) {
            useDesignStore.getState().updateMateDraft({
              partAId: null,
              featureAId: null,
              featureAName: null,
            });
            ping(t12(language, 'Entity 1 selection cleared', '1. unsur seçimi temizlendi'));
          } else {
            closeMateModal();
            ping(t12(language, 'Exited Mate Mode', 'Montaj Modundan çıkıldı'));
          }
        } else if (tool !== 'select') {
          e.preventDefault();
          setTool('select');
        }
      } else if (e.key === 'Enter' && tool === 'mate') {
        e.preventDefault();
        const success = commitMateDraft();
        if (success) {
          ping(t12(language, '✔ Mate applied & solved', '✔ Montaj ilişkisi uygulandı'));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tool, setTool, selectedId, deleteSelected, language, sectionAxis, setSectionAxis, editingPartId, editingSubAssemblyId, setEditingPartId, setEditingSubAssemblyId, closeMateModal, openMateModal, commitMateDraft, showShortcutHud, leftSidebarOpen, rightSidebarOpen]);

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
    ping(`${getDesignKindLabel(k, language)} ${t12(language, 'added', 'eklendi')}`);
  };

  const handleExportAll = () => {
    if (parts.length === 0) {
      ping(t12(language, 'No parts in scene to export', 'Dışa aktarılacak parça yok'));
      return;
    }

    const gate = canExport(dfmReport, { allowOverride: dfmOverrideAllowed });
    if (!gate.allowed) {
      setShowDfmModal(true);
      ping(
        t12(language, `⛔ DFM Blocked: ${gate.blockers.length} critical DFM issues! Check DFM report.`, `⛔ DFM Engeli: ${gate.blockers.length} kritik üretilebilirlik hatası! DFM raporunu inceleyin.`)
      );
      return;
    }

    if (exportFormat === 'step') {
      const allowed = useLicenseStore.getState().guardFeature('step');
      if (!allowed) return;

      const stepStr = generateAssemblyStep(parts, projectName || 'AluDesign_Assembly');
      downloadStepFile(stepStr, `${(projectName || 'AluDesign').replace(/\s+/g, '_')}.step`);
      ping(t12(language, 'Assembly exported as B-Rep STEP', 'Montaj B-Rep STEP (ISO 10303-21) olarak indirildi'));
      return;
    }

    const stlStr = exportPartsToSTL(parts, projectName || 'AluDesign');
    downloadFile(stlStr, `${(projectName || 'AluDesign').replace(/\s+/g, '_')}.stl`, 'application/sla');
    ping(t12(language, 'Assembly exported as STL', 'Tüm montaj STL olarak indirildi'));
  };

  const handleExportSelected = () => {
    if (!selected) return;

    const gate = canExport(dfmReport, { allowOverride: dfmOverrideAllowed });
    if (!gate.allowed) {
      setShowDfmModal(true);
      ping(
        t12(language, `⛔ DFM Blocked: ${gate.blockers.length} critical DFM issues! Check DFM tab.`, `⛔ DFM Engeli: ${gate.blockers.length} kritik üretilebilirlik hatası! DFM sekmesini kontrol edin.`)
      );
      return;
    }

    if (exportFormat === 'step') {
      const allowed = useLicenseStore.getState().guardFeature('step');
      if (!allowed) return;

      const stepStr = generateAssemblyStep([selected], selected.name);
      downloadStepFile(stepStr, `${selected.name.replace(/\s+/g, '_')}.step`);
      ping(t12(language, `${selected.name} exported as B-Rep STEP`, `${selected.name} B-Rep STEP (ISO 10303-21) olarak indirildi`));
      return;
    }

    const stlStr = exportPartsToSTL([selected], selected.name);
    downloadFile(stlStr, `${selected.name.replace(/\s+/g, '_')}.stl`, 'application/sla');
    ping(t12(language, `${selected.name} exported as STL`, `${selected.name} STL olarak indirildi`));
  };

  return (
    <div className={`flex w-full flex-col overflow-hidden bg-[var(--bg-0)] text-slate-200 ${embedded ? 'h-full min-h-0' : 'h-[100dvh]'}`}>
      {/* Hidden File Input for Real CAD Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".stl,.obj,.gltf,.glb,.step,.stp,.x_t,.x_b,.iges,.igs,.dxf"
        multiple
        className="hidden"
        onChange={handleCADImport}
      />

      {/* ─── UNIFIED MODERN CAD WORKBENCH RIBBON (MERGED TOP CONTROLS) ─── */}
      <header className="flex flex-col shrink-0 border-b border-[var(--line)] bg-[var(--bg-1)] z-30 select-none">
        {/* Tier 1: Primary System, Project & Mode Bar */}
        <div className="flex h-10 shrink-0 items-center justify-between gap-1.5 sm:gap-2 px-2 sm:px-3 text-[11px] font-mono border-b border-[var(--line)]/50">
          {/* Zone 1 (Left): Project Identity & Telemetry */}
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] text-[var(--cyan)] shrink-0 shadow-inner">
              <Box size={14} />
            </div>
            <div className="flex items-center gap-1 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)] px-2 py-1 max-w-[150px] sm:max-w-[200px] focus-within:border-[var(--cyan)] transition-colors">
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Untitled Design"
                className="w-full bg-transparent font-mono text-[11px] font-bold text-[var(--ink)] placeholder-[var(--alu-dim)] outline-none"
                title="Project Name"
              />
            </div>
            <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[9px] text-[var(--alu-dim)]">
              <span>PARTS: <strong className="text-white">{parts.length}</strong></span>
              <span className="text-[var(--line)]">|</span>
              <span>MASS: <strong className="text-[var(--ok)]">{massProps.massKg.toFixed(2)} kg</strong></span>
            </div>
            <SaveStatusIndicator />
          </div>

          {/* Zone 2 (Center): Primary Studio Mode Switcher (Modern High-Contrast Segmented Bar) */}
          <div className="flex items-center gap-1 bg-[var(--bg-0)] p-0.5 rounded-[var(--radius-s)] border border-[var(--line)]">
            <button
              type="button"
              onClick={() => setStudioMode('object')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-s)] font-bold text-[10px] transition-all ${
                studioMode === 'object'
                  ? 'bg-[var(--bg-2)] text-[var(--cyan)] border border-[var(--cyan)]/50 shadow-sm'
                  : 'text-[var(--alu-dim)] hover:text-white border border-transparent'
              }`}
              title={tStudio.design}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${studioMode === 'object' ? 'bg-[var(--cyan)] ' : 'bg-slate-600'}`} />
              <span>{t12(language, 'DESIGN', 'TASARIM')}</span>
            </button>

            <button
              type="button"
              onClick={() => setStudioMode('inspect')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-s)] font-bold text-[10px] transition-all ${
                studioMode === 'inspect'
                  ? 'bg-[var(--bg-2)] text-[var(--warn)] border border-[var(--warn)]/50 shadow-sm'
                  : 'text-[var(--alu-dim)] hover:text-white border border-transparent'
              }`}
              title={tStudio.inspect}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${studioMode === 'inspect' ? 'bg-[var(--warn)] ' : 'bg-slate-600'}`} />
              <span>{t12(language, 'INSPECT & PROBE', 'İNCELE & ÖLÇ')}</span>
            </button>

            <button
              type="button"
              onClick={() => setStudioMode('sculpt')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-s)] font-bold text-[10px] transition-all ${
                studioMode === 'sculpt'
                  ? 'bg-[var(--bg-2)] text-[var(--std)] border border-[var(--std)]/50 shadow-sm'
                  : 'text-[var(--alu-dim)] hover:text-white border border-transparent'
              }`}
              title={tStudio.sculpt}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${studioMode === 'sculpt' ? 'bg-[var(--std)] ' : 'bg-slate-600'}`} />
              <span>{t12(language, 'SCULPT', 'YONTMA')}</span>
            </button>

            <div className="h-4 w-px bg-[var(--line)] mx-0.5" />

            {/* CAD File Importer */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-s)] text-[9.5px] font-bold text-[var(--alu)] hover:text-white hover:bg-[var(--bg-2)] transition-all"
              title={`${tStudio.importCad} (STEP, IGES, STL, OBJ, DXF)`}
            >
              <Upload size={11} className="text-[var(--cyan)]" />
              <span>CAD</span>
              <span className="text-[8px] px-1 py-0.2 rounded bg-[var(--bg-1)] text-[var(--alu-dim)] border border-[var(--line)]">.STP</span>
            </button>
          </div>

          {/* Zone 3 (Right): Utilities & Export Center */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Undo / Redo */}
            <div className="hidden sm:flex items-center p-0.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
              <button
                type="button"
                title="Undo [Ctrl+Z]"
                onClick={() => { undo(); ping(t12(language, 'Undo', 'Geri alındı')); }}
                className="p-1 rounded-[var(--radius-s)] text-[var(--alu-dim)] hover:text-white hover:bg-[var(--bg-2)] transition"
              >
                <Undo size={12} />
              </button>
              <button
                type="button"
                title="Redo [Ctrl+Y]"
                onClick={() => { redo(); ping(t12(language, 'Redo', 'İleri alındı')); }}
                className="p-1 rounded-[var(--radius-s)] text-[var(--alu-dim)] hover:text-white hover:bg-[var(--bg-2)] transition"
              >
                <Redo size={12} />
              </button>
            </div>

            {/* Engineering Tools Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setToolsOpen(!toolsOpen)}
                className={`flex items-center gap-1 px-2 py-1 rounded-[var(--radius-s)] border text-[9px] font-bold uppercase transition-all ${
                  toolsOpen
                    ? 'bg-[var(--cyan)]/20 border-[var(--cyan)] text-[var(--cyan)] shadow-sm'
                    : 'border-[var(--line)] bg-[var(--bg-0)] text-[var(--alu-dim)] hover:text-white hover:border-[var(--line-strong)]'
                }`}
                title={t12(language, 'Engineering Tools Menu', 'Mühendislik Araçları Menüsü')}
              >
                <Wrench size={11} />
                <span className="hidden sm:inline">{t12(language, 'Tools', 'Araçlar')}</span>
                <ChevronDown size={9} className={`transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`} />
              </button>

              {toolsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setToolsOpen(false)} />
                  <div className="absolute top-full right-0 mt-1.5 w-60 bg-[var(--bg-1)] border border-[var(--line-strong)] rounded-[var(--radius-m)] shadow-2xl z-50 flex flex-col py-1.5 gap-0.5 font-mono">
                    <button
                      type="button"
                      onClick={() => {
                        setToolsOpen(false);
                        setShowCenterOfGravity(!showCenterOfGravity);
                        ping(showCenterOfGravity ? (t12(language, 'CoG hidden', 'Ağırlık merkezi gizlendi')) : (t12(language, `🎯 CoG Active: ${massProps.massKg} kg`, `🎯 Ağırlık Merkezi: ${massProps.massKg} kg`)));
                      }}
                      className={`flex items-center gap-2 mx-1 px-2.5 py-1.5 rounded-[var(--radius-s)] text-[9.5px] font-bold transition-all text-left ${
                        showCenterOfGravity
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'text-slate-300 hover:bg-[var(--bg-2)] hover:text-white'
                      }`}
                    >
                      <span>🎯</span>
                      <span>{t12(language, 'Center of Gravity (CoG)', 'Ağırlık Merkezi (CoG)')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setToolsOpen(false);
                        setShowMaterialsModal(true);
                      }}
                      className="flex items-center gap-2 mx-1 px-2.5 py-1.5 rounded-[var(--radius-s)] text-[9.5px] font-bold text-amber-300 hover:bg-amber-500/15 transition-all text-left"
                    >
                      <Scale size={12} className="text-amber-400" />
                      <span>{t12(language, `Material & Mass (${massProps.massKg} kg)`, `Malzeme & Kütle (${massProps.massKg} kg)`)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setToolsOpen(false);
                        setShowTechnicalDrawingModal(true);
                      }}
                      className="flex items-center gap-2 mx-1 px-2.5 py-1.5 rounded-[var(--radius-s)] text-[9.5px] font-bold text-[var(--cyan)] hover:bg-[var(--cyan)]/15 transition-all text-left"
                    >
                      <FileText size={12} />
                      <span>{t12(language, '2D Technical Drawing', '2D Teknik Çizim Portföyü')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setToolsOpen(false);
                        const nextAxis: Record<SectionAxis, SectionAxis> = { NONE: 'X', X: 'Y', Y: 'Z', Z: 'NONE' };
                        const next = nextAxis[sectionAxis];
                        setSectionAxis(next);
                        ping(
                          next === 'NONE'
                            ? t12(language, 'Section View Disabled', 'Kesit Görünümü Kapatıldı')
                            : `${t12(language, 'Section View Active', 'Kesit Görünümü Aktif')}: [${next}]`
                        );
                      }}
                      className={`flex items-center justify-between mx-1 px-2.5 py-1.5 rounded-[var(--radius-s)] text-[9.5px] font-bold transition-all text-left ${
                        sectionAxis !== 'NONE'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'text-slate-300 hover:bg-[var(--bg-2)] hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Scissors size={12} className={sectionAxis !== 'NONE' ? 'text-rose-400' : 'text-slate-400'} />
                        <span>{t12(language, '3D Section View [X]', '3D Kesit Görünümü [X]')}</span>
                      </span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-0)] text-rose-400 border border-rose-500/30">
                        {sectionAxis === 'NONE' ? 'OFF' : `${sectionAxis} (${sectionOffset}mm)`}
                      </span>
                    </button>

                    <div className="h-px bg-[var(--line)] my-1 mx-1.5" />

                    {/* Cross-Module Bridges */}
                    <button
                      type="button"
                      onClick={() => {
                        setToolsOpen(false);
                        const cutProfiles = parts.filter(p =>
                          p.kind === 'I-beam' || p.kind === 'U-channel' || p.kind === 'L-bracket' || p.kind === 'T-beam' || p.kind === 'box' || (p.kind === 'profile' && p.solidOp === 'extrude')
                        );
                        const items = cutProfiles.map((p, idx) => ({
                          id: p.id || `profile-${idx}`,
                          label: p.name || `Profile ${idx + 1}`,
                          length: p.params?.extrudeDepth || p.params?.depth || p.params?.length || (p.params?.height && p.params.height > 100 ? p.params.height : 500),
                          qty: 1,
                          material: activeMaterial.name,
                          crossSection: p.kind
                        }));
                        CrossModuleBridge.exportProfilesToCuttingOptimizer(items, true);
                      }}
                      className="flex items-center gap-2 mx-1 px-2.5 py-1.5 rounded-[var(--radius-s)] text-[9.5px] font-bold text-emerald-400 hover:bg-emerald-500/15 transition-all text-left"
                    >
                      <Scissors size={12} />
                      <span>{t12(language, '✂️ Send to Cut Optimizer', '✂️ Kesim Optimizasyonuna Gönder')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setToolsOpen(false);
                        CrossModuleBridge.exportTo2DCad('profile', parts, true);
                      }}
                      className="flex items-center gap-2 mx-1 px-2.5 py-1.5 rounded-[var(--radius-s)] text-[9.5px] font-bold text-blue-400 hover:bg-blue-500/15 transition-all text-left"
                    >
                      <PenTool size={12} />
                      <span>{t12(language, '📐 Open in 2D CAD', '📐 2D CAD Editöründe Aç')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setToolsOpen(false);
                        CrossModuleBridge.sendPartToFEA(selected?.id, { switchWindow: true });
                      }}
                      className="flex items-center gap-2 mx-1 px-2.5 py-1.5 rounded-[var(--radius-s)] text-[9.5px] font-bold text-cyan-400 hover:bg-cyan-500/15 transition-all text-left"
                    >
                      <Sparkles size={12} />
                      <span>{t12(language, '🔬 Send to FEA Simulation', '🔬 Yapısal FEA Analizine Gönder')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setToolsOpen(false);
                        setShowDfmModal(true);
                      }}
                      className="flex items-center gap-2 mx-1 px-2.5 py-1.5 rounded-[var(--radius-s)] text-[9.5px] font-bold text-rose-400 hover:bg-rose-500/15 transition-all text-left"
                    >
                      <Shield size={12} />
                      <span>{t12(language, '🛡️ DFM Quality Gate Audit', '🛡️ DFM İmalat Doğrulama Denetimi')}</span>
                      {dfmReport.criticalCount > 0 && (
                        <span className="ml-auto px-1.5 py-0.2 rounded bg-rose-500 text-white text-[7.5px] font-black">
                          {dfmReport.criticalCount}
                        </span>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Two-Way Parametric Sync to 2D CAD */}
            <button
              type="button"
              onClick={() => {
                if (selected) {
                  const res = CrossModuleBridge.exportDesignStudioToCad(selected, { clearCanvas: false });
                  ping(t12(language, `📐 ${selected.name} exported to 2D CAD!`, `📐 ${selected.name} 2D CAD çizimine aktarıldı!`));
                }
                window.location.href = '/cad-editor/';
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-s)] border border-[var(--cyan)]/40 bg-[var(--cyan)]/10 text-[var(--cyan)] hover:bg-[var(--cyan)]/20 text-[9px] font-bold uppercase transition shadow-sm shrink-0"
              title={t12(language, 'Sync selected part to 2D CAD Editor', 'Seçili parçayı 2D CAD çizim sayfasına aktar ve düzenle')}
            >
              <PenTool size={11} />
              <span className="hidden sm:inline">{t12(language, '2D CAD EDIT', '2D CAD DÜZENLE')}</span>
            </button>

            {/* 12-Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 px-1.5 py-1 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] hover:bg-[var(--bg-2)] text-[9px] text-[var(--alu-dim)] font-bold transition-all"
                title="Change Language / Dili Değiştir"
              >
                <FlagIcon lang={language} className="h-2.5 w-3.5 rounded-sm object-cover" />
                <span className="uppercase text-[9px]">{language}</span>
                <ChevronDown size={9} className={`text-slate-500 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>

              {langOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                  <div className="absolute right-0 mt-1.5 z-50 bg-[var(--bg-1)] border border-[var(--line-strong)] rounded-[var(--radius-m)] shadow-2xl p-1.5 grid grid-cols-2 sm:grid-cols-3 gap-1 min-w-[240px] font-mono">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => {
                          setLanguage(lang.id);
                          setLangOpen(false);
                        }}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-s)] text-[9.5px] transition-all ${
                          language === lang.id
                            ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] font-bold border border-[var(--cyan)]/40'
                            : 'text-slate-300 hover:bg-[var(--bg-2)] hover:text-white'
                        }`}
                      >
                        <FlagIcon lang={lang.id} className="h-2 w-3 rounded-sm object-cover shrink-0" />
                        <span className="truncate">{lang.native}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Export Format Selector */}
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] px-1.5 py-1 text-[9px] font-mono text-slate-300 outline-none focus:border-[var(--cyan)] shrink-0 cursor-pointer"
            >
              <option value="stl-binary" className="bg-[var(--bg-1)]">STL Binary</option>
              <option value="stl-ascii" className="bg-[var(--bg-1)]">STL ASCII</option>
              <option value="obj" className="bg-[var(--bg-1)]">OBJ</option>
              <option value="dxf" className="bg-[var(--bg-1)]">DXF 2D (1:1)</option>
              <option value="step" className="bg-[var(--bg-1)]">STEP 3D B-Rep</option>
            </select>

            {/* Export Selected Part */}
            {selectedId && (
              <button
                type="button"
                onClick={handleExportSelected}
                className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-s)] border border-[var(--cyan)]/40 bg-[var(--cyan)]/10 text-[var(--cyan)] hover:bg-[var(--cyan)]/20 text-[9px] font-bold uppercase tracking-wider transition shrink-0"
                title={t12(language, 'Export Selected Part', 'Seçili Parçayı Dışa Aktar')}
              >
                <Download size={11} />
                <span className="hidden sm:inline">{exportFormat === 'step' ? 'STEP' : 'STL'}</span>
              </button>
            )}

            {/* Export All Parts */}
            <button
              type="button"
              onClick={handleExportAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--cyan)] hover:bg-cyan-300 text-[var(--bg-0)] text-[9px] font-black uppercase tracking-wider transition shadow-sm shrink-0"
            >
              <Download size={11} />
              <span>EXPORT</span>
            </button>

            {/* DFM Critical Blocker Alert */}
            {dfmReport.criticalCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowDfmModal(true);
                  ping(t12(language, `⛔ DFM: ${dfmReport.criticalCount} critical blockers!`, `⛔ DFM: ${dfmReport.criticalCount} kritik hata mevcut!`));
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-s)] border border-rose-500/50 bg-rose-500/20 text-rose-300 text-[9px] font-bold uppercase transition animate-pulse shrink-0"
                title={t12(language, 'DFM Critical Blocker: Export locked', 'DFM Kritik Engel: İhracat kilitli')}
              >
                <Shield size={11} className="text-rose-400" />
                <span>{dfmReport.criticalCount} DFM</span>
              </button>
            )}
          </div>
        </div>

        {/* Tier 2: Dynamic Contextual Tool Strip & Universal Viewport Controls */}
        <div className="flex h-9 shrink-0 items-center justify-between gap-2 px-2 sm:px-3 text-[10px] font-mono bg-[var(--bg-0)] overflow-x-auto no-scrollbar">
          {/* Left: Mode-Specific Action Tools */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* ─── DESIGN MODE TOOLS ─── */}
            {studioMode === 'object' && (
              <>
                {/* Transform Gizmo Segmented Bar */}
                <div className="flex items-center p-0.5 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)]">
                  <button
                    type="button"
                    title="Select [V]"
                    onClick={() => setTool('select')}
                    className={`px-2 py-0.5 rounded-[var(--radius-s)] flex items-center gap-1 text-[9.5px] font-bold transition-all ${
                      tool === 'select'
                        ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/50 shadow-sm'
                        : 'text-[var(--alu-dim)] hover:text-white border border-transparent'
                    }`}
                  >
                    <MousePointer2 size={11} />
                    <span>SELECT</span>
                  </button>
                  <button
                    type="button"
                    title="Move [G]"
                    onClick={() => setTool('move')}
                    className={`px-2 py-0.5 rounded-[var(--radius-s)] flex items-center gap-1 text-[9.5px] font-bold transition-all ${
                      tool === 'move'
                        ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/50 shadow-sm'
                        : 'text-[var(--alu-dim)] hover:text-white border border-transparent'
                    }`}
                  >
                    <Move size={11} />
                    <span>MOVE</span>
                  </button>
                  <button
                    type="button"
                    title="Rotate [R]"
                    onClick={() => setTool('rotate')}
                    className={`px-2 py-0.5 rounded-[var(--radius-s)] flex items-center gap-1 text-[9.5px] font-bold transition-all ${
                      tool === 'rotate'
                        ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/50 shadow-sm'
                        : 'text-[var(--alu-dim)] hover:text-white border border-transparent'
                    }`}
                  >
                    <RotateCcw size={11} />
                    <span>ROT</span>
                  </button>
                  <button
                    type="button"
                    title="Scale [S]"
                    onClick={() => setTool('scale')}
                    className={`px-2 py-0.5 rounded-[var(--radius-s)] flex items-center gap-1 text-[9.5px] font-bold transition-all ${
                      tool === 'scale'
                        ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/50 shadow-sm'
                        : 'text-[var(--alu-dim)] hover:text-white border border-transparent'
                    }`}
                  >
                    <Maximize2 size={11} />
                    <span>SCALE</span>
                  </button>
                  <button
                    type="button"
                    title="Measure [M]"
                    onClick={() => setTool('measure')}
                    className={`px-2 py-0.5 rounded-[var(--radius-s)] flex items-center gap-1 text-[9.5px] font-bold transition-all ${
                      tool === 'measure'
                        ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/50 shadow-sm'
                        : 'text-[var(--alu-dim)] hover:text-white border border-transparent'
                    }`}
                  >
                    <Ruler size={11} />
                    <span>CAL</span>
                  </button>
                </div>

                <div className="h-4 w-px bg-[var(--line)] mx-0.5" />

                {/* ─── 3D ASSEMBLY TOOLS GROUP (SOLIDWORKS TOOLBOX & MATES) ─── */}
                <div className="flex items-center gap-1 p-0.5 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-cyan-500/40 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShapesMenuOpen(true)}
                    className={`px-2 py-0.5 rounded-[var(--radius-s)] flex items-center gap-1 text-[9px] font-bold transition-all cursor-pointer ${
                      shapesMenuOpen
                        ? 'bg-[var(--cyan)] text-black font-extrabold shadow-sm'
                        : 'text-white hover:text-[var(--cyan)]'
                    }`}
                    title={t12(language, 'Add 3D Primitives & Profiles', '3D Katı Şekiller & Profiller Ekle')}
                  >
                    <Boxes size={11} className={shapesMenuOpen ? 'text-black' : 'text-[var(--cyan)]'} />
                    <span>{t12(language, '+ SHAPES', '+ ŞEKİL')}</span>
                  </button>

                  <div className="h-3 w-px bg-white/10" />

                  <button
                    type="button"
                    onClick={() => {
                      if (tool === 'mate') {
                        closeMateModal();
                      } else {
                        openMateModal();
                      }
                    }}
                    className={`px-2 py-0.5 rounded-[var(--radius-s)] flex items-center gap-1 text-[9px] font-bold transition-all cursor-pointer active:scale-95 ${
                      tool === 'mate'
                        ? 'bg-[var(--cyan)] text-black font-extrabold '
                        : 'text-cyan-300 hover:bg-cyan-500/20'
                    }`}
                    title={t12(
                      language,
                      'SolidWorks Assembly Mate: Switch into 3D Mating Mode [M]',
                      'SolidWorks Montaj İlişkisi: 3D Montajlama Moduna Geç [M]'
                    )}
                  >
                    <Link2 size={11} className={tool === 'mate' ? 'text-black' : 'text-cyan-400'} />
                    <span>{t12(language, '📎 MATE', '📎 MONTAJ')}</span>
                  </button>

                  <div className="h-3 w-px bg-white/10" />

                  <button
                    type="button"
                    onClick={() => openFastenersModal()}
                    className="px-2 py-0.5 rounded-[var(--radius-s)] flex items-center gap-1 text-[9px] font-bold text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer active:scale-95"
                    title={t12(
                      language,
                      'SolidWorks Smart Fasteners & Toolbox: Detect coaxial holes & auto-assemble standard ISO bolts, nuts & mates',
                      'SolidWorks Akıllı Bağlantı Elemanı: Eşmerkezli delikleri tara ve standart ISO cıvata, somun ve montaj ilişkilerini otomatik ekle'
                    )}
                  >
                    <Sparkles size={11} className="text-amber-400" />
                    <span>{t12(language, '⚡ FASTENERS', '⚡ OTO CIVATA')}</span>
                  </button>
                </div>

                <div className="h-4 w-px bg-[var(--line)] mx-0.5" />

                {/* Core 3D CAD Operations: Extrude, Revolve, Loft, Cut */}
                <div className="flex items-center p-0.5 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)]">
                  <button
                    type="button"
                    title={t12(language, 'Extrude [E]', 'Katılaştır (Extrude) [E]')}
                    onClick={() => {
                      startSketchAdd('extrude');
                      ping(t12(language, '✏️ Extrude Sketch Mode: Draw profile on plane/face', '✏️ Extrude Çizim Modu: Çizim için tıklayın'));
                    }}
                    className={`px-2 py-0.5 rounded-[var(--radius-s)] flex items-center gap-1 text-[9.5px] font-bold transition-all ${
                      tool === 'sketch-add' && pendingOp === 'extrude'
                        ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/50 shadow-sm'
                        : 'text-[var(--alu-dim)] hover:text-white border border-transparent'
                    }`}
                  >
                    <Pencil size={11} className={tool === 'sketch-add' && pendingOp === 'extrude' ? 'text-[var(--cyan)]' : 'text-slate-400'} />
                    <span>EXTRUDE</span>
                  </button>
                  <button
                    type="button"
                    title={t12(language, 'Revolve Profile', 'Döndürerek Katılaştır (Revolve)')}
                    onClick={() => {
                      startSketchAdd('revolve');
                      ping(t12(language, '🔄 Revolve Sketch Mode: Draw cross-section profile', '🔄 Revolve Çizim Modu: Kesit profili çizin'));
                    }}
                    className={`px-2 py-0.5 rounded-[var(--radius-s)] flex items-center gap-1 text-[9.5px] font-bold transition-all ${
                      tool === 'sketch-add' && pendingOp === 'revolve'
                        ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/50 shadow-sm'
                        : 'text-[var(--alu-dim)] hover:text-white border border-transparent'
                    }`}
                  >
                    <RotateCw size={11} className={tool === 'sketch-add' && pendingOp === 'revolve' ? 'text-[var(--cyan)]' : 'text-slate-400'} />
                    <span>REVOLVE</span>
                  </button>
                  <button
                    type="button"
                    title={t12(language, 'Loft Profile', 'Loft Geçiş')}
                    onClick={() => {
                      startSketchAdd('loft');
                      ping(t12(language, '🧭 Loft Sketch Mode: Draw base profile', '🧭 Loft Çizim Modu: Taban profili çizin'));
                    }}
                    className={`px-2 py-0.5 rounded-[var(--radius-s)] flex items-center gap-1 text-[9.5px] font-bold transition-all ${
                      tool === 'sketch-loft'
                        ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/50 shadow-sm'
                        : 'text-[var(--alu-dim)] hover:text-white border border-transparent'
                    }`}
                  >
                    <Compass size={11} className={tool === 'sketch-loft' ? 'text-[var(--cyan)]' : 'text-slate-400'} />
                    <span>LOFT</span>
                  </button>
                  <button
                    type="button"
                    title={t12(language, 'Cut / Pocket [C]', 'Yüzey Kes / Havuz (Cut) [C]')}
                    onClick={() => {
                      const target = selected || parts[0];
                      if (target) {
                        if (!selected) select(target.id);
                        const newCutId = `cut-${Date.now().toString(36)}`;
                        addCut({
                          id: newCutId,
                          type: 'rect',
                          face: 'top',
                          width: 25,
                          length: 35,
                          depth: 8,
                          x: 0,
                          y: 0,
                          isThroughAll: false,
                        });
                        setExpandedCutId(newCutId);
                        ping(t12(language, '✂️ Cut added. Adjust face & dimensions in the right panel.', '✂️ Kesim eklendi. Yüzey ve ölçüleri sağ panelden düzenleyin.'));
                      } else {
                        ping(t12(language, 'Please add a part first before applying cuts', 'Kesim uygulamak için önce bir parça ekleyin'));
                      }
                    }}
                    className={`px-2 py-0.5 rounded-[var(--radius-s)] flex items-center gap-1 text-[9.5px] font-bold transition-all ${
                      tool === 'sketch-cut' || expandedCutId !== null
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm'
                        : 'text-[var(--alu-dim)] hover:text-rose-400 border border-transparent'
                    }`}
                  >
                    <Scissors size={11} className={tool === 'sketch-cut' || expandedCutId !== null ? 'text-rose-400' : 'text-slate-400'} />
                    <span>CUT</span>
                  </button>
                </div>

                <div className="h-4 w-px bg-[var(--line)] mx-0.5 shrink-0" />

                {/* SolidWorks 'S' Quick Shortcut Trigger Button */}
                <button
                  type="button"
                  onClick={() => {
                    const x = Math.min(Math.max(lastMousePosRef.current.x - 130, 20), window.innerWidth - 280);
                    const y = Math.min(Math.max(lastMousePosRef.current.y - 40, 60), window.innerHeight - 340);
                    setHudPos({ x, y });
                    setShowShortcutHud((prev) => !prev);
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-s)] text-[9px] font-bold transition-all border shrink-0 cursor-pointer ${
                    showShortcutHud
                      ? 'bg-[var(--cyan)] text-[var(--accent-ink)] border-amber-300 shadow-sm font-black'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                  }`}
                  title={t12(language, 'Quick Tools Palette [S]: Fast floating CAD actions', 'Hızlı Araçlar Menüsü [S]: İmleçte açılan hızlı işlemler')}
                >
                  <Sparkles size={11} className={showShortcutHud ? 'text-black' : 'text-amber-400'} />
                  <span>S-BAR</span>
                </button>
              </>
            )}

            {/* ─── INSPECT MODE TOOLS ─── */}
            {studioMode === 'inspect' && (
              <>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-s)] bg-[var(--warn)]/15 text-[var(--warn)] font-bold border border-[var(--warn)]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)] " />
                  <span>INSPECT & MEASURE</span>
                </div>

                {/* Measure Tool & Modes */}
                <div className="flex items-center gap-0.5 bg-[var(--bg-1)] p-0.5 rounded-[var(--radius-s)] border border-[var(--line)]">
                  <button
                    type="button"
                    onClick={() => {
                      setTool(tool === 'measure' ? 'select' : 'measure');
                      ping(tool === 'measure' ? (t12(language, 'Select mode', 'Seçim moduna dönüldü')) : (t12(language, '📏 3D Caliper active', '📏 3D Kumpas devrede')));
                    }}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-s)] font-bold transition-all ${
                      tool === 'measure'
                        ? 'bg-[var(--bg-2)] text-[var(--cyan)] border border-[var(--cyan)]/50 shadow-sm'
                        : 'text-[var(--alu-dim)] hover:text-white'
                    }`}
                  >
                    <Ruler size={11} />
                    <span>{t12(language, '3D Caliper', '3D Kumpas')}</span>
                  </button>

                  {tool === 'measure' && (
                    <>
                      <button
                        type="button"
                        onClick={() => { setMeasureMode('auto'); ping(t12(language, 'Auto Caliper', 'Otomatik Kumpas')); }}
                        className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${measureMode === 'auto' ? 'bg-[var(--bg-2)] text-[var(--cyan)] border border-[var(--cyan)]/40' : 'text-slate-400 hover:text-white'}`}
                      >
                        Auto
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMeasureMode('distance'); ping(t12(language, 'Surface Mode', 'Yüzey Modu')); }}
                        className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${measureMode === 'distance' ? 'bg-[var(--bg-2)] text-[var(--cyan)] border border-[var(--cyan)]/40' : 'text-slate-400 hover:text-white'}`}
                      >
                        Surface
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMeasureMode('diameter'); ping(t12(language, 'Dia Mode', 'Çap Modu')); }}
                        className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${measureMode === 'diameter' ? 'bg-[var(--bg-2)] text-[var(--ok)] border border-[var(--ok)]/40' : 'text-slate-400 hover:text-white'}`}
                      >
                        ⌀ Dia
                      </button>
                    </>
                  )}
                </div>

                <div className="h-4 w-px bg-[var(--line)] mx-0.5" />

                {/* 3D Section Cutting Tool (Kesit Alma) */}
                <div
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-s)] border transition-all ${
                    sectionAxis !== 'NONE'
                      ? 'bg-rose-950/40 border-rose-500/60 '
                      : 'bg-[var(--bg-1)] border-[var(--line)]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const nextAxis: Record<SectionAxis, SectionAxis> = { NONE: 'X', X: 'Y', Y: 'Z', Z: 'NONE' };
                      const next = nextAxis[sectionAxis];
                      setSectionAxis(next);
                      ping(
                        next === 'NONE'
                          ? t12(language, 'Section View Disabled', 'Kesit Görünümü Kapatıldı')
                          : `${t12(language, 'Section View Active', 'Kesit Görünümü Aktif')}: [${next}]`
                      );
                    }}
                    className={`flex items-center gap-1 text-[9px] font-bold transition-colors ${
                      sectionAxis !== 'NONE' ? 'text-rose-400' : 'text-slate-300 hover:text-white'
                    }`}
                    title={t12(language, 'Toggle 3D Section Cut (Cycle NONE -> X -> Y -> Z) [X]', '3D Kesit Görünümü (X / Y / Z Düzlemi) [X]')}
                  >
                    <Scissors size={11} className={sectionAxis !== 'NONE' ? 'text-rose-400' : 'text-slate-400'} />
                    <span>{t12(language, 'SECTION', 'KESİT')}:</span>
                  </button>

                  {/* Axis Quick Selector Buttons: OFF | X | Y | Z */}
                  <div className="flex items-center gap-0.5 bg-[var(--bg-2)] p-0.5 rounded-[var(--radius-s)] border border-[var(--line)]">
                    {(['NONE', 'X', 'Y', 'Z'] as const).map((ax) => (
                      <button
                        key={ax}
                        type="button"
                        onClick={() => {
                          setSectionAxis(ax);
                          ping(
                            ax === 'NONE'
                              ? t12(language, 'Section View Disabled', 'Kesit Görünümü Kapatıldı')
                              : `${t12(language, 'Section View Active', 'Kesit Görünümü Aktif')}: [${ax}]`
                          );
                        }}
                        className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold transition-all ${
                          sectionAxis === ax
                            ? ax === 'NONE'
                              ? 'bg-[var(--bg-3)] text-slate-300'
                              : 'bg-rose-500 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title={
                          ax === 'NONE'
                            ? t12(language, 'Disable Section Cut', 'Kesiti Kapat')
                            : `${ax} ${t12(language, 'Plane Cut', 'Düzleminde Kesit Al')}`
                        }
                      >
                        {ax === 'NONE' ? 'OFF' : ax}
                      </button>
                    ))}
                  </div>

                  {sectionAxis !== 'NONE' && (
                    <div className="flex items-center gap-1.5 pl-1 border-l border-rose-500/30">
                      <input
                        type="range"
                        min={-300}
                        max={300}
                        step={1}
                        value={sectionOffset}
                        onChange={(e) => setSectionOffset(Number(e.target.value))}
                        className="w-16 h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-[var(--cyan)]"
                        title={t12(language, 'Section Offset (mm)', 'Kesit Düzlemi Konumu (mm)')}
                      />
                      <span className="text-[8.5px] text-rose-300 font-mono font-bold w-10 text-right">{sectionOffset}mm</span>

                      <button
                        type="button"
                        onClick={() => setSectionOffset(0)}
                        className="px-1 py-0.5 rounded text-[8px] font-bold bg-[var(--bg-2)] border border-[var(--line)] text-slate-300 hover:text-white"
                        title={t12(language, 'Reset to Center (0 mm)', 'Merkeze Sıfırla (0 mm)')}
                      >
                        0
                      </button>

                      <button
                        type="button"
                        onClick={() => setSectionInvert(!sectionInvert)}
                        className="px-1 py-0.5 rounded text-[8.5px] font-bold bg-[var(--bg-2)] border border-[var(--line)] text-slate-300 hover:text-white"
                        title={t12(language, 'Invert Cut Direction', 'Kesim Yönünü Ters Çevir')}
                      >
                        ⇄
                      </button>

                      <button
                        type="button"
                        onClick={() => setSectionSolidCap(!sectionSolidCap)}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-bold border transition-all ${
                          sectionSolidCap
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-[var(--bg-2)] border-[var(--line)] text-slate-400'
                        }`}
                        title={t12(language, 'Solid Section Cap (Filled vs Hollow)', 'Katı Kesit Dolgusu (Dolu / Boş)')}
                      >
                        {sectionSolidCap ? 'SOLID' : 'HOLLOW'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="h-4 w-px bg-[var(--line)] mx-0.5" />

                {/* Exploded View Slider + Direction */}
                <div className="flex items-center gap-1.5 bg-[var(--bg-1)] px-2 py-0.5 rounded-[var(--radius-s)] border border-[var(--line)]">
                  <span className="text-[9px] text-[var(--warn)] font-bold">💥 {t12(language, 'EXPLODE', 'PATLATMA')}:</span>
                  <input
                    type="range"
                    min={0}
                    max={150}
                    step={1}
                    value={explodeFactor}
                    onChange={(e) => setExplodeFactor(Number(e.target.value))}
                    className="w-16 h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-[var(--cyan)]"
                  />
                  <span className="text-[9px] text-slate-300 font-bold w-6 text-right">{explodeFactor}%</span>
                  <select
                    value={explodeDirection}
                    onChange={(e) => setExplodeDirection(e.target.value as any)}
                    className="bg-[var(--bg-2)] border border-[var(--line)] text-[8.5px] text-slate-300 font-bold rounded px-1 py-0.5 outline-none cursor-pointer"
                  >
                    <option value="radial">↗ Radial</option>
                    <option value="axial-y">↕ Axial Y</option>
                    <option value="axial-x">↔ Axial X</option>
                    <option value="axial-z">↕ Axial Z</option>
                    <option value="linear-sequence">⇣ Sequence</option>
                  </select>
                </div>

                {/* Ghost & Isolate */}
                <button
                  type="button"
                  onClick={() => setGhostIsolated(!ghostIsolated)}
                  className={`px-2 py-0.5 rounded-[var(--radius-s)] text-[9px] font-bold border transition-all ${
                    ghostIsolated ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-[var(--bg-1)] border-[var(--line)] text-slate-400 hover:text-white'
                  }`}
                  title={t12(language, 'Ghost View non-isolated parts', 'İzole edilmemiş parçaları şeffaf göster')}
                >
                  👻 {t12(language, 'Ghost', 'Hayalet')}
                </button>

                {selected && (
                  <button
                    type="button"
                    onClick={toggleIsolateSelected}
                    className={`px-2 py-0.5 rounded-[var(--radius-s)] text-[9px] font-bold border transition-all ${
                      isolatedPartId === selected.id ? 'bg-amber-500/30 border-amber-400 text-amber-300' : 'bg-[var(--bg-1)] border-[var(--line)] text-slate-300 hover:text-white'
                    }`}
                  >
                    🎯 {isolatedPartId === selected.id ? (t12(language, 'Unisolate', 'İzoleyi Kaldır')) : (t12(language, 'Isolate', 'İzole Et'))}
                  </button>
                )}

                {measurements.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { clearMeasurements(); ping(t12(language, 'All measurements cleared', 'Ölçüler temizlendi')); }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-s)] text-[9px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300"
                  >
                    <Trash2 size={10} />
                    <span>{measurements.length}</span>
                  </button>
                )}
              </>
            )}

            {/* ─── SCULPT MODE TOOLS ─── */}
            {studioMode === 'sculpt' && (
              <>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-s)] bg-[var(--std)]/15 text-[var(--std)] font-bold border border-[var(--std)]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--std)] " />
                  <span>SCULPT</span>
                  {selected ? (
                    <span className="text-[8.5px] text-[var(--cyan)] bg-[var(--bg-1)] px-1 py-0.2 rounded border border-[var(--line)] max-w-[90px] truncate">
                      {selected.name}
                    </span>
                  ) : (
                    <span className="text-[8.5px] text-amber-400">⚠️ {t12(language, 'Select shape', 'Model seçin')}</span>
                  )}
                </div>

                {/* Sculpt Brushes */}
                <div className="flex items-center gap-0.5 bg-[var(--bg-1)] p-0.5 rounded-[var(--radius-s)] border border-[var(--line)]">
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
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-bold transition-all ${
                        sculptBrush === b.id
                          ? 'bg-[var(--bg-2)] text-[var(--std)] border border-[var(--std)]/50 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{b.icon}</span>
                      <span className="hidden xl:inline">{b.label}</span>
                    </button>
                  ))}
                </div>

                {/* Add/Sub */}
                <button
                  type="button"
                  onClick={() => setSculptDirection(sculptDirection === 'add' ? 'sub' : 'add')}
                  className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold border ${sculptDirection === 'add' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-rose-500/20 border-rose-400 text-rose-300'}`}
                >
                  {sculptDirection === 'add' ? '➕ ADD' : '➖ SUB'}
                </button>

                {/* Radius & Strength */}
                <div className="flex items-center gap-1 bg-[var(--bg-1)] px-1.5 py-0.5 rounded-[var(--radius-s)] border border-[var(--line)]">
                  <span className="text-[8.5px] text-slate-400 font-bold">R:</span>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={sculptRadius}
                    onChange={(e) => setSculptRadius(Number(e.target.value))}
                    className="w-12 h-1 bg-slate-800 rounded accent-[var(--cyan)] cursor-pointer"
                  />
                  <span className="text-[8.5px] text-white font-bold w-4 text-right">{sculptRadius}</span>
                </div>

                <div className="flex items-center gap-1 bg-[var(--bg-1)] px-1.5 py-0.5 rounded-[var(--radius-s)] border border-[var(--line)]">
                  <span className="text-[8.5px] text-slate-400 font-bold">Str:</span>
                  <input
                    type="range"
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    value={sculptStrength}
                    onChange={(e) => setSculptStrength(Number(e.target.value))}
                    className="w-12 h-1 bg-slate-800 rounded accent-[var(--cyan)] cursor-pointer"
                  />
                  <span className="text-[8.5px] text-white font-bold w-5 text-right">{Math.round(sculptStrength * 100)}%</span>
                </div>

                <button
                  type="button"
                  onClick={() => setSculptSymmetry(!sculptSymmetry)}
                  className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold border ${sculptSymmetry ? 'bg-purple-500/20 border-purple-400 text-purple-300' : 'bg-[var(--bg-1)] border-[var(--line)] text-slate-400 hover:text-white'}`}
                >
                  🪞 X-SYM
                </button>

                <button
                  type="button"
                  onClick={resetSculpt}
                  className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-[var(--bg-1)] border border-[var(--line)] text-slate-400 hover:text-rose-300"
                >
                  🔄 RESET
                </button>
              </>
            )}
          </div>

          {/* Right: Universal Viewport Matrix (Shading, Overlays, Lighting, Camera) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Shading Modes */}
            <div className="flex items-center gap-0.5 bg-[var(--bg-1)] p-0.5 rounded-[var(--radius-s)] border border-[var(--line)]">
              {(['solid', 'wire', 'matcap', 'pbr', 'xray'] as RenderMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setRenderMode(m)}
                  className={`px-1.5 py-0.5 rounded-[var(--radius-s)] text-[8.5px] font-bold uppercase transition-all ${
                    renderMode === m
                      ? 'bg-[var(--bg-2)] text-[var(--cyan)] border border-[var(--cyan)]/40 shadow-sm'
                      : 'text-[var(--alu-dim)] hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-[var(--line)] mx-0.5 shrink-0" />

            {/* Overlays: Edges, Mesh, Grid + Snap */}
            <div className="flex items-center gap-0.5 bg-[var(--bg-1)] p-0.5 rounded-[var(--radius-s)] border border-[var(--line)]">
              <button
                type="button"
                onClick={() => {
                  toggleCadEdges();
                  ping(showCadEdges ? (t12(language, 'CAD Edges hidden', 'CAD Kenarları gizlendi')) : (t12(language, 'CAD Edges visible', 'CAD Kenarları aktif')));
                }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--radius-s)] text-[8.5px] font-bold border transition-all ${
                  showCadEdges ? 'bg-[var(--bg-2)] text-[var(--cyan)] border-[var(--cyan)]/60' : 'text-[var(--alu-dim)] border-transparent hover:text-white'
                }`}
                title="Toggle CAD Feature Edges"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${showCadEdges ? 'bg-[var(--cyan)] ' : 'bg-slate-600'}`} />
                <span>EDGES</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  toggleMeshWireframe();
                  ping(showMeshWireframe ? (t12(language, 'Mesh wireframe hidden', '3D Ağ çizgileri gizlendi')) : (t12(language, '3D Mesh wireframe visible', '3D Ağ çizgileri aktif')));
                }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--radius-s)] text-[8.5px] font-bold border transition-all ${
                  showMeshWireframe ? 'bg-[var(--bg-2)] text-[var(--ok)] border-[var(--ok)]/60' : 'text-[var(--alu-dim)] border-transparent hover:text-white'
                }`}
                title="Toggle 3D Mesh Wireframe"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${showMeshWireframe ? 'bg-[var(--ok)] ' : 'bg-slate-600'}`} />
                <span>MESH</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGrid(!showGrid)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--radius-s)] text-[8.5px] font-bold border transition-all ${
                  showGrid ? 'bg-[var(--bg-2)] text-[var(--cyan)] border-[var(--line-strong)]' : 'text-[var(--alu-dim)] border-transparent hover:text-white'
                }`}
                title="Toggle Ground Grid"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${showGrid ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                <span>GRID</span>
              </button>

              <select
                value={gridSnap}
                onChange={(e) => setGridSnap(Number(e.target.value))}
                className="bg-transparent text-[8.5px] font-mono font-bold text-[var(--alu-dim)] focus:text-white px-1 py-0.5 outline-none cursor-pointer"
                title="Grid Snap Pitch"
              >
                <option value={0} className="bg-[var(--bg-1)]">OFF</option>
                <option value={1} className="bg-[var(--bg-1)]">1mm</option>
                <option value={5} className="bg-[var(--bg-1)]">5mm</option>
                <option value={10} className="bg-[var(--bg-1)]">10mm</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  const nextAxis: Record<SectionAxis, SectionAxis> = { NONE: 'X', X: 'Y', Y: 'Z', Z: 'NONE' };
                  const next = nextAxis[sectionAxis];
                  setSectionAxis(next);
                  ping(
                    next === 'NONE'
                      ? t12(language, 'Section View Disabled', 'Kesit Görünümü Kapatıldı')
                      : `${t12(language, 'Section View Active', 'Kesit Görünümü Aktif')}: [${next}]`
                  );
                }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--radius-s)] text-[8.5px] font-bold border transition-all ${
                  sectionAxis !== 'NONE'
                    ? 'bg-rose-500/25 text-rose-300 border-rose-500/60 shadow-sm'
                    : 'text-[var(--alu-dim)] border-transparent hover:text-white'
                }`}
                title={t12(language, 'Toggle 3D Section Cut (X/Y/Z) [X]', '3D Kesit Görünümü Aç/Kapat (X/Y/Z) [X]')}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${sectionAxis !== 'NONE' ? 'bg-rose-400 ' : 'bg-slate-600'}`} />
                <span>{t12(language, 'SEC', 'KESİT')}</span>
                {sectionAxis !== 'NONE' && <span className="font-mono text-rose-400 font-black">[{sectionAxis}]</span>}
              </button>
            </div>

            {/* Lighting & Environment */}
            <div className="hidden xl:flex items-center gap-1 bg-[var(--bg-1)] px-1.5 py-0.5 rounded-[var(--radius-s)] border border-[var(--line)]">
              <Sun size={10} className="text-amber-400 shrink-0" />
              <select
                value={lighting}
                onChange={(e) => setLightingPreset(e.target.value)}
                className="bg-transparent text-[8.5px] font-mono text-[var(--alu-dim)] focus:text-white outline-none cursor-pointer w-[54px]"
                title="Lighting Preset"
              >
                <option value="studio" className="bg-[var(--bg-1)]">Studio</option>
                <option value="soft" className="bg-[var(--bg-1)]">Soft</option>
                <option value="workshop" className="bg-[var(--bg-1)]">Shop</option>
                <option value="off" className="bg-[var(--bg-1)]">Off</option>
              </select>
              <span className="text-[var(--line)]">/</span>
              <Palette size={10} className="text-cyan-400 shrink-0" />
              <select
                value={background}
                onChange={(e) => setBackgroundPreset(e.target.value)}
                className="bg-transparent text-[8.5px] font-mono text-[var(--alu-dim)] focus:text-white outline-none cursor-pointer w-[48px]"
                title="Background Theme"
              >
                <option value="theme" className="bg-[var(--bg-1)]">Theme</option>
                <option value="dark" className="bg-[var(--bg-1)]">Dark</option>
                <option value="navy" className="bg-[var(--bg-1)]">Navy</option>
                <option value="blueprint" className="bg-[var(--bg-1)]">Blue</option>
                <option value="light" className="bg-[var(--bg-1)]">Light</option>
              </select>
            </div>

            <div className="h-4 w-px bg-[var(--line)] mx-0.5 shrink-0" />

            {/* Camera Orientations */}
            <div className="flex items-center gap-0.5 bg-[var(--bg-1)] p-0.5 rounded-[var(--radius-s)] border border-[var(--line)]">
              <button
                type="button"
                onClick={() => triggerCameraView('iso')}
                className="px-1.5 py-0.5 rounded text-[8.5px] font-bold text-[var(--alu-dim)] hover:text-[var(--cyan)] hover:bg-white/5 transition"
                title="Isometric View [7]"
              >
                ISO
              </button>
              <button
                type="button"
                onClick={() => triggerCameraView('top')}
                className="px-1.5 py-0.5 rounded text-[8.5px] font-bold text-[var(--alu-dim)] hover:text-[var(--cyan)] hover:bg-white/5 transition"
                title="Top View [2]"
              >
                TOP
              </button>
              <button
                type="button"
                onClick={() => triggerCameraView('front')}
                className="px-1.5 py-0.5 rounded text-[8.5px] font-bold text-[var(--alu-dim)] hover:text-[var(--cyan)] hover:bg-white/5 transition"
                title="Front View [1]"
              >
                FRONT
              </button>
              <button
                type="button"
                onClick={() => triggerCameraView('right')}
                className="px-1.5 py-0.5 rounded text-[8.5px] font-bold text-[var(--alu-dim)] hover:text-[var(--cyan)] hover:bg-white/5 transition"
                title="Right View [3]"
              >
                RIGHT
              </button>
              <button
                type="button"
                onClick={() => triggerCameraView('fit')}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-[var(--bg-2)] text-[var(--cyan)] border border-[var(--cyan)]/40 hover:bg-[var(--bg-3)] transition"
                title="Fit All Parts [F]"
              >
                <Maximize2 size={9} />
                <span>FIT</span>
              </button>
            </div>

            <div className="h-4 w-px bg-[var(--line)] mx-0.5 shrink-0" />

            {/* Sidebar Viewport Layout Toggles (SolidWorks / Fusion 360 style) */}
            <div className="flex items-center gap-0.5 bg-[var(--bg-1)] p-0.5 rounded-[var(--radius-s)] border border-[var(--line)] shrink-0">
              <button
                type="button"
                onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                className={`p-1 rounded text-[8.5px] font-bold transition cursor-pointer ${
                  leftSidebarOpen
                    ? 'text-[var(--cyan)] bg-[var(--bg-2)] border border-[var(--cyan)]/40 shadow-sm'
                    : 'text-[var(--alu-dim)] hover:text-white border border-transparent'
                }`}
                title={t12(language, 'Toggle Feature Tree Sidebar [ [ ]', 'Parça & Montaj Ağacını Aç/Kapat [ [ ]')}
              >
                <PanelLeft size={11} />
              </button>
              <button
                type="button"
                onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                className={`p-1 rounded text-[8.5px] font-bold transition cursor-pointer ${
                  rightSidebarOpen
                    ? 'text-[var(--cyan)] bg-[var(--bg-2)] border border-[var(--cyan)]/40 shadow-sm'
                    : 'text-[var(--alu-dim)] hover:text-white border border-transparent'
                }`}
                title={t12(language, 'Toggle Properties Inspector Sidebar [ ] ]', 'Özellikler Panelini Aç/Kapat [ ] ]')}
              >
                <PanelRight size={11} />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (leftSidebarOpen || rightSidebarOpen) {
                    setLeftSidebarOpen(false);
                    setRightSidebarOpen(false);
                    ping(t12(language, 'Zen Mode: Full 3D Viewport [ \\ ]', 'Zen Modu: Tam Ekran 3D Görünüm [ \\ ]'));
                  } else {
                    setLeftSidebarOpen(true);
                    setRightSidebarOpen(true);
                    ping(t12(language, 'Sidebars Restored [ \\ ]', 'Yan Paneller Geri Yüklendi [ \\ ]'));
                  }
                }}
                className={`p-1 rounded text-[8.5px] font-bold transition cursor-pointer ${
                  !leftSidebarOpen && !rightSidebarOpen
                    ? 'bg-[var(--cyan)] text-black font-extrabold '
                    : 'text-[var(--alu-dim)] hover:text-white'
                }`}
                title={t12(language, 'Zen View Mode: Fullscreen 3D Canvas [ \\ ]', 'Zen Modu: Tam Ekran 3D Çizim Alanı [ \\ ]')}
              >
                <Maximize size={11} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── WORKSPACE PANELS & VIEWPORT ─── */}
      <div className="flex min-h-0 flex-1 relative">
        {/* LEFT SIDEBAR: 100% DEDICATED SOLIDWORKS/INVENTOR FEATURE & ASSEMBLY TREE */}
        {leftSidebarOpen && (
          <aside className={`flex ${treeMaximized ? 'w-[480px] 2xl:w-[540px]' : 'w-[325px] 2xl:w-[350px]'} shrink-0 flex-col border-r border-[var(--line)] bg-[var(--bg-0)] overflow-hidden text-[11px] font-mono select-none h-full transition-all duration-150`}>
            <AssemblyFeatureTree
              className="flex-1 min-h-0 h-full border-none"
              maximized={treeMaximized}
              onToggleMaximize={() => setTreeMaximized(!treeMaximized)}
              onCollapse={() => setLeftSidebarOpen(false)}
            />
          </aside>
        )}

        {/* CENTER: 3D VIEWPORT WITH TOPBAR CONTROLS & EMPTY OVERLAY */}
        <main className="relative min-w-0 flex-1 bg-[var(--bg-0)] flex flex-col">
          {/* Floating Left Sidebar Edge Tab when collapsed */}
          {!leftSidebarOpen && (
            <button
              type="button"
              onClick={() => setLeftSidebarOpen(true)}
              className="absolute top-1/2 -translate-y-1/2 left-0 z-30 flex items-center gap-1.5 bg-[var(--bg-1)]/95 hover:bg-[var(--bg-2)] text-cyan-400 border-r-2 border-y border-cyan-500/50 hover:border-cyan-400 px-1.5 py-3.5 rounded-r-md shadow-2xl text-[9px] font-mono font-black tracking-widest [writing-mode:vertical-rl] transition-all cursor-pointer group"
              title={t12(language, 'Open Model Feature Tree [ [ ]', 'Model Ağacını Aç [ [ ]')}
            >
              <ChevronRight size={13} className="text-cyan-400 -rotate-90 group-hover:scale-125 transition-transform" />
              <span>{t12(language, 'FEATURE TREE [ [ ]', 'MODEL AĞACI [ [ ]')}</span>
            </button>
          )}

          {/* Floating Right Sidebar Edge Tab when collapsed */}
          {!rightSidebarOpen && (
            <button
              type="button"
              onClick={() => setRightSidebarOpen(true)}
              className="absolute top-1/2 -translate-y-1/2 right-0 z-30 flex items-center gap-1.5 bg-[var(--bg-1)]/95 hover:bg-[var(--bg-2)] text-cyan-400 border-l-2 border-y border-cyan-500/50 hover:border-cyan-400 px-1.5 py-3.5 rounded-l-md shadow-2xl text-[9px] font-mono font-black tracking-widest [writing-mode:vertical-rl] rotate-180 transition-all cursor-pointer group"
              title={t12(language, 'Open Properties Inspector [ ] ]', 'Özellikler Panelini Aç [ ] ]')}
            >
              <ChevronLeft size={13} className="text-cyan-400 rotate-90 group-hover:scale-125 transition-transform" />
              <span>{t12(language, 'PROPERTIES [ ] ]', 'ÖZELLİKLER [ ] ]')}</span>
            </button>
          )}
          {/* ─── AUTODESK INVENTOR IN-PLACE EDIT SCOPE BREADCRUMB & RETURN BANNER ─── */}
          {(editingPart || editingSubAssemblyId) && (
            <div className="bg-[var(--bg-1)] border-b border-cyan-500/40 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 z-20 shadow-lg text-[10px] font-mono animate-in fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 text-[9px] uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>INVENTOR EDIT IN-PLACE</span>
                </span>

                {/* Breadcrumbs: Top Assembly > Subassembly > Part */}
                <div className="flex items-center gap-1.5 text-slate-300 font-bold truncate">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPartId(null);
                      setEditingSubAssemblyId(null);
                    }}
                    className="hover:text-cyan-300 transition hover:underline cursor-pointer"
                    title={t12(language, 'Click to return to Main Assembly', 'Ana Montaja dönmek için tıklayın')}
                  >
                    📦 {projectName || t12(language, 'Main Assembly', 'Ana Montaj')}
                  </button>
                  <span className="text-slate-500">/</span>
                  {editingSubAssy && (
                    <>
                      <span className="text-emerald-400">📁 {editingSubAssy.name}</span>
                      <span className="text-slate-500">/</span>
                    </>
                  )}
                  {editingPart && (
                    <span className="text-white bg-cyan-500/25 px-1.5 py-0.5 rounded border border-cyan-500/40 truncate">
                      ⚙️ {editingPart.name}
                    </span>
                  )}
                </div>

                <span className="hidden xl:inline text-[8.5px] text-slate-400 italic">
                  ({t12(language, 'Other assembly parts are ghosted as reference geometry', 'Diğer montaj parçaları referans geometri olarak yarı saydam gösteriliyor')})
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Edit Part Sketch Shortcut */}
                {editingPart && (
                  <button
                    type="button"
                    onClick={() => startEditPartSketch(editingPart.id)}
                    className="px-2 py-1 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-cyan-500/30 text-cyan-300 font-bold text-[9px] flex items-center gap-1 transition shadow-sm cursor-pointer"
                    title={t12(language, 'Edit Part 2D Sketch Profile', 'Parçanın 2D Taban Çizimini Düzenle')}
                  >
                    <Pencil size={11} />
                    <span>{t12(language, 'Edit Sketch', 'Çizimi Düzenle')}</span>
                  </button>
                )}

                {/* Return / Finish Edit Button */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingPartId(null);
                    setEditingSubAssemblyId(null);
                  }}
                  className="px-3 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[9.5px] flex items-center gap-1.5 transition shadow-lg active:scale-95 cursor-pointer"
                  title={t12(language, 'Finish editing and return to assembly (Esc)', 'Parça düzenlemeyi bitir ve montaja dön (Esc)')}
                >
                  <Check size={13} strokeWidth={3} />
                  <span>{t12(language, 'Return to Assembly', 'Montaja Dön (Bitir)')}</span>
                  <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-black/25 text-[8px] font-mono">Esc</kbd>
                </button>
              </div>
            </div>
          )}

          {/* ─── SOLIDWORKS ASSEMBLY MATE MODE BREADCRUMB & HUD BANNER ─── */}
          {tool === 'mate' && (
            <div className="bg-[var(--bg-1)] border-b border-cyan-500/50 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 z-20 shadow-lg text-[10px] font-mono animate-in fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--cyan)] text-black font-black text-[9px] uppercase tracking-wider shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                  <span>{t12(language, 'MATE MODE', 'MONTAJLAMA MODU')}</span>
                </span>

                {/* Step 1 & Step 2 visual breadcrumb pills */}
                <div className="flex items-center gap-1.5 text-slate-300 font-bold truncate">
                  {/* Entity 1 */}
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] ${
                    activeMateDraft?.partAId && activeMateDraft?.featureAId
                      ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200'
                      : 'bg-black/40 border-cyan-500/40 text-cyan-300 animate-pulse'
                  }`}>
                    <span>[1]</span>
                    <span className="truncate max-w-[200px]" title={activeMateDraft?.featureAName || undefined}>
                      {activeMateDraft?.partAId
                        ? activeMateDraft.featureAName || (activeMateDraft.featureAId ? `${parts.find(p => p.id === activeMateDraft.partAId)?.name || 'Parça A'} ▸ ${activeMateDraft.featureAId}` : `${parts.find(p => p.id === activeMateDraft.partAId)?.name || 'Parça A'} (${t12(language, 'Pick Face/Hole', 'Yüzey/Delik Seçin')})`)
                        : t12(language, 'Click 1st face/hole in 3D', '3D modelden 1. yüzeyi/deliği tıklayın')}
                    </span>
                    {activeMateDraft?.partAId && (
                      <button
                        type="button"
                        onClick={() => updateMateDraft({ partAId: null, featureAId: null, featureAName: null })}
                        className="ml-1 text-slate-400 hover:text-white"
                        title={t12(language, 'Clear selection', 'Seçimi temizle')}
                      >
                        ×
                      </button>
                    )}
                  </span>

                  <span className="text-slate-500">↔</span>

                  {/* Entity 2 */}
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] ${
                    activeMateDraft?.partBId && activeMateDraft?.featureBId
                      ? 'bg-emerald-950/60 border-emerald-400 text-emerald-200'
                      : 'bg-black/40 border-emerald-500/40 text-emerald-300 animate-pulse'
                  }`}>
                    <span>[2]</span>
                    <span className="truncate max-w-[200px]" title={activeMateDraft?.featureBName || undefined}>
                      {activeMateDraft?.partBId
                        ? activeMateDraft.featureBName || (activeMateDraft.featureBId ? `${parts.find(p => p.id === activeMateDraft.partBId)?.name || 'Parça B'} ▸ ${activeMateDraft.featureBId}` : `${parts.find(p => p.id === activeMateDraft.partBId)?.name || 'Parça B'} (${t12(language, 'Pick Face/Hole', 'Yüzey/Delik Seçin')})`)
                        : t12(language, 'Click 2nd face/hole in 3D', '3D modelden 2. yüzeyi/deliği tıklayın')}
                    </span>
                    {activeMateDraft?.partBId && (
                      <button
                        type="button"
                        onClick={() => updateMateDraft({ partBId: null, featureBId: null, featureBName: null })}
                        className="ml-1 text-slate-400 hover:text-white"
                        title={t12(language, 'Clear selection', 'Seçimi temizle')}
                      >
                        ×
                      </button>
                    )}
                  </span>
                </div>
              </div>

              {/* Surface-Adaptive Mate Selector */}
              {activeMateDraft?.partAId && activeMateDraft?.partBId && (() => {
                const partA = parts.find((p) => p.id === activeMateDraft.partAId);
                const partB = parts.find((p) => p.id === activeMateDraft.partBId);
                const featA = partA && activeMateDraft.featureAId ? extractPartFeatures(partA, true).find((f) => f.id === activeMateDraft.featureAId) : null;
                const featB = partB && activeMateDraft.featureBId ? extractPartFeatures(partB, true).find((f) => f.id === activeMateDraft.featureBId) : null;
                const kindsInfo = getValidMateKinds(featA, featB);

                return (
                  <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-lg border border-cyan-500/40">
                    <span className="text-[9px] text-cyan-300 font-bold uppercase tracking-wider mr-1">
                      {t12(language, 'MATE TYPE:', 'MONTAJ TÜRÜ:')}
                    </span>
                    {([
                      { kind: 'concentric', label: 'Eşmerkezli', icon: '◎' },
                      { kind: 'coincident', label: 'Çakışık', icon: '⫽' },
                      { kind: 'tangent', label: 'Teğet', icon: '⤢' },
                      { kind: 'distance', label: 'Mesafe', icon: '⇥' },
                      { kind: 'parallel', label: 'Paralel', icon: '⏸' },
                      { kind: 'perpendicular', label: 'Dik', icon: '⊥' },
                      { kind: 'end-to-slot', label: 'Kanala Montaj', icon: '⤵' },
                    ] as const).map(({ kind, label, icon }) => {
                      const isCompat = kindsInfo.compatible.includes(kind);
                      const isRec = kindsInfo.recommended === kind;
                      const isActive = (activeMateDraft.kind || kindsInfo.recommended) === kind;
                      if (!isCompat) return null;
                      return (
                        <button
                          key={kind}
                          type="button"
                          onClick={() => updateMateDraft({ kind })}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-sm font-black'
                              : isRec
                              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-400 hover:bg-cyan-900/80'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800'
                          }`}
                          title={isRec ? `${label} (Önerilen / Yüzeye Uygun)` : label}
                        >
                          <span>{icon}</span>
                          <span>{label}</span>
                          {isRec && <span className="text-[7.5px] opacity-80">★</span>}
                        </button>
                      );
                    })}

                    {activeMateDraft.kind === 'distance' && (
                      <div className="flex items-center gap-1 ml-1.5 pl-1.5 border-l border-slate-700">
                        <span className="text-[9px] text-slate-400">Offset:</span>
                        <input
                          type="number"
                          value={activeMateDraft.offset ?? 0}
                          onChange={(e) => updateMateDraft({ offset: parseFloat(e.target.value) || 0 })}
                          className="w-14 px-1 py-0.5 bg-black/80 border border-slate-600 rounded text-cyan-300 text-[10px] font-mono text-center"
                        />
                        <span className="text-[9px] text-slate-400">mm</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => updateMateDraft({ flip: !activeMateDraft.flip })}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ml-1 ${
                        activeMateDraft.flip
                          ? 'bg-amber-500/30 text-amber-300 border-amber-500/60'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                      title={t12(language, 'Flip Mate Alignment Direction', 'Hizalama Yönünü Çevir')}
                    >
                      ⇄ {t12(language, 'Flip', 'Çevir')}
                    </button>
                  </div>
                );
              })()}

              {/* Actions: Apply & Exit */}
              <div className="flex items-center gap-2">
                {activeMateDraft?.partAId && activeMateDraft?.partBId && (
                  <button
                    type="button"
                    onClick={() => {
                      const success = commitMateDraft();
                      if (success) {
                        ping(t12(language, '✔ Mate applied & solved', '✔ Montaj ilişkisi uygulandı'));
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-[var(--ok)] hover:bg-[var(--ok)] text-black font-black text-[9px] uppercase tracking-wider shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <Check size={11} />
                    <span>{t12(language, '✔ Apply Mate [Enter]', '✔ Montajı Onayla [Enter]')}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => closeMateModal()}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-slate-300 hover:text-white border border-[var(--line)] text-[9px] font-bold transition cursor-pointer"
                  title="Esc"
                >
                  <X size={11} />
                  <span>{t12(language, 'Exit Mate Mode [Esc]', 'Montaj Modundan Çık [Esc]')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Canvas 3D */}
          <div className="flex-1 relative">
            {(tool === 'sketch-add' || tool === 'sketch-cut' || tool === 'sketch-loft') && (
              <div className="absolute top-3 inset-x-4 z-30 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl border border-cyan-500/40 bg-slate-950/95 shadow-2xl animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 font-mono text-xs font-black">
                    ✏️
                  </span>
                  <div>
                    <div className="text-xs font-black text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <span>{t12(language, `SKETCH: ${pendingOp.toUpperCase()}`, `ÇİZİM: ${pendingOp.toUpperCase()}`)}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {sketchPoints.length} {t12(language, 'pts', 'nokta')} · {sketchClosed ? (t12(language, '✓ Closed', '✓ Profil Kapalı')) : (t12(language, 'Click grid to sketch', 'Çizim için ızgaraya tıklayın'))}
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
                    title={t12(language, 'Freeform Polyline', 'Serbest Çizgi (Polyline)')}
                  >
                    📏 {t12(language, 'Line', 'Çizgi')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSketchShapeMode('circle')}
                    className={`px-2 py-1 rounded-lg font-mono text-[10px] font-bold transition-all ${
                      sketchShapeMode === 'circle'
                        ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={t12(language, 'Circle (Click Center)', 'Daire Çizimi (Merkeze Tıklayın)')}
                  >
                    ⭕ {t12(language, 'Circle', 'Daire')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSketchShapeMode('rect')}
                    className={`px-2 py-1 rounded-lg font-mono text-[10px] font-bold transition-all ${
                      sketchShapeMode === 'rect'
                        ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={t12(language, 'Rectangle (2 Corners)', 'Dikdörtgen (2 Köşe Belirleyin)')}
                  >
                    ⬛ {t12(language, 'Rect', 'Dikdörtgen')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSketchShapeMode('polygon')}
                    className={`px-2 py-1 rounded-lg font-mono text-[10px] font-bold transition-all ${
                      sketchShapeMode === 'polygon'
                        ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={t12(language, 'Hexagon / Polygon', 'Altıgen / Çokgen (Merkeze Tıklayın)')}
                  >
                    🔷 {t12(language, 'Polygon', 'Çokgen')}
                  </button>
                </div>

                {/* ─── GEOMETRIC CONSTRAINT SNAPPING TOGGLES ─── */}
                <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 font-mono text-[9px]">
                  <span className="text-[8px] text-slate-500 uppercase px-1 font-bold">{t12(language, 'CONSTRAINTS:', 'KISITLAR:')}</span>
                  
                  <button
                    type="button"
                    onClick={() => toggleConstraint('perp')}
                    className={`px-1.5 py-1 rounded-md font-bold transition-all border ${
                      constraintPerpendicular
                        ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300'
                        : 'bg-white/5 border-transparent text-slate-400 hover:text-white'
                    }`}
                    title={t12(language, 'Perpendicular Constraint (90° Snap)', 'Diklik Kısıtı (90° Yakalama)')}
                  >
                    ⊥ {t12(language, 'Perp', 'Diklik')}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleConstraint('parallel')}
                    className={`px-1.5 py-1 rounded-md font-bold transition-all border ${
                      constraintParallel
                        ? 'bg-cyan-500/25 border-cyan-500/50 text-cyan-300'
                        : 'bg-white/5 border-transparent text-slate-400 hover:text-white'
                    }`}
                    title={t12(language, 'Parallel Constraint Snap', 'Paralellik Kısıtı (0°/180° Yakalama)')}
                  >
                    ∥ {t12(language, 'Parallel', 'Paralel')}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleConstraint('equal')}
                    className={`px-1.5 py-1 rounded-md font-bold transition-all border ${
                      constraintEqual
                        ? 'bg-amber-500/25 border-amber-500/50 text-amber-300'
                        : 'bg-white/5 border-transparent text-slate-400 hover:text-white'
                    }`}
                    title={t12(language, 'Equal Length Constraint Snap', 'Eşitlik Kısıtı (Önceki Çizgi Uzunluğuna Eşitleme)')}
                  >
                    = {t12(language, 'Equal', 'Eşitlik')}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleConstraint('ortho')}
                    className={`px-1.5 py-1 rounded-md font-bold transition-all border ${
                      constraintOrtho
                        ? 'bg-purple-500/25 border-purple-500/50 text-purple-300'
                        : 'bg-white/5 border-transparent text-slate-400 hover:text-white'
                    }`}
                    title={t12(language, 'Ortho Lock (0°/90°/180°/270°)', 'Ortho Modu (Yatay/Dikey 90° Kilidi)')}
                  >
                    ⟷ Ortho
                  </button>
                </div>

                {/* ─── CAMERA VIEW ALIGNMENT PRESETS ─── */}
                <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 font-mono text-[9px]">
                  <button
                    type="button"
                    onClick={() => triggerCameraView('top')}
                    className="px-2 py-1 rounded-md font-bold bg-white/5 hover:bg-white/15 text-cyan-300 border border-cyan-500/30 transition flex items-center gap-1"
                    title={t12(language, 'Look Normal to Sketch Plane (Top View)', 'Çizim Düzlemine Dik Bak (Üst Görünüm)')}
                  >
                    👁 {t12(language, 'Top View', 'Üstten (2D)')}
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerCameraView('iso')}
                    className="px-2 py-1 rounded-md font-bold bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10 transition flex items-center gap-1"
                    title={t12(language, 'Isometric 3D View', 'İzometrik 3D Görünüm')}
                  >
                    🧊 {t12(language, '3D View', '3D Görünüm')}
                  </button>
                </div>

                {/* ─── PARAMETERS & ACTIONS ─── */}
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  {sketchShapeMode === 'circle' && (
                    <label className="flex items-center gap-1.5 bg-black/60 border border-white/10 px-2 py-1 rounded-xl text-slate-300">
                      <span className="text-[9px] uppercase text-cyan-400 font-bold">{t12(language, 'Radius', 'Yarıçap')}:</span>
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
                      <span className="text-[9px] uppercase text-cyan-400 font-bold">{t12(language, 'Depth', 'Kalınlık')}:</span>
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
                      <span className="text-[9px] uppercase text-cyan-400 font-bold">{t12(language, 'Angle', 'Açı')}:</span>
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
                      <span className="text-[9px] uppercase text-cyan-400 font-bold">{t12(language, 'Height', 'Yükseklik')}:</span>
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
                    {t12(language, 'Undo', 'Geri Al')}
                  </button>

                  {!sketchClosed && sketchPoints.length >= 3 && (
                    <button
                      type="button"
                      onClick={closeSketch}
                      className="px-2 py-1 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold active:scale-95 text-[10px]"
                    >
                      {t12(language, 'Close Profile', 'Profili Kapat')}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!sketchClosed) closeSketch();
                      if (selected && sketchPoints.length >= 3 && !editingPartId) {
                        openExtrudeDialog();
                      } else {
                        const id = commitExtrude();
                        if (id) {
                          ping(
                            editingPartId
                              ? t12(language, '✨ Part Sketch Updated!', '✨ Parça Çizimi Güncellendi!')
                              : pendingOp === 'cut'
                              ? t12(language, '✂️ Cut applied to solid!', '✂️ Kesim katı modele uygulandı!')
                              : t12(language, '✨ Solid Model Generated!', '✨ Katı Model Oluşturuldu!')
                          );
                        } else {
                          ping(t12(language, 'At least 3 points required', 'En az 3 nokta gereklidir'));
                        }
                      }
                    }}
                    disabled={sketchPoints.length < 3}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-white font-black uppercase text-[11px] shadow-lg disabled:opacity-40 active:scale-95 transition-transform ${
                      editingPartId
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white '
                        : pendingOp === 'cut'
                        ? 'bg-gradient-to-r from-rose-500 to-red-600 '
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 '
                    }`}
                  >
                    {editingPartId ? (
                      <Check size={13} className="stroke-[3]" />
                    ) : pendingOp === 'cut' ? (
                      <Scissors size={13} className="stroke-[2.5]" />
                    ) : (
                      <Check size={13} className="stroke-[3]" />
                    )}
                    <span>
                      {editingPartId
                        ? t12(language, 'Save Changes', 'Değişiklikleri Kaydet')
                        : pendingOp === 'cut'
                        ? t12(language, 'Apply Cut', 'Kesimi Uygula')
                        : t12(language, 'Generate Solid', 'Katı Oluştur')}
                    </span>
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

            {/* Center: Interactive CAD Origin & Quick-Start Workspace Launcher (AREA 2: CAD LAUNCH RETICLE) */}
            {parts.length === 0 && !isSketchMode && (
              <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none z-15">
                <div className="pointer-events-auto max-w-lg w-full rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)]/98 p-5 shadow-2xl font-mono relative animate-in fade-in zoom-in-95 duration-200">
                  {/* Technical Viewfinder Corner Reticles */}
                  <span className="absolute top-2 left-2.5 text-[var(--cyan)]/40 text-[9px] select-none font-mono">⌜ WCS:ORIGIN</span>
                  <span className="absolute top-2 right-2.5 text-[var(--cyan)]/40 text-[9px] select-none font-mono">ISO 5459 ⌝</span>
                  <span className="absolute bottom-2 left-2.5 text-[var(--cyan)]/40 text-[9px] select-none font-mono">⌞ X:0.00 Y:0.00</span>
                  <span className="absolute bottom-2 right-2.5 text-[var(--cyan)]/40 text-[9px] select-none font-mono">Z:0.00 ⌟</span>

                  {/* Technical Header with Origin Reticle Telemetry */}
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-3.5 mt-1">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-s)] bg-[var(--bg-2)] text-[var(--cyan)] border border-[var(--line)] shadow-inner">
                        <Compass size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-black uppercase tracking-wider text-white">
                            ALUCALC CAD WORKSPACE · V4.2
                          </h3>
                          <span className="flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded bg-[var(--bg-2)] text-[var(--ok)] border border-[var(--ok)]/30 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)] animate-pulse" />
                            ONLINE
                          </span>
                        </div>
                        <p className="text-[9px] text-[var(--alu-dim)]">
                          DATUM WCS [ 0.00, 0.00, 0.00 ] mm · ISO 5459 · 1:1 METRIC
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 4 Quick-Action Interactive Launcher Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3.5">
                    {/* Card 1: Import CAD File */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="group text-left p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] hover:border-[var(--cyan)]/60 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-s)] bg-[var(--bg-0)] text-[var(--cyan)] border border-[var(--line)] group-hover:border-[var(--cyan)]/50">
                          <Upload size={13} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10.5px] font-bold text-white group-hover:text-[var(--cyan)] transition truncate">
                            {tStudio.importCad}
                          </div>
                          <div className="text-[8px] text-[var(--alu-dim)]">
                            STEP, IGES, STL, OBJ, DXF
                          </div>
                        </div>
                      </div>
                      <span className="text-[8.5px] font-bold text-[var(--cyan)] self-end">
                        OPEN CAD →
                      </span>
                    </button>

                    {/* Card 2: Wellste T-Slot Extruder */}
                    <button
                      type="button"
                      onClick={() => {
                        addTSlotPart('wellste-4040', 500);
                        ping(t12(language, 'Wellste 4040 T-Slot added (500 mm)', 'Wellste 4040 T-Kanal profil eklendi (500 mm)'));
                      }}
                      className="group text-left p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] hover:border-amber-400/60 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-s)] bg-[var(--bg-0)] text-amber-400 border border-[var(--line)] group-hover:border-amber-400/50">
                          <Boxes size={13} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10.5px] font-bold text-white group-hover:text-amber-400 transition truncate">
                            {t12(language, 'Wellste® T-Slot', 'Wellste® T-Kanal')}
                          </div>
                          <div className="text-[8px] text-[var(--alu-dim)]">
                            40×40 mm Profile · Slot 8
                          </div>
                        </div>
                      </div>
                      <span className="text-[8.5px] font-bold text-amber-400 self-end">
                        EXTRUDE →
                      </span>
                    </button>

                    {/* Card 3: Start 2D Sketch Extrude */}
                    <button
                      type="button"
                      onClick={() => {
                        setTool('sketch-add');
                        ping(t12(language, '✏️ 2D Sketch Extrude plane active', '✏️ 2D Çizim ve Ekstrüzyon düzlemi açıldı'));
                      }}
                      className="group text-left p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] hover:border-[var(--ok)]/60 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-s)] bg-[var(--bg-0)] text-[var(--ok)] border border-[var(--line)] group-hover:border-[var(--ok)]/50">
                          <Pencil size={13} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10.5px] font-bold text-white group-hover:text-[var(--ok)] transition truncate">
                            {t12(language, '2D Sketch Extrude', '2D Çizim Katı')}
                          </div>
                          <div className="text-[8px] text-[var(--alu-dim)]">
                            Parametric XY Profile Sketch
                          </div>
                        </div>
                      </div>
                      <span className="text-[8.5px] font-bold text-[var(--ok)] self-end">
                        SKETCH →
                      </span>
                    </button>

                    {/* Card 4: Insert Default Precision Block */}
                    <button
                      type="button"
                      onClick={() => handleAddKind('box')}
                      className="group text-left p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] hover:border-purple-400/60 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-s)] bg-[var(--bg-0)] text-purple-400 border border-[var(--line)] group-hover:border-purple-400/50">
                          <Box size={13} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10.5px] font-bold text-white group-hover:text-purple-400 transition truncate">
                            {t12(language, '6061 Billet Solid', '6061 Kütük Parça')}
                          </div>
                          <div className="text-[8px] text-[var(--alu-dim)]">
                            80 × 40 × 20 mm Solid Billet
                          </div>
                        </div>
                      </div>
                      <span className="text-[8.5px] font-bold text-purple-400 self-end">
                        INSERT →
                      </span>
                    </button>
                  </div>

                  {/* Engine Specs Bar */}
                  <div className="border-t border-[var(--line)] pt-2 pb-2 flex items-center justify-between text-[8px] text-[var(--alu-dim)]">
                    <span className="flex items-center gap-1">
                      <Cpu size={10} className="text-[var(--cyan)]" />
                      <span>ENGINE: THREE.JS R164 + WASM BREP</span>
                    </span>
                    <span className="text-[var(--line)]">|</span>
                    <span>SCALE: 1:1 METRIC MM</span>
                    <span className="text-[var(--line)]">|</span>
                    <span>TOL: ISO 2768-m</span>
                  </div>

                  {/* Hotkey Guide Telemetry Ribbon */}
                  <div className="bg-[var(--bg-0)] rounded-[var(--radius-s)] p-2 border border-[var(--line)] flex flex-wrap items-center justify-between gap-1 text-[8.5px] text-[var(--alu-dim)]">
                    <span><strong className="text-white">[V]</strong> Select</span>
                    <span><strong className="text-white">[G]</strong> Move</span>
                    <span><strong className="text-white">[R]</strong> Rotate</span>
                    <span><strong className="text-white">[S]</strong> Scale</span>
                    <span><strong className="text-white">[M]</strong> Caliper</span>
                    <span><strong className="text-white">[X]</strong> {t12(language, 'Section', 'Kesit')}</span>
                    <span><strong className="text-white">[F]</strong> Fit Extents</span>
                    <span><strong className="text-white">[Right-Click]</strong> 3D Menu</span>
                  </div>
                </div>
              </div>
            )}

            {/* Industrial Bottom Telemetry & Status Strip */}
            <div className="pointer-events-auto absolute bottom-2 inset-x-3 z-15 flex flex-wrap items-center justify-between gap-2 px-3 py-1 rounded-[4px] bg-[var(--bg-1)]/95 border border-[var(--line)] font-mono text-[9.5px] text-[var(--alu-dim)] select-none shadow-lg">
              {/* Left Telemetry: Coordinates & Part Details */}
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">
                  XYZ [
                  <span className="text-rose-400 font-black">
                    {selected ? selected.position.x : '0.00'}
                  </span>
                  ,{' '}
                  <span className="text-emerald-400 font-black">
                    {selected ? selected.position.y : '0.00'}
                  </span>
                  ,{' '}
                  <span className="text-blue-400 font-black">
                    {selected ? selected.position.z : '0.00'}
                  </span>
                  ] mm
                </span>

                {selectedDimensions && (
                  <>
                    <span className="text-[#334155]">|</span>
                    <span className="text-[var(--cyan)] font-bold">{selectedDimensions}</span>
                  </>
                )}

                <span className="text-[#334155]">|</span>
                <span>TOL: <span className="text-slate-300 font-bold">{drawingTolerance}</span></span>
                <span className="text-[#334155]">|</span>
                <span>GRID: <span className="text-slate-300 font-bold">{gridSnap > 0 ? `${gridSnap}mm SNAP` : 'FREE'}</span></span>
              </div>

              {/* Center Telemetry: Scene Assembly Stats */}
              <div className="hidden sm:flex items-center gap-2">
                <span>PARTS: <span className="text-white font-bold">{parts.length}</span></span>
                <span className="text-[#334155]">|</span>
                <span>MASS: <span className="text-[var(--ok)] font-bold">{massProps.massKg.toFixed(3)} kg</span></span>
                <span className="text-[#334155]">|</span>
                <span>ACTIVE: <span className="text-white font-bold">{selected ? selected.name : 'NONE'}</span></span>
                <span className="text-[#334155]">|</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextAxis: Record<SectionAxis, SectionAxis> = { NONE: 'X', X: 'Y', Y: 'Z', Z: 'NONE' };
                    const next = nextAxis[sectionAxis];
                    setSectionAxis(next);
                    ping(
                      next === 'NONE'
                        ? t12(language, 'Section View Disabled', 'Kesit Görünümü Kapatıldı')
                        : `${t12(language, 'Section View Active', 'Kesit Görünümü Aktif')}: [${next}]`
                    );
                  }}
                  className={`text-[9.5px] font-bold flex items-center gap-1 transition-colors ${
                    sectionAxis !== 'NONE' ? 'text-rose-400 hover:text-rose-300' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={t12(language, 'Toggle 3D Section View [X]', '3D Kesit Görünümünü Değiştir [X]')}
                >
                  <Scissors size={10} className={sectionAxis !== 'NONE' ? 'text-rose-400' : 'text-slate-500'} />
                  <span>SEC: {sectionAxis === 'NONE' ? 'OFF' : `${sectionAxis} (${sectionOffset}mm)`}</span>
                </button>
              </div>

              {/* Right Telemetry: Navigation Hints & Core Engine Status */}
              <div className="flex items-center gap-2">
                <span className="hidden md:inline text-slate-500">
                  [🖱️ Orbit] [Shift+🖱️ Pan] [Scroll Zoom] [Right-Click Menu]
                </span>
                <span className="text-[#334155] hidden md:inline">|</span>
                <div className="flex items-center gap-1.5 bg-[var(--bg-0)] px-2 py-0.5 rounded border border-[var(--line)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)] animate-pulse" />
                  <span className="text-[8.5px] font-bold text-slate-300 tracking-wider">ALUCALC CAD · 60 FPS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Toast Notification */}
          {toast && (
            <div className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-xl border border-cyan-500/30 bg-black/80 px-4 py-2 text-[11px] font-bold text-cyan-200 shadow-2xl">
              {toast}
            </div>
          )}
        </main>

        {/* RIGHT SIDEBAR: Selected Part Inspector & Workspace Telemetry (AREA 5: CNC PROPERTY INSPECTOR) */}
        {rightSidebarOpen && (
          <aside className="flex w-[284px] 2xl:w-[320px] shrink-0 flex-col border-l border-[var(--line)] bg-[var(--bg-1)] text-[11px] font-mono select-none overflow-hidden transition-all duration-150">
            {/* Inspector Header with Title and Collapse Button */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--line)] bg-[var(--bg-0)] shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sliders size={12} className="text-[var(--cyan)] shrink-0" />
                <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-[var(--alu-dim)] truncate">
                  // {t12(language, 'PROPERTIES & INSPECTOR', 'ÖZELLİKLER & PARAMETRELER')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRightSidebarOpen(false)}
                className="p-1 text-slate-400 hover:text-[var(--cyan)] hover:bg-white/10 rounded transition-colors cursor-pointer"
                title={t12(language, 'Collapse Properties [ ] ]', 'Özellikler Panelini Gizle [ ] ]')}
              >
                <ChevronRight size={12} />
              </button>
            </div>
            {selected ? (
            <div className="flex-1 space-y-3 overflow-y-auto p-3 custom-scrollbar">
              {/* 1. Part Identity & Sub-Assembly Card */}
              <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-[var(--cyan)] flex items-center gap-1">
                    <Target size={10} />
                    <span>// PART IDENTIFIER</span>
                  </span>
                  <span className="text-[7.5px] font-mono px-1 py-0.2 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--alu-dim)]">
                    {selected.id.slice(0, 8)}
                  </span>
                </div>
                <input
                  value={selected.name}
                  onChange={(e) => setSelectedName(e.target.value)}
                  className="w-full rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] px-2 py-1 text-[11.5px] font-bold text-white outline-none focus:border-[var(--cyan)] transition-colors"
                />
                
                {/* Sub-Assembly Assignment Dropdown */}
                <div className="flex items-center justify-between text-[8.5px] pt-0.5 border-t border-white/5">
                  <span className="text-[var(--alu-dim)] font-bold uppercase flex items-center gap-1">
                    <Folder size={10} className="text-emerald-400" />
                    <span>{t12(language, 'SUB-ASSEMBLY:', 'MONTAJ GRUBU:')}</span>
                  </span>
                  <select
                    value={selected.subAssemblyId || ''}
                    onChange={(e) => movePartToSubAssembly(selected.id, e.target.value || null)}
                    className="bg-[var(--bg-2)] border border-emerald-500/30 text-emerald-300 rounded px-1.5 py-0.5 font-bold outline-none text-[8.5px] max-w-[150px] truncate"
                  >
                    <option value="">📦 {t12(language, 'Root (Main Assembly)', 'Kök Montaj (Ana)')}</option>
                    {subAssemblies.map((sa) => (
                      <option key={sa.id} value={sa.id}>📁 {sa.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between text-[9px] pt-0.5">
                  <span className="text-[var(--alu-dim)] capitalize">{getDesignKindLabel(selected.kind, language)}</span>
                  <span className="text-[8px] px-1.5 py-0.2 rounded bg-[var(--cyan)]/10 text-[var(--cyan)] border border-[var(--cyan)]/20 font-bold uppercase">
                    {activeMaterial.name.split(' ')[0]}
                  </span>
                </div>
              </div>

              {/* 2. Color & Material Palette */}
              <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-1.5">
                <p className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-[var(--alu-dim)]">
                  // ANODIZED COLOR FINISH
                </p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {PART_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`h-5 w-5 rounded-[var(--radius-s)] border transition-all ${
                        selected.color === c
                          ? 'scale-110 border-white ring-1 ring-[var(--cyan)]'
                          : 'border-white/20 hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      style={{ background: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              {/* 3. 📐 BASE SKETCH & PROFILE FEATURE (SolidWorks FeatureManager) */}
              <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-[var(--cyan)] flex items-center gap-1">
                    <Pencil size={10} />
                    <span>// {t12(language, 'BASE SKETCH PROFILE', 'TABAN ÇİZİM PROFİLİ')}</span>
                  </span>
                  <span className="text-[7.5px] font-mono px-1 py-0.2 rounded bg-[var(--bg-2)] border border-[var(--line)] text-slate-300">
                    {selected.outer ? `${selected.outer.length} Pts` : `${selected.kind}`}
                  </span>
                </div>
                <p className="text-[8.5px] text-[var(--alu-dim)] leading-tight">
                  {t12(
                    language,
                    'Edit 2D sketch profile on the 3D plane. Committing updates the solid in place.',
                    '2D çizim profilini 3D düzlemde görsel olarak düzenleyin. Katı doğrudan güncellenir.'
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    startEditPartSketch(selected.id);
                    ping(t12(language, '✏️ Sketch edit active: Modify points in 3D & click Commit', '✏️ Çizim düzenleme aktif: 3D düzlemde düzenleyin ve Onayla butonuna basın'));
                  }}
                  className="w-full py-2 rounded-[var(--radius-s)] bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 border border-[var(--cyan)]/50 text-[var(--cyan)] font-bold text-[9.5px] flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Pencil size={11} />
                  <span>{t12(language, '✏️ Edit Base Sketch in 3D', '✏️ Taban Çizimini Görsel Düzenle')}</span>
                </button>
              </div>

              {/* 4. Parametric Solid Parameters */}
              <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-[var(--alu-dim)]">
                    // {selected.kind === 'profile' ? (t12(language, 'SOLID PARAMETERS', 'KATI PARAMETRELERİ')) : (t12(language, 'DIMENSIONS (mm)', 'BOYUTLAR (mm)'))}
                  </span>
                  <span className="text-[8px] text-[var(--cyan)]">1:1 SCALE</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(selected.params).map(([k, v]) => (
                    <label key={k} className="block min-w-0 bg-[var(--bg-2)] p-1.5 rounded-[var(--radius-s)] border border-[var(--line)]">
                      <span className="mb-0.5 flex justify-between text-[7.5px] font-mono font-bold uppercase tracking-wider text-[var(--alu-dim)]">
                        {k === 'revolveAngle' ? (t12(language, 'Rev Angle (°)', 'Dönme Açısı (°)'))
                          : k === 'loftHeight' ? (t12(language, 'Loft Height', 'Loft Yükseklik'))
                          : k === 'loftScale' ? (t12(language, 'Top Scale (%)', 'Tepe Ölçeği (%)'))
                          : k === 'loftTwist' ? (t12(language, 'Twist Angle (°)', 'Büküm Açısı (°)'))
                          : k === 'extrudeDepth' ? (t12(language, 'Extrude (mm)', 'Ekstrüzyon (mm)'))
                          : k}
                      </span>
                      <input
                        type="number"
                        value={v}
                        onChange={(e) => {
                          const num = Number(e.target.value);
                          updateSelectedParams({ [k]: num });
                          if (selected && (k === 'width' || k === 'height' || k === 'depth' || k === 'length')) {
                            const newParams = { ...selected.params, [k]: num };
                            const w = newParams.width ?? 40;
                            const h = newParams.height ?? 40;
                            const d = newParams.depth ?? 20;
                            const updatedName = selected.name.replace(
                              /\b\d+(?:\.\d+)?\s*[xX×]\s*\d+(?:\.\d+)?\s*[xX×]\s*\d+(?:\.\d+)?\b/,
                              `${w}x${h}x${d}`
                            );
                            if (updatedName !== selected.name) {
                              useDesignStore.getState().updatePart(selected.id, { name: updatedName });
                            }
                          }
                        }}
                        className="w-full rounded-[2px] border border-[var(--line)] bg-[var(--bg-0)] px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--cyan)] font-bold outline-none focus:border-[var(--cyan)]"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* 5. ✂️ APPLIED SURFACE CUTS & POCKETS (Visual Interactive Editor) */}
              <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                    <Scissors size={10} />
                    <span>// {t12(language, 'APPLIED CUTS', 'UYGULANAN KESİMLER')}</span>
                  </span>
                  <span className="text-[7.5px] font-mono px-1 py-0.2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold">
                    {selected.cuts?.length || 0}
                  </span>
                </div>

                {selected.cuts && selected.cuts.length > 0 ? (
                  <div className="space-y-1.5">
                    {selected.cuts.map((c) => {
                      const isExpanded = expandedCutId === c.id;
                      return (
                        <div
                          key={c.id}
                          className={`rounded-[var(--radius-s)] border transition-all ${
                            isExpanded ? 'border-rose-400 bg-rose-950/25 p-1.5' : 'border-white/10 bg-[var(--bg-2)] p-1'
                          }`}
                        >
                          {/* Cut Header Summary Row */}
                          <div className="flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => setExpandedCutId(isExpanded ? null : c.id)}
                              className="flex items-center gap-1 flex-1 min-w-0 text-left"
                            >
                              {isExpanded ? <ChevronDown size={10} className="text-rose-400" /> : <ChevronRight size={10} className="text-slate-400" />}
                              <span className="font-bold text-rose-200 truncate text-[9px]">
                                {c.type === 'rect' ? 'Havuz' : c.type === 'circle' ? 'Dairesel' : 'Slot'}
                              </span>
                              <span className="text-[7.5px] text-slate-400">
                                ({c.face} · d={c.depth}mm)
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCut(c.id)}
                              className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition"
                              title={t12(language, 'Delete Cut', 'Kesimi Sil')}
                            >
                              ✕
                            </button>
                          </div>

                          {/* Expanded Visual Cut Editor */}
                          {isExpanded && (
                            <div className="mt-2 space-y-1.5 border-t border-rose-500/20 pt-1.5 text-[8.5px]">
                              {/* Face Selector */}
                              <div>
                                <span className="text-[7.5px] text-slate-400 uppercase block mb-0.5">Hedef Yüzey:</span>
                                <div className="grid grid-cols-6 gap-0.5">
                                  {(['top', 'bottom', 'front', 'back', 'right', 'left'] as const).map((f) => (
                                    <button
                                      key={f}
                                      type="button"
                                      onClick={() => updateCut(selected.id, c.id, { face: f })}
                                      className={`py-0.5 rounded text-[7.5px] font-bold border transition ${
                                        c.face === f ? 'bg-[var(--cyan)] text-[var(--accent-ink)] border-rose-400' : 'bg-black/40 text-slate-400 border-white/10'
                                      }`}
                                    >
                                      {f === 'top' ? 'Üst' : f === 'bottom' ? 'Alt' : f === 'front' ? 'Ön' : f === 'back' ? 'Arka' : f === 'right' ? 'Sağ' : 'Sol'}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Shape Selector */}
                              <div className="grid grid-cols-3 gap-1">
                                {([
                                  { id: 'rect' as const, label: 'Havuz' },
                                  { id: 'circle' as const, label: 'Daire' },
                                  { id: 'slot' as const, label: 'Slot' },
                                ]).map((st) => (
                                  <button
                                    key={st.id}
                                    type="button"
                                    onClick={() => updateCut(selected.id, c.id, { type: st.id })}
                                    className={`py-0.5 rounded text-[8px] font-bold border transition ${
                                      c.type === st.id ? 'bg-rose-500/30 text-rose-200 border-rose-400' : 'bg-black/40 text-slate-400 border-white/10'
                                    }`}
                                  >
                                    {st.label}
                                  </button>
                                ))}
                              </div>

                              {/* Dimensions Inputs */}
                              <div className="grid grid-cols-2 gap-1">
                                {c.type === 'circle' ? (
                                  <label className="block col-span-2">
                                    <span className="text-[7.5px] text-slate-400 uppercase">Çap Ø (mm):</span>
                                    <input
                                      type="number"
                                      value={c.diameter || 20}
                                      onChange={(e) => updateCut(selected.id, c.id, { diameter: Number(e.target.value) })}
                                      className="w-full bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-white font-bold"
                                    />
                                  </label>
                                ) : (
                                  <>
                                    <label className="block">
                                      <span className="text-[7.5px] text-slate-400 uppercase">Genişlik W:</span>
                                      <input
                                        type="number"
                                        value={c.width || 25}
                                        onChange={(e) => updateCut(selected.id, c.id, { width: Number(e.target.value) })}
                                        className="w-full bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-white font-bold"
                                      />
                                    </label>
                                    <label className="block">
                                      <span className="text-[7.5px] text-slate-400 uppercase">Boy L:</span>
                                      <input
                                        type="number"
                                        value={c.length || 35}
                                        onChange={(e) => updateCut(selected.id, c.id, { length: Number(e.target.value) })}
                                        className="w-full bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-white font-bold"
                                      />
                                    </label>
                                  </>
                                )}
                              </div>

                              {/* Depth & Position */}
                              <div className="grid grid-cols-3 gap-1">
                                <label className="block">
                                  <span className="text-[7.5px] text-slate-400 uppercase">Derinlik:</span>
                                  <input
                                    type="number"
                                    value={c.depth || 8}
                                    onChange={(e) => updateCut(selected.id, c.id, { depth: Number(e.target.value) })}
                                    className="w-full bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-rose-300 font-bold"
                                  />
                                </label>
                                <label className="block">
                                  <span className="text-[7.5px] text-slate-400 uppercase">X (mm):</span>
                                  <input
                                    type="number"
                                    value={c.x || 0}
                                    onChange={(e) => updateCut(selected.id, c.id, { x: Number(e.target.value) })}
                                    className="w-full bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-white font-bold"
                                  />
                                </label>
                                <label className="block">
                                  <span className="text-[7.5px] text-slate-400 uppercase">Y (mm):</span>
                                  <input
                                    type="number"
                                    value={c.y || 0}
                                    onChange={(e) => updateCut(selected.id, c.id, { y: Number(e.target.value) })}
                                    className="w-full bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-white font-bold"
                                  />
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[8.5px] text-slate-500 italic py-1 text-center">
                    {t12(language, 'No cuts applied to this solid.', 'Bu parçada henüz kesim uygulanmadı.')}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (selected) {
                      const newCutId = `cut-${Date.now().toString(36)}`;
                      addCut({
                        id: newCutId,
                        type: 'rect',
                        face: 'top',
                        width: 25,
                        length: 35,
                        depth: 8,
                        x: 0,
                        y: 0,
                        isThroughAll: false,
                      });
                      setExpandedCutId(newCutId);
                      ping(t12(language, '✂️ Cut added — adjust dimensions above', '✂️ Kesim eklendi — ölçüleri yukarıdan düzenleyin'));
                    }
                  }}
                  className="w-full py-1.5 rounded-[var(--radius-s)] bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-[8.5px] flex items-center justify-center gap-1 transition-all"
                >
                  <Scissors size={10} />
                  <span>{t12(language, '+ New Surface Cut / Pocket', '+ Yeni Kesim / Havuz Aç')}</span>
                </button>
              </div>

              {/* 6. 🔘 APPLIED METRIC HOLES (Visual Interactive Editor) */}
              <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <CircleDot size={10} />
                    <span>// {t12(language, 'APPLIED HOLES', 'UYGULANAN DELİKLER')}</span>
                  </span>
                  <span className="text-[7.5px] font-mono px-1 py-0.2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
                    {selected.holes?.length || 0}
                  </span>
                </div>

                {selected.holes && selected.holes.length > 0 ? (
                  <div className="space-y-1.5">
                    {selected.holes.map((h) => {
                      const isExpanded = expandedHoleId === h.id;
                      return (
                        <div
                          key={h.id}
                          className={`rounded-[var(--radius-s)] border transition-all ${
                            isExpanded ? 'border-amber-400 bg-amber-950/25 p-1.5' : 'border-white/10 bg-[var(--bg-2)] p-1'
                          }`}
                        >
                          {/* Hole Header Summary Row */}
                          <div className="flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => setExpandedHoleId(isExpanded ? null : h.id)}
                              className="flex items-center gap-1 flex-1 min-w-0 text-left"
                            >
                              {isExpanded ? <ChevronDown size={10} className="text-amber-400" /> : <ChevronRight size={10} className="text-slate-400" />}
                              <span className="font-bold text-amber-200 truncate text-[9px]">
                                {h.size} {h.type === 'counterbore' ? 'İmbus' : h.type === 'tap' ? 'Dişli' : 'Geçme'}
                              </span>
                              <span className="text-[7.5px] text-slate-400">
                                ({h.face} · ({h.x},{h.y}))
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeHole(h.id)}
                              className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition"
                              title={t12(language, 'Delete Hole', 'Deliği Sil')}
                            >
                              ✕
                            </button>
                          </div>

                          {/* Expanded Visual Hole Editor */}
                          {isExpanded && (
                            <div className="mt-2 space-y-1.5 border-t border-amber-500/20 pt-1.5 text-[8.5px]">
                              <div className="grid grid-cols-2 gap-1.5">
                                <label className="block">
                                  <span className="text-[7.5px] text-slate-400 uppercase">Metrik Çap:</span>
                                  <select
                                    value={h.size}
                                    onChange={(e) => updateHole(selected.id, h.id, { size: e.target.value })}
                                    className="w-full bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-white font-bold"
                                  >
                                    {['M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12', 'M16', 'M20'].map((sz) => (
                                      <option key={sz} value={sz}>{sz}</option>
                                    ))}
                                  </select>
                                </label>
                                <label className="block">
                                  <span className="text-[7.5px] text-slate-400 uppercase">Tip:</span>
                                  <select
                                    value={h.type}
                                    onChange={(e) => updateHole(selected.id, h.id, { type: e.target.value as any })}
                                    className="w-full bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-white font-bold"
                                  >
                                    <option value="counterbore">İmbus Havşalı</option>
                                    <option value="tap">Dişli (Tap)</option>
                                    <option value="clearance">Geçme Deliği</option>
                                    <option value="countersink">90° Havşalı</option>
                                  </select>
                                </label>
                              </div>

                              <div className="grid grid-cols-3 gap-1">
                                <label className="block">
                                  <span className="text-[7.5px] text-slate-400 uppercase">Derinlik:</span>
                                  <input
                                    type="number"
                                    value={h.depth || 15}
                                    onChange={(e) => updateHole(selected.id, h.id, { depth: Number(e.target.value) })}
                                    className="w-full bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-amber-300 font-bold"
                                  />
                                </label>
                                <label className="block">
                                  <span className="text-[7.5px] text-slate-400 uppercase">X (mm):</span>
                                  <input
                                    type="number"
                                    value={h.x || 0}
                                    onChange={(e) => updateHole(selected.id, h.id, { x: Number(e.target.value) })}
                                    className="w-full bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-white font-bold"
                                  />
                                </label>
                                <label className="block">
                                  <span className="text-[7.5px] text-slate-400 uppercase">Y (mm):</span>
                                  <input
                                    type="number"
                                    value={h.y || 0}
                                    onChange={(e) => updateHole(selected.id, h.id, { y: Number(e.target.value) })}
                                    className="w-full bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-white font-bold"
                                  />
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[8.5px] text-slate-500 italic py-1 text-center">
                    {t12(language, 'No holes drilled on this solid.', 'Bu parçada henüz delik delinmedi.')}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (selected) {
                      const spec = ISO_METRIC_HOLES.find((h) => h.size === 'M6') || ISO_METRIC_HOLES[0];
                      const newHole: HoleItem = {
                        id: `hole-${Date.now().toString(36)}`,
                        size: spec.size,
                        type: 'counterbore',
                        face: 'top',
                        x: 0,
                        y: 0,
                        depth: spec.counterboreDepth || 6,
                        isThroughAll: true,
                        diameter: spec.clearanceMedium,
                      };
                      addHole(newHole);
                      setExpandedHoleId(newHole.id);
                      ping(t12(language, '🔩 M6 Counterbore hole added — adjust in panel above', '🔩 M6 İmbus deliği eklendi — yukarıdan düzenleyin'));
                    }
                  }}
                  className="w-full py-1.5 rounded-[var(--radius-s)] bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-[8.5px] flex items-center justify-center gap-1 transition-all"
                >
                  <CircleDot size={10} />
                  <span>{t12(language, '+ New Metric Hole', '+ Yeni Metrik Delik Del')}</span>
                </button>
              </div>

              {/* 7. Transform (XYZ Coordinates) */}
              <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-[var(--alu-dim)]">
                    // POSITION MATRIX (mm)
                  </span>
                  <button
                    type="button"
                    onClick={() => updateSelectedTransform({ position: { x: 0, y: 0, z: 0 } })}
                    className="text-[7.5px] text-[var(--cyan)] hover:underline"
                    title="Center to (0,0,0)"
                  >
                    RESET (0,0,0)
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['x', 'y', 'z'] as const).map((axis) => {
                    const axisColor = axis === 'x' ? 'text-rose-400' : axis === 'y' ? 'text-emerald-400' : 'text-blue-400';
                    return (
                      <label key={axis} className="block bg-[var(--bg-2)] p-1 rounded-[var(--radius-s)] border border-[var(--line)]">
                        <span className={`text-[8px] font-mono font-bold uppercase ${axisColor}`}>
                          {axis.toUpperCase()}
                        </span>
                        <input
                          type="number"
                          value={selected.position[axis]}
                          onChange={(e) => updateSelectedTransform({ position: { [axis]: Number(e.target.value) } })}
                          className="w-full rounded-[2px] border border-[var(--line)] bg-[var(--bg-0)] px-1 py-0.5 font-mono text-[10.5px] text-white font-bold outline-none focus:border-[var(--cyan)]"
                        />
                      </label>
                    );
                  })}
                </div>

                {/* Scale Matrix (Factor) */}
                <div className="flex items-center justify-between pt-1 border-t border-[var(--line)]">
                  <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-[var(--alu-dim)]">
                    // SCALE MATRIX (1.0 = 100%)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      updateSelectedTransform({ scale: { x: 1, y: 1, z: 1 } });
                    }}
                    className="text-[7.5px] text-amber-400 hover:underline"
                    title="Reset Scale to 1.0"
                  >
                    RESET (1.0)
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['x', 'y', 'z'] as const).map((axis) => (
                    <label key={axis} className="block bg-[var(--bg-2)] p-1 rounded-[var(--radius-s)] border border-[var(--line)]">
                      <span className="text-[8px] font-mono font-bold uppercase text-amber-400">
                        S{axis.toUpperCase()}
                      </span>
                      <input
                        type="number"
                        step="0.05"
                        value={selected.scale[axis]}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 1;
                          updateSelectedTransform({ scale: { [axis]: val } });
                        }}
                        onBlur={() => {
                          bakeScaleToParams(selected.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            bakeScaleToParams(selected.id);
                          }
                        }}
                        className="w-full rounded-[2px] border border-[var(--line)] bg-[var(--bg-0)] px-1 py-0.5 font-mono text-[10.5px] text-amber-300 font-bold outline-none focus:border-amber-400"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* 8. Actions Footer */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={duplicateSelected}
                  className="flex items-center justify-center gap-1.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] py-1.5 text-[9.5px] font-bold uppercase text-slate-200 hover:bg-[var(--bg-3)] hover:text-white transition-all shadow-sm"
                >
                  <Copy size={11} />
                  <span>DUPLICATE</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleLocked(selected.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-[var(--radius-s)] border py-1.5 text-[9.5px] font-bold uppercase transition-all shadow-sm ${
                    selected.locked
                      ? 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                      : 'border-[var(--line)] bg-[var(--bg-2)] text-slate-300 hover:bg-[var(--bg-3)]'
                  }`}
                >
                  {selected.locked ? <Lock size={11} className="text-amber-400" /> : <Unlock size={11} />}
                  <span>{selected.locked ? 'LOCKED' : 'LOCK'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={deleteSelected}
                className="w-full flex items-center justify-center gap-1.5 rounded-[var(--radius-s)] border border-rose-500/30 bg-rose-500/10 py-1.5 text-[9.5px] font-bold uppercase text-rose-400 hover:bg-rose-500/20 transition-all shadow-sm"
              >
                <Trash2 size={11} />
                <span>{tStudio.delete.toUpperCase()}</span>
              </button>
            </div>
          ) : (
            /* Assembly & Workspace Telemetry HUD (When NO part selected) */
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-3">
              {/* Telemetry Header */}
              <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[var(--cyan)] flex items-center gap-1.5">
                    <Activity size={12} className="text-[var(--cyan)]" />
                    <span>// WORKSPACE TELEMETRY</span>
                  </span>
                  <span className="text-[7.5px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-2)] border border-[var(--ok)]/40 text-[var(--ok)] font-bold">
                    ONLINE
                  </span>
                </div>
                <p className="text-[8.5px] text-[var(--alu-dim)]">
                  WCS Origin Datum · ISO 5459 · Units Metric mm
                </p>
              </div>

              {/* Physical Assembly Properties Card */}
              <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-2">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                  <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-[var(--alu-dim)]">
                    // ASSEMBLY PROPERTIES
                  </span>
                  <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white">
                    {parts.length} {parts.length === 1 ? 'part' : 'parts'}
                  </span>
                </div>

                <div className="space-y-1.5 text-[9.5px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--alu-dim)]">TOTAL MASS:</span>
                    <span className="text-[var(--ok)] font-black text-[11px]">
                      {massProps.massKg.toFixed(3)} kg <span className="text-[8px] text-[var(--alu-dim)]">({massProps.massGrams.toFixed(0)} g)</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[var(--alu-dim)]">TOTAL VOLUME:</span>
                    <span className="text-white font-bold">{massProps.volumeCm3} cm³</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[var(--alu-dim)]">SURFACE AREA:</span>
                    <span className="text-white font-bold">{massProps.surfaceAreaCm2} cm²</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[var(--alu-dim)]">CENTER OF GRAVITY:</span>
                    <span className="text-[var(--cyan)] font-mono text-[9px] font-bold">
                      [{massProps.centerOfGravity.x}, {massProps.centerOfGravity.y}, {massProps.centerOfGravity.z}] mm
                    </span>
                  </div>

                  {massProps.boundingBox && (
                    <div className="flex items-center justify-between border-t border-[var(--line)] pt-1.5 mt-1">
                      <span className="text-[var(--alu-dim)]">ENVELOPE (W×H×D):</span>
                      <span className="text-amber-300 font-mono text-[9px] font-bold">
                        {massProps.boundingBox.width} × {massProps.boundingBox.height} × {massProps.boundingBox.depth} mm
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Camera Presets Card */}
              <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-1.5">
                <p className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-[var(--alu-dim)]">
                  // STANDARD VIEW MATRIX
                </p>
                <div className="grid grid-cols-4 gap-1 pt-0.5">
                  {(['iso', 'top', 'front', 'right'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => triggerCameraView(v)}
                      className="py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] hover:border-[var(--cyan)]/50 hover:bg-[var(--bg-3)] text-slate-200 text-[8.5px] font-bold uppercase transition"
                    >
                      {v.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Add Components Card */}
              <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-1.5">
                <p className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-[var(--alu-dim)]">
                  // QUICK INSERT PREREQUISITES
                </p>
                <div className="space-y-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      handleAddKind('box');
                      ping(t12(language, '6061 Billet Solid added', '6061 Kütük Parça eklendi'));
                    }}
                    className="w-full text-left p-1.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] hover:border-[var(--cyan)]/50 hover:bg-[var(--bg-3)] flex items-center justify-between text-[9px] font-bold text-slate-200 transition"
                  >
                    <span>+ 6061 Billet Block</span>
                    <span className="text-[8px] text-[var(--alu-dim)]">80×40×20 mm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleAddKind('cylinder');
                      ping(t12(language, 'Shaft added', 'Mil eklendi'));
                    }}
                    className="w-full text-left p-1.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] hover:border-[var(--cyan)]/50 hover:bg-[var(--bg-3)] flex items-center justify-between text-[9px] font-bold text-slate-200 transition"
                  >
                    <span>+ Metric Shaft</span>
                    <span className="text-[8px] text-[var(--alu-dim)]">Ø30×40 mm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      addTSlotPart('wellste-4040', 500);
                      ping(t12(language, 'Wellste 4040 T-Slot added (500 mm)', 'Wellste 4040 T-Kanal profil eklendi (500 mm)'));
                    }}
                    className="w-full text-left p-1.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] hover:border-[var(--cyan)]/50 hover:bg-[var(--bg-3)] flex items-center justify-between text-[9px] font-bold text-slate-200 transition"
                  >
                    <span>+ Wellste® 4040 Profile</span>
                    <span className="text-[8px] text-[var(--cyan)]">Slot 8 · 500mm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleAddKind('L-bracket');
                      ping(t12(language, 'L-Bracket added', 'L Profil eklendi'));
                    }}
                    className="w-full text-left p-1.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] hover:border-[var(--cyan)]/50 hover:bg-[var(--bg-3)] flex items-center justify-between text-[9px] font-bold text-slate-200 transition"
                  >
                    <span>+ Angle L-Bracket</span>
                    <span className="text-[8px] text-[var(--alu-dim)]">50×50×40 mm</span>
                  </button>
                </div>
              </div>

              {/* Hint footer */}
              <p className="text-[8px] text-[var(--alu-dim)] text-center leading-relaxed pt-1">
                Select any component in 3D viewport to inspect geometry, modify dimensions, or apply constraints.
              </p>
            </div>
          )}
        </aside>
      )}
      </div>

      {/* ─── SOLIDWORKS 'S' QUICK SHORTCUT FLOATING HUD ─── */}
      {showShortcutHud && (
        <div
          className="fixed inset-0 z-50 select-none bg-black/20"
          onClick={() => setShowShortcutHud(false)}
        >
          <div
            className="absolute rounded-xl bg-[var(--bg-1)]/95 border border-cyan-500/50 shadow-2xl p-2.5 w-[260px] font-mono animate-in fade-in zoom-in-95 duration-100"
            style={{ left: hudPos.x, top: hudPos.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HUD Header */}
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10 text-[9px] font-bold">
              <span className="text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} className="text-amber-400" />
                <span>{t12(language, 'S-KEY QUICK TOOLS', 'S-TUŞU HIZLI ARAÇLAR')}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowShortcutHud(false)}
                className="text-slate-400 hover:text-white p-0.5 rounded transition cursor-pointer"
              >
                <X size={11} />
              </button>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-1 text-[9.5px]">
              {/* 1. Extrude Boss */}
              <button
                type="button"
                onClick={() => {
                  setShowShortcutHud(false);
                  startSketchAdd('extrude');
                  ping(t12(language, '✏️ Extrude Boss: Draw sketch profile', '✏️ Extrude Çizim Modu: Çizim yapın'));
                }}
                className="flex items-center gap-2 p-1.5 rounded-lg bg-[var(--bg-2)] hover:bg-cyan-500/20 border border-[var(--line)] hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300 font-bold transition text-left cursor-pointer"
              >
                <Pencil size={12} className="text-cyan-400 shrink-0" />
                <span className="truncate">Extrude Boss</span>
              </button>

              {/* 2. Extrude Cut */}
              <button
                type="button"
                onClick={() => {
                  setShowShortcutHud(false);
                  const target = selected || parts[0];
                  if (target) {
                    if (!selected) select(target.id);
                    const newCutId = `cut-${Date.now().toString(36)}`;
                    addCut({
                      id: newCutId,
                      type: 'rect',
                      face: 'top',
                      width: 25,
                      length: 35,
                      depth: 8,
                      x: 0,
                      y: 0,
                      isThroughAll: false,
                    });
                    setExpandedCutId(newCutId);
                    ping(t12(language, '✂️ Cut applied. Edit parameters in right panel.', '✂️ Kesim uygulandı. Sağ panelden ölçüleri düzenleyin.'));
                  }
                }}
                className="flex items-center gap-2 p-1.5 rounded-lg bg-[var(--bg-2)] hover:bg-rose-500/20 border border-[var(--line)] hover:border-rose-500/50 text-slate-200 hover:text-rose-300 font-bold transition text-left cursor-pointer"
              >
                <Scissors size={12} className="text-rose-400 shrink-0" />
                <span className="truncate">Extrude Cut</span>
              </button>

              {/* 3. Hole Wizard */}
              <button
                type="button"
                onClick={() => {
                  setShowShortcutHud(false);
                  const target = selected || parts[0];
                  if (target) {
                    if (!selected) select(target.id);
                    const newHoleId = `hole-${Date.now().toString(36)}`;
                    addHole({
                      id: newHoleId,
                      size: 'M8',
                      face: 'top',
                      x: 0,
                      y: 0,
                      depth: 15,
                      isThroughAll: false,
                      type: 'clearance',
                    });
                    setExpandedHoleId(newHoleId);
                    ping(t12(language, '⭕ M8 Hole added', '⭕ M8 Delik eklendi'));
                  }
                }}
                className="flex items-center gap-2 p-1.5 rounded-lg bg-[var(--bg-2)] hover:bg-amber-500/20 border border-[var(--line)] hover:border-amber-500/50 text-slate-200 hover:text-amber-300 font-bold transition text-left cursor-pointer"
              >
                <CircleDot size={12} className="text-amber-400 shrink-0" />
                <span className="truncate">Hole Wizard</span>
              </button>

              {/* 4. Assembly Mate */}
              <button
                type="button"
                onClick={() => {
                  setShowShortcutHud(false);
                  openMateModal();
                  ping(t12(language, '📎 Assembly Mate Mode', '📎 Montajlama Modu'));
                }}
                className="flex items-center gap-2 p-1.5 rounded-lg bg-[var(--bg-2)] hover:bg-cyan-500/20 border border-[var(--line)] hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300 font-bold transition text-left cursor-pointer"
              >
                <Link2 size={12} className="text-cyan-400 shrink-0" />
                <span className="truncate">Mate [M]</span>
              </button>

              {/* 5. Smart Fasteners */}
              <button
                type="button"
                onClick={() => {
                  setShowShortcutHud(false);
                  openFastenersModal();
                }}
                className="flex items-center gap-2 p-1.5 rounded-lg bg-[var(--bg-2)] hover:bg-amber-500/20 border border-[var(--line)] hover:border-amber-500/50 text-slate-200 hover:text-amber-300 font-bold transition text-left cursor-pointer"
              >
                <Sparkles size={12} className="text-amber-400 shrink-0" />
                <span className="truncate">Fasteners</span>
              </button>

              {/* 6. Measure Caliper */}
              <button
                type="button"
                onClick={() => {
                  setShowShortcutHud(false);
                  setTool(tool === 'measure' ? 'select' : 'measure');
                  ping(t12(language, '📏 Caliper Active (K)', '📏 Kumpas Aktif (K)'));
                }}
                className="flex items-center gap-2 p-1.5 rounded-lg bg-[var(--bg-2)] hover:bg-cyan-500/20 border border-[var(--line)] hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300 font-bold transition text-left cursor-pointer"
              >
                <Ruler size={12} className="text-cyan-400 shrink-0" />
                <span className="truncate">Measure [K]</span>
              </button>

              {/* 7. Fit View */}
              <button
                type="button"
                onClick={() => {
                  setShowShortcutHud(false);
                  triggerCameraView('fit');
                  ping(t12(language, '⛶ Fit View (F)', '⛶ Ekrana Sığdır (F)'));
                }}
                className="flex items-center gap-2 p-1.5 rounded-lg bg-[var(--bg-2)] hover:bg-cyan-500/20 border border-[var(--line)] hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300 font-bold transition text-left cursor-pointer"
              >
                <Maximize2 size={12} className="text-cyan-400 shrink-0" />
                <span className="truncate">Fit View [F]</span>
              </button>

              {/* 8. Section View */}
              <button
                type="button"
                onClick={() => {
                  setShowShortcutHud(false);
                  const nextAxis: Record<SectionAxis, SectionAxis> = { NONE: 'X', X: 'Y', Y: 'Z', Z: 'NONE' };
                  const next = nextAxis[sectionAxis];
                  setSectionAxis(next);
                  ping(`Section [${next}]`);
                }}
                className="flex items-center gap-2 p-1.5 rounded-lg bg-[var(--bg-2)] hover:bg-rose-500/20 border border-[var(--line)] hover:border-rose-500/50 text-slate-200 hover:text-rose-300 font-bold transition text-left cursor-pointer"
              >
                <Boxes size={12} className="text-rose-400 shrink-0" />
                <span className="truncate">Section [X]</span>
              </button>
            </div>

            {/* Quick Add Shape Button */}
            <button
              type="button"
              onClick={() => {
                setShowShortcutHud(false);
                setShapesMenuOpen(true);
              }}
              className="mt-1.5 w-full flex items-center justify-center gap-1.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[9px] font-bold transition cursor-pointer"
            >
              <Boxes size={11} />
              <span>{t12(language, '+ Insert 3D Solid / Profile', '+ 3D Katı / Profil Ekle')}</span>
            </button>

            {/* Footer Hint */}
            <div className="mt-1.5 text-center text-[7.5px] text-slate-500">
              {t12(language, 'Tip: Press [S] or [Esc] to dismiss', 'İpucu: Kapatmak için [S] veya [Esc] basın')}
            </div>
          </div>
        </div>
      )}

      {/* ─── 2D TECHNICAL DRAWING SHEET MODAL WITH CUSTOM TEMPLATES & BATCH PDF ─── */}
      {showTechnicalDrawingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 animate-in fade-in">
          <div className="w-full max-w-7xl h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl overflow-hidden">
            {/* Modal Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-white/10 bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--cyan-glow)] text-[var(--cyan)] font-mono font-black border border-[var(--cyan)]/40">
                  📄
                </div>
                <div>
                  <h3 className="text-sm font-black text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    <span>{t12(language, '2D TECHNICAL DRAWING PORTFOLIO', '2D TEKNİK RESİM PORTFÖYÜ')}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                      {templateStyle.toUpperCase()}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {drawingTargetId === 'all' ? `🏢 ${t12(language, 'Full Assembly', 'Tüm Montaj')} (${parts.length} ${t12(language, 'Parts', 'Parça')})` : `🧩 ${activeDrawingParts[0]?.name || projectName}`} · {activeMaterial.name} · {massProps.massKg} kg
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
                    🏢 {t12(language, `Full Assembly (${parts.length} Parts)`, `Tüm Montaj (${parts.length} Parça - Montaj Resmi)`)}
                  </option>
                  {parts.map((p, idx) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      🧩 {p.name || `Parça ${idx + 1}`}
                    </option>
                  ))}
                </select>

                {/* Sheet Size Selector (A2 / A3 / A4) */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5">
                  {(['A2', 'A3', 'A4'] as ('A2' | 'A3' | 'A4')[]).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setDrawingSheetSize(sz)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        drawingSheetSize === sz
                          ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title={sz === 'A2' ? t12(language, 'A2 Sheet (Recommended for Assemblies)', 'A2 Boyut (Montajlar İçin Önerilen)') : undefined}
                    >
                      {sz}
                    </button>
                  ))}
                </div>

                {/* Feature Toggles (BOM, Poz, Patlatma, Kesit A-A, Ağ) */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 gap-0.5">
                  <button
                    type="button"
                    onClick={() => setDrawingShowBom(!drawingShowBom)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      drawingShowBom ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                    }`}
                    title={t12(language, 'Toggle Bill of Materials (BOM)', 'Malzeme Listesi Tablosunu Aç/Kapat')}
                  >
                    📋 {t12(language, 'BOM', 'BOM')}
                  </button>

                  {drawingTargetId === 'all' && parts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setDrawingShowBalloons(!drawingShowBalloons)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        drawingShowBalloons ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
                      }`}
                      title={t12(language, 'Toggle Item Find Balloons', 'Parça Poz Baloncuklarını Aç/Kapat')}
                    >
                      ① {t12(language, 'Balloons', 'Poz')}
                    </button>
                  )}

                  {drawingTargetId === 'all' && parts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setDrawingShowExploded(!drawingShowExploded)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        drawingShowExploded ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-white'
                      }`}
                      title={t12(language, 'Toggle Exploded Assembly View', 'Patlatılmış Montaj Görünümünü Aç/Kapat')}
                    >
                      💥 {t12(language, 'Explode', 'Patlat')}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setDrawingShowSection(!drawingShowSection)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      drawingShowSection ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-white'
                    }`}
                    title={t12(language, 'Toggle Section View A-A', 'A-A Kesit Görünüşünü Aç/Kapat')}
                  >
                    ✂️ {t12(language, 'Section', 'Kesit')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDrawingShowWireframe(!drawingShowWireframe)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      drawingShowWireframe ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
                    }`}
                    title={t12(language, 'Toggle 2D Drawing Mesh Wireframe', 'Teknik Resim Ağ/Tel Çizgilerini Aç/Kapat')}
                  >
                    🕸️ {t12(language, 'Mesh', 'Ağ')}
                  </button>
                </div>

                {/* Template Style Selector */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5">
                  {(['iso7200', 'modern', 'din', 'blueprint', 'minimal'] as DrawingTemplateStyle[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTemplateStyle(st)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        templateStyle === st
                          ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-sm'
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
                          ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-sm'
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
                  title={t12(language, 'Customize Title Block & Template', 'Kullanıcı Şablonunu & Antet Alanlarını Düzenle')}
                >
                  <Sliders size={12} />
                  <span>{t12(language, 'Template', 'Şablon')}</span>
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
                        partName: drawingTargetId === 'all'
                          ? (t12(language, `Full Assembly (${parts.length} Parts)`, `Tüm Montaj (${parts.length} Parça)`))
                          : (activeDrawingParts[0]?.name || (t12(language, 'Part', 'Parça'))),
                        materialName: t12(language, activeMaterial.name, activeMaterial.nameTr),
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
                        lang: language,
                        showBomTable: drawingShowBom,
                        showBalloons: drawingShowBalloons,
                        showExplodedView: drawingShowExploded,
                        showSectionView: drawingShowSection,
                        showMeshWireframe: drawingShowWireframe,
                        explodeFactor: drawingExplodeFactor,
                      }
                    );
                    const fileName = drawingTargetId === 'all'
                      ? `${projectName}_Assembly_Drawing.svg`
                      : `${activeDrawingParts[0]?.name || 'Part'}_Detail_Drawing.svg`;
                    downloadFile(svgData, fileName, 'image/svg+xml');
                    ping(t12(language, 'SVG Drawing Downloaded', 'SVG Teknik Resim indirildi'));
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs hover:bg-cyan-500/30 transition-all"
                >
                  <Download size={13} />
                  <span>{t12(language, 'SVG', 'SVG')}</span>
                </button>

                {/* Batch Download All SVGs */}
                {parts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      // 1. Download assembly
                      const assSvg = generateTechnicalDrawingSVG(parts, massProps, {
                        projectName,
                        materialName: t12(language, activeMaterial.name, activeMaterial.nameTr),
                        companyName,
                        author: drawingAuthor,
                        templateStyle,
                        colorTheme,
                        partName: t12(language, `Assembly: ${parts.length} Parts`, `Montaj: ${parts.length} Parça`),
                        lang: language,
                        sheetSize: 'A2',
                        showBomTable: true,
                        showBalloons: true,
                        showExplodedView: drawingShowExploded,
                        showSectionView: true,
                        showMeshWireframe: drawingShowWireframe,
                        explodeFactor: drawingExplodeFactor,
                      });
                      downloadFile(assSvg, `${projectName}_Assembly_Drawing.svg`, 'image/svg+xml');

                      // 2. Download parts
                      parts.forEach((p, idx) => {
                        setTimeout(() => {
                          const pMass = calculateAssemblyMassProperties([p], selectedMaterialId);
                          const pSvg = generateTechnicalDrawingSVG([p], pMass, {
                            projectName,
                            materialName: t12(language, activeMaterial.name, activeMaterial.nameTr),
                            companyName,
                            author: drawingAuthor,
                            templateStyle,
                            colorTheme,
                            partName: p.name || (t12(language, `Part_${idx + 1}`, `Parça_${idx + 1}`)),
                            lang: language,
                          });
                          downloadFile(pSvg, `${p.name || `Part_${idx + 1}`}_Drawing.svg`, 'image/svg+xml');
                        }, (idx + 1) * 250);
                      });
                      ping(t12(language, `Downloading ${parts.length + 1} SVG drawings...`, `${parts.length + 1} adet SVG çizimi indiriliyor...`));
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold text-xs hover:bg-purple-500/30 transition-all"
                    title={t12(language, 'Batch Download All Part Drawings', 'Tüm Parçaların Teknik Resimlerini Ayrı Ayrı İndir')}
                  >
                    <span>📦 {t12(language, 'Batch SVG', 'Toplu SVG')}</span>
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
                        partName: t12(language, `Full Assembly (${parts.length} Parts)`, `Tüm Montaj (${parts.length} Parça)`),
                        materialName: t12(language, activeMaterial.name, activeMaterial.nameTr),
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
                        lang: language,
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
                          partName: p.name || (t12(language, 'Part Detail', 'Parça Detayı')),
                          materialName: t12(language, activeMaterial.name, activeMaterial.nameTr),
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black text-xs hover:brightness-110 shadow-sm transition-all"
                  title={t12(language, 'Batch Print All Sheets as Multi-page PDF', 'Tüm Parçaları Tek Bir Çok Sayfalı PDF Olarak Kaydet / Yazdır')}
                >
                  <span>🖨️ {t12(language, 'Batch PDF / Print', 'Toplu PDF / Yazdır')}</span>
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
                <div className="w-80 border-r border-white/10 bg-slate-900/95 p-4 overflow-y-auto space-y-4 shrink-0 font-mono text-xs animate-in slide-in-from-left">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      ⚙️ {t12(language, 'Template & Title Block', 'Şablon & Antet Ayarları')}
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
                    <label className="text-[10px] text-slate-400 font-bold uppercase">{t12(language, 'Company Name', 'Firma / Şirket Adı')}</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">{t12(language, 'Subtext / Department', 'Alt Başlık / Departman')}</label>
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
                      <label className="text-[10px] text-slate-400 font-bold uppercase">{t12(language, 'Author', 'Çizen (Drafter)')}</label>
                      <input
                        type="text"
                        value={drawingAuthor}
                        onChange={(e) => setDrawingAuthor(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">{t12(language, 'Approver', 'Onaylayan')}</label>
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
                      <label className="text-[10px] text-slate-400 font-bold uppercase">{t12(language, 'Revision', 'Revizyon')}</label>
                      <input
                        type="text"
                        value={drawingRevision}
                        onChange={(e) => setDrawingRevision(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">{t12(language, 'Tolerance', 'Tolerans')}</label>
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
                      <label className="text-[10px] text-slate-400 font-bold uppercase">{t12(language, 'Surface Finish', 'Yüzey (Ra)')}</label>
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
                      <label className="text-[10px] text-slate-400 font-bold uppercase">{t12(language, 'Sheet Size', 'Sayfa Boyutu')}</label>
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
                    <label className="text-[10px] text-slate-400 font-bold uppercase">{t12(language, 'Projection Standard', 'Projeksiyon Açısı')}</label>
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
                    <label className="text-[10px] text-slate-400 font-bold uppercase">{t12(language, 'Manufacturing Notes', 'Özel İmalat Notları')}</label>
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
                    __html: drawingSvgPreview,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ENGINEERING MATERIALS & PHYSICAL MASS PROPERTIES MODAL ─── */}
      {showMaterialsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
          <div className="w-full max-w-4xl max-h-[88vh] flex flex-col rounded-3xl bg-slate-900 border border-purple-500/40 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--cyan-glow)] text-[var(--cyan)] font-mono font-black border border-[var(--cyan)]/40">
                  <Scale size={18} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white font-mono uppercase tracking-wider">
                    {t12(language, 'MASS PROPERTIES & MATERIAL ANALYSIS', 'MÜHENDİSLİK MALZEME & KÜTLE ÖZELLİKLERİ')}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {parts.length} {t12(language, 'Parts', 'Parça')} · {activeMaterial.name}
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
                  <div className="text-[10px] font-mono text-purple-400 font-bold uppercase">{t12(language, 'Total Mass', 'Toplam Kütle')}</div>
                  <div className="text-xl font-mono font-black text-white">{massProps.massKg} kg</div>
                  <div className="text-[9px] font-mono text-slate-400">({massProps.massGrams} g)</div>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase">{t12(language, 'Total Volume', 'Toplam Hacim')}</div>
                  <div className="text-xl font-mono font-black text-white">{massProps.volumeCm3} cm³</div>
                  <div className="text-[9px] font-mono text-slate-400">({massProps.volumeMm3} mm³)</div>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <div className="text-[10px] font-mono text-amber-400 font-bold uppercase">{t12(language, 'Surface Area', 'Yüzey Alanı')}</div>
                  <div className="text-xl font-mono font-black text-white">{massProps.surfaceAreaCm2} cm²</div>
                  <div className="text-[9px] font-mono text-slate-400">({massProps.surfaceAreaMm2} mm²)</div>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <div className="text-[10px] font-mono text-rose-400 font-bold uppercase">{t12(language, 'Center of Mass', 'Ağırlık Merkezi (CoG)')}</div>
                  <div className="text-sm font-mono font-black text-white">X: {massProps.centerOfGravity.x} mm</div>
                  <div className="text-sm font-mono font-black text-white">Y: {massProps.centerOfGravity.y} mm · Z: {massProps.centerOfGravity.z} mm</div>
                </div>
              </div>

              {/* Material Selector & Table */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3">
                  {t12(language, 'MATERIAL MECHANICAL LIMITS', 'MALZEME SEÇİMİ VE MEKANİK DAYANIM LİMİTLERİ')}
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
                            ? 'border-purple-400 bg-purple-500/20 shadow-lg ring-1 ring-purple-400/50'
                            : 'border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-black text-xs text-white">{t12(language, mat.name, mat.nameTr)}</span>
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
          ping(t12(language, `${newHoles.length} holes applied to part`, `${newHoles.length} delik başarıyla uygulandı`));
        }}
      />

      {/* ─── SURFACE POCKET & CNC CUT MODAL (IMAGE 1) ─── */}
      <SurfaceCutModal
        isOpen={showCutModal}
        onClose={() => setShowCutModal(false)}
        selectedPart={selected}
      />

      {/* ─── SHAPE CATALOG MODAL (WINDOW-STYLE) ─── */}
      <ShapeCatalogModal
        isOpen={shapesMenuOpen}
        onClose={() => setShapesMenuOpen(false)}
        onSelectKind={(kind: DesignKind) => {
          handleAddKind(kind);
          setShapesMenuOpen(false);
        }}
        onSelectTSlot={(id: string, len: number) => {
          addTSlotPart(id, len);
          setShapesMenuOpen(false);
          ping(t12(language, `T-Slot profile added (${len} mm)`, `T-Kanal profil eklendi (${len} mm)`));
        }}
      />

      {/* ─── SOLIDWORKS ASSEMBLY MATE MODAL / PROPERTYMANAGER ─── */}
      <AssemblyMateModal />

      {/* ─── SOLIDWORKS SMART FASTENERS & TOOLBOX MODAL ─── */}
      <SmartFastenersModal />
    </div>
  );
}

export default DesignStudio;
