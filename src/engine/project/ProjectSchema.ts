/**
 * engine/project/ProjectSchema.ts
 * 
 * Defines the strict schema for the `.alucalc` project files.
 * Provides backwards compatibility and engine version validation definitions.
 */

/** Standardized Metadata returned by ANY calculation engine in the system */
export interface EngineMetadata {
    calculationId: string;
    engineVersion: string;
    moduleName: string;
    timestamp: number;
    inputSnapshot: Record<string, any>;
    /**
     * Methodology classification:
     * - 'normative': Official standards (ISO, DIN, VDI, ASME, Eurocode)
     * - 'empirical': Academic papers, manufacturer engineering handbooks (SKF, Festo), test curves
     * - 'numerical': Computational methods (FEA, Runge-Kutta, PlaneGCS solver, topology optimization)
     * - 'heuristic': Heuristic algorithms, reverse-engineered specifications, AI-assisted routines
     */
    methodologyType?: 'normative' | 'empirical' | 'numerical' | 'heuristic';
    standardReference?: string;
    methodologyCitation?: string;
    assumptions?: string[];
    safetyFactors?: Record<string, number>;
    validationStatus: 'success' | 'warning' | 'error';
    warnings?: string[];
    calculationHash: string; // SHA-256 string for report validation
}

/** Layer definition for CAD and geometry */
export interface LayerManifest {
    id: string;
    name: string;
    color: string;
    lineType: string;
    lineWeight: number;
    visible: boolean;
    locked: boolean;
}

/** The overarching structure of a `.alucalc` file */
export interface ProjectSchema {
    version: string;
    metadata: {
        title: string;
        author: string;
        created: number;
        lastModified: number;
        engineVersion: string;
    };
    workspace: {
        layers: LayerManifest[];
        entities: any[]; // Geometries
        constraints?: any[]; // Parametric solver rules
    };
    calculations: {
        [moduleId: string]: EngineMetadata[];
    };
    bom: {
        parts: any[];
    };
}
