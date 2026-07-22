"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  ExternalLink,
  Loader2,
  Lock,
  PlayCircle,
} from "lucide-react";
import {
  useCompleteModule,
  useCoursePlayer,
  usePrepareModuleAssessment,
} from "@/hooks/use-course-learning";
import type { CoursePlayerData, CoursePlayerModule } from "@/types/course-learning";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

type ModulePathwayPlayerProps = {
  courseId: string;
};

export function ModulePathwayPlayer({ courseId }: ModulePathwayPlayerProps) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useCoursePlayer(courseId);
  const completeModule = useCompleteModule(courseId);
  const prepareAssessment = usePrepareModuleAssessment(courseId);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [preparingModuleId, setPreparingModuleId] = useState<string | null>(null);
  const [markingModuleId, setMarkingModuleId] = useState<string | null>(null);

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
        await handleTakeAssessment(completed);
        return;
      }
      await refetch();
    } finally {
      setMarkingModuleId(null);
    }
  }

  async function handleTakeAssessment(module: CoursePlayerModule) {
    setPreparingModuleId(module.id);
    try {
      const result = await prepareAssessment.mutateAsync(module.id);
      router.push(
        ROUTES.assessmentTake(result.assessmentId, { courseId, moduleId: module.id })
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading course…
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="space-y-4 py-16 text-center">
          <p className="text-muted-foreground">Could not load this course.</p>
          <Button asChild variant="outline">
            <Link href={ROUTES.LEARNING}>Back to Learning</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href={ROUTES.LEARNING}>
          <ArrowLeft className="h-4 w-4" />
          Back to Learning
        </Link>
      </Button>

      <CourseHeader data={data} />

      <div className="space-y-3">
        {data.modules.map((module, index) => (
          <ModulePathCard
            key={module.id}
            module={module}
            index={index}
            course={data.course}
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
      </div>

      {data.codingRound && (
        <CodingRoundPathCard
          codingRound={data.codingRound}
          onTakeAssessment={handleTakeCodingRound}
          preparing={preparingModuleId === "coding-round"}
        />
      )}
    </div>
  );
}

function CourseHeader({ data }: { data: CoursePlayerData }) {
  return (
    <Card className="border-primary/10">
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{data.course.title}</h1>
            {data.course.description && (
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                {data.course.description}
              </p>
            )}
          </div>
          <Badge variant="outline">{data.overallProgress}% complete</Badge>
        </div>
        <Progress value={data.overallProgress} />
        <p className="text-xs text-muted-foreground">
          Complete each module, pass its assessment (70%+), then the next module unlocks.
        </p>
      </CardContent>
    </Card>
  );
}

function ModulePathCard({
  module,
  index,
  course,
  expanded,
  onToggle,
  onMarkComplete,
  onTakeAssessment,
  marking,
  preparing,
}: {
  module: CoursePlayerModule;
  index: number;
  course: CoursePlayerData["course"];
  expanded: boolean;
  onToggle: () => void;
  onMarkComplete: () => void;
  onTakeAssessment: () => void;
  marking: boolean;
  preparing: boolean;
}) {
  const lesson = module.lessons[0];
  const locked = !module.isUnlocked;
  const quiz = module.moduleQuiz;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow",
        locked && "opacity-60",
        module.isComplete && "border-emerald-400/30"
      )}
    >
      <CardContent className="p-0">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/20 px-4 py-3">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                module.isComplete && "bg-emerald-500/10 text-emerald-700",
                !module.isComplete && module.isUnlocked && "bg-primary/10 text-primary",
                locked && "bg-muted text-muted-foreground"
              )}
            >
              {locked ? <Lock className="h-4 w-4" /> : index + 1}
            </div>
            <div>
              <p className="font-semibold">
                Module {index + 1}: {module.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {module.isContentComplete
                  ? "Module completed"
                  : module.isUnlocked
                    ? "In progress"
                    : "Locked — pass previous assessment"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {module.isComplete && (
              <Badge className="bg-emerald-500/15 text-emerald-700">Done</Badge>
            )}
            {quiz?.isPassed && <Badge className="bg-emerald-500/15 text-emerald-700">Quiz passed</Badge>}
            {quiz && quiz.attemptsUsed > 0 && !quiz.isPassed && (
              <Badge variant="outline" className="border-destructive/40 text-destructive">
                Retake needed
              </Badge>
            )}
          </div>
        </div>

        {expanded && lesson?.content && (
          <div className="border-b px-4 py-3 text-sm text-muted-foreground">
            <p className="whitespace-pre-wrap">{lesson.content}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 px-4 py-3">
          <Button
            size="sm"
            variant="outline"
            disabled={locked}
            onClick={onToggle}
            className="gap-2"
          >
            <BookOpen className="h-3.5 w-3.5" />
            {expanded ? "Hide details" : "Start"}
          </Button>

          {course.externalUrl && (
            <Button asChild size="sm" variant="outline" disabled={locked} className="gap-2">
              <a href={course.externalUrl} target="_blank" rel="noopener noreferrer">
                Open on {course.externalProvider ?? "external site"}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}

          {!module.isContentComplete && (
            <Button
              size="sm"
              disabled={locked || marking}
              onClick={onMarkComplete}
              className="gap-2"
            >
              {marking ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Mark as complete
            </Button>
          )}

          {module.isContentComplete && quiz && !quiz.isPassed && quiz.isAvailable && (
            <Button
              size="sm"
              disabled={preparing}
              onClick={onTakeAssessment}
              className="gap-2"
            >
              {preparing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ClipboardCheck className="h-3.5 w-3.5" />
              )}
              {quiz.attemptsUsed > 0 ? `Retake assessment (${quiz.attemptsRemaining} left)` : "Take assessment"}
            </Button>
          )}

          {module.isContentComplete && quiz?.isPassed && (
            <span className="flex items-center gap-1 self-center text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              Assessment passed ({quiz.bestScore}%)
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CodingRoundPathCard({
  codingRound,
  onTakeAssessment,
  preparing,
}: {
  codingRound: NonNullable<CoursePlayerData["codingRound"]>;
  onTakeAssessment: () => void;
  preparing: boolean;
}) {
  return (
    <Card className="border-rose-400/30 bg-gradient-to-r from-rose-500/5 to-transparent">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start gap-3">
          <Code2 className="mt-0.5 h-5 w-5 text-rose-600" />
          <div>
            <h3 className="font-semibold">Coding Round — {codingRound.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Final practical assessment after all modules. Pass {codingRound.passingScore}% to
              complete this level.
            </p>
          </div>
        </div>

        {codingRound.isPassed ? (
          <p className="text-sm text-emerald-600">Passed ({codingRound.bestScore}%)</p>
        ) : !codingRound.isAvailable ? (
          <p className="text-sm text-muted-foreground">
            Complete all modules and pass their assessments first.
          </p>
        ) : (
          <Button disabled={preparing} onClick={onTakeAssessment} className="gap-2">
            {preparing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            {codingRound.attemptsUsed > 0
              ? `Retake coding round (${codingRound.attemptsRemaining} left)`
              : "Take coding round"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
