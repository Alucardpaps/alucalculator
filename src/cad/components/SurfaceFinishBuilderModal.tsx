/**
 * 🧱 AluCAD — ISO 1302 / ISO 21920 Surface Texture Builder Modal
 * 
 * Complies with AGENTS.md:
 * - Industrial Instrument visual language (#07090c, #0c1016, #121821, cyan/green/amber tokens)
 * - Zero backdrop-blur, zero purple-pink gradients.
 * - JetBrains Mono typography for engineering values.
 * - Instant CAD preview & seamless insertion via InsertTool.
 */

import React, { useState, useMemo } from 'react';
import {
    SurfaceSymbolType,
    SurfaceLayDirection,
    createIso1302SurfaceTextureEntities,
    createSurfaceFinishBlock
} from '../blocks/SurfaceFinishGenerator';
import { BlockManager } from '../blocks/BlockManager';
import { commandProcessor } from '../commands/CommandProcessor';
import { InsertTool } from '../commands/tools/InsertTool';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import {
    X,
    Sparkles,
    Check,
    Box,
    Layers,
    ArrowDownToLine,
    Sliders,
    BookmarkCheck
} from 'lucide-react';

interface SurfaceFinishBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBlockSaved?: () => void;
    onInserted?: () => void;
}

interface PresetItem {
    name: string;
    symbolType: SurfaceSymbolType;
    param: string;
    val: string;
    lowerVal?: string;
    method?: string;
    lay: SurfaceLayDirection;
    allowance?: string;
    allAround?: boolean;
}

const PRESETS: PresetItem[] = [
    {
        name: 'General Machined Ra 3.2',
        symbolType: 'machining_required',
        param: 'Ra',
        val: '3.2',
        lay: 'none'
    },
    {
        name: 'Bearing Seat Ra 1.6',
        symbolType: 'machining_required',
        param: 'Ra',
        val: '1.6',
        method: 'Fine Turned',
        lay: 'none'
    },
    {
        name: 'Precision Ground Ra 0.8',
        symbolType: 'machining_required',
        param: 'Ra',
        val: '0.8',
        method: 'Ground',
        lay: 'none'
    },
    {
        name: 'Cylinder Bore Honed Ra 0.2 (X)',
        symbolType: 'machining_required',
        param: 'Ra',
        val: '0.2',
        method: 'Honed',
        lay: 'X'
    },
    {
        name: 'As-Cast Ra 12.5 (Prohibited)',
        symbolType: 'machining_prohibited',
        param: 'Ra',
        val: '12.5',
        method: 'As-Cast',
        lay: 'none'
    },
    {
        name: 'EDM Spark Ra 1.6 (P)',
        symbolType: 'machining_required',
        param: 'Ra',
        val: '1.6',
        method: 'EDM VDI 24',
        lay: 'P'
    },
    {
        name: 'Hard Anodized Ra 1.6',
        symbolType: 'machining_required',
        param: 'Ra',
        val: '1.6',
        method: 'Hard Anodized',
        lay: 'none'
    },
    {
        name: 'Dual Tolerance (3.2 max / 1.6 min)',
        symbolType: 'machining_required',
        param: 'Ra',
        val: '3.2 max',
        lowerVal: '1.6 min',
        lay: 'none'
    }
];

const STANDARD_RA_VALUES = ['0.025', '0.05', '0.1', '0.2', '0.4', '0.8', '1.6', '3.2', '6.3', '12.5', '25', '50'];
const STANDARD_RZ_VALUES = ['1.0', '1.6', '3.2', '4.0', '6.3', '10', '16', '25', '40', '63'];
const METHODS = ['Ground', 'Milled', 'Turned', 'Honed', 'Polished', 'Lapped', 'Reamed H7', 'EDM', 'Hard Anodized', 'Chrome Plated', 'Shot Peened', 'As-Cast'];
const LAY_OPTIONS: { id: SurfaceLayDirection; label: string; desc: string }[] = [
    { id: 'none', label: 'None', desc: 'No lay specified' },
    { id: '=', label: '=', desc: 'Parallel to plane' },
    { id: '⊥', label: '⊥', desc: 'Perpendicular to plane' },
    { id: 'X', label: 'X', desc: 'Crossed oblique pattern' },
    { id: 'M', label: 'M', desc: 'Multi-directional' },
    { id: 'C', label: 'C', desc: 'Concentric / Circular' },
    { id: 'R', label: 'R', desc: 'Radial pattern' },
    { id: 'P', label: 'P', desc: 'Particulate / Non-directional' },
];

export function SurfaceFinishBuilderModal({ isOpen, onClose, onBlockSaved, onInserted }: SurfaceFinishBuilderModalProps) {
    const { language } = useI18nStore();

    // Form state
    const [symbolType, setSymbolType] = useState<SurfaceSymbolType>('machining_required');
    const [allAround, setAllAround] = useState(false);
    const [roughnessParam, setRoughnessParam] = useState<'Ra' | 'Rz' | 'Rmax' | 'Rq'>('Ra');
    const [roughnessValue, setRoughnessValue] = useState('3.2');
    const [lowerValue, setLowerValue] = useState('');
    const [method, setMethod] = useState('');
    const [lay, setLay] = useState<SurfaceLayDirection>('none');
    const [allowance, setAllowance] = useState('');
    const [samplingLength, setSamplingLength] = useState('');
    const [savedNotification, setSavedNotification] = useState(false);

    // Apply preset
    const applyPreset = (preset: PresetItem) => {
        setSymbolType(preset.symbolType);
        setRoughnessParam((preset.param as 'Ra' | 'Rz') || 'Ra');
        setRoughnessValue(preset.val);
        setLowerValue(preset.lowerVal || '');
        setMethod(preset.method || '');
        setLay(preset.lay);
        setAllowance(preset.allowance || '');
        setAllAround(Boolean(preset.allAround));
    };

    // Live generated entities
    const generatedEntities = useMemo(() => {
        return createIso1302SurfaceTextureEntities({
            symbolType,
            allAround,
            roughnessParameter: roughnessParam,
            roughnessValue,
            lowerRoughnessValue: lowerValue || undefined,
            manufacturingMethod: method || undefined,
            layDirection: lay,
            machiningAllowance: allowance || undefined,
            samplingLength: samplingLength || undefined,
            layerId: 'layer-0',
            symbolColor: '#3ad0e6',
            textColor: '#e7edf4'
        });
    }, [symbolType, allAround, roughnessParam, roughnessValue, lowerValue, method, lay, allowance, samplingLength]);

    // Live block definition
    const currentBlock = useMemo(() => {
        const titleParts = [`${roughnessParam} ${roughnessValue}`];
        if (method) titleParts.push(method);
        if (lay !== 'none') titleParts.push(`Lay ${lay}`);
        const fullName = `ISO 1302 Surface ${titleParts.join(' / ')}`;

        return createSurfaceFinishBlock({
            id: `custom_surface_${Date.now()}`,
            name: fullName,
            description: `ISO 1302 Surface Texture Symbol with ${titleParts.join(', ')}`,
            subcategory: 'Surface Texture',
            symbolType,
            allAround,
            roughnessParameter: roughnessParam,
            roughnessValue,
            lowerRoughnessValue: lowerValue || undefined,
            manufacturingMethod: method || undefined,
            layDirection: lay,
            machiningAllowance: allowance || undefined,
            samplingLength: samplingLength || undefined
        });
    }, [symbolType, allAround, roughnessParam, roughnessValue, lowerValue, method, lay, allowance, samplingLength]);

    if (!isOpen) return null;

    // Handle Direct Insertion
    const handleInsert = () => {
        const tool = new InsertTool(currentBlock);
        commandProcessor.setActiveTool(tool);
        if (onInserted) {
            onInserted();
        } else {
            onClose();
        }
    };

    // Handle Save to User Library
    const handleSaveToLibrary = () => {
        BlockManager.saveBlock({
            name: currentBlock.name,
            description: currentBlock.description,
            category: 'Symbols',
            subcategory: 'Surface Texture',
            basePoint: currentBlock.basePoint,
            entities: currentBlock.entities
        });
        setSavedNotification(true);
        setTimeout(() => setSavedNotification(false), 2500);
        if (onBlockSaved) onBlockSaved();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-sans">
            <div className="flex h-[92vh] w-[95vw] max-w-5xl flex-col rounded-lg border border-[var(--line)] bg-[var(--bg-0)] shadow-2xl overflow-hidden">
                {/* ─── HEADER BAR ─── */}
                <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--bg-1)] px-5 py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded border border-[var(--cyan)]/40 bg-[var(--cyan)]/10 text-[var(--cyan)]">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-semibold text-[var(--ink)] tracking-wide uppercase font-mono">
                                    {t12(language, 'ISO 1302 Surface Texture Builder', 'ISO 1302 Yüzey İşareti Sihirbazı')}
                                </h2>
                                <span className="rounded bg-[var(--bg-3)] px-2 py-0.5 text-[10px] font-mono text-[var(--cyan)] border border-[var(--line)]">
                                    DIN EN ISO 1302 / ISO 21920
                                </span>
                            </div>
                            <p className="text-[11px] text-[var(--alu-dim)]">
                                {t12(language, 'Parametric engineering surface finish generator with live CAD preview', 'Canlı CAD önizlemeli parametrik yüzey işleme işareti oluşturucu')}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded p-1 text-[var(--alu-dim)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)] transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* ─── BODY (2 COLUMNS: PREVIEW ON LEFT, CONTROLS ON RIGHT) ─── */}
                <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
                    {/* LEFT: LIVE CAD PREVIEW & TELEMETRY */}
                    <div className="flex flex-col md:w-5/12 border-b md:border-b-0 md:border-r border-[var(--line)] bg-[var(--bg-1)] p-4">
                        <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]/50 mb-3">
                            <span className="text-xs font-mono font-semibold uppercase text-[var(--cyan)] flex items-center gap-1.5">
                                <Sliders className="h-3.5 w-3.5" />
                                {t12(language, 'Live CAD Preview (1:1)', 'Canlı CAD Önizleme (1:1)')}
                            </span>
                            <span className="text-[10px] font-mono text-[var(--alu-dim)]">
                                Apex: (0, 0)
                            </span>
                        </div>

                        {/* Interactive SVG Viewport */}
                        <div className="relative flex-1 rounded border border-[var(--line)] bg-[var(--bg-0)] p-2 flex items-center justify-center overflow-hidden min-h-[220px]">
                            {/* Technical Grid Background */}
                            <svg className="absolute inset-0 h-full w-full opacity-15 pointer-events-none">
                                <defs>
                                    <pattern id="grid_dots" width="16" height="16" patternUnits="userSpaceOnUse">
                                        <circle cx="2" cy="2" r="0.8" fill="#3ad0e6" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid_dots)" />
                            </svg>

                            {/* Reference Surface Baseline (Workpiece) */}
                            <svg
                                viewBox="-12 -16 38 24"
                                className="w-full h-full max-h-[300px]"
                                preserveAspectRatio="xMidYMid meet"
                            >
                                {/* Workpiece surface line */}
                                <line x1="-12" y1="0" x2="26" y2="0" stroke="#334155" strokeWidth="0.35" strokeDasharray="1 0.5" />
                                <text x="-11" y="2.5" fill="#8a96a6" fontSize="1.2" fontFamily="'JetBrains Mono', monospace">SURFACE BASELINE</text>

                                {/* Apex indicator */}
                                <circle cx="0" cy="0" r="0.4" fill="#e85d5d" />

                                {/* Render Generated Entities */}
                                {generatedEntities.map((ent, i) => {
                                    const g = ent.geometry;
                                    if (g.type === 'LINE') {
                                        return (
                                            <line
                                                key={i}
                                                x1={g.start.x}
                                                y1={-g.start.y}
                                                x2={g.end.x}
                                                y2={-g.end.y}
                                                stroke={ent.color || '#3ad0e6'}
                                                strokeWidth={0.5}
                                                strokeLinecap="round"
                                            />
                                        );
                                    }
                                    if (g.type === 'CIRCLE') {
                                        return (
                                            <circle
                                                key={i}
                                                cx={g.center.x}
                                                cy={-g.center.y}
                                                r={g.radius}
                                                fill="none"
                                                stroke={ent.color || '#3ad0e6'}
                                                strokeWidth={0.5}
                                            />
                                        );
                                    }
                                    if (g.type === 'TEXT') {
                                        const anchor = g.justification === 'right' ? 'end' : g.justification === 'center' ? 'middle' : 'start';
                                        return (
                                            <text
                                                key={i}
                                                x={g.position.x}
                                                y={-g.position.y}
                                                fill={ent.color || '#e7edf4'}
                                                fontSize={g.fontSize || 2.4}
                                                fontFamily="'JetBrains Mono', monospace"
                                                fontWeight={g.bold ? 'bold' : 'normal'}
                                                textAnchor={anchor}
                                                dominantBaseline="alphabetic"
                                            >
                                                {g.content}
                                            </text>
                                        );
                                    }
                                    return null;
                                })}
                            </svg>
                        </div>

                        {/* Specs Readout */}
                        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono text-[var(--alu-dim)] bg-[var(--bg-2)] p-2.5 rounded border border-[var(--line)]">
                            <div>
                                <span className="text-[var(--alu-dim)] block">{t12(language, 'Symbol Type', 'Sembol Tipi')}:</span>
                                <span className="text-[var(--cyan)] font-semibold">
                                    {symbolType === 'machining_required' ? 'Machining Required' : symbolType === 'machining_prohibited' ? 'Removal Prohibited' : 'Any Process'}
                                </span>
                            </div>
                            <div>
                                <span className="text-[var(--alu-dim)] block">{t12(language, 'Roughness', 'Pürüzlülük')}:</span>
                                <span className="text-[var(--ink)] font-semibold">
                                    {roughnessParam} {roughnessValue} {lowerValue ? `(${lowerValue})` : ''}
                                </span>
                            </div>
                            <div>
                                <span className="text-[var(--alu-dim)] block">{t12(language, 'Lay Pattern', 'İşleme İzi')}:</span>
                                <span className="text-[var(--ok)] font-semibold">{lay !== 'none' ? lay : 'None'}</span>
                            </div>
                            <div>
                                <span className="text-[var(--alu-dim)] block">{t12(language, 'Entities Count', 'Eleman Sayısı')}:</span>
                                <span className="text-[var(--warn)] font-semibold">{generatedEntities.length} entities</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: PARAMETER CONTROLS & PRESETS */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {/* 1. Quick Presets */}
                        <div>
                            <label className="text-[11px] font-mono text-[var(--alu-dim)] uppercase tracking-wider block mb-1.5">
                                {t12(language, 'Engineering Presets (Hızlı Şablonlar)', 'Mühendislik Standart Şablonları')}
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {PRESETS.map((p, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => applyPreset(p)}
                                        className="rounded border border-[var(--line)] bg-[var(--bg-2)] px-2 py-1 text-[11px] font-mono text-[var(--alu)] hover:border-[var(--cyan)] hover:text-[var(--cyan)] transition-colors"
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. Symbol Type Selector */}
                        <div>
                            <label className="text-[11px] font-mono text-[var(--alu-dim)] uppercase tracking-wider block mb-1.5">
                                {t12(language, '1. Manufacturing Requirement (İmalat Türü)', '1. İmalat Gereksinimi (ISO 1302)')}
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSymbolType('machining_required')}
                                    className={`rounded border p-2 text-left transition-colors font-mono text-xs ${
                                        symbolType === 'machining_required'
                                            ? 'border-[var(--cyan)] bg-[var(--cyan)]/10 text-[var(--cyan)] font-semibold'
                                            : 'border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-[var(--ink)]'
                                    }`}
                                >
                                    <span className="block font-bold">Machining Required</span>
                                    <span className="text-[10px] text-[var(--alu-dim)] block mt-0.5">Talaş Kaldırılacak (Kapalı Bar)</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSymbolType('any_process')}
                                    className={`rounded border p-2 text-left transition-colors font-mono text-xs ${
                                        symbolType === 'any_process'
                                            ? 'border-[var(--cyan)] bg-[var(--cyan)]/10 text-[var(--cyan)] font-semibold'
                                            : 'border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-[var(--ink)]'
                                    }`}
                                >
                                    <span className="block font-bold">Any Process</span>
                                    <span className="text-[10px] text-[var(--alu-dim)] block mt-0.5">Talaş Kaldırma Serbest (Açık V)</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSymbolType('machining_prohibited')}
                                    className={`rounded border p-2 text-left transition-colors font-mono text-xs ${
                                        symbolType === 'machining_prohibited'
                                            ? 'border-[var(--cyan)] bg-[var(--cyan)]/10 text-[var(--cyan)] font-semibold'
                                            : 'border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-[var(--ink)]'
                                    }`}
                                >
                                    <span className="block font-bold">Removal Prohibited</span>
                                    <span className="text-[10px] text-[var(--alu-dim)] block mt-0.5">Talaş Kaldırmak Yasak (Daireli)</span>
                                </button>
                            </div>

                            {/* All-Around toggle */}
                            <div className="mt-2 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="allAroundCheck"
                                    checked={allAround}
                                    onChange={(e) => setAllAround(e.target.checked)}
                                    className="rounded border-[var(--line-strong)] bg-[var(--bg-2)] text-[var(--cyan)] focus:ring-0"
                                />
                                <label htmlFor="allAroundCheck" className="text-xs font-mono text-[var(--alu)] cursor-pointer">
                                    {t12(language, 'All-Around Profile (Tüm Çevre Boyunca - Çember Sembolü)', 'Tüm Çevre Boyunca (All-Around Circle)')}
                                </label>
                            </div>
                        </div>

                        {/* 3. Roughness Parameters & Limits */}
                        <div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="min-w-0">
                                    <label className="text-[11px] font-mono text-[var(--alu-dim)] uppercase tracking-wider block mb-1 truncate" title={t12(language, 'Parameter (ISO 4287)', 'Parametre')}>
                                        {t12(language, 'Parameter', 'Parametre')}
                                    </label>
                                    <select
                                        value={roughnessParam}
                                        onChange={(e) => setRoughnessParam(e.target.value as 'Ra' | 'Rz' | 'Rmax' | 'Rq')}
                                        className="w-full min-w-0 rounded border border-[var(--line)] bg-[var(--bg-2)] px-2.5 py-1.5 text-xs font-mono text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none"
                                    >
                                        <option value="Ra">Ra (Arithmetical Mean)</option>
                                        <option value="Rz">Rz (Mean Peak-to-Valley)</option>
                                        <option value="Rmax">Rmax (Maximum Height)</option>
                                        <option value="Rq">Rq (RMS Roughness)</option>
                                    </select>
                                </div>

                                <div className="min-w-0">
                                    <label className="text-[11px] font-mono text-[var(--alu-dim)] uppercase tracking-wider block mb-1 truncate" title={t12(language, 'Roughness Value (μm)', 'Pürüzlülük Değeri (μm)')}>
                                        {t12(language, 'Roughness Value (μm)', 'Pürüzlülük Değeri (μm)')}
                                    </label>
                                    <input
                                        type="text"
                                        value={roughnessValue}
                                        onChange={(e) => setRoughnessValue(e.target.value)}
                                        className="w-full min-w-0 rounded border border-[var(--line)] bg-[var(--bg-2)] px-2.5 py-1.5 text-xs font-mono text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none"
                                        placeholder="e.g. 3.2"
                                    />
                                </div>

                                <div className="min-w-0">
                                    <label className="text-[11px] font-mono text-[var(--alu-dim)] uppercase tracking-wider block mb-1 truncate" title={t12(language, 'Lower Limit (Optional - μm)', 'Alt Sınır (Opsiyonel - μm)')}>
                                        {t12(language, 'Lower Limit (Optional)', 'Alt Sınır (Opsiyonel)')}
                                    </label>
                                    <input
                                        type="text"
                                        value={lowerValue}
                                        onChange={(e) => setLowerValue(e.target.value)}
                                        className="w-full min-w-0 rounded border border-[var(--line)] bg-[var(--bg-2)] px-2.5 py-1.5 text-xs font-mono text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none"
                                        placeholder="e.g. 1.6 min"
                                    />
                                </div>
                            </div>

                            {/* Standard ISO Roughness Value Chips */}
                            <div className="mt-2.5">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-mono text-[var(--alu-dim)] uppercase tracking-wider">
                                        {t12(language, `Standard ISO ${roughnessParam} Grades (μm):`, `Standart ISO ${roughnessParam} Değerleri (μm):`)}
                                    </span>
                                    <span className="text-[9px] font-mono text-[var(--muted)]">
                                        ISO 1302 / DIN 4768
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {(roughnessParam === 'Ra' ? STANDARD_RA_VALUES : STANDARD_RZ_VALUES).map((v) => {
                                        const isSelected = roughnessValue === v || roughnessValue === `${roughnessParam} ${v}`;
                                        return (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => setRoughnessValue(v)}
                                                className={`rounded px-2 py-0.5 text-xs font-mono border transition-all ${
                                                    isSelected
                                                        ? 'border-[var(--cyan)] bg-[var(--cyan)]/20 text-[var(--cyan)] font-bold shadow-sm'
                                                        : 'border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-[var(--ink)] hover:border-[var(--line-strong)]'
                                                }`}
                                            >
                                                {v}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* 4. Manufacturing Method / Process */}
                        <div>
                            <label className="text-[11px] font-mono text-[var(--alu-dim)] uppercase tracking-wider block mb-1 truncate" title={t12(language, 'Manufacturing Method / Treatment (İmalat Yöntemi / İşlem)', 'İmalat Yöntemi / Kaplama (ISO 1302)')}>
                                {t12(language, 'Manufacturing Method / Treatment (İmalat Yöntemi)', 'İmalat Yöntemi / Kaplama (ISO 1302)')}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value)}
                                    className="flex-1 min-w-0 rounded border border-[var(--line)] bg-[var(--bg-2)] px-2.5 py-1.5 text-xs font-mono text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none"
                                    placeholder="e.g. Ground, Milled, Honed, Hard Anodized, Chrome Plated"
                                />
                                <button
                                    type="button"
                                    onClick={() => setMethod('')}
                                    className="shrink-0 rounded border border-[var(--line)] bg-[var(--bg-2)] px-2.5 py-1 text-xs font-mono text-[var(--alu-dim)] hover:text-[var(--ink)]"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                                {METHODS.map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setMethod(m)}
                                        className={`rounded px-1.5 py-0.5 text-[10px] font-mono border transition-colors ${
                                            method === m
                                                ? 'border-[var(--cyan)] bg-[var(--cyan)]/15 text-[var(--cyan)]'
                                                : 'border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-[var(--alu)]'
                                        }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 5. Surface Lay Direction */}
                        <div>
                            <label className="text-[11px] font-mono text-[var(--alu-dim)] uppercase tracking-wider block mb-1">
                                {t12(language, 'Surface Lay Direction (İşleme İzi Yönü - ISO 1302)', 'İşleme İzi Yönü (Surface Lay)')}
                            </label>
                            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                                {LAY_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setLay(opt.id)}
                                        title={opt.desc}
                                        className={`rounded border p-1.5 text-center font-mono transition-colors ${
                                            lay === opt.id
                                                ? 'border-[var(--ok)] bg-[var(--ok)]/15 text-[var(--ok)] font-bold shadow-sm'
                                                : 'border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-[var(--ink)]'
                                        }`}
                                    >
                                        <span className="block text-sm font-bold">{opt.label}</span>
                                        <span className="block text-[8px] truncate opacity-70">{opt.id}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 6. Machining Allowance & Sampling Length */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="min-w-0">
                                <label className="text-[11px] font-mono text-[var(--alu-dim)] uppercase tracking-wider block mb-1 truncate" title={t12(language, 'Machining Allowance (İşleme Payı - mm)', 'İşleme Payı (Sol Kolda Belirtilen - mm)')}>
                                    {t12(language, 'Machining Allowance (İşleme Payı - mm)', 'İşleme Payı (Sol Kol - mm)')}
                                </label>
                                <input
                                    type="text"
                                    value={allowance}
                                    onChange={(e) => setAllowance(e.target.value)}
                                    className="w-full min-w-0 rounded border border-[var(--line)] bg-[var(--bg-2)] px-2.5 py-1.5 text-xs font-mono text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none"
                                    placeholder="e.g. 2.0 or 1.5"
                                />
                            </div>

                            <div className="min-w-0">
                                <label className="text-[11px] font-mono text-[var(--alu-dim)] uppercase tracking-wider block mb-1 truncate" title={t12(language, 'Sampling Length / Cutoff (Örnekleme Boyu - mm)', 'Örnekleme Boyu (Cutoff - mm)')}>
                                    {t12(language, 'Sampling Length / Cutoff (mm)', 'Örnekleme Boyu (Cutoff - mm)')}
                                </label>
                                <input
                                    type="text"
                                    value={samplingLength}
                                    onChange={(e) => setSamplingLength(e.target.value)}
                                    className="w-full min-w-0 rounded border border-[var(--line)] bg-[var(--bg-2)] px-2.5 py-1.5 text-xs font-mono text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none"
                                    placeholder="e.g. 0.8 or 2.5"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── FOOTER ACTIONS ─── */}
                <div className="flex items-center justify-between border-t border-[var(--line)] bg-[var(--bg-1)] px-5 py-3">
                    <div className="flex items-center gap-2">
                        {savedNotification && (
                            <span className="flex items-center gap-1 text-xs font-mono text-[var(--ok)] animate-pulse">
                                <Check className="h-3.5 w-3.5" />
                                {t12(language, 'Saved to Custom Blocks Library!', 'Özel Blok Kütüphanesine Kaydedildi!')}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={handleSaveToLibrary}
                            className="flex items-center gap-1.5 rounded border border-[var(--line)] bg-[var(--bg-2)] px-3.5 py-1.5 text-xs font-mono text-[var(--alu)] hover:border-[var(--ok)] hover:text-[var(--ok)] transition-colors"
                        >
                            <BookmarkCheck className="h-4 w-4" />
                            {t12(language, 'Save to My Blocks', 'Kütüphaneme Kaydet')}
                        </button>

                        <button
                            type="button"
                            onClick={handleInsert}
                            className="flex items-center gap-1.5 rounded border border-[var(--cyan)] bg-[var(--cyan)] px-4 py-1.5 text-xs font-mono font-semibold text-[var(--bg-0)] hover:bg-[var(--cyan)]/90 transition-all "
                        >
                            <ArrowDownToLine className="h-4 w-4" />
                            {t12(language, 'Insert into Drawing (Çizime Yerleştir)', 'Çizime Yerleştir')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
