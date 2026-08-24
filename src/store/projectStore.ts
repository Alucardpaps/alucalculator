import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * PROJECT PERSISTENCE ENGINE v5.0
 * The Memory of AluCalc OS
 */

export interface CalculationSnapshot {
    schemaId: string;
    schemaVersion: string;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    title: string;
}

export interface ProjectItem {
    id: string;
    name: string;
    type: 'part' | 'calculation';
    snapshot?: CalculationSnapshot;
    parentId?: string; // For sub-assembly hierarchy
    quantity: number;
    weightPerUnit: number;
    costPerUnit: number;
    totalWeight: number;
    totalCost: number;
    timestamp: number;
    status?: 'success' | 'warning' | 'critical';
    material?: string;
    category?: string;
}

export interface ProjectVariable {
    id: string;
    name: string;
    value: number;
    unit: string;
    description: string;
}

export interface ProjectState {
    projectName: string;
    items: ProjectItem[];
    variables: ProjectVariable[];
    
    // Project Management
    setProjectName: (name: string) => void;
    clearProject: () => void;

    // Item Management
    addItem: (item: Omit<ProjectItem, 'id' | 'timestamp' | 'totalWeight' | 'totalCost'>) => string;
    addCalculation: (name: string, snapshot: CalculationSnapshot, status?: ProjectItem['status']) => string;
    removeItem: (id: string) => void;
    updateItem: (id: string, updates: Partial<ProjectItem>) => void;
    
    // Hierarchy Management
    setParent: (id: string, parentId: string | undefined) => void;

    // Utility
    getTotalWeight: () => number;
    getTotalCost: () => number;

    // Global Variables (Parametric Design)
    addVariable: (variable: Omit<ProjectVariable, 'id'>) => void;
    updateVariable: (id: string, updates: Partial<ProjectVariable>) => void;
    removeVariable: (id: string) => void;
    getVariableValue: (name: string) => number | undefined;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set, get) => ({
            projectName: 'New Project',
            items: [],
            variables: [],

            setProjectName: (name) => set({ projectName: name }),
            
            clearProject: () => set({ items: [], variables: [], projectName: 'New Project' }),

            addItem: (item) => {
                const id = Math.random().toString(36).substring(2, 9);
                const newItem: ProjectItem = {
                    ...item,
                    id,
                    timestamp: Date.now(),
                    totalWeight: item.weightPerUnit * item.quantity,
                    totalCost: item.costPerUnit * item.quantity,
                };
                set((state) => ({ items: [...state.items, newItem] }));
                return id;
            },

            addCalculation: (name, snapshot, status = 'success') => {
                const id = Math.random().toString(36).substring(2, 9);
                const newItem: ProjectItem = {
                    id,
                    name,
                    type: 'calculation',
                    snapshot,
                    quantity: 1,
                    weightPerUnit: 0,
                    costPerUnit: 0,
                    totalWeight: 0,
                    totalCost: 0,
                    timestamp: Date.now(),
                    status
                };
                set((state) => ({ items: [...state.items, newItem] }));
                return id;
            },

            removeItem: (id) => set((state) => ({
                items: state.items.filter((i) => i.id !== id),
            })),

            updateItem: (id, updates) => set((state) => ({
                items: state.items.map((i) => {
                    if (i.id !== id) return i;
                    const merged = { ...i, ...updates };
                    return {
                        ...merged,
                        totalWeight: merged.weightPerUnit * merged.quantity,
                        totalCost: merged.costPerUnit * merged.quantity,
                    };
                }),
            })),

            setParent: (id, parentId) => set((state) => ({
                items: state.items.map(i => i.id === id ? { ...i, parentId } : i)
            })),

            getTotalWeight: () => get().items.reduce((sum, item) => sum + item.totalWeight, 0),
            getTotalCost: () => get().items.reduce((sum, item) => sum + item.totalCost, 0),

            addVariable: (v) => set((state) => ({
                variables: [...state.variables, { ...v, id: Math.random().toString(36).substring(2, 9) }]
            })),

            updateVariable: (id, updates) => set((state) => ({
                variables: state.variables.map(v => v.id === id ? { ...v, ...updates } : v)
            })),

            removeVariable: (id) => set((state) => ({
                variables: state.variables.filter(v => v.id !== id)
            })),

            getVariableValue: (name) => {
                const v = get().variables.find(v => v.name === name);
                return v?.value;
            },
        }),
        {
            name: 'alucalc-project-storage-v2', // Upgraded schema
        }
    )
);
