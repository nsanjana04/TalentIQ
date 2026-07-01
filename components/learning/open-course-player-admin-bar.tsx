"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CheckCircle2,
  Pencil,
  Settings2,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  useAdminLearningMutations,
  useCompleteOpenCourse,
  useOpenCourseAssignments,
} from "@/hooks/use-learning-content";
import { OpenCourseAssignDialog } from "@/components/learning-admin/open-course-assign-dialog";
import { OpenCourseEditDialog } from "@/components/learning-admin/open-course-edit-dialog";
import type { OpenCourse } from "@/types/learning-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { OPEN_COURSE_CATEGORY_LABELS } from "@/lib/utils/learning-url";

type OpenCoursePlayerAdminBarProps = {
  course: OpenCourse;
  canMarkComplete: boolean;
  isCompleted: boolean;
  onUpdated?: () => void;
};

export function OpenCoursePlayerAdminBar({
  course,
  canMarkComplete,
  isCompleted,
  onUpdated,
}: OpenCoursePlayerAdminBarProps) {
  const router = useRouter();
  const complete = useCompleteOpenCourse();
  const mutations = useAdminLearningMutations();
  const { data: assignments } = useOpenCourseAssignments(course.id);

  const [assignOpen, setAssignOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${course.title}"? This removes the course from the library.`
    );
    if (!confirmed) return;

    await mutations.deleteOpenCourse.mutateAsync(course.id);
    router.push(`${ROUTES.LEARNING}?tab=learning-content`);
  }

  return (
    <>
      <Card className="border-amber-400/30 bg-amber-500/5">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
                <Settings2 className="h-4 w-4" />
                Admin controls
              </div>
              <p className="text-xs text-muted-foreground">
                Manage assignments, publishing, and course metadata for this lesson.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={`${ROUTES.LEARNING}?tab=learning-content`}>All open courses</Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{OPEN_COURSE_CATEGORY_LABELS[course.category]}</Badge>
            <Badge variant={course.isPublished ? "default" : "secondary"}>
              {course.isPublished ? "Published" : "Draft"}
            </Badge>
            {course.isMandatory && (
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300">Mandatory</Badge>
            )}
            <Badge variant="outline">
              {(course.assignmentCount ?? assignments?.length ?? 0)} assigned
            </Badge>
            {course.durationMinutes ? (
              <Badge variant="outline">{course.durationMinutes} min</Badge>
            ) : null}
          </div>

          <div className="rounded-md border bg-background/80 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Media URL: </span>
            <span className="break-all">{course.url}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => setAssignOpen(true)}>
              <UserPlus className="mr-1 h-4 w-4" />
              Assign
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit course
            </Button>
            {canMarkComplete && !isCompleted && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={complete.isPending}
                onClick={() =>
                  complete.mutate(course.id, {
                    onSuccess: () => onUpdated?.(),
                  })
                }
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                {complete.isPending ? "Saving…" : "Mark as complete"}
              </Button>
            )}
            {isCompleted && (
              <Badge className="self-center bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                Completed
              </Badge>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-destructive"
              disabled={mutations.deleteOpenCourse.isPending}
              onClick={handleDelete}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <OpenCourseAssignDialog
        course={course}
        open={assignOpen}
        onOpenChange={(next) => {
          setAssignOpen(next);
          if (!next) onUpdated?.();
        }}
      />

      <OpenCourseEditDialog
        course={course}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={onUpdated}
      />
    </>
  );
}
