'use client';

/**
 * Feature Tree — CAD left-panel hierarchy
 *
 * Mirrors the SolidWorks / Fusion 360 model tree:
 *   Sketches → Bodies → Constraints → Parameters
 */

import React, { useState } from 'react';
import {
    ChevronRight, ChevronDown, Box, PenTool, Link2,
    Eye, EyeOff, Lock, Unlock, Plus, Trash2, Layers
} from 'lucide-react';
import { useCadStore, useDOFCount } from '../store/cadStore';
import { useI18nStore } from '@/store/i18nStore';

// ────────────────────────────────────────────────────
// TREE NODE
// ────────────────────────────────────────────────────

interface TreeNodeProps {
    label: string;
    icon: React.ReactNode;
    children?: React.ReactNode;
    isActive?: boolean;
    badge?: string | number;
    onClick?: () => void;
    actions?: React.ReactNode;
    defaultExpanded?: boolean;
}

function TreeNode({ label, icon, children, isActive, badge, onClick, actions, defaultExpanded = false }: TreeNodeProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const hasChildren = React.Children.count(children) > 0;

    return (
        <div className="select-none group">
            <div
                className={`flex items-center gap-1.5 px-2 py-1 text-xs cursor-pointer rounded
          transition-all duration-150
          ${isActive ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                onClick={() => {
                    if (hasChildren) setExpanded(!expanded);
                    onClick?.();
                }}
            >
                {/* Expand/collapse chevron */}
                <span className="w-3 shrink-0">
                    {hasChildren && (expanded
                        ? <ChevronDown size={12} />
                        : <ChevronRight size={12} />
                    )}
                </span>

                {/* Icon */}
                <span className="shrink-0 opacity-70">{icon}</span>

                {/* Label */}
                <span className="flex-1 truncate font-medium">{label}</span>

                {/* Badge */}
                {badge !== undefined && (
                    <span className="text-[10px] bg-white/10 rounded px-1 tabular-nums">{badge}</span>
                )}

                {/* Actions */}
                {actions && (
                    <span className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">{actions}</span>
                )}
            </div>

            {/* Children */}
            {expanded && hasChildren && (
                <div className="ml-3 border-l border-white/5 pl-1">{children}</div>
            )}
        </div>
    );
}

// ────────────────────────────────────────────────────
// FEATURE TREE (MAIN EXPORT)
// ────────────────────────────────────────────────────

export function FeatureTree() {
    const entities = useCadStore(s => s.entities);
    const constraints = useCadStore(s => s.constraints);
    const bodies = useCadStore(s => s.bodies);
    const activeBodyId = useCadStore(s => s.activeBodyId);
    const setActiveBody = useCadStore(s => s.setActiveBody);
    const addBody = useCadStore(s => s.addBody);
    const selectEntity = useCadStore(s => s.selectEntity);
    const { t } = useI18nStore();
    const dof = useDOFCount();

    // Categorise entities
    const sketches = entities.filter(e => e.geometry.type === 'LINE' || e.geometry.type === 'CIRCLE' || e.geometry.type === 'ARC' || e.geometry.type === 'POLYLINE');
    const points = entities.filter(e => e.geometry.type === 'POINT');
    const dimensions = entities.filter(e => e.geometry.type === 'DIMENSION');

    return (
        <div className="h-full flex flex-col bg-[#0d1117] border-r border-white/10 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 shrink-0">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">{t.featureTree || "Feature Tree"}</span>
                <button
                    onClick={() => addBody(`Body ${bodies.length + 1}`)}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors"
                    title={t.addBody || "Add Body"}
                >
                    <Plus size={14} />
                </button>
            </div>

            {/* Tree Content */}
            <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">

                {/* SKETCHES */}
                <TreeNode
                    label={t.sketches || "Sketches"}
                    icon={<PenTool size={13} />}
                    badge={sketches.length}
                    defaultExpanded={true}
                >
                    {sketches.map(e => (
                        <TreeNode
                            key={e.id}
                            label={`${e.geometry.type} — ${e.id.slice(0, 6)}`}
                            icon={<div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />}
                            onClick={() => selectEntity(e.id)}
                        />
                    ))}
                </TreeNode>

                {/* BODIES */}
                <TreeNode
                    label={t.bodies || "Bodies"}
                    icon={<Box size={13} />}
                    badge={bodies.length}
                    defaultExpanded={true}
                >
                    {bodies.length === 0 ? (
                        <div className="px-6 py-2 text-[10px] text-slate-500 italic">{t.noBodies || "No bodies yet"}</div>
                    ) : (
                        bodies.map(b => (
                            <TreeNode
                                key={b.id}
                                label={b.name}
                                icon={b.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                                isActive={b.id === activeBodyId}
                                onClick={() => setActiveBody(b.id)}
                                badge={`${b.features.length}F`}
                            >
                                {b.features.map(f => (
                                    <TreeNode
                                        key={f.id}
                                        label={`${f.name} (${f.type})`}
                                        icon={<Layers size={11} />}
                                    />
                                ))}
                            </TreeNode>
                        ))
                    )}
                </TreeNode>

                {/* CONSTRAINTS */}
                <TreeNode
                    label={t.constraints || "Constraints"}
                    icon={<Link2 size={13} />}
                    badge={constraints.length}
                    defaultExpanded={false}
                >
                    {constraints.map(c => (
                        <TreeNode
                            key={c.id}
                            label={`${c.type} (${c.entityIds.length} ent)`}
                            icon={<div className={`w-2 h-2 rounded-full ${c.active ? 'bg-green-400' : 'bg-red-400'}`} />}
                        />
                    ))}
                </TreeNode>

                {/* PARAMETERS (Dimensions) */}
                <TreeNode
                    label={t.parameters || "Parameters"}
                    icon={<span className="text-[11px] font-mono">∅</span>}
                    badge={dimensions.length}
                    defaultExpanded={false}
                >
                    {dimensions.map(d => (
                        <TreeNode
                            key={d.id}
                            label={d.geometry.type === 'DIMENSION' ? `${(d.geometry as any).value?.toFixed(2) ?? '—'} mm` : d.id.slice(0, 8)}
                            icon={<span className="text-[10px]">📏</span>}
                            onClick={() => selectEntity(d.id)}
                        />
                    ))}
                </TreeNode>
            </div>

            {/* Footer — DOF summary */}
            <div className={`shrink-0 px-3 py-1.5 border-t border-white/10 text-[10px] font-mono
        ${dof === 0 ? 'text-green-400' : dof < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                {t.dofLabel || "DOF"}: {dof} — {dof === 0 ? (t.fullyConstrained || 'Fully Constrained') : dof < 0 ? (t.overConstrained || 'Over Constrained') : (t.underConstrained || 'Under Constrained')}
            </div>
        </div>
    );
}

export default FeatureTree;
