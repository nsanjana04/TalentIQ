"use client";

import { memo, useCallback, useRef, useState } from "react";
import { Award, ChevronRight, Clock, Layers, MoreHorizontal } from "lucide-react";
import type { SkillRoadmap } from "@/types/learning-roadmap";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CatalogLevelMilestones } from "./catalog-level-milestones";
import { CatalogStatusBadge } from "./catalog-status-badge";
import {
  getCatalogStatus,
  getCourseAccent,
  getCourseDescription,
  getCourseDisplayName,
  getCourseInitials,
  getEstimatedHours,
  hasCertificate,
} from "./catalog-utils";

export interface CatalogCardActions {
  onViewCourse: (skillId: string) => void;
  onStartCourse?: (skillId: string, courseId: string) => void;
  onContinueCourse?: (skillId: string) => void;
}

interface CatalogCardProps extends CatalogCardActions {
  skill: SkillRoadmap;
  selected?: boolean;
}

function CatalogCardInner({
  skill,
  selected,
  onViewCourse,
  onStartCourse,
  onContinueCourse,
}: CatalogCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const status = getCatalogStatus(skill);
  const accent = getCourseAccent(skill);
  const title = getCourseDisplayName(skill);
  const description = getCourseDescription(skill);
  const hours = getEstimatedHours(skill);
  const activeStep = skill.steps.find((s) => s.status === "in_progress") ??
    skill.steps.find((s) => s.status === "available");
  const courseId = activeStep?.course?.id;

  const handleView = useCallback(() => {
    onViewCourse(skill.skillId);
  }, [onViewCourse, skill.skillId]);

  return (
    <article
      className={cn(
        "flex h-full min-h-[248px] flex-col rounded-lg border bg-card p-4 shadow-sm transition-shadow",
        selected ? "border-primary ring-1 ring-primary/20" : "border-border hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ backgroundColor: accent }}
          aria-hidden
        >
          {getCourseInitials(skill)}
        </div>
        <CatalogStatusBadge status={status} />
      </div>

      <h3 className="mt-3 line-clamp-2 text-[15px] font-semibold leading-snug">{title}</h3>
      <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>

      <div className="mt-3 space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Levels
        </p>
        <CatalogLevelMilestones skill={skill} />
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold text-primary">{skill.overallProgress}%</span>
        </div>
        <Progress value={skill.overallProgress} className="h-1.5" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Layers className="h-3 w-3" />
          {skill.totalSteps} Levels
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />~{hours}h
        </span>
        {hasCertificate(skill) && (
          <span className="inline-flex items-center gap-1">
            <Award className="h-3 w-3" />
            Certificate
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
        <button
          type="button"
          className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
          onClick={handleView}
        >
          View Course
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        <div className="relative" ref={menuRef}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="More options"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            onBlur={(e) => {
              if (!menuRef.current?.contains(e.relatedTarget as Node)) {
                setMenuOpen(false);
              }
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          {menuOpen && (
            <div
              className="absolute bottom-full right-0 z-10 mb-1 min-w-[160px] rounded-md border bg-popover p-1 shadow-md"
              role="menu"
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full rounded-sm px-2 py-1.5 text-left text-xs hover:bg-muted"
                onClick={() => {
                  setMenuOpen(false);
                  handleView();
                }}
              >
                View Course
              </button>
              {courseId && status === "not_started" && onStartCourse && (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full rounded-sm px-2 py-1.5 text-left text-xs hover:bg-muted"
                  onClick={() => {
                    setMenuOpen(false);
                    onStartCourse(skill.skillId, courseId);
                  }}
                >
                  Start Course
                </button>
              )}
              {courseId && status === "in_progress" && onContinueCourse && (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full rounded-sm px-2 py-1.5 text-left text-xs hover:bg-muted"
                  onClick={() => {
                    setMenuOpen(false);
                    onContinueCourse(skill.skillId);
                  }}
                >
                  Continue Learning
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export const CatalogCard = memo(CatalogCardInner);
