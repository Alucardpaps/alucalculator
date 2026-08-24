import { create } from 'zustand';

// Parça veri modeli
export interface Part {
    id: string;
    name: string;
    material: string;
    quantity: number;
    weightKg: number; // Tekil ağırlık
    unitCost: number; // Tekil maliyet
}

interface BomStore {
    parts: Part[];
    addPart: (part: Omit<Part, 'id'>) => void;
    updatePart: (id: string, updates: Partial<Part>) => void;
    removePart: (id: string) => void;
    clearBom: () => void;
}

export const useBomStore = create<BomStore>((set) => ({
    parts: [],

    addPart: (part) => set((state) => ({
        parts: [...state.parts, { ...part, id: crypto.randomUUID() }]
    })),

    updatePart: (id, updates) => set((state) => ({
        parts: state.parts.map(p => p.id === id ? { ...p, ...updates } : p)
    })),

    removePart: (id) => set((state) => ({
        parts: state.parts.filter(p => p.id !== id)
    })),

    clearBom: () => set({ parts: [] })
}));

// Türetilmiş veriler (Computed Properties) için Custom Hook'lar
export const useTotalWeight = () => {
    const parts = useBomStore((state) => state.parts);
    return parts.reduce((total, part) => total + (part.weightKg * part.quantity), 0);
};

export const useTotalCost = () => {
    const parts = useBomStore((state) => state.parts);
    return parts.reduce((total, part) => total + (part.unitCost * part.quantity), 0);
};
