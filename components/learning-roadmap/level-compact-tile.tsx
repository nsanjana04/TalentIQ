"use client";

import {
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Lock,
  PlayCircle,
} from "lucide-react";
import type { LevelStepStatus, RoadmapLevelStep } from "@/types/learning-roadmap";
import { RoadmapAssessmentAction } from "./roadmap-assessment-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STATUS: Record<
  LevelStepStatus,
  { label: string; border: string; icon: typeof Lock }
> = {
  locked: { label: "Locked", border: "border-muted", icon: Lock },
  available: { label: "Ready", border: "border-primary/50", icon: BookOpen },
  in_progress: { label: "Active", border: "border-amber-500", icon: PlayCircle },
  completed: { label: "Done", border: "border-emerald-500", icon: CheckCircle2 },
};

interface LevelCompactTileProps {
  step: RoadmapLevelStep;
  onStartCourse?: (courseId: string) => void;
  onCompleteExternal?: (courseId: string) => void;
  onProgressRefresh?: () => void;
  starting?: boolean;
  completing?: boolean;
}

export function LevelCompactTile({
  step,
  onStartCourse,
  onCompleteExternal,
  onProgressRefresh,
  starting,
  completing,
}: LevelCompactTileProps) {
  const cfg = STATUS[step.status];
  const Icon = cfg.icon;
  const isExternal = !!step.course?.externalUrl;
  const progress = step.progress.courseProgress ?? 0;
  const canMarkExternal =
    step.status === "in_progress" &&
    isExternal &&
    step.progress.courseStatus !== "COMPLETED" &&
    onCompleteExternal;

  return (
    <article
      className={cn(
        "flex w-[13.5rem] shrink-0 flex-col rounded-lg border bg-card",
        "border-t-2 transition-shadow hover:shadow-md",
        cfg.border,
        step.status === "locked" && "opacity-70"
      )}
    >
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono text-sm font-bold">{step.levelCode}</span>
          </div>
          <Badge variant="secondary" className="h-5 px-1.5 text-[9px]">
            {cfg.label}
          </Badge>
        </div>

        <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-tight">{step.title}</p>

        <div className="mt-2 space-y-1">
          {step.course && (
            <p className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
              <BookOpen className="h-3 w-3 shrink-0" />
              {step.course.title}
            </p>
          )}
          {step.assessment && (
            <p className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
              <ClipboardCheck className="h-3 w-3 shrink-0" />
              Quiz
            </p>
          )}
          {step.certificate && (
            <p className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
              <Award className="h-3 w-3 shrink-0" />
              Cert
            </p>
          )}
        </div>

        {(step.status === "in_progress" || step.status === "completed") &&
          step.progress.courseProgress !== null && (
            <Progress value={progress} className="mt-2 h-1" />
          )}

        <RoadmapAssessmentAction step={step} onComplete={onProgressRefresh} />
      </div>

      <div className="border-t px-3 py-2">
        {step.status === "available" && step.course && onStartCourse && (
          step.course.externalUrl ? (
            <Button asChild size="sm" className="h-7 w-full text-xs" disabled={starting}>
              <a
                href={step.course.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onStartCourse(step.course!.id)}
              >
                Start
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-7 w-full text-xs"
              disabled={starting}
              onClick={() => onStartCourse(step.course!.id)}
            >
              {starting ? "…" : "Start"}
            </Button>
          )
        )}

        {step.status === "in_progress" && isExternal && (
          <div className="flex gap-1">
            <Button asChild size="sm" variant="outline" className="h-7 flex-1 text-xs">
              <a href={step.course!.externalUrl!} target="_blank" rel="noopener noreferrer">
                Open
              </a>
            </Button>
            {canMarkExternal && (
              <Button
                size="sm"
                className="h-7 flex-1 text-xs"
                disabled={completing}
                onClick={() => onCompleteExternal(step.course!.id)}
              >
                Done
              </Button>
            )}
          </div>
        )}

        {step.status === "in_progress" && !isExternal && step.course && onStartCourse && (
          <Button
            size="sm"
            className="h-7 w-full text-xs"
            onClick={() => onStartCourse(step.course!.id)}
          >
            Continue
          </Button>
        )}

        {step.status === "locked" && (
          <p className="text-center text-[10px] text-muted-foreground">Locked</p>
        )}

        {step.status === "completed" && (
          <p className="flex items-center justify-center gap-1 text-[10px] text-emerald-600">
            <CheckCircle2 className="h-3 w-3" />
            Complete
          </p>
        )}
      </div>
    </article>
  );
}
