import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type League = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legendary';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface LessonScore {
  slug: string;
  stars: number; // 1 to 3
  highScore: number;
  completedAt: string;
}

interface GamificationState {
  xp: number;
  gems: number;
  hearts: number; // Max 5
  maxHearts: number;
  streak: number;
  lastActiveDate: string | null;
  hasStreakFreeze: boolean;
  league: League;
  lessonScores: Record<string, LessonScore>;
  badges: Record<string, boolean>;
  soundEnabled: boolean;

  // Actions
  addXp: (amount: number) => void;
  addGems: (amount: number) => void;
  loseHeart: () => boolean; // returns false if 0 hearts left
  refillHearts: () => void;
  completeLesson: (slug: string, score: number, maxScore: number) => { stars: number; xpEarned: number; gemsEarned: number };
  recordDailyActivity: () => void;
  unlockBadge: (badgeId: string) => void;
  toggleSound: () => void;
  buyStreakFreeze: () => boolean;
  buyHeartRefill: () => boolean;
  resetProgress: () => void;
}

const LEAGUES: { id: League; minXp: number; label: string }[] = [
  { id: 'bronze', minXp: 0, label: 'Bronze Engineer' },
  { id: 'silver', minXp: 250, label: 'Silver Engineer' },
  { id: 'gold', minXp: 750, label: 'Gold Engineer' },
  { id: 'platinum', minXp: 1500, label: 'Platinum Engineer' },
  { id: 'diamond', minXp: 3000, label: 'Diamond Engineer' },
  { id: 'legendary', minXp: 6000, label: 'Legendary Master' },
];

export function getLeagueInfo(xp: number) {
  for (let i = LEAGUES.length - 1; i >= 0; i--) {
    if (xp >= LEAGUES[i].minXp) {
      const current = LEAGUES[i];
      const next = LEAGUES[i + 1] || null;
      const progressInLevel = next ? (xp - current.minXp) / (next.minXp - current.minXp) : 1.0;
      return { current, next, progressInLevel: Math.min(Math.max(progressInLevel, 0), 1) };
    }
  }
  return { current: LEAGUES[0], next: LEAGUES[1], progressInLevel: 0 };
}

export const useAcademyGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      xp: 0,
      gems: 50, // Starting bonus
      hearts: 5,
      maxHearts: 5,
      streak: 0,
      lastActiveDate: null,
      hasStreakFreeze: false,
      league: 'bronze',
      lessonScores: {},
      badges: {},
      soundEnabled: true,

      addXp: (amount) => {
        set((state) => {
          const newXp = state.xp + amount;
          const leagueInfo = getLeagueInfo(newXp);
          return {
            xp: newXp,
            league: leagueInfo.current.id,
          };
        });
      },

      addGems: (amount) => set((state) => ({ gems: Math.max(0, state.gems + amount) })),

      loseHeart: () => {
        const state = get();
        if (state.hearts <= 0) return false;
        const newHearts = state.hearts - 1;
        set({ hearts: newHearts });
        return newHearts > 0;
      },

      refillHearts: () => set((state) => ({ hearts: state.maxHearts })),

      completeLesson: (slug, score, maxScore) => {
        const ratio = maxScore > 0 ? score / maxScore : 1;
        let stars = 1;
        if (ratio >= 0.95) stars = 3;
        else if (ratio >= 0.70) stars = 2;

        const xpBase = stars === 3 ? 30 : stars === 2 ? 20 : 10;
        const xpBonus = Math.round(ratio * 15);
        const xpEarned = xpBase + xpBonus;
        const gemsEarned = stars === 3 ? 15 : stars === 2 ? 10 : 5;

        set((state) => {
          const existing = state.lessonScores[slug];
          const newStars = existing ? Math.max(existing.stars, stars) : stars;
          const newHighScore = existing ? Math.max(existing.highScore, score) : score;

          const updatedScores = {
            ...state.lessonScores,
            [slug]: {
              slug,
              stars: newStars,
              highScore: newHighScore,
              completedAt: new Date().toISOString(),
            },
          };

          const newXp = state.xp + xpEarned;
          const newGems = state.gems + gemsEarned;
          const leagueInfo = getLeagueInfo(newXp);

          return {
            lessonScores: updatedScores,
            xp: newXp,
            gems: newGems,
            league: leagueInfo.current.id,
          };
        });

        get().recordDailyActivity();

        // Check badge unlocks
        const totalCompleted = Object.keys(get().lessonScores).length;
        if (totalCompleted >= 1) get().unlockBadge('first_lesson');
        if (totalCompleted >= 5) get().unlockBadge('cadet_5');
        if (totalCompleted >= 15) get().unlockBadge('engineer_15');
        if (stars === 3) get().unlockBadge('perfect_score');

        return { stars, xpEarned, gemsEarned };
      },

      recordDailyActivity: () => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const state = get();

        if (!state.lastActiveDate) {
          set({ streak: 1, lastActiveDate: todayStr });
          return;
        }

        if (state.lastActiveDate === todayStr) {
          // Already recorded today
          return;
        }

        const last = new Date(state.lastActiveDate);
        const diffMs = now.getTime() - last.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          const newStreak = state.streak + 1;
          set({ streak: newStreak, lastActiveDate: todayStr });
          if (newStreak >= 3) get().unlockBadge('streak_3');
          if (newStreak >= 7) get().unlockBadge('streak_7');
          if (newStreak >= 30) get().unlockBadge('streak_30');
        } else if (diffDays > 1) {
          if (state.hasStreakFreeze) {
            set({ hasStreakFreeze: false, lastActiveDate: todayStr });
          } else {
            set({ streak: 1, lastActiveDate: todayStr });
          }
        }
      },

      unlockBadge: (badgeId) => {
        set((state) => {
          if (state.badges[badgeId]) return state;
          return {
            badges: { ...state.badges, [badgeId]: true },
            gems: state.gems + 20, // Badge award
          };
        });
      },

      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

      buyStreakFreeze: () => {
        const state = get();
        if (state.gems >= 80 && !state.hasStreakFreeze) {
          set({ gems: state.gems - 80, hasStreakFreeze: true });
          return true;
        }
        return false;
      },

      buyHeartRefill: () => {
        const state = get();
        if (state.gems >= 50 && state.hearts < state.maxHearts) {
          set({ gems: state.gems - 50, hearts: state.maxHearts });
          return true;
        }
        return false;
      },

      resetProgress: () => {
        set({
          xp: 0,
          gems: 50,
          hearts: 5,
          streak: 0,
          lastActiveDate: null,
          hasStreakFreeze: false,
          league: 'bronze',
          lessonScores: {},
          badges: {},
        });
      },
    }),
    {
      name: 'alucalc-academy-gamification',
    }
  )
);
