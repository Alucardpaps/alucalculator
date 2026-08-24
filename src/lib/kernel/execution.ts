/**
 * 🏛️ ALUCALCULATOR KERNEL - EXECUTION
 * "The Engine Room"
 */

import { DependencyGraph } from './graph';
import { CalculatorRegistry } from './registry';
import { EngineeringValue, convert } from './types';
import { KernelError } from './errors';
import { auditLog } from '../traceability/audit'; // We'll implement this soon

export class ExecutionEngine {
    private graph: DependencyGraph;
    private results: Map<string, Record<string, EngineeringValue>> = new Map();

    constructor(graph: DependencyGraph) {
        this.graph = graph;
    }

    /**
     * Runs the graph execution.
     * @param inputs Map of { NodeID: { inputKey: number } }
     *               Initial inputs for source nodes.
     */
    execute(inputs: Record<string, Record<string, number>>): Map<string, Record<string, EngineeringValue>> {
        const order = this.graph.getExecutionOrder();
        this.results.clear();

        for (const nodeId of order) {
            const node = this.graph.getNode(nodeId);
            if (!node) continue;

            const schema = CalculatorRegistry.get(node.calculatorId);

            // Gather inputs
            // 1. From external inputs provided to execute()
            // 2. From upstream connections
            const nodeInputs: Record<string, number> = { ...(inputs[nodeId] || {}) };
            const upstreamDeps = this.graph.getEdges().filter(e => e.toNode === nodeId);

            for (const edge of upstreamDeps) {
                const upstreamResult = this.results.get(edge.fromNode);
                if (!upstreamResult) {
                    throw new KernelError(`Upstream node ${edge.fromNode} did not produce results.`);
                }

                const val = upstreamResult[edge.fromPort];

                // Validate unit match with target input schema
                const inputDef = schema.inputs.find(i => i.key === edge.toPort);
                if (!inputDef) {
                    throw new KernelError(`Node ${nodeId} has no input port ${edge.toPort}`);
                }

                // Auto-convert if possible, or throw
                const converted = convert(val, inputDef.unit);
                nodeInputs[edge.toPort] = converted.value;
            }

            // Compute
            const outputs = schema.compute(nodeInputs);
            this.results.set(nodeId, outputs);

            // Log Traceability
            auditLog.log({
                timestamp: new Date().toISOString(),
                calculatorId: schema.id,
                version: schema.version,
                inputs: nodeInputs,
                outputs: outputs,
                standards: schema.standards
            });
        }

        return this.results;
    }
}
