import type { FlowGraphEdge, FlowGraphNode } from '../types/core';

/**
 * AluCalculator OS — Topological Sort Engine
 *
 * Kahn's algorithm with deterministic tie-breaking (sorted node ids).
 * Detects cycles. Independent of React Flow.
 */

export interface ExecutionOrderResult {
    success: boolean;
    sortedIds: string[];
    error?: string;
    details?: string[];
}

export const getExecutionOrder = (
    nodes: FlowGraphNode[],
    edges: FlowGraphEdge[]
): ExecutionOrderResult => {
    const adjacencyList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    const nodeIds = new Set(nodes.map((n) => n.id));

    nodes.forEach((node) => {
        adjacencyList.set(node.id, []);
        inDegree.set(node.id, 0);
    });

    edges.forEach((edge) => {
        if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
            return;
        }
        adjacencyList.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });

    adjacencyList.forEach((neighbors, id) => {
        neighbors.sort((a, b) => a.localeCompare(b));
        adjacencyList.set(id, neighbors);
    });

    const queue: string[] = [];
    inDegree.forEach((degree, id) => {
        if (degree === 0) queue.push(id);
    });
    queue.sort((a, b) => a.localeCompare(b));

    const sortedOrder: string[] = [];

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        sortedOrder.push(currentId);

        const neighbors = adjacencyList.get(currentId) || [];
        const newlyReady: string[] = [];
        neighbors.forEach((neighborId) => {
            inDegree.set(neighborId, (inDegree.get(neighborId) || 0) - 1);
            if (inDegree.get(neighborId) === 0) {
                newlyReady.push(neighborId);
            }
        });
        newlyReady.sort((a, b) => a.localeCompare(b));
        queue.push(...newlyReady);
    }

    if (sortedOrder.length !== nodes.length) {
        const cycleNodes: string[] = [];
        inDegree.forEach((degree, id) => {
            if (degree > 0) cycleNodes.push(id);
        });
        cycleNodes.sort((a, b) => a.localeCompare(b));

        return {
            success: false,
            sortedIds: [],
            error: 'Circular dependency detected.',
            details: cycleNodes,
        };
    }

    return {
        success: true,
        sortedIds: sortedOrder,
    };
};

export function collectDownstream(rootId: string, edges: FlowGraphEdge[]): Set<string> {
    const out = new Set<string>();
    const stack = [rootId];
    while (stack.length > 0) {
        const current = stack.pop()!;
        for (const edge of edges) {
            if (edge.source === current && !out.has(edge.target)) {
                out.add(edge.target);
                stack.push(edge.target);
            }
        }
    }
    return out;
}
