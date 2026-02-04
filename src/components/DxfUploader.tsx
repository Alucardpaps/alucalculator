/**
 * PartUploader Component
 * Drag-drop DXF/SVG upload with canvas preview and part management
 */

"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Trash2, AlertCircle, FileCode, Plus, Minus } from 'lucide-react';
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
    onRemove: (id: string) => void;
}

function PartCard({ part, onQuantityChange, onRemove }: PartCardProps) {
    return (
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 hover:shadow-md transition-shadow">
            {/* Canvas Preview */}
            <PartPreviewCanvas part={part} width={100} height={70} />

            {/* Part Info */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 dark:text-slate-200 truncate text-sm">
                    {part.label}
                </p>
                <p className="text-xs text-slate-400 truncate" title={part.source}>
                    {part.source}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>{part.polygon.bounds.width.toFixed(1)} × {part.polygon.bounds.height.toFixed(1)} mm</span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span>{part.polygon.area.toFixed(0)} mm²</span>
                </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onQuantityChange(part.id, Math.max(1, part.quantity - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                    disabled={part.quantity <= 1}
                >
                    <Minus className="w-3 h-3" />
                </button>
                <input
                    type="number"
                    min="1"
                    value={part.quantity}
                    onChange={(e) => onQuantityChange(part.id, Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 h-7 text-center text-sm font-medium border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                />
                <button
                    onClick={() => onQuantityChange(part.id, part.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                >
                    <Plus className="w-3 h-3" />
                </button>
            </div>

            {/* Remove Button */}
            <button
                onClick={() => onRemove(part.id)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors"
            >
                <Trash2 className="w-4 h-4" />
            </button>
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
    const [isProcessing, setIsProcessing] = useState(false);
    const [mergeElements, setMergeElements] = useState(true); // Default: merge into single part
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Process uploaded files
    const processFiles = useCallback(async (files: FileList | File[]) => {
        setIsProcessing(true);
        setErrors([]);
        const newErrors: string[] = [];
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

                // Show warnings (but don't block import)
                if (result.warnings && result.warnings.length > 0) {
                    newErrors.push(...result.warnings.map(w => `${file.name}: ⚠️ ${w}`));
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

    const handleRemove = useCallback((id: string) => {
        onPartsChange(parts.filter(p => p.id !== id));
    }, [parts, onPartsChange]);

    const handleClearAll = useCallback(() => {
        onPartsChange([]);
        setErrors([]);
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
                        className={`px-3 py-1.5 text-xs rounded-lg transition-all ${mergeElements
                            ? 'bg-violet-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        Single Part
                    </button>
                    <button
                        onClick={() => setMergeElements(false)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-all ${!mergeElements
                            ? 'bg-violet-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
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

            {/* Parts List */}
            {parts.length > 0 && (
                <div className="mt-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            <span className="font-medium">{parts.length}</span> unique parts
                            <span className="mx-2 text-slate-300 dark:text-slate-600">•</span>
                            <span className="font-medium">{totalParts}</span> total
                            <span className="mx-2 text-slate-300 dark:text-slate-600">•</span>
                            <span className="font-medium">{(totalArea / 1000000).toFixed(3)}</span> m²
                        </div>
                        <button
                            onClick={handleClearAll}
                            className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                        >
                            <Trash2 className="w-3 h-3" />
                            Clear All
                        </button>
                    </div>

                    {/* Part Cards */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {parts.map(part => (
                            <PartCard
                                key={part.id}
                                part={part}
                                onQuantityChange={handleQuantityChange}
                                onRemove={handleRemove}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
