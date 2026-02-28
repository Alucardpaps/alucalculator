/**
 * AluCalc OS — Profile Weight Calculator Schema
 * 
 * ENGINEERING DOMAIN: Mechanical
 * STANDARDS: EN 755-2, EN 573-3
 * 
 * Calculates weight of aluminum and steel structural profiles:
 * - Box sections (rectangular hollow)
 * - Tubes (circular hollow)
 * - Angles (L-profiles)
 * - Channels (C/U-profiles)
 * - I-Beams (H/I-profiles)
 */

import type { CalculatorSchema } from '@/types/calculator-schema';

export const profileWeightSchema: CalculatorSchema = {
    id: 'profile-weight-v1',
    version: '1.0.0',
    domain: 'mechanical',

    metadata: {
        title: 'Profile Weight Calculator',
        description: 'Calculate cross-section area and weight of aluminum/steel profiles. Supports box, tube, angle, channel, and I-beam sections.',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-08',
        tags: ['profile', 'weight', 'aluminum', 'steel', 'section', 'area']
    },

    inputs: [
        {
            key: 'profileType',
            name: 'Profile Type',
            unit: '-',
            default: 1,
            min: 1,
            max: 5,
            step: 1,
            description: 'Select profile cross-section type',
            required: true,
            options: [
                { label: 'Box / Rectangular Tube', value: 1 },
                { label: 'Round Tube / Pipe', value: 2 },
                { label: 'L-Angle', value: 3 },
                { label: 'U-Channel', value: 4 },
                { label: 'I-Beam / H-Beam', value: 5 }
            ]
        },
        {
            key: 'width',
            name: 'Width (W)',
            unit: 'mm',
            default: 100,
            min: 5,
            max: 1000,
            step: 1,
            description: 'Outer width of profile. For tubes, this is outer diameter.',
            required: true
        },
        {
            key: 'height',
            name: 'Height (H)',
            unit: 'mm',
            default: 50,
            min: 5,
            max: 1000,
            step: 1,
            description: 'Outer height of profile. For tubes, leave as 0 (ignored).',
            required: false
        },
        {
            key: 'thickness',
            name: 'Wall Thickness (t)',
            unit: 'mm',
            default: 3,
            min: 0.5,
            max: 50,
            step: 0.5,
            description: 'Wall thickness for hollow sections. Flange thickness for I-beams.',
            required: true
        },
        {
            key: 'webThickness',
            name: 'Web Thickness',
            unit: 'mm',
            default: 3,
            min: 0.5,
            max: 50,
            step: 0.5,
            description: 'Web thickness for I-beams and channels. Set same as thickness for others.',
            required: false
        },
        {
            key: 'length',
            name: 'Length (L)',
            unit: 'mm',
            default: 6000,
            min: 1,
            max: 100000,
            step: 100,
            description: 'Total length of the profile piece.',
            required: true
        },
        {
            key: 'density',
            name: 'Material Density',
            unit: 'kg/m³',
            default: 2700,
            min: 1000,
            max: 10000,
            step: 100,
            description: 'Material density. Aluminum=2700, Steel=7850, Stainless=8000',
            required: true
        }
    ],

    outputs: [
        {
            key: 'area',
            name: 'Cross-Section Area',
            unit: 'mm²',
            // Box: (W*H) - (W-2t)*(H-2t), Tube: π/4*(D²-(D-2t)²), Angle: t*(W+H-t)
            formula: 'profileType == 1 ? (width * height) - ((width - 2*thickness) * (height - 2*thickness)) : (profileType == 2 ? PI/4 * (width^2 - (width - 2*thickness)^2) : (profileType == 3 ? thickness * (width + height - thickness) : (profileType == 4 ? 2 * thickness * width + (height - 2*thickness) * webThickness : 2 * thickness * width + (height - 2*thickness) * webThickness)))',
            description: 'Cross-sectional area of the profile',
            precision: 1,
            affectsGeometry: true
        },
        {
            key: 'weightPerMeter',
            name: 'Weight per Meter',
            unit: 'kg/m',
            formula: 'area * density / 1000000000',
            description: 'Weight per running meter',
            precision: 3
        },
        {
            key: 'totalWeight',
            name: 'Total Weight',
            unit: 'kg',
            formula: 'weightPerMeter * length / 1000',
            description: 'Total weight of the profile piece',
            precision: 2
        },
        {
            key: 'perimeter',
            name: 'Outer Perimeter',
            unit: 'mm',
            formula: 'profileType == 2 ? PI * width : 2 * (width + height)',
            description: 'Outer perimeter for coating/painting calculation',
            precision: 1
        },
        {
            key: 'surfaceArea',
            name: 'Surface Area',
            unit: 'm²',
            formula: 'perimeter * length / 1000000',
            description: 'Total outer surface area',
            precision: 3
        }
    ],

    assumptions: [
        {
            id: 'uniform-section',
            text: 'Profile has uniform cross-section along entire length.',
            impact: 'low',
            source: 'EN 755-2'
        },
        {
            id: 'sharp-corners',
            text: 'Corner radii are not considered in area calculation.',
            impact: 'low',
            source: 'Simplified model'
        },
        {
            id: 'density-variance',
            text: 'Material density may vary ±1% between alloys.',
            impact: 'low',
            source: 'EN 573-3'
        }
    ],

    references: [
        {
            standard: 'EN 755-2',
            title: 'Aluminium and aluminium alloys - Extruded rod/bar, tube and profiles',
        },
        {
            standard: 'EN 573-3',
            title: 'Aluminium and aluminium alloys - Chemical composition',
        }
    ],

    tier: 'free'
};

export default profileWeightSchema;
