/**
 * AluCalc OS — Strength Analysis Calculator Schema
 * 
 * ENGINEERING DOMAIN: Mechanical
 * STANDARDS: Peterson's Stress Concentration Factors
 * 
 * Calculate stress concentration and fatigue factors:
 * - Geometric stress concentration (Kt)
 * - Fatigue stress concentration (Kf)
 * - Notch sensitivity
 */

import type { CalculatorSchema } from '@/types/calculator-schema';

export const strengthAnalysisSchema: CalculatorSchema = {
    id: 'strength-analysis-v1',
    version: '1.0.0',
    domain: 'mechanical',

    metadata: {
        title: 'Stress Concentration Calculator',
        description: 'Calculate stress concentration factors for common geometries. Based on Peterson\'s.',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-08',
        tags: ['stress', 'concentration', 'Kt', 'Kf', 'fatigue', 'notch']
    },

    inputs: [
        {
            key: 'geometryType',
            name: 'Geometry Type',
            unit: '-',
            default: 1,
            min: 1,
            max: 4,
            step: 1,
            description: '1=Shoulder fillet, 2=Hole in plate, 3=Notch, 4=Keyway',
            required: true
        },
        {
            key: 'D',
            name: 'Major Diameter/Width',
            unit: 'mm',
            default: 50,
            min: 5,
            max: 1000,
            step: 1,
            description: 'Larger diameter or width of the section.',
            required: true
        },
        {
            key: 'd',
            name: 'Minor Diameter/Width',
            unit: 'mm',
            default: 40,
            min: 5,
            max: 1000,
            step: 1,
            description: 'Smaller diameter or net width at stress raiser.',
            required: true
        },
        {
            key: 'r',
            name: 'Fillet/Notch Radius',
            unit: 'mm',
            default: 3,
            min: 0.1,
            max: 100,
            step: 0.5,
            description: 'Radius of fillet, notch, or hole.',
            required: true
        },
        {
            key: 'sigmaNom',
            name: 'Nominal Stress',
            unit: 'MPa',
            default: 100,
            min: 1,
            max: 1000,
            step: 1,
            description: 'Nominal stress at the reduced section (F/A).',
            required: true
        },
        {
            key: 'Su',
            name: 'Ultimate Strength',
            unit: 'MPa',
            default: 500,
            min: 100,
            max: 2500,
            step: 10,
            description: 'Material ultimate tensile strength (for notch sensitivity).',
            required: true
        }
    ],

    outputs: [
        {
            key: 'ratio_Dd',
            name: 'D/d Ratio',
            unit: '-',
            formula: 'D / d',
            description: 'Diameter or width ratio',
            precision: 2
        },
        {
            key: 'ratio_rd',
            name: 'r/d Ratio',
            unit: '-',
            formula: 'r / d',
            description: 'Radius to diameter ratio',
            precision: 3
        },
        {
            key: 'Kt',
            name: 'Stress Concentration (Kt)',
            unit: '-',
            formula: 'geometryType == 1 ? 1 + 2 * sqrt((D/d - 1) / (2 * r/d)) : (geometryType == 2 ? 3 - 3.13 * (2*r/D) + 3.66 * (2*r/D)^2 : (geometryType == 3 ? 1 + 2 * sqrt(d/(4*r)) : 2.14))',
            description: 'Geometric stress concentration factor',
            precision: 2
        },
        {
            key: 'sigmaMax',
            name: 'Maximum Stress',
            unit: 'MPa',
            formula: 'Kt * sigmaNom',
            description: 'Peak stress at concentration point',
            precision: 1,
            warningThreshold: {
                max: 400,
                message: 'High local stress. Consider larger radius.'
            }
        },
        {
            key: 'a',
            name: 'Neuber Constant',
            unit: 'mm^0.5',
            formula: '0.025 * (2070 / Su)^1.8',
            description: 'Material constant for notch sensitivity',
            precision: 4
        },
        {
            key: 'q',
            name: 'Notch Sensitivity',
            unit: '-',
            formula: '1 / (1 + a / sqrt(r))',
            description: 'Notch sensitivity factor (0-1). Higher = more sensitive.',
            precision: 3
        },
        {
            key: 'Kf',
            name: 'Fatigue Factor (Kf)',
            unit: '-',
            formula: '1 + q * (Kt - 1)',
            description: 'Fatigue stress concentration factor',
            precision: 2
        },
        {
            key: 'sigmaFatigue',
            name: 'Fatigue Stress',
            unit: 'MPa',
            formula: 'Kf * sigmaNom',
            description: 'Effective stress for fatigue analysis',
            precision: 1
        }
    ],

    assumptions: [
        {
            id: 'elastic-material',
            text: 'Material is linear elastic. Plastic deformation not considered.',
            impact: 'high',
            source: 'Peterson\'s'
        },
        {
            id: 'uniaxial-loading',
            text: 'Uniaxial stress state. Multiaxial requires different approach.',
            impact: 'medium',
            source: 'Peterson\'s'
        },
        {
            id: 'neuber-approximation',
            text: 'Neuber constant uses empirical correlation for steels.',
            impact: 'medium',
            source: 'Shigley\'s'
        }
    ],

    references: [
        {
            standard: 'Peterson\'s',
            title: 'Stress Concentration Factors, 3rd Edition',
        },
        {
            standard: 'Shigley\'s',
            title: 'Mechanical Engineering Design',
        }
    ],

    tier: 'free'
};

export default strengthAnalysisSchema;
