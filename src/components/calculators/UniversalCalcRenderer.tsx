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
import { evaluateFormula, extractVariables } from '@/lib/formula-parser';
import { CalculatorVisualizer } from '@/components/calculators/CalculatorVisualizer';
import { isSchemaV2, type CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue, type ValidatedEngineeringValue } from '@/types/engineering';
import { METRIC_BOLTS } from '@/data/mechanical/fasteners';
import { SIGMA_PROFILES } from '@/data/mechanical/profiles';
import { useProjectStore } from '@/store/projectStore';
import { useI18nStore } from '@/store/i18nStore';

// ============================================
// Props Interface
// ============================================

export interface UniversalCalcRendererProps {
    schema: CalculatorSchema;
    initialValues?: Record<string, number>;
    onValuesChange?: (values: Record<string, number>) => void;
    onOutputsChange?: (outputs: Record<string, number>) => void;
    onFormulaChange?: (key: string, formula: string | null) => void;
    formulas?: Record<string, string>;
    compact?: boolean;
    showAssumptions?: boolean;
    showReferences?: boolean;
}

import BeamCanvas from '../modules/fea/BeamCanvas';
import BeamCanvas3D from '../modules/fea/BeamCanvas3D';

// ============================================
// Styles (AVANT-GARDE UPGRADE)
// ============================================

const styles = {
    container: `
        w-full h-full flex flex-col font-mono text-sm
        transition-all duration-300
    `,
    header: `
        hidden /* Handled by CalculatorNode header now */
    `,
    title: `
        text-[#00e5ff] font-bold text-lg tracking-wider
        drop-shadow-[0_0_10px_rgba(0,229,255,0.3)]
    `,
    domain: `
        text-[10px] text-[#00e5ff]/60 uppercase tracking-[0.2em] font-bold
    `,
    section: `
        px-1 py-3 last:pb-0
    `,
    sectionTitle: `
        text-[9px] text-cyan-900/60 uppercase tracking-[0.2em] mb-3
        flex items-center gap-2 font-bold select-none border-b border-cyan-900/20 pb-1
    `,
    inputGrid: `
        grid gap-3
    `,
    inputGroup: `
        flex flex-col gap-1 relative group
    `,
    inputLabel: `
        text-[10px] text-slate-500 uppercase tracking-widest flex items-center justify-between group-hover:text-cyan-400 transition-colors
    `,
    inputWrapper: `
        relative flex items-center
    `,
    input: `
        w-full bg-[#020408]/60 backdrop-blur-sm border border-cyan-900/30 rounded-md px-3 py-2
        text-cyan-50 font-mono text-[11px] font-medium
        focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30
        focus:bg-[#05090e]/80 hover:border-cyan-700/50
        transition-all duration-300
        placeholder-slate-700 shadow-inner
    `,
    inputError: `
        !border-red-500/50 !focus:ring-red-500/20 !bg-red-900/10 !text-red-400
    `,
    inputUnit: `
        absolute right-3 text-cyan-900 text-[9px] font-bold tracking-widest uppercase pointer-events-none select-none group-hover:text-cyan-700 transition-colors
    `,
    outputGrid: `
        grid gap-2
    `,
    outputRow: `
        flex items-center justify-between py-2 px-3
        bg-black/30 rounded-md border border-cyan-900/20
        hover:border-cyan-500/30 hover:bg-[#0a0f16]/60 transition-all duration-300
        group/out
    `,
    outputLabel: `
        text-slate-500 text-[10px] tracking-widest uppercase group-hover/out:text-cyan-600 transition-colors
    `,
    outputValue: `
        text-cyan-400 font-bold tabular-nums text-sm
        drop-shadow-[0_0_8px_rgba(0,229,255,0.3)] group-hover/out:drop-shadow-[0_0_12px_rgba(0,229,255,0.6)] transition-all
    `,
    outputUnit: `
        text-cyan-900 text-[9px] ml-1.5 font-bold uppercase tracking-widest
    `,
    warning: `
        flex items-start gap-2 px-3 py-2 mt-2
        bg-yellow-900/10 border border-yellow-500/20 rounded-md
        text-yellow-500/80 text-[10px] tracking-widest uppercase
    `,
    error: `
        flex items-start gap-2 px-3 py-2 mt-2
        bg-red-900/10 border border-red-500/20 rounded-md
        text-red-500/80 text-[10px] tracking-widest uppercase
    `,
    collapsible: `
        cursor-pointer select-none hover:text-cyan-400 transition-colors text-[10px] tracking-widest uppercase text-slate-600 flex items-center justify-between py-2 border-t border-cyan-900/20 mt-2
    `,
};

// ============================================
// Input Component
// ============================================

interface CalcInputProps {
    field: InputField;
    value: number | string;
    formula?: string;
    onChange: (key: string, value: number | string) => void;
    onFormulaChange?: (key: string, formula: string | null) => void;
    error?: string;
}

const CalcInput: React.FC<CalcInputProps> = ({ field, value, formula, onChange, onFormulaChange, error }) => {
    const { getVariableValue } = useProjectStore();
    const { t } = useI18nStore();
    const [isFormula, setIsFormula] = useState(!!formula);
    // Local state to handle typing while resolving
    const [localValue, setLocalValue] = useState(formula || value);

    // Sync external value changes if not in formula mode
    useEffect(() => {
        if (!isFormula) {
            setLocalValue(value);
        }
    }, [value, isFormula]);

    // Sync external formula changes
    useEffect(() => {
        if (formula) {
            setIsFormula(true);
            setLocalValue(formula);
        } else if (isFormula && !formula) {
            // Formula removed externally?
            // Should handled by isFormula state mostly, but good to sync
        }
    }, [formula]);

    // Check if field is meant to be numeric (no options, type not explicitly string)
    const isOptionsField = !!field.options;
    const isNumericInput = !isOptionsField; // Default to number input for non-select fields

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setLocalValue(raw);

        // FORMULA LOGIC
        if (isNumericInput && raw.startsWith('=')) {
            setIsFormula(true);
            const varName = raw.substring(1).trim();
            const resolved = getVariableValue(varName);

            if (resolved !== undefined) {
                // Resolved! Update value but keep formula state
                onChange(field.key, resolved);
                if (onFormulaChange) onFormulaChange(field.key, raw);
            } else {
                // Not resolved yet
                if (onFormulaChange) onFormulaChange(field.key, raw);
            }
            return;
        }

        // EXIT FORMULA MODE
        if (isFormula && !raw.startsWith('=')) {
            setIsFormula(false);
            if (onFormulaChange) onFormulaChange(field.key, null);
        }

        if (isNumericInput) {
            const val = parseFloat(raw);
            // Allow empty string or minus sign for typing
            if (raw === '' || raw === '-') {
                onChange(field.key, raw);
                return;
            }
            if (!isNaN(val)) {
                onChange(field.key, val);
            }
        } else {
            onChange(field.key, raw);
        }
    };

    // Support V2 label and description props with dynamic i18n translation
    // We check t.calcCommon for shared engineering terms, fallback to schema defined english
    const resolvedLabel = (t.calcCommon as any)?.[field.key]?.label || (field as any).label || field.name;
    const resolvedDesc = (t.calcCommon as any)?.[field.key]?.desc || (field as any).description || '';

    // Detect Special Data Types
    const isBoltSelect = field.key === 'bolt_size';
    const isProfileSelect = field.key === 'profile_type';

    if (isOptionsField && field.options) {
        // ... (standard options rendering - keep as is)
        return (
            <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                    <span>{resolvedLabel}</span>
                    {resolvedDesc && (
                        <span className="text-gray-600" title={resolvedDesc}>
                            <Info size={12} className="cursor-help" />
                        </span>
                    )}
                </label>
                <div className="relative">
                    <select
                        value={String(value)}
                        onChange={(e) => {
                            const val = e.target.value;
                            const option = field.options?.find(o => String(o.value) === val);
                            if (option && typeof option.value === 'number') {
                                onChange(field.key, option.value);
                            } else {
                                onChange(field.key, val);
                            }
                        }}
                        className={`${styles.input} ${error ? styles.inputError : ''} appearance-none pr-8 cursor-pointer`}
                        title={resolvedDesc}
                    >
                        {field.options.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>
        );
    }

    // Special Data Selectors
    if (isBoltSelect || isProfileSelect) {
        return (
            <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                    <span className="text-[#00e5ff] font-bold">{resolvedLabel} ({t.dbLabel || "DB"})</span>
                    <span className="text-[9px] bg-[#00e5ff]/10 text-[#00e5ff] px-1 rounded">{t.quickSelect || "QUICK SELECT"}</span>
                </label>
                <div className="relative">
                    <select
                        value={String(value)}
                        onChange={(e) => onChange(field.key, e.target.value)}
                        className={`${styles.input} !border-[#00e5ff]/50 !bg-[#00e5ff]/5 appearance-none pr-8 cursor-pointer font-bold text-[#00e5ff]`}
                    >
                        <option value="">{t.selectStandard || "Select Standard..."}</option>
                        {isBoltSelect && METRIC_BOLTS.map(b => (
                            <option key={b.id} value={b.id}>{b.id} - {b.name}</option>
                        ))}
                        {isProfileSelect && SIGMA_PROFILES.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.w}x{p.h})</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00e5ff] pointer-events-none" />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
                <span>{resolvedLabel}</span>
                {resolvedDesc && (
                    <span className="text-gray-600" title={resolvedDesc}>
                        <Info size={12} className="cursor-help" />
                    </span>
                )}
            </label>
            <div className={styles.inputWrapper}>
                <input
                    type={isFormula ? "text" : "number"} // Switch to text when formula
                    value={isFormula ? localValue : value} // Show formula string if formula, else value
                    onChange={handleChange}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    className={`${styles.input} ${error ? styles.inputError : ''} pr-12`}
                    title={resolvedDesc}
                />
                <span className={styles.inputUnit}>{field.unit}</span>
                {isFormula && (
                    <span className="absolute right-10 text-[#00e5ff] text-xs pointer-events-none animate-pulse">
                        {t.varLabel || "VAR"}
                    </span>
                )}
            </div>
            {error && (
                <div className="text-red-400 text-xs flex items-center gap-1 mt-1 font-bold">
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
    const { t } = useI18nStore();
    const formattedValue = (value !== null && value !== undefined && !isNaN(value))
        ? value.toFixed(field.precision ?? 3)
        : '—';

    // Support both V1 and V2 schema properties with i18n
    const formula = (field as any).formulaLatex || (field as any).formula;

    const resolvedLabel = (t.calcCommon as any)?.[field.key]?.label || (field as any).label || field.name;
    const resolvedDesc = (t.calcCommon as any)?.[field.key]?.desc || (field as any).description;

    return (
        <div>
            <div className={styles.outputRow}>
                <div className="flex items-center gap-1.5" title={`${resolvedDesc || ''}${formula ? `\n\nFormula: ${formula}` : ''}`}>
                    <div className={styles.outputLabel}>{resolvedLabel}</div>
                    {(resolvedDesc || formula) && <Info size={10} className="text-gray-500 cursor-help" />}
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
    onFormulaChange,
    formulas,
    compact = false,
    showAssumptions = true,
    showReferences = true,
}) => {
    // Initialize input values from schema defaults
    const defaultValues = useMemo(() => {
        const defaults: Record<string, number | string> = {};
        schema.inputs.forEach(input => {
            // Priority: Initial -> Default -> First Option -> 0
            // Cast input to any to access defaultValue safely
            const defVal = (input as any).defaultValue;
            defaults[input.key] = initialValues?.[input.key]
                ?? defVal
                ?? input.default // Legacy support
                ?? (input.options ? input.options[0].value : 0);
        });
        return defaults;
    }, [schema, initialValues]);

    const [inputValues, setInputValues] = useState<Record<string, number | string>>(defaultValues);
    const [inputErrors, setInputErrors] = useState<Record<string, string>>({});
    const [assumptionsOpen, setAssumptionsOpen] = useState(!compact);
    const [referencesOpen, setReferencesOpen] = useState(false);
    const [is3DMode, setIs3DMode] = useState(false);

    // Global i18n
    const { t } = useI18nStore();
    const translatedTitle = t.modules[schema.id]?.title || schema.metadata.title;
    const translatedCategory = (t.categories as any)[(schema as any).metadata?.category] || (schema as any).metadata?.category || 'ENGINEERING';

    // Sync external prop changes
    useEffect(() => {
        if (initialValues) {
            setInputValues(prev => {
                const updated = { ...prev };
                let hasChanges = false;
                Object.entries(initialValues).forEach(([key, value]) => {
                    if (prev[key] !== value) {
                        updated[key] = value;
                        hasChanges = true;
                    }
                });
                return hasChanges ? updated : prev;
            });
        }
    }, [initialValues]);

    // Validate inputs
    const validateInput = useCallback((field: InputField, value: number | string): string | null => {
        // Numeric validation
        if (typeof value === 'number') {
            if (isNaN(value)) return 'Invalid number';
            if (field.min !== undefined && value < field.min) return `Min: ${field.min}`;
            if (field.max !== undefined && value > field.max) return `Max: ${field.max}`;
        }

        // String/General validation
        // Check if value is logically empty (null, undefined, empty string)
        const isEmpty = value === null || value === undefined || value === '';

        // Check V2 'validation.required' property if valid
        const isRequired = (field as any).validation?.required || false;

        if (isEmpty && isRequired) {
            return 'Required';
        }

        return null;
    }, []);

    // Handle input change
    const handleInputChange = useCallback((key: string, value: number | string) => {
        const field = schema.inputs.find(i => i.key === key);
        if (!field) return;

        const error = validateInput(field, value);

        // clone current values to apply updates
        const nextValues = { ...inputValues, [key]: value };

        // --- 🚀 UNIVERSAL DATA QUICK SELECT ---
        // Auto-fill geometry based on standard selections

        // 1. Bolt Selection
        if (key === 'bolt_size' && typeof value === 'string') {
            const bolt = METRIC_BOLTS.find(b => b.id === value);
            if (bolt) {
                // Map bolt props to common input keys
                const map = {
                    'diameter': bolt.d, 'd': bolt.d,
                    'pitch': bolt.p, 'p': bolt.p,
                    'head_height': bolt.k, 'k': bolt.k,
                    'hex_width': bolt.s, 's': bolt.s,
                    'hole_dia': bolt.drill, 'dh': bolt.drill
                };

                Object.entries(map).forEach(([targetKey, targetVal]) => {
                    // Only update if this calculator actually HAS this input
                    if (schema.inputs.some(i => i.key === targetKey)) {
                        nextValues[targetKey] = targetVal;
                    }
                });
            }
        }

        // 2. Profile Selection
        if (key === 'profile_type' && typeof value === 'string') {
            const profile = SIGMA_PROFILES.find(p => p.id === value);
            if (profile) {
                const map = {
                    'width': profile.w, 'w': profile.w, 'b': profile.w,
                    'height': profile.h, 'h': profile.h,
                    'weight': profile.weight, 'mass': profile.weight,
                    'ix': profile.ix,
                    'iy': profile.iy,
                    'slot': profile.slot
                };

                Object.entries(map).forEach(([targetKey, targetVal]) => {
                    if (schema.inputs.some(i => i.key === targetKey)) {
                        nextValues[targetKey] = targetVal;
                    }
                });
            }
        }

        setInputValues(nextValues);
        setInputErrors(prev => {
            if (error) return { ...prev, [key]: error };
            const { [key]: _, ...rest } = prev;
            return rest;
        });

        // Notify parent 
        onValuesChange?.(nextValues as any);
    }, [schema, inputValues, validateInput, onValuesChange]);

    // Compute outputs
    const computedOutputs = useMemo(() => {
        const outputs: Record<string, number | null> = {};
        const warnings: Record<string, ValidationWarning> = {};

        // If strict errors exist, block calculation?
        // Maybe only block if specific inputs are invalid. 
        // For now, if errors exist, return empty output to prompt user to fix.
        if (Object.keys(inputErrors).length > 0) {
            return { outputs, warnings };
        }

        // V2 CALCULATION ENGINE
        if (isSchemaV2(schema)) {
            try {
                // 1. Construct Validated Inputs
                const validatedInputs: Record<string, ValidatedEngineeringValue> = {};
                const v2Schema = schema as CalculatorSchemaV2;

                v2Schema.inputs.forEach(input => {
                    let rawValue = inputValues[input.key];

                    // Fallback to default if undefined/null or empty string
                    if (rawValue === undefined || rawValue === null || rawValue === '') {
                        rawValue = (input as any).defaultValue;
                    }

                    // STRICT SANITIZATION:
                    // 1. If it's a number, ensure it's finite. If NaN/Infinity, use default or 0.
                    // 2. If it's a string, keep it unless it's empty (handled above).
                    // 3. This prevents "H7" -> 0 clobbering.
                    if (typeof rawValue === 'number') {
                        if (!Number.isFinite(rawValue)) {
                            const def = (input as any).defaultValue;
                            rawValue = (typeof def === 'number' && Number.isFinite(def)) ? def : 0;
                        }
                    } else if (typeof rawValue !== 'string' && typeof rawValue !== 'boolean') {
                        // If it's not string/number/bool, it's garbage. Use default or 0.
                        const def = (input as any).defaultValue;
                        rawValue = def ?? 0;
                    }

                    validatedInputs[input.key] = createValidatedValue(
                        rawValue as any,
                        input.unit,
                        'user'
                    );
                });

                // 2. Execute Engine
                const result = v2Schema.calculationEngine(validatedInputs);

                // 3. Map Outputs
                if (result) {
                    Object.entries(result.outputs).forEach(([key, val]) => {
                        // Support both number and string outputs if ever needed, 
                        // but currently OutputField expects value to be rendered via toFixed() which implies number.
                        // We filter for number for safety.
                        if (typeof val.value === 'number' && Number.isFinite(val.value)) {
                            outputs[key] = val.value;
                        } else {
                            outputs[key] = 0; // Fallback for NaN outputs
                        }
                    });

                    // 4. Map Warnings
                    result.warnings?.forEach(w => {
                        warnings[w.field] = {
                            field: w.field,
                            message: w.message,
                            value: 0,
                            threshold: 'min'
                        };
                    });
                }

            } catch (e) {
                console.error('V2 Calc Error:', e);
            }
            return { outputs, warnings };
        }

        // V1 LEGACY FORMULA ENGINE
        // Requires all inputs to be numbers
        const context: Record<string, number> = {};
        let inputError = false;

        Object.entries(inputValues).forEach(([k, v]) => {
            if (typeof v === 'number' && !isNaN(v)) {
                context[k] = v;
            } else {
                // If a required V1 input is not a number, we can't compute?
                // V1 inputs are implicitly numbers.
                // We'll proceed with what we have.
                context[k] = 0; // Safe fallback
            }
        });

        for (const output of schema.outputs) {
            try {
                const formula = (output as any).formula;
                if (!formula) continue;

                const result = evaluateFormula(formula, context);

                if (typeof result === 'number' && !isNaN(result)) {
                    outputs[output.key] = result;
                    context[output.key] = result;
                } else {
                    outputs[output.key] = null;
                }
            } catch (e) { }
        }

        return { outputs, warnings };
    }, [schema, inputValues, inputErrors]);

    // Use ref to avoid infinite loops on callback
    const onOutputsChangeRef = React.useRef(onOutputsChange);
    onOutputsChangeRef.current = onOutputsChange;

    // Notify parent of output changes (using ref to avoid infinite loops)
    useEffect(() => {
        const validOutputs: Record<string, number> = {};
        Object.entries(computedOutputs.outputs).forEach(([key, value]) => {
            if (value !== null) validOutputs[key] = value;
        });
        onOutputsChangeRef.current?.(validOutputs);
    }, [computedOutputs.outputs]);

    const gridCols = compact ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

    // FEA SPECIAL RENDERER
    if (schema.id === 'beam-frame-fea') {
        return (
            <div className="absolute inset-0 font-mono text-xs flex flex-col z-0" style={{ backgroundColor: '#020305' }}>
                <div className="absolute top-4 right-20 z-10 pointer-events-none">
                    <button
                        onClick={() => setIs3DMode(!is3DMode)}
                        className="pointer-events-auto px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded text-[10px] text-white hover:bg-white/20 transition-all font-mono tracking-widest flex items-center gap-2"
                    >
                        <span className={`w-2 h-2 rounded-full ${is3DMode ? 'bg-[#00e5ff]' : 'bg-gray-500'}`} />
                        {is3DMode ? (t.switch2D || 'SWITCH TO 2D') : (t.switch3D || 'SWITCH TO 3D')}
                    </button>
                </div>
                {is3DMode ? <BeamCanvas3D /> : <BeamCanvas />}
            </div>
        );
    }

    // Sanitize inputs for visualizer
    const sanitizedVisualizerInputs = React.useMemo(() => {
        const clean: Record<string, number | string> = {};

        // 1. Start with defaults for ALL inputs defined in schema
        schema.inputs.forEach(input => {
            const def = (input as any).defaultValue;
            // Use 0 as ultimate fallback if no default exists
            clean[input.key] = def !== undefined ? def : 0;
        });

        // 2. Override with actual input values if valid
        Object.entries(inputValues).forEach(([k, v]) => {
            // If number: must be finite
            if (typeof v === 'number') {
                if (Number.isFinite(v)) {
                    clean[k] = v;
                }
                // If NaN/Infinity, we keep the default we set in step 1
            }
            // If string: allow it (needed for fits classes like "H7")
            else if (typeof v === 'string') {
                if (v !== '') clean[k] = v;
            }
            // Boolean or other: pass through
            else {
                clean[k] = v;
            }
        });

        return clean;
    }, [inputValues, schema.inputs]);

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h3 className={styles.title}>{translatedTitle}</h3>
                    <p className={styles.domain}>
                        {translatedCategory}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 bg-[#1a2332] px-2 py-1 rounded border border-[#2a3a4a] select-none">
                        v{schema.version}
                    </span>
                </div>
            </div>

            {/* Visualizer */}
            {((schema as any).visualizer || (schema as any).visualization) && (
                <div className="border-b border-[#1e2833] bg-[#05080a] p-4 flex justify-center">
                    <div className="w-full h-full min-h-[250px] relative">
                        {/* Pass both inputs and computed outputs */}
                        <CalculatorVisualizer
                            schema={schema}
                            inputs={sanitizedVisualizerInputs} // Use clean inputs to prevent NaN SVG errors
                            outputs={computedOutputs.outputs as Record<string, number>}
                        />
                    </div>
                </div>
            )}

            {/* Inputs */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>
                    <span>{t.parametersTitle || "PARAMETERS"}</span>
                </div>
                <div className={`${styles.inputGrid} ${gridCols}`}>
                    {schema.inputs.map(field => (
                        <CalcInput
                            key={field.key}
                            field={field}
                            value={inputValues[field.key] ?? ''}
                            formula={formulas?.[field.key]}
                            onChange={handleInputChange}
                            onFormulaChange={onFormulaChange}
                            error={inputErrors[field.key]}
                        />
                    ))}
                </div>
            </div>

            {/* Outputs */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>
                    <span>{t.resultsTitle || "RESULTS"}</span>
                    {Object.keys(inputErrors).length > 0 && (
                        <span className="text-red-400 text-[10px] normal-case bg-red-500/10 px-2 py-0.5 rounded ml-auto flex items-center gap-1">
                            <AlertTriangle size={10} />
                            {t.fixInputs || "FIX INPUTS"}
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
                                <div key={assumption.id} className="flex items-start gap-2 py-2 border-b border-[#1e2833]/50 last:border-0 hover:bg-[#1a2332]/50 transition-colors px-2 rounded">
                                    <span className={`text-[10px] font-bold ${assumption.impact === 'high' ? 'text-red-400' : assumption.impact === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                                        [{assumption.impact.toUpperCase()}]
                                    </span>
                                    <span className="text-gray-400 text-xs">{assumption.text}</span>
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
                        <span>STANDARDS</span>
                        {referencesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                    {referencesOpen && (
                        <div>
                            {schema.references.map((ref, idx) => (
                                <div key={idx} className="flex items-center justify-between py-2 border-b border-[#1e2833]/50 last:border-0 text-xs text-gray-500 hover:bg-[#1a2332]/50 transition-colors px-2 rounded">
                                    <span>
                                        <strong className="text-gray-300">{ref.standard}</strong>
                                        {ref.title && <span className="opacity-70"> — {ref.title}</span>}
                                    </span>
                                    {ref.url && (
                                        <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-[#00e5ff] hover:text-white transition-colors">
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
export default UniversalCalcRenderer
