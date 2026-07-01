"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Lock } from "lucide-react";
import type { RoadmapLevelStep } from "@/types/learning-roadmap";
import { CourseModulesPathwayPanel } from "@/components/learning-roadmap/course-modules-pathway-panel";
import { cn } from "@/lib/utils";

function LevelCourseModules({ courseId }: { courseId: string }) {
  return <CourseModulesPathwayPanel courseId={courseId} />;
}

function LevelAccordionItem({
  step,
  index,
  isLast,
}: {
  step: RoadmapLevelStep;
  index: number;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(step.status === "in_progress");
  const locked = step.status === "locked";
  const courseId = step.course?.id;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border",
        expanded && !locked && "border-primary/30",
        locked && "opacity-80"
      )}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-muted/40"
        onClick={() => !locked && setExpanded((e) => !e)}
        disabled={locked}
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 items-center gap-2">
          {locked ? (
            <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium">
              Level {step.levelRank}: {step.title}
            </p>
            {step.description && (
              <p className="truncate text-xs text-muted-foreground">{step.description}</p>
            )}
          </div>
        </div>
        {!locked && (
          <span className="shrink-0 text-[10px] font-medium text-primary">
            {step.status === "completed"
              ? "Done"
              : step.status === "in_progress"
                ? "In Progress"
                : "Ready"}
          </span>
        )}
      </button>

      {expanded && !locked && (
        <div className="space-y-3 border-t bg-muted/20 px-3 py-3">
          {courseId ? (
            <LevelCourseModules courseId={courseId} />
          ) : step.course?.externalUrl ? (
            <p className="text-xs text-muted-foreground">External course linked for this level.</p>
          ) : (
            <p className="text-xs text-muted-foreground">No course linked for this level yet.</p>
          )}

          {step.certificate && isLast && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50/50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/30">
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
                Certification: {step.certificate.name}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CatalogContentTree({ steps }: { steps: RoadmapLevelStep[] }) {
  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <LevelAccordionItem
          key={step.id}
          step={step}
          index={index}
          isLast={index === steps.length - 1}
        />
      ))}
    </div>
  );
}
