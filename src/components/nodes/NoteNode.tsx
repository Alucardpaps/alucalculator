'use client';

/**
 * AluCalc OS — Note Node
 * 
 * ReactFlow node for engineering annotations and documentation.
 * Supports markdown-style formatting.
 */

import React, { memo, useState, useCallback } from 'react';
import { NodeProps } from 'reactflow';
import { X, Edit2, Check, AlertTriangle, Info, BookOpen } from 'lucide-react';
import type { NoteNodeData } from '@/store/flowStore';
import { useFlowStore } from '@/store/flowStore';

// ============================================
// Styles
// ============================================

const styles = {
    node: `
        min-w-[250px] max-w-[400px] bg-[#0f1419] 
        rounded-lg shadow-2xl border border-[#2a3a4a]
        overflow-hidden
    `,
    nodeSelected: `
        border-[#00e5ff] ring-2 ring-[#00e5ff]/30
    `,
    header: `
        flex items-center justify-between gap-2 px-3 py-2
        bg-gradient-to-r from-[#1a2332] to-[#0f1419]
        border-b border-[#2a3a4a] cursor-move
    `,
    headerTitle: `
        text-xs font-bold text-gray-400 uppercase tracking-wider
        flex items-center gap-2
    `,
    headerBtn: `
        p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white
        transition-colors cursor-pointer
    `,
    body: `
        p-3
    `,
    content: `
        text-sm text-gray-300 whitespace-pre-wrap
        leading-relaxed
    `,
    editor: `
        w-full bg-[#1a2332] border border-[#2a3a4a] rounded
        text-sm text-gray-300 p-2 resize-none
        focus:outline-none focus:border-[#00e5ff]
        min-h-[100px]
    `,
    noteType: {
        info: 'border-l-4 border-l-blue-500 pl-3',
        warning: 'border-l-4 border-l-yellow-500 pl-3',
        assumption: 'border-l-4 border-l-purple-500 pl-3',
        default: '',
    },
};

// ============================================
// Note Type Detection
// ============================================

function detectNoteType(content: string): 'info' | 'warning' | 'assumption' | 'default' {
    const lower = content.toLowerCase();
    if (lower.startsWith('[warning]') || lower.startsWith('⚠')) return 'warning';
    if (lower.startsWith('[info]') || lower.startsWith('ℹ')) return 'info';
    if (lower.startsWith('[assumption]') || lower.startsWith('📌')) return 'assumption';
    return 'default';
}

const noteIcons = {
    info: Info,
    warning: AlertTriangle,
    assumption: BookOpen,
    default: null,
};

// ============================================
// Main Component
// ============================================

const NoteNode: React.FC<NodeProps<NoteNodeData>> = ({
    id,
    data,
    selected
}) => {
    const { removeNode, updateNodeData } = useFlowStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(data.content);

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        removeNode(id);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditContent(data.content);
    };

    const handleSave = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        updateNodeData(id, { content: editContent });
        setIsEditing(false);
    }, [id, editContent, updateNodeData]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsEditing(false);
        }
        if (e.key === 'Enter' && e.ctrlKey) {
            updateNodeData(id, { content: editContent });
            setIsEditing(false);
        }
    };

    const noteType = detectNoteType(data.content);
    const Icon = noteIcons[noteType];

    return (
        <div className={`${styles.node} ${selected ? styles.nodeSelected : ''}`}>
            {/* Header */}
            <div className={`${styles.header} draggable-handle`}>
                <div className={styles.headerTitle}>
                    {Icon && <Icon size={14} />}
                    NOTE
                </div>
                <div className="flex items-center gap-1">
                    {isEditing ? (
                        <button
                            className={`${styles.headerBtn} !text-green-400`}
                            onClick={handleSave}
                            title="Save (Ctrl+Enter)"
                        >
                            <Check size={12} />
                        </button>
                    ) : (
                        <button
                            className={styles.headerBtn}
                            onClick={handleEdit}
                            title="Edit"
                        >
                            <Edit2 size={12} />
                        </button>
                    )}
                    <button
                        className={styles.headerBtn}
                        onClick={handleClose}
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className={styles.body}>
                {isEditing ? (
                    <textarea
                        className={styles.editor}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        placeholder="Enter note content...&#10;&#10;Tip: Start with [WARNING], [INFO], or [ASSUMPTION] for special formatting."
                    />
                ) : (
                    <div className={`${styles.content} ${styles.noteType[noteType]}`}>
                        {data.content || 'Click edit to add content...'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(NoteNode);
