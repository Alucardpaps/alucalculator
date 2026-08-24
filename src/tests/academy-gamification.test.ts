import { describe, it, expect, beforeEach } from 'vitest';
import { useAcademyGamificationStore, getLeagueInfo } from '@/store/useAcademyGamificationStore';

describe('Duolingo-Style Gamified Academy Engine', () => {
  beforeEach(() => {
    useAcademyGamificationStore.getState().resetProgress();
  });

  it('initializes with default values (5 hearts, 0 streak, 50 bonus gems, bronze league)', () => {
    const state = useAcademyGamificationStore.getState();
    expect(state.hearts).toBe(5);
    expect(state.maxHearts).toBe(5);
    expect(state.streak).toBe(0);
    expect(state.gems).toBe(50);
    expect(state.xp).toBe(0);
    expect(state.league).toBe('bronze');
  });

  it('manages hearts on incorrect answers and refills properly', () => {
    const store = useAcademyGamificationStore.getState();
    expect(store.hearts).toBe(5);

    const hasHeartsLeft1 = store.loseHeart();
    expect(hasHeartsLeft1).toBe(true);
    expect(useAcademyGamificationStore.getState().hearts).toBe(4);

    store.loseHeart();
    store.loseHeart();
    store.loseHeart();
    store.loseHeart();
    expect(useAcademyGamificationStore.getState().hearts).toBe(0);

    // Refill hearts
    useAcademyGamificationStore.getState().refillHearts();
    expect(useAcademyGamificationStore.getState().hearts).toBe(5);
  });

  it('completes a lesson, earns stars, XP, gems, and unlocks first badge', () => {
    const store = useAcademyGamificationStore.getState();
    const result = store.completeLesson('beam-deflection-formula-explained', 5, 5);

    expect(result.stars).toBe(3);
    expect(result.xpEarned).toBeGreaterThan(30);
    expect(result.gemsEarned).toBe(15);

    const state = useAcademyGamificationStore.getState();
    expect(state.xp).toBe(result.xpEarned);
    expect(state.gems).toBe(50 + result.gemsEarned + 20 + 20); // +20 for first_lesson, +20 for perfect_score!
    expect(state.lessonScores['beam-deflection-formula-explained'].stars).toBe(3);
    expect(state.badges['first_lesson']).toBe(true);
    expect(state.badges['perfect_score']).toBe(true);
  });

  it('computes league progression accurately across Bronze to Legendary tiers', () => {
    const bronzeInfo = getLeagueInfo(50);
    expect(bronzeInfo.current.id).toBe('bronze');
    expect(bronzeInfo.next?.id).toBe('silver');

    const goldInfo = getLeagueInfo(800);
    expect(goldInfo.current.id).toBe('gold');

    const diamondInfo = getLeagueInfo(3500);
    expect(diamondInfo.current.id).toBe('diamond');
  });

  it('handles streak freeze and shop purchases with gems', () => {
    const store = useAcademyGamificationStore.getState();
    // Start with 50 gems, add 50 more = 100 gems
    store.addGems(50);

    const boughtFreeze = useAcademyGamificationStore.getState().buyStreakFreeze();
    expect(boughtFreeze).toBe(true);
    expect(useAcademyGamificationStore.getState().hasStreakFreeze).toBe(true);
    expect(useAcademyGamificationStore.getState().gems).toBe(20); // 100 - 80 = 20

    // Try buying again without enough gems
    const failedBuy = useAcademyGamificationStore.getState().buyStreakFreeze();
    expect(failedBuy).toBe(false);
  });
});
