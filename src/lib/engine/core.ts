import { ModuleRegistry } from "./registry";

/**
 * Registry-Driven Engine Router (Plugin System v1)
 * Dynamically dispatches requests to the appropriate engine plugin.
 */

export interface ComputeRequest {
    type: string; // Now dynamic based on registry
    payload: any;
    projectId?: string;
}

export async function runEngine(request: ComputeRequest) {
    const { type, payload } = request;

    // 1. Lookup Plugin
    const engine = ModuleRegistry[type];
    if (!engine) {
        throw new Error(`UNSUPPORTED_ENGINE_TYPE: The module "${type}" is not registered in the system.`);
    }

    // 2. Validate using Plugin Logic
    const validatedInput = engine.validate(payload);

    // 3. Execute Pure Math
    const result = await engine.compute(validatedInput);

    // 4. Return Data (Augmented with Plugin Metadata)
    return {
        ...result,
        engineInfo: {
            id: engine.metadata.id,
            version: engine.metadata.version
        }
    };
}
