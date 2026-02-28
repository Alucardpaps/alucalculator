import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { getSchema } from '@/flow/nodes/Registry';
import { Settings, Zap, AlertTriangle, AlertCircle, Database, Activity, FileText } from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';

/**
 * 🧠 AluCalculator OS - Generic Engineering Node
 * 
 * Visual wrapper for strict EngineeringNodeSchema.
 * Dynamically renders ports based on the schema definition.
 */

const EngineeringNode = ({ data, id, selected }: NodeProps) => {
    // 1. Resolve Schema
    // The node.type in ReactFlow corresponds to 'engineering'.
    // The actual engineering logic ID (e.g., 'mech-gear-spur') is stored in data.schemaId
    const schemaId = data.schemaId;
    const schema = getSchema(schemaId);

    if (!schema) {
        return (
            <div className="w-64 bg-red-900/20 border border-red-500 rounded p-4 text-center">
                <AlertTriangle className="mx-auto text-red-500 mb-2" />
                <div className="text-red-400 font-bold text-xs">UNKNOWN SCHEME</div>
                <div className="text-red-500 text-[10px]">{schemaId || 'No ID'}</div>
            </div>
        );
    }

    // 2. Connection State (Simple selector for now)
    const edges = useFlowStore(state => state.edges);
    const updateNodeData = useFlowStore(state => state.updateNodeData);

    // Check connections per handle
    const isHandleConnected = (handleId: string, type: 'source' | 'target') => {
        if (type === 'target') {
            return edges.some(e => e.target === id && e.targetHandle === handleId);
        }
        return edges.some(e => e.source === id && e.sourceHandle === handleId);
    };

    // Input Change Handler
    const handleInputChange = (key: string, value: string) => {
        // Simple type coercion
        const num = parseFloat(value);
        updateNodeData(id, { [key]: isNaN(num) ? value : num } as any);
    };

    // Determine Status color
    const isValid = true; // Mocked for now
    const statusColor = isValid ? 'emerald' : 'red';

    // Helper: Contextual Icon based on category
    const renderIcon = () => {
        switch (schema.category) {
            case 'mechanical': return <Settings size={14} className="text-cyan-400" />;
            case 'validation': return <Activity size={14} className="text-rose-400" />;
            case 'input': return <Database size={14} className="text-amber-400" />;
            case 'export': return <FileText size={14} className="text-emerald-400" />;
            default: return <Zap size={14} className="text-slate-400" />;
        }
    };

    return (
        <div className={`
            min-w-[240px] bg-[#0a0e12] rounded-lg shadow-2xl 
            border transition-all duration-200 group
            ${selected ? 'border-cyan-500 ring-1 ring-cyan-500/50' : 'border-[#2a3a4a] hover:border-slate-500'}
        `}>
            {/* Header */}
            <div className={`
                px-3 py-2 border-b border-[#1e2833] bg-gradient-to-r from-[#161b22] to-[#0f1419] rounded-t-lg flex items-center gap-2
                ${selected ? 'bg-cyan-950/30' : ''}
            `}>
                {renderIcon()}
                <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-200 truncate">{schema.title}</div>
                    <div className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                        {schema.id} <span className="opacity-50">v{schema.version}</span>
                    </div>
                </div>
                {/* ISO Badge */}
                {schema.isoStandard && (
                    <div className="px-1.5 py-0.5 rounded bg-[#1e2833] text-[8px] font-bold text-cyan-500 border border-[#2a3a4a] shadow-inner">
                        {schema.isoStandard}
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="p-3 space-y-3 relative">

                {/* Inputs */}
                {schema.inputs.length > 0 && (
                    <div className="space-y-2">
                        {schema.inputs.map((input) => {
                            const connected = isHandleConnected(input.id, 'target');
                            return (
                                <div key={input.id} className="relative flex items-center justify-between gap-2 group/port h-6">
                                    {/* Port */}
                                    <Handle
                                        type="target"
                                        position={Position.Left}
                                        id={input.id}
                                        className={`
                                            !w-2.5 !h-2.5 !-left-[17px] transition-all duration-300
                                            ${connected
                                                ? '!bg-cyan-400 !border-cyan-200 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                                                : '!bg-[#2a3a4a] !border-[#0f1419] hover:!bg-cyan-500'}
                                        `}
                                    />

                                    {/* Label */}
                                    <div className={`text-[10px] transition-colors ${connected ? 'text-cyan-300 font-medium' : 'text-slate-400'}`}>
                                        {input.label}
                                    </div>

                                    {/* Input Field (If disconnected) */}
                                    {!connected ? (
                                        <div className="flex-1 max-w-[80px]">
                                            <input
                                                type={input.type === 'number' ? 'number' : 'text'}
                                                className="w-full bg-[#11161d] border border-[#2a3a4a] rounded px-1.5 py-0.5 text-[10px] text-right text-slate-300 focus:border-cyan-500 focus:bg-[#161b22] outline-none placeholder:text-slate-700 font-mono transition-colors"
                                                placeholder={input.type}
                                                // @ts-ignore
                                                value={data[input.id] || ''}
                                                onChange={(e) => handleInputChange(input.id, e.target.value)}
                                                onMouseDown={(e) => e.stopPropagation()} // Prevent node drag
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-[8px] text-cyan-500/50 font-mono border border-cyan-900/30 bg-cyan-950/10 px-1 rounded">
                                            LINKED
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Divider */}
                {schema.inputs.length > 0 && schema.outputs.length > 0 && (
                    <div className="h-px bg-[#1e2833] mx-[-12px]" />
                )}

                {/* Outputs */}
                {schema.outputs.length > 0 && (
                    <div className="space-y-2">
                        {schema.outputs.map((output) => {
                            const connected = isHandleConnected(output.id, 'source');
                            return (
                                <div key={output.id} className="relative flex items-center justify-end gap-2 group/port h-5">
                                    <div className="text-[10px] text-slate-400 text-right group-hover/port:text-emerald-400 transition-colors cursor-default">
                                        {output.label}
                                    </div>
                                    <Handle
                                        type="source"
                                        position={Position.Right}
                                        id={output.id}
                                        className={`
                                            !w-2.5 !h-2.5 !-right-[17px] transition-all duration-300
                                            ${connected
                                                ? '!bg-emerald-400 !border-emerald-200 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                                                : '!bg-[#2a3a4a] !border-[#0f1419] hover:!bg-emerald-500'}
                                        `}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Status Footer */}
            <div className={`
                px-3 py-1.5 border-t rounded-b-lg flex items-center justify-between
                ${isValid ? 'bg-[#11161d] border-[#1e2833]' : 'bg-red-950/20 border-red-900/30'}
            `}>
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full shadow-lg ${isValid ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'}`}></div>
                    <span className={`text-[9px] font-bold tracking-wider ${isValid ? 'text-emerald-500' : 'text-red-400'}`}>
                        {isValid ? 'READY' : 'INVALID'}
                    </span>
                </div>
                <span className="text-[9px] text-slate-600 font-mono">0ms</span>
            </div>
        </div>
    );
};


export default memo(EngineeringNode);
