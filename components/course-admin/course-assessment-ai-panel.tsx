"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ClipboardCheck,
  Loader2,
  RefreshCw,
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  useCourseAssessments,
  useGenerateCourseAssessmentQuestions,
} from "@/hooks/use-course-admin";
import type { CourseDetail } from "@/types/course-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

interface CourseAssessmentAiPanelProps {
  course: CourseDetail;
}

export function CourseAssessmentAiPanel({ course }: CourseAssessmentAiPanelProps) {
  const { data, isLoading, refetch, isFetching } = useCourseAssessments(course.id);
  const generate = useGenerateCourseAssessmentQuestions(course.id);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const assessments = data?.assessments ?? [];
  const activeAssessmentId = selectedAssessmentId ?? assessments[0]?.id ?? null;
  const activeAssessment = assessments.find((a) => a.id === activeAssessmentId) ?? null;
  const aiEnabled = data?.aiEnabled ?? false;

  async function handleGenerate(force = false) {
    if (!activeAssessmentId) return;
    setLastResult(null);
    const result = await generate.mutateAsync({
      assessmentId: activeAssessmentId,
      force,
      questionCount: 8,
    });
    if (result.generated) {
      setLastResult(
        result.aiPowered
          ? `Generated ${result.questionCount} AI questions for "${result.assessmentTitle}".`
          : `Generated ${result.questionCount} syllabus-based questions for "${result.assessmentTitle}" (AI unavailable — used course structure).`
      );
    } else {
      setLastResult(
        `"${result.assessmentTitle}" already has ${result.questionCount} questions. Use Regenerate to replace them.`
      );
    }
    await refetch();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading linked assessments…
      </div>
    );
  }

  if (!assessments.length) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start gap-3">
            <ClipboardCheck className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">No assessment linked yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Link an assessment to this course before generating questions. You can create one
                in the Assessments catalog and set its course, or add a quiz lesson in Course
                Builder and assign an assessment to it.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link href={ROUTES.ASSESSMENTS}>Open Assessments</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">AI Assessment Question Generator</h3>
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Generate quiz questions from this course&apos;s modules, lessons, and descriptions.
                Questions are added to the linked assessment for learners to take after completing
                the course content.
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                aiEnabled
                  ? "border-emerald-400/40 text-emerald-700 dark:text-emerald-300"
                  : "text-muted-foreground"
              )}
            >
              {aiEnabled ? "Gemini AI enabled" : "Syllabus fallback mode"}
            </Badge>
          </div>

          {!aiEnabled && (
            <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Set <code className="rounded bg-muted px-1">AI_COPILOT_LLM_ENABLED=true</code>,{" "}
              <code className="rounded bg-muted px-1">AI_LLM_PROVIDER=gemini</code>, and{" "}
              <code className="rounded bg-muted px-1">GEMINI_API_KEY</code> in your environment to
              use Google Gemini for smarter questions. Without it, questions are built from the
              course syllabus structure.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-2">
            <p className="text-sm font-medium">Linked assessments</p>
            <div className="space-y-2">
              {assessments.map((assessment) => (
                <button
                  key={assessment.id}
                  type="button"
                  onClick={() => setSelectedAssessmentId(assessment.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                    activeAssessmentId === assessment.id
                      ? "border-primary/40 bg-primary/5"
                      : "hover:bg-muted/40"
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-medium">{assessment.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {assessment.linkType === "lesson"
                        ? `Quiz lesson: ${assessment.lessonTitle ?? "Linked lesson"}`
                        : "Linked to course"}
                      {" · "}
                      {assessment.questionCount} question
                      {assessment.questionCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {assessment.isPublished ? "Published" : "Draft"}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {activeAssessment && (
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button
                disabled={generate.isPending || isFetching}
                onClick={() => handleGenerate(false)}
                className="gap-2"
              >
                {generate.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generate questions
                  </>
                )}
              </Button>
              {activeAssessment.questionCount > 0 && (
                <Button
                  variant="outline"
                  disabled={generate.isPending || isFetching}
                  onClick={() => handleGenerate(true)}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate (replace all)
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link href={ROUTES.ASSESSMENTS}>Review in Assessments</Link>
              </Button>
            </div>
          )}

          {lastResult && (
            <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {lastResult}
            </p>
          )}

          {generate.isError && (
            <p className="text-sm text-destructive">
              {generate.error instanceof Error
                ? generate.error.message
                : "Could not generate assessment questions."}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Course content used for generation</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              {course.stats.moduleCount} module{course.stats.moduleCount === 1 ? "" : "s"},{" "}
              {course.stats.lessonCount} lesson{course.stats.lessonCount === 1 ? "" : "s"}
            </li>
            {course.description && <li>Course description and lesson notes</li>}
            <li>Multiple choice, true/false, and short answer question types</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
