"use client";

import {
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Lock,
  PlayCircle,
  Timer,
} from "lucide-react";
import type { LevelStepStatus, RoadmapLevelStep } from "@/types/learning-roadmap";
import { RoadmapAssessmentAction } from "./roadmap-assessment-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  LevelStepStatus,
  {
    label: string;
    accent: string;
    glow: string;
    badge: string;
    icon: typeof Lock;
  }
> = {
  locked: {
    label: "Locked",
    accent: "border-l-slate-300 dark:border-l-slate-600",
    glow: "shadow-none",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    icon: Lock,
  },
  available: {
    label: "Ready",
    accent: "border-l-primary",
    glow: "shadow-md shadow-primary/5",
    badge: "bg-primary/10 text-primary",
    icon: BookOpen,
  },
  in_progress: {
    label: "In progress",
    accent: "border-l-amber-500",
    glow: "shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/30",
    badge: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
    icon: PlayCircle,
  },
  completed: {
    label: "Completed",
    accent: "border-l-emerald-500",
    glow: "shadow-md shadow-emerald-500/5",
    badge: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
    icon: CheckCircle2,
  },
};

interface LevelPathCardProps {
  step: RoadmapLevelStep;
  onStartCourse?: (courseId: string) => void;
  onContinueCourse?: (courseId: string) => void;
  onCompleteExternal?: (courseId: string) => void;
  onProgressRefresh?: () => void;
  starting?: boolean;
  completing?: boolean;
}

export function LevelPathCard({
  step,
  onStartCourse,
  onContinueCourse,
  onCompleteExternal,
  onProgressRefresh,
  starting,
  completing,
}: LevelPathCardProps) {
  const config = STATUS_CONFIG[step.status];
  const StatusIcon = config.icon;
  const isExternalCourse = !!step.course?.externalUrl;
  const hasStructuredModules = (step.course?.moduleCount ?? 0) > 0;
  const courseProgress = step.progress.courseProgress ?? 0;
  const canMarkExternalComplete =
    step.status === "in_progress" &&
    isExternalCourse &&
    !hasStructuredModules &&
    step.progress.courseStatus !== "COMPLETED" &&
    onCompleteExternal;

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card/90 backdrop-blur-sm",
        "border-l-4 transition-all duration-200 hover:-translate-y-0.5",
        config.accent,
        config.glow,
        step.status === "locked" && "opacity-75"
      )}
    >
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                step.status === "completed" && "bg-emerald-500/10 text-emerald-600",
                step.status === "in_progress" && "bg-amber-500/10 text-amber-600",
                step.status === "available" && "bg-primary/10 text-primary",
                step.status === "locked" && "bg-muted text-muted-foreground"
              )}
            >
              <StatusIcon className="h-4 w-4" />
            </div>
            <div>
              <span className="font-mono text-lg font-bold tracking-tight text-foreground">
                {step.levelCode}
              </span>
              <Badge className={cn("ml-1 text-[10px]", config.badge)}>{config.label}</Badge>
            </div>
          </div>
          {step.estimatedDays && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Timer className="h-3 w-3" />
              ~{step.estimatedDays}d
            </span>
          )}
        </div>

        <h4 className="mt-3 line-clamp-2 text-sm font-semibold leading-snug">{step.title}</h4>
        {step.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {step.description}
          </p>
        )}

        <div className="mt-4 space-y-2">
          {step.course && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-2 text-xs">
              <BookOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate font-medium">{step.course.title}</span>
            </div>
          )}
          {step.assessment && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-2 text-xs">
              <ClipboardCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate">{step.assessment.title}</span>
            </div>
          )}
          {step.certificate && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-2 text-xs">
              <Award className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate">{step.certificate.name}</span>
            </div>
          )}
        </div>

        {(step.status === "in_progress" || step.status === "completed") &&
          step.progress.courseProgress !== null && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
                <span>Course progress</span>
                <span className="font-semibold text-foreground">{courseProgress}%</span>
              </div>
              <Progress value={courseProgress} className="h-1.5" />
              {step.progress.totalLessons !== null && step.progress.totalLessons > 0 && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {step.progress.completedLessons ?? 0}/{step.progress.totalLessons} lessons
                </p>
              )}
            </div>
          )}

        {step.status === "in_progress" && isExternalCourse && !hasStructuredModules && (
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Complete on the external platform, then mark done here to unlock the assessment.
          </p>
        )}
        {step.status === "in_progress" && hasStructuredModules && (
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Complete each module and pass its quiz (70%+) to unlock the next. Finish all modules for the coding round.
          </p>
        )}

        <RoadmapAssessmentAction step={step} onComplete={onProgressRefresh} />

        {step.status === "completed" && step.progress.certificateNumber && (
          <p className="mt-2 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            Cert: {step.progress.certificateNumber}
          </p>
        )}
      </div>

      <div className="border-t bg-muted/20 px-4 py-3">
        {step.status === "in_progress" && step.course && onContinueCourse && (hasStructuredModules || !isExternalCourse) && (
          <Button size="sm" className="w-full" onClick={() => onContinueCourse(step.course!.id)}>
            Continue course
          </Button>
        )}

        {step.status === "in_progress" && isExternalCourse && !hasStructuredModules && (
          <div className="flex flex-col gap-2">
            <Button asChild size="sm" variant="outline" className="w-full">
              <a href={step.course!.externalUrl!} target="_blank" rel="noopener noreferrer">
                Continue externally
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
            {canMarkExternalComplete && (
              <Button
                size="sm"
                className="w-full"
                disabled={completing}
                onClick={() => onCompleteExternal(step.course!.id)}
              >
                {completing ? "Saving…" : "Mark complete"}
              </Button>
            )}
          </div>
        )}

        {step.status === "available" && step.course && onStartCourse && (
          <Button
            size="sm"
            className="w-full"
            disabled={starting}
            onClick={() => onStartCourse(step.course!.id)}
          >
            {starting ? "Starting…" : "Start course"}
          </Button>
        )}

        {step.status === "locked" && (
          <p className="text-center text-[11px] text-muted-foreground">
            Complete prior level to unlock
          </p>
        )}

        {step.status === "completed" && (
          <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Level mastered
          </p>
        )}
      </div>
    </article>
  );
}
