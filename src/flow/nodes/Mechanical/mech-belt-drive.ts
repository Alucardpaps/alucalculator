import type { EngineeringNodeSchema, ValidationResult } from '@/flow/types/core';
import { beltDriveDxf } from '@/export/dxf/schematics';
import {
    centerFromDatumLengthMm,
    iso4184PowerKw,
    openDrivePitchLengthMm,
    resolveIso4184Section,
    snapIso4184DatumLength,
    type Iso4184Section,
} from '@/data/mechanical/iso4184';

/**
 * Open V-belt / flat-belt drive — ISO 4184 geometry, datum-length snap, section rating.
 * DIN 2215 classical sections share the same open-drive length formula.
 */

export type BeltKind = 'v' | 'flat';

export interface BeltDriveInput {
    d1: number;
    d2: number;
    C: number;
    power_kw: number;
    rpm: number;
    mu: number;
    Ks: number;
    belt_type?: BeltKind | string;
    groove_angle_deg?: number;
    section?: string;
}

export interface BeltDriveOutput {
    n2: number;
    wrap_deg: number;
    belt_length_mm: number;
    Ld_mm: number;
    C_actual: number;
    Te: number;
    T1: number;
    T2: number;
    Fs: number;
    belt_count: number;
    P_rated_kw: number;
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

export const BeltDriveNode: EngineeringNodeSchema<BeltDriveInput, BeltDriveOutput> = {
    id: 'mech-belt-drive',
    version: '1.1.0',
    title: 'V-Belt / Flat Belt Drive',
    description:
        'ISO 4184 / DIN 2215 open drive: wrap, datum length Ld snap (Z/A/B/C, SPZ/SPA/SPB/SPC), Euler-Eytelwein T1/T2 and section-rated belt count.',
    category: 'mechanical',
    deterministic: true,
    isoStandard: 'ISO 4184 / DIN 2215',
    inputs: [
        { id: 'd1', label: 'Driver Ø d1', type: 'diameter_mm', required: true, defaultValue: 100 },
        { id: 'd2', label: 'Driven Ø d2', type: 'diameter_mm', required: true, defaultValue: 250 },
        { id: 'C', label: 'Center C', type: 'length_mm', required: true, defaultValue: 500 },
        { id: 'power_kw', label: 'Power P', type: 'power_kw', required: true, defaultValue: 5 },
        { id: 'rpm', label: 'n1', type: 'rpm', required: true, defaultValue: 1450 },
        { id: 'mu', label: 'μ', type: 'ratio', required: true, defaultValue: 0.3 },
        { id: 'Ks', label: 'Service Ks', type: 'ratio', required: true, defaultValue: 1.25 },
        { id: 'belt_type', label: 'v | flat', type: 'string', required: false, defaultValue: 'v' },
        { id: 'groove_angle_deg', label: 'Groove 2β (°)', type: 'number', required: false },
        { id: 'section', label: 'ISO section', type: 'string', required: false, defaultValue: 'A' },
    ],
    outputs: [
        { id: 'n2', label: 'n2', type: 'rpm' },
        { id: 'wrap_deg', label: 'Wrap θ', type: 'number' },
        { id: 'belt_length_mm', label: 'L theory', type: 'length_mm' },
        { id: 'Ld_mm', label: 'Ld catalog', type: 'length_mm' },
        { id: 'C_actual', label: 'C actual', type: 'length_mm' },
        { id: 'Te', label: 'Effective Te', type: 'force_n' },
        { id: 'T1', label: 'Tight T1', type: 'force_n' },
        { id: 'T2', label: 'Slack T2', type: 'force_n' },
        { id: 'Fs', label: 'Shaft T1+T2', type: 'force_n' },
        { id: 'belt_count', label: 'Belts z', type: 'number' },
        { id: 'P_rated_kw', label: 'P rated / belt', type: 'power_kw' },
        { id: 'geometry', label: 'DXF Geometry', type: 'dxf_file' },
        { id: 'validation_report', label: 'Validation', type: 'validation_report' },
        { id: 'report_payload', label: 'Report Payload', type: 'json' },
    ],
    validate: (input): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];
        if (!(input.d1 > 0)) errors.push('Driver diameter d1 must be positive.');
        if (!(input.d2 > 0)) errors.push('Driven diameter d2 must be positive.');
        if (!(input.C > 0)) errors.push('Center distance C must be positive.');
        if (!(input.power_kw > 0)) errors.push('Power must be positive.');
        if (!(input.rpm > 0)) errors.push('Speed n1 must be positive.');
        if (!(input.mu > 0)) errors.push('Friction μ must be positive.');
        if (!(input.Ks >= 1)) errors.push('Service factor Ks must be ≥ 1.');
        const kind = input.belt_type ?? 'v';
        if (kind !== 'v' && kind !== 'flat') errors.push("belt_type must be 'v' or 'flat'.");
        const gap = Math.abs(input.d2 - input.d1) / 2;
        if (input.C <= gap) errors.push('Center distance C must exceed |d2−d1|/2 (pulleys would intersect).');
        if (kind === 'v') {
            const section = resolveIso4184Section(input.section ?? 'A');
            if (!section) errors.push(`Unknown ISO 4184 section '${input.section}'. Use Z/A/B/C or SPZ/SPA/SPB/SPC.`);
            else if (input.d1 < section.dMinMm) {
                errors.push(`d1=${input.d1} mm < ISO 4184 ${section.id} minimum pulley ${section.dMinMm} mm.`);
            }
        }
        if (input.C < 1.5 * (input.d1 + input.d2) / 2) {
            warnings.push('C is tight versus (d1+d2)/2 — wrap on the small pulley drops quickly.');
        }
        return { valid: errors.length === 0, errors, warnings };
    },
    compute: (input): BeltDriveOutput => {
        const d1 = input.d1;
        const d2 = input.d2;
        const C = input.C;
        const kind: BeltKind = input.belt_type === 'flat' ? 'flat' : 'v';
        const section: Iso4184Section | undefined = kind === 'v' ? resolveIso4184Section(input.section ?? 'A') : undefined;
        const groove =
            input.groove_angle_deg && input.groove_angle_deg > 0
                ? input.groove_angle_deg
                : section
                    ? section.grooveAngleDeg
                    : 40;
        const beta = kind === 'flat' ? Math.PI / 2 : ((groove / 2) * Math.PI) / 180;
        const D = Math.max(d1, d2);
        const d = Math.min(d1, d2);
        const arg = Math.max(-1, Math.min(1, (D - d) / (2 * C)));
        const theta0 = Math.PI - 2 * Math.asin(arg);
        const Lth = openDrivePitchLengthMm(d1, d2, C);
        const Ld = section ? snapIso4184DatumLength(Lth, section) : Lth;
        const C_actual = section ? centerFromDatumLengthMm(d1, d2, Ld) : C;
        const argAct = Math.max(-1, Math.min(1, (D - d) / (2 * C_actual)));
        const theta = Math.PI - 2 * Math.asin(argAct);
        const wrap_deg = (theta * 180) / Math.PI;
        const n2 = input.rpm * (d1 / d2);
        const v = (Math.PI * d1 * input.rpm) / 60000;
        const Pd = input.power_kw * input.Ks;
        const Pd_W = Pd * 1000;
        const Te = v > 0 ? Pd_W / v : 0;
        const ratio = Math.exp((input.mu * theta) / Math.sin(beta));
        const T2 = ratio > 1 ? Te / (ratio - 1) : 0;
        const T1 = ratio * T2;
        const Fs = T1 + T2;

        let P_rated = 0;
        let belt_count = 1;
        if (kind === 'v' && section) {
            P_rated = iso4184PowerKw(section, d1, v, wrap_deg, Ld);
            belt_count = Math.max(1, Math.ceil(Pd / Math.max(P_rated, 1e-9)));
        } else {
            const Te_allow = Math.max(40, 280 * (1 - (v / 40) * (v / 40)));
            P_rated = (Te_allow * v) / 1000;
            belt_count = Math.max(1, Math.ceil(Te / Te_allow));
        }

        const warnings: string[] = [];
        const errors: string[] = [];
        const vMax = section?.vMaxMs ?? 40;
        if (v > vMax) warnings.push(`Belt speed v=${v.toFixed(1)} m/s exceeds ${section ? `ISO 4184 ${section.id}` : 'flat'} ${vMax} m/s guideline.`);
        if (wrap_deg < 120) warnings.push(`Small-pulley wrap θ=${wrap_deg.toFixed(1)}° < 120° — add an idler or reduce ratio.`);
        if (belt_count > 8) warnings.push(`${belt_count} belts — step up a section (SPA→SPB / A→B).`);
        if (ratio <= 1.05) errors.push('Tension ratio ≈ 1 — μθ too small to transmit power without slip.');
        if (section && Math.abs(Ld - Lth) > 8) {
            warnings.push(`Datum snap Lth=${Lth.toFixed(1)} → Ld=${Ld} mm; C ${C.toFixed(1)} → ${C_actual.toFixed(1)} mm.`);
        }

        const geometry = beltDriveDxf({ d1, d2, C: C_actual, belts: belt_count });
        return {
            n2: r3(n2),
            wrap_deg: r3(wrap_deg),
            belt_length_mm: r2(Lth),
            Ld_mm: r2(Ld),
            C_actual: r2(C_actual),
            Te: r3(Te),
            T1: r3(T1),
            T2: r3(T2),
            Fs: r3(Fs),
            belt_count,
            P_rated_kw: r4(P_rated),
            geometry,
            validation_report: { valid: errors.length === 0, errors, warnings },
            report_payload: {
                d1_mm: d1,
                d2_mm: d2,
                C_mm: C,
                C_actual_mm: r2(C_actual),
                power_kw: input.power_kw,
                rpm: input.rpm,
                mu: input.mu,
                Ks: input.Ks,
                belt_type: kind,
                section: section?.id ?? 'flat',
                family: section?.family ?? 'flat',
                top_width_mm: section?.topWidthMm,
                height_mm: section?.heightMm,
                d_min_mm: section?.dMinMm,
                groove_angle_deg: groove,
                n2_rpm: r3(n2),
                v_m_s: r4(v),
                wrap_deg: r3(wrap_deg),
                L_theory_mm: r2(Lth),
                Ld_mm: r2(Ld),
                tension_ratio: r4(ratio),
                Te_N: r3(Te),
                T1_N: r3(T1),
                T2_N: r3(T2),
                Fs_N: r3(Fs),
                P_rated_kw: r4(P_rated),
                Pd_kw: r4(Pd),
                belt_count,
                formula_trace: [
                    'n2 = n1 · d1 / d2     v = π d1 n1 / 60000  (m/s)',
                    'θ = π − 2 arcsin((D−d)/(2C))   (wrap on the smaller pulley)',
                    'Lth = 2C + π(d1+d2)/2 + (d2−d1)²/(4C)     ISO 4184 / DIN 2215 open drive',
                    'Ld = nearest ISO 4184 datum length for the section;  2C² − (Ld−α)C + β = 0 → C_actual',
                    'V-belt: T1/T2 = exp(μθ / sin β)  β = groove/2 (section table).  Flat: β = 90°',
                    'P_r = P10 · (v/10) · Kd · Kθ · KL · Kv     Kd=1−0.15 dmin/d1, Kθ=θ°/180, KL=(Ld/Lref)^0.09, Kv=1−(v/vmax)²',
                    'z = ceil(Pd / P_r)     Pd = P · Ks',
                ],
                assumptions: [
                    'Open drive, no idler, no slip in the speed ratio (creep neglected)',
                    'ISO 4184 sections Z/A/B/C (classical) and SPZ/SPA/SPB/SPC (narrow wedge)',
                    'P10 seed is a locked ISO-style rating, not a scanned manufacturer catalogue page',
                    'Explicit groove_angle_deg overrides the section table',
                    'DXF uses C_actual after datum snap',
                ],
            },
        };
    },
};
