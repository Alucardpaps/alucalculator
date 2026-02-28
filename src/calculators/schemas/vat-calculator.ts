/**
 * AluCalc OS — VAT Calculator Schema
 * 
 * ENGINEERING DOMAIN: Finance
 * 
 * Calculate VAT and net/gross amounts:
 * - Add/remove VAT
 * - Multiple VAT rates
 */

import type { CalculatorSchema } from '@/types/calculator-schema';

export const vatCalculatorSchema: CalculatorSchema = {
    id: 'vat-calculator-v1',
    version: '1.0.0',
    domain: 'mechanical',

    metadata: {
        title: 'VAT Calculator',
        description: 'Calculate VAT, net, and gross amounts with support for multiple tax rates.',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-08',
        tags: ['VAT', 'tax', 'finance', 'KDV', 'net', 'gross']
    },

    inputs: [
        {
            key: 'calculationType',
            name: 'Calculation Type',
            unit: '-',
            default: 1,
            min: 1,
            max: 2,
            step: 1,
            description: '1=Add VAT to net, 2=Extract VAT from gross',
            required: true
        },
        {
            key: 'amount',
            name: 'Amount',
            unit: '₺',
            default: 1000,
            min: 0.01,
            max: 100000000,
            step: 0.01,
            description: 'Net amount (if adding) or gross amount (if extracting).',
            required: true
        },
        {
            key: 'vatRate',
            name: 'VAT Rate',
            unit: '%',
            default: 20,
            min: 0,
            max: 50,
            step: 1,
            description: 'VAT percentage. Turkey: 1%, 10%, 20%',
            required: true
        },
        {
            key: 'quantity',
            name: 'Quantity',
            unit: '-',
            default: 1,
            min: 1,
            max: 10000,
            step: 1,
            description: 'Number of items (for unit pricing).',
            required: false
        }
    ],

    outputs: [
        {
            key: 'netAmount',
            name: 'Net Amount',
            unit: '₺',
            formula: 'calculationType == 1 ? amount : amount / (1 + vatRate/100)',
            description: 'Amount before VAT',
            precision: 2
        },
        {
            key: 'vatAmount',
            name: 'VAT Amount',
            unit: '₺',
            formula: 'netAmount * vatRate / 100',
            description: 'VAT portion',
            precision: 2
        },
        {
            key: 'grossAmount',
            name: 'Gross Amount',
            unit: '₺',
            formula: 'netAmount + vatAmount',
            description: 'Total including VAT',
            precision: 2
        },
        {
            key: 'totalNet',
            name: 'Total Net',
            unit: '₺',
            formula: 'netAmount * quantity',
            description: 'Net amount × quantity',
            precision: 2
        },
        {
            key: 'totalVat',
            name: 'Total VAT',
            unit: '₺',
            formula: 'vatAmount * quantity',
            description: 'Total VAT for all items',
            precision: 2
        },
        {
            key: 'totalGross',
            name: 'Total Gross',
            unit: '₺',
            formula: 'grossAmount * quantity',
            description: 'Grand total with VAT',
            precision: 2
        }
    ],

    assumptions: [
        {
            id: 'single-rate',
            text: 'Single VAT rate applied to entire amount.',
            impact: 'low',
            source: 'Tax calculation standard'
        }
    ],

    references: [
        {
            standard: 'Turkey VAT Law',
            title: 'Katma Değer Vergisi Kanunu',
        }
    ],

    tier: 'free'
};

export default vatCalculatorSchema;
