/**
 * AluCalc OS — Fastener/Bolt Selection Calculator Schema
 * 
 * ENGINEERING DOMAIN: Mechanical
 * STANDARDS: ISO 898-1, DIN 931/933
 * 
 * Calculate bolt capacity, preload, and recommended torque:
 * - Proof load
 * - Tensile capacity
 * - Recommended tightening torque
 */

import type { CalculatorSchema } from '@/types/calculator-schema';

export const fastenersSchema: CalculatorSchema = {
    id: 'fasteners-v1',
    version: '1.0.0',
    domain: 'mechanical',

    metadata: {
        title: 'Fastener Selection Calculator',
        description: 'Calculate bolt/screw capacity, proof load, and tightening torque. Based on ISO 898-1.',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-08',
        tags: ['bolt', 'screw', 'fastener', 'torque', 'preload', 'ISO 898']
    },

    inputs: [
        {
            key: 'threadSize',
            name: 'Thread Size (M)',
            unit: 'mm',
            default: 10,
            min: 3,
            max: 64,
            step: 1,
            description: 'Metric thread nominal diameter (e.g., 10 for M10).',
            required: true
        },
        {
            key: 'pitch',
            name: 'Thread Pitch',
            unit: 'mm',
            default: 1.5,
            min: 0.35,
            max: 6,
            step: 0.25,
            description: 'Thread pitch. Use standard coarse pitch if unsure.',
            required: true
        },
        {
            key: 'propertyClass',
            name: 'Property Class',
            unit: '-',
            default: 88,
            min: 46,
            max: 129,
            step: 1,
            description: 'Bolt grade: 46=4.6, 88=8.8, 109=10.9, 129=12.9',
            required: true
        },
        {
            key: 'Fext',
            name: 'External Load',
            unit: 'kN',
            default: 15,
            min: 0,
            max: 5000,
            step: 0.5,
            description: 'External tensile load on the joint.',
            required: true
        },
        {
            key: 'frictionCoeff',
            name: 'Friction Coefficient',
            unit: '-',
            default: 0.14,
            min: 0.08,
            max: 0.25,
            step: 0.01,
            description: 'Total friction coefficient (thread + head). Oiled≈0.12, Dry≈0.18.',
            required: false
        },
        {
            key: 'utilizationTarget',
            name: 'Preload Utilization',
            unit: '%',
            default: 70,
            min: 50,
            max: 90,
            step: 5,
            description: 'Target preload as % of proof load. Typically 70-75%.',
            required: false
        }
    ],

    outputs: [
        {
            key: 'd2',
            name: 'Pitch Diameter',
            unit: 'mm',
            formula: 'threadSize - 0.6495 * pitch',
            description: 'd₂ = d - 0.6495·P',
            precision: 3
        },
        {
            key: 'd3',
            name: 'Minor Diameter',
            unit: 'mm',
            formula: 'threadSize - 1.2269 * pitch',
            description: 'd₃ = d - 1.2269·P',
            precision: 3
        },
        {
            key: 'As',
            name: 'Stress Area',
            unit: 'mm²',
            formula: 'PI / 4 * ((d2 + d3) / 2)^2',
            description: 'Tensile stress area per ISO 898-1',
            precision: 2
        },
        {
            key: 'Sy',
            name: 'Yield Strength',
            unit: 'MPa',
            formula: 'propertyClass < 80 ? propertyClass * 10 - 60 : (propertyClass < 100 ? 640 : (propertyClass < 120 ? 900 : 1080))',
            description: 'Minimum yield strength based on property class',
            precision: 0
        },
        {
            key: 'proofLoad',
            name: 'Proof Load',
            unit: 'kN',
            formula: 'As * Sy * 0.001',
            description: 'Maximum load without permanent deformation',
            precision: 2
        },
        {
            key: 'Fp',
            name: 'Target Preload',
            unit: 'kN',
            formula: 'proofLoad * utilizationTarget / 100',
            description: 'Recommended preload force',
            precision: 2
        },
        {
            key: 'MA',
            name: 'Tightening Torque',
            unit: 'Nm',
            formula: 'Fp * 1000 * threadSize * frictionCoeff / 1000',
            description: 'Recommended tightening torque (simplified)',
            precision: 1
        },
        {
            key: 'SF',
            name: 'Safety Factor',
            unit: '-',
            formula: 'proofLoad / Fext',
            description: 'Capacity ratio to external load',
            precision: 2,
            warningThreshold: {
                min: 2.5,
                message: 'Safety factor below 2.5. Consider larger bolt.'
            }
        },
        {
            key: 'jointForce',
            name: 'Joint Clamp Force',
            unit: 'kN',
            formula: 'Fp - Fext * 0.1',
            description: 'Remaining clamp force under load (assuming 10% load in bolt)',
            precision: 2,
            warningThreshold: {
                min: 0,
                message: 'Joint separation! Increase preload or bolt size.'
            }
        }
    ],

    assumptions: [
        {
            id: 'reusable-bolts',
            text: 'Assumes reusable (non-yielding) bolts. TTY bolts are single-use.',
            impact: 'medium',
            source: 'VDI 2230'
        },
        {
            id: 'concentric-loading',
            text: 'Load is concentric. Eccentric loads require moment calculations.',
            impact: 'high',
            source: 'VDI 2230'
        },
        {
            id: 'room-temperature',
            text: 'Properties at 20°C. High temperatures reduce strength.',
            impact: 'medium',
            source: 'ISO 898-1'
        }
    ],

    references: [
        {
            standard: 'ISO 898-1',
            title: 'Mechanical properties of fasteners - Bolts, screws and studs',
            url: 'https://www.iso.org/standard/79733.html'
        },
        {
            standard: 'VDI 2230',
            title: 'Systematic calculation of highly stressed bolted joints',
        }
    ],

    tier: 'free'
};

export default fastenersSchema;
