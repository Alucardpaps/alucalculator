/**
 * 🏛️ ALUCALCULATOR KERNEL - GRAPH
 * "The Network of Truth"
 */

import { CircularDependencyError } from './errors';

export interface GraphNode {
    id: string; // Unique instance ID
    calculatorId: string; // Reference to Schema ID
}

export interface GraphEdge {
    fromNode: string;
    fromPort: string;
    toNode: string;
    toPort: string;
}

export class DependencyGraph {
    private nodes: Map<string, GraphNode> = new Map();
    private edges: GraphEdge[] = [];

    addNode(node: GraphNode): void {
        if (this.nodes.has(node.id)) {
            throw new Error(`Node ID collision: ${node.id}`);
        }
        this.nodes.set(node.id, node);
    }

    connect(edge: GraphEdge): void {
        if (!this.nodes.has(edge.fromNode) || !this.nodes.has(edge.toNode)) {
            throw new Error('Cannot connect unknown nodes');
        }

        // Tentatively add edge check for cycles
        this.edges.push(edge);

        try {
            this.detectCycle();
        } catch (e) {
            // Rollback
            this.edges.pop();
            throw e;
        }
    }

    getNodes(): GraphNode[] {
        return Array.from(this.nodes.values());
    }

    getEdges(): GraphEdge[] {
        return [...this.edges];
    }

    getNode(id: string): GraphNode | undefined {
        return this.nodes.get(id);
    }

    /**
     * Topological Sort
     * Returns execution order of Node IDs.
     */
    getExecutionOrder(): string[] {
        const visited = new Set<string>();
        const order: string[] = [];
        const adj = this.getAdjacencyList();

        const visit = (nodeId: string) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);

            const neighbors = adj.get(nodeId) || [];
            for (const neighbor of neighbors) {
                visit(neighbor);
            }
            order.push(nodeId);
        };

        // Start with nodes that have no incoming edges (roughly)
        // Actually standard DFS post-order gives reverse topological
        // But for a full generic sort:
        this.nodes.forEach((_, id) => {
            if (!visited.has(id)) {
                visit(id);
            }
        });

        return order.reverse();
    }

    detectCycle(): void {
        const adj = this.getAdjacencyList();
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const check = (nodeId: string) => {
            visited.add(nodeId);
            recursionStack.add(nodeId);

            const neighbors = adj.get(nodeId) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    check(neighbor);
                } else if (recursionStack.has(neighbor)) {
                    throw new CircularDependencyError(`${nodeId} -> ${neighbor}`);
                }
            }

            recursionStack.delete(nodeId);
        };

        this.nodes.forEach((_, id) => {
            if (!visited.has(id)) {
                check(id);
            }
        });
    }

    private getAdjacencyList(): Map<string, string[]> {
        const adj = new Map<string, string[]>();
        this.edges.forEach(e => {
            if (!adj.has(e.fromNode)) adj.set(e.fromNode, []);
            adj.get(e.fromNode)?.push(e.toNode);
        });
        return adj;
    }
}
