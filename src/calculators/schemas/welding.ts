/**
 * AluCalc OS — Fillet Weld Calculator Schema
 * 
 * ENGINEERING DOMAIN: Mechanical / Structural
 * STANDARDS: EN 1993-1-8, AWS D1.1
 * 
 * Calculates fillet weld capacity and stress:
 * - Throat area
 * - Shear/tensile stress
 * - Safety factor
 */

import type { CalculatorSchema } from '@/types/calculator-schema';

export const weldingSchema: CalculatorSchema = {
    id: 'welding-v1',
    version: '1.0.0',
    domain: 'mechanical',

    metadata: {
        title: 'Fillet Weld Calculator',
        description: 'Calculate fillet weld capacity and stress. Based on EN 1993-1-8 directional method.',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-08',
        tags: ['welding', 'fillet', 'weld', 'stress', 'MIG', 'TIG']
    },

    inputs: [
        {
            key: 'legSize',
            name: 'Leg Size (a)',
            unit: 'mm',
            default: 5,
            min: 2,
            max: 30,
            step: 0.5,
            description: 'Fillet weld leg size.',
            required: true
        },
        {
            key: 'weldLength',
            name: 'Weld Length',
            unit: 'mm',
            default: 100,
            min: 10,
            max: 10000,
            step: 10,
            description: 'Total effective weld length.',
            required: true
        },
        {
            key: 'F',
            name: 'Applied Force',
            unit: 'kN',
            default: 20,
            min: 0.1,
            max: 10000,
            step: 0.5,
            description: 'Total force on the weld joint.',
            required: true
        },
        {
            key: 'loadAngle',
            name: 'Load Angle',
            unit: '°',
            default: 0,
            min: 0,
            max: 90,
            step: 5,
            description: '0°=parallel (shear), 90°=perpendicular (tensile)',
            required: false
        },
        {
            key: 'fu',
            name: 'Electrode Ultimate',
            unit: 'MPa',
            default: 430,
            min: 300,
            max: 800,
            step: 10,
            description: 'Ultimate tensile strength of weld metal. E70XX=480MPa.',
            required: true
        },
        {
            key: 'betaW',
            name: 'Correlation Factor',
            unit: '-',
            default: 0.85,
            min: 0.7,
            max: 1.0,
            step: 0.01,
            description: 'Correlation factor βw. S235=0.8, S355=0.9, Aluminum=0.9',
            required: false
        },
        {
            key: 'gammaM2',
            name: 'Partial Safety Factor',
            unit: '-',
            default: 1.25,
            min: 1.0,
            max: 1.5,
            step: 0.05,
            description: 'Material partial factor γM2 per EN 1993 (typically 1.25)',
            required: false
        }
    ],

    outputs: [
        {
            key: 'throat',
            name: 'Throat Thickness',
            unit: 'mm',
            formula: 'legSize * 0.707',
            description: 'Effective throat = a × cos(45°) ≈ 0.707a',
            precision: 2,
            affectsGeometry: true
        },
        {
            key: 'Aw',
            name: 'Weld Area',
            unit: 'mm²',
            formula: 'throat * weldLength',
            description: 'Effective weld throat area',
            precision: 1
        },
        {
            key: 'sigma_perp',
            name: 'Perpendicular Stress',
            unit: 'MPa',
            formula: 'F * 1000 * sin(loadAngle * PI / 180) / Aw',
            description: 'Normal stress perpendicular to weld throat',
            precision: 1
        },
        {
            key: 'tau_perp',
            name: 'Shear Stress ⊥',
            unit: 'MPa',
            formula: 'F * 1000 * sin(loadAngle * PI / 180) / Aw',
            description: 'Shear stress perpendicular to weld axis',
            precision: 1
        },
        {
            key: 'tau_para',
            name: 'Shear Stress ∥',
            unit: 'MPa',
            formula: 'F * 1000 * cos(loadAngle * PI / 180) / Aw',
            description: 'Shear stress parallel to weld axis',
            precision: 1
        },
        {
            key: 'sigmaEq',
            name: 'Equivalent Stress',
            unit: 'MPa',
            formula: 'sqrt(sigma_perp^2 + 3 * (tau_perp^2 + tau_para^2))',
            description: 'Von Mises equivalent stress',
            precision: 1,
            warningThreshold: {
                max: 300,
                message: 'High weld stress. Consider longer weld or larger throat.'
            }
        },
        {
            key: 'fvwd',
            name: 'Design Resistance',
            unit: 'MPa',
            formula: 'fu / (sqrt(3) * betaW * gammaM2)',
            description: 'Design shear strength of weld',
            precision: 1
        },
        {
            key: 'utilization',
            name: 'Utilization',
            unit: '%',
            formula: '(sigmaEq / fvwd) * 100',
            description: 'Percentage of weld capacity used',
            precision: 1,
            warningThreshold: {
                max: 100,
                message: 'Weld overstressed! Increase size or length.'
            }
        }
    ],

    assumptions: [
        {
            id: 'continuous-weld',
            text: 'Weld is continuous with no start/stop craters included.',
            impact: 'low',
            source: 'EN 1993-1-8'
        },
        {
            id: 'quality-c',
            text: 'Assumes weld quality level C (standard) per ISO 5817.',
            impact: 'medium',
            source: 'ISO 5817'
        },
        {
            id: 'no-fatigue',
            text: 'Static loading only. Fatigue requires detail categories.',
            impact: 'high',
            source: 'EN 1993-1-9'
        }
    ],

    references: [
        {
            standard: 'EN 1993-1-8',
            section: '4.5.3',
            title: 'Design resistance of fillet welds',
        },
        {
            standard: 'AWS D1.1',
            title: 'Structural Welding Code - Steel',
        }
    ],

    tier: 'free'
};

export default weldingSchema;
