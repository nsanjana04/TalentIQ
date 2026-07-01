"use client";

import { useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  GraduationCap,
  Layers,
  Lock,
  PlayCircle,
  Video,
  X,
} from "lucide-react";
import type { SkillRoadmap } from "@/types/learning-roadmap";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CatalogContentTree } from "./catalog-content-tree";
import { CourseModulesPathwayPanel } from "@/components/learning-roadmap/course-modules-pathway-panel";
import { CatalogStatusBadge } from "./catalog-status-badge";
import {
  countTotalAssessments,
  countTotalModules,
  getActiveStep,
  getCatalogStatus,
  getCourseAccent,
  getCourseDescription,
  getCourseDisplayName,
  getCourseInitials,
  getCurrentLevelLabel,
  getDifficulty,
  getEstimatedHours,
  getLearningOutcomes,
  getPrerequisites,
  hasCertificate,
} from "./catalog-utils";

export type CatalogPanelTab = "overview" | "levels" | "content" | "resources";

const TABS: { id: CatalogPanelTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "levels", label: "Levels" },
  { id: "content", label: "Learning Content" },
  { id: "resources", label: "Resources" },
];

function ResourcesList({ skill }: { skill: SkillRoadmap }) {
  const rows = skill.steps.flatMap((step) => {
    const items: React.ReactNode[] = [];
    if (step.course?.externalUrl) {
      items.push(
        <a
          key={`${step.id}-ext`}
          href={step.course.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm hover:bg-muted/40"
        >
          <Video className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="font-medium">{step.course.title}</p>
            <p className="text-xs text-muted-foreground">External course</p>
          </div>
          <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </a>
      );
    }
    if (step.assessment) {
      items.push(
        <div
          key={`${step.id}-quiz`}
          className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm"
        >
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="font-medium">{step.assessment.title}</p>
            <p className="text-xs text-muted-foreground">
              {step.assessment.questionCount} questions
            </p>
          </div>
        </div>
      );
    }
    if (step.certificate) {
      items.push(
        <div
          key={`${step.id}-cert`}
          className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm"
        >
          <Award className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="font-medium">{step.certificate.name}</p>
            <p className="text-xs text-muted-foreground">Certificate template</p>
          </div>
        </div>
      );
    }
    return items;
  });

  if (!rows.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Reference materials will appear here when configured for this course.
      </p>
    );
  }

  return <div className="space-y-2">{rows}</div>;
}

export interface CatalogDetailPanelProps {
  skill: SkillRoadmap;
  roadmapLabel?: string;
  initialTab?: CatalogPanelTab;
  onClose: () => void;
  onContinueLearning?: (skillId: string) => void;
  onStartCourse?: (skillId: string, courseId: string) => void;
  enrolling?: boolean;
}

export function CatalogDetailPanel({
  skill,
  roadmapLabel,
  initialTab = "overview",
  onClose,
  onContinueLearning,
  onStartCourse,
  enrolling,
}: CatalogDetailPanelProps) {
  const [tab, setTab] = useState<CatalogPanelTab>(initialTab);
  const status = getCatalogStatus(skill);
  const accent = getCourseAccent(skill);
  const title = getCourseDisplayName(skill);
  const hours = getEstimatedHours(skill);
  const activeStep = getActiveStep(skill);
  const courseId = activeStep?.course?.id;
  const outcomes = getLearningOutcomes(skill);

  useEffect(() => {
    setTab(initialTab);
  }, [skill.skillId, initialTab]);

  const handleContinue = () => {
    if (!courseId) return;
    if (status === "not_started" && onStartCourse) {
      onStartCourse(skill.skillId, courseId);
      setTab("content");
      return;
    }
    if (onContinueLearning) {
      onContinueLearning(skill.skillId);
    }
    setTab("content");
  };

  const continueLabel =
    status === "not_started"
      ? "Start Course"
      : status === "completed"
        ? "Review Content"
        : "Continue Learning";

  return (
    <aside
      className="flex h-full max-h-[calc(100vh-8rem)] w-full flex-col overflow-hidden border-l bg-card shadow-2xl"
      data-panel="roadmap-catalog-detail"
      role="dialog"
      aria-label={`${title} course details`}
    >
      <div className="shrink-0 border-b px-4 pb-3 pt-4">
        <nav className="mb-3 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
          <span>Learning Pathways</span>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate">{roadmapLabel ?? skill.skillName}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate font-medium text-foreground">{title}</span>
        </nav>

        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ backgroundColor: accent }}
          >
            {getCourseInitials(skill)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-base font-semibold leading-tight">{title}</h2>
                <CatalogStatusBadge status={status} className="mt-1.5" />
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {courseId && (
          <Button
            className="mt-3 h-10 w-full gap-2"
            disabled={enrolling}
            onClick={handleContinue}
          >
            <PlayCircle className="h-4 w-4" />
            {enrolling ? "Starting…" : continueLabel}
          </Button>
        )}

        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-medium text-muted-foreground">Your Progress</span>
            <span className="font-semibold text-primary">{skill.overallProgress}%</span>
          </div>
          <Progress value={skill.overallProgress} className="h-1.5" />
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            {skill.totalSteps} Levels
          </span>
          <span className="inline-flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5" />
            {getDifficulty(skill)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />~{hours} Hours
          </span>
          {hasCertificate(skill) && (
            <span className="inline-flex items-center gap-1">
              <Award className="h-3.5 w-3.5" />
              Certificate
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {getCurrentLevelLabel(skill)}
          </span>
        </div>
      </div>

      <div className="shrink-0 flex overflow-x-auto border-b px-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors",
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.id === "levels" ? `${t.label} (${skill.totalSteps})` : t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {tab === "overview" && (
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Course Description
              </h3>
              <p className="mt-1.5 leading-relaxed text-muted-foreground">
                {getCourseDescription(skill)}
              </p>
            </section>

            {outcomes.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Learning Outcomes
                </h3>
                <ul className="mt-1.5 list-inside list-disc space-y-1 text-muted-foreground">
                  {outcomes.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Skills Covered
              </h3>
              <p className="mt-1.5 text-muted-foreground">{skill.skillName}</p>
              {skill.categoryName && (
                <p className="text-xs text-muted-foreground">{skill.categoryName}</p>
              )}
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Prerequisites
              </h3>
              <p className="mt-1.5 text-muted-foreground">{getPrerequisites(skill)}</p>
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Estimated Completion Time
              </h3>
              <p className="mt-1.5 text-muted-foreground">~{hours} hours</p>
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Certification Requirements
              </h3>
              <p className="mt-1.5 text-muted-foreground">
                {hasCertificate(skill)
                  ? "Complete all levels, pass assessments, and earn your certificate."
                  : "No certificate is configured for this path."}
              </p>
            </section>
          </div>
        )}

        {tab === "levels" && (
          <div className="space-y-2">
            {skill.steps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-2.5",
                  step.status === "in_progress" && "border-primary/30 bg-primary/5"
                )}
              >
                <div className="min-w-0 pr-2">
                  <p className="text-sm font-medium">
                    Level {step.levelRank}: {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.levelName}</p>
                </div>
                {step.status === "locked" ? (
                  <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <span className="shrink-0 text-[10px] font-medium text-primary">
                    {step.status === "in_progress"
                      ? "In Progress"
                      : step.status === "completed"
                        ? "Completed"
                        : "Available"}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "content" && (
          <div className="space-y-4">
            {courseId ? (
              <CourseModulesPathwayPanel courseId={courseId} />
            ) : (
              <CatalogContentTree steps={skill.steps} />
            )}
          </div>
        )}

        {tab === "resources" && (
          <ResourcesList skill={skill} />
        )}
      </div>

      <div className="shrink-0 grid grid-cols-2 gap-px border-t bg-border sm:grid-cols-4">
        {[
          { label: "Total Modules", value: countTotalModules(skill) || "—" },
          { label: "Total Assessments", value: countTotalAssessments(skill) },
          { label: "Estimated Time", value: `~${hours}h` },
          { label: "Certificate", value: hasCertificate(skill) ? "Yes" : "No" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card px-3 py-2.5 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-0.5 text-sm font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
