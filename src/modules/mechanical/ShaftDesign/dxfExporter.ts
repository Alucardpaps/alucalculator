/**
 * Shaft 2D AutoCAD DXF Exporter
 * Standard: ISO 128 / ISO 129 / AutoCAD R12 AC1009
 * Exports full production-grade 2D shaft blueprints to DXF format
 */

import { DxfWriter } from '@/export/dxf/dxf-writer';
import { ShaftSegment, getStandardKeywayDIN6885, getStandardUndercutDIN509 } from './engine';

export interface ShaftDxfExportOptions {
    includeCenterline?: boolean;
    includeDimensions?: boolean;
    includeFeatures?: boolean;
    unit?: 'mm' | 'inch';
}

/**
 * Generate an authentic AutoCAD DXF file string from shaft segments
 */
export function exportShaftToDXF(
    segments: ShaftSegment[],
    options: ShaftDxfExportOptions = {}
): string {
    const {
        includeCenterline = true,
        includeDimensions = true,
        includeFeatures = true,
        unit = 'mm'
    } = options;

    const writer = new DxfWriter({ units: unit, precision: 3 });

    if (!segments || segments.length === 0) {
        return writer.end();
    }

    let currentX = 0;
    const totalLength = segments.reduce((acc, s) => acc + s.length, 0);

    // Calculate maximum radius for dimension offsets
    const maxRadius = Math.max(...segments.map(s => s.diameter / 2), 20);

    // 1. ISO 128 CENTERLINE
    if (includeCenterline) {
        const leadExtension = Math.min(25, Math.max(10, totalLength * 0.05));
        writer.addLine(-leadExtension, 0, totalLength + leadExtension, 0, 'REFERENCE');
    }

    // 2. SHAFT SEGMENT CONTOURS & SHOULDERS
    // Detect center drill features on ends to open end-face mouths
    const leftCenterDrill = segments[0]?.features?.find(f => f.type === 'center_drill' && (f.face === 'left_end' || !f.face)) as any;
    const rightCenterDrill = segments[segments.length - 1]?.features?.find(f => f.type === 'center_drill' && f.face === 'right_end') as any;

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const segX1 = currentX;
        const segX2 = currentX + seg.length;
        const r = seg.diameter / 2;

        const isFirst = i === 0;
        const isLast = i === segments.length - 1;
        const prevSeg = i > 0 ? segments[i - 1] : null;
        const nextSeg = i < segments.length - 1 ? segments[i + 1] : null;

        // Chamfers on free ends or steps
        const cL = (isFirst ? (seg.chamferLeft ?? 1.5) : (prevSeg && seg.diameter > prevSeg.diameter ? (seg.chamferLeft ?? 1.0) : 0));
        const cR = (isLast ? (seg.chamferRight ?? 1.5) : (nextSeg && seg.diameter > nextSeg.diameter ? (seg.chamferRight ?? 1.0) : 0));

        // Trim contour boundaries so they never overlap undercuts or chamfers
        let topStartX = segX1;
        if (isFirst) {
            topStartX = segX1 + cL;
        } else if (prevSeg) {
            if (seg.diameter < prevSeg.diameter && seg.shoulderTransition !== 'radius') {
                const uc = getStandardUndercutDIN509(seg.diameter, seg.shoulderUndercutForm ?? 'E');
                topStartX = segX1 + uc.grooveWidth;
            } else if (seg.diameter > prevSeg.diameter && cL > 0) {
                topStartX = segX1 + cL;
            }
        }

        let topEndX = segX2;
        if (isLast) {
            topEndX = segX2 - cR;
        } else if (nextSeg) {
            if (seg.diameter < nextSeg.diameter && seg.shoulderTransition !== 'radius') {
                const uc = getStandardUndercutDIN509(seg.diameter, seg.shoulderUndercutForm ?? 'E');
                topEndX = segX2 - uc.grooveWidth;
            } else if (seg.diameter > nextSeg.diameter && cR > 0) {
                topEndX = segX2 - cR;
            }
        }

        // Upper profile line
        if (topEndX > topStartX) {
            writer.addLine(topStartX, r, topEndX, r, 'PART_CONTOUR');
            writer.addLine(topStartX, -r, topEndX, -r, 'PART_CONTOUR');
        }

        // Left Chamfers / Vertical face on free outer ends
        if (isFirst) {
            const mouthR = leftCenterDrill ? (((leftCenterDrill.coneDia || (leftCenterDrill.pilotDia ? leftCenterDrill.pilotDia * 2.12 : 4.25))) / 2) : 0;
            const faceTopR = r - cL;

            if (mouthR > 0 && mouthR < faceTopR) {
                writer.addLine(segX1, mouthR, segX1, faceTopR, 'PART_CONTOUR');
                writer.addLine(segX1, -mouthR, segX1, -faceTopR, 'PART_CONTOUR');
            } else {
                writer.addLine(segX1, -faceTopR, segX1, faceTopR, 'PART_CONTOUR');
            }

            if (cL > 0) {
                writer.addLine(segX1, faceTopR, segX1 + cL, r, 'PART_CONTOUR');
                writer.addLine(segX1, -faceTopR, segX1 + cL, -r, 'PART_CONTOUR');
            }
        }

        // Right Chamfers / Vertical face on free outer ends
        if (isLast) {
            const mouthR = rightCenterDrill ? (((rightCenterDrill.coneDia || (rightCenterDrill.pilotDia ? rightCenterDrill.pilotDia * 2.12 : 5.3))) / 2) : 0;
            const faceTopR = r - cR;

            if (mouthR > 0 && mouthR < faceTopR) {
                writer.addLine(segX2, mouthR, segX2, faceTopR, 'PART_CONTOUR');
                writer.addLine(segX2, -mouthR, segX2, -faceTopR, 'PART_CONTOUR');
            } else {
                writer.addLine(segX2, -faceTopR, segX2, faceTopR, 'PART_CONTOUR');
            }

            if (cR > 0) {
                writer.addLine(segX2 - cR, r, segX2, faceTopR, 'PART_CONTOUR');
                writer.addLine(segX2 - cR, -r, segX2, -faceTopR, 'PART_CONTOUR');
            }
        }

        // Intermediate Step Vertical Shoulder Faces
        if (nextSeg && seg.diameter !== nextSeg.diameter) {
            const nextR = nextSeg.diameter / 2;
            const isStepUp = r < nextR;
            const smallerSeg = isStepUp ? seg : nextSeg;
            const trans = smallerSeg.shoulderTransition ?? 'undercut';

            if (trans === 'undercut') {
                const uc = getStandardUndercutDIN509(smallerSeg.diameter, smallerSeg.shoulderUndercutForm ?? 'E');
                const ucDepth = uc.depth;

                // Draw vertical shoulder line meeting the undercut root
                writer.addLine(segX2, isStepUp ? r - ucDepth : nextR - ucDepth, segX2, isStepUp ? nextR : r, 'PART_CONTOUR');
                writer.addLine(segX2, isStepUp ? -(r - ucDepth) : -(nextR - ucDepth), segX2, isStepUp ? -nextR : -r, 'PART_CONTOUR');

                // Undercut relief groove lines
                if (isStepUp) {
                    writer.addLine(segX2 - uc.grooveWidth, r, segX2 - uc.radius, r - ucDepth, 'PART_CONTOUR');
                    writer.addLine(segX2 - uc.radius, r - ucDepth, segX2, r - ucDepth, 'PART_CONTOUR');
                    writer.addLine(segX2 - uc.grooveWidth, -r, segX2 - uc.radius, -(r - ucDepth), 'PART_CONTOUR');
                    writer.addLine(segX2 - uc.radius, -(r - ucDepth), segX2, -(r - ucDepth), 'PART_CONTOUR');
                } else {
                    writer.addLine(segX2, nextR - ucDepth, segX2 + uc.radius, nextR - ucDepth, 'PART_CONTOUR');
                    writer.addLine(segX2 + uc.radius, nextR - ucDepth, segX2 + uc.grooveWidth, nextR, 'PART_CONTOUR');
                    writer.addLine(segX2, -(nextR - ucDepth), segX2 + uc.radius, -(nextR - ucDepth), 'PART_CONTOUR');
                    writer.addLine(segX2 + uc.radius, -(nextR - ucDepth), segX2 + uc.grooveWidth, -nextR, 'PART_CONTOUR');
                }
            } else {
                // Fillet Radius transition or clean vertical face
                writer.addLine(segX2, Math.min(r, nextR), segX2, Math.max(r, nextR), 'PART_CONTOUR');
                writer.addLine(segX2, -Math.min(r, nextR), segX2, -Math.max(r, nextR), 'PART_CONTOUR');
            }
        }

        // 3. MECHANICAL FEATURES (Keyways, Circlips, Pins, Holes, Gears)
        if (includeFeatures && seg.features) {
            for (const f of seg.features) {
                if (f.type === 'keyway') {
                    const stdKw = getStandardKeywayDIN6885(seg.diameter);
                    const depth = (typeof f.depth === 'number' && f.depth > 0) ? f.depth : stdKw.depth;
                    const kwX1 = segX1 + f.offsetFromStart;
                    const kwX2 = kwX1 + f.length;
                    const floorY = r - depth;

                    // Slot boundary in 2D section view
                    writer.addLine(kwX1, r, kwX1, floorY, 'HOLES');
                    writer.addLine(kwX1, floorY, kwX2, floorY, 'HOLES');
                    writer.addLine(kwX2, floorY, kwX2, r, 'HOLES');

                    // Keyway depth dimension callout
                    if (includeDimensions) {
                        writer.addText(kwX1 + 2, floorY - 3, 2.5, `t1=${depth}`, 'DIMENSIONS');
                    }
                } else if (f.type === 'circlip') {
                    const ccX1 = segX1 + f.offsetFromStart;
                    const ccX2 = ccX1 + f.grooveWidth;
                    const grooveR = f.grooveDia / 2;

                    // Upper groove notch
                    writer.addLine(ccX1, r, ccX1, grooveR, 'HOLES');
                    writer.addLine(ccX1, grooveR, ccX2, grooveR, 'HOLES');
                    writer.addLine(ccX2, grooveR, ccX2, r, 'HOLES');

                    // Lower groove notch
                    writer.addLine(ccX1, -r, ccX1, -grooveR, 'HOLES');
                    writer.addLine(ccX1, -grooveR, ccX2, -grooveR, 'HOLES');
                    writer.addLine(ccX2, -grooveR, ccX2, -r, 'HOLES');
                } else if (f.type === 'cross_hole' || f.type === 'pin') {
                    const holeX = segX1 + f.offsetFromStart;
                    const holeR = f.diameter / 2;

                    // Cross-hole bore dashed lines through shaft
                    writer.addLine(holeX - holeR, -r, holeX - holeR, r, 'HOLES');
                    writer.addLine(holeX + holeR, -r, holeX + holeR, r, 'HOLES');
                    writer.addCircle(holeX, 0, holeR, 'HOLES');
                    writer.addLine(holeX - holeR - 2, 0, holeX + holeR + 2, 0, 'REFERENCE');
                    writer.addLine(holeX, -holeR - 2, holeX, holeR + 2, 'REFERENCE');
                } else if (f.type === 'gear') {
                    const gearX1 = segX1 + f.offsetFromStart;
                    const gearX2 = gearX1 + f.faceWidth;
                    const tipR = f.tipDiameter / 2;
                    const pitchR = f.pitchDiameter / 2;
                    const rootR = f.rootDiameter / 2;

                    // Gear tooth envelope (Upper)
                    writer.addLine(gearX1, r, gearX1, tipR, 'PART_CONTOUR');
                    writer.addLine(gearX1, tipR, gearX2, tipR, 'PART_CONTOUR');
                    writer.addLine(gearX2, tipR, gearX2, r, 'PART_CONTOUR');

                    // Gear tooth envelope (Lower)
                    writer.addLine(gearX1, -r, gearX1, -tipR, 'PART_CONTOUR');
                    writer.addLine(gearX1, -tipR, gearX2, -tipR, 'PART_CONTOUR');
                    writer.addLine(gearX2, -tipR, gearX2, -r, 'PART_CONTOUR');

                    // Pitch Circles (d0)
                    writer.addLine(gearX1 - 3, pitchR, gearX2 + 3, pitchR, 'PITCH_CIRCLE');
                    writer.addLine(gearX1 - 3, -pitchR, gearX2 + 3, -pitchR, 'PITCH_CIRCLE');

                    // Root Lines (df)
                    writer.addLine(gearX1, rootR, gearX2, rootR, 'HOLES');
                    writer.addLine(gearX1, -rootR, gearX2, -rootR, 'HOLES');
                } else if (f.type === 'center_drill' && (isFirst || isLast)) {
                    const isLeft = f.face === 'left_end';
                    const faceX = isLeft ? segX1 : segX2;
                    const dir = isLeft ? 1 : -1;
                    const pR = (f.pilotDia ?? 2.5) / 2;
                    const cR_hole = (f.coneDia ?? 5.3) / 2;
                    const coneLen = (cR_hole * 0.5) * dir;
                    const totLen = (f.totalDepth ?? 8.0) * dir;

                    // 60° conical center hole
                    writer.addLine(faceX, cR_hole, faceX + coneLen, pR, 'HOLES');
                    writer.addLine(faceX + coneLen, pR, faceX + totLen, pR, 'HOLES');
                    writer.addLine(faceX + totLen, pR, faceX + totLen + 2 * dir, 0, 'HOLES');
                    writer.addLine(faceX + totLen + 2 * dir, 0, faceX + totLen, -pR, 'HOLES');
                    writer.addLine(faceX + totLen, -pR, faceX + coneLen, -pR, 'HOLES');
                    writer.addLine(faceX + coneLen, -pR, faceX, -cR_hole, 'HOLES');
                }
            }
        }

        // 4. SEGMENT DIMENSIONS (Lengths & Diameters)
        if (includeDimensions) {
            // Segment Length Dimension Line below the shaft
            const dimY = -(maxRadius + 15);
            writer.addLine(segX1, dimY - 3, segX1, dimY + 3, 'DIMENSIONS');
            writer.addLine(segX2, dimY - 3, segX2, dimY + 3, 'DIMENSIONS');
            writer.addLine(segX1, dimY, segX2, dimY, 'DIMENSIONS');
            writer.addText(
                (segX1 + segX2) / 2 - 4,
                dimY - 4.5,
                3.0,
                `${seg.length}`,
                'DIMENSIONS'
            );

            // Segment Diameter Dimension Callout above the shaft
            const diaY = r + 6;
            writer.addLine((segX1 + segX2) / 2 - 8, diaY, (segX1 + segX2) / 2 + 8, diaY, 'DIMENSIONS');
            writer.addText(
                (segX1 + segX2) / 2 - 6,
                diaY + 1.5,
                3.0,
                `%%C${seg.diameter} ${seg.toleranceGrade}`,
                'DIMENSIONS'
            );
        }

        currentX += seg.length;
    }

    // 5. TOTAL OVERALL LENGTH DIMENSION
    if (includeDimensions && segments.length > 1) {
        const totDimY = -(maxRadius + 28);
        writer.addLine(0, totDimY - 4, 0, totDimY + 4, 'DIMENSIONS');
        writer.addLine(totalLength, totDimY - 4, totalLength, totDimY + 4, 'DIMENSIONS');
        writer.addLine(0, totDimY, totalLength, totDimY, 'DIMENSIONS');
        writer.addText(
            totalLength / 2 - 8,
            totDimY - 5,
            3.5,
            `TOTAL L=${Math.round(totalLength)} mm`,
            'DIMENSIONS'
        );
    }

    // 6. TITLE BLOCK & DRAWING METADATA
    const titleY = maxRadius + 30;
    writer.addText(0, titleY, 3.5, `ALUCAD OS - KADEMELI MIL TEKNIK RESMI (ISO 128 / DIN 743)`, 'DIMENSIONS');
    writer.addText(0, titleY - 6, 2.5, `TOPLAM BOY: ${Math.round(totalLength)} mm · KADEME SAYISI: ${segments.length} · BIRIM: mm`, 'DIMENSIONS');

    return writer.end();
}

/**
 * Triggers a direct browser download of the shaft DXF file
 */
export function downloadShaftDXF(
    segments: ShaftSegment[],
    filename?: string,
    options: ShaftDxfExportOptions = {}
): void {
    const dxfContent = exportShaftToDXF(segments, options);
    const totalLength = segments.reduce((acc, s) => acc + s.length, 0);
    const defaultName = filename || `alucalc_shaft_${Math.round(totalLength)}mm.dxf`;

    const blob = new Blob([dxfContent], { type: 'application/dxf;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName.endsWith('.dxf') ? defaultName : `${defaultName}.dxf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
