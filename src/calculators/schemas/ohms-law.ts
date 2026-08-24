/**
 * AluCalc OS — Ohm's Law Calculator Schema
 * 
 * ENGINEERING DOMAIN: Electrical
 * STANDARDS: IEC 60038
 * 
 * Calculate basic electrical parameters:
 * - Voltage, Current, Resistance
 * - Power (W, kW)
 * - Energy consumption
 */

import type { CalculatorSchema } from '@/types/calculator-schema';

export const ohmsLawSchema: CalculatorSchema = {
    id: 'ohms-law-v1',
    version: '1.0.0',
    domain: 'electrical',

    metadata: {
        title: "Ohm's Law Calculator",
        description: 'Calculate voltage, current, resistance, and power using Ohm\'s Law.',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-08',
        tags: ['ohms law', 'voltage', 'current', 'resistance', 'power', 'electrical']
    },

    inputs: [
        {
            key: 'solveFor',
            name: 'Solve For',
            unit: '-',
            default: 1,
            min: 1,
            max: 4,
            step: 1,
            description: '1=Voltage, 2=Current, 3=Resistance, 4=Power',
            required: true
        },
        {
            key: 'V',
            name: 'Voltage',
            unit: 'V',
            default: 230,
            min: 0.001,
            max: 100000,
            step: 1,
            description: 'Voltage in volts. Leave at 0 if solving for voltage.',
            required: false
        },
        {
            key: 'I',
            name: 'Current',
            unit: 'A',
            default: 10,
            min: 0.001,
            max: 10000,
            step: 0.1,
            description: 'Current in amperes.',
            required: false
        },
        {
            key: 'R',
            name: 'Resistance',
            unit: 'Ω',
            default: 23,
            min: 0.001,
            max: 1000000,
            step: 0.1,
            description: 'Resistance in ohms.',
            required: false
        },
        {
            key: 'hours',
            name: 'Operating Hours',
            unit: 'h',
            default: 8,
            min: 0,
            max: 8760,
            step: 1,
            description: 'Operating hours per day for energy calculation.',
            required: false
        },
        {
            key: 'costPerKwh',
            name: 'Electricity Cost',
            unit: '₺/kWh',
            default: 2.5,
            min: 0,
            max: 50,
            step: 0.1,
            description: 'Cost per kilowatt-hour.',
            required: false
        }
    ],

    outputs: [
        {
            key: 'calcV',
            name: 'Voltage (Calculated)',
            unit: 'V',
            formula: 'solveFor == 1 ? I * R : V',
            description: 'V = I × R',
            precision: 2
        },
        {
            key: 'calcI',
            name: 'Current (Calculated)',
            unit: 'A',
            formula: 'solveFor == 2 ? V / R : I',
            description: 'I = V / R',
            precision: 3
        },
        {
            key: 'calcR',
            name: 'Resistance (Calculated)',
            unit: 'Ω',
            formula: 'solveFor == 3 ? V / I : R',
            description: 'R = V / I',
            precision: 3
        },
        {
            key: 'P',
            name: 'Power',
            unit: 'W',
            formula: 'calcV * calcI',
            description: 'P = V × I',
            precision: 2
        },
        {
            key: 'PkW',
            name: 'Power',
            unit: 'kW',
            formula: 'P / 1000',
            description: 'Power in kilowatts',
            precision: 3
        },
        {
            key: 'energyDaily',
            name: 'Daily Energy',
            unit: 'kWh',
            formula: 'PkW * hours',
            description: 'Energy consumed per day',
            precision: 2
        },
        {
            key: 'costDaily',
            name: 'Daily Cost',
            unit: '₺',
            formula: 'energyDaily * costPerKwh',
            description: 'Daily electricity cost',
            precision: 2
        },
        {
            key: 'costMonthly',
            name: 'Monthly Cost',
            unit: '₺',
            formula: 'costDaily * 30',
            description: 'Estimated monthly cost (30 days)',
            precision: 0
        }
    ],

    assumptions: [
        {
            id: 'dc-or-resistive',
            text: 'Applicable to DC circuits or purely resistive AC loads.',
            impact: 'medium',
            source: 'Basic electrical theory'
        },
        {
            id: 'constant-resistance',
            text: 'Resistance is constant (no temperature effects).',
            impact: 'low',
            source: 'Ideal conditions'
        }
    ],

    references: [
        {
            standard: 'IEC 60038',
            title: 'IEC standard voltages',
        }
    ],

    tier: 'free'
};

export default ohmsLawSchema;
