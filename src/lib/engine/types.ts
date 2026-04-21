/**
 * AluCalc Plugin System v1: Engine Types
 * Defines the contract for all engineering modules.
 */

export interface EngineMetadata {
    id: string;
    name: string;
    version: string;
    domain: 'mechanical' | 'electrical' | 'thermal' | 'civil';
}

export interface IEngine<I = any, O = any> {
    metadata: EngineMetadata;
    validate: (payload: any) => I;
    compute: (input: I) => Promise<O> | O;
}
