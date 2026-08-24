/**
 * AluCalculator Engineering Kernel — Engineering Graph
 * 
 * Node-Based Dependency Flow System
 * 
 * This creates a directed acyclic graph (DAG) of engineering calculations
 * where outputs of one node become inputs to another, with full
 * validation propagation.
 */

// ============================================
// TYPES
// ============================================

export type NodeStatus = 'valid' | 'warning' | 'error' | 'pending' | 'stale';
export type DataType = 'number' | 'string' | 'boolean' | 'geometry' | 'material' | 'array';

export interface Port {
    id: string;
    name: string;
    dataType: DataType;
    unit?: string;
    required?: boolean;
    description?: string;
}

export interface InputPort extends Port {
    defaultValue?: unknown;
    validation?: PortValidation;
}

export interface OutputPort extends Port {
    formula?: string;
}

export interface PortValidation {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: unknown) => ValidationMessage | null;
}

export interface ValidationMessage {
    level: 'info' | 'warning' | 'error';
    code: string;
    message: string;
    source?: string; // Reference to standard/formula
}

export interface NodeDefinition {
    type: string;
    name: string;
    category: string;
    description: string;
    icon?: string;
    inputs: InputPort[];
    outputs: OutputPort[];
    compute: (inputs: Record<string, unknown>) => ComputeResult;
}

export interface ComputeResult {
    outputs: Record<string, unknown>;
    status: NodeStatus;
    messages: ValidationMessage[];
    metadata?: Record<string, unknown>;
}

export interface NodeInstance {
    id: string;
    type: string;
    position: { x: number; y: number };
    inputValues: Record<string, unknown>;
    outputValues: Record<string, unknown>;
    status: NodeStatus;
    messages: ValidationMessage[];
}

export interface Connection {
    id: string;
    sourceNodeId: string;
    sourcePortId: string;
    targetNodeId: string;
    targetPortId: string;
}

export interface EngineeringGraph {
    id: string;
    name: string;
    nodes: NodeInstance[];
    connections: Connection[];
    metadata?: {
        author?: string;
        created?: Date;
        modified?: Date;
        version?: string;
    };
}

// ============================================
// NODE REGISTRY
// ============================================

const nodeDefinitions: Map<string, NodeDefinition> = new Map();

export function registerNode(definition: NodeDefinition): void {
    nodeDefinitions.set(definition.type, definition);
}

export function getNodeDefinition(type: string): NodeDefinition | undefined {
    return nodeDefinitions.get(type);
}

export function getAllNodeTypes(): string[] {
    return Array.from(nodeDefinitions.keys());
}

export function getNodesByCategory(category: string): NodeDefinition[] {
    return Array.from(nodeDefinitions.values()).filter(n => n.category === category);
}

// ============================================
// GRAPH ENGINE
// ============================================

export class GraphEngine {
    private graph: EngineeringGraph;
    private definitionCache: Map<string, NodeDefinition> = new Map();

    constructor(graph: EngineeringGraph) {
        this.graph = graph;
    }

    /**
     * Execute the entire graph
     * Returns execution order and results
     */
    execute(): GraphExecutionResult {
        const executionOrder = this.topologicalSort();
        const results: NodeExecutionResult[] = [];
        const startTime = performance.now();

        // Build value cache
        const valueCache: Map<string, Record<string, unknown>> = new Map();

        for (const nodeId of executionOrder) {
            const node = this.graph.nodes.find(n => n.id === nodeId);
            if (!node) continue;

            const definition = this.getDefinition(node.type);
            if (!definition) {
                results.push({
                    nodeId,
                    status: 'error',
                    messages: [{ level: 'error', code: 'UNKNOWN_TYPE', message: `Unknown node type: ${node.type}` }],
                    outputs: {},
                });
                continue;
            }

            // Gather inputs
            const inputs: Record<string, unknown> = { ...node.inputValues };

            // Get values from connected nodes
            const incomingConnections = this.graph.connections.filter(c => c.targetNodeId === nodeId);
            for (const conn of incomingConnections) {
                const sourceOutputs = valueCache.get(conn.sourceNodeId);
                if (sourceOutputs && conn.sourcePortId in sourceOutputs) {
                    inputs[conn.targetPortId] = sourceOutputs[conn.sourcePortId];
                }
            }

            // Validate required inputs
            const missingInputs = definition.inputs
                .filter(i => i.required && !(i.id in inputs))
                .map(i => i.name);

            if (missingInputs.length > 0) {
                results.push({
                    nodeId,
                    status: 'error',
                    messages: [{ level: 'error', code: 'MISSING_INPUT', message: `Missing: ${missingInputs.join(', ')}` }],
                    outputs: {},
                });
                continue;
            }

            // Execute node
            try {
                const result = definition.compute(inputs);
                valueCache.set(nodeId, result.outputs);

                results.push({
                    nodeId,
                    status: result.status,
                    messages: result.messages,
                    outputs: result.outputs,
                });

                // Update node instance
                node.outputValues = result.outputs;
                node.status = result.status;
                node.messages = result.messages;

            } catch (err) {
                results.push({
                    nodeId,
                    status: 'error',
                    messages: [{ level: 'error', code: 'COMPUTE_ERROR', message: String(err) }],
                    outputs: {},
                });
            }
        }

        const endTime = performance.now();

        return {
            success: results.every(r => r.status !== 'error'),
            executionOrder,
            results,
            executionTimeMs: endTime - startTime,
            graphStatus: this.computeGraphStatus(results),
        };
    }

    /**
     * Topological sort for execution order
     */
    private topologicalSort(): string[] {
        const visited = new Set<string>();
        const result: string[] = [];
        const inProgress = new Set<string>();

        const visit = (nodeId: string) => {
            if (visited.has(nodeId)) return;
            if (inProgress.has(nodeId)) {
                throw new Error(`Circular dependency detected at node ${nodeId}`);
            }

            inProgress.add(nodeId);

            // Visit dependencies first
            const incomingConnections = this.graph.connections.filter(c => c.targetNodeId === nodeId);
            for (const conn of incomingConnections) {
                visit(conn.sourceNodeId);
            }

            inProgress.delete(nodeId);
            visited.add(nodeId);
            result.push(nodeId);
        };

        for (const node of this.graph.nodes) {
            visit(node.id);
        }

        return result;
    }

    private getDefinition(type: string): NodeDefinition | undefined {
        if (this.definitionCache.has(type)) {
            return this.definitionCache.get(type);
        }
        const def = nodeDefinitions.get(type);
        if (def) this.definitionCache.set(type, def);
        return def;
    }

    private computeGraphStatus(results: NodeExecutionResult[]): NodeStatus {
        if (results.some(r => r.status === 'error')) return 'error';
        if (results.some(r => r.status === 'warning')) return 'warning';
        if (results.every(r => r.status === 'valid')) return 'valid';
        return 'pending';
    }

    /**
     * Propagate failure from a node to all dependent nodes
     */
    propagateFailure(sourceNodeId: string): string[] {
        const affected: string[] = [];
        const queue = [sourceNodeId];

        while (queue.length > 0) {
            const current = queue.shift()!;

            // Find all nodes that depend on current
            const dependents = this.graph.connections
                .filter(c => c.sourceNodeId === current)
                .map(c => c.targetNodeId);

            for (const dep of dependents) {
                if (!affected.includes(dep)) {
                    affected.push(dep);
                    queue.push(dep);

                    // Mark as stale
                    const node = this.graph.nodes.find(n => n.id === dep);
                    if (node) {
                        node.status = 'stale';
                        node.messages.push({
                            level: 'warning',
                            code: 'UPSTREAM_FAILURE',
                            message: `Upstream node ${current} has errors`,
                        });
                    }
                }
            }
        }

        return affected;
    }
}

// ============================================
// RESULT TYPES
// ============================================

export interface NodeExecutionResult {
    nodeId: string;
    status: NodeStatus;
    messages: ValidationMessage[];
    outputs: Record<string, unknown>;
}

export interface GraphExecutionResult {
    success: boolean;
    executionOrder: string[];
    results: NodeExecutionResult[];
    executionTimeMs: number;
    graphStatus: NodeStatus;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function createNode(type: string, position: { x: number; y: number }): NodeInstance | null {
    const definition = nodeDefinitions.get(type);
    if (!definition) return null;

    const inputValues: Record<string, unknown> = {};
    definition.inputs.forEach(input => {
        if (input.defaultValue !== undefined) {
            inputValues[input.id] = input.defaultValue;
        }
    });

    return {
        id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        position,
        inputValues,
        outputValues: {},
        status: 'pending',
        messages: [],
    };
}

export function canConnect(
    sourceNode: NodeInstance,
    sourcePortId: string,
    targetNode: NodeInstance,
    targetPortId: string
): boolean {
    const sourceDef = nodeDefinitions.get(sourceNode.type);
    const targetDef = nodeDefinitions.get(targetNode.type);

    if (!sourceDef || !targetDef) return false;

    const sourcePort = sourceDef.outputs.find(p => p.id === sourcePortId);
    const targetPort = targetDef.inputs.find(p => p.id === targetPortId);

    if (!sourcePort || !targetPort) return false;

    // Type compatibility check
    return sourcePort.dataType === targetPort.dataType;
}

export function createConnection(
    sourceNodeId: string,
    sourcePortId: string,
    targetNodeId: string,
    targetPortId: string
): Connection {
    return {
        id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sourceNodeId,
        sourcePortId,
        targetNodeId,
        targetPortId,
    };
}
