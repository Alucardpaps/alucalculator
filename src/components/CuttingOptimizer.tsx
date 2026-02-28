'use client';

/**
 * CuttingOptimizer Component
 * 
 * Industrial-grade 1D linear cutting optimization tool.
 * Features:
 * - Dynamic part data grid (add/remove rows)
 * - Stock length, kerf, and trimming configuration
 * - Visual bar charts with hover tooltips
 * - PDF-ready output structure
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, Calculator, Settings, FileDown, RotateCcw } from 'lucide-react';
import { calculateNesting, type CutItem, type NestingResult, type NestingOptions } from '@/utils/nestingAlgorithm';
import { NestingVisualization } from '@/components/NestingVisualization';

// Types
interface PartRow {
    id: string;
    label: string;
    length: number;
    qty: number;
}

interface CuttingOptimizerProps {
    dict: {
        nesting?: {
            title?: string;
            subtitle?: string;
            stockLength?: string;
            kerf?: string;
            trimStart?: string;
            trimEnd?: string;
            addPart?: string;
            removePart?: string;
            calculate?: string;
            partLabel?: string;
            partLength?: string;
            partQty?: string;
            barsUsed?: string;
            efficiency?: string;
            totalWaste?: string;
            noResults?: string;
            algorithm?: string;
        };
        common?: {
            calculate?: string;
        };
    };
    lang?: string;
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Default empty row
const createEmptyRow = (): PartRow => ({
    id: generateId(),
    label: '',
    length: 0,
    qty: 1,
});

export function CuttingOptimizer({ dict, lang = 'en' }: CuttingOptimizerProps) {
    const t = dict.nesting || {};

    // State: Parts data grid
    const [parts, setParts] = useState<PartRow[]>([
        { id: generateId(), label: 'Part A', length: 500, qty: 5 },
        { id: generateId(), label: 'Part B', length: 800, qty: 3 },
        { id: generateId(), label: 'Part C', length: 300, qty: 8 },
    ]);

    // State: Optimization settings
    const [stockLength, setStockLength] = useState(6000);
    const [kerf, setKerf] = useState(4);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);
    const [algorithm, setAlgorithm] = useState<'bfd' | 'ffd'>('bfd');
    const [showSettings, setShowSettings] = useState(false);

    // State: Results
    const [result, setResult] = useState<NestingResult | null>(null);

    // Add new row
    const addRow = useCallback(() => {
        setParts(prev => [...prev, createEmptyRow()]);
    }, []);

    // Remove row
    const removeRow = useCallback((id: string) => {
        setParts(prev => prev.filter(p => p.id !== id));
    }, []);

    // Update row field
    const updateRow = useCallback((id: string, field: keyof PartRow, value: string | number) => {
        setParts(prev => prev.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    }, []);

    // Reset all
    const resetAll = useCallback(() => {
        setParts([createEmptyRow()]);
        setResult(null);
    }, []);

    // Calculate optimization
    const calculate = useCallback(() => {
        // Filter valid parts
        const validParts: CutItem[] = parts
            .filter(p => p.length > 0 && p.qty > 0)
            .map(p => ({
                id: p.id,
                label: p.label || `Part ${p.id.slice(0, 4)}`,
                length: p.length,
                qty: p.qty,
            }));

        if (validParts.length === 0) {
            setResult(null);
            return;
        }

        const options: NestingOptions = {
            algorithm,
            bladeWidth: kerf,
            trimming: { start: trimStart, end: trimEnd },
        };

        const nestingResult = calculateNesting(validParts, stockLength, options);
        setResult(nestingResult);
    }, [parts, stockLength, kerf, trimStart, trimEnd, algorithm]);

    // Effective stock length display
    const effectiveLength = useMemo(() =>
        stockLength - trimStart - trimEnd,
        [stockLength, trimStart, trimEnd]
    );

    // Event Listener for Ribbon Actions
    React.useEffect(() => {
        const handleCamAction = (e: CustomEvent) => {
            const { action } = e.detail;
            console.log("CAM Action received:", action); // Debug

            if (action === 'nest') {
                calculate();
            } else if (action === 'reset') {
                resetAll();
            } else if (action === 'report') {
                window.print();
            } else if (action === 'export') {
                if (result) {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href", dataStr);
                    downloadAnchorNode.setAttribute("download", "nesting_result.json");
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                } else {
                    alert("Please calculate nesting first before exporting.");
                }
            }
        };

        window.addEventListener('cam:action', handleCamAction as EventListener);
        return () => window.removeEventListener('cam:action', handleCamAction as EventListener);
    }, [calculate, resetAll, result]);

    return (
        <div className="cutting-optimizer" id="cutting-optimizer-printable">
            {/* Header */}
            <div className="optimizer-header">
                <div className="header-title">
                    <h2>{t.title || 'Cutting Optimizer'}</h2>
                    <span className="subtitle">{t.subtitle || '1D Linear Nesting'}</span>
                </div>
                <div className="header-actions">
                    <button
                        className="btn-icon"
                        onClick={() => setShowSettings(!showSettings)}
                        title="Settings"
                    >
                        <Settings size={18} />
                    </button>
                    <button
                        className="btn-icon"
                        onClick={resetAll}
                        title="Reset"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>

            {/* Settings Panel (collapsible) */}
            {showSettings && (
                <div className="settings-panel">
                    <div className="settings-grid">
                        <div className="setting-item">
                            <label>{t.stockLength || 'Stock Length'}</label>
                            <div className="input-with-unit">
                                <input
                                    type="number"
                                    value={stockLength}
                                    onChange={e => setStockLength(Number(e.target.value))}
                                    min={100}
                                    step={100}
                                />
                                <span className="unit">mm</span>
                            </div>
                        </div>
                        <div className="setting-item">
                            <label>{t.kerf || 'Blade Width (Kerf)'}</label>
                            <div className="input-with-unit">
                                <input
                                    type="number"
                                    value={kerf}
                                    onChange={e => setKerf(Number(e.target.value))}
                                    min={0}
                                    max={20}
                                    step={0.5}
                                />
                                <span className="unit">mm</span>
                            </div>
                        </div>
                        <div className="setting-item">
                            <label>{t.trimStart || 'Trim Start'}</label>
                            <div className="input-with-unit">
                                <input
                                    type="number"
                                    value={trimStart}
                                    onChange={e => setTrimStart(Number(e.target.value))}
                                    min={0}
                                    step={5}
                                />
                                <span className="unit">mm</span>
                            </div>
                        </div>
                        <div className="setting-item">
                            <label>{t.trimEnd || 'Trim End'}</label>
                            <div className="input-with-unit">
                                <input
                                    type="number"
                                    value={trimEnd}
                                    onChange={e => setTrimEnd(Number(e.target.value))}
                                    min={0}
                                    step={5}
                                />
                                <span className="unit">mm</span>
                            </div>
                        </div>
                        <div className="setting-item">
                            <label>{t.algorithm || 'Algorithm'}</label>
                            <select
                                value={algorithm}
                                onChange={e => setAlgorithm(e.target.value as 'bfd' | 'ffd')}
                            >
                                <option value="bfd">Best Fit Decreasing</option>
                                <option value="ffd">First Fit Decreasing</option>
                            </select>
                        </div>
                    </div>
                    {(trimStart > 0 || trimEnd > 0) && (
                        <div className="effective-length-note">
                            Effective usable length: <strong>{effectiveLength} mm</strong>
                        </div>
                    )}
                </div>
            )}

            {/* Parts Data Grid */}
            <div className="parts-grid">
                <div className="grid-header">
                    <span className="col-label">{t.partLabel || 'Label'}</span>
                    <span className="col-length">{t.partLength || 'Length'}</span>
                    <span className="col-qty">{t.partQty || 'Qty'}</span>
                    <span className="col-actions"></span>
                </div>
                <div className="grid-body">
                    {parts.map((part, index) => (
                        <div key={part.id} className="grid-row">
                            <input
                                type="text"
                                className="col-label"
                                placeholder={`Part ${index + 1}`}
                                value={part.label}
                                onChange={e => updateRow(part.id, 'label', e.target.value)}
                            />
                            <div className="input-with-unit col-length">
                                <input
                                    type="number"
                                    value={part.length || ''}
                                    onChange={e => updateRow(part.id, 'length', Number(e.target.value))}
                                    min={1}
                                    placeholder="0"
                                />
                                <span className="unit">mm</span>
                            </div>
                            <input
                                type="number"
                                className="col-qty"
                                value={part.qty || ''}
                                onChange={e => updateRow(part.id, 'qty', Number(e.target.value))}
                                min={1}
                                placeholder="1"
                            />
                            <button
                                className="btn-icon-sm delete"
                                onClick={() => removeRow(part.id)}
                                disabled={parts.length <= 1}
                                title={t.removePart || 'Remove'}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="grid-footer">
                    <button className="btn-add" onClick={addRow}>
                        <Plus size={16} />
                        {t.addPart || 'Add Part'}
                    </button>
                </div>
            </div>

            {/* Calculate Button */}
            <button className="btn-calculate" onClick={calculate}>
                <Calculator size={18} />
                {t.calculate || 'Optimize Cuts'}
            </button>

            {/* Results */}
            {result && (
                <div className="results-section">
                    <NestingVisualization
                        result={result}
                        showLabels={true}
                        compact={false}
                    />
                </div>
            )}

            {/* Styles */}
            <style jsx>{`
                .cutting-optimizer {
                    background: var(--surface-1, #0f0f1a);
                    border: 1px solid var(--border, #2a2a4a);
                    border-radius: 16px;
                    padding: 24px;
                    color: var(--text-primary, #fff);
                }

                .optimizer-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .header-title h2 {
                    font-size: 20px;
                    font-weight: 700;
                    margin: 0;
                    color: var(--text-primary, #fff);
                }

                .header-title .subtitle {
                    font-size: 12px;
                    color: var(--text-dim, #666);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .header-actions {
                    display: flex;
                    gap: 8px;
                }

                .btn-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    background: var(--surface-2, #1a1a2e);
                    border: 1px solid var(--border-dim, #2a2a4a);
                    border-radius: 8px;
                    color: var(--text-secondary, #a0a0b8);
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .btn-icon:hover {
                    background: var(--surface-3, #252545);
                    color: var(--accent, #6366f1);
                }

                .settings-panel {
                    background: var(--surface-2, #1a1a2e);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 20px;
                }

                .settings-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                    gap: 16px;
                }

                .setting-item {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .setting-item label {
                    font-size: 11px;
                    color: var(--text-dim, #666);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .setting-item select {
                    background: var(--surface-1, #0f0f1a);
                    border: 1px solid var(--border, #2a2a4a);
                    border-radius: 6px;
                    padding: 8px 12px;
                    color: var(--text-primary, #fff);
                    font-size: 13px;
                }

                .input-with-unit {
                    display: flex;
                    align-items: center;
                    background: var(--surface-1, #0f0f1a);
                    border: 1px solid var(--border, #2a2a4a);
                    border-radius: 6px;
                    overflow: hidden;
                }

                .input-with-unit input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    padding: 8px 12px;
                    color: var(--text-primary, #fff);
                    font-family: var(--font-mono, monospace);
                    font-size: 14px;
                    min-width: 0;
                }

                .input-with-unit input:focus {
                    outline: none;
                }

                .input-with-unit .unit {
                    padding: 8px 10px;
                    background: var(--surface-2, #1a1a2e);
                    color: var(--text-dim, #666);
                    font-size: 11px;
                    font-weight: 600;
                }

                .effective-length-note {
                    margin-top: 12px;
                    padding: 8px 12px;
                    background: var(--surface-3, #252545);
                    border-radius: 6px;
                    font-size: 12px;
                    color: var(--text-secondary, #a0a0b8);
                }

                .effective-length-note strong {
                    color: var(--accent, #6366f1);
                    font-family: var(--font-mono, monospace);
                }

                .parts-grid {
                    background: var(--surface-2, #1a1a2e);
                    border-radius: 12px;
                    overflow: hidden;
                    margin-bottom: 16px;
                }

                .grid-header {
                    display: grid;
                    grid-template-columns: 2fr 1fr 80px 40px;
                    gap: 12px;
                    padding: 12px 16px;
                    background: var(--surface-3, #252545);
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--text-dim, #666);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .grid-body {
                    max-height: 300px;
                    overflow-y: auto;
                }

                .grid-row {
                    display: grid;
                    grid-template-columns: 2fr 1fr 80px 40px;
                    gap: 12px;
                    padding: 8px 16px;
                    align-items: center;
                    border-bottom: 1px solid var(--border-dim, #1a1a30);
                }

                .grid-row:last-child {
                    border-bottom: none;
                }

                .grid-row input[type="text"],
                .grid-row input[type="number"] {
                    background: var(--surface-1, #0f0f1a);
                    border: 1px solid var(--border, #2a2a4a);
                    border-radius: 6px;
                    padding: 8px 12px;
                    color: var(--text-primary, #fff);
                    font-size: 13px;
                }

                .grid-row input:focus {
                    outline: none;
                    border-color: var(--accent, #6366f1);
                }

                .grid-row .col-qty {
                    text-align: center;
                    font-family: var(--font-mono, monospace);
                }

                .grid-row .col-length {
                    width: 100%;
                }

                .grid-row .col-length input {
                    width: 100%;
                    text-align: right;
                    font-family: var(--font-mono, monospace);
                }

                .btn-icon-sm {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                    background: transparent;
                    border: none;
                    border-radius: 6px;
                    color: var(--text-dim, #666);
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .btn-icon-sm:hover:not(:disabled) {
                    background: var(--danger-bg, #3f1515);
                    color: var(--danger, #ef4444);
                }

                .btn-icon-sm:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }

                .grid-footer {
                    padding: 12px 16px;
                    border-top: 1px solid var(--border-dim, #1a1a30);
                }

                .btn-add {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: transparent;
                    border: 1px dashed var(--border, #2a2a4a);
                    border-radius: 6px;
                    padding: 8px 16px;
                    color: var(--text-secondary, #a0a0b8);
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.15s;
                    width: 100%;
                    justify-content: center;
                }

                .btn-add:hover {
                    border-color: var(--accent, #6366f1);
                    color: var(--accent, #6366f1);
                    background: var(--accent-bg, rgba(99, 102, 241, 0.1));
                }

                .btn-calculate {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    width: 100%;
                    padding: 14px 24px;
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-bottom: 20px;
                }

                .btn-calculate:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
                }

                .btn-calculate:active {
                    transform: translateY(0);
                }

                .results-section {
                    margin-top: 8px;
                }

                /* Print styles */
                @media print {
                    .cutting-optimizer {
                        background: white !important;
                        color: black !important;
                        border: none !important;
                    }

                    .header-actions,
                    .settings-panel,
                    .parts-grid,
                    .btn-calculate {
                        display: none !important;
                    }

                    .results-section {
                        margin-top: 0;
                    }
                }

                /* Responsive */
                @media (max-width: 640px) {
                    .cutting-optimizer {
                        padding: 16px;
                        border-radius: 12px;
                    }

                    .settings-grid {
                        grid-template-columns: 1fr 1fr;
                    }

                    .grid-header,
                    .grid-row {
                        grid-template-columns: 1.5fr 1fr 60px 32px;
                        gap: 8px;
                        padding: 8px 12px;
                    }

                    .header-title h2 {
                        font-size: 17px;
                    }
                }
            `}</style>
        </div>
    );
}

export default CuttingOptimizer;
