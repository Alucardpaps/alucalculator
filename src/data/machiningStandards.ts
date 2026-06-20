/**
 * Machining standards database - verified against authoritative sources.
 *
 * Sources:
 * - DIN 6885-1: fasten.it (Beuth/DIN reproduction)
 * - DIN 471 / DIN 472: hc-maschinentechnik.de (DIN 471:2011 table)
 * - DIN 912 / ISO 4762: ISO catalog values
 * - ISO 273: clearance hole series
 */

export interface RangeRow {
    min: number;
    max: number;
}

export interface KeywayRow extends RangeRow {
    b: number;
    h: number;
    t1: number;
    t2: number;
    /** Minimum hub bore = shaft d + d2Offset (DIN 6885-1) */
    d2Offset: number;
}

export interface CirclipRow {
    /** Nominal shaft/bore diameter (mm) */
    d1: number;
    /** Groove diameter d2 (mm) */
    d2: number;
    /** Groove width m (mm) */
    m: number;
    /** Ring thickness s (mm) */
    s: number;
}

export interface ImbusRow {
    size: string;
    d: number;
    dk: number;
    k: number;
    D: number;
    T: number;
}

export interface ClearanceHoleRow {
    size: string;
    d: number;
    fine: number;
    normal: number;
    coarse: number;
}

export type KeywayFitClass = 'normal' | 'free' | 'tight';

/** DIN 6885-1 parallel key table (shaft d1 over-to ranges, mm) */
export const DIN_6885: KeywayRow[] = [
    { min: 6, max: 8, b: 2, h: 2, t1: 1.2, t2: 1.0, d2Offset: 2.5 },
    { min: 8, max: 10, b: 3, h: 3, t1: 1.8, t2: 1.4, d2Offset: 3.5 },
    { min: 10, max: 12, b: 4, h: 4, t1: 2.5, t2: 1.8, d2Offset: 4.0 },
    { min: 12, max: 17, b: 5, h: 5, t1: 3.0, t2: 2.3, d2Offset: 5.0 },
    { min: 17, max: 22, b: 6, h: 6, t1: 3.5, t2: 2.8, d2Offset: 6.0 },
    { min: 22, max: 30, b: 8, h: 7, t1: 4.0, t2: 3.3, d2Offset: 8.0 },
    { min: 30, max: 38, b: 10, h: 8, t1: 5.0, t2: 3.3, d2Offset: 8.0 },
    { min: 38, max: 44, b: 12, h: 8, t1: 5.0, t2: 3.3, d2Offset: 8.0 },
    { min: 44, max: 50, b: 14, h: 9, t1: 5.5, t2: 3.8, d2Offset: 9.0 },
    { min: 50, max: 58, b: 16, h: 10, t1: 6.0, t2: 4.3, d2Offset: 11.0 },
    { min: 58, max: 65, b: 18, h: 11, t1: 7.0, t2: 4.4, d2Offset: 11.0 },
    { min: 65, max: 75, b: 20, h: 12, t1: 7.5, t2: 4.9, d2Offset: 12.0 },
    { min: 75, max: 85, b: 22, h: 14, t1: 9.0, t2: 5.4, d2Offset: 14.0 },
    { min: 85, max: 95, b: 25, h: 14, t1: 9.0, t2: 5.4, d2Offset: 14.0 },
    { min: 95, max: 110, b: 28, h: 16, t1: 10.0, t2: 6.4, d2Offset: 16.0 },
    { min: 110, max: 130, b: 32, h: 18, t1: 11.0, t2: 7.4, d2Offset: 18.0 },
    { min: 130, max: 150, b: 36, h: 20, t1: 12.0, t2: 8.4, d2Offset: 21.0 },
    { min: 150, max: 170, b: 40, h: 22, t1: 13.0, t2: 9.4, d2Offset: 23.0 },
    { min: 170, max: 200, b: 45, h: 25, t1: 15.0, t2: 10.4, d2Offset: 26.0 },
    { min: 200, max: 230, b: 50, h: 28, t1: 17.0, t2: 11.4, d2Offset: 28.0 },
    { min: 230, max: 260, b: 56, h: 32, t1: 20.0, t2: 12.4, d2Offset: 32.0 },
    { min: 260, max: 290, b: 63, h: 32, t1: 20.0, t2: 12.4, d2Offset: 32.0 },
    { min: 290, max: 330, b: 70, h: 36, t1: 22.0, t2: 14.4, d2Offset: 36.0 },
    { min: 330, max: 380, b: 80, h: 40, t1: 25.0, t2: 15.4, d2Offset: 40.0 },
    { min: 380, max: 440, b: 90, h: 45, t1: 28.0, t2: 17.4, d2Offset: 45.0 },
    { min: 440, max: 500, b: 100, h: 50, t1: 31.0, t2: 19.5, d2Offset: 50.0 },
];

/** Standard key lengths (mm) per DIN 6885-1 form B */
export const DIN_6885_LENGTHS: Record<number, number[]> = {
    2: [6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32],
    3: [6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32, 36, 40, 45, 50, 56, 63, 70, 80],
    4: [8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32, 36, 40, 45, 50, 56, 63, 70, 80, 90, 100],
    5: [10, 12, 14, 16, 18, 20, 22, 25, 28, 32, 36, 40, 45, 50, 56, 63, 70, 80, 90, 100, 110, 125],
    6: [14, 16, 18, 20, 22, 25, 28, 32, 36, 40, 45, 50, 56, 63, 70, 80, 90, 100, 110, 125, 140],
    8: [18, 20, 22, 25, 28, 32, 36, 40, 45, 50, 56, 63, 70, 80, 90, 100, 110, 125, 140, 160],
    10: [22, 25, 28, 32, 36, 40, 45, 50, 56, 63, 70, 80, 90, 100, 110, 125, 140, 160, 180],
    12: [28, 32, 36, 40, 45, 50, 56, 63, 70, 80, 90, 100, 110, 125, 140, 160, 180, 200],
    14: [36, 40, 45, 50, 56, 63, 70, 80, 90, 100, 110, 125, 140, 160, 180, 200, 220],
    16: [45, 50, 56, 63, 70, 80, 90, 100, 110, 125, 140, 160, 180, 200, 220, 250],
    18: [50, 56, 63, 70, 80, 90, 100, 110, 125, 140, 160, 180, 200, 220, 250, 280],
    20: [56, 63, 70, 80, 90, 100, 110, 125, 140, 160, 180, 200, 220, 250, 280, 315],
    22: [63, 70, 80, 90, 100, 110, 125, 140, 160, 180, 200, 220, 250, 280, 315, 355],
    25: [70, 80, 90, 100, 110, 125, 140, 160, 180, 200, 220, 250, 280, 315, 355, 400],
    28: [80, 90, 100, 110, 125, 140, 160, 180, 200, 220, 250, 280, 315, 355, 400],
    32: [90, 100, 110, 125, 140, 160, 180, 200, 220, 250, 280, 315, 355, 400],
    36: [100, 110, 125, 140, 160, 180, 200, 220, 250, 280, 315, 355, 400],
    40: [100, 110, 125, 140, 160, 180, 200, 220, 250, 280, 315, 355, 400],
    45: [110, 125, 140, 160, 180, 200, 220, 250, 280, 315, 355, 400],
    50: [125, 140, 160, 180, 200, 220, 250, 280, 315, 355, 400],
    56: [140, 160, 180, 200, 220, 250, 280, 315, 355, 400],
    63: [160, 180, 200, 220, 250, 280, 315, 355, 400],
    70: [180, 200, 220, 250, 280, 315, 355, 400],
    80: [200, 220, 250, 280, 315, 355, 400],
    90: [220, 250, 280, 315, 355, 400],
    100: [250, 280, 315, 355, 400],
};

/** Key width tolerances (mm) - DIN 6885 / ISO 286 simplified */
export const KEYWAY_FIT_TOLERANCES: Record<KeywayFitClass, { shaft: string; hub: string; key: string; shaftTol: [number, number]; hubTol: [number, number] }> = {
    normal: { shaft: 'P9', hub: 'JS9', key: 'h9', shaftTol: [-0.03, 0], hubTol: [-0.02, 0.02] },
    free: { shaft: 'D10', hub: 'H11', key: 'h9', shaftTol: [-0.05, 0], hubTol: [0, 0.06] },
    tight: { shaft: 'N9', hub: 'P9', key: 'h9', shaftTol: [-0.02, 0], hubTol: [-0.03, 0] },
};

/** DIN 471 shaft circlips - verified hc-maschinentechnik.de */
export const DIN_471: CirclipRow[] = [
    { d1: 3, d2: 2.8, m: 0.5, s: 0.4 },
    { d1: 4, d2: 3.8, m: 0.5, s: 0.4 },
    { d1: 5, d2: 4.8, m: 0.7, s: 0.6 },
    { d1: 6, d2: 5.7, m: 0.8, s: 0.7 },
    { d1: 7, d2: 6.7, m: 0.9, s: 0.8 },
    { d1: 8, d2: 7.6, m: 0.9, s: 0.8 },
    { d1: 9, d2: 8.6, m: 1.1, s: 1.0 },
    { d1: 10, d2: 9.6, m: 1.1, s: 1.0 },
    { d1: 11, d2: 10.5, m: 1.1, s: 1.0 },
    { d1: 12, d2: 11.5, m: 1.1, s: 1.0 },
    { d1: 13, d2: 12.4, m: 1.1, s: 1.0 },
    { d1: 14, d2: 13.4, m: 1.1, s: 1.0 },
    { d1: 15, d2: 14.3, m: 1.1, s: 1.0 },
    { d1: 16, d2: 15.2, m: 1.1, s: 1.0 },
    { d1: 17, d2: 16.2, m: 1.1, s: 1.0 },
    { d1: 18, d2: 17.0, m: 1.3, s: 1.2 },
    { d1: 19, d2: 18.0, m: 1.3, s: 1.2 },
    { d1: 20, d2: 19.0, m: 1.3, s: 1.2 },
    { d1: 21, d2: 20.0, m: 1.3, s: 1.2 },
    { d1: 22, d2: 21.0, m: 1.3, s: 1.2 },
    { d1: 23, d2: 22.0, m: 1.3, s: 1.2 },
    { d1: 24, d2: 22.9, m: 1.3, s: 1.2 },
    { d1: 25, d2: 23.9, m: 1.3, s: 1.2 },
    { d1: 26, d2: 24.9, m: 1.3, s: 1.2 },
    { d1: 27, d2: 25.6, m: 1.3, s: 1.2 },
    { d1: 28, d2: 26.6, m: 1.6, s: 1.5 },
    { d1: 29, d2: 27.6, m: 1.6, s: 1.5 },
    { d1: 30, d2: 28.6, m: 1.6, s: 1.5 },
    { d1: 31, d2: 29.3, m: 1.6, s: 1.5 },
    { d1: 32, d2: 30.3, m: 1.6, s: 1.5 },
    { d1: 33, d2: 31.3, m: 1.6, s: 1.5 },
    { d1: 34, d2: 32.3, m: 1.6, s: 1.5 },
    { d1: 35, d2: 33.0, m: 1.6, s: 1.5 },
    { d1: 36, d2: 34.0, m: 1.85, s: 1.75 },
    { d1: 37, d2: 35.0, m: 1.85, s: 1.75 },
    { d1: 38, d2: 36.0, m: 1.85, s: 1.75 },
    { d1: 39, d2: 37.0, m: 1.85, s: 1.75 },
    { d1: 40, d2: 37.5, m: 1.85, s: 1.75 },
    { d1: 41, d2: 38.5, m: 1.85, s: 1.75 },
    { d1: 42, d2: 39.5, m: 1.85, s: 1.75 },
    { d1: 44, d2: 41.5, m: 1.85, s: 1.75 },
    { d1: 45, d2: 42.5, m: 1.85, s: 1.75 },
    { d1: 46, d2: 43.5, m: 1.85, s: 1.75 },
    { d1: 47, d2: 44.5, m: 1.85, s: 1.75 },
    { d1: 48, d2: 45.5, m: 1.85, s: 1.75 },
    { d1: 50, d2: 47.0, m: 2.15, s: 2.0 },
    { d1: 52, d2: 49.0, m: 2.15, s: 2.0 },
    { d1: 54, d2: 51.0, m: 2.15, s: 2.0 },
    { d1: 55, d2: 52.0, m: 2.15, s: 2.0 },
    { d1: 56, d2: 53.0, m: 2.15, s: 2.0 },
    { d1: 57, d2: 54.0, m: 2.15, s: 2.0 },
    { d1: 58, d2: 55.0, m: 2.15, s: 2.0 },
    { d1: 60, d2: 57.0, m: 2.15, s: 2.0 },
    { d1: 62, d2: 59.0, m: 2.15, s: 2.0 },
    { d1: 63, d2: 60.0, m: 2.15, s: 2.0 },
    { d1: 65, d2: 62.0, m: 2.65, s: 2.5 },
    { d1: 67, d2: 64.0, m: 2.65, s: 2.5 },
    { d1: 68, d2: 65.0, m: 2.65, s: 2.5 },
    { d1: 70, d2: 67.0, m: 2.65, s: 2.5 },
    { d1: 72, d2: 69.0, m: 2.65, s: 2.5 },
    { d1: 75, d2: 72.0, m: 2.65, s: 2.5 },
    { d1: 77, d2: 74.0, m: 2.65, s: 2.5 },
    { d1: 78, d2: 75.0, m: 2.65, s: 2.5 },
    { d1: 80, d2: 76.5, m: 2.65, s: 2.5 },
    { d1: 82, d2: 78.5, m: 2.65, s: 2.5 },
    { d1: 85, d2: 81.5, m: 3.15, s: 3.0 },
    { d1: 87, d2: 83.5, m: 3.15, s: 3.0 },
    { d1: 88, d2: 84.5, m: 3.15, s: 3.0 },
    { d1: 90, d2: 86.5, m: 3.15, s: 3.0 },
    { d1: 92, d2: 88.5, m: 3.15, s: 3.0 },
    { d1: 95, d2: 91.5, m: 3.15, s: 3.0 },
    { d1: 97, d2: 93.5, m: 3.15, s: 3.0 },
    { d1: 98, d2: 94.5, m: 3.15, s: 3.0 },
    { d1: 100, d2: 96.5, m: 3.15, s: 3.0 },
    { d1: 105, d2: 101.0, m: 4.15, s: 4.0 },
    { d1: 108, d2: 104.0, m: 4.15, s: 4.0 },
    { d1: 110, d2: 106.0, m: 4.15, s: 4.0 },
    { d1: 112, d2: 108.0, m: 4.15, s: 4.0 },
    { d1: 115, d2: 111.0, m: 4.15, s: 4.0 },
    { d1: 120, d2: 116.0, m: 4.15, s: 4.0 },
    { d1: 125, d2: 121.0, m: 4.15, s: 4.0 },
    { d1: 130, d2: 126.0, m: 4.15, s: 4.0 },
];

/** DIN 472 bore circlips - verified hc-maschinentechnik.de */
export const DIN_472: CirclipRow[] = [
    { d1: 8, d2: 8.4, m: 0.9, s: 0.8 },
    { d1: 9, d2: 9.4, m: 0.9, s: 0.8 },
    { d1: 10, d2: 10.4, m: 1.1, s: 1.0 },
    { d1: 11, d2: 11.4, m: 1.1, s: 1.0 },
    { d1: 12, d2: 12.5, m: 1.1, s: 1.0 },
    { d1: 13, d2: 13.6, m: 1.1, s: 1.0 },
    { d1: 14, d2: 14.6, m: 1.1, s: 1.0 },
    { d1: 15, d2: 15.7, m: 1.1, s: 1.0 },
    { d1: 16, d2: 16.8, m: 1.1, s: 1.0 },
    { d1: 17, d2: 17.8, m: 1.1, s: 1.0 },
    { d1: 18, d2: 19.0, m: 1.1, s: 1.0 },
    { d1: 19, d2: 20.0, m: 1.1, s: 1.0 },
    { d1: 20, d2: 21.0, m: 1.1, s: 1.0 },
    { d1: 21, d2: 22.0, m: 1.1, s: 1.0 },
    { d1: 22, d2: 23.0, m: 1.1, s: 1.0 },
    { d1: 23, d2: 24.1, m: 1.3, s: 1.2 },
    { d1: 24, d2: 25.2, m: 1.3, s: 1.2 },
    { d1: 25, d2: 26.2, m: 1.3, s: 1.2 },
    { d1: 26, d2: 27.2, m: 1.3, s: 1.2 },
    { d1: 27, d2: 28.4, m: 1.3, s: 1.2 },
    { d1: 28, d2: 29.4, m: 1.3, s: 1.2 },
    { d1: 29, d2: 30.4, m: 1.3, s: 1.2 },
    { d1: 30, d2: 31.4, m: 1.3, s: 1.2 },
    { d1: 31, d2: 32.7, m: 1.3, s: 1.2 },
    { d1: 32, d2: 33.7, m: 1.3, s: 1.2 },
    { d1: 33, d2: 34.7, m: 1.3, s: 1.2 },
    { d1: 34, d2: 35.7, m: 1.6, s: 1.5 },
    { d1: 35, d2: 37.0, m: 1.6, s: 1.5 },
    { d1: 36, d2: 38.0, m: 1.6, s: 1.5 },
    { d1: 37, d2: 39.0, m: 1.6, s: 1.5 },
    { d1: 38, d2: 40.0, m: 1.6, s: 1.5 },
    { d1: 39, d2: 41.0, m: 1.6, s: 1.5 },
    { d1: 40, d2: 42.5, m: 1.85, s: 1.75 },
    { d1: 41, d2: 43.5, m: 1.85, s: 1.75 },
    { d1: 42, d2: 44.5, m: 1.85, s: 1.75 },
    { d1: 44, d2: 46.5, m: 1.85, s: 1.75 },
    { d1: 45, d2: 47.5, m: 1.85, s: 1.75 },
    { d1: 46, d2: 48.5, m: 1.85, s: 1.75 },
    { d1: 47, d2: 49.5, m: 1.85, s: 1.75 },
    { d1: 48, d2: 50.5, m: 1.85, s: 1.75 },
    { d1: 50, d2: 53.0, m: 2.15, s: 2.0 },
    { d1: 51, d2: 54.0, m: 2.15, s: 2.0 },
    { d1: 52, d2: 55.0, m: 2.15, s: 2.0 },
    { d1: 53, d2: 56.0, m: 2.15, s: 2.0 },
    { d1: 54, d2: 57.0, m: 2.15, s: 2.0 },
    { d1: 55, d2: 58.0, m: 2.15, s: 2.0 },
    { d1: 56, d2: 59.0, m: 2.15, s: 2.0 },
    { d1: 57, d2: 60.0, m: 2.15, s: 2.0 },
    { d1: 58, d2: 61.0, m: 2.15, s: 2.0 },
    { d1: 60, d2: 63.0, m: 2.15, s: 2.0 },
    { d1: 62, d2: 65.0, m: 2.15, s: 2.0 },
    { d1: 63, d2: 66.0, m: 2.15, s: 2.0 },
    { d1: 64, d2: 67.0, m: 2.15, s: 2.0 },
    { d1: 65, d2: 68.0, m: 2.65, s: 2.5 },
    { d1: 67, d2: 70.0, m: 2.65, s: 2.5 },
    { d1: 68, d2: 71.0, m: 2.65, s: 2.5 },
    { d1: 70, d2: 73.0, m: 2.65, s: 2.5 },
    { d1: 72, d2: 75.0, m: 2.65, s: 2.5 },
    { d1: 75, d2: 78.0, m: 2.65, s: 2.5 },
    { d1: 77, d2: 80.0, m: 2.65, s: 2.5 },
    { d1: 78, d2: 81.0, m: 2.65, s: 2.5 },
    { d1: 80, d2: 83.5, m: 2.65, s: 2.5 },
    { d1: 82, d2: 85.5, m: 2.65, s: 2.5 },
    { d1: 85, d2: 88.5, m: 3.15, s: 3.0 },
    { d1: 88, d2: 91.5, m: 3.15, s: 3.0 },
    { d1: 90, d2: 93.5, m: 3.15, s: 3.0 },
    { d1: 92, d2: 95.5, m: 3.15, s: 3.0 },
    { d1: 95, d2: 98.5, m: 3.15, s: 3.0 },
    { d1: 97, d2: 100.5, m: 3.15, s: 3.0 },
    { d1: 98, d2: 101.5, m: 3.15, s: 3.0 },
    { d1: 100, d2: 103.5, m: 3.15, s: 3.0 },
    { d1: 105, d2: 108.5, m: 4.15, s: 4.0 },
    { d1: 108, d2: 111.5, m: 4.15, s: 4.0 },
    { d1: 110, d2: 113.5, m: 4.15, s: 4.0 },
    { d1: 112, d2: 115.5, m: 4.15, s: 4.0 },
    { d1: 115, d2: 118.5, m: 4.15, s: 4.0 },
    { d1: 120, d2: 123.5, m: 4.15, s: 4.0 },
    { d1: 125, d2: 128.5, m: 4.15, s: 4.0 },
    { d1: 130, d2: 133.5, m: 4.15, s: 4.0 },
];

/** ISO 273 clearance holes (mm) */
export const ISO_273_CLEARANCE: ClearanceHoleRow[] = [
    { size: 'M3', d: 3, fine: 3.4, normal: 3.6, coarse: 4.0 },
    { size: 'M4', d: 4, fine: 4.5, normal: 4.8, coarse: 5.3 },
    { size: 'M5', d: 5, fine: 5.5, normal: 5.8, coarse: 6.4 },
    { size: 'M6', d: 6, fine: 6.6, normal: 7.0, coarse: 7.7 },
    { size: 'M8', d: 8, fine: 9.0, normal: 9.5, coarse: 10.5 },
    { size: 'M10', d: 10, fine: 11.0, normal: 11.5, coarse: 12.5 },
    { size: 'M12', d: 12, fine: 13.5, normal: 14.0, coarse: 15.5 },
    { size: 'M14', d: 14, fine: 15.5, normal: 16.0, coarse: 17.5 },
    { size: 'M16', d: 16, fine: 17.5, normal: 18.0, coarse: 20.0 },
    { size: 'M20', d: 20, fine: 22.0, normal: 22.5, coarse: 24.5 },
    { size: 'M24', d: 24, fine: 26.0, normal: 26.5, coarse: 28.5 },
    { size: 'M30', d: 30, fine: 33.0, normal: 34.0, coarse: 37.0 },
];

export const DIN_912: ImbusRow[] = [
    { size: 'M3', d: 3, dk: 5.5, k: 3, D: 6.5, T: 3.4 },
    { size: 'M4', d: 4, dk: 7, k: 4, D: 8, T: 4.4 },
    { size: 'M5', d: 5, dk: 8.5, k: 5, D: 10, T: 5.4 },
    { size: 'M6', d: 6, dk: 10, k: 6, D: 11, T: 6.4 },
    { size: 'M8', d: 8, dk: 13, k: 8, D: 15, T: 8.6 },
    { size: 'M10', d: 10, dk: 16, k: 10, D: 18, T: 10.6 },
    { size: 'M12', d: 12, dk: 18, k: 12, D: 20, T: 12.6 },
    { size: 'M16', d: 16, dk: 24, k: 16, D: 26, T: 16.8 },
    { size: 'M20', d: 20, dk: 30, k: 20, D: 33, T: 20.8 },
    { size: 'M24', d: 24, dk: 36, k: 24, D: 40, T: 24.8 },
];

export const DIN_332 = [
    { type: 'A 1.0x2.12', d1: 1.0, d2: 2.12, t: 1.5 },
    { type: 'A 1.6x3.36', d1: 1.6, d2: 3.36, t: 2.0 },
    { type: 'A 2.0x4.25', d1: 2.0, d2: 4.25, t: 2.5 },
    { type: 'A 2.5x5.3', d1: 2.5, d2: 5.3, t: 3.1 },
    { type: 'A 3.15x6.7', d1: 3.15, d2: 6.7, t: 3.9 },
    { type: 'A 4.0x8.5', d1: 4.0, d2: 8.5, t: 5.0 },
    { type: 'A 5.0x10.6', d1: 5.0, d2: 10.6, t: 6.3 },
    { type: 'A 6.3x13.2', d1: 6.3, d2: 13.2, t: 8.0 },
];

export const DIN_7991 = [
    { size: 'M3', d: 3, d1: 3.4, d2: 6.6, t: 1.6, alpha: 90 },
    { size: 'M4', d: 4, d1: 4.5, d2: 9.0, t: 2.25, alpha: 90 },
    { size: 'M5', d: 5, d1: 5.5, d2: 11.0, t: 2.75, alpha: 90 },
    { size: 'M6', d: 6, d1: 6.6, d2: 13.0, t: 3.2, alpha: 90 },
    { size: 'M8', d: 8, d1: 9.0, d2: 17.2, t: 4.1, alpha: 90 },
    { size: 'M10', d: 10, d1: 11.0, d2: 21.5, t: 5.25, alpha: 90 },
    { size: 'M12', d: 12, d1: 13.5, d2: 25.5, t: 6.0, alpha: 90 },
    { size: 'M16', d: 16, d1: 17.5, d2: 33.0, t: 7.75, alpha: 90 },
    { size: 'M20', d: 20, d1: 22.0, d2: 40.0, t: 9.0, alpha: 90 },
];

export const DIN_509 = [
    { min: 6, max: 10, r: 0.4, t: 0.1 },
    { min: 10, max: 18, r: 0.6, t: 0.1 },
    { min: 18, max: 30, r: 1.0, t: 0.1 },
    { min: 30, max: 50, r: 1.6, t: 0.1 },
    { min: 50, max: 80, r: 2.0, t: 0.1 },
    { min: 80, max: 120, r: 3.0, t: 0.1 },
];

export const STANDARD_SOURCES = {
    keyway: 'DIN 6885-1 (fasten.it / Beuth)',
    circlip471: 'DIN 471:2011 (hc-maschinentechnik.de)',
    circlip472: 'DIN 472:2011 (hc-maschinentechnik.de)',
    imbus: 'DIN 912 / ISO 4762',
    clearance: 'ISO 273',
    centerdrill: 'DIN 332 Form A',
    countersink: 'DIN 7991 / DIN 74 Form F',
    undercut: 'DIN 509',
} as const;

export function findRangeRow<T extends RangeRow>(table: T[], d: number): T | null {
    if (d < table[0].min) return null;
    const row = table.find(r => d >= r.min && d < r.max);
    if (row) return row;
    const last = table[table.length - 1];
    if (d >= last.min && d <= last.max) return last;
    return null;
}

export function getKeywayData(d: number): (KeywayRow & { hubMinBore: number; recommendedLengths: number[] }) | null {
    const row = findRangeRow(DIN_6885, d);
    if (!row) return null;
    return {
        ...row,
        hubMinBore: d + row.d2Offset,
        recommendedLengths: DIN_6885_LENGTHS[row.b] ?? [],
    };
}

export function getKeywayTolerances(b: number, fit: KeywayFitClass) {
    const fitData = KEYWAY_FIT_TOLERANCES[fit];
    const scale = b <= 10 ? 1 : b <= 25 ? 1.5 : 2;
    return {
        ...fitData,
        bShaft: `${b}${fitData.shaftTol[0] * scale} / ${b}${fitData.shaftTol[1] >= 0 ? '+' : ''}${fitData.shaftTol[1] * scale}`,
        bHub: `${b}${fitData.hubTol[0] * scale} / +${fitData.hubTol[1] * scale}`,
    };
}

export interface CirclipResult {
    d: number;
    d1: number;
    d2: number;
    m: string;
    s: string;
    depth: number;
    nominalSize: number;
    snapped: boolean;
}

export function getCirclipData(d: number, isShaft: boolean): CirclipResult | null {
    const table = isShaft ? DIN_471 : DIN_472;
    const minD = table[0].d1;
    const maxD = table[table.length - 1].d1;
    if (d < minD || d > maxD) return null;

    const exact = table.find(r => r.d1 === d);
    const row = exact ?? table.reduce((best, r) =>
        Math.abs(r.d1 - d) < Math.abs(best.d1 - d) ? r : best
    );

    const depth = isShaft
        ? (row.d1 - row.d2) / 2
        : (row.d2 - row.d1) / 2;

    return {
        d,
        d1: d,
        d2: row.d2,
        m: row.m.toFixed(2),
        s: row.s.toFixed(2),
        depth: Math.round(depth * 100) / 100,
        nominalSize: row.d1,
        snapped: !exact,
    };
}

export function getUndercutData(dSmall: number) {
    return DIN_509.find(u => dSmall >= u.min && dSmall < u.max) || DIN_509[DIN_509.length - 1];
}

export function getClearanceHole(size: string, series: 'fine' | 'normal' | 'coarse' = 'normal') {
    const row = ISO_273_CLEARANCE.find(r => r.size === size);
    return row ? row[series] : null;
}
