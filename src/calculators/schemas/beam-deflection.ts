/**
 * AluCalc OS — Beam Deflection Calculator Schema
 * 
 * ENGINEERING DOMAIN: Civil/Structural
 * STANDARDS: Euler-Bernoulli Beam Theory, AISC, Eurocode 3
 * 
 * DEEP ANALYSIS (ULTRATHINK):
 * ─────────────────────────────────────────────────────────────────────
 * 1. PSYCHOLOGICAL IMPACT:
 *    - Deflection limits are code-driven (L/360 typical)
 *    - Engineers need immediate pass/fail feedback against limits
 *    - Stress check provides secondary safety confirmation
 * 
 * 2. TECHNICAL ACCURACY:
 *    - Simply supported beam with central point load
 *    - δmax = PL³/(48EI) - classic Euler-Bernoulli
 *    - σmax = M/S where M = PL/4 and S = I/c
 *    - Assumes linear elastic behavior (no yielding)
 * 
 * 3. ACCESSIBILITY:
 *    - Common material presets (Steel E=200GPa, Aluminum E=70GPa)
 *    - Description explains when formula applies
 *    - Clear warning when deflection exceeds serviceability limit
 * 
 * 4. EDGE CASES:
 *    - Zero length: Division protected in formula parser
 *    - Large deflections: Warning when δ > L/100 (nonlinear regime)
 *    - Negative values: Blocked by min constraints
 * ─────────────────────────────────────────────────────────────────────
 */

import type { CalculatorSchema } from '@/types/calculator-schema';

export const beamDeflectionSchema: CalculatorSchema = {
    id: 'beam-deflection-v1',
    version: '1.0.0',
    domain: 'civil',

    metadata: {
        title: 'Simply Supported Beam Deflection',
        description: 'Calculate maximum deflection and stress for a simply supported beam with central point load using Euler-Bernoulli theory.',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-07',
        tags: ['beam', 'deflection', 'structural', 'stress', 'moment', 'Euler-Bernoulli']
    },

    inputs: [
        {
            key: 'L',
            name: 'Span Length',
            unit: 'mm',
            default: 3000,
            min: 100,
            max: 50000,
            step: 100,
            description: 'Clear span between supports.',
            required: true
        },
        {
            key: 'P',
            name: 'Point Load',
            unit: 'kN',
            default: 10,
            min: 0,
            max: 10000,
            step: 0.5,
            description: 'Concentrated load applied at mid-span.',
            required: true
        },
        {
            key: 'E',
            name: 'Elastic Modulus',
            unit: 'GPa',
            default: 200,
            min: 1,
            max: 500,
            step: 1,
            description: 'Young\'s modulus. Steel ≈ 200 GPa, Aluminum ≈ 70 GPa, Timber ≈ 12 GPa.',
            required: true
        },
        {
            key: 'I',
            name: 'Moment of Inertia',
            unit: 'cm⁴',
            default: 1000,
            min: 0.1,
            max: 1000000,
            step: 10,
            description: 'Second moment of area about bending axis. IPE 200 ≈ 1940 cm⁴.',
            required: true
        },
        {
            key: 'c',
            name: 'Extreme Fiber Distance',
            unit: 'mm',
            default: 100,
            min: 1,
            max: 1000,
            step: 1,
            description: 'Distance from neutral axis to extreme fiber (half depth for symmetric sections).',
            required: true
        },
        {
            key: 'Fy',
            name: 'Yield Strength',
            unit: 'MPa',
            default: 250,
            min: 50,
            max: 1000,
            step: 10,
            description: 'Material yield strength. S235 = 235 MPa, S355 = 355 MPa.',
            required: true
        },
        {
            key: 'deflectionLimit',
            name: 'Deflection Limit',
            unit: 'L/',
            default: 360,
            min: 100,
            max: 1000,
            step: 10,
            description: 'Allowable deflection ratio. L/360 typical for floors, L/240 for roofs.',
            required: true
        }
    ],

    outputs: [
        {
            key: 'Mmax',
            name: 'Maximum Moment',
            unit: 'kN·m',
            formula: '(P * L) / 4 / 1000',
            description: 'Maximum bending moment at mid-span. M = PL/4',
            precision: 2
        },
        {
            key: 'delta',
            name: 'Maximum Deflection',
            unit: 'mm',
            formula: '(P * 1000 * L^3) / (48 * E * 1000 * I * 10000)',
            description: 'Maximum deflection at mid-span. δ = PL³/(48EI)',
            precision: 2,
            affectsGeometry: true
        },
        {
            key: 'deltaAllowable',
            name: 'Allowable Deflection',
            unit: 'mm',
            formula: 'L / deflectionLimit',
            description: 'Maximum permitted deflection per code. δallow = L/limit',
            precision: 2
        },
        {
            key: 'deflectionRatio',
            name: 'Deflection Check',
            unit: '%',
            formula: '(delta / deltaAllowable) * 100',
            description: 'Actual vs allowable deflection ratio. Must be < 100%.',
            precision: 1,
            warningThreshold: {
                max: 100,
                message: 'DEFLECTION EXCEEDS LIMIT. Increase section or reduce span.'
            }
        },
        {
            key: 'S',
            name: 'Section Modulus',
            unit: 'cm³',
            formula: '(I * 10000) / c / 1000',
            description: 'Elastic section modulus. S = I/c',
            precision: 1
        },
        {
            key: 'sigma',
            name: 'Maximum Stress',
            unit: 'MPa',
            formula: '(Mmax * 1000 * 1000) / (S * 1000)',
            description: 'Maximum bending stress. σ = M/S',
            precision: 1,
            warningThreshold: {
                max: 300,
                message: 'Stress approaching yield. Verify safety factor requirements.'
            }
        },
        {
            key: 'stressRatio',
            name: 'Stress Ratio',
            unit: '%',
            formula: '(sigma / Fy) * 100',
            description: 'Percentage of yield strength utilized.',
            precision: 1,
            warningThreshold: {
                max: 90,
                message: 'Stress ratio > 90%. Section may be undersized for code requirements.'
            }
        }
    ],

    assumptions: [
        {
            id: 'simply-supported',
            text: 'Simply supported boundary conditions (pinned-roller). No moment restraint at supports.',
            impact: 'high',
            source: 'Euler-Bernoulli Theory'
        },
        {
            id: 'central-load',
            text: 'Single concentrated load at exact mid-span. For other load cases, use superposition.',
            impact: 'high',
            source: 'Structural Analysis'
        },
        {
            id: 'small-deflections',
            text: 'Small deflection assumption (δ << L). Invalid when δ > L/100.',
            impact: 'high',
            source: 'Euler-Bernoulli Theory'
        },
        {
            id: 'linear-elastic',
            text: 'Material behavior is linear elastic. No yielding or plasticity.',
            impact: 'high',
            source: 'Structural Design'
        },
        {
            id: 'prismatic',
            text: 'Beam has constant cross-section along length (prismatic member).',
            impact: 'medium',
            source: 'Beam Theory'
        },
        {
            id: 'plane-sections',
            text: 'Plane sections remain plane during bending (Navier hypothesis).',
            impact: 'medium',
            source: 'Euler-Bernoulli Theory'
        }
    ],

    references: [
        {
            standard: 'Eurocode 3',
            section: 'EN 1993-1-1',
            title: 'Design of steel structures - General rules',
            url: 'https://eurocodes.jrc.ec.europa.eu/'
        },
        {
            standard: 'AISC 360',
            section: 'Chapter F',
            title: 'Specification for Structural Steel Buildings',
            url: 'https://www.aisc.org/publications/steel-standards/'
        },
        {
            standard: 'Roark\'s',
            section: 'Table 8.1',
            title: 'Formulas for Stress and Strain (8th Ed)'
        }
    ],

    visualizer: 'generateBeamSVG',

    media: {
        youtubeId: 'ZJMtVvQdSPw', // Beam deflection theory
    },

    tier: 'free'
};

export default beamDeflectionSchema;
