/**
 * DXF Parser Utility
 * Converts DXF entities (LINE, ARC, CIRCLE, LWPOLYLINE) to Simple Polygons
 */

import DxfParser from 'dxf-parser';
import type { Point2D, Polygon, Part2D, BoundingBox } from '@/types/nesting2d.types';

// ============================================
// TYPES
// ============================================

export interface DxfParseResult {
    parts: Part2D[];
    errors: string[];
    warnings: string[];
    rawEntityCount: number;
    skippedTypes: Record<string, number>;
}

interface DxfEntity {
    type: string;
    // LINE
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    // ARC
    center?: { x: number; y: number };
    radius?: number;
    startAngle?: number;
    endAngle?: number;
    // CIRCLE
    // uses center and radius
    // LWPOLYLINE / POLYLINE
    vertices?: Array<{ x: number; y: number; bulge?: number }>;
    shape?: boolean; // closed
    // Common
    layer?: string;
}

// ============================================
// CONSTANTS
// ============================================

/** Arc approximation tolerance in mm */
const ARC_TOLERANCE = 0.1;

/** Minimum points to consider a valid polygon */
const MIN_POLYGON_POINTS = 3;

// ============================================
// GEOMETRY UTILITIES
// ============================================

function calculateBoundingBox(points: Point2D[]): BoundingBox {
    if (points.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function calculatePolygonArea(points: Point2D[]): number {
    let area = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }
    return Math.abs(area / 2);
}

function createPolygon(points: Point2D[]): Polygon {
    return {
        points,
        bounds: calculateBoundingBox(points),
        area: calculatePolygonArea(points)
    };
}

/**
 * Calculate number of segments needed to approximate an arc
 * Based on tolerance (max deviation from true arc)
 */
function calculateArcSegments(radius: number, angleSpan: number): number {
    if (radius <= 0 || angleSpan <= 0) return 1;
    // Using the formula: tolerance = radius * (1 - cos(theta/2))
    // Solving for theta: theta = 2 * acos(1 - tolerance/radius)
    const maxAngle = 2 * Math.acos(Math.max(0, 1 - ARC_TOLERANCE / radius));
    const segments = Math.max(1, Math.ceil(angleSpan / maxAngle));
    return Math.min(segments, 360); // Cap at 360 segments
}

/**
 * Approximate an arc as line segments
 */
function approximateArc(
    cx: number,
    cy: number,
    radius: number,
    startAngleDeg: number,
    endAngleDeg: number
): Point2D[] {
    // Convert to radians
    let startAngle = (startAngleDeg * Math.PI) / 180;
    let endAngle = (endAngleDeg * Math.PI) / 180;

    // Ensure we go counter-clockwise (DXF standard)
    if (endAngle <= startAngle) {
        endAngle += 2 * Math.PI;
    }

    const angleSpan = endAngle - startAngle;
    const segments = calculateArcSegments(radius, angleSpan);
    const points: Point2D[] = [];

    for (let i = 0; i <= segments; i++) {
        const angle = startAngle + (angleSpan * i) / segments;
        points.push({
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle)
        });
    }

    return points;
}

/**
 * Approximate a full circle as polygon
 */
function approximateCircle(cx: number, cy: number, radius: number): Point2D[] {
    return approximateArc(cx, cy, radius, 0, 360);
}

/**
 * Handle polyline bulge (arc between vertices)
 * Bulge = tan(theta/4) where theta is the arc's included angle
 */
function processBulge(
    start: Point2D,
    end: Point2D,
    bulge: number
): Point2D[] {
    if (Math.abs(bulge) < 0.0001) {
        return [start]; // Straight line, just return start point
    }

    // Calculate arc parameters from bulge
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const chordLength = Math.sqrt(dx * dx + dy * dy);

    // Included angle: theta = 4 * atan(bulge)
    const theta = 4 * Math.atan(Math.abs(bulge));

    // Radius: r = chord / (2 * sin(theta/2))
    const radius = chordLength / (2 * Math.sin(theta / 2));

    // Sagitta (height of arc): s = r * (1 - cos(theta/2))
    const sagitta = radius * (1 - Math.cos(theta / 2));

    // Direction from start to end
    const chordAngle = Math.atan2(dy, dx);

    // Center is perpendicular to chord at midpoint
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    // Distance from midpoint to center
    const d = radius - sagitta;

    // Perpendicular direction (depends on bulge sign)
    const perpAngle = chordAngle + (bulge > 0 ? Math.PI / 2 : -Math.PI / 2);

    const cx = midX + d * Math.cos(perpAngle);
    const cy = midY + d * Math.sin(perpAngle);

    // Start and end angles from center
    const startAngle = Math.atan2(start.y - cy, start.x - cx) * 180 / Math.PI;
    const endAngle = Math.atan2(end.y - cy, end.x - cx) * 180 / Math.PI;

    // Generate arc points (excluding end point, will be added by next segment)
    const arcPoints = approximateArc(cx, cy, radius, startAngle, endAngle);
    return arcPoints.slice(0, -1); // Remove last point (will be added as next vertex)
}

// ============================================
// ENTITY CONVERTERS
// ============================================

function convertLine(entity: DxfEntity): Point2D[] {
    if (!entity.start || !entity.end) return [];
    return [
        { x: entity.start.x, y: entity.start.y },
        { x: entity.end.x, y: entity.end.y }
    ];
}

function convertArc(entity: DxfEntity): Point2D[] {
    if (!entity.center || !entity.radius) return [];
    return approximateArc(
        entity.center.x,
        entity.center.y,
        entity.radius,
        entity.startAngle || 0,
        entity.endAngle || 360
    );
}

function convertCircle(entity: DxfEntity): Point2D[] {
    if (!entity.center || !entity.radius) return [];
    return approximateCircle(entity.center.x, entity.center.y, entity.radius);
}

function convertPolyline(entity: DxfEntity): Point2D[] {
    if (!entity.vertices || entity.vertices.length < 2) return [];

    const points: Point2D[] = [];
    const vertices = entity.vertices;

    for (let i = 0; i < vertices.length; i++) {
        const curr = vertices[i];
        const next = vertices[(i + 1) % vertices.length];

        if (curr.bulge && i < vertices.length - 1) {
            // Has bulge - convert to arc
            const arcPoints = processBulge(
                { x: curr.x, y: curr.y },
                { x: next.x, y: next.y },
                curr.bulge
            );
            points.push(...arcPoints);
        } else {
            points.push({ x: curr.x, y: curr.y });
        }
    }

    return points;
}

// ============================================
// CHAIN BUILDING
// ============================================

interface EntityChain {
    points: Point2D[];
    closed: boolean;
}

/**
 * Try to connect entities into closed polygons
 */
function buildPolygonChains(entities: DxfEntity[]): EntityChain[] {
    const chains: EntityChain[] = [];
    const used = new Set<number>();

    // First, handle self-contained entities (circles, closed polylines)
    entities.forEach((entity, index) => {
        if (entity.type === 'CIRCLE') {
            const points = convertCircle(entity);
            if (points.length >= MIN_POLYGON_POINTS) {
                chains.push({ points, closed: true });
                used.add(index);
            }
        } else if ((entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') && entity.shape) {
            const points = convertPolyline(entity);
            if (points.length >= MIN_POLYGON_POINTS) {
                chains.push({ points, closed: true });
                used.add(index);
            }
        }
    });

    // Then handle open polylines as individual parts
    entities.forEach((entity, index) => {
        if (used.has(index)) return;

        if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
            const points = convertPolyline(entity);
            if (points.length >= MIN_POLYGON_POINTS) {
                chains.push({ points, closed: false });
                used.add(index);
            }
        } else if (entity.type === 'ARC') {
            const points = convertArc(entity);
            if (points.length >= MIN_POLYGON_POINTS) {
                chains.push({ points, closed: false });
                used.add(index);
            }
        }
    });

    // TODO: Chain LINEs and ARCs into connected paths
    // For MVP, we treat each LINE as separate (may need enhancement)

    return chains;
}

// ============================================
// MAIN PARSER
// ============================================

/**
 * Parse DXF file content to Part2D array
 */
export function parseDxfContent(dxfContent: string, filename: string): DxfParseResult {
    const parts: Part2D[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const skippedTypes: Record<string, number> = {};
    let rawEntityCount = 0;

    try {
        const parser = new DxfParser();
        const dxf = parser.parseSync(dxfContent);

        if (!dxf || !dxf.entities) {
            errors.push('No entities found in DXF file');
            return { parts, errors, warnings, rawEntityCount: 0, skippedTypes };
        }

        rawEntityCount = dxf.entities.length;

        // Track skipped entity types
        const textTypes = ['TEXT', 'MTEXT', 'DIMENSION', 'LEADER', 'ATTDEF', 'ATTRIB'];
        const supportedGeometry = ['LINE', 'ARC', 'CIRCLE', 'LWPOLYLINE', 'POLYLINE'];

        // Count and track skipped types
        for (const e of dxf.entities as DxfEntity[]) {
            if (textTypes.includes(e.type)) {
                skippedTypes[e.type] = (skippedTypes[e.type] || 0) + 1;
            } else if (!supportedGeometry.includes(e.type)) {
                skippedTypes[e.type] = (skippedTypes[e.type] || 0) + 1;
            }
        }

        // Report skipped text/dimension entities
        for (const [type, count] of Object.entries(skippedTypes)) {
            if (textTypes.includes(type)) {
                warnings.push(`Skipped ${count} ${type} entities (text/dimensions not supported for cutting)`);
            }
        }

        // Filter to supported entity types
        const supportedEntities = dxf.entities.filter((e: DxfEntity) =>
            supportedGeometry.includes(e.type)
        );

        if (supportedEntities.length === 0) {
            errors.push('No supported geometry (LINE, ARC, CIRCLE, POLYLINE) found');
            return { parts, errors, warnings, rawEntityCount, skippedTypes };
        }

        // Build polygon chains
        const chains = buildPolygonChains(supportedEntities);

        // Convert chains to Part2D
        chains.forEach((chain, index) => {
            if (chain.points.length >= MIN_POLYGON_POINTS) {
                const polygon = createPolygon(chain.points);

                // Only add if area is meaningful (> 1 mm²)
                if (polygon.area > 1) {
                    parts.push({
                        id: `${filename}-part-${index}`,
                        label: `Part ${index + 1}`,
                        polygon,
                        quantity: 1,
                        allowedRotations: [0, 90, 180, 270],
                        source: filename
                    });
                }
            }
        });

        if (parts.length === 0) {
            errors.push('No valid closed polygons found in DXF');
        }

    } catch (e) {
        errors.push(`DXF parse error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    return { parts, errors, warnings, rawEntityCount, skippedTypes };
}

/**
 * Validate DXF file before full parsing
 */
export function validateDxfFile(file: File): { valid: boolean; error?: string } {
    if (!file.name.toLowerCase().endsWith('.dxf')) {
        return { valid: false, error: 'File must have .dxf extension' };
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
        return { valid: false, error: 'File too large (max 50MB)' };
    }

    return { valid: true };
}
