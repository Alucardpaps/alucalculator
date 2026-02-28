/**
 * AluCalculator V2 — Steel Profile Standards Database
 * EN 10365, ASTM A6 - ALL VALUES IN SI UNITS
 */

export interface SteelProfile {
    name: string;
    standard: string;
    h: number;      // Height (mm)
    b: number;      // Width (mm)
    tw: number;     // Web thickness (mm)
    tf: number;     // Flange thickness (mm)
    r: number;      // Root radius (mm)
    A: number;      // Cross-section area (mm²)
    Iy: number;     // Moment of inertia Y-Y (mm⁴ × 10⁴)
    Iz: number;     // Moment of inertia Z-Z (mm⁴ × 10⁴)
    mass: number;   // Mass per meter (kg/m)
}

export const IPE_PROFILES: SteelProfile[] = [
    { name: 'IPE 80', standard: 'EN 10365', h: 80, b: 46, tw: 3.8, tf: 5.2, r: 5, A: 764, Iy: 80.14, Iz: 8.49, mass: 6.0 },
    { name: 'IPE 100', standard: 'EN 10365', h: 100, b: 55, tw: 4.1, tf: 5.7, r: 7, A: 1032, Iy: 171, Iz: 15.9, mass: 8.1 },
    { name: 'IPE 120', standard: 'EN 10365', h: 120, b: 64, tw: 4.4, tf: 6.3, r: 7, A: 1321, Iy: 318, Iz: 27.7, mass: 10.4 },
    { name: 'IPE 140', standard: 'EN 10365', h: 140, b: 73, tw: 4.7, tf: 6.9, r: 7, A: 1643, Iy: 541, Iz: 44.9, mass: 12.9 },
    { name: 'IPE 160', standard: 'EN 10365', h: 160, b: 82, tw: 5.0, tf: 7.4, r: 9, A: 2009, Iy: 869, Iz: 68.3, mass: 15.8 },
    { name: 'IPE 180', standard: 'EN 10365', h: 180, b: 91, tw: 5.3, tf: 8.0, r: 9, A: 2395, Iy: 1317, Iz: 101, mass: 18.8 },
    { name: 'IPE 200', standard: 'EN 10365', h: 200, b: 100, tw: 5.6, tf: 8.5, r: 12, A: 2848, Iy: 1943, Iz: 142, mass: 22.4 },
    { name: 'IPE 220', standard: 'EN 10365', h: 220, b: 110, tw: 5.9, tf: 9.2, r: 12, A: 3337, Iy: 2772, Iz: 205, mass: 26.2 },
    { name: 'IPE 240', standard: 'EN 10365', h: 240, b: 120, tw: 6.2, tf: 9.8, r: 15, A: 3912, Iy: 3892, Iz: 284, mass: 30.7 },
    { name: 'IPE 270', standard: 'EN 10365', h: 270, b: 135, tw: 6.6, tf: 10.2, r: 15, A: 4594, Iy: 5790, Iz: 420, mass: 36.1 },
    { name: 'IPE 300', standard: 'EN 10365', h: 300, b: 150, tw: 7.1, tf: 10.7, r: 15, A: 5381, Iy: 8356, Iz: 604, mass: 42.2 },
    { name: 'IPE 330', standard: 'EN 10365', h: 330, b: 160, tw: 7.5, tf: 11.5, r: 18, A: 6261, Iy: 11770, Iz: 788, mass: 49.1 },
    { name: 'IPE 360', standard: 'EN 10365', h: 360, b: 170, tw: 8.0, tf: 12.7, r: 18, A: 7273, Iy: 16270, Iz: 1043, mass: 57.1 },
    { name: 'IPE 400', standard: 'EN 10365', h: 400, b: 180, tw: 8.6, tf: 13.5, r: 21, A: 8446, Iy: 23130, Iz: 1318, mass: 66.3 },
    { name: 'IPE 450', standard: 'EN 10365', h: 450, b: 190, tw: 9.4, tf: 14.6, r: 21, A: 9882, Iy: 33740, Iz: 1676, mass: 77.6 },
    { name: 'IPE 500', standard: 'EN 10365', h: 500, b: 200, tw: 10.2, tf: 16.0, r: 21, A: 11550, Iy: 48200, Iz: 2142, mass: 90.7 },
    { name: 'IPE 550', standard: 'EN 10365', h: 550, b: 210, tw: 11.1, tf: 17.2, r: 24, A: 13440, Iy: 67120, Iz: 2668, mass: 106 },
    { name: 'IPE 600', standard: 'EN 10365', h: 600, b: 220, tw: 12.0, tf: 19.0, r: 24, A: 15600, Iy: 92080, Iz: 3387, mass: 122 },
];

export const HEA_PROFILES: SteelProfile[] = [
    { name: 'HEA 100', standard: 'EN 10365', h: 96, b: 100, tw: 5, tf: 8, r: 12, A: 2124, Iy: 349, Iz: 134, mass: 16.7 },
    { name: 'HEA 120', standard: 'EN 10365', h: 114, b: 120, tw: 5, tf: 8, r: 12, A: 2534, Iy: 606, Iz: 231, mass: 19.9 },
    { name: 'HEA 140', standard: 'EN 10365', h: 133, b: 140, tw: 5.5, tf: 8.5, r: 12, A: 3142, Iy: 1033, Iz: 389, mass: 24.7 },
    { name: 'HEA 160', standard: 'EN 10365', h: 152, b: 160, tw: 6, tf: 9, r: 15, A: 3877, Iy: 1673, Iz: 616, mass: 30.4 },
    { name: 'HEA 180', standard: 'EN 10365', h: 171, b: 180, tw: 6, tf: 9.5, r: 15, A: 4525, Iy: 2510, Iz: 925, mass: 35.5 },
    { name: 'HEA 200', standard: 'EN 10365', h: 190, b: 200, tw: 6.5, tf: 10, r: 18, A: 5383, Iy: 3692, Iz: 1336, mass: 42.3 },
    { name: 'HEA 240', standard: 'EN 10365', h: 230, b: 240, tw: 7.5, tf: 12, r: 21, A: 7684, Iy: 7763, Iz: 2769, mass: 60.3 },
    { name: 'HEA 300', standard: 'EN 10365', h: 290, b: 300, tw: 8.5, tf: 14, r: 27, A: 11250, Iy: 18260, Iz: 6310, mass: 88.3 },
    { name: 'HEA 400', standard: 'EN 10365', h: 390, b: 300, tw: 11, tf: 19, r: 27, A: 15880, Iy: 45070, Iz: 8564, mass: 125 },
];

export const HEB_PROFILES: SteelProfile[] = [
    { name: 'HEB 100', standard: 'EN 10365', h: 100, b: 100, tw: 6, tf: 10, r: 12, A: 2604, Iy: 450, Iz: 167, mass: 20.4 },
    { name: 'HEB 120', standard: 'EN 10365', h: 120, b: 120, tw: 6.5, tf: 11, r: 12, A: 3401, Iy: 864, Iz: 318, mass: 26.7 },
    { name: 'HEB 160', standard: 'EN 10365', h: 160, b: 160, tw: 8, tf: 13, r: 15, A: 5425, Iy: 2492, Iz: 889, mass: 42.6 },
    { name: 'HEB 200', standard: 'EN 10365', h: 200, b: 200, tw: 9, tf: 15, r: 18, A: 7808, Iy: 5696, Iz: 2003, mass: 61.3 },
    { name: 'HEB 240', standard: 'EN 10365', h: 240, b: 240, tw: 10, tf: 17, r: 21, A: 10600, Iy: 11260, Iz: 3923, mass: 83.2 },
    { name: 'HEB 300', standard: 'EN 10365', h: 300, b: 300, tw: 11, tf: 19, r: 27, A: 14910, Iy: 25170, Iz: 8563, mass: 117 },
    { name: 'HEB 400', standard: 'EN 10365', h: 400, b: 300, tw: 13.5, tf: 24, r: 27, A: 19780, Iy: 57680, Iz: 10820, mass: 155 },
];

export const UPN_PROFILES: SteelProfile[] = [
    { name: 'UPN 80', standard: 'EN 10365', h: 80, b: 45, tw: 6, tf: 8, r: 8, A: 1100, Iy: 106, Iz: 19.4, mass: 8.64 },
    { name: 'UPN 100', standard: 'EN 10365', h: 100, b: 50, tw: 6, tf: 8.5, r: 8.5, A: 1350, Iy: 206, Iz: 29.3, mass: 10.6 },
    { name: 'UPN 120', standard: 'EN 10365', h: 120, b: 55, tw: 7, tf: 9, r: 9, A: 1700, Iy: 364, Iz: 43.2, mass: 13.4 },
    { name: 'UPN 140', standard: 'EN 10365', h: 140, b: 60, tw: 7, tf: 10, r: 10, A: 2040, Iy: 605, Iz: 62.7, mass: 16.0 },
    { name: 'UPN 160', standard: 'EN 10365', h: 160, b: 65, tw: 7.5, tf: 10.5, r: 10.5, A: 2400, Iy: 925, Iz: 85.3, mass: 18.8 },
    { name: 'UPN 200', standard: 'EN 10365', h: 200, b: 75, tw: 8.5, tf: 11.5, r: 11.5, A: 3220, Iy: 1910, Iz: 148, mass: 25.3 },
    { name: 'UPN 300', standard: 'EN 10365', h: 300, b: 100, tw: 10, tf: 16, r: 16, A: 5880, Iy: 8030, Iz: 495, mass: 46.2 },
];

export interface AngleProfile {
    name: string;
    a: number; b: number; t: number;
    A: number; mass: number;
}

export const L_ANGLES: AngleProfile[] = [
    { name: 'L 30×30×3', a: 30, b: 30, t: 3, A: 174, mass: 1.36 },
    { name: 'L 40×40×4', a: 40, b: 40, t: 4, A: 308, mass: 2.42 },
    { name: 'L 50×50×5', a: 50, b: 50, t: 5, A: 480, mass: 3.77 },
    { name: 'L 60×60×6', a: 60, b: 60, t: 6, A: 691, mass: 5.42 },
    { name: 'L 80×80×8', a: 80, b: 80, t: 8, A: 1230, mass: 9.63 },
    { name: 'L 100×100×10', a: 100, b: 100, t: 10, A: 1920, mass: 15.0 },
    { name: 'L 120×120×12', a: 120, b: 120, t: 12, A: 2760, mass: 21.6 },
    { name: 'L 150×150×15', a: 150, b: 150, t: 15, A: 4300, mass: 33.8 },
];

export const W_SHAPES: SteelProfile[] = [
    { name: 'W8×18', standard: 'ASTM A6', h: 207, b: 134, tw: 5.8, tf: 8.4, r: 10, A: 2280, Iy: 1580, Iz: 135, mass: 26.8 },
    { name: 'W10×22', standard: 'ASTM A6', h: 254, b: 147, tw: 6.1, tf: 9.1, r: 11, A: 2790, Iy: 3030, Iz: 210, mass: 32.7 },
    { name: 'W12×26', standard: 'ASTM A6', h: 310, b: 165, tw: 6.6, tf: 9.6, r: 13, A: 3300, Iy: 5440, Iz: 359, mass: 38.7 },
    { name: 'W14×30', standard: 'ASTM A6', h: 352, b: 171, tw: 6.9, tf: 10.0, r: 14, A: 3810, Iy: 8400, Iz: 427, mass: 44.6 },
    { name: 'W16×36', standard: 'ASTM A6', h: 399, b: 178, tw: 7.5, tf: 10.9, r: 15, A: 4580, Iy: 12700, Iz: 574, mass: 53.6 },
    { name: 'W21×62', standard: 'ASTM A6', h: 533, b: 210, tw: 10.2, tf: 15.6, r: 18, A: 7870, Iy: 39400, Iz: 1470, mass: 92.3 },
    { name: 'W24×76', standard: 'ASTM A6', h: 607, b: 229, tw: 11.2, tf: 17.3, r: 19, A: 9650, Iy: 62200, Iz: 2180, mass: 113 },
];

export function findProfile(name: string): SteelProfile | AngleProfile | undefined {
    const all = [...IPE_PROFILES, ...HEA_PROFILES, ...HEB_PROFILES, ...UPN_PROFILES, ...L_ANGLES, ...W_SHAPES];
    return all.find(p => p.name === name);
}

export function calculateWeight(profile: { mass: number }, lengthMm: number): number {
    return (profile.mass * lengthMm) / 1000;
}
