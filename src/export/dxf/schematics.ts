/**
 * Deterministic 2D schematics for flow templates.
 * Geometry only — no math recomputation of stresses.
 */

import { DxfWriter } from './dxf-writer';
import { calculatePulleySpecs } from '@/engines/math/pulley-geometry-factory';
import { generateSprocketContour } from '@/engines/math/sprocket-geometry-factory';

function n(v: number, digits = 4): number {
    return Number(v.toFixed(digits));
}

export function beamSchematicDxf(input: {
    L: number;
    P?: number;
    I?: number;
    Z?: number;
}): string {
    const L = input.L;
    const I = input.I && input.I > 0 ? input.I : 150000;
    const Z = input.Z && input.Z > 0 ? input.Z : 8500;
    const h = Math.max(8, Math.min(L * 0.12, (2 * I) / Z));
    const y0 = 0;
    const y1 = h;
    const support = Math.max(6, h * 0.6);
    const dxf = new DxfWriter();

    dxf.addPolyline(
        [
            { x: 0, y: y0 },
            { x: L, y: y0 },
            { x: L, y: y1 },
            { x: 0, y: y1 },
        ],
        true,
        'PART_CONTOUR'
    );

    dxf.addLine(0, y0 + h / 2, L, y0 + h / 2, 'REFERENCE');

    dxf.addPolyline(
        [
            { x: 0, y: y0 },
            { x: -support * 0.6, y: -support },
            { x: support * 0.6, y: -support },
        ],
        true,
        'REFERENCE'
    );
    dxf.addPolyline(
        [
            { x: L, y: y0 },
            { x: L - support * 0.6, y: -support },
            { x: L + support * 0.6, y: -support },
        ],
        true,
        'REFERENCE'
    );

    const mid = L / 2;
    const arrowH = h + Math.max(18, h);
    dxf.addLine(mid, arrowH, mid, y1, 'DIMENSIONS');
    dxf.addLine(mid, y1, mid - h * 0.25, y1 + h * 0.35, 'DIMENSIONS');
    dxf.addLine(mid, y1, mid + h * 0.25, y1 + h * 0.35, 'DIMENSIONS');

    dxf.addText(L * 0.02, -support - 10, Math.max(3, L * 0.025), `L=${n(L, 2)} mm`, 'DIMENSIONS');
    if (input.P !== undefined) {
        dxf.addText(mid + 4, arrowH, Math.max(3, L * 0.022), `P=${n(input.P, 1)} N`, 'DIMENSIONS');
    }

    return dxf.end();
}

export function boltSectionDxf(input: { diameter: number; pitch?: number }): string {
    const d = input.diameter;
    const p = input.pitch && input.pitch > 0 ? input.pitch : d / 8;
    const head = d * 1.5;
    const pitchDia = Math.max(d * 0.5, d - 0.6495 * p);
    const dxf = new DxfWriter();

    dxf.addCircle(0, 0, head / 2, 'PART_CONTOUR');
    dxf.addCircle(0, 0, d / 2, 'PART_CONTOUR');
    dxf.addCircle(0, 0, d * 0.515, 'HOLES');
    dxf.addCircle(0, 0, pitchDia / 2, 'REFERENCE');
    dxf.addLine(-head * 0.6, 0, head * 0.6, 0, 'REFERENCE');
    dxf.addLine(0, -head * 0.6, 0, head * 0.6, 'REFERENCE');
    dxf.addText(head * 0.6, head * 0.55, Math.max(1.5, d * 0.18), `M${n(d, 2)}`, 'DIMENSIONS');

    return dxf.end();
}

export function shaftSectionDxf(input: { d: number; di?: number }): string {
    const d = input.d;
    const r = d / 2;
    const w = d / 4;
    const t = d / 8;
    const halfW = w / 2;
    const chordY = Math.sqrt(Math.max(0, r * r - halfW * halfW));
    const keyBottom = r - t;
    const steps = 48;
    const points: { x: number; y: number }[] = [];

    const aRight = Math.atan2(chordY, halfW);
    const aLeft = Math.atan2(chordY, -halfW);
    const sweep = aRight - (aLeft - 2 * Math.PI);
    for (let i = 0; i <= steps; i++) {
        const a = aRight - (sweep * i) / steps;
        points.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
    }
    points.push({ x: -halfW, y: chordY });
    points.push({ x: -halfW, y: keyBottom });
    points.push({ x: halfW, y: keyBottom });
    points.push({ x: halfW, y: chordY });

    const dxf = new DxfWriter();
    dxf.addPolyline(points, true, 'PART_CONTOUR');
    if (input.di && input.di > 0) {
        dxf.addCircle(0, 0, input.di / 2, 'HOLES');
    }
    dxf.addLine(-r * 0.15, 0, r * 0.15, 0, 'REFERENCE');
    dxf.addLine(0, -r * 0.15, 0, r * 0.15, 'REFERENCE');
    dxf.addText(r * 1.05, r * 0.2, Math.max(1.5, d * 0.08), `Ø${n(d, 2)}`, 'DIMENSIONS');
    return dxf.end();
}

export function sheetUnfoldDxf(input: {
    thickness: number;
    radius: number;
    angle: number;
    kFactor: number;
    flangeA?: number;
    flangeB?: number;
    width?: number;
}): string {
    const t = input.thickness;
    const R = input.radius;
    const A = input.angle;
    const K = input.kFactor;
    const rads = (A * Math.PI) / 180;
    const BA = rads * (R + K * t);
    const legA = input.flangeA && input.flangeA > 0 ? input.flangeA : Math.max(30, 20 * t);
    const legB = input.flangeB && input.flangeB > 0 ? input.flangeB : Math.max(30, 20 * t);
    const width = input.width && input.width > 0 ? input.width : Math.max(25, 16 * t);
    const flat = legA + BA + legB;
    const xBend1 = legA;
    const xBend2 = legA + BA;

    const dxf = new DxfWriter();
    dxf.addPolyline(
        [
            { x: 0, y: 0 },
            { x: flat, y: 0 },
            { x: flat, y: width },
            { x: 0, y: width },
        ],
        true,
        'PART_CONTOUR'
    );
    dxf.addLine(xBend1, 0, xBend1, width, 'BEND');
    dxf.addLine(xBend2, 0, xBend2, width, 'BEND');
    dxf.addPolyline(
        [
            { x: -t, y: -t },
            { x: flat + t, y: -t },
            { x: flat + t, y: width + t },
            { x: -t, y: width + t },
        ],
        true,
        'SHEET'
    );
    dxf.addText(2, width + 4, Math.max(2, t * 1.2), `BA=${n(BA, 2)} t=${n(t, 2)}`, 'DIMENSIONS');
    return dxf.end();
}

export function bearingArrangementDxf(input: {
    Fr: number;
    Fa: number;
    type: 'deep_groove' | 'taper';
    L10h: number;
}): string {
    const shaftL = 160;
    const shaftR = 12;
    const houseR = 28;
    const b1 = 40;
    const b2 = 120;
    const dxf = new DxfWriter();

    dxf.addLine(0, 0, shaftL, 0, 'REFERENCE');
    dxf.addLine(0, shaftR, shaftL, shaftR, 'PART_CONTOUR');
    dxf.addLine(0, -shaftR, shaftL, -shaftR, 'PART_CONTOUR');

    const drawBearing = (cx: number) => {
        const hw = 10;
        dxf.addPolyline(
            [
                { x: cx - hw, y: shaftR },
                { x: cx + hw, y: shaftR },
                { x: cx + hw, y: houseR },
                { x: cx - hw, y: houseR },
            ],
            true,
            'PART_CONTOUR'
        );
        dxf.addPolyline(
            [
                { x: cx - hw, y: -shaftR },
                { x: cx + hw, y: -shaftR },
                { x: cx + hw, y: -houseR },
                { x: cx - hw, y: -houseR },
            ],
            true,
            'PART_CONTOUR'
        );
        if (input.type === 'taper') {
            dxf.addLine(cx - hw, shaftR, cx + hw, houseR, 'HOLES');
            dxf.addLine(cx - hw, -shaftR, cx + hw, -houseR, 'HOLES');
        } else {
            dxf.addCircle(cx, (shaftR + houseR) / 2, 4, 'HOLES');
            dxf.addCircle(cx, -(shaftR + houseR) / 2, 4, 'HOLES');
        }
    };

    drawBearing(b1);
    drawBearing(b2);

    dxf.addLine((b1 + b2) / 2, 0, (b1 + b2) / 2, -houseR - 18, 'DIMENSIONS');
    dxf.addText((b1 + b2) / 2 + 2, -houseR - 16, 3.2, `Fr=${n(input.Fr, 1)} N`, 'DIMENSIONS');
    dxf.addLine(shaftL, 0, shaftL + 22, 0, 'DIMENSIONS');
    dxf.addText(shaftL + 2, 4, 3.2, `Fa=${n(input.Fa, 1)} N`, 'DIMENSIONS');
    dxf.addText(4, houseR + 8, 3.5, `${input.type === 'taper' ? 'Taper roller' : 'Deep groove'}  L10h=${n(input.L10h, 0)} h`, 'DIMENSIONS');

    return dxf.end();
}

export function helicalSpringDxf(input: {
    d: number;
    D: number;
    Na: number;
    De: number;
    Lc: number;
}): string {
    const rMean = input.D / 2;
    const pitch = Math.max(input.d * 1.8, (input.Na * input.d * 2.2) / Math.max(1, input.Na));
    const coils = Math.max(3, Math.round(input.Na));
    const points: { x: number; y: number }[] = [];
    const steps = coils * 16;
    for (let i = 0; i <= steps; i++) {
        const t = i / 16;
        const ang = t * 2 * Math.PI;
        points.push({
            x: rMean * Math.sin(ang),
            y: t * pitch,
        });
    }
    const dxf = new DxfWriter();
    dxf.addPolyline(points, false, 'PART_CONTOUR');
    const yMax = coils * pitch;
    dxf.addLine(-input.De / 2, 0, input.De / 2, 0, 'REFERENCE');
    dxf.addLine(-input.De / 2, yMax, input.De / 2, yMax, 'REFERENCE');
    dxf.addCircle(0, 0, input.De / 2, 'PITCH_CIRCLE');
    dxf.addText(input.De / 2 + 2, yMax * 0.5, Math.max(1.4, input.d * 0.45), `d=${n(input.d, 2)} De=${n(input.De, 2)} n=${n(input.Na, 1)} Lc=${n(input.Lc, 1)}`, 'DIMENSIONS');
    return dxf.end();
}

export function pressureVesselFlangeDxf(input: { R: number; t: number; P?: number }): string {
    const R = input.R;
    const t = Math.max(input.t, 1);
    const L = R * 1.6;
    const flange = t * 4;
    const flangeOD = R + t + flange;
    const dxf = new DxfWriter();

    // Inner wall
    dxf.addLine(0, R, L, R, 'PART_CONTOUR');
    dxf.addLine(0, -R, L, -R, 'PART_CONTOUR');
    // Outer wall
    dxf.addLine(0, R + t, L, R + t, 'PART_CONTOUR');
    dxf.addLine(0, -(R + t), L, -(R + t), 'PART_CONTOUR');
    // Left flange
    dxf.addPolyline(
        [
            { x: -flange, y: -flangeOD },
            { x: 0, y: -flangeOD },
            { x: 0, y: flangeOD },
            { x: -flange, y: flangeOD },
        ],
        true,
        'PART_CONTOUR'
    );
    // Right flange
    dxf.addPolyline(
        [
            { x: L, y: -flangeOD },
            { x: L + flange, y: -flangeOD },
            { x: L + flange, y: flangeOD },
            { x: L, y: flangeOD },
        ],
        true,
        'PART_CONTOUR'
    );
    dxf.addCircle(-flange / 2, (R + flangeOD) / 2, Math.max(2, t * 0.8), 'HOLES');
    dxf.addCircle(-flange / 2, -(R + flangeOD) / 2, Math.max(2, t * 0.8), 'HOLES');
    dxf.addCircle(L + flange / 2, (R + flangeOD) / 2, Math.max(2, t * 0.8), 'HOLES');
    dxf.addCircle(L + flange / 2, -(R + flangeOD) / 2, Math.max(2, t * 0.8), 'HOLES');
    dxf.addLine(0, 0, L, 0, 'REFERENCE');
    dxf.addText(4, -flangeOD - 12, Math.max(4, R * 0.04), `R=${n(R, 1)} t=${n(t, 2)}${input.P !== undefined ? ` P=${n(input.P, 2)} MPa` : ''}`, 'DIMENSIONS');
    return dxf.end();
}

function supportTriangle(dxf: DxfWriter, x: number, y: number, size: number, up: boolean) {
    const s = size;
    const yTip = up ? y + s : y - s;
    dxf.addPolyline(
        [
            { x, y },
            { x: x - s * 0.7, y: yTip },
            { x: x + s * 0.7, y: yTip },
        ],
        true,
        'REFERENCE'
    );
}

function supportFixed(dxf: DxfWriter, x: number, y: number, w: number, down: boolean) {
    const h = w * 0.45;
    const y0 = down ? y : y - h;
    dxf.addPolyline(
        [
            { x: x - w, y: y0 },
            { x: x + w, y: y0 },
            { x: x + w, y: y0 + h },
            { x: x - w, y: y0 + h },
        ],
        true,
        'REFERENCE'
    );
}

/** Euler/Tetmajer column: rectangular section, end-fixity glyphs, buckled sine on REFERENCE. */
export function columnBucklingDxf(input: {
    L: number;
    A: number;
    K: number;
    P?: number;
    Pcr?: number;
    lambda?: number;
}): string {
    const L = input.L;
    const w = Math.max(6, Math.min(L * 0.08, Math.sqrt(Math.max(input.A, 1))));
    const dxf = new DxfWriter();
    dxf.addPolyline(
        [
            { x: -w / 2, y: 0 },
            { x: w / 2, y: 0 },
            { x: w / 2, y: L },
            { x: -w / 2, y: L },
        ],
        true,
        'PART_CONTOUR'
    );
    dxf.addLine(0, 0, 0, L, 'REFERENCE');

    const K = input.K;
    const s = Math.max(8, w * 0.9);
    const pinned = Math.abs(K - 1) < 0.15;
    const fixedFixed = K <= 0.55;
    const cantilever = K >= 1.7;
    if (cantilever) {
        supportFixed(dxf, 0, 0, w * 1.4, true);
    } else if (fixedFixed) {
        supportFixed(dxf, 0, 0, w * 1.4, true);
        supportFixed(dxf, 0, L, w * 1.4, false);
    } else if (pinned) {
        supportTriangle(dxf, 0, 0, s, false);
        supportTriangle(dxf, 0, L, s, true);
    } else {
        supportFixed(dxf, 0, 0, w * 1.4, true);
        supportTriangle(dxf, 0, L, s, true);
    }

    const amp = w * 1.6;
    const bow: { x: number; y: number }[] = [];
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const y = t * L;
        const mode = cantilever ? Math.sin((t * Math.PI) / 2) : Math.sin(t * Math.PI);
        bow.push({ x: amp * mode, y });
    }
    dxf.addPolyline(bow, false, 'REFERENCE');

    const arrowH = L + Math.max(18, w * 2);
    dxf.addLine(0, arrowH, 0, L, 'DIMENSIONS');
    dxf.addLine(0, L, -w * 0.35, L + w * 0.5, 'DIMENSIONS');
    dxf.addLine(0, L, w * 0.35, L + w * 0.5, 'DIMENSIONS');
    dxf.addText(w * 0.7, L + 6, Math.max(3, L * 0.018), `L=${n(L, 1)} mm  K=${n(K, 2)}`, 'DIMENSIONS');
    if (input.P !== undefined) {
        dxf.addText(w * 0.7, arrowH, Math.max(3, L * 0.016), `P=${n(input.P, 0)} N`, 'DIMENSIONS');
    }
    if (input.Pcr !== undefined) {
        dxf.addText(w * 0.7, -s - 8, Math.max(3, L * 0.016), `Pcr=${n(input.Pcr, 0)} N`, 'DIMENSIONS');
    }
    if (input.lambda !== undefined) {
        dxf.addText(-w * 4, L * 0.5, Math.max(3, L * 0.016), `λ=${n(input.lambda, 1)}`, 'DIMENSIONS');
    }
    return dxf.end();
}

/** Fillet / butt weld T-joint schematic with throat and leg. */
export function weldJointDxf(input: {
    L: number;
    z: number;
    a: number;
    joint?: string;
}): string {
    const z = Math.max(input.z, 1);
    const a = Math.max(input.a, 0.5);
    const plate = Math.max(input.L, z * 8);
    const t = Math.max(z * 1.2, 6);
    const doubleFillet = (input.joint ?? '').includes('double');
    const butt = (input.joint ?? '').includes('butt');
    const dxf = new DxfWriter();

    dxf.addPolyline(
        [
            { x: 0, y: 0 },
            { x: plate, y: 0 },
            { x: plate, y: t },
            { x: 0, y: t },
        ],
        true,
        'PART_CONTOUR'
    );
    dxf.addPolyline(
        [
            { x: plate * 0.35, y: t },
            { x: plate * 0.35 + t, y: t },
            { x: plate * 0.35 + t, y: t + plate * 0.45 },
            { x: plate * 0.35, y: t + plate * 0.45 },
        ],
        true,
        'PART_CONTOUR'
    );

    const x0 = plate * 0.35 + t;
    const y0 = t;
    if (!butt) {
        dxf.addPolyline(
            [
                { x: x0, y: y0 },
                { x: x0 + z, y: y0 },
                { x: x0, y: y0 + z },
            ],
            true,
            'BEND'
        );
        dxf.addLine(x0, y0, x0 + a / Math.SQRT2, y0 + a / Math.SQRT2, 'REFERENCE');
        if (doubleFillet) {
            dxf.addPolyline(
                [
                    { x: plate * 0.35, y: y0 },
                    { x: plate * 0.35 - z, y: y0 },
                    { x: plate * 0.35, y: y0 + z },
                ],
                true,
                'BEND'
            );
        }
    } else {
        dxf.addLine(plate * 0.35, 0, plate * 0.35 + t, t, 'BEND');
        dxf.addLine(plate * 0.35 + t, 0, plate * 0.35, t, 'BEND');
    }

    dxf.addText(4, -z * 1.4, Math.max(2.4, z * 0.45), `z=${n(z, 2)} a=${n(a, 2)} L=${n(input.L, 1)} mm`, 'DIMENSIONS');
    return dxf.end();
}

function outerTangentPoints(
    c1x: number,
    r1: number,
    c2x: number,
    r2: number
): { u1: { x: number; y: number }; u2: { x: number; y: number }; l1: { x: number; y: number }; l2: { x: number; y: number } } {
    const C = c2x - c1x;
    const phi = Math.asin(Math.max(-1, Math.min(1, (r2 - r1) / C)));
    const cu = Math.cos(Math.PI / 2 + phi);
    const su = Math.sin(Math.PI / 2 + phi);
    const cl = Math.cos(-Math.PI / 2 + phi);
    const sl = Math.sin(-Math.PI / 2 + phi);
    return {
        u1: { x: c1x + r1 * cu, y: r1 * su },
        u2: { x: c2x + r2 * cu, y: r2 * su },
        l1: { x: c1x + r1 * cl, y: r1 * sl },
        l2: { x: c2x + r2 * cl, y: r2 * sl },
    };
}

/** Open belt drive: pitch circles, outer pulleys, both outer tangents. */
export function beltDriveDxf(input: {
    d1: number;
    d2: number;
    C: number;
    belts?: number;
}): string {
    const r1 = input.d1 / 2;
    const r2 = input.d2 / 2;
    const C = input.C;
    const p1 = calculatePulleySpecs({ type: 'v-belt', datumDiameter: input.d1 });
    const p2 = calculatePulleySpecs({ type: 'v-belt', datumDiameter: input.d2 });
    const dxf = new DxfWriter();
    dxf.addCircle(0, 0, r1, 'PITCH_CIRCLE');
    dxf.addCircle(C, 0, r2, 'PITCH_CIRCLE');
    dxf.addCircle(0, 0, p1.outsideRadius, 'PART_CONTOUR');
    dxf.addCircle(C, 0, p2.outsideRadius, 'PART_CONTOUR');
    dxf.addCircle(0, 0, Math.max(3, r1 * 0.18), 'HOLES');
    dxf.addCircle(C, 0, Math.max(3, r2 * 0.18), 'HOLES');
    const t = outerTangentPoints(0, r1, C, r2);
    dxf.addLine(t.u1.x, t.u1.y, t.u2.x, t.u2.y, 'PART_CONTOUR');
    dxf.addLine(t.l1.x, t.l1.y, t.l2.x, t.l2.y, 'PART_CONTOUR');
    dxf.addLine(0, 0, C, 0, 'REFERENCE');
    dxf.addText(4, -Math.max(r1, r2) - 12, Math.max(3, C * 0.018), `d1=${n(input.d1, 1)} d2=${n(input.d2, 1)} C=${n(C, 1)} z=${input.belts ?? 1}`, 'DIMENSIONS');
    return dxf.end();
}

/** ISO 606 roller-chain layout: pitch circles, ISO 606 tooth contours, outer tangents. */
export function chainDriveDxf(input: {
    dp1: number;
    dp2: number;
    da1: number;
    da2: number;
    z1: number;
    z2: number;
    C: number;
    p: number;
}): string {
    const r1 = input.dp1 / 2;
    const r2 = input.dp2 / 2;
    const C = input.C;
    const dxf = new DxfWriter();
    dxf.addCircle(0, 0, r1, 'PITCH_CIRCLE');
    dxf.addCircle(C, 0, r2, 'PITCH_CIRCLE');
    const driver = generateSprocketContour({
        teeth: input.z1,
        pitch: input.p,
        center: { x: 0, y: 0 },
        pointsPerTooth: 10,
    });
    const driven = generateSprocketContour({
        teeth: input.z2,
        pitch: input.p,
        center: { x: C, y: 0 },
        pointsPerTooth: 10,
    });
    dxf.addPolyline(driver, true, 'PART_CONTOUR');
    dxf.addPolyline(driven, true, 'PART_CONTOUR');
    dxf.addCircle(0, 0, Math.max(3, r1 * 0.2), 'HOLES');
    dxf.addCircle(C, 0, Math.max(3, r2 * 0.2), 'HOLES');
    const t = outerTangentPoints(0, r1, C, r2);
    dxf.addLine(t.u1.x, t.u1.y, t.u2.x, t.u2.y, 'PART_CONTOUR');
    dxf.addLine(t.l1.x, t.l1.y, t.l2.x, t.l2.y, 'PART_CONTOUR');
    dxf.addLine(0, 0, C, 0, 'REFERENCE');
    dxf.addText(4, -Math.max(r1, r2) - 14, Math.max(3, C * 0.018), `p=${n(input.p, 3)} z1=${input.z1} z2=${input.z2} C=${n(C, 1)}`, 'DIMENSIONS');
    return dxf.end();
}

/** ISO 6020 cylinder side view: barrel, piston, rod, pin eyes, wall. */
export function hydraulicCylinderDxf(input: {
    bore: number;
    rod: number;
    stroke: number;
    t: number;
}): string {
    const D = input.bore;
    const d = input.rod;
    const t = Math.max(input.t, 1);
    const stroke = input.stroke;
    const barrel = Math.max(stroke * 0.55, D * 3);
    const rodLen = Math.max(stroke * 0.45, D * 2);
    const Ri = D / 2;
    const Ro = Ri + t;
    const rr = d / 2;
    const eye = Math.max(6, d * 0.55);
    const dxf = new DxfWriter();

    dxf.addPolyline(
        [
            { x: 0, y: -Ro },
            { x: barrel, y: -Ro },
            { x: barrel, y: Ro },
            { x: 0, y: Ro },
        ],
        true,
        'PART_CONTOUR'
    );
    dxf.addLine(0, -Ri, barrel, -Ri, 'HOLES');
    dxf.addLine(0, Ri, barrel, Ri, 'HOLES');
    const pistX = barrel * 0.45;
    dxf.addPolyline(
        [
            { x: pistX, y: -Ri + 0.4 },
            { x: pistX + t * 1.6, y: -Ri + 0.4 },
            { x: pistX + t * 1.6, y: Ri - 0.4 },
            { x: pistX, y: Ri - 0.4 },
        ],
        true,
        'BEND'
    );
    dxf.addPolyline(
        [
            { x: pistX + t * 1.6, y: -rr },
            { x: barrel + rodLen, y: -rr },
            { x: barrel + rodLen, y: rr },
            { x: pistX + t * 1.6, y: rr },
        ],
        true,
        'PART_CONTOUR'
    );
    dxf.addCircle(-eye * 0.2, 0, eye, 'PART_CONTOUR');
    dxf.addCircle(-eye * 0.2, 0, eye * 0.35, 'HOLES');
    dxf.addCircle(barrel + rodLen + eye * 0.2, 0, eye, 'PART_CONTOUR');
    dxf.addCircle(barrel + rodLen + eye * 0.2, 0, eye * 0.35, 'HOLES');
    dxf.addLine(0, 0, barrel + rodLen, 0, 'REFERENCE');
    dxf.addText(4, -Ro - 12, Math.max(2.8, D * 0.08), `D=${n(D, 1)} d=${n(d, 1)} t=${n(t, 2)} S=${n(stroke, 0)}`, 'DIMENSIONS');
    return dxf.end();
}
