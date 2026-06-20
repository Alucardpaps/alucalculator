import { create } from 'zustand';
import { useAssemblyStore } from './assemblyStore';

interface FinanceState {
  fixedCosts: number;
  targetQuantity: number;
  unitPrice: number;
  
  // Computed values that get updated automatically
  totalCost: number;
  totalRevenue: number;
  breakEvenQuantity: number;
  netProfit: number;
  roi: number;
}

interface FinanceActions {
  setFixedCosts: (val: number) => void;
  setTargetQuantity: (val: number) => void;
  setUnitPrice: (val: number) => void;
  recalculate: () => void;
}

// Temporary unit costs based on component types
const COMPONENT_COSTS: Record<string, number> = {
  profile: 15.5,
  bracket: 2.5,
  bolt: 0.5,
  nut: 0.2,
  panel: 25.0
};

export const useFinanceStore = create<FinanceState & FinanceActions>((set, get) => ({
  fixedCosts: 5000,
  targetQuantity: 100,
  unitPrice: 50,
  
  totalCost: 0,
  totalRevenue: 0,
  breakEvenQuantity: 0,
  netProfit: 0,
  roi: 0,

  setFixedCosts: (val) => { set({ fixedCosts: val }); get().recalculate(); },
  setTargetQuantity: (val) => { set({ targetQuantity: val }); get().recalculate(); },
  setUnitPrice: (val) => { set({ unitPrice: val }); get().recalculate(); },

  recalculate: () => {
    const state = get();
    const assemblyState = useAssemblyStore.getState();
    const components = Object.values(assemblyState.components);
    
    // Calculate Unit Variable Cost (CV) based on BOM
    let CV = 0;
    components.forEach(comp => {
      CV += COMPONENT_COSTS[comp.type] || 10; // Default $10 if unknown
    });

    const CF = state.fixedCosts;
    const n = state.targetQuantity;
    const P = state.unitPrice;

    // Formulas from NotebookLM
    const CT = CF + (n * CV);
    const TR = n * P;
    const Qb = (P - CV) > 0 ? (CF / (P - CV)) : Infinity;
    const NP = TR - CT;
    const ROI = CT > 0 ? ((NP / CT) * 100) : 0;

    set({
      totalCost: CT,
      totalRevenue: TR,
      breakEvenQuantity: Qb === Infinity ? 0 : Math.ceil(Qb),
      netProfit: NP,
      roi: ROI
    });
  }
}));

// Subscribe to Assembly Store changes to auto-update Finance Store
if (typeof window !== 'undefined') {
  useAssemblyStore.subscribe((state, prevState) => {
    // Basic optimization: Only recalculate if components length changes
    const currentCount = Object.keys(state.components).length;
    const prevCount = Object.keys(prevState.components).length;
    
    if (currentCount !== prevCount) {
      useFinanceStore.getState().recalculate();
    }
  });
}
