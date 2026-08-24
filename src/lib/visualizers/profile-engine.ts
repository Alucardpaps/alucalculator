/**
 * AluCalculator V2 — Dynamic Beam Profile Engine
 * 
 * Generates 2D parametric SVG and 3D STEP data for standard profiles.
 */

import { Point2D } from '@/engines/math/involute';

export type ProfileType = 'I' | 'BOX' | 'CHANNEL' | 'ANGLE';

export interface ProfileDimensions {
    type: ProfileType;
    height: number;
    width: number;
    webThickness: number;
    flangeThickness: number;
    length: number;
}

/**
 * Generates a 2D contour (points) for a given profile type.
 */
export function getProfileContour(dims: ProfileDimensions): Point2D[] {
    const { type, height: h, width: w, webThickness: tw, flangeThickness: tf } = dims;
    const pts: Point2D[] = [];

    switch (type) {
        case 'I': {
            // Top flange
            pts.push({ x: -w / 2, y: h / 2 });
            pts.push({ x: w / 2, y: h / 2 });
            pts.push({ x: w / 2, y: h / 2 - tf });
            pts.push({ x: tw / 2, y: h / 2 - tf });
            // Web
            pts.push({ x: tw / 2, y: -h / 2 + tf });
            // Bottom flange
            pts.push({ x: w / 2, y: -h / 2 + tf });
            pts.push({ x: w / 2, y: -h / 2 });
            pts.push({ x: -w / 2, y: -h / 2 });
            pts.push({ x: -w / 2, y: -h / 2 + tf });
            pts.push({ x: -tw / 2, y: -h / 2 + tf });
            // Web
            pts.push({ x: -tw / 2, y: h / 2 - tf });
            pts.push({ x: -w / 2, y: h / 2 - tf });
            break;
        }
        case 'BOX': {
            // Outer
            pts.push({ x: -w / 2, y: -h / 2 });
            pts.push({ x: w / 2, y: -h / 2 });
            pts.push({ x: w / 2, y: h / 2 });
            pts.push({ x: -w / 2, y: h / 2 });
            pts.push({ x: -w / 2, y: -h / 2 });
            // Inner (simplification for visualization)
            // Note: For a true hollow STEP, we need two loops. 
            // For now, we return outer contour, and handling inner in STEP is complex.
            break;
        }
        case 'CHANNEL': {
            pts.push({ x: 0, y: 0 });
            pts.push({ x: w, y: 0 });
            pts.push({ x: w, y: tf });
            pts.push({ x: tw, y: tf });
            pts.push({ x: tw, y: h - tf });
            pts.push({ x: w, y: h - tf });
            pts.push({ x: w, y: h });
            pts.push({ x: 0, y: h });
            break;
        }
        case 'ANGLE': {
            pts.push({ x: 0, y: 0 });
            pts.push({ x: w, y: 0 });
            pts.push({ x: w, y: tf });
            pts.push({ x: tw, y: tf });
            pts.push({ x: tw, y: h });
            pts.push({ x: 0, y: h });
            break;
        }
    }

    return pts;
}

/**
 * Generates an SVG representation of the profile.
 */
export function generateProfileSVG(dims: ProfileDimensions): string {
    const pts = getProfileContour(dims);
    const padding = 20;
    const viewBox = `${-dims.width / 2 - padding} ${-dims.height / 2 - padding} ${dims.width + padding * 2} ${dims.height + padding * 2}`;

    const pathData = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${-p.y}`).join(' ') + ' Z';

    return `
        <path 
            d="${pathData}" 
            fill="none" 
            stroke="#00e5ff" 
            stroke-width="2" 
            stroke-linejoin="round"
        />
        <circle cx="0" cy="0" r="3" fill="#ff9500" /> <!-- Neutral Axis -->
    `;
}

/**
 * Calculate Second Moment of Area (Ix) for standard profiles
 */
export function calculateIx(dims: ProfileDimensions): number {
    const { type, height: h, width: b, webThickness: tw, flangeThickness: tf } = dims;

    switch (type) {
        case 'I': {
            // Ix = (B*H^3 / 12) - (B-tw)*(H-2*tf)^3 / 12
            return (b * Math.pow(h, 3) / 12) - ((b - tw) * Math.pow(h - 2 * tf, 3) / 12);
        }
        case 'BOX': {
            const innerH = h - 2 * tf;
            const innerB = b - 2 * tw;
            return (b * Math.pow(h, 3) / 12) - (innerB * Math.pow(innerH, 3) / 12);
        }
        case 'ANGLE': {
            // Simplified approximation for L-profile
            // Ix = [tw*h^3 + b*tf^3]/3 ??? No, use parallel axis theorem properly if needed.
            // Let's use simplified rectangles:
            const area1 = h * tw;
            const area2 = (b - tw) * tf;
            const y1 = h / 2;
            const y2 = tf / 2;
            const y_cg = (area1 * y1 + area2 * y2) / (area1 + area2);
            const I1 = (tw * Math.pow(h, 3) / 12) + area1 * Math.pow(y1 - y_cg, 2);
            const I2 = ((b - tw) * Math.pow(tf, 3) / 12) + area2 * Math.pow(y2 - y_cg, 2);
            return I1 + I2;
        }
        case 'CHANNEL': {
            // similar to I, but only one side
            return (b * Math.pow(h, 3) / 12) - ((b - tw) * Math.pow(h - 2 * tf, 3) / 12);
        }
    }
    return 0;
}
