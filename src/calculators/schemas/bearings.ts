/**
 * AluCalc OS — Rolling Bearing Life Calculator Schema
 * 
 * ENGINEERING DOMAIN: Mechanical
 * STANDARDS: ISO 281, SKF methodology
 * 
 * Calculates rolling bearing basic rating life (L10):
 * - Basic rating life in revolutions
 * - Life in hours
 * - Adjusted life with reliability factors
 */

import type { CalculatorSchema } from '@/types/calculator-schema';

export const bearingsSchema: CalculatorSchema = {
    id: 'bearings-v1',
    version: '1.0.0',
    domain: 'mechanical',

    metadata: {
        title: 'Bearing Life Calculator (L10)',
        description: 'Calculate rolling bearing basic rating life per ISO 281. Supports ball and roller bearings.',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-08',
        tags: ['bearing', 'L10', 'life', 'rolling', 'fatigue', 'SKF']
    },

    inputs: [
        {
            key: 'bearingType',
            name: 'Bearing Type',
            unit: '-',
            default: 1,
            min: 1,
            max: 2,
            step: 1,
            description: '1=Ball bearing (p=3), 2=Roller bearing (p=10/3)',
            required: true
        },
        {
            key: 'C',
            name: 'Dynamic Load Rating',
            unit: 'kN',
            default: 25,
            min: 1,
            max: 5000,
            step: 0.5,
            description: 'Basic dynamic load rating (C). From manufacturer catalog.',
            required: true
        },
        {
            key: 'Fr',
            name: 'Radial Load',
            unit: 'kN',
            default: 5,
            min: 0,
            max: 1000,
            step: 0.1,
            description: 'Applied radial load on bearing.',
            required: true
        },
        {
            key: 'Fa',
            name: 'Axial Load',
            unit: 'kN',
            default: 0,
            min: 0,
            max: 1000,
            step: 0.1,
            description: 'Applied axial/thrust load on bearing.',
            required: false
        },
        {
            key: 'n',
            name: 'Rotational Speed',
            unit: 'rpm',
            default: 1500,
            min: 1,
            max: 100000,
            step: 100,
            description: 'Shaft rotational speed.',
            required: true
        },
        {
            key: 'X',
            name: 'Radial Factor',
            unit: '-',
            default: 1,
            min: 0.4,
            max: 1,
            step: 0.01,
            description: 'Radial factor for combined loading. Typically 0.56-1.0.',
            required: false
        },
        {
            key: 'Y',
            name: 'Axial Factor',
            unit: '-',
            default: 0,
            min: 0,
            max: 2.5,
            step: 0.01,
            description: 'Axial factor for combined loading. From bearing tables.',
            required: false
        },
        {
            key: 'a1',
            name: 'Reliability Factor',
            unit: '-',
            default: 1,
            min: 0.21,
            max: 1,
            step: 0.01,
            description: 'Life adjustment for reliability. 1.0=90%, 0.62=95%, 0.53=96%, 0.44=97%, 0.33=98%, 0.21=99%',
            required: false
        }
    ],

    outputs: [
        {
            key: 'p',
            name: 'Life Exponent',
            unit: '-',
            formula: 'bearingType == 1 ? 3 : 3.33',
            description: 'p=3 for ball, p=10/3 for roller bearings',
            precision: 2
        },
        {
            key: 'P',
            name: 'Equivalent Load',
            unit: 'kN',
            formula: 'X * Fr + Y * Fa',
            description: 'Dynamic equivalent load P = X·Fr + Y·Fa',
            precision: 2
        },
        {
            key: 'L10',
            name: 'Basic Life (L10)',
            unit: 'Mrev',
            formula: '(C / P)^p',
            description: 'Basic rating life in million revolutions at 90% reliability',
            precision: 1
        },
        {
            key: 'L10h',
            name: 'Life in Hours',
            unit: 'h',
            formula: 'L10 * 1000000 / (n * 60)',
            description: 'Basic rating life in operating hours',
            precision: 0,
            warningThreshold: {
                min: 5000,
                message: 'Bearing life below 5000 hours. Consider larger bearing.'
            }
        },
        {
            key: 'Lna',
            name: 'Adjusted Life',
            unit: 'h',
            formula: 'a1 * L10h',
            description: 'Modified life with reliability factor a₁',
            precision: 0
        },
        {
            key: 'years',
            name: 'Life in Years',
            unit: 'years',
            formula: 'L10h / 8760',
            description: 'Life assuming continuous 24/7 operation',
            precision: 2
        },
        {
            key: 'loadRatio',
            name: 'Load Ratio (C/P)',
            unit: '-',
            formula: 'C / P',
            description: 'Ratio of capacity to load. Higher = longer life.',
            precision: 2
        }
    ],

    assumptions: [
        {
            id: 'adequate-lubrication',
            text: 'Assumes adequate lubrication (κ ≥ 1). Poor lubrication reduces life.',
            impact: 'high',
            source: 'ISO 281'
        },
        {
            id: 'normal-temperature',
            text: 'Operating temperature below 120°C. Higher temps reduce capacity.',
            impact: 'medium',
            source: 'SKF General Catalogue'
        },
        {
            id: 'clean-conditions',
            text: 'Clean operating conditions. Contamination reduces life significantly.',
            impact: 'high',
            source: 'ISO 281'
        },
        {
            id: 'constant-load',
            text: 'Load is constant. Variable loads require cumulative damage calculation.',
            impact: 'medium',
            source: 'ISO 281'
        }
    ],

    references: [
        {
            standard: 'ISO 281',
            title: 'Rolling bearings - Dynamic load ratings and rating life',
            url: 'https://www.iso.org/standard/75099.html'
        },
        {
            standard: 'SKF',
            title: 'Rolling Bearings Catalogue',
            url: 'https://www.skf.com/group/products/rolling-bearings'
        }
    ],

    tier: 'free'
};

export default bearingsSchema;
