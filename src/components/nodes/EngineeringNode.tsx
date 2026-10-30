import React, { memo, useMemo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { getSchema } from '@/flow/nodes/Registry';
import { describePort, PORT_UNITS } from '@/flow/core/ports';
import { Settings, Zap, AlertTriangle, Database, Activity, FileText, ChevronDown, ChevronRight, Eye, EyeOff, Download, ExternalLink, Box, Copy, Check } from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';
import type { EngineeringNodeData } from '@/store/flowStore';
import type { NodeRunStatus } from '@/flow/types/core';
import { getModuleLinkInfo } from '@/flow/core/moduleLinks';
import { NodeVisualizerPreview } from '@/components/flow/NodeVisualizerPreview';

function formatOutput(value: unknown): string {
    if (value === undefined || value === null) return '—';
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) return String(value);
        if (value === 0) return '0';
        const absVal = Math.abs(value);
        if (absVal >= 1e7 || (absVal > 0 && absVal < 1e-4)) {
            return value.toExponential(3);
        }
        if (Number.isInteger(value)) return value.toLocaleString('en-US');
        return absVal >= 1000
            ? value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
            : value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
    }
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'string') {
        if (value.includes('SECTION') && value.includes('EOF')) return 'DXF R12';
        return value.length > 28 ? `${value.slice(0, 28)}…` : value;
    }
    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        if ('valid' in obj) return obj.valid ? 'PASS' : 'FAIL';
        if ('type' in obj && typeof obj.type === 'string') return String(obj.type).toUpperCase();
        return 'OBJ';
    }
    return String(value);
}

function statusLabel(status: NodeRunStatus | undefined, hasErrors: boolean): { text: string; color: string } {
    if (hasErrors || status === 'error') return { text: 'ERROR', color: 'red' };
    if (status === 'blocked') return { text: 'BLOCKED', color: 'amber' };
    if (status === 'cached') return { text: 'CACHED', color: 'cyan' };
    if (status === 'computed') return { text: 'OK', color: 'emerald' };
    if (status === 'skipped') return { text: 'SKIP', color: 'slate' };
    return { text: 'READY', color: 'emerald' };
}

const EngineeringNode = ({ data, id, selected }: NodeProps<EngineeringNodeData>) => {
    const schemaId = data.schemaId;
    const schema = getSchema(schemaId);

    const edges = useFlowStore((state) => state.edges);
    const updateNodeData = useFlowStore((state) => state.updateNodeData);

    const isHandleConnected = (handleId: string, type: 'source' | 'target') => {
        if (type === 'target') {
            return edges.some((e) => e.target === id && e.targetHandle === handleId);
        }
        return edges.some((e) => e.source === id && e.sourceHandle === handleId);
    };

    const handleInputChange = (key: string, value: string) => {
        const num = parseFloat(value);
        updateNodeData(id, { [key]: value === '' ? '' : (isNaN(num) ? value : num) } as any);
    };

    const collapsed = Boolean(data.collapsed);
    const showPreview = (data as any).showPreview ?? false;
    const errors = data.executionErrors ?? [];
    const warnings = data.executionWarnings ?? [];
    const outputs = data.outputs ?? {};
    const status = statusLabel(data.executionStatus, errors.length > 0);

    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const handleCopyOutput = (key: string, val: unknown) => {
        if (val === undefined || val === null) return;
        const text = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
        navigator.clipboard?.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 1200);
    };

    const linkInfo = useMemo(() => getModuleLinkInfo(schemaId, data, outputs), [schemaId, data, outputs]);

    const categoryTheme = useMemo(() => {
        if (!schema) return { border: 'border-slate-800', header: 'from-slate-900 to-[var(--bg-1)]', badge: 'border-slate-700 text-slate-400', iconColor: 'text-slate-400' };
        switch (schema.category) {
            case 'mechanical':
                return {
                    border: 'border-cyan-500/35',
                    header: 'from-cyan-950/70 via-[var(--bg-2)] to-[var(--bg-1)]',
                    badge: 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300',
                    iconColor: 'text-cyan-400',
                };
            case 'validation':
                return {
                    border: 'border-rose-500/35',
                    header: 'from-rose-950/70 via-[var(--bg-1)] to-[var(--bg-1)]',
                    badge: 'bg-rose-950/80 border-rose-500/50 text-rose-300',
                    iconColor: 'text-rose-400',
                };
            case 'input':
                return {
                    border: 'border-amber-500/35',
                    header: 'from-amber-950/70 via-[var(--bg-1)] to-[var(--bg-1)]',
                    badge: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
                    iconColor: 'text-amber-400',
                };
            case 'export':
                return {
                    border: 'border-emerald-500/35',
                    header: 'from-emerald-950/70 via-[var(--bg-2)] to-[var(--bg-1)]',
                    badge: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300',
                    iconColor: 'text-emerald-400',
                };
            case 'visualizer':
                return {
                    border: 'border-purple-500/35',
                    header: 'from-purple-950/70 via-[var(--bg-1)] to-[var(--bg-1)]',
                    badge: 'bg-purple-950/80 border-purple-500/50 text-purple-300',
                    iconColor: 'text-purple-400',
                };
            default:
                return {
                    border: 'border-slate-700/60',
                    header: 'from-slate-900 via-[var(--bg-2)] to-[var(--bg-1)]',
                    badge: 'bg-slate-900 border-slate-700 text-slate-300',
                    iconColor: 'text-cyan-400',
                };
        }
    }, [schema]);

    const glow = useMemo(() => {
        if (errors.length > 0 || data.executionStatus === 'error') {
            return 'border-red-500 ring-2 ring-red-500/40 ';
        }
        if (data.executionStatus === 'blocked') {
            return 'border-amber-500 ring-1 ring-amber-500/40 ';
        }
        if (selected) {
            return 'border-cyan-400 ring-2 ring-cyan-400/50 ';
        }
        return `${categoryTheme.border} hover:border-cyan-400/60 shadow-[0_8px_24px_rgba(0,0,0,0.6)]`;
    }, [errors.length, data.executionStatus, selected, categoryTheme]);

    if (!schema) {
        return (
            <div className="w-64 bg-red-900/20 border border-red-500 rounded-xl p-4 text-center">
                <AlertTriangle className="mx-auto text-red-500 mb-2" />
                <div className="text-red-400 font-bold text-xs">UNKNOWN SCHEME</div>
                <div className="text-red-500 text-[10px]">{schemaId || 'No ID'}</div>
            </div>
        );
    }

    const renderIcon = () => {
        switch (schema.category) {
            case 'mechanical': return <Settings size={14} className="text-cyan-400" />;
            case 'validation': return <Activity size={14} className="text-rose-400" />;
            case 'input': return <Database size={14} className="text-amber-400" />;
            case 'export': return <FileText size={14} className="text-emerald-400" />;
            case 'visualizer': return <Eye size={14} className="text-purple-400" />;
            default: return <Zap size={14} className="text-slate-400" />;
        }
    };

    return (
        <div className={`min-w-[270px] max-w-[340px] bg-[var(--bg-1)]/95 rounded-xl border transition-all duration-200 group overflow-hidden ${glow}`}>
            {/* Header */}
            <div className={`w-full px-3 py-2 border-b border-white/5 bg-gradient-to-r ${categoryTheme.header} flex items-center gap-2 text-left transition-all ${selected ? 'brightness-110' : ''}`}>
                <button
                    type="button"
                    className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                    onClick={() => updateNodeData(id, { collapsed: !collapsed } as any)}
                >
                    {collapsed ? <ChevronRight size={13} className="text-slate-400 shrink-0" /> : <ChevronDown size={13} className="text-slate-400 shrink-0" />}
                    <div className="p-1 rounded-md bg-black/40 border border-white/10 shrink-0">
                        {renderIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-100 truncate tracking-wide">{schema.title}</div>
                        <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
                            <span>{schema.id}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-500">v{schema.version}</span>
                        </div>
                    </div>
                </button>

                {/* Quick actions: Visualizer toggle, 3D Studio, Open in Module */}
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            updateNodeData(id, { showPreview: !showPreview } as any);
                        }}
                        className={`p-1 rounded border transition-all cursor-pointer ${
                            showPreview
                                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 '
                                : 'bg-black/30 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                        }`}
                        title={showPreview ? 'Canlı şemayı gizle' : 'Canlı mühendislik şemasını göster'}
                    >
                        {showPreview ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>

                    {linkInfo?.info.supports3DStudio && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                const res = linkInfo.info.executeExport3D?.(data, outputs);
                                if (res?.message) alert(res.message);
                            }}
                            className="p-1 rounded bg-black/30 border border-white/10 text-sky-400 hover:text-sky-300 hover:bg-sky-950/40 hover:border-sky-500/40 transition-all cursor-pointer"
                            title="3D Tasarım Stüdyosu'na Aktar (CrossModuleBridge)"
                        >
                            <Box size={12} />
                        </button>
                    )}

                    {linkInfo && (
                        <a
                            href={linkInfo.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded bg-black/30 border border-white/10 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 hover:border-emerald-500/40 transition-all cursor-pointer"
                            title={`${linkInfo.info.moduleTitleTr} (Harici Hesaplayıcıda Aç)`}
                        >
                            <ExternalLink size={12} />
                        </a>
                    )}

                    {schema.isoStandard && (
                        <div className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border ${categoryTheme.badge} shrink-0`}>
                            {schema.isoStandard}
                        </div>
                    )}
                </div>
            </div>

            {!collapsed && (
                <div className="p-3.5 space-y-3 relative bg-[var(--bg-1)]">
                    {/* Live Blueprint Visualizer */}
                    {showPreview && (
                        <div className="mb-2">
                            <NodeVisualizerPreview
                                schemaId={schemaId}
                                inputs={data}
                                outputs={outputs}
                                mode="compact"
                            />
                        </div>
                    )}
                    {/* Inputs */}
                    {schema.inputs.length > 0 && (
                        <div className="space-y-2">
                            {schema.inputs.map((input) => {
                                const connected = isHandleConnected(input.id, 'target');
                                const unit = PORT_UNITS[input.type];
                                return (
                                    <div key={input.id} className="relative flex items-center justify-between gap-2 group/port h-6">
                                        <Handle
                                            type="target"
                                            position={Position.Left}
                                            id={input.id}
                                            title={describePort(input)}
                                            className={`
                                                !w-2.5 !h-2.5 !-left-[18px] transition-all duration-300
                                                ${connected
                                                    ? '!bg-cyan-400 !border-cyan-200 '
                                                    : '!bg-[var(--bg-3)] !border-[var(--line)] hover:!bg-cyan-400 '}
                                            `}
                                        />
                                        <div
                                            className={`text-[10px] transition-colors truncate max-w-[140px] ${connected ? 'text-cyan-300 font-semibold' : 'text-slate-300'}`}
                                            title={describePort(input)}
                                        >
                                            {input.label}
                                            {unit && <span className="ml-1 text-[8px] text-slate-500 font-mono">{unit}</span>}
                                        </div>
                                        {!connected ? (
                                            <div className="flex-1 max-w-[95px]">
                                                <input
                                                    type={input.type === 'string' || input.type === 'json' ? 'text' : 'number'}
                                                    className="w-full bg-[var(--bg-2)] border border-slate-700/80 rounded px-2 py-0.5 text-[10px] text-right text-slate-100 focus:border-cyan-400 focus:bg-[var(--bg-2)] outline-none placeholder:text-slate-600 font-mono transition-all"
                                                    placeholder={input.type}
                                                    value={(data as any)[input.id] ?? ''}
                                                    onChange={(e) => handleInputChange(input.id, e.target.value)}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-[8px] text-cyan-400 font-mono border border-cyan-500/30 bg-cyan-950/40 px-1.5 py-0.2 rounded font-semibold">
                                                BAĞLI
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {schema.inputs.length > 0 && schema.outputs.length > 0 && (
                        <div className="h-px bg-slate-800/80 mx-[-14px]" />
                    )}

                    {/* Outputs */}
                    {schema.outputs.length > 0 && (
                        <div className="space-y-2">
                            {schema.outputs.map((output) => {
                                const connected = isHandleConnected(output.id, 'source');
                                const unit = PORT_UNITS[output.type];
                                return (
                                    <div key={output.id} className="relative flex items-center justify-end gap-2 group/port min-h-[22px]">
                                        <div
                                            className="text-[10px] text-slate-300 text-right group-hover/port:text-emerald-300 transition-colors cursor-default"
                                            title={describePort(output)}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                <span>{output.label}</span>
                                                {unit && <span className="text-[8px] text-slate-500 font-mono">{unit}</span>}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopyOutput(output.id, outputs[output.id]);
                                                }}
                                                className={`text-[9px] font-mono font-bold leading-none mt-0.5 px-1.5 py-0.5 rounded border transition-all cursor-pointer inline-flex items-center gap-1 ${
                                                    copiedKey === output.id
                                                        ? 'bg-emerald-900/60 border-emerald-400 text-emerald-200 '
                                                        : 'bg-[var(--bg-1)] border-emerald-500/20 text-emerald-400 hover:border-emerald-400/60 hover:bg-[var(--bg-3)] '
                                                }`}
                                                title={copiedKey === output.id ? 'Panoya Kopyalandı!' : `Değeri kopyala: ${outputs[output.id] ?? '—'}`}
                                            >
                                                {copiedKey === output.id ? (
                                                    <>
                                                        <Check size={9} />
                                                        <span>KOPYALANDI</span>
                                                    </>
                                                ) : (
                                                    <span>{formatOutput(outputs[output.id])}</span>
                                                )}
                                            </button>
                                            {output.type === 'dxf_file' && typeof outputs[output.id] === 'string' && (outputs[output.id] as string).includes('SECTION') && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const blob = new Blob([outputs[output.id] as string], { type: 'application/dxf' });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `${schema.id}-${id}.dxf`;
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        document.body.removeChild(a);
                                                        URL.revokeObjectURL(url);
                                                    }}
                                                    className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-[8px] font-bold text-emerald-300 hover:bg-emerald-500/30 transition-all cursor-pointer ml-auto "
                                                    title="AutoCAD R12 DXF İndir"
                                                >
                                                    <Download size={9} />
                                                    DXF İNDİR
                                                </button>
                                            )}
                                        </div>
                                        <Handle
                                            type="source"
                                            position={Position.Right}
                                            id={output.id}
                                            title={describePort(output)}
                                            className={`
                                                !w-2.5 !h-2.5 !-right-[18px] transition-all duration-300
                                                ${connected
                                                    ? '!bg-emerald-400 !border-emerald-200 '
                                                    : '!bg-[var(--bg-3)] !border-[var(--line)] hover:!bg-emerald-400 '}
                                            `}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {linkInfo && (
                        <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between">
                            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider truncate max-w-[150px]">
                                {linkInfo.info.standard || linkInfo.info.moduleTitleTr}
                            </span>
                            <a
                                href={linkInfo.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[8px] font-mono text-cyan-400 hover:text-cyan-300 font-semibold hover:underline shrink-0"
                            >
                                <span>Modülde İncele</span>
                                <ExternalLink size={9} />
                            </a>
                        </div>
                    )}

                    {warnings.length > 0 && (
                        <div className="text-[9px] text-amber-300 font-mono leading-snug border border-amber-500/30 bg-amber-950/30 rounded-lg p-2">
                            ⚠️ {warnings[0]}
                            {warnings.length > 1 ? ` (+${warnings.length - 1})` : ''}
                        </div>
                    )}
                    {errors.length > 0 && (
                        <div className="text-[9px] text-red-300 font-mono leading-snug border border-red-500/30 bg-red-950/30 rounded-lg p-2">
                            🚨 {errors[0]}
                            {errors.length > 1 ? ` (+${errors.length - 1})` : ''}
                        </div>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className={`px-3 py-1.5 border-t border-white/5 flex items-center justify-between text-[9px] ${
                status.color === 'red' ? 'bg-red-950/30'
                    : status.color === 'amber' ? 'bg-amber-950/30'
                    : 'bg-[var(--bg-0)]'
            }`}>
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full shadow-lg ${
                        status.color === 'red' ? 'bg-red-400 '
                            : status.color === 'amber' ? 'bg-amber-400 '
                            : status.color === 'cyan' ? 'bg-cyan-400 '
                            : 'bg-emerald-400 '
                    }`} />
                    <span className={`font-mono font-bold tracking-wider ${
                        status.color === 'red' ? 'text-red-400'
                            : status.color === 'amber' ? 'text-amber-400'
                            : status.color === 'cyan' ? 'text-cyan-400'
                            : 'text-emerald-400'
                    }`}>
                        {status.text}
                    </span>
                </div>
                <span className="font-mono text-slate-500">
                    {typeof data.executionTimeMs === 'number' ? `${data.executionTimeMs.toFixed(1)} ms` : '—'}
                </span>
            </div>
        </div>
    );
};

export default memo(EngineeringNode);
