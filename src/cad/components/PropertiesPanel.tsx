
'use client';

import React, { useCallback } from 'react';
import { useCadStore } from '../store/cadStore';
import { distance } from '../kernel/GeometryKernel';
import { CadEntity, Point } from '../kernel/types';
import { Info } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// PROPERTIES PANEL — Full Entity Parameter Editor
// ═══════════════════════════════════════════════════════════════

export function PropertiesPanel() {
    const { entities, updateEntity, layers, removeEntity, constraints, addModifier, removeModifier } = useCadStore();
    const selectedEntities = entities.filter(e => e.isSelected);

    if (selectedEntities.length === 0) {
        return (
            <div className="flex flex-col h-full bg-transparent w-full">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">Properties</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-8 opacity-20 text-center select-none pointer-events-none">
                    <Info size={32} className="mb-4 text-slate-400" strokeWidth={1} />
                    <p className="text-[10px] uppercase tracking-[0.2em] leading-relaxed">Select an entity<br />to inspect properties</p>
                </div>
            </div>
        );
    }

    const first = selectedEntities[0];
    const isMulti = selectedEntities.length > 1;

    return (
        <div className="flex flex-col h-full bg-transparent w-full overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-3 bg-cyan-500/50 rounded-full" />
                    <span className="text-[10px] font-mono text-slate-200 uppercase tracking-[0.2em]">Properties</span>
                </div>
                <div className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                    <span className="text-[9px] text-cyan-400 font-mono tracking-tighter uppercase">{selectedEntities.length} Selected</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {/* Entity Type Badge */}
                <div className="flex items-center gap-2 px-1 py-1.5">
                    <div className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-[10px] font-mono text-cyan-400 uppercase">
                        {isMulti ? `${selectedEntities.length} Objects` : first.geometry.type}
                    </div>
                    <span className="text-[9px] text-cyan-900/40 font-mono truncate">{first.id.slice(0, 8)}</span>
                </div>

                {/* === GENERAL SECTION === */}
                <Section title="General">
                    {/* Color */}
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] text-gray-500 w-14 shrink-0">Color</label>
                        <input
                            type="color"
                            value={first.color}
                            onChange={(e) => selectedEntities.forEach(ent => updateEntity(ent.id, { color: e.target.value }))}
                            className="w-6 h-6 rounded border border-cyan-900/30 bg-transparent cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-gray-400">{first.color}</span>
                    </div>

                    {/* Layer */}
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] text-gray-500 w-14 shrink-0">Layer</label>
                        <select
                            value={first.layerId}
                            onChange={(e) => selectedEntities.forEach(ent => updateEntity(ent.id, { layerId: e.target.value }))}
                            className="flex-1 bg-[#0a0e14] border border-cyan-900/30 rounded px-2 py-1 text-gray-300 text-[11px]"
                        >
                            {layers.map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Visibility */}
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] text-gray-500 w-14 shrink-0">Visible</label>
                        <button
                            onClick={() => selectedEntities.forEach(ent => updateEntity(ent.id, { isVisible: !first.isVisible }))}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${first.isVisible
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-gray-500/10 border-gray-500/30 text-gray-400'
                                }`}
                        >
                            {first.isVisible ? 'ON' : 'OFF'}
                        </button>
                    </div>

                    {/* Fixed (Solver) */}
                    <div className="flex items-center gap-2 mt-1">
                        <label className="text-[10px] text-gray-500 w-14 shrink-0">Fixed</label>
                        <button
                            onClick={() => selectedEntities.forEach(ent => updateEntity(ent.id, { isFixed: !first.isFixed }))}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${first.isFixed
                                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                : 'bg-gray-500/10 border-gray-500/30 text-gray-400'
                                }`}
                        >
                            {first.isFixed ? 'LOCKED' : 'FREE'}
                        </button>
                    </div>
                </Section>

                {/* === GEOMETRY SECTION === */}
                {!isMulti && (
                    <Section title="Geometry">
                        <GeometryEditor entity={first} updateEntity={updateEntity} />
                    </Section>
                )}

                {/* === COMPUTED SECTION === */}
                {!isMulti && (
                    <Section title="Computed">
                        <ComputedProperties entity={first} />
                    </Section>
                )}

                {/* === CONSTRAINTS SECTION === */}
                {!isMulti && (
                    <Section title="Constraints">
                        <EntityConstraints entity={first} constraints={constraints} />
                    </Section>
                )}

                {/* === MACHINING MODIFIERS === */}
                {!isMulti && (
                    <Section title="Machining Modifiers">
                        <ModifiersEditor entity={first} addModifier={addModifier} removeModifier={removeModifier} />
                    </Section>
                )}

                {/* === ACTIONS === */}
                <Section title="Actions">
                    <button
                        onClick={() => selectedEntities.forEach(ent => removeEntity(ent.id))}
                        className="w-full px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-[11px] font-mono uppercase tracking-wider hover:bg-red-500/20 transition-colors"
                    >
                        Delete ({selectedEntities.length})
                    </button>
                </Section>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// SECTION WRAPPER
// ═══════════════════════════════════════════════════════════════

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="py-4 first:pt-2 border-b border-white/5 last:border-0 group">
            <div className="flex items-center gap-2 mb-4 px-2">
                <div className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-cyan-500/50 transition-colors" />
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em]">{title}</div>
            </div>
            <div className="space-y-4 px-3">{children}</div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// GEOMETRY EDITOR — Per Type
// ═══════════════════════════════════════════════════════════════

function GeometryEditor({ entity, updateEntity }: { entity: CadEntity; updateEntity: (id: string, data: any) => void }) {
    const geom = entity.geometry;

    const update = useCallback((patch: any) => {
        updateEntity(entity.id, { geometry: { ...geom, ...patch } });
    }, [entity.id, geom, updateEntity]);

    switch (geom.type) {
        case 'LINE':
            return (
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                    <PropInput label="Start X" value={geom.start.x} onChange={v => update({ start: { ...geom.start, x: v } })} />
                    <PropInput label="Start Y" value={geom.start.y} onChange={v => update({ start: { ...geom.start, y: v } })} />
                    <PropInput label="End X" value={geom.end.x} onChange={v => update({ end: { ...geom.end, x: v } })} />
                    <PropInput label="End Y" value={geom.end.y} onChange={v => update({ end: { ...geom.end, y: v } })} />
                </div>
            );

        case 'CIRCLE':
            return (
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                    <PropInput label="Center X" value={geom.center.x} onChange={v => update({ center: { ...geom.center, x: v } })} />
                    <PropInput label="Center Y" value={geom.center.y} onChange={v => update({ center: { ...geom.center, y: v } })} />
                    <div className="col-span-2">
                        <PropInput label="Radius" value={geom.radius} onChange={v => update({ radius: v })} />
                    </div>
                </div>
            );

        case 'ARC':
            return (
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                    <PropInput label="Center X" value={geom.center.x} onChange={v => update({ center: { ...geom.center, x: v } })} />
                    <PropInput label="Center Y" value={geom.center.y} onChange={v => update({ center: { ...geom.center, y: v } })} />
                    <div className="col-span-2">
                        <PropInput label="Radius" value={geom.radius} onChange={v => update({ radius: v })} />
                    </div>
                    <PropInput label="Start°" value={toDeg(geom.startAngle)} onChange={v => update({ startAngle: toRad(v) })} />
                    <PropInput label="End°" value={toDeg(geom.endAngle)} onChange={v => update({ endAngle: toRad(v) })} />
                </div>
            );

        case 'POLYLINE':
            return (
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">Vertices: {geom.vertices.length}</span>
                        <button
                            onClick={() => update({ closed: !geom.closed })}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${geom.closed
                                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                                : 'bg-gray-500/10 border-gray-500/30 text-gray-400'
                                }`}
                        >
                            {geom.closed ? 'Closed' : 'Open'}
                        </button>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto space-y-1">
                        {geom.vertices.map((v: Point, i: number) => (
                            <div key={i} className="grid grid-cols-2 gap-x-2 gap-y-1">
                                <PropInput
                                    label={`V${i} X`}
                                    value={v.x}
                                    onChange={val => {
                                        const verts = [...geom.vertices];
                                        verts[i] = { ...verts[i], x: val };
                                        update({ vertices: verts });
                                    }}
                                />
                                <PropInput
                                    label={`V${i} Y`}
                                    value={v.y}
                                    onChange={val => {
                                        const verts = [...geom.vertices];
                                        verts[i] = { ...verts[i], y: val };
                                        update({ vertices: verts });
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'DIMENSION':
            return (
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                    <PropInput label="P1 X" value={geom.start?.x ?? 0} onChange={v => update({ start: { ...(geom.start || {}), x: v } })} />
                    <PropInput label="P1 Y" value={geom.start?.y ?? 0} onChange={v => update({ start: { ...(geom.start || {}), y: v } })} />
                    <PropInput label="P2 X" value={geom.end?.x ?? 0} onChange={v => update({ end: { ...(geom.end || {}), x: v } })} />
                    <PropInput label="P2 Y" value={geom.end?.y ?? 0} onChange={v => update({ end: { ...(geom.end || {}), y: v } })} />
                    <div className="col-span-2">
                        <PropInput label="Value" value={geom.value ?? 0} onChange={v => update({ value: v })} />
                    </div>
                </div>
            );

        case 'RECTANGLE':
            return (
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                    <PropInput label="Center X" value={(geom as any).center.x} onChange={v => update({ center: { ...(geom as any).center, x: v } })} />
                    <PropInput label="Center Y" value={(geom as any).center.y} onChange={v => update({ center: { ...(geom as any).center, y: v } })} />
                    <PropInput label="Width" value={(geom as any).width} onChange={v => update({ width: v })} />
                    <PropInput label="Height" value={(geom as any).height} onChange={v => update({ height: v })} />
                    <div className="col-span-2">
                        <PropInput label="Rotation°" value={toDeg((geom as any).rotation || 0)} onChange={v => update({ rotation: toRad(v) })} />
                    </div>
                </div>
            );

        case 'HEXAGON':
            return (
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                    <PropInput label="Center X" value={(geom as any).center.x} onChange={v => update({ center: { ...(geom as any).center, x: v } })} />
                    <PropInput label="Center Y" value={(geom as any).center.y} onChange={v => update({ center: { ...(geom as any).center, y: v } })} />
                    <PropInput label="Radius" value={(geom as any).radius} onChange={v => update({ radius: v })} />
                    <PropInput label="Rotation°" value={toDeg((geom as any).rotation || 0)} onChange={v => update({ rotation: toRad(v) })} />
                </div>
            );

        default:
            return <div className="text-[10px] text-gray-500 italic">No editable properties</div>;
    }
}

// ═══════════════════════════════════════════════════════════════
// COMPUTED PROPERTIES — Read-only
// ═══════════════════════════════════════════════════════════════

function ComputedProperties({ entity }: { entity: CadEntity }) {
    const geom = entity.geometry;

    const props: { label: string; value: string }[] = [];

    if (geom.type === 'LINE') {
        const len = distance(geom.start, geom.end);
        const angle = Math.atan2(geom.end.y - geom.start.y, geom.end.x - geom.start.x) * 180 / Math.PI;
        props.push({ label: 'Length', value: len.toFixed(3) });
        props.push({ label: 'Angle', value: `${angle.toFixed(1)}°` });
    } else if (geom.type === 'CIRCLE') {
        props.push({ label: 'Diameter', value: (geom.radius * 2).toFixed(3) });
        props.push({ label: 'Circumf.', value: (2 * Math.PI * geom.radius).toFixed(3) });
        props.push({ label: 'Area', value: (Math.PI * geom.radius ** 2).toFixed(3) });
    } else if (geom.type === 'ARC') {
        const sweep = Math.abs(geom.endAngle - geom.startAngle);
        const arcLen = geom.radius * sweep;
        props.push({ label: 'Arc Len.', value: arcLen.toFixed(3) });
        props.push({ label: 'Sweep', value: `${toDeg(sweep).toFixed(1)}°` });
    } else if (geom.type === 'POLYLINE') {
        let len = 0;
        for (let i = 0; i < geom.vertices.length - 1; i++) {
            len += distance(geom.vertices[i], geom.vertices[i + 1]);
        }
        if (geom.closed && geom.vertices.length > 1) {
            len += distance(geom.vertices[geom.vertices.length - 1], geom.vertices[0]);
        }
        props.push({ label: 'Perimeter', value: len.toFixed(3) });
        props.push({ label: 'Segments', value: String(geom.vertices.length - 1) });
    } else if (geom.type === 'DIMENSION') {
        const val = geom.value ?? (geom.start && geom.end ? distance(geom.start, geom.end) : 0);
        props.push({ label: 'Dim Value', value: val.toFixed(3) });
    } else if (geom.type === 'RECTANGLE') {
        const g = geom as any;
        props.push({ label: 'Width', value: g.width.toFixed(3) });
        props.push({ label: 'Height', value: g.height.toFixed(3) });
        props.push({ label: 'Area', value: (g.width * g.height).toFixed(3) });
        props.push({ label: 'Perimeter', value: (2 * (g.width + g.height)).toFixed(3) });
    } else if (geom.type === 'HEXAGON') {
        const g = geom as any;
        const area = (3 * Math.sqrt(3) / 2) * g.radius * g.radius;
        const perimeter = 6 * g.radius;
        props.push({ label: 'Radius', value: g.radius.toFixed(3) });
        props.push({ label: 'Area', value: area.toFixed(3) });
        props.push({ label: 'Perimeter', value: perimeter.toFixed(3) });
    }

    if (props.length === 0) return null;

    return (
        <div className="space-y-1">
            {props.map(p => (
                <div key={p.label} className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">{p.label}</span>
                    <span className="text-[11px] font-mono text-cyan-300">{p.value}</span>
                </div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// CONSTRAINTS LIST
// ═══════════════════════════════════════════════════════════════

function EntityConstraints({ entity, constraints }: { entity: CadEntity, constraints: any[] }) {
    const entityConstraints = constraints.filter(c => (c.entityIds || []).includes(entity.id));

    if (entityConstraints.length === 0) {
        return <div className="text-[10px] text-gray-500 italic">No constraints applied.</div>;
    }

    return (
        <div className="space-y-1">
            {entityConstraints.map(c => (
                <div key={c.id} className="flex justify-between items-center bg-cyan-900/10 px-2 py-1 rounded border border-cyan-900/20">
                    <span className="text-[10px] font-mono text-cyan-400">{c.type}</span>
                    {c.value !== undefined && (
                        <span className="text-[10px] font-mono text-cyan-200">{c.value.toFixed(2)}</span>
                    )}
                </div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// PROP INPUT — Numeric Field
// ═══════════════════════════════════════════════════════════════

function PropInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <div className="group/field">
            <div className="flex items-center justify-between mb-1.5 px-1">
                <label className="text-[9px] text-slate-500 font-mono uppercase tracking-widest group-hover/field:text-slate-400 transition-colors">{label}</label>
                <div className="w-1 h-1 rounded-full bg-white/5" />
            </div>
            <input
                type="number"
                value={value.toFixed(2)}
                onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) onChange(v);
                }}
                step={0.5}
                className="w-full bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-lg px-3 py-2 text-white text-[11px] font-mono
                           focus:border-cyan-500/30 focus:bg-cyan-500/[0.02] focus:ring-1 focus:ring-cyan-500/10 outline-none transition-all"
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function toDeg(rad: number): number { return rad * 180 / Math.PI; }
function toRad(deg: number): number { return deg * Math.PI / 180; }

// ═══════════════════════════════════════════════════════════════
// MODIFIERS EDITOR — Add/Remove Holes, Welds, Milling
// ═══════════════════════════════════════════════════════════════

function ModifiersEditor({ entity, addModifier, removeModifier }: {
    entity: CadEntity;
    addModifier: (entityId: string, modifier: any) => void;
    removeModifier: (entityId: string, index: number) => void;
}) {
    const modifiers = entity.modifiers || [];

    const handleAddHole = () => {
        const geom = entity.geometry as any;
        const cx = geom.center?.x ?? geom.start?.x ?? 0;
        const cy = geom.center?.y ?? geom.start?.y ?? 0;
        addModifier(entity.id, {
            type: 'HOLE',
            x: cx,
            y: cy,
            diameter: 10,
            depth: 5,
            description: 'Through Hole'
        });
    };

    const handleAddThread = () => {
        const geom = entity.geometry as any;
        const cx = geom.center?.x ?? geom.start?.x ?? 0;
        const cy = geom.center?.y ?? geom.start?.y ?? 0;
        addModifier(entity.id, {
            type: 'THREADED',
            x: cx,
            y: cy,
            diameter: 8,
            depth: 12,
            description: 'M8x1.25'
        });
    };

    const handleAddWeld = () => {
        const geom = entity.geometry as any;
        const cx = geom.center?.x ?? geom.start?.x ?? 0;
        const cy = geom.center?.y ?? geom.start?.y ?? 0;
        addModifier(entity.id, {
            type: 'WELDED',
            x: cx,
            y: cy,
            weldSize: 5,
            description: 'Fillet Weld'
        });
    };

    const handleAddMilling = () => {
        const geom = entity.geometry as any;
        const cx = geom.center?.x ?? geom.start?.x ?? 0;
        const cy = geom.center?.y ?? geom.start?.y ?? 0;
        addModifier(entity.id, {
            type: 'SURFACE_MILLED',
            x: cx,
            y: cy,
            description: 'Surface Finish Ra 1.6'
        });
    };

    const modTypeColors: Record<string, string> = {
        'HOLE': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        'THREADED': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        'WELDED': 'text-red-400 bg-red-500/10 border-red-500/20',
        'SURFACE_MILLED': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    };

    return (
        <div className="space-y-3">
            {/* Existing Modifiers List */}
            {modifiers.length > 0 ? (
                <div className="space-y-1.5">
                    {modifiers.map((mod, idx) => (
                        <div key={idx} className={`flex items-center justify-between px-2 py-1.5 rounded border ${modTypeColors[mod.type] || 'text-gray-400 bg-gray-500/10 border-gray-500/20'}`}>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-mono font-bold uppercase">{mod.type.replace('_', ' ')}</span>
                                {mod.description && <span className="text-[9px] opacity-60">{mod.description}</span>}
                                {mod.diameter && <span className="text-[9px] opacity-60">⌀{mod.diameter}mm</span>}
                            </div>
                            <button
                                onClick={() => removeModifier(entity.id, idx)}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-[10px] text-gray-500 italic">No modifiers applied.</div>
            )}

            {/* Add Modifier Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
                <button onClick={handleAddHole} className="px-2 py-1.5 rounded text-[9px] font-mono uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                    + Hole
                </button>
                <button onClick={handleAddThread} className="px-2 py-1.5 rounded text-[9px] font-mono uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                    + Thread
                </button>
                <button onClick={handleAddWeld} className="px-2 py-1.5 rounded text-[9px] font-mono uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                    + Weld
                </button>
                <button onClick={handleAddMilling} className="px-2 py-1.5 rounded text-[9px] font-mono uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors">
                    + Mill Surface
                </button>
            </div>
        </div>
    );
}
