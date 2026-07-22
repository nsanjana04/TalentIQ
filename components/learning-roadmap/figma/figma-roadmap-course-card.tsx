"use client";

import Link from "next/link";
import { ChevronRight, Layers, UserPlus } from "lucide-react";
import type { FigmaRoadmapCourse } from "./figma-roadmap-data";
import { TechLogo } from "./figma-tech-logos";

interface FigmaRoadmapCourseCardProps {
  course: FigmaRoadmapCourse;
  canAssign?: boolean;
  onAssign?: (course: FigmaRoadmapCourse) => void;
}

export function FigmaRoadmapCourseCard({ course, canAssign, onAssign }: FigmaRoadmapCourseCardProps) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-2">
        <TechLogo type={course.logo} size={40} />
        {course.status === "in_progress" && (
          <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[11px] font-semibold text-[#16A34A]">
            In Progress
          </span>
        )}
      </div>

      <h3 className="mt-3 text-[15px] font-semibold leading-snug text-[#111827]">{course.title}</h3>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#6B7280]">{course.description}</p>

      <div className="mt-3 flex items-center gap-1.5 text-[#6B7280]">
        <Layers className="h-3.5 w-3.5" />
        <span className="text-xs">4 Levels</span>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs text-[#6B7280]">
          <span>Progress</span>
          <span className="font-semibold">{course.progress}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-[#E5E7EB]">
          <div
            className="h-full rounded-full bg-[#2563EB] transition-all"
            style={{ width: `${Math.max(course.progress, 0)}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href={`/course/${course.slug}`}
          className="inline-flex items-center gap-0.5 text-xs font-medium text-[#2563EB] hover:underline"
        >
          View Course
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
        {canAssign && onAssign && (
          <button
            type="button"
            onClick={() => onAssign(course)}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#374151] hover:text-[#2563EB]"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Assign course
          </button>
        )}
      </div>
    </article>
  );
}
