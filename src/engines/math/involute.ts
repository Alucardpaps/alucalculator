/**
 * AluCalculator Engineering Kernel — True Involute Math Engine
 * 
 * MATHEMATICAL CORE — NO UI, NO THREE.JS, PURE GEOMETRY
 * 
 * Standards: DIN 3960, ISO 21771
 * 
 * This module generates mathematically accurate involute gear tooth profiles
 * suitable for CNC manufacturing (DXF/STEP export).
 * 
 * CRITICAL: This file MUST remain UI-agnostic. It produces {x, y} points only.
 */

// ============================================
// TYPES
// ============================================

export interface Point2D {
    x: number;
    y: number;
}

export interface GearParameters {
    module: number;           // m (mm) - tooth size
    teethCount: number;       // z - number of teeth
    pressureAngle: number;    // α (degrees) - typically 20°
    profileShift: number;     // x - profile shift coefficient (0 = standard)
    addendumCoeff: number;    // ha* - typically 1.0
    dedendumCoeff: number;    // hf* - typically 1.25
    clearanceCoeff: number;   // c* - typically 0.25
    faceWidth?: number;       // b (mm) - for 3D extrusion
}

export interface GearGeometry {
    // Fundamental circles
    pitchRadius: number;      // r = m*z/2
    baseRadius: number;       // r_b = r * cos(α)
    addendumRadius: number;   // r_a = r + m * ha*
    dedendumRadius: number;   // r_f = r - m * hf*

    // Tooth geometry
    toothThicknessArc: number;    // s (arc length at pitch circle)
    toothSpaceArc: number;        // e (arc length at pitch circle)

    // Warnings
    undercutRisk: boolean;
    undercutMessage?: string;

    // Profile
    singleToothProfile: Point2D[];  // One complete tooth (left + right flank)
    fullGearContour: Point2D[];     // All teeth, closed polyline
}

// ============================================
// CONSTANTS
// ============================================

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

// Minimum teeth to avoid undercut (DIN 3960)
const UNDERCUT_LIMITS: Record<number, number> = {
    14.5: 32,  // 14.5° pressure angle
    20: 17,   // 20° pressure angle (standard)
    25: 14,   // 25° pressure angle
};

// ============================================
// CORE INVOLUTE FUNCTIONS
// ============================================

/**
 * Involute function: inv(α) = tan(α) - α
 * This is the fundamental function for gear geometry
 */
export function involuteFunction(angleRad: number): number {
    return Math.tan(angleRad) - angleRad;
}

/**
 * Inverse involute function (Newton-Raphson approximation)
 * Given inv(α), find α
 */
export function inverseInvolute(invValue: number, tolerance: number = 1e-10): number {
    // Initial guess using approximation
    let alpha = Math.pow(3 * invValue, 1 / 3);

    // Newton-Raphson iteration
    for (let i = 0; i < 50; i++) {
        const f = Math.tan(alpha) - alpha - invValue;
        const fPrime = Math.tan(alpha) * Math.tan(alpha); // sec²(α) - 1 = tan²(α)

        if (Math.abs(fPrime) < 1e-15) break;

        const alphaNew = alpha - f / fPrime;

        if (Math.abs(alphaNew - alpha) < tolerance) {
            return alphaNew;
        }
        alpha = alphaNew;
    }

    return alpha;
}

/**
 * Generate a single point on the involute curve
 * 
 * Parametric equations:
 *   x(t) = r_b * (cos(t) + t * sin(t))
 *   y(t) = r_b * (sin(t) - t * cos(t))
 * 
 * Where t is the involute parameter (roll angle)
 */
export function involutePoint(baseRadius: number, t: number): Point2D {
    return {
        x: baseRadius * (Math.cos(t) + t * Math.sin(t)),
        y: baseRadius * (Math.sin(t) - t * Math.cos(t)),
    };
}

/**
 * Generate involute curve from base circle to tip circle
 * 
 * @param baseRadius - Base circle radius (r_b)
 * @param startRadius - Starting radius (usually base or root)
 * @param endRadius - Ending radius (addendum circle)
 * @param numPoints - Number of points to generate
 * @returns Array of points along the involute
 */
export function generateInvoluteCurve(
    baseRadius: number,
    startRadius: number,
    endRadius: number,
    numPoints: number = 50
): Point2D[] {
    const points: Point2D[] = [];

    // Calculate t parameters for start and end radii
    // r = r_b * sqrt(1 + t²)  →  t = sqrt((r/r_b)² - 1)
    const tStart = startRadius <= baseRadius ? 0 : Math.sqrt((startRadius / baseRadius) ** 2 - 1);
    const tEnd = Math.sqrt((endRadius / baseRadius) ** 2 - 1);

    for (let i = 0; i < numPoints; i++) {
        const t = tStart + (tEnd - tStart) * (i / (numPoints - 1));
        points.push(involutePoint(baseRadius, t));
    }

    return points;
}

// ============================================
// GEAR GEOMETRY CALCULATOR
// ============================================

/**
 * Calculate all gear geometry from input parameters
 * This is the main entry point for gear calculations
 */
export function calculateGearGeometry(params: GearParameters): GearGeometry {
    const {
        module: m,
        teethCount: z,
        pressureAngle: alphaDeg,
        profileShift: x,
        addendumCoeff: haStar,
        dedendumCoeff: hfStar,
    } = params;

    const alpha = alphaDeg * DEG_TO_RAD;

    // Fundamental radii
    const pitchRadius = (m * z) / 2;
    const baseRadius = pitchRadius * Math.cos(alpha);
    const addendumRadius = pitchRadius + m * (haStar + x);
    const dedendumRadius = pitchRadius - m * (hfStar - x);

    // Tooth thickness at pitch circle (DIN 3960)
    // s = m * (π/2 + 2*x*tan(α))
    const toothThicknessArc = m * (Math.PI / 2 + 2 * x * Math.tan(alpha));
    const toothSpaceArc = m * Math.PI - toothThicknessArc;

    // Undercut detection
    const undercutLimit = UNDERCUT_LIMITS[alphaDeg] || 17;
    const minTeethNoUndercut = undercutLimit - 2 * x / (Math.sin(alpha) ** 2);
    const undercutRisk = z < minTeethNoUndercut && x <= 0;

    let undercutMessage: string | undefined;
    if (undercutRisk) {
        undercutMessage = `UNDERCUT WARNING: z=${z} < ${Math.ceil(minTeethNoUndercut)} minimum for α=${alphaDeg}°. ` +
            `Use profile shift x ≥ ${((minTeethNoUndercut - z) * Math.sin(alpha) ** 2 / 2).toFixed(2)} to avoid.`;
    }

    // Generate tooth profile
    const singleToothProfile = generateSingleToothProfile(
        baseRadius,
        dedendumRadius,
        addendumRadius,
        pitchRadius,
        toothThicknessArc,
        z,
        alpha
    );

    // Generate full gear contour
    const fullGearContour = generateFullGearContour(singleToothProfile, z);

    return {
        pitchRadius,
        baseRadius,
        addendumRadius,
        dedendumRadius,
        toothThicknessArc,
        toothSpaceArc,
        undercutRisk,
        undercutMessage,
        singleToothProfile,
        fullGearContour,
    };
}

// ============================================
// TOOTH PROFILE GENERATION
// ============================================

/**
 * Generate a single tooth profile (both flanks + root + tip)
 * This produces a closed contour for one tooth
 */
function generateSingleToothProfile(
    baseRadius: number,
    rootRadius: number,
    tipRadius: number,
    pitchRadius: number,
    toothThickness: number,
    teethCount: number,
    pressureAngle: number
): Point2D[] {
    const points: Point2D[] = [];
    const numPoints = 40; // Points per flank

    // Angular pitch
    const angularPitch = (2 * Math.PI) / teethCount;

    // Half tooth angle at pitch circle
    const halfToothAngle = toothThickness / (2 * pitchRadius);

    // Involute start angle offset
    const invAlpha = involuteFunction(pressureAngle);

    // === RIGHT FLANK (from root to tip) ===
    const startRadius = Math.max(rootRadius, baseRadius);
    const rightFlank = generateInvoluteCurve(baseRadius, startRadius, tipRadius, numPoints);

    // Rotate right flank to correct position
    // The involute naturally starts at angle = invAlpha from the base circle tangent
    const rightAngleOffset = halfToothAngle + invAlpha;

    rightFlank.forEach(p => {
        const rotated = rotatePoint(p, rightAngleOffset);
        points.push(rotated);
    });

    // === TIP ARC ===
    // Connect right flank tip to left flank tip
    const tipArcPoints = 5;
    const rightTipAngle = Math.atan2(points[points.length - 1].y, points[points.length - 1].x);
    const leftTipAngle = angularPitch - rightTipAngle;

    for (let i = 1; i < tipArcPoints; i++) {
        const angle = rightTipAngle + (leftTipAngle - rightTipAngle) * (i / tipArcPoints);
        points.push({
            x: tipRadius * Math.cos(angle),
            y: tipRadius * Math.sin(angle),
        });
    }

    // === LEFT FLANK (from tip to root, mirrored) ===
    const leftFlank = generateInvoluteCurve(baseRadius, startRadius, tipRadius, numPoints);
    const leftAngleOffset = angularPitch - halfToothAngle - invAlpha;

    // Add in reverse order (tip to root)
    for (let i = leftFlank.length - 1; i >= 0; i--) {
        // Mirror across Y axis then rotate
        const mirrored = { x: leftFlank[i].x, y: -leftFlank[i].y };
        const rotated = rotatePoint(mirrored, leftAngleOffset);
        points.push(rotated);
    }

    // === ROOT FILLET ===
    // Connect back to start with root circle arc
    if (rootRadius < baseRadius) {
        const rootArcPoints = 3;
        const leftRootAngle = Math.atan2(points[points.length - 1].y, points[points.length - 1].x);
        const rightRootAngle = Math.atan2(points[0].y, points[0].x);

        // Go the "short way" around the root
        for (let i = 1; i < rootArcPoints; i++) {
            const angle = leftRootAngle + (rightRootAngle + angularPitch - leftRootAngle) * (i / rootArcPoints);
            points.push({
                x: rootRadius * Math.cos(angle),
                y: rootRadius * Math.sin(angle),
            });
        }
    }

    return points;
}

/**
 * Generate full gear contour by replicating single tooth
 */
function generateFullGearContour(singleTooth: Point2D[], teethCount: number): Point2D[] {
    const fullContour: Point2D[] = [];
    const angularPitch = (2 * Math.PI) / teethCount;

    for (let tooth = 0; tooth < teethCount; tooth++) {
        const angle = tooth * angularPitch;

        singleTooth.forEach(p => {
            fullContour.push(rotatePoint(p, angle));
        });
    }

    // Close the contour
    if (fullContour.length > 0) {
        fullContour.push({ ...fullContour[0] });
    }

    return fullContour;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Rotate a point around origin
 */
function rotatePoint(p: Point2D, angleRad: number): Point2D {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    return {
        x: p.x * cos - p.y * sin,
        y: p.x * sin + p.y * cos,
    };
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Point2D, p2: Point2D): number {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

/**
 * Simplify polyline using Douglas-Peucker algorithm
 * (Reduces point count for CNC-friendly output)
 */
export function simplifyPolyline(points: Point2D[], tolerance: number): Point2D[] {
    if (points.length < 3) return points;

    // Find point with maximum distance from line between first and last
    let maxDist = 0;
    let maxIndex = 0;

    const first = points[0];
    const last = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
        const dist = perpendicularDistance(points[i], first, last);
        if (dist > maxDist) {
            maxDist = dist;
            maxIndex = i;
        }
    }

    // If max distance is greater than tolerance, split and recurse
    if (maxDist > tolerance) {
        const left = simplifyPolyline(points.slice(0, maxIndex + 1), tolerance);
        const right = simplifyPolyline(points.slice(maxIndex), tolerance);
        return [...left.slice(0, -1), ...right];
    }

    return [first, last];
}

function perpendicularDistance(point: Point2D, lineStart: Point2D, lineEnd: Point2D): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lineLengthSq = dx * dx + dy * dy;

    if (lineLengthSq === 0) return distance(point, lineStart);

    const t = Math.max(0, Math.min(1,
        ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lineLengthSq
    ));

    const projection = {
        x: lineStart.x + t * dx,
        y: lineStart.y + t * dy,
    };

    return distance(point, projection);
}

// ============================================
// VALIDATION
// ============================================

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    canExport: boolean;
}

export function validateGearParameters(params: GearParameters): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Module validation
    if (params.module <= 0) {
        errors.push('Module must be positive');
    } else if (params.module < 0.5) {
        warnings.push('Module < 0.5mm may be difficult to manufacture');
    }

    // Teeth count validation
    if (params.teethCount < 6) {
        errors.push('Minimum 6 teeth required for valid involute');
    }

    // Pressure angle validation
    if (params.pressureAngle < 10 || params.pressureAngle > 30) {
        errors.push('Pressure angle must be between 10° and 30°');
    }

    // Undercut check
    const undercutLimit = UNDERCUT_LIMITS[params.pressureAngle] || 17;
    if (params.teethCount < undercutLimit && params.profileShift <= 0) {
        warnings.push(
            `Undercut risk: z=${params.teethCount} < ${undercutLimit} for α=${params.pressureAngle}°. ` +
            `Consider profile shift x ≥ ${((undercutLimit - params.teethCount) * 0.05).toFixed(2)}`
        );
    }

    // Tip/root interference
    const pitchRadius = (params.module * params.teethCount) / 2;
    const dedendumRadius = pitchRadius - params.module * (params.dedendumCoeff - params.profileShift);
    const baseRadius = pitchRadius * Math.cos(params.pressureAngle * DEG_TO_RAD);

    if (dedendumRadius < baseRadius * 0.9) {
        warnings.push('Root circle approaches base circle — verify manufacturing feasibility');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        canExport: errors.length === 0,
    };
}

// ============================================
// DEFAULT PARAMETERS
// ============================================

export const DEFAULT_GEAR_PARAMS: GearParameters = {
    module: 2,
    teethCount: 20,
    pressureAngle: 20,
    profileShift: 0,
    addendumCoeff: 1.0,
    dedendumCoeff: 1.25,
    clearanceCoeff: 0.25,
    faceWidth: 10,
};
