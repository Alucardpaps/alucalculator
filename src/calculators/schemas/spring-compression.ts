/**
 * AluCalc OS — Compression Spring Calculator Schema
 * 
 * ENGINEERING DOMAIN: Mechanical Engineering
 * STANDARDS: EN 13906-1, DIN 2095
 * 
 * Calculates spring rate, deflection, stress, natural frequency,
 * and fatigue life for helical compression springs.
 */

import type { CalculatorSchema } from '@/types/calculator-schema';

export const springCalculatorSchema: CalculatorSchema = {
    id: 'spring-compression',
    version: '1.0.0',
    domain: 'mechanical',

    metadata: {
        title: 'Compression Spring Calculator',
        description: 'Design and analyze helical compression springs. Calculate spring rate, stress, deflection, buckling, and fatigue life per EN 13906-1.',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-14',
        tags: ['spring', 'compression', 'helical', 'stiffness', 'deflection', 'fatigue', 'EN 13906']
    },

    inputs: [
        {
            key: 'd',
            name: 'Wire Diameter',
            unit: 'mm',
            default: 3,
            min: 0.1,
            max: 50,
            step: 0.1,
            description: 'Spring wire diameter. Common: 0.5-12 mm for industrial springs.',
            required: true
        },
        {
            key: 'D_mean',
            name: 'Mean Coil Diameter',
            unit: 'mm',
            default: 25,
            min: 1,
            max: 500,
            step: 0.5,
            description: 'Average diameter of the coil. D_mean = D_outer - d.',
            required: true
        },
        {
            key: 'n_active',
            name: 'Active Coils',
            unit: '-',
            default: 8,
            min: 1,
            max: 100,
            step: 0.5,
            description: 'Number of active (working) coils. Total coils = active + dead ends.',
            required: true
        },
        {
            key: 'L0',
            name: 'Free Length',
            unit: 'mm',
            default: 60,
            min: 1,
            max: 2000,
            step: 0.5,
            description: 'Unloaded spring length (free length).',
            required: true
        },
        {
            key: 'F1',
            name: 'Load at Position 1',
            unit: 'N',
            default: 50,
            min: 0,
            max: 100000,
            step: 1,
            description: 'Spring force at first working position (preload). Set to 0 if starting from free length.',
            required: true
        },
        {
            key: 'F2',
            name: 'Load at Position 2',
            unit: 'N',
            default: 200,
            min: 0.1,
            max: 100000,
            step: 1,
            description: 'Spring force at second working position (full load).',
            required: true
        },
        {
            key: 'G',
            name: 'Shear Modulus',
            unit: 'MPa',
            default: 81500,
            min: 10000,
            max: 200000,
            step: 100,
            description: 'Material shear modulus. EN 10270-1 (SH/DH wire): 81500 MPa. Stainless 302: 70000 MPa.',
            required: true
        },
        {
            key: 'tau_max_allowable',
            name: 'Max Allowable Shear Stress',
            unit: 'MPa',
            default: 700,
            min: 100,
            max: 2000,
            step: 10,
            description: 'Maximum permissible shear stress. SH wire: ~700-900 MPa. Depends on wire grade and temperature.',
            required: true
        }
    ],

    outputs: [
        {
            key: 'C',
            name: 'Spring Index',
            unit: '-',
            formula: 'D_mean / d',
            description: 'Ratio of mean diameter to wire diameter. Optimal range: 4-12. Below 4 = difficult to manufacture. Above 12 = may tangle.',
            precision: 2,
            warningThreshold: {
                min: 4,
                max: 12,
                message: 'Spring index outside optimal range (4-12). Manufacturing difficulty or instability likely.'
            }
        },
        {
            key: 'K_W',
            name: 'Wahl Factor',
            unit: '-',
            formula: '(4 * C - 1) / (4 * C - 4) + 0.615 / C',
            description: 'Wahl stress correction factor accounting for curvature and direct shear.',
            precision: 4
        },
        {
            key: 'k',
            name: 'Spring Rate',
            unit: 'N/mm',
            formula: '(G * d^4) / (8 * D_mean^3 * n_active)',
            description: 'Spring stiffness. k = Gd⁴ / 8D³n. Linear rate — force is proportional to deflection.',
            precision: 3,
            affectsGeometry: true
        },
        {
            key: 's1',
            name: 'Deflection at F1',
            unit: 'mm',
            formula: 'F1 / k',
            description: 'Spring compression at preload position.',
            precision: 2
        },
        {
            key: 's2',
            name: 'Deflection at F2',
            unit: 'mm',
            formula: 'F2 / k',
            description: 'Spring compression at full load position.',
            precision: 2
        },
        {
            key: 'L1',
            name: 'Length at F1',
            unit: 'mm',
            formula: 'L0 - s1',
            description: 'Spring length at first working position.',
            precision: 2
        },
        {
            key: 'L2',
            name: 'Length at F2',
            unit: 'mm',
            formula: 'L0 - s2',
            description: 'Spring length at second working position.',
            precision: 2
        },
        {
            key: 'Lc',
            name: 'Solid Length',
            unit: 'mm',
            formula: '(n_active + 2) * d',
            description: 'Minimum length when fully compressed (coil-bound). Assumes 2 dead (ground) coils.',
            precision: 1
        },
        {
            key: 'travel',
            name: 'Working Travel',
            unit: 'mm',
            formula: 's2 - s1',
            description: 'Deflection range between working positions 1 and 2.',
            precision: 2
        },
        {
            key: 'tau2',
            name: 'Shear Stress at F2',
            unit: 'MPa',
            formula: 'K_W * (8 * F2 * D_mean) / (PI * d^3)',
            description: 'Maximum corrected shear stress at full load. τ = K_W × 8FD / πd³',
            precision: 1,
            warningThreshold: {
                max: 900,
                message: 'Shear stress exceeds 900 MPa — risk of permanent set or fatigue failure. Consider thicker wire.'
            }
        },
        {
            key: 'utilization',
            name: 'Stress Utilization',
            unit: '%',
            formula: '(tau2 / tau_max_allowable) * 100',
            description: 'Ratio of actual stress to allowable stress. Keep below 80% for fatigue applications.',
            precision: 1,
            warningThreshold: {
                max: 100,
                message: 'Stress exceeds allowable limit! Spring will fail. Increase wire diameter or reduce load.'
            }
        },
        {
            key: 'f_natural',
            name: 'Natural Frequency',
            unit: 'Hz',
            formula: '(d / (PI * 2 * n_active * D_mean^2)) * sqrt(G * 1000000 / 7850) * 1000',
            description: 'First natural frequency for surge. Operating frequency should be < 1/13 of this.',
            precision: 1
        },
        {
            key: 'stored_energy',
            name: 'Stored Energy at F2',
            unit: 'mJ',
            formula: '0.5 * k * s2^2',
            description: 'Potential energy stored at full load. E = ½ks²',
            precision: 1
        }
    ],

    assumptions: [
        {
            id: 'linear-rate',
            text: 'Linear spring rate assumed. Non-linear (progressive or variable pitch) springs require different analysis.',
            impact: 'high',
            source: 'EN 13906-1'
        },
        {
            id: 'cold-formed',
            text: 'Cold-formed spring wire (SH, DH, or SL grade per EN 10270). Hot-wound springs >12mm wire have different properties.',
            impact: 'medium',
            source: 'DIN 2095'
        },
        {
            id: 'ground-ends',
            text: 'Closed and ground ends assumed (2 inactive coils). For plain ends, adjust total coils.',
            impact: 'medium',
            source: 'EN 13906-1'
        },
        {
            id: 'ambient-temp',
            text: 'Operating temperature 20°C. Above 80°C, reduce allowable stress per EN 13906 Table 5.',
            impact: 'medium',
            source: 'EN 13906-1 §5.6'
        },
        {
            id: 'no-buckling-check',
            text: 'Buckling not checked in this calculator. Rule of thumb: L0/D_mean < 4 for unguided springs.',
            impact: 'medium',
            source: 'DIN 2095'
        }
    ],

    references: [
        {
            standard: 'EN 13906-1',
            title: 'Cylindrical helical springs made from round wire — Calculation and design — Part 1: Compression springs',
        },
        {
            standard: 'DIN 2095',
            title: 'Calculation of cylindrical helical compression springs made from round wire',
        },
        {
            standard: 'SMI Spring Design Handbook',
            title: 'Spring Manufacturers Institute — Design Guidelines',
        }
    ],

    visualizer: 'generateSpringSVG',

    tier: 'free'
};

export default springCalculatorSchema;
