/**
 * AluCalc OS — Gear Visualizer
 * 
 * Generates parametric SVG for spur gears with proper tooth profiles.
 * Follows ISO 53:1998 involute gear tooth geometry.
 */

// ============================================
// Types
// ============================================

export interface GearVisualizerParams {
    module: number;              // Module in mm (m = D/z)
    teeth: number;               // Number of teeth (z)
    pressureAngle?: number;      // Pressure angle in degrees (default 20°)
    profileShift?: number;       // Profile shift coefficient (x)
    faceWidth?: number;          // Face width for 3D-like rendering
    showAnnotations?: boolean;   // Show dimensions
    highlightTooth?: number;     // Index of tooth to highlight stress
    stressRatio?: number;        // 0-1 stress visualization
}

export interface GearVisualizerOutput {
    svg: string;
    viewBox: string;
    width: number;
    height: number;
    specs: GearSpecs;
}

export interface GearSpecs {
    pitchDiameter: number;       // d = m × z
    baseDiameter: number;        // db = d × cos(α)
    outsideDiameter: number;     // da = d + 2m
    rootDiameter: number;        // df = d - 2.5m
    circularPitch: number;       // p = π × m
    toothThickness: number;      // s = π × m / 2
    addendum: number;            // ha = m
    dedendum: number;            // hf = 1.25m
}

// ============================================
// Gear Geometry Calculations
// ============================================

function calculateGearSpecs(module: number, teeth: number, pressureAngle: number): GearSpecs {
    const d = module * teeth;                          // Pitch diameter
    const alpha = pressureAngle * Math.PI / 180;       // Pressure angle in radians

    return {
        pitchDiameter: d,
        baseDiameter: d * Math.cos(alpha),
        outsideDiameter: d + 2 * module,
        rootDiameter: d - 2.5 * module,
        circularPitch: Math.PI * module,
        toothThickness: Math.PI * module / 2,
        addendum: module,
        dedendum: 1.25 * module,
    };
}

/**
 * Generate involute curve points
 * The involute is the curve traced by the end of a taut string
 * as it unwinds from the base circle
 */
function generateInvolutePoint(baseRadius: number, angle: number): { x: number; y: number } {
    // Parametric involute equations
    const x = baseRadius * (Math.cos(angle) + angle * Math.sin(angle));
    const y = baseRadius * (Math.sin(angle) - angle * Math.cos(angle));
    return { x, y };
}

/**
 * Generate a single gear tooth profile
 */
function generateToothProfile(
    specs: GearSpecs,
    toothIndex: number,
    totalTeeth: number
): string {
    const { pitchDiameter, baseDiameter, outsideDiameter, rootDiameter } = specs;

    const rb = baseDiameter / 2;
    const ro = outsideDiameter / 2;
    const rf = rootDiameter / 2;

    const toothAngle = (2 * Math.PI) / totalTeeth;
    const baseAngle = toothIndex * toothAngle;

    // Generate involute points for one side of tooth
    const involutePoints: { x: number; y: number }[] = [];
    const maxParam = Math.sqrt((ro / rb) ** 2 - 1);
    const steps = 8;

    for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * maxParam;
        const point = generateInvolutePoint(rb, t);

        // Rotate to tooth position
        const rotatedX = point.x * Math.cos(baseAngle) - point.y * Math.sin(baseAngle);
        const rotatedY = point.x * Math.sin(baseAngle) + point.y * Math.cos(baseAngle);

        involutePoints.push({ x: rotatedX, y: rotatedY });
    }

    // Mirror for other side of tooth
    const toothWidth = toothAngle * 0.4; // Approximate tooth width angle
    const mirrorPoints = involutePoints.map(p => {
        const angle = Math.atan2(p.y, p.x);
        const r = Math.sqrt(p.x ** 2 + p.y ** 2);
        const newAngle = 2 * baseAngle + toothWidth - angle;
        return {
            x: r * Math.cos(newAngle),
            y: r * Math.sin(newAngle),
        };
    }).reverse();

    // Build path
    const allPoints = [...involutePoints, ...mirrorPoints];

    // Start from root
    const rootStartAngle = baseAngle - toothAngle * 0.3;
    const rootEndAngle = baseAngle + toothWidth + toothAngle * 0.3;

    let path = '';

    // Root arc start
    path += `M ${rf * Math.cos(rootStartAngle)} ${rf * Math.sin(rootStartAngle)} `;

    // Line to first involute point
    if (involutePoints.length > 0) {
        path += `L ${involutePoints[0].x} ${involutePoints[0].y} `;
    }

    // Involute curve (left side)
    for (let i = 1; i < involutePoints.length; i++) {
        path += `L ${involutePoints[i].x} ${involutePoints[i].y} `;
    }

    // Top arc
    const topAngle1 = Math.atan2(involutePoints[involutePoints.length - 1].y, involutePoints[involutePoints.length - 1].x);
    const topAngle2 = Math.atan2(mirrorPoints[0].y, mirrorPoints[0].x);
    path += `A ${ro} ${ro} 0 0 1 ${mirrorPoints[0].x} ${mirrorPoints[0].y} `;

    // Involute curve (right side - mirrored)
    for (let i = 1; i < mirrorPoints.length; i++) {
        path += `L ${mirrorPoints[i].x} ${mirrorPoints[i].y} `;
    }

    // Line back to root
    path += `L ${rf * Math.cos(rootEndAngle)} ${rf * Math.sin(rootEndAngle)} `;

    return path;
}

// ============================================
// Color Utilities
// ============================================

function getStressColor(ratio: number): string {
    if (ratio <= 0.3) return '#10b981';      // Green - safe
    if (ratio <= 0.6) return '#00e5ff';      // Cyan - nominal
    if (ratio <= 0.85) return '#f59e0b';     // Amber - warning
    return '#ef4444';                         // Red - critical
}

// ============================================
// Main Generator
// ============================================

export function generateGearSVG(params: GearVisualizerParams): GearVisualizerOutput {
    const {
        module,
        teeth,
        pressureAngle = 20,
        profileShift = 0,
        faceWidth,
        showAnnotations = true,
        highlightTooth,
        stressRatio = 0,
    } = params;

    const specs = calculateGearSpecs(module, teeth, pressureAngle);
    const { outsideDiameter, pitchDiameter, baseDiameter, rootDiameter } = specs;

    // SVG dimensions with padding
    const padding = outsideDiameter * 0.3;
    const size = outsideDiameter + padding * 2;
    const cx = size / 2;
    const cy = size / 2;

    const stressColor = getStressColor(stressRatio);

    let svg = `
        <svg xmlns="http://www.w3.org/2000/svg" 
             viewBox="0 0 ${size} ${size}" 
             width="${size}" height="${size}">
        
        <!-- Definitions -->
        <defs>
            <linearGradient id="gearGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#3a4a5a"/>
                <stop offset="50%" style="stop-color:#2a3a4a"/>
                <stop offset="100%" style="stop-color:#1a2a3a"/>
            </linearGradient>
            
            <linearGradient id="stressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:${stressColor}"/>
                <stop offset="100%" style="stop-color:#1a2a3a"/>
            </linearGradient>
            
            <filter id="gearShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
            </filter>
        </defs>
        
        <!-- Background grid -->
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1a2a3a" stroke-width="0.5"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)"/>
    `;

    // Generate gear body
    svg += `<g transform="translate(${cx}, ${cy})" filter="url(#gearShadow)">`;

    // Root circle (base of teeth)
    svg += `
        <circle cx="0" cy="0" r="${rootDiameter / 2}" 
                fill="url(#gearGradient)" stroke="#4a5a6a" stroke-width="1"/>
    `;

    // Generate all teeth
    for (let i = 0; i < teeth; i++) {
        const isHighlighted = highlightTooth !== undefined && i === highlightTooth;
        const toothPath = generateToothProfile(specs, i, teeth);

        svg += `
            <path d="${toothPath}" 
                  fill="${isHighlighted ? 'url(#stressGradient)' : 'url(#gearGradient)'}"
                  stroke="${isHighlighted ? stressColor : '#4a5a6a'}" 
                  stroke-width="${isHighlighted ? 2 : 1}"/>
        `;
    }

    // Center hub
    const hubRadius = rootDiameter / 2 * 0.4;
    svg += `
        <circle cx="0" cy="0" r="${hubRadius}" 
                fill="#0a1a2a" stroke="#3a4a5a" stroke-width="1"/>
    `;

    // Keyway
    const keyWidth = hubRadius * 0.4;
    const keyDepth = hubRadius * 0.15;
    svg += `
        <rect x="${-keyWidth / 2}" y="${-hubRadius}" 
              width="${keyWidth}" height="${keyDepth + hubRadius * 0.1}"
              fill="#0a1a2a" stroke="#3a4a5a" stroke-width="0.5"/>
    `;

    // Center bore
    svg += `
        <circle cx="0" cy="0" r="${hubRadius * 0.5}" 
                fill="#050a0f" stroke="#2a3a4a" stroke-width="0.5"/>
    `;

    svg += `</g>`;

    // Annotations
    if (showAnnotations) {
        const annotationY = size - padding / 2;
        const leftX = padding / 2;

        svg += `
            <!-- Diameter annotations -->
            <g font-family="monospace" font-size="10" fill="#a0aab4">
                <text x="${leftX}" y="${annotationY - 30}">
                    m = ${module.toFixed(1)} mm
                </text>
                <text x="${leftX}" y="${annotationY - 15}">
                    z = ${teeth}
                </text>
                <text x="${leftX}" y="${annotationY}">
                    d = ${pitchDiameter.toFixed(1)} mm
                </text>
                
                <text x="${size - leftX}" y="${annotationY - 30}" text-anchor="end">
                    da = ${outsideDiameter.toFixed(1)} mm
                </text>
                <text x="${size - leftX}" y="${annotationY - 15}" text-anchor="end">
                    db = ${baseDiameter.toFixed(1)} mm
                </text>
                <text x="${size - leftX}" y="${annotationY}" text-anchor="end">
                    α = ${pressureAngle}°
                </text>
            </g>
            
            <!-- ISO Reference -->
            <text x="${cx}" y="15" text-anchor="middle" 
                  font-family="monospace" font-size="9" fill="#00e5ff">
                ISO 53:1998 - Involute Spur Gear
            </text>
        `;

        // Diameter dimension lines
        svg += `
            <g stroke="#00e5ff" stroke-width="0.5" stroke-dasharray="4,2">
                <!-- Pitch diameter -->
                <circle cx="${cx}" cy="${cy}" r="${pitchDiameter / 2}" fill="none"/>
                
                <!-- Base diameter -->
                <circle cx="${cx}" cy="${cy}" r="${baseDiameter / 2}" fill="none" 
                        stroke="#a0aab4" stroke-dasharray="2,2"/>
            </g>
        `;
    }

    // Stress indicator
    if (stressRatio > 0) {
        const indicatorX = size - 25;
        const indicatorHeight = size - 2 * padding;
        const indicatorY = padding;
        const fillHeight = indicatorHeight * stressRatio;

        svg += `
            <rect x="${indicatorX}" y="${indicatorY}" 
                  width="15" height="${indicatorHeight}" 
                  fill="#0a1a2a" stroke="#2a3a4a" stroke-width="1" rx="2"/>
            <rect x="${indicatorX + 2}" y="${indicatorY + indicatorHeight - fillHeight}" 
                  width="11" height="${fillHeight}" 
                  fill="${stressColor}" rx="1"/>
            <text x="${indicatorX + 7.5}" y="${indicatorY + indicatorHeight + 12}" 
                  text-anchor="middle" font-size="8" fill="${stressColor}">
                ${Math.round(stressRatio * 100)}%
            </text>
        `;
    }

    svg += `</svg>`;

    return {
        svg,
        viewBox: `0 0 ${size} ${size}`,
        width: size,
        height: size,
        specs,
    };
}

export default generateGearSVG;
