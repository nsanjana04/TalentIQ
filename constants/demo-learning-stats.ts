/**
 * Demo learning stats aligned with `prisma/seed-demo-progress.ts`.
 * Used as UI fallbacks before API data loads and to keep static counts consistent.
 */

/** Maps Figma roadmap topic slugs to related DB course slugs for progress aggregation. */
export const FIGMA_TOPIC_COURSE_SLUGS: Record<string, string[]> = {
  python: [
    "python-101",
    "python-201",
    "python-301",
    "python-intro-programming",
    "python-beginner-intermediate-30min",
    "python-data",
  ],
  aws: [
    "cloud-computing-aws",
    "aws-zero-to-hero",
    "intro-cloud-computing",
    "aws-cloud",
    "aws-101",
  ],
  java: [
    "java-multithreading",
    "java-design-patterns",
    "java-programming-free",
    "java-101",
    "java-201",
  ],
  javascript: [
    "javascript-programming-free",
    "quiz-app-html-css-js",
    "html-css-programming-free",
  ],
  "cyber-security": [
    "kali-linux-ethical-hacking",
    "cyber-security-beginners",
    "security-essentials",
  ],
  "data-analytics": [
    "intro-databases-sql",
    "advanced-databases-sql",
    "excel-for-beginners",
  ],
  devops: ["git-expert-4-hours", "nodejs-backend"],
  kubernetes: ["intro-cloud-computing", "cloud-computing-aws"],
};

/** Default roadmap card progress (primary demo employee — anna.kowalski@talentiq.com). */
export const DEMO_ROADMAP_COURSE_PROGRESS: Record<
  string,
  { progress: number; status: "in_progress" | "available" }
> = {
  python: { progress: 38, status: "in_progress" },
  aws: { progress: 24, status: "in_progress" },
  devops: { progress: 15, status: "in_progress" },
  kubernetes: { progress: 0, status: "available" },
  java: { progress: 52, status: "in_progress" },
  javascript: { progress: 12, status: "in_progress" },
  "cyber-security": { progress: 0, status: "available" },
  "data-analytics": { progress: 65, status: "in_progress" },
};

/** Top stats row on /learning — matches seeded LRS dashboard for demo employee. */
export const DEMO_EMPLOYEE_LEARNING_STATS = {
  progressPercent: 42,
  progressDeltaPercent: 8,
  timeInvestedMinutes: 285,
  timeDeltaMinutes: 45,
  coursesInProgress: 4,
  coursesInProgressDelta: 1,
  certificatesEarned: 2,
  coursesCompleted: 3,
  totalEnrolledCourses: 9,
  openCoursesCompleted: 5,
  openCoursesTotal: 14,
  roadmapCoursesTotal: 20,
  lastUpdated: "23 Jun 2026",
} as const;

export function formatLearningMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
}

export function aggregateTopicProgress(
  topicSlug: string,
  progressByCourseSlug: Map<string, { progressPercent: number; status: string }>
): { progress: number; status: "in_progress" | "available" } {
  const slugs = FIGMA_TOPIC_COURSE_SLUGS[topicSlug] ?? [];
  const matches = slugs
    .map((slug) => progressByCourseSlug.get(slug))
    .filter(Boolean) as { progressPercent: number; status: string }[];

  if (matches.length === 0) {
    return DEMO_ROADMAP_COURSE_PROGRESS[topicSlug] ?? { progress: 0, status: "available" };
  }

  const progress = Math.round(
    matches.reduce((sum, m) => sum + m.progressPercent, 0) / matches.length
  );
  const hasActive = matches.some(
    (m) => m.status === "IN_PROGRESS" || m.status === "ENROLLED"
  );
  const allComplete = matches.every((m) => m.status === "COMPLETED");

  return {
    progress: allComplete ? 100 : progress,
    status: hasActive || (progress > 0 && !allComplete) ? "in_progress" : "available",
  };
}
