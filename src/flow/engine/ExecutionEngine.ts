import { Node, Edge } from 'reactflow';
import { getExecutionOrder } from './Graph';
import { EngineeringNodeSchema, ValidationResult } from '@/flow/types/core';
import { useFlowStore } from '@/store/flowStore'; // We'll need store access eventually

/**
 * 🧠 AluCalculator OS - Execution Engine
 * 
 * The Brain of the system.
 * 1. Validates Graph Topology
 * 2. Determines Execution Order
 * 3. Iterates Nodes & Computes Deterministically
 * 4. Propagates Data (Port to Port)
 */

export interface ExecutionResult {
    success: boolean;
    nodeResults: Map<string, any>; // NodeID -> OutputData
    errors: Map<string, string[]>; // NodeID -> ErrorList
    executionTimeMs: number;
}

export class FlowEngine {
    private nodes: Node[];
    private edges: Edge[];
    private registry: Map<string, EngineeringNodeSchema>;

    constructor(nodes: Node[], edges: Edge[], registry: Map<string, EngineeringNodeSchema>) {
        this.nodes = nodes;
        this.edges = edges;
        this.registry = registry;
    }

    private resultCache = new Map<string, { hash: string, output: any }>();

    /**
     * Run the full graph execution.
     */
    public execute(globalVariables: Record<string, number> = {}): ExecutionResult {
        const startTime = performance.now();
        const results = new Map<string, any>();
        const errors = new Map<string, string[]>();

        // 1. Topological Sort
        const order = getExecutionOrder(this.nodes, this.edges);
        if (!order.success) {
            return {
                success: false,
                nodeResults: results,
                errors: new Map([['GRAPH', [order.error || 'Cycle detected']]]),
                executionTimeMs: performance.now() - startTime
            };
        }

        // 2. Execution Loop
        for (const nodeId of order.sortedIds) {
            const node = this.nodes.find(n => n.id === nodeId);
            if (!node) continue;

            const schema = this.registry.get(node.data?.schemaId || '');

            // Skip if no schema (e.g. note nodes)
            // But strict mode requires us to be careful. 
            // For now, if no schema, we just skip computation.
            if (!schema) continue;

            // 3. Input Gathering
            // Pass globalVariables to resolve formulas
            const inputs = this.gatherInputs(nodeId, results, node.data, globalVariables);

            // 4. Input Hashing & Cache Check
            // We must include globalVariables in the hash if they are used!
            // Or simpler: disable cache if variables are used? 
            // Better: Just hash the resolved inputs.
            const inputHash = JSON.stringify(inputs); // Simple deterministic hash
            const cached = this.resultCache.get(nodeId);

            if (cached && cached.hash === inputHash) {
                // Cache Hit!
                results.set(nodeId, cached.output);
                continue;
            }

            // 5. Validation
            const validation = schema.validate(inputs);
            if (!validation.valid) {
                errors.set(nodeId, validation.errors);
                // In strict mode, we might stop here or propagate nulls.
                // For now, we don't cache invalid results.
                continue;
            }

            // 6. Computation
            try {
                const output = schema.compute(inputs);
                results.set(nodeId, output);

                // Update Cache
                this.resultCache.set(nodeId, { hash: inputHash, output });

            } catch (e) {
                errors.set(nodeId, [`Computation Error: ${e instanceof Error ? e.message : String(e)}`]);
            }
        }

        return {
            success: errors.size === 0,
            nodeResults: results,
            errors: errors,
            executionTimeMs: performance.now() - startTime
        };
    }

    private gatherInputs(nodeId: string, currentResults: Map<string, any>, nodeData: any, globalVariables: Record<string, number>): any {
        const inputs: any = { ...nodeData }; // Start with manual overrides/config

        // 0. Resolve Variables
        for (const key in inputs) {
            const val = inputs[key];
            if (typeof val === 'string' && val.startsWith('=')) {
                const varName = val.substring(1).trim();
                // If variable exists, use it. Otherwise keep the string (might be a legitimate string input)
                if (globalVariables[varName] !== undefined) {
                    inputs[key] = globalVariables[varName];
                }
            }
        }

        // 1. Find edges connected to target handle (input)
        const incomingEdges = this.edges.filter(e => e.target === nodeId);

        incomingEdges.forEach(edge => {
            const sourceNodeId = edge.source;
            const sourceHandle = edge.sourceHandle; // Output port name
            const targetHandle = edge.targetHandle; // Input port name

            if (!sourceHandle || !targetHandle) return;

            // Get value from source calculation
            const sourceResult = currentResults.get(sourceNodeId);
            if (sourceResult && sourceResult[sourceHandle] !== undefined) {
                inputs[targetHandle] = sourceResult[sourceHandle];
            }
        });

        return inputs;
    }
}
