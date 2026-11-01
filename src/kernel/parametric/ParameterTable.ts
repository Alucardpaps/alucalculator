/**
 * Parametric Table Kernel
 *
 * Grounded in: "CAD IS TRUTH, UI must never influence math."
 * Manages named engineering parameters, units, bounds, formulas, and standard references.
 */

export type ParamUnit = 'mm' | 'deg' | 'rad' | 'N' | 'Nm' | 'kg' | 'count';

export interface ParameterDef {
  name: string;
  value: number;
  unit: ParamUnit;
  min?: number;
  max?: number;
  description?: string;
  standardRef?: string;
  expression?: string; // Optional driving formula, e.g. "W / 2"
}

export class ParameterTable {
  private params: Map<string, ParameterDef> = new Map();
  private listeners: Set<(name: string, value: number) => void> = new Set();

  constructor(initial?: ParameterDef[]) {
    if (initial) {
      for (const p of initial) {
        this.define(p);
      }
    }
  }

  /**
   * Define or overwrite a parameter with strict boundary checking.
   */
  public define(def: ParameterDef): void {
    if (def.min !== undefined && def.value < def.min) {
      throw new Error(`Parameter '${def.name}' value ${def.value} is below minimum ${def.min} ${def.unit}`);
    }
    if (def.max !== undefined && def.value > def.max) {
      throw new Error(`Parameter '${def.name}' value ${def.value} exceeds maximum ${def.max} ${def.unit}`);
    }
    this.params.set(def.name, { ...def });
    this.notify(def.name, def.value);
  }

  /**
   * Sets numeric value of an existing parameter.
   */
  public setValue(name: string, value: number): void {
    const existing = this.params.get(name);
    if (!existing) {
      this.define({
        name,
        value,
        unit: 'mm',
      });
      return;
    }

    if (existing.min !== undefined && value < existing.min) {
      throw new Error(`Parameter '${name}' value ${value} is below minimum ${existing.min} ${existing.unit}`);
    }
    if (existing.max !== undefined && value > existing.max) {
      throw new Error(`Parameter '${name}' value ${value} exceeds maximum ${existing.max} ${existing.unit}`);
    }

    if (existing.value !== value) {
      existing.value = value;
      this.notify(name, value);
    }
  }

  /**
   * Gets parameter value or undefined.
   */
  public getValue(name: string): number | undefined {
    return this.params.get(name)?.value;
  }

  /**
   * Gets full parameter definition.
   */
  public get(name: string): ParameterDef | undefined {
    const p = this.params.get(name);
    return p ? { ...p } : undefined;
  }

  /**
   * Checks if parameter exists.
   */
  public has(name: string): boolean {
    return this.params.has(name);
  }

  /**
   * Deletes a parameter.
   */
  public delete(name: string): boolean {
    return this.params.delete(name);
  }

  /**
   * Evaluates a mathematical expression referencing named parameters.
   * e.g. "W / 2 + R_hole" or "sin(angle) * radius"
   */
  public evaluate(expr: string): number {
    const trimmed = expr.trim();
    const num = Number(trimmed);
    if (!Number.isNaN(num)) return num;

    // Replace parameter keys with numeric values
    let evaluatedExpr = trimmed;
    // Sort keys by descending length to prevent sub-string collision (e.g. W_flange vs W)
    const sortedKeys = Array.from(this.params.keys()).sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      const val = this.params.get(key)!.value;
      evaluatedExpr = evaluatedExpr.replace(regex, val.toString());
    }

    // Safe mathematical evaluator
    // Only allows numbers, basic operators, and Math functions
    const sanitized = evaluatedExpr
      .replace(/pi/gi, Math.PI.toString())
      .replace(/sin/gi, 'Math.sin')
      .replace(/cos/gi, 'Math.cos')
      .replace(/sqrt/gi, 'Math.sqrt')
      .replace(/abs/gi, 'Math.abs');

    try {
      // eslint-disable-next-line no-new-func
      const result = new Function(`"use strict"; return (${sanitized});`)();
      if (typeof result === 'number' && !Number.isNaN(result)) {
        return result;
      }
      throw new Error(`Expression evaluated to invalid number: ${expr}`);
    } catch (err: any) {
      throw new Error(`Failed to evaluate expression '${expr}': ${err.message}`);
    }
  }

  /**
   * Subscribes to parameter changes.
   */
  public subscribe(fn: (name: string, value: number) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(name: string, value: number): void {
    for (const listener of this.listeners) {
      listener(name, value);
    }
  }

  public toArray(): ParameterDef[] {
    return Array.from(this.params.values()).map((p) => ({ ...p }));
  }

  public clone(): ParameterTable {
    return new ParameterTable(this.toArray());
  }
}
