/**
 * SVG Parser
 * Converts SVG elements to Polygon geometry for 2D nesting
 */

import type { Point2D, Polygon, Part2D, BoundingBox, SVGParseResult } from '@/types/nesting2d.types';

// ============================================
// BOUNDING BOX UTILITIES
// ============================================

export function calculateBoundingBox(points: Point2D[]): BoundingBox {
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

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
}

export function calculatePolygonArea(points: Point2D[]): number {
    // Shoelace formula
    let area = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }
    return Math.abs(area / 2);
}

export function createPolygon(points: Point2D[]): Polygon {
    return {
        points,
        bounds: calculateBoundingBox(points),
        area: calculatePolygonArea(points)
    };
}

// ============================================
// SVG PATH PARSING
// ============================================

// Curve approximation tolerance (mm)
const CURVE_TOLERANCE = 0.5;

/**
 * Approximate cubic Bezier curve as line segments
 */
function cubicBezier(
    x0: number, y0: number,
    x1: number, y1: number,
    x2: number, y2: number,
    x3: number, y3: number,
    segments: number
): Point2D[] {
    const points: Point2D[] = [];
    for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const t2 = t * t;
        const t3 = t2 * t;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;

        points.push({
            x: mt3 * x0 + 3 * mt2 * t * x1 + 3 * mt * t2 * x2 + t3 * x3,
            y: mt3 * y0 + 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t3 * y3
        });
    }
    return points;
}

/**
 * Approximate quadratic Bezier curve as line segments
 */
function quadraticBezier(
    x0: number, y0: number,
    x1: number, y1: number,
    x2: number, y2: number,
    segments: number
): Point2D[] {
    const points: Point2D[] = [];
    for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const mt = 1 - t;

        points.push({
            x: mt * mt * x0 + 2 * mt * t * x1 + t * t * x2,
            y: mt * mt * y0 + 2 * mt * t * y1 + t * t * y2
        });
    }
    return points;
}

/**
 * Approximate elliptical arc as line segments
 */
function arcToPoints(
    x0: number, y0: number,
    rx: number, ry: number,
    xAxisRotation: number,
    largeArcFlag: boolean,
    sweepFlag: boolean,
    x: number, y: number
): Point2D[] {
    // Handle degenerate cases
    if (rx === 0 || ry === 0) {
        return [{ x, y }];
    }

    // Convert arc to center parameterization
    const phi = (xAxisRotation * Math.PI) / 180;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    const dx = (x0 - x) / 2;
    const dy = (y0 - y) / 2;

    const x1p = cosPhi * dx + sinPhi * dy;
    const y1p = -sinPhi * dx + cosPhi * dy;

    // Correct radii if needed
    let rxS = rx * rx;
    let ryS = ry * ry;
    const x1pS = x1p * x1p;
    const y1pS = y1p * y1p;

    const lambda = x1pS / rxS + y1pS / ryS;
    if (lambda > 1) {
        const lambdaSqrt = Math.sqrt(lambda);
        rx *= lambdaSqrt;
        ry *= lambdaSqrt;
        rxS = rx * rx;
        ryS = ry * ry;
    }

    // Calculate center
    let sq = (rxS * ryS - rxS * y1pS - ryS * x1pS) / (rxS * y1pS + ryS * x1pS);
    sq = Math.max(0, sq);
    const coef = (largeArcFlag === sweepFlag ? -1 : 1) * Math.sqrt(sq);
    const cxp = coef * ((rx * y1p) / ry);
    const cyp = coef * (-(ry * x1p) / rx);

    const cx = cosPhi * cxp - sinPhi * cyp + (x0 + x) / 2;
    const cy = sinPhi * cxp + cosPhi * cyp + (y0 + y) / 2;

    // Calculate angles
    const ux = (x1p - cxp) / rx;
    const uy = (y1p - cyp) / ry;
    const vx = (-x1p - cxp) / rx;
    const vy = (-y1p - cyp) / ry;

    let theta1 = Math.atan2(uy, ux);
    let dTheta = Math.atan2(vy, vx) - theta1;

    if (!sweepFlag && dTheta > 0) {
        dTheta -= 2 * Math.PI;
    } else if (sweepFlag && dTheta < 0) {
        dTheta += 2 * Math.PI;
    }

    // Calculate number of segments based on arc length
    const segments = Math.max(4, Math.ceil(Math.abs(dTheta) / (Math.PI / 8)));

    const points: Point2D[] = [];
    for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const angle = theta1 + dTheta * t;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        const px = cosPhi * (rx * cosA) - sinPhi * (ry * sinA) + cx;
        const py = sinPhi * (rx * cosA) + cosPhi * (ry * sinA) + cy;

        points.push({ x: px, y: py });
    }

    return points;
}

/**
 * Parse SVG path d attribute to points
 * Supports: M, L, H, V, C, S, Q, T, A, Z (both absolute and relative)
 */
export function parseSVGPath(d: string): Point2D[] {
    const points: Point2D[] = [];
    // Match all path commands including curves
    const commands = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];

    let currentX = 0;
    let currentY = 0;
    let startX = 0;
    let startY = 0;
    let lastControlX = 0;
    let lastControlY = 0;
    let lastCommand = '';

    for (const cmd of commands) {
        const type = cmd[0];
        const args = cmd.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
        const isRelative = type === type.toLowerCase();

        switch (type.toUpperCase()) {
            case 'M': // Move to
                if (isRelative) {
                    currentX += args[0] || 0;
                    currentY += args[1] || 0;
                } else {
                    currentX = args[0] || 0;
                    currentY = args[1] || 0;
                }
                startX = currentX;
                startY = currentY;
                points.push({ x: currentX, y: currentY });
                // Implicit line-to after first pair
                for (let i = 2; i < args.length; i += 2) {
                    if (isRelative) {
                        currentX += args[i];
                        currentY += args[i + 1];
                    } else {
                        currentX = args[i];
                        currentY = args[i + 1];
                    }
                    points.push({ x: currentX, y: currentY });
                }
                break;

            case 'L': // Line to
                for (let i = 0; i < args.length; i += 2) {
                    if (isRelative) {
                        currentX += args[i];
                        currentY += args[i + 1];
                    } else {
                        currentX = args[i];
                        currentY = args[i + 1];
                    }
                    points.push({ x: currentX, y: currentY });
                }
                break;

            case 'H': // Horizontal line
                for (const arg of args) {
                    currentX = isRelative ? currentX + arg : arg;
                    points.push({ x: currentX, y: currentY });
                }
                break;

            case 'V': // Vertical line
                for (const arg of args) {
                    currentY = isRelative ? currentY + arg : arg;
                    points.push({ x: currentX, y: currentY });
                }
                break;

            case 'C': // Cubic Bezier
                for (let i = 0; i + 5 < args.length; i += 6) {
                    let x1 = args[i], y1 = args[i + 1];
                    let x2 = args[i + 2], y2 = args[i + 3];
                    let x = args[i + 4], y = args[i + 5];

                    if (isRelative) {
                        x1 += currentX; y1 += currentY;
                        x2 += currentX; y2 += currentY;
                        x += currentX; y += currentY;
                    }

                    const curvePoints = cubicBezier(currentX, currentY, x1, y1, x2, y2, x, y, 8);
                    points.push(...curvePoints);

                    lastControlX = x2;
                    lastControlY = y2;
                    currentX = x;
                    currentY = y;
                }
                break;

            case 'S': // Smooth cubic Bezier
                for (let i = 0; i + 3 < args.length; i += 4) {
                    // Reflect last control point
                    let x1 = currentX, y1 = currentY;
                    if (lastCommand === 'C' || lastCommand === 'S') {
                        x1 = 2 * currentX - lastControlX;
                        y1 = 2 * currentY - lastControlY;
                    }

                    let x2 = args[i], y2 = args[i + 1];
                    let x = args[i + 2], y = args[i + 3];

                    if (isRelative) {
                        x2 += currentX; y2 += currentY;
                        x += currentX; y += currentY;
                    }

                    const curvePoints = cubicBezier(currentX, currentY, x1, y1, x2, y2, x, y, 8);
                    points.push(...curvePoints);

                    lastControlX = x2;
                    lastControlY = y2;
                    currentX = x;
                    currentY = y;
                }
                break;

            case 'Q': // Quadratic Bezier
                for (let i = 0; i + 3 < args.length; i += 4) {
                    let x1 = args[i], y1 = args[i + 1];
                    let x = args[i + 2], y = args[i + 3];

                    if (isRelative) {
                        x1 += currentX; y1 += currentY;
                        x += currentX; y += currentY;
                    }

                    const curvePoints = quadraticBezier(currentX, currentY, x1, y1, x, y, 6);
                    points.push(...curvePoints);

                    lastControlX = x1;
                    lastControlY = y1;
                    currentX = x;
                    currentY = y;
                }
                break;

            case 'T': // Smooth quadratic Bezier
                for (let i = 0; i + 1 < args.length; i += 2) {
                    // Reflect last control point
                    let x1 = currentX, y1 = currentY;
                    if (lastCommand === 'Q' || lastCommand === 'T') {
                        x1 = 2 * currentX - lastControlX;
                        y1 = 2 * currentY - lastControlY;
                    }

                    let x = args[i], y = args[i + 1];
                    if (isRelative) {
                        x += currentX;
                        y += currentY;
                    }

                    const curvePoints = quadraticBezier(currentX, currentY, x1, y1, x, y, 6);
                    points.push(...curvePoints);

                    lastControlX = x1;
                    lastControlY = y1;
                    currentX = x;
                    currentY = y;
                }
                break;

            case 'A': // Arc
                for (let i = 0; i + 6 < args.length; i += 7) {
                    const rx = args[i];
                    const ry = args[i + 1];
                    const rotation = args[i + 2];
                    const largeArc = args[i + 3] !== 0;
                    const sweep = args[i + 4] !== 0;
                    let x = args[i + 5], y = args[i + 6];

                    if (isRelative) {
                        x += currentX;
                        y += currentY;
                    }

                    const arcPoints = arcToPoints(currentX, currentY, rx, ry, rotation, largeArc, sweep, x, y);
                    points.push(...arcPoints);

                    currentX = x;
                    currentY = y;
                }
                break;

            case 'Z': // Close path
                currentX = startX;
                currentY = startY;
                break;
        }

        lastCommand = type.toUpperCase();
    }

    return points;
}

/**
 * Parse SVG rect element to polygon
 */
export function parseSVGRect(
    x: number,
    y: number,
    width: number,
    height: number
): Point2D[] {
    return [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height }
    ];
}

/**
 * Approximate circle as polygon (n-gon)
 */
export function parseSVGCircle(
    cx: number,
    cy: number,
    r: number,
    segments: number = 32
): Point2D[] {
    const points: Point2D[] = [];
    for (let i = 0; i < segments; i++) {
        const angle = (2 * Math.PI * i) / segments;
        points.push({
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle)
        });
    }
    return points;
}

/**
 * Parse SVG polygon points attribute
 */
export function parseSVGPolygonPoints(pointsStr: string): Point2D[] {
    const coords = pointsStr.trim().split(/[\s,]+/).map(Number);
    const points: Point2D[] = [];
    for (let i = 0; i < coords.length; i += 2) {
        if (!isNaN(coords[i]) && !isNaN(coords[i + 1])) {
            points.push({ x: coords[i], y: coords[i + 1] });
        }
    }
    return points;
}

// ============================================
// FULL SVG FILE PARSING
// ============================================

/**
 * Parse SVG string content into Part2D array
 * @param mergeElements - When true, merges all elements into ONE part (for decorative panels)
 *                       When false, creates separate Part2D for each element
 */
export function parseSVGContent(
    svgContent: string,
    filename: string,
    mergeElements: boolean = true
): SVGParseResult {
    const parts: Part2D[] = [];
    const errors: string[] = [];

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');

        // Check for parse errors
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            errors.push(`SVG parse error: ${parseError.textContent}`);
            return { parts, errors };
        }

        // Collect ALL points from ALL elements (to compute merged bounding box)
        const allPoints: Point2D[] = [];
        const allPolygons: Polygon[] = []; // For potential future hole detection
        let partIndex = 0;

        // Parse <path> elements
        const paths = doc.querySelectorAll('path');
        paths.forEach((path, i) => {
            const d = path.getAttribute('d');
            if (d) {
                const points = parseSVGPath(d);
                if (points.length >= 3) {
                    const poly = createPolygon(points);
                    allPoints.push(...points);
                    allPolygons.push(poly);

                    // If NOT merging, create separate part
                    if (!mergeElements) {
                        parts.push({
                            id: `${filename}-path-${i}`,
                            label: path.getAttribute('id') || `path${++partIndex}`,
                            polygon: poly,
                            quantity: 1,
                            allowedRotations: [0, 90, 180, 270],
                            source: filename
                        });
                    }
                }
            }
        });

        // Parse <rect> elements
        const rects = doc.querySelectorAll('rect');
        rects.forEach((rect, i) => {
            const x = parseFloat(rect.getAttribute('x') || '0');
            const y = parseFloat(rect.getAttribute('y') || '0');
            const width = parseFloat(rect.getAttribute('width') || '0');
            const height = parseFloat(rect.getAttribute('height') || '0');

            if (width > 0 && height > 0) {
                const points = parseSVGRect(x, y, width, height);
                const poly = createPolygon(points);
                allPoints.push(...points);
                allPolygons.push(poly);

                if (!mergeElements) {
                    parts.push({
                        id: `${filename}-rect-${i}`,
                        label: rect.getAttribute('id') || `rect${++partIndex}`,
                        polygon: poly,
                        quantity: 1,
                        allowedRotations: [0, 90, 180, 270],
                        source: filename
                    });
                }
            }
        });

        // Parse <circle> elements
        const circles = doc.querySelectorAll('circle');
        circles.forEach((circle, i) => {
            const cx = parseFloat(circle.getAttribute('cx') || '0');
            const cy = parseFloat(circle.getAttribute('cy') || '0');
            const r = parseFloat(circle.getAttribute('r') || '0');

            if (r > 0) {
                const points = parseSVGCircle(cx, cy, r);
                const poly = createPolygon(points);
                allPoints.push(...points);
                allPolygons.push(poly);

                if (!mergeElements) {
                    parts.push({
                        id: `${filename}-circle-${i}`,
                        label: circle.getAttribute('id') || `circle${++partIndex}`,
                        polygon: poly,
                        quantity: 1,
                        allowedRotations: [0], // Circles don't need rotation
                        source: filename
                    });
                }
            }
        });

        // Parse <polygon> elements
        const polygons = doc.querySelectorAll('polygon');
        polygons.forEach((polygon, i) => {
            const pointsAttr = polygon.getAttribute('points');
            if (pointsAttr) {
                const points = parseSVGPolygonPoints(pointsAttr);
                if (points.length >= 3) {
                    const poly = createPolygon(points);
                    allPoints.push(...points);
                    allPolygons.push(poly);

                    if (!mergeElements) {
                        parts.push({
                            id: `${filename}-polygon-${i}`,
                            label: polygon.getAttribute('id') || `polygon${++partIndex}`,
                            polygon: poly,
                            quantity: 1,
                            allowedRotations: [0, 90, 180, 270],
                            source: filename
                        });
                    }
                }
            }
        });

        // If MERGING: Create single part from merged geometry
        if (mergeElements && allPoints.length >= 3) {
            // Find the LARGEST polygon (by area) - this is likely the outer boundary
            let outerPolygon: Polygon;

            if (allPolygons.length > 0) {
                // Sort by area descending, take largest as outer boundary
                allPolygons.sort((a, b) => b.area - a.area);
                const largestPoly = allPolygons[0];

                // Use bounding box of all points for accurate dimensions
                const mergedBounds = calculateBoundingBox(allPoints);

                // Create a merged polygon using outer boundary's shape
                // but with bounds calculated from ALL geometry
                outerPolygon = {
                    points: largestPoly.points,
                    bounds: mergedBounds,
                    area: mergedBounds.width * mergedBounds.height // Use bounding box area for nesting
                };
            } else {
                outerPolygon = createPolygon(allPoints);
            }

            // Clean filename for label
            const label = filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

            parts.push({
                id: `${filename}-merged`,
                label: label,
                polygon: outerPolygon,
                quantity: 1,
                allowedRotations: [0, 90, 180, 270],
                source: filename,
                // Store hole count for display
                holeCount: Math.max(0, allPolygons.length - 1),
                // Store ALL polygons for preview rendering
                innerPolygons: allPolygons.slice(1) // All except largest (which is outer boundary)
            });
        } else if (parts.length === 0) {
            errors.push('No valid shapes found in SVG');
        }

    } catch (e) {
        errors.push(`Error parsing SVG: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    return { parts, errors };
}

// ============================================
// GEOMETRY TRANSFORMATIONS
// ============================================

/**
 * Rotate polygon around its centroid
 */
export function rotatePolygon(polygon: Polygon, angleDegrees: number): Polygon {
    if (angleDegrees === 0) return polygon;

    const angleRad = (angleDegrees * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    // Calculate centroid
    const cx = polygon.points.reduce((sum, p) => sum + p.x, 0) / polygon.points.length;
    const cy = polygon.points.reduce((sum, p) => sum + p.y, 0) / polygon.points.length;

    // Rotate around centroid
    const rotatedPoints = polygon.points.map(p => ({
        x: cos * (p.x - cx) - sin * (p.y - cy) + cx,
        y: sin * (p.x - cx) + cos * (p.y - cy) + cy
    }));

    return createPolygon(rotatedPoints);
}

/**
 * Translate polygon to position
 */
export function translatePolygon(polygon: Polygon, dx: number, dy: number): Polygon {
    const translatedPoints = polygon.points.map(p => ({
        x: p.x + dx,
        y: p.y + dy
    }));
    return createPolygon(translatedPoints);
}

/**
 * Normalize polygon to origin (move bounds to 0,0)
 */
export function normalizePolygon(polygon: Polygon): Polygon {
    const { x, y } = polygon.bounds;
    return translatePolygon(polygon, -x, -y);
}
