
import React, { memo } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { NestingNodeData } from '@/store/flowStore';
import { useOSStore } from '@/store/osStore';
import { CuttingOptimizer } from '@/components/CuttingOptimizer';
import { Maximize2, X, GripHorizontal } from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';

const NestingNode = ({ id, data, selected }: NodeProps<NestingNodeData>) => {
    const { dictionary, currentLanguage: language } = useOSStore();
    const { removeNode } = useFlowStore();

    return (
        <div
            className={`
                relative flex flex-col
                bg-[#0f1419] border rounded-xl shadow-2xl
                transition-all duration-200
                min-w-[600px]
                ${selected ? 'border-cyan-500 shadow-cyan-500/20' : 'border-[#2a3a4a]'}
            `}
        >
            {/* Header / Drag Handle */}
            <div className="flex items-center justify-between h-9 px-3 bg-[#1a2332] border-b border-[#2a3a4a] rounded-t-xl cursor-grab active:cursor-grabbing text-xs select-none drag-handle">
                <div className="flex items-center gap-2 text-gray-400">
                    <GripHorizontal size={14} />
                    <span className="font-semibold tracking-wide text-gray-200">
                        {data.title || 'Nesting Optimizer'}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Implementation for maximize/minimize could go here
                        }}
                    >
                        <Maximize2 size={12} />
                    </button>
                    <button
                        className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            removeNode(id);
                        }}
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4 bg-[#0a0e14]/50">
                <div className="nodrag cursor-default">
                    {/* 
                      Stop propagation of wheel/scroll events so zooming the canvas 
                      doesn't interfere with scrolling lists inside the component 
                    */}
                    <div className="max-h-[600px] overflow-y-auto" onWheelCapture={(e) => e.stopPropagation()}>
                        <CuttingOptimizer dict={dictionary} lang={language} />
                    </div>
                </div>
            </div>

            {/* Input Handles (Optional, for driving stock length) */}
            <Handle
                type="target"
                position={Position.Left}
                id="input"
                className="!w-3 !h-3 !bg-[#2a3a4a] !border-2 !border-[#0f1419] hover:!bg-cyan-500 hover:!border-cyan-200 transition-colors"
            />
        </div>
    );
};

export default memo(NestingNode);
