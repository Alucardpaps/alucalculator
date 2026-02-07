/**
 * CAD Toolbar - Drawing tools and settings panel
 * AutoCAD/Miro-style floating toolbar
 */

'use client';

import React, { useState } from 'react';
import { useCADCanvasStore, CADTool, Unit, SnapMode } from '@/store/CADCanvasStore';
import {
    MousePointer2, Minus, Square, Circle, Ruler, Type, ArrowUpRight,
    Grid3X3, Magnet, ZoomIn, ZoomOut, RotateCcw, Trash2, Download, Upload,
    ChevronDown, Move, LucideIcon, X, Check, Scissors, Maximize, CornerUpRight, Slash, Scan
} from 'lucide-react';

// ============================================
// Tool Definitions
// ============================================

interface ToolDef {
    id: CADTool;
    label: string;
    Icon: LucideIcon;
    group: 'select' | 'draw' | 'modify' | 'dimension' | 'annotate';
}

const TOOLS: ToolDef[] = [
    { id: 'select', label: 'Select', Icon: MousePointer2, group: 'select' },
    { id: 'pan', label: 'Pan', Icon: Move, group: 'select' },
    { id: 'line', label: 'Line', Icon: Minus, group: 'draw' },
    { id: 'rectangle', label: 'Rectangle', Icon: Square, group: 'draw' },
    { id: 'circle', label: 'Circle', Icon: Circle, group: 'draw' },
    // Modify Tools
    { id: 'trim', label: 'Trim', Icon: Scissors, group: 'modify' },
    { id: 'extend', label: 'Extend', Icon: Maximize, group: 'modify' },
    { id: 'fillet', label: 'Fillet', Icon: CornerUpRight, group: 'modify' },
    { id: 'chamfer', label: 'Chamfer', Icon: Slash, group: 'modify' },
    // Dimensions
    { id: 'smart-dimension', label: 'Smart Dim', Icon: Scan, group: 'dimension' },
    { id: 'dimension-linear', label: 'Linear Dim', Icon: Ruler, group: 'dimension' },
    { id: 'dimension-angular', label: 'Angular Dim', Icon: Ruler, group: 'dimension' },
    { id: 'dimension-radius', label: 'Radius Dim', Icon: Ruler, group: 'dimension' },
    { id: 'text', label: 'Text', Icon: Type, group: 'annotate' },
    { id: 'leader', label: 'Leader', Icon: ArrowUpRight, group: 'annotate' },
];

const SNAP_MODES: { mode: SnapMode; label: string }[] = [
    { mode: 'grid', label: 'Grid' },
    { mode: 'endpoint', label: 'Endpoint' },
    { mode: 'midpoint', label: 'Midpoint' },
    { mode: 'intersection', label: 'Intersection' },
    { mode: 'perpendicular', label: 'Perpendicular' },
];

const UNITS: { value: Unit; label: string }[] = [
    { value: 'mm', label: 'mm' },
    { value: 'cm', label: 'cm' },
    { value: 'inch', label: 'inch' },
    { value: 'm', label: 'm' },
];

// ============================================
// Toolbar Component
// ============================================

export function CADToolbar() {
    const [showSnapMenu, setShowSnapMenu] = useState(false);
    const [showUnitMenu, setShowUnitMenu] = useState(false);

    // Drag state for movable toolbar
    const [position, setPosition] = useState({ x: 16, y: 64 }); // Default: left side
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const {
        currentTool,
        setCurrentTool,
        unit,
        setUnit,
        precision,
        setPrecision,
        snapSettings,
        toggleSnap,
        toggleSnapMode,
        showGrid,
        toggleGrid,
        showRulers,
        toggleRulers,
        zoomIn,
        zoomOut,
        resetView,
        viewport,
        clearCanvas,
        deleteSelected,
        selectedIds,
        exportToJSON,
        importFromJSON,
        exportToDXF
    } = useCADCanvasStore();

    // Drag handlers
    const handleDragStart = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleDragMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y
        });
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const resetPosition = () => {
        setPosition({ x: 16, y: 64 });
    };

    // Global mouse events for drag
    React.useEffect(() => {
        if (isDragging) {
            const handleGlobalMove = (e: MouseEvent) => {
                setPosition({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                });
            };
            const handleGlobalUp = () => setIsDragging(false);

            window.addEventListener('mousemove', handleGlobalMove);
            window.addEventListener('mouseup', handleGlobalUp);
            return () => {
                window.removeEventListener('mousemove', handleGlobalMove);
                window.removeEventListener('mouseup', handleGlobalUp);
            };
        }
    }, [isDragging, dragOffset]);

    const handleExportJSON = () => {
        const json = exportToJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cad-drawing.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportDXF = () => {
        const dxf = exportToDXF();
        const blob = new Blob([dxf], { type: 'application/dxf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cad-drawing.dxf';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const json = e.target?.result as string;
                    importFromJSON(json);
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    return (
        <div
            className="fixed z-50 flex flex-col gap-2"
            style={{
                left: position.x,
                top: position.y,
                backgroundColor: 'var(--color-os-panel)',
                border: '1px solid var(--color-os-border)',
                borderRadius: '8px',
                padding: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                cursor: isDragging ? 'grabbing' : 'default'
            }}
        >
            {/* Drag Handle Header */}
            <div
                className="flex items-center justify-between gap-2 px-1 pb-1 mb-1 border-b cursor-grab select-none"
                style={{ borderColor: 'var(--color-os-border)' }}
                onMouseDown={handleDragStart}
            >
                <div className="flex items-center gap-1">
                    <div className="flex flex-col gap-0.5">
                        <div className="flex gap-0.5">
                            <div className="w-1 h-1 rounded-full bg-cyan-400/50" />
                            <div className="w-1 h-1 rounded-full bg-cyan-400/50" />
                        </div>
                        <div className="flex gap-0.5">
                            <div className="w-1 h-1 rounded-full bg-cyan-400/50" />
                            <div className="w-1 h-1 rounded-full bg-cyan-400/50" />
                        </div>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-os-text-secondary)' }}>
                        CAD
                    </span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); resetPosition(); }}
                    className="text-[10px] px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
                    style={{ color: 'var(--color-os-text-secondary)' }}
                    title="Dock to left"
                >
                    ⌂
                </button>
            </div>
            {/* Drawing Tools */}
            <div className="flex flex-col gap-1">
                <div className="text-[10px] uppercase tracking-wider mb-1 px-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                    Tools
                </div>
                {TOOLS.filter(t => t.group === 'select' || t.group === 'draw').map(tool => (
                    <ToolButton
                        key={tool.id}
                        icon={tool.Icon}
                        label={tool.label}
                        isActive={currentTool === tool.id}
                        onClick={() => setCurrentTool(tool.id)}
                    />
                ))}
            </div>

            <div className="h-px" style={{ backgroundColor: 'var(--color-os-border)' }} />

            {/* Modify Tools */}
            <div className="flex flex-col gap-1">
                <div className="text-[10px] uppercase tracking-wider mb-1 px-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                    Modify
                </div>
                {TOOLS.filter(t => t.group === 'modify').map(tool => (
                    <ToolButton
                        key={tool.id}
                        icon={tool.Icon}
                        label={tool.label}
                        isActive={currentTool === tool.id}
                        onClick={() => setCurrentTool(tool.id)}
                    />
                ))}
            </div>

            <div className="h-px" style={{ backgroundColor: 'var(--color-os-border)' }} />

            {/* Dimension Tools */}
            <div className="flex flex-col gap-1">
                <div className="text-[10px] uppercase tracking-wider mb-1 px-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                    Dimensions
                </div>
                {TOOLS.filter(t => t.group === 'dimension').map(tool => (
                    <ToolButton
                        key={tool.id}
                        icon={tool.Icon}
                        label={tool.label}
                        isActive={currentTool === tool.id}
                        onClick={() => setCurrentTool(tool.id)}
                    />
                ))}
            </div>

            <div className="h-px" style={{ backgroundColor: 'var(--color-os-border)' }} />

            {/* Annotation Tools */}
            <div className="flex flex-col gap-1">
                <div className="text-[10px] uppercase tracking-wider mb-1 px-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                    Annotate
                </div>
                {TOOLS.filter(t => t.group === 'annotate').map(tool => (
                    <ToolButton
                        key={tool.id}
                        icon={tool.Icon}
                        label={tool.label}
                        isActive={currentTool === tool.id}
                        onClick={() => setCurrentTool(tool.id)}
                    />
                ))}
            </div>

            <div className="h-px" style={{ backgroundColor: 'var(--color-os-border)' }} />

            {/* Snap Settings */}
            <div className="relative">
                <button
                    onClick={() => setShowSnapMenu(!showSnapMenu)}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded transition-colors"
                    style={{
                        backgroundColor: snapSettings.enabled ? 'var(--color-os-accent)' : 'transparent',
                        color: snapSettings.enabled ? '#000' : 'var(--color-os-text-primary)'
                    }}
                >
                    <Magnet size={16} />
                    <span className="text-xs flex-1 text-left">Snap</span>
                    <ChevronDown size={12} />
                </button>

                {showSnapMenu && (
                    <SnapMenu
                        snapSettings={snapSettings}
                        onToggleSnap={toggleSnap}
                        onToggleMode={toggleSnapMode}
                        onClose={() => setShowSnapMenu(false)}
                        showGrid={showGrid}
                        toggleGrid={toggleGrid}
                        showRulers={showRulers}
                        toggleRulers={toggleRulers}
                    />
                )}
            </div>

            <div className="h-px" style={{ backgroundColor: 'var(--color-os-border)' }} />

            {/* Unit Selector */}
            <div className="relative">
                <button
                    onClick={() => setShowUnitMenu(!showUnitMenu)}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded transition-colors hover:bg-white/5"
                    style={{ color: 'var(--color-os-text-primary)' }}
                >
                    <span className="text-xs flex-1 text-left font-mono">{unit.toUpperCase()}</span>
                    <ChevronDown size={12} />
                </button>

                {showUnitMenu && (
                    <UnitMenu
                        currentUnit={unit}
                        onSelect={(u) => { setUnit(u); setShowUnitMenu(false); }}
                        onClose={() => setShowUnitMenu(false)}
                        precision={precision}
                        setPrecision={setPrecision}
                    />
                )}
            </div>

            <div className="h-px" style={{ backgroundColor: 'var(--color-os-border)' }} />

            {/* View Controls */}
            <div className="flex gap-1">
                <button
                    onClick={zoomOut}
                    className="flex-1 flex items-center justify-center py-1.5 rounded transition-colors hover:bg-white/10"
                    style={{ color: 'var(--color-os-text-secondary)' }}
                    title="Zoom Out"
                >
                    <ZoomOut size={16} />
                </button>
                <div
                    className="flex-1 flex items-center justify-center py-1.5 text-xs font-mono"
                    style={{ color: 'var(--color-os-text-primary)' }}
                >
                    {Math.round(viewport.zoom * 100)}%
                </div>
                <button
                    onClick={zoomIn}
                    className="flex-1 flex items-center justify-center py-1.5 rounded transition-colors hover:bg-white/10"
                    style={{ color: 'var(--color-os-text-secondary)' }}
                    title="Zoom In"
                >
                    <ZoomIn size={16} />
                </button>
            </div>

            <button
                onClick={resetView}
                className="flex items-center justify-center gap-2 px-2 py-1.5 rounded text-xs transition-colors hover:bg-white/10"
                style={{ color: 'var(--color-os-text-secondary)' }}
            >
                <RotateCcw size={14} />
                Reset View
            </button>

            <div className="h-px" style={{ backgroundColor: 'var(--color-os-border)' }} />

            {/* Actions */}
            <div className="flex flex-col gap-1">
                <button
                    onClick={deleteSelected}
                    disabled={selectedIds.length === 0}
                    className="flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors hover:bg-red-500/20 disabled:opacity-30"
                    style={{ color: '#ff4444' }}
                >
                    <Trash2 size={14} />
                    Delete Selected
                </button>

                <button
                    onClick={clearCanvas}
                    className="flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors hover:bg-red-500/20"
                    style={{ color: '#ff8800' }}
                >
                    <Trash2 size={14} />
                    Clear All
                </button>
            </div>

            <div className="h-px" style={{ backgroundColor: 'var(--color-os-border)' }} />

            {/* Import/Export */}
            <div className="flex flex-col gap-1">
                <ToolButton
                    icon={Upload}
                    label="Import JSON"
                    onClick={handleImport}
                />
                <div className="flex gap-1">
                    <div className="flex-1">
                        <ToolButton
                            icon={Download}
                            label="JSON"
                            onClick={handleExportJSON}
                        />
                    </div>
                    <div className="flex-1">
                        <ToolButton
                            icon={Download}
                            label="DXF"
                            onClick={handleExportDXF}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Tool Button Component
// ============================================

interface ToolButtonProps {
    icon: LucideIcon;
    label: string;
    isActive?: boolean;
    onClick: () => void;
}

function ToolButton({ icon: Icon, label, isActive, onClick }: ToolButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center justify-center w-full gap-2 px-2 py-1.5 rounded transition-all ${isActive
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
            title={label}
        >
            <Icon size={16} />
            <span className="text-xs">{label}</span>
        </button>
    );
}

// ============================================
// Snap Menu Component
// ============================================

interface SnapMenuProps {
    snapSettings: { enabled: boolean; modes: SnapMode[]; gridSize: number };
    onToggleSnap: () => void;
    onToggleMode: (mode: SnapMode) => void;
    onClose: () => void;
    showGrid: boolean;
    toggleGrid: () => void;
    showRulers: boolean;
    toggleRulers: () => void;
}

function SnapMenu({
    snapSettings,
    onToggleSnap,
    onToggleMode,
    onClose,
    showGrid,
    toggleGrid,
    showRulers,
    toggleRulers
}: SnapMenuProps) {
    return (
        <div
            className="absolute left-full top-0 ml-2 rounded shadow-xl border w-48 z-50 py-1"
            style={{
                backgroundColor: 'var(--color-os-panel)',
                borderColor: 'var(--color-os-border)'
            }}
        >
            <div className="flex items-center justify-between px-3 py-1 border-b mb-1" style={{ borderColor: 'var(--color-os-border)' }}>
                <span className="text-xs font-bold text-slate-500 uppercase">Snap Modes</span>
                <button onClick={onClose} className="hover:text-white text-slate-500">
                    <X size={12} />
                </button>
            </div>

            <button
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 flex items-center justify-between"
                onClick={onToggleSnap}
            >
                <span>Enable Snap</span>
                {snapSettings.enabled && <Check size={14} className="text-cyan-400" />}
            </button>

            <div className="h-px bg-white/10 my-1" />

            {SNAP_MODES.map(({ mode, label }) => (
                <button
                    key={mode}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 flex items-center justify-between"
                    onClick={() => onToggleMode(mode)}
                    disabled={!snapSettings.enabled}
                    style={{ opacity: snapSettings.enabled ? 1 : 0.5 }}
                >
                    <span>{label}</span>
                    {snapSettings.modes.includes(mode) && <Check size={14} className="text-cyan-400" />}
                </button>
            ))}

            <div className="h-px bg-white/10 my-1" />

            <div className="px-3 py-1.5">
                <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ color: 'var(--color-os-text-secondary)' }}>Grid Size: {snapSettings.gridSize}mm</span>
                </div>
                <div className="flex gap-1 mt-2">
                    <button
                        className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-xs ${showGrid ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-400'}`}
                        onClick={toggleGrid}
                        title="Toggle Grid"
                    >
                        <Grid3X3 size={12} /> Grid
                    </button>
                    <button
                        className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-xs ${showRulers ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-400'}`}
                        onClick={toggleRulers}
                        title="Toggle Rulers"
                    >
                        <Ruler size={12} /> Rulers
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Unit Menu Component
// ============================================

interface UnitMenuProps {
    currentUnit: Unit;
    onSelect: (unit: Unit) => void;
    onClose: () => void;
    precision: number;
    setPrecision: (p: number) => void;
}

function UnitMenu({ currentUnit, onSelect, onClose, precision, setPrecision }: UnitMenuProps) {
    return (
        <div
            className="absolute left-full top-0 ml-2 rounded shadow-xl border w-40 z-50 py-1"
            style={{
                backgroundColor: 'var(--color-os-panel)',
                borderColor: 'var(--color-os-border)'
            }}
        >
            <div className="flex items-center justify-between px-3 py-1 border-b mb-1" style={{ borderColor: 'var(--color-os-border)' }}>
                <span className="text-xs font-bold text-slate-500 uppercase">Units</span>
                <button onClick={onClose} className="hover:text-white text-slate-500">
                    <X size={12} />
                </button>
            </div>

            {UNITS.map(({ value, label }) => (
                <button
                    key={value}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 flex items-center justify-between"
                    onClick={() => onSelect(value)}
                >
                    <span>{label}</span>
                    {currentUnit === value && <Check size={14} className="text-cyan-400" />}
                </button>
            ))}

            <div className="h-px bg-white/10 my-1" />

            <div className="px-3 py-2">
                <div className="text-xs text-slate-500 mb-1.5">Precision</div>
                <div className="flex gap-1 justify-between">
                    {[0, 1, 2, 3].map(p => (
                        <button
                            key={p}
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs ${precision === p ? 'bg-cyan-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                            onClick={() => setPrecision(p)}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CADToolbar;
