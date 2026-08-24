/**
 * 🏛️ ALUCALCULATOR FLOW ENGINE
 * "The Conductor"
 */

import { DependencyGraph, GraphNode, GraphEdge } from "../kernel/graph";
import { ExecutionEngine } from "../kernel/execution";
import { CalculatorRegistry } from "../kernel/registry";

export class FlowEngine {
    private graph: DependencyGraph;
    private executor: ExecutionEngine;

    constructor() {
        this.graph = new DependencyGraph();
        this.executor = new ExecutionEngine(this.graph);
    }

    addNode(calculatorId: string): string {
        // Verify it exists in registry
        const schema = CalculatorRegistry.get(calculatorId);

        const id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

        this.graph.addNode({
            id,
            calculatorId: schema.id
        });

        return id;
    }

    connect(fromId: string, fromPort: string, toId: string, toPort: string) {
        this.graph.connect({
            fromNode: fromId,
            fromPort,
            toNode: toId,
            toPort
        });
    }

    run(inputs: Record<string, Record<string, number>>) {
        console.log("🌊 Flow Engine: Starting Execution...");
        return this.executor.execute(inputs);
    }

    getStructure() {
        return {
            nodes: this.graph.getNodes(),
            edges: this.graph.getEdges()
        };
    }
}
