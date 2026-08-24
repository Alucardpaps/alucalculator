/**
 * CAD Toolbar - Professional Design Interface
 * Standardized for the Engineering Workstation environment.
 */

'use client';

import React, { useState } from 'react';
import { useCADCanvasStore, CADTool, Unit, SnapMode } from '@/store/CADCanvasStore';
import { useOSStore } from '@/store/osStore';
import {
    MousePointer2, Minus, Square, Circle, Ruler, Type, 
    Grid3X3, Magnet, ZoomIn, ZoomOut, RotateCcw, Trash2, Download,
    ChevronDown, Move, LucideIcon, Check, Scissors, Maximize, CornerUpRight,
    Slash, Scan, Calculator, Monitor
} from 'lucide-react';

// ============================================
// Tool Definitions
// ============================================

interface ToolDef {
    id: CADTool;
    label: string;
    Icon: LucideIcon;
}

const DRAW_TOOLS: ToolDef[] = [
    { id: 'select', label: 'Select', Icon: MousePointer2 },
    { id: 'pan', label: 'Pan', Icon: Move },
    { id: 'line', label: 'Line', Icon: Minus },
    { id: 'rectangle', label: 'Rectangle', Icon: Square },
    { id: 'circle', label: 'Circle', Icon: Circle },
];

const MODIFY_TOOLS: ToolDef[] = [
    { id: 'trim', label: 'Trim', Icon: Scissors },
    { id: 'extend', label: 'Extend', Icon: Maximize },
    { id: 'fillet', label: 'Fillet', Icon: CornerUpRight },
    { id: 'chamfer', label: 'Chamfer', Icon: Slash },
];

const DIM_TOOLS: ToolDef[] = [
    { id: 'smart-dimension', label: 'Smart Dim', Icon: Scan },
    { id: 'dimension-linear', label: 'Linear', Icon: Ruler },
    { id: 'text', label: 'Text', Icon: Type },
];

const UNITS: { value: Unit; label: string }[] = [
    { value: 'mm', label: 'mm' },
    { value: 'cm', label: 'cm' },
    { value: 'inch', label: 'inch' },
    { value: 'm', label: 'm' },
];

// ============================================
// Main Toolbar Component
// ============================================

export function CADToolbar() {
    const [showUnitMenu, setShowUnitMenu] = useState(false);

    // CAD Store
    const {
        currentTool,
        setCurrentTool,
        unit,
        setUnit,
        snapSettings,
        toggleSnap,
        showGrid,
        toggleGrid,
        zoomIn,
        zoomOut,
        resetView,
        viewport,
        deleteSelected,
        selectedIds,
        exportToDXF
    } = useCADCanvasStore();

    const { openWindow } = useOSStore();

    const handleExportDXF = () => {
        const dxf = exportToDXF();
        const blob = new Blob([dxf], { type: 'application/dxf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ALUCAD_EXPORT_${Date.now()}.dxf`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full bg-[#0a0e12]/95 backdrop-blur-md border-b border-[#1e2833] px-4 py-2">
            <div className="flex items-center gap-2 flex-wrap">
                {/* ═══ Workstation Quick Access ═══ */}
                <div className="flex items-center gap-1 pr-3 border-r border-[#2a3a4a]">
                    <ToolbarButton 
                        icon={Calculator} 
                        label="Calculators" 
                        onClick={() => openWindow('calculator')} 
                    />
                    <ToolbarButton 
                        icon={Monitor} 
                        label="Workstation" 
                        onClick={() => openWindow('analytics-dashboard')} 
                    />
                </div>

                {/* ═══ CAD Draw Tools ═══ */}
                <div className="flex items-center gap-0.5 pr-3 border-r border-[#2a3a4a]">
                    {DRAW_TOOLS.map(tool => (
                        <ToolbarButton
                            key={tool.id}
                            icon={tool.Icon}
                            label={tool.label}
                            isActive={currentTool === tool.id}
                            onClick={() => setCurrentTool(tool.id)}
                            compact
                        />
                    ))}
                </div>

                {/* ═══ CAD Modify Tools ═══ */}
                <div className="flex items-center gap-0.5 pr-3 border-r border-[#2a3a4a]">
                    {MODIFY_TOOLS.map(tool => (
                        <ToolbarButton
                            key={tool.id}
                            icon={tool.Icon}
                            label={tool.label}
                            isActive={currentTool === tool.id}
                            onClick={() => setCurrentTool(tool.id)}
                            compact
                        />
                    ))}
                </div>

                {/* ═══ CAD Dimension Tools ═══ */}
                <div className="flex items-center gap-0.5 pr-3 border-r border-[#2a3a4a]">
                    {DIM_TOOLS.map(tool => (
                        <ToolbarButton
                            key={tool.id}
                            icon={tool.Icon}
                            label={tool.label}
                            isActive={currentTool === tool.id}
                            onClick={() => setCurrentTool(tool.id)}
                            compact
                        />
                    ))}
                </div>

                {/* ═══ Snap & Grid ═══ */}
                <div className="relative flex items-center gap-1 pr-3 border-r border-[#2a3a4a]">
                    <ToolbarButton
                        icon={Magnet}
                        label={`Snap ${snapSettings.enabled ? 'ON' : 'OFF'}`}
                        isActive={snapSettings.enabled}
                        onClick={toggleSnap}
                        compact
                    />
                    <ToolbarButton
                        icon={Grid3X3}
                        label={`Grid ${showGrid ? 'ON' : 'OFF'}`}
                        isActive={showGrid}
                        onClick={toggleGrid}
                        compact
                    />
                </div>

                {/* ═══ Zoom Controls ═══ */}
                <div className="flex items-center gap-0.5 pr-3 border-r border-[#2a3a4a]">
                    <ToolbarButton icon={ZoomOut} label="Zoom Out" onClick={zoomOut} compact />
                    <span className="text-xs text-gray-500 font-mono w-12 text-center">
                        {Math.round(viewport.zoom * 100)}%
                    </span>
                    <ToolbarButton icon={ZoomIn} label="Zoom In" onClick={zoomIn} compact />
                    <ToolbarButton icon={RotateCcw} label="Reset View" onClick={resetView} compact />
                </div>

                {/* ═══ Unit Selector ═══ */}
                <div className="relative">
                    <button
                        onClick={() => setShowUnitMenu(!showUnitMenu)}
                        className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-mono text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        {unit.toUpperCase()}
                        <ChevronDown size={10} />
                    </button>
                    {showUnitMenu && (
                        <div className="absolute top-full right-0 mt-2 w-24 bg-[#0a0e12] border border-[#2a3a4a] rounded-lg shadow-2xl z-[200]">
                            {UNITS.map(({ value, label }) => (
                                <button
                                    key={value}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#1a2332] flex items-center justify-between"
                                    onClick={() => { setUnit(value); setShowUnitMenu(false); }}
                                >
                                    <span className={unit === value ? 'text-cyan-400' : 'text-gray-400'}>{label}</span>
                                    {unit === value && <Check size={12} className="text-cyan-400" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ═══ Actions ═══ */}
                <div className="flex items-center gap-1 ml-auto">
                    <ToolbarButton
                        icon={Trash2}
                        label="Delete"
                        onClick={deleteSelected}
                        disabled={selectedIds.length === 0}
                        danger
                        compact
                    />
                    <ToolbarButton icon={Download} label="Export DXF" onClick={handleExportDXF} compact />
                </div>
            </div>
        </div>
    );
}

// ============================================
// Toolbar Button Component
// ============================================

interface ToolbarButtonProps {
    icon: LucideIcon;
    label: string;
    isActive?: boolean;
    onClick: () => void;
    hasDropdown?: boolean;
    compact?: boolean;
    disabled?: boolean;
    danger?: boolean;
}

function ToolbarButton({ icon: Icon, label, isActive, onClick, hasDropdown, compact, disabled, danger }: ToolbarButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                flex items-center gap-1.5 rounded transition-all
                ${compact ? 'p-1.5' : 'px-2.5 py-1.5'}
                ${isActive
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    : danger
                        ? 'text-red-400 hover:bg-red-500/20 border border-transparent'
                        : 'text-gray-400 hover:bg-white/10 hover:text-white border border-transparent'
                }
                ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={label}
        >
            <Icon size={compact ? 14 : 16} />
            {!compact && <span className="text-xs">{label}</span>}
            {hasDropdown && <ChevronDown size={10} />}
        </button>
    );
}

export default CADToolbar;
