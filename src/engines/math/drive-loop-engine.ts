/**
 * Analytical Open-Drive Parametric Loop Engine.
 * Provides exact O(1) continuous parametric position, tangent angle, and normal vectors
 * for open belt and chain drives wrapping two sprockets or pulleys.
 */

export interface DrivePoint {
    x: number;
    y: number;
    ang: number;       // Tangent angle in radians (CW direction in SVG y-down)
    nx: number;        // Unit outward normal X
    ny: number;        // Unit outward normal Y
    seg: 1 | 2 | 3 | 4; // 1: top span, 2: driven arc, 3: bottom span, 4: driver arc
}

export interface DriveLoop {
    span1Len: number;
    arc2Len: number;
    span2Len: number;
    arc1Len: number;
    totalLength: number;
    p1t: { x: number; y: number };
    p2t: { x: number; y: number };
    p2b: { x: number; y: number };
    p1b: { x: number; y: number };
    alphaTop: number;
    alphaBot: number;
    getPointAt: (distance: number) => DrivePoint;
    getRibbonPath: (offsetOuter: number, offsetInner?: number, numSteps?: number) => string;
}

export function createDriveLoop(
    cx1: number,
    cy1: number,
    r1: number,
    cx2: number,
    cy2: number,
    r2: number,
): DriveLoop | null {
    const dx = cx2 - cx1;
    const dy = cy2 - cy1;
    const C = Math.hypot(dx, dy);
    if (C <= 0 || r1 <= 0 || r2 <= 0 || C <= Math.abs(r2 - r1)) {
        return null;
    }

    const baseAngle = Math.atan2(dy, dx);
    const theta = Math.acos(Math.max(-1, Math.min(1, (r1 - r2) / C)));

    // In SVG coordinates (y-down):
    // Top tangent angle is baseAngle - theta
    // Bottom tangent angle is baseAngle + theta
    const alphaTop = baseAngle - theta;
    const alphaBot = baseAngle + theta;

    const p1t = { x: cx1 + r1 * Math.cos(alphaTop), y: cy1 + r1 * Math.sin(alphaTop) };
    const p1b = { x: cx1 + r1 * Math.cos(alphaBot), y: cy1 + r1 * Math.sin(alphaBot) };
    const p2t = { x: cx2 + r2 * Math.cos(alphaTop), y: cy2 + r2 * Math.sin(alphaTop) };
    const p2b = { x: cx2 + r2 * Math.cos(alphaBot), y: cy2 + r2 * Math.sin(alphaBot) };

    const span1Len = Math.hypot(p2t.x - p1t.x, p2t.y - p1t.y);
    const span2Len = Math.hypot(p1b.x - p2b.x, p1b.y - p2b.y);

    // Arc on pulley 2 (clockwise from alphaTop to alphaBot)
    let deltaA2 = alphaBot - alphaTop;
    while (deltaA2 <= 0) deltaA2 += Math.PI * 2;
    while (deltaA2 > Math.PI * 2) deltaA2 -= Math.PI * 2;
    const arc2Len = r2 * deltaA2;

    // Arc on pulley 1 (clockwise from alphaBot to alphaTop + 2*PI)
    let deltaA1 = (alphaTop + Math.PI * 2) - alphaBot;
    while (deltaA1 <= 0) deltaA1 += Math.PI * 2;
    while (deltaA1 > Math.PI * 2) deltaA1 -= Math.PI * 2;
    const arc1Len = r1 * deltaA1;

    const totalLength = span1Len + arc2Len + span2Len + arc1Len;

    function getPointAt(distance: number): DrivePoint {
        let dist = ((distance % totalLength) + totalLength) % totalLength;

        // Segment 1: Top span (p1t -> p2t)
        if (dist < span1Len) {
            const u = dist / span1Len;
            const x = p1t.x + (p2t.x - p1t.x) * u;
            const y = p1t.y + (p2t.y - p1t.y) * u;
            const ang = Math.atan2(p2t.y - p1t.y, p2t.x - p1t.x);
            // Outward normal: rotate tangent by -90 deg in y-down
            const nx = Math.sin(ang);
            const ny = -Math.cos(ang);
            return { x, y, ang, nx, ny, seg: 1 };
        }
        dist -= span1Len;

        // Segment 2: Pulley 2 clockwise arc (alphaTop -> alphaBot)
        if (dist < arc2Len) {
            const u = dist / arc2Len;
            const a = alphaTop + u * deltaA2;
            const x = cx2 + r2 * Math.cos(a);
            const y = cy2 + r2 * Math.sin(a);
            const ang = a + Math.PI / 2;
            const nx = Math.cos(a);
            const ny = Math.sin(a);
            return { x, y, ang, nx, ny, seg: 2 };
        }
        dist -= arc2Len;

        // Segment 3: Bottom span (p2b -> p1b)
        if (dist < span2Len) {
            const u = dist / span2Len;
            const x = p2b.x + (p1b.x - p2b.x) * u;
            const y = p2b.y + (p1b.y - p2b.y) * u;
            const ang = Math.atan2(p1b.y - p2b.y, p1b.x - p2b.x);
            const nx = Math.sin(ang);
            const ny = -Math.cos(ang);
            return { x, y, ang, nx, ny, seg: 3 };
        }
        dist -= span2Len;

        // Segment 4: Pulley 1 clockwise arc (alphaBot -> alphaTop)
        const u = dist / Math.max(1e-6, arc1Len);
        const a = alphaBot + u * deltaA1;
        const x = cx1 + r1 * Math.cos(a);
        const y = cy1 + r1 * Math.sin(a);
        const ang = a + Math.PI / 2;
        const nx = Math.cos(a);
        const ny = Math.sin(a);
        return { x, y, ang, nx, ny, seg: 4 };
    }

    /**
     * Generate an offset closed polygon ribbon (e.g. belt body between offsetInner and offsetOuter).
     */
    function getRibbonPath(offsetOuter: number, offsetInner = 0, numSteps = 120): string {
        const outerPts: { x: number; y: number }[] = [];
        const innerPts: { x: number; y: number }[] = [];

        for (let i = 0; i <= numSteps; i++) {
            const s = (i / numSteps) * totalLength;
            const pt = getPointAt(s);
            outerPts.push({
                x: pt.x + pt.nx * offsetOuter,
                y: pt.y + pt.ny * offsetOuter,
            });
            innerPts.push({
                x: pt.x + pt.nx * offsetInner,
                y: pt.y + pt.ny * offsetInner,
            });
        }

        if (outerPts.length === 0) return '';

        let path = `M ${outerPts[0].x.toFixed(2)} ${outerPts[0].y.toFixed(2)}`;
        for (let i = 1; i < outerPts.length; i++) {
            path += ` L ${outerPts[i].x.toFixed(2)} ${outerPts[i].y.toFixed(2)}`;
        }
        path += ' Z';

        if (Math.abs(offsetOuter - offsetInner) > 1e-4) {
            // Add inner loop in reverse for fillRule="evenodd"
            path += ` M ${innerPts[innerPts.length - 1].x.toFixed(2)} ${innerPts[innerPts.length - 1].y.toFixed(2)}`;
            for (let i = innerPts.length - 2; i >= 0; i--) {
                path += ` L ${innerPts[i].x.toFixed(2)} ${innerPts[i].y.toFixed(2)}`;
            }
            path += ' Z';
        }

        return path;
    }

    return {
        span1Len,
        arc2Len,
        span2Len,
        arc1Len,
        totalLength,
        p1t,
        p2t,
        p2b,
        p1b,
        alphaTop,
        alphaBot,
        getPointAt,
        getRibbonPath,
    };
}

export function generateOpenDriveLayoutSvg(input: {
    kind: 'belt' | 'chain';
    d1: number;
    d2: number;
    C: number;
    z1?: number;
    z2?: number;
    pitch?: number;
    od1?: number;
    od2?: number;
    title?: string;
}): string {
    const d1 = input.d1;
    const d2 = input.d2;
    const C = input.C;
    const pad = Math.max(40, Math.max(d1, d2) * 0.25);
    const widthMm = C + d1 / 2 + d2 / 2 + pad * 2;
    const heightMm = Math.max(d1, d2) + pad * 2;
    const cx1 = pad + d1 / 2;
    const cy = heightMm / 2;
    const cx2 = cx1 + C;
    const loop = createDriveLoop(cx1, cy, d1 / 2, cx2, cy, d2 / 2);
    const beltPath = loop ? loop.getRibbonPath(Math.max(2, (input.od1 ?? d1) / 2 - d1 / 2 + 3), 0, 160) : '';
    const title = input.title ?? (input.kind === 'chain' ? 'ISO 606 chain drive' : 'Open belt drive');
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${widthMm.toFixed(1)}mm" height="${heightMm.toFixed(1)}mm" viewBox="0 0 ${widthMm.toFixed(2)} ${heightMm.toFixed(2)}">
  <title>${title}</title>
  <g fill="none" stroke="#111" stroke-width="0.35">
    <circle cx="${cx1.toFixed(3)}" cy="${cy.toFixed(3)}" r="${(d1 / 2).toFixed(3)}" stroke="#00aa00" stroke-dasharray="2 1"/>
    <circle cx="${cx2.toFixed(3)}" cy="${cy.toFixed(3)}" r="${(d2 / 2).toFixed(3)}" stroke="#00aa00" stroke-dasharray="2 1"/>
    ${input.od1 ? `<circle cx="${cx1.toFixed(3)}" cy="${cy.toFixed(3)}" r="${(input.od1 / 2).toFixed(3)}" stroke="#cc0000"/>` : ''}
    ${input.od2 ? `<circle cx="${cx2.toFixed(3)}" cy="${cy.toFixed(3)}" r="${(input.od2 / 2).toFixed(3)}" stroke="#cc0000"/>` : ''}
    ${beltPath ? `<path d="${beltPath}" stroke="#aa6600" fill="none" stroke-width="0.8"/>` : ''}
    <line x1="${cx1.toFixed(3)}" y1="${cy.toFixed(3)}" x2="${cx2.toFixed(3)}" y2="${cy.toFixed(3)}" stroke="#888" stroke-dasharray="3 2"/>
  </g>
  <g font-family="monospace" font-size="3.2" fill="#333">
    <text x="${cx1.toFixed(3)}" y="${(cy + Math.max(d1, input.od1 ?? d1) / 2 + 8).toFixed(3)}" text-anchor="middle">d1=${d1.toFixed(2)}${input.z1 ? ` z=${input.z1}` : ''}</text>
    <text x="${cx2.toFixed(3)}" y="${(cy + Math.max(d2, input.od2 ?? d2) / 2 + 8).toFixed(3)}" text-anchor="middle">d2=${d2.toFixed(2)}${input.z2 ? ` z=${input.z2}` : ''}</text>
    <text x="${((cx1 + cx2) / 2).toFixed(3)}" y="${(pad * 0.45).toFixed(3)}" text-anchor="middle">${title}  C=${C.toFixed(2)} mm${input.pitch ? `  p=${input.pitch} mm` : ''}</text>
  </g>
</svg>`;
}

export function downloadOpenDriveLayoutSvg(input: Parameters<typeof generateOpenDriveLayoutSvg>[0], filename: string) {
    if (typeof window === 'undefined') return;
    const svg = generateOpenDriveLayoutSvg(input);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
