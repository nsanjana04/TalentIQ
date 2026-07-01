"use client";

import { CourseModulesPathwayPanel } from "@/components/learning-roadmap/course-modules-pathway-panel";

export function CourseModulesAccordion({ courseId }: { courseId: string }) {
  return <CourseModulesPathwayPanel courseId={courseId} />;
}
