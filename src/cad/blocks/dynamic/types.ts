/**
 * 🧱 AluCAD OS — AutoCAD-Grade Dynamic Block System
 * 
 * Complies with AGENTS.md & GEMINI.md:
 * - Deterministic ISO/DIN/EN geometry and math contracts
 * - Methodology citations: Normative Tier (ISO/DIN/EN), Scientific/Architectural standards
 * - Unified 2D DWG/DXF + 3D Parametric CAD execution
 */

import { Point, CadEntity } from '../../kernel/types';
import type { DesignKind } from '@/design-studio/designStore';

export type DynamicGripType = 'stretch' | 'linear' | 'flip' | 'visibility' | 'lookup' | 'point';

export interface LinearParameter {
    id: string;
    name: string;
    label: string;
    labelTr: string;
    min: number;
    max: number;
    step?: number;
    default: number;
    unit: string;
    axis: 'x' | 'y' | 'both';
}

export interface FlipParameter {
    id: string;
    name: string;
    label: string;
    labelTr: string;
    axis: 'horizontal' | 'vertical';
    default: boolean;
}

export interface VisibilityState {
    id: string;
    label: string;
    labelTr: string;
}

export interface VisibilityParameter {
    id: string;
    name: string;
    label: string;
    labelTr: string;
    states: VisibilityState[];
    default: string;
}

export interface LookupOption {
    id: string;
    label: string;
    standard?: string;
    values: Record<string, any>;
}

export interface LookupParameter {
    id: string;
    name: string;
    label: string;
    labelTr: string;
    options: LookupOption[];
    default?: string;
}

export interface ArrayAction {
    id: string;
    linearParamId: string;
    spacing: number;
    minCount: number;
    maxCount?: number;
    label: string;
    labelTr: string;
}

export interface DynamicGrip {
    id: string;
    type: DynamicGripType;
    paramId: string;
    position: Point;
    direction?: Point; // Normalized direction vector for stretch arrows
    tooltip?: string;
    tooltipTr?: string;
    label?: string;
    labelTr?: string;
}

export interface DynamicPart3DDef {
    id?: string;
    name: string;
    kind?: DesignKind;
    color: string;
    position: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
    params?: Record<string, any>;
    designStandard?: string;
    shape?: string;
    dimensions?: Record<string, any>;
    materialType?: string;
}

export interface DynamicBlockCitation {
    tier: 1 | 2 | 3;
    standard: string;
    clause?: string;
    description: string;
}

export type DynamicBlockCategory = 'Architectural' | 'Furniture' | 'Structural' | 'Mechanical' | 'Fasteners' | 'Piping' | 'Sanitary' | 'Electrical' | 'Civil';

export interface DynamicBlockDef {
    id: string;
    name: string;
    nameTr: string;
    category: DynamicBlockCategory;
    subcategory: string;
    subcategoryTr: string;
    description: string;
    descriptionTr: string;
    icon: string;
    calculatorRoute?: string;
    calculatorModuleType?: string;
    calculatorLabelTr?: string;
    linearParams: LinearParameter[];
    flipParams?: FlipParameter[];
    visibilityParam?: VisibilityParameter;
    lookupParams?: LookupParameter[];
    arrayActions?: ArrayAction[];
    defaultValues: Record<string, any>;
    citation: DynamicBlockCitation;
    generate2D: (params: Record<string, any>, basePoint: Point) => CadEntity[];
    generate3D: (params: Record<string, any>, basePos?: { x: number; y: number; z: number }) => DynamicPart3DDef[];
    getGrips: (params: Record<string, any>, basePoint: Point) => DynamicGrip[];
}

export interface DynamicBlockInstance {
    instanceId: string;
    blockDefId: string;
    basePoint: Point;
    rotationRad: number;
    scale: number;
    parameterValues: Record<string, any>;
    entityIds: string[];
}
