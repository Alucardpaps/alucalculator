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
 *    - Glassmorphism & Structured Layouts
 *    - Blue/Cyan technical accents
 *    - Blueprint grid feel
 * 
 * 2. TRUST PRINCIPLES (Verified Engineering)
 *    - Never hide assumptions
 *    - Clear input/output separation
 * ─────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
    AlertTriangle, Info, BookOpen, ExternalLink, 
    ChevronDown, ChevronUp, Settings2, Zap, Ruler 
} from 'lucide-react';
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
    schema: CalculatorSchema | CalculatorSchemaV2;
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
// Styles (PREMIUM WORKSTATION UPGRADE)
// ============================================

const styles = {
    container: `
        w-full h-full flex flex-col font-mono text-sm
        bg-[#03060a] text-white overflow-hidden
    `,
    mainWrapper: `
        flex flex-1 overflow-hidden p-4 gap-4
    `,
    leftPane: `
        w-[38%] h-full flex flex-col bg-[#0b121d]/80 rounded-[28px] border border-white/5 backdrop-blur-3xl px-6 py-6 overflow-y-auto custom-scrollbar shadow-2xl
    `,
    rightPane: `
        w-[62%] h-full flex flex-col bg-gradient-to-b from-[#0a1018] to-black rounded-[32px] border border-white/5 relative overflow-hidden shadow-2xl
    `,
    gridOverlay: `
        absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none
    `,
    header: `
        flex items-center gap-3 mb-8 pb-4 border-b border-white/5
    `,
    title: `
        text-xl font-bold tracking-tight text-gray-100
    `,
    domain: `
        text-[10px] text-blue-400/70 font-semibold uppercase tracking-[0.2em] mt-0.5
    `,
    section: `
        space-y-6 mb-8
    `,
    sectionTitle: `
        text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2
    `,
    inputGrid: `
        grid gap-6
    `,
    inputGroup: `
        flex flex-col gap-2 relative group
    `,
    inputLabel: `
        text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 group-focus-within:text-white transition-colors flex justify-between
    `,
    inputWrapper: `
        relative flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all duration-300 group-focus-within:border-blue-500/50 group-focus-within:shadow-[0_0_20px_rgba(59,130,246,0.05)]
    `,
    input: `
        w-full bg-transparent text-sm font-black font-mono px-4 py-2.5 text-white outline-none appearance-none
    `,
    inputError: `
        !border-red-500/30 !bg-red-500/5
    `,
    inputUnit: `
        absolute right-4 text-xs font-black font-mono text-gray-500
    `,
    outputGrid: `
        grid grid-cols-2 md:grid-cols-3 gap-4 p-6 relative z-10
    `,
    kpiCard: `
        bg-[#0b121d]/80 rounded-2xl border border-white/5 p-4 flex flex-col gap-1 shadow-lg backdrop-blur-xl hover:border-blue-500/30 transition-all group/kpi
    `,
    kpiLabel: `
        text-[9px] font-bold text-gray-500 uppercase tracking-widest group-hover/kpi:text-blue-400 transition-colors
    `,
    kpiValue: `
        text-2xl font-black font-mono tracking-tighter text-blue-400 tabular-nums
    `,
    kpiUnit: `
        text-[10px] font-bold text-gray-600 uppercase ml-1
    `,
    warning: `
        flex items-start gap-2 px-4 py-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-amber-500/80 text-[10px] uppercase font-bold
    `,
    collapsible: `
        cursor-pointer select-none hover:bg-white/5 transition-all p-3 rounded-xl border border-white/5 mt-4 flex items-center justify-between
    `,
};

// ============================================
// Sub-Components
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
    const [localValue, setLocalValue] = useState(formula || value);

    useEffect(() => {
        if (!isFormula) setLocalValue(value);
    }, [value, isFormula]);

    useEffect(() => {
        if (formula) {
            setIsFormula(true);
            setLocalValue(formula);
        }
    }, [formula]);

    const isOptionsField = !!field.options;
    const isNumericInput = !isOptionsField;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setLocalValue(raw);

        if (isNumericInput && raw.startsWith('=')) {
            setIsFormula(true);
            const varName = raw.substring(1).trim();
            const resolved = getVariableValue(varName);
            if (resolved !== undefined) {
                onChange(field.key, resolved);
                if (onFormulaChange) onFormulaChange(field.key, raw);
            } else {
                if (onFormulaChange) onFormulaChange(field.key, raw);
            }
            return;
        }

        if (isFormula && !raw.startsWith('=')) {
            setIsFormula(false);
            if (onFormulaChange) onFormulaChange(field.key, null);
        }

        if (isNumericInput) {
            const val = parseFloat(raw);
            if (raw === '' || raw === '-') {
                onChange(field.key, raw);
                return;
            }
            if (!isNaN(val)) onChange(field.key, val);
        } else {
            onChange(field.key, raw);
        }
    };

    const resolvedLabel = (t.calcCommon as any)?.[field.key]?.label || (field as any).label || field.name;
    const resolvedDesc = (t.calcCommon as any)?.[field.key]?.desc || (field as any).description || '';

    if (isOptionsField && field.options) {
        return (
            <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                    <span>{resolvedLabel}</span>
                    {resolvedDesc && <Info size={12} className="cursor-help text-gray-600" />}
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
                        className={`${styles.input} ${error ? styles.inputError : ''} bg-white/5 border border-white/10 rounded-xl appearance-none pr-10 cursor-pointer`}
                        title={resolvedDesc}
                    >
                        {field.options.map(opt => (
                            <option key={opt.value} value={opt.value} className="bg-[#0b121d]">{opt.label}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
                <span>{resolvedLabel}</span>
                {resolvedDesc && <Info size={12} className="cursor-help text-gray-600" />}
            </label>
            <div className={styles.inputWrapper}>
                <input
                    type={isFormula ? "text" : "number"}
                    value={isFormula ? localValue : value}
                    onChange={handleChange}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    className={`${styles.input} ${error ? styles.inputError : ''} pr-12`}
                    title={resolvedDesc}
                />
                <span className={styles.inputUnit}>{field.unit}</span>
            </div>
            {error && <div className="text-red-400 text-[10px] uppercase font-bold mt-1 pl-1">{error}</div>}
        </div>
    );
};

interface CalcOutputProps {
    field: OutputField;
    value: number | null;
    warning?: ValidationWarning;
}

const KPIResult: React.FC<CalcOutputProps> = ({ field, value, warning }) => {
    const formattedValue = (value !== null && value !== undefined && !isNaN(value))
        ? value.toFixed(field.precision ?? 2)
        : '—';
    
    const color = warning ? '#f59e0b' : '#3d86f5';
    const label = (field as any).label || field.name;

    return (
        <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>{label}</span>
            <div className="flex items-baseline">
                <span className={`${styles.kpiValue}`} style={{ color }}>
                    {formattedValue}
                </span>
                <span className={styles.kpiUnit}>{field.unit}</span>
            </div>
            {warning && <div className="text-[8px] text-amber-500/60 font-bold uppercase mt-1 truncate">{warning.message}</div>}
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
}) => {
    // CRITICAL: Schema null-check to prevent crash
    if (!schema || !schema.inputs) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500 font-mono text-[10px]">
                <Zap size={20} className="animate-pulse mr-2" />
                INITIALIZING SCHEME UNIT...
            </div>
        );
    }

    const defaultValues = useMemo(() => {
        const defaults: Record<string, number | string | boolean | null> = {};
        schema.inputs.forEach(input => {
            const defVal = (input as any).defaultValue ?? (input as any).default ?? (input.options ? input.options[0].value : 0);
            defaults[input.key] = initialValues?.[input.key] ?? defVal;
        });
        return defaults;
    }, [schema, initialValues]);

    const [inputValues, setInputValues] = useState<Record<string, number | string>>(defaultValues as any);
    const [inputErrors, setInputErrors] = useState<Record<string, string>>({});
    const [assumptionsOpen, setAssumptionsOpen] = useState(false);
    const [is3DMode, setIs3DMode] = useState(false);

    const { t } = useI18nStore();
    const translatedTitle = t.modules[schema.id]?.title || schema.metadata.title;
    const translatedCategory = (t.categories as any)[(schema as any).metadata?.category] || (schema as any).metadata?.category || 'ENGINEERING';

    useEffect(() => {
        if (initialValues) setInputValues(prev => ({ ...prev, ...initialValues }));
    }, [initialValues]);

    const validateInput = useCallback((field: InputField, value: number | string): string | null => {
        if (typeof value === 'number') {
            if (isNaN(value)) return 'Invalid number';
            if (field.min !== undefined && value < field.min) return `Min: ${field.min}`;
            if (field.max !== undefined && value > field.max) return `Max: ${field.max}`;
        }
        return null;
    }, []);

    const handleInputChange = useCallback((key: string, value: number | string) => {
        const field = schema.inputs.find(i => i.key === key);
        if (!field) return;

        const error = validateInput(field as any, value);
        const nextValues = { ...inputValues, [key]: value };

        // Quick selects
        if (key === 'bolt_size' && typeof value === 'string') {
            const bolt = METRIC_BOLTS.find(b => b.id === value);
            if (bolt) {
                const map = { 'diameter': bolt.d, 'd': bolt.d, 'pitch': bolt.p, 'p': bolt.p, 'head_height': bolt.k, 'k': bolt.k, 'hex_width': bolt.s, 's': bolt.s };
                Object.entries(map).forEach(([tk, tv]) => { if (schema.inputs.some(i => i.key === tk)) nextValues[tk] = tv; });
            }
        }

        setInputValues(nextValues);
        setInputErrors(prev => {
            if (error) return { ...prev, [key]: error };
            const { [key]: _, ...rest } = prev;
            return rest;
        });
        onValuesChange?.(nextValues as any);
    }, [schema, inputValues, validateInput, onValuesChange]);

    const computedOutputs = useMemo(() => {
        const outputs: Record<string, number | null> = {};
        const warnings: Record<string, ValidationWarning> = {};

        if (isSchemaV2(schema)) {
            try {
                const validatedInputs: Record<string, ValidatedEngineeringValue> = {};
                schema.inputs.forEach(input => {
                    let raw = inputValues[input.key] ?? (input as any).defaultValue;
                    validatedInputs[input.key] = createValidatedValue(raw as any, input.unit, 'user');
                });
                const result = schema.calculationEngine(validatedInputs);
                if (result) {
                    Object.entries(result.outputs).forEach(([k, v]) => { outputs[k] = v.value; });
                    result.warnings?.forEach(w => { warnings[w.field] = { field: w.field, message: w.message, value: 0, threshold: 'min' }; });
                }
            } catch (e) { console.error(e); }
        } else {
            const context: Record<string, number> = {};
            Object.entries(inputValues).forEach(([k, v]) => context[k] = typeof v === 'number' ? v : 0);
            schema.outputs.forEach(out => {
                const f = (out as any).formula;
                if (!f) return;
                const r = evaluateFormula(f, context);
                if (typeof r === 'number') { outputs[out.key] = r; context[out.key] = r; }
            });
        }
        return { outputs, warnings };
    }, [schema, inputValues]);

    useEffect(() => {
        const valid: Record<string, number> = {};
        Object.entries(computedOutputs.outputs).forEach(([k, v]) => { if (v !== null) valid[k] = v; });
        onOutputsChange?.(valid);
    }, [computedOutputs.outputs]);

    const hasVisualizer = isSchemaV2(schema) ? schema.visualization.type !== 'none' : !!(schema as any).visualizer;
    const assumptions = isSchemaV2(schema) ? (schema.documentation?.assumptions || []) : (schema as any).assumptions || [];

    if (schema.id === 'beam-frame-fea') {
        return (
            <div className="absolute inset-0 bg-[#020305] font-mono text-xs z-0">
                <div className="absolute top-4 right-20 z-10 flex items-center gap-2">
                    <button onClick={() => setIs3DMode(!is3DMode)} className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded text-white text-[10px]">
                        {is3DMode ? '2D MODE' : '3D MODE'}
                    </button>
                </div>
                {is3DMode ? <BeamCanvas3D /> : <BeamCanvas />}
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.mainWrapper}>
                <div className={styles.leftPane}>
                    <div className={styles.header}>
                        <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <h2 className={styles.title}>{translatedTitle}</h2>
                            <p className={styles.domain}>{translatedCategory}</p>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionTitle}><Settings2 size={14} className="text-blue-500" /><span>{t.parametersTitle || "ENGINEERING PARAMETERS"}</span></div>
                        <div className={styles.inputGrid}>
                            {schema.inputs.map((field: any) => (
                                <CalcInput key={field.key} field={field} value={inputValues[field.key] ?? ''} formula={formulas?.[field.key]} onChange={handleInputChange} onFormulaChange={onFormulaChange} error={inputErrors[field.key]} />
                            ))}
                        </div>
                    </div>

                    {assumptions.length > 0 && (
                        <>
                            <div className={styles.collapsible} onClick={() => setAssumptionsOpen(!assumptionsOpen)}>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase"><Info size={12} /><span>{t.assumptionsTitle || "ASSUMPTIONS"}</span></div>
                                {assumptionsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                            {assumptionsOpen && <div className="mt-4 space-y-3 px-2"> {assumptions.map((a: any) => (<div key={a.id} className="text-[10px] text-gray-400 leading-relaxed border-l-2 border-blue-500/20 pl-3">{a.text}</div>))} </div>}
                        </>
                    )}
                </div>

                <div className={styles.rightPane}>
                    <div className={styles.gridOverlay} />
                    <div className="flex-1 relative flex flex-col">
                        <div className="absolute top-6 left-6 z-10 flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.3em]"><Zap size={14} className="text-blue-500" />Technical Visualizer</div>
                        {hasVisualizer ? (
                            <div className="w-full h-full flex items-center justify-center p-8">
                                <CalculatorVisualizer schema={schema as any} inputs={inputValues as any} outputs={computedOutputs.outputs as Record<string, number>} />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-10"><BookOpen size={120} className="text-blue-500" /></div>
                        )}
                    </div>

                    <div className="bg-[#0b121d]/40 backdrop-blur-xl border-t border-white/5">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Engineering Results</span>
                            {Object.keys(inputErrors).length > 0 && <span className="text-[10px] font-black text-red-500 uppercase flex items-center gap-2"><AlertTriangle size={12} /> Errors Found</span>}
                        </div>
                        <div className={styles.outputGrid}>
                            {schema.outputs.map((field: any) => (
                                <KPIResult key={field.key} field={field} value={computedOutputs.outputs[field.key] as any} warning={computedOutputs.warnings[field.key]} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
