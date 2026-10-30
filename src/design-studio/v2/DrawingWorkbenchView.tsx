'use client';

/**
 * 📐 2D DRAWING & DRAFTING WORKBENCH (V2 UNIFIED 3D WORKSTATION)
 * 
 * Provides dual 2D capabilities:
 * 1. ISO 128 / DIN 2D Technical Drawing (Automatic multi-view projection blueprint of 3D parts)
 * 2. 2D AluCAD Drafting (Parametric sketch canvas with geometric constraints & DXF)
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  FileText,
  Pencil,
  X,
  Download,
  Printer,
  Maximize2,
  Sliders,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  Move,
} from 'lucide-react';

const SHEET_DIMENSIONS: Record<'A4' | 'A3' | 'A2', { w: number; h: number }> = {
  A4: { w: 840, h: 594 },
  A3: { w: 1188, h: 840 },
  A2: { w: 1680, h: 1188 },
};
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { useDesignStore, type DesignPart } from '@/design-studio/designStore';
import {
  generateTechnicalDrawingSVG,
  type DrawingSheetConfig,
  type DrawingTemplateStyle,
  type DrawingColorTheme,
} from '@/design-studio/technicalDrawingGenerator';
import { calculateAssemblyMassProperties } from '@/design-studio/materialsEngine';
import { downloadFile } from '@/design-studio/exporter';

// Dynamic 2D AluCAD Drafting Engine
const AluCAD = dynamic(() => import('@/cad/components/AluCAD').then((m) => m.AluCAD || m.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[var(--bg-0)] text-[11px] font-mono text-cyan-400">
      <div className="flex flex-col items-center gap-2">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        <span>YÜKLENİYOR: 2D ALUCAD DRAFTING MOTORU...</span>
      </div>
    </div>
  ),
});

interface DrawingWorkbenchViewProps {
  onClose: () => void;
}

export function DrawingWorkbenchView({ onClose }: DrawingWorkbenchViewProps) {
  const { language } = useI18nStore();
  const parts = useDesignStore((s) => s.parts);
  const projectName = useDesignStore((s) => s.projectName);

  // Drawing View Mode: 'blueprint' (ISO 128 Technical Drawing) vs 'cad2d' (AluCAD Drafting)
  const [viewMode, setViewMode] = useState<'blueprint' | 'cad2d'>('blueprint');

  // Blueprint Controls
  const [targetPartId, setTargetPartId] = useState<string>('all');
  const [sheetSize, setSheetSize] = useState<'A4' | 'A3' | 'A2'>('A3');
  const [projection, setProjection] = useState<'first-angle' | 'third-angle'>('first-angle');
  const [colorTheme, setColorTheme] = useState<DrawingColorTheme>('blueprint');
  const [templateStyle, setTemplateStyle] = useState<DrawingTemplateStyle>('iso7200');
  const [drawingScale, setDrawingScale] = useState<number>(1);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Interactive Pan & Zoom Canvas State
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });

  const { w: sheetW, h: sheetH } = SHEET_DIMENSIONS[sheetSize];

  // Auto-fit sheet to container screen with generous margin
  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const pad = 36;
    const availW = Math.max(100, rect.width - pad);
    const availH = Math.max(100, rect.height - pad);

    const sScale = Math.min(availW / sheetW, availH / sheetH);
    const scaledW = sheetW * sScale;
    const scaledH = sheetH * sScale;
    const newPanX = (rect.width - scaledW) / 2;
    const newPanY = (rect.height - scaledH) / 2;

    setZoom(sScale);
    setPan({ x: newPanX, y: newPanY });
  }, [sheetW, sheetH]);

  // Fit sheet width to container
  const fitToWidth = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const pad = 24;
    const availW = Math.max(100, rect.width - pad);

    const sScale = availW / sheetW;
    const scaledW = sheetW * sScale;
    const newPanX = (rect.width - scaledW) / 2;
    const newPanY = Math.max(16, (rect.height - sheetH * sScale) / 2);

    setZoom(sScale);
    setPan({ x: newPanX, y: newPanY });
  }, [sheetW, sheetH]);

  // Set 1:1 true scale
  const setActualSize = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newPanX = (rect.width - sheetW) / 2;
    const newPanY = (rect.height - sheetH) / 2;

    setZoom(1);
    setPan({ x: newPanX, y: newPanY });
  }, [sheetW, sheetH]);

  // Initial auto-fit on mount & when sheetSize changes
  useEffect(() => {
    if (viewMode !== 'blueprint') return;
    const timer = setTimeout(() => {
      fitToScreen();
    }, 60);
    return () => clearTimeout(timer);
  }, [fitToScreen, sheetSize, viewMode]);

  // Re-fit on container resize
  useEffect(() => {
    if (viewMode !== 'blueprint') return;
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    let hasInitiallyFitted = false;
    const ro = new ResizeObserver(() => {
      if (!hasInitiallyFitted) {
        fitToScreen();
        hasInitiallyFitted = true;
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitToScreen, viewMode]);

  // Native non-passive Wheel Zoom to guarantee smooth zoom without page scroll
  useEffect(() => {
    if (viewMode !== 'blueprint') return;
    const el = containerRef.current;
    if (!el) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      setZoom((prevZoom) => {
        const nextZoom = Math.min(5.0, Math.max(0.15, prevZoom * zoomFactor));
        const scaleRatio = nextZoom / prevZoom;
        setPan((prevPan) => ({
          x: mouseX - (mouseX - prevPan.x) * scaleRatio,
          y: mouseY - (mouseY - prevPan.y) * scaleRatio,
        }));
        return nextZoom;
      });
    };

    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheelNative);
    };
  }, [viewMode]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Touch pan & pinch-zoom handlers
  const touchStateRef = useRef<{
    mode: 'none' | 'pan' | 'pinch';
    startDist: number;
    startZoom: number;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
  }>({
    mode: 'none',
    startDist: 0,
    startZoom: 1,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStateRef.current = {
        mode: 'pan',
        startDist: 0,
        startZoom: zoom,
        startX: t.clientX,
        startY: t.clientY,
        startPanX: pan.x,
        startPanY: pan.y,
      };
    } else if (e.touches.length === 2) {
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      touchStateRef.current = {
        mode: 'pinch',
        startDist: dist,
        startZoom: zoom,
        startX: 0,
        startY: 0,
        startPanX: pan.x,
        startPanY: pan.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStateRef.current.mode === 'pan' && e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - touchStateRef.current.startX;
      const dy = t.clientY - touchStateRef.current.startY;
      setPan({
        x: touchStateRef.current.startPanX + dx,
        y: touchStateRef.current.startPanY + dy,
      });
    } else if (touchStateRef.current.mode === 'pinch' && e.touches.length === 2) {
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      if (touchStateRef.current.startDist > 0) {
        const factor = dist / touchStateRef.current.startDist;
        setZoom(Math.min(5.0, Math.max(0.15, touchStateRef.current.startZoom * factor)));
      }
    }
  };

  const handleTouchEnd = () => {
    touchStateRef.current.mode = 'none';
  };

  // Zoom step buttons
  const handleZoomIn = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setZoom((prevZoom) => {
      const nextZoom = Math.min(5.0, prevZoom * 1.25);
      const scaleRatio = nextZoom / prevZoom;
      setPan((prevPan) => ({
        x: centerX - (centerX - prevPan.x) * scaleRatio,
        y: centerY - (centerY - prevPan.y) * scaleRatio,
      }));
      return nextZoom;
    });
  };

  const handleZoomOut = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setZoom((prevZoom) => {
      const nextZoom = Math.max(0.15, prevZoom * 0.8);
      const scaleRatio = nextZoom / prevZoom;
      setPan((prevPan) => ({
        x: centerX - (centerX - prevPan.x) * scaleRatio,
        y: centerY - (centerY - prevPan.y) * scaleRatio,
      }));
      return nextZoom;
    });
  };

  const massProps = useMemo(() => {
    return calculateAssemblyMassProperties(parts);
  }, [parts]);

  const activeParts = useMemo(() => {
    if (targetPartId === 'all') return parts;
    const p = parts.find((pt) => pt.id === targetPartId);
    return p ? [p] : parts;
  }, [parts, targetPartId]);

  // Generate Technical Drawing SVG
  const drawingSvgString = useMemo(() => {
    if (parts.length === 0) return '';
    const config: Partial<DrawingSheetConfig> = {
      sheetSize,
      projection,
      scale: drawingScale,
      projectName: projectName || 'ALUCALC_PROJECT',
      partName: targetPartId === 'all' ? (parts.length > 1 ? 'ASSEMBLY' : parts[0]?.name || 'PART') : activeParts[0]?.name || 'PART',
      materialName: 'EN AW-6061-T6 (AlMg1SiCu)',
      author: 'AluCAD OS Engineer',
      date: new Date().toISOString().split('T')[0],
      templateStyle,
      colorTheme,
      lang: language,
      showBomTable: targetPartId === 'all' && parts.length > 1,
      showBalloons: targetPartId === 'all' && parts.length > 1,
    };

    try {
      return generateTechnicalDrawingSVG(activeParts, massProps, config);
    } catch (err) {
      console.error('Error generating technical drawing SVG:', err);
      return '';
    }
  }, [activeParts, massProps, parts, targetPartId, sheetSize, projection, drawingScale, projectName, templateStyle, colorTheme, language]);

  const ping = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleDownloadSVG = () => {
    if (!drawingSvgString) return;
    const filename = `${projectName.replace(/\s+/g, '_')}_2D_${sheetSize}.svg`;
    downloadFile(drawingSvgString, filename, 'image/svg+xml');
    ping(t12(language, 'Technical Drawing SVG exported', 'Teknik Resim SVG olarak indirildi'));
  };

  const handlePrint = () => {
    if (!drawingSvgString) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${projectName} - 2D Drawing</title>
            <style>
              body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: white; }
              svg { width: 100vw; height: 100vh; }
              @media print {
                body { margin: 0; }
                svg { width: 100%; height: 100%; }
              }
            </style>
          </head>
          <body>
            ${drawingSvgString}
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--bg-0)] text-slate-200 select-none font-mono">
      {/* ─── WORKBENCH SUB-HEADER BAR ─── */}
      <div className="flex h-10 items-center justify-between border-b border-[var(--line)] bg-[var(--bg-1)] px-3 shrink-0 z-30">
        {/* Left: Mode Switcher */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 p-0.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
            <button
              onClick={() => setViewMode('blueprint')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-s)] text-[10px] font-bold transition-all cursor-pointer ${
                viewMode === 'blueprint'
                  ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-sm'
                  : 'text-[var(--alu-dim)] hover:text-white'
              }`}
            >
              <FileText size={12} />
              <span>{t12(language, 'ISO 128 BLUEPRINT', '2D TEKNİK RESİM')}</span>
            </button>

            <button
              onClick={() => setViewMode('cad2d')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-s)] text-[10px] font-bold transition-all cursor-pointer ${
                viewMode === 'cad2d'
                  ? 'bg-[var(--cyan)] text-black shadow-sm'
                  : 'text-[var(--alu-dim)] hover:text-white'
              }`}
            >
              <Pencil size={12} />
              <span>{t12(language, '2D ALUCAD DRAFTING', '2D PARAMETRİK ÇİZİM')}</span>
            </button>
          </div>
        </div>

        {/* Center: Blueprint Specific Controls */}
        {viewMode === 'blueprint' && (
          <div className="hidden md:flex items-center gap-2">
            {/* Target Selector */}
            <select
              value={targetPartId}
              onChange={(e) => setTargetPartId(e.target.value)}
              className="bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)] px-2 py-1 text-[10px] text-white font-bold outline-none cursor-pointer"
            >
              <option value="all">🏢 {t12(language, `Full Assembly (${parts.length})`, `Tüm Montaj (${parts.length} Parça)`)}</option>
              {parts.map((p, idx) => (
                <option key={p.id} value={p.id}>
                  🧩 {p.name || `Parça ${idx + 1}`}
                </option>
              ))}
            </select>

            {/* Sheet Size */}
            <div className="flex items-center bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)] p-0.5">
              {(['A4', 'A3', 'A2'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSheetSize(sz)}
                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                    sheetSize === sz ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>

            {/* Projection Angle */}
            <div className="flex items-center bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)] p-0.5">
              <button
                onClick={() => setProjection('first-angle')}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  projection === 'first-angle' ? 'bg-[var(--cyan)] text-black' : 'text-slate-400 hover:text-white'
                }`}
                title="1st Angle Projection (ISO / European Standard)"
              >
                1. Açı (ISO)
              </button>
              <button
                onClick={() => setProjection('third-angle')}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  projection === 'third-angle' ? 'bg-[var(--cyan)] text-black' : 'text-slate-400 hover:text-white'
                }`}
                title="3rd Angle Projection (ASME / US Standard)"
              >
                3. Açı (ASME)
              </button>
            </div>

            {/* Theme */}
            <div className="flex items-center bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)] p-0.5">
              {(['blueprint', 'classic', 'dark'] as const).map((th) => (
                <button
                  key={th}
                  onClick={() => setColorTheme(th)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold capitalize ${
                    colorTheme === th ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {th === 'blueprint' ? 'Mavi' : th === 'classic' ? 'Beyaz' : 'Koyu'}
                </button>
              ))}
            </div>

            {/* View Projection Scale */}
            <div className="flex items-center bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)] px-1.5 py-0.5 gap-1">
              <span className="text-[9px] text-slate-400 font-bold">{t12(language, 'Scale:', 'Ölçek:')}</span>
              <select
                value={drawingScale}
                onChange={(e) => setDrawingScale(Number(e.target.value))}
                className="bg-transparent text-[9.5px] text-[var(--cyan)] font-bold outline-none cursor-pointer"
                title={t12(language, 'Drawing Projection Scale', 'Teknik Resim Görünüş Ölçeği')}
              >
                <option value={1} className="bg-[var(--bg-1)] text-white">1:1 (Standart)</option>
                <option value={1.25} className="bg-[var(--bg-1)] text-white">1.25x (Geniş)</option>
                <option value={1.5} className="bg-[var(--bg-1)] text-white">1.5x (Büyük)</option>
                <option value={2} className="bg-[var(--bg-1)] text-white">2:1 (2x Detay)</option>
                <option value={0.75} className="bg-[var(--bg-1)] text-white">1:1.3 (Kompakt)</option>
                <option value={0.5} className="bg-[var(--bg-1)] text-white">1:2 (Küçük)</option>
              </select>
            </div>
          </div>
        )}

        {/* Right: Actions & Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          {viewMode === 'blueprint' && (
            <>
              {/* Zoom & Fit controls */}
              <div className="flex items-center bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)] p-0.5 mr-1 gap-0.5">
                <button
                  onClick={handleZoomOut}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 cursor-pointer"
                  title={t12(language, 'Zoom Out', 'Uzaklaş (-)')}
                >
                  <ZoomOut size={12} />
                </button>
                <button
                  onClick={fitToScreen}
                  className="px-1.5 py-0.5 text-[9px] text-[var(--cyan)] font-bold hover:bg-cyan-500/10 rounded cursor-pointer"
                  title={t12(language, 'Click to fit to screen', 'Ekrana Sığdır')}
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  onClick={handleZoomIn}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 cursor-pointer"
                  title={t12(language, 'Zoom In', 'Yakınlaş (+)')}
                >
                  <ZoomIn size={12} />
                </button>
                <button
                  onClick={fitToScreen}
                  className="p-1 text-slate-400 hover:text-[var(--cyan)] rounded hover:bg-white/5 cursor-pointer"
                  title={t12(language, 'Fit to Screen (Double Click Canvas)', 'Ekrana Sığdır (Çift Tık)')}
                >
                  <Maximize2 size={12} />
                </button>
                <button
                  onClick={setActualSize}
                  className="px-1 text-[9px] text-slate-400 hover:text-white rounded hover:bg-white/5 font-bold cursor-pointer"
                  title={t12(language, '1:1 Actual Size', '1:1 Gerçek Boyut')}
                >
                  1:1
                </button>
              </div>

              <button
                onClick={handleDownloadSVG}
                className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-white text-[9.5px] font-bold flex items-center gap-1 cursor-pointer"
                title="Download Technical Drawing SVG"
              >
                <Download size={11} className="text-purple-400" />
                <span>SVG</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-white text-[9.5px] font-bold flex items-center gap-1 cursor-pointer"
                title="Print or Save as PDF"
              >
                <Printer size={11} className="text-cyan-400" />
                <span>PDF</span>
              </button>
            </>
          )}

          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-s)] bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-[10px] transition-colors cursor-pointer ml-1"
            title="Return to 3D CAD"
          >
            <X size={12} />
            <span>{t12(language, 'Close 2D', '3D CAD\'e Dön')}</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-[var(--radius-s)] bg-[var(--cyan)] text-black font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in">
          <Check size={14} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ─── WORKBENCH CANVAS CONTENT ─── */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {viewMode === 'blueprint' ? (
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={fitToScreen}
            className={`w-full h-full relative overflow-hidden bg-[var(--bg-0)] select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {parts.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center text-center text-slate-500 text-xs">
                {t12(language, 'No 3D parts to generate drawing from.', 'Teknik resim oluşturmak için sahnede en az 1 parça olmalıdır.')}
              </div>
            ) : (
              <div
                style={{
                  width: `${sheetW}px`,
                  height: `${sheetH}px`,
                  transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                  transformOrigin: '0 0',
                  boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.12)',
                  transition: isDragging ? 'none' : 'transform 0.08s ease-out',
                }}
                className="absolute top-0 left-0 rounded-sm bg-white overflow-hidden pointer-events-none"
                dangerouslySetInnerHTML={{ __html: drawingSvgString }}
              />
            )}

            {/* Floating Navigation HUD at bottom right */}
            <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 bg-[var(--bg-1)]/90 border border-[var(--line)] px-2 py-1 rounded-[var(--radius-s)] text-[10px] text-slate-300 shadow-2xl">
              <button
                onClick={handleZoomOut}
                className="p-1 hover:text-white hover:bg-white/10 rounded cursor-pointer"
                title={t12(language, 'Zoom Out', 'Uzaklaş (-)')}
              >
                <ZoomOut size={13} />
              </button>

              <button
                onClick={fitToScreen}
                className="px-1.5 py-0.5 font-bold text-[var(--cyan)] hover:bg-cyan-500/10 rounded transition-colors cursor-pointer"
                title={t12(language, 'Click to fit to screen', 'Ekrana Sığdır')}
              >
                {Math.round(zoom * 100)}%
              </button>

              <button
                onClick={handleZoomIn}
                className="p-1 hover:text-white hover:bg-white/10 rounded cursor-pointer"
                title={t12(language, 'Zoom In', 'Yakınlaş (+)')}
              >
                <ZoomIn size={13} />
              </button>

              <div className="h-3 w-[1px] bg-[var(--line)] mx-0.5" />

              <button
                onClick={fitToScreen}
                className="p-1 hover:text-white hover:bg-white/10 rounded flex items-center gap-1 text-[9.5px] font-bold cursor-pointer"
                title={t12(language, 'Fit to Screen (Double Click Canvas)', 'Ekrana Sığdır (Çift Tık)')}
              >
                <Maximize2 size={12} />
                <span>{t12(language, 'Fit', 'Sığdır')}</span>
              </button>

              <button
                onClick={fitToWidth}
                className="p-1 hover:text-white hover:bg-white/10 rounded text-[9.5px] font-bold cursor-pointer"
                title={t12(language, 'Fit to Width', 'Genişliğe Sığdır')}
              >
                {t12(language, 'Width', 'Genişlik')}
              </button>

              <button
                onClick={setActualSize}
                className="p-1 hover:text-white hover:bg-white/10 rounded text-[9.5px] font-bold cursor-pointer"
                title={t12(language, '1:1 Actual Size', '1:1 Boyut')}
              >
                1:1
              </button>
            </div>

            {/* Quick helper badge at bottom left */}
            <div className="hidden md:flex absolute bottom-3 left-3 z-10 items-center gap-2 px-2.5 py-1 rounded-[var(--radius-s)] bg-black/70 border border-white/10 text-[9.5px] text-slate-300 pointer-events-none">
              <span className="text-[var(--cyan)] font-bold">💡 {t12(language, 'Tip:', 'İpucu:')}</span>
              <span>{t12(language, 'Mouse wheel to zoom • Drag to pan • Double-click to fit', 'Tekerlek ile Yakınlaş • Sürükle: Kaydır • Çift Tık: Sığdır')}</span>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <AluCAD />
          </div>
        )}
      </div>
    </div>
  );
}

export default DrawingWorkbenchView;
