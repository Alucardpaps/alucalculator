/**
 * AluCalculator V2 — Material Selector Component
 * 
 * Reusable dropdown for all calculators requiring material selection.
 * Pulls from centralized MATERIALS_DB for strength calculations.
 */

'use client';

import React, { useMemo } from 'react';
import { MATERIALS_DB, MaterialProp, getMaterialCategories } from '@/data/materialsData';
import { usePersistedState } from '@/hooks/useUserPreferences';

interface MaterialSelectorProps {
    value: string;
    onChange: (material: MaterialProp) => void;
    category?: string; // Filter by category (e.g., 'Steel', 'Aluminum')
    showProperties?: boolean; // Show inline properties
    label?: string;
    className?: string;
}

export function MaterialSelector({
    value,
    onChange,
    category,
    showProperties = true,
    label = 'Material',
    className = ''
}: MaterialSelectorProps) {
    const categories = useMemo(() => getMaterialCategories(), []);

    const filteredMaterials = useMemo(() => {
        if (category) {
            return MATERIALS_DB.filter(m => m.category === category);
        }
        return MATERIALS_DB;
    }, [category]);

    const selectedMaterial = useMemo(() =>
        MATERIALS_DB.find(m => m.name === value),
        [value]
    );

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const mat = MATERIALS_DB.find(m => m.name === e.target.value);
        if (mat) onChange(mat);
    };

    // Group materials by category for better UX
    const groupedMaterials = useMemo(() => {
        const groups: Record<string, MaterialProp[]> = {};
        filteredMaterials.forEach(m => {
            if (!groups[m.category]) groups[m.category] = [];
            groups[m.category].push(m);
        });
        return groups;
    }, [filteredMaterials]);

    return (
        <div className={`material-selector ${className}`}>
            <label className="selector-label">{label}</label>

            <select
                value={value}
                onChange={handleChange}
                className="selector-dropdown"
            >
                <option value="">-- Select Material --</option>
                {Object.entries(groupedMaterials).map(([cat, mats]) => (
                    <optgroup key={cat} label={cat}>
                        {mats.map(m => (
                            <option key={m.name} value={m.name}>
                                {m.name}
                            </option>
                        ))}
                    </optgroup>
                ))}
            </select>

            {/* Inline Property Display */}
            {showProperties && selectedMaterial && (
                <div className="material-properties">
                    <div className="prop-row">
                        <span className="prop-label">σ_y</span>
                        <span className="prop-value">{selectedMaterial.yield} MPa</span>
                    </div>
                    <div className="prop-row">
                        <span className="prop-label">σ_u</span>
                        <span className="prop-value">{selectedMaterial.tensile} MPa</span>
                    </div>
                    <div className="prop-row">
                        <span className="prop-label">E</span>
                        <span className="prop-value">{selectedMaterial.youngsModulus} GPa</span>
                    </div>
                    <div className="prop-row">
                        <span className="prop-label">ρ</span>
                        <span className="prop-value">{selectedMaterial.density} g/cm³</span>
                    </div>
                </div>
            )}

            <style jsx>{`
        .material-selector {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .selector-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted, #888);
        }
        
        .selector-dropdown {
          width: 100%;
          padding: 10px 12px;
          background: var(--surface-1, #0f0f1a);
          border: 1px solid var(--border, #2a2a4a);
          border-radius: 6px;
          color: var(--text-primary, #fff);
          font-size: 13px;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        
        .selector-dropdown:hover {
          border-color: var(--accent, #00e5ff);
        }
        
        .selector-dropdown:focus {
          outline: none;
          border-color: var(--accent, #00e5ff);
          box-shadow: 0 0 0 2px rgba(0, 229, 255, 0.1);
        }
        
        .selector-dropdown optgroup {
          font-weight: 600;
          color: var(--accent, #00e5ff);
        }
        
        .selector-dropdown option {
          background: var(--surface-1, #0f0f1a);
          color: var(--text-primary, #fff);
          padding: 8px;
        }
        
        .material-properties {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
          padding: 10px;
          background: var(--surface-2, #1a1a2e);
          border-radius: 6px;
          border: 1px solid var(--border, #2a2a4a);
        }
        
        .prop-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 8px;
          background: var(--surface-1, #0f0f1a);
          border-radius: 4px;
        }
        
        .prop-label {
          font-size: 11px;
          font-family: 'Fira Code', monospace;
          color: var(--accent, #00e5ff);
        }
        
        .prop-value {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-primary, #fff);
        }
      `}</style>
        </div>
    );
}

// ============================================
// HOOK: useMaterial
// ============================================

export interface MaterialState {
    material: MaterialProp | null;
    setMaterial: (name: string) => void;
    yieldStrength: number;
    tensileStrength: number;
    youngsModulus: number;
    density: number;
    poissonsRatio: number;
    allowableStress: (safetyFactor?: number) => number;
}

export function useMaterial(initialMaterial?: string): MaterialState {
    const [materialName, setMaterialName] = usePersistedState('selectedMaterial', initialMaterial || '6061-T6 (US Standard)');

    const material = useMemo(() =>
        MATERIALS_DB.find(m => m.name === materialName) || null,
        [materialName]
    );

    const setMaterial = React.useCallback((name: string) => {
        setMaterialName(name);
    }, []);

    return {
        material,
        setMaterial,
        yieldStrength: material?.yield || 0,
        tensileStrength: material?.tensile || 0,
        youngsModulus: material?.youngsModulus || 0,
        density: material?.density || 0,
        poissonsRatio: material?.poissonsRatio || 0,
        allowableStress: (sf = 2) => (material?.yield || 0) / sf,
    };
}

// ============================================
// STRENGTH CALCULATOR UTILITIES
// ============================================

export interface StrengthResult {
    appliedStress: number; // MPa
    allowableStress: number; // MPa
    safetyFactor: number;
    utilization: number; // %
    status: 'safe' | 'marginal' | 'unsafe';
    message: string;
}

export function calculateStrength(
    material: MaterialProp,
    appliedStress: number,
    designSafetyFactor: number = 2.0
): StrengthResult {
    const allowable = material.yield / designSafetyFactor;
    const sf = material.yield / appliedStress;
    const util = (appliedStress / allowable) * 100;

    let status: StrengthResult['status'];
    let message: string;

    if (sf >= designSafetyFactor * 1.5) {
        status = 'safe';
        message = `Design is safe. SF = ${sf.toFixed(2)} ≥ ${(designSafetyFactor * 1.5).toFixed(1)} required.`;
    } else if (sf >= designSafetyFactor) {
        status = 'marginal';
        message = `Design is marginal. SF = ${sf.toFixed(2)} meets minimum ${designSafetyFactor.toFixed(1)}.`;
    } else {
        status = 'unsafe';
        message = `UNSAFE! SF = ${sf.toFixed(2)} < ${designSafetyFactor.toFixed(1)} required. Increase section or use stronger material.`;
    }

    return {
        appliedStress,
        allowableStress: allowable,
        safetyFactor: sf,
        utilization: util,
        status,
        message,
    };
}

// Quick check for bolt stress
export function checkBoltStrength(
    material: MaterialProp,
    tensileLoad: number, // N
    stressArea: number, // mm²
    designSF: number = 2.5
): StrengthResult {
    const stress = tensileLoad / stressArea;
    return calculateStrength(material, stress, designSF);
}

// Quick check for beam bending
export function checkBeamStrength(
    material: MaterialProp,
    bendingMoment: number, // N·mm
    sectionModulus: number, // mm³
    designSF: number = 2.0
): StrengthResult {
    const stress = bendingMoment / sectionModulus;
    return calculateStrength(material, stress, designSF);
}

// Quick check for weld strength
export function checkWeldStrength(
    material: MaterialProp,
    force: number, // N
    weldArea: number, // mm²
    jointEfficiency: number = 0.7,
    designSF: number = 3.0
): StrengthResult {
    const stress = force / (weldArea * jointEfficiency);
    return calculateStrength(material, stress, designSF);
}

export default MaterialSelector;
