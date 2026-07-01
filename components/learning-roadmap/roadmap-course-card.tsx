"use client";

import { ChevronRight } from "lucide-react";
import type { SkillRoadmap } from "@/types/learning-roadmap";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  getCardTitle,
  getSkillAccent,
  getSkillInitials,
  getSkillPathDescription,
  getSkillPathStatus,
} from "./roadmap-skill-utils";

const STATUS_LABEL: Record<string, string> = {
  locked: "Locked",
  available: "Ready",
  in_progress: "In Progress",
  completed: "Completed",
};

interface RoadmapCourseCardProps {
  skill: SkillRoadmap;
  selected?: boolean;
  onViewCourse: () => void;
}

export function RoadmapCourseCard({ skill, selected, onViewCourse }: RoadmapCourseCardProps) {
  const status = getSkillPathStatus(skill);
  const accent = getSkillAccent(skill.skillSlug);
  const title = getCardTitle(skill);
  const description = getSkillPathDescription(skill);

  return (
    <article
      className={cn(
        "flex h-full min-h-[220px] flex-col rounded-lg border bg-white p-4 shadow-sm transition-all dark:bg-card",
        selected
          ? "border-2 border-[#2F80ED] shadow-md"
          : "border border-[#E2E8F0] hover:border-[#2F80ED]/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ backgroundColor: accent }}
        >
          {getSkillInitials(skill.skillName)}
        </div>
        {status === "in_progress" && (
          <Badge className="bg-[#2F80ED]/10 text-[10px] font-medium text-[#2F80ED] hover:bg-[#2F80ED]/10">
            In Progress
          </Badge>
        )}
        {status === "completed" && (
          <Badge className="bg-emerald-500/10 text-[10px] font-medium text-emerald-700">
            Completed
          </Badge>
        )}
        {status === "available" && (
          <Badge variant="outline" className="text-[10px] font-medium">
            Ready
          </Badge>
        )}
        {status === "locked" && (
          <Badge variant="secondary" className="text-[10px] font-medium">
            Locked
          </Badge>
        )}
      </div>

      <h3 className="mt-3 text-[15px] font-semibold leading-snug text-[#0F172A] dark:text-foreground">
        {title}
      </h3>
      <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-[#64748B]">
        {description}
      </p>

      <div className="mt-3 flex items-center gap-1.5">
        {skill.steps.map((step, i) => (
          <span
            key={step.id}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold",
              step.status === "completed" && "bg-emerald-100 text-emerald-700",
              step.status === "in_progress" && "bg-[#2F80ED]/15 text-[#2F80ED]",
              step.status === "available" && "bg-slate-100 text-slate-600",
              step.status === "locked" && "bg-slate-100 text-slate-400"
            )}
          >
            {i + 1}
          </span>
        ))}
        <span className="ml-1 text-[11px] text-[#64748B]">
          {skill.totalSteps} Levels
        </span>
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className="text-[#64748B]">Progress</span>
          <span className="font-semibold text-[#2F80ED]">{skill.overallProgress}%</span>
        </div>
        <Progress value={skill.overallProgress} className="h-1.5 bg-[#E2E8F0]" />
      </div>

      <button
        type="button"
        className="mt-4 flex items-center gap-0.5 text-xs font-medium text-[#2F80ED] hover:underline"
        onClick={onViewCourse}
      >
        View course
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}
