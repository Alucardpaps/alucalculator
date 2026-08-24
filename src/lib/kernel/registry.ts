/**
 * 🏛️ ALUCALCULATOR KERNEL - REGISTRY
 * "The Bureau of Standards"
 */

import { CalculatorSchema } from './schema';
import { ComplianceError, ValidationError } from './errors';
import { createVal } from './types';

class Registry {
    private map: Map<string, CalculatorSchema> = new Map();

    register(schema: CalculatorSchema): void {
        if (this.map.has(schema.id)) {
            throw new ComplianceError(`Duplicate Calculator ID: ${schema.id}`);
        }

        this.validateCompliance(schema);
        this.map.set(schema.id, schema);
        console.log(`[Kernel] Registered: ${schema.id} v${schema.version}`);
    }

    get(id: string): CalculatorSchema {
        const schema = this.map.get(id);
        if (!schema) {
            throw new Error(`Calculator not found: ${id}`);
        }
        return schema;
    }

    getAll(): CalculatorSchema[] {
        return Array.from(this.map.values());
    }

    /**
     * Performs a dry run to ensure the compute function returns
     * values matching the declared output schema units.
     */
    validateCompliance(schema: CalculatorSchema): void {
        // Generate mock inputs
        const mockInputs: Record<string, number> = {};
        schema.inputs.forEach(input => {
            mockInputs[input.key] = input.defaultValue ?? (input.min ?? 1);
        });

        try {
            const results = schema.compute(mockInputs);

            // Check outputs
            schema.outputs.forEach(output => {
                const val = results[output.key];
                if (!val) {
                    throw new ComplianceError(`Compute function failed to return output: ${output.key}`);
                }
                if (val.unit !== output.unit) {
                    throw new ComplianceError(
                        `Output unit mismatch for ${output.key}. Schema: ${output.unit}, Computed: ${val.unit}`
                    );
                }
            });
        } catch (e: any) {
            throw new ComplianceError(`Compliance dry-run failed: ${e.message}`);
        }
    }
}

export const CalculatorRegistry = new Registry();
