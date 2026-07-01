"use client";

import { CheckCircle2, Circle, Lock, PlayCircle } from "lucide-react";
import type { LevelStepStatus, RoadmapLevelStep } from "@/types/learning-roadmap";
import { cn } from "@/lib/utils";

interface LevelPathRailProps {
  steps: RoadmapLevelStep[];
}

function railNodeIcon(status: LevelStepStatus) {
  if (status === "completed") return CheckCircle2;
  if (status === "in_progress") return PlayCircle;
  if (status === "available") return Circle;
  return Lock;
}

function railNodeColor(status: LevelStepStatus) {
  if (status === "completed") return "bg-emerald-500 text-white border-emerald-500";
  if (status === "in_progress") return "bg-amber-500 text-white border-amber-500 ring-4 ring-amber-500/20";
  if (status === "available") return "bg-primary text-primary-foreground border-primary";
  return "bg-muted text-muted-foreground border-border";
}

export function LevelPathRail({ steps }: LevelPathRailProps) {
  if (steps.length === 0) return null;

  return (
    <div className="relative mb-6 hidden px-2 md:block">
      <div className="absolute left-8 right-8 top-5 h-0.5 bg-border" aria-hidden />
      <div
        className="absolute left-8 top-5 h-0.5 bg-gradient-to-r from-emerald-500 via-primary to-border transition-all duration-500"
        style={{
          width: `calc(${Math.max(0, steps.filter((s) => s.status === "completed").length) / Math.max(steps.length - 1, 1)} * (100% - 4rem))`,
          maxWidth: "calc(100% - 4rem)",
        }}
        aria-hidden
      />
      <ol className="relative flex justify-between">
        {steps.map((step) => {
          const Icon = railNodeIcon(step.status);
          return (
            <li key={step.id} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-transform",
                  railNodeColor(step.status),
                  step.status === "in_progress" && "scale-110"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="font-mono text-xs font-bold text-foreground">{step.levelCode}</span>
              <span
                className={cn(
                  "max-w-[5rem] truncate text-center text-[10px] capitalize text-muted-foreground",
                  step.status === "in_progress" && "font-semibold text-amber-700 dark:text-amber-300"
                )}
              >
                {step.status.replace("_", " ")}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
