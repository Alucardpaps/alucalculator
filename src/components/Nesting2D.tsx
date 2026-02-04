/**
 * Nesting2D Component
 * Main container for 2D True Shape Nesting with DXF import
 */

"use client";

import { useState, useCallback } from 'react';
import { Settings, Play, Download, AlertCircle, CheckCircle2, Loader2, Grid2x2 } from 'lucide-react';

import { NestingCanvas } from './NestingCanvas';
import { PartUploader } from './DxfUploader';
import { useNestingWorker } from '@/hooks/useNestingWorker';
import { exportToDXF, downloadDXF } from '@/utils/dxfExporter';
import type { Part2D, Sheet2D, NestingOptions } from '@/types/nesting2d.types';

interface Nesting2DProps {
    dict: Record<string, unknown>;
    lang: string;
}

export function Nesting2D({ dict, lang }: Nesting2DProps) {
    // State
    const [parts, setParts] = useState<Part2D[]>([]);
    const [sheet, setSheet] = useState<Sheet2D>({ width: 2500, height: 1250, kerf: 3 });
    const [options, setOptions] = useState<NestingOptions>({
        rotationStep: 90,
        spacing: 5,
        algorithm: 'guillotine',
        heuristic: 'best-area-fit',
        multiSheet: true,
        maxSheets: 10
    });
    const [currentSheetIndex, setCurrentSheetIndex] = useState(0);

    // Worker hook
    const { run, progress, result, error, isRunning, reset } = useNestingWorker();

    // i18n helper
    const t = (key: string): string => {
        const keys = key.split('.');
        let value: unknown = dict;
        for (const k of keys) {
            value = (value as Record<string, unknown>)?.[k];
        }
        return (value as string) || key;
    };

    // Run optimization
    const handleOptimize = useCallback(() => {
        if (parts.length === 0) return;

        reset();
        setCurrentSheetIndex(0);
        run({ parts, sheet, options });
    }, [parts, sheet, options, run, reset]);

    // Export DXF
    const handleExportDXF = useCallback(() => {
        if (!result || result.sheets.length === 0) return;

        result.sheets.forEach((sheetResult, index) => {
            const dxfContent = exportToDXF(sheetResult, sheet);
            const filename = result.sheets.length > 1
                ? `nested_sheet_${index + 1}.dxf`
                : 'nested_parts.dxf';
            downloadDXF(dxfContent, filename);
        });
    }, [result, sheet]);

    // Handle parts change from uploader
    const handlePartsChange = useCallback((newParts: Part2D[]) => {
        setParts(newParts);
        // Reset result when parts change
        if (result) reset();
    }, [result, reset]);

    // Calculate total parts needed
    const totalPartsCount = parts.reduce((sum, p) => sum + p.quantity, 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT PANEL: Upload & Settings */}
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
                            <Grid2x2 className="w-5 h-5 text-white" />
                        </div>
                        {t('nesting2d.title') !== 'nesting2d.title' ? t('nesting2d.title') : '2D Nesting'}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {t('nesting2d.subtitle') !== 'nesting2d.subtitle' ? t('nesting2d.subtitle') : 'True Shape Nesting for Laser/Plasma/Waterjet'}
                    </p>
                </div>

                {/* Part Uploader (DXF + SVG) */}
                <PartUploader
                    parts={parts}
                    onPartsChange={handlePartsChange}
                />

                {/* Sheet Settings */}
                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Sheet Settings
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Width (mm)</label>
                            <input
                                type="number"
                                value={sheet.width}
                                onChange={(e) => setSheet(s => ({ ...s, width: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Height (mm)</label>
                            <input
                                type="number"
                                value={sheet.height}
                                onChange={(e) => setSheet(s => ({ ...s, height: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">
                                Kerf / Beam Width (mm)
                                <span className="ml-1 text-slate-400 font-normal">(Lazer: 0.1-0.3 | Plazma: 1-3)</span>
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={sheet.kerf}
                                onChange={(e) => setSheet(s => ({ ...s, kerf: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Part Spacing (mm)</label>
                            <input
                                type="number"
                                step="0.5"
                                value={options.spacing}
                                onChange={(e) => setOptions(o => ({ ...o, spacing: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            />
                        </div>
                    </div>

                    {/* Rotation */}
                    <div className="mt-4">
                        <label className="block text-xs text-slate-500 mb-1">Rotation Step</label>
                        <select
                            value={options.rotationStep}
                            onChange={(e) => setOptions(o => ({ ...o, rotationStep: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                            <option value={0}>No rotation</option>
                            <option value={90}>90° (4 rotations)</option>
                            <option value={45}>45° (8 rotations)</option>
                            <option value={30}>30° (12 rotations)</option>
                            <option value={15}>15° (24 rotations)</option>
                        </select>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleOptimize}
                        disabled={parts.length === 0 || isRunning}
                        className={`
                            flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2
                            transition-all duration-200
                            ${parts.length === 0 || isRunning
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                : 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/20'
                            }
                        `}
                    >
                        {isRunning ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Optimizing... {progress?.percent || 0}%
                            </>
                        ) : (
                            <>
                                <Play className="w-5 h-5" />
                                Optimize ({totalPartsCount} parts)
                            </>
                        )}
                    </button>

                    {result && (
                        <button
                            onClick={handleExportDXF}
                            className="py-3 px-4 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-lg shadow-blue-600/20"
                        >
                            <Download className="w-5 h-5" />
                            DXF
                        </button>
                    )}
                </div>

                {/* Worker Error */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT PANEL: Canvas Preview */}
            <div className="space-y-4">
                <NestingCanvas
                    sheet={sheet}
                    result={result?.sheets[currentSheetIndex] || null}
                    currentSheetIndex={currentSheetIndex}
                    className="aspect-[4/3] lg:aspect-auto lg:h-[600px]"
                />

                {/* Results Summary */}
                {result && (
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-3">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-medium">Optimization Complete</span>
                            <span className="text-xs text-slate-400 ml-auto">
                                {result.computeTimeMs.toFixed(0)}ms
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {result.totalSheets}
                                </p>
                                <p className="text-xs text-slate-500">Sheets</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {result.totalEfficiency.toFixed(1)}%
                                </p>
                                <p className="text-xs text-slate-500">Efficiency</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                    {(result.totalWaste / 1000000).toFixed(3)} m²
                                </p>
                                <p className="text-xs text-slate-500">Waste</p>
                            </div>
                        </div>

                        {result.unplacedParts.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-red-500 dark:text-red-400">
                                    ⚠️ {result.unplacedParts.length} part(s) could not be placed
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Sheet Navigation (for multi-sheet) */}
                {result && result.sheets.length > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-xs text-slate-500 mr-2">Sheet:</span>
                        {result.sheets.map((s, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSheetIndex(index)}
                                className={`
                                    w-8 h-8 rounded-full text-sm font-medium transition-all
                                    ${index === currentSheetIndex
                                        ? 'bg-violet-600 text-white shadow-lg'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }
                                `}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
