/**
 * 🎨 AluCAD OS — Realistic Material Textures & CAD Section Hatching Engine
 * 
 * Complies with AGENTS.md & GEMINI.md:
 * - Deterministic ISO 128 / DIN 201 Section Hatching (ANSI31, ANSI32, CROSS, HONEYCOMB)
 * - Pure HTML5 Canvas 2D procedural procedural shaders (No external image downloads / 100% CSP safe)
 * - Industrial-grade material finishes:
 *   - Anodized Brushed Aluminum (EN AW-6060 / 6082)
 *   - Cast Iron & Hammer-tone Enamel (Gamak RAL 5010 Blue, Yılmaz Redüktör Teal/Graphite GGG-40)
 *   - Rolled Structural & Galvanized Spangle Steel (S235JR / DIN EN 10131)
 *   - Hardened Chrome Bearing Steel (100Cr6)
 *   - Brass & Bronze Bushings/Plugs (CuZn39Pb3)
 *   - Vulcanized Neoprene / EPDM Rubber (Belts & Seals)
 */

import { Point } from '../kernel/types';

// Cached OffscreenCanvas patterns for 60 FPS rendering
const patternCache = new Map<string, CanvasPattern>();

/**
 * Creates or retrieves a cached brushed metal pattern with micro-scratches.
 */
export function getBrushedMetalPattern(
    ctx: CanvasRenderingContext2D,
    baseColor = '#94a3b8',
    direction: 'horizontal' | 'vertical' = 'horizontal'
): CanvasPattern | string {
    if (typeof document === 'undefined') return baseColor;
    const cacheKey = `brushed_${baseColor}_${direction}`;
    const cached = patternCache.get(cacheKey);
    if (cached) return cached;

    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const pCtx = canvas.getContext('2d');
    if (!pCtx) return baseColor;

    // Base metal tint
    pCtx.fillStyle = baseColor;
    pCtx.fillRect(0, 0, size, size);

    // Subtle anisotropic streaks
    pCtx.lineWidth = 1;
    for (let i = 0; i < 48; i++) {
        const pos = (i * 7) % size;
        const alpha = 0.04 + ((i * 13) % 10) * 0.008;
        const isLight = i % 2 === 0;
        pCtx.strokeStyle = isLight ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha * 0.8})`;
        pCtx.beginPath();
        if (direction === 'horizontal') {
            pCtx.moveTo(0, pos);
            pCtx.lineTo(size, pos);
        } else {
            pCtx.moveTo(pos, 0);
            pCtx.lineTo(pos, size);
        }
        pCtx.stroke();
    }

    const pattern = ctx.createPattern(canvas, 'repeat');
    if (pattern) {
        patternCache.set(cacheKey, pattern);
        return pattern;
    }
    return baseColor;
}

/**
 * Creates or retrieves a cached cast iron hammer-tone / sand-cast stipple pattern.
 * Ideal for Gamak motor carcass and Yılmaz redüktör housings.
 */
export function getCastIronPattern(
    ctx: CanvasRenderingContext2D,
    baseColor = '#1d4ed8'
): CanvasPattern | string {
    if (typeof document === 'undefined') return baseColor;
    const cacheKey = `cast_iron_${baseColor}`;
    const cached = patternCache.get(cacheKey);
    if (cached) return cached;

    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const pCtx = canvas.getContext('2d');
    if (!pCtx) return baseColor;

    // Base coat (e.g. Gamak blue or Yılmaz casing)
    pCtx.fillStyle = baseColor;
    pCtx.fillRect(0, 0, size, size);

    // Sand-cast micro stipple texture
    for (let i = 0; i < 90; i++) {
        const x = (i * 17 + (i % 7) * 5) % size;
        const y = (i * 23 + (i % 11) * 3) % size;
        const radius = 0.6 + ((i * 3) % 3) * 0.4;
        const isLight = i % 3 === 0;
        pCtx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.12)';
        pCtx.beginPath();
        pCtx.arc(x, y, radius, 0, Math.PI * 2);
        pCtx.fill();
    }

    const pattern = ctx.createPattern(canvas, 'repeat');
    if (pattern) {
        patternCache.set(cacheKey, pattern);
        return pattern;
    }
    return baseColor;
}

/**
 * Creates or retrieves a cached galvanized zinc spangle pattern for sheet metal.
 */
export function getGalvanizedZincPattern(
    ctx: CanvasRenderingContext2D,
    baseColor = '#94a3b8'
): CanvasPattern | string {
    if (typeof document === 'undefined') return baseColor;
    const cacheKey = `galv_${baseColor}`;
    const cached = patternCache.get(cacheKey);
    if (cached) return cached;

    const size = 56;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const pCtx = canvas.getContext('2d');
    if (!pCtx) return baseColor;

    // Base steel tint
    pCtx.fillStyle = baseColor;
    pCtx.fillRect(0, 0, size, size);

    // Crystalline spangles
    const facets = [
        { x: 12, y: 14, r: 10, a: 0.12 },
        { x: 38, y: 22, r: 14, a: 0.08 },
        { x: 26, y: 44, r: 12, a: 0.14 },
        { x: 48, y: 48, r: 9,  a: 0.10 }
    ];

    for (const f of facets) {
        pCtx.fillStyle = `rgba(255, 255, 255, ${f.a})`;
        pCtx.beginPath();
        for (let j = 0; j < 6; j++) {
            const ang = (j * Math.PI) / 3;
            const px = f.x + f.r * Math.cos(ang);
            const py = f.y + f.r * Math.sin(ang);
            if (j === 0) pCtx.moveTo(px, py);
            else pCtx.lineTo(px, py);
        }
        pCtx.closePath();
        pCtx.fill();
    }

    const pattern = ctx.createPattern(canvas, 'repeat');
    if (pattern) {
        patternCache.set(cacheKey, pattern);
        return pattern;
    }
    return baseColor;
}

/**
 * Creates cylindrical turned metallic gradient for shafts, bolts, and bearings.
 */
export function createCylindricalMetalGradient(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    baseColor = '#e2e8f0',
    specularHighlight = '#ffffff'
): CanvasGradient {
    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0.0, '#475569');
    grad.addColorStop(0.2, baseColor);
    grad.addColorStop(0.45, specularHighlight);
    grad.addColorStop(0.7, baseColor);
    grad.addColorStop(1.0, '#334155');
    return grad;
}

/**
 * Renders an ISO 128 / ANSI31 compliant section cross-hatch within a polygon boundary.
 * Uses canvas clipping to ensure hatch lines stay strictly within the part material.
 */
export function drawPolygonHatch(
    ctx: CanvasRenderingContext2D,
    boundaryVertices: Point[],
    pattern: 'ANSI31' | 'SOLID' | 'CROSS' | 'HONEYCOMB' = 'ANSI31',
    scale = 6.0,
    angleDeg = 45,
    color = '#0284c7',
    isSelected = false,
    holes?: Point[][],
    strokeBorder = true
): void {
    if (!boundaryVertices || boundaryVertices.length < 3) return;

    ctx.save();

    // 1. Define closed clipping boundary (including holes using evenodd winding)
    ctx.beginPath();
    ctx.moveTo(boundaryVertices[0].x, boundaryVertices[0].y);
    for (let i = 1; i < boundaryVertices.length; i++) {
        ctx.lineTo(boundaryVertices[i].x, boundaryVertices[i].y);
    }
    ctx.closePath();

    if (holes && holes.length > 0) {
        for (const hole of holes) {
            if (hole && hole.length >= 3) {
                ctx.moveTo(hole[0].x, hole[0].y);
                for (let i = 1; i < hole.length; i++) {
                    ctx.lineTo(hole[i].x, hole[i].y);
                }
                ctx.closePath();
            }
        }
    }

    const hasHoles = Boolean(holes && holes.length > 0);

    // Soft background tint for clear section contrast (anodized aluminum / steel)
    ctx.fillStyle = isSelected ? 'rgba(0, 229, 255, 0.16)' : 'rgba(56, 189, 248, 0.09)';
    ctx.fill(hasHoles ? 'evenodd' : 'nonzero');

    // Clip strictly to boundary polygon
    ctx.clip(hasHoles ? 'evenodd' : 'nonzero');

    // Calculate screen bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of boundaryVertices) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const diag = Math.hypot(width, height) * 1.5;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const spacing = Math.max(3.5, Math.min(45, scale));
    ctx.strokeStyle = isSelected ? '#00e5ff' : color;
    ctx.lineWidth = 1.0;

    if (pattern === 'SOLID') {
        ctx.fillStyle = isSelected ? 'rgba(0, 229, 255, 0.25)' : 'rgba(2, 132, 199, 0.22)';
        ctx.fill();
    } else if (pattern === 'ANSI31' || pattern === 'CROSS') {
        const rad1 = (angleDeg * Math.PI) / 180;
        const cos1 = Math.cos(rad1);
        const sin1 = Math.sin(rad1);
        const perpX1 = -sin1;
        const perpY1 = cos1;

        // Draw primary 45° angled lines
        const numLines = Math.ceil(diag / spacing);
        ctx.beginPath();
        for (let i = -numLines; i <= numLines; i++) {
            const offset = i * spacing;
            const px = cx + perpX1 * offset;
            const py = cy + perpY1 * offset;
            ctx.moveTo(px - cos1 * diag, py - sin1 * diag);
            ctx.lineTo(px + cos1 * diag, py + sin1 * diag);
        }
        ctx.stroke();

        // If CROSS (ANSI32 / cast iron / bronze), draw opposing 135° (-45°) lines
        if (pattern === 'CROSS') {
            // second family perpendicular to the first (the old −(180° − α) duplicated it)
            const rad2 = rad1 + Math.PI / 2;
            const cos2 = Math.cos(rad2);
            const sin2 = Math.sin(rad2);
            const perpX2 = -sin2;
            const perpY2 = cos2;

            ctx.beginPath();
            for (let i = -numLines; i <= numLines; i++) {
                const offset = i * spacing;
                const px = cx + perpX2 * offset;
                const py = cy + perpY2 * offset;
                ctx.moveTo(px - cos2 * diag, py - sin2 * diag);
                ctx.lineTo(px + cos2 * diag, py + sin2 * diag);
            }
            ctx.stroke();
        }
    } else if (pattern === 'HONEYCOMB') {
        // Hexagonal mesh
        const r = spacing * 0.8;
        const hexW = Math.sqrt(3) * r;
        const hexH = 1.5 * r;
        ctx.beginPath();
        for (let y = minY - r; y <= maxY + r; y += hexH) {
            const shiftX = Math.floor((y - minY) / hexH) % 2 === 0 ? 0 : hexW / 2;
            for (let x = minX - r; x <= maxX + r; x += hexW) {
                const hx = x + shiftX;
                for (let k = 0; k < 6; k++) {
                    const a = (k * Math.PI) / 3;
                    const vx = hx + r * Math.cos(a);
                    const vy = y + r * Math.sin(a);
                    if (k === 0) ctx.moveTo(vx, vy);
                    else ctx.lineTo(vx, vy);
                }
            }
        }
        ctx.stroke();
    }

    ctx.restore();

    // Subtle outline border
    if (strokeBorder) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(boundaryVertices[0].x, boundaryVertices[0].y);
        for (let i = 1; i < boundaryVertices.length; i++) {
            ctx.lineTo(boundaryVertices[i].x, boundaryVertices[i].y);
        }
        ctx.closePath();
        ctx.strokeStyle = isSelected ? '#00e5ff' : color;
        ctx.lineWidth = isSelected ? 1.5 : 1;
        ctx.stroke();
        ctx.restore();
    }
}
