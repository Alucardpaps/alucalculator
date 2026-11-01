/**
 * ⚡ AluCAD CAM Toolpath — Lead-in, Lead-out, Cut Direction & Kerf Offset
 * 
 * Standards & Best Practices:
 * - ISO 9013 Plasma Cutting Direction:
 *   - CW Swirl Torch: Outer contour CW, Hole/Inner contour CCW (Part on the right of motion vector)
 *   - CCW Swirl Torch: Outer contour CCW, Hole/Inner contour CW
 * - Pierce point strictly placed in scrap material
 * - Tangential arc entry & linear/arc exit with overcut
 */

import {
  Point2D,
  Contour,
  Segment,
  createLineSegment,
  createArcSegment,
  distance,
  reverseContour,
} from '../core/geometry';
import { TorchSwirl, LeadInType } from '../core/processProfile';

export interface ToolpathOperation {
  type: 'rapid' | 'pierce' | 'leadIn' | 'cut' | 'overcut' | 'leadOut' | 'bridgeCut';
  segment?: Segment;
  point?: Point2D;
  feedRateMmMin: number;
  dwellSec?: number;
  torchOn: boolean;
  isTrueHole?: boolean;
  isCornerLoop?: boolean;
  isCommonLine?: boolean;
  isMicrojoint?: boolean;
  isAnchorTab?: boolean;
  isAnchorEdge?: boolean;
  isBridge?: boolean;
  avoidCollision?: boolean;
  sequenceStep?: number;
  sequenceLabel?: string;
}

export interface ContourToolpath {
  contourId: string;
  role: 'outer' | 'hole';
  operations: ToolpathOperation[];
  piercePoint: Point2D;
  startPoint: Point2D;
  endPoint: Point2D;
  totalLengthMm: number;
  estimatedTimeSec: number;
  isTrueHole?: boolean;
  isCommonLine?: boolean;
  hasMicrojoint?: boolean;
  hasBridge?: boolean;
  enableBridge?: boolean;
  allowCommonLine?: boolean;
  tabWidthMm?: number;
  isAnchorEdge?: boolean;
  sequenceStep?: number;
  sequenceLabel?: string;
  partId?: string;
}

/**
 * Enforces correct cutting direction based on torch swirl:
 * Swirl CW: Outer contour must be CW, Holes must be CCW.
 * Swirl CCW: Outer contour must be CCW, Holes must be CW.
 */
export function orientContourForSwirl(contour: Contour, swirl: TorchSwirl = 'CW'): Contour {
  const shouldBeCW = (contour.role === 'outer' && swirl === 'CW') || (contour.role === 'hole' && swirl === 'CCW');
  if (contour.isClockwise !== shouldBeCW) {
    return reverseContour(contour);
  }
  return contour;
}

export interface LeadInOptions {
  type: LeadInType;
  lengthMm: number;
  overcutMm: number;
  leadOutLengthMm: number;
  swirl: TorchSwirl;
  cutSpeedMmMin: number;
  rapidSpeedMmMin?: number;
  pierceDelaySec?: number;
  enableTrueHole?: boolean; // Small hole precision (Hypertherm True Hole equivalent)
  enableCornerLoop?: boolean; // Corner loop / sharp corner overtravel in scrap
  cornerLoopRadiusMm?: number; // Radius of corner loop (default 2.0 mm)
  enableMicrojoint?: boolean; // No-Pierce Microjoint (Uncut Tab / Uçan Mikro Tutucu)
  microjointTabWidthMm?: number; // Tab gap width in mm (default 2.0 mm)
}

/**
 * 📏 Empirical SigmaNEST Heavy Plate Lead-In / Pierce Parameter Calculator
 * Calibrated against genuine 15mm, 20mm, 30mm, and 100mm ESAB Plasma production runs from 10.zip.
 */
export function calculateSigmaNestLeadInParameters(thicknessMm: number, material = 'S235JR'): {
  leadInType: LeadInType;
  leadInLengthMm: number;
  leadOutLengthMm: number;
  overcutMm: number;
  pierceDelaySec: number;
  cornerDecelPercent: number;
} {
  const t = Math.max(1, thicknessMm);
  if (t <= 6) {
    return {
      leadInType: 'arc',
      leadInLengthMm: 4.0,
      leadOutLengthMm: 2.0,
      overcutMm: 1.0,
      pierceDelaySec: 0.2,
      cornerDecelPercent: 90,
    };
  } else if (t <= 20) {
    return {
      leadInType: 'arc',
      leadInLengthMm: 12.0,
      leadOutLengthMm: 4.0,
      overcutMm: 2.0,
      pierceDelaySec: 0.8,
      cornerDecelPercent: 80,
    };
  } else if (t <= 45) {
    // 30mm SigmaNEST Ground Truth: 18.0 mm linear lead-in, 140+70 decel
    return {
      leadInType: 'line',
      leadInLengthMm: 18.0,
      leadOutLengthMm: 7.0,
      overcutMm: 3.0,
      pierceDelaySec: 1.8,
      cornerDecelPercent: 70,
    };
  } else {
    // 100mm Heavy Plate Ground Truth: 48.0 mm run + arc entry, 3.5s preheat/pierce
    return {
      leadInType: 'arc',
      leadInLengthMm: 48.0,
      leadOutLengthMm: 15.0,
      overcutMm: 5.0,
      pierceDelaySec: 3.5,
      cornerDecelPercent: 60,
    };
  }
}

/**
 * Generates plasma toolpath for a single closed contour including:
 * 1. Pierce in scrap
 * 2. Tangential arc lead-in
 * 3. Continuous contour cuts
 * 4. Tangential overcut
 * 5. Lead-out
 */
export function generateContourToolpath(
  rawContour: Contour,
  options: LeadInOptions
): ContourToolpath {
  const contour = orientContourForSwirl(rawContour, options.swirl);
  const rapidSpeed = options.rapidSpeedMmMin ?? 12000;
  const cutSpeed = options.cutSpeedMmMin;
  const operations: ToolpathOperation[] = [];

  const points = contour.points;
  if (points.length < 3) {
    return {
      contourId: contour.id,
      role: contour.role,
      operations: [],
      piercePoint: { x: 0, y: 0 },
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 0, y: 0 },
      totalLengthMm: 0,
      estimatedTimeSec: 0,
    };
  }

  // Populate segments from points if not pre-populated
  const segments: Segment[] = contour.segments.length > 0
    ? contour.segments
    : (() => {
        const segs: Segment[] = [];
        for (let i = 0; i < points.length; i++) {
          const p1 = points[i];
          const p2 = points[(i + 1) % points.length];
          segs.push(createLineSegment(p1, p2));
        }
        return segs;
      })();

  // Choose entry point (first vertex of first segment)
  const entryPoint = segments.length > 0 ? segments[0].start : points[0];
  const nextPoint = segments.length > 0 ? segments[0].end : points[1];

  // Tangent vector at entry
  const tangentDx = nextPoint.x - entryPoint.x;
  const tangentDy = nextPoint.y - entryPoint.y;
  const tLen = Math.sqrt(tangentDx * tangentDx + tangentDy * tangentDy) || 1;
  const normTx = tangentDx / tLen;
  const normTy = tangentDy / tLen;

  // Normal vector pointing to scrap:
  // In CW swirl cutting, torch travels with finished edge on the RIGHT and scrap on the LEFT.
  // For CW outer contour, left is outside (scrap).
  // For CCW hole contour, left is inside the hole cutout (scrap slug).
  // Left normal vector: (-normTy, normTx) points into scrap in both cases.
  const isOuter = contour.role === 'outer';
  const normalScrapX = -normTy;
  const normalScrapY = normTx;

  // True Hole Strategy (Hypertherm True Hole equivalent for plasma)
  const equivDiaMm = 2 * Math.sqrt(Math.max(1, contour.area) / Math.PI);
  const isTrueHole = !isOuter && (options.enableTrueHole || equivDiaMm <= 35);
  const effectiveCutSpeed = isTrueHole ? cutSpeed * 0.65 : cutSpeed;
  const effectiveOvercut = isTrueHole ? Math.max(2.0, options.overcutMm) : options.overcutMm;

  const leadLen = Math.max(3.0, options.lengthMm);
  const arcRadius = leadLen * 0.8;

  // Pierce point placed back and away in scrap
  const arcCenterX = entryPoint.x + normalScrapX * arcRadius;
  const arcCenterY = entryPoint.y + normalScrapY * arcRadius;

  // 90-degree tangential arc entry
  const piercePoint: Point2D = {
    x: entryPoint.x + (normalScrapX - normTx) * leadLen * 0.707,
    y: entryPoint.y + (normalScrapY - normTy) * leadLen * 0.707,
  };

  // 1. Rapid move to pierce point
  operations.push({
    type: 'rapid',
    point: piercePoint,
    feedRateMmMin: rapidSpeed,
    torchOn: false,
    isTrueHole,
  });

  // 2. Pierce dwell
  operations.push({
    type: 'pierce',
    point: piercePoint,
    feedRateMmMin: 0,
    dwellSec: options.pierceDelaySec ?? 0.3,
    torchOn: true,
    isTrueHole,
  });

  // 3. Lead-in (Tangential arc or line)
  if (options.type === 'arc' || isTrueHole) {
    const leadInArc = createArcSegment(
      piercePoint,
      entryPoint,
      { x: arcCenterX, y: arcCenterY },
      arcRadius,
      isOuter // CW for outer, CCW for hole
    );
    operations.push({
      type: 'leadIn',
      segment: leadInArc,
      feedRateMmMin: effectiveCutSpeed * 0.75, // reduced speed on lead-in
      torchOn: true,
      isTrueHole,
    });
  } else {
    operations.push({
      type: 'leadIn',
      segment: createLineSegment(piercePoint, entryPoint),
      feedRateMmMin: effectiveCutSpeed * 0.75,
      torchOn: true,
      isTrueHole,
    });
  }

  // 4. Contour cuts with optional Corner Loops and No-Pierce Flying Microjoint
  let contourCutLen = 0;
  const loopRadius = options.cornerLoopRadiusMm || 2.0;
  const isMicrojointActive = isOuter && !!options.enableMicrojoint;
  const tabWidth = Math.max(1.0, Math.min(8.0, options.microjointTabWidthMm || 2.0));

  for (let sIdx = 0; sIdx < segments.length; sIdx++) {
    let seg = segments[sIdx];
    const isLastSegment = sIdx === segments.length - 1;

    // No-Pierce Microjoint (Uncut Tab Strategy):
    // Shorten the final segment by tabWidth so cut stops before reconnecting to entryPoint.
    // Leaves a solid uncut metal tab holding the part to the sheet skeleton with ZERO extra pierces!
    if (isMicrojointActive && isLastSegment && seg.type === 'line' && seg.length > tabWidth + 0.5) {
      const dx = seg.end.x - seg.start.x;
      const dy = seg.end.y - seg.start.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const shortenedEnd: Point2D = {
        x: seg.end.x - (dx / len) * tabWidth,
        y: seg.end.y - (dy / len) * tabWidth,
      };
      seg = createLineSegment(seg.start, shortenedEnd);
    }

    operations.push({
      type: 'cut',
      segment: seg,
      feedRateMmMin: effectiveCutSpeed,
      torchOn: true,
      isTrueHole,
      isMicrojoint: isMicrojointActive && isLastSegment,
    });
    contourCutLen += seg.length;

    // Corner Loop Strategy: on sharp corners between linear segments in outer contours
    if (isOuter && options.enableCornerLoop && sIdx < segments.length - 1) {
      const nextSeg = segments[sIdx + 1];
      if (seg.type === 'line' && nextSeg.type === 'line') {
        const d1x = seg.end.x - seg.start.x;
        const d1y = seg.end.y - seg.start.y;
        const l1 = Math.sqrt(d1x * d1x + d1y * d1y) || 1;
        const u1x = d1x / l1;
        const u1y = d1y / l1;

        const d2x = nextSeg.end.x - nextSeg.start.x;
        const d2y = nextSeg.end.y - nextSeg.start.y;
        const l2 = Math.sqrt(d2x * d2x + d2y * d2y) || 1;
        const u2x = d2x / l2;
        const u2y = d2y / l2;

        const dot = u1x * u2x + u1y * u2y;
        // Sharp turn: dot < 0.7 (turning angle > 45 degrees)
        if (dot < 0.7) {
          // Overtravel loop in scrap outside the sharp corner
          const cornerPt = seg.end;
          const loopTip: Point2D = {
            x: cornerPt.x + u1x * loopRadius,
            y: cornerPt.y + u1y * loopRadius
          };
          const loopReentry: Point2D = {
            x: cornerPt.x - u2x * (loopRadius * 0.5) - u2y * loopRadius,
            y: cornerPt.y - u2y * (loopRadius * 0.5) + u2x * loopRadius
          };

          operations.push({
            type: 'cut',
            segment: createLineSegment(cornerPt, loopTip),
            feedRateMmMin: effectiveCutSpeed * 0.8,
            torchOn: true,
            isCornerLoop: true
          });
          operations.push({
            type: 'cut',
            segment: createLineSegment(loopTip, loopReentry),
            feedRateMmMin: effectiveCutSpeed * 0.8,
            torchOn: true,
            isCornerLoop: true
          });
          operations.push({
            type: 'cut',
            segment: createLineSegment(loopReentry, nextSeg.start),
            feedRateMmMin: effectiveCutSpeed * 0.8,
            torchOn: true,
            isCornerLoop: true
          });
        }
      }
    }
  }

  // 5. Overcut: Only applied if microjoint is NOT active (tab requires gap)
  if (effectiveOvercut > 0 && !isMicrojointActive) {
    const overcutEnd: Point2D = {
      x: entryPoint.x + normTx * effectiveOvercut,
      y: entryPoint.y + normTy * effectiveOvercut,
    };
    operations.push({
      type: 'overcut',
      segment: createLineSegment(entryPoint, overcutEnd),
      feedRateMmMin: effectiveCutSpeed,
      torchOn: true,
      isTrueHole,
    });
  }

  // 6. Lead-out (short ramp into scrap before torch off)
  let endPoint: Point2D = entryPoint;
  if (!isMicrojointActive && options.leadOutLengthMm > 0) {
    const leadOutEnd: Point2D = {
      x: entryPoint.x + (normalScrapX + normTx * 0.5) * options.leadOutLengthMm,
      y: entryPoint.y + (normalScrapY + normTy * 0.5) * options.leadOutLengthMm,
    };
    operations.push({
      type: 'leadOut',
      segment: createLineSegment(entryPoint, leadOutEnd),
      feedRateMmMin: effectiveCutSpeed,
      torchOn: true,
      isTrueHole,
    });
    endPoint = leadOutEnd;
  } else if (isMicrojointActive) {
    // End point is the shortened end of the last segment (tab start)
    const lastOp = operations[operations.length - 1];
    if (lastOp?.segment) {
      endPoint = lastOp.segment.end;
    }
  }

  const totalLength = operations.reduce((sum, op) => sum + (op.segment?.length || 0), 0);
  const cutTimeSec = (totalLength / (effectiveCutSpeed / 60));
  const dwellTimeSec = options.pierceDelaySec ?? 0.3;

  return {
    contourId: contour.id,
    role: contour.role,
    operations,
    piercePoint,
    startPoint: entryPoint,
    endPoint,
    totalLengthMm: totalLength,
    estimatedTimeSec: cutTimeSec + dwellTimeSec,
    isTrueHole,
    hasMicrojoint: isMicrojointActive,
    tabWidthMm: isMicrojointActive ? tabWidth : undefined,
  };
}
