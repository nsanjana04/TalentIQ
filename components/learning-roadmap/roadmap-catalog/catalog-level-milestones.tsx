import { memo } from "react";
import type { SkillRoadmap } from "@/types/learning-roadmap";
import { cn } from "@/lib/utils";

function CatalogLevelMilestonesInner({ skill }: { skill: SkillRoadmap }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {skill.steps.map((step) => (
        <span
          key={step.id}
          title={`Level ${step.levelRank}: ${step.title}`}
          className={cn(
            "inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold",
            step.status === "completed" && "bg-emerald-500/15 text-emerald-700",
            step.status === "in_progress" && "bg-primary/15 text-primary",
            (step.status === "locked" || step.status === "available") &&
              "border border-border bg-muted/50 text-muted-foreground"
          )}
        >
          {step.levelRank}
        </span>
      ))}
    </div>
  );
}

export const CatalogLevelMilestones = memo(CatalogLevelMilestonesInner);
