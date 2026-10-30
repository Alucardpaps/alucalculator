import type { EngineeringNodeSchema, FlowGraphEdge, FlowGraphNode, NodeRunStatus } from '@/flow/types/core';
import { NODE_DATA_META_KEYS } from '@/flow/types/core';
import { collectDownstream, getExecutionOrder } from './Graph';
import { stableHash } from '../core/hash';
import { validateGraphPorts } from '../core/ports';

/**
 * AluCalculator OS — Execution Engine
 *
 * 1. Validate graph topology (cycles)
 * 2. Validate port types (exact match, no implicit cast)
 * 3. Topologically sort (deterministic)
 * 4. Apply schema defaults, gather wired inputs
 * 5. Validate → compute (hard-stop downstream on failure)
 * 6. Cache by input hash; recompute dirty subtree only
 *
 * Layer: flow/engine. No React, no DOM, no UI store.
 */

export interface ExecutionResult {
    success: boolean;
    nodeResults: Map<string, any>;
    errors: Map<string, string[]>;
    warnings: Map<string, string[]>;
    nodeStatus: Map<string, NodeRunStatus>;
    executionTimeMs: number;
}

export interface ExecuteOptions {
    /** Force every node, ignoring dirty set (hash cache still applies). */
    full?: boolean;
    globalVariables?: Record<string, number>;
}

const nowMs = (): number => {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        return performance.now();
    }
    return Date.now();
};

export class FlowEngine {
    private nodes: FlowGraphNode[];
    private edges: FlowGraphEdge[];
    private registry: Map<string, EngineeringNodeSchema>;
    private resultCache = new Map<string, { hash: string; output: any }>();
    private dirty = new Set<string>();

    constructor(
        nodes: FlowGraphNode[],
        edges: FlowGraphEdge[],
        registry: Map<string, EngineeringNodeSchema>
    ) {
        this.nodes = nodes;
        this.edges = edges;
        this.registry = registry;
    }

    public setGraph(nodes: FlowGraphNode[], edges: FlowGraphEdge[]): void {
        this.nodes = nodes;
        this.edges = edges;
    }

    public markDirty(nodeId: string): void {
        this.dirty.add(nodeId);
        collectDownstream(nodeId, this.edges).forEach((id) => this.dirty.add(id));
    }

    public clearCache(nodeId?: string): void {
        if (nodeId) {
            this.resultCache.delete(nodeId);
            this.markDirty(nodeId);
            return;
        }
        this.resultCache.clear();
        this.dirty.clear();
    }

    public execute(globalVariablesOrOptions: Record<string, number> | ExecuteOptions = {}): ExecutionResult {
        const options: ExecuteOptions =
            globalVariablesOrOptions && ('full' in globalVariablesOrOptions || 'globalVariables' in globalVariablesOrOptions)
                ? (globalVariablesOrOptions as ExecuteOptions)
                : { globalVariables: globalVariablesOrOptions as Record<string, number> };

        const globalVariables = options.globalVariables ?? {};
        const startTime = nowMs();
        const results = new Map<string, any>();
        const errors = new Map<string, string[]>();
        const warnings = new Map<string, string[]>();
        const nodeStatus = new Map<string, NodeRunStatus>();

        const order = getExecutionOrder(this.nodes, this.edges);
        if (!order.success) {
            return {
                success: false,
                nodeResults: results,
                errors: new Map([['GRAPH', [order.error || 'Cycle detected']]]),
                warnings,
                nodeStatus,
                executionTimeMs: nowMs() - startTime,
            };
        }

        const portCheck = validateGraphPorts(this.nodes, this.edges, this.registry);
        if (!portCheck.valid) {
            return {
                success: false,
                nodeResults: results,
                errors: new Map([['GRAPH', portCheck.mismatches.map((m) => m.message)]]),
                warnings,
                nodeStatus,
                executionTimeMs: nowMs() - startTime,
            };
        }

        const nodeMap = new Map(this.nodes.map((n) => [n.id, n]));
        const incomingByTarget = new Map<string, FlowGraphEdge[]>();
        for (const edge of this.edges) {
            const list = incomingByTarget.get(edge.target) ?? [];
            list.push(edge);
            incomingByTarget.set(edge.target, list);
        }

        const fullRun = options.full === true || this.dirty.size === 0;
        const blocked = new Set<string>();
        const recomputed = new Set<string>();

        for (const nodeId of order.sortedIds) {
            const node = nodeMap.get(nodeId);
            if (!node) continue;

            const schemaId = typeof node.data?.schemaId === 'string' ? node.data.schemaId : '';
            const schema = this.registry.get(schemaId);

            if (!schema) {
                nodeStatus.set(nodeId, 'skipped');
                continue;
            }

            const incoming = incomingByTarget.get(nodeId) ?? [];
            const upstreamFailed = incoming.some((e) => errors.has(e.source) || blocked.has(e.source));
            if (upstreamFailed) {
                blocked.add(nodeId);
                nodeStatus.set(nodeId, 'blocked');
                errors.set(nodeId, ['Blocked: upstream node failed validation or computation.']);
                continue;
            }

            const upstreamRecomputed = incoming.some((e) => recomputed.has(e.source) || this.dirty.has(e.source));
            const isDirty = fullRun || this.dirty.has(nodeId) || upstreamRecomputed;

            const inputs = this.gatherInputs(node, schema, results, globalVariables);

            const requiredErrors = this.checkRequiredPorts(schema, inputs);
            if (requiredErrors.length > 0) {
                errors.set(nodeId, requiredErrors);
                nodeStatus.set(nodeId, 'error');
                continue;
            }

            const inputHash = stableHash(inputs);
            const cached = this.resultCache.get(nodeId);

            if (!isDirty && cached) {
                results.set(nodeId, cached.output);
                nodeStatus.set(nodeId, 'cached');
                continue;
            }

            if (cached && cached.hash === inputHash) {
                results.set(nodeId, cached.output);
                nodeStatus.set(nodeId, 'cached');
                continue;
            }

            const validation = schema.validate(inputs);
            if (validation.warnings.length > 0) {
                warnings.set(nodeId, validation.warnings);
            }

            if (!validation.valid) {
                errors.set(nodeId, validation.errors.length ? validation.errors : ['Validation failed.']);
                nodeStatus.set(nodeId, 'error');
                continue;
            }

            try {
                const output = schema.compute(inputs);
                results.set(nodeId, output);
                this.resultCache.set(nodeId, { hash: inputHash, output });
                recomputed.add(nodeId);
                nodeStatus.set(nodeId, 'computed');
            } catch (e) {
                errors.set(nodeId, [`Computation Error: ${e instanceof Error ? e.message : String(e)}`]);
                nodeStatus.set(nodeId, 'error');
            }
        }

        this.dirty.clear();

        return {
            success: errors.size === 0,
            nodeResults: results,
            errors,
            warnings,
            nodeStatus,
            executionTimeMs: nowMs() - startTime,
        };
    }

    private checkRequiredPorts(schema: EngineeringNodeSchema, inputs: Record<string, unknown>): string[] {
        const missing: string[] = [];
        for (const port of schema.inputs) {
            if (!port.required) continue;
            const value = inputs[port.id];
            if (value === undefined || value === null || value === '') {
                missing.push(`Required port '${port.id}' (${port.type}) is not set.`);
            }
        }
        return missing;
    }

    private gatherInputs(
        node: FlowGraphNode,
        schema: EngineeringNodeSchema,
        currentResults: Map<string, any>,
        globalVariables: Record<string, number>
    ): Record<string, unknown> {
        const inputs: Record<string, unknown> = {};

        for (const port of schema.inputs) {
            if (port.defaultValue !== undefined) {
                inputs[port.id] = port.defaultValue;
            }
        }

        const data = node.data ?? {};
        for (const [key, value] of Object.entries(data)) {
            if (NODE_DATA_META_KEYS.has(key)) continue;
            inputs[key] = value;
        }

        for (const key of Object.keys(inputs)) {
            const val = inputs[key];
            if (typeof val === 'string' && val.startsWith('=')) {
                const varName = val.substring(1).trim();
                if (globalVariables[varName] !== undefined) {
                    inputs[key] = globalVariables[varName];
                }
            }
        }

        const incomingEdges = this.edges.filter((e) => e.target === node.id);
        incomingEdges.forEach((edge) => {
            const sourceHandle = edge.sourceHandle;
            const targetHandle = edge.targetHandle;
            if (!sourceHandle || !targetHandle) return;

            const sourceResult = currentResults.get(edge.source);
            if (sourceResult && sourceResult[sourceHandle] !== undefined) {
                inputs[targetHandle] = sourceResult[sourceHandle];
            }
        });

        return inputs;
    }
}
