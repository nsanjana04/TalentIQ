"use client";

import type { RoadmapPathwayOverview } from "@/types/roadmap-pathway";
import { TechLogo } from "./figma/figma-tech-logos";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface PathwayOverviewDrawerProps {
  overview: RoadmapPathwayOverview | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PathwayOverviewDrawer({
  overview,
  open,
  onOpenChange,
}: PathwayOverviewDrawerProps) {
  if (!overview) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-2xl">
      <DialogContent className="max-h-[90vh] overflow-y-auto" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{overview.pathwayName}</DialogTitle>
          <DialogDescription>{overview.pathwayDescription}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-[#F8FAFC] px-4 py-3">
            <p className="text-xs text-[#6B7280]">Overall progress</p>
            <p className="text-xl font-bold text-[#111827]">{overview.overallProgressPercent}%</p>
          </div>
          <div className="rounded-lg border bg-[#F8FAFC] px-4 py-3">
            <p className="text-xs text-[#6B7280]">Courses</p>
            <p className="text-xl font-bold text-[#111827]">
              {overview.coursesCompleted}/{overview.coursesTotal} done
            </p>
          </div>
          <div className="rounded-lg border bg-[#F8FAFC] px-4 py-3">
            <p className="text-xs text-[#6B7280]">Est. study time</p>
            <p className="text-xl font-bold text-[#111827]">~{overview.totalEstimatedHours}h</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#111827]">Completion flow</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-[#6B7280]">
            <li>Study on the external provider (Udemy, etc.)</li>
            <li>Mark each level complete: Basic → Intermediate → Advanced → Expert</li>
            <li>Pass one final in-app assessment (70% required)</li>
            <li>Upload your verified provider certificate</li>
          </ol>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#111827]">Courses in this pathway</p>
          {overview.courses.map((course) => (
            <div
              key={course.slug}
              className="flex items-start gap-3 rounded-lg border border-[#E5E7EB] px-4 py-3"
            >
              <TechLogo type={course.logo} size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-[#111827]">{course.title}</p>
                  <Badge variant="outline" className="text-[10px]">
                    {course.provider}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    ~{course.estimatedHours}h
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-[#6B7280]">{course.description}</p>
                <p className="mt-1 text-xs text-[#2563EB]">{course.progress}% complete</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#6B7280]">
          Your last activity: {overview.lastActivityLabel} · Pathway updated{" "}
          {overview.lastUpdated}
        </p>
      </DialogContent>
    </Dialog>
  );
}
