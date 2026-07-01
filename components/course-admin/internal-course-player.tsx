"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  ExternalLink,
  FileText,
  Film,
  Loader2,
  Lock,
  PenLine,
} from "lucide-react";
import { AssessmentTaker, AttemptResultView } from "@/components/assessments/assessment-taker";
import { PdfEmbed, VideoEmbed } from "@/components/learning-content/open-resource-button";
import { useAssessmentMutations } from "@/hooks/use-assessments";
import { useCompleteLesson, useCoursePlayer } from "@/hooks/use-course-learning";
import type { AttemptResult, AttemptSession } from "@/types/assessments";
import type { CoursePlayerLesson, CoursePlayerModule, CoursePlayerData } from "@/types/course-learning";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const LESSON_ICONS = {
  VIDEO: Film,
  PDF: FileText,
  QUIZ: ClipboardCheck,
  ASSIGNMENT: PenLine,
};

type InternalCoursePlayerProps = {
  courseId: string;
};

export function InternalCoursePlayer({ courseId }: InternalCoursePlayerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonParam = searchParams.get("lesson");

  const { data, isLoading, isError, refetch } = useCoursePlayer(courseId, lessonParam);
  const completeLesson = useCompleteLesson(courseId);
  const assessmentMutations = useAssessmentMutations();

  const [quizSession, setQuizSession] = useState<AttemptSession | null>(null);
  const [quizResult, setQuizResult] = useState<AttemptResult | null>(null);
  const [activeModuleQuizId, setActiveModuleQuizId] = useState<string | null>(null);
  const [codingRoundActive, setCodingRoundActive] = useState(false);

  const selectedLessonId = lessonParam ?? data?.selectedLessonId ?? null;

  const selectedLesson = useMemo(() => {
    if (!data || !selectedLessonId) return null;
    for (const mod of data.modules) {
      const lesson = mod.lessons.find((l) => l.id === selectedLessonId);
      if (lesson) return { module: mod, lesson };
    }
    return null;
  }, [data, selectedLessonId]);

  const selectLesson = useCallback(
    (lessonId: string) => {
      router.replace(`${ROUTES.coursePlayer(courseId)}?lesson=${lessonId}`, { scroll: false });
    },
    [courseId, router]
  );

  async function handleCompleteLesson(lessonId: string) {
    await completeLesson.mutateAsync({ lessonId });
    await refetch();
  }

  async function handleStartModuleQuiz(assessmentId: string, moduleId: string) {
    setActiveModuleQuizId(moduleId);
    setCodingRoundActive(false);
    const session = await assessmentMutations.startAttempt.mutateAsync(assessmentId);
    setQuizSession(session);
    setQuizResult(null);
  }

  async function handleStartCodingRound(assessmentId: string) {
    setActiveModuleQuizId(null);
    setCodingRoundActive(true);
    const session = await assessmentMutations.startAttempt.mutateAsync(assessmentId);
    setQuizSession(session);
    setQuizResult(null);
  }

  useEffect(() => {
    if (!data || lessonParam) return;
    if (data.selectedLessonId) {
      router.replace(`${ROUTES.coursePlayer(courseId)}?lesson=${data.selectedLessonId}`, {
        scroll: false,
      });
    }
  }, [courseId, data, lessonParam, router]);

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
            <Link href={ROUTES.COURSES}>Back to Courses</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (quizSession && !quizResult) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setQuizSession(null)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to course
        </Button>
        <AssessmentTaker
          session={quizSession}
          onClose={() => setQuizSession(null)}
          onComplete={(result) => {
            setQuizResult(result);
            setQuizSession(null);
            refetch();
          }}
        />
      </div>
    );
  }

  if (quizResult) {
    return (
      <div className="space-y-4">
        <AttemptResultView
          result={quizResult}
          onClose={() => {
            setQuizResult(null);
            setActiveModuleQuizId(null);
            refetch();
          }}
          onRetake={
            !quizResult.passed && quizResult.canRetake
              ? () => {
                  setQuizResult(null);
                  if (codingRoundActive && data.codingRound) {
                    handleStartCodingRound(data.codingRound.assessmentId);
                    return;
                  }
                  const mod = data.modules.find((m) => m.id === activeModuleQuizId);
                  if (mod?.moduleQuiz) {
                    handleStartModuleQuiz(mod.moduleQuiz.assessmentId, mod.id);
                  }
                }
              : undefined
          }
        />
        {!quizResult.passed && quizResult.canRetake && (
          <p className="text-center text-sm text-muted-foreground">
            {codingRoundActive
              ? `Score below ${quizResult.passingScore}% — retake the coding round to complete this level.`
              : `Score below ${quizResult.passingScore}% — retake this quiz to unlock the next module.`}
          </p>
        )}
        {!quizResult.passed && !quizResult.canRetake && (
          <p className="text-center text-sm text-destructive">
            No retakes remaining. Contact your instructor for help.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href={ROUTES.LEARNING}>
            <ArrowLeft className="h-4 w-4" />
            Back to Learning
          </Link>
        </Button>
      </div>

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
            Complete each module&apos;s lessons, pass the module quiz (70%+), then the next module unlocks.
            {data.codingRound && " Finish all modules to unlock the coding round."}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3">
          {data.modules.map((mod, index) => (
            <ModuleSidebar
              key={mod.id}
              module={mod}
              index={index}
              selectedLessonId={selectedLessonId}
              onSelectLesson={selectLesson}
            />
          ))}
        </aside>

        <main className="min-w-0">
          {selectedLesson ? (
            <LessonContent
              module={selectedLesson.module}
              lesson={selectedLesson.lesson}
              externalUrl={data.course.externalUrl}
              externalProvider={data.course.externalProvider}
              onComplete={() => handleCompleteLesson(selectedLesson.lesson.id)}
              completing={completeLesson.isPending}
            />
          ) : (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                Select a lesson from the sidebar to begin.
              </CardContent>
            </Card>
          )}

          {selectedLesson?.module.moduleQuiz && (
            <ModuleQuizCard
              module={selectedLesson.module}
              onStartQuiz={() =>
                handleStartModuleQuiz(
                  selectedLesson.module.moduleQuiz!.assessmentId,
                  selectedLesson.module.id
                )
              }
              starting={assessmentMutations.startAttempt.isPending}
            />
          )}

          {data.codingRound && (
            <CodingRoundCard
              codingRound={data.codingRound}
              onStart={() => handleStartCodingRound(data.codingRound!.assessmentId)}
              starting={assessmentMutations.startAttempt.isPending}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function ModuleSidebar({
  module,
  index,
  selectedLessonId,
  onSelectLesson,
}: {
  module: CoursePlayerModule;
  index: number;
  selectedLessonId: string | null;
  onSelectLesson: (lessonId: string) => void;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden",
        !module.isUnlocked && "opacity-60",
        module.isComplete && "border-emerald-400/30"
      )}
    >
      <div className="border-b bg-muted/30 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">
            Module {index + 1}: {module.title}
          </p>
          {!module.isUnlocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
          {module.isComplete && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
        </div>
        <p className="text-xs text-muted-foreground">
          {module.lessonsComplete}/{module.totalLessons} lessons
          {module.moduleQuiz?.isPassed && " · Quiz passed"}
        </p>
      </div>
      <div className="divide-y">
        {module.lessons.map((lesson) => {
          const Icon = LESSON_ICONS[lesson.type];
          const locked = !lesson.isAccessible;
          const done = lesson.progress.status === "COMPLETED";
          return (
            <button
              key={lesson.id}
              type="button"
              disabled={locked}
              onClick={() => onSelectLesson(lesson.id)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                selectedLessonId === lesson.id && "bg-primary/10",
                locked ? "cursor-not-allowed text-muted-foreground" : "hover:bg-muted/40",
                done && "text-emerald-700 dark:text-emerald-300"
              )}
            >
              {locked ? (
                <Lock className="h-3.5 w-3.5 shrink-0" />
              ) : done ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate">{lesson.title}</span>
            </button>
          );
        })}
        {module.moduleQuiz && (
          <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Module quiz
            {module.moduleQuiz.isPassed ? (
              <Badge className="ml-auto bg-emerald-500/15 text-emerald-700">Passed</Badge>
            ) : module.moduleQuiz.attemptsUsed > 0 ? (
              <Badge className="ml-auto bg-destructive/15 text-destructive">Retake</Badge>
            ) : module.moduleQuiz.isAvailable ? (
              <Badge className="ml-auto" variant="outline">
                Ready
              </Badge>
            ) : (
              <Badge className="ml-auto" variant="outline">
                Locked
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function LessonContent({
  module,
  lesson,
  externalUrl,
  externalProvider,
  onComplete,
  completing,
}: {
  module: CoursePlayerModule;
  lesson: CoursePlayerLesson;
  externalUrl: string | null;
  externalProvider: string | null;
  onComplete: () => void;
  completing: boolean;
}) {
  const done = lesson.progress.status === "COMPLETED";

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <p className="text-xs text-muted-foreground">{module.title}</p>
          <h2 className="text-lg font-semibold">{lesson.title}</h2>
        </div>

        {lesson.type === "VIDEO" && lesson.videoUrl && (
          <VideoEmbed src={lesson.videoUrl} title={lesson.title} resetKey={lesson.id} />
        )}

        {lesson.type === "PDF" && lesson.pdfUrl && (
          <PdfEmbed url={lesson.pdfUrl} title={lesson.title} backHref={ROUTES.COURSES} />
        )}

        {lesson.content && (
          <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg border bg-muted/20 p-4">
            <p className="whitespace-pre-wrap text-sm">{lesson.content}</p>
          </div>
        )}

        {externalUrl && (
          <div className="rounded-lg border border-dashed bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              Watch the related content on {externalProvider ?? "the external platform"}, then return
              here to mark this module complete.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3 gap-2">
              <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                Open on {externalProvider ?? "external site"}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        )}

        {lesson.type === "ASSIGNMENT" && lesson.assignmentBrief && (
          <div className="rounded-lg border border-dashed bg-muted/30 p-4">
            <p className="text-sm font-medium">Assignment</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {lesson.assignmentBrief}
            </p>
          </div>
        )}

        {!lesson.videoUrl && !lesson.pdfUrl && !lesson.content && !lesson.assignmentBrief && (
          <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            No content attached to this lesson yet.
          </div>
        )}

        {!done && lesson.isAccessible && (
          <Button disabled={completing} onClick={onComplete}>
            {completing ? "Saving…" : "Mark lesson complete"}
          </Button>
        )}

        {done && (
          <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Lesson completed
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ModuleQuizCard({
  module,
  onStartQuiz,
  starting,
}: {
  module: CoursePlayerModule;
  onStartQuiz: () => void;
  starting: boolean;
}) {
  const quiz = module.moduleQuiz!;
  const allLessonsDone = module.lessonsComplete >= module.totalLessons;

  return (
    <Card className="mt-4 border-purple-400/20">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start gap-3">
          <ClipboardCheck className="mt-0.5 h-5 w-5 text-purple-600" />
          <div>
            <h3 className="font-semibold">Module Quiz — {quiz.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {quiz.questionCount} questions · Pass {quiz.passingScore}% to unlock the next module
            </p>
          </div>
        </div>

        {quiz.isPassed ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Passed {quiz.bestScore != null ? `(${quiz.bestScore}%)` : ""}. Next module unlocked.
          </p>
        ) : quiz.attemptsUsed > 0 && !quiz.canRetake ? (
          <p className="text-sm text-destructive">
            Best score: {quiz.bestScore ?? 0}% — minimum {quiz.passingScore}% required. No retakes
            remaining.
          </p>
        ) : quiz.attemptsUsed > 0 && quiz.canRetake ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">
              Score below {quiz.passingScore}% (best: {quiz.bestScore ?? 0}%). You must retake to
              unlock the next module.
            </p>
            <Button disabled={starting} onClick={onStartQuiz}>
              {starting ? "Starting…" : `Retake quiz (${quiz.attemptsRemaining} left)`}
            </Button>
          </div>
        ) : !allLessonsDone ? (
          <p className="text-sm text-muted-foreground">
            Complete all lessons in this module ({module.lessonsComplete}/{module.totalLessons}) before
            taking the quiz.
          </p>
        ) : quiz.isAvailable ? (
          quiz.questionCount === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating quiz questions…
            </p>
          ) : (
            <Button disabled={starting} onClick={onStartQuiz}>
              {starting ? "Starting…" : "Take module quiz"}
            </Button>
          )
        ) : (
          <p className="text-sm text-muted-foreground">Module quiz is not available yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

function CodingRoundCard({
  codingRound,
  onStart,
  starting,
}: {
  codingRound: NonNullable<CoursePlayerData["codingRound"]>;
  onStart: () => void;
  starting: boolean;
}) {
  return (
    <Card className="mt-4 border-rose-400/30 bg-gradient-to-r from-rose-500/5 to-transparent">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start gap-3">
          <Code2 className="mt-0.5 h-5 w-5 text-rose-600" />
          <div>
            <h3 className="font-semibold">Coding Round — {codingRound.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Practical coding assessment after all modules. Pass {codingRound.passingScore}% to complete
              this level.
            </p>
          </div>
        </div>

        {codingRound.isPassed ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Coding round passed {codingRound.bestScore != null ? `(${codingRound.bestScore}%)` : ""}.
            Level complete!
          </p>
        ) : codingRound.attemptsUsed > 0 && !codingRound.canRetake ? (
          <p className="text-sm text-destructive">
            Best score: {codingRound.bestScore ?? 0}% — minimum {codingRound.passingScore}% required.
            No retakes remaining.
          </p>
        ) : codingRound.attemptsUsed > 0 && codingRound.canRetake ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">
              Score below {codingRound.passingScore}% (best: {codingRound.bestScore ?? 0}%). Retake
              the coding round to complete this level.
            </p>
            <Button disabled={starting} onClick={onStart}>
              {starting ? "Starting…" : `Retake coding round (${codingRound.attemptsRemaining} left)`}
            </Button>
          </div>
        ) : !codingRound.isAvailable ? (
          <p className="text-sm text-muted-foreground">
            Complete all modules and pass their quizzes to unlock the coding round.
          </p>
        ) : codingRound.questionCount === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing coding round questions…
          </p>
        ) : (
          <Button disabled={starting} onClick={onStart}>
            {starting ? "Starting…" : "Start coding round"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
