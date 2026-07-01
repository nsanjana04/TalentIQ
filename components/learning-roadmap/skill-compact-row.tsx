"use client";

import type { SkillRoadmap } from "@/types/learning-roadmap";
import { ChevronRight } from "lucide-react";
import { LevelStepDots } from "./level-step-dots";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface SkillCompactRowProps {
  skill: SkillRoadmap;
  selected?: boolean;
  onSelect: () => void;
}

export function SkillCompactRow({ skill, selected, onSelect }: SkillCompactRowProps) {
  const activeStep = skill.steps.find((s) => s.status === "in_progress");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
        "hover:bg-muted/50",
        selected
          ? "border-primary/40 bg-primary/5 shadow-sm"
          : "border-transparent bg-card hover:border-border/60"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{skill.skillName}</span>
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
            {skill.categoryName}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-3">
          <LevelStepDots steps={skill.steps} />
          {activeStep && (
            <span className="truncate text-[10px] text-amber-700 dark:text-amber-300">
              {activeStep.levelCode} in progress
            </span>
          )}
        </div>
        <Progress value={skill.overallProgress} className="mt-1.5 h-1" />
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-sm font-bold tabular-nums text-primary">
          {skill.overallProgress}%
        </span>
        <span className="text-[10px] text-muted-foreground">
          {skill.completedSteps}/{skill.totalSteps}
        </span>
        <ChevronRight
          className={cn(
            "mt-0.5 h-4 w-4 text-muted-foreground transition-transform",
            selected && "translate-x-0.5 text-primary"
          )}
        />
      </div>
    </button>
  );
}
