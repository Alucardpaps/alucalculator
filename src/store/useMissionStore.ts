import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ENGINEERING_MISSIONS, EngineeringMission } from '@/data/engineeringMissions';
import { useAcademyGamificationStore } from './useAcademyGamificationStore';

interface MissionStoreState {
  activeMissionId: string | null;
  stepStates: Record<string, boolean>; // stepId -> boolean
  completedMissionIds: string[];
  isHudOpen: boolean;
  isCompletedBannerVisible: boolean;

  // Actions
  startMission: (missionId: string) => void;
  abandonMission: () => void;
  toggleHud: () => void;
  setHudOpen: (open: boolean) => void;
  reportModuleState: (module: string, state: Record<string, any>) => void;
  reportModuleAction: (module: string, actionName: string, payload?: any) => void;
  dismissCompletedBanner: () => void;
  getActiveMission: () => EngineeringMission | null;
}

export const useMissionStore = create<MissionStoreState>()(
  persist(
    (set, get) => ({
      activeMissionId: null,
      stepStates: {},
      completedMissionIds: [],
      isHudOpen: true,
      isCompletedBannerVisible: false,

      getActiveMission: () => {
        const id = get().activeMissionId;
        if (!id) return null;
        return ENGINEERING_MISSIONS.find((m) => m.id === id) || null;
      },

      startMission: (missionId: string) => {
        const mission = ENGINEERING_MISSIONS.find((m) => m.id === missionId);
        if (!mission) return;

        set({
          activeMissionId: missionId,
          stepStates: {},
          isHudOpen: true,
          isCompletedBannerVisible: false,
        });

        // Navigate directly to the real route if in browser
        if (typeof window !== 'undefined' && mission.route) {
          if (window.location.pathname !== mission.route) {
            window.location.href = mission.route;
          }
        }
      },

      abandonMission: () => {
        set({ activeMissionId: null, stepStates: {}, isCompletedBannerVisible: false });
      },

      toggleHud: () => {
        set((state) => ({ isHudOpen: !state.isHudOpen }));
      },

      setHudOpen: (open: boolean) => {
        set({ isHudOpen: open });
      },

      dismissCompletedBanner: () => {
        set({ isCompletedBannerVisible: false });
      },

      reportModuleState: (module: string, state: Record<string, any>) => {
        const mission = get().getActiveMission();
        if (!mission) return;

        const currentStepStates = { ...get().stepStates };
        let hasChanges = false;

        for (const step of mission.steps) {
          if (!step.isAction && !currentStepStates[step.id]) {
            try {
              if (step.check(state)) {
                currentStepStates[step.id] = true;
                hasChanges = true;
              }
            } catch (err) {
              console.warn('Mission check error', err);
            }
          }
        }

        if (hasChanges) {
          set({ stepStates: currentStepStates });
          
          // Check if all steps are completed
          const allComplete = mission.steps.every((s) => currentStepStates[s.id]);
          if (allComplete && !get().completedMissionIds.includes(mission.id)) {
            set((prev) => ({
              completedMissionIds: [...prev.completedMissionIds, mission.id],
              isCompletedBannerVisible: true,
            }));
            // Award rewards in gamification store
            useAcademyGamificationStore.getState().addXp(mission.rewardXp);
            useAcademyGamificationStore.getState().addGems(mission.rewardGems);
          }
        }
      },

      reportModuleAction: (module: string, actionName: string, payload?: any) => {
        const mission = get().getActiveMission();
        if (!mission) return;

        const currentStepStates = { ...get().stepStates };
        let hasChanges = false;

        const actionState = { [actionName]: true, ...(payload || {}) };

        for (const step of mission.steps) {
          if (step.isAction && !currentStepStates[step.id]) {
            try {
              if (step.check(actionState)) {
                currentStepStates[step.id] = true;
                hasChanges = true;
              }
            } catch (err) {
              console.warn('Mission action check error', err);
            }
          }
        }

        if (hasChanges) {
          set({ stepStates: currentStepStates });

          const allComplete = mission.steps.every((s) => currentStepStates[s.id]);
          if (allComplete && !get().completedMissionIds.includes(mission.id)) {
            set((prev) => ({
              completedMissionIds: [...prev.completedMissionIds, mission.id],
              isCompletedBannerVisible: true,
            }));
            useAcademyGamificationStore.getState().addXp(mission.rewardXp);
            useAcademyGamificationStore.getState().addGems(mission.rewardGems);
          }
        }
      },
    }),
    {
      name: 'alucalc-inapp-missions-v1',
    }
  )
);
