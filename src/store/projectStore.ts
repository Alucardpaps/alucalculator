import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProjectItem {
    id: string;
    name: string;
    category: string;
    material: string;
    quantity: number;
    weightPerUnit: number;
    costPerUnit: number;
    totalWeight: number;
    totalCost: number;
    timestamp: number;
}

export interface ProjectVariable {
    id: string;
    name: string;
    value: number;
    unit: string;
    description: string;
}

export interface ProjectState {
    items: ProjectItem[];
    addItem: (item: Omit<ProjectItem, 'id' | 'timestamp' | 'totalWeight' | 'totalCost'>) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, qty: number) => void;
    clearProject: () => void;
    getTotalWeight: () => number;
    getTotalCost: () => number;

    variables: ProjectVariable[];
    addVariable: (variable: Omit<ProjectVariable, 'id'>) => void;
    updateVariable: (id: string, updates: Partial<ProjectVariable>) => void;
    removeVariable: (id: string) => void;
    getVariableValue: (name: string) => number | undefined;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item) => set((state) => {
                const id = Math.random().toString(36).substring(2, 9);
                const newItem: ProjectItem = {
                    ...item,
                    id,
                    timestamp: Date.now(),
                    totalWeight: item.weightPerUnit * item.quantity,
                    totalCost: item.costPerUnit * item.quantity,
                };
                return { items: [...state.items, newItem] };
            }),
            removeItem: (id) => set((state) => ({
                items: state.items.filter((i) => i.id !== id),
            })),
            updateQuantity: (id, qty) => set((state) => ({
                items: state.items.map((i) =>
                    i.id === id ? { ...i, quantity: qty, totalWeight: i.weightPerUnit * qty, totalCost: i.costPerUnit * qty } : i
                ),
            })),
            clearProject: () => set({ items: [] }),
            getTotalWeight: () => get().items.reduce((sum, item) => sum + item.totalWeight, 0),
            getTotalCost: () => get().items.reduce((sum, item) => sum + item.totalCost, 0),

            variables: [],
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
            name: 'alucalc-project-storage',
        }
    )
);
