export function calculateCourseProgress(completedLessons: number, totalLessons: number): number {
  if (totalLessons <= 0) return 0;
  return Math.min(100, Math.round((completedLessons / totalLessons) * 100));
}

export function calculateAssessmentProgress(
  completedQuestions: number,
  totalQuestions: number
): number {
  if (totalQuestions <= 0) return 0;
  return Math.min(100, Math.round((completedQuestions / totalQuestions) * 100));
}

export function calculateLearningPathProgress(
  completedLevels: number,
  totalLevels: number
): number {
  if (totalLevels <= 0) return 0;
  return Math.min(100, Math.round((completedLevels / totalLevels) * 100));
}

export function estimateCompletionDate(
  progressPercent: number,
  timeSpentMinutes: number,
  lastActivityAt: Date | null
): Date | null {
  if (progressPercent >= 100 || progressPercent <= 0 || timeSpentMinutes <= 0) return null;
  const remainingPercent = 100 - progressPercent;
  const minutesPerPercent = timeSpentMinutes / progressPercent;
  const remainingMinutes = remainingPercent * minutesPerPercent;
  const base = lastActivityAt ?? new Date();
  return new Date(base.getTime() + remainingMinutes * 60 * 1000);
}

export function calculateLearningVelocity(
  completionsLast30Days: number,
  activeLearners: number
): number {
  if (activeLearners <= 0) return 0;
  return Math.round((completionsLast30Days / activeLearners) * 10) / 10;
}

export function calculateDropoffRate(started: number, completed: number): number {
  if (started <= 0) return 0;
  return Math.round(((started - completed) / started) * 100);
}

export function calculateSkillGrowthScore(
  currentSkillAvg: number,
  previousSkillAvg: number
): number {
  const delta = currentSkillAvg - previousSkillAvg;
  return Math.max(0, Math.min(100, Math.round(50 + delta * 5)));
}
