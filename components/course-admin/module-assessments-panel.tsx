"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  Loader2,
  Lock,
  RefreshCw,
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  useGenerateAllModuleAssessments,
  useGenerateModuleAssessmentQuestions,
  useModuleAssessments,
  useSetupModuleAssessments,
} from "@/hooks/use-course-learning";
import type { CourseDetail } from "@/types/course-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ModuleAssessmentsPanelProps {
  course: CourseDetail;
}

export function ModuleAssessmentsPanel({ course }: ModuleAssessmentsPanelProps) {
  const { data, isLoading, refetch, isFetching } = useModuleAssessments(course.id);
  const setup = useSetupModuleAssessments(course.id);
  const generateAll = useGenerateAllModuleAssessments(course.id);
  const [generatingModuleId, setGeneratingModuleId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const modules = data?.modules ?? [];
  const aiEnabled = data?.aiEnabled ?? false;

  async function handleSetup() {
    setLastResult(null);
    const result = await setup.mutateAsync();
    setLastResult(
      `Created ${result.created} module quiz${result.created === 1 ? "" : "zes"}. ${result.skipped} already linked.`
    );
    await refetch();
  }

  async function handleGenerateAll(force = false) {
    setLastResult(null);
    const result = await generateAll.mutateAsync({
      force,
      questionCount: 6,
      setupMissing: true,
    });
    setLastResult(
      `Generated questions for ${result.generatedCount} module${result.generatedCount === 1 ? "" : "s"}. ${result.skippedCount} already had questions.`
    );
    await refetch();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading module assessments…
      </div>
    );
  }

  if (!course.modules.length) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Add modules and lessons in Course Builder before setting up module quizzes.
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
                <h3 className="text-lg font-semibold">Module Checkpoint Quizzes (Phase 1)</h3>
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Each module gets its own quiz generated from that module&apos;s lessons only.
                Learners must pass the module quiz before the next module unlocks.
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

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={setup.isPending || isFetching}
              onClick={handleSetup}
            >
              {setup.isPending ? "Setting up…" : "Setup module quizzes"}
            </Button>
            <Button
              size="sm"
              disabled={generateAll.isPending || isFetching}
              onClick={() => handleGenerateAll(false)}
              className="gap-2"
            >
              {generateAll.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Generate all module questions
            </Button>
            {modules.some((m) => m.questionCount > 0) && (
              <Button
                size="sm"
                variant="outline"
                disabled={generateAll.isPending || isFetching}
                onClick={() => handleGenerateAll(true)}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate all
              </Button>
            )}
          </div>

          {lastResult && (
            <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {lastResult}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {modules.map((mod, index) => (
          <ModuleAssessmentRow
            key={mod.moduleId}
            module={mod}
            index={index}
            courseId={course.id}
            isGenerating={generatingModuleId === mod.moduleId}
            onGenerateStart={() => setGeneratingModuleId(mod.moduleId)}
            onGenerateEnd={() => {
              setGeneratingModuleId(null);
              refetch();
            }}
            disabled={isFetching || generateAll.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function ModuleAssessmentRow({
  module,
  index,
  courseId,
  isGenerating,
  onGenerateStart,
  onGenerateEnd,
  disabled,
}: {
  module: import("@/types/course-admin").ModuleAssessmentStatus;
  index: number;
  courseId: string;
  isGenerating: boolean;
  onGenerateStart: () => void;
  onGenerateEnd: () => void;
  disabled: boolean;
}) {
  const generate = useGenerateModuleAssessmentQuestions(module.moduleId, courseId);

  async function handleGenerate(force = false) {
    onGenerateStart();
    try {
      await generate.mutateAsync({ force, questionCount: 6 });
    } finally {
      onGenerateEnd();
    }
  }

  return (
    <Card className={cn(!module.assessmentId && "border-dashed")}>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            <p className="font-medium">
              Module {index + 1}: {module.moduleTitle}
            </p>
            {index > 0 && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Lock className="h-3 w-3" />
                Gated
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {module.assessmentId
              ? `${module.assessmentTitle} · ${module.questionCount} question${module.questionCount === 1 ? "" : "s"}`
              : "No module quiz linked yet"}
            {module.requireQuizPass && module.assessmentId && " · Pass required to unlock next module"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {module.assessmentId && (
            <>
              <Button
                size="sm"
                disabled={disabled || isGenerating || generate.isPending}
                onClick={() => handleGenerate(false)}
              >
                {isGenerating || generate.isPending ? "Generating…" : "Generate"}
              </Button>
              {module.questionCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={disabled || isGenerating || generate.isPending}
                  onClick={() => handleGenerate(true)}
                >
                  Regenerate
                </Button>
              )}
            </>
          )}
          {module.isPublished && module.questionCount > 0 && (
            <Badge className="bg-emerald-500/15 text-emerald-700">Ready</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
