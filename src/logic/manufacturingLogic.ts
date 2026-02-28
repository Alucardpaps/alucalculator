/**
 * Advanced Manufacturing Logic
 * Physics-based simulation of cumulative material properties
 */

import { MaterialProp } from '@/data/materialsData';
import { HeatTreatmentEffect, SurfaceCoating } from '@/data/manufacturingData';

export interface MaterialState {
    yield: number;
    tensile: number;
    hardness: number; // Base HB value
    modulus: number;
    elongation: number;
    strainHardening: number;
    strengthCoeff: number;
    carbonContent: number;
    surfaceCarbonOffset: number;
    isQuenched: boolean;
    appliedProcesses: string[];
    label: string;
    handbookSectionId?: string;
}

export const convertHBtoHRC = (hb: number): string => {
    if (hb < 240) return `${Math.round(hb)} HB`;
    const hrc = Math.round((hb - 100) / 8.5);
    return `${hrc} HRC`;
};

export const getInitialState = (material: MaterialProp): MaterialState => {
    return {
        yield: material.yield,
        tensile: material.tensile,
        hardness: parseFloat(material.hardness.replace(/[^0-9.]/g, '')) || 150,
        modulus: material.youngsModulus || 205,
        elongation: 20, // Default assume
        strainHardening: 0.2,
        strengthCoeff: 800,
        carbonContent: material.carbonContent || 0,
        surfaceCarbonOffset: 0,
        isQuenched: false,
        appliedProcesses: ['Raw'],
        label: `${material.name} (Raw)`
    };
};

export const applyProcess = (state: MaterialState, process: HeatTreatmentEffect | any): MaterialState => {
    const newState = { ...state };
    newState.appliedProcesses = [...state.appliedProcesses, process.method];
    newState.label = `${state.label.split(' + ')[0]} + ${process.method}`;
    newState.handbookSectionId = process.handbookSectionId || state.handbookSectionId;

    const method = process.method.toLowerCase();
    const temp = parseInt(process.temperature) || 0;

    // Reset logic (Annealing)
    if (method.includes('anneal')) {
        newState.isQuenched = false;
        newState.surfaceCarbonOffset = 0;
        newState.hardness = state.hardness * 0.8; // Soften
        newState.yield = state.yield * 0.7;
        newState.tensile = state.tensile * 0.8;
        newState.elongation = 30;
        newState.strainHardening = 0.25;
        newState.strengthCoeff *= 0.8;
        return newState;
    }

    // Normalizing
    if (method.includes('normalizing')) {
        newState.isQuenched = false;
        newState.hardness = state.hardness * 1.1;
        newState.yield = state.yield * 1.1;
        newState.tensile = state.tensile * 1.1;
        newState.elongation = 22;
        return newState;
    }

    // Carburizing (Sementasyon)
    if (method.includes('sement') || method.includes('carbur')) {
        newState.surfaceCarbonOffset += 0.6; // High surface carbon
        return newState;
    }

    // Quenching
    if (method.includes('quench') || method.includes('harden')) {
        const effectiveCarbon = state.carbonContent + newState.surfaceCarbonOffset;
        if (effectiveCarbon > 0.2) {
            newState.isQuenched = true;
            // Max hardness scales with carbon
            const maxHardness = 200 + (effectiveCarbon * 800);
            newState.hardness = Math.max(state.hardness, maxHardness);
            newState.yield = newState.hardness * 2.5;
            newState.tensile = newState.hardness * 3.2;
            newState.elongation = 5;
            newState.strainHardening = 0.05;
            newState.strengthCoeff = newState.tensile * 1.5;
        }
        return newState;
    }

    // Tempering
    if (method.includes('temper') && state.isQuenched) {
        // Tempering reduces hardness based on temp
        // 200C -> slight reduction, 600C -> significant reduction
        const dropFactor = Math.min(0.5, (temp / 1000));
        newState.hardness = state.hardness * (1 - dropFactor);
        newState.yield = state.yield * (1 - dropFactor * 0.8);
        newState.tensile = state.tensile * (1 - dropFactor * 0.7);
        newState.elongation = 5 + (temp / 20);
        newState.strainHardening = 0.05 + (temp / 4000);
        return newState;
    }

    // Induction
    if (method.includes('induction')) {
        const effectiveCarbon = state.carbonContent + newState.surfaceCarbonOffset;
        if (effectiveCarbon > 0.3) {
            // Localized high hardness
            newState.hardness = Math.max(state.hardness, 500);
            newState.isQuenched = true;
        }
        return newState;
    }

    return newState;
};
