"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  FileText,
  Loader2,
  Lock,
  PlayCircle,
} from "lucide-react";
import {
  useCompleteModule,
  useCoursePlayer,
  usePrepareModuleAssessment,
} from "@/hooks/use-course-learning";
import { useAssessmentMutations } from "@/hooks/use-assessments";
import type { CoursePlayerData, CoursePlayerModule } from "@/types/course-learning";
import type { AttemptResult, AttemptSession } from "@/types/assessments";
import { AssessmentTaker, AttemptResultView } from "@/components/assessments/assessment-taker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ROUTES } from "@/constants/routes";
import { MODULE_QUIZ_QUESTION_COUNT } from "@/constants/assessment-prompts";
import { formatModulePassRequirement } from "@/lib/assessments/exam-grading-policy";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

export type PathwayPanelVariant = "default" | "figma";

interface CourseModulesPathwayPanelProps {
  courseId: string;
  variant?: PathwayPanelVariant;
  className?: string;
}

export function CourseModulesPathwayPanel({
  courseId,
  variant = "default",
  className,
}: CourseModulesPathwayPanelProps) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useCoursePlayer(courseId);
  const completeModule = useCompleteModule(courseId);
  const prepareAssessment = usePrepareModuleAssessment(courseId);
  const assessmentMutations = useAssessmentMutations();

  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [preparingModuleId, setPreparingModuleId] = useState<string | null>(null);
  const [markingModuleId, setMarkingModuleId] = useState<string | null>(null);
  const [session, setSession] = useState<AttemptSession | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [activeAssessmentTitle, setActiveAssessmentTitle] = useState("");

  useEffect(() => {
    if (!data?.modules.length) return;
    const active =
      data.modules.find((m) => m.isUnlocked && !m.isComplete) ??
      data.modules.find((m) => m.isUnlocked) ??
      data.modules[0];
    setExpandedModuleId(active?.id ?? null);
  }, [data?.modules]);

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground",
          className
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading modules and assessments…
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn("space-y-2 py-6 text-sm", className)}>
        <p className="text-destructive">
          Could not load modules for this course. Refresh the page or try again later.
        </p>
      </div>
    );
  }

  if (!data?.modules.length) {
    return (
      <div className={cn("space-y-2 py-6 text-sm text-muted-foreground", className)}>
        <p>
          This course is linked but has no modules yet. Run database seeding to load skill-path
          modules (for example <span className="font-medium">python-101</span>).
        </p>
        {data?.course?.slug && (
          <p className="text-xs">
            Linked course: {data.course.title} ({data.course.slug})
          </p>
        )}
      </div>
    );
  }

  async function handleMarkComplete(moduleId: string) {
    setMarkingModuleId(moduleId);
    try {
      const result = await completeModule.mutateAsync(moduleId);
      const completed = result.player.modules.find((m) => m.id === moduleId);
      if (
        completed?.isContentComplete &&
        completed.moduleQuiz &&
        !completed.moduleQuiz.isPassed
      ) {
        await startAssessment(completed, completed.moduleQuiz.title);
        return;
      }
      await refetch();
    } finally {
      setMarkingModuleId(null);
    }
  }

  async function startAssessment(module: CoursePlayerModule, title: string) {
    setPreparingModuleId(module.id);
    try {
      const prepared = await prepareAssessment.mutateAsync(module.id);
      const nextSession = await assessmentMutations.startAttempt.mutateAsync(
        prepared.assessmentId
      );
      setActiveAssessmentTitle(title);
      setSession(nextSession);
      setResult(null);
    } finally {
      setPreparingModuleId(null);
    }
  }

  async function handleTakeAssessment(module: CoursePlayerModule) {
    const quiz = module.moduleQuiz;
    if (!quiz) return;

    setPreparingModuleId(module.id);
    try {
      const prepared = await prepareAssessment.mutateAsync(module.id);
      await refetch();
      router.push(
        ROUTES.assessmentTake(prepared.assessmentId, { courseId, moduleId: module.id })
      );
    } finally {
      setPreparingModuleId(null);
    }
  }

  async function handleTakeCodingRound() {
    if (!data?.codingRound) return;
    setPreparingModuleId("coding-round");
    try {
      await apiClient.post(`/api/courses/${courseId}/prepare-coding-round`);
      router.push(ROUTES.assessmentTake(data.codingRound.assessmentId, { courseId }));
    } finally {
      setPreparingModuleId(null);
    }
  }

  function handleAssessmentComplete(nextResult: AttemptResult) {
    setResult(nextResult);
    setSession(null);
    void refetch();
  }

  const isFigma = variant === "figma";

  return (
    <div className={cn("space-y-3", className)}>
      <PathwayProgressHeader data={data} variant={variant} />

      {data.modules.map((module, index) => (
        <ModulePathwayCard
          key={module.id}
          module={module}
          index={index}
          variant={variant}
          externalUrl={data.course.externalUrl}
          externalProvider={data.course.externalProvider}
          expanded={expandedModuleId === module.id}
          onToggle={() =>
            setExpandedModuleId((id) => (id === module.id ? null : module.id))
          }
          onMarkComplete={() => handleMarkComplete(module.id)}
          onTakeAssessment={() => handleTakeAssessment(module)}
          marking={markingModuleId === module.id}
          preparing={preparingModuleId === module.id}
        />
      ))}

      {data.codingRound && (
        <CodingRoundCard
          codingRound={data.codingRound}
          variant={variant}
          onTake={handleTakeCodingRound}
          preparing={preparingModuleId === "coding-round"}
        />
      )}

      <p
        className={cn(
          "text-xs",
          isFigma ? "text-[#6B7280]" : "text-muted-foreground"
        )}
      >
        Module exams: {MODULE_QUIZ_QUESTION_COUNT} MCQs each, pass{" "}
        {formatModulePassRequirement()}. Questions auto-generate from module content when you
        start. Pass each module to unlock the next.
      </p>

      <Dialog
        open={!!session || !!result}
        onOpenChange={() => {
          setSession(null);
          setResult(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{activeAssessmentTitle}</DialogTitle>
          </DialogHeader>
          {session && (
            <AssessmentTaker
              session={session}
              onClose={() => setSession(null)}
              onComplete={handleAssessmentComplete}
            />
          )}
          {result && (
            <AttemptResultView
              result={result}
              onClose={() => setResult(null)}
              onRetake={
                !result.passed && result.canRetake
                  ? () => {
                      setResult(null);
                    }
                  : undefined
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PathwayProgressHeader({
  data,
  variant,
}: {
  data: CoursePlayerData;
  variant: PathwayPanelVariant;
}) {
  const isFigma = variant === "figma";
  const passedModules = data.modules.filter((m) => m.isComplete).length;
  const totalModules = data.modules.length;

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        isFigma ? "border-[#E5E7EB] bg-[#F9FAFB]" : "border-border bg-muted/30"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className={cn("text-sm font-semibold", isFigma && "text-[#111827]")}>
            {data.course.title}
          </p>
          <p className={cn("text-xs", isFigma ? "text-[#6B7280]" : "text-muted-foreground")}>
            {passedModules} of {totalModules} modules complete
          </p>
        </div>
        <span className={cn("text-sm font-semibold", isFigma ? "text-[#2563EB]" : "text-primary")}>
          {data.overallProgress}%
        </span>
      </div>
      <Progress value={data.overallProgress} className="mt-2 h-1.5" />
    </div>
  );
}

function ModulePathwayCard({
  module,
  index,
  variant,
  externalUrl,
  externalProvider,
  expanded,
  onToggle,
  onMarkComplete,
  onTakeAssessment,
  marking,
  preparing,
}: {
  module: CoursePlayerModule;
  index: number;
  variant: PathwayPanelVariant;
  externalUrl?: string | null;
  externalProvider?: string | null;
  expanded: boolean;
  onToggle: () => void;
  onMarkComplete: () => void;
  onTakeAssessment: () => void;
  marking: boolean;
  preparing: boolean;
}) {
  const isFigma = variant === "figma";
  const locked = !module.isUnlocked;
  const quiz = module.moduleQuiz;
  const assessmentLocked = Boolean(
    locked || !module.isContentComplete || (quiz && !quiz.isAvailable && !quiz.isPassed)
  );
  const lessonCount = module.lessons.length;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border",
        isFigma ? "border-[#E5E7EB] bg-white" : "border-border bg-card",
        locked && "opacity-90",
        module.isComplete && (isFigma ? "border-[#86EFAC]" : "border-emerald-400/40")
      )}
    >
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/40"
        )}
        onClick={onToggle}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
              module.isComplete && "bg-emerald-500/15 text-emerald-700",
              !module.isComplete && module.isUnlocked && "bg-primary/10 text-primary",
              locked && "bg-muted text-muted-foreground"
            )}
          >
            {locked ? <Lock className="h-3.5 w-3.5" /> : index + 1}
          </div>
          <div className="min-w-0 text-left">
            <p className={cn("text-sm font-medium", isFigma && "text-[#111827]")}>
              Module {index + 1}: {module.title}
            </p>
            <p className={cn("text-xs", isFigma ? "text-[#6B7280]" : "text-muted-foreground")}>
              {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
              {quiz ? " · 1 assessment" : ""}
              {locked
                ? " · Locked"
                : module.isComplete
                  ? " · Completed"
                  : module.isContentComplete
                    ? " · Assessment required"
                    : ""}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className={cn("border-t", isFigma ? "border-[#F3F4F6]" : "border-border")}>
          {/* Lessons */}
          <div className="px-4 pt-3">
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-wide",
                isFigma ? "text-[#6B7280]" : "text-muted-foreground"
              )}
            >
              Lessons
            </p>
          </div>
          <ul className={cn(isFigma ? "divide-y divide-[#F9FAFB]" : "divide-y divide-border/60")}>
            {module.lessons.map((lesson, lessonIndex) => (
              <LessonPathwayRow
                key={lesson.id}
                moduleIndex={index}
                lessonIndex={lessonIndex}
                lesson={lesson}
                locked={locked || !lesson.isAccessible}
                externalUrl={externalUrl}
                externalProvider={externalProvider}
                variant={variant}
              />
            ))}
          </ul>

          {!locked && !module.isContentComplete && (
            <div className="border-t px-4 py-3">
              <Button
                size="sm"
                variant={isFigma ? "outline" : "secondary"}
                disabled={marking}
                onClick={onMarkComplete}
                className="gap-1.5"
              >
                {marking ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Mark module complete
              </Button>
            </div>
          )}

          {/* Assessment */}
          {quiz && (
            <>
              <div className="border-t px-4 pt-3">
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wide",
                    isFigma ? "text-[#6B7280]" : "text-muted-foreground"
                  )}
                >
                  Assessment
                </p>
              </div>
              <AssessmentModuleRow
                index={index}
                quiz={quiz}
                locked={assessmentLocked}
                variant={variant}
                preparing={preparing}
                onTake={
                  !assessmentLocked && module.isContentComplete && !quiz.isPassed
                    ? onTakeAssessment
                    : undefined
                }
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function LessonPathwayRow({
  moduleIndex,
  lessonIndex,
  lesson,
  locked,
  externalUrl,
  externalProvider,
  variant,
}: {
  moduleIndex: number;
  lessonIndex: number;
  lesson: CoursePlayerModule["lessons"][number];
  locked: boolean;
  externalUrl?: string | null;
  externalProvider?: string | null;
  variant: PathwayPanelVariant;
}) {
  const isFigma = variant === "figma";
  const num = `${moduleIndex + 1}.${lessonIndex + 1}`;
  const duration =
    lesson.durationMinutes != null ? `${lesson.durationMinutes} min` : null;
  const completed = lesson.progress.status === "COMPLETED";
  const inProgress = lesson.progress.status === "IN_PROGRESS";
  const canOpen = !locked && externalUrl;

  const content = (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "w-10 shrink-0 text-[13px]",
            isFigma ? "text-[#6B7280]" : "text-muted-foreground"
          )}
        >
          {num}
        </span>
        <PlayCircle
          className={cn(
            "h-4 w-4 shrink-0",
            locked ? "text-muted-foreground/50" : isFigma ? "text-[#2563EB]" : "text-primary"
          )}
        />
        <span className={cn("truncate text-sm", isFigma ? "text-[#374151]" : "")}>
          {lesson.title}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {duration && (
          <span className={cn("text-[13px]", isFigma ? "text-[#9CA3AF]" : "text-muted-foreground")}>
            {duration}
          </span>
        )}
        {completed ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-label="Completed" />
        ) : inProgress ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" aria-label="In progress" />
        ) : locked ? (
          <Lock className="h-5 w-5 text-muted-foreground" aria-label="Locked" />
        ) : (
          <span className="h-5 w-5 rounded-full border border-muted-foreground/30" aria-hidden />
        )}
      </div>
    </>
  );

  if (canOpen) {
    return (
      <li>
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Open on ${externalProvider ?? "external site"}`}
          className={cn(
            "flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/40",
            isFigma && "hover:bg-[#F9FAFB]"
          )}
        >
          {content}
        </a>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between px-4 py-3">{content}</li>
  );
}

function AssessmentModuleRow({
  index,
  quiz,
  locked,
  variant,
  onTake,
  preparing,
}: {
  index: number;
  quiz: NonNullable<CoursePlayerModule["moduleQuiz"]>;
  locked?: boolean;
  variant: PathwayPanelVariant;
  onTake?: () => void;
  preparing?: boolean;
}) {
  const isFigma = variant === "figma";
  const canTake = !!onTake && !locked && !quiz.isPassed;

  const content = (
    <>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            isFigma ? "bg-[#EFF6FF]" : "bg-primary/10"
          )}
        >
          <FileText className={cn("h-4 w-4", isFigma ? "text-[#2563EB]" : "text-primary")} />
        </div>
        <div className="text-left">
          <p className={cn("text-sm font-medium", isFigma && "text-[#111827]")}>
            Assessment {index + 1}: {quiz.title}
          </p>
          <p className={cn("text-xs", isFigma ? "text-[#6B7280]" : "text-muted-foreground")}>
            {quiz.questionCount > 0
              ? `${quiz.questionCount} questions · Pass ${formatModulePassRequirement()}`
              : `${MODULE_QUIZ_QUESTION_COUNT} questions on start · Pass ${formatModulePassRequirement()}`}
            {quiz.isPassed && quiz.bestScore != null && ` · Score ${quiz.bestScore}%`}
            {locked && !quiz.isPassed && " · Complete lessons first"}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {preparing ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : locked && !quiz.isPassed ? (
          <Lock className="h-5 w-5 text-muted-foreground" />
        ) : quiz.isPassed ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : canTake ? (
          <span
            className={cn(
              "text-xs font-semibold",
              isFigma ? "text-[#2563EB]" : "text-primary"
            )}
          >
            {quiz.questionCount === 0 ? "Generate" : quiz.attemptsUsed > 0 ? "Retake" : "Start"}
          </span>
        ) : null}
      </div>
    </>
  );

  if (canTake) {
    return (
      <button
        type="button"
        disabled={preparing}
        onClick={onTake}
        className={cn(
          "flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/40",
          isFigma && "hover:bg-[#F9FAFB]"
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3",
        isFigma ? "bg-[#F9FAFB]/50" : "bg-muted/10"
      )}
    >
      {content}
    </div>
  );
}

function CodingRoundCard({
  codingRound,
  variant,
  onTake,
  preparing,
}: {
  codingRound: NonNullable<CoursePlayerData["codingRound"]>;
  variant: PathwayPanelVariant;
  onTake: () => void;
  preparing: boolean;
}) {
  const isFigma = variant === "figma";

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        isFigma
          ? "border-rose-200 bg-gradient-to-r from-rose-50 to-white"
          : "border-rose-400/30 bg-gradient-to-r from-rose-500/5 to-transparent"
      )}
    >
      <div className="flex items-start gap-3">
        <Code2 className="mt-0.5 h-5 w-5 text-rose-600" />
        <div className="flex-1">
          <h3 className={cn("text-sm font-semibold", isFigma && "text-[#111827]")}>
            Final assessment — {codingRound.title}
          </h3>
          <p className={cn("mt-1 text-xs", isFigma ? "text-[#6B7280]" : "text-muted-foreground")}>
            Unlocks after all module assessments are passed. Pass {codingRound.passingScore}% to
            complete the course.
          </p>
          {codingRound.isPassed ? (
            <p className="mt-2 text-xs text-emerald-600">
              Passed ({codingRound.bestScore}%)
            </p>
          ) : !codingRound.isAvailable ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Complete all modules and pass their assessments first.
            </p>
          ) : (
            <Button
              size="sm"
              className="mt-3 gap-1.5"
              disabled={preparing}
              onClick={onTake}
            >
              {preparing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PlayCircle className="h-3.5 w-3.5" />
              )}
              {codingRound.attemptsUsed > 0
                ? `Retake final assessment (${codingRound.attemptsRemaining} left)`
                : "Take final assessment"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
