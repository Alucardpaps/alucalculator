/**
 * AluCAD — canvas drawing of parametric machine elements (gear, fastener, belt drive,
 * planetary set, sprocket).
 *
 * These functions only issue canvas path calls through `worldToScreen` and `zoom`, so the
 * same code paints the viewport and — through the recording context — produces the exact
 * world geometry for EXPLODE and every exporter.
 */

import type { Point } from '../kernel/types';
import {
    generateExternalGearContour,
    generateInternalGearContour,
} from '@/engines/math/gear-involute-factory';
import { generateSprocketContour } from '@/engines/math/sprocket-geometry-factory';
import { canvasPalette } from './canvasTheme';

type W2S = (p: Point) => Point;

/** Gear outline plus its dashed pitch circle (ISO 128 reference line). */
export function drawGear(ctx: CanvasRenderingContext2D, g: any, worldToScreen: W2S, zoom: number) {
    const vertices = computeGearVertices(g);
    strokeVertices(ctx, vertices, worldToScreen);
    if (!g.module || !g.teeth || !g.center) return;
    const c = worldToScreen(g.center);
    const rPitch = ((g.module * g.teeth) / 2) * zoom;
    ctx.save();
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(c.x, c.y, rPitch, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

export function computeGearVertices(g: any): Point[] {
    const { module: m, teeth: z, pressureAngle, center, rotation, profileShift } = g;
    if (!m || !z) return [];
    const rotDeg = ((rotation || 0) * 180) / Math.PI;
    return generateExternalGearContour({
        module: m,
        teeth: z,
        pressureAngle: pressureAngle || 20,
        profileShift: profileShift || 0,
        center: center || { x: 0, y: 0 },
        rotationAngle: rotDeg,
        pointsPerFlank: 8,
    });
}

export function drawFastener(ctx: CanvasRenderingContext2D, g: any, worldToScreen: (p: Point) => Point, zoom: number) {
    const {
        origin,
        fastenerType,
        diameter: d,
        length: len,
        pitch: p,
        rotation = -Math.PI / 2,
        view = 'SIDE',
        threadStyle = 'DETAILED'
    } = g;

    const METRIC_TABLE: Record<number, { pitch: number; headH: number; headW: number; nutH: number }> = {
        3:  { pitch: 0.5,  headH: 2.0,  headW: 5.5,  nutH: 2.4  },
        4:  { pitch: 0.7,  headH: 2.8,  headW: 7.0,  nutH: 3.2  },
        5:  { pitch: 0.8,  headH: 3.5,  headW: 8.0,  nutH: 4.7  },
        6:  { pitch: 1.0,  headH: 4.0,  headW: 10.0, nutH: 5.2  },
        8:  { pitch: 1.25, headH: 5.3,  headW: 13.0, nutH: 6.8  },
        10: { pitch: 1.5,  headH: 6.4,  headW: 16.0, nutH: 8.4  },
        12: { pitch: 1.75, headH: 7.5,  headW: 18.0, nutH: 10.8 },
        16: { pitch: 2.0,  headH: 10.0, headW: 24.0, nutH: 14.8 },
        20: { pitch: 2.5,  headH: 12.5, headW: 30.0, nutH: 18.0 },
        24: { pitch: 3.0,  headH: 15.0, headW: 36.0, nutH: 21.5 },
        30: { pitch: 3.5,  headH: 18.7, headW: 46.0, nutH: 25.6 },
        36: { pitch: 4.0,  headH: 22.5, headW: 55.0, nutH: 31.0 },
    };
    const meta = METRIC_TABLE[d] || {
        pitch: d * 0.15,
        headH: d * 0.65,
        headW: d * 1.6,
        nutH: d * 0.8
    };

    const pitch = p || meta.pitch || 1.5;
    const angle = rotation !== undefined ? rotation : -Math.PI / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    // dir points along the axis (from head toward tip)
    const dir = { x: cos, y: sin };
    // norm is perpendicular to axis (along diameter width)
    const norm = { x: -sin, y: cos };

    // Helper to convert local (u, v) -> screen coordinates
    const toScreen = (u: number, v: number): Point => {
        const wx = origin.x + u * norm.x + v * dir.x;
        const wy = origin.y + u * norm.y + v * dir.y;
        return worldToScreen({ x: wx, y: wy });
    };

    const drawLine = (u1: number, v1: number, u2: number, v2: number) => {
        const p1 = toScreen(u1, v1);
        const p2 = toScreen(u2, v2);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    };

    if (fastenerType === 'BOLT') {
        if (view === 'TOP') {
            // Top view of hex bolt head (ISO 4014)
            const s = meta.headW;
            const rHex = s / Math.sqrt(3);
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = angle + Math.PI / 6 + (Math.PI / 3) * i;
                const p = worldToScreen({
                    x: origin.x + rHex * Math.cos(a),
                    y: origin.y + rHex * Math.sin(a),
                });
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.closePath();
            ctx.stroke();

            // Nominal shaft circle (dashed hidden circle)
            const c = worldToScreen(origin);
            ctx.save();
            ctx.setLineDash([4, 2]);
            ctx.beginPath();
            ctx.arc(c.x, c.y, (d / 2) * zoom, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // Center crosshairs
            const mark = s * 0.7;
            drawLine(-mark, 0, mark, 0);
            drawLine(0, -mark, 0, mark);
            return;
        }

        // --- BOLT PROFILE VIEW (ISO 4014 / DIN 931 Side Elevation) ---
        const s = meta.headW;             // Hex width across flats
        const k = meta.headH;             // Head height
        const r = d / 2;                  // Shaft radius
        const d1 = Math.max(0.5, d - 1.08253 * pitch); // Root diameter (ISO 68)
        const rRoot = d1 / 2;
        const cTip = Math.min(pitch, d * 0.12);        // 45° chamfer length at tip
        const cWash = Math.min(0.5, Math.max(0.2, k * 0.08)); // Washer face (fatura) thickness
        const dw = s * 0.95;              // Washer face diameter
        const dh = Math.min(1.2, k * 0.15); // Top chamfer height
        const du = dh * 0.58;             // 30° chamfer bevel width

        // 1. Centerline (Eksen Çizgisi — ISO dash-dot)
        ctx.save();
        ctx.strokeStyle = 'rgba(138, 150, 166, 0.5)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([8, 3, 2, 3]);
        drawLine(0, -k - 3, 0, len + 4);
        ctx.restore();

        // 2. Under-head washer face (Fatura)
        drawLine(-dw / 2, 0, dw / 2, 0);
        drawLine(-dw / 2, 0, -dw / 2, -cWash);
        drawLine(dw / 2, 0, dw / 2, -cWash);
        drawLine(-s / 2, -cWash, -dw / 2, -cWash);
        drawLine(dw / 2, -cWash, s / 2, -cWash);

        // 3. Hex head outer vertical edges
        drawLine(-s / 2, -cWash, -s / 2, -k + dh);
        drawLine(s / 2, -cWash, s / 2, -k + dh);

        // 4. Hex head facet division lines (3 visible facets)
        drawLine(-s / 4, -cWash, -s / 4, -k + dh);
        drawLine(s / 4, -cWash, s / 4, -k + dh);

        // 5. Hex head top chamfers and characteristic 3D arcs
        // Outer 30° corner bevels
        drawLine(-s / 2, -k + dh, -s / 2 + du, -k);
        drawLine(s / 2, -k + dh, s / 2 - du, -k);

        // Center facet convex chamfer arc
        const pC1 = toScreen(-s / 4, -k + dh);
        const pC2 = toScreen(s / 4, -k + dh);
        const pCP = toScreen(0, -k - dh * 0.4);
        ctx.beginPath();
        ctx.moveTo(pC1.x, pC1.y);
        ctx.quadraticCurveTo(pCP.x, pCP.y, pC2.x, pC2.y);
        ctx.stroke();

        // Left facet chamfer curve
        const pL1 = toScreen(-s / 2 + du, -k);
        const pLCP = toScreen(-3 * s / 8, -k + dh * 0.4);
        ctx.beginPath();
        ctx.moveTo(pL1.x, pL1.y);
        ctx.quadraticCurveTo(pLCP.x, pLCP.y, pC1.x, pC1.y);
        ctx.stroke();

        // Right facet chamfer curve
        const pR1 = toScreen(s / 2 - du, -k);
        const pRCP = toScreen(3 * s / 8, -k + dh * 0.4);
        ctx.beginPath();
        ctx.moveTo(pC2.x, pC2.y);
        ctx.quadraticCurveTo(pRCP.x, pRCP.y, pR1.x, pR1.y);
        ctx.stroke();

        // 6. Bolt shank outer contour & closed 45° chamfered tip
        drawLine(-r, 0, -r, len - cTip);
        drawLine(r, 0, r, len - cTip);
        // 45° tip chamfers
        drawLine(-r, len - cTip, -rRoot, len);
        drawLine(r, len - cTip, rRoot, len);
        // Flat end face (closes the tip!)
        drawLine(-rRoot, len, rRoot, len);

        // 7. Thread length and ISO 6410 root lines
        const threadLength = len <= 125 ? Math.min(len, 2 * d + 6) : Math.min(len, 2 * d + 12);
        const vStart = Math.max(0, len - threadLength);

        if (vStart > 0.5) {
            // Thread limit termination line (diş bitim çizgisi)
            drawLine(-r, vStart, r, vStart);
            // Thread runout bevels (30° thread exit)
            const runout = Math.min(pitch * 1.5, (len - vStart) * 0.2);
            drawLine(-rRoot, vStart + runout, -r, vStart);
            drawLine(rRoot, vStart + runout, r, vStart);
        }

        // Continuous thread root lines (ISO 6410 thin lines)
        ctx.save();
        ctx.lineWidth = 0.9;
        ctx.strokeStyle = 'rgba(138, 150, 166, 0.65)';
        drawLine(-rRoot, vStart, -rRoot, len - cTip * 0.5);
        drawLine(rRoot, vStart, rRoot, len - cTip * 0.5);
        ctx.restore();

        // 8. Detailed pitch helix teeth & crest lines
        if (threadStyle === 'DETAILED') {
            let y = vStart + pitch * 0.4;
            while (y < len - cTip - pitch * 0.3) {
                // Angled thread crest line across shaft (true helix pitch lead)
                drawLine(-r, y, r, y + pitch * 0.5);

                // Symmetric thread teeth on BOTH sides of the shaft
                const pLt1 = toScreen(-rRoot, y);
                const pLt2 = toScreen(-r, y + pitch * 0.25);
                const pLt3 = toScreen(-rRoot, y + pitch * 0.5);
                ctx.beginPath();
                ctx.moveTo(pLt1.x, pLt1.y);
                ctx.lineTo(pLt2.x, pLt2.y);
                ctx.lineTo(pLt3.x, pLt3.y);
                ctx.stroke();

                const pRt1 = toScreen(rRoot, y + pitch * 0.5);
                const pRt2 = toScreen(r, y + pitch * 0.75);
                const pRt3 = toScreen(rRoot, y + pitch);
                ctx.beginPath();
                ctx.moveTo(pRt1.x, pRt1.y);
                ctx.lineTo(pRt2.x, pRt2.y);
                ctx.lineTo(pRt3.x, pRt3.y);
                ctx.stroke();

                y += pitch;
            }
        }
    } else {
        // --- HEX NUT (ISO 4032 / DIN 934) ---
        const s = meta.headW;
        const m = meta.nutH;
        const r = d / 2;
        const d1 = Math.max(0.5, d - 1.08253 * pitch);
        const rRoot = d1 / 2;

        if (view === 'SIDE') {
            // Nut profile view (side elevation with double chamfer)
            const dh = Math.min(1.0, m * 0.15);
            const du = dh * 0.58;

            // Centerline
            ctx.save();
            ctx.strokeStyle = 'rgba(138, 150, 166, 0.5)';
            ctx.lineWidth = 0.8;
            ctx.setLineDash([8, 3, 2, 3]);
            drawLine(0, -m / 2 - 3, 0, m / 2 + 3);
            ctx.restore();

            // Outer vertical edges
            drawLine(-s / 2, -m / 2 + dh, -s / 2, m / 2 - dh);
            drawLine(s / 2, -m / 2 + dh, s / 2, m / 2 - dh);

            // Facet divisions
            drawLine(-s / 4, -m / 2 + dh, -s / 4, m / 2 - dh);
            drawLine(s / 4, -m / 2 + dh, s / 4, m / 2 - dh);

            // Top chamfers
            drawLine(-s / 2, -m / 2 + dh, -s / 2 + du, -m / 2);
            drawLine(s / 2, -m / 2 + dh, s / 2 - du, -m / 2);
            const pT1 = toScreen(-s / 4, -m / 2 + dh);
            const pT2 = toScreen(s / 4, -m / 2 + dh);
            const pTCP = toScreen(0, -m / 2 - dh * 0.4);
            ctx.beginPath(); ctx.moveTo(pT1.x, pT1.y); ctx.quadraticCurveTo(pTCP.x, pTCP.y, pT2.x, pT2.y); ctx.stroke();
            const pTL = toScreen(-s / 2 + du, -m / 2);
            const pTLCP = toScreen(-3 * s / 8, -m / 2 + dh * 0.4);
            ctx.beginPath(); ctx.moveTo(pTL.x, pTL.y); ctx.quadraticCurveTo(pTLCP.x, pTLCP.y, pT1.x, pT1.y); ctx.stroke();
            const pTR = toScreen(s / 2 - du, -m / 2);
            const pTRCP = toScreen(3 * s / 8, -m / 2 + dh * 0.4);
            ctx.beginPath(); ctx.moveTo(pT2.x, pT2.y); ctx.quadraticCurveTo(pTRCP.x, pTRCP.y, pTR.x, pTR.y); ctx.stroke();

            // Bottom chamfers (ISO 4032 is double chamfered)
            drawLine(-s / 2, m / 2 - dh, -s / 2 + du, m / 2);
            drawLine(s / 2, m / 2 - dh, s / 2 - du, m / 2);
            const pB1 = toScreen(-s / 4, m / 2 - dh);
            const pB2 = toScreen(s / 4, m / 2 - dh);
            const pBCP = toScreen(0, m / 2 + dh * 0.4);
            ctx.beginPath(); ctx.moveTo(pB1.x, pB1.y); ctx.quadraticCurveTo(pBCP.x, pBCP.y, pB2.x, pB2.y); ctx.stroke();
            const pBL = toScreen(-s / 2 + du, m / 2);
            const pBLCP = toScreen(-3 * s / 8, m / 2 - dh * 0.4);
            ctx.beginPath(); ctx.moveTo(pBL.x, pBL.y); ctx.quadraticCurveTo(pBLCP.x, pBLCP.y, pB1.x, pB1.y); ctx.stroke();
            const pBR = toScreen(s / 2 - du, m / 2);
            const pBRCP = toScreen(3 * s / 8, m / 2 - dh * 0.4);
            ctx.beginPath(); ctx.moveTo(pB2.x, pB2.y); ctx.quadraticCurveTo(pBRCP.x, pBRCP.y, pBR.x, pBR.y); ctx.stroke();

            // Internal thread lines (hidden dashed)
            ctx.save();
            ctx.setLineDash([4, 2]);
            drawLine(-rRoot, -m / 2, -rRoot, m / 2);
            drawLine(rRoot, -m / 2, rRoot, m / 2);
            ctx.strokeStyle = 'rgba(138, 150, 166, 0.6)';
            drawLine(-r, -m / 2, -r, m / 2);
            drawLine(r, -m / 2, r, m / 2);
            ctx.restore();
        } else {
            // Nut top / axial view (ISO 4032 regular hexagon + ISO 6410 thread circle)
            const rHex = s / Math.sqrt(3);
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = angle + Math.PI / 6 + (Math.PI / 3) * i;
                const p = worldToScreen({
                    x: origin.x + rHex * Math.cos(a),
                    y: origin.y + rHex * Math.sin(a),
                });
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.closePath();
            ctx.stroke();

            // Core drill hole (thick solid circle d1)
            const c = worldToScreen(origin);
            ctx.beginPath();
            ctx.arc(c.x, c.y, rRoot * zoom, 0, Math.PI * 2);
            ctx.stroke();

            // Nominal diameter thread crest (ISO 6410 standard: 3/4 thin circle with 90° open quadrant)
            ctx.save();
            ctx.lineWidth = 0.9;
            ctx.strokeStyle = 'rgba(138, 150, 166, 0.8)';
            ctx.beginPath();
            ctx.arc(c.x, c.y, r * zoom, angle - Math.PI / 6, angle + (4 * Math.PI) / 3);
            ctx.stroke();
            ctx.restore();

            // Center crosshairs
            const mark = s * 0.65;
            ctx.save();
            ctx.strokeStyle = 'rgba(138, 150, 166, 0.4)';
            ctx.lineWidth = 0.8;
            drawLine(-mark, 0, mark, 0);
            drawLine(0, -mark, 0, mark);
            ctx.restore();
        }
    }
}

export function drawBeltPulley(ctx: CanvasRenderingContext2D, g: any, worldToScreen: (p: Point) => Point, zoom: number) {
    const { center1: c1, radius1: r1, center2: c2, radius2: r2, beltType } = g;
    const p1 = worldToScreen(c1);
    const p2 = worldToScreen(c2);
    const sr1 = r1 * zoom;
    const sr2 = r2 * zoom;

    // Draw Pulleys
    ctx.beginPath(); ctx.arc(p1.x, p1.y, sr1, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(p2.x, p2.y, sr2, 0, Math.PI * 2); ctx.stroke();

    // Calculate Tangents
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < Math.abs(sr1 - sr2)) return; // One inside another

    const angleBase = Math.atan2(dy, dx);
    
    ctx.save();
    ctx.setLineDash([5, 3]);
    ctx.strokeStyle = canvasPalette().strokeSoft;
    
    if (beltType === 'OPEN') {
        const angleOffset = Math.acos((sr1 - sr2) / d);
        const t1_1 = { x: p1.x + sr1 * Math.cos(angleBase + angleOffset), y: p1.y + sr1 * Math.sin(angleBase + angleOffset) };
        const t2_1 = { x: p2.x + sr2 * Math.cos(angleBase + angleOffset), y: p2.y + sr2 * Math.sin(angleBase + angleOffset) };
        const t1_2 = { x: p1.x + sr1 * Math.cos(angleBase - angleOffset), y: p1.y + sr1 * Math.sin(angleBase - angleOffset) };
        const t2_2 = { x: p2.x + sr2 * Math.cos(angleBase - angleOffset), y: p2.y + sr2 * Math.sin(angleBase - angleOffset) };

        ctx.beginPath(); ctx.moveTo(t1_1.x, t1_1.y); ctx.lineTo(t2_1.x, t2_1.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(t1_2.x, t1_2.y); ctx.lineTo(t2_2.x, t2_2.y); ctx.stroke();
    } else {
        const angleOffset = Math.acos((sr1 + sr2) / d);
        const t1_1 = { x: p1.x + sr1 * Math.cos(angleBase + angleOffset), y: p1.y + sr1 * Math.sin(angleBase + angleOffset) };
        const t2_1 = { x: p2.x + sr2 * Math.cos(angleBase + angleOffset + Math.PI), y: p2.y + sr2 * Math.sin(angleBase + angleOffset + Math.PI) };
        const t1_2 = { x: p1.x + sr1 * Math.cos(angleBase - angleOffset), y: p1.y + sr1 * Math.sin(angleBase - angleOffset) };
        const t2_2 = { x: p2.x + sr2 * Math.cos(angleBase - angleOffset + Math.PI), y: p2.y + sr2 * Math.sin(angleBase - angleOffset + Math.PI) };

        ctx.beginPath(); ctx.moveTo(t1_1.x, t1_1.y); ctx.lineTo(t2_1.x, t2_1.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(t1_2.x, t1_2.y); ctx.lineTo(t2_2.x, t2_2.y); ctx.stroke();
    }
    ctx.restore();
}

export function drawPlanetaryGear(ctx: CanvasRenderingContext2D, g: any, worldToScreen: (p: Point) => Point, zoom: number) {
    const { center, module: m, sunTeeth, planetTeeth, planetCount } = g;
    const ringTeeth = sunTeeth + 2 * planetTeeth;
    const orbitRadius = m * (sunTeeth + planetTeeth) / 2;

    // 1. Draw Sun Gear
    const sunGeom = { center, module: m, teeth: sunTeeth, rotation: g.rotationSun || 0 };
    const sunVerts = computeGearVertices(sunGeom);
    strokeVertices(ctx, sunVerts, worldToScreen);

    // 2. Draw Planets
    for (let i = 0; i < planetCount; i++) {
        const angle = (2 * Math.PI / planetCount) * i + (g.rotationCarrier || 0);
        const pCenter = {
            x: center.x + orbitRadius * Math.cos(angle),
            y: center.y + orbitRadius * Math.sin(angle)
        };
        // Planet rotation: linked to sun rotation for visual sync
        // Ratio = sun / planet
        const pRotation = (g.rotationSun || 0) * (-sunTeeth / planetTeeth) - angle * (1 + sunTeeth/planetTeeth);
        
        const pGeom = { center: pCenter, module: m, teeth: planetTeeth, rotation: pRotation };
        const pVerts = computeGearVertices(pGeom);
        strokeVertices(ctx, pVerts, worldToScreen);
    }

    // 3. Draw Ring Gear (Internal Involute Contour)
    const ringContour = generateInternalGearContour({
        module: m,
        teeth: ringTeeth,
        pressureAngle: g.pressureAngle || 20,
        center,
        rotationAngle: ((g.rotationRing || 0) * 180) / Math.PI,
        pointsPerFlank: 6,
        rimThickness: Math.max(6, m * 2.5),
    });
    ctx.save();
    ctx.strokeStyle = canvasPalette().strokeStrong;
    strokeVertices(ctx, ringContour.innerTeethContour, worldToScreen);
    strokeVertices(ctx, ringContour.outerRimContour, worldToScreen);
    ctx.restore();
}

export function drawSprocket(ctx: CanvasRenderingContext2D, g: any, worldToScreen: (p: Point) => Point, zoom: number) {
    const { center, teeth: z, pitch: p, rollerDiameter: d1, boreDiameter: bore, rotation } = g;
    if (!z || !p) return;
    const c = worldToScreen(center);
    const rotDeg = ((rotation || 0) * 180) / Math.PI;

    // 1. Compute ISO 606 Sprocket Outer Contour
    const vertices = generateSprocketContour({
        teeth: z,
        pitch: p,
        rollerDiameter: d1,
        center: center || { x: 0, y: 0 },
        rotationAngle: rotDeg,
        pointsPerTooth: 16,
    });
    strokeVertices(ctx, vertices, worldToScreen);

    // 2. Pitch circle (ISO 606 reference, dashed green)
    const pitchRad = Math.PI / z;
    const d = p / Math.sin(pitchRad);
    const rPitch = (d / 2) * zoom;
    ctx.save();
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.45)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(c.x, c.y, rPitch, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Central shaft bore circle (if > 0)
    const boreDia = bore !== undefined ? bore : 20;
    if (boreDia > 0) {
        ctx.setLineDash([]);
        ctx.strokeStyle = canvasPalette().strokeStrong;
        ctx.beginPath();
        ctx.arc(c.x, c.y, (boreDia / 2) * zoom, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
}

export function strokeVertices(ctx: CanvasRenderingContext2D, vertices: Point[], worldToScreen: (p: Point) => Point) {
    if (vertices.length === 0) return;
    ctx.beginPath();
    const first = worldToScreen(vertices[0]);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < vertices.length; i++) {
        const p = worldToScreen(vertices[i]);
        ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();
}
