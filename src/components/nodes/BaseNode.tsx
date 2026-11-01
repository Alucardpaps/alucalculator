'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { X, Minus, MoreVertical } from 'lucide-react';

export interface BaseNodeData {
    title: string;
    isMinimized?: boolean;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    // Callback to update node data
    onChange?: (id: string, data: any) => void;
}

const BaseNode = ({ id, data, children, selected }: { id: string, data: BaseNodeData, children: React.ReactNode, selected?: boolean }) => {

    return (
        <div className={`
            min-w-[300px] bg-[var(--bg-3)] rounded-lg shadow-xl border 
            ${selected ? 'border-accent ring-1 ring-accent' : 'border-[var(--line)]'}
            flex flex-col overflow-hidden transition-all duration-200
        `}>
            {/* HEADER - Mac/CAD Style */}
            <div className="h-8 bg-[var(--line-strong)] flex items-center justify-between px-2 cursor-move draggable-handle select-none border-b border-[var(--line)]">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--bad)] hover:bg-[var(--bad)]/80 cursor-pointer" title="Close" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--warn)] hover:bg-[var(--warn)]/80 cursor-pointer" title="Minimize" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--ok)] hover:bg-[var(--ok)]/80 cursor-pointer" title="Expand" />
                </div>
                <div className="text-xs font-bold text-gray-300 tracking-wide uppercase">{data.title}</div>
                <div className="text-gray-500 hover:text-white cursor-pointer">
                    <MoreVertical size={14} />
                </div>
            </div>

            {/* BODY */}
            {!data.isMinimized && (
                <div className="p-3 bg-[var(--bg-3)] text-gray-200 text-xs relative">
                    {children}
                </div>
            )}

            {/* HANDLES - Standardized Ports */}
            {/* Input Port (Left) */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-[var(--cyan)] border-2 border-[var(--line)]"
                style={{ left: -6 }}
            />
            {/* Output Port (Right) */}
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 bg-[var(--cyan)] border-2 border-[var(--line)]"
                style={{ right: -6 }}
            />
        </div>
    );
};

export default memo(BaseNode);
