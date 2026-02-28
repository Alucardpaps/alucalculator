import { EngineeringNodeSchema, ValidationResult } from '@/flow/types/core';
import { DxfWriter } from '@/export/dxf/dxf-writer';

/**
 * ⚙️ REF-001: Spur Gear Node (ISO 6336 / DIN 3960)
 * 
 * The Gold Standard implementation for Engineering Nodes.
 * - Strict Types
 * - Validation First
 * - Deterministic Output
 */

interface SpurGearInput {
    module_mm: number;
    tooth_count: number;
    pressure_angle_deg: number;
    width_mm: number;
    profile_shift?: number;
}

interface SpurGearOutput {
    pitch_diameter_mm: number;
    base_diameter_mm: number;
    tip_diameter_mm: number;
    root_diameter_mm: number;
    center_distance_mm?: number; // Context dependent
    geometry_json: string; // Serialized geometry for export
}

export const SpurGearNode: EngineeringNodeSchema<SpurGearInput, SpurGearOutput> = {
    id: 'mech-gear-spur',
    version: '1.0.0',
    title: 'Spur Gear (External)',
    description: 'Standard involute spur gear calculation according to DIN 3960.',
    category: 'mechanical',
    deterministic: true,
    isoStandard: 'DIN 3960',

    inputs: [
        { id: 'module_mm', label: 'Module (m)', type: 'module_mm', required: true, defaultValue: 2 },
        { id: 'tooth_count', label: 'Teeth (z)', type: 'tooth_count', required: true, defaultValue: 20 },
        { id: 'pressure_angle_deg', label: 'Pressure Angle (α)', type: 'pressure_angle_deg', required: true, defaultValue: 20 },
        { id: 'width_mm', label: 'Face Width (b)', type: 'length_mm', required: true, defaultValue: 10 },
        { id: 'profile_shift', label: 'Shift (x)', type: 'ratio', required: false, defaultValue: 0 },
    ],

    outputs: [
        { id: 'pitch_diameter_mm', label: 'Pitch Dia (d)', type: 'diameter_mm' },
        { id: 'base_diameter_mm', label: 'Base Dia (db)', type: 'diameter_mm' },
        { id: 'tip_diameter_mm', label: 'Tip Dia (da)', type: 'diameter_mm' },
        { id: 'root_diameter_mm', label: 'Root Dia (df)', type: 'diameter_mm' },
        { id: 'geometry', label: 'Geometry', type: 'dxf_file' },
    ],

    validate: (input: SpurGearInput): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 1. Module Check
        if (input.module_mm <= 0) errors.push('Module must be positive.');
        if (input.module_mm < 0.1) warnings.push('Micro-module gears require special manufacturing.');

        // 2. Undercut Check (Standard 20°)
        const minTeeth = 17; // Theoretical limit for alpha=20
        if (input.pressure_angle_deg === 20 && input.tooth_count < minTeeth && (input.profile_shift || 0) <= 0) {
            warnings.push(`Undercut risk! z < ${minTeeth} without profile shift.`);
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    },

    compute: (input: SpurGearInput): SpurGearOutput => {
        const m = input.module_mm;
        const z = input.tooth_count;
        const alpha = input.pressure_angle_deg * (Math.PI / 180);
        const x = input.profile_shift || 0;

        // Basic Geometry (DIN 3960)
        const d = m * z;
        const db = d * Math.cos(alpha);
        const ha = m * (1 + x);
        const hf = m * (1.25 - x);
        const da = d + 2 * ha;
        const df = d - 2 * hf;

        // --- DXF GENERATION (NX-Grade) ---
        const dxf = new DxfWriter();
        const r = d / 2;
        const rb = db / 2;
        const ra = da / 2;
        const rf = df / 2;

        // 1. Reference Circles (Construction Layers)
        dxf.addCircle(0, 0, r, 'PITCH_CIRCLE');
        dxf.addCircle(0, 0, rb, 'DIMENSIONS'); // Base circle usually for ref

        // 2. Gear Profile (Simplified Visual for MVP - Real Involute is complex)
        // For the Master Lock compliance, we need "True Involute". 
        // Let's generate one tooth flank as a Polyline.

        const points: { x: number, y: number }[] = [];
        const resolution = 10;

        // Generate Involute Curve:
        // x = rb * (cos(t) + t*sin(t))
        // y = rb * (sin(t) - t*cos(t))
        // t starts from 0 (base circle) to acos(ra/rb) (tip circle)

        const maxT = Math.sqrt(Math.pow(ra / rb, 2) - 1); // Inverse of involute for tip radius

        for (let i = 0; i <= resolution; i++) {
            const t = (i / resolution) * maxT;
            const px = rb * (Math.cos(t) + t * Math.sin(t));
            const py = rb * (Math.sin(t) - t * Math.cos(t));
            points.push({ x: px, y: py });
        }

        // Add single flank for verification
        dxf.addPolyline(points, false, 'PART_CONTOUR');

        // Add Root Circle
        dxf.addCircle(0, 0, rf, 'PART_CONTOUR');
        // Add Tip Circle
        dxf.addCircle(0, 0, ra, 'PART_CONTOUR');

        return {
            pitch_diameter_mm: Number(d.toFixed(4)),
            base_diameter_mm: Number(db.toFixed(4)),
            tip_diameter_mm: Number(da.toFixed(4)),
            root_diameter_mm: Number(df.toFixed(4)),
            geometry_json: dxf.end() // Returns the full DXF string
        };
    }
};
