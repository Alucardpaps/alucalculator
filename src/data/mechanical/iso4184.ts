/**
 * ISO 4184 / DIN 2215 V-belt sections and datum (pitch) lengths.
 * Pure tables + closed-form rating. No React, no unit casting.
 *
 * Classical Z/A/B/C = DIN 2215 / ISO 4184 classical.
 * Narrow SPZ/SPA/SPB/SPC = ISO 4184 wedge (ISO 4183 groove).
 */

export type Iso4184SectionId = 'Z' | 'A' | 'B' | 'C' | 'SPZ' | 'SPA' | 'SPB' | 'SPC';

export interface Iso4184Section {
    id: Iso4184SectionId;
    family: 'classical' | 'narrow';
    aliases: string[];
    topWidthMm: number;
    heightMm: number;
    dMinMm: number;
    vMaxMs: number;
    grooveAngleDeg: number;
    /** Nominal kW at 10 m/s on a pulley at dMin (locked rating seed). */
    P10_kW: number;
    LrefMm: number;
    LdMinMm: number;
    LdMaxMm: number;
}

/** ISO 4184 preferred datum lengths (mm), industrial subset. */
export const ISO_4184_LD_MM: readonly number[] = [
    630, 670, 710, 750, 800, 850, 900, 950, 1000, 1060, 1120, 1180, 1250, 1320,
    1400, 1500, 1600, 1700, 1800, 1900, 2000, 2120, 2240, 2360, 2500, 2650,
    2800, 3000, 3150, 3350, 3550, 3750, 4000, 4250, 4500, 4750, 5000, 5300, 5600, 6000,
];

export const ISO_4184_SECTIONS: Record<Iso4184SectionId, Iso4184Section> = {
    Z: {
        id: 'Z', family: 'classical', aliases: ['z', 'Z', '10x6'],
        topWidthMm: 10, heightMm: 6, dMinMm: 50, vMaxMs: 30, grooveAngleDeg: 40,
        P10_kW: 0.8, LrefMm: 1600, LdMinMm: 630, LdMaxMm: 2500,
    },
    A: {
        id: 'A', family: 'classical', aliases: ['a', 'A', '13x8'],
        topWidthMm: 13, heightMm: 8, dMinMm: 75, vMaxMs: 30, grooveAngleDeg: 40,
        P10_kW: 1.4, LrefMm: 1600, LdMinMm: 630, LdMaxMm: 5000,
    },
    B: {
        id: 'B', family: 'classical', aliases: ['b', 'B', '17x11'],
        topWidthMm: 17, heightMm: 11, dMinMm: 125, vMaxMs: 30, grooveAngleDeg: 40,
        P10_kW: 3.2, LrefMm: 2000, LdMinMm: 900, LdMaxMm: 6000,
    },
    C: {
        id: 'C', family: 'classical', aliases: ['c', 'C', '22x14'],
        topWidthMm: 22, heightMm: 14, dMinMm: 200, vMaxMs: 30, grooveAngleDeg: 40,
        P10_kW: 7.0, LrefMm: 2500, LdMinMm: 1400, LdMaxMm: 6000,
    },
    SPZ: {
        id: 'SPZ', family: 'narrow', aliases: ['spz', 'SPZ', '9.7x8'],
        topWidthMm: 9.7, heightMm: 8, dMinMm: 63, vMaxMs: 40, grooveAngleDeg: 38,
        P10_kW: 2.0, LrefMm: 1600, LdMinMm: 630, LdMaxMm: 3550,
    },
    SPA: {
        id: 'SPA', family: 'narrow', aliases: ['spa', 'SPA', '12.7x10'],
        topWidthMm: 12.7, heightMm: 10, dMinMm: 90, vMaxMs: 40, grooveAngleDeg: 38,
        P10_kW: 4.0, LrefMm: 1600, LdMinMm: 800, LdMaxMm: 4000,
    },
    SPB: {
        id: 'SPB', family: 'narrow', aliases: ['spb', 'SPB', '16.3x13'],
        topWidthMm: 16.3, heightMm: 13, dMinMm: 140, vMaxMs: 40, grooveAngleDeg: 38,
        P10_kW: 8.0, LrefMm: 2000, LdMinMm: 1120, LdMaxMm: 5000,
    },
    SPC: {
        id: 'SPC', family: 'narrow', aliases: ['spc', 'SPC', '22x18'],
        topWidthMm: 22, heightMm: 18, dMinMm: 224, vMaxMs: 40, grooveAngleDeg: 38,
        P10_kW: 15.0, LrefMm: 2500, LdMinMm: 2000, LdMaxMm: 6000,
    },
};

export function resolveIso4184Section(id: string | undefined | null): Iso4184Section | undefined {
    if (!id) return undefined;
    const raw = String(id).trim();
    const upper = raw.toUpperCase();
    if (upper in ISO_4184_SECTIONS) return ISO_4184_SECTIONS[upper as Iso4184SectionId];
    for (const section of Object.values(ISO_4184_SECTIONS)) {
        if (section.aliases.some((a) => a.toUpperCase() === upper)) return section;
    }
    return undefined;
}

export function iso4184DatumSeries(section: Iso4184Section): number[] {
    return ISO_4184_LD_MM.filter((Ld) => Ld >= section.LdMinMm && Ld <= section.LdMaxMm);
}

/** Nearest ISO 4184 datum length for this section. */
export function snapIso4184DatumLength(Lth: number, section: Iso4184Section): number {
    const series = iso4184DatumSeries(section);
    if (series.length === 0) return Lth;
    let best = series[0];
    let bestErr = Math.abs(best - Lth);
    for (const Ld of series) {
        const err = Math.abs(Ld - Lth);
        if (err < bestErr) {
            best = Ld;
            bestErr = err;
        }
    }
    return best;
}

/**
 * Open-drive pitch length (ISO 4184 / DIN 2215).
 * L = 2C + π(d1+d2)/2 + (d2−d1)²/(4C)
 */
export function openDrivePitchLengthMm(d1: number, d2: number, C: number): number {
    return 2 * C + (Math.PI / 2) * (d1 + d2) + ((d2 - d1) * (d2 - d1)) / (4 * C);
}

/**
 * Back-solve center distance from a catalog datum length.
 * 2C² − (L − π(d1+d2)/2) C + ((d2−d1)/2)² = 0
 */
export function centerFromDatumLengthMm(d1: number, d2: number, Ld: number): number {
    const alpha = (Math.PI / 2) * (d1 + d2);
    const beta = ((d2 - d1) / 2) ** 2;
    const s = Ld - alpha;
    const disc = Math.max(0, s * s - 8 * beta);
    return (s + Math.sqrt(disc)) / 4;
}

/**
 * Locked ISO 4184-style single-belt power (kW).
 * P = P10 · (v/10) · Kd · Kθ · KL · Kv
 *   Kd = 1 − 0.15 (dmin/d1)     small-pulley derate
 *   Kθ = θ°/180                 wrap (180° = 1)
 *   KL = (Ld / Lref)^0.09       length correction
 *   Kv = 1 − (v/vmax)²          centrifugal
 */
export function iso4184PowerKw(
    section: Iso4184Section,
    d1: number,
    v: number,
    wrapDeg: number,
    Ld: number
): number {
    if (!(d1 > 0) || !(v > 0) || d1 < section.dMinMm) return 0;
    const Kd = 1 - 0.15 * (section.dMinMm / d1);
    const Ktheta = Math.min(1.15, wrapDeg / 180);
    const KL = Math.pow(Math.max(0.25, Ld / section.LrefMm), 0.09);
    const Kv = Math.max(0.15, 1 - (v / section.vMaxMs) ** 2);
    return section.P10_kW * (v / 10) * Kd * Ktheta * KL * Kv;
}
