import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MathEngine } from '../engine/math-core';

interface VariableState {
  [key: string]: number;
}

interface EngineState {
  variables: VariableState;
  calculationResults: Record<string, number | null>;
  errors: Record<string, string | null>;
  
  // Actions
  setVariable: (name: string, value: number) => void;
  evaluateFormula: (id: string, formula: string) => void;
  clearState: () => void;
}

export const useEngineStore = create<EngineState>()(
  persist(
    (set, get) => ({
      variables: {},
      calculationResults: {},
      errors: {},

      setVariable: (name, value) => {
        set((state) => ({
          variables: { ...state.variables, [name]: value },
        }));
      },

      evaluateFormula: (id, formula) => {
        try {
          const { variables } = get();
          const result = MathEngine.evaluate(formula, variables);
          
          set((state) => ({
            calculationResults: { ...state.calculationResults, [id]: result },
            errors: { ...state.errors, [id]: null }, // Clear specific previous error
          }));
        } catch (error: any) {
          set((state) => ({
            calculationResults: { ...state.calculationResults, [id]: null },
            errors: { ...state.errors, [id]: error.message },
          }));
        }
      },

      clearState: () => {
        set({ variables: {}, calculationResults: {}, errors: {} });
      },
    }),
    {
      name: 'alucalculator-engine-storage', // Key used in local storage
      // We only persist user inputs (variables) so on refresh they don't lose their data
      partialize: (state) => ({ variables: state.variables }),
    }
  )
);
