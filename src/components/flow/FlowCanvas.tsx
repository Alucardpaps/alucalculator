import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    NodeTypes,
    EdgeTypes,
    Panel,
    ReactFlowProvider,
    useReactFlow,
    BackgroundVariant,
    ConnectionMode,
    DefaultEdgeOptions,
    type Connection
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useFlowStore } from '@/store/flowStore';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
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
import { FlowToolbar } from './FlowToolbar';
import { TopNodeRibbon } from './TopNodeRibbon';
import { QuickAddModal } from './QuickAddModal';
import { NodeInspector } from './NodeInspector';
if (typeof window !== 'undefined') {
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
        if (typeof args[0] === 'string' && args[0].includes('nodeTypes or edgeTypes')) {
            return;
        }
        originalWarn.apply(console, args);
    };
}

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

const edgeTypes: EdgeTypes = {};
const snapGrid: [number, number] = [20, 20];

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
        addNotebookNode,
        validateConnection,
        selectedNodeId,
        setSelectedNode
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
        addNotebookNode: state.addNotebookNode,
        validateConnection: state.validateConnection,
        selectedNodeId: state.selectedNodeId,
        setSelectedNode: state.setSelectedNode
    })));
    const reactFlowInstance = useReactFlow();
    const { language } = useI18nStore();

    // Quick Add & Inspector States
    const [quickAddOpen, setQuickAddOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.get('quickAdd') === '1';
        }
        return false;
    });
    const [quickAddPosition, setQuickAddPosition] = useState({ x: 400, y: 200 });
    const [showInspector, setShowInspector] = useState(false);
    const [showPalette, setShowPalette] = useState(false);
    const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });

    // Open inspector automatically when a node is selected
    useEffect(() => {
        if (selectedNodeId) {
            setShowInspector(true);
        }
    }, [selectedNodeId]);

    // Space key listener for quick add
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                return;
            }
            if (e.code === 'Space' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                const centerPos = reactFlowInstance.screenToFlowPosition({
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2,
                });
                setQuickAddPosition(centerPos);
                setQuickAddOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [reactFlowInstance]);

    const isValidConnection = useCallback((connection: Connection) => {
        return validateConnection(connection).valid;
    }, [validateConnection]);

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
        <div className="w-full h-full bg-[var(--bg-0)] text-slate-200 font-sans relative flex flex-col overflow-hidden">
            {/* Master Studio Command Ribbon */}
            <FlowToolbar
                showPalette={showPalette}
                onTogglePalette={() => setShowPalette(!showPalette)}
                showInspector={showInspector}
                onToggleInspector={() => setShowInspector(!showInspector)}
            />

            {/* Top Categorized Node Ribbon with Downward Mega-Drawers */}
            <TopNodeRibbon
                onNodeAdded={(nodeId) => {
                    setSelectedNode(nodeId);
                }}
            />

            {/* Variable Manager (Invisible) */}
            <FlowVariableManager />

            {/* Studio Workspace: Palette + Canvas + Inspector */}
            <div className="flex-1 min-h-0 flex relative overflow-hidden">
                {/* Collapsible Left Palette */}
                {showPalette && (
                    <NodePalette onClose={() => setShowPalette(false)} />
                )}

                {/* Main Interactive Canvas */}
                <div
                    className="flex-1 h-full relative"
                    onMouseMove={(e) => {
                        const pos = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
                        setMouseCoords({ x: Math.round(pos.x), y: Math.round(pos.y) });
                    }}
                >
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={(_event, node) => setSelectedNode(node.id)}
                        onPaneClick={() => setSelectedNode(null)}
                        onDoubleClick={(e) => {
                            const pos = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
                            setQuickAddPosition(pos);
                            setQuickAddOpen(true);
                        }}
                        isValidConnection={isValidConnection}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        defaultEdgeOptions={defaultEdgeOptions}
                        onError={(code, message) => {
                            if (code === '002') return;
                            console.warn(`[React Flow]: ${message}`);
                        }}
                        connectionMode={ConnectionMode.Strict}
                        snapToGrid={true}
                        snapGrid={snapGrid}
                        fitView
                        proOptions={{ hideAttribution: true }}
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
                            className="opacity-25"
                        />

                        <Controls className="!bg-[var(--bg-1)]/80 ! !border-cyan-500/30 !fill-cyan-400 [&>button]:!border-b-cyan-900/40 hover:[&>button]:!bg-cyan-900/40 ! !rounded-lg overflow-hidden" />
                        <MiniMap
                            className="!bg-[var(--bg-1)]/80 ! !border-cyan-500/30 ! !rounded-lg"
                            maskColor="rgba(3, 7, 18, 0.88)"
                            nodeColor={(n) => {
                                if (n.type === 'input') return 'rgba(245, 158, 11, 0.9)'; // amber
                                if (n.type === 'output') return 'rgba(16, 185, 129, 0.9)'; // emerald
                                if (n.type === 'visualizer') return 'rgba(168, 85, 247, 0.9)'; // purple
                                return 'rgba(0, 229, 255, 0.9)'; // cyan neon
                            }}
                        />

                        <DrawingCanvas />
                    </ReactFlow>
                </div>

                {/* Right Inspector Drawer */}
                {showInspector && (
                    <NodeInspector onClose={() => setShowInspector(false)} />
                )}
            </div>

            {/* Bottom Telemetry Status Bar */}
            <footer className="h-7 bg-[var(--bg-0)] border-t border-cyan-950/60 px-4 flex items-center justify-between text-[9px] font-mono text-slate-400 select-none shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        {t12(language, 'CANVAS:', 'TUVAL:')} X: {mouseCoords.x} mm, Y: {mouseCoords.y} mm
                    </span>
                    <span className="text-slate-700">|</span>
                    <span className="text-slate-400">FLOW ENGINE v1.1.0 · {t12(language, 'RIGIDITY LOCKED (NX-STYLE)', 'KATILIK KİLİTLİ (NX-STYLE)')}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                    <span className="hover:text-cyan-300 transition-colors">[{t12(language, 'SPACE', 'BOŞLUK')}] {t12(language, 'Quick Add', 'Hızlı Düğüm')}</span>
                    <span>·</span>
                    <span className="hover:text-cyan-300 transition-colors">[CTRL+ENTER] {t12(language, 'Solve', 'Çözümle')}</span>
                    <span>·</span>
                    <span className="hover:text-cyan-300 transition-colors">[F] {t12(language, 'Fit View', 'Odakla')}</span>
                    <span>·</span>
                    <span className="hover:text-cyan-300 transition-colors">[{t12(language, 'DOUBLE CLICK', 'ÇİFT TIK')}] {t12(language, 'Add Node', 'Düğüm Ekle')}</span>
                </div>
            </footer>

            {/* Quick Add Modal */}
            <QuickAddModal
                isOpen={quickAddOpen}
                onClose={() => setQuickAddOpen(false)}
                spawnPosition={quickAddPosition}
            />
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
