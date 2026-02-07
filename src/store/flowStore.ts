/**
 * AluCalc OS — Flow Editor Store
 * 
 * Zustand store for node-based calculator workflows.
 * Manages nodes, edges, data propagation, and circular dependency detection.
 * 
 * DEEP ANALYSIS (ULTRATHINK):
 * ─────────────────────────────────────────────────────────────────────
 * 1. DATA FLOW ARCHITECTURE
 *    - Nodes are calculator instances with schema reference
 *    - Edges connect output ports to input ports
 *    - Data propagation uses topological sort for deterministic order
 *    - Circular dependencies MUST be detected and BLOCKED
 * 
 * 2. STATE CONSISTENCY
 *    - Node data is immutable-style updates
 *    - Edge validation before connection
 *    - Undo/redo support via history stack (future)
 * 
 * 3. PERFORMANCE
 *    - Selective re-computation (only affected nodes)
 *    - Debounced propagation for rapid input changes
 * ─────────────────────────────────────────────────────────────────────
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

export type FlowNodeType = 'calculator' | 'media' | 'note';

export interface CalculatorNodeData {
    type: 'calculator';
    schemaId: string;
    schema: CalculatorSchema;
    inputs: Record<string, number>;
    outputs: Record<string, number>;
    isComputing?: boolean;
    hasError?: boolean;
}

export interface MediaNodeData {
    type: 'media';
    mediaType: 'youtube' | 'pdf' | 'image';
    url: string;
    title?: string;
}

export interface NoteNodeData {
    type: 'note';
    content: string;
    color?: string;
}

export type FlowNodeData = CalculatorNodeData | MediaNodeData | NoteNodeData;

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
    addMediaNode: (mediaType: 'youtube' | 'pdf', url: string, position?: { x: number; y: number }) => string;
    addNoteNode: (content: string, position?: { x: number; y: number }) => string;
    removeNode: (id: string) => void;
    updateNodeData: (id: string, data: Partial<FlowNodeData>) => void;
    updateNodePosition: (id: string, position: { x: number; y: number }) => void;
    setSelectedNode: (id: string | null) => void;

    // Edge operations
    addEdge: (connection: Connection) => boolean;
    removeEdge: (id: string) => void;
    validateConnection: (connection: Connection) => { valid: boolean; error?: string };

    // ReactFlow handlers
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;

    // Data propagation
    propagateData: (sourceNodeId: string) => void;
    updateCalculatorInputs: (nodeId: string, inputs: Record<string, number>) => void;
    updateCalculatorOutputs: (nodeId: string, outputs: Record<string, number>) => void;

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
            nodes: [],
            edges: [],
            selectedNodeId: null,
            isConnecting: false,

            // ─────────────────────────────────────
            // Node Operations
            // ─────────────────────────────────────

            addCalculatorNode: (schemaId: string, position = { x: 100, y: 100 }) => {
                const schema = getCalculatorById(schemaId);
                if (!schema) {
                    console.error(`Schema not found: ${schemaId}`);
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

            addMediaNode: (mediaType: 'youtube' | 'pdf', url: string, position = { x: 100, y: 100 }) => {
                const id = generateId();

                const newNode: FlowNode = {
                    id,
                    type: 'media',
                    position,
                    data: {
                        type: 'media',
                        mediaType,
                        url,
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

                // Only calculator nodes can be wired
                if (sourceNode.data.type !== 'calculator' || targetNode.data.type !== 'calculator') {
                    return { valid: false, error: 'Only calculator nodes can be connected' };
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

            propagateData: (sourceNodeId: string) => {
                const { nodes, edges } = get();
                const sourceNode = nodes.find(n => n.id === sourceNodeId);

                if (!sourceNode || sourceNode.data.type !== 'calculator') return;

                const sourceData = sourceNode.data as CalculatorNodeData;

                // Find all edges from this source
                const outgoingEdges = edges.filter(e => e.source === sourceNodeId);

                outgoingEdges.forEach(edge => {
                    const targetNode = nodes.find(n => n.id === edge.target);
                    if (!targetNode || targetNode.data.type !== 'calculator') return;

                    const targetData = targetNode.data as CalculatorNodeData;
                    const outputKey = edge.sourceHandle as string;
                    const inputKey = edge.targetHandle as string;

                    const outputValue = sourceData.outputs[outputKey];

                    if (outputValue !== undefined) {
                        // Update target node's input
                        get().updateCalculatorInputs(edge.target, {
                            ...targetData.inputs,
                            [inputKey]: outputValue,
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

            updateCalculatorOutputs: (nodeId: string, outputs: Record<string, number>) => {
                set(state => ({
                    nodes: state.nodes.map(node => {
                        if (node.id !== nodeId || node.data.type !== 'calculator') return node;
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                outputs,
                            } as CalculatorNodeData,
                        };
                    }),
                }));

                // Propagate to downstream nodes
                get().propagateData(nodeId);
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
