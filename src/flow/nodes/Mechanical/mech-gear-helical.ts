import type { EngineeringNodeSchema, ValidationResult } from '@/flow/types/core';
import { DxfWriter } from '@/export/dxf/dxf-writer';
import { buildInvoluteFlank } from '@/engines/math/involute';
import {
    calculateInvoluteGearSpecs,
    generateExternalGearContour,
} from '@/engines/math/gear-involute-factory';
import { calculateIso6336Mesh } from '@/lib/iso6336';

/**
 * Helical gear pair — DIN 3960 geometry + ISO 6336 contact ratio (εα, εβ, εγ).
 * Normal module mn, helix β, transverse mt = mn / cos(β).
 */

export interface HelicalGearInput {
    module_mm: number;
    pinion_teeth: number;
    gear_teeth?: number;
    pressure_angle_deg: number;
    helix_angle_deg: number;
    face_width_mm: number;
    torque_nm?: number;
    rpm?: number;
    profile_shift?: number;
}

export interface HelicalGearOutput {
    mt_mm: number;
    pitch_diameter_mm: number;
    base_diameter_mm: number;
    tip_diameter_mm: number;
    root_diameter_mm: number;
    center_distance_mm: number;
    Ft: number;
    Fr: number;
    Fa: number;
    sigma_F: number;
    sigma_H: number;
    SF: number;
    SH: number;
    contact_ratio_transverse: number;
    overlap_ratio: number;
    total_contact_ratio: number;
    output_torque_nm: number;
    output_rpm: number;
    geometry: string;
    gear_geometry: {
        type: 'HELICAL_PAIR';
        mn_mm: number;
        mt_mm: number;
        z1: number;
        z2: number;
        alpha_n_deg: number;
        beta_deg: number;
        involute: { x: number; y: number }[];
    };
    validation_report: { valid: boolean; errors: string[]; warnings: string[] };
    report_payload: Record<string, unknown>;
}

export const HelicalGearNode: EngineeringNodeSchema<HelicalGearInput, HelicalGearOutput> = {
    id: 'mech-gear-helical',
    version: '1.0.0',
    title: 'Helical Gear Pair',
    description: 'DIN 3960 helical pair: mn, β, mt, tooth forces Ft/Fr/Fa, εα + εβ = εγ, transverse involute DXF.',
    category: 'mechanical',
    deterministic: true,
    isoStandard: 'DIN 3960 / ISO 6336',
    inputs: [
        { id: 'module_mm', label: 'Normal module mn', type: 'module_mm', required: true, defaultValue: 3 },
        { id: 'pinion_teeth', label: 'Pinion teeth z1', type: 'tooth_count', required: true, defaultValue: 20 },
        { id: 'gear_teeth', label: 'Gear teeth z2', type: 'tooth_count', required: false, defaultValue: 60 },
        { id: 'pressure_angle_deg', label: 'Normal αn (°)', type: 'pressure_angle_deg', required: true, defaultValue: 20 },
        { id: 'helix_angle_deg', label: 'Helix β (°)', type: 'helix_angle_deg', required: true, defaultValue: 15 },
        { id: 'face_width_mm', label: 'Face width b', type: 'length_mm', required: true, defaultValue: 40 },
        { id: 'torque_nm', label: 'Pinion torque T', type: 'torque_nm', required: false, defaultValue: 200 },
        { id: 'rpm', label: 'Input speed n', type: 'rpm', required: false, defaultValue: 0 },
        { id: 'profile_shift', label: 'Shift x', type: 'ratio', required: false, defaultValue: 0 },
    ],
    outputs: [
        { id: 'mt_mm', label: 'Transverse mt', type: 'module_mm' },
        { id: 'pitch_diameter_mm', label: 'Pitch dia d1', type: 'diameter_mm' },
        { id: 'base_diameter_mm', label: 'Base dia db', type: 'diameter_mm' },
        { id: 'tip_diameter_mm', label: 'Tip dia da', type: 'diameter_mm' },
        { id: 'root_diameter_mm', label: 'Root dia df', type: 'diameter_mm' },
        { id: 'center_distance_mm', label: 'Center dist a', type: 'length_mm' },
        { id: 'Ft', label: 'Tangential Ft', type: 'force_n' },
        { id: 'Fr', label: 'Radial Fr', type: 'force_n' },
        { id: 'Fa', label: 'Axial Fa', type: 'force_n' },
        { id: 'sigma_F', label: 'ISO 6336 σF', type: 'stress_mpa' },
        { id: 'sigma_H', label: 'ISO 6336 σH', type: 'stress_mpa' },
        { id: 'SF', label: 'Bending SF', type: 'safety_factor' },
        { id: 'SH', label: 'Pitting SH', type: 'safety_factor' },
        { id: 'contact_ratio_transverse', label: 'εα', type: 'ratio' },
        { id: 'overlap_ratio', label: 'εβ', type: 'ratio' },
        { id: 'total_contact_ratio', label: 'εγ', type: 'ratio' },
        { id: 'output_torque_nm', label: 'Output torque', type: 'torque_nm' },
        { id: 'output_rpm', label: 'Output speed', type: 'rpm' },
        { id: 'gear_geometry', label: 'Gear Geometry', type: 'gear_geometry' },
        { id: 'geometry', label: 'DXF Geometry', type: 'dxf_file' },
        { id: 'validation_report', label: 'Validation', type: 'validation_report' },
        { id: 'report_payload', label: 'Report Payload', type: 'json' },
    ],
    validate: (input): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];
        const z1 = input.pinion_teeth ?? 0;
        const z2 = input.gear_teeth ?? 0;
        const beta = input.helix_angle_deg;
        const alpha = input.pressure_angle_deg;
        if (!(input.module_mm > 0)) errors.push('Normal module mn must be positive.');
        if (!(z1 >= 8)) errors.push('Pinion teeth must be ≥ 8 for helical.');
        if (z2 !== 0 && z2 < 8) errors.push('Gear teeth must be ≥ 8 when provided.');
        if (!(alpha > 0 && alpha < 45)) errors.push('Normal pressure angle must be between 0° and 45°.');
        if (!(beta > 0 && beta < 45)) errors.push('Helix angle β must be between 0° and 45°.');
        if (!(input.face_width_mm > 0)) errors.push('Face width must be positive.');
        if (beta > 30) warnings.push('β > 30° — large axial thrust on bearings.');
        return { valid: errors.length === 0, errors, warnings };
    },
    compute: (input): HelicalGearOutput => {
        const mn = input.module_mm;
        const z1 = input.pinion_teeth;
        const z2 = input.gear_teeth && input.gear_teeth > 0 ? input.gear_teeth : 0;
        const x = input.profile_shift || 0;
        const b = input.face_width_mm;
        const T = input.torque_nm ?? 0;
        const nIn = input.rpm ?? 0;

        const s1 = calculateInvoluteGearSpecs({
            module: mn,
            teeth: z1,
            pressureAngle: input.pressure_angle_deg,
            helixAngle: input.helix_angle_deg,
            profileShift: x,
        });
        const s2 = z2 > 0
            ? calculateInvoluteGearSpecs({
                module: mn,
                teeth: z2,
                pressureAngle: input.pressure_angle_deg,
                helixAngle: -input.helix_angle_deg,
                profileShift: x,
            })
            : null;

        const mt = s1.transverseModule;
        const alphaN = s1.pressureAngleRad;
        const alphaT = s1.transversePressureAngleRad;
        const beta = s1.helixAngleRad;
        const d1 = s1.pitchDiameter;
        const d2 = s2 ? s2.pitchDiameter : 0;
        const db1 = s1.baseDiameter;
        const da1 = s1.outsideDiameter;
        const df1 = s1.rootDiameter;
        const a = s2 ? (s1.pitchDiameter + s2.pitchDiameter) / 2 : 0;

        let epsAlpha = 0;
        if (s2) {
            const trans1 = Math.sqrt(Math.max(0, s1.outsideRadius * s1.outsideRadius - s1.baseRadius * s1.baseRadius));
            const trans2 = Math.sqrt(Math.max(0, s2.outsideRadius * s2.outsideRadius - s2.baseRadius * s2.baseRadius));
            const pb = Math.PI * mt * Math.cos(alphaT);
            epsAlpha = (trans1 + trans2 - a * Math.sin(alphaT)) / pb;
        }
        const epsBeta = (b * Math.sin(Math.abs(beta))) / (Math.PI * mn);
        const epsGamma = epsAlpha + epsBeta;

        const iso = T > 0 && z2 > 0
            ? calculateIso6336Mesh({
                mn,
                z1,
                z2,
                b,
                alphaNDeg: input.pressure_angle_deg,
                betaDeg: input.helix_angle_deg,
                x1: x,
                torqueNm: T,
                rpmPinion: nIn > 0 ? nIn : 1450,
            })
            : null;
        const Ft = iso ? iso.Ft : (d1 > 0 ? (2000 * T) / d1 : 0);
        const Fr = iso ? iso.Fr : Ft * Math.tan(alphaN) / Math.cos(beta);
        const Fa = iso ? iso.Fa : Ft * Math.tan(beta);
        const i = z2 > 0 ? z2 / z1 : 1;
        const TOut = T * i;
        const nOut = nIn > 0 && i > 0 ? nIn / i : 0;

        const warnings: string[] = [];
        const errors: string[] = [];
        if (epsGamma < 1.2) warnings.push(`Total contact ratio εγ=${epsGamma.toFixed(3)} < 1.2.`);
        if (epsBeta < 1.0) warnings.push(`Overlap ratio εβ=${epsBeta.toFixed(3)} < 1.0 — increase face width or helix.`);
        if (iso) {
            if (iso.SF1 < 1.4) warnings.push(`ISO 6336 SF=${iso.SF1.toFixed(2)} < 1.4.`);
            if (iso.SH < 1.0) warnings.push(`ISO 6336 SH=${iso.SH.toFixed(2)} < 1.0.`);
        }

        const rb = s1.baseRadius;
        const ra = s1.outsideRadius;
        const rf = s1.rootRadius;
        const r = s1.pitchRadius;
        const flank = buildInvoluteFlank(rb, ra, 12);
        const contour = generateExternalGearContour({
            module: mn,
            teeth: z1,
            pressureAngle: input.pressure_angle_deg,
            helixAngle: input.helix_angle_deg,
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
        // Helix-angle annotation in the first quadrant
        const hx = ra * 1.15;
        dxf.addLine(hx, 0, hx + b * 0.4 * Math.cos(beta), b * 0.4 * Math.sin(beta), 'DIMENSIONS');
        dxf.addLine(hx, 0, hx + b * 0.4, 0, 'REFERENCE');
        dxf.addText(hx + 2, ra * 0.15, Math.max(1.2, mn * 0.55), `β=${input.helix_angle_deg}°`, 'DIMENSIONS');
        dxf.addText(hx + 2, -ra * 0.22, Math.max(1.1, mn * 0.5), `TRANSVERSE SECTION -- HELICAL GEAR beta=${input.helix_angle_deg} deg`, 'DIMENSIONS');
        dxf.addText(hx + 2, -ra * 0.38, Math.max(1.1, mn * 0.45), 'Manufacturing: Hobbing / 4-axis Wire EDM required', 'DIMENSIONS');
        // Force arrows from pitch point
        dxf.addLine(r, 0, r + Math.max(8, r * 0.18), 0, 'DIMENSIONS');
        dxf.addText(r + 2, 2, Math.max(1.2, mn * 0.5), 'Ft', 'DIMENSIONS');
        dxf.addLine(0, r, 0, r + Math.max(8, r * 0.14), 'DIMENSIONS');
        dxf.addText(2, r + 2, Math.max(1.2, mn * 0.5), 'Fr', 'DIMENSIONS');
        dxf.addText(ra * 1.12, ra * 1.12, Math.max(1, mn * 0.7), `mn=${mn} β=${input.helix_angle_deg} z=${z1}`, 'DIMENSIONS');

        const involuteSample = flank.map((p) => ({ x: Number(p.x.toFixed(6)), y: Number(p.y.toFixed(6)) }));
        const report = { valid: errors.length === 0, errors, warnings };

        return {
            mt_mm: Number(mt.toFixed(4)),
            pitch_diameter_mm: Number(d1.toFixed(4)),
            base_diameter_mm: Number(db1.toFixed(4)),
            tip_diameter_mm: Number(da1.toFixed(4)),
            root_diameter_mm: Number(df1.toFixed(4)),
            center_distance_mm: Number(a.toFixed(4)),
            Ft: Number(Ft.toFixed(2)),
            Fr: Number(Fr.toFixed(2)),
            Fa: Number(Fa.toFixed(2)),
            sigma_F: Number((iso?.sigmaF1 ?? 0).toFixed(2)),
            sigma_H: Number((iso?.sigmaH ?? 0).toFixed(2)),
            SF: Number((iso?.SF1 ?? 0).toFixed(3)),
            SH: Number((iso?.SH ?? 0).toFixed(3)),
            contact_ratio_transverse: Number(epsAlpha.toFixed(4)),
            overlap_ratio: Number(epsBeta.toFixed(4)),
            total_contact_ratio: Number(epsGamma.toFixed(4)),
            output_torque_nm: Number(TOut.toFixed(4)),
            output_rpm: Number(nOut.toFixed(4)),
            geometry: dxf.end(),
            gear_geometry: {
                type: 'HELICAL_PAIR',
                mn_mm: mn,
                mt_mm: Number(mt.toFixed(6)),
                z1,
                z2,
                alpha_n_deg: input.pressure_angle_deg,
                beta_deg: input.helix_angle_deg,
                involute: involuteSample,
            },
            validation_report: report,
            report_payload: {
                mn_mm: mn,
                mt_mm: Number(mt.toFixed(4)),
                beta_deg: input.helix_angle_deg,
                alpha_n_deg: input.pressure_angle_deg,
                alpha_t_deg: Number(((alphaT * 180) / Math.PI).toFixed(4)),
                z1,
                z2,
                d1_mm: Number(d1.toFixed(4)),
                Ft_N: Number(Ft.toFixed(2)),
                Fr_N: Number(Fr.toFixed(2)),
                Fa_N: Number(Fa.toFixed(2)),
                sigma_F_MPa: Number((iso?.sigmaF1 ?? 0).toFixed(2)),
                sigma_H_MPa: Number((iso?.sigmaH ?? 0).toFixed(2)),
                SF: Number((iso?.SF1 ?? 0).toFixed(3)),
                SH: Number((iso?.SH ?? 0).toFixed(3)),
                epsilon_alpha: Number(epsAlpha.toFixed(4)),
                epsilon_beta: Number(epsBeta.toFixed(4)),
                epsilon_gamma: Number(epsGamma.toFixed(4)),
                formula_trace: [
                    'mt = mn / cos(β)',
                    'αt = atan(tan(αn) / cos(β))',
                    'd = mt · z',
                    'Ft = 2000 T / d',
                    'Fr = Ft · tan(αn) / cos(β)',
                    'Fa = Ft · tan(β)',
                    'εβ = b sin(β) / (π mn)',
                    'εγ = εα + εβ',
                ],
                assumptions: [
                    'DIN 3960 basic rack ha*=1.0, hf*=1.25 in the normal plane',
                    'ISO 6336 overlap ratio εβ; no load-sharing factor Kγ applied',
                    'Transverse involute polyline; helix shown as an annotation, not a 3D sweep',
                ],
            },
        };
    },
};
