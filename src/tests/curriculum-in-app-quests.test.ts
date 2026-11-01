import { describe, it, expect } from 'vitest';
import { DUOLINGO_UNITS } from '@/components/academy/duolingo/DuolingoCurriculumData';

describe('Curriculum In-App Live Quest Questions', () => {
  it('contains exactly 10 units and 150 lessons total', () => {
    expect(DUOLINGO_UNITS.length).toBe(10);
    const totalLessons = DUOLINGO_UNITS.reduce((sum, u) => sum + u.lessons.length, 0);
    expect(totalLessons).toBe(150);
  });

  it('Unit 1 has 3 in-app live quest questions in every single lesson topic (15 * 3 = 45 quests)', () => {
    const unit1 = DUOLINGO_UNITS[0];
    expect(unit1.number).toBe(1);
    expect(unit1.lessons.length).toBe(15);

    for (const lesson of unit1.lessons) {
      const questSteps = lesson.steps.filter((s) => s.id.startsWith('quest-u1-'));
      expect(questSteps.length).toBe(3);
      for (const step of questSteps) {
        expect(step.calculationData).toBeDefined();
        expect(step.calculationData?.targetValue).toBeDefined();
        expect(step.calculationData?.formulaHint).toContain('/');
      }
    }
  });

  it('Units 2 through 10 have at least 1 in-app quest question per lesson', () => {
    for (let uIdx = 1; uIdx < 10; uIdx++) {
      const unit = DUOLINGO_UNITS[uIdx];
      expect(unit.lessons.length).toBe(15);
      for (const lesson of unit.lessons) {
        const questSteps = lesson.steps.filter((s) => s.id.startsWith(`quest-u${unit.number}-`));
        expect(questSteps.length).toBeGreaterThanOrEqual(1);
        const q = questSteps[0];
        expect(q.calculationData?.targetValue).toBeDefined();
        expect(q.calculationData?.formulaHint).toContain('/');
      }
    }
  });

  it('verifies over 180 total in-app live quest questions across the entire curriculum', () => {
    let totalQuests = 0;
    for (const unit of DUOLINGO_UNITS) {
      for (const lesson of unit.lessons) {
        const quests = lesson.steps.filter((s) => s.id.startsWith('quest-u'));
        totalQuests += quests.length;
      }
    }
    expect(totalQuests).toBeGreaterThanOrEqual(180);
  });
});
