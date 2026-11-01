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
    Eye, EyeOff, Lock, Unlock, Plus, Trash2, Layers, Cog, FileText
} from 'lucide-react';
import { useCadStore, useDOFCount } from '../store/cadStore';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

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
    const removeEntity = useCadStore(s => s.removeEntity);
    const { t, language } = useI18nStore();
    const dof = useDOFCount();

    // Categorise all entities
    const sketches = entities.filter(e => ['LINE', 'CIRCLE', 'ARC', 'POLYLINE', 'RECTANGLE', 'HEXAGON', 'ELLIPSE', 'SPLINE', 'HATCH'].includes(e.geometry.type));
    const mechanical = entities.filter(e => ['GEAR', 'FASTENER', 'BELT_PULLEY', 'PLANETARY_GEAR', 'SPROCKET'].includes(e.geometry.type));
    const annotations = entities.filter(e => ['TEXT', 'LEADER', 'DIMENSION'].includes(e.geometry.type));
    const points = entities.filter(e => e.geometry.type === 'POINT');

    const getEntityLabel = (e: any) => {
        const g = e.geometry;
        switch (g.type) {
            case 'LINE':
                return `${t12(language, 'Line', 'Çizgi')} L=${Math.hypot(g.end.x - g.start.x, g.end.y - g.start.y).toFixed(1)}mm`;
            case 'CIRCLE':
                return `${t12(language, 'Circle', 'Çember')} R=${g.radius?.toFixed(1)}mm`;
            case 'ARC':
                return `${t12(language, 'Arc', 'Yay')} R=${g.radius?.toFixed(1)}mm`;
            case 'POLYLINE':
                return `${t12(language, 'Polyline', 'Polilin')} (${g.vertices?.length ?? 0} ${t12(language, 'Pts', 'Nokta')})`;
            case 'RECTANGLE':
                return `${t12(language, 'Rectangle', 'Dikdörtgen')} ${g.width}×${g.height}mm`;
            case 'HEXAGON':
                return `${t12(language, 'Polygon', 'Poligon')} R=${g.radius}mm`;
            case 'ELLIPSE':
                return `${t12(language, 'Ellipse', 'Elips')} ${g.radiusX}×${g.radiusY}mm`;
            case 'SPLINE':
                return `Spline (${g.controlPoints?.length ?? 0} ${t12(language, 'Pts', 'Nokta')})`;
            case 'HATCH':
                return `${t12(language, 'Hatch', 'Tarama')} (${g.pattern || 'ANSI31'})`;
            case 'GEAR':
                return `${t12(language, 'Gear', 'Dişli')} m=${g.module}, z=${g.teeth}`;
            case 'FASTENER':
                return `${t12(language, 'Fastener', 'Bağlantı')} Ø${g.diameter || 10}mm`;
            case 'BELT_PULLEY':
                return t12(language, 'Belt-Pulley', 'Kayış-Kasnak');
            case 'PLANETARY_GEAR':
                return t12(language, 'Planetary Gear', 'Planet Dişli');
            case 'SPROCKET':
                return `${t12(language, 'Sprocket', 'Zincir Dişlisi')} z=${g.teeth || 19}, p=${g.pitch || 12.7}mm`;
            case 'TEXT':
                return `${t12(language, 'Note', 'Not')}: "${(g.content || t12(language, 'Text', 'Metin')).slice(0, 18)}"`;
            case 'LEADER':
                return `${t12(language, 'Leader', 'Lider')}: "${(g.text || t12(language, 'Note', 'Not')).slice(0, 18)}"`;
            case 'DIMENSION':
                return `${t12(language, 'Dim', 'Ölçü')}: ${(g.value ?? (g.start && g.end ? Math.hypot(g.end.x - g.start.x, g.end.y - g.start.y) : 0)).toFixed(2)} mm`;
            case 'POINT':
                return `${t12(language, 'Point', 'Nokta')} (${g.x?.toFixed(1)}, ${g.y?.toFixed(1)})`;
            default:
                return `${g.type} — ${e.id.slice(0, 6)}`;
        }
    };

    return (
        <div className="h-full flex flex-col bg-[var(--bg-1)] border-r border-white/10 overflow-hidden">
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

                {/* SKETCHES & 2D SHAPES */}
                <TreeNode
                    label={t.sketches || t12(language, "Sketches", "2D Çizimler")}
                    icon={<PenTool size={13} />}
                    badge={sketches.length}
                    defaultExpanded={true}
                >
                    {sketches.map(e => (
                        <TreeNode
                            key={e.id}
                            label={getEntityLabel(e)}
                            icon={<div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color || '#3ad0e6' }} />}
                            onClick={() => selectEntity(e.id)}
                            actions={
                                <button
                                    onClick={(ev) => { ev.stopPropagation(); removeEntity(e.id); }}
                                    className="p-0.5 text-slate-500 hover:text-red-400"
                                    title={t12(language, "Delete", "Sil")}
                                >
                                    <Trash2 size={10} />
                                </button>
                            }
                        />
                    ))}
                </TreeNode>

                {/* ANNOTATIONS & NOTES (Notlar ve Ölçüler) */}
                <TreeNode
                    label={t12(language, "Annotations (Notes & Dims)", "Notlar & Ölçüler")}
                    icon={<FileText size={13} />}
                    badge={annotations.length}
                    defaultExpanded={true}
                >
                    {annotations.length === 0 ? (
                        <div className="px-5 py-1 text-[10px] text-slate-600 italic">{t12(language, "No notes or dimensions added", "Not veya ölçü eklenmedi")}</div>
                    ) : (
                        annotations.map(e => (
                            <TreeNode
                                key={e.id}
                                label={getEntityLabel(e)}
                                icon={<span className="text-[10px]">📝</span>}
                                onClick={() => selectEntity(e.id)}
                                actions={
                                    <button
                                        onClick={(ev) => { ev.stopPropagation(); removeEntity(e.id); }}
                                        className="p-0.5 text-slate-500 hover:text-red-400"
                                        title={t12(language, "Delete", "Sil")}
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                }
                            />
                        ))
                    )}
                </TreeNode>

                {/* MECHANICAL COMPONENTS */}
                {mechanical.length > 0 && (
                    <TreeNode
                        label={t12(language, "Mechanical Components", "Makine Elemanları")}
                        icon={<Cog size={13} />}
                        badge={mechanical.length}
                        defaultExpanded={true}
                    >
                        {mechanical.map(e => (
                            <TreeNode
                                key={e.id}
                                label={getEntityLabel(e)}
                                icon={<div className="w-2 h-2 rounded-full shrink-0 bg-emerald-400" />}
                                onClick={() => selectEntity(e.id)}
                                actions={
                                    <button
                                        onClick={(ev) => { ev.stopPropagation(); removeEntity(e.id); }}
                                        className="p-0.5 text-slate-500 hover:text-red-400"
                                        title={t12(language, "Delete", "Sil")}
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                }
                            />
                        ))}
                    </TreeNode>
                )}

                {/* BODIES */}
                <TreeNode
                    label={t.bodies || "Bodies"}
                    icon={<Box size={13} />}
                    badge={bodies.length}
                    defaultExpanded={false}
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

                {/* POINTS */}
                {points.length > 0 && (
                    <TreeNode
                        label={t12(language, "Points", "Noktalar")}
                        icon={<span className="text-[10px]">✕</span>}
                        badge={points.length}
                        defaultExpanded={false}
                    >
                        {points.map(p => (
                            <TreeNode
                                key={p.id}
                                label={getEntityLabel(p)}
                                icon={<div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                                onClick={() => selectEntity(p.id)}
                            />
                        ))}
                    </TreeNode>
                )}
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
