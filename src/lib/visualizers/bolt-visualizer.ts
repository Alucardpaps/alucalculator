/**
 * AluCalc OS — Parametric Bolt Visualizer
 * 
 * Generates SVG representation of bolts based on calculation inputs.
 * Follows ISO 4762 / DIN 912 proportions.
 */

export interface BoltVisualizerParams {
    diameter: number;        // d - Major diameter (mm)
    pitch: number;           // P - Thread pitch (mm)
    length: number;          // L - Total length (mm)
    threadLength?: number;   // LT - Threaded portion (mm)
    headType?: 'hex' | 'socket' | 'countersunk' | 'button';
    showThreads?: boolean;
    stressRatio?: number;    // 0-1, for color coding
}

export interface BoltVisualizerOutput {
    svg: string;
    viewBox: string;
    width: number;
    height: number;
}

/**
 * ISO proportions for different head types
 */
const HEAD_PROPORTIONS = {
    hex: { kFactor: 0.7, sFactor: 1.7 },      // k = 0.7d, s = 1.7d
    socket: { kFactor: 1.0, sFactor: 1.5 },   // k = d, s = 1.5d
    countersunk: { kFactor: 0.5, sFactor: 2.0 },
    button: { kFactor: 0.6, sFactor: 1.8 },
};

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
 * Generate thread profile SVG path
 */
function generateThreadPath(
    x: number,
    y: number,
    height: number,
    pitch: number,
    diameter: number
): string {
    const threadDepth = pitch * 0.65;  // ISO thread depth ≈ 0.65P
    const numThreads = Math.floor(height / pitch);

    let path = `M ${x} ${y}`;

    for (let i = 0; i < numThreads; i++) {
        const tY = y + i * pitch;
        // V-profile thread
        path += ` L ${x + threadDepth} ${tY + pitch * 0.5}`;
        path += ` L ${x} ${tY + pitch}`;
    }

    return path;
}

/**
 * Generate complete bolt SVG
 */
export function generateBoltSVG(params: BoltVisualizerParams): BoltVisualizerOutput {
    const {
        diameter,
        pitch,
        length,
        threadLength = length * 0.7,
        headType = 'hex',
        showThreads = true,
        stressRatio = 0,
    } = params;

    // Calculate dimensions
    const scale = 3;  // 1mm = 3px
    const d = diameter * scale;
    const L = length * scale;
    const LT = threadLength * scale;
    const P = pitch * scale;

    const props = HEAD_PROPORTIONS[headType];
    const k = diameter * props.kFactor * scale;  // Head height
    const s = diameter * props.sFactor * scale;  // Head width

    // SVG dimensions with padding
    const padding = 20;
    const width = Math.max(s, d) + padding * 2;
    const height = k + L + padding * 2;

    // Center X
    const cx = width / 2;
    const headY = padding;
    const shankY = headY + k;
    const threadY = shankY + (L - LT);

    const stressColor = getStressColor(stressRatio);

    // Build SVG
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`;

    // Styles
    svg += `
        <defs>
            <linearGradient id="boltGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#2a3a4a"/>
                <stop offset="50%" style="stop-color:#4a5a6a"/>
                <stop offset="100%" style="stop-color:#2a3a4a"/>
            </linearGradient>
            <linearGradient id="stressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:${stressColor};stop-opacity:0.3"/>
                <stop offset="100%" style="stop-color:${stressColor};stop-opacity:0.8"/>
            </linearGradient>
        </defs>
    `;

    // Head
    switch (headType) {
        case 'hex':
            // Hex head (6-sided polygon)
            const hexPoints: string[] = [];
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 6;
                const hx = cx + (s / 2) * Math.cos(angle);
                const hy = headY + k / 2 + (s / 2) * Math.sin(angle) * 0.3; // Compress for view
                hexPoints.push(`${hx},${hy}`);
            }
            svg += `<polygon points="${hexPoints.join(' ')}" fill="url(#boltGradient)" stroke="#00e5ff" stroke-width="1"/>`;
            break;

        case 'socket':
            // Socket head (cylinder with hex socket)
            svg += `<rect x="${cx - s / 2}" y="${headY}" width="${s}" height="${k}" rx="2" fill="url(#boltGradient)" stroke="#00e5ff" stroke-width="1"/>`;
            // Hex socket
            const socketR = s * 0.35;
            const socketPoints: string[] = [];
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const sx = cx + socketR * Math.cos(angle);
                const sy = headY + k * 0.4 + socketR * Math.sin(angle) * 0.4;
                socketPoints.push(`${sx},${sy}`);
            }
            svg += `<polygon points="${socketPoints.join(' ')}" fill="#0f1419" stroke="#1a2332" stroke-width="1"/>`;
            break;

        case 'countersunk':
            // Countersunk head (cone)
            svg += `<path d="M ${cx - s / 2} ${headY} L ${cx + s / 2} ${headY} L ${cx + d / 2} ${shankY} L ${cx - d / 2} ${shankY} Z" fill="url(#boltGradient)" stroke="#00e5ff" stroke-width="1"/>`;
            // Cross slot
            svg += `<line x1="${cx - s * 0.3}" y1="${headY + k * 0.4}" x2="${cx + s * 0.3}" y2="${headY + k * 0.4}" stroke="#0f1419" stroke-width="2"/>`;
            svg += `<line x1="${cx}" y1="${headY + k * 0.2}" x2="${cx}" y2="${headY + k * 0.6}" stroke="#0f1419" stroke-width="2"/>`;
            break;

        case 'button':
            // Button head (dome)
            svg += `<ellipse cx="${cx}" cy="${shankY}" rx="${s / 2}" ry="${k}" fill="url(#boltGradient)" stroke="#00e5ff" stroke-width="1"/>`;
            break;
    }

    // Shank (unthreaded portion)
    const shankLength = L - LT;
    if (shankLength > 0) {
        svg += `<rect x="${cx - d / 2}" y="${shankY}" width="${d}" height="${shankLength}" fill="url(#boltGradient)" stroke="#00e5ff" stroke-width="1"/>`;
    }

    // Threaded portion
    svg += `<rect x="${cx - d / 2}" y="${threadY}" width="${d}" height="${LT}" fill="url(#stressGradient)" stroke="${stressColor}" stroke-width="1"/>`;

    // Thread lines (simplified visualization)
    if (showThreads && P > 2) {
        const numThreads = Math.floor(LT / P);
        svg += `<g stroke="#00e5ff" stroke-width="0.5" opacity="0.6">`;
        for (let i = 0; i < numThreads; i++) {
            const ty = threadY + i * P;
            svg += `<line x1="${cx - d / 2}" y1="${ty}" x2="${cx + d / 2}" y2="${ty + P * 0.5}"/>`;
            svg += `<line x1="${cx + d / 2}" y1="${ty + P * 0.5}" x2="${cx - d / 2}" y2="${ty + P}"/>`;
        }
        svg += `</g>`;
    }

    // Dimension annotations
    svg += `
        <g font-family="monospace" font-size="10" fill="#888">
            <text x="${width - 5}" y="${shankY + L / 2}" text-anchor="end">L=${length}mm</text>
            <text x="${width - 5}" y="${shankY + 12}" text-anchor="end">d=${diameter}mm</text>
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

/**
 * Generate React-compatible SVG element string
 */
export function generateBoltSVGElement(params: BoltVisualizerParams): string {
    const { svg } = generateBoltSVG(params);
    // Strip the outer svg tags for React dangerouslySetInnerHTML
    return svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
}
