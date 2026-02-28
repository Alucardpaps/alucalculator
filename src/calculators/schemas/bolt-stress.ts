/**
 * AluCalc OS — Bolt Stress Calculator Schema
 * 
 * ENGINEERING DOMAIN: Mechanical
 * STANDARDS: ISO 898-1, DIN 931, VDI 2230
 * 
 * DEEP ANALYSIS (ULTRATHINK):
 * ─────────────────────────────────────────────────────────────────────
 * 1. PSYCHOLOGICAL IMPACT:
 *    - Engineers need immediate visual feedback on stress ratio
 *    - Color-coded safety margins reduce cognitive load
 *    - Assumptions panel builds trust through transparency
 * 
 * 2. TECHNICAL ACCURACY:
 *    - Tensile stress area (As) uses ISO 898-1 formula: As = (π/4) × d2²
 *    - d2 = d - 0.9382 × P (pitch diameter approximation)
 *    - Safety factor comparison against yield strength, NOT ultimate
 * 
 * 3. ACCESSIBILITY:
 *    - All units clearly labeled with SI symbols
 *    - Input descriptions explain engineering context
 *    - Warning thresholds based on industry standards (SF < 2 = warning)
 * 
 * 4. SCALABILITY:
 *    - Schema extensible for preload calculations (VDI 2230)
 *    - Ready for fatigue analysis module integration
 * ─────────────────────────────────────────────────────────────────────
 */

import type { CalculatorSchema } from '@/types/calculator-schema';

export const boltStressSchema: CalculatorSchema = {
    id: 'bolt-stress-v1',
    version: '1.0.0',
    domain: 'mechanical',

    metadata: {
        title: 'Bolt Tensile Stress Calculator',
        description: 'Calculate tensile stress and safety factor for metric bolts under axial load. Based on ISO 898-1 stress area formulas.',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-07',
        tags: ['bolt', 'fastener', 'stress', 'tensile', 'safety factor', 'metric']
    },

    inputs: [
        {
            key: 'd',
            name: 'Nominal Diameter',
            unit: 'mm',
            default: 10,
            min: 1,
            max: 100,
            step: 0.5,
            description: 'Nominal thread diameter (M-size). Example: 10 for M10 bolt.',
            required: true,
            options: [
                { label: 'M3', value: 3 },
                { label: 'M4', value: 4 },
                { label: 'M5', value: 5 },
                { label: 'M6', value: 6 },
                { label: 'M8', value: 8 },
                { label: 'M10', value: 10 },
                { label: 'M12', value: 12 },
                { label: 'M14', value: 14 },
                { label: 'M16', value: 16 },
                { label: 'M20', value: 20 },
                { label: 'M24', value: 24 },
                { label: 'M30', value: 30 },
                { label: 'M36', value: 36 },
                { label: 'M42', value: 42 },
                { label: 'M48', value: 48 },
                { label: 'M56', value: 56 },
                { label: 'M64', value: 64 }
            ]
        },
        {
            key: 'P',
            name: 'Thread Pitch',
            unit: 'mm',
            default: 1.5,
            min: 0.2,
            max: 6,
            step: 0.25,
            description: 'Thread pitch. Standard coarse pitch for M10 is 1.5mm.',
            required: true
        },
        {
            key: 'F',
            name: 'Axial Load',
            unit: 'kN',
            default: 20,
            min: 0,
            max: 10000,
            step: 1,
            description: 'Total axial tensile force applied to the bolt.',
            required: true
        },
        {
            key: 'Sy',
            name: 'Yield Strength',
            unit: 'MPa',
            default: 640,
            min: 100,
            max: 2000,
            step: 10,
            description: 'Minimum yield strength of bolt material. Class 8.8 = 640 MPa, Class 10.9 = 900 MPa, Class 12.9 = 1080 MPa.',
            required: true,
            options: [
                { label: 'Class 4.6 (240 MPa)', value: 240 },
                { label: 'Class 4.8 (320 MPa)', value: 320 },
                { label: 'Class 5.6 (300 MPa)', value: 300 },
                { label: 'Class 5.8 (400 MPa)', value: 400 },
                { label: 'Class 6.8 (480 MPa)', value: 480 },
                { label: 'Class 8.8 (640 MPa)', value: 640 },
                { label: 'Class 10.9 (900 MPa)', value: 900 },
                { label: 'Class 12.9 (1080 MPa)', value: 1080 }
            ]
        }
    ],

    outputs: [
        {
            key: 'd2',
            name: 'Pitch Diameter',
            unit: 'mm',
            formula: 'd - 0.6495 * P',
            description: 'Effective diameter at thread pitch line. d₂ = d - 0.6495·P',
            precision: 3,
            affectsGeometry: true
        },
        {
            key: 'd3',
            name: 'Minor Diameter',
            unit: 'mm',
            formula: 'd - 1.2269 * P',
            description: 'Root diameter of external thread. d₃ = d - 1.2269·P',
            precision: 3,
            affectsGeometry: true
        },
        {
            key: 'As',
            name: 'Stress Area',
            unit: 'mm²',
            formula: 'PI / 4 * ((d2 + d3) / 2)^2',
            description: 'Tensile stress area per ISO 898-1. As = (π/4)·((d₂+d₃)/2)²',
            precision: 2
        },
        {
            key: 'sigma',
            name: 'Tensile Stress',
            unit: 'MPa',
            formula: '(F * 1000) / As',
            description: 'Actual tensile stress. σ = F/As (load converted from kN to N)',
            precision: 1,
            warningThreshold: {
                max: 500,
                message: 'High stress level. Verify bolt grade and application.'
            }
        },
        {
            key: 'SF',
            name: 'Safety Factor',
            unit: '-',
            formula: 'Sy / sigma',
            description: 'Safety factor against yield. SF = Sy/σ',
            precision: 2,
            warningThreshold: {
                min: 2,
                message: 'Safety factor below 2.0. Consider larger bolt or higher grade.'
            }
        },
        {
            key: 'utilization',
            name: 'Utilization',
            unit: '%',
            formula: '(sigma / Sy) * 100',
            description: 'Percentage of yield strength used. Should generally be < 50%.',
            precision: 1,
            warningThreshold: {
                max: 75,
                message: 'Utilization above 75%. Joint may not meet fatigue requirements.'
            }
        }
    ],

    assumptions: [
        {
            id: 'axial-only',
            text: 'Load is purely axial tensile. No bending, shear, or torsion considered.',
            impact: 'high',
            source: 'VDI 2230'
        },
        {
            id: 'static-load',
            text: 'Static loading only. Fatigue analysis requires additional factors.',
            impact: 'high',
            source: 'ISO 898-1'
        },
        {
            id: 'thread-engagement',
            text: 'Assumes adequate thread engagement (minimum 1.5 × d in steel).',
            impact: 'medium',
            source: 'Machinery\'s Handbook'
        },
        {
            id: 'no-preload',
            text: 'Does not include preload stress from tightening torque.',
            impact: 'high',
            source: 'VDI 2230'
        },
        {
            id: 'room-temp',
            text: 'Properties valid at room temperature (20°C). High temp reduces strength.',
            impact: 'medium',
            source: 'ISO 898-1'
        }
    ],

    references: [
        {
            standard: 'ISO 898-1',
            section: 'Table 3',
            title: 'Mechanical properties of fasteners - Bolts, screws and studs',
            url: 'https://www.iso.org/standard/79733.html'
        },
        {
            standard: 'VDI 2230',
            section: 'Part 1',
            title: 'Systematic calculation of highly stressed bolted joints',
            url: 'https://www.vdi.de/richtlinien/details/vdi-2230-blatt-1-systematische-berechnung-hochbeanspruchter-schraubenverbindungen'
        },
        {
            standard: 'DIN 13-1',
            title: 'ISO general purpose metric screw threads',
        }
    ],

    visualizer: 'generateBoltSVG',

    media: {
        youtubeId: 'rWEy2xGKAyc', // Bolt stress analysis tutorial
    },

    tier: 'free'
};

export default boltStressSchema;
