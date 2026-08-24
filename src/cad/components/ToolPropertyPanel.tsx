'use client';

/**
 * AluCAD — SolidWorks-Style Tool Property Panel
 * 
 * Renders a contextual input form when a tool is active.
 * Each tool has its own set of labeled inputs and action buttons.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useCadStore } from '../store/cadStore';
import { commandProcessor } from '../commands/CommandProcessor';
import {
    Check, X, RotateCcw, ChevronDown, ChevronRight,
    Minus, Circle, Square, Hexagon, Spline, Scissors,
    Blend, Maximize, CornerUpRight, Copy, Move, RotateCw,
    FlipHorizontal, Ruler, Cog, Nut, Type, Scan, Pencil,
    Link, LifeBuoy, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════
// PROPERTY SCHEMA DEFINITIONS
// ═══════════════════════════════════════════════════════════════

interface PropertyField {
    key: string;
    label: string;
    type: 'number' | 'text' | 'select' | 'toggle' | 'info';
    default?: any;
    options?: { value: string; label: string }[];
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
}

interface PropertySection {
    title: string;
    icon?: React.ReactNode;
    fields: PropertyField[];
    collapsed?: boolean;
}

interface ToolSchema {
    title: string;
    icon: React.ReactNode;
    sections: PropertySection[];
    actions?: { label: string; action: string; variant?: 'primary' | 'secondary' }[];
}

const TOOL_SCHEMAS: Record<string, ToolSchema> = {
    LINE: {
        title: 'Line',
        icon: <Minus size={16} />,
        sections: [
            {
                title: 'Parameters',
                fields: [
                    { key: 'x1', label: 'X1 (Başlangıç)', type: 'number', unit: 'mm' },
                    { key: 'y1', label: 'Y1 (Başlangıç)', type: 'number', unit: 'mm' },
                    { key: 'x2', label: 'X2 (Bitiş)', type: 'number', unit: 'mm' },
                    { key: 'y2', label: 'Y2 (Bitiş)', type: 'number', unit: 'mm' },
                    { key: 'length', label: 'Uzunluk', type: 'info', unit: 'mm' },
                    { key: 'angle', label: 'Açı', type: 'info', unit: '°' },
                ]
            }
        ],
    },
    PLINE: {
        title: 'Polyline',
        icon: <Pencil size={16} />,
        sections: [
            {
                title: 'Parameters',
                fields: [
                    { key: 'closed', label: 'Closed', type: 'toggle', default: false },
                    { key: 'vertices', label: 'Vertices', type: 'info' },
                ]
            }
        ],
    },
    CIRCLE: {
        title: 'Circle',
        icon: <Circle size={16} />,
        sections: [
            {
                title: 'Parameters',
                fields: [
                    { key: 'cx', label: 'Center X', type: 'number', unit: 'mm' },
                    { key: 'cy', label: 'Center Y', type: 'number', unit: 'mm' },
                    { key: 'radius', label: 'Radius', type: 'number', unit: 'mm', min: 0.1, step: 0.5 },
                    { key: 'diameter', label: 'Diameter', type: 'info', unit: 'mm' },
                ]
            }
        ],
    },
    RECTANGLE: {
        title: 'Rectangle',
        icon: <Square size={16} />,
        sections: [
            {
                title: 'Geometri',
                fields: [
                    { key: 'width', label: 'Genişlik (w)', type: 'number', unit: 'mm', min: 0.1 },
                    { key: 'height', label: 'Yükseklik (h)', type: 'number', unit: 'mm', min: 0.1 },
                    { key: 'rotation', label: 'Dönme Açısı', type: 'number', unit: '°', default: 0 },
                ]
            }
        ],
    },
    POLYGON: {
        title: 'Polygon',
        icon: <Hexagon size={16} />,
        sections: [
            {
                title: 'Poligon Ayarları',
                fields: [
                    { key: 'sides', label: 'Kenar Sayısı (N)', type: 'number', min: 3, max: 100, default: 6 },
                    { key: 'radius', label: 'Yarıçap (R)', type: 'number', unit: 'mm', min: 0.1 },
                    { key: 'rotation', label: 'Dönme Açısı', type: 'number', unit: '°', default: 0 },
                ]
            }
        ],
    },
    ARC: {
        title: 'Arc',
        icon: <Spline size={16} />,
        sections: [
            {
                title: 'Parameters',
                fields: [
                    { key: 'radius', label: 'Radius', type: 'number', unit: 'mm', min: 0.1 },
                    { key: 'startAngle', label: 'Start Angle', type: 'number', unit: '°' },
                    { key: 'endAngle', label: 'End Angle', type: 'number', unit: '°' },
                ]
            }
        ],
    },
    TRIM: {
        title: 'Trim',
        icon: <Scissors size={16} />,
        sections: [
            {
                title: 'Options',
                fields: [
                    { key: 'mode', label: 'Mode', type: 'select', options: [
                        { value: 'standard', label: 'Standard' },
                        { value: 'fence', label: 'Fence Selection' },
                    ]},
                ]
            }
        ],
        actions: [
            { label: 'Select All Edges', action: 'ENTER', variant: 'secondary' },
        ],
    },
    FILLET: {
        title: 'Fillet',
        icon: <Blend size={16} />,
        sections: [
            {
                title: 'Parameters',
                fields: [
                    { key: 'radius', label: 'Radius', type: 'number', unit: 'mm', min: 0, default: 5, step: 0.5 },
                ]
            }
        ],
    },
    CHAMFER: {
        title: 'Chamfer',
        icon: <Scissors size={16} />,
        sections: [
            {
                title: 'Parameters',
                fields: [
                    { key: 'distance1', label: 'Distance 1', type: 'number', unit: 'mm', min: 0, default: 5 },
                    { key: 'distance2', label: 'Distance 2', type: 'number', unit: 'mm', min: 0, default: 5 },
                ]
            }
        ],
    },
    OFFSET: {
        title: 'Offset',
        icon: <CornerUpRight size={16} />,
        sections: [
            {
                title: 'Parameters',
                fields: [
                    { key: 'distance', label: 'Distance', type: 'number', unit: 'mm', min: 0.1, default: 10 },
                ]
            }
        ],
    },
    DIMENSION: {
        title: 'Smart Dimension',
        icon: <Scan size={16} />,
        sections: [
            {
                title: 'Tolerance (GD&T)',
                fields: [
                    { key: 'tolMode', label: 'Tolerance', type: 'select', options: [
                        { value: 'none', label: 'None' },
                        { value: 'bilateral', label: 'Bilateral (±)' },
                        { value: 'asymmetric', label: 'Asymmetric (+/-)' },
                    ], default: 'none' },
                    { key: 'tolUpper', label: 'Upper', type: 'number', unit: 'mm', default: 0, step: 0.001 },
                    { key: 'tolLower', label: 'Lower', type: 'number', unit: 'mm', default: 0, step: 0.001 },
                ]
            }
        ],
    },
    GEAR: {
        title: 'Involute Gear',
        icon: <Cog size={16} />,
        sections: [
            {
                title: 'Dişli Parametreleri',
                fields: [
                    { key: 'module', label: 'Modül (m)', type: 'number', unit: 'mm', min: 0.5, max: 50, default: 2, step: 0.5 },
                    { key: 'teethCount', label: 'Diş Sayısı (z)', type: 'number', min: 6, max: 200, default: 20, step: 1 },
                    { key: 'pressureAngle', label: 'Kavrama Açısı (α)', type: 'number', unit: '°', default: 20 },
                ]
            },
            {
                title: 'Analitik Veriler',
                collapsed: false,
                fields: [
                    { key: 'pitchDia', label: 'Bölüm Dairesi Ø', type: 'info', unit: 'mm' },
                    { key: 'addendumDia', label: 'Diş Üstü Ø', type: 'info', unit: 'mm' },
                    { key: 'dedendumDia', label: 'Diş Dibi Ø', type: 'info', unit: 'mm' },
                ]
            }
        ],
    },
    FASTENER: {
        title: 'Bolt / Nut',
        icon: <Nut size={16} />,
        sections: [
            {
                title: 'Fastener Type',
                fields: [
                    { key: 'type', label: 'Type', type: 'select', options: [
                        { value: 'BOLT', label: 'Bolt (Cıvata)' },
                        { value: 'NUT', label: 'Nut (Somun)' },
                    ], default: 'BOLT' },
                ]
            },
            {
                title: 'Dimensions',
                fields: [
                    { key: 'diameter', label: 'Nominal Ø', type: 'select', options: [
                        { value: '3', label: 'M3' }, { value: '4', label: 'M4' },
                        { value: '5', label: 'M5' }, { value: '6', label: 'M6' },
                        { value: '8', label: 'M8' }, { value: '10', label: 'M10' },
                        { value: '12', label: 'M12' }, { value: '16', label: 'M16' },
                        { value: '20', label: 'M20' }, { value: '24', label: 'M24' },
                    ], default: '10' },
                    { key: 'length', label: 'Length', type: 'number', unit: 'mm', min: 5, default: 40 },
                ]
            }
        ],
    },
    TEXT: {
        title: 'Text Annotation',
        icon: <Type size={16} />,
        sections: [
            {
                title: 'Content',
                fields: [
                    { key: 'content', label: 'Text', type: 'text', default: '' },
                ]
            },
            {
                title: 'Style',
                fields: [
                    { key: 'fontSize', label: 'Size', type: 'number', unit: 'pt', min: 4, max: 200, default: 12 },
                    { key: 'bold', label: 'Bold', type: 'toggle', default: false },
                    { key: 'italic', label: 'Italic', type: 'toggle', default: false },
                    { key: 'justification', label: 'Align', type: 'select', options: [
                        { value: 'left', label: 'Left' },
                        { value: 'center', label: 'Center' },
                        { value: 'right', label: 'Right' },
                    ], default: 'left' },
                    { key: 'rotation', label: 'Rotation', type: 'number', unit: '°', default: 0 },
                ]
            }
        ],
    },
    MOVE: {
        title: 'Move',
        icon: <Move size={16} />,
        sections: [{ title: 'Parameters', fields: [
            { key: 'dx', label: 'Delta X', type: 'number', unit: 'mm' },
            { key: 'dy', label: 'Delta Y', type: 'number', unit: 'mm' },
        ]}],
    },
    COPY: {
        title: 'Copy',
        icon: <Copy size={16} />,
        sections: [{ title: 'Parameters', fields: [
            { key: 'dx', label: 'Delta X', type: 'number', unit: 'mm' },
            { key: 'dy', label: 'Delta Y', type: 'number', unit: 'mm' },
        ]}],
    },
    ROTATE: {
        title: 'Rotate',
        icon: <RotateCw size={16} />,
        sections: [{ title: 'Parameters', fields: [
            { key: 'angle', label: 'Angle', type: 'number', unit: '°', default: 0, step: 5 },
        ]}],
    },
    MIRROR: {
        title: 'Mirror',
        icon: <FlipHorizontal size={16} />,
        sections: [{ title: 'Options', fields: [
            { key: 'deleteSource', label: 'Delete Source', type: 'toggle', default: false },
        ]}],
    },
    EXTEND: {
        title: 'Extend',
        icon: <Maximize size={16} />,
        sections: [{ title: 'Options', fields: [
            { key: 'mode', label: 'Mode', type: 'select', options: [
                { value: 'boundary', label: 'To Boundary' },
            ]},
        ]}],
    },
    MATING_GEAR: {
        title: 'Mating Gear',
        icon: <Cog size={16} />,
        sections: [
            {
                title: 'Target Gear',
                fields: [
                    { key: 'targetTeeth', label: 'Teeth (z2)', type: 'number', min: 6, max: 200, default: 30 },
                ]
            }
        ],
    },
    BELT_PULLEY: {
        title: 'Belt & Pulley',
        icon: <Link size={16} />,
        sections: [
            {
                title: 'Pulley Sizes',
                fields: [
                    { key: 'radius1', label: 'Radius 1', type: 'number', unit: 'mm', min: 1, default: 50 },
                    { key: 'radius2', label: 'Radius 2', type: 'number', unit: 'mm', min: 1, default: 30 },
                ]
            }
        ],
    },
    PLANETARY_GEAR: {
        title: 'Planetary Gearbox',
        icon: <LifeBuoy size={16} />,
        sections: [
            {
                title: 'Parameters',
                fields: [
                    { key: 'module', label: 'Module (m)', type: 'number', unit: 'mm', min: 0.5, default: 2 },
                    { key: 'sunTeeth', label: 'Sun Teeth (zs)', type: 'number', min: 6, default: 20 },
                    { key: 'planetTeeth', label: 'Planet Teeth (zp)', type: 'number', min: 6, default: 20 },
                ]
            }
        ],
    },
    PLOT: {
        title: 'Çizim ve Yazdırma (Plot)',
        icon: <Printer size={16} />,
        sections: [
            {
                title: 'Kağıt ve Yerleşim',
                fields: [
                    { key: 'paperSize', label: 'Sayfa Boyutu', type: 'select', options: [
                        { value: 'A4', label: 'A4 (210x297)' },
                        { value: 'A3', label: 'A3 (297x420)' },
                        { value: 'A2', label: 'A2 (420x594)' },
                        { value: 'Letter', label: 'Letter (ANSI A)' },
                    ], default: 'A4' },
                    { key: 'orientation', label: 'Oryantasyon', type: 'select', options: [
                        { value: 'LANDSCAPE', label: 'Yatay (Landscape)' },
                        { value: 'PORTRAIT', label: 'Dikey (Portrait)' },
                    ], default: 'LANDSCAPE' },
                    { key: 'scale', label: 'Ölçek', type: 'select', options: [
                        { value: 'FIT', label: 'Sığdır (Fit to Paper)' },
                        { value: '1:1', label: 'Gerçek Ölçek (1:1)' },
                        { value: '1:2', label: 'Yarım Ölçek (1:2)' },
                        { value: '1:5', label: 'Mühendislik (1:5)' },
                        { value: '1:10', label: 'Plan Ölçeği (1:10)' },
                    ], default: 'FIT' },
                ]
            },
            {
                title: 'Antet Bilgileri',
                fields: [
                    { key: 'showTitleBlock', label: 'Teknik Antet Ekle', type: 'toggle', default: true },
                    { key: 'partName', label: 'Parça İsmi', type: 'text', default: 'Yeni Parça' },
                    { key: 'designer', label: 'Tasarımcı', type: 'text', default: 'AluCAD User' },
                    { key: 'approver', label: 'Onaylayan', type: 'text', default: '' },
                    { key: 'company', label: 'Firma Adı', type: 'text', default: 'AluCAD Engineering' },
                ]
            }
        ],
    },
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ToolPropertyPanel() {
    const { activeCommand, commandPrompt } = useCadStore();
    const [values, setValues] = useState<Record<string, any>>({});
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

    const schema = activeCommand ? TOOL_SCHEMAS[activeCommand] : null;

    // Initialize defaults when tool changes
    useEffect(() => {
        if (!schema) { setValues({}); return; }
        const defaults: Record<string, any> = {};
        for (const section of schema.sections) {
            for (const field of section.fields) {
                if (field.default !== undefined) defaults[field.key] = field.default;
            }
        }
        setValues(defaults);
        // Initialize collapsed sections
        const collapsed: Record<string, boolean> = {};
        schema.sections.forEach((s, i) => { if (s.collapsed) collapsed[`${i}`] = true; });
        setCollapsedSections(collapsed);
    }, [activeCommand]);

    // Compute gear calculated values
    useEffect(() => {
        if (activeCommand === 'GEAR') {
            const m = values.module || 2;
            const z = values.teethCount || 20;
            setValues(prev => ({
                ...prev,
                pitchDia: (m * z).toFixed(1),
                addendumDia: (m * (z + 2)).toFixed(1),
                dedendumDia: (m * (z - 2.5)).toFixed(1),
            }));
        }
    }, [values.module, values.teethCount, activeCommand]);

    const handleValueChange = useCallback((key: string, value: any) => {
        setValues(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleApply = useCallback(() => {
        if (!activeCommand) return;
        const cmd = commandProcessor.getActiveCommand();
        if (!cmd) return;

        if (activeCommand === 'GEAR') {
            if ('setParams' in cmd && typeof (cmd as any).setParams === 'function') {
                (cmd as any).setParams({
                    module: Number(values.module) || 2,
                    teethCount: Number(values.teethCount) || 20,
                    pressureAngle: Number(values.pressureAngle) || 20,
                });
            }
        } else if (activeCommand === 'MATING_GEAR') {
            if ('setParams' in cmd && typeof (cmd as any).setParams === 'function') {
                (cmd as any).setParams({
                    targetTeeth: Number(values.targetTeeth) || 30,
                });
            }
        } else if (activeCommand === 'BELT_PULLEY') {
            if ('setParams' in cmd && typeof (cmd as any).setParams === 'function') {
                (cmd as any).setParams({
                    radius1: Number(values.radius1) || 50,
                    radius2: Number(values.radius2) || 30,
                });
            }
        } else if (activeCommand === 'PLANETARY_GEAR') {
            if ('setParams' in cmd && typeof (cmd as any).setParams === 'function') {
                (cmd as any).setParams({
                    module: Number(values.module) || 2,
                    sunTeeth: Number(values.sunTeeth) || 20,
                    planetTeeth: Number(values.planetTeeth) || 20,
                });
            }
        } else if (activeCommand === 'POLYGON' || activeCommand === 'HEXAGON') {
            if ('setParams' in cmd && typeof (cmd as any).setParams === 'function') {
                (cmd as any).setParams({
                    sides: Number(values.sides) || 6,
                    radius: Number(values.radius) || 20,
                    rotation: Number(values.rotation) || 0,
                });
            }
        } else if (activeCommand === 'FASTENER') {
            if ('setParams' in cmd && typeof (cmd as any).setParams === 'function') {
                (cmd as any).setParams({
                    type: (values.fastenerType || 'BOLT') as any,
                    diameter: Number(values.diameter) || 10,
                    length: Number(values.length) || 40,
                });
            } else {
                cmd.onValueInput(values.fastenerType || 'BOLT');
                cmd.onValueInput(String(values.diameter || 10));
                if ((values.fastenerType || 'BOLT') !== 'NUT') {
                    cmd.onValueInput(String(values.length || 40));
                }
            }
        } else if (activeCommand === 'FILLET') {
            cmd.onValueInput(String(values.radius || 5));
        } else if (activeCommand === 'OFFSET') {
            cmd.onValueInput(String(values.distance || 10));
        } else if (activeCommand === 'TEXT') {
            const prefix = values.bold && values.italic ? '/bi ' : values.bold ? '/b ' : values.italic ? '/i ' : '';
            cmd.onValueInput(prefix + (values.content || 'Text'));
            cmd.onValueInput(String(values.fontSize || 12));
        } else if (activeCommand === 'PLOT') {
            if ('onParamChange' in cmd && typeof (cmd as any).onParamChange === 'function') {
                (cmd as any).onParamChange(values);
            }
        }
    }, [activeCommand, values]);

    const handleCancel = useCallback(() => {
        commandProcessor.setActiveCommand(null);
    }, []);

    const handleAction = useCallback((action: string) => {
        if (action === 'ENTER') {
            const cmd = commandProcessor.getActiveCommand();
            if (cmd) cmd.onKeyInput('Enter');
        }
    }, []);

    const toggleSection = useCallback((idx: string) => {
        setCollapsedSections(prev => ({ ...prev, [idx]: !prev[idx] }));
    }, []);

    if (!schema || !activeCommand) return null;

    return (
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-[68px] top-6 z-20 pointer-events-auto w-[220px]"
        >
            <div className="bg-[#0a0e14]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-cyan-900/30 to-transparent border-b border-white/10">
                    <div className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        {schema.icon}
                    </div>
                    <span className="text-[11px] font-semibold text-white tracking-wide uppercase">{schema.title}</span>
                    <button onClick={handleCancel} className="ml-auto text-slate-500 hover:text-red-400 transition-colors">
                        <X size={14} />
                    </button>
                </div>

                {/* Status */}
                {commandPrompt && (
                    <div className="px-3 py-1.5 bg-cyan-900/10 border-b border-white/5">
                        <p className="text-[9px] font-mono text-cyan-400/80 leading-relaxed">{commandPrompt}</p>
                    </div>
                )}

                {/* Sections */}
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {schema.sections.map((section, sIdx) => {
                        const isCollapsed = collapsedSections[`${sIdx}`];
                        return (
                            <div key={sIdx} className="border-b border-white/5 last:border-0">
                                <button
                                    onClick={() => toggleSection(`${sIdx}`)}
                                    className="w-full flex items-center gap-1.5 px-3 py-2 text-[9px] font-mono uppercase tracking-[0.15em] text-slate-400 hover:text-slate-200 transition-colors bg-white/[0.02] hover:bg-white/[0.04]"
                                >
                                    {isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                                    {section.title}
                                </button>
                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-3 pb-2.5 space-y-1.5">
                                                {section.fields.map(field => (
                                                    <FieldRenderer
                                                        key={field.key}
                                                        field={field}
                                                        value={values[field.key]}
                                                        onChange={(v) => handleValueChange(field.key, v)}
                                                    />
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="px-3 py-2 border-t border-white/10 bg-black/30 space-y-1.5">
                    {schema.actions?.map((act, i) => (
                        <button
                            key={i}
                            onClick={() => handleAction(act.action)}
                            className="w-full py-1.5 text-[9px] font-mono uppercase tracking-widest rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            {act.label}
                        </button>
                    ))}
                    <div className="flex gap-1.5">
                        <button
                            onClick={handleApply}
                            className="flex-1 py-2 rounded-lg bg-gradient-to-b from-cyan-600/40 to-cyan-700/20 border border-cyan-500/30 text-[10px] font-mono uppercase tracking-widest text-cyan-300 hover:text-white hover:from-cyan-600/60 transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.1)]"
                        >
                            <Check size={12} /> Apply
                        </button>
                        <button
                            onClick={handleCancel}
                            className="px-3 py-2 rounded-lg border border-white/10 text-[10px] font-mono uppercase tracking-widest text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all"
                        >
                            <X size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════
// FIELD RENDERER
// ═══════════════════════════════════════════════════════════════

function FieldRenderer({ field, value, onChange }: {
    field: PropertyField;
    value: any;
    onChange: (v: any) => void;
}) {
    switch (field.type) {
        case 'number':
            return (
                <div className="flex items-center justify-between gap-2">
                    <label className="text-[9px] font-mono text-slate-500 uppercase tracking-wider whitespace-nowrap">{field.label}</label>
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            value={value ?? ''}
                            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                            min={field.min}
                            max={field.max}
                            step={field.step || 1}
                            className="w-[70px] px-2 py-1 text-[10px] font-mono text-right bg-black/40 border border-white/10 rounded-md text-cyan-300 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
                        />
                        {field.unit && <span className="text-[8px] text-slate-600 font-mono w-5">{field.unit}</span>}
                    </div>
                </div>
            );

        case 'text':
            return (
                <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">{field.label}</label>
                    <input
                        type="text"
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Enter text..."
                        className="w-full px-2 py-1.5 text-[10px] font-mono bg-black/40 border border-white/10 rounded-md text-white focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-slate-700"
                    />
                </div>
            );

        case 'select':
            return (
                <div className="flex items-center justify-between gap-2">
                    <label className="text-[9px] font-mono text-slate-500 uppercase tracking-wider whitespace-nowrap">{field.label}</label>
                    <select
                        value={value ?? field.default ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-[90px] px-1.5 py-1 text-[10px] font-mono bg-black/40 border border-white/10 rounded-md text-cyan-300 focus:border-cyan-500/50 focus:outline-none appearance-none cursor-pointer"
                    >
                        {field.options?.map(o => (
                            <option key={o.value} value={o.value} className="bg-[#0a0e14] text-white">{o.label}</option>
                        ))}
                    </select>
                </div>
            );

        case 'toggle':
            return (
                <div className="flex items-center justify-between">
                    <label className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">{field.label}</label>
                    <button
                        onClick={() => onChange(!value)}
                        className={`w-8 h-4 rounded-full transition-all relative ${value ? 'bg-cyan-500/40 border-cyan-500/60' : 'bg-white/5 border-white/10'} border`}
                    >
                        <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all ${value ? 'left-[14px] bg-cyan-400 shadow-[0_0_6px_#00e5ff]' : 'left-0.5 bg-slate-500'}`} />
                    </button>
                </div>
            );

        case 'info':
            return (
                <div className="flex items-center justify-between">
                    <label className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">{field.label}</label>
                    <span className="text-[10px] font-mono text-slate-400">
                        {value ?? '—'}{field.unit ? ` ${field.unit}` : ''}
                    </span>
                </div>
            );

        default:
            return null;
    }
}
