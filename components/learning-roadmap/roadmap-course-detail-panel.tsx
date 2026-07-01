"use client";

import { useEffect, useState } from "react";
import {
  Award,
  ChevronRight,
  Clock,
  GraduationCap,
  Layers,
  Lock,
  PlayCircle,
  X,
} from "lucide-react";
import type { LevelStepStatus, SkillRoadmap } from "@/types/learning-roadmap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CourseModulesAccordion } from "./course-modules-accordion";
import {
  getActiveStep,
  getCardTitle,
  getDifficultyLabel,
  getSkillAccent,
  getSkillInitials,
  getSkillPathDescription,
  getSkillPathHours,
  getSkillPathStatus,
} from "./roadmap-skill-utils";

type DetailTab = "overview" | "levels" | "content" | "resources";

const TABS: { id: DetailTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "levels", label: "Levels" },
  { id: "content", label: "Learning Content" },
  { id: "resources", label: "Resources" },
];

interface RoadmapCourseDetailPanelProps {
  skill: SkillRoadmap;
  embedded?: boolean;
  onClose: () => void;
  onStartCourse?: (courseId: string) => void;
  onContinueCourse?: (courseId: string) => void;
  starting?: boolean;
}

export function RoadmapCourseDetailPanel({
  skill,
  embedded = false,
  onClose,
  onStartCourse,
  onContinueCourse,
  starting,
}: RoadmapCourseDetailPanelProps) {
  const [tab, setTab] = useState<DetailTab>("content");
  const status = getSkillPathStatus(skill);
  const accent = getSkillAccent(skill.skillSlug);
  const activeStep = getActiveStep(skill);
  const hours = getSkillPathHours(skill);
  const title = getCardTitle(skill);
  const courseId = activeStep?.course?.id;

  useEffect(() => {
    setTab("content");
  }, [skill.skillId]);

  const handleContinue = () => {
    if (!activeStep?.course) return;
    if (activeStep.status === "available" && onStartCourse) {
      onStartCourse(activeStep.course.id);
    } else if (onContinueCourse) {
      onContinueCourse(activeStep.course.id);
    }
  };

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden bg-white dark:bg-card",
        !embedded && "rounded-xl border border-[#E2E8F0] shadow-lg"
      )}
      data-panel="roadmap-detail-v2"
    >
      {/* Header */}
      <div className="shrink-0 border-b border-[#E2E8F0] px-4 pb-3 pt-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ backgroundColor: accent }}
          >
            {getSkillInitials(skill.skillName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-semibold leading-tight text-[#0F172A] dark:text-foreground">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#64748B] hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {status === "in_progress" && (
              <Badge className="mt-1.5 bg-[#2F80ED]/10 text-[10px] font-medium text-[#2F80ED] hover:bg-[#2F80ED]/10">
                In Progress
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#64748B]">
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            {skill.totalSteps} Levels
          </span>
          <span className="flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5" />
            {getDifficultyLabel(skill)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />~{hours} Hours
          </span>
          <span className="flex items-center gap-1">
            <Award className="h-3.5 w-3.5" />
            Certificate
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex border-b border-[#E2E8F0] px-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 border-b-2 px-2.5 py-2.5 text-[11px] font-medium transition-colors",
              tab === t.id
                ? "border-[#2F80ED] text-[#2F80ED]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            )}
          >
            {t.id === "levels" ? `${t.label} (${skill.totalSteps})` : t.label}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="shrink-0 border-b border-[#E2E8F0] px-4 py-3">
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="font-medium text-[#64748B]">Course Progress</span>
          <span className="font-semibold text-[#2F80ED]">{skill.overallProgress}%</span>
        </div>
        <Progress value={skill.overallProgress} className="h-1.5 bg-[#E2E8F0]" />
      </div>

      {/* Scrollable body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {tab === "overview" && (
          <p className="text-sm leading-relaxed text-[#64748B]">{getSkillPathDescription(skill)}</p>
        )}

        {tab === "levels" && (
          <div className="space-y-2">
            {skill.steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border border-[#E2E8F0] px-3 py-2.5",
                  step.status === "in_progress" && "border-[#2F80ED]/30 bg-[#2F80ED]/5"
                )}
              >
                <div className="min-w-0 pr-2">
                  <p className="text-sm font-medium">{index + 1}. {step.title}</p>
                  <p className="text-xs text-[#64748B]">{step.levelCode}</p>
                </div>
                {step.status === "locked" ? (
                  <Lock className="h-4 w-4 shrink-0 text-[#94A3B8]" />
                ) : (
                  <span className="shrink-0 text-[10px] font-medium text-[#2F80ED]">
                    {step.status === "in_progress" ? "In Progress" : step.status === "completed" ? "Done" : "Ready"}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "content" && (
          courseId ? (
            <CourseModulesAccordion courseId={courseId} />
          ) : (
            <p className="text-sm text-[#64748B]">No course content linked yet.</p>
          )
        )}

        {tab === "resources" && (
          <div className="space-y-2">
            {skill.steps.map((step) => (
              <div key={step.id} className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm">
                <p className="font-medium">{step.levelCode}</p>
                {step.assessment && (
                  <p className="mt-1 text-xs text-[#64748B]">{step.assessment.title}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick navigation */}
      <div className="shrink-0 border-t border-[#E2E8F0] px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
          Quick navigation
        </p>
        <ul className="mt-1">
          {[
            { label: "Learning Content", target: "content" as const },
            { label: "Assessments", target: "levels" as const },
            { label: "Resources", target: "resources" as const },
          ].map((item) => (
            <li key={item.label}>
              <button
                type="button"
                className="flex w-full items-center justify-between py-1.5 text-sm text-[#64748B] hover:text-[#0F172A]"
                onClick={() => setTab(item.target)}
              >
                {item.label}
                <ChevronRight className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Continue button */}
      {activeStep?.course && (
        <div className="shrink-0 border-t border-[#E2E8F0] p-4">
          <Button
            className="h-11 w-full gap-2 bg-[#2F80ED] text-white hover:bg-[#2F80ED]/90"
            disabled={starting}
            onClick={handleContinue}
          >
            <PlayCircle className="h-4 w-4" />
            {starting ? "Starting…" : "Continue Learning"}
          </Button>
        </div>
      )}
    </aside>
  );
}
