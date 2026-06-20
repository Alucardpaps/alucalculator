// src/lib/seo/semanticScore.ts
import { SEOCalculatorData } from '@/components/os/SEOPage';

export interface ScoredNode {
  slug: string;
  score: number;
  reasons: string[];
}

/**
 * Deterministic semantic scoring (NO ML, fully predictable)
 */
export const computeSemanticScore = (
  current: SEOCalculatorData,
  candidate: SEOCalculatorData
): ScoredNode => {
  let score = 0;
  const reasons: string[] = [];

  // 1. Same category boost (core cluster integrity)
  if (current.category === candidate.category) {
    score += 50;
    reasons.push('same-category');
  }

  // 2. Intent overlap scoring
  const currentIntent = (current.intent || '').toLowerCase();
  const candidateIntent = (candidate.intent || '').toLowerCase();

  const intentOverlap = candidateIntent
    .split(' ')
    .filter((word: string) => currentIntent.includes(word)).length;

  if (intentOverlap > 0) {
    const intentScore = intentOverlap * 10;
    score += intentScore;
    reasons.push(`intent-overlap:${intentOverlap}`);
  }

  // 3. Title keyword similarity
  const currentWords = current.title.toLowerCase().split(' ');
  const candidateWords = candidate.title.toLowerCase().split(' ');

  const sharedWords = candidateWords.filter(w =>
    currentWords.includes(w)
  ).length;

  if (sharedWords > 0) {
    score += sharedWords * 8;
    reasons.push(`title-match:${sharedWords}`);
  }

  // 4. Penalty: same slug (hard exclusion logic still elsewhere)
  if (current.slug === candidate.slug) {
    score = -999;
    reasons.push('self-node');
  }

  return {
    slug: candidate.slug,
    score,
    reasons,
  };
};
