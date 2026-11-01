import type { EngineeringNodeSchema, ValidationResult } from '@/flow/types/core';
import { DxfWriter } from '@/export/dxf/dxf-writer';
import { buildInvoluteFlank } from '@/engines/math/involute';
import {
    calculateInvoluteGearSpecs,
    generateExternalGearContour,
} from '@/engines/math/gear-involute-factory';
import { calculateIso6336Mesh } from '@/lib/iso6336';

/**
 * REF-001: Spur Gear Node (ISO 6336 / DIN 3960)
 *
 * True involute:
 *   x(t) = r_b (cos t + t sin t)
 *   y(t) = r_b (sin t − t cos t)
 */

export interface SpurGearInput {
    module_mm: number;
    pinion_teeth?: number;
    tooth_count?: number;
    gear_teeth?: number;
    pressure_angle_deg: number;
    profile_shift?: number;
    face_width_mm?: number;
    width_mm?: number;
    torque_nm?: number;
    rpm?: number;
}

export interface SpurGearOutput {
    pitch_diameter_mm: number;
    base_diameter_mm: number;
    tip_diameter_mm: number;
    root_diameter_mm: number;
    base_circle_mm: number;
    addendum_circle_mm: number;
    dedendum_circle_mm: number;
    center_distance_mm: number;
    contact_ratio: number;
    pinion_pitch_diameter_mm: number;
    gear_pitch_diameter_mm: number;
    Ft: number;
    Fr: number;
    Fa: number;
    sigma_F: number;
    sigma_H: number;
    SF: number;
    SH: number;
    output_torque_nm: number;
    output_rpm: number;
    geometry: string;
    gear_geometry: {
        type: 'SPUR_PAIR' | 'SPUR_PINION';
        module_mm: number;
        z1: number;
        z2: number;
        alpha_deg: number;
        involute: { x: number; y: number }[];
    };
    validation_report: {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
    report_payload: Record<string, unknown>;
}

export const SpurGearNode: EngineeringNodeSchema<SpurGearInput, SpurGearOutput> = {
    id: 'mech-gear-spur',
    version: '1.2.0',
    title: 'Spur Gear (External)',
    description: 'Involute spur gear pair per DIN 3960. Outputs geometry, contact ratio, and a validation report.',
    category: 'mechanical',
    deterministic: true,
    isoStandard: 'DIN 3960',

    inputs: [
        { id: 'module_mm', label: 'Module (m)', type: 'module_mm', required: true, defaultValue: 2 },
        { id: 'pinion_teeth', label: 'Pinion teeth (z1)', type: 'tooth_count', required: true, defaultValue: 20 },
        { id: 'gear_teeth', label: 'Gear teeth (z2)', type: 'tooth_count', required: false, defaultValue: 40 },
        { id: 'pressure_angle_deg', label: 'Pressure Angle (α)', type: 'pressure_angle_deg', required: true, defaultValue: 20 },
        { id: 'profile_shift', label: 'Shift (x)', type: 'ratio', required: false, defaultValue: 0 },
        { id: 'face_width_mm', label: 'Face Width (b)', type: 'length_mm', required: true, defaultValue: 20 },
        { id: 'torque_nm', label: 'Torque (T)', type: 'torque_nm', required: false, defaultValue: 0 },
        { id: 'rpm', label: 'Input Speed (n)', type: 'rpm', required: false, defaultValue: 0 },
    ],

    outputs: [
        { id: 'pitch_diameter_mm', label: 'Pitch Dia (d1)', type: 'diameter_mm' },
        { id: 'base_circle_mm', label: 'Base Dia (db)', type: 'diameter_mm' },
        { id: 'addendum_circle_mm', label: 'Tip Dia (da)', type: 'diameter_mm' },
        { id: 'dedendum_circle_mm', label: 'Root Dia (df)', type: 'diameter_mm' },
        { id: 'center_distance_mm', label: 'Center Dist (a)', type: 'length_mm' },
        { id: 'contact_ratio', label: 'Contact Ratio εα', type: 'ratio' },
        { id: 'Ft', label: 'Tangential Ft', type: 'force_n' },
        { id: 'Fr', label: 'Radial Fr', type: 'force_n' },
        { id: 'Fa', label: 'Axial Fa', type: 'force_n' },
        { id: 'sigma_F', label: 'ISO 6336 σF', type: 'stress_mpa' },
        { id: 'sigma_H', label: 'ISO 6336 σH', type: 'stress_mpa' },
        { id: 'SF', label: 'Bending SF', type: 'safety_factor' },
        { id: 'SH', label: 'Pitting SH', type: 'safety_factor' },
        { id: 'output_torque_nm', label: 'Output Torque', type: 'torque_nm' },
        { id: 'output_rpm', label: 'Output Speed', type: 'rpm' },
        { id: 'gear_geometry', label: 'Gear Geometry', type: 'gear_geometry' },
        { id: 'geometry', label: 'DXF Geometry', type: 'dxf_file' },
        { id: 'validation_report', label: 'Validation', type: 'validation_report' },
        { id: 'report_payload', label: 'Report Payload', type: 'json' },
    ],

    validate: (input: SpurGearInput): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];

        const z1 = input.pinion_teeth ?? input.tooth_count ?? 0;
        const z2 = input.gear_teeth ?? 0;
        const x = input.profile_shift || 0;
        const b = input.face_width_mm ?? input.width_mm ?? 0;
        const alphaDeg = input.pressure_angle_deg;

        if (!(input.module_mm > 0)) errors.push('Module must be positive.');
        if (input.module_mm > 0 && input.module_mm < 0.1) warnings.push('Micro-module gears require special manufacturing.');
        if (!(z1 >= 6)) errors.push('Pinion teeth must be ≥ 6.');
        if (z2 !== 0 && z2 < 6) errors.push('Gear teeth must be ≥ 6 when provided.');
        if (!(alphaDeg > 0 && alphaDeg < 45)) errors.push('Pressure angle must be between 0° and 45°.');
        if (x < -0.6 || x > 1.0) errors.push('Profile shift x is outside typical range [-0.6, 1.0].');
        if (!(b > 0)) errors.push('Face width must be positive.');

        const alpha = (alphaDeg * Math.PI) / 180;
        const zMin = Math.ceil(2 / (Math.sin(alpha) * Math.sin(alpha)) - 2 * x);
        if (z1 < zMin) {
            warnings.push(`Undercut risk: z1=${z1} < z_min=${zMin} without sufficient profile shift.`);
        }

        return { valid: errors.length === 0, errors, warnings };
    },

    compute: (input: SpurGearInput): SpurGearOutput => {
        const m = input.module_mm;
        const z1 = input.pinion_teeth ?? input.tooth_count ?? 20;
        const z2 = input.gear_teeth && input.gear_teeth > 0 ? input.gear_teeth : 0;
        const alphaDeg = input.pressure_angle_deg;
        const x = input.profile_shift || 0;

        const s1 = calculateInvoluteGearSpecs({
            module: m,
            teeth: z1,
            pressureAngle: alphaDeg,
            profileShift: x,
        });
        const s2 = z2 > 0
            ? calculateInvoluteGearSpecs({ module: m, teeth: z2, pressureAngle: alphaDeg, profileShift: x })
            : null;

        const d1 = s1.pitchDiameter;
        const d2 = s2 ? s2.pitchDiameter : 0;
        const db1 = s1.baseDiameter;
        const da1 = s1.outsideDiameter;
        const df1 = s1.rootDiameter;
        const alpha = s1.transversePressureAngleRad;
        const a = s2 ? (s1.pitchDiameter + s2.pitchDiameter) / 2 : 0;

        let contactRatio = 0;
        if (s2) {
            const trans1 = Math.sqrt(Math.max(0, s1.outsideRadius * s1.outsideRadius - s1.baseRadius * s1.baseRadius));
            const trans2 = Math.sqrt(Math.max(0, s2.outsideRadius * s2.outsideRadius - s2.baseRadius * s2.baseRadius));
            const pb = Math.PI * s1.module * Math.cos(alpha);
            contactRatio = (trans1 + trans2 - a * Math.sin(alpha)) / pb;
        } else {
            const trans = Math.sqrt(Math.max(0, s1.outsideRadius * s1.outsideRadius - s1.baseRadius * s1.baseRadius));
            const pb = Math.PI * s1.module * Math.cos(alpha);
            contactRatio = (trans - s1.pitchRadius * Math.sin(alpha)) / pb + 0.5;
        }

        const warnings: string[] = [];
        const errors: string[] = [];
        if (contactRatio < 1.1) warnings.push(`Contact ratio εα=${contactRatio.toFixed(3)} < 1.1 — noisy mesh.`);
        const zMin = Math.ceil(2 / (Math.sin(alpha) * Math.sin(alpha)) - 2 * x);
        if (z1 < zMin) warnings.push(`Undercut risk: z1=${z1} < z_min=${zMin}.`);

        const rb = s1.baseRadius;
        const ra = s1.outsideRadius;
        const rf = s1.rootRadius;
        const r = s1.pitchRadius;
        const flank = buildInvoluteFlank(rb, ra, 12);

        const contour = generateExternalGearContour({
            module: m,
            teeth: z1,
            pressureAngle: alphaDeg,
            profileShift: x,
            pointsPerFlank: 12,
        });

        const dxf = new DxfWriter();
        dxf.addCircle(0, 0, r, 'PITCH_CIRCLE');
        dxf.addCircle(0, 0, rb, 'BASE_CIRCLE');
        dxf.addCircle(0, 0, ra, 'ADDENDUM_CIRCLE');
        dxf.addCircle(0, 0, rf, 'DEDENDUM_CIRCLE');
        const cross = r * 0.1;
        dxf.addLine(-cross, 0, cross, 0, 'REFERENCE');
        dxf.addLine(0, -cross, 0, cross, 'REFERENCE');
        dxf.addPolyline(contour, true, 'PART_CONTOUR');
        dxf.addText(ra * 1.12, ra * 1.12, Math.max(1, m * 0.7), `m=${m} z=${z1}`, 'DIMENSIONS');

        const T = input.torque_nm ?? 0;
        const nIn = input.rpm ?? 0;
        const b = input.face_width_mm ?? input.width_mm ?? 20;
        const iso = T > 0 && z2 > 0
            ? calculateIso6336Mesh({
                mn: m,
                z1,
                z2,
                b,
                alphaNDeg: alphaDeg,
                x1: x,
                torqueNm: T,
                rpmPinion: nIn > 0 ? nIn : 1450,
            })
            : null;
        const Ft = iso ? iso.Ft : (d1 > 0 ? (2000 * T) / d1 : 0);
        const Fr = iso ? iso.Fr : Ft * Math.tan(alpha);
        const Fa = 0;
        const i = z2 > 0 ? z2 / z1 : 1;
        const TOut = T * i;
        const nOut = nIn > 0 && i > 0 ? nIn / i : 0;
        if (iso) {
            if (iso.SF1 < 1.4) warnings.push(`ISO 6336 SF=${iso.SF1.toFixed(2)} < 1.4.`);
            if (iso.SH < 1.0) warnings.push(`ISO 6336 SH=${iso.SH.toFixed(2)} < 1.0.`);
        }

        const report = { valid: errors.length === 0, errors, warnings };
        const involuteSample = flank.map((p) => ({ x: Number(p.x.toFixed(6)), y: Number(p.y.toFixed(6)) }));

        return {
            pitch_diameter_mm: Number(d1.toFixed(4)),
            base_diameter_mm: Number(db1.toFixed(4)),
            tip_diameter_mm: Number(da1.toFixed(4)),
            root_diameter_mm: Number(df1.toFixed(4)),
            base_circle_mm: Number(db1.toFixed(4)),
            addendum_circle_mm: Number(da1.toFixed(4)),
            dedendum_circle_mm: Number(df1.toFixed(4)),
            center_distance_mm: Number(a.toFixed(4)),
            contact_ratio: Number(contactRatio.toFixed(4)),
            pinion_pitch_diameter_mm: Number(d1.toFixed(4)),
            gear_pitch_diameter_mm: Number(d2.toFixed(4)),
            Ft: Number(Ft.toFixed(2)),
            Fr: Number(Fr.toFixed(2)),
            Fa: Number(Fa.toFixed(2)),
            sigma_F: Number((iso?.sigmaF1 ?? 0).toFixed(2)),
            sigma_H: Number((iso?.sigmaH ?? 0).toFixed(2)),
            SF: Number((iso?.SF1 ?? 0).toFixed(3)),
            SH: Number((iso?.SH ?? 0).toFixed(3)),
            output_torque_nm: Number(TOut.toFixed(4)),
            output_rpm: Number(nOut.toFixed(4)),
            geometry: dxf.end(),
            gear_geometry: {
                type: z2 > 0 ? 'SPUR_PAIR' : 'SPUR_PINION',
                module_mm: m,
                z1,
                z2,
                alpha_deg: alphaDeg,
                involute: involuteSample,
            },
            validation_report: report,
            report_payload: {
                module_mm: m,
                pinion_teeth: z1,
                gear_teeth: z2,
                pressure_angle_deg: alphaDeg,
                pitch_diameter_mm: Number(d1.toFixed(4)),
                base_circle_mm: Number(db1.toFixed(4)),
                addendum_circle_mm: Number(da1.toFixed(4)),
                dedendum_circle_mm: Number(df1.toFixed(4)),
                center_distance_mm: Number(a.toFixed(4)),
                contact_ratio: Number(contactRatio.toFixed(4)),
                Ft_N: Number(Ft.toFixed(2)),
                Fr_N: Number(Fr.toFixed(2)),
                Fa_N: Number(Fa.toFixed(2)),
                sigma_F_MPa: Number((iso?.sigmaF1 ?? 0).toFixed(2)),
                sigma_H_MPa: Number((iso?.sigmaH ?? 0).toFixed(2)),
                SF: Number((iso?.SF1 ?? 0).toFixed(3)),
                SH: Number((iso?.SH ?? 0).toFixed(3)),
                output_torque_nm: Number(TOut.toFixed(4)),
                output_rpm: Number(nOut.toFixed(4)),
                formula_trace: [
                    'd = m·z',
                    'db = d·cos(α)',
                    'da = d + 2m(1+x)',
                    'df = d − 2m(1.25−x)',
                    'Ft = 2000 T / d',
                    'Fr = Ft · tan(α)',
                    'Fa = 0 (spur)',
                    'σF, σH, SF, SH per ISO 6336 Method B',
                    'T_out = T · z2/z1',
                    'x(t)=rb(cos t + t sin t)',
                    'y(t)=rb(sin t − t cos t)',
                ],
                assumptions: [
                    'DIN 3960 basic rack ha*=1.0, hf*=1.25',
                    'True involute from base circle; polyline flanks',
                ],
            },
        };
    },
};
