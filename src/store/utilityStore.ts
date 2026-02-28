'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UtilityState {
    isCalcOpen: boolean;
    isUnitOpen: boolean;
    isSettingsOpen: boolean;
    isFeedbackOpen: boolean;
    calcPosition: { x: number; y: number };
    unitPosition: { x: number; y: number };
    settingsPosition: { x: number; y: number };
    feedbackPosition: { x: number; y: number };
}

interface UtilityActions {
    toggleCalc: () => void;
    toggleUnit: () => void;
    toggleSettings: () => void;
    toggleFeedback: () => void;
    setCalcOpen: (open: boolean) => void;
    setUnitOpen: (open: boolean) => void;
    setSettingsOpen: (open: boolean) => void;
    setFeedbackOpen: (open: boolean) => void;
    updateCalcPosition: (x: number, y: number) => void;
    updateUnitPosition: (x: number, y: number) => void;
    updateSettingsPosition: (x: number, y: number) => void;
    updateFeedbackPosition: (x: number, y: number) => void;
}

export const useUtilityStore = create<UtilityState & UtilityActions>()(
    persist(
        (set) => ({
            isCalcOpen: false,
            isUnitOpen: false,
            isSettingsOpen: false,
            isFeedbackOpen: false,
            calcPosition: { x: 50, y: 150 },
            unitPosition: { x: 100, y: 200 },
            settingsPosition: { x: 200, y: 100 },
            feedbackPosition: { x: 250, y: 150 },

            toggleCalc: () => set((state) => ({ isCalcOpen: !state.isCalcOpen })),
            toggleUnit: () => set((state) => ({ isUnitOpen: !state.isUnitOpen })),
            toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
            toggleFeedback: () => set((state) => ({ isFeedbackOpen: !state.isFeedbackOpen })),

            setCalcOpen: (open) => set({ isCalcOpen: open }),
            setUnitOpen: (open) => set({ isUnitOpen: open }),
            setSettingsOpen: (open) => set({ isSettingsOpen: open }),
            setFeedbackOpen: (open) => set({ isFeedbackOpen: open }),

            updateCalcPosition: (x, y) => set({ calcPosition: { x, y } }),
            updateUnitPosition: (x, y) => set({ unitPosition: { x, y } }),
            updateSettingsPosition: (x, y) => set({ settingsPosition: { x, y } }),
            updateFeedbackPosition: (x, y) => set({ feedbackPosition: { x, y } }),
        }),
        {
            name: 'alucalc-utility-state',
        }
    )
);
