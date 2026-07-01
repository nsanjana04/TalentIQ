"use client";

import { useEffect, useState } from "react";
import type { SkillRoadmap } from "@/types/learning-roadmap";
import { cn } from "@/lib/utils";
import { RoadmapCourseCard } from "./roadmap-course-card";
import { RoadmapCourseDetailPanel } from "./roadmap-course-detail-panel";

interface RoadmapCoursesLayoutProps {
  skills: SkillRoadmap[];
  selectedId?: string | null;
  onSelectedIdChange?: (id: string | null) => void;
  onStartCourse?: (courseId: string) => void;
  onContinueCourse?: (courseId: string) => void;
  starting?: boolean;
}

export function RoadmapCoursesLayout({
  skills,
  selectedId: controlledId,
  onSelectedIdChange,
  onStartCourse,
  onContinueCourse,
  starting,
}: RoadmapCoursesLayoutProps) {
  const [internalId, setInternalId] = useState<string | null>(null);
  const selectedId = controlledId !== undefined ? controlledId : internalId;
  const setSelectedId = onSelectedIdChange ?? setInternalId;

  const selected = skills.find((s) => s.skillId === selectedId) ?? null;
  const panelOpen = Boolean(selected);

  useEffect(() => {
    if (selectedId && !skills.some((s) => s.skillId === selectedId)) {
      setSelectedId(null);
    }
  }, [skills, selectedId, setSelectedId]);

  return (
    <div className="relative w-full" data-layout="roadmap-courses-v2">
      {panelOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          aria-label="Close panel"
          onClick={() => setSelectedId(null)}
        />
      )}

      <p className="mb-3 text-sm font-semibold text-[#0F172A] dark:text-foreground">
        Roadmap Courses
      </p>

      <div
        className={cn(
          "w-full overflow-hidden rounded-xl border border-[#E2E8F0] bg-white dark:border-border dark:bg-card",
          panelOpen && "md:flex md:items-stretch"
        )}
        style={panelOpen ? { minHeight: 560 } : undefined}
      >
        <div
          className={cn(
            "min-w-0 flex-1 p-4",
            panelOpen && "md:border-r md:border-[#E2E8F0]"
          )}
        >
          <div
            className={cn(
              "grid gap-4",
              panelOpen
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
            )}
          >
            {skills.map((skill) => (
              <RoadmapCourseCard
                key={skill.skillId}
                skill={skill}
                selected={skill.skillId === selectedId}
                onViewCourse={() => setSelectedId(skill.skillId)}
              />
            ))}
          </div>
        </div>

        {/* Right: detail panel */}
        {selected && (
          <div
            className={cn(
              "z-50 flex shrink-0 flex-col bg-white dark:bg-card",
              "fixed inset-y-0 right-0 w-full max-w-[400px] shadow-2xl",
              "md:relative md:inset-auto md:w-[400px] md:max-w-none md:shadow-none"
            )}
          >
            <RoadmapCourseDetailPanel
              skill={selected}
              embedded
              onClose={() => setSelectedId(null)}
              onStartCourse={onStartCourse}
              onContinueCourse={onContinueCourse}
              starting={starting}
            />
          </div>
        )}
      </div>
    </div>
  );
}
