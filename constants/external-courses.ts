import { resolveLearningNavigation } from "@/lib/utils/learning-url";
import type { LearningNavigationInfo, LearningResourceType } from "@/types/learning-content";
import { UDEMY_PROGRAMMING_COURSES } from "./udemy-programming-courses";

export interface ExternalCourseConfig {
  url: string;
  /** Shown in UI; used for milestone-based progress hints. */
  totalUnits: number;
  /** Progress % recorded when the learner starts the external course. */
  startedProgress: number;
  provider?: string;
  type?: LearningResourceType;
}

const UDEMY_EXTERNAL_COURSES = Object.fromEntries(
  UDEMY_PROGRAMMING_COURSES.map((course) => [
    course.slug,
    {
      url: course.url,
      totalUnits: course.totalUnits,
      startedProgress: course.startedProgress ?? 10,
      provider: "Udemy",
      type: "UDEMY" as const,
    },
  ])
) satisfies Record<string, ExternalCourseConfig>;

/** External LMS courses keyed by TalentIQ course slug. */
export const EXTERNAL_COURSES: Record<string, ExternalCourseConfig> = {
  "java-101": {
    url: "https://learn.microsoft.com/en-us/training/modules/intro-to-java-azure/",
    totalUnits: 8,
    startedProgress: 10,
    provider: "Microsoft Learn",
    type: "MICROSOFT_LEARN",
  },
  ...UDEMY_EXTERNAL_COURSES,
};

export function getExternalCourseConfig(slug: string): ExternalCourseConfig | null {
  return EXTERNAL_COURSES[slug] ?? null;
}

export function getExternalCourseUrl(slug: string): string | null {
  return getExternalCourseConfig(slug)?.url ?? null;
}

export function isExternalCourse(slug: string): boolean {
  return slug in EXTERNAL_COURSES;
}

export function getExternalCourseNavigation(slug: string): LearningNavigationInfo | null {
  const config = getExternalCourseConfig(slug);
  if (!config) return null;
  const navigation = resolveLearningNavigation(config.type ?? "LINK", config.url);
  return {
    ...navigation,
    provider: config.provider ?? navigation.provider,
  };
}

export function getExternalCourseProviderLabel(slug: string): string | null {
  return getExternalCourseConfig(slug)?.provider ?? null;
}
