"use client";

import { ExternalLink, Layers, Lock, Upload } from "lucide-react";
import type { RoadmapPathwayCourse } from "@/types/roadmap-pathway";
import {
  getPathwayCourseBadge,
  getPathwayCourseDisplayState,
} from "@/components/learning-roadmap/pathway-course-display";
import { TechLogo } from "./figma/figma-tech-logos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RoadmapPathwayCourseCardProps {
  course: RoadmapPathwayCourse;
  onOpenCourse: (course: RoadmapPathwayCourse) => void;
  onViewCurriculum: (course: RoadmapPathwayCourse) => void;
  onUploadCert: (course: RoadmapPathwayCourse) => void;
  opening?: boolean;
}

export function RoadmapPathwayCourseCard({
  course,
  onOpenCourse,
  onViewCurriculum,
  onUploadCert,
  opening,
}: RoadmapPathwayCourseCardProps) {
  const badge = getPathwayCourseBadge(course);
  const state = getPathwayCourseDisplayState(course);
  const certLocked = !course.certificateUnlocked;
  const certDone = course.certificateComplete;

  const assessmentLabel =
    course.allAssessmentsPassed
      ? "passed"
      : course.finalAssessmentStatus === "failed"
        ? `failed${course.lastAssessmentScorePercent ? ` (${course.lastAssessmentScorePercent}%)` : ""}`
        : course.finalAssessmentStatus === "available"
          ? "ready"
          : "pending";

  return (
    <article className="flex h-full flex-col rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-2">
        <TechLogo type={course.logo} size={40} />
        <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", badge.className)}>
          {badge.label}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="text-[10px] font-normal">
          {course.provider}
        </Badge>
        <Badge variant="outline" className="text-[10px] font-normal">
          ~{course.estimatedHours}h
        </Badge>
      </div>

      <button type="button" className="mt-3 text-left" onClick={() => onViewCurriculum(course)}>
        <h3 className="text-[15px] font-semibold leading-snug text-[#111827] hover:text-[#2563EB]">
          {course.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#6B7280]">{course.description}</p>
      </button>

      {course.nextLevelName && state !== "completed" && state !== "cert_pending" && (
        <p className="mt-2 text-xs font-medium text-[#2563EB]">Up next: {course.nextLevelName}</p>
      )}

      <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">
        Basic · Intermediate · Advanced · Expert
      </p>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs text-[#6B7280]">
          <span>Progress</span>
          <span className="font-semibold">{course.progress}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-[#E5E7EB]">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              course.certificateComplete ? "bg-emerald-500" : "bg-[#2563EB]"
            )}
            style={{ width: `${Math.max(course.progress, 0)}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-[#6B7280]">
          Final assessment: {assessmentLabel} · Content {course.levelsContentComplete}/
          {course.levelsContentTotal} levels
        </p>
      </div>

      <div className="mt-auto grid grid-cols-1 gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-center gap-1.5"
          onClick={() => onViewCurriculum(course)}
        >
          <Layers className="h-3.5 w-3.5" />
          View curriculum &amp; assessments
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-center gap-1.5"
            disabled={opening}
            onClick={() => onOpenCourse(course)}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open course
          </Button>
          <Button
            type="button"
            size="sm"
            className={cn(
              "w-full justify-center gap-1.5",
              certLocked || certDone
                ? "border border-[#E5E7EB] bg-[#F3F4F6] text-[#9CA3AF] hover:bg-[#F3F4F6]"
                : "bg-emerald-600 hover:bg-emerald-700"
            )}
            disabled={certLocked || certDone}
            title={
              certDone
                ? "Certificate already uploaded"
                : certLocked
                  ? "Pass the final assessment first"
                  : "Upload verified certificate"
            }
            onClick={() => onUploadCert(course)}
          >
            {certLocked || certDone ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Upload cert
          </Button>
        </div>
      </div>
    </article>
  );
}
