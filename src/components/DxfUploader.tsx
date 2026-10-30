/**
 * PartUploader Component
 * Drag-drop DXF/SVG upload with canvas preview and part management
 */

"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Trash2, AlertCircle, FileCode, Plus, Minus, Zap, Square, Link as LinkIcon, Shield } from 'lucide-react';
import { parseDxfContent, validateDxfFile } from '@/utils/dxfParser';
import { parseSVGContent } from '@/utils/svgParser';
import type { Part2D } from '@/types/nesting2d.types';

// Supported file extensions
const SUPPORTED_EXTENSIONS = ['.dxf', '.svg'];

// ============================================
// CANVAS PREVIEW COMPONENT
// ============================================

interface PartPreviewCanvasProps {
    part: Part2D;
    width?: number;
    height?: number;
}

function PartPreviewCanvas({ part, width = 120, height = 80 }: PartPreviewCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, width, height);

        const { bounds, points } = part.polygon;
        if (points.length < 2) return;

        // Calculate scale to fit with padding
        const padding = 8;
        const scaleX = (width - padding * 2) / bounds.width;
        const scaleY = (height - padding * 2) / bounds.height;
        const scale = Math.min(scaleX, scaleY);

        // Center offset
        const offsetX = padding + (width - padding * 2 - bounds.width * scale) / 2 - bounds.x * scale;
        const offsetY = padding + (height - padding * 2 - bounds.height * scale) / 2 - bounds.y * scale;

        // Helper function to draw a polygon
        const drawPolygon = (polyPoints: { x: number; y: number }[], isOuter: boolean) => {
            if (polyPoints.length < 2) return;

            ctx.beginPath();
            ctx.strokeStyle = isOuter ? '#3B82F6' : '#60A5FA';
            ctx.fillStyle = isOuter ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.02)';
            ctx.lineWidth = isOuter ? 1.5 : 0.8;

            polyPoints.forEach((p, i) => {
                const x = p.x * scale + offsetX;
                const y = height - (p.y * scale + offsetY); // Flip Y for canvas
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        };

        // Draw outer polygon first
        drawPolygon(points, true);

        // Draw inner polygons (holes, decorative paths)
        if (part.innerPolygons && part.innerPolygons.length > 0) {
            part.innerPolygons.forEach(innerPoly => {
                drawPolygon(innerPoly.points, false);
            });
        }

        // Draw bounding box (subtle)
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(
            bounds.x * scale + offsetX,
            height - ((bounds.y + bounds.height) * scale + offsetY),
            bounds.width * scale,
            bounds.height * scale
        );
        ctx.setLineDash([]);

    }, [part, width, height]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
        />
    );
}

// ============================================
// PART CARD COMPONENT
// ============================================

interface PartCardProps {
    part: Part2D;
    onQuantityChange: (id: string, qty: number) => void;
    onUpdatePart: (id: string, updates: Partial<Part2D>) => void;
    onRemove: (id: string) => void;
}

function PartCard({ part, onQuantityChange, onUpdatePart, onRemove }: PartCardProps) {
    const isStandalone = part.cuttingMode === 'standalone' || part.allowCommonLine === false;
    const isBridgeEnabled = part.enableBridge !== false;
    const microjointCount = part.microjointCount ?? 0;

    return (
        <div className="flex flex-col bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 hover:border-slate-500 transition-all gap-2.5">
            {/* Top row: Preview, info, quantity, remove */}
            <div className="flex items-center gap-3">
                {/* Canvas Preview */}
                <PartPreviewCanvas part={part} width={90} height={60} />

                {/* Part Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-100 truncate text-xs" title={part.label}>
                        {part.label}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate" title={part.source}>
                        {part.source}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                        <span>{part.polygon.bounds.width.toFixed(1)} × {part.polygon.bounds.height.toFixed(1)} mm</span>
                        <span className="text-slate-600">|</span>
                        <span>{part.polygon.area.toFixed(0)} mm²</span>
                    </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => onQuantityChange(part.id, Math.max(1, part.quantity - 1))}
                        className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                        disabled={part.quantity <= 1}
                    >
                        <Minus className="w-3 h-3" />
                    </button>
                    <input
                        type="number"
                        min="1"
                        value={part.quantity}
                        onChange={(e) => onQuantityChange(part.id, Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-10 h-6 text-center text-xs font-mono font-bold border border-slate-700 rounded bg-slate-950 text-cyan-300"
                    />
                    <button
                        onClick={() => onQuantityChange(part.id, part.quantity + 1)}
                        className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <Plus className="w-3 h-3" />
                    </button>
                </div>

                {/* Remove Button */}
                <button
                    onClick={() => onRemove(part.id)}
                    className="w-7 h-7 rounded text-slate-400 hover:text-red-400 hover:bg-red-950/30 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Parçayı Kaldır"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Bottom Row: Per-Part Cutting Mode, Bridge Cut & Microjoint Controls */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                {/* Cutting Mode Toggle (Ortak CLC vs Tekli Solo) */}
                <div className="flex items-center bg-black/60 p-0.5 rounded-lg border border-white/5 font-mono">
                    <button
                        type="button"
                        onClick={() => onUpdatePart(part.id, { cuttingMode: 'common', allowCommonLine: true })}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            !isStandalone
                                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-xs'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title="Bu parça komşularıyla ortak çizgide (0 mm aralık) birleştirilebilir"
                    >
                        <Zap className="w-2.5 h-2.5" />
                        <span>Ortak (CLC)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onUpdatePart(part.id, { cuttingMode: 'standalone', allowCommonLine: false })}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            isStandalone
                                ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40 shadow-xs'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title="Bu parça ASLA komşularla birleştirilmez; bağımsız kapalı kontur olarak tekli kesilir"
                    >
                        <Square className="w-2.5 h-2.5" />
                        <span>Tekli (Solo)</span>
                    </button>
                </div>

                {/* Bridge Cutting Toggle */}
                <button
                    type="button"
                    onClick={() => onUpdatePart(part.id, { enableBridge: !isBridgeEnabled })}
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isBridgeEnabled
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : 'bg-black/40 text-slate-500 border border-white/5 hover:text-slate-300'
                    }`}
                    title="Komşu parçayla iskelet üzerinden torç sönmeden köprü kesim yapılsın mı"
                >
                    <LinkIcon className="w-2.5 h-2.5" />
                    <span>Köprü {isBridgeEnabled ? 'Açık' : 'Kapalı'}</span>
                </button>

                {/* Microjoints Tabs count */}
                <div className="flex items-center gap-1 font-mono text-[9px] text-slate-400">
                    <Shield className="w-2.5 h-2.5 text-amber-400" />
                    <span>Sekme:</span>
                    <select
                        value={microjointCount}
                        onChange={(e) => onUpdatePart(part.id, { microjointCount: parseInt(e.target.value) })}
                        className="bg-black/60 border border-white/10 rounded px-1 py-0.5 text-[9px] text-amber-300 font-bold outline-none cursor-pointer"
                        title="Izgaraya devrilmeyi önlemek için konturda bırakılacak mikro tutucu adedi"
                    >
                        <option value={0}>Yok (0)</option>
                        <option value={2}>2 Adet</option>
                        <option value={4}>4 Adet</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface PartUploaderProps {
    parts: Part2D[];
    onPartsChange: (parts: Part2D[]) => void;
    className?: string;
}

export function PartUploader({ parts, onPartsChange, className = '' }: PartUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [notes, setNotes] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mergeElements, setMergeElements] = useState(true); // Default: merge into single part
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Process uploaded files
    const processFiles = useCallback(async (files: FileList | File[]) => {
        setIsProcessing(true);
        setErrors([]);
        setNotes([]);
        const newErrors: string[] = [];
        const newNotes: string[] = [];
        const newParts: Part2D[] = [];

        for (const file of Array.from(files)) {
            const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

            // Check if supported extension
            if (!SUPPORTED_EXTENSIONS.includes(ext)) {
                newErrors.push(`${file.name}: Unsupported format. Use DXF or SVG.`);
                continue;
            }

            // File size check (50MB limit)
            if (file.size > 50 * 1024 * 1024) {
                newErrors.push(`${file.name}: File too large (max 50MB)`);
                continue;
            }

            // Read file content
            try {
                const content = await file.text();
                let result: { parts: Part2D[]; errors: string[]; warnings?: string[] };

                // Parse based on file type
                if (ext === '.dxf') {
                    result = parseDxfContent(content, file.name);
                } else {
                    // SVG - pass mergeElements option
                    result = parseSVGContent(content, file.name, mergeElements);
                }

                if (result.errors.length > 0) {
                    newErrors.push(...result.errors.map(e => `${file.name}: ${e}`));
                }

                // Notes (unit conversion, closed gaps, skipped layers …) never block the import
                if (result.warnings && result.warnings.length > 0) {
                    newNotes.push(...result.warnings.map(w => `${file.name}: ${w}`));
                }

                if (result.parts.length > 0) {
                    // Assign unique IDs to avoid conflicts
                    const timestamp = Date.now();
                    result.parts.forEach((part, i) => {
                        part.id = `${timestamp}-${file.name}-${i}`;
                    });
                    newParts.push(...result.parts);
                }
            } catch (e) {
                newErrors.push(`${file.name}: Failed to read file`);
            }
        }

        if (newParts.length > 0) {
            onPartsChange([...parts, ...newParts]);
        }

        if (newErrors.length > 0) {
            setErrors(newErrors);
        }
        if (newNotes.length > 0) {
            setNotes(newNotes);
        }

        setIsProcessing(false);
    }, [parts, onPartsChange, mergeElements]);

    // Drag handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        processFiles(e.dataTransfer.files);
    }, [processFiles]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(e.target.files);
            e.target.value = ''; // Reset for same file upload
        }
    }, [processFiles]);

    // Part management
    const handleQuantityChange = useCallback((id: string, qty: number) => {
        onPartsChange(parts.map(p => p.id === id ? { ...p, quantity: qty } : p));
    }, [parts, onPartsChange]);

    const handleUpdatePart = useCallback((id: string, updates: Partial<Part2D>) => {
        onPartsChange(parts.map(p => p.id === id ? { ...p, ...updates } : p));
    }, [parts, onPartsChange]);

    const handleSetAllCuttingMode = useCallback((mode: 'common' | 'standalone') => {
        onPartsChange(parts.map(p => ({
            ...p,
            cuttingMode: mode,
            allowCommonLine: mode === 'common'
        })));
    }, [parts, onPartsChange]);

    const handleSetAllBridges = useCallback((enable: boolean) => {
        onPartsChange(parts.map(p => ({
            ...p,
            enableBridge: enable
        })));
    }, [parts, onPartsChange]);

    const handleRemove = useCallback((id: string) => {
        onPartsChange(parts.filter(p => p.id !== id));
    }, [parts, onPartsChange]);

    const handleClearAll = useCallback(() => {
        onPartsChange([]);
        setErrors([]);
        setNotes([]);
    }, [onPartsChange]);

    // Calculate totals
    const totalParts = parts.reduce((sum, p) => sum + p.quantity, 0);
    const totalArea = parts.reduce((sum, p) => sum + p.polygon.area * p.quantity, 0);

    return (
        <div className={className}>
            {/* Import Mode Toggle */}
            <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">Import Mode:</span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setMergeElements(true)}
                        className={`px-3 py-1.5 text-xs rounded-[var(--radius-s)] font-mono transition-all cursor-pointer ${mergeElements
                            ? 'bg-[var(--cyan)] text-[var(--bg-0)] font-bold shadow-sm'
                            : 'bg-[var(--bg-2)] text-[var(--alu)] border border-[var(--line)] hover:border-[var(--line-strong)]'
                            }`}
                    >
                        Single Part
                    </button>
                    <button
                        onClick={() => setMergeElements(false)}
                        className={`px-3 py-1.5 text-xs rounded-[var(--radius-s)] font-mono transition-all cursor-pointer ${!mergeElements
                            ? 'bg-[var(--cyan)] text-[var(--bg-0)] font-bold shadow-sm'
                            : 'bg-[var(--bg-2)] text-[var(--alu)] border border-[var(--line)] hover:border-[var(--line-strong)]'
                            }`}
                    >
                        Separate Parts
                    </button>
                </div>
            </div>

            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                    relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                    transition-all duration-200
                    ${isDragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }
                    ${isProcessing ? 'pointer-events-none opacity-60' : ''}
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".dxf,.svg"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                />

                <FileCode className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />

                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {isProcessing ? 'Processing...' : 'Drop DXF or SVG files here'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                    {mergeElements
                        ? 'All elements will be merged into single part'
                        : 'Each element will be imported as separate part'
                    }
                </p>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium mb-1">
                        <AlertCircle className="w-4 h-4" />
                        Import Errors
                    </div>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                        {errors.map((err, i) => (
                            <p key={i} className="text-xs text-red-500 dark:text-red-400">{err}</p>
                        ))}
                    </div>
                </div>
            )}

            {/* Notes */}
            {notes.length > 0 && (
                <div className="mt-3 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-2)] p-3">
                    <div className="mb-1 text-xs font-medium text-[var(--alu)]">Import notes</div>
                    <div className="max-h-24 space-y-1 overflow-y-auto">
                        {notes.map((note, i) => (
                            <p key={i} className="text-xs text-[var(--alu-dim)]">{note}</p>
                        ))}
                    </div>
                </div>
            )}

            {/* Parts List */}
            {parts.length > 0 && (
                <div className="mt-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-mono text-slate-400">
                            <span className="font-bold text-slate-200">{parts.length}</span> parça türü
                            <span className="mx-1.5 text-slate-600">•</span>
                            <span className="font-bold text-cyan-300">{totalParts}</span> toplam
                            <span className="mx-1.5 text-slate-600">•</span>
                            <span className="font-bold text-emerald-400">{(totalArea / 1000000).toFixed(3)}</span> m²
                        </div>
                        <button
                            onClick={handleClearAll}
                            className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                        >
                            <Trash2 className="w-3 h-3" />
                            Temizle
                        </button>
                    </div>

                    {/* Bulk Action Toolbar */}
                    <div className="p-2 bg-slate-950/70 border border-white/5 rounded-xl flex items-center justify-between gap-1 text-[9px] font-mono">
                        <span className="text-slate-500 font-bold shrink-0">Toplu:</span>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                            <button
                                type="button"
                                onClick={() => handleSetAllCuttingMode('common')}
                                className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer"
                                title="Tüm parçaları ortak kesim (CLC) moduna ayarla"
                            >
                                <Zap className="w-2.5 h-2.5" />
                                <span>Tümü Ortak</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSetAllCuttingMode('standalone')}
                                className="px-2 py-1 rounded bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 transition-all flex items-center gap-1 cursor-pointer"
                                title="Tüm parçaları bağımsız tekli kesim moduna ayarla"
                            >
                                <Square className="w-2.5 h-2.5" />
                                <span>Tümü Tekli</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSetAllBridges(true)}
                                className="px-2 py-1 rounded bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition-all flex items-center gap-1 cursor-pointer"
                                title="Tüm parçalara zincir köprü kesim izni ver"
                            >
                                <LinkIcon className="w-2.5 h-2.5" />
                                <span>Köprüle</span>
                            </button>
                        </div>
                    </div>

                    {/* Part Cards */}
                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                        {parts.map(part => (
                            <PartCard
                                key={part.id}
                                part={part}
                                onQuantityChange={handleQuantityChange}
                                onUpdatePart={handleUpdatePart}
                                onRemove={handleRemove}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
