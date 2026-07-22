"use client";

import { Loader2 } from "lucide-react";
import { CourseModulesPathwayPanel } from "@/components/learning-roadmap/course-modules-pathway-panel";
import { usePathwayCourseId } from "@/hooks/use-pathway-course-id";

interface PathwayCourseModulesSectionProps {
  topicSlug: string;
  /** Learning pathway level (1 = basic / 101) — picks the matching tier course. */
  levelNumber?: number;
  variant?: "default" | "figma";
  title?: string;
}

export function PathwayCourseModulesSection({
  topicSlug,
  levelNumber = 1,
  variant = "figma",
  title = "Modules & assessments",
}: PathwayCourseModulesSectionProps) {
  const { courseId, isLoading } = usePathwayCourseId(topicSlug, levelNumber);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-[#6B7280]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading course modules…
      </div>
    );
  }

  if (!courseId) {
    return null;
  }

  return (
    <div id="pathway-modules" className="space-y-3">
      <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
      <CourseModulesPathwayPanel courseId={courseId} variant={variant} />
    </div>
  );
}
