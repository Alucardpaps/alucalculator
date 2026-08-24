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
    module: number;              // Normal module in mm (m)
    teeth: number;               // Number of teeth (z)
    gearTeeth?: number;          // Number of teeth for gear (z2)
    helixAngle?: number;         // Helix angle β in degrees (0 = spur)
    pressureAngle?: number;      // Pressure angle in degrees (default 20°)
    profileShift?: number;       // Profile shift coefficient (x1)
    gearShift?: number;          // Gear shift coefficient (x2)
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

function calculateGearSpecs(gearModule: number, teeth: number, pressureAngle: number): GearSpecs {
    const d = gearModule * teeth;                          // Pitch diameter
    const alpha = pressureAngle * Math.PI / 180;       // Pressure angle in radians

    return {
        pitchDiameter: d,
        baseDiameter: d * Math.cos(alpha),
        outsideDiameter: d + 2 * gearModule,
        rootDiameter: d - 2.5 * gearModule,
        circularPitch: Math.PI * gearModule,
        toothThickness: Math.PI * gearModule / 2,
        addendum: gearModule,
        dedendum: 1.25 * gearModule,
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
    totalTeeth: number,
    toothWidthParam: number // Calculated angular parameter for correct thickness
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
    // toothWidthParam = angularThickness + 2*inv(alpha)
    // Mirror Axis approx: newAngle = 2*baseAngle + toothWidthParam - angle
    const mirrorPoints = involutePoints.map(p => {
        const angle = Math.atan2(p.y, p.x);
        const r = Math.sqrt(p.x ** 2 + p.y ** 2);
        const newAngle = 2 * baseAngle + toothWidthParam - angle;
        return {
            x: r * Math.cos(newAngle),
            y: r * Math.sin(newAngle),
        };
    }).reverse();

    // Build path
    const allPoints = [...involutePoints, ...mirrorPoints];

    // Start from root
    const rootStartAngle = baseAngle - toothAngle * 0.3; // Arbitrary root spacing
    const rootEndAngle = 2 * baseAngle + toothWidthParam - rootStartAngle; // Symmetric root end

    let path = '';

    // Root arc start (approximate fillet)
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
    const endRootX = rf * Math.cos(rootEndAngle);
    const endRootY = rf * Math.sin(rootEndAngle);

    // Check reasonable closure
    path += `L ${endRootX} ${endRootY} `;

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
    // Map schema keys to visualizer params
    const mod = params.module || (params as any).m;
    const z1 = params.teeth || (params as any).z1 || 20;
    const z2 = params.gearTeeth || (params as any).z2 || 40;
    const angle = params.pressureAngle || (params as any).alpha || 20;
    const beta = params.helixAngle ?? (params as any).helixAngle ?? 0;
    const x1 = params.profileShift || (params as any).x1 || 0;
    const x2 = (params as any).x2 || 0;

    // Optional params
    const showAnnotations = params.showAnnotations !== false;
    const highlightTooth = params.highlightTooth;
    const stressRatio = params.stressRatio || 0;

    // Validation
    if (!mod || !z1 || !z2 || mod <= 0 || z1 < 3 || z2 < 3) {
        return {
            svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><text x="50" y="50" text-anchor="middle" fill="#666" font-size="10">Invalid params</text></svg>',
            viewBox: '0 0 100 100',
            width: 100,
            height: 100,
            specs: {
                pitchDiameter: 0,
                baseDiameter: 0,
                outsideDiameter: 0,
                rootDiameter: 0,
                circularPitch: 0,
                toothThickness: 0,
                addendum: 0,
                dedendum: 0,
            },
        };
    }

    const alphaRad = angle * Math.PI / 180;
    const betaRad = beta * Math.PI / 180;
    const mt = mod / Math.cos(betaRad);

    const calcSpecs = (z: number, x: number): GearSpecs => {
        const d = mt * z;
        return {
            pitchDiameter: d,
            baseDiameter: d * Math.cos(alphaRad),
            outsideDiameter: d + 2 * mod * (1 + x),
            rootDiameter: d - 2 * mod * (1.25 - x),
            circularPitch: Math.PI * mt,
            toothThickness: (Math.PI * mt / 2) + (2 * x * mod * Math.tan(alphaRad)),
            addendum: mod * (1 + x),
            dedendum: mod * (1.25 - x),
        };
    };

    const pinionSpecs = calcSpecs(z1, x1);
    const gearSpecs = calcSpecs(z2, x2);

    // Center Distance
    // Center Distance with Profile Shift
    // a = (d1 + d2) / 2 + (x1 + x2) * m
    const centerDist = (mt * (z1 + z2)) / 2 + mod * (x1 + x2);

    // Layout
    const maxRadius = Math.max(pinionSpecs.outsideDiameter, gearSpecs.outsideDiameter) / 2;
    const padding = maxRadius * 0.4;
    const width = centerDist + pinionSpecs.outsideDiameter / 2 + gearSpecs.outsideDiameter / 2 + padding * 2;
    const height = Math.max(pinionSpecs.outsideDiameter, gearSpecs.outsideDiameter) + padding * 2;

    const cy = height / 2;
    const cx1 = padding + pinionSpecs.outsideDiameter / 2;
    const cx2 = cx1 + centerDist;

    const stressColor = getStressColor(stressRatio);

    let svg = `
        <svg xmlns="http://www.w3.org/2000/svg" 
             viewBox="0 0 ${width} ${height}" 
             width="${width}" height="${height}">
        
        <defs>
            <linearGradient id="gearGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#3a4a5a"/>
                <stop offset="100%" style="stop-color:#1a2a3a"/>
            </linearGradient>
            <linearGradient id="pinionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#4a5a6a"/>
                <stop offset="100%" style="stop-color:#2a3a4a"/>
            </linearGradient>
            <filter id="gearShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
            </filter>
        </defs>
        
        <rect width="100%" height="100%" fill="#0a0e14" opacity="0"/>
    `;

    const invAlpha = Math.tan(alphaRad) - alphaRad;

    // Render Gear Helper
    const renderGear = (specs: GearSpecs, z: number, cx: number, cy: number, isPinion: boolean, rotationOffset: number) => {
        let path = '';

        // Calculate correct angular width for tooth thickness (including profile shift)
        // Angular thickness at pitch circle
        const angularThickness = specs.toothThickness / (specs.pitchDiameter / 2);
        // Param for mirror logic: W = psi + 2*inv(alpha)
        const toothWidthParam = angularThickness + 2 * invAlpha;

        // Root circle
        path += `<circle cx="${0}" cy="${0}" r="${specs.rootDiameter / 2}" />`;

        // Teeth
        for (let i = 0; i < z; i++) {
            const toothPath = generateToothProfile(specs, i, z, toothWidthParam); // Use calculated width
            path += `<path d="${toothPath}" />`;
        }

        // We need to transform the group
        const rotation = isPinion ? 0 : 180 / z + rotationOffset; // Phase shift for meshing

        // Re-using the generateToothProfile logic but applying transform in SVG group
        // Note: generateToothProfile returns 'M... L...' string.

        // Actually, let's just generate the SVG content string
        let gearSvg = `<g transform="translate(${cx}, ${cy}) rotate(${rotation})">`;

        // Hub
        gearSvg += `<circle cx="0" cy="0" r="${specs.rootDiameter / 2}" fill="url(#${isPinion ? 'pinionGradient' : 'gearGradient'})" stroke="#4a5a6a" stroke-width="1"/>`;

        for (let i = 0; i < z; i++) {
            const isHighlighted = isPinion && highlightTooth !== undefined && i === highlightTooth;
            const tp = generateToothProfile(specs, i, z, toothWidthParam);
            gearSvg += `<path d="${tp}" 
                  fill="${isHighlighted ? stressColor : `url(#${isPinion ? 'pinionGradient' : 'gearGradient'})`}"
                  stroke="${isHighlighted ? stressColor : '#4a5a6a'}" 
                  stroke-width="${isHighlighted ? 2 : 1}"/>`;
        }

        // Bore
        gearSvg += `<circle cx="0" cy="0" r="${specs.rootDiameter / 2 * 0.4}" fill="#0a1a2a" stroke="#3a4a5a" stroke-width="1"/>`;
        // Keyway
        const kw = specs.rootDiameter / 2 * 0.15;
        gearSvg += `<rect x="${-kw / 2}" y="${-specs.rootDiameter / 2 * 0.4}" width="${kw}" height="${kw}" fill="#0a1a2a"/>`;

        gearSvg += `</g>`;
        return gearSvg;
    };

    // Draw Pinion
    svg += renderGear(pinionSpecs, z1, cx1, cy, true, 0);

    // Draw Gear (Meshed)
    // Rotate gear by half a tooth pitch to mesh? 
    // Simplified meshing: rotate gear by 180/z2 to align tooth gap with pinion tooth
    svg += renderGear(gearSpecs, z2, cx2, cy, false, 180 / z2);

    if (showAnnotations) {
        svg += `
            <g font-family="monospace" font-size="10" fill="#a0aab4">
                <text x="${width / 2}" y="${height - 10}" text-anchor="middle">
                    a = ${centerDist.toFixed(2)} mm
                </text>
                <line x1="${cx1}" y1="${cy}" x2="${cx2}" y2="${cy}" stroke="#00e5ff" stroke-width="0.5" stroke-dasharray="4,2"/>
            </g>
        `;
    }

    svg += `</svg>`;

    return {
        svg,
        viewBox: `0 0 ${width} ${height}`,
        width,
        height,
        specs: pinionSpecs, // Return pinion specs as primary
    };
}

export default generateGearSVG;
