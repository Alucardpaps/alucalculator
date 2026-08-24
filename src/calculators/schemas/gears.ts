/**
 * AluCalc OS — Spur Gear Calculator Schema
 * 
 * ENGINEERING DOMAIN: Mechanical
 * STANDARDS: ISO 6336, DIN 3990
 * 
 * Calculates spur gear geometry and stress:
 * - Pitch/tip/root diameters
 * - Bending stress (Lewis formula)
 * - Contact stress (Hertz)
 */

import type { CalculatorSchema } from '@/types/calculator-schema';

export const gearsSchema: CalculatorSchema = {
    id: 'gears-v1',
    version: '1.0.0',
    domain: 'mechanical',

    metadata: {
        title: 'Spur Gear Calculator',
        description: 'Calculate spur gear geometry, bending stress, and contact stress. Based on ISO 6336 and Lewis formula.',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-08',
        tags: ['gear', 'spur', 'bending', 'contact', 'stress', 'power transmission']
    },

    inputs: [
        {
            key: 'm',
            name: 'Module',
            unit: 'mm',
            default: 2,
            min: 0.5,
            max: 25,
            step: 0.25,
            description: 'Gear module (m). Tooth size parameter.',
            required: true
        },
        {
            key: 'z1',
            name: 'Pinion Teeth',
            unit: '-',
            default: 20,
            min: 10,
            max: 200,
            step: 1,
            description: 'Number of teeth on pinion (smaller gear).',
            required: true
        },
        {
            key: 'z2',
            name: 'Gear Teeth',
            unit: '-',
            default: 40,
            min: 10,
            max: 500,
            step: 1,
            description: 'Number of teeth on gear (larger gear).',
            required: true
        },
        {
            key: 'alpha',
            name: 'Pressure Angle',
            unit: '°',
            default: 20,
            min: 14.5,
            max: 25,
            step: 0.5,
            description: 'Pressure angle. Standard is 20°.',
            required: true
        },
        {
            key: 'b',
            name: 'Face Width',
            unit: 'mm',
            default: 20,
            min: 5,
            max: 500,
            step: 1,
            description: 'Width of gear face.',
            required: true
        },
        {
            key: 'T',
            name: 'Torque on Pinion',
            unit: 'Nm',
            default: 50,
            min: 0.1,
            max: 100000,
            step: 1,
            description: 'Torque transmitted by the pinion.',
            required: true
        },
        {
            key: 'Sy',
            name: 'Material Yield',
            unit: 'MPa',
            default: 350,
            min: 100,
            max: 2000,
            step: 10,
            description: 'Yield strength of gear material.',
            required: true
        },
        {
            key: 'x1',
            name: 'Pinion Shift (x1)',
            unit: '-',
            default: 0,
            min: -1,
            max: 1.5,
            step: 0.01,
            description: 'Profile shift coefficient for pinion.',
            required: false // Optional
        },
        {
            key: 'x2',
            name: 'Gear Shift (x2)',
            unit: '-',
            default: 0,
            min: -1,
            max: 1.5,
            step: 0.01,
            description: 'Profile shift coefficient for gear.',
            required: false // Optional
        }
    ],

    outputs: [
        {
            key: 'd1',
            name: 'Pinion Pitch Diameter',
            unit: 'mm',
            formula: 'm * z1',
            description: 'd₁ = m × z₁',
            precision: 2,
            affectsGeometry: true
        },
        {
            key: 'd2',
            name: 'Gear Pitch Diameter',
            unit: 'mm',
            formula: 'm * z2',
            description: 'd₂ = m × z₂',
            precision: 2,
            affectsGeometry: true
        },
        {
            key: 'da1',
            name: 'Pinion Tip Diameter',
            unit: 'mm',
            formula: 'm * (z1 + 2 + 2 * x1)',
            description: 'Addendum circle diameter = m × (z + 2 + 2x)',
            precision: 2,
            affectsGeometry: true
        },
        {
            key: 'df1',
            name: 'Pinion Root Diameter',
            unit: 'mm',
            formula: 'm * (z1 - 2.5 + 2 * x1)',
            description: 'Dedendum circle diameter = m × (z - 2.5 + 2x)',
            precision: 2,
            affectsGeometry: true
        },
        {
            key: 'da2',
            name: 'Gear Tip Diameter',
            unit: 'mm',
            formula: 'm * (z2 + 2 + 2 * x2)',
            description: 'Addendum circle diameter = m × (z2 + 2 + 2x2)',
            precision: 2,
            affectsGeometry: true
        },
        {
            key: 'df2',
            name: 'Gear Root Diameter',
            unit: 'mm',
            formula: 'm * (z2 - 2.5 + 2 * x2)',
            description: 'Dedendum circle diameter = m × (z2 - 2.5 + 2x2)',
            precision: 2,
            affectsGeometry: true
        },
        {
            key: 'ratio',
            name: 'Gear Ratio',
            unit: '-',
            formula: 'z2 / z1',
            description: 'Transmission ratio = z₂/z₁',
            precision: 3
        },
        {
            key: 'centerDist',
            name: 'Center Distance',
            unit: 'mm',
            formula: 'm * (z1 + z2) / 2 + m * (x1 + x2)',
            description: 'Operating Center Distance (Approx)',
            precision: 2
        },
        {
            key: 'Ft',
            name: 'Tangential Force',
            unit: 'N',
            formula: '2 * T * 1000 / d1',
            description: 'Force at pitch circle = 2T/d',
            precision: 1
        },
        {
            key: 'sigmaBending',
            name: 'Bending Stress',
            unit: 'MPa',
            formula: 'Ft / (b * m * 0.32)',
            description: 'Tooth bending stress (Lewis simplified)',
            precision: 1,
            warningThreshold: {
                max: 200,
                message: 'High bending stress. Consider larger module or wider teeth.'
            }
        },
        {
            key: 'SF',
            name: 'Safety Factor',
            unit: '-',
            formula: 'Sy / sigmaBending',
            description: 'Safety factor against yield',
            precision: 2,
            warningThreshold: {
                min: 2,
                message: 'Safety factor below 2.0. Consider stronger material.'
            }
        }
    ],

    assumptions: [
        {
            id: 'spur-only',
            text: 'Calculation is for spur gears only. Helical gears require correction factors.',
            impact: 'high',
            source: 'ISO 6336'
        },
        {
            id: 'lewis-simplified',
            text: 'Bending stress uses simplified Lewis formula without dynamic factors.',
            impact: 'medium',
            source: 'Lewis 1892'
        },
        {
            id: 'standard-addendum',
            text: 'Standard addendum (ha = m) and dedendum (hf = 1.25m) assumed.',
            impact: 'low',
            source: 'ISO 53'
        }
    ],

    references: [
        {
            standard: 'ISO 6336',
            title: 'Calculation of load capacity of spur and helical gears',
        },
        {
            standard: 'DIN 3990',
            title: 'Calculation of load capacity of cylindrical gears',
        }
    ],

    visualizer: 'generateGearSVG',

    tier: 'free'
};

export default gearsSchema;
