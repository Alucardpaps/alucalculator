import { Edge, Node } from 'reactflow';

/**
 * 🧠 AluCalculator OS - Topological Sort Engine
 * 
 * Determines the execution order of nodes based on dependencies.
 * Implements Kahn's Algorithm for topological sorting.
 * Detects cycles to prevent infinite loops.
 */

export interface ExecutionOrderResult {
    success: boolean;
    sortedIds: string[];
    error?: string;
    details?: string[]; // IDs involved in cycle
}

/**
 * Sorts nodes topologically.
 * Returns an ordered list of Node IDs.
 */
export const getExecutionOrder = (nodes: Node[], edges: Edge[]): ExecutionOrderResult => {
    // 1. Build Adjacency List & In-Degree Map
    const adjacencyList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize maps
    nodes.forEach(node => {
        adjacencyList.set(node.id, []);
        inDegree.set(node.id, 0);
    });

    // Populate maps from edges
    edges.forEach(edge => {
        // Valid edge check: source and target must exist in nodes
        if (!adjacencyList.has(edge.source) || !adjacencyList.has(edge.target)) {
            console.warn(`Edge refers to missing node: ${edge.source} -> ${edge.target}`);
            return;
        }

        adjacencyList.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });

    // 2. Kahn's Algorithm
    const queue: string[] = [];
    const sortedOrder: string[] = [];

    // Find all nodes with 0 in-degree (start nodes)
    inDegree.forEach((degree, id) => {
        if (degree === 0) {
            queue.push(id);
        }
    });

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        sortedOrder.push(currentId);

        const neighbors = adjacencyList.get(currentId) || [];
        neighbors.forEach(neighborId => {
            inDegree.set(neighborId, (inDegree.get(neighborId) || 0) - 1);
            if (inDegree.get(neighborId) === 0) {
                queue.push(neighborId);
            }
        });
    }

    // 3. Cycle Detection
    if (sortedOrder.length !== nodes.length) {
        // Cycle detected or disconnected graph issues (though disconnected is fine usually)
        // If sorting didn't visit all nodes, it means there's a cycle.

        // Identify nodes involved in cycle (those with in-degree > 0 remaining)
        const cycleNodes: string[] = [];
        inDegree.forEach((degree, id) => {
            if (degree > 0) cycleNodes.push(id);
        });

        return {
            success: false,
            sortedIds: [],
            error: 'Circular dependency detected.',
            details: cycleNodes
        };
    }

    return {
        success: true,
        sortedIds: sortedOrder
    };
};
