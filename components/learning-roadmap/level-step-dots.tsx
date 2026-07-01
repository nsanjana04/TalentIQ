"use client";

import type { LevelStepStatus, RoadmapLevelStep } from "@/types/learning-roadmap";
import { cn } from "@/lib/utils";

function dotColor(status: LevelStepStatus) {
  if (status === "completed") return "bg-emerald-500 ring-emerald-500/30";
  if (status === "in_progress") return "bg-amber-500 ring-amber-500/40 ring-2";
  if (status === "available") return "bg-primary ring-primary/30";
  return "bg-muted-foreground/25";
}

interface LevelStepDotsProps {
  steps: RoadmapLevelStep[];
  size?: "sm" | "md";
  showLabels?: boolean;
  className?: string;
}

export function LevelStepDots({
  steps,
  size = "sm",
  showLabels = false,
  className,
}: LevelStepDotsProps) {
  const dotSize = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center gap-1">
          {i > 0 && (
            <span
              className={cn(
                "h-px w-2",
                step.status === "locked" ? "bg-border" : "bg-primary/40"
              )}
              aria-hidden
            />
          )}
          <div className="flex flex-col items-center gap-0.5">
            <span
              className={cn("rounded-full", dotSize, dotColor(step.status))}
              title={`${step.levelCode}: ${step.status.replace("_", " ")}`}
            />
            {showLabels && (
              <span className="font-mono text-[9px] text-muted-foreground">{step.levelCode}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
