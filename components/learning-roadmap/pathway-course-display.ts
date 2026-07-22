import {
  PATHWAY_LEVEL_TIER_LABELS,
  PATHWAY_LEVEL_TIER_ORDER,
} from "@/constants/roadmap-pathway-levels";
import type { RoadmapPathwayCourse } from "@/types/roadmap-pathway";

export type PathwayCourseDisplayState =
  | "not_started"
  | "in_progress"
  | "assessment_ready"
  | "assessment_failed"
  | "cert_pending"
  | "completed";

export function getPathwayCourseDisplayState(
  course: RoadmapPathwayCourse
): PathwayCourseDisplayState {
  if (course.certificateComplete) return "completed";
  if (course.allAssessmentsPassed) return "cert_pending";
  if (course.finalAssessmentStatus === "failed") return "assessment_failed";
  if (
    course.levelsContentComplete >= course.levelsContentTotal &&
    course.levelsContentTotal > 0
  ) {
    return "assessment_ready";
  }
  if (course.status === "in_progress" || course.progress > 0) return "in_progress";
  return "not_started";
}

export function getPathwayCourseBadge(course: RoadmapPathwayCourse): {
  label: string;
  className: string;
} {
  const state = getPathwayCourseDisplayState(course);

  switch (state) {
    case "completed":
      return { label: "Completed", className: "bg-emerald-100 text-emerald-700" };
    case "cert_pending":
      return { label: "Cert pending", className: "bg-amber-100 text-amber-800" };
    case "assessment_failed":
      return {
        label: course.lastAssessmentScorePercent
          ? `Failed ${course.lastAssessmentScorePercent}%`
          : "Assessment failed",
        className: "bg-red-100 text-red-700",
      };
    case "assessment_ready":
      return { label: "Assessment ready", className: "bg-violet-100 text-violet-700" };
    case "in_progress":
      return {
        label: `${course.progress}% complete`,
        className: "bg-blue-100 text-blue-700",
      };
    default:
      return { label: "Not started", className: "bg-slate-100 text-slate-600" };
  }
}

export function resolveNextLevelName(levelsComplete: number): string | null {
  if (levelsComplete >= PATHWAY_LEVEL_TIER_ORDER.length) return null;
  return PATHWAY_LEVEL_TIER_LABELS[PATHWAY_LEVEL_TIER_ORDER[levelsComplete]!] ?? null;
}

export function buildNextPathwayAction(
  courses: RoadmapPathwayCourse[]
): { label: string; courseSlug: string } | null {
  for (const course of courses) {
    const state = getPathwayCourseDisplayState(course);
    if (state === "completed") continue;

    if (state === "cert_pending") {
      return { label: `Upload certificate for ${course.title}`, courseSlug: course.slug };
    }
    if (state === "assessment_ready" || state === "assessment_failed") {
      return { label: `Take final assessment for ${course.title}`, courseSlug: course.slug };
    }
    if (state === "in_progress" && course.nextLevelName) {
      return {
        label: `Continue ${course.title} — complete ${course.nextLevelName}`,
        courseSlug: course.slug,
      };
    }
    if (state === "not_started") {
      return { label: `Start ${course.title} on ${course.provider}`, courseSlug: course.slug };
    }
  }
  return null;
}
