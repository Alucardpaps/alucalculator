/**
 * AluCalc OS — Parametric Pipe/Fluid Visualizer
 * 
 * Generates SVG representation of pipe cross-sections and flow diagrams.
 * Shows velocity profile, pressure gradients, and Reynolds number regime.
 */

export interface PipeVisualizerParams {
    diameter: number;          // D - Internal diameter (mm)
    wallThickness?: number;    // t - Wall thickness (mm)
    velocity: number;          // V - Flow velocity (m/s)
    reynoldsNumber: number;    // Re
    pressureDrop?: number;     // ΔP - Pressure drop (Pa)
    length?: number;           // L - Pipe length for diagram (mm)
    flowRegime?: 'laminar' | 'transitional' | 'turbulent';
    showVelocityProfile?: boolean;
}

export interface PipeVisualizerOutput {
    svg: string;
    viewBox: string;
    width: number;
    height: number;
}

/**
 * Get flow regime color
 */
function getFlowColor(regime: 'laminar' | 'transitional' | 'turbulent'): string {
    switch (regime) {
        case 'laminar': return '#00e5ff';      // Cyan - smooth
        case 'transitional': return '#ffc107'; // Amber - warning
        case 'turbulent': return '#ff5722';    // Orange - turbulent
    }
}

/**
 * Determine flow regime from Reynolds number
 */
function determineFlowRegime(re: number): 'laminar' | 'transitional' | 'turbulent' {
    if (re < 2300) return 'laminar';
    if (re < 4000) return 'transitional';
    return 'turbulent';
}

/**
 * Generate velocity profile for laminar flow (parabolic)
 */
function generateLaminarProfile(
    centerX: number,
    centerY: number,
    radius: number,
    maxVelocity: number,
    numPoints: number = 20
): string {
    const points: { x: number; y: number }[] = [];

    // Generate profile from top to bottom
    for (let i = 0; i <= numPoints; i++) {
        const r = radius * (1 - 2 * Math.abs(i / numPoints - 0.5));
        const y = centerY - radius + (i / numPoints) * 2 * radius;
        // Parabolic velocity: V(r) = Vmax * (1 - (r/R)²)
        const rRatio = (y - centerY) / radius;
        const vRatio = 1 - rRatio * rRatio;
        const x = centerX + vRatio * maxVelocity;
        points.push({ x, y });
    }

    // Create path
    return points.map((p, i) =>
        `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');
}

/**
 * Generate turbulent velocity profile (flatter)
 */
function generateTurbulentProfile(
    centerX: number,
    centerY: number,
    radius: number,
    maxVelocity: number,
    numPoints: number = 20
): string {
    const points: { x: number; y: number }[] = [];

    for (let i = 0; i <= numPoints; i++) {
        const y = centerY - radius + (i / numPoints) * 2 * radius;
        const rRatio = Math.abs(y - centerY) / radius;
        // Power law profile: V(r) = Vmax * (1 - r/R)^(1/7)
        const vRatio = Math.pow(1 - rRatio, 1 / 7);
        const x = centerX + vRatio * maxVelocity;
        points.push({ x, y });
    }

    return points.map((p, i) =>
        `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');
}

/**
 * Generate flow arrows
 */
function generateFlowArrows(
    startX: number,
    endX: number,
    centerY: number,
    radius: number,
    regime: 'laminar' | 'transitional' | 'turbulent'
): string {
    const color = getFlowColor(regime);
    const numArrows = regime === 'turbulent' ? 8 : 5;
    let arrows = '';

    const spacing = (endX - startX) / (numArrows + 1);

    for (let i = 1; i <= numArrows; i++) {
        const x = startX + i * spacing;

        // Main centerline arrow
        arrows += `
            <line x1="${x - 10}" y1="${centerY}" x2="${x + 5}" y2="${centerY}" 
                  stroke="${color}" stroke-width="2"/>
            <polygon points="${x + 8},${centerY} ${x + 2},${centerY - 4} ${x + 2},${centerY + 4}" 
                     fill="${color}"/>
        `;

        // Turbulent eddies
        if (regime === 'turbulent' && i % 2 === 0) {
            const eddyY = centerY + (Math.random() - 0.5) * radius * 1.2;
            arrows += `
                <circle cx="${x}" cy="${eddyY}" r="4" fill="none" stroke="${color}" 
                        stroke-width="1" opacity="0.5"/>
            `;
        }
    }

    return arrows;
}

/**
 * Generate complete pipe visualization SVG
 */
export function generatePipeSVG(params: PipeVisualizerParams): PipeVisualizerOutput {
    const {
        diameter,
        wallThickness = diameter * 0.1,
        velocity,
        reynoldsNumber,
        pressureDrop,
        length = 300,
        showVelocityProfile = true,
    } = params;

    const flowRegime = params.flowRegime || determineFlowRegime(reynoldsNumber);
    const flowColor = getFlowColor(flowRegime);

    // Calculate dimensions
    const scale = Math.min(80 / diameter, 2);
    const D = diameter * scale;
    const t = wallThickness * scale;
    const L = Math.min(length * scale * 0.3, 350);

    // SVG dimensions
    const padding = 40;
    const width = L + padding * 2 + 100; // Extra space for profile
    const height = D + t * 2 + padding * 2 + 60;

    // Pipe center
    const centerY = height / 2;
    const startX = padding;
    const endX = padding + L;

    // Build SVG
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`;

    // Background and defs
    svg += `
        <defs>
            <linearGradient id="pipeWall" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#4a5a6a"/>
                <stop offset="50%" style="stop-color:#2a3a4a"/>
                <stop offset="100%" style="stop-color:#4a5a6a"/>
            </linearGradient>
            <linearGradient id="fluidGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:${flowColor};stop-opacity:0.3"/>
                <stop offset="50%" style="stop-color:${flowColor};stop-opacity:0.5"/>
                <stop offset="100%" style="stop-color:${flowColor};stop-opacity:0.3"/>
            </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="#0a0e14"/>
    `;

    // Pipe walls (top and bottom)
    svg += `
        <rect x="${startX}" y="${centerY - D / 2 - t}" width="${L}" height="${t}" fill="url(#pipeWall)" stroke="#555" stroke-width="1"/>
        <rect x="${startX}" y="${centerY + D / 2}" width="${L}" height="${t}" fill="url(#pipeWall)" stroke="#555" stroke-width="1"/>
    `;

    // Pipe inlet (left cap)
    svg += `
        <rect x="${startX - 5}" y="${centerY - D / 2 - t}" width="10" height="${D + t * 2}" fill="#3a4a5a" stroke="#555" stroke-width="1"/>
    `;

    // Pipe outlet (right cap)
    svg += `
        <rect x="${endX - 5}" y="${centerY - D / 2 - t}" width="10" height="${D + t * 2}" fill="#3a4a5a" stroke="#555" stroke-width="1"/>
    `;

    // Fluid region
    svg += `
        <rect x="${startX}" y="${centerY - D / 2}" width="${L}" height="${D}" fill="url(#fluidGradient)"/>
    `;

    // Flow arrows
    svg += generateFlowArrows(startX, endX, centerY, D / 2, flowRegime);

    // Velocity profile (side view)
    if (showVelocityProfile) {
        const profileX = endX + 30;
        const profileWidth = 50;

        // Profile box
        svg += `
            <rect x="${profileX}" y="${centerY - D / 2}" width="${profileWidth}" height="${D}" 
                  fill="none" stroke="#555" stroke-width="1" stroke-dasharray="3,2"/>
            <text x="${profileX + profileWidth / 2}" y="${centerY - D / 2 - 8}" 
                  text-anchor="middle" font-size="9" fill="#888">Velocity</text>
        `;

        // Profile curve
        const profile = flowRegime === 'turbulent'
            ? generateTurbulentProfile(profileX, centerY, D / 2 - 2, profileWidth * 0.8)
            : generateLaminarProfile(profileX, centerY, D / 2 - 2, profileWidth * 0.8);

        svg += `<path d="${profile}" fill="none" stroke="${flowColor}" stroke-width="2"/>`;

        // Vmax annotation
        svg += `
            <line x1="${profileX}" y1="${centerY}" x2="${profileX + profileWidth * 0.8}" y2="${centerY}" 
                  stroke="${flowColor}" stroke-width="1" stroke-dasharray="2,2" opacity="0.5"/>
            <text x="${profileX + profileWidth * 0.9}" y="${centerY + 4}" 
                  font-size="8" fill="${flowColor}">Vmax</text>
        `;
    }

    // Annotations
    svg += `
        <g font-family="monospace" font-size="10" fill="#888">
            <text x="${startX}" y="${height - 15}">D = ${diameter}mm</text>
            <text x="${startX + 80}" y="${height - 15}">V = ${velocity.toFixed(2)} m/s</text>
            <text x="${startX + 170}" y="${height - 15}">Re = ${reynoldsNumber.toFixed(0)}</text>
        </g>
    `;

    // Flow regime badge
    svg += `
        <rect x="${width - 85}" y="10" width="75" height="22" rx="4" 
              fill="${flowColor}" opacity="0.2" stroke="${flowColor}" stroke-width="1"/>
        <text x="${width - 47}" y="25" text-anchor="middle" font-size="10" fill="${flowColor}" 
              font-weight="bold">${flowRegime.toUpperCase()}</text>
    `;

    // Pressure drop indicator (if provided)
    if (pressureDrop !== undefined) {
        svg += `
            <text x="${(startX + endX) / 2}" y="20" text-anchor="middle" font-size="10" fill="#f59e0b">
                ΔP = ${pressureDrop.toFixed(0)} Pa
            </text>
            <line x1="${startX + 20}" y1="15" x2="${endX - 20}" y2="15" 
                  stroke="#f59e0b" stroke-width="1" marker-end="url(#arrowhead)"/>
        `;
    }

    svg += '</svg>';

    return {
        svg,
        viewBox: `0 0 ${width} ${height}`,
        width,
        height,
    };
}

export function generatePipeSVGElement(params: PipeVisualizerParams): string {
    const { svg } = generatePipeSVG(params);
    return svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
}
