/**
 * Training Store — Zustand state for the onboarding / tutorial system.
 *
 * Tracks which tutorials have been completed and the current active step.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TrainingStep {
    id: string;
    /** CSS selector for the element to highlight */
    targetSelector: string;
    title: string;
    description: string;
    /** Position of tooltip relative to target */
    position: 'top' | 'bottom' | 'left' | 'right';
}

export interface TrainingTutorial {
    id: string;
    name: string;
    steps: TrainingStep[];
}

interface TrainingStore {
    /** Tutorials the user has completed (persisted) */
    completedTutorials: string[];
    /** Currently active tutorial (null = no tutorial running) */
    activeTutorial: TrainingTutorial | null;
    /** Current step index within the active tutorial */
    activeStepIndex: number;

    startTutorial: (tutorial: TrainingTutorial) => void;
    nextStep: () => void;
    prevStep: () => void;
    skipTutorial: () => void;
    completeTutorial: () => void;
    resetAll: () => void;
    isTutorialCompleted: (tutorialId: string) => boolean;
}

export const useTrainingStore = create<TrainingStore>()(
    persist(
        (set, get) => ({
            completedTutorials: [],
            activeTutorial: null,
            activeStepIndex: 0,

            startTutorial: (tutorial) => {
                if (get().completedTutorials.includes(tutorial.id)) return;
                set({ activeTutorial: tutorial, activeStepIndex: 0 });
            },

            nextStep: () => {
                const { activeTutorial, activeStepIndex } = get();
                if (!activeTutorial) return;
                if (activeStepIndex < activeTutorial.steps.length - 1) {
                    set({ activeStepIndex: activeStepIndex + 1 });
                } else {
                    get().completeTutorial();
                }
            },

            prevStep: () => {
                const { activeStepIndex } = get();
                if (activeStepIndex > 0) {
                    set({ activeStepIndex: activeStepIndex - 1 });
                }
            },

            skipTutorial: () => {
                const { activeTutorial } = get();
                if (activeTutorial) {
                    set(s => ({
                        completedTutorials: [...s.completedTutorials, activeTutorial.id],
                        activeTutorial: null,
                        activeStepIndex: 0,
                    }));
                }
            },

            completeTutorial: () => {
                const { activeTutorial } = get();
                if (activeTutorial) {
                    set(s => ({
                        completedTutorials: [...s.completedTutorials, activeTutorial.id],
                        activeTutorial: null,
                        activeStepIndex: 0,
                    }));
                }
            },

            resetAll: () => set({ completedTutorials: [], activeTutorial: null, activeStepIndex: 0 }),

            isTutorialCompleted: (tutorialId) => get().completedTutorials.includes(tutorialId),
        }),
        { name: 'alucalc-training' }
    )
);
