/**
 * AluCalc OS — Pump Calculator Schema
 * 
 * ENGINEERING DOMAIN: Mechanical / Fluid
 * STANDARDS: Hydraulic Institute Standards
 * 
 * Calculate centrifugal pump performance:
 * - Total dynamic head
 * - Power requirement
 * - NPSH available
 */

import type { CalculatorSchema } from '@/types/calculator-schema';

export const pumpsSchema: CalculatorSchema = {
    id: 'pumps-v1',
    version: '1.0.0',
    domain: 'fluid',

    metadata: {
        title: 'Centrifugal Pump Calculator',
        description: 'Calculate pump head, power, and NPSH for centrifugal pumps.',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-08',
        tags: ['pump', 'head', 'power', 'NPSH', 'flow', 'centrifugal']
    },

    inputs: [
        {
            key: 'Q',
            name: 'Flow Rate',
            unit: 'm³/h',
            default: 50,
            min: 0.1,
            max: 10000,
            step: 1,
            description: 'Volumetric flow rate.',
            required: true
        },
        {
            key: 'Hstatic',
            name: 'Static Head',
            unit: 'm',
            default: 20,
            min: 0,
            max: 500,
            step: 1,
            description: 'Elevation difference between suction and discharge.',
            required: true
        },
        {
            key: 'Hfriction',
            name: 'Friction Head Loss',
            unit: 'm',
            default: 5,
            min: 0,
            max: 100,
            step: 0.5,
            description: 'Total friction losses in piping system.',
            required: true
        },
        {
            key: 'Psuction',
            name: 'Suction Pressure',
            unit: 'bar',
            default: 1,
            min: 0,
            max: 50,
            step: 0.1,
            description: 'Pressure at suction tank surface (absolute).',
            required: true
        },
        {
            key: 'Pdischarge',
            name: 'Discharge Pressure',
            unit: 'bar',
            default: 3,
            min: 0,
            max: 100,
            step: 0.1,
            description: 'Required discharge pressure (gauge).',
            required: true
        },
        {
            key: 'rho',
            name: 'Fluid Density',
            unit: 'kg/m³',
            default: 1000,
            min: 500,
            max: 2000,
            step: 10,
            description: 'Fluid density. Water=1000.',
            required: true
        },
        {
            key: 'eta',
            name: 'Pump Efficiency',
            unit: '%',
            default: 75,
            min: 30,
            max: 95,
            step: 1,
            description: 'Pump hydraulic efficiency.',
            required: true
        },
        {
            key: 'Hatm',
            name: 'Atmospheric Head',
            unit: 'm',
            default: 10.33,
            min: 8,
            max: 11,
            step: 0.1,
            description: 'Atmospheric pressure as head (10.33m at sea level).',
            required: false
        },
        {
            key: 'Hvapor',
            name: 'Vapor Pressure Head',
            unit: 'm',
            default: 0.24,
            min: 0,
            max: 5,
            step: 0.01,
            description: 'Vapor pressure as head. Water at 20°C = 0.24m.',
            required: false
        },
        {
            key: 'Hsuction',
            name: 'Suction Lift',
            unit: 'm',
            default: 3,
            min: 0,
            max: 10,
            step: 0.5,
            description: 'Height from liquid surface to pump centerline.',
            required: false
        },
        {
            key: 'HfSuction',
            name: 'Suction Pipe Losses',
            unit: 'm',
            default: 0.5,
            min: 0,
            max: 5,
            step: 0.1,
            description: 'Friction losses in suction piping.',
            required: false
        }
    ],

    outputs: [
        {
            key: 'Hpressure',
            name: 'Pressure Head',
            unit: 'm',
            formula: '(Pdischarge - Psuction + 1.01325) * 100000 / (rho * 9.81)',
            description: 'Head equivalent of pressure difference',
            precision: 2
        },
        {
            key: 'TDH',
            name: 'Total Dynamic Head',
            unit: 'm',
            formula: 'Hstatic + Hfriction + Hpressure',
            description: 'Total head pump must deliver',
            precision: 2
        },
        {
            key: 'Phydraulic',
            name: 'Hydraulic Power',
            unit: 'kW',
            formula: 'rho * 9.81 * Q * TDH / 3600000',
            description: 'Power transferred to fluid',
            precision: 2
        },
        {
            key: 'Pshaft',
            name: 'Shaft Power',
            unit: 'kW',
            formula: 'Phydraulic * 100 / eta',
            description: 'Required motor power (before losses)',
            precision: 2
        },
        {
            key: 'Pmotor',
            name: 'Motor Power',
            unit: 'kW',
            formula: 'Pshaft * 1.15',
            description: 'Recommended motor size (15% margin)',
            precision: 2
        },
        {
            key: 'NPSHa',
            name: 'NPSH Available',
            unit: 'm',
            formula: 'Hatm + (Psuction - 1.01325) * 100000 / (rho * 9.81) - Hsuction - HfSuction - Hvapor',
            description: 'Available Net Positive Suction Head',
            precision: 2,
            warningThreshold: {
                min: 3,
                message: 'Low NPSHa. Risk of cavitation. Reduce suction lift.'
            }
        },
        {
            key: 'specificSpeed',
            name: 'Specific Speed',
            unit: '-',
            formula: '3.65 * (Q / 3.6)^0.5 * 60 / TDH^0.75',
            description: 'Pump specific speed (Ns). Helps select pump type.',
            precision: 0
        }
    ],

    assumptions: [
        {
            id: 'incompressible',
            text: 'Fluid is incompressible. Not valid for gases.',
            impact: 'high',
            source: 'Hydraulic Institute'
        },
        {
            id: 'steady-flow',
            text: 'Steady-state flow. Transients not considered.',
            impact: 'medium',
            source: 'Pump Handbook'
        },
        {
            id: 'bep-operation',
            text: 'Efficiency assumed at Best Efficiency Point (BEP).',
            impact: 'medium',
            source: 'Hydraulic Institute'
        }
    ],

    references: [
        {
            standard: 'HI',
            title: 'Hydraulic Institute Standards',
            url: 'https://www.pumps.org'
        },
        {
            standard: 'Pump Handbook',
            title: 'Karassik Pump Handbook, 4th Edition',
        }
    ],

    tier: 'free'
};

export default pumpsSchema;
