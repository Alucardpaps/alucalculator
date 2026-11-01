/**
 * ⚙️ Power Transmission CAD & Dynamic Block Utilities (AluCalc OS)
 * 
 * Normative Tier: Tier 1 (ISO 53, ISO 606, ISO 13050, ISO 128-40, ISO 2203, DIN 6885-1, KTR CLAMPEX®)
 * References:
 * - ISO 128-40 / DIN ISO 128: Technical drawings — Principles of presentation: Section views & hatching
 * - ISO 2203: Technical drawings — Conventional representation of gears
 * - Pfeifer Industries & Barbieri Timing Belt Pulley Guide Flange Design Guidelines
 * - KTR Drive Technology Catalogue Pages 294–316 (CLAMPEX® series)
 */

import {
    Point,
    CadEntity,
    createLineEntity,
    createCircleEntity,
    createPolylineEntity,
    createRectangleEntity
} from '../../kernel/types';
import { DynamicPart3DDef } from './types';
import {
    type KtrClampexModel,
    type KtrClampexEntry,
    type KtrRecommendation,
    recommendKtrClampex,
    calculateKtrHubSizing,
    findKtrClampexByShaft
} from '../../../data/mechanical/ktrClampexStandards';
import { getDin6885Keyway } from '../../../engines/math/gear-involute-factory';

export interface ResolvedShaftConnection {
    type: 'none' | 'keyway_din6885' | 'ktr';
    isKtr: boolean;
    hasKeyway: boolean;
    ktrEntry?: KtrClampexEntry;
    ktrRecommendation?: KtrRecommendation;
    shaftDiameter: number;
    boreDiameter: number;      // Body bore: if KTR, outer D of clamping set. If keyway/none, shaftDiameter.
    minHubDiameter: number;   // Hub outer diameter DN
}

/**
 * Resolves shaft connection parameters and automatically computes KTR recommendation
 * or keyway specifications based on shaft size and component type.
 */
export function resolveShaftConnection(
    connection: string,
    shaftDiameter: number,
    componentType: 'pulley' | 'gear' | 'sprocket',
    hubYieldMpa = 350
): ResolvedShaftConnection {
    const rawConn = String(connection || 'keyway_din6885');
    const d = Math.max(8, Number(shaftDiameter) || 20);

    if (rawConn === 'none' || rawConn === 'plain_bore') {
        return {
            type: 'none',
            isKtr: false,
            hasKeyway: false,
            shaftDiameter: d,
            boreDiameter: d,
            minHubDiameter: Math.max(d * 1.5, 20)
        };
    }

    if (rawConn === 'keyway_din6885' || rawConn === 'keyway') {
        return {
            type: 'keyway_din6885',
            isKtr: false,
            hasKeyway: true,
            shaftDiameter: d,
            boreDiameter: d,
            minHubDiameter: Math.max(d * 1.7, 24)
        };
    }

    // KTR Conical Clamping Set
    const preferredModel: KtrClampexModel | 'auto' =
        rawConn === 'ktr_100' ? 'KTR 100' :
        rawConn === 'ktr_200' ? 'KTR 200' :
        rawConn === 'ktr_250' ? 'KTR 250' :
        rawConn === 'ktr_400' ? 'KTR 400' : 'auto';

    const recommendation = recommendKtrClampex({
        shaftDiameter: d,
        componentType,
        hubMaterialYieldMpa: hubYieldMpa,
        preferredModel
    });

    const entry = recommendation.recommendedEntry;
    return {
        type: 'ktr',
        isKtr: true,
        hasKeyway: false,
        ktrEntry: entry,
        ktrRecommendation: recommendation,
        shaftDiameter: entry.d,
        boreDiameter: entry.D,
        minHubDiameter: Math.max(recommendation.hubSizing.minHubDiameter, entry.D * 1.25)
    };
}

/**
 * 1. ISO 128-40 Standard Section Hatching
 * Generates parallel 45° or -45° hatching lines across rectangular cross-section solid cuts.
 */
export function drawHatchedRect(
    entities: CadEntity[],
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    hatchAngleDeg: 45 | -45 = 45,
    spacing = 3.5,
    contourColor = '#3ad0e6',
    hatchColor = '#0284c7',
    layer = 'layer-0'
) {
    if (xMax <= xMin || yMax <= yMin) return;

    // 1. Boundary rectangle
    entities.push(createRectangleEntity(
        { x: (xMin + xMax) / 2, y: (yMin + yMax) / 2 },
        xMax - xMin,
        yMax - yMin,
        layer,
        contourColor
    ));

    const w = xMax - xMin;
    const h = yMax - yMin;
    if (w < 1.5 || h < 1.5) return;

    // 2. Parallel hatching lines
    if (hatchAngleDeg === 45) {
        const step = spacing * Math.SQRT2;
        const cMin = -w;
        const cMax = h;
        for (let c = cMin + step; c < cMax; c += step) {
            const pts: Point[] = [];
            if (c >= 0 && c <= h) pts.push({ x: xMin, y: yMin + c });
            if (-c >= 0 && -c <= w) pts.push({ x: xMin - c, y: yMin });
            if (w + c >= 0 && w + c <= h) pts.push({ x: xMax, y: yMin + w + c });
            if (h - c >= 0 && h - c <= w) pts.push({ x: xMin + h - c, y: yMax });

            if (pts.length >= 2) {
                entities.push(createLineEntity(pts[0], pts[1], layer, hatchColor));
            }
        }
    } else {
        const step = spacing * Math.SQRT2;
        const cMin = 0;
        const cMax = w + h;
        for (let c = cMin + step; c < cMax; c += step) {
            const pts: Point[] = [];
            if (c >= 0 && c <= h) pts.push({ x: xMin, y: yMin + c });
            if (c >= 0 && c <= w) pts.push({ x: xMin + c, y: yMin });
            if (c - w >= 0 && c - w <= h) pts.push({ x: xMax, y: yMin + c - w });
            if (c - h >= 0 && c - h <= w) pts.push({ x: xMin + c - h, y: yMax });

            if (pts.length >= 2) {
                entities.push(createLineEntity(pts[0], pts[1], layer, hatchColor));
            }
        }
    }
}

export interface DrawShaftHubSectionParams {
    entities: CadEntity[];
    center: Point;
    faceW: number;
    rHub: number;
    connection: ResolvedShaftConnection;
    lockDirection?: 'front' | 'back';
    hubStyle?: 'boss' | 'flush';
    hatchAngle?: 45 | -45;
    contourColor?: string;
    hatchColor?: string;
    layer?: string;
}

/**
 * 2. ISO 128 / KTR CLAMPEX® Shaft-Hub Cross-Section View
 * Cleanly partitions shaft, counterbore shoulder, KTR conical sleeve, and hub solid.
 * Guarantees zero overlapping hatching lines and authentic engineering presentation.
 */
export function drawShaftHubConnectionSection({
    entities,
    center,
    faceW,
    rHub,
    connection,
    lockDirection = 'front',
    hubStyle = 'boss',
    hatchAngle = 45,
    contourColor = '#3ad0e6',
    hatchColor = '#0284c7',
    layer = 'layer-0'
}: DrawShaftHubSectionParams): { xHubMin: number; xHubMax: number; rHub: number; collarLen: number } {
    const isKtr = connection.isKtr && !!connection.ktrEntry;
    const ktr = connection.ktrEntry;
    const shaftDia = connection.shaftDiameter;
    const rs = shaftDia / 2;
    const hubExt = hubStyle === 'boss' ? (isKtr && ktr ? Math.max(14, (ktr.B1 || 30) - faceW + 8) : 12) : 0;

    let xHubMin: number;
    let xHubMax: number;
    if (hubStyle === 'boss') {
        if (lockDirection === 'front') {
            xHubMin = center.x - faceW / 2;
            xHubMax = center.x + faceW / 2 + hubExt;
        } else {
            xHubMin = center.x - faceW / 2 - hubExt;
            xHubMax = center.x + faceW / 2;
        }
    } else {
        xHubMin = center.x - faceW / 2;
        xHubMax = center.x + faceW / 2;
    }

    let collarLen = 0;

    if (isKtr && ktr) {
        const rb = ktr.D / 2;
        const rCollar = (ktr.D1 ? ktr.D1 : ktr.D) / 2;
        const sleeveLen = Math.min(xHubMax - xHubMin - 2, ktr.B1 || faceW);
        collarLen = Math.max(4, ktr.B - (ktr.B1 || faceW));

        if (lockDirection === 'front') {
            const xLockStart = xHubMax - sleeveLen;
            const xLockEnd = xHubMax;
            const xCollarStart = xHubMax;
            const xCollarEnd = xHubMax + collarLen;
            const xThroughStart = xHubMin;

            // 1. Hub solid shoulder zone (shaft through-bore from xThroughStart to xLockStart)
            if (xLockStart > xThroughStart) {
                drawHatchedRect(entities, xThroughStart, xLockStart, center.y + rs, center.y + rHub, hatchAngle, 3.5, contourColor, hatchColor, layer);
                drawHatchedRect(entities, xThroughStart, xLockStart, center.y - rHub, center.y - rs, hatchAngle, 3.5, contourColor, hatchColor, layer);
            }

            // 2. Hub solid counterbore zone (counterbore D from xLockStart to xLockEnd)
            drawHatchedRect(entities, xLockStart, xLockEnd, center.y + rb, center.y + rHub, hatchAngle, 3.5, contourColor, hatchColor, layer);
            drawHatchedRect(entities, xLockStart, xLockEnd, center.y - rHub, center.y - rb, hatchAngle, 3.5, contourColor, hatchColor, layer);

            // 3. Internal shoulder vertical step lines
            entities.push(createLineEntity({ x: xLockStart, y: center.y + rs }, { x: xLockStart, y: center.y + rb }, layer, contourColor));
            entities.push(createLineEntity({ x: xLockStart, y: center.y - rb }, { x: xLockStart, y: center.y - rs }, layer, contourColor));

            // 4. KTR Clamping Sleeve (hatched at opposite angle with tighter spacing)
            drawHatchedRect(entities, xLockStart, xLockEnd, center.y + rs, center.y + rb, -hatchAngle as 45 | -45, 2.0, '#94a3b8', '#475569', layer);
            drawHatchedRect(entities, xLockStart, xLockEnd, center.y - rb, center.y - rs, -hatchAngle as 45 | -45, 2.0, '#94a3b8', '#475569', layer);

            // Conical taper split lines
            entities.push(createLineEntity({ x: xLockStart, y: center.y + rs }, { x: xLockEnd, y: center.y + rb }, layer, '#f1f5f9'));
            entities.push(createLineEntity({ x: xLockStart, y: center.y - rs }, { x: xLockEnd, y: center.y - rb }, layer, '#f1f5f9'));

            // 5. Collar Flange
            drawHatchedRect(entities, xCollarStart, xCollarEnd, center.y + rs, center.y + rCollar, -hatchAngle as 45 | -45, 2.0, '#cbd5e1', '#475569', layer);
            drawHatchedRect(entities, xCollarStart, xCollarEnd, center.y - rCollar, center.y - rs, -hatchAngle as 45 | -45, 2.0, '#cbd5e1', '#475569', layer);

            // Clamping screws
            const screwY = (rs + rb) / 2;
            const screwHeadW = Math.max(2, collarLen * 0.5);
            entities.push(createRectangleEntity({ x: (xCollarStart + xCollarEnd) / 2, y: center.y + screwY }, screwHeadW, 4, layer, '#f8fafc'));
            entities.push(createRectangleEntity({ x: (xCollarStart + xCollarEnd) / 2, y: center.y - screwY }, screwHeadW, 4, layer, '#f8fafc'));
        } else {
            // lockDirection === 'back'
            const xLockStart = xHubMin;
            const xLockEnd = xHubMin + sleeveLen;
            const xCollarStart = xHubMin - collarLen;
            const xCollarEnd = xHubMin;
            const xThroughEnd = xHubMax;

            // 1. Hub solid counterbore zone
            drawHatchedRect(entities, xLockStart, xLockEnd, center.y + rb, center.y + rHub, hatchAngle, 3.5, contourColor, hatchColor, layer);
            drawHatchedRect(entities, xLockStart, xLockEnd, center.y - rHub, center.y - rb, hatchAngle, 3.5, contourColor, hatchColor, layer);

            // 2. Hub solid shoulder zone
            if (xThroughEnd > xLockEnd) {
                drawHatchedRect(entities, xLockEnd, xThroughEnd, center.y + rs, center.y + rHub, hatchAngle, 3.5, contourColor, hatchColor, layer);
                drawHatchedRect(entities, xLockEnd, xThroughEnd, center.y - rHub, center.y - rs, hatchAngle, 3.5, contourColor, hatchColor, layer);
            }

            // 3. Internal shoulder vertical step lines
            entities.push(createLineEntity({ x: xLockEnd, y: center.y + rs }, { x: xLockEnd, y: center.y + rb }, layer, contourColor));
            entities.push(createLineEntity({ x: xLockEnd, y: center.y - rb }, { x: xLockEnd, y: center.y - rs }, layer, contourColor));

            // 4. KTR Clamping Sleeve
            drawHatchedRect(entities, xLockStart, xLockEnd, center.y + rs, center.y + rb, -hatchAngle as 45 | -45, 2.0, '#94a3b8', '#475569', layer);
            drawHatchedRect(entities, xLockStart, xLockEnd, center.y - rb, center.y - rs, -hatchAngle as 45 | -45, 2.0, '#94a3b8', '#475569', layer);

            // Conical taper split lines
            entities.push(createLineEntity({ x: xLockEnd, y: center.y + rs }, { x: xLockStart, y: center.y + rb }, layer, '#f1f5f9'));
            entities.push(createLineEntity({ x: xLockEnd, y: center.y - rs }, { x: xLockStart, y: center.y - rb }, layer, '#f1f5f9'));

            // 5. Collar Flange
            drawHatchedRect(entities, xCollarStart, xCollarEnd, center.y + rs, center.y + rCollar, -hatchAngle as 45 | -45, 2.0, '#cbd5e1', '#475569', layer);
            drawHatchedRect(entities, xCollarStart, xCollarEnd, center.y - rCollar, center.y - rs, -hatchAngle as 45 | -45, 2.0, '#cbd5e1', '#475569', layer);

            // Clamping screws
            const screwY = (rs + rb) / 2;
            const screwHeadW = Math.max(2, collarLen * 0.5);
            entities.push(createRectangleEntity({ x: (xCollarStart + xCollarEnd) / 2, y: center.y + screwY }, screwHeadW, 4, layer, '#f8fafc'));
            entities.push(createRectangleEntity({ x: (xCollarStart + xCollarEnd) / 2, y: center.y - screwY }, screwHeadW, 4, layer, '#f8fafc'));
        }
    } else {
        // Continuous plain or keyway bore
        drawHatchedRect(entities, xHubMin, xHubMax, center.y + rs, center.y + rHub, hatchAngle, 3.5, contourColor, hatchColor, layer);
        drawHatchedRect(entities, xHubMin, xHubMax, center.y - rHub, center.y - rs, hatchAngle, 3.5, contourColor, hatchColor, layer);

        if (connection.hasKeyway) {
            const kw = getDin6885Keyway(shaftDia);
            if (kw) {
                const keyLen = Math.min((xHubMax - xHubMin) * 0.75, 36);
                entities.push(createRectangleEntity({ x: (xHubMin + xHubMax) / 2, y: center.y + rs + kw.depth / 2 }, keyLen, kw.depth, layer, '#f8fafc'));
            }
        }
    }

    // Solid Shaft Outline & Centerlines (Universal)
    const xShaftMin = (isKtr && lockDirection === 'back' ? xHubMin - collarLen : xHubMin) - 18;
    const xShaftMax = (isKtr && lockDirection === 'front' ? xHubMax + collarLen : xHubMax) + 18;

    entities.push(createLineEntity({ x: xShaftMin, y: center.y + rs }, { x: xShaftMax, y: center.y + rs }, layer, '#38bdf8'));
    entities.push(createLineEntity({ x: xShaftMin, y: center.y - rs }, { x: xShaftMax, y: center.y - rs }, layer, '#38bdf8'));
    entities.push(createLineEntity({ x: xShaftMin, y: center.y - rs }, { x: xShaftMin, y: center.y + rs }, layer, '#38bdf8'));
    entities.push(createLineEntity({ x: xShaftMax, y: center.y - rs }, { x: xShaftMax, y: center.y + rs }, layer, '#38bdf8'));

    // Shaft red centerline
    entities.push(createLineEntity({ x: xShaftMin - 12, y: center.y }, { x: xShaftMax + 12, y: center.y }, layer, '#ef4444'));

    return { xHubMin, xHubMax, rHub, collarLen };
}

/**
 * Legacy wrapper for drawKtrClampex2DSection
 */
export function drawKtrClampex2DSection(
    entities: CadEntity[],
    center: Point,
    gearFaceW: number,
    ktr: KtrClampexEntry,
    lockDirection: 'front' | 'back' = 'front',
    hatchAngle: 45 | -45 = 45,
    layer = 'layer-0'
) {
    const conn: ResolvedShaftConnection = {
        type: 'ktr',
        isKtr: true,
        hasKeyway: false,
        ktrEntry: ktr,
        shaftDiameter: ktr.d,
        boreDiameter: ktr.D,
        minHubDiameter: ktr.D * 1.3
    };
    drawShaftHubConnectionSection({
        entities,
        center,
        faceW: gearFaceW,
        rHub: ktr.D * 0.75,
        connection: conn,
        lockDirection,
        hubStyle: 'boss',
        hatchAngle,
        layer
    });
}

/**
 * 3. KTR CLAMPEX® 2D Front View Representation
 * Draws shaft bore, clamping set outer bore, collar flange, and screw circle.
 */
export function drawKtrClamping2DFront(
    entities: CadEntity[],
    center: Point,
    ktr: KtrClampexEntry,
    layer = 'layer-0'
) {
    const colorShaft = '#38bdf8';
    const colorBore = '#94a3b8';
    const colorCollar = '#cbd5e1';
    const colorPcd = '#64748b';
    const colorScrew = '#f8fafc';

    // Shaft circle d
    entities.push(createCircleEntity(center, ktr.d / 2, layer, colorShaft));
    // Clamping set outer bore D
    entities.push(createCircleEntity(center, ktr.D / 2, layer, colorBore));

    // Flange collar D1
    if (ktr.D1 && ktr.D1 > ktr.D) {
        entities.push(createCircleEntity(center, ktr.D1 / 2, layer, colorCollar));
    }

    // Screw pitch circle (PCD)
    const pcd = (ktr.d + ktr.D) / 2;
    entities.push(createCircleEntity(center, pcd / 2, layer, colorPcd));

    // Clamping screws
    const screwDia = Number(ktr.screw.replace(/\D/g, '')) || 6;
    const n = Math.max(4, ktr.screwCount || 6);
    for (let i = 0; i < n; i++) {
        const ang = (i * 2 * Math.PI) / n;
        const sx = center.x + (pcd / 2) * Math.cos(ang);
        const sy = center.y + (pcd / 2) * Math.sin(ang);
        entities.push(createCircleEntity({ x: sx, y: sy }, Math.max(1.5, screwDia / 2), layer, colorScrew));
        entities.push(createCircleEntity({ x: sx, y: sy }, Math.max(0.8, screwDia / 4), layer, colorPcd));
    }
}

/**
 * 4. Guide Flange 2D Section Profile (Pfeifer / Barbieri Standard)
 * Draws outer flange ears with 15° lead-in escape chamfer.
 * Supports both modern (with center Point) and legacy signatures.
 */
export function drawGuideFlange2DSection(
    entities: CadEntity[],
    arg1: Point | number,
    arg2: number | 'front' | 'back',
    arg3: 'front' | 'back' | number,
    arg4: number,
    arg5?: number,
    thickness = 2.0,
    escapeAngleDeg = 15,
    layer = 'layer-0',
    color = '#f59e0b'
) {
    let center: Point;
    let xFace: number;
    let direction: 'front' | 'back';
    let rRim: number;
    let rFlange: number;
    let th = thickness;
    let esc = escapeAngleDeg;
    let lyr = layer;
    let col = color;

    if (typeof arg1 === 'object' && 'x' in arg1 && 'y' in arg1) {
        center = arg1;
        xFace = arg2 as number;
        direction = arg3 as 'front' | 'back';
        rRim = arg4;
        rFlange = arg5 ?? (rRim + 6);
    } else {
        center = { x: 0, y: 0 };
        xFace = arg1 as number;
        direction = arg2 as 'front' | 'back';
        rRim = arg3 as number;
        rFlange = arg4;
        if (typeof arg5 === 'number') th = arg5;
    }

    const dirSign = direction === 'front' ? 1 : -1;
    const chamferH = Math.min(3.5, rFlange - rRim);
    const chamferW = chamferH * Math.tan((esc * Math.PI) / 180);
    const cy = center.y;

    // Upper ear polygon
    const upperPts: Point[] = [
        { x: xFace, y: cy + rRim },
        { x: xFace + dirSign * th, y: cy + rRim },
        { x: xFace + dirSign * th, y: cy + rFlange },
        { x: xFace + dirSign * Math.max(0.5, th - chamferW), y: cy + rFlange },
        { x: xFace, y: cy + rFlange - chamferH }
    ];
    entities.push(createPolylineEntity(upperPts, true, lyr, col));

    // Lower ear polygon
    const lowerPts: Point[] = [
        { x: xFace, y: cy - rRim },
        { x: xFace + dirSign * th, y: cy - rRim },
        { x: xFace + dirSign * th, y: cy - rFlange },
        { x: xFace + dirSign * Math.max(0.5, th - chamferW), y: cy - rFlange },
        { x: xFace, y: cy - (rFlange - chamferH) }
    ];
    entities.push(createPolylineEntity(lowerPts, true, lyr, col));
}

/**
 * 5. KTR CLAMPEX® 3D CAD Parametric Generation
 * Creates hollow tube sleeve and flange collar strictly along the shaft axis (Z).
 */
export function createKtr3DParts(
    basePos: { x: number; y: number; z: number },
    faceW: number,
    ktr: KtrClampexEntry,
    lockDirection: 'front' | 'back' = 'front',
    labelPrefix = '',
    hubExt = 0
): DynamicPart3DDef[] {
    const parts: DynamicPart3DDef[] = [];
    const sleeveLen = Math.min(faceW + hubExt, ktr.B1 || faceW);
    const flangeLen = Math.max(4, ktr.B - (ktr.B1 || faceW));
    const hasFlange = Boolean(ktr.D1 && ktr.D1 > ktr.D);

    // Axial alignment along Z axis
    const sleeveZ = lockDirection === 'front'
        ? basePos.z + (faceW / 2 + hubExt) - sleeveLen / 2
        : basePos.z - (faceW / 2 + hubExt) + sleeveLen / 2;

    parts.push({
        id: `ktr_sleeve_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: `${labelPrefix}KTR CLAMPEX® ${ktr.model} Konik Kilit Bileziği (${ktr.d}x${ktr.D} mm, T=${ktr.T} Nm, TA=${ktr.TA} Nm)`,
        kind: 'tube',
        color: '#94a3b8',
        position: { x: basePos.x, y: basePos.y, z: sleeveZ },
        rotation: { x: 90, y: 0, z: 0 },
        params: {
            innerDiameter: ktr.d,
            outerDiameter: ktr.D - 0.2,
            diameter: ktr.D,
            length: sleeveLen
        },
        designStandard: 'KTR Drive Technology Pages 294–316'
    });

    if (hasFlange && ktr.D1) {
        const flangeZ = lockDirection === 'front'
            ? basePos.z + (faceW / 2 + hubExt) + flangeLen / 2
            : basePos.z - (faceW / 2 + hubExt) - flangeLen / 2;

        parts.push({
            id: `ktr_flange_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: `${labelPrefix}CLAMPEX® ${ktr.model} Flanş (Ø${ktr.D1} mm, ${ktr.screwCount}x${ktr.screw})`,
            kind: 'tube',
            color: '#cbd5e1',
            position: { x: basePos.x, y: basePos.y, z: flangeZ },
            rotation: { x: 90, y: 0, z: 0 },
            params: {
                innerDiameter: ktr.d,
                outerDiameter: ktr.D1,
                diameter: ktr.D1,
                length: flangeLen
            },
            designStandard: 'KTR Drive Technology'
        });
    }

    return parts;
}

/**
 * 6. Guide Flanges 3D CAD Parametric Generation
 * Creates hollow tube retaining flanges along Z axis.
 */
export function createGuideFlange3DParts(
    basePos: { x: number; y: number; z: number },
    faceW: number,
    boreDia: number,
    flangeOuterDia: number,
    flangeOption: 'none' | 'both' | 'front' | 'back' = 'none',
    thickness = 2.0,
    labelPrefix = ''
): DynamicPart3DDef[] {
    if (flangeOption === 'none') return [];
    const parts: DynamicPart3DDef[] = [];

    // Front flange (+Z)
    if (flangeOption === 'both' || flangeOption === 'front') {
        parts.push({
            id: `guide_flange_front_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: `${labelPrefix}Ön Kılavuz Flanş (Ø${flangeOuterDia.toFixed(1)} mm, s=${thickness} mm)`,
            kind: 'tube',
            color: '#f59e0b',
            position: { x: basePos.x, y: basePos.y, z: basePos.z + faceW / 2 + thickness / 2 },
            rotation: { x: 90, y: 0, z: 0 },
            params: {
                innerDiameter: boreDia,
                outerDiameter: flangeOuterDia,
                diameter: flangeOuterDia,
                length: thickness
            },
            designStandard: 'ISO 13050 / Pfeifer Industries Guide Flanges'
        });
    }

    // Back flange (-Z)
    if (flangeOption === 'both' || flangeOption === 'back') {
        parts.push({
            id: `guide_flange_back_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: `${labelPrefix}Arka Kılavuz Flanş (Ø${flangeOuterDia.toFixed(1)} mm, s=${thickness} mm)`,
            kind: 'tube',
            color: '#f59e0b',
            position: { x: basePos.x, y: basePos.y, z: basePos.z - faceW / 2 - thickness / 2 },
            rotation: { x: 90, y: 0, z: 0 },
            params: {
                innerDiameter: boreDia,
                outerDiameter: flangeOuterDia,
                diameter: flangeOuterDia,
                length: thickness
            },
            designStandard: 'ISO 13050 / Pfeifer Industries Guide Flanges'
        });
    }

    return parts;
}
