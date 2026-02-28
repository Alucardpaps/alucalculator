import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProjectVariable {
    id: string;
    name: string;
    value: number;
    unit?: string;
    description?: string;
}

interface ProjectState {
    name: string;
    variables: ProjectVariable[];

    setName: (name: string) => void;
    addVariable: (variable: Omit<ProjectVariable, 'id'>) => void;
    updateVariable: (id: string, updates: Partial<ProjectVariable>) => void;
    removeVariable: (id: string) => void;
    getVariableValue: (name: string) => number | undefined;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set, get) => ({
            name: 'Untitled Project',
            variables: [
                { id: 'default-1', name: 'SafetyFactor', value: 1.5, unit: '', description: 'Global safety factor' },
                { id: 'default-2', name: 'Density_Steel', value: 7.85, unit: 'g/cm3', description: 'Standard steel density' }
            ],

            setName: (name) => set({ name }),

            addVariable: (variable) => set((state) => ({
                variables: [...state.variables, { ...variable, id: crypto.randomUUID() }]
            })),

            updateVariable: (id, updates) => set((state) => ({
                variables: state.variables.map((v) =>
                    v.id === id ? { ...v, ...updates } : v
                )
            })),

            removeVariable: (id) => set((state) => ({
                variables: state.variables.filter((v) => v.id !== id)
            })),

            getVariableValue: (name) => {
                const v = get().variables.find(v => v.name === name);
                return v ? v.value : undefined;
            }
        }),
        {
            name: 'alucalc-project-storage',
            version: 1
        }
    )
);
