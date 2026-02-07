import { create } from 'zustand';
import {
    Connection,
    Edge,
    EdgeChange,
    Node,
    NodeChange,
    addEdge,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    applyNodeChanges,
    applyEdgeChanges
} from 'reactflow';

// Canvas State needs to handle both ReactFlow and Tldraw logic ideally
// For now, focusing on ReactFlow as primary logic engine

interface CanvasState {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    addNode: (node: Node) => void;
    updateNodeData: (id: string, data: any) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
    nodes: [
        {
            id: 'node-1',
            type: 'profileNode',
            position: { x: 100, y: 100 },
            data: { title: 'BOX PROFILE DETECTOR' }
        },
        {
            id: 'node-2',
            type: 'aiNode',
            position: { x: 500, y: 100 },
            data: { title: 'AI CO-PILOT' }
        },
        {
            id: 'node-3',
            type: 'costNode',
            position: { x: 100, y: 500 },
            data: { title: 'COST ESTIMATOR' }
        }
    ],
    edges: [],

    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },

    onConnect: (connection: Connection) => {
        set({
            edges: addEdge({ ...connection, animated: true, style: { stroke: '#00e5ff' } }, get().edges),
        });
    },

    addNode: (node: Node) => {
        set({
            nodes: [...get().nodes, node]
        });
    },

    updateNodeData: (id: string, data: any) => {
        set({
            nodes: get().nodes.map(node => {
                if (node.id === id) {
                    return { ...node, data: { ...node.data, ...data } };
                }
                return node;
            }),
        });
    }
}));
