"use client";

import { useEffect, useState } from "react";
import { Info, Loader2 } from "lucide-react";
import { useOpenPathwayCourse, useRoadmapPathway } from "@/hooks/use-roadmap-pathway";
import type { RoadmapPathwayCourse } from "@/types/roadmap-pathway";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { CertificateUploadDialog } from "./certificate-upload-dialog";
import { PathwayCourseCurriculumDialog } from "./pathway-course-curriculum-dialog";
import { RoadmapPathwayCourseCard } from "./roadmap-pathway-course-card";

interface RoadmapPathwaySectionProps {
  focusCourse?: RoadmapPathwayCourse | null;
  onFocusHandled?: () => void;
}

export function RoadmapPathwaySection({ focusCourse, onFocusHandled }: RoadmapPathwaySectionProps) {
  const { data, isLoading, isError, error, refetch, isFetching } = useRoadmapPathway();
  const openCourse = useOpenPathwayCourse();
  const [uploadCourse, setUploadCourse] = useState<RoadmapPathwayCourse | null>(null);
  const [curriculumCourse, setCurriculumCourse] = useState<RoadmapPathwayCourse | null>(null);

  useEffect(() => {
    if (!focusCourse) return;
    setCurriculumCourse(focusCourse);
    onFocusHandled?.();
  }, [focusCourse, onFocusHandled]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading roadmap courses…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ApiErrorState
        error={error}
        title="Could not load roadmap courses"
        action="Load roadmap"
        resource="/api/learning/roadmap/pathway"
        onRetry={() => refetch()}
        isRetrying={isFetching}
      />
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[#111827]">Roadmap courses</h2>
        <p className="mt-1 text-[13px] text-[#6B7280]">
          {data.pathwayName} · {data.coursesTotal} courses · {data.coursesCompleted} completed ·{" "}
          {data.coursesInProgress} in progress
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.courses.map((course) => (
          <RoadmapPathwayCourseCard
            key={course.id}
            course={course}
            opening={openCourse.isPending}
            onOpenCourse={(item) => openCourse.mutate(item.slug)}
            onViewCurriculum={setCurriculumCourse}
            onUploadCert={setUploadCourse}
          />
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Study on your provider&apos;s platform, mark each level complete (Basic → Expert), pass
          one final assessment, then upload your verified certificate to reach 100%.
        </p>
      </div>

      <PathwayCourseCurriculumDialog
        course={curriculumCourse}
        open={Boolean(curriculumCourse)}
        onOpenChange={(open) => {
          if (!open) setCurriculumCourse(null);
        }}
      />

      <CertificateUploadDialog
        course={uploadCourse}
        open={Boolean(uploadCourse)}
        certificateUnlocked={uploadCourse?.certificateUnlocked}
        onOpenChange={(open) => {
          if (!open) setUploadCourse(null);
        }}
      />
    </section>
  );
}
