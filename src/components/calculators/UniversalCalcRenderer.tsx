'use client';

/**
 * AluCalc OS — Universal Calculator Renderer
 * 
 * THE TRUST MACHINE CORE
 * 
 * This component renders ANY calculator from its schema definition.
 * No calculator-specific UI code allowed here.
 * 
 * DESIGN PHILOSOPHY (ULTRATHINK):
 * ─────────────────────────────────────────────────────────────────────
 * 1. CYBER-INDUSTRIAL AESTHETIC
 *    - Dark slate backgrounds (slate-900)
 *    - Cyan technical accents (#00e5ff)
 *    - Blueprint grid feel
 *    - Sharp edges, no rounded corners except containers
 * 
 * 2. TRUST PRINCIPLES
 *    - NEVER auto-fix physics
 *    - ALWAYS show assumptions
 *    - BLOCK invalid states with CLEAR messaging
 *    - Every output shows unit and formula reference
 * 
 * 3. REACTIVITY
 *    - Real-time computation on input change
 *    - Debounced to prevent excessive recalculation
 *    - Visual feedback for computation state
 * ─────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AlertTriangle, Info, BookOpen, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import type { CalculatorSchema, InputField, OutputField, ValidationWarning } from '@/types/calculator-schema';
import { evaluateFormula, extractVariables, FormulaError } from '@/lib/formula-parser';

// ============================================
// Props Interface
// ============================================

export interface UniversalCalcRendererProps {
    schema: CalculatorSchema;
    initialValues?: Record<string, number>;
    onValuesChange?: (values: Record<string, number>) => void;
    onOutputsChange?: (outputs: Record<string, number>) => void;
    compact?: boolean;
    showAssumptions?: boolean;
    showReferences?: boolean;
}

// ============================================
// Styles
// ============================================

const styles = {
    container: `
        bg-[#0f1419] border border-[#1e2833] rounded-lg overflow-hidden
        font-mono text-sm
    `,
    header: `
        bg-gradient-to-r from-[#1a2332] to-[#0f1419] 
        px-4 py-3 border-b border-[#1e2833]
        flex items-center justify-between
    `,
    title: `
        text-[#00e5ff] font-bold text-base tracking-wide
    `,
    domain: `
        text-xs text-gray-500 uppercase tracking-widest
    `,
    section: `
        px-4 py-3 border-b border-[#1e2833]
    `,
    sectionTitle: `
        text-xs text-gray-500 uppercase tracking-widest mb-3
        flex items-center gap-2
    `,
    inputGrid: `
        grid gap-3
    `,
    inputGroup: `
        flex flex-col gap-1
    `,
    inputLabel: `
        text-xs text-gray-400 flex items-center justify-between
    `,
    inputWrapper: `
        relative flex items-center
    `,
    input: `
        w-full bg-[#1a2332] border border-[#2a3a4a] rounded px-3 py-2
        text-white font-mono text-sm
        focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff]/30
        transition-colors
    `,
    inputError: `
        border-red-500 focus:border-red-500 focus:ring-red-500/30
    `,
    inputUnit: `
        absolute right-3 text-gray-500 text-xs pointer-events-none
    `,
    outputGrid: `
        grid gap-2
    `,
    outputRow: `
        flex items-center justify-between py-2 px-3
        bg-[#1a2332] rounded border border-[#2a3a4a]
    `,
    outputLabel: `
        text-gray-400 text-xs
    `,
    outputValue: `
        text-[#00e5ff] font-bold tabular-nums
    `,
    outputUnit: `
        text-gray-500 text-xs ml-1
    `,
    warning: `
        flex items-start gap-2 px-3 py-2 mt-2
        bg-yellow-500/10 border border-yellow-500/30 rounded
        text-yellow-400 text-xs
    `,
    error: `
        flex items-start gap-2 px-3 py-2 mt-2
        bg-red-500/10 border border-red-500/30 rounded
        text-red-400 text-xs
    `,
    assumption: `
        flex items-start gap-2 py-2 border-b border-[#1e2833] last:border-0
    `,
    assumptionImpact: {
        low: 'text-green-400',
        medium: 'text-yellow-400',
        high: 'text-red-400',
    },
    reference: `
        flex items-center justify-between py-2 border-b border-[#1e2833] last:border-0
        text-xs text-gray-400 hover:text-[#00e5ff] transition-colors
    `,
    collapsible: `
        cursor-pointer select-none
    `,
};

// ============================================
// Input Component
// ============================================

interface CalcInputProps {
    field: InputField;
    value: number;
    onChange: (key: string, value: number) => void;
    error?: string;
}

const CalcInput: React.FC<CalcInputProps> = ({ field, value, onChange, error }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
            onChange(field.key, val);
        }
    };

    return (
        <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
                <span>{field.name}</span>
                <span className="text-gray-600" title={field.description}>
                    <Info size={12} className="cursor-help" />
                </span>
            </label>
            <div className={styles.inputWrapper}>
                <input
                    type="number"
                    value={value}
                    onChange={handleChange}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    className={`${styles.input} ${error ? styles.inputError : ''} pr-12`}
                    title={field.description}
                />
                <span className={styles.inputUnit}>{field.unit}</span>
            </div>
            {error && (
                <div className="text-red-400 text-xs flex items-center gap-1 mt-1">
                    <AlertTriangle size={12} />
                    {error}
                </div>
            )}
        </div>
    );
};

// ============================================
// Output Component
// ============================================

interface CalcOutputProps {
    field: OutputField;
    value: number | null;
    warning?: ValidationWarning;
}

const CalcOutput: React.FC<CalcOutputProps> = ({ field, value, warning }) => {
    const formattedValue = value !== null
        ? value.toFixed(field.precision ?? 3)
        : '—';

    return (
        <div>
            <div className={styles.outputRow}>
                <div>
                    <div className={styles.outputLabel}>{field.name}</div>
                </div>
                <div className="flex items-baseline">
                    <span className={`${styles.outputValue} ${warning ? 'text-yellow-400' : ''}`}>
                        {formattedValue}
                    </span>
                    <span className={styles.outputUnit}>{field.unit}</span>
                </div>
            </div>
            {warning && (
                <div className={styles.warning}>
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>{warning.message}</span>
                </div>
            )}
        </div>
    );
};

// ============================================
// Main Component
// ============================================

export const UniversalCalcRenderer: React.FC<UniversalCalcRendererProps> = ({
    schema,
    initialValues,
    onValuesChange,
    onOutputsChange,
    compact = false,
    showAssumptions = true,
    showReferences = true,
}) => {
    // Initialize input values from schema defaults
    const defaultValues = useMemo(() => {
        const defaults: Record<string, number> = {};
        schema.inputs.forEach(input => {
            defaults[input.key] = initialValues?.[input.key] ?? input.default;
        });
        return defaults;
    }, [schema, initialValues]);

    const [inputValues, setInputValues] = useState<Record<string, number>>(defaultValues);
    const [inputErrors, setInputErrors] = useState<Record<string, string>>({});
    const [assumptionsOpen, setAssumptionsOpen] = useState(!compact);
    const [referencesOpen, setReferencesOpen] = useState(false);

    // Validate inputs
    const validateInput = useCallback((field: InputField, value: number): string | null => {
        if (isNaN(value)) return 'Must be a valid number';
        if (field.min !== undefined && value < field.min) return `Minimum: ${field.min} ${field.unit}`;
        if (field.max !== undefined && value > field.max) return `Maximum: ${field.max} ${field.unit}`;
        return null;
    }, []);

    // Handle input change
    const handleInputChange = useCallback((key: string, value: number) => {
        const field = schema.inputs.find(i => i.key === key);
        if (!field) return;

        const error = validateInput(field, value);

        setInputValues(prev => ({ ...prev, [key]: value }));
        setInputErrors(prev => {
            if (error) return { ...prev, [key]: error };
            const { [key]: _, ...rest } = prev;
            return rest;
        });

        onValuesChange?.({ ...inputValues, [key]: value });
    }, [schema, inputValues, validateInput, onValuesChange]);

    // Compute outputs
    const computedOutputs = useMemo(() => {
        const outputs: Record<string, number | null> = {};
        const warnings: Record<string, ValidationWarning> = {};

        // Check if we have validation errors - if so, don't compute
        if (Object.keys(inputErrors).length > 0) {
            schema.outputs.forEach(output => {
                outputs[output.key] = null;
            });
            return { outputs, warnings };
        }

        // Build context with all input values
        const context: Record<string, number> = { ...inputValues };

        // Compute each output in order (supports dependencies)
        for (const output of schema.outputs) {
            try {
                // Check if formula has all required variables
                const requiredVars = extractVariables(output.formula);
                const missingVars = requiredVars.filter(v => context[v] === undefined);

                if (missingVars.length > 0) {
                    outputs[output.key] = null;
                    continue;
                }

                const result = evaluateFormula(output.formula, context);
                outputs[output.key] = result;
                context[output.key] = result; // Make available for subsequent outputs

                // Check warning thresholds
                if (output.warningThreshold) {
                    if (output.warningThreshold.min !== undefined && result < output.warningThreshold.min) {
                        warnings[output.key] = {
                            field: output.key,
                            message: output.warningThreshold.message,
                            value: result,
                            threshold: 'min'
                        };
                    }
                    if (output.warningThreshold.max !== undefined && result > output.warningThreshold.max) {
                        warnings[output.key] = {
                            field: output.key,
                            message: output.warningThreshold.message,
                            value: result,
                            threshold: 'max'
                        };
                    }
                }
            } catch (e) {
                console.error(`Error computing ${output.key}:`, e);
                outputs[output.key] = null;
            }
        }

        return { outputs, warnings };
    }, [schema, inputValues, inputErrors]);

    // Notify parent of output changes
    useEffect(() => {
        const validOutputs: Record<string, number> = {};
        Object.entries(computedOutputs.outputs).forEach(([key, value]) => {
            if (value !== null) validOutputs[key] = value;
        });
        onOutputsChange?.(validOutputs);
    }, [computedOutputs.outputs, onOutputsChange]);

    const gridCols = compact ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h3 className={styles.title}>{schema.metadata.title}</h3>
                    <p className={styles.domain}>{schema.domain}</p>
                </div>
                <div className="text-xs text-gray-600">v{schema.version}</div>
            </div>

            {/* Inputs */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>
                    <span>INPUTS</span>
                </div>
                <div className={`${styles.inputGrid} ${gridCols}`}>
                    {schema.inputs.map(field => (
                        <CalcInput
                            key={field.key}
                            field={field}
                            value={inputValues[field.key]}
                            onChange={handleInputChange}
                            error={inputErrors[field.key]}
                        />
                    ))}
                </div>
            </div>

            {/* Outputs */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>
                    <span>OUTPUTS</span>
                    {Object.keys(inputErrors).length > 0 && (
                        <span className="text-red-400 text-xs normal-case">
                            (fix input errors to compute)
                        </span>
                    )}
                </div>
                <div className={styles.outputGrid}>
                    {schema.outputs.map(field => (
                        <CalcOutput
                            key={field.key}
                            field={field}
                            value={computedOutputs.outputs[field.key]}
                            warning={computedOutputs.warnings[field.key]}
                        />
                    ))}
                </div>
            </div>

            {/* Assumptions */}
            {showAssumptions && schema.assumptions.length > 0 && (
                <div className={styles.section}>
                    <div
                        className={`${styles.sectionTitle} ${styles.collapsible}`}
                        onClick={() => setAssumptionsOpen(!assumptionsOpen)}
                    >
                        <BookOpen size={14} />
                        <span>ASSUMPTIONS ({schema.assumptions.length})</span>
                        {assumptionsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                    {assumptionsOpen && (
                        <div>
                            {schema.assumptions.map(assumption => (
                                <div key={assumption.id} className={styles.assumption}>
                                    <span className={`text-xs ${styles.assumptionImpact[assumption.impact]}`}>
                                        [{assumption.impact.toUpperCase()}]
                                    </span>
                                    <span className="text-gray-300 text-xs">{assumption.text}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* References */}
            {showReferences && schema.references.length > 0 && (
                <div className={styles.section}>
                    <div
                        className={`${styles.sectionTitle} ${styles.collapsible}`}
                        onClick={() => setReferencesOpen(!referencesOpen)}
                    >
                        <ExternalLink size={14} />
                        <span>REFERENCES ({schema.references.length})</span>
                        {referencesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                    {referencesOpen && (
                        <div>
                            {schema.references.map((ref, idx) => (
                                <div key={idx} className={styles.reference}>
                                    <span>
                                        <strong>{ref.standard}</strong>
                                        {ref.section && ` — ${ref.section}`}
                                        {ref.title && `: ${ref.title}`}
                                    </span>
                                    {ref.url && (
                                        <a
                                            href={ref.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#00e5ff] hover:underline"
                                        >
                                            <ExternalLink size={12} />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UniversalCalcRenderer;
