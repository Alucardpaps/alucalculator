/**
 * AluCalc OS — Flow Editor Store
 * 
 * Zustand store for node-based calculator workflows.
 * Manages nodes, edges, data propagation, and circular dependency detection.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    Node,
    Edge,
    Connection,
    applyNodeChanges,
    applyEdgeChanges,
    NodeChange,
    EdgeChange,
    MarkerType
} from 'reactflow';
import type { CalculatorSchema } from '@/types/calculator-schema';
import { getCalculatorById } from '@/calculators/registry';

// ============================================
// Types
// ============================================

export type FlowNodeType = 'calculator' | 'media' | 'note' | 'notebook' | 'visualizer' | 'standard-calculator' | 'nesting' | 'engineering';

export interface NestingNodeData {
    type: 'nesting';
    title?: string;
}

export interface EngineeringNodeData {
    type: 'engineering';
    schemaId: string;
}

export type FlowNodeData = CalculatorNodeData | MediaNodeData | NoteNodeData | NotebookNodeData | VisualizerNodeData | StandardCalculatorNodeData | NestingNodeData | EngineeringNodeData;

// ... (in FlowActions interface)

// ... (rest of file)


export interface CalculatorNodeData {
    type: 'calculator';
    schemaId: string;
    schema: CalculatorSchema;
    inputs: Record<string, number>;
    inputFormulas?: Record<string, string>; // Store raw formulas (e.g. "=SafetyFactor")
    outputs: Record<string, number>;
    isComputing?: boolean;
    hasError?: boolean;
}

export interface VisualizerNodeData {
    type: 'visualizer';
    vizType: 'gear' | 'beam' | 'welding' | 'details' | 'chart' | 'profile' | 'box-profile' | '3d-box';
    inputs: Record<string, any>; // Dynamic inputs based on vizType
    title?: string;
}

export interface MediaNodeData {
    type: 'media';
    mediaType: 'youtube' | 'pdf' | 'image' | 'music' | 'excel' | 'word' | 'powerpoint';
    url: string;
    filePath?: string;
    title?: string;
}

export interface NoteNodeData {
    type: 'note';
    content: string;
    color?: string;
}

export interface NotebookNodeData {
    type: 'notebook';
    content: string;
    title?: string;
    color?: string; // Paper color (white, yellow, grid)
}

export interface StandardCalculatorNodeData {
    type: 'standard-calculator';
    expression?: string;
    result?: string;
    outputs?: Record<string, number>;
}



export interface FlowNode extends Node<FlowNodeData> {
    type: FlowNodeType;
}

// FlowEdge is just Edge with specific handle naming convention
export type FlowEdge = Edge & {
    sourceHandle?: string; // output key
    targetHandle?: string; // input key
};

export interface FlowProject {
    id: string;
    name: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
    createdAt: number;
    updatedAt: number;
}

// ============================================
// Store Interface
// ============================================

interface FlowState {
    nodes: FlowNode[];
    edges: FlowEdge[];
    selectedNodeId: string | null;
    isConnecting: boolean;
}

interface FlowActions {
    // Node operations
    addCalculatorNode: (schemaId: string, position?: { x: number; y: number }) => string;
    addVisualizerNode: (vizType: VisualizerNodeData['vizType'], position?: { x: number; y: number }) => string;
    addMediaNode: (mediaType: MediaNodeData['mediaType'], url: string, position?: { x: number; y: number }, filePath?: string) => string;
    addNoteNode: (content: string, position?: { x: number; y: number }) => string;
    addNotebookNode: (content?: string, position?: { x: number; y: number }) => string;
    addNestingNode: (position?: { x: number; y: number }) => string;
    addStandardCalculatorNode: (position?: { x: number; y: number }) => string;
    removeNode: (id: string) => void;
    updateNodeData: (id: string, data: Partial<FlowNodeData>) => void;
    updateNodePosition: (id: string, position: { x: number; y: number }) => void;
    setSelectedNode: (id: string | null) => void;
    addEngineeringNode: (schemaId: string, position?: { x: number; y: number }) => string;

    // Edge operations
    addEdge: (connection: Connection) => boolean;
    removeEdge: (id: string) => void;
    validateConnection: (connection: Connection) => { valid: boolean; error?: string };

    // ReactFlow handlers
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;

    // Data propagation
    propagateData: (sourceNodeId: string, freshOutputs?: Record<string, number>) => void;
    updateCalculatorInputs: (nodeId: string, inputs: Record<string, number>) => void;
    updateCalculatorFormula: (nodeId: string, key: string, formula: string | null) => void;
    updateCalculatorOutputs: (nodeId: string, outputs: Record<string, number>) => void;
    updateVisualizerInputs: (nodeId: string, inputs: Record<string, any>) => void;

    // Project operations
    clearFlow: () => void;
    loadFlow: (nodes: FlowNode[], edges: FlowEdge[]) => void;

    // Utilities
    getTopologicalOrder: () => string[];
    detectCycle: (newEdge: Connection) => boolean;
}

// ============================================
// Helper Functions
// ============================================

function generateId(): string {
    return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateEdgeId(source: string, target: string, sourceHandle: string, targetHandle: string): string {
    return `edge-${source}-${sourceHandle}-${target}-${targetHandle}`;
}

// ============================================
// Store Implementation
// ============================================

export const useFlowStore = create<FlowState & FlowActions>()(
    persist(
        (set, get) => ({
            nodes: [
                // 1. INPUTS (Left Side)
                { id: 'n-sheet', type: 'calculator', position: { x: 100, y: 100 }, data: { type: 'calculator', schemaId: 'sheet-metal', inputs: {}, outputs: {} } as any },
                { id: 'n-profile', type: 'calculator', position: { x: 100, y: 500 }, data: { type: 'calculator', schemaId: 'profile-weight', inputs: {}, outputs: {} } as any },

                // 2. PROCESSING (Middle)
                // { id: 'n-note-1', type: 'note', position: { x: 600, y: 100 }, data: { type: 'note', content: 'Main Calculation Logic' } as any },

                // 3. OUTPUTS / VISUALIZERS (Right Side)
                // { id: 'n-viz', type: 'visualizer', position: { x: 1000, y: 200 }, data: { type: 'visualizer', vizType: 'chart', inputs: {} } as any }
            ],
            edges: [],
            selectedNodeId: null,
            isConnecting: false,

            // ─────────────────────────────────────
            // Node Operations
            // ─────────────────────────────────────

            addCalculatorNode: (schemaId: string, position = { x: 100, y: 100 }) => {
                const schema = getCalculatorById(schemaId);
                if (!schema) {
                    return '';
                }

                const id = generateId();

                // Initialize with default values
                const inputs: Record<string, number> = {};
                schema.inputs.forEach(input => {
                    inputs[input.key] = input.default;
                });

                const newNode: FlowNode = {
                    id,
                    type: 'calculator',
                    position,
                    data: {
                        type: 'calculator',
                        schemaId,
                        schema,
                        inputs,
                        outputs: {},
                    },
                };

                set(state => ({
                    nodes: [...state.nodes, newNode],
                }));

                return id;
            },

            addVisualizerNode: (vizType: VisualizerNodeData['vizType'], position = { x: 100, y: 100 }) => {
                const id = generateId();

                const newNode: FlowNode = {
                    id,
                    type: 'visualizer',
                    position,
                    data: {
                        type: 'visualizer',
                        vizType,
                        inputs: {},
                        title: vizType.charAt(0).toUpperCase() + vizType.slice(1) + ' Visualizer',
                    },
                };

                set(state => ({
                    nodes: [...state.nodes, newNode],
                }));

                return id;
            },

            addMediaNode: (mediaType: MediaNodeData['mediaType'], url: string, position = { x: 100, y: 100 }, filePath?: string) => {
                const id = generateId();

                const newNode: FlowNode = {
                    id,
                    type: 'media',
                    position,
                    data: {
                        type: 'media',
                        mediaType,
                        url,
                        filePath,
                        title: filePath ? filePath.split(/[\\/]/).pop() : undefined, // Auto-title from filename
                    },
                };

                set(state => ({
                    nodes: [...state.nodes, newNode],
                }));

                return id;
            },

            addNoteNode: (content: string, position = { x: 100, y: 100 }) => {
                const id = generateId();

                const newNode: FlowNode = {
                    id,
                    type: 'note',
                    position,
                    data: {
                        type: 'note',
                        content,
                        color: '#1a2332',
                    },
                };

                set(state => ({
                    nodes: [...state.nodes, newNode],
                }));

                return id;
            },

            addNotebookNode: (content = '', position = { x: 100, y: 100 }) => {
                const id = generateId();

                const newNode: FlowNode = {
                    id,
                    type: 'notebook',
                    position,
                    data: {
                        type: 'notebook',
                        content,
                        title: 'Untitled Note',
                        color: '#fdfbf7', // Default paper color
                    },
                };

                set(state => ({
                    nodes: [...state.nodes, newNode],
                }));

                return id;
            },

            addNestingNode: (position = { x: 100, y: 100 }) => {
                const id = generateId();

                const newNode: FlowNode = {
                    id,
                    type: 'nesting',
                    position,
                    data: {
                        type: 'nesting',
                        title: 'Cutting Optimizer',
                    },
                };

                set(state => ({
                    nodes: [...state.nodes, newNode],
                }));

                return id;
            },

            addStandardCalculatorNode: (position = { x: 100, y: 100 }) => {
                const id = generateId();

                const newNode: FlowNode = {
                    id,
                    type: 'standard-calculator',
                    position,
                    data: {
                        type: 'standard-calculator',
                        expression: '',
                        result: '0',
                        outputs: {},
                    },
                };

                set(state => ({
                    nodes: [...state.nodes, newNode],
                }));

                return id;
            },

            removeNode: (id: string) => {
                set(state => ({
                    nodes: state.nodes.filter(n => n.id !== id),
                    edges: state.edges.filter(e => e.source !== id && e.target !== id),
                    selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
                }));
            },

            updateNodeData: (id: string, data: Partial<FlowNodeData>) => {
                set(state => ({
                    nodes: state.nodes.map(node =>
                        node.id === id
                            ? { ...node, data: { ...node.data, ...data } as FlowNodeData }
                            : node
                    ),
                }));
            },

            updateNodePosition: (id: string, position: { x: number; y: number }) => {
                set(state => ({
                    nodes: state.nodes.map(node =>
                        node.id === id ? { ...node, position } : node
                    ),
                }));
            },

            setSelectedNode: (id: string | null) => {
                set({ selectedNodeId: id });
            },

            addEngineeringNode: (schemaId: string, position = { x: 400, y: 100 }) => {
                const id = generateId();
                const newNode: FlowNode = {
                    id,
                    type: 'engineering',
                    position,
                    data: {
                        type: 'engineering',
                        schemaId
                    }
                };
                set(state => ({
                    nodes: [...state.nodes, newNode]
                }));
                return id;
            },

            // ─────────────────────────────────────
            // Edge Operations
            // ─────────────────────────────────────

            validateConnection: (connection: Connection) => {
                const { source, target, sourceHandle, targetHandle } = connection;

                // Self-connection not allowed
                if (source === target) {
                    return { valid: false, error: 'Cannot connect a node to itself' };
                }

                const { nodes, edges } = get();
                const sourceNode = nodes.find(n => n.id === source);
                const targetNode = nodes.find(n => n.id === target);

                if (!sourceNode || !targetNode) {
                    return { valid: false, error: 'Node not found' };
                }

                // Source must be calculator or standard-calculator
                if (sourceNode.data.type !== 'calculator' && sourceNode.data.type !== 'standard-calculator') {
                    return { valid: false, error: 'Only calculator outputs can be connected' };
                }

                // Target can be calculator OR visualizer
                if (targetNode.data.type !== 'calculator' && targetNode.data.type !== 'visualizer') {
                    return { valid: false, error: 'Target must be a calculator or visualizer' };
                }

                // Check if connection already exists
                const existingEdge = edges.find(e =>
                    e.target === target && e.targetHandle === targetHandle
                );
                if (existingEdge) {
                    return { valid: false, error: 'Input already connected' };
                }

                // Check for cycles
                if (get().detectCycle(connection)) {
                    return { valid: false, error: 'Connection would create a circular dependency' };
                }

                return { valid: true };
            },

            addEdge: (connection: Connection) => {
                const validation = get().validateConnection(connection);
                if (!validation.valid) {
                    console.warn('Invalid connection:', validation.error);
                    return false;
                }

                const { source, target, sourceHandle, targetHandle } = connection;
                if (!source || !target || !sourceHandle || !targetHandle) return false;

                const newEdge: FlowEdge = {
                    id: generateEdgeId(source, target, sourceHandle, targetHandle),
                    source,
                    target,
                    sourceHandle,
                    targetHandle,
                    animated: true,
                    style: { stroke: '#00e5ff', strokeWidth: 2 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#00e5ff',
                    },
                };

                set(state => ({
                    edges: [...state.edges, newEdge],
                }));

                // Trigger data propagation
                get().propagateData(source);

                return true;
            },

            removeEdge: (id: string) => {
                set(state => ({
                    edges: state.edges.filter(e => e.id !== id),
                }));
            },

            // ─────────────────────────────────────
            // ReactFlow Handlers
            // ─────────────────────────────────────

            onNodesChange: (changes: NodeChange[]) => {
                set(state => ({
                    nodes: applyNodeChanges(changes, state.nodes) as FlowNode[],
                }));
            },

            onEdgesChange: (changes: EdgeChange[]) => {
                set(state => ({
                    edges: applyEdgeChanges(changes, state.edges) as FlowEdge[],
                }));
            },

            onConnect: (connection: Connection) => {
                get().addEdge(connection);
            },

            // ─────────────────────────────────────
            // Data Propagation
            // ─────────────────────────────────────

            propagateData: (sourceNodeId: string, freshOutputs?: Record<string, number>) => {
                const { nodes, edges } = get();
                const sourceNode = nodes.find(n => n.id === sourceNodeId);

                if (!sourceNode) return;

                // Allow both schema-based calculators and standard calculator
                if (sourceNode.data.type !== 'calculator' && sourceNode.data.type !== 'standard-calculator') return;

                const sourceData = sourceNode.data as (CalculatorNodeData | StandardCalculatorNodeData);
                // Use fresh outputs if provided, otherwise fall back to state
                const outputs = freshOutputs || sourceData.outputs || {};

                // Find all edges from this source
                const outgoingEdges = edges.filter(e => e.source === sourceNodeId);

                outgoingEdges.forEach(edge => {
                    const targetNode = nodes.find(n => n.id === edge.target);
                    if (!targetNode) return;

                    const sourceHandle = edge.sourceHandle as string;
                    const targetHandle = edge.targetHandle as string;

                    // Get output value from source
                    let outputValue: number | undefined;

                    if (sourceHandle === 'output') {
                        // For generic 'output', take the first available output
                        // But for Variables, we expect specific handles (e.g. 'var-x')
                        const outputKeys = Object.keys(outputs);
                        if (outputKeys.length > 0) {
                            outputValue = outputs[outputKeys[0]];
                        }
                    } else {
                        // Handle usually matches the output key
                        outputValue = outputs[sourceHandle];
                    }

                    if (outputValue === undefined) return;

                    // Handle Target: Calculator
                    if (targetNode.data.type === 'calculator') {
                        const targetData = targetNode.data as CalculatorNodeData;
                        let inputKey: string;

                        if (targetHandle === 'input') {
                            inputKey = targetData.schema.inputs[0]?.key || '';
                        } else {
                            inputKey = targetHandle;
                        }

                        if (inputKey) {
                            get().updateCalculatorInputs(edge.target, {
                                ...targetData.inputs,
                                [inputKey]: outputValue,
                            });
                        }
                    }

                    // Handle Target: Visualizer
                    else if (targetNode.data.type === 'visualizer') {
                        const targetData = targetNode.data as VisualizerNodeData;
                        get().updateVisualizerInputs(edge.target, {
                            ...targetData.inputs,
                            [targetHandle]: outputValue,
                        });
                    }
                });
            },

            updateCalculatorInputs: (nodeId: string, inputs: Record<string, number>) => {
                set(state => ({
                    nodes: state.nodes.map(node => {
                        if (node.id !== nodeId || node.data.type !== 'calculator') return node;
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                inputs,
                            } as CalculatorNodeData,
                        };
                    }),
                }));
            },

            updateCalculatorFormula: (nodeId: string, key: string, formula: string | null) => {
                set(state => ({
                    nodes: state.nodes.map(node => {
                        if (node.id !== nodeId || node.data.type !== 'calculator') return node;

                        const currentFormulas = (node.data as CalculatorNodeData).inputFormulas || {};
                        const nextFormulas = { ...currentFormulas };

                        if (formula === null) {
                            delete nextFormulas[key];
                        } else {
                            nextFormulas[key] = formula;
                        }

                        return {
                            ...node,
                            data: {
                                ...node.data,
                                inputFormulas: nextFormulas,
                            } as CalculatorNodeData,
                        };
                    }),
                }));
            },

            updateCalculatorOutputs: (nodeId: string, outputs: Record<string, number>) => {
                set(state => ({
                    nodes: state.nodes.map(node => {
                        if (node.id !== nodeId || (node.data.type !== 'calculator' && node.data.type !== 'standard-calculator')) return node;
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                outputs,
                            } as (CalculatorNodeData | StandardCalculatorNodeData),
                        };
                    }),
                }));

                // Propagate to downstream nodes WITH the fresh outputs
                get().propagateData(nodeId, outputs);
            },

            updateVisualizerInputs: (nodeId: string, inputs: Record<string, any>) => {
                set(state => ({
                    nodes: state.nodes.map(node => {
                        if (node.id !== nodeId || node.data.type !== 'visualizer') return node;
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                inputs,
                            } as VisualizerNodeData,
                        };
                    }),
                }));
            },

            // ─────────────────────────────────────
            // Project Operations
            // ─────────────────────────────────────

            clearFlow: () => {
                set({ nodes: [], edges: [], selectedNodeId: null });
            },

            loadFlow: (nodes: FlowNode[], edges: FlowEdge[]) => {
                set({ nodes, edges, selectedNodeId: null });
            },

            // ─────────────────────────────────────
            // Utilities
            // ─────────────────────────────────────

            getTopologicalOrder: () => {
                const { nodes, edges } = get();
                const visited = new Set<string>();
                const result: string[] = [];

                const visit = (nodeId: string) => {
                    if (visited.has(nodeId)) return;
                    visited.add(nodeId);

                    // Visit all nodes that this node depends on
                    edges
                        .filter(e => e.target === nodeId)
                        .forEach(e => visit(e.source));

                    result.push(nodeId);
                };

                nodes.forEach(node => visit(node.id));
                return result;
            },

            detectCycle: (newEdge: Connection) => {
                const { nodes, edges } = get();
                const { source, target } = newEdge;
                if (!source || !target) return false;

                // DFS to detect if target can reach source
                const visited = new Set<string>();
                const stack = [target];

                while (stack.length > 0) {
                    const current = stack.pop()!;

                    if (current === source) {
                        return true; // Cycle detected!
                    }

                    if (visited.has(current)) continue;
                    visited.add(current);

                    // Add all nodes that current node connects to
                    edges
                        .filter(e => e.source === current)
                        .forEach(e => stack.push(e.target));
                }

                return false;
            },
        }),
        {
            name: 'alucalc-flow-state',
            partialize: (state) => ({
                nodes: state.nodes,
                edges: state.edges,
            }),
            // OPTIMIZATION: Debounce persistence to prevent high-frequency localStorage writes during drags
            storage: {
                getItem: (name) => {
                    const str = localStorage.getItem(name);
                    return str ? JSON.parse(str) : null;
                },
                setItem: (name, value) => {
                    // Simple debounce mechanism
                    if ((window as any)._flowPersistTimeout) clearTimeout((window as any)._flowPersistTimeout);
                    (window as any)._flowPersistTimeout = setTimeout(() => {
                        localStorage.setItem(name, JSON.stringify(value));
                    }, 1000); // 1-second debounce for heavy state
                },
                removeItem: (name) => localStorage.removeItem(name),
            },
        }
    )
);

// ============================================
// Selectors
// ============================================

export const selectNodes = (state: FlowState) => state.nodes;
export const selectEdges = (state: FlowState) => state.edges;
export const selectSelectedNode = (state: FlowState) =>
    state.nodes.find(n => n.id === state.selectedNodeId) || null;
export const selectCalculatorNodes = (state: FlowState) =>
    state.nodes.filter(n => n.data.type === 'calculator');

export const selectNestingNodes = (state: FlowState) =>
    state.nodes.filter(n => n.data.type === 'nesting');
