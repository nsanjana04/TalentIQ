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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<
  LevelStepStatus,
  { ring: string; bg: string; badge: string; label: string }
> = {
  locked: {
    ring: "ring-muted/40",
    bg: "bg-muted/30",
    badge: "bg-muted text-muted-foreground",
    label: "Locked",
  },
  available: {
    ring: "ring-primary/30",
    bg: "bg-primary/5",
    badge: "bg-primary/10 text-primary",
    label: "Available",
  },
  in_progress: {
    ring: "ring-amber-400/50",
    bg: "bg-amber-500/5",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    label: "In Progress",
  },
  completed: {
    ring: "ring-emerald-400/50",
    bg: "bg-emerald-500/5",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    label: "Completed",
  },
};

interface LevelNodeProps {
  step: RoadmapLevelStep;
  isLast: boolean;
  onStartCourse?: (courseId: string) => void;
  onContinueCourse?: (courseId: string) => void;
  onCompleteExternal?: (courseId: string) => void;
  starting?: boolean;
  completing?: boolean;
}

export function LevelNode({
  step,
  isLast,
  onStartCourse,
  onContinueCourse,
  onCompleteExternal,
  starting,
  completing,
}: LevelNodeProps) {
  const isExternalCourse = !!step.course?.externalUrl;
  const hasStructuredModules = (step.course?.moduleCount ?? 0) > 0;
  const courseProgress = step.progress.courseProgress ?? 0;
  const canMarkExternalComplete =
    step.status === "in_progress" &&
    isExternalCourse &&
    !hasStructuredModules &&
    step.progress.courseStatus !== "COMPLETED" &&
    onCompleteExternal;
  const style = STATUS_STYLES[step.status];
  const Icon =
    step.status === "locked"
      ? Lock
      : step.status === "completed"
        ? CheckCircle2
        : step.status === "in_progress"
          ? PlayCircle
          : BookOpen;

  return (
    <div className="relative flex gap-4">
      {!isLast && (
        <div
          className={cn(
            "absolute left-[1.35rem] top-12 h-[calc(100%-1rem)] w-0.5",
            step.status === "completed" ? "bg-emerald-400/60" : "bg-border"
          )}
        />
      )}

      <div
        className={cn(
          "relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-2",
          style.ring,
          style.bg
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div
        className={cn(
          "mb-6 flex-1 rounded-xl border p-4 transition-shadow",
          style.bg,
          step.status === "available" && "hover:shadow-md"
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary">{step.levelCode}</span>
              <Badge className={cn("text-xs", style.badge)}>{style.label}</Badge>
            </div>
            <h4 className="mt-1 font-semibold">{step.title}</h4>
            {step.description && (
              <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
            )}
          </div>
          {step.estimatedDays && (
            <span className="text-xs text-muted-foreground">~{step.estimatedDays} days</span>
          )}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {step.course && (
            <div className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2 text-sm">
              <BookOpen className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{step.course.title}</span>
            </div>
          )}
          {step.assessment && (
            <div className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2 text-sm">
              <ClipboardCheck className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{step.assessment.title}</span>
            </div>
          )}
          {step.certificate && (
            <div className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2 text-sm">
              <Award className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{step.certificate.name}</span>
            </div>
          )}
        </div>

        {step.status === "in_progress" && step.progress.courseProgress !== null && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Course progress</span>
              <span>{courseProgress}%</span>
            </div>
            <Progress value={courseProgress} />
            {isExternalCourse && !hasStructuredModules && step.progress.courseStatus !== "COMPLETED" && (
              <p className="mt-2 text-xs text-muted-foreground">
                {step.course?.externalUnitCount
                  ? `Complete all ${step.course.externalUnitCount} units on the external platform, then mark the course complete here to unlock the assessment.`
                  : "Complete the module on the external platform, then mark the course complete here to unlock the assessment."}
              </p>
            )}
            {hasStructuredModules && step.status === "in_progress" && (
              <p className="mt-2 text-xs text-muted-foreground">
                Complete each module, pass its assessment (70%+), then unlock the coding round.
              </p>
            )}
          </div>
        )}

        {step.status === "in_progress" && step.course && onContinueCourse && (hasStructuredModules || !isExternalCourse) && (
          <Button size="sm" className="mt-3" onClick={() => onContinueCourse(step.course!.id)}>
            Continue course
          </Button>
        )}

        {step.status === "in_progress" && isExternalCourse && !hasStructuredModules && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <a href={step.course!.externalUrl!} target="_blank" rel="noopener noreferrer">
                Continue on Microsoft Learn
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
            {canMarkExternalComplete && (
              <Button
                size="sm"
                disabled={completing}
                onClick={() => onCompleteExternal(step.course!.id)}
              >
                {completing ? "Saving…" : "Mark course complete"}
              </Button>
            )}
          </div>
        )}

        {step.status === "completed" && step.progress.certificateNumber && (
          <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
            Certificate: {step.progress.certificateNumber}
          </p>
        )}

        {step.status === "available" && step.course && onStartCourse && (
          <Button
            size="sm"
            className="mt-3"
            disabled={starting}
            onClick={() => onStartCourse(step.course!.id)}
          >
            {starting ? "Starting…" : "Start Course"}
          </Button>
        )}
      </div>
    </div>
  );
}
