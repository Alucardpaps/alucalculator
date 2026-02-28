/**
 * 🏛️ ALUCALCULATOR ENGINE - MATH - INVOLUTE
 * "The Gear Kernel"
 * Compliance: DIN 3960
 */

export interface Point {
    x: number;
    y: number;
}

export interface InvoluteParams {
    module: number;
    teeth: number;
    pressureAngleDeg: number;
    profileShift: number; // x
}

export interface GearGeometry {
    pitchDiameter: number;
    baseDiameter: number;
    rootDiameter: number;
    tipDiameter: number;
    flank: Point[];
    warnings: string[];
}

export class InvoluteEngine {

    static compute(params: InvoluteParams): GearGeometry {
        const { module, teeth, pressureAngleDeg, profileShift } = params;

        // Convert pressure angle to radians
        const alpha = pressureAngleDeg * (Math.PI / 180);

        // Standard basic rack values (ISO 53)
        const haP = 1.0; // Addendum coefficient
        const hfP = 1.25; // Dedendum coefficient

        // 1. Pitch Diameter (d)
        const d = module * teeth;

        // 2. Base Diameter (db)
        const db = d * Math.cos(alpha);

        // 3. Tip Diameter (da) - with profile shift
        const da = d + 2 * module * (haP + profileShift);

        // 4. Root Diameter (df) - with profile shift
        const df = d - 2 * module * (hfP - profileShift);

        const warnings: string[] = [];

        // Undercut Check
        // Minimum teeth to avoid undercut without shift: z_min = 2/sin^2(alpha)
        // For alpha=20, z_min ~= 17.
        const zMin = 2 / Math.pow(Math.sin(alpha), 2);
        if (teeth < zMin && profileShift === 0) {
            warnings.push(`Undercut detected! Teeth (${teeth}) < Critical limit (${Math.ceil(zMin)}).`);
        }

        // Generate Flank Points (Involute Curve)
        // Inv(alpha) = tan(alpha) - alpha
        // We iterate from base circle up to tip circle
        const flank: Point[] = [];
        const rb = db / 2;
        const ra = da / 2;

        // Start parameter t (roll angle)
        // At base circle, t = 0 implies r = rb.
        // At tip circle: r = ra. 
        // r = rb / cos(alpha_x) -> cos(alpha_x) = rb/r
        // Check if base circle is larger than root. Valid involute starts at Base Circle.

        const startRadius = Math.max(rb, df / 2);
        const endRadius = ra;

        const steps = 20;

        for (let i = 0; i <= steps; i++) {
            // Paramterize by radius r
            const r = startRadius + (endRadius - startRadius) * (i / steps);

            // Ensure r is valid (cannot be < rb)
            if (r < rb) continue;

            // pressure angle at radius r: cos(alpha_r) = rb / r
            const val = rb / r;
            // clamp for safety
            const alpha_r = Math.acos(Math.min(1, Math.max(-1, val)));

            // Involute function: inv(a) = tan(a) - a
            const inv_alpha = Math.tan(alpha_r) - alpha_r;

            // Polar coordinate theta (relative to tooth center or start of involute)
            // Let's just generate the standard involute curve from x-axis:
            // x = rb * (cos t + t sin t)
            // y = rb * (sin t - t cos t)
            // where t is the roll angle = tan(alpha_r)

            const t = Math.tan(alpha_r);

            const x = rb * (Math.cos(t) + t * Math.sin(t));
            const y = rb * (Math.sin(t) - t * Math.cos(t));

            flank.push({ x, y });
        }

        return {
            pitchDiameter: d,
            baseDiameter: db,
            rootDiameter: df,
            tipDiameter: da,
            flank,
            warnings
        };
    }
}
