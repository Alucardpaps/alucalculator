/**
 * AluCAD Studio - Unified 2D CAD Interface
 * Industrial CNC Control Panel & Parametric Drafting Suite (ISO 2768 / DIN EN 755)
 * Featuring dedicated ISO/AutoCAD icons, real-time section inertia analysis,
 * Polar tracking (F10), unified edge-to-edge header, and multi-format export.
 */

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { LayerManager } from './LayerManager';
import { PropertiesPanel } from './PropertiesPanel';
import { FeatureTree } from './FeatureTree';
import { ToolPropertyPanel } from './ToolPropertyPanel';
import { CadMcpPanel } from './CadMcpPanel';
import { SectionAnalysisPanel } from './SectionAnalysisPanel';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { autoSaveManager } from '../persistence/autoSaveManager';
import { AegisFloatingWidget } from '@/components/copilot/AegisFloatingWidget';
import { useCadStore, useDOFCount, useConstraintStatus } from '../store/cadStore';
import { commandProcessor } from '../commands/CommandProcessor';
import {
  MousePointer2, Minus, Pencil, Square, Circle, Hexagon,
  Download, Upload, FileText, Printer, Magnet, Keyboard, Box,
  Grid3X3, Layers as LayersIcon, Sliders, Type, Cog, Nut,
  ChevronDown, Check, Columns3, Smartphone, Monitor, Maximize2, Minimize2,
  Cpu, Code, FilePlus, Save, FolderOpen, Globe, Wand2
} from 'lucide-react';
import { Aegis2DCadModal } from './Aegis2DCadModal';
import {
  EllipseIcon, ArcIcon, SplineIcon, PolylineIcon, LeaderIcon,
  ExtendIcon, OffsetIcon, FilletIcon, ChamferIcon, HatchIcon,
  RectArrayIcon, PolarArrayIcon, MeasureIcon, CrossSectionIcon,
  ScaleIcon, MoveIcon, CopyIcon, RotateIcon, DimLinearIcon, MirrorIcon, TrimIcon,
  JoinIcon, GroupIcon, UngroupIcon, ExplodeIcon, BlockIcon,
  SurfaceFinishIcon, SurfaceLeaderIcon, BeltPulleyIcon, RollerChainIcon,
  TSlotIcon
} from './CadIcons';
import { BlockLibraryModal } from './BlockLibraryModal';
import { SurfaceFinishBuilderModal } from './SurfaceFinishBuilderModal';
import { CadExportModal } from './CadExportModal';
import { CadContextMenu } from './CadContextMenu';
import { CadMethodDropdown, CadDropdownType } from './CadMethodDropdown';
import {
  CIRCLE_METHODS,
  ARC_METHODS,
  RECTANGLE_METHODS,
  POLYGON_METHODS,
  ELLIPSE_METHODS,
  LINE_METHODS,
  DIMENSION_METHODS,
  SURFACE_METHODS,
} from '../catalog/constructionMethods';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDXF } from '../dxf/DxfGenerator';
import { parseDXF } from '../dxf/DxfParser';
import { generatePDF } from '../export/PdfGenerator';
import { generateSVG } from '../export/SvgGenerator';
import { useLicenseStore } from '@/store/licenseStore';
import { useI18nStore } from '@/store/i18nStore';
import { getCadTranslations, CAD_LANGUAGES } from '@/locales/cadTranslations';
import { t12 } from '@/locales/t12';
import { CrossModuleBridge, consumeCadImport } from '@/system/crossModuleBridge';
import { insertTSlotAtOrigin } from '../commands/tools/TSlotInsertTool';
import { TSLOT_CATALOG } from '../catalog/tSlotProfiles';
import { FlagIcon } from '@/components/ui/FlagIcon';
import type { CadUnit } from '../kernel/types';
import { useAegisCadHost } from '@/store/aegisStore';

export { CAD_LANGUAGES };

// Dynamic import to avoid Paper.js SSR issues
const CadCanvas = dynamic(() => import('./CadCanvas').then((mod) => mod.CadCanvas), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[var(--bg-0)]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 border-2 border-t-cyan-400 border-white/10 rounded-full animate-spin" />
        <span className="text-xs font-mono text-cyan-400/80 uppercase tracking-widest">
          Loading 2D AluCAD Engine...
        </span>
      </div>
    </div>
  ),
});

export interface AluCADProps {
  className?: string;
  viewMode?: 'auto' | 'mobile' | 'desktop';
  onViewModeChange?: (mode: 'auto' | 'mobile' | 'desktop') => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function AluCAD({
  className = '',
  viewMode,
  onViewModeChange,
  isFullscreen,
  onToggleFullscreen,
}: AluCADProps) {
  const { language, setLanguage } = useI18nStore();
  const tCad = getCadTranslations(language);

  // ─── MULTI-METHOD EXTENDING WINDOW STATES & REFS ───
  // 1. Line
  const [showLineMenu, setShowLineMenu] = useState(false);
  const [currentLineCommand, setCurrentLineCommand] = useState<string>('LINE');
  const lineButtonRef = useRef<HTMLDivElement>(null);
  const LineActiveIcon = useMemo(() => {
    const found = LINE_METHODS.find((m) => m.commandId === currentLineCommand);
    return found ? found.icon : Minus;
  }, [currentLineCommand]);

  // 2. Circle
  const [showCircleMenu, setShowCircleMenu] = useState(false);
  const [currentCircleCommand, setCurrentCircleCommand] = useState<string>('CIRCLE_RADIUS');
  const circleButtonRef = useRef<HTMLDivElement>(null);
  const CircleActiveIcon = useMemo(() => {
    const found = CIRCLE_METHODS.find((m) => m.commandId === currentCircleCommand);
    return found ? found.icon : Circle;
  }, [currentCircleCommand]);

  // 3. Arc
  const [showArcMenu, setShowArcMenu] = useState(false);
  const [currentArcCommand, setCurrentArcCommand] = useState<string>('ARC_3P');
  const arcButtonRef = useRef<HTMLDivElement>(null);
  const ArcActiveIcon = useMemo(() => {
    const found = ARC_METHODS.find((m) => m.commandId === currentArcCommand);
    return found ? found.icon : ArcIcon;
  }, [currentArcCommand]);

  // 4. Rectangle
  const [showRecMenu, setShowRecMenu] = useState(false);
  const [currentRecCommand, setCurrentRecCommand] = useState<string>('RECTANGLE_2P');
  const recButtonRef = useRef<HTMLDivElement>(null);
  const RecActiveIcon = useMemo(() => {
    const found = RECTANGLE_METHODS.find((m) => m.commandId === currentRecCommand);
    return found ? found.icon : Square;
  }, [currentRecCommand]);

  // 5. Polygon
  const [showPolyMenu, setShowPolyMenu] = useState(false);
  const [currentPolyCommand, setCurrentPolyCommand] = useState<string>('POLYGON_INSCRIBED');
  const polyButtonRef = useRef<HTMLDivElement>(null);
  const PolyActiveIcon = useMemo(() => {
    const found = POLYGON_METHODS.find((m) => m.commandId === currentPolyCommand);
    return found ? found.icon : Hexagon;
  }, [currentPolyCommand]);

  // 6. Ellipse
  const [showEllipseMenu, setShowEllipseMenu] = useState(false);
  const [currentEllipseCommand, setCurrentEllipseCommand] = useState<string>('ELLIPSE_CENTER');
  const ellipseButtonRef = useRef<HTMLDivElement>(null);
  const EllipseActiveIcon = useMemo(() => {
    const found = ELLIPSE_METHODS.find((m) => m.commandId === currentEllipseCommand);
    return found ? found.icon : EllipseIcon;
  }, [currentEllipseCommand]);

  // 7. Dimension
  const [showDimMenu, setShowDimMenu] = useState(false);
  const [currentDimCommand, setCurrentDimCommand] = useState<string>('DIMENSION_SMART');
  const dimButtonRef = useRef<HTMLDivElement>(null);
  const DimActiveIcon = useMemo(() => {
    const found = DIMENSION_METHODS.find((m) => m.commandId === currentDimCommand);
    return found ? found.icon : DimLinearIcon;
  }, [currentDimCommand]);

  // 8. Surface Texture & Leader
  const [showSurfaceMenu, setShowSurfaceMenu] = useState(false);
  const [currentSurfaceCommand, setCurrentSurfaceCommand] = useState<string>('SURF_LEADER');
  const surfaceButtonRef = useRef<HTMLDivElement>(null);
  const SurfaceActiveIcon = useMemo(() => {
    const found = SURFACE_METHODS.find((m) => m.commandId === currentSurfaceCommand);
    return found ? found.icon : SurfaceFinishIcon;
  }, [currentSurfaceCommand]);

  // Language & Unit Menu states
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showUnitMenu, setShowUnitMenu] = useState(false);

  const closeAllMethodMenus = () => {
    setShowLineMenu(false);
    setShowCircleMenu(false);
    setShowArcMenu(false);
    setShowRecMenu(false);
    setShowPolyMenu(false);
    setShowEllipseMenu(false);
    setShowDimMenu(false);
    setShowSurfaceMenu(false);
    setShowLanguageMenu(false);
    setShowUnitMenu(false);
  };

  const getDropdownConfig = (toolId: string) => {
    switch (toolId) {
      case 'LINE':
        return {
          type: 'line' as CadDropdownType,
          isOpen: showLineMenu,
          setOpen: (val: boolean) => {
            closeAllMethodMenus();
            if (val) setShowLineMenu(true);
          },
          buttonRef: lineButtonRef,
          setCurrentCommand: setCurrentLineCommand,
          isActive: activeCommand === 'LINE' || activeCommand === 'XLINE' || activeCommand === 'RAY',
        };
      case 'CIRCLE':
        return {
          type: 'circle' as CadDropdownType,
          isOpen: showCircleMenu,
          setOpen: (val: boolean) => {
            closeAllMethodMenus();
            if (val) setShowCircleMenu(true);
          },
          buttonRef: circleButtonRef,
          setCurrentCommand: setCurrentCircleCommand,
          isActive: Boolean(activeCommand?.startsWith('CIRCLE')),
        };
      case 'ARC':
        return {
          type: 'arc' as CadDropdownType,
          isOpen: showArcMenu,
          setOpen: (val: boolean) => {
            closeAllMethodMenus();
            if (val) setShowArcMenu(true);
          },
          buttonRef: arcButtonRef,
          setCurrentCommand: setCurrentArcCommand,
          isActive: Boolean(activeCommand?.startsWith('ARC')),
        };
      case 'RECTANGLE':
        return {
          type: 'rectangle' as CadDropdownType,
          isOpen: showRecMenu,
          setOpen: (val: boolean) => {
            closeAllMethodMenus();
            if (val) setShowRecMenu(true);
          },
          buttonRef: recButtonRef,
          setCurrentCommand: setCurrentRecCommand,
          isActive: Boolean(activeCommand?.startsWith('RECTANGLE')),
        };
      case 'HEXAGON':
        return {
          type: 'polygon' as CadDropdownType,
          isOpen: showPolyMenu,
          setOpen: (val: boolean) => {
            closeAllMethodMenus();
            if (val) setShowPolyMenu(true);
          },
          buttonRef: polyButtonRef,
          setCurrentCommand: setCurrentPolyCommand,
          isActive: Boolean(activeCommand?.startsWith('POLYGON') || activeCommand === 'HEXAGON'),
        };
      case 'ELLIPSE':
        return {
          type: 'ellipse' as CadDropdownType,
          isOpen: showEllipseMenu,
          setOpen: (val: boolean) => {
            closeAllMethodMenus();
            if (val) setShowEllipseMenu(true);
          },
          buttonRef: ellipseButtonRef,
          setCurrentCommand: setCurrentEllipseCommand,
          isActive: Boolean(activeCommand?.startsWith('ELLIPSE')),
        };
      case 'DIMENSION':
        return {
          type: 'dimension' as CadDropdownType,
          isOpen: showDimMenu,
          setOpen: (val: boolean) => {
            closeAllMethodMenus();
            if (val) setShowDimMenu(true);
          },
          buttonRef: dimButtonRef,
          setCurrentCommand: setCurrentDimCommand,
          isActive: Boolean(activeCommand?.startsWith('DIMENSION')),
        };
      case 'SURFACE':
        return {
          type: 'surface' as CadDropdownType,
          isOpen: showSurfaceMenu,
          setOpen: (val: boolean) => {
            closeAllMethodMenus();
            if (val) setShowSurfaceMenu(true);
          },
          buttonRef: surfaceButtonRef,
          setCurrentCommand: setCurrentSurfaceCommand,
          isActive: Boolean(activeCommand?.startsWith('SURF')),
        };
      default:
        return null;
    }
  };

  const primaryTools = useMemo(() => [
    { id: 'SELECT', label: tCad.tools.select, Icon: MousePointer2, shortcut: 'Esc' },
    { id: 'LINE', label: tCad.tools.line, Icon: LineActiveIcon, shortcut: 'L' },
    { id: 'CIRCLE', label: tCad.tools.circle, Icon: CircleActiveIcon, shortcut: 'C' },
    { id: 'ARC', label: tCad.tools.arc, Icon: ArcActiveIcon, shortcut: 'A' },
    { id: 'PLINE', label: tCad.tools.polyline, Icon: PolylineIcon, shortcut: 'PL' },
    { id: 'RECTANGLE', label: tCad.tools.rectangle, Icon: RecActiveIcon, shortcut: 'REC' },
    { id: 'HEXAGON', label: tCad.tools.hexagon, Icon: PolyActiveIcon, shortcut: 'HEX' },
    { id: 'ELLIPSE', label: tCad.tools.ellipse, Icon: EllipseActiveIcon, shortcut: 'EL' },
    { id: 'SPLINE', label: tCad.tools.spline, Icon: SplineIcon, shortcut: 'SPL' },
  ], [tCad.tools, LineActiveIcon, CircleActiveIcon, ArcActiveIcon, RecActiveIcon, PolyActiveIcon, EllipseActiveIcon]);

  const modifyTools = useMemo(() => [
    { id: 'DIMENSION', label: tCad.tools.dimension, Icon: DimActiveIcon, shortcut: 'DIM' },
    { id: 'MEASURE', label: tCad.tools.measure, Icon: MeasureIcon, shortcut: 'M' },
    { id: 'LEADER', label: tCad.tools.leader, Icon: LeaderIcon, shortcut: 'LEAD' },
    { id: 'SURFACE', label: tCad.tools.surfaceFinish || t12(language, 'Surface Finish (SURF)', 'Yüzey İşareti (SURF)'), Icon: SurfaceActiveIcon, shortcut: 'SURF' },
    { id: 'MOVE', label: tCad.tools.move, Icon: MoveIcon, shortcut: 'MV' },
    { id: 'COPY', label: tCad.tools.copy, Icon: CopyIcon, shortcut: 'CO' },
    { id: 'ROTATE', label: tCad.tools.rotate, Icon: RotateIcon, shortcut: 'RO' },
    { id: 'SCALE', label: tCad.tools.scale, Icon: ScaleIcon, shortcut: 'SC' },
    { id: 'MIRROR', label: tCad.tools.mirror, Icon: MirrorIcon, shortcut: 'MI' },
    { id: 'TRIM', label: tCad.tools.trim, Icon: TrimIcon, shortcut: 'TR' },
    { id: 'EXTEND', label: tCad.tools.extend, Icon: ExtendIcon, shortcut: 'EX' },
    { id: 'FILLET', label: tCad.tools.fillet, Icon: FilletIcon, shortcut: 'F' },
    { id: 'CHAMFER', label: tCad.tools.chamfer, Icon: ChamferIcon, shortcut: 'CHA' },
    { id: 'JOIN', label: tCad.tools.join, Icon: JoinIcon, shortcut: 'J' },
    { id: 'GROUP', label: tCad.tools.group, Icon: GroupIcon, shortcut: 'G' },
    { id: 'UNGROUP', label: tCad.tools.ungroup, Icon: UngroupIcon, shortcut: 'UNG' },
    { id: 'EXPLODE', label: tCad.tools.explode, Icon: ExplodeIcon, shortcut: 'X' },
    { id: 'BLOCK', label: tCad.tools.block, Icon: BlockIcon, shortcut: 'B' },
    { id: 'OFFSET', label: tCad.tools.offset, Icon: OffsetIcon, shortcut: 'O' },
    { id: 'HATCH', label: tCad.tools.hatch, Icon: HatchIcon, shortcut: 'H' },
    { id: 'RECTARRAY', label: tCad.tools.rectArray, Icon: RectArrayIcon, shortcut: 'ARRAY' },
    { id: 'CIRCARRAY', label: tCad.tools.polarArray, Icon: PolarArrayIcon, shortcut: 'CA' },
    { id: 'TEXT', label: tCad.tools.text, Icon: Type, shortcut: 'T' },
  ], [tCad.tools, DimActiveIcon, SurfaceActiveIcon, language]);

  const mechanicalTools = useMemo(() => [
    { id: 'GEAR', label: tCad.tools.gear || t12(language, 'Gear Systems (G)', 'Dişli Sistemleri (G)'), Icon: Cog, shortcut: 'G' },
    { id: 'BELT_PULLEY', label: t12(language, 'Belt Drive (BELT)', 'Kayış & Kasnak (BELT)'), Icon: BeltPulleyIcon, shortcut: 'BELT' },
    { id: 'ROLLER_CHAIN', label: t12(language, 'Roller Chain (CHAIN)', 'Rulo Zincir (CHAIN)'), Icon: RollerChainIcon, shortcut: 'CHAIN' },
    { id: 'FASTENER', label: tCad.tools.fastener, Icon: Nut, shortcut: 'BOLT' },
    { id: 'CROSS_SECTION', label: tCad.tools.crossSection, Icon: CrossSectionIcon, shortcut: 'AREA' },
    { id: 'TSLOT', label: tCad.tools.tslot, Icon: TSlotIcon, shortcut: 'TSLOT' },
    { id: 'PLOT', label: tCad.tools.plot, Icon: Printer, shortcut: 'PLOT' },
  ], [tCad.tools, language]);
  const [activeTab, setActiveTab] = useState<'layers' | 'props' | 'analysis'>('layers');
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showBlockLibrary, setShowBlockLibrary] = useState(false);
  const [showSurfaceBuilder, setShowSurfaceBuilder] = useState(false);
  const [showTSlotMenu, setShowTSlotMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportModalFormat, setExportModalFormat] = useState<'PDF' | 'DXF' | 'SVG' | 'GCODE' | 'JSON' | 'IMAGE'>('PDF');
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showPolarMenu, setShowPolarMenu] = useState(false);
  const [showAiCadModal, setShowAiCadModal] = useState(false);
  const [aegisHandover, setAegisHandover] = useState<{ prompt: string; key: number } | null>(null);
  useAegisCadHost('2d', (prompt) => {
    setAegisHandover({ prompt, key: Date.now() });
    setShowAiCadModal(true);
  });
  const [commandInput, setCommandInput] = useState('');
  const commandInputRef = useRef<HTMLInputElement>(null);
  /** typed command-line history (newest last) and the position while browsing it */
  const commandHistoryRef = useRef<string[]>([]);
  const historyPosRef = useRef<number>(-1);

  const handleOpenExportModal = (fmt: 'PDF' | 'DXF' | 'SVG' | 'GCODE' | 'JSON' | 'IMAGE' = 'PDF') => {
    setShowExportMenu(false);
    setExportModalFormat(fmt);
    setShowExportModal(true);
  };

  // Keyboard shortcut: Ctrl+E / Cmd+E opens Export Center
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setShowExportModal(true);
        return;
      }

      // 'm' or 'M' without modifiers activates MEASURE tool
      if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        commandProcessor.startCommand('MEASURE');
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const {
    activeCommand,
    selectedIds,
    entities,
    layers,
    units,
    setUnits,
    scaleAllEntities,
    snapEnabled,
    toggleSnap,
    orthoEnabled,
    toggleOrtho,
    polarTrackingEnabled,
    polarAngleIncrement,
    togglePolarTracking,
    setPolarAngleIncrement,
    showGrid,
    toggleGrid,
    cursorWorld,
    commandPrompt,
    clearEntities,
  } = useCadStore();

  const handleToggleUnit = (newUnit?: CadUnit) => {
    const target = newUnit || (units === 'mm' ? 'in' : 'mm');
    setUnits(target);
  };

  const handleScaleDrawing = (factor: number) => {
    scaleAllEntities(factor);
    useCadStore.setState({
      commandPrompt: tCad.units?.scaledSuccess || 'Drawing geometry converted successfully',
    });
    setShowUnitMenu(false);
  };

  const dof = useDOFCount();
  const constraintStatus = useConstraintStatus();

  // Consume cross-module CAD imports on mount
  useEffect(() => {
    consumeCadImport();
  }, []);

  // Auto-switch to Properties tab when entity is selected
  useEffect(() => {
    if (selectedIds.length > 0 && activeTab !== 'analysis') {
      setActiveTab('props');
    }
  }, [selectedIds]);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  // Listen for custom event to open Surface Builder modal
  useEffect(() => {
    const handleOpen = () => setShowSurfaceBuilder(true);
    window.addEventListener('alucad:open-surface-builder', handleOpen);
    return () => window.removeEventListener('alucad:open-surface-builder', handleOpen);
  }, []);

  const handleToolClick = (id: string) => {
    closeAllMethodMenus();
    if (id === 'SELECT') {
      commandProcessor.setActiveCommand(null);
    } else if (id === 'CROSS_SECTION') {
      setShowRightSidebar(true);
      setActiveTab('analysis');
      commandProcessor.startCommand('CROSS_SECTION');
    } else if (id === 'BLOCK') {
      setShowBlockLibrary(true);
    } else if (id === 'SURFACE') {
      commandProcessor.startCommand(currentSurfaceCommand || 'SURF_LEADER');
    } else if (id === 'SURFACE_FINISH') {
      setShowSurfaceBuilder(true);
    } else if (id === 'LINE') {
      commandProcessor.startCommand(currentLineCommand);
    } else if (id === 'CIRCLE') {
      commandProcessor.startCommand(currentCircleCommand);
    } else if (id === 'ARC') {
      commandProcessor.startCommand(currentArcCommand);
    } else if (id === 'RECTANGLE') {
      commandProcessor.startCommand(currentRecCommand);
    } else if (id === 'HEXAGON' || id === 'POLYGON') {
      commandProcessor.startCommand(currentPolyCommand);
    } else if (id === 'ELLIPSE') {
      commandProcessor.startCommand(currentEllipseCommand);
    } else if (id === 'DIMENSION') {
      commandProcessor.startCommand(currentDimCommand);
    } else {
      commandProcessor.startCommand(id);
    }
  };

  const handleImportDXF = () => {
    setShowImportMenu(false);
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.dxf,.json';
    fileInput.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        if (file.name.toLowerCase().endsWith('.json')) {
          const parsed = JSON.parse(text);
          const ents = Array.isArray(parsed) ? parsed : parsed.entities;
          if (!Array.isArray(ents) || ents.length === 0) {
            useCadStore.setState({ commandPrompt: `JSON import failed: no entities in ${file.name}` });
            return;
          }
          ents.forEach((ent: any) => useCadStore.getState().addEntity(ent));
          useCadStore.setState({ commandPrompt: `Imported ${ents.length} entities from ${file.name}` });
          return;
        }
        const result = parseDXF(text);
        if (result.entities.length === 0) {
          useCadStore.setState({
            commandPrompt: `DXF import: no supported entities in ${file.name}. ${result.warnings[0] || ''}`.trim(),
          });
          return;
        }
        useCadStore.setState((s) => {
          const names = new Set(s.layers.map((l) => l.name));
          const extra = result.layers.filter((l) => l.name !== '0' && !names.has(l.name));
          return extra.length ? { layers: [...s.layers, ...extra] } : {};
        });
        result.entities.forEach((ent) => useCadStore.getState().addEntity(ent));
        useCadStore.setState({
          commandPrompt: `Imported ${result.entities.length} DXF entities from ${file.name}${result.unitScale !== 1 ? ` (×${result.unitScale} → mm)` : ''}`,
        });
      } catch (err) {
        useCadStore.setState({
          commandPrompt: `Import failed: ${err instanceof Error ? err.message : 'unknown error'}`,
        });
      }
    };
    fileInput.click();
  };

  const handleExportDXF = () => {
    setShowExportMenu(false);
    const allowed = useLicenseStore.getState().guardFeature('dxf');
    if (!allowed) return;
    const { entities, layers } = useCadStore.getState();
    const dxfStr = generateDXF(entities, layers);
    const blob = new Blob([dxfStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AluCAD_Export_${Date.now()}.dxf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSVG = () => {
    setShowExportMenu(false);
    const { entities, layers } = useCadStore.getState();
    if (entities.length === 0) return;
    const svgStr = generateSVG(entities, layers);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AluCAD_Export_${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    setShowExportMenu(false);
    const { entities, layers } = useCadStore.getState();
    if (entities.length === 0) return;
    try {
      const canvasEl = document.getElementById('cad-canvas') as HTMLCanvasElement | null;
      const pdfBytes = await generatePDF(entities, layers, canvasEl, {
        paperSize: 'A4',
        orientation: 'LANDSCAPE',
        showTitleBlock: true,
        titleBlockData: {
          partName: 'AluCAD Studio Draft',
          company: 'AluCAD OS Engineering',
        },
      });
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AluCAD_Blueprint_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransferTo3D = () => {
    const { entities, selectedIds } = useCadStore.getState();
    const ents = selectedIds.length > 0
      ? entities.filter((e) => selectedIds.includes(e.id))
      : entities;
    const result = CrossModuleBridge.exportCadToDesignStudio(ents, 100);
    if (!result.ok) {
      useCadStore.setState({ commandPrompt: result.message });
      return;
    }
    window.location.href = '/design-studio/';
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = commandInput.trim();
    const val = raw.toUpperCase();
    if (!val) {
      // AutoCAD: Enter finishes the running command, or repeats the last one when idle
      if (activeCommand) commandProcessor.getActiveCommand()?.onKeyInput('Enter');
      else commandProcessor.repeatLastCommand();
      return;
    }
    const history = commandHistoryRef.current;
    if (history[history.length - 1] !== raw) history.push(raw);
    if (history.length > 100) history.shift();
    historyPosRef.current = -1;

    if (activeCommand) {
      // typing another command's name while one runs switches to it
      const switchTo = commandProcessor.commandToSwitchTo(val);
      if (switchTo) commandProcessor.startCommand(switchTo);
      else commandProcessor.handleValueInput(val);
    } else {
      // "CIRCLE", "C", or "CIRCLE 0,0" (command with its first value)
      commandProcessor.handleValueInput(val);
    }
    setCommandInput('');
  };

  const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setCommandInput('');
      if (activeCommand) useCadStore.getState().cancelCommand();
      else commandInputRef.current?.blur();
      return;
    }
    const history = commandHistoryRef.current;
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && history.length > 0) {
      e.preventDefault();
      let pos = historyPosRef.current;
      if (e.key === 'ArrowUp') pos = pos < 0 ? history.length - 1 : Math.max(0, pos - 1);
      else pos = pos < 0 ? -1 : pos + 1 >= history.length ? -1 : pos + 1;
      historyPosRef.current = pos;
      setCommandInput(pos < 0 ? '' : history[pos]);
    }
  };

  return (
    <div className={`relative flex flex-col w-full h-full bg-[var(--bg-0)] text-slate-300 font-sans select-none overflow-hidden ${className}`}>
      {/* ─── 1. TOP HEADER NAVIGATION (UNIFIED HIGH-DENSITY COMMAND STRIP) ─── */}
      <header className="flex-none h-11 border-b border-white/10 bg-[var(--bg-1)] flex items-center justify-between px-3 z-40 gap-2">
        {/* Left: Brand + Title + Badges + Responsive Switcher */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 ">
            <Pencil size={13} />
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-black uppercase tracking-wider text-white truncate">
              AluCAD <span className="text-cyan-400 font-mono text-[10px] font-bold">Studio · 2D</span>
            </span>
            <span className="hidden xl:inline text-[9px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
              ISO 2768
            </span>
          </div>

          {/* Entity Count Badge */}
          <div className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-mono text-slate-400">
            <span className="text-cyan-300 font-bold">{entities.length}</span>
            <span>ents</span>
          </div>

          {/* Constraint Status Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/5 text-[9px] font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                constraintStatus === 'FULLY_CONSTRAINED'
                  ? 'bg-emerald-400 '
                  : constraintStatus === 'OVER_CONSTRAINED'
                  ? 'bg-rose-400'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300 font-semibold uppercase">
              {constraintStatus === 'FULLY_CONSTRAINED' ? '100% Fixed' : `DOF: ${dof}`}
            </span>
          </div>

          {/* Responsive Layout Switcher */}
          {onViewModeChange && (
            <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/10 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => onViewModeChange('auto')}
                className={`px-2 py-0.5 rounded transition-all ${
                  viewMode === 'auto' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Responsive Mode"
              >
                Auto
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('mobile')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                  viewMode === 'mobile' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Force Mobile AutoCAD layout"
              >
                <Smartphone size={10} />
                <span className="hidden sm:inline">Mobile</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('desktop')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                  viewMode === 'desktop' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Force Desktop Pro layout"
              >
                <Monitor size={10} />
                <span className="hidden sm:inline">Pro</span>
              </button>
            </div>
          )}

          {/* ─── MITUTOYO DIGITAL UNIT SWITCHER (MM | IN) ─── */}
          <div className="relative flex items-center">
            <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/10 text-[10px] font-mono shadow-inner">
              <button
                type="button"
                onClick={() => handleToggleUnit('mm')}
                className={`px-2 py-0.5 rounded font-bold transition-all ${
                  units === 'mm'
                    ? 'bg-[var(--cyan)] text-[var(--accent-ink)] '
                    : 'text-slate-400 hover:text-white'
                }`}
                title={tCad.units?.mm || 'Millimeters (mm)'}
              >
                MM
              </button>
              <button
                type="button"
                onClick={() => handleToggleUnit('in')}
                className={`px-2 py-0.5 rounded font-bold transition-all ${
                  units === 'in'
                    ? 'bg-[var(--cyan)] text-[var(--accent-ink)] '
                    : 'text-slate-400 hover:text-white'
                }`}
                title={tCad.units?.inch || 'Inches (in)'}
              >
                INCH
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnitMenu((v) => !v);
                  setShowLanguageMenu(false);
                }}
                className="px-1 text-slate-400 hover:text-cyan-300 border-l border-white/10"
                title={tCad.units?.convertDrawing || 'Scale Drawing Geometry'}
              >
                <ChevronDown size={10} className={`transition-transform duration-150 ${showUnitMenu ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showUnitMenu && (
              <div className="absolute left-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-cyan-500/30 bg-[var(--bg-1)]/95 p-2 shadow-2xl text-[11px] font-mono space-y-1 animate-in fade-in slide-in-from-top-1">
                <div className="px-2 py-1 text-[10px] uppercase font-bold text-cyan-400 tracking-wider border-b border-white/10 flex items-center justify-between">
                  <span>{tCad.units?.unitLabel || 'Units'}</span>
                  <span className="text-[9px] text-slate-400 font-normal">{units === 'mm' ? 'ISO Metric' : 'Imperial'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleToggleUnit();
                    setShowUnitMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-200 flex items-center justify-between transition-colors"
                >
                  <span>{tCad.units?.toggleUnit || 'Toggle Unit'}</span>
                  <span className="text-[10px] text-cyan-400 font-bold">{units === 'mm' ? '→ INCH' : '→ MM'}</span>
                </button>
                <div className="border-t border-white/5 my-1" />
                <div className="px-2 py-0.5 text-[9px] text-slate-400 uppercase tracking-widest font-bold">
                  {tCad.units?.convertDrawing || 'Scale Drawing Geometry'}
                </div>
                <button
                  type="button"
                  onClick={() => handleScaleDrawing(1 / 25.4)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-amber-500/15 hover:text-amber-200 flex items-center justify-between transition-colors"
                >
                  <span>mm → inch (÷25.4)</span>
                  <span className="text-[9px] text-amber-400 font-mono">0.03937×</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleScaleDrawing(25.4)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-emerald-500/15 hover:text-emerald-200 flex items-center justify-between transition-colors"
                >
                  <span>inch → mm (×25.4)</span>
                  <span className="text-[9px] text-emerald-400 font-mono">25.4×</span>
                </button>
              </div>
            )}
          </div>

          {/* ─── 12-LANGUAGE INDUSTRIAL SELECTOR ─── */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => {
                setShowLanguageMenu((v) => !v);
                setShowUnitMenu(false);
              }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-cyan-500/40 text-[10px] font-mono shadow-inner transition-all"
              title={t12(language, 'Language / Dil (12 Industrial Locales)', 'Dil / Language (12 Endüstriyel Dil)')}
            >
              <FlagIcon lang={language} className="w-3.5 h-2.5 rounded-xs shrink-0" />
              <span className="uppercase font-bold tracking-wider">{language}</span>
              <ChevronDown size={10} className={`text-slate-400 transition-transform duration-150 ${showLanguageMenu ? 'rotate-180' : ''}`} />
            </button>

            {showLanguageMenu && (
              <div className="absolute left-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-cyan-500/30 bg-[var(--bg-1)]/98 p-1.5 shadow-2xl text-[11px] font-mono space-y-0.5 animate-in fade-in slide-in-from-top-1 max-h-72 overflow-y-auto">
                <div className="px-2 py-1 text-[9px] uppercase font-bold text-cyan-400 tracking-wider border-b border-white/10 flex items-center justify-between">
                  <span>{t12(language, 'Language', 'Dil')}</span>
                  <span className="text-[8px] text-slate-400 font-normal">12 Locales</span>
                </div>
                {CAD_LANGUAGES.map((lang) => {
                  const isCurrent = language === lang.id;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.id);
                        setShowLanguageMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                        isCurrent
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FlagIcon lang={lang.id} className="w-4 h-3 rounded-xs shrink-0" />
                        <span className="text-[11px]">{lang.native}</span>
                      </div>
                      <span className="text-[9px] uppercase text-slate-500">{lang.id}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Center: Live Telemetry / Coordinates & Polar readout */}
        <div className="hidden 2xl:flex items-center gap-2 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 font-mono text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
            <span>X: {units === 'in' ? `${(cursorWorld.x / 25.4).toFixed(3)}"` : `${cursorWorld.x.toFixed(2)} mm`}</span>
            <span className="text-slate-600">|</span>
            <span>Y: {units === 'in' ? `${(cursorWorld.y / 25.4).toFixed(3)}"` : `${cursorWorld.y.toFixed(2)} mm`}</span>
          </div>
          {polarTrackingEnabled && (
            <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px] border border-amber-500/30">
              POLAR {polarAngleIncrement}°
            </span>
          )}
        </div>



        {/* Right Action Tools: Auto-Save / Disk Sync, Blocks, Shortcuts, Import, Export, Fullscreen */}
        <div className="flex items-center gap-2 shrink-0">
          {/* AUTO-SAVE & LOCAL PC DISK SYNC WIDGET */}
          <SaveStatusIndicator />

          {/* AI 2D CAD DRAFTER */}
          <button
            type="button"
            onClick={() => setShowAiCadModal(true)}
            className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border border-cyan-500/40 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,229,255,0.2)]"
            title={t12(language, 'AeGiS AI 2D CAD Drafter (ISO 128 / DIN 2768)', 'AeGiS AI 2B CAD Teknik Çizim (ISO 128 / DIN 2768)')}
          >
            <Wand2 size={13} className="text-cyan-400" />
            <span className="hidden sm:inline">{t12(language, 'AI DRAW', 'AI ÇİZ')}</span>
          </button>

          {/* NEW DRAWING (BLANK CANVAS) */}
          <button
            type="button"
            onClick={() => {
              if (entities.length > 0) {
                if (window.confirm(t12(language, 'Start with a new blank drawing? Current drawing will be cleared.', 'Yeni boş çizim başlatılsın mı? Mevcut çizim temizlenecektir.'))) {
                  clearEntities();
                }
              } else {
                clearEntities();
              }
            }}
            className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all flex items-center gap-1.5"
            title={t12(language, 'New Blank Drawing', 'Yeni Boş Çizim')}
          >
            <FilePlus size={13} className="text-cyan-400" />
            <span className="hidden md:inline">{t12(language, 'NEW', 'YENİ')}</span>
          </button>

          {/* BLOCKS LIBRARY */}
          <button
            type="button"
            onClick={() => setShowBlockLibrary(true)}
            className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all flex items-center gap-1.5"
            title={tCad.tools.block}
          >
            <Box size={13} />
            <span className="hidden sm:inline">{t12(language, 'BLOCKS', 'BLOKLAR')}</span>
          </button>

          {/* SHORTCUTS */}
          <button
            type="button"
            onClick={() => setShowShortcuts((s) => !s)}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
            title={t12(language, 'AutoCAD Keyboard Shortcuts', 'AutoCAD Klavye Kısayolları')}
          >
            <Keyboard size={13} />
          </button>

          {/* IMPORT DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowImportMenu((v) => !v)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition-all flex items-center gap-1.5"
              title={t12(language, 'Import Files', 'Dosyaları İçe Aktar')}
            >
              <Upload size={13} />
              <span className="hidden md:inline">{t12(language, 'IMPORT', 'İÇE AKTAR')}</span>
              <ChevronDown size={10} />
            </button>
            {showImportMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-white/10 bg-[var(--bg-1)]/95 p-1 shadow-2xl text-[11px] font-mono space-y-1">
                <button
                  type="button"
                  onClick={async () => {
                    setShowImportMenu(false);
                    await autoSaveManager.openFromLocalPc();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-cyan-300 hover:bg-cyan-500/15 flex items-center gap-2 font-bold"
                >
                  <FolderOpen size={13} />
                  <span>AluCAD Projesi (*.alucad)</span>
                </button>
                <button
                  type="button"
                  onClick={handleImportDXF}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-300 flex items-center gap-2"
                >
                  <FileText size={13} />
                  <span>AutoCAD DXF / JSON</span>
                </button>
              </div>
            )}
          </div>

          {/* EXPORT DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu((v) => !v)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border border-cyan-500/40 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 transition-all flex items-center gap-1.5"
              title={t12(language, 'Export Drawing', 'Çizimi Dışa Aktar')}
            >
              <Download size={13} />
              <span className="hidden sm:inline">{t12(language, 'EXPORT', 'DIŞA AKTAR')}</span>
              <ChevronDown size={10} />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-cyan-500/30 bg-[var(--bg-1)]/95 p-1.5 shadow-2xl text-[11px] font-mono space-y-1">
                <button
                  type="button"
                  onClick={async () => {
                    setShowExportMenu(false);
                    await autoSaveManager.saveToLocalPc(true);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-emerald-300 hover:bg-emerald-500/15 flex items-center gap-2 transition-colors font-bold"
                >
                  <Save size={13} className="text-emerald-400" />
                  <span>AluCAD Projesi (*.alucad)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    setShowExportModal(true);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-cyan-300 hover:bg-cyan-500/15 flex items-center gap-2 transition-colors font-bold border-b border-white/5 pb-2 mb-1"
                >
                  <Sliders size={13} className="text-cyan-400" />
                  <span>{t12(language, 'Export Studio & Presets...', 'Dışa Aktarma Stüdyosu...')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    handleExportDXF();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-300 flex items-center gap-2 transition-colors"
                >
                  <FileText size={13} />
                  <span>AutoCAD DXF (R12/2000)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    handleExportSVG();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-300 flex items-center gap-2 transition-colors"
                >
                  <Download size={13} />
                  <span>Vector SVG (1:1 Scale)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    handleExportPDF();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-300 flex items-center gap-2 transition-colors"
                >
                  <Printer size={13} />
                  <span>Manufacturing PDF (A4/A3)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    handleTransferTo3D();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-cyan-300 hover:bg-cyan-500/15 flex items-center gap-2 transition-colors border-t border-white/5 pt-2 mt-1"
                >
                  <Box size={13} className="text-cyan-400" />
                  <span>{t12(language, '3D STEP (OpenCascade Solid)', '3D STEP Katı Model')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    if (typeof window !== 'undefined') window.location.href = '/nesting-2d';
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-purple-300 hover:bg-purple-500/15 flex items-center gap-2 transition-colors"
                >
                  <Columns3 size={13} className="text-purple-400" />
                  <span>{t12(language, '2D Sheet Nesting', '2D Nesting Yerleşim')}</span>
                </button>
              </div>
            )}
          </div>

          {/* FULLSCREEN */}
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all"
              title={t12(language, 'Toggle Fullscreen', 'Tam Ekran')}
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}

          {/* TOGGLE RIGHT SIDEBAR */}
          <button
            type="button"
            onClick={() => setShowRightSidebar((s) => !s)}
            className={`p-1.5 rounded-lg border transition-all ${
              showRightSidebar
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
            title={t12(language, 'Toggle Sidebar (Layers / Properties / Analysis)', 'Yan Paneli Aç/Kapat (Katmanlar / Özellikler / Kesit)')}
          >
            <LayersIcon size={13} />
          </button>
        </div>
      </header>

      {/* Shortcuts Popup Floating Dialog */}
      {showShortcuts && (
        <div className="absolute top-14 right-4 z-50 w-72 bg-[var(--bg-1)]/95 border border-cyan-500/30 rounded-2xl p-4 shadow-2xl text-[11px] font-mono space-y-1.5 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between text-cyan-400 font-black uppercase tracking-widest mb-2 border-b border-white/10 pb-1.5">
            <span>CAD SHORTCUTS</span>
            <button onClick={() => setShowShortcuts(false)} className="text-slate-500 hover:text-white">✕</button>
          </div>
          {[
            ['L', 'Line'],
            ['C', 'Circle'],
            ['A', '3-Point Arc'],
            ['REC', 'Rectangle'],
            ['PL', 'Polyline'],
            ['EL', 'Ellipse'],
            ['SPL', 'Spline'],
            ['F10', 'Polar Tracking'],
            ['F8', 'Ortho Lock'],
            ['F3', 'Object Snap'],
            ['M', 'Measure / Caliper'],
            ['MV', 'Move'],
            ['SC', 'Scale'],
            ['O', 'Offset'],
            ['TR', 'Trim'],
            ['F', 'Fillet'],
            ['CHA', 'Chamfer'],
            ['H', 'Hatch'],
            ['ARRAY', 'Rect Array'],
            ['CA', 'Polar Array'],
            ['AREA', 'Section Properties'],
            ['TSLOT', 'T-Slot insert'],
            ['CO', 'Copy'],
            ['DIM', 'Dimension'],
            ['G', 'Involute Gear'],
            ['Esc', 'Select / Cancel'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-slate-400 hover:text-slate-200">
              <span>{v}</span>
              <span className="text-cyan-400 font-bold bg-white/5 px-1.5 rounded">{k}</span>
            </div>
          ))}
        </div>
      )}

      {/* ─── 2. MAIN CAD WORKSPACE (CANVAS + FLOATING TOOLBAR + RIGHT SIDEBAR) ─── */}
      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        {/* ─── CENTER: 2D PAPER.JS CAD CANVAS ─── */}
        <div className="relative flex-1 h-full min-w-0 bg-[var(--bg-0)] overflow-hidden">
          {/* Subtle Ambient Radial Glows */}

          {/* Cad Canvas */}
          <CadCanvas
            className="absolute inset-0 z-10"
            onContextMenuOpen={(x, y) => setContextMenu({ x, y })}
          />

          {/* Floating Selection Quick Action HUD (Appears when shapes are selected in SELECT mode) */}
          {selectedIds.length > 0 && !activeCommand && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
              <div className="pointer-events-auto flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-[var(--bg-1)]/95 border border-cyan-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.8)] text-xs font-mono">
                <span className="text-[10px] text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 mr-1">
                  {selectedIds.length} {t12(language, 'selected', 'seçildi')}
                </span>

                <button
                  type="button"
                  onClick={() => commandProcessor.startCommand('FILLET')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 border border-white/5 hover:border-cyan-500/40 transition-all flex items-center gap-1 font-sans text-xs"
                  title={t12(language, 'Corner Fillet (F)', 'Köşe Radyus Kır (F)')}
                >
                  <span className="text-cyan-400">🌀</span> {t12(language, 'Fillet', 'Radyus')}
                </button>

                <button
                  type="button"
                  onClick={() => commandProcessor.startCommand('CHAMFER')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-white/5 hover:border-amber-500/40 transition-all flex items-center gap-1 font-sans text-xs"
                  title={t12(language, 'Corner Chamfer (CHA)', 'Köşe Pah Kır (CHA)')}
                >
                  <span className="text-amber-400">📐</span> {t12(language, 'Chamfer', 'Pah')}
                </button>

                <button
                  type="button"
                  onClick={() => commandProcessor.startCommand('DIMENSION')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-blue-500/20 hover:text-blue-300 text-slate-300 border border-white/5 hover:border-blue-500/40 transition-all flex items-center gap-1 font-sans text-xs"
                  title={t12(language, 'Auto Dimension (DIM)', 'Otomatik Ölçülendir (DIM)')}
                >
                  <span className="text-blue-400">📏</span> {t12(language, 'Dimension', 'Ölçü')}
                </button>

                <button
                  type="button"
                  onClick={() => commandProcessor.startCommand('MOVE')}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 transition-all flex items-center gap-1 font-sans text-xs"
                  title={t12(language, 'Move (M)', 'Taşı (M)')}
                >
                  <span className="text-cyan-400">✥</span> {t12(language, 'Move', 'Taşı')}
                </button>

                <button
                  type="button"
                  onClick={() => commandProcessor.startCommand('OFFSET')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-all flex items-center gap-1 font-sans text-xs"
                  title={t12(language, 'Parallel Offset (O)', 'Paralel Ötele (O)')}
                >
                  <span>⇥</span> {t12(language, 'Offset', 'Ötele')}
                </button>

                <button
                  type="button"
                  onClick={() => commandProcessor.startCommand('ROTATE')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-all flex items-center gap-1 font-sans text-xs"
                  title={t12(language, 'Rotate (RO)', 'Döndür (RO)')}
                >
                  <span>🔄</span> {t12(language, 'Rotate', 'Döndür')}
                </button>

                <button
                  type="button"
                  onClick={() => commandProcessor.startCommand('MIRROR')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-all flex items-center gap-1 font-sans text-xs"
                  title={t12(language, 'Mirror (MI)', 'Aynala (MI)')}
                >
                  <span>🪞</span> {t12(language, 'Mirror', 'Aynala')}
                </button>

                <div className="h-4 w-[1px] bg-white/15 mx-0.5" />

                <button
                  type="button"
                  onClick={() => {
                    const { removeEntity } = useCadStore.getState();
                    selectedIds.forEach(id => removeEntity(id));
                  }}
                  className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 transition-all flex items-center gap-1 font-sans text-xs"
                  title={t12(language, 'Delete Selected (DEL)', 'Seçilenleri Sil (DEL)')}
                >
                  <span>🗑️</span> {t12(language, 'Delete', 'Sil')}
                </button>
              </div>
            </div>
          )}

          {/* Right-Click Industrial Context Menu */}
          {contextMenu && (
            <CadContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              selectedCount={selectedIds.length}
              activeCommand={activeCommand}
              lastCommandId={commandProcessor.getLastCommandId()}
              language={language}
              onClose={() => setContextMenu(null)}
              onStartCommand={(cmd) => {
                commandProcessor.startCommand(cmd);
                setContextMenu(null);
              }}
              onCancelCommand={() => {
                useCadStore.getState().cancelCommand();
                setContextMenu(null);
              }}
              onEnterCommand={() => {
                commandProcessor.handleValueInput('ENTER');
                setContextMenu(null);
              }}
              onRepeatLastCommand={() => {
                commandProcessor.repeatLastCommand();
                setContextMenu(null);
              }}
              onZoomExtents={() => {
                useCadStore.getState().zoomExtents();
                setContextMenu(null);
              }}
              onOpenExportModal={(format) => {
                handleOpenExportModal((format as any) || 'PDF');
                setContextMenu(null);
              }}
              onOpenSectionAnalysis={() => {
                setActiveTab('analysis');
                setContextMenu(null);
              }}
              onTransferTo3D={() => {
                handleTransferTo3D();
                setContextMenu(null);
              }}
              onDeleteSelected={() => {
                const { removeEntity } = useCadStore.getState();
                selectedIds.forEach((id) => removeEntity(id));
                setContextMenu(null);
              }}
            />
          )}

          {/* ─── TOP-CENTERED FLOATING DRAWING TOOL RIBBON (THE PILL) ─── */}
          {/* wraps onto a second row instead of running off the canvas on laptop widths */}
          <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-max max-w-[calc(100%-32px)]">
            <div className="pointer-events-auto flex flex-wrap items-center justify-center p-1 rounded-[var(--radius-l)] bg-[var(--bg-1)] border border-[var(--line)] shadow-[var(--shadow-2)] gap-0.5 whitespace-nowrap">
              {/* Primary Draw Tools */}
              {primaryTools.map((t) => {
                const dropConfig = getDropdownConfig(t.id);
                const isActive = dropConfig
                  ? dropConfig.isActive
                  : activeCommand === t.id || (t.id === 'SELECT' && !activeCommand);
                const Icon = t.Icon;

                if (dropConfig) {
                  return (
                    <div key={t.id} ref={dropConfig.buttonRef} className="relative flex items-center">
                      <div
                        className={`flex items-center rounded-xl p-0.5 transition-all ${
                          isActive
                            ? 'bg-[var(--cyan)] text-[var(--accent-ink)] ring-1 ring-blue-400/50'
                            : 'text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleToolClick(t.id)}
                          className="p-1.5 rounded-lg flex items-center justify-center"
                          title={t.label}
                        >
                          <Icon size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            dropConfig.setOpen(!dropConfig.isOpen);
                          }}
                          className={`px-0.5 py-1.5 rounded text-slate-400 hover:text-white border-l ${
                            isActive ? 'border-blue-400/40 text-blue-100' : 'border-white/10'
                          }`}
                          title={`${t.label} (${t12(language, 'Methods', 'Yöntemler')})`}
                        >
                          <ChevronDown size={10} />
                        </button>
                      </div>

                      {/* Visual Subtitle Popover Dropdown rendered via portal */}
                      <CadMethodDropdown
                        type={dropConfig.type}
                        isOpen={dropConfig.isOpen}
                        onClose={() => dropConfig.setOpen(false)}
                        activeCommand={activeCommand}
                        onSelectMethod={(cmd) => {
                          dropConfig.setCurrentCommand(cmd);
                          commandProcessor.startCommand(cmd);
                        }}
                        language={language}
                        anchorRef={dropConfig.buttonRef}
                      />
                    </div>
                  );
                }

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleToolClick(t.id)}
                    className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                      isActive
                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)] ring-1 ring-blue-400/50'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={t.label}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}

              {/* Vertical Divider */}
              <div className="h-5 w-[1px] bg-white/10 mx-1" />

              {/* Modify Tools */}
              {modifyTools.map((t) => {
                const dropConfig = getDropdownConfig(t.id);
                const isActive = dropConfig ? dropConfig.isActive : activeCommand === t.id;
                const Icon = t.Icon;

                if (dropConfig) {
                  return (
                    <div key={t.id} ref={dropConfig.buttonRef} className="relative flex items-center">
                      <div
                        className={`flex items-center rounded-xl p-0.5 transition-all ${
                          isActive
                            ? 'bg-[var(--cyan)] text-[var(--accent-ink)] ring-1 ring-blue-400/50'
                            : 'text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleToolClick(t.id)}
                          className="p-1.5 rounded-lg flex items-center justify-center"
                          title={t.label}
                        >
                          <Icon size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            dropConfig.setOpen(!dropConfig.isOpen);
                          }}
                          className={`px-0.5 py-1.5 rounded text-slate-400 hover:text-white border-l ${
                            isActive ? 'border-blue-400/40 text-blue-100' : 'border-white/10'
                          }`}
                          title={`${t.label} (${t12(language, 'Methods', 'Yöntemler')})`}
                        >
                          <ChevronDown size={10} />
                        </button>
                      </div>

                      <CadMethodDropdown
                        type={dropConfig.type}
                        isOpen={dropConfig.isOpen}
                        onClose={() => dropConfig.setOpen(false)}
                        activeCommand={activeCommand}
                        onSelectMethod={(cmd) => {
                          dropConfig.setCurrentCommand(cmd);
                          commandProcessor.startCommand(cmd);
                        }}
                        language={language}
                        anchorRef={dropConfig.buttonRef}
                      />
                    </div>
                  );
                }

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleToolClick(t.id)}
                    className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                      isActive
                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)] ring-1 ring-blue-400/50'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={t.label}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}

              {/* Vertical Divider */}
              <div className="h-5 w-[1px] bg-white/10 mx-1" />

              {/* Mechanical & Annotation Tools */}
              {mechanicalTools.map((t) => {
                const isActive = activeCommand === t.id;
                const Icon = t.Icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleToolClick(t.id)}
                    className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                      isActive
                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)] ring-1 ring-blue-400/50'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={t.label}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tool Dynamic Parameter Panel */}
          <AnimatePresence>
            {activeCommand && <ToolPropertyPanel />}
          </AnimatePresence>

          {/* AI MCP Analysis Overlay */}
          <CadMcpPanel />
        </div>

        {/* ─── RIGHT: UNIFIED LAYERS / PROPERTIES / ANALYSIS SIDEBAR ─── */}
        {showRightSidebar && (
          <aside className="w-80 border-l border-white/10 bg-[var(--bg-1)]/95 flex flex-col z-30 shadow-[-15px_0_40px_rgba(0,0,0,0.5)]">
            {/* Top Tab Switcher: [Layers] | [Properties] | [Analysis] */}
            <div className="flex border-b border-white/5 bg-black/40 text-[10px] font-mono tracking-[0.15em] uppercase">
              <button
                type="button"
                onClick={() => setActiveTab('layers')}
                className={`flex-1 py-2.5 text-center transition-all relative ${
                  activeTab === 'layers'
                    ? 'text-cyan-400 font-bold bg-cyan-500/10'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {t12(language, 'Layers', 'Katmanlar')}
                {activeTab === 'layers' && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 inset-x-0 h-[2px] bg-cyan-400 " />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('props')}
                className={`flex-1 py-2.5 text-center transition-all relative ${
                  activeTab === 'props'
                    ? 'text-cyan-400 font-bold bg-cyan-500/10'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {t12(language, 'Props', 'Özellikler')}
                {activeTab === 'props' && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 inset-x-0 h-[2px] bg-cyan-400 " />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('analysis')}
                className={`flex-1 py-2.5 text-center transition-all relative flex items-center justify-center gap-1 ${
                  activeTab === 'analysis'
                    ? 'text-cyan-400 font-bold bg-cyan-500/10'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                <CrossSectionIcon size={12} />
                <span>{t12(language, 'Section', 'Kesit')}</span>
                {activeTab === 'analysis' && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 inset-x-0 h-[2px] bg-cyan-400 " />
                )}
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col">
              {activeTab === 'layers' ? (
                <div className="flex flex-col h-full divide-y divide-white/5">
                  {/* Top: Layer Manager */}
                  <div className="h-1/2 min-h-[160px] overflow-hidden flex flex-col">
                    <LayerManager />
                  </div>

                  {/* Bottom: Feature Tree */}
                  <div className="h-1/2 min-h-[220px] overflow-y-auto flex flex-col bg-black/20">
                    <FeatureTree />
                  </div>
                </div>
              ) : activeTab === 'props' ? (
                <div className="h-full">
                  <PropertiesPanel />
                </div>
              ) : (
                <div className="h-full">
                  <SectionAnalysisPanel />
                </div>
              )}
            </div>

            {/* Quick Actions Strip at Sidebar Bottom */}
            <div className="p-2.5 border-t border-white/5 bg-black/40 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => commandProcessor.startCommand('PLOT')}
                className="py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
              >
                <Printer size={12} /> PLOT
              </button>
              <button
                type="button"
                onClick={handleExportDXF}
                className="py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
              >
                <Download size={12} /> DXF
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ─── 3. BOTTOM COMMAND BAR & STATUS BAR ─── */}
      <footer className="flex-none h-9 border-t border-white/10 bg-[var(--bg-0)] flex items-center justify-between px-3 z-40 gap-4">
        {/* Left: AutoCAD Style Command Line Input */}
        <form onSubmit={handleCommandSubmit} className="flex items-center gap-2 flex-1 max-w-xl">
          <span className="text-[11px] font-mono font-bold text-cyan-400 whitespace-nowrap">
            CAD &gt;
          </span>
          <input
            ref={commandInputRef}
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={handleCommandKeyDown}
            aria-label={t12(language, 'Command line', 'Komut satırı')}
            autoComplete="off"
            spellCheck={false}
            placeholder={commandPrompt || t12(language, 'Type a command (e.g. LINE, CIRCLE, TRIM, POLAR, AREA)...', 'Komut yazın (örn. LINE, CIRCLE, TRIM, POLAR, KESIT)...')}
            className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-white placeholder:text-slate-600 focus:placeholder:text-slate-500"
          />
        </form>

        {/* Right: Telemetry & Quick Toggles */}
        <div className="flex items-center gap-2.5 text-[10px] font-mono text-slate-400 shrink-0">
          <button
            type="button"
            onClick={toggleGrid}
            className={`px-1.5 py-0.5 rounded border transition-colors ${
              showGrid ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'text-slate-600 border-transparent hover:text-slate-400'
            }`}
          >
            {tCad.statusBar.grid}
          </button>
          <button
            type="button"
            onClick={toggleOrtho}
            className={`px-1.5 py-0.5 rounded border transition-colors ${
              orthoEnabled ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'text-slate-600 border-transparent hover:text-slate-400'
            }`}
          >
            {tCad.statusBar.ortho}
          </button>
          <button
            type="button"
            onClick={togglePolarTracking}
            className={`px-1.5 py-0.5 rounded border transition-colors ${
              polarTrackingEnabled ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'text-slate-600 border-transparent hover:text-slate-400'
            }`}
          >
            {tCad.statusBar.polar}
          </button>
          <button
            type="button"
            onClick={toggleSnap}
            className={`px-1.5 py-0.5 rounded border transition-colors ${
              snapEnabled ? 'bg-blue-600/20 text-cyan-300 border-cyan-500/40' : 'text-slate-600 border-transparent hover:text-slate-400'
            }`}
          >
            {tCad.statusBar.snap}
          </button>

          {/* Unit Toggle Badge */}
          <button
            type="button"
            onClick={() => handleToggleUnit()}
            className={`px-1.5 py-0.5 rounded border font-mono font-bold transition-all flex items-center gap-1 ${
              units === 'in'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            }`}
            title={units === 'in' ? (tCad.units?.switchToMm || 'Switch to MM') : (tCad.units?.switchToInches || 'Switch to Inches')}
          >
            <span>UNIT:</span>
            <span className="underline uppercase">{units}</span>
          </button>

          {/* Coordinates Readout */}
          <div className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded border border-white/5 font-mono text-cyan-300 text-[10px]">
            <span>
              X: {units === 'in' ? (cursorWorld.x / 25.4).toFixed(3) + '"' : cursorWorld.x.toFixed(1) + 'mm'}
            </span>
            <span>
              Y: {units === 'in' ? (cursorWorld.y / 25.4).toFixed(3) + '"' : cursorWorld.y.toFixed(1) + 'mm'}
            </span>
          </div>
        </div>
      </footer>

      {/* ─── 4. BLOCK LIBRARY MODAL ─── */}
      <BlockLibraryModal
        isOpen={showBlockLibrary}
        onClose={() => setShowBlockLibrary(false)}
      />

      {/* ─── 4.1 SURFACE TEXTURE BUILDER MODAL ─── */}
      <SurfaceFinishBuilderModal
        isOpen={showSurfaceBuilder}
        onClose={() => setShowSurfaceBuilder(false)}
      />

      {/* ─── 5. SHORTCUTS & HELP MODAL ─── */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-sans">
          <div className="w-full max-w-2xl rounded-lg border border-[var(--line-strong)] bg-[var(--bg-1)] text-[var(--ink)] shadow-2xl p-5 overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-[var(--cyan)]" />
                <h3 className="text-sm font-semibold tracking-wider text-[var(--ink)] uppercase font-mono">
                  AutoCAD Keyboard Shortcuts & Aliases
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                className="rounded p-1 text-[var(--alu-dim)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)] transition-colors"
              >
                <ChevronDown className="h-5 w-5 rotate-90" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono max-h-[60vh] overflow-y-auto pr-1">
              <div className="space-y-1.5 p-2 rounded bg-[var(--bg-0)] border border-[var(--line)]">
                <div className="text-[10px] font-bold text-[var(--cyan)] uppercase">Draw</div>
                <div><span className="text-[var(--ok)] font-bold">L</span> : Line</div>
                <div><span className="text-[var(--ok)] font-bold">PL</span> : Polyline</div>
                <div><span className="text-[var(--ok)] font-bold">C</span> : Circle</div>
                <div><span className="text-[var(--ok)] font-bold">A</span> : 3-Pt Arc</div>
                <div><span className="text-[var(--ok)] font-bold">REC</span> : Rectangle</div>
                <div><span className="text-[var(--ok)] font-bold">HEX</span> : Polygon</div>
                <div><span className="text-[var(--ok)] font-bold">EL</span> : Ellipse</div>
                <div><span className="text-[var(--ok)] font-bold">SPL</span> : Spline</div>
                <div><span className="text-[var(--ok)] font-bold">H</span> : Hatch</div>
              </div>

              <div className="space-y-1.5 p-2 rounded bg-[var(--bg-0)] border border-[var(--line)]">
                <div className="text-[10px] font-bold text-[var(--cyan)] uppercase">Modify & Interop</div>
                <div><span className="text-[var(--ok)] font-bold">TR</span> : Trim Boundary</div>
                <div><span className="text-[var(--ok)] font-bold">EX</span> : Extend Wall</div>
                <div><span className="text-[var(--ok)] font-bold">J</span> : Join Contours</div>
                <div><span className="text-[var(--ok)] font-bold">G / GRP</span> : Group Objects</div>
                <div><span className="text-[var(--ok)] font-bold">UNG</span> : Ungroup</div>
                <div><span className="text-[var(--ok)] font-bold">X / EXP</span> : Explode</div>
                <div><span className="text-[var(--ok)] font-bold">O</span> : Offset</div>
                <div><span className="text-[var(--ok)] font-bold">F</span> : Corner Fillet</div>
                <div><span className="text-[var(--ok)] font-bold">CHA</span> : Chamfer</div>
              </div>

              <div className="space-y-1.5 p-2 rounded bg-[var(--bg-0)] border border-[var(--line)]">
                <div className="text-[10px] font-bold text-[var(--cyan)] uppercase">Blocks & Mechanical</div>
                <div><span className="text-[var(--ok)] font-bold">B</span> : Create Block</div>
                <div><span className="text-[var(--ok)] font-bold">I</span> : Insert Block</div>
                <div><span className="text-[var(--ok)] font-bold">W</span> : WBlock Export</div>
                <div><span className="text-[var(--ok)] font-bold">GEAR</span> : Involute Gear</div>
                <div><span className="text-[var(--ok)] font-bold">BOLT</span> : Fastener</div>
                <div><span className="text-[var(--ok)] font-bold">TSLOT</span> : Extrusion</div>
                <div><span className="text-[var(--ok)] font-bold">AREA</span> : Section IX/IY</div>
                <div><span className="text-[var(--ok)] font-bold">DIST</span> : Measure</div>
                <div><span className="text-[var(--ok)] font-bold">PLOT</span> : Print Blueprint</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--line)] flex justify-end">
              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                className="rounded bg-[var(--cyan)] px-4 py-1.5 text-xs font-semibold text-[var(--bg-0)] hover:bg-[var(--cyan)] transition-colors"
              >
                Close (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAD EXPORT CENTER MODAL */}
      <CadExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        initialFormat={exportModalFormat}
      />

      {/* AEGIS AI 2D CAD DRAFTING MODAL */}
      <Aegis2DCadModal
        isOpen={showAiCadModal}
        initialPrompt={aegisHandover?.prompt}
        autoRunKey={aegisHandover?.key}
        onClose={() => setShowAiCadModal(false)}
      />
    </div>
  );
}

export default AluCAD;
