/**
 * AluCalc OS — Parametric Beam Visualizer
 * 
 * Generates SVG representation of beams with deflection curves.
 * Supports various loading conditions and boundary types.
 */

export interface BeamVisualizerParams {
    span: number;              // L - Beam span (mm)
    loadMagnitude: number;     // P or w - Load value
    loadType: 'point' | 'uniform' | 'triangular';
    loadPosition?: number;     // For point load, 0-1 ratio
    supportLeft: 'fixed' | 'pinned' | 'roller' | 'free';
    supportRight: 'fixed' | 'pinned' | 'roller' | 'free';
    deflection?: number;       // Calculated max deflection (mm)
    moment?: number;           // Calculated max moment
    stressRatio?: number;      // 0-1, for color coding
    sectionType?: 'i-beam' | 'channel' | 'rectangular' | 'circular';
}

export interface BeamVisualizerOutput {
    svg: string;
    viewBox: string;
    width: number;
    height: number;
}

/**
 * Get stress-based color gradient
 */
function getStressColor(ratio: number): string {
    if (ratio < 0.5) return '#00e5ff';       // Safe - Cyan
    if (ratio < 0.7) return '#ffc107';       // Warning - Amber
    if (ratio < 0.9) return '#ff9800';       // Caution - Orange
    return '#f44336';                         // Danger - Red
}

/**
 * Generate deflection curve points for simply supported beam with point load
 */
function generateDeflectionCurve(
    span: number,
    loadPosition: number,
    maxDeflection: number,
    numPoints: number = 50
): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const a = loadPosition * span;
    const b = span - a;

    for (let i = 0; i <= numPoints; i++) {
        const x = (i / numPoints) * span;
        let y = 0;

        // Deflection formula for simply supported beam with point load
        if (x <= a) {
            // Left of load: y = Pbx(L²-b²-x²)/(6EIL)
            y = (maxDeflection / span) * x * (1 - (x * x) / (span * span));
        } else {
            // Right of load: y = Pa(L-x)(2Lx-x²-a²)/(6EIL)
            y = (maxDeflection / span) * (span - x) * (1 - ((span - x) * (span - x)) / (span * span));
        }

        points.push({ x, y: y * 10 }); // Scale for visibility
    }

    return points;
}

/**
 * Generate uniform load deflection curve
 */
function generateUniformDeflectionCurve(
    span: number,
    maxDeflection: number,
    numPoints: number = 50
): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];

    for (let i = 0; i <= numPoints; i++) {
        const x = (i / numPoints) * span;
        // Quartic deflection curve for uniform load
        const ratio = x / span;
        const y = maxDeflection * 16 * ratio * ratio * (1 - ratio) * (1 - ratio);
        points.push({ x, y: y * 10 });
    }

    return points;
}

/**
 * Generate support SVG
 */
function generateSupport(
    type: 'fixed' | 'pinned' | 'roller' | 'free',
    x: number,
    y: number,
    scale: number
): string {
    const size = 15 * scale;

    switch (type) {
        case 'fixed':
            // Hatched wall
            return `
                <rect x="${x - size / 2}" y="${y}" width="${size}" height="${size}" fill="#2a3a4a" stroke="#00e5ff" stroke-width="1"/>
                <line x1="${x - size / 2}" y1="${y}" x2="${x - size / 2}" y2="${y + size}" stroke="#00e5ff" stroke-width="2"/>
                <g stroke="#555" stroke-width="1">
                    ${[0, 3, 6, 9, 12].map(i => `<line x1="${x - size / 2 + i}" y1="${y + size}" x2="${x - size / 2 + i + 3}" y2="${y}"/>`).join('')}
                </g>
            `;

        case 'pinned':
            // Triangle support
            return `
                <polygon 
                    points="${x},${y} ${x - size / 2},${y + size} ${x + size / 2},${y + size}" 
                    fill="#1a2332" stroke="#00e5ff" stroke-width="1"
                />
                <circle cx="${x}" cy="${y}" r="3" fill="#00e5ff"/>
            `;

        case 'roller':
            // Triangle with roller circle
            return `
                <polygon 
                    points="${x},${y} ${x - size / 2},${y + size * 0.7} ${x + size / 2},${y + size * 0.7}" 
                    fill="#1a2332" stroke="#00e5ff" stroke-width="1"
                />
                <circle cx="${x}" cy="${y}" r="3" fill="#00e5ff"/>
                <circle cx="${x}" cy="${y + size * 0.85}" r="${size * 0.15}" fill="none" stroke="#00e5ff" stroke-width="1"/>
                <line x1="${x - size / 2}" y1="${y + size}" x2="${x + size / 2}" y2="${y + size}" stroke="#555" stroke-width="1"/>
            `;

        case 'free':
            return ''; // No support
    }
}

/**
 * Generate load arrow(s)
 */
function generateLoadArrows(
    loadType: 'point' | 'uniform' | 'triangular',
    x: number,
    y: number,
    width: number,
    scale: number
): string {
    const arrowSize = 8 * scale;
    const loadColor = '#f59e0b';

    switch (loadType) {
        case 'point':
            return `
                <line x1="${x}" y1="${y - 40}" x2="${x}" y2="${y}" stroke="${loadColor}" stroke-width="2"/>
                <polygon points="${x},${y} ${x - arrowSize / 2},${y - arrowSize} ${x + arrowSize / 2},${y - arrowSize}" fill="${loadColor}"/>
                <text x="${x}" y="${y - 45}" text-anchor="middle" font-size="10" fill="${loadColor}">P</text>
            `;

        case 'uniform':
            const numArrows = 7;
            const spacing = width / (numArrows - 1);
            let arrows = '';
            for (let i = 0; i < numArrows; i++) {
                const ax = x + i * spacing;
                arrows += `
                    <line x1="${ax}" y1="${y - 30}" x2="${ax}" y2="${y}" stroke="${loadColor}" stroke-width="1.5"/>
                    <polygon points="${ax},${y} ${ax - arrowSize / 3},${y - arrowSize / 1.5} ${ax + arrowSize / 3},${y - arrowSize / 1.5}" fill="${loadColor}"/>
                `;
            }
            arrows += `<line x1="${x}" y1="${y - 30}" x2="${x + width}" y2="${y - 30}" stroke="${loadColor}" stroke-width="2"/>`;
            arrows += `<text x="${x + width / 2}" y="${y - 35}" text-anchor="middle" font-size="10" fill="${loadColor}">w</text>`;
            return arrows;

        case 'triangular':
            // Triangular distributed load
            const numTriArrows = 7;
            const triSpacing = width / (numTriArrows - 1);
            let triArrows = '';
            for (let i = 0; i < numTriArrows; i++) {
                const ax = x + i * triSpacing;
                const height = 30 * (i / (numTriArrows - 1));
                triArrows += `
                    <line x1="${ax}" y1="${y - height}" x2="${ax}" y2="${y}" stroke="${loadColor}" stroke-width="1.5"/>
                    <polygon points="${ax},${y} ${ax - arrowSize / 3},${y - arrowSize / 1.5} ${ax + arrowSize / 3},${y - arrowSize / 1.5}" fill="${loadColor}"/>
                `;
            }
            triArrows += `<path d="M ${x} ${y} L ${x + width} ${y - 30}" stroke="${loadColor}" stroke-width="2" fill="none"/>`;
            return triArrows;
    }
}

/**
 * Generate complete beam SVG
 */
export function generateBeamSVG(params: BeamVisualizerParams): BeamVisualizerOutput {
    const {
        span,
        loadType,
        loadPosition = 0.5,
        supportLeft,
        supportRight,
        deflection = 0,
        stressRatio = 0,
        sectionType = 'i-beam',
    } = params;

    // Calculate dimensions
    const scale = Math.min(400 / span, 1);  // Fit in 400px width
    const L = span * scale;

    // SVG dimensions
    const padding = 60;
    const width = L + padding * 2;
    const height = 200;

    // Beam centerline
    const beamY = 100;
    const beamHeight = 20;
    const startX = padding;
    const endX = padding + L;

    const stressColor = getStressColor(stressRatio);

    // Build SVG
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`;

    // Background grid
    svg += `
        <defs>
            <pattern id="beamGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a2332" stroke-width="0.5"/>
            </pattern>
            <linearGradient id="beamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#3a4a5a"/>
                <stop offset="50%" style="stop-color:#2a3a4a"/>
                <stop offset="100%" style="stop-color:#3a4a5a"/>
            </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="#0a0e14"/>
        <rect width="${width}" height="${height}" fill="url(#beamGrid)"/>
    `;

    // Supports
    svg += generateSupport(supportLeft, startX, beamY + beamHeight / 2, scale);
    svg += generateSupport(supportRight, endX, beamY + beamHeight / 2, scale);

    // Beam body
    svg += `<rect 
        x="${startX}" y="${beamY - beamHeight / 2}" 
        width="${L}" height="${beamHeight}" 
        fill="url(#beamGradient)" stroke="${stressColor}" stroke-width="2"
        rx="2"
    />`;

    // I-beam flanges (simplified)
    if (sectionType === 'i-beam') {
        svg += `<rect x="${startX}" y="${beamY - beamHeight / 2}" width="${L}" height="4" fill="#4a5a6a"/>`;
        svg += `<rect x="${startX}" y="${beamY + beamHeight / 2 - 4}" width="${L}" height="4" fill="#4a5a6a"/>`;
    }

    // Load arrows
    const loadX = loadType === 'point' ? startX + L * loadPosition : startX;
    const loadWidth = L;
    svg += generateLoadArrows(loadType, loadX, beamY - beamHeight / 2 - 5, loadWidth, scale);

    // Deflection curve (if deflection provided)
    if (deflection > 0) {
        const deflPoints = loadType === 'uniform'
            ? generateUniformDeflectionCurve(L, deflection, 40)
            : generateDeflectionCurve(L, loadPosition, deflection, 40);

        const pathData = deflPoints.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${startX + p.x} ${beamY + p.y}`
        ).join(' ');

        svg += `<path d="${pathData}" fill="none" stroke="#00e5ff" stroke-width="2" stroke-dasharray="5,3" opacity="0.8"/>`;

        // Max deflection annotation
        const maxDeflPoint = deflPoints.reduce((max, p) => p.y > max.y ? p : max, deflPoints[0]);
        svg += `
            <line x1="${startX + maxDeflPoint.x}" y1="${beamY}" x2="${startX + maxDeflPoint.x}" y2="${beamY + maxDeflPoint.y}" 
                  stroke="#00e5ff" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="${startX + maxDeflPoint.x + 5}" y="${beamY + maxDeflPoint.y + 4}" 
                  font-size="10" fill="#00e5ff">δ=${deflection.toFixed(2)}mm</text>
        `;
    }

    // Dimension line
    svg += `
        <g stroke="#555" stroke-width="1" font-size="10" fill="#888">
            <line x1="${startX}" y1="${height - 25}" x2="${endX}" y2="${height - 25}"/>
            <line x1="${startX}" y1="${height - 30}" x2="${startX}" y2="${height - 20}"/>
            <line x1="${endX}" y1="${height - 30}" x2="${endX}" y2="${height - 20}"/>
            <text x="${(startX + endX) / 2}" y="${height - 10}" text-anchor="middle">L = ${span}mm</text>
        </g>
    `;

    svg += '</svg>';

    return {
        svg,
        viewBox: `0 0 ${width} ${height}`,
        width,
        height,
    };
}

export function generateBeamSVGElement(params: BeamVisualizerParams): string {
    const { svg } = generateBeamSVG(params);
    return svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
}
