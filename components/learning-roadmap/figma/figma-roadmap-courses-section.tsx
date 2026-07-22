"use client";

import { useMemo, useState } from "react";
import { ChevronDown, LayoutGrid, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { useFigmaRoadmapCourses } from "@/hooks/use-learning-stats";
import { Permission } from "@/lib/rbac/permissions";
import {
  FIGMA_ROADMAP_SKILL_FILTERS,
  type FigmaRoadmapCourse,
} from "./figma-roadmap-data";
import { FigmaRoadmapCourseCard } from "./figma-roadmap-course-card";
import { FigmaRoadmapAssignDialog } from "./figma-roadmap-assign-dialog";

const INITIAL_VISIBLE = 8;

export function FigmaRoadmapCoursesSection() {
  const { courses: roadmapCourses } = useFigmaRoadmapCourses();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [skillFilter, setSkillFilter] = useState("All Skills");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [assignCourse, setAssignCourse] = useState<FigmaRoadmapCourse | null>(null);
  const { canAny } = usePermissions();
  const canAssign = canAny([
    Permission.LEARNING_ASSIGNMENTS_CREATE,
    Permission.LEARNING_COURSES_MANAGE,
    Permission.COURSES_MANAGE,
  ]);

  const filteredCourses = useMemo(() => {
    if (skillFilter === "All Skills") return roadmapCourses;
    const key = skillFilter.toLowerCase();
    return roadmapCourses.filter(
      (c) =>
        c.title.toLowerCase().includes(key) ||
        c.description.toLowerCase().includes(key) ||
        c.logo === key
    );
  }, [skillFilter, roadmapCourses]);

  const visibleCourses = filteredCourses.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCourses.length;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#111827]">Roadmap Courses</h2>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            {filteredCourses.length} courses in this pathway ·{" "}
            {filteredCourses.filter((c) => c.status === "in_progress").length} in progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Grid view"
            onClick={() => setView("grid")}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg border",
              view === "grid"
                ? "border-[#2563EB] text-[#2563EB]"
                : "border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]"
            )}
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="List view"
            onClick={() => setView("list")}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg border",
              view === "list"
                ? "border-[#2563EB] text-[#2563EB]"
                : "border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]"
            )}
          >
            <LayoutList className="h-5 w-5" />
          </button>
          <div className="relative">
            <select
              value={skillFilter}
              onChange={(e) => {
                setSkillFilter(e.target.value);
                setVisibleCount(INITIAL_VISIBLE);
              }}
              className="h-9 appearance-none rounded-lg border border-[#E5E7EB] bg-white py-1.5 pl-3 pr-8 text-[13px] text-[#374151]"
            >
              {FIGMA_ROADMAP_SKILL_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
          </div>
        </div>
      </div>

      <div
        className={cn(
          view === "grid"
            ? "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
            : "flex flex-col gap-3"
        )}
      >
        {visibleCourses.map((course) => (
          <FigmaRoadmapCourseCard
            key={course.id}
            course={course}
            canAssign={canAssign}
            onAssign={setAssignCourse}
          />
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <p className="py-12 text-center text-sm text-[#6B7280]">No courses match this filter.</p>
      )}

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + INITIAL_VISIBLE)}
            className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-6 py-2.5 text-sm text-[#374151] hover:bg-[#F9FAFB]"
          >
            Load more courses
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}

      <FigmaRoadmapAssignDialog
        course={assignCourse}
        open={Boolean(assignCourse)}
        onOpenChange={(open) => {
          if (!open) setAssignCourse(null);
        }}
        mode="employee"
      />
    </section>
  );
}
