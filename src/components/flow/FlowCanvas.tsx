import React, { useCallback, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    NodeTypes,
    Panel,
    ReactFlowProvider,
    useReactFlow,
    BackgroundVariant,
    ConnectionMode,
    DefaultEdgeOptions
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useFlowStore } from '@/store/flowStore';
import { useShallow } from 'zustand/react/shallow';
import styles from './FlowCanvas.module.css';

// Custom Nodes
import CalculatorNode from '@/components/nodes/CalculatorNode';
import MediaNode from '@/components/nodes/MediaNode';
import NoteNode from '@/components/nodes/NoteNode';
import NotebookNode from '@/components/nodes/NotebookNode';
import VisualizerNode from '@/components/nodes/VisualizerNode';
import StandardCalculatorNode from '@/components/nodes/StandardCalculatorNode';
import NestingNode from '@/components/nodes/NestingNode';
import ProfileNode from '@/components/nodes/mech/ProfileNode';
import CostNode from '@/components/nodes/finance/CostNode';
import CoPilotNode from '@/components/nodes/ai/CoPilotNode';
import EngineeringNode from '@/components/nodes/EngineeringNode';
import { NodePalette } from './NodePalette';
import { DrawingCanvas } from '@/components/flow/DrawingCanvas';
import { FlowVariableManager } from './FlowVariableManager';

const nodeTypes: NodeTypes = {
    calculator: CalculatorNode,
    media: MediaNode,
    note: NoteNode,
    notebook: NotebookNode,
    visualizer: VisualizerNode,
    'standard-calculator': StandardCalculatorNode,
    nesting: NestingNode,
    'engineering': EngineeringNode,
    'profile': ProfileNode,
    'cost': CostNode,
    'ai-copilot': CoPilotNode,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
    animated: true,
    style: {
        stroke: '#00e5ff',
        strokeWidth: 2,
        filter: 'drop-shadow(0px 0px 8px rgba(0, 229, 255, 0.6))'
    },
};

const FlowCanvasContent = () => {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addEngineeringNode,
        addCalculatorNode,
        addStandardCalculatorNode,
        addMediaNode,
        addNoteNode,
        addNotebookNode
    } = useFlowStore(useShallow(state => ({
        nodes: state.nodes,
        edges: state.edges,
        onNodesChange: state.onNodesChange,
        onEdgesChange: state.onEdgesChange,
        onConnect: state.onConnect,
        addEngineeringNode: state.addEngineeringNode,
        addCalculatorNode: state.addCalculatorNode,
        addStandardCalculatorNode: state.addStandardCalculatorNode,
        addMediaNode: state.addMediaNode,
        addNoteNode: state.addNoteNode,
        addNotebookNode: state.addNotebookNode
    })));
    const reactFlowInstance = useReactFlow();

    // Grid Snap
    const snapGrid: [number, number] = [20, 20];

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            const payloadStr = event.dataTransfer.getData('application/payload');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            // Handle Engineering Nodes
            if (type === 'engineering' && payloadStr) {
                try {
                    const payload = JSON.parse(payloadStr);
                    if (payload.schemaId) {
                        addEngineeringNode(payload.schemaId, position);
                        console.log('Added Engineering Node:', payload.schemaId);
                    }
                } catch (e) {
                    console.error('Failed to parse drop payload:', e);
                }
                return;
            }

            // Handle Legacy / Standard Nodes
            try {
                const payload = payloadStr ? JSON.parse(payloadStr) : {};

                switch (type) {
                    case 'calculator':
                        if (payload.schemaId) {
                            addCalculatorNode(payload.schemaId, position);
                        }
                        break;
                    case 'standard-calculator':
                        addStandardCalculatorNode(position);
                        break;
                    case 'visualizer':
                        if (payload.vizType) {
                            useFlowStore.getState().addVisualizerNode(payload.vizType, position);
                        }
                        break;
                    case 'media':
                        if (payload.mediaType && payload.url) {
                            addMediaNode(payload.mediaType, payload.url, position);
                        }
                        break;
                    case 'note':
                        addNoteNode(payload.content || 'New Note', position);
                        break;
                    case 'notebook':
                        addNotebookNode(payload.content, position);
                        break;
                    default:
                        console.warn('Unknown node type dropped:', type);
                }
            } catch (e) {
                console.error('Failed to handle drop:', e);
            }
        },
        [
            reactFlowInstance,
            addEngineeringNode,
            addCalculatorNode,
            addStandardCalculatorNode,
            addMediaNode,
            addNoteNode,
            addNotebookNode
        ]
    );

    return (
        <div className="w-full h-full bg-[#02050a] text-slate-200 font-sans relative flex">

            {/* Sidebar Palette */}
            <NodePalette />

            {/* Variable Manager (Invisible) */}
            <FlowVariableManager />

            {/* Main Canvas */}
            <div className="flex-1 h-full relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    defaultEdgeOptions={defaultEdgeOptions}
                    connectionMode={ConnectionMode.Loose}
                    snapToGrid={true}
                    snapGrid={snapGrid}
                    fitView
                    className={styles.flowCanvas}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                >
                    <Background
                        color="#0c2336"
                        gap={20}
                        size={1}
                        variant={BackgroundVariant.Dots}
                    />

                    {/* Darker Major Grid */}
                    <Background
                        color="#053347"
                        gap={100}
                        size={1}
                        variant={BackgroundVariant.Lines}
                        className="opacity-30"
                    />

                    <Controls className="!bg-[#0a0f16]/60 !backdrop-blur-md !border-cyan-900/30 !fill-cyan-500/80 [&>button]:!border-b-cyan-900/30 hover:[&>button]:!bg-cyan-900/40 !shadow-[0_0_15px_rgba(0,0,0,0.5)] !rounded-md overflow-hidden" />
                    <MiniMap
                        className="!bg-[#0a0f16]/60 !backdrop-blur-md !border-cyan-900/30 !shadow-[0_0_20px_rgba(0,0,0,0.8)] !rounded-md"
                        maskColor="rgba(2, 5, 10, 0.85)"
                        nodeColor={(n) => {
                            if (n.type === 'input') return 'rgba(234, 179, 8, 0.8)'; // amber
                            if (n.type === 'output') return 'rgba(16, 185, 129, 0.8)'; // emerald
                            if (n.type === 'visualizer') return 'rgba(168, 85, 247, 0.8)'; // purple
                            return 'rgba(0, 229, 255, 0.8)'; // cyan neon
                        }}
                    />

                    <Panel position="bottom-right" className="bg-[#0a0f16]/60 backdrop-blur-md border border-cyan-500/20 shadow-[0_0_15px_rgba(0,229,255,0.05)] px-3 py-1.5 rounded-md text-[9px] text-cyan-500 font-mono tracking-widest uppercase">
                        ENGINEERING OS v5.0 • ISO 9001 COMPLIANT
                    </Panel>

                    <DrawingCanvas />
                </ReactFlow>
            </div>
        </div>
    );
};

export default function FlowCanvas({ className }: { className?: string }) {
    return (
        <ReactFlowProvider>
            <div className={`${styles.container} ${className}`}>
                <FlowCanvasContent />
            </div>
        </ReactFlowProvider>
    );
}
