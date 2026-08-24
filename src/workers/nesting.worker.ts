/**
 * Nesting Web Worker
 * Runs 2D bin packing algorithm in separate thread
 */

import type {
    NestingJob,
    NestingResult,
    SheetResult,
    PlacedPart,
    FreeRectangle,
    Part2D,
    Polygon,
    Point2D,
    BoundingBox
} from '@/types/nesting2d.types';

// ============================================
// WORKER MESSAGE HANDLING
// ============================================

self.onmessage = (event: MessageEvent) => {
    const { type, payload } = event.data;

    if (type === 'start' && payload) {
        try {
            const job = payload as NestingJob;
            const result = runNesting(job);
            self.postMessage({ type: 'complete', payload: result });
        } catch (error) {
            self.postMessage({
                type: 'error',
                payload: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    if (type === 'cancel') {
        // Future: implement cancellation token
        self.postMessage({ type: 'cancelled' });
    }
};

// ============================================
// GEOMETRY UTILITIES (Worker-local copies)
// ============================================

function calculateBoundingBox(points: Point2D[]): BoundingBox {
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

function rotatePolygon(polygon: Polygon, angleDegrees: number): Polygon {
    if (angleDegrees === 0) return polygon;

    const angleRad = (angleDegrees * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    const cx = polygon.points.reduce((sum, p) => sum + p.x, 0) / polygon.points.length;
    const cy = polygon.points.reduce((sum, p) => sum + p.y, 0) / polygon.points.length;

    const rotatedPoints = polygon.points.map(p => ({
        x: cos * (p.x - cx) - sin * (p.y - cy) + cx,
        y: sin * (p.x - cx) + cos * (p.y - cy) + cy
    }));

    return createPolygon(rotatedPoints);
}

function normalizePolygon(polygon: Polygon): Polygon {
    const { x, y } = polygon.bounds;
    const translatedPoints = polygon.points.map(p => ({
        x: p.x - x,
        y: p.y - y
    }));
    return createPolygon(translatedPoints);
}

function translatePolygon(polygon: Polygon, dx: number, dy: number): Polygon {
    const translatedPoints = polygon.points.map(p => ({
        x: p.x + dx,
        y: p.y + dy
    }));
    return createPolygon(translatedPoints);
}

/**
 * Offset polygon outward by a given amount (for kerf compensation)
 * Uses simple parallel edge offset with miter joins
 * @param polygon - Original polygon
 * @param offset - Offset amount (positive = outward, negative = inward)
 */
function offsetPolygon(polygon: Polygon, offset: number): Polygon {
    if (offset === 0 || polygon.points.length < 3) {
        return polygon;
    }

    const points = polygon.points;
    const n = points.length;
    const offsetPoints: Point2D[] = [];

    for (let i = 0; i < n; i++) {
        const prev = points[(i - 1 + n) % n];
        const curr = points[i];
        const next = points[(i + 1) % n];

        // Calculate edge vectors
        const edge1 = { x: curr.x - prev.x, y: curr.y - prev.y };
        const edge2 = { x: next.x - curr.x, y: next.y - curr.y };

        // Normalize edge vectors
        const len1 = Math.sqrt(edge1.x * edge1.x + edge1.y * edge1.y);
        const len2 = Math.sqrt(edge2.x * edge2.x + edge2.y * edge2.y);

        if (len1 < 0.0001 || len2 < 0.0001) {
            offsetPoints.push({ x: curr.x, y: curr.y });
            continue;
        }

        const norm1 = { x: edge1.x / len1, y: edge1.y / len1 };
        const norm2 = { x: edge2.x / len2, y: edge2.y / len2 };

        // Calculate outward normals (perpendicular, left side for CCW polygon)
        const normal1 = { x: -norm1.y, y: norm1.x };
        const normal2 = { x: -norm2.y, y: norm2.x };

        // Average normal at vertex (approximation for miter join)
        const avgNormal = {
            x: normal1.x + normal2.x,
            y: normal1.y + normal2.y
        };
        const avgLen = Math.sqrt(avgNormal.x * avgNormal.x + avgNormal.y * avgNormal.y);

        if (avgLen < 0.0001) {
            // Straight edge, use single normal
            offsetPoints.push({
                x: curr.x + normal1.x * offset,
                y: curr.y + normal1.y * offset
            });
        } else {
            // Compute miter offset
            const miterScale = 1 / (avgLen / 2);
            const limitedMiter = Math.min(miterScale, 2); // Limit miter to avoid spikes
            offsetPoints.push({
                x: curr.x + (avgNormal.x / avgLen) * offset * limitedMiter,
                y: curr.y + (avgNormal.y / avgLen) * offset * limitedMiter
            });
        }
    }

    return createPolygon(offsetPoints);
}

// ============================================
// GUILLOTINE 2D BIN PACKING ALGORITHM
// ============================================

interface PartInstance {
    part: Part2D;
    instanceIndex: number;
    bestRotation: number;
    normalizedPolygon: Polygon;
}

function runNesting(job: NestingJob): NestingResult {
    const startTime = performance.now();
    const { parts, sheet, options } = job;

    // Calculate kerf offset (half of beam width, outward)
    const kerfOffset = sheet.kerf / 2;

    // Expand parts by quantity
    const instances: PartInstance[] = [];
    for (const part of parts) {
        for (let i = 0; i < part.quantity; i++) {
            // Apply kerf offset to expand the part's bounding area
            let polygon = part.polygon;
            if (kerfOffset > 0) {
                polygon = offsetPolygon(polygon, kerfOffset);
            }
            const normalized = normalizePolygon(polygon);
            instances.push({
                part,
                instanceIndex: i,
                bestRotation: 0,
                normalizedPolygon: normalized
            });
        }
    }

    // Sort by area (largest first) - classic FFD heuristic
    instances.sort((a, b) => b.normalizedPolygon.area - a.normalizedPolygon.area);

    const sheets: SheetResult[] = [];
    const unplacedParts: { partId: string; reason: string }[] = [];
    let currentSheetIndex = 0;

    // Initialize first sheet
    let freeRectangles: FreeRectangle[] = [
        { x: 0, y: 0, width: sheet.width, height: sheet.height }
    ];
    let placedParts: PlacedPart[] = [];
    let usedArea = 0;

    const totalInstances = instances.length;
    let processedInstances = 0;

    for (const instance of instances) {
        processedInstances++;

        // Send progress update
        self.postMessage({
            type: 'progress',
            payload: {
                currentPart: processedInstances,
                totalParts: totalInstances,
                currentSheet: currentSheetIndex + 1,
                percent: Math.round((processedInstances / totalInstances) * 100)
            }
        });

        const placement = findBestPlacement(
            instance,
            freeRectangles,
            sheet,
            options
        );

        if (placement) {
            // Place the part
            const { rectIndex, rotation, position } = placement;

            let polygon = instance.normalizedPolygon;
            if (rotation !== 0) {
                polygon = rotatePolygon(polygon, rotation);
                polygon = normalizePolygon(polygon);
            }
            polygon = translatePolygon(polygon, position.x, position.y);

            const placedPart: PlacedPart = {
                partId: instance.part.id,
                label: instance.part.label,
                position,
                rotation,
                polygon,
                instanceIndex: instance.instanceIndex
            };

            placedParts.push(placedPart);
            usedArea += polygon.area;

            // Split the free rectangle (Guillotine split)
            freeRectangles = splitRectangle(
                freeRectangles,
                rectIndex,
                polygon.bounds,
                options.spacing
            );

        } else if (options.multiSheet && (options.maxSheets === 0 || currentSheetIndex < options.maxSheets - 1)) {
            // Start new sheet
            const sheetArea = sheet.width * sheet.height;
            sheets.push({
                sheetIndex: currentSheetIndex,
                placedParts,
                freeRectangles,
                usedArea,
                wasteArea: sheetArea - usedArea,
                efficiency: (usedArea / sheetArea) * 100
            });

            currentSheetIndex++;
            freeRectangles = [{ x: 0, y: 0, width: sheet.width, height: sheet.height }];
            placedParts = [];
            usedArea = 0;

            // Re-try placement on new sheet
            const retryPlacement = findBestPlacement(instance, freeRectangles, sheet, options);
            if (retryPlacement) {
                const { rectIndex, rotation, position } = retryPlacement;
                let polygon = instance.normalizedPolygon;
                if (rotation !== 0) {
                    polygon = rotatePolygon(polygon, rotation);
                    polygon = normalizePolygon(polygon);
                }
                polygon = translatePolygon(polygon, position.x, position.y);

                placedParts.push({
                    partId: instance.part.id,
                    label: instance.part.label,
                    position,
                    rotation,
                    polygon,
                    instanceIndex: instance.instanceIndex
                });
                usedArea += polygon.area;
                freeRectangles = splitRectangle(freeRectangles, rectIndex, polygon.bounds, options.spacing);
            } else {
                unplacedParts.push({
                    partId: instance.part.id,
                    reason: 'Part too large for sheet'
                });
            }
        } else {
            unplacedParts.push({
                partId: instance.part.id,
                reason: options.multiSheet ? 'Max sheets reached' : 'No fit on sheet'
            });
        }
    }

    // Finalize last sheet
    const sheetArea = sheet.width * sheet.height;
    if (placedParts.length > 0) {
        sheets.push({
            sheetIndex: currentSheetIndex,
            placedParts,
            freeRectangles,
            usedArea,
            wasteArea: sheetArea - usedArea,
            efficiency: (usedArea / sheetArea) * 100
        });
    }

    // Calculate totals
    const totalUsedArea = sheets.reduce((sum, s) => sum + s.usedArea, 0);
    const totalSheetArea = sheets.length * sheetArea;

    return {
        sheets,
        totalSheets: sheets.length,
        totalEfficiency: totalSheetArea > 0 ? (totalUsedArea / totalSheetArea) * 100 : 0,
        totalWaste: totalSheetArea - totalUsedArea,
        unplacedParts,
        computeTimeMs: performance.now() - startTime
    };
}

// ============================================
// PLACEMENT FINDING
// ============================================

interface PlacementResult {
    rectIndex: number;
    rotation: number;
    position: Point2D;
    score: number;
}

function findBestPlacement(
    instance: PartInstance,
    freeRects: FreeRectangle[],
    sheet: { width: number; height: number; kerf: number },
    options: { rotationStep: number; spacing: number; heuristic: string }
): PlacementResult | null {
    let bestPlacement: PlacementResult | null = null;
    let bestScore = Infinity;

    const rotations = options.rotationStep > 0
        ? Array.from({ length: Math.floor(360 / options.rotationStep) }, (_, i) => i * options.rotationStep)
        : [0];

    for (let rectIndex = 0; rectIndex < freeRects.length; rectIndex++) {
        const rect = freeRects[rectIndex];

        for (const rotation of rotations) {
            let polygon = instance.normalizedPolygon;
            if (rotation !== 0) {
                polygon = rotatePolygon(polygon, rotation);
                polygon = normalizePolygon(polygon);
            }

            const partWidth = polygon.bounds.width + options.spacing;
            const partHeight = polygon.bounds.height + options.spacing;

            // Check if part fits in rectangle
            if (partWidth <= rect.width && partHeight <= rect.height) {
                const score = calculateScore(
                    rect,
                    partWidth,
                    partHeight,
                    options.heuristic
                );

                if (score < bestScore) {
                    bestScore = score;
                    bestPlacement = {
                        rectIndex,
                        rotation,
                        position: { x: rect.x, y: rect.y },
                        score
                    };
                }
            }
        }
    }

    return bestPlacement;
}

function calculateScore(
    rect: FreeRectangle,
    partWidth: number,
    partHeight: number,
    heuristic: string
): number {
    const leftoverWidth = rect.width - partWidth;
    const leftoverHeight = rect.height - partHeight;

    switch (heuristic) {
        case 'best-short-side-fit':
            return Math.min(leftoverWidth, leftoverHeight);
        case 'best-long-side-fit':
            return Math.max(leftoverWidth, leftoverHeight);
        case 'best-area-fit':
        default:
            return leftoverWidth * leftoverHeight;
    }
}

// ============================================
// GUILLOTINE RECTANGLE SPLITTING
// ============================================

function splitRectangle(
    freeRects: FreeRectangle[],
    rectIndex: number,
    partBounds: BoundingBox,
    spacing: number
): FreeRectangle[] {
    const rect = freeRects[rectIndex];
    const newRects = freeRects.filter((_, i) => i !== rectIndex);

    const partWidth = partBounds.width + spacing;
    const partHeight = partBounds.height + spacing;

    // Horizontal split (rightmost remainder)
    const rightWidth = rect.width - partWidth;
    if (rightWidth > 1) {
        newRects.push({
            x: rect.x + partWidth,
            y: rect.y,
            width: rightWidth,
            height: rect.height
        });
    }

    // Vertical split (top remainder)
    const topHeight = rect.height - partHeight;
    if (topHeight > 1) {
        newRects.push({
            x: rect.x,
            y: rect.y + partHeight,
            width: partWidth, // Only up to part width for guillotine
            height: topHeight
        });
    }

    // Merge overlapping rectangles (optional optimization)
    return mergeRectangles(newRects);
}

function mergeRectangles(rects: FreeRectangle[]): FreeRectangle[] {
    // Simple containment removal - if one rect contains another, keep only the larger
    const result: FreeRectangle[] = [];

    for (const rect of rects) {
        let contained = false;
        for (const other of rects) {
            if (rect !== other && isContained(rect, other)) {
                contained = true;
                break;
            }
        }
        if (!contained) {
            result.push(rect);
        }
    }

    return result;
}

function isContained(inner: FreeRectangle, outer: FreeRectangle): boolean {
    return (
        inner.x >= outer.x &&
        inner.y >= outer.y &&
        inner.x + inner.width <= outer.x + outer.width &&
        inner.y + inner.height <= outer.y + outer.height
    );
}

// Export for TypeScript (required for module workers)
export { };
