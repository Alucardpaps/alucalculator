/**
 * AluCalc OS — Hydraulic Cylinder Calculator Schema
 * 
 * ENGINEERING DOMAIN: Fluid Mechanics / Hydraulics
 * STANDARDS: ISO 6022, ISO 3320
 * 
 * Calculates piston force, rod force, volume, and cycle time
 * for single-acting and double-acting hydraulic cylinders.
 */

import type { CalculatorSchema } from '@/types/calculator-schema';

export const hydraulicCylinderSchema: CalculatorSchema = {
    id: 'hydraulic-cylinder',
    version: '1.0.0',
    domain: 'fluid',

    metadata: {
        title: 'Hydraulic Cylinder Calculator',
        description: 'Calculate piston force, rod force, oil volume, and cycle time for hydraulic cylinders per ISO 6022.',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-14',
        tags: ['hydraulic', 'cylinder', 'piston', 'force', 'actuator', 'pressure', 'ISO 6022']
    },

    inputs: [
        {
            key: 'P',
            name: 'System Pressure',
            unit: 'bar',
            default: 160,
            min: 1,
            max: 700,
            step: 1,
            description: 'Hydraulic system operating pressure. Common: 160-250 bar industrial, up to 700 bar mobile.',
            required: true
        },
        {
            key: 'D_bore',
            name: 'Bore Diameter',
            unit: 'mm',
            default: 80,
            min: 10,
            max: 1000,
            step: 1,
            description: 'Internal diameter of the cylinder bore (piston diameter). ISO series: 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 320.',
            required: true
        },
        {
            key: 'D_rod',
            name: 'Rod Diameter',
            unit: 'mm',
            default: 45,
            min: 5,
            max: 500,
            step: 1,
            description: 'Piston rod diameter. Typically 0.5-0.7 × bore diameter. ISO series: 14, 18, 22, 28, 36, 45, 56, 70, 90, 110, 140, 180.',
            required: true
        },
        {
            key: 'stroke',
            name: 'Stroke Length',
            unit: 'mm',
            default: 500,
            min: 10,
            max: 10000,
            step: 10,
            description: 'Maximum travel distance of the piston rod.',
            required: true
        },
        {
            key: 'Q_pump',
            name: 'Pump Flow Rate',
            unit: 'L/min',
            default: 40,
            min: 0.1,
            max: 500,
            step: 0.5,
            description: 'Hydraulic pump delivery flow rate for calculating cycle speed.',
            required: true
        },
        {
            key: 'eta_mech',
            name: 'Mechanical Efficiency',
            unit: '%',
            default: 95,
            min: 50,
            max: 100,
            step: 0.5,
            description: 'Mechanical efficiency of the cylinder. Typically 92-97% for quality cylinders.',
            required: true
        }
    ],

    outputs: [
        {
            key: 'A_piston',
            name: 'Piston Area',
            unit: 'cm²',
            formula: 'PI * (D_bore / 20)^2',
            description: 'Full bore area. A = πD²/4',
            precision: 2
        },
        {
            key: 'A_rod',
            name: 'Rod Cross-Section',
            unit: 'cm²',
            formula: 'PI * (D_rod / 20)^2',
            description: 'Rod area. A_rod = πd²/4',
            precision: 2
        },
        {
            key: 'A_annular',
            name: 'Annular Area',
            unit: 'cm²',
            formula: 'A_piston - A_rod',
            description: 'Effective area on rod side (piston area minus rod area).',
            precision: 2
        },
        {
            key: 'F_push',
            name: 'Push Force (Extend)',
            unit: 'kN',
            formula: '(P * 100 * A_piston / 10000) * (eta_mech / 100)',
            description: 'Force during extension stroke. F = P × A × η',
            precision: 2,
            affectsGeometry: true
        },
        {
            key: 'F_pull',
            name: 'Pull Force (Retract)',
            unit: 'kN',
            formula: '(P * 100 * A_annular / 10000) * (eta_mech / 100)',
            description: 'Force during retraction stroke. F = P × A_annular × η',
            precision: 2
        },
        {
            key: 'V_extend',
            name: 'Extension Volume',
            unit: 'L',
            formula: '(A_piston * stroke) / 10000',
            description: 'Oil volume required for full extension stroke.',
            precision: 2
        },
        {
            key: 'V_retract',
            name: 'Retraction Volume',
            unit: 'L',
            formula: '(A_annular * stroke) / 10000',
            description: 'Oil volume required for full retraction stroke.',
            precision: 2
        },
        {
            key: 'speed_extend',
            name: 'Extension Speed',
            unit: 'mm/s',
            formula: '(Q_pump * 1000 / 60) / (A_piston / 100)',
            description: 'Piston extension velocity. v = Q / A',
            precision: 1,
            warningThreshold: {
                max: 500,
                message: 'Extension speed above 500 mm/s — verify cushioning and shock absorption.'
            }
        },
        {
            key: 'speed_retract',
            name: 'Retraction Speed',
            unit: 'mm/s',
            formula: '(Q_pump * 1000 / 60) / (A_annular / 100)',
            description: 'Piston retraction velocity (faster due to smaller area). v = Q / A_annular',
            precision: 1
        },
        {
            key: 't_extend',
            name: 'Extension Time',
            unit: 's',
            formula: 'stroke / speed_extend',
            description: 'Time for full extension stroke.',
            precision: 2
        },
        {
            key: 't_retract',
            name: 'Retraction Time',
            unit: 's',
            formula: 'stroke / speed_retract',
            description: 'Time for full retraction stroke.',
            precision: 2
        },
        {
            key: 'ratio',
            name: 'Area Ratio (φ)',
            unit: '-',
            formula: 'A_piston / A_annular',
            description: 'Bore-to-annular area ratio. Determines differential force and speed characteristics.',
            precision: 3
        }
    ],

    assumptions: [
        {
            id: 'ideal-pressure',
            text: 'System pressure is constant at the cylinder port. Line losses not included.',
            impact: 'medium',
            source: 'ISO 3320'
        },
        {
            id: 'no-back-pressure',
            text: 'No back-pressure on the return line. For circuits with back-pressure, subtract from effective pressure.',
            impact: 'high',
            source: 'Hydraulic System Design'
        },
        {
            id: 'incompressible',
            text: 'Hydraulic oil is incompressible. Bulk modulus effects ignored for volume calculations.',
            impact: 'low',
            source: 'ISO 6022'
        },
        {
            id: 'ambient-temp',
            text: 'Oil temperature at standard operating range (30-60°C). Viscosity changes not modeled.',
            impact: 'low',
            source: 'Hydraulic Best Practice'
        }
    ],

    references: [
        {
            standard: 'ISO 6022',
            title: 'Hydraulic fluid power — Mounting dimensions for single rod cylinders, 16 MPa series',
        },
        {
            standard: 'ISO 3320',
            title: 'Fluid power — Cylinder bores and piston rod diameters — Metric series',
        },
        {
            standard: 'Parker Hannifin',
            title: 'Hydraulic Cylinder Handbook',
        }
    ],

    visualizer: 'generateHydraulicCylinderSVG',

    tier: 'free'
};

export default hydraulicCylinderSchema;
