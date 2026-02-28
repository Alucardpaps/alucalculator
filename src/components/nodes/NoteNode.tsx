'use client';

/**
 * AluCalc OS — Note Node
 * 
 * ReactFlow node for engineering annotations and documentation.
 * Supports markdown-style formatting.
 */

import React, { memo, useState, useCallback, useEffect } from 'react';
import { NodeProps, NodeToolbar, Position } from 'reactflow';
import { X, Edit2, Check, Type, Bold, Italic, Minus, Plus, Palette, EyeOff, Eye, Trash2 } from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';

const COLORS = ['#ffffff', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

const NoteNode: React.FC<NodeProps> = ({ id, data, selected }) => {
    const { removeNode, updateNodeData } = useFlowStore();
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(data.content || '');

    // Style states (synced with data)
    const padding = 16;
    const fontSize = data.fontSize || 14;
    const fontWeight = data.fontWeight || 'normal';
    const fontStyle = data.fontStyle || 'normal';
    const color = data.color || '#ffffff';
    const isTransparent = data.isTransparent || false;

    useEffect(() => {
        setContent(data.content || '');
    }, [data.content]);

    const handleSave = () => {
        updateNodeData(id, { content });
        setIsEditing(false);
    };

    const updateStyle = (key: string, value: any) => {
        updateNodeData(id, { [key]: value });
    };

    return (
        <>
            <NodeToolbar isVisible={selected} position={Position.Top} className="flex gap-1 bg-[#1a2332] p-1.5 rounded-lg border border-[#2a3a4a] shadow-xl">
                {/* Font Size */}
                <div className="flex items-center gap-1 border-r border-[#2a3a4a] pr-2 mr-1">
                    <button onClick={() => updateStyle('fontSize', Math.max(10, fontSize - 2))} className="p-1 hover:bg-white/10 rounded"><Minus size={12} /></button>
                    <span className="text-[10px] w-4 text-center text-gray-400">{fontSize}</span>
                    <button onClick={() => updateStyle('fontSize', Math.min(72, fontSize + 2))} className="p-1 hover:bg-white/10 rounded"><Plus size={12} /></button>
                </div>

                {/* Styling */}
                <div className="flex items-center gap-1 border-r border-[#2a3a4a] pr-2 mr-1">
                    <button
                        onClick={() => updateStyle('fontWeight', fontWeight === 'bold' ? 'normal' : 'bold')}
                        className={`p-1 rounded ${fontWeight === 'bold' ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/10 text-gray-400'}`}
                    >
                        <Bold size={14} />
                    </button>
                    <button
                        onClick={() => updateStyle('fontStyle', fontStyle === 'italic' ? 'normal' : 'italic')}
                        className={`p-1 rounded ${fontStyle === 'italic' ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/10 text-gray-400'}`}
                    >
                        <Italic size={14} />
                    </button>
                </div>

                {/* Color */}
                <div className="flex items-center gap-1 border-r border-[#2a3a4a] pr-2 mr-1">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            onClick={() => updateStyle('color', c)}
                            className={`w-3 h-3 rounded-full ${color === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>

                {/* Transparency Toggle */}
                <button
                    onClick={() => updateStyle('isTransparent', !isTransparent)}
                    className={`p-1 rounded ${isTransparent ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/10 text-gray-400'}`}
                    title="Toggle Transparency"
                >
                    {isTransparent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-1 pl-2 border-l border-[#2a3a4a]">
                    <button onClick={() => setIsEditing(!isEditing)} className={`p-1 rounded ${isEditing ? 'text-green-400' : 'hover:bg-white/10 text-gray-400'}`}>
                        {isEditing ? <Check size={14} /> : <Edit2 size={14} />}
                    </button>
                    <button onClick={() => removeNode(id)} className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded text-gray-400">
                        <Trash2 size={14} />
                    </button>
                </div>
            </NodeToolbar>

            <div
                className={`transition-all duration-200 min-w-[100px] min-h-[40px]
                    ${isTransparent
                        ? 'bg-transparent border-2 border-transparent hover:border-dashed hover:border-gray-700/50'
                        : 'bg-[#0f1419] border border-[#2a3a4a] rounded-lg shadow-2xl'
                    }
                    ${selected && !isTransparent ? '!border-[#00e5ff] ring-1 ring-[#00e5ff]/30' : ''}
                    ${selected && isTransparent ? '!border-dashed !border-gray-600' : ''}
                `}
            >
                {isEditing ? (
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onBlur={handleSave}
                        autoFocus
                        className="bg-[#1a2332] text-white p-2 rounded w-full h-full min-w-[200px] min-h-[100px] outline-none resize border border-[#00e5ff]"
                        style={{ fontSize, fontWeight: fontWeight as any, fontStyle: fontStyle as any, color }}
                        placeholder="Type your note here..."
                    />
                ) : (
                    <div
                        onDoubleClick={() => setIsEditing(true)}
                        className="p-4 whitespace-pre-wrap leading-relaxed cursor-text"
                        style={{
                            fontSize,
                            fontWeight: fontWeight as any,
                            fontStyle: fontStyle as any,
                            color,
                            fontFamily: 'inherit'
                        }}
                    >
                        {content || <span className="opacity-50 italic">Empty note...</span>}
                    </div>
                )}
            </div>
        </>
    );
};

export default memo(NoteNode);
