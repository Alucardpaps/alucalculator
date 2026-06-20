const VISITED_KEY = 'academy-visited';
const QUIZ_KEY = 'academy-quiz-passed';
const PRACTICE_KEY = 'academy-practice-done';

export function getVisitedLessons(): string[] {
  try {
    const raw = localStorage.getItem(VISITED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markLessonVisited(slug: string): void {
  try {
    const list = getVisitedLessons();
    if (!list.includes(slug)) {
      localStorage.setItem(VISITED_KEY, JSON.stringify([...list, slug]));
    }
  } catch {
    /* ignore */
  }
}

export function getQuizPassed(): string[] {
  try {
    const raw = localStorage.getItem(QUIZ_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markQuizPassed(slug: string): void {
  try {
    const list = getQuizPassed();
    if (!list.includes(slug)) {
      localStorage.setItem(QUIZ_KEY, JSON.stringify([...list, slug]));
    }
  } catch {
    /* ignore */
  }
}

export function getPracticeDone(): string[] {
  try {
    const raw = localStorage.getItem(PRACTICE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markPracticeDone(slug: string): void {
  try {
    const list = getPracticeDone();
    if (!list.includes(slug)) {
      localStorage.setItem(PRACTICE_KEY, JSON.stringify([...list, slug]));
    }
  } catch {
    /* ignore */
  }
}

export type LessonProgress = {
  visited: boolean;
  quizPassed: boolean;
  practiceDone: boolean;
  complete: boolean;
};

export function getLessonProgress(slug: string): LessonProgress {
  const visited = getVisitedLessons().includes(slug);
  const quizPassed = getQuizPassed().includes(slug);
  const practiceDone = getPracticeDone().includes(slug);
  return { visited, quizPassed, practiceDone, complete: visited && quizPassed && practiceDone };
}

export function getCompletionPercent(totalLessons: number): number {
  if (totalLessons <= 0) return 0;
  const visited = getVisitedLessons();
  const quiz = getQuizPassed();
  const practice = getPracticeDone();
  let score = 0;
  for (const slug of visited) {
    score += 1;
    if (quiz.includes(slug)) score += 1;
    if (practice.includes(slug)) score += 1;
  }
  return Math.round((score / (totalLessons * 3)) * 100);
}
