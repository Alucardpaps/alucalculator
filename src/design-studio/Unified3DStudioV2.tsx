'use client';

/**
 * 🌟 ALUCALC UNIFIED 3D STUDIO V2 (PROFESSIONAL 3D CORE)
 *
 * Integrated industrial CAD/CAM/CAE/Factory workstation where the 3D kernel
 * is the central master stage, equipped with:
 * - 1-Click Quick Primitives & Machine Elements Ribbon
 * - 5 Ready-to-Customize Multi-Part Parametric Assembly Templates
 * - Inline AeGiS Natural Language 3D Solid Synthesizer
 * - Live Cross-Section Slicer (X/Y/Z), Exploded View Slider & Render Mode Switcher
 * - Precision Inspector with Slider+Stepper Dimensions, 3D Transform (X/Y/Z, Rx/Ry/Rz),
 *   Linear/Circular/Mirror Array Pattern Cloner, and Active Holes/Pockets Manager.
 */

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  Layers,
  Scissors,
  Flame,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Maximize2,
  Sliders,
  Sparkles,
  Check,
  X,
  Wrench,
  CircleDot,
  Plus,
  Copy,
  Move,
  RotateCw,
  FileSpreadsheet,
  Trash2,
  Wand2,
  Ruler,
  Eye,
  Grid3X3,
  Compass,
  FlipHorizontal,
  ExternalLink,
  Download,
  GraduationCap,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import {
  useDesignStore,
  type DesignKind,
  type RenderMode,
  type SectionAxis,
} from '@/design-studio/designStore';
import { WorkbenchHeader, type V2WorkbenchId } from './v2/WorkbenchHeader';
import { SolversDrawer } from './v2/SolversDrawer';
import { CostOverlayHud } from './v2/CostOverlayHud';
import { FeaOverlay3D } from './v2/FeaOverlay3D';
import { CamOverlay3D } from './v2/CamOverlay3D';
import { FactoryWorkbenchView } from './v2/FactoryWorkbenchView';
import { DrawingWorkbenchView } from './v2/DrawingWorkbenchView';
import { DirectFaceModelingBar } from './v2/DirectFaceModelingBar';
import { Aegis3DCommandBar } from './v2/Aegis3DCommandBar';
import { AegisTextToCadModal } from './v2/AegisTextToCadModal';
import { AegisCadTrainingModal } from './v2/AegisCadTrainingModal';
import { DfmHealthIndicator } from './v2/DfmHealthIndicator';
import { AssemblyTemplatesModal } from './v2/AssemblyTemplatesModal';
import {
  STUDIO_ASSEMBLY_TEMPLATES,
  createLinearPartArray,
  createCircularPartArray,
  mirrorSelectedPart,
} from './v2/QuickDesignStudioTemplates';
import { ShapeCatalogModal } from '@/design-studio/ShapeCatalogModal';
import { AssemblyBomModal } from '@/design-studio/AssemblyBomModal';
import { AssemblyMateModal } from '@/design-studio/AssemblyMateModal';
import { WeldmentModal } from './weldments/WeldmentModal';
import { ModalTransformHud } from './v2/ModalTransformHud';
import { SolidWorksShortcutHud } from './v2/SolidWorksShortcutHud';
import { DesignDoctorHud } from './v2/DesignDoctorHud';
import { CadAcademyModal } from './v2/CadAcademyModal';
import {
  type ModalTransformState,
  type ModalTransformMode,
  INITIAL_MODAL_TRANSFORM_STATE,
  computeModalTransform,
} from './v2/modalTransformTypes';
import {
  applyDeleteFaceAndHeal,
  applyDraftAngleToPart,
  detectSynchronousCoplanarFaces,
} from '@/design-studio/directModelingEngine';
import { SmartFastenersModal } from '@/design-studio/SmartFastenersModal';
import { BoltCirclePcdModal } from '@/design-studio/BoltCirclePcdModal';
import { SurfaceCutModal } from '@/design-studio/SurfaceCutModal';
import { DynamicBlockConfigurator } from '@/cad/components/DynamicBlockConfigurator';
import { DynamicBlockRegistry } from '@/cad/blocks/dynamic/registry';
import { DynamicBlockEngine } from '@/cad/blocks/dynamic/DynamicBlockEngine';
import { usePartStore } from '@/cad/part/partStore';
import { AssemblyFeatureTree } from '@/design-studio/AssemblyFeatureTree';
import { exportPartsToSTL, downloadFile } from '@/design-studio/exporter';
import { generateAssemblyStep, downloadStepFile } from '@/engines/cad/StepBRepExporter';
import { calculateAssemblyMassProperties } from '@/design-studio/materialsEngine';
import { triggerCameraView } from '@/design-studio/cadCameraDispatcher';
import { loadCADFile } from '@/design-studio/cadImporter';
import { generateSolidFromPrompt, generateSolidWithAI } from '@/engines/cad/AegisGenerativeEngine';
import { useAIReady } from '@/lib/ai/aiSettingsStore';
import { SheetMetalStudioModal } from '@/design-studio/SheetMetalStudioModal';
import { useAegisCadHost } from '@/store/aegisStore';
import {
  consumePendingSheetMetalForStudio,
  savePendingSheetMetalForCalculator,
  exportSheetMetalFlatPatternDXF,
  SheetMetalSpec,
} from '@/design-studio/sheetMetalEngine';

// Dynamic 3D Viewport with Three.js / WebGL / OrbitControls
const PartStudioHost = dynamic(() => import('./v2/PartStudioHost').then((m) => m.PartStudioHost), { ssr: false });
const WeldStudioHost = dynamic(() => import('./weldments/WeldStudioHost').then((m) => m.WeldStudioHost), { ssr: false });
const DesignViewport = dynamic(
  () => import('@/design-studio/DesignViewport').then((m) => m.DesignViewport || m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[var(--bg-0)] text-[11px] font-mono text-cyan-400">
        <div className="flex flex-col items-center gap-2">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <span>INITIALIZING 3D ENGINE & WASM KERNEL...</span>
        </div>
      </div>
    ),
  }
);

interface Unified3DStudioV2Props {
  onToggleV1Classic?: () => void;
}

const QUICK_PRIMITIVES: Array<{
  kind: DesignKind | 'gear-pair' | 'bearing-6205' | 'tslot-40';
  labelEn: string;
  labelTr: string;
  icon: string;
}> = [
  { kind: 'box', labelEn: 'Box', labelTr: 'Kutu', icon: '📦' },
  { kind: 'cylinder', labelEn: 'Cylinder', labelTr: 'Silindir', icon: '🛢️' },
  { kind: 'tube', labelEn: 'Tube', labelTr: 'Boru', icon: '⭕' },
  { kind: 'plate', labelEn: 'Hole Plate', labelTr: 'Delikli Plaka', icon: '🔲' },
  { kind: 'L-bracket', labelEn: 'L-Bracket', labelTr: 'L-Braket', icon: '📐' },
  { kind: 'I-beam', labelEn: 'I-Beam', labelTr: 'I-Profil', icon: '🧱' },
  { kind: 'keyway-shaft', labelEn: 'Keyway Shaft', labelTr: 'Kamalı Mil', icon: '⚡' },
  { kind: 'gear-pair', labelEn: 'Gear Pair', labelTr: 'Dişli Çifti', icon: '⚙️' },
  { kind: 'bearing-6205', labelEn: '6205 Bearing', labelTr: '6205 Rulman', icon: '◎' },
  { kind: 'hex-bolt', labelEn: 'Hex Bolt', labelTr: 'Cıvata', icon: '🔩' },
  { kind: 'tslot-40', labelEn: '40x40 T-Slot', labelTr: '40x40 Sigma', icon: '📏' },
];

const STUDIO_MATERIALS = [
  { id: 'al-6061-t6', label: 'EN AW-6061 T6 Aluminum (2.70 g/cm³)', color: '#6b9fff' },
  { id: 'al-7075-t6', label: 'EN AW-7075 T6 Aerospace Alu (2.81 g/cm³)', color: '#22d3ee' },
  { id: 'steel-s355', label: 'EN 10025 S355J2 Structural Steel (7.85 g/cm³)', color: '#94a3b8' },
  { id: 'steel-c45', label: 'EN 10083 C45E / 42CrMo4 Shaft Steel (7.85 g/cm³)', color: '#34d399' },
  { id: 'ss-316l', label: 'AISI 316L Stainless Steel (8.00 g/cm³)', color: '#cbd5e1' },
  { id: 'ti-6al-4v', label: 'Ti-6Al-4V Grade 5 Titanium (4.43 g/cm³)', color: '#c084fc' },
];

export function Unified3DStudioV2({ onToggleV1Classic }: Unified3DStudioV2Props) {
  const { language } = useI18nStore();
  const isTr = language === 'tr';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // V2 Workbench Switcher state - Synchronized with central DesignStore
  const currentWorkbench = useDesignStore((s) => s.activeWorkbench);
  const setCurrentWorkbench = useDesignStore((s) => s.setActiveWorkbench);

  // Left Drawer Tabs: 'tree' | 'solvers'
  const [leftTab, setLeftTab] = useState<'tree' | 'solvers'>('tree');
  const [leftOpen, setLeftOpen] = useState<boolean>(true);
  const [rightOpen, setRightOpen] = useState<boolean>(true);
  const [templatesMenuOpen, setTemplatesMenuOpen] = useState<boolean>(false);

  // Inline AeGiS AI Generator Input
  const [quickPrompt, setQuickPrompt] = useState<string>('');

  // Array / Pattern Generator state in Right Inspector
  const [arrayAxis, setArrayAxis] = useState<'x' | 'y' | 'z'>('x');
  const [arrayCount, setArrayCount] = useState<number>(3);
  const [arrayStepMm, setArrayStepMm] = useState<number>(50);
  const [polarCount, setPolarCount] = useState<number>(6);
  const [polarRadiusMm, setPolarRadiusMm] = useState<number>(45);
  const [inspectorTab, setInspectorTab] = useState<'all' | 'dims' | 'features' | 'transform'>('all');

  // Modals state
  const [shapeCatalogOpen, setShapeCatalogOpen] = useState<boolean>(false);
  const [bomModalOpen, setBomModalOpen] = useState<boolean>(false);
  const [pcdModalOpen, setPcdModalOpen] = useState<boolean>(false);
  const [cutModalOpen, setCutModalOpen] = useState<boolean>(false);
  const [dynBlockModalOpen, setDynBlockModalOpen] = useState<boolean>(false);
  const [commandBarOpen, setCommandBarOpen] = useState<boolean>(false);
  const [textToCadModalOpen, setTextToCadModalOpen] = useState<boolean>(false);
  // Sketch-based parametric Part Studio & Weld Studio state
  const isPartStudioOpenStore = useDesignStore((s) => s.isPartStudioOpen);
  const setPartStudioOpenStore = useDesignStore((s) => s.setPartStudioOpen);
  const isWeldStudioOpenStore = useDesignStore((s) => s.isWeldStudioOpen);
  const setWeldStudioOpenStore = useDesignStore((s) => s.setWeldStudioOpen);
  const [partStudioOpen, setPartStudioOpen] = useState<boolean>(false);
  const [aegisHandover, setAegisHandover] = useState<{ prompt: string; key: number } | null>(null);
  useAegisCadHost('3d', (prompt) => {
    setAegisHandover({ prompt, key: Date.now() });
    setTextToCadModalOpen(true);
  });
  const [cadTrainingModalOpen, setCadTrainingModalOpen] = useState<boolean>(false);
  const [cadAcademyModalOpen, setCadAcademyModalOpen] = useState<boolean>(false);
  const [sheetMetalModalOpen, setSheetMetalModalOpen] = useState<boolean>(false);
  const [sheetMetalInitialSpec, setSheetMetalInitialSpec] = useState<SheetMetalSpec | null>(null);
  const [sheetMetalEditingPartId, setSheetMetalEditingPartId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ⚡ Blender Modal Transform & SolidWorks S-Bar State
  const [modalTransform, setModalTransform] = useState<ModalTransformState>(INITIAL_MODAL_TRANSFORM_STATE);
  const [solidWorksHudOpen, setSolidWorksHudOpen] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 500, y: 350 });
  const startPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 1024) {
      setLeftOpen(true);
      setRightOpen(true);
    } else if (window.innerWidth >= 768) {
      setLeftOpen(true);
      setRightOpen(false);
    } else {
      setLeftOpen(false);
      setRightOpen(false);
    }
    const params = new URLSearchParams(window.location.search);
    const wb = params.get('wb') as V2WorkbenchId;
    if (wb && ['cad', 'weldment', 'assembly', 'fea', 'cam', 'factory', 'cost', 'drawing'].includes(wb)) {
      setCurrentWorkbench(wb);
    }
    const tab = params.get('tab');
    if (tab === 'solvers' || tab === 'tree') {
      setLeftTab(tab);
    }

    const modeParam = params.get('mode');
    if (modeParam === 'weldment') {
      useDesignStore.getState().setCadMode('weldment');
      setCurrentWorkbench('cad');
    } else if (modeParam === 'assembly') {
      useDesignStore.getState().setCadMode('assembly');
      setCurrentWorkbench('assembly');
    } else if (modeParam === 'part') {
      useDesignStore.getState().setCadMode('part');
      setCurrentWorkbench('cad');
    }

    const sampleParam = params.get('sample');
    if (sampleParam === 'weldment') {
      setTimeout(() => useDesignStore.getState().loadSampleWeldedChassis(), 400);
    }

    const weldModalParam = params.get('weldModal');
    if (weldModalParam === 'open') {
      setTimeout(() => useDesignStore.getState().openWeldModal(), 600);
    }

    const modalParam = params.get('modal');
    if (modalParam === 'academy') setCadAcademyModalOpen(true);
    if (modalParam === 'sw') setSolidWorksHudOpen(true);
    if (modalParam === 'cmd') setCommandBarOpen(true);
    if (modalParam === 'grab') {
      setTimeout(() => startModalTransform('translate'), 800);
    }

    // Auto-import pending Sheet Metal part sent from /sheet-metal/
    const pendingSheetMetal = consumePendingSheetMetalForStudio();
    const isSheetMetalParam = params.get('sheetMetal') === 'import';
    if (pendingSheetMetal || isSheetMetalParam) {
      if (pendingSheetMetal) {
        setSheetMetalInitialSpec(pendingSheetMetal);
      }
      setSheetMetalModalOpen(true);
      setToastMessage(isTr ? '📐 Sac Levha Modülü verileri 3B Stüdyoya aktarıldı' : '📐 Sheet metal imported into 3D Studio');
      setTimeout(() => setToastMessage(null), 3000);
    }
  }, [setCurrentWorkbench, isTr]);

  // Store bindings
  const parts = useDesignStore((s) => s.parts);
  const selectedId = useDesignStore((s) => s.selectedId);
  const selected = useDesignStore((s) => s.getSelected());

  // Automatically open right inspector when a part is selected
  useEffect(() => {
    if (selectedId) {
      setRightOpen(true);
    }
  }, [selectedId]);
  const addPart = useDesignStore((s) => s.addPart);
  const addTSlotPart = useDesignStore((s) => s.addTSlotPart);
  const deleteSelected = useDesignStore((s) => s.deleteSelected);
  const duplicateSelected = useDesignStore((s) => s.duplicateSelected);
  const tool = useDesignStore((s) => s.tool);
  const setTool = useDesignStore((s) => s.setTool);
  const renderMode = useDesignStore((s) => s.renderMode);
  const setRenderMode = useDesignStore((s) => s.setRenderMode);
  const sectionAxis = useDesignStore((s) => s.sectionAxis);
  const setSectionAxis = useDesignStore((s) => s.setSectionAxis);
  const sectionOffset = useDesignStore((s) => s.sectionOffset);
  const setSectionOffset = useDesignStore((s) => s.setSectionOffset);
  const explodeFactor = useDesignStore((s) => s.explodeFactor);
  const setExplodeFactor = useDesignStore((s) => s.setExplodeFactor);
  const showCenterOfGravity = useDesignStore((s) => s.showCenterOfGravity);
  const setShowCenterOfGravity = useDesignStore((s) => s.setShowCenterOfGravity);
  const selectedMaterialId = useDesignStore((s) => s.selectedMaterialId);
  const setSelectedMaterialId = useDesignStore((s) => s.setSelectedMaterialId);
  const updateSelectedParams = useDesignStore((s) => s.updateSelectedParams);
  const updateSelectedTransform = useDesignStore((s) => s.updateSelectedTransform);
  const setSelectedColor = useDesignStore((s) => s.setSelectedColor);
  const openMateModal = useDesignStore((s) => s.openMateModal);
  const openFastenersModal = useDesignStore((s) => s.openFastenersModal);
  const mates = useDesignStore((s) => s.mates);
  const activeFace = useDesignStore((s) => s.activeFace);

  // 3 Primary CAD Modes: 1. PARÇA | 2. KAYNAK + ÇATMA + İŞLEME | 3. MONTAJ
  const cadMode = useDesignStore((s) => s.cadMode);
  const setCadMode = useDesignStore((s) => s.setCadMode);
  const weldBeads = useDesignStore((s) => s.weldBeads);
  const isWeldModalOpen = useDesignStore((s) => s.isWeldModalOpen);
  const openWeldModal = useDesignStore((s) => s.openWeldModal);
  const closeWeldModal = useDesignStore((s) => s.closeWeldModal);
  const loadSampleWeldedChassis = useDesignStore((s) => s.loadSampleWeldedChassis);
  const autoWeldAdjacentParts = useDesignStore((s) => s.autoWeldAdjacentParts);

  // Store modal states & actions
  const showSheetMetalModal = useDesignStore((s) => s.showSheetMetalModal);
  const sheetMetalEditingPartIdStore = useDesignStore((s) => s.sheetMetalEditingPartId);
  const sheetMetalInitialSpecStore = useDesignStore((s) => s.sheetMetalInitialSpec);
  const sheetMetalInitialTabStore = useDesignStore((s) => s.sheetMetalInitialTab);
  const openSheetMetalModal = useDesignStore((s) => s.openSheetMetalModal);
  const closeSheetMetalModal = useDesignStore((s) => s.closeSheetMetalModal);

  const showDynamicBlockModal = useDesignStore((s) => s.showDynamicBlockModal);
  const dynamicBlockEditingPartId = useDesignStore((s) => s.dynamicBlockEditingPartId);
  const dynamicBlockId = useDesignStore((s) => s.dynamicBlockId);
  const dynamicBlockInitialParams = useDesignStore((s) => s.dynamicBlockInitialParams);
  const openDynamicBlockModal = useDesignStore((s) => s.openDynamicBlockModal);
  const closeDynamicBlockModal = useDesignStore((s) => s.closeDynamicBlockModal);

  // Listen to right-click context menu "Edit Dimensions & Parameters" focus request
  useEffect(() => {
    const handleFocusTab = (e: any) => {
      const tab = e.detail;
      if (tab) {
        setInspectorTab(tab);
        setRightOpen(true);
      }
    };
    window.addEventListener('alucalc:focus-inspector-tab', handleFocusTab);
    return () => window.removeEventListener('alucalc:focus-inspector-tab', handleFocusTab);
  }, []);

  // Listen to system & contour engine toast notifications
  useEffect(() => {
    const handleToast = (e: any) => {
      if (e.detail) {
        ping(e.detail);
      }
    };
    window.addEventListener('alucalc:toast', handleToast);
    return () => window.removeEventListener('alucalc:toast', handleToast);
  }, []);

  const massProps = useMemo(() => {
    return calculateAssemblyMassProperties(parts);
  }, [parts]);

  const ping = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2600);
  };

  // ⚡ Blender Modal Transform Helpers
  const startModalTransform = useCallback((mode: ModalTransformMode) => {
    const store = useDesignStore.getState();
    const sel = store.getSelected();
    if (!sel || sel.grounded || sel.locked) {
      ping(t12(language, 'Select an unlocked component first', 'Önce kilitli olmayan bir bileşen seçin'));
      return;
    }
    startPointerRef.current = { ...cursorPos };
    setModalTransform({
      active: true,
      mode,
      axisLock: mode === 'rotate' ? 'z' : null,
      numericBuffer: '',
      initialSnapshot: {
        position: { ...sel.position },
        rotation: { ...sel.rotation },
        scale: { ...sel.scale },
      },
      partId: sel.id,
      partName: sel.name,
      currentDelta: mode === 'scale' ? 1.0 : 0.0,
    });
    setSolidWorksHudOpen(false);
  }, [cursorPos, language]);

  const commitModalTransform = useCallback(() => {
    setModalTransform((prev) => {
      if (!prev.active || !prev.partId) return prev;
      const store = useDesignStore.getState();
      store.pushHistory();
      if (prev.mode === 'scale') {
        store.bakeScaleToParams(prev.partId);
      }
      store.applyMates();
      const finalVal = prev.numericBuffer !== '' ? parseFloat(prev.numericBuffer) : prev.currentDelta;
      ping(t12(language, `Transform committed (${finalVal})`, `Dönüşüm uygulandı (${finalVal})`));
      return INITIAL_MODAL_TRANSFORM_STATE;
    });
  }, [language]);

  const cancelModalTransform = useCallback(() => {
    setModalTransform((prev) => {
      if (!prev.active || !prev.partId || !prev.initialSnapshot) return prev;
      useDesignStore.getState().updateSelectedTransform({
        position: prev.initialSnapshot.position,
        rotation: prev.initialSnapshot.rotation,
        scale: prev.initialSnapshot.scale,
      });
      ping(t12(language, 'Transform aborted', 'Dönüşüm iptal edildi'));
      return INITIAL_MODAL_TRANSFORM_STATE;
    });
  }, [language]);

  const handleModalAxisLock = useCallback((axis: 'x' | 'y' | 'z') => {
    setModalTransform((prev) => {
      if (!prev.active || !prev.initialSnapshot || !prev.mode) return prev;
      const newAxis = prev.axisLock === axis ? null : axis;
      const val = prev.numericBuffer !== '' ? parseFloat(prev.numericBuffer) : prev.currentDelta;
      const updated = computeModalTransform(prev.initialSnapshot, prev.mode, newAxis, val);
      useDesignStore.getState().updateSelectedTransform(updated);
      return { ...prev, axisLock: newAxis };
    });
  }, []);

  // Keyboard Shortcuts (Blender Modals + SolidWorks 'S' Key + QWER Gizmos)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // If modal transform is active: process modal keys
      if (modalTransform.active) {
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelModalTransform();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          commitModalTransform();
          return;
        }
        if (e.key === 'x' || e.key === 'X') {
          e.preventDefault();
          if (e.shiftKey) {
            setModalTransform((prev) => {
              if (!prev.initialSnapshot || !prev.mode) return prev;
              const updated = computeModalTransform(prev.initialSnapshot, prev.mode, 'yz', prev.currentDelta);
              useDesignStore.getState().updateSelectedTransform(updated);
              return { ...prev, axisLock: 'yz' };
            });
          } else {
            handleModalAxisLock('x');
          }
          return;
        }
        if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          if (e.shiftKey) {
            setModalTransform((prev) => {
              if (!prev.initialSnapshot || !prev.mode) return prev;
              const updated = computeModalTransform(prev.initialSnapshot, prev.mode, 'xz', prev.currentDelta);
              useDesignStore.getState().updateSelectedTransform(updated);
              return { ...prev, axisLock: 'xz' };
            });
          } else {
            handleModalAxisLock('y');
          }
          return;
        }
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) {
            setModalTransform((prev) => {
              if (!prev.initialSnapshot || !prev.mode) return prev;
              const updated = computeModalTransform(prev.initialSnapshot, prev.mode, 'xy', prev.currentDelta);
              useDesignStore.getState().updateSelectedTransform(updated);
              return { ...prev, axisLock: 'xy' };
            });
          } else {
            handleModalAxisLock('z');
          }
          return;
        }
        // Numeric input buffer (digits 0-9, minus, period)
        if (/^[0-9.-]$/.test(e.key)) {
          e.preventDefault();
          setModalTransform((prev) => {
            if (!prev.initialSnapshot || !prev.mode) return prev;
            const newBuf = prev.numericBuffer + e.key;
            const num = parseFloat(newBuf);
            const val = isNaN(num) ? 0 : num;
            const updated = computeModalTransform(prev.initialSnapshot, prev.mode, prev.axisLock, val);
            useDesignStore.getState().updateSelectedTransform(updated);
            return { ...prev, numericBuffer: newBuf, currentDelta: val };
          });
          return;
        }
        if (e.key === 'Backspace') {
          e.preventDefault();
          setModalTransform((prev) => {
            if (!prev.initialSnapshot || !prev.mode) return prev;
            const newBuf = prev.numericBuffer.slice(0, -1);
            const num = parseFloat(newBuf);
            const val = isNaN(num) ? 0 : num;
            const updated = computeModalTransform(prev.initialSnapshot, prev.mode, prev.axisLock, val);
            useDesignStore.getState().updateSelectedTransform(updated);
            return { ...prev, numericBuffer: newBuf, currentDelta: val };
          });
          return;
        }
        return;
      }

      // If modal transform is NOT active: standard & modal triggers
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCommandBarOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        const store = useDesignStore.getState();
        if (solidWorksHudOpen) {
          setSolidWorksHudOpen(false);
          return;
        }
        if (store.sketchPoints.length > 0) {
          store.endCurrentLineSegment();
          return;
        }
        store.setActiveFace(null);
        setCommandBarOpen(false);
        setTemplatesMenuOpen(false);
      }

      // Blender Modal Triggers: G (Grab), R (Rotate)
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        startModalTransform('translate');
        return;
      }

      // SolidWorks 'S' Key Shortcut Bar vs. Modal Scale (Alt+S / Shift+S)
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (e.altKey || e.shiftKey) {
          startModalTransform('scale');
        } else {
          setSolidWorksHudOpen((prev) => !prev);
        }
        return;
      }

      if (e.key === 'q' || e.key === 'Q') {
        useDesignStore.getState().setTool('select');
      } else if (e.key === 'w' || e.key === 'W') {
        useDesignStore.getState().setTool('move');
        ping(t12(language, 'Translate Gizmo Activated (W)', '3D Taşıma Gizmosu Aktif (W)'));
      } else if (e.key === 'e' || e.key === 'E') {
        useDesignStore.getState().setTool('rotate');
        ping(t12(language, 'Rotate Gizmo Activated (E)', '3D Döndürme Gizmosu Aktif (E)'));
      } else if (e.key === 'r' || e.key === 'R') {
        if (useDesignStore.getState().selectedId) {
          startModalTransform('rotate');
        } else {
          useDesignStore.getState().setTool('scale');
          ping(t12(language, 'Scale Gizmo Activated (R)', '3D Ölçekleme Gizmosu Aktif (R)'));
        }
      } else if (e.key === 'j' || e.key === 'J') {
        useDesignStore.getState().openMateModal();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (useDesignStore.getState().selectedId) {
          useDesignStore.getState().deleteSelected();
          ping(t12(language, 'Part deleted', 'Parça silindi'));
        }
      } else if (e.key === 'f' || e.key === 'F' || e.key === 'z' || e.key === 'Z') {
        triggerCameraView('fit');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    language,
    modalTransform,
    solidWorksHudOpen,
    startModalTransform,
    commitModalTransform,
    cancelModalTransform,
    handleModalAxisLock,
  ]);

  const handleQuickAddItem = (
    itemKind: DesignKind | 'gear-pair' | 'bearing-6205' | 'tslot-40'
  ) => {
    const store = useDesignStore.getState();
    if (itemKind === 'gear-pair') {
      store.addGearPair({
        module: 2.0,
        z1: 18,
        z2: 36,
        faceWidth: 20,
        pressureAngle: 20,
        bore1: 12,
        bore2: 18,
        hasKeyway: true,
      });
      ping(t12(language, 'Added Mating Spur Gear Pair (m=2, z1=18, z2=36)', 'Eşleşen Dişli Çifti Eklendi (m=2, z1=18, z2=36)'));
    } else if (itemKind === 'bearing-6205') {
      store.addStandardBearing({
        designation: '6205',
        d: 25,
        D: 52,
        B: 15,
        type: 'deep-groove-ball',
        Cr: 14.8,
        C0: 7.8,
      });
      ping(t12(language, 'Added ISO 15 6205 Ball Bearing', 'ISO 15 6205 Bilyalı Rulman Eklendi'));
    } else if (itemKind === 'tslot-40') {
      addTSlotPart('40x40', 200);
      ping(t12(language, 'Added 40x40 T-Slot Extrusion (200mm)', '40x40 Sigma Profil Eklendi (200mm)'));
    } else {
      addPart(itemKind);
      ping(t12(language, `Added ${itemKind}`, `${itemKind} sahneye eklendi`));
    }
    setRightOpen(true);
    setTimeout(() => triggerCameraView('fit'), 60);
  };

  const isAiConnected = useAIReady();
  const [isQuickAiBusy, setIsQuickAiBusy] = useState(false);

  const handleQuickSynthesize = async (useAiApi = false) => {
    const promptText = quickPrompt.trim();
    if (!promptText) return;
    setIsQuickAiBusy(true);
    try {
      const generated = useAiApi
        ? await generateSolidWithAI(promptText)
        : generateSolidFromPrompt(promptText);
      const store = useDesignStore.getState();
      store.pushHistory();

      if (generated.assemblyParts && generated.assemblyParts.length > 0) {
        const assemblyParts = generated.assemblyParts;
        useDesignStore.setState((s) => ({
          parts: [...s.parts, ...assemblyParts],
          selectedId: assemblyParts[0]?.id || null,
        }));
      } else {
        const newPartId = `solid-${Date.now().toString(36)}`;
        const newPart = {
          id: newPartId,
          name: generated.name,
          kind: generated.kind,
          params: generated.params,
          outer: generated.outer,
          inner: generated.inner,
          solidOp: generated.solidOp,
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          color: generated.color,
          visible: true,
          locked: false,
          parentId: null,
          holes: generated.holes || [],
          cuts: generated.cuts || [],
        };
        useDesignStore.setState((s) => ({
          parts: [...s.parts, newPart],
          selectedId: newPartId,
          holes: generated.holes || [],
          cuts: generated.cuts || [],
        }));
      }

      if (generated.materialId) {
        store.setSelectedMaterialId(generated.materialId);
      }
      setQuickPrompt('');
      setRightOpen(true);
      setTimeout(() => triggerCameraView('fit'), 80);
      const dfmNote = generated.dfm ? ` (DFM: %${generated.dfm.score})` : '';
      const massNote = generated.estimatedMassKg ? ` · ${generated.estimatedMassKg} kg` : '';
      const partCountNote = generated.assemblyParts?.length ? ` (${generated.assemblyParts.length} Parçalı Montaj)` : '';
      ping(
        language === 'tr'
          ? `⚡ 3D Katı Model Üretildi: ${generated.name}${partCountNote}${massNote}${dfmNote}`
          : `⚡ Synthesized 3D Solid: ${generated.name}${partCountNote}${massNote}${dfmNote}`
      );
    } catch (err: any) {
      ping(err?.message || t12(language, 'Could not parse part specification', 'Parça tanımı çözümlenemedi'));
    } finally {
      setIsQuickAiBusy(false);
    }
  };

  const handleRunInterferenceCheck = () => {
    const interferences = useDesignStore.getState().checkInterference();
    if (interferences.length === 0) {
      ping(t12(language, 'No interference found: All parts clear!', 'Çakışma tespit edilmedi: Tüm parçalar temiz!'));
    } else {
      const first = interferences[0];
      ping(
        t12(
          language,
          `⚠️ ${interferences.length} Interference(s) detected! e.g. ${first.partA.name} & ${first.partB.name} (${first.distanceMm}mm)`,
          `⚠️ ${interferences.length} Girişim/Çakışma tespit edildi! Örn: ${first.partA.name} ile ${first.partB.name} (${first.distanceMm}mm)`
        )
      );
    }
  };

  const handleExportSTL = () => {
    if (parts.length === 0) {
      ping(t12(language, 'Scene is empty!', 'Sahne boş!'));
      return;
    }
    const stlStr = exportPartsToSTL(parts, 'ALUCALC_ASSEMBLY');
    downloadFile(stlStr, 'ALUCALC_ASSEMBLY.stl', 'application/sla');
    ping(t12(language, 'Assembly exported as STL', 'Montaj STL olarak indirildi'));
  };

  const handleExportSTEP = () => {
    if (parts.length === 0) {
      ping(t12(language, 'Scene is empty!', 'Sahne boş!'));
      return;
    }
    const stepStr = generateAssemblyStep(parts);
    downloadStepFile(stepStr, 'ALUCALC_ASSEMBLY.step');
    ping(t12(language, 'Assembly exported as ISO 10303 STEP', 'Montaj ISO 10303 STEP olarak indirildi'));
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const res = await loadCADFile(file);
        if (res && res.success) {
          ping(
            t12(
              language,
              `Imported ${file.name} (${res.partCount} parts)`,
              `${file.name} başarıyla içe aktarıldı (${res.partCount} parça)`
            )
          );
          triggerCameraView('fit');
        } else {
          ping(res?.message || `Error importing ${file.name}`);
        }
      } catch (err) {
        console.error('Import Error:', err);
        ping(`Error importing ${file.name}`);
      }
    }
    e.target.value = '';
  };

  const handleRemoveHoleFromSelected = (holeId: string) => {
    if (!selected) return;
    const store = useDesignStore.getState();
    store.pushHistory();
    const updatedHoles = (selected.holes || []).filter((h) => h.id !== holeId);
    store.updatePart(selected.id, { holes: updatedHoles });
    store.removeHole(holeId);
    ping(t12(language, 'Removed hole feature', 'Delik unsuru kaldırıldı'));
  };

  const handleRemoveCutFromSelected = (cutId: string) => {
    if (!selected) return;
    const store = useDesignStore.getState();
    store.pushHistory();
    const updatedCuts = (selected.cuts || []).filter((c) => c.id !== cutId);
    store.updatePart(selected.id, { cuts: updatedCuts });
    store.removeCut(cutId);
    ping(t12(language, 'Removed pocket/cut feature', 'Cep/kanal unsuru kaldırıldı'));
  };

  return (
    <div
      onPointerMove={(e) => {
        setCursorPos({ x: e.clientX, y: e.clientY });
        if (
          modalTransform.active &&
          modalTransform.initialSnapshot &&
          modalTransform.mode &&
          modalTransform.numericBuffer === ''
        ) {
          const dx = e.clientX - startPointerRef.current.x;
          const dy = e.clientY - startPointerRef.current.y;
          let delta = 0;
          if (modalTransform.mode === 'translate') {
            delta = Math.round((dx - dy) * 0.5 * 10) / 10;
          } else if (modalTransform.mode === 'rotate') {
            delta = Math.round((dx - dy) * 0.5);
          } else if (modalTransform.mode === 'scale') {
            delta = Math.max(0.05, Math.round((1.0 + (dx - dy) * 0.005) * 100) / 100);
          }
          const updated = computeModalTransform(
            modalTransform.initialSnapshot,
            modalTransform.mode,
            modalTransform.axisLock,
            delta
          );
          useDesignStore.getState().updateSelectedTransform(updated);
          setModalTransform((prev) => ({ ...prev, currentDelta: delta }));
        }
      }}
      onClick={() => {
        if (modalTransform.active) {
          commitModalTransform();
        }
      }}
      onContextMenu={(e) => {
        if (modalTransform.active) {
          e.preventDefault();
          cancelModalTransform();
        }
      }}
      className="flex flex-1 h-full min-h-0 w-full flex-col overflow-hidden bg-[var(--bg-0)] text-slate-200 select-none font-mono"
    >
      {/* Hidden File Input for Real CAD Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".stl,.obj,.gltf,.glb,.step,.stp,.x_t,.x_b,.iges,.igs"
        multiple
        className="hidden"
        onChange={handleFileImport}
      />

      {/* ─── TIER 1: V2 WORKBENCH TOP RIBBON ─── */}
      <WorkbenchHeader
        currentWorkbench={currentWorkbench}
        onSelectWorkbench={(wb) => {
          setCurrentWorkbench(wb);
          if (wb === 'cad') {
            setPartStudioOpen(true);
            setPartStudioOpenStore(true);
            setWeldStudioOpenStore(false);
          } else if (wb === 'weldment') {
            setWeldStudioOpenStore(true);
            setPartStudioOpen(false);
            setPartStudioOpenStore(false);
          } else if (wb === 'assembly') {
            setPartStudioOpen(false);
            setPartStudioOpenStore(false);
            setWeldStudioOpenStore(false);
            useDesignStore.getState().setCadMode('assembly');
            setLeftOpen(true);
            setLeftTab('tree');
          }
        }}
        onToggleV1Classic={() => {
          if (onToggleV1Classic) {
            onToggleV1Classic();
          } else {
            window.location.href = '/desk';
          }
        }}
        onExportSTL={handleExportSTL}
        onExportSTEP={handleExportSTEP}
        onOpenBom={() => setBomModalOpen(true)}
        onCheckInterference={handleRunInterferenceCheck}
        onOpenCommandBar={() => setCommandBarOpen(true)}
        onOpenTextToCad={() => setTextToCadModalOpen(true)}
      />

      {/* ─── TIER 2: 1-CLICK QUICK PRIMITIVES, ASSEMBLY TEMPLATES & INLINE AI SOLID SYNTHESIZER ─── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-b border-[var(--line)] bg-[var(--bg-0)] z-30 shrink-0 text-[10px]">
        {/* Left: 1-Click Quick Primitives & Machine Elements */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[9px] font-bold uppercase text-[var(--cyan)] mr-1 shrink-0">
            {isTr ? 'Hızlı Ekle:' : 'Quick Add:'}
          </span>
          {QUICK_PRIMITIVES.map((item) => (
            <button
              key={item.kind}
              type="button"
              onClick={() => handleQuickAddItem(item.kind)}
              className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--cyan)]/20 border border-[var(--line)] hover:border-[var(--cyan)]/50 text-slate-200 hover:text-[var(--cyan)] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              title={isTr ? `${item.labelTr} Ekle` : `Add ${item.labelEn}`}
            >
              <span>{item.icon}</span>
              <span>{isTr ? item.labelTr : item.labelEn}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setShapeCatalogOpen(true)}
            className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 border border-[var(--cyan)]/40 text-[var(--cyan)] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Plus size={11} />
            <span>{isTr ? 'Tüm Katalog' : 'Full Catalog'}</span>
          </button>

          {/* Ready-Made Multi-Part Assembly Templates Button */}
          <button
            type="button"
            onClick={() => setTemplatesMenuOpen(true)}
            className="px-2.5 py-1 rounded-[var(--radius-s)] bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm active:scale-95 ml-1"
            title={isTr ? 'Hazır Montaj Şablonları Penceresini Aç' : 'Open Assembly Templates Window'}
          >
            <Sparkles size={11} className="text-amber-400" />
            <span>{isTr ? 'Hazır Montaj Şablonları' : 'Assembly Templates'}</span>
            <ChevronDown size={11} className="text-amber-400/80" />
          </button>

          {/* Dynamic Blocks & Parametric Architecture/Furniture Library Button */}
          <button
            type="button"
            onClick={() => setDynBlockModalOpen(true)}
            className="px-2.5 py-1 rounded-[var(--radius-s)] bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm active:scale-95 ml-1"
            title={isTr ? 'DWG & AutoCAD Tarzı Dinamik Bloklar Kütüphanesi' : 'AutoCAD-Grade Dynamic Blocks Library'}
          >
            <Sparkles size={11} className="text-cyan-400" />
            <span>{isTr ? '⚡ Dinamik Bloklar' : '⚡ Dynamic Blocks'}</span>
          </button>

          {/* 📐 3D Sheet Metal & DIN 6935 Unfolder Button */}
          <button
            type="button"
            onClick={() => {
              setSheetMetalEditingPartId(null);
              setSheetMetalInitialSpec(null);
              setSheetMetalModalOpen(true);
            }}
            className="px-2.5 py-1 rounded-[var(--radius-s)] bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/45 text-violet-200 font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm active:scale-95 ml-1"
            title={isTr ? '3B Parametrik Sac Levha ve Açınım Simülatörü (DIN 6935)' : '3D Parametric Sheet Metal & Unfolder (DIN 6935)'}
          >
            <span className="text-violet-400 font-black">📐</span>
            <span>{isTr ? 'Sac Levha (Sheet Metal)' : 'Sheet Metal'}</span>
          </button>

          {/* 🎓 CAD Academy & Interactive Masterclasses Button */}
          <button
            type="button"
            onClick={() => setCadAcademyModalOpen(true)}
            className="px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--cyan)]/20 hover:bg-[var(--cyan)]/30 border border-[var(--cyan)]/45 text-[var(--cyan)] font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm active:scale-95 ml-1"
            title={isTr ? 'CAD Akademisi (SolidWorks, Inventor, NX, CATIA, Blender Eğitimleri)' : 'CAD Academy (Interactive Masterclasses)'}
          >
            <span className="font-black">🎓</span>
            <span>{isTr ? 'CAD Akademisi' : 'CAD Academy'}</span>
          </button>
        </div>

        {/* Right: Inline AeGiS Natural Language & Multimodal AI 3D Solid Synthesizer */}
        <div className="hidden xl:flex items-center gap-1.5 min-w-[340px] max-w-[480px] flex-1">
          <div className="relative flex-1">
            <Wand2 size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--cyan)]" />
            <input
              type="text"
              value={quickPrompt}
              onChange={(e) => setQuickPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuickSynthesize(isAiConnected);
              }}
              placeholder={
                isTr
                  ? 'Metinle 3D çiz: "4 delikli M12 flanş", "Ø25x120 kamalı mil"...'
                  : 'Type to generate 3D: "4-hole M12 flange", "Ø25x120 keyway shaft"...'
              }
              className="w-full h-7 pl-7 pr-2 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] text-[10.5px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--cyan)]"
            />
          </div>
          <button
            type="button"
            onClick={() => handleQuickSynthesize(false)}
            disabled={!quickPrompt.trim() || isQuickAiBusy}
            className="h-7 px-2 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:border-[var(--cyan)] border border-[var(--line)] disabled:opacity-40 text-[var(--ink)] font-bold text-[10px] cursor-pointer shrink-0"
            title={isTr ? 'Anında Parametrik Üret' : 'Instant Parametric Build'}
          >
            {isTr ? '+ Hızlı' : '+ Fast'}
          </button>
          <button
            type="button"
            onClick={() => handleQuickSynthesize(true)}
            disabled={!quickPrompt.trim() || isQuickAiBusy}
            className="h-7 px-2.5 rounded-[var(--radius-s)] bg-[var(--cyan)] hover:brightness-110 disabled:opacity-40 text-[var(--accent-ink)] font-extrabold text-[10px] cursor-pointer shrink-0 flex items-center gap-1"
            title={isTr ? 'Bağlı AI API Anahtarı ile Özel Çiz (/ai-connect)' : 'Synthesize Custom 3D with Connected AI API'}
          >
            <Sparkles size={11} />
            <span>{isQuickAiBusy ? '...' : isTr ? 'AI Çiz' : 'AI Draw'}</span>
          </button>
          <button
            type="button"
            onClick={() => setTextToCadModalOpen(true)}
            className="h-7 px-2 rounded-[var(--radius-s)] bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 border border-[var(--cyan)]/40 text-[var(--cyan)] font-bold text-[10px] cursor-pointer shrink-0"
            title={isTr ? 'Görsel (PNG/JPG) veya 2D PDF Teknik Resim Yükleyerek 3B Parça Çiz' : 'Upload Image or 2D PDF Drawing to Draw 3D Part'}
          >
            {isTr ? '📎 Görsel/PDF' : '📎 Img/PDF'}
          </button>
          <button
            type="button"
            onClick={() => setCadTrainingModalOpen(true)}
            className="h-7 px-2 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:border-[var(--cyan)] border border-[var(--line)] text-[var(--cyan)] font-bold text-[10px] cursor-pointer shrink-0 flex items-center gap-1"
            title={isTr ? 'AI CAD Eğitim Dosyaları, Kuralları & Prompt Kılavuzu' : 'AI CAD Training Knowledge & Prompt Hub'}
          >
            <GraduationCap size={12} />
            <span>{isTr ? '🎓 Eğitim' : '🎓 Training'}</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-[var(--radius-s)] bg-[var(--cyan)] text-black font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in">
          <Check size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── MAIN WORKSPACE ROW: LEFT DRAWER + 3D VIEWPORT + RIGHT INSPECTOR ─── */}
      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        {/* 1. LEFT SMART DRAWER (TREE & ENGINEERING SOLVERS) */}
        {leftOpen && (
          <aside data-tour="ds-left-panel" className="fixed md:relative inset-y-0 left-0 w-[250px] xl:w-[270px] max-w-[85vw] shrink-0 flex-none h-full border-r border-[var(--line)] bg-[var(--bg-1)] flex flex-col z-40 md:z-10 overflow-hidden shadow-2xl md:shadow-none">
            <div className="flex h-9 border-b border-[var(--line)] bg-[var(--bg-0)] shrink-0 items-center">
              <button
                type="button"
                onClick={() => setLeftTab('tree')}
                className={`flex-1 flex items-center justify-center gap-1.5 font-bold text-[10.5px] transition-colors cursor-pointer h-full ${
                  leftTab === 'tree'
                    ? 'bg-[var(--bg-1)] text-[var(--cyan)] border-b-2 border-[var(--cyan)]'
                    : 'text-[var(--alu-dim)] hover:text-white'
                }`}
              >
                <Layers size={13} />
                <span>{t12(language, 'FEATURE TREE', 'PARÇA AĞACI')}</span>
              </button>

              <button
                type="button"
                onClick={() => setLeftTab('solvers')}
                className={`flex-1 flex items-center justify-center gap-1.5 font-bold text-[10.5px] transition-colors cursor-pointer h-full ${
                  leftTab === 'solvers'
                    ? 'bg-[var(--bg-1)] text-amber-400 border-b-2 border-amber-400'
                    : 'text-[var(--alu-dim)] hover:text-white'
                }`}
              >
                <Wrench size={13} />
                <span>{t12(language, 'SOLVERS & STDS', 'STANDARTLAR')}</span>
              </button>

              <button
                type="button"
                onClick={() => setLeftOpen(false)}
                className="md:hidden p-1.5 text-slate-400 hover:text-white border-l border-[var(--line)] cursor-pointer"
                title="Kapat"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              {leftTab === 'tree' ? (
                <div className="h-full flex flex-col">
                  <div className="p-2 border-b border-[var(--line)] bg-[var(--bg-0)]/50 flex items-center justify-between gap-1 shrink-0">
                    <button
                      onClick={() => setShapeCatalogOpen(true)}
                      className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 text-[var(--cyan)] border border-[var(--cyan)]/40 font-bold text-[9.5px] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={11} />
                      <span>{t12(language, '+ Add Solid', '+ Katı Ekle')}</span>
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-white border border-[var(--line)] font-bold text-[9.5px] flex items-center gap-1 cursor-pointer"
                    >
                      <span>{t12(language, 'Import CAD', 'CAD Yükle')}</span>
                    </button>

                    <button
                      onClick={() => openFastenersModal()}
                      className="px-2 py-1 rounded-[var(--radius-s)] bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold text-[9.5px] flex items-center gap-1 cursor-pointer"
                    >
                      <span>{t12(language, 'Fasteners', 'Cıvatalar')}</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <AssemblyFeatureTree />
                  </div>

                  {/* Assembly Mass & Volume Live Readout Footer */}
                  <div className="p-2.5 border-t border-[var(--line)] bg-[var(--bg-0)] text-[10px] space-y-1">
                    <div className="flex items-center justify-between text-[var(--alu-dim)]">
                      <span>{isTr ? 'TOPLAM KÜTLE:' : 'TOTAL MASS:'}</span>
                      <span className="font-bold text-[var(--cyan)]">
                        {massProps.massKg.toFixed(3)} kg
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--alu-dim)]">
                      <span>{isTr ? 'TOPLAM HACİM:' : 'TOTAL VOLUME:'}</span>
                      <span className="font-bold text-white">
                        {massProps.volumeCm3.toFixed(1)} cm³
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <SolversDrawer />
              )}
            </div>
          </aside>
        )}

        {/* Toggle Left Drawer Button */}
        <button
          onClick={() => setLeftOpen(!leftOpen)}
          className={`absolute ${
            leftOpen ? 'left-[250px] xl:left-[270px]' : 'left-0'
          } top-1/2 -translate-y-1/2 z-30 p-1 rounded-r bg-[var(--bg-2)] border-y border-r border-[var(--line)] text-slate-400 hover:text-white transition-all cursor-pointer`}
          title={leftOpen ? 'Collapse Left Drawer' : 'Expand Left Drawer'}
        >
          {leftOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>

        {/* 2. CENTRAL 3D MASTER VIEWPORT */}
        <main data-tour="ds-viewport" className="relative flex-1 min-w-0 min-h-0 h-full overflow-hidden bg-[var(--bg-0)]">
          {partStudioOpen || isPartStudioOpenStore ? (
            <PartStudioHost onClose={() => {
              setPartStudioOpen(false);
              setPartStudioOpenStore(false);
            }} />
          ) : isWeldStudioOpenStore || currentWorkbench === 'weldment' ? (
            <WeldStudioHost onClose={() => {
              setWeldStudioOpenStore(false);
              setCurrentWorkbench('assembly');
              useDesignStore.getState().setCadMode('assembly');
            }} />
          ) : currentWorkbench === 'drawing' ? (
            <DrawingWorkbenchView onClose={() => setCurrentWorkbench('cad')} />
          ) : currentWorkbench === 'factory' ? (
            <FactoryWorkbenchView />
          ) : (
            <div className="w-full h-full relative">
              <DesignViewport />

              {/* TOP-CENTER CAD 3-MODE MASTER HUD: 1. PARÇA | 2. KAYNAK + ÇATMA + İŞLEME | 3. MONTAJ */}
              {(currentWorkbench === 'cad' || currentWorkbench === 'assembly') && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 max-w-[96vw] pointer-events-none">
                  {/* Row 1: The 3 Primary CAD Modes (Pill Segmented Switcher) */}
                  <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-[var(--radius-m)] bg-[var(--bg-0)]/95 border border-[var(--line-strong)] shadow-2xl font-mono text-[11px]">
                    {/* Mode 1: PARÇA -> Opens Part Studio */}
                    <button
                      type="button"
                      onClick={() => {
                        setCadMode('part');
                        setCurrentWorkbench('cad');
                        setPartStudioOpen(true);
                        setPartStudioOpenStore(true);
                      }}
                      className={`px-3 py-1 rounded-[var(--radius-s)] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                        cadMode === 'part'
                          ? 'bg-[var(--cyan)] text-black '
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                      title="1. Mod: Parça Stüdyosu (Parametrik Eskiz & B-Rep Katı Modelleme)"
                    >
                      <Box size={13} className={cadMode === 'part' ? 'text-black' : 'text-[var(--cyan)]'} />
                      <span>{t12(language, '1. PART STUDIO', '1. PARÇA STÜDYOSU')}</span>
                    </button>

                    {/* Mode 2: KAYNAKLI MONTAJ & İŞLEME -> Opens Weld Studio */}
                    <button
                      type="button"
                      onClick={() => {
                        setCadMode('weldment');
                        setCurrentWorkbench('weldment');
                        setWeldStudioOpenStore(true);
                      }}
                      className={`px-3 py-1 rounded-[var(--radius-s)] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                        cadMode === 'weldment'
                          ? 'bg-[var(--cyan)] text-[var(--accent-ink)] '
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                      title="2. Mod: Kaynak Stüdyosu (ISO 2553 Kaynaklı Çatma, Ekstrüzyon & Talaşlı İşleme)"
                    >
                      <Flame size={13} className={cadMode === 'weldment' ? 'text-black' : 'text-amber-400'} />
                      <span>{t12(language, '2. WELD STUDIO', '2. KAYNAK STÜDYOSU')}</span>
                      {weldBeads.length > 0 && (
                        <span className={`text-[9px] px-1 py-0.2 rounded font-black ${
                          cadMode === 'weldment' ? 'bg-black/30 text-amber-900' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {weldBeads.length}
                        </span>
                      )}
                    </button>

                    {/* Mode 3: MONTAJ -> Assembly with Mating only */}
                    <button
                      type="button"
                      onClick={() => {
                        setCadMode('assembly');
                        setCurrentWorkbench('assembly');
                        setPartStudioOpen(false);
                        setPartStudioOpenStore(false);
                        setWeldStudioOpenStore(false);
                      }}
                      className={`px-3 py-1 rounded-[var(--radius-s)] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                        cadMode === 'assembly'
                          ? 'bg-[var(--cyan)] text-[var(--accent-ink)] '
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                      title="3. Mod: Mekanik Montaj ve Kinematik (Sadece İlişkiler / Montaj / Mate)"
                    >
                      <Layers size={13} className={cadMode === 'assembly' ? 'text-black' : 'text-emerald-400'} />
                      <span>{t12(language, '3. ASSEMBLY', '3. MONTAJ')}</span>
                      {mates.length > 0 && (
                        <span className={`text-[9px] px-1 py-0.2 rounded font-black ${
                          cadMode === 'assembly' ? 'bg-black/30 text-emerald-900' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {mates.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Row 2: Contextual Tool Ribbon for the Active Mode */}
                  {cadMode === 'part' && (
                    <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-m)] bg-[var(--bg-0)]/95 border border-[var(--line-strong)] shadow-2xl text-[10px]">
                      {/* 2D Sketch Add on Face */}
                      <button
                        type="button"
                        onClick={() => {
                          setTool('select');
                          setPartStudioOpen(true);
                        }}
                        title={isTr ? 'Parça Stüdyosu: düzlem seç → çiz → ölçülendir → ekstrüzyon / döndür (düzenlenebilir)' : 'Part Studio: pick plane → sketch → dimension → extrude / revolve (fully editable)'}
                        className={`px-2 py-1 rounded-[var(--radius-s)] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                          tool === 'sketch-add'
                            ? 'bg-emerald-500 text-black'
                            : 'bg-[var(--bg-2)] text-slate-200 hover:text-[var(--cyan)]'
                        }`}
                      >
                        <span>✏️</span>
                        <span>{isTr ? 'Eskiz → Katı (Parça Stüdyosu)' : 'Sketch → Solid (Part Studio)'}</span>
                      </button>

                      {/* 2D Sketch Cut */}
                      <button
                        type="button"
                        onClick={() => {
                          setTool(tool === 'sketch-cut' ? 'select' : 'sketch-cut');
                          ping(isTr ? '2D Kesme Çizimi Aktif' : '2D Sketch Cut Active');
                        }}
                        className={`px-2 py-1 rounded-[var(--radius-s)] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                          tool === 'sketch-cut'
                            ? 'bg-rose-500 text-white'
                            : 'bg-[var(--bg-2)] text-slate-200 hover:text-rose-300'
                        }`}
                      >
                        <Scissors size={11} />
                        <span>{isTr ? 'Profil Kes' : 'Sketch Cut'}</span>
                      </button>

                      {/* Interactive Hole Wizard */}
                      <button
                        type="button"
                        onClick={() => {
                          setTool(tool === 'hole' ? 'select' : 'hole');
                          useDesignStore.getState().setClickToPlaceHole(tool !== 'hole');
                          ping(
                            isTr
                              ? 'Delik Sihirbazı: Parça yüzeyine tıklayarak ISO delik açın'
                              : 'Hole Wizard: Click any part face to drill ISO hole'
                          );
                        }}
                        className={`px-2 py-1 rounded-[var(--radius-s)] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                          tool === 'hole'
                            ? 'bg-[var(--cyan)] text-black'
                            : 'bg-[var(--bg-2)] text-slate-200 hover:text-[var(--cyan)]'
                        }`}
                      >
                        <CircleDot size={11} />
                        <span>{isTr ? 'Delik Del' : 'Drill Hole'}</span>
                      </button>

                      {/* 3D Caliper Measure Tool */}
                      <button
                        type="button"
                        onClick={() => {
                          setTool(tool === 'measure' ? 'select' : 'measure');
                          ping(
                            isTr
                              ? '3D Kumpas Ölçüm Modu: İki noktaya tıklayarak mesafe/çap ölçün'
                              : '3D Caliper Measure: Click two points on model'
                          );
                        }}
                        className={`px-2 py-1 rounded-[var(--radius-s)] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                          tool === 'measure'
                            ? 'bg-[var(--cyan)] text-[var(--accent-ink)]'
                            : 'bg-[var(--bg-2)] text-slate-200 hover:text-amber-300'
                        }`}
                      >
                        <Ruler size={11} />
                        <span>{isTr ? 'Kumpas' : 'Measure'}</span>
                      </button>

                      <div className="w-[1px] h-4 bg-[var(--line)] mx-0.5" />

                      {/* Cross-Section Plane Slicer */}
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-[var(--alu-dim)]">{isTr ? 'Kesit:' : 'Sec:'}</span>
                        {(['NONE', 'X', 'Y', 'Z'] as SectionAxis[]).map((ax) => (
                          <button
                            key={ax}
                            type="button"
                            onClick={() => setSectionAxis(ax)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                              sectionAxis === ax
                                ? 'bg-[var(--cyan)] text-black'
                                : 'bg-[var(--bg-2)] text-slate-400 hover:text-white'
                            }`}
                          >
                            {ax === 'NONE' ? (isTr ? 'Kapalı' : 'Off') : ax}
                          </button>
                        ))}
                        {sectionAxis !== 'NONE' && (
                          <input
                            type="range"
                            min={-60}
                            max={60}
                            step={1}
                            value={sectionOffset}
                            onChange={(e) => setSectionOffset(Number(e.target.value))}
                            className="w-16 accent-[var(--cyan)] cursor-pointer"
                            title={`Section Offset: ${sectionOffset} mm`}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mode 2: KAYNAK + ÇATMA + İŞLEME Ribbon */}
                  {cadMode === 'weldment' && (
                    <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-m)] bg-[var(--bg-0)]/95 border border-amber-500/50 shadow-2xl font-mono text-[10.5px]">
                      {/* + Kaynak Ekle */}
                      <button
                        type="button"
                        onClick={() => openWeldModal()}
                        className="px-2.5 py-1 rounded-[var(--radius-s)] bg-amber-500 hover:bg-amber-400 text-black font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <Flame size={12} />
                        <span>{t12(language, '+ Add Weld Bead', '+ Kaynak Ekle')}</span>
                      </button>

                      {/* Otomatik Çatma Kaynağı */}
                      {parts.length >= 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (parts[0] && parts[1]) {
                              autoWeldAdjacentParts(parts[0].id, parts[1].id, 6, 'fillet');
                              ping(isTr ? '⚡ Otomatik köşe kaynağı çatma noktasına eklendi' : '⚡ Auto fillet weld placed on joint');
                            }
                          }}
                          className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                          title="İki temas eden parçayı otomatik tespit et ve köşe kaynağı uygula"
                        >
                          <Sparkles size={11} className="text-amber-400" />
                          <span>{t12(language, 'Auto Fit-Up', 'Otomatik Çatma')}</span>
                        </button>
                      )}

                      <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

                      {/* Talaşlı İşleme / Frezeleme (Kesilebilir Kaynak!) */}
                      <button
                        type="button"
                        onClick={() => {
                          setTool(tool === 'sketch-cut' ? 'select' : 'sketch-cut');
                          ping(isTr ? '✂️ Talaşlı İşleme: Kaynak dikişini ve parçayı kesen cep/kanal çizin' : '✂️ Post-weld machining: Cut through weld & parts');
                        }}
                        className={`px-2 py-1 rounded-[var(--radius-s)] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                          tool === 'sketch-cut'
                            ? 'bg-rose-500 text-white shadow-md'
                            : 'bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300'
                        }`}
                        title="Kaynaklı yapıda talaşlı işleme (frezeleme/kesme) - Kaynaklar kesilir!"
                      >
                        <Scissors size={11} />
                        <span>{t12(language, 'Machining Cut', 'Talaşlı Kesim')}</span>
                      </button>

                      {/* Kaynağa Delik Del (Kesilebilir Kaynak!) */}
                      <button
                        type="button"
                        onClick={() => {
                          setTool(tool === 'hole' ? 'select' : 'hole');
                          useDesignStore.getState().setClickToPlaceHole(tool !== 'hole');
                          ping(isTr ? '🔘 Kaynak Delme: Yüzeye veya kaynağa tıklayarak delik delin' : '🔘 Drill hole through weld or member');
                        }}
                        className={`px-2 py-1 rounded-[var(--radius-s)] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                          tool === 'hole'
                            ? 'bg-[var(--cyan)] text-black'
                            : 'bg-[var(--bg-2)] text-slate-200 hover:text-[var(--cyan)]'
                        }`}
                        title="Kaynak sonrası delik delme (Boring / Drilling) - Kaynaklar delinir!"
                      >
                        <CircleDot size={11} />
                        <span>{t12(language, 'Drill Hole', 'Delik Del')}</span>
                      </button>

                      {/* 1-Click Welded Frame Sample */}
                      <button
                        type="button"
                        onClick={() => {
                          loadSampleWeldedChassis();
                          ping(isTr ? '🚀 Örnek Kaynaklı Şasi ve Talaşlı İşlenmiş Delikler Yüklendi' : '🚀 Sample Welded Chassis & Machined Welds Loaded');
                        }}
                        className="px-2 py-1 rounded-[var(--radius-s)] bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
                        title="Kesilebilir kaynakları ve talaşlı işlemeyi hemen denemek için hazır kaynaklı şasi yükleyin"
                      >
                        <span>🚀</span>
                        <span>{t12(language, 'Sample Chassis', 'Örnek Şasi')}</span>
                      </button>

                      <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

                      {/* Cross-Section Plane Slicer */}
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-[var(--alu-dim)]">{isTr ? 'Kesit:' : 'Sec:'}</span>
                        {(['NONE', 'X', 'Y', 'Z'] as SectionAxis[]).map((ax) => (
                          <button
                            key={ax}
                            type="button"
                            onClick={() => setSectionAxis(ax)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                              sectionAxis === ax
                                ? 'bg-[var(--cyan)] text-[var(--accent-ink)]'
                                : 'bg-[var(--bg-2)] text-slate-400 hover:text-white'
                            }`}
                          >
                            {ax === 'NONE' ? (isTr ? 'Kapalı' : 'Off') : ax}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mode 3: MONTAJ Ribbon */}
                  {cadMode === 'assembly' && (
                    <div className="pointer-events-auto flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-[var(--radius-m)] bg-[var(--bg-0)]/95 border border-emerald-500/50 shadow-2xl font-mono text-[11px] text-white">
                      <button
                        type="button"
                        onClick={() => openMateModal()}
                        className="px-2.5 py-1 rounded-[var(--radius-s)] bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <span>📎</span>
                        <span>{t12(language, '+ New Mate', '+ Yeni İlişki')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openFastenersModal()}
                        className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-emerald-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <span>⚡</span>
                        <span>{t12(language, 'Smart Fasteners', 'Akıllı Cıvatalar')}</span>
                      </button>

                      {/* Exploded View Slider */}
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--bg-1)] border border-[var(--line)] text-[10px]">
                        <span className="text-emerald-300 font-bold">{isTr ? 'Patlat:' : 'Explode:'}</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={explodeFactor}
                          onChange={(e) => setExplodeFactor(Number(e.target.value))}
                          className="w-16 accent-[var(--cyan)] cursor-pointer"
                        />
                        <span className="text-[9px] text-slate-300 w-7">{explodeFactor}%</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRunInterferenceCheck()}
                        className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-rose-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <span>🛡️</span>
                        <span>{t12(language, 'Check Interference', 'Çakışma')}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {currentWorkbench === 'fea' && (
                <FeaOverlay3D onClose={() => setCurrentWorkbench('cad')} />
              )}

              {currentWorkbench === 'cam' && (
                <CamOverlay3D onClose={() => setCurrentWorkbench('cad')} />
              )}

              {currentWorkbench === 'cost' && (
                <CostOverlayHud onClose={() => setCurrentWorkbench('cad')} />
              )}

              {/* Live DFM Machinability Health Indicator & In-Canvas Design Doctor */}
              {currentWorkbench === 'cad' && (
                <>
                  {selected && <DfmHealthIndicator selectedPart={selected} />}
                  <DesignDoctorHud onNotification={ping} />
                </>
              )}

              {/* Next-Gen Direct Face Modeling Capsule (Push-Pull & Smart Stamps) */}
              {currentWorkbench === 'cad' && selected && (tool === 'select' || tool === 'move' || tool === 'rotate' || tool === 'hole') && (
                <DirectFaceModelingBar
                  activeFace={activeFace || 'top'}
                  selectedPart={selected}
                  onNotification={ping}
                />
              )}
            </div>
          )}

          {/* Bottom-Left HUD: Camera Views + Render Style Switcher + Explode Slider */}
          <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-1.5 p-1.5 rounded-[var(--radius-s)] bg-[var(--bg-0)]/95 border border-[var(--line)] text-[9.5px]">
            <div className="flex items-center gap-1">
              <button
                onClick={() => triggerCameraView('iso')}
                className="px-2 py-0.5 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-white font-bold cursor-pointer"
              >
                ISO
              </button>
              <button
                onClick={() => triggerCameraView('top')}
                className="px-2 py-0.5 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-slate-300 cursor-pointer"
              >
                TOP
              </button>
              <button
                onClick={() => triggerCameraView('front')}
                className="px-2 py-0.5 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-slate-300 cursor-pointer"
              >
                FRONT
              </button>
              <button
                onClick={() => triggerCameraView('right')}
                className="px-2 py-0.5 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-slate-300 cursor-pointer"
              >
                RIGHT
              </button>
              <button
                onClick={() => triggerCameraView('fit')}
                className="px-2 py-0.5 rounded bg-[var(--cyan)]/20 text-[var(--cyan)] font-bold hover:bg-[var(--cyan)]/30 cursor-pointer"
              >
                FIT (Z)
              </button>
            </div>

            <div className="w-[1px] h-3.5 bg-[var(--line)]" />

            {/* Render Mode Selector */}
            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'solid', label: 'Solid' },
                  { id: 'edges', label: 'CAD' },
                  { id: 'wire', label: 'Wire' },
                  { id: 'xray', label: 'X-Ray' },
                  { id: 'pbr', label: 'PBR' },
                ] as Array<{ id: RenderMode; label: string }>
              ).map((rm) => (
                <button
                  key={rm.id}
                  type="button"
                  onClick={() => setRenderMode(rm.id)}
                  className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                    renderMode === rm.id
                      ? 'bg-[var(--cyan)] text-black'
                      : 'bg-[var(--bg-1)] text-slate-400 hover:text-white'
                  }`}
                >
                  {rm.label}
                </button>
              ))}
            </div>

            {parts.length > 1 && (
              <>
                <div className="w-[1px] h-3.5 bg-[var(--line)]" />
                <div className="flex items-center gap-1">
                  <span className="text-[var(--alu-dim)]">{isTr ? 'Patlat:' : 'Explode:'}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={explodeFactor}
                    onChange={(e) => setExplodeFactor(Number(e.target.value))}
                    className="w-14 accent-[var(--cyan)] cursor-pointer"
                  />
                </div>
              </>
            )}
          </div>
        </main>

        {/* Toggle Right Drawer Button */}
        <button
          onClick={() => setRightOpen(!rightOpen)}
          className={`absolute ${
            rightOpen ? 'right-[290px] xl:right-[320px]' : 'right-0'
          } top-1/2 -translate-y-1/2 z-30 p-1 rounded-l bg-[var(--bg-2)] border-y border-l border-[var(--line)] text-slate-400 hover:text-white transition-all cursor-pointer`}
          title={rightOpen ? 'Collapse Right Panel' : 'Expand Right Panel'}
        >
          {rightOpen ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* 3. RIGHT PARAMETERS, 3D TRANSFORM & ARRAY PATTERN INSPECTOR */}
        {rightOpen && (
          <aside data-tour="ds-inspector" className="fixed md:relative inset-y-0 right-0 w-[290px] xl:w-[320px] max-w-[88vw] shrink-0 flex-none h-full border-l border-[var(--line)] bg-[var(--bg-1)] flex flex-col z-40 md:z-10 overflow-hidden shadow-2xl md:shadow-none font-mono text-[11px]">
            {/* Header */}
            <div className="flex h-9 items-center justify-between px-3 border-b border-[var(--line)] bg-[var(--bg-0)] shrink-0">
              <div className="flex items-center gap-1.5 text-white font-bold text-xs">
                <Sliders size={13} className="text-[var(--cyan)]" />
                <span>{t12(language, 'PART EDITOR', 'PARÇA EDİTÖRÜ')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-[var(--bg-2)] text-[9px] text-[var(--cyan)] uppercase font-bold">
                  {selected ? selected.kind : isTr ? 'Seçim Yok' : 'None'}
                </span>
                <button
                  type="button"
                  onClick={() => setRightOpen(false)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  title="Kapat"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Quick Mode Filter Tabs (2D-Style Clarity in 3D) */}
            {selected && (
              <div className="grid grid-cols-4 gap-1 p-1.5 bg-[var(--bg-0)] border-b border-[var(--line)] shrink-0">
                {(
                  [
                    { id: 'all', labelTr: 'Tümü', labelEn: 'All' },
                    { id: 'dims', labelTr: '📏 Ölçü', labelEn: '📏 Dims' },
                    { id: 'features', labelTr: '🕳️ Delik/Cep', labelEn: '🕳️ Holes' },
                    { id: 'transform', labelTr: '🧭 Konum', labelEn: '🧭 Move' },
                  ] as const
                ).map((tb) => (
                  <button
                    key={tb.id}
                    type="button"
                    onClick={() => setInspectorTab(tb.id)}
                    className={`py-1 rounded text-[9.5px] font-bold cursor-pointer transition-colors ${
                      inspectorTab === tb.id
                        ? 'bg-[var(--cyan)] text-slate-950'
                        : 'bg-[var(--bg-1)] text-slate-400 hover:text-white border border-[var(--line)]'
                    }`}
                  >
                    {isTr ? tb.labelTr : tb.labelEn}
                  </button>
                ))}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {selected ? (
                <>
                  {/* 📐 Dedicated Sheet Metal Inspector Card */}
                  {selected.params?.sheetMetalSpec && (
                    <div className="p-2.5 rounded-[var(--radius-s)] bg-violet-950/20 border border-violet-500/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-black text-violet-300 uppercase tracking-wider flex items-center gap-1">
                          <span>📐</span>
                          <span>{isTr ? 'SAC LEVHA PARAMETRİK BÜKÜM' : 'SHEET METAL PARAMETRIC'}</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-[9px] font-bold text-violet-300">
                          DIN 6935
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        <div className="p-1.5 rounded bg-[var(--bg-0)] border border-[var(--line)]">
                          <span className="text-slate-500 block text-[9px]">{isTr ? 'Kalınlık (t)' : 'Thickness (t)'}</span>
                          <span className="font-bold text-white">{selected.params.sheetMetalSpec.thickness} mm</span>
                        </div>
                        <div className="p-1.5 rounded bg-[var(--bg-0)] border border-[var(--line)]">
                          <span className="text-slate-500 block text-[9px]">{isTr ? 'Büküm Sayısı' : 'Bends'}</span>
                          <span className="font-bold text-violet-300">{selected.params.sheetMetalSpec.bends?.length || 0}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSheetMetalEditingPartId(selected.id);
                            setSheetMetalInitialSpec(selected.params.sheetMetalSpec);
                            setSheetMetalModalOpen(true);
                          }}
                          className="w-full py-1.5 rounded bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/50 text-violet-200 font-bold text-[10px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>📐</span>
                          <span>{isTr ? 'Büküm & Açınımı Düzenle' : 'Edit Bends & Unfolding'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            savePendingSheetMetalForCalculator(selected.params.sheetMetalSpec);
                            window.open('/sheet-metal/', '_blank');
                          }}
                          className="w-full py-1.5 rounded bg-[var(--bg-0)] hover:bg-[var(--bg-2)] border border-[var(--line)] text-slate-300 hover:text-white font-bold text-[10px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <ExternalLink size={11} className="text-cyan-400" />
                          <span>{isTr ? '/sheet-metal/ Hesaplayıcıda Aç' : 'Open in /sheet-metal/'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 1. Selected Part Identity, Material & Color */}
                  {(inspectorTab === 'all' || inspectorTab === 'dims') && (
                    <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-[var(--cyan)] uppercase">
                          {t12(language, '1. IDENTITY & MATERIAL', '1. PARÇA KİMLİĞİ & MALZEME')}
                        </span>
                        <button
                          type="button"
                          onClick={() => duplicateSelected()}
                          className="px-1.5 py-0.5 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-[9px] text-white flex items-center gap-1 cursor-pointer"
                          title="Duplicate Part"
                        >
                          <Copy size={10} />
                          <span>{isTr ? 'Kopyala' : 'Clone'}</span>
                        </button>
                      </div>

                      <input
                        type="text"
                        value={selected.name}
                        onChange={(e) => useDesignStore.getState().setSelectedName(e.target.value)}
                        className="w-full bg-[var(--bg-1)] border border-[var(--line)] rounded px-2 py-1 text-white font-bold text-xs focus:outline-none focus:border-[var(--cyan)]"
                      />

                      {/* Engineering Alloy / Material Selector */}
                      <select
                        value={selected.materialId || selectedMaterialId}
                        onChange={(e) => {
                          const matId = e.target.value;
                          setSelectedMaterialId(matId);
                          useDesignStore.getState().updatePart(selected.id, { materialId: matId });
                          const found = STUDIO_MATERIALS.find((m) => m.id === matId);
                          if (found) setSelectedColor(found.color);
                        }}
                        className="w-full bg-[var(--bg-1)] border border-[var(--line)] rounded px-2 py-1 text-[10px] text-slate-200 focus:outline-none focus:border-[var(--cyan)]"
                      >
                        {STUDIO_MATERIALS.map((m) => (
                          <option key={m.id} value={m.id} className="bg-[var(--bg-1)] text-white">
                            {m.label}
                          </option>
                        ))}
                      </select>

                      {/* Quick Color Swatches & CoG Toggle */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1">
                          {[
                            '#6b9fff',
                            '#22d3ee',
                            '#34d399',
                            '#fbbf24',
                            '#f97316',
                            '#c084fc',
                            '#f43f5e',
                            '#94a3b8',
                          ].map((col) => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => setSelectedColor(col)}
                              style={{ backgroundColor: col }}
                              className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                                selected.color === col ? 'scale-115 border-white shadow-md' : 'border-transparent'
                              }`}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCenterOfGravity(!showCenterOfGravity)}
                          className={`px-1.5 py-0.5 rounded border text-[9px] font-bold cursor-pointer ${
                            showCenterOfGravity
                              ? 'bg-[var(--cyan)]/20 border-[var(--cyan)] text-[var(--cyan)]'
                              : 'bg-[var(--bg-2)] border-[var(--line)] text-slate-400'
                          }`}
                          title="Toggle Center of Gravity (CoG) Marker"
                        >
                          CoG
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ─── DEDICATED SHEET METAL CONTROLS IN PROPERTIES INSPECTOR ─── */}
                  {selected.params?.sheetMetalSpec && (
                    <div className="p-2.5 rounded-[var(--radius-s)] bg-gradient-to-br from-cyan-950/40 via-[var(--bg-0)] to-[var(--bg-1)] border border-cyan-500/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-mono font-bold text-cyan-300 flex items-center gap-1.5 uppercase">
                          <span>📐</span>
                          <span>{isTr ? 'SAC LEVHA BÜKÜM & AÇINIM' : 'SHEET METAL (DIN 6935)'}</span>
                        </span>
                        <span className="text-[8.5px] font-mono bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.2 rounded border border-cyan-500/30">
                          t={selected.params.sheetMetalSpec.thickness}mm
                        </span>
                      </div>

                      {/* Quick Info Matrix */}
                      <div className="grid grid-cols-3 gap-1 bg-[var(--bg-0)] p-1.5 rounded border border-white/5 text-[9.5px] font-mono">
                        <div className="flex flex-col">
                          <span className="text-slate-500 text-[8px]">Flanş F0</span>
                          <span className="text-white font-bold">{selected.params.sheetMetalSpec.firstFlange}mm</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-500 text-[8px]">Bükümler</span>
                          <span className="text-cyan-400 font-bold">{selected.params.sheetMetalSpec.bends?.length || 0} adet</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-500 text-[8px]">Delikler</span>
                          <span className="text-violet-400 font-bold">{selected.params.sheetMetalSpec.cutouts?.length || 0} adet</span>
                        </div>
                      </div>

                      {/* Primary Action: Open Sheet Metal Studio Modal */}
                      <button
                        type="button"
                        onClick={() => {
                          openSheetMetalModal(selected.id, selected.params.sheetMetalSpec, 'bends');
                        }}
                        className="w-full py-1.5 px-2 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-[10.5px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <span>📐</span>
                        <span>{isTr ? 'Sac Levha Stüdyosunda Düzenle' : 'Edit in Sheet Metal Studio'}</span>
                      </button>

                      {/* Secondary Abkant & DXF Actions */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            openSheetMetalModal(selected.id, selected.params.sheetMetalSpec, 'pressbrake');
                          }}
                          className="py-1 px-1.5 rounded bg-[var(--bg-1)] hover:bg-cyan-950/50 border border-white/8 text-slate-300 hover:text-cyan-300 text-[9px] font-mono font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <span>🚜</span>
                          <span>{isTr ? 'Abkant Büküm' : 'Bending Sim'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const spec = selected.params.sheetMetalSpec;
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
                          }}
                          className="py-1 px-1.5 rounded bg-[var(--bg-1)] hover:bg-emerald-950/50 border border-white/8 text-slate-300 hover:text-emerald-300 text-[9px] font-mono font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <Download size={10} className="text-emerald-400" />
                          <span>{isTr ? 'Açınım DXF' : 'Flat DXF'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ─── DEDICATED DYNAMIC BLOCK CONTROLS IN PROPERTIES INSPECTOR ─── */}
                  {Boolean(selected.params?.dynamicBlockId || selected.params?.dynamicParams) && (
                    <div className="p-2.5 rounded-[var(--radius-s)] bg-gradient-to-br from-amber-950/40 via-[var(--bg-0)] to-[var(--bg-1)] border border-amber-500/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-mono font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                          <span>⚙️</span>
                          <span>{isTr ? 'DİNAMİK BLOK (PARAMETRİK)' : 'DYNAMIC BLOCK (PARAMETRIC)'}</span>
                        </span>
                        <span className="text-[8.5px] font-mono bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
                          {selected.designStandard || 'ISO/DIN'}
                        </span>
                      </div>

                      <div className="text-[9.5px] font-mono text-slate-400 truncate">
                        ID: <span className="text-amber-300 font-bold">{selected.params.dynamicBlockId || selected.kind}</span>
                      </div>

                      {/* Primary Action: Open Dynamic Block Configurator Modal */}
                      <button
                        type="button"
                        onClick={() => {
                          openDynamicBlockModal(
                            selected.id,
                            selected.params.dynamicBlockId || null,
                            selected.params.dynamicParams || selected.params
                          );
                        }}
                        className="w-full py-1.5 px-2 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-[10.5px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <span>⚙️</span>
                        <span>{isTr ? 'Dinamik Bloğu Düzenle (Studio)' : 'Edit Dynamic Block (Studio)'}</span>
                      </button>
                    </div>
                  )}

                  {/* 2. Parametric Dimensions with Humanized Engineering Labels & Sliders */}
                  {(inspectorTab === 'all' || inspectorTab === 'dims') && (
                    <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-2.5">
                      <span className="text-[9px] font-bold text-[var(--cyan)] uppercase block">
                        {t12(language, '2. DIMENSIONS & EDGE MODIFIERS (MM)', '2. ÖLÇÜLER & KENAR PAH/RADYÜS (MM)')}
                      </span>
                      <div className="space-y-2">
                        {Object.entries(selected.params || {}).map(([key, val]) => {
                          if (typeof val !== 'number') return null;
                          // Filter out internal legacy surface cut keys
                          if (
                            key.startsWith('cut') ||
                            key === 'hasSurfaceCut' ||
                            key === 'sculptVersion'
                          ) {
                            return null;
                          }
                          const paramLabelMap: Record<string, { tr: string; en: string; unit: string }> = {
                            width: { tr: '↔ Genişlik (W)', en: '↔ Width (W)', unit: 'mm' },
                            height: { tr: '↕ Yükseklik (H)', en: '↕ Height (H)', unit: 'mm' },
                            depth: { tr: '⤢ Derinlik / Et (D)', en: '⤢ Depth (D)', unit: 'mm' },
                            length: { tr: '📏 Boy / Uzunluk (L)', en: '📏 Length (L)', unit: 'mm' },
                            diameter: { tr: '⭕ Dış Çap (ØD)', en: '⭕ Diameter (ØD)', unit: 'mm' },
                            innerDiameter: { tr: '⭕ İç Delik Çapı (Ød)', en: '⭕ Bore Dia (Ød)', unit: 'mm' },
                            outerDiameter: { tr: '⭕ Dış Çap (ØD)', en: '⭕ Outer Dia (ØD)', unit: 'mm' },
                            wall: { tr: '⫽ Et Kalınlığı (t)', en: '⫽ Wall Thick (t)', unit: 'mm' },
                            thickness: { tr: '⫽ Sac Kalınlığı (t)', en: '⫽ Thickness (t)', unit: 'mm' },
                            flangeW: { tr: '↔ Flanş Genişliği (b)', en: '↔ Flange Width (b)', unit: 'mm' },
                            webH: { tr: '↕ Gövde Yüksekliği (h)', en: '↕ Web Height (h)', unit: 'mm' },
                            flangeT: { tr: '⫽ Flanş Et Kalınlığı (tf)', en: '⫽ Flange Thick (tf)', unit: 'mm' },
                            webT: { tr: '⫽ Gövde Et Kalınlığı (tw)', en: '⫽ Web Thick (tw)', unit: 'mm' },
                            rootR: { tr: '◜ Köşe Radyüsü (R)', en: '◜ Root Fillet (R)', unit: 'mm' },
                            filletR: { tr: '◜ Kenar Yuvarlatma (R)', en: '◜ Edge Fillet (R)', unit: 'mm' },
                            chamferD: { tr: '📐 Kenar Pahı (C)', en: '📐 Edge Chamfer (C)', unit: 'mm' },
                            extrudeDepth: { tr: '↕ Ekstrüzyon Boyu (L)', en: '↕ Extrude Depth (L)', unit: 'mm' },
                            headSize: { tr: '⬡ Anahtar Ağzı (s)', en: '⬡ Hex Across Flats (s)', unit: 'mm' },
                            pitch: { tr: '〰 Hatve / Adım (P)', en: '〰 Pitch (P)', unit: 'mm' },
                            module: { tr: '⚙️ Dişli Modülü (m)', en: '⚙️ Gear Module (m)', unit: 'mm' },
                            teeth: { tr: '⚙️ Diş Sayısı (z)', en: '⚙️ Teeth Count (z)', unit: 'diş' },
                          };
                          const meta = paramLabelMap[key] || {
                            tr: key,
                            en: key,
                            unit: 'mm',
                          };
                          const numVal = Number(val) || 0;
                          const maxSlider = Math.max(250, Math.round(numVal * 2.5));
                          return (
                            <div key={key} className="space-y-1 p-1.5 rounded bg-[var(--bg-1)] border border-[var(--line)]/60">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-200 font-bold truncate pr-1">
                                  {isTr ? meta.tr : meta.en}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateSelectedParams({ [key]: Math.max(0.5, Math.round((numVal - 5) * 10) / 10) })
                                    }
                                    className="px-1 py-0.2 rounded bg-[var(--bg-2)] hover:bg-rose-500/20 text-rose-300 text-[9px] font-bold cursor-pointer"
                                  >
                                    -5
                                  </button>
                                  <input
                                    type="number"
                                    value={numVal}
                                    onChange={(e) => {
                                      updateSelectedParams({
                                        [key]: Math.max(0, Number(e.target.value) || 0),
                                      });
                                    }}
                                    className="w-14 bg-[var(--bg-0)] border border-[var(--line)] rounded px-1.5 py-0.5 text-right text-[var(--cyan)] font-bold text-[10.5px]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateSelectedParams({ [key]: Math.round((numVal + 5) * 10) / 10 })}
                                    className="px-1 py-0.2 rounded bg-[var(--bg-2)] hover:bg-emerald-500/20 text-emerald-300 text-[9px] font-bold cursor-pointer"
                                  >
                                    +5
                                  </button>
                                  <span className="text-[8.5px] text-[var(--alu-dim)]">{meta.unit}</span>
                                </div>
                              </div>
                              <input
                                type="range"
                                min={0.5}
                                max={maxSlider}
                                step={0.5}
                                value={numVal}
                                onChange={(e) =>
                                  updateSelectedParams({ [key]: Number(e.target.value) })
                                }
                                className="w-full h-1.5 accent-[var(--cyan)] cursor-pointer"
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Quick 1-Click Edge Fillet & Chamfer Bar for any 3D Part */}
                      <div className="pt-1 border-t border-[var(--line)] flex items-center justify-between gap-1.5">
                        <span className="text-[9px] text-slate-400 font-bold">
                          {isTr ? 'Hızlı Pah / Radyüs:' : 'Quick Edge:'}
                        </span>
                        <div className="flex items-center gap-1">
                          {[0, 2, 5, 10].map((rVal) => (
                            <button
                              key={`fillet-${rVal}`}
                              type="button"
                              onClick={() => {
                                updateSelectedParams({ filletR: rVal, rootR: rVal });
                                ping(
                                  rVal === 0
                                    ? isTr ? 'Köşe radyüsü sıfırlandı (Keskin Köşe)' : 'Reset edge fillet to sharp'
                                    : isTr ? `Köşe radyüsü R=${rVal}mm uygulandı` : `Applied R=${rVal}mm edge fillet`
                                );
                              }}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer border ${
                                Number(selected.params?.filletR || selected.params?.rootR || 0) === rVal
                                  ? 'bg-[var(--cyan)]/20 border-[var(--cyan)] text-[var(--cyan)]'
                                  : 'bg-[var(--bg-2)] border-[var(--line)] text-slate-300 hover:text-white'
                              }`}
                            >
                              R{rVal}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Exact 3D Position (X, Y, Z) & Rotation (Rx, Ry, Rz) */}
                  {(inspectorTab === 'all' || inspectorTab === 'transform') && (
                    <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-[var(--cyan)] uppercase">
                          {t12(language, '3. 3D POSITION & ROTATION', '3. 3D KONUM & DÖNDÜRME')}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const h = Number(selected.params?.height || selected.params?.diameter || 20);
                              const halfH = Math.round(h * (selected.scale?.y ?? 1) * 0.5 * 10) / 10;
                              updateSelectedTransform({
                                position: { ...selected.position, y: halfH },
                              });
                              ping(isTr ? 'Parça zemine (Y=0) oturtuldu' : 'Part dropped flush to floor (Y=0)');
                            }}
                            className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[8.5px] text-emerald-300 font-bold cursor-pointer"
                            title={isTr ? 'Parçayı Tabana Oturt (Y=0)' : 'Drop to Floor (Y=0)'}
                          >
                            {isTr ? 'Tabana Oturt' : 'Drop Y=0'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateSelectedTransform({
                                position: { x: 0, y: 0, z: 0 },
                                rotation: { x: 0, y: 0, z: 0 },
                              })
                            }
                            className="px-1.5 py-0.5 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-[8.5px] text-[var(--alu)] hover:text-white cursor-pointer"
                          >
                            0,0,0
                          </button>
                        </div>
                      </div>

                      {/* Position X, Y, Z */}
                      <div className="grid grid-cols-3 gap-1.5 text-[9.5px]">
                        {(['x', 'y', 'z'] as const).map((ax) => (
                          <div key={`pos-${ax}`} className="flex flex-col gap-0.5">
                            <span className="text-[8.5px] text-[var(--alu-dim)] uppercase">
                              Pos {ax.toUpperCase()} (mm)
                            </span>
                            <input
                              type="number"
                              value={Math.round((selected.position[ax] || 0) * 10) / 10}
                              onChange={(e) =>
                                updateSelectedTransform({
                                  position: { [ax]: Number(e.target.value) || 0 },
                                })
                              }
                              className="w-full bg-[var(--bg-1)] border border-[var(--line)] rounded px-1.5 py-1 text-white font-bold text-center"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Rotation Rx, Ry, Rz + Quick 90 deg buttons */}
                      <div className="grid grid-cols-3 gap-1.5 text-[9.5px] pt-1">
                        {(['x', 'y', 'z'] as const).map((ax) => (
                          <div key={`rot-${ax}`} className="flex flex-col gap-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[8.5px] text-[var(--alu-dim)] uppercase">
                                Rot {ax.toUpperCase()} (°)
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateSelectedTransform({
                                    rotation: {
                                      [ax]: ((selected.rotation[ax] || 0) + 90) % 360,
                                    },
                                  })
                                }
                                className="text-[8px] text-[var(--cyan)] hover:underline cursor-pointer"
                              >
                                +90°
                              </button>
                            </div>
                            <input
                              type="number"
                              value={Math.round(selected.rotation[ax] || 0)}
                              onChange={(e) =>
                                updateSelectedTransform({
                                  rotation: { [ax]: Number(e.target.value) || 0 },
                                })
                              }
                              className="w-full bg-[var(--bg-1)] border border-[var(--line)] rounded px-1.5 py-1 text-amber-300 font-bold text-center"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Linear Array, Circular Pattern & Mirror Cloner */}
                  {(inspectorTab === 'all' || inspectorTab === 'transform') && (
                    <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-2">
                      <span className="text-[9px] font-bold text-[var(--cyan)] uppercase block">
                        {t12(language, '4. PATTERN ARRAY & MIRROR', '4. DİZİ ÇOĞALTMA & AYNALAMA')}
                      </span>

                      {/* Linear Array Row */}
                      <div className="flex items-center gap-1 text-[9.5px]">
                        <select
                          value={arrayAxis}
                          onChange={(e) => setArrayAxis(e.target.value as 'x' | 'y' | 'z')}
                          className="bg-[var(--bg-1)] border border-[var(--line)] rounded px-1.5 py-1 text-white font-bold"
                        >
                          <option value="x">X Ekseni</option>
                          <option value="y">Y Ekseni</option>
                          <option value="z">Z Ekseni</option>
                        </select>
                        <input
                          type="number"
                          min={2}
                          max={12}
                          value={arrayCount}
                          onChange={(e) => setArrayCount(Math.max(2, Number(e.target.value) || 2))}
                          className="w-10 bg-[var(--bg-1)] border border-[var(--line)] rounded px-1 py-1 text-center text-white font-bold"
                          title="Adet (Count)"
                        />
                        <input
                          type="number"
                          value={arrayStepMm}
                          onChange={(e) => setArrayStepMm(Number(e.target.value) || 40)}
                          className="w-14 bg-[var(--bg-1)] border border-[var(--line)] rounded px-1 py-1 text-center text-[var(--cyan)] font-bold"
                          title="Adım Mesafesi (mm)"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const added = createLinearPartArray(
                              selected,
                              arrayAxis,
                              arrayCount,
                              arrayStepMm
                            );
                            ping(
                              isTr
                                ? `${added} adet doğrusal dizi parçası eklendi`
                                : `Created ${added} linear pattern instances`
                            );
                          }}
                          className="flex-1 py-1 px-2 rounded bg-[var(--cyan)]/20 hover:bg-[var(--cyan)]/30 border border-[var(--cyan)]/40 text-[var(--cyan)] font-bold cursor-pointer"
                        >
                          {isTr ? 'Diz' : 'Array'}
                        </button>
                      </div>

                      {/* Circular Polar Array Row */}
                      <div className="flex items-center gap-1 text-[9.5px]">
                        <span className="text-[9px] text-[var(--alu-dim)] w-14">360° Polar:</span>
                        <input
                          type="number"
                          min={3}
                          max={16}
                          value={polarCount}
                          onChange={(e) => setPolarCount(Math.max(3, Number(e.target.value) || 6))}
                          className="w-10 bg-[var(--bg-1)] border border-[var(--line)] rounded px-1 py-1 text-center text-white font-bold"
                          title="Adet"
                        />
                        <input
                          type="number"
                          value={polarRadiusMm}
                          onChange={(e) => setPolarRadiusMm(Number(e.target.value) || 45)}
                          className="w-14 bg-[var(--bg-1)] border border-[var(--line)] rounded px-1 py-1 text-center text-amber-300 font-bold"
                          title="Yarıçap R (mm)"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const added = createCircularPartArray(selected, polarCount, polarRadiusMm);
                            ping(
                              isTr
                                ? `${added} adet dairesel patern parçası dizildi`
                                : `Created ${added} polar pattern instances`
                            );
                          }}
                          className="flex-1 py-1 px-2 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold cursor-pointer"
                        >
                          {isTr ? '360° Diz' : 'Polar'}
                        </button>
                      </div>

                      {/* Mirror Buttons */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            mirrorSelectedPart(selected, 'x');
                            ping(isTr ? 'Parça X ekseninde aynalandı' : 'Mirrored across X axis');
                          }}
                          className="py-1 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-slate-200 text-[9.5px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <FlipHorizontal size={11} className="text-[var(--cyan)]" />
                          <span>{isTr ? 'X Aynala' : 'Mirror X'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            mirrorSelectedPart(selected, 'z');
                            ping(isTr ? 'Parça Z ekseninde aynalandı' : 'Mirrored across Z axis');
                          }}
                          className="py-1 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-slate-200 text-[9.5px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <FlipHorizontal size={11} className="text-amber-400" />
                          <span>{isTr ? 'Z Aynala' : 'Mirror Z'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 5. Surface Modifiers & Inline Editable Holes / Cuts Manager */}
                  {(inspectorTab === 'all' || inspectorTab === 'features') && (
                    <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-2.5">
                      <span className="text-[9px] font-bold text-[var(--cyan)] uppercase block">
                        {t12(language, '5. HOLES, POCKETS & CUTS (INLINE EDIT)', '5. DELİKLER, CEPLER & KANALLAR (CANLI DÜZENLE)')}
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const st = useDesignStore.getState();
                            st.addHole(selected.id, {
                              size: 'M6',
                              type: 'counterbore',
                              face: st.activeFace || 'top',
                              x: 0,
                              y: 0,
                              depth: 20,
                              throughAll: true,
                            });
                            ping(isTr ? 'Yüzeye M6 delik eklendi — aşağıdan ölçüsünü düzenleyebilirsiniz' : 'Added M6 hole');
                          }}
                          className="py-1.5 rounded-[var(--radius-s)] bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 text-[9px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CircleDot size={10} />
                          <span>{isTr ? '+ Delik Ekle' : '+ Add Hole'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPcdModalOpen(true)}
                          className="py-1.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-white text-[9px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CircleDot size={10} className="text-cyan-400" />
                          <span>{isTr ? 'PCD Flanş' : 'PCD Circle'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCutModalOpen(true)}
                          className="py-1.5 rounded-[var(--radius-s)] bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[9px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Scissors size={10} />
                          <span>{isTr ? '+ Cep/Kanal' : '+ Pocket'}</span>
                        </button>
                      </div>

                      {/* Inline Editable Active Holes List */}
                      {(selected.holes?.length || 0) > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[9px] text-[var(--alu-dim)]">
                            <span className="font-bold text-sky-300">
                              {isTr ? 'Aktif Delikler (Canlı Düzenle)' : 'Active Holes (Live Edit)'} ({selected.holes?.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                useDesignStore.getState().updatePart(selected.id, { holes: [] });
                                useDesignStore.getState().clearHoles();
                                ping(isTr ? 'Tüm delikler temizlendi' : 'Cleared all holes');
                              }}
                              className="text-rose-400 hover:underline cursor-pointer"
                            >
                              {isTr ? 'Tümünü Sil' : 'Clear All'}
                            </button>
                          </div>
                          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
                            {selected.holes?.map((h, hIdx) => (
                              <div
                                key={h.id}
                                className="p-1.5 rounded bg-[var(--bg-1)] border border-[var(--line)] space-y-1 text-[9px]"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[8.5px] text-slate-400 font-bold">#{hIdx + 1}</span>
                                  {/* ISO Size Selector */}
                                  <select
                                    value={h.size}
                                    onChange={(e) =>
                                      useDesignStore.getState().updateHole(selected.id, h.id, {
                                        size: e.target.value as any,
                                      })
                                    }
                                    className="bg-[var(--bg-0)] border border-[var(--line)] rounded px-1 py-0.5 text-[var(--cyan)] font-bold text-[9px]"
                                  >
                                    {['M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12', 'M14', 'M16', 'M20', 'M24'].map((sz) => (
                                      <option key={sz} value={sz}>
                                        {sz}
                                      </option>
                                    ))}
                                  </select>
                                  {/* Hole Type Selector */}
                                  <select
                                    value={h.type || 'clearance'}
                                    onChange={(e) =>
                                      useDesignStore.getState().updateHole(selected.id, h.id, {
                                        type: e.target.value as any,
                                      })
                                    }
                                    className="bg-[var(--bg-0)] border border-[var(--line)] rounded px-1 py-0.5 text-slate-200 text-[9px]"
                                  >
                                    <option value="clearance">Düz (Clearance)</option>
                                    <option value="tap">Diş (Tap)</option>
                                    <option value="counterbore">İmbus (CBore)</option>
                                    <option value="countersink">Havşa (CSink)</option>
                                  </select>
                                  {/* Face Selector */}
                                  <select
                                    value={h.face || 'top'}
                                    onChange={(e) =>
                                      useDesignStore.getState().updateHole(selected.id, h.id, {
                                        face: e.target.value as any,
                                      })
                                    }
                                    className="bg-[var(--bg-0)] border border-[var(--line)] rounded px-1 py-0.5 text-amber-300 text-[8.5px] uppercase"
                                  >
                                    {(['top', 'front', 'right', 'left', 'bottom', 'back'] as const).map((fc) => (
                                      <option key={fc} value={fc}>
                                        {fc.toUpperCase()}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveHoleFromSelected(h.id)}
                                    className="text-rose-400 hover:text-rose-300 px-1 cursor-pointer font-bold"
                                    title="Deliği Sil"
                                  >
                                    ✕
                                  </button>
                                </div>
                                {/* Inline X, Y, Depth inputs */}
                                <div className="grid grid-cols-3 gap-1">
                                  <label className="flex items-center gap-1 bg-[var(--bg-0)] px-1 py-0.5 rounded border border-[var(--line)]">
                                    <span className="text-[8px] text-slate-400">X:</span>
                                    <input
                                      type="number"
                                      value={h.x}
                                      onChange={(e) =>
                                        useDesignStore.getState().updateHole(selected.id, h.id, {
                                          x: Number(e.target.value) || 0,
                                        })
                                      }
                                      className="w-full bg-transparent text-white font-bold text-right text-[9px] focus:outline-none"
                                    />
                                  </label>
                                  <label className="flex items-center gap-1 bg-[var(--bg-0)] px-1 py-0.5 rounded border border-[var(--line)]">
                                    <span className="text-[8px] text-slate-400">Y:</span>
                                    <input
                                      type="number"
                                      value={h.y}
                                      onChange={(e) =>
                                        useDesignStore.getState().updateHole(selected.id, h.id, {
                                          y: Number(e.target.value) || 0,
                                        })
                                      }
                                      className="w-full bg-transparent text-white font-bold text-right text-[9px] focus:outline-none"
                                    />
                                  </label>
                                  <label className="flex items-center gap-1 bg-[var(--bg-0)] px-1 py-0.5 rounded border border-[var(--line)]">
                                    <span className="text-[8px] text-slate-400">Der:</span>
                                    <input
                                      type="number"
                                      value={h.depth ?? 20}
                                      onChange={(e) =>
                                        useDesignStore.getState().updateHole(selected.id, h.id, {
                                          depth: Math.max(1, Number(e.target.value) || 1),
                                        })
                                      }
                                      className="w-full bg-transparent text-emerald-300 font-bold text-right text-[9px] focus:outline-none"
                                    />
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Inline Editable Active Surface Cuts List */}
                      {(selected.cuts?.length || 0) > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[9px] text-[var(--alu-dim)]">
                            <span className="font-bold text-amber-300">
                              {isTr ? 'Aktif Cepler/Kanallar (Canlı Düzenle)' : 'Active Pockets (Live Edit)'} ({selected.cuts?.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                useDesignStore.getState().updatePart(selected.id, { cuts: [] });
                                useDesignStore.getState().clearCuts();
                                ping(isTr ? 'Tüm cepler temizlendi' : 'Cleared all pockets');
                              }}
                              className="text-rose-400 hover:underline cursor-pointer"
                            >
                              {isTr ? 'Tümünü Sil' : 'Clear All'}
                            </button>
                          </div>
                          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
                            {selected.cuts?.map((c, cIdx) => (
                              <div
                                key={c.id}
                                className="p-1.5 rounded bg-[var(--bg-1)] border border-[var(--line)] space-y-1 text-[9px]"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[8.5px] text-slate-400 font-bold">#{cIdx + 1}</span>
                                  <select
                                    value={c.type}
                                    onChange={(e) =>
                                      useDesignStore.getState().updateCut(selected.id, c.id, {
                                        type: e.target.value as any,
                                      })
                                    }
                                    className="bg-[var(--bg-0)] border border-[var(--line)] rounded px-1 py-0.5 text-amber-300 font-bold text-[9px]"
                                  >
                                    <option value="rect">Dikdörtgen Cep</option>
                                    <option value="slot">Kama Kanalı (Slot)</option>
                                    <option value="circle">Dairesel Havuz</option>
                                    <option value="chamfer">Kenar Pahı</option>
                                  </select>
                                  <select
                                    value={c.face || 'top'}
                                    onChange={(e) =>
                                      useDesignStore.getState().updateCut(selected.id, c.id, {
                                        face: e.target.value as any,
                                      })
                                    }
                                    className="bg-[var(--bg-0)] border border-[var(--line)] rounded px-1 py-0.5 text-[var(--cyan)] text-[8.5px] uppercase"
                                  >
                                    {(['top', 'front', 'right', 'left', 'bottom', 'back'] as const).map((fc) => (
                                      <option key={fc} value={fc}>
                                        {fc.toUpperCase()}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCutFromSelected(c.id)}
                                    className="text-rose-400 hover:text-rose-300 px-1 cursor-pointer font-bold"
                                    title="Cebi Sil"
                                  >
                                    ✕
                                  </button>
                                </div>
                                {/* Inline W, L, Depth, X, Y inputs */}
                                <div className="grid grid-cols-5 gap-1">
                                  <label className="flex flex-col bg-[var(--bg-0)] px-1 py-0.5 rounded border border-[var(--line)]">
                                    <span className="text-[7.5px] text-slate-400">W</span>
                                    <input
                                      type="number"
                                      value={c.width}
                                      onChange={(e) =>
                                        useDesignStore.getState().updateCut(selected.id, c.id, {
                                          width: Math.max(1, Number(e.target.value) || 1),
                                        })
                                      }
                                      className="w-full bg-transparent text-white font-bold text-[9px] focus:outline-none"
                                    />
                                  </label>
                                  <label className="flex flex-col bg-[var(--bg-0)] px-1 py-0.5 rounded border border-[var(--line)]">
                                    <span className="text-[7.5px] text-slate-400">L</span>
                                    <input
                                      type="number"
                                      value={c.length}
                                      onChange={(e) =>
                                        useDesignStore.getState().updateCut(selected.id, c.id, {
                                          length: Math.max(1, Number(e.target.value) || 1),
                                        })
                                      }
                                      className="w-full bg-transparent text-white font-bold text-[9px] focus:outline-none"
                                    />
                                  </label>
                                  <label className="flex flex-col bg-[var(--bg-0)] px-1 py-0.5 rounded border border-[var(--line)]">
                                    <span className="text-[7.5px] text-slate-400">Der</span>
                                    <input
                                      type="number"
                                      value={c.depth}
                                      onChange={(e) =>
                                        useDesignStore.getState().updateCut(selected.id, c.id, {
                                          depth: Math.max(0.5, Number(e.target.value) || 1),
                                        })
                                      }
                                      className="w-full bg-transparent text-amber-300 font-bold text-[9px] focus:outline-none"
                                    />
                                  </label>
                                  <label className="flex flex-col bg-[var(--bg-0)] px-1 py-0.5 rounded border border-[var(--line)]">
                                    <span className="text-[7.5px] text-slate-400">X</span>
                                    <input
                                      type="number"
                                      value={c.x}
                                      onChange={(e) =>
                                        useDesignStore.getState().updateCut(selected.id, c.id, {
                                          x: Number(e.target.value) || 0,
                                        })
                                      }
                                      className="w-full bg-transparent text-slate-200 font-bold text-[9px] focus:outline-none"
                                    />
                                  </label>
                                  <label className="flex flex-col bg-[var(--bg-0)] px-1 py-0.5 rounded border border-[var(--line)]">
                                    <span className="text-[7.5px] text-slate-400">Y</span>
                                    <input
                                      type="number"
                                      value={c.y}
                                      onChange={(e) =>
                                        useDesignStore.getState().updateCut(selected.id, c.id, {
                                          y: Number(e.target.value) || 0,
                                        })
                                      }
                                      className="w-full bg-transparent text-slate-200 font-bold text-[9px] focus:outline-none"
                                    />
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteSelected()}
                    className="w-full py-2 rounded-[var(--radius-s)] bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 size={12} />
                    <span>{t12(language, 'Delete Selected Part (Del)', 'Seçili Parçayı Sil (Del)')}</span>
                  </button>
                </>
              ) : (
                /* Empty Selection State: Show Quick Start Templates & Shortcuts */
                <div className="space-y-3">
                  <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-2">
                    <div className="text-[10px] font-bold text-[var(--cyan)] uppercase">
                      {isTr ? 'HIZLI TASARIM BAŞLANGICI' : 'QUICK DESIGN LAUNCHPAD'}
                    </div>
                    <p className="text-[10px] text-[var(--alu-dim)] leading-relaxed font-sans">
                      {isTr
                        ? 'Sahnede bir parçaya tıklayarak ölçülerini düzenleyin veya aşağıdaki hazır mühendislik şablonlarından birini 1-tıkla yükleyin:'
                        : 'Click any 3D part in the scene to edit its parameters, or load a ready-made engineering assembly below:'}
                    </p>
                    <div className="space-y-1.5 pt-1">
                      {STUDIO_ASSEMBLY_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => {
                            tpl.build();
                            ping(isTr ? `${tpl.nameTr} yüklendi` : `Loaded ${tpl.nameEn}`);
                          }}
                          className="w-full text-left p-2 rounded bg-[var(--bg-1)] hover:bg-[var(--bg-2)] border border-[var(--line)] hover:border-[var(--cyan)]/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[10.5px] text-white">
                              {isTr ? tpl.nameTr : tpl.nameEn}
                            </span>
                            <span className="text-[9px] text-[var(--cyan)] font-bold">
                              {tpl.badge}
                            </span>
                          </div>
                          <div className="text-[9px] text-[var(--alu-dim)] mt-0.5">{tpl.standard}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ─── MOBILE BOTTOM ERGONOMIC TOUCH BAR (< 768px) ─── */}
      <div className="md:hidden flex items-center justify-around h-12 bg-[var(--bg-0)] border-t border-[var(--line)] z-40 px-2 shrink-0 text-[10px]">
        <button
          type="button"
          onClick={() => {
            setLeftOpen(!leftOpen);
            setLeftTab('tree');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded cursor-pointer ${
            leftOpen && leftTab === 'tree' ? 'text-[var(--cyan)] font-bold' : 'text-[var(--alu-dim)]'
          }`}
        >
          <Layers size={14} />
          <span>Ağaç</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setLeftOpen(true);
            setLeftTab('solvers');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded cursor-pointer ${
            leftOpen && leftTab === 'solvers' ? 'text-amber-400 font-bold' : 'text-[var(--alu-dim)]'
          }`}
        >
          <Wrench size={14} />
          <span>Çözücü</span>
        </button>

        <button
          type="button"
          onClick={() => setShapeCatalogOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-full bg-[var(--cyan)] text-black font-extrabold cursor-pointer"
        >
          <Plus size={15} />
          <span>+ Katı</span>
        </button>

        <button
          type="button"
          onClick={() => {
            const nextTool = tool === 'select' ? 'move' : tool === 'move' ? 'rotate' : 'select';
            setTool(nextTool);
            ping(`3D Gizmo: ${nextTool.toUpperCase()}`);
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded cursor-pointer ${
            tool !== 'select' ? 'text-amber-400 font-bold' : 'text-[var(--alu-dim)]'
          }`}
        >
          <Move size={14} />
          <span>{tool === 'move' ? 'Taşı' : tool === 'rotate' ? 'Döndür' : 'Gizmo'}</span>
        </button>

        <button
          type="button"
          onClick={() => setRightOpen(!rightOpen)}
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded text-[var(--cyan)] cursor-pointer"
        >
          <Sliders size={14} />
          <span>Ölçü</span>
        </button>

        <button
          type="button"
          onClick={() => triggerCameraView('fit')}
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded text-slate-300 cursor-pointer"
        >
          <Maximize2 size={14} />
          <span>Odakla</span>
        </button>
      </div>

      {/* ─── SYSTEM MODALS (SHAPE CATALOG, MATES, FASTENERS, PCD, BOM) ─── */}
      <ShapeCatalogModal
        isOpen={shapeCatalogOpen}
        onClose={() => setShapeCatalogOpen(false)}
        onSelectKind={(kind) => {
          addPart(kind);
          ping(t12(language, `Added ${kind} to workspace`, `${kind} sahneye eklendi`));
        }}
        onSelectTSlot={(specId, lengthMm) => {
          addTSlotPart(specId, lengthMm);
          triggerCameraView('fit');
          ping(t12(language, `Added T-Slot ${specId}`, `T-Kanal profil eklendi`));
        }}
        onSelectGearPair={(config) => {
          useDesignStore.getState().addGearPair(config);
          triggerCameraView('fit');
          ping(
            t12(
              language,
              `Added Mating Gear Pair (m=${config.module}, z1=${config.z1}, z2=${config.z2})`,
              `Eşleşen Dişli Çifti Eklendi (m=${config.module}, z1=${config.z1}, z2=${config.z2})`
            )
          );
        }}
      />

      <AssemblyBomModal isOpen={bomModalOpen} onClose={() => setBomModalOpen(false)} />
      <WeldmentModal isOpen={isWeldModalOpen} onClose={closeWeldModal} />
      <AssemblyMateModal />
      <SmartFastenersModal />
      <BoltCirclePcdModal isOpen={pcdModalOpen} onClose={() => setPcdModalOpen(false)} />
      <SurfaceCutModal isOpen={cutModalOpen} onClose={() => setCutModalOpen(false)} selectedPart={selected} />

      {/* ─── READY-MADE ASSEMBLY TEMPLATES WINDOW ─── */}
      <AssemblyTemplatesModal
        isOpen={templatesMenuOpen}
        onClose={() => setTemplatesMenuOpen(false)}
        onNotification={ping}
      />

      {/* ─── AEGIS TEXT-TO-CAD STUDIO MODAL ─── */}
      <AegisTextToCadModal
        isOpen={textToCadModalOpen}
        initialPrompt={aegisHandover?.prompt}
        autoRunKey={aegisHandover?.key}
        onClose={() => setTextToCadModalOpen(false)}
        onNotification={ping}
      />

      {/* ─── AEGIS CAD AI TRAINING & PROMPT ENGINEERING HUB ─── */}
      <AegisCadTrainingModal
        isOpen={cadTrainingModalOpen}
        onClose={() => setCadTrainingModalOpen(false)}
      />

      {/* ─── AEGIS CAD ACADEMY & MASTERCLASS MODAL ─── */}
      <CadAcademyModal
        isOpen={cadAcademyModalOpen}
        onClose={() => setCadAcademyModalOpen(false)}
        onNotification={ping}
      />

      {/* ─── NEXT-GEN AEGIS 3D SPOTLIGHT COMMAND PALETTE ─── */}
      <Aegis3DCommandBar
        isOpen={commandBarOpen}
        onClose={() => setCommandBarOpen(false)}
        onNotification={ping}
        onTriggerOperator={(op) => {
          if (op === 's-bar') {
            setSolidWorksHudOpen(true);
          } else if (op === 'grab') {
            startModalTransform('translate');
          } else if (op === 'rotate') {
            startModalTransform('rotate');
          } else if (op === 'scale') {
            startModalTransform('scale');
          } else if (op === 'mate') {
            useDesignStore.getState().openMateModal();
          } else if (op === 'fasteners') {
            useDesignStore.getState().openFastenersModal();
          } else if (op === 'pcd') {
            setPcdModalOpen(true);
          } else if (op === 'bom') {
            setBomModalOpen(true);
          } else if (op === 'clash') {
            handleRunInterferenceCheck();
          } else if (op === 'section') {
            const cur = useDesignStore.getState().sectionAxis;
            const next: SectionAxis = cur === 'NONE' ? 'X' : cur === 'X' ? 'Y' : cur === 'Y' ? 'Z' : 'NONE';
            useDesignStore.getState().setSectionAxis(next);
            ping(t12(language, `Section Slicer: ${next}`, `Kesit Düzlemi: ${next}`));
          } else if (op === 'delete-face' && selected) {
            const res = applyDeleteFaceAndHeal(selected, activeFace || 'top');
            if (res.success) {
              useDesignStore.setState({
                holes: res.updatedHoles,
                cuts: res.updatedCuts,
                parts: useDesignStore.getState().parts.map((p) => p.id === selected.id ? { ...p, holes: res.updatedHoles, cuts: res.updatedCuts } : p)
              });
            }
            ping(t12(language, res.messageEn, res.messageTr));
          } else if (op === 'draft' && selected) {
            const curDraft = Number(selected.params?.draftAngle || 0);
            const newDraft = curDraft > 0 ? 0 : 3;
            const res = applyDraftAngleToPart(selected, newDraft, 'inward');
            useDesignStore.getState().updatePartParams(selected.id, res.updatedParams);
            ping(t12(language, res.messageEn, res.messageTr));
          } else if (op === 'coplanar' && selected) {
            const matches = detectSynchronousCoplanarFaces(selected, activeFace || 'top', useDesignStore.getState().parts);
            ping(matches.length > 0 ? `NX Live Rules: Found ${matches.length} coplanar faces!` : 'NX Live Rules: No coplanar faces found.');
          } else if (op === 'academy') {
            setCadAcademyModalOpen(true);
          } else if (op === 'doctor') {
            ping(t12(language, 'Design Doctor Active: Click Top-Left Pill to Inspect/Heal', 'Tasarım Doktoru Aktif: Denetlemek ve Onarmak için Sol Üstteki Rozete Tıklayın'));
          }
        }}
      />

      {/* ⚡ BLENDER MODAL TRANSFORM OPERATOR HUD */}
      <ModalTransformHud
        state={modalTransform}
        onCommit={commitModalTransform}
        onCancel={cancelModalTransform}
        onSelectAxis={(axis) => handleModalAxisLock(axis)}
      />

      {/* 🛠️ SOLIDWORKS 'S' KEY CONTEXT SHORTCUT BAR */}
      <SolidWorksShortcutHud
        isOpen={solidWorksHudOpen}
        position={cursorPos}
        selectedPart={selected}
        onClose={() => setSolidWorksHudOpen(false)}
        onOpenDirectModeling={() => {
          setCurrentWorkbench('cad');
          useDesignStore.getState().setTool('move');
          ping(t12(language, 'Push-Pull Face Tool Active', 'Yüzey İt/Çek Aracı Aktif'));
        }}
        onOpenHoleWizard={() => {
          setInspectorTab('features');
          setRightOpen(true);
          ping(t12(language, 'Hole Wizard & Feature Manager Active', 'Delik Sihirbazı & Unsur Yöneticisi Aktif'));
        }}
        onOpenBoltCircle={() => setPcdModalOpen(true)}
        onOpenSmartFasteners={() => useDesignStore.getState().openFastenersModal()}
        onOpenSurfaceCut={() => setCutModalOpen(true)}
        onOpenShapeCatalog={() => setShapeCatalogOpen(true)}
        onOpenMates={() => useDesignStore.getState().openMateModal()}
        onOpenBom={() => setBomModalOpen(true)}
        onCheckInterference={handleRunInterferenceCheck}
        onOpenCommandBar={() => setCommandBarOpen(true)}
        onToggleMeasure={() => {
          const cur = useDesignStore.getState().tool;
          useDesignStore.getState().setTool(cur === 'measure' ? 'select' : 'measure');
          ping(t12(language, 'Measure Tool Toggled', 'Ölçüm Aracı Değiştirildi'));
        }}
        onDuplicate={() => {
          useDesignStore.getState().duplicateSelectedPart();
          ping(t12(language, 'Part duplicated', 'Parça çoğaltıldı'));
        }}
        onDelete={() => {
          useDesignStore.getState().deleteSelected();
          ping(t12(language, 'Part deleted', 'Parça silindi'));
        }}
        onStartGrab={() => startModalTransform('translate')}
        onStartRotate={() => startModalTransform('rotate')}
        onCameraFit={() => triggerCameraView('fit')}
        onToggleSection={() => {
          const cur = useDesignStore.getState().sectionAxis;
          const next: SectionAxis = cur === 'NONE' ? 'X' : cur === 'X' ? 'Y' : cur === 'Y' ? 'Z' : 'NONE';
          useDesignStore.getState().setSectionAxis(next);
          ping(t12(language, `Section Slicer: ${next}`, `Kesit Düzlemi: ${next}`));
        }}
      />

      {/* ─── DYNAMIC BLOCK LIBRARY & 3D STUDIO MODAL ─── */}
      {(dynBlockModalOpen || showDynamicBlockModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="relative w-full max-w-6xl h-[85vh] rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-0)] shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--bg-1)] border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--cyan)] font-mono">⚡ ALUCAD DYNAMIC BLOCKS & 3D STUDIO</span>
                <span className="text-[10px] text-[var(--alu)] font-mono">AutoCAD-Grade Parametric Library</span>
              </div>
              <button
                onClick={() => {
                  setDynBlockModalOpen(false);
                  closeDynamicBlockModal();
                }}
                className="p-1 text-[var(--alu)] hover:text-white rounded hover:bg-[var(--bg-2)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <DynamicBlockConfigurator
                initialBlockId={dynamicBlockId || undefined}
                initialParams={dynamicBlockInitialParams || undefined}
                onClose={() => {
                  setDynBlockModalOpen(false);
                  closeDynamicBlockModal();
                }}
                onSaveInstance={
                  dynamicBlockEditingPartId
                    ? (newParams) => {
                        const blockDef = DynamicBlockRegistry.getById(dynamicBlockId || '');
                        if (blockDef) {
                          const generated = DynamicBlockEngine.generate3D(blockDef, newParams, { x: 0, y: 0, z: 0 });
                          if (generated && generated.length > 0) {
                            const firstGen = generated[0];
                            useDesignStore.getState().updatePartParams(dynamicBlockEditingPartId, {
                              ...(firstGen.params || {}),
                              ...(firstGen.dimensions || {}),
                              ...newParams,
                              dynamicBlockId: blockDef.id,
                              dynamicParams: newParams,
                            });
                          } else {
                            useDesignStore.getState().updatePartParams(dynamicBlockEditingPartId, {
                              ...newParams,
                              dynamicParams: newParams,
                            });
                          }
                        } else {
                          useDesignStore.getState().updatePartParams(dynamicBlockEditingPartId, {
                            ...newParams,
                            dynamicParams: newParams,
                          });
                        }
                        ping(isTr ? 'Dinamik blok parametreleri güncellendi' : 'Dynamic block parameters updated');
                        setDynBlockModalOpen(false);
                        closeDynamicBlockModal();
                      }
                    : undefined
                }
                onStampToSketch={(blockDef, params) => {
                  const ds = useDesignStore.getState();
                  const isPartStudioActive = partStudioOpen || isPartStudioOpenStore || ds.isPartStudioOpen;
                  if (isPartStudioActive) {
                    usePartStore.getState().stampDynamicBlock(blockDef.id, { x: 0, y: 0 }, params);
                  } else {
                    ds.stampDynamicBlockToSketch(blockDef.id, { x: 0, y: 0 }, params);
                  }
                  setDynBlockModalOpen(false);
                  closeDynamicBlockModal();
                  ping(isTr ? `${blockDef.name} eskize damgalandı` : `Stamped ${blockDef.name} to sketch`);
                }}
                onInserted3D={() => {
                  setDynBlockModalOpen(false);
                  closeDynamicBlockModal();
                  triggerCameraView('fit');
                  ping(isTr ? 'Dinamik blok 3D sahneye başarıyla eklendi' : 'Dynamic block added to 3D scene');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── 3D SHEET METAL BUILDER & UNFOLD STUDIO MODAL ─── */}
      <SheetMetalStudioModal
        isOpen={sheetMetalModalOpen || showSheetMetalModal}
        onClose={() => {
          setSheetMetalModalOpen(false);
          setSheetMetalEditingPartId(null);
          setSheetMetalInitialSpec(null);
          closeSheetMetalModal();
        }}
        initialSpec={sheetMetalInitialSpec || sheetMetalInitialSpecStore}
        editingPartId={sheetMetalEditingPartId || sheetMetalEditingPartIdStore}
        initialTab={sheetMetalInitialTabStore || 'bends'}
      />
    </div>
  );
}

export default Unified3DStudioV2;
