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
    BoundingBox,
    RemnantSheet2D,
    GuillotineCropCut,
    NestingOptions
} from '@/types/nesting2d.types';
import { executeSigmaNest2D } from '@/cam/nesting/sigmaNestEngine';

// ============================================
// WORKER MESSAGE HANDLING
// ============================================

/** True-shape industrial nesting, off the main thread, with throttled progress. */
function runTrueShape(job: NestingJob): NestingResult {
    let last = 0;
    return executeSigmaNest2D({
        parts: job.parts,
        sheet: job.sheet,
        options: job.options,
        maxCells: 4_000_000,
        onProgress: (placed, total, sheetIndex) => {
            const now = performance.now();
            if (now - last < 80 && placed < total) return;
            last = now;
            self.postMessage({
                type: 'progress',
                payload: {
                    currentPart: placed,
                    totalParts: total,
                    currentSheet: sheetIndex + 1,
                    percent: Math.round((placed / Math.max(1, total)) * 100),
                },
            });
        },
    });
}

self.onmessage = (event: MessageEvent) => {
    const { type, payload } = event.data;

    if (type === 'start' && payload) {
        try {
            const job = payload as NestingJob;
            const result = job.options.algorithm === 'sigmanest' ? runTrueShape(job) : runNesting(job);
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

            const innerPolygons = instance.part.innerPolygons?.map(ip => {
                let p = ip;
                if (rotation !== 0) {
                    p = rotatePolygon(p, rotation);
                }
                return translatePolygon(p, position.x, position.y);
            });

            const placedPart: PlacedPart = {
                partId: instance.part.id,
                label: instance.part.label,
                position,
                rotation,
                polygon,
                instanceIndex: instance.instanceIndex,
                innerPolygons,
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
            sheets.push(finalizeSheetResult(
                currentSheetIndex,
                placedParts,
                freeRectangles,
                usedArea,
                sheet,
                options,
                parts
            ));

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

                const innerPolygons = instance.part.innerPolygons?.map(ip => {
                    let p = ip;
                    if (rotation !== 0) {
                        p = rotatePolygon(p, rotation);
                    }
                    return translatePolygon(p, position.x, position.y);
                });

                placedParts.push({
                    partId: instance.part.id,
                    label: instance.part.label,
                    position,
                    rotation,
                    polygon,
                    instanceIndex: instance.instanceIndex,
                    innerPolygons,
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
        sheets.push(finalizeSheetResult(
            currentSheetIndex,
            placedParts,
            freeRectangles,
            usedArea,
            sheet,
            options,
            parts
        ));
    }

    // Calculate totals
    const totalUsedArea = sheets.reduce((sum, s) => sum + s.usedArea, 0);
    const totalSheetArea = sheets.length * sheetArea;
    const generatedRemnants: RemnantSheet2D[] = [];
    sheets.forEach(s => {
        if (s.remnantSheet) generatedRemnants.push(s.remnantSheet);
    });

    const totalRawWeight = sheets.reduce((sum, s) => sum + (s.weights?.sheetWeightKg || 0), 0);
    const totalRemWeight = sheets.reduce((sum, s) => sum + (s.weights?.remnantWeightKg || 0), 0);
    const totalPartsWeight = sheets.reduce((sum, s) => sum + (s.weights?.partsWeightKg || 0), 0);
    const aggregateScrap = Math.max(0, totalRawWeight - totalRemWeight - totalPartsWeight);
    const overallTrueScrap = totalRawWeight > 0 ? (aggregateScrap / totalRawWeight) * 100 : 0;

    return {
        sheets,
        totalSheets: sheets.length,
        totalEfficiency: totalSheetArea > 0 ? (totalUsedArea / totalSheetArea) * 100 : 0,
        totalWaste: totalSheetArea - totalUsedArea,
        unplacedParts,
        computeTimeMs: performance.now() - startTime,
        generatedRemnants,
        overallTrueScrapPercent: Number(overallTrueScrap.toFixed(2))
    };
}

/**
 * Helper to compute SigmaNEST-grade Remnant Sheet, Guillotine Crop Cut, and True Weights
 */
function finalizeSheetResult(
    sheetIndex: number,
    placedParts: PlacedPart[],
    freeRectangles: FreeRectangle[],
    usedArea: number,
    sheet: { width: number; height: number; kerf: number },
    options: NestingOptions,
    parts: Part2D[]
): SheetResult {
    const sheetArea = sheet.width * sheet.height;
    let maxUsedX = 0;
    let maxUsedY = 0;
    placedParts.forEach(p => {
        maxUsedX = Math.max(maxUsedX, p.polygon.bounds.x + p.polygon.bounds.width);
        maxUsedY = Math.max(maxUsedY, p.polygon.bounds.y + p.polygon.bounds.height);
    });

    const spacing = options.spacing || 6;
    const usedEnvelope = {
        width: Math.min(sheet.width, Math.round(maxUsedX + spacing)),
        height: Math.min(sheet.height, Math.round(maxUsedY + spacing))
    };

    const minRemnantDim = options.minRemnantDimensionMm || 400;
    const remainingW = sheet.width - usedEnvelope.width;
    const remainingH = sheet.height - usedEnvelope.height;

    let remnantSheet: RemnantSheet2D | undefined;
    let cropCut: GuillotineCropCut | undefined;

    const firstPart = parts[0];
    const thickness = firstPart?.thickness || 30;
    const material = firstPart?.material || 'S235JR';
    const density = 7.85; // g/cm³ default steel

    const calculateWeight = (areaMm2: number) => (areaMm2 * thickness * density) / 1_000_000;

    if (remainingW >= minRemnantDim) {
        const cropX = usedEnvelope.width + sheet.kerf;
        cropCut = {
            axis: 'x',
            coordinate: cropX,
            startPoint: { x: cropX, y: sheet.height },
            endPoint: { x: cropX, y: 0 },
            lengthMm: sheet.height,
            piercePoint: { x: cropX, y: sheet.height + 10 }
        };
        const remW = sheet.width - cropX;
        const remH = sheet.height;
        remnantSheet = {
            id: `TaskSheet${sheetIndex + 1}-1`,
            name: `Kalıntı Sac (${material} ${thickness}mm)`,
            material,
            thickness,
            width: Math.round(remW),
            height: Math.round(remH),
            originX: Math.round(cropX),
            originY: 0,
            weightKg: Number(calculateWeight(remW * remH).toFixed(2)),
            originSheetIndex: sheetIndex,
            createdAt: new Date().toISOString(),
            barcode: `REM-${Math.round(cropX)}-${Math.round(remW)}x${Math.round(remH)}`
        };
    } else if (remainingH >= minRemnantDim) {
        const cropY = usedEnvelope.height + sheet.kerf;
        cropCut = {
            axis: 'y',
            coordinate: cropY,
            startPoint: { x: sheet.width, y: cropY },
            endPoint: { x: 0, y: cropY },
            lengthMm: sheet.width,
            piercePoint: { x: sheet.width + 10, y: cropY }
        };
        const remW = sheet.width;
        const remH = sheet.height - cropY;
        remnantSheet = {
            id: `TaskSheet${sheetIndex + 1}-1`,
            name: `Kalıntı Sac (${material} ${thickness}mm)`,
            material,
            thickness,
            width: Math.round(remW),
            height: Math.round(remH),
            originX: 0,
            originY: Math.round(cropY),
            weightKg: Number(calculateWeight(remW * remH).toFixed(2)),
            originSheetIndex: sheetIndex,
            createdAt: new Date().toISOString(),
            barcode: `REM-${Math.round(cropY)}-${Math.round(remW)}x${Math.round(remH)}`
        };
    }

    const rawSheetWeight = calculateWeight(sheetArea);
    const partsWeight = calculateWeight(usedArea);
    const remnantWeight = remnantSheet ? remnantSheet.weightKg : 0;
    const usedPlateArea = usedEnvelope.width * sheet.height;
    const usedWeight = calculateWeight(usedPlateArea);
    const scrapWeight = Math.max(0, rawSheetWeight - remnantWeight - partsWeight);
    const trueScrapPct = rawSheetWeight > 0 ? (scrapWeight / rawSheetWeight) * 100 : 0;

    return {
        sheetIndex,
        placedParts,
        freeRectangles,
        usedArea,
        wasteArea: sheetArea - usedArea,
        efficiency: (usedArea / sheetArea) * 100,
        remnantSheet,
        cropCut,
        trueScrapPercent: Number(trueScrapPct.toFixed(2)),
        usedEnvelope,
        weights: {
            sheetWeightKg: Number(rawSheetWeight.toFixed(2)),
            usedWeightKg: Number(usedWeight.toFixed(2)),
            remnantWeightKg: Number(remnantWeight.toFixed(2)),
            partsWeightKg: Number(partsWeight.toFixed(2)),
            scrapWeightKg: Number(scrapWeight.toFixed(2))
        }
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
