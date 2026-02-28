/**
 * 🏛️ ALUCALCULATOR ENGINE - MATH - GEOMETRY
 * "Vector Space"
 */

export function dist(p1: { x: number, y: number }, p2: { x: number, y: number }): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Simple Polyline simplification (Ramer-Douglas-Peucker) could go here
// but kept simple for now as requested.
