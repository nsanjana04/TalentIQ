"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SkillRoadmap } from "@/types/learning-roadmap";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CatalogCard } from "./catalog-card";
import { CatalogDetailPanel, type CatalogPanelTab } from "./catalog-detail-panel";
import { CATALOG_PAGE_SIZE } from "./catalog-utils";

export interface RoadmapCatalogSectionProps {
  skills: SkillRoadmap[];
  selectedId: string | null;
  onSelectedIdChange: (id: string | null) => void;
  panelTab?: CatalogPanelTab;
  onPanelTabChange?: (tab: CatalogPanelTab) => void;
  roadmapLabel?: string;
  onStartCourse?: (skillId: string, courseId: string) => Promise<void> | void;
  onContinueCourse?: (skillId: string) => void;
  enrolling?: boolean;
}

export function RoadmapCatalogSection({
  skills,
  selectedId,
  onSelectedIdChange,
  panelTab = "overview",
  onPanelTabChange,
  roadmapLabel,
  onStartCourse,
  onContinueCourse,
  enrolling,
}: RoadmapCatalogSectionProps) {
  const [visibleCount, setVisibleCount] = useState(CATALOG_PAGE_SIZE);
  const selected = useMemo(
    () => skills.find((s) => s.skillId === selectedId) ?? null,
    [skills, selectedId]
  );
  const panelOpen = Boolean(selected);

  useEffect(() => {
    setVisibleCount(CATALOG_PAGE_SIZE);
  }, [skills.length]);

  useEffect(() => {
    if (selectedId && !skills.some((s) => s.skillId === selectedId)) {
      onSelectedIdChange(null);
    }
  }, [skills, selectedId, onSelectedIdChange]);

  const visibleSkills = useMemo(() => skills.slice(0, visibleCount), [skills, visibleCount]);
  const hasMore = visibleCount < skills.length;

  const handleViewCourse = useCallback(
    (skillId: string) => {
      onSelectedIdChange(skillId);
      onPanelTabChange?.("overview");
    },
    [onSelectedIdChange, onPanelTabChange]
  );

  const handleStart = useCallback(
    async (skillId: string, courseId: string) => {
      await onStartCourse?.(skillId, courseId);
      onSelectedIdChange(skillId);
      onPanelTabChange?.("content");
    },
    [onStartCourse, onSelectedIdChange, onPanelTabChange]
  );

  const handleContinue = useCallback(
    (skillId: string) => {
      onSelectedIdChange(skillId);
      onPanelTabChange?.("content");
      onContinueCourse?.(skillId);
    },
    [onContinueCourse, onSelectedIdChange, onPanelTabChange]
  );

  return (
    <section className="relative" data-layout="roadmap-catalog-v3">
      <p className="mb-3 text-sm font-semibold">Roadmap Courses</p>

      <div className="relative min-h-[320px] rounded-xl border bg-card">
        {panelOpen && (
          <button
            type="button"
            className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[1px]"
            aria-label="Close course details"
            onClick={() => onSelectedIdChange(null)}
          />
        )}

        <div className="p-4">
          <div
            className={cn(
              "grid gap-4",
              "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
            )}
          >
            {visibleSkills.map((skill) => (
              <CatalogCard
                key={skill.skillId}
                skill={skill}
                selected={skill.skillId === selectedId}
                onViewCourse={handleViewCourse}
                onStartCourse={onStartCourse ? handleStart : undefined}
                onContinueCourse={handleContinue}
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((c) => c + CATALOG_PAGE_SIZE)}
              >
                Load more courses
              </Button>
            </div>
          )}
        </div>

        {selected && (
          <div
            className={cn(
              "absolute right-0 top-0 z-20 h-full w-full max-w-[560px]",
              "animate-in slide-in-from-right duration-300"
            )}
          >
            <CatalogDetailPanel
              skill={selected}
              roadmapLabel={roadmapLabel}
              initialTab={panelTab}
              onClose={() => onSelectedIdChange(null)}
              onStartCourse={onStartCourse ? handleStart : undefined}
              onContinueLearning={handleContinue}
              enrolling={enrolling}
            />
          </div>
        )}
      </div>
    </section>
  );
}
