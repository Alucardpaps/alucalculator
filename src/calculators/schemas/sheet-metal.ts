/**
 * AluCalc OS — Sheet Metal Bending Calculator Schema
 * 
 * ENGINEERING DOMAIN: Mechanical / Manufacturing
 * STANDARDS: DIN 6935, VDI 3367
 * 
 * Calculate sheet metal bend allowance and developed length:
 * - Bend allowance (BA)
 * - K-factor
 * - Flat pattern length
 */

import type { CalculatorSchema } from '@/types/calculator-schema';

export const sheetMetalSchema: CalculatorSchema = {
    id: 'sheet-metal-v1',
    version: '1.0.0',
    domain: 'mechanical',

    metadata: {
        title: 'Sheet Metal Bend Calculator',
        description: 'Calculate bend allowance, K-factor, and flat pattern for sheet metal bending.',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-08',
        tags: ['sheet metal', 'bending', 'K-factor', 'bend allowance', 'flat pattern']
    },

    inputs: [
        {
            key: 't',
            name: 'Sheet Thickness',
            unit: 'mm',
            default: 2,
            min: 0.3,
            max: 25,
            step: 0.1,
            description: 'Material thickness.',
            required: true
        },
        {
            key: 'Ri',
            name: 'Inside Bend Radius',
            unit: 'mm',
            default: 3,
            min: 0.5,
            max: 100,
            step: 0.5,
            description: 'Inside radius of the bend.',
            required: true
        },
        {
            key: 'angle',
            name: 'Bend Angle',
            unit: '°',
            default: 90,
            min: 1,
            max: 180,
            step: 1,
            description: 'Bend angle in degrees.',
            required: true
        },
        {
            key: 'L1',
            name: 'Leg 1 Length',
            unit: 'mm',
            default: 50,
            min: 5,
            max: 5000,
            step: 1,
            description: 'Length of first leg (outside measure).',
            required: true
        },
        {
            key: 'L2',
            name: 'Leg 2 Length',
            unit: 'mm',
            default: 50,
            min: 5,
            max: 5000,
            step: 1,
            description: 'Length of second leg (outside measure).',
            required: true
        },
        {
            key: 'materialType',
            name: 'Material Type',
            unit: '-',
            default: 1,
            min: 1,
            max: 4,
            step: 1,
            description: '1=Soft (Al, Cu), 2=Medium (Mild Steel), 3=Hard (Stainless), 4=Spring Steel',
            required: false
        }
    ],

    outputs: [
        {
            key: 'ratio',
            name: 'Ri/t Ratio',
            unit: '-',
            formula: 'Ri / t',
            description: 'Radius to thickness ratio',
            precision: 2
        },
        {
            key: 'K',
            name: 'K-Factor',
            unit: '-',
            formula: 'materialType == 1 ? 0.33 : (materialType == 2 ? 0.40 : (materialType == 3 ? 0.45 : 0.50))',
            description: 'Position of neutral axis. Soft≈0.33, Hard≈0.50',
            precision: 2
        },
        {
            key: 'Rn',
            name: 'Neutral Radius',
            unit: 'mm',
            formula: 'Ri + K * t',
            description: 'Radius of neutral axis',
            precision: 2
        },
        {
            key: 'BA',
            name: 'Bend Allowance',
            unit: 'mm',
            formula: 'PI * angle / 180 * Rn',
            description: 'Arc length at neutral axis',
            precision: 2
        },
        {
            key: 'BD',
            name: 'Bend Deduction',
            unit: 'mm',
            formula: '2 * (Ri + t) * tan(angle * PI / 360) - BA',
            description: 'Amount to subtract from outside dimensions',
            precision: 2
        },
        {
            key: 'OSSB',
            name: 'Outside Setback',
            unit: 'mm',
            formula: '(Ri + t) * tan(angle * PI / 360)',
            description: 'Tangent distance from apex to bend start',
            precision: 2
        },
        {
            key: 'flatLength',
            name: 'Flat Pattern Length',
            unit: 'mm',
            formula: '(L1 - Ri - t) + BA + (L2 - Ri - t)',
            description: 'Total developed length before bending',
            precision: 2
        },
        {
            key: 'minBendRadius',
            name: 'Min Bend Radius',
            unit: 'mm',
            formula: 'materialType == 1 ? 0 : (materialType == 2 ? 0.8 * t : (materialType == 3 ? t : 1.5 * t))',
            description: 'Recommended minimum inside radius to avoid cracking',
            precision: 1
        },
        {
            key: 'springback',
            name: 'Est. Springback',
            unit: '°',
            formula: 'materialType == 1 ? angle * 0.01 : (materialType == 2 ? angle * 0.02 : (materialType == 3 ? angle * 0.03 : angle * 0.05))',
            description: 'Estimated springback angle (overbend by this amount)',
            precision: 1
        }
    ],

    assumptions: [
        {
            id: 'air-bending',
            text: 'Assumes air bending process. Bottoming/coining has different K-factors.',
            impact: 'medium',
            source: 'VDI 3367'
        },
        {
            id: 'uniform-thickness',
            text: 'Sheet thickness is uniform before and after bending.',
            impact: 'low',
            source: 'DIN 6935'
        },
        {
            id: 'grain-direction',
            text: 'Bend line perpendicular to rolling direction assumed. Parallel may crack.',
            impact: 'high',
            source: 'Manufacturing practice'
        }
    ],

    references: [
        {
            standard: 'DIN 6935',
            title: 'Cold bending of flat rolled steel products',
        },
        {
            standard: 'VDI 3367',
            title: 'Sheet metal bending - Basis and calculations',
        }
    ],

    tier: 'free'
};

export default sheetMetalSchema;
