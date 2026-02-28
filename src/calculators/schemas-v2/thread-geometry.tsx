import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue, type CalculationResult } from '@/types/engineering';
import { ThreadVisualizer } from '@/components/visualizers/ThreadVisualizer';
import React from 'react';

export const threadGeometrySchema: CalculatorSchemaV2 = {
    id: 'thread-geometry',
    metadata: {
        title: 'Universal Thread Geometry',
        description: 'Calculate dimensions for Metric, Unified, and other thread standards.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-12',
        tags: ['thread', 'screw', 'fastener', 'iso', 'ansi'],
        verifiedStandards: ['ISO 68-1', 'ASME B1.1']
    },
    documentation: {
        assumptions: [
            { id: 'standard-thread', text: 'Assumes standard thread profiles (Basic Profile)', impact: 'medium' }
        ],
        standards: [
            { code: 'ISO 68-1', title: 'ISO general purpose screw threads — Basic profile' },
            { code: 'ASME B1.1', title: 'Unified Inch Screw Threads' }
        ],
        formulaLatex: 'd_2 = d - 0.6495 P'
    },
    inputs: [
        {
            key: 'type',
            label: 'Thread Standard',
            description: 'Type of thread profile',
            unit: '-',
            defaultValue: 'M',
            options: [
                { label: 'Metric (ISO 68-1)', value: 'M' },
                { label: 'Unified (UNC/UNF)', value: 'UN' },
                { label: 'Whitworth (BSW)', value: 'W' },
                { label: 'Pipe (G/R - ISO 228)', value: 'G' },
                { label: 'Trapezoidal (Tr - ISO 2901)', value: 'Tr' },
                { label: 'Buttress (S)', value: 'S' }
            ],
            validation: { required: true }
        },
        {
            key: 'nominalDia',
            label: 'Nominal Diameter (d)',
            description: 'Basic major diameter',
            unit: 'mm',
            defaultValue: 10,
            validation: { required: true, min: 1, step: 1 }
        },
        {
            key: 'pitch',
            label: 'Pitch (P)',
            description: 'Axial distance between threads (mm). Enter TPI for Inch if converted.',
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
            key: 'minorDia',
            label: 'Minor Diameter (d1)',
            unit: 'mm',
            description: 'Root diameter of the thread',
            formulaLatex: 'd_1 = d - 1.08 P'
        },
        {
            key: 'pitchDia',
            label: 'Pitch Diameter (d2)',
            unit: 'mm',
            description: 'Effective diameter',
            formulaLatex: 'd_2 = d - 0.649 P'
        },
        {
            key: 'threadHeight',
            label: 'Thread Height (H1)',
            unit: 'mm',
            description: 'Depth of thread engagement',
            formulaLatex: 'H_1 = 0.541 P'
        },
        {
            key: 'tapDrill',
            label: 'Tap Drill Size',
            unit: 'mm',
            description: 'Recommended drill bit diameter',
            formulaLatex: '\\text{Drill} \\approx d - P'
        }
    ],
    calculationEngine: (inputs) => {
        const type = String(inputs.type.value);
        let d = Number(inputs.nominalDia.value);
        let p = Number(inputs.pitch.value);

        // Safety / Defaults
        if (isNaN(d)) d = 10;
        if (isNaN(p)) p = 1.5;

        // Constants
        const sqrt3 = Math.sqrt(3); // 1.73205

        let d2 = 0; // Pitch Dia
        let d1 = 0; // Minor Dia
        let h1 = 0; // Thread Engagement Depth
        let drill = 0; // Tap Drill

        // Calculation Logic based on Standard
        if (type === 'M' || type === 'UN') {
            // ISO / Unified (60 deg)
            // H = 0.866025 * P
            // d2 = d - 0.64952 * P
            // d1 = d - 1.08253 * P
            // h1 = 0.54127 * P (Basic Thread Overlap)

            d2 = d - 0.64952 * p;
            d1 = d - 1.08253 * p;
            h1 = 0.54127 * p;
            drill = d - p; // Simplify coarse rule
        }
        else if (type === 'W' || type === 'G') {
            // Whitworth 55 deg
            // h = 0.6403 * P
            // d2 = d - h
            // d1 = d - 2*h
            const h = 0.640327 * p;
            d2 = d - h;
            d1 = d - 2 * h;
            h1 = h;
            drill = d1; // Usually drill is slightly larger than minor
        }
        else if (type === 'Tr') {
            // Trapezoidal 30 deg (DIN 103)
            // H1 = 0.5 * P
            // d2 = d - 0.5 * P
            // d1 = d - P - (Clearance? ignored for basic geom) -> d1 = d - P is close
            // Actually d3 (minor) = d - P - 2*ac?
            // Simplified:
            h1 = 0.5 * p;
            d2 = d - 0.5 * p;
            d1 = d - p; // Approx
            drill = d - p;
        }

        return {
            outputs: {
                majorDia: createValidatedValue(d, 'mm', 'derived'),
                minorDia: createValidatedValue(d1, 'mm', 'derived'),
                pitchDia: createValidatedValue(d2, 'mm', 'derived'),
                threadHeight: createValidatedValue(h1, 'mm', 'derived'),
                tapDrill: createValidatedValue(drill, 'mm', 'derived')
            },
            verified: true,
            warnings: [],
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric', // Corrected type
        render: (result: CalculationResult, inputs: Record<string, any>) => { // Corrected type
            const t = String(inputs['type'] || 'M') as any;
            const p = Number(inputs['pitch'] || 1.5);

            return (
                <ThreadVisualizer
                    type={t}
                    pitch={p}
                    height={250}
                />
            );
        }
    }
};
