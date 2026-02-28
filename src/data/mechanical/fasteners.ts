/**
 * 🔩 UNIVERSAL FASTENER DATABASE
 * Metric ISO 4014 / 4017 (Hex Head)
 */

export interface FastenerStandard {
    id: string;
    name: string;
    d: number; // Nominal Diameter (mm)
    p: number; // Pitch (mm)
    k: number; // Head Height (mm)
    s: number; // Across Flats (mm)
    drill: number; // Tapping Drill Size (mm)
}

export const METRIC_BOLTS: FastenerStandard[] = [
    { id: 'M3', name: 'M3 Standard', d: 3, p: 0.5, k: 2, s: 5.5, drill: 2.5 },
    { id: 'M4', name: 'M4 Standard', d: 4, p: 0.7, k: 2.8, s: 7, drill: 3.3 },
    { id: 'M5', name: 'M5 Standard', d: 5, p: 0.8, k: 3.5, s: 8, drill: 4.2 },
    { id: 'M6', name: 'M6 Standard', d: 6, p: 1.0, k: 4, s: 10, drill: 5 },
    { id: 'M8', name: 'M8 Standard', d: 8, p: 1.25, k: 5.3, s: 13, drill: 6.8 },
    { id: 'M10', name: 'M10 Standard', d: 10, p: 1.5, k: 6.4, s: 17, drill: 8.5 },
    { id: 'M12', name: 'M12 Standard', d: 12, p: 1.75, k: 7.5, s: 19, drill: 10.2 },
    { id: 'M14', name: 'M14 Standard', d: 14, p: 2, k: 8.8, s: 22, drill: 12 },
    { id: 'M16', name: 'M16 Standard', d: 16, p: 2, k: 10, s: 24, drill: 14 },
    { id: 'M20', name: 'M20 Standard', d: 20, p: 2.5, k: 12.5, s: 30, drill: 17.5 },
    { id: 'M24', name: 'M24 Standard', d: 24, p: 3, k: 15, s: 36, drill: 21 },
    { id: 'M30', name: 'M30 Standard', d: 30, p: 3.5, k: 18.7, s: 46, drill: 26.5 },
    { id: 'M36', name: 'M36 Standard', d: 36, p: 4, k: 22.5, s: 55, drill: 32 },
    { id: 'M42', name: 'M42 Standard', d: 42, p: 4.5, k: 26, s: 65, drill: 37.5 },
    { id: 'M48', name: 'M48 Standard', d: 48, p: 5, k: 30, s: 75, drill: 43 },
    { id: 'M56', name: 'M56 Standard', d: 56, p: 5.5, k: 35, s: 85, drill: 50.5 },
    { id: 'M64', name: 'M64 Standard', d: 64, p: 6, k: 40, s: 95, drill: 58 },
];

export const getBolt = (id: string) => METRIC_BOLTS.find(b => b.id === id);
