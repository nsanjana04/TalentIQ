/** Assessment score is always 0–100% based on correct answers (not weighted points). */

export interface ScoredQuestionResult {
  isCorrect: boolean | null;
  type: string;
}

export function countCorrectAnswers(results: ScoredQuestionResult[]): {
  correctCount: number;
  totalGradable: number;
  percentage: number;
} {
  const gradable = results.filter((r) => r.type !== "ESSAY");
  const correctCount = gradable.filter((r) => r.isCorrect === true).length;
  const totalGradable = gradable.length;
  const percentage =
    totalGradable > 0 ? Math.round((correctCount / totalGradable) * 100) : 0;

  return { correctCount, totalGradable, percentage };
}

export function formatAttemptScoreSummary(
  correctCount: number,
  totalGradable: number,
  percentage: number
): string {
  return `${correctCount} of ${totalGradable} correct · ${percentage}%`;
}

/** Normalize attempt.score from DB to a 0–100 display percentage. */
export function normalizeStoredScorePercent(
  score: number | null | undefined,
  maxScore?: number | null
): number | null {
  if (score == null) return null;

  const ms = maxScore ?? 100;

  // Legacy rows: score stored as earned points with maxScore as point total.
  if (ms > 0 && ms !== 100) {
    return Math.min(100, Math.max(0, Math.round((score / ms) * 100)));
  }

  // Current format: score is already a percentage; clamp corrupt values.
  return Math.min(100, Math.max(0, Math.round(score)));
}
