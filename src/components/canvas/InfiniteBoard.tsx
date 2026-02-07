'use client';

import React, { useCallback } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    ReactFlowProvider,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useCanvasStore } from '@/store/canvas-store';
import ProfileNode from '../nodes/mech/ProfileNode';
import CostNode from '../nodes/finance/CostNode';
import CoPilotNode from '../nodes/ai/CoPilotNode';

// Grid Styling
const gridSize = 20;
const proOptions = { hideAttribution: true };

// Node Types Registry
const nodeTypes = {
    profileNode: ProfileNode,
    costNode: CostNode,
    aiNode: CoPilotNode
};

import RibbonBar from '@/components/ui/RibbonBar';
import Dock from '@/components/ui/Dock';

function Board() {
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useCanvasStore();

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#1e1e1e', position: 'relative' }}>
            {/* Layer 3: Floating UI */}
            <RibbonBar />
            <Dock />

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                proOptions={proOptions}
                fitView
                className="engineering-grid"
            >
                {/* Layer 0: Technical Grid */}
                <Background color="#333" gap={gridSize} size={1} />

                <Controls className="bg-[#2d2d30] border-none fill-white text-white" />
                <MiniMap
                    nodeColor="#00e5ff"
                    maskColor="rgba(30, 30, 30, 0.7)"
                    className="bg-[#252526] border border-[#333]"
                />

                <Panel position="top-right" className="bg-[#252526] p-2 rounded border border-[#333] text-xs text-gray-400 font-mono">
                    ALUCALC WORKBENCH AI v1.0 • SYSTEM ACTIVE
                </Panel>
            </ReactFlow>
        </div>
    );
}

export default function InfiniteBoard() {
    return (
        <ReactFlowProvider>
            <Board />
        </ReactFlowProvider>
    );
}
