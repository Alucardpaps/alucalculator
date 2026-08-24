/**
 * AluCalc OS — Fits & Tolerances Calculator Schema
 * 
 * ENGINEERING DOMAIN: Mechanical
 * STANDARDS: ISO 286-1, ISO 286-2
 * 
 * Calculate ISO shaft-hole fits:
 * - Deviation limits
 * - Clearance/interference
 * - Fit type classification
 */

import type { CalculatorSchema } from '@/types/calculator-schema';

export const fitsTolerancesSchema: CalculatorSchema = {
    id: 'fits-tolerances-v1',
    version: '1.0.0',
    domain: 'mechanical',

    metadata: {
        title: 'Fits & Tolerances Calculator',
        description: 'Calculate ISO shaft-hole fits and tolerance zones. Based on ISO 286-1/2.',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-08',
        tags: ['fits', 'tolerances', 'ISO 286', 'shaft', 'hole', 'clearance', 'interference']
    },

    inputs: [
        {
            key: 'nominalSize',
            name: 'Nominal Size',
            unit: 'mm',
            default: 50,
            min: 1,
            max: 500,
            step: 1,
            description: 'Basic size of shaft/hole (e.g., 50mm diameter)',
            required: true
        },
        {
            key: 'holeGrade',
            name: 'Hole IT Grade',
            unit: '-',
            default: 7,
            min: 1,
            max: 18,
            step: 1,
            description: 'IT tolerance grade for hole (1=finest, 18=coarsest). H7 is common.',
            required: true
        },
        {
            key: 'holeDeviation',
            name: 'Hole Deviation Type',
            unit: '-',
            default: 8,
            min: 1,
            max: 20,
            step: 1,
            description: 'Hole position: 1=A...8=H...20=ZC. H=8 is most common (zero lower deviation).',
            required: true
        },
        {
            key: 'shaftGrade',
            name: 'Shaft IT Grade',
            unit: '-',
            default: 6,
            min: 1,
            max: 18,
            step: 1,
            description: 'IT tolerance grade for shaft. g6, h6, k6 are common.',
            required: true
        },
        {
            key: 'shaftDeviation',
            name: 'Shaft Deviation Type',
            unit: '-',
            default: 7,
            min: 1,
            max: 20,
            step: 1,
            description: 'Shaft position: 1=a...7=g, 8=h, 11=k, 12=m, 14=p, 16=s. g=7, h=8, k=11.',
            required: true
        }
    ],

    outputs: [
        {
            key: 'i',
            name: 'Tolerance Unit',
            unit: 'μm',
            formula: '0.45 * nominalSize^(1/3) + 0.001 * nominalSize',
            description: 'Standard tolerance unit i (ISO 286)',
            precision: 3
        },
        {
            key: 'IThole',
            name: 'Hole Tolerance',
            unit: 'μm',
            formula: 'holeGrade <= 5 ? 7 * i * (0.5 + holeGrade/5) : (holeGrade <= 10 ? 10^((holeGrade-5)/5) * 10 * i : 10^((holeGrade-10)/5) * 100 * i)',
            description: 'Calculated hole tolerance width',
            precision: 1
        },
        {
            key: 'ITshaft',
            name: 'Shaft Tolerance',
            unit: 'μm',
            formula: 'shaftGrade <= 5 ? 7 * i * (0.5 + shaftGrade/5) : (shaftGrade <= 10 ? 10^((shaftGrade-5)/5) * 10 * i : 10^((shaftGrade-10)/5) * 100 * i)',
            description: 'Calculated shaft tolerance width',
            precision: 1
        },
        {
            key: 'holeUpperDev',
            name: 'Hole Upper Dev.',
            unit: 'μm',
            formula: 'holeDeviation == 8 ? IThole : IThole * 1.5',
            description: 'Upper deviation of hole (ES)',
            precision: 1
        },
        {
            key: 'holeLowerDev',
            name: 'Hole Lower Dev.',
            unit: 'μm',
            formula: 'holeDeviation == 8 ? 0 : IThole * 0.5',
            description: 'Lower deviation of hole (EI)',
            precision: 1
        },
        {
            key: 'shaftUpperDev',
            name: 'Shaft Upper Dev.',
            unit: 'μm',
            formula: 'shaftDeviation == 8 ? 0 : (shaftDeviation < 8 ? -5 * (8 - shaftDeviation) : 5 * (shaftDeviation - 8))',
            description: 'Upper deviation of shaft (es)',
            precision: 1
        },
        {
            key: 'shaftLowerDev',
            name: 'Shaft Lower Dev.',
            unit: 'μm',
            formula: 'shaftUpperDev - ITshaft',
            description: 'Lower deviation of shaft (ei)',
            precision: 1
        },
        {
            key: 'maxClearance',
            name: 'Max Clearance',
            unit: 'μm',
            formula: 'holeUpperDev - shaftLowerDev',
            description: 'Maximum clearance (positive) or interference (negative)',
            precision: 1
        },
        {
            key: 'minClearance',
            name: 'Min Clearance',
            unit: 'μm',
            formula: 'holeLowerDev - shaftUpperDev',
            description: 'Minimum clearance (positive) or interference (negative)',
            precision: 1
        },
        {
            key: 'fitType',
            name: 'Fit Type Code',
            unit: '-',
            formula: 'minClearance > 0 ? 1 : (maxClearance < 0 ? 3 : 2)',
            description: '1=Clearance, 2=Transition, 3=Interference',
            precision: 0
        }
    ],

    assumptions: [
        {
            id: 'iso-system',
            text: 'Uses ISO 286 hole-basis system. Shaft-basis requires transposition.',
            impact: 'medium',
            source: 'ISO 286-1'
        },
        {
            id: 'simplified-dev',
            text: 'Fundamental deviations are simplified. Use tables for exact values.',
            impact: 'high',
            source: 'ISO 286-2'
        }
    ],

    references: [
        {
            standard: 'ISO 286-1',
            title: 'ISO system of limits and fits - Bases of tolerances',
        },
        {
            standard: 'ISO 286-2',
            title: 'ISO system of limits and fits - Tables of standard tolerance grades',
        }
    ],

    tier: 'free'
};

export default fitsTolerancesSchema;
