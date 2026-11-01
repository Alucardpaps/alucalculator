/**
 * Shaft 3D STL Solid Mesh Exporter
 * Generates watertight, manifold 3D STL files for stepped shafts
 * Compatible with SolidWorks, AutoCAD, Fusion 360, FreeCAD, and 3D printing slicers
 */

import type { ShaftSegment, CenterDrillFeature } from './engine';
import { getStandardCenterDrillDIN332 } from './engine';

export interface ShaftStlExportOptions {
    radialSegments?: number;
    includeChamfers?: boolean;
    solidName?: string;
}

interface Point2D {
    x: number;
    r: number;
}

interface Vec3 {
    x: number;
    y: number;
    z: number;
}

/**
 * Generate 2D polyline points for DIN 332 center drill hole in mm
 */
function getCenterDrillProfileMm(
    feature: CenterDrillFeature,
    diameterMm: number,
    segLenMm: number,
    faceRMm: number,
    xFace: number,
    isLeft: boolean
): Array<Point2D> {
    const form = feature.form || 'B';
    const std = getStandardCenterDrillDIN332(diameterMm, form);
    const d1 = feature.pilotDia || std.pilotDia;
    const d2 = feature.coneDia || std.coneDia;
    const d3 = (form === 'B') ? (feature.protectingDia || std.protectingDia || d2 * 1.35) : undefined;
    const totalDepth = feature.totalDepth || std.totalDepth;

    let r1 = d1 / 2;
    let r2 = d2 / 2;
    let r3 = d3 ? d3 / 2 : r2;
    let rMouth = (form === 'B' && d3) ? r3 : r2;

    const maxMouthR = Math.max(0.2, faceRMm - 0.2);
    if (rMouth > maxMouthR) {
        const scale = maxMouthR / rMouth;
        rMouth *= scale;
        r2 *= scale;
        r1 *= scale;
        if (r3) r3 *= scale;
    }
    r1 = Math.min(r1, r2 * 0.65);

    const isFormB = form === 'B' && d3 !== undefined;
    const lRim = isFormB ? Math.max(0.1, (r3 - r2) / Math.sqrt(3)) : 0;
    const lCone = Math.max(0.2, (r2 - r1) * Math.sqrt(3));
    let lPilot = Math.max(totalDepth, lRim + lCone + 0.5);
    lPilot = Math.min(lPilot, segLenMm * 0.4);
    const lTip = Math.max(0.1, r1 / Math.tan((59 * Math.PI) / 180));

    const pts: Array<Point2D> = [];

    if (isLeft) {
        pts.push({ x: xFace + lPilot + lTip, r: 0 });
        pts.push({ x: xFace + lPilot, r: r1 });
        pts.push({ x: xFace + lRim + lCone, r: r1 });
        if (isFormB) {
            pts.push({ x: xFace + lRim, r: r2 });
        }
        pts.push({ x: xFace, r: rMouth });
    } else {
        pts.push({ x: xFace, r: rMouth });
        if (isFormB) {
            pts.push({ x: xFace - lRim, r: r2 });
        }
        pts.push({ x: xFace - lRim - lCone, r: r1 });
        pts.push({ x: xFace - lPilot, r: r1 });
        pts.push({ x: xFace - lPilot - lTip, r: 0 });
    }

    return pts;
}

/**
 * Generate an authentic 3D solid STL string for a stepped shaft
 */
export function exportShaftToSTL(
    segments: ShaftSegment[],
    options: ShaftStlExportOptions = {}
): string {
    const {
        radialSegments = 48,
        includeChamfers = true,
        solidName = 'AluCAD_Stepped_Shaft'
    } = options;

    if (!segments || segments.length === 0) {
        return `solid ${solidName}\nendsolid ${solidName}\n`;
    }

    const firstSeg = segments[0];
    const lastSeg = segments[segments.length - 1];

    const leftCenterDrill = (firstSeg?.features?.find(
        f => f.type === 'center_drill' && (f.face === 'left_end' || (!f.face && firstSeg !== lastSeg))
    ) || firstSeg?.features?.find(
        f => f.type === 'center_drill' && f.face === 'left_end'
    ) || segments.flatMap(s => s.features || []).find(
        f => f.type === 'center_drill' && f.face === 'left_end'
    )) as CenterDrillFeature | undefined;

    const rightCenterDrill = (lastSeg?.features?.find(
        f => f.type === 'center_drill' && f.face === 'right_end'
    ) || (lastSeg !== firstSeg ? lastSeg?.features?.find(
        f => f.type === 'center_drill' && !f.face
    ) : undefined) || segments.flatMap(s => s.features || []).find(
        f => f.type === 'center_drill' && f.face === 'right_end'
    )) as CenterDrillFeature | undefined;

    // 1. Build the 2D meridian contour profile points (x along shaft axis, r radial distance)
    const profile: Point2D[] = [];

    const firstR = firstSeg.diameter / 2;
    const firstC = includeChamfers ? (firstSeg.chamferLeft ?? 1.5) : 0;
    const firstFaceTopR = Math.max(0, firstR - firstC);

    const leftCDPoints = leftCenterDrill
        ? getCenterDrillProfileMm(leftCenterDrill, firstSeg.diameter, firstSeg.length, firstFaceTopR, 0, true)
        : null;

    if (leftCDPoints) {
        profile.push(...leftCDPoints);
        if (firstFaceTopR > leftCDPoints[leftCDPoints.length - 1].r) {
            profile.push({ x: 0, r: firstFaceTopR });
        }
        if (firstC > 0) {
            profile.push({ x: firstC, r: firstR });
        }
    } else {
        profile.push({ x: 0, r: 0 });
        if (firstC > 0) {
            profile.push({ x: 0, r: firstFaceTopR });
            profile.push({ x: firstC, r: firstR });
        } else {
            profile.push({ x: 0, r: firstR });
        }
    }

    let currentX = 0;
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const segX1 = currentX;
        const segX2 = currentX + seg.length;
        const r = seg.diameter / 2;

        const isFirst = i === 0;
        const isLast = i === segments.length - 1;
        const prevSeg = i > 0 ? segments[i - 1] : null;
        const nextSeg = i < segments.length - 1 ? segments[i + 1] : null;

        const cL = includeChamfers ? (isFirst ? (seg.chamferLeft ?? 1.5) : (prevSeg && seg.diameter > prevSeg.diameter ? (seg.chamferLeft ?? 1.0) : 0)) : 0;
        const cR = includeChamfers ? (isLast ? (seg.chamferRight ?? 1.5) : (nextSeg && seg.diameter > nextSeg.diameter ? (seg.chamferRight ?? 1.0) : 0)) : 0;

        // Left end or step
        if (!isFirst && prevSeg && prevSeg.diameter !== seg.diameter) {
            // Step face from previous segment
            const prevR = prevSeg.diameter / 2;
            if (seg.diameter > prevSeg.diameter) {
                if (cL > 0) {
                    profile.push({ x: segX1, r: Math.max(prevR, r - cL) });
                    profile.push({ x: segX1 + cL, r });
                } else {
                    profile.push({ x: segX1, r });
                }
            } else {
                // Stepping down
                profile.push({ x: segX1, r });
            }
        }

        // Cylindrical span
        const topEndX = segX2 - cR;
        if (topEndX > segX1 + cL) {
            profile.push({ x: topEndX, r });
        }

        // Right chamfer or step end
        if (isLast) {
            const lastFaceTopR = Math.max(0, r - cR);
            const rightCDPoints = rightCenterDrill
                ? getCenterDrillProfileMm(rightCenterDrill, seg.diameter, seg.length, lastFaceTopR, segX2, false)
                : null;

            if (cR > 0) {
                profile.push({ x: segX2, r: lastFaceTopR });
            }
            if (rightCDPoints) {
                profile.push(...rightCDPoints);
            } else {
                profile.push({ x: segX2, r: 0 }); // Close on centerline axis
            }
        } else if (nextSeg && seg.diameter !== nextSeg.diameter) {
            if (cR > 0 && seg.diameter > nextSeg.diameter) {
                profile.push({ x: segX2, r: Math.max(nextSeg.diameter / 2, r - cR) });
            }
        }

        currentX += seg.length;
    }

    // 2. Revolve the 2D contour around the X axis (Y = r*cos(theta), Z = r*sin(theta))
    const S = Math.max(16, Math.min(128, radialSegments));
    const N = profile.length;
    let stl = `solid ${solidName.replace(/\s+/g, '_')}\n`;

    const computeNormal = (v1: Vec3, v2: Vec3, v3: Vec3): Vec3 => {
        const ax = v2.x - v1.x;
        const ay = v2.y - v1.y;
        const az = v2.z - v1.z;
        const bx = v3.x - v1.x;
        const by = v3.y - v1.y;
        const bz = v3.z - v1.z;
        const nx = ay * bz - az * by;
        const ny = az * bx - ax * bz;
        const nz = ax * by - ay * bx;
        const len = Math.hypot(nx, ny, nz);
        if (len < 1e-9) return { x: 0, y: 0, z: 1 };
        return { x: nx / len, y: ny / len, z: nz / len };
    };

    const addFacet = (v1: Vec3, v2: Vec3, v3: Vec3) => {
        const n = computeNormal(v1, v2, v3);
        stl += `  facet normal ${n.x.toFixed(5)} ${n.y.toFixed(5)} ${n.z.toFixed(5)}\n`;
        stl += `    outer loop\n`;
        stl += `      vertex ${v1.x.toFixed(4)} ${v1.y.toFixed(4)} ${v1.z.toFixed(4)}\n`;
        stl += `      vertex ${v2.x.toFixed(4)} ${v2.y.toFixed(4)} ${v2.z.toFixed(4)}\n`;
        stl += `      vertex ${v3.x.toFixed(4)} ${v3.y.toFixed(4)} ${v3.z.toFixed(4)}\n`;
        stl += `    endloop\n`;
        stl += `  endfacet\n`;
    };

    // Helper to evaluate 3D vertex at profile index i and angle step s
    const getVertex = (i: number, s: number): Vec3 => {
        const pt = profile[i];
        const theta = (s / S) * Math.PI * 2;
        return {
            x: pt.x,
            y: pt.r * Math.cos(theta),
            z: pt.r * Math.sin(theta)
        };
    };

    for (let s = 0; s < S; s++) {
        const nextS = (s + 1) % S;
        for (let i = 0; i < N - 1; i++) {
            const r1 = profile[i].r;
            const r2 = profile[i + 1].r;

            // When both radii are 0, it's a degenerate point on the axis
            if (r1 === 0 && r2 === 0) continue;

            const p1 = getVertex(i, s);
            const p2 = getVertex(i + 1, s);
            const p3 = getVertex(i + 1, nextS);
            const p4 = getVertex(i, nextS);

            if (r1 === 0) {
                // Triangle fan on tip (left end cap)
                addFacet(p1, p2, p3);
            } else if (r2 === 0) {
                // Triangle fan on tip (right end cap)
                addFacet(p1, p2, p4);
            } else {
                // Standard quad cylinder/cone facet split into 2 triangles
                addFacet(p1, p2, p3);
                addFacet(p1, p3, p4);
            }
        }
    }

    stl += `endsolid ${solidName.replace(/\s+/g, '_')}\n`;
    return stl;
}

/**
 * Triggers a direct browser download of the shaft 3D STL file
 */
export function downloadShaftSTL(
    segments: ShaftSegment[],
    filename?: string,
    options: ShaftStlExportOptions = {}
): void {
    const stlContent = exportShaftToSTL(segments, options);
    const totalLength = segments.reduce((acc, s) => acc + s.length, 0);
    const defaultName = filename || `alucalc_shaft_${Math.round(totalLength)}mm.stl`;

    const blob = new Blob([stlContent], { type: 'model/stl;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName.endsWith('.stl') ? defaultName : `${defaultName}.stl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
