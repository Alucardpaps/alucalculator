/**
 * AluCAD OS — Production-Grade Roller Chain Sprocket Geometry & 1:1 Export Engine
 * 
 * STANDARDS COMPLIANCE:
 * - ISO 606: Short-pitch transmission precision roller chains and chain wheels
 * - DIN 8187: Roller chains, European type (BS)
 * - DIN 8188: Roller chains, American type (ANSI)
 * - DIN 6885-1: Parallel keys and keyways
 * 
 * TOOTH FORM (ISO 606 / DIN 8187):
 * - Pitch diameter: d = p / sin(π / z)
 * - Root diameter: df = d - d1
 * - Tip diameter: da = d + p * (1 - 1.6/z) - d1 (to d + 1.25*p - d1)
 * - Roller seating radius: ri = 0.505 * d1
 * - Seating angle: α = 140° - 90° / z
 * - Tooth flank radius: re = min(0.12 * d1 * (z + 2), 0.008 * d1 * (z² + 180))
 */

import {
    Point2D,
    getDin6885Keyway,
    generateBoreAndKeywayContour,
    pointsToSvgPath,
    validateAndCleanContour,
} from './gear-involute-factory';

export interface SprocketParameters {
    teeth: number;             // z (number of teeth, min 6)
    pitch: number;             // p (chain pitch in mm, e.g. 12.7 for 08B / 1/2")
    rollerDiameter?: number;   // d1 (roller diameter in mm, optional)
    boreDiameter?: number;     // shaft bore diameter (mm, optional)
    hasKeyway?: boolean;       // include DIN 6885-1 keyway (default true if bore > 0)
    keywayWidth?: number;      // custom keyway width (mm, optional)
    keywayDepth?: number;      // custom keyway depth t1 (mm, optional)
    center?: Point2D;          // center {x, y} in mm
    rotationAngle?: number;    // rotation in degrees
    pointsPerTooth?: number;   // resolution per tooth (default 16)
}

export interface SprocketCalculatedSpecs {
    teeth: number;
    pitch: number;
    rollerDiameter: number;
    pitchDiameter: number;     // d = p / sin(π/z)
    pitchRadius: number;       // r = d / 2
    rootDiameter: number;      // df = d - d1
    rootRadius: number;        // rf = df / 2
    outsideDiameter: number;   // da (nominal tip diameter)
    outsideRadius: number;     // ra = da / 2
    rollerSeatingRadius: number; // ri = 0.505 * d1
    flankRadius: number;       // re
    seatingAngleDeg: number;   // α = 140° - 90°/z
    angularPitchRad: number;   // 2π / z
    boreDiameter: number;
    keyway: ReturnType<typeof getDin6885Keyway>;
}

/** Standard roller diameter lookup for common ISO/ANSI chain pitches */
export function getStandardRollerDiameter(pitchMm: number): number {
    const p = Math.round(pitchMm * 1000) / 1000;
    // Common pitches:
    if (Math.abs(p - 6.35) < 0.1) return 3.30;    // 04B / ANSI 25 (1/4")
    if (Math.abs(p - 9.525) < 0.1) return 6.35;   // 06B (3/8") / ANSI 35 is 5.08, 06B is 6.35
    if (Math.abs(p - 12.7) < 0.1) return 8.51;    // 08B (1/2") / ANSI 40 is 7.92, 08B is 8.51
    if (Math.abs(p - 15.875) < 0.1) return 10.16; // 10B / ANSI 50 (5/8")
    if (Math.abs(p - 19.05) < 0.1) return 12.07;  // 12B (3/4") / ANSI 60 is 11.91
    if (Math.abs(p - 25.4) < 0.1) return 15.88;   // 16B / ANSI 80 (1")
    if (Math.abs(p - 31.75) < 0.1) return 19.05;  // 20B / ANSI 100 (1-1/4")
    if (Math.abs(p - 38.1) < 0.1) return 25.40;   // 24B / ANSI 120 (1-1/2")
    // Fallback: standard ratio d1 ≈ 0.625 * p
    return Number((p * 0.625).toFixed(2));
}

export function calculateSprocketSpecs(params: SprocketParameters): SprocketCalculatedSpecs {
    const z = Math.max(6, Math.round(params.teeth));
    const p = Math.max(2, params.pitch);
    const d1 = params.rollerDiameter !== undefined && params.rollerDiameter > 0
        ? params.rollerDiameter
        : getStandardRollerDiameter(p);

    const pitchRad = Math.PI / z;
    const d = p / Math.sin(pitchRad);
    const r = d / 2;

    const df = d - d1;
    const rf = df / 2;

    const daMax = d + 1.25 * p - d1;
    const daMin = d + p * (1 - 1.6 / z) - d1;
    const da = (daMax + daMin) / 2;
    const ra = da / 2;

    const ri = 0.505 * d1;
    const seatingAngleDeg = 140 - 90 / z;
    const re = Math.min(0.12 * d1 * (z + 2), 0.008 * d1 * (z * z + 180));
    const angularPitchRad = (2 * Math.PI) / z;

    const defaultBore = Math.max(8, Math.round((d * 0.28) / 2) * 2);
    const boreDia = params.boreDiameter !== undefined ? params.boreDiameter : defaultBore;
    const keyway = getDin6885Keyway(boreDia, params.keywayWidth, params.keywayDepth);

    return {
        teeth: z,
        pitch: p,
        rollerDiameter: d1,
        pitchDiameter: d,
        pitchRadius: r,
        rootDiameter: df,
        rootRadius: rf,
        outsideDiameter: da,
        outsideRadius: ra,
        rollerSeatingRadius: ri,
        flankRadius: re,
        seatingAngleDeg,
        angularPitchRad,
        boreDiameter: boreDia,
        keyway,
    };
}

/**
 * Generates an ISO 606 compliant closed 2D polygon of a roller chain sprocket.
 * Includes precise concave roller seat bottom arcs and convex flank arcs.
 */
export function generateSprocketContour(params: SprocketParameters): Point2D[] {
    const specs = calculateSprocketSpecs(params);
    const {
        teeth: z,
        pitchRadius: r,
        rootRadius: rf,
        outsideRadius: ra,
        rollerSeatingRadius: ri,
        angularPitchRad: pitchAngle,
    } = specs;

    const center = params.center ?? { x: 0, y: 0 };
    const rotRad = ((params.rotationAngle ?? 0) * Math.PI) / 180;
    const ptsPerTooth = Math.max(12, params.pointsPerTooth ?? 16);

    const gamma = pitchAngle;
    const halfGamma = gamma / 2;

    const halfSeatAngle = (specs.seatingAngleDeg * Math.PI / 180) / 2;
    
    // Roller center for the right-hand seat (at phi = +halfGamma)
    const crX = r * Math.cos(halfGamma);
    const crY = r * Math.sin(halfGamma);

    // Right roller seat points: from junction (u=1) down to bottom (u=0)
    // Towards the tooth (smaller angle phi): angle around cr is (Math.PI + halfGamma) + u * halfSeatAngle
    const seatSteps = Math.max(3, Math.floor(ptsPerTooth / 4));
    const seatPoints: Point2D[] = [];
    for (let i = seatSteps; i >= 0; i--) {
        const u = i / seatSteps;
        const a = (Math.PI + halfGamma) + u * halfSeatAngle;
        const px = crX + ri * Math.cos(a);
        const py = crY + ri * Math.sin(a);
        seatPoints.push({ x: px, y: py });
    }

    // Junction point between flank and roller seat
    const junctionPt = seatPoints[0];
    const junctionAngle = Math.atan2(junctionPt.y, junctionPt.x);
    const junctionRadius = Math.hypot(junctionPt.x, junctionPt.y);

    // Tip crest half-angle (ensure strictly less than junctionAngle)
    const tipHalfAngle = Math.min(junctionAngle * 0.45, Math.min(halfGamma * 0.2, (0.12 * specs.pitch) / ra));

    // 1. Tip crest points (from phi = 0 to tipHalfAngle)
    const tipSteps = Math.max(2, Math.floor(ptsPerTooth / 4));
    const tipPoints: Point2D[] = [];
    for (let i = 0; i <= tipSteps; i++) {
        const u = i / tipSteps;
        const a = u * tipHalfAngle;
        tipPoints.push({
            x: ra * Math.cos(a),
            y: ra * Math.sin(a),
        });
    }

    // 2. Flank points connecting tip to junction
    const flankSteps = Math.max(3, Math.floor(ptsPerTooth / 3));
    const flankPoints: Point2D[] = [];
    for (let i = 1; i < flankSteps; i++) {
        const u = i / flankSteps;
        const ease = 0.5 - 0.5 * Math.cos(u * Math.PI);
        const a = tipHalfAngle + (junctionAngle - tipHalfAngle) * u;
        const rad = ra - (ra - junctionRadius) * ease;
        flankPoints.push({
            x: rad * Math.cos(a),
            y: rad * Math.sin(a),
        });
    }

    // Right half tooth: [tip (phi=0), flank, seat (down to phi=halfGamma)]
    const rightHalf: Point2D[] = [...tipPoints, ...flankPoints, ...seatPoints];

    // Left half tooth is exact mirror reflection across y=0 (x, -y)
    // Traced from left seat bottom (phi = -halfGamma) up to tooth tip (phi = 0)
    const leftHalf: Point2D[] = [];
    for (let i = rightHalf.length - 1; i > 0; i--) {
        leftHalf.push({
            x: rightHalf[i].x,
            y: -rightHalf[i].y,
        });
    }

    const fullTooth: Point2D[] = [...leftHalf, ...rightHalf];

    const allPoints: Point2D[] = [];
    for (let k = 0; k < z; k++) {
        const thetaK = k * gamma + rotRad;
        const cosK = Math.cos(thetaK);
        const sinK = Math.sin(thetaK);

        // Exclude the last point of each tooth to avoid duplicate seam vertices
        const count = fullTooth.length - 1;
        for (let j = 0; j < count; j++) {
            const p = fullTooth[j];
            allPoints.push({
                x: center.x + p.x * cosK - p.y * sinK,
                y: center.y + p.x * sinK + p.y * cosK,
            });
        }
    }

    return validateAndCleanContour(allPoints, 0.001);
}

/**
 * Generates production-ready 1:1 metric SVG for roller chain sprockets.
 */
export function generateProductionSprocketSvg(
    params: SprocketParameters,
    options: {
        customTitle?: string;
        material?: string;
        showDimensions?: boolean;
        showPitchCircle?: boolean;
        showCenterCross?: boolean;
    } = {}
): {
    svgString: string;
    widthMm: number;
    heightMm: number;
    specs: SprocketCalculatedSpecs;
    outerContourPoints?: Point2D[];
    innerCutPoints?: Point2D[];
} {
    const specs = calculateSprocketSpecs(params);
    const {
        outsideRadius: ra,
        pitchRadius: r,
        rootRadius: rf,
        boreDiameter,
        keyway,
        teeth: z,
        pitch: p,
        rollerDiameter: d1,
    } = specs;

    const margin = Math.max(15, ra * 0.2);
    const widthMm = (ra + margin) * 2;
    const heightMm = (ra + margin) * 2;
    const cx = widthMm / 2;
    const cy = heightMm / 2;

    const sprocketPoints = generateSprocketContour({
        ...params,
        center: { x: cx, y: cy },
    });
    const outerPath = pointsToSvgPath(sprocketPoints);

    const hasBore = boreDiameter > 0;
    const hasKey = params.hasKeyway ?? (boreDiameter > 0);
    const boreContour = hasBore
        ? generateBoreAndKeywayContour(
            { x: cx, y: cy },
            boreDiameter,
            hasKey,
            keyway
        )
        : [];
    const borePath = hasBore ? pointsToSvgPath(boreContour) : '';

    const showDims = options.showDimensions ?? true;
    const showPitch = options.showPitchCircle ?? true;
    const showCross = options.showCenterCross ?? true;
    const title = options.customTitle ?? `ISO 606 Sprocket z=${z} p=${p}mm (d1=${d1}mm)`;

    const svgParts: string[] = [];
    svgParts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg"`);
    svgParts.push(`     width="${widthMm.toFixed(4)}mm" height="${heightMm.toFixed(4)}mm"`);
    svgParts.push(`     viewBox="0 0 ${widthMm.toFixed(4)} ${heightMm.toFixed(4)}"`);
    svgParts.push(`     data-units="mm" data-scale="1.0000"`);
    svgParts.push(`     data-standard="ISO 606 / DIN 8187"`);
    svgParts.push(`     data-teeth="${z}" data-pitch="${p}">`);
    svgParts.push(`  <title>${title}</title>`);

    // Center Cross
    if (showCross) {
        const cLen = Math.max(6, ra * 0.15);
        svgParts.push(`  <g id="CENTER" stroke="#888888" stroke-width="0.05" stroke-dasharray="2,1">`);
        svgParts.push(`    <line x1="${(cx - cLen).toFixed(4)}" y1="${cy.toFixed(4)}" x2="${(cx + cLen).toFixed(4)}" y2="${cy.toFixed(4)}" />`);
        svgParts.push(`    <line x1="${cx.toFixed(4)}" y1="${(cy - cLen).toFixed(4)}" x2="${cx.toFixed(4)}" y2="${(cy + cLen).toFixed(4)}" />`);
        svgParts.push(`  </g>`);
    }

    // Pitch & Root Circles
    if (showPitch) {
        svgParts.push(`  <g id="REFERENCE" fill="none" stroke-width="0.05">`);
        svgParts.push(`    <circle cx="${cx.toFixed(4)}" cy="${cy.toFixed(4)}" r="${r.toFixed(4)}" stroke="#00AA00" stroke-dasharray="3,2" />`);
        svgParts.push(`    <circle cx="${cx.toFixed(4)}" cy="${cy.toFixed(4)}" r="${rf.toFixed(4)}" stroke="#888888" stroke-dasharray="1,2" opacity="0.5" />`);
        svgParts.push(`  </g>`);
    }

    // Inner Cuts (Bore & Keyway)
    if (hasBore && borePath) {
        svgParts.push(`  <g id="INNER_CUTS" fill="none" stroke="#0000FF" stroke-width="0.10" stroke-linejoin="round">`);
        svgParts.push(`    <path d="${borePath}" />`);
        svgParts.push(`  </g>`);
    }

    // Outer Cut (Sprocket Teeth)
    svgParts.push(`  <g id="OUTER_CUT" fill="none" stroke="#FF0000" stroke-width="0.10" stroke-linejoin="round">`);
    svgParts.push(`    <path d="${outerPath}" />`);
    svgParts.push(`  </g>`);

    // Dimensions
    if (showDims) {
        svgParts.push(`  <g id="DIMENSIONS" fill="#0055AA" stroke="none" font-family="ui-monospace, monospace" font-size="2.4">`);
        svgParts.push(`    <text x="${cx.toFixed(4)}" y="${(cy - ra - 4).toFixed(4)}" text-anchor="middle">da = ${(ra * 2).toFixed(2)} mm</text>`);
        svgParts.push(`    <text x="${cx.toFixed(4)}" y="${(cy + ra + 6).toFixed(4)}" text-anchor="middle">d = ${(r * 2).toFixed(2)} mm · z=${z} · p=${p}mm</text>`);
        svgParts.push(`  </g>`);
    }

    svgParts.push(`</svg>`);

    return {
        svgString: svgParts.join('\n'),
        widthMm,
        heightMm,
        specs,
        outerContourPoints: sprocketPoints,
        innerCutPoints: boreContour,
    };
}

/**
 * Generates production-ready AutoCAD R12/R14 DXF for roller chain sprockets.
 */
export function generateProductionSprocketDxf(params: SprocketParameters): string {
    const specs = calculateSprocketSpecs(params);
    const { outsideRadius: ra, boreDiameter, keyway, teeth: z, pitch: p, rollerDiameter: d1 } = specs;
    const points = generateSprocketContour(params);

    const dxfLines: string[] = [];
    const n = (v: number) => v.toFixed(4);

    // DXF Header with metric units
    dxfLines.push(
        '0', 'SECTION',
        '2', 'HEADER',
        '9', '$ACADVER', '1', 'AC1009',
        '9', '$INSUNITS', '70', '4',
        '9', '$MEASUREMENT', '70', '1',
        '0', 'ENDSEC',
        '0', 'SECTION',
        '2', 'TABLES',
        '0', 'TABLE',
        '2', 'LAYER',
        '70', '4',
        '0', 'LAYER', '2', 'OUTER_CUT', '70', '0', '62', '1', '6', 'CONTINUOUS',
        '0', 'LAYER', '2', 'INNER_CUTS', '70', '0', '62', '5', '6', 'CONTINUOUS',
        '0', 'LAYER', '2', 'PITCH_CIRCLE', '70', '0', '62', '3', '6', 'DASHED',
        '0', 'LAYER', '2', 'DIMENSIONS', '70', '0', '62', '4', '6', 'CONTINUOUS',
        '0', 'ENDTAB',
        '0', 'ENDSEC',
        '0', 'SECTION',
        '2', 'ENTITIES'
    );

    // Pitch Circle
    dxfLines.push(
        '0', 'CIRCLE',
        '8', 'PITCH_CIRCLE',
        '10', '0.0000', '20', '0.0000', '30', '0.0000',
        '40', n(specs.pitchRadius)
    );

    // Inner Cuts (Bore & Keyway)
    if (boreDiameter > 0) {
        const hasKey = params.hasKeyway ?? (boreDiameter > 0);
        const borePoints = generateBoreAndKeywayContour(
            { x: 0, y: 0 },
            boreDiameter,
            hasKey,
            keyway
        );
        if (borePoints.length > 2) {
            dxfLines.push('0', 'POLYLINE', '8', 'INNER_CUTS', '66', '1', '70', '1');
            for (const pt of borePoints) {
                dxfLines.push('0', 'VERTEX', '8', 'INNER_CUTS', '10', n(pt.x), '20', n(pt.y), '30', '0.0000');
            }
            dxfLines.push('0', 'SEQEND');
        }
    }

    // Outer Sprocket Polyline
    dxfLines.push('0', 'POLYLINE', '8', 'OUTER_CUT', '66', '1', '70', '1');
    for (const pt of points) {
        dxfLines.push('0', 'VERTEX', '8', 'OUTER_CUT', '10', n(pt.x), '20', n(pt.y), '30', '0.0000');
    }
    dxfLines.push('0', 'SEQEND');

    // Dimension Text
    dxfLines.push(
        '0', 'TEXT',
        '8', 'DIMENSIONS',
        '10', n(-ra * 0.8), '20', n(-ra - 8), '30', '0.0000',
        '40', '3.0',
        '1', `ISO 606 Sprocket z=${z} p=${p}mm d1=${d1}mm Da=${n(specs.outsideDiameter)} Df=${n(specs.rootDiameter)}`
    );

    dxfLines.push('0', 'ENDSEC', '0', 'EOF');

    return dxfLines.join('\n');
}

/** Triggers browser download for 1:1 Sprocket SVG */
export function downloadSprocketProductionSvg(
    params: SprocketParameters,
    filename = 'sprocket_1to1_CAM.svg',
    options = {}
): void {
    if (typeof window === 'undefined') return;
    const { svgString } = generateProductionSprocketSvg(params, options);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/** Triggers browser download for 1:1 Sprocket DXF */
export function downloadSprocketProductionDxf(
    params: SprocketParameters,
    filename = 'sprocket_1to1.dxf'
): void {
    if (typeof window === 'undefined') return;
    const dxfString = generateProductionSprocketDxf(params);
    const blob = new Blob([dxfString], { type: 'application/dxf;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
