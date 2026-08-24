'use client';

/**
 * AluCalc OS — Notebook Node
 * 
 * A skeuomorphic paper-style note component.
 * Features:
 * - Lined paper background
 * - Handwritten font style
 * - resizing
 * - Auto-saving
 */

import React, { memo, useState, useCallback } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';
import { X, Trash2, Palette, GripVertical } from 'lucide-react';
import type { NotebookNodeData } from '@/store/flowStore';
import { useFlowStore } from '@/store/flowStore';

// ============================================
// Styles
// ============================================

const styles = {
    node: `
        group relative min-w-[300px] min-h-[400px]
        bg-[#fdfbf7] text-gray-800
        shadow-[5px_5px_15px_rgba(0,0,0,0.3)]
        transition-all duration-200
        font-serif
    `,
    nodeSelected: `
        ring-2 ring-[#00e5ff]/50
    `,
    body: `
        w-full h-full p-8 pt-12
        bg-[linear-gradient(#e5e5e5_1px,transparent_1px)]
        bg-[length:100%_30px]
        cursor-text
    `,
    input: `
        w-full h-full bg-transparent border-none resize-none
        focus:outline-none text-lg leading-[30px]
        font-medium text-[#2c3e50] overflow-hidden
    `,
    controls: `
        absolute top-0 right-0 p-2 flex gap-2
        opacity-0 group-hover:opacity-100 transition-opacity
        bg-white/50 backdrop-blur-sm rounded-bl-lg
    `,
    controlBtn: `
        p-1.5 rounded-full hover:bg-gray-200 text-gray-600
        transition-colors cursor-pointer
    `,
    dragHandle: `
        absolute top-0 left-0 w-full h-8
        cursor-move hover:bg-black/5
        flex items-center justify-center
    `,
    // Torn edge effect using CSS clip-path or mask could be added here
};

// ============================================
// Main Component
// ============================================

const NotebookNode: React.FC<NodeProps<NotebookNodeData>> = ({
    id,
    data,
    selected
}) => {
    const { removeNode, updateNodeData } = useFlowStore();
    const [content, setContent] = useState(data.content || '');

    // Debounced save could be better, but onBlur is simple for now
    const handleBlur = useCallback(() => {
        updateNodeData(id, { content });
    }, [id, content, updateNodeData]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        removeNode(id);
    };

    const handleColorChange = (color: string) => {
        updateNodeData(id, { color });
    };

    return (
        <div
            className={`${styles.node} ${selected ? styles.nodeSelected : ''}`}
            style={{ backgroundColor: data.color || '#fdfbf7' }}
        >
            <NodeResizer
                minWidth={300}
                minHeight={200}
                isVisible={selected}
                lineClassName="border-[#00e5ff]"
                handleClassName="h-3 w-3 bg-[#00e5ff] border-2 border-white rounded"
            />

            {/* Drag Handle (Top Strip) */}
            <div className={`${styles.dragHandle} draggable-handle`}>
                <GripVertical size={12} className="text-gray-300" />
            </div>

            {/* Hover Controls */}
            <div className={styles.controls}>
                <button
                    className={styles.controlBtn}
                    onClick={() => handleColorChange('#fdfbf7')}
                    title="White"
                >
                    <div className="w-3 h-3 rounded-full bg-[#fdfbf7] border border-gray-300" />
                </button>
                <button
                    className={styles.controlBtn}
                    onClick={() => handleColorChange('#fff9c4')}
                    title="Yellow"
                >
                    <div className="w-3 h-3 rounded-full bg-[#fff9c4] border border-gray-300" />
                </button>
                <button
                    className={styles.controlBtn}
                    onClick={handleDelete}
                    title="Delete Note"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Punch Holes (Visual) */}
            <div className="absolute left-3 top-0 bottom-0 flex flex-col justify-evenly pointer-events-none">
                <div className="w-3 h-3 rounded-full bg-[#0a0e14] opacity-80" />
                <div className="w-3 h-3 rounded-full bg-[#0a0e14] opacity-80" />
                <div className="w-3 h-3 rounded-full bg-[#0a0e14] opacity-80" />
            </div>

            {/* Red Margin Line */}
            <div className="absolute left-10 top-0 bottom-0 w-px bg-red-300/50 pointer-events-none" />

            {/* Content Area */}
            <div className={styles.body}>
                <textarea
                    className={styles.input}
                    value={content}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Write something..."
                    spellCheck={false}
                />
            </div>
        </div>
    );
};

export default memo(NotebookNode);
