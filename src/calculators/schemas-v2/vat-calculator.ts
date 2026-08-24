/**
 * AluCalculator V2 — VAT & Finance Calculator
 * 
 * DOMAIN: Finance
 * FEATURES:
 * - VAT calculation (Forward/Reverse)
 * - Withholding Tax (Tevkifat) support
 * - Visual breakdown of costs
 */

import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import {
    createValidatedValue,
    type CalculationResult,
    type ValidatedEngineeringValue
} from '@/types/engineering';

// ============================================
// CALCULATION ENGINE
// ============================================

function calculateVAT(
    inputs: Record<string, ValidatedEngineeringValue>
): CalculationResult {
    const timestamp = Date.now();
    const warnings: CalculationResult['warnings'] = [];
    const formulaTrace: Record<string, string> = {};

    const amount = inputs.amount.value as number;
    const rate = inputs.rate.value as number; // %
    const withholding = inputs.withholding.value as number; // e.g. 5 (for 5/10)
    const type = inputs.type.value as number; // 0=Exclude, 1=Include

    const rateDec = rate / 100;

    let baseAmount = 0;
    let vatAmount = 0;

    if (type === 0) {
        // Exclusive
        baseAmount = amount;
        vatAmount = baseAmount * rateDec;
        formulaTrace['vat'] = 'VAT = Base \\cdot Rate';
    } else {
        // Inclusive
        baseAmount = amount / (1 + rateDec);
        vatAmount = amount - baseAmount;
        formulaTrace['vat'] = 'VAT = Amount - \\frac{Amount}{1 + Rate}';
    }

    // Withholding (Tevkifat)
    // withholding value is X/10. e.g. 2 means 2/10
    const withholdingRate = withholding / 10;
    const withheldVAT = vatAmount * withholdingRate;
    const declaredVAT = vatAmount - withheldVAT;

    const grandTotal = baseAmount + vatAmount;
    const payableTotal = baseAmount + declaredVAT;

    formulaTrace['withheld'] = `Withheld = VAT \\cdot ${withholding}/10`;

    const outputs: Record<string, ValidatedEngineeringValue> = {
        baseAmount: createValidatedValue(baseAmount, 'Currency', 'derived', { precision: 2 }),
        vatAmount: createValidatedValue(vatAmount, 'Currency', 'derived', { precision: 2 }),
        withheldVAT: createValidatedValue(withheldVAT, 'Currency', 'derived', { precision: 2 }),
        declaredVAT: createValidatedValue(declaredVAT, 'Currency', 'derived', { precision: 2 }),
        grandTotal: createValidatedValue(grandTotal, 'Currency', 'derived', { precision: 2 }),
        payableTotal: createValidatedValue(payableTotal, 'Currency', 'derived', { precision: 2 }),
    };

    return {
        outputs,
        verified: true,
        warnings,
        timestamp,
        formulaTrace,
    };
}

// ============================================
// SCHEMA
// ============================================

const vatCalculatorSchema: CalculatorSchemaV2 = {
    id: 'vat-calculator',
    metadata: {
        title: 'VAT & Withholding',
        description: 'Calculate VAT (KDV) inclusive/exclusive amounts with Tevkifat support.',
        category: 'finance', // Will need to ensure this category exists or map it
        version: '2.0.0',
        author: 'AluCalc',
        lastUpdated: '2026-02-10',
        tags: ['vat', 'tax', 'finance', 'tevkifat'],
        verifiedStandards: ['Local Tax Law'],
    },
    inputs: [
        {
            key: 'amount',
            label: 'Amount',
            unit: 'Currency',
            defaultValue: 1000,
            validation: { min: 0, max: 1e9, required: true },
            description: 'Monetary value.',
        },
        {
            key: 'rate',
            label: 'VAT Rate',
            unit: '%',
            defaultValue: 20,
            validation: { min: 0, max: 100, required: true },
            description: 'Standard VAT percentage (1, 10, 20).',
        },
        {
            key: 'type',
            label: 'Type',
            unit: '-',
            defaultValue: 0, // 0 = Exclusive
            validation: { min: 0, max: 1, required: true },
            description: '0: VAT Exclusive, 1: VAT Inclusive',
        },
        {
            key: 'withholding',
            label: 'Withholding (x/10)',
            unit: '/10',
            defaultValue: 0,
            validation: { min: 0, max: 10, required: true },
            description: 'Tevkifat rate (e.g., 2 for 2/10). 0 for none.',
        },
    ],
    outputs: [
        {
            key: 'baseAmount',
            label: 'Base Amount',
            unit: 'TRY',
            formulaLatex: 'Base',
            description: 'Amount before tax.',
            precision: 2,
        },
        {
            key: 'vatAmount',
            label: 'Total VAT',
            unit: 'TRY',
            formulaLatex: 'VAT_{total}',
            description: 'Full VAT amount.',
            precision: 2,
        },
        {
            key: 'withheldVAT',
            label: 'Withheld Tax',
            unit: 'TRY',
            formulaLatex: 'VAT_{withheld}',
            description: 'Tevkifat amount.',
            precision: 2,
            affectsGeometry: true, // Trigger visualization
        },
        {
            key: 'payableTotal',
            label: 'Payable Total',
            unit: 'TRY',
            formulaLatex: 'Total_{pay}',
            description: 'Total amount to pay/collect.',
            precision: 2,
        },
    ],
    calculationEngine: calculateVAT,
    visualization: {
        type: 'svg-parametric',
        aspectRatio: 1,
    },
    documentation: {
        assumptions: [],
        standards: [],
        formulaLatex: 'VAT = Amount \\times Rate',
    },
    export: {
        csv: async (result) => {
            // Simple CSV export logic 
            return `Item,Value\nBase,${result.outputs.baseAmount.value}\nVAT,${result.outputs.vatAmount.value}\nTotal,${result.outputs.grandTotal.value}`;
        }
    }
};

export default vatCalculatorSchema;
