'use client';

/**
 * AluCalc OS — Flow Canvas
 * 
 * Main ReactFlow canvas for node-based calculation workflows.
 * Blueprint-style grid with Cyber-Industrial aesthetics.
 */

import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    Panel,
    NodeTypes,
    ConnectionMode,
    Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useFlowStore } from '@/store/flowStore';
import CalculatorNode from '@/components/nodes/CalculatorNode';
import MediaNode from '@/components/nodes/MediaNode';
import NoteNode from '@/components/nodes/NoteNode';
import FlowToolbar from './FlowToolbar';

// ============================================
// Node Types Registration
// ============================================

const nodeTypes: NodeTypes = {
    calculator: CalculatorNode,
    media: MediaNode,
    note: NoteNode,
};

// ============================================
// Custom Edge Styles
// ============================================

const defaultEdgeOptions = {
    style: {
        stroke: '#00e5ff',
        strokeWidth: 2,
    },
    animated: true,
};

// ============================================
// Styles
// ============================================

const styles = {
    container: `
        w-full h-full bg-[#0a0e14]
    `,
    minimap: {
        backgroundColor: '#0f1419',
        maskColor: 'rgba(0, 229, 255, 0.1)',
        nodeColor: '#1a2332',
    },
};

// ============================================
// Main Component
// ============================================

export interface FlowCanvasProps {
    className?: string;
}

const FlowCanvas: React.FC<FlowCanvasProps> = ({ className = '' }) => {
    const {
        nodes,
        edges,
        selectedNodeId,
        onNodesChange,
        onEdgesChange,
        onConnect,
        setSelectedNode,
        validateConnection,
    } = useFlowStore();

    // Handle node selection
    const handleSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: any[] }) => {
        const selected = selectedNodes?.[0];
        setSelectedNode(selected?.id || null);
    }, [setSelectedNode]);

    // Validate connections before allowing
    const isValidConnection = useCallback((connection: any) => {
        const validation = validateConnection(connection);
        return validation.valid;
    }, [validateConnection]);

    // Custom connection line style
    const connectionLineStyle = useMemo(() => ({
        stroke: '#00e5ff',
        strokeWidth: 2,
        strokeDasharray: '5 5',
    }), []);

    return (
        <div className={`${styles.container} ${className}`}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onSelectionChange={handleSelectionChange}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                connectionMode={ConnectionMode.Loose}
                isValidConnection={isValidConnection}
                connectionLineStyle={connectionLineStyle}
                fitView
                snapToGrid
                snapGrid={[20, 20]}
                minZoom={0.1}
                maxZoom={2}
                deleteKeyCode={['Backspace', 'Delete']}
                multiSelectionKeyCode={['Shift']}
                panOnScroll
                selectionOnDrag
                proOptions={{ hideAttribution: true }}
            >
                {/* Blueprint Grid Background */}
                <Background
                    variant={BackgroundVariant.Lines}
                    gap={20}
                    size={1}
                    color="#1a2332"
                />
                <Background
                    id="major-grid"
                    variant={BackgroundVariant.Lines}
                    gap={100}
                    size={1}
                    color="#2a3a4a"
                />

                {/* Controls */}
                <Controls
                    className="!bg-[#1a2332] !border-[#2a3a4a] !rounded-lg [&_button]:!bg-[#0f1419] [&_button]:!border-[#2a3a4a] [&_button:hover]:!bg-[#2a3a4a] [&_svg]:!fill-gray-400"
                    showInteractive={false}
                />

                {/* Mini Map */}
                <MiniMap
                    style={styles.minimap}
                    nodeStrokeColor="#00e5ff"
                    nodeColor={(node) => {
                        switch (node.type) {
                            case 'calculator': return '#00e5ff';
                            case 'media': return '#f59e0b';
                            case 'note': return '#8b5cf6';
                            default: return '#1a2332';
                        }
                    }}
                    maskColor="rgba(15, 20, 25, 0.8)"
                    pannable
                    zoomable
                />

                {/* Toolbar Panel */}
                <Panel position="top-left">
                    <FlowToolbar />
                </Panel>

                {/* Info Panel */}
                <Panel position="bottom-right">
                    <div className="bg-[#0f1419]/90 border border-[#2a3a4a] rounded-lg px-3 py-2 text-xs text-gray-500">
                        <span className="text-[#00e5ff]">{nodes.length}</span> nodes ·
                        <span className="text-[#00e5ff] ml-1">{edges.length}</span> connections
                    </div>
                </Panel>
            </ReactFlow>
        </div>
    );
};

export default FlowCanvas;
