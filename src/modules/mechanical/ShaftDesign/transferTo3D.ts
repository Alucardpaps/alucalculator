/**
 * Shaft to 3D Design Studio Bridge
 * URL Target: /design-studio/
 * 
 * Converts 2D parametric shaft segments into authentic 3D solid CAD parts in Design Studio
 * with true 45° chamfers, DIN 509 grinding undercuts, DIN 471 circlip grooves,
 * and DIN 6885 Form A/B keyway pockets cut via CSG solid subtraction.
 */

import * as THREE from 'three';
import { Evaluator, Brush, SUBTRACTION } from 'three-bvh-csg';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { commitDesignParts } from '@/system/crossModuleBridge';
import { useDesignStore, customCADGeometries, type DesignPart } from '@/design-studio/designStore';
import { useOSStore } from '@/store/osStore';
import type { ShaftSegment, CenterDrillFeature } from './engine';
import { 
    getStandardUndercutDIN509, 
    getStandardKeywayDIN6885, 
    getStandardCirclipDIN471,
    getStandardCenterDrillDIN332 
} from './engine';

export interface TransferResult {
    success: boolean;
    partCount: number;
    totalLength: number;
    message: string;
}

export interface ShaftTransferOptions {
    shaftName?: string;
    navigate?: boolean;
}

/**
 * Revolve a 1D (x, r) half-profile 360° around the X axis.
 * Points must start at (x_start, 0) and end at (x_end, 0) with all r >= 0.
 * Triangles wound counterclockwise facing outward.
 */
export function revolveProfileAroundX(
    pts: Array<{ x: number; r: number }>,
    segments = 48
): THREE.BufferGeometry {
    if (!pts || pts.length < 2) {
        return new THREE.BufferGeometry();
    }

    const N = pts.length;
    const S = Math.max(12, segments);
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let s = 0; s < S; s++) {
        const theta = (s / S) * Math.PI * 2;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        for (let i = 0; i < N; i++) {
            const x = pts[i].x;
            const y = pts[i].r * cosT;
            const z = pts[i].r * sinT;

            positions.push(x, y, z);
            uvs.push(pts[i].r === 0 ? 0 : s / S, i / (N - 1));
        }
    }

    for (let s = 0; s < S; s++) {
        const nextS = (s + 1) % S;
        for (let i = 0; i < N - 1; i++) {
            const a = s * N + i;
            const b = s * N + (i + 1);
            const c = nextS * N + (i + 1);
            const d = nextS * N + i;

            // Outward-facing normals: (a, d, c) and (a, c, b)
            indices.push(a, d, c);
            indices.push(a, c, b);
        }
    }

    let geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);

    try {
        geom = BufferGeometryUtils.mergeVertices(geom, 1e-4);
    } catch {
        /* fallback to unmerged */
    }

    geom.computeVertexNormals();
    return geom;
}

/**
 * Helper to generate 2D polyline profile points for a DIN 332 center drill hole (in CAD units).
 * Left end: points start at the internal drill tip (r=0) and advance towards xFace (mouth).
 * Right end: points start at xFace (mouth) and advance into the shaft ending at the drill tip (r=0).
 */
export function getCenterDrillCadProfile(
    feature: CenterDrillFeature,
    diameterMm: number,
    segLenCad: number,
    faceRCad: number,
    xFace: number,
    isLeft: boolean
): Array<{ x: number; r: number }> {
    const form = feature.form || 'B';
    const std = getStandardCenterDrillDIN332(diameterMm, form);
    const d1 = feature.pilotDia || std.pilotDia;
    const d2 = feature.coneDia || std.coneDia;
    const d3 = (form === 'B') ? (feature.protectingDia || std.protectingDia || d2 * 1.35) : undefined;
    const totalDepth = feature.totalDepth || std.totalDepth;

    let r1 = (d1 / 2) / 10;
    let r2 = (d2 / 2) / 10;
    let r3 = d3 ? (d3 / 2) / 10 : r2;
    let rMouth = (form === 'B' && d3) ? r3 : r2;

    const maxMouthR = Math.max(0.02, faceRCad - 0.02);
    if (rMouth > maxMouthR) {
        const scale = maxMouthR / rMouth;
        rMouth *= scale;
        r2 *= scale;
        r1 *= scale;
        if (r3) r3 *= scale;
    }
    r1 = Math.min(r1, r2 * 0.65);

    const isFormB = form === 'B' && d3 !== undefined;
    const lRim = isFormB ? Math.max(0.01, (r3 - r2) / Math.sqrt(3)) : 0;
    const lCone = Math.max(0.02, (r2 - r1) * Math.sqrt(3));
    const tCad = totalDepth / 10;
    let lPilot = Math.max(tCad, lRim + lCone + 0.05);
    lPilot = Math.min(lPilot, segLenCad * 0.4);
    const lTip = Math.max(0.01, r1 / Math.tan((59 * Math.PI) / 180));

    const pts: Array<{ x: number; r: number }> = [];

    if (isLeft) {
        // Starts at drill tip inside the shaft, traces back out to left face:
        pts.push({ x: xFace + lPilot + lTip, r: 0 }); // 118° drill point conical tip
        pts.push({ x: xFace + lPilot, r: r1 });        // 118° drill point / pilot junction
        pts.push({ x: xFace + lRim + lCone, r: r1 });  // Pilot bore / 60° countersink junction
        if (isFormB) {
            pts.push({ x: xFace + lRim, r: r2 });      // 60° cone / 120° protecting rim junction
        }
        pts.push({ x: xFace, r: rMouth });             // Hole mouth at left end face
    } else {
        // Starts at right face mouth, traces inward into the shaft, ending at drill tip:
        pts.push({ x: xFace, r: rMouth });             // Hole mouth at right end face
        if (isFormB) {
            pts.push({ x: xFace - lRim, r: r2 });      // 120° rim into 60° cone junction
        }
        pts.push({ x: xFace - lRim - lCone, r: r1 });  // 60° cone into pilot bore junction
        pts.push({ x: xFace - lPilot, r: r1 });        // Cylindrical pilot bore base
        pts.push({ x: xFace - lPilot - lTip, r: 0 });  // 118° drill point conical tip on axis
    }

    return pts;
}

/**
 * Builds a true 3D CAD solid BufferGeometry for a single stepped shaft segment:
 * - 45° outer chamfers (cL, cR)
 * - DIN 509 grinding undercuts (with 15° run-in relief ramp)
 * - DIN 471 circlip retaining ring grooves
 * - DIN 332 center drill hole (Form A/B/R) on free end face
 * - DIN 6885 Form A / Form B keyway pocket (CSG solid subtraction)
 * - Cross holes / DIN 7 pins (CSG solid subtraction)
 * 
 * Note: Coordinates are in CAD units (1 CAD unit = 10 mm in reality).
 * Segment is centered around x = 0 spanning [-L/2, +L/2].
 */
export function buildShaftSegmentSolid(
    seg: ShaftSegment,
    segIndex: number,
    allSegments: ShaftSegment[]
): THREE.BufferGeometry {
    const isFirst = segIndex === 0;
    const isLast = segIndex === allSegments.length - 1;
    const prevSeg = segIndex > 0 ? allSegments[segIndex - 1] : null;
    const nextSeg = segIndex < allSegments.length - 1 ? allSegments[segIndex + 1] : null;

    // Dimensions converted to CAD units (1 unit = 10 mm)
    const LCad = Math.max(0.1, seg.length / 10);
    const RCad = Math.max(0.05, (seg.diameter / 2) / 10);
    const xStart = -LCad / 2;
    const xEnd = +LCad / 2;

    // ─── 1. 45° CHAMFERS (PAHLAR) ───
    const cL = isFirst
        ? (seg.chamferLeft ?? 1.5)
        : (prevSeg && seg.diameter > prevSeg.diameter ? (seg.chamferLeft ?? 1.0) : 0);
    const cR = isLast
        ? (seg.chamferRight ?? 1.5)
        : (nextSeg && seg.diameter > nextSeg.diameter ? (seg.chamferRight ?? 1.0) : 0);

    const cLCad = Math.min(cL / 10, LCad * 0.45, RCad * 0.7);
    const cRCad = Math.min(cR / 10, LCad * 0.45, RCad * 0.7);

    // ─── 2. DIN 509 GRINDING UNDERCUTS (TAŞLAMA BOŞLUKLARI) ───
    // Right shoulder undercut: Step UP to next segment
    let rightUndercut: { width: number; depth: number; rampLen: number } | null = null;
    if (nextSeg && seg.diameter < nextSeg.diameter && seg.shoulderTransition !== 'radius') {
        const uc = getStandardUndercutDIN509(seg.diameter, seg.shoulderUndercutForm ?? 'E');
        const fCad = Math.min(uc.grooveWidth / 10, LCad * 0.4);
        const t1Cad = Math.min(uc.depth / 10, RCad * 0.35);
        const rampCad = Math.min(t1Cad * 3.732, fCad * 0.45); // 15° ramp
        rightUndercut = { width: fCad, depth: t1Cad, rampLen: rampCad };
    }

    // Left shoulder undercut: Step UP to prev segment
    let leftUndercut: { width: number; depth: number; rampLen: number } | null = null;
    if (prevSeg && seg.diameter < prevSeg.diameter && prevSeg.shoulderTransition !== 'radius') {
        const uc = getStandardUndercutDIN509(seg.diameter, prevSeg.shoulderUndercutForm ?? 'E');
        const fCad = Math.min(uc.grooveWidth / 10, LCad * 0.4);
        const t1Cad = Math.min(uc.depth / 10, RCad * 0.35);
        const rampCad = Math.min(t1Cad * 3.732, fCad * 0.45);
        leftUndercut = { width: fCad, depth: t1Cad, rampLen: rampCad };
    }

    // ─── 3. DIN 471 CIRCLIP GROOVES (SEĞMAN KANALLARI) ───
    interface CirclipZone {
        x1: number;
        x2: number;
        r: number;
    }
    const circlipZones: CirclipZone[] = [];
    if (seg.features && seg.features.length > 0) {
        for (const f of seg.features) {
            if (f.type === 'circlip') {
                const offCad = f.offsetFromStart / 10;
                const wCad = Math.max(0.05, f.grooveWidth / 10);
                const rGrooveCad = Math.max(0.04, (f.grooveDia / 2) / 10);
                const x1 = xStart + offCad;
                const x2 = x1 + wCad;
                if (x1 > xStart + 0.05 && x2 < xEnd - 0.05 && rGrooveCad < RCad) {
                    circlipZones.push({ x1, x2, r: rGrooveCad });
                }
            }
        }
    }
    circlipZones.sort((a, b) => a.x1 - b.x1);

    // ─── 4. DETECT DIN 332 CENTER DRILL ON END FACES ───
    const leftCenterDrill = isFirst
        ? (seg.features?.find(f => f.type === 'center_drill' && f.face !== 'right_end') as CenterDrillFeature | undefined)
        : undefined;
    const rightCenterDrill = isLast
        ? (seg.features?.find(f => f.type === 'center_drill' && f.face !== 'left_end') as CenterDrillFeature | undefined)
        : undefined;

    // ─── 5. CONSTRUCT 2D AXIS-SYMMETRIC (x, r) POLYLINE PROFILE ───
    const pts: Array<{ x: number; r: number }> = [];
    let curX = xStart;

    // Left boundary: DIN 332 Center Drill or Undercut or 45° Chamfer or Straight Face
    const leftFaceTopR = RCad - cLCad;
    const leftCDPoints = leftCenterDrill
        ? getCenterDrillCadProfile(leftCenterDrill, seg.diameter, LCad, leftFaceTopR, xStart, true)
        : null;

    if (leftCDPoints) {
        pts.push(...leftCDPoints);
        if (leftFaceTopR > leftCDPoints[leftCDPoints.length - 1].r) {
            pts.push({ x: xStart, r: leftFaceTopR });
        }
        if (cLCad > 0) {
            pts.push({ x: xStart + cLCad, r: RCad });
            curX = xStart + cLCad;
        } else {
            curX = xStart;
        }
    } else if (leftUndercut) {
        pts.push({ x: xStart, r: 0 });
        const rGroove = Math.max(0.05, RCad - leftUndercut.depth);
        pts.push({ x: xStart, r: rGroove });
        const xRampStart = xStart + leftUndercut.width - leftUndercut.rampLen;
        if (xRampStart > xStart) {
            pts.push({ x: xRampStart, r: rGroove });
        }
        pts.push({ x: xStart + leftUndercut.width, r: RCad });
        curX = xStart + leftUndercut.width;
    } else if (cLCad > 0) {
        pts.push({ x: xStart, r: 0 });
        pts.push({ x: xStart, r: leftFaceTopR });
        pts.push({ x: xStart + cLCad, r: RCad });
        curX = xStart + cLCad;
    } else {
        pts.push({ x: xStart, r: 0 });
        pts.push({ x: xStart, r: RCad });
        curX = xStart;
    }

    // Intermediate features: Circlip grooves
    const rightLimit = rightUndercut 
        ? xEnd - rightUndercut.width 
        : (cRCad > 0 ? xEnd - cRCad : xEnd);

    for (const cz of circlipZones) {
        if (cz.x1 > curX + 0.01 && cz.x2 < rightLimit - 0.01) {
            pts.push({ x: cz.x1, r: RCad });
            pts.push({ x: cz.x1, r: cz.r });
            pts.push({ x: cz.x2, r: cz.r });
            pts.push({ x: cz.x2, r: RCad });
            curX = cz.x2;
        }
    }

    // Right boundary: DIN 332 Center Drill or Undercut or 45° Chamfer or Straight Face
    const rightFaceTopR = RCad - cRCad;
    const rightCDPoints = rightCenterDrill
        ? getCenterDrillCadProfile(rightCenterDrill, seg.diameter, LCad, rightFaceTopR, xEnd, false)
        : null;

    if (rightUndercut) {
        const xUStart = xEnd - rightUndercut.width;
        const xRampEnd = xUStart + rightUndercut.rampLen;
        const rGroove = Math.max(0.05, RCad - rightUndercut.depth);
        if (xUStart > curX) {
            pts.push({ x: xUStart, r: RCad });
        }
        pts.push({ x: xRampEnd, r: rGroove });
        pts.push({ x: xEnd, r: rGroove });
        pts.push({ x: xEnd, r: 0 });
    } else if (cRCad > 0) {
        const xCStart = xEnd - cRCad;
        if (xCStart > curX) {
            pts.push({ x: xCStart, r: RCad });
        }
        pts.push({ x: seg.diameter > 0 ? xEnd : xEnd, r: rightFaceTopR });
        if (rightCDPoints) {
            pts.push(...rightCDPoints);
        } else {
            pts.push({ x: xEnd, r: 0 });
        }
    } else {
        if (xEnd > curX) {
            pts.push({ x: xEnd, r: RCad });
        }
        if (rightCDPoints) {
            pts.push(...rightCDPoints);
        } else {
            pts.push({ x: xEnd, r: 0 });
        }
    }

    // ─── 6. REVOLVE 360° AROUND X AXIS ───
    let baseGeom = revolveProfileAroundX(pts, 48);

    // ─── 6. CSG SUBTRACTION FOR DIN 6885 KEYWAY POCKETS & HOLES ───
    const keyways = seg.features?.filter(f => f.type === 'keyway') ?? [];
    const crossHoles = seg.features?.filter(f => f.type === 'cross_hole' || f.type === 'pin') ?? [];

    if (keyways.length > 0 || crossHoles.length > 0) {
        try {
            const evaluator = new Evaluator();
            evaluator.useGroups = false;
            let shaftBrush = new Brush(baseGeom);
            shaftBrush.updateMatrixWorld();

            // 6A. DIN 6885 Parallel Keyways (Kama Kanalları)
            for (const kw of keyways) {
                const bCad = Math.max(0.1, kw.width / 10);
                const LKCad = Math.max(0.2, Math.min(kw.length / 10, LCad * 0.95));
                const t1Cad = Math.min(kw.depth / 10, RCad * 0.85);
                const offCad = Math.max(0, Math.min(kw.offsetFromStart / 10, LCad - LKCad));
                const xCenter = xStart + offCad + LKCad / 2;
                const cutterH = t1Cad + 0.35; // Extend into air above cylinder for clean manifold cut

                // DIN 6885 Keyway Pocket: Always milled with end-mill of diameter b -> rounded stadium ends R = b/2
                const rEnd = Math.min(bCad / 2, LKCad / 2);
                const straightLen = Math.max(0, LKCad - 2 * rEnd);
                const halfStraight = straightLen / 2;

                const shape = new THREE.Shape();
                if (halfStraight > 1e-4) {
                    shape.moveTo(halfStraight, -rEnd);
                    shape.absarc(halfStraight, 0, rEnd, -Math.PI / 2, Math.PI / 2, false);
                    shape.lineTo(-halfStraight, rEnd);
                    shape.absarc(-halfStraight, 0, rEnd, Math.PI / 2, (3 * Math.PI) / 2, false);
                    shape.closePath();
                } else {
                    shape.absarc(0, 0, rEnd, 0, Math.PI * 2, false);
                }

                const cutterGeom = new THREE.ExtrudeGeometry(shape, {
                    depth: cutterH,
                    bevelEnabled: false,
                    curveSegments: 16
                });
                // Stand extrusion up along +Y
                cutterGeom.rotateX(-Math.PI / 2);

                const cutterBrush = new Brush(cutterGeom);
                // Position cutter at top of shaft: bottom cuts down to RCad - t1Cad
                cutterBrush.position.set(xCenter, RCad - t1Cad, 0);
                cutterBrush.updateMatrixWorld();

                shaftBrush = evaluator.evaluate(shaftBrush, cutterBrush, SUBTRACTION);
            }

            // 6B. Cross Holes & Pins
            for (const ch of crossHoles) {
                const dia = (ch as any).diameter ?? 6;
                const rHoleCad = (dia / 2) / 10;
                const offCad = (ch.offsetFromStart ?? 10) / 10;
                const xCenter = xStart + offCad;
                const holeLen = RCad * 2 + 0.5;
                const holeGeom = new THREE.CylinderGeometry(rHoleCad, rHoleCad, holeLen, 32);
                const holeBrush = new Brush(holeGeom);
                holeBrush.position.set(xCenter, 0, 0);
                holeBrush.updateMatrixWorld();

                shaftBrush = evaluator.evaluate(shaftBrush, holeBrush, SUBTRACTION);
            }

            let resultGeom = shaftBrush.geometry;
            try {
                resultGeom = BufferGeometryUtils.mergeVertices(resultGeom, 1e-4);
            } catch {
                /* fallback to unmerged */
            }
            resultGeom.computeVertexNormals();
            baseGeom = resultGeom;
        } catch (csgErr) {
            console.warn('Shaft CSG subtraction evaluation warning (fallback to lathe):', csgErr);
        }
    }

    return baseGeom;
}

/**
 * Builds a single complete monolithic 3D CAD solid BufferGeometry for the entire stepped shaft.
 * - All segments are continuously revolved together into 1 watertight manifold body.
 * - Includes 45° outer chamfers, step chamfers, and DIN 509 undercuts (step-up and step-down).
 * - Includes DIN 471 circlip retaining ring grooves.
 * - Applies CSG solid boolean subtraction for all DIN 6885 Form A/B keyways and cross holes/pins across the shaft.
 */
export function buildMonolithicShaftSolid(segments: ShaftSegment[]): THREE.BufferGeometry {
    if (!segments || segments.length === 0) {
        return new THREE.BufferGeometry();
    }

    const totalLengthMm = segments.reduce((acc, s) => acc + s.length, 0);
    const totalLengthCad = totalLengthMm / 10;
    const startXCad = -totalLengthCad / 2;

    const firstSeg = segments[0];
    const lastSeg = segments[segments.length - 1];

    // Detect DIN 332 center drill features on left and right ends
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

    const pts: Array<{ x: number; r: number }> = [];

    // ─── 0. LEFT END BOUNDARY (DIN 332 Punta Deliği veya Düz Alın Yüzeyi) ───
    const firstLenCad = Math.max(0.1, firstSeg.length / 10);
    const firstRCad = Math.max(0.05, (firstSeg.diameter / 2) / 10);
    const firstC = Math.min((firstSeg.chamferLeft ?? 1.5) / 10, firstLenCad * 0.45, firstRCad * 0.7);
    const firstFaceTopR = firstRCad - firstC;

    const leftCDPoints = leftCenterDrill
        ? getCenterDrillCadProfile(leftCenterDrill, firstSeg.diameter, firstLenCad, firstFaceTopR, startXCad, true)
        : null;

    if (leftCDPoints) {
        pts.push(...leftCDPoints);
        if (firstFaceTopR > leftCDPoints[leftCDPoints.length - 1].r) {
            pts.push({ x: startXCad, r: firstFaceTopR });
        }
        if (firstC > 0) {
            pts.push({ x: startXCad + firstC, r: firstRCad });
        }
    } else {
        pts.push({ x: startXCad, r: 0 });
        if (firstC > 0) {
            pts.push({ x: startXCad, r: firstFaceTopR });
            pts.push({ x: startXCad + firstC, r: firstRCad });
        } else {
            pts.push({ x: startXCad, r: firstRCad });
        }
    }

    let curXCad = startXCad;

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const segLenCad = Math.max(0.1, seg.length / 10);
        const segX1 = curXCad;
        const segX2 = curXCad + segLenCad;
        const RCad = Math.max(0.05, (seg.diameter / 2) / 10);

        const isFirst = i === 0;
        const isLast = i === segments.length - 1;
        const prevSeg = i > 0 ? segments[i - 1] : null;
        const nextSeg = i < segments.length - 1 ? segments[i + 1] : null;

        // 1. Chamfers & Undercuts calculation
        const cL = isFirst
            ? (seg.chamferLeft ?? 1.5)
            : (prevSeg && seg.diameter > prevSeg.diameter ? (seg.chamferLeft ?? 1.0) : 0);
        const cR = isLast
            ? (seg.chamferRight ?? 1.5)
            : (nextSeg && seg.diameter > nextSeg.diameter ? (seg.chamferRight ?? 1.0) : 0);

        const cLCad = Math.min(cL / 10, segLenCad * 0.45, RCad * 0.7);
        const cRCad = Math.min(cR / 10, segLenCad * 0.45, RCad * 0.7);

        // Undercut at left (step-down from previous segment)
        let leftUndercut: { width: number; depth: number; rampLen: number } | null = null;
        if (prevSeg && seg.diameter < prevSeg.diameter && seg.shoulderTransition !== 'radius') {
            const uc = getStandardUndercutDIN509(seg.diameter, seg.shoulderUndercutForm ?? 'E');
            const fCad = Math.min(uc.grooveWidth / 10, segLenCad * 0.4);
            const t1Cad = Math.min(uc.depth / 10, RCad * 0.35);
            const rampCad = Math.min(t1Cad * 3.732, fCad * 0.45);
            leftUndercut = { width: fCad, depth: t1Cad, rampLen: rampCad };
        }

        // Undercut at right (step-up to next segment)
        let rightUndercut: { width: number; depth: number; rampLen: number } | null = null;
        if (nextSeg && seg.diameter < nextSeg.diameter && seg.shoulderTransition !== 'radius') {
            const uc = getStandardUndercutDIN509(seg.diameter, seg.shoulderUndercutForm ?? 'E');
            const fCad = Math.min(uc.grooveWidth / 10, segLenCad * 0.4);
            const t1Cad = Math.min(uc.depth / 10, RCad * 0.35);
            const rampCad = Math.min(t1Cad * 3.732, fCad * 0.45);
            rightUndercut = { width: fCad, depth: t1Cad, rampLen: rampCad };
        }

        // Circlip zones on this segment
        interface CirclipZone {
            x1: number;
            x2: number;
            r: number;
        }
        const circlipZones: CirclipZone[] = [];
        if (seg.features && seg.features.length > 0) {
            for (const f of seg.features) {
                if (f.type === 'circlip') {
                    const offCad = f.offsetFromStart / 10;
                    const wCad = Math.max(0.05, f.grooveWidth / 10);
                    const rGrooveCad = Math.max(0.04, (f.grooveDia / 2) / 10);
                    const x1 = segX1 + offCad;
                    const x2 = x1 + wCad;
                    if (x1 > segX1 + 0.05 && x2 < segX2 - 0.05 && rGrooveCad < RCad) {
                        circlipZones.push({ x1, x2, r: rGrooveCad });
                    }
                }
            }
        }
        circlipZones.sort((a, b) => a.x1 - b.x1);

        // 2. Add Left Boundary Points
        let segCurrentX = segX1;
        if (isFirst) {
            segCurrentX = segX1 + firstC;
        } else if (leftUndercut) {
            const rGroove = Math.max(0.04, RCad - leftUndercut.depth);
            pts.push({ x: segX1, r: rGroove });
            const xRampStart = segX1 + leftUndercut.width - leftUndercut.rampLen;
            if (xRampStart > segX1) {
                pts.push({ x: xRampStart, r: rGroove });
            }
            pts.push({ x: segX1 + leftUndercut.width, r: RCad });
            segCurrentX = segX1 + leftUndercut.width;
        } else if (cLCad > 0) {
            pts.push({ x: segX1, r: RCad - cLCad });
            pts.push({ x: segX1 + cLCad, r: RCad });
            segCurrentX = segX1 + cLCad;
        } else {
            pts.push({ x: segX1, r: RCad });
        }

        // 3. Add Intermediate Features (Circlip grooves)
        const rightLimit = rightUndercut
            ? segX2 - rightUndercut.width
            : (cRCad > 0 ? segX2 - cRCad : segX2);

        for (const cz of circlipZones) {
            if (cz.x1 > segCurrentX + 0.01 && cz.x2 < rightLimit - 0.01) {
                pts.push({ x: cz.x1, r: RCad });
                pts.push({ x: cz.x1, r: cz.r });
                pts.push({ x: cz.x2, r: cz.r });
                pts.push({ x: cz.x2, r: RCad });
                segCurrentX = cz.x2;
            }
        }

        // 4. Add Right Boundary Points (or DIN 332 Center Drill on last segment)
        if (isLast) {
            const lastLenCad = Math.max(0.1, seg.length / 10);
            const lastFaceTopR = RCad - cRCad;
            const rightCDPoints = rightCenterDrill
                ? getCenterDrillCadProfile(rightCenterDrill, seg.diameter, lastLenCad, lastFaceTopR, segX2, false)
                : null;

            if (cRCad > 0) {
                const xCStart = segX2 - cRCad;
                if (xCStart > segCurrentX) {
                    pts.push({ x: xCStart, r: RCad });
                }
                pts.push({ x: segX2, r: lastFaceTopR });
            } else {
                if (segX2 > segCurrentX) {
                    pts.push({ x: segX2, r: RCad });
                }
            }

            if (rightCDPoints) {
                pts.push(...rightCDPoints);
            } else {
                pts.push({ x: segX2, r: 0 });
            }
        } else {
            if (rightUndercut) {
                const xUStart = segX2 - rightUndercut.width;
                const xRampEnd = xUStart + rightUndercut.rampLen;
                const rGroove = Math.max(0.04, RCad - rightUndercut.depth);
                if (xUStart > segCurrentX) {
                    pts.push({ x: xUStart, r: RCad });
                }
                pts.push({ x: xRampEnd, r: rGroove });
                pts.push({ x: segX2, r: rGroove });
            } else if (cRCad > 0) {
                const xCStart = segX2 - cRCad;
                if (xCStart > segCurrentX) {
                    pts.push({ x: xCStart, r: RCad });
                }
                pts.push({ x: segX2, r: RCad - cRCad });
            } else {
                if (segX2 > segCurrentX) {
                    pts.push({ x: segX2, r: RCad });
                }
            }
        }

        curXCad += segLenCad;
    }

    // 5. Revolve continuous profile 360° around X axis
    let baseGeom = revolveProfileAroundX(pts, 48);

    // 6. CSG boolean subtraction for all keyways and cross holes across all segments
    try {
        let hasSubtractions = false;
        for (const seg of segments) {
            if (seg.features && seg.features.some(f => f.type === 'keyway' || f.type === 'cross_hole' || f.type === 'pin')) {
                hasSubtractions = true;
                break;
            }
        }

        if (hasSubtractions) {
            const evaluator = new Evaluator();
            evaluator.useGroups = false;
            let shaftBrush = new Brush(baseGeom);
            shaftBrush.updateMatrixWorld();

            let segStartX = startXCad;
            for (let i = 0; i < segments.length; i++) {
                const seg = segments[i];
                const segLenCad = seg.length / 10;
                const RCad = (seg.diameter / 2) / 10;

                if (seg.features && seg.features.length > 0) {
                    for (const f of seg.features) {
                        if (f.type === 'keyway') {
                            const bCad = Math.max(0.1, f.width / 10);
                            const LKCad = Math.max(0.2, Math.min(f.length / 10, segLenCad * 0.95));
                            const t1Cad = Math.min(f.depth / 10, RCad * 0.85);
                            const offCad = Math.max(0, Math.min(f.offsetFromStart / 10, segLenCad - LKCad));
                            const xCenter = segStartX + offCad + LKCad / 2;
                            const cutterH = t1Cad + 0.35;

                            // DIN 6885 Keyway Pocket: Always milled with end-mill of diameter b -> rounded stadium ends R = b/2
                            const rEnd = Math.min(bCad / 2, LKCad / 2);
                            const straightLen = Math.max(0, LKCad - 2 * rEnd);
                            const halfStraight = straightLen / 2;

                            const shape = new THREE.Shape();
                            if (halfStraight > 1e-4) {
                                shape.moveTo(halfStraight, -rEnd);
                                shape.absarc(halfStraight, 0, rEnd, -Math.PI / 2, Math.PI / 2, false);
                                shape.lineTo(-halfStraight, rEnd);
                                shape.absarc(-halfStraight, 0, rEnd, Math.PI / 2, (3 * Math.PI) / 2, false);
                                shape.closePath();
                            } else {
                                shape.absarc(0, 0, rEnd, 0, Math.PI * 2, false);
                            }

                            const cutterGeom = new THREE.ExtrudeGeometry(shape, {
                                depth: cutterH,
                                bevelEnabled: false,
                                curveSegments: 16
                            });
                            cutterGeom.rotateX(-Math.PI / 2);

                            const cutterBrush = new Brush(cutterGeom);
                            cutterBrush.position.set(xCenter, RCad - t1Cad, 0);
                            cutterBrush.updateMatrixWorld();

                            shaftBrush = evaluator.evaluate(shaftBrush, cutterBrush, SUBTRACTION);
                        } else if (f.type === 'cross_hole' || f.type === 'pin') {
                            const dia = (f as any).diameter ?? 6;
                            const rHoleCad = (dia / 2) / 10;
                            const offCad = (f.offsetFromStart ?? 10) / 10;
                            const xCenter = segStartX + offCad;
                            const holeLen = RCad * 2 + 0.5;
                            const holeGeom = new THREE.CylinderGeometry(rHoleCad, rHoleCad, holeLen, 32);
                            const holeBrush = new Brush(holeGeom);
                            holeBrush.position.set(xCenter, 0, 0);
                            holeBrush.updateMatrixWorld();

                            shaftBrush = evaluator.evaluate(shaftBrush, holeBrush, SUBTRACTION);
                        }
                    }
                }
                segStartX += segLenCad;
            }

            let resultGeom = shaftBrush.geometry;
            try {
                resultGeom = BufferGeometryUtils.mergeVertices(resultGeom, 1e-4);
            } catch {
                /* fallback to unmerged */
            }
            resultGeom.computeVertexNormals();
            baseGeom = resultGeom;
        }
    } catch (csgErr) {
        console.warn('Monolithic shaft CSG subtraction warning (fallback to lathe):', csgErr);
    }

    return baseGeom;
}

/**
 * Transfers the shaft model into the 3D Design Studio and navigates to /design-studio/
 * Transfers the entire stepped shaft as a unified monolithic 3D solid model (Kademeli Mil)
 * with true 45° chamfers, DIN 509 grinding undercuts, DIN 471 circlip grooves,
 * and DIN 6885 Form A/B keyway pockets.
 */
export function transferShaftToDesignStudio(
    segments: ShaftSegment[],
    options: ShaftTransferOptions | string = {}
): TransferResult {
    const shaftName = typeof options === 'string' ? options : (options.shaftName ?? 'Kademeli Mil');
    const navigate = typeof options === 'string' ? true : (options.navigate ?? true);

    if (!segments || segments.length === 0) {
        return {
            success: false,
            partCount: 0,
            totalLength: 0,
            message: 'Aktarılacak mil kademesi bulunamadı.'
        };
    }

    const totalLengthMm = segments.reduce((sum, s) => sum + s.length, 0);
    const maxDia = Math.max(...segments.map(s => s.diameter), 20);

    // 1. Build the complete monolithic 3D CAD solid model containing the entire shaft
    const monolithicGeom = buildMonolithicShaftSolid(segments);
    const masterPartId = `shaft-solid-${Date.now()}`;
    customCADGeometries.set(masterPartId, monolithicGeom);

    // 2. Comprehensive engineering manufacturing notes
    const manufacturingNotes: string[] = [
        `Kademeli Mil: ${segments.length} Kademe, Toplam Boy L=${totalLengthMm} mm, Maks Çap Ø${maxDia} mm`,
        `Standart: DIN 743 / DIN 6885 / DIN 509 / DIN 471 / ISO 128`
    ];

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        manufacturingNotes.push(
            `• S${i + 1}: Ø${seg.diameter} ${seg.toleranceGrade || 'h7'} x ${seg.length}mm (Geçiş: ${seg.shoulderTransition === 'undercut' ? 'DIN 509 Oyuk' : `R${seg.shoulderFilletRadius || 1.5}`})`
        );
        if (seg.features && seg.features.length > 0) {
            for (const f of seg.features) {
                if (f.type === 'keyway') {
                    manufacturingNotes.push(`   └ DIN 6885 Kama: ${f.width}x${f.depth}x${f.length}mm`);
                } else if (f.type === 'circlip') {
                    manufacturingNotes.push(`   └ DIN 471 Segman: Ø${f.grooveDia}mm, m=${f.grooveWidth}mm`);
                } else if (f.type === 'center_drill') {
                    manufacturingNotes.push(`   └ DIN 332 Punta: ${f.face === 'left_end' ? 'Sol' : 'Sağ'}`);
                }
            }
        }
    }

    const monolithicPart: DesignPart = {
        id: masterPartId,
        kind: 'imported-model',
        name: `${shaftName} (${segments.length} Kademe, L=${totalLengthMm}mm)`,
        color: '#8b9ba8',
        visible: true,
        locked: false,
        parentId: null,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        params: {
            diameter: maxDia,
            length: totalLengthMm,
            segmentCount: segments.length
        },
        customGeometry: monolithicGeom.toJSON(),
        manufacturingNotes,
        designStandard: 'DIN 743 / ISO 128 / DIN 6885 / DIN 509'
    };

    // 3. Cache into useDesignStore Zustand state and reset isolation
    useDesignStore.setState((state) => ({
        customGeometries: {
            ...state.customGeometries,
            [masterPartId]: monolithicGeom
        },
        isolatedPartId: null
    }));

    // 4. Commit part to cross-module bridge
    commitDesignParts([monolithicPart], masterPartId);

    // 5. Open and focus Design Studio window or navigate to /design-studio/
    if (navigate && typeof window !== 'undefined') {
        const os = useOSStore.getState();
        const isDesktopHome = window.location.pathname === '/' || window.location.pathname === '';
        if (isDesktopHome && typeof os.openWindow === 'function') {
            os.openWindow('design-studio' as any);
        } else {
            window.location.href = '/design-studio/';
        }
    }

    return {
        success: true,
        partCount: 1,
        totalLength: totalLengthMm,
        message: `Kademeli milin tümü (${segments.length} kademe, DIN 332 punta delikleri, 45° pahlar, DIN 509 taşlama oyukları, segman ve kama kanalları) tek parça 3D CAD katı modeli olarak aktarıldı.`
    };
}
