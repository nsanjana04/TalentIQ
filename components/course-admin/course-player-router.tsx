"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ExternalCoursePlayer } from "@/components/course-admin/external-course-player";
import { ModulePathwayPlayer } from "@/components/course-admin/module-pathway-player";
import { InternalCoursePlayer } from "@/components/course-admin/internal-course-player";
import { useCoursePlayer } from "@/hooks/use-course-learning";
import { isExternalCourse } from "@/constants/external-courses";
import { Card, CardContent } from "@/components/ui/card";

type CoursePlayerRouterProps = {
  courseId: string;
};

export function CoursePlayerRouter({ courseId }: CoursePlayerRouterProps) {
  const { data, isLoading, isError } = useCoursePlayer(courseId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading course…
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return <ExternalCoursePlayer courseId={courseId} />;
  }

  if (data.modules.length > 0) {
    return (
      <Suspense
        fallback={
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading course…
            </CardContent>
          </Card>
        }
      >
        <ModulePathwayPlayer courseId={courseId} />
      </Suspense>
    );
  }

  if (isExternalCourse(data.course.slug)) {
    return <ExternalCoursePlayer courseId={courseId} />;
  }

  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading course…
          </CardContent>
        </Card>
      }
    >
      <InternalCoursePlayer courseId={courseId} />
    </Suspense>
  );
}
