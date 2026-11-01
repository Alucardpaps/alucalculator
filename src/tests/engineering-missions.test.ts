import { describe, it, expect, beforeEach } from 'vitest';
import { ENGINEERING_MISSIONS } from '@/data/engineeringMissions';
import { useMissionStore } from '@/store/useMissionStore';
import { useAcademyGamificationStore } from '@/store/useAcademyGamificationStore';

describe('Interactive In-App Engineering Missions', () => {
  beforeEach(() => {
    useMissionStore.setState({
      activeMissionId: null,
      stepStates: {},
      completedMissionIds: [],
      isCompletedBannerVisible: false,
    });
  });

  it('contains registered missions with valid routes and steps', () => {
    expect(ENGINEERING_MISSIONS.length).toBeGreaterThanOrEqual(8);
    for (const mission of ENGINEERING_MISSIONS) {
      expect(mission.route).toBeDefined();
      expect(mission.route.startsWith('/')).toBe(true);
      expect(mission.steps.length).toBeGreaterThan(0);
      expect(mission.rewardXp).toBeGreaterThan(0);
      expect(mission.rewardGems).toBeGreaterThan(0);
    }
  });

  it('starts mission and tracks live state reporting for 8m 16x32 gear pair', () => {
    const store = useMissionStore.getState();
    store.startMission('mission-gears-8m-16-32');

    expect(useMissionStore.getState().activeMissionId).toBe('mission-gears-8m-16-32');
    expect(useMissionStore.getState().getActiveMission()?.titleTr).toContain('8m 16x32');

    // Simulate user setting m=8 in GearsModule
    store.reportModuleState('gears', { module: 8, z1: 10, z2: 20 });
    expect(useMissionStore.getState().stepStates['step-m8']).toBe(true);
    expect(useMissionStore.getState().stepStates['step-z1-16']).toBeFalsy();

    // Simulate user setting z1=16 and z2=32
    store.reportModuleState('gears', { module: 8, z1: 16, z2: 32 });
    expect(useMissionStore.getState().stepStates['step-z1-16']).toBe(true);
    expect(useMissionStore.getState().stepStates['step-z2-32']).toBe(true);
    expect(useMissionStore.getState().stepStates['step-export-3d']).toBeFalsy();

    // Simulate user clicking "3D Aktar" (Export to 3D)
    store.reportModuleAction('gears', 'exportedTo3D', true);
    expect(useMissionStore.getState().stepStates['step-export-3d']).toBe(true);

    // Full mission should be completed
    expect(useMissionStore.getState().completedMissionIds).toContain('mission-gears-8m-16-32');
    expect(useMissionStore.getState().isCompletedBannerVisible).toBe(true);
  });

  it('evaluates 3D Assembly frame building mission', () => {
    const store = useMissionStore.getState();
    store.startMission('mission-assembly-first-frame');

    // Simulate adding 2 profiles and 1 bracket to 3D scene
    store.reportModuleState('assembly', { profileCount: 2, bracketCount: 1 });
    expect(useMissionStore.getState().stepStates['step-add-profiles']).toBe(true);
    expect(useMissionStore.getState().stepStates['step-add-bracket']).toBe(true);
    expect(useMissionStore.getState().completedMissionIds).toContain('mission-assembly-first-frame');
  });

  it('evaluates Cut Optimizer low-scrap mission', () => {
    const store = useMissionStore.getState();
    store.startMission('mission-cut-optimization-scrap');

    store.reportModuleState('cutting', { hasCalculated: true, scrapPercent: 2.5, gcodeGenerated: true });
    expect(useMissionStore.getState().stepStates['step-calculate-cuts']).toBe(true);
    expect(useMissionStore.getState().stepStates['step-low-scrap']).toBe(true);
    expect(useMissionStore.getState().stepStates['step-gcode-generated']).toBe(true);
    expect(useMissionStore.getState().completedMissionIds).toContain('mission-cut-optimization-scrap');
  });
});
