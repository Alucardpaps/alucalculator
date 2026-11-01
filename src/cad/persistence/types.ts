/**
 * AluCAD Persistence Types & Project File Format Specification (.alucad)
 * 
 * Provides unified schema for both 2D CAD drafting and 3D parametric assemblies.
 * Supports native File System Access API and non-blocking IndexedDB session backups.
 */

import type { CadEntity, Layer, Viewport, CadUnit, Constraint } from '../kernel/types';
import type { Body } from '../kernel/Body';

export const ALUCAD_FILE_EXTENSION = '.alucad';
export const ALUCAD_CURRENT_SCHEMA_VERSION = 1;

export interface ProjectMetadata {
    id: string;
    name: string;
    description?: string;
    author?: string;
    createdAt: number;
    modifiedAt: number;
    units: CadUnit;
    entityCount: number;
    bodyCount: number;
    partCount?: number;
    appVersion: string;
}

export interface Cad2dState {
    entities: CadEntity[];
    layers: Layer[];
    bodies: Body[];
    constraints: Constraint[];
    units: CadUnit;
    viewport?: {
        center: { x: number; y: number };
        zoom: number;
        width?: number;
        height?: number;
    };
    activeLayerId?: string;
}

export interface Design3dState {
    parts: any[];
    mates?: any[];
    subAssemblies?: any[];
    projectName?: string;
}

/**
 * .alucad Industrial Project Container
 */
export interface AluCadProjectFile {
    fileType: 'ALUCAD_PROJECT';
    schemaVersion: number;
    appName: 'AluCAD OS';
    id: string;
    metadata: ProjectMetadata;
    cad2d: Cad2dState;
    design3d?: Design3dState;
}

export type AutoSaveStatus = 
    | 'idle'
    | 'saving'
    | 'saved_local_storage'
    | 'saved_pc_file'
    | 'modified_unsaved'
    | 'error';

export interface AutoSaveState {
    status: AutoSaveStatus;
    lastSavedTimestamp: number | null;
    activeFileName: string | null;
    hasUnsavedChanges: boolean;
    error?: string | null;
}

/**
 * Validates if a parsed JSON object matches the AluCadProjectFile schema
 */
export function isValidAluCadProject(data: unknown): data is AluCadProjectFile {
    if (!data || typeof data !== 'object') return false;
    const d = data as Partial<AluCadProjectFile>;
    if (d.fileType !== 'ALUCAD_PROJECT') return false;
    if (!d.metadata || typeof d.metadata !== 'object') return false;
    if (!d.cad2d && !d.design3d) return false;
    return true;
}
