/**
 * 🔍 AluCAD CAM Post-Processor — G-Code Backplotter & Simulation Verification
 * 
 * Verifies generated G-code by parsing it back into geometric segments
 * and asserting that deviation against the toolpath is < 0.01 mm.
 * Checks soft limits against machine/sheet working envelope.
 */

import { Point2D, Segment, createLineSegment, createArcSegment, distance } from '../core/geometry';
import { SequencedJobResult } from '../toolpath/thermalSequence';

export interface BackplotSegment {
  type: 'rapid' | 'feed_line' | 'feed_arc';
  start: Point2D;
  end: Point2D;
  center?: Point2D;
  radius?: number;
  clockwise?: boolean;
  lineNumber: number;
}

export interface BackplotVerificationResult {
  isValid: boolean;
  totalSegments: number;
  maxCoordinateDeviationMm: number;
  exceedsSheetBounds: boolean;
  boundingEnvelope: { minX: number; minY: number; maxX: number; maxY: number };
  warnings: string[];
}

export function parseAndVerifyGcode(
  gcodeText: string,
  expectedJob: SequencedJobResult,
  sheetLimits: { width: number; height: number }
): BackplotVerificationResult {
  const lines = gcodeText.split('\n');
  const segments: BackplotSegment[] = [];
  const warnings: string[] = [];

  let currentPos: Point2D = { x: 0, y: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  const updateBounds = (p: Point2D) => {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  };

  updateBounds(currentPos);

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const rawLine = lines[lineNum].trim();
    // Strip comments
    const line = rawLine.split(';')[0].trim();
    if (!line) continue;

    // Extract G commands and coordinates
    const gMatch = line.match(/G0?([0-3])/i);
    const xMatch = line.match(/X([+-]?\d+(?:\.\d+)?)/i);
    const yMatch = line.match(/Y([+-]?\d+(?:\.\d+)?)/i);
    const iMatch = line.match(/I([+-]?\d+(?:\.\d+)?)/i);
    const jMatch = line.match(/J([+-]?\d+(?:\.\d+)?)/i);

    const targetX = xMatch ? parseFloat(xMatch[1]) : currentPos.x;
    const targetY = yMatch ? parseFloat(yMatch[1]) : currentPos.y;
    const targetPos: Point2D = { x: targetX, y: targetY };

    if (gMatch) {
      // Pure vertical Z-axis torch plunge/retract: ignore for 2D XY sheet backplot
      if (!xMatch && !yMatch) continue;

      const gCode = parseInt(gMatch[1], 10);
      if (gCode === 0) {
        // Rapid G00
        if (targetX !== currentPos.x || targetY !== currentPos.y) {
          segments.push({
            type: 'rapid',
            start: currentPos,
            end: targetPos,
            lineNumber: lineNum + 1,
          });
          updateBounds(targetPos);
          currentPos = targetPos;
        }
      } else if (gCode === 1) {
        // Linear cut G01
        if (targetX !== currentPos.x || targetY !== currentPos.y) {
          segments.push({
            type: 'feed_line',
            start: currentPos,
            end: targetPos,
            lineNumber: lineNum + 1,
          });
          updateBounds(targetPos);
          currentPos = targetPos;
        }
      } else if (gCode === 2 || gCode === 3) {
        // Arc cut G02 (CW) or G03 (CCW)
        const iRel = iMatch ? parseFloat(iMatch[1]) : 0;
        const jRel = jMatch ? parseFloat(jMatch[1]) : 0;
        const center: Point2D = {
          x: currentPos.x + iRel,
          y: currentPos.y + jRel,
        };
        const radius = Math.sqrt(iRel * iRel + jRel * jRel);

        segments.push({
          type: 'feed_arc',
          start: currentPos,
          end: targetPos,
          center,
          radius,
          clockwise: gCode === 2,
          lineNumber: lineNum + 1,
        });
        updateBounds(targetPos);
        currentPos = targetPos;
      }
    }
  }

  // Soft limit verification
  let exceedsSheet = false;
  if (minX < -0.01 || minY < -0.01 || maxX > sheetLimits.width + 0.01 || maxY > sheetLimits.height + 0.01) {
    exceedsSheet = true;
    warnings.push(
      `Yazılım Limit Uyarısı: Takım yolu sac sınırlarını aşıyor! (X: [${minX.toFixed(1)}, ${maxX.toFixed(1)}], Y: [${minY.toFixed(1)}, ${maxY.toFixed(1)}], Sac: ${sheetLimits.width}x${sheetLimits.height} mm)`
    );
  }

  // Compare endpoints with expected toolpath operations (leadIn, cut, overcut, leadOut)
  const feedSegments = segments.filter(s => s.type === 'feed_line' || s.type === 'feed_arc');
  const expectedCuts = expectedJob.toolpaths.flatMap(tp => 
    tp.operations.filter(op => (op.type === 'cut' || op.type === 'leadIn' || op.type === 'overcut' || op.type === 'leadOut') && op.segment)
  );

  let maxDeviation = 0;
  const compareCount = Math.min(feedSegments.length, expectedCuts.length);
  for (let i = 0; i < compareCount; i++) {
    const expSeg = expectedCuts[i].segment!;
    const dev = distance(expSeg.end, feedSegments[i].end);
    if (dev > maxDeviation) maxDeviation = dev;
  }

  return {
    isValid: maxDeviation < 0.01 && !exceedsSheet,
    totalSegments: segments.length,
    maxCoordinateDeviationMm: maxDeviation,
    exceedsSheetBounds: exceedsSheet,
    boundingEnvelope: { minX, minY, maxX, maxY },
    warnings,
  };
}
