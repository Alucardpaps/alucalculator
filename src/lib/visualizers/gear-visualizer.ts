/**
 * AluCAD OS — Gear Visualizer (v5 — True Involute Production Engine)
 * 
 * Generates mathematically exact parametric SVG for spur and helical gears.
 * Strictly follows ISO 53:1998, DIN 3960, and DIN 867 standards.
 * 
 * Key Improvements:
 * - Single continuous closed polyline per gear (zero disconnected teeth, zero overlapping circles)
 * - True Involute profile + trochoidal root fillet blend (prevents CAM/CNC machining errors)
 * - 1:1 Metric Scale compatibility
 */

import {
    calculateInvoluteGearSpecs,
    generateExternalGearContour,
    generateBoreAndKeywayContour,
    pointsToSvgPath,
    generateProductionGearSvg,
    InvoluteGearParameters,
} from '@/engines/math/gear-involute-factory';

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
    boreDiameter1?: number;      // Pinion bore diameter (mm)
    boreDiameter2?: number;      // Gear bore diameter (mm)
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
    const mod = params.module || (params as any).m || 2;
    const z1 = params.teeth || (params as any).z1 || 20;
    const z2 = params.gearTeeth || (params as any).z2 || 40;
    const alpha = params.pressureAngle || (params as any).alpha || 20;
    const beta = params.helixAngle ?? (params as any).helixAngle ?? 0;
    const x1 = params.profileShift || (params as any).x1 || 0;
    const x2 = (params as any).x2 || params.gearShift || 0;

    const showAnnotations = params.showAnnotations !== false;
    const stressRatio = params.stressRatio || 0;

    // Validation
    if (!mod || !z1 || !z2 || mod <= 0 || z1 < 4 || z2 < 4) {
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

    // Compute specs using standard engine
    const pinionParams: InvoluteGearParameters = {
        module: mod,
        teeth: z1,
        pressureAngle: alpha,
        helixAngle: beta,
        profileShift: x1,
        boreDiameter: params.boreDiameter1,
    };

    const gearParams: InvoluteGearParameters = {
        module: mod,
        teeth: z2,
        pressureAngle: alpha,
        helixAngle: beta,
        profileShift: x2,
        boreDiameter: params.boreDiameter2,
    };

    const pinionSpecs = calculateInvoluteGearSpecs(pinionParams);
    const gearSpecs = calculateInvoluteGearSpecs(gearParams);

    // Working center distance (DIN 3960 / ISO 21771)
    // Uses involute function and working pressure angle for exact calculation
    const alphaRad = (alpha * Math.PI) / 180;
    const betaRad = ((beta || 0) * Math.PI) / 180;
    const cosBeta = Math.max(0.01, Math.cos(betaRad));
    const alpha_t_rad = beta > 0 ? Math.atan(Math.tan(alphaRad) / cosBeta) : alphaRad;
    
    const invFunc = (angle: number) => Math.tan(angle) - angle;
    const a_standard = (pinionSpecs.pitchDiameter + gearSpecs.pitchDiameter) / 2;
    const sumX = x1 + x2;
    const sumZ = z1 + z2;
    
    let centerDist: number;
    if (Math.abs(sumX) < 1e-6) {
        centerDist = a_standard;
    } else {
        // inv(α_wt) = inv(α_t) + 2·tan(α)·(x1+x2)/(z1+z2)
        const inv_alpha_wt = invFunc(alpha_t_rad) + (2 * Math.tan(alphaRad) * sumX) / sumZ;
        // Newton-Raphson iteration for α_wt
        let alpha_wt = alpha_t_rad + 0.05;
        for (let k = 0; k < 8; k++) {
            alpha_wt = alpha_wt - (invFunc(alpha_wt) - inv_alpha_wt) / (Math.tan(alpha_wt) ** 2);
        }
        centerDist = a_standard * Math.cos(alpha_t_rad) / Math.cos(alpha_wt);
    }

    // Viewport layout calculation
    const rTipMax = Math.max(pinionSpecs.outsideRadius, gearSpecs.outsideRadius);
    const padding = Math.max(20, rTipMax * 0.35);

    const cx1 = padding + pinionSpecs.outsideRadius;
    const cx2 = cx1 + centerDist;
    const width = Math.ceil(cx2 + gearSpecs.outsideRadius + padding);
    const height = Math.ceil(rTipMax * 2 + padding * 2);
    const cy = height / 2;

    // Generate true continuous closed contours
    const pinionPoints = generateExternalGearContour({
        ...pinionParams,
        center: { x: cx1, y: cy },
        rotationAngle: 0,
    });

    // Mesh alignment: rotate gear by (180 / z2) deg to mesh tooth space with pinion tooth
    const gearRotationDeg = 180 / z2;
    const gearPoints = generateExternalGearContour({
        ...gearParams,
        center: { x: cx2, y: cy },
        rotationAngle: gearRotationDeg,
    });

    // Bore & Keyway
    const pinionBore = generateBoreAndKeywayContour(
        { x: cx1, y: cy },
        pinionSpecs.boreDiameter,
        pinionSpecs.boreDiameter > 0,
        pinionSpecs.keyway
    );

    const gearBore = generateBoreAndKeywayContour(
        { x: cx2, y: cy },
        gearSpecs.boreDiameter,
        gearSpecs.boreDiameter > 0,
        gearSpecs.keyway
    );

    const pinionPath = pointsToSvgPath(pinionPoints);
    const gearPath = pointsToSvgPath(gearPoints);
    const pinionBorePath = pointsToSvgPath(pinionBore);
    const gearBorePath = pointsToSvgPath(gearBore);

    const stressColor = getStressColor(stressRatio);

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" 
     viewBox="0 0 ${width} ${height}" 
     width="${width}" 
     height="${height}">
    <defs>
        <linearGradient id="pinionBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1e3a5f;stop-opacity:0.9"/>
            <stop offset="100%" style="stop-color:#0b192c;stop-opacity:0.95"/>
        </linearGradient>
        <linearGradient id="gearBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#2e294e;stop-opacity:0.9"/>
            <stop offset="100%" style="stop-color:#121020;stop-opacity:0.95"/>
        </linearGradient>
        <filter id="gearGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#00e5ff" flood-opacity="0.25"/>
        </filter>
    </defs>

    <!-- Background -->
    <rect width="100%" height="100%" fill="#05080f" opacity="0.4"/>

    <!-- Centerlines -->
    <line x1="${cx1}" y1="${cy}" x2="${cx2}" y2="${cy}" stroke="#00e5ff" stroke-width="0.75" stroke-dasharray="6,3" opacity="0.6"/>
    <line x1="${cx1}" y1="${cy - pinionSpecs.outsideRadius * 1.15}" x2="${cx1}" y2="${cy + pinionSpecs.outsideRadius * 1.15}" stroke="#475569" stroke-width="0.5" stroke-dasharray="4,2"/>
    <line x1="${cx2}" y1="${cy - gearSpecs.outsideRadius * 1.15}" x2="${cx2}" y2="${cy + gearSpecs.outsideRadius * 1.15}" stroke="#475569" stroke-width="0.5" stroke-dasharray="4,2"/>

    <!-- Reference Circles (Pinion) -->
    <circle cx="${cx1}" cy="${cy}" r="${pinionSpecs.pitchRadius}" fill="none" stroke="#00e5ff" stroke-width="0.8" stroke-dasharray="5,3" opacity="0.5"/>
    <circle cx="${cx1}" cy="${cy}" r="${pinionSpecs.baseRadius}" fill="none" stroke="#f59e0b" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.4"/>
    <circle cx="${cx1}" cy="${cy}" r="${pinionSpecs.rootRadius}" fill="none" stroke="#64748b" stroke-width="0.4" stroke-dasharray="2,4" opacity="0.3"/>

    <!-- Reference Circles (Gear) -->
    <circle cx="${cx2}" cy="${cy}" r="${gearSpecs.pitchRadius}" fill="none" stroke="#c084fc" stroke-width="0.8" stroke-dasharray="5,3" opacity="0.5"/>
    <circle cx="${cx2}" cy="${cy}" r="${gearSpecs.baseRadius}" fill="none" stroke="#f59e0b" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.4"/>
    <circle cx="${cx2}" cy="${cy}" r="${gearSpecs.rootRadius}" fill="none" stroke="#64748b" stroke-width="0.4" stroke-dasharray="2,4" opacity="0.3"/>

    <!-- ═══ PINION (z1) TRUE INVOLUTE CLOSED PROFILE ═══ -->
    <g id="PINION_ASSEMBLY">
        <path d="${pinionPath}" 
              fill="url(#pinionBodyGrad)" 
              stroke="${stressRatio > 0 ? stressColor : '#38bdf8'}" 
              stroke-width="1.2" 
              stroke-linejoin="round"
              filter="url(#gearGlow)"/>
        ${pinionBorePath ? `<path d="${pinionBorePath}" fill="#05080f" stroke="#38bdf8" stroke-width="1.0"/>` : ''}
        <circle cx="${cx1}" cy="${cy}" r="2" fill="#38bdf8"/>
    </g>

    <!-- ═══ GEAR (z2) TRUE INVOLUTE CLOSED PROFILE ═══ -->
    <g id="GEAR_ASSEMBLY">
        <path d="${gearPath}" 
              fill="url(#gearBodyGrad)" 
              stroke="#c084fc" 
              stroke-width="1.2" 
              stroke-linejoin="round"/>
        ${gearBorePath ? `<path d="${gearBorePath}" fill="#05080f" stroke="#c084fc" stroke-width="1.0"/>` : ''}
        <circle cx="${cx2}" cy="${cy}" r="2" fill="#c084fc"/>
    </g>
`;

    if (showAnnotations) {
        svg += `
    <!-- Annotations & Center Distance Dimension -->
    <g font-family="monospace" font-size="10" fill="#94a3b8">
        <!-- Center Distance Callout -->
        <text x="${(cx1 + cx2) / 2}" y="${cy - 12}" text-anchor="middle" fill="#00e5ff" font-weight="bold">
            a = ${centerDist.toFixed(2)} mm
        </text>
        
        <!-- Pinion Tag -->
        <text x="${cx1}" y="${cy + pinionSpecs.outsideRadius + 18}" text-anchor="middle" fill="#38bdf8" font-size="9">
            z₁=${z1} | d₁=${pinionSpecs.pitchDiameter.toFixed(1)}mm
        </text>
        
        <!-- Gear Tag -->
        <text x="${cx2}" y="${cy + gearSpecs.outsideRadius + 18}" text-anchor="middle" fill="#c084fc" font-size="9">
            z₂=${z2} | d₂=${gearSpecs.pitchDiameter.toFixed(1)}mm
        </text>

        <!-- Ratio & Module -->
        <text x="${width / 2}" y="${height - 12}" text-anchor="middle" fill="#64748b" font-size="9">
            m=${mod} mm · i=${(z2 / z1).toFixed(2)}:1 · α=${alpha}° · ISO 53 / DIN 3960 True Involute
        </text>
    </g>
`;
    }

    svg += `</svg>`;

    return {
        svg,
        viewBox: `0 0 ${width} ${height}`,
        width,
        height,
        specs: {
            pitchDiameter: pinionSpecs.pitchDiameter,
            baseDiameter: pinionSpecs.baseDiameter,
            outsideDiameter: pinionSpecs.outsideDiameter,
            rootDiameter: pinionSpecs.rootDiameter,
            circularPitch: pinionSpecs.circularPitch,
            toothThickness: pinionSpecs.toothThicknessArc,
            addendum: mod * (1 + x1),
            dedendum: mod * (1.25 - x1),
        },
    };
}

export default generateGearSVG;
