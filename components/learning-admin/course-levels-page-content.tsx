"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/enterprise/states";
import { AssignCourseLevelButton } from "@/components/learning-admin/assign-course-level-button";
import { AssignmentPolicyBanner } from "@/components/learning-admin/assignment-policy-banner";
import { CourseLevelsPanel } from "@/components/learning-admin/course-levels-panel";
import { useAdminLearningCourses } from "@/hooks/use-learning-admin";
import { ROUTES } from "@/constants/routes";

export function CourseLevelsPageContent({ courseId }: { courseId: string }) {
  const { data, isLoading } = useAdminLearningCourses({ page: 1, pageSize: 100 });
  const course = data?.items.find((c) => c.id === courseId);

  if (isLoading) return <LoadingState rows={4} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 gap-1">
            <Link href={ROUTES.ADMIN_LEARNING_COURSES}>
              <ArrowLeft className="h-4 w-4" />
              Back to courses
            </Link>
          </Button>
          <h2 className="text-lg font-semibold">{course?.title ?? "Course levels"}</h2>
          <p className="text-sm text-muted-foreground">
            Select a level below to assign it to a user, department, team, role, or the organization.
          </p>
        </div>
        <AssignCourseLevelButton courseId={courseId} />
      </div>

      <AssignmentPolicyBanner compact />
      <CourseLevelsPanel courseId={courseId} />
    </div>
  );
}
