'use client';

/**
 * 🎮 PC-GAME INTERACTIVE DEMO TOUR STORE
 *
 * Tracks:
 * - First-time visitor auto-trigger per page (`visitedPages`)
 * - Global opt-out (`autoTourOptOut`) when the user clicks "İstemiyorum / Tüm Turları Atla"
 * - Active page tour key, step index, and total earned tutorial XP (`tourXp`)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PAGE_GAME_TOURS, type PageGameTourConfig } from '@/data/pageGameTours';

export interface GameTourState {
  isOpen: boolean;
  activePageKey: PageGameTourConfig['pageKey'] | null;
  stepIndex: number;
  tourXp: number;
  autoTourOptOut: boolean;
  visitedPages: Record<string, boolean>;
  completedSteps: Record<string, boolean>;

  startPageTour: (pageKey: PageGameTourConfig['pageKey'], startStep?: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipCurrentPageTour: () => void;
  disableAllAutoTours: () => void;
  enableAutoTours: () => void;
  resetAllTours: () => void;
  checkAndTriggerFirstVisit: (pageKey: PageGameTourConfig['pageKey']) => void;
}

export const useGameTourStore = create<GameTourState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      activePageKey: null,
      stepIndex: 0,
      tourXp: 100,
      autoTourOptOut: false,
      visitedPages: {},
      completedSteps: {},

      startPageTour: (pageKey, startStep = 0) => {
        set((state) => ({
          isOpen: true,
          activePageKey: pageKey,
          stepIndex: startStep,
          visitedPages: { ...state.visitedPages, [pageKey]: true },
        }));
      },

      nextStep: () => {
        const { activePageKey, stepIndex, completedSteps, tourXp } = get();
        if (!activePageKey) return;
        const tour = PAGE_GAME_TOURS[activePageKey];
        if (!tour) return;

        const currentStep = tour.steps[stepIndex];
        const alreadyDone = currentStep ? completedSteps[currentStep.id] : false;
        const addedXp = currentStep && !alreadyDone ? currentStep.xpReward : 0;
        const nextCompleted = currentStep
          ? { ...completedSteps, [currentStep.id]: true }
          : completedSteps;

        if (stepIndex + 1 < tour.steps.length) {
          set({
            stepIndex: stepIndex + 1,
            tourXp: tourXp + addedXp,
            completedSteps: nextCompleted,
          });
        } else {
          // Completed last step of the page
          set({
            isOpen: false,
            tourXp: tourXp + addedXp,
            completedSteps: nextCompleted,
          });
        }
      },

      prevStep: () => {
        const { stepIndex } = get();
        if (stepIndex > 0) {
          set({ stepIndex: stepIndex - 1 });
        }
      },

      skipCurrentPageTour: () => {
        const { activePageKey, visitedPages } = get();
        set({
          isOpen: false,
          visitedPages: activePageKey ? { ...visitedPages, [activePageKey]: true } : visitedPages,
        });
      },

      disableAllAutoTours: () => {
        set({
          isOpen: false,
          autoTourOptOut: true,
        });
      },

      enableAutoTours: () => {
        set({ autoTourOptOut: false });
      },

      resetAllTours: () => {
        set({
          visitedPages: {},
          completedSteps: {},
          autoTourOptOut: false,
          stepIndex: 0,
          isOpen: true,
          activePageKey: 'home',
        });
      },

      checkAndTriggerFirstVisit: (pageKey) => {
        const { autoTourOptOut, visitedPages, isOpen } = get();
        if (autoTourOptOut || isOpen) return;
        if (!visitedPages[pageKey]) {
          set({
            isOpen: true,
            activePageKey: pageKey,
            stepIndex: 0,
            visitedPages: { ...visitedPages, [pageKey]: true },
          });
        }
      },
    }),
    {
      name: 'alucalc-interactive-game-tour-v1',
      partialize: (state) => ({
        tourXp: state.tourXp,
        autoTourOptOut: state.autoTourOptOut,
        visitedPages: state.visitedPages,
        completedSteps: state.completedSteps,
      }),
    }
  )
);
