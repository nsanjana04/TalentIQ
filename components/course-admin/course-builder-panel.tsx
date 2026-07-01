"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  FileText,
  Film,
  Loader2,
  PenLine,
  Plus,
  Trash2,
} from "lucide-react";
import type { CourseDetail, LessonType } from "@/types/course-admin";
import {
  useCourseAdminMutations,
  useCourseMeta,
} from "@/hooks/use-course-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { cn } from "@/lib/utils";

const LESSON_TYPES: { value: LessonType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "VIDEO", label: "Video", icon: Film },
  { value: "PDF", label: "PDF", icon: FileText },
  { value: "QUIZ", label: "Quiz", icon: ClipboardCheck },
  { value: "ASSIGNMENT", label: "Assignment", icon: PenLine },
];

const TYPE_COLORS: Record<LessonType, string> = {
  VIDEO: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  PDF: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  QUIZ: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  ASSIGNMENT: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

export function CourseBuilderPanel({
  course,
  isLoading,
}: {
  course: CourseDetail | undefined;
  isLoading?: boolean;
}) {
  const { data: meta } = useCourseMeta();
  const mutations = useCourseAdminMutations();
  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonForms, setLessonForms] = useState<Record<string, { title: string; type: LessonType }>>({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading course structure…
      </div>
    );
  }

  if (!course) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Select a course to manage modules and lessons.
      </p>
    );
  }

  async function handleAddModule() {
    if (!moduleTitle.trim()) return;
    await mutations.createModule.mutateAsync({
      courseId: course!.id,
      data: { title: moduleTitle.trim() },
    });
    setModuleTitle("");
  }

  async function handleAddLesson(moduleId: string) {
    const form = lessonForms[moduleId];
    if (!form?.title.trim()) return;
    await mutations.createLesson.mutateAsync({
      moduleId,
      data: { title: form.title.trim(), type: form.type },
    });
    setLessonForms((prev) => ({ ...prev, [moduleId]: { title: "", type: "VIDEO" } }));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <PermissionGate elementId="courses.manage.button">
          <Input
            placeholder="New module title"
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
            className="max-w-xs"
          />
          <Button
            size="sm"
            onClick={handleAddModule}
            disabled={mutations.createModule.isPending}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Module
          </Button>
        </PermissionGate>
      </div>

      {course.modules.length === 0 ? (
        <p className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
          No modules yet. Add your first module to start building the course.
        </p>
      ) : (
        course.modules.map((module, mi) => (
          <div key={module.id} className="rounded-xl border bg-card/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">
                  Module {mi + 1}: {module.title}
                </h3>
                {module.assessmentId && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <ClipboardCheck className="h-3 w-3" />
                    Module quiz · {module.questionCount} Q
                  </Badge>
                )}
              </div>
              <PermissionGate elementId="courses.manage.button">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => mutations.deleteModule.mutate(module.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </PermissionGate>
            </div>

            <div className="mt-3 space-y-2">
              {module.lessons.map((lesson) => {
                const TypeIcon = LESSON_TYPES.find((t) => t.value === lesson.type)?.icon ?? Film;
                return (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{lesson.title}</span>
                      <Badge className={cn("text-[10px]", TYPE_COLORS[lesson.type])}>
                        {lesson.type}
                      </Badge>
                      {lesson.durationMinutes && (
                        <span className="text-xs text-muted-foreground">
                          {lesson.durationMinutes} min
                        </span>
                      )}
                    </div>
                    <PermissionGate elementId="courses.manage.button">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={() => mutations.deleteLesson.mutate(lesson.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </PermissionGate>
                  </div>
                );
              })}
            </div>

            <PermissionGate elementId="courses.manage.button">
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                <Input
                  placeholder="Lesson title"
                  value={lessonForms[module.id]?.title ?? ""}
                  onChange={(e) =>
                    setLessonForms((prev) => ({
                      ...prev,
                      [module.id]: {
                        title: e.target.value,
                        type: prev[module.id]?.type ?? "VIDEO",
                      },
                    }))
                  }
                  className="max-w-[12rem]"
                />
                <Select
                  value={lessonForms[module.id]?.type ?? "VIDEO"}
                  onChange={(e) =>
                    setLessonForms((prev) => ({
                      ...prev,
                      [module.id]: {
                        title: prev[module.id]?.title ?? "",
                        type: e.target.value as LessonType,
                      },
                    }))
                  }
                  className="w-36"
                >
                  {LESSON_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddLesson(module.id)}
                  disabled={mutations.createLesson.isPending}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Lesson
                </Button>
              </div>
            </PermissionGate>
          </div>
        ))
      )}

      {meta && course.modules.some((m) => m.lessons.some((l) => l.type === "QUIZ")) && (
        <p className="text-xs text-muted-foreground">
          Quiz lessons can be linked to assessments via the skills admin or by editing lesson
          details in a future release.
        </p>
      )}
    </div>
  );
}
