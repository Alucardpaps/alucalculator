import type { EngineeringNodeSchema, ValidationResult } from '@/flow/types/core';
import { chainDriveDxf } from '@/export/dxf/schematics';
import {
    iso10823SpeedFactor,
    iso10823ToothFactor,
    iso606BreakingLoadN,
    iso606RatedPowerKw,
    iso606SizeByPitch,
    normalizeIso606ChainNo,
    resolveIso606Size,
    type Iso606Strands,
} from '@/data/mechanical/iso606';
import type { ChainSize } from '@/data/mechanical/driveTypes';

/**
 * Roller chain drive — ISO 606 / DIN 8187 geometry + ISO 10823 power rating.
 * Pitch diameter dp = p / sin(π/z). Even link count, back-solved C.
 */

export interface ChainDriveInput {
    z1: number;
    z2: number;
    p?: number;
    C: number;
    power_kw: number;
    rpm: number;
    Ks: number;
    chain_no?: string;
    strands?: number;
}

export interface ChainDriveOutput {
    n2: number;
    dp1: number;
    dp2: number;
    da1: number;
    da2: number;
    links: number;
    even_links: number;
    C_actual: number;
    F: number;
    P_rated_kw: number;
    utilization: number;
    geometry: string;
    validation_report: { valid: boolean; errors: string[]; warnings: string[] };
    report_payload: Record<string, unknown>;
}

function r2(v: number): number {
    return Number(v.toFixed(2));
}

function r3(v: number): number {
    return Number(v.toFixed(3));
}

function r4(v: number): number {
    return Number(v.toFixed(4));
}

function nearestEven(n: number): number {
    const r = Math.round(n);
    if (r % 2 === 0) return Math.max(2, r);
    const down = r - 1;
    const up = r + 1;
    return n - down <= up - n ? Math.max(2, down) : up;
}

function resolveStrands(raw: number | undefined): Iso606Strands {
    if (raw === 2) return 2;
    if (raw === 3) return 3;
    return 1;
}

function resolveSize(input: ChainDriveInput): { size?: ChainSize; p: number; chainNo?: string; warnings: string[] } {
    const warnings: string[] = [];
    const no = normalizeIso606ChainNo(input.chain_no);
    const fromNo = no ? resolveIso606Size(no) : undefined;
    if (fromNo) {
        if (input.p && Math.abs(input.p - fromNo.pitchMm) > 0.05) {
            warnings.push(`chain_no ${no} locks p=${fromNo.pitchMm} mm (ISO 606); wired p=${input.p} mm ignored.`);
        }
        return { size: fromNo, p: fromNo.pitchMm, chainNo: no, warnings };
    }
    const p = input.p && input.p > 0 ? input.p : 15.875;
    const fromP = iso606SizeByPitch(p);
    return {
        size: fromP,
        p,
        chainNo: fromP ? fromP.id.toUpperCase() : undefined,
        warnings,
    };
}

export const ChainDriveNode: EngineeringNodeSchema<ChainDriveInput, ChainDriveOutput> = {
    id: 'mech-chain-drive',
    version: '1.1.0',
    title: 'Roller Chain Drive (ISO 606)',
    description:
        'ISO 606 / DIN 8187: chain no 06B–16B, simplex/duplex, pitch diameters, even links, ISO 10823 rated power.',
    category: 'mechanical',
    deterministic: true,
    isoStandard: 'ISO 606 / DIN 8187',
    inputs: [
        { id: 'z1', label: 'Driver z1', type: 'tooth_count', required: true, defaultValue: 19 },
        { id: 'z2', label: 'Driven z2', type: 'tooth_count', required: true, defaultValue: 57 },
        { id: 'p', label: 'Pitch p', type: 'length_mm', required: false, defaultValue: 15.875 },
        { id: 'C', label: 'Center C', type: 'length_mm', required: true, defaultValue: 500 },
        { id: 'power_kw', label: 'Power P', type: 'power_kw', required: true, defaultValue: 5 },
        { id: 'rpm', label: 'n1', type: 'rpm', required: true, defaultValue: 1450 },
        { id: 'Ks', label: 'Service Ks', type: 'ratio', required: true, defaultValue: 1.3 },
        { id: 'chain_no', label: 'ISO 606 no', type: 'string', required: false, defaultValue: '10B' },
        { id: 'strands', label: 'Strands 1|2|3', type: 'number', required: false, defaultValue: 1 },
    ],
    outputs: [
        { id: 'n2', label: 'n2', type: 'rpm' },
        { id: 'dp1', label: 'dp1', type: 'diameter_mm' },
        { id: 'dp2', label: 'dp2', type: 'diameter_mm' },
        { id: 'da1', label: 'Da1', type: 'diameter_mm' },
        { id: 'da2', label: 'Da2', type: 'diameter_mm' },
        { id: 'links', label: 'Pitches L/p', type: 'number' },
        { id: 'even_links', label: 'Even links', type: 'number' },
        { id: 'C_actual', label: 'C actual', type: 'length_mm' },
        { id: 'F', label: 'Chain pull F', type: 'force_n' },
        { id: 'P_rated_kw', label: 'P rated ISO', type: 'power_kw' },
        { id: 'utilization', label: 'Pd / Pr', type: 'ratio' },
        { id: 'geometry', label: 'DXF Geometry', type: 'dxf_file' },
        { id: 'validation_report', label: 'Validation', type: 'validation_report' },
        { id: 'report_payload', label: 'Report Payload', type: 'json' },
    ],
    validate: (input): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];
        if (!(input.z1 >= 9)) errors.push('Driver sprocket z1 must be ≥ 9.');
        if (!(input.z2 >= 9)) errors.push('Driven sprocket z2 must be ≥ 9.');
        if (!(input.C > 0)) errors.push('Center distance C must be positive.');
        if (!(input.power_kw > 0)) errors.push('Power must be positive.');
        if (!(input.rpm > 0)) errors.push('Speed n1 must be positive.');
        if (!(input.Ks >= 1)) errors.push('Service factor Ks must be ≥ 1.');
        if (input.chain_no && !normalizeIso606ChainNo(input.chain_no) && !(input.p && input.p > 0)) {
            errors.push(`Unknown ISO 606 chain_no '${input.chain_no}'. Use 06B, 08B, 10B, 12B, 16B (or 20B/24B).`);
        }
        if (input.strands !== undefined && input.strands !== 1 && input.strands !== 2 && input.strands !== 3) {
            errors.push('strands must be 1 (simplex), 2 (duplex) or 3 (triplex).');
        }
        if (!(input.p && input.p > 0) && !input.chain_no) {
            errors.push('Provide pitch p or ISO 606 chain_no.');
        }
        if (input.z1 < 17) warnings.push('z1 < 17 increases polygonal (chordal) speed ripple.');
        const ratio = input.z2 / input.z1;
        if (ratio > 7) warnings.push('i = z2/z1 > 7 — prefer a two-stage chain or a reducer.');
        return { valid: errors.length === 0, errors, warnings };
    },
    compute: (input): ChainDriveOutput => {
        const z1 = Math.round(input.z1);
        const z2 = Math.round(input.z2);
        const strands = resolveStrands(input.strands);
        const resolved = resolveSize(input);
        const p = resolved.p;
        const C = input.C;
        const dp1 = p / Math.sin(Math.PI / z1);
        const dp2 = p / Math.sin(Math.PI / z2);
        const da1 = p * (0.6 + 1 / Math.tan(Math.PI / z1));
        const da2 = p * (0.6 + 1 / Math.tan(Math.PI / z2));
        const i = z2 / z1;
        const n2 = input.rpm / i;
        const x0 = C / p;
        const A = (z1 + z2) / 2;
        const B = ((z2 - z1) / (2 * Math.PI)) ** 2;
        const Lp = 2 * x0 + A + (x0 > 0 ? B / x0 : 0);
        const even = nearestEven(Lp);
        const disc = Math.max(0, (even - A) * (even - A) - 8 * B);
        const xAct = ((even - A) + Math.sqrt(disc)) / 4;
        const C_actual = xAct * p;
        const v = (z1 * p * input.rpm) / 60000;
        const Pd = input.power_kw * input.Ks;
        const Pd_W = Pd * 1000;
        const F = v > 0 ? Pd_W / v : 0;
        const poly = (1 - Math.cos(Math.PI / z1)) * 100;
        const size = resolved.size;
        const P_rated = size ? iso606RatedPowerKw({ size, z1, v_m_s: v, strands }) : 0;
        const utilization = P_rated > 0 ? Pd / P_rated : 0;
        const F_break = size ? iso606BreakingLoadN(size, strands) : 0;
        const SF_break = F > 0 && F_break > 0 ? F_break / F : 0;

        const warnings: string[] = [...resolved.warnings];
        const errors: string[] = [];
        if (C < (dp1 + dp2) / 2 + 2 * p) errors.push('Center distance C is below (dp1+dp2)/2 + 2p — sprockets interfere.');
        if (size && v > size.maxSpeedMs) {
            warnings.push(`Chain speed v=${v.toFixed(2)} m/s exceeds ISO 606 ${resolved.chainNo} guideline ${size.maxSpeedMs} m/s.`);
        }
        if (poly > 2) warnings.push(`Polygon ripple ≈ ${poly.toFixed(2)}% — raise z1 to cut chordal action.`);
        if (Math.abs(even - Lp) > 0.4) {
            warnings.push(`Even-link snap ${Lp.toFixed(2)} → ${even}; C moves ${C.toFixed(1)} → ${C_actual.toFixed(1)} mm.`);
        }
        if (utilization > 1) errors.push(`ISO 10823 capacity FAIL: Pd=${Pd.toFixed(2)} kW > Pr=${P_rated.toFixed(2)} kW (duplex or larger pitch).`);
        else if (utilization > 0.85) warnings.push(`ISO 10823 utilization ${(utilization * 100).toFixed(0)}% — little margin.`);
        if (size && z1 < size.minSprocketTeeth) {
            warnings.push(`z1 < ISO 606 recommended minimum ${size.minSprocketTeeth} for ${resolved.chainNo}.`);
        }

        const geometry = chainDriveDxf({ dp1, dp2, da1, da2, z1, z2, C: C_actual, p });
        const Kz = iso10823ToothFactor(z1);
        const Kv = size ? iso10823SpeedFactor(v, size.maxSpeedMs) : 1;
        return {
            n2: r3(n2),
            dp1: r3(dp1),
            dp2: r3(dp2),
            da1: r3(da1),
            da2: r3(da2),
            links: r3(Lp),
            even_links: even,
            C_actual: r2(C_actual),
            F: r3(F),
            P_rated_kw: r4(P_rated),
            utilization: r4(utilization),
            geometry,
            validation_report: { valid: errors.length === 0, errors, warnings },
            report_payload: {
                z1,
                z2,
                p_mm: p,
                C_mm: C,
                power_kw: input.power_kw,
                rpm: input.rpm,
                Ks: input.Ks,
                chain_no: resolved.chainNo ?? 'custom',
                strands,
                strand_name: strands === 1 ? 'simplex' : strands === 2 ? 'duplex' : 'triplex',
                i: r4(i),
                n2_rpm: r3(n2),
                dp1_mm: r3(dp1),
                dp2_mm: r3(dp2),
                da1_mm: r3(da1),
                da2_mm: r3(da2),
                v_m_s: r4(v),
                links: r3(Lp),
                even_links: even,
                C_actual_mm: r2(C_actual),
                F_N: r3(F),
                polygon_pct: r4(poly),
                P_rated_kw: r4(P_rated),
                Pd_kw: r4(Pd),
                utilization: r4(utilization),
                Kz: r4(Kz),
                Kv: r4(Kv),
                F_break_N: r3(F_break),
                SF_break: r4(SF_break),
                working_load_N: size?.recommendedWorkingLoadN,
                formula_trace: [
                    'dp = p / sin(π/z)     Da ≈ p (0.6 + cot(π/z))   ISO 606 / ANSI B29.1',
                    'Lp = 2C/p + (z1+z2)/2 + ((z2−z1)/(2π))² · (p/C)',
                    'Neven = nearest even integer;  2x² − (N−A)x + B = 0  → C_actual = x p',
                    'v = z1 p n1 / 60000     F = Pd / v     Pd = P · Ks',
                    'ISO 10823: Kz = (z1/19)^1.08     Kstrand = 1 / 1.7 / 2.5     Kv = 1 − 0.45 (v/vmax)^1.5',
                    'Pr = (F_work/1000) · v · Kz · Kstrand · Kv     utilization = Pd / Pr',
                ],
                assumptions: [
                    'ISO 606 / DIN 8187 European series (06B–16B); chain_no locks pitch over a wired p',
                    'Duplex/triplex load-share 1.7 / 2.5 (not 2 / 3) — ISO 10823 uneven load',
                    'F_work is the simplex recommended working load; 50 000 h, splash lubrication implied',
                    'Even pitch count avoids a cranked/offset link',
                    'DXF tooth rings are schematic, not a hobbed ISO 606 cutter path',
                ],
            },
        };
    },
};
