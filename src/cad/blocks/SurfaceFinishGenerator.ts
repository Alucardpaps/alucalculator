/**
 * 🧱 AluCAD — ISO 1302 / DIN EN ISO 1302 / ISO 21920 Surface Texture Engine
 * 
 * Complies with AGENTS.md:
 * - Pure headless math/geometry, ZERO React/DOM dependencies.
 * - Exact ISO 1302:2002 proportions:
 *   - Apex at (0, 0)
 *   - Short leg: 4mm at 60 deg to horizontal (120 deg vector): (-2.0, 3.464)
 *   - Long leg: 8mm at 60 deg to horizontal (60 deg vector): (4.0, 6.928)
 *   - Machining Required: closing horizontal bar from (-2.0, 3.464) to (2.0, 3.464)
 *   - Material Removal Prohibited: tangent inscribed circle centered at (0, 2.309) with r = 1.155mm
 *   - All-Around: circle at apex (0, 0) with r = 1.25mm
 *   - Shelf line: (4.0, 6.928) to (4.0 + W, 6.928) with dynamic length
 *   - Alphabetic baseline clearance: y = 8.6mm ensures zero line collision
 * 
 * Standards Cited:
 * - ISO 1302:2002 (Geometrical Product Specifications - Indication of surface texture)
 * - DIN EN ISO 1302 (Oberflächenbeschaffenheit in der technischen Produktdokumentation)
 * - ISO 21920-1:2021 (Surface texture: Profile — Part 1: Indication of surface texture)
 * - ASME Y14.36M-1996 (Surface Texture Symbols)
 * - DIN 140 / JIS B 0031 (Legacy Surface Roughness Triangles)
 */

import {
    CadEntity,
    BlockDefinition,
    createLineEntity,
    createCircleEntity,
    createTextEntity,
    Point
} from '../kernel/types';

export type SurfaceSymbolType =
    | 'machining_required'    // ISO closed bar: Material removal required (Talaşlı İmalat Zorunlu)
    | 'machining_prohibited'  // ISO inscribed circle: Material removal prohibited (Talaş Kaldırmak Yasak)
    | 'any_process';          // ISO basic open tick: Any manufacturing process permitted (Temel İşaret)

export type SurfaceLayDirection =
    | '='     // Parallel to projection plane (Paralel)
    | '⊥'     // Perpendicular to projection plane (Dik)
    | 'X'     // Crossed in two oblique directions (Çapraz)
    | 'M'     // Multi-directional (Çok yönlü)
    | 'C'     // Circular / Concentric relative to center (Dairesel / Konsantrik)
    | 'R'     // Approximately radial (Radyal)
    | 'P'     // Particulate, non-directional, protuberant (Yönsüz / Noktasal)
    | 'none';

export interface SurfaceFinishOptions {
    symbolType?: SurfaceSymbolType;
    allAround?: boolean;
    roughnessParameter?: 'Ra' | 'Rz' | 'Rmax' | 'Rq' | string;
    roughnessValue?: string | number;
    lowerRoughnessValue?: string | number;
    manufacturingMethod?: string;
    layDirection?: SurfaceLayDirection;
    machiningAllowance?: string | number;
    samplingLength?: string | number;
    layerId?: string;
    symbolColor?: string;
    textColor?: string;
}

export interface SurfaceFinishBlockParams extends SurfaceFinishOptions {
    id: string;
    name: string;
    description: string;
    subcategory?: string;
}

/**
 * Generates exact ISO 1302 CadEntity[] geometry for a surface texture symbol.
 */
export function createIso1302SurfaceTextureEntities(options: SurfaceFinishOptions): CadEntity[] {
    const {
        symbolType = 'machining_required',
        allAround = false,
        roughnessParameter = 'Ra',
        roughnessValue,
        lowerRoughnessValue,
        manufacturingMethod,
        layDirection = 'none',
        machiningAllowance,
        samplingLength,
        layerId = 'layer-0',
        symbolColor = '#3ad0e6',
        textColor = '#e7edf4'
    } = options;

    const entities: CadEntity[] = [];

    // ─── 1. CORE ISO 1302 CHECKMARK TICK ───
    // Short leg: 4mm length at 60 deg (120 deg vector): (-2.0, 3.464) -> (0, 0)
    const pShortTop: Point = { x: -2.0, y: 3.464 };
    const pApex: Point = { x: 0.0, y: 0.0 };
    entities.push(createLineEntity(pShortTop, pApex, layerId, symbolColor));

    // Long leg: 8mm length at 60 deg vector: (0, 0) -> (4.0, 6.928)
    const pLongTop: Point = { x: 4.0, y: 6.928 };
    entities.push(createLineEntity(pApex, pLongTop, layerId, symbolColor));

    // ─── 2. SYMBOL TYPE MODIFIERS ───
    if (symbolType === 'machining_required') {
        // Closing horizontal bar across short leg top at y = 3.464: (-2.0, 3.464) -> (2.0, 3.464)
        const pBarRight: Point = { x: 2.0, y: 3.464 };
        entities.push(createLineEntity(pShortTop, pBarRight, layerId, symbolColor));
    } else if (symbolType === 'machining_prohibited') {
        // Mathematically exact inscribed circle tangent to both 60 deg legs:
        // Center: (0, 2.3094), Radius: 1.1547.
        // Touches legs at (-1.0, 1.732) and (1.0, 1.732). Top reaches y = 3.464 (exact short leg height).
        entities.push(createCircleEntity({ x: 0.0, y: 2.309 }, 1.155, layerId, symbolColor));
    }

    // All-Around modifier: circle at apex (0, 0) with r = 1.25mm
    if (allAround) {
        entities.push(createCircleEntity(pApex, 1.25, layerId, symbolColor));
    }

    // ─── 3. TEXT & LABELS FORMATTING ───
    // Primary line label: e.g. "Ra 3.2" or "0.8 / Ra 3.2"
    let primaryLabel = '';
    if (roughnessValue !== undefined && roughnessValue !== null && roughnessValue !== '') {
        const valStr = typeof roughnessValue === 'number' ? roughnessValue.toString() : roughnessValue;
        const prefix = samplingLength ? `${samplingLength} / ` : '';
        primaryLabel = `${prefix}${roughnessParameter} ${valStr}`.trim();
    }

    // Method string (if specified)
    const methodStr = manufacturingMethod ? manufacturingMethod.trim() : '';

    // Determine layout: single-line vs two-lines above shelf
    const hasDualLimits = lowerRoughnessValue !== undefined && lowerRoughnessValue !== null && lowerRoughnessValue !== '';
    const hasMethodOnSeparateLine = Boolean(methodStr && (hasDualLimits || primaryLabel.length > 8));

    // Compute required horizontal shelf width W
    let maxLabelChars = Math.max(primaryLabel.length, methodStr.length);
    if (!hasMethodOnSeparateLine && methodStr && primaryLabel) {
        maxLabelChars = `${methodStr} / ${primaryLabel}`.length;
    }
    const shelfWidth = Math.max(14.0, maxLabelChars * 1.8 + 4.0);

    // ─── 4. HORIZONTAL SHELF LINE ───
    // Extends from (4.0, 6.928) to (4.0 + shelfWidth, 6.928)
    const pShelfEnd: Point = { x: 4.0 + shelfWidth, y: 6.928 };
    entities.push(createLineEntity(pLongTop, pShelfEnd, layerId, symbolColor));

    // ─── 5. TEXT PLACEMENT (ALPHABETIC BASELINE WITH CLEAN CLEARANCE) ───
    const textStartX = 4.8;
    const shelfY = 6.928;

    if (hasDualLimits) {
        if (methodStr) {
            // Line 3: Method on top line (y = 12.1)
            entities.push(createTextEntity({ x: textStartX, y: shelfY + 5.2 }, methodStr, 2.2, layerId, textColor, 'left', true));
            // Line 2: Upper roughness limit (y = 10.1)
            entities.push(createTextEntity({ x: textStartX, y: shelfY + 3.2 }, primaryLabel, 2.3, layerId, symbolColor, 'left', true));
            // Line 1: Lower roughness limit (y = 8.4)
            const lowerStr = typeof lowerRoughnessValue === 'number' ? lowerRoughnessValue.toString() : lowerRoughnessValue;
            entities.push(createTextEntity({ x: textStartX, y: shelfY + 1.5 }, `${roughnessParameter} ${lowerStr}`, 2.3, layerId, symbolColor, 'left', true));
        } else {
            // Upper roughness limit (y = 10.4)
            entities.push(createTextEntity({ x: textStartX, y: shelfY + 3.5 }, primaryLabel, 2.3, layerId, symbolColor, 'left', true));
            // Lower roughness limit (y = 8.4)
            const lowerStr = typeof lowerRoughnessValue === 'number' ? lowerRoughnessValue.toString() : lowerRoughnessValue;
            entities.push(createTextEntity({ x: textStartX, y: shelfY + 1.5 }, `${roughnessParameter} ${lowerStr}`, 2.3, layerId, symbolColor, 'left', true));
        }
    } else if (hasMethodOnSeparateLine) {
        // Method on top line (y = 10.4)
        entities.push(createTextEntity({ x: textStartX, y: shelfY + 3.5 }, methodStr, 2.2, layerId, textColor, 'left', true));
        // Roughness on second line (y = 8.4)
        if (primaryLabel) {
            entities.push(createTextEntity({ x: textStartX, y: shelfY + 1.5 }, primaryLabel, 2.4, layerId, symbolColor, 'left', true));
        }
    } else {
        // Standard single-row: method (if present) + roughness
        let rowText = primaryLabel;
        if (methodStr && primaryLabel) {
            rowText = `${primaryLabel} / ${methodStr}`;
        } else if (methodStr && !primaryLabel) {
            rowText = methodStr;
        }

        if (rowText) {
            // y = shelfY + 1.65 ensures clean 1.65mm clearance above shelf with dominantBaseline="alphabetic"
            entities.push(createTextEntity({ x: textStartX, y: shelfY + 1.65 }, rowText, 2.4, layerId, textColor, 'left', true));
        }
    }

    // ─── 6. SURFACE LAY DIRECTION (POSITION d — BELOW SHELF) ───
    if (layDirection && layDirection !== 'none') {
        entities.push(createTextEntity({ x: textStartX + 1.5, y: shelfY - 2.2 }, layDirection, 2.6, layerId, '#3dd68c', 'center', true));
    }

    // ─── 7. MACHINING ALLOWANCE (POSITION e — LEFT OF SHORT LEG) ───
    if (machiningAllowance !== undefined && machiningAllowance !== null && machiningAllowance !== '') {
        const allowanceStr = typeof machiningAllowance === 'number' ? machiningAllowance.toString() : machiningAllowance;
        // Placed at x = -3.0, y = 4.4 with right alignment
        entities.push(createTextEntity({ x: -3.0, y: 4.4 }, allowanceStr, 2.2, layerId, '#e6b84a', 'right', true));
    }

    return entities;
}

/**
 * Creates a complete standard BlockDefinition for a surface finish symbol.
 */
export function createSurfaceFinishBlock(params: SurfaceFinishBlockParams): BlockDefinition {
    const { id, name, description, subcategory = 'Surface Texture', ...options } = params;
    return {
        id,
        name,
        description,
        category: 'Symbols',
        subcategory,
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: createIso1302SurfaceTextureEntities(options)
    };
}

/**
 * Creates drawing header / antet collective surface callout entities (ISO 1302 §8).
 * E.g. "Ra 3.2 ( √ )" or "( ⍜ ) As-Cast"
 */
export function createCollectiveCalloutEntities(
    generalText: string,
    enclosedType: 'machining_required' | 'machining_prohibited' | 'any_process' | 'specific_list',
    extraText = '',
    layerId = 'layer-0',
    color = '#3ad0e6'
): CadEntity[] {
    const entities: CadEntity[] = [];

    // General text on left: e.g. "Ra 3.2"
    let currentX = 0.0;
    if (generalText) {
        entities.push(createTextEntity({ x: currentX, y: 2.2 }, generalText, 3.0, layerId, '#e7edf4', 'left', true));
        currentX += generalText.length * 2.2 + 2.0;
    }

    // Left parenthesis '('
    entities.push(createTextEntity({ x: currentX, y: 2.2 }, '(', 3.8, layerId, '#8a96a6', 'left'));
    currentX += 3.2;

    if (enclosedType === 'specific_list') {
        entities.push(createTextEntity({ x: currentX, y: 2.2 }, extraText, 2.8, layerId, color, 'left', true));
        currentX += extraText.length * 2.0 + 1.0;
    } else {
        // Mini checkmark symbol inside parentheses
        const miniOriginX = currentX + 1.5;
        const miniOriginY = 0.5;

        // Mini short leg
        entities.push(createLineEntity(
            { x: miniOriginX - 1.2, y: miniOriginY + 2.0 },
            { x: miniOriginX, y: miniOriginY },
            layerId,
            color
        ));
        // Mini long leg
        entities.push(createLineEntity(
            { x: miniOriginX, y: miniOriginY },
            { x: miniOriginX + 2.4, y: miniOriginY + 4.0 },
            layerId,
            color
        ));

        if (enclosedType === 'machining_required') {
            entities.push(createLineEntity(
                { x: miniOriginX - 1.2, y: miniOriginY + 2.0 },
                { x: miniOriginX + 1.2, y: miniOriginY + 2.0 },
                layerId,
                color
            ));
        } else if (enclosedType === 'machining_prohibited') {
            entities.push(createCircleEntity(
                { x: miniOriginX, y: miniOriginY + 1.35 },
                0.7,
                layerId,
                color
            ));
        }

        currentX += 5.5;
    }

    // Right parenthesis ')'
    entities.push(createTextEntity({ x: currentX, y: 2.2 }, ')', 3.8, layerId, '#8a96a6', 'left'));

    return entities;
}

/**
 * Creates legacy DIN 140 / JIS / GOST roughness triangles:
 * - 1 triangle: Rough (Ra 25)
 * - 2 triangles: Medium (Ra 6.3)
 * - 3 triangles: Fine (Ra 1.6)
 * - 4 triangles: Superfinish (Ra 0.2)
 * - 'wave': Unmachined (Tilde ~)
 */
export function createLegacyTriangleEntities(
    level: 1 | 2 | 3 | 4 | 'wave',
    label?: string,
    layerId = 'layer-0',
    color = '#3ad0e6'
): CadEntity[] {
    const entities: CadEntity[] = [];

    if (level === 'wave') {
        // Unmachined wavy line ~ (2 peaks)
        entities.push(createLineEntity({ x: -4.0, y: 0.0 }, { x: -2.0, y: 2.0 }, layerId, color));
        entities.push(createLineEntity({ x: -2.0, y: 2.0 }, { x: 0.0, y: 0.0 }, layerId, color));
        entities.push(createLineEntity({ x: 0.0, y: 0.0 }, { x: 2.0, y: 2.0 }, layerId, color));
        entities.push(createLineEntity({ x: 2.0, y: 2.0 }, { x: 4.0, y: 0.0 }, layerId, color));

        entities.push(createTextEntity({ x: 0.0, y: 4.2 }, label || '~ (Raw/Unmachined)', 2.4, layerId, '#e7edf4', 'center', true));
        return entities;
    }

    const triangleWidth = 4.0;
    const triangleHeight = 3.464; // equilateral 60 deg
    const startX = -((level * triangleWidth) / 2);

    for (let i = 0; i < level; i++) {
        const apexX = startX + i * triangleWidth + triangleWidth / 2;
        const leftX = startX + i * triangleWidth;
        const rightX = leftX + triangleWidth;
        const topY = triangleHeight;

        // Inverted triangle pointing down to surface:
        // Top horizontal: (leftX, topY) -> (rightX, topY)
        // Left leg: (leftX, topY) -> (apexX, 0)
        // Right leg: (rightX, topY) -> (apexX, 0)
        entities.push(createLineEntity({ x: leftX, y: topY }, { x: rightX, y: topY }, layerId, color));
        entities.push(createLineEntity({ x: leftX, y: topY }, { x: apexX, y: 0.0 }, layerId, color));
        entities.push(createLineEntity({ x: rightX, y: topY }, { x: apexX, y: 0.0 }, layerId, color));
    }

    if (label) {
        entities.push(createTextEntity({ x: 0.0, y: triangleHeight + 1.8 }, label, 2.4, layerId, '#e7edf4', 'center', true));
    }

    return entities;
}
