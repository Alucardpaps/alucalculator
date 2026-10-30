import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue, type CalculationResult } from '@/types/engineering';
import { ThreadVisualizer } from '@/components/visualizers/ThreadVisualizer';
import { computeThreadProfile, defaultPitchMm, THREAD_TYPE_OPTIONS } from '@/lib/fastener/threadProfiles';
import React from 'react';

export const threadGeometrySchema: CalculatorSchemaV2 = {
    id: 'thread-geometry',
    metadata: {
        title: 'Universal Thread Geometry',
        description: 'Calculate dimensions and 2D profiles for all 45 Metric, Unified, Whitworth, Pipe, Hydraulic, and Power-screw thread standards.',
        category: 'mechanical',
        version: '2.5.0',
        author: 'AluCAD OS',
        lastUpdated: '2026-09-11',
        tags: ['thread', 'screw', 'fastener', 'iso', 'ansi', 'whitworth', 'npt', 'bsp', 'jic', 'acme', 'buttress', 'panzergewinde'],
        verifiedStandards: [
            'ISO 68-1', 'ISO 261', 'ISO 262', 'ASME B1.1', 'BS 84',
            'ISO 228-1', 'ISO 7-1', 'ASME B1.20.1', 'ASME B1.20.3',
            'SAE J514', 'SAE J1453', 'SAE J1926', 'ISO 2901', 'ASME B1.5',
            'DIN 513', 'DIN 405', 'DIN 40430', 'IEC 60061', 'DIN 7756', 'DIN 477'
        ]
    },
    documentation: {
        assumptions: [
            { id: 'standard-thread', text: 'Assumes standard thread basic profile (Basic Profile without custom manufacturing tolerance deviation like 6g/6H)', impact: 'medium' },
            { id: 'pipe-gauge', text: 'NPT/BSPT free-form diameters are evaluated at the gauge plane (L1 hand-tight reference); catalog rows use standard gauge values', impact: 'medium' },
            { id: 'sealing-principle', text: 'Tapered threads (NPT/BSPT) seal along the thread spiral using compound; parallel threads (BSPP/NPSM) require mechanical sealing rings or face O-rings', impact: 'high' }
        ],
        standards: [
            { code: 'ISO 68-1', title: 'ISO general purpose screw threads — Basic profile (60°)' },
            { code: 'ISO 261', title: 'ISO general purpose metric screw threads — General plan' },
            { code: 'ASME B1.1', title: 'Unified Inch Screw Threads (UNC, UNF, UNEF, UN)' },
            { code: 'BS 84', title: 'Parallel screw threads of Whitworth form (BSW, BSF, 55°)' },
            { code: 'ISO 228-1', title: 'Pipe threads where pressure-tight joints are not made on the threads (BSPP G)' },
            { code: 'ISO 7-1', title: 'Pipe threads where pressure-tight joints are made on the threads (BSPT R, Rc, 1:16)' },
            { code: 'ASME B1.20.1', title: 'Pipe Threads, General Purpose (NPT, NPSM, 60°)' },
            { code: 'ASME B1.20.3', title: 'Dryseal Pipe Threads, Taper (NPTF)' },
            { code: 'SAE J514', title: 'Hydraulic Tube Fittings (JIC 37° Flared)' },
            { code: 'SAE J1453', title: 'O-Ring Face Seal (ORFS)' },
            { code: 'ISO 2901', title: 'ISO metric trapezoidal screw threads (Tr 30°)' },
            { code: 'ASME B1.5', title: 'Acme Screw Threads (29°)' },
            { code: 'DIN 513', title: 'Metrisches Sägengewinde (Buttress 45°/3°)' },
            { code: 'DIN 40430', title: 'Panzergewinde (Pg 80° cable glands)' },
            { code: 'DIN 7756', title: 'Ventilgewinde für Fahrzeugbereifung (Vg tire valves)' },
            { code: 'DIN 477', title: 'Gasflaschenventile (W high-pressure gas valves)' }
        ],
        formulaLatex: 'd_2 = d - k_2 P, \\quad d_1 = d - k_1 P'
    },
    inputs: [
        {
            key: 'type',
            label: 'Thread Standard (45 Tipleri)',
            description: 'Standart diş tipi ve profil ailesi',
            unit: '-',
            defaultValue: 'M',
            options: THREAD_TYPE_OPTIONS.map((o) => ({
                label: `${o.label} [${o.category}]`,
                value: o.value
            })),
            validation: { required: true }
        },
        {
            key: 'nominalDia',
            label: 'Nominal Çap (d)',
            description: 'Temel dış çap (boru dişlerinde mastar düzlemi dış çapı)',
            unit: 'mm',
            defaultValue: 10,
            validation: { required: true, min: 1, step: 1 }
        },
        {
            key: 'pitch',
            label: 'Hatve / Pitch (P)',
            description: 'Eksenel hatve (mm). İnç serisi için 25.4 / TPI dönüştürülür.',
            unit: 'mm',
            defaultValue: 1.5,
            validation: { required: true, min: 0.1, step: 0.25 }
        }
    ],
    outputs: [
        {
            key: 'majorDia',
            label: 'Major Diameter (d)',
            unit: 'mm',
            description: 'Outer diameter of the thread',
            formulaLatex: 'd = d_{nom}'
        },
        {
            key: 'pitchDia',
            label: 'Pitch Diameter (d2)',
            unit: 'mm',
            description: 'Effective pitch diameter where tooth and space widths are equal',
            formulaLatex: 'd_2 = d - k_2 P'
        },
        {
            key: 'minorDia',
            label: 'Minor Diameter (d1)',
            unit: 'mm',
            description: 'Internal basic minor / root diameter',
            formulaLatex: 'd_1 = d - k_1 P'
        },
        {
            key: 'threadHeight',
            label: 'Thread Height (H1)',
            unit: 'mm',
            description: 'Depth of thread flank engagement',
            formulaLatex: 'H_1 = k_h P'
        },
        {
            key: 'tapDrill',
            label: 'Tap Drill Size (Kılavuz Matkabı)',
            unit: 'mm',
            description: 'Recommended drill bit diameter for internal tapping',
            formulaLatex: '\\text{Drill} \\approx d - P'
        },
        {
            key: 'stressArea',
            label: 'Tensile Stress Area (As)',
            unit: 'mm2',
            description: 'Effective tensile stress cross-section',
            formulaLatex: 'A_s = \\pi/4\\,(d - 0.9382 P)^2'
        },
        {
            key: 'profileAngle',
            label: 'Profile Angle (Diş Açısı)',
            unit: 'deg',
            description: 'Included flank angle',
            formulaLatex: '\\alpha'
        }
    ],
    calculationEngine: (inputs) => {
        const type = String(inputs.type.value);
        let d = Number(inputs.nominalDia.value);
        let p = Number(inputs.pitch.value);

        if (isNaN(d) || d <= 0) d = 10;
        if (isNaN(p) || p <= 0) {
            p = defaultPitchMm(type, d) ?? 1.5;
        }

        const g = computeThreadProfile(type, d, p);
        const warnings: Array<{ field: string; message: string; severity: 'info' | 'warning' | 'critical' }> = [];

        if (g.isTapered) {
            warnings.push({
                field: 'type',
                message: `Tapered pipe thread (${g.taperLabel}): Diameters are specified at the gauge plane (L1). Do not mix 60° NPT with 55° BSPT — incompatible angles cause joint leaks.`,
                severity: 'warning'
            });
        }

        if (type === 'NPSM' || type === 'NPS') {
            warnings.push({
                field: 'type',
                message: 'NPSM is a parallel mechanical pipe thread. It is NOT self-sealing on the flanks and requires an O-ring or face washer.',
                severity: 'info'
            });
        }

        if (type === 'G' || type === 'BSPP') {
            warnings.push({
                field: 'type',
                message: 'BSPP (G) is a cylindrical non-sealing thread (ISO 228-1). Pressure-tight joint requires an elastomeric Dowty seal, copper gasket, or O-ring.',
                severity: 'info'
            });
        }

        if (type === 'JIC') {
            warnings.push({
                field: 'type',
                message: 'JIC 37° relies on metal-to-metal cone contact at the nose. Inspect the 37° flared seat for scratches before torquing.',
                severity: 'info'
            });
        }

        const preferred = defaultPitchMm(type, d);
        if (preferred && Math.abs(preferred - p) > 1e-6 && (type === 'M' || type === 'MF')) {
            warnings.push({
                field: 'pitch',
                message: `Preferred ${type === 'MF' ? 'fine' : 'coarse'} pitch for Ø${d}mm is ${preferred} mm.`,
                severity: 'info'
            });
        }

        return {
            outputs: {
                majorDia: createValidatedValue(g.d, 'mm', 'derived'),
                pitchDia: createValidatedValue(g.d2, 'mm', 'derived'),
                minorDia: createValidatedValue(g.d1, 'mm', 'derived'),
                threadHeight: createValidatedValue(g.h1, 'mm', 'derived'),
                tapDrill: createValidatedValue(g.tapDrill, 'mm', 'derived'),
                stressArea: createValidatedValue(g.stressArea, 'mm2', 'derived'),
                profileAngle: createValidatedValue(g.angleDeg, 'deg', 'derived'),
            },
            verified: true,
            warnings,
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result: CalculationResult, inputs: Record<string, any>) => {
            const t = String(inputs['type'] || 'M');
            const p = Number(inputs['pitch'] || 1.5);
            const d = Number(inputs['nominalDia'] || 10);
            const tap = Number(result?.outputs?.tapDrill?.value ?? d - p);

            return (
                <ThreadVisualizer
                    type={t}
                    pitch={p}
                    majorDia={d}
                    tapDrill={tap}
                    height={400}
                />
            );
        }
    }
};

export default threadGeometrySchema;
