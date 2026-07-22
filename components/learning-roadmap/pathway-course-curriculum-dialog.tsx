"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ExternalLink,
  Loader2,
  Lock,
  Upload,
} from "lucide-react";
import {
  useCompletePathwayLevelContent,
  useOpenPathwayCourse,
  usePathwayCourseCurriculum,
  usePreparePathwayFinalAssessment,
} from "@/hooks/use-roadmap-pathway";
import { useAssessmentMutations } from "@/hooks/use-assessments";
import type { RoadmapPathwayCourse } from "@/types/roadmap-pathway";
import type { AttemptResult, AttemptSession } from "@/types/assessments";
import { AssessmentTaker, AttemptResultView } from "@/components/assessments/assessment-taker";
import { CertificateUploadDialog } from "./certificate-upload-dialog";
import { PathwayProgressStepper } from "./pathway-progress-stepper";
import {
  PATHWAY_FINAL_CODE_TOTAL,
  PATHWAY_FINAL_MCQ_TOTAL,
  PATHWAY_FINAL_TOTAL_QUESTIONS,
} from "@/constants/pathway-final-assessment";
import { TechLogo } from "./figma/figma-tech-logos";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PathwayCourseCurriculumDialogProps {
  course: RoadmapPathwayCourse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PathwayCourseCurriculumDialog({
  course,
  open,
  onOpenChange,
}: PathwayCourseCurriculumDialogProps) {
  const slug = course?.slug ?? null;
  const { data, isLoading, isError, error, refetch, isFetching } = usePathwayCourseCurriculum(slug, open);
  const openCourse = useOpenPathwayCourse();
  const completeLevel = useCompletePathwayLevelContent(slug ?? "");
  const prepareFinal = usePreparePathwayFinalAssessment(slug ?? "");
  const assessmentMutations = useAssessmentMutations();

  const [expandedLevel, setExpandedLevel] = useState<string | null>("BASIC");
  const [completingTier, setCompletingTier] = useState<string | null>(null);
  const [preparingFinal, setPreparingFinal] = useState(false);
  const [session, setSession] = useState<AttemptSession | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [certOpen, setCertOpen] = useState(false);

  const handleMarkLevelComplete = async (tier: string) => {
    setCompletingTier(tier);
    try {
      await completeLevel.mutateAsync(tier);
      await refetch();
    } finally {
      setCompletingTier(null);
    }
  };

  const handleTakeFinalAssessment = async () => {
    if (!slug) return;
    setPreparingFinal(true);
    try {
      const prepared = await prepareFinal.mutateAsync();
      const nextSession = await assessmentMutations.startAttempt.mutateAsync(prepared.assessmentId);
      setSession(nextSession);
      setResult(null);
    } finally {
      setPreparingFinal(false);
    }
  };

  const handleAssessmentComplete = (nextResult: AttemptResult) => {
    setResult(nextResult);
    setSession(null);
    void refetch();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange} className="max-w-3xl">
        <DialogContent className="max-h-[90vh] overflow-y-auto" onClose={() => onOpenChange(false)}>
          {course && (
            <div className="flex items-start gap-3">
              <TechLogo type={course.logo} size={44} />
              <div className="min-w-0 flex-1">
                <DialogHeader className="space-y-1 text-left">
                  <DialogTitle>{course.title}</DialogTitle>
                  <DialogDescription>{course.description}</DialogDescription>
                </DialogHeader>
                <p className="mt-2 text-xs text-[#6B7280]">
                  Study each level on {course.provider}, mark content complete, then take one final
                  evaluation (Basic → Expert questions). Upload your provider certificate last.
                </p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading curriculum…
            </div>
          )}

          {isError && !isLoading && (
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800">
              <p className="font-medium">Could not load curriculum</p>
              <p className="text-red-700">
                {error instanceof Error ? error.message : "Please try again or restart the dev server."}
              </p>
              <Button type="button" size="sm" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          )}

          {data && !isLoading && (
            <div className="space-y-4">
              <PathwayProgressStepper
                levelsComplete={data.levelsContentComplete}
                levelsTotal={data.levelsContentTotal}
                assessmentPassed={data.allAssessmentsPassed}
                certificateComplete={data.certificateComplete}
              />

              <div className="rounded-lg border bg-[#F8FAFC] px-4 py-3">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-[#111827]">Course progress</span>
                  <span className="font-semibold text-[#2563EB]">{data.progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#E5E7EB]">
                  <div
                    className="h-full rounded-full bg-[#2563EB] transition-all"
                    style={{ width: `${data.progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-[#6B7280]">
                  Content: {data.levelsContentComplete}/{data.levelsContentTotal} levels · Final
                  assessment:{" "}
                  {data.allAssessmentsPassed ? "Passed" : data.allContentComplete ? "Ready" : "Locked"}
                  {data.allAssessmentsPassed && !data.certificateComplete && (
                    <span className="ml-2 font-medium text-amber-700">
                      · Certificate upload required
                    </span>
                  )}
                  {data.certificateComplete && (
                    <span className="ml-2 font-medium text-emerald-700">· Completed</span>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={openCourse.isPending}
                  onClick={() => course && openCourse.mutate(course.slug)}
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Open on {course?.provider ?? "provider"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={!data.certificateUnlocked || data.certificateComplete}
                  onClick={() => setCertOpen(true)}
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Upload certificate
                </Button>
              </div>

              <div className="space-y-2">
                {data.levels.map((level) => {
                  const expanded = expandedLevel === level.tier;
                  return (
                    <div
                      key={level.tier}
                      className={cn(
                        "rounded-xl border",
                        level.contentStatus === "completed"
                          ? "border-emerald-200 bg-emerald-50/40"
                          : level.isLocked
                            ? "border-[#E5E7EB] bg-[#F9FAFB]"
                            : "border-[#E5E7EB] bg-white"
                      )}
                    >
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-3 text-left"
                        onClick={() => setExpandedLevel(expanded ? null : level.tier)}
                      >
                        {expanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-[#6B7280]" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-[#6B7280]" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#111827]">
                            {level.name}
                            {level.contentStatus === "completed" && (
                              <CheckCircle2 className="ml-2 inline h-4 w-4 text-emerald-600" />
                            )}
                            {level.isLocked && (
                              <Lock className="ml-2 inline h-3.5 w-3.5 text-[#9CA3AF]" />
                            )}
                          </p>
                          <p className="text-xs text-[#6B7280]">
                            {level.contentStatus === "completed"
                              ? "Content completed"
                              : level.isLocked
                                ? "Complete previous level first"
                                : "Study content, then mark complete"}
                          </p>
                        </div>
                      </button>

                      {expanded && (
                        <div className="space-y-2 border-t border-[#E5E7EB] px-4 py-3">
                          <ul className="space-y-1 text-xs text-[#6B7280]">
                            <li>· Watch modules on {course?.provider ?? "your provider"}</li>
                            <li>· Complete practice exercises for this level</li>
                            <li>· Mark complete when you&apos;re ready for the next tier</li>
                          </ul>
                          <ul className="space-y-1.5">
                            {level.topics.map((topic, index) => (
                              <li
                                key={topic.id}
                                className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#374151]"
                              >
                                {index + 1}. {topic.title}
                              </li>
                            ))}
                          </ul>
                          {level.externalUrl && !level.isLocked && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              disabled={openCourse.isPending}
                              onClick={() => course && openCourse.mutate(course.slug)}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Open on {course?.provider ?? "provider"}
                            </Button>
                          )}
                          {level.contentStatus === "available" && (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={completingTier === level.tier || isFetching}
                              onClick={() => void handleMarkLevelComplete(level.tier)}
                            >
                              {completingTier === level.tier ? (
                                <>
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                  Saving…
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                  Mark level content complete
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border border-[#2563EB]/30 bg-[#EFF6FF]/50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">
                      {data.finalAssessment.title}
                    </p>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      One final assessment · {PATHWAY_FINAL_TOTAL_QUESTIONS} questions (
                      {PATHWAY_FINAL_MCQ_TOTAL} MCQ + {PATHWAY_FINAL_CODE_TOTAL} coding) ordered
                      Basic → Expert · Pass {data.finalAssessment.passingScore}%
                    </p>
                    <ul className="mt-2 space-y-0.5 text-xs text-[#6B7280]">
                      {data.finalAssessment.sections.map((section) => (
                        <li key={section.tier}>
                          {section.name}: {section.mcqCount} MCQ + {section.codeCount} coding
                        </li>
                      ))}
                    </ul>
                  </div>
                  {data.finalAssessment.status === "passed" ? (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Passed
                    </span>
                  ) : data.finalAssessment.status === "available" ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={preparingFinal || isFetching}
                      onClick={() => void handleTakeFinalAssessment()}
                    >
                      {preparingFinal ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Preparing…
                        </>
                      ) : (
                        <>
                          <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />
                          Take final assessment
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                      <Lock className="h-3.5 w-3.5" />
                      Complete all level content first
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <Dialog
            open={!!session || !!result}
            onOpenChange={() => {
              setSession(null);
              setResult(null);
            }}
            className="max-w-4xl"
          >
            <DialogContent
              className="max-h-[92vh] overflow-hidden p-4 sm:p-5"
              onClose={() => {
                setSession(null);
                setResult(null);
              }}
            >
              {session && (
                <AssessmentTaker
                  layout="paged"
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
                          void handleTakeFinalAssessment();
                        }
                      : undefined
                  }
                />
              )}
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>

      <CertificateUploadDialog
        course={course}
        open={certOpen}
        onOpenChange={setCertOpen}
        certificateUnlocked={data?.certificateUnlocked ?? course?.certificateUnlocked}
      />
    </>
  );
}
