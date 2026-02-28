'use client';

/**
 * 🧠 AluCalculator OS - Visual Node Palette
 * 
 * Replaces the legacy dropdown toolbar with a professional, persistent sidebar.
 * Features:
 * - Categories (Input, Mechanical, Validation, Tools)
 * - Draggable Nodes (ReactFlow D&D)
 * - Search / Command Finder
 * - Strict Engineering Aesthetic
 */

import React, { useState, useMemo } from 'react';
import {
    Search,
    Settings,
    Database,
    Triangle,
    Box,
    Circle,
    Scissors,
    Book,
    Grid3X3,
    Activity,
    FileText,
    Network,
    Cpu,
    Zap,
    Wind,
    Layers,
    ChevronDown,
    ChevronRight,
    GripVertical,
    Eye
} from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';
import { useI18nStore } from '@/store/i18nStore';

// Strict Engineering Categories
const CATEGORIES = [
    { id: 'input', label: 'Inputs & Constants', icon: Database, color: '#f59e0b' },
    { id: 'mechanical', label: 'Mechanical Core', icon: Settings, color: '#00e5ff' },
    { id: 'chemical', label: 'Chemistry / Thermo', icon: Zap, color: '#fcd34d' },
    { id: 'validation', label: 'Validation / ISO', icon: Activity, color: '#ef4444' },
    { id: 'visual', label: 'Visualizers', icon: Eye, color: '#a855f7' },
    { id: 'export', label: 'Export / Report', icon: FileText, color: '#10b981' },
];

const NODE_CATALOG = [
    // INPUTS
    { id: 'input-constant', type: 'input', label: 'Constant Value', icon: Box, category: 'input' },
    { id: 'input-material', type: 'input', label: 'Material Logic', icon: Layers, category: 'input' },

    // MECHANICAL
    {
        id: 'mech-spring-design',
        type: 'calculator',
        label: 'Spring Design',
        icon: Settings,
        category: 'mechanical',
        payload: { schemaId: 'spring-design' }
    },
    {
        id: 'mech-castigliano',
        type: 'calculator',
        label: 'Castigliano Strain Energy',
        icon: Settings,
        category: 'mechanical',
        payload: { schemaId: 'castigliano-energy' }
    },
    {
        id: 'mech-area-moment',
        type: 'calculator',
        label: 'Moment of Inertia',
        icon: Settings,
        category: 'mechanical',
        payload: { schemaId: 'area-moment-inertia' }
    },
    {
        id: 'mech-torsion-noncirc',
        type: 'calculator',
        label: 'Non-Circular Torsion',
        icon: Settings,
        category: 'mechanical',
        payload: { schemaId: 'torsion-non-circular' }
    },
    {
        id: 'mech-pressure-vessel',
        type: 'calculator',
        label: 'Pressure Vessel',
        icon: Settings,
        category: 'mechanical',
        payload: { schemaId: 'pressure-vessel' }
    },
    {
        id: 'mech-mohr-3d',
        type: 'calculator',
        label: '3D Mohr\'s Circle',
        icon: Settings,
        category: 'mechanical',
        payload: { schemaId: 'mohr-circle-3d' }
    },
    {
        id: 'mech-mohr-2d',
        type: 'calculator',
        label: '2D Mohr\'s Circle',
        icon: Settings,
        category: 'mechanical',
        payload: { schemaId: 'mohrs-circle' }
    },
    {
        id: 'mech-hooke-3d',
        type: 'calculator',
        label: '3D Hooke\'s Law',
        icon: Settings,
        category: 'mechanical',
        payload: { schemaId: 'hookes-law-3d' }
    },
    {
        id: 'mech-sfd-bmd',
        type: 'calculator',
        label: 'SFD / BMD Academic',
        icon: Network,
        category: 'mechanical',
        payload: { schemaId: 'sfd-bmd-academic' }
    },
    {
        id: 'mech-bearing-life',
        type: 'calculator',
        label: 'Bearing Life (L10h)',
        icon: Settings,
        category: 'mechanical',
        payload: { schemaId: 'bearings' } // Wait, the ID in schema was 'bearings'
    },
    {
        id: 'mech-shaft-design',
        type: 'calculator',
        label: 'Shaft Design',
        icon: Settings,
        category: 'mechanical',
        payload: { schemaId: 'shaft-design' }
    },
    {
        id: 'mech-belt-drive',
        type: 'calculator',
        label: 'Belt Drive Analysis',
        icon: Activity,
        category: 'mechanical',
        payload: { schemaId: 'belt-drive' }
    },
    {
        id: 'mech-brakes-clutches',
        type: 'calculator',
        label: 'Brakes & Clutches',
        icon: Circle,
        category: 'mechanical',
        payload: { schemaId: 'brakes-clutches' }
    },

    // CHEMICAL
    {
        id: 'chem-element',
        type: 'calculator',
        label: 'Periodic Element',
        icon: Zap,
        category: 'chemical',
        payload: { schemaId: 'chemistry-element' }
    },
    {
        id: 'chem-gas-laws',
        type: 'calculator',
        label: 'Ideal & Real Gas (VDW)',
        icon: Zap,
        category: 'chemical',
        payload: { schemaId: 'gas-laws' }
    },
    {
        id: 'chem-thermo',
        type: 'calculator',
        label: 'Thermodynamics',
        icon: Zap,
        category: 'chemical',
        payload: { schemaId: 'thermodynamics' }
    },
    {
        id: 'chem-stoich',
        type: 'calculator',
        label: 'Stoichiometry & Conc.',
        icon: Activity,
        category: 'chemical',
        payload: { schemaId: 'stoichiometry' }
    },
    {
        id: 'chem-heat-transfer',
        type: 'calculator',
        label: 'Heat Transfer (Conduction/Convection)',
        icon: Zap,
        category: 'chemical',
        payload: { schemaId: 'heat-transfer' }
    },

    { id: 'fab-sheet', type: 'calculator', label: 'Sheet Metal Bending', icon: Layers, category: 'mechanical', payload: { schemaId: 'sheet-metal' } },
    { id: 'fab-welding-fillet', type: 'calculator', label: 'Welding (Fillet)', icon: Activity, category: 'mechanical', payload: { schemaId: 'welding-fillet' } },
    { id: 'fab-welding-heat', type: 'calculator', label: 'Welding (Heat)', icon: Activity, category: 'mechanical', payload: { schemaId: 'welding-heat' } },
    { id: 'fab-machining-milling', type: 'calculator', label: 'Machining (Milling)', icon: Settings, category: 'mechanical', payload: { schemaId: 'machining-milling' } },
    { id: 'fab-machining-grinding', type: 'calculator', label: 'Machining (Grinding)', icon: Settings, category: 'mechanical', payload: { schemaId: 'machining-grinding' } },

    // CIVIL / STRUCTURAL
    { id: 'civ-beam', type: 'calculator', label: 'Beam Deflection', icon: Network, category: 'mechanical', payload: { schemaId: 'beam-deflection' } },
    { id: 'civ-column', type: 'calculator', label: 'Column Buckling', icon: Box, category: 'mechanical', payload: { schemaId: 'column-buckling' } },

    // FLUID
    { id: 'fluid-flow', type: 'calculator', label: 'Fluid Flow (Pressure)', icon: Wind, category: 'mechanical', payload: { schemaId: 'fluid-flow' } },
    { id: 'fluid-pump', type: 'calculator', label: 'Pump Sizing', icon: Wind, category: 'mechanical', payload: { schemaId: 'pumps' } },
    { id: 'fluid-hydraulic', type: 'calculator', label: 'Hydraulic Cylinder', icon: Circle, category: 'mechanical', payload: { schemaId: 'hydraulic-cylinder' } },
    { id: 'fluid-aerodynamics', type: 'calculator', label: 'Aerodynamics (Drag Force)', icon: Wind, category: 'mechanical', payload: { schemaId: 'aerodynamics' } },

    // ELECTRICAL
    { id: 'elec-ohm', type: 'calculator', label: 'Ohm\'s Law', icon: Zap, category: 'mechanical', payload: { schemaId: 'ohms-law' } },
    { id: 'elec-voltage', type: 'calculator', label: 'Voltage Drop', icon: Zap, category: 'mechanical', payload: { schemaId: 'voltage-drop' } },

    // UTILS / MATH
    { id: 'util-unit', type: 'calculator', label: 'Unit Converter', icon: GripVertical, category: 'input', payload: { schemaId: 'unit-converter' } },
    { id: 'util-profile', type: 'calculator', label: 'Profile Weight', icon: Box, category: 'mechanical', payload: { schemaId: 'profile-weight' } },
    { id: 'util-thread', type: 'calculator', label: 'Thread Geometry', icon: Settings, category: 'mechanical', payload: { schemaId: 'thread-geometry' } },
    { id: 'util-vat', type: 'calculator', label: 'VAT Calculator', icon: Activity, category: 'input', payload: { schemaId: 'vat-calculator' } }, // Using generic icon or import dollar
    { id: 'math-golden-ratio', type: 'calculator', label: 'Golden Ratio', icon: Grid3X3, category: 'mechanical', payload: { schemaId: 'golden-ratio' } },

    // VISUAL TOOLS
    { id: 'util-nesting', type: 'visualizer', label: '2D Nesting', icon: Grid3X3, category: 'visual', payload: { vizType: 'nesting' } },
    { id: 'util-3dbox', type: 'visualizer', label: '3D Box Builder', icon: Box, category: 'visual', payload: { vizType: '3d-box' } },
    { id: 'util-note', type: 'note', label: 'Eng. Note', icon: Book, category: 'visual' },
];

export const NodePalette = () => {
    const { t } = useI18nStore();
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        input: true,
        mechanical: true,
        validation: true,
        visual: false
    });

    const toggle = (cat: string) => setExpanded(p => ({ ...p, [cat]: !p[cat] }));

    const onDragStart = (event: React.DragEvent, nodeType: string, payload: any) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/payload', JSON.stringify(payload));
        event.dataTransfer.effectAllowed = 'move';
    };

    const filteredNodes = useMemo(() => {
        if (!search) return NODE_CATALOG;
        return NODE_CATALOG.filter(n => n.label.toLowerCase().includes(search.toLowerCase()));
    }, [search]);

    const groupedNodes = useMemo(() => {
        const groups: Record<string, typeof NODE_CATALOG> = {};
        CATEGORIES.forEach(c => groups[c.id] = []);
        filteredNodes.forEach(n => {
            if (groups[n.category]) groups[n.category].push(n);
        });
        return groups;
    }, [filteredNodes]);

    return (
        <aside className="w-64 bg-[#05090e]/80 backdrop-blur-xl border-r border-cyan-900/30 flex flex-col h-full select-none z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
            {/* Header */}
            <div className="p-4 border-b border-cyan-900/30 bg-black/20">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_10px_rgba(0,229,255,0.1)]">
                        <Cpu size={14} className="text-cyan-400" />
                    </div>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-50">COMPONENT LIB</span>
                </div>

                {/* Search */}
                <div className="relative group">
                    <Search size={14} className="absolute left-3 top-2.5 text-cyan-500/50 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                        type="text"
                        placeholder={t.palette?.searchPlaceholder || "Search nodes..."}
                        className="w-full bg-[#0a0f16]/60 backdrop-blur-sm border border-cyan-900/30 rounded-md text-[11px] py-2 pl-9 pr-3 text-cyan-50 focus:border-cyan-500/50 focus:bg-[#0a0f16]/90 outline-none placeholder:text-slate-600 transition-all shadow-inner"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-cyan-900/50 hover:scrollbar-thumb-cyan-700/50">
                {CATEGORIES.map(cat => {
                    const nodes = groupedNodes[cat.id];
                    if (nodes.length === 0) return null;

                    const isOpen = expanded[cat.id] || !!search;

                    return (
                        <div key={cat.id} className="mb-4">
                            {/* Category Header */}
                            <button
                                onClick={() => toggle(cat.id)}
                                className="w-full flex items-center gap-2 px-2 py-2 text-[10px] font-bold text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-[0.15em]"
                            >
                                <span className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}>
                                    <ChevronRight size={12} />
                                </span>
                                {(t.palette.categories as any)[cat.id] || cat.label}
                            </button>

                            {/* Node Items */}
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[3000px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                <div className="ml-3 pl-3 border-l border-cyan-900/20 space-y-1.5 antialiased">
                                    {nodes.map(node => (
                                        <div
                                            key={node.id}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, node.type, node.payload || {})}
                                            onClick={() => {
                                                const {
                                                    addEngineeringNode,
                                                    addCalculatorNode,
                                                    addStandardCalculatorNode,
                                                    addVisualizerNode,
                                                    addMediaNode,
                                                    addNoteNode,
                                                    addNotebookNode
                                                } = useFlowStore.getState();

                                                const position = { x: 500 + Math.random() * 50, y: 300 + Math.random() * 50 };

                                                if (node.type === 'engineering' && node.payload?.schemaId) {
                                                    addEngineeringNode(node.payload.schemaId, position);
                                                } else if (node.type === 'calculator' && node.payload?.schemaId) {
                                                    addCalculatorNode(node.payload.schemaId, position);
                                                } else if (node.type === 'standard-calculator') {
                                                    addStandardCalculatorNode(position);
                                                } else if (node.type === 'visualizer' && node.payload?.vizType) {
                                                    addVisualizerNode(node.payload.vizType as any, position);
                                                } else if (node.type === 'note') {
                                                    addNoteNode('New Note', position);
                                                } else if (node.type === 'notebook') {
                                                    addNotebookNode('', position);
                                                }
                                            }}
                                            className="group flex items-center gap-3 p-2.5 rounded-md bg-[#0a0f16]/40 backdrop-blur-sm border border-transparent hover:border-cyan-500/30 hover:bg-[#0a0f16]/80 hover:shadow-[0_0_15px_rgba(0,229,255,0.05)] cursor-pointer active:scale-[0.98] transition-all duration-300"
                                        >
                                            <div className="p-1.5 rounded bg-black/30 border border-white/5 text-slate-500 group-hover:text-cyan-400 group-hover:border-cyan-500/20 transition-all duration-300">
                                                <node.icon size={12} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[11px] font-medium text-slate-300 group-hover:text-cyan-50 truncate transition-colors">
                                                    {node.payload?.schemaId ? (t.modules[node.payload.schemaId]?.title || node.label) : node.label}
                                                </div>
                                                <div className="text-[9px] text-slate-600 font-mono tracking-wider truncate">{node.id}</div>
                                            </div>
                                            <GripVertical size={14} className="text-cyan-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-cyan-900/30 bg-black/20 text-[9px] text-cyan-700/50 font-mono tracking-widest text-center">
                ISO 9001 COMPLIANT • OS V5.0
            </div>
        </aside>
    );
};
