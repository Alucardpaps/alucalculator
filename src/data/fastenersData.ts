export interface Fastener {
    standard: 'ISO Metric' | 'ISO Metric Fine' | 'UNC' | 'UNF' | 'BSPP (G)' | 'BSPT (R)' | 'NPT' | 'Trapezoidal (Tr)';
    size: string;
    pitch: number; // mm (or TPI for imperial, handled by logic)
    majorDia: number; // mm
    minorDia: number; // mm
    pitchDia: number; // mm
    tapDrill: number; // mm
    stressArea: number; // mm^2 (approx for pipe)
}

const MM = 25.4;

export const FASTENERS_DB: Fastener[] = [
    // --- ISO Metric Coarse (Full Range) ---
    { standard: 'ISO Metric', size: 'M1.6', pitch: 0.35, majorDia: 1.6, minorDia: 1.075, pitchDia: 1.373, tapDrill: 1.25, stressArea: 1.27 },
    { standard: 'ISO Metric', size: 'M2', pitch: 0.4, majorDia: 2, minorDia: 1.509, pitchDia: 1.740, tapDrill: 1.6, stressArea: 2.07 },
    { standard: 'ISO Metric', size: 'M2.5', pitch: 0.45, majorDia: 2.5, minorDia: 1.948, pitchDia: 2.208, tapDrill: 2.05, stressArea: 3.39 },
    { standard: 'ISO Metric', size: 'M3', pitch: 0.5, majorDia: 3, minorDia: 2.459, pitchDia: 2.675, tapDrill: 2.5, stressArea: 5.03 },
    { standard: 'ISO Metric', size: 'M3.5', pitch: 0.6, majorDia: 3.5, minorDia: 2.764, pitchDia: 3.110, tapDrill: 2.9, stressArea: 6.78 },
    { standard: 'ISO Metric', size: 'M4', pitch: 0.7, majorDia: 4, minorDia: 3.242, pitchDia: 3.545, tapDrill: 3.3, stressArea: 8.78 },
    { standard: 'ISO Metric', size: 'M5', pitch: 0.8, majorDia: 5, minorDia: 4.134, pitchDia: 4.480, tapDrill: 4.2, stressArea: 14.2 },
    { standard: 'ISO Metric', size: 'M6', pitch: 1.0, majorDia: 6, minorDia: 4.917, pitchDia: 5.350, tapDrill: 5.0, stressArea: 20.1 },
    { standard: 'ISO Metric', size: 'M8', pitch: 1.25, majorDia: 8, minorDia: 6.647, pitchDia: 7.188, tapDrill: 6.8, stressArea: 36.6 },
    { standard: 'ISO Metric', size: 'M10', pitch: 1.5, majorDia: 10, minorDia: 8.376, pitchDia: 9.026, tapDrill: 8.5, stressArea: 58.0 },
    { standard: 'ISO Metric', size: 'M12', pitch: 1.75, majorDia: 12, minorDia: 10.106, pitchDia: 10.863, tapDrill: 10.2, stressArea: 84.3 },
    { standard: 'ISO Metric', size: 'M14', pitch: 2.0, majorDia: 14, minorDia: 11.835, pitchDia: 12.701, tapDrill: 12.0, stressArea: 115 },
    { standard: 'ISO Metric', size: 'M16', pitch: 2.0, majorDia: 16, minorDia: 13.835, pitchDia: 14.701, tapDrill: 14.0, stressArea: 157 },
    { standard: 'ISO Metric', size: 'M18', pitch: 2.5, majorDia: 18, minorDia: 15.294, pitchDia: 16.376, tapDrill: 15.5, stressArea: 192 },
    { standard: 'ISO Metric', size: 'M20', pitch: 2.5, majorDia: 20, minorDia: 17.294, pitchDia: 18.376, tapDrill: 17.5, stressArea: 245 },
    { standard: 'ISO Metric', size: 'M22', pitch: 2.5, majorDia: 22, minorDia: 19.294, pitchDia: 20.376, tapDrill: 19.5, stressArea: 303 },
    { standard: 'ISO Metric', size: 'M24', pitch: 3.0, majorDia: 24, minorDia: 20.752, pitchDia: 22.051, tapDrill: 21.0, stressArea: 353 },
    { standard: 'ISO Metric', size: 'M27', pitch: 3.0, majorDia: 27, minorDia: 23.752, pitchDia: 25.051, tapDrill: 24.0, stressArea: 459 },
    { standard: 'ISO Metric', size: 'M30', pitch: 3.5, majorDia: 30, minorDia: 26.211, pitchDia: 27.727, tapDrill: 26.5, stressArea: 561 },
    { standard: 'ISO Metric', size: 'M33', pitch: 3.5, majorDia: 33, minorDia: 29.211, pitchDia: 30.727, tapDrill: 29.5, stressArea: 694 },
    { standard: 'ISO Metric', size: 'M36', pitch: 4.0, majorDia: 36, minorDia: 31.670, pitchDia: 33.402, tapDrill: 32.0, stressArea: 817 },
    { standard: 'ISO Metric', size: 'M42', pitch: 4.5, majorDia: 42, minorDia: 37.129, pitchDia: 39.077, tapDrill: 37.5, stressArea: 1121 },
    { standard: 'ISO Metric', size: 'M48', pitch: 5.0, majorDia: 48, minorDia: 42.587, pitchDia: 44.752, tapDrill: 43.0, stressArea: 1473 },
    { standard: 'ISO Metric', size: 'M56', pitch: 5.5, majorDia: 56, minorDia: 50.046, pitchDia: 52.428, tapDrill: 50.5, stressArea: 2030 },
    { standard: 'ISO Metric', size: 'M64', pitch: 6.0, majorDia: 64, minorDia: 57.505, pitchDia: 60.103, tapDrill: 58.0, stressArea: 2676 },

    // --- ISO Metric Fine ---
    { standard: 'ISO Metric Fine', size: 'M8x1', pitch: 1.0, majorDia: 8, minorDia: 6.917, pitchDia: 7.350, tapDrill: 7.0, stressArea: 39.2 },
    { standard: 'ISO Metric Fine', size: 'M10x1', pitch: 1.0, majorDia: 10, minorDia: 8.917, pitchDia: 9.350, tapDrill: 9.0, stressArea: 64.5 },
    { standard: 'ISO Metric Fine', size: 'M10x1.25', pitch: 1.25, majorDia: 10, minorDia: 8.647, pitchDia: 9.188, tapDrill: 8.8, stressArea: 61.2 },
    { standard: 'ISO Metric Fine', size: 'M12x1.25', pitch: 1.25, majorDia: 12, minorDia: 10.647, pitchDia: 11.188, tapDrill: 10.8, stressArea: 92.1 },
    { standard: 'ISO Metric Fine', size: 'M12x1.5', pitch: 1.5, majorDia: 12, minorDia: 10.376, pitchDia: 11.026, tapDrill: 10.5, stressArea: 88.1 },

    // --- UNC (Unified Coarse) ---
    { standard: 'UNC', size: '#1-64', pitch: 64, majorDia: 0.0730 * MM, minorDia: 0.0538 * MM, pitchDia: 0.0629 * MM, tapDrill: 1.5, stressArea: 0.00263 * 645.16 },
    { standard: 'UNC', size: '#2-56', pitch: 56, majorDia: 0.0860 * MM, minorDia: 0.0641 * MM, pitchDia: 0.0744 * MM, tapDrill: 1.85, stressArea: 0.00370 * 645.16 },
    { standard: 'UNC', size: '#4-40', pitch: 40, majorDia: 0.1120 * MM, minorDia: 0.0813 * MM, pitchDia: 0.0958 * MM, tapDrill: 2.35, stressArea: 0.00604 * 645.16 },
    { standard: 'UNC', size: '#6-32', pitch: 32, majorDia: 0.1380 * MM, minorDia: 0.0997 * MM, pitchDia: 0.1177 * MM, tapDrill: 2.85, stressArea: 0.00909 * 645.16 },
    { standard: 'UNC', size: '#8-32', pitch: 32, majorDia: 0.1640 * MM, minorDia: 0.1257 * MM, pitchDia: 0.1437 * MM, tapDrill: 3.5, stressArea: 0.0140 * 645.16 },
    { standard: 'UNC', size: '#10-24', pitch: 24, majorDia: 0.1900 * MM, minorDia: 0.1389 * MM, pitchDia: 0.1629 * MM, tapDrill: 3.9, stressArea: 0.0175 * 645.16 },
    { standard: 'UNC', size: '1/4-20', pitch: 20, majorDia: 0.250 * MM, minorDia: 0.1887 * MM, pitchDia: 0.2175 * MM, tapDrill: 5.1, stressArea: 0.0318 * 645.16 },
    { standard: 'UNC', size: '5/16-18', pitch: 18, majorDia: 0.3125 * MM, minorDia: 0.2443 * MM, pitchDia: 0.2764 * MM, tapDrill: 6.6, stressArea: 0.0524 * 645.16 },
    { standard: 'UNC', size: '3/8-16', pitch: 16, majorDia: 0.375 * MM, minorDia: 0.2983 * MM, pitchDia: 0.3344 * MM, tapDrill: 8.0, stressArea: 0.0775 * 645.16 },
    { standard: 'UNC', size: '7/16-14', pitch: 14, majorDia: 0.4375 * MM, minorDia: 0.3499 * MM, pitchDia: 0.3911 * MM, tapDrill: 9.4, stressArea: 0.1063 * 645.16 },
    { standard: 'UNC', size: '1/2-13', pitch: 13, majorDia: 0.500 * MM, minorDia: 0.4069 * MM, pitchDia: 0.4500 * MM, tapDrill: 10.7, stressArea: 0.1419 * 645.16 },
    { standard: 'UNC', size: '5/8-11', pitch: 11, majorDia: 0.625 * MM, minorDia: 0.5135 * MM, pitchDia: 0.566 * MM, tapDrill: 13.5, stressArea: 0.2260 * 645.16 },
    { standard: 'UNC', size: '3/4-10', pitch: 10, majorDia: 0.750 * MM, minorDia: 0.6273 * MM, pitchDia: 0.685 * MM, tapDrill: 16.5, stressArea: 0.3344 * 645.16 },
    { standard: 'UNC', size: '7/8-9', pitch: 9, majorDia: 0.875 * MM, minorDia: 0.7387 * MM, pitchDia: 0.8028 * MM, tapDrill: 19.5, stressArea: 0.4617 * 645.16 },
    { standard: 'UNC', size: '1-8', pitch: 8, majorDia: 1.000 * MM, minorDia: 0.8466 * MM, pitchDia: 0.9188 * MM, tapDrill: 22.25, stressArea: 0.6057 * 645.16 },
    { standard: 'UNC', size: '1-1/8-7', pitch: 7, majorDia: 1.125 * MM, minorDia: 0.9497 * MM, pitchDia: 1.0322 * MM, tapDrill: 25.0, stressArea: 0.7633 * 645.16 },
    { standard: 'UNC', size: '1-1/4-7', pitch: 7, majorDia: 1.250 * MM, minorDia: 1.0747 * MM, pitchDia: 1.1572 * MM, tapDrill: 28.0, stressArea: 0.9691 * 645.16 },
    { standard: 'UNC', size: '1-1/2-6', pitch: 6, majorDia: 1.500 * MM, minorDia: 1.2955 * MM, pitchDia: 1.3917 * MM, tapDrill: 34.0, stressArea: 1.4053 * 645.16 },
    { standard: 'UNC', size: '1-3/4-5', pitch: 5, majorDia: 1.750 * MM, minorDia: 1.5065 * MM, pitchDia: 1.6201 * MM, tapDrill: 39.5, stressArea: 1.8995 * 645.16 },
    { standard: 'UNC', size: '2-4.5', pitch: 4.5, majorDia: 2.000 * MM, minorDia: 1.7286 * MM, pitchDia: 1.8557 * MM, tapDrill: 45.0, stressArea: 2.4982 * 645.16 },
    { standard: 'UNC', size: '2-1/2-4', pitch: 4, majorDia: 2.500 * MM, minorDia: 2.193 * MM, pitchDia: 2.3376 * MM, tapDrill: 57.0, stressArea: 3.9988 * 645.16 },
    { standard: 'UNC', size: '3-4', pitch: 4, majorDia: 3.000 * MM, minorDia: 2.693 * MM, pitchDia: 2.8376 * MM, tapDrill: 70.0, stressArea: 5.9674 * 645.16 },
    { standard: 'UNC', size: '4-4', pitch: 4, majorDia: 4.000 * MM, minorDia: 3.693 * MM, pitchDia: 3.8376 * MM, tapDrill: 95.0, stressArea: 10.902 * 645.16 },

    // --- UNF (Unified Fine) ---
    { standard: 'UNF', size: '#10-32', pitch: 32, majorDia: 0.190 * MM, minorDia: 0.1517 * MM, pitchDia: 0.1697 * MM, tapDrill: 4.1, stressArea: 0.0199 * 645.16 },
    { standard: 'UNF', size: '1/4-28', pitch: 28, majorDia: 0.250 * MM, minorDia: 0.2062 * MM, pitchDia: 0.2268 * MM, tapDrill: 5.5, stressArea: 0.0364 * 645.16 },
    { standard: 'UNF', size: '5/16-24', pitch: 24, majorDia: 0.3125 * MM, minorDia: 0.2614 * MM, pitchDia: 0.2854 * MM, tapDrill: 6.9, stressArea: 0.0581 * 645.16 },
    { standard: 'UNF', size: '3/8-24', pitch: 24, majorDia: 0.375 * MM, minorDia: 0.3239 * MM, pitchDia: 0.3479 * MM, tapDrill: 8.5, stressArea: 0.0878 * 645.16 },
    { standard: 'UNF', size: '7/16-20', pitch: 20, majorDia: 0.4375 * MM, minorDia: 0.3762 * MM, pitchDia: 0.4050 * MM, tapDrill: 9.9, stressArea: 0.1187 * 645.16 },
    { standard: 'UNF', size: '1/2-20', pitch: 20, majorDia: 0.500 * MM, minorDia: 0.4387 * MM, pitchDia: 0.4675 * MM, tapDrill: 11.5, stressArea: 0.1599 * 645.16 },
    { standard: 'UNF', size: '5/8-18', pitch: 18, majorDia: 0.625 * MM, minorDia: 0.5568 * MM, pitchDia: 0.5889 * MM, tapDrill: 14.5, stressArea: 0.2560 * 645.16 },
    { standard: 'UNF', size: '3/4-16', pitch: 16, majorDia: 0.750 * MM, minorDia: 0.6733 * MM, pitchDia: 0.7094 * MM, tapDrill: 17.5, stressArea: 0.3730 * 645.16 },
    { standard: 'UNF', size: '7/8-14', pitch: 14, majorDia: 0.875 * MM, minorDia: 0.7874 * MM, pitchDia: 0.8286 * MM, tapDrill: 20.25, stressArea: 0.5095 * 645.16 },
    { standard: 'UNF', size: '1-12', pitch: 12, majorDia: 1.000 * MM, minorDia: 0.8978 * MM, pitchDia: 0.9459 * MM, tapDrill: 23.25, stressArea: 0.6630 * 645.16 },
    { standard: 'UNF', size: '1-1/4-12', pitch: 12, majorDia: 1.250 * MM, minorDia: 1.1478 * MM, pitchDia: 1.1959 * MM, tapDrill: 29.5, stressArea: 1.0729 * 645.16 },
    { standard: 'UNF', size: '1-1/2-12', pitch: 12, majorDia: 1.500 * MM, minorDia: 1.3978 * MM, pitchDia: 1.4459 * MM, tapDrill: 36.0, stressArea: 1.5810 * 645.16 },

    // --- BSPP (G) Parallel Pipe ---
    // Pitch is TPI. Angle 55.
    { standard: 'BSPP (G)', size: 'G 1/8', pitch: 28, majorDia: 9.728, minorDia: 8.566, pitchDia: 9.147, tapDrill: 8.8, stressArea: 61.6 },
    { standard: 'BSPP (G)', size: 'G 1/4', pitch: 19, majorDia: 13.157, minorDia: 11.445, pitchDia: 12.301, tapDrill: 11.8, stressArea: 110.7 },
    { standard: 'BSPP (G)', size: 'G 3/8', pitch: 19, majorDia: 16.662, minorDia: 14.950, pitchDia: 15.806, tapDrill: 15.25, stressArea: 185.8 },
    { standard: 'BSPP (G)', size: 'G 1/2', pitch: 14, majorDia: 20.955, minorDia: 18.631, pitchDia: 19.793, tapDrill: 19.0, stressArea: 290.0 },
    { standard: 'BSPP (G)', size: 'G 3/4', pitch: 14, majorDia: 26.441, minorDia: 24.117, pitchDia: 25.279, tapDrill: 24.5, stressArea: 479.1 },
    { standard: 'BSPP (G)', size: 'G 1', pitch: 11, majorDia: 33.249, minorDia: 30.291, pitchDia: 31.770, tapDrill: 30.75, stressArea: 756.2 },
    { standard: 'BSPP (G)', size: 'G 1-1/4', pitch: 11, majorDia: 41.910, minorDia: 38.952, pitchDia: 40.431, tapDrill: 39.5, stressArea: 1237.3 },
    { standard: 'BSPP (G)', size: 'G 1-1/2', pitch: 11, majorDia: 47.803, minorDia: 44.845, pitchDia: 46.324, tapDrill: 45.0, stressArea: 1632.0 },
    { standard: 'BSPP (G)', size: 'G 2', pitch: 11, majorDia: 59.614, minorDia: 56.656, pitchDia: 58.135, tapDrill: 57.0, stressArea: 2587.3 },
    { standard: 'BSPP (G)', size: 'G 2-1/2', pitch: 11, majorDia: 75.184, minorDia: 72.226, pitchDia: 73.705, tapDrill: 72.5, stressArea: 4181.4 },
    { standard: 'BSPP (G)', size: 'G 3', pitch: 11, majorDia: 87.884, minorDia: 84.926, pitchDia: 86.405, tapDrill: 85.0, stressArea: 5763.7 },

    // --- BSPT (R) Tapered Pipe (ISO 7) ---
    // Pitch is TPI. Angle 55. Major Dia is Gauge Plane Diameter.
    { standard: 'BSPT (R)', size: 'R 1/16', pitch: 28, majorDia: 7.723, minorDia: 6.561, pitchDia: 7.142, tapDrill: 6.5, stressArea: 37.5 },
    { standard: 'BSPT (R)', size: 'R 1/8', pitch: 28, majorDia: 9.728, minorDia: 8.566, pitchDia: 9.147, tapDrill: 8.2, stressArea: 61.6 },
    { standard: 'BSPT (R)', size: 'R 1/4', pitch: 19, majorDia: 13.157, minorDia: 11.445, pitchDia: 12.301, tapDrill: 11.1, stressArea: 110.7 },
    { standard: 'BSPT (R)', size: 'R 3/8', pitch: 19, majorDia: 16.662, minorDia: 14.950, pitchDia: 15.806, tapDrill: 14.5, stressArea: 185.8 },
    { standard: 'BSPT (R)', size: 'R 1/2', pitch: 14, majorDia: 20.955, minorDia: 18.631, pitchDia: 19.793, tapDrill: 18.0, stressArea: 290.0 },
    { standard: 'BSPT (R)', size: 'R 3/4', pitch: 14, majorDia: 26.441, minorDia: 24.117, pitchDia: 25.279, tapDrill: 23.5, stressArea: 479.1 },
    { standard: 'BSPT (R)', size: 'R 1', pitch: 11, majorDia: 33.249, minorDia: 30.291, pitchDia: 31.770, tapDrill: 29.5, stressArea: 756.2 },
    { standard: 'BSPT (R)', size: 'R 1-1/4', pitch: 11, majorDia: 41.910, minorDia: 38.952, pitchDia: 40.431, tapDrill: 38.0, stressArea: 1237.3 },
    { standard: 'BSPT (R)', size: 'R 1-1/2', pitch: 11, majorDia: 47.803, minorDia: 44.845, pitchDia: 46.324, tapDrill: 44.0, stressArea: 1632.0 },
    { standard: 'BSPT (R)', size: 'R 2', pitch: 11, majorDia: 59.614, minorDia: 56.656, pitchDia: 58.135, tapDrill: 55.5, stressArea: 2587.3 },
    { standard: 'BSPT (R)', size: 'R 2-1/2', pitch: 11, majorDia: 75.184, minorDia: 72.226, pitchDia: 73.705, tapDrill: 71.0, stressArea: 4181.4 },
    { standard: 'BSPT (R)', size: 'R 3', pitch: 11, majorDia: 87.884, minorDia: 84.926, pitchDia: 86.405, tapDrill: 84.0, stressArea: 5763.7 },
    { standard: 'BSPT (R)', size: 'R 4', pitch: 11, majorDia: 113.030, minorDia: 110.072, pitchDia: 111.551, tapDrill: 109.5, stressArea: 9644.0 },
    { standard: 'BSPT (R)', size: 'R 5', pitch: 11, majorDia: 138.430, minorDia: 135.472, pitchDia: 136.951, tapDrill: 134.5, stressArea: 14572.0 },
    { standard: 'BSPT (R)', size: 'R 6', pitch: 11, majorDia: 163.830, minorDia: 160.872, pitchDia: 162.351, tapDrill: 160.0, stressArea: 20513.0 },

    // --- NPT Tapered Pipe (ANSI B1.20.1) ---
    // Angle 60. Taper 1:16. Major Dia is Pipe OD (approx).
    // Tap Drill is for Tapered Reamer or Commercial use.
    // Stored in Metric equiv for DB consistency, converted to Inch for display.
    { standard: 'NPT', size: '1/16 NPT', pitch: 27, majorDia: 7.950, minorDia: 6.388, pitchDia: 7.142, tapDrill: 6.15, stressArea: 35.9 },
    { standard: 'NPT', size: '1/8 NPT', pitch: 27, majorDia: 10.287, minorDia: 8.730, pitchDia: 9.489, tapDrill: 8.43, stressArea: 65.2 },
    { standard: 'NPT', size: '1/4 NPT', pitch: 18, majorDia: 13.716, minorDia: 11.359, pitchDia: 12.487, tapDrill: 11.13, stressArea: 111.6 },
    { standard: 'NPT', size: '3/8 NPT', pitch: 18, majorDia: 17.145, minorDia: 14.796, pitchDia: 15.926, tapDrill: 14.27, stressArea: 185.3 },
    { standard: 'NPT', size: '1/2 NPT', pitch: 14, majorDia: 21.336, minorDia: 18.321, pitchDia: 19.772, tapDrill: 17.86, stressArea: 284.9 },
    { standard: 'NPT', size: '3/4 NPT', pitch: 14, majorDia: 26.670, minorDia: 23.665, pitchDia: 25.117, tapDrill: 23.01, stressArea: 467.2 },
    { standard: 'NPT', size: '1 NPT', pitch: 11.5, majorDia: 33.401, minorDia: 29.726, pitchDia: 31.461, tapDrill: 28.98, stressArea: 735.1 },
    { standard: 'NPT', size: '1-1/4 NPT', pitch: 11.5, majorDia: 42.164, minorDia: 38.451, pitchDia: 40.218, tapDrill: 37.69, stressArea: 1215.2 },
    { standard: 'NPT', size: '1-1/2 NPT', pitch: 11.5, majorDia: 48.260, minorDia: 44.524, pitchDia: 46.287, tapDrill: 43.66, stressArea: 1619.2 },
    { standard: 'NPT', size: '2 NPT', pitch: 11.5, majorDia: 60.325, minorDia: 56.558, pitchDia: 58.325, tapDrill: 55.58, stressArea: 2591.4 },
    { standard: 'NPT', size: '2-1/2 NPT', pitch: 8, majorDia: 73.025, minorDia: 67.628, pitchDia: 69.952, tapDrill: 66.68, stressArea: 3716.5 },
    { standard: 'NPT', size: '3 NPT', pitch: 8, majorDia: 88.900, minorDia: 83.503, pitchDia: 85.801, tapDrill: 82.55, stressArea: 5628.1 },
    { standard: 'NPT', size: '3-1/2 NPT', pitch: 8, majorDia: 101.600, minorDia: 96.203, pitchDia: 98.501, tapDrill: 95.25, stressArea: 7443.5 },
    { standard: 'NPT', size: '4 NPT', pitch: 8, majorDia: 114.300, minorDia: 108.903, pitchDia: 111.201, tapDrill: 107.95, stressArea: 9512.3 },
    { standard: 'NPT', size: '5 NPT', pitch: 8, majorDia: 141.300, minorDia: 135.903, pitchDia: 138.125, tapDrill: 134.94, stressArea: 14744.2 },
    { standard: 'NPT', size: '6 NPT', pitch: 8, majorDia: 168.275, minorDia: 162.878, pitchDia: 165.100, tapDrill: 161.93, stressArea: 21121.3 },

    // --- Trapezoidal (Tr) ---
    // DIN 103
    { standard: 'Trapezoidal (Tr)', size: 'Tr 10x2', pitch: 2, majorDia: 10, minorDia: 7.5, pitchDia: 9, tapDrill: 8.2, stressArea: 52 },
    { standard: 'Trapezoidal (Tr)', size: 'Tr 12x3', pitch: 3, majorDia: 12, minorDia: 8.5, pitchDia: 10.5, tapDrill: 9.2, stressArea: 69 },
    { standard: 'Trapezoidal (Tr)', size: 'Tr 16x4', pitch: 4, majorDia: 16, minorDia: 11.5, pitchDia: 14, tapDrill: 12.2, stressArea: 126 },
    { standard: 'Trapezoidal (Tr)', size: 'Tr 20x4', pitch: 4, majorDia: 20, minorDia: 15.5, pitchDia: 18, tapDrill: 16.2, stressArea: 217 },
    { standard: 'Trapezoidal (Tr)', size: 'Tr 24x5', pitch: 5, majorDia: 24, minorDia: 18.5, pitchDia: 21.5, tapDrill: 19.2, stressArea: 304 },
];
