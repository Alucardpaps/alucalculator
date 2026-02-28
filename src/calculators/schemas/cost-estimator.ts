/**
 * AluCalc OS — Cost Estimator Schema
 * 
 * ENGINEERING DOMAIN: Finance / Manufacturing
 * 
 * Estimate material and manufacturing costs:
 * - Material cost by weight
 * - Labor cost
 * - Markup calculation
 */

import type { CalculatorSchema } from '@/types/calculator-schema';

export const costEstimatorSchema: CalculatorSchema = {
    id: 'cost-estimator-v1',
    version: '1.0.0',
    domain: 'mechanical',

    metadata: {
        title: 'Cost Estimator',
        description: 'Estimate material, labor, and total manufacturing costs for engineering projects.',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-08',
        tags: ['cost', 'estimate', 'material', 'labor', 'manufacturing', 'quote']
    },

    inputs: [
        {
            key: 'materialWeight',
            name: 'Material Weight',
            unit: 'kg',
            default: 10,
            min: 0.001,
            max: 100000,
            step: 0.1,
            description: 'Total weight of material.',
            required: true
        },
        {
            key: 'materialUnitPrice',
            name: 'Material Price',
            unit: '₺/kg',
            default: 150,
            min: 0.1,
            max: 10000,
            step: 1,
            description: 'Cost per kilogram of material.',
            required: true
        },
        {
            key: 'laborHours',
            name: 'Labor Hours',
            unit: 'h',
            default: 4,
            min: 0,
            max: 1000,
            step: 0.5,
            description: 'Estimated labor time.',
            required: true
        },
        {
            key: 'laborRate',
            name: 'Labor Rate',
            unit: '₺/h',
            default: 250,
            min: 10,
            max: 2000,
            step: 10,
            description: 'Hourly labor cost.',
            required: true
        },
        {
            key: 'machineHours',
            name: 'Machine Hours',
            unit: 'h',
            default: 2,
            min: 0,
            max: 500,
            step: 0.5,
            description: 'CNC/machine time required.',
            required: false
        },
        {
            key: 'machineRate',
            name: 'Machine Rate',
            unit: '₺/h',
            default: 500,
            min: 50,
            max: 5000,
            step: 50,
            description: 'Hourly machine cost.',
            required: false
        },
        {
            key: 'overhead',
            name: 'Overhead',
            unit: '%',
            default: 15,
            min: 0,
            max: 100,
            step: 5,
            description: 'Overhead percentage (utilities, rent, admin).',
            required: false
        },
        {
            key: 'profitMargin',
            name: 'Profit Margin',
            unit: '%',
            default: 20,
            min: 0,
            max: 100,
            step: 5,
            description: 'Target profit margin.',
            required: false
        },
        {
            key: 'quantity',
            name: 'Quantity',
            unit: '-',
            default: 1,
            min: 1,
            max: 100000,
            step: 1,
            description: 'Number of pieces to produce.',
            required: true
        }
    ],

    outputs: [
        {
            key: 'materialCost',
            name: 'Material Cost',
            unit: '₺',
            formula: 'materialWeight * materialUnitPrice',
            description: 'Total material cost',
            precision: 2
        },
        {
            key: 'laborCost',
            name: 'Labor Cost',
            unit: '₺',
            formula: 'laborHours * laborRate',
            description: 'Total labor cost',
            precision: 2
        },
        {
            key: 'machineCost',
            name: 'Machine Cost',
            unit: '₺',
            formula: 'machineHours * machineRate',
            description: 'Total machine cost',
            precision: 2
        },
        {
            key: 'directCost',
            name: 'Direct Cost',
            unit: '₺',
            formula: 'materialCost + laborCost + machineCost',
            description: 'Sum of material, labor, and machine',
            precision: 2
        },
        {
            key: 'overheadCost',
            name: 'Overhead Cost',
            unit: '₺',
            formula: 'directCost * overhead / 100',
            description: 'Overhead allocation',
            precision: 2
        },
        {
            key: 'totalCost',
            name: 'Total Cost',
            unit: '₺',
            formula: 'directCost + overheadCost',
            description: 'Cost before profit',
            precision: 2
        },
        {
            key: 'profit',
            name: 'Profit',
            unit: '₺',
            formula: 'totalCost * profitMargin / 100',
            description: 'Target profit amount',
            precision: 2
        },
        {
            key: 'sellingPrice',
            name: 'Selling Price',
            unit: '₺',
            formula: 'totalCost + profit',
            description: 'Recommended selling price per piece',
            precision: 2
        },
        {
            key: 'unitPrice',
            name: 'Unit Price',
            unit: '₺',
            formula: 'sellingPrice / quantity',
            description: 'Price per unit if quantity > 1',
            precision: 2
        },
        {
            key: 'totalOrder',
            name: 'Total Order Value',
            unit: '₺',
            formula: 'sellingPrice * quantity',
            description: 'Total order value',
            precision: 0
        }
    ],

    assumptions: [
        {
            id: 'linear-scaling',
            text: 'Costs scale linearly with quantity. Volume discounts not considered.',
            impact: 'medium',
            source: 'Standard costing'
        },
        {
            id: 'current-rates',
            text: 'Uses current material and labor rates. Subject to market changes.',
            impact: 'medium',
            source: 'Business practice'
        }
    ],

    references: [
        {
            standard: 'Cost Accounting',
            title: 'Standard costing methodology',
        }
    ],

    tier: 'free'
};

export default costEstimatorSchema;
