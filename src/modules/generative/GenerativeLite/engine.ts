/**
 * modules/generative/GenerativeLite/engine.ts
 * 
 * Invokes the Generative WebWorker and packages the result into EngineMetadata.
 */

import { EngineMetadata } from '@/engine/project/ProjectSchema';

export interface GenerativeInput {
    targetVolumeFraction: number; // 0.1 to 0.9
    preserveRegions: string[]; // Entity IDs
    loadCases: any[];
}

export interface GenerativeResult {
    finalVolume: number;
    massSavedKg: number;
    optimizedMeshUrl: string;
}

export class GenerativeLiteEngine {
    static readonly VERSION = '1.0.0';

    static generateMetadata(input: GenerativeInput, result: GenerativeResult): EngineMetadata {
        return {
            calculationId: `GEN-${Date.now()}`,
            engineVersion: this.VERSION,
            moduleName: 'GenerativeLite',
            timestamp: Date.now(),
            inputSnapshot: input as any,
            validationStatus: 'success',
            calculationHash: btoa(`GL-${result.massSavedKg}`)
        };
    }
}
