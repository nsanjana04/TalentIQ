"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Play } from "lucide-react";
import { useAssessmentMutations, useAvailableAssessments } from "@/hooks/use-assessments";
import type { AttemptResult, AttemptSession } from "@/types/assessments";
import { AssessmentTaker, AttemptResultView } from "./assessment-taker";
import { AssessmentGradingInfo } from "@/components/assessments/assessment-grading-info";
import { MODULE_QUIZ_QUESTION_COUNT } from "@/constants/assessment-prompts";
import { formatModulePassRequirement } from "@/lib/assessments/exam-grading-policy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { apiClient } from "@/lib/api-client";
import type { PrepareModuleAssessmentResult } from "@/types/course-learning";

export function MyAssessmentsPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentIdParam = searchParams.get("assessmentId");
  const courseIdParam = searchParams.get("courseId");
  const moduleIdParam = searchParams.get("moduleId");

  const { data: available, isLoading, refetch } = useAvailableAssessments({ enabled: true });
  const mutations = useAssessmentMutations();
  const [takerSession, setTakerSession] = useState<AttemptSession | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [retakeId, setRetakeId] = useState<string | null>(null);
  const [autoStarting, setAutoStarting] = useState(false);
  const autoStarted = useRef(false);

  const returnHref = courseIdParam ? ROUTES.coursePlayer(courseIdParam) : null;

  async function handleStart(assessmentId: string) {
    if (moduleIdParam) {
      await apiClient.post<PrepareModuleAssessmentResult>(
        `/api/courses/modules/${moduleIdParam}/prepare-assessment`
      );
    }
    const session = await mutations.startAttempt.mutateAsync(assessmentId);
    setTakerSession(session);
    setResult(null);
    setRetakeId(assessmentId);
  }

  useEffect(() => {
    if (!assessmentIdParam || autoStarted.current || takerSession || result) return;
    autoStarted.current = true;
    setAutoStarting(true);
    handleStart(assessmentIdParam)
      .catch(() => {
        autoStarted.current = false;
      })
      .finally(() => setAutoStarting(false));
  }, [assessmentIdParam, result, takerSession]);

  function handleCloseResult() {
    setResult(null);
    setRetakeId(null);
    if (courseIdParam) {
      router.push(ROUTES.coursePlayer(courseIdParam));
      return;
    }
    if (assessmentIdParam) {
      router.replace("/assessments?tab=take");
    }
    refetch();
  }

  if (autoStarting) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p>Generating questions from module content…</p>
            <p className="max-w-md text-center text-xs">
              AI generates {MODULE_QUIZ_QUESTION_COUNT} module-scoped questions, then opens the
              exam. Pass with {formatModulePassRequirement()}.
            </p>
          </CardContent>
        </Card>
        <AssessmentGradingInfo />
      </div>
    );
  }

  if (takerSession && !result) {
    return (
      <div className="space-y-4">
        {returnHref && (
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href={returnHref}>
              <ArrowLeft className="h-4 w-4" />
              Back to course
            </Link>
          </Button>
        )}
        <AssessmentTaker
          session={takerSession}
          onClose={() => setTakerSession(null)}
          onComplete={(r) => {
            setResult(r);
            setTakerSession(null);
            refetch();
          }}
        />
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-4">
        {returnHref && (
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href={returnHref}>
              <ArrowLeft className="h-4 w-4" />
              Back to course
            </Link>
          </Button>
        )}
        <AttemptResultView
          result={result}
          onClose={handleCloseResult}
          onRetake={
            !result.passed && result.canRetake && retakeId
              ? () => {
                  setResult(null);
                  handleStart(retakeId);
                }
              : undefined
          }
        />
        {!result.passed && result.canRetake && courseIdParam && (
          <p className="text-center text-sm text-muted-foreground">
            Retake to unlock the next module, or return to the course when ready.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card/50 p-4">
        <div className="flex items-start gap-3">
          <Play className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold">My Assessments</h2>
            <p className="text-sm text-muted-foreground">
              Take published assessments assigned to you. View your attempt limits, best scores,
              and retake options here.
            </p>
            {moduleIdParam && courseIdParam && (
              <p className="mt-2 text-xs text-muted-foreground">
                Module assessment — return to your course after completing.
              </p>
            )}
          </div>
        </div>
      </div>

      {returnHref && (
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href={returnHref}>
            <ArrowLeft className="h-4 w-4" />
            Back to course
          </Link>
        </Button>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your assessments…
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {available?.map((a) => (
            <Card key={a.id} className="border-primary/10">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {a.questionCount} questions · Pass {a.passingScore}%
                      {a.timeLimitMinutes && ` · ${a.timeLimitMinutes} min`}
                    </p>
                    {a.courseTitle && (
                      <p className="mt-1 text-xs text-muted-foreground">Course: {a.courseTitle}</p>
                    )}
                  </div>
                  {a.passed && (
                    <Badge className="bg-emerald-500/15 text-emerald-700">Passed</Badge>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>
                    Attempts: {a.attemptsUsed}/{a.maxRetakes}
                  </span>
                  {a.bestScore !== null && <span>Best: {a.bestScore}%</span>}
                </div>
                <Button
                  size="sm"
                  className="mt-4"
                  disabled={a.passed || (!a.canRetake && a.attemptsUsed >= a.maxRetakes)}
                  onClick={() => {
                    setRetakeId(a.id);
                    handleStart(a.id);
                  }}
                >
                  {a.passed
                    ? "Completed"
                    : a.attemptsUsed > 0
                      ? a.canRetake
                        ? "Retake"
                        : "No retakes left"
                      : "Start Assessment"}
                </Button>
              </CardContent>
            </Card>
          ))}
          {!available?.length && (
            <p className="col-span-2 py-12 text-center text-muted-foreground">
              No published assessments are available for you right now.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
