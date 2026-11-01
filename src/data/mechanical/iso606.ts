/**
 * ISO 606 / DIN 8187 roller-chain sizes and ISO 10823 power rating.
 * Pure tables. No React.
 */

import { ROLLER_CHAIN_SIZES, type ChainSize } from './driveTypes';

export type Iso606ChainNo = '06B' | '08B' | '10B' | '12B' | '16B' | '20B' | '24B';
export type Iso606Strands = 1 | 2 | 3;

const ID_BY_NO: Record<string, string> = {
    '06B': '06b',
    '08B': '08b',
    '10B': '10b',
    '12B': '12b',
    '16B': '16b',
    '20B': '20b',
    '24B': '24b',
};

/** Duplex/triplex load-share vs simplex (ISO 10823 / DIN 8187 — not 2.0 / 3.0). */
export const ISO_606_STRAND_FACTOR: Record<Iso606Strands, number> = {
    1: 1.0,
    2: 1.7,
    3: 2.5,
};

export function normalizeIso606ChainNo(raw: string | undefined | null): Iso606ChainNo | undefined {
    if (!raw) return undefined;
    const s = String(raw).trim().toUpperCase().replace(/[\s/-]/g, '');
    const compact = s.endsWith('B') ? s : `${s}B`;
    if (compact in ID_BY_NO) return compact as Iso606ChainNo;
    return undefined;
}

export function resolveIso606Size(chainNo: string | undefined | null): ChainSize | undefined {
    const no = normalizeIso606ChainNo(chainNo);
    if (!no) return undefined;
    const id = ID_BY_NO[no];
    return ROLLER_CHAIN_SIZES.find((row) => row.id === id);
}

export function iso606SizeByPitch(pitchMm: number, tol = 0.05): ChainSize | undefined {
    return ROLLER_CHAIN_SIZES.find((row) => Math.abs(row.pitchMm - pitchMm) <= tol);
}

/**
 * ISO 10823 tooth factor. Reference sprocket z1 = 19.
 * Kz = (z1 / 19)^1.08
 */
export function iso10823ToothFactor(z1: number): number {
    const z = Math.max(9, z1);
    return Math.pow(z / 19, 1.08);
}

/**
 * Roller-impact speed derate. Kv = 1 − 0.45 (v/vmax)^1.5, floor 0.25.
 */
export function iso10823SpeedFactor(v: number, vMax: number): number {
    if (!(vMax > 0) || !(v > 0)) return 1;
    return Math.max(0.25, 1 - 0.45 * Math.pow(v / vMax, 1.5));
}

/**
 * Simplex/duplex rated power (kW).
 * P = (F_work / 1000) · v · Kz · Kstrand · Kv
 * F_work is the ISO 606 recommended working load of the simplex chain (N).
 */
export function iso606RatedPowerKw(input: {
    size: ChainSize;
    z1: number;
    v_m_s: number;
    strands: Iso606Strands;
}): number {
    const Kz = iso10823ToothFactor(input.z1);
    const Ks = ISO_606_STRAND_FACTOR[input.strands] ?? 1;
    const Kv = iso10823SpeedFactor(input.v_m_s, input.size.maxSpeedMs);
    return (input.size.recommendedWorkingLoadN / 1000) * input.v_m_s * Kz * Ks * Kv;
}

export function iso606BreakingLoadN(size: ChainSize, strands: Iso606Strands): number {
    return size.breakingLoadN * (ISO_606_STRAND_FACTOR[strands] ?? 1);
}
