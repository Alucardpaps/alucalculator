/**
 * AluCAD — Professional Engineering Export Center Modal
 * 
 * Standards Compliance:
 * - DIN EN ISO 5457 / ISO 7200 Technical Drawing Blueprints (PDF)
 * - Autodesk DXF AC1015 / AC1009 CNC Toolpaths
 * - W3C SVG 1.1 Vector Graphics
 * - ISO 6983 CNC G-Code Post-Processing
 * - AGENTS.md Industrial Instrument Control System
 */

import React, { useState, useMemo } from 'react';
import { useCadStore } from '../store/cadStore';
import { flattenPrimitive, geometryPrimitives, primitiveBounds } from '../kernel/primitives';
import { isLayerShown } from '../kernel/layers';
import { generateDXF } from '../dxf/DxfGenerator';
import { generatePDF } from '../export/PdfGenerator';
import { generateSVG } from '../export/SvgGenerator';
import { generateGcode } from '../export/GcodeGenerator';
import { CrossModuleBridge } from '@/system/crossModuleBridge';
import { useI18nStore } from '@/store/i18nStore';
import { getCadTranslations } from '@/locales/cadTranslations';
import { t12 } from '@/locales/t12';
import {
    X,
    Download,
    FileText,
    Cpu,
    Box,
    Printer,
    Layers,
    Sliders,
    CheckCircle2,
    Code,
    Sparkles,
    Image,
    Columns3
} from 'lucide-react';

interface CadExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialFormat?: 'PDF' | 'DXF' | 'SVG' | 'GCODE' | 'JSON' | 'IMAGE';
}

type ExportFormat = 'PDF' | 'DXF' | 'SVG' | 'GCODE' | 'JSON' | 'IMAGE';

export function CadExportModal({ isOpen, onClose, initialFormat = 'PDF' }: CadExportModalProps) {
    const { entities, layers, units: cadUnits } = useCadStore();
    const language = useI18nStore((s) => s.language);
    const tCad = useMemo(() => getCadTranslations(language), [language]);
    const [format, setFormat] = useState<ExportFormat>(initialFormat);
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState<string | null>(null);

    // ─────────────────────────────────────────────────────────────
    // METADATA & TITLE BLOCK
    // ─────────────────────────────────────────────────────────────
    const [partName, setPartName] = useState('ALUCAD_PART');
    const [drawingNumber, setDrawingNumber] = useState(`ALU-${new Date().getFullYear()}-001`);
    const [revision, setRevision] = useState('A.0');
    const [material, setMaterial] = useState('EN AW-6082-T6 (AlSi1MgMn)');
    const [designer, setDesigner] = useState('ALUCALC USER');
    const [company, setCompany] = useState('ALUCAD OS ENGINEERING');

    // ─────────────────────────────────────────────────────────────
    // FORMAT SPECIFIC CONFIG
    // ─────────────────────────────────────────────────────────────
    // PDF Config
    const [paperSize, setPaperSize] = useState<'A4' | 'A3' | 'A2' | 'A1'>('A4');
    const [orientation, setOrientation] = useState<'LANDSCAPE' | 'PORTRAIT'>('LANDSCAPE');
    const [scale, setScale] = useState<'FIT' | '1:1' | '1:2' | '1:5' | '1:10' | '2:1'>('FIT');
    const [colorMode, setColorMode] = useState<'MONOCHROME' | 'COLOR'>('MONOCHROME');
    const [showTitleBlock, setShowTitleBlock] = useState(true);

    // DXF Config
    const [dxfVersion, setDxfVersion] = useState<'AC1015' | 'AC1009'>('AC1015');
    const [dxfUnits, setDxfUnits] = useState<'mm' | 'inch'>('mm');
    const [explodeDimensions, setExplodeDimensions] = useState(true);
    const [camProfileOnly, setCamProfileOnly] = useState(false);

    // SVG Config
    const [svgTheme, setSvgTheme] = useState<'dark' | 'light'>('dark');
    const [svgIncludeFrame, setSvgIncludeFrame] = useState(true);

    // G-Code Config
    const [gcodeFeed, setGcodeFeed] = useState(1200);
    const [gcodePlunge, setGcodePlunge] = useState(300);
    const [gcodeRpm, setGcodeRpm] = useState(18000);
    const [gcodeDepth, setGcodeDepth] = useState(-2.0);
    const [gcodeStep, setGcodeStep] = useState(1.0);

    // ─────────────────────────────────────────────────────────────
    // DRAWING GEOMETRIC TELEMETRY
    // ─────────────────────────────────────────────────────────────
    const telemetry = useMemo(() => {
        // measured on exactly what is drawn (shared primitives), outline geometry only for cut length
        const visible = entities.filter(e => e.isVisible !== false && isLayerShown(layers.find(l => l.id === e.layerId)));
        const all = visible.flatMap(e => geometryPrimitives(e.geometry, cadUnits));
        const b = primitiveBounds(all);
        let cutDistance = 0;
        for (const e of visible) {
            const t = e.geometry.type;
            if (t === 'DIMENSION' || t === 'LEADER' || t === 'TEXT' || t === 'HATCH' || t === 'POINT') continue;
            for (const p of geometryPrimitives(e.geometry)) {
                if (p.style !== 'continuous') continue;
                for (const chain of flattenPrimitive(p, 0.05)) {
                    for (let i = 1; i < chain.length; i++) cutDistance += Math.hypot(chain[i].x - chain[i - 1].x, chain[i].y - chain[i - 1].y);
                }
            }
        }
        const w = b ? Math.max(0, b.maxX - b.minX) : 0;
        const h = b ? Math.max(0, b.maxY - b.minY) : 0;

        return {
            entityCount: visible.length,
            layerCount: layers.length,
            widthMm: Math.round(w * 10) / 10,
            heightMm: Math.round(h * 10) / 10,
            cutLengthMm: Math.round(cutDistance),
            approxAreaCm2: Math.round((w * h) / 100),
        };
    }, [entities, layers, cadUnits]);

    if (!isOpen) return null;

    // ─────────────────────────────────────────────────────────────
    // EXECUTE EXPORT
    // ─────────────────────────────────────────────────────────────
    const handleDownload = async () => {
        if (entities.length === 0) {
            alert(t12(language, 'Drawing is empty! Please draw shapes before exporting.', 'Çizim boş! Lütfen dışa aktarmadan önce şekil çizin.'));
            return;
        }

        setIsExporting(true);
        setExportSuccess(null);

        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
            const safeName = (partName || 'ALUCAD').replace(/[^a-zA-Z0-9_-]/g, '_');

            if (format === 'PDF') {
                const pdfBytes = await generatePDF(entities, layers, null, {
                    displayUnits: cadUnits,
                    paperSize,
                    orientation,
                    scale,
                    showTitleBlock,
                    showGridBorder: true,
                    colorMode,
                    titleBlockData: {
                        partName,
                        drawingNumber,
                        revision,
                        material,
                        designer,
                        company,
                        scale,
                    }
                });
                downloadBlob(new Blob([pdfBytes as any], { type: 'application/pdf' }), `${safeName}_${drawingNumber}.pdf`);
                setExportSuccess(`ISO Technical Blueprint PDF created (${paperSize} ${scale})`);
            } else if (format === 'DXF') {
                const dxfStr = generateDXF(entities, layers, {
                    version: dxfVersion,
                    units: dxfUnits,
                    explodeDimensions,
                    camProfileOnly,
                    displayUnits: cadUnits,
                    author: designer,
                    company,
                });
                downloadBlob(new Blob([dxfStr], { type: 'application/dxf;charset=utf-8' }), `${safeName}_${dxfVersion}.dxf`);
                setExportSuccess(`AutoCAD DXF generated (${dxfVersion}, ${dxfUnits})`);
            } else if (format === 'SVG') {
                const svgStr = generateSVG(entities, layers, {
                    displayUnits: cadUnits,
                    theme: svgTheme,
                    includeTitleBlock: svgIncludeFrame,
                    partName,
                    drawingNumber,
                    material,
                    author: designer,
                    company,
                });
                downloadBlob(new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' }), `${safeName}_vector.svg`);
                setExportSuccess('Scalable Vector Graphic (SVG) downloaded');
            } else if (format === 'GCODE') {
                const result = generateGcode(entities, {
                    layers,
                    programName: safeName,
                    feedRate: gcodeFeed,
                    plungeRate: gcodePlunge,
                    spindleRpm: gcodeRpm,
                    cutDepth: gcodeDepth,
                    stepDown: gcodeStep,
                    safeZ: 5.0,
                });
                downloadBlob(new Blob([result.gcode], { type: 'text/plain;charset=utf-8' }), `${safeName}.nc`);
                setExportSuccess(`CNC G-Code generated (${result.totalCutDistanceMm}mm toolpath, est. ${result.estimatedTimeSec}s)`);
            } else if (format === 'JSON') {
                const projectData = {
                    version: '2.0.0',
                    generator: 'AluCAD Studio OS',
                    exportedAt: new Date().toISOString(),
                    metadata: { partName, drawingNumber, revision, material, designer, company },
                    layers,
                    entities,
                };
                downloadBlob(new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' }), `${safeName}.alucad`);
                setExportSuccess('Lossless AluCAD Project JSON package saved');
            } else if (format === 'IMAGE') {
                // Render high-resolution PNG snapshot from canvas
                const canvas = document.getElementById('cad-canvas') as HTMLCanvasElement | null;
                if (canvas) {
                    canvas.toBlob((blob) => {
                        if (blob) {
                            downloadBlob(blob, `${safeName}_snapshot.png`);
                            setExportSuccess('High-resolution PNG image captured');
                        }
                    }, 'image/png');
                } else {
                    // Fallback to rasterizing SVG
                    const svgStr = generateSVG(entities, layers, { theme: 'light', includeTitleBlock: true, partName });
                    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
                    downloadBlob(blob, `${safeName}_drawing.svg`);
                    setExportSuccess('Vector snapshot saved');
                }
            }
        } catch (err) {
            console.error('Export error:', err);
            alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsExporting(false);
        }
    };

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-in fade-in select-none font-mono">
            <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-xl border border-[var(--line)] bg-[var(--bg-1)] shadow-2xl overflow-hidden text-[var(--ink)]">
                
                {/* ─── HEADER BAR ─── */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--line)] bg-[var(--bg-0)]">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-[var(--cyan)]/15 text-[var(--cyan)] border border-[var(--cyan)]/30">
                            <Download size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold tracking-wider text-[var(--ink)] flex items-center gap-2">
                                {t12(language, 'ALUCAD EXPORT CENTER', 'ALUCAD DIŞA AKTARMA MERKEZİ')}
                                <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--line-strong)] text-[var(--cyan)] border border-[var(--cyan)]/40">
                                    ISO / DIN / CAM
                                </span>
                            </h2>
                            <p className="text-[11px] text-[var(--alu-dim)]">
                                {tCad.exportModal.subtitle}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--alu-dim)] hover:text-white transition-all"
                        title={tCad.exportModal.cancelBtn}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ─── MODAL BODY (TWO COLUMNS) ─── */}
                <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
                    
                    {/* LEFT PANEL: FORMAT SELECTOR & TELEMETRY (4 COLS) */}
                    <div className="md:col-span-4 space-y-4">
                        <div className="text-[11px] font-bold text-[var(--alu-dim)] uppercase tracking-wider">
                            {tCad.exportModal.formatSelection}
                        </div>

                        <div className="space-y-1.5">
                            <button
                                type="button"
                                onClick={() => setFormat('PDF')}
                                className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                                    format === 'PDF'
                                        ? 'bg-[var(--cyan)]/15 border-[var(--cyan)] text-white '
                                        : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)]'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Printer size={16} className={format === 'PDF' ? 'text-[var(--cyan)]' : 'text-[var(--alu-dim)]'} />
                                    <div>
                                        <div className="text-xs font-bold">{t12(language, 'ISO 7200 PDF Blueprint', 'ISO 7200 PDF Pafta')}</div>
                                        <div className="text-[10px] opacity-75">{tCad.exportModal.pdfDesc}</div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold">.pdf</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFormat('DXF')}
                                className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                                    format === 'DXF'
                                        ? 'bg-[var(--cyan)]/15 border-[var(--cyan)] text-white '
                                        : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)]'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <FileText size={16} className={format === 'DXF' ? 'text-[var(--cyan)]' : 'text-[var(--alu-dim)]'} />
                                    <div>
                                        <div className="text-xs font-bold">AutoCAD DXF</div>
                                        <div className="text-[10px] opacity-75">{tCad.exportModal.dxfDesc}</div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold">.dxf</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFormat('SVG')}
                                className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                                    format === 'SVG'
                                        ? 'bg-[var(--cyan)]/15 border-[var(--cyan)] text-white '
                                        : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)]'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Sparkles size={16} className={format === 'SVG' ? 'text-[var(--cyan)]' : 'text-[var(--alu-dim)]'} />
                                    <div>
                                        <div className="text-xs font-bold">{t12(language, 'Vector Graphic (SVG)', 'Vektörel Çizim (SVG)')}</div>
                                        <div className="text-[10px] opacity-75">{tCad.exportModal.svgDesc}</div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold">.svg</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFormat('GCODE')}
                                className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                                    format === 'GCODE'
                                        ? 'bg-[var(--warn)]/20 border-[var(--warn)] text-white '
                                        : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)]'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Cpu size={16} className={format === 'GCODE' ? 'text-[var(--warn)]' : 'text-[var(--alu-dim)]'} />
                                    <div>
                                        <div className="text-xs font-bold">CNC G-Code (.nc)</div>
                                        <div className="text-[10px] opacity-75">{tCad.exportModal.gcodeDesc}</div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-[var(--warn)]">.nc</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFormat('JSON')}
                                className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                                    format === 'JSON'
                                        ? 'bg-[var(--ok)]/20 border-[var(--ok)] text-white '
                                        : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)]'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Code size={16} className={format === 'JSON' ? 'text-[var(--ok)]' : 'text-[var(--alu-dim)]'} />
                                    <div>
                                        <div className="text-xs font-bold">{t12(language, 'AluCAD Project (JSON)', 'AluCAD Projesi (JSON)')}</div>
                                        <div className="text-[10px] opacity-75">{t12(language, 'Lossless project backup archive', 'Kayıpsız tam proje yedeği')}</div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-[var(--ok)]">.alucad</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFormat('IMAGE')}
                                className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                                    format === 'IMAGE'
                                        ? 'bg-[var(--cyan)]/15 border-[var(--cyan)] text-white '
                                        : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)]'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Image size={16} className={format === 'IMAGE' ? 'text-[var(--cyan)]' : 'text-[var(--alu-dim)]'} />
                                    <div>
                                        <div className="text-xs font-bold">{t12(language, 'High-Resolution Image', 'Yüksek Çözünürlüklü Resim')}</div>
                                        <div className="text-[10px] opacity-75">{tCad.exportModal.pngDesc}</div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold">.png</span>
                            </button>
                        </div>

                        {/* TELEMETRY CARD */}
                        <div className="p-3.5 rounded-lg bg-[var(--bg-0)] border border-[var(--line)] space-y-2 text-xs">
                            <div className="text-[10px] font-bold text-[var(--cyan)] uppercase tracking-wider flex items-center gap-1.5">
                                <Sliders size={12} /> {t12(language, 'Drawing Geometry Summary', 'Çizim Geometri Özeti')}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div className="text-[var(--alu-dim)]">{t12(language, 'Entity Count:', 'Nesne Sayısı:')}</div>
                                <div className="text-right text-[var(--ink)] font-bold">{telemetry.entityCount} {t12(language, 'items', 'adet')}</div>

                                <div className="text-[var(--alu-dim)]">{t12(language, 'Bounding Box:', 'Sınır Boyutları:')}</div>
                                <div className="text-right text-[var(--ink)] font-bold">{telemetry.widthMm} × {telemetry.heightMm} mm</div>

                                <div className="text-[var(--alu-dim)]">{t12(language, 'Cut Length:', 'Kesim Uzunluğu:')}</div>
                                <div className="text-right text-[var(--ok)] font-bold">{telemetry.cutLengthMm} mm</div>

                                <div className="text-[var(--alu-dim)]">{t12(language, 'Approx Area:', 'Yaklaşık Alan:')}</div>
                                <div className="text-right text-[var(--ink)] font-bold">{telemetry.approxAreaCm2} cm²</div>
                            </div>
                        </div>

                        {/* CROSS-MODULE ECOSYSTEM LINKS */}
                        <div className="space-y-1.5 pt-1">
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    CrossModuleBridge.exportCadToDesignStudio(entities, 100);
                                    if (typeof window !== 'undefined') window.location.href = '/design-studio/';
                                }}
                                className="w-full py-2 px-3 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/30 text-xs flex items-center justify-between transition-all"
                            >
                                <span className="flex items-center gap-2">
                                    <Box size={14} className="text-cyan-400" />
                                    <span>{t12(language, '3D Design Studio', '3D Tasarım Stüdyosu')}</span>
                                </span>
                                <span className="text-[10px] font-bold text-cyan-400">{t12(language, 'SYNC →', 'SENKRON →')}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    if (typeof window !== 'undefined') window.location.href = '/nesting-2d/';
                                }}
                                className="w-full py-2 px-3 rounded-lg bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 text-xs flex items-center justify-between transition-all"
                            >
                                <span className="flex items-center gap-2">
                                    <Columns3 size={14} className="text-purple-400" />
                                    <span>{t12(language, '2D Sheet Nesting', '2D Plaka Nesting (Yerleşim)')}</span>
                                </span>
                                <span className="text-[10px] font-bold text-purple-400">{t12(language, 'OPEN →', 'AÇ →')}</span>
                            </button>
                        </div>
                    </div>

                    {/* RIGHT PANEL: FORMAT-SPECIFIC CONFIGURATION & METADATA (8 COLS) */}
                    <div className="md:col-span-8 space-y-4">
                        
                        {/* 1. DRAWING METADATA (ISO 7200 TITLE BLOCK FIELDS) */}
                        <div className="p-3.5 rounded-lg bg-[var(--bg-2)] border border-[var(--line)] space-y-3">
                            <div className="text-[11px] font-bold text-[var(--cyan)] uppercase tracking-wider flex items-center justify-between">
                                <span>{t12(language, 'Drawing Info & Title (ISO 7200 Title Block)', 'Pafta Bilgileri & Başlık (ISO 7200 Title Block)')}</span>
                                <span className="text-[10px] text-[var(--alu-dim)] font-normal">{t12(language, 'Used in title block and filename', 'Antet ve dosya adında kullanılır')}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                    <label className="block text-[10px] text-[var(--alu-dim)] mb-1">{t12(language, 'PART / DRAWING NAME', 'PARÇA / ÇİZİM ADI')}</label>
                                    <input
                                        type="text"
                                        value={partName}
                                        onChange={(e) => setPartName(e.target.value)}
                                        className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none"
                                        placeholder={t12(language, 'e.g. Flange_M8', 'Örn: Flanş_M8')}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] text-[var(--alu-dim)] mb-1">{t12(language, 'DRAWING NUMBER (DWG NO)', 'ÇİZİM NUMARASI (DWG NO)')}</label>
                                    <input
                                        type="text"
                                        value={drawingNumber}
                                        onChange={(e) => setDrawingNumber(e.target.value)}
                                        className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] text-[var(--alu-dim)] mb-1">{t12(language, 'MATERIAL SPECIFICATION', 'MALZEME BİLGİSİ')}</label>
                                    <input
                                        type="text"
                                        value={material}
                                        onChange={(e) => setMaterial(e.target.value)}
                                        className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] text-[var(--alu-dim)] mb-1">{t12(language, 'REVISION & DESIGNER', 'REVİZYON & ÇİZEN')}</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={revision}
                                            onChange={(e) => setRevision(e.target.value)}
                                            className="w-20 px-2.5 py-1.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none text-center"
                                        />
                                        <input
                                            type="text"
                                            value={designer}
                                            onChange={(e) => setDesigner(e.target.value)}
                                            className="flex-1 px-2.5 py-1.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. DYNAMIC FORMAT CONFIGURATION TABS */}
                        {format === 'PDF' && (
                            <div className="p-3.5 rounded-lg bg-[var(--bg-2)] border border-[var(--line)] space-y-3">
                                <div className="text-[11px] font-bold text-[var(--cyan)] uppercase tracking-wider">
                                    {t12(language, 'PDF Blueprint & Output Settings (DIN EN ISO 5457)', 'PDF Pafta & Çıktı Ayarları (DIN EN ISO 5457)')}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                    <div>
                                        <label className="block text-[10px] text-[var(--alu-dim)] mb-1">{tCad.exportModal.paperSize.toUpperCase()}</label>
                                        <select
                                            value={paperSize}
                                            onChange={(e) => setPaperSize(e.target.value as any)}
                                            className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none"
                                        >
                                            <option value="A4">A4 (210 × 297 mm)</option>
                                            <option value="A3">A3 (297 × 420 mm)</option>
                                            <option value="A2">A2 (420 × 594 mm)</option>
                                            <option value="A1">A1 (594 × 841 mm)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] text-[var(--alu-dim)] mb-1">{tCad.exportModal.orientation.toUpperCase()}</label>
                                        <select
                                            value={orientation}
                                            onChange={(e) => setOrientation(e.target.value as any)}
                                            className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none"
                                        >
                                            <option value="LANDSCAPE">{t12(language, 'Landscape', 'Yatay (Landscape)')}</option>
                                            <option value="PORTRAIT">{t12(language, 'Portrait', 'Dikey (Portrait)')}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] text-[var(--alu-dim)] mb-1">{tCad.exportModal.scale.toUpperCase()}</label>
                                        <select
                                            value={scale}
                                            onChange={(e) => setScale(e.target.value as any)}
                                            className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none"
                                        >
                                            <option value="FIT">{t12(language, 'Fit to Sheet', 'Otomatik Sığdır (Fit to Sheet)')}</option>
                                            <option value="1:1">1:1 ({t12(language, 'Full Scale 100%', 'Gerçek Boyut 100%')})</option>
                                            <option value="1:2">1:2 ({t12(language, 'Half Scale 50%', 'Yarı Boyut 50%')})</option>
                                            <option value="1:5">1:5 (20%)</option>
                                            <option value="1:10">1:10 (10%)</option>
                                            <option value="2:1">2:1 ({t12(language, 'Enlarged 200%', 'Büyütme 200%')})</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[var(--line)] text-xs">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showTitleBlock}
                                            onChange={(e) => setShowTitleBlock(e.target.checked)}
                                            className="rounded border-[var(--line)] text-[var(--cyan)] focus:ring-0"
                                        />
                                        <span>{t12(language, 'Add ISO 7200 Title Block', 'ISO 7200 Antet (Title Block) Ekle')}</span>
                                    </label>

                                    <div className="flex items-center gap-3 ml-auto">
                                        <span className="text-[10px] text-[var(--alu-dim)]">{t12(language, 'COLOR MODE:', 'RENK MODU:')}</span>
                                        <button
                                            type="button"
                                            onClick={() => setColorMode('MONOCHROME')}
                                            className={`px-2 py-0.5 rounded text-[10px] ${
                                                colorMode === 'MONOCHROME'
                                                    ? 'bg-white text-black font-bold'
                                                    : 'bg-[var(--bg-0)] text-[var(--alu-dim)]'
                                            }`}
                                        >
                                            {t12(language, 'Monochrome', 'Siyah/Beyaz')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setColorMode('COLOR')}
                                            className={`px-2 py-0.5 rounded text-[10px] ${
                                                colorMode === 'COLOR'
                                                    ? 'bg-[var(--cyan)] text-black font-bold'
                                                    : 'bg-[var(--bg-0)] text-[var(--alu-dim)]'
                                            }`}
                                        >
                                            {t12(language, 'Layer Colors', 'Katman Renkleri')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {format === 'DXF' && (
                            <div className="p-3.5 rounded-lg bg-[var(--bg-2)] border border-[var(--line)] space-y-3">
                                <div className="text-[11px] font-bold text-[var(--cyan)] uppercase tracking-wider">
                                    {t12(language, 'AutoCAD DXF & CAM Compatibility Parameters', 'AutoCAD DXF & CAM Uyumluluk Parametreleri')}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <label className="block text-[10px] text-[var(--alu-dim)] mb-1">{t12(language, 'DXF VERSION', 'DXF SÜRÜMÜ')}</label>
                                        <select
                                            value={dxfVersion}
                                            onChange={(e) => setDxfVersion(e.target.value as any)}
                                            className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none"
                                        >
                                            <option value="AC1015">{t12(language, 'AutoCAD 2000+ (AC1015) — Recommended', 'AutoCAD 2000+ (AC1015) — Önerilen')}</option>
                                            <option value="AC1009">{t12(language, 'AutoCAD R12 (AC1009) — Legacy CAM', 'AutoCAD R12 (AC1009) — Klasik CAM')}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] text-[var(--alu-dim)] mb-1">{t12(language, 'UNIT STANDARD', 'BİRİM STANDARDI')}</label>
                                        <select
                                            value={dxfUnits}
                                            onChange={(e) => setDxfUnits(e.target.value as any)}
                                            className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none"
                                        >
                                            <option value="mm">{t12(language, 'Metric Millimeter ($INSUNITS = 4)', 'Metrik Milimetre ($INSUNITS = 4)')}</option>
                                            <option value="inch">{t12(language, 'Imperial Inch ($INSUNITS = 1)', 'İnç ($INSUNITS = 1)')}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-[var(--line)] text-xs">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={explodeDimensions}
                                            onChange={(e) => setExplodeDimensions(e.target.checked)}
                                            className="rounded border-[var(--line)] text-[var(--cyan)] focus:ring-0"
                                        />
                                        <span>{t12(language, 'Explode dimensions into cutting lines (ensures visibility in Laser/Plasma CAM)', 'Ölçülendirmeleri CAM Kesim Çizgilerine Patlat (Lazer/Plazma kesimde görünürlük garanti)')}</span>
                                    </label>
                                    <label className="mt-2 flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={camProfileOnly}
                                            onChange={(e) => setCamProfileOnly(e.target.checked)}
                                            className="rounded border-[var(--line)] text-[var(--cyan)] focus:ring-0"
                                        />
                                        <span>{t12(language, 'Cutting profiles only (no centre lines, text, dimensions or hatches)', 'Yalnızca kesim profilleri (eksen çizgisi, yazı, ölçü ve tarama yok)')}</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {format === 'SVG' && (
                            <div className="p-3.5 rounded-lg bg-[var(--bg-2)] border border-[var(--line)] space-y-3">
                                <div className="text-[11px] font-bold text-[var(--cyan)] uppercase tracking-wider">
                                    {t12(language, 'Vector Graphic (SVG) Appearance Settings', 'Vektörel Grafik (SVG) Görünüm Ayarları')}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <label className="block text-[10px] text-[var(--alu-dim)] mb-1">{t12(language, 'THEME & BACKGROUND', 'TEMA & ARKA PLAN')}</label>
                                        <select
                                            value={svgTheme}
                                            onChange={(e) => setSvgTheme(e.target.value as any)}
                                            className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none"
                                        >
                                            <option value="dark">{t12(language, 'Dark Chassis (#07090e)', 'Koyu Şase (#07090e)')}</option>
                                            <option value="light">{t12(language, 'White Blueprint Sheet (#ffffff)', 'Beyaz Teknik Resim Kağıdı (#ffffff)')}</option>
                                        </select>
                                    </div>

                                    <div className="flex items-end">
                                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                                            <input
                                                type="checkbox"
                                                checked={svgIncludeFrame}
                                                onChange={(e) => setSvgIncludeFrame(e.target.checked)}
                                                className="rounded border-[var(--line)] text-[var(--cyan)] focus:ring-0"
                                            />
                                            <span>{t12(language, 'Include Title Block & Frame', 'Alt Başlık & Çerçeve Dahil Et')}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {format === 'GCODE' && (
                            <div className="p-3.5 rounded-lg bg-[var(--bg-2)] border border-[var(--line)] space-y-3">
                                <div className="text-[11px] font-bold text-[var(--warn)] uppercase tracking-wider flex items-center gap-2">
                                    <Cpu size={14} />
                                    <span>{t12(language, 'CNC Machining & Toolpath Parameters', 'CNC Talaşlı İmalat & Kesim Parametreleri')}</span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                    <div>
                                        <label className="block text-[10px] text-[var(--alu-dim)] mb-1">{t12(language, 'FEED RATE (F)', 'KESME İLERLEMESİ (F)')}</label>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                value={gcodeFeed}
                                                onChange={(e) => setGcodeFeed(Number(e.target.value))}
                                                className="w-full px-2 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--warn)] focus:outline-none text-right font-mono"
                                            />
                                            <span className="text-[10px] text-[var(--alu-dim)]">{t12(language, 'mm/min', 'mm/dk')}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] text-[var(--alu-dim)] mb-1">{t12(language, 'PLUNGE RATE (Fz)', 'DALMA HIZI (Fz)')}</label>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                value={gcodePlunge}
                                                onChange={(e) => setGcodePlunge(Number(e.target.value))}
                                                className="w-full px-2 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--warn)] focus:outline-none text-right font-mono"
                                            />
                                            <span className="text-[10px] text-[var(--alu-dim)]">{t12(language, 'mm/min', 'mm/dk')}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] text-[var(--alu-dim)] mb-1">{t12(language, 'SPINDLE SPEED (RPM)', 'DEVİR (SPINDLE)')}</label>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                value={gcodeRpm}
                                                onChange={(e) => setGcodeRpm(Number(e.target.value))}
                                                className="w-full px-2 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--warn)] focus:outline-none text-right font-mono"
                                            />
                                            <span className="text-[10px] text-[var(--alu-dim)]">RPM</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] text-[var(--alu-dim)] mb-1">{t12(language, 'CUT DEPTH (Z)', 'KESİM DERİNLİĞİ (Z)')}</label>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                step="0.5"
                                                value={gcodeDepth}
                                                onChange={(e) => setGcodeDepth(Number(e.target.value))}
                                                className="w-full px-2 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--warn)] focus:outline-none text-right font-mono"
                                            />
                                            <span className="text-[10px] text-[var(--alu-dim)]">mm</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] text-[var(--alu-dim)] mb-1">{t12(language, 'STEP DOWN', 'PASO BAŞI İNİŞ')}</label>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                step="0.5"
                                                value={gcodeStep}
                                                onChange={(e) => setGcodeStep(Number(e.target.value))}
                                                className="w-full px-2 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--warn)] focus:outline-none text-right font-mono"
                                            />
                                            <span className="text-[10px] text-[var(--alu-dim)]">mm</span>
                                        </div>
                                    </div>

                                    <div className="flex items-end">
                                        <span className="text-[10px] text-[var(--alu-dim)] pb-1">G00/G01/G02/G03 ISO 6983</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {format === 'JSON' && (
                            <div className="p-3.5 rounded-lg bg-[var(--bg-2)] border border-[var(--line)] space-y-2 text-xs">
                                <div className="text-[11px] font-bold text-[var(--ok)] uppercase tracking-wider">
                                    {t12(language, 'Full Project Backup (.alucad JSON)', 'Tam Proje Yedeği (.alucad JSON)')}
                                </div>
                                <p className="text-[var(--alu-dim)] text-[11px]">
                                    {t12(language, 'Stores all drawing entities, layers, colors, dimensions, and project metadata in a lossless JSON archive. Can be reopened anytime via CAD Editor "Import".', 'Çizimdeki tüm geometrik nesneleri, katmanları, renkleri, ölçüleri ve proje başlık bilgilerini kayıpsız JSON paketinde saklar. Daha sonra CAD Editörünün "İçe Aktar (Import)" menüsünden tekrar açılabilir.')}
                                </p>
                            </div>
                        )}

                        {/* SUCCESS FEEDBACK NOTIFICATION */}
                        {exportSuccess && (
                            <div className="p-3 rounded-lg bg-[var(--ok)]/15 border border-[var(--ok)]/40 text-[var(--ok)] text-xs flex items-center gap-2">
                                <CheckCircle2 size={16} />
                                <span>{exportSuccess}</span>
                            </div>
                        )}

                        {/* 3. PRIMARY ACTION EXECUTION BUTTON */}
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={handleDownload}
                                disabled={isExporting}
                                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[#0ea5e9] text-[var(--bg-0)] font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                {isExporting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                                        <span>{t12(language, 'EXPORTING...', 'DIŞA AKTARILIYOR...')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Download size={16} />
                                        <span>{t12(language, `GENERATE & DOWNLOAD ${format}`, `${format} DOSYASINI OLUŞTUR & İNDİR`)}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── FOOTER BAR ─── */}
                <div className="px-5 py-2.5 border-t border-[var(--line)] bg-[var(--bg-0)] flex items-center justify-between text-[11px] text-[var(--alu-dim)]">
                    <div className="flex items-center gap-3">
                        <span>{t12(language, 'Standards: DIN EN ISO 5457 | ISO 7200 | ISO 6983', 'Standartlar: DIN EN ISO 5457 | ISO 7200 | ISO 6983')}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-[var(--ink)] transition-all"
                    >
                        {t12(language, 'Close (ESC)', 'Kapat (ESC)')}
                    </button>
                </div>
            </div>
        </div>
    );
}
