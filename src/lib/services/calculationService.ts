import { runEngine, ComputeRequest } from "@/lib/engine/core";
import { calculationRepo } from "@/lib/repositories/calculationRepo";
import { projectRepo } from "@/lib/repositories/projectRepo";
import { AppError } from "@/lib/utils/errors";
import { ExecutionTimeline, TelemetryMode } from "@/lib/utils/timeline";
import { buildExecutionResult, ExecutionResult } from "@/lib/utils/contract";

/**
 * Calculation Domain Service (Wave 2.5 - Data Bus Enabled)
 * Handles Dependency Resolution and Engine Orchestration.
 */

export const calculationService = {
    /**
     * Resolves "$ref" pointers in the payload.
     * Format: { "field": { "$ref": "calculation_id.path.to.value" } }
     */
    async resolveDependencies(payload: any, projectId: string, userId: string, timeline: ExecutionTimeline): Promise<any> {
        const resolvedPayload = { ...payload };
        
        // Find all $ref objects in the payload
        const refs = this.findRefs(resolvedPayload);
        if (refs.length === 0) return resolvedPayload;

        timeline.add('DEPENDENCY_RESOLUTION_START');

        for (const { path, refValue } of refs) {
            const [refId, ...dataPath] = refValue.split('.');
            
            // 1. Fetch Reference
            const refCalc = await calculationRepo.findById(refId);
            if (!refCalc) {
                throw new AppError({
                    code: "REFERENCE_NOT_FOUND",
                    layer: "service",
                    message: `Referenced calculation ${refId} not found.`,
                    recoverable: true
                });
            }

            // 2. Security Check: Must be in same project
            if (refCalc.project_id !== projectId) {
                throw new AppError({
                    code: "REFERENCE_SECURITY_VIOLATION",
                    layer: "service",
                    message: "Cross-project data reference is forbidden.",
                    recoverable: false
                });
            }

            // 3. Extract Value (Check Results first, then Inputs)
            let value = refCalc.result_json ? refCalc.result_json[dataPath[0]] : undefined;
            if (value === undefined) {
                value = refCalc.input_json[dataPath[0]];
            }

            if (value === undefined) {
                throw new AppError({
                    code: "REFERENCE_FIELD_MISSING",
                    layer: "service",
                    message: `Field ${dataPath.join('.')} not found in reference ${refId} (checked result and input).`,
                    recoverable: true
                });
            }

            // 4. Inject into payload
            this.setPath(resolvedPayload, path, value);
        }

        timeline.add('DEPENDENCY_RESOLUTION_END');
        return resolvedPayload;
    },

    /**
     * Helper to find all $ref objects recursively
     */
    findRefs(obj: any, path: string[] = []): { path: string[], refValue: string }[] {
        let results: any[] = [];
        for (const key in obj) {
            const currentPath = [...path, key];
            if (obj[key] && typeof obj[key] === 'object') {
                if (obj[key].$ref) {
                    results.push({ path: currentPath, refValue: obj[key].$ref });
                } else {
                    results = results.concat(this.findRefs(obj[key], currentPath));
                }
            }
        }
        return results;
    },

    /**
     * Helper to set value at deep path
     */
    setPath(obj: any, path: string[], value: any) {
        let current = obj;
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
    },

    async handleComputeRequest(
        userId: string, 
        request: ComputeRequest, 
        traceId: string, 
        timeline: ExecutionTimeline,
        telemetryMode: TelemetryMode
    ): Promise<ExecutionResult> {
        const start = performance.now();
        
        try {
            // 1. Domain Check
            if (request.projectId && request.projectId !== "temp") {
                timeline.add('PROJECT_CHECK_START');
                const project = await projectRepo.findById(request.projectId, userId);
                if (!project) {
                    throw new AppError({
                        code: "UNAUTHORIZED_PROJECT_ACCESS",
                        layer: "service",
                        message: "The requested project context is inaccessible.",
                        traceId
                    });
                }
                timeline.add('PROJECT_CHECK_END');
            }

            // 2. Resolve Dependencies (The Data Bus)
            const resolvedPayload = await this.resolveDependencies(
                request.payload, 
                request.projectId || "temp", 
                userId, 
                timeline
            );

            // 3. Pure Execution
            timeline.add('ENGINE_START');
            const data = await runEngine({ ...request, payload: resolvedPayload });
            timeline.add('ENGINE_END');

            const totalMs = performance.now() - start;
            
            return buildExecutionResult(true, traceId, data, null, totalMs, telemetryMode, timeline.toClient(telemetryMode));

        } catch (err: any) {
            const totalMs = performance.now() - start;
            const error = err instanceof AppError ? err : new AppError({
                code: "INTERNAL_SERVICE_ERROR",
                layer: "service",
                message: err.message,
                traceId
            });

            return buildExecutionResult(false, traceId, null, error, totalMs, telemetryMode, timeline.toClient(telemetryMode));
        }
    },

    // ... saveCalculation refactor omitted for brevity, but follows same principle
    async saveCalculation(userId: string, data: any, traceId: string, timeline: ExecutionTimeline, telemetryMode: TelemetryMode): Promise<ExecutionResult> {
        const start = performance.now();
        try {
            const project = await projectRepo.findById(data.projectId, userId);
            if (!project) throw new Error("PROJECT_NOT_FOUND");

            timeline.add('DB_SAVE_START');
            const savedData = await calculationRepo.save(data.projectId, data.type, data.inputJson, data.engineVersion, data.resultJson);
            timeline.add('DB_SAVE_END');

            return buildExecutionResult(true, traceId, savedData, null, performance.now() - start, telemetryMode, timeline.toClient(telemetryMode));
        } catch (err: any) {
            return buildExecutionResult(false, traceId, null, err, performance.now() - start, telemetryMode, timeline.toClient(telemetryMode));
        }
    },

    async getProjectCalculations(projectId: string) {
        return await calculationRepo.listByProject(projectId);
    }
};
