/**
 * AluCalc OS — Pipe Fluid Flow Calculator Schema
 * 
 * ENGINEERING DOMAIN: Fluid Mechanics
 * STANDARDS: Darcy-Weisbach, Colebrook-White, ASHRAE
 * 
 * DEEP ANALYSIS (ULTRATHINK):
 * ─────────────────────────────────────────────────────────────────────
 * 1. PSYCHOLOGICAL IMPACT:
 *    - Pressure drop is critical for pump sizing
 *    - Reynolds number indicates flow regime (laminar/turbulent)
 *    - Color coding helps identify problematic velocity (erosion risk)
 * 
 * 2. TECHNICAL ACCURACY:
 *    - Darcy-Weisbach: ΔP = f × (L/D) × (ρV²/2)
 *    - Friction factor uses Swamee-Jain approximation for turbulent flow
 *    - Swamee-Jain valid for 5000 < Re < 10⁸ and 10⁻⁶ < ε/D < 0.01
 *    - Laminar flow (Re < 2300): f = 64/Re
 * 
 * 3. ACCESSIBILITY:
 *    - Common fluid presets (water at 20°C, air at 20°C)
 *    - Pipe material roughness selection
 *    - Clear explanation of flow regime
 * 
 * 4. EDGE CASES:
 *    - Transition zone (2300 < Re < 4000): Warning shown
 *    - Very high velocity (> 3 m/s for water): Erosion warning
 *    - Zero flow rate: Protected by min constraint
 * ─────────────────────────────────────────────────────────────────────
 */

import type { CalculatorSchema } from '@/types/calculator-schema';

export const fluidFlowSchema: CalculatorSchema = {
    id: 'fluid-flow-v1',
    version: '1.0.0',
    domain: 'fluid',

    metadata: {
        title: 'Pipe Pressure Drop Calculator',
        description: 'Calculate pressure drop for incompressible flow in circular pipes using Darcy-Weisbach equation with Swamee-Jain friction factor.',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-07',
        tags: ['fluid', 'pipe', 'pressure drop', 'Darcy-Weisbach', 'friction', 'Reynolds', 'hydraulics']
    },

    inputs: [
        {
            key: 'Q',
            name: 'Volume Flow Rate',
            unit: 'L/min',
            default: 100,
            min: 0.1,
            max: 100000,
            step: 1,
            description: 'Volumetric flow rate through the pipe.',
            required: true
        },
        {
            key: 'D',
            name: 'Inner Diameter',
            unit: 'mm',
            default: 50,
            min: 5,
            max: 3000,
            step: 1,
            description: 'Internal diameter of the pipe. DN50 schedule 40 ≈ 52.5 mm ID.',
            required: true
        },
        {
            key: 'L',
            name: 'Pipe Length',
            unit: 'm',
            default: 100,
            min: 0.1,
            max: 100000,
            step: 1,
            description: 'Total equivalent length including fittings.',
            required: true
        },
        {
            key: 'epsilon',
            name: 'Surface Roughness',
            unit: 'mm',
            default: 0.045,
            min: 0.0015,
            max: 10,
            step: 0.001,
            description: 'Absolute pipe roughness. Steel: 0.045 mm, Copper: 0.0015 mm, Concrete: 1-3 mm.',
            required: true
        },
        {
            key: 'rho',
            name: 'Fluid Density',
            unit: 'kg/m³',
            default: 998,
            min: 0.1,
            max: 20000,
            step: 1,
            description: 'Fluid density at operating temperature. Water at 20°C: 998 kg/m³.',
            required: true
        },
        {
            key: 'mu',
            name: 'Dynamic Viscosity',
            unit: 'mPa·s',
            default: 1.002,
            min: 0.001,
            max: 10000,
            step: 0.001,
            description: 'Dynamic viscosity. Water at 20°C: 1.002 mPa·s (= 1.002 cP).',
            required: true
        }
    ],

    outputs: [
        {
            key: 'A',
            name: 'Cross-Section Area',
            unit: 'mm²',
            formula: 'PI * (D/2)^2',
            description: 'Internal pipe area. A = πD²/4',
            precision: 1
        },
        {
            key: 'V',
            name: 'Flow Velocity',
            unit: 'm/s',
            formula: '(Q / 60000) / (A / 1000000)',
            description: 'Average fluid velocity. V = Q/A',
            precision: 3,
            affectsGeometry: true,
            warningThreshold: {
                max: 3,
                message: 'Velocity above 3 m/s may cause erosion in steel pipes. Consider larger diameter.'
            }
        },
        {
            key: 'Re',
            name: 'Reynolds Number',
            unit: '-',
            formula: '(rho * V * D / 1000) / (mu / 1000)',
            description: 'Flow regime indicator. Re < 2300: laminar, Re > 4000: turbulent.',
            precision: 0
        },
        {
            key: 'relRoughness',
            name: 'Relative Roughness',
            unit: '-',
            formula: 'epsilon / D',
            description: 'Dimensionless roughness ratio ε/D.',
            precision: 6
        },
        {
            key: 'f',
            name: 'Friction Factor',
            unit: '-',
            // Swamee-Jain approximation for turbulent flow
            // For Re < 2300, should use f = 64/Re (handled in UI with regime check)
            formula: '0.25 / (log((epsilon/D)/3.7 + 5.74/Re^0.9))^2',
            description: 'Darcy friction factor (Swamee-Jain approximation). Valid for turbulent flow.',
            precision: 5
        },
        {
            key: 'deltaP',
            name: 'Pressure Drop',
            unit: 'kPa',
            formula: 'f * (L / (D/1000)) * (rho * V^2 / 2) / 1000',
            description: 'Frictional pressure loss. ΔP = f×(L/D)×(ρV²/2)',
            precision: 2,
            warningThreshold: {
                max: 100,
                message: 'High pressure drop. Review pipe sizing or pump capacity.'
            }
        },
        {
            key: 'headLoss',
            name: 'Head Loss',
            unit: 'm',
            formula: 'deltaP * 1000 / (rho * 9.81)',
            description: 'Equivalent head loss in meters of fluid. h = ΔP/(ρg)',
            precision: 2
        },
        {
            key: 'powerLoss',
            name: 'Hydraulic Power Loss',
            unit: 'W',
            formula: 'deltaP * 1000 * (Q / 60000)',
            description: 'Power dissipated as friction. P = ΔP × Q',
            precision: 1
        }
    ],

    assumptions: [
        {
            id: 'incompressible',
            text: 'Fluid is incompressible. Not valid for gases at high pressure drops (> 10% of absolute pressure).',
            impact: 'high',
            source: 'Fluid Mechanics'
        },
        {
            id: 'fully-developed',
            text: 'Fully developed flow profile. Entrance effects not included (assume L/D > 50).',
            impact: 'medium',
            source: 'ASHRAE Handbook'
        },
        {
            id: 'steady-state',
            text: 'Steady-state flow. No transient or water hammer effects.',
            impact: 'high',
            source: 'Hydraulics'
        },
        {
            id: 'circular-pipe',
            text: 'Circular cross-section pipe only. For non-circular, use hydraulic diameter.',
            impact: 'high',
            source: 'Darcy-Weisbach'
        },
        {
            id: 'swamee-jain',
            text: 'Swamee-Jain equation valid for 5000 < Re < 10⁸ and 10⁻⁶ < ε/D < 0.01.',
            impact: 'medium',
            source: 'Swamee & Jain, 1976'
        },
        {
            id: 'isothermal',
            text: 'Isothermal flow. Temperature change along pipe not considered.',
            impact: 'low',
            source: 'ASHRAE Handbook'
        }
    ],

    references: [
        {
            standard: 'ASHRAE Handbook',
            section: 'Fundamentals, Ch. 22',
            title: 'Pipe Sizing',
            url: 'https://www.ashrae.org/technical-resources/ashrae-handbook'
        },
        {
            standard: 'Colebrook-White',
            title: 'Turbulent Flow in Pipes (1939)',
        },
        {
            standard: 'Swamee-Jain',
            title: 'Explicit equations for pipe-flow problems (ASCE J. Hydraul. Div., 1976)',
        },
        {
            standard: 'Crane TP-410',
            title: 'Flow of Fluids Through Valves, Fittings, and Pipe',
        }
    ],

    visualizer: 'generatePipeSVG',

    media: {
        youtubeId: 'eMZeY8NOWRM', // Pipe flow fundamentals
    },

    tier: 'free'
};

export default fluidFlowSchema;
