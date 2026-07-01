import type { AdminCourseSummary } from "@/types/learning-admin";
import { ROADMAP_ADMIN_TITLE_KEYWORDS, type FigmaRoadmapCourse } from "./figma-roadmap-data";

/** Maps roadmap slug → preferred enterprise course title (exact or partial match). */
const ROADMAP_ENTERPRISE_COURSE_TITLES: Record<string, string> = {
  python: "Software Engineering Best Practices",
  aws: "Cloud Computing",
  devops: "DevOps Essentials",
  kubernetes: "DevOps Essentials",
  java: "Software Engineering Best Practices",
  javascript: "Software Engineering Best Practices",
  "cyber-security": "Cyber Security Fundamentals",
  "data-analytics": "Data Analytics",
};

export function resolveAdminCourseForRoadmap(
  items: AdminCourseSummary[],
  roadmap: Pick<FigmaRoadmapCourse, "slug" | "title">
): AdminCourseSummary | null {
  if (!items.length) return null;

  const preferredTitle = ROADMAP_ENTERPRISE_COURSE_TITLES[roadmap.slug];
  if (preferredTitle) {
    const exact = items.find(
      (c) => c.title.toLowerCase() === preferredTitle.toLowerCase()
    );
    if (exact) return exact;
    const partial = items.find((c) =>
      c.title.toLowerCase().includes(preferredTitle.toLowerCase())
    );
    if (partial) return partial;
  }

  const keyword = ROADMAP_ADMIN_TITLE_KEYWORDS[roadmap.slug];
  if (keyword) {
    const byKeyword = items.find((c) =>
      c.title.toLowerCase().includes(keyword.toLowerCase())
    );
    if (byKeyword) return byKeyword;
  }

  const titleWord = roadmap.title.split(/\s+/)[0]?.toLowerCase();
  if (titleWord && titleWord.length > 2) {
    const byTitle = items.find((c) => c.title.toLowerCase().includes(titleWord));
    if (byTitle) return byTitle;
  }

  return null;
}

export function resolveLevelIdByNumber(
  levels: { id: string; orderNumber: number }[],
  levelNumber?: number
): string {
  if (!levels.length) return "";
  if (!levelNumber) return levels[0]?.id ?? "";
  return (
    levels.find((l) => l.orderNumber === levelNumber)?.id ??
    levels[levelNumber - 1]?.id ??
    levels[0]?.id ??
    ""
  );
}
