'use client';

/**
 * Mobile2DCad - Next-Gen AutoCAD Mobile Engineering Workstation
 * 
 * Industrial CNC-grade 2D drafting suite for touch devices:
 * - Direct commandProcessor execution (Line, Polyline, Circle, Arc, Rect, Polygon, Ellipse, Spline, Text, Hatch)
 * - Complete modify suite (Move, Copy, Rotate, Scale, Mirror, Offset, Trim, Extend, Fillet, Chamfer, Array, Delete)
 * - Industrial annotations (Smart Dim, Linear, Leader, Measure / Dist)
 * - Mechanical engineering generators (T-Slot 2020-8080, Metric Fasteners M4-M12, Gears, Section Analysis)
 * - Touch-optimized multi-gesture canvas: 1-finger draw/aim with snap, 2-finger pan & pinch-zoom
 * - On-screen numeric engineering keypad for dynamic input without virtual keyboard interference
 * - Layer manager, OSNAP filters, DXF/PDF/SVG export, and 1-click 3D solid bridge
 */

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MousePointer2, Minus, Square, Circle, Hexagon,
  Move, Copy, RotateCw, Ruler, Undo2, Redo2, Download,
  Upload, Sparkles, HelpCircle, Magnet, Trash2, Box, X,
  Shapes, Check, ArrowRight, Layers as LayersIcon,
  Maximize2, Minimize2, Scissors, CornerUpRight, Blend, LayoutGrid,
  Type, Cog, Nut, Crosshair, ChevronRight, Hash, Eye, EyeOff,
  FolderOpen, Settings2, Sliders, FileText
} from 'lucide-react';
import {
  EllipseIcon, ArcIcon, SplineIcon, PolylineIcon, LeaderIcon,
  ExtendIcon, OffsetIcon, FilletIcon, ChamferIcon, HatchIcon,
  RectArrayIcon, PolarArrayIcon, MeasureIcon, CrossSectionIcon,
  ScaleIcon, MoveIcon, CopyIcon, RotateIcon, DimLinearIcon, BeltPulleyIcon, PlanetaryGearIcon, RollerChainIcon,
  TSlotIcon
} from './CadIcons';
import { useCadStore } from '../store/cadStore';
import { useDesignStore } from '@/design-studio/designStore';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { commandProcessor } from '../commands/CommandProcessor';
import { generateDXF } from '../dxf/DxfGenerator';
import { parseDXF } from '../dxf/DxfParser';
import { generatePDF } from '../export/PdfGenerator';
import { generateSVG } from '../export/SvgGenerator';
import { CadExportModal } from './CadExportModal';
import { Aegis2DCadModal } from './Aegis2DCadModal';
import { CrossModuleBridge, consumeCadImport } from '@/system/crossModuleBridge';
import { getTSlotSpec, tSlotToCadEntities } from '../catalog/tSlotProfiles';
import { createPolylineEntity, createCircleEntity, createFastenerEntity, createGearEntity, OSnapMode, CadUnit } from '../kernel/types';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { CAD_LANGUAGES } from './AluCAD';
import { getCadTranslations } from '@/locales/cadTranslations';
import { useAegisCadHost } from '@/store/aegisStore';

const CadCanvas = dynamic(() => import('./CadCanvas').then((m) => m.CadCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[var(--bg-0)] text-[11px] font-mono text-[var(--alu-dim)]">
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--cyan)] border-t-transparent" />
        <span>Loading AutoCAD Engine…</span>
      </div>
    </div>
  ),
});

type Props = {
  onTransferTo3D?: () => void;
  viewMode?: 'auto' | 'mobile' | 'desktop';
  onViewModeChange?: (mode: 'auto' | 'mobile' | 'desktop') => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

type Category = 'DRAW' | 'MODIFY' | 'ANNOTATE' | 'ENG';

export function Mobile2DCad({
  onTransferTo3D,
  viewMode,
  onViewModeChange,
  isFullscreen,
  onToggleFullscreen,
}: Props) {
  const { language, setLanguage } = useI18nStore();
  const tCad = getCadTranslations(language);

  // Dialog & Drawer States
  const [activeCategory, setActiveCategory] = useState<Category>('DRAW');
  const [menuOpen, setMenuOpen] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [snapsOpen, setSnapsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [cadExportModalOpen, setCadExportModalOpen] = useState(false);
  const [aiCadOpen, setAiCadOpen] = useState(false);
  const [aegisHandover, setAegisHandover] = useState<{ prompt: string; key: number } | null>(null);
  useAegisCadHost('2d', (prompt) => {
    setAegisHandover({ prompt, key: Date.now() });
    setAiCadOpen(true);
  });
  const [numpadOpen, setNumpadOpen] = useState(false);
  const [numpadInput, setNumpadInput] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Store access
  const entities = useCadStore((s) => s.entities);
  const activeCommand = useCadStore((s) => s.activeCommand);
  const commandPrompt = useCadStore((s) => s.commandPrompt);
  const cancelCommand = useCadStore((s) => s.cancelCommand);
  const snapEnabled = useCadStore((s) => s.snapEnabled);
  const toggleSnap = useCadStore((s) => s.toggleSnap);
  const activeSnaps = useCadStore((s) => s.activeSnaps);
  const setActiveSnaps = useCadStore((s) => s.setActiveSnaps);
  const orthoEnabled = useCadStore((s) => s.orthoEnabled);
  const toggleOrtho = useCadStore((s) => s.toggleOrtho);
  const showGrid = useCadStore((s) => s.showGrid);
  const toggleGrid = useCadStore((s) => s.toggleGrid);
  const cursorWorld = useCadStore((s) => s.cursorWorld);
  const undo = useCadStore((s) => s.undo);
  const redo = useCadStore((s) => s.redo);
  const selectedIds = useCadStore((s) => s.selectedIds);
  const deleteSelected = useCadStore((s) => s.deleteSelected);
  const clearEntities = useCadStore((s) => s.clearEntities);
  const layers = useCadStore((s) => s.layers);
  const activeLayerId = useCadStore((s) => s.activeLayerId);
  const setActiveLayer = useCadStore((s) => s.setActiveLayer);
  const toggleLayerVisibility = useCadStore((s) => s.toggleLayerVisibility);
  const addLayer = useCadStore((s) => s.addLayer);
  const addPart = useDesignStore((s) => s.addPart);
  const units = useCadStore((s) => s.units);
  const setUnits = useCadStore((s) => s.setUnits);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const imported = consumeCadImport();
    if (imported > 0) {
      showToast(t12(language, `Imported ${imported} CAD elements`, `${imported} CAD elemanı aktarıldı`));
    }
  }, [language]);

  // Tool execution helper
  const handleToolClick = (cmdId: string | null, label: string) => {
    if (!cmdId || cmdId === 'SELECT') {
      commandProcessor.setActiveCommand(null);
      showToast(t12(language, 'Select Mode', 'Seçim Modu'));
    } else {
      commandProcessor.startCommand(cmdId);
      showToast(`${label} ${t12(language, 'Active', 'Aktif')}`);
    }
  };

  // Export DXF
  const handleExportDXF = () => {
    if (entities.length === 0) {
      showToast(t12(language, 'Canvas empty', 'Çizim alanı boş'));
      return;
    }
    const dxfString = generateDXF(entities, layers);
    const blob = new Blob([dxfString], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alucalc-drawing-${Date.now()}.dxf`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t12(language, 'AutoCAD DXF Exported', 'AutoCAD DXF İndirildi'));
    setExportOpen(false);
  };

  // Export PDF Blueprint
  const handleExportPDF = async () => {
    if (entities.length === 0) {
      showToast(t12(language, 'Canvas empty', 'Çizim alanı boş'));
      return;
    }
    try {
      const canvasEl = document.getElementById('cad-canvas') as HTMLCanvasElement | null;
      const pdfBytes = await generatePDF(entities, layers, canvasEl, {
        paperSize: 'A4',
        orientation: 'LANDSCAPE',
        showTitleBlock: true,
        titleBlockData: {
          partName: 'AluCAD Mobile Draft',
          company: 'AluCAD OS Engineering',
        }
      });
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alucalc-blueprint-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(t12(language, 'ISO Blueprint PDF Exported', 'ISO Antetli PDF İndirildi'));
      setExportOpen(false);
    } catch (err) {
      console.error(err);
      showToast('PDF Export Error');
    }
  };

  // Export SVG Vector Graphic
  const handleExportSVG = () => {
    if (entities.length === 0) {
      showToast(t12(language, 'Canvas empty', 'Çizim alanı boş'));
      return;
    }
    const svgStr = generateSVG(entities, layers);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alucalc-vector-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t12(language, 'SVG Vector Exported', 'SVG Vektör İndirildi'));
    setExportOpen(false);
  };

  // Import DXF
  const handleImportDXF = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          const parsed = parseDXF(content);
          if (parsed && parsed.entities && parsed.entities.length > 0) {
            parsed.entities.forEach(ent => useCadStore.getState().addEntity(ent));
            showToast(t12(language, `Imported ${parsed.entities.length} entities`, `${parsed.entities.length} nesne içe aktarıldı`));
          } else {
            showToast(t12(language, 'No entities recognized in DXF', 'DXF içinde nesne bulunamadı'));
          }
        } catch {
          showToast(t12(language, 'Invalid DXF format', 'Geçersiz DXF dosyası'));
        }
      }
      setExportOpen(false);
    };
    reader.readAsText(file);
  };

  // Transfer to 3D solid model
  const handleTransferTo3D = () => {
    if (entities.length === 0) {
      showToast(t12(language, 'Empty sketch! Draw shape or insert template', 'Çizim boş! Önce şekil çizin veya şablon ekleyin'));
      return;
    }
    const res = CrossModuleBridge.exportCadToDesignStudio(entities, 100);
    if (res.ok) {
      showToast(t12(language, `✨ 3D Solid Generated (${res.areaMm2?.toFixed(0)} mm²)`, `✨ 3D Katı Model Oluşturuldu (${res.areaMm2?.toFixed(0)} mm²)`));
      if (onTransferTo3D) {
        onTransferTo3D();
      } else if (typeof window !== 'undefined') {
        window.location.href = '/design-studio/';
      }
    } else {
      showToast(t12(language, '⚠️ No closed contour, converted to plate', '⚠️ Kapalı kontur bulunamadı, plaka olarak aktarıldı'));
      addPart('plate');
      if (onTransferTo3D) {
        onTransferTo3D();
      } else if (typeof window !== 'undefined') {
        window.location.href = '/design-studio/';
      }
    }
  };

  // Presets Handlers
  const handleInsertTSlot = (sizeOrId: string | number) => {
    const spec = getTSlotSpec(sizeOrId);
    const newEnts = tSlotToCadEntities(spec, { x: 0, y: 0 }, activeLayerId, '#3ad0e6');
    useCadStore.getState().addEntities(newEnts);
    showToast(t12(language, `+ Added ${spec.name}`, `+ ${spec.name} eklendi`));
    setPresetOpen(false);
  };

  const handleInsertRect = (width = 80, height = 40) => {
    const halfW = width / 2;
    const halfH = height / 2;
    const pts = [
      { x: -halfW, y: -halfH },
      { x: halfW, y: -halfH },
      { x: halfW, y: halfH },
      { x: -halfW, y: halfH },
    ];
    const poly = createPolylineEntity(pts, true, activeLayerId, '#3ad0e6');
    useCadStore.getState().addEntity(poly);
    showToast(t12(language, `+ Added ${width}×${height} Rect`, `+ ${width}×${height} Dikdörtgen eklendi`));
    setPresetOpen(false);
  };

  const handleInsertCircle = (radius = 30, bore = 10) => {
    const outer = createCircleEntity({ x: 0, y: 0 }, radius, activeLayerId, '#3ad0e6');
    const inner = createCircleEntity({ x: 0, y: 0 }, bore, activeLayerId, '#e85d5d');
    useCadStore.getState().addEntities([outer, inner]);
    showToast(t12(language, `+ Added Ø${radius * 2} Flange`, `+ Ø${radius * 2} Flanş eklendi`));
    setPresetOpen(false);
  };

  const handleInsertFastener = (diam = 8, len = 40) => {
    const bolt = createFastenerEntity({ x: 0, y: 0 }, 'BOLT', diam, len, 1.25, activeLayerId, '#e6b84a');
    useCadStore.getState().addEntity(bolt);
    showToast(t12(language, `+ Added ISO M${diam}×${len} Bolt`, `+ ISO M${diam}×${len} Civata eklendi`));
    setPresetOpen(false);
  };

  const handleInsertGear = (teeth = 24, mod = 2) => {
    const gear = createGearEntity({ x: 0, y: 0 }, mod, teeth, activeLayerId, '#3dd68c');
    useCadStore.getState().addEntity(gear);
    showToast(t12(language, `+ Added Gear z=${teeth} m=${mod}`, `+ Dişli z=${teeth} m=${mod} eklendi`));
    setPresetOpen(false);
  };

  // Numpad input handler for dynamic coordinate entry
  const handleNumpadSubmit = () => {
    if (numpadInput.trim()) {
      commandProcessor.handleValueInput(numpadInput.trim());
      setNumpadInput('');
      setNumpadOpen(false);
      showToast(`Sent: ${numpadInput.trim()}`);
    }
  };

  // Categorized Tool Definitions
  const DRAW_TOOLS = [
    { id: 'SELECT', label: t12(language, 'Select', 'Seç'), icon: MousePointer2, cmd: 'SELECT' },
    { id: 'LINE', label: t12(language, 'Line (L)', 'Çizgi (L)'), icon: Minus, cmd: 'LINE' },
    { id: 'PLINE', label: t12(language, 'PLine (PL)', 'P-Çizgi (PL)'), icon: PolylineIcon, cmd: 'PLINE' },
    { id: 'RECT', label: t12(language, 'Rect (REC)', 'Dikdörtgen (REC)'), icon: Square, cmd: 'RECTANGLE' },
    { id: 'CIRCLE', label: t12(language, 'Circle (C)', 'Daire (C)'), icon: Circle, cmd: 'CIRCLE' },
    { id: 'ARC', label: t12(language, 'Arc (A)', 'Yay (A)'), icon: ArcIcon, cmd: 'ARC' },
    { id: 'HEX', label: t12(language, 'Hex (HEX)', 'Çokgen (HEX)'), icon: Hexagon, cmd: 'POLYGON' },
    { id: 'ELLIPSE', label: t12(language, 'Ellipse (EL)', 'Elips (EL)'), icon: EllipseIcon, cmd: 'ELLIPSE' },
    { id: 'SPLINE', label: t12(language, 'Spline (SPL)', 'Spline (SPL)'), icon: SplineIcon, cmd: 'SPLINE' },
    { id: 'TEXT', label: t12(language, 'Text (T)', 'Yazı (T)'), icon: Type, cmd: 'TEXT' },
    { id: 'HATCH', label: t12(language, 'Hatch (H)', 'Tarama (H)'), icon: HatchIcon, cmd: 'HATCH' },
  ];

  const MODIFY_TOOLS = [
    { id: 'MOVE', label: t12(language, 'Move (M)', 'Taşı (M)'), icon: MoveIcon, cmd: 'MOVE' },
    { id: 'COPY', label: t12(language, 'Copy (CO)', 'Kopyala (CO)'), icon: CopyIcon, cmd: 'COPY' },
    { id: 'ROTATE', label: t12(language, 'Rotate (RO)', 'Döndür (RO)'), icon: RotateIcon, cmd: 'ROTATE' },
    { id: 'SCALE', label: t12(language, 'Scale (SC)', 'Ölçek (SC)'), icon: ScaleIcon, cmd: 'SCALE' },
    { id: 'OFFSET', label: t12(language, 'Offset (O)', 'Ötele (O)'), icon: OffsetIcon, cmd: 'OFFSET' },
    { id: 'TRIM', label: t12(language, 'Trim (TR)', 'Buda (TR)'), icon: Scissors, cmd: 'TRIM' },
    { id: 'FILLET', label: t12(language, 'Fillet (F)', 'Pah / Radyus (F)'), icon: FilletIcon, cmd: 'FILLET' },
    { id: 'CHAMFER', label: t12(language, 'Chamfer (CHA)', 'Pah (CHA)'), icon: ChamferIcon, cmd: 'CHAMFER' },
    { id: 'ARRAY', label: t12(language, 'Array (AR)', 'Dizi (AR)'), icon: RectArrayIcon, cmd: 'ARRAY' },
  ];

  const ANNOTATE_TOOLS = [
    { id: 'DIM', label: t12(language, 'Dimension (DIM)', 'Ölçülendir (DIM)'), icon: Ruler, cmd: 'DIMENSION' },
    { id: 'DIMLIN', label: t12(language, 'Linear Dim (DLI)', 'Doğrusal Ölçü'), icon: DimLinearIcon, cmd: 'DIMENSION_LINEAR' },
    { id: 'LEADER', label: t12(language, 'Leader Note', 'Ok / Not (LEAD)'), icon: LeaderIcon, cmd: 'LEADER' },
    { id: 'MEASURE', label: t12(language, 'Measure (DIST)', 'Mesafe Ölç (DIST)'), icon: MeasureIcon, cmd: 'MEASURE' },
  ];

  const ENG_TOOLS = [
    { id: 'TSLOT', label: t12(language, 'T-Slot Profile', 'T-Profil Ekle'), icon: TSlotIcon, cmd: 'TSLOT' },
    { id: 'GEAR', label: t12(language, 'Involute Gear', 'Evolvent Dişli'), icon: Cog, cmd: 'GEAR' },
    { id: 'BOLT', label: t12(language, 'Bolt / Fastener', 'Civata / Somun'), icon: Nut, cmd: 'FASTENER' },
    { id: 'PULLEY', label: t12(language, 'Timing Belt', 'Kayış / Kasnak'), icon: BeltPulleyIcon, cmd: 'BELT_PULLEY' },
    { id: 'PLANET', label: t12(language, 'Planetary Gear', 'Planet Dişli'), icon: PlanetaryGearIcon, cmd: 'PLANETARY_GEAR' },
    { id: 'CHAIN', label: t12(language, 'Roller Chain', 'Rulo Zincir Dişlisi'), icon: RollerChainIcon, cmd: 'ROLLER_CHAIN' },
    { id: 'CROSS', label: t12(language, 'Section Analysis', 'Kesit / Atalet Analizi'), icon: CrossSectionIcon, cmd: 'CROSS_SECTION' },
  ];

  const getToolsForCategory = () => {
    switch (activeCategory) {
      case 'DRAW': return DRAW_TOOLS;
      case 'MODIFY': return MODIFY_TOOLS;
      case 'ANNOTATE': return ANNOTATE_TOOLS;
      case 'ENG': return ENG_TOOLS;
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--bg-0)] select-none font-mono text-[var(--alu)]">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportDXF}
        accept=".dxf"
        className="hidden"
      />

      {/* ─── Top Industrial Header Strip ─── */}
      <div className="flex-none flex items-center justify-between px-2 py-1.5 border-b border-[var(--line)] bg-[var(--bg-1)] z-20 shadow-md gap-2 overflow-x-auto no-scrollbar">
        {/* Left: Menu & Category Tabs */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--cyan)] active:scale-95 shrink-0"
            title="Menu & Settings"
          >
            <Sliders size={14} />
          </button>

          {/* Category Switchers */}
          <div className="flex items-center bg-[var(--bg-0)] p-0.5 rounded border border-[var(--line)] shrink-0">
            {(['DRAW', 'MODIFY', 'ANNOTATE', 'ENG'] as Category[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-[var(--cyan)] text-[var(--bg-0)]'
                    : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
                }`}
              >
                {cat === 'DRAW' ? t12(language, 'Draw', 'Çiz')
                  : cat === 'MODIFY' ? t12(language, 'Mod', 'Düz')
                  : cat === 'ANNOTATE' ? t12(language, 'Dim', 'Ölçü')
                  : t12(language, 'Eng', 'Mek')}
              </button>
            ))}
          </div>

          {/* View Mode Switcher (Mobile/Auto/Pro) */}
          {onViewModeChange && (
            <div className="hidden xs:flex items-center bg-[var(--bg-0)] p-0.5 rounded border border-[var(--line)] text-[9px] shrink-0">
              <button
                type="button"
                onClick={() => onViewModeChange('auto')}
                className={`px-1.5 py-0.5 rounded ${viewMode === 'auto' ? 'bg-[var(--cyan)] text-[var(--bg-0)] font-bold' : 'text-[var(--alu-dim)]'}`}
              >
                Auto
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('desktop')}
                className={`px-1.5 py-0.5 rounded ${viewMode === 'desktop' ? 'bg-[var(--cyan)] text-[var(--bg-0)] font-bold' : 'text-[var(--alu-dim)]'}`}
                title="Pro Desktop Studio"
              >
                Pro
              </button>
            </div>
          )}
        </div>

        {/* Right: Quick Modes & Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Unit Toggle Button [ MM | IN ] */}
          <button
            type="button"
            onClick={() => {
              const nextUnit: CadUnit = units === 'mm' ? 'in' : 'mm';
              setUnits(nextUnit);
              showToast(`Unit: ${nextUnit.toUpperCase()}`);
            }}
            className={`px-1.5 h-7 rounded text-[9px] font-mono font-black border transition-all ${
              units === 'in'
                ? 'bg-[var(--warn)]/20 border-[var(--warn)] text-[var(--warn)]'
                : 'bg-[var(--cyan)]/20 border-[var(--cyan)] text-[var(--cyan)]'
            }`}
            title={units === 'in' ? (tCad.units?.switchToMm || 'Switch to MM') : (tCad.units?.switchToInches || 'Switch to Inches')}
          >
            {units.toUpperCase()}
          </button>

          <button
            type="button"
            onClick={toggleSnap}
            className={`px-1.5 h-7 rounded text-[9px] font-black border transition-all ${
              snapEnabled
                ? 'bg-[var(--cyan)]/20 border-[var(--cyan)] text-[var(--cyan)]'
                : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)]'
            }`}
            title="Object Snap (F3)"
          >
            SNAP
          </button>

          <button
            type="button"
            onClick={toggleOrtho}
            className={`px-1.5 h-7 rounded text-[9px] font-black border transition-all ${
              orthoEnabled
                ? 'bg-[var(--warn)]/20 border-[var(--warn)] text-[var(--warn)]'
                : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)]'
            }`}
            title="Ortho Mode (F8)"
          >
            ORTHO
          </button>

          <button
            type="button"
            onClick={() => { undo(); showToast('Undo'); }}
            className="w-7 h-7 flex items-center justify-center rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--alu)] active:scale-90"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={13} />
          </button>

          <button
            type="button"
            onClick={() => { redo(); showToast('Redo'); }}
            className="w-7 h-7 flex items-center justify-center rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--alu)] active:scale-90"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={13} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (useCadStore.getState().entities.length > 0) {
                if (window.confirm(t12(language, 'Clear canvas and start a blank drawing?', 'Çizimi temizleyip boş sayfa başlatılsın mı?'))) {
                  clearEntities();
                  showToast(t12(language, 'Blank canvas ready', 'Boş sayfa açıldı'));
                }
              }
            }}
            className="w-7 h-7 flex items-center justify-center rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--alu)] active:scale-90 hover:text-rose-400"
            title={t12(language, 'New / Clear (Blank Canvas)', 'Yeni / Temizle (Boş Sayfa)')}
          >
            <Trash2 size={12} />
          </button>

          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="px-2 h-7 flex items-center gap-1 rounded bg-[var(--bg-3)] border border-[var(--line-strong)] text-[var(--ink)] text-[9px] font-bold active:scale-95"
            title="Export / Import"
          >
            <Download size={11} className="text-[var(--cyan)]" />
            <span>IO</span>
          </button>

          <button
            type="button"
            onClick={() => setAiCadOpen(true)}
            className="flex items-center gap-1 px-2 h-7 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[9px] font-black uppercase active:scale-95"
            title={t12(language, 'AI 2D CAD Drafting', 'AI 2B CAD Çizim')}
          >
            <Sparkles size={11} className="text-purple-400" />
            <span>AI</span>
          </button>

          <button
            type="button"
            onClick={handleTransferTo3D}
            className="flex items-center gap-1 px-2 h-7 rounded bg-[var(--cyan)] text-[var(--bg-0)] text-[9px] font-black uppercase shadow active:scale-95"
            title={t12(language, 'Extrude to 3D solid model', '3D Katı Modele Dönüştür')}
          >
            <Box size={11} />
            <span>3D</span>
          </button>
        </div>
      </div>

      {/* ─── Active Command Banner (AutoCAD HUD) ─── */}
      {activeCommand && (
        <div className="flex-none flex items-center justify-between px-3 py-1 bg-[var(--bg-2)] border-b border-[var(--cyan)]/40 text-xs z-20 animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-1.5 py-0.5 rounded bg-[var(--cyan)] text-[var(--bg-0)] font-black text-[10px] uppercase tracking-wider">
              {activeCommand}
            </span>
            <span className="text-[11px] text-[var(--ink)] truncate">
              {commandPrompt || t12(language, 'Tap point or enter value', 'Noktaya dokunun veya değer girin')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                commandProcessor.getActiveCommand()?.onKeyInput('Enter');
              }}
              className="px-2 py-0.5 rounded bg-[var(--ok)] text-[var(--bg-0)] text-[10px] font-black uppercase active:scale-95"
            >
              ✓ OK
            </button>
            <button
              type="button"
              onClick={() => {
                cancelCommand();
                commandProcessor.handleCancel();
                showToast(t12(language, 'Cancelled', 'İptal edildi'));
              }}
              className="px-2 py-0.5 rounded bg-[var(--bad)] text-white text-[10px] font-black uppercase active:scale-95"
            >
              ✕ ESC
            </button>
          </div>
        </div>
      )}

      {/* ─── Interactive CAD Canvas ─── */}
      <div className="relative flex-1 min-h-0 w-full">
        <CadCanvas />

        {/* Dynamic Coordinate & Input Pill (Bottom Left) */}
        <div className="absolute left-2.5 bottom-2.5 z-20 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setNumpadOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-1)]/95 border border-[var(--line)] text-[10px] text-[var(--cyan)] shadow-lg active:scale-95"
          >
            <Hash size={12} />
            <span>
              {units === 'in'
                ? `X:${((cursorWorld?.x ?? 0) / 25.4).toFixed(3)}" Y:${((cursorWorld?.y ?? 0) / 25.4).toFixed(3)}"`
                : `X:${(cursorWorld?.x ?? 0).toFixed(1)}mm Y:${(cursorWorld?.y ?? 0).toFixed(1)}mm`}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              const nextUnit: CadUnit = units === 'mm' ? 'in' : 'mm';
              setUnits(nextUnit);
              showToast(`Unit: ${nextUnit.toUpperCase()}`);
            }}
            className={`px-2 py-1 rounded border font-mono text-[10px] font-bold shadow-lg active:scale-95 ${
              units === 'in'
                ? 'bg-[var(--warn)]/20 text-[var(--warn)] border-[var(--warn)]/50'
                : 'bg-[var(--cyan)]/20 text-[var(--cyan)] border-[var(--cyan)]/50'
            }`}
          >
            {units.toUpperCase()}
          </button>
        </div>

        {/* Selected Entity Actions (Floating Bottom Right) */}
        {selectedIds.length > 0 && (
          <div className="absolute right-2.5 bottom-2.5 z-20 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                deleteSelected();
                showToast(t12(language, 'Deleted', 'Silindi'));
              }}
              className="w-10 h-10 rounded bg-[var(--bad)] text-white flex items-center justify-center shadow-xl active:scale-90"
              title="Delete Selected"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}

        {/* Live Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute top-3 left-1/2 -translate-x-1/2 z-30 rounded border border-[var(--cyan)] bg-[var(--bg-1)]/95 px-3 py-1 font-mono text-[10px] text-[var(--cyan)] shadow-xl"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Bottom Categorized Tool Ribbon (Touch Ergonomic) ─── */}
      <div className="flex-none z-20 border-t border-[var(--line)] bg-[var(--bg-1)] px-1 py-1.5 shadow-2xl">
        <div className="flex items-stretch gap-1 overflow-x-auto no-scrollbar">
          {getToolsForCategory().map((t) => {
            const Icon = t.icon;
            const isSelect = t.id === 'SELECT';
            const isActive = isSelect ? !activeCommand : activeCommand === t.cmd;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleToolClick(t.cmd, t.label)}
                className={`flex flex-col items-center justify-center min-w-[58px] h-[48px] px-1 rounded transition-all active:scale-95 ${
                  isActive
                    ? 'bg-[var(--cyan)] text-[var(--bg-0)] font-black shadow-md'
                    : 'bg-[var(--bg-2)] text-[var(--alu)] hover:text-white border border-[var(--line)]'
                }`}
              >
                <Icon size={16} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
                <span className="text-[8px] font-black uppercase tracking-tight truncate max-w-full mt-0.5">
                  {t.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── On-Screen Engineering Numeric Keypad ─── */}
      <AnimatePresence>
        {numpadOpen && (
          <>
            <div
              onClick={() => setNumpadOpen(false)}
              className="fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-[var(--line)] bg-[var(--bg-1)] p-4 shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <span className="text-xs font-bold text-[var(--ink)]">
                  {t12(language, '📐 Dynamic Coordinate / Dimension Input', '📐 Dinamik Ölçü ve Koordinat Girişi')}
                </span>
                <button type="button" onClick={() => setNumpadOpen(false)} className="text-[var(--alu-dim)]">
                  <X size={18} />
                </button>
              </div>

              {/* Input Display */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={numpadInput}
                  onChange={(e) => setNumpadInput(e.target.value)}
                  placeholder="e.g. 50 or 20,30 or @40<45"
                  className="flex-1 bg-[var(--bg-0)] border border-[var(--line)] rounded px-3 py-2 text-sm text-[var(--cyan)] font-mono outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleNumpadSubmit}
                  className="px-4 py-2 rounded bg-[var(--cyan)] text-[var(--bg-0)] font-black text-xs uppercase active:scale-95"
                >
                  ENTER
                </button>
              </div>

              {/* Keypad Grid */}
              <div className="grid grid-cols-4 gap-1.5 font-mono text-sm">
                {['7', '8', '9', 'DEL'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      if (k === 'DEL') setNumpadInput((prev) => prev.slice(0, -1));
                      else setNumpadInput((prev) => prev + k);
                    }}
                    className="py-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] font-bold active:scale-95"
                  >
                    {k}
                  </button>
                ))}
                {['4', '5', '6', ','].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setNumpadInput((prev) => prev + k)}
                    className="py-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] font-bold active:scale-95"
                  >
                    {k}
                  </button>
                ))}
                {['1', '2', '3', '@'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setNumpadInput((prev) => prev + k)}
                    className="py-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] font-bold active:scale-95"
                  >
                    {k}
                  </button>
                ))}
                {['0', '.', '"', '<'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setNumpadInput((prev) => prev + k)}
                    className="py-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] font-bold active:scale-95"
                  >
                    {k}
                  </button>
                ))}
                {['-', 'mm', 'in', 'CLR'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      if (k === 'CLR') setNumpadInput('');
                      else setNumpadInput((prev) => prev + k);
                    }}
                    className={`py-2 rounded border font-bold text-xs active:scale-95 ${
                      k === 'CLR'
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : k === 'in' || k === 'mm'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-mono'
                        : 'bg-[var(--bg-2)] text-[var(--ink)] border-[var(--line)]'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>

              {/* Preset quick values */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                {(units === 'in'
                  ? ['0.5"', '1"', '1.5"', '2"', '3"', '4"', '@2<0', '@2<90']
                  : ['10', '20', '30', '40', '50', '100', '@50<0', '@50<90']
                ).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setNumpadInput(val);
                      commandProcessor.handleValueInput(val);
                      setNumpadOpen(false);
                      showToast(`Sent: ${val}`);
                    }}
                    className="px-2 py-1 rounded bg-[var(--bg-3)] border border-[var(--line-strong)] text-[10px] text-[var(--cyan)] shrink-0 active:scale-95 font-mono"
                  >
                    {val}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Drawer Menu ─── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <div
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-[var(--line)] bg-[var(--bg-1)] p-4 shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                  <div className="flex items-center gap-2">
                    <Sliders size={16} className="text-[var(--cyan)]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                      AluCAD Mobile Suite
                    </span>
                  </div>
                  <button type="button" onClick={() => setMenuOpen(false)} className="text-[var(--alu-dim)]">
                    <X size={16} />
                  </button>
                </div>

                {/* Menu Action List */}
                <div className="space-y-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => { setLayersOpen(true); setMenuOpen(false); }}
                    className="w-full flex items-center justify-between p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] active:scale-98"
                  >
                    <div className="flex items-center gap-2">
                      <LayersIcon size={14} className="text-[var(--cyan)]" />
                      <span>{t12(language, 'Layers Manager', 'Katman Yöneticisi')}</span>
                    </div>
                    <span className="text-[10px] text-[var(--alu-dim)]">{layers.length}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPresetOpen(true); setMenuOpen(false); }}
                    className="w-full flex items-center justify-between p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] active:scale-98"
                  >
                    <div className="flex items-center gap-2">
                      <Shapes size={14} className="text-[var(--ok)]" />
                      <span>{t12(language, 'Hardware & Presets', 'Parça & Profil Kütüphanesi')}</span>
                    </div>
                    <ChevronRight size={14} className="text-[var(--alu-dim)]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setSnapsOpen(true); setMenuOpen(false); }}
                    className="w-full flex items-center justify-between p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] active:scale-98"
                  >
                    <div className="flex items-center gap-2">
                      <Magnet size={14} className="text-[var(--warn)]" />
                      <span>{t12(language, 'OSNAP Settings', 'Yakalama / Snap Ayarları')}</span>
                    </div>
                    <span className="text-[10px] text-[var(--alu-dim)]">{activeSnaps.length}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setExportOpen(true); setMenuOpen(false); }}
                    className="w-full flex items-center justify-between p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] active:scale-98"
                  >
                    <div className="flex items-center gap-2">
                      <Download size={14} className="text-[var(--cyan)]" />
                      <span>{t12(language, 'Export & Import (DXF/PDF)', 'İçe / Dışa Aktar (DXF/PDF)')}</span>
                    </div>
                    <ChevronRight size={14} className="text-[var(--alu-dim)]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setHelpOpen(true); setMenuOpen(false); }}
                    className="w-full flex items-center justify-between p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] active:scale-98"
                  >
                    <div className="flex items-center gap-2">
                      <HelpCircle size={14} className="text-[var(--alu-dim)]" />
                      <span>{t12(language, 'Gestures & Guide', 'Kullanım Kılavuzu')}</span>
                    </div>
                    <ChevronRight size={14} className="text-[var(--alu-dim)]" />
                  </button>

                  {/* Dimension Units (MM / IN) */}
                  <div className="p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[var(--ink)]">
                      <span>{tCad.units?.dimensionUnits || 'Dimension Units'}</span>
                      <span className="text-[var(--cyan)] font-mono text-[10px] uppercase font-bold">{units}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          setUnits('mm');
                          showToast('Unit: MM');
                        }}
                        className={`py-1.5 rounded border text-center font-bold transition-all ${
                          units === 'mm'
                            ? 'bg-[var(--cyan)] text-[var(--bg-0)] border-[var(--cyan)]'
                            : 'bg-[var(--bg-0)] text-[var(--alu-dim)] border-[var(--line)] hover:text-[var(--ink)]'
                        }`}
                      >
                        MM (Metric)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUnits('in');
                          showToast('Unit: IN');
                        }}
                        className={`py-1.5 rounded border text-center font-bold transition-all ${
                          units === 'in'
                            ? 'bg-[var(--warn)] text-[var(--bg-0)] border-[var(--warn)]'
                            : 'bg-[var(--bg-0)] text-[var(--alu-dim)] border-[var(--line)] hover:text-[var(--ink)]'
                        }`}
                      >
                        IN (Inch)
                      </button>
                    </div>
                  </div>

                  {/* 12-Language Selector */}
                  <div className="p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[var(--ink)]">
                      <span>{tCad.languageSelector?.selectLanguage || 'Language / Dil'}</span>
                      <span className="text-[var(--cyan)] font-mono text-[10px] uppercase font-bold">{language}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 max-h-36 overflow-y-auto pr-0.5">
                      {CAD_LANGUAGES.map((lang) => {
                        const isActive = language === lang.id;
                        return (
                          <button
                            key={lang.id}
                            type="button"
                            onClick={() => {
                              setLanguage(lang.id as any);
                              showToast(`Language: ${lang.native}`);
                            }}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-left text-[10px] transition-all ${
                              isActive
                                ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] font-bold border border-[var(--cyan)]/50'
                                : 'bg-[var(--bg-0)] text-[var(--alu)] border border-[var(--line)] hover:text-white'
                            }`}
                          >
                            <FlagIcon lang={lang.id} className="w-3.5 h-3.5 rounded-sm shrink-0" />
                            <span className="truncate">{lang.native}</span>
                            {isActive && <Check size={10} className="ml-auto text-[var(--cyan)] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Status */}
              <div className="pt-3 border-t border-[var(--line)] text-[10px] text-[var(--alu-dim)] space-y-1">
                <div>AluCAD OS v2026.9 Mobile</div>
                <div>ISO 2768-mK / AutoCAD 2018 DXF</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Hardware & Presets Modal ─── */}
      <AnimatePresence>
        {presetOpen && (
          <>
            <div
              onClick={() => setPresetOpen(false)}
              className="fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-[var(--line)] bg-[var(--bg-1)] p-4 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <span className="text-xs font-bold text-[var(--ink)]">
                  {t12(language, '📐 Standard Engineering Catalog', '📐 Standart Mühendislik Kütüphanesi')}
                </span>
                <button type="button" onClick={() => setPresetOpen(false)} className="text-[var(--alu-dim)]">
                  <X size={16} />
                </button>
              </div>

              {/* T-Slot Aluminum Extrusions */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[var(--cyan)] uppercase">
                  T-Slot Alüminyum Profiller (DIN EN 12020)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '2020', label: '20×20' },
                    { id: '2040', label: '20×40' },
                    { id: '3030', label: '30×30' },
                    { id: '3060', label: '30×60' },
                    { id: '4040', label: '40×40' },
                    { id: '4080', label: '40×80' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleInsertTSlot(item.id)}
                      className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)] text-center active:scale-95 space-y-0.5 hover:border-cyan-500/40 transition-all"
                    >
                      <Box size={14} className="mx-auto text-[var(--cyan)]" />
                      <div className="text-[10px] font-bold text-[var(--ink)]">{item.label}</div>
                      <div className="text-[7px] text-[var(--alu-dim)]">T-Kanal</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Standard Fasteners */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[var(--warn)] uppercase">
                  ISO Metrik Civatalar (ISO 4014 / 4017)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { d: 5, l: 25 },
                    { d: 6, l: 30 },
                    { d: 8, l: 40 },
                  ].map((f) => (
                    <button
                      key={`${f.d}-${f.l}`}
                      type="button"
                      onClick={() => handleInsertFastener(f.d, f.l)}
                      className="p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-center active:scale-95 space-y-1"
                    >
                      <Nut size={16} className="mx-auto text-[var(--warn)]" />
                      <div className="text-[11px] font-bold text-[var(--ink)]">M{f.d}×{f.l}</div>
                      <div className="text-[8px] text-[var(--alu-dim)]">Civata</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gears & Mechanical */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[var(--ok)] uppercase">
                  Dişli & Mekanik Elemanlar
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleInsertGear(20, 2)}
                    className="p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-center active:scale-95 space-y-1"
                  >
                    <Cog size={16} className="mx-auto text-[var(--ok)]" />
                    <div className="text-[11px] font-bold text-[var(--ink)]">Z=20 M=2</div>
                    <div className="text-[8px] text-[var(--alu-dim)]">Düz Dişli</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInsertRect(100, 50)}
                    className="p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-center active:scale-95 space-y-1"
                  >
                    <Square size={16} className="mx-auto text-[var(--cyan)]" />
                    <div className="text-[11px] font-bold text-[var(--ink)]">100×50</div>
                    <div className="text-[8px] text-[var(--alu-dim)]">Plaka</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInsertCircle(30, 10)}
                    className="p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-center active:scale-95 space-y-1"
                  >
                    <Circle size={16} className="mx-auto text-[var(--cyan)]" />
                    <div className="text-[11px] font-bold text-[var(--ink)]">Ø60 / Ø20</div>
                    <div className="text-[8px] text-[var(--alu-dim)]">Flanş</div>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Layers Manager Drawer ─── */}
      <AnimatePresence>
        {layersOpen && (
          <>
            <div
              onClick={() => setLayersOpen(false)}
              className="fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-[var(--line)] bg-[var(--bg-1)] p-4 shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <span className="text-xs font-bold text-[var(--ink)]">
                  {t12(language, 'Layers Manager', 'Katman Yöneticisi')}
                </span>
                <button type="button" onClick={() => setLayersOpen(false)} className="text-[var(--alu-dim)]">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-1.5">
                {layers.map((l) => (
                  <div
                    key={l.id}
                    className={`flex items-center justify-between p-2 rounded border ${
                      activeLayerId === l.id
                        ? 'bg-[var(--bg-3)] border-[var(--cyan)]'
                        : 'bg-[var(--bg-2)] border-[var(--line)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveLayer(l.id)}
                      className="flex items-center gap-2 text-xs font-bold text-[var(--ink)]"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: l.color }}
                      />
                      <span>{l.name}</span>
                      {activeLayerId === l.id && (
                        <span className="text-[9px] text-[var(--cyan)] font-normal">(Aktif)</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleLayerVisibility(l.id)}
                      className="text-[var(--alu-dim)] hover:text-white"
                    >
                      {l.visible ? <Eye size={14} /> : <EyeOff size={14} className="text-[var(--bad)]" />}
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const name = `Layer-${layers.length + 1}`;
                  addLayer(name, '#3ad0e6');
                  showToast(`${name} eklendi`);
                }}
                className="w-full py-2 rounded bg-[var(--bg-3)] border border-[var(--line)] text-xs font-bold text-[var(--cyan)] uppercase active:scale-95"
              >
                + {t12(language, 'Add New Layer', 'Yeni Katman Ekle')}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── OSNAP Settings Modal ─── */}
      <AnimatePresence>
        {snapsOpen && (
          <>
            <div
              onClick={() => setSnapsOpen(false)}
              className="fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-[var(--line)] bg-[var(--bg-1)] p-4 shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <span className="text-xs font-bold text-[var(--ink)]">
                  {t12(language, '🧲 Object Snap (OSNAP) Modes', '🧲 Geometrik Yakalama (OSNAP) Modları')}
                </span>
                <button type="button" onClick={() => setSnapsOpen(false)} className="text-[var(--alu-dim)]">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  { mode: 'END' as OSnapMode, label: 'Endpoint (Uç Nokta)' },
                  { mode: 'MID' as OSnapMode, label: 'Midpoint (Orta Nokta)' },
                  { mode: 'CEN' as OSnapMode, label: 'Center (Merkez)' },
                  { mode: 'INT' as OSnapMode, label: 'Intersection (Kesişim)' },
                  { mode: 'QUA' as OSnapMode, label: 'Quadrant (Çeyrek)' },
                  { mode: 'PER' as OSnapMode, label: 'Perpendicular (Dik)' },
                  { mode: 'TAN' as OSnapMode, label: 'Tangent (Teğet)' },
                  { mode: 'NEA' as OSnapMode, label: 'Nearest (En Yakın)' },
                ].map(({ mode, label }) => {
                  const isChecked = activeSnaps.includes(mode);
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setActiveSnaps(activeSnaps.filter((s) => s !== mode));
                        } else {
                          setActiveSnaps([...activeSnaps, mode]);
                        }
                      }}
                      className={`flex items-center justify-between p-2.5 rounded border text-left active:scale-95 ${
                        isChecked
                          ? 'bg-[var(--cyan)]/10 border-[var(--cyan)] text-[var(--cyan)]'
                          : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)]'
                      }`}
                    >
                      <span className="text-[11px] font-bold">{label}</span>
                      {isChecked && <Check size={14} className="text-[var(--cyan)]" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Export & Import Modal ─── */}
      <AnimatePresence>
        {exportOpen && (
          <>
            <div
              onClick={() => setExportOpen(false)}
              className="fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-[var(--line)] bg-[var(--bg-1)] p-4 shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <span className="text-xs font-bold text-[var(--ink)]">
                  {t12(language, 'AutoCAD Import & Export', 'AutoCAD İçe / Dışa Aktarım')}
                </span>
                <button type="button" onClick={() => setExportOpen(false)} className="text-[var(--alu-dim)]">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <button
                  type="button"
                  onClick={handleExportDXF}
                  className="w-full flex items-center justify-between p-3 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <Download size={16} className="text-[var(--cyan)]" />
                    <div className="text-left">
                      <div className="font-bold">AutoCAD DXF (.dxf) İndir</div>
                      <div className="text-[9px] text-[var(--alu-dim)]">CNC Lazer, Plazma ve CAD uyumlu</div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-[var(--alu-dim)]" />
                </button>

                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="w-full flex items-center justify-between p-3 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[var(--warn)]" />
                    <div className="text-left">
                      <div className="font-bold">ISO 7200 Teknik Resim PDF İndir</div>
                      <div className="text-[9px] text-[var(--alu-dim)]">Antetli A4/A3 ölçekli vektör pafta</div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-[var(--alu-dim)]" />
                </button>

                <button
                  type="button"
                  onClick={handleExportSVG}
                  className="w-full flex items-center justify-between p-3 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[var(--ok)]" />
                    <div className="text-left">
                      <div className="font-bold">Vektörel Çizim (SVG) İndir</div>
                      <div className="text-[9px] text-[var(--alu-dim)]">Ölçeklenebilir vektör grafik formatı</div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-[var(--alu-dim)]" />
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-between p-3 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <Upload size={16} className="text-[var(--ok)]" />
                    <div className="text-left">
                      <div className="font-bold">DXF Dosyası Yükle / Aç</div>
                      <div className="text-[9px] text-[var(--alu-dim)]">AutoCAD çizimlerini içe aktar</div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-[var(--alu-dim)]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExportOpen(false);
                    setCadExportModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded bg-cyan-500/15 border border-cyan-500/50 text-cyan-200 active:scale-98 "
                >
                  <div className="flex items-center gap-2">
                    <Sliders size={16} className="text-[var(--cyan)]" />
                    <div className="text-left">
                      <div className="font-bold">⚡ Gelişmiş Dışa Aktar (Tüm Formatlar)</div>
                      <div className="text-[9px] text-[var(--alu-dim)]">Ölçek, Antet, CNC G-Code, DXF, PDF, JSON</div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-[var(--cyan)]" />
                </button>

                <button
                  type="button"
                  onClick={handleTransferTo3D}
                  className="w-full flex items-center justify-between p-3 rounded bg-[var(--cyan)]/10 border border-[var(--cyan)] text-[var(--cyan)] active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <Box size={16} />
                    <div className="text-left">
                      <div className="font-bold">3D Katı Modele Dönüştür</div>
                      <div className="text-[9px] text-[var(--cyan)]/70">Design Studio ekstrüzyon köprüsü</div>
                    </div>
                  </div>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Advanced Engineering Export Center Modal ─── */}
      <CadExportModal
        isOpen={cadExportModalOpen}
        onClose={() => setCadExportModalOpen(false)}
      />

      {/* ─── Help & Instructions Modal ─── */}
      <AnimatePresence>
        {helpOpen && (
          <>
            <div
              onClick={() => setHelpOpen(false)}
              className="fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-[var(--line)] bg-[var(--bg-1)] p-4 shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <span className="text-xs font-bold text-[var(--ink)]">
                  {t12(language, '2D AutoCAD Touch Gestures', '2D Dokunmatik Çizim Kılavuzu')}
                </span>
                <button type="button" onClick={() => setHelpOpen(false)} className="text-[var(--alu-dim)]">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 text-xs text-[var(--alu)] leading-relaxed">
                <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)] space-y-1">
                  <div className="font-bold text-[var(--cyan)]">👆 Tek Parmakla Çizim / Dokunma:</div>
                  <p className="text-[11px] text-[var(--alu-dim)]">
                    Çizgi, daire veya dikdörtgen aracı seçiliyken ekrana dokunarak noktaları belirleyin. Parmağınızı kaydırırken hedef snap noktası ve çizgi önizlemesi canlı olarak takip eder.
                  </p>
                </div>

                <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)] space-y-1">
                  <div className="font-bold text-[var(--warn)]">✌️ İki Parmakla Yakınlaştırma & Gezinme:</div>
                  <p className="text-[11px] text-[var(--alu-dim)]">
                    Herhangi bir araç etkinken iki parmağınızla ekranı sıkıştırarak yakınlaşın veya kaydırarak çizim alanında özgürce gezinin.
                  </p>
                </div>

                <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)] space-y-1">
                  <div className="font-bold text-[var(--ok)]">⌨️ Dinamik Numpad:</div>
                  <p className="text-[11px] text-[var(--alu-dim)]">
                    Sol alttaki koordinat butonuna basarak sanal klavye yerine mühendislik tuş takımını açabilir, tam ölçüleri (örn. 50 mm veya @40&lt;45) doğrudan girebilirsiniz.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AEGIS AI 2D CAD DRAFTING MODAL */}
      <Aegis2DCadModal
        isOpen={aiCadOpen}
        initialPrompt={aegisHandover?.prompt}
        autoRunKey={aegisHandover?.key}
        onClose={() => setAiCadOpen(false)}
        onNotification={(msg) => showToast(msg)}
      />
    </div>
  );
}

export default Mobile2DCad;
