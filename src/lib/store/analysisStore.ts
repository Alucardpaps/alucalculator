import { create } from 'zustand';

interface AnalysisState {
  // Mohr's Circle State
  mohrData: {
    sigmaX: number;
    sigmaY: number;
    tauXY: number;
  };
  
  // Column Buckling State
  bucklingData: {
    length: number;
    elasticModulus: number;
    yieldStrength: number;
    area: number;
    inertia: number;
  };
}

interface AnalysisActions {
  setMohrData: (data: Partial<AnalysisState['mohrData']>) => void;
  setBucklingData: (data: Partial<AnalysisState['bucklingData']>) => void;
}

export const useAnalysisStore = create<AnalysisState & AnalysisActions>((set) => ({
  mohrData: {
    sigmaX: 50,
    sigmaY: 10,
    tauXY: 20
  },
  bucklingData: {
    length: 1000,
    elasticModulus: 69000, // Aluminum 6061-T6 (MPa)
    yieldStrength: 275, // MPa
    area: 500, // mm^2
    inertia: 40000 // mm^4
  },

  setMohrData: (data) => set((state) => ({ 
    mohrData: { ...state.mohrData, ...data } 
  })),

  setBucklingData: (data) => set((state) => ({ 
    bucklingData: { ...state.bucklingData, ...data } 
  }))
}));
