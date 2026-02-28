/**
 * AluCalculator V2 — Aluminum Profile Standards Database
 * EN 755, ASTM B221, JIS H4100 - ALL VALUES IN SI UNITS
 */

// ============================================
// ALUMINUM ALLOY GRADES
// ============================================

export interface AluminumAlloy {
    grade: string;
    standard: string;
    tensileStrength: number; // MPa
    yieldStrength: number; // MPa (Rp0.2)
    elongation: number; // %
    density: number; // g/cm³
    modulus: number; // GPa (E)
    thermalExpansion: number; // 10⁻⁶/K
    thermalConductivity: number; // W/(m·K)
    temper: string;
    applications: string;
}

export const ALUMINUM_ALLOYS: AluminumAlloy[] = [
    // 1xxx Series - Pure Aluminum
    { grade: '1050', standard: 'EN 573', tensileStrength: 65, yieldStrength: 20, elongation: 40, density: 2.71, modulus: 69, thermalExpansion: 23.5, thermalConductivity: 229, temper: 'O', applications: 'Electrical, chemical' },
    { grade: '1100', standard: 'ASTM B221', tensileStrength: 90, yieldStrength: 35, elongation: 35, density: 2.71, modulus: 69, thermalExpansion: 23.6, thermalConductivity: 222, temper: 'H14', applications: 'Heat exchangers' },

    // 2xxx Series - Copper Alloys
    { grade: '2024', standard: 'EN 573', tensileStrength: 470, yieldStrength: 325, elongation: 20, density: 2.78, modulus: 73, thermalExpansion: 23.2, thermalConductivity: 121, temper: 'T4', applications: 'Aerospace, structures' },

    // 5xxx Series - Magnesium Alloys
    { grade: '5052', standard: 'EN 573', tensileStrength: 215, yieldStrength: 165, elongation: 12, density: 2.68, modulus: 70, thermalExpansion: 23.8, thermalConductivity: 138, temper: 'H32', applications: 'Marine, pressure vessels' },
    { grade: '5083', standard: 'EN 573', tensileStrength: 290, yieldStrength: 145, elongation: 16, density: 2.66, modulus: 71, thermalExpansion: 23.4, thermalConductivity: 117, temper: 'O', applications: 'Marine, cryogenic' },
    { grade: '5754', standard: 'EN 573', tensileStrength: 215, yieldStrength: 80, elongation: 25, density: 2.67, modulus: 70, thermalExpansion: 23.9, thermalConductivity: 147, temper: 'O', applications: 'Automotive, welded' },

    // 6xxx Series - Magnesium-Silicon (Most Common for Extrusion)
    { grade: '6060', standard: 'EN 573', tensileStrength: 190, yieldStrength: 150, elongation: 8, density: 2.70, modulus: 69, thermalExpansion: 23.4, thermalConductivity: 200, temper: 'T6', applications: 'Architectural, frames' },
    { grade: '6061', standard: 'EN 573', tensileStrength: 310, yieldStrength: 275, elongation: 12, density: 2.70, modulus: 69, thermalExpansion: 23.6, thermalConductivity: 167, temper: 'T6', applications: 'Structural, aerospace' },
    { grade: '6063', standard: 'EN 573', tensileStrength: 205, yieldStrength: 170, elongation: 9, density: 2.70, modulus: 69, thermalExpansion: 23.4, thermalConductivity: 200, temper: 'T5', applications: 'Extrusions, window frames' },
    { grade: '6082', standard: 'EN 573', tensileStrength: 340, yieldStrength: 310, elongation: 10, density: 2.71, modulus: 70, thermalExpansion: 23.1, thermalConductivity: 170, temper: 'T6', applications: 'Structural, bridges' },

    // 7xxx Series - Zinc Alloys
    { grade: '7020', standard: 'EN 573', tensileStrength: 350, yieldStrength: 280, elongation: 10, density: 2.78, modulus: 70, thermalExpansion: 23.0, thermalConductivity: 142, temper: 'T6', applications: 'Structural, weldable' },
    { grade: '7075', standard: 'EN 573', tensileStrength: 570, yieldStrength: 505, elongation: 11, density: 2.81, modulus: 72, thermalExpansion: 23.6, thermalConductivity: 130, temper: 'T6', applications: 'Aerospace, high-stress' },
];

// ============================================
// STRUCTURAL ALUMINUM PROFILES (EN 1999)
// ============================================

export interface AluminumProfile {
    name: string;
    type: 'I' | 'H' | 'U' | 'L' | 'T' | 'Box' | 'Tube';
    h: number; // Height (mm)
    b: number; // Width (mm)
    t: number; // Thickness (mm)
    t2?: number; // Flange/Web thickness if different
    A: number; // Area (mm²)
    Iy: number; // Moment of inertia Y (mm⁴ × 10³)
    Iz: number; // Moment of inertia Z (mm⁴ × 10³)
    mass: number; // kg/m (based on 2.70 g/cm³)
}

export const ALU_I_PROFILES: AluminumProfile[] = [
    { name: 'I 25×15', type: 'I', h: 25, b: 15, t: 2, A: 86, Iy: 4.5, Iz: 0.8, mass: 0.23 },
    { name: 'I 30×20', type: 'I', h: 30, b: 20, t: 2.5, A: 135, Iy: 10.1, Iz: 2.1, mass: 0.36 },
    { name: 'I 40×25', type: 'I', h: 40, b: 25, t: 3, A: 213, Iy: 27.5, Iz: 5.2, mass: 0.58 },
    { name: 'I 50×30', type: 'I', h: 50, b: 30, t: 3, A: 270, Iy: 53.1, Iz: 9.0, mass: 0.73 },
    { name: 'I 60×40', type: 'I', h: 60, b: 40, t: 4, A: 456, Iy: 130, Iz: 28.5, mass: 1.23 },
    { name: 'I 80×50', type: 'I', h: 80, b: 50, t: 5, A: 725, Iy: 350, Iz: 62.5, mass: 1.96 },
    { name: 'I 100×60', type: 'I', h: 100, b: 60, t: 6, A: 1068, Iy: 750, Iz: 130, mass: 2.88 },
];

export const ALU_U_PROFILES: AluminumProfile[] = [
    { name: 'U 20×15', type: 'U', h: 20, b: 15, t: 2, A: 95, Iy: 2.8, Iz: 1.2, mass: 0.26 },
    { name: 'U 25×20', type: 'U', h: 25, b: 20, t: 2.5, A: 155, Iy: 6.8, Iz: 3.2, mass: 0.42 },
    { name: 'U 30×25', type: 'U', h: 30, b: 25, t: 3, A: 225, Iy: 14.2, Iz: 6.5, mass: 0.61 },
    { name: 'U 40×30', type: 'U', h: 40, b: 30, t: 3, A: 294, Iy: 29.5, Iz: 11.2, mass: 0.79 },
    { name: 'U 50×40', type: 'U', h: 50, b: 40, t: 4, A: 504, Iy: 72, Iz: 32, mass: 1.36 },
    { name: 'U 60×50', type: 'U', h: 60, b: 50, t: 5, A: 775, Iy: 152, Iz: 68, mass: 2.09 },
    { name: 'U 80×60', type: 'U', h: 80, b: 60, t: 6, A: 1140, Iy: 362, Iz: 145, mass: 3.08 },
];

export const ALU_L_ANGLES: AluminumProfile[] = [
    { name: 'L 15×15×2', type: 'L', h: 15, b: 15, t: 2, A: 56, Iy: 0.9, Iz: 0.9, mass: 0.15 },
    { name: 'L 20×20×2', type: 'L', h: 20, b: 20, t: 2, A: 76, Iy: 2.2, Iz: 2.2, mass: 0.21 },
    { name: 'L 25×25×3', type: 'L', h: 25, b: 25, t: 3, A: 141, Iy: 6.5, Iz: 6.5, mass: 0.38 },
    { name: 'L 30×30×3', type: 'L', h: 30, b: 30, t: 3, A: 171, Iy: 11.4, Iz: 11.4, mass: 0.46 },
    { name: 'L 40×40×4', type: 'L', h: 40, b: 40, t: 4, A: 304, Iy: 36.5, Iz: 36.5, mass: 0.82 },
    { name: 'L 50×50×5', type: 'L', h: 50, b: 50, t: 5, A: 475, Iy: 89, Iz: 89, mass: 1.28 },
    { name: 'L 60×60×6', type: 'L', h: 60, b: 60, t: 6, A: 684, Iy: 185, Iz: 185, mass: 1.85 },
    { name: 'L 80×80×8', type: 'L', h: 80, b: 80, t: 8, A: 1216, Iy: 582, Iz: 582, mass: 3.28 },
];

export const ALU_BOX_PROFILES: AluminumProfile[] = [
    { name: 'Box 20×20×2', type: 'Box', h: 20, b: 20, t: 2, A: 144, Iy: 3.9, Iz: 3.9, mass: 0.39 },
    { name: 'Box 25×25×2', type: 'Box', h: 25, b: 25, t: 2, A: 184, Iy: 8.0, Iz: 8.0, mass: 0.50 },
    { name: 'Box 30×30×2', type: 'Box', h: 30, b: 30, t: 2, A: 224, Iy: 14.2, Iz: 14.2, mass: 0.60 },
    { name: 'Box 40×40×3', type: 'Box', h: 40, b: 40, t: 3, A: 444, Iy: 49.2, Iz: 49.2, mass: 1.20 },
    { name: 'Box 50×50×3', type: 'Box', h: 50, b: 50, t: 3, A: 564, Iy: 97.5, Iz: 97.5, mass: 1.52 },
    { name: 'Box 60×60×4', type: 'Box', h: 60, b: 60, t: 4, A: 896, Iy: 212, Iz: 212, mass: 2.42 },
    { name: 'Box 80×80×5', type: 'Box', h: 80, b: 80, t: 5, A: 1500, Iy: 530, Iz: 530, mass: 4.05 },
    { name: 'Box 100×100×6', type: 'Box', h: 100, b: 100, t: 6, A: 2256, Iy: 1190, Iz: 1190, mass: 6.09 },
];

export const ALU_TUBES: AluminumProfile[] = [
    { name: 'Tube Ø20×2', type: 'Tube', h: 20, b: 20, t: 2, A: 113, Iy: 3.3, Iz: 3.3, mass: 0.31 },
    { name: 'Tube Ø25×2', type: 'Tube', h: 25, b: 25, t: 2, A: 144, Iy: 6.7, Iz: 6.7, mass: 0.39 },
    { name: 'Tube Ø30×3', type: 'Tube', h: 30, b: 30, t: 3, A: 254, Iy: 16.5, Iz: 16.5, mass: 0.69 },
    { name: 'Tube Ø40×3', type: 'Tube', h: 40, b: 40, t: 3, A: 349, Iy: 40.8, Iz: 40.8, mass: 0.94 },
    { name: 'Tube Ø50×4', type: 'Tube', h: 50, b: 50, t: 4, A: 578, Iy: 104, Iz: 104, mass: 1.56 },
    { name: 'Tube Ø60×5', type: 'Tube', h: 60, b: 60, t: 5, A: 864, Iy: 223, Iz: 223, mass: 2.33 },
    { name: 'Tube Ø80×6', type: 'Tube', h: 80, b: 80, t: 6, A: 1394, Iy: 530, Iz: 530, mass: 3.76 },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getAlloyByGrade(grade: string): AluminumAlloy | undefined {
    return ALUMINUM_ALLOYS.find(a => a.grade === grade);
}

export function findAluProfile(name: string): AluminumProfile | undefined {
    const all = [...ALU_I_PROFILES, ...ALU_U_PROFILES, ...ALU_L_ANGLES, ...ALU_BOX_PROFILES, ...ALU_TUBES];
    return all.find(p => p.name === name);
}

export function calculateAluWeight(profile: AluminumProfile, lengthMm: number): number {
    return (profile.mass * lengthMm) / 1000;
}

export function calculateProfileArea(type: string, h: number, b: number, t: number): number {
    switch (type) {
        case 'Box': return 2 * t * (h + b - 2 * t);
        case 'Tube': return Math.PI * ((h / 2) ** 2 - ((h / 2) - t) ** 2);
        case 'L': return t * (h + b - t);
        default: return h * b * 0.3; // Approximate
    }
}
